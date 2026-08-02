import { describe, expect, it } from "vitest";
import {
  MAX_MENU_DAYS,
  MEALS,
  MEAL_LABELS,
  mergeIngredientLines,
  tripDays,
} from "@shared/menuPlan";
import { LANGUAGES, pick } from "@shared/i18n";

describe("tripDays", () => {
  it("liefert alle Tage inklusive An- und Abreisetag", () => {
    expect(tripDays("2026-07-10", "2026-07-13")).toEqual([
      "2026-07-10",
      "2026-07-11",
      "2026-07-12",
      "2026-07-13",
    ]);
  });

  it("liefert genau einen Tag bei Anreise = Abreise", () => {
    expect(tripDays("2026-07-10", "2026-07-10")).toEqual(["2026-07-10"]);
  });

  it("zählt über Monats- und Jahresgrenzen korrekt", () => {
    expect(tripDays("2025-12-30", "2026-01-02")).toEqual([
      "2025-12-30",
      "2025-12-31",
      "2026-01-01",
      "2026-01-02",
    ]);
  });

  it("fällt bei Abreise vor Anreise auf den Anreisetag zurück", () => {
    expect(tripDays("2026-07-13", "2026-07-10")).toEqual(["2026-07-13"]);
  });

  it("liefert ein leeres Raster für ungültige Daten", () => {
    expect(tripDays("kaputt", "2026-07-10")).toEqual([]);
    expect(tripDays("", "")).toEqual([]);
  });

  it("begrenzt das Raster auf MAX_MENU_DAYS Tage", () => {
    const days = tripDays("2026-01-01", "2027-12-31");
    expect(days).toHaveLength(MAX_MENU_DAYS);
    expect(days[0]).toBe("2026-01-01");
  });
});

describe("mergeIngredientLines", () => {
  it("trimmt Zeilen und entfernt leere Einträge", () => {
    expect(mergeIngredientLines(["  2 Zwiebeln ", "", "   "])).toEqual([
      "2 Zwiebeln",
    ]);
  });

  it("fasst Duplikate unabhängig von der Schreibweise zusammen", () => {
    expect(
      mergeIngredientLines(["400 g Magronen", "400 G MAGRONEN", "2 Zwiebeln"])
    ).toEqual(["400 g Magronen", "2 Zwiebeln"]);
  });

  it("behält die Reihenfolge des ersten Vorkommens", () => {
    expect(mergeIngredientLines(["Salz", "Pfeffer", "salz", "Öl"])).toEqual([
      "Salz",
      "Pfeffer",
      "Öl",
    ]);
  });
});

describe("Mahlzeiten-Slots", () => {
  it("kennt vier Mahlzeiten mit Labels in allen Sprachen", () => {
    expect(MEALS).toEqual(["breakfast", "lunch", "dinner", "snack"]);
    MEALS.forEach(meal => {
      LANGUAGES.forEach(lang => {
        expect(pick(MEAL_LABELS[meal], lang).length).toBeGreaterThan(0);
      });
    });
  });
});
