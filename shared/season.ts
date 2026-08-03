/**
 * Saisonalität im Natur-Lexikon: ein Eintrag kann eine Saison von Monat
 * `from` bis Monat `to` (je 1–12, inklusive) tragen. Wrap-around über den
 * Jahreswechsel ist erlaubt (z. B. {from: 10, to: 3} = Oktober–März).
 * Kein Saison-Feld = ganzjährig. Reine Funktionen ohne Abhängigkeiten.
 *
 * Der Pilz- und Beeren-Saisonkalender (#237) sitzt auf denselben Funktionen –
 * darum liegen hier auch die Helfer für Monatsstreifen und «wie lange noch».
 */

export interface Season {
  /** Erster Monat der Saison (1–12, inklusive). */
  from: number;
  /** Letzter Monat der Saison (1–12, inklusive) – darf vor `from` liegen. */
  to: number;
}

/** Alle zwölf Monate als Zahlen 1–12 (Reihenfolge Januar → Dezember). */
export const ALL_MONTHS: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/** Monat auf 1–12 zurückfalten (13 → 1, 0 → 12) – auch für Rückwärtsschritte. */
export function normalizeMonth(month: number): number {
  return ((((Math.round(month) - 1) % 12) + 12) % 12) + 1;
}

/**
 * Liegt der Monat (1–12) in der Saison? Ohne Saison immer true (ganzjährig).
 * Wrap-around: from > to bedeutet «über den Jahreswechsel hinweg».
 */
export function inSeason(season: Season | undefined, month: number): boolean {
  if (!season) return true;
  const { from, to } = season;
  if (from <= to) return month >= from && month <= to;
  return month >= from || month <= to;
}

/**
 * Die Monate der Saison in Kalender-Reihenfolge (Januar zuerst), damit sich
 * ein Zwölf-Monats-Streifen direkt daraus einfärben lässt.
 * Ohne Saison sind es alle zwölf Monate.
 */
export function seasonMonths(season: Season | undefined): number[] {
  return ALL_MONTHS.filter(month => inSeason(season, month));
}

/** Länge der Saison in Monaten (ohne Saison: 12). */
export function seasonLength(season: Season | undefined): number {
  return seasonMonths(season).length;
}

/**
 * Wie viele Monate bis zum Saisonstart? 0 = läuft gerade.
 * Ohne Saison immer 0 (ganzjährig). Zählt vorwärts über den Jahreswechsel.
 */
export function monthsUntilSeason(
  season: Season | undefined,
  month: number
): number {
  if (inSeason(season, month)) return 0;
  const start = season!.from;
  return (start - month + 12) % 12;
}

/**
 * Einträge, die im gewünschten Monat Saison haben – die Grundlage des
 * «was hat jetzt Saison»-Filters. Einträge ohne Saison gelten als ganzjährig
 * und bleiben deshalb immer drin.
 */
export function entriesInSeason<T extends { season?: Season }>(
  entries: T[],
  month: number
): T[] {
  return entries.filter(entry => inSeason(entry.season, month));
}
