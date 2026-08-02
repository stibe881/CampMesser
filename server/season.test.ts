import { describe, expect, it } from "vitest";
import { inSeason, type Season } from "@shared/season";

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
