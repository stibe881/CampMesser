/**
 * Sortierung der Packlisten-Kategorien. Kategorien werden frei getippt, also
 * entscheidet nicht die Reihenfolge des Eintippens über die Anzeige, sondern
 * das Alphabet der aktiven Sprache – sonst wandert eine neu angelegte
 * Kategorie ans Ende und man sucht sie.
 */
import { LOCALE_TAGS, type Language } from "./i18n";

/**
 * Vergleicht zwei Kategorienamen sprachgerecht: Gross-/Kleinschreibung und
 * Akzente spielen keine Rolle, Zahlen werden als Zahlen verglichen
 * («Tag 2» vor «Tag 10»).
 */
export function comparePackCategories(
  a: string,
  b: string,
  lang: Language
): number {
  return a.localeCompare(b, LOCALE_TAGS[lang], {
    sensitivity: "base",
    numeric: true,
  });
}

/** Kategorienamen alphabetisch – die Eingabe bleibt unverändert. */
export function sortPackCategories(
  categories: readonly string[],
  lang: Language
): string[] {
  return categories.slice().sort((a, b) => comparePackCategories(a, b, lang));
}

/**
 * Gruppen (Kategorie + Einträge) alphabetisch nach Kategorie. Die Einträge
 * innerhalb einer Gruppe behalten ihre Reihenfolge (dort zählt die
 * selbst gewählte Sortierung der Liste).
 */
export function sortPackCategoryGroups<T>(
  groups: readonly [string, T][],
  lang: Language
): [string, T][] {
  return groups.slice().sort(([a], [b]) => comparePackCategories(a, b, lang));
}
