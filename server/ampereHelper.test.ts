import { describe, expect, it } from "vitest";
import {
  AMPERE_DEVICES,
  AMPERE_OPTIONS,
  ampereCheck,
  wattLimit,
} from "@shared/ampereHelper";

/** Ampere-Helfer am Platz (#639): hält die Säulen-Sicherung? */
describe("ampereCheck", () => {
  it("rechnet die Belastbarkeit mit 230 V", () => {
    expect(wattLimit(10)).toBe(2300);
    expect(wattLimit(6)).toBe(1380);
    expect(wattLimit(-1)).toBe(0);
  });

  it("Wasserkocher allein hält an 10 A, mit Heizlüfter nicht", () => {
    const alone = ampereCheck(["wasserkocher"], 10);
    expect(alone.ok).toBe(true);
    expect(alone.totalWatts).toBe(1800);
    const both = ampereCheck(["wasserkocher", "heizluefter"], 10);
    expect(both.ok).toBe(false);
    expect(both.marginWatts).toBeLessThan(0);
    // An 16 A geht beides zusammen (3800 W < 3680 W? nein!) – ehrlich:
    // 3800 W überschreiten auch 16 A (3680 W) knapp.
    expect(ampereCheck(["wasserkocher", "heizluefter"], 16).ok).toBe(false);
  });

  it("unbekannte Geräte zählen nicht, leere Auswahl ist immer ok", () => {
    expect(ampereCheck(["gibtsnicht"], 6).totalWatts).toBe(0);
    expect(ampereCheck([], 4).ok).toBe(true);
  });

  it("Katalog und Sicherungs-Stufen sind plausibel", () => {
    expect(AMPERE_OPTIONS).toContain(6);
    expect(AMPERE_OPTIONS).toContain(16);
    expect(AMPERE_DEVICES.every(device => device.watts > 0)).toBe(true);
    expect(new Set(AMPERE_DEVICES.map(d => d.id)).size).toBe(
      AMPERE_DEVICES.length
    );
  });
});
