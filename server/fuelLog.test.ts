/**
 * Tankbuch (#443): Verbrauch zwischen Füllungen und der nach Distanz
 * GEWICHTETE Durchschnitt – ein kurzer Passabschnitt darf die lange
 * Autobahn nicht überstimmen.
 */
import { describe, expect, it } from "vitest";
import { averageConsumptionL100, fuelSegments } from "../shared/fuelLog";

const fill = (odometerKm: number, liters10: number, day = "2026-08-01") => ({
  day,
  odometerKm,
  liters10,
});

describe("fuelSegments", () => {
  it("rechnet den Verbrauch aus den getankten Litern der zweiten Füllung", () => {
    // 500 km, danach 40.0 l getankt → 8.0 l/100 km
    const segments = fuelSegments([fill(10_000, 450), fill(10_500, 400)]);
    expect(segments).toHaveLength(1);
    expect(segments[0].distanceKm).toBe(500);
    expect(segments[0].l100).toBe(8);
    expect(segments[0].plausible).toBe(true);
  });

  it("sortiert nach Kilometerstand, nicht nach Eingabe-Reihenfolge", () => {
    const segments = fuelSegments([fill(10_500, 400), fill(10_000, 450)]);
    expect(segments[0].fromKm).toBe(10_000);
  });

  it("markiert Kurzabschnitte und Unplausibles", () => {
    // 30 km Abschnitt → unplausibel; 100 km mit 60 l → 60 l/100 km → unplausibel
    const segments = fuelSegments([
      fill(1000, 100),
      fill(1030, 100),
      fill(1130, 600),
    ]);
    expect(segments.map(s => s.plausible)).toEqual([false, false]);
  });

  it("überspringt gleiche oder rückläufige Stände", () => {
    expect(fuelSegments([fill(1000, 100), fill(1000, 100)])).toHaveLength(0);
  });
});

describe("averageConsumptionL100", () => {
  it("gewichtet nach Distanz", () => {
    // 900 km à 6 l/100 (54 l) + 100 km à 10 l/100 (10 l) → 64 l / 1000 km = 6.4
    const average = averageConsumptionL100([
      fill(0, 500),
      fill(900, 540),
      fill(1000, 100),
    ]);
    expect(average).toBe(6.4);
  });

  it("lässt unplausible Abschnitte aus dem Durchschnitt", () => {
    const average = averageConsumptionL100([
      fill(0, 500),
      fill(500, 400), // 8.0 l/100, plausibel
      fill(520, 500), // 20 km «Abschnitt» – Rauschen
    ]);
    expect(average).toBe(8);
  });

  it("gibt null ohne plausible Abschnitte", () => {
    expect(averageConsumptionL100([fill(0, 500)])).toBeNull();
    expect(averageConsumptionL100([])).toBeNull();
  });
});
