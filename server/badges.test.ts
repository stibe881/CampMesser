import { describe, expect, it } from "vitest";
import {
  BADGES,
  earnedBadges,
  FOREST_QUIZ_ID,
  isBadgeId,
  STAR_QUIZ_ID,
  STREAK_BADGE_TARGET,
} from "@shared/badges";

const none = { huntsCompleted: 0, quizzesCompleted: 0, bestStreak: 0 };

describe("Abzeichen-Katalog", () => {
  it("hat eindeutige, kurze IDs (childBadges.badgeId ist varchar(40))", () => {
    const ids = BADGES.map(b => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach(id => expect(id.length).toBeLessThanOrEqual(40));
  });

  it("isBadgeId kennt Katalog-IDs und weist fremde ab", () => {
    expect(isBadgeId("hunt-first")).toBe(true);
    expect(isBadgeId("quiz-star-perfect")).toBe(true);
    expect(isBadgeId("gibt-es-nicht")).toBe(false);
    expect(isBadgeId("")).toBe(false);
  });
});

describe("earnedBadges", () => {
  it("ohne Fortschritt und Ereignis gibt es nichts", () => {
    expect(earnedBadges(none)).toEqual([]);
  });

  it("erste und dritte Schnitzeljagd schalten die Jagd-Abzeichen frei", () => {
    expect(earnedBadges({ ...none, huntsCompleted: 1 })).toEqual([
      "hunt-first",
    ]);
    expect(earnedBadges({ ...none, huntsCompleted: 3 })).toEqual([
      "hunt-first",
      "hunt-three",
    ]);
    expect(earnedBadges({ ...none, huntsCompleted: 2 })).toEqual([
      "hunt-first",
    ]);
  });

  it("erstes und fünftes Quiz schalten die Quiz-Zähler-Abzeichen frei", () => {
    expect(earnedBadges({ ...none, quizzesCompleted: 1 })).toEqual([
      "quiz-first",
    ]);
    expect(earnedBadges({ ...none, quizzesCompleted: 5 })).toEqual([
      "quiz-first",
      "quiz-five",
    ]);
  });

  it("fehlerfreies Quiz gibt das Perfekt-Abzeichen nur mit perfect-Flag", () => {
    const progress = { ...none, quizzesCompleted: 2 };
    expect(
      earnedBadges(progress, { type: "quizCompleted", perfect: true })
    ).toContain("quiz-perfect");
    expect(
      earnedBadges(progress, { type: "quizCompleted", perfect: false })
    ).not.toContain("quiz-perfect");
    expect(earnedBadges(progress, { type: "huntCompleted" })).not.toContain(
      "quiz-perfect"
    );
  });

  it("Wald- und Sternen-Abzeichen hängen an den konkreten Quiz-IDs", () => {
    const progress = { ...none, quizzesCompleted: 1 };
    expect(
      earnedBadges(progress, {
        type: "quizCompleted",
        quizId: FOREST_QUIZ_ID,
        perfect: true,
      })
    ).toContain("quiz-forest-perfect");
    expect(
      earnedBadges(progress, {
        type: "quizCompleted",
        quizId: STAR_QUIZ_ID,
        perfect: true,
      })
    ).toContain("quiz-star-perfect");
    // Anderes Quiz fehlerfrei → nur das allgemeine Perfekt-Abzeichen
    expect(
      earnedBadges(progress, {
        type: "quizCompleted",
        quizId: "tier-quiz",
        perfect: true,
      })
    ).toEqual(["quiz-first", "quiz-perfect"]);
    // Wald-Quiz mit Fehlern → kein Wald-Abzeichen
    expect(
      earnedBadges(progress, {
        type: "quizCompleted",
        quizId: FOREST_QUIZ_ID,
        perfect: false,
      })
    ).not.toContain("quiz-forest-perfect");
  });

  it("die Antwort-Serie zählt über bestStreak, Schwelle 10", () => {
    expect(
      earnedBadges({ ...none, bestStreak: STREAK_BADGE_TARGET - 1 })
    ).not.toContain("streak-ten");
    expect(
      earnedBadges({ ...none, bestStreak: STREAK_BADGE_TARGET })
    ).toContain("streak-ten");
    expect(earnedBadges({ ...none, bestStreak: 12 })).toContain("streak-ten");
  });

  it("liefert nur Katalog-IDs", () => {
    const all = earnedBadges(
      { huntsCompleted: 5, quizzesCompleted: 9, bestStreak: 15 },
      { type: "quizCompleted", quizId: FOREST_QUIZ_ID, perfect: true }
    );
    all.forEach(id => expect(isBadgeId(id)).toBe(true));
    expect(all).toHaveLength(7);
  });
});
