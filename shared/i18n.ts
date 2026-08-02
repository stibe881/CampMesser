/**
 * Mehrsprachigkeit: unterstützte Sprachen und der Basistyp für
 * vollständig übersetzte Texte. L4-Objekte erzwingen über das Typsystem,
 * dass jede Sprache vorhanden ist – nichts bleibt versehentlich deutsch.
 */

export const LANGUAGES = ["de", "fr", "it", "en"] as const;
export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Language, string> = {
  de: "Deutsch",
  fr: "Français",
  it: "Italiano",
  en: "English",
};

/** Ein vollständig übersetzter Text in allen vier Sprachen. */
export interface L4 {
  de: string;
  fr: string;
  it: string;
  en: string;
}

/** Text in der gewünschten Sprache wählen (Strings gelten als sprachneutral). */
export function pick(text: L4 | string, lang: Language): string {
  return typeof text === "string" ? text : text[lang];
}

/** Kurzform zum Anlegen eines L4-Textes. */
export function l4(de: string, fr: string, it: string, en: string): L4 {
  return { de, fr, it, en };
}

/** Datums-/Zeit-Locale je Sprache (Schweizer Varianten). */
export const LOCALE_TAGS: Record<Language, string> = {
  de: "de-CH",
  fr: "fr-CH",
  it: "it-CH",
  en: "en-GB",
};
