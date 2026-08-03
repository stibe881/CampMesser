import { describe, expect, it } from "vitest";
import {
  formatChf,
  hasAnyPrice,
  inventoryTotalRappen,
  parseChfInput,
  rappenToInput,
} from "@/lib/money";

describe("formatChf", () => {
  it("formatiert Rappen als Franken mit zwei Nachkommastellen", () => {
    expect(formatChf(12345, "de")).toBe("123.45");
    expect(formatChf(0, "de")).toBe("0.00");
    expect(formatChf(5, "de")).toBe("0.05");
  });

  it("nutzt die Sprach-Formatierung (Tausendertrenner)", () => {
    // de-CH/en-GB gruppieren Tausender, fr-CH ebenfalls (schmales Leerzeichen)
    expect(formatChf(123456789, "de")).toMatch(/^1.234.567\.89$/);
    expect(formatChf(123456789, "en")).toBe("1,234,567.89");
  });

  it("fängt unplausible Werte ab", () => {
    expect(formatChf(Number.NaN, "de")).toBe("0.00");
  });
});

describe("inventoryTotalRappen", () => {
  it("summiert Preis × Anzahl", () => {
    expect(
      inventoryTotalRappen([
        { priceRappen: 12000, quantity: 1 },
        { priceRappen: 2500, quantity: 4 },
      ])
    ).toBe(22000);
  });

  it("ignoriert Einträge ohne Preis", () => {
    expect(
      inventoryTotalRappen([
        { priceRappen: null, quantity: 3 },
        { quantity: 2 },
        { priceRappen: 999, quantity: 1 },
      ])
    ).toBe(999);
  });

  it("ignoriert negative und unlesbare Werte", () => {
    expect(
      inventoryTotalRappen([
        { priceRappen: -500, quantity: 2 },
        { priceRappen: Number.NaN, quantity: 1 },
        { priceRappen: 100, quantity: 0 },
      ])
    ).toBe(0);
  });

  it("liefert für ein leeres Inventar 0", () => {
    expect(inventoryTotalRappen([])).toBe(0);
  });
});

describe("hasAnyPrice", () => {
  it("erkennt, ob mindestens ein Preis erfasst ist", () => {
    expect(hasAnyPrice([{ priceRappen: null, quantity: 1 }])).toBe(false);
    expect(hasAnyPrice([{ priceRappen: 0, quantity: 1 }])).toBe(false);
    expect(hasAnyPrice([{ priceRappen: 100, quantity: 1 }])).toBe(true);
  });
});

describe("parseChfInput / rappenToInput", () => {
  it("liest Franken-Eingaben mit Punkt und Komma", () => {
    expect(parseChfInput("123.45")).toBe(12345);
    expect(parseChfInput("123,45")).toBe(12345);
    expect(parseChfInput(" 9 ")).toBe(900);
  });

  it("liefert null für leere oder unlesbare Eingaben", () => {
    expect(parseChfInput("")).toBeNull();
    expect(parseChfInput("abc")).toBeNull();
    expect(parseChfInput("-5")).toBeNull();
  });

  it("rundet auf ganze Rappen", () => {
    expect(parseChfInput("1.006")).toBe(101);
    expect(parseChfInput("0.014")).toBe(1);
  });

  it("gibt Rappen wieder als Franken-Eingabe zurück", () => {
    expect(rappenToInput(12345)).toBe("123.45");
    expect(rappenToInput(null)).toBe("");
    expect(rappenToInput(undefined)).toBe("");
  });
});
