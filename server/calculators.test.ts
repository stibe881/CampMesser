import { describe, expect, it } from "vitest";
import {
  analyzePack,
  calcWaterNeeds,
  transportProfiles,
} from "../shared/calculators";
import { familyAddOns, packScenarios } from "../shared/packTemplates";

describe("calcWaterNeeds", () => {
  it("berechnet Basisbedarf bei mildem Wetter", () => {
    const result = calcWaterNeeds({
      adults: 2,
      children: 0,
      days: 2,
      maxTempC: 18,
      activity: "ruhig",
      includeCookingHygiene: false,
    });
    // 2 Erwachsene × 2 l × 2 Tage = 8 l, +20 % Reserve = 9.6 → 10
    expect(result.totalDrinkingLiters).toBe(8);
    expect(result.recommendedLiters).toBe(10);
  });

  it("erhöht den Bedarf bei Hitze und Aktivität", () => {
    const cool = calcWaterNeeds({
      adults: 1,
      children: 0,
      days: 1,
      maxTempC: 20,
      activity: "ruhig",
      includeCookingHygiene: false,
    });
    const hot = calcWaterNeeds({
      adults: 1,
      children: 0,
      days: 1,
      maxTempC: 35,
      activity: "aktiv",
      includeCookingHygiene: false,
    });
    expect(hot.totalLiters).toBeGreaterThan(cool.totalLiters);
    // 35 °C → 3 Stufen à 0.5 = 1.5 Zuschlag, aktiv +1 → 4.5 l
    expect(hot.drinkingLitersPerAdult).toBeCloseTo(4.5);
  });

  it("rechnet Kochen und Abwasch für alle Personen ein", () => {
    const result = calcWaterNeeds({
      adults: 2,
      children: 2,
      days: 3,
      maxTempC: 20,
      activity: "normal",
      includeCookingHygiene: true,
    });
    expect(result.cookingHygieneLiters).toBe(4 * 1.5 * 3); // 18
  });
});

describe("analyzePack", () => {
  const motorrad = transportProfiles.find(p => p.id === "motorrad")!;

  it("summiert Gewicht und Volumen inkl. Menge", () => {
    const analysis = analyzePack(
      [
        {
          name: "Zelt",
          weightGrams: 3000,
          volumeLiters: 10,
          quantity: 1,
          category: "Schlafen",
        },
        {
          name: "Schlafsack",
          weightGrams: 1000,
          volumeLiters: 8,
          quantity: 2,
          category: "Schlafen",
        },
      ],
      motorrad
    );
    expect(analysis.totalWeightKg).toBeCloseTo(5);
    expect(analysis.totalVolumeLiters).toBeCloseTo(26);
  });

  it("warnt bei Überschreitung des Limits", () => {
    const analysis = analyzePack(
      [
        {
          name: "Kiste",
          weightGrams: 40000,
          volumeLiters: 120,
          quantity: 1,
          category: "Sonstiges",
        },
      ],
      motorrad
    );
    expect(analysis.weightPercent).toBeGreaterThan(100);
    expect(analysis.hints.some(h => h.includes("überschritten"))).toBe(true);
  });
});

describe("packScenarios", () => {
  it("enthält die drei geforderten Szenarien plus eigene Liste", () => {
    const ids = packScenarios.map(s => s.id);
    expect(ids).toContain("solo");
    expect(ids).toContain("familie");
    expect(ids).toContain("motorrad");
    expect(ids).toContain("custom");
  });

  it("enthält die Szenarien der neuen Reise-Arten (#468)", () => {
    const ids = packScenarios.map(s => s.id);
    expect(ids).toContain("staedtereise");
    expect(ids).toContain("strand");
    expect(ids).toContain("wintersport");
    // Nicht-Camping-Szenarien tragen bewusst kein Zelt auf der Liste.
    for (const id of ["staedtereise", "strand", "wintersport"]) {
      const scenario = packScenarios.find(s => s.id === id)!;
      expect(scenario.items.some(i => i.name.de.includes("Zelt"))).toBe(false);
    }
  });

  it("liefert für jedes Szenario ausser custom Einträge", () => {
    for (const s of packScenarios) {
      if (s.id === "custom") {
        expect(s.items).toHaveLength(0);
      } else {
        expect(s.items.length).toBeGreaterThan(10);
      }
    }
  });

  it("bietet Familien-Zusatzpakete mit Kindersicherheit und Apotheke", () => {
    const ids = familyAddOns.map(a => a.id);
    expect(ids).toContain("kindersicherheit");
    expect(ids).toContain("reiseapotheke-kinder");
    for (const addOn of familyAddOns) {
      expect(addOn.items.length).toBeGreaterThan(4);
    }
  });
});
