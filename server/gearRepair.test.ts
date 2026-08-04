import { describe, expect, it } from "vitest";
import { gearRepairGuides } from "../client/src/data/gearRepair";
import { tentCareGuides } from "../client/src/data/tentCare";
import { LANGUAGES, pick } from "@shared/i18n";

describe("Reparatur-Ratgeber Ausrüstung (#266)", () => {
  it("deckt die drei genannten Reparaturen und die weiteren Ausfall-Klassiker ab", () => {
    const ids = gearRepairGuides.map(g => g.id);
    for (const id of [
      "matte",
      "gestaenge",
      "kocher",
      "schlafsack",
      "regenjacke",
      "lampen",
      "rucksack",
    ]) {
      expect(ids).toContain(id);
    }
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("teilt sich die Form mit der Zeltpflege, ohne Ids zu doppeln", () => {
    // Beide Ratgeber laufen durch dasselbe Bauteil – die Suche baut die
    // Schlüssel deshalb mit Präfix, die Ids selbst dürfen sich überschneiden
    for (const guide of gearRepairGuides) {
      expect(guide.materials.length).toBeGreaterThanOrEqual(2);
      expect(guide.steps.length).toBeGreaterThanOrEqual(3);
    }
    expect(tentCareGuides.length).toBeGreaterThan(0);
  });

  it("jede Anleitung ist in vier Sprachen vollständig", () => {
    for (const guide of gearRepairGuides) {
      for (const lang of LANGUAGES) {
        expect(pick(guide.title, lang).length).toBeGreaterThan(4);
        expect(pick(guide.summary, lang).length).toBeGreaterThan(50);
        expect(pick(guide.when, lang).length).toBeGreaterThan(40);
        expect(pick(guide.mistake, lang).length).toBeGreaterThan(80);
        for (const item of guide.materials) {
          expect(pick(item, lang).length).toBeGreaterThan(10);
        }
        for (const step of guide.steps) {
          expect(pick(step.title, lang).length).toBeGreaterThan(4);
          expect(pick(step.text, lang).length).toBeGreaterThan(60);
        }
      }
    }
  });

  it("Zeitangaben sind plausibel, Schäden haben kein Kalender-Intervall", () => {
    const byId = (id: string) => gearRepairGuides.find(g => g.id === id)!;
    for (const guide of gearRepairGuides) {
      expect(guide.minutes).toBeGreaterThan(0);
      expect(guide.minutes).toBeLessThanOrEqual(180);
    }
    // Ein Loch und ein Bruch kommen nicht nach Kalender
    expect(byId("matte").intervalMonths).toBeNull();
    expect(byId("gestaenge").intervalMonths).toBeNull();
    // Wartung dagegen schon
    expect(byId("kocher").intervalMonths).toBe(12);
    // Die Notreparatur am Platz muss schnell gehen
    expect(byId("gestaenge").minutes).toBeLessThanOrEqual(15);
  });

  it("verweist bei Gas jenseits von Dichtung und Düse auf den Fachbetrieb", () => {
    const stove = gearRepairGuides.find(g => g.id === "kocher")!;
    expect(pick(stove.mistake, "de")).toContain("Fachbetrieb");
    // Die Dichtheitsprüfung mit Seifenwasser gehört zwingend dazu
    const steps = stove.steps.map(s => pick(s.text, "de")).join(" ");
    expect(steps).toContain("Seifenwasser");
  });

  it("warnt bei der Matte vor dem Kleben im aufgeblasenen Zustand", () => {
    const mat = gearRepairGuides.find(g => g.id === "matte")!;
    expect(pick(mat.mistake, "de")).toMatch(/pralle|aufgeblasen/);
  });
});
