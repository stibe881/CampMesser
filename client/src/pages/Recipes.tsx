import { useMemo, useState } from "react";
import {
  Baby,
  Clock,
  CookingPot,
  Flame,
  Search,
  Users,
  WifiOff,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { recipes, type Recipe } from "@/data/recipes";
import { cn } from "@/lib/utils";

const methodFilters = ["Alle", "Gaskocher", "Offenes Feuer"] as const;
const timeFilters = [
  { id: "alle", label: "Beliebig" },
  { id: "15", label: "≤ 15 Min." },
  { id: "30", label: "≤ 30 Min." },
] as const;

export default function RecipesPage() {
  const [method, setMethod] = useState<(typeof methodFilters)[number]>("Alle");
  const [maxTime, setMaxTime] = useState<string>("alle");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Recipe | null>(null);

  const filtered = useMemo(() => {
    return recipes.filter(r => {
      if (method !== "Alle" && r.method !== method && r.method !== "Beides")
        return false;
      if (maxTime !== "alle" && r.timeMinutes > Number(maxTime)) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const inName = r.name.toLowerCase().includes(q);
        const inIngredients = r.ingredients.some(i =>
          i.toLowerCase().includes(q)
        );
        if (!inName && !inIngredients) return false;
      }
      return true;
    });
  }, [method, maxTime, search]);

  return (
    <div className="container py-6">
      <PageHeader
        title="Campfire-Rezeptbuch"
        subtitle="Einfache Rezepte für Gaskocher und offenes Feuer – filterbar nach Zutaten und Zeit."
      />

      <div className="mb-4 flex items-center gap-2 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        Alle Rezepte sind in der App gespeichert und ohne Internetverbindung
        nutzbar.
      </div>

      {/* Filter */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            className="pl-9"
            placeholder="Nach Rezept oder Zutat suchen (z. B. «Bohnen») …"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Nach Rezept oder Zutat suchen"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex gap-1.5"
            role="group"
            aria-label="Nach Kochmethode filtern"
          >
            {methodFilters.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  method === m
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
                aria-pressed={method === m}
              >
                {m}
              </button>
            ))}
          </div>
          <span className="text-border" aria-hidden="true">
            ·
          </span>
          <div
            className="flex gap-1.5"
            role="group"
            aria-label="Nach Zubereitungszeit filtern"
          >
            {timeFilters.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setMaxTime(t.id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  maxTime === t.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
                aria-pressed={maxTime === t.id}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rezept-Karten */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(recipe => (
          <button
            key={recipe.id}
            type="button"
            onClick={() => setSelected(recipe)}
            className="flex flex-col items-start gap-2.5 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.99]"
            aria-label={`Rezept ${recipe.name} öffnen`}
          >
            {recipe.image && (
              <img
                src={recipe.image}
                alt={`Foto: ${recipe.name}`}
                loading="lazy"
                className="aspect-[4/3] w-full rounded-lg border border-border/60 object-cover"
              />
            )}
            <div className="flex w-full items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                {recipe.method === "Offenes Feuer" ? (
                  <Flame className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <CookingPot className="h-5 w-5" aria-hidden="true" />
                )}
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {recipe.timeMinutes} Min.
              </span>
            </div>
            <p className="font-semibold">{recipe.name}</p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary">{recipe.method}</Badge>
              {recipe.onePot && <Badge variant="outline">One-Pot</Badge>}
              {recipe.kidFriendly && (
                <Badge variant="outline" className="gap-1">
                  <Baby className="h-3 w-3" aria-hidden="true" />
                  Kinder
                </Badge>
              )}
            </div>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {recipe.ingredients.slice(0, 4).join(", ")} …
            </p>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-10 text-center text-muted-foreground">
          Keine Rezepte gefunden – versuche andere Filter oder Suchbegriffe.
        </p>
      )}

      {/* Rezept-Detail */}
      <Dialog
        open={selected !== null}
        onOpenChange={open => !open && setSelected(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">
                  {selected.name}
                </DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {selected.timeMinutes} Min.
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    {selected.servings} Portionen
                  </span>
                  <span>{selected.method}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {selected.image && (
                  <img
                    src={selected.image}
                    alt={`Foto: ${selected.name}`}
                    loading="lazy"
                    className="aspect-[4/3] w-full rounded-lg border border-border/60 object-cover"
                  />
                )}
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Zutaten
                  </h3>
                  <ul className="grid grid-cols-2 gap-1 text-sm">
                    {selected.ingredients.map(i => (
                      <li key={i} className="flex gap-2">
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                          aria-hidden="true"
                        />
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Zubereitung
                  </h3>
                  <ol className="space-y-2.5">
                    {selected.steps.map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          {i + 1}
                        </span>
                        <p className="text-sm">{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>

                {selected.tip && (
                  <div className="rounded-lg bg-accent/60 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Tipp
                    </p>
                    <p className="mt-1 text-sm">{selected.tip}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
