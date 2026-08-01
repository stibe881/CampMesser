import { describe, expect, it } from "vitest";
import { computePackWeight, formatGrams } from "@shared/packWeight";

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
      inventory,
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
      inventory,
    );
    expect(summary.matchedCount).toBe(1);
    expect(summary.totalGrams).toBe(1100);
  });

  it("liefert eine leere Bilanz ohne Treffer", () => {
    const summary = computePackWeight([{ name: "Buch", quantity: 1, checked: false }], inventory);
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
