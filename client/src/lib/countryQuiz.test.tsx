/**
 * Länder-Quiz (#642): deterministisch mit injiziertem Zufall geprüft.
 */
import { describe, expect, it } from "vitest";
import {
  COUNTRY_QUIZ_OPTIONS,
  COUNTRY_QUIZ_QUESTIONS,
  buildCountryQuiz,
} from "@/lib/countryQuiz";
import { roadRules } from "@/data/roadRules";

/** Vorhersehbarer «Zufall»: zählt in kleinen Schritten hoch. */
function seededRandom(): () => number {
  let state = 0.123;
  return () => {
    state = (state * 9301 + 0.49297) % 1;
    return state;
  };
}

describe("buildCountryQuiz (#642)", () => {
  it("würfelt die gewünschte Anzahl Fragen mit je 3 Optionen", () => {
    const quiz = buildCountryQuiz("de", seededRandom());
    expect(quiz).toHaveLength(COUNTRY_QUIZ_QUESTIONS);
    for (const question of quiz) {
      expect(question.options).toHaveLength(COUNTRY_QUIZ_OPTIONS);
      expect(question.correctIndex).toBeGreaterThanOrEqual(0);
      expect(question.correctIndex).toBeLessThan(COUNTRY_QUIZ_OPTIONS);
      // Keine doppelten Optionen in einer Frage
      expect(new Set(question.options).size).toBe(COUNTRY_QUIZ_OPTIONS);
    }
  });

  it("die richtige Antwort passt zur Frage", () => {
    const quiz = buildCountryQuiz("de", seededRandom());
    // Typ 1 (gerade Indizes): Flagge in der Frage, Landesname als Antwort
    const first = quiz[0];
    const country = roadRules.find(entry =>
      String(first.question).includes(entry.flag)
    );
    expect(country).toBeDefined();
    expect(first.options[first.correctIndex]).toBe(country!.name.de);
  });

  it("liefert ohne genug Länder eine leere Liste", () => {
    expect(
      buildCountryQuiz("de", seededRandom(), roadRules.slice(0, 2))
    ).toEqual([]);
  });
});
