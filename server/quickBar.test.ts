import { describe, expect, it } from "vitest";
import {
  DEFAULT_QUICK_BAR,
  QUICK_BAR_SLOTS,
  QUICK_BAR_SOS,
  QUICK_BAR_START,
  isDefaultQuickBar,
  quickBarPaths,
  sanitizeQuickBar,
  setQuickBarSlot,
} from "@shared/quickBar";
import { modules } from "@/data/modules";

const KNOWN = modules.map(m => m.path);

describe("Schnellzugriff-Leiste", () => {
  it("hält die Vorbelegung für echte Module bereit", () => {
    // Sonst zeigt die Leiste nach dem Update ins Leere
    DEFAULT_QUICK_BAR.forEach(path => expect(KNOWN).toContain(path));
    expect(DEFAULT_QUICK_BAR).toHaveLength(QUICK_BAR_SLOTS);
  });

  it("setzt Start und SOS fest an die Ränder", () => {
    const bar = quickBarPaths(["/wetter", "/sonne", "/rezepte", "/karte"]);
    expect(bar[0]).toBe(QUICK_BAR_START);
    expect(bar[bar.length - 1]).toBe(QUICK_BAR_SOS);
    expect(bar).toHaveLength(QUICK_BAR_SLOTS + 2);
  });

  describe("Aufräumen", () => {
    it("nimmt eine gültige Belegung unverändert", () => {
      const custom = ["/wetter", "/sonne", "/rezepte", "/karte"];
      expect(sanitizeQuickBar(custom, KNOWN)).toEqual(custom);
    });

    it("wirft unbekannte Pfade weg und füllt auf", () => {
      // Ein Modul kann umbenannt oder entfernt worden sein
      const result = sanitizeQuickBar(["/wetter", "/gibtsnicht"], KNOWN);
      expect(result).toHaveLength(QUICK_BAR_SLOTS);
      expect(result[0]).toBe("/wetter");
      expect(result).not.toContain("/gibtsnicht");
    });

    it("lässt die festen Plätze nicht in die freien", () => {
      const result = sanitizeQuickBar([QUICK_BAR_START, QUICK_BAR_SOS], KNOWN);
      expect(result).not.toContain(QUICK_BAR_START);
      expect(result).not.toContain(QUICK_BAR_SOS);
      expect(result).toHaveLength(QUICK_BAR_SLOTS);
    });

    it("entfernt Duplikate", () => {
      const result = sanitizeQuickBar(["/wetter", "/wetter"], KNOWN);
      expect(result.filter(p => p === "/wetter")).toHaveLength(1);
      expect(result).toHaveLength(QUICK_BAR_SLOTS);
    });

    it("schneidet zu lange Listen ab", () => {
      const result = sanitizeQuickBar(KNOWN, KNOWN);
      expect(result).toHaveLength(QUICK_BAR_SLOTS);
    });

    it("fällt bei Unsinn auf die Vorbelegung zurück", () => {
      // Eine halb leere Leiste wäre schlimmer als eine falsch belegte
      expect(sanitizeQuickBar(null, KNOWN)).toEqual([...DEFAULT_QUICK_BAR]);
      expect(sanitizeQuickBar("kaputt", KNOWN)).toEqual([...DEFAULT_QUICK_BAR]);
      expect(sanitizeQuickBar([1, 2, 3], KNOWN)).toEqual([
        ...DEFAULT_QUICK_BAR,
      ]);
    });

    it("liefert auch bei leerer Modul-Liste keine kaputte Leiste", () => {
      expect(sanitizeQuickBar(["/wetter"], [])).toEqual([]);
    });
  });

  describe("Platz belegen", () => {
    const base = ["/packlisten", "/sonne", "/wetter", "/erste-hilfe"];

    it("setzt ein neues Modul auf den Platz", () => {
      expect(setQuickBarSlot(base, 1, "/karte")).toEqual([
        "/packlisten",
        "/karte",
        "/wetter",
        "/erste-hilfe",
      ]);
    });

    it("tauscht, wenn das Modul schon woanders steht", () => {
      // Sonst stünde dasselbe zweimal drin und ein Platz wäre verloren
      expect(setQuickBarSlot(base, 0, "/wetter")).toEqual([
        "/wetter",
        "/sonne",
        "/packlisten",
        "/erste-hilfe",
      ]);
    });

    it("ändert nichts, wenn dasselbe Modul auf denselben Platz kommt", () => {
      expect(setQuickBarSlot(base, 2, "/wetter")).toEqual(base);
    });

    it("lässt sich mit einem unsinnigen Platz nicht aus der Ruhe bringen", () => {
      expect(setQuickBarSlot(base, 9, "/karte")).toEqual(base);
      expect(setQuickBarSlot(base, -1, "/karte")).toEqual(base);
    });
  });

  it("erkennt die Vorbelegung", () => {
    expect(isDefaultQuickBar([...DEFAULT_QUICK_BAR])).toBe(true);
    expect(isDefaultQuickBar(["/karte", "/sonne", "/wetter", "/rezepte"])).toBe(
      false
    );
    expect(isDefaultQuickBar([])).toBe(false);
  });
});
