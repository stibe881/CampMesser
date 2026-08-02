/**
 * Mehrsprachigkeit: Basis-Helfer und strukturelle Vollständigkeit der
 * UI-Wörterbücher. Die Typprüfung (`Translation`) fängt fehlende Schlüssel
 * schon zur Kompilierzeit – dieser Test prüft zusätzlich zur Laufzeit,
 * dass alle vier Wörterbücher exakt dieselbe Struktur haben.
 */
import { describe, expect, it } from "vitest";
import {
  LANGUAGES,
  LOCALE_TAGS,
  detectLanguage,
  l4,
  pick,
} from "../shared/i18n";
import { de } from "../client/src/i18n/de";
import { fr } from "../client/src/i18n/fr";
import { it as itDict } from "../client/src/i18n/it";
import { en } from "../client/src/i18n/en";

describe("i18n-Helfer", () => {
  it("pick liefert die gewünschte Sprache aus einem L4-Objekt", () => {
    const text = l4("Hallo", "Salut", "Ciao", "Hello");
    expect(pick(text, "de")).toBe("Hallo");
    expect(pick(text, "fr")).toBe("Salut");
    expect(pick(text, "it")).toBe("Ciao");
    expect(pick(text, "en")).toBe("Hello");
  });

  it("pick reicht sprachneutrale Strings unverändert durch", () => {
    expect(pick("SOS 112", "fr")).toBe("SOS 112");
  });

  it("LOCALE_TAGS deckt alle Sprachen mit gültigen BCP-47-Tags ab", () => {
    for (const lang of LANGUAGES) {
      expect(LOCALE_TAGS[lang]).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
      // Muss von Intl akzeptiert werden (wirft sonst RangeError)
      expect(() => new Intl.DateTimeFormat(LOCALE_TAGS[lang])).not.toThrow();
    }
  });
});

describe("detectLanguage (Startsprache aus Browsersprachen)", () => {
  it("erkennt fr-CH als Französisch", () => {
    expect(detectLanguage(["fr-CH", "fr", "en"])).toBe("fr");
  });

  it("erkennt it ohne Regions-Tag als Italienisch", () => {
    expect(detectLanguage(["it"])).toBe("it");
  });

  it("erkennt en-GB als Englisch", () => {
    expect(detectLanguage(["en-GB", "en-US"])).toBe("en");
  });

  it("liefert für de-CH Deutsch", () => {
    expect(detectLanguage(["de-CH", "de"])).toBe("de");
  });

  it("fällt bei unbekannten Sprachen auf Deutsch zurück", () => {
    expect(detectLanguage(["es-ES", "pt-BR"])).toBe("de");
  });

  it("nimmt bei unbekannter Erstsprache die nächste unterstützte", () => {
    expect(detectLanguage(["es-ES", "fr-FR"])).toBe("fr");
  });

  it("fällt bei leerer Liste auf Deutsch zurück", () => {
    expect(detectLanguage([])).toBe("de");
  });

  it("ist unempfindlich gegenüber Gross-/Kleinschreibung", () => {
    expect(detectLanguage(["EN-GB"])).toBe("en");
  });
});

describe("UI-Wörterbücher", () => {
  /** Alle Blatt-Pfade eines Wörterbuchs mit ihrem Typ (string/function). */
  function collectLeaves(
    obj: Record<string, unknown>,
    prefix = ""
  ): Map<string, string> {
    const leaves = new Map<string, string>();
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const path = prefix ? `${prefix}.${key}` : key;
      if (value !== null && typeof value === "object") {
        collectLeaves(value as Record<string, unknown>, path).forEach(
          (type, p) => leaves.set(p, type)
        );
      } else {
        leaves.set(path, typeof value);
      }
    });
    return leaves;
  }

  const reference = collectLeaves(de);
  const others = { fr, it: itDict, en } as const;

  it("de enthält Schlüssel", () => {
    expect(reference.size).toBeGreaterThan(100);
  });

  (Object.keys(others) as (keyof typeof others)[]).forEach(langKey => {
    it(`${langKey} hat exakt dieselben Schlüssel und Typen wie de`, () => {
      const leaves = collectLeaves(others[langKey]);
      const missing = Array.from(reference.keys()).filter(p => !leaves.has(p));
      const extra = Array.from(leaves.keys()).filter(p => !reference.has(p));
      expect(missing).toEqual([]);
      expect(extra).toEqual([]);
      reference.forEach((type, path) => {
        expect(`${path}: ${leaves.get(path)}`).toBe(`${path}: ${type}`);
      });
    });

    // Bewusst leer: das deutsche " Uhr"-Suffix hat in fr/it/en kein Pendant.
    const INTENTIONALLY_EMPTY = new Set([
      "drying.dryAtSuffix",
      "drying.rainFromSuffix",
    ]);

    it(`${langKey} hat keine leeren Übersetzungen`, () => {
      const empty = Array.from(collectLeaves(others[langKey]).keys())
        .filter(path => !INTENTIONALLY_EMPTY.has(path))
        .filter(path => {
          const value = path
            .split(".")
            .reduce<unknown>(
              (o, k) => (o as Record<string, unknown>)[k],
              others[langKey]
            );
          return typeof value === "string" && value.trim() === "";
        });
      expect(empty).toEqual([]);
    });
  });
});
