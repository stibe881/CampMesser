import { LOCALE_TAGS, type Language } from "@shared/i18n";

/**
 * Datums-Formate der App an einem Ort (#321).
 *
 * VORHER: 67 Stellen riefen `toLocaleDateString` mit eigenen Optionen auf –
 * in 29 verschiedenen Kombinationen, von denen die Hälfte einander bis auf
 * ein nachgestelltes Komma glich. Das hat zwei Folgen. Sichtbar: Dasselbe
 * Datum steht an einer Stelle als «5. August 2026», an der nächsten als
 * «5. Aug. 2026» und an der dritten als «05.08.2026». Unsichtbar: Wer das
 * ändern will, muss 67 Stellen finden – und findet sie nicht alle.
 *
 * DIE FORMATE SIND ABSICHTLICH BENANNT, nicht durchnummeriert: `fmtLong`
 * sagt beim Lesen, warum dort das lange Format steht, `{ month: "long" }`
 * sagt es nicht. Und wer ein neues Datum anzeigt, sucht sich das passende
 * aus dieser Liste, statt sich wieder eines auszudenken.
 *
 * KEINE ÄNDERUNG DES AUSSEHENS: Jedes Format hier gibt es schon; die
 * Umstellung ist reines Zusammenführen. Wo verschiedene Längen
 * nebeneinanderstehen, ist das jetzt an EINER Stelle korrigierbar.
 *
 * NICHT HIER: Formate mit `timeZone: "UTC"`. Die stehen in Kalendern und
 * Mondphasen und sind dort kein Stil, sondern Rechnung – ein auf die
 * Ortszeit gedrehtes Datum wäre schlicht der falsche Tag.
 */

type DateLike = Date | string | number;

function toDate(value: DateLike): Date {
  return value instanceof Date ? value : new Date(value);
}

function format(
  value: DateLike,
  lang: Language,
  options: Intl.DateTimeFormatOptions
): string {
  return toDate(value).toLocaleDateString(LOCALE_TAGS[lang], options);
}

/** «Do, 7. August 2026» – Wochentag kurz, Monat ausgeschrieben, mit Jahr. */
export function fmtDate(d: Date, lang: Language): string {
  return format(d, lang, {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** «7. August 2026» – die ausführliche Form ohne Wochentag. */
export function fmtLong(value: DateLike, lang: Language): string {
  return format(value, lang, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** «7. Aug. 2026» – gekürzt, wo die Breite knapp ist. */
export function fmtMedium(value: DateLike, lang: Language): string {
  return format(value, lang, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** «7. Aug.» – innerhalb des laufenden Jahres, wo das Jahr klar ist. */
export function fmtShort(value: DateLike, lang: Language): string {
  return format(value, lang, { day: "numeric", month: "short" });
}

/** «07.08.2026» – rein numerisch, für Tabellen und Listen. */
export function fmtNumeric(value: DateLike, lang: Language): string {
  return format(value, lang, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** «07.08.» – numerisch ohne Jahr, für enge Spalten. */
export function fmtDayMonth(value: DateLike, lang: Language): string {
  return format(value, lang, { day: "2-digit", month: "2-digit" });
}

/** «Do, 7.» – Wochentag und Tag, für Tagesleisten. */
export function fmtWeekdayDay(value: DateLike, lang: Language): string {
  return format(value, lang, { weekday: "short", day: "numeric" });
}

/** «Do, 7. Aug.» – Wochentag mit kurzem Monat. */
export function fmtWeekdayShort(value: DateLike, lang: Language): string {
  return format(value, lang, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** «Donnerstag, 7. August» – ausgeschrieben, für Überschriften. */
export function fmtWeekdayLong(value: DateLike, lang: Language): string {
  return format(value, lang, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** Das Format des Systems – ohne eigene Vorgaben. */
export function fmtPlain(value: DateLike, lang: Language): string {
  return toDate(value).toLocaleDateString(LOCALE_TAGS[lang]);
}
