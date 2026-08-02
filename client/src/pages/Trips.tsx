import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  CalendarClock,
  CalendarDays,
  ChevronDown,
  CloudSun,
  GraduationCap,
  ListChecks,
  Loader2,
  MapPin,
  Moon,
  Plus,
  Share2,
  Sparkles,
  Star,
  Tent,
  Trash2,
  Trophy,
  UtensilsCrossed,
} from "lucide-react";
import { Link, useSearch } from "wouter";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import LoginPrompt from "@/components/LoginPrompt";
import PhotoGallery from "@/components/PhotoGallery";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MAX_PHOTOS_PER_TRIP } from "@shared/tripPhotos";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useI18n, useT } from "@/i18n";
import { LOCALE_TAGS } from "@shared/i18n";
import { cn } from "@/lib/utils";
import {
  computeTripStats,
  computeYearReview,
  daysUntilTrip,
  isUpcomingTrip,
  tripNights,
} from "@shared/trips";
import {
  packingSuggestions,
  type ForecastDay,
  type PackSuggestion,
} from "@shared/packSuggestions";
import {
  CANTONS,
  holidayDisplayName,
  overlappingHolidays,
} from "@shared/holidays";
import { loadCantonHolidays, type CantonHolidays } from "@/lib/holidays";
import { drawYearReview } from "@/lib/yearReviewImage";

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
 * Foto-Galerie eines Tagebuch-Eintrags: nutzt die gemeinsame PhotoGallery
 * (Upload, Thumbnails, Vollbild-Dialog) mit den Trip-Endpoints und -Texten.
 */
function TripPhotos({
  tripId,
  tripName,
}: {
  tripId: number;
  tripName: string;
}) {
  const t = useT();
  const utils = trpc.useUtils();
  const photosQuery = trpc.trips.photos.list.useQuery({ tripId });
  const removeMutation = trpc.trips.photos.remove.useMutation();

  return (
    <PhotoGallery
      photos={photosQuery.data ?? []}
      loadFailed={photosQuery.isError}
      name={tripName}
      maxPhotos={MAX_PHOTOS_PER_TRIP}
      uploadUrl={`/api/trips/${tripId}/photos`}
      photoSrc={fileName => `/api/trips/photos/${fileName}`}
      onChanged={() => utils.trips.photos.list.invalidate({ tripId })}
      deletePhoto={photoId => removeMutation.mutateAsync({ photoId })}
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

  const formatRange = (startDate: string, endDate: string): string => {
    const fmt = (iso: string) =>
      new Date(`${iso}T00:00:00`).toLocaleDateString(LOCALE_TAGS[lang], {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    if (startDate === endDate) return fmt(startDate);
    return `${fmt(startDate)} – ${fmt(endDate)}`;
  };

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
  });
  /** Sterne-Bewertung des neuen Eintrags (null = ohne Bewertung). */
  const [formRating, setFormRating] = useState<number | null>(null);

  // Schnellaktion «Neuer Tagebuch-Eintrag» (?neu=1): zum Formular springen
  const search = useSearch();
  const newEntryCardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isAuthenticated) return;
    if (new URLSearchParams(search).get("neu") !== "1") return;
    const card = newEntryCardRef.current;
    if (!card) return;
    card.scrollIntoView({ behavior: "smooth", block: "start" });
    card
      .querySelector<HTMLElement>("input, button, [role='combobox']")
      ?.focus({ preventScroll: true });
  }, [search, isAuthenticated]);

  const addMutation = trpc.trips.add.useMutation({
    onSuccess: () => {
      utils.trips.list.invalidate();
      setForm(f => ({ ...f, location: "", title: "", notes: "" }));
      setFormRating(null);
      toast.success(t.trips.entrySaved);
    },
    onError: e => toast.error(e.message || t.trips.entrySaveFailed),
  });

  const removeMutation = trpc.trips.remove.useMutation({
    onSuccess: () => utils.trips.list.invalidate(),
    onError: () => toast.error(t.common.deleteFailed),
  });

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

  /** Anzeigename eines Eintrags: verknüpfter Favorit, sonst Freitext-Ort. */
  const placeName = (trip: (typeof trips)[number]): string => {
    if (trip.spotId != null) {
      const spot = spots.find(s => s.id === trip.spotId);
      if (spot) return spot.name;
    }
    return trip.location ?? t.trips.unknownPlace;
  };

  const pastTripLikes = useMemo(
    () =>
      trips.map(t => ({
        startDate: t.startDate,
        endDate: t.endDate,
        placeName: placeName(t),
        rating: t.rating,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trips, spots]
  );
  const stats = useMemo(
    () => computeTripStats(pastTripLikes, lang),
    [pastTripLikes, lang]
  );
  const currentYear = new Date().getFullYear();

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

  /**
   * Jahresrückblick als PNG teilen: Kennzahlen mit der Canvas-API zeichnen
   * (client/src/lib/yearReviewImage.ts), dann Web Share API Level 2 mit
   * Datei – wo nicht verfügbar, Download über einen a[download]-Link.
   */
  const shareYearReview = async () => {
    if (!yearReview) return;
    try {
      const canvas = document.createElement("canvas");
      drawYearReview(
        canvas,
        {
          review: yearReview,
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
    if (holidayCanton === HOLIDAY_CANTON_NONE || plannedTrips.length === 0) {
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
  }, [holidayCanton, plannedTrips.length]);

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
          </CardContent>
        </Card>
      )}

      {/* Neuer Eintrag */}
      <Card className="mb-8 scroll-mt-20" ref={newEntryCardRef}>
        <CardContent className="pt-6">
          <h2 className="mb-4 flex items-center gap-2 font-serif text-base font-semibold">
            <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.trips.newEntryTitle}
          </h2>
          <form
            className="grid gap-3"
            onSubmit={e => {
              e.preventDefault();
              const spotId =
                spotChoice === FREE_LOCATION ? null : Number(spotChoice);
              if (spotId === null && !form.location.trim()) {
                toast.error(t.trips.choosePlaceError);
                return;
              }
              addMutation.mutate({
                spotId,
                packListId:
                  packListChoice === "keine" ? null : Number(packListChoice),
                location: spotId === null ? form.location.trim() : null,
                title: form.title.trim() || null,
                notes: form.notes.trim() || null,
                startDate: form.startDate,
                endDate: form.endDate,
                rating: formRating,
              });
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
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
              {spotChoice === FREE_LOCATION && (
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
                    <SelectItem value="keine">{t.trips.noPackList}</SelectItem>
                    {(listsQuery.data ?? []).map(l => (
                      <SelectItem key={l.id} value={String(l.id)}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            <Button
              type="submit"
              disabled={addMutation.isPending}
              className="justify-self-start"
            >
              <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {addMutation.isPending ? t.common.saving : t.trips.submit}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Geplante Aufenthalte: Trips mit Anreise heute oder später */}
      {plannedTrips.length > 0 && (
        <>
          <h2 className="mb-3 flex items-center gap-2 font-serif text-lg font-semibold">
            <CalendarClock
              className="h-5 w-5 text-primary"
              aria-hidden="true"
            />
            {t.trips.plannedTitle}
          </h2>
          {/* Kantons-Auswahl für Ferien-/Feiertags-Hinweise */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Label
              htmlFor="holiday-canton"
              className="text-xs text-muted-foreground"
            >
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
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
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
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="mt-2"
                      >
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
                      {trip.notes && (
                        <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                          {trip.notes}
                        </p>
                      )}
                      <TripPhotos
                        tripId={trip.id}
                        tripName={trip.title || placeName(trip)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground/60 hover:text-destructive"
                      onClick={() => removeMutation.mutate({ id: trip.id })}
                      aria-label={t.trips.deletePlannedAria(
                        trip.title || placeName(trip)
                      )}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* Einträge */}
      <h2 className="mb-3 font-serif text-lg font-semibold">
        {t.trips.entriesTitle}
      </h2>
      {trips.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t.trips.empty}
        </p>
      ) : (
        <ul className="space-y-3">
          {trips.map(trip => {
            const nights = tripNights(trip.startDate, trip.endDate);
            return (
              <li
                key={trip.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    {trip.spotId != null ? (
                      <Tent className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <MapPin className="h-5 w-5" aria-hidden="true" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {trip.title || placeName(trip)}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {trip.title && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" aria-hidden="true" />
                          {placeName(trip)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" aria-hidden="true" />
                        {formatRange(trip.startDate, trip.endDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Moon className="h-3 w-3" aria-hidden="true" />
                        {t.trips.nightsCount(nights)}
                      </span>
                    </p>
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
                    <TripPhotos
                      tripId={trip.id}
                      tripName={trip.title || placeName(trip)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground/60 hover:text-destructive"
                    onClick={() => removeMutation.mutate({ id: trip.id })}
                    aria-label={t.trips.deleteEntryAria(
                      trip.title || placeName(trip)
                    )}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
