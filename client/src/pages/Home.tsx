import { Link } from "wouter";
import { fmtLong, fmtShort } from "@/lib/dateFormat";
import heroImage from "@/assets/hero-camping.webp";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  CloudSunRain,
  Compass,
  Eye,
  EyeOff,
  GripVertical,
  History as HistoryIcon,
  Search,
  Wind,
  X,
} from "lucide-react";
import { groupLabels, groups, modules } from "@/data/modules";
import {
  isOnSite,
  loadTravelMode,
  orderGroups,
  saveTravelMode,
  type TravelMode,
} from "@/lib/travelMode";
import { LOCALE_TAGS, pick } from "@shared/i18n";
import { MEAL_LABELS, MEALS } from "@shared/menuPlan";
import { useI18n } from "@/i18n";
import {
  describeWeatherCode,
  detectAlerts,
  type HourlyWeather,
} from "@shared/weather";
import { getSunTimes } from "@/lib/sun";
import {
  dailyTip,
  dayOfYear,
  type DailyTipIcon,
  type DayWeather,
} from "@shared/dailyTips";
import { getMoonInfo, stargazingQuality } from "@shared/moon";
import { isShowerActive, meteorShowers } from "@shared/astro";
import { useRecipes } from "@/hooks/useRecipes";
import {
  Bug,
  Cable,
  CloudRain,
  CookingPot,
  Cross,
  Droplets,
  Lightbulb,
  Moon,
  Sparkles,
  Sun,
  TreePine,
  Users,
  Wrench,
} from "lucide-react";
import { gearTaskDue } from "@shared/gearTasks";
import { tickObservationStatus } from "@shared/tickBites";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { pickRunningTrip, shouldOpenToday } from "@shared/todayView";
import {
  hasJumpedToday,
  loadTodayStart,
  markJumpedToday,
} from "@/lib/todayStart";
import { getRecentModules } from "@/components/AppShell";
import MorningBriefing from "@/components/MorningBriefing";
import {
  ONBOARDING_DISMISSED_KEY,
  onboardingComplete,
  onboardingSteps,
  type OnboardingStepId,
} from "@/lib/onboarding";
import { getExistingSubscription, pushSupported } from "@/lib/pushClient";
import {
  isWidgetVisible,
  loadHiddenWidgets,
  OPTIONAL_WIDGETS,
  sanitizeHiddenWidgets,
  storeHiddenWidgets,
  toggleWidget,
  type OptionalWidgetId,
} from "@/lib/homeWidgets";
import { usePointerDrag } from "@/lib/usePointerDrag";
import { useSyncedSetting } from "@/lib/useSyncedSetting";
import {
  ensureKnowledgeIndex,
  isKnowledgeIndexReady,
  searchKnowledge,
  searchOwnContent,
} from "@/lib/globalSearch";
import {
  TARGETS_KEY,
  sanitizeTargets,
  type TentFinderTarget,
} from "@/lib/tentFinderTargets";
import {
  anniversaryTrips,
  currentTripDay,
  daysUntilTrip,
  isUpcomingTrip,
  tripNights,
} from "@shared/trips";
import { firstNameOf, greetingKey } from "@shared/greeting";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { tripDisplayName } from "@shared/tripName";
import { todayIso } from "@shared/localDate";
import {
  CalendarClock,
  ListChecks,
  MapPin,
  ShoppingCart,
  Tent,
  UtensilsCrossed,
} from "lucide-react";

const ORDER_KEY = "campmesser.moduleOrder";
const HIDDEN_KEY = "campmesser.hiddenModules";

/** Gespeicherte Kachel-Reihenfolge laden (Pfad-Liste). */
function loadModuleOrder(): string[] {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((p): p is string => typeof p === "string")
      : [];
  } catch {
    return [];
  }
}

/** Kachel-Reihenfolge auf dem Gerät speichern. */
function saveModuleOrder(order: string[]) {
  try {
    localStorage.setItem(ORDER_KEY, JSON.stringify(order));
  } catch {
    // Speicher nicht verfügbar – Sortierung gilt nur für die Sitzung
  }
}

/** Ausgeblendete Kacheln laden (Pfad-Liste). */
function loadHiddenModules(): string[] {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((p): p is string => typeof p === "string")
      : [];
  } catch {
    return [];
  }
}

/** Ausgeblendete Kacheln auf dem Gerät speichern. */
function saveHiddenModules(hidden: string[]) {
  try {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(hidden));
  } catch {
    // Speicher nicht verfügbar – Auswahl gilt nur für die Sitzung
  }
}

interface HomeWeather {
  temperatureC: number;
  windKmh: number;
  label: string;
  alert: { title: string; severity: "info" | "warnung" | "gefahr" } | null;
  /** Anzahl aller aktiven Warnungen (die höchste Stufe steckt in `alert`). */
  alertCount: number;
}

/**
 * Kompaktes Wetter am Ort des laufenden Aufenthalts: kleiner eigener Abruf
 * der aktuellen Lage (Open-Meteo) an den Zeltplatz-Koordinaten – bewusst
 * getrennt von useHomeWeather, das den Geräte-Standort nutzt. Ohne Netz
 * bleibt die Zeile einfach weg.
 */
function CurrentTripWeather({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const { lang } = useI18n();
  const [weather, setWeather] = useState<{
    temperatureC: number;
    label: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({
      latitude: latitude.toFixed(4),
      longitude: longitude.toFixed(4),
      timezone: "auto",
      forecast_days: "1",
      current: "temperature_2m,weather_code",
    });
    fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`)
      .then(res =>
        res.ok ? res.json() : Promise.reject(new Error("weather unavailable"))
      )
      .then(json => {
        if (cancelled) return;
        const temp = json?.current?.temperature_2m;
        const code = json?.current?.weather_code;
        if (typeof temp !== "number" || typeof code !== "number") return;
        setWeather({
          temperatureC: temp,
          label: describeWeatherCode(code, lang).label,
        });
      })
      .catch(() => {
        // Wetterdienst nicht erreichbar – Zeile still weglassen
      });
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, lang]);

  if (!weather) return null;
  return (
    <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
      <CloudSunRain className="h-3 w-3 shrink-0" aria-hidden="true" />
      {Math.round(weather.temperatureC)}° · {weather.label}
    </span>
  );
}

/**
 * Erste-Schritte-Karte für neue Nutzer*innen: Häkchen-Liste der wichtigsten
 * ersten Aktionen (Konto, Zeltplatz, Packliste, Reise, Push) mit Links zu
 * den Modulen. Der Erledigt-Status kommt komplett aus den vorhandenen
 * Queries bzw. dem Push-Abo dieses Geräts (client/src/lib/onboarding.ts,
 * keine neuen Server-Felder). Sichtbar nur, solange nicht alles erledigt
 * ist und die Karte nicht weggeklickt wurde (localStorage). Gäste sehen
 * nur den Konto-Schritt verlinkt, der Rest ist ausgegraut.
 */
function OnboardingCard() {
  const { t } = useI18n();
  const { isAuthenticated, loading } = useAuth();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ONBOARDING_DISMISSED_KEY) === "1";
    } catch {
      return false;
    }
  });
  const enabled = isAuthenticated && !dismissed;
  const spotsQuery = trpc.spots.list.useQuery(undefined, {
    enabled,
    staleTime: 60_000,
  });
  const listsQuery = trpc.packing.lists.useQuery(undefined, {
    enabled,
    staleTime: 60_000,
  });
  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled,
    staleTime: 60_000,
  });

  // Push-Abo dieses Geräts prüfen (ohne den vapidKey-Roundtrip des Profils)
  const [pushEnabled, setPushEnabled] = useState(false);
  useEffect(() => {
    if (!enabled || !pushSupported()) return;
    getExistingSubscription()
      .then(sub => setPushEnabled(Boolean(sub)))
      .catch(() => setPushEnabled(false));
  }, [enabled]);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(ONBOARDING_DISMISSED_KEY, "1");
    } catch {
      // Speicher blockiert – die Karte bleibt nur für diese Sitzung weg
    }
  };

  if (loading || dismissed) return null;
  // Angemeldet erst rendern, wenn die Daten da sind (kein Häkchen-Flackern)
  if (
    isAuthenticated &&
    (!spotsQuery.data || !listsQuery.data || !tripsQuery.data)
  )
    return null;

  const steps = onboardingSteps({
    isAuthenticated,
    hasSpot: (spotsQuery.data?.length ?? 0) > 0,
    hasPackList: (listsQuery.data?.length ?? 0) > 0,
    hasTrip: (tripsQuery.data?.length ?? 0) > 0,
    pushSupported: pushSupported(),
    pushEnabled,
  });
  if (onboardingComplete(steps)) return null;

  const labels: Record<OnboardingStepId, string> = t.home.onboardingSteps;

  return (
    <section
      className="mb-6 rounded-xl border border-border/70 bg-card p-4 shadow-sm"
      aria-label={t.home.onboardingTitle}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h2 className="font-serif text-base font-semibold">
            {t.home.onboardingTitle}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t.home.onboardingSubtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-md p-1 text-muted-foreground/60 transition-colors hover:text-foreground"
          aria-label={t.home.onboardingDismissAria}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <ul className="space-y-1.5">
        {steps.map(step => {
          const label = labels[step.id];
          const suffix = step.optional ? ` (${t.home.onboardingOptional})` : "";
          return (
            <li key={step.id} className="flex items-center gap-2 text-sm">
              {step.done ? (
                <CheckCircle2
                  className="h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
              ) : (
                <Circle
                  className="h-4 w-4 shrink-0 text-muted-foreground/40"
                  aria-hidden="true"
                />
              )}
              {step.done ? (
                <span
                  className="text-muted-foreground line-through"
                  aria-label={t.home.onboardingDoneAria(label)}
                >
                  {label}
                </span>
              ) : step.locked ? (
                // Volles text-muted-foreground statt /50: die abgeschwächte
                // Variante fiel im axe-Kontrast-Check durch (2.1 : 1)
                <span
                  className="text-muted-foreground"
                  aria-label={t.home.onboardingLockedAria(label)}
                >
                  {label}
                  {suffix}
                </span>
              ) : (
                <Link
                  href={step.path}
                  className="font-medium text-foreground underline-offset-2 hover:text-primary hover:underline"
                  aria-label={t.home.onboardingOpenAria(label)}
                >
                  {label}
                  {suffix}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * Trip-Widget der Startseite: Läuft HEUTE ein Aufenthalt (Anreise ≤ heute ≤
 * Abreise), zeigt es «Du bist in <Ort> – Tag X von Y» mit kompaktem Wetter
 * vor Ort und Schnellzugriffen (Menüplan, Platz-Dossier, Einkaufsliste) –
 * sonst wie bisher den Countdown zum nächsten geplanten Trip.
 */
/**
 * Morgen-Briefing (#255): sucht den laufenden eigenen Aufenthalt und den
 * zugehörigen Zeltplatz und übergibt beides an die Karte. Läuft keine
 * Reise, wird gar nichts geladen – die Karte fragt sonst Menüplan und
 * Pinnwand einer Reise ab, die es nicht gibt.
 */
function BriefingWidget() {
  const { isAuthenticated } = useAuth();
  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const spotsQuery = trpc.spots.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const today = todayIso();
  const current = (tripsQuery.data ?? [])
    .filter(trip => trip.role === "owner")
    .filter(trip => currentTripDay(trip, today) !== null)
    .sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
  if (!current) return null;
  const spot =
    current.spotId != null
      ? spotsQuery.data?.find(s => s.id === current.spotId)
      : undefined;
  return (
    <MorningBriefing
      tripId={current.id}
      latitude={spot?.latitude ?? null}
      longitude={spot?.longitude ?? null}
      today={today}
    />
  );
}

function NextTripWidget() {
  const { lang, t } = useI18n();
  const { isAuthenticated } = useAuth();
  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const spotsQuery = trpc.spots.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const today = todayIso();
  // Bewusst nur EIGENE Reisen im Widget (Mitglieds-Trips bleiben im Tagebuch)
  const ownTrips = (tripsQuery.data ?? []).filter(
    trip => trip.role === "owner"
  );
  // Laufender Aufenthalt: heute innerhalb des Zeitraums – bei Überlappung
  // gewinnt der zuletzt angetretene.
  const current = ownTrips
    .filter(trip => currentTripDay(trip, today) !== null)
    .sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
  const next = ownTrips
    .filter(trip => isUpcomingTrip(trip.startDate, today))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  const progress = trpc.packing.progress.useQuery(
    { listId: next?.packListId ?? 0 },
    { enabled: Boolean(next?.packListId) && !current }
  );

  // Heutige Mahlzeiten des laufenden Aufenthalts: Menüplan nur laden, wenn
  // wirklich ein Trip läuft; eigene Rezepte nur, wenn heute eines verplant ist.
  const menuQuery = trpc.menu.listByTrip.useQuery(
    { tripId: current?.id ?? 0 },
    { enabled: Boolean(current), staleTime: 60_000 }
  );
  const todayEntries = (menuQuery.data?.entries ?? []).filter(
    e => e.day === today
  );
  const recipes = useRecipes();
  const customRecipesQuery = trpc.recipes.list.useQuery(undefined, {
    enabled:
      Boolean(current) && todayEntries.some(e => e.customRecipeId != null),
    staleTime: 60_000,
  });

  /** Anzeigetitel eines Menüplan-Eintrags in der aktiven Sprache. */
  const mealTitle = (entry: (typeof todayEntries)[number]): string | null => {
    if (entry.recipeId) {
      // Das Rezeptbuch wird nachgeladen (#342); bis dahin steht die Kennung
      // da – besser als eine leere Zeile, die gleich wieder springt.
      const recipe = recipes?.find(r => r.id === entry.recipeId);
      return recipe ? pick(recipe.name, lang) : entry.recipeId;
    }
    if (entry.customRecipeId != null) {
      return (
        customRecipesQuery.data?.find(r => r.id === entry.customRecipeId)
          ?.name ?? null
      );
    }
    return entry.freeText ?? null;
  };

  // «Frühstück: X · Mittag: Y · Abend: Z» – nur belegte Slots, sonst leer
  const mealsLine = MEALS.map(meal => {
    const entry = todayEntries.find(e => e.meal === meal);
    if (!entry) return null;
    const title = mealTitle(entry);
    return title ? `${pick(MEAL_LABELS[meal], lang)}: ${title}` : null;
  })
    .filter((part): part is string => part !== null)
    .join(" · ");

  const tripPlace = (trip: NonNullable<typeof next>): string =>
    trip.title ||
    (trip.spotId != null
      ? (spotsQuery.data?.find(s => s.id === trip.spotId)?.name ?? "")
      : (trip.location ?? "")) ||
    t.home.nextTripFallback;

  if (current) {
    const day = currentTripDay(current, today);
    const place = tripPlace(current);
    const spot =
      current.spotId != null
        ? spotsQuery.data?.find(s => s.id === current.spotId)
        : undefined;
    const linkClass =
      "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-sm transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.98]";
    return (
      <div
        className="mb-6 rounded-xl border border-primary/40 bg-accent/30 p-4 shadow-sm"
        aria-label={t.home.currentTripAria(place)}
      >
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Tent className="h-5.5 w-5.5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-semibold">
                {t.home.currentTripTitle(place)}
              </span>
              {day && (
                <span className="text-sm font-semibold text-primary">
                  {t.home.currentTripDay(day.day, day.total)}
                </span>
              )}
            </span>
            {spot && (
              <CurrentTripWeather
                latitude={spot.latitude}
                longitude={spot.longitude}
              />
            )}
            {mealsLine && (
              <span className="mt-0.5 flex items-start gap-1.5 text-xs text-muted-foreground">
                <UtensilsCrossed
                  className="mt-0.5 h-3 w-3 shrink-0"
                  aria-hidden="true"
                />
                <span className="sr-only">{t.home.currentTripMealsSr}</span>
                <span className="min-w-0">{mealsLine}</span>
              </span>
            )}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/menueplan/${current.id}`}
            className={linkClass}
            aria-label={t.home.currentTripMenuAria(place)}
          >
            <UtensilsCrossed
              className="h-3.5 w-3.5 text-primary"
              aria-hidden="true"
            />
            {t.home.currentTripMenuLink}
          </Link>
          {current.spotId != null && (
            <Link
              href={`/zeltplaetze/${current.spotId}`}
              className={linkClass}
              aria-label={t.home.currentTripSpotAria(place)}
            >
              <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              {t.home.currentTripSpotLink}
            </Link>
          )}
          <Link href="/einkauf" className={linkClass}>
            <ShoppingCart
              className="h-3.5 w-3.5 text-primary"
              aria-hidden="true"
            />
            {t.home.currentTripShoppingLink}
          </Link>
        </div>
      </div>
    );
  }

  if (!next) return null;

  const place = tripPlace(next);
  const days = daysUntilTrip(next.startDate, today);
  const packed = progress.data;
  const pct =
    packed && packed.total > 0
      ? Math.round((packed.checked / packed.total) * 100)
      : null;

  return (
    <Link
      href="/tagebuch"
      className="mb-6 flex items-center gap-4 rounded-xl border border-primary/40 bg-accent/30 p-4 shadow-sm transition-all hover:border-primary hover:shadow-md"
      aria-label={t.home.nextTripAria(place)}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <CalendarClock className="h-5.5 w-5.5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-semibold">{place}</span>
          <span className="text-sm font-semibold text-primary">
            {days === 0
              ? t.home.tripStartsToday
              : days === 1
                ? t.home.tripStartsTomorrow
                : t.home.tripDaysLeft(days)}
          </span>
          {next.arrivalTime && (
            <span className="text-xs text-muted-foreground">
              {t.home.tripArrivalAt(next.arrivalTime)}
            </span>
          )}
        </span>
        {pct !== null && packed ? (
          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ListChecks className="h-3 w-3 shrink-0" aria-hidden="true" />
            {t.home.tripPacked(packed.name, packed.checked, packed.total, pct)}
          </span>
        ) : (
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {t.home.tripPlannedNote}
          </span>
        )}
      </span>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-muted-foreground/50"
        aria-hidden="true"
      />
    </Link>
  );
}

/** Schlüssel des «für heute weggeklickt»-Merkers der Jahrestag-Karte. */
const ANNIVERSARY_DISMISSED_KEY = "campmesser.anniversaryDismissed";

/** Titelbild-Miniatur eines Jahrestag-Eintrags (nur wenn eines gesetzt ist). */
function AnniversaryThumb({
  tripId,
  coverPhotoId,
  alt,
}: {
  tripId: number;
  coverPhotoId: number;
  alt: string;
}) {
  const photosQuery = trpc.trips.photos.list.useQuery({ tripId });
  const cover = photosQuery.data?.find(p => p.id === coverPhotoId);
  if (!cover) return null;
  return (
    <img
      src={`/api/trips/photos/${cover.fileName}`}
      alt={alt}
      loading="lazy"
      className="h-14 w-14 shrink-0 rounded-lg object-cover"
    />
  );
}

/**
 * «Vor einem Jahr»-Erinnerung: dezente Karte, wenn heute (±3 Tage) der
 * Jahrestag eines vergangenen Aufenthalts ist – die Auswahl trifft die reine
 * Funktion anniversaryTrips() aus shared/trips.ts (1 bis 5 Jahre zurück,
 * kleinster Abstand gewinnt). Gezeigt wird der nächstliegende Treffer mit
 * Ort, Nächten, Bewertung und – falls vorhanden – dem Titelbild. Nur
 * angemeldet, nur bei Treffern, und für den laufenden Tag wegklickbar
 * (sessionStorage merkt sich das Datum).
 */
function AnniversaryCard() {
  const { lang, t } = useI18n();
  const { isAuthenticated } = useAuth();
  const today = todayIso();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(ANNIVERSARY_DISMISSED_KEY) === today;
    } catch {
      return false;
    }
  });
  const enabled = isAuthenticated && !dismissed;
  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled,
    staleTime: 60_000,
  });
  const spotsQuery = trpc.spots.list.useQuery(undefined, {
    enabled,
    staleTime: 60_000,
  });

  const hit = useMemo(
    () => anniversaryTrips(tripsQuery.data ?? [], today)[0],
    [tripsQuery.data, today]
  );

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(ANNIVERSARY_DISMISSED_KEY, today);
    } catch {
      // Speicher blockiert – die Karte bleibt nur für diese Ansicht weg
    }
  };

  if (!enabled || !hit) return null;
  const trip = hit.trip;
  const place =
    trip.title ||
    (trip.spotId != null
      ? (spotsQuery.data?.find(s => s.id === trip.spotId)?.name ??
        trip.spotName ??
        "")
      : (trip.location ?? "")) ||
    t.home.nextTripFallback;
  const nights = tripNights(trip.startDate, trip.endDate);
  const title =
    hit.yearsAgo === 1
      ? t.home.anniversaryTitleOne
      : t.home.anniversaryTitleMany(hit.yearsAgo);
  const started = fmtLong(new Date(`${trip.startDate}T00:00:00`), lang);

  return (
    <section
      className="mb-6 rounded-xl border border-border/70 bg-card p-4 shadow-sm"
      aria-label={title}
    >
      <div className="flex items-start gap-3">
        {trip.coverPhotoId != null && (
          <AnniversaryThumb
            tripId={trip.id}
            coverPhotoId={trip.coverPhotoId}
            alt={t.home.anniversaryPhotoAlt(place)}
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <HistoryIcon className="h-3 w-3" aria-hidden="true" />
            {title}
          </p>
          <p className="mt-0.5 truncate font-semibold">{place}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {started}
            {nights > 0 && ` · ${t.home.anniversaryNights(nights)}`}
            {typeof trip.rating === "number" && (
              <>
                {" · "}
                <span aria-label={t.home.anniversaryRatingAria(trip.rating)}>
                  {"★".repeat(trip.rating)}
                </span>
              </>
            )}
          </p>
          <Link
            href="/tagebuch"
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            aria-label={t.home.anniversaryLinkAria(place)}
          >
            {t.home.anniversaryLink}
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-md p-1 text-muted-foreground/60 transition-colors hover:text-foreground"
          aria-label={t.home.anniversaryDismissAria}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

/**
 * Wetter der Startseite EINMAL laden und teilen: das Wetter-Widget zeigt die
 * aktuelle Lage + Warnungen, der «Tipp des Tages» nutzt die daily-Aggregate
 * (heute/morgen) aus derselben Antwort – kein doppelter Fetch.
 */
function useHomeWeather(lang: ReturnType<typeof useI18n>["lang"]): {
  weather: HomeWeather | null;
  today?: DayWeather;
  tomorrow?: DayWeather;
} {
  const [weather, setWeather] = useState<HomeWeather | null>(null);
  const [daily, setDaily] = useState<{
    today?: DayWeather;
    tomorrow?: DayWeather;
  }>({});

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const params = new URLSearchParams({
            latitude: pos.coords.latitude.toFixed(4),
            longitude: pos.coords.longitude.toFixed(4),
            timezone: "auto",
            forecast_days: "2",
            current: "temperature_2m,weather_code,wind_speed_10m",
            hourly:
              "temperature_2m,apparent_temperature,precipitation,precipitation_probability,wind_speed_10m,wind_gusts_10m,weather_code,cape,cloud_cover",
            daily:
              "weather_code,temperature_2m_max,precipitation_probability_max",
          });
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?${params.toString()}`
          );
          if (!res.ok) return;
          const json = await res.json();
          const hourly: HourlyWeather[] =
            (json.hourly?.time as string[] | undefined)?.map(
              (time: string, i: number) => ({
                time,
                temperatureC: json.hourly.temperature_2m[i],
                apparentC: json.hourly.apparent_temperature[i],
                precipitationMm: json.hourly.precipitation[i],
                precipitationProbability:
                  json.hourly.precipitation_probability?.[i] ?? 0,
                windSpeedKmh: json.hourly.wind_speed_10m[i],
                windGustsKmh: json.hourly.wind_gusts_10m[i],
                weatherCode: json.hourly.weather_code[i],
                cape: json.hourly.cape?.[i] ?? 0,
                cloudCover: json.hourly.cloud_cover?.[i] ?? 0,
              })
            ) ?? [];
          const alerts = detectAlerts(hourly, lang);
          setWeather({
            temperatureC: json.current.temperature_2m,
            windKmh: json.current.wind_speed_10m,
            label: describeWeatherCode(json.current.weather_code, lang).label,
            alert: alerts[0]
              ? { title: alerts[0].title, severity: alerts[0].severity }
              : null,
            alertCount: alerts.length,
          });
          const dayAt = (i: number): DayWeather | undefined => {
            const code = json.daily?.weather_code?.[i];
            const tMax = json.daily?.temperature_2m_max?.[i];
            if (typeof code !== "number" || typeof tMax !== "number")
              return undefined;
            return {
              code,
              tMax,
              precipProb: json.daily?.precipitation_probability_max?.[i] ?? 0,
            };
          };
          setDaily({ today: dayAt(0), tomorrow: dayAt(1) });
        } catch {
          // Ohne Netz bleiben Wetter-Widget und Wetter-Tipps einfach aus
        }
      },
      () => {},
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  }, [lang]);

  return { weather, today: daily.today, tomorrow: daily.tomorrow };
}

/**
 * Farben des Unwetter-Badges – bewusst identisch zu den Severity-Badges im
 * Wetter-Modul (severityStyles in pages/Weather.tsx), damit «Gefahr» überall
 * gleich aussieht.
 */
const ALERT_BADGE_STYLES: Record<"info" | "warnung" | "gefahr", string> = {
  gefahr: "border-destructive/50 bg-destructive/10 text-destructive",
  warnung: "border-chart-4/50 bg-chart-4/10 text-foreground",
  info: "border-border bg-secondary/60 text-foreground",
};

function WeatherWidget({ weather }: { weather: HomeWeather | null }) {
  const { t } = useI18n();
  if (!weather) return null;
  const alert = weather.alertCount > 0 ? weather.alert : null;
  return (
    <Link
      href={alert ? "/wetter#warnungen" : "/wetter"}
      className="mb-6 flex items-center gap-4 rounded-xl border border-border/70 bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
      aria-label={
        alert
          ? t.home.weatherAlertAria(
              Math.round(weather.temperatureC),
              weather.label,
              weather.alertCount,
              t.weather.severity[alert.severity]
            )
          : t.home.weatherAria(Math.round(weather.temperatureC), weather.label)
      }
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <CloudSunRain className="h-5.5 w-5.5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="font-serif text-2xl font-bold">
            {Math.round(weather.temperatureC)}°
          </span>
          <span className="truncate text-sm text-muted-foreground">
            {weather.label}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Wind className="h-3 w-3" aria-hidden="true" />
            {Math.round(weather.windKmh)} km/h
          </span>
        </span>
        {alert ? (
          <span
            className={
              alert.severity === "gefahr"
                ? "mt-0.5 flex items-center gap-1 text-xs font-medium text-destructive"
                : "mt-0.5 flex items-center gap-1 text-xs font-medium text-foreground"
            }
          >
            <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
            {alert.title}
          </span>
        ) : (
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {t.home.weatherNoAlerts}
          </span>
        )}
      </span>
      {/* Deutliches Badge: Anzahl der Warnungen + höchste Stufe */}
      {alert && (
        <span
          className={`flex shrink-0 flex-col items-center gap-0.5 rounded-lg border px-2 py-1 text-[11px] font-semibold leading-none ${ALERT_BADGE_STYLES[alert.severity]}`}
        >
          <span className="flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            {weather.alertCount}
          </span>
          <span className="text-[9px] font-medium uppercase tracking-wide">
            {t.weather.severity[alert.severity]}
          </span>
        </span>
      )}
      <ArrowRight
        className="h-4 w-4 shrink-0 text-muted-foreground/50"
        aria-hidden="true"
      />
    </Link>
  );
}

/** Icon-Schlüssel aus shared/dailyTips.ts auf lucide-Komponenten mappen. */
const TIP_ICONS: Record<DailyTipIcon, typeof Sparkles> = {
  sparkles: Sparkles,
  droplets: Droplets,
  cloudRain: CloudRain,
  moon: Moon,
  sun: Sun,
  cookingPot: CookingPot,
  cable: Cable,
  cross: Cross,
  users: Users,
  treePine: TreePine,
};

/**
 * «Tipp des Tages»: kleine Karte mit genau einem Tages-Tipp aus Wetter
 * (geteilte Daten des Wetter-Widgets), Mond/Astro (reine Berechnung) und
 * Datum – verlinkt aufs passende Modul. Ohne Standort/Wetter greifen die
 * wetterfreien Regeln bzw. die Fallback-Rotation.
 */
function TipOfDayWidget({
  today,
  tomorrow,
}: {
  today?: DayWeather;
  tomorrow?: DayWeather;
}) {
  const { lang, t } = useI18n();
  const recipes = useRecipes();
  const tip = useMemo(() => {
    const now = new Date();
    const moon = getMoonInfo(now, lang);
    const active = meteorShowers.find(s => isShowerActive(s, now));
    const doy = dayOfYear(now);
    return dailyTip(
      {
        weatherToday: today,
        weatherTomorrow: tomorrow,
        moonIllumination: moon.illumination,
        stargazingQuality: stargazingQuality(moon.illumination, lang).score,
        activeMeteorShower: active ? pick(active.name, lang) : undefined,
        month: now.getMonth() + 1,
        dayOfYear: doy,
        recipeOfDay: recipes
          ? pick(recipes[doy % recipes.length].name, lang)
          : undefined,
      },
      lang
    );
  }, [today, tomorrow, lang, recipes]);
  const Icon = TIP_ICONS[tip.icon];
  return (
    <Link
      href={tip.path}
      className="mb-6 flex items-center gap-4 rounded-xl border border-border/70 bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
      aria-label={t.home.tipOfDayAria(tip.text)}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <Icon className="h-5.5 w-5.5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <Lightbulb className="h-3 w-3" aria-hidden="true" />
          {t.home.tipOfDayTitle}
        </span>
        <span className="mt-0.5 block text-sm">{tip.text}</span>
      </span>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-muted-foreground/50"
        aria-hidden="true"
      />
    </Link>
  );
}

/**
 * Dezenter Hinweis unter dem Tipp des Tages: Anzahl fälliger Ausrüstungs-
 * Pflege-Aufgaben (shared/gearTasks.ts), verlinkt aufs Inventar. Erscheint
 * nur angemeldet und nur, wenn tatsächlich etwas fällig ist.
 */
function GearCareHint() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const query = trpc.gear.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const today = todayIso();
  const dueCount = useMemo(
    () =>
      (query.data ?? []).filter(task => gearTaskDue(task, today).due).length,
    [query.data, today]
  );
  if (!isAuthenticated || dueCount === 0) return null;
  return (
    <Link
      href="/inventar"
      className="mb-6 -mt-3 flex items-center gap-2.5 rounded-lg border border-border/60 bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      aria-label={t.home.gearDueAria(dueCount)}
    >
      <Wrench className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">
        {t.home.gearDueText(dueCount)}
      </span>
      <ArrowRight
        className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50"
        aria-hidden="true"
      />
    </Link>
  );
}

/**
 * Dezente Zeile neben dem Pflege-Hinweis: Anzahl Zeckenstiche, deren
 * 14-Tage-Beobachtung (shared/tickBites.ts) noch läuft – verlinkt auf die
 * Erste Hilfe. Erscheint nur angemeldet und nur bei offenen Stichen.
 */
function TickBiteHint() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const query = trpc.tickBites.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const today = todayIso();
  const openCount = useMemo(
    () =>
      (query.data ?? []).filter(
        bite => !tickObservationStatus(bite, today).done
      ).length,
    [query.data, today]
  );
  if (!isAuthenticated || openCount === 0) return null;
  return (
    <Link
      href="/erste-hilfe"
      className="mb-6 -mt-3 flex items-center gap-2.5 rounded-lg border border-border/60 bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      aria-label={t.home.tickDueAria(openCount)}
    >
      <Bug className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">
        {t.home.tickDueText(openCount)}
      </span>
      <ArrowRight
        className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50"
        aria-hidden="true"
      />
    </Link>
  );
}

/**
 * Globale Suche über die Offline-Wissensmodule (Erste Hilfe, Knoten, Rezepte,
 * Natur) – angemeldet zusätzlich über eigene Inhalte (Packlisten, Zeltplätze,
 * eigene Rezepte/Jagden/Quizze, Zelt-Finder-Ziele, Notizen). Die Nutzerdaten werden
 * erst geladen, wenn das Suchfeld benutzt wird (enabled-Flag), nicht beim
 * Seitenaufbau.
 */
const RECENT_SEARCHES_KEY = "campmesser.recentSearches";

function loadRecentSearches(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) ?? "[]");
    if (Array.isArray(raw)) {
      return raw.filter(v => typeof v === "string" && v.trim()).slice(0, 8);
    }
  } catch {
    /* egal */
  }
  return [];
}

function KnowledgeSearch() {
  const { lang, t } = useI18n();
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState("");
  const [activated, setActivated] = useState(false);
  const [tentTargets, setTentTargets] = useState<TentFinderTarget[]>([]);
  const [focused, setFocused] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  /**
   * Steht der Wissens-Index bereit? Er wird erst beim ersten Fokus geholt
   * (gegen 500 kB Text in vier Sprachen, siehe lib/globalSearch.ts) – bis
   * dahin erscheinen nur eigene Treffer, mit Hinweis statt «nichts gefunden».
   */
  const [indexReady, setIndexReady] = useState(() =>
    isKnowledgeIndexReady(lang)
  );

  /** Suchbegriff beim Klick auf ein Resultat in den Verlauf aufnehmen. */
  const rememberSearch = () => {
    const term = query.trim();
    if (term.length < 2) return;
    const next = [
      term,
      ...recent.filter(r => r.toLowerCase() !== term.toLowerCase()),
    ].slice(0, 8);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    } catch {
      /* egal */
    }
  };

  // Sprachwechsel bei offenem Suchfeld: Der Index gilt pro Sprache, der
  // neue muss also erst gebaut werden.
  useEffect(() => {
    setIndexReady(isKnowledgeIndexReady(lang));
    if (!activated) return;
    void ensureKnowledgeIndex(lang).then(() => setIndexReady(true));
  }, [lang, activated]);

  const clearRecent = () => {
    setRecent([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      /* egal */
    }
  };

  const enabled = isAuthenticated && activated;
  const queryOpts = { enabled, staleTime: 60_000 } as const;
  const packListsQuery = trpc.packing.lists.useQuery(undefined, queryOpts);
  const spotsQuery = trpc.spots.list.useQuery(undefined, queryOpts);
  const recipesQuery = trpc.recipes.list.useQuery(undefined, queryOpts);
  const huntsQuery = trpc.hunts.list.useQuery(undefined, queryOpts);
  const quizzesQuery = trpc.quizzes.list.useQuery(undefined, queryOpts);
  const notesQuery = trpc.notes.list.useQuery(undefined, queryOpts);
  // Ausrüstung, Kisten, Vorräte und Aufenthalte (#307): Genau danach fragt
  // man unterwegs («wo ist die Stirnlampe», «in welcher Kiste ist der
  // Kocher»), und genau das fand die Suche bisher nicht. Geladen wird erst
  // beim Antippen des Suchfelds – wie alle anderen Listen hier auch.
  const gearQuery = trpc.inventory.list.useQuery(undefined, queryOpts);
  const boxesQuery = trpc.boxes.list.useQuery(undefined, queryOpts);
  const foodQuery = trpc.food.list.useQuery(undefined, queryOpts);
  const searchTripsQuery = trpc.trips.list.useQuery(undefined, queryOpts);
  // Der geschriebene Inhalt der Reisen (#349): Journal, Pinnwand,
  // Gästebuch. Wie alle Listen hier erst beim Antippen des Suchfelds –
  // es sind alle Journal-Texte auf einmal, und wer nie sucht, holt nichts.
  const tripTextsQuery = trpc.trips.texts.useQuery(undefined, queryOpts);

  /**
   * Journal-, Pinnwand- und Gästebuch-Einträge in eine Liste für die Suche
   * (#349). Der REISENAME kommt hier dazu, weil ihn `tripDisplayName` an
   * einer Stelle bildet (#329) – ein Treffer ohne «zu welcher Reise
   * gehört das» wäre die halbe Antwort.
   */
  const tripTexts = useMemo(() => {
    const raw = tripTextsQuery.data;
    if (!raw) return undefined;
    const names = new Map(
      (searchTripsQuery.data ?? []).map(trip => [
        trip.id,
        tripDisplayName(trip, lang),
      ])
    );
    const nameOf = (tripId: number) => names.get(tripId) ?? "";
    return [
      ...raw.journal.map(entry => ({
        id: `journal-${entry.id}`,
        tripId: entry.tripId,
        tripName: nameOf(entry.tripId),
        kind: "journal" as const,
        text: entry.text,
        detail: fmtShort(entry.day, lang),
      })),
      ...raw.board.map(entry => ({
        id: `board-${entry.id}`,
        tripId: entry.tripId,
        tripName: nameOf(entry.tripId),
        kind: "board" as const,
        text: entry.text,
      })),
      ...raw.guestbook.map(entry => ({
        id: `guestbook-${entry.id}`,
        tripId: entry.tripId,
        tripName: nameOf(entry.tripId),
        kind: "guestbook" as const,
        text: entry.text,
        detail: entry.authorName,
      })),
    ];
  }, [tripTextsQuery.data, searchTripsQuery.data, lang]);

  /**
   * Beim ersten Fokus/Tippen: Wissens-Index nachladen, tRPC-Queries
   * freischalten, lokale Ziele lesen. Der Index kommt bewusst hier und
   * nicht beim Seitenaufbau – siehe lib/globalSearch.ts.
   */
  const activate = () => {
    void ensureKnowledgeIndex(lang).then(() => setIndexReady(true));
    if (activated) return;
    setActivated(true);
    setRecent(loadRecentSearches());
    try {
      setTentTargets(
        sanitizeTargets(JSON.parse(localStorage.getItem(TARGETS_KEY) ?? "[]"))
      );
    } catch {
      // Kaputter localStorage-Wert: dann eben ohne Zelt-Finder-Ziele suchen
    }
  };

  const hasQuery = query.trim().length >= 2;
  const ownResults =
    hasQuery && isAuthenticated
      ? searchOwnContent(
          query,
          {
            packLists: packListsQuery.data,
            spots: spotsQuery.data,
            recipes: recipesQuery.data,
            hunts: huntsQuery.data,
            quizzes: quizzesQuery.data,
            tentTargets,
            notes: notesQuery.data,
            inventory: gearQuery.data?.map(item => {
              // Die Kiste steht am Gegenstand nur als Id – der Name kommt
              // aus der Kisten-Liste, die ohnehin schon geladen ist.
              const box = boxesQuery.data?.find(b => b.id === item.boxId);
              return {
                id: item.id,
                name: item.name,
                category: item.category,
                notes: item.notes,
                boxName: box?.name ?? null,
                boxCode: box?.code ?? null,
              };
            }),
            boxes: boxesQuery.data,
            food: foodQuery.data,
            trips: searchTripsQuery.data?.map(trip => ({
              id: trip.id,
              title: trip.title,
              location: trip.location,
              spotName: trip.spotName,
              startDate: trip.startDate,
            })),
            tripTexts: tripTexts,
          },
          6,
          lang
        )
      : [];
  const results = hasQuery ? searchKnowledge(query, 8, lang) : [];
  // Eigene Treffer stehen vor den statischen Wissens-Inhalten
  const combined = [...ownResults, ...results];
  return (
    <div className="mb-8">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onFocus={() => {
            activate();
            setFocused(true);
          }}
          onBlur={() => {
            // Verzögert, damit Klicks auf die Verlaufs-Chips noch greifen
            window.setTimeout(() => setFocused(false), 150);
          }}
          onChange={e => {
            activate();
            setQuery(e.target.value);
          }}
          placeholder={t.home.searchPlaceholder}
          aria-label={t.home.searchAria}
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50"
        />
      </div>
      {!hasQuery && focused && recent.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">
            {t.home.recentSearches}
          </span>
          {recent.map(term => (
            <button
              key={term}
              type="button"
              onClick={() => setQuery(term)}
              className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {term}
            </button>
          ))}
          <button
            type="button"
            onClick={clearRecent}
            aria-label={t.home.recentSearchesClear}
            className="rounded-full px-1.5 py-1 text-xs text-muted-foreground/70 underline-offset-2 hover:underline"
          >
            {t.home.recentSearchesClear}
          </button>
        </div>
      )}
      {hasQuery && (
        <div className="mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {combined.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              {/* Ohne Index wäre «nichts gefunden» schlicht gelogen – die
                  Wissensmodule sind dann noch gar nicht durchsucht. */}
              {indexReady ? t.home.searchNoResults : t.home.searchPreparing}
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {combined.map(r => (
                <li key={r.id}>
                  <Link
                    href={r.path}
                    onClick={rememberSearch}
                    className="flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-accent/50"
                  >
                    <span className="mt-0.5 shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-secondary-foreground">
                      {t.home.searchCategories[r.module]}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">
                        {r.title}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {r.snippet}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/** Schnellzugriff: die zuletzt genutzten Module (max. 4) aus dem lokalen Verlauf. */
function RecentModules({ hidden }: { hidden: string[] }) {
  const { lang, t } = useI18n();
  const [recent] = useState<string[]>(() => getRecentModules());
  const items = recent
    .map(path => modules.find(m => m.path === path))
    .filter(
      (m): m is (typeof modules)[number] =>
        Boolean(m) && !hidden.includes(m!.path)
    )
    .slice(0, 4);
  if (items.length === 0) return null;
  return (
    <div className="mb-8">
      <h2 className="mb-3 flex items-center gap-2 font-serif text-xl font-semibold md:text-2xl">
        <HistoryIcon className="h-5 w-5 text-primary" aria-hidden="true" />
        {t.home.recentTitle}
      </h2>
      <div className="flex flex-wrap gap-2">
        {items.map(m => {
          const Icon = m.icon;
          return (
            <Link
              key={m.path}
              href={m.path}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.98]"
            >
              <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
              {pick(m.title, lang)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/**
 * «Heute»-Ansicht beim App-Start (#298).
 *
 * Läuft heute eine Reise und ist die Einstellung an, springt der erste
 * Aufruf der Startseite nach /heute. NUR EINMAL PRO SITZUNG: Wer danach
 * «Start» antippt, will die Kacheln sehen – eine App, die einen von dort
 * jedes Mal zurückwirft, ist kaputt.
 */
function useTodayStartJump() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const trips = tripsQuery.data;

  useEffect(() => {
    if (!trips) return;
    const today = todayIso();
    const jump = shouldOpenToday({
      enabled: loadTodayStart(),
      hasRunningTrip: pickRunningTrip(trips, today) !== null,
      hasJumped: hasJumpedToday(),
    });
    if (!jump) return;
    markJumpedToday();
    navigate("/heute");
  }, [trips, navigate]);
}

export default function Home() {
  const { lang, t } = useI18n();
  const { user } = useAuth();
  useTodayStartJump();
  // Persönliche Begrüssung nach Tageszeit; ohne Namen bleibt der Hero-Kicker
  const greetFirstName = firstNameOf(user?.name);
  const greeting = greetFirstName
    ? t.home.greeting[greetingKey(new Date().getHours())](greetFirstName)
    : null;
  const homeWeather = useHomeWeather(lang);
  const [sunTimes, setSunTimes] = useState<{
    sunrise: Date;
    sunset: Date;
  } | null>(null);
  const [sortMode, setSortMode] = useState(false);
  /**
   * Unterwegs-Modus (lib/travelMode.ts): «auto» folgt dem laufenden
   * Aufenthalt, eine getroffene Wahl gewinnt darüber.
   */
  const [travelMode, setTravelMode] = useState<TravelMode>(() =>
    loadTravelMode()
  );
  const { isAuthenticated: signedIn } = useAuth();
  // Dieselbe Abfrage nutzen schon die Startseiten-Widgets – React Query
  // fasst sie zusammen, es entsteht also keine zusätzliche Anfrage.
  const homeTripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled: signedIn,
    staleTime: 60_000,
  });
  const today = todayIso();
  const tripRunning = (homeTripsQuery.data ?? []).some(
    trip => currentTripDay(trip, today) !== null
  );
  const onSite = isOnSite(travelMode, tripRunning);
  const chooseTravelMode = (mode: TravelMode) => {
    setTravelMode(mode);
    saveTravelMode(mode);
  };
  const [order, setOrder] = useState<string[]>(() => loadModuleOrder());
  const [hidden, setHidden] = useState<string[]>(() => loadHiddenModules());
  const [hiddenWidgets, setHiddenWidgets] = useState<OptionalWidgetId[]>(() =>
    loadHiddenWidgets()
  );

  // Geräte-Sync: Server-Stand gewinnt beim Laden, lokale Änderungen werden gepusht
  const orderSync = useSyncedSetting<string[]>("moduleOrder", value => {
    if (!Array.isArray(value)) return;
    const clean = value.filter((p): p is string => typeof p === "string");
    setOrder(clean);
    saveModuleOrder(clean);
  });
  const hiddenSync = useSyncedSetting<string[]>("hiddenModules", value => {
    if (!Array.isArray(value)) return;
    const clean = value.filter((p): p is string => typeof p === "string");
    setHidden(clean);
    saveHiddenModules(clean);
  });

  const widgetSync = useSyncedSetting<unknown>("hiddenWidgets", value => {
    const clean = sanitizeHiddenWidgets(value);
    setHiddenWidgets(clean);
    storeHiddenWidgets(clean);
  });

  /** Widget aus- oder wieder einblenden (nur im Sortier-Modus erreichbar). */
  const toggleWidgetVisibility = (id: OptionalWidgetId) => {
    const next = toggleWidget(hiddenWidgets, id);
    setHiddenWidgets(next);
    storeHiddenWidgets(next);
    widgetSync.push(next);
  };

  /** Kachel aus- oder wieder einblenden (nur im Sortier-Modus erreichbar). */
  const toggleHidden = (path: string) => {
    const next = hidden.includes(path)
      ? hidden.filter(p => p !== path)
      : [...hidden, path];
    setHidden(next);
    saveHiddenModules(next);
    hiddenSync.push(next);
  };
  // Geteilte Pointer-Drag-Logik (Maus + Touch) – auch von den Packlisten genutzt
  const drag = usePointerDrag<(typeof groups)[number]>({
    onDrop: (group, from, to) => moveModule(group, from, to),
  });

  /** Module einer Gruppe in gespeicherter Reihenfolge liefern. */
  const orderedModules = (group: (typeof groups)[number]) => {
    const inGroup = modules.filter(m => m.group === group);
    return [...inGroup].sort((a, b) => {
      const ia = order.indexOf(a.path);
      const ib = order.indexOf(b.path);
      return (
        (ia === -1 ? inGroup.indexOf(a) : ia) -
        (ib === -1 ? inGroup.indexOf(b) : ib)
      );
    });
  };

  /** Kachel innerhalb ihrer Gruppe an neue Position schieben und speichern. */
  const moveModule = (
    group: (typeof groups)[number],
    fromPath: string,
    toPath: string
  ) => {
    if (fromPath === toPath) return;
    const inGroup = orderedModules(group).map(m => m.path);
    const fromIdx = inGroup.indexOf(fromPath);
    const toIdx = inGroup.indexOf(toPath);
    if (fromIdx === -1 || toIdx === -1) return;
    inGroup.splice(toIdx, 0, ...inGroup.splice(fromIdx, 1));
    // Gesamtreihenfolge: alle Gruppen zusammenführen
    const next = groups.flatMap(g =>
      g === group ? inGroup : orderedModules(g).map(m => m.path)
    );
    setOrder(next);
    saveModuleOrder(next);
    orderSync.push(next);
  };

  const moveByOffset = (
    group: (typeof groups)[number],
    path: string,
    offset: -1 | 1
  ) => {
    const inGroup = orderedModules(group).map(m => m.path);
    const idx = inGroup.indexOf(path);
    const target = inGroup[idx + offset];
    if (target) moveModule(group, path, target);
  };

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        const times = getSunTimes(
          new Date(),
          pos.coords.latitude,
          pos.coords.longitude
        );
        if (times.sunrise && times.sunset) {
          setSunTimes({ sunrise: times.sunrise, sunset: times.sunset });
        }
      },
      () => setSunTimes(null),
      { timeout: 8000 }
    );
  }, []);

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString(LOCALE_TAGS[lang], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary text-white">
        <img
          src={heroImage}
          alt={t.home.heroImageAlt}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent"
          aria-hidden="true"
        />
        <div className="container relative py-16 md:py-24">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-white/90 drop-shadow">
            {greeting ?? t.home.heroKicker}
          </p>
          <h1 className="max-w-xl text-3xl font-bold leading-tight drop-shadow-md md:text-5xl">
            {t.home.heroTitle1}
            <br />
            {t.home.heroTitle2}
          </h1>
          <p className="mt-3 max-w-lg text-white/90 drop-shadow md:text-lg">
            {t.home.heroSubtitle}
          </p>
          {sunTimes && (
            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-black/40 px-4 py-1.5 text-sm text-white backdrop-blur-md">
              <Compass className="h-4 w-4" aria-hidden="true" />
              {t.home.sunInfo(
                fmtTime(sunTimes.sunrise),
                fmtTime(sunTimes.sunset)
              )}
            </p>
          )}
        </div>
      </section>

      {/* Modul-Grid */}
      <section className="container py-8 md:py-12">
        {isWidgetVisible(hiddenWidgets, "onboarding") && <OnboardingCard />}
        {isWidgetVisible(hiddenWidgets, "briefing") && <BriefingWidget />}
        {isWidgetVisible(hiddenWidgets, "trip") && <NextTripWidget />}
        {isWidgetVisible(hiddenWidgets, "anniversary") && <AnniversaryCard />}
        {isWidgetVisible(hiddenWidgets, "weather") && (
          <WeatherWidget weather={homeWeather.weather} />
        )}
        {isWidgetVisible(hiddenWidgets, "tip") && (
          <>
            <TipOfDayWidget
              today={homeWeather.today}
              tomorrow={homeWeather.tomorrow}
            />
            <GearCareHint />
            <TickBiteHint />
          </>
        )}
        <KnowledgeSearch />
        {isWidgetVisible(hiddenWidgets, "recent") && (
          <RecentModules hidden={hidden} />
        )}
        <div className="mb-4 flex items-center justify-end">
          <button
            type="button"
            onClick={() => setSortMode(s => !s)}
            className={
              sortMode
                ? "inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground shadow-sm"
                : "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            }
            aria-pressed={sortMode}
            aria-label={sortMode ? t.home.sortDoneAria : t.home.sortStartAria}
          >
            <GripVertical className="h-4 w-4" aria-hidden="true" />
            {sortMode ? t.home.sortDone : t.home.sortStart}
          </button>
        </div>
        {sortMode && (
          <p className="mb-4 rounded-lg bg-accent px-4 py-2.5 text-sm text-accent-foreground">
            {t.home.sortHint}
          </p>
        )}
        {/* Widgets ein-/ausblenden: Hero, Suche und die Kacheln bleiben
            Pflicht und stehen deshalb bewusst nicht zur Auswahl. */}
        {sortMode && (
          <section
            className="mb-8 rounded-xl border border-border/70 bg-card p-4 shadow-sm"
            aria-label={t.home.widgetsTitle}
          >
            <h2 className="font-serif text-base font-semibold">
              {t.home.widgetsTitle}
            </h2>
            <p className="mb-3 mt-0.5 text-xs text-muted-foreground">
              {t.home.widgetsHint}
            </p>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {OPTIONAL_WIDGETS.map(id => {
                const label = t.home.widgetNames[id];
                const isHidden = !isWidgetVisible(hiddenWidgets, id);
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => toggleWidgetVisibility(id)}
                      aria-pressed={!isHidden}
                      aria-label={
                        isHidden
                          ? t.home.showAria(label)
                          : t.home.hideAria(label)
                      }
                      className={
                        "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors " +
                        (isHidden
                          ? "border-border bg-muted/40 text-muted-foreground"
                          : "border-primary/40 bg-accent/40 text-foreground")
                      }
                    >
                      {isHidden ? (
                        <EyeOff
                          className="h-4 w-4 shrink-0"
                          aria-hidden="true"
                        />
                      ) : (
                        <Eye
                          className="h-4 w-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                      )}
                      <span className="min-w-0 flex-1 truncate text-left">
                        {label}
                      </span>
                      {isHidden && (
                        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-secondary-foreground">
                          {t.home.hiddenBadge}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
        {/* Unterwegs-Modus: Läuft ein Aufenthalt, stehen die Vor-Ort-
            Werkzeuge zuoberst und die Planung zuunterst. Der Umschalter
            erscheint nur, wenn er etwas zu tun hat – also während eines
            Aufenthalts oder solange eine Wahl von Hand gilt. */}
        {(tripRunning || travelMode !== "auto") && !sortMode && (
          <div
            className="mb-6 flex flex-wrap items-center gap-2"
            role="group"
            aria-label={t.home.travelModeAria}
          >
            <span className="text-xs text-muted-foreground">
              {t.home.travelModeLabel}
            </span>
            {(
              [
                ["onSite", t.home.travelModeOnSite],
                ["planning", t.home.travelModePlanning],
              ] as [TravelMode, string][]
            ).map(([mode, label]) => {
              const active = onSite === (mode === "onSite");
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => chooseTravelMode(active ? "auto" : mode)}
                  aria-pressed={active}
                  className={
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
                    (active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:text-foreground")
                  }
                >
                  {label}
                </button>
              );
            })}
            {travelMode !== "auto" && (
              <button
                type="button"
                onClick={() => chooseTravelMode("auto")}
                className="rounded-full px-2 py-1 text-xs text-muted-foreground/70 underline-offset-2 hover:underline"
              >
                {t.home.travelModeAuto}
              </button>
            )}
          </div>
        )}
        {orderGroups(groups, onSite).map(group => {
          // Im Normal-Modus verschwinden ausgeblendete Kacheln (und leere Gruppen),
          // im Sortier-Modus bleiben sie gedimmt sichtbar, damit man sie zurückholen kann.
          const groupModules = orderedModules(group).filter(
            m => sortMode || !hidden.includes(m.path)
          );
          if (groupModules.length === 0) return null;
          return (
            <div key={group} className="mb-8 last:mb-0">
              <h2 className="mb-4 font-serif text-xl font-semibold md:text-2xl">
                {pick(groupLabels[group], lang)}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {groupModules.map((m, idx, arr) => {
                  const Icon = m.icon;
                  if (sortMode) {
                    const isHidden = hidden.includes(m.path);
                    return (
                      <div
                        key={m.path}
                        {...drag.dragProps(group, m.path)}
                        className={
                          "flex touch-none select-none items-start gap-4 rounded-xl border bg-card p-4 shadow-sm transition-all " +
                          (isHidden ? "opacity-45 " : "") +
                          (drag.dragId === m.path
                            ? "border-primary opacity-60"
                            : drag.dragOverId === m.path
                              ? "border-solid border-primary bg-accent/40"
                              : "cursor-grab border-dashed border-primary/40 active:cursor-grabbing")
                        }
                        aria-label={t.home.moveAria(pick(m.title, lang))}
                      >
                        <GripVertical
                          className="mt-2 h-5 w-5 shrink-0 text-muted-foreground/60"
                          aria-hidden="true"
                        />
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                          <Icon className="h-5.5 w-5.5" aria-hidden="true" />
                        </span>
                        <span className="flex-1">
                          <span className="flex items-center gap-2 font-semibold text-card-foreground">
                            {pick(m.title, lang)}
                            {isHidden && (
                              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-secondary-foreground">
                                {t.home.hiddenBadge}
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block text-sm text-muted-foreground">
                            {pick(m.description, lang)}
                          </span>
                        </span>
                        <span className="flex shrink-0 flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => moveByOffset(group, m.path, -1)}
                            disabled={idx === 0}
                            className="rounded-md border border-border p-1 text-muted-foreground disabled:opacity-30"
                            aria-label={t.home.moveUpAria(pick(m.title, lang))}
                          >
                            <ChevronUp className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveByOffset(group, m.path, 1)}
                            disabled={idx === arr.length - 1}
                            className="rounded-md border border-border p-1 text-muted-foreground disabled:opacity-30"
                            aria-label={t.home.moveDownAria(
                              pick(m.title, lang)
                            )}
                          >
                            <ChevronDown
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleHidden(m.path)}
                            className={
                              isHidden
                                ? "rounded-md border border-primary bg-primary/10 p-1 text-primary"
                                : "rounded-md border border-border p-1 text-muted-foreground"
                            }
                            aria-pressed={isHidden}
                            aria-label={
                              isHidden
                                ? t.home.showAria(pick(m.title, lang))
                                : t.home.hideAria(pick(m.title, lang))
                            }
                          >
                            {isHidden ? (
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <EyeOff className="h-4 w-4" aria-hidden="true" />
                            )}
                          </button>
                        </span>
                      </div>
                    );
                  }
                  return (
                    <Link
                      key={m.path}
                      href={m.path}
                      className="group flex items-start gap-4 rounded-xl border border-border/70 bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.99]"
                      aria-label={t.home.openAria(pick(m.title, lang))}
                    >
                      <span
                        className={
                          m.path === "/sos"
                            ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive"
                            : "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground"
                        }
                      >
                        <Icon className="h-5.5 w-5.5" aria-hidden="true" />
                      </span>
                      <span className="flex-1">
                        <span className="flex items-center gap-2 font-semibold text-card-foreground">
                          {pick(m.title, lang)}
                          {m.offline && (
                            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-secondary-foreground">
                              {t.common.offlineBadge}
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-sm text-muted-foreground">
                          {pick(m.description, lang)}
                        </span>
                      </span>
                      <ArrowRight
                        className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                        aria-hidden="true"
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
