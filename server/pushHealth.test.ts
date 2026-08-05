import { describe, expect, it } from "vitest";
import { PUSH_CHECK_STALE_HOURS, pushCheckHealth } from "@shared/pushHealth";

const NOW = Date.parse("2026-08-05T12:00:00Z");
const minutesAgo = (m: number) => new Date(NOW - m * 60000).toISOString();

describe("pushCheckHealth", () => {
  it("ohne Zeitstempel: noch nie gelaufen", () => {
    expect(pushCheckHealth(null, NOW)).toEqual({ state: "never" });
    expect(pushCheckHealth(undefined, NOW)).toEqual({ state: "never" });
  });

  it("Unsinn im Feld gilt als «nie gelaufen», nicht als frisch", () => {
    // Lieber ein Hinweis zu viel als eine falsche Beruhigung.
    expect(pushCheckHealth("morgen früh", NOW)).toEqual({ state: "never" });
  });

  it("frischer Lauf ist in Ordnung", () => {
    expect(pushCheckHealth(minutesAgo(42), NOW)).toEqual({
      state: "ok",
      minutesAgo: 42,
    });
  });

  it("die Grenze liegt bei PUSH_CHECK_STALE_HOURS Stunden", () => {
    const limit = PUSH_CHECK_STALE_HOURS * 60;
    expect(pushCheckHealth(minutesAgo(limit - 1), NOW).state).toBe("ok");
    expect(pushCheckHealth(minutesAgo(limit), NOW).state).toBe("stale");
  });

  it("eine vorgehende Uhr ergibt nicht «vor -3 Minuten»", () => {
    expect(pushCheckHealth(minutesAgo(-3), NOW)).toEqual({
      state: "ok",
      minutesAgo: 0,
    });
  });
});
