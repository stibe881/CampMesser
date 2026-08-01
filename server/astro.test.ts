import { describe, expect, it } from "vitest";
import { isShowerActive, meteorShowers, upcomingShowers } from "@shared/astro";

const perseiden = meteorShowers.find(s => s.id === "perseiden")!;
const quadrantiden = meteorShowers.find(s => s.id === "quadrantiden")!;

describe("isShowerActive", () => {
  it("erkennt den Aktivitätszeitraum innerhalb eines Jahres", () => {
    expect(isShowerActive(perseiden, new Date(2026, 7, 1))).toBe(true); // 1. August
    expect(isShowerActive(perseiden, new Date(2026, 5, 1))).toBe(false); // 1. Juni
  });

  it("verkraftet Zeiträume über den Jahreswechsel", () => {
    expect(isShowerActive(quadrantiden, new Date(2026, 11, 30))).toBe(true); // 30. Dez.
    expect(isShowerActive(quadrantiden, new Date(2027, 0, 5))).toBe(true); // 5. Jan.
    expect(isShowerActive(quadrantiden, new Date(2026, 5, 5))).toBe(false);
  });
});

describe("upcomingShowers", () => {
  it("liefert die nächsten Maxima sortiert nach Nähe", () => {
    const list = upcomingShowers(new Date(2026, 7, 1), 3); // 1. August
    expect(list[0].shower.id).toBe("perseiden");
    expect(list[0].daysUntilPeak).toBe(11);
    expect(list[0].activeNow).toBe(true);
    // aufsteigend sortiert
    for (let i = 1; i < list.length; i++) {
      expect(list[i].daysUntilPeak).toBeGreaterThanOrEqual(
        list[i - 1].daysUntilPeak
      );
    }
  });

  it("springt über den Jahreswechsel ins Folgejahr", () => {
    const list = upcomingShowers(new Date(2026, 11, 28), 2); // 28. Dezember
    expect(list[0].shower.id).toBe("quadrantiden");
    expect(list[0].peakDate.getFullYear()).toBe(2027);
  });

  it("liefert eine Mondbewertung fürs Maximum", () => {
    const list = upcomingShowers(new Date(2026, 7, 1), 4);
    for (const entry of list) {
      expect(entry.moonIllumination).toBeGreaterThanOrEqual(0);
      expect(entry.moonIllumination).toBeLessThanOrEqual(1);
      expect(entry.moonInterferes).toBe(entry.moonIllumination > 0.6);
    }
  });
});
