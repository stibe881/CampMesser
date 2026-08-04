import { describe, expect, it } from "vitest";
import { baseFactorFor, summarizeIngredients } from "@shared/groceryList";

/** Nur die Zeilen – die Herkunft prüfen eigene Fälle. */
function lines(input: string[]): string[] {
  return summarizeIngredients(input).map(item => item.line);
}

describe("Wocheneinkauf aus dem Menüplan", () => {
  it("addiert dieselbe Zutat über mehrere Tage", () => {
    // Der eigentliche Fehler von früher: der Donnerstag fiel unter den Tisch
    expect(lines(["2 dl Rahm", "1 dl Rahm"])).toEqual(["3 dl Rahm"]);
  });

  it("rechnet Gramm und Kilo zusammen", () => {
    expect(lines(["500 g Hackfleisch", "0,5 kg Hackfleisch"])).toEqual([
      "1 kg Hackfleisch",
    ]);
  });

  it("bleibt in der Einheit, in der geplant wurde", () => {
    // Wer in Dezilitern plant, bekommt Deziliter – keine 400 Milliliter
    expect(lines(["2 dl Milch", "2 dl Milch"])).toEqual(["4 dl Milch"]);
    expect(lines(["200 g Mehl", "300 g Mehl"])).toEqual(["500 g Mehl"]);
  });

  it("wechselt erst auf die grosse Einheit, wenn sie voll ist", () => {
    expect(lines(["800 g Mehl", "700 g Mehl"])).toEqual(["1,5 kg Mehl"]);
    expect(lines(["600 ml Wasser", "600 ml Wasser"])).toEqual(["1,2 l Wasser"]);
  });

  it("fasst Ein- und Mehrzahl zusammen", () => {
    expect(lines(["2 Zwiebeln", "1 Zwiebel"])).toEqual(["3 Zwiebeln"]);
  });

  it("verwechselt kurze Wörter nicht mit ihrer Mehrzahl", () => {
    // «Ei» und «Eis» sind nicht dasselbe – der Stamm ist zu kurz zum Falten
    const result = lines(["3 Ei", "1 Eis"]);
    expect(result).toHaveLength(2);
  });

  it("rechnet NICHT um, was sich nicht sicher umrechnen lässt", () => {
    // Ein Esslöffel ist kein Teelöffel, eine Dose keine 500 Gramm
    expect(lines(["1 EL Öl", "2 TL Öl"])).toEqual(["1 EL Öl", "2 TL Öl"]);
    expect(lines(["1 Dose Tomaten", "500 g Tomaten"])).toEqual([
      "1 Dose Tomaten",
      "500 g Tomaten",
    ]);
  });

  it("addiert gleiche Löffel- und Gebindemasse aber schon", () => {
    expect(lines(["1 EL Öl", "2 EL Öl"])).toEqual(["3 EL Öl"]);
    expect(lines(["1 Dose Tomaten", "2 Dosen Tomaten"])).toEqual([
      "3 Dose Tomaten",
    ]);
  });

  it("lässt Zutaten ohne Menge einfach stehen", () => {
    expect(lines(["Salz", "Pfeffer", "salz"])).toEqual(["Salz", "Pfeffer"]);
  });

  it("stellt Mengenangaben vor die mengenlosen Zutaten", () => {
    expect(lines(["Salz", "2 dl Rahm"])).toEqual(["2 dl Rahm", "Salz"]);
  });

  it("behält Bereiche als Bereich", () => {
    expect(lines(["2–3 Zwiebeln", "1 Zwiebel"])).toEqual(["3–4 Zwiebeln"]);
  });

  it("sagt, woraus eine Zeile zusammengerechnet wurde", () => {
    const items = summarizeIngredients(["2 dl Rahm", "1 dl Rahm", "Salz"]);
    expect(items[0].sources).toBe(2);
    expect(items[0].summed).toBe(true);
    expect(items[1].summed).toBe(false);
  });

  it("behält die Reihenfolge der Planung", () => {
    expect(lines(["1 kg Kartoffeln", "2 Zwiebeln", "1 kg Kartoffeln"])).toEqual(
      ["2 kg Kartoffeln", "2 Zwiebeln"]
    );
  });

  it("kommt mit leeren Zeilen zurecht", () => {
    expect(lines(["", "   ", "2 dl Rahm"])).toEqual(["2 dl Rahm"]);
    expect(lines([])).toEqual([]);
  });

  it("kennt Umrechnungsfaktoren nur für Gewicht und Volumen", () => {
    expect(baseFactorFor("kg")).toEqual({ factor: 1000, category: "mass" });
    expect(baseFactorFor("dl")).toEqual({ factor: 100, category: "volume" });
    // Löffel, Tassen und Gebinde bewusst nicht
    expect(baseFactorFor("EL")).toBeNull();
    expect(baseFactorFor("Dose")).toBeNull();
    expect(baseFactorFor(null)).toBeNull();
  });
});
