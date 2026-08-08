/**
 * Der beste Trocknungs-Tag daheim (#437).
 *
 * Die Heimkehr-Karte (#410) sagt «Zelt trocknen» – aber nicht, WANN es
 * sich lohnt. Aus der Heim-Prognose wird der erste Tag gesucht, an dem
 * Aufhängen etwas bringt: kaum Regenrisiko, keine nennenswerte Menge,
 * nicht bitterkalt. Der ERSTE passende Tag gewinnt – ein nasses Zelt
 * wartet nicht gern auf den perfekten Samstag, Schimmel schon gar nicht.
 * Kein passender Tag in Sicht → null, und die Karte behauptet nichts.
 */

/** Höchstens diese Regenwahrscheinlichkeit gilt als Trocknungs-Wetter. */
export const DRYING_MAX_PRECIP_PROBABILITY = 30;
/** … und höchstens diese Menge (mm) – ein kurzer Sprutz zählt nicht. */
export const DRYING_MAX_PRECIP_MM = 1;
/** Unter dieser Höchsttemperatur trocknet draussen kaum etwas. */
export const DRYING_MIN_TEMP_C = 8;

export interface DryingDayInput {
  date: string;
  precipitationProbabilityMax: number;
  precipitationSumMm: number;
  tempMaxC: number;
}

export function bestDryingDay(
  days: readonly DryingDayInput[]
): DryingDayInput | null {
  return (
    days.find(
      day =>
        day.precipitationProbabilityMax <= DRYING_MAX_PRECIP_PROBABILITY &&
        day.precipitationSumMm <= DRYING_MAX_PRECIP_MM &&
        day.tempMaxC >= DRYING_MIN_TEMP_C
    ) ?? null
  );
}
