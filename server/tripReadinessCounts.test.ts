import { describe, expect, it } from "vitest";
import { buildTripReadinessCounts } from "@shared/tripReadinessCounts";
import { tripReadiness } from "@shared/tripReadiness";

/**
 * Die Bereitschafts-Zahlen aller Reisen auf einmal (#362).
 *
 * WORAUF ES ANKOMMT: Die Zahl am zugeklappten Schalter muss dieselbe sein
 * wie die im aufgeklappten Abschnitt. Sie entsteht auf zwei Wegen – hier
 * aus der gebündelten Abfrage, dort aus den drei Einzelabfragen – und
 * genau darum wird hier bis zur fertigen Bewertung durchgerechnet.
 */
const trip = (id: number, packListId: number | null = null) => ({
  id,
  startDate: "2026-08-10",
  endDate: "2026-08-12",
  packListId,
});

const leer = { packLists: [], menuSlots: [], shopping: [] };

describe("Bereitschafts-Zahlen", () => {
  it("ohne Reisen nichts", () => {
    expect(buildTripReadinessCounts([], leer)).toEqual([]);
  });

  it("eine Reise ohne Daten wird zu Nullen, nicht zu einer Lücke", () => {
    const [row] = buildTripReadinessCounts([trip(1)], leer);
    expect(row.tripId).toBe(1);
    expect(row.packList).toBeNull();
    // Drei Tage × drei Haupt-Mahlzeiten, keine belegt
    expect(row.menu).toEqual({ mainSlots: 9, emptySlots: 9 });
    expect(row.shopping).toEqual({ open: 0, total: 0 });
  });

  it("verknüpfte, aber leere Packliste ist NICHT dasselbe wie keine", () => {
    // «Keine Liste» und «leere Liste» sind zwei verschiedene Meldungen.
    const [row] = buildTripReadinessCounts([trip(1, 7)], leer);
    expect(row.packList).toEqual({ checked: 0, total: 0 });
  });

  it("Packlisten werden über die Liste gezählt, nicht über die Reise", () => {
    // Zwei Reisen dürfen dieselbe Liste verwenden.
    const rows = buildTripReadinessCounts([trip(1, 7), trip(2, 7)], {
      ...leer,
      packLists: [{ listId: 7, checked: 3, total: 10 }],
    });
    expect(rows[0].packList).toEqual({ checked: 3, total: 10 });
    expect(rows[1].packList).toEqual({ checked: 3, total: 10 });
  });

  it("belegte Menü-Slots zählen nur innerhalb der Reisetage", () => {
    const [row] = buildTripReadinessCounts([trip(1)], {
      ...leer,
      menuSlots: [
        { tripId: 1, day: "2026-08-10", meal: "dinner" },
        // Znüni zählt nicht als Haupt-Slot
        { tripId: 1, day: "2026-08-10", meal: "snack" },
        // Ausserhalb des Zeitraums
        { tripId: 1, day: "2026-08-20", meal: "dinner" },
      ],
    });
    expect(row.menu).toEqual({ mainSlots: 9, emptySlots: 8 });
  });

  it("die Zahl am Schalter stimmt mit der Bewertung überein", () => {
    const [row] = buildTripReadinessCounts([trip(1, 7)], {
      packLists: [{ listId: 7, checked: 10, total: 10 }],
      menuSlots: [],
      shopping: [{ tripId: 1, open: 2, total: 5 }],
    });
    const readiness = tripReadiness({
      hasSpot: true,
      hasArrivalTime: true,
      packList: row.packList,
      menu: row.menu,
      shopping: row.shopping,
      sharedTrip: true,
    });
    // Offen: Menüplan (9 leere Slots) und 2 Einkäufe – Packliste ist fertig,
    // Platz und Ankunftszeit stehen.
    expect(readiness.openCount).toBe(2);
  });
});
