/**
 * Tagesprognosen für VIELE Zeltplätze auf einmal (#383).
 *
 * EINE ABFRAGE STATT ZWÖLF: Open-Meteo nimmt mehrere Koordinaten in
 * einer Anfrage entgegen und antwortet mit einem Feld in derselben
 * Reihenfolge. Zwölf einzelne Abrufe wären zwölf Verbindungen gegen
 * einen kostenlosen Dienst – und auf dem Telefon im Funkloch zwölf
 * Gelegenheiten zu scheitern.
 *
 * DIE EINE FALLE: Bei EINER Koordinate antwortet Open-Meteo mit einem
 * Objekt, bei mehreren mit einem Feld. Wer nur den einen Fall prüft,
 * baut einen Fehler ein, der genau dann auftritt, wenn jemand einen
 * einzigen Platz gespeichert hat – also bei jeder neuen Nutzerin.
 *
 * NUR AUF ANFORDERUNG, wie beim Routen-Dienst: Die Rangliste holt ihre
 * Daten, wenn man sie aufklappt, nicht beim Seitenaufbau.
 */
import type { PickDay } from "@shared/spotPick";

/** So viele Plätze gehen in eine Abfrage – darüber wird die Adresse lang. */
export const MAX_FORECAST_SPOTS = 20;

interface DailyBlock {
  time?: unknown;
  temperature_2m_max?: unknown;
  temperature_2m_min?: unknown;
  precipitation_probability_max?: unknown;
  precipitation_sum?: unknown;
  wind_speed_10m_max?: unknown;
}

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Einen Tagesblock in unsere Form bringen; Unlesbares fällt weg. */
function toDays(daily: DailyBlock | undefined): PickDay[] {
  if (!daily || !Array.isArray(daily.time)) return [];
  const at = (key: keyof DailyBlock, i: number) => {
    const column = daily[key];
    return Array.isArray(column) ? column[i] : undefined;
  };
  return (daily.time as unknown[]).flatMap((date, i) => {
    if (typeof date !== "string") return [];
    return [
      {
        date,
        tempMaxC: num(at("temperature_2m_max", i)),
        tempMinC: num(at("temperature_2m_min", i)),
        precipProbability: num(at("precipitation_probability_max", i)),
        precipitationMm: num(at("precipitation_sum", i)),
        windMaxKmh: num(at("wind_speed_10m_max", i)),
      },
    ];
  });
}

/**
 * Prognosen holen. Der Schlüssel der Map ist die Id des Platzes.
 *
 * Plätze, für die nichts zurückkommt, fehlen in der Map – sie
 * verschwinden dadurch NICHT aus der Rangliste, sondern landen dort
 * ohne Note am Ende (siehe `rankSpots`).
 */
export async function fetchSpotForecasts(
  spots: readonly { id: number; latitude: number; longitude: number }[],
  forecastDays: number,
  options: { signal?: AbortSignal } = {}
): Promise<Map<number, PickDay[]>> {
  const limited = spots.slice(0, MAX_FORECAST_SPOTS);
  const result = new Map<number, PickDay[]>();
  if (limited.length === 0) return result;

  const params = new URLSearchParams({
    latitude: limited.map(s => s.latitude.toFixed(4)).join(","),
    longitude: limited.map(s => s.longitude.toFixed(4)).join(","),
    timezone: "auto",
    forecast_days: String(Math.max(1, Math.min(16, forecastDays))),
    daily:
      "temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max",
  });
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
    { signal: options.signal }
  );
  if (!response.ok) throw new Error("Wetterdienst nicht erreichbar");
  const json: unknown = await response.json();
  // Ein Ort → Objekt, mehrere → Feld. Beides muss hier durch.
  const blocks = Array.isArray(json) ? json : [json];
  limited.forEach((spot, index) => {
    const block = blocks[index] as { daily?: DailyBlock } | undefined;
    const days = toDays(block?.daily);
    if (days.length > 0) result.set(spot.id, days);
  });
  return result;
}
