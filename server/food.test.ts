import { describe, expect, it } from "vitest";
import {
  expiryInfo,
  expirySortKey,
  formatFoodQuantity,
  groupFoodByCategory,
  isFoodStorage,
  matchFoodItems,
  normalizeFoodName,
  normalizeFoodStorage,
  shoppingCategoryForFood,
} from "@shared/food";

const TODAY = "2026-08-01";

describe("expiryInfo", () => {
  it("gibt null ohne Datum zurück", () => {
    expect(expiryInfo(null, TODAY)).toBeNull();
    expect(expiryInfo(undefined, TODAY)).toBeNull();
    expect(expiryInfo("kaputt", TODAY)).toBeNull();
  });

  it("erkennt abgelaufene Lebensmittel", () => {
    expect(expiryInfo("2026-07-31", TODAY)).toEqual({
      state: "expired",
      daysLeft: -1,
      label: "seit gestern abgelaufen",
    });
    expect(expiryInfo("2026-07-27", TODAY)?.label).toBe(
      "seit 5 Tagen abgelaufen"
    );
  });

  it("erkennt heute und bald ablaufende Lebensmittel", () => {
    expect(expiryInfo("2026-08-01", TODAY)).toMatchObject({
      state: "today",
      label: "läuft heute ab",
    });
    expect(expiryInfo("2026-08-02", TODAY)).toMatchObject({
      state: "soon",
      label: "läuft morgen ab",
    });
    expect(expiryInfo("2026-08-04", TODAY)).toMatchObject({
      state: "soon",
      label: "noch 3 Tage",
    });
  });

  it("markiert länger haltbare Lebensmittel als ok", () => {
    expect(expiryInfo("2026-08-05", TODAY)).toMatchObject({
      state: "ok",
      daysLeft: 4,
    });
    expect(expiryInfo("2026-09-01", TODAY)?.state).toBe("ok");
  });

  it("rechnet über Monatsgrenzen korrekt", () => {
    expect(expiryInfo("2026-09-01", "2026-08-30")?.daysLeft).toBe(2);
  });

  it("liefert Labels in der gewünschten Sprache (Default de)", () => {
    expect(expiryInfo("2026-08-01", TODAY, "fr")?.label).toBe(
      "expire aujourd'hui"
    );
    expect(expiryInfo("2026-08-02", TODAY, "it")?.label).toBe("scade domani");
    expect(expiryInfo("2026-07-27", TODAY, "en")?.label).toBe(
      "expired 5 days ago"
    );
    expect(expiryInfo("2026-08-04", TODAY, "en")?.label).toBe("3 days left");
  });
});

describe("expirySortKey", () => {
  it("sortiert früheste Daten zuerst und Einträge ohne Datum ans Ende", () => {
    const items = [
      { name: "Ohne", expiryDate: null },
      { name: "Später", expiryDate: "2026-08-10" },
      { name: "Zuerst", expiryDate: "2026-08-02" },
    ];
    const sorted = [...items].sort(
      (a, b) => expirySortKey(a.expiryDate) - expirySortKey(b.expiryDate)
    );
    expect(sorted.map(i => i.name)).toEqual(["Zuerst", "Später", "Ohne"]);
  });
});

describe("normalizeFoodName", () => {
  it("faltet Umlaute, Akzente und Satzzeichen weg", () => {
    expect(normalizeFoodName("Käse")).toBe("kase");
    expect(normalizeFoodName("Gruyère")).toBe("gruyere");
    expect(normalizeFoodName("400 g Magronen")).toBe("gmagronen");
    expect(normalizeFoodName("  ")).toBe("");
  });
});

describe("matchFoodItems", () => {
  const items = [
    { id: 1, name: "Tomaten" },
    { id: 2, name: "Bergkäse" },
    { id: 3, name: "Ei" },
    { id: 4, name: "Zucchetti" },
  ];

  it("findet Treffer als Teilstring in beide Richtungen", () => {
    const matches = matchFoodItems(
      ["4 Tomaten, gewürfelt", "200 g Käse", "Salz"],
      items
    );
    expect(matches.map(m => m.item.id)).toEqual([1, 2]);
    expect(matches[0].ingredient).toBe("4 Tomaten, gewürfelt");
    expect(matches[1].ingredient).toBe("200 g Käse");
  });

  it("ignoriert zu kurze Einträge wie «Ei»", () => {
    expect(matchFoodItems(["3 Eier"], items)).toEqual([]);
  });

  it("gleicht Umlaute und Akzente ab", () => {
    const matches = matchFoodItems(
      ["Gruyere reiben"],
      [{ id: 9, name: "Gruyère" }]
    );
    expect(matches.map(m => m.item.id)).toEqual([9]);
  });

  it("nennt jeden Eintrag höchstens einmal – mit der ersten Zutat", () => {
    const matches = matchFoodItems(
      ["2 Tomaten", "1 Dose Tomaten, geschält"],
      items
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].ingredient).toBe("2 Tomaten");
  });

  it("behält die Reihenfolge der Kühlbox bei", () => {
    const matches = matchFoodItems(["Zucchetti", "Tomaten"], items);
    expect(matches.map(m => m.item.id)).toEqual([1, 4]);
  });

  it("liefert ohne Treffer oder ohne Daten eine leere Liste", () => {
    expect(matchFoodItems(["Reis", "Linsen"], items)).toEqual([]);
    expect(matchFoodItems([], items)).toEqual([]);
    expect(matchFoodItems(["Tomaten"], [])).toEqual([]);
    expect(matchFoodItems(["   "], items)).toEqual([]);
  });
});

describe("Lagerorte (#233)", () => {
  it("erkennt gültige Lagerorte", () => {
    expect(isFoodStorage("cooled")).toBe(true);
    expect(isFoodStorage("dry")).toBe(true);
    expect(isFoodStorage("kuehl")).toBe(false);
    expect(isFoodStorage(null)).toBe(false);
  });

  it("lässt alles Unbekannte als gekühlt weiterleben", () => {
    expect(normalizeFoodStorage(null)).toBe("cooled");
    expect(normalizeFoodStorage(undefined)).toBe("cooled");
    expect(normalizeFoodStorage("")).toBe("cooled");
    expect(normalizeFoodStorage("dry")).toBe("dry");
  });
});

describe("formatFoodQuantity", () => {
  it("setzt Menge und Einheit zusammen", () => {
    expect(formatFoodQuantity("500", "g")).toBe("500 g");
    expect(formatFoodQuantity("2", "piece")).toBe("2 Stk.");
    expect(formatFoodQuantity("2", "piece", "fr")).toBe("2 pce");
    expect(formatFoodQuantity("1", "can", "it")).toBe("1 lattina");
  });

  it("zeigt Alt-Einträge und Freitext unverändert", () => {
    expect(formatFoodQuantity("500 g", null)).toBe("500 g");
    expect(formatFoodQuantity("2×", "unsinn")).toBe("2×");
  });

  it("gibt ohne Menge nichts zurück", () => {
    expect(formatFoodQuantity(null, "g")).toBeNull();
    expect(formatFoodQuantity("   ", "g")).toBeNull();
  });
});

describe("Vorrats-Kategorien", () => {
  it("übersetzt in die passende Laden-Kategorie", () => {
    expect(shoppingCategoryForFood("cans")).toBe("dry");
    expect(shoppingCategoryForFood("drinks")).toBe("drinks");
    expect(shoppingCategoryForFood("other")).toBe("other");
    expect(shoppingCategoryForFood(null)).toBeNull();
    expect(shoppingCategoryForFood("unbekannt")).toBeNull();
  });

  it("gruppiert in Katalog-Reihenfolge, Unkategorisiertes zuletzt", () => {
    const items = [
      { id: 1, category: "spices" },
      { id: 2, category: null },
      { id: 3, category: "cans" },
      { id: 4, category: "spices" },
      { id: 5, category: "kaputt" },
    ];
    const groups = groupFoodByCategory(items);
    expect(groups.map(g => g.category)).toEqual(["cans", "spices", null]);
    expect(groups[1].items.map(i => i.id)).toEqual([1, 4]);
    expect(groups[2].items.map(i => i.id)).toEqual([2, 5]);
  });

  it("liefert für einen leeren Bestand keine Gruppen", () => {
    expect(groupFoodByCategory([])).toEqual([]);
  });
});
