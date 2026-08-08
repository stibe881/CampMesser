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
import HomecomingCard from "@/components/HomecomingCard";
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
import { useTodayIso } from "@/lib/useTodayIso";
import {
  CalendarClock,
  ListChecks,
  MapPin,
  Refrigerator,
  ShoppingCart,
  Tent,
  UtensilsCrossed,
} from "lucide-react";

import OnboardingCard from "@/components/home/OnboardingCard";
import BriefingWidget from "@/components/home/BriefingWidget";
import NextTripWidget from "@/components/home/NextTripWidget";
import AnniversaryCard from "@/components/home/AnniversaryCard";
import WeatherWidget, { useHomeWeather } from "@/components/home/HomeWeather";
import {
  GearCareHint,
  TickBiteHint,
  TipOfDayWidget,
} from "@/components/home/HomeHints";
import KnowledgeSearch from "@/components/home/KnowledgeSearch";

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
  const today = useTodayIso();
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
        {/* Rückblick-Erinnerung (#390): in den ersten Tagen nach der
            Heimkehr, bis der Rückblick ausgefüllt oder weggeklickt ist.
            Bewusst KEIN Push – die Trocknungs-Erinnerung (#89) kommt
            schon, eine zweite Meldung wäre Lärm. */}
        <HomecomingCard />
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
