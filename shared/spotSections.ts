/**
 * Die Reihenfolge der Abschnitte im Platz-Dossier (#371, Nutzerwunsch).
 *
 * DAS PROBLEM: Die Seite hatte EINE Reihenfolge – Platz, Anreise, Wetter,
 * Umgebung, Eigenes – und die passte immer nur zu einem Drittel der
 * Fälle. Wer auf dem Platz steht, scrollt an Route, bester Abfahrtszeit
 * und Streckenwetter vorbei, um die WLAN-Nummer zu suchen. Wer den Platz
 * erst anschaut, ohne dass eine Reise geplant ist, kriegt eine
 * Anreise-Planung vorgesetzt, die er gar nicht braucht.
 *
 * DREI LAGEN, DREI REIHENFOLGEN:
 *
 *   `running`  Eine Reise an diesem Platz läuft gerade.
 *              Zuerst, was man mit dem Handy in der Hand braucht: der
 *              Platz selbst (Nummer, WLAN, Rezeption), dann die Umgebung
 *              (Feuerstellen, Läden, ÖV, Baden), dann das Wetter. Die
 *              ANREISE kommt zuletzt – du bist da.
 *
 *   `planned`  Eine Reise hierher ist erfasst, aber noch nicht angetreten.
 *              Zuerst die Anreise (Route, Abfahrtszeit, Rast,
 *              Streckenwetter), dann das Wetter am Ziel, dann der Platz.
 *
 *   `none`     Keine Reise, weder laufend noch geplant. Dann ist die Seite
 *              ein Nachschlagewerk: Was ist das für ein Platz, wie ist das
 *              Wetter dort übers Jahr, was liegt drumherum. Die Anreise
 *              zuletzt – sie ist erst ein Thema, wenn man sich entschieden
 *              hat.
 *
 * WARUM «EIGENES» IMMER GEGEN ENDE STEHT: Fotos, frühere Aufenthalte und
 * der Teil-Link sind Rückschau und Verwaltung. Sie sind nie das, wofür
 * man die Seite in diesem Moment aufmacht.
 *
 * Reine Funktion, damit die Regel prüfbar ist – am Bildschirm sieht man
 * nur, dass es «irgendwie anders» sortiert ist.
 */

/** Die fünf Abschnitte des Dossiers, in ihrer technischen Benennung. */
export const SPOT_SECTION_KEYS = [
  "place",
  "arrival",
  "weather",
  "around",
  "own",
] as const;

export type SpotSectionKey = (typeof SPOT_SECTION_KEYS)[number];

/** Lage der Reisen an diesem Platz. */
export type SpotPhase = "running" | "planned" | "none";

const ORDERS: Record<SpotPhase, SpotSectionKey[]> = {
  running: ["place", "around", "weather", "own", "arrival"],
  planned: ["arrival", "weather", "place", "around", "own"],
  none: ["place", "weather", "around", "own", "arrival"],
};

/** Minimalform eines Aufenthalts für die Lagebestimmung. */
export interface SpotStayPhaseLike {
  startDate: string;
  endDate: string;
}

/**
 * Läuft hier gerade eine Reise, ist eine geplant, oder keins von beidem?
 * `today` kommt vom Aufrufer – es zählt der Tag am Zeltplatz, nicht der
 * des Servers (#333).
 */
export function spotPhase(
  stays: readonly SpotStayPhaseLike[],
  today: string
): SpotPhase {
  let planned = false;
  for (const stay of stays) {
    if (stay.startDate <= today && stay.endDate >= today) return "running";
    if (stay.startDate > today) planned = true;
  }
  return planned ? "planned" : "none";
}

/** Die Abschnitte in der Reihenfolge, die zu dieser Lage passt. */
export function spotSectionOrder(phase: SpotPhase): SpotSectionKey[] {
  return ORDERS[phase];
}
