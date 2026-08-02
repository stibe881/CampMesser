import { useMemo, useState } from "react";
import {
  Baby,
  ChefHat,
  Clock,
  CookingPot,
  Flame,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { recipes, type Recipe } from "@/data/recipes";
import {
  RECIPE_DIFFICULTIES,
  RECIPE_METHODS,
  parseStringList,
} from "@shared/customRecipes";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  customRecipeToRecipe,
  type CustomRecipeRow,
} from "@/lib/customRecipesClient";
import { cn } from "@/lib/utils";

/** Editor für eigene Rezepte: erstellen und bearbeiten (Zutaten/Schritte zeilenweise). */
function RecipeEditorDialog({
  initial,
  onClose,
}: {
  initial: CustomRecipeRow | null;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [name, setName] = useState(initial?.name ?? "");
  const [method, setMethod] = useState<(typeof RECIPE_METHODS)[number]>(
    initial ? customRecipeToRecipe(initial).method : "Gaskocher"
  );
  const [difficulty, setDifficulty] = useState<
    (typeof RECIPE_DIFFICULTIES)[number]
  >(initial ? customRecipeToRecipe(initial).difficulty : "einfach");
  const [time, setTime] = useState(String(initial?.timeMinutes ?? 30));
  const [servings, setServings] = useState(String(initial?.servings ?? 4));
  const [onePot, setOnePot] = useState(initial?.onePot ?? false);
  const [kidFriendly, setKidFriendly] = useState(initial?.kidFriendly ?? false);
  const [ingredients, setIngredients] = useState(
    initial ? parseStringList(initial.ingredientsJson).join("\n") : ""
  );
  const [steps, setSteps] = useState(
    initial ? parseStringList(initial.stepsJson, 20).join("\n") : ""
  );
  const [tip, setTip] = useState(initial?.tip ?? "");

  const saveMutation = trpc.recipes.save.useMutation({
    onSuccess: () => {
      utils.recipes.list.invalidate();
      toast.success(initial ? "Rezept aktualisiert" : "Rezept gespeichert");
      onClose();
    },
    onError: e => toast.error(e.message || "Speichern fehlgeschlagen"),
  });

  const toLines = (value: string) =>
    value
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean);

  const canSave =
    name.trim() && toLines(ingredients).length > 0 && toLines(steps).length > 0;

  return (
    <DialogContent className="max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="font-serif text-xl">
          {initial ? "Rezept bearbeiten" : "Eigenes Rezept erstellen"}
        </DialogTitle>
        <DialogDescription>
          Dein Rezept erscheint im Rezeptbuch und wird bei den
          Kühlbox-Vorschlägen berücksichtigt.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label htmlFor="recipe-name">Name</Label>
          <Input
            id="recipe-name"
            className="mt-1.5"
            placeholder="z. B. Grosis Älplermagronen"
            value={name}
            maxLength={120}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1.5 block">Zubereitung</Label>
            <div className="flex flex-wrap gap-1.5">
              {RECIPE_METHODS.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
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
          </div>
          <div>
            <Label className="mb-1.5 block">Schwierigkeit</Label>
            <div className="flex gap-1.5">
              {RECIPE_DIFFICULTIES.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
                    difficulty === d
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                  aria-pressed={difficulty === d}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="recipe-time">Zeit (Minuten)</Label>
            <Input
              id="recipe-time"
              className="mt-1.5"
              type="number"
              min={5}
              max={600}
              value={time}
              onChange={e => setTime(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="recipe-servings">Portionen</Label>
            <Input
              id="recipe-servings"
              className="mt-1.5"
              type="number"
              min={1}
              max={20}
              value={servings}
              onChange={e => setServings(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
            One-Pot
            <Switch checked={onePot} onCheckedChange={setOnePot} />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
            Kinderfreundlich
            <Switch checked={kidFriendly} onCheckedChange={setKidFriendly} />
          </label>
        </div>
        <div>
          <Label htmlFor="recipe-ingredients">Zutaten (eine pro Zeile)</Label>
          <Textarea
            id="recipe-ingredients"
            className="mt-1.5 font-mono text-sm"
            rows={5}
            placeholder={"400 g Magronen\n200 g Bergkäse\n2 Zwiebeln"}
            value={ingredients}
            onChange={e => setIngredients(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="recipe-steps">
            Zubereitung (ein Schritt pro Zeile)
          </Label>
          <Textarea
            id="recipe-steps"
            className="mt-1.5 text-sm"
            rows={5}
            placeholder={
              "Wasser aufkochen und Magronen garen.\nZwiebeln rösten.\nAlles schichten und Käse schmelzen lassen."
            }
            value={steps}
            onChange={e => setSteps(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="recipe-tip">Tipp (optional)</Label>
          <Input
            id="recipe-tip"
            className="mt-1.5"
            placeholder="z. B. Mit Apfelmus servieren"
            value={tip}
            maxLength={600}
            onChange={e => setTip(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Abbrechen
          </Button>
          <Button
            className="flex-1"
            disabled={!canSave || saveMutation.isPending}
            onClick={() =>
              saveMutation.mutate({
                id: initial?.id,
                name: name.trim(),
                method,
                difficulty,
                timeMinutes: Math.min(600, Math.max(5, Number(time) || 30)),
                servings: Math.min(20, Math.max(1, Number(servings) || 4)),
                onePot,
                kidFriendly,
                ingredients: toLines(ingredients).slice(0, 30),
                steps: toLines(steps).slice(0, 20),
                tip: tip.trim() || null,
              })
            }
          >
            {saveMutation.isPending ? "Wird gespeichert …" : "Speichern"}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

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
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const customQuery = trpc.recipes.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  // null = Editor zu, "neu" = neues Rezept, sonst das zu bearbeitende
  const [editorState, setEditorState] = useState<
    CustomRecipeRow | "neu" | null
  >(null);
  const removeMutation = trpc.recipes.remove.useMutation({
    onSuccess: () => utils.recipes.list.invalidate(),
    onError: () => toast.error("Löschen fehlgeschlagen"),
  });

  // Eigene Rezepte zuoberst, dann die eingebauten
  const allRecipes = useMemo(
    () => [...(customQuery.data ?? []).map(customRecipeToRecipe), ...recipes],
    [customQuery.data]
  );

  const filtered = useMemo(() => {
    return allRecipes.filter(r => {
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
  }, [allRecipes, method, maxTime, search]);

  const customRowFor = (recipe: Recipe): CustomRecipeRow | undefined =>
    customQuery.data?.find(row => `eigenes-${row.id}` === recipe.id);

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

      {/* Eigenes Rezept erstellen */}
      {isAuthenticated && (
        <Button
          variant="outline"
          size="sm"
          className="mb-4"
          onClick={() => setEditorState("neu")}
        >
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Eigenes Rezept erstellen
        </Button>
      )}

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
              {customRowFor(recipe) && (
                <Badge className="gap-1 border-0 bg-primary/15 text-primary">
                  <ChefHat className="h-3 w-3" aria-hidden="true" />
                  Eigenes
                </Badge>
              )}
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

                {/* Eigene Rezepte lassen sich bearbeiten und löschen */}
                {customRowFor(selected) && (
                  <div className="flex gap-2 border-t border-border/60 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        const row = customRowFor(selected);
                        if (row) {
                          setSelected(null);
                          setEditorState(row);
                        }
                      }}
                    >
                      <Pencil className="mr-1.5 h-4 w-4" aria-hidden="true" />
                      Bearbeiten
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-destructive hover:text-destructive"
                      onClick={() => {
                        const row = customRowFor(selected);
                        if (
                          row &&
                          confirm(`Rezept «${selected.name}» wirklich löschen?`)
                        ) {
                          removeMutation.mutate({ id: row.id });
                          setSelected(null);
                        }
                      }}
                    >
                      <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                      Löschen
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={editorState !== null}
        onOpenChange={open => !open && setEditorState(null)}
      >
        {editorState !== null && (
          <RecipeEditorDialog
            initial={editorState === "neu" ? null : editorState}
            onClose={() => setEditorState(null)}
          />
        )}
      </Dialog>
    </div>
  );
}
