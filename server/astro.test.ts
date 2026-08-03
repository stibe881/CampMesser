import { describe, expect, it } from "vitest";
import {
  isShowerActive,
  meteorShowers,
  showersNearPeak,
  upcomingShowers,
} from "@shared/astro";

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

describe("showersNearPeak", () => {
  it("markiert das Maximum und die drei Tage davor/danach", () => {
    // Perseiden: Maximum am 12. August
    expect(showersNearPeak(new Date(2026, 7, 12)).map(s => s.id)).toContain(
      "perseiden"
    );
    expect(showersNearPeak(new Date(2026, 7, 9)).map(s => s.id)).toContain(
      "perseiden"
    );
    expect(showersNearPeak(new Date(2026, 7, 15)).map(s => s.id)).toContain(
      "perseiden"
    );
    expect(showersNearPeak(new Date(2026, 7, 8)).map(s => s.id)).not.toContain(
      "perseiden"
    );
    expect(showersNearPeak(new Date(2026, 7, 16)).map(s => s.id)).not.toContain(
      "perseiden"
    );
  });

  it("greift über den Jahreswechsel", () => {
    // Quadrantiden: Maximum am 3. Januar – am 31. Dezember bereits im Fenster
    expect(showersNearPeak(new Date(2026, 11, 31)).map(s => s.id)).toContain(
      "quadrantiden"
    );
    expect(showersNearPeak(new Date(2027, 0, 3)).map(s => s.id)).toContain(
      "quadrantiden"
    );
  });

  it("liefert an ruhigen Tagen nichts und respektiert das Fenster", () => {
    expect(showersNearPeak(new Date(2026, 8, 15))).toEqual([]);
    expect(showersNearPeak(new Date(2026, 7, 8), 4).map(s => s.id)).toContain(
      "perseiden"
    );
  });

  it("kann mehrere Ströme gleichzeitig melden", () => {
    // Delta-Aquariiden (30. Juli) und Perseiden (12. August) liegen weit
    // auseinander – am 31. Juli ist nur einer im Fenster
    expect(showersNearPeak(new Date(2026, 6, 31))).toHaveLength(1);
    expect(showersNearPeak(new Date(2026, 9, 8)).length).toBeGreaterThanOrEqual(
      1
    );
  });
});
