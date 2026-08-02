/**
 * Personen-Bereiche einer Packliste: sichere Übersetzung der JSON-Spalte
 * packLists.personsJson. Reine Funktionen – von Client, Server und Tests
 * genutzt. Einträge ohne Zuordnung gehören zum Bereich «Allgemein».
 */

/** Höchstens so viele Personen pro Liste. */
export const MAX_PERSONS = 10;

/** Höchstlänge eines Personennamens (gleich wie packItems.assignee). */
export const MAX_PERSON_NAME_LENGTH = 80;

/**
 * Beliebige Eingabe in eine bereinigte Personen-Liste übersetzen:
 * nur Strings, getrimmt, auf 80 Zeichen gekürzt, ohne Leere, ohne
 * Duplikate (Gross-/Kleinschreibung ignoriert), höchstens 10 Namen.
 */
export function normalizePersons(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const persons: string[] = [];
  for (const raw of value) {
    if (persons.length >= MAX_PERSONS) break;
    if (typeof raw !== "string") continue;
    const name = raw.trim().slice(0, MAX_PERSON_NAME_LENGTH).trim();
    if (!name) continue;
    if (persons.some(p => p.toLowerCase() === name.toLowerCase())) continue;
    persons.push(name);
  }
  return persons;
}

/** JSON-Spalte defensiv parsen – kaputte Daten ergeben eine leere Liste. */
export function parsePersons(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    return normalizePersons(JSON.parse(json));
  } catch {
    return [];
  }
}

/** Personen-Liste für die DB serialisieren; leere Liste wird zu null. */
export function serializePersons(persons: string[]): string | null {
  const normalized = normalizePersons(persons);
  return normalized.length > 0 ? JSON.stringify(normalized) : null;
}
