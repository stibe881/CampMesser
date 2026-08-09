/**
 * Notruf-Satz zum Vorlesen (#448): Koordinaten-Satz in vier Sprachen.
 */
import { describe, expect, it } from "vitest";
import { LANGUAGES } from "@shared/i18n";
import {
  emergencyCoord,
  emergencyPhrase,
  formatLv95,
} from "@shared/emergencyPhrase";

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

describe("Schweizer Koordinaten im Notruf-Satz (#547)", () => {
  it("hängt LV95 an, wenn vorhanden – in jeder Sprache", () => {
    const lv95 = { east: 2600123, north: 1199456 };
    for (const lang of LANGUAGES) {
      const phrase = emergencyPhrase(lang, 46.9, 7.4, lv95);
      expect(phrase).toContain("2'600'123 / 1'199'456");
    }
    expect(emergencyPhrase("de", 46.9, 7.4, lv95)).toContain(
      "Schweizer Koordinaten:"
    );
  });

  it("lässt den Satz ohne LV95 unverändert (Ausland)", () => {
    expect(emergencyPhrase("de", 43.5, 4.9)).not.toContain("Koordinaten");
    expect(emergencyPhrase("de", 43.5, 4.9, null)).toBe(
      emergencyPhrase("de", 43.5, 4.9)
    );
  });

  it("gruppiert LV95 mit Apostrophen und rundet auf Meter", () => {
    expect(formatLv95(2600123.4)).toBe("2'600'123");
    expect(formatLv95(1199456.6)).toBe("1'199'457");
  });
});
