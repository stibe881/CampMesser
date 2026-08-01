import { describe, expect, it } from "vitest";
import { buildKnotQuiz } from "../client/src/lib/knotQuiz";
import { knots } from "../client/src/data/knots";

/** Deterministischer Pseudo-Zufall für reproduzierbare Tests. */
function seededRng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

describe("buildKnotQuiz", () => {
  it("baut Fragen mit vier Optionen und korrekter Lösung", () => {
    const quiz = buildKnotQuiz(knots, 8, seededRng(42));
    expect(quiz.length).toBe(Math.min(8, knots.length));
    for (const q of quiz) {
      expect(q.options.length).toBe(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options[q.correctIndex]).toBe(q.knotName);
      expect(q.prompt.length).toBeGreaterThan(0);
      expect(q.proTip.length).toBeGreaterThan(0);
    }
  });

  it("fragt jeden Knoten höchstens einmal ab", () => {
    const quiz = buildKnotQuiz(knots, 20, seededRng(7));
    const ids = quiz.map(q => q.knotId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(quiz.length).toBe(knots.length);
  });

  it("ist mit gleichem Seed reproduzierbar", () => {
    const a = buildKnotQuiz(knots, 5, seededRng(99));
    const b = buildKnotQuiz(knots, 5, seededRng(99));
    expect(a).toEqual(b);
  });

  it("liefert nichts bei zu wenigen Knoten", () => {
    expect(buildKnotQuiz(knots.slice(0, 3), 5, seededRng(1))).toEqual([]);
  });
});
