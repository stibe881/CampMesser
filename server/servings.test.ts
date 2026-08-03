import { describe, expect, it } from "vitest";
import {
  clampServings,
  findUnit,
  formatAmount,
  parseIngredientAmount,
  parseNumberToken,
  roundAmount,
  scaleIngredientLine,
  scaleIngredientLines,
  scaleIngredientsForServings,
  servingsFactor,
} from "@shared/servings";

describe("parseNumberToken", () => {
  it("liest ganze Zahlen, Dezimalzahlen und Brüche", () => {
    expect(parseNumberToken("400")).toBe(400);
    expect(parseNumberToken("1,5")).toBe(1.5);
    expect(parseNumberToken("1.5")).toBe(1.5);
    expect(parseNumberToken("1/2")).toBe(0.5);
    expect(parseNumberToken("3/4")).toBe(0.75);
    expect(parseNumberToken("1 1/2")).toBe(1.5);
    expect(parseNumberToken("½")).toBe(0.5);
    expect(parseNumberToken("1½")).toBe(1.5);
    expect(parseNumberToken("1 ½")).toBe(1.5);
    expect(parseNumberToken("¼")).toBe(0.25);
  });

  it("liefert NaN bei Unsinn", () => {
    expect(Number.isNaN(parseNumberToken("abc"))).toBe(true);
    expect(Number.isNaN(parseNumberToken("1/0"))).toBe(true);
  });
});

describe("findUnit", () => {
  it("erkennt Einheiten in allen vier Sprachen", () => {
    expect(findUnit("g")?.category).toBe("mass");
    expect(findUnit("KG")?.category).toBe("mass");
    expect(findUnit("dl")?.category).toBe("volume");
    expect(findUnit("ml")?.category).toBe("volume");
    expect(findUnit("EL")?.category).toBe("spoon");
    expect(findUnit("tsp")?.category).toBe("spoon");
    expect(findUnit("cucchiaio")?.category).toBe("spoon");
    expect(findUnit("Tasse")?.category).toBe("spoon");
    expect(findUnit("Dose")?.category).toBe("piece");
    expect(findUnit("boîte")?.category).toBe("piece");
    expect(findUnit("Päckli")?.category).toBe("piece");
    expect(findUnit("Prise")?.category).toBe("piece");
  });

  it("nimmt den Schlusspunkt einer Abkürzung mit", () => {
    expect(findUnit("Stk.")?.category).toBe("piece");
  });

  it("kennt Lebensmittel nicht als Einheit", () => {
    expect(findUnit("Zwiebel")).toBeNull();
    expect(findUnit("Mehl")).toBeNull();
  });
});

describe("parseIngredientAmount", () => {
  it("liest Menge und Einheit am Zeilenanfang", () => {
    const amount = parseIngredientAmount("300 g Mehl");
    expect(amount?.value).toBe(300);
    expect(amount?.category).toBe("mass");
    expect(amount?.unitText).toBe("g");
    expect(amount?.rest).toBe(" Mehl");
  });

  it("liest Stückzahlen ohne Einheit", () => {
    const amount = parseIngredientAmount("3 Eier");
    expect(amount?.value).toBe(3);
    expect(amount?.unit).toBeNull();
    expect(amount?.category).toBe("piece");
  });

  it("liest Bereiche mit Trennzeichen", () => {
    const dash = parseIngredientAmount("2-3 Zwiebeln");
    expect(dash?.value).toBe(2);
    expect(dash?.valueTo).toBe(3);
    const word = parseIngredientAmount("2 bis 3 Rüebli");
    expect(word?.value).toBe(2);
    expect(word?.valueTo).toBe(3);
    expect(word?.rangeSeparator).toBe(" bis ");
  });

  it("liest Brüche und Dezimalzahlen", () => {
    expect(parseIngredientAmount("1/2 TL Salz")?.value).toBe(0.5);
    expect(parseIngredientAmount("½ TL Salz")?.value).toBe(0.5);
    expect(parseIngredientAmount("1,5 dl Rahm")?.value).toBe(1.5);
    expect(parseIngredientAmount("1.5 dl Rahm")?.value).toBe(1.5);
  });

  it("erkennt Zeilen ohne Menge nicht", () => {
    expect(parseIngredientAmount("Salz nach Geschmack")).toBeNull();
    expect(parseIngredientAmount("Öl zum Braten")).toBeNull();
    expect(parseIngredientAmount("")).toBeNull();
    expect(parseIngredientAmount("   ")).toBeNull();
  });

  it("hält Zahlen im Wortinnern für keine Menge", () => {
    expect(parseIngredientAmount("3-Käse-Mischung")).toBeNull();
    expect(parseIngredientAmount("100%-Vollkornmehl")).toBeNull();
  });

  it("verwirft 0 und negative Mengen", () => {
    expect(parseIngredientAmount("0 g Zucker")).toBeNull();
    expect(parseIngredientAmount("-2 Eier")).toBeNull();
  });
});

describe("roundAmount", () => {
  it("rundet Gramm und Milliliter auf glatte Werte", () => {
    expect(roundAmount(133.33, "mass")).toBe(130);
    expect(roundAmount(266.67, "mass")).toBe(270);
    expect(roundAmount(1333, "mass")).toBe(1350);
    expect(roundAmount(66.7, "mass")).toBe(65);
    expect(roundAmount(7.4, "volume")).toBe(7.5);
  });

  it("rundet Löffelmasse auf Viertel und Halbe", () => {
    expect(roundAmount(0.66, "spoon")).toBe(0.75);
    expect(roundAmount(1.3, "spoon")).toBe(1.5);
    expect(roundAmount(2.6, "spoon")).toBe(2.5);
  });

  it("rundet Stückzahlen auf Halbe oder Ganze – keine 1,3333 Eier", () => {
    expect(roundAmount(1.3333, "piece")).toBe(1.5);
    expect(roundAmount(2.4, "piece")).toBe(2.5);
    expect(roundAmount(4.3, "piece")).toBe(4);
    expect(roundAmount(6.6, "piece")).toBe(7);
  });

  it("rundet sehr kleine Mengen nie auf 0", () => {
    expect(roundAmount(0.01, "mass")).toBe(0.05);
    expect(roundAmount(0.02, "spoon")).toBe(0.25);
    expect(roundAmount(0.1, "piece")).toBe(0.5);
  });
});

describe("formatAmount", () => {
  it("schreibt ganze Zahlen ohne Nachkomma", () => {
    expect(formatAmount(400)).toBe("400");
    expect(formatAmount(2)).toBe("2");
  });

  it("nutzt Komma in DE/FR/IT und Punkt in EN", () => {
    expect(formatAmount(1.5, "de")).toBe("1,5");
    expect(formatAmount(1.5, "fr")).toBe("1,5");
    expect(formatAmount(1.5, "it")).toBe("1,5");
    expect(formatAmount(1.5, "en")).toBe("1.5");
    expect(formatAmount(0.25, "de")).toBe("0,25");
  });
});

describe("servingsFactor", () => {
  it("rechnet von der Grundportionenzahl auf die Wunschzahl", () => {
    expect(servingsFactor(4, 8)).toBe(2);
    expect(servingsFactor(4, 2)).toBe(0.5);
    expect(servingsFactor(4, 4)).toBe(1);
    expect(servingsFactor(3, 4)).toBeCloseTo(4 / 3);
  });

  it("fällt bei unbrauchbaren Werten auf 1 zurück", () => {
    expect(servingsFactor(0, 4)).toBe(1);
    expect(servingsFactor(4, 0)).toBe(1);
    expect(servingsFactor(Number.NaN, 4)).toBe(1);
  });
});

describe("clampServings", () => {
  it("hält die Personenzahl im erlaubten Bereich", () => {
    expect(clampServings(0)).toBe(1);
    expect(clampServings(25)).toBe(20);
    expect(clampServings(6)).toBe(6);
    expect(clampServings(Number.NaN, 4)).toBe(4);
    expect(clampServings(3.4)).toBe(3);
  });
});

describe("scaleIngredientLine", () => {
  it("rechnet Gewichte und Volumen mit", () => {
    expect(scaleIngredientLine("300 g Mehl", 2)).toBe("600 g Mehl");
    expect(scaleIngredientLine("4 dl Milch", 0.5)).toBe("2 dl Milch");
    expect(scaleIngredientLine("400 ml Wasser", 1.5)).toBe("600 ml Wasser");
  });

  it("rechnet Stückzahlen mit und rundet auf Halbe/Ganze", () => {
    expect(scaleIngredientLine("3 Eier", 2)).toBe("6 Eier");
    expect(scaleIngredientLine("4 Eier", 1 / 3)).toBe("1,5 Eier");
    expect(scaleIngredientLine("1 Zitrone", 2)).toBe("2 Zitrone");
  });

  it("rechnet Bereiche an beiden Enden mit", () => {
    expect(scaleIngredientLine("2-3 Zwiebeln", 2)).toBe("4-6 Zwiebeln");
    expect(scaleIngredientLine("2 bis 3 Rüebli", 2)).toBe("4 bis 6 Rüebli");
  });

  it("liest Brüche und schreibt Dezimalzahlen", () => {
    expect(scaleIngredientLine("1/2 TL Salz", 2)).toBe("1 TL Salz");
    expect(scaleIngredientLine("½ TL Salz", 3)).toBe("1,5 TL Salz");
    expect(scaleIngredientLine("1 EL Öl", 0.5)).toBe("0,5 EL Öl");
  });

  it("setzt Wort-Einheiten in die Mehrzahl", () => {
    expect(scaleIngredientLine("1 Dose Mais", 2)).toBe("2 Dosen Mais");
    expect(scaleIngredientLine("2 Dosen Mais", 0.5)).toBe("1 Dose Mais");
    expect(scaleIngredientLine("1 boîte de maïs", 2, "fr")).toBe(
      "2 boîtes de maïs"
    );
    expect(scaleIngredientLine("1 clove garlic", 3, "en")).toBe(
      "3 cloves garlic"
    );
    expect(scaleIngredientLine("1 Prise Salz", 2)).toBe("2 Prisen Salz");
  });

  it("lässt Zeilen ohne Menge unverändert", () => {
    expect(scaleIngredientLine("Salz nach Geschmack", 2)).toBe(
      "Salz nach Geschmack"
    );
    expect(scaleIngredientLine("Pfeffer", 4)).toBe("Pfeffer");
    expect(scaleIngredientLine("Öl zum Braten", 0.5)).toBe("Öl zum Braten");
  });

  it("lässt bei Faktor 1 alles genau so stehen", () => {
    expect(scaleIngredientLine("105 g Speck", 1)).toBe("105 g Speck");
    expect(scaleIngredientLine("1 1/2 TL Salz", 1)).toBe("1 1/2 TL Salz");
  });

  it("rundet kleine Mengen nicht auf 0 weg", () => {
    expect(scaleIngredientLine("1 g Safran", 0.25)).toBe("0,25 g Safran");
    // Mehrzahl bei allem ausser genau 1 – auch bei halben Mengen
    expect(scaleIngredientLine("1 Prise Salz", 0.25)).toBe("0,5 Prisen Salz");
  });

  it("kommt mit unbrauchbaren Faktoren zurecht", () => {
    expect(scaleIngredientLine("300 g Mehl", 0)).toBe("300 g Mehl");
    expect(scaleIngredientLine("300 g Mehl", -2)).toBe("300 g Mehl");
    expect(scaleIngredientLine("300 g Mehl", Number.NaN)).toBe("300 g Mehl");
  });
});

describe("scaleIngredientLines", () => {
  it("rechnet eine ganze Zutatenliste um", () => {
    expect(
      scaleIngredientLines(
        ["400 g Magronen", "2 Zwiebeln", "Salz nach Geschmack"],
        0.5
      )
    ).toEqual(["200 g Magronen", "1 Zwiebeln", "Salz nach Geschmack"]);
  });

  it("überlebt den Rundlauf «×2 dann ÷2»", () => {
    const lines = [
      "400 g Magronen",
      "200 g Bergkäse",
      "3 Eier",
      "4 dl Milch",
      "2 EL Öl",
      "1,5 dl Rahm",
      "2-3 Zwiebeln",
      "1 Dose Mais",
      "0,5 TL Salz",
      "Salz nach Geschmack",
      "Pfeffer",
    ];
    expect(scaleIngredientLines(scaleIngredientLines(lines, 2), 0.5)).toEqual(
      lines
    );
  });

  it("überlebt den Rundlauf auch auf Englisch", () => {
    const lines = ["300 g flour", "2 tbsp oil", "1 can sweetcorn", "4 eggs"];
    expect(
      scaleIngredientLines(scaleIngredientLines(lines, 2, "en"), 0.5, "en")
    ).toEqual(lines);
  });
});

describe("scaleIngredientsForServings", () => {
  it("rechnet von den Grundportionen auf die Wunsch-Personenzahl", () => {
    expect(scaleIngredientsForServings(["400 g Magronen"], 4, 6)).toEqual([
      "600 g Magronen",
    ]);
    expect(scaleIngredientsForServings(["400 g Magronen"], 4, 4)).toEqual([
      "400 g Magronen",
    ]);
  });
});
