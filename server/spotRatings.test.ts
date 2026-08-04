import { describe, expect, it } from "vitest";
import {
  MAX_STARS,
  SPOT_CRITERIA,
  SPOT_CRITERION_HINTS,
  SPOT_CRITERION_LABELS,
  bestForCriterion,
  clampStars,
  emptyRatings,
  overallRating,
  rankByCriterion,
  rankByOverall,
  ratedCount,
} from "@shared/spotRatings";
import { LANGUAGES, pick } from "@shared/i18n";

const spot = (
  id: number,
  name: string,
  ratings: Partial<ReturnType<typeof emptyRatings>>
) => ({ id, name, ratings: { ...emptyRatings(), ...ratings } });

describe("Platz-Bewertung nach Kriterien (#278)", () => {
  it("alle Kriterien tragen Label und Erklärung in vier Sprachen", () => {
    expect(SPOT_CRITERIA).toHaveLength(4);
    for (const criterion of SPOT_CRITERIA) {
      for (const lang of LANGUAGES) {
        expect(
          pick(SPOT_CRITERION_LABELS[criterion], lang).length
        ).toBeGreaterThan(3);
        expect(
          pick(SPOT_CRITERION_HINTS[criterion], lang).length
        ).toBeGreaterThan(30);
      }
    }
  });

  it("klemmt Sterne und behandelt Null als «nicht bewertet»", () => {
    expect(clampStars(3)).toBe(3);
    expect(clampStars(9)).toBe(MAX_STARS);
    expect(clampStars(0)).toBeNull();
    expect(clampStars(null)).toBeNull();
    expect(clampStars(undefined)).toBeNull();
    expect(clampStars(Number.NaN)).toBeNull();
  });

  it("der Schnitt zählt nur bewertete Kriterien", () => {
    expect(overallRating(emptyRatings())).toBeNull();
    // Nur der Schatten bewertet: der Schnitt ist 4 und nicht 1
    expect(overallRating({ ...emptyRatings(), shade: 4 })).toBe(4);
    expect(overallRating({ sanitary: 5, quiet: 4, shade: 4, kids: 3 })).toBe(4);
    expect(ratedCount({ ...emptyRatings(), shade: 4, kids: 2 })).toBe(2);
  });

  it("ordnet nach einem Kriterium, Unbewertete ans Ende", () => {
    const spots = [
      spot(1, "Aare", { quiet: 3 }),
      spot(2, "Berg", {}),
      spot(3, "See", { quiet: 5 }),
    ];
    expect(rankByCriterion(spots, "quiet").map(s => s.name)).toEqual([
      "See",
      "Aare",
      "Berg",
    ]);
  });

  it("ordnet nach Gesamtwert, bei Gleichstand alphabetisch", () => {
    const spots = [
      spot(1, "Zwei", { quiet: 4, shade: 4 }),
      spot(2, "Eins", { quiet: 4, shade: 4 }),
      spot(3, "Drei", { quiet: 2 }),
    ];
    expect(rankByOverall(spots).map(s => s.name)).toEqual([
      "Eins",
      "Zwei",
      "Drei",
    ]);
  });

  it("«am besten» gilt nur ohne Gleichstand", () => {
    const clear = [
      spot(1, "Aare", { shade: 5 }),
      spot(2, "Berg", { shade: 3 }),
    ];
    expect(bestForCriterion(clear, "shade")?.name).toBe("Aare");

    const tied = [spot(1, "Aare", { shade: 5 }), spot(2, "Berg", { shade: 5 })];
    expect(bestForCriterion(tied, "shade")).toBeNull();

    // Ohne jede Bewertung gibt es auch keinen Besten
    expect(bestForCriterion([spot(1, "Aare", {})], "shade")).toBeNull();
  });
});
