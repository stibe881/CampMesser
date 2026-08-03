import { describe, expect, it } from "vitest";
import {
  compareShoppingCategories,
  CUSTOM_CATEGORY_PREFIX,
  customCategory,
  customCategoryName,
  customShoppingCategories,
  groupByShoppingCategory,
  isCustomCategory,
  isShoppingCategory,
  isShoppingCategoryValue,
  MAX_CUSTOM_CATEGORY_NAME_LENGTH,
  MAX_SHOPPING_CATEGORY_LENGTH,
  shoppingCategoryLabel,
} from "@shared/shopping";

describe("customCategory", () => {
  it("macht aus dem getippten Namen einen speicherbaren Wert", () => {
    expect(customCategory("Grill")).toBe("custom:Grill");
  });

  it("trimmt den Namen und lässt Leerraum-Eingaben fallen", () => {
    expect(customCategory("  Grill  ")).toBe("custom:Grill");
    expect(customCategory("   ")).toBeNull();
    expect(customCategory("")).toBeNull();
  });

  it("kürzt lange Namen, damit «custom:» + Name in die Spalte passt", () => {
    const value = customCategory("A".repeat(200));
    expect(value).not.toBeNull();
    expect(value!.length).toBe(MAX_SHOPPING_CATEGORY_LENGTH);
    expect(customCategoryName(value)).toBe(
      "A".repeat(MAX_CUSTOM_CATEGORY_NAME_LENGTH)
    );
  });

  it("überlebt den Rundlauf Name → Wert → Name", () => {
    const namen = ["Grill", "Bio-Laden", "Tag 2", "Käse & Wein", "custom:dry"];
    namen.forEach(name => {
      expect(customCategoryName(customCategory(name))).toBe(name);
    });
  });
});

describe("isCustomCategory / isShoppingCategoryValue", () => {
  it("hält Katalog-Schlüssel und eigene Kategorien auseinander", () => {
    expect(isShoppingCategory("dry")).toBe(true);
    expect(isCustomCategory("dry")).toBe(false);
    expect(isShoppingCategory("custom:Grill")).toBe(false);
    expect(isCustomCategory("custom:Grill")).toBe(true);
  });

  it("verhindert die Kollision mit einem Katalog-Schlüssel", () => {
    // Wer «dry» als eigene Kategorie tippt, landet NICHT im Katalog
    const value = customCategory("dry");
    expect(value).toBe("custom:dry");
    expect(isShoppingCategory(value)).toBe(false);
    expect(customCategoryName(value)).toBe("dry");
  });

  it("lehnt einen leeren Namen und zu lange Werte ab", () => {
    expect(isCustomCategory(CUSTOM_CATEGORY_PREFIX)).toBe(false);
    expect(isCustomCategory("custom:   ")).toBe(false);
    expect(isCustomCategory(CUSTOM_CATEGORY_PREFIX + "A".repeat(100))).toBe(
      false
    );
  });

  it("erlaubt als Eingabe genau Katalog-Schlüssel und eigene Kategorien", () => {
    expect(isShoppingCategoryValue("fruitVeg")).toBe(true);
    expect(isShoppingCategoryValue("custom:Grill")).toBe(true);
    expect(isShoppingCategoryValue("Grill")).toBe(false);
    expect(isShoppingCategoryValue(null)).toBe(false);
    expect(isShoppingCategoryValue(undefined)).toBe(false);
  });
});

describe("shoppingCategoryLabel", () => {
  it("übersetzt Katalog-Schlüssel und gibt eigene Namen unverändert zurück", () => {
    expect(shoppingCategoryLabel("dry", "de")).toBe("Trockenwaren");
    expect(shoppingCategoryLabel("dry", "fr")).toBe("Produits secs");
    expect(shoppingCategoryLabel("custom:Grill", "fr")).toBe("Grill");
  });

  it("liefert null für «ohne Kategorie» und unbekannte Werte", () => {
    expect(shoppingCategoryLabel(null, "de")).toBeNull();
    expect(shoppingCategoryLabel("quatsch", "de")).toBeNull();
  });
});

describe("compareShoppingCategories", () => {
  it("hält die Laden-Reihenfolge des Katalogs", () => {
    expect(compareShoppingCategories("fruitVeg", "drinks", "de")).toBeLessThan(
      0
    );
    expect(compareShoppingCategories("other", "dairy", "de")).toBeGreaterThan(
      0
    );
  });

  it("stellt eigene Kategorien hinter den Katalog", () => {
    expect(
      compareShoppingCategories("custom:Apotheke", "other", "de")
    ).toBeGreaterThan(0);
  });

  it("sortiert eigene Kategorien alphabetisch (ohne Gross-/Kleinschreibung)", () => {
    expect(
      compareShoppingCategories("custom:apotheke", "custom:Zelt", "de")
    ).toBeLessThan(0);
    expect(
      compareShoppingCategories("custom:Tag 2", "custom:Tag 10", "de")
    ).toBeLessThan(0);
  });

  it("stellt «Ohne Kategorie» ganz nach hinten", () => {
    expect(
      compareShoppingCategories(null, "custom:Zelt", "de")
    ).toBeGreaterThan(0);
    expect(compareShoppingCategories(null, "other", "de")).toBeGreaterThan(0);
  });
});

describe("customShoppingCategories", () => {
  it("sammelt die eigenen Kategorien alphabetisch und ohne Doppel", () => {
    expect(
      customShoppingCategories(
        [
          "custom:Zelt",
          "dry",
          null,
          "custom:Apotheke",
          "custom:Zelt",
          undefined,
          "quatsch",
        ],
        "de"
      )
    ).toEqual(["custom:Apotheke", "custom:Zelt"]);
  });
});

describe("groupByShoppingCategory", () => {
  const items = [
    { id: 1, category: "custom:Zelt" },
    { id: 2, category: "drinks" },
    { id: 3, category: null },
    { id: 4, category: "fruitVeg" },
    { id: 5, category: "custom:Apotheke" },
    { id: 6, category: "quatsch" },
    { id: 7, category: "drinks" },
  ];

  it("gruppiert Katalog zuerst, dann eigene, «ohne» zuletzt", () => {
    const groups = groupByShoppingCategory(items, "de");
    expect(groups.map(g => g.key)).toEqual([
      "fruitVeg",
      "drinks",
      "custom:Apotheke",
      "custom:Zelt",
      null,
    ]);
  });

  it("behält die Reihenfolge der Einträge innerhalb einer Gruppe", () => {
    const groups = groupByShoppingCategory(items, "de");
    const drinks = groups.find(g => g.key === "drinks");
    expect(drinks?.items.map(i => i.id)).toEqual([2, 7]);
  });

  it("wirft unbekannte Werte zu «Ohne Kategorie»", () => {
    const groups = groupByShoppingCategory(items, "de");
    const none = groups.find(g => g.key === null);
    expect(none?.items.map(i => i.id)).toEqual([3, 6]);
  });

  it("legt keine leeren Gruppen an", () => {
    expect(groupByShoppingCategory([], "de")).toEqual([]);
    expect(
      groupByShoppingCategory([{ category: "custom:Grill" }], "de")
    ).toEqual([{ key: "custom:Grill", items: [{ category: "custom:Grill" }] }]);
  });
});
