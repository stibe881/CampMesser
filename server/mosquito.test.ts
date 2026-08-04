import { describe, expect, it } from "vitest";
import {
  breedingFactor,
  eveningMosquitoIndex,
  humidityFactor,
  MOSQUITO_LEVEL_ADVICE,
  MOSQUITO_LEVEL_LABELS,
  MOSQUITO_LEVELS,
  mosquitoIndex,
  mosquitoLevel,
  temperatureFactor,
  windFactor,
} from "@shared/mosquito";
import { LANGUAGES } from "@shared/i18n";

describe("temperatureFactor", () => {
  it("ist unter 10 °C null", () => {
    expect(temperatureFactor(6)).toBe(0);
    expect(temperatureFactor(9.9)).toBe(0);
  });

  it("steigt bis zum Optimum", () => {
    expect(temperatureFactor(17.5)).toBeCloseTo(0.5, 2);
    expect(temperatureFactor(25)).toBe(1);
    expect(temperatureFactor(30)).toBe(1);
  });

  it("fällt bei grosser Hitze wieder", () => {
    expect(temperatureFactor(40)).toBeCloseTo(0.5, 2);
    expect(temperatureFactor(50)).toBe(0);
  });
});

describe("humidityFactor", () => {
  it("ist bei trockener Luft null", () => {
    expect(humidityFactor(35)).toBe(0);
  });

  it("ist ab 80 % voll", () => {
    expect(humidityFactor(80)).toBe(1);
    expect(humidityFactor(95)).toBe(1);
  });

  it("steigt dazwischen linear", () => {
    expect(humidityFactor(60)).toBeCloseTo(0.5, 2);
  });
});

describe("windFactor", () => {
  it("stört bis 5 km/h nicht", () => {
    expect(windFactor(0)).toBe(1);
    expect(windFactor(5)).toBe(1);
  });

  it("beendet den Flug ab 15 km/h", () => {
    expect(windFactor(15)).toBe(0);
    expect(windFactor(40)).toBe(0);
  });

  it("dämpft dazwischen", () => {
    expect(windFactor(10)).toBeCloseTo(0.5, 2);
  });
});

describe("breedingFactor", () => {
  it("bleibt ohne Angabe neutral", () => {
    expect(breedingFactor(undefined)).toBe(0.8);
  });

  it("ist bei Trockenheit tiefer und nach Regen höher", () => {
    expect(breedingFactor(0)).toBe(0.6);
    expect(breedingFactor(30)).toBe(1);
  });

  it("steigt über 30 mm nicht weiter", () => {
    expect(breedingFactor(200)).toBe(1);
  });
});

describe("mosquitoIndex", () => {
  it("meldet an einem kalten Abend Ruhe – egal wie feucht", () => {
    const result = mosquitoIndex({
      temperatureC: 7,
      humidityPercent: 95,
      windKmh: 0,
      recentRainMm: 40,
    });
    expect(result.score).toBe(0);
    expect(result.level).toBe("keine");
    expect(result.limitingFactor).toBe("kalt");
  });

  it("meldet bei Wind Ruhe – auch bei Wärme und Feuchte", () => {
    const result = mosquitoIndex({
      temperatureC: 26,
      humidityPercent: 90,
      windKmh: 20,
      recentRainMm: 40,
    });
    expect(result.score).toBe(0);
    expect(result.limitingFactor).toBe("wind");
  });

  it("meldet im schwülen, windstillen Sumpf die Höchststufe", () => {
    const result = mosquitoIndex({
      temperatureC: 27,
      humidityPercent: 90,
      windKmh: 2,
      recentRainMm: 40,
    });
    expect(result.score).toBeGreaterThanOrEqual(78);
    expect(result.level).toBe("plage");
    expect(result.limitingFactor).toBeNull();
  });

  it("nennt trockene Luft als Bremse", () => {
    const result = mosquitoIndex({
      temperatureC: 28,
      humidityPercent: 45,
      windKmh: 2,
      recentRainMm: 30,
    });
    expect(result.limitingFactor).toBe("trocken");
  });

  it("verträgt kaputte Werte", () => {
    const result = mosquitoIndex({
      temperatureC: Number.NaN,
      humidityPercent: Number.NaN,
      windKmh: Number.NaN,
    });
    expect(result.score).toBe(0);
  });
});

describe("mosquitoLevel", () => {
  it("deckt die ganze Skala ab", () => {
    expect(mosquitoLevel(0)).toBe("keine");
    expect(mosquitoLevel(20)).toBe("wenig");
    expect(mosquitoLevel(40)).toBe("spuerbar");
    expect(mosquitoLevel(60)).toBe("stark");
    expect(mosquitoLevel(90)).toBe("plage");
  });
});

describe("eveningMosquitoIndex", () => {
  const hour = (h: number, windKmh: number) => ({
    hour: h,
    temperatureC: 24,
    humidityPercent: 85,
    windKmh,
    recentRainMm: 20,
  });

  it("nimmt die schlechteste Abendstunde, nicht den Schnitt", () => {
    const result = eveningMosquitoIndex([
      hour(18, 14),
      hour(20, 1),
      hour(22, 12),
    ]);
    expect(result?.score).toBe(mosquitoIndex(hour(20, 1)).score);
  });

  it("ignoriert Stunden ausserhalb des Fensters", () => {
    const result = eveningMosquitoIndex([hour(14, 0), hour(19, 12)]);
    expect(result?.score).toBe(mosquitoIndex(hour(19, 12)).score);
  });

  it("gibt ohne Abendstunden null zurück", () => {
    expect(eveningMosquitoIndex([hour(9, 2)])).toBeNull();
    expect(eveningMosquitoIndex([])).toBeNull();
  });
});

describe("Übersetzungen", () => {
  it("hat Label und Rat in allen Sprachen", () => {
    MOSQUITO_LEVELS.forEach(level => {
      LANGUAGES.forEach(lang => {
        expect(MOSQUITO_LEVEL_LABELS[level][lang].length).toBeGreaterThan(0);
        expect(MOSQUITO_LEVEL_ADVICE[level][lang].length).toBeGreaterThan(0);
      });
    });
  });
});
