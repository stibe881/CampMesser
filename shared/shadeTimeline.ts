/**
 * Schattenverlauf am Stellplatz (#452): Aus Sonnenbahn und Hindernis-
 * Profil (#15) wird ein Tagesverlauf – wann liegt der Platz an der
 * Sonne, wann im Schatten, und wie viele Stunden sind es insgesamt?
 *
 * Die Liste der Schattenzeiten (#15) beantwortet «wann»; der Verlauf
 * hier beantwortet «wie viel» und macht den Tag als Balken sichtbar.
 * Reine Funktion über bereits berechnete Minuten-Stichproben, damit die
 * Sonnenstands-Rechnung (client/src/lib/sun.ts) dort bleibt, wo sie ist.
 */

export interface ShadeSample {
  /** Minute des Tages (0–1440). */
  minutes: number;
  /** Sonne über dem Horizont? */
  up: boolean;
  /** Steht die Sonne hinter einem Hindernis (Platz im Schatten)? */
  shaded: boolean;
}

export interface ShadeSegment {
  startMinutes: number;
  endMinutes: number;
  shaded: boolean;
}

export interface ShadeTimeline {
  /** Zusammenhängende Sonne/Schatten-Abschnitte zwischen Auf- und Untergang. */
  segments: ShadeSegment[];
  sunMinutes: number;
  shadeMinutes: number;
  /** Erste bzw. letzte Minute mit Sonne über dem Horizont; null = Polarnacht. */
  dayStartMinutes: number | null;
  dayEndMinutes: number | null;
}

/**
 * Stichproben zu Abschnitten zusammenfassen. Erwartet aufsteigend
 * sortierte Minuten in gleichmässigem Abstand; Minuten ohne Sonne über
 * dem Horizont zählen weder als Sonne noch als Schatten.
 */
export function shadeTimeline(samples: readonly ShadeSample[]): ShadeTimeline {
  const up = samples.filter(s => s.up);
  if (up.length === 0) {
    return {
      segments: [],
      sunMinutes: 0,
      shadeMinutes: 0,
      dayStartMinutes: null,
      dayEndMinutes: null,
    };
  }
  const step = samples.length > 1 ? samples[1].minutes - samples[0].minutes : 1;
  const segments: ShadeSegment[] = [];
  let sunMinutes = 0;
  let shadeMinutes = 0;
  let current: ShadeSegment | null = null;
  for (const sample of up) {
    if (sample.shaded) shadeMinutes += step;
    else sunMinutes += step;
    if (
      current &&
      current.shaded === sample.shaded &&
      sample.minutes - current.endMinutes <= step
    ) {
      current.endMinutes = sample.minutes + step;
      continue;
    }
    current = {
      startMinutes: sample.minutes,
      endMinutes: sample.minutes + step,
      shaded: sample.shaded,
    };
    segments.push(current);
  }
  return {
    segments,
    sunMinutes,
    shadeMinutes,
    dayStartMinutes: up[0].minutes,
    dayEndMinutes: up[up.length - 1].minutes + step,
  };
}
