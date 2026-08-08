import { describe, expect, it } from "vitest";
import { weatherTurn, type TurnDay } from "@shared/weatherTurn";

/**
 * Wetterumschwung (#417): gemeldet wird der SPRUNG von heute auf
 * morgen, nicht das Niveau – und nur der wichtigste Grund.
 */
const calm: TurnDay = {
  date: "2026-08-08",
  tempMaxC: 24,
  precipitationSumMm: 1,
  windGustsMaxKmh: 20,
};

function day(overrides: Partial<TurnDay>): TurnDay {
  return { ...calm, date: "2026-08-09", ...overrides };
}

describe("weatherTurn", () => {
  it("meldet den Böen-Sprung", () => {
    expect(weatherTurn(calm, day({ windGustsMaxKmh: 60 }))).toEqual({
      kind: "wind",
      value: 60,
    });
  });

  it("stetiger Starkwind ist kein Umschwung", () => {
    // Wer bei 50 km/h Bise zeltet, weiss das – jeden Tag «Wind!» zu
    // melden wäre Lärm, und Lärm schaltet man ab.
    const windyToday = { ...calm, windGustsMaxKmh: 50 };
    expect(weatherTurn(windyToday, day({ windGustsMaxKmh: 55 }))).toBeNull();
  });

  it("ein Sprung unter das Weh-Niveau bleibt stumm", () => {
    // Von 5 auf 40 km/h ist ein Sprung, aber 40 reisst kein Tarp weg.
    const still = { ...calm, windGustsMaxKmh: 5 };
    expect(weatherTurn(still, day({ windGustsMaxKmh: 40 }))).toBeNull();
  });

  it("meldet den Regen-Sprung, ein Schauer zählt nicht", () => {
    expect(weatherTurn(calm, day({ precipitationSumMm: 18 }))).toEqual({
      kind: "rain",
      value: 18,
    });
    expect(weatherTurn(calm, day({ precipitationSumMm: 8 }))).toBeNull();
  });

  it("meldet den Temperatursturz", () => {
    expect(weatherTurn(calm, day({ tempMaxC: 14 }))).toEqual({
      kind: "cold",
      value: 10,
    });
    expect(weatherTurn(calm, day({ tempMaxC: 18 }))).toBeNull();
  });

  it("Wind gewinnt vor Regen und Kälte", () => {
    // Wind reisst das Tarp weg – in der Reihenfolge handelt man auch.
    const rough = day({
      windGustsMaxKmh: 70,
      precipitationSumMm: 25,
      tempMaxC: 12,
    });
    expect(weatherTurn(calm, rough)).toEqual({ kind: "wind", value: 70 });
  });

  it("ohne Daten wird nichts behauptet", () => {
    expect(weatherTurn(undefined, day({}))).toBeNull();
    expect(weatherTurn(calm, undefined)).toBeNull();
  });
});
