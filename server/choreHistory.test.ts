/**
 * Punkte-Verlauf pro Kind (#431): wochenweise Gruppierung der abgehakten
 * Ämtli. Kritisch sind der Montags-Wochenstart und dass nur Abgehaktes
 * zählt – dieselbe Regel wie in der Rangliste.
 */
import { describe, expect, it } from "vitest";
import { weekStartIso, weeklyPointsHistory } from "../shared/choreHistory";

const children = [
  { id: 1, name: "Anna" },
  { id: 2, name: "Ben" },
  { id: 3, name: "Papa", earnsPoints: false },
];
const chores = [
  { id: 10, title: "Abwaschen", points: 2 },
  { id: 11, title: "Holz holen", points: 3 },
];

function assignment(
  id: number,
  choreId: number,
  childId: number,
  day: string,
  done: boolean
) {
  return { id, choreId, childId, day, doneAt: done ? day : null };
}

describe("weekStartIso", () => {
  it("liefert den Montag der Woche", () => {
    // 2026-08-08 ist ein Samstag → Montag war der 3. August
    expect(weekStartIso("2026-08-08")).toBe("2026-08-03");
    expect(weekStartIso("2026-08-03")).toBe("2026-08-03");
    expect(weekStartIso("2026-08-09")).toBe("2026-08-03");
    expect(weekStartIso("2026-08-10")).toBe("2026-08-10");
  });

  it("kommt über Monats- und Jahresgrenzen", () => {
    expect(weekStartIso("2026-01-01")).toBe("2025-12-29");
  });
});

describe("weeklyPointsHistory", () => {
  it("gruppiert abgehakte Ämtli wochenweise pro Kind", () => {
    const history = weeklyPointsHistory(
      children,
      chores,
      [
        assignment(1, 10, 1, "2026-08-04", true), // laufende Woche, Anna, 2 P.
        assignment(2, 11, 1, "2026-07-29", true), // Vorwoche, Anna, 3 P.
        assignment(3, 10, 2, "2026-08-05", true), // laufende Woche, Ben, 2 P.
        assignment(4, 11, 2, "2026-08-06", false), // nicht abgehakt → zählt nicht
      ],
      "2026-08-08"
    );
    expect(history).not.toBeNull();
    expect(history?.weekStarts).toEqual([
      "2026-07-13",
      "2026-07-20",
      "2026-07-27",
      "2026-08-03",
    ]);
    const anna = history?.rows.find(row => row.childId === 1);
    expect(anna?.points).toEqual([0, 0, 3, 2]);
    expect(anna?.total).toBe(5);
    const ben = history?.rows.find(row => row.childId === 2);
    expect(ben?.points).toEqual([0, 0, 0, 2]);
    expect(history?.maxPoints).toBe(3);
  });

  it("lässt Erwachsene ohne Punktesammeln weg (#370)", () => {
    const history = weeklyPointsHistory(
      children,
      chores,
      [
        assignment(1, 10, 3, "2026-08-04", true),
        assignment(2, 10, 1, "2026-08-04", true),
      ],
      "2026-08-08"
    );
    expect(history?.rows.map(row => row.childId)).toEqual([1, 2]);
  });

  it("ignoriert Wochen ausserhalb des Fensters", () => {
    const history = weeklyPointsHistory(
      children,
      chores,
      [
        assignment(1, 10, 1, "2026-05-01", true), // längst vorbei
        assignment(2, 10, 1, "2026-08-04", true),
      ],
      "2026-08-08"
    );
    const anna = history?.rows.find(row => row.childId === 1);
    expect(anna?.total).toBe(2);
  });

  it("gibt null zurück, wenn nichts abgehakt ist", () => {
    expect(
      weeklyPointsHistory(
        children,
        chores,
        [assignment(1, 10, 1, "2026-08-04", false)],
        "2026-08-08"
      )
    ).toBeNull();
    expect(weeklyPointsHistory([], chores, [], "2026-08-08")).toBeNull();
  });
});
