/**
 * Die Zahlen an den ZUGEKLAPPTEN Abschnitten einer Reise (#346).
 *
 * WARUM ES DAS BRAUCHT: Eine Reise stapelt ein Dutzend zugeklappter
 * Balken – Tagebuch, Reisekasse, Pinnwand, Verlauf, Gästebuch. Alle sehen
 * gleich aus, und keiner verriet, ob etwas drin ist. Wer wissen wollte,
 * ob im Gästebuch ein Eintrag steht, musste aufklappen und warten.
 *
 * WARUM HIER UND NICHT IM SERVER: Das Zusammenführen der vier Rohlisten
 * zu einer Zeile je Reise ist reine Rechnerei ohne Datenbank – hier ist
 * sie prüfbar. Ausserdem zählt die Pinnwand mit DERSELBEN Funktion wie
 * die Oberfläche (`tripBoardCounts`), statt die Regel «was ist eine
 * offene Aufgabe» ein zweites Mal in SQL zu formulieren.
 *
 * FEHLENDE REISEN SIND NULLEN, nicht Lücken: Eine Reise ohne Gästebuch
 * kommt in der Rohliste gar nicht vor, soll aber trotzdem eine Zeile
 * bekommen – der Aufrufer sucht sonst ins Leere und zeigt gar nichts.
 */
import { tripBoardCounts } from "./tripBoard";

/** Nur, was zum Zählen nötig ist – der Endpunkt holt keine Texte. */
type CountableNote = { tripId: number; kind: string; done: boolean };

/** Eine Zeile je Reise – alle Zahlen, die an einem Balken stehen können. */
export interface TripSectionCounts {
  tripId: number;
  /** Pinnwand: NUR die offenen Aufgaben; Nachrichten zählen nicht. */
  openTasks: number;
  /** Tages-Journal: Anzahl beschriebener Tage. */
  journal: number;
  /** Gästebuch: Anzahl Einträge. */
  guestbook: number;
  /** Änderungsverlauf: Anzahl festgehaltener Änderungen. */
  changes: number;
}

/** Rohform aus der Datenbank: pro Tabelle eine Liste. */
export interface TripSectionCountsInput {
  boardNotes: readonly CountableNote[];
  journal: readonly { tripId: number; count: number }[];
  guestbook: readonly { tripId: number; count: number }[];
  changes: readonly { tripId: number; count: number }[];
}

/** Zählt eine `{tripId, count}`-Liste in eine Map um. */
function toMap(rows: readonly { tripId: number; count: number }[]) {
  const map = new Map<number, number>();
  rows.forEach(row => map.set(row.tripId, row.count));
  return map;
}

export function buildTripSectionCounts(
  tripIds: readonly number[],
  raw: TripSectionCountsInput
): TripSectionCounts[] {
  const notesByTrip = new Map<number, CountableNote[]>();
  raw.boardNotes.forEach(note => {
    const list = notesByTrip.get(note.tripId);
    if (list) list.push(note);
    else notesByTrip.set(note.tripId, [note]);
  });
  const journal = toMap(raw.journal);
  const guestbook = toMap(raw.guestbook);
  const changes = toMap(raw.changes);

  return tripIds.map(tripId => ({
    tripId,
    openTasks: tripBoardCounts(notesByTrip.get(tripId) ?? []).openTasks,
    journal: journal.get(tripId) ?? 0,
    guestbook: guestbook.get(tripId) ?? 0,
    changes: changes.get(tripId) ?? 0,
  }));
}
