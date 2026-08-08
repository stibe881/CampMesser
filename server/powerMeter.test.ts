/**
 * Stromzähler am Stellplatz (#442): banale Rechnung, aber die Ränder
 * zählen – Ende vor Anfang, Wucher-Preis, Zähler-Nachkommastelle.
 */
import { describe, expect, it } from "vitest";
import { parseKwhInput, powerMeterCost } from "../shared/powerMeter";

describe("parseKwhInput", () => {
  it("liest Punkt- und Komma-Eingaben und rundet auf 0.1 kWh", () => {
    expect(parseKwhInput("1234.5")).toBe(1234.5);
    expect(parseKwhInput("1234,56")).toBe(1234.6);
    expect(parseKwhInput("0")).toBe(0);
  });

  it("weist Unbrauchbares ab", () => {
    expect(parseKwhInput("-1")).toBeNull();
    expect(parseKwhInput("abc")).toBeNull();
    expect(parseKwhInput("2000000")).toBeNull();
  });
});

describe("powerMeterCost", () => {
  it("rechnet Verbrauch × Preis", () => {
    // 42.5 kWh × 0.65 CHF = 27.625 → 2763 Rappen (gerundet)
    expect(
      powerMeterCost({ startKwh: 1000, endKwh: 1042.5, pricePerKwhRappen: 65 })
    ).toEqual({ kwh: 42.5, rappen: 2763 });
  });

  it("ergibt 0 bei Ende vor Anfang", () => {
    expect(
      powerMeterCost({ startKwh: 100, endKwh: 99, pricePerKwhRappen: 65 })
    ).toEqual({ kwh: 0, rappen: 0 });
  });

  it("ergibt 0 ohne plausiblen Preis", () => {
    expect(
      powerMeterCost({ startKwh: 0, endKwh: 10, pricePerKwhRappen: 0 })
    ).toEqual({ kwh: 0, rappen: 0 });
    expect(
      powerMeterCost({ startKwh: 0, endKwh: 10, pricePerKwhRappen: 900 })
    ).toEqual({ kwh: 0, rappen: 0 });
  });

  it("hält die Zähler-Nachkommastelle sauber", () => {
    expect(
      powerMeterCost({ startKwh: 10.2, endKwh: 10.5, pricePerKwhRappen: 100 })
    ).toEqual({ kwh: 0.3, rappen: 30 });
  });
});
