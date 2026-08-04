/**
 * Papierkorb (#295): Gelöschtes 30 Tage lang wiederherstellen.
 *
 * WARUM EIN SCHNAPPSCHUSS UND KEIN «deletedAt»-FELD: Der übliche Weg wäre,
 * jeder Tabelle eine Spalte `deletedAt` zu geben und jede Abfrage zu
 * filtern. Genau daran gehen solche Papierkörbe kaputt: EINE vergessene
 * Bedingung, und eine gelöschte Reise steht wieder in der Liste, im
 * Menüplan oder in der Statistik. Bei über fünfzig Tabellen und Hunderten
 * von Abfragen ist das keine Frage des Fleisses, sondern eine Frage der
 * Zeit.
 *
 * Deshalb bleibt das Löschen ein echtes DELETE. Vorher wandert die
 * betroffene Zeile samt ihrer Kinder als JSON-Schnappschuss in eine
 * eigene Tabelle. Alle bestehenden Abfragen bleiben unverändert – was
 * gelöscht ist, ist aus ihrer Sicht wirklich weg. Wiederherstellen heisst
 * einfügen.
 *
 * DIE IDS BLEIBEN ERHALTEN. Wiederhergestellt wird mit der ALTEN Id, nicht
 * mit einer neuen: Sonst wären geteilte Links, QR-Codes und Verweise aus
 * anderen Tabellen nach der Rettung tot. Ein AUTO_INCREMENT vergibt eine
 * einmal verbrauchte Nummer nicht erneut, die alte Id ist also frei.
 *
 * DIE DATEIEN BLEIBEN LIEGEN. Fotos werden beim Löschen NICHT vom
 * Webspace entfernt, sondern erst, wenn der Papierkorb-Eintrag abläuft.
 * Eine Reise ohne ihre Bilder wiederherzustellen wäre keine
 * Wiederherstellung.
 */
import { l4, type L4 } from "./i18n";

/** Was in den Papierkorb wandern kann. */
export const TRASH_KINDS = [
  "trip",
  "packList",
  "spot",
  "note",
  "recipe",
  "track",
] as const;
export type TrashKind = (typeof TRASH_KINDS)[number];

/** Wie lange Gelöschtes aufgehoben wird. */
export const RETENTION_DAYS = 30;

const DAY_MS = 86400000;

export const TRASH_KIND_LABELS: Record<TrashKind, L4> = {
  trip: l4("Reise", "Voyage", "Viaggio", "Trip"),
  packList: l4(
    "Packliste",
    "Liste de bagages",
    "Lista bagagli",
    "Packing list"
  ),
  spot: l4("Zeltplatz", "Emplacement", "Piazzola", "Pitch"),
  note: l4("Notiz", "Note", "Nota", "Note"),
  recipe: l4("Rezept", "Recette", "Ricetta", "Recipe"),
  track: l4("Wanderung", "Randonnée", "Escursione", "Hike"),
};

export function isTrashKind(value: string): value is TrashKind {
  return (TRASH_KINDS as readonly string[]).indexOf(value) >= 0;
}

/** Ein Eintrag im Papierkorb, so wie ihn die Ansicht braucht. */
export interface TrashEntryLike {
  id: number;
  kind: string;
  label: string;
  detail: string | null;
  deletedAt: Date | string;
}

function timeOf(value: Date | string | number): number {
  if (typeof value === "number") return value;
  if (value instanceof Date) return value.getTime();
  return new Date(value).getTime();
}

/** Wann ein Eintrag endgültig verschwindet. */
export function expiresAt(deletedAt: Date | string | number): number {
  return timeOf(deletedAt) + RETENTION_DAYS * DAY_MS;
}

/**
 * Wie viele Tage der Eintrag noch bleibt – aufgerundet, damit «noch 1 Tag»
 * bis zur letzten Stunde stehen bleibt und nicht vorzeitig auf 0 springt.
 * 0 heisst: abgelaufen.
 */
export function daysLeft(
  deletedAt: Date | string | number,
  now: number
): number {
  const remaining = expiresAt(deletedAt) - now;
  return remaining <= 0 ? 0 : Math.ceil(remaining / DAY_MS);
}

export function isExpired(
  deletedAt: Date | string | number,
  now: number
): boolean {
  return expiresAt(deletedAt) <= now;
}

/**
 * Die Einträge für die Ansicht: abgelaufene fliegen raus, der Rest steht
 * mit dem zuletzt Gelöschten zuoberst.
 *
 * ABGELAUFENE WERDEN NICHT ANGEZEIGT, auch wenn sie noch in der Tabelle
 * stehen. Der Aufräum-Job läuft über einen Cronjob, und ein Cronjob kann
 * ausfallen; ein Eintrag mit «noch 0 Tage», der sich nicht mehr
 * wiederherstellen lässt, wäre ein Versprechen, das die App nicht hält.
 */
export function visibleTrash<T extends TrashEntryLike>(
  entries: readonly T[],
  now: number
): T[] {
  return entries
    .filter(entry => !isExpired(entry.deletedAt, now))
    .slice()
    .sort((a, b) => timeOf(b.deletedAt) - timeOf(a.deletedAt));
}

/** Anzahl je Art – für die Übersicht. Nur Sichtbares zählt. */
export function countByKind(
  entries: readonly TrashEntryLike[],
  now: number
): Record<string, number> {
  const counts: Record<string, number> = {};
  visibleTrash(entries, now).forEach(entry => {
    counts[entry.kind] = (counts[entry.kind] ?? 0) + 1;
  });
  return counts;
}

/**
 * Einträge, die der Aufräum-Job endgültig löschen muss.
 *
 * Bewusst dieselbe Grenze wie in `isExpired`: Was die Ansicht nicht mehr
 * zeigt, darf der Job entfernen – und nichts, was sie noch zeigt.
 */
export function expiredEntries<T extends TrashEntryLike>(
  entries: readonly T[],
  now: number
): T[] {
  return entries.filter(entry => isExpired(entry.deletedAt, now));
}

/** Beschriftung auf einen vernünftigen Rest kürzen. */
export const MAX_LABEL_LENGTH = 120;

export function trimLabel(value: string, fallback: string): string {
  const clean = value.trim().replace(/\s+/g, " ");
  if (!clean) return fallback;
  return clean.length > MAX_LABEL_LENGTH
    ? `${clean.slice(0, MAX_LABEL_LENGTH - 1)}…`
    : clean;
}
