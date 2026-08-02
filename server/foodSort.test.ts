import { describe, expect, it } from "vitest";
import { isFoodSortMode, sortFoodItems } from "@/lib/foodSort";

const items = [
  { name: "Zwiebeln", expiryDate: null },
  { name: "Äpfel", expiryDate: null },
  { name: "Milch", expiryDate: "2026-08-05" },
  { name: "Käse", expiryDate: "2026-08-20" },
  { name: "Butter", expiryDate: "2026-08-05" },
];

describe("sortFoodItems", () => {
  it("sortiert nach Ablauf: früheste zuerst, ohne MHD zuletzt", () => {
    const sorted = sortFoodItems(items, "expiry", "de");
    expect(sorted.map(i => i.name)).toEqual([
      "Butter",
      "Milch",
      "Käse",
      "Äpfel",
      "Zwiebeln",
    ]);
  });

  it("bricht Ablauf-Gleichstand alphabetisch", () => {
    const sorted = sortFoodItems(items, "expiry", "de");
    expect(sorted.slice(0, 2).map(i => i.name)).toEqual(["Butter", "Milch"]);
  });

  it("sortiert nach Name sprachrichtig (Umlaute wie in de-CH)", () => {
    const sorted = sortFoodItems(items, "name", "de");
    expect(sorted.map(i => i.name)).toEqual([
      "Äpfel",
      "Butter",
      "Käse",
      "Milch",
      "Zwiebeln",
    ]);
  });

  it("bricht Namens-Gleichstand nach MHD (frühestes zuerst)", () => {
    const dupes = [
      { name: "Milch", expiryDate: "2026-08-10" },
      { name: "Milch", expiryDate: "2026-08-03" },
      { name: "Milch", expiryDate: null },
    ];
    const sorted = sortFoodItems(dupes, "name", "en");
    expect(sorted.map(i => i.expiryDate)).toEqual([
      "2026-08-03",
      "2026-08-10",
      null,
    ]);
  });

  it("verändert das Original-Array nicht", () => {
    const before = items.map(i => i.name);
    sortFoodItems(items, "name", "fr");
    expect(items.map(i => i.name)).toEqual(before);
  });
});

describe("isFoodSortMode", () => {
  it("akzeptiert nur die beiden bekannten Modi", () => {
    expect(isFoodSortMode("expiry")).toBe(true);
    expect(isFoodSortMode("name")).toBe(true);
    expect(isFoodSortMode("anything")).toBe(false);
    expect(isFoodSortMode(null)).toBe(false);
    expect(isFoodSortMode(1)).toBe(false);
  });
});
