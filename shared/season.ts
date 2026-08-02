/**
 * Saisonalität im Natur-Lexikon: ein Eintrag kann eine Saison von Monat
 * `from` bis Monat `to` (je 1–12, inklusive) tragen. Wrap-around über den
 * Jahreswechsel ist erlaubt (z. B. {from: 10, to: 3} = Oktober–März).
 * Kein Saison-Feld = ganzjährig. Reine Funktionen ohne Abhängigkeiten.
 */

export interface Season {
  /** Erster Monat der Saison (1–12, inklusive). */
  from: number;
  /** Letzter Monat der Saison (1–12, inklusive) – darf vor `from` liegen. */
  to: number;
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
