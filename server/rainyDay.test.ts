import { describe, expect, it } from "vitest";
import { LANGUAGES } from "@shared/i18n";
import {
  RAINY_IDEAS,
  SPACE_LABELS,
  SPACES,
  neededMaterials,
  rainyDayIdeas,
  type RainyFilter,
} from "@shared/rainyDay";

const BASIS: RainyFilter = {
  age: 8,
  minutes: 45,
  space: "vorzelt",
  quietOnly: false,
  together: true,
};

describe("Regentag-Ideen", () => {
  it("schlägt nichts vor, was nicht in den Platz passt", () => {
    // Im Zelt liegt man – was einen Tisch braucht, nützt dort nichts
    const imZelt = rainyDayIdeas({ ...BASIS, space: "zelt", minutes: 120 });
    expect(imZelt.length).toBeGreaterThan(0);
    imZelt.forEach(idea => expect(idea.space).toBe("zelt"));
  });

  it("lässt im grösseren Raum auch die kleineren Ideen zu", () => {
    const imRaum = rainyDayIdeas({ ...BASIS, space: "raum", minutes: 120 });
    const imZelt = rainyDayIdeas({ ...BASIS, space: "zelt", minutes: 120 });
    expect(imRaum.length).toBeGreaterThan(imZelt.length);
    imZelt.forEach(idea => expect(imRaum.map(i => i.id)).toContain(idea.id));
  });

  it("hält sich ans Alter", () => {
    const fuerDreijaehrige = rainyDayIdeas({
      ...BASIS,
      age: 3,
      minutes: 120,
      space: "raum",
    });
    fuerDreijaehrige.forEach(idea => {
      expect(idea.minAge).toBeLessThanOrEqual(3);
      expect(idea.maxAge).toBeGreaterThanOrEqual(3);
    });
    expect(fuerDreijaehrige.length).toBeGreaterThan(0);
  });

  it("lässt das Alter weg, wenn keines angegeben ist", () => {
    const alle = rainyDayIdeas({
      ...BASIS,
      age: null,
      minutes: 120,
      space: "raum",
    });
    expect(alle.length).toBe(RAINY_IDEAS.length);
  });

  it("gibt bei «leise» nur Leises aus", () => {
    const leise = rainyDayIdeas({
      ...BASIS,
      quietOnly: true,
      minutes: 120,
      space: "raum",
    });
    expect(leise.length).toBeGreaterThan(0);
    leise.forEach(idea => expect(idea.quiet).toBe(true));
  });

  it("lässt Spiele zu zweit weg, wenn nur einer da ist", () => {
    const allein = rainyDayIdeas({
      ...BASIS,
      together: false,
      minutes: 120,
      space: "raum",
    });
    allein.forEach(idea => expect(idea.together).not.toBe(true));
  });

  it("erlaubt etwas Spielraum bei der Dauer", () => {
    // Wer 40 Minuten überbrücken will, nimmt auch 45 – abbrechen geht immer
    const knapp = rainyDayIdeas({ ...BASIS, minutes: 40, space: "raum" });
    expect(knapp.some(idea => idea.minutes > 40)).toBe(true);
    // Aber nicht das Doppelte
    knapp.forEach(idea => expect(idea.minutes).toBeLessThanOrEqual(50));
  });

  it("stellt die längste passende Idee nach oben", () => {
    const ideen = rainyDayIdeas({ ...BASIS, minutes: 120, space: "raum" });
    for (let i = 1; i < ideen.length; i++) {
      expect(ideen[i - 1].minutes).toBeGreaterThanOrEqual(ideen[i].minutes);
    }
  });

  it("zählt das Material ohne Doppel auf", () => {
    const ideen = rainyDayIdeas({ ...BASIS, minutes: 120, space: "raum" });
    const material = neededMaterials(ideen);
    const namen = material.map(m => m.de);
    expect(new Set(namen).size).toBe(namen.length);
    // Papier und Stifte braucht mehr als eine Idee – trotzdem nur einmal
    expect(namen.filter(n => n.startsWith("Papier und Stifte"))).toHaveLength(
      1
    );
  });

  it("liefert auch im engsten Fall noch etwas", () => {
    // Zelt, leise, allein, zehn Minuten – der schlimmste Regentag
    const notfall = rainyDayIdeas({
      age: 5,
      minutes: 10,
      space: "zelt",
      quietOnly: true,
      together: false,
    });
    expect(notfall.length).toBeGreaterThan(0);
  });

  it("beschreibt jede Idee in allen vier Sprachen", () => {
    RAINY_IDEAS.forEach(idea => {
      LANGUAGES.forEach(lang => {
        expect(idea.title[lang]?.trim().length, idea.id).toBeGreaterThan(0);
        expect(idea.how[lang]?.trim().length, idea.id).toBeGreaterThan(0);
        idea.needs.forEach(need =>
          expect(need[lang]?.trim().length, idea.id).toBeGreaterThan(0)
        );
      });
      expect(idea.minAge).toBeLessThan(idea.maxAge);
      expect(idea.minutes).toBeGreaterThan(0);
    });
    SPACES.forEach(space => {
      LANGUAGES.forEach(lang =>
        expect(SPACE_LABELS[space][lang]?.trim().length).toBeGreaterThan(0)
      );
    });
  });

  it("vergibt jede Id nur einmal", () => {
    const ids = RAINY_IDEAS.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
