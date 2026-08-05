import { describe, expect, it } from "vitest";
import {
  MAX_SHORTCUTS,
  SHORTCUTS,
  shortcutUrl,
  shortcutsFor,
} from "@shared/shortcuts";
import { LANGUAGES } from "@shared/i18n";

describe("Kurzbefehle fürs App-Icon", () => {
  it("bleibt bei höchstens vier – mehr zeigt iOS nicht", () => {
    expect(SHORTCUTS.length).toBeLessThanOrEqual(MAX_SHORTCUTS);
    expect(shortcutsFor("de")).toHaveLength(SHORTCUTS.length);
  });

  it("jeder Schlüssel kommt nur einmal vor", () => {
    // Doppelte Schlüssel würden iOS-seitig stillschweigend einen Eintrag
    // verschlucken – und beim Antippen zum falschen Ziel führen.
    const ids = SHORTCUTS.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("alle Ziele sind eigene Pfade, keine fremden Adressen", () => {
    for (const entry of SHORTCUTS) {
      expect(entry.url.startsWith("/")).toBe(true);
      expect(entry.url.startsWith("//")).toBe(false);
    }
  });

  it("in jeder Sprache übersetzt und mit Ziel versehen", () => {
    for (const lang of LANGUAGES) {
      for (const item of shortcutsFor(lang)) {
        expect(item.title.length).toBeGreaterThan(0);
        expect(item.subtitle.length).toBeGreaterThan(0);
        expect(item.params.url).toBe(shortcutUrl(item.id));
      }
    }
  });

  it("unbekannter Schlüssel ergibt kein Ziel", () => {
    expect(shortcutUrl("gibtsnicht")).toBeNull();
  });
});
