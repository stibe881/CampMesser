import { useMemo, useState } from "react";
import {
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
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { recipes } from "@/data/recipes";
import { customRecipeToRecipe } from "@/lib/customRecipesClient";
import { RECIPE_METHOD_LABELS } from "@shared/customRecipes";
import { expiryInfo, expirySortKey, type ExpiryState } from "@shared/food";
import type { FoodTemplateItem } from "@shared/foodTemplates";
import { pick } from "@shared/i18n";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

/** Chip-Stile je Haltbarkeits-Zustand. */
const expiryStyles: Record<ExpiryState, string> = {
  expired: "border-destructive bg-destructive/10",
  today: "border-destructive/60 bg-destructive/5",
  soon: "border-chart-4/70 bg-chart-4/10",
  ok: "border-border bg-card",
};

/** Einfache Normalisierung für den Zutaten-Abgleich (Umlaute/Akzente falten). */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/é|è|ê/g, "e")
    .replace(/à|â/g, "a")
    .replace(/[^a-z]/g, "");
}

function matchScore(foodNames: string[], ingredients: string[]): number {
  let score = 0;
  for (const food of foodNames) {
    const nf = normalize(food);
    if (nf.length < 3) continue;
    for (const ing of ingredients) {
      const ni = normalize(ing);
      if (ni.includes(nf) || nf.includes(ni)) {
        score += 1;
        break;
      }
    }
  }
  return score;
}

export default function FoodPage() {
  const { lang, t } = useI18n();
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const query = trpc.food.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const [name, setName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  const addMutation = trpc.food.add.useMutation({
    onSuccess: () => {
      utils.food.list.invalidate();
      setName("");
      setExpiryDate("");
    },
    onError: () => toast.error(t.food.addFailed),
  });
  const removeMutation = trpc.food.remove.useMutation({
    onSuccess: () => utils.food.list.invalidate(),
  });
  // «Nachkaufen»: Lebensmittel auf die Einkaufsliste setzen (Server verhindert
  // Duplikate, wenn der Name bereits unabgehakt auf der Liste steht)
  const [, navigate] = useLocation();
  const addToShoppingMutation = trpc.shopping.add.useMutation({
    onSuccess: (result, variables) => {
      utils.shopping.list.invalidate();
      if (result.added) {
        toast.success(t.food.addedToShopping(variables.name), {
          action: {
            label: t.shopping.openList,
            onClick: () => navigate("/einkauf"),
          },
        });
      } else {
        toast.info(t.food.alreadyOnShopping(variables.name));
      }
    },
    onError: () => toast.error(t.food.addToShoppingFailed),
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

  /** Aktuelle Füllung einfrieren: Name + Restlaufzeit in Tagen (falls MHD gesetzt). */
  const saveCurrentAsTemplate = () => {
    if (!templateName.trim()) return;
    const items: FoodTemplateItem[] = (query.data ?? []).map(item => {
      const info = expiryInfo(item.expiryDate, today, lang);
      return info
        ? { name: item.name, expiryDays: Math.max(0, info.daysLeft) }
        : { name: item.name };
    });
    if (items.length === 0) return;
    createTemplateMutation.mutate({ name: templateName.trim(), items });
  };

  const foodNames = useMemo(
    () => (query.data ?? []).map(f => f.name),
    [query.data]
  );

  // Eigene Rezepte zählen bei den Vorschlägen mit
  const customRecipesQuery = trpc.recipes.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const suggestions = useMemo(() => {
    if (foodNames.length === 0) return [];
    const pool = [
      ...(customRecipesQuery.data ?? []).map(customRecipeToRecipe),
      ...recipes,
    ];
    return pool
      .map(r => ({
        recipe: r,
        score: matchScore(
          foodNames,
          r.ingredients.map(i => pick(i, lang))
        ),
      }))
      .filter(s => s.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score || a.recipe.timeMinutes - b.recipe.timeMinutes
      )
      .slice(0, 5);
  }, [foodNames, customRecipesQuery.data, lang]);

  if (loading) {
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
        <PageHeader title={t.food.title} subtitle={t.food.subtitleLoggedOut} />
        <LoginPrompt feature={t.food.loginFeature} />
      </div>
    );
  }

  // «Verbrauche zuerst»: ablaufende Vorräte nach vorne, ohne Datum ans Ende
  const items = [...(query.data ?? [])].sort(
    (a, b) => expirySortKey(a.expiryDate) - expirySortKey(b.expiryDate)
  );
  const urgentCount = items.filter(i => {
    const info = expiryInfo(i.expiryDate, today, lang);
    return info && info.state !== "ok";
  }).length;

  return (
    <div className="container max-w-2xl py-6">
      <PageHeader title={t.food.title} subtitle={t.food.subtitle} />

      <form
        className="mb-2 flex gap-2"
        onSubmit={e => {
          e.preventDefault();
          if (!name.trim()) return;
          addMutation.mutate({
            name: name.trim(),
            expiryDate: expiryDate || null,
          });
        }}
      >
        <Input
          placeholder={t.food.addPlaceholder}
          value={name}
          onChange={e => setName(e.target.value)}
          aria-label={t.food.addNameAria}
        />
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
      <p className="mb-3 text-xs text-muted-foreground">{t.food.dateHint}</p>

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
                    onClick={() => {
                      if (confirm(t.food.templateDeleteConfirm(template.name)))
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

      {query.isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2
            className="h-6 w-6 animate-spin text-muted-foreground"
            aria-label={t.common.loading}
          />
        </div>
      ) : items.length > 0 ? (
        <>
          {urgentCount > 0 && (
            <p className="mb-3 rounded-lg bg-accent px-4 py-2.5 text-sm text-accent-foreground">
              {urgentCount === 1
                ? t.food.urgentOne
                : t.food.urgentMany(urgentCount)}
              {t.food.urgentSuffix}
            </p>
          )}
          <div className="mb-8 flex flex-wrap gap-2">
            {items.map(item => {
              const info = expiryInfo(item.expiryDate, today, lang);
              return (
                <span
                  key={item.id}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border py-1 pl-3.5 pr-1.5 text-sm font-medium",
                    expiryStyles[info?.state ?? "ok"]
                  )}
                >
                  {item.name}
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
                    onClick={() =>
                      addToShoppingMutation.mutate({ name: item.name })
                    }
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
                          addToShoppingMutation.mutate({ name: item.name });
                          removeMutation.mutate({ id: item.id });
                        }}
                      >
                        <ShoppingCart
                          className="mr-2 h-4 w-4"
                          aria-hidden="true"
                        />
                        {t.food.deleteAndShop}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </span>
              );
            })}
          </div>
        </>
      ) : (
        <div className="mb-8 rounded-xl border border-dashed border-border p-8 text-center">
          <Refrigerator
            className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50"
            aria-hidden="true"
          />
          <p className="font-medium">{t.food.emptyTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.food.emptyText}
          </p>
        </div>
      )}

      {/* Rezeptvorschläge */}
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
            {suggestions.map(({ recipe, score }) => (
              <Card key={recipe.id}>
                <CardContent className="pt-6">
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="font-semibold">{pick(recipe.name, lang)}</p>
                    <Badge variant="secondary">
                      {t.food.matchCount(score)}
                    </Badge>
                  </div>
                  <p className="mb-2 text-sm text-muted-foreground">
                    {pick(RECIPE_METHOD_LABELS[recipe.method], lang)} ·{" "}
                    {t.food.minutes(recipe.timeMinutes)} ·{" "}
                    {t.food.servings(recipe.servings)}
                    {recipe.onePot && t.food.onePotSuffix}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t.food.ingredientsPrefix}{" "}
                    {recipe.ingredients.map(i => pick(i, lang)).join(", ")}
                  </p>
                </CardContent>
              </Card>
            ))}
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
