/**
 * Wetterumschwung-Hinweis (#417): «Morgen kippt das Wetter – heute
 * Abend abspannen.»
 *
 * WAS DA HERUMLAG: Der Luftdruck-Trend (#187) deutet, die Tagesprognose
 * zählt Böen und Regen – aber niemand rechnete daraus die eine Aussage,
 * die auf dem Platz zählt: ob HEUTE noch etwas zu tun ist, bevor es
 * MORGEN ungemütlich wird.
 *
 * GEMELDET WIRD DER SPRUNG, nicht das Niveau: Wer bei stetigen 50 km/h
 * Bise zeltet, weiss das – ihm jeden Tag «Wind!» zu melden, wäre Lärm.
 * Erst wenn morgen DEUTLICH mehr kommt als heute UND das Niveau
 * wehtut, gibt es den Hinweis. Gleiche Philosophie wie beim
 * Kondens-Hinweis (#397): Die Karte erscheint nur, wenn es etwas zu
 * sagen gibt.
 *
 * EIN HINWEIS, DER WICHTIGSTE: Wind vor Regen vor Kälte. Wind reisst
 * das Tarp weg, Regen macht nass, Kälte macht wach – in dieser
 * Reihenfolge handelt man auch.
 */

export interface TurnDay {
  /** ISO-Tag – nur zur Kontrolle, dass wirklich Folgetage verglichen werden. */
  date: string;
  tempMaxC: number;
  precipitationSumMm: number;
  windGustsMaxKmh: number;
}

/** Morgen mindestens so viel MEHR Böe als heute (km/h). */
export const TURN_GUST_JUMP_KMH = 20;
/** … und mindestens dieses Niveau – sonst ist der Sprung egal. */
export const TURN_GUST_MIN_KMH = 45;
/** Morgen mindestens so viel MEHR Regen als heute (mm). */
export const TURN_RAIN_JUMP_MM = 10;
/** … und mindestens diese Menge – ein Schauer ist kein Umschwung. */
export const TURN_RAIN_MIN_MM = 12;
/** Temperatursturz ab diesem Delta (°C). */
export const TURN_TEMP_DROP_C = 8;

export interface WeatherTurn {
  kind: "wind" | "rain" | "cold";
  /** Der morgige Wert, gerundet – für den Meldungstext. */
  value: number;
}

/**
 * Kippt das Wetter von heute auf morgen? null heisst: nichts zu sagen –
 * auch bei fehlenden Daten wird nichts behauptet.
 */
export function weatherTurn(
  today: TurnDay | undefined,
  tomorrow: TurnDay | undefined
): WeatherTurn | null {
  if (!today || !tomorrow) return null;

  if (
    tomorrow.windGustsMaxKmh >= TURN_GUST_MIN_KMH &&
    tomorrow.windGustsMaxKmh - today.windGustsMaxKmh >= TURN_GUST_JUMP_KMH
  ) {
    return { kind: "wind", value: Math.round(tomorrow.windGustsMaxKmh) };
  }
  if (
    tomorrow.precipitationSumMm >= TURN_RAIN_MIN_MM &&
    tomorrow.precipitationSumMm - today.precipitationSumMm >= TURN_RAIN_JUMP_MM
  ) {
    return { kind: "rain", value: Math.round(tomorrow.precipitationSumMm) };
  }
  if (today.tempMaxC - tomorrow.tempMaxC >= TURN_TEMP_DROP_C) {
    return {
      kind: "cold",
      value: Math.round(today.tempMaxC - tomorrow.tempMaxC),
    };
  }
  return null;
}
