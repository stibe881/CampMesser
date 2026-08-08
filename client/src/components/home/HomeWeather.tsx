/**
 * Aus Home.tsx herausgelöst (#419): Die Startseite war mit 2005 Zeilen
 * die grösste Datei im Client – die Widgets wohnen jetzt hier (Muster
 * wie Trips #322 und Profil #414).
 */
import { Link } from "wouter";
import { AlertTriangle, ArrowRight, CloudSunRain, Wind } from "lucide-react";
import { useI18n } from "@/i18n";
import {
  describeWeatherCode,
  detectAlerts,
  type HourlyWeather,
} from "@shared/weather";
import { type DayWeather } from "@shared/dailyTips";
import { useEffect, useState } from "react";

export interface HomeWeather {
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
export function CurrentTripWeather({
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
 * Wetter der Startseite EINMAL laden und teilen: das Wetter-Widget zeigt die
 * aktuelle Lage + Warnungen, der «Tipp des Tages» nutzt die daily-Aggregate
 * (heute/morgen) aus derselben Antwort – kein doppelter Fetch.
 */
export function useHomeWeather(lang: ReturnType<typeof useI18n>["lang"]): {
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

export default function WeatherWidget({
  weather,
}: {
  weather: HomeWeather | null;
}) {
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
