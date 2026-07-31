import { describe, expect, it } from "vitest";
import {
  DRYING_ITEMS,
  estimateDryingTime,
  estimateDryingWithForecast,
  formatHours,
  sunsetVerdict,
  type HourlyConditions,
} from "../shared/drying";

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

describe("estimateDryingWithForecast", () => {
  const mkHours = (startHour: number, conds: Array<Partial<HourlyConditions>>): HourlyConditions[] =>
    conds.map((c, i) => ({
      time: new Date(2026, 6, 31, startHour + i, 0, 0),
      temperature: c.temperature ?? 20,
      humidity: c.humidity ?? 60,
      windSpeed: c.windSpeed ?? 5,
    }));

  it("liefert bei konstanten Referenzbedingungen etwa die Punktschätzung", () => {
    const start = new Date(2026, 6, 31, 12, 0, 0);
    const hourly = mkHours(12, Array.from({ length: 12 }, () => ({})));
    const point = estimateDryingTime(3, { temperature: 20, humidity: 60, windSpeed: 5 });
    const fc = estimateDryingWithForecast(3, hourly, start);
    expect(fc.dryAt).not.toBeNull();
    expect(Math.abs(fc.hours - point.hours)).toBeLessThan(0.3);
  });

  it("trocknet schneller, wenn der Nachmittag wärmer und windiger wird", () => {
    const start = new Date(2026, 6, 31, 12, 0, 0);
    const constant = mkHours(12, Array.from({ length: 12 }, () => ({})));
    const improving = mkHours(
      12,
      Array.from({ length: 12 }, (_, i) => ({
        temperature: 20 + i * 2,
        humidity: Math.max(30, 60 - i * 4),
        windSpeed: 5 + i * 2,
      })),
    );
    const a = estimateDryingWithForecast(4, constant, start);
    const b = estimateDryingWithForecast(4, improving, start);
    expect(b.hours).toBeLessThan(a.hours);
  });

  it("meldet dryAt=null, wenn der Verlauf nicht reicht", () => {
    const start = new Date(2026, 6, 31, 20, 0, 0);
    const hourly = mkHours(20, [{ humidity: 95 }, { humidity: 97 }]);
    const fc = estimateDryingWithForecast(6, hourly, start);
    expect(fc.dryAt).toBeNull();
  });

  it("berücksichtigt nur Stunden ab dem Start", () => {
    const start = new Date(2026, 6, 31, 14, 30, 0);
    const hourly = mkHours(10, Array.from({ length: 14 }, () => ({})));
    const fc = estimateDryingWithForecast(1, hourly, start);
    expect(fc.dryAt).not.toBeNull();
    expect(fc.dryAt!.getTime()).toBeGreaterThan(start.getTime());
  });
});
