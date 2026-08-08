import { describe, expect, it } from "vitest";
import {
  COLD_TMIN_THRESHOLD,
  HEAT_TMAX_THRESHOLD,
  packingSuggestions,
  RAIN_PROB_THRESHOLD,
  WIND_MAX_THRESHOLD,
  type ForecastDay,
} from "@shared/packSuggestions";

/** Milder Tag, der keine Regel auslöst. */
const mild: ForecastDay = { tMax: 22, tMin: 12, precipProb: 20, windMax: 15 };

const names = (days: ForecastDay[], lang?: "de" | "fr" | "it" | "en") =>
  packingSuggestions(days, lang).map(s => s.name);

describe("packingSuggestions", () => {
  it("liefert ohne Prognose-Tage keine Vorschläge", () => {
    expect(packingSuggestions([])).toEqual([]);
  });

  it("liefert bei mildem Wetter keine Vorschläge", () => {
    expect(packingSuggestions([mild, mild])).toEqual([]);
  });

  it("schlägt bei Regen Regenjacke, Unterlage und Heringe vor", () => {
    const result = packingSuggestions([
      mild,
      { ...mild, precipProb: RAIN_PROB_THRESHOLD },
    ]);
    expect(result.map(s => s.name)).toEqual([
      "Regenjacke",
      "Zeltunterlage/Plane",
      "Zusätzliche Heringe",
    ]);
    // Kategorie passt zu den Vorlagen-Kategorien, Begründung nennt den Wert
    expect(result[0].category).toBe("Kleidung");
    expect(result[1].category).toBe("Schlafen");
    expect(result[0].reason).toBe("Regenrisiko bis 50 %");
  });

  it("löst die Regen-Regel unter dem Schwellwert nicht aus", () => {
    expect(names([{ ...mild, precipProb: RAIN_PROB_THRESHOLD - 1 }])).toEqual(
      []
    );
  });

  it("schlägt bei Hitze Sonnencreme, Sonnenhut und Wasserbehälter vor", () => {
    const result = packingSuggestions([{ ...mild, tMax: HEAT_TMAX_THRESHOLD }]);
    expect(result.map(s => s.name)).toEqual([
      "Sonnencreme",
      "Sonnenhut",
      "Extra Wasserbehälter",
    ]);
    expect(result[0].category).toBe("Hygiene");
    expect(result[2].category).toBe("Küche");
    expect(result[0].reason).toBe("Hitze bis 28 °C");
  });

  it("schlägt bei kalten Nächten Schlafsack, Mütze und Isomatte vor", () => {
    const result = packingSuggestions([{ ...mild, tMin: COLD_TMIN_THRESHOLD }]);
    expect(result.map(s => s.name)).toEqual([
      "Warmer Schlafsack",
      "Mütze",
      "Isolierende Isomatte",
    ]);
    expect(result[0].category).toBe("Schlafen");
    expect(result[1].category).toBe("Kleidung");
    expect(result[0].reason).toBe("Kalte Nächte bis 8 °C");
  });

  it("schlägt bei starkem Wind Sturmleinen und Heringe vor", () => {
    const result = packingSuggestions([
      { ...mild, windMax: WIND_MAX_THRESHOLD },
    ]);
    expect(result.map(s => s.name)).toEqual([
      "Sturmleinen",
      "Zusätzliche Heringe",
    ]);
    expect(result[0].reason).toBe("Böen bis 40 km/h");
  });

  it("ignoriert die Wind-Regel ohne windMax-Werte", () => {
    expect(names([{ tMax: 22, tMin: 12, precipProb: 20 }])).toEqual([]);
  });

  it("dedupliziert die Heringe bei Regen UND Wind (Regen-Begründung gewinnt)", () => {
    const result = packingSuggestions([
      { ...mild, precipProb: 80, windMax: 55 },
    ]);
    const pegs = result.filter(s => s.name === "Zusätzliche Heringe");
    expect(pegs).toHaveLength(1);
    expect(pegs[0].reason).toBe("Regenrisiko bis 80 %");
    expect(result.map(s => s.name)).toEqual([
      "Regenjacke",
      "Zeltunterlage/Plane",
      "Zusätzliche Heringe",
      "Sturmleinen",
    ]);
  });

  it("kombiniert alle Regeln ohne Duplikate", () => {
    const result = packingSuggestions([
      { tMax: 31, tMin: 6, precipProb: 70, windMax: 48 },
    ]);
    expect(result).toHaveLength(10); // 3 + 3 + 3 + 2 − 1 Duplikat (Heringe)
    expect(new Set(result.map(s => s.name)).size).toBe(10);
  });

  it("nimmt jeweils den extremsten Wert über alle Tage in die Begründung", () => {
    const result = packingSuggestions([
      { ...mild, precipProb: 55 },
      { ...mild, precipProb: 82.4 },
    ]);
    expect(result[0].reason).toBe("Regenrisiko bis 82 %");
  });

  it("übersetzt Namen, Kategorien und Begründungen in die gewählte Sprache", () => {
    const result = packingSuggestions([{ ...mild, precipProb: 60 }], "fr");
    expect(result[0].name).toBe("Veste de pluie");
    expect(result[0].category).toBe("Vêtements");
    expect(result[0].reason).toBe("Risque de pluie jusqu'à 60 %");
    const en = packingSuggestions([{ ...mild, tMin: 4 }], "en");
    expect(en.map(s => s.name)).toContain("Warm sleeping bag");
  });
});

describe("Zelt-Zeilen nach Reise-Art (#464)", () => {
  // Regen, Kälte und Wind zugleich – alle Zelt-Regeln feuern
  const wildDays = [{ tMax: 12, tMin: 3, precipProb: 80, windMax: 55 }];

  it("lässt ohne Zelt (Hotel, Städtereise) die Zelt-Zeilen weg", () => {
    const names = packingSuggestions(wildDays, "de", { tentGear: false }).map(
      s => s.name
    );
    expect(names).toContain("Regenjacke");
    expect(names).toContain("Mütze");
    expect(names).not.toContain("Zusätzliche Heringe");
    expect(names).not.toContain("Zeltunterlage/Plane");
    expect(names).not.toContain("Sturmleinen");
    expect(names).not.toContain("Warmer Schlafsack");
    expect(names).not.toContain("Isolierende Isomatte");
  });

  it("schlägt sie ohne Angabe weiterhin vor (bestehende Aufrufer)", () => {
    const names = packingSuggestions(wildDays, "de").map(s => s.name);
    expect(names).toContain("Zusätzliche Heringe");
    expect(names).toContain("Sturmleinen");
  });
});
