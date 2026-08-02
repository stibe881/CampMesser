import { describe, expect, it } from "vitest";
import {
  masteryLevel,
  RECENT_LIMIT,
  recordAnswer,
  sanitizeKnotProgress,
  type KnotProgress,
} from "../client/src/lib/knotProgress";

describe("recordAnswer", () => {
  it("legt neue Knoten an und zählt richtig/falsch", () => {
    let stats: KnotProgress = {};
    stats = recordAnswer(stats, "mastwurf", true);
    stats = recordAnswer(stats, "mastwurf", false);
    expect(stats.mastwurf).toEqual({
      recent: [true, false],
      correct: 1,
      total: 2,
    });
  });

  it("verändert die alte Statistik nicht (pure Funktion)", () => {
    const before: KnotProgress = {
      palstek: { recent: [true], correct: 1, total: 1 },
    };
    const after = recordAnswer(before, "palstek", false);
    expect(before.palstek).toEqual({ recent: [true], correct: 1, total: 1 });
    expect(after.palstek).toEqual({
      recent: [true, false],
      correct: 1,
      total: 2,
    });
  });

  it("behält höchstens die letzten fünf Antworten", () => {
    let stats: KnotProgress = {};
    for (let i = 0; i < 8; i++) {
      stats = recordAnswer(stats, "prusik", i % 2 === 0);
    }
    expect(stats.prusik.recent.length).toBe(RECENT_LIMIT);
    expect(stats.prusik.total).toBe(8);
    // Die ältesten Antworten fallen vorne raus
    expect(stats.prusik.recent).toEqual([false, true, false, true, false]);
  });
});

describe("masteryLevel", () => {
  it("meldet «neu» ohne Antworten", () => {
    expect(masteryLevel({}, "mastwurf")).toBe("neu");
  });

  it("meldet «üben» ab der ersten Antwort", () => {
    const stats = recordAnswer({}, "mastwurf", true);
    expect(masteryLevel(stats, "mastwurf")).toBe("üben");
  });

  it("meldet «sicher» erst bei 3er-Serie UND mindestens 3 richtigen insgesamt", () => {
    let stats: KnotProgress = {};
    stats = recordAnswer(stats, "achterknoten", true);
    stats = recordAnswer(stats, "achterknoten", true);
    expect(masteryLevel(stats, "achterknoten")).toBe("üben");
    stats = recordAnswer(stats, "achterknoten", true);
    expect(masteryLevel(stats, "achterknoten")).toBe("sicher");
  });

  it("fällt nach einem Fehler von «sicher» auf «üben» zurück", () => {
    let stats: KnotProgress = {};
    for (let i = 0; i < 3; i++) {
      stats = recordAnswer(stats, "schotstek", true);
    }
    expect(masteryLevel(stats, "schotstek")).toBe("sicher");
    stats = recordAnswer(stats, "schotstek", false);
    expect(masteryLevel(stats, "schotstek")).toBe("üben");
  });

  it("verlangt trotz 3er-Serie mindestens 3 richtige insgesamt", () => {
    // Konstruiert: Serie von 3 richtigen im recent, aber correct < 3
    const stats: KnotProgress = {
      x: { recent: [true, true, true], correct: 2, total: 3 },
    };
    expect(masteryLevel(stats, "x")).toBe("üben");
  });
});

describe("sanitizeKnotProgress", () => {
  it("übernimmt saubere Statistiken unverändert", () => {
    const clean: KnotProgress = {
      mastwurf: { recent: [true, false], correct: 1, total: 2 },
    };
    expect(sanitizeKnotProgress(clean)).toEqual(clean);
  });

  it("verwirft Nicht-Objekte und kaputte Einträge", () => {
    expect(sanitizeKnotProgress(null)).toEqual({});
    expect(sanitizeKnotProgress([1, 2])).toEqual({});
    expect(sanitizeKnotProgress("x")).toEqual({});
    expect(
      sanitizeKnotProgress({
        a: { recent: [], correct: -1, total: 2 },
        b: { recent: [], correct: 3, total: 2 },
        c: { recent: [], correct: 1.5, total: 2 },
        d: "kaputt",
        e: { recent: [true], correct: 1, total: 1 },
      })
    ).toEqual({ e: { recent: [true], correct: 1, total: 1 } });
  });

  it("filtert recent auf boolean-Werte und kappt auf das Limit", () => {
    const result = sanitizeKnotProgress({
      a: {
        recent: [true, "x", 1, false, true, true, false, true],
        correct: 4,
        total: 8,
      },
    });
    expect(result.a.recent.length).toBeLessThanOrEqual(RECENT_LIMIT);
    expect(result.a.recent.every(r => typeof r === "boolean")).toBe(true);
  });
});
