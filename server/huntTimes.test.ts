import { describe, expect, it } from "vitest";
import {
  formatHuntSeconds,
  MAX_HUNT_SECONDS,
  MAX_TRACKED_HUNTS,
  recordHuntTime,
  sanitizeHuntBestTimes,
  type HuntBestTimes,
} from "../client/src/lib/huntTimes";

describe("recordHuntTime", () => {
  it("legt die erste Zeit als Bestzeit an", () => {
    const { times, isNewBest } = recordHuntTime({}, "zwerge", 431);
    expect(isNewBest).toBe(true);
    expect(times).toEqual({ zwerge: 431 });
  });

  it("ersetzt nur langsamere Bestzeiten", () => {
    const before: HuntBestTimes = { zwerge: 300 };
    const slower = recordHuntTime(before, "zwerge", 400);
    expect(slower.isNewBest).toBe(false);
    expect(slower.times).toBe(before);
    const faster = recordHuntTime(before, "zwerge", 299);
    expect(faster.isNewBest).toBe(true);
    expect(faster.times).toEqual({ zwerge: 299 });
  });

  it("verändert die alten Bestzeiten nicht (pure Funktion)", () => {
    const before: HuntBestTimes = { "eigene-7": 120 };
    const after = recordHuntTime(before, "eigene-7", 90);
    expect(before).toEqual({ "eigene-7": 120 });
    expect(after.times).toEqual({ "eigene-7": 90 });
  });

  it("gleich schnelle Zeit ist keine neue Bestzeit", () => {
    const { isNewBest } = recordHuntTime({ zwerge: 300 }, "zwerge", 300);
    expect(isNewBest).toBe(false);
  });

  it("verwirft unplausible Zeiten und leere Ids", () => {
    const before: HuntBestTimes = { zwerge: 300 };
    expect(recordHuntTime(before, "zwerge", 0).isNewBest).toBe(false);
    expect(recordHuntTime(before, "zwerge", -5).isNewBest).toBe(false);
    expect(recordHuntTime(before, "zwerge", 12.5).isNewBest).toBe(false);
    expect(
      recordHuntTime(before, "zwerge", MAX_HUNT_SECONDS + 1).isNewBest
    ).toBe(false);
    expect(recordHuntTime(before, "", 100).isNewBest).toBe(false);
    expect(before).toEqual({ zwerge: 300 });
  });
});

describe("formatHuntSeconds", () => {
  it("formatiert als mm:ss mit führenden Nullen", () => {
    expect(formatHuntSeconds(0)).toBe("00:00");
    expect(formatHuntSeconds(9)).toBe("00:09");
    expect(formatHuntSeconds(65)).toBe("01:05");
    expect(formatHuntSeconds(1421)).toBe("23:41");
  });

  it("lässt den Minutenteil über 99 Minuten wachsen", () => {
    expect(formatHuntSeconds(100 * 60 + 3)).toBe("100:03");
  });

  it("rundet ab und klemmt Negatives auf null", () => {
    expect(formatHuntSeconds(59.9)).toBe("00:59");
    expect(formatHuntSeconds(-10)).toBe("00:00");
  });
});

describe("sanitizeHuntBestTimes", () => {
  it("übernimmt nur plausible ganzzahlige Sekunden", () => {
    const clean = sanitizeHuntBestTimes({
      zwerge: 431,
      "eigene-7": 90,
      kaputt: "300",
      negativ: -1,
      komma: 12.5,
      zuGross: MAX_HUNT_SECONDS + 1,
      null: null,
    });
    expect(clean).toEqual({ zwerge: 431, "eigene-7": 90 });
  });

  it("verwirft fremde Formate komplett", () => {
    expect(sanitizeHuntBestTimes(null)).toEqual({});
    expect(sanitizeHuntBestTimes("zwerge")).toEqual({});
    expect(sanitizeHuntBestTimes([431])).toEqual({});
    expect(sanitizeHuntBestTimes(42)).toEqual({});
  });

  it("kappt die Anzahl erfasster Jagden", () => {
    const value: Record<string, number> = {};
    for (let i = 0; i < MAX_TRACKED_HUNTS + 20; i++) {
      value[`jagd-${i}`] = i + 1;
    }
    expect(Object.keys(sanitizeHuntBestTimes(value)).length).toBe(
      MAX_TRACKED_HUNTS
    );
  });
});
