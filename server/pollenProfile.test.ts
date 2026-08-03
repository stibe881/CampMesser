import { describe, expect, it } from "vitest";
import {
  sanitizePollenProfile,
  sortPollenReadings,
  togglePollenType,
} from "../client/src/lib/pollenProfile";
import { POLLEN_TYPES } from "../shared/pollen";

describe("sanitizePollenProfile", () => {
  it("übernimmt bekannte Arten in Katalog-Reihenfolge", () => {
    expect(sanitizePollenProfile(["grass", "alder"])).toEqual([
      "alder",
      "grass",
    ]);
  });

  it("verwirft Duplikate und unbekannte Werte", () => {
    expect(
      sanitizePollenProfile(["birch", "birch", "pinie", 42, null])
    ).toEqual(["birch"]);
  });

  it("liefert für Nicht-Arrays und leere Daten ein leeres Profil", () => {
    expect(sanitizePollenProfile(undefined)).toEqual([]);
    expect(sanitizePollenProfile("birch")).toEqual([]);
    expect(sanitizePollenProfile({ birch: true })).toEqual([]);
    expect(sanitizePollenProfile([])).toEqual([]);
  });

  it("akzeptiert den vollständigen Katalog", () => {
    expect(sanitizePollenProfile([...POLLEN_TYPES])).toEqual([...POLLEN_TYPES]);
  });
});

describe("togglePollenType", () => {
  it("wählt eine Art an und hält die Katalog-Reihenfolge", () => {
    expect(togglePollenType(["grass"], "alder")).toEqual(["alder", "grass"]);
  });

  it("wählt eine gesetzte Art wieder ab", () => {
    expect(togglePollenType(["alder", "grass"], "alder")).toEqual(["grass"]);
  });

  it("lässt die Eingabe unverändert (neue Liste)", () => {
    const profile = ["grass"] as const;
    const next = togglePollenType([...profile], "birch");
    expect(profile).toEqual(["grass"]);
    expect(next).toEqual(["birch", "grass"]);
  });
});

describe("sortPollenReadings", () => {
  const readings = POLLEN_TYPES.map(type => ({ type }));

  it("stellt die eigenen Arten nach vorne", () => {
    const sorted = sortPollenReadings(readings, ["grass", "ragweed"]);
    expect(sorted.map(r => r.type).slice(0, 2)).toEqual(["grass", "ragweed"]);
    expect(sorted).toHaveLength(readings.length);
  });

  it("behält innerhalb der Gruppen die Reihenfolge bei", () => {
    const sorted = sortPollenReadings(readings, ["ragweed", "birch"]);
    expect(sorted.map(r => r.type)).toEqual([
      "birch",
      "ragweed",
      "alder",
      "grass",
      "mugwort",
      "olive",
    ]);
  });

  it("lässt die Liste ohne Profil unverändert", () => {
    expect(sortPollenReadings(readings, [])).toBe(readings);
  });
});
