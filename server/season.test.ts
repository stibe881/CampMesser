import { describe, expect, it } from "vitest";
import {
  entriesInSeason,
  inSeason,
  monthsUntilSeason,
  normalizeMonth,
  seasonLength,
  seasonMonths,
  type Season,
} from "@shared/season";

describe("inSeason", () => {
  it("ohne Saison-Angabe gilt der Eintrag ganzjährig", () => {
    for (let month = 1; month <= 12; month++) {
      expect(inSeason(undefined, month)).toBe(true);
    }
  });

  it("normale Saison: Monate innerhalb inkl. Grenzen treffen", () => {
    const summer: Season = { from: 6, to: 10 };
    expect(inSeason(summer, 6)).toBe(true); // erste Grenze
    expect(inSeason(summer, 8)).toBe(true); // mittendrin
    expect(inSeason(summer, 10)).toBe(true); // letzte Grenze
  });

  it("normale Saison: Monate ausserhalb treffen nicht", () => {
    const summer: Season = { from: 6, to: 10 };
    expect(inSeason(summer, 5)).toBe(false);
    expect(inSeason(summer, 11)).toBe(false);
    expect(inSeason(summer, 1)).toBe(false);
  });

  it("wrap-around über den Jahreswechsel (Oktober–März)", () => {
    const winter: Season = { from: 10, to: 3 };
    expect(inSeason(winter, 10)).toBe(true); // erste Grenze
    expect(inSeason(winter, 12)).toBe(true); // vor dem Jahreswechsel
    expect(inSeason(winter, 1)).toBe(true); // nach dem Jahreswechsel
    expect(inSeason(winter, 3)).toBe(true); // letzte Grenze
    expect(inSeason(winter, 4)).toBe(false);
    expect(inSeason(winter, 9)).toBe(false);
  });

  it("einmonatige Saison trifft genau diesen Monat", () => {
    const may: Season = { from: 5, to: 5 };
    expect(inSeason(may, 5)).toBe(true);
    expect(inSeason(may, 4)).toBe(false);
    expect(inSeason(may, 6)).toBe(false);
  });
});

describe("normalizeMonth", () => {
  it("faltet über beide Jahresgrenzen zurück", () => {
    expect(normalizeMonth(1)).toBe(1);
    expect(normalizeMonth(12)).toBe(12);
    expect(normalizeMonth(13)).toBe(1);
    expect(normalizeMonth(24)).toBe(12);
    expect(normalizeMonth(0)).toBe(12);
    expect(normalizeMonth(-1)).toBe(11);
  });
});

describe("seasonMonths", () => {
  it("ohne Saison sind es alle zwölf Monate", () => {
    expect(seasonMonths(undefined)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
    expect(seasonLength(undefined)).toBe(12);
  });

  it("normale Saison in Kalender-Reihenfolge", () => {
    const summer: Season = { from: 6, to: 9 };
    expect(seasonMonths(summer)).toEqual([6, 7, 8, 9]);
    expect(seasonLength(summer)).toBe(4);
  });

  it("Saison über den Jahreswechsel bleibt in Kalender-Reihenfolge", () => {
    const winter: Season = { from: 11, to: 2 };
    // Januar zuerst, damit sich ein Monatsstreifen direkt einfärben lässt
    expect(seasonMonths(winter)).toEqual([1, 2, 11, 12]);
    expect(seasonLength(winter)).toBe(4);
  });

  it("einmonatige Saison", () => {
    expect(seasonMonths({ from: 4, to: 4 })).toEqual([4]);
    expect(seasonLength({ from: 4, to: 4 })).toBe(1);
  });

  it("Saison vom Dezember bis November umfasst alle Monate", () => {
    expect(seasonLength({ from: 12, to: 11 })).toBe(12);
  });
});

describe("monthsUntilSeason", () => {
  it("laufende Saison ergibt 0", () => {
    expect(monthsUntilSeason({ from: 6, to: 9 }, 7)).toBe(0);
    expect(monthsUntilSeason({ from: 6, to: 9 }, 6)).toBe(0);
    expect(monthsUntilSeason({ from: 6, to: 9 }, 9)).toBe(0);
  });

  it("ohne Saison immer 0 (ganzjährig)", () => {
    expect(monthsUntilSeason(undefined, 3)).toBe(0);
  });

  it("zählt vorwärts bis zum Saisonstart", () => {
    expect(monthsUntilSeason({ from: 6, to: 9 }, 4)).toBe(2);
    expect(monthsUntilSeason({ from: 6, to: 9 }, 10)).toBe(8);
  });

  it("zählt auch über den Jahreswechsel vorwärts", () => {
    const winter: Season = { from: 11, to: 2 };
    expect(monthsUntilSeason(winter, 9)).toBe(2);
    expect(monthsUntilSeason(winter, 10)).toBe(1);
    expect(monthsUntilSeason(winter, 3)).toBe(8);
  });
});

describe("entriesInSeason", () => {
  const entries = [
    { id: "steinpilz", season: { from: 7, to: 10 } as Season },
    { id: "morchel", season: { from: 4, to: 5 } as Season },
    { id: "herbsttrompete", season: { from: 9, to: 12 } as Season },
    { id: "immer" },
  ];

  it("filtert auf den gewünschten Monat, ganzjährige bleiben drin", () => {
    expect(entriesInSeason(entries, 9).map(e => e.id)).toEqual([
      "steinpilz",
      "herbsttrompete",
      "immer",
    ]);
    expect(entriesInSeason(entries, 4).map(e => e.id)).toEqual([
      "morchel",
      "immer",
    ]);
  });

  it("ausserhalb aller Saisons bleiben nur die ganzjährigen", () => {
    expect(entriesInSeason(entries, 2).map(e => e.id)).toEqual(["immer"]);
  });
});
