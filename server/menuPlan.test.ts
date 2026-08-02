import { describe, expect, it } from "vitest";
import {
  autofillMenuPlan,
  MAX_MENU_DAYS,
  MEALS,
  MEAL_LABELS,
  mergeIngredientLines,
  remapMenuDays,
  tripDays,
  type AutofillRecipe,
  type Meal,
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

describe("remapMenuDays", () => {
  const entries = [
    { day: "2026-07-10", meal: "breakfast", recipeId: "porridge" },
    { day: "2026-07-11", meal: "dinner", recipeId: "pasta" },
    { day: "2026-07-13", meal: "lunch", recipeId: "chili" },
  ];

  it("bildet Tag 1 → Tag 1 auf den neuen Zeitraum ab", () => {
    const mapped = remapMenuDays(
      entries,
      "2026-07-10",
      "2026-09-01",
      "2026-09-04"
    );
    expect(mapped).toEqual([
      { day: "2026-09-01", meal: "breakfast", recipeId: "porridge" },
      { day: "2026-09-02", meal: "dinner", recipeId: "pasta" },
      { day: "2026-09-04", meal: "lunch", recipeId: "chili" },
    ]);
  });

  it("verwirft Einträge hinter dem neuen Abreisetag (kürzere Reise)", () => {
    const mapped = remapMenuDays(
      entries,
      "2026-07-10",
      "2026-09-01",
      "2026-09-02"
    );
    expect(mapped.map(e => e.day)).toEqual(["2026-09-01", "2026-09-02"]);
  });

  it("lässt bei einer längeren Reise die zusätzlichen Tage einfach leer", () => {
    const mapped = remapMenuDays(
      entries,
      "2026-07-10",
      "2026-09-01",
      "2026-09-30"
    );
    expect(mapped).toHaveLength(entries.length);
  });

  it("funktioniert über Monats- und Jahresgrenzen", () => {
    const mapped = remapMenuDays(
      [{ day: "2026-12-31", meal: "dinner" }],
      "2026-12-30",
      "2027-02-27",
      "2027-03-01"
    );
    expect(mapped).toEqual([{ day: "2027-02-28", meal: "dinner" }]);
  });

  it("verwirft Einträge vor der alten Anreise und mit kaputtem Tag", () => {
    const mapped = remapMenuDays(
      [
        { day: "2026-07-09", meal: "dinner" },
        { day: "kaputt", meal: "lunch" },
        { day: "2026-07-10", meal: "breakfast" },
      ],
      "2026-07-10",
      "2026-09-01",
      "2026-09-03"
    );
    expect(mapped).toEqual([{ day: "2026-09-01", meal: "breakfast" }]);
  });

  it("liefert bei ungültigen Rahmendaten eine leere Liste", () => {
    expect(
      remapMenuDays(entries, "kaputt", "2026-09-01", "2026-09-04")
    ).toEqual([]);
    expect(remapMenuDays(entries, "2026-07-10", "", "2026-09-04")).toEqual([]);
    expect(remapMenuDays(entries, "2026-07-10", "2026-09-01", "nix")).toEqual(
      []
    );
  });

  it("ändert die übergebenen Einträge nicht (reine Funktion)", () => {
    const input = [{ day: "2026-07-10", meal: "dinner" }];
    remapMenuDays(input, "2026-07-10", "2026-09-01", "2026-09-04");
    expect(input[0].day).toBe("2026-07-10");
  });
});

describe("autofillMenuPlan", () => {
  const days = ["2026-08-01", "2026-08-02", "2026-08-03", "2026-08-04"];
  const meals: Meal[] = ["breakfast", "lunch", "dinner"];
  const recipes: AutofillRecipe[] = [
    { id: "porridge", kind: "breakfast" },
    { id: "eier", kind: "breakfast" },
    { id: "pasta", kind: "main" },
    { id: "chili", kind: "main" },
    { id: "risotto", kind: "main" },
    { id: "curry", kind: "main" },
    { id: "dal", kind: "main" },
    { id: "brot", kind: "any" },
  ];

  it("füllt einen leeren Plan vollständig und deterministisch", () => {
    const run = () =>
      autofillMenuPlan({ days, meals, existing: [], recipes, seed: 42 });
    const first = run();
    // Jeder Tag bekommt Frühstück, Mittag- und Abendessen
    expect(first).toHaveLength(days.length * meals.length);
    // Gleicher Seed → identisches Resultat (kein Math.random)
    expect(run()).toEqual(first);
  });

  it("füllt nur leere Slots und lässt Bestehendes unangetastet", () => {
    const existing = [
      { day: "2026-08-01", meal: "lunch" as Meal, recipeId: "pasta" },
      { day: "2026-08-02", meal: "dinner" as Meal, recipeId: null },
    ];
    const result = autofillMenuPlan({
      days,
      meals,
      existing,
      recipes,
      seed: "trip-7",
    });
    expect(result).toHaveLength(days.length * meals.length - existing.length);
    existing.forEach(slot => {
      expect(result.some(a => a.day === slot.day && a.meal === slot.meal)).toBe(
        false
      );
    });
  });

  it("wiederholt kein Rezept am selben oder direkt folgenden Tag", () => {
    const result = autofillMenuPlan({
      days,
      meals,
      existing: [],
      recipes,
      seed: 1,
    });
    const dayIndex = new Map(days.map((d, i) => [d, i]));
    result.forEach(a => {
      const di = dayIndex.get(a.day)!;
      const clash = result.some(
        b =>
          b !== a &&
          b.recipeId === a.recipeId &&
          Math.abs(dayIndex.get(b.day)! - di) <= 1
      );
      expect(clash).toBe(false);
    });
  });

  it("respektiert die Folgetag-Regel auch gegenüber bestehenden Einträgen", () => {
    // «pasta» steht bereits am 2. Tag → darf an Tag 1–3 nicht neu gesetzt werden
    const result = autofillMenuPlan({
      days,
      meals: ["dinner"],
      existing: [{ day: "2026-08-02", meal: "lunch", recipeId: "pasta" }],
      recipes,
      seed: 5,
    });
    result
      .filter(a => a.day !== "2026-08-04")
      .forEach(a => expect(a.recipeId).not.toBe("pasta"));
  });

  it("wiederholt bei zu wenigen Rezepten frühestens nach 2 Tagen", () => {
    const twoMains: AutofillRecipe[] = [
      { id: "a", kind: "main" },
      { id: "b", kind: "main" },
    ];
    const sixDays = tripDays("2026-08-01", "2026-08-06");
    const result = autofillMenuPlan({
      days: sixDays,
      meals: ["dinner"],
      existing: [],
      recipes: twoMains,
      seed: 9,
    });
    // Alle 6 Abende gefüllt – die zwei Rezepte wechseln sich ab
    expect(result).toHaveLength(6);
    const byRecipe = new Map<string, number[]>();
    result.forEach(a => {
      const di = sixDays.indexOf(a.day);
      byRecipe.set(a.recipeId, [...(byRecipe.get(a.recipeId) ?? []), di]);
    });
    byRecipe.forEach(indices => {
      for (let i = 1; i < indices.length; i++) {
        expect(indices[i] - indices[i - 1]).toBeGreaterThanOrEqual(2);
      }
    });
  });

  it("lässt Slots leer, wenn die Folgetag-Regel nicht erfüllbar ist", () => {
    const single: AutofillRecipe[] = [{ id: "a", kind: "main" }];
    const result = autofillMenuPlan({
      days: tripDays("2026-08-01", "2026-08-03"),
      meals: ["dinner"],
      existing: [],
      recipes: single,
      seed: 3,
    });
    // Tag 1 und Tag 3 gefüllt, Tag 2 bleibt leer (kein Nachbartag-Duplikat)
    expect(result.map(a => a.day)).toEqual(["2026-08-01", "2026-08-03"]);
  });

  it("bevorzugt Frühstücks-Rezepte am Morgen und füllt Snacks nie", () => {
    const result = autofillMenuPlan({
      days: ["2026-08-01", "2026-08-02"],
      meals: ["breakfast", "snack"],
      existing: [],
      recipes,
      seed: 11,
    });
    expect(result.length).toBe(2);
    result.forEach(a => {
      expect(a.meal).toBe("breakfast");
      expect(["porridge", "eier"]).toContain(a.recipeId);
    });
  });

  it("greift am Morgen erst auf andere Rezepte zurück, wenn Frühstück fehlt", () => {
    const mainsOnly: AutofillRecipe[] = [
      { id: "pasta", kind: "main" },
      { id: "brot", kind: "any" },
    ];
    const result = autofillMenuPlan({
      days: ["2026-08-01"],
      meals: ["breakfast"],
      existing: [],
      recipes: mainsOnly,
      seed: 2,
    });
    // «any» kommt vor «main»
    expect(result).toEqual([
      { day: "2026-08-01", meal: "breakfast", recipeId: "brot" },
    ]);
  });

  it("liefert bei leerem Rezept-Vorrat keine Zuweisungen", () => {
    expect(
      autofillMenuPlan({ days, meals, existing: [], recipes: [], seed: 0 })
    ).toEqual([]);
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
