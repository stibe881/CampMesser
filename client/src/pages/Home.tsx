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
import { groups, modules } from "@/data/modules";
import {
  describeWeatherCode,
  detectAlerts,
  type HourlyWeather,
} from "@shared/weather";
import { getSunTimes } from "@/lib/sun";
import { useEffect, useRef, useState } from "react";
import { getRecentModules } from "@/components/AppShell";
import { useSyncedSetting } from "@/lib/useSyncedSetting";
import { searchKnowledge } from "@/lib/globalSearch";

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

/** Kompaktes Wetter-Widget: aktuelle Lage + höchste Warnung am Standort. */
function WeatherWidget() {
  const [weather, setWeather] = useState<HomeWeather | null>(null);

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
          const alerts = detectAlerts(hourly);
          setWeather({
            temperatureC: json.current.temperature_2m,
            windKmh: json.current.wind_speed_10m,
            label: describeWeatherCode(json.current.weather_code).label,
            alert: alerts[0]
              ? { title: alerts[0].title, severity: alerts[0].severity }
              : null,
          });
        } catch {
          // Ohne Netz bleibt das Widget einfach ausgeblendet
        }
      },
      () => {},
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  }, []);

  if (!weather) return null;
  return (
    <Link
      href="/wetter"
      className="mb-6 flex items-center gap-4 rounded-xl border border-border/70 bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
      aria-label={`Aktuelles Wetter: ${Math.round(weather.temperatureC)} Grad, ${weather.label} – zum Wetter-Modul`}
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
            Keine Unwetterwarnungen an deinem Standort
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

/** Globale Suche über die Offline-Wissensmodule (Erste Hilfe, Knoten, Rezepte, Natur). */
function KnowledgeSearch() {
  const [query, setQuery] = useState("");
  const results = query.trim().length >= 2 ? searchKnowledge(query, 8) : [];
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
          onChange={e => setQuery(e.target.value)}
          placeholder="Wissen durchsuchen: Zeckenbiss, Mastwurf, Rezepte …"
          aria-label="Wissensmodule durchsuchen"
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50"
        />
      </div>
      {query.trim().length >= 2 && (
        <div className="mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              Nichts gefunden – probiere einen anderen Begriff (z. B.
              «Verbrennung» oder «Knoten»).
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {results.map(r => (
                <li key={r.id}>
                  <Link
                    href={r.path}
                    className="flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-accent/50"
                  >
                    <span className="mt-0.5 shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-secondary-foreground">
                      {r.module}
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
        Zuletzt genutzt
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
              {m.title}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function Home() {
  const [sunInfo, setSunInfo] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState(false);
  const [order, setOrder] = useState<string[]>(() => loadModuleOrder());
  const [hidden, setHidden] = useState<string[]>(() => loadHiddenModules());
  const [dragPath, setDragPath] = useState<string | null>(null);

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
  const [dragOverPath, setDragOverPath] = useState<string | null>(null);
  const dragInfo = useRef<{
    from: string;
    group: (typeof groups)[number];
  } | null>(null);
  const dragOverRef = useRef<string | null>(null);

  /** Kachel unter dem Zeiger ermitteln (funktioniert für Maus und Touch). */
  const tileUnderPointer = (
    x: number,
    y: number,
    group: string
  ): string | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const tile = el?.closest<HTMLElement>("[data-drag-path]");
    if (!tile || tile.dataset.dragGroup !== group) return null;
    return tile.dataset.dragPath ?? null;
  };

  /** Zieh-Zustand zurücksetzen. */
  const endDrag = () => {
    dragInfo.current = null;
    dragOverRef.current = null;
    setDragPath(null);
    setDragOverPath(null);
  };

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
          const fmt = (d: Date) =>
            d.toLocaleTimeString("de-CH", {
              hour: "2-digit",
              minute: "2-digit",
            });
          setSunInfo(
            `Heute: Sonnenaufgang ${fmt(times.sunrise)} · Sonnenuntergang ${fmt(times.sunset)}`
          );
        }
      },
      () => setSunInfo(null),
      { timeout: 8000 }
    );
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary text-white">
        <img
          src={heroImage}
          alt="Zelt mit Solarpanels und Lagerfeuer vor Schweizer Alpen bei Sonnenuntergang"
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
            Dein Schweizer Taschenmesser fürs Zelt-Camping
          </p>
          <h1 className="max-w-xl text-3xl font-bold leading-tight drop-shadow-md md:text-5xl">
            Alles fürs Camp.
            <br />
            In einer App.
          </h1>
          <p className="mt-3 max-w-lg text-white/90 drop-shadow md:text-lg">
            Planung, Sicherheit, Energie und Naturerlebnis – 16 smarte Werkzeuge
            für dein nächstes Abenteuer.
          </p>
          {sunInfo && (
            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-black/40 px-4 py-1.5 text-sm text-white backdrop-blur-md">
              <Compass className="h-4 w-4" aria-hidden="true" />
              {sunInfo}
            </p>
          )}
        </div>
      </section>

      {/* Modul-Grid */}
      <section className="container py-8 md:py-12">
        <WeatherWidget />
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
            aria-label={sortMode ? "Sortieren beenden" : "Kacheln sortieren"}
          >
            <GripVertical className="h-4 w-4" aria-hidden="true" />
            {sortMode ? "Fertig" : "Sortieren"}
          </button>
        </div>
        {sortMode && (
          <p className="mb-4 rounded-lg bg-accent px-4 py-2.5 text-sm text-accent-foreground">
            Ziehe die Kacheln an ihre neue Position (innerhalb der Gruppe) oder
            nutze die Pfeil-Buttons. Mit dem Augen-Button blendest du Kacheln
            aus oder wieder ein. Angemeldet wird die Auswahl auf allen deinen
            Geräten übernommen.
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
                {group}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {groupModules.map((m, idx, arr) => {
                  const Icon = m.icon;
                  if (sortMode) {
                    const isHidden = hidden.includes(m.path);
                    return (
                      <div
                        key={m.path}
                        data-drag-path={m.path}
                        data-drag-group={group}
                        onPointerDown={e => {
                          // Klicks auf die Pfeil-Buttons nicht als Ziehen werten
                          if ((e.target as HTMLElement).closest("button"))
                            return;
                          dragInfo.current = { from: m.path, group };
                          dragOverRef.current = null;
                          setDragPath(m.path);
                          e.currentTarget.setPointerCapture(e.pointerId);
                        }}
                        onPointerMove={e => {
                          if (!dragInfo.current) return;
                          const over = tileUnderPointer(
                            e.clientX,
                            e.clientY,
                            group
                          );
                          if (over !== dragOverRef.current) {
                            dragOverRef.current = over;
                            setDragOverPath(over);
                          }
                        }}
                        onPointerUp={() => {
                          const info = dragInfo.current;
                          const over = dragOverRef.current;
                          if (info && over && over !== info.from) {
                            moveModule(info.group, info.from, over);
                          }
                          endDrag();
                        }}
                        onPointerCancel={endDrag}
                        className={
                          "flex touch-none select-none items-start gap-4 rounded-xl border bg-card p-4 shadow-sm transition-all " +
                          (isHidden ? "opacity-45 " : "") +
                          (dragPath === m.path
                            ? "border-primary opacity-60"
                            : dragOverPath === m.path
                              ? "border-solid border-primary bg-accent/40"
                              : "cursor-grab border-dashed border-primary/40 active:cursor-grabbing")
                        }
                        aria-label={`${m.title} verschieben`}
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
                            {m.title}
                            {isHidden && (
                              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-secondary-foreground">
                                Ausgeblendet
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block text-sm text-muted-foreground">
                            {m.description}
                          </span>
                        </span>
                        <span className="flex shrink-0 flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => moveByOffset(group, m.path, -1)}
                            disabled={idx === 0}
                            className="rounded-md border border-border p-1 text-muted-foreground disabled:opacity-30"
                            aria-label={`${m.title} nach vorne verschieben`}
                          >
                            <ChevronUp className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveByOffset(group, m.path, 1)}
                            disabled={idx === arr.length - 1}
                            className="rounded-md border border-border p-1 text-muted-foreground disabled:opacity-30"
                            aria-label={`${m.title} nach hinten verschieben`}
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
                                ? `${m.title} wieder einblenden`
                                : `${m.title} ausblenden`
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
                      aria-label={`${m.title} öffnen`}
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
                          {m.title}
                          {m.offline && (
                            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-secondary-foreground">
                              Offline
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-sm text-muted-foreground">
                          {m.description}
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
