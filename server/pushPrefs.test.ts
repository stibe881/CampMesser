import { describe, expect, it } from "vitest";
import {
  subscriptionThresholds,
  subscriptionWants,
  type PushKind,
  type PushPrefs,
} from "./push";

const KINDS: PushKind[] = ["weather", "food", "trip", "astro", "gear"];

function prefs(overrides: Partial<PushPrefs> = {}): PushPrefs {
  // Default wie in der DB: alle Flags an
  return {
    wantsWeather: true,
    wantsFood: true,
    wantsTrips: true,
    wantsAstro: true,
    wantsGear: true,
    wantsHeat: true,
    windThresholdKmh: null,
    rainThresholdMm: null,
    ...overrides,
  };
}

describe("subscriptionWants", () => {
  it("lässt mit Default-Flags (alles an) jede Mitteilungs-Art durch", () => {
    for (const kind of KINDS) {
      expect(subscriptionWants(prefs(), kind)).toBe(true);
    }
  });

  it("jedes Flag schaltet genau seine Mitteilungs-Art ab", () => {
    const cases: { off: Partial<PushPrefs>; blocked: PushKind }[] = [
      { off: { wantsWeather: false }, blocked: "weather" },
      { off: { wantsFood: false }, blocked: "food" },
      { off: { wantsTrips: false }, blocked: "trip" },
      { off: { wantsAstro: false }, blocked: "astro" },
      { off: { wantsGear: false }, blocked: "gear" },
    ];
    for (const { off, blocked } of cases) {
      const p = prefs(off);
      for (const kind of KINDS) {
        expect(subscriptionWants(p, kind)).toBe(kind !== blocked);
      }
    }
  });

  it("blockiert mit allen Flags aus jede Mitteilungs-Art", () => {
    const allOff = prefs({
      wantsWeather: false,
      wantsFood: false,
      wantsTrips: false,
      wantsAstro: false,
      wantsGear: false,
    });
    for (const kind of KINDS) {
      expect(subscriptionWants(allOff, kind)).toBe(false);
    }
  });
});

describe("subscriptionThresholds", () => {
  it("liefert ohne eigene Werte leere Schwellen (Standard greift)", () => {
    expect(subscriptionThresholds(prefs())).toEqual({
      windKmh: undefined,
      rainMm: undefined,
    });
  });

  it("reicht eigene Wind- und Regen-Schwellen durch", () => {
    expect(
      subscriptionThresholds(
        prefs({ windThresholdKmh: 45, rainThresholdMm: 8 })
      )
    ).toEqual({ windKmh: 45, rainMm: 8 });
  });

  it("mischt eigene und Standard-Schwelle", () => {
    expect(subscriptionThresholds(prefs({ windThresholdKmh: 120 }))).toEqual({
      windKmh: 120,
      rainMm: undefined,
    });
  });
});
