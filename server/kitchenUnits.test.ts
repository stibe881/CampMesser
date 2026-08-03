import { describe, expect, it } from "vitest";
import {
  celsiusForGasMark,
  celsiusToFahrenheit,
  convertVolume,
  DENSITY_G_PER_ML,
  DENSITY_INGREDIENTS,
  fahrenheitToCelsius,
  gramsToMl,
  mlToGrams,
  OVEN_LEVELS,
  ovenLevelForCelsius,
  roundResult,
  VOLUME_ML,
  VOLUME_UNITS,
} from "@shared/kitchenUnits";
import { pick } from "@shared/i18n";

describe("convertVolume", () => {
  it("rechnet Schweizer Küchenmasse in Milliliter", () => {
    expect(convertVolume(1, "cup", "ml")).toBe(200);
    expect(convertVolume(1, "tbsp", "ml")).toBe(15);
    expect(convertVolume(1, "tsp", "ml")).toBe(5);
    expect(convertVolume(1, "dl", "ml")).toBe(100);
    expect(convertVolume(1, "l", "dl")).toBe(10);
  });

  it("rechnet in beide Richtungen", () => {
    expect(convertVolume(200, "ml", "cup")).toBe(1);
    expect(convertVolume(45, "ml", "tbsp")).toBe(3);
    expect(convertVolume(2, "dl", "cup")).toBe(1);
  });

  it("bleibt beim gleichen Mass unverändert", () => {
    VOLUME_UNITS.forEach(unit => {
      expect(convertVolume(3, unit, unit)).toBe(3);
    });
  });

  it("überlebt den Rundlauf über Millilitern", () => {
    VOLUME_UNITS.forEach(unit => {
      const ml = convertVolume(7, unit, "ml");
      expect(convertVolume(ml, "ml", unit)).toBeCloseTo(7);
      expect(ml).toBe(7 * VOLUME_ML[unit]);
    });
  });

  it("fängt unbrauchbare Werte ab", () => {
    expect(convertVolume(Number.NaN, "dl", "ml")).toBe(0);
  });
});

describe("Dichten", () => {
  it("kennt die sechs gängigen Zutaten", () => {
    expect(DENSITY_INGREDIENTS.length).toBe(6);
    DENSITY_INGREDIENTS.forEach(ingredient => {
      expect(DENSITY_G_PER_ML[ingredient]).toBeGreaterThan(0);
    });
  });

  it("rechnet Gramm in Milliliter", () => {
    // Mehl ist deutlich leichter als Wasser: 100 g füllen mehr als 100 ml
    expect(roundResult(gramsToMl(100, "flour"))).toBe(182);
    expect(gramsToMl(100, "water")).toBe(100);
    expect(roundResult(gramsToMl(100, "oil"))).toBe(109);
  });

  it("rechnet Milliliter in Gramm", () => {
    expect(mlToGrams(200, "flour")).toBeCloseTo(110);
    expect(mlToGrams(200, "water")).toBe(200);
    expect(mlToGrams(100, "milk")).toBeCloseTo(103);
  });

  it("überlebt den Rundlauf g → ml → g", () => {
    DENSITY_INGREDIENTS.forEach(ingredient => {
      expect(mlToGrams(gramsToMl(250, ingredient), ingredient)).toBeCloseTo(
        250
      );
    });
  });

  it("fängt unbrauchbare Werte ab", () => {
    expect(gramsToMl(Number.NaN, "flour")).toBe(0);
    expect(mlToGrams(Number.NaN, "flour")).toBe(0);
  });
});

describe("Temperatur", () => {
  it("rechnet °C in °F", () => {
    expect(celsiusToFahrenheit(0)).toBe(32);
    expect(celsiusToFahrenheit(100)).toBe(212);
    expect(celsiusToFahrenheit(180)).toBe(356);
    expect(celsiusToFahrenheit(-40)).toBe(-40);
  });

  it("rechnet °F in °C", () => {
    expect(fahrenheitToCelsius(32)).toBe(0);
    expect(fahrenheitToCelsius(212)).toBe(100);
    expect(fahrenheitToCelsius(-40)).toBe(-40);
  });

  it("überlebt den Rundlauf", () => {
    [-20, 0, 37, 180, 250].forEach(celsius => {
      expect(fahrenheitToCelsius(celsiusToFahrenheit(celsius))).toBeCloseTo(
        celsius
      );
    });
  });
});

describe("Backofen-Stufen", () => {
  it("liefert eine lückenlose, steigende Tabelle 1–9", () => {
    expect(OVEN_LEVELS.length).toBe(9);
    OVEN_LEVELS.forEach((level, index) => {
      expect(level.gasMark).toBe(index + 1);
      if (index > 0) {
        expect(level.celsius).toBeGreaterThan(OVEN_LEVELS[index - 1].celsius);
      }
      expect(pick(level.label, "de")).not.toBe("");
      expect(pick(level.label, "fr")).not.toBe("");
      expect(pick(level.label, "it")).not.toBe("");
      expect(pick(level.label, "en")).not.toBe("");
    });
  });

  it("findet die nächstgelegene Stufe zu einer Temperatur", () => {
    expect(ovenLevelForCelsius(180)?.gasMark).toBe(4);
    expect(ovenLevelForCelsius(175)?.gasMark).toBe(3);
    expect(ovenLevelForCelsius(200)?.gasMark).toBe(6);
    expect(ovenLevelForCelsius(240)?.gasMark).toBe(9);
  });

  it("nimmt bei gleichem Abstand die tiefere Stufe", () => {
    // 185 °C liegt genau zwischen Stufe 4 (180) und Stufe 5 (190)
    expect(ovenLevelForCelsius(185)?.gasMark).toBe(4);
  });

  it("kennt ausserhalb des Backofen-Bereichs keine Stufe", () => {
    expect(ovenLevelForCelsius(60)).toBeNull();
    expect(ovenLevelForCelsius(300)).toBeNull();
    expect(ovenLevelForCelsius(Number.NaN)).toBeNull();
  });

  it("liefert die Temperatur zu einer Stufe", () => {
    expect(celsiusForGasMark(4)).toBe(180);
    expect(celsiusForGasMark(9)).toBe(240);
    expect(celsiusForGasMark(12)).toBeNull();
  });
});

describe("roundResult", () => {
  it("rundet je nach Grösse unterschiedlich fein", () => {
    expect(roundResult(181.818)).toBe(182);
    expect(roundResult(13.333)).toBe(13.3);
    expect(roundResult(1.3333)).toBe(1.33);
    expect(roundResult(0.005)).toBe(0.01);
  });

  it("fängt unbrauchbare Werte ab", () => {
    expect(roundResult(Number.NaN)).toBe(0);
  });
});
