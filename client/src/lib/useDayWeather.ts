import { useEffect, useState } from "react";
import { describeWeatherCode } from "@shared/weather";
import { weatherTurn, type WeatherTurn } from "@shared/weatherTurn";
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
  /**
   * Höchste Böe des Tages in km/h; null, wenn der Dienst sie nicht
   * liefert. Für die Lagerfeuer-Ampel (#389) – der Funke fliegt in der
   * Böe, nicht im Mittelwert.
   */
  gustsMaxKmh: number | null;
  /**
   * Kippt das Wetter von heute auf morgen? (#417) – dafür holt die
   * Abfrage zwei Tage statt einen; null heisst «nichts zu sagen».
   */
  turn: WeatherTurn | null;
  /**
   * Aktuelle Schneehöhe am Boden in cm (#470); null, wenn der Dienst
   * nichts liefert. Die Heute-Ansicht zeigt sie nur bei Wintersport.
   */
  snowDepthCm: number | null;
  /** Neuschnee heute in cm (#525); null ohne Messwert. */
  snowfallTodayCm: number | null;
  /** Regensumme heute in mm (#548); null ohne Messwert. */
  rainTodayMm: number | null;
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
      forecast_days: "2",
      daily:
        "temperature_2m_max,temperature_2m_min,weather_code,wind_gusts_10m_max,precipitation_sum,snowfall_sum",
      // Schneehöhe (#470) für die Wintersport-Zeile – gleicher Abruf.
      current: "snow_depth",
    });
    fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`)
      .then(res => (res.ok ? res.json() : Promise.reject(new Error("no"))))
      .then(json => {
        if (cancelled) return;
        const max = json?.daily?.temperature_2m_max?.[0];
        const min = json?.daily?.temperature_2m_min?.[0];
        const code = json?.daily?.weather_code?.[0];
        const gusts = json?.daily?.wind_gusts_10m_max?.[0];
        if (typeof max !== "number" || typeof min !== "number") return;
        /** Tag i als Umschwungs-Eingabe – null, wenn ein Wert fehlt. */
        const turnDay = (i: number) => {
          const d = json?.daily;
          const date = d?.time?.[i];
          const tempMaxC = d?.temperature_2m_max?.[i];
          const rain = d?.precipitation_sum?.[i];
          const g = d?.wind_gusts_10m_max?.[i];
          if (
            typeof date !== "string" ||
            typeof tempMaxC !== "number" ||
            typeof rain !== "number" ||
            typeof g !== "number"
          ) {
            return undefined;
          }
          return {
            date,
            tempMaxC,
            precipitationSumMm: rain,
            windGustsMaxKmh: g,
          };
        };
        setWeather({
          maxC: max,
          minC: min,
          label:
            typeof code === "number"
              ? describeWeatherCode(code, lang).label
              : "",
          gustsMaxKmh: typeof gusts === "number" ? Math.round(gusts) : null,
          turn: weatherTurn(turnDay(0), turnDay(1)),
          snowDepthCm:
            typeof json?.current?.snow_depth === "number"
              ? Math.round(json.current.snow_depth * 100)
              : null,
          snowfallTodayCm:
            typeof json?.daily?.snowfall_sum?.[0] === "number"
              ? Math.round(json.daily.snowfall_sum[0])
              : null,
          rainTodayMm:
            typeof json?.daily?.precipitation_sum?.[0] === "number"
              ? json.daily.precipitation_sum[0]
              : null,
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
