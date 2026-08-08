import { describe, expect, it } from "vitest";
import {
  choresForDay,
  clampPoints,
  dayIndex,
  dayProgress,
  DEFAULT_CHORE_POINTS,
  MAX_CHORE_POINTS,
  MIN_CHORE_POINTS,
  isoWeekday,
  parseChoreWeekdays,
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

/**
 * Punkte-Schalter je Person (#370).
 *
 * Ämtli machen alle – die Rangliste ist der Wettbewerb der Kinder. Ein
 * Vater mit 40 Punkten an der Spitze macht sie sinnlos.
 */
describe("Punkte-Schalter", () => {
  const chores = [{ id: 1, title: "Abwaschen", points: 3 }];
  const assignments = [
    {
      id: 1,
      choreId: 1,
      childId: 1,
      day: "2026-08-06",
      doneAt: "2026-08-06T18:00:00Z",
    },
    {
      id: 2,
      choreId: 1,
      childId: 2,
      day: "2026-08-07",
      doneAt: "2026-08-07T18:00:00Z",
    },
  ];

  it("wer nicht mitzählt, steht nicht in der Rangliste", () => {
    const rows = scoreboard(
      [
        { id: 1, name: "Mia" },
        { id: 2, name: "Papa", earnsPoints: false },
      ],
      chores,
      assignments
    );
    expect(rows.map(r => r.name)).toEqual(["Mia"]);
  });

  it("ohne Angabe zählt eine Person mit", () => {
    // Profile aus der Zeit vor der Spalte sollen bleiben, wie sie waren.
    const rows = scoreboard([{ id: 1, name: "Mia" }], chores, assignments);
    expect(rows[0].points).toBe(3);
  });

  it("verteilt wird trotzdem an alle", () => {
    // Der Schalter entscheidet über die PUNKTE, nicht über die Arbeit.
    const result = rotateAssignments(
      [
        { id: 1, title: "Abwaschen", points: 1 },
        { id: 2, title: "Holz holen", points: 1 },
      ],
      [
        { id: 1, name: "Mia" },
        { id: 2, name: "Papa", earnsPoints: false },
      ],
      "2026-08-06"
    );
    expect(new Set(result.map(r => r.childId))).toEqual(new Set([1, 2]));
  });
});

describe("Ämtli-Wochentage (#447)", () => {
  it("parst gültige Listen und verwirft Unsinn", () => {
    expect(parseChoreWeekdays(JSON.stringify([2, 5]))).toEqual([2, 5]);
    expect(parseChoreWeekdays(JSON.stringify([5, 2, 2, 9, 0, "x"]))).toEqual([
      2, 5,
    ]);
    expect(parseChoreWeekdays(null)).toBeNull();
    expect(parseChoreWeekdays("kaputt")).toBeNull();
    // Alle sieben Tage = keine Einschränkung
    expect(
      parseChoreWeekdays(JSON.stringify([1, 2, 3, 4, 5, 6, 7]))
    ).toBeNull();
    expect(parseChoreWeekdays("[]")).toBeNull();
  });

  it("kennt den ISO-Wochentag", () => {
    expect(isoWeekday("2024-01-01")).toBe(1); // Montag
    expect(isoWeekday("2026-08-09")).toBe(7); // Sonntag
    expect(isoWeekday("Quatsch")).toBe(0);
  });

  it("filtert die Ämtli eines Tages", () => {
    const chores = [
      { id: 1, title: "Abwaschen", points: 1 },
      {
        id: 2,
        title: "Abfall",
        points: 1,
        weekdaysJson: JSON.stringify([2]),
      },
    ];
    // 2026-08-04 ist ein Dienstag: beide fallen an
    expect(choresForDay(chores, "2026-08-04").map(c => c.id)).toEqual([1, 2]);
    // Mittwoch: nur das tägliche Ämtli
    expect(choresForDay(chores, "2026-08-05").map(c => c.id)).toEqual([1]);
    // Ungültiges Datum: lieber alle als keines
    expect(choresForDay(chores, "nix").map(c => c.id)).toEqual([1, 2]);
  });
});
