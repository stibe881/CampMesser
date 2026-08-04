import { useEffect, useMemo, useRef, useState } from "react";
import { ShareExpiryNote, ShareExpirySelect } from "@/components/ShareExpiry";
import { relativeAge, type ShareExpiryDays } from "@shared/sharing";
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
import { Link, useSearch } from "wouter";
import { toast } from "sonner";
import QRCode from "qrcode";
import PageHeader from "@/components/PageHeader";
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

/** Auswahlwert für «Ort frei eintragen» im Zeltplatz-Select. */
const FREE_LOCATION = "frei";

/** So viele Tage vor der Anreise erscheinen die Wetter-Packvorschläge. */
const PACK_SUGGESTION_DAYS_BEFORE = 7;
/** Open-Meteo liefert höchstens so viele Prognose-Tage. */
const MAX_FORECAST_DAYS = 16;

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
function TripHolidayHints({
  startDate,
  endDate,
  holidays,
}: {
  startDate: string;
  endDate: string;
  holidays: CantonHolidays;
}) {
  const { lang, t } = useI18n();
  // Gleiche Ferien können mehrfach vorkommen (Schulkreise) – Namen deduplizieren
  const schoolNames = Array.from(
    new Set(
      overlappingHolidays(startDate, endDate, holidays.school).map(h =>
        holidayDisplayName(h, lang)
      )
    )
  );
  const publicDays = overlappingHolidays(
    startDate,
    endDate,
    holidays.publicHolidays
  );
  if (schoolNames.length === 0 && publicDays.length === 0) return null;
  const fmtDay = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(LOCALE_TAGS[lang], {
      day: "2-digit",
      month: "2-digit",
    });
  return (
    <p className="mt-1.5 flex flex-wrap gap-1.5">
      {schoolNames.map(name => (
        <span
          key={`schule-${name}`}
          className="flex items-center gap-1 rounded-full bg-chart-4/15 px-2.5 py-0.5 text-xs font-medium"
        >
          <GraduationCap className="h-3 w-3 shrink-0" aria-hidden="true" />
          {t.trips.holidaySchoolBadge(name)}
        </span>
      ))}
      {publicDays.map(h => (
        <span
          key={`feiertag-${h.id}`}
          className="flex items-center gap-1 rounded-full bg-chart-1/15 px-2.5 py-0.5 text-xs font-medium"
        >
          <Star className="h-3 w-3 shrink-0" aria-hidden="true" />
          {t.trips.holidayPublicBadge(
            fmtDay(h.startDate),
            holidayDisplayName(h, lang)
          )}
        </span>
      ))}
    </p>
  );
}

/**
 * 5 klickbare Sterne als radiogroup – ein Klick auf den bereits gewählten
 * Stern wählt die Bewertung wieder ab (onChange(null)).
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
function TripPitchDetails({
  trip,
}: {
  trip: {
    pitchNumber: string | null;
    wifiName: string | null;
    wifiPassword: string | null;
    pitchNotes: string | null;
  };
}) {
  const t = useT();
  const [showPassword, setShowPassword] = useState(false);
  const has =
    trip.pitchNumber || trip.wifiName || trip.wifiPassword || trip.pitchNotes;
  if (!has) return null;
  return (
    <div className="mt-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm">
      <p className="flex items-center gap-1.5 font-medium">
        <MapPinned className="h-4 w-4 text-primary" aria-hidden="true" />
        {t.trips.pitchSectionTitle}
      </p>
      <dl className="mt-1.5 space-y-1">
        {trip.pitchNumber && (
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-muted-foreground">
              {t.trips.pitchNumberLabel}
            </dt>
            <dd className="font-medium">{trip.pitchNumber}</dd>
          </div>
        )}
        {trip.wifiName && (
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-muted-foreground">{t.trips.wifiNameLabel}</dt>
            <dd className="font-medium">{trip.wifiName}</dd>
          </div>
        )}
        {trip.wifiPassword && (
          <div className="flex flex-wrap items-center gap-x-2">
            <dt className="text-muted-foreground">
              {t.trips.wifiPasswordLabel}
            </dt>
            <dd className="font-mono font-medium">
              {showPassword ? trip.wifiPassword : "••••••••"}
            </dd>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowPassword(v => !v)}
              aria-label={
                showPassword
                  ? t.trips.wifiPasswordHide
                  : t.trips.wifiPasswordShow
              }
            >
              {showPassword ? (
                <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                navigator.clipboard
                  ?.writeText(trip.wifiPassword ?? "")
                  .then(() => toast.success(t.common.linkCopied))
                  .catch(() => toast.error(t.common.copyFailed));
              }}
              aria-label={t.trips.wifiPasswordCopy}
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        )}
      </dl>
      {trip.pitchNotes && (
        <p className="mt-1.5 whitespace-pre-wrap text-muted-foreground">
          {trip.pitchNotes}
        </p>
      )}
    </div>
  );
}

/** Pack-Fortschritt einer verknüpften Liste, z. B. «12 von 19 gepackt». */
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
const READINESS_ICONS: Record<ReadinessKey, typeof ListChecks> = {
  packList: ListChecks,
  menuPlan: UtensilsCrossed,
  shopping: ShoppingBasket,
  spot: MapPin,
  arrivalTime: Clock,
};

/**
 * Reise-Cockpit: aufklappbare Bereitschafts-Karte pro geplantem Aufenthalt.
 * Packstand, Menüplan-Lücken, offene Reise-Einkäufe und fehlende Angaben in
 * einer Liste – je Zeile mit Status und Direktlink. Die Abfragen laufen
 * bewusst ERST beim Aufklappen (enabled), damit die Übersicht mit vielen
 * geplanten Reisen nicht unnötig lädt.
 */
function TripReadinessCard({
  trip,
  tripName,
  onEdit,
}: {
  trip: {
    id: number;
    startDate: string;
    endDate: string;
    packListId: number | null;
    spotId: number | null;
    arrivalTime: string | null;
    shared?: boolean;
  };
  tripName: string;
  onEdit: () => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);

  const packQuery = trpc.packing.progress.useQuery(
    { listId: trip.packListId ?? 0 },
    { enabled: open && trip.packListId != null }
  );
  const menuQuery = trpc.menu.listByTrip.useQuery(
    { tripId: trip.id },
    { enabled: open }
  );
  const shoppingQuery = trpc.tripShopping.listByTrip.useQuery(
    { tripId: trip.id },
    { enabled: open }
  );

  const days = useMemo(
    () => tripDays(trip.startDate, trip.endDate),
    [trip.startDate, trip.endDate]
  );

  const readiness = useMemo(
    () =>
      tripReadiness({
        hasSpot: trip.spotId != null,
        hasArrivalTime: Boolean(trip.arrivalTime),
        packList:
          trip.packListId == null
            ? null
            : packQuery.data
              ? {
                  checked: packQuery.data.checked,
                  total: packQuery.data.total,
                }
              : { checked: 0, total: 0 },
        menu: menuQuery.data
          ? countMainSlots(days, menuQuery.data.entries)
          : null,
        shopping: shoppingQuery.data
          ? {
              open: shoppingQuery.data.items.filter(i => !i.checked).length,
              total: shoppingQuery.data.items.length,
            }
          : null,
        sharedTrip: trip.shared === true,
      }),
    [
      trip.spotId,
      trip.arrivalTime,
      trip.packListId,
      trip.shared,
      packQuery.data,
      menuQuery.data,
      shoppingQuery.data,
      days,
    ]
  );

  const loading =
    menuQuery.isLoading ||
    shoppingQuery.isLoading ||
    (trip.packListId != null && packQuery.isLoading);

  /** Beschriftung und Ziel einer Zeile – Texte bleiben hier im Client. */
  const rowText = (row: (typeof readiness.rows)[number]) => {
    switch (row.key) {
      case "packList":
        return {
          label: t.trips.readinessPackListLabel,
          detail:
            trip.packListId == null
              ? t.trips.readinessPackListMissing
              : row.status === "ok"
                ? t.trips.readinessPackListDone
                : t.trips.readinessPackListOpen(row.value),
          href:
            trip.packListId == null
              ? "/packlisten"
              : `/packlisten/${trip.packListId}`,
        };
      case "menuPlan":
        return {
          label: t.trips.readinessMenuLabel,
          detail:
            row.status === "ok"
              ? t.trips.readinessMenuDone
              : t.trips.readinessMenuOpen(row.value),
          href: `/menueplan/${trip.id}`,
        };
      case "shopping":
        return {
          label: t.trips.readinessShoppingLabel,
          detail:
            row.status === "ok"
              ? t.trips.readinessShoppingDone
              : t.trips.readinessShoppingOpen(row.value),
          href: `/menueplan/${trip.id}/einkauf`,
        };
      case "spot":
        return {
          label: t.trips.readinessSpotLabel,
          detail:
            row.status === "ok"
              ? t.trips.readinessSpotDone
              : t.trips.readinessSpotMissing,
          href: null,
        };
      case "arrivalTime":
      default:
        return {
          label: t.trips.readinessArrivalLabel,
          detail:
            row.status === "ok"
              ? t.trips.readinessArrivalDone
              : t.trips.readinessArrivalMissing,
          href: null,
        };
    }
  };

  return (
    <div className="mt-2 rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={t.trips.readinessToggleAria(tripName)}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm"
      >
        <Gauge className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-left font-medium">
          {t.trips.readinessTitle}
        </span>
        {open && !loading && (
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
              readiness.openCount === 0
                ? "bg-primary/15 text-primary"
                : "bg-accent text-accent-foreground"
            )}
          >
            {readiness.openCount === 0
              ? t.trips.readinessAllDone
              : t.trips.readinessOpenCount(readiness.openCount)}
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
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t.trips.readinessLoading}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {readiness.rows.map(row => {
                const { label, detail, href } = rowText(row);
                const Icon = READINESS_ICONS[row.key];
                return (
                  <li key={row.key} className="flex items-center gap-2 text-sm">
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        row.status === "ok"
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">{label}</span>
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        {detail}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[0.7rem] font-medium",
                        row.status === "ok"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {row.status === "ok"
                        ? t.trips.readinessStatusOk
                        : t.trips.readinessStatusOpen}
                    </span>
                    {href ? (
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-7 shrink-0 px-2 text-xs"
                      >
                        <Link
                          href={href}
                          aria-label={t.trips.readinessOpenAria(label)}
                        >
                          {t.trips.readinessOpenLink}
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 shrink-0 px-2 text-xs"
                        onClick={onEdit}
                        aria-label={t.trips.readinessEditAria(tripName)}
                      >
                        {t.trips.readinessEditLink}
                      </Button>
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
 * Wetter-basierte Packvorschläge für einen geplanten Aufenthalt mit
 * verknüpfter Packliste und Zeltplatz-Koordinaten: lädt kurz vor der Anreise
 * die Tages-Prognose (Open-Meteo, Muster fetchSpotForecast) und zeigt nur
 * Vorschläge, die noch nicht auf der Liste stehen – dezent aufklappbar.
 * Fehler bleiben still (kein Netz/kein Wetterdienst → kein Abschnitt).
 */
function TripPackSuggestions({
  listId,
  latitude,
  longitude,
  startDate,
  endDate,
}: {
  listId: number;
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
}) {
  const { lang, t } = useI18n();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [forecastDays, setForecastDays] = useState<ForecastDay[] | null>(null);
  const itemsQuery = trpc.packing.items.useQuery({ listId });

  useEffect(() => {
    let cancelled = false;
    const today = new Date().toISOString().slice(0, 10);
    // Nur so viele Tage abrufen, wie bis zur Abreise nötig (max. Open-Meteo-Horizont)
    const horizon = Math.min(
      MAX_FORECAST_DAYS,
      Math.max(1, daysUntilTrip(endDate, today) + 1)
    );
    const params = new URLSearchParams({
      latitude: latitude.toFixed(4),
      longitude: longitude.toFixed(4),
      timezone: "auto",
      forecast_days: String(horizon),
      daily:
        "temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_gusts_10m_max",
    });
    fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`)
      .then(res =>
        res.ok ? res.json() : Promise.reject(new Error("weather unavailable"))
      )
      .then(json => {
        if (cancelled) return;
        const days = (json.daily.time as string[])
          .map((date: string, i: number) => ({
            date,
            tMax: json.daily.temperature_2m_max[i] as number,
            tMin: json.daily.temperature_2m_min[i] as number,
            precipProb: (json.daily.precipitation_probability_max?.[i] ??
              0) as number,
            windMax: json.daily.wind_gusts_10m_max?.[i] as number | undefined,
          }))
          // Nur die Tage des Aufenthalts, und nur vollständige Werte
          .filter(
            d =>
              d.date >= startDate &&
              d.date <= endDate &&
              typeof d.tMax === "number" &&
              typeof d.tMin === "number"
          )
          .map(({ date: _date, ...day }) => day);
        setForecastDays(days);
      })
      .catch(() => {
        // Wetterdienst nicht erreichbar – Vorschläge still weglassen
      });
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, startDate, endDate]);

  const suggestions = useMemo(
    () => (forecastDays ? packingSuggestions(forecastDays, lang) : []),
    [forecastDays, lang]
  );
  const listItems = itemsQuery.data?.items;
  // Namens-Abgleich case-insensitiv gegen die Einträge in der aktiven Sprache
  const missing = useMemo(() => {
    if (!listItems) return [];
    const onList = new Set(listItems.map(i => i.name.trim().toLowerCase()));
    return suggestions.filter(s => !onList.has(s.name.trim().toLowerCase()));
  }, [suggestions, listItems]);

  const addMutation = trpc.packing.addItems.useMutation({
    onSuccess: (_data, vars) => {
      utils.packing.items.invalidate({ listId });
      utils.packing.progress.invalidate({ listId });
      toast.success(
        vars.items.length === 1
          ? t.trips.packSuggestionsAdded(vars.items[0].name)
          : t.trips.packSuggestionsAddedAll(vars.items.length)
      );
    },
    onError: () => toast.error(t.trips.packSuggestionsAddFailed),
  });

  const addSuggestions = (toAdd: PackSuggestion[]) => {
    if (toAdd.length === 0) return;
    addMutation.mutate({
      listId,
      items: toAdd.map(s => ({
        name: s.name,
        category: s.category,
        quantity: 1,
      })),
    });
  };

  if (missing.length === 0) return null;

  return (
    <div className="mt-2 rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm"
      >
        <CloudSun
          className="h-4 w-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate text-left font-medium">
          {t.trips.packSuggestionsTitle}
        </span>
        <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
          {t.trips.packSuggestionsBadge(missing.length)}
        </span>
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
          <p className="mb-2 text-xs text-muted-foreground">
            {t.trips.packSuggestionsHint}
          </p>
          <ul className="space-y-1.5">
            {missing.map(s => (
              <li key={s.name} className="flex items-center gap-2 text-sm">
                <div className="min-w-0 flex-1">
                  <span className="font-medium">{s.name}</span>
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {s.reason}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 shrink-0 px-2 text-xs"
                  disabled={addMutation.isPending}
                  onClick={() => addSuggestions([s])}
                  aria-label={t.trips.packSuggestionsAddAria(s.name)}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                  {t.trips.packSuggestionsAdd}
                </Button>
              </li>
            ))}
          </ul>
          {missing.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2.5"
              disabled={addMutation.isPending}
              onClick={() => addSuggestions(missing)}
            >
              <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.trips.packSuggestionsAddAll}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Wetterarchiv eines vergangenen Aufenthalts: zeigt die gespeicherte
 * Zusammenfassung («31° / 12° · 2 Regentage»). Fehlt sie noch, werden die
 * historischen Tageswerte einmalig geholt (Open-Meteo-Archiv; bei ganz
 * frischen Trips die Forecast-API mit past_days, weil das Archiv die
 * jüngsten Tage noch nicht führt) und via trips.setWeather gespeichert –
 * einmal gespeichert wird nie wieder gefetcht. Fehler bleiben still.
 */
function TripWeatherArchive({
  tripId,
  weatherJson,
  startDate,
  endDate,
  latitude,
  longitude,
}: {
  tripId: number;
  weatherJson: string | null;
  startDate: string;
  endDate: string;
  latitude: number;
  longitude: number;
}) {
  const t = useT();
  const utils = trpc.useUtils();
  const stored = useMemo(() => parseTripWeather(weatherJson), [weatherJson]);
  const setWeatherMutation = trpc.trips.setWeather.useMutation({
    onSuccess: () => utils.trips.list.invalidate(),
  });
  const mutateRef = useRef(setWeatherMutation.mutate);
  mutateRef.current = setWeatherMutation.mutate;
  // Pro Einhängen höchstens ein Abruf-Versuch – nach dem Speichern verhindert
  // das gefüllte weatherJson jeden weiteren.
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (stored || attemptedRef.current) return;
    const today = new Date().toISOString().slice(0, 10);
    // Nur abgeschlossene Aufenthalte haben ein vollständiges Archiv
    if (endDate >= today) return;
    attemptedRef.current = true;
    let cancelled = false;
    // Das Archiv hinkt einige Tage hinterher – frische Trips über die
    // Forecast-API mit past_days abdecken (Muster server/push.ts)
    const daysSinceEnd = daysUntilTrip(today, endDate);
    let url: string;
    if (daysSinceEnd >= TRIP_WEATHER_ARCHIVE_MIN_AGE_DAYS) {
      url = climateRequestUrl(latitude, longitude, startDate, endDate);
    } else {
      const pastDays = Math.min(
        92,
        Math.max(1, daysUntilTrip(today, startDate))
      );
      const params = new URLSearchParams({
        latitude: latitude.toFixed(4),
        longitude: longitude.toFixed(4),
        timezone: "auto",
        past_days: String(pastDays),
        forecast_days: "1",
        daily: "temperature_2m_max,temperature_2m_min,precipitation_sum",
      });
      url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
    }
    fetch(url)
      .then(res =>
        res.ok ? res.json() : Promise.reject(new Error("weather unavailable"))
      )
      .then(json => {
        if (cancelled) return;
        const daily = json?.daily as
          | {
              time: string[];
              temperature_2m_max: (number | null)[];
              temperature_2m_min: (number | null)[];
              precipitation_sum: (number | null)[];
            }
          | undefined;
        if (!daily || !Array.isArray(daily.time)) return;
        // Nur die Tage des Aufenthalts zusammenfassen (die Forecast-Antwort
        // enthält auch Tage ausserhalb des Zeitraums)
        const inRange = daily.time
          .map((date, i) => ({ date, i }))
          .filter(d => d.date >= startDate && d.date <= endDate)
          .map(d => d.i);
        const summary = summarizeTripWeather({
          temperature_2m_max: inRange.map(i => daily.temperature_2m_max?.[i]),
          temperature_2m_min: inRange.map(i => daily.temperature_2m_min?.[i]),
          precipitation_sum: inRange.map(i => daily.precipitation_sum?.[i]),
        });
        // Noch lückenhaft (z. B. Archiv hinkt nach) → beim nächsten Besuch erneut
        if (summary) mutateRef.current({ id: tripId, summary });
      })
      .catch(() => {
        // Wetterdienst nicht erreichbar – still bleiben, später erneut versuchen
      });
    return () => {
      cancelled = true;
    };
  }, [stored, tripId, startDate, endDate, latitude, longitude]);

  if (!stored) return null;
  return (
    <p
      className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"
      title={t.trips.weatherTitle}
    >
      <CloudSun className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="sr-only">{t.trips.weatherTitle}: </span>
      {t.trips.weatherSummary(
        Math.round(stored.tMax),
        Math.round(stored.tMin)
      )}{" "}
      · {t.trips.weatherRainDays(stored.rainDays)}
    </p>
  );
}

/**
 * Tages-Journal einer Reise (#192): aufklappbarer Abschnitt «Reise-Tagebuch»
 * bei vergangenen UND laufenden Reisen. Pro Reisetag (chronologisch) eine
 * Zeile mit Datum + Wochentag; ein Stift öffnet das Textfeld für den Tag.
 * Mitreisende dürfen mitschreiben – bei gemeinsamen Reisen steht «von <Name>»
 * am Eintrag. Geladen wird erst beim Aufklappen (enabled-Flag).
 */
function TripJournal({
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
  const [open, setOpen] = useState(false);
  /** Tag, dessen Textfeld gerade offen ist (null = keines). */
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const query = trpc.trips.journal.list.useQuery({ tripId }, { enabled: open });
  const setMutation = trpc.trips.journal.set.useMutation({
    onSuccess: (_data, vars) => {
      utils.trips.journal.list.invalidate({ tripId });
      setEditingDay(null);
      toast.success(
        vars.text?.trim() ? t.trips.journalSaved : t.trips.journalDeleted
      );
    },
    onError: e => toast.error(e.message || t.trips.journalSaveFailed),
  });

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
    new Date(`${iso}T00:00:00`).toLocaleDateString(LOCALE_TAGS[lang], {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

  return (
    <div className="mt-2 rounded-lg border border-border bg-card">
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
        {open && !query.isLoading && (
          <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
            {t.trips.journalCount(query.data?.length ?? 0)}
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
                        <p className="text-xs font-semibold capitalize text-muted-foreground">
                          {fmtDay(day)}
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
                            </>
                          ) : (
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {t.trips.journalEmptyDay}
                            </p>
                          ))}
                      </div>
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
function TripBoard({ tripId, tripName }: { tripId: number; tripName: string }) {
  const { lang, t } = useI18n();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<TripBoardKind>("message");
  const [draft, setDraft] = useState("");
  const query = trpc.trips.board.list.useQuery(
    { tripId },
    // Refetch-Intervall wie bei den geteilten Listen (SharedPackList/SharedTrip)
    { enabled: open, refetchInterval: open ? 15000 : false }
  );
  const addMutation = trpc.trips.board.add.useMutation({
    onSuccess: () => {
      utils.trips.board.list.invalidate({ tripId });
      setDraft("");
      toast.success(t.tripBoard.added);
    },
    onError: e => toast.error(e.message || t.tripBoard.addFailed),
  });
  const doneMutation = trpc.trips.board.setDone.useMutation({
    onSuccess: () => utils.trips.board.list.invalidate({ tripId }),
    onError: e => toast.error(e.message || t.tripBoard.doneFailed),
  });
  const removeMutation = trpc.trips.board.remove.useMutation({
    onSuccess: () => {
      utils.trips.board.list.invalidate({ tripId });
      toast.success(t.tripBoard.removed);
    },
    onError: e => toast.error(e.message || t.tripBoard.removeFailed),
  });

  const notes = query.data ?? [];
  const counts = useMemo(() => tripBoardCounts(notes), [notes]);

  /** «vor 5 Minuten» in der aktiven Sprache (Muster SharedLocation/Sos). */
  const ago = (timestamp: Date | string) => {
    const { value, unit } = relativeAge(timestamp);
    return new Intl.RelativeTimeFormat(LOCALE_TAGS[lang], {
      numeric: "auto",
    }).format(value, unit);
  };

  const submit = () => {
    if (!isValidTripBoardText(draft)) {
      toast.error(t.tripBoard.textRequired);
      return;
    }
    addMutation.mutate({ tripId, kind, text: draft });
  };

  return (
    <div className="mt-2 rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={t.tripBoard.toggleAria(tripName)}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm"
      >
        <Pin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-left font-medium">
          {t.tripBoard.title}
        </span>
        {open && !query.isLoading && counts.openTasks > 0 && (
          <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
            {t.tripBoard.openTasks(counts.openTasks)}
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
          <p className="mb-2 text-xs text-muted-foreground">
            {t.tripBoard.hint}
          </p>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start">
            <Select
              value={kind}
              onValueChange={v => setKind(v as TripBoardKind)}
            >
              <SelectTrigger
                className="sm:w-40"
                aria-label={t.tripBoard.kindAria}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRIP_BOARD_KINDS.map(k => (
                  <SelectItem key={k} value={k}>
                    {pick(TRIP_BOARD_KIND_LABELS[k], lang)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              value={draft}
              rows={2}
              maxLength={TRIP_BOARD_TEXT_MAX_LENGTH}
              placeholder={
                kind === "task"
                  ? t.tripBoard.taskPlaceholder
                  : t.tripBoard.messagePlaceholder
              }
              onChange={e => setDraft(e.target.value)}
              aria-label={t.tripBoard.textAria}
              className="flex-1"
            />
            <Button
              size="sm"
              className="shrink-0"
              disabled={addMutation.isPending}
              onClick={submit}
            >
              <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.tripBoard.addButton}
            </Button>
          </div>
          {query.isLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t.common.loading}
            </p>
          ) : notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.tripBoard.empty}</p>
          ) : (
            <ul className="space-y-2">
              {notes.map(note => {
                const isTask = normalizeTripBoardKind(note.kind) === "task";
                const done = isTask && note.done;
                return (
                  <li
                    key={note.id}
                    className={cn(
                      "flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2",
                      done && "opacity-60"
                    )}
                  >
                    {isTask ? (
                      <Checkbox
                        checked={note.done}
                        disabled={doneMutation.isPending}
                        onCheckedChange={checked =>
                          doneMutation.mutate({
                            id: note.id,
                            done: checked === true,
                          })
                        }
                        aria-label={t.tripBoard.doneAria(note.text)}
                        className="mt-0.5 shrink-0"
                      />
                    ) : (
                      <MessageSquare
                        className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "whitespace-pre-line break-words text-sm",
                          done && "line-through"
                        )}
                      >
                        {note.text}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t.tripBoard.byLine(
                          note.createdByName ?? t.tripBoard.unknownPerson,
                          ago(note.createdAt)
                        )}
                      </p>
                      {done && note.doneAt && (
                        <p className="text-xs text-muted-foreground">
                          {t.tripBoard.doneLine(
                            note.doneByName ?? t.tripBoard.unknownPerson,
                            ago(note.doneAt)
                          )}
                        </p>
                      )}
                    </div>
                    {note.canRemove && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground/60 hover:text-destructive"
                        disabled={removeMutation.isPending}
                        onClick={() => {
                          if (!confirm(t.tripBoard.removeConfirm)) return;
                          removeMutation.mutate({ id: note.id });
                        }}
                        aria-label={t.tripBoard.removeAria(note.text)}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
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

/** Balkenfarbe je Kategorie – feste Zuordnung, damit sie wiedererkennbar bleibt. */
const EXPENSE_CATEGORY_BARS: Record<ExpenseCategory, string> = {
  camping: "bg-chart-1",
  essen: "bg-chart-2",
  sprit: "bg-chart-3",
  freizeit: "bg-chart-4",
  sonstiges: "bg-chart-5",
};

/**
 * Reisekasse einer Reise (#219): Ausgabenliste mit Summe, Aufteilung nach
 * Kategorie und «wer schuldet wem». Aufklappbar wie das Reise-Tagebuch –
 * die Ausgaben werden erst beim Öffnen geladen. Beträge stecken durchgehend
 * als Rappen-Ganzzahlen in der Datenbank; gerechnet wird in shared/expenses.ts.
 */
function TripExpenses({
  tripId,
  tripName,
  defaultDay,
  shared,
}: {
  tripId: number;
  tripName: string;
  /** Vorschlag fürs Datumsfeld: heute, sonst der Reisebeginn. */
  defaultDay: string;
  shared: boolean;
}) {
  const { lang, t } = useI18n();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  /** null = Formular zu, "neu" = neue Ausgabe, sonst die Id der bearbeiteten. */
  const [editing, setEditing] = useState<number | "neu" | null>(null);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("essen");
  const [description, setDescription] = useState("");
  const [day, setDay] = useState(defaultDay);
  const [paidBy, setPaidBy] = useState("");

  const query = trpc.trips.expenses.list.useQuery(
    { tripId },
    { enabled: open }
  );
  const expenses = useMemo(() => query.data ?? [], [query.data]);

  const closeForm = () => {
    setEditing(null);
    setAmount("");
    setDescription("");
  };

  const invalidate = () => utils.trips.expenses.list.invalidate({ tripId });

  const addMutation = trpc.trips.expenses.add.useMutation({
    onSuccess: () => {
      invalidate();
      closeForm();
      toast.success(t.tripExpenses.saved);
    },
    onError: e => toast.error(e.message || t.tripExpenses.saveFailed),
  });
  const updateMutation = trpc.trips.expenses.update.useMutation({
    onSuccess: () => {
      invalidate();
      closeForm();
      toast.success(t.tripExpenses.updated);
    },
    onError: e => toast.error(e.message || t.tripExpenses.saveFailed),
  });
  const removeMutation = trpc.trips.expenses.remove.useMutation({
    onSuccess: () => {
      invalidate();
      toast.success(t.tripExpenses.deleted);
    },
    onError: () => toast.error(t.tripExpenses.deleteFailed),
  });

  const total = useMemo(() => expensesTotalRappen(expenses), [expenses]);
  const byCategory = useMemo(() => expensesByCategory(expenses), [expenses]);
  const settlements = useMemo(
    () =>
      settleUp(expenses.map(e => ({ who: e.paidBy, rappen: e.amountRappen }))),
    [expenses]
  );
  /** Bereits erfasste Zahlende – als Vorschläge fürs Namensfeld. */
  const knownPayers = useMemo(() => {
    const names: string[] = [];
    expenses.forEach(e => {
      const name = e.paidBy.trim();
      if (name && !names.some(n => n.toLowerCase() === name.toLowerCase())) {
        names.push(name);
      }
    });
    return names.slice(0, 6);
  }, [expenses]);

  const money = (rappen: number) =>
    `${t.tripExpenses.currency} ${formatChf(rappen, lang)}`;
  const fmtDay = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(LOCALE_TAGS[lang], {
      day: "numeric",
      month: "short",
    });
  const labelOf = (expense: { description: string | null }) =>
    expense.description?.trim() || t.tripExpenses.untitled;

  const startNew = () => {
    setEditing("neu");
    setAmount("");
    setCategory("essen");
    setDescription("");
    setDay(defaultDay);
    setPaidBy(
      knownPayers[0] ?? user?.name ?? user?.email ?? t.tripExpenses.meFallback
    );
  };

  const startEditExpense = (expense: (typeof expenses)[number]) => {
    setEditing(expense.id);
    setAmount(rappenToInput(expense.amountRappen));
    setCategory(normalizeExpenseCategory(expense.category));
    setDescription(expense.description ?? "");
    setDay(expense.day);
    setPaidBy(expense.paidBy);
  };

  const submit = () => {
    const rappen = parseChfInput(amount);
    if (rappen === null || rappen < 1) {
      toast.error(t.tripExpenses.amountInvalid);
      return;
    }
    const who = paidBy.trim();
    if (!who) {
      toast.error(t.tripExpenses.paidByRequired);
      return;
    }
    const payload = {
      amountRappen: Math.min(rappen, EXPENSE_MAX_RAPPEN),
      category,
      description: description.trim().slice(0, EXPENSE_DESCRIPTION_MAX_LENGTH),
      day,
      paidBy: who.slice(0, EXPENSE_PAID_BY_MAX_LENGTH),
    };
    if (editing === "neu") addMutation.mutate({ tripId, ...payload });
    else if (typeof editing === "number")
      updateMutation.mutate({ id: editing, ...payload });
  };

  const busy = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="mt-2 rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={t.tripExpenses.toggleAria(tripName)}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm"
      >
        <Wallet className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-left font-medium">
          {t.tripExpenses.title}
        </span>
        {open && !query.isLoading && expenses.length > 0 && (
          <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
            {money(total)}
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
        <div className="space-y-3 border-t border-border px-3 py-2.5">
          <p className="text-xs text-muted-foreground">{t.tripExpenses.hint}</p>
          {query.isLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t.common.loading}
            </p>
          ) : (
            <>
              {expenses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t.tripExpenses.empty}
                </p>
              ) : (
                <>
                  {/* Summe */}
                  <div className="flex items-baseline justify-between rounded-lg bg-muted/40 px-3 py-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t.tripExpenses.total}
                    </span>
                    <span className="font-mono text-lg font-bold tabular-nums">
                      {money(total)}
                    </span>
                  </div>

                  {/* Aufteilung nach Kategorie – schlichte Balken */}
                  <div>
                    <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t.tripExpenses.categoryTitle}
                    </h4>
                    <ul className="space-y-1.5">
                      {byCategory
                        .filter(entry => entry.rappen > 0)
                        .map(entry => {
                          const percent =
                            total > 0
                              ? Math.round((entry.rappen / total) * 100)
                              : 0;
                          return (
                            <li key={entry.category}>
                              <div className="flex items-baseline justify-between text-xs">
                                <span className="font-medium">
                                  {pick(
                                    EXPENSE_CATEGORY_LABELS[entry.category],
                                    lang
                                  )}
                                </span>
                                <span className="font-mono tabular-nums text-muted-foreground">
                                  {money(entry.rappen)} ·{" "}
                                  {t.tripExpenses.categoryShare(percent)}
                                </span>
                              </div>
                              <div
                                className="mt-0.5 h-2 w-full overflow-hidden rounded-full bg-border"
                                aria-hidden="true"
                              >
                                <div
                                  className={cn(
                                    "h-full rounded-full",
                                    EXPENSE_CATEGORY_BARS[entry.category]
                                  )}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </li>
                          );
                        })}
                    </ul>
                  </div>

                  {/* Wer schuldet wem */}
                  <div>
                    <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t.tripExpenses.settleTitle}
                    </h4>
                    {settlements.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t.tripExpenses.settleNone}
                      </p>
                    ) : (
                      <ul className="space-y-1">
                        {settlements.map((s, i) => (
                          <li
                            key={`${s.from}-${s.to}-${i}`}
                            className="flex flex-wrap items-center gap-1.5 rounded-lg bg-muted/40 px-3 py-1.5 text-sm"
                          >
                            <span className="font-medium">{s.from}</span>
                            <ArrowRight
                              className="h-3.5 w-3.5 text-muted-foreground"
                              aria-hidden="true"
                            />
                            <span className="font-medium">{s.to}</span>
                            <span className="ml-auto font-mono font-semibold tabular-nums">
                              {money(s.rappen)}
                            </span>
                            <span className="sr-only">
                              {t.tripExpenses.settleLine(
                                s.from,
                                s.to,
                                money(s.rappen)
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.tripExpenses.settleHint}
                    </p>
                  </div>

                  {/* Einzelne Ausgaben */}
                  <ul className="space-y-1">
                    {expenses.map(expense => (
                      <li
                        key={expense.id}
                        className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-x-2 text-sm font-medium">
                            {labelOf(expense)}
                            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
                              {pick(
                                EXPENSE_CATEGORY_LABELS[
                                  normalizeExpenseCategory(expense.category)
                                ],
                                lang
                              )}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {fmtDay(expense.day)} ·{" "}
                            {t.tripExpenses.paidByLine(expense.paidBy)}
                            {shared && expense.createdByName
                              ? ` · ${t.tripExpenses.byLine(expense.createdByName)}`
                              : ""}
                          </p>
                        </div>
                        <span className="shrink-0 font-mono text-sm font-semibold tabular-nums">
                          {money(expense.amountRappen)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground/60 hover:text-foreground"
                          onClick={() => startEditExpense(expense)}
                          aria-label={t.tripExpenses.editAria(labelOf(expense))}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground/60 hover:text-destructive"
                          onClick={() => {
                            if (
                              confirm(
                                t.tripExpenses.deleteConfirm(labelOf(expense))
                              )
                            ) {
                              removeMutation.mutate({ id: expense.id });
                            }
                          }}
                          aria-label={t.tripExpenses.deleteAria(
                            labelOf(expense)
                          )}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* Erfassen / Bearbeiten */}
              {editing === null ? (
                <Button variant="outline" size="sm" onClick={startNew}>
                  <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {t.tripExpenses.addButton}
                </Button>
              ) : (
                <div className="space-y-2 rounded-lg border border-border p-3">
                  <p className="text-sm font-semibold">
                    {editing === "neu"
                      ? t.tripExpenses.newTitle
                      : t.tripExpenses.editTitle}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <Label htmlFor={`expense-amount-${tripId}`}>
                        {t.tripExpenses.amountLabel}
                      </Label>
                      <Input
                        id={`expense-amount-${tripId}`}
                        className="mt-1"
                        inputMode="decimal"
                        placeholder={t.tripExpenses.amountPlaceholder}
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`expense-day-${tripId}`}>
                        {t.tripExpenses.dayLabel}
                      </Label>
                      <Input
                        id={`expense-day-${tripId}`}
                        className="mt-1"
                        type="date"
                        value={day}
                        onChange={e => setDay(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="mb-1 block">
                      {t.tripExpenses.categoryLabel}
                    </Label>
                    <div
                      className="flex flex-wrap gap-1.5"
                      role="group"
                      aria-label={t.tripExpenses.categoryAria}
                    >
                      {EXPENSE_CATEGORIES.map(key => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setCategory(key)}
                          aria-pressed={category === key}
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                            category === key
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {pick(EXPENSE_CATEGORY_LABELS[key], lang)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor={`expense-desc-${tripId}`}>
                      {t.tripExpenses.descriptionLabel}
                    </Label>
                    <Input
                      id={`expense-desc-${tripId}`}
                      className="mt-1"
                      maxLength={EXPENSE_DESCRIPTION_MAX_LENGTH}
                      placeholder={t.tripExpenses.descriptionPlaceholder}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`expense-paidby-${tripId}`}>
                      {t.tripExpenses.paidByLabel}
                    </Label>
                    <Input
                      id={`expense-paidby-${tripId}`}
                      className="mt-1"
                      maxLength={EXPENSE_PAID_BY_MAX_LENGTH}
                      placeholder={t.tripExpenses.paidByPlaceholder}
                      value={paidBy}
                      onChange={e => setPaidBy(e.target.value)}
                    />
                    {knownPayers.length > 0 && (
                      <div
                        className="mt-1.5 flex flex-wrap gap-1.5"
                        role="group"
                        aria-label={t.tripExpenses.paidBySuggestionsAria}
                      >
                        {knownPayers.map(name => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => setPaidBy(name)}
                            className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" disabled={busy} onClick={submit}>
                      {busy ? t.common.saving : t.tripExpenses.save}
                    </Button>
                    <Button size="sm" variant="outline" onClick={closeForm}>
                      {t.common.cancel}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** URL eines Trip-Fotos (gleiche Origin – Canvas bleibt dadurch untainted). */
const tripPhotoSrc = (fileName: string) => `/api/trips/photos/${fileName}`;

/** Zeitraum einer Reise als Text, z. B. «3. Aug. 2026 – 9. Aug. 2026». */
function formatTripRange(
  startDate: string,
  endDate: string,
  lang: Language
): string {
  const fmt = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(LOCALE_TAGS[lang], {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  if (startDate === endDate) return fmt(startDate);
  return `${fmt(startDate)} – ${fmt(endDate)}`;
}

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
function TripCollage({
  tripId,
  tripName,
  startDate,
  endDate,
}: {
  tripId: number;
  tripName: string;
  startDate: string;
  endDate: string;
}) {
  const { lang, t } = useI18n();
  const photosQuery = trpc.trips.photos.list.useQuery({ tripId });
  const photos = photosQuery.data ?? [];
  const [open, setOpen] = useState(false);
  const [layout, setLayout] = useState<CollageLayoutId>("grid2");
  /** Ausgewählte Foto-Ids in der Reihenfolge des Antippens. */
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  const capacity = collageCapacity(layout);
  /** Nur die ersten `capacity` Fotos landen im Bild – der Rest bleibt weg. */
  const used = selected.slice(0, capacity);

  const openDialog = () => {
    setSelected(photos.slice(0, collageCapacity(layout)).map(p => p.id));
    setOpen(true);
  };

  const togglePhoto = (photoId: number) => {
    setSelected(prev =>
      prev.includes(photoId)
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };

  /** Ein Foto laden; scheitert es, fällt es still aus der Collage. */
  const loadPhoto = (fileName: string): Promise<HTMLImageElement | null> =>
    new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = tripPhotoSrc(fileName);
    });

  /** Die Collage zeichnen und als PNG-Blob zurückgeben. */
  const buildBlob = async (): Promise<Blob> => {
    const files = used
      .map(id => photos.find(photo => photo.id === id))
      .filter((photo): photo is (typeof photos)[number] => photo !== undefined);
    const loaded = await Promise.all(files.map(p => loadPhoto(p.fileName)));
    const images = loaded.filter(
      (img): img is HTMLImageElement => img !== null
    );
    if (images.length === 0) throw new Error("Kein Foto ladbar");
    const canvas = document.createElement("canvas");
    drawCollage(canvas, {
      photos: images,
      layout,
      title: tripName,
      subtitle: formatTripRange(startDate, endDate, lang),
    });
    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, "image/png")
    );
    if (!blob) throw new Error("Canvas lieferte kein Bild");
    return blob;
  };

  const fileName = `campmesser-collage-${startDate}.png`;

  /** Herunterladen über einen a[download]-Link. */
  const downloadBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t.trips.collageSaved);
  };

  /** Teilen per Web Share API Level 2, sonst herunterladen. */
  const shareCollage = async () => {
    setBusy(true);
    try {
      const blob = await buildBlob();
      const file = new File([blob], fileName, { type: "image/png" });
      if (
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: `CampMesser · ${tripName}`,
        });
      } else {
        downloadBlob(blob);
      }
    } catch (error) {
      // Abbruch des Teilen-Dialogs ist kein Fehler
      if ((error as DOMException)?.name !== "AbortError") {
        toast.error(t.trips.collageFailed);
      }
    } finally {
      setBusy(false);
    }
  };

  const downloadCollage = async () => {
    setBusy(true);
    try {
      downloadBlob(await buildBlob());
    } catch {
      toast.error(t.trips.collageFailed);
    } finally {
      setBusy(false);
    }
  };

  if (photos.length === 0) return null;

  return (
    <div className="mt-2">
      <Button type="button" variant="outline" size="sm" onClick={openDialog}>
        <LayoutGrid className="mr-1.5 h-4 w-4" aria-hidden="true" />
        {t.trips.collageButton}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.trips.collageTitle}</DialogTitle>
            <DialogDescription>{t.trips.collageDescription}</DialogDescription>
          </DialogHeader>

          {/* Anordnung */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              {t.trips.collageLayoutLabel}
            </p>
            <div
              className="flex flex-wrap gap-1.5"
              role="group"
              aria-label={t.trips.collageLayoutLabel}
            >
              {COLLAGE_LAYOUTS.map(entry => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setLayout(entry.id)}
                  aria-pressed={layout === entry.id}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs transition-colors",
                    layout === entry.id
                      ? "border-primary bg-primary/10 font-medium text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {t.trips.collageLayoutNames[entry.id]}
                </button>
              ))}
            </div>
          </div>

          {/* Fotos wählen – die Zahl zeigt die Reihenfolge in der Collage */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              {t.trips.collageSelected(used.length, capacity)}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {photos.map(photo => {
                const rank = selected.indexOf(photo.id);
                const inCollage = rank >= 0 && rank < capacity;
                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => togglePhoto(photo.id)}
                    aria-pressed={rank >= 0}
                    aria-label={t.trips.collageSelectAria(tripName)}
                    className={cn(
                      "relative aspect-square overflow-hidden rounded-lg border-2 transition-all",
                      inCollage
                        ? "border-primary"
                        : "border-transparent opacity-60"
                    )}
                  >
                    <img
                      src={tripPhotoSrc(photo.fileName)}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    {rank >= 0 && (
                      <span
                        className={cn(
                          "absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-primary-foreground",
                          inCollage ? "bg-primary" : "bg-muted-foreground"
                        )}
                      >
                        {rank + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {selected.length > capacity && (
              <p className="text-xs text-muted-foreground">
                {t.trips.collageTooMany(capacity)}
              </p>
            )}
            {used.length === 0 && (
              <p className="text-xs text-muted-foreground">
                {t.trips.collageNone}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              type="button"
              disabled={busy || used.length === 0}
              onClick={() => void shareCollage()}
            >
              {busy ? (
                <Loader2
                  className="mr-1.5 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Share2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
              )}
              {busy ? t.trips.collageBusy : t.trips.collageShare}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy || used.length === 0}
              onClick={() => void downloadCollage()}
            >
              <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.trips.collageDownload}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Dialog «Mitreisende» (nur für eigene Reisen): zeigt die Mitglieder-Liste
 * (Entfernen für die Besitzerin/den Besitzer), erzeugt/kopiert den
 * Einladungs-Link samt QR-Code (Muster der Teilen-Dialoge) und widerruft ihn.
 */
function TripMembersDialog({
  trip,
  onClose,
}: {
  trip: { id: number; name: string } | null;
  onClose: () => void;
}) {
  const t = useT();
  const utils = trpc.useUtils();
  const open = trip !== null;
  const membersQuery = trpc.trips.members.list.useQuery(
    { tripId: trip?.id ?? 0 },
    { enabled: open }
  );
  const inviteToken = membersQuery.data?.inviteToken ?? null;
  const inviteUrl = inviteToken
    ? `${window.location.origin}/reise-einladung/${inviteToken}`
    : null;

  // QR-Code zum Einladungs-Link: am Lagerfeuer einfach abscannen lassen
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!inviteUrl) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(inviteUrl, {
      width: 480,
      margin: 1,
      errorCorrectionLevel: "M",
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [inviteUrl]);

  const copyInviteUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t.common.linkCopied);
    } catch {
      toast.error(t.common.copyFailed);
    }
  };

  const createMutation = trpc.trips.invite.create.useMutation({
    onSuccess: async ({ token }) => {
      utils.trips.members.list.invalidate();
      // Link direkt in die Zwischenablage – der Dialog zeigt ihn zusätzlich an
      try {
        await navigator.clipboard.writeText(
          `${window.location.origin}/reise-einladung/${token}`
        );
        toast.success(t.common.linkCopied);
      } catch {
        // Kein Zwischenablage-Zugriff – der Link steht ja im Dialog
      }
    },
    onError: () => toast.error(t.trips.inviteCreateFailed),
  });
  const revokeMutation = trpc.trips.invite.revoke.useMutation({
    onSuccess: () => {
      utils.trips.members.list.invalidate();
      toast.success(t.trips.inviteRevoked);
    },
    onError: () => toast.error(t.trips.inviteRevokeFailed),
  });
  const removeMemberMutation = trpc.trips.members.remove.useMutation({
    onSuccess: () => {
      utils.trips.members.list.invalidate();
      utils.trips.list.invalidate();
      toast.success(t.trips.memberRemoved);
    },
    onError: () => toast.error(t.trips.memberRemoveFailed),
  });

  const memberDisplayName = (m: {
    name: string | null;
    email: string | null;
    userId: number;
  }): string => m.name || m.email || `#${m.userId}`;

  return (
    <Dialog
      open={open}
      onOpenChange={o => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {t.trips.membersButton}
            {trip ? ` – ${trip.name}` : ""}
          </DialogTitle>
          <DialogDescription>{t.trips.membersDialogDesc}</DialogDescription>
        </DialogHeader>
        {trip && (
          <>
            {/* Mitglieder-Liste */}
            <div>
              <h3 className="mb-2 text-sm font-semibold">
                {t.trips.membersListTitle}
              </h3>
              <ul className="space-y-1.5">
                {(membersQuery.data?.members ?? []).map(m => (
                  <li
                    key={m.userId}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {memberDisplayName(m)}
                      </p>
                      {m.name && m.email && (
                        <p className="truncate text-xs text-muted-foreground">
                          {m.email}
                        </p>
                      )}
                    </div>
                    {m.role === "owner" ? (
                      <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {t.trips.membersOwnerBadge}
                      </span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground/60 hover:text-destructive"
                        aria-label={t.trips.memberRemoveAria(
                          memberDisplayName(m)
                        )}
                        disabled={removeMemberMutation.isPending}
                        onClick={() => {
                          if (
                            confirm(
                              t.trips.memberRemoveConfirm(memberDisplayName(m))
                            )
                          ) {
                            removeMemberMutation.mutate({
                              tripId: trip.id,
                              userId: m.userId,
                            });
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            {/* Einladungs-Link */}
            <div>
              <h3 className="mb-1 text-sm font-semibold">
                {t.trips.inviteSectionTitle}
              </h3>
              <p className="mb-2 text-xs text-muted-foreground">
                {t.trips.inviteHint}
              </p>
              {inviteUrl ? (
                <>
                  <p className="break-all rounded-lg bg-muted px-3 py-2 font-mono text-xs">
                    {inviteUrl}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void copyInviteUrl(inviteUrl)}
                    >
                      <Copy className="mr-1.5 h-4 w-4" aria-hidden="true" />
                      {t.common.copy}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={revokeMutation.isPending}
                      onClick={() => revokeMutation.mutate({ tripId: trip.id })}
                    >
                      {t.trips.inviteRevoke}
                    </Button>
                  </div>
                  {qrDataUrl && (
                    <div className="mt-3 text-center">
                      {/* Weisser Rahmen, damit der QR-Code auch im Dark Mode lesbar bleibt */}
                      <img
                        src={qrDataUrl}
                        alt={t.trips.inviteQrAlt(trip.name)}
                        className="mx-auto w-40 rounded-lg bg-white p-2"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t.trips.inviteQrHint}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <Button
                  size="sm"
                  disabled={createMutation.isPending}
                  onClick={() => createMutation.mutate({ tripId: trip.id })}
                >
                  <Share2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {t.trips.inviteCreate}
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Dialog «Reise-Hub teilen» (nur für eigene Reisen): erzeugt den öffentlichen
 * Read-only-Link (Reise-Infos, Platz, Menüplan, Packliste – ohne Fotos),
 * zeigt ihn samt QR-Code und beendet das Teilen (Muster der Teilen-Dialoge).
 */
function TripShareDialog({
  trip,
  onClose,
}: {
  trip: {
    id: number;
    name: string;
    shareToken: string | null;
    shareExpiresAt: Date | null;
  } | null;
  onClose: () => void;
}) {
  const t = useT();
  const utils = trpc.useUtils();
  const open = trip !== null;
  /** Im Dialog gewählte Gültigkeit; null = unbegrenzt. */
  const [expiresIn, setExpiresIn] = useState<ShareExpiryDays | null>(null);
  const shareUrl = trip?.shareToken
    ? `${window.location.origin}/reise/${trip.shareToken}`
    : null;

  // QR-Code zum Hub-Link: am Lagerfeuer einfach abscannen lassen
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!shareUrl) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(shareUrl, {
      width: 480,
      margin: 1,
      errorCorrectionLevel: "M",
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [shareUrl]);

  const shareMutation = trpc.trips.share.useMutation({
    onSuccess: async ({ token }) => {
      utils.trips.list.invalidate();
      // Link direkt in die Zwischenablage – der Dialog zeigt ihn zusätzlich an
      try {
        await navigator.clipboard.writeText(
          `${window.location.origin}/reise/${token}`
        );
        toast.success(t.common.linkCopied);
      } catch {
        toast.success(t.trips.hubLinkCreated);
      }
    },
    onError: () => toast.error(t.trips.hubCreateFailed),
  });
  const unshareMutation = trpc.trips.unshare.useMutation({
    onSuccess: () => {
      utils.trips.list.invalidate();
      toast.success(t.trips.hubStopped);
    },
    onError: () => toast.error(t.trips.hubStopFailed),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={o => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {t.trips.hubDialogTitle}
            {trip ? ` – ${trip.name}` : ""}
          </DialogTitle>
          <DialogDescription>{t.trips.hubDialogDesc}</DialogDescription>
        </DialogHeader>
        {trip &&
          (shareUrl ? (
            <div>
              <p className="break-all rounded-lg bg-muted px-3 py-2 font-mono text-xs">
                {shareUrl}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(shareUrl);
                      toast.success(t.common.linkCopied);
                    } catch {
                      toast.error(t.common.copyFailed);
                    }
                  }}
                >
                  <Copy className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {t.common.copy}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={unshareMutation.isPending}
                  onClick={() => unshareMutation.mutate({ tripId: trip.id })}
                >
                  {t.trips.hubStopShare}
                </Button>
              </div>
              <div className="mt-2 space-y-1">
                <ShareExpirySelect
                  value={expiresIn}
                  onChange={days => {
                    setExpiresIn(days);
                    shareMutation.mutate({
                      tripId: trip.id,
                      expiresInDays: days,
                    });
                  }}
                />
                <ShareExpiryNote expiresAt={trip.shareExpiresAt} />
              </div>
              {qrDataUrl && (
                <div className="mt-3 text-center">
                  {/* Weisser Rahmen, damit der QR-Code auch im Dark Mode lesbar bleibt */}
                  <img
                    src={qrDataUrl}
                    alt={t.trips.hubQrAlt(trip.name)}
                    className="mx-auto w-40 rounded-lg bg-white p-2"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.trips.hubQrHint}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <ShareExpirySelect value={expiresIn} onChange={setExpiresIn} />
              <Button
                size="sm"
                disabled={shareMutation.isPending}
                onClick={() =>
                  shareMutation.mutate({
                    tripId: trip.id,
                    expiresInDays: expiresIn,
                  })
                }
              >
                <Share2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {t.trips.hubCreate}
              </Button>
            </div>
          ))}
      </DialogContent>
    </Dialog>
  );
}

/** Vorschlags-Abstand der Kopie: Anreise heute + 30 Tage. */
const DUPLICATE_OFFSET_DAYS = 30;
const DAY_MS = 86400000;

/** ISO-Datum (YYYY-MM-DD) um n Tage verschieben – UTC-basiert. */
function addDaysIso(iso: string, days: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/** Ganze Tage zwischen zwei ISO-Daten (endIso − startIso; ungültig = 0). */
function diffDaysIso(startIso: string, endIso: string): number {
  const start = Date.parse(`${startIso}T00:00:00Z`);
  const end = Date.parse(`${endIso}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.round((end - start) / DAY_MS);
}

/**
 * Dialog «Reise duplizieren»: neue Von/Bis-Daten wählen (Vorschlag: gleiche
 * Dauer ab heute + 30 Tage), Bestätigen legt über trips.duplicate eine neue
 * geplante Reise an – Ort, Verknüpfungen und Menüplan werden übernommen,
 * Notizen/Bewertung/Fotos/Wetter nicht.
 */
function TripDuplicateDialog({
  trip,
  onClose,
}: {
  trip: { id: number; name: string; startDate: string; endDate: string } | null;
  onClose: () => void;
}) {
  const t = useT();
  const utils = trpc.useUtils();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Beim Öffnen: gleiche Dauer wie das Original, Anreise heute + 30 Tage
  useEffect(() => {
    if (!trip) return;
    const today = new Date().toISOString().slice(0, 10);
    const start = addDaysIso(today, DUPLICATE_OFFSET_DAYS);
    setStartDate(start);
    setEndDate(
      addDaysIso(start, Math.max(0, diffDaysIso(trip.startDate, trip.endDate)))
    );
  }, [trip]);

  const duplicateMutation = trpc.trips.duplicate.useMutation({
    onSuccess: () => {
      utils.trips.list.invalidate();
      toast.success(t.trips.duplicated);
      onClose();
    },
    onError: e => toast.error(e.message || t.trips.duplicateFailed),
  });

  return (
    <Dialog
      open={trip !== null}
      onOpenChange={o => {
        if (!o) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif">
            {t.trips.duplicateDialogTitle}
            {trip ? ` – ${trip.name}` : ""}
          </DialogTitle>
          <DialogDescription>{t.trips.duplicateDialogDesc}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="duplicate-start">{t.trips.arrivalLabel}</Label>
            <Input
              id="duplicate-start"
              type="date"
              value={startDate}
              onChange={e => {
                const value = e.target.value;
                // Dauer beibehalten: die Abreise wandert mit der Anreise mit
                const duration = Math.max(0, diffDaysIso(startDate, endDate));
                setStartDate(value);
                if (value) setEndDate(addDaysIso(value, duration));
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="duplicate-end">{t.trips.departureLabel}</Label>
            <Input
              id="duplicate-end"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button
            disabled={
              duplicateMutation.isPending ||
              !startDate ||
              !endDate ||
              endDate < startDate
            }
            onClick={() => {
              if (!trip) return;
              duplicateMutation.mutate({ tripId: trip.id, startDate, endDate });
            }}
          >
            <CopyPlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {t.trips.duplicateSubmit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TripsPage() {
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

  const today = new Date().toISOString().slice(0, 10);
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

  /** Gerade bearbeiteter Eintrag – für Mitglieds-Trips gelten Einschränkungen. */
  const editingTrip =
    editingId !== null
      ? (allTrips.find(tr => tr.id === editingId) ?? null)
      : null;
  /** Mitglieds-Trip im Formular: Zeltplatz/Packliste bleiben unveränderbar. */
  const editingShared = editingTrip?.role === "member";

  /**
   * Anzeigename eines Eintrags: verknüpfter Favorit, sonst Freitext-Ort.
   * Bei Mitglieds-Trips gehört der Zeltplatz der Besitzerin/dem Besitzer –
   * dafür liefert der Server den Namen als spotName mit.
   */
  const placeName = (trip: (typeof trips)[number]): string => {
    if (trip.spotId != null) {
      const spot = spots.find(s => s.id === trip.spotId);
      if (spot) return spot.name;
      if (trip.spotName) return trip.spotName;
    }
    return trip.location ?? t.trips.unknownPlace;
  };

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
      title: trip.title || placeName(trip),
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
    downloadIcs(
      [trip],
      icsFileName(trip.title || placeName(trip), trip.startDate)
    );
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
    new Date(`${iso}T00:00:00`).toLocaleDateString(LOCALE_TAGS[lang], {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

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
        name: trip.title || placeName(trip),
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
      <div className="container flex justify-center py-16">
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          aria-label={t.common.loading}
        />
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
      <PageHeader title={t.trips.title} subtitle={t.trips.subtitle} />

      {/* «Neue Reise»: öffnet den Erfassungs-Dialog */}
      <div className="mb-6">
        <Button size="lg" onClick={openNewTripDialog}>
          <Plus className="mr-1.5 h-5 w-5" aria-hidden="true" />
          {t.trips.newTripButton}
        </Button>
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
                {stats.avgRating !== null ? fmtRating(stats.avgRating) : "–"}
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
              <CloudSun className="h-4 w-4 text-primary" aria-hidden="true" />
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
                  <li key={year} className="flex items-center gap-2 text-sm">
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
                    <Award className="h-3 w-3 shrink-0" aria-hidden="true" />
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
                <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
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

      {/* Geplante Aufenthalte: Trips mit Anreise heute oder später */}
      {tripsView === "list" && plannedTrips.length > 0 && (
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
            {plannedTrips.map(trip => {
              const days = daysUntilTrip(trip.startDate, today);
              const nights = tripNights(trip.startDate, trip.endDate);
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
                    tripName={trip.title || placeName(trip)}
                  />
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Tent className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-semibold">
                        {trip.title || placeName(trip)}
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
                        {trip.title && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" aria-hidden="true" />
                            {placeName(trip)}
                          </span>
                        )}
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
                        tripName={trip.title || placeName(trip)}
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
                            aria-label={t.trips.menuPlanAria(
                              trip.title || placeName(trip)
                            )}
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
                              aria-label={t.tripShopping.openAria(
                                trip.title || placeName(trip)
                              )}
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
                            aria-label={t.trips.roadRulesAria(
                              trip.title || placeName(trip)
                            )}
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
                          aria-label={t.trips.icsAria(
                            trip.title || placeName(trip)
                          )}
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
                          tripName={trip.title || placeName(trip)}
                          startDate={trip.startDate}
                          endDate={trip.endDate}
                          shared={trip.shared || trip.role === "member"}
                        />
                      )}
                      {/* Reisekasse (#219): auch schon vor der Anreise –
                          Platzmiete und Sprit fallen oft vorher an */}
                      <TripExpenses
                        tripId={trip.id}
                        tripName={trip.title || placeName(trip)}
                        defaultDay={today > trip.endDate ? trip.endDate : today}
                        shared={trip.shared || trip.role === "member"}
                      />
                      {/* Pinnwand (#245): nur bei gemeinsamen Reisen – allein
                          hätte man niemanden, dem man etwas anpinnen könnte */}
                      {(trip.shared || trip.role === "member") && (
                        <TripBoard
                          tripId={trip.id}
                          tripName={trip.title || placeName(trip)}
                        />
                      )}
                      <TripPhotos
                        tripId={trip.id}
                        tripName={trip.title || placeName(trip)}
                        coverPhotoId={trip.coverPhotoId}
                      />
                      {/* Foto-Collage (#226) */}
                      <TripCollage
                        tripId={trip.id}
                        tripName={trip.title || placeName(trip)}
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
                        aria-label={t.trips.editEntryAria(
                          trip.title || placeName(trip)
                        )}
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
                            name: trip.title || placeName(trip),
                            startDate: trip.startDate,
                            endDate: trip.endDate,
                          })
                        }
                        aria-label={t.trips.duplicateAria(
                          trip.title || placeName(trip)
                        )}
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
                                name: trip.title || placeName(trip),
                              })
                            }
                            aria-label={t.trips.membersAria(
                              trip.title || placeName(trip)
                            )}
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
                                name: trip.title || placeName(trip),
                              })
                            }
                            aria-label={t.trips.hubShareAria(
                              trip.title || placeName(trip)
                            )}
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
                            aria-label={t.trips.deletePlannedAria(
                              trip.title || placeName(trip)
                            )}
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
                          onClick={() => {
                            if (
                              confirm(
                                t.trips.leaveConfirm(
                                  trip.title || placeName(trip)
                                )
                              )
                            ) {
                              leaveMutation.mutate({ tripId: trip.id });
                            }
                          }}
                          aria-label={t.trips.leaveTripAria(
                            trip.title || placeName(trip)
                          )}
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
      {tripsView === "list" && (
        <>
          <h2 className="mb-3 font-serif text-lg font-semibold">
            {t.trips.entriesTitle}
          </h2>
          {trips.length === 0 ? (
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
              {trips.map(trip => {
                const nights = tripNights(trip.startDate, trip.endDate);
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
                      tripName={trip.title || placeName(trip)}
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
                          {trip.title || placeName(trip)}
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
                          {trip.title && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" aria-hidden="true" />
                              {placeName(trip)}
                            </span>
                          )}
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
                            groupLabel={t.trips.ratingGroupAria(
                              trip.title || placeName(trip)
                            )}
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
                          tripName={trip.title || placeName(trip)}
                          startDate={trip.startDate}
                          endDate={trip.endDate}
                          shared={trip.shared || trip.role === "member"}
                        />
                        {/* Reisekasse (#219) */}
                        <TripExpenses
                          tripId={trip.id}
                          tripName={trip.title || placeName(trip)}
                          defaultDay={
                            today > trip.endDate ? trip.endDate : today
                          }
                          shared={trip.shared || trip.role === "member"}
                        />
                        {/* Pinnwand (#245): nur bei gemeinsamen Reisen */}
                        {(trip.shared || trip.role === "member") && (
                          <TripBoard
                            tripId={trip.id}
                            tripName={trip.title || placeName(trip)}
                          />
                        )}
                        <TripPhotos
                          tripId={trip.id}
                          tripName={trip.title || placeName(trip)}
                          coverPhotoId={trip.coverPhotoId}
                        />
                        {/* Foto-Collage (#226) */}
                        <TripCollage
                          tripId={trip.id}
                          tripName={trip.title || placeName(trip)}
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
                          aria-label={t.trips.editEntryAria(
                            trip.title || placeName(trip)
                          )}
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
                            aria-label={t.trips.printEntryAria(
                              trip.title || placeName(trip)
                            )}
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
                          aria-label={t.trips.icsAria(
                            trip.title || placeName(trip)
                          )}
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
                              name: trip.title || placeName(trip),
                              startDate: trip.startDate,
                              endDate: trip.endDate,
                            })
                          }
                          aria-label={t.trips.duplicateAria(
                            trip.title || placeName(trip)
                          )}
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
                                  name: trip.title || placeName(trip),
                                })
                              }
                              aria-label={t.trips.membersAria(
                                trip.title || placeName(trip)
                              )}
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
                                  name: trip.title || placeName(trip),
                                })
                              }
                              aria-label={t.trips.hubShareAria(
                                trip.title || placeName(trip)
                              )}
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
                              aria-label={t.trips.deleteEntryAria(
                                trip.title || placeName(trip)
                              )}
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
                            onClick={() => {
                              if (
                                confirm(
                                  t.trips.leaveConfirm(
                                    trip.title || placeName(trip)
                                  )
                                )
                              ) {
                                leaveMutation.mutate({ tripId: trip.id });
                              }
                            }}
                            aria-label={t.trips.leaveTripAria(
                              trip.title || placeName(trip)
                            )}
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
