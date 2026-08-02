import { useEffect, useMemo, useRef, useState } from "react";
import {
  Baby,
  ChefHat,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  CookingPot,
  Flame,
  Heart,
  ImagePlus,
  MonitorSmartphone,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  Users,
  WifiOff,
} from "lucide-react";
import { useLocation, useSearch } from "wouter";
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
  RECIPE_DIFFICULTY_LABELS,
  RECIPE_METHODS,
  RECIPE_METHOD_LABELS,
  parseStringList,
} from "@shared/customRecipes";
import { pick } from "@shared/i18n";
import { useI18n } from "@/i18n";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  customRecipeToRecipe,
  recipePhotoUrl,
  type CustomRecipeRow,
} from "@/lib/customRecipesClient";
import { resizeImageForUpload } from "@/lib/imageResize";
import {
  loadRecipeFavorites,
  sanitizeRecipeFavorites,
  storeRecipeFavorites,
  toggleFavorite,
} from "@/lib/recipeFavorites";
import { useSyncedSetting } from "@/lib/useSyncedSetting";
import { useWakeLock } from "@/lib/useWakeLock";
import { cn } from "@/lib/utils";

/** Editor für eigene Rezepte: erstellen und bearbeiten (Zutaten/Schritte zeilenweise). */
function RecipeEditorDialog({
  initial,
  onClose,
}: {
  initial: CustomRecipeRow | null;
  onClose: () => void;
}) {
  const { lang, t } = useI18n();
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
  // Foto: neu ausgewählt (bereits verkleinert), Vorschau-URL und
  // «bestehendes Foto entfernen»-Wunsch – ausgeführt wird alles beim Speichern.
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Objekt-URL der Vorschau beim Ersetzen/Schliessen wieder freigeben
  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  const saveMutation = trpc.recipes.save.useMutation();
  const removePhotoMutation = trpc.recipes.removePhoto.useMutation();

  const toLines = (value: string) =>
    value
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean);

  const canSave =
    name.trim() && toLines(ingredients).length > 0 && toLines(steps).length > 0;

  // Aktuelle Vorschau: neues Foto > bestehendes Foto (sofern nicht entfernt)
  const previewUrl =
    photoPreviewUrl ??
    (initial?.imageFileName && !removePhoto
      ? recipePhotoUrl(initial.imageFileName)
      : null);

  const handlePhotoSelected = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (photoInputRef.current) photoInputRef.current.value = "";
    if (!file) return;
    try {
      const blob = await resizeImageForUpload(file);
      setPhotoBlob(blob);
      setPhotoPreviewUrl(URL.createObjectURL(blob));
      setRemovePhoto(false);
    } catch {
      // Dekodieren fehlgeschlagen – bei HEIC/HEIF gezielt darauf hinweisen
      const isHeic =
        /image\/hei[cf]/.test(file.type) || /\.hei[cf]$/i.test(file.name);
      toast.error(
        isHeic ? t.recipes.editor.photoHeic : t.recipes.editor.photoReadFailed
      );
    }
  };

  const handleRemovePhoto = () => {
    setPhotoBlob(null);
    setPhotoPreviewUrl(null);
    if (initial?.imageFileName) setRemovePhoto(true);
  };

  const handleSave = async () => {
    try {
      const { id } = await saveMutation.mutateAsync({
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
      });
      // Foto-Schritt nach dem Speichern: Upload ersetzt ein bestehendes
      // Foto serverseitig, Entfernen läuft über tRPC.
      if (photoBlob) {
        setPhotoUploading(true);
        try {
          const response = await fetch(`/api/recipes/${id}/photo`, {
            method: "POST",
            headers: { "Content-Type": "image/jpeg" },
            body: photoBlob,
            credentials: "include",
          });
          if (!response.ok) {
            toast.error(
              response.status === 413
                ? t.recipes.editor.photoTooLarge
                : t.recipes.editor.photoUploadFailed
            );
          }
        } catch {
          toast.error(t.recipes.editor.photoUploadFailed);
        } finally {
          setPhotoUploading(false);
        }
      } else if (removePhoto && initial?.imageFileName) {
        try {
          await removePhotoMutation.mutateAsync({ id });
        } catch {
          toast.error(t.recipes.editor.photoRemoveFailed);
        }
      }
      utils.recipes.list.invalidate();
      toast.success(
        initial ? t.recipes.editor.updated : t.recipes.editor.saved
      );
      onClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      toast.error(message || t.common.saveFailed);
    }
  };

  return (
    <DialogContent className="max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="font-serif text-xl">
          {initial ? t.recipes.editor.titleEdit : t.recipes.editor.titleNew}
        </DialogTitle>
        <DialogDescription>{t.recipes.editor.description}</DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label htmlFor="recipe-name">{t.recipes.editor.nameLabel}</Label>
          <Input
            id="recipe-name"
            className="mt-1.5"
            placeholder={t.recipes.editor.namePlaceholder}
            value={name}
            maxLength={120}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div>
          <Label className="mb-1.5 block">{t.recipes.editor.photoLabel}</Label>
          {previewUrl && (
            <img
              src={previewUrl}
              alt={t.recipes.editor.photoPreviewAlt}
              className="mb-2 aspect-[4/3] w-full rounded-lg border border-border/60 object-cover"
            />
          )}
          <div className="flex gap-2">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => handlePhotoSelected(e.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => photoInputRef.current?.click()}
            >
              <ImagePlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {previewUrl
                ? t.recipes.editor.photoChange
                : t.recipes.editor.photoChoose}
            </Button>
            {previewUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleRemovePhoto}
              >
                <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {t.recipes.editor.photoRemove}
              </Button>
            )}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {t.recipes.editor.photoHint}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1.5 block">
              {t.recipes.editor.methodLabel}
            </Label>
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
                  {pick(RECIPE_METHOD_LABELS[m], lang)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">
              {t.recipes.editor.difficultyLabel}
            </Label>
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
                  {pick(RECIPE_DIFFICULTY_LABELS[d], lang)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="recipe-time">{t.recipes.editor.timeLabel}</Label>
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
            <Label htmlFor="recipe-servings">
              {t.recipes.editor.servingsLabel}
            </Label>
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
            {t.recipes.editor.onePot}
            <Switch checked={onePot} onCheckedChange={setOnePot} />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
            {t.recipes.editor.kidFriendly}
            <Switch checked={kidFriendly} onCheckedChange={setKidFriendly} />
          </label>
        </div>
        <div>
          <Label htmlFor="recipe-ingredients">
            {t.recipes.editor.ingredientsLabel}
          </Label>
          <Textarea
            id="recipe-ingredients"
            className="mt-1.5 font-mono text-sm"
            rows={5}
            placeholder={t.recipes.editor.ingredientsPlaceholder}
            value={ingredients}
            onChange={e => setIngredients(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="recipe-steps">{t.recipes.editor.stepsLabel}</Label>
          <Textarea
            id="recipe-steps"
            className="mt-1.5 text-sm"
            rows={5}
            placeholder={t.recipes.editor.stepsPlaceholder}
            value={steps}
            onChange={e => setSteps(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="recipe-tip">{t.recipes.editor.tipLabel}</Label>
          <Input
            id="recipe-tip"
            className="mt-1.5"
            placeholder={t.recipes.editor.tipPlaceholder}
            value={tip}
            maxLength={600}
            onChange={e => setTip(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button
            className="flex-1"
            disabled={
              !canSave ||
              saveMutation.isPending ||
              removePhotoMutation.isPending ||
              photoUploading
            }
            onClick={handleSave}
          >
            {photoUploading
              ? t.recipes.editor.photoUploading
              : saveMutation.isPending || removePhotoMutation.isPending
                ? t.common.saving
                : t.common.save}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

/**
 * Kochmodus: Vollbild mit einem Zubereitungsschritt pro Ansicht, grossen
 * Blätter-Flächen und aktivem Wake Lock (Display bleibt an, solange offen).
 * Funktioniert für eingebaute und eigene Rezepte gleichermassen.
 */
function CookingModeDialog({
  recipe,
  onClose,
}: {
  recipe: Recipe;
  onClose: () => void;
}) {
  const { lang, t } = useI18n();
  const wakeLock = useWakeLock();
  const [step, setStep] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);
  const stepRef = useRef<HTMLParagraphElement>(null);
  const total = recipe.steps.length;
  const isLast = step >= total - 1;

  // Fokus auf den aktuellen Schritt setzen – Screenreader lesen ihn so
  // direkt vor, und die Pfeiltasten-Navigation bleibt im Dialog.
  useEffect(() => {
    stepRef.current?.focus({ preventScroll: false });
  }, [step]);

  return (
    <DialogContent
      className="left-0 top-0 flex h-dvh max-h-none w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0"
      aria-label={pick(recipe.name, lang)}
    >
      <DialogHeader className="border-b border-border px-4 py-3 text-left sm:px-6">
        <div className="flex items-center gap-3 pr-10">
          <DialogTitle className="min-w-0 flex-1 truncate font-serif text-lg">
            {pick(recipe.name, lang)}
          </DialogTitle>
          {wakeLock.active && (
            <Badge variant="secondary" className="shrink-0 gap-1">
              <MonitorSmartphone className="h-3 w-3" aria-hidden="true" />
              {t.common.screenAwake}
            </Badge>
          )}
        </div>
        <DialogDescription>
          {t.recipes.cookingStepProgress(step + 1, total)}
        </DialogDescription>
      </DialogHeader>

      {/* Der grosse Schritt-Text */}
      <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-10">
        <div className="mx-auto flex h-full max-w-2xl items-center">
          <p
            ref={stepRef}
            tabIndex={-1}
            aria-live="polite"
            className="text-2xl leading-relaxed outline-none sm:text-3xl"
          >
            {pick(recipe.steps[step] ?? "", lang)}
          </p>
        </div>
      </div>

      {/* Zutaten zum Nachschauen, ohne den Kochmodus zu verlassen */}
      <div className="border-t border-border px-4 sm:px-6">
        <button
          type="button"
          onClick={() => setShowIngredients(v => !v)}
          aria-expanded={showIngredients}
          aria-controls="cooking-ingredients"
          className="flex w-full items-center justify-between py-3 text-sm font-medium"
        >
          {showIngredients
            ? t.recipes.cookingIngredientsHide
            : t.recipes.cookingIngredientsShow}
          {showIngredients ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
        {showIngredients && (
          <ul
            id="cooking-ingredients"
            className="grid max-h-44 gap-x-4 gap-y-1 overflow-y-auto pb-3 text-sm sm:grid-cols-2"
          >
            {recipe.ingredients.map((i, idx) => (
              <li key={idx} className="flex gap-2">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                  aria-hidden="true"
                />
                {pick(i, lang)}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Grosse Blätter-Flächen */}
      <div className="grid grid-cols-2 gap-2 border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
        <Button
          variant="outline"
          className="h-16 text-base"
          disabled={step === 0}
          onClick={() => setStep(s => Math.max(0, s - 1))}
        >
          <ChevronLeft className="mr-1.5 h-5 w-5" aria-hidden="true" />
          {t.recipes.cookingPrev}
        </Button>
        {isLast ? (
          <Button className="h-16 text-base" onClick={onClose}>
            {t.recipes.cookingDone}
          </Button>
        ) : (
          <Button
            className="h-16 text-base"
            onClick={() => setStep(s => Math.min(total - 1, s + 1))}
          >
            {t.recipes.cookingNext}
            <ChevronRight className="ml-1.5 h-5 w-5" aria-hidden="true" />
          </Button>
        )}
      </div>
    </DialogContent>
  );
}

/** Filter-Schlüssel: «alle» plus die gespeicherten Methoden-Schlüssel. */
const methodFilters = ["alle", "Gaskocher", "Offenes Feuer"] as const;
/** Zubereitungszeit-Chips: «Beliebig», ≤ 20 Min. und ≤ 45 Min. (#163). */
const timeFilters = ["alle", "20", "45"] as const;

export default function RecipesPage() {
  const { lang, t } = useI18n();
  const [method, setMethod] = useState<(typeof methodFilters)[number]>("alle");
  const [maxTime, setMaxTime] = useState<string>("alle");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  // Kochmodus-Vollbild fürs aktuell geöffnete Rezept
  const [cookingMode, setCookingMode] = useState(false);

  // Favoriten: localStorage als schnelle Quelle, Geräte-Sync fürs Konto
  const [favorites, setFavorites] = useState<string[]>(() =>
    loadRecipeFavorites()
  );
  const favoritesSync = useSyncedSetting<string[]>("recipeFavorites", value => {
    const clean = sanitizeRecipeFavorites(value);
    setFavorites(clean);
    storeRecipeFavorites(clean);
  });
  const handleToggleFavorite = (recipeId: string) => {
    setFavorites(prev => {
      const next = toggleFavorite(prev, recipeId);
      storeRecipeFavorites(next);
      favoritesSync.push(next);
      return next;
    });
  };
  const isFavorite = (recipeId: string) => favorites.includes(recipeId);

  // Schnellaktion «Rezept suchen» (?suche=1): Fokus direkt ins Suchfeld
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearch();
  useEffect(() => {
    if (new URLSearchParams(searchParams).get("suche") !== "1") return;
    searchInputRef.current?.focus();
  }, [searchParams]);
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
    onError: () => toast.error(t.common.deleteFailed),
  });
  const [, navigate] = useLocation();
  // Zutaten in der aktiven Sprache auf die Einkaufsliste übernehmen
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

  // Eigene Rezepte zuoberst, dann die eingebauten
  const allRecipes = useMemo(
    () => [...(customQuery.data ?? []).map(customRecipeToRecipe), ...recipes],
    [customQuery.data]
  );

  const filtered = useMemo(() => {
    const matching = allRecipes.filter(r => {
      if (favoritesOnly && !favorites.includes(r.id)) return false;
      if (method !== "alle" && r.method !== method && r.method !== "Beides")
        return false;
      // Rezepte ohne (gültige) Zeitangabe bei aktivem Zeit-Filter ausblenden –
      // die Negation schliesst auch NaN/fehlende Werte aus.
      if (maxTime !== "alle" && !(r.timeMinutes <= Number(maxTime)))
        return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const inName = pick(r.name, lang).toLowerCase().includes(q);
        const inIngredients = r.ingredients.some(i =>
          pick(i, lang).toLowerCase().includes(q)
        );
        if (!inName && !inIngredients) return false;
      }
      return true;
    });
    // Favoriten zuoberst – innerhalb beider Gruppen bleibt die Reihenfolge stabil
    return [
      ...matching.filter(r => favorites.includes(r.id)),
      ...matching.filter(r => !favorites.includes(r.id)),
    ];
  }, [allRecipes, method, maxTime, search, lang, favorites, favoritesOnly]);

  const customRowFor = (recipe: Recipe): CustomRecipeRow | undefined =>
    customQuery.data?.find(row => `eigenes-${row.id}` === recipe.id);

  return (
    <div className="container py-6">
      <PageHeader title={t.recipes.title} subtitle={t.recipes.subtitle} />

      <div className="mb-4 flex items-center gap-2 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t.recipes.offlineNote}
      </div>

      {/* Filter */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            ref={searchInputRef}
            className="pl-9"
            placeholder={t.recipes.searchPlaceholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label={t.recipes.searchAria}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex gap-1.5"
            role="group"
            aria-label={t.recipes.methodFilterAria}
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
                {m === "alle"
                  ? t.recipes.filterAll
                  : pick(RECIPE_METHOD_LABELS[m], lang)}
              </button>
            ))}
          </div>
          <span className="text-border" aria-hidden="true">
            ·
          </span>
          <div
            className="flex gap-1.5"
            role="group"
            aria-label={t.recipes.timeFilterAria}
          >
            {timeFilters.map(id => (
              <button
                key={id}
                type="button"
                onClick={() => setMaxTime(id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  maxTime === id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
                aria-pressed={maxTime === id}
              >
                {id === "alle"
                  ? t.recipes.timeAny
                  : t.recipes.timeMax(Number(id))}
              </button>
            ))}
          </div>
          <span className="text-border" aria-hidden="true">
            ·
          </span>
          <button
            type="button"
            onClick={() => setFavoritesOnly(v => !v)}
            aria-pressed={favoritesOnly}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              favoritesOnly
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <Heart
              className={cn("h-3.5 w-3.5", favoritesOnly && "fill-current")}
              aria-hidden="true"
            />
            {t.recipes.favoritesFilter}
          </button>
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
          {t.recipes.createOwn}
        </Button>
      )}

      {/* Rezept-Karten */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(recipe => (
          <div key={recipe.id} className="relative">
            {/* Herz separat über der Karte – Buttons dürfen nicht verschachtelt sein */}
            <button
              type="button"
              onClick={() => handleToggleFavorite(recipe.id)}
              aria-pressed={isFavorite(recipe.id)}
              aria-label={
                isFavorite(recipe.id)
                  ? t.recipes.unfavoriteAria(pick(recipe.name, lang))
                  : t.recipes.favoriteAria(pick(recipe.name, lang))
              }
              className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 shadow-sm backdrop-blur-sm transition-colors hover:bg-background"
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  isFavorite(recipe.id)
                    ? "fill-red-500 text-red-500"
                    : "text-muted-foreground"
                )}
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              onClick={() => setSelected(recipe)}
              className="flex h-full w-full flex-col items-start gap-2.5 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.99]"
              aria-label={t.recipes.openRecipeAria(pick(recipe.name, lang))}
            >
              {recipe.image && (
                <img
                  src={recipe.image}
                  alt={t.recipes.photoAlt(pick(recipe.name, lang))}
                  loading="lazy"
                  className="aspect-[4/3] w-full rounded-lg border border-border/60 object-cover"
                />
              )}
              <div
                className={cn(
                  "flex w-full items-center justify-between",
                  !recipe.image && "pr-9"
                )}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  {recipe.method === "Offenes Feuer" ? (
                    <Flame className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <CookingPot className="h-5 w-5" aria-hidden="true" />
                  )}
                </span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {t.recipes.minutes(recipe.timeMinutes)}
                </span>
              </div>
              <p className="font-semibold">{pick(recipe.name, lang)}</p>
              <div className="flex flex-wrap gap-1.5">
                {customRowFor(recipe) && (
                  <Badge className="gap-1 border-0 bg-primary/15 text-primary">
                    <ChefHat className="h-3 w-3" aria-hidden="true" />
                    {t.recipes.ownBadge}
                  </Badge>
                )}
                <Badge variant="secondary">
                  {pick(RECIPE_METHOD_LABELS[recipe.method], lang)}
                </Badge>
                {recipe.onePot && (
                  <Badge variant="outline">{t.recipes.onePotBadge}</Badge>
                )}
                {recipe.kidFriendly && (
                  <Badge variant="outline" className="gap-1">
                    <Baby className="h-3 w-3" aria-hidden="true" />
                    {t.recipes.kidsBadge}
                  </Badge>
                )}
              </div>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {recipe.ingredients
                  .slice(0, 4)
                  .map(i => pick(i, lang))
                  .join(", ")}{" "}
                …
              </p>
            </button>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-10 text-center text-muted-foreground">
          {favoritesOnly && favorites.length === 0
            ? t.recipes.favoritesEmpty
            : t.recipes.emptyState}
        </p>
      )}

      {/* Rezept-Detail */}
      <Dialog
        open={selected !== null}
        onOpenChange={open => {
          if (!open) {
            setSelected(null);
            setCookingMode(false);
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">
                  {pick(selected.name, lang)}
                </DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {t.recipes.minutes(selected.timeMinutes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    {t.recipes.servings(selected.servings)}
                  </span>
                  <span>
                    {pick(RECIPE_METHOD_LABELS[selected.method], lang)}
                  </span>
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  aria-pressed={isFavorite(selected.id)}
                  onClick={() => handleToggleFavorite(selected.id)}
                >
                  <Heart
                    className={cn(
                      "mr-1.5 h-4 w-4",
                      isFavorite(selected.id) && "fill-red-500 text-red-500"
                    )}
                    aria-hidden="true"
                  />
                  {isFavorite(selected.id)
                    ? t.recipes.favoriteSaved
                    : t.recipes.favoriteSave}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={() => setCookingMode(true)}
                  aria-label={t.recipes.cookingModeAria(
                    pick(selected.name, lang)
                  )}
                >
                  <CookingPot className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {t.recipes.cookingMode}
                </Button>
              </div>

              <div className="space-y-4">
                {selected.image && (
                  <img
                    src={selected.image}
                    alt={t.recipes.photoAlt(pick(selected.name, lang))}
                    loading="lazy"
                    className="aspect-[4/3] w-full rounded-lg border border-border/60 object-cover"
                  />
                )}
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.recipes.ingredientsTitle}
                  </h3>
                  <ul className="grid grid-cols-2 gap-1 text-sm">
                    {selected.ingredients.map((i, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                          aria-hidden="true"
                        />
                        {pick(i, lang)}
                      </li>
                    ))}
                  </ul>
                  {isAuthenticated && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      disabled={addToShoppingMutation.isPending}
                      onClick={() =>
                        addToShoppingMutation.mutate({
                          names: selected.ingredients
                            .map(i => pick(i, lang).trim())
                            .filter(Boolean)
                            .map(i => i.slice(0, 160)),
                        })
                      }
                    >
                      <ShoppingCart
                        className="mr-1.5 h-4 w-4"
                        aria-hidden="true"
                      />
                      {t.shopping.addIngredients}
                    </Button>
                  )}
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.recipes.stepsTitle}
                  </h3>
                  <ol className="space-y-2.5">
                    {selected.steps.map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          {i + 1}
                        </span>
                        <p className="text-sm">{pick(step, lang)}</p>
                      </li>
                    ))}
                  </ol>
                </div>

                {selected.tip && (
                  <div className="rounded-lg bg-accent/60 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t.recipes.tipTitle}
                    </p>
                    <p className="mt-1 text-sm">{pick(selected.tip, lang)}</p>
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
                      {t.common.edit}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-destructive hover:text-destructive"
                      onClick={() => {
                        const row = customRowFor(selected);
                        if (
                          row &&
                          confirm(
                            t.recipes.deleteConfirm(pick(selected.name, lang))
                          )
                        ) {
                          removeMutation.mutate({ id: row.id });
                          // Gelöschte eigene Rezepte auch aus den Favoriten räumen
                          if (isFavorite(selected.id)) {
                            handleToggleFavorite(selected.id);
                          }
                          setSelected(null);
                        }
                      }}
                    >
                      <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                      {t.common.delete}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Kochmodus-Vollbild – liegt über dem Detail-Dialog */}
      <Dialog
        open={cookingMode && selected !== null}
        onOpenChange={open => !open && setCookingMode(false)}
      >
        {cookingMode && selected && (
          <CookingModeDialog
            recipe={selected}
            onClose={() => setCookingMode(false)}
          />
        )}
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
