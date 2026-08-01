/**
 * Eigene Schnitzeljagden: Stations-Format, sichere JSON-Übersetzung und
 * Lösungswort-Bildung. Reine Funktionen – von Client, Server und Tests genutzt.
 */

export interface CustomHuntStation {
  /** Titel der Station, z. B. «Station 1: Der geheime Briefkasten» */
  title: string;
  /** Erzähltext, der die Geschichte weiterführt */
  story: string;
  /** Die eigentliche Aufgabe oder das Rätsel */
  task: string;
  /** Optionaler Hinweis, falls die Kinder feststecken */
  hint?: string;
  /** Buchstabe fürs Lösungswort (optional) */
  letter?: string;
}

export const MAX_STATIONS = 12;

/** Stations-JSON aus der Datenbank sicher in Stationen übersetzen. */
export function parseHuntStations(json: string): CustomHuntStation[] {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (s): s is CustomHuntStation =>
          Boolean(s) &&
          typeof s.title === "string" &&
          typeof s.story === "string" &&
          typeof s.task === "string",
      )
      .slice(0, MAX_STATIONS)
      .map(s => ({
        title: s.title,
        story: s.story,
        task: s.task,
        hint: typeof s.hint === "string" && s.hint.trim() ? s.hint : undefined,
        letter:
          typeof s.letter === "string" && s.letter.trim()
            ? s.letter.trim().slice(0, 1).toUpperCase()
            : undefined,
      }));
  } catch {
    return [];
  }
}

/** Lösungswort aus den Stations-Buchstaben in Reihenfolge (null ohne Buchstaben). */
export function solutionWordFromStations(stations: CustomHuntStation[]): string | null {
  const word = stations
    .map(s => s.letter?.trim().slice(0, 1).toUpperCase() ?? "")
    .join("");
  return word.length > 0 ? word : null;
}
