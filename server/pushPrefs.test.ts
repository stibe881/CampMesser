import { describe, expect, it } from "vitest";
import { subscriptionWants, type PushKind, type PushPrefs } from "./push";

const KINDS: PushKind[] = ["weather", "food", "trip", "astro"];

function prefs(overrides: Partial<PushPrefs> = {}): PushPrefs {
  // Default wie in der DB: alle Flags an
  return {
    wantsWeather: true,
    wantsFood: true,
    wantsTrips: true,
    wantsAstro: true,
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
    });
    for (const kind of KINDS) {
      expect(subscriptionWants(allOff, kind)).toBe(false);
    }
  });
});
