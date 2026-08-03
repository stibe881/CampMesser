/**
 * Ausleih-Tracker fürs Inventar: Ein Gegenstand gilt als verliehen, sobald
 * ein Name (`lentTo`) hinterlegt ist – `lentAt` hält fest, seit wann.
 * Zurückgebucht wird über die Prozedur inventory.setLent(id, null).
 */

/** Maximale Länge des Namens, an den ausgeliehen wurde (DB: varchar(80)). */
export const MAX_LENT_TO_LENGTH = 80;

/** Ein Inventar-Eintrag, soweit fürs Ausleihen relevant. */
export interface LentItemLike {
  lentTo?: string | null;
  lentAt?: string | null;
}

/** Ist der Gegenstand aktuell verliehen? */
export function isLent(item: LentItemLike): boolean {
  return typeof item.lentTo === "string" && item.lentTo.trim() !== "";
}

/** Wie viele Gegenstände sind aktuell verliehen? */
export function countLent(items: readonly LentItemLike[]): number {
  return items.filter(isLent).length;
}
