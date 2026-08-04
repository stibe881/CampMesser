import { describe, expect, it } from "vitest";
import {
  accuracyUsable,
  canDeclareFound,
  FOUND_RADIUS_M,
  huntProgress,
  MAX_TREASURE_POINTS,
  MAX_USABLE_ACCURACY_M,
  nextPoint,
  nextSortIndex,
  normalizeHuntName,
  sortPoints,
  warmthFor,
  WARMTH_HINTS,
  WARMTH_LABELS,
} from "@shared/treasureHunt";
import { LANGUAGES, pick } from "@shared/i18n";

const point = (id: number, sortIndex: number, found = false) => ({
  id,
  sortIndex,
  foundAt: found ? new Date("2026-08-04T10:00:00Z") : null,
});

describe("GPS-Schatzsuche (#267)", () => {
  it("die Wärme-Stufen decken die ganze Skala lückenlos ab", () => {
    expect(warmthFor(0)).toBe("gefunden");
    expect(warmthFor(FOUND_RADIUS_M)).toBe("gefunden");
    expect(warmthFor(FOUND_RADIUS_M + 0.1)).toBe("heiss");
    expect(warmthFor(40)).toBe("heiss");
    expect(warmthFor(41)).toBe("warm");
    expect(warmthFor(100)).toBe("warm");
    expect(warmthFor(101)).toBe("kalt");
    expect(warmthFor(300)).toBe("kalt");
    expect(warmthFor(301)).toBe("eiskalt");
    expect(warmthFor(5000)).toBe("eiskalt");
  });

  it("jede Stufe hat Bezeichnung und Tipp in vier Sprachen", () => {
    for (const warmth of [
      "eiskalt",
      "kalt",
      "warm",
      "heiss",
      "gefunden",
    ] as const) {
      for (const lang of LANGUAGES) {
        expect(pick(WARMTH_LABELS[warmth], lang).length).toBeGreaterThan(2);
        expect(pick(WARMTH_HINTS[warmth], lang).length).toBeGreaterThan(25);
      }
    }
  });

  it("«gefunden» braucht Nähe UND eine brauchbare Ortung", () => {
    // Nah genug und genau: darf gemeldet werden
    expect(canDeclareFound(10, 8)).toBe(true);
    // Nah genug, aber das Gerät weiss selbst nicht, wo es ist
    expect(canDeclareFound(10, MAX_USABLE_ACCURACY_M + 1)).toBe(false);
    // Zu weit weg, egal wie genau
    expect(canDeclareFound(FOUND_RADIUS_M + 1, 3)).toBe(false);
    // Ohne Genauigkeitsangabe wird die Distanz für bare Münze genommen
    expect(canDeclareFound(10, null)).toBe(true);
  });

  it("meldet ein schwaches Signal, statt eine Zahl vorzutäuschen", () => {
    expect(accuracyUsable(12)).toBe(true);
    expect(accuracyUsable(MAX_USABLE_ACCURACY_M)).toBe(true);
    expect(accuracyUsable(MAX_USABLE_ACCURACY_M + 1)).toBe(false);
    expect(accuracyUsable(null)).toBe(true);
  });

  it("sortiert nach Reihenfolge, bei Gleichstand nach Id", () => {
    const points = [point(9, 1), point(3, 0), point(7, 1)];
    expect(sortPoints(points).map(p => p.id)).toEqual([3, 7, 9]);
  });

  it("der nächste Punkt ist der erste noch nicht gefundene", () => {
    const points = [point(1, 0, true), point(2, 1), point(3, 2)];
    expect(nextPoint(points)?.id).toBe(2);
    // Auch wenn ein späterer Punkt schon abgehakt wurde, bleibt die Reihenfolge
    const skipped = [point(1, 0, true), point(2, 1), point(3, 2, true)];
    expect(nextPoint(skipped)?.id).toBe(2);
  });

  it("ohne offene Punkte gibt es kein Ziel mehr", () => {
    expect(nextPoint([])).toBeNull();
    expect(nextPoint([point(1, 0, true)])).toBeNull();
  });

  it("der Fortschritt zählt gefundene Punkte und kennt das Ende", () => {
    expect(huntProgress([])).toEqual({
      found: 0,
      total: 0,
      done: false,
      percent: 0,
    });
    expect(huntProgress([point(1, 0, true), point(2, 1)])).toEqual({
      found: 1,
      total: 2,
      done: false,
      percent: 50,
    });
    expect(huntProgress([point(1, 0, true)]).done).toBe(true);
  });

  it("neue Verstecke werden angehängt, nicht eingeschoben", () => {
    expect(nextSortIndex([])).toBe(0);
    expect(nextSortIndex([point(1, 0), point(2, 4)])).toBe(5);
  });

  it("kappt zu lange Namen und lässt leere leer", () => {
    expect(normalizeHuntName("  Waldsuche  ")).toBe("Waldsuche");
    expect(normalizeHuntName("   ")).toBe("");
    expect(normalizeHuntName("x".repeat(200))).toHaveLength(60);
  });

  it("hält die Obergrenze für eine Kindergruppe im Rahmen", () => {
    expect(MAX_TREASURE_POINTS).toBeGreaterThanOrEqual(6);
    expect(MAX_TREASURE_POINTS).toBeLessThanOrEqual(20);
  });
});
