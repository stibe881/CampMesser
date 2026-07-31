import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Droplets,
  Info,
  LocateFixed,
  MapPin,
  RefreshCw,
  Snowflake,
  Sun,
  Sunrise,
  Sunset,
  Tent,
  Wind,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  describeWeatherCode,
  detectAlerts,
  type DailyWeather,
  type HourlyWeather,
  type WeatherAlert,
} from "@shared/weather";

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

function WeatherIcon({ code, className }: { code: number; className?: string }) {
  const { icon } = describeWeatherCode(code);
  const Icon = icons[icon] ?? Cloud;
  return <Icon className={className} aria-hidden="true" />;
}

interface WeatherData {
  hourly: HourlyWeather[];
  daily: DailyWeather[];
  current: { temperatureC: number; apparentC: number; weatherCode: number; windKmh: number };
  elevation: number;
}

type LoadState = "idle" | "locating" | "loading" | "ready" | "error";

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
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!res.ok) throw new Error(`Wetterdienst antwortet nicht (${res.status})`);
  const json = await res.json();

  const nowIso = new Date().toISOString().slice(0, 13);
  const hourly: HourlyWeather[] = (json.hourly.time as string[])
    .map((time: string, i: number) => ({
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
    }))
    .filter(h => h.time.slice(0, 13) >= nowIso.slice(0, 13) || h.time >= new Date().toISOString().slice(0, 16));

  // Ab der aktuellen Stunde (lokale API-Zeit ist bereits Ortszeit durch timezone=auto)
  const nowLocalHour = json.hourly.time.findIndex((t: string) => new Date(t).getTime() >= Date.now() - 3600000);
  const hourlyFromNow = nowLocalHour >= 0
    ? (json.hourly.time as string[]).slice(nowLocalHour).map((time: string, k: number) => {
        const i = nowLocalHour + k;
        return {
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
        };
      })
    : hourly;

  const daily: DailyWeather[] = (json.daily.time as string[]).map((date: string, i: number) => ({
    date,
    tempMaxC: json.daily.temperature_2m_max[i],
    tempMinC: json.daily.temperature_2m_min[i],
    precipitationSumMm: json.daily.precipitation_sum[i],
    precipitationProbabilityMax: json.daily.precipitation_probability_max?.[i] ?? 0,
    windGustsMaxKmh: json.daily.wind_gusts_10m_max[i],
    weatherCode: json.daily.weather_code[i],
    sunrise: json.daily.sunrise[i],
    sunset: json.daily.sunset[i],
    uvIndexMax: json.daily.uv_index_max?.[i] ?? 0,
  }));

  return {
    hourly: hourlyFromNow,
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

const severityStyles = {
  gefahr: "border-destructive/50 bg-destructive/10 text-destructive",
  warnung: "border-chart-4/50 bg-chart-4/10 text-foreground",
  info: "border-border bg-secondary/60 text-foreground",
} as const;

export default function WeatherPage() {
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [data, setData] = useState<WeatherData | null>(null);
  // Ausgewählter Ort: null = eigener Standort, sonst ID des Zeltplatz-Favoriten
  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const { data: spots } = trpc.spots.list.useQuery(undefined, { enabled: isAuthenticated });

  const loadForCoords = async (lat: number, lon: number) => {
    setState("loading");
    setCoords({ lat, lon });
    try {
      setData(await fetchWeather(lat, lon));
      setState("ready");
    } catch (e) {
      setState("error");
      setError(e instanceof Error ? e.message : "Wetterdaten konnten nicht geladen werden.");
    }
  };

  const load = () => {
    setState("locating");
    setError(null);
    setSelectedSpotId(null);
    setLocationLabel(null);
    if (!navigator.geolocation) {
      setState("error");
      setError("Dein Gerät unterstützt keine Standortbestimmung.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords;
        await loadForCoords(latitude, longitude);
      },
      () => {
        setState("error");
        setError("Standort nicht verfügbar. Bitte Standortfreigabe im Browser erlauben.");
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const selectSpot = (spot: { id: number; name: string; latitude: number; longitude: number }) => {
    setSelectedSpotId(spot.id);
    setLocationLabel(spot.name);
    setError(null);
    void loadForCoords(spot.latitude, spot.longitude);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const alerts: WeatherAlert[] = useMemo(() => (data ? detectAlerts(data.hourly) : []), [data]);
  const next24 = data?.hourly.slice(0, 24) ?? [];

  return (
    <div className="container max-w-3xl py-6 md:py-8">
      <PageHeader
        title="Camp-Wetter"
        subtitle="Hyperlokale Vorhersage und Unwetterwarnungen für deinen Zeltplatz."
      />

      {/* Ortsauswahl: eigener Standort oder gespeicherte Zeltplatz-Favoriten */}
      {(spots?.length ?? 0) > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="Ort für die Wettervorhersage wählen">
          <button
            type="button"
            onClick={load}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              selectedSpotId === null
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/50",
            )}
          >
            <LocateFixed className="h-3.5 w-3.5" aria-hidden="true" />
            Mein Standort
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
                  : "border-border bg-card text-muted-foreground hover:border-primary/50",
              )}
            >
              <Tent className="h-3.5 w-3.5" aria-hidden="true" />
              {spot.name}
            </button>
          ))}
        </div>
      )}

      {(state === "locating" || state === "loading") && (
        <div className="space-y-3" aria-busy="true" aria-label="Wetterdaten werden geladen">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      )}

      {state === "error" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={load} className="mt-1">
              <LocateFixed className="mr-2 h-4 w-4" aria-hidden="true" />
              Erneut versuchen
            </Button>
            <p className="max-w-sm text-xs text-muted-foreground">
              Hinweis: Das Wetter-Modul braucht eine Internetverbindung und deinen Standort. Die
              Offline-Module (Erste Hilfe, Knoten, Natur) funktionieren weiterhin ohne Netz.
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
                      (coords ? `${coords.lat.toFixed(3)}°, ${coords.lon.toFixed(3)}°` : "")}{" "}
                    · {Math.round(data.elevation)} m ü. M.
                  </p>
                  <p className="mt-1 font-serif text-4xl font-semibold">
                    {Math.round(data.current.temperatureC)}°
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Gefühlt {Math.round(data.current.apparentC)}° ·{" "}
                    {describeWeatherCode(data.current.weatherCode).label}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <WeatherIcon code={data.current.weatherCode} className="h-14 w-14 text-primary" />
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Wind className="h-3.5 w-3.5" aria-hidden="true" />
                    {Math.round(data.current.windKmh)} km/h
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sunrise className="h-4 w-4 text-chart-4" aria-hidden="true" />
                  {new Date(data.daily[0].sunrise).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
                  <Sunset className="ml-3 h-4 w-4 text-chart-1" aria-hidden="true" />
                  {new Date(data.daily[0].sunset).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
                </p>
                <Button variant="ghost" size="sm" onClick={load} aria-label="Wetter aktualisieren">
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Warnungen */}
          <section aria-label="Unwetterwarnungen" className="mb-6 space-y-2.5">
            {alerts.length === 0 ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
                <Info className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                Keine Unwetterwarnungen für die nächsten 48 Stunden – gute Bedingungen fürs Camp.
              </div>
            ) : (
              alerts.map(alert => (
                <div
                  key={alert.id}
                  className={cn("rounded-xl border px-4 py-3", severityStyles[alert.severity])}
                  role={alert.severity === "gefahr" ? "alert" : undefined}
                >
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {alert.title}
                    <span className="ml-auto rounded-full bg-background/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                      {alert.severity}
                    </span>
                  </p>
                  <p className="mt-1 text-sm">{alert.description}</p>
                  <p className="mt-1.5 text-xs opacity-90">{alert.advice}</p>
                </div>
              ))
            )}
          </section>

          {/* Stundenverlauf */}
          <h2 className="mb-2.5 font-serif text-lg font-semibold">Nächste 24 Stunden</h2>
          <div className="mb-6 overflow-x-auto rounded-xl border border-border/70 bg-card">
            <div className="flex min-w-max gap-0 px-2 py-3">
              {next24.map(h => (
                <div key={h.time} className="flex w-16 shrink-0 flex-col items-center gap-1 text-center">
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(h.time).getHours()}:00
                  </p>
                  <WeatherIcon code={h.weatherCode} className="h-5 w-5 text-primary" />
                  <p className="text-sm font-semibold">{Math.round(h.temperatureC)}°</p>
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

          {/* 7-Tage */}
          <h2 className="mb-2.5 font-serif text-lg font-semibold">7-Tage-Vorhersage</h2>
          <Card>
            <CardContent className="divide-y divide-border/60 pt-2">
              {data.daily.map((d, i) => (
                <div key={d.date} className="flex items-center gap-3 py-2.5">
                  <p className="w-16 text-sm font-medium">
                    {i === 0
                      ? "Heute"
                      : new Date(d.date).toLocaleDateString("de-CH", { weekday: "short", day: "numeric" })}
                  </p>
                  <WeatherIcon code={d.weatherCode} className="h-5 w-5 shrink-0 text-primary" />
                  <p className="flex w-14 items-center gap-1 text-xs text-chart-2">
                    <Droplets className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {Math.round(d.precipitationProbabilityMax)}%
                  </p>
                  <p className="hidden w-16 items-center gap-1 text-xs text-muted-foreground sm:flex">
                    <Wind className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {Math.round(d.windGustsMaxKmh)} km/h
                  </p>
                  <p className="ml-auto text-sm">
                    <span className="font-semibold">{Math.round(d.tempMaxC)}°</span>
                    <span className="text-muted-foreground"> / {Math.round(d.tempMinC)}°</span>
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Datenquelle: Open-Meteo (beste verfügbare Auflösung für deinen Standort, in der Schweiz
            MeteoSchweiz ICON-CH). Warnungen werden aus der Vorhersage berechnet und ersetzen keine
            offiziellen Warnungen von MeteoSchweiz.
          </p>
        </>
      )}
    </div>
  );
}
