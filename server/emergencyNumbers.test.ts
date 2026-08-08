/**
 * Notrufnummern-Katalog (#432): Der Test sichert die Katalog-Zusagen ab –
 * eindeutige Ländercodes, wählbare Nummern, und dass die Schweiz die Rega
 * (1414) führt. Die Nummern selbst sind amtliche Konstanten, kein Rechenweg.
 */
import { describe, expect, it } from "vitest";
import {
  EMERGENCY_COUNTRIES,
  EU_EMERGENCY_NUMBER,
} from "../shared/emergencyNumbers";

describe("EMERGENCY_COUNTRIES", () => {
  it("hat eindeutige, kleingeschriebene ISO-Ländercodes", () => {
    const codes = EMERGENCY_COUNTRIES.map(country => country.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const code of codes) {
      expect(code).toMatch(/^[a-z]{2}$/);
    }
  });

  it("führt nur wählbare Nummern (reine Ziffern)", () => {
    for (const country of EMERGENCY_COUNTRIES) {
      expect(country.numbers.length).toBeGreaterThan(0);
      for (const entry of country.numbers) {
        expect(entry.number).toMatch(/^\d{2,4}$/);
      }
    }
  });

  it("beschriftet jede Nummer in allen vier Sprachen", () => {
    for (const country of EMERGENCY_COUNTRIES) {
      for (const lang of ["de", "fr", "it", "en"] as const) {
        expect(country.name[lang].length).toBeGreaterThan(0);
        for (const entry of country.numbers) {
          expect(entry.label[lang].length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("kennt die Rega (1414) in der Schweiz", () => {
    const ch = EMERGENCY_COUNTRIES.find(country => country.code === "ch");
    expect(ch?.numbers.some(entry => entry.number === "1414")).toBe(true);
  });

  it("Schweiz steht zuerst, danach die Nachbarländer", () => {
    expect(EMERGENCY_COUNTRIES[0]?.code).toBe("ch");
  });

  it("112 ist als europaweite Nummer hinterlegt", () => {
    expect(EU_EMERGENCY_NUMBER).toBe("112");
  });
});
