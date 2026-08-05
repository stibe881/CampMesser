import { useEffect, useMemo, useRef, useState } from "react";
import { useConfirm } from "@/components/ConfirmDialog";
import { ShareExpiryNote, ShareExpirySelect } from "@/components/ShareExpiry";
import type { ShareExpiryDays } from "@shared/sharing";
import {
  Baby,
  ChefHat,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  CookingPot,
  Dices,
  Flame,
  Heart,
  ImagePlus,
  Link2,
  MonitorSmartphone,
  Pause,
  Pencil,
  Play,
  Plus,
  QrCode,
  Refrigerator,
  RotateCcw,
  Scale,
  Search,
  Share2,
  ShoppingCart,
  Timer as TimerIcon,
  Trash2,
  Users,
  WifiOff,
  X,
} from "lucide-react";
import QRCode from "qrcode";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import KitchenConverterDialog from "@/components/KitchenConverter";
import PageHeader from "@/components/PageHeader";
import QueryError from "@/components/QueryError";
import ServingsStepper from "@/components/ServingsStepper";
import ShoppingTargetSelect, {
  useShoppingTarget,
} from "@/components/ShoppingTargetSelect";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { matchFoodItems } from "@shared/food";
import {
  formatRemaining,
  MAX_ACTIVE_TIMERS,
  MAX_TIMER_MINUTES,
  parseDurations,
  parseTimerMinutes,
  QUICK_TIMER_MINUTES,
} from "@shared/cookTimer";
import { pick } from "@shared/i18n";
import { clampServings, scaleIngredientsForServings } from "@shared/servings";
import { useI18n, useT } from "@/i18n";
import {
  isExpired,
  pauseCookTimer,
  remainingSeconds,
  removeCookTimer,
  resumeCookTimer,
  startCookTimer,
  useCookTimers,
} from "@/lib/cookTimers";
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
 * Küchen-Timer (#218) – Knöpfe für die im Schritt-Text gefundenen
 * Zeitangaben («15 Minuten köcheln» → Knopf «15 Minuten»). Ohne erkannte
 * Zeitangabe wird nichts gerendert.
 */
function StepTimerButtons({
  text,
  recipeId,
  recipeName,
}: {
  text: string;
  recipeId: string;
  recipeName: string;
}) {
  const t = useT();
  const durations = useMemo(() => parseDurations(text), [text]);
  if (durations.length === 0) return null;
  return (
    <span className="mt-1 flex flex-wrap gap-1.5">
      {durations.map(duration => (
        <button
          key={`${duration.label}-${duration.minutes}`}
          type="button"
          onClick={() =>
            startTimerWithToast(t, {
              name: `${duration.label} · ${recipeName}`,
              minutes: duration.minutes,
              recipeId,
            })
          }
          aria-label={t.cookTimer.stepTimerAria(duration.label)}
          className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/80"
        >
          <TimerIcon className="h-3 w-3" aria-hidden="true" />
          {duration.label}
        </button>
      ))}
    </span>
  );
}

/** Timer starten und das Ergebnis als Toast melden (gemeinsam genutzt). */
function startTimerWithToast(
  t: ReturnType<typeof useT>,
  options: { name: string; minutes: number; recipeId: string }
) {
  const id = startCookTimer(options);
  if (!id) {
    toast.error(t.cookTimer.tooMany(MAX_ACTIVE_TIMERS));
    return;
  }
  toast.success(t.cookTimer.started(options.minutes));
}

/**
 * Liste der laufenden Timer mit grosser Restzeit, Pause/Fortsetzen und
 * Abbrechen. Abgelaufene Timer bleiben als deutlicher Hinweis stehen, bis
 * sie quittiert werden.
 */
function RunningTimerList({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const { timers, now } = useCookTimers();
  if (timers.length === 0) return null;
  return (
    <ul className={cn("space-y-2", compact ? "mt-2" : "mt-3")}>
      {timers.map(timer => {
        const remaining = remainingSeconds(timer, now);
        const expired = isExpired(timer, now);
        const paused = timer.pausedSeconds !== null;
        const percent = expired
          ? 100
          : Math.min(
              100,
              Math.max(
                0,
                ((timer.totalSeconds - remaining) / timer.totalSeconds) * 100
              )
            );
        return (
          <li
            key={timer.id}
            className={cn(
              "rounded-lg border px-3 py-2",
              expired
                ? "border-destructive bg-destructive/10"
                : "border-border bg-muted/40"
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "font-mono font-bold tabular-nums",
                  compact ? "text-2xl" : "text-3xl",
                  expired && "text-destructive"
                )}
                aria-live={expired ? "polite" : "off"}
              >
                {formatRemaining(remaining)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {timer.name}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {expired
                    ? t.cookTimer.expired
                    : paused
                      ? t.cookTimer.pausedLabel
                      : t.cookTimer.runningLabel}
                </span>
              </span>
              {expired ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeCookTimer(timer.id)}
                  aria-label={t.cookTimer.dismissAria(timer.name)}
                >
                  {t.cookTimer.dismiss}
                </Button>
              ) : (
                <span className="flex shrink-0 gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() =>
                      paused
                        ? resumeCookTimer(timer.id)
                        : pauseCookTimer(timer.id)
                    }
                    aria-label={
                      paused
                        ? t.cookTimer.resumeAria(timer.name)
                        : t.cookTimer.pauseAria(timer.name)
                    }
                  >
                    {paused ? (
                      <Play className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Pause className="h-4 w-4" aria-hidden="true" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground/70 hover:text-destructive"
                    onClick={() => removeCookTimer(timer.id)}
                    aria-label={t.cookTimer.cancelAria(timer.name)}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </span>
              )}
            </div>
            {!expired && (
              <div
                className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-border"
                aria-hidden="true"
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-500",
                    paused ? "bg-muted-foreground/50" : "bg-primary"
                  )}
                  style={{ width: `${percent}%` }}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Timer-Abschnitt im Rezept-Detail: Schnellwahl-Chips, freie Minuten-Eingabe
 * und die Liste der laufenden Timer. Die Timer laufen über den Zielzeitpunkt
 * weiter, auch wenn der Dialog geschlossen oder die Seite gewechselt wird.
 */
function RecipeTimerSection({
  recipeId,
  recipeName,
}: {
  recipeId: string;
  recipeName: string;
}) {
  const t = useT();
  const [custom, setCustom] = useState("");

  const startCustom = () => {
    const minutes = parseTimerMinutes(custom);
    if (minutes === null) {
      toast.error(t.cookTimer.invalidMinutes(MAX_TIMER_MINUTES));
      return;
    }
    startTimerWithToast(t, { name: recipeName, minutes, recipeId });
    setCustom("");
  };

  return (
    <div className="rounded-lg border border-border p-3">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        <TimerIcon className="h-4 w-4" aria-hidden="true" />
        {t.cookTimer.title}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">{t.cookTimer.hint}</p>
      <div
        className="mt-2 flex flex-wrap gap-1.5"
        role="group"
        aria-label={t.cookTimer.quickAria}
      >
        {QUICK_TIMER_MINUTES.map(minutes => (
          <button
            key={minutes}
            type="button"
            onClick={() =>
              startTimerWithToast(t, { name: recipeName, minutes, recipeId })
            }
            className="rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {t.cookTimer.quickMinutes(minutes)}
          </button>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <Input
          className="max-w-32"
          type="number"
          min={1}
          max={MAX_TIMER_MINUTES}
          inputMode="numeric"
          value={custom}
          placeholder={t.cookTimer.customPlaceholder}
          aria-label={t.cookTimer.customLabel}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              startCustom();
            }
          }}
        />
        <Button variant="outline" size="sm" onClick={startCustom}>
          {t.cookTimer.startButton}
        </Button>
      </div>
      <RunningTimerList />
    </div>
  );
}

/**
 * Kochmodus: Vollbild mit einem Zubereitungsschritt pro Ansicht, grossen
 * Blätter-Flächen und aktivem Wake Lock (Display bleibt an, solange offen).
 * Funktioniert für eingebaute und eigene Rezepte gleichermassen.
 */
function CookingModeDialog({
  recipe,
  ingredients,
  onClose,
  onDestock,
}: {
  recipe: Recipe;
  /** Zutaten in der aktiven Sprache, bereits auf die Personenzahl umgerechnet */
  ingredients: string[];
  onClose: () => void;
  /** Nur eingeloggt gesetzt: Zutaten nach dem Kochen aus der Kühlbox austragen */
  onDestock?: () => void;
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
        <div className="mx-auto max-w-2xl">
          <p
            ref={stepRef}
            tabIndex={-1}
            aria-live="polite"
            className="text-2xl leading-relaxed outline-none sm:text-3xl"
          >
            {pick(recipe.steps[step] ?? "", lang)}
          </p>
          {/* Timer direkt zum Schritt (#218) – die Leiste im App-Rahmen liegt
              hinter dem Vollbild-Dialog, darum hier eine eigene Anzeige */}
          <StepTimerButtons
            text={pick(recipe.steps[step] ?? "", lang)}
            recipeId={recipe.id}
            recipeName={pick(recipe.name, lang)}
          />
          <RunningTimerList compact />
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
            {ingredients.map((ingredient, idx) => (
              <li key={idx} className="flex gap-2">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                  aria-hidden="true"
                />
                {ingredient}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Abschluss: Gekochtes gleich aus der Kühlbox austragen (#190) */}
      {isLast && onDestock && (
        <div className="border-t border-border px-4 pt-3 sm:px-6">
          <Button
            variant="outline"
            className="w-full"
            onClick={onDestock}
            aria-label={t.recipes.destockAria(pick(recipe.name, lang))}
          >
            <Refrigerator className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {t.recipes.destockButton}
          </Button>
        </div>
      )}

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
  const ask = useConfirm();
  const { lang, t } = useI18n();
  const [method, setMethod] = useState<(typeof methodFilters)[number]>("alle");
  const [maxTime, setMaxTime] = useState<string>("alle");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  // Kochmodus-Vollbild fürs aktuell geöffnete Rezept
  const [cookingMode, setCookingMode] = useState(false);
  // Detail-Dialog wurde über den Würfel geöffnet → «Nochmals würfeln» anbieten
  const [diceMode, setDiceMode] = useState(false);
  /**
   * Personenzahl im offenen Rezept (#231); null = Portionen des Rezepts.
   * Beim Schliessen des Detail-Dialogs wieder auf null – jedes Rezept startet
   * mit seiner eigenen Portionenzahl.
   */
  const [servings, setServings] = useState<number | null>(null);
  /** Mass- & Temperatur-Umrechner (#232) – offen/zu. */
  const [converterOpen, setConverterOpen] = useState(false);

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

  // ── Eigenes Rezept per Link teilen (#176, Muster geteilte Quizze) ──
  /** Rezept, dessen Teil-Link gerade im Dialog gezeigt wird. */
  const [recipeShare, setRecipeShare] = useState<{
    id: number;
    name: string;
    url: string;
    expiresAt: Date | null;
  } | null>(null);
  const [shareQr, setShareQr] = useState<string | null>(null);
  /** Im Dialog gewählte Gültigkeit; null = unbegrenzt. */
  const [shareExpiresIn, setShareExpiresIn] = useState<ShareExpiryDays | null>(
    null
  );

  // QR-Code zum Teil-Link erzeugen: einfach abscannen lassen
  useEffect(() => {
    if (!recipeShare) {
      setShareQr(null);
      return;
    }
    QRCode.toDataURL(recipeShare.url, {
      width: 480,
      margin: 1,
      errorCorrectionLevel: "M",
    })
      .then(setShareQr)
      .catch(() => setShareQr(null));
  }, [recipeShare]);

  const shareMutation = trpc.recipes.share.useMutation({
    onError: () => toast.error(t.recipes.shareFailed),
  });

  /** Teil-Link des Rezepts erzeugen (idempotent), Dialog öffnen, Link kopieren. */
  const openRecipeShare = (
    recipe: { id: number; name: string },
    // undefined = Gültigkeit unverändert lassen (Dialog nur öffnen)
    expiresInDays?: ShareExpiryDays | null
  ) => {
    shareMutation.mutate(
      { id: recipe.id, expiresInDays },
      {
        onSuccess: async ({ token, expiresAt }) => {
          const url = `${window.location.origin}/rezept/${token}`;
          setRecipeShare({
            id: recipe.id,
            name: recipe.name,
            url,
            expiresAt,
          });
          utils.recipes.list.invalidate();
          try {
            await navigator.clipboard.writeText(url);
            toast.success(t.recipes.shareCopied);
          } catch {
            // Zwischenablage blockiert – der Link steht im Dialog
          }
        },
      }
    );
  };

  const unshareMutation = trpc.recipes.unshare.useMutation({
    onSuccess: () => {
      utils.recipes.list.invalidate();
      setRecipeShare(null);
      toast.success(t.recipes.unshared);
    },
    onError: () => toast.error(t.recipes.unshareFailed),
  });

  // ── Gekochtes aus der Kühlbox austragen (#190) ──
  const foodQuery = trpc.food.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  /** Austragen-Dialog offen (Rezept steckt in `selected`). */
  const [destockOpen, setDestockOpen] = useState(false);
  /** Angehakte Kühlbox-Einträge (Ids) – beim Öffnen alle Treffer. */
  const [destockIds, setDestockIds] = useState<number[]>([]);

  /** Treffer zwischen den Zutaten des offenen Rezepts und der Kühlbox. */
  const destockMatches = useMemo(
    () =>
      selected
        ? matchFoodItems(
            selected.ingredients.map(i => pick(i, lang)),
            foodQuery.data ?? []
          )
        : [],
    [selected, lang, foodQuery.data]
  );

  const openDestock = () => {
    setDestockIds(destockMatches.map(m => m.item.id));
    setDestockOpen(true);
  };

  const removeFoodMutation = trpc.food.remove.useMutation();
  const [destockBusy, setDestockBusy] = useState(false);

  /** Die angehakten Einträge aus der Kühlbox entfernen. */
  const confirmDestock = async () => {
    const ids = destockIds;
    if (ids.length === 0) return;
    setDestockBusy(true);
    try {
      await Promise.all(ids.map(id => removeFoodMutation.mutateAsync({ id })));
      toast.success(t.recipes.destockDone(ids.length));
      setDestockOpen(false);
    } catch {
      toast.error(t.recipes.destockFailed);
    } finally {
      setDestockBusy(false);
      utils.food.list.invalidate();
    }
  };

  const [, navigate] = useLocation();
  // Ziel-Liste der Übernahme (#215): zuletzt genutzte Liste, wählbar sobald
  // es mehr als eine Liste gibt
  const shoppingTarget = useShoppingTarget(isAuthenticated);
  // Zutaten in der aktiven Sprache auf die Einkaufsliste übernehmen
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

  // Eigene Rezepte zuoberst, dann die eingebauten
  const allRecipes = useMemo(
    () => [...(customQuery.data ?? []).map(customRecipeToRecipe), ...recipes],
    [customQuery.data]
  );

  /**
   * Rücksprung aus der Timer-Leiste (#218): /rezepte?rezept=<id> öffnet
   * direkt das Rezept-Detail. Jede Id wird nur einmal geöffnet – wer den
   * Dialog schliesst, bekommt ihn nicht sofort wieder vorgesetzt.
   */
  const openedRecipeParam = useRef<string | null>(null);
  useEffect(() => {
    const wanted = new URLSearchParams(searchParams).get("rezept");
    if (!wanted) {
      openedRecipeParam.current = null;
      return;
    }
    if (openedRecipeParam.current === wanted) return;
    const found = allRecipes.find(r => r.id === wanted);
    if (!found) return;
    openedRecipeParam.current = wanted;
    setDiceMode(false);
    setSelected(found);
  }, [searchParams, allRecipes]);

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

  // ── Portionen skalieren (#231) ──
  /** Portionenzahl des offenen Rezepts (Grundlage der Umrechnung). */
  const baseServings = selected ? clampServings(selected.servings) : 4;
  /** Eingestellte Personenzahl – ohne eigene Wahl die des Rezepts. */
  const targetServings = servings ?? baseServings;
  /**
   * Zutaten in der aktiven Sprache, auf die eingestellte Personenzahl
   * umgerechnet. Bei gleicher Zahl kommen die Zeilen unverändert zurück.
   */
  const scaledIngredients = useMemo(
    () =>
      selected
        ? scaleIngredientsForServings(
            selected.ingredients.map(i => pick(i, lang)),
            baseServings,
            targetServings,
            lang
          )
        : [],
    [selected, baseServings, targetServings, lang]
  );

  /**
   * Zufallsrezept (#164): zieht ein zufälliges Rezept aus der aktuell
   * gefilterten Menge und öffnet dessen Detail-Dialog. Beim erneuten
   * Würfeln wird das gerade offene Rezept ausgeschlossen – nie zweimal
   * dasselbe hintereinander (ausser es gibt nur eines).
   */
  const rollRandomRecipe = () => {
    const pool =
      selected && filtered.length > 1
        ? filtered.filter(r => r.id !== selected.id)
        : filtered;
    if (pool.length === 0) return;
    setDiceMode(true);
    setSelected(pool[Math.floor(Math.random() * pool.length)]);
  };

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
          <span className="text-border" aria-hidden="true">
            ·
          </span>
          {/* Würfel: zufälliges Rezept aus der gefilterten Menge öffnen */}
          <button
            type="button"
            onClick={rollRandomRecipe}
            disabled={filtered.length === 0}
            aria-label={t.recipes.randomAria}
            className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50 disabled:hover:text-muted-foreground"
          >
            <Dices className="h-3.5 w-3.5" aria-hidden="true" />
            {t.recipes.randomButton}
          </button>
        </div>
      </div>

      {/* Eigenes Rezept erstellen & Mass-Umrechner */}
      <div className="mb-4 flex flex-wrap gap-2">
        {isAuthenticated && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditorState("neu")}
          >
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {t.recipes.createOwn}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          aria-label={t.converter.openAria}
          onClick={() => setConverterOpen(true)}
        >
          <Scale className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {t.converter.openButton}
        </Button>
      </div>

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
              onClick={() => {
                setDiceMode(false);
                setSelected(recipe);
              }}
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

      {/* Die mitgelieferten Rezepte stehen immer da – die EIGENEN kommen
          vom Server (#319). Fallen sie aus, fehlen sie kommentarlos
          mitten in der Liste, und es sieht aus, als seien sie weg. */}
      {customQuery.isError && (
        <div className="mb-4">
          <QueryError
            onRetry={() => void customQuery.refetch()}
            retrying={customQuery.isFetching}
          />
        </div>
      )}

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
            setDiceMode(false);
            setServings(null);
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
                    {t.servings.baseHint(baseServings)}
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
                {/* Mass- & Temperatur-Umrechner direkt aus dem Rezept (#232) */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  aria-label={t.converter.openAria}
                  onClick={() => setConverterOpen(true)}
                >
                  <Scale className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {t.converter.openButton}
                </Button>
                {/* Nur nach Würfel-Öffnung: direkt das nächste Rezept ziehen */}
                {diceMode && filtered.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={rollRandomRecipe}
                  >
                    <Dices className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    {t.recipes.randomAgain}
                  </Button>
                )}
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
                  {/* Portionen skalieren (#231): Mengen rechnen mit */}
                  <div className="mb-3 rounded-lg border border-border px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <span className="text-sm font-medium">
                        {t.servings.question}
                      </span>
                      <ServingsStepper
                        value={targetServings}
                        onChange={setServings}
                      />
                      {targetServings !== baseServings && (
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={t.servings.resetAria}
                          onClick={() => setServings(null)}
                        >
                          <RotateCcw
                            className="mr-1.5 h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                          {t.servings.reset}
                        </Button>
                      )}
                    </div>
                    {targetServings !== baseServings && (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {t.servings.scaledNote}
                      </p>
                    )}
                  </div>
                  <ul className="grid grid-cols-2 gap-1 text-sm">
                    {scaledIngredients.map((ingredient, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                          aria-hidden="true"
                        />
                        {ingredient}
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
                          listId: shoppingTarget.listId ?? undefined,
                          // Mengen in der eingestellten Personenzahl (#231)
                          names: scaledIngredients
                            .map(i => i.trim())
                            .filter(Boolean)
                            .map(i => ({
                              name: i.slice(0, 160),
                              // Herkunft als Notiz: «aus: Rezeptname»
                              note: t.shopping
                                .fromRecipe(pick(selected.name, lang))
                                .slice(0, 160),
                            })),
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
                  {isAuthenticated && (
                    <ShoppingTargetSelect
                      target={shoppingTarget}
                      className="mt-3 max-w-56"
                    />
                  )}
                  {/* Nach dem Kochen: Zutaten aus der Kühlbox austragen (#190) */}
                  {isAuthenticated && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-2 mt-3"
                      onClick={openDestock}
                      aria-label={t.recipes.destockAria(
                        pick(selected.name, lang)
                      )}
                    >
                      <Refrigerator
                        className="mr-1.5 h-4 w-4"
                        aria-hidden="true"
                      />
                      {t.recipes.destockButton}
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
                        <p className="min-w-0 flex-1 text-sm">
                          {pick(step, lang)}
                          {/* Zeitangabe im Schritt → Timer mit genau dieser Dauer */}
                          <StepTimerButtons
                            text={pick(step, lang)}
                            recipeId={selected.id}
                            recipeName={pick(selected.name, lang)}
                          />
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Küchen-Timer zum Rezept (#218) */}
                <RecipeTimerSection
                  recipeId={selected.id}
                  recipeName={pick(selected.name, lang)}
                />

                {selected.tip && (
                  <div className="rounded-lg bg-accent/60 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t.recipes.tipTitle}
                    </p>
                    <p className="mt-1 text-sm">{pick(selected.tip, lang)}</p>
                  </div>
                )}

                {/* Eigene Rezepte lassen sich teilen, bearbeiten und löschen */}
                {customRowFor(selected) && (
                  <div className="flex flex-wrap gap-2 border-t border-border/60 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={shareMutation.isPending}
                      aria-label={t.recipes.shareAria(
                        pick(selected.name, lang)
                      )}
                      onClick={() => {
                        const row = customRowFor(selected);
                        if (row)
                          openRecipeShare({ id: row.id, name: row.name });
                      }}
                    >
                      <Share2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                      {t.recipes.shareButton}
                    </Button>
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
                      onClick={async () => {
                        const row = customRowFor(selected);
                        if (
                          row &&
                          (await ask({
                            title: t.recipes.deleteConfirm(
                              pick(selected.name, lang)
                            ),
                          }))
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
            ingredients={scaledIngredients}
            onClose={() => setCookingMode(false)}
            onDestock={isAuthenticated ? openDestock : undefined}
          />
        )}
      </Dialog>

      {/* Gekochtes aus der Kühlbox austragen: Treffer bestätigen und entfernen */}
      <Dialog
        open={destockOpen}
        onOpenChange={open => !open && setDestockOpen(false)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {t.recipes.destockTitle}
            </DialogTitle>
            <DialogDescription>
              {t.recipes.destockDescription}
            </DialogDescription>
          </DialogHeader>
          {destockMatches.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              {t.recipes.destockNoMatches}
            </p>
          ) : (
            <div className="space-y-3">
              <ul className="space-y-1">
                {destockMatches.map(match => {
                  const checked = destockIds.includes(match.item.id);
                  return (
                    <li key={match.item.id}>
                      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={value =>
                            setDestockIds(prev =>
                              value === true
                                ? [...prev, match.item.id]
                                : prev.filter(id => id !== match.item.id)
                            )
                          }
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">
                            {match.item.name}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {t.recipes.destockMatchedBy(match.ingredient)}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDestockOpen(false)}
                >
                  {t.common.cancel}
                </Button>
                <Button
                  className="flex-1"
                  disabled={destockIds.length === 0 || destockBusy}
                  onClick={confirmDestock}
                >
                  {destockBusy
                    ? t.common.saving
                    : t.recipes.destockConfirm(destockIds.length)}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mass- & Temperatur-Umrechner (#232) – liegt über dem Rezept-Detail */}
      <Dialog open={converterOpen} onOpenChange={setConverterOpen}>
        {converterOpen && <KitchenConverterDialog />}
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

      {/* Teil-Link eines eigenen Rezepts: Link zum Kopieren + QR-Code */}
      <Dialog
        open={recipeShare !== null}
        onOpenChange={open => !open && setRecipeShare(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.recipes.shareTitle}</DialogTitle>
            <DialogDescription>{t.recipes.shareDescription}</DialogDescription>
          </DialogHeader>
          {recipeShare && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                <Link2
                  className="h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <code className="min-w-0 flex-1 truncate text-xs">
                  {recipeShare.url}
                </code>
                <button
                  type="button"
                  className="shrink-0 text-xs font-medium text-primary hover:underline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(recipeShare.url);
                      toast.success(t.common.linkCopied);
                    } catch {
                      toast.error(t.common.copyFailed);
                    }
                  }}
                >
                  {t.common.copy}
                </button>
              </div>
              {shareQr && (
                <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
                  {/* Weisser Rahmen, damit der Code auch im Dark Mode scannbar bleibt */}
                  <div className="shrink-0 rounded-md bg-white p-2 shadow-sm">
                    <img
                      src={shareQr}
                      alt={t.recipes.shareQrAlt(recipeShare.name)}
                      className="h-36 w-36"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-semibold">
                      <QrCode
                        className="h-4 w-4 text-primary"
                        aria-hidden="true"
                      />
                      {t.recipes.shareQrTitle}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.recipes.shareQrText}
                    </p>
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <ShareExpirySelect
                  value={shareExpiresIn}
                  onChange={days => {
                    setShareExpiresIn(days);
                    openRecipeShare(recipeShare, days);
                  }}
                />
                <ShareExpiryNote expiresAt={recipeShare.expiresAt} />
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={unshareMutation.isPending}
                onClick={() => unshareMutation.mutate({ id: recipeShare.id })}
              >
                {t.recipes.unshareButton}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
