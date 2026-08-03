/**
 * Fehlertoleranter Textvergleich – die Grundlage der globalen Suche
 * (client/src/lib/globalSearch.ts) und des Resteverwertungs-Abgleichs
 * (shared/leftovers.ts). Reine Funktionen ohne DOM, damit beide Seiten
 * dieselbe Normalisierung und dieselbe Tippfehler-Toleranz benutzen.
 *
 * Bewusst ohne Unicode-Property-Regexes (\p{L}) und ohne u-Flag.
 */

/** Kleinschreibung + Umlaut-Faltung, damit «Baume» auch «Bäume» findet. */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/é|è|ê/g, "e")
    .replace(/à|â/g, "a")
    .replace(/ß/g, "ss");
}

/**
 * Levenshtein-Distanz zweier Strings mit Abbruch-Schwelle: sobald feststeht,
 * dass die Distanz `max` übersteigt, wird `max + 1` zurückgegeben (early exit,
 * die exakte Distanz interessiert dann nicht mehr). Reine Funktion, testbar.
 */
export function levenshtein(a: string, b: string, max: number): number {
  if (a === b) return 0;
  const la = a.length;
  const lb = b.length;
  // Der Längenunterschied ist eine untere Schranke der Distanz
  if (Math.abs(la - lb) > max) return max + 1;
  if (la === 0) return lb;
  if (lb === 0) return la;
  let prev: number[] = [];
  let curr: number[] = [];
  for (let j = 0; j <= lb; j++) prev[j] = j;
  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    let rowMin = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    // Ganze Zeile über der Schwelle → Distanz kann nur noch wachsen
    if (rowMin > max) return max + 1;
    const swap = prev;
    prev = curr;
    curr = swap;
  }
  return prev[lb] > max ? max + 1 : prev[lb];
}

/** Erlaubte Tippfehler-Distanz pro Suchwort: ab 4 Zeichen 1, ab 8 Zeichen 2. */
export function maxTypoDistance(word: string): number {
  return word.length >= 8 ? 2 : word.length >= 4 ? 1 : 0;
}

/**
 * Fehlertoleranter Wort-Vergleich: stimmt das (normalisierte) Suchwort mit
 * EINEM Wort des (normalisierten) Zieltexts bis auf wenige Tippfehler überein?
 * Verglichen wird gegen die Wörter des Ziels, nie gegen den ganzen Text.
 */
export function fuzzyWordMatch(word: string, normText: string): boolean {
  const max = maxTypoDistance(word);
  if (max === 0) return false;
  const targetWords = normText.split(/[^a-z0-9]+/);
  for (const target of targetWords) {
    if (Math.abs(target.length - word.length) > max) continue;
    if (levenshtein(word, target, max) <= max) return true;
  }
  return false;
}
