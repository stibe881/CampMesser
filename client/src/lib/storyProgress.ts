/**
 * Gute-Nacht-Geschichten (#241): der Merker «schon vorgelesen».
 *
 * Bewusst nur localStorage und kein Konto – die Frage «welche hatten wir
 * schon?» stellt sich abends im Zelt, nicht geräteübergreifend. Gespeichert
 * wird eine Liste von Geschichten-Ids (Muster lib/knotProgress.ts).
 */

/** localStorage-Schlüssel der schon vorgelesenen Geschichten. */
export const STORY_PROGRESS_KEY = "campmesser.bedtimeStoriesRead";

/** Obergrenze – der Datensatz ist klein, das schützt nur vor Unfug im Speicher. */
export const MAX_TRACKED_STORIES = 200;

/** Unbekannte Daten defensiv in eine Liste von Ids überführen (ohne Doppel). */
export function sanitizeReadStories(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const ids: string[] = [];
  value.forEach(entry => {
    if (ids.length >= MAX_TRACKED_STORIES) return;
    if (typeof entry !== "string" || entry === "") return;
    if (!ids.includes(entry)) ids.push(entry);
  });
  return ids;
}

/** Id an-/abwählen – gibt die neue Liste zurück (reine Funktion). */
export function toggleReadStory(ids: readonly string[], id: string): string[] {
  return ids.includes(id)
    ? ids.filter(entry => entry !== id)
    : [...ids, id].slice(-MAX_TRACKED_STORIES);
}

/** Gelesen-Merker aus localStorage laden (kaputte Werte ergeben []). */
export function loadReadStories(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORY_PROGRESS_KEY);
    return raw ? sanitizeReadStories(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

/** Gelesen-Merker sichern (blockierter Speicher bleibt folgenlos). */
export function storeReadStories(ids: readonly string[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORY_PROGRESS_KEY, JSON.stringify(ids));
  } catch {
    /* Privat-Modus o. Ä. – der Merker gilt für diese Sitzung */
  }
}
