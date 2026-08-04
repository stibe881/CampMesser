import { describe, expect, it } from "vitest";
import { LANGUAGES } from "@shared/i18n";
import {
  DRILL_DUE_DAYS,
  DRILL_SCENARIOS,
  drillDue,
  drillsForAge,
  dueCount,
} from "@shared/emergencyDrill";

const TAG_MS = 24 * 60 * 60 * 1000;
const JETZT = Date.UTC(2026, 7, 4, 12, 0);

describe("Notfall-Übung für Kinder", () => {
  it("zeigt jüngeren Kindern nur, was sie verstehen können", () => {
    const fuerVier = drillsForAge(4);
    const fuerZehn = drillsForAge(10);
    expect(fuerVier.length).toBeGreaterThan(0);
    expect(fuerZehn.length).toBeGreaterThan(fuerVier.length);
    fuerVier.forEach(s => expect(s.minAge).toBeLessThanOrEqual(4));
  });

  it("hat für die Kleinsten den wichtigsten Fall dabei", () => {
    // «Ich finde den Platz nicht mehr» ist der häufigste – und muss für
    // Vierjährige dabei sein, sonst nützt die Übung nichts
    expect(drillsForAge(4).map(s => s.id)).toContain("platz-verloren");
  });

  it("hält «stehen bleiben» überall an die erste Stelle", () => {
    // Weiterlaufen vergrössert den Abstand – deshalb ist die Reihenfolge
    // der Schritte selbst der Inhalt
    const stehen = DRILL_SCENARIOS.filter(s =>
      ["platz-verloren", "verlaufen-wald"].includes(s.id)
    );
    stehen.forEach(s => {
      expect(s.steps[0].de.toLowerCase()).toContain("stehen bleiben");
    });
  });

  it("zählt eine nie geübte Übung als fällig", () => {
    expect(drillDue(null, JETZT)).toBe(true);
  });

  it("macht eine Übung nach einem halben Jahr wieder fällig", () => {
    const gestern = JETZT - TAG_MS;
    expect(drillDue(gestern, JETZT)).toBe(false);
    const langHer = JETZT - (DRILL_DUE_DAYS + 1) * TAG_MS;
    expect(drillDue(langHer, JETZT)).toBe(true);
    // Genau am Stichtag noch nicht
    expect(drillDue(JETZT - DRILL_DUE_DAYS * TAG_MS, JETZT)).toBe(false);
  });

  it("zählt die noch fälligen Übungen", () => {
    const scenarios = drillsForAge(8);
    expect(dueCount(scenarios, {}, JETZT)).toBe(scenarios.length);
    const alleGeuebt = Object.fromEntries(
      scenarios.map(s => [s.id, JETZT - TAG_MS])
    );
    expect(dueCount(scenarios, alleGeuebt, JETZT)).toBe(0);
    const eineAlt = { ...alleGeuebt, [scenarios[0].id]: JETZT - 300 * TAG_MS };
    expect(dueCount(scenarios, eineAlt, JETZT)).toBe(1);
  });

  it("hat zu jeder Übung eine beantwortbare Kontrollfrage", () => {
    DRILL_SCENARIOS.forEach(s => {
      expect(s.answers.length, s.id).toBeGreaterThanOrEqual(2);
      expect(s.correct, s.id).toBeGreaterThanOrEqual(0);
      expect(s.correct, s.id).toBeLessThan(s.answers.length);
      // Ohne Begründung lernt niemand etwas
      expect(s.explain.de.length, s.id).toBeGreaterThan(20);
    });
  });

  it("sagt zu jeder Übung, was man NICHT tut", () => {
    // Oft der wichtigere Teil – «nicht hinterherschwimmen» rettet Leben
    DRILL_SCENARIOS.forEach(s => {
      expect(s.mistakes.length, s.id).toBeGreaterThan(0);
      expect(s.steps.length, s.id).toBeGreaterThanOrEqual(3);
    });
  });

  it("gibt zu jeder Übung an, wie man sie am Platz durchspielt", () => {
    DRILL_SCENARIOS.forEach(s =>
      expect(s.practice.de.length, s.id).toBeGreaterThan(30)
    );
  });

  it("beschreibt alles in allen vier Sprachen", () => {
    DRILL_SCENARIOS.forEach(s => {
      LANGUAGES.forEach(lang => {
        expect(s.title[lang]?.trim().length, s.id).toBeGreaterThan(0);
        expect(s.situation[lang]?.trim().length, s.id).toBeGreaterThan(0);
        expect(s.question[lang]?.trim().length, s.id).toBeGreaterThan(0);
        expect(s.explain[lang]?.trim().length, s.id).toBeGreaterThan(0);
        expect(s.practice[lang]?.trim().length, s.id).toBeGreaterThan(0);
        s.steps.forEach(step =>
          expect(step[lang]?.trim().length, s.id).toBeGreaterThan(0)
        );
        s.mistakes.forEach(m =>
          expect(m[lang]?.trim().length, s.id).toBeGreaterThan(0)
        );
        s.answers.forEach(a =>
          expect(a[lang]?.trim().length, s.id).toBeGreaterThan(0)
        );
      });
    });
  });

  it("vergibt jede Id nur einmal", () => {
    const ids = DRILL_SCENARIOS.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
