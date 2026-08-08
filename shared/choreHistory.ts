/**
 * Punkte-Verlauf pro Kind (#431): Die Rangliste zeigt nur den Stand –
 * wer diese Woche aufgeholt hat, sieht man ihr nicht an. Der Verlauf
 * gruppiert die abgehakten Ämtli wochenweise (Montag als Wochenstart,
 * wie im Kalender üblich), damit der Wettbewerb eine Richtung bekommt.
 *
 * Alles pure Rechnung auf den bestehenden Zuteilungen – es gibt keine
 * eigene Verlaufs-Tabelle, der Verlauf IST die Zuteilungshistorie.
 */
import {
  countsForPoints,
  dayIndex,
  type AssignmentLike,
  type ChildLike,
  type ChoreLike,
} from "./chores";
import { shiftIsoDay } from "./localDate";

/** Mehr Wochen zeigen nur noch leere Balken – ein Camp dauert selten länger. */
export const CHORE_HISTORY_WEEKS = 4;

/** Montag der Woche, in der der Tag liegt (1970-01-01 war ein Donnerstag). */
export function weekStartIso(iso: string): string {
  return shiftIsoDay(iso, -(((dayIndex(iso) + 3) % 7) + 7) % 7);
}

export interface ChildWeeklyPoints {
  childId: number;
  name: string;
  /** Punkte pro Woche, älteste zuerst – gleich lang wie `weekStarts`. */
  points: number[];
  total: number;
}

export interface WeeklyPointsHistory {
  /** Montage der Wochen, älteste zuerst; die letzte ist die laufende. */
  weekStarts: string[];
  rows: ChildWeeklyPoints[];
  /** Grösster Wochenwert über alle Kinder – zum Skalieren der Balken. */
  maxPoints: number;
}

/**
 * Wochenweise Punkte je Kind über die letzten Wochen bis `today`.
 * Gezählt wird wie in der Rangliste: nur Abgehaktes, nur Kinder, die
 * Punkte sammeln. null, wenn es (noch) nichts zu zeigen gibt.
 */
export function weeklyPointsHistory(
  children: readonly ChildLike[],
  chores: readonly ChoreLike[],
  assignments: readonly AssignmentLike[],
  today: string,
  weeks: number = CHORE_HISTORY_WEEKS
): WeeklyPointsHistory | null {
  const currentStart = weekStartIso(today);
  const weekStarts = Array.from({ length: weeks }, (_, i) =>
    shiftIsoDay(currentStart, (i - (weeks - 1)) * 7)
  );
  const indexByStart = new Map(weekStarts.map((start, i) => [start, i]));
  const pointsByChore = new Map(chores.map(chore => [chore.id, chore.points]));

  const rows: ChildWeeklyPoints[] = children
    .filter(countsForPoints)
    .map(child => ({
      childId: child.id,
      name: child.name,
      points: weekStarts.map(() => 0),
      total: 0,
    }));
  const rowByChild = new Map(rows.map(row => [row.childId, row]));

  for (const assignment of assignments) {
    if (assignment.doneAt === null || assignment.childId === null) continue;
    const row = rowByChild.get(assignment.childId);
    if (!row) continue;
    const week = indexByStart.get(weekStartIso(assignment.day));
    if (week === undefined) continue;
    const points = pointsByChore.get(assignment.choreId) ?? 0;
    row.points[week] += points;
    row.total += points;
  }

  const maxPoints = Math.max(...rows.map(row => Math.max(...row.points)), 0);
  if (rows.length === 0 || maxPoints === 0) return null;
  return { weekStarts, rows, maxPoints };
}
