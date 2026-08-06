import { describe, expect, it } from "vitest";
import { buildTripSectionCounts } from "@shared/tripSectionCounts";

/**
 * Die Zahlen an den zugeklappten Abschnitten (#346).
 *
 * WORAUF ES ANKOMMT: Eine Reise ohne Einträge muss eine Zeile mit Nullen
 * bekommen und nicht durchfallen – sonst zeigt der Balken gar nichts, und
 * «keine Ahnung» sähe genauso aus wie «nichts drin».
 */
const note = (tripId: number, kind: string, done = false) => ({
  tripId,
  kind,
  done,
});

describe("Zähler der Reise-Abschnitte", () => {
  it("zählt offene Aufgaben, aber keine Nachrichten", () => {
    const [row] = buildTripSectionCounts([1], {
      boardNotes: [
        note(1, "task"),
        note(1, "task"),
        note(1, "task", true),
        note(1, "message"),
      ],
      journal: [],
      guestbook: [],
      changes: [],
    });
    expect(row.openTasks).toBe(2);
  });

  it("hält die Reisen auseinander", () => {
    const rows = buildTripSectionCounts([1, 2], {
      boardNotes: [note(1, "task"), note(2, "task"), note(2, "task")],
      journal: [{ tripId: 2, count: 5 }],
      guestbook: [],
      changes: [],
    });
    expect(rows[0]).toMatchObject({ tripId: 1, openTasks: 1, journal: 0 });
    expect(rows[1]).toMatchObject({ tripId: 2, openTasks: 2, journal: 5 });
  });

  it("eine Reise ohne alles bekommt Nullen statt gar keine Zeile", () => {
    // Fehlt die Zeile, sucht die Oberfläche ins Leere und zeigt nichts –
    // ununterscheidbar von «noch nicht geladen».
    const rows = buildTripSectionCounts([7], {
      boardNotes: [],
      journal: [],
      guestbook: [],
      changes: [],
    });
    expect(rows).toEqual([
      { tripId: 7, openTasks: 0, journal: 0, guestbook: 0, changes: 0 },
    ]);
  });

  it("Zeilen zu unbekannten Reisen werden ignoriert", () => {
    // Käme je eine fremde tripId mit, dürfte sie keine Zeile erzeugen –
    // die Liste der Ids ist die Wahrheit, nicht die Rohdaten.
    const rows = buildTripSectionCounts([1], {
      boardNotes: [note(99, "task")],
      journal: [{ tripId: 99, count: 3 }],
      guestbook: [],
      changes: [],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].openTasks).toBe(0);
  });

  it("Gästebuch und Verlauf kommen unverändert durch", () => {
    const [row] = buildTripSectionCounts([4], {
      boardNotes: [],
      journal: [],
      guestbook: [{ tripId: 4, count: 2 }],
      changes: [{ tripId: 4, count: 11 }],
    });
    expect(row.guestbook).toBe(2);
    expect(row.changes).toBe(11);
  });
});
