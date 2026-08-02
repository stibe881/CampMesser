import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChefHat,
  Clock,
  CookingPot,
  Loader2,
  Plus,
  Printer,
  Search,
  ShoppingCart,
  UtensilsCrossed,
  Wand2,
  X,
} from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
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
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { recipes } from "@/data/recipes";
import { parseStringList } from "@shared/customRecipes";
import { LOCALE_TAGS, pick } from "@shared/i18n";
import {
  autofillMenuPlan,
  MEALS,
  MEAL_LABELS,
  mergeIngredientLines,
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
 * Frühstückstaugliche eingebaute Rezepte: das Rezeptbuch kennt keine
 * Frühstücks-Kategorie, deshalb ordnet der Client per Id zu.
 */
const BREAKFAST_RECIPE_IDS = new Set(["porridge", "eier-broetli"]);

/** Beilagen und Desserts – als automatische Hauptmahlzeit ungeeignet. */
const AUTOFILL_EXCLUDED_IDS = new Set([
  "schlangenbrot",
  "bananen-schoggi",
  "apfel-zimt-glut",
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

  const [picker, setPicker] = useState<PickerSlot | null>(null);
  const [search, setSearch] = useState("");
  const [freeText, setFreeText] = useState("");

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
  // Autofill nutzt eigene Mutations-Instanzen ohne Dialog-Nebenwirkungen
  const autofillSetMutation = trpc.menu.set.useMutation();
  const autofillRemoveMutation = trpc.menu.remove.useMutation();
  const [autofillBusy, setAutofillBusy] = useState(false);
  const addToShoppingMutation = trpc.shopping.addMany.useMutation({
    onSuccess: result => {
      utils.shopping.list.invalidate();
      toast.success(t.shopping.addedFromRecipe(result.added), {
        action: {
          label: t.shopping.openList,
          onClick: () => navigate("/einkauf"),
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

  const formatDay = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(LOCALE_TAGS[lang], {
      weekday: "long",
      day: "numeric",
      month: "short",
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

  /** Alle Zutaten der zugewiesenen Rezepte, Duplikate zusammengefasst. */
  const plannedIngredients = useMemo(() => {
    const lines: string[] = [];
    entries.forEach(entry => {
      if (entry.recipeId) {
        staticById
          .get(entry.recipeId)
          ?.ingredients.forEach(i => lines.push(pick(i, lang)));
      } else if (entry.customRecipeId != null) {
        const row = customById.get(entry.customRecipeId);
        if (row) {
          parseStringList(row.ingredientsJson).forEach(i => lines.push(i));
        }
      }
    });
    return mergeIngredientLines(lines).map(i => i.slice(0, 160));
  }, [entries, staticById, customById, lang]);

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
          disabled={addToShoppingMutation.isPending}
          onClick={() => {
            if (plannedIngredients.length === 0) {
              toast.error(t.menuPlan.noPlannedRecipes);
              return;
            }
            addToShoppingMutation.mutate({ names: plannedIngredients });
          }}
        >
          <ShoppingCart className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {t.menuPlan.addIngredients}
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/menueplan/${tripId}/drucken`}>
            <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {t.menuPlan.printButton}
          </Link>
        </Button>
      </div>

      {/* Tage-Raster */}
      <div className="space-y-4">
        {days.map(day => (
          <section
            key={day}
            className="overflow-hidden rounded-xl border border-border"
          >
            <h2 className="border-b border-border bg-muted/50 px-4 py-2 font-serif text-sm font-semibold capitalize">
              {formatDay(day)}
            </h2>
            <ul className="divide-y divide-border/60">
              {MEALS.map(meal => {
                const entry = entryFor(day, meal);
                const mealLabel = pick(MEAL_LABELS[meal], lang);
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
                          {entryTitle(entry)}
                          {entry.customRecipeId != null && (
                            <Badge className="ml-1.5 gap-1 border-0 bg-primary/15 align-middle text-primary">
                              <ChefHat className="h-3 w-3" aria-hidden="true" />
                              {t.menuPlan.ownBadge}
                            </Badge>
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
    </div>
  );
}
