/**
 * Gewitter-Entfernung messen (#274): Blitz sehen, Donner hören, zählen.
 *
 * Licht ist praktisch sofort da, Schall braucht rund drei Sekunden pro
 * Kilometer. Die Faustregel «Sekunden durch drei» stimmt gut genug –
 * dieses Modul rechnet trotzdem mit der tatsächlichen Schallgeschwindigkeit
 * und berücksichtigt die Temperatur, weil sie in der Prognose ohnehin
 * vorliegt und den Wert um mehrere Prozent verschiebt.
 *
 * DIE WICHTIGERE ZAHL ist aber nicht die Distanz, sondern die Regel
 * dahinter: Ab 30 Sekunden Abstand (rund 10 km) ist ein Gewitter nah genug,
 * um Schutz aufzusuchen, und nach dem letzten Donner wartet man 30 Minuten,
 * bevor man wieder rausgeht. Genau das nennt die Ansicht auch so – eine
 * Kilometerzahl allein hat noch niemanden ins Auto gebracht.
 */

/** Schallgeschwindigkeit bei 0 °C in Metern pro Sekunde. */
export const SPEED_OF_SOUND_0C_MS = 331.3;

/** Zunahme je Grad Celsius. */
export const SPEED_OF_SOUND_PER_C = 0.606;

/** Ohne Temperaturangabe wird mit diesem Wert gerechnet. */
export const DEFAULT_TEMPERATURE_C = 15;

/**
 * Länger als das gehört ein Donner nicht mehr zum gezählten Blitz –
 * 120 Sekunden sind über 40 km, da hört man den Donner ohnehin nicht mehr.
 */
export const MAX_COUNT_SECONDS = 120;

/** Ab dieser Distanz gilt die 30-30-Regel: Schutz aufsuchen. */
export const SHELTER_DISTANCE_KM = 10;

/** Darunter ist das Gewitter praktisch über einem. */
export const DANGER_DISTANCE_KM = 3;

/** Nach dem letzten Donner so lange im Schutz bleiben (Minuten). */
export const ALL_CLEAR_MINUTES = 30;

/** Schallgeschwindigkeit bei einer Temperatur in m/s. */
export function speedOfSound(temperatureC: number | null): number {
  const temp = temperatureC === null ? DEFAULT_TEMPERATURE_C : temperatureC;
  return SPEED_OF_SOUND_0C_MS + SPEED_OF_SOUND_PER_C * temp;
}

/**
 * Entfernung in Kilometern aus der gezählten Zeit. Negative Zeiten gibt
 * es nicht, und über der Obergrenze wird `null` geliefert statt einer
 * Zahl, die niemand mehr einem Blitz zuordnen kann.
 */
export function strikeDistanceKm(
  seconds: number,
  temperatureC: number | null = null
): number | null {
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  if (seconds > MAX_COUNT_SECONDS) return null;
  return (seconds * speedOfSound(temperatureC)) / 1000;
}

export type StormLevel = "gefahr" | "warnung" | "beobachten";

/**
 * Wie dringend ist es? Die Schwellen folgen der 30-30-Regel und nicht
 * dem Gefühl: unter 3 km ist das Gewitter über einem, unter 10 km nah
 * genug, um sofort Schutz zu suchen.
 */
export function stormLevel(distanceKm: number): StormLevel {
  if (distanceKm < DANGER_DISTANCE_KM) return "gefahr";
  if (distanceKm <= SHELTER_DISTANCE_KM) return "warnung";
  return "beobachten";
}

/** Eine Messung: Zeitpunkt des Donners und die gezählten Sekunden. */
export interface StrikeMeasurement {
  /** Zeitstempel in Millisekunden (Date.now()). */
  at: number;
  seconds: number;
  distanceKm: number;
}

export type StormTrend = "naeher" | "weiter" | "gleich";

/**
 * Mindestunterschied in Kilometern, damit ein Trend behauptet wird.
 * Wer die Sekunden von Hand zählt, trifft es auf ein bis zwei Sekunden
 * genau – das sind rund 500 Meter. Alles darunter ist Zählrauschen und
 * kein Trend.
 */
export const TREND_THRESHOLD_KM = 1;

/**
 * Zieht das Gewitter näher? Verglichen wird die JÜNGSTE Messung mit dem
 * Mittel der vorangehenden – ein einzelner verzählter Blitz soll den
 * Trend nicht umdrehen. Ohne zwei Messungen gibt es keinen Trend.
 */
export function stormTrend(
  measurements: readonly StrikeMeasurement[]
): StormTrend | null {
  if (measurements.length < 2) return null;
  const sorted = measurements.slice().sort((a, b) => a.at - b.at);
  const latest = sorted[sorted.length - 1];
  const earlier = sorted.slice(0, -1);
  const average =
    earlier.reduce((sum, m) => sum + m.distanceKm, 0) / earlier.length;
  const delta = latest.distanceKm - average;
  if (Math.abs(delta) < TREND_THRESHOLD_KM) return "gleich";
  return delta < 0 ? "naeher" : "weiter";
}

/**
 * Wann darf man wieder raus? 30 Minuten nach dem letzten Donner –
 * gerechnet ab der jüngsten Messung. Ohne Messung gibt es keinen
 * Zeitpunkt.
 */
export function allClearAt(
  measurements: readonly StrikeMeasurement[]
): number | null {
  if (measurements.length === 0) return null;
  const last = Math.max(...measurements.map(m => m.at));
  return last + ALL_CLEAR_MINUTES * 60_000;
}

/** Verbleibende Minuten bis zur Entwarnung (0, wenn vorbei). */
export function minutesUntilAllClear(
  measurements: readonly StrikeMeasurement[],
  now: number
): number | null {
  const target = allClearAt(measurements);
  if (target === null) return null;
  return Math.max(0, Math.ceil((target - now) / 60_000));
}
