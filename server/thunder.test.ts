import { describe, expect, it } from "vitest";
import {
  ALL_CLEAR_MINUTES,
  DANGER_DISTANCE_KM,
  MAX_COUNT_SECONDS,
  SHELTER_DISTANCE_KM,
  allClearAt,
  minutesUntilAllClear,
  speedOfSound,
  stormLevel,
  stormTrend,
  strikeDistanceKm,
} from "@shared/thunder";

const strike = (at: number, distanceKm: number) => ({
  at,
  seconds: distanceKm * 3,
  distanceKm,
});

describe("Gewitter-Entfernung (#274)", () => {
  it("rechnet die Faustregel «drei Sekunden pro Kilometer» sauber nach", () => {
    const km = strikeDistanceKm(3)!;
    // Bei 15 °C sind drei Sekunden gut ein Kilometer
    expect(km).toBeGreaterThan(1);
    expect(km).toBeLessThan(1.05);
    expect(strikeDistanceKm(30)!).toBeGreaterThan(10);
  });

  it("berücksichtigt die Temperatur", () => {
    expect(speedOfSound(0)).toBeCloseTo(331.3, 1);
    expect(speedOfSound(30)).toBeGreaterThan(speedOfSound(0));
    // Ohne Angabe wird mit dem Standardwert gerechnet
    expect(speedOfSound(null)).toBeCloseTo(speedOfSound(15), 5);
    const warm = strikeDistanceKm(10, 30)!;
    const cold = strikeDistanceKm(10, 0)!;
    expect(warm).toBeGreaterThan(cold);
  });

  it("verweigert unsinnige Zeiten, statt eine Zahl zu erfinden", () => {
    expect(strikeDistanceKm(-1)).toBeNull();
    expect(strikeDistanceKm(MAX_COUNT_SECONDS + 1)).toBeNull();
    expect(strikeDistanceKm(Number.NaN)).toBeNull();
    expect(strikeDistanceKm(0)).toBe(0);
  });

  it("die Stufen folgen der 30-30-Regel", () => {
    expect(stormLevel(1)).toBe("gefahr");
    expect(stormLevel(DANGER_DISTANCE_KM - 0.1)).toBe("gefahr");
    expect(stormLevel(DANGER_DISTANCE_KM)).toBe("warnung");
    expect(stormLevel(SHELTER_DISTANCE_KM)).toBe("warnung");
    expect(stormLevel(SHELTER_DISTANCE_KM + 0.1)).toBe("beobachten");
  });

  it("erkennt ein näher ziehendes Gewitter", () => {
    const list = [strike(1000, 12), strike(2000, 10), strike(3000, 5)];
    expect(stormTrend(list)).toBe("naeher");
  });

  it("erkennt ein abziehendes Gewitter", () => {
    const list = [strike(1000, 4), strike(2000, 5), strike(3000, 12)];
    expect(stormTrend(list)).toBe("weiter");
  });

  it("kleine Abweichungen sind Zählrauschen und kein Trend", () => {
    const list = [strike(1000, 5), strike(2000, 5.4)];
    expect(stormTrend(list)).toBe("gleich");
  });

  it("ohne zwei Messungen gibt es keinen Trend", () => {
    expect(stormTrend([])).toBeNull();
    expect(stormTrend([strike(1000, 5)])).toBeNull();
  });

  it("verglichen wird gegen das Mittel, nicht gegen die letzte Messung", () => {
    // Gegen die Vormessung allein wären das 2 km näher – gegen das Mittel
    // der drei vorangehenden (10 km) bleibt es unter der Schwelle
    const list = [
      strike(1000, 11),
      strike(2000, 10),
      strike(3000, 9),
      strike(4000, 9.5),
    ];
    expect(stormTrend(list)).toBe("gleich");
  });

  it("die Entwarnung liegt 30 Minuten nach dem letzten Donner", () => {
    const list = [strike(1000, 5), strike(60_000, 4)];
    expect(allClearAt(list)).toBe(60_000 + ALL_CLEAR_MINUTES * 60_000);
    expect(minutesUntilAllClear(list, 60_000)).toBe(ALL_CLEAR_MINUTES);
    // Nach Ablauf bleibt es bei null Minuten statt negativ zu werden
    expect(minutesUntilAllClear(list, 60_000 + 60 * 60_000)).toBe(0);
    expect(allClearAt([])).toBeNull();
    expect(minutesUntilAllClear([], 0)).toBeNull();
  });
});
