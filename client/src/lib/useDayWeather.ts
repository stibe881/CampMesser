import { useEffect, useState } from "react";
import { describeWeatherCode } from "@shared/weather";
import type { Language } from "@shared/i18n";

/**
 * Die Tagesprognose an einem Punkt – eine Zeile, nicht ein Modul (#330).
 *
 * WARUM EIGENE DATEI: Diese Abfrage stand im Morgen-Briefing, und die
 * Heute-Ansicht brauchte dieselbe. Ein zweites Mal geschrieben hiesse:
 * zwei Stellen mit denselben Parametern, von denen die eine irgendwann
 * `forecast_days: 2` bekommt und die andere nicht.
 *
 * KEIN SCHLÜSSEL, KEIN SERVER: Open-Meteo antwortet ohne Anmeldung, so
 * wie im Wetter-Modul. Der Abruf geht direkt vom Browser – der Server
 * müsste sonst für jede Karte einen Umweg fahren.
 *
 * OHNE NETZ BLEIBT ES NULL, und die Aufrufer lassen ihre Zeile weg. Ein
 * Fehlertext für eine Nebeninformation wäre lauter als die Information.
 */
export interface DayWeather {
  maxC: number;
  minC: number;
  /** «Leicht bewölkt» – leer, wenn der Code fehlt. */
  label: string;
}

export function useDayWeather(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  lang: Language
): DayWeather | null {
  const [weather, setWeather] = useState<DayWeather | null>(null);
  useEffect(() => {
    if (latitude == null || longitude == null) {
      setWeather(null);
      return;
    }
    let cancelled = false;
    const params = new URLSearchParams({
      latitude: latitude.toFixed(4),
      longitude: longitude.toFixed(4),
      timezone: "auto",
      forecast_days: "1",
      daily: "temperature_2m_max,temperature_2m_min,weather_code",
    });
    fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`)
      .then(res => (res.ok ? res.json() : Promise.reject(new Error("no"))))
      .then(json => {
        if (cancelled) return;
        const max = json?.daily?.temperature_2m_max?.[0];
        const min = json?.daily?.temperature_2m_min?.[0];
        const code = json?.daily?.weather_code?.[0];
        if (typeof max !== "number" || typeof min !== "number") return;
        setWeather({
          maxC: max,
          minC: min,
          label:
            typeof code === "number"
              ? describeWeatherCode(code, lang).label
              : "",
        });
      })
      .catch(() => {
        // Ohne Netz bleibt die Zeile einfach weg.
      });
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, lang]);
  return weather;
}
