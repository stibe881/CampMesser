/**
 * Beste Reisezeit: Aggregation historischer Tageswerte aus dem
 * Open-Meteo-Wetterarchiv zu Monats-Mitteln (Ø Tagesmaximum, Ø Tagesminimum,
 * Regentage pro Monat). Reine Funktionen – von Client und Tests genutzt.
 */

/** Tageswerte, wie sie die Archive-API unter `daily` liefert. */
export interface DailyClimateData {
  /** Datum "YYYY-MM-DD" */
  time: string[];
  temperature_2m_max: (number | null)[];
  temperature_2m_min: (number | null)[];
  precipitation_sum: (number | null)[];
}

/** Monats-Mittel über alle abgedeckten Jahre. */
export interface MonthlyClimate {
  /** Monat 1–12 */
  month: number;
  /** Ø Tagesmaximum in °C (null, wenn keine Daten) */
  avgTempMaxC: number | null;
  /** Ø Tagesminimum in °C (null, wenn keine Daten) */
  avgTempMinC: number | null;
  /** Ø Regentage pro Monat (Tage mit mehr als 1 mm Niederschlag) */
  rainDays: number | null;
}

/** Ab dieser Tagessumme (mm) zählt ein Tag als Regentag. */
export const RAIN_DAY_THRESHOLD_MM = 1;

/** Request-URL der Open-Meteo Archive-API für die drei Tageswerte. */
export function climateRequestUrl(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string
): string {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    start_date: startDate,
    end_date: endDate,
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum",
    timezone: "auto",
  });
  return `https://archive-api.open-meteo.com/v1/archive?${params.toString()}`;
}

/**
 * Zeitraum der letzten `years` vollen Kalenderjahre vor `now`
 * (heute 2026 → 2021-01-01 bis 2025-12-31 bei 5 Jahren).
 */
export function climateYearRange(
  now: Date,
  years = 5
): { startDate: string; endDate: string; fromYear: number; toYear: number } {
  const toYear = now.getFullYear() - 1;
  const fromYear = toYear - years + 1;
  return {
    startDate: `${fromYear}-01-01`,
    endDate: `${toYear}-12-31`,
    fromYear,
    toYear,
  };
}

/** Auf eine Nachkommastelle runden (Anzeige- und Testfreundlichkeit). */
function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Tageswerte zu 12 Monats-Mitteln aggregieren.
 * - Temperaturen: Mittel über alle gültigen Tage des Monats (alle Jahre).
 * - Regentage: Tage mit über 1 mm, geteilt durch die Zahl der abgedeckten
 *   Jahr-Monat-Vorkommen (→ Ø Regentage in einem typischen Monat).
 * - Tage mit null-Werten (Datenlücken) werden übersprungen; Monate ganz ohne
 *   Daten bekommen null.
 */
export function aggregateMonthlyClimate(
  daily: DailyClimateData
): MonthlyClimate[] {
  const sumMax = new Array<number>(12).fill(0);
  const cntMax = new Array<number>(12).fill(0);
  const sumMin = new Array<number>(12).fill(0);
  const cntMin = new Array<number>(12).fill(0);
  const rainDayCount = new Array<number>(12).fill(0);
  const monthOccurrences: Array<Set<string>> = Array.from(
    { length: 12 },
    () => new Set<string>()
  );

  daily.time.forEach((date, i) => {
    const month = Number(date.slice(5, 7));
    if (!Number.isInteger(month) || month < 1 || month > 12) return;
    const m = month - 1;

    const tMax = daily.temperature_2m_max[i];
    if (typeof tMax === "number" && Number.isFinite(tMax)) {
      sumMax[m] += tMax;
      cntMax[m] += 1;
    }
    const tMin = daily.temperature_2m_min[i];
    if (typeof tMin === "number" && Number.isFinite(tMin)) {
      sumMin[m] += tMin;
      cntMin[m] += 1;
    }
    const precip = daily.precipitation_sum[i];
    if (typeof precip === "number" && Number.isFinite(precip)) {
      monthOccurrences[m].add(date.slice(0, 7));
      if (precip > RAIN_DAY_THRESHOLD_MM) rainDayCount[m] += 1;
    }
  });

  return Array.from({ length: 12 }, (_, m) => ({
    month: m + 1,
    avgTempMaxC: cntMax[m] > 0 ? round1(sumMax[m] / cntMax[m]) : null,
    avgTempMinC: cntMin[m] > 0 ? round1(sumMin[m] / cntMin[m]) : null,
    rainDays:
      monthOccurrences[m].size > 0
        ? round1(rainDayCount[m] / monthOccurrences[m].size)
        : null,
  }));
}

/**
 * Einfacher Reisezeit-Score: warm und trocken gewinnt.
 * Score = Ø Tagesmaximum − 0.7 × Regentage; null bei fehlenden Daten.
 */
export function climateScore(month: MonthlyClimate): number | null {
  if (month.avgTempMaxC === null || month.rainDays === null) return null;
  return month.avgTempMaxC - 0.7 * month.rainDays;
}

/**
 * Die besten `count` Monate (Monatsnummern 1–12) nach Score, absteigend.
 * Monate ohne Daten fallen weg; bei Gleichstand gewinnt der frühere Monat.
 */
export function bestTravelMonths(
  months: MonthlyClimate[],
  count = 3
): number[] {
  return months
    .map(m => ({ month: m.month, score: climateScore(m) }))
    .filter((m): m is { month: number; score: number } => m.score !== null)
    .sort((a, b) => b.score - a.score || a.month - b.month)
    .slice(0, count)
    .map(m => m.month);
}
