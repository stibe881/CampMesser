import { describe, expect, it } from "vitest";
import {
  leftoverSuggestions,
  matchWords,
  stockCoversIngredient,
  type LeftoverRecipe,
} from "@shared/leftovers";

const pasta: LeftoverRecipe = {
  id: "pasta",
  name: "One-Pot-Tomatenpasta",
  ingredients: [
    "400 g Spaghetti",
    "2 Dosen Tomaten",
    "1 Zwiebel",
    "2 Zehen Knoblauch",
    "2 EL Olivenöl",
    "Salz",
    "Pfeffer",
  ],
  timeMinutes: 20,
};

const risotto: LeftoverRecipe = {
  id: "risotto",
  name: "Pilzrisotto",
  ingredients: ["300 g Reis", "200 g Pilze", "1 Zwiebel", "Bouillon"],
  timeMinutes: 35,
};

const dessert: LeftoverRecipe = {
  id: "dessert",
  name: "Bananen mit Schoggi",
  ingredients: ["4 Bananen", "1 Tafel Schokolade"],
  timeMinutes: 15,
};

describe("matchWords", () => {
  it("lässt Mengen und Einheiten weg", () => {
    expect(matchWords("400 g Spaghetti")).toEqual(["spaghetti"]);
    expect(matchWords("2 Dosen Tomaten")).toEqual(["tomaten"]);
    expect(matchWords("2 EL Olivenöl")).toEqual(["olivenol"]);
  });

  it("lässt zu kurze Wörter weg", () => {
    expect(matchWords("3 Eier")).toEqual(["eier"]);
    expect(matchWords("Öl")).toEqual([]);
  });
});

describe("stockCoversIngredient", () => {
  it("trifft trotz Menge und Einheit in der Zutat", () => {
    expect(stockCoversIngredient("400 g Spaghetti", "Spaghetti")).toBe(true);
    expect(stockCoversIngredient("2 Dosen Tomaten", "Tomaten")).toBe(true);
  });

  it("trifft in beide Richtungen", () => {
    expect(stockCoversIngredient("Käse", "Bergkäse")).toBe(true);
    expect(stockCoversIngredient("200 g Bergkäse", "Käse")).toBe(true);
  });

  it("ist tolerant gegenüber Schreibweisen und Tippfehlern", () => {
    expect(stockCoversIngredient("2 Dosen Tomaten", "Tomatn")).toBe(true);
    expect(stockCoversIngredient("Rüebli", "Ruebli")).toBe(true);
    expect(stockCoversIngredient("2 EL Olivenöl", "Olivenol")).toBe(true);
  });

  it("trifft Unpassendes nicht", () => {
    expect(stockCoversIngredient("400 g Spaghetti", "Tomaten")).toBe(false);
    expect(stockCoversIngredient("Salz", "Zucker")).toBe(false);
    // Einheiten allein dürfen nie zum Treffer führen
    expect(stockCoversIngredient("400 g Spaghetti", "g")).toBe(false);
    expect(stockCoversIngredient("2 Dosen Tomaten", "Dose")).toBe(false);
  });
});

describe("leftoverSuggestions", () => {
  it("zählt Treffer und nennt die fehlenden Zutaten", () => {
    const [first] = leftoverSuggestions({
      recipes: [pasta],
      stock: [
        { id: 1, name: "Spaghetti" },
        { id: 2, name: "Tomaten" },
        { id: 3, name: "Zwiebeln" },
      ],
    });
    expect(first.matched.length).toBe(3);
    expect(first.total).toBe(7);
    expect(first.missing).toEqual([
      "2 Zehen Knoblauch",
      "2 EL Olivenöl",
      "Salz",
      "Pfeffer",
    ]);
    expect(first.matched.map(m => m.item.name)).toEqual([
      "Spaghetti",
      "Tomaten",
      "Zwiebeln",
    ]);
  });

  it("sortiert nach Treffern", () => {
    const result = leftoverSuggestions({
      recipes: [risotto, pasta, dessert],
      stock: [
        { id: 1, name: "Spaghetti" },
        { id: 2, name: "Tomaten" },
        { id: 3, name: "Zwiebeln" },
        { id: 4, name: "Bananen" },
      ],
    });
    // 3 Treffer für die Pasta; danach entscheidet der gedeckte Anteil
    // (Dessert 1 von 2, Risotto 1 von 4)
    expect(result.map(s => s.recipe.id)).toEqual([
      "pasta",
      "dessert",
      "risotto",
    ]);
  });

  it("lässt Rezepte ohne einen einzigen Treffer weg", () => {
    const result = leftoverSuggestions({
      recipes: [pasta, dessert],
      stock: [{ id: 1, name: "Bananen" }],
    });
    expect(result.map(s => s.recipe.id)).toEqual(["dessert"]);
  });

  it("bevorzugt Rezepte mit bald ablaufenden Vorräten", () => {
    const stock = [
      // Gleich viele Treffer pro Rezept, aber die Pilze laufen morgen ab
      { id: 1, name: "Spaghetti", expiryDate: "2026-12-01" },
      { id: 2, name: "Pilze", expiryDate: "2026-08-04" },
    ];
    const result = leftoverSuggestions({
      recipes: [pasta, risotto],
      stock,
      today: "2026-08-03",
    });
    expect(result.map(s => s.recipe.id)).toEqual(["risotto", "pasta"]);
    expect(result[0].urgentCount).toBe(1);
    expect(result[1].urgentCount).toBe(0);
  });

  it("gewichtet ohne Datum nur die Trefferzahl", () => {
    const stock = [
      { id: 1, name: "Spaghetti", expiryDate: "2026-08-04" },
      { id: 2, name: "Tomaten", expiryDate: "2026-12-01" },
      { id: 3, name: "Pilze", expiryDate: "2026-08-04" },
    ];
    const result = leftoverSuggestions({ recipes: [pasta, risotto], stock });
    expect(result.map(s => s.recipe.id)).toEqual(["pasta", "risotto"]);
    expect(result[0].urgentCount).toBe(0);
  });

  it("bricht Gleichstände über die Abdeckung", () => {
    const stock = [{ id: 1, name: "Zwiebeln" }];
    // Je 1 Treffer – das Risotto deckt damit 1 von 4 Zutaten, die Pasta 1 von 7
    const plain = leftoverSuggestions({ recipes: [pasta, risotto], stock });
    expect(plain.map(s => s.recipe.id)).toEqual(["risotto", "pasta"]);
  });

  it("bricht Gleichstände mit Favorit und Zubereitungszeit", () => {
    const stock = [{ id: 1, name: "Zwiebeln" }];
    const withFavorite = leftoverSuggestions({
      recipes: [{ ...pasta, favorite: true }, risotto],
      stock,
    });
    expect(withFavorite.map(s => s.recipe.id)).toEqual(["pasta", "risotto"]);
    // Gleiche Treffer UND gleiche Abdeckung → das schnellere Rezept zuerst
    const bySpeed = leftoverSuggestions({
      recipes: [{ ...dessert, id: "dessert-lang", timeMinutes: 40 }, dessert],
      stock: [{ id: 1, name: "Bananen" }],
    });
    expect(bySpeed.map(s => s.recipe.id)).toEqual(["dessert", "dessert-lang"]);
  });

  it("begrenzt die Zahl der Vorschläge", () => {
    const stock = [{ id: 1, name: "Zwiebeln" }];
    expect(
      leftoverSuggestions({ recipes: [pasta, risotto], stock, limit: 1 }).length
    ).toBe(1);
  });

  it("kommt mit leerem Bestand und unbrauchbaren Namen zurecht", () => {
    expect(leftoverSuggestions({ recipes: [pasta], stock: [] })).toEqual([]);
    expect(
      leftoverSuggestions({ recipes: [pasta], stock: [{ id: 1, name: "Öl" }] })
    ).toEqual([]);
  });

  it("nennt jeden Treffer nur einmal pro Zutat", () => {
    const [first] = leftoverSuggestions({
      recipes: [pasta],
      stock: [
        { id: 1, name: "Tomaten" },
        { id: 2, name: "Cherrytomaten" },
      ],
    });
    expect(first.matched.length).toBe(1);
    expect(first.matched[0].item.id).toBe(1);
  });
});
