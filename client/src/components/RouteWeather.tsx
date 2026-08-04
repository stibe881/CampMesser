/**
 * Unwetter auf der Fahrtstrecke (#275): nicht nur am Ziel nachschauen,
 * sondern dort, wo man unterwegs sein wird – und zu der Zeit, zu der man
 * dort sein wird.
 *
 * Geprüft werden bis zu acht Punkte entlang der Luftlinie. Für jeden
 * schätzt die Ansicht die Ankunftszeit und liest genau diese
 * Prognosestunde. Eine Zelle, die um 14 Uhr über dem Pass steht, zählt
 * nicht, wenn man um 11 Uhr durchfährt.
 *
 * Wie bei den Picknickplätzen wird ERST BEIM AUFKLAPPEN geladen, und die
 * ganze Strecke braucht nur EINE Abfrage: Open-Meteo nimmt mehrere
 * Koordinaten in einem Aufruf entgegen.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  CloudLightning,
  CloudRain,
  Route as RouteIcon,
  Snowflake,
  Wind,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { corridorPoints } from "@shared/corridor";
import { distanceMeters, formatDistance } from "@shared/geo";
import { LOCALE_TAGS } from "@shared/i18n";
import {
  MAX_ROUTE_WEATHER_POINTS,
  MIN_ROUTE_KM,
  ROUTE_SPEED_KMH,
  hourIndexFor,
  hourRisk,
  routeMinutes,
  sampleRoutePoints,
  worstSeverity,
  type RouteRisk,
  type RouteRiskKind,
} from "@shared/routeWeather";
import type { HourlyWeather } from "@shared/weather";
import { pointsAlongRoute } from "@shared/routing";
import { routeOrEstimate } from "@/lib/routing";

type Status =
  "idle" | "locating" | "loading" | "ready" | "failed" | "noStart" | "tooShort";

type StartMode = "home" | "current";

interface Segment {
  lat: number;
  lon: number;
  /** Anteil der Strecke (0 = Start, 1 = Ziel). */
  fraction: number;
  etaMs: number;
  risk: RouteRisk | null;
  gustsKmh: number;
  precipitationMm: number;
}

const riskIcons: Record<RouteRiskKind, typeof Wind> = {
  gewitter: CloudLightning,
  sturm: Wind,
  regen: CloudRain,
  schnee: Snowflake,
};

/** «HH:MM» in der Sprache des Nutzers. */
function formatClock(ms: number, locale: string): string {
  return new Date(ms).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RouteWeather({
  latitude,
  longitude,
  placeName,
  className,
}: {
  latitude: number;
  longitude: number;
  placeName?: string | null;
  className?: string;
}) {
  const { lang, t } = useI18n();
  const tr = t.routeWeather;
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [startMode, setStartMode] = useState<StartMode>("home");
  const [departure, setDeparture] = useState(() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  });
  const [status, setStatus] = useState<Status>("idle");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [totalKm, setTotalKm] = useState(0);
  /** Kam die Strecke aus der Routenberechnung oder aus der Luftlinie? */
  const [estimated, setEstimated] = useState(false);
  /** Fahrzeit der ganzen Strecke in Minuten (Routendienst bzw. Schätzung). */
  const [totalMinutes, setTotalMinutes] = useState(0);
  /** Steckt in der Fahrzeit die Verkehrslage von Google? */
  const [withTraffic, setWithTraffic] = useState(false);
  const utils = trpc.useUtils();
  const abortRef = useRef<AbortController | null>(null);

  const homeQuery = trpc.home.get.useQuery(undefined, {
    enabled: isAuthenticated && open,
  });
  const home = homeQuery.data ?? null;

  useEffect(() => () => abortRef.current?.abort(), []);

  const currentPosition = useCallback(
    () =>
      new Promise<{ lat: number; lon: number } | null>(resolve => {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
          resolve(null);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          pos =>
            resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
        );
      }),
    []
  );

  const search = useCallback(
    async (mode: StartMode, departureLocal: string) => {
      let start: { lat: number; lon: number } | null = null;
      if (mode === "home") {
        start = home ? { lat: home.latitude, lon: home.longitude } : null;
      } else {
        setStatus("locating");
        start = await currentPosition();
      }
      if (!start) {
        setSegments([]);
        setStatus("noStart");
        return;
      }

      const end = { lat: latitude, lon: longitude };
      if (
        distanceMeters(start.lat, start.lon, end.lat, end.lon) / 1000 <
        MIN_ROUTE_KM
      ) {
        setSegments([]);
        setTotalKm(0);
        setStatus("tooShort");
        return;
      }

      // Echte Strassenroute holen: Die Stützstellen sollen dort liegen, wo
      // man wirklich fährt – im Gebirge holt die Strasse weit aus, und ein
      // Korridor auf der Luftlinie prüft dann das Wetter über dem Grat
      // statt über dem Tunnel.
      setStatus("loading");
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const route = await routeOrEstimate(
        [start, end],
        "car",
        ROUTE_SPEED_KMH,
        { signal: controller.signal }
      );
      const km = route.distanceM / 1000;
      setTotalKm(km);
      setEstimated(route.source === "estimate");
      const points =
        route.source === "route" && route.points.length >= 2
          ? pointsAlongRoute(route.points, MAX_ROUTE_WEATHER_POINTS)
          : sampleRoutePoints(corridorPoints(start, end));
      if (points.length < 2) {
        setSegments([]);
        setStatus("noStart");
        return;
      }
      // Fahrzeit des Routendienstes, sonst der Schnitt über die Strecke
      let totalMinutes =
        route.source === "route" ? route.durationS / 60 : routeMinutes(km);

      const departureMs = new Date(departureLocal).getTime();
      if (Number.isNaN(departureMs)) {
        setStatus("failed");
        return;
      }

      // Hier zählt die Fahrzeit doppelt: Sie bestimmt nicht nur, wie lange
      // man unterwegs ist, sondern WANN man an welchem Punkt ist – und
      // damit, welche Prognosestunde gelesen wird. Eine Stunde Stau
      // verschiebt die Gewitterzelle über dem Pass um eine Stunde.
      // Die Abfahrtszeit steht hier fest, also fragt Google nach dem
      // Verkehr GENAU DANN – Freitagabend ist nicht Dienstagmorgen.
      let traffic = false;
      try {
        const result = await utils.routing.driveTime.fetch({
          from: start,
          to: end,
          departureAtMs: departureMs > Date.now() ? departureMs : null,
        });
        if (result?.driveTime) {
          totalMinutes = result.driveTime.durationS / 60;
          traffic = true;
        }
      } catch {
        /* Kein Verkehrsdienst: die Fahrzeit von OSRM steht bereits */
      }
      setWithTraffic(traffic);
      setTotalMinutes(totalMinutes);

      try {
        // Eine Abfrage für alle Punkte: Open-Meteo nimmt Listen entgegen
        const params = new URLSearchParams({
          latitude: points.map(p => p.lat.toFixed(4)).join(","),
          longitude: points.map(p => p.lon.toFixed(4)).join(","),
          hourly:
            "precipitation,weather_code,wind_gusts_10m,temperature_2m,cloud_cover",
          timezone: "auto",
          forecast_days: "3",
        });
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error(`open-meteo ${res.status}`);
        const json: unknown = await res.json();
        // Bei mehreren Koordinaten antwortet Open-Meteo mit einem Array
        const list = Array.isArray(json) ? json : [json];

        const built: Segment[] = points.map((point, index) => {
          const fraction = index / (points.length - 1);
          const etaMs = departureMs + fraction * totalMinutes * 60_000;
          const entry = list[index] as
            { hourly?: Record<string, unknown[]> } | undefined;
          const times = (entry?.hourly?.time ?? []) as string[];
          const hours: HourlyWeather[] = times.map((time, i) => ({
            time,
            temperatureC: Number(entry?.hourly?.temperature_2m?.[i] ?? 0),
            apparentC: 0,
            precipitationMm: Number(entry?.hourly?.precipitation?.[i] ?? 0),
            precipitationProbability: 0,
            windSpeedKmh: 0,
            windGustsKmh: Number(entry?.hourly?.wind_gusts_10m?.[i] ?? 0),
            weatherCode: Number(entry?.hourly?.weather_code?.[i] ?? 0),
            cape: 0,
            cloudCover: Number(entry?.hourly?.cloud_cover?.[i] ?? 0),
          }));
          const hourIndex = hourIndexFor(hours, etaMs);
          const hour = hourIndex === null ? null : hours[hourIndex];
          return {
            lat: point.lat,
            lon: point.lon,
            fraction,
            etaMs,
            risk: hour ? hourRisk(hour) : null,
            gustsKmh: hour ? Math.round(hour.windGustsKmh) : 0,
            precipitationMm: hour ? hour.precipitationMm : 0,
          };
        });
        setSegments(built);
        setStatus("ready");
      } catch {
        if (controller.signal.aborted) return;
        setStatus("failed");
      }
    },
    [currentPosition, home, latitude, longitude, utils]
  );

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && status === "idle") void search(startMode, departure);
  };

  const worst = worstSeverity(segments.map(s => s.risk));
  const locale = LOCALE_TAGS[lang];

  return (
    <section
      className={cn("rounded-xl border border-border bg-card p-4", className)}
      aria-label={tr.sectionAria}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="route-weather"
        className="flex w-full items-center gap-2 text-left"
      >
        <RouteIcon className="h-4 w-4 text-primary" aria-hidden="true" />
        <span className="font-serif text-lg font-semibold">{tr.title}</span>
        <ChevronDown
          className={cn(
            "ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
      <p className="mt-1 text-sm text-muted-foreground">
        {placeName ? tr.subtitleAtPlace(placeName) : tr.subtitle}
      </p>

      {open && (
        <div id="route-weather">
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label={tr.startGroupAria}
            >
              {(["home", "current"] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setStartMode(mode);
                    void search(mode, departure);
                  }}
                  aria-pressed={startMode === mode}
                  disabled={status === "loading" || status === "locating"}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm transition-colors disabled:opacity-60",
                    startMode === mode
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {mode === "home" ? tr.startHome : tr.startCurrent}
                </button>
              ))}
            </div>
            <div>
              <Label htmlFor="route-departure" className="text-xs">
                {tr.departureLabel}
              </Label>
              <Input
                id="route-departure"
                type="datetime-local"
                value={departure}
                onChange={e => {
                  setDeparture(e.target.value);
                  void search(startMode, e.target.value);
                }}
                className="w-52"
              />
            </div>
          </div>

          {(status === "loading" || status === "locating") && (
            <div
              className="mt-3 space-y-2"
              aria-busy="true"
              aria-label={tr.loading}
            >
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          )}
          {status === "noStart" && (
            <p className="mt-3 text-sm text-muted-foreground">{tr.noStart}</p>
          )}
          {status === "tooShort" && (
            <p className="mt-3 text-sm text-muted-foreground">
              {tr.tooShort(MIN_ROUTE_KM)}
            </p>
          )}
          {status === "failed" && (
            <p className="mt-3 text-sm text-muted-foreground">
              {tr.loadFailed}
            </p>
          )}

          {status === "ready" && segments.length > 0 && (
            <>
              <p className="mt-3 text-sm font-medium">
                {tr.summary(
                  formatDistance(totalKm * 1000, lang),
                  Math.round(totalMinutes)
                )}
              </p>
              <p
                className={cn(
                  "mt-2 rounded-lg border p-3 text-sm",
                  worst === "gefahr"
                    ? "border-destructive/50 bg-destructive/10 text-destructive"
                    : worst === "warnung"
                      ? "border-amber-600/40 bg-amber-500/15 text-amber-800 dark:text-amber-300"
                      : "border-primary/40 bg-primary/10 text-primary"
                )}
              >
                {worst === null ? tr.allClear : tr.worstLine[worst]}
              </p>

              <ul className="mt-3 space-y-1.5">
                {segments.map(segment => {
                  const RiskIcon = segment.risk
                    ? riskIcons[segment.risk.kind]
                    : null;
                  return (
                    <li
                      key={segment.fraction}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm",
                        segment.risk?.severity === "gefahr"
                          ? "border-destructive/40 bg-destructive/5"
                          : segment.risk?.severity === "warnung"
                            ? "border-amber-600/30 bg-amber-500/5"
                            : "border-border bg-background"
                      )}
                    >
                      <span className="w-14 shrink-0 tabular-nums text-muted-foreground">
                        {formatClock(segment.etaMs, locale)}
                      </span>
                      <span className="w-16 shrink-0 text-xs text-muted-foreground">
                        {tr.kmMark(Math.round(totalKm * segment.fraction))}
                      </span>
                      <span className="flex min-w-0 flex-1 items-center gap-1.5">
                        {RiskIcon && (
                          <RiskIcon
                            className="h-4 w-4 shrink-0"
                            aria-hidden="true"
                          />
                        )}
                        <span className="truncate">
                          {segment.risk
                            ? tr.risk[segment.risk.kind]
                            : tr.riskNone}
                        </span>
                      </span>
                      {segment.gustsKmh >= 40 && (
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {tr.gusts(segment.gustsKmh)}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          <p className="mt-3 text-xs text-muted-foreground">
            {estimated
              ? tr.methodNoteEstimate(ROUTE_SPEED_KMH)
              : withTraffic
                ? tr.methodNoteTraffic
                : tr.methodNote}
          </p>
        </div>
      )}

      <p className="mt-3 text-xs text-muted-foreground">{tr.source}</p>
    </section>
  );
}
