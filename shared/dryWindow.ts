/**
 * Das trockene Zeitfenster für Auf- und Abbau (#384).
 *
 * WAS FEHLTE: Die Stundenprognose liegt vollständig vor – Niederschlag,
 * Wahrscheinlichkeit, Wind, Böen – und wird ausschliesslich als Tabelle
 * angezeigt. Die Frage, die man vor der Abreise wirklich hat, lautet
 * aber nicht «wie ist das Wetter», sondern «WANN baue ich ab?». Ein Zelt
 * nass einzupacken kostet zu Hause einen Trockentag, im schlechten Fall
 * Schimmel (#89 erinnert hinterher ans Trocknen – hier geht es darum,
 * dass es gar nicht erst nötig wird).
 *
 * NICHT DER KURZFRIST-HINWEIS: #147 kennt die nächste Stunde und sagt,
 * ob es gleich regnet. Hier geht es um die nächsten zwei Tage und um die
 * Wahl zwischen Freitagabend, Samstagmorgen und Samstagmittag.
 *
 * WIND ZÄHLT MIT, UND ZWAR ERNST. Ein trockenes Fenster bei 60 km/h Böen
 * ist kein gutes Fenster: Ein Zelt, das man allein gegen den Wind
 * aufstellt, ist entweder kaputt oder weg. Deshalb zwei Beiträge, nicht
 * nur Regen.
 *
 * DAS FENSTER WANDERT STUNDENWEISE. Gesucht wird das beste
 * zusammenhängende Fenster einer gewünschten Länge, nicht die einzelne
 * beste Stunde: Abbauen dauert.
 *
 * KEINE ERFUNDENE SICHERHEIT. Gibt es keine Stunde ohne Regen, wird das
 * gesagt – das beste Fenster von lauter schlechten bleibt schlecht, und
 * eine Empfehlung, die das verschweigt, schickt jemanden ins Wasser.
 */

/** Eine Prognosestunde, so weit sie hier zählt. */
export interface DryHour {
  /** Lokale Zeit «2026-08-08T14:00». */
  time: string;
  precipitationMm: number;
  precipitationProbability: number;
  windSpeedKmh: number;
  windGustsKmh: number;
}

/** Ein gefundenes Fenster. */
export interface DryWindow {
  /** Zeitstempel der ersten Stunde. */
  startTime: string;
  /** Zeitstempel der letzten Stunde (einschliesslich). */
  endTime: string;
  hours: number;
  /** Note 0–100; 100 heisst trocken und windstill. */
  score: number;
  /** Summe des Niederschlags im Fenster, in Millimetern. */
  precipitationMm: number;
  /** Höchste Böe im Fenster, in km/h. */
  maxGustsKmh: number;
  /** Ist im Fenster überhaupt kein Regen gemeldet? */
  fullyDry: boolean;
}

/** Voreingestellte Fensterlänge: so lange dauert Abbauen mit Kaffee. */
export const DEFAULT_WINDOW_HOURS = 2;
/** Weiter als so voraus wird die Stundenprognose zur Erzählung. */
export const MAX_LOOKAHEAD_HOURS = 48;
/** Bis hierhin ist Wind Belüftung; darüber wird das Zelt zum Segel. */
export const CALM_GUSTS_KMH = 25;
/** Ab hier ist Aufbauen allein keine gute Idee mehr. */
export const ROUGH_GUSTS_KMH = 50;

function clamp100(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * Note einer einzelnen Stunde.
 *
 * Regen zählt über MENGE und Wahrscheinlichkeit – ein halber Millimeter
 * bei 70 % ist Nieseln, an dem ein Abbau nicht scheitert. Der Wind wird
 * über die BÖEN gemessen und nicht über das Mittel: Weggeflogen ist ein
 * Zelt in der Böe, nicht im Mittelwert.
 */
export function hourScore(hour: DryHour): number {
  const rain =
    Math.min(60, Math.max(0, hour.precipitationMm) * 30) +
    clamp100(hour.precipitationProbability) * 0.25;
  const gusts = Math.max(0, hour.windGustsKmh - CALM_GUSTS_KMH) * 1.5;
  return clamp100(100 - rain - gusts);
}

/**
 * Alle Fenster einer Länge bewerten und das beste zurückgeben.
 *
 * BEI GLEICHSTAND GEWINNT DAS FRÜHERE. Wer morgens abbaut, hat den Tag
 * noch; wer auf das gleich gute Fenster am Abend wartet, fährt im
 * Dunkeln heim.
 *
 * Gibt null zurück, wenn es zu wenige Stunden gibt – ein Fenster aus
 * einer halben Prognose wäre geraten.
 */
export function bestDryWindow(
  hours: readonly DryHour[],
  windowHours: number = DEFAULT_WINDOW_HOURS
): DryWindow | null {
  const size = Math.max(1, Math.round(windowHours));
  const usable = hours.slice(0, MAX_LOOKAHEAD_HOURS);
  if (usable.length < size) return null;

  let best: DryWindow | null = null;
  for (let start = 0; start + size <= usable.length; start += 1) {
    const slice = usable.slice(start, start + size);
    const score =
      slice.reduce((sum, hour) => sum + hourScore(hour), 0) / slice.length;
    // Strikt grösser: Bei Gleichstand behält das FRÜHERE Fenster den Platz.
    if (best && score <= best.score) continue;
    best = {
      startTime: slice[0].time,
      endTime: slice[slice.length - 1].time,
      hours: size,
      score: Math.round(score),
      precipitationMm:
        Math.round(
          slice.reduce(
            (sum, hour) => sum + Math.max(0, hour.precipitationMm),
            0
          ) * 10
        ) / 10,
      maxGustsKmh: Math.round(
        slice.reduce((max, hour) => Math.max(max, hour.windGustsKmh), 0)
      ),
      fullyDry: slice.every(hour => hour.precipitationMm <= 0),
    };
  }
  return best;
}

/** Wie das Fenster einzuschätzen ist – für die Wortwahl in der Anzeige. */
export type WindowVerdict = "good" | "usable" | "poor";

/**
 * Urteil zum Fenster.
 *
 * DIE BÖEN SCHLAGEN DIE NOTE. Ein Fenster ohne einen Tropfen Regen, aber
 * mit 55-km/h-Böen bekommt eine gute Note und ist trotzdem kein
 * Zeltwetter – deshalb wird der Wind hier noch einmal einzeln geprüft
 * und kann das Urteil überstimmen.
 */
export function windowVerdict(window: DryWindow | null): WindowVerdict {
  if (!window) return "poor";
  if (window.maxGustsKmh >= ROUGH_GUSTS_KMH) return "poor";
  if (window.score >= 80 && window.precipitationMm <= 0.2) return "good";
  if (window.score >= 55) return "usable";
  return "poor";
}

/** «Sa 08:00 – 10:00» aus zwei Zeitstempeln; die Stunden reichen. */
export function windowClock(window: DryWindow): { from: string; to: string } {
  const clock = (value: string) => value.slice(11, 16) || value;
  // Das Fenster endet AM ENDE seiner letzten Stunde, nicht an ihrem Anfang:
  // Wer bis 10:00 abbauen will, hat die Stunde ab 09:00 noch ganz.
  const endHour = Number(window.endTime.slice(11, 13));
  const to = Number.isFinite(endHour)
    ? `${String((endHour + 1) % 24).padStart(2, "0")}:00`
    : clock(window.endTime);
  return { from: clock(window.startTime), to };
}

/** Das Datum des Fensters als ISO-Tag – für «heute/morgen» in der Anzeige. */
export function windowDate(window: DryWindow): string {
  return window.startTime.slice(0, 10);
}
