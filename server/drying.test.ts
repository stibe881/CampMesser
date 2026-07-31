import { describe, expect, it } from "vitest";
import { DRYING_ITEMS, estimateDryingTime, formatHours, sunsetVerdict } from "../shared/drying";

const REF = { temperature: 20, humidity: 60, windSpeed: 5 };

describe("estimateDryingTime", () => {
  it("liefert bei Referenzbedingungen ungefähr die Basiszeit", () => {
    const r = estimateDryingTime(4, REF);
    expect(r.hours).toBeGreaterThan(3);
    expect(r.hours).toBeLessThan(5.5);
  });

  it("trocknet schneller bei Wärme, Wind und trockener Luft", () => {
    const good = estimateDryingTime(4, { temperature: 30, humidity: 35, windSpeed: 20 });
    const bad = estimateDryingTime(4, { temperature: 12, humidity: 85, windSpeed: 0 });
    expect(good.hours).toBeLessThan(estimateDryingTime(4, REF).hours);
    expect(bad.hours).toBeGreaterThan(estimateDryingTime(4, REF).hours);
  });

  it("wird bei sehr hoher Luftfeuchte extrem langsam", () => {
    const humid = estimateDryingTime(2, { temperature: 20, humidity: 98, windSpeed: 5 });
    expect(humid.hours).toBeGreaterThan(10);
  });
});

describe("sunsetVerdict", () => {
  const now = new Date("2026-07-31T14:00:00");
  const sunsetLate = new Date("2026-07-31T21:00:00");

  it("empfiehlt Hängenlassen, wenn genug Zeit bleibt", () => {
    const v = sunsetVerdict(2, now, sunsetLate);
    expect(v.driesBeforeSunset).toBe(true);
  });

  it("warnt, wenn die Zeit nicht reicht (inkl. 30-Min-Reserve)", () => {
    const v = sunsetVerdict(7, now, sunsetLate);
    expect(v.driesBeforeSunset).toBe(false);
    expect(v.recommendation).toContain("NICHT");
  });

  it("warnt nach Sonnenuntergang immer", () => {
    const v = sunsetVerdict(0.5, new Date("2026-07-31T22:00:00"), sunsetLate);
    expect(v.driesBeforeSunset).toBe(false);
  });
});

describe("DRYING_ITEMS", () => {
  it("enthält mindestens 10 Materialien mit plausiblen Basiszeiten", () => {
    expect(DRYING_ITEMS.length).toBeGreaterThanOrEqual(10);
    for (const item of DRYING_ITEMS) {
      expect(item.baseHours).toBeGreaterThan(0);
      expect(item.baseHours).toBeLessThanOrEqual(12);
    }
  });
});

describe("formatHours", () => {
  it("formatiert Minuten und Stunden lesbar", () => {
    expect(formatHours(0.5)).toBe("30 Min.");
    expect(formatHours(2)).toBe("2 Std.");
    expect(formatHours(2.5)).toBe("2 Std. 30 Min.");
  });
});

