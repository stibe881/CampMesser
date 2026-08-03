import { describe, expect, it } from "vitest";
import {
  natureCategories,
  natureEntries,
  quizEntries,
} from "../client/src/data/nature";
import { LANGUAGES, pick } from "@shared/i18n";
import { entriesInSeason, seasonLength } from "@shared/season";

const mushrooms = natureEntries.filter(e => e.category === "pilze");
const berries = natureEntries.filter(e => e.category === "beeren");

describe("Pilz- und Beeren-Saisonkalender (#237)", () => {
  it("legt beide Kategorien im Lexikon an", () => {
    const ids = natureCategories.map(c => c.id);
    expect(ids).toContain("pilze");
    expect(ids).toContain("beeren");
  });

  it("beide Kategorien tragen Warnung und Sammelregeln in vier Sprachen", () => {
    for (const id of ["pilze", "beeren"] as const) {
      const category = natureCategories.find(c => c.id === id)!;
      for (const lang of LANGUAGES) {
        expect(pick(category.warning!, lang).length).toBeGreaterThan(80);
        expect(pick(category.rulesHint!, lang).length).toBeGreaterThan(60);
      }
    }
  });

  it("enthält die gängigen Speisepilze und Wildbeeren", () => {
    const ids = natureEntries.map(e => e.id);
    for (const id of [
      "steinpilz",
      "eierschwamm",
      "maronenroehrling",
      "parasol",
      "morchel",
      "herbsttrompete",
    ]) {
      expect(ids).toContain(id);
    }
    for (const id of [
      "heidelbeere",
      "brombeere",
      "himbeere",
      "holunder",
      "hagebutte",
      "schlehe",
    ]) {
      expect(ids).toContain(id);
    }
  });

  it("jeder Pilz nennt mindestens einen Doppelgänger – ohne Ausnahme", () => {
    expect(mushrooms.length).toBeGreaterThanOrEqual(6);
    for (const entry of mushrooms) {
      expect(entry.lookalikes?.length ?? 0).toBeGreaterThan(0);
      for (const look of entry.lookalikes!) {
        expect(look.latin.length).toBeGreaterThan(3);
        for (const lang of LANGUAGES) {
          expect(pick(look.name, lang).length).toBeGreaterThan(2);
          expect(pick(look.warning, lang).length).toBeGreaterThan(40);
        }
      }
    }
  });

  it("nennt die klassischen Giftpilze als Doppelgänger", () => {
    const latins = mushrooms.flatMap(e => e.lookalikes!.map(l => l.latin));
    expect(latins).toContain("Amanita phalloides"); // Knollenblätterpilz
    expect(latins).toContain("Hygrophoropsis aurantiaca"); // Falscher Pfifferling
    expect(latins).toContain("Gyromitra esculenta"); // Frühjahrslorchel
  });

  it("jeder neue Eintrag hat Saison, Fundort und Verwendung in vier Sprachen", () => {
    for (const entry of [...mushrooms, ...berries]) {
      expect(entry.season).toBeDefined();
      for (const lang of LANGUAGES) {
        expect(pick(entry.habitat!, lang).length).toBeGreaterThan(20);
        expect(pick(entry.use!, lang).length).toBeGreaterThan(20);
        expect(pick(entry.description, lang).length).toBeGreaterThan(40);
      }
      expect(entry.features.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("die Schlehe reicht über den Jahreswechsel", () => {
    const sloe = natureEntries.find(e => e.id === "schlehe")!;
    expect(sloe.season).toEqual({ from: 10, to: 1 });
    // Vier Monate, obwohl `to` kleiner ist als `from`
    expect(seasonLength(sloe.season)).toBe(4);
    expect(entriesInSeason([sloe], 12)).toHaveLength(1);
    expect(entriesInSeason([sloe], 1)).toHaveLength(1);
    expect(entriesInSeason([sloe], 2)).toHaveLength(0);
  });

  it("«was hat jetzt Saison» trifft im September die Herbstarten", () => {
    const inSeptember = entriesInSeason(mushrooms, 9).map(e => e.id);
    expect(inSeptember).toContain("steinpilz");
    expect(inSeptember).toContain("herbsttrompete");
    expect(inSeptember).not.toContain("morchel");
    const inApril = entriesInSeason(mushrooms, 4).map(e => e.id);
    expect(inApril).toEqual(["morchel"]);
  });

  it("das Kinder-Quiz lässt die Pilze bewusst aussen vor", () => {
    expect(quizEntries.some(e => e.category === "pilze")).toBe(false);
    // Beeren bleiben drin – dort geht es nicht um tödliche Doppelgänger
    expect(quizEntries.some(e => e.category === "beeren")).toBe(true);
    expect(quizEntries.length).toBe(natureEntries.length - mushrooms.length);
  });
});
