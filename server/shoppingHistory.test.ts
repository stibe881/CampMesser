import { describe, expect, it } from "vitest";
import {
  rememberShoppingEntry,
  sanitizeShoppingHistory,
  SHOPPING_HISTORY_MAX,
  shoppingSuggestions,
  type ShoppingHistoryEntry,
  lastKnownPrice,
  rememberShoppingPrice,
} from "../client/src/lib/shoppingHistory";

describe("sanitizeShoppingHistory", () => {
  it("übernimmt gültige Einträge und verwirft Schrott", () => {
    const result = sanitizeShoppingHistory([
      { name: "Spaghetti", category: "dry", quantity: "500 g" },
      { name: "  Milch  " },
      { name: "" },
      { name: 7 },
      "kein Objekt",
      null,
      { name: "Käse", category: "unbekannt", quantity: "   " },
    ]);
    expect(result).toEqual([
      { name: "Spaghetti", category: "dry", quantity: "500 g" },
      { name: "Milch" },
      { name: "Käse" },
    ]);
  });

  it("dedupliziert Namen ohne Gross-/Kleinschreibung (erster gewinnt)", () => {
    const result = sanitizeShoppingHistory([
      { name: "Milch", quantity: "1 l" },
      { name: "MILCH" },
      { name: "milch " },
    ]);
    expect(result).toEqual([{ name: "Milch", quantity: "1 l" }]);
  });

  it("deckelt bei 100 Einträgen und liefert [] für Nicht-Arrays", () => {
    const many = Array.from({ length: 150 }, (_, i) => ({
      name: `Eintrag ${i}`,
    }));
    expect(sanitizeShoppingHistory(many)).toHaveLength(SHOPPING_HISTORY_MAX);
    expect(sanitizeShoppingHistory("kaputt")).toEqual([]);
    expect(sanitizeShoppingHistory(undefined)).toEqual([]);
  });
});

describe("rememberShoppingEntry", () => {
  it("setzt den neuen Eintrag nach vorne und ersetzt den alten Namen", () => {
    const history: ShoppingHistoryEntry[] = [
      { name: "Brot" },
      { name: "Milch", quantity: "1 l" },
    ];
    const next = rememberShoppingEntry(history, {
      name: "milch",
      category: "dairy",
      quantity: "2 l",
    });
    expect(next).toEqual([
      { name: "milch", category: "dairy", quantity: "2 l" },
      { name: "Brot" },
    ]);
    // Pure Funktion: die alte Liste bleibt unverändert
    expect(history).toHaveLength(2);
  });

  it("ignoriert leere Namen und deckelt bei 100", () => {
    const history: ShoppingHistoryEntry[] = [{ name: "Brot" }];
    expect(rememberShoppingEntry(history, { name: "   " })).toBe(history);
    const full = Array.from({ length: SHOPPING_HISTORY_MAX }, (_, i) => ({
      name: `Eintrag ${i}`,
    }));
    const next = rememberShoppingEntry(full, { name: "Neu" });
    expect(next).toHaveLength(SHOPPING_HISTORY_MAX);
    expect(next[0]).toEqual({ name: "Neu" });
    expect(next.some(e => e.name === "Eintrag 99")).toBe(false);
  });
});

describe("shoppingSuggestions", () => {
  const sources: ShoppingHistoryEntry[] = [
    { name: "Vollmilch", quantity: "1 l" },
    { name: "Milch", category: "dairy" },
    { name: "Milchschokolade" },
    { name: "Brot" },
    { name: "Haselnussmilch" },
  ];

  it("stellt Präfix-Treffer vor Enthält-Treffer, Quell-Reihenfolge bleibt", () => {
    expect(shoppingSuggestions("mil", sources).map(s => s.name)).toEqual([
      "Milch",
      "Milchschokolade",
      "Vollmilch",
      "Haselnussmilch",
    ]);
  });

  it("dedupliziert case-insensitiv und behält Kategorie/Menge", () => {
    const result = shoppingSuggestions("milch", [
      { name: "Milch", category: "dairy", quantity: "1 l" },
      { name: "MILCH" },
    ]);
    expect(result).toEqual([
      { name: "Milch", category: "dairy", quantity: "1 l" },
    ]);
  });

  it("liefert höchstens das Limit und nichts für leere Eingaben", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      name: `Milch ${i}`,
    }));
    expect(shoppingSuggestions("milch", many)).toHaveLength(6);
    expect(shoppingSuggestions("milch", many, 3)).toHaveLength(3);
    expect(shoppingSuggestions("", sources)).toEqual([]);
    expect(shoppingSuggestions("   ", sources)).toEqual([]);
  });

  it("keine Treffer → leere Liste", () => {
    expect(shoppingSuggestions("Zelt", sources)).toEqual([]);
  });
});

// Letzter Preis als Vorschlag (#434): Der Preis hängt sich an den
// bestehenden Eintrag, Kategorie und Menge bleiben erhalten.
describe("rememberShoppingPrice", () => {
  it("merkt den Preis am bestehenden Eintrag, ohne Kategorie/Menge zu verlieren", () => {
    const history = [
      { name: "Milch", category: "kuehl", quantity: "2×" },
      { name: "Brot" },
    ];
    const next = rememberShoppingPrice(history, "milch", 350);
    expect(next[0]).toMatchObject({
      name: "Milch",
      quantity: "2×",
      priceRappen: 350,
    });
    expect(lastKnownPrice(next, "MILCH")).toBe(350);
  });

  it("unbekannte Namen bekommen einen frischen Eintrag", () => {
    const next = rememberShoppingPrice([], "Käse", 890);
    expect(next).toEqual([{ name: "Käse", priceRappen: 890 }]);
    expect(lastKnownPrice(next, "Wurst")).toBeNull();
  });

  it("der Verlauf übersteht unsinnige Preise", () => {
    // 0 und Negatives fliegen beim Säubern raus – ein «letztes Mal
    // gratis» wäre kein Vorschlag.
    expect(
      sanitizeShoppingHistory([{ name: "Milch", priceRappen: -5 }])
    ).toEqual([{ name: "Milch" }]);
  });
});
