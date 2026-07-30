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
  const query = trpc.food.list.useQuery(undefined, { enabled: isAuthenticated });
  const [name, setName] = useState("");

  const addMutation = trpc.food.add.useMutation({
    onSuccess: () => {
      utils.food.list.invalidate();
      setName("");
    },
    onError: () => toast.error("Eintrag konnte nicht gespeichert werden"),
  });
  const removeMutation = trpc.food.remove.useMutation({
    onSuccess: () => utils.food.list.invalidate(),
  });

  const foodNames = useMemo(() => (query.data ?? []).map(f => f.name), [query.data]);

  const suggestions = useMemo(() => {
    if (foodNames.length === 0) return [];
    return recipes
      .map(r => ({ recipe: r, score: matchScore(foodNames, r.ingredients) }))
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score || a.recipe.timeMinutes - b.recipe.timeMinutes)
      .slice(0, 5);
  }, [foodNames]);

  if (loading) {
    return (
      <div className="container flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Lädt" />
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

  const items = query.data ?? [];

  return (
    <div className="container max-w-2xl py-6">
      <PageHeader
        title="Kühlbox-Inventar"
        subtitle="Was ist noch da? Erfasse deine Vorräte und erhalte passende One-Pot-Rezeptvorschläge."
      />

      <form
        className="mb-5 flex gap-2"
        onSubmit={e => {
          e.preventDefault();
          if (!name.trim()) return;
          addMutation.mutate({ name: name.trim() });
        }}
      >
        <Input
          placeholder="z. B. Tomaten, Käse, Bohnen …"
          value={name}
          onChange={e => setName(e.target.value)}
          aria-label="Lebensmittel hinzufügen"
        />
        <Button type="submit" disabled={addMutation.isPending || !name.trim()} aria-label="Lebensmittel speichern">
          <Plus className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>

      {query.isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Lädt" />
        </div>
      ) : items.length > 0 ? (
        <div className="mb-8 flex flex-wrap gap-2">
          {items.map(item => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card py-1 pl-3.5 pr-1.5 text-sm font-medium"
            >
              {item.name}
              <button
                type="button"
                onClick={() => removeMutation.mutate({ id: item.id })}
                className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label={`${item.name} entfernen`}
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <div className="mb-8 rounded-xl border border-dashed border-border p-8 text-center">
          <Refrigerator className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" aria-hidden="true" />
          <p className="font-medium">Kühlbox noch leer</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Trage ein, was du dabei hast – wir schlagen dir passende Rezepte vor.
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
                    {recipe.method} · {recipe.timeMinutes} Min. · {recipe.servings} Portionen
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
            <Link href="/rezepte" className="font-medium text-primary hover:underline">
              Campfire-Rezeptbuch
            </Link>
            .
          </p>
        </>
      )}
    </div>
  );
}

