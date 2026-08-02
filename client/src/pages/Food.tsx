import { useMemo, useState } from "react";
import { ChefHat, Loader2, Plus, Refrigerator, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import PageHeader from "@/components/PageHeader";
import LoginPrompt from "@/components/LoginPrompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { recipes } from "@/data/recipes";
import { customRecipeToRecipe } from "@/lib/customRecipesClient";
import { RECIPE_METHOD_LABELS } from "@shared/customRecipes";
import { expiryInfo, expirySortKey, type ExpiryState } from "@shared/food";
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
      <p className="mb-5 text-xs text-muted-foreground">{t.food.dateHint}</p>

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
                    onClick={() => removeMutation.mutate({ id: item.id })}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label={t.food.removeAria(item.name)}
                  >
                    <Trash2 className="h-3 w-3" aria-hidden="true" />
                  </button>
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
