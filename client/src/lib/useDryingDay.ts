/**
 * Der beste Trocknungs-Tag am Heim-Standort (#437) – Regeln in
 * shared/dryingDay.ts, Abruf wie useDayWeather direkt bei Open-Meteo.
 * null, solange nichts geladen ist oder kein Tag passt.
 */
import { useEffect, useState } from "react";
import { bestDryingDay, type DryingDayInput } from "@shared/dryingDay";

export function useDryingDay(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  enabled: boolean
): DryingDayInput | null {
  const [day, setDay] = useState<DryingDayInput | null>(null);
  useEffect(() => {
    if (!enabled || latitude == null || longitude == null) {
      setDay(null);
      return;
    }
    let cancelled = false;
    const params = new URLSearchParams({
      latitude: latitude.toFixed(4),
      longitude: longitude.toFixed(4),
      timezone: "auto",
      forecast_days: "6",
      daily:
        "temperature_2m_max,precipitation_sum,precipitation_probability_max",
    });
    fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`)
      .then(res => (res.ok ? res.json() : Promise.reject(new Error("no"))))
      .then(json => {
        if (cancelled) return;
        const dates: unknown = json?.daily?.time;
        if (!Array.isArray(dates)) return;
        const days: DryingDayInput[] = dates.flatMap((date, i) => {
          const tempMaxC = json.daily.temperature_2m_max?.[i];
          const precipitationSumMm = json.daily.precipitation_sum?.[i];
          const precipitationProbabilityMax =
            json.daily.precipitation_probability_max?.[i];
          if (
            typeof date !== "string" ||
            typeof tempMaxC !== "number" ||
            typeof precipitationSumMm !== "number" ||
            typeof precipitationProbabilityMax !== "number"
          ) {
            return [];
          }
          return [
            {
              date,
              tempMaxC,
              precipitationSumMm,
              precipitationProbabilityMax,
            },
          ];
        });
        setDay(bestDryingDay(days));
      })
      .catch(() => {
        // Ohne Netz bleibt der Hinweis einfach weg.
      });
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, enabled]);
  return day;
}
