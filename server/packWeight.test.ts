import { describe, expect, it } from "vitest";
import {
  computePackWeight,
  formatGrams,
  weightBudgetStatus,
  personWeights,
} from "@shared/packWeight";

const inventory = [
  { name: "Zelt", weightGrams: 3200, volumeLiters: 12 },
  { name: "Schlafsack", weightGrams: 1100, volumeLiters: 8 },
  { name: "Kocher", weightGrams: 450, volumeLiters: 1.5 },
];

describe("computePackWeight", () => {
  it("summiert Gewicht und Volumen über den Namens-Abgleich", () => {
    const summary = computePackWeight(
      [
        { name: "Zelt", quantity: 1, checked: true },
        { name: "Schlafsack", quantity: 2, checked: false },
        { name: "Sonnencreme", quantity: 1, checked: false },
      ],
      inventory
    );
    expect(summary.totalGrams).toBe(3200 + 2200);
    expect(summary.packedGrams).toBe(3200);
    expect(summary.totalVolumeLiters).toBe(28);
    expect(summary.matchedCount).toBe(2);
    expect(summary.unmatchedCount).toBe(1);
  });

  it("gleicht Namen unabhängig von Gross-/Kleinschreibung und Leerraum ab", () => {
    const summary = computePackWeight(
      [{ name: "  schlafsack ", quantity: 1, checked: false }],
      inventory
    );
    expect(summary.matchedCount).toBe(1);
    expect(summary.totalGrams).toBe(1100);
  });

  it("liefert eine leere Bilanz ohne Treffer", () => {
    const summary = computePackWeight(
      [{ name: "Buch", quantity: 1, checked: false }],
      inventory
    );
    expect(summary.totalGrams).toBe(0);
    expect(summary.matchedCount).toBe(0);
    expect(summary.unmatchedCount).toBe(1);
  });
});

describe("formatGrams", () => {
  it("formatiert Gramm und Kilogramm", () => {
    expect(formatGrams(450)).toBe("450 g");
    expect(formatGrams(12480)).toBe("12,5 kg");
    expect(formatGrams(1000)).toBe("1,0 kg");
  });
});

describe("weightBudgetStatus", () => {
  it("meldet ok unter 90 Prozent", () => {
    expect(weightBudgetStatus(4000, 10000)).toEqual({
      level: "ok",
      percent: 40,
      overGrams: 0,
    });
    expect(weightBudgetStatus(0, 10000)).toEqual({
      level: "ok",
      percent: 0,
      overGrams: 0,
    });
  });

  it("warnt ab 90 Prozent, solange das Budget nicht überschritten ist", () => {
    expect(weightBudgetStatus(9000, 10000)).toEqual({
      level: "warn",
      percent: 90,
      overGrams: 0,
    });
    // Exakt am Budget: 100 %, aber noch nichts drüber
    expect(weightBudgetStatus(10000, 10000)).toEqual({
      level: "warn",
      percent: 100,
      overGrams: 0,
    });
  });

  it("meldet over mit Überschuss in Gramm oberhalb des Budgets", () => {
    expect(weightBudgetStatus(12500, 10000)).toEqual({
      level: "over",
      percent: 125,
      overGrams: 2500,
    });
  });

  it("rundet erst ab 90 gerundeten Prozent zur Warnung", () => {
    // 8949/10000 → 89 % gerundet → noch ok
    expect(weightBudgetStatus(8949, 10000).level).toBe("ok");
    // 8950/10000 → 90 % gerundet → warn
    expect(weightBudgetStatus(8950, 10000).level).toBe("warn");
  });

  it("bleibt bei ungültigem Budget von 0 defensiv (0 Prozent, Überschuss zählt)", () => {
    expect(weightBudgetStatus(5000, 0)).toEqual({
      level: "over",
      percent: 0,
      overGrams: 5000,
    });
  });
});

describe("personWeights (#506)", () => {
  const inventory = [
    { name: "Zelt", weightGrams: 3200, volumeLiters: 20 },
    { name: "Schlafsack", weightGrams: 900, volumeLiters: 8 },
    { name: "Kocher", weightGrams: 450, volumeLiters: 2 },
  ];

  it("summiert das Gewicht je Person, schwerste zuerst, Allgemein zuletzt", () => {
    const rows = personWeights(
      [
        { name: "Zelt", quantity: 1, checked: false, assignee: "Ben" },
        { name: "Schlafsack", quantity: 2, checked: true, assignee: "Anna" },
        { name: "Kocher", quantity: 1, checked: false, assignee: null },
        // Ohne Inventar-Treffer zählt nichts – ehrlich statt geraten
        { name: "Unbekanntes", quantity: 1, checked: false, assignee: "Ben" },
      ],
      inventory
    );
    expect(rows).toEqual([
      { person: "Ben", grams: 3200 },
      { person: "Anna", grams: 1800 },
      { person: null, grams: 450 },
    ]);
  });

  it("liefert leer, wenn nichts zugeordnet oder gewogen ist", () => {
    expect(personWeights([], inventory)).toEqual([]);
    expect(
      personWeights(
        [{ name: "Nirgends", quantity: 1, checked: false, assignee: "Anna" }],
        inventory
      )
    ).toEqual([]);
  });
});
