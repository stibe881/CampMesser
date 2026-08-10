/**
 * Tagesplan einer Reise (#666, Nutzerwunsch 10.08.2026): pro Reisetag
 * eintragen, was ansteht – mit optionaler Zeit und Abhaken unterwegs.
 *
 * Reine Sortier- und Gruppier-Logik ohne DOM: Reise-Detail, Heute-Ansicht
 * und Druckbericht teilen sich dieselben Funktionen; Tests in
 * server/tripPlan.test.ts.
 */

export const TRIP_PLAN_TITLE_MAX_LENGTH = 140;
/** Obergrenze pro Reise – schützt vor Amok-Skripten, nicht vor Planern. */
export const MAX_TRIP_PLAN_ITEMS = 200;

/** Ein Plan-Eintrag, soweit für Sortierung und Anzeige nötig. */
export interface TripPlanItemLike {
  id: number;
  day: string;
  title: string;
  /** «HH:MM» oder null = irgendwann an dem Tag. */
  timeAt: string | null;
  done: boolean;
}

/**
 * Sortierung fürs Auge: nach Tag, innerhalb des Tags Einträge MIT Zeit
 * zuerst (chronologisch), dann die ohne Zeit in Erfassungs-Reihenfolge.
 * «HH:MM» sortiert als Text korrekt.
 */
export function sortPlanItems<T extends TripPlanItemLike>(
  items: readonly T[]
): T[] {
  return [...items].sort((a, b) => {
    if (a.day !== b.day) return a.day < b.day ? -1 : 1;
    if (a.timeAt !== null && b.timeAt !== null && a.timeAt !== b.timeAt) {
      return a.timeAt < b.timeAt ? -1 : 1;
    }
    if (a.timeAt !== null && b.timeAt === null) return -1;
    if (a.timeAt === null && b.timeAt !== null) return 1;
    return a.id - b.id;
  });
}

/** Die Einträge EINES Tags, fertig sortiert. */
export function planItemsForDay<T extends TripPlanItemLike>(
  items: readonly T[],
  day: string
): T[] {
  return sortPlanItems(items.filter(item => item.day === day));
}

/** Tage mit mindestens einem Eintrag, chronologisch – für den Druck. */
export function planDays(items: readonly TripPlanItemLike[]): string[] {
  const days = new Set<string>();
  items.forEach(item => days.add(item.day));
  return Array.from(days).sort();
}

/** Fortschritt über den ganzen Plan («3 von 7 erledigt»). */
export function planProgress(items: readonly TripPlanItemLike[]): {
  total: number;
  done: number;
} {
  let done = 0;
  items.forEach(item => {
    if (item.done) done += 1;
  });
  return { total: items.length, done };
}

/** Gültige Zeit «HH:MM» (00:00–23:59)? Leer/Unsinn ergibt null. */
export function sanitizePlanTime(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  return m ? m[0] : null;
}
