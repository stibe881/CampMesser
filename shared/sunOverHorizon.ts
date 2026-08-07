/**
 * «Wann weckt mich die Sonne?» (#380)
 *
 * DER SONNENAUFGANG AUS DER WETTER-APP GILT AM MEER. In einem Bergtal
 * kommt die Sonne über den Grat, und das ist eine ganz andere Zeit –
 * schnell eine Stunde später. Abends dasselbe umgekehrt: Der Schatten
 * ist da, lange bevor die Sonne rechnerisch untergeht.
 *
 * SEIT #372 WEISS DIE APP, WO DIE BERGE STEHEN. Das Hindernis-Profil
 * eines Platzes enthält den aus dem Höhenmodell gerechneten Horizont –
 * je Richtung ein Höhenwinkel. Mehr braucht es nicht: Man geht den Tag
 * in Schritten durch und schaut, wann die Sonne zum ersten Mal ÜBER
 * allem steht, was in ihrer Richtung im Weg ist.
 *
 * WOFÜR MAN DAS BRAUCHT, ganz praktisch: Wer weiss, dass die Sonne um
 * 09:20 über den Grat kommt und um 16:40 wieder hinter dem Wald
 * verschwindet, stellt das Zelt anders. Und weiss, ob es morgens um
 * sieben schon 35 Grad hat oder ob man in Ruhe frühstücken kann.
 *
 * WARUM SCHRITTWEISE UND NICHT ANALYTISCH: Ein Horizont aus 24 Sektoren
 * plus handgezeichneten Bäumen ist keine Funktion, die man umstellen
 * kann. Ein Durchgang in Minutenschritten ist exakt genug (die
 * Sonnenscheibe braucht selbst gut zwei Minuten, um ihren Durchmesser
 * zu wandern) und kostet nichts.
 *
 * DIE SONNENPOSITIONEN KOMMEN VON AUSSEN. Die Rechnung dafür steht im
 * Client (`lib/sun.ts`); hier bleibt reine, prüfbare Logik – sonst
 * liesse sich «kommt um 09:20» nur überprüfen, indem man wartet.
 */
import { isBlocked, type ObstacleShape } from "./obstacles";

/** Eine Sonnenposition zu einem Zeitpunkt des Tages. */
export interface SunSample {
  /** Minuten seit Mitternacht (lokal). */
  minutes: number;
  /** Azimut in Grad, 0 = Nord, 90 = Ost. */
  azimuth: number;
  /** Höhenwinkel über dem geometrischen Horizont, in Grad. */
  altitude: number;
}

/**
 * Ab hier zählt die Sonne als «da».
 *
 * Nicht 0°: Bei genau null steht sie halb hinter dem Horizont und wärmt
 * nichts. Ein halbes Grad ist ungefähr ihr eigener Durchmesser – der
 * Moment, in dem sie wirklich frei steht.
 */
export const SUN_MIN_ALTITUDE_DEG = 0.5;

export interface SunWindow {
  /** Erste Minute mit freier Sonne; null = den ganzen Tag im Schatten. */
  firstMinutes: number | null;
  /** Letzte Minute mit freier Sonne; null = ebenso. */
  lastMinutes: number | null;
  /** Summe der besonnten Minuten – Lücken (Zwischengipfel) abgezogen. */
  sunnyMinutes: number;
  /**
   * Steht die Sonne den ganzen Tag hinter etwas? Dann ist es ein
   * Schattenplatz, und das ist eine eigene Aussage – nicht «keine
   * Daten».
   */
  fullyShaded: boolean;
}

/** Steht die Sonne bei dieser Probe frei? */
function isSunny(sample: SunSample, obstacles: readonly ObstacleShape[]) {
  if (sample.altitude < SUN_MIN_ALTITUDE_DEG) return false;
  return !isBlocked(
    sample.azimuth,
    sample.altitude,
    obstacles as ObstacleShape[]
  );
}

/**
 * Wann kommt die Sonne über den Grat, wann ist sie wieder weg?
 *
 * Die Proben müssen zeitlich geordnet und gleichmässig sein; der Abstand
 * wird aus den ersten beiden gelesen. Bei weniger als zwei Proben gibt
 * es nichts zu rechnen.
 */
export function sunWindow(
  samples: readonly SunSample[],
  obstacles: readonly ObstacleShape[]
): SunWindow {
  if (samples.length < 2) {
    return {
      firstMinutes: null,
      lastMinutes: null,
      sunnyMinutes: 0,
      fullyShaded: false,
    };
  }
  const step = Math.max(1, samples[1].minutes - samples[0].minutes);
  let first: number | null = null;
  let last: number | null = null;
  let sunny = 0;
  let anyAboveHorizon = false;

  for (const sample of samples) {
    if (sample.altitude >= SUN_MIN_ALTITUDE_DEG) anyAboveHorizon = true;
    if (!isSunny(sample, obstacles)) continue;
    if (first === null) first = sample.minutes;
    last = sample.minutes;
    sunny += step;
  }

  return {
    firstMinutes: first,
    lastMinutes: last,
    sunnyMinutes: sunny,
    // Schattenplatz heisst: Die Sonne WÄRE da, kommt aber nirgends
    // durch. In der Polarnacht ist sie schlicht nicht da – das ist
    // etwas anderes und wird nicht als Schatten gemeldet.
    fullyShaded: anyAboveHorizon && first === null,
  };
}

/**
 * Wie viel später als der freie Sonnenaufgang, in Minuten.
 *
 * Das ist die Zahl, die die Sache greifbar macht: «eine Stunde und
 * zwanzig Minuten später als am flachen Horizont». null, wenn eine der
 * beiden Zeiten fehlt.
 */
export function delayVersusOpen(
  overHorizonMinutes: number | null,
  openSunriseMinutes: number | null
): number | null {
  if (overHorizonMinutes === null || openSunriseMinutes === null) return null;
  return Math.max(0, overHorizonMinutes - openSunriseMinutes);
}
