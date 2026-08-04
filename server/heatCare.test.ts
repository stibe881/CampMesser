import { describe, expect, it } from "vitest";
import {
  burnMinutes,
  drinkingLitersPerAdult,
  heatAdvice,
  HYDRATION_TEMP_THRESHOLD_C,
  reapplyMinutes,
  SUNSCREEN_UV_THRESHOLD,
} from "@shared/heatCare";

describe("reapplyMinutes", () => {
  it("verkürzt den Abstand mit steigendem UV", () => {
    expect(reapplyMinutes(3)).toBe(120);
    expect(reapplyMinutes(6)).toBe(90);
    expect(reapplyMinutes(9)).toBe(60);
    expect(reapplyMinutes(11)).toBe(45);
  });

  it("verträgt Unsinn", () => {
    expect(reapplyMinutes(Number.NaN)).toBe(120);
  });
});

describe("burnMinutes", () => {
  it("folgt der Faustformel 200 / UV", () => {
    expect(burnMinutes(8)).toBe(25);
    expect(burnMinutes(4)).toBe(50);
  });

  it("deckelt bei zwei Stunden", () => {
    expect(burnMinutes(1)).toBe(120);
    expect(burnMinutes(0)).toBe(120);
  });

  it("bleibt bei extremem UV über null", () => {
    expect(burnMinutes(50)).toBeGreaterThanOrEqual(5);
  });
});

describe("drinkingLitersPerAdult", () => {
  it("bleibt bis 20 °C bei zwei Litern", () => {
    expect(drinkingLitersPerAdult(18)).toBe(2);
    expect(drinkingLitersPerAdult(20)).toBe(2);
  });

  it("legt je angefangene 5 °C einen halben Liter drauf", () => {
    expect(drinkingLitersPerAdult(25)).toBe(2.5);
    expect(drinkingLitersPerAdult(26)).toBe(3);
    expect(drinkingLitersPerAdult(30)).toBe(3);
    expect(drinkingLitersPerAdult(35)).toBe(3.5);
  });
});

describe("heatAdvice", () => {
  it("meldet nichts an einem milden, bedeckten Tag", () => {
    expect(heatAdvice(3, 21)).toBeNull();
  });

  it("erinnert ab der UV-Schwelle ans Eincremen", () => {
    const advice = heatAdvice(SUNSCREEN_UV_THRESHOLD, 20);
    expect(advice?.sunscreen).toBe(true);
    expect(advice?.hydration).toBe(false);
  });

  it("erinnert ab der Hitze-Schwelle ans Trinken", () => {
    const advice = heatAdvice(2, HYDRATION_TEMP_THRESHOLD_C);
    expect(advice?.hydration).toBe(true);
    expect(advice?.sunscreen).toBe(false);
  });

  it("nennt beides an einem heissen Sonnentag", () => {
    const advice = heatAdvice(9, 32);
    expect(advice?.sunscreen).toBe(true);
    expect(advice?.hydration).toBe(true);
    expect(advice?.reapplyMinutes).toBe(60);
    expect(advice?.litersPerAdult).toBe(3.5);
  });

  it("verträgt fehlende Werte", () => {
    expect(heatAdvice(Number.NaN, Number.NaN)).toBeNull();
  });
});
