import { describe, expect, it } from "vitest";
import {
  DEFAULT_CONSUMPTION_L100,
  DEFAULT_FUEL_PRICE_RAPPEN,
  fuelCost,
  MAX_CONSUMPTION_L100,
  MAX_DISTANCE_KM,
} from "@shared/fuelCost";

describe("fuelCost", () => {
  it("rechnet Hin und zurück als Vorgabe", () => {
    const result = fuelCost({
      distanceKm: 100,
      consumptionL100: 10,
      pricePerLiterRappen: 200,
    });
    expect(result.totalKm).toBe(200);
    expect(result.liters).toBe(20);
    expect(result.rappen).toBe(4000);
  });

  it("rechnet auf Wunsch nur die einfache Strecke", () => {
    const result = fuelCost({
      distanceKm: 100,
      consumptionL100: 10,
      pricePerLiterRappen: 200,
      roundTrip: false,
    });
    expect(result.totalKm).toBe(100);
    expect(result.rappen).toBe(2000);
  });

  it("rundet erst ganz am Schluss", () => {
    // 2 × 137 km × 7.3 l/100 km × 189 Rp. = 37'798.7… Rappen
    const result = fuelCost({
      distanceKm: 137,
      consumptionL100: 7.3,
      pricePerLiterRappen: 189,
    });
    expect(result.rappen).toBe(Math.round(((2 * 137 * 7.3) / 100) * 189));
  });

  it("macht aus kaputten Eingaben null", () => {
    expect(
      fuelCost({
        distanceKm: Number.NaN,
        consumptionL100: 8,
        pricePerLiterRappen: 180,
      }).rappen
    ).toBe(0);
    expect(
      fuelCost({
        distanceKm: 100,
        consumptionL100: -5,
        pricePerLiterRappen: 180,
      }).rappen
    ).toBe(0);
  });

  it("kappt unsinnig grosse Eingaben", () => {
    const result = fuelCost({
      distanceKm: 999_999,
      consumptionL100: 999,
      pricePerLiterRappen: 200,
    });
    expect(result.totalKm).toBe(MAX_DISTANCE_KM * 2);
    expect(result.liters).toBe(
      (MAX_DISTANCE_KM * 2 * MAX_CONSUMPTION_L100) / 100
    );
  });

  it("hat brauchbare Vorgabewerte", () => {
    const result = fuelCost({
      distanceKm: 200,
      consumptionL100: DEFAULT_CONSUMPTION_L100,
      pricePerLiterRappen: DEFAULT_FUEL_PRICE_RAPPEN,
    });
    // 400 km bei 8.5 l/100 km und 1.85 CHF/l ≈ 63 CHF
    expect(result.rappen).toBeGreaterThan(5000);
    expect(result.rappen).toBeLessThan(8000);
  });
});
