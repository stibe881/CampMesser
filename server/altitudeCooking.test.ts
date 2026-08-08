import { describe, expect, it } from "vitest";
import {
  ALTITUDE_HINT_MIN_M,
  ALTITUDE_STRONG_M,
  adjustedMinutes,
  affectsCookTime,
  altitudeLevel,
  boilingPointC,
  cookTimeFactor,
} from "@shared/altitudeCooking";

describe("boilingPointC", () => {
  it("bleibt auf Meereshöhe bei 100 Grad", () => {
    expect(boilingPointC(0)).toBe(100);
  });

  it("trifft die bekannten Werte der Bergküche", () => {
    // Rund 1 Grad je 300 Höhenmeter – auf 2000 m sind das etwa 93 Grad.
    expect(boilingPointC(2000)).toBeCloseTo(93.3, 1);
    expect(boilingPointC(1000)).toBeCloseTo(96.7, 1);
  });

  it("rechnet unter Meereshöhe nicht ins Absurde", () => {
    expect(boilingPointC(-500)).toBe(100);
  });
});

describe("cookTimeFactor", () => {
  it("lässt das Flachland in Ruhe", () => {
    // Ein Hinweis, der bei jedem Rezept steht, ist Lärm.
    expect(cookTimeFactor(0)).toBe(1);
    expect(cookTimeFactor(ALTITUDE_HINT_MIN_M - 1)).toBe(1);
  });

  it("verlängert mit der Höhe", () => {
    expect(cookTimeFactor(1000)).toBeGreaterThan(cookTimeFactor(600));
    expect(cookTimeFactor(2000)).toBeGreaterThan(cookTimeFactor(1000));
  });

  it("deckelt bei 1.6 statt ins Unendliche zu laufen", () => {
    // Wer auf 4000 m Linsen kocht, braucht keinen Faktor, sondern einen
    // Dampfkochtopf.
    expect(cookTimeFactor(9000)).toBe(1.6);
  });
});

describe("affectsCookTime", () => {
  it("behauptet ohne bekannte Höhe nichts", () => {
    expect(affectsCookTime(null)).toBe(false);
  });

  it("schweigt unter der Schwelle", () => {
    expect(affectsCookTime(400)).toBe(false);
    expect(affectsCookTime(ALTITUDE_HINT_MIN_M)).toBe(true);
  });
});

describe("adjustedMinutes", () => {
  it("lässt die Zeit ohne Höhe unverändert", () => {
    expect(adjustedMinutes(12, null)).toBe(12);
    expect(adjustedMinutes(12, 200)).toBe(12);
  });

  it("rundet AUF statt kaufmännisch", () => {
    // Zu lang gekochte Teigwaren sind unschön, zu kurz gekochte Linsen
    // ungeniessbar.
    const factor = cookTimeFactor(1000);
    expect(adjustedMinutes(12, 1000)).toBe(Math.ceil(12 * factor));
    expect(adjustedMinutes(12, 1000)).toBeGreaterThan(12);
  });
});

describe("altitudeLevel", () => {
  it("unterscheidet drei Fälle", () => {
    expect(altitudeLevel(null)).toBe("none");
    expect(altitudeLevel(300)).toBe("none");
    expect(altitudeLevel(900)).toBe("mild");
    expect(altitudeLevel(ALTITUDE_STRONG_M)).toBe("strong");
  });
});
