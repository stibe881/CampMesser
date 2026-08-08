/**
 * «Beim nächsten Mal»-Merker am Platz (#396).
 *
 * DIE ERKENNTNIS VERSANDET SONST: Im Tagebuch steht als Anregung längst
 * «was beim nächsten Mal anders …» – aber wer die nächste Reise an
 * denselben See plant, liest nicht das Tagebuch vom letzten Sommer. Der
 * Merker hängt darum am PLATZ (wie die Skizze #382) und taucht von
 * selbst wieder auf, sobald eine Reise dorthin geplant ist.
 *
 * BEWUSST EINE LISTE KURZER ZEILEN, kein Fliesstext: «Kabeltrommel
 * 25 m», «Parzelle 12 meiden» – der Zettel am Kühlschrank, nicht der
 * Aufsatz. Erledigtes löscht man; einen Haken-Zustand gibt es nicht,
 * denn «erledigt, aber noch da» ist bei einem Merkzettel kein Zustand,
 * sondern Altpapier.
 *
 * JSON in einer Spalte, kein eigener Tisch – dasselbe Muster und
 * dieselbe Begründung wie bei `tariffsJson`: Die Zeilen gehören
 * ausschliesslich zu ihrem Platz und werden nur als Ganzes gelesen.
 */

/** Mehr Zeilen schreibt niemand auf einen Zettel – und liest sie auch nicht. */
export const MAX_NEXT_TIME_NOTES = 12;
export const NEXT_TIME_NOTE_MAX_LENGTH = 120;
/** Obergrenze der gespeicherten JSON-Länge – schützt die Spalte. */
export const NEXT_TIME_JSON_MAX_LENGTH = 2000;

/** Gespeichertes JSON in Zeilen verwandeln; Unlesbares fällt still weg. */
export function parseNextTimeNotes(raw: string | null | undefined): string[] {
  if (!raw) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  const notes: string[] = [];
  for (const entry of data.slice(0, MAX_NEXT_TIME_NOTES)) {
    if (typeof entry !== "string") continue;
    const text = entry.replace(/\s+/g, " ").trim();
    if (!text) continue;
    notes.push(
      text.length > NEXT_TIME_NOTE_MAX_LENGTH
        ? text.slice(0, NEXT_TIME_NOTE_MAX_LENGTH)
        : text
    );
  }
  return notes;
}

/**
 * Zeilen zum Speichern normalisieren. null, wenn nichts übrig bleibt –
 * dann steht in der Spalte NULL statt `"[]"`, und «kein Zettel» bleibt
 * von «leerer Zettel» unterscheidbar.
 */
export function serializeNextTimeNotes(
  notes: readonly string[]
): string | null {
  const clean = parseNextTimeNotes(JSON.stringify(notes));
  if (clean.length === 0) return null;
  const json = JSON.stringify(clean);
  return json.length > NEXT_TIME_JSON_MAX_LENGTH ? null : json;
}
