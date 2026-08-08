import { describe, expect, it } from "vitest";
import { inventoryValue } from "@shared/inventoryValue";

/** Inventar-Gesamtwert (#511). */
describe("inventoryValue", () => {
  it("summiert Preis × Stückzahl je Kategorie, grösste zuerst", () => {
    const summary = inventoryValue([
      { category: "Zelt", priceRappen: 45000, quantity: 1 },
      { category: "Küche", priceRappen: 3000, quantity: 2 },
      { category: "Küche", priceRappen: 12000, quantity: 1 },
      // Ohne Preis: zählt als Untergrenzen-Hinweis, nicht als 0 Franken
      { category: "Zelt", priceRappen: null, quantity: 1 },
    ]);
    expect(summary.totalRappen).toBe(63000);
    expect(summary.valuedCount).toBe(3);
    expect(summary.unvaluedCount).toBe(1);
    expect(summary.rows).toEqual([
      { category: "Zelt", rappen: 45000 },
      { category: "Küche", rappen: 18000 },
    ]);
  });

  it("bleibt bei leerem Inventar bei null Franken", () => {
    expect(inventoryValue([]).totalRappen).toBe(0);
  });
});
