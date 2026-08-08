import { describe, expect, it } from "vitest";
import {
  CSV_BOM,
  csvAmount,
  csvField,
  csvFileName,
  csvRow,
  expensesToCsv,
} from "@shared/expensesCsv";

const headers = [
  "Datum",
  "Kategorie",
  "Beschreibung",
  "Bezahlt von",
  "Betrag",
] as const;
const options = {
  headers,
  categoryLabel: (category: string) => category.toUpperCase(),
  totalLabel: "Total",
};

describe("csvField", () => {
  it("lässt harmlose Werte unangetastet", () => {
    expect(csvField("Znacht")).toBe("Znacht");
    expect(csvField(42)).toBe("42");
  });

  it("setzt Felder mit Semikolon in Anführungszeichen", () => {
    expect(csvField("Brot; Butter")).toBe('"Brot; Butter"');
  });

  it("verdoppelt Anführungszeichen", () => {
    expect(csvField('Sagt "hallo"')).toBe('"Sagt ""hallo"""');
  });

  it("schützt Zeilenumbrüche", () => {
    expect(csvField("a\nb")).toBe('"a\nb"');
  });

  it("macht aus null ein leeres Feld", () => {
    expect(csvField(null)).toBe("");
    expect(csvField(undefined)).toBe("");
  });
});

describe("csvRow", () => {
  it("trennt mit Semikolon", () => {
    expect(csvRow(["a", "b", 3])).toBe("a;b;3");
  });
});

describe("csvAmount", () => {
  it("schreibt Rappen als Betrag mit Punkt", () => {
    expect(csvAmount(1250)).toBe("12.50");
    expect(csvAmount(5)).toBe("0.05");
    expect(csvAmount(100000)).toBe("1000.00");
  });

  it("behält das Vorzeichen", () => {
    expect(csvAmount(-1250)).toBe("-12.50");
  });

  it("macht aus Unsinn null", () => {
    expect(csvAmount(Number.NaN)).toBe("0.00");
  });
});

describe("expensesToCsv", () => {
  const expenses = [
    {
      day: "2026-08-01",
      category: "essen",
      description: "Znacht; Migros",
      paidBy: "Anna",
      amountRappen: 4550,
    },
    {
      day: "2026-08-02",
      category: "camping",
      description: null,
      paidBy: "Beat",
      amountRappen: 12000,
    },
  ];

  it("beginnt mit dem BOM", () => {
    expect(expensesToCsv(expenses, options).startsWith(CSV_BOM)).toBe(true);
  });

  it("schreibt Kopfzeile, Zeilen und Summe", () => {
    const lines = expensesToCsv(expenses, options).trim().split("\r\n");
    expect(lines.length).toBe(4);
    expect(lines[0]).toContain("Datum;Kategorie");
    expect(lines[1]).toContain('"Znacht; Migros"');
    expect(lines[3]).toBe(";;;Total;CHF;165.50");
  });

  it("übersetzt die Kategorie über die Ansicht", () => {
    const csv = expensesToCsv(expenses, options);
    expect(csv).toContain("ESSEN");
  });

  it("behält die Reihenfolge der Eingabe", () => {
    const lines = expensesToCsv(expenses, options).trim().split("\r\n");
    expect(lines[1]).toContain("2026-08-01");
    expect(lines[2]).toContain("2026-08-02");
  });

  it("liefert auch ohne Ausgaben Kopf- und Summenzeile", () => {
    const lines = expensesToCsv([], options).trim().split("\r\n");
    expect(lines.length).toBe(2);
    expect(lines[1]).toBe(";;;Total;CHF;0.00");
  });
});

describe("csvFileName", () => {
  it("baut einen sauberen Dateinamen", () => {
    expect(csvFileName("Zürich Süd", "2026-08-04")).toBe(
      "zurich-sud-2026-08-04.csv"
    );
  });

  it("fällt ohne Namen auf «reisekasse» zurück", () => {
    expect(csvFileName("!!!", "2026-08-04")).toBe("reisekasse-2026-08-04.csv");
    expect(csvFileName("", "2026-08-04")).toBe("reisekasse-2026-08-04.csv");
  });

  it("kürzt sehr lange Namen", () => {
    const name = csvFileName("a".repeat(120), "2026-08-04");
    expect(name.length).toBeLessThanOrEqual(40 + "-2026-08-04.csv".length);
  });
});
