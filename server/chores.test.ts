import { describe, expect, it } from "vitest";
import {
  clampPoints,
  dayIndex,
  dayProgress,
  DEFAULT_CHORE_POINTS,
  MAX_CHORE_POINTS,
  MIN_CHORE_POINTS,
  rotateAssignments,
  scoreboard,
} from "@shared/chores";

const chores = [
  { id: 1, title: "Abwaschen", points: 3 },
  { id: 2, title: "Holz holen", points: 2 },
  { id: 3, title: "Tisch decken", points: 1 },
];
const children = [
  { id: 10, name: "Anna" },
  { id: 11, name: "Ben" },
];

describe("Ämtli-Plan (#270)", () => {
  it("hält die Punkte im erlaubten Bereich", () => {
    expect(clampPoints(3)).toBe(3);
    expect(clampPoints(0)).toBe(MIN_CHORE_POINTS);
    expect(clampPoints(99)).toBe(MAX_CHORE_POINTS);
    expect(clampPoints(2.4)).toBe(2);
    expect(clampPoints(Number.NaN)).toBe(DEFAULT_CHORE_POINTS);
  });

  it("verteilt reihum, sodass niemand alles bekommt", () => {
    const plan = rotateAssignments(chores, children, "2026-08-04");
    expect(plan).toHaveLength(3);
    // Zwei Kinder, drei Ämtli: die Verteilung wechselt sich ab
    expect(plan[0].childId).not.toBe(plan[1].childId);
    expect(plan[1].childId).not.toBe(plan[2].childId);
  });

  it("verschiebt die Reihenfolge jeden Tag um eins", () => {
    const today = rotateAssignments(chores, children, "2026-08-04");
    const tomorrow = rotateAssignments(chores, children, "2026-08-05");
    // Dasselbe Ämtli geht am nächsten Tag an das andere Kind
    expect(today[0].childId).not.toBe(tomorrow[0].childId);
    // Übermorgen ist die Runde wieder bei der ersten Person (zwei Kinder)
    const dayAfter = rotateAssignments(chores, children, "2026-08-06");
    expect(dayAfter[0].childId).toBe(today[0].childId);
  });

  it("ohne Kinder wird nichts verteilt, statt zu raten", () => {
    expect(rotateAssignments(chores, [], "2026-08-04")).toEqual([]);
  });

  it("kaputte Datumsangaben brechen die Verteilung nicht", () => {
    expect(dayIndex("2026-08-04")).toBeGreaterThan(20000);
    expect(dayIndex("kein Datum")).toBe(0);
    expect(rotateAssignments(chores, children, "kein Datum")).toHaveLength(3);
  });

  it("Punkte gibt es erst beim Abhaken", () => {
    const assignments = [
      {
        id: 1,
        choreId: 1,
        childId: 10,
        day: "2026-08-04",
        doneAt: new Date(),
      },
      { id: 2, choreId: 2, childId: 10, day: "2026-08-04", doneAt: null },
      {
        id: 3,
        choreId: 3,
        childId: 11,
        day: "2026-08-04",
        doneAt: new Date(),
      },
    ];
    const board = scoreboard(children, chores, assignments);
    expect(board[0]).toMatchObject({ name: "Anna", points: 3, done: 1 });
    expect(board[1]).toMatchObject({ name: "Ben", points: 1, done: 1 });
  });

  it("bei Gleichstand entscheidet die Zahl der Ämtli, dann der Name", () => {
    const assignments = [
      { id: 1, choreId: 3, childId: 10, day: "d", doneAt: new Date() },
      { id: 2, choreId: 3, childId: 10, day: "d", doneAt: new Date() },
      { id: 3, choreId: 1, childId: 11, day: "d", doneAt: null },
    ];
    const board = scoreboard(children, chores, assignments);
    expect(board.map(r => r.name)).toEqual(["Anna", "Ben"]);
    // Ohne erledigte Ämtli bleibt Ben bei null Punkten
    expect(board[1].points).toBe(0);
  });

  it("zählt den Tagesfortschritt", () => {
    expect(dayProgress([])).toEqual({
      done: 0,
      total: 0,
      percent: 0,
      allDone: false,
    });
    const assignments = [
      { id: 1, choreId: 1, childId: 10, day: "d", doneAt: new Date() },
      { id: 2, choreId: 2, childId: 11, day: "d", doneAt: null },
    ];
    expect(dayProgress(assignments)).toEqual({
      done: 1,
      total: 2,
      percent: 50,
      allDone: false,
    });
    expect(dayProgress([assignments[0]]).allDone).toBe(true);
  });
});
