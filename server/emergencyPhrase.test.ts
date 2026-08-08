/**
 * Notruf-Satz zum Vorlesen (#448): Koordinaten-Satz in vier Sprachen.
 */
import { describe, expect, it } from "vitest";
import { LANGUAGES } from "@shared/i18n";
import { emergencyCoord, emergencyPhrase } from "@shared/emergencyPhrase";

describe("emergencyPhrase", () => {
  it("enthält in jeder Sprache beide Koordinaten mit fünf Stellen", () => {
    for (const lang of LANGUAGES) {
      const phrase = emergencyPhrase(lang, 46.947123456, 7.444614);
      expect(phrase).toContain("46.94712");
      expect(phrase).toContain("7.44461");
    }
  });

  it("liest sich in der jeweiligen Sprache", () => {
    expect(emergencyPhrase("de", 46.9, 7.4)).toMatch(/^Ich brauche Hilfe/);
    expect(emergencyPhrase("fr", 46.9, 7.4)).toMatch(/^J'ai besoin d'aide/);
    expect(emergencyPhrase("it", 46.9, 7.4)).toMatch(/^Ho bisogno di aiuto/);
    expect(emergencyPhrase("en", 46.9, 7.4)).toMatch(/^I need help/);
  });

  it("behält den Punkt als Dezimaltrenner und das Vorzeichen", () => {
    expect(emergencyCoord(-7.4446149)).toBe("-7.44461");
  });
});
