import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import {
  formatTripRange,
  MAX_FORECAST_DAYS,
  tripPhotoSrc,
} from "@/components/trips/shared";
import TripBoard from "@/components/trips/TripBoard";

/**
 * Die beiden schwersten Bausteine erst laden, wenn eine Reise aufgeklappt
 * ist (#322). Reisekasse (911 Zeilen mit Diagramm) und Foto-Collage
 * (Zeichenfläche, Bildbearbeitung) machten zusammen rund ein Viertel der
 * alten Trips.tsx aus – gebraucht werden sie erst, wenn man eine einzelne
 * Reise öffnet, und die Liste soll nicht darauf warten.
 */
const TripExpenses = lazy(() => import("@/components/trips/TripExpenses"));
const TripCollage = lazy(() => import("@/components/trips/TripCollage"));
import TripDuplicateDialog from "@/components/trips/TripDuplicateDialog";
import TripHolidayHints from "@/components/trips/TripHolidayHints";
import TripJournal from "@/components/trips/TripJournal";
import TripMembersDialog from "@/components/trips/TripMembersDialog";
import TripPackSuggestions from "@/components/trips/TripPackSuggestions";
import TripPitchDetails from "@/components/trips/TripPitchDetails";
import TripReadinessCard from "@/components/trips/TripReadinessCard";
import TripShareDialog from "@/components/trips/TripShareDialog";
import TripWeatherArchive from "@/components/trips/TripWeatherArchive";
import {
  fmtDayMonth,
  fmtMedium,
  fmtShort,
  fmtWeekdayLong,
} from "@/lib/dateFormat";
import { useConfirm } from "@/components/ConfirmDialog";
import { ShareExpiryNote, ShareExpirySelect } from "@/components/ShareExpiry";
import { relativeAge, type ShareExpiryDays } from "@shared/sharing";
import { tripDisplayName, tripPlaceName } from "@shared/tripName";
import {
  ArrowRight,
  Award,
  BookOpen,
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
import { Link, useRoute, useSearch } from "wouter";
import { toast } from "sonner";
import QRCode from "qrcode";
import PageHeader from "@/components/PageHeader";
import DataAge from "@/components/DataAge";
import QueryError from "@/components/QueryError";
import ListSkeleton from "@/components/ListSkeleton";
import LoginPrompt from "@/components/LoginPrompt";
import PhotoGallery from "@/components/PhotoGallery";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MAX_PHOTOS_PER_TRIP } from "@shared/tripPhotos";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useI18n, useT } from "@/i18n";
import { LOCALE_TAGS, pick, type Language } from "@shared/i18n";
import { findCountryRules, guessCountryCode } from "@/data/roadRules";
import {
  COLLAGE_LAYOUTS,
  collageCapacity,
  type CollageLayoutId,
} from "@shared/collageLayout";
import { cn } from "@/lib/utils";
import { formatChf, parseChfInput, rappenToInput } from "@/lib/money";
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
import { csvFileName, expensesToCsv } from "@shared/expensesCsv";
import {
  DEFAULT_CONSUMPTION_L100,
  DEFAULT_FUEL_PRICE_RAPPEN,
  fuelCost,
} from "@shared/fuelCost";
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
import { milestones } from "@shared/milestones";
import {
  packingSuggestions,
  type ForecastDay,
  type PackSuggestion,
} from "@shared/packSuggestions";
import { climateRequestUrl } from "@shared/climate";
import {
  parseTripWeather,
  summarizeTripWeather,
  TRIP_WEATHER_ARCHIVE_MIN_AGE_DAYS,
  weatherLuck,
} from "@shared/tripWeather";
import {
  CANTONS,
  holidayDisplayName,
  overlappingHolidays,
} from "@shared/holidays";
import { loadCantonHolidays, type CantonHolidays } from "@/lib/holidays";
import { drawYearReview } from "@/lib/yearReviewImage";
import { drawCollage } from "@/lib/collageImage";
import TripCalendar, { type CalendarTrip } from "@/components/TripCalendar";
import TripDatePoll from "@/components/TripDatePoll";
import TripGuestbook from "@/components/TripGuestbook";
import TripHistory from "@/components/TripHistory";
import TripReservation from "@/components/TripReservation";
import TripTemplatePicker from "@/components/TripTemplatePicker";
import { todayIso } from "@shared/localDate";

/** Auswahlwert für «Ort frei eintragen» im Zeltplatz-Select. */
const FREE_LOCATION = "frei";

/** So viele Tage vor der Anreise erscheinen die Wetter-Packvorschläge. */
const PACK_SUGGESTION_DAYS_BEFORE = 7;
/** Open-Meteo liefert höchstens so viele Prognose-Tage. */

/** Gemerkter Kanton für die Ferien-/Feiertags-Hinweise. */
const HOLIDAY_CANTON_KEY = "campmesser.holidayCanton";
/** Auswahlwert für «kein Kanton» (keine Hinweise). */
const HOLIDAY_CANTON_NONE = "keiner";

function loadStoredHolidayCanton(): string {
  try {
    const stored = localStorage.getItem(HOLIDAY_CANTON_KEY);
    if (stored && CANTONS.some(c => c.code === stored)) return stored;
  } catch {
    // Speicher blockiert – einfach ohne Vorauswahl starten
  }
  return HOLIDAY_CANTON_NONE;
}

/** Gemerkte Ansicht der Aufenthalte: Liste (Standard) oder Monats-Kalender. */
const TRIPS_VIEW_KEY = "campmesser.tripsView";
type TripsView = "list" | "calendar";

function loadStoredTripsView(): TripsView {
  try {
    const stored = localStorage.getItem(TRIPS_VIEW_KEY);
    if (stored === "calendar" || stored === "list") return stored;
  } catch {
    // Speicher blockiert – mit der Listen-Ansicht starten
  }
  return "list";
}

/**
 * Ferien-/Feiertags-Hinweise eines geplanten Aufenthalts: Badges nur, wenn
 * der Zeitraum Schulferien oder Feiertage des gewählten Kantons überlappt.
 */
function StarRating({
  value,
  onChange,
  groupLabel,
  disabled,
  size = "md",
}: {
  value: number | null;
  onChange: (rating: number | null) => void;
  groupLabel: string;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const t = useT();
  const starClass = size === "sm" ? "h-4 w-4" : "h-6 w-6";
  return (
    <div
      role="radiogroup"
      aria-label={groupLabel}
      className="flex items-center gap-0.5"
    >
      {[1, 2, 3, 4, 5].map(n => {
        const active = value !== null && n <= value;
        const selected = value === n;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            aria-label={
              selected ? t.trips.removeRatingAria : t.trips.rateStarAria(n)
            }
            onClick={() => onChange(selected ? null : n)}
            className="rounded p-0.5 transition-transform hover:scale-110 disabled:opacity-50"
          >
            <Star
              className={cn(
                starClass,
                active
                  ? "fill-chart-1 text-chart-1"
                  : "text-muted-foreground/40"
              )}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Stellplatz-Details eines Aufenthalts (#252): Parzellennummer, WLAN und
 * Notizen zum Platz. Erscheint nur, wenn etwas erfasst ist – ein leerer
 * Kasten an jeder Reise wäre reines Rauschen.
 *
 * Das WLAN-Passwort steht standardmässig verdeckt: Man liest es am Platz
 * auch mal, während jemand über die Schulter schaut. Ein Knopf zeigt es,
 * ein zweiter kopiert es.
 */
function PackProgress({ listId }: { listId: number }) {
  const t = useT();
  const progress = trpc.packing.progress.useQuery({ listId });
  if (!progress.data) return null;
  const { name, total, checked } = progress.data;
  const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
  return (
    <Link
      href={`/packlisten/${listId}`}
      className="mt-2 flex items-center gap-2 rounded-lg bg-accent/50 px-3 py-2 text-sm transition-colors hover:bg-accent"
    >
      <ListChecks
        className="h-4 w-4 shrink-0 text-primary"
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1 truncate">
        {t.trips.packProgress(name, checked, total)}
      </span>
      <span className="font-mono text-xs font-semibold">{pct} %</span>
    </Link>
  );
}

/** Icon pro Bereitschafts-Zeile des Reise-Cockpits. */

/**
 * Titelbild-Banner eines Tagebuch-Eintrags: zeigt das als Titelbild
 * markierte Foto oben am Eintrag. Nutzt dieselbe Foto-Query wie die Galerie
 * darunter (react-query dedupliziert – kein zweiter Fetch).
 */
function TripCoverBanner({
  tripId,
  coverPhotoId,
  tripName,
}: {
  tripId: number;
  coverPhotoId: number | null;
  tripName: string;
}) {
  const t = useT();
  const photosQuery = trpc.trips.photos.list.useQuery(
    { tripId },
    { enabled: coverPhotoId !== null }
  );
  if (coverPhotoId === null) return null;
  const cover = photosQuery.data?.find(p => p.id === coverPhotoId);
  if (!cover) return null;
  return (
    <img
      src={tripPhotoSrc(cover.fileName)}
      alt={t.trips.coverAlt(tripName)}
      loading="lazy"
      className="mb-3 max-h-44 w-full rounded-lg object-cover"
    />
  );
}

/**
 * Foto-Galerie eines Tagebuch-Eintrags: nutzt die gemeinsame PhotoGallery
 * (Upload, Thumbnails, Vollbild-Dialog) mit den Trip-Endpoints und -Texten;
 * zusätzlich lässt sich hier ein Foto als Titelbild markieren.
 */
function TripPhotos({
  tripId,
  tripName,
  coverPhotoId,
}: {
  tripId: number;
  tripName: string;
  coverPhotoId: number | null;
}) {
  const t = useT();
  const utils = trpc.useUtils();
  const photosQuery = trpc.trips.photos.list.useQuery({ tripId });
  const removeMutation = trpc.trips.photos.remove.useMutation({
    // Wird das Titelbild gelöscht, setzt der Server coverPhotoId zurück
    onSuccess: () => utils.trips.list.invalidate(),
  });
  const setCoverMutation = trpc.trips.setCoverPhoto.useMutation({
    onSuccess: (_data, vars) => {
      utils.trips.list.invalidate();
      toast.success(
        vars.photoId === null ? t.trips.coverRemoved : t.trips.coverSet
      );
    },
    onError: () => toast.error(t.trips.coverSaveFailed),
  });

  return (
    <PhotoGallery
      photos={photosQuery.data ?? []}
      loadFailed={photosQuery.isError}
      name={tripName}
      maxPhotos={MAX_PHOTOS_PER_TRIP}
      uploadUrl={`/api/trips/${tripId}/photos`}
      photoSrc={tripPhotoSrc}
      onChanged={() => utils.trips.photos.list.invalidate({ tripId })}
      deletePhoto={photoId => removeMutation.mutateAsync({ photoId })}
      cover={{
        coverPhotoId,
        pending: setCoverMutation.isPending,
        onSetCover: photoId => setCoverMutation.mutate({ tripId, photoId }),
        texts: {
          setButton: t.trips.coverSetButton,
          removeButton: t.trips.coverRemoveButton,
          badge: t.trips.coverBadge,
        },
      }}
      texts={{
        addPhotos: t.trips.addPhotos,
        addPhotosAria: t.trips.addPhotosAria,
        photoCountHint: t.trips.photoCountHint,
        photoUploading: t.trips.photoUploading,
        photoUploaded: t.trips.photoUploaded,
        photoLimitReached: t.trips.photoLimitReached,
        photoTooLarge: t.trips.photoTooLarge,
        photoUnsupportedType: t.trips.photoUnsupportedType,
        photoHeic: t.trips.photoHeic,
        photoReadFailed: t.trips.photoReadFailed,
        photoUploadFailed: t.trips.photoUploadFailed,
        photosLoadFailed: t.trips.photosLoadFailed,
        photoDeleteConfirm: t.trips.photoDeleteConfirm,
        photoDeleted: t.trips.photoDeleted,
        photoDeleteAria: t.trips.photoDeleteAria,
        photoAlt: t.trips.photoAlt,
        photoOpenAria: t.trips.photoOpenAria,
        galleryTitle: t.trips.galleryTitle,
        galleryCounter: t.trips.galleryCounter,
        galleryPrev: t.trips.galleryPrev,
        galleryNext: t.trips.galleryNext,
        deleteFailed: t.common.deleteFailed,
      }}
    />
  );
}

/**
 * Foto-Collage einer Reise (#226): aus den Tagebuch-Fotos ein teilbares Bild
 * bauen – Fotos und Anordnung wählen, dann teilen oder herunterladen.
 * Gezeichnet wird mit der Canvas-API im Muster des Jahresrückblick-Bildes
 * (#91, lib/collageImage.ts); die Kachel-Geometrie kommt aus
 * shared/collageLayout.ts. Die Fotos werden von der eigenen Origin geladen,
 * damit das Canvas untainted bleibt und `toBlob` funktioniert.
 */
export default function TripsPage() {
  const ask = useConfirm();
  const { lang, t } = useI18n();
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const spotsQuery = trpc.spots.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const listsQuery = trpc.packing.lists.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const formatRange = (startDate: string, endDate: string): string =>
    formatTripRange(startDate, endDate, lang);

  /** Ø-Bewertung mit maximal einer Nachkommastelle in der aktiven Sprache. */
  const fmtRating = (value: number): string =>
    value.toLocaleString(LOCALE_TAGS[lang], { maximumFractionDigits: 1 });

  const today = todayIso();
  const [spotChoice, setSpotChoice] = useState<string>(FREE_LOCATION);
  // "keine" = ohne Packliste, sonst Listen-ID
  const [packListChoice, setPackListChoice] = useState<string>("keine");
  const [form, setForm] = useState({
    location: "",
    title: "",
    notes: "",
    startDate: today,
    endDate: today,
    arrivalTime: "",
    departureTime: "",
    pitchNumber: "",
    wifiName: "",
    wifiPassword: "",
    pitchNotes: "",
  });
  /** Sterne-Bewertung des neuen Eintrags (null = ohne Bewertung). */
  const [formRating, setFormRating] = useState<number | null>(null);
  /** Eintrag, der gerade im Formular bearbeitet wird (null = neuer Eintrag). */
  const [editingId, setEditingId] = useState<number | null>(null);
  /** Erfassungs-Dialog «Neue Reise» / «Reise bearbeiten» offen? */
  const [formOpen, setFormOpen] = useState(false);

  /** Formular leeren und in den Neu-Modus zurückkehren. */
  const resetForm = () => {
    setEditingId(null);
    setSpotChoice(FREE_LOCATION);
    setPackListChoice("keine");
    setForm({
      location: "",
      title: "",
      notes: "",
      startDate: today,
      endDate: today,
      arrivalTime: "",
      departureTime: "",
      pitchNumber: "",
      wifiName: "",
      wifiPassword: "",
      pitchNotes: "",
    });
    setFormRating(null);
  };

  /** Dialog im Neu-Modus öffnen (Formular frisch). */
  const openNewTripDialog = () => {
    resetForm();
    setFormOpen(true);
  };

  /** Dialog schliessen und das Formular zurücksetzen. */
  const closeForm = () => {
    setFormOpen(false);
    resetForm();
  };

  // Schnellaktion «Neuer Tagebuch-Eintrag» (?neu=1): den Reise-Dialog öffnen
  const search = useSearch();
  useEffect(() => {
    if (!isAuthenticated) return;
    if (new URLSearchParams(search).get("neu") === "1") openNewTripDialog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, isAuthenticated]);

  const addMutation = trpc.trips.add.useMutation({
    onSuccess: () => {
      utils.trips.list.invalidate();
      closeForm();
      toast.success(t.trips.entrySaved);
    },
    onError: e => toast.error(e.message || t.trips.entrySaveFailed),
  });

  const updateMutation = trpc.trips.update.useMutation({
    onSuccess: () => {
      utils.trips.list.invalidate();
      closeForm();
      toast.success(t.trips.entryUpdated);
    },
    onError: e => toast.error(e.message || t.trips.entryUpdateFailed),
  });

  const removeMutation = trpc.trips.remove.useMutation({
    onSuccess: () => utils.trips.list.invalidate(),
    onError: () => toast.error(t.common.deleteFailed),
  });

  /** Reise verlassen (nur Mitglieds-Trips): entfernt die eigene Mitgliedschaft. */
  const leaveMutation = trpc.trips.members.remove.useMutation({
    onSuccess: () => {
      utils.trips.list.invalidate();
      toast.success(t.trips.leftTrip);
    },
    onError: () => toast.error(t.trips.leaveFailed),
  });

  /** Reise, deren «Mitreisende»-Dialog gerade offen ist (null = zu). */
  const [membersTrip, setMembersTrip] = useState<{
    id: number;
    name: string;
  } | null>(null);

  /** Reise, deren «Reise-Hub teilen»-Dialog gerade offen ist (null = zu). */
  const [hubTrip, setHubTrip] = useState<{ id: number; name: string } | null>(
    null
  );

  /** Reise, deren «Duplizieren»-Dialog gerade offen ist (null = zu). */
  const [duplicateTrip, setDuplicateTrip] = useState<{
    id: number;
    name: string;
    startDate: string;
    endDate: string;
  } | null>(null);

  const setRatingMutation = trpc.trips.setRating.useMutation({
    onSuccess: () => utils.trips.list.invalidate(),
    onError: () => toast.error(t.trips.ratingSaveFailed),
  });

  const spots = spotsQuery.data ?? [];
  const allTrips = useMemo(() => tripsQuery.data ?? [], [tripsQuery.data]);
  // Geplante Aufenthalte (Anreise heute oder später) separat oben anzeigen
  /**
   * Einzelne Reise als eigene Adresse (#310): /tagebuch/17 zeigt genau
   * diesen Aufenthalt, aufgeklappt und ohne die Statistik darüber.
   *
   * WARUM: Bisher war eine Reise nur ein Akkordeon in einer Liste – es gab
   * keine Adresse dafür. Man konnte sie nicht als Lesezeichen setzen, ein
   * Treffer aus der Suche konnte nicht hinführen, und aus dem Menüplan kam
   * man nur zur Liste zurück und musste sie wieder aufklappen.
   */
  const [detailMatch, detailParams] = useRoute("/tagebuch/:id");
  const focusId =
    detailMatch && detailParams?.id ? Number(detailParams.id) : null;

  const plannedTrips = useMemo(
    () =>
      allTrips
        .filter(t => isUpcomingTrip(t.startDate, today))
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [allTrips, today]
  );
  const trips = useMemo(
    () => allTrips.filter(t => !isUpcomingTrip(t.startDate, today)),
    [allTrips, today]
  );

  /**
   * Die Listen für die Anzeige. Ohne Fokus alles wie bisher; mit Fokus
   * genau die eine Reise – egal, ob sie vergangen oder geplant ist, sie
   * erscheint an ihrer gewohnten Stelle und ist damit gleich aufgebaut.
   */
  const shownTrips = useMemo(
    () => (focusId === null ? trips : trips.filter(t => t.id === focusId)),
    [trips, focusId]
  );
  const shownPlanned = useMemo(
    () =>
      focusId === null
        ? plannedTrips
        : plannedTrips.filter(t => t.id === focusId),
    [plannedTrips, focusId]
  );
  /** Fokussierte Reise – für Titel, Rückweg und die «nicht gefunden»-Zeile. */
  const focusTrip =
    focusId === null ? null : (allTrips.find(t => t.id === focusId) ?? null);

  /** Gerade bearbeiteter Eintrag – für Mitglieds-Trips gelten Einschränkungen. */
  const editingTrip =
    editingId !== null
      ? (allTrips.find(tr => tr.id === editingId) ?? null)
      : null;
  /** Mitglieds-Trip im Formular: Zeltplatz/Packliste bleiben unveränderbar. */
  const editingShared = editingTrip?.role === "member";

  /**
   * Der frische Name des verknüpften Favoriten – oder null.
   *
   * Wird ein Zeltplatz umbenannt, steht in der Reise noch der alte Name
   * (`spotName` kommt vom Server und wird beim Speichern eingefroren).
   * Bei Mitglieds-Trips gehört der Platz der Besitzerin oder dem
   * Besitzer; dann findet die eigene Liste ihn nicht, und `spotName`
   * übernimmt.
   */
  const freshSpotName = (trip: (typeof trips)[number]): string | null =>
    trip.spotId != null
      ? (spots.find(s => s.id === trip.spotId)?.name ?? null)
      : null;

  /** WO die Reise stattfindet (ohne Titel – siehe `shared/tripName.ts`). */
  const placeName = (trip: (typeof trips)[number]): string =>
    tripPlaceName(trip, lang, freshSpotName(trip));

  /** WIE die Reise heisst: Titel, sonst der Ort. */
  const label = (trip: (typeof trips)[number]): string =>
    tripDisplayName(trip, lang, freshSpotName(trip));

  /**
   * Id des Zeltplatz-Dossiers zu einem Aufenthalt – oder null.
   *
   * NUR EIGENE PLÄTZE: Bei einer geteilten Reise gehört der Zeltplatz der
   * Besitzerin oder dem Besitzer, und `/zeltplaetze/:id` führte dort ins
   * Leere. Lieber kein Link als einer, der eine Fehlermeldung öffnet.
   * Deshalb wird gegen die eigene Favoriten-Liste geprüft und nicht bloss
   * gegen `spotId != null`.
   */
  const spotDossierId = (trip: (typeof trips)[number]): number | null =>
    trip.spotId != null && spots.some(s => s.id === trip.spotId)
      ? trip.spotId
      : null;

  /**
   * Zielland einer Reise (#228): geraten aus Titel, Ortsname und dem Namen des
   * verknüpften Zeltplatzes. Aus den Koordinaten allein liesse sich das Land
   * ohne Grenzdaten nicht verlässlich bestimmen – ohne Treffer bleibt es null
   * und die Länderauswahl übernimmt.
   */
  const tripCountry = (trip: (typeof trips)[number]): string | null =>
    guessCountryCode(`${trip.title ?? ""} ${placeName(trip)}`);

  /** Name des geratenen Ziellands in der UI-Sprache – oder null. */
  const tripCountryName = (trip: (typeof trips)[number]): string | null => {
    const country = findCountryRules(tripCountry(trip));
    return country ? pick(country.name, lang) : null;
  };

  /** Reise auf die Minimalform des Kalender-Exports bringen (#244). */
  const toIcsTrip = (trip: (typeof allTrips)[number]): IcsTrip => {
    const spot =
      trip.spotId != null ? spots.find(s => s.id === trip.spotId) : null;
    return {
      id: trip.id,
      title: label(trip),
      startDate: trip.startDate,
      endDate: trip.endDate,
      arrivalTime: trip.arrivalTime,
      departureTime: trip.departureTime,
      placeName: placeName(trip),
      // Koordinaten nur vom eigenen Zeltplatz-Favoriten; bei Mitglieds-Reisen
      // kennt der Client nur den Namen des fremden Platzes
      latitude: spot?.latitude ?? null,
      longitude: spot?.longitude ?? null,
    };
  };

  /**
   * Kalender-Datei erzeugen und herunterladen – rein im Browser, offline
   * (gleiches Blob-Muster wie der GPX-Export der Wanderungen).
   */
  const downloadIcs = (list: (typeof allTrips)[number][], fileName: string) => {
    try {
      const ics = buildTripIcs(list.map(toIcsTrip), {
        dtstamp: new Date(),
        lang,
      });
      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(t.trips.icsDone(list.length));
    } catch {
      toast.error(t.trips.icsFailed);
    }
  };

  /** Eine einzelne Reise als .ics herunterladen. */
  const downloadTripIcs = (trip: (typeof allTrips)[number]) => {
    downloadIcs([trip], icsFileName(label(trip), trip.startDate));
  };

  /** Eintrag ins Formular laden und den Dialog im Bearbeiten-Modus öffnen. */
  const startEdit = (trip: (typeof allTrips)[number]) => {
    setEditingId(trip.id);
    setSpotChoice(trip.spotId != null ? String(trip.spotId) : FREE_LOCATION);
    setPackListChoice(
      trip.packListId != null ? String(trip.packListId) : "keine"
    );
    setForm({
      location: trip.location ?? "",
      title: trip.title ?? "",
      notes: trip.notes ?? "",
      startDate: trip.startDate,
      endDate: trip.endDate,
      arrivalTime: trip.arrivalTime ?? "",
      departureTime: trip.departureTime ?? "",
      pitchNumber: trip.pitchNumber ?? "",
      wifiName: trip.wifiName ?? "",
      wifiPassword: trip.wifiPassword ?? "",
      pitchNotes: trip.pitchNotes ?? "",
    });
    setFormRating(trip.rating ?? null);
    setFormOpen(true);
  };

  const pastTripLikes = useMemo(
    () =>
      trips.map(t => ({
        startDate: t.startDate,
        endDate: t.endDate,
        placeName: placeName(t),
        rating: t.rating,
        weatherJson: t.weatherJson,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trips, spots]
  );
  const stats = useMemo(
    () => computeTripStats(pastTripLikes, lang),
    [pastTripLikes, lang]
  );
  const currentYear = new Date().getFullYear();

  // Wetter-Glück über alle Aufenthalte mit gespeichertem Wetterarchiv
  const luck = useMemo(() => weatherLuck(pastTripLikes), [pastTripLikes]);

  // Übernachtungen pro Jahr für den Jahres-Vergleich (Startjahr zählt)
  const yearNights = useMemo(
    () => nightsPerYear(pastTripLikes),
    [pastTripLikes]
  );

  // Meilensteine über die abgeschlossenen Aufenthalte: erreichte als farbige
  // Chips, dazu die nächsten offenen (höchster Fortschritt zuerst, max. 3)
  const milestoneItems = useMemo(
    () => milestones(pastTripLikes, today, lang),
    [pastTripLikes, today, lang]
  );
  const achievedMilestones = useMemo(
    () => milestoneItems.filter(m => m.achieved),
    [milestoneItems]
  );
  const nextMilestones = useMemo(
    () =>
      milestoneItems
        .filter(m => !m.achieved)
        .sort((a, b) => b.current / b.target - a.current / a.target)
        .slice(0, 3),
    [milestoneItems]
  );
  const fmtMilestoneDate = (iso: string): string =>
    fmtMedium(new Date(`${iso}T00:00:00`), lang);

  // Jahresrückblick: Jahre mit vergangenen Trips, Default = aktuellstes Jahr
  const reviewYears = useMemo(() => {
    const years = new Set<number>();
    for (const t of trips) years.add(Number(t.startDate.slice(0, 4)));
    return Array.from(years).sort((a, b) => b - a);
  }, [trips]);
  const [reviewYearChoice, setReviewYearChoice] = useState<string>("");
  const reviewYear = reviewYears.includes(Number(reviewYearChoice))
    ? Number(reviewYearChoice)
    : reviewYears[0];
  const yearReview = useMemo(
    () =>
      reviewYear === undefined
        ? null
        : computeYearReview(pastTripLikes, reviewYear, lang),
    [pastTripLikes, reviewYear, lang]
  );
  // Wetter-Glück des gewählten Rückblick-Jahres (Trip zählt zum Start-Jahr)
  const yearLuck = useMemo(
    () =>
      reviewYear === undefined
        ? null
        : weatherLuck(
            pastTripLikes.filter(
              t => t.startDate.slice(0, 4) === String(reviewYear)
            )
          ),
    [pastTripLikes, reviewYear]
  );

  /**
   * Titelbild fürs Jahresrückblick-Bild laden: einfache Priorität – zuerst
   * der best bewertete Trip des Jahres, sonst der längste; hat keiner der
   * beiden ein Titelbild (oder schlägt das Laden fehl), bleibt das Bild weg.
   * Geladen wird über die bestehende GET-Route (gleiche Origin) – das
   * Canvas bleibt dadurch untainted.
   */
  const loadReviewCoverImage = async (
    year: number
  ): Promise<HTMLImageElement | undefined> => {
    const inYear = trips.filter(
      trip => Number(trip.startDate.slice(0, 4)) === year
    );
    const rated = inYear.filter(trip => typeof trip.rating === "number");
    const bestRated =
      rated.length > 0
        ? [...rated].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0]
        : undefined;
    const longest =
      inYear.length > 0
        ? [...inYear].sort(
            (a, b) =>
              tripNights(b.startDate, b.endDate) -
              tripNights(a.startDate, a.endDate)
          )[0]
        : undefined;
    const coverTrip =
      bestRated?.coverPhotoId != null
        ? bestRated
        : longest?.coverPhotoId != null
          ? longest
          : undefined;
    if (!coverTrip || coverTrip.coverPhotoId == null) return undefined;
    try {
      const photos = await utils.trips.photos.list.fetch({
        tripId: coverTrip.id,
      });
      const photo = photos.find(p => p.id === coverTrip.coverPhotoId);
      if (!photo) return undefined;
      const img = new Image();
      img.src = tripPhotoSrc(photo.fileName);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Titelbild nicht ladbar"));
      });
      return img;
    } catch {
      // Ohne Titelbild weiterzeichnen – das Rückblick-Bild bleibt nutzbar
      return undefined;
    }
  };

  /**
   * Jahresrückblick als PNG teilen: Kennzahlen mit der Canvas-API zeichnen
   * (client/src/lib/yearReviewImage.ts), dann Web Share API Level 2 mit
   * Datei – wo nicht verfügbar, Download über einen a[download]-Link.
   */
  const shareYearReview = async () => {
    if (!yearReview) return;
    try {
      const coverImage = await loadReviewCoverImage(yearReview.year);
      const canvas = document.createElement("canvas");
      drawYearReview(
        canvas,
        {
          review: yearReview,
          coverImage,
          labels: {
            subtitle: `${t.trips.yearReviewTitle} ${yearReview.year}`,
            stays: t.trips.staysLabel,
            nights: t.trips.nightsTotal,
            places: t.trips.yearReviewPlaces,
            topPlace: t.trips.yearReviewTopPlace,
            longestStay: t.trips.yearReviewLongest,
            bestRated: t.trips.bestRatedLabel,
            nightsCount: t.trips.nightsCount,
            starsAvg: t.trips.starsAvg,
          },
        },
        lang
      );
      const blob = await new Promise<Blob | null>(resolve =>
        canvas.toBlob(resolve, "image/png")
      );
      if (!blob) throw new Error("Canvas lieferte kein Bild");
      const file = new File([blob], `campmesser-${yearReview.year}.png`, {
        type: "image/png",
      });
      if (
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: `CampMesser · ${t.trips.yearReviewTitle} ${yearReview.year}`,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(t.trips.yearReviewImageSaved);
      }
    } catch (error) {
      // Abbruch des Teilen-Dialogs ist kein Fehler
      if ((error as DOMException)?.name === "AbortError") return;
      toast.error(t.trips.yearReviewShareFailed);
    }
  };

  // Ansicht der Aufenthalte: Liste (Standard) oder Monats-Kalender –
  // die Wahl bleibt über localStorage erhalten.
  const [tripsView, setTripsView] = useState<TripsView>(loadStoredTripsView);
  const selectTripsView = (view: TripsView) => {
    setTripsView(view);
    try {
      localStorage.setItem(TRIPS_VIEW_KEY, view);
    } catch {
      // Speicher blockiert – die Wahl gilt trotzdem für diese Sitzung
    }
  };

  /** Aufenthalte fürs Kalender-Gitter (eigene vs. gemeinsame unterscheidbar). */
  const calendarTrips = useMemo<CalendarTrip[]>(
    () =>
      allTrips.map(trip => ({
        id: trip.id,
        name: label(trip),
        startDate: trip.startDate,
        endDate: trip.endDate,
        shared: trip.role === "member" || trip.shared,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allTrips, spots]
  );

  /** Klick auf einen Kalender-Balken: Eintrag im Bearbeiten-Dialog öffnen. */
  const openTripFromCalendar = (tripId: number) => {
    const trip = allTrips.find(tr => tr.id === tripId);
    if (trip) startEdit(trip);
  };

  // Schulferien & Feiertage des gewählten Kantons für die geplanten Aufenthalte.
  // Fehler bleiben still (holidays = null) – die Hinweise werden dann weggelassen.
  const [holidayCanton, setHolidayCanton] = useState<string>(
    loadStoredHolidayCanton
  );
  const [holidays, setHolidays] = useState<CantonHolidays | null>(null);

  const selectHolidayCanton = (code: string) => {
    setHolidayCanton(code);
    try {
      if (code === HOLIDAY_CANTON_NONE) {
        localStorage.removeItem(HOLIDAY_CANTON_KEY);
      } else {
        localStorage.setItem(HOLIDAY_CANTON_KEY, code);
      }
    } catch {
      // Speicher blockiert – die Auswahl gilt trotzdem für diese Sitzung
    }
  };

  useEffect(() => {
    // Kalender-Ansicht: Ferien immer laden (Markierung im Gitter);
    // Listen-Ansicht: nur wenn es geplante Aufenthalte gibt (wie bisher)
    if (
      holidayCanton === HOLIDAY_CANTON_NONE ||
      (tripsView !== "calendar" && plannedTrips.length === 0)
    ) {
      setHolidays(null);
      return;
    }
    let cancelled = false;
    void loadCantonHolidays(holidayCanton).then(result => {
      if (!cancelled) setHolidays(result);
    });
    return () => {
      cancelled = true;
    };
  }, [holidayCanton, plannedTrips.length, tripsView]);

  /** Kantons-Auswahl für Ferien-/Feiertags-Hinweise (Liste UND Kalender). */
  const holidayCantonPicker = (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <Label htmlFor="holiday-canton" className="text-xs text-muted-foreground">
        {t.trips.holidaySectionLabel}
      </Label>
      <Select value={holidayCanton} onValueChange={selectHolidayCanton}>
        <SelectTrigger
          id="holiday-canton"
          className="w-60"
          aria-label={t.trips.holidayCantonAria}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={HOLIDAY_CANTON_NONE}>
            {t.trips.holidayCantonNone}
          </SelectItem>
          {CANTONS.map(canton => (
            <SelectItem key={canton.code} value={canton.code}>
              {canton.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  if (loading || (isAuthenticated && tripsQuery.isLoading)) {
    return (
      <div className="container max-w-3xl py-6">
        <PageHeader title={t.trips.title} subtitle={t.trips.subtitle} />
        <ListSkeleton rows={3} height={120} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-6">
        <PageHeader title={t.trips.title} subtitle={t.trips.subtitle} />
        <LoginPrompt feature={t.trips.loginFeature} />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-6">
      {focusTrip ? (
        <PageHeader
          title={
            focusTrip.title ||
            focusTrip.spotName ||
            focusTrip.location ||
            t.trips.title
          }
          subtitle={t.trips.detailSubtitle}
          backHref="/tagebuch"
          backLabel={t.trips.backToList}
        />
      ) : (
        <PageHeader title={t.trips.title} subtitle={t.trips.subtitle} />
      )}
      <DataAge updatedAt={tripsQuery.dataUpdatedAt} />

      {/* Antwortet der Server nicht, stand hier bisher «noch keine
          Aufenthalte erfasst» – über Reisen, die es sehr wohl gibt. */}
      {tripsQuery.isError && (
        <QueryError
          onRetry={() => void tripsQuery.refetch()}
          retrying={tripsQuery.isFetching}
        />
      )}

      {/* Adresse einer Reise, die es nicht (mehr) gibt – etwa ein alter
          Lesezeichen-Link oder eine gelöschte Reise. Lieber ein Satz mit
          Rückweg als eine leere Seite. */}
      {focusId !== null && !focusTrip && !tripsQuery.isLoading && (
        <div className="rounded-xl border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t.trips.detailNotFound}
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/tagebuch">{t.trips.backToList}</Link>
          </Button>
        </div>
      )}

      {/* Übersicht und Auswertungen gelten für ALLE Reisen – auf der
          Detailseite einer einzelnen Reise wären sie fehl am Platz und
          würden den Aufenthalt nach unten drücken. */}
      {focusId === null && (
        <>
          {/* «Neue Reise» von Hand oder aus einer Vorlage (#284) */}
          <div className="mb-6 flex flex-wrap gap-2">
            <Button size="lg" onClick={openNewTripDialog}>
              <Plus className="mr-1.5 h-5 w-5" aria-hidden="true" />
              {t.trips.newTripButton}
            </Button>
            <TripTemplatePicker
              spots={(spotsQuery.data ?? []).map(spot => ({
                id: spot.id,
                name: spot.name,
              }))}
            />
          </div>

          {/* Statistik */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                <div className="text-center">
                  <p className="font-serif text-2xl font-bold text-primary">
                    {stats.nightsByYear[currentYear] ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.trips.nightsInYear(currentYear)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.totalNights}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.trips.nightsTotal}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.totalTrips}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.trips.staysLabel}
                  </p>
                </div>
                <div className="text-center">
                  <p className="flex items-center justify-center gap-1 text-sm font-semibold leading-8">
                    <Trophy
                      className="h-4 w-4 shrink-0 text-chart-1"
                      aria-hidden="true"
                    />
                    <span className="truncate">
                      {stats.topPlaces[0]?.name ?? "–"}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.trips.favoriteLabel}
                  </p>
                </div>
                <div className="text-center">
                  <p className="flex items-center justify-center gap-1 text-2xl font-bold">
                    <Star
                      className="h-4 w-4 shrink-0 fill-chart-1 text-chart-1"
                      aria-hidden="true"
                    />
                    {stats.avgRating !== null
                      ? fmtRating(stats.avgRating)
                      : "–"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.trips.avgRatingLabel}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wetter-Glück: nur wenn mindestens ein Trip ein Wetterarchiv hat */}
          {luck && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <h2 className="mb-2 flex items-center gap-2 font-serif text-base font-semibold">
                  <CloudSun
                    className="h-4 w-4 text-primary"
                    aria-hidden="true"
                  />
                  {t.trips.weatherLuckTitle}
                </h2>
                <p className="text-sm">
                  {t.trips.weatherLuckDry(Math.round(luck.dryShare * 100))}
                  {" · "}
                  {t.trips.weatherLuckAvgMax(Math.round(luck.avgTMax))}
                  {luck.warmest?.place && (
                    <>
                      {" · "}
                      {t.trips.weatherLuckWarmest(
                        luck.warmest.place,
                        Math.round(luck.warmest.tMax)
                      )}
                    </>
                  )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.trips.weatherLuckHint(luck.trips)}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Jahres-Vergleich: Übernachtungen pro Jahr als schlichte CSS-Balken
          (bewusst ohne Chart-Bibliothek – hält den Reisen-Chunk klein) */}
          {yearNights.length >= 2 && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <h2 className="mb-3 flex items-center gap-2 font-serif text-base font-semibold">
                  <CalendarDays
                    className="h-4 w-4 text-primary"
                    aria-hidden="true"
                  />
                  {t.trips.yearCompareTitle}
                </h2>
                <ul className="space-y-1.5">
                  {yearNights.map(({ year, nights }) => {
                    const max = yearNights.reduce(
                      (m, y) => Math.max(m, y.nights),
                      1
                    );
                    const current = year === new Date().getFullYear();
                    return (
                      <li
                        key={year}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span
                          className={cn(
                            "w-12 tabular-nums",
                            current && "font-semibold text-primary"
                          )}
                        >
                          {year}
                        </span>
                        <span className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                          <span
                            className={cn(
                              "block h-full rounded-full",
                              current ? "bg-primary" : "bg-primary/50"
                            )}
                            style={{
                              width: `${Math.max(4, (nights / max) * 100)}%`,
                            }}
                            aria-hidden="true"
                          />
                        </span>
                        <span className="w-24 text-right text-xs text-muted-foreground">
                          {t.trips.nightsCount(nights)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Meilensteine: erreichte farbig, die nächsten offenen mit Fortschritt */}
          {trips.length > 0 && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <h2 className="mb-3 flex items-center gap-2 font-serif text-base font-semibold">
                  <Award className="h-4 w-4 text-primary" aria-hidden="true" />
                  {t.trips.milestonesTitle}
                </h2>
                {achievedMilestones.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5">
                    {achievedMilestones.map(m => (
                      <li
                        key={m.id}
                        className="flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary"
                      >
                        <Award
                          className="h-3 w-3 shrink-0"
                          aria-hidden="true"
                        />
                        {m.label}
                        {m.achievedOn && (
                          <span className="font-normal text-primary/80">
                            ·{" "}
                            {t.trips.milestonesAchievedOn(
                              fmtMilestoneDate(m.achievedOn)
                            )}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {nextMilestones.length > 0 && (
                  <div className={achievedMilestones.length > 0 ? "mt-4" : ""}>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t.trips.milestonesNextTitle}
                    </h3>
                    <ul className="space-y-2.5">
                      {nextMilestones.map(m => (
                        <li key={m.id}>
                          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                            <span>{m.label}</span>
                            <span className="font-mono text-xs text-muted-foreground">
                              {t.trips.milestonesProgress(m.current, m.target)}
                            </span>
                          </div>
                          <Progress
                            value={(m.current / m.target) * 100}
                            aria-label={`${m.label}: ${t.trips.milestonesProgress(m.current, m.target)}`}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Jahresrückblick: nur wenn mindestens ein vergangener Trip existiert */}
          {yearReview && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 font-serif text-base font-semibold">
                    <Sparkles
                      className="h-4 w-4 text-primary"
                      aria-hidden="true"
                    />
                    {t.trips.yearReviewTitle}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Select
                      value={String(yearReview.year)}
                      onValueChange={setReviewYearChoice}
                    >
                      <SelectTrigger
                        className="w-28"
                        aria-label={t.trips.yearReviewYearAria}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {reviewYears.map(year => (
                          <SelectItem key={year} value={String(year)}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void shareYearReview()}
                      aria-label={t.trips.yearReviewShareAria(yearReview.year)}
                    >
                      <Share2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                      {t.trips.yearReviewShare}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div className="text-center">
                    <p className="font-serif text-2xl font-bold text-primary">
                      {yearReview.trips}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.trips.staysLabel}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{yearReview.nights}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.trips.nightsTotal}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{yearReview.places}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.trips.yearReviewPlaces}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="flex items-center justify-center gap-1 text-sm font-semibold leading-8">
                      <Trophy
                        className="h-4 w-4 shrink-0 text-chart-1"
                        aria-hidden="true"
                      />
                      <span className="truncate">
                        {yearReview.topPlace?.name ?? "–"}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.trips.yearReviewTopPlace}
                      {yearReview.topPlace
                        ? ` · ${t.trips.nightsCount(yearReview.topPlace.nights)}`
                        : ""}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="flex items-center justify-center gap-1 text-sm font-semibold leading-8">
                      <Moon
                        className="h-4 w-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <span className="truncate">
                        {yearReview.longestStay?.name ?? "–"}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.trips.yearReviewLongest}
                      {yearReview.longestStay
                        ? ` · ${t.trips.nightsCount(yearReview.longestStay.nights)}`
                        : ""}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="flex items-center justify-center gap-1 text-sm font-semibold leading-8">
                      <Star
                        className="h-4 w-4 shrink-0 fill-chart-1 text-chart-1"
                        aria-hidden="true"
                      />
                      <span className="truncate">
                        {yearReview.bestRated?.name ?? "–"}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.trips.bestRatedLabel}
                      {yearReview.bestRated
                        ? ` · ${t.trips.starsAvg(fmtRating(yearReview.bestRated.rating))}`
                        : ""}
                    </p>
                  </div>
                </div>
                {/* Wetter-Glück des Jahres (nur mit Wetterarchiv-Daten) */}
                {yearLuck && (
                  <p className="mt-4 flex items-center gap-1.5 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                    <CloudSun
                      className="h-3.5 w-3.5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    {t.trips.weatherLuckYear(
                      Math.round(yearLuck.dryShare * 100),
                      Math.round(yearLuck.avgTMax)
                    )}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Dialog «Neue Reise» / «Reise bearbeiten»: gemeinsames Erfassungs-Formular */}
      <Dialog
        open={formOpen}
        onOpenChange={o => {
          if (!o) closeForm();
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editingId !== null
                ? t.trips.editEntryTitle
                : t.trips.newTripButton}
            </DialogTitle>
            <DialogDescription>{t.trips.tripFormDialogDesc}</DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={e => {
              e.preventDefault();
              if (editingShared && editingTrip) {
                // Mitglieds-Trip: Zeltplatz-/Packlisten-Verknüpfung bleibt
                // unverändert (gehört der Besitzerin/dem Besitzer)
                if (editingTrip.spotId === null && !form.location.trim()) {
                  toast.error(t.trips.choosePlaceError);
                  return;
                }
                updateMutation.mutate({
                  id: editingTrip.id,
                  spotId: editingTrip.spotId,
                  packListId: editingTrip.packListId,
                  location:
                    editingTrip.spotId === null
                      ? form.location.trim()
                      : editingTrip.location,
                  title: form.title.trim() || null,
                  notes: form.notes.trim() || null,
                  startDate: form.startDate,
                  endDate: form.endDate,
                  rating: formRating,
                  arrivalTime: form.arrivalTime || null,
                  departureTime: form.departureTime || null,
                  pitchNumber: form.pitchNumber.trim() || null,
                  wifiName: form.wifiName.trim() || null,
                  wifiPassword: form.wifiPassword.trim() || null,
                  pitchNotes: form.pitchNotes.trim() || null,
                });
                return;
              }
              const spotId =
                spotChoice === FREE_LOCATION ? null : Number(spotChoice);
              if (spotId === null && !form.location.trim()) {
                toast.error(t.trips.choosePlaceError);
                return;
              }
              const payload = {
                spotId,
                packListId:
                  packListChoice === "keine" ? null : Number(packListChoice),
                location: spotId === null ? form.location.trim() : null,
                title: form.title.trim() || null,
                notes: form.notes.trim() || null,
                startDate: form.startDate,
                endDate: form.endDate,
                rating: formRating,
                arrivalTime: form.arrivalTime || null,
                departureTime: form.departureTime || null,
                pitchNumber: form.pitchNumber.trim() || null,
                wifiName: form.wifiName.trim() || null,
                wifiPassword: form.wifiPassword.trim() || null,
                pitchNotes: form.pitchNotes.trim() || null,
              };
              if (editingId !== null) {
                updateMutation.mutate({ id: editingId, ...payload });
              } else {
                addMutation.mutate(payload);
              }
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Zeltplatz/Packliste gehören der Besitzerin/dem Besitzer –
                  beim Bearbeiten eines Mitglieds-Trips ausgeblendet */}
              {!editingShared && (
                <div>
                  <Label htmlFor="trip-spot">{t.trips.placeLabel}</Label>
                  <Select value={spotChoice} onValueChange={setSpotChoice}>
                    <SelectTrigger id="trip-spot" className="mt-1.5 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={FREE_LOCATION}>
                        {t.trips.freeLocationOption}
                      </SelectItem>
                      {spots.map(s => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {(editingShared
                ? editingTrip?.spotId === null
                : spotChoice === FREE_LOCATION) && (
                <div>
                  <Label htmlFor="trip-location">
                    {t.trips.locationNameLabel}
                  </Label>
                  <Input
                    id="trip-location"
                    className="mt-1.5"
                    placeholder={t.trips.locationPlaceholder}
                    value={form.location}
                    onChange={e =>
                      setForm(f => ({ ...f, location: e.target.value }))
                    }
                  />
                </div>
              )}
              {!editingShared && (
                <div>
                  <Label htmlFor="trip-packlist">{t.trips.packListLabel}</Label>
                  <Select
                    value={packListChoice}
                    onValueChange={setPackListChoice}
                  >
                    <SelectTrigger id="trip-packlist" className="mt-1.5 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keine">
                        {t.trips.noPackList}
                      </SelectItem>
                      {/* Archivierte Packlisten (#194) tauchen in der
                          Auswahl nicht auf – bereits verknüpfte bleiben
                          aber wählbar, damit nichts stillschweigend abfällt */}
                      {(listsQuery.data ?? [])
                        .filter(
                          l =>
                            l.archivedAt == null ||
                            String(l.id) === packListChoice
                        )
                        .map(l => (
                          <SelectItem key={l.id} value={String(l.id)}>
                            {l.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="trip-start">{t.trips.arrivalLabel}</Label>
                <Input
                  id="trip-start"
                  className="mt-1.5"
                  type="date"
                  value={form.startDate}
                  max={form.endDate}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      startDate: e.target.value,
                      // Abreise automatisch nachziehen, wenn sie vor der Anreise läge
                      endDate:
                        f.endDate < e.target.value ? e.target.value : f.endDate,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="trip-end">{t.trips.departureLabel}</Label>
                <Input
                  id="trip-end"
                  className="mt-1.5"
                  type="date"
                  value={form.endDate}
                  min={form.startDate}
                  onChange={e =>
                    setForm(f => ({ ...f, endDate: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
            {/* Optionale Uhrzeiten – passend zu den Check-in-Zeiten des Platzes */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="trip-start-time">
                  {t.trips.arrivalTimeLabel}
                </Label>
                <Input
                  id="trip-start-time"
                  className="mt-1.5"
                  type="time"
                  value={form.arrivalTime}
                  onChange={e =>
                    setForm(f => ({ ...f, arrivalTime: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="trip-end-time">
                  {t.trips.departureTimeLabel}
                </Label>
                <Input
                  id="trip-end-time"
                  className="mt-1.5"
                  type="time"
                  value={form.departureTime}
                  onChange={e =>
                    setForm(f => ({ ...f, departureTime: e.target.value }))
                  }
                />
              </div>
            </div>
            {/* Stellplatz-Details (#252): gelten für diesen Aufenthalt */}
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-sm font-medium">{t.trips.pitchSectionTitle}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t.trips.pitchSectionHint}
              </p>
              <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="trip-pitch-number">
                    {t.trips.pitchNumberLabel}
                  </Label>
                  <Input
                    id="trip-pitch-number"
                    className="mt-1.5"
                    maxLength={40}
                    placeholder={t.trips.pitchNumberPlaceholder}
                    value={form.pitchNumber}
                    onChange={e =>
                      setForm(f => ({ ...f, pitchNumber: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="trip-wifi-name">
                    {t.trips.wifiNameLabel}
                  </Label>
                  <Input
                    id="trip-wifi-name"
                    className="mt-1.5"
                    maxLength={80}
                    placeholder={t.trips.wifiNamePlaceholder}
                    value={form.wifiName}
                    onChange={e =>
                      setForm(f => ({ ...f, wifiName: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="mt-3">
                <Label htmlFor="trip-wifi-password">
                  {t.trips.wifiPasswordLabel}
                </Label>
                <Input
                  id="trip-wifi-password"
                  className="mt-1.5"
                  maxLength={80}
                  placeholder={t.trips.wifiPasswordPlaceholder}
                  value={form.wifiPassword}
                  onChange={e =>
                    setForm(f => ({ ...f, wifiPassword: e.target.value }))
                  }
                />
              </div>
              <div className="mt-3">
                <Label htmlFor="trip-pitch-notes">
                  {t.trips.pitchNotesLabel}
                </Label>
                <Textarea
                  id="trip-pitch-notes"
                  className="mt-1.5"
                  rows={2}
                  placeholder={t.trips.pitchNotesPlaceholder}
                  value={form.pitchNotes}
                  onChange={e =>
                    setForm(f => ({ ...f, pitchNotes: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="trip-title">{t.trips.titleLabel}</Label>
              <Input
                id="trip-title"
                className="mt-1.5"
                placeholder={t.trips.titlePlaceholder}
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="trip-notes">{t.trips.notesLabel}</Label>
              <Textarea
                id="trip-notes"
                className="mt-1.5"
                rows={3}
                placeholder={t.trips.notesPlaceholder}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div>
              <Label>{t.trips.ratingLabel}</Label>
              <div className="mt-1.5">
                <StarRating
                  value={formRating}
                  onChange={setFormRating}
                  groupLabel={t.trips.ratingFormAria}
                />
              </div>
            </div>
            <DialogFooter className="pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={closeForm}
                disabled={addMutation.isPending || updateMutation.isPending}
              >
                {t.common.cancel}
              </Button>
              <Button
                type="submit"
                disabled={addMutation.isPending || updateMutation.isPending}
              >
                {editingId !== null ? (
                  <Pencil className="mr-1.5 h-4 w-4" aria-hidden="true" />
                ) : (
                  <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                )}
                {addMutation.isPending || updateMutation.isPending
                  ? t.common.saving
                  : editingId !== null
                    ? t.trips.saveChanges
                    : t.trips.submit}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Umschalten und Kalender betreffen die ganze Liste – bei einer
          einzelnen Reise gibt es nichts umzuschalten. */}
      {focusId === null && (
        <>
          {/* Umschalter Liste/Kalender – die Wahl bleibt gespeichert */}
          <div
            role="group"
            aria-label={t.trips.viewToggleAria}
            className="mb-4 flex gap-1.5"
          >
            <Button
              type="button"
              variant={tripsView === "list" ? "default" : "outline"}
              size="sm"
              aria-pressed={tripsView === "list"}
              onClick={() => selectTripsView("list")}
            >
              <List className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.trips.viewList}
            </Button>
            <Button
              type="button"
              variant={tripsView === "calendar" ? "default" : "outline"}
              size="sm"
              aria-pressed={tripsView === "calendar"}
              onClick={() => selectTripsView("calendar")}
            >
              <CalendarDays className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.trips.viewCalendar}
            </Button>
          </div>

          {/* Kalender-Ansicht: Monats-Gitter mit Aufenthalten und Ferien */}
          {tripsView === "calendar" && (
            <div className="mb-8">
              {holidayCantonPicker}
              {holidays && (
                <p className="mb-3 text-xs text-muted-foreground">
                  {t.trips.holidaySource}
                </p>
              )}
              <TripCalendar
                trips={calendarTrips}
                holidays={holidays}
                onTripClick={openTripFromCalendar}
              />
            </div>
          )}
        </>
      )}

      {/* Geplante Aufenthalte: Trips mit Anreise heute oder später */}
      {tripsView === "list" && shownPlanned.length > 0 && (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
              <CalendarClock
                className="h-5 w-5 text-primary"
                aria-hidden="true"
              />
              {t.trips.plannedTitle}
            </h2>
            {/* Sammel-Export (#244): alle geplanten Reisen in EINER Datei */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                downloadIcs(
                  plannedTrips,
                  icsFileName("campmesser-reisen", today, "reisen")
                )
              }
              aria-label={t.trips.icsAllAria}
            >
              <CalendarPlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.trips.icsAllButton}
            </Button>
          </div>
          {/* Kantons-Auswahl für Ferien-/Feiertags-Hinweise */}
          {holidayCantonPicker}
          {holidays && (
            <p className="mb-3 text-xs text-muted-foreground">
              {t.trips.holidaySource}
            </p>
          )}
          <ul className="mb-8 space-y-3">
            {shownPlanned.map(trip => {
              const days = daysUntilTrip(trip.startDate, today);
              const nights = tripNights(trip.startDate, trip.endDate);
              const dossierId = spotDossierId(trip);
              // Wetter-Packvorschläge nur kurz vor der Anreise und nur mit
              // verknüpfter Packliste UND Zeltplatz-Koordinaten (sonst still weglassen)
              const suggestionSpot =
                trip.packListId != null &&
                trip.spotId != null &&
                days <= PACK_SUGGESTION_DAYS_BEFORE
                  ? (spots.find(s => s.id === trip.spotId) ?? null)
                  : null;
              return (
                <li
                  key={trip.id}
                  className="rounded-xl border border-primary/40 bg-accent/30 p-4"
                >
                  <TripCoverBanner
                    tripId={trip.id}
                    coverPhotoId={trip.coverPhotoId}
                    tripName={label(trip)}
                  />
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Tent className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-semibold">
                        {/* Wie bei den vergangenen Aufenthalten: Der Titel
                            führt zur eigenen Adresse der Reise (#310). */}
                        {focusId === null ? (
                          <Link
                            href={`/tagebuch/${trip.id}`}
                            className="hover:underline"
                            aria-label={t.trips.openDetailAria(label(trip))}
                          >
                            {label(trip)}
                          </Link>
                        ) : (
                          label(trip)
                        )}
                        <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
                          {t.trips.countdown(days)}
                        </span>
                        {trip.role === "member" && (
                          <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                            <Users className="h-3 w-3" aria-hidden="true" />
                            {t.trips.sharedBadge}
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {trip.role === "member" && trip.ownerName && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" aria-hidden="true" />
                            {t.trips.sharedWith(trip.ownerName)}
                          </span>
                        )}
                        {/* Ort als Weg ins Dossier: Wer den Aufenthalt
                            anschaut, will von dort zum Platz – bisher
                            musste man über die Zeltplatz-Liste suchen */}
                        {(trip.title || dossierId != null) &&
                          (dossierId != null ? (
                            <Link
                              href={`/zeltplaetze/${dossierId}`}
                              className="flex items-center gap-1 font-medium text-primary hover:underline"
                              aria-label={t.trips.dossierAria(placeName(trip))}
                            >
                              <MapPin className="h-3 w-3" aria-hidden="true" />
                              {placeName(trip)}
                            </Link>
                          ) : (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" aria-hidden="true" />
                              {placeName(trip)}
                            </span>
                          ))}
                        <span className="flex items-center gap-1">
                          <CalendarDays
                            className="h-3 w-3"
                            aria-hidden="true"
                          />
                          {formatRange(trip.startDate, trip.endDate)}
                        </span>
                        {(trip.arrivalTime || trip.departureTime) && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            {t.trips.timesLine(
                              trip.arrivalTime,
                              trip.departureTime
                            )}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Moon className="h-3 w-3" aria-hidden="true" />
                          {t.trips.nightsCount(nights)}
                        </span>
                      </p>
                      {holidays && (
                        <TripHolidayHints
                          startDate={trip.startDate}
                          endDate={trip.endDate}
                          holidays={holidays}
                        />
                      )}
                      <TripPitchDetails trip={trip} />
                      <TripReadinessCard
                        trip={trip}
                        tripName={label(trip)}
                        onEdit={() => startEdit(trip)}
                      />
                      {trip.packListId != null && (
                        <PackProgress listId={trip.packListId} />
                      )}
                      {trip.packListId != null && suggestionSpot && (
                        <TripPackSuggestions
                          listId={trip.packListId}
                          latitude={suggestionSpot.latitude}
                          longitude={suggestionSpot.longitude}
                          startDate={trip.startDate}
                          endDate={trip.endDate}
                        />
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link
                            href={`/menueplan/${trip.id}`}
                            aria-label={t.trips.menuPlanAria(label(trip))}
                          >
                            <UtensilsCrossed
                              className="mr-1.5 h-4 w-4"
                              aria-hidden="true"
                            />
                            {t.trips.menuPlanButton}
                          </Link>
                        </Button>
                        {/* Reise-Einkaufsliste nur bei geteilten Reisen –
                            private Reisen nutzen die persönliche Liste */}
                        {trip.shared && (
                          <Button asChild variant="outline" size="sm">
                            <Link
                              href={`/menueplan/${trip.id}/einkauf`}
                              aria-label={t.tripShopping.openAria(label(trip))}
                            >
                              <ShoppingBasket
                                className="mr-1.5 h-4 w-4"
                                aria-hidden="true"
                              />
                              {t.tripShopping.openButton}
                            </Link>
                          </Button>
                        )}
                        {/* Maut, Vignette & Regeln (#228): das Zielland raten
                            wir aus Reise-Titel und Ortsnamen – ohne Treffer
                            führt der Knopf zur Länderauswahl */}
                        <Button asChild variant="outline" size="sm">
                          <Link
                            href={
                              tripCountry(trip)
                                ? `/laenderregeln?land=${tripCountry(trip)}`
                                : "/laenderregeln"
                            }
                            aria-label={t.trips.roadRulesAria(label(trip))}
                          >
                            <Signpost
                              className="mr-1.5 h-4 w-4"
                              aria-hidden="true"
                            />
                            {t.trips.roadRulesButton}
                            {tripCountryName(trip) && (
                              <span className="text-muted-foreground">
                                {" · "}
                                {tripCountryName(trip)}
                              </span>
                            )}
                          </Link>
                        </Button>
                        {/* Kalender-Export (#244) */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => downloadTripIcs(trip)}
                          aria-label={t.trips.icsAria(label(trip))}
                        >
                          <CalendarPlus
                            className="mr-1.5 h-4 w-4"
                            aria-hidden="true"
                          />
                          {t.trips.icsButton}
                        </Button>
                      </div>
                      {trip.notes && (
                        <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                          {trip.notes}
                        </p>
                      )}
                      {/* Reise-Tagebuch (#192): auch bei einer geplanten
                          Reise, sobald sie heute begonnen hat */}
                      {trip.startDate <= today && (
                        <TripJournal
                          tripId={trip.id}
                          tripName={label(trip)}
                          startDate={trip.startDate}
                          endDate={trip.endDate}
                          shared={trip.shared || trip.role === "member"}
                        />
                      )}
                      {/* Reisekasse (#219): auch schon vor der Anreise –
                          Platzmiete und Sprit fallen oft vorher an */}
                      <Suspense fallback={null}>
                        <TripExpenses
                          tripId={trip.id}
                          tripName={label(trip)}
                          defaultDay={
                            today > trip.endDate ? trip.endDate : today
                          }
                          shared={trip.shared || trip.role === "member"}
                          budgetRappen={trip.budgetRappen}
                        />
                      </Suspense>
                      {/* Termin-Finder (#253): nur bei gemeinsamen Reisen und
                          nur, solange die Reise noch bevorsteht – über einen
                          bereits gelaufenen Aufenthalt stimmt niemand ab */}
                      {(trip.shared || trip.role === "member") &&
                        trip.startDate > today && (
                          <TripDatePoll
                            tripId={trip.id}
                            tripName={label(trip)}
                          />
                        )}
                      {/* Pinnwand (#245): nur bei gemeinsamen Reisen – allein
                          hätte man niemanden, dem man etwas anpinnen könnte */}
                      {(trip.shared || trip.role === "member") && (
                        <TripBoard tripId={trip.id} tripName={label(trip)} />
                      )}
                      {/* Änderungsverlauf (#296): nur bei gemeinsamen
                          Reisen – allein ist «wer war das» schon
                          beantwortet */}
                      {(trip.shared || trip.role === "member") && (
                        <TripHistory tripId={trip.id} tripName={label(trip)} />
                      )}
                      {/* Gästebuch (#254): auch bei einer Reise ohne
                          Mitreisende – über den Teil-Link können Bekannte
                          einen Gruss hinterlassen */}
                      <TripGuestbook tripId={trip.id} tripName={label(trip)} />
                      {/* Buchungsbestätigung (#279): nur bei eigenen Reisen –
                          die Datei liegt am Konto der Besitzerin/des
                          Besitzers, Mitglieder sehen sie nicht */}
                      {trip.role !== "member" && (
                        <TripReservation
                          tripId={trip.id}
                          fileName={trip.reservationFileName ?? null}
                          className="mt-2"
                        />
                      )}
                      <TripPhotos
                        tripId={trip.id}
                        tripName={label(trip)}
                        coverPhotoId={trip.coverPhotoId}
                      />
                      {/* Foto-Collage (#226) */}
                      <Suspense fallback={null}>
                        <TripCollage
                          tripId={trip.id}
                          tripName={label(trip)}
                          startDate={trip.startDate}
                          endDate={trip.endDate}
                        />
                      </Suspense>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground/60 hover:text-foreground"
                        onClick={() => startEdit(trip)}
                        aria-label={t.trips.editEntryAria(label(trip))}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground/60 hover:text-foreground"
                        onClick={() =>
                          setDuplicateTrip({
                            id: trip.id,
                            name: label(trip),
                            startDate: trip.startDate,
                            endDate: trip.endDate,
                          })
                        }
                        aria-label={t.trips.duplicateAria(label(trip))}
                        title={t.trips.duplicateDialogTitle}
                      >
                        <CopyPlus className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                      {trip.role === "owner" ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground/60 hover:text-foreground"
                            onClick={() =>
                              setMembersTrip({
                                id: trip.id,
                                name: label(trip),
                              })
                            }
                            aria-label={t.trips.membersAria(label(trip))}
                          >
                            <Users className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground/60 hover:text-foreground"
                            onClick={() =>
                              setHubTrip({
                                id: trip.id,
                                name: label(trip),
                              })
                            }
                            aria-label={t.trips.hubShareAria(label(trip))}
                          >
                            <Share2
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground/60 hover:text-destructive"
                            onClick={() =>
                              removeMutation.mutate({ id: trip.id })
                            }
                            aria-label={t.trips.deletePlannedAria(label(trip))}
                          >
                            <Trash2
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground/60 hover:text-destructive"
                          disabled={leaveMutation.isPending}
                          onClick={async () => {
                            if (
                              await ask({
                                title: t.trips.leaveConfirm(label(trip)),
                                confirmLabel: t.common.confirmLeave,
                              })
                            ) {
                              leaveMutation.mutate({ tripId: trip.id });
                            }
                          }}
                          aria-label={t.trips.leaveTripAria(label(trip))}
                          title={t.trips.leaveTrip}
                        >
                          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* Einträge (nur Listen-Ansicht – der Kalender zeigt alle Aufenthalte) */}
      {tripsView === "list" && (focusId === null || shownTrips.length > 0) && (
        <>
          <h2 className="mb-3 font-serif text-lg font-semibold">
            {t.trips.entriesTitle}
          </h2>
          {shownTrips.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">{t.trips.empty}</p>
              {/* Zentraler Einstieg, solange noch nichts erfasst ist */}
              <Button className="mt-4" onClick={openNewTripDialog}>
                <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {t.trips.newTripButton}
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {shownTrips.map(trip => {
                const nights = tripNights(trip.startDate, trip.endDate);
                const dossierId = spotDossierId(trip);
                // Wetterarchiv nur mit Koordinaten eines verknüpften Favoriten
                const weatherSpot =
                  trip.spotId != null
                    ? (spots.find(s => s.id === trip.spotId) ?? null)
                    : null;
                return (
                  <li
                    key={trip.id}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <TripCoverBanner
                      tripId={trip.id}
                      coverPhotoId={trip.coverPhotoId}
                      tripName={label(trip)}
                    />
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                        {trip.spotId != null ? (
                          <Tent className="h-5 w-5" aria-hidden="true" />
                        ) : (
                          <MapPin className="h-5 w-5" aria-hidden="true" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 font-semibold">
                          {/* Titel führt zur eigenen Adresse der Reise (#310)
                              – von dort aus kann man sie verlinken, als
                              Lesezeichen setzen und ohne die Statistik
                              darüber lesen. Auf der Detailseite selbst wäre
                              der Link ein Verweis auf sich selbst. */}
                          {focusId === null ? (
                            <Link
                              href={`/tagebuch/${trip.id}`}
                              className="hover:underline"
                              aria-label={t.trips.openDetailAria(label(trip))}
                            >
                              {label(trip)}
                            </Link>
                          ) : (
                            label(trip)
                          )}
                          {trip.role === "member" && (
                            <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                              <Users className="h-3 w-3" aria-hidden="true" />
                              {t.trips.sharedBadge}
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {trip.role === "member" && trip.ownerName && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" aria-hidden="true" />
                              {t.trips.sharedWith(trip.ownerName)}
                            </span>
                          )}
                          {/* Ort als Weg ins Dossier: Wer den Aufenthalt
                              anschaut, will von dort zum Platz */}
                          {(trip.title || dossierId != null) &&
                            (dossierId != null ? (
                              <Link
                                href={`/zeltplaetze/${dossierId}`}
                                className="flex items-center gap-1 font-medium text-primary hover:underline"
                                aria-label={t.trips.dossierAria(
                                  placeName(trip)
                                )}
                              >
                                <MapPin
                                  className="h-3 w-3"
                                  aria-hidden="true"
                                />
                                {placeName(trip)}
                              </Link>
                            ) : (
                              <span className="flex items-center gap-1">
                                <MapPin
                                  className="h-3 w-3"
                                  aria-hidden="true"
                                />
                                {placeName(trip)}
                              </span>
                            ))}
                          <span className="flex items-center gap-1">
                            <CalendarDays
                              className="h-3 w-3"
                              aria-hidden="true"
                            />
                            {formatRange(trip.startDate, trip.endDate)}
                          </span>
                          {(trip.arrivalTime || trip.departureTime) && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              {t.trips.timesLine(
                                trip.arrivalTime,
                                trip.departureTime
                              )}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Moon className="h-3 w-3" aria-hidden="true" />
                            {t.trips.nightsCount(nights)}
                          </span>
                        </p>
                        {weatherSpot && (
                          <TripWeatherArchive
                            tripId={trip.id}
                            weatherJson={trip.weatherJson}
                            startDate={trip.startDate}
                            endDate={trip.endDate}
                            latitude={weatherSpot.latitude}
                            longitude={weatherSpot.longitude}
                          />
                        )}
                        <div className="mt-1.5">
                          <StarRating
                            size="sm"
                            value={trip.rating ?? null}
                            disabled={setRatingMutation.isPending}
                            onChange={rating =>
                              setRatingMutation.mutate({ id: trip.id, rating })
                            }
                            groupLabel={t.trips.ratingGroupAria(label(trip))}
                          />
                        </div>
                        {trip.notes && (
                          <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                            {trip.notes}
                          </p>
                        )}
                        {/* Reise-Tagebuch (#192): vergangene und laufende Reisen */}
                        <TripJournal
                          tripId={trip.id}
                          tripName={label(trip)}
                          startDate={trip.startDate}
                          endDate={trip.endDate}
                          shared={trip.shared || trip.role === "member"}
                        />
                        {/* Reisekasse (#219) */}
                        <TripExpenses
                          tripId={trip.id}
                          tripName={label(trip)}
                          defaultDay={
                            today > trip.endDate ? trip.endDate : today
                          }
                          shared={trip.shared || trip.role === "member"}
                          budgetRappen={trip.budgetRappen}
                        />
                        {/* Pinnwand (#245): nur bei gemeinsamen Reisen */}
                        {(trip.shared || trip.role === "member") && (
                          <TripBoard tripId={trip.id} tripName={label(trip)} />
                        )}
                        {/* Änderungsverlauf (#296) auch rückblickend:
                            «wer hat das damals eingetragen» */}
                        {(trip.shared || trip.role === "member") && (
                          <TripHistory
                            tripId={trip.id}
                            tripName={label(trip)}
                          />
                        )}
                        {/* Gästebuch (#254): gerade bei vergangenen Reisen
                            die Erinnerungs-Seite – Grüsse bleiben stehen */}
                        <TripGuestbook
                          tripId={trip.id}
                          tripName={label(trip)}
                        />
                        {/* Buchungsbestätigung (#279) – auch bei vergangenen
                            Reisen: die Rechnung will man später noch finden */}
                        {trip.role !== "member" && (
                          <TripReservation
                            tripId={trip.id}
                            fileName={trip.reservationFileName ?? null}
                            className="mt-2"
                          />
                        )}
                        <TripPhotos
                          tripId={trip.id}
                          tripName={label(trip)}
                          coverPhotoId={trip.coverPhotoId}
                        />
                        {/* Foto-Collage (#226) */}
                        <TripCollage
                          tripId={trip.id}
                          tripName={label(trip)}
                          startDate={trip.startDate}
                          endDate={trip.endDate}
                        />
                      </div>
                      <div className="flex shrink-0 flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground/60 hover:text-foreground"
                          onClick={() => startEdit(trip)}
                          aria-label={t.trips.editEntryAria(label(trip))}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground/60 hover:text-foreground"
                        >
                          <Link
                            href={`/tagebuch/${trip.id}/drucken`}
                            aria-label={t.trips.printEntryAria(label(trip))}
                          >
                            <Printer
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          </Link>
                        </Button>
                        {/* Kalender-Export (#244) – auch für vergangene Reisen */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground/60 hover:text-foreground"
                          onClick={() => downloadTripIcs(trip)}
                          aria-label={t.trips.icsAria(label(trip))}
                          title={t.trips.icsButton}
                        >
                          <CalendarPlus
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground/60 hover:text-foreground"
                          onClick={() =>
                            setDuplicateTrip({
                              id: trip.id,
                              name: label(trip),
                              startDate: trip.startDate,
                              endDate: trip.endDate,
                            })
                          }
                          aria-label={t.trips.duplicateAria(label(trip))}
                          title={t.trips.duplicateDialogTitle}
                        >
                          <CopyPlus
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        </Button>
                        {trip.role === "owner" ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground/60 hover:text-foreground"
                              onClick={() =>
                                setMembersTrip({
                                  id: trip.id,
                                  name: label(trip),
                                })
                              }
                              aria-label={t.trips.membersAria(label(trip))}
                            >
                              <Users
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground/60 hover:text-foreground"
                              onClick={() =>
                                setHubTrip({
                                  id: trip.id,
                                  name: label(trip),
                                })
                              }
                              aria-label={t.trips.hubShareAria(label(trip))}
                            >
                              <Share2
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground/60 hover:text-destructive"
                              onClick={() =>
                                removeMutation.mutate({ id: trip.id })
                              }
                              aria-label={t.trips.deleteEntryAria(label(trip))}
                            >
                              <Trash2
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground/60 hover:text-destructive"
                            disabled={leaveMutation.isPending}
                            onClick={async () => {
                              if (
                                await ask({
                                  title: t.trips.leaveConfirm(label(trip)),
                                  confirmLabel: t.common.confirmLeave,
                                })
                              ) {
                                leaveMutation.mutate({ tripId: trip.id });
                              }
                            }}
                            aria-label={t.trips.leaveTripAria(label(trip))}
                            title={t.trips.leaveTrip}
                          >
                            <LogOut
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {/* Dialog «Mitreisende» der gewählten eigenen Reise */}
      <TripMembersDialog
        trip={membersTrip}
        onClose={() => setMembersTrip(null)}
      />

      {/* Dialog «Reise-Hub teilen» der gewählten eigenen Reise – der aktuelle
          Teil-Token kommt live aus trips.list (bleibt nach Mutationen frisch) */}
      <TripShareDialog
        trip={
          hubTrip
            ? {
                ...hubTrip,
                shareToken:
                  allTrips.find(tr => tr.id === hubTrip.id)?.shareToken ?? null,
                shareExpiresAt:
                  allTrips.find(tr => tr.id === hubTrip.id)?.shareExpiresAt ??
                  null,
              }
            : null
        }
        onClose={() => setHubTrip(null)}
      />

      {/* Dialog «Reise duplizieren» – neue Daten wählen, gleiche Dauer als Vorschlag */}
      <TripDuplicateDialog
        trip={duplicateTrip}
        onClose={() => setDuplicateTrip(null)}
      />
    </div>
  );
}
