import { describe, expect, it } from "vitest";
import { bestDryingDay } from "@shared/dryingDay";

/** Bester Trocknungs-Tag (#437): der erste passende gewinnt. */
describe("bestDryingDay", () => {
  const day = (date: string, prob: number, mm: number, tempMaxC = 18) => ({
    date,
    precipitationProbabilityMax: prob,
    precipitationSumMm: mm,
    tempMaxC,
  });

  it("nimmt den ersten Tag mit Trocknungs-Wetter", () => {
    // Ein nasses Zelt wartet nicht gern auf den perfekten Samstag.
    const result = bestDryingDay([
      day("2026-08-09", 70, 8),
      day("2026-08-10", 20, 0),
      day("2026-08-11", 5, 0),
    ]);
    expect(result?.date).toBe("2026-08-10");
  });

  it("Regenmenge und Kälte disqualifizieren", () => {
    expect(
      bestDryingDay([day("2026-08-09", 20, 3), day("2026-08-10", 20, 0, 5)])
    ).toBeNull();
  });

  it("ohne passenden Tag wird nichts behauptet", () => {
    expect(bestDryingDay([])).toBeNull();
  });
});
