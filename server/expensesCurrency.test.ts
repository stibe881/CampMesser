/**
 * Fremdwährung in der Reisekasse (#441): Der Kern ist die CHF-Sicht –
 * Euro zum Reise-Kurs, ohne Kurs EHRLICH raus statt still 1:1.
 */
import { describe, expect, it } from "vitest";
import {
  EUR_RATE_SCALE,
  eurRateToInput,
  expenseChfRappen,
  parseEurRate,
  toChfExpenses,
} from "../shared/expenses";
import { expensesToCsv } from "../shared/expensesCsv";

describe("parseEurRate", () => {
  it("liest Punkt- und Komma-Eingaben", () => {
    expect(parseEurRate("0.94")).toBe(9400);
    expect(parseEurRate("0,94")).toBe(9400);
    expect(parseEurRate(" 1 ")).toBe(EUR_RATE_SCALE);
  });

  it("weist Unplausibles ab", () => {
    expect(parseEurRate("0.4")).toBeNull();
    expect(parseEurRate("2.5")).toBeNull();
    expect(parseEurRate("abc")).toBeNull();
    expect(parseEurRate("")).toBeNull();
  });

  it("rundet auf die Kurs-Auflösung", () => {
    expect(parseEurRate("0.9412")).toBe(9412);
  });
});

describe("eurRateToInput", () => {
  it("zeigt den Kurs ohne überflüssige Nullen", () => {
    expect(eurRateToInput(9400)).toBe("0.94");
    expect(eurRateToInput(9412)).toBe("0.9412");
    expect(eurRateToInput(10000)).toBe("1.0");
  });
});

describe("expenseChfRappen", () => {
  it("lässt CHF unverändert", () => {
    expect(
      expenseChfRappen({ amountRappen: 1250, currency: "CHF" }, null)
    ).toBe(1250);
    // Alt-Zeilen ohne Währung gelten als CHF
    expect(expenseChfRappen({ amountRappen: 1250 }, null)).toBe(1250);
  });

  it("rechnet EUR zum Kurs um", () => {
    // 10 € × 0.94 = 9.40 CHF
    expect(
      expenseChfRappen({ amountRappen: 1000, currency: "EUR" }, 9400)
    ).toBe(940);
  });

  it("gibt null für EUR ohne Kurs – kein stilles 1:1", () => {
    expect(
      expenseChfRappen({ amountRappen: 1000, currency: "EUR" }, null)
    ).toBeNull();
  });
});

describe("toChfExpenses", () => {
  const expenses = [
    { amountRappen: 2000, category: "essen", currency: "CHF" },
    { amountRappen: 1000, category: "camping", currency: "EUR" },
  ];

  it("übersetzt alles in CHF, wenn ein Kurs da ist", () => {
    const result = toChfExpenses(expenses, 9400);
    expect(result.converted.map(e => e.amountRappen)).toEqual([2000, 940]);
    expect(result.eurRappen).toBe(1000);
    expect(result.excludedEurRappen).toBe(0);
  });

  it("wirft EUR ohne Kurs raus und meldet den Betrag", () => {
    const result = toChfExpenses(expenses, null);
    expect(result.converted.map(e => e.amountRappen)).toEqual([2000]);
    expect(result.excludedEurRappen).toBe(1000);
  });
});

describe("expensesToCsv mit Währungen", () => {
  it("schreibt die Währungsspalte und eine Summenzeile je Währung", () => {
    const csv = expensesToCsv(
      [
        {
          day: "2026-08-01",
          category: "essen",
          description: "Migros",
          paidBy: "Anna",
          amountRappen: 2000,
          currency: "CHF",
        },
        {
          day: "2026-08-02",
          category: "camping",
          description: "Platz",
          paidBy: "Ben",
          amountRappen: 3550,
          currency: "EUR",
        },
      ],
      {
        headers: [
          "Datum",
          "Kategorie",
          "Beschreibung",
          "Von",
          "Währung",
          "Betrag",
        ],
        categoryLabel: c => c,
        totalLabel: "Total",
      }
    );
    const lines = csv.trim().split("\r\n");
    expect(lines[1]).toContain(";CHF;20.00");
    expect(lines[2]).toContain(";EUR;35.50");
    expect(lines[3]).toBe(";;;Total;CHF;20.00");
    expect(lines[4]).toBe(";;;Total;EUR;35.50");
  });
});
