import { describe, expect, it } from "vitest";
import {
  findCountryRules,
  guessCountryCode,
  roadRules,
} from "../client/src/data/roadRules";
import { LANGUAGES, pick } from "@shared/i18n";

describe("Länder-Datensatz", () => {
  it("enthält die Pflicht-Länder mit eindeutigen Codes", () => {
    const codes = roadRules.map(c => c.code);
    for (const code of ["CH", "DE", "AT", "IT", "FR"]) {
      expect(codes).toContain(code);
    }
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("hat je Land ein Stand-Datum im ISO-Format", () => {
    for (const country of roadRules) {
      expect(country.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(country.updated))).toBe(false);
    }
  });

  it("übersetzt alle sichtbaren Texte in alle vier Sprachen", () => {
    const fields = [
      "name",
      "toll",
      "trailer",
      "speedNote",
      "bacNote",
      "equipment",
      "zones",
      "twoWheels",
      "emergencyNote",
      "camping",
    ] as const;
    for (const country of roadRules) {
      for (const field of fields) {
        for (const lang of LANGUAGES) {
          const text = pick(country[field], lang);
          expect(
            text.trim().length,
            `${country.code}.${field}.${lang}`
          ).toBeGreaterThan(0);
        }
      }
    }
  });

  it("führt plausible Tempolimits und Promillegrenzen", () => {
    for (const country of roadRules) {
      expect(country.speed.urban).toBeLessThanOrEqual(country.speed.rural);
      expect(country.speed.rural).toBeLessThanOrEqual(country.speed.motorway);
      expect(country.speed.motorway).toBeLessThanOrEqual(130);
      expect(country.bacPermille).toBeGreaterThanOrEqual(0);
      expect(country.bacPermille).toBeLessThanOrEqual(0.8);
      expect(country.emergency).toBe("112");
    }
  });

  it("hält die Hinweis-Wörter eindeutig und lang genug", () => {
    const seen = new Set<string>();
    for (const country of roadRules) {
      expect(country.aliases.length).toBeGreaterThan(0);
      for (const alias of country.aliases) {
        expect(alias.length, alias).toBeGreaterThanOrEqual(4);
        expect(alias).toBe(alias.toLowerCase());
        expect(seen.has(alias), alias).toBe(false);
        seen.add(alias);
      }
    }
  });
});

describe("findCountryRules", () => {
  it("findet ein Land unabhängig von der Schreibweise", () => {
    expect(findCountryRules("it")?.code).toBe("IT");
    expect(findCountryRules(" CH ")?.code).toBe("CH");
  });

  it("liefert für Unbekanntes null", () => {
    expect(findCountryRules("XX")).toBeNull();
    expect(findCountryRules(null)).toBeNull();
    expect(findCountryRules("")).toBeNull();
  });
});

describe("guessCountryCode", () => {
  it("erkennt Länder- und Regionennamen in einem Ortsnamen", () => {
    expect(guessCountryCode("Camping Bella Toskana, Italien")).toBe("IT");
    expect(guessCountryCode("Ardèche, Frankreich")).toBe("FR");
    expect(guessCountryCode("Wohnmobilstellplatz Istrien")).toBe("HR");
    expect(guessCountryCode("Zeltplatz im Wallis")).toBe("CH");
  });

  it("achtet auf Wortgrenzen und faltet Umlaute", () => {
    expect(guessCountryCode("Österreich – Camping Seeblick")).toBe("AT");
    // «Italienerstrasse» ist kein Länderhinweis
    expect(guessCountryCode("Italienerstrasse 4, Basel")).toBeNull();
  });

  it("bleibt ohne Hinweis still", () => {
    expect(guessCountryCode("Camping Seeblick")).toBeNull();
    expect(guessCountryCode("")).toBeNull();
    expect(guessCountryCode(null)).toBeNull();
    expect(guessCountryCode("   ")).toBeNull();
  });
});
