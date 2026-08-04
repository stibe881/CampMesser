import { describe, expect, it } from "vitest";
import {
  MAX_PACK_SUGGESTIONS,
  normalizeItemName,
  packSuggestions,
  suggestionShare,
} from "@shared/packHistory";

const trips = [
  { tripId: 1, packListId: 10, startDate: "2024-07-01" },
  { tripId: 2, packListId: 20, startDate: "2025-07-01" },
];

const items = [
  { listId: 10, name: "Gummistiefel", category: "Kleidung" },
  { listId: 10, name: "Mückenspray", category: "Gesundheit" },
  { listId: 20, name: "Gummistiefel", category: "Kleidung" },
  { listId: 20, name: "Petroleumlampe", category: "Licht" },
];

describe("Packvorschlag aus vergangenen Reisen (#277)", () => {
  it("schlägt vor, was an diesem Platz schon dabei war", () => {
    const suggestions = packSuggestions(trips, items, []);
    expect(suggestions.map(s => s.name)).toEqual([
      "Gummistiefel",
      "Petroleumlampe",
      "Mückenspray",
    ]);
    expect(suggestions[0].trips).toBe(2);
  });

  it("lässt weg, was schon auf der Liste steht", () => {
    const suggestions = packSuggestions(trips, items, [
      { name: "  gummistiefel " },
    ]);
    expect(suggestions.map(s => s.name)).not.toContain("Gummistiefel");
  });

  it("zählt pro Reise und nicht pro Eintrag", () => {
    // Derselbe Gegenstand dreimal auf einer Liste bleibt eine Erfahrung
    const doubled = [
      ...items,
      { listId: 20, name: "Petroleumlampe", category: "Licht" },
      { listId: 20, name: "petroleumlampe", category: "Licht" },
    ];
    const suggestions = packSuggestions(trips, doubled, []);
    const lamp = suggestions.find(s => s.name === "Petroleumlampe")!;
    expect(lamp.trips).toBe(1);
  });

  it("faltet Umlaute und Schreibweisen zusammen", () => {
    expect(normalizeItemName("  Müsli ")).toBe("muesli");
    expect(normalizeItemName("Muesli")).toBe("muesli");
    expect(normalizeItemName("Zwei   Wörter")).toBe("zwei woerter");
    const mixed = [
      { listId: 10, name: "Müsli", category: "Küche" },
      { listId: 20, name: "Muesli", category: "Küche" },
    ];
    const suggestions = packSuggestions(trips, mixed, []);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].trips).toBe(2);
    // Die Schreibweise der jüngsten Reise gewinnt
    expect(suggestions[0].name).toBe("Muesli");
  });

  it("sortiert Häufiges nach oben, dann Jüngeres", () => {
    const suggestions = packSuggestions(trips, items, []);
    expect(suggestions[0].name).toBe("Gummistiefel");
    // Beide einmal dabei – die jüngere Reise (2025) steht vorn
    expect(suggestions[1].name).toBe("Petroleumlampe");
    expect(suggestions[1].lastSeen).toBe("2025-07-01");
  });

  it("ignoriert Einträge ohne passende Reise und leere Namen", () => {
    const noisy = [
      ...items,
      { listId: 99, name: "Fremdes", category: "X" },
      { listId: 10, name: "   ", category: "X" },
    ];
    const suggestions = packSuggestions(trips, noisy, []);
    expect(suggestions.map(s => s.name)).not.toContain("Fremdes");
    expect(suggestions.every(s => s.name.trim().length > 0)).toBe(true);
  });

  it("ohne Historie gibt es keine Vorschläge", () => {
    expect(packSuggestions([], items, [])).toEqual([]);
    expect(packSuggestions(trips, [], [])).toEqual([]);
  });

  it("hält die Obergrenze ein", () => {
    const many = Array.from({ length: 40 }, (_, i) => ({
      listId: 10,
      name: `Ding ${i}`,
      category: "X",
    }));
    expect(packSuggestions(trips, many, [])).toHaveLength(MAX_PACK_SUGGESTIONS);
    expect(packSuggestions(trips, many, [], 3)).toHaveLength(3);
  });

  it("rechnet den Anteil «wie oft von wie vielen»", () => {
    const suggestion = {
      name: "x",
      category: "y",
      trips: 2,
      lastSeen: "2025-07-01",
    };
    expect(suggestionShare(suggestion, 2)).toBe(1);
    expect(suggestionShare(suggestion, 4)).toBe(0.5);
    expect(suggestionShare(suggestion, 0)).toBe(0);
  });
});
