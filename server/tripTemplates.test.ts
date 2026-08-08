import { describe, expect, it } from "vitest";
import {
  templateEndDate,
  templateListName,
  templateMenuPlan,
  tripTemplateById,
  tripTemplates,
} from "@shared/tripTemplates";
import { packScenarios } from "@shared/packTemplates";
import { TRIP_KINDS } from "@shared/tripKind";
import { recipes } from "../client/src/data/recipes";

describe("Reise-Vorlagen (#284)", () => {
  it("verweist nur auf Rezepte, die es wirklich gibt", () => {
    // Ein Tippfehler in einer Rezept-Id fiele sonst erst auf, wenn im
    // Menüplan ein leerer Slot steht
    const known = new Set(recipes.map(r => r.id));
    tripTemplates.forEach(template => {
      [...template.dinners, ...template.breakfasts].forEach(id => {
        expect(known.has(id), `${template.id}: ${id}`).toBe(true);
      });
    });
  });

  it("verweist nur auf Packlisten-Szenarien, die es gibt", () => {
    const known = new Set(packScenarios.map(s => s.id));
    tripTemplates.forEach(template => {
      expect(known.has(template.packScenario), template.id).toBe(true);
    });
  });

  it("rechnet den Abreisetag aus den Nächten", () => {
    // Wochenende: Freitag an, Sonntag ab
    expect(templateEndDate("2026-06-12", 2)).toBe("2026-06-14");
    expect(templateEndDate("2026-07-25", 14)).toBe("2026-08-08");
    // Monatswechsel und Schaltjahr
    expect(templateEndDate("2028-02-27", 2)).toBe("2028-02-29");
  });

  it("plant Abendessen für jede Nacht, aber keines am Abreisetag", () => {
    const template = tripTemplateById("wochenende")!;
    const plan = templateMenuPlan(template, "2026-06-12");
    const dinners = plan.filter(e => e.meal === "dinner");
    expect(dinners).toHaveLength(2);
    expect(dinners[0].day).toBe("2026-06-12");
    expect(dinners[1].day).toBe("2026-06-13");
    // Am Abreisetag isst man nicht mehr auf dem Platz zu Abend
    expect(dinners.some(d => d.day === "2026-06-14")).toBe(false);
  });

  it("plant Frühstück ab dem zweiten Tag – auch am Abreisemorgen", () => {
    const template = tripTemplateById("wochenende")!;
    const plan = templateMenuPlan(template, "2026-06-12");
    const breakfasts = plan.filter(e => e.meal === "breakfast");
    expect(breakfasts).toHaveLength(2);
    // Am Anreisetag ist man morgens noch daheim
    expect(breakfasts.some(b => b.day === "2026-06-12")).toBe(false);
    expect(breakfasts[0].day).toBe("2026-06-13");
    // Der Abreisemorgen ist der hungrigste – er bleibt nicht leer
    expect(breakfasts[1].day).toBe("2026-06-14");
  });

  it("füllt Mittagessen bewusst nicht", () => {
    const plan = templateMenuPlan(tripTemplateById("woche")!, "2026-06-12");
    expect(plan.some(e => e.meal !== "dinner" && e.meal !== "breakfast")).toBe(
      false
    );
  });

  it("wiederholt kürzere Rezept-Listen, statt Tage leer zu lassen", () => {
    const template = tripTemplateById("sommerferien")!;
    const plan = templateMenuPlan(template, "2026-07-25");
    expect(plan.filter(e => e.meal === "dinner")).toHaveLength(14);
    expect(plan.filter(e => e.meal === "breakfast")).toHaveLength(14);
    // Die sechs Frühstücke reichen für vierzehn Morgen nur im Umlauf
    const first = plan.filter(e => e.meal === "breakfast")[0];
    const seventh = plan.filter(e => e.meal === "breakfast")[6];
    expect(seventh.recipeId).toBe(first.recipeId);
  });

  it("gibt jeder Vorlage einen eindeutigen Schlüssel", () => {
    const ids = tripTemplates.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(tripTemplateById("gibtsnicht")).toBeUndefined();
  });

  it("schlägt einen Listennamen mit Datum vor", () => {
    expect(templateListName("Wochenende", "2026-06-12")).toBe(
      "Wochenende 12.06."
    );
  });
});

describe("Reise-Art der Vorlagen (#463)", () => {
  it("gibt jeder Vorlage eine gültige Art", () => {
    tripTemplates.forEach(template => {
      expect(TRIP_KINDS, template.id).toContain(template.kind);
    });
  });

  it("deckt neben Camping auch Stadt, Strand und Wandern ab", () => {
    const kinds = new Set(tripTemplates.map(t => t.kind));
    expect(kinds.has("camping")).toBe(true);
    expect(kinds.has("staedte")).toBe(true);
    expect(kinds.has("strand")).toBe(true);
    expect(kinds.has("wandern")).toBe(true);
  });

  it("plant für den Städtetrip bewusst KEIN Essen – dort isst man auswärts", () => {
    const template = tripTemplateById("staedtetrip")!;
    expect(template.dinners).toEqual([]);
    expect(templateMenuPlan(template, "2026-08-10")).toEqual([]);
  });
});
