/**
 * Koch-Notizen & «zuletzt gekocht» pro Rezept (#635): kleine, private
 * Merkzettel («doppelt Curry, Kinder mochten es») und der Tag des
 * letzten Kochens – je Rezept-Id (statisch wie «gemuese-curry» oder
 * eigene wie «eigenes-7»). Persistiert wie die Favoriten (#120) in
 * localStorage und über den Geräte-Sync.
 */

/** localStorage-Schlüssel der Notiz-Sammlung. */
export const RECIPE_NOTES_KEY = "campmesser.recipeNotes";

/** Obergrenzen – schützen localStorage und den Geräte-Sync-Payload. */
export const MAX_NOTE_ENTRIES = 200;
export const MAX_NOTE_LENGTH = 500;
const MAX_ID_LENGTH = 80;

export interface RecipeNote {
  /** Freitext-Notiz; leer = keine */
  note: string;
  /** Letztes Kochen als ISO-Tag (YYYY-MM-DD); null = nie vermerkt */
  lastCooked: string | null;
}

export type RecipeNotesMap = Record<string, RecipeNote>;

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Unbekannte Daten defensiv in eine saubere Notiz-Sammlung überführen. */
export function sanitizeRecipeNotes(value: unknown): RecipeNotesMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: RecipeNotesMap = {};
  let count = 0;
  for (const [rawId, rawEntry] of Object.entries(
    value as Record<string, unknown>
  )) {
    if (count >= MAX_NOTE_ENTRIES) break;
    const id = rawId.trim().slice(0, MAX_ID_LENGTH);
    if (!id || !rawEntry || typeof rawEntry !== "object") continue;
    const entry = rawEntry as Record<string, unknown>;
    const note =
      typeof entry.note === "string"
        ? entry.note.slice(0, MAX_NOTE_LENGTH)
        : "";
    const lastCooked =
      typeof entry.lastCooked === "string" && ISO_DAY.test(entry.lastCooked)
        ? entry.lastCooked
        : null;
    // Leere Einträge gar nicht erst mitschleppen
    if (!note.trim() && !lastCooked) continue;
    result[id] = { note, lastCooked };
    count++;
  }
  return result;
}

/** Notiz setzen bzw. mit leerem Text entfernen – nie mutierend. */
export function setRecipeNote(
  notes: RecipeNotesMap,
  id: string,
  note: string
): RecipeNotesMap {
  const existing = notes[id];
  const next: RecipeNote = {
    note: note.slice(0, MAX_NOTE_LENGTH),
    lastCooked: existing?.lastCooked ?? null,
  };
  const result = { ...notes };
  if (!next.note.trim() && !next.lastCooked) {
    delete result[id];
  } else {
    result[id] = next;
  }
  return sanitizeRecipeNotes(result);
}

/** «Heute gekocht» vermerken – nie mutierend. */
export function markCooked(
  notes: RecipeNotesMap,
  id: string,
  day: string
): RecipeNotesMap {
  const existing = notes[id];
  return sanitizeRecipeNotes({
    ...notes,
    [id]: { note: existing?.note ?? "", lastCooked: day },
  });
}

/** Sammlung aus localStorage laden (kaputte Werte ergeben {}). */
export function loadRecipeNotes(): RecipeNotesMap {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(RECIPE_NOTES_KEY);
    return raw ? sanitizeRecipeNotes(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

/** Sammlung in localStorage schreiben (Quota-Fehler ignorieren). */
export function storeRecipeNotes(notes: RecipeNotesMap): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(RECIPE_NOTES_KEY, JSON.stringify(notes));
  } catch {
    /* Quota voll o. Ä. – der Geräte-Sync gleicht es später aus */
  }
}
