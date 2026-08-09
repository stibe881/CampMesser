import { describe, expect, it } from "vitest";
import {
  airQualityLabel,
  airQualityLevel,
  airQualityNoteworthy,
} from "../shared/airQuality";

describe("Luftqualität (#565)", () => {
  it("übersetzt EAQI-Werte in die europäischen Bänder", () => {
    expect(airQualityLevel(0)).toBe("gut");
    expect(airQualityLevel(20)).toBe("gut");
    expect(airQualityLevel(21)).toBe("ordentlich");
    expect(airQualityLevel(45)).toBe("maessig");
    expect(airQualityLevel(70)).toBe("schlecht");
    expect(airQualityLevel(95)).toBe("sehrSchlecht");
    expect(airQualityLevel(140)).toBe("extrem");
  });

  it("behandelt Unsinn als «gut» statt zu raten", () => {
    expect(airQualityLevel(Number.NaN)).toBe("gut");
    expect(airQualityLevel(-5)).toBe("gut");
  });

  it("meldet sich erst ab «schlecht» von selbst", () => {
    expect(airQualityNoteworthy(45)).toBe(false);
    expect(airQualityNoteworthy(61)).toBe(true);
    expect(airQualityNoteworthy(120)).toBe(true);
  });

  it("kennt alle vier Sprachen", () => {
    expect(airQualityLabel("schlecht", "de")).toBe("Schlecht");
    expect(airQualityLabel("schlecht", "fr")).toBe("Mauvaise");
    expect(airQualityLabel("schlecht", "it")).toBe("Scarsa");
    expect(airQualityLabel("schlecht", "en")).toBe("Poor");
  });
});
