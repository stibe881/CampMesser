import { useEffect, useMemo, useRef, useState } from "react";
import { formatTripRange, MAX_FORECAST_DAYS } from "@/components/trips/shared";
import {
  PackProgress,
  RunningBadge,
  TripCoverBanner,
} from "@/components/trips/TripWidgets";
import {
  TripActionColumn,
  TripDetailSections,
  TripMetaLine,
} from "@/components/trips/TripListItemParts";
import TripDuplicateDialog from "@/components/trips/TripDuplicateDialog";
import TripHolidayHints from "@/components/trips/TripHolidayHints";
import TripMembersDialog from "@/components/trips/TripMembersDialog";
import TripPackSuggestions from "@/components/trips/TripPackSuggestions";
import PackExperienceHints from "@/components/trips/PackExperienceHints";
import TripPitchDetails from "@/components/trips/TripPitchDetails";
import TripReadinessCard from "@/components/trips/TripReadinessCard";
import TripShareDialog from "@/components/trips/TripShareDialog";
import TripWeatherArchive from "@/components/trips/TripWeatherArchive";
import { fmtDayMonth, fmtShort, fmtWeekdayLong } from "@/lib/dateFormat";
import { useConfirm } from "@/components/ConfirmDialog";
import { ShareExpiryNote, ShareExpirySelect } from "@/components/ShareExpiry";
import { relativeAge, type ShareExpiryDays } from "@shared/sharing";
import { tripDisplayName, tripPlaceName } from "@shared/tripName";
import {
  TRIP_KINDS,
  normalizeTripKind,
  tripKindLabel,
  type TripKind,
} from "@shared/tripKind";
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarClock,
  CalendarPlus,
  CalendarDays,
  ChevronDown,
  CloudSun,
  Copy,
  Eye,
  EyeOff,
  ChartColumn,
  Download,
  Fuel,
  Gauge,
  GraduationCap,
  LayoutGrid,
  List,
  Loader2,
  MapPin,
  MapPinned,
  MessageSquare,
  Pin,
  Plus,
  ShoppingBasket,
  Refrigerator,
  Signpost,
  Tent,
  Trophy,
  Users,
  UtensilsCrossed,
  Wallet,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { Link, useRoute, useSearch } from "wouter";
import { toast } from "sonner";
import QRCode from "qrcode";
import PageHeader from "@/components/PageHeader";
import DataAge from "@/components/DataAge";
import QueryError from "@/components/QueryError";
import ListSkeleton from "@/components/ListSkeleton";
import LoginPrompt from "@/components/LoginPrompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/i18n";
import { pick, type Language } from "@shared/i18n";
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
  currentTripDay,
  daysUntilTrip,
  TRIP_JOURNAL_MAX_LENGTH,
  tripNights,
} from "@shared/trips";
import {
  localMinutes,
  packingStillMatters,
  tripHasStarted,
} from "@shared/tripPhase";
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
import { forgetOfflineTripPack } from "@/lib/mapTiles";
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
import { climateRequestUrl } from "@shared/climate";
import {
  parseTripWeather,
  summarizeTripWeather,
  TRIP_WEATHER_ARCHIVE_MIN_AGE_DAYS,
} from "@shared/tripWeather";
import {
  CANTONS,
  holidayDisplayName,
  isHolidayCountry,
  overlappingHolidays,
  type Holiday,
} from "@shared/holidays";
import {
  loadCantonHolidays,
  loadCountryHolidays,
  type CantonHolidays,
} from "@/lib/holidays";
import { drawCollage } from "@/lib/collageImage";
import TripCalendar, { type CalendarTrip } from "@/components/TripCalendar";
import TripYearReview from "@/components/trips/TripYearReview";
import MonthIdeas from "@/components/trips/MonthIdeas";
import TripTemplatePicker from "@/components/TripTemplatePicker";
import TripFormDialog, { StarRating } from "@/components/trips/TripFormDialog";
import { useTodayIso } from "@/lib/useTodayIso";

/** So viele Tage vor der Anreise erscheinen die Wetter-Packvorschläge. */
const PACK_SUGGESTION_DAYS_BEFORE = 7;
/** Open-Meteo liefert höchstens so viele Prognose-Tage. */

/** Gemerkter Kanton für die Ferien-/Feiertags-Hinweise. */
const HOLIDAY_CANTON_KEY = "campmesser.holidayCanton";
/** Auswahlwert für «kein Kanton» (keine Hinweise). */
const HOLIDAY_CANTON_NONE = "keiner";

/** Leere Kantons-Ferien, wenn nur Zielland-Feiertage (#469) zu zeigen sind. */
const EMPTY_CANTON_HOLIDAYS: CantonHolidays = {
  school: [],
  publicHolidays: [],
};

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

  const today = useTodayIso();
  /**
   * Die Uhrzeit für «hat die Reise begonnen» (#361). Einmal pro Render
   * gelesen und nicht per Timer nachgeführt: In der Minute, in der die
   * Ankunftszeit vorbeigeht, sitzt man im Auto und nicht vor dieser Liste –
   * beim nächsten Öffnen stimmt es.
   */
  const nowMinutes = localMinutes();
  /** Eintrag, der gerade im Formular bearbeitet wird (null = neuer Eintrag). */
  const [editingId, setEditingId] = useState<number | null>(null);
  /** Erfassungs-Dialog «Neue Reise» / «Reise bearbeiten» offen? */
  const [formOpen, setFormOpen] = useState(false);

  /** Dialog im Neu-Modus öffnen. */
  const openNewTripDialog = () => {
    setEditingId(null);
    setFormOpen(true);
  };

  /** Dialog schliessen. */
  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  // Schnellaktion «Neuer Tagebuch-Eintrag» (?neu=1): den Reise-Dialog
  // öffnen – mit vorbelegtem Ort, wenn der Merkort ihn mitbringt (#562)
  const search = useSearch();
  const [newTripPlace, setNewTripPlace] = useState<{
    name: string;
    lat: number;
    lng: number;
  } | null>(null);
  useEffect(() => {
    if (!isAuthenticated) return;
    const params = new URLSearchParams(search);
    if (params.get("neu") !== "1") return;
    const ort = params.get("ort");
    const lat = Number(params.get("lat"));
    const lng = Number(params.get("lng"));
    setNewTripPlace(
      ort && Number.isFinite(lat) && Number.isFinite(lng)
        ? { name: ort, lat, lng }
        : null
    );
    openNewTripDialog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, isAuthenticated]);
  /**
   * Sprung zum Rückblick (?rueckblick=1, Nutzerwunsch 09.08.2026): Die
   * Heimkehr-Karte verlinkt direkt hierher – «Mehr»-Schalter und
   * Rückblick öffnen sich von selbst, statt dass man beides suchen muss.
   */
  const openReview = new URLSearchParams(search).get("rueckblick") === "1";

  const removeMutation = trpc.trips.remove.useMutation({
    onSuccess: (_data, vars) => {
      // Offline-Paket der Rundreise (#561) mit ausbuchen – die Kacheln im
      // Cache räumt das nächste Paket bzw. der Cache-Deckel selbst weg.
      forgetOfflineTripPack(vars.id);
      void utils.trips.list.invalidate();
    },
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

  /** Reiseliste nach Art filtern (#466); "alle" = kein Filter. */
  const [kindFilter, setKindFilter] = useState<TripKind | "alle">("alle");
  /**
   * Arten, die in den eigenen Reisen überhaupt vorkommen – Chips für
   * Arten ohne eine einzige Reise wären tote Knöpfe.
   */
  const presentKinds = useMemo(
    () =>
      TRIP_KINDS.filter(kind =>
        allTrips.some(trip => normalizeTripKind(trip.kind) === kind)
      ),
    [allTrips]
  );

  /**
   * Tagebuch nach Jahr filtern (#617); "alle" = kein Filter. Der Filter
   * greift nur auf vergangene Reisen und das Archiv – geplante Aufenthalte
   * liegen ohnehin in der Gegenwart und blieben sonst grundlos versteckt.
   */
  const [yearFilter, setYearFilter] = useState<string | "alle">("alle");

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

  /**
   * GEPLANT HEISST: NOCH NICHT LOSGEGANGEN (#363, Nutzermeldung «auch wenn
   * die Reise begonnen hat, steht sie unter geplante Aufenthalte»).
   *
   * Die Trennung lief über `isUpcomingTrip`, also `startDate >= today` –
   * der ganze ANREISETAG zählte damit als «geplant», auch abends auf dem
   * Platz. Neu entscheidet dieselbe Regel wie beim Packstand (#361):
   * `tripHasStarted` mit Datum und, falls erfasst, Ankunftszeit. Damit
   * wandert ein Aufenthalt genau in dem Moment aus der Planungs-Liste, in
   * dem Packstand und Packvorschlag verschwinden – ein Umschaltpunkt statt
   * zwei.
   *
   * Wohin er wandert, war schon vorbereitet: Die Liste darunter erkennt
   * laufende Aufenthalte seit #348 und setzt ein «Läuft gerade» daneben.
   */
  const plannedTrips = useMemo(
    () =>
      allTrips
        .filter(t => !tripHasStarted(t, today, nowMinutes))
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [allTrips, today, nowMinutes]
  );
  const trips = useMemo(
    () => allTrips.filter(t => tripHasStarted(t, today, nowMinutes)),
    [allTrips, today, nowMinutes]
  );

  /** Jahre, in denen es Reisen gibt – neuste zuerst (#617). */
  const presentYears = useMemo(
    () =>
      Array.from(new Set(trips.map(t => t.startDate.slice(0, 4))))
        .sort()
        .reverse(),
    [trips]
  );

  /**
   * Die Listen für die Anzeige. Ohne Fokus alles wie bisher; mit Fokus
   * genau die eine Reise – egal, ob sie vergangen oder geplant ist, sie
   * erscheint an ihrer gewohnten Stelle und ist damit gleich aufgebaut.
   */
  const shownTrips = useMemo(
    () =>
      focusId === null
        ? trips.filter(
            t =>
              t.archivedAt == null &&
              (kindFilter === "alle" ||
                normalizeTripKind(t.kind) === kindFilter) &&
              (yearFilter === "alle" || t.startDate.startsWith(yearFilter))
          )
        : trips.filter(t => t.id === focusId),
    [trips, focusId, kindFilter, yearFilter]
  );
  /**
   * Archivierte Aufenthalte (Nutzerwunsch 09.08.2026): aus der Liste
   * geräumt, aber nicht weg – sie stehen unten im eingeklappten Archiv
   * und zählen weiter für Statistik, Reisepass und Suche. Über die
   * Detail-Adresse /tagebuch/<id> bleibt jede archivierte Reise voll
   * erreichbar (shownTrips filtert bei Fokus bewusst nicht).
   */
  const archivedTrips = useMemo(
    () =>
      trips.filter(
        t =>
          t.archivedAt != null &&
          (kindFilter === "alle" || normalizeTripKind(t.kind) === kindFilter) &&
          (yearFilter === "alle" || t.startDate.startsWith(yearFilter))
      ),
    [trips, kindFilter, yearFilter]
  );
  const [archiveOpen, setArchiveOpen] = useState(false);
  const archiveMutation = trpc.trips.setArchived.useMutation({
    onSuccess: (_data, vars) => {
      toast.success(
        vars.archived ? t.trips.archivedToast : t.trips.unarchivedToast
      );
      void utils.trips.list.invalidate();
    },
    onError: () => toast.error(t.common.actionFailed),
  });
  const shownPlanned = useMemo(
    () =>
      focusId === null
        ? plannedTrips.filter(
            t =>
              kindFilter === "alle" || normalizeTripKind(t.kind) === kindFilter
          )
        : plannedTrips.filter(t => t.id === focusId),
    [plannedTrips, focusId, kindFilter]
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
   * Kalender-Datei erzeugen und herunterladen (Blob-Muster wie der
   * GPX-Export der Wanderungen). Vorher werden die Etappen jeder Reise
   * geholt (#556) – jede bekommt ihr eigenes «Etappe: …»-Ereignis; ohne
   * Netz fällt nur dieser Teil weg, die Reisen selbst bleiben drin.
   */
  const downloadIcs = async (
    list: (typeof allTrips)[number][],
    fileName: string
  ) => {
    try {
      const stopsByTrip = new Map<number, IcsTrip["stops"]>();
      await Promise.all(
        list.map(async trip => {
          try {
            const stops = await utils.trips.stops.list.fetch({
              tripId: trip.id,
            });
            if (stops.length > 0) stopsByTrip.set(trip.id, stops);
          } catch {
            // Etappen nicht ladbar (offline) – Reise-Ereignis genügt
          }
        })
      );
      const ics = buildTripIcs(
        list.map(trip => ({
          ...toIcsTrip(trip),
          stops: stopsByTrip.get(trip.id),
        })),
        {
          dtstamp: new Date(),
          lang,
        }
      );
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
    void downloadIcs([trip], icsFileName(label(trip), trip.startDate));
  };

  /** Eintrag im Dialog zum Bearbeiten öffnen – den Rest macht der Dialog. */
  const startEdit = (trip: (typeof allTrips)[number]) => {
    setEditingId(trip.id);
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

  // Ansicht der Aufenthalte: Liste (Standard) oder Monats-Kalender –
  // die Wahl bleibt über localStorage erhalten.
  const [tripsView, setTripsView] = useState<TripsView>(loadStoredTripsView);
  // Etappen aller Reisen (#573): der Kalender markiert die Wechseltage –
  // eine Abfrage, nur wenn die Kalender-Ansicht offen ist.
  const allStopsQuery = trpc.trips.stops.listAll.useQuery(undefined, {
    enabled: isAuthenticated && tripsView === "calendar",
    staleTime: 5 * 60_000,
  });
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
      allTrips
        .filter(
          trip =>
            kindFilter === "alle" || normalizeTripKind(trip.kind) === kindFilter
        )
        .map(trip => ({
          id: trip.id,
          // Die Art (#466) steht am Balken mit dran – Camping als
          // Normalfall bleibt unbeschriftet
          name:
            normalizeTripKind(trip.kind) === "camping"
              ? label(trip)
              : `${label(trip)} · ${tripKindLabel(normalizeTripKind(trip.kind), lang)}`,
          startDate: trip.startDate,
          endDate: trip.endDate,
          shared: trip.role === "member" || trip.shared,
        })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allTrips, spots, kindFilter, lang]
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

  /**
   * Feiertage des Ziellandes (#469): Für jede geplante Reise wird das Land
   * wie bei den Verkehrsregeln (#228) aus Titel und Ortsname geraten; für
   * DE/AT/FR/IT werden die landesweiten Feiertage geladen. Unabhängig von
   * der Kantonswahl – wer keine Schweizer Ferien sehen will, verpasst
   * trotzdem nicht den Feiertag am Zielort, an dem die Läden zu sind.
   */
  const [countryHolidays, setCountryHolidays] = useState<
    Record<string, Holiday[]>
  >({});

  const neededHolidayCountries = useMemo(() => {
    const codes = new Set<string>();
    for (const trip of plannedTrips) {
      const code = guessCountryCode(`${trip.title ?? ""} ${placeName(trip)}`);
      if (isHolidayCountry(code)) codes.add(code);
    }
    return Array.from(codes).sort();
  }, [plannedTrips, spots]);

  useEffect(() => {
    if (tripsView !== "list") return;
    let cancelled = false;
    for (const code of neededHolidayCountries) {
      if (countryHolidays[code]) continue;
      void loadCountryHolidays(code).then(result => {
        if (cancelled || !result) return;
        setCountryHolidays(prev =>
          prev[code] ? prev : { ...prev, [code]: result }
        );
      });
    }
    return () => {
      cancelled = true;
    };
  }, [neededHolidayCountries, tripsView, countryHolidays]);

  /** Zielland-Feiertage einer Reise für die Hinweis-Badges – oder null. */
  const tripDestinationHolidays = (
    trip: (typeof trips)[number]
  ): { countryName: string; holidays: Holiday[] } | null => {
    const code = tripCountry(trip);
    if (!isHolidayCountry(code)) return null;
    const loaded = countryHolidays[code];
    const countryName = tripCountryName(trip);
    if (!loaded || loaded.length === 0 || !countryName) return null;
    return { countryName, holidays: loaded };
  };

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

          {/* AUSWERTUNGEN LIEGEN AUF DER STATISTIK-SEITE (#357).

              Hier standen Kennzahlen, Wetter-Glück, Jahres-Vergleich und
              Meilensteine – dieselben vier Auswertungen, die /statistik
              seit #191 zeigt, aus denselben reinen Funktionen. Wer seine
              Reisen suchte, scrollte an zweihundert Zeilen Statistik
              vorbei, die es einen Fingertipp weiter ohnehin gibt.

              Der Jahresrückblick bleibt: Den gibt es NUR hier, und er ist
              zum Teilen gedacht, nicht zum Nachschlagen. */}
          <div className="mb-6">
            <Button asChild variant="outline" size="sm">
              <Link href="/statistik">
                <ChartColumn className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {t.trips.statsLink}
              </Link>
            </Button>
          </div>

          {/* Jahresrückblick (#62) – herausgelöst in #350 */}
          <TripYearReview trips={trips} tripLikes={pastTripLikes} />

          {/* Reiseziel-Ideen nach Monat (#654) – aus den eigenen Reisen */}
          <MonthIdeas trips={trips} />
        </>
      )}

      {/* Erfassungs-Formular (#483): eigener Baustein mit eigenem Zustand */}
      <TripFormDialog
        open={formOpen}
        editing={editingTrip}
        spots={spots}
        packLists={listsQuery.data ?? []}
        onClose={closeForm}
        initialPlace={newTripPlace}
      />

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

          {/* Nach Art filtern (#466) – erst ab zwei vorkommenden Arten,
              vorher wäre der Filter ein Knopf ohne Wirkung */}
          {presentKinds.length > 1 && (
            <div
              role="group"
              aria-label={t.trips.kindFilterAria}
              className="mb-4 flex flex-wrap gap-1.5"
            >
              <button
                type="button"
                onClick={() => setKindFilter("alle")}
                aria-pressed={kindFilter === "alle"}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  kindFilter === "alle"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {t.trips.kindFilterAll}
              </button>
              {presentKinds.map(kind => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setKindFilter(kind)}
                  aria-pressed={kindFilter === kind}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                    kindFilter === kind
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tripKindLabel(kind, lang)}
                </button>
              ))}
            </div>
          )}

          {/* Nach Jahr filtern (#617) – nur in der Liste (der Kalender hat
              seine eigene Monats-Navigation) und erst ab zwei Jahren */}
          {tripsView === "list" && presentYears.length > 1 && (
            <div
              role="group"
              aria-label={t.trips.yearFilterAria}
              className="mb-4 flex flex-wrap gap-1.5"
            >
              <button
                type="button"
                onClick={() => setYearFilter("alle")}
                aria-pressed={yearFilter === "alle"}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  yearFilter === "alle"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {t.trips.yearFilterAll}
              </button>
              {presentYears.map(year => (
                <button
                  key={year}
                  type="button"
                  onClick={() => setYearFilter(year)}
                  aria-pressed={yearFilter === year}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                    yearFilter === year
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {year}
                </button>
              ))}
            </div>
          )}

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
                stops={allStopsQuery.data ?? []}
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
                void downloadIcs(
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
              /**
               * PACKEN IST EIN THEMA VOR DER REISE (#361, Nutzerwunsch):
               * Der Packstand-Balken und der Wetter-Packvorschlag standen
               * auch dann noch da, wenn die Reise längst begonnen hatte –
               * «Geplant» ist alles ab heute, ein laufender Aufenthalt
               * bleibt also in dieser Liste. Wer auf dem Platz steht,
               * packt nicht mehr; die beiden Karten waren dort nur noch
               * Beiwerk. Die Regel steht in `shared/tripPhase.ts`.
               */
              const packingMatters = packingStillMatters(
                trip,
                today,
                nowMinutes
              );
              // Wetter-Packvorschläge nur kurz vor der Anreise und nur mit
              // verknüpfter Packliste UND Zeltplatz-Koordinaten (sonst still weglassen)
              const suggestionSpot =
                packingMatters &&
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
                        {/* Reise-Art (#460) – Camping ist der Normalfall
                            und braucht kein Etikett */}
                        {normalizeTripKind(trip.kind) !== "camping" && (
                          <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                            {tripKindLabel(normalizeTripKind(trip.kind), lang)}
                          </span>
                        )}
                        {trip.role === "member" && (
                          <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                            <Users className="h-3 w-3" aria-hidden="true" />
                            {t.trips.sharedBadge}
                          </span>
                        )}
                      </p>
                      <TripMetaLine
                        trip={trip}
                        dossierId={dossierId}
                        place={placeName(trip)}
                        range={formatRange(trip.startDate, trip.endDate)}
                        nights={nights}
                      />
                      {(holidays || tripDestinationHolidays(trip)) && (
                        <TripHolidayHints
                          startDate={trip.startDate}
                          endDate={trip.endDate}
                          holidays={holidays ?? EMPTY_CANTON_HOLIDAYS}
                          destination={tripDestinationHolidays(trip)}
                        />
                      )}
                      <TripPitchDetails trip={trip} />
                      <TripReadinessCard
                        trip={trip}
                        tripName={label(trip)}
                        onEdit={() => startEdit(trip)}
                        // Reisetage-Ampel (#587): Platz-Koordinaten,
                        // sonst die der Reise aus der Ortssuche (#465)
                        latitude={
                          (trip.spotId != null
                            ? spots.find(s => s.id === trip.spotId)?.latitude
                            : undefined) ??
                          trip.latitude ??
                          null
                        }
                        longitude={
                          (trip.spotId != null
                            ? spots.find(s => s.id === trip.spotId)?.longitude
                            : undefined) ??
                          trip.longitude ??
                          null
                        }
                      />
                      {packingMatters && trip.packListId != null && (
                        <PackProgress listId={trip.packListId} />
                      )}
                      {trip.packListId != null && suggestionSpot && (
                        <TripPackSuggestions
                          listId={trip.packListId}
                          latitude={suggestionSpot.latitude}
                          longitude={suggestionSpot.longitude}
                          startDate={trip.startDate}
                          endDate={trip.endDate}
                          kind={trip.kind}
                        />
                      )}
                      {/* Was frühere Reisen über diese Liste sagen (#381) –
                          nur solange Packen noch ein Thema ist. */}
                      {packingMatters && trip.packListId != null && (
                        <PackExperienceHints listId={trip.packListId} />
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {/* Der Weg zu allem Übrigen (#359): In der Liste
                            stehen nur noch Titelzeile, Bereitschaft und
                            Packstand – Journal, Reisekasse, Pinnwand, Fotos
                            und der Rest liegen auf der Detailseite. Der
                            Titel führt dorthin, aber ein Titel sieht nicht
                            aus wie ein Weg. */}
                        {focusId === null && (
                          <Button asChild size="sm">
                            <Link
                              href={`/tagebuch/${trip.id}`}
                              aria-label={t.trips.openDetailAria(label(trip))}
                            >
                              <Tent
                                className="mr-1.5 h-4 w-4"
                                aria-hidden="true"
                              />
                              {t.trips.openTrip}
                            </Link>
                          </Button>
                        )}
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
                        {/* Kühlbox & Trockenvorrat (#365, Nutzerwunsch):
                            Der Vorrat ist zwar nicht an eine Reise
                            gebunden – es gibt EINE Kühlbox –, aber
                            angeschaut wird er beim Aufenthalt. Wer den
                            Menüplan macht, will als Nächstes wissen, was
                            schon drin ist. */}
                        <Button asChild variant="outline" size="sm">
                          <Link
                            href="/kuehlbox"
                            aria-label={t.trips.foodAria(label(trip))}
                          >
                            <Refrigerator
                              className="mr-1.5 h-4 w-4"
                              aria-hidden="true"
                            />
                            {t.trips.foodButton}
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
                      {/* Detail-Abschnitte NUR auf der Detailseite (#359),
                          lazy beim Scrollen (#347) – der Stapel selbst
                          lebt seit #554 in TripDetailSections. */}
                      {focusId !== null && (
                        <TripDetailSections
                          trip={trip}
                          name={label(trip)}
                          today={today}
                          phase="planned"
                        />
                      )}
                    </div>
                    <TripActionColumn
                      trip={trip}
                      name={label(trip)}
                      phase="planned"
                      onEdit={() => startEdit(trip)}
                      onDuplicate={() =>
                        setDuplicateTrip({
                          id: trip.id,
                          name: label(trip),
                          startDate: trip.startDate,
                          endDate: trip.endDate,
                        })
                      }
                      onMembers={() =>
                        setMembersTrip({ id: trip.id, name: label(trip) })
                      }
                      onHub={() =>
                        setHubTrip({ id: trip.id, name: label(trip) })
                      }
                      onRemove={() => removeMutation.mutate({ id: trip.id })}
                      onIcs={() => downloadTripIcs(trip)}
                      onLeave={() => leaveMutation.mutate({ tripId: trip.id })}
                      leavePending={leaveMutation.isPending}
                    />
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
                          {/* Reise-Art (#460) – nur abseits des Normalfalls */}
                          {normalizeTripKind(trip.kind) !== "camping" && (
                            <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                              {tripKindLabel(
                                normalizeTripKind(trip.kind),
                                lang
                              )}
                            </span>
                          )}
                          {trip.role === "member" && (
                            <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                              <Users className="h-3 w-3" aria-hidden="true" />
                              {t.trips.sharedBadge}
                            </span>
                          )}
                          {/* LAUFENDER AUFENTHALT (#348): «Geplant» ist alles
                              ab heute – sobald eine Reise begonnen hat, fällt
                              sie in diese Liste und stand dort ohne jedes
                              Zeichen zwischen den abgeschlossenen. Dass man
                              gerade auf dem Platz ist, wussten Startseite und
                              «Heute», nur die Reiseliste nicht. */}
                          <RunningBadge trip={trip} today={today} />
                        </p>
                        <TripMetaLine
                          trip={trip}
                          dossierId={dossierId}
                          place={placeName(trip)}
                          range={formatRange(trip.startDate, trip.endDate)}
                          nights={nights}
                        />
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
                        <div className="mt-2 flex flex-wrap gap-2">
                          {/* Der Weg zu allem Übrigen (#359) – siehe oben
                              bei den geplanten Aufenthalten. */}
                          {focusId === null && (
                            <Button asChild size="sm">
                              <Link
                                href={`/tagebuch/${trip.id}`}
                                aria-label={t.trips.openDetailAria(label(trip))}
                              >
                                <Tent
                                  className="mr-1.5 h-4 w-4"
                                  aria-hidden="true"
                                />
                                {t.trips.openTrip}
                              </Link>
                            </Button>
                          )}
                          {/* Kühlbox nur beim LAUFENDEN Aufenthalt (#365):
                              Neben einer Reise von 2019 wäre der Knopf
                              sinnlos – der Vorrat von damals ist längst
                              gegessen. Während der Reise ist er dagegen
                              das, was man am häufigsten aufmacht. */}
                          {currentTripDay(trip, today) && (
                            <Button asChild variant="outline" size="sm">
                              <Link
                                href="/kuehlbox"
                                aria-label={t.trips.foodAria(label(trip))}
                              >
                                <Refrigerator
                                  className="mr-1.5 h-4 w-4"
                                  aria-hidden="true"
                                />
                                {t.trips.foodButton}
                              </Link>
                            </Button>
                          )}
                        </div>
                        {/* Detail-Abschnitte NUR auf der Detailseite (#359),
                            lazy beim Scrollen (#347) – der Stapel selbst
                            lebt seit #554 in TripDetailSections. */}
                        {focusId !== null && (
                          <TripDetailSections
                            trip={trip}
                            name={label(trip)}
                            today={today}
                            phase="past"
                            openReview={openReview}
                          />
                        )}
                      </div>
                      <TripActionColumn
                        trip={trip}
                        name={label(trip)}
                        phase="past"
                        onEdit={() => startEdit(trip)}
                        onDuplicate={() =>
                          setDuplicateTrip({
                            id: trip.id,
                            name: label(trip),
                            startDate: trip.startDate,
                            endDate: trip.endDate,
                          })
                        }
                        onMembers={() =>
                          setMembersTrip({ id: trip.id, name: label(trip) })
                        }
                        onHub={() =>
                          setHubTrip({ id: trip.id, name: label(trip) })
                        }
                        onRemove={() => removeMutation.mutate({ id: trip.id })}
                        onIcs={() => downloadTripIcs(trip)}
                        onArchive={() =>
                          archiveMutation.mutate({
                            id: trip.id,
                            archived: true,
                          })
                        }
                        onLeave={() =>
                          leaveMutation.mutate({ tripId: trip.id })
                        }
                        leavePending={leaveMutation.isPending}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {/* Archiv (Nutzerwunsch 09.08.2026): standardmässig zu – wer
              es öffnet, sieht die geräumten Aufenthalte als schlanke
              Zeilen mit dem Weg zurück (Muster Packlisten #194). */}
          {focusId === null && archivedTrips.length > 0 && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setArchiveOpen(o => !o)}
                aria-expanded={archiveOpen}
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <Archive className="h-4 w-4" aria-hidden="true" />
                {t.trips.archiveSection(archivedTrips.length)}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    archiveOpen && "rotate-180"
                  )}
                  aria-hidden="true"
                />
              </button>
              {archiveOpen && (
                <>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.trips.archiveHint}
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {archivedTrips.map(trip => (
                      <li
                        key={trip.id}
                        className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2"
                      >
                        <Link
                          href={`/tagebuch/${trip.id}`}
                          className="min-w-0 flex-1 truncate text-sm hover:underline"
                        >
                          {label(trip)}
                          <span className="ml-2 text-xs text-muted-foreground">
                            {formatTripRange(
                              trip.startDate,
                              trip.endDate,
                              lang
                            )}
                          </span>
                        </Link>
                        {trip.role === "owner" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-muted-foreground/60 hover:text-foreground"
                            disabled={archiveMutation.isPending}
                            onClick={() =>
                              archiveMutation.mutate({
                                id: trip.id,
                                archived: false,
                              })
                            }
                            aria-label={t.trips.unarchiveAria(label(trip))}
                          >
                            <ArchiveRestore
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
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
