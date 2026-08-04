import { describe, expect, it } from "vitest";
import {
  FIRE_KINDS,
  KINDLING_KG_PER_FIRE,
  NET_WEIGHT_KG,
  eveningsFromStock,
  firewoodEstimate,
} from "@shared/firewood";

describe("Feuerholz-Bedarf (#287)", () => {
  it("rechnet Menge und Netze für eine typische Reise", () => {
    // 3 Abende Lagerfeuer à 3 h, Hartholz: 4,5 kg/h × 3 h × 3 = 40,5 kg
    // plus 1,5 kg Anzündholz = 42 kg → 5 Netze
    const estimate = firewoodEstimate({
      evenings: 3,
      hoursPerEvening: 3,
      kind: "lagerfeuer",
      wood: "hart",
    });
    expect(estimate.kgPerEvening).toBe(13.5);
    expect(estimate.totalKg).toBe(42);
    expect(estimate.kindlingKg).toBe(1.5);
    expect(estimate.nets).toBe(5);
  });

  it("rundet Netze immer auf – ein Netz zu wenig beendet den Abend", () => {
    const estimate = firewoodEstimate({
      evenings: 1,
      hoursPerEvening: 2,
      kind: "kochfeuer",
      wood: "hart",
    });
    // 4,5 kg → trotzdem ein ganzes Netz
    expect(estimate.totalKg).toBeLessThan(NET_WEIGHT_KG);
    expect(estimate.nets).toBe(1);
  });

  it("Weichholz braucht mehr Menge als Hartholz", () => {
    const base = {
      evenings: 4,
      hoursPerEvening: 3,
      kind: "lagerfeuer" as const,
    };
    const hart = firewoodEstimate({ ...base, wood: "hart" });
    const weich = firewoodEstimate({ ...base, wood: "weich" });
    const gemischt = firewoodEstimate({ ...base, wood: "gemischt" });
    expect(weich.totalKg).toBeGreaterThan(hart.totalKg);
    expect(gemischt.totalKg).toBeGreaterThan(hart.totalKg);
    expect(gemischt.totalKg).toBeLessThan(weich.totalKg);
  });

  it("unterscheidet die Feuerarten deutlich", () => {
    expect(FIRE_KINDS.kochfeuer.kgPerHour).toBeLessThan(
      FIRE_KINDS.lagerfeuer.kgPerHour
    );
    expect(FIRE_KINDS.lagerfeuer.kgPerHour).toBeLessThan(
      FIRE_KINDS.waermefeuer.kgPerHour
    );
    const koch = firewoodEstimate({
      evenings: 3,
      hoursPerEvening: 2,
      kind: "kochfeuer",
      wood: "hart",
    });
    const waerme = firewoodEstimate({
      evenings: 3,
      hoursPerEvening: 2,
      kind: "waermefeuer",
      wood: "hart",
    });
    expect(waerme.nets).toBeGreaterThan(koch.nets);
  });

  it("rechnet Anzündholz pro Feuer, nicht pro Reise", () => {
    const kurz = firewoodEstimate({
      evenings: 1,
      hoursPerEvening: 3,
      kind: "lagerfeuer",
      wood: "hart",
    });
    const lang = firewoodEstimate({
      evenings: 6,
      hoursPerEvening: 3,
      kind: "lagerfeuer",
      wood: "hart",
    });
    expect(kurz.kindlingKg).toBe(KINDLING_KG_PER_FIRE);
    expect(lang.kindlingKg).toBe(6 * KINDLING_KG_PER_FIRE);
  });

  it("liefert ohne Abende oder ohne Stunden gar nichts", () => {
    const leer = firewoodEstimate({
      evenings: 0,
      hoursPerEvening: 3,
      kind: "lagerfeuer",
      wood: "hart",
    });
    expect(leer.totalKg).toBe(0);
    expect(leer.nets).toBe(0);
    expect(
      firewoodEstimate({
        evenings: 3,
        hoursPerEvening: 0,
        kind: "lagerfeuer",
        wood: "hart",
      }).nets
    ).toBe(0);
  });

  it("sagt umgekehrt, wie weit ein Vorrat reicht", () => {
    // 30 kg, Lagerfeuer 3 h, Hartholz: 13,5 + 0,5 kg je Abend → 2 Abende
    expect(
      eveningsFromStock({
        stockKg: 30,
        hoursPerEvening: 3,
        kind: "lagerfeuer",
        wood: "hart",
      })
    ).toBe(2);
    // Ein halber Abend Feuer ist kein Abend Feuer
    expect(
      eveningsFromStock({
        stockKg: 10,
        hoursPerEvening: 3,
        kind: "lagerfeuer",
        wood: "hart",
      })
    ).toBe(0);
    expect(
      eveningsFromStock({
        stockKg: 0,
        hoursPerEvening: 3,
        kind: "lagerfeuer",
        wood: "hart",
      })
    ).toBe(0);
  });
});
