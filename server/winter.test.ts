import { describe, expect, it } from "vitest";
import { frostNights, snowDepthNow, snowLineOutlook } from "@shared/winter";

/** Frost (#428) und Schneefallgrenze (#429): melden nur, was betrifft. */
describe("frostNights", () => {
  const days = [
    { date: "2026-10-20", tempMinC: 3 },
    { date: "2026-10-21", tempMinC: -2 },
    { date: "2026-10-22", tempMinC: 0 },
    { date: "2026-10-23", tempMinC: -5 },
  ];

  it("liefert die Frostnächte der nächsten drei Tage", () => {
    // 0 °C zählt: Am Boden ist es dann längst gefroren.
    expect(frostNights(days)).toEqual([
      { date: "2026-10-21", tempMinC: -2 },
      { date: "2026-10-22", tempMinC: 0 },
    ]);
  });

  it("ohne Frost bleibt die Liste leer", () => {
    expect(frostNights([{ date: "2026-07-01", tempMinC: 14 }])).toEqual([]);
  });
});

describe("snowLineOutlook", () => {
  const hour = (freezingLevelM: number, prob = 60) => ({
    freezingLevelM,
    precipitationProbability: prob,
  });

  it("nennt die tiefste Grenze, auf 100 m gerundet", () => {
    expect(snowLineOutlook([hour(1840), hour(1560), hour(1700)])).toEqual({
      // 1560 − 300 Faustwert = 1260 → 1300
      minLevelM: 1300,
    });
  });

  it("ohne Niederschlag in Sicht schweigt sie", () => {
    // Eine Schneefallgrenze ohne Niederschlag ist ein akademischer Wert.
    expect(snowLineOutlook([hour(1500, 10), hour(1600, 20)])).toBeNull();
  });

  it("eine Grenze weit über den Bergen betrifft niemanden", () => {
    expect(snowLineOutlook([hour(3600)])).toBeNull();
  });

  it("ohne Daten wird nichts behauptet", () => {
    expect(snowLineOutlook([{ precipitationProbability: 80 }])).toBeNull();
  });
});

describe("snowDepthNow", () => {
  it("meldet die Schneehöhe des ersten Stundenwerts in cm", () => {
    expect(
      snowDepthNow([
        { precipitationProbability: 0, snowDepthM: 0.42 },
        { precipitationProbability: 0, snowDepthM: 0.4 },
      ])
    ).toEqual({ depthCm: 42 });
  });

  it("unter der Mindesthöhe schweigt sie (Reif ist kein Schnee)", () => {
    expect(
      snowDepthNow([{ precipitationProbability: 0, snowDepthM: 0.03 }])
    ).toBeNull();
    expect(
      snowDepthNow([{ precipitationProbability: 0, snowDepthM: 0 }])
    ).toBeNull();
  });

  it("ohne Messwert wird nichts behauptet", () => {
    expect(snowDepthNow([{ precipitationProbability: 50 }])).toBeNull();
    expect(snowDepthNow([])).toBeNull();
  });
});
