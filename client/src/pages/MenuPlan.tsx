import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChefHat,
  Clock,
  CookingPot,
  Loader2,
  Pencil,
  Plus,
  Printer,
  Search,
  ShoppingBasket,
  ShoppingCart,
  Users,
  UtensilsCrossed,
  Wand2,
  X,
} from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import ShoppingTargetSelect, {
  useShoppingTarget,
} from "@/components/ShoppingTargetSelect";
import LoginPrompt from "@/components/LoginPrompt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import ServingsStepper from "@/components/ServingsStepper";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { loadMenuPersons, storeMenuPersons } from "@/lib/menuPersons";
import { recipes } from "@/data/recipes";
import {
  normalizeMethod,
  parseStringList,
  RECIPE_METHOD_LABELS,
} from "@shared/customRecipes";
import { LOCALE_TAGS, pick } from "@shared/i18n";
import { clampServings, scaleIngredientsForServings } from "@shared/servings";
import { summarizeIngredients } from "@shared/groceryList";
import {
  autofillMenuPlan,
  MEALS,
  MEAL_LABELS,
  tripDays,
  type AutofillRecipe,
  type Meal,
} from "@shared/menuPlan";

/** Slot, für den gerade der Auswahl-Dialog offen ist. */
interface PickerSlot {
  day: string;
  meal: Meal;
}

/**
 * Rezept-Vorschau (#182): das zugewiesene Rezept in der aktiven Sprache,
 * bereits aufgelöst – egal ob eingebautes oder eigenes Rezept.
 */
interface RecipePreview {
  name: string;
  timeMinutes: number;
  servings: number;
  /** Anzeigetext der Zubereitungsart (bereits gepickt) */
  methodLabel: string;
  own: boolean;
  /** Zutaten in der aktiven Sprache, bereits auf `scaledTo` umgerechnet */
  ingredients: string[];
  /** Personenzahl, auf die umgerechnet wurde; null = wie im Rezept */
  scaledTo: number | null;
  steps: string[];
  tip: string | null;
}

/**
 * Frühstückstaugliche eingebaute Rezepte: das Rezeptbuch kennt keine
 * Frühstücks-Kategorie, deshalb ordnet der Client per Id zu.
 */
const BREAKFAST_RECIPE_IDS = new Set([
  "porridge",
  "eier-broetli",
  "birchermuesli-overnight",
  "camping-pancakes",
  "fotzelschnitten",
]);

/** Beilagen und Desserts – als automatische Hauptmahlzeit ungeeignet. */
const AUTOFILL_EXCLUDED_IDS = new Set([
  "schlangenbrot",
  "bananen-schoggi",
  "apfel-zimt-glut",
  "maiskolben-glut",
  "grill-ananas",
]);

/** Präfix, unter dem eigene Rezepte in die Autofill-Rotation wandern. */
const CUSTOM_PREFIX = "custom-";

/**
 * Menüplan pro Trip: Tage des Aufenthalts als Raster mit vier
 * Mahlzeiten-Slots; pro Slot ein Rezept aus dem Rezeptbuch (statisch oder
 * eigenes) oder Freitext. Brücke zur Einkaufsliste über shopping.addMany.
 */
export default function MenuPlanPage() {
  const params = useParams<{ tripId: string }>();
  const tripId = Number(params.tripId);
  const { lang, t } = useI18n();
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const menuQuery = trpc.menu.listByTrip.useQuery(
    { tripId },
    { enabled: isAuthenticated && Number.isInteger(tripId) && tripId > 0 }
  );
  const customQuery = trpc.recipes.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const spotsQuery = trpc.spots.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  // Mitreisende der Reise: bei geteilten Reisen (Owner + mind. 1 Mitglied)
  // fragt die Zutaten-Brücke, auf WELCHE Einkaufsliste die Zutaten sollen
  const membersQuery = trpc.trips.members.list.useQuery(
    { tripId },
    { enabled: Boolean(menuQuery.data?.trip), retry: false }
  );
  const isSharedTrip = (membersQuery.data?.members.length ?? 0) > 1;
  /**
   * Vorschlag beim Einschalten der Umrechnung: bei gemeinsamen Reisen die
   * Zahl der Mitreisenden, sonst die übliche Rezept-Grundzahl 4.
   */
  const defaultPersons = isSharedTrip
    ? clampServings(membersQuery.data?.members.length ?? 4)
    : 4;

  const [picker, setPicker] = useState<PickerSlot | null>(null);
  /** Offene Rezept-Vorschau (null = zu). */
  const [preview, setPreview] = useState<RecipePreview | null>(null);
  const [search, setSearch] = useState("");
  const [freeText, setFreeText] = useState("");
  /** Tages-Notiz-Editor: Tag + aktueller Eingabewert (null = zu). */
  const [noteEditor, setNoteEditor] = useState<{
    day: string;
    value: string;
  } | null>(null);
  /** Auswahl «Persönliche Liste / Reise-Liste» offen (nur geteilte Reisen). */
  const [listChoiceOpen, setListChoiceOpen] = useState(false);
  /**
   * Personenzahl fürs Umrechnen der Mengen (#231); null = wie im Rezept.
   * Pro Reise und Gerät gemerkt – sie wirkt auf die Zutaten-Vorschau und auf
   * die Übernahme auf die Einkaufsliste.
   */
  const [persons, setPersons] = useState<number | null>(() =>
    Number.isInteger(tripId) ? loadMenuPersons(tripId) : null
  );
  const changePersons = (next: number | null) => {
    setPersons(next);
    if (Number.isInteger(tripId)) storeMenuPersons(tripId, next);
  };

  const closePicker = () => {
    setPicker(null);
    setSearch("");
    setFreeText("");
  };

  const setMutation = trpc.menu.set.useMutation({
    onSuccess: () => {
      utils.menu.listByTrip.invalidate({ tripId });
      toast.success(t.menuPlan.saved);
      closePicker();
    },
    onError: e => toast.error(e.message || t.common.saveFailed),
  });
  const removeMutation = trpc.menu.remove.useMutation({
    onSuccess: () => utils.menu.listByTrip.invalidate({ tripId }),
    onError: () => toast.error(t.common.deleteFailed),
  });
  // Tages-Notiz speichern/löschen – leerer Text löscht serverseitig
  const setDayNoteMutation = trpc.menu.setDayNote.useMutation({
    onSuccess: (_data, variables) => {
      utils.menu.listByTrip.invalidate({ tripId });
      toast.success(
        variables.note?.trim()
          ? t.menuPlan.dayNoteSaved
          : t.menuPlan.dayNoteRemoved
      );
      setNoteEditor(null);
    },
    onError: e => toast.error(e.message || t.common.saveFailed),
  });
  // Autofill nutzt eigene Mutations-Instanzen ohne Dialog-Nebenwirkungen
  const autofillSetMutation = trpc.menu.set.useMutation();
  const autofillRemoveMutation = trpc.menu.remove.useMutation();
  const [autofillBusy, setAutofillBusy] = useState(false);
  // Ziel-Liste der persönlichen Übernahme (#215)
  const shoppingTarget = useShoppingTarget(isAuthenticated);
  const addToShoppingMutation = trpc.shopping.addMany.useMutation({
    onSuccess: (result, variables) => {
      utils.shopping.list.invalidate();
      utils.shopping.lists.invalidate();
      const listName = shoppingTarget.lists.find(
        l => l.id === variables.listId
      )?.name;
      toast.success(
        shoppingTarget.lists.length > 1 && listName
          ? t.shopping.addedFromRecipeToList(result.added, listName)
          : t.shopping.addedFromRecipe(result.added),
        {
          action: {
            label: t.shopping.openList,
            onClick: () => navigate("/einkauf"),
          },
        }
      );
    },
    onError: () => toast.error(t.shopping.addFailed),
  });
  const addToTripShoppingMutation = trpc.tripShopping.addMany.useMutation({
    onSuccess: result => {
      utils.tripShopping.listByTrip.invalidate({ tripId });
      toast.success(t.tripShopping.addedFromMenu(result.added), {
        action: {
          label: t.tripShopping.openList,
          onClick: () => navigate(`/menueplan/${tripId}/einkauf`),
        },
      });
    },
    onError: () => toast.error(t.shopping.addFailed),
  });

  const trip = menuQuery.data?.trip ?? null;
  const entries = useMemo(
    () => menuQuery.data?.entries ?? [],
    [menuQuery.data]
  );
  const days = useMemo(
    () => (trip ? tripDays(trip.startDate, trip.endDate) : []),
    [trip]
  );

  /** Statische Rezepte nach Id, eigene Rezepte nach Server-Id. */
  const staticById = useMemo(() => {
    const map = new Map<string, (typeof recipes)[number]>();
    recipes.forEach(r => map.set(r.id, r));
    return map;
  }, []);
  const customRows = useMemo(() => customQuery.data ?? [], [customQuery.data]);
  const customById = useMemo(() => {
    const map = new Map<number, (typeof customRows)[number]>();
    customRows.forEach(r => map.set(r.id, r));
    return map;
  }, [customRows]);

  const entryFor = (day: string, meal: Meal) =>
    entries.find(e => e.day === day && e.meal === meal);

  /** Tages-Notiz eines Tages (undefined = keine). */
  const dayNotes = menuQuery.data?.dayNotes ?? [];
  const noteFor = (day: string) => dayNotes.find(n => n.day === day)?.note;

  /** Anzeigetitel eines Slots in der aktiven Sprache. */
  const entryTitle = (entry: NonNullable<ReturnType<typeof entryFor>>) => {
    if (entry.recipeId) {
      const recipe = staticById.get(entry.recipeId);
      return recipe ? pick(recipe.name, lang) : entry.recipeId;
    }
    if (entry.customRecipeId != null) {
      return customById.get(entry.customRecipeId)?.name ?? "–";
    }
    return entry.freeText ?? "–";
  };

  /**
   * Zutaten-Zeilen eines Rezepts auf die eingestellte Personenzahl umrechnen
   * (#231). Ohne eingestellte Zahl bleiben sie Zeichen für Zeichen gleich.
   */
  const scaleForPersons = (
    lines: string[],
    recipeServings: number
  ): string[] =>
    persons === null
      ? lines
      : scaleIngredientsForServings(
          lines,
          clampServings(recipeServings),
          persons,
          lang
        );

  /**
   * Das Rezept eines Slots für die Vorschau auflösen – eingebaute Rezepte über
   * pick(), eigene über die JSON-Spalten. Freitext-Slots und Rezepte, die es
   * nicht (mehr) gibt, liefern null: dort bleibt die Zeile wie bisher.
   */
  const previewFor = (
    entry: NonNullable<ReturnType<typeof entryFor>>
  ): RecipePreview | null => {
    if (entry.recipeId) {
      const recipe = staticById.get(entry.recipeId);
      if (!recipe) return null;
      return {
        name: pick(recipe.name, lang),
        timeMinutes: recipe.timeMinutes,
        servings: recipe.servings,
        methodLabel: pick(RECIPE_METHOD_LABELS[recipe.method], lang),
        own: false,
        ingredients: scaleForPersons(
          recipe.ingredients.map(i => pick(i, lang)),
          recipe.servings
        ),
        scaledTo: persons,
        steps: recipe.steps.map(s => pick(s, lang)),
        tip: recipe.tip ? pick(recipe.tip, lang) : null,
      };
    }
    if (entry.customRecipeId != null) {
      const row = customById.get(entry.customRecipeId);
      if (!row) return null;
      return {
        name: row.name,
        timeMinutes: row.timeMinutes,
        servings: row.servings,
        methodLabel: pick(
          RECIPE_METHOD_LABELS[normalizeMethod(row.method)],
          lang
        ),
        own: true,
        ingredients: scaleForPersons(
          parseStringList(row.ingredientsJson),
          row.servings
        ),
        scaledTo: persons,
        steps: parseStringList(row.stepsJson, 20),
        tip: row.tip,
      };
    }
    return null;
  };

  const formatDay = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(LOCALE_TAGS[lang], {
      weekday: "long",
      day: "numeric",
      month: "short",
    });

  /** Zeitpunkt der letzten Änderung fürs «von <Name>»-Tooltip. */
  const formatEditedAt = (value: Date | string) =>
    new Date(value).toLocaleString(LOCALE_TAGS[lang], {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  /** Rezept-Auswahl im Dialog: eigene Rezepte zuoberst, dann eingebaute. */
  const pickerRecipes = useMemo(() => {
    const q = search.trim().toLowerCase();
    const own = customRows
      .filter(r => !q || r.name.toLowerCase().includes(q))
      .map(r => ({
        key: `custom-${r.id}`,
        title: r.name,
        timeMinutes: r.timeMinutes,
        own: true,
        select: { customRecipeId: r.id },
      }));
    const builtIn = recipes
      .filter(r => !q || pick(r.name, lang).toLowerCase().includes(q))
      .map(r => ({
        key: r.id,
        title: pick(r.name, lang),
        timeMinutes: r.timeMinutes,
        own: false,
        select: { recipeId: r.id },
      }));
    return [...own, ...builtIn];
  }, [customRows, search, lang]);

  /**
   * Alle Zutaten der zugewiesenen Rezepte, Duplikate zusammengefasst –
   * mit Rezept-Herkunft als Notiz («aus: Älplermagronen»; bei von
   * summarizeIngredients umgeschriebenen Zeilen entfällt die Herkunft).
   */
  const plannedIngredients = useMemo(() => {
    const lines: string[] = [];
    const originByLine = new Map<string, string>();
    /** Zutaten eines Rezepts – auf die Personenzahl umgerechnet (#231). */
    const push = (
      recipeLines: string[],
      recipeServings: number,
      recipeTitle: string
    ) => {
      const scaled =
        persons === null
          ? recipeLines
          : scaleIngredientsForServings(
              recipeLines,
              clampServings(recipeServings),
              persons,
              lang
            );
      scaled.forEach(line => {
        lines.push(line);
        if (!originByLine.has(line)) originByLine.set(line, recipeTitle);
      });
    };
    entries.forEach(entry => {
      if (entry.recipeId) {
        const recipe = staticById.get(entry.recipeId);
        if (recipe) {
          push(
            recipe.ingredients.map(i => pick(i, lang)),
            recipe.servings,
            pick(recipe.name, lang)
          );
        }
      } else if (entry.customRecipeId != null) {
        const row = customById.get(entry.customRecipeId);
        if (row) {
          push(parseStringList(row.ingredientsJson), row.servings, row.name);
        }
      }
    });
    // Mengengerecht zusammenrechnen (#288): «2 dl Rahm» am Montag und
    // «1 dl Rahm» am Donnerstag sind drei Deziliter und nicht zwei.
    return summarizeIngredients(lines, lang).map(item => {
      // Herkunft nur, wo die Zeile unverändert aus EINEM Rezept stammt –
      // bei einer Summe aus mehreren Tagen wäre «aus: Älplermagronen»
      // schlicht falsch
      const origin = item.summed ? undefined : originByLine.get(item.line);
      const note = item.summed
        ? t.menuPlan.summedFrom(item.sources)
        : origin
          ? t.shopping.fromRecipe(origin)
          : undefined;
      return {
        name: item.line.slice(0, 160),
        note: note?.slice(0, 160),
      };
    });
  }, [entries, staticById, customById, lang, t, persons]);

  /** Rezept-Vorrat fürs automatische Füllen: eingebaute + eigene Rezepte. */
  const autofillRecipes = useMemo<AutofillRecipe[]>(() => {
    const builtIn = recipes
      .filter(r => !AUTOFILL_EXCLUDED_IDS.has(r.id))
      .map(r => ({
        id: r.id,
        kind: BREAKFAST_RECIPE_IDS.has(r.id)
          ? ("breakfast" as const)
          : ("main" as const),
      }));
    const own = customRows.map(r => ({
      id: `${CUSTOM_PREFIX}${r.id}`,
      kind: "main" as const,
    }));
    return [...builtIn, ...own];
  }, [customRows]);

  /** Die soeben automatisch gesetzten Slots wieder leeren (Toast-Aktion). */
  const undoAutofill = async (slots: { day: string; meal: Meal }[]) => {
    try {
      await Promise.all(
        slots.map(slot =>
          autofillRemoveMutation.mutateAsync({
            tripId,
            day: slot.day,
            meal: slot.meal,
          })
        )
      );
      toast.success(t.menuPlan.autofillUndone);
    } catch {
      toast.error(t.common.deleteFailed);
    } finally {
      utils.menu.listByTrip.invalidate({ tripId });
    }
  };

  /**
   * Leere Slots automatisch füllen: deterministisch über die Trip-Id,
   * Snacks bleiben aussen vor. Der Erfolgs-Toast bietet «Rückgängig» an,
   * das nur die soeben gesetzten Einträge wieder entfernt.
   */
  const runAutofill = async () => {
    const assignments = autofillMenuPlan({
      days,
      meals: ["breakfast", "lunch", "dinner"],
      existing: entries.map(e => ({
        day: e.day,
        meal: e.meal,
        recipeId: e.recipeId,
      })),
      recipes: autofillRecipes,
      seed: tripId,
    });
    if (assignments.length === 0) {
      toast.info(t.menuPlan.autofillNothing);
      return;
    }
    setAutofillBusy(true);
    try {
      await Promise.all(
        assignments.map(a =>
          autofillSetMutation.mutateAsync({
            tripId,
            day: a.day,
            meal: a.meal,
            ...(a.recipeId.startsWith(CUSTOM_PREFIX)
              ? {
                  customRecipeId: Number(
                    a.recipeId.slice(CUSTOM_PREFIX.length)
                  ),
                }
              : { recipeId: a.recipeId }),
          })
        )
      );
      toast.success(t.menuPlan.autofillDone(assignments.length), {
        duration: 10000,
        action: {
          label: t.menuPlan.autofillUndo,
          onClick: () =>
            undoAutofill(assignments.map(a => ({ day: a.day, meal: a.meal }))),
        },
      });
    } catch {
      toast.error(t.menuPlan.autofillFailed);
    } finally {
      setAutofillBusy(false);
      utils.menu.listByTrip.invalidate({ tripId });
    }
  };

  /**
   * Zutaten-Brücke: Bei geteilten Reisen fragt ein kleiner Dialog, ob die
   * Zutaten auf die gemeinsame Reise-Liste (Standard) oder die persönliche
   * Einkaufsliste sollen; bei privaten Reisen geht es ohne Nachfrage auf
   * die persönliche Liste (Verhalten wie bisher).
   */
  const addIngredientsToList = () => {
    if (plannedIngredients.length === 0) {
      toast.error(t.menuPlan.noPlannedRecipes);
      return;
    }
    if (isSharedTrip) {
      setListChoiceOpen(true);
      return;
    }
    addToShoppingMutation.mutate({
      listId: shoppingTarget.listId ?? undefined,
      names: plannedIngredients,
    });
  };

  if (loading || (isAuthenticated && menuQuery.isLoading)) {
    return (
      <div className="container flex justify-center py-16">
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          aria-label={t.common.loading}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-6">
        <PageHeader title={t.menuPlan.title} subtitle={t.menuPlan.subtitle} />
        <LoginPrompt feature={t.menuPlan.loginFeature} />
      </div>
    );
  }

  // Trip existiert nicht oder gehört nicht zu diesem Konto
  if (!trip) {
    return (
      <div className="container max-w-2xl py-6">
        <PageHeader title={t.menuPlan.title} subtitle={t.menuPlan.subtitle} />
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <UtensilsCrossed
            className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50"
            aria-hidden="true"
          />
          <p className="font-medium">{t.menuPlan.notFoundTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.menuPlan.notFoundText}
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/tagebuch">
              <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.menuPlan.backToTrips}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const spotName =
    trip.spotId != null
      ? (spotsQuery.data ?? []).find(s => s.id === trip.spotId)?.name
      : undefined;
  const tripName =
    trip.title || spotName || trip.location || t.trips.unknownPlace;

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader title={t.menuPlan.title} subtitle={t.menuPlan.subtitle} />

      {/* Trip-Kopf */}
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
        <span className="font-semibold">{tripName}</span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
          {formatDay(trip.startDate)} – {formatDay(trip.endDate)}
        </span>
        <span className="text-muted-foreground">
          {t.menuPlan.daysCount(days.length)}
        </span>
        <Button asChild variant="ghost" size="sm" className="ml-auto">
          <Link href="/tagebuch">
            <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {t.menuPlan.backToTrips}
          </Link>
        </Button>
      </div>

      {/* Automatisch füllen, Brücke zur Einkaufsliste & Druckansicht */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={autofillBusy}
          onClick={runAutofill}
        >
          {autofillBusy ? (
            <Loader2
              className="mr-1.5 h-4 w-4 animate-spin"
              aria-hidden="true"
            />
          ) : (
            <Wand2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
          )}
          {t.menuPlan.autofillButton}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={
            addToShoppingMutation.isPending ||
            addToTripShoppingMutation.isPending
          }
          onClick={addIngredientsToList}
        >
          <ShoppingCart className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {t.menuPlan.addIngredients}
        </Button>
        <ShoppingTargetSelect target={shoppingTarget} className="w-44" />
        <Button asChild variant="outline" size="sm">
          <Link
            href={`/menueplan/${tripId}/einkauf`}
            aria-label={t.tripShopping.openAria(tripName)}
          >
            <ShoppingBasket className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {t.tripShopping.openButton}
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/menueplan/${tripId}/drucken`}>
            <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {t.menuPlan.printButton}
          </Link>
        </Button>
      </div>

      {/* Mengen auf eine Personenzahl umrechnen (#231) */}
      <div className="mb-6 rounded-xl border border-border bg-card px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <Users className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.servings.menuTitle}
          </span>
          <Switch
            checked={persons !== null}
            aria-label={t.servings.menuToggleAria}
            onCheckedChange={on => changePersons(on ? defaultPersons : null)}
          />
          {persons === null ? (
            <span className="text-sm text-muted-foreground">
              {t.servings.menuOff}
            </span>
          ) : (
            <ServingsStepper
              value={persons}
              onChange={next => changePersons(next)}
            />
          )}
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {t.servings.menuHint}
        </p>
      </div>

      {/* Tage-Raster */}
      <div className="space-y-4">
        {days.map(day => (
          <section
            key={day}
            className="overflow-hidden rounded-xl border border-border"
          >
            <div className="border-b border-border bg-muted/50 px-4 py-2">
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-sm font-semibold capitalize">
                  {formatDay(day)}
                </h2>
                {/* Dezenter Stift: Tages-Notiz («Pizzeria-Abend») bearbeiten */}
                <button
                  type="button"
                  onClick={() =>
                    setNoteEditor({ day, value: noteFor(day) ?? "" })
                  }
                  aria-label={t.menuPlan.dayNoteAria(formatDay(day))}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
              {noteFor(day) && (
                <p className="mt-0.5 break-words text-xs italic text-muted-foreground">
                  {noteFor(day)}
                </p>
              )}
            </div>
            <ul className="divide-y divide-border/60">
              {MEALS.map(meal => {
                const entry = entryFor(day, meal);
                const mealLabel = pick(MEAL_LABELS[meal], lang);
                // Nur zugewiesene Rezepte lassen sich vorab ansehen –
                // Freitext-Slots bleiben unverändert.
                const slotPreview = entry ? previewFor(entry) : null;
                return (
                  <li
                    key={meal}
                    className="flex items-center gap-3 bg-card px-4 py-2.5"
                  >
                    <span className="w-28 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {mealLabel}
                    </span>
                    {entry ? (
                      <>
                        <span className="min-w-0 flex-1 break-words text-sm font-medium">
                          {slotPreview ? (
                            <button
                              type="button"
                              className="rounded text-left underline-offset-4 transition-colors hover:text-primary hover:underline"
                              onClick={() => setPreview(slotPreview)}
                              aria-label={t.menuPlan.previewAria(
                                slotPreview.name
                              )}
                            >
                              {entryTitle(entry)}
                            </button>
                          ) : (
                            entryTitle(entry)
                          )}
                          {entry.customRecipeId != null && (
                            <Badge className="ml-1.5 gap-1 border-0 bg-primary/15 align-middle text-primary">
                              <ChefHat className="h-3 w-3" aria-hidden="true" />
                              {t.menuPlan.ownBadge}
                            </Badge>
                          )}
                          {/* «von <Name>» nur bei geteilten Reisen */}
                          {isSharedTrip && entry.updatedByName && (
                            <span
                              className="ml-1.5 text-xs font-normal text-muted-foreground"
                              title={t.menuPlan.editedByTitle(
                                entry.updatedByName,
                                formatEditedAt(entry.updatedAt)
                              )}
                            >
                              {t.menuPlan.editedBy(entry.updatedByName)}
                            </span>
                          )}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground/60 hover:text-destructive"
                          onClick={() =>
                            removeMutation.mutate({ tripId, day, meal })
                          }
                          aria-label={t.menuPlan.clearSlotAria(
                            mealLabel,
                            formatDay(day)
                          )}
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-2 py-1 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        onClick={() => setPicker({ day, meal })}
                        aria-label={t.menuPlan.planSlotAria(
                          mealLabel,
                          formatDay(day)
                        )}
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        {t.menuPlan.slotEmpty}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {/* Auswahl-Dialog: Rezept oder Freitext */}
      <Dialog
        open={picker !== null}
        onOpenChange={open => !open && closePicker()}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {picker && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">
                  {t.menuPlan.dialogTitle(pick(MEAL_LABELS[picker.meal], lang))}
                  {" · "}
                  <span className="capitalize">{formatDay(picker.day)}</span>
                </DialogTitle>
                <DialogDescription>
                  {t.menuPlan.dialogDescription}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    className="pl-9"
                    placeholder={t.menuPlan.searchPlaceholder}
                    aria-label={t.menuPlan.searchAria}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                {pickerRecipes.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    {t.menuPlan.noRecipesFound}
                  </p>
                ) : (
                  <ul className="max-h-64 space-y-1 overflow-y-auto pr-1">
                    {pickerRecipes.map(recipe => (
                      <li key={recipe.key}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-left text-sm transition-colors hover:border-primary/40 hover:bg-accent/50"
                          disabled={setMutation.isPending}
                          onClick={() =>
                            setMutation.mutate({
                              tripId,
                              day: picker.day,
                              meal: picker.meal,
                              ...recipe.select,
                            })
                          }
                          aria-label={t.menuPlan.chooseRecipeAria(recipe.title)}
                        >
                          <CookingPot
                            className="h-4 w-4 shrink-0 text-primary"
                            aria-hidden="true"
                          />
                          <span className="min-w-0 flex-1 truncate font-medium">
                            {recipe.title}
                          </span>
                          {recipe.own && (
                            <Badge className="gap-1 border-0 bg-primary/15 text-primary">
                              <ChefHat className="h-3 w-3" aria-hidden="true" />
                              {t.menuPlan.ownBadge}
                            </Badge>
                          )}
                          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            {t.menuPlan.minutes(recipe.timeMinutes)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div>
                  <Label htmlFor="menu-freetext">
                    {t.menuPlan.freeTextLabel}
                  </Label>
                  <div className="mt-1.5 flex gap-2">
                    <Input
                      id="menu-freetext"
                      maxLength={200}
                      placeholder={t.menuPlan.freeTextPlaceholder}
                      value={freeText}
                      onChange={e => setFreeText(e.target.value)}
                    />
                    <Button
                      disabled={!freeText.trim() || setMutation.isPending}
                      onClick={() =>
                        setMutation.mutate({
                          tripId,
                          day: picker.day,
                          meal: picker.meal,
                          freeText: freeText.trim(),
                        })
                      }
                    >
                      {t.menuPlan.freeTextSave}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Rezept-Vorschau: Zutaten und Zubereitung ohne die Seite zu verlassen */}
      <Dialog
        open={preview !== null}
        onOpenChange={open => !open && setPreview(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {preview && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">
                  {preview.name}
                </DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {t.menuPlan.minutes(preview.timeMinutes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    {t.menuPlan.previewServings(preview.servings)}
                    {preview.scaledTo !== null &&
                      ` · ${t.servings.menuScaledTo(preview.scaledTo)}`}
                  </span>
                  <span>{preview.methodLabel}</span>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {preview.own && (
                  <Badge className="gap-1 border-0 bg-primary/15 text-primary">
                    <ChefHat className="h-3 w-3" aria-hidden="true" />
                    {t.menuPlan.ownBadge}
                  </Badge>
                )}
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.menuPlan.previewIngredients}
                  </h3>
                  <ul className="grid grid-cols-2 gap-1 text-sm">
                    {preview.ingredients.map((ingredient, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                          aria-hidden="true"
                        />
                        {ingredient}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.menuPlan.previewSteps}
                  </h3>
                  <ol className="space-y-2.5">
                    {preview.steps.map((step, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          {idx + 1}
                        </span>
                        <p className="text-sm">{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>
                {preview.tip && (
                  <div className="rounded-lg bg-accent/60 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t.menuPlan.previewTip}
                    </p>
                    <p className="mt-1 text-sm">{preview.tip}</p>
                  </div>
                )}
                <Button asChild variant="outline" size="sm">
                  <Link href="/rezepte">
                    <CookingPot className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    {t.menuPlan.previewOpenInBook}
                  </Link>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Tages-Notiz bearbeiten: kurzer Freitext pro Tag, leer = löschen */}
      <Dialog
        open={noteEditor !== null}
        onOpenChange={open => !open && setNoteEditor(null)}
      >
        <DialogContent className="max-w-sm">
          {noteEditor && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">
                  {t.menuPlan.dayNoteTitle}
                  {" · "}
                  <span className="capitalize">
                    {formatDay(noteEditor.day)}
                  </span>
                </DialogTitle>
                <DialogDescription>
                  {t.menuPlan.dayNoteDescription}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="menu-day-note">
                    {t.menuPlan.dayNoteLabel}
                  </Label>
                  <Input
                    id="menu-day-note"
                    className="mt-1.5"
                    autoFocus
                    maxLength={200}
                    placeholder={t.menuPlan.dayNotePlaceholder}
                    value={noteEditor.value}
                    onChange={e =>
                      setNoteEditor({
                        day: noteEditor.day,
                        value: e.target.value,
                      })
                    }
                    onKeyDown={e => {
                      if (e.key === "Enter" && !setDayNoteMutation.isPending) {
                        setDayNoteMutation.mutate({
                          tripId,
                          day: noteEditor.day,
                          note: noteEditor.value.trim() || null,
                        });
                      }
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  {noteFor(noteEditor.day) && (
                    <Button
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      disabled={setDayNoteMutation.isPending}
                      onClick={() =>
                        setDayNoteMutation.mutate({
                          tripId,
                          day: noteEditor.day,
                          note: null,
                        })
                      }
                    >
                      {t.menuPlan.dayNoteRemove}
                    </Button>
                  )}
                  <Button
                    className="flex-1"
                    disabled={setDayNoteMutation.isPending}
                    onClick={() =>
                      setDayNoteMutation.mutate({
                        tripId,
                        day: noteEditor.day,
                        note: noteEditor.value.trim() || null,
                      })
                    }
                  >
                    {setDayNoteMutation.isPending
                      ? t.common.saving
                      : t.common.save}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Geteilte Reise: Zutaten auf die Reise-Liste (Standard) oder die persönliche */}
      <Dialog open={listChoiceOpen} onOpenChange={setListChoiceOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {t.tripShopping.chooseTitle}
            </DialogTitle>
            <DialogDescription>
              {t.tripShopping.chooseDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <button
              type="button"
              autoFocus
              className="flex w-full items-center gap-3 rounded-lg border border-primary/40 bg-accent/40 px-3 py-2.5 text-left transition-colors hover:bg-accent"
              onClick={() => {
                setListChoiceOpen(false);
                addToTripShoppingMutation.mutate({
                  tripId,
                  names: plannedIngredients,
                });
              }}
            >
              <ShoppingBasket
                className="h-5 w-5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">
                  {t.tripShopping.chooseTripList}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {t.tripShopping.chooseTripListHint}
                </span>
              </span>
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left transition-colors hover:bg-accent/50"
              onClick={() => {
                setListChoiceOpen(false);
                addToShoppingMutation.mutate({
                  listId: shoppingTarget.listId ?? undefined,
                  names: plannedIngredients,
                });
              }}
            >
              <ShoppingCart
                className="h-5 w-5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">
                  {t.tripShopping.choosePersonalList}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {t.tripShopping.choosePersonalListHint}
                </span>
              </span>
            </button>
            {/* Bei mehreren persönlichen Listen: Ziel-Liste wählen (#215) */}
            <ShoppingTargetSelect target={shoppingTarget} className="px-1" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
