import { describe, expect, it } from "vitest";
import {
  MAX_FAVORITES,
  MAX_ID_LENGTH,
  sanitizeRecipeFavorites,
  toggleFavorite,
} from "../client/src/lib/recipeFavorites";

describe("sanitizeRecipeFavorites", () => {
  it("gibt für Nicht-Arrays eine leere Liste zurück", () => {
    expect(sanitizeRecipeFavorites(null)).toEqual([]);
    expect(sanitizeRecipeFavorites(undefined)).toEqual([]);
    expect(sanitizeRecipeFavorites("kaputt")).toEqual([]);
    expect(sanitizeRecipeFavorites({ id: "a" })).toEqual([]);
  });

  it("behält gültige Ids in ihrer Reihenfolge", () => {
    expect(
      sanitizeRecipeFavorites(["gemuese-curry", "eigenes-7", "porridge"])
    ).toEqual(["gemuese-curry", "eigenes-7", "porridge"]);
  });

  it("verwirft Nicht-Strings, Leerstrings und Duplikate", () => {
    expect(
      sanitizeRecipeFavorites(["a", 42, null, "", "   ", { id: "b" }, "a", "b"])
    ).toEqual(["a", "b"]);
  });

  it("trimmt und kürzt überlange Ids", () => {
    const long = "x".repeat(MAX_ID_LENGTH + 20);
    expect(sanitizeRecipeFavorites(["  a  ", long])).toEqual([
      "a",
      "x".repeat(MAX_ID_LENGTH),
    ]);
  });

  it("kappt die Anzahl auf MAX_FAVORITES", () => {
    const many = Array.from({ length: MAX_FAVORITES + 10 }, (_, i) => `r-${i}`);
    expect(sanitizeRecipeFavorites(many)).toHaveLength(MAX_FAVORITES);
  });
});

describe("toggleFavorite", () => {
  it("fügt eine neue Id hinten an, ohne die Eingabe zu verändern", () => {
    const before = ["a"];
    const after = toggleFavorite(before, "b");
    expect(after).toEqual(["a", "b"]);
    expect(before).toEqual(["a"]);
  });

  it("entfernt eine bereits vorhandene Id", () => {
    expect(toggleFavorite(["a", "b", "c"], "b")).toEqual(["a", "c"]);
  });

  it("trimmt die Id vor dem Vergleich", () => {
    expect(toggleFavorite(["a"], "  a  ")).toEqual([]);
  });

  it("ignoriert leere Ids", () => {
    const favorites = ["a"];
    expect(toggleFavorite(favorites, "   ")).toBe(favorites);
  });

  it("fügt oberhalb von MAX_FAVORITES nichts mehr hinzu", () => {
    const full = Array.from({ length: MAX_FAVORITES }, (_, i) => `r-${i}`);
    expect(toggleFavorite(full, "neu")).toBe(full);
    // Entfernen geht weiterhin
    expect(toggleFavorite(full, "r-0")).toHaveLength(MAX_FAVORITES - 1);
  });
});
