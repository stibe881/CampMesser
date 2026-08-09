import { useMemo, useState } from "react";
import { useConfirm } from "@/components/ConfirmDialog";
import {
  Archive,
  BookmarkPlus,
  ChefHat,
  FolderOpen,
  Loader2,
  Plus,
  Refrigerator,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import PageHeader from "@/components/PageHeader";
import BarcodeScanButton from "@/components/BarcodeScanButton";
import DataAge from "@/components/DataAge";
import QueryError from "@/components/QueryError";
import ListSkeleton from "@/components/ListSkeleton";
import ShoppingTargetSelect, {
  useShoppingTarget,
} from "@/components/ShoppingTargetSelect";
import LoginPrompt from "@/components/LoginPrompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { recipes } from "@/data/recipes";
import { customRecipeToRecipe } from "@/lib/customRecipesClient";
import { loadRecipeFavorites } from "@/lib/recipeFavorites";
import { RECIPE_METHOD_LABELS } from "@shared/customRecipes";
import {
  expiryInfo,
  formatFoodQuantity,
  groupFoodByCategory,
  isFoodCategory,
  isFoodUnit,
  normalizeFoodStorage,
  shoppingCategoryForFood,
  FOOD_CATEGORIES,
  FOOD_CATEGORY_LABELS,
  FOOD_STORAGES,
  FOOD_STORAGE_LABELS,
  FOOD_UNITS,
  FOOD_UNIT_LABELS,
  type ExpiryState,
  type FoodCategory,
  type FoodStorage,
  type FoodUnit,
} from "@shared/food";
import { leftoverSuggestions, type LeftoverRecipe } from "@shared/leftovers";
import {
  loadFoodSort,
  loadFoodStorage,
  sortFoodItems,
  storeFoodSort,
  storeFoodStorage,
  type FoodSortMode,
} from "@/lib/foodSort";
import type { FoodTemplateItem } from "@shared/foodTemplates";
import { pick } from "@shared/i18n";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import { useTodayIso } from "@/lib/useTodayIso";

/** Chip-Stile je Haltbarkeits-Zustand. */
const expiryStyles: Record<ExpiryState, string> = {
  expired: "border-destructive bg-destructive/10",
  today: "border-destructive/60 bg-destructive/5",
  soon: "border-chart-4/70 bg-chart-4/10",
  ok: "border-border bg-card",
};

/** Select-Wert für «ohne Einheit»/«ohne Kategorie» (Radix erlaubt kein ""). */
const NONE = "none" as const;

/** Sinnbild je Lager: Kühlbox vs. Trockenvorrat-Schrank. */
const storageIcons: Record<FoodStorage, typeof Refrigerator> = {
  cooled: Refrigerator,
  dry: Archive,
};

export default function FoodPage() {
  const ask = useConfirm();
  const { lang, t } = useI18n();
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const query = trpc.food.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<string>(NONE);
  const [category, setCategory] = useState<string>(NONE);
  const [expiryDate, setExpiryDate] = useState("");
  const today = useTodayIso();

  // Lager-Wahl «Kühlbox / Trockenvorrat» (#233) – wird pro Gerät gemerkt
  const [storage, setStorage] = useState<FoodStorage>(() => loadFoodStorage());
  const changeStorage = (next: FoodStorage) => {
    setStorage(next);
    storeFoodStorage(next);
  };

  // Sortier-Wahl «Nach Ablauf / Nach Name» – wird pro Gerät gemerkt
  const [sortMode, setSortMode] = useState<FoodSortMode>(() => loadFoodSort());
  const changeSort = (mode: FoodSortMode) => {
    setSortMode(mode);
    storeFoodSort(mode);
  };

  const addMutation = trpc.food.add.useMutation({
    onSuccess: () => {
      utils.food.list.invalidate();
      setName("");
      setQuantity("");
      setUnit(NONE);
      setCategory(NONE);
      setExpiryDate("");
    },
    onError: () => toast.error(t.food.addFailed),
  });
  const removeMutation = trpc.food.remove.useMutation({
    onSuccess: () => utils.food.list.invalidate(),
  });

  // ── Eintrag bearbeiten: Menge, Einheit, Kategorie, Lager & MHD anpassen ──
  const [editItem, setEditItem] = useState<{ id: number; name: string } | null>(
    null
  );
  const [editQuantity, setEditQuantity] = useState("");
  const [editUnit, setEditUnit] = useState<string>(NONE);
  const [editCategory, setEditCategory] = useState<string>(NONE);
  const [editStorage, setEditStorage] = useState<FoodStorage>("cooled");
  const [editExpiry, setEditExpiry] = useState("");
  const updateMutation = trpc.food.update.useMutation({
    onSuccess: () => {
      utils.food.list.invalidate();
      setEditItem(null);
    },
    onError: () => toast.error(t.food.editFailed),
  });
  /** Bearbeiten-Dialog mit den aktuellen Werten des Eintrags öffnen. */
  const openEdit = (item: {
    id: number;
    name: string;
    quantity: string | null;
    unit: string | null;
    category: string | null;
    storage: string;
    expiryDate: string | null;
  }) => {
    setEditQuantity(item.quantity ?? "");
    setEditUnit(isFoodUnit(item.unit) ? item.unit : NONE);
    setEditCategory(isFoodCategory(item.category) ? item.category : NONE);
    setEditStorage(normalizeFoodStorage(item.storage));
    setEditExpiry(item.expiryDate ?? "");
    setEditItem({ id: item.id, name: item.name });
  };
  // «Nachkaufen»: Lebensmittel auf die Einkaufsliste setzen (Server verhindert
  // Duplikate, wenn der Name bereits unabgehakt auf der Liste steht)
  const [, navigate] = useLocation();
  // Ziel-Liste des «Nachkaufen» (#215): zuletzt genutzte persönliche Liste
  const shoppingTarget = useShoppingTarget(isAuthenticated);
  const addToShoppingMutation = trpc.shopping.add.useMutation({
    onSuccess: (result, variables) => {
      utils.shopping.list.invalidate();
      utils.shopping.lists.invalidate();
      const listName = shoppingTarget.lists.find(
        l => l.id === variables.listId
      )?.name;
      if (result.added) {
        toast.success(
          shoppingTarget.lists.length > 1 && listName
            ? t.shopping.addedToNamedList(variables.name, listName)
            : t.food.addedToShopping(variables.name),
          {
            action: {
              label: t.shopping.openList,
              onClick: () => navigate("/einkauf"),
            },
          }
        );
      } else {
        toast.info(t.food.alreadyOnShopping(variables.name));
      }
    },
    onError: () => toast.error(t.food.addToShoppingFailed),
  });
  /**
   * «Nachkaufen» immer auf die gewählte Ziel-Liste. Die Vorrats-Kategorie
   * eines Trockenvorrats wird dabei in die passende Laden-Kategorie
   * übersetzt (#233) – der Eintrag landet gleich im richtigen Regal.
   */
  const addToShopping = (item: { name: string; category?: string | null }) =>
    addToShoppingMutation.mutate({
      name: item.name,
      listId: shoppingTarget.listId ?? undefined,
      category: shoppingCategoryForFood(item.category),
    });

  // ── Kühlbox-Vorlagen («Standardfüllung») ──
  const templatesQuery = trpc.foodTemplates.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [loadTemplateOpen, setLoadTemplateOpen] = useState(false);
  const createTemplateMutation = trpc.foodTemplates.create.useMutation({
    onSuccess: () => {
      utils.foodTemplates.list.invalidate();
      setSaveTemplateOpen(false);
      setTemplateName("");
      toast.success(t.food.templateSaved);
    },
    onError: () => toast.error(t.food.templateSaveFailed),
  });
  const applyTemplateMutation = trpc.foodTemplates.applyTemplate.useMutation({
    onSuccess: result => {
      utils.food.list.invalidate();
      setLoadTemplateOpen(false);
      toast.success(t.food.templateApplied(result.added, result.skipped));
    },
    onError: () => toast.error(t.food.templateApplyFailed),
  });
  const removeTemplateMutation = trpc.foodTemplates.remove.useMutation({
    onSuccess: () => {
      utils.foodTemplates.list.invalidate();
      toast.success(t.food.templateDeleted);
    },
    onError: () => toast.error(t.food.templateDeleteFailed),
  });

  /**
   * Aktuelle Füllung einfrieren: Name + Restlaufzeit in Tagen (falls MHD
   * gesetzt), dazu Lager, Einheit und Kategorie. Gespeichert wird IMMER die
   * ganze Füllung – beide Lager, damit eine Vorlage die Standardausrüstung
   * vollständig abbildet.
   */
  const saveCurrentAsTemplate = () => {
    if (!templateName.trim()) return;
    const items: FoodTemplateItem[] = (query.data ?? []).map(item => {
      const info = expiryInfo(item.expiryDate, today, lang);
      const base: FoodTemplateItem = { name: item.name };
      if (item.quantity) base.quantity = item.quantity;
      if (info) base.expiryDays = Math.max(0, info.daysLeft);
      base.storage = normalizeFoodStorage(item.storage);
      if (isFoodUnit(item.unit)) base.unit = item.unit;
      if (isFoodCategory(item.category)) base.category = item.category;
      return base;
    });
    if (items.length === 0) return;
    createTemplateMutation.mutate({ name: templateName.trim(), items });
  };

  // ── Resteverwertung (#235) ──
  // Eigene Rezepte zählen bei den Vorschlägen mit
  const customRecipesQuery = trpc.recipes.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  // Rezept-Favoriten (einmal beim Laden gelesen) als leichter Bonus bei Gleichstand
  const [favoriteIds] = useState<ReadonlySet<string>>(
    () => new Set(loadRecipeFavorites())
  );
  /** Rezept-Vorrat für den Abgleich: eigene Rezepte zuerst, dann die eingebauten. */
  const recipePool = useMemo(
    () => [
      ...(customRecipesQuery.data ?? []).map(customRecipeToRecipe),
      ...recipes,
    ],
    [customRecipesQuery.data]
  );
  const recipeById = useMemo(() => {
    const map = new Map<string, (typeof recipePool)[number]>();
    recipePool.forEach(r => map.set(r.id, r));
    return map;
  }, [recipePool]);
  /**
   * Vorschläge aus dem aktuellen Bestand – der Abgleich (fehlertolerant, mit
   * Bevorzugung bald ablaufender Vorräte) liegt in shared/leftovers.ts.
   */
  const suggestions = useMemo(() => {
    const stock = (query.data ?? []).map(item => ({
      id: item.id,
      name: item.name,
      expiryDate: item.expiryDate,
    }));
    if (stock.length === 0) return [];
    const pool: LeftoverRecipe[] = recipePool.map(r => ({
      id: r.id,
      name: pick(r.name, lang),
      ingredients: r.ingredients.map(i => pick(i, lang)),
      timeMinutes: r.timeMinutes,
      favorite: favoriteIds.has(r.id),
    }));
    return leftoverSuggestions({ recipes: pool, stock, today, limit: 5 });
  }, [query.data, recipePool, lang, favoriteIds, today]);

  /** Fehlende Zutaten eines Vorschlags auf die Einkaufsliste setzen. */
  const addMissingMutation = trpc.shopping.addMany.useMutation({
    onSuccess: result => {
      utils.shopping.list.invalidate();
      utils.shopping.lists.invalidate();
      toast.success(t.shopping.addedFromRecipe(result.added), {
        action: {
          label: t.shopping.openList,
          onClick: () => navigate("/einkauf"),
        },
      });
    },
    onError: () => toast.error(t.shopping.addFailed),
  });
  const addMissing = (recipeName: string, missing: string[]) =>
    addMissingMutation.mutate({
      listId: shoppingTarget.listId ?? undefined,
      names: missing.slice(0, 100).map(name => ({
        name: name.slice(0, 160),
        note: t.shopping.fromRecipe(recipeName).slice(0, 160),
      })),
    });

  if (loading) {
    return (
      <div className="container max-w-2xl py-6">
        <ListSkeleton rows={4} height={72} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-6">
        <PageHeader title={t.food.title} subtitle={t.food.subtitleLoggedOut} />
        <LoginPrompt feature={t.food.loginFeature} />
      </div>
    );
  }

  const allItems = query.data ?? [];
  /** Wie viele Vorräte liegen je Lager? – Zahl im Umschalter. */
  const countFor = (key: FoodStorage) =>
    allItems.filter(i => normalizeFoodStorage(i.storage) === key).length;
  // Sortierung: «Nach Ablauf» (Standard, Verbrauche-zuerst) oder «Nach Name»
  const items = sortFoodItems(
    allItems.filter(i => normalizeFoodStorage(i.storage) === storage),
    sortMode,
    lang
  );
  // Im Trockenvorrat nach Kategorie gruppiert, in der Kühlbox als eine Reihe
  const groups =
    storage === "dry"
      ? groupFoodByCategory(items)
      : [{ category: null as FoodCategory | null, items }];
  const urgentCount = items.filter(i => {
    const info = expiryInfo(i.expiryDate, today, lang);
    return info && info.state !== "ok";
  }).length;

  /** Ein Vorrat als Chip – gleich in beiden Lagern. */
  const renderItem = (item: (typeof items)[number]) => {
    const info = expiryInfo(item.expiryDate, today, lang);
    const amount = formatFoodQuantity(item.quantity, item.unit, lang);
    return (
      <span
        key={item.id}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border py-1 pl-3.5 pr-1.5 text-sm font-medium",
          expiryStyles[info?.state ?? "ok"]
        )}
      >
        <button
          type="button"
          className="rounded hover:underline"
          onClick={() => openEdit(item)}
          aria-label={t.food.editAria(item.name)}
        >
          {item.name}
        </button>
        {amount && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground">
            {amount}
          </span>
        )}
        {info && info.state !== "ok" && (
          <span
            className={cn(
              "text-xs font-normal",
              info.state === "soon"
                ? "text-muted-foreground"
                : "text-destructive"
            )}
          >
            {info.label}
          </span>
        )}
        <button
          type="button"
          onClick={() => addToShopping(item)}
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full transition-colors",
            // Abgelaufene Vorräte: Nachkaufen-Aktion prominent zeigen
            info?.state === "expired"
              ? "bg-primary/15 text-primary hover:bg-primary/25"
              : "text-muted-foreground/60 hover:bg-primary/10 hover:text-primary"
          )}
          aria-label={t.food.addToShoppingAria(item.name)}
        >
          <ShoppingCart className="h-3 w-3" aria-hidden="true" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
              aria-label={t.food.removeAria(item.name)}
            >
              <Trash2 className="h-3 w-3" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => removeMutation.mutate({ id: item.id })}
            >
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
              {t.food.deleteOnly}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                addToShopping(item);
                removeMutation.mutate({ id: item.id });
              }}
            >
              <ShoppingCart className="mr-2 h-4 w-4" aria-hidden="true" />
              {t.food.deleteAndShop}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </span>
    );
  };

  const StorageIcon = storageIcons[storage];

  return (
    <div className="container max-w-2xl py-6">
      <PageHeader
        title={t.food.title}
        subtitle={
          storage === "dry" ? t.food.subtitleDry : t.food.subtitleCooled
        }
      />
      <DataAge updatedAt={query.dataUpdatedAt} />

      {/* Fehler vom Server ist nicht dasselbe wie «Vorrat leer» */}
      {query.isError && (
        <QueryError
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      )}

      {/* Lager-Umschalter (#233): Kühlbox oder Trockenvorrat-Schrank */}
      <div
        className="mb-4 inline-flex items-center gap-1 rounded-lg bg-muted p-1"
        role="group"
        aria-label={t.food.storageAria}
      >
        {FOOD_STORAGES.map(key => {
          const Icon = storageIcons[key];
          return (
            <button
              key={key}
              type="button"
              aria-pressed={storage === key}
              onClick={() => changeStorage(key)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                storage === key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {pick(FOOD_STORAGE_LABELS[key], lang)}
              <span className="opacity-70">{countFor(key)}</span>
            </button>
          );
        })}
      </div>

      <form
        className="mb-2 flex flex-wrap gap-2"
        onSubmit={e => {
          e.preventDefault();
          if (!name.trim()) return;
          addMutation.mutate({
            name: name.trim(),
            quantity: quantity.trim().slice(0, 40) || undefined,
            storage,
            unit: unit === NONE ? null : (unit as FoodUnit),
            // Kategorien ordnen den Trockenvorrat-Schrank – die Kühlbox
            // bleibt bewusst eine einfache Reihe.
            category:
              storage === "dry" && category !== NONE
                ? (category as FoodCategory)
                : null,
            expiryDate: expiryDate || null,
          });
        }}
      >
        <Input
          className="min-w-40 flex-1"
          placeholder={
            storage === "dry"
              ? t.food.addPlaceholderDry
              : t.food.addPlaceholderCooled
          }
          value={name}
          onChange={e => setName(e.target.value)}
          aria-label={t.food.addNameAria}
        />
        {/* Barcode-Scan (#634): Foto des Strichcodes → Name via
            OpenFoodFacts; ohne BarcodeDetector-API kein Knopf. */}
        <BarcodeScanButton onProduct={product => setName(product)} />
        <Input
          className="w-20 shrink-0"
          value={quantity}
          maxLength={40}
          placeholder={t.food.quantityPlaceholder}
          aria-label={t.food.addQuantityAria}
          onChange={e => setQuantity(e.target.value)}
        />
        <Select value={unit} onValueChange={setUnit}>
          <SelectTrigger className="w-28 shrink-0" aria-label={t.food.unitAria}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>{t.food.noUnit}</SelectItem>
            {FOOD_UNITS.map(key => (
              <SelectItem key={key} value={key}>
                {pick(FOOD_UNIT_LABELS[key], lang)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {storage === "dry" && (
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger
              className="w-44 shrink-0"
              aria-label={t.food.categoryAria}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>{t.food.noCategory}</SelectItem>
              {FOOD_CATEGORIES.map(key => (
                <SelectItem key={key} value={key}>
                  {pick(FOOD_CATEGORY_LABELS[key], lang)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Input
          type="date"
          className="w-40 shrink-0"
          value={expiryDate}
          min={today}
          onChange={e => setExpiryDate(e.target.value)}
          aria-label={t.food.expiryAria}
        />
        <Button
          type="submit"
          disabled={addMutation.isPending || !name.trim()}
          aria-label={t.food.submitAria}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>
      <p className="mb-3 text-xs text-muted-foreground">
        {storage === "dry" ? t.food.dateHintDry : t.food.dateHint}
      </p>

      {/* Ziel-Liste fürs «Nachkaufen», sobald es mehrere Listen gibt (#215) */}
      <ShoppingTargetSelect target={shoppingTarget} className="mb-5 max-w-56" />

      {/* Vorlagen: aktuelle Füllung einfrieren bzw. gespeicherte laden */}
      {(items.length > 0 || (templatesQuery.data ?? []).length > 0) && (
        <div className="mb-5 flex flex-wrap gap-2">
          {items.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSaveTemplateOpen(true)}
            >
              <BookmarkPlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.food.templateSaveButton}
            </Button>
          )}
          {(templatesQuery.data ?? []).length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLoadTemplateOpen(true)}
            >
              <FolderOpen className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.food.templateLoadButton}
            </Button>
          )}
        </div>
      )}

      {/* Dialog: aktuelle Füllung als Vorlage speichern */}
      <Dialog open={saveTemplateOpen} onOpenChange={setSaveTemplateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.food.templateSaveTitle}</DialogTitle>
            <DialogDescription>
              {t.food.templateSaveDesc(items.length)}
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={e => {
              e.preventDefault();
              saveCurrentAsTemplate();
            }}
          >
            <div>
              <Label htmlFor="food-template-name">
                {t.food.templateNameLabel}
              </Label>
              <Input
                id="food-template-name"
                className="mt-1.5"
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                placeholder={t.food.templateNamePlaceholder}
                maxLength={120}
                autoFocus
              />
            </div>
            <Button
              type="submit"
              disabled={
                !templateName.trim() || createTemplateMutation.isPending
              }
            >
              {createTemplateMutation.isPending && (
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              {t.food.templateSaveConfirm}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Vorlage laden oder löschen */}
      <Dialog open={loadTemplateOpen} onOpenChange={setLoadTemplateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.food.templateLoadTitle}</DialogTitle>
            <DialogDescription>{t.food.templateLoadDesc}</DialogDescription>
          </DialogHeader>
          {(templatesQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t.food.templateEmpty}
            </p>
          ) : (
            <ul className="grid gap-2">
              {(templatesQuery.data ?? []).map(template => (
                <li
                  key={template.id}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {template.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.food.templateItemCount(template.items.length)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={applyTemplateMutation.isPending}
                    onClick={() =>
                      applyTemplateMutation.mutate({
                        templateId: template.id,
                        today,
                      })
                    }
                  >
                    {t.food.templateApply}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={t.food.templateDeleteAria(template.name)}
                    disabled={removeTemplateMutation.isPending}
                    onClick={async () => {
                      if (
                        await ask({
                          title: t.food.templateDeleteConfirm(template.name),
                        })
                      )
                        removeTemplateMutation.mutate({ id: template.id });
                    }}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Menge & MHD eines Eintrags bearbeiten */}
      <Dialog
        open={editItem !== null}
        onOpenChange={open => !open && setEditItem(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem?.name}</DialogTitle>
            <DialogDescription>{t.food.editDesc}</DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={e => {
              e.preventDefault();
              if (!editItem) return;
              updateMutation.mutate({
                id: editItem.id,
                quantity: editQuantity.trim().slice(0, 40) || null,
                storage: editStorage,
                unit: editUnit === NONE ? null : (editUnit as FoodUnit),
                category:
                  editStorage === "dry" && editCategory !== NONE
                    ? (editCategory as FoodCategory)
                    : null,
                expiryDate: editExpiry || null,
              });
            }}
          >
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="food-edit-quantity">
                  {t.food.editQuantityLabel}
                </Label>
                <Input
                  id="food-edit-quantity"
                  className="mt-1.5"
                  value={editQuantity}
                  maxLength={40}
                  placeholder={t.food.editQuantityPlaceholder}
                  onChange={e => setEditQuantity(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="w-32">
                <Label htmlFor="food-edit-unit">{t.food.editUnitLabel}</Label>
                <Select value={editUnit} onValueChange={setEditUnit}>
                  <SelectTrigger id="food-edit-unit" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>{t.food.noUnit}</SelectItem>
                    {FOOD_UNITS.map(key => (
                      <SelectItem key={key} value={key}>
                        {pick(FOOD_UNIT_LABELS[key], lang)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="food-edit-storage">
                {t.food.editStorageLabel}
              </Label>
              <Select
                value={editStorage}
                onValueChange={value => setEditStorage(value as FoodStorage)}
              >
                <SelectTrigger id="food-edit-storage" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FOOD_STORAGES.map(key => (
                    <SelectItem key={key} value={key}>
                      {pick(FOOD_STORAGE_LABELS[key], lang)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editStorage === "dry" && (
              <div>
                <Label htmlFor="food-edit-category">
                  {t.food.editCategoryLabel}
                </Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger id="food-edit-category" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>{t.food.noCategory}</SelectItem>
                    {FOOD_CATEGORIES.map(key => (
                      <SelectItem key={key} value={key}>
                        {pick(FOOD_CATEGORY_LABELS[key], lang)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="food-edit-expiry">{t.food.editExpiryLabel}</Label>
              <Input
                id="food-edit-expiry"
                type="date"
                className="mt-1.5"
                value={editExpiry}
                onChange={e => setEditExpiry(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              {t.food.editSave}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {query.isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2
            className="h-6 w-6 animate-spin text-muted-foreground"
            aria-label={t.common.loading}
          />
        </div>
      ) : items.length > 0 ? (
        <>
          {/* Umschalter «Nach Ablauf / Nach Name» */}
          {items.length > 1 && (
            <div
              className="mb-3 inline-flex items-center gap-1 rounded-lg bg-muted p-1"
              role="group"
              aria-label={t.food.sortAria}
            >
              {(["expiry", "name"] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={sortMode === mode}
                  onClick={() => changeSort(mode)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    sortMode === mode
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {mode === "expiry" ? t.food.sortByExpiry : t.food.sortByName}
                </button>
              ))}
            </div>
          )}
          {urgentCount > 0 && (
            <p className="mb-3 rounded-lg bg-accent px-4 py-2.5 text-sm text-accent-foreground">
              {urgentCount === 1
                ? t.food.urgentOne
                : t.food.urgentMany(urgentCount)}
              {t.food.urgentSuffix}
            </p>
          )}
          {/* Trockenvorrat nach Kategorie geordnet, Kühlbox als eine Reihe */}
          <div className="mb-8 space-y-4">
            {groups.map(group => (
              <div key={group.category ?? "none"}>
                {storage === "dry" && (
                  <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.category === null
                      ? t.food.noCategory
                      : pick(FOOD_CATEGORY_LABELS[group.category], lang)}
                  </h3>
                )}
                <div className="flex flex-wrap gap-2">
                  {group.items.map(renderItem)}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="mb-8 rounded-xl border border-dashed border-border p-8 text-center">
          <StorageIcon
            className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50"
            aria-hidden="true"
          />
          <p className="font-medium">
            {storage === "dry" ? t.food.emptyTitleDry : t.food.emptyTitle}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {storage === "dry" ? t.food.emptyTextDry : t.food.emptyText}
          </p>
        </div>
      )}

      {/* Resteverwertung: Vorschläge aus dem Bestand (#235) */}
      {suggestions.length > 0 && (
        <>
          <h2 className="mb-1 flex items-center gap-2 font-serif text-lg font-semibold">
            <ChefHat className="h-5 w-5 text-primary" aria-hidden="true" />
            {t.food.suggestionsTitle}
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {t.food.suggestionsSubtitle}
          </p>
          <div className="space-y-3">
            {suggestions.map(suggestion => {
              const source = recipeById.get(suggestion.recipe.id);
              return (
                <Card key={suggestion.recipe.id}>
                  <CardContent className="pt-6">
                    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{suggestion.recipe.name}</p>
                      <span className="flex flex-wrap gap-1.5">
                        <Badge variant="secondary">
                          {t.food.haveCount(
                            suggestion.matched.length,
                            suggestion.total
                          )}
                        </Badge>
                        {suggestion.urgentCount > 0 && (
                          <Badge
                            variant="outline"
                            className="border-chart-4/70 bg-chart-4/10"
                          >
                            {t.food.urgentInRecipe(suggestion.urgentCount)}
                          </Badge>
                        )}
                      </span>
                    </div>
                    {source && (
                      <p className="mb-2 text-sm text-muted-foreground">
                        {pick(RECIPE_METHOD_LABELS[source.method], lang)} ·{" "}
                        {t.food.minutes(source.timeMinutes)} ·{" "}
                        {t.food.servings(source.servings)}
                        {source.onePot && t.food.onePotSuffix}
                      </p>
                    )}
                    <p className="text-sm">
                      <span className="font-medium">{t.food.havePrefix}</span>{" "}
                      <span className="text-muted-foreground">
                        {suggestion.matched
                          .map(match => match.item.name)
                          .join(", ")}
                      </span>
                    </p>
                    {suggestion.missing.length > 0 ? (
                      <p className="mt-1 text-sm">
                        <span className="font-medium">
                          {t.food.missingPrefix}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {suggestion.missing.join(", ")}
                        </span>
                      </p>
                    ) : (
                      <p className="mt-1 text-sm font-medium text-primary">
                        {t.food.missingNone}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {suggestion.missing.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={addMissingMutation.isPending}
                          aria-label={t.food.addMissingAria(
                            suggestion.recipe.name
                          )}
                          onClick={() =>
                            addMissing(
                              suggestion.recipe.name,
                              suggestion.missing
                            )
                          }
                        >
                          <ShoppingCart
                            className="mr-1.5 h-4 w-4"
                            aria-hidden="true"
                          />
                          {t.food.addMissing}
                        </Button>
                      )}
                      <Button asChild variant="ghost" size="sm">
                        <Link
                          href={`/rezepte?rezept=${encodeURIComponent(suggestion.recipe.id)}`}
                        >
                          <ChefHat
                            className="mr-1.5 h-4 w-4"
                            aria-hidden="true"
                          />
                          {t.food.openRecipe}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {t.food.bookPrefix}
            <Link
              href="/rezepte"
              className="font-medium text-primary hover:underline"
            >
              {t.food.bookLink}
            </Link>
            {t.food.bookSuffix}
          </p>
        </>
      )}
    </div>
  );
}
