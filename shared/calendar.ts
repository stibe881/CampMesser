/**
 * Reine Kalender-Gitter-Logik für die Monats-Ansicht der Reisen:
 * monthGrid liefert die Wochen eines Monats (Start Montag) als
 * ISO-Datums-Zellen inkl. Überhang aus Nachbar-Monaten. Ohne Zeitzonen-
 * Fallen (alles über Date.UTC) – von Client und Tests genutzt.
 */

/** Eine Zelle des Monats-Gitters. */
export interface MonthGridDay {
  /** "YYYY-MM-DD" */
  iso: string;
  /** true, wenn der Tag im angefragten Monat liegt (kein Überhang). */
  inMonth: boolean;
}

/**
 * Wochen eines Monats (month: 1–12) als Array von 7er-Zeilen, Start Montag.
 * Die erste Zeile beginnt mit dem Montag vor (oder am) Monatsersten, die
 * letzte endet mit dem Sonntag nach (oder am) Monatsletzten.
 */
export function monthGrid(year: number, month: number): MonthGridDay[][] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  // getUTCDay(): So=0 … Sa=6 → Offset zum Montag der ersten Zeile
  const offset = (first.getUTCDay() + 6) % 7;
  const cursor = new Date(Date.UTC(year, month - 1, 1 - offset));
  const weeks: MonthGridDay[][] = [];
  do {
    const week: MonthGridDay[] = [];
    for (let i = 0; i < 7; i++) {
      week.push({
        iso: cursor.toISOString().slice(0, 10),
        inMonth: cursor.getUTCMonth() === month - 1,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    weeks.push(week);
    // Nach jeder Zeile steht der Cursor auf dem nächsten Montag – liegt der
    // noch im Monat, braucht es eine weitere Zeile.
  } while (
    cursor.getUTCMonth() === month - 1 &&
    cursor.getUTCFullYear() === year
  );
  return weeks;
}

/** Monat um delta verschieben, mit Jahres-Übertrag (month: 1–12). */
export function addMonths(
  year: number,
  month: number,
  delta: number
): { year: number; month: number } {
  const zeroBased = year * 12 + (month - 1) + delta;
  return {
    year: Math.floor(zeroBased / 12),
    month: (((zeroBased % 12) + 12) % 12) + 1,
  };
}
