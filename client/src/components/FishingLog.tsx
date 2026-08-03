/**
 * Fangbuch (#236): eigene Angel-Fänge erfassen, auswerten und nachschlagen.
 *
 * Sitzt als Abschnitt auf der Natur-Seite – bewusst kein eigenes Modul: das
 * Fangbuch gehört zum Natur-Umfeld und teilt sich mit dem Sichtungs-Tagebuch
 * das Muster (Liste, Dialog, EIN Foto pro Eintrag über `createPhotoStorage`).
 *
 * Die Rechtslage ist heikel und darum überall sichtbar eingeordnet: Der
 * Datensatz in shared/fishing.ts trägt die Mindestvorgaben des Bundes (VBGF),
 * die Richtwert-Schonzeiten sind ausdrücklich NICHT verbindlich – massgebend
 * sind die kantonale Fischereiverordnung und das Patent.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BadgeInfo,
  BookOpenText,
  CalendarDays,
  Fish,
  ImagePlus,
  Info,
  Loader2,
  Pencil,
  Plus,
  Ruler,
  Trash2,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import LoginPrompt from "@/components/LoginPrompt";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  catchStats,
  checkCatch,
  FISHING_DATA_UPDATED,
  FISH_MAX_LENGTH_CM,
  FISH_MAX_WEIGHT_KG,
  FISH_SPECIES,
  filterCatches,
  findFishSpecies,
  VBGF_VERSION,
  type CatchHint,
  type CatchRecord,
  type DayWindow,
} from "@shared/fishing";
import { LOCALE_TAGS, pick, type Language } from "@shared/i18n";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { resizeImageForUpload } from "@/lib/imageResize";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

/** Private Foto-URL eines Fangs (Auth über Session-Cookie). */
function catchPhotoUrl(fileName: string): string {
  return `/api/catches/photos/${fileName}`;
}

/** Wert für «alle» in den Filter-Selects (Select kennt keinen Leerwert). */
const ALL = "__all__";
/** Wert für «eigene Art» im Arten-Select. */
const OWN_SPECIES = "__own__";

function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function fmtDate(iso: string, lang: Language): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(LOCALE_TAGS[lang], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Tag und Monat ohne Jahr, z. B. «1. Oktober» – für die Schonzeit-Fenster. */
function fmtDayMonth(month: number, day: number, lang: Language): string {
  return new Date(Date.UTC(2000, month - 1, day)).toLocaleDateString(
    LOCALE_TAGS[lang],
    { day: "numeric", month: "long", timeZone: "UTC" }
  );
}

function fmtWindow(window: DayWindow, lang: Language): [string, string] {
  return [
    fmtDayMonth(window.fromMonth, window.fromDay, lang),
    fmtDayMonth(window.toMonth, window.toDay, lang),
  ];
}

function fmtNumber(value: number, lang: Language): string {
  return value.toLocaleString(LOCALE_TAGS[lang], { maximumFractionDigits: 2 });
}

/** Zahl aus einem Eingabefeld (Komma erlaubt); leer/Unsinn ergibt null. */
function parseNumber(raw: string): number | null {
  const value = Number(raw.replace(",", ".").trim());
  return raw.trim() !== "" && Number.isFinite(value) ? value : null;
}

interface CatchFormState {
  id?: number;
  speciesId: string;
  speciesName: string;
  caughtAt: string;
  caughtTime: string;
  lengthCm: string;
  weightKg: string;
  water: string;
  method: string;
  released: boolean;
  note: string;
  fileName: string | null;
}

const HINT_STYLES: Record<CatchHint["level"], string> = {
  danger: "border-destructive/40 bg-destructive/10 text-destructive",
  warning: "border-chart-4/50 bg-chart-4/15 text-foreground",
  info: "border-border bg-accent/50 text-muted-foreground",
};

export default function FishingLog() {
  const { lang, t } = useI18n();
  const tf = t.fishing;
  const { isAuthenticated, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  const query = trpc.fishing.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const emptyForm: CatchFormState = {
    speciesId: OWN_SPECIES,
    speciesName: "",
    caughtAt: todayIso(),
    caughtTime: "",
    lengthCm: "",
    weightKg: "",
    water: "",
    method: "",
    released: false,
    note: "",
    fileName: null,
  };
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CatchFormState>(emptyForm);
  const [speciesFilter, setSpeciesFilter] = useState(ALL);
  const [waterFilter, setWaterFilter] = useState(ALL);
  // Foto: neu ausgewählt (bereits verkleinert), Vorschau-URL und
  // «bestehendes Foto entfernen»-Wunsch – ausgeführt wird alles beim Speichern.
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  const addMutation = trpc.fishing.add.useMutation();
  const updateMutation = trpc.fishing.update.useMutation();
  const removePhotoMutation = trpc.fishing.removePhoto.useMutation();
  const removeMutation = trpc.fishing.remove.useMutation({
    onSuccess: () => {
      void utils.fishing.list.invalidate();
      toast.success(tf.deleted);
    },
    onError: () => toast.error(t.common.deleteFailed),
  });

  const catches = useMemo(() => query.data ?? [], [query.data]);
  const stats = useMemo(() => catchStats(catches as CatchRecord[]), [catches]);
  const visible = useMemo(
    () =>
      filterCatches(catches as CatchRecord[], {
        speciesKey: speciesFilter === ALL ? null : speciesFilter,
        water: waterFilter === ALL ? null : waterFilter,
      }) as typeof catches,
    [catches, speciesFilter, waterFilter]
  );

  const resetPhotoState = () => {
    setPhotoBlob(null);
    setPhotoPreviewUrl(null);
    setRemovePhoto(false);
  };

  const openNew = () => {
    setForm({ ...emptyForm, caughtAt: todayIso() });
    resetPhotoState();
    setDialogOpen(true);
  };

  const openEdit = (entry: (typeof catches)[number]) => {
    setForm({
      id: entry.id,
      speciesId: entry.speciesId ?? OWN_SPECIES,
      speciesName: entry.speciesName,
      caughtAt: entry.caughtAt,
      caughtTime: entry.caughtTime ?? "",
      lengthCm: entry.lengthCm === null ? "" : String(entry.lengthCm),
      weightKg: entry.weightKg === null ? "" : String(entry.weightKg),
      water: entry.water,
      method: entry.method ?? "",
      released: entry.released,
      note: entry.note ?? "",
      fileName: entry.fileName ?? null,
    });
    resetPhotoState();
    setDialogOpen(true);
  };

  const previewUrl =
    photoPreviewUrl ??
    (form.fileName && !removePhoto ? catchPhotoUrl(form.fileName) : null);

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
      const isHeic =
        /image\/hei[cf]/.test(file.type) || /\.hei[cf]$/i.test(file.name);
      toast.error(isHeic ? tf.photoHeic : tf.photoReadFailed);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoBlob(null);
    setPhotoPreviewUrl(null);
    if (form.fileName) setRemovePhoto(true);
  };

  /** Arten-Auswahl füllt den Namen als Vorschlag vor (bleibt editierbar). */
  const handleSpeciesSelected = (value: string) => {
    setForm(prev => {
      const species = findFishSpecies(value === OWN_SPECIES ? null : value);
      return {
        ...prev,
        speciesId: value,
        speciesName: species ? pick(species.name, lang) : prev.speciesName,
      };
    });
  };

  // Live-Prüfung im Dialog: Schonzeit-Richtwert und Fangmindestmass des Bundes
  const selectedSpecies = findFishSpecies(
    form.speciesId === OWN_SPECIES ? null : form.speciesId
  );
  const hints = useMemo(
    () =>
      checkCatch(selectedSpecies, {
        lengthCm: parseNumber(form.lengthCm),
        date: new Date(`${form.caughtAt || todayIso()}T12:00:00`),
      }),
    [selectedSpecies, form.lengthCm, form.caughtAt]
  );

  const hintText = (hint: CatchHint): string => {
    switch (hint.code) {
      case "ban":
        return tf.hints.ban;
      case "report":
        return tf.hints.report;
      case "closedSeason":
        return tf.hints.closedSeason;
      case "underMinLength":
        return tf.hints.underMinLength(hint.minLengthCm ?? 0);
      case "nearMinLength":
        return tf.hints.nearMinLength(hint.minLengthCm ?? 0);
      default:
        return tf.hints.cantonal;
    }
  };

  const submit = async () => {
    const speciesName = form.speciesName.trim();
    if (!speciesName) {
      toast.error(tf.nameRequired);
      return;
    }
    const water = form.water.trim();
    if (!water) {
      toast.error(tf.waterRequired);
      return;
    }
    const data = {
      speciesId: form.speciesId === OWN_SPECIES ? null : form.speciesId,
      speciesName,
      lengthCm: parseNumber(form.lengthCm),
      weightKg: parseNumber(form.weightKg),
      water,
      caughtAt: form.caughtAt || todayIso(),
      caughtTime: form.caughtTime || null,
      method: form.method.trim() || null,
      released: form.released,
      note: form.note.trim() || null,
    };
    try {
      let id: number;
      if (form.id) {
        await updateMutation.mutateAsync({ id: form.id, ...data });
        id = form.id;
      } else {
        ({ id } = await addMutation.mutateAsync(data));
      }
      // Foto-Schritt nach dem Speichern: Upload ersetzt ein bestehendes
      // Foto serverseitig, Entfernen läuft über tRPC.
      if (photoBlob) {
        setPhotoUploading(true);
        try {
          const response = await fetch(`/api/catches/${id}/photo`, {
            method: "POST",
            headers: { "Content-Type": "image/jpeg" },
            body: photoBlob,
            credentials: "include",
          });
          if (!response.ok) {
            toast.error(
              response.status === 413 ? tf.photoTooLarge : tf.photoUploadFailed
            );
          }
        } catch {
          toast.error(tf.photoUploadFailed);
        } finally {
          setPhotoUploading(false);
        }
      } else if (removePhoto && form.fileName) {
        try {
          await removePhotoMutation.mutateAsync({ id });
        } catch {
          toast.error(tf.photoRemoveFailed);
        }
      }
      void utils.fishing.list.invalidate();
      setDialogOpen(false);
      toast.success(form.id ? tf.updated : tf.created);
    } catch {
      toast.error(t.common.saveFailed);
    }
  };

  const saving =
    addMutation.isPending || updateMutation.isPending || photoUploading;

  return (
    <section
      className="mb-6 rounded-xl border border-border bg-card p-4"
      aria-label={tf.sectionAria}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Fish className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 className="font-serif text-lg font-semibold">{tf.title}</h2>
        {isAuthenticated && stats.total > 0 && (
          <span className="text-xs text-muted-foreground">
            {tf.count(stats.total)}
          </span>
        )}
        {isAuthenticated && (
          <Button
            size="sm"
            className="ml-auto"
            onClick={openNew}
            aria-label={tf.addAria}
          >
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {tf.addButton}
          </Button>
        )}
      </div>
      <p className="mb-3 text-sm text-muted-foreground">{tf.intro}</p>

      <div className="mb-4 flex gap-2.5 rounded-lg border border-chart-4/50 bg-chart-4/15 p-3">
        <AlertTriangle
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-glow"
          aria-hidden="true"
        />
        <div className="text-sm">
          <p className="font-semibold">{tf.legalTitle}</p>
          <p className="mt-1">{tf.legalText}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {tf.legalSource(VBGF_VERSION, fmtDate(FISHING_DATA_UPDATED, lang))}
          </p>
        </div>
      </div>

      {!authLoading && !isAuthenticated ? (
        <LoginPrompt feature={tf.loginFeature} />
      ) : query.isLoading || authLoading ? (
        <div className="flex justify-center py-8">
          <Loader2
            className="h-6 w-6 animate-spin text-muted-foreground"
            aria-label={t.common.loading}
          />
        </div>
      ) : query.isError ? (
        <p className="text-sm text-destructive">{tf.loadFailed}</p>
      ) : catches.length === 0 ? (
        <p className="rounded-lg bg-accent/50 p-3 text-sm text-muted-foreground">
          {tf.empty}
        </p>
      ) : (
        <>
          <div className="mb-4 grid gap-2 sm:grid-cols-2">
            <div>
              <Label htmlFor="catch-filter-species">
                {tf.filterSpeciesLabel}
              </Label>
              <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
                <SelectTrigger
                  id="catch-filter-species"
                  aria-label={tf.filterSpeciesLabel}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{tf.filterAll}</SelectItem>
                  {stats.records.map(record => (
                    <SelectItem key={record.key} value={record.key}>
                      {record.speciesId
                        ? pick(findFishSpecies(record.speciesId)!.name, lang)
                        : record.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="catch-filter-water">{tf.filterWaterLabel}</Label>
              <Select value={waterFilter} onValueChange={setWaterFilter}>
                <SelectTrigger
                  id="catch-filter-water"
                  aria-label={tf.filterWaterLabel}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{tf.filterAll}</SelectItem>
                  {stats.waters.map(water => (
                    <SelectItem key={water} value={water}>
                      {water}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="rounded-lg bg-accent/50 p-3 text-sm text-muted-foreground">
              {tf.filterEmpty}
            </p>
          ) : (
            <ul className="space-y-3">
              {visible.map(entry => {
                const species = findFishSpecies(entry.speciesId);
                const name = species
                  ? pick(species.name, lang)
                  : entry.speciesName;
                return (
                  <li
                    key={entry.id}
                    className="flex gap-3 rounded-lg border border-border/60 bg-background p-3"
                  >
                    {entry.fileName && (
                      <img
                        src={catchPhotoUrl(entry.fileName)}
                        alt={tf.photoAlt(name)}
                        loading="lazy"
                        className="h-16 w-16 shrink-0 rounded-md border border-border/60 object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">
                        {fmtDate(entry.caughtAt, lang)}
                        {entry.caughtTime ? ` · ${entry.caughtTime}` : ""}
                        {` · ${entry.water}`}
                      </p>
                      <p className="font-semibold">{name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {entry.lengthCm !== null && (
                          <Badge className="border-0 bg-primary/15 text-primary">
                            {tf.lengthShort(fmtNumber(entry.lengthCm, lang))}
                          </Badge>
                        )}
                        {entry.weightKg !== null && (
                          <Badge className="border-0 bg-primary/15 text-primary">
                            {tf.weightShort(fmtNumber(entry.weightKg, lang))}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={cn(
                            "border",
                            entry.released
                              ? "border-chart-2/50 text-foreground"
                              : "border-border text-muted-foreground"
                          )}
                        >
                          {entry.released ? tf.released : tf.kept}
                        </Badge>
                        {entry.method && (
                          <span className="text-xs text-muted-foreground">
                            {entry.method}
                          </span>
                        )}
                      </div>
                      {entry.note && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {entry.note}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={() => openEdit(entry)}
                        aria-label={tf.editAria(name)}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          if (confirm(tf.deleteConfirm(name))) {
                            removeMutation.mutate({ id: entry.id });
                          }
                        }}
                        aria-label={tf.deleteAria(name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-5 border-t border-border/60 pt-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" aria-hidden="true" />
              <h3 className="font-semibold">{tf.statsTitle}</h3>
              <span className="ml-auto text-sm text-muted-foreground">
                {tf.statsSummary(stats.total, stats.released, stats.kept)}
              </span>
            </div>
            <h4 className="mb-1.5 mt-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {tf.recordsTitle}
            </h4>
            <ul className="space-y-1.5">
              {stats.records.map(record => (
                <li
                  key={record.key}
                  className="flex flex-wrap items-baseline gap-x-2 rounded-lg bg-accent/50 px-3 py-2 text-sm"
                >
                  <span className="font-medium">
                    {record.speciesId
                      ? pick(findFishSpecies(record.speciesId)!.name, lang)
                      : record.name}
                  </span>
                  <span>
                    {record.bestLengthCm === null
                      ? tf.recordNoLength
                      : tf.lengthShort(fmtNumber(record.bestLengthCm, lang))}
                    {record.bestWeightKg !== null &&
                      ` · ${tf.weightShort(fmtNumber(record.bestWeightKg, lang))}`}
                  </span>
                  {record.bestOn && (
                    <span className="text-xs text-muted-foreground">
                      {fmtDate(record.bestOn, lang)}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {tf.recordCount(record.count)}
                  </span>
                </li>
              ))}
            </ul>
            <h4 className="mb-1.5 mt-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {tf.yearsTitle}
            </h4>
            <ul className="space-y-1.5">
              {stats.years.map(year => (
                <li
                  key={year.year}
                  className="flex items-baseline gap-2 rounded-lg bg-accent/50 px-3 py-2 text-sm"
                >
                  <span className="font-medium">{year.year}</span>
                  <span className="ml-auto text-muted-foreground">
                    {tf.yearLine(year.count, year.released)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* Nachschlagewerk: Arten mit Bundeswerten – auch ohne Anmeldung sichtbar */}
      <div className="mt-5 border-t border-border/60 pt-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <BookOpenText className="h-4 w-4 text-primary" aria-hidden="true" />
          <h3 className="font-semibold">{tf.speciesTitle}</h3>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">{tf.speciesIntro}</p>
        <Accordion type="single" collapsible className="space-y-2">
          {FISH_SPECIES.map(species => (
            <AccordionItem
              key={species.id}
              value={species.id}
              className="overflow-hidden rounded-lg border border-border bg-background px-0"
            >
              <AccordionTrigger className="px-3 py-2.5 hover:no-underline">
                <div className="flex-1 text-left">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    {pick(species.name, lang)}
                    {species.federal.banned && (
                      <Badge className="border-0 bg-destructive/15 text-destructive">
                        {tf.bannedBadge}
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs italic text-muted-foreground">
                    {species.latin} · {tf.waters[species.waters]}
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-2.5 px-3 pb-3 text-sm">
                <p className="flex items-start gap-2">
                  <Ruler
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span>
                    {species.federal.minLengthCm === null
                      ? tf.federalMinNone
                      : tf.federalMin(species.federal.minLengthCm)}
                    {" · "}
                    {species.federal.closedWeeks === null
                      ? tf.federalWeeksNone
                      : tf.federalWeeks(species.federal.closedWeeks)}
                  </span>
                </p>
                {species.federal.note && (
                  <p className="text-muted-foreground">
                    {pick(species.federal.note, lang)}
                  </p>
                )}
                <p className="flex items-start gap-2">
                  <CalendarDays
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span>
                    {species.guideClosedSeason
                      ? tf.guideSeason(
                          ...fmtWindow(species.guideClosedSeason, lang)
                        )
                      : tf.guideSeasonNone}
                    <span className="block text-xs text-muted-foreground">
                      {tf.guideSeasonHint}
                    </span>
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <BadgeInfo
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span>
                    <span className="font-semibold">{tf.cantonTitle}</span>{" "}
                    {pick(species.cantonHint, lang)}
                  </span>
                </p>
                <p>
                  <span className="font-semibold">{tf.habitatTitle}</span>{" "}
                  {pick(species.habitat, lang)}
                </p>
                <p>
                  <span className="font-semibold">{tf.methodTitle}</span>{" "}
                  {pick(species.method, lang)}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <p className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {tf.measureHint}
        </p>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {form.id ? tf.dialogTitleEdit : tf.dialogTitleNew}
            </DialogTitle>
            <DialogDescription>{tf.dialogDescription}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="catch-species">{tf.speciesLabel}</Label>
              <Select
                value={form.speciesId}
                onValueChange={handleSpeciesSelected}
              >
                <SelectTrigger id="catch-species" aria-label={tf.speciesLabel}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={OWN_SPECIES}>{tf.speciesOwn}</SelectItem>
                  {FISH_SPECIES.map(species => (
                    <SelectItem key={species.id} value={species.id}>
                      {pick(species.name, lang)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hints.length > 0 && (
              <ul className="space-y-1.5" aria-live="polite">
                {hints.map(hint => (
                  <li
                    key={hint.code}
                    className={cn(
                      "flex gap-2 rounded-lg border p-2.5 text-sm",
                      HINT_STYLES[hint.level]
                    )}
                  >
                    {hint.level === "info" ? (
                      <Info
                        className="mt-0.5 h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                    ) : (
                      <AlertTriangle
                        className="mt-0.5 h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    <span>{hintText(hint)}</span>
                  </li>
                ))}
              </ul>
            )}

            <div>
              <Label htmlFor="catch-name">{tf.nameLabel}</Label>
              <Input
                id="catch-name"
                value={form.speciesName}
                onChange={e =>
                  setForm(prev => ({ ...prev, speciesName: e.target.value }))
                }
                placeholder={tf.namePlaceholder}
                maxLength={120}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="catch-date">{tf.dateLabel}</Label>
                <Input
                  id="catch-date"
                  type="date"
                  value={form.caughtAt}
                  onChange={e =>
                    setForm(prev => ({ ...prev, caughtAt: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="catch-time">{tf.timeLabel}</Label>
                <Input
                  id="catch-time"
                  type="time"
                  value={form.caughtTime}
                  onChange={e =>
                    setForm(prev => ({ ...prev, caughtTime: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="catch-length">{tf.lengthLabel}</Label>
                <Input
                  id="catch-length"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={FISH_MAX_LENGTH_CM}
                  step="0.5"
                  value={form.lengthCm}
                  onChange={e =>
                    setForm(prev => ({ ...prev, lengthCm: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="catch-weight">{tf.weightLabel}</Label>
                <Input
                  id="catch-weight"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={FISH_MAX_WEIGHT_KG}
                  step="0.01"
                  value={form.weightKg}
                  onChange={e =>
                    setForm(prev => ({ ...prev, weightKg: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="catch-water">{tf.waterLabel}</Label>
              <Input
                id="catch-water"
                value={form.water}
                onChange={e =>
                  setForm(prev => ({ ...prev, water: e.target.value }))
                }
                placeholder={tf.waterPlaceholder}
                maxLength={120}
              />
            </div>
            <div>
              <Label htmlFor="catch-method">{tf.methodLabel}</Label>
              <Input
                id="catch-method"
                value={form.method}
                onChange={e =>
                  setForm(prev => ({ ...prev, method: e.target.value }))
                }
                placeholder={tf.methodPlaceholder}
                maxLength={120}
              />
            </div>
            <div className="flex items-center gap-2.5">
              <Checkbox
                id="catch-released"
                checked={form.released}
                onCheckedChange={checked =>
                  setForm(prev => ({ ...prev, released: checked === true }))
                }
              />
              <Label htmlFor="catch-released" className="font-normal">
                {tf.releasedLabel}
              </Label>
            </div>
            <div>
              <Label htmlFor="catch-note">{tf.noteLabel}</Label>
              <Textarea
                id="catch-note"
                value={form.note}
                onChange={e =>
                  setForm(prev => ({ ...prev, note: e.target.value }))
                }
                placeholder={tf.notePlaceholder}
                maxLength={500}
                rows={3}
              />
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium">{tf.photoLabel}</p>
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt={tf.photoPreviewAlt}
                  className="mb-2 aspect-[4/3] w-full rounded-lg border border-border/60 object-cover"
                />
              )}
              <div className="flex gap-2">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => void handlePhotoSelected(e.target.files)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => photoInputRef.current?.click()}
                >
                  <ImagePlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {previewUrl ? tf.photoChange : tf.photoChoose}
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
                    {tf.photoRemove}
                  </Button>
                )}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {tf.photoHint}
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => void submit()}
              disabled={saving}
            >
              {saving && (
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              {photoUploading ? tf.photoUploading : t.common.save}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
