import { Link } from "wouter";
import heroImage from "@/assets/hero-camping.webp";
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CloudSunRain,
  Compass,
  Eye,
  EyeOff,
  GripVertical,
  History as HistoryIcon,
  Search,
  Wind,
} from "lucide-react";
import { groupLabels, groups, modules } from "@/data/modules";
import { LOCALE_TAGS, pick } from "@shared/i18n";
import { useI18n, useT } from "@/i18n";
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
import { recipes } from "@/data/recipes";
import {
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
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getRecentModules } from "@/components/AppShell";
import { usePointerDrag } from "@/lib/usePointerDrag";
import { useSyncedSetting } from "@/lib/useSyncedSetting";
import { searchKnowledge, searchOwnContent } from "@/lib/globalSearch";
import {
  TARGETS_KEY,
  sanitizeTargets,
  type TentFinderTarget,
} from "@/lib/tentFinderTargets";
import { daysUntilTrip, isUpcomingTrip } from "@shared/trips";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { CalendarClock, ListChecks } from "lucide-react";

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
}

/** Countdown zum nächsten geplanten Trip aus dem Reise-Tagebuch. */
function NextTripWidget() {
  const t = useT();
  const { isAuthenticated } = useAuth();
  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const spotsQuery = trpc.spots.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const today = new Date().toISOString().slice(0, 10);
  const next = (tripsQuery.data ?? [])
    .filter(t => isUpcomingTrip(t.startDate, today))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  const progress = trpc.packing.progress.useQuery(
    { listId: next?.packListId ?? 0 },
    { enabled: Boolean(next?.packListId) }
  );
  if (!next) return null;

  const place =
    next.title ||
    (next.spotId != null
      ? (spotsQuery.data?.find(s => s.id === next.spotId)?.name ?? "")
      : (next.location ?? "")) ||
    t.home.nextTripFallback;
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

function WeatherWidget({ weather }: { weather: HomeWeather | null }) {
  const { t } = useI18n();
  if (!weather) return null;
  return (
    <Link
      href="/wetter"
      className="mb-6 flex items-center gap-4 rounded-xl border border-border/70 bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
      aria-label={t.home.weatherAria(
        Math.round(weather.temperatureC),
        weather.label
      )}
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
        {weather.alert ? (
          <span
            className={
              weather.alert.severity === "gefahr"
                ? "mt-0.5 flex items-center gap-1 text-xs font-medium text-destructive"
                : "mt-0.5 flex items-center gap-1 text-xs font-medium text-foreground"
            }
          >
            <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
            {weather.alert.title}
          </span>
        ) : (
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {t.home.weatherNoAlerts}
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
        recipeOfDay: pick(recipes[doy % recipes.length].name, lang),
      },
      lang
    );
  }, [today, tomorrow, lang]);
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
 * Globale Suche über die Offline-Wissensmodule (Erste Hilfe, Knoten, Rezepte,
 * Natur) – angemeldet zusätzlich über eigene Inhalte (Packlisten, Zeltplätze,
 * eigene Rezepte/Jagden/Quizze, Zelt-Finder-Ziele). Die Nutzerdaten werden
 * erst geladen, wenn das Suchfeld benutzt wird (enabled-Flag), nicht beim
 * Seitenaufbau.
 */
function KnowledgeSearch() {
  const { lang, t } = useI18n();
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState("");
  const [activated, setActivated] = useState(false);
  const [tentTargets, setTentTargets] = useState<TentFinderTarget[]>([]);

  const enabled = isAuthenticated && activated;
  const queryOpts = { enabled, staleTime: 60_000 } as const;
  const packListsQuery = trpc.packing.lists.useQuery(undefined, queryOpts);
  const spotsQuery = trpc.spots.list.useQuery(undefined, queryOpts);
  const recipesQuery = trpc.recipes.list.useQuery(undefined, queryOpts);
  const huntsQuery = trpc.hunts.list.useQuery(undefined, queryOpts);
  const quizzesQuery = trpc.quizzes.list.useQuery(undefined, queryOpts);

  /** Beim ersten Fokus/Tippen: tRPC-Queries freischalten, lokale Ziele lesen. */
  const activate = () => {
    if (activated) return;
    setActivated(true);
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
          onFocus={activate}
          onChange={e => {
            activate();
            setQuery(e.target.value);
          }}
          placeholder={t.home.searchPlaceholder}
          aria-label={t.home.searchAria}
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50"
        />
      </div>
      {hasQuery && (
        <div className="mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {combined.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              {t.home.searchNoResults}
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {combined.map(r => (
                <li key={r.id}>
                  <Link
                    href={r.path}
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

export default function Home() {
  const { lang, t } = useI18n();
  const homeWeather = useHomeWeather(lang);
  const [sunTimes, setSunTimes] = useState<{
    sunrise: Date;
    sunset: Date;
  } | null>(null);
  const [sortMode, setSortMode] = useState(false);
  const [order, setOrder] = useState<string[]>(() => loadModuleOrder());
  const [hidden, setHidden] = useState<string[]>(() => loadHiddenModules());

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
            {t.home.heroKicker}
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
        <NextTripWidget />
        <WeatherWidget weather={homeWeather.weather} />
        <TipOfDayWidget
          today={homeWeather.today}
          tomorrow={homeWeather.tomorrow}
        />
        <KnowledgeSearch />
        <RecentModules hidden={hidden} />
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
        {groups.map(group => {
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
