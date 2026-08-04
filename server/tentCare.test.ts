import { describe, expect, it } from "vitest";
import { tentCareGuides } from "../client/src/data/tentCare";
import { LANGUAGES, pick } from "@shared/i18n";

describe("Zeltpflege-Ratgeber (#265)", () => {
  it("deckt die vier gewünschten Arbeiten und den Rest der Saison ab", () => {
    const ids = tentCareGuides.map(g => g.id);
    for (const id of [
      "impraegnieren",
      "riss",
      "reissverschluss",
      "schimmel",
      "naehte",
      "reinigen",
      "trocknen-lagern",
    ]) {
      expect(ids).toContain(id);
    }
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("jede Anleitung nennt Anlass, Material, Schritte und den häufigsten Fehler", () => {
    for (const guide of tentCareGuides) {
      expect(guide.materials.length).toBeGreaterThanOrEqual(2);
      expect(guide.steps.length).toBeGreaterThanOrEqual(3);
      for (const lang of LANGUAGES) {
        expect(pick(guide.title, lang).length).toBeGreaterThan(4);
        expect(pick(guide.summary, lang).length).toBeGreaterThan(50);
        expect(pick(guide.when, lang).length).toBeGreaterThan(40);
        // Der Fehler ist der eigentliche Nutzen der Anleitung – nie ein Halbsatz
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

  it("Zeitangaben sind plausibel und Intervalle nur dort, wo sie Sinn ergeben", () => {
    for (const guide of tentCareGuides) {
      expect(guide.minutes).toBeGreaterThan(0);
      expect(guide.minutes).toBeLessThanOrEqual(180);
      if (guide.intervalMonths !== null) {
        expect(guide.intervalMonths).toBeGreaterThanOrEqual(1);
        expect(guide.intervalMonths).toBeLessThanOrEqual(60);
      }
    }
    const byId = (id: string) => tentCareGuides.find(g => g.id === id)!;
    // Ein Riss und Schimmel kommen nicht nach Kalender
    expect(byId("riss").intervalMonths).toBeNull();
    expect(byId("schimmel").intervalMonths).toBeNull();
    // Imprägnieren dagegen schon – gleiche Angabe wie im Pflege-Vorschlag
    expect(byId("impraegnieren").intervalMonths).toBe(24);
  });

  it("das Trocknen steht zuoberst, weil dort die meisten Zelte sterben", () => {
    expect(tentCareGuides[0].id).toBe("trocknen-lagern");
  });

  it("warnt vor den Klassikern: Waschmaschine, falsches Klebeband, Bleiche", () => {
    const byId = (id: string) => tentCareGuides.find(g => g.id === id)!;
    expect(pick(byId("reinigen").mistake, "de")).toContain("Waschmaschine");
    expect(pick(byId("riss").mistake, "de")).toMatch(/Klebeband|Isolierband/);
    expect(pick(byId("schimmel").steps[2].text, "de")).toContain(
      "Chlorbleiche"
    );
  });

  it("nennt beim Nahtdichter beide Beschichtungen, damit nichts verwechselt wird", () => {
    const seams = tentCareGuides.find(g => g.id === "naehte")!;
    const text = `${pick(seams.mistake, "de")} ${pick(seams.materials[0], "de")}`;
    expect(text).toContain("PU");
    expect(text).toMatch(/Silikon/);
  });
});
