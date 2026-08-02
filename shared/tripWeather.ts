/**
 * Trip-Wetterarchiv: kompakte Zusammenfassung des historischen Wetters eines
 * vergangenen Aufenthalts ({tMax, tMin, rainDays, totalPrecip}) aus den
 * Tageswerten der Open-Meteo-APIs. Reine Funktionen – von Client, Server
 * (Validierung) und Tests genutzt (Muster shared/climate.ts).
 */
import { RAIN_DAY_THRESHOLD_MM } from "./climate";
import { tripNights } from "./trips";

/** Kompakte Wetter-Zusammenfassung eines Aufenthalts. */
export interface TripWeatherSummary {
  /** Höchstes Tagesmaximum des Zeitraums in °C */
  tMax: number;
  /** Tiefstes Tagesminimum des Zeitraums in °C */
  tMin: number;
  /** Tage mit mehr als 1 mm Niederschlag */
  rainDays: number;
  /** Gesamt-Niederschlag des Zeitraums in mm */
  totalPrecip: number;
}

/** Plausible Temperatur-Grenzen in °C (Server-Validierung + Parser). */
export const TRIP_WEATHER_TEMP_MIN = -60;
export const TRIP_WEATHER_TEMP_MAX = 60;
/** Obergrenze Regentage (längster denkbarer Aufenthalt). */
export const TRIP_WEATHER_MAX_RAIN_DAYS = 1000;
/** Obergrenze Gesamt-Niederschlag in mm. */
export const TRIP_WEATHER_MAX_PRECIP_MM = 20000;

/**
 * Ab so vielen Tagen nach der Abreise ist das Open-Meteo-Archiv verlässlich –
 * jüngere Trips holen die Werte über die Forecast-API mit past_days.
 */
export const TRIP_WEATHER_ARCHIVE_MIN_AGE_DAYS = 5;

/** Tageswerte, wie sie Archive- und Forecast-API unter `daily` liefern. */
export interface TripWeatherDaily {
  temperature_2m_max: (number | null)[];
  temperature_2m_min: (number | null)[];
  precipitation_sum: (number | null)[];
}

/** Auf eine Nachkommastelle runden (Anzeige- und Testfreundlichkeit). */
function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function validTemp(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= TRIP_WEATHER_TEMP_MIN &&
    value <= TRIP_WEATHER_TEMP_MAX
  );
}

/**
 * Tageswerte zu einer Trip-Zusammenfassung aggregieren: Extremwerte der
 * Temperaturen, Regentage (> 1 mm) und Niederschlagssumme. Tage mit
 * null-Werten (Archiv-Lücken) werden übersprungen; ganz ohne gültige
 * Temperatur-Tage gibt es null – dann später erneut versuchen.
 */
export function summarizeTripWeather(
  daily: TripWeatherDaily
): TripWeatherSummary | null {
  let tMax: number | null = null;
  let tMin: number | null = null;
  let rainDays = 0;
  let totalPrecip = 0;

  const days = Math.max(
    daily.temperature_2m_max?.length ?? 0,
    daily.temperature_2m_min?.length ?? 0,
    daily.precipitation_sum?.length ?? 0
  );
  for (let i = 0; i < days; i++) {
    const max = daily.temperature_2m_max?.[i];
    if (validTemp(max) && (tMax === null || max > tMax)) tMax = max;
    const min = daily.temperature_2m_min?.[i];
    if (validTemp(min) && (tMin === null || min < tMin)) tMin = min;
    const precip = daily.precipitation_sum?.[i];
    if (typeof precip === "number" && Number.isFinite(precip) && precip >= 0) {
      totalPrecip += precip;
      if (precip > RAIN_DAY_THRESHOLD_MM) rainDays += 1;
    }
  }

  if (tMax === null || tMin === null) return null;
  return {
    tMax: round1(tMax),
    tMin: round1(tMin),
    rainDays,
    totalPrecip: round1(Math.min(totalPrecip, TRIP_WEATHER_MAX_PRECIP_MM)),
  };
}

/**
 * Gespeichertes Wetter-JSON defensiv in eine Zusammenfassung übersetzen –
 * kaputte oder unplausible Werte ergeben null (dann keine Anzeige).
 */
/** Eingabe für die Wetter-Glück-Statistik: Trip-Zeitraum + Wetterarchiv. */
export interface WeatherLuckTrip {
  startDate: string;
  endDate: string;
  /** Anzeigename des Orts (für «wärmster Trip») */
  placeName?: string | null;
  /** Gespeichertes Wetterarchiv (TripWeatherSummary als JSON) */
  weatherJson?: string | null;
}

/** Aggregierte Wetter-Glück-Kennzahlen über alle Trips mit Wetterarchiv. */
export interface WeatherLuck {
  /** Anzahl Aufenthalte mit gültigem Wetterarchiv */
  trips: number;
  /** Campingtage gesamt (Nächte + 1 pro Trip) */
  totalDays: number;
  /** Tage ohne Regen (Campingtage − Regentage) */
  dryDays: number;
  /** Anteil trockener Tage 0…1 (dryDays / totalDays) */
  dryShare: number;
  /** Ø des Tagesmaximums (tMax pro Trip, ungewichtet) in °C */
  avgTMax: number;
  /** Wärmster Aufenthalt: Ort + höchstes Tagesmaximum */
  warmest: { place: string; tMax: number } | null;
}

/**
 * Wetter-Glück über alle Aufenthalte mit Wetterarchiv aggregieren.
 *
 * Definitionen:
 * - «Campingtage» eines Trips = Nächte + 1 (An- UND Abreisetag zählen als
 *   Tage vor Ort; gleicher Tag = 1 Tag, kaputte Daten defensiv ebenfalls 1).
 * - «Trockene Tage» = Campingtage − Regentage des Archivs; die Regentage
 *   werden pro Trip auf die Campingtage geklemmt, damit unplausible Archive
 *   den Anteil nie unter 0 drücken. dryShare = 1 − rainDays/totalDays.
 * - avgTMax = ungewichteter Durchschnitt der Trip-Tagesmaxima (tMax),
 *   auf eine Nachkommastelle gerundet.
 * - warmest = Trip mit dem höchsten tMax (bei Gleichstand der erste).
 *
 * Trips ohne (oder mit kaputtem) weatherJson werden übersprungen; hat kein
 * einziger Trip ein Archiv, gibt es null – dann keine Anzeige.
 */
export function weatherLuck(trips: WeatherLuckTrip[]): WeatherLuck | null {
  let count = 0;
  let totalDays = 0;
  let rainDaysTotal = 0;
  let tMaxSum = 0;
  let warmest: { place: string; tMax: number } | null = null;
  for (const trip of trips) {
    const summary = parseTripWeather(trip.weatherJson);
    if (!summary) continue;
    const days = tripNights(trip.startDate, trip.endDate) + 1;
    count += 1;
    totalDays += days;
    rainDaysTotal += Math.min(summary.rainDays, days);
    tMaxSum += summary.tMax;
    if (warmest === null || summary.tMax > warmest.tMax) {
      warmest = { place: trip.placeName?.trim() ?? "", tMax: summary.tMax };
    }
  }
  if (count === 0) return null;
  const dryDays = totalDays - rainDaysTotal;
  return {
    trips: count,
    totalDays,
    dryDays,
    dryShare: dryDays / totalDays,
    avgTMax: round1(tMaxSum / count),
    warmest,
  };
}

export function parseTripWeather(
  json: string | null | undefined
): TripWeatherSummary | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as Partial<TripWeatherSummary>;
    if (!parsed || typeof parsed !== "object") return null;
    const { tMax, tMin, rainDays, totalPrecip } = parsed;
    if (!validTemp(tMax) || !validTemp(tMin) || tMin > tMax) return null;
    if (
      typeof rainDays !== "number" ||
      !Number.isInteger(rainDays) ||
      rainDays < 0 ||
      rainDays > TRIP_WEATHER_MAX_RAIN_DAYS
    )
      return null;
    if (
      typeof totalPrecip !== "number" ||
      !Number.isFinite(totalPrecip) ||
      totalPrecip < 0 ||
      totalPrecip > TRIP_WEATHER_MAX_PRECIP_MM
    )
      return null;
    return { tMax, tMin, rainDays, totalPrecip };
  } catch {
    return null;
  }
}
