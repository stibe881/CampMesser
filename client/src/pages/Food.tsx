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
import { expiryInfo, expirySortKey, type ExpiryState } from "@shared/food";
import { cn } from "@/lib/utils";

/** Chip-Stile je Haltbarkeits-Zustand. */
const expiryStyles: Record<ExpiryState, string> = {
  expired: "border-destructive bg-destructive/10",
  today: "border-destructive/60 bg-destructive/5",
  soon: "border-chart-4/70 bg-chart-4/10",
  ok: "border-border bg-card",
};

/** Einfache Normalisierung für den Zutaten-Abgleich. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
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
    onError: () => toast.error("Eintrag konnte nicht gespeichert werden"),
  });
  const removeMutation = trpc.food.remove.useMutation({
    onSuccess: () => utils.food.list.invalidate(),
  });

  const foodNames = useMemo(
    () => (query.data ?? []).map(f => f.name),
    [query.data]
  );

  const suggestions = useMemo(() => {
    if (foodNames.length === 0) return [];
    return recipes
      .map(r => ({ recipe: r, score: matchScore(foodNames, r.ingredients) }))
      .filter(s => s.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score || a.recipe.timeMinutes - b.recipe.timeMinutes
      )
      .slice(0, 5);
  }, [foodNames]);

  if (loading) {
    return (
      <div className="container flex justify-center py-16">
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          aria-label="Lädt"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-6">
        <PageHeader
          title="Kühlbox-Inventar"
          subtitle="Was ist noch da? Erfasse deine Vorräte und erhalte passende Rezeptvorschläge."
        />
        <LoginPrompt feature="dein Kühlbox-Inventar" />
      </div>
    );
  }

  // «Verbrauche zuerst»: ablaufende Vorräte nach vorne, ohne Datum ans Ende
  const items = [...(query.data ?? [])].sort(
    (a, b) => expirySortKey(a.expiryDate) - expirySortKey(b.expiryDate)
  );
  const urgentCount = items.filter(i => {
    const info = expiryInfo(i.expiryDate, today);
    return info && info.state !== "ok";
  }).length;

  return (
    <div className="container max-w-2xl py-6">
      <PageHeader
        title="Kühlbox-Inventar"
        subtitle="Was ist noch da? Erfasse deine Vorräte und erhalte passende One-Pot-Rezeptvorschläge."
      />

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
          placeholder="z. B. Tomaten, Käse, Bohnen …"
          value={name}
          onChange={e => setName(e.target.value)}
          aria-label="Lebensmittel hinzufügen"
        />
        <Input
          type="date"
          className="w-40 shrink-0"
          value={expiryDate}
          min={today}
          onChange={e => setExpiryDate(e.target.value)}
          aria-label="Mindesthaltbarkeitsdatum (optional)"
        />
        <Button
          type="submit"
          disabled={addMutation.isPending || !name.trim()}
          aria-label="Lebensmittel speichern"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>
      <p className="mb-5 text-xs text-muted-foreground">
        Datum = Mindesthaltbarkeit (optional). Bald ablaufende Vorräte rutschen
        nach vorne und werden markiert.
      </p>

      {query.isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2
            className="h-6 w-6 animate-spin text-muted-foreground"
            aria-label="Lädt"
          />
        </div>
      ) : items.length > 0 ? (
        <>
          {urgentCount > 0 && (
            <p className="mb-3 rounded-lg bg-accent px-4 py-2.5 text-sm text-accent-foreground">
              {urgentCount === 1
                ? "Ein Vorrat sollte bald verbraucht werden"
                : `${urgentCount} Vorräte sollten bald verbraucht werden`}{" "}
              – die Rezeptvorschläge unten helfen dabei.
            </p>
          )}
          <div className="mb-8 flex flex-wrap gap-2">
            {items.map(item => {
              const info = expiryInfo(item.expiryDate, today);
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
                    aria-label={`${item.name} entfernen`}
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
          <p className="font-medium">Kühlbox noch leer</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Trage ein, was du dabei hast – wir schlagen dir passende Rezepte
            vor.
          </p>
        </div>
      )}

      {/* Rezeptvorschläge */}
      {suggestions.length > 0 && (
        <>
          <h2 className="mb-1 flex items-center gap-2 font-serif text-lg font-semibold">
            <ChefHat className="h-5 w-5 text-primary" aria-hidden="true" />
            Das kannst du damit kochen
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Sortiert danach, wie viele deiner Vorräte im Rezept vorkommen.
          </p>
          <div className="space-y-3">
            {suggestions.map(({ recipe, score }) => (
              <Card key={recipe.id}>
                <CardContent className="pt-6">
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="font-semibold">{recipe.name}</p>
                    <Badge variant="secondary">
                      {score} {score === 1 ? "Zutat" : "Zutaten"} vorhanden
                    </Badge>
                  </div>
                  <p className="mb-2 text-sm text-muted-foreground">
                    {recipe.method} · {recipe.timeMinutes} Min. ·{" "}
                    {recipe.servings} Portionen
                    {recipe.onePot && " · One-Pot"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Zutaten: {recipe.ingredients.join(", ")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Alle Anleitungen findest du im{" "}
            <Link
              href="/rezepte"
              className="font-medium text-primary hover:underline"
            >
              Campfire-Rezeptbuch
            </Link>
            .
          </p>
        </>
      )}
    </div>
  );
}
