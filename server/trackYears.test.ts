/**
 * Wander-Jahresbilanz (#450): Touren/Kilometer/Höhenmeter pro Jahr.
 */
import { describe, expect, it } from "vitest";
import { trackYearRows } from "@shared/trackYears";

describe("trackYearRows", () => {
  it("summiert pro Jahr und zählt Velo getrennt", () => {
    const rows = trackYearRows([
      {
        startedAt: "2025-06-01T10:00:00Z",
        distanceM: 8000,
        ascentM: 400,
        activity: "hike",
      },
      {
        startedAt: "2025-08-10T10:00:00Z",
        distanceM: 20000,
        ascentM: 150,
        activity: "bike",
      },
      {
        startedAt: "2024-07-01T10:00:00Z",
        distanceM: 5000,
        ascentM: 300,
        activity: null,
      },
    ]);
    expect(rows.map(r => r.year)).toEqual([2025, 2024]);
    expect(rows[0]).toMatchObject({
      tours: 2,
      hikeTours: 1,
      bikeTours: 1,
      distanceM: 28000,
      ascentM: 550,
    });
    // Alte Zeile ohne Aktivität zählt als Wanderung
    expect(rows[1]).toMatchObject({ tours: 1, hikeTours: 1, bikeTours: 0 });
  });

  it("ignoriert kaputte Daten und negative Werte", () => {
    const rows = trackYearRows([
      {
        startedAt: "kaputt",
        distanceM: 1000,
        ascentM: 100,
      },
      {
        startedAt: "2025-01-05T08:00:00Z",
        distanceM: -50,
        ascentM: -10,
      },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ distanceM: 0, ascentM: 0, tours: 1 });
  });

  it("bleibt bei leerer Liste leer", () => {
    expect(trackYearRows([])).toEqual([]);
  });
});
