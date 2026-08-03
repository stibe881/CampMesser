import { describe, expect, it } from "vitest";
import {
  buildNatureQuiz,
  excerpt,
  maskName,
  seasonLabel,
  NATURE_QUIZ_OPTIONS,
} from "../client/src/lib/natureQuiz";
import { natureCategories, natureEntries } from "../client/src/data/nature";
import { pick } from "@shared/i18n";

/** Deterministischer Pseudo-Zufall für reproduzierbare Tests. */
function seededRng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

describe("buildNatureQuiz", () => {
  it("baut die gewünschte Anzahl Fragen mit drei Optionen", () => {
    const quiz = buildNatureQuiz(natureEntries, "de", seededRng(42), 10);
    expect(quiz).toHaveLength(10);
    for (const q of quiz) {
      expect(q.options).toHaveLength(NATURE_QUIZ_OPTIONS);
      expect(new Set(q.options).size).toBe(NATURE_QUIZ_OPTIONS);
      expect(q.question.length).toBeGreaterThan(0);
      expect(q.explanation.length).toBeGreaterThan(0);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
    }
  });

  it("enthält die richtige Antwort immer in den Optionen", () => {
    for (const seed of [1, 7, 99, 2024]) {
      const quiz = buildNatureQuiz(natureEntries, "de", seededRng(seed), 12);
      for (const q of quiz) {
        const entry = natureEntries.find(e => e.id === q.entryId)!;
        const expected =
          q.type === "description"
            ? pick(entry.name, "de")
            : q.type === "season"
              ? seasonLabel(entry.season!, "de")
              : pick(
                  natureCategories.find(c => c.id === entry.category)!.label,
                  "de"
                );
        expect(q.options[q.correctIndex]).toBe(expected);
      }
    }
  });

  it("fragt jeden Lexikon-Eintrag höchstens einmal ab", () => {
    const quiz = buildNatureQuiz(natureEntries, "de", seededRng(3), 100);
    const ids = quiz.map(q => q.entryId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(quiz.length).toBe(natureEntries.length);
  });

  it("ist mit gleichem Seed reproduzierbar", () => {
    const a = buildNatureQuiz(natureEntries, "de", seededRng(5), 8);
    const b = buildNatureQuiz(natureEntries, "de", seededRng(5), 8);
    expect(a).toEqual(b);
    const c = buildNatureQuiz(natureEntries, "de", seededRng(6), 8);
    expect(c).not.toEqual(a);
  });

  it("respektiert die Sprache", () => {
    const fr = buildNatureQuiz(natureEntries, "fr", seededRng(11), 10);
    for (const q of fr) {
      const entry = natureEntries.find(e => e.id === q.entryId)!;
      if (q.type === "description") {
        expect(q.options[q.correctIndex]).toBe(pick(entry.name, "fr"));
      }
      // Deutsche Kategorie-Namen dürfen in der französischen Fassung nicht vorkommen
      expect(q.options).not.toContain("Tierspuren");
    }
    const de = buildNatureQuiz(natureEntries, "de", seededRng(11), 10);
    expect(fr[0].question).not.toBe(de[0].question);
    expect(fr.map(q => q.entryId)).toEqual(de.map(q => q.entryId));
  });

  it("verrät den Namen nicht im Beschreibungs-Auszug", () => {
    const quiz = buildNatureQuiz(natureEntries, "de", seededRng(77), 100);
    for (const q of quiz.filter(x => x.type === "description")) {
      const name = q.options[q.correctIndex];
      expect(q.question.toLowerCase()).not.toContain(name.toLowerCase());
    }
  });

  it("liefert nichts bei zu wenigen Einträgen", () => {
    expect(
      buildNatureQuiz(natureEntries.slice(0, 2), "de", seededRng(1))
    ).toEqual([]);
  });
});

describe("maskName / excerpt / seasonLabel", () => {
  it("maskiert auch gebeugte und zusammengesetzte Formen", () => {
    expect(maskName("Dachsspuren wirken wie Bärentatzen.", "Dachs")).toBe(
      "… wirken wie Bärentatzen."
    );
    expect(maskName("Die Trittsiegel des Rehs sind klein.", "Reh")).toBe(
      "Die Trittsiegel des … sind klein."
    );
  });

  it("kürzt lange Texte an einer Wortgrenze", () => {
    const long = "Wort ".repeat(80).trim();
    const short = excerpt(long);
    expect(short.length).toBeLessThan(long.length);
    expect(short.endsWith("…")).toBe(true);
    expect(excerpt("kurz")).toBe("kurz");
  });

  it("beschreibt die Saison mit Monatsnamen", () => {
    expect(seasonLabel({ from: 4, to: 10 }, "de")).toBe("April–Oktober");
    expect(seasonLabel({ from: 4, to: 10 }, "en")).toBe("April–October");
  });
});
