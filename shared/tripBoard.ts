/**
 * Pinnwand einer Reise (#245): Zettel-Arten, Längenregeln und die
 * Sortierung. Reine Funktionen ohne DOM/React – Router, Reise-Seite und
 * Tests benutzen dieselben Regeln, damit ein Zettel serverseitig genau so
 * gekürzt wird, wie ihn die Eingabezeile begrenzt.
 */
import { l4, type L4 } from "./i18n";

/** Gespeicherte Zettel-Arten (englische Schlüssel wie bei anderen Enums). */
export const TRIP_BOARD_KINDS = ["message", "task"] as const;
export type TripBoardKind = (typeof TRIP_BOARD_KINDS)[number];

/** Anzeige-Labels der Arten – der Schlüssel bleibt in der Datenbank. */
export const TRIP_BOARD_KIND_LABELS: Record<TripBoardKind, L4> = {
  message: l4("Nachricht", "Message", "Messaggio", "Message"),
  task: l4("Aufgabe", "Tâche", "Compito", "Task"),
};

/** Maximale Länge eines Zettels (DB: varchar(500)). */
export const TRIP_BOARD_TEXT_MAX_LENGTH = 500;

/** Unbekannte Arten landen bei «Nachricht» – der harmlosere Fall. */
export function normalizeTripBoardKind(value: unknown): TripBoardKind {
  return (TRIP_BOARD_KINDS as readonly unknown[]).includes(value)
    ? (value as TripBoardKind)
    : "message";
}

/**
 * Zettel-Text säubern: Zeilenenden vereinheitlichen, Rand-Leerraum weg,
 * mehr als zwei Leerzeilen am Stück zusammenziehen und auf die
 * Datenbank-Länge kürzen. Geschnitten wird zwischen ganzen Code Points,
 * damit ein Emoji am Ende nicht halbiert wird.
 */
export function normalizeTripBoardText(raw: string): string {
  const cleaned = raw
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (cleaned.length <= TRIP_BOARD_TEXT_MAX_LENGTH) return cleaned;
  // Array.from zerlegt in Code Points, nicht in UTF-16-Einheiten
  return Array.from(cleaned).slice(0, TRIP_BOARD_TEXT_MAX_LENGTH).join("");
}

/** Taugt der Text als Zettel? Leer (auch nur Leerraum) zählt nicht. */
export function isValidTripBoardText(raw: string): boolean {
  return normalizeTripBoardText(raw).length > 0;
}

/** Minimalform eines Zettels für Sortierung und Zählung. */
export interface TripBoardEntryLike {
  id: number;
  kind: string;
  done: boolean;
  createdAt: Date | string | number;
}

/** Zeitstempel als Zahl; unbrauchbare Werte gelten als «uralt». */
function createdMs(value: Date | string | number): number {
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

/**
 * Reihenfolge der Pinnwand: neuste zuoberst – erledigte Aufgaben rutschen
 * aber ans Ende, sonst verdrängt ein frisch abgehakter «Brot holen» genau
 * die Zurufe, die noch jemand lesen muss. Bei gleichem Zeitstempel
 * entscheidet die höhere Id (Sekundenauflösung reicht sonst nicht).
 * Sortiert wird auf einer Kopie – die Eingabe bleibt unangetastet.
 */
export function sortTripBoardEntries<T extends TripBoardEntryLike>(
  entries: readonly T[]
): T[] {
  return entries.slice().sort((a, b) => {
    const aDone = isTripBoardDone(a) ? 1 : 0;
    const bDone = isTripBoardDone(b) ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    const diff = createdMs(b.createdAt) - createdMs(a.createdAt);
    return diff !== 0 ? diff : b.id - a.id;
  });
}

/** Erledigt ist nur eine ABGEHAKTE AUFGABE – Nachrichten nie. */
export function isTripBoardDone(entry: TripBoardEntryLike): boolean {
  return normalizeTripBoardKind(entry.kind) === "task" && entry.done;
}

/** Zählwerk für die Kopfzeile: Nachrichten, offene und erledigte Aufgaben. */
/**
 * Gezählt werden nur Art und Haken – deshalb genügt der Funktion genau
 * das (#346). Der Zähler-Endpunkt holt für die zugeklappten Abschnitte
 * bewusst NUR diese zwei Spalten und käme mit `TripBoardEntryLike` (samt
 * Id und Zeitstempel) nicht durch.
 */
export function tripBoardCounts(
  entries: readonly Pick<TripBoardEntryLike, "kind" | "done">[]
): {
  messages: number;
  openTasks: number;
  doneTasks: number;
} {
  let messages = 0;
  let openTasks = 0;
  let doneTasks = 0;
  entries.forEach(entry => {
    if (normalizeTripBoardKind(entry.kind) !== "task") {
      messages += 1;
    } else if (entry.done) {
      doneTasks += 1;
    } else {
      openTasks += 1;
    }
  });
  return { messages, openTasks, doneTasks };
}

/**
 * Darf dieses Konto den Zettel löschen? Wer ihn angepinnt hat, räumt ihn
 * selbst weg; zusätzlich darf die Besitzerin/der Besitzer der Reise
 * aufräumen. Mitreisende dürfen fremde Zettel bewusst NICHT löschen –
 * abhaken genügt.
 */
export function canRemoveTripBoardEntry(
  entryUserId: number,
  tripOwnerUserId: number,
  userId: number
): boolean {
  return entryUserId === userId || tripOwnerUserId === userId;
}
