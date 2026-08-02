import { describe, expect, it } from "vitest";
// Suchindex liegt im Client-Code, ist aber reine Logik ohne DOM.
import { searchKnowledge } from "../client/src/lib/globalSearch";

describe("searchKnowledge", () => {
  it("findet Erste-Hilfe-Themen über den Titel", () => {
    const results = searchKnowledge("zecke");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toBe("Zeckenbiss");
    expect(results[0].module).toBe("firstAid");
    expect(results[0].path).toBe("/erste-hilfe");
  });

  it("findet Knoten und Rezepte", () => {
    expect(searchKnowledge("mastwurf")[0]?.module).toBe("knots");
    const recipe = searchKnowledge("quesadilla");
    expect(recipe[0]?.module).toBe("recipes");
  });

  it("findet Natur-Einträge über den Inhalt", () => {
    const results = searchKnowledge("fuchs");
    expect(results.some(r => r.module === "nature")).toBe(true);
  });

  it("findet die Werkzeug-Module selbst", () => {
    const level = searchKnowledge("wasserwaage");
    expect(level[0]).toMatchObject({ module: "module", path: "/wasserwaage" });
    const diary = searchKnowledge("tagebuch");
    expect(diary.some(r => r.path === "/tagebuch")).toBe(true);
  });

  it("faltet Umlaute: «kase» findet dieselben Treffer wie «käse»", () => {
    const a = searchKnowledge("käse").map(r => r.id);
    const b = searchKnowledge("kase").map(r => r.id);
    expect(a.length).toBeGreaterThan(0);
    expect(b).toEqual(a);
  });

  it("verlangt alle Suchwörter und gewichtet Titel-Treffer höher", () => {
    const results = searchKnowledge("zecke haut");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toBe("Zeckenbiss");
    expect(searchKnowledge("zecke quesadilla")).toEqual([]);
  });

  it("liefert nichts für leere oder zu kurze Anfragen", () => {
    expect(searchKnowledge("")).toEqual([]);
    expect(searchKnowledge("a")).toEqual([]);
    expect(searchKnowledge("   ")).toEqual([]);
  });

  it("respektiert das Limit", () => {
    expect(searchKnowledge("und", 5).length).toBeLessThanOrEqual(5);
  });
});
