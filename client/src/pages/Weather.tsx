import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  ChevronDown,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Droplets,
  Flame,
  Flower2,
  Info,
  LocateFixed,
  MapPin,
  RefreshCw,
  Search,
  Snowflake,
  Sun,
  Sunrise,
  Sunset,
  Tent,
  Wind,
  X,
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PageHeader from "@/components/PageHeader";
import RainRadar from "@/components/RainRadar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { searchPlaces, type PlaceResult } from "@/lib/placeSearch";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { LOCALE_TAGS } from "@shared/i18n";
import {
  describeUvIndex,
  describeWeatherCode,
  detectAlerts,
  type DailyWeather,
  type HourlyWeather,
  type UvLevel,
  type WeatherAlert,
} from "@shared/weather";
import {
  describePollenLevel,
  parsePollenResponse,
  pollenRequestUrl,
  pollenTypeName,
  type PollenLevel,
  type PollenReading,
} from "@shared/pollen";
import {
  describeFireDanger,
  fireDangerRequestUrl,
  parseFireDangerResponse,
  type FireDangerInfo,
  type FireDangerLevel,
} from "@shared/fireDanger";
import { wgs84ToLV95 } from "@/lib/sun";

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  sun: Sun,
  "cloud-sun": CloudSun,
  cloud: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: Snowflake,
  storm: CloudLightning,
};

function WeatherIcon({
  code,
  className,
}: {
  code: number;
  className?: string;
}) {
  const { icon } = describeWeatherCode(code);
  const Icon = icons[icon] ?? Cloud;
  return <Icon className={className} aria-hidden="true" />;
}

interface WeatherData {
  /** Stunden ab der aktuellen Stunde (für 24-h-Leiste, Regen-Grafik, Warnungen). */
  hourly: HourlyWeather[];
  /** Alle Stunden der 7 Prognosetage (0–24 Uhr, für das Tages-Detail). */
  hourlyAll: HourlyWeather[];
  daily: DailyWeather[];
  current: {
    temperatureC: number;
    apparentC: number;
    weatherCode: number;
    windKmh: number;
  };
  elevation: number;
}

type LoadState = "idle" | "locating" | "loading" | "ready" | "error";

/** HTTP-Fehler des Wetterdienstes – der Status wird im UI übersetzt angezeigt. */
class WeatherServiceError extends Error {
  constructor(public readonly status: number) {
    super(`weather service error ${status}`);
  }
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    timezone: "auto",
    forecast_days: "7",
    current: "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
    hourly:
      "temperature_2m,apparent_temperature,precipitation,precipitation_probability,wind_speed_10m,wind_gusts_10m,weather_code,cape,cloud_cover",
    daily:
      "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_gusts_10m_max,weather_code,sunrise,sunset,uv_index_max",
  });
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`
  );
  if (!res.ok) throw new WeatherServiceError(res.status);
  const json = await res.json();

  // Alle Stunden der 7 Prognosetage – das Tages-Detail braucht 0–24 Uhr
  const hourlyAll: HourlyWeather[] = (json.hourly.time as string[]).map(
    (time: string, i: number) => ({
      time,
      temperatureC: json.hourly.temperature_2m[i],
      apparentC: json.hourly.apparent_temperature[i],
      precipitationMm: json.hourly.precipitation[i],
      precipitationProbability: json.hourly.precipitation_probability?.[i] ?? 0,
      windSpeedKmh: json.hourly.wind_speed_10m[i],
      windGustsKmh: json.hourly.wind_gusts_10m[i],
      weatherCode: json.hourly.weather_code[i],
      cape: json.hourly.cape?.[i] ?? 0,
      cloudCover: json.hourly.cloud_cover?.[i] ?? 0,
    })
  );

  // Ab der aktuellen Stunde (lokale API-Zeit ist bereits Ortszeit durch timezone=auto)
  const nowLocalHour = hourlyAll.findIndex(
    h => new Date(h.time).getTime() >= Date.now() - 3600000
  );
  const hourlyFromNow =
    nowLocalHour >= 0 ? hourlyAll.slice(nowLocalHour) : hourlyAll;

  const daily: DailyWeather[] = (json.daily.time as string[]).map(
    (date: string, i: number) => ({
      date,
      tempMaxC: json.daily.temperature_2m_max[i],
      tempMinC: json.daily.temperature_2m_min[i],
      precipitationSumMm: json.daily.precipitation_sum[i],
      precipitationProbabilityMax:
        json.daily.precipitation_probability_max?.[i] ?? 0,
      windGustsMaxKmh: json.daily.wind_gusts_10m_max[i],
      weatherCode: json.daily.weather_code[i],
      sunrise: json.daily.sunrise[i],
      sunset: json.daily.sunset[i],
      uvIndexMax: json.daily.uv_index_max?.[i] ?? 0,
    })
  );

  return {
    hourly: hourlyFromNow,
    hourlyAll,
    daily,
    current: {
      temperatureC: json.current.temperature_2m,
      apparentC: json.current.apparent_temperature,
      weatherCode: json.current.weather_code,
      windKmh: json.current.wind_speed_10m,
    },
    elevation: json.elevation,
  };
}

/** Zweiter Ort für den Wetter-Vergleich – wird in localStorage gemerkt. */
interface ComparePlace {
  name: string;
  lat: number;
  lon: number;
}

const COMPARE_STORAGE_KEY = "campmesser.weatherCompareLocation";

function loadStoredComparePlace(): ComparePlace | null {
  try {
    const raw = localStorage.getItem(COMPARE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ComparePlace>;
    if (
      typeof parsed.name === "string" &&
      typeof parsed.lat === "number" &&
      Number.isFinite(parsed.lat) &&
      typeof parsed.lon === "number" &&
      Number.isFinite(parsed.lon)
    ) {
      return { name: parsed.name, lat: parsed.lat, lon: parsed.lon };
    }
  } catch {
    // defekter Eintrag – einfach ignorieren
  }
  return null;
}

function storeComparePlace(place: ComparePlace) {
  try {
    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(place));
  } catch {
    // Speicher voll/blockiert – der Vergleich funktioniert trotzdem
  }
}

/** Kompakte Tageszelle im Vergleich: Icon, Max/Min, Regen, Böen. */
function CompareDayCell({ day }: { day: DailyWeather | undefined }) {
  const { lang, t } = useI18n();
  if (!day) return <p className="text-xs text-muted-foreground">–</p>;
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-1.5">
        <WeatherIcon
          code={day.weatherCode}
          className="h-4 w-4 shrink-0 text-primary"
        />
        <span className="sr-only">
          {describeWeatherCode(day.weatherCode, lang).label}
        </span>
        <span className="whitespace-nowrap">
          <span className="font-semibold">{Math.round(day.tempMaxC)}°</span>
          <span className="text-muted-foreground">
            {" "}
            / {Math.round(day.tempMinC)}°
          </span>
        </span>
      </p>
      <p className="flex items-center gap-1 whitespace-nowrap text-xs text-chart-2">
        <Droplets className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span className="sr-only">{t.weather.compareSrRain}: </span>
        {day.precipitationSumMm.toFixed(1)} mm ·{" "}
        {Math.round(day.precipitationProbabilityMax)} %
      </p>
      <p className="flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground">
        <Wind className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span className="sr-only">{t.weather.compareSrWind}: </span>
        {Math.round(day.windGustsMaxKmh)} km/h
      </p>
    </div>
  );
}

/** Eigener Ladezustand für die Vergleichs-Prognose */
type CompareForecastState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; daily: DailyWeather[] };

/**
 * «Orte vergleichen»: zweiter Ort per Ortssuche oder gespeichertem Zeltplatz,
 * dann beide 7-Tage-Prognosen nebeneinander (Tabelle, mobil 2 Spalten).
 */
function CompareSection({
  baseLabel,
  baseDaily,
  spots,
  onClose,
}: {
  baseLabel: string;
  baseDaily: DailyWeather[];
  spots:
    | { id: number; name: string; latitude: number; longitude: number }[]
    | undefined;
  onClose: () => void;
}) {
  const { lang, t } = useI18n();
  const [place, setPlace] = useState<ComparePlace | null>(
    loadStoredComparePlace
  );
  const [editing, setEditing] = useState(place === null);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [results, setResults] = useState<PlaceResult[] | null>(null);
  const [forecast, setForecast] = useState<CompareForecastState>({
    status: "idle",
  });

  // Prognose des Vergleichsorts laden – gleicher Abruf wie die Hauptprognose
  useEffect(() => {
    if (!place) {
      setForecast({ status: "idle" });
      return;
    }
    let cancelled = false;
    setForecast({ status: "loading" });
    fetchWeather(place.lat, place.lon)
      .then(data => {
        if (!cancelled) setForecast({ status: "ready", daily: data.daily });
      })
      .catch(() => {
        if (!cancelled) setForecast({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [place]);

  const selectPlace = (next: ComparePlace) => {
    setPlace(next);
    storeComparePlace(next);
    setEditing(false);
    setQuery("");
    setResults(null);
    setSearchFailed(false);
  };

  const runSearch = async () => {
    const q = query.trim();
    if (q.length < 2 || searching) return;
    setSearching(true);
    setSearchFailed(false);
    setResults(null);
    try {
      setResults(await searchPlaces(q, lang));
    } catch {
      setSearchFailed(true);
    } finally {
      setSearching(false);
    }
  };

  return (
    <section aria-label={t.weather.compareAria} className="mt-6">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h2 className="font-serif text-lg font-semibold">
          {t.weather.compareTitle}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label={t.weather.compareCloseAria}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      <Card>
        <CardContent className="pt-5">
          {editing || !place ? (
            <>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  void runSearch();
                }}
              >
                <Label htmlFor="compare-search">
                  {t.weather.compareSearchLabel}
                </Label>
                <div className="mt-1.5 flex gap-2">
                  <Input
                    id="compare-search"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder={t.weather.compareSearchPlaceholder}
                    autoComplete="off"
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={searching || query.trim().length < 2}
                  >
                    <Search className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    {t.weather.compareSearchButton}
                  </Button>
                </div>
              </form>
              {searching && (
                <div
                  className="mt-3"
                  aria-busy="true"
                  aria-label={t.weather.compareSearchingAria}
                >
                  <Skeleton className="h-9 w-full rounded-lg" />
                </div>
              )}
              {searchFailed && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {t.weather.compareSearchFailed}
                </p>
              )}
              {!searching && results !== null && results.length === 0 && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {t.weather.compareNoResults}
                </p>
              )}
              {!searching && results !== null && results.length > 0 && (
                <ul
                  aria-label={t.weather.compareResultsAria}
                  className="mt-3 space-y-1.5"
                >
                  {results.map(r => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() =>
                          selectPlace({
                            name: r.name,
                            lat: r.latitude,
                            lon: r.longitude,
                          })
                        }
                        className="flex w-full items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-left text-sm transition-colors hover:border-primary/50"
                      >
                        <MapPin
                          className="h-3.5 w-3.5 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        <span className="font-medium">{r.name}</span>
                        {r.region && (
                          <span className="truncate text-xs text-muted-foreground">
                            {r.region}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {(spots?.length ?? 0) > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground">
                    {t.weather.compareSpotsLabel}
                  </p>
                  <div
                    className="mt-1.5 flex flex-wrap gap-2"
                    role="group"
                    aria-label={t.weather.compareSpotsLabel}
                  >
                    {spots!.map(spot => (
                      <button
                        key={spot.id}
                        type="button"
                        onClick={() =>
                          selectPlace({
                            name: spot.name,
                            lat: spot.latitude,
                            lon: spot.longitude,
                          })
                        }
                        className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50"
                      >
                        <Tent className="h-3.5 w-3.5" aria-hidden="true" />
                        {spot.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="flex min-w-0 items-center gap-1.5 text-sm font-medium">
                  <MapPin
                    className="h-3.5 w-3.5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span className="truncate">{place.name}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="shrink-0 text-xs font-medium text-primary hover:underline"
                >
                  {t.weather.compareChange}
                </button>
              </div>
              {forecast.status === "loading" && (
                <div
                  aria-busy="true"
                  aria-label={t.weather.compareLoadingAria}
                  className="space-y-2"
                >
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-40 w-full rounded-lg" />
                </div>
              )}
              {forecast.status === "error" && (
                <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  {t.weather.compareLoadFailed}
                  <button
                    type="button"
                    onClick={() => selectPlace(place)}
                    className="font-medium text-primary underline"
                  >
                    {t.weather.retry}
                  </button>
                </p>
              )}
              {forecast.status === "ready" && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <caption className="sr-only">
                      {t.weather.compareCaption(baseLabel, place.name)}
                    </caption>
                    <thead>
                      <tr className="border-b border-border/60 text-left">
                        <th
                          scope="col"
                          className="w-12 py-2 pr-2 text-xs font-medium text-muted-foreground"
                        >
                          {t.weather.compareDayHeader}
                        </th>
                        <th
                          scope="col"
                          className="py-2 pr-3 text-xs font-medium"
                        >
                          {baseLabel}
                        </th>
                        <th scope="col" className="py-2 text-xs font-medium">
                          {place.name}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {baseDaily.map((d, i) => (
                        <tr
                          key={d.date}
                          className="border-b border-border/40 align-top last:border-0"
                        >
                          <th
                            scope="row"
                            className="py-2.5 pr-2 text-left text-xs font-medium"
                          >
                            {i === 0
                              ? t.common.today
                              : new Date(d.date).toLocaleDateString(
                                  LOCALE_TAGS[lang],
                                  { weekday: "short", day: "numeric" }
                                )}
                          </th>
                          <td className="py-2.5 pr-3">
                            <CompareDayCell day={d} />
                          </td>
                          <td className="py-2.5">
                            <CompareDayCell
                              day={forecast.daily.find(x => x.date === d.date)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

const severityStyles = {
  gefahr: "border-destructive/50 bg-destructive/10 text-destructive",
  warnung: "border-chart-4/50 bg-chart-4/10 text-foreground",
  info: "border-border bg-secondary/60 text-foreground",
} as const;

const fireLevelStyles: Record<FireDangerLevel, string> = {
  1: "border-primary/30 bg-primary/5 text-foreground",
  2: "border-chart-4/50 bg-chart-4/10 text-foreground",
  3: "border-chart-1/60 bg-chart-1/10 text-foreground",
  4: "border-destructive/50 bg-destructive/10 text-destructive",
  5: "border-destructive bg-destructive/20 text-destructive",
};

// UV-Stufen (WHO-Skala) in dieselbe Farblogik wie die Waldbrand-Stufen übersetzen
const uvLevelStyles: Record<UvLevel, string> = {
  niedrig: "border-primary/30 bg-primary/5 text-foreground",
  maessig: "border-chart-4/50 bg-chart-4/10 text-foreground",
  hoch: "border-chart-1/60 bg-chart-1/10 text-foreground",
  sehrHoch: "border-destructive/50 bg-destructive/10 text-destructive",
  extrem: "border-destructive bg-destructive/20 text-destructive",
};

const pollenLevelStyles: Record<PollenLevel, string> = {
  keine: "border-border bg-secondary/60 text-foreground",
  gering: "border-primary/30 bg-primary/5 text-foreground",
  maessig: "border-chart-4/50 bg-chart-4/10 text-foreground",
  hoch: "border-chart-1/60 bg-chart-1/10 text-foreground",
  sehrHoch: "border-destructive/50 bg-destructive/10 text-destructive",
};

/** Eigener Ladezustand für den Pollenflug – ein Ausfall der
 *  Air-Quality-API darf die Wettervorhersage nicht brechen. */
type PollenState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "empty" }
  | { status: "ready"; readings: PollenReading[] };

export default function WeatherPage() {
  const { lang, t } = useI18n();
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    null
  );
  const [data, setData] = useState<WeatherData | null>(null);
  // Ausgewählter Ort: null = eigener Standort, sonst ID des Zeltplatz-Favoriten
  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [fireDanger, setFireDanger] = useState<FireDangerInfo | null>(null);
  const [pollen, setPollen] = useState<PollenState>({ status: "idle" });
  const [compareOpen, setCompareOpen] = useState(false);
  // Aufgeklappter Tag der 7-Tage-Vorschau (Datum) – nur einer gleichzeitig
  const [openDay, setOpenDay] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const { data: spots } = trpc.spots.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Waldbrandgefahr (offizielle BAFU-Warnkarte) für den gewählten Ort laden.
  // Nur innerhalb der Schweiz verfügbar – ausserhalb bleibt der Abschnitt ausgeblendet.
  useEffect(() => {
    setFireDanger(null);
    if (!coords) return;
    const lv95 = wgs84ToLV95(coords.lat, coords.lon);
    if (!lv95) return;
    let cancelled = false;
    fetch(fireDangerRequestUrl(lv95.east, lv95.north))
      .then(res => (res.ok ? res.json() : null))
      .then(json => {
        if (!cancelled) setFireDanger(parseFireDangerResponse(json));
      })
      .catch(() => {
        // Stilles Scheitern: Waldbrand-Info ist eine Zusatzinfo, kein Kern-Feature
      });
    return () => {
      cancelled = true;
    };
  }, [coords]);

  // Pollenflug (Open-Meteo Air-Quality-API) für den gewählten Ort laden.
  // Separater Zustand: schlägt der Abruf fehl, bleibt das Wetter unberührt.
  useEffect(() => {
    if (!coords) {
      setPollen({ status: "idle" });
      return;
    }
    let cancelled = false;
    setPollen({ status: "loading" });
    fetch(pollenRequestUrl(coords.lat, coords.lon))
      .then(res => (res.ok ? res.json() : Promise.reject(new Error())))
      .then(json => {
        if (cancelled) return;
        const readings = parsePollenResponse(json);
        setPollen(
          readings ? { status: "ready", readings } : { status: "empty" }
        );
      })
      .catch(() => {
        if (!cancelled) setPollen({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [coords]);

  const loadForCoords = async (lat: number, lon: number) => {
    setState("loading");
    setCoords({ lat, lon });
    setOpenDay(null);
    try {
      setData(await fetchWeather(lat, lon));
      setState("ready");
    } catch (e) {
      setState("error");
      setError(
        e instanceof WeatherServiceError
          ? t.weather.serviceError(e.status)
          : t.weather.loadFailed
      );
    }
  };

  const load = () => {
    setState("locating");
    setError(null);
    setSelectedSpotId(null);
    setLocationLabel(null);
    if (!navigator.geolocation) {
      setState("error");
      setError(t.weather.geoUnsupported);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords;
        await loadForCoords(latitude, longitude);
      },
      () => {
        setState("error");
        setError(t.weather.geoDenied);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const selectSpot = (spot: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
  }) => {
    setSelectedSpotId(spot.id);
    setLocationLabel(spot.name);
    setError(null);
    void loadForCoords(spot.latitude, spot.longitude);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const alerts: WeatherAlert[] = useMemo(
    () => (data ? detectAlerts(data.hourly, lang) : []),
    [data, lang]
  );
  const next24 = data?.hourly.slice(0, 24) ?? [];
  // Heutiger Max-UV (WHO-Skala) – Wert kommt aus demselben Forecast-Abruf
  const uvToday = data?.daily[0]?.uvIndexMax ?? null;
  const uvInfo = uvToday !== null ? describeUvIndex(uvToday, lang) : null;
  // Regen-Grafik: 48 h mit Menge und Wahrscheinlichkeit
  const rainData = useMemo(
    () =>
      (data?.hourly.slice(0, 48) ?? []).map(h => ({
        label: `${new Date(h.time).getHours()}:00`,
        mm: h.precipitationMm,
        prob: h.precipitationProbability,
      })),
    [data]
  );
  // Stundenverlauf des aufgeklappten Tages (0–24 Uhr, Zeit via LOCALE_TAGS)
  const openDayHours = useMemo(
    () =>
      data && openDay
        ? data.hourlyAll
            .filter(h => h.time.startsWith(openDay))
            .map(h => ({
              label: new Date(h.time).toLocaleTimeString(LOCALE_TAGS[lang], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              temp: h.temperatureC,
              mm: h.precipitationMm,
            }))
        : [],
    [data, openDay, lang]
  );

  return (
    <div className="container max-w-3xl py-6 md:py-8">
      <PageHeader title={t.weather.title} subtitle={t.weather.subtitle} />

      {/* Ortsauswahl: eigener Standort oder gespeicherte Zeltplatz-Favoriten */}
      {(spots?.length ?? 0) > 0 && (
        <div
          className="mb-4 flex flex-wrap items-center gap-2"
          role="group"
          aria-label={t.weather.locationGroupAria}
        >
          <button
            type="button"
            onClick={load}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              selectedSpotId === null
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/50"
            )}
          >
            <LocateFixed className="h-3.5 w-3.5" aria-hidden="true" />
            {t.weather.myLocation}
          </button>
          {spots!.map(spot => (
            <button
              key={spot.id}
              type="button"
              onClick={() => selectSpot(spot)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                selectedSpotId === spot.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50"
              )}
            >
              <Tent className="h-3.5 w-3.5" aria-hidden="true" />
              {spot.name}
            </button>
          ))}
        </div>
      )}

      {(state === "locating" || state === "loading") && (
        <div
          className="space-y-3"
          aria-busy="true"
          aria-label={t.weather.loadingAria}
        >
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      )}

      {state === "error" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertTriangle
              className="h-8 w-8 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={load} className="mt-1">
              <LocateFixed className="mr-2 h-4 w-4" aria-hidden="true" />
              {t.weather.retry}
            </Button>
            <p className="max-w-sm text-xs text-muted-foreground">
              {t.weather.offlineHint}
            </p>
          </CardContent>
        </Card>
      )}

      {state === "ready" && data && (
        <>
          {/* Aktuell */}
          <Card className="mb-4 overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {locationLabel ??
                      (coords
                        ? `${coords.lat.toFixed(3)}°, ${coords.lon.toFixed(3)}°`
                        : "")}{" "}
                    · {t.weather.elevation(Math.round(data.elevation))}
                  </p>
                  <p className="mt-1 font-serif text-4xl font-semibold">
                    {Math.round(data.current.temperatureC)}°
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t.weather.feelsLike(Math.round(data.current.apparentC))} ·{" "}
                    {describeWeatherCode(data.current.weatherCode, lang).label}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <WeatherIcon
                    code={data.current.weatherCode}
                    className="h-14 w-14 text-primary"
                  />
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Wind className="h-3.5 w-3.5" aria-hidden="true" />
                    {Math.round(data.current.windKmh)} km/h
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sunrise
                    className="h-4 w-4 text-chart-4"
                    aria-hidden="true"
                  />
                  {new Date(data.daily[0].sunrise).toLocaleTimeString(
                    LOCALE_TAGS[lang],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                  <Sunset
                    className="ml-3 h-4 w-4 text-chart-1"
                    aria-hidden="true"
                  />
                  {new Date(data.daily[0].sunset).toLocaleTimeString(
                    LOCALE_TAGS[lang],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={load}
                  aria-label={t.weather.refreshAria}
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Warnungen */}
          <section
            aria-label={t.weather.alertsAria}
            className="mb-6 space-y-2.5"
          >
            {alerts.length === 0 ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
                <Info
                  className="h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                {t.weather.noAlerts}
              </div>
            ) : (
              alerts.map(alert => (
                <div
                  key={alert.id}
                  className={cn(
                    "rounded-xl border px-4 py-3",
                    severityStyles[alert.severity]
                  )}
                  role={alert.severity === "gefahr" ? "alert" : undefined}
                >
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <AlertTriangle
                      className="h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    {alert.title}
                    <span className="ml-auto rounded-full bg-background/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                      {t.weather.severity[alert.severity]}
                    </span>
                  </p>
                  <p className="mt-1 text-sm">{alert.description}</p>
                  <p className="mt-1.5 text-xs opacity-90">{alert.advice}</p>
                </div>
              ))
            )}
          </section>

          {/* Waldbrandgefahr (nur Schweiz) */}
          {fireDanger && (
            <section aria-label={t.weather.fireAria} className="mb-6">
              <div
                className={cn(
                  "rounded-xl border px-4 py-3",
                  fireLevelStyles[fireDanger.level]
                )}
                role={fireDanger.level >= 4 ? "alert" : undefined}
              >
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Flame className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {t.weather.fireTitle(
                    describeFireDanger(fireDanger.level, lang).title
                  )}
                  <span className="ml-auto rounded-full bg-background/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                    {t.weather.fireLevelBadge(fireDanger.level)}
                  </span>
                </p>
                <p className="mt-1 text-sm">
                  {fireDanger.regionName}
                  {fireDanger.validFrom &&
                    ` · ${t.weather.fireValidFrom(fireDanger.validFrom)}`}
                </p>
                <p className="mt-1.5 text-xs opacity-90">
                  {describeFireDanger(fireDanger.level, lang).advice}
                </p>
                <p className="mt-1.5 text-xs opacity-75">
                  {t.weather.fireSourcePrefix}
                  <a
                    href="https://www.waldbrandgefahr.ch"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium underline"
                  >
                    waldbrandgefahr.ch
                  </a>
                  .
                </p>
              </div>
            </section>
          )}

          {/* UV-Index: heutiges Maximum mit WHO-Stufe und Schutzhinweis ab «hoch» */}
          {uvInfo && uvToday !== null && (
            <section aria-label={t.weather.uvAria} className="mb-6">
              <div
                className={cn(
                  "rounded-xl border px-4 py-3",
                  uvLevelStyles[uvInfo.level]
                )}
              >
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Sun className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {t.weather.uvTitle}
                  <span className="ml-auto rounded-full bg-background/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                    {uvInfo.label}
                  </span>
                </p>
                <p className="mt-1 text-sm">
                  {t.weather.uvTodayMax(Math.round(uvToday))}
                </p>
                {uvInfo.advice && (
                  <p className="mt-1.5 text-xs opacity-90">{uvInfo.advice}</p>
                )}
              </div>
            </section>
          )}

          {/* Pollenflug: aktuelle Belastung pro Art (eigener Ladezustand) */}
          {pollen.status !== "idle" && (
            <section aria-label={t.weather.pollenAria} className="mb-6">
              <h2 className="mb-2.5 font-serif text-lg font-semibold">
                {t.weather.pollenTitle}
              </h2>
              <Card>
                <CardContent className="pt-5">
                  {pollen.status === "loading" && (
                    <div
                      aria-busy="true"
                      aria-label={t.weather.pollenLoadingAria}
                    >
                      <Skeleton className="h-9 w-full rounded-lg" />
                    </div>
                  )}
                  {pollen.status === "error" && (
                    <p className="text-sm text-muted-foreground">
                      {t.weather.pollenUnavailable}
                    </p>
                  )}
                  {pollen.status === "empty" && (
                    <p className="text-sm text-muted-foreground">
                      {t.weather.pollenNoData}
                    </p>
                  )}
                  {pollen.status === "ready" && (
                    <>
                      <ul
                        className="flex flex-wrap gap-2"
                        aria-label={t.weather.pollenListAria}
                      >
                        {pollen.readings.map(r => (
                          <li key={r.type}>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium",
                                pollenLevelStyles[r.level]
                              )}
                            >
                              <Flower2
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                              {pollenTypeName(r.type, lang)}
                              <span className="rounded-full bg-background/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                                {describePollenLevel(r.level, lang)}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 text-xs text-muted-foreground">
                        {t.weather.pollenSource}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </section>
          )}

          {/* Stundenverlauf */}
          <h2 className="mb-2.5 font-serif text-lg font-semibold">
            {t.weather.next24}
          </h2>
          <div className="mb-6 overflow-x-auto rounded-xl border border-border/70 bg-card">
            <div className="flex min-w-max gap-0 px-2 py-3">
              {next24.map(h => (
                <div
                  key={h.time}
                  className="flex w-16 shrink-0 flex-col items-center gap-1 text-center"
                >
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(h.time).getHours()}:00
                  </p>
                  <WeatherIcon
                    code={h.weatherCode}
                    className="h-5 w-5 text-primary"
                  />
                  <p className="text-sm font-semibold">
                    {Math.round(h.temperatureC)}°
                  </p>
                  <p className="flex items-center gap-0.5 text-[10px] text-chart-2">
                    <Droplets className="h-3 w-3" aria-hidden="true" />
                    {Math.round(h.precipitationProbability)}%
                  </p>
                  <p className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <Wind className="h-3 w-3" aria-hidden="true" />
                    {Math.round(h.windGustsKmh)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Niederschlags-Grafik: wann genau kommt der Regen? */}
          <h2 className="mb-2.5 font-serif text-lg font-semibold">
            {t.weather.rain48}
          </h2>
          <Card className="mb-6">
            <CardContent className="pt-5">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={rainData}
                    margin={{ top: 4, right: -18, bottom: 0, left: -18 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border/60"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10 }}
                      interval="preserveStartEnd"
                      minTickGap={36}
                    />
                    <YAxis
                      yAxisId="mm"
                      domain={[0, (max: number) => Math.max(2, Math.ceil(max))]}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      yAxisId="prob"
                      orientation="right"
                      domain={[0, 100]}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) =>
                        name === t.weather.chartRain
                          ? [`${value.toFixed(1)} mm/h`, t.weather.chartRain]
                          : [`${Math.round(value)} %`, t.weather.chartProb]
                      }
                      labelFormatter={(label: string) =>
                        t.weather.chartTooltipHour(label)
                      }
                    />
                    <Bar
                      yAxisId="mm"
                      dataKey="mm"
                      name={t.weather.chartRain}
                      fill="var(--chart-2)"
                      fillOpacity={0.75}
                      isAnimationActive={false}
                    />
                    <Line
                      yAxisId="prob"
                      type="monotone"
                      dataKey="prob"
                      name={t.weather.chartProb}
                      stroke="var(--chart-4)"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t.weather.chartLegend}
              </p>
            </CardContent>
          </Card>

          {/* Regenradar: Leaflet-Karte mit RainViewer-Animation, lädt erst beim Aufklappen */}
          {coords && (
            <RainRadar
              key={`${coords.lat.toFixed(3)},${coords.lon.toFixed(3)}`}
              lat={coords.lat}
              lon={coords.lon}
            />
          )}

          {/* 7-Tage */}
          <h2 className="mb-2.5 font-serif text-lg font-semibold">
            {t.weather.forecast7}
          </h2>
          <Card>
            <CardContent className="divide-y divide-border/60 pt-2">
              {data.daily.map((d, i) => {
                const dayLabel =
                  i === 0
                    ? t.common.today
                    : new Date(d.date).toLocaleDateString(LOCALE_TAGS[lang], {
                        weekday: "short",
                        day: "numeric",
                      });
                const isOpen = openDay === d.date;
                return (
                  <div key={d.date}>
                    <button
                      type="button"
                      onClick={() => setOpenDay(isOpen ? null : d.date)}
                      aria-expanded={isOpen}
                      aria-controls={`day-hours-${d.date}`}
                      aria-label={t.weather.dayToggleAria(dayLabel)}
                      className="flex w-full items-center gap-3 py-2.5 text-left"
                    >
                      <p className="w-16 text-sm font-medium">{dayLabel}</p>
                      <WeatherIcon
                        code={d.weatherCode}
                        className="h-5 w-5 shrink-0 text-primary"
                      />
                      <p className="flex w-14 items-center gap-1 text-xs text-chart-2">
                        <Droplets
                          className="h-3 w-3 shrink-0"
                          aria-hidden="true"
                        />
                        {Math.round(d.precipitationProbabilityMax)}%
                      </p>
                      <p className="hidden w-16 items-center gap-1 text-xs text-muted-foreground sm:flex">
                        <Wind className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {Math.round(d.windGustsMaxKmh)} km/h
                      </p>
                      <p className="ml-auto text-sm">
                        <span className="font-semibold">
                          {Math.round(d.tempMaxC)}°
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          / {Math.round(d.tempMinC)}°
                        </span>
                      </p>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                          isOpen && "rotate-180"
                        )}
                        aria-hidden="true"
                      />
                    </button>
                    {isOpen && (
                      <div id={`day-hours-${d.date}`} className="pb-3">
                        {openDayHours.length > 0 ? (
                          <>
                            <div className="h-40 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart
                                  data={openDayHours}
                                  margin={{
                                    top: 4,
                                    right: -18,
                                    bottom: 0,
                                    left: -18,
                                  }}
                                >
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    className="stroke-border/60"
                                  />
                                  <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 10 }}
                                    interval="preserveStartEnd"
                                    minTickGap={28}
                                  />
                                  <YAxis
                                    yAxisId="temp"
                                    tick={{ fontSize: 10 }}
                                  />
                                  <YAxis
                                    yAxisId="mm"
                                    orientation="right"
                                    domain={[
                                      0,
                                      (max: number) =>
                                        Math.max(2, Math.ceil(max)),
                                    ]}
                                    tick={{ fontSize: 10 }}
                                  />
                                  <Tooltip
                                    formatter={(value: number, name: string) =>
                                      name === t.weather.chartRain
                                        ? [
                                            `${value.toFixed(1)} mm/h`,
                                            t.weather.chartRain,
                                          ]
                                        : [
                                            `${Math.round(value)} °C`,
                                            t.weather.chartTemp,
                                          ]
                                    }
                                  />
                                  <Bar
                                    yAxisId="mm"
                                    dataKey="mm"
                                    name={t.weather.chartRain}
                                    fill="var(--chart-2)"
                                    fillOpacity={0.75}
                                    isAnimationActive={false}
                                  />
                                  <Line
                                    yAxisId="temp"
                                    type="monotone"
                                    dataKey="temp"
                                    name={t.weather.chartTemp}
                                    stroke="var(--chart-1)"
                                    strokeWidth={2}
                                    dot={false}
                                    isAnimationActive={false}
                                  />
                                </ComposedChart>
                              </ResponsiveContainer>
                            </div>
                            <p className="mt-1.5 text-xs text-muted-foreground">
                              {t.weather.hourlyLegend}
                            </p>
                            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <Wind
                                className="h-3 w-3 shrink-0"
                                aria-hidden="true"
                              />
                              {t.weather.dayWindPeak(
                                Math.round(d.windGustsMaxKmh)
                              )}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {t.weather.dayHoursEmpty}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Orte vergleichen: 7-Tage-Prognosen zweier Orte nebeneinander */}
          {compareOpen ? (
            <CompareSection
              baseLabel={locationLabel ?? t.weather.myLocation}
              baseDaily={data.daily}
              spots={spots}
              onClose={() => setCompareOpen(false)}
            />
          ) : (
            <Button
              variant="outline"
              className="mt-4 w-full sm:w-auto"
              onClick={() => setCompareOpen(true)}
            >
              <ArrowLeftRight className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.weather.compareButton}
            </Button>
          )}

          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            {t.weather.dataSource}
          </p>
        </>
      )}
    </div>
  );
}
