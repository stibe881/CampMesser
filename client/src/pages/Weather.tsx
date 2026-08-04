import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  ChevronDown,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  Bug,
  CloudSun,
  Droplets,
  Flame,
  Flower2,
  Home,
  Info,
  LocateFixed,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Snowflake,
  Star,
  Sun,
  Sunrise,
  Sunset,
  Tent,
  TrendingDown,
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
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { searchPlaces, type PlaceResult } from "@/lib/placeSearch";
import { trpc } from "@/lib/trpc";
import { useSyncedSetting } from "@/lib/useSyncedSetting";
import {
  LAST_WEATHER_PLACE_KEY,
  MAX_WEATHER_PLACES,
  WEATHER_PLACES_KEY,
  addWeatherPlace,
  isSameWeatherPlace,
  removeWeatherPlace,
  sanitizeWeatherPlace,
  sanitizeWeatherPlaces,
  type WeatherPlace,
} from "@/lib/weatherPlaces";
import { cn } from "@/lib/utils";
import { heatAdvice } from "@shared/heatCare";
import {
  eveningMosquitoIndex,
  mosquitoAdvice,
  mosquitoLevelLabel,
} from "@shared/mosquito";
import { LOCALE_TAGS } from "@shared/i18n";
import {
  describeUvIndex,
  describeWeatherCode,
  detectAlerts,
  nextRainWindow,
  pressureTrend,
  PRESSURE_STRONG_HPA,
  type DailyWeather,
  type HourlyWeather,
  type RainSlot,
  type UvLevel,
  type WeatherAlert,
} from "@shared/weather";
import {
  describePollenLevel,
  parsePollenResponse,
  pollenRequestUrl,
  pollenTypeName,
  POLLEN_TYPES,
  type PollenLevel,
  type PollenReading,
  type PollenType,
} from "@shared/pollen";
import {
  loadPollenProfile,
  sanitizePollenProfile,
  sortPollenReadings,
  storePollenProfile,
  togglePollenType,
} from "@/lib/pollenProfile";
import {
  describeFireDanger,
  fireDangerRequestUrl,
  parseFireDangerResponse,
  type FireDangerInfo,
  type FireDangerLevel,
} from "@shared/fireDanger";
import { compassDirection } from "@shared/solar";
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

/** Schrittweite der Wind-Leiste im Tages-Detail: jede dritte Stunde. */
const WIND_ROW_STEP = 3;

/**
 * Pfeil der Windrichtung. Meteorologisch wird die Richtung angegeben, AUS der
 * der Wind kommt – der Pfeil soll aber zeigen, WOHIN er weht: deshalb + 180°.
 * Die Basis-Grafik zeigt nach oben (Norden).
 */
function WindArrow({ deg, className }: { deg: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      style={{ transform: `rotate(${(deg + 180) % 360}deg)` }}
    >
      <path
        d="M12 3 L12 21 M12 3 L7 9.5 M12 3 L17 9.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Wind-Leiste unter dem Stunden-Chart des aufgeklappten Tages: alle drei
 * Stunden ein Richtungspfeil plus die Böenspitze in km/h. Für Screenreader
 * steht pro Eintrag ein sr-only-Satz mit ausgeschriebener Himmelsrichtung.
 */
function DayWindRow({
  hours,
}: {
  hours: {
    label: string;
    gustsKmh: number;
    windDirectionDeg: number | undefined;
  }[];
}) {
  const { lang, t } = useI18n();
  const picks = hours.filter((_, i) => i % WIND_ROW_STEP === 0);
  if (picks.length === 0) return null;
  return (
    <div className="mt-2">
      <div className="overflow-x-auto">
        <ul
          className="flex min-w-max gap-2.5"
          aria-label={t.weather.windRowAria}
        >
          {picks.map(h => (
            <li
              key={h.label}
              className="flex w-12 shrink-0 flex-col items-center gap-0.5 text-center"
            >
              <span className="text-[10px] text-muted-foreground">
                {h.label}
              </span>
              {typeof h.windDirectionDeg === "number" ? (
                <WindArrow
                  deg={h.windDirectionDeg}
                  className="h-3.5 w-3.5 text-primary"
                />
              ) : (
                <Wind className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              )}
              <span className="text-[11px] font-medium tabular-nums">
                {Math.round(h.gustsKmh)}
              </span>
              <span className="sr-only">
                {typeof h.windDirectionDeg === "number"
                  ? t.weather.windSrHour(
                      h.label,
                      compassDirection(h.windDirectionDeg, lang),
                      Math.round(h.gustsKmh)
                    )
                  : t.weather.windSrHourNoDir(h.label, Math.round(h.gustsKmh))}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {t.weather.windRowLegend}
      </p>
    </div>
  );
}

interface WeatherData {
  /** Stunden ab der aktuellen Stunde (für 24-h-Leiste, Regen-Grafik, Warnungen). */
  hourly: HourlyWeather[];
  /** Alle Stunden der ersten 7 Prognosetage (0–24 Uhr, für das Tages-Detail). */
  hourlyAll: HourlyWeather[];
  /** 16 Prognosetage: Tag 1–7 für die Detail-Ansicht, Tag 8+ als Ausblick. */
  daily: DailyWeather[];
  /** 15-Minuten-Regenprognose ab der aktuellen Viertelstunde (~4 h). */
  minutely: RainSlot[];
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
    // 16 Tage für den «Woche 2»-Ausblick. Die Stundendaten kommen dabei
    // ebenfalls für 16 Tage mit – ein serverseitiges Begrenzen per
    // forecast_hours=168 würde die Stunden aber an der AKTUELLEN Stunde
    // statt um Mitternacht starten lassen und so das Tages-Detail (0–24 Uhr)
    // brechen. Deshalb: ein Abruf, und unten werden die Stunden clientseitig
    // auf die ersten 7 Tage beschnitten.
    forecast_days: "16",
    // Regen-Kurzfrist: 15-Minuten-Niederschlag im selben Abruf.
    // forecast_minutely_15 beginnt (anders als forecast_hours) bei der
    // AKTUELLEN Viertelstunde – 16 Slots reichen für den 2-h-Hinweis.
    minutely_15: "precipitation",
    forecast_minutely_15: "16",
    current: "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
    hourly:
      "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,precipitation_probability,wind_speed_10m,wind_gusts_10m,wind_direction_10m,pressure_msl,weather_code,cape,cloud_cover",
    daily:
      "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_gusts_10m_max,weather_code,sunrise,sunset,uv_index_max",
  });
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`
  );
  if (!res.ok) throw new WeatherServiceError(res.status);
  const json = await res.json();

  // Alle Stunden der ersten 7 Prognosetage – das Tages-Detail braucht 0–24 Uhr.
  // Der Ausblick (Tag 8+) kommt bewusst ohne Stunden-Detail aus, deshalb
  // werden die restlichen Stunden gleich verworfen (ISO-Datumsvergleich).
  const lastDetailDate = (json.daily.time as string[])[6] ?? "9999-12-31";
  const hourlyAll: HourlyWeather[] = (json.hourly.time as string[])
    .map((time: string, i: number) => ({
      time,
      temperatureC: json.hourly.temperature_2m[i],
      apparentC: json.hourly.apparent_temperature[i],
      precipitationMm: json.hourly.precipitation[i],
      precipitationProbability: json.hourly.precipitation_probability?.[i] ?? 0,
      windSpeedKmh: json.hourly.wind_speed_10m[i],
      windGustsKmh: json.hourly.wind_gusts_10m[i],
      windDirectionDeg: json.hourly.wind_direction_10m?.[i] ?? undefined,
      pressureHpa: json.hourly.pressure_msl?.[i] ?? undefined,
      weatherCode: json.hourly.weather_code[i],
      cape: json.hourly.cape?.[i] ?? 0,
      cloudCover: json.hourly.cloud_cover?.[i] ?? 0,
      humidityPercent: json.hourly.relative_humidity_2m?.[i] ?? undefined,
    }))
    .filter(h => h.time.slice(0, 10) <= lastDetailDate);

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

  // 15-Minuten-Slots defensiv lesen – nicht jede Region liefert minutely_15
  const minutely: RainSlot[] = (
    (json.minutely_15?.time as string[] | undefined) ?? []
  ).map((time: string, i: number) => ({
    time,
    precipitationMm: json.minutely_15.precipitation?.[i] ?? 0,
  }));

  return {
    hourly: hourlyFromNow,
    hourlyAll,
    daily,
    minutely,
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

/** Gespeicherte Wetter-Orte laden (defensiv – kaputte Daten werden bereinigt). */
function loadStoredWeatherPlaces(): WeatherPlace[] {
  try {
    const raw = localStorage.getItem(WEATHER_PLACES_KEY);
    return raw ? sanitizeWeatherPlaces(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

function storeWeatherPlaces(places: WeatherPlace[]) {
  try {
    localStorage.setItem(WEATHER_PLACES_KEY, JSON.stringify(places));
  } catch {
    // Speicher voll/blockiert – die Chips leben dann nur diese Sitzung
  }
}

/** Zuletzt gewählten Wetter-Ort laden – null = eigener Standort. */
function loadLastWeatherPlace(): WeatherPlace | null {
  try {
    const raw = localStorage.getItem(LAST_WEATHER_PLACE_KEY);
    return raw ? sanitizeWeatherPlace(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

/** Zuletzt gewählten Wetter-Ort merken bzw. (null) wieder vergessen. */
function storeLastWeatherPlace(place: WeatherPlace | null) {
  try {
    if (place) {
      localStorage.setItem(LAST_WEATHER_PLACE_KEY, JSON.stringify(place));
    } else {
      localStorage.removeItem(LAST_WEATHER_PLACE_KEY);
    }
  } catch {
    // Speicher blockiert – dann startet die Seite eben mit dem Standort
  }
}

/**
 * Ortssuche für die Wetter-Favoriten: gleiche Geocoding-Suche wie der
 * Vergleich – ein Klick auf ein Resultat speichert den Ort (Stern) und
 * zeigt sofort sein Wetter.
 */
function PlaceSearch({
  onPick,
  onClose,
}: {
  onPick: (place: WeatherPlace) => void;
  onClose: () => void;
}) {
  const { lang, t } = useI18n();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [results, setResults] = useState<PlaceResult[] | null>(null);

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
    <Card className="mb-4">
      <CardContent className="pt-5">
        <form
          onSubmit={e => {
            e.preventDefault();
            void runSearch();
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="weather-place-search">
              {t.weather.placeSearchLabel}
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label={t.weather.placeSearchCloseAria}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          <div className="mt-1.5 flex gap-2">
            <Input
              id="weather-place-search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t.weather.placeSearchPlaceholder}
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
          <>
            <ul
              aria-label={t.weather.compareResultsAria}
              className="mt-3 space-y-1.5"
            >
              {results.map(r => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() =>
                      onPick({
                        name: r.name,
                        lat: r.latitude,
                        lon: r.longitude,
                      })
                    }
                    className="flex w-full items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-left text-sm transition-colors hover:border-primary/50"
                  >
                    <Star
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
            <p className="mt-2 text-xs text-muted-foreground">
              {t.weather.placeResultsHint}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
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

/** Obergrenze paralleler Warn-Prüfungen in «Deine Plätze». */
const MAX_PLACE_CHECKS = 8;

/**
 * Sitzungs-Cache der Stundenprognosen pro Koordinate: die Übersicht lädt
 * jeden Ort höchstens einmal pro Seitenaufruf, egal wie oft sie auf- und
 * zugeklappt wird. Warnungen werden beim Rendern sprachrichtig abgeleitet.
 */
const placeHoursCache = new Map<string, HourlyWeather[]>();

interface PlaceCheck {
  key: string;
  name: string;
  lat: number;
  lon: number;
  /** null = Heim-Ort, sonst ID des Zeltplatz-Favoriten */
  spotId: number | null;
  /** null = Abruf fehlgeschlagen */
  hours: HourlyWeather[] | null;
}

/**
 * «Deine Plätze»: prüft für gespeicherte Zeltplätze und den Heim-Ort
 * parallel die aktuellen Unwetterwarnungen – geladen wird erst beim
 * Aufklappen, begrenzt auf MAX_PLACE_CHECKS Orte. Ein Klick auf eine
 * Zeile wählt den Ort in der Hauptansicht aus.
 */
function YourPlacesSection({
  spots,
  onSelect,
}: {
  spots:
    | { id: number; name: string; latitude: number; longitude: number }[]
    | undefined;
  onSelect: (place: {
    name: string;
    lat: number;
    lon: number;
    spotId: number | null;
  }) => void;
}) {
  const { lang, t } = useI18n();
  const [open, setOpen] = useState(false);
  // Heim-Ort erst beim Aufklappen abfragen – vorher braucht ihn niemand
  const homeQuery = trpc.home.get.useQuery(undefined, { enabled: open });
  const homeSettled = homeQuery.isSuccess || homeQuery.isError;
  const home = homeQuery.data ?? null;
  const [checks, setChecks] = useState<PlaceCheck[] | null>(null);

  useEffect(() => {
    if (!open || !homeSettled) return;
    const list: Omit<PlaceCheck, "hours">[] = [];
    if (home) {
      list.push({
        key: "home",
        name: home.name,
        lat: home.latitude,
        lon: home.longitude,
        spotId: null,
      });
    }
    (spots ?? []).forEach(spot => {
      if (Number.isFinite(spot.latitude) && Number.isFinite(spot.longitude)) {
        list.push({
          key: `spot-${spot.id}`,
          name: spot.name,
          lat: spot.latitude,
          lon: spot.longitude,
          spotId: spot.id,
        });
      }
    });
    const limited = list.slice(0, MAX_PLACE_CHECKS);
    let cancelled = false;
    setChecks(null);
    void Promise.all(
      limited.map(async place => {
        const cacheKey = `${place.lat.toFixed(4)},${place.lon.toFixed(4)}`;
        const cached = placeHoursCache.get(cacheKey);
        if (cached) return { ...place, hours: cached };
        try {
          const data = await fetchWeather(place.lat, place.lon);
          placeHoursCache.set(cacheKey, data.hourly);
          return { ...place, hours: data.hourly };
        } catch {
          return { ...place, hours: null };
        }
      })
    ).then(results => {
      if (!cancelled) setChecks(results);
    });
    return () => {
      cancelled = true;
    };
  }, [open, homeSettled, home, spots]);

  return (
    <section aria-label={t.weather.placesAria} className="mb-6">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="mb-2.5 flex w-full items-center justify-between gap-2 text-left"
      >
        <h2 className="font-serif text-lg font-semibold">
          {t.weather.placesTitle}
        </h2>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
      {open && (
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">
              {t.weather.placesIntro}
            </p>
            {!homeSettled || checks === null ? (
              <div
                className="mt-3 space-y-2"
                aria-busy="true"
                aria-label={t.weather.placesLoadingAria}
              >
                <Skeleton className="h-9 w-full rounded-lg" />
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            ) : checks.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {t.weather.placesEmpty}
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-border/60">
                {checks.map(place => {
                  const alerts = place.hours
                    ? detectAlerts(place.hours, lang)
                    : null;
                  const PlaceIcon = place.spotId !== null ? Tent : Home;
                  return (
                    <li key={place.key}>
                      <button
                        type="button"
                        onClick={() => onSelect(place)}
                        aria-label={t.weather.placesSelectAria(place.name)}
                        className="flex w-full flex-wrap items-center gap-x-2 gap-y-1.5 py-2.5 text-left text-sm"
                      >
                        <PlaceIcon
                          className="h-4 w-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1 truncate font-medium">
                          {place.name}
                        </span>
                        {alerts === null ? (
                          <span className="text-xs text-muted-foreground">
                            {t.weather.placesCheckFailed}
                          </span>
                        ) : alerts.length === 0 ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-primary">
                            <CheckCircle2
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            {t.weather.placesNoAlert}
                          </span>
                        ) : (
                          <span className="flex flex-wrap items-center gap-1.5">
                            {alerts.map(alert => (
                              <span
                                key={alert.id}
                                className={cn(
                                  "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                                  severityStyles[alert.severity]
                                )}
                              >
                                {alert.title}
                              </span>
                            ))}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </section>
  );
}

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
  // Ausgewählter Wetter-Favorit (per Ortssuche gespeicherter Ort)
  const [selectedPlace, setSelectedPlace] = useState<WeatherPlace | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  // Gespeicherte Wetter-Orte (localStorage + Geräte-Sync)
  const [places, setPlaces] = useState<WeatherPlace[]>(loadStoredWeatherPlaces);
  const [placeSearchOpen, setPlaceSearchOpen] = useState(false);
  const [fireDanger, setFireDanger] = useState<FireDangerInfo | null>(null);
  const [pollen, setPollen] = useState<PollenState>({ status: "idle" });
  // Allergie-Profil (localStorage + Geräte-Sync) und der Nur-meine-Arten-Filter.
  // Der Filter bleibt bewusst Sitzungs-Zustand – gespeichert wird nur die Auswahl.
  const [pollenProfile, setPollenProfile] =
    useState<PollenType[]>(loadPollenProfile);
  const [onlyMyPollen, setOnlyMyPollen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  // Aufgeklappter Tag der 7-Tage-Vorschau (Datum) – nur einer gleichzeitig
  const [openDay, setOpenDay] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const { data: spots } = trpc.spots.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Geräte-Sync: Wetter-Orte vom Konto übernehmen bzw. Änderungen hochladen
  const placesSync = useSyncedSetting<WeatherPlace[]>(
    "weatherPlaces",
    value => {
      const clean = sanitizeWeatherPlaces(value);
      setPlaces(clean);
      storeWeatherPlaces(clean);
    }
  );

  const savePlaces = (next: WeatherPlace[]) => {
    setPlaces(next);
    storeWeatherPlaces(next);
    placesSync.push(next);
  };

  // Geräte-Sync des Allergie-Profils (Muster weatherPlaces)
  const pollenSync = useSyncedSetting<PollenType[]>("pollenProfile", value => {
    const clean = sanitizePollenProfile(value);
    setPollenProfile(clean);
    storePollenProfile(clean);
  });

  /** Pollenart an-/abwählen und die Auswahl lokal wie im Konto sichern. */
  const togglePollenProfileType = (type: PollenType) => {
    const next = togglePollenType(pollenProfile, type);
    setPollenProfile(next);
    storePollenProfile(next);
    pollenSync.push(next);
    if (next.length === 0) setOnlyMyPollen(false);
  };

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
    setSelectedPlace(null);
    setLocationLabel(null);
    storeLastWeatherPlace(null);
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
    setSelectedPlace(null);
    setLocationLabel(spot.name);
    setError(null);
    storeLastWeatherPlace(null);
    void loadForCoords(spot.latitude, spot.longitude);
  };

  /** Gespeicherten Wetter-Ort anzeigen und als «zuletzt gewählt» merken. */
  const selectPlace = (place: WeatherPlace) => {
    setSelectedSpotId(null);
    setSelectedPlace(place);
    setLocationLabel(place.name);
    setError(null);
    storeLastWeatherPlace(place);
    void loadForCoords(place.lat, place.lon);
  };

  /** Suchresultat übernehmen: Ort speichern (Stern) und sofort anzeigen. */
  const pickSearchResult = (place: WeatherPlace) => {
    const next = addWeatherPlace(places, place);
    if (next) savePlaces(next);
    setPlaceSearchOpen(false);
    const saved = sanitizeWeatherPlace(place);
    if (saved) selectPlace(saved);
  };

  /** Klick in «Deine Plätze»: Ort in der Hauptansicht anzeigen. */
  const selectOverviewPlace = (place: {
    name: string;
    lat: number;
    lon: number;
    spotId: number | null;
  }) => {
    setSelectedSpotId(place.spotId);
    setSelectedPlace(null);
    setLocationLabel(place.name);
    setError(null);
    storeLastWeatherPlace(null);
    void loadForCoords(place.lat, place.lon);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /** Stern entfernen – ein gerade angezeigter Ort bleibt sichtbar. */
  const removePlace = (place: WeatherPlace) => {
    savePlaces(removeWeatherPlace(places, place));
    if (selectedPlace && isSameWeatherPlace(selectedPlace, place)) {
      setSelectedPlace(null);
      storeLastWeatherPlace(null);
    }
  };

  useEffect(() => {
    // Zuletzt gewählter Wetter-Favorit gewinnt beim Start – sonst Standort
    const last = loadLastWeatherPlace();
    if (last) {
      setSelectedPlace(last);
      setLocationLabel(last.name);
      void loadForCoords(last.lat, last.lon);
    } else {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const alerts: WeatherAlert[] = useMemo(
    () => (data ? detectAlerts(data.hourly, lang) : []),
    [data, lang]
  );

  // Aus dem Unwetter-Badge der Startseite kommt man mit #warnungen hierher –
  // der Abschnitt existiert erst, wenn die Prognose da ist, deshalb erst dann
  // (und genau einmal) hinscrollen.
  const alertsScrolledRef = useRef(false);
  useEffect(() => {
    if (alertsScrolledRef.current || !data) return;
    if (window.location.hash !== "#warnungen") return;
    const section = document.getElementById("warnungen");
    if (!section) return;
    alertsScrolledRef.current = true;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [data]);
  // Regen-Kurzfrist-Hinweis: nur zeigen, wenn Regen innerhalb der nächsten
  // 2 Stunden beginnt oder aufhört – sonst bleibt die Zeile weg.
  const rainNotice = useMemo(() => {
    if (!data) return null;
    const now = new Date();
    const window = nextRainWindow(data.minutely, now);
    if (!window) return null;
    const limit = now.getTime() + 2 * 3600000;
    if (
      !window.ongoing &&
      window.startsAt &&
      new Date(window.startsAt).getTime() <= limit
    ) {
      return { kind: "start" as const, time: new Date(window.startsAt) };
    }
    if (
      window.ongoing &&
      window.endsAt &&
      new Date(window.endsAt).getTime() <= limit
    ) {
      return { kind: "end" as const, time: new Date(window.endsAt) };
    }
    return null;
  }, [data]);
  // Luftdruck-Trend: als Frühindikator zeigen wir bewusst nur FALLENDEN Druck
  // (steigender oder gleichbleibender Druck braucht keinen Hinweis).
  const pressureNotice = useMemo(() => {
    if (!data) return null;
    const trend = pressureTrend(data.hourly, new Date());
    if (!trend || trend.direction !== "falling") return null;
    return {
      strong: trend.hPaPer3h <= -PRESSURE_STRONG_HPA,
      hPa: Math.abs(trend.hPaPer3h).toFixed(1),
    };
  }, [data]);
  // Pollen-Anzeige: eigene Arten zuerst, auf Wunsch nur diese
  const visiblePollenReadings = useMemo(() => {
    if (pollen.status !== "ready") return [];
    const sorted = sortPollenReadings(pollen.readings, pollenProfile);
    return onlyMyPollen && pollenProfile.length > 0
      ? sorted.filter(r => pollenProfile.includes(r.type))
      : sorted;
  }, [pollen, pollenProfile, onlyMyPollen]);
  const next24 = data?.hourly.slice(0, 24) ?? [];
  // Heutiger Max-UV (WHO-Skala) – Wert kommt aus demselben Forecast-Abruf
  const uvToday = data?.daily[0]?.uvIndexMax ?? null;
  const uvInfo = uvToday !== null ? describeUvIndex(uvToday, lang) : null;
  // Sonnencreme & Trinken (#260/#261): dieselbe Rechnung wie in der
  // Push-Erinnerung, damit Anzeige und Mitteilung nie auseinanderlaufen.
  const heatToday = heatAdvice(uvToday ?? 0, data?.daily[0]?.tempMaxC ?? 0);
  /**
   * Stechmücken-Index (#262) für den kommenden Abend: die schlechteste
   * Stunde zwischen 18 und 23 Uhr, weil die Dämmerung die Hauptflugzeit
   * ist. Der Regen der letzten Tage steckt als Brut-Faktor drin – hier
   * ersatzweise die Summe der vergangenen 48 Prognose-Stunden, weil das
   * Wetter-Modul keine Vergangenheit lädt.
   */
  const mosquitoTonight = useMemo(() => {
    if (!data) return null;
    const rain48 = data.hourly
      .slice(0, 48)
      .reduce((sum, h) => sum + (h.precipitationMm || 0), 0);
    const hours = data.hourly
      .slice(0, 24)
      .filter(h => h.humidityPercent !== undefined)
      .map(h => ({
        hour: new Date(h.time).getHours(),
        temperatureC: h.temperatureC,
        humidityPercent: h.humidityPercent ?? 0,
        windKmh: h.windSpeedKmh,
        recentRainMm: rain48,
      }));
    return eveningMosquitoIndex(hours);
  }, [data]);

  /** Dezimaltrennzeichen der aktiven Sprache («3.5 l» bzw. «3,5 l»). */
  const decimalSeparator = (1.1).toLocaleString(LOCALE_TAGS[lang]).slice(1, 2);
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
              apparentC: h.apparentC,
              gustsKmh: h.windGustsKmh,
              windDirectionDeg: h.windDirectionDeg,
            }))
        : [],
    [data, openDay, lang]
  );

  return (
    <div className="container max-w-3xl py-6 md:py-8">
      <PageHeader title={t.weather.title} subtitle={t.weather.subtitle} />

      {/* Ortsauswahl: eigener Standort, Zeltplatz-Favoriten und Wetter-Orte */}
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
            selectedSpotId === null &&
              selectedPlace === null &&
              locationLabel === null
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:border-primary/50"
          )}
        >
          <LocateFixed className="h-3.5 w-3.5" aria-hidden="true" />
          {t.weather.myLocation}
        </button>
        {(spots ?? []).map(spot => (
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
        {places.map(place => {
          const active =
            selectedPlace !== null && isSameWeatherPlace(selectedPlace, place);
          return (
            <span
              key={`${place.name}-${place.lat}-${place.lon}`}
              className={cn(
                "flex items-center overflow-hidden rounded-full border text-xs font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50"
              )}
            >
              <button
                type="button"
                onClick={() => selectPlace(place)}
                className="flex items-center gap-1.5 py-1.5 pl-3 pr-1.5"
              >
                <Star className="h-3.5 w-3.5" aria-hidden="true" />
                {place.name}
              </button>
              <button
                type="button"
                onClick={() => removePlace(place)}
                aria-label={t.weather.placeRemoveAria(place.name)}
                className="py-1.5 pl-1 pr-2.5 opacity-70 transition-opacity hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </span>
          );
        })}
        <button
          type="button"
          onClick={() => setPlaceSearchOpen(open => !open)}
          aria-expanded={placeSearchOpen}
          className="flex items-center gap-1.5 rounded-full border border-dashed border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {t.weather.placeAddButton}
        </button>
      </div>

      {/* Ortssuche für neue Wetter-Orte (nur auf Wunsch eingeblendet) */}
      {placeSearchOpen &&
        (places.length >= MAX_WEATHER_PLACES ? (
          <p className="mb-4 text-sm text-muted-foreground">
            {t.weather.placeLimitHint(MAX_WEATHER_PLACES)}
          </p>
        ) : (
          <PlaceSearch
            onPick={pickSearchResult}
            onClose={() => setPlaceSearchOpen(false)}
          />
        ))}

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

          {/* Regen-Kurzfrist: dezente Zeile, nur wenn in den nächsten 2 h
              Regen beginnt oder aufhört (15-Minuten-Prognose) */}
          {rainNotice && (
            <p
              role="status"
              aria-label={t.weather.rainSoonAria}
              className="mb-4 flex items-center gap-2 rounded-xl border border-chart-2/40 bg-chart-2/10 px-4 py-2.5 text-sm"
            >
              <CloudRain
                className="h-4 w-4 shrink-0 text-chart-2"
                aria-hidden="true"
              />
              {rainNotice.kind === "start"
                ? t.weather.rainStartsAt(
                    rainNotice.time.toLocaleTimeString(LOCALE_TAGS[lang], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  )
                : t.weather.rainEndsAt(
                    rainNotice.time.toLocaleTimeString(LOCALE_TAGS[lang], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  )}
            </p>
          )}

          {/* Luftdruck-Trend: dezenter Frühindikator bei fallendem Druck */}
          {pressureNotice && (
            <p
              role="status"
              aria-label={t.weather.pressureAria}
              className="mb-4 flex items-center gap-2 rounded-xl border border-chart-4/40 bg-chart-4/10 px-4 py-2.5 text-sm"
            >
              <TrendingDown
                className="h-4 w-4 shrink-0 text-chart-4"
                aria-hidden="true"
              />
              {pressureNotice.strong
                ? t.weather.pressureFallingStrong(pressureNotice.hPa)
                : t.weather.pressureFalling(pressureNotice.hPa)}
            </p>
          )}

          {/* Warnungen – Anker für das Unwetter-Badge der Startseite */}
          <section
            id="warnungen"
            aria-label={t.weather.alertsAria}
            className="mb-6 scroll-mt-20 space-y-2.5"
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

          {/* «Deine Plätze»: Warnungs-Übersicht für Zeltplätze + Heim-Ort */}
          {isAuthenticated && (
            <YourPlacesSection spots={spots} onSelect={selectOverviewPlace} />
          )}

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
                {/* Sonnencreme & Trinken (#260/#261): konkrete Zahlen zum
                    heutigen Tag – dieselbe Rechnung wie in der Erinnerung */}
                {heatToday && (
                  <p className="mt-1.5 text-xs font-medium">
                    {heatToday.sunscreen &&
                      t.weather.heatSunscreen(
                        heatToday.reapplyMinutes,
                        heatToday.burnMinutes
                      )}
                    {heatToday.sunscreen && heatToday.hydration && " · "}
                    {heatToday.hydration &&
                      t.weather.heatDrink(
                        heatToday.litersPerAdult
                          .toFixed(1)
                          .replace(".", decimalSeparator)
                      )}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Stechmücken-Index (#262): Abendwerte am gewählten Ort */}
          {mosquitoTonight && (
            <section aria-label={t.weather.mosquitoAria} className="mb-6">
              <div className="rounded-xl border border-border bg-card px-4 py-3">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Bug
                    className="h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  {t.weather.mosquitoTitle}
                  <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent-foreground">
                    {mosquitoLevelLabel(mosquitoTonight.level, lang)}
                  </span>
                </p>
                <div
                  className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
                  role="img"
                  aria-label={t.weather.mosquitoBarAria(mosquitoTonight.score)}
                >
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      mosquitoTonight.score >= 78
                        ? "bg-destructive"
                        : mosquitoTonight.score >= 55
                          ? "bg-amber-500"
                          : "bg-primary"
                    )}
                    style={{ width: `${mosquitoTonight.score}%` }}
                  />
                </div>
                <p className="mt-1.5 text-sm">
                  {mosquitoAdvice(mosquitoTonight.level, lang)}
                </p>
                {mosquitoTonight.limitingFactor && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.weather.mosquitoLimiting[mosquitoTonight.limitingFactor]}
                  </p>
                )}
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {t.weather.mosquitoHint}
                </p>
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
                        {visiblePollenReadings.map(r => {
                          const mine = pollenProfile.includes(r.type);
                          return (
                            <li key={r.type}>
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium",
                                  pollenLevelStyles[r.level],
                                  mine && "ring-2 ring-primary/60"
                                )}
                              >
                                <Flower2
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                                {pollenTypeName(r.type, lang)}
                                {mine && (
                                  <span className="sr-only">
                                    {t.weather.pollenMineSr}
                                  </span>
                                )}
                                <span className="rounded-full bg-background/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                                  {describePollenLevel(r.level, lang)}
                                </span>
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                      {pollenProfile.length > 0 && (
                        <div className="mt-3 flex items-center gap-2">
                          <Switch
                            id="pollen-only-mine"
                            checked={onlyMyPollen}
                            onCheckedChange={setOnlyMyPollen}
                          />
                          <Label
                            htmlFor="pollen-only-mine"
                            className="text-xs font-normal text-muted-foreground"
                          >
                            {t.weather.pollenOnlyMine}
                          </Label>
                        </div>
                      )}
                      <div className="mt-3 border-t border-border/60 pt-3">
                        <p className="text-xs font-medium">
                          {t.weather.pollenProfileTitle}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {t.weather.pollenProfileIntro}
                        </p>
                        <div
                          className="mt-2 flex flex-wrap gap-2"
                          role="group"
                          aria-label={t.weather.pollenProfileTitle}
                        >
                          {POLLEN_TYPES.map(type => {
                            const active = pollenProfile.includes(type);
                            return (
                              <button
                                key={type}
                                type="button"
                                aria-pressed={active}
                                onClick={() => togglePollenProfileType(type)}
                                className={cn(
                                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                                  active
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-card text-muted-foreground hover:border-primary/50"
                                )}
                              >
                                {pollenTypeName(type, lang)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
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
              {data.daily.slice(0, 7).map((d, i) => {
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
                            <DayWindRow hours={openDayHours} />
                            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <Wind
                                className="h-3 w-3 shrink-0"
                                aria-hidden="true"
                              />
                              {t.weather.dayWindPeak(
                                Math.round(d.windGustsMaxKmh)
                              )}
                              {openDayHours.length > 0 && (
                                <span className="text-muted-foreground">
                                  {" · "}
                                  {t.weather.dayFeelsLike(
                                    Math.round(
                                      Math.max(
                                        ...openDayHours.map(h => h.apparentC)
                                      )
                                    )
                                  )}
                                </span>
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

          {/* Woche 2: kompakter Ausblick ohne Stunden-Detail – die Prognose
              ist so weit voraus deutlich unsicherer, daher der Hinweis. */}
          {data.daily.length > 7 && (
            <section aria-label={t.weather.week2Aria} className="mt-6">
              <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <h2 className="font-serif text-lg font-semibold">
                  {t.weather.week2Title}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t.weather.week2Hint}
                </p>
              </div>
              <Card>
                <CardContent className="divide-y divide-border/60 pt-2">
                  {data.daily.slice(7).map(d => (
                    <div key={d.date} className="flex items-center gap-3 py-2">
                      <p className="w-16 text-sm font-medium">
                        {new Date(d.date).toLocaleDateString(
                          LOCALE_TAGS[lang],
                          { weekday: "short", day: "numeric" }
                        )}
                      </p>
                      <WeatherIcon
                        code={d.weatherCode}
                        className="h-5 w-5 shrink-0 text-primary"
                      />
                      <span className="sr-only">
                        {describeWeatherCode(d.weatherCode, lang).label}
                      </span>
                      <p className="flex w-14 items-center gap-1 text-xs text-chart-2">
                        <Droplets
                          className="h-3 w-3 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="sr-only">
                          {t.weather.compareSrRain}:{" "}
                        </span>
                        {Math.round(d.precipitationProbabilityMax)}%
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
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          )}

          {/* Orte vergleichen: 7-Tage-Prognosen zweier Orte nebeneinander */}
          {compareOpen ? (
            <CompareSection
              baseLabel={locationLabel ?? t.weather.myLocation}
              baseDaily={data.daily.slice(0, 7)}
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
