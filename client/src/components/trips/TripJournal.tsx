import { useMemo, useRef, useState } from "react";
import {
  fmtDayMonth,
  fmtMedium,
  fmtShort,
  fmtWeekdayLong,
} from "@/lib/dateFormat";
import { relativeAge, type ShareExpiryDays } from "@shared/sharing";
import { currentTripStop } from "@shared/tripStops";
import {
  ArrowRight,
  Award,
  BookOpen,
  Camera,
  CalendarClock,
  CalendarPlus,
  Clock,
  CalendarDays,
  ChevronDown,
  CloudSun,
  Copy,
  Eye,
  EyeOff,
  CopyPlus,
  Download,
  Fuel,
  Gauge,
  GraduationCap,
  LayoutGrid,
  List,
  ListChecks,
  Loader2,
  LogOut,
  MapPin,
  MapPinned,
  MessageSquare,
  Moon,
  Pencil,
  Pin,
  Plus,
  Printer,
  Share2,
  ShoppingBasket,
  Signpost,
  Sparkles,
  Star,
  Tent,
  Trash2,
  Trophy,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { resizeImageForUpload } from "@/lib/imageResize";
import { useI18n, useT } from "@/i18n";
import { LOCALE_TAGS, pick, type Language } from "@shared/i18n";
import {
  COLLAGE_LAYOUTS,
  collageCapacity,
  type CollageLayoutId,
} from "@shared/collageLayout";
import { cn } from "@/lib/utils";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_DESCRIPTION_MAX_LENGTH,
  EXPENSE_MAX_RAPPEN,
  EXPENSE_PAID_BY_MAX_LENGTH,
  expensesByCategory,
  budgetStatus,
  BUDGET_MAX_RAPPEN,
  expensesTotalRappen,
  normalizeExpenseCategory,
  settleUp,
  type ExpenseCategory,
} from "@shared/expenses";
import {
  computeTripStats,
  computeYearReview,
  daysUntilTrip,
  isUpcomingTrip,
  nightsPerYear,
  TRIP_JOURNAL_MAX_LENGTH,
  tripNights,
} from "@shared/trips";
import {
  TRIP_BOARD_KINDS,
  TRIP_BOARD_KIND_LABELS,
  TRIP_BOARD_TEXT_MAX_LENGTH,
  isValidTripBoardText,
  normalizeTripBoardKind,
  tripBoardCounts,
  type TripBoardKind,
} from "@shared/tripBoard";
import { buildTripIcs, icsFileName, type IcsTrip } from "@shared/ics";
import { tripDays } from "@shared/menuPlan";
import {
  countMainSlots,
  tripReadiness,
  type ReadinessKey,
} from "@shared/tripReadiness";
import {
  packingSuggestions,
  type ForecastDay,
  type PackSuggestion,
} from "@shared/packSuggestions";
import { loadCantonHolidays, type CantonHolidays } from "@/lib/holidays";
import { useHashSection } from "@/hooks/useHashSection";
import { useTripSectionCounts } from "@/hooks/useTripSectionCounts";
import TripCalendar, { type CalendarTrip } from "@/components/TripCalendar";

export default function TripJournal({
  tripId,
  tripName,
  startDate,
  endDate,
  shared,
}: {
  tripId: number;
  tripName: string;
  startDate: string;
  endDate: string;
  shared: boolean;
}) {
  const { lang, t } = useI18n();
  const utils = trpc.useUtils();
  // Tiefer Link vom Knopf «Ins Journal schreiben» der «Heute»-Ansicht (#344)
  const { matched: deepLinked, ref: cardRef } = useHashSection("#journal");
  // Zugeklappt liefert der gemeinsame Zähler die Zahl (#346) – bis dahin
  // `null`, damit nicht kurz eine 0 aufblitzt, die nichts bedeutet.
  const stored = useTripSectionCounts(tripId);
  const [open, setOpen] = useState(deepLinked);
  /** Tag, dessen Textfeld gerade offen ist (null = keines). */
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const query = trpc.trips.journal.list.useQuery({ tripId }, { enabled: open });
  // Etappen (#572): Bei einer Rundreise trägt jeder Tag den Ort, an dem
  // man ihn verbracht hat – man sieht später, WO «Regentag, Museum» war.
  const stopsQuery = trpc.trips.stops.list.useQuery(
    { tripId },
    { enabled: open, staleTime: 5 * 60_000 }
  );
  const stageOf = (day: string): string | null =>
    currentTripStop(stopsQuery.data ?? [], day)?.name ?? null;
  const badgeCount =
    open && !query.isLoading
      ? (query.data?.length ?? 0)
      : (stored?.journal ?? null);
  const setMutation = trpc.trips.journal.set.useMutation({
    onSuccess: (_data, vars) => {
      utils.trips.journal.list.invalidate({ tripId });
      utils.trips.counts.invalidate();
      setEditingDay(null);
      toast.success(
        vars.text?.trim() ? t.trips.journalSaved : t.trips.journalDeleted
      );
    },
    onError: e => toast.error(e.message || t.trips.journalSaveFailed),
  });
  // Tages-Foto (#590): EIN Bild pro Eintrag, hochgeladen wie der
  // Reisekassen-Beleg (Raw-POST, Client-Resize). Der Kamera-Knopf merkt
  // sich den Eintrag, das versteckte Datei-Feld liefert das Bild nach.
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const photoEntryIdRef = useRef<number | null>(null);
  const [photoUploadingId, setPhotoUploadingId] = useState<number | null>(null);
  const removePhotoMutation = trpc.trips.journal.removePhoto.useMutation({
    onSuccess: () => utils.trips.journal.list.invalidate({ tripId }),
    onError: () => toast.error(t.common.actionFailed),
  });
  const handlePhotoSelected = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    const entryId = photoEntryIdRef.current;
    if (photoInputRef.current) photoInputRef.current.value = "";
    if (!file || entryId == null) return;
    try {
      const blob = await resizeImageForUpload(file);
      setPhotoUploadingId(entryId);
      const response = await fetch(`/api/trips/journal/${entryId}/photo`, {
        method: "POST",
        headers: { "Content-Type": blob.type },
        body: blob,
      });
      if (!response.ok) throw new Error("upload");
      await utils.trips.journal.list.invalidate({ tripId });
    } catch {
      const isHeic =
        /image\/hei[cf]/.test(file.type) || /\.hei[cf]$/i.test(file.name);
      toast.error(
        isHeic ? t.trips.journalPhotoHeic : t.trips.journalPhotoFailed
      );
    } finally {
      setPhotoUploadingId(null);
    }
  };

  const days = useMemo(
    () => tripDays(startDate, endDate),
    [startDate, endDate]
  );
  const byDay = useMemo(() => {
    const map = new Map<string, NonNullable<typeof query.data>[number]>();
    (query.data ?? []).forEach(entry => map.set(entry.day, entry));
    return map;
  }, [query.data]);

  const fmtDay = (iso: string) =>
    fmtWeekdayLong(new Date(`${iso}T00:00:00`), lang);

  return (
    <div ref={cardRef} className="mt-2 rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={t.trips.journalToggleAria(tripName)}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm"
      >
        <BookOpen
          className="h-4 w-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate text-left font-medium">
          {t.trips.journalTitle}
        </span>
        {badgeCount !== null && (
          <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
            {t.trips.journalCount(badgeCount)}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="border-t border-border px-3 py-2.5">
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
            onChange={e => void handlePhotoSelected(e.target.files)}
          />
          <p className="mb-2 text-xs text-muted-foreground">
            {t.trips.journalHint}
          </p>
          {query.isLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t.common.loading}
            </p>
          ) : (
            <ul className="space-y-2">
              {days.map(day => {
                const entry = byDay.get(day);
                const editing = editingDay === day;
                return (
                  <li key={day} className="rounded-lg bg-muted/40 px-3 py-2">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-x-1.5 text-xs font-semibold capitalize text-muted-foreground">
                          {fmtDay(day)}
                          {(() => {
                            const stage = stageOf(day);
                            return stage ? (
                              <span className="rounded-full bg-accent px-1.5 py-0.5 font-medium normal-case text-accent-foreground">
                                {stage}
                              </span>
                            ) : null;
                          })()}
                        </p>
                        {!editing &&
                          (entry ? (
                            <>
                              <p className="mt-0.5 whitespace-pre-line text-sm">
                                {entry.text}
                              </p>
                              {shared && entry.createdByName && (
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {t.trips.journalBy(entry.createdByName)}
                                </p>
                              )}
                              {entry.photoFileName && (
                                <div className="mt-1.5 flex items-start gap-1">
                                  <a
                                    href={`/api/trips/journal/photos/${entry.photoFileName}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={t.trips.journalPhotoViewAria(
                                      fmtDay(day)
                                    )}
                                  >
                                    <img
                                      src={`/api/trips/journal/photos/${entry.photoFileName}`}
                                      alt=""
                                      className="h-16 w-16 rounded-md object-cover"
                                      loading="lazy"
                                    />
                                  </a>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground/60 hover:text-destructive"
                                    disabled={removePhotoMutation.isPending}
                                    onClick={() =>
                                      removePhotoMutation.mutate({
                                        id: entry.id,
                                      })
                                    }
                                    aria-label={t.trips.journalPhotoRemove}
                                  >
                                    <Trash2
                                      className="h-3 w-3"
                                      aria-hidden="true"
                                    />
                                  </Button>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {t.trips.journalEmptyDay}
                            </p>
                          ))}
                      </div>
                      {!editing && entry && !entry.photoFileName && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground/60 hover:text-foreground"
                          disabled={photoUploadingId === entry.id}
                          onClick={() => {
                            photoEntryIdRef.current = entry.id;
                            photoInputRef.current?.click();
                          }}
                          aria-label={t.trips.journalPhotoAdd}
                          title={t.trips.journalPhotoAdd}
                        >
                          {photoUploadingId === entry.id ? (
                            <Loader2
                              className="h-3.5 w-3.5 animate-spin"
                              aria-hidden="true"
                            />
                          ) : (
                            <Camera
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          )}
                        </Button>
                      )}
                      {!editing && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground/60 hover:text-foreground"
                          onClick={() => {
                            setEditingDay(day);
                            setDraft(entry?.text ?? "");
                          }}
                          aria-label={t.trips.journalEditAria(fmtDay(day))}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                    {editing && (
                      <div className="mt-1.5">
                        <Textarea
                          value={draft}
                          rows={3}
                          maxLength={TRIP_JOURNAL_MAX_LENGTH}
                          placeholder={t.trips.journalPlaceholder}
                          onChange={e => setDraft(e.target.value)}
                          aria-label={t.trips.journalEditAria(fmtDay(day))}
                        />
                        <div className="mt-1.5 flex gap-2">
                          <Button
                            size="sm"
                            disabled={setMutation.isPending}
                            onClick={() =>
                              setMutation.mutate({ tripId, day, text: draft })
                            }
                          >
                            {t.trips.journalSave}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingDay(null)}
                          >
                            {t.common.cancel}
                          </Button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Pinnwand einer gemeinsamen Reise (#245): kurze Zurufe an die Mitreisenden
 * und einfache Aufgaben zum Abhaken. Aufklappbar wie Tagebuch und Reisekasse –
 * die Zettel werden erst beim Öffnen geladen und danach im Muster der
 * geteilten Listen alle 15 Sekunden aufgefrischt (kein WebSocket).
 * Sortierung und Zählung stecken in shared/tripBoard.ts.
 */
