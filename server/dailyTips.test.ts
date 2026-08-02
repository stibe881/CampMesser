import { describe, expect, it } from "vitest";
import {
  FULL_MOON_MIN_ILLUMINATION,
  HEAT_TMAX_C,
  RAIN_PROB_PERCENT,
  dailyTip,
  dayOfYear,
  type DailyTipContext,
} from "../shared/dailyTips";

/** Basis-Kontext ohne Wetter/Astro – landet in der Fallback-Rotation. */
const base: DailyTipContext = { month: 1, dayOfYear: 20 };

describe("dayOfYear", () => {
  it("liefert 1 am 1. Januar und 32 am 1. Februar", () => {
    expect(dayOfYear(new Date(2026, 0, 1))).toBe(1);
    expect(dayOfYear(new Date(2026, 1, 1))).toBe(32);
  });

  it("liefert 365 am 31.12. eines Nicht-Schaltjahres", () => {
    expect(dayOfYear(new Date(2026, 11, 31))).toBe(365);
  });
});

describe("dailyTip – Regel-Prioritäten", () => {
  const everything: DailyTipContext = {
    ...base,
    month: 8,
    weatherToday: { code: 0, tMax: 32, precipProb: 10 },
    weatherTomorrow: { code: 61, tMax: 24, precipProb: 90 },
    moonIllumination: 0.05,
    stargazingQuality: "hervorragend",
    activeMeteorShower: "Perseiden",
  };

  it("aktiver Strom + gute Nacht schlägt alles andere", () => {
    const tip = dailyTip(everything);
    expect(tip.id).toBe("meteorNight");
    expect(tip.path).toBe("/natur");
    expect(tip.text).toContain("Perseiden");
  });

  it("bei heller Nacht fällt der Sternschnuppen-Tipp weg → Hitze gewinnt", () => {
    const tip = dailyTip({
      ...everything,
      stargazingQuality: "schlecht",
      moonIllumination: 0.9,
    });
    expect(tip.id).toBe("heat");
    expect(tip.path).toBe("/wasser");
    expect(tip.text).toContain("32");
  });

  it("Hitze feuert ab genau 28 °C, darunter nicht", () => {
    const hot: DailyTipContext = {
      ...base,
      weatherToday: { code: 3, tMax: HEAT_TMAX_C, precipProb: 0 },
    };
    expect(dailyTip(hot).id).toBe("heat");
    const warm: DailyTipContext = {
      ...base,
      weatherToday: { code: 3, tMax: HEAT_TMAX_C - 0.1, precipProb: 0 },
    };
    expect(dailyTip(warm).id).not.toBe("heat");
  });

  it("morgen Regen ≥ 60 % → Regenradar-Tipp aufs Wetter-Modul", () => {
    const tip = dailyTip({
      ...base,
      weatherTomorrow: { code: 61, tMax: 20, precipProb: RAIN_PROB_PERCENT },
    });
    expect(tip).toMatchObject({ id: "rainTomorrow", path: "/wetter" });
    expect(tip.text).toContain("60");
    expect(
      dailyTip({
        ...base,
        weatherTomorrow: { code: 61, tMax: 20, precipProb: 59 },
      }).id
    ).not.toBe("rainTomorrow");
  });

  it("Vollmond-Nähe → Mond-Tipp", () => {
    const tip = dailyTip({
      ...base,
      moonIllumination: FULL_MOON_MIN_ILLUMINATION,
    });
    expect(tip).toMatchObject({ id: "fullMoon", path: "/natur" });
    expect(dailyTip({ ...base, moonIllumination: 0.9 }).id).not.toBe(
      "fullMoon"
    );
  });

  it("klarer Sommertag → UV-Tipp; im Winter nicht", () => {
    const summer: DailyTipContext = {
      ...base,
      month: 7,
      weatherToday: { code: 0, tMax: 24, precipProb: 5 },
    };
    expect(dailyTip(summer)).toMatchObject({
      id: "clearSummer",
      path: "/wetter",
    });
    const winter: DailyTipContext = { ...summer, month: 12 };
    expect(dailyTip(winter).id).not.toBe("clearSummer");
    const cloudy: DailyTipContext = {
      ...summer,
      weatherToday: { code: 3, tMax: 24, precipProb: 5 },
    };
    expect(dailyTip(cloudy).id).not.toBe("clearSummer");
  });
});

describe("dailyTip – deterministischer Fallback", () => {
  it("liefert IMMER einen Tipp, auch ohne Wetter/Astro", () => {
    for (let doy = 1; doy <= 366; doy++) {
      const tip = dailyTip({ month: 1, dayOfYear: doy });
      expect(tip.text.length).toBeGreaterThan(0);
      expect(tip.path.startsWith("/")).toBe(true);
    }
  });

  it("ist deterministisch: gleicher Tag → gleicher Tipp", () => {
    const a = dailyTip({ month: 11, dayOfYear: 314 });
    const b = dailyTip({ month: 11, dayOfYear: 314 });
    expect(a).toEqual(b);
  });

  it("rotiert über aufeinanderfolgende Tage durch 5 verschiedene Tipps", () => {
    const ids = new Set(
      Array.from(
        { length: 5 },
        (_, i) => dailyTip({ month: 2, dayOfYear: 40 + i }).id
      )
    );
    expect(ids.size).toBe(5);
  });

  it("Rezept des Tages nennt das übergebene Rezept", () => {
    // dayOfYear 5 → Rotations-Index 0 (Rezept-Fallback)
    const tip = dailyTip({
      month: 1,
      dayOfYear: 5,
      recipeOfDay: "One-Pot-Pasta",
    });
    expect(tip).toMatchObject({ id: "fallback-recipe", path: "/rezepte" });
    expect(tip.text).toContain("One-Pot-Pasta");
    // Ohne Rezeptnamen gibt es einen generischen Rezept-Tipp
    const generic = dailyTip({ month: 1, dayOfYear: 5 });
    expect(generic.id).toBe("fallback-recipe");
    expect(generic.text.length).toBeGreaterThan(0);
  });

  it("übersetzt die Tipps in alle Sprachen", () => {
    const ctx: DailyTipContext = { month: 1, dayOfYear: 6 };
    const de = dailyTip(ctx, "de").text;
    const fr = dailyTip(ctx, "fr").text;
    const it_ = dailyTip(ctx, "it").text;
    const en = dailyTip(ctx, "en").text;
    expect(new Set([de, fr, it_, en]).size).toBe(4);
  });
});
