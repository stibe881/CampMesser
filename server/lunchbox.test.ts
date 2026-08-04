import { describe, expect, it } from "vitest";
import {
  BOTTLE_ML,
  HOT_DAY_C,
  LUNCH_ITEMS,
  lunchboxPlan,
  type LunchboxInput,
} from "@shared/lunchbox";

const BASIS: LunchboxInput = {
  adults: 2,
  children: 2,
  length: "ganztag",
  effort: "wandern",
  temperatureC: 18,
  coolPack: true,
};

function ids(list: { item: { id: string } }[]): string[] {
  return list.map(entry => entry.item.id);
}

describe("Znüni- & Lunchbox-Planer", () => {
  it("rechnet mehr Wasser für längere und anstrengendere Tage", () => {
    const kurz = lunchboxPlan({ ...BASIS, length: "halbtag" });
    const lang = lunchboxPlan({ ...BASIS, length: "langertag" });
    expect(lang.waterMl).toBeGreaterThan(kurz.waterMl);

    const gemuetlich = lunchboxPlan({ ...BASIS, effort: "gemuetlich" });
    const anstrengend = lunchboxPlan({ ...BASIS, effort: "anstrengend" });
    expect(anstrengend.waterMl).toBeGreaterThan(gemuetlich.waterMl);
  });

  it("rechnet an heissen Tagen deutlich mehr Wasser", () => {
    const mild = lunchboxPlan({ ...BASIS, temperatureC: HOT_DAY_C - 1 });
    const heiss = lunchboxPlan({ ...BASIS, temperatureC: HOT_DAY_C });
    expect(heiss.waterMl).toBeGreaterThan(mild.waterMl);
    expect(heiss.hot).toBe(true);
    expect(mild.hot).toBe(false);
  });

  it("rundet auf ganze Flaschen auf – eine halbe kann man nicht mitnehmen", () => {
    const plan = lunchboxPlan(BASIS);
    expect(plan.bottles).toBe(Math.ceil(plan.waterMl / BOTTLE_ML));
    expect(plan.bottles * BOTTLE_ML).toBeGreaterThanOrEqual(plan.waterMl);
  });

  it("lässt ohne Kühlakku alles weg, was gekühlt gehört", () => {
    const plan = lunchboxPlan({ ...BASIS, coolPack: false });
    const gekuehlt = LUNCH_ITEMS.filter(i => i.needsCooling).map(i => i.id);
    const vorgeschlagen = [...ids(plan.znueni), ...ids(plan.mittag)];
    gekuehlt.forEach(id => expect(vorgeschlagen).not.toContain(id));
    // Und sagt auch, warum
    expect(plan.reminders.length).toBeGreaterThan(3);
  });

  it("schickt keine Schokolade in die Hitze", () => {
    const heiss = lunchboxPlan({ ...BASIS, temperatureC: 30 });
    expect(ids(heiss.znueni)).not.toContain("schokolade");
    // Bei 18 Grad darf sie mit
    const mild = lunchboxPlan({ ...BASIS, temperatureC: 18 });
    expect(mild.znueni.length).toBeGreaterThan(0);
  });

  it("bevorzugt an heissen Tagen Salziges", () => {
    const heiss = lunchboxPlan({
      ...BASIS,
      temperatureC: 30,
      effort: "gemuetlich",
    });
    const erste = heiss.znueni[0].item;
    expect(erste.salty).toBe(true);
  });

  it("bevorzugt bei Anstrengung, was schnell Energie gibt", () => {
    const plan = lunchboxPlan({
      ...BASIS,
      effort: "anstrengend",
      children: 0,
      temperatureC: 15,
    });
    const oben = plan.znueni.slice(0, 2);
    expect(oben.some(entry => entry.item.energyDense)).toBe(true);
  });

  it("gibt bei einem halben Tag kein Mittagessen aus", () => {
    const plan = lunchboxPlan({ ...BASIS, length: "halbtag" });
    expect(plan.mittag).toEqual([]);
    expect(plan.znueni.length).toBeGreaterThan(0);
  });

  it("liefert für denselben Tag denselben Vorschlag", () => {
    // Ein Planer, der bei jedem Öffnen etwas anderes sagt, ist keiner
    const a = lunchboxPlan(BASIS);
    const b = lunchboxPlan(BASIS);
    expect(ids(a.znueni)).toEqual(ids(b.znueni));
    expect(ids(a.mittag)).toEqual(ids(b.mittag));
  });

  it("erinnert an eine Flasche pro Kind – aber nur mit Kindern", () => {
    const mitKind = lunchboxPlan(BASIS);
    const ohneKind = lunchboxPlan({ ...BASIS, children: 0 });
    expect(mitKind.reminders.length).toBeGreaterThan(ohneKind.reminders.length);
  });

  it("kommt mit null Personen zurecht", () => {
    const plan = lunchboxPlan({ ...BASIS, adults: 0, children: 0 });
    expect(plan.waterMl).toBe(0);
    expect(plan.bottles).toBe(0);
    expect(plan.znueni).toEqual([]);
    expect(plan.mittag).toEqual([]);
  });

  it("rechnet für Kinder kleinere Portionen als für Erwachsene", () => {
    const zweiErwachsene = lunchboxPlan({ ...BASIS, adults: 2, children: 0 });
    const zweiKinder = lunchboxPlan({ ...BASIS, adults: 0, children: 2 });
    expect(zweiKinder.waterMl).toBeLessThan(zweiErwachsene.waterMl);
  });
});
