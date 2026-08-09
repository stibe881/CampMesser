/**
 * Gemeinsame Bausteine von Suchindex und Suche.
 *
 * Eigene, absichtlich winzige Datei: `globalSearch.ts` (Bewertung, eigene
 * Inhalte) und `knowledgeIndex.ts` (die grossen Wissensdaten) brauchen
 * beide diesen Typ und die Kürzungs-Hilfe. Läge er in einer der beiden,
 * zöge der Import die jeweils andere Seite mit ins Bundle – genau das,
 * was die Trennung verhindern soll.
 */

/** Kategorie eines Treffers – das Anzeige-Label liefert das Wörterbuch. */
export type SearchCategory =
  | "module"
  | "firstAid"
  | "knots"
  | "recipes"
  | "nature"
  | "clouds"
  | "care"
  | "phrases"
  | "own";

/** Ein indexierter Eintrag: Anzeige-Felder plus normalisierter Suchtext. */
export interface IndexEntry {
  id: string;
  title: string;
  module: SearchCategory;
  path: string;
  snippet: string;
  /** Normalisierter Titel */
  normTitle: string;
  /** Normalisierter Gesamttext (Titel + Inhalt) */
  normBody: string;
}

/** Text auf Snippet-Länge kürzen (mit Auslassungszeichen). */
export function shorten(s: string, max = 110): string {
  return s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;
}
