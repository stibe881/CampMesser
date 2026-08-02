import { describe, expect, it } from "vitest";
// Suchindex liegt im Client-Code, ist aber reine Logik ohne DOM.
import {
  searchKnowledge,
  searchOwnContent,
  type OwnContent,
} from "../client/src/lib/globalSearch";

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

describe("searchOwnContent", () => {
  const own: OwnContent = {
    packLists: [
      { id: 3, name: "Sommerferien Tessin" },
      { id: 7, name: "Wochenende Jura" },
    ],
    spots: [
      { id: 12, name: "Camping Aareufer", note: "Schattiger Platz am Fluss" },
      { id: 15, name: "TCS Sion", note: null },
    ],
    recipes: [{ id: 4, name: "Grosis Älplermagronen" }],
    hunts: [{ id: 9, title: "Piraten-Schatzsuche" }],
    quizzes: [{ id: 2, title: "Vogelstimmen-Quiz" }],
    tentTargets: [{ id: "abc-123", name: "Duschen" }],
  };

  it("findet Packlisten über den Namen und verlinkt aufs Detail", () => {
    const results = searchOwnContent("tessin", own);
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      module: "own",
      path: "/packlisten/3",
      title: "Sommerferien Tessin",
    });
  });

  it("findet Zeltplätze über Name und Notiz", () => {
    expect(searchOwnContent("aareufer", own)[0]?.path).toBe("/zeltplaetze/12");
    const viaNote = searchOwnContent("schattiger fluss", own);
    expect(viaNote[0]?.path).toBe("/zeltplaetze/12");
  });

  it("findet Rezepte, Jagden und Quizze über den Titel", () => {
    expect(searchOwnContent("älplermagronen", own)[0]?.path).toBe("/rezepte");
    expect(searchOwnContent("piraten", own)[0]?.path).toBe("/familie");
    expect(searchOwnContent("vogelstimmen", own)[0]?.path).toBe("/familie");
  });

  it("verlinkt Zelt-Finder-Ziele mit ?target=<id>", () => {
    const results = searchOwnContent("duschen", own);
    expect(results[0]?.path).toBe("/zeltfinder?target=abc-123");
  });

  it("faltet Umlaute auch bei Nutzertexten", () => {
    expect(searchOwnContent("alplermagronen", own)[0]?.path).toBe("/rezepte");
  });

  it("gewichtet Titel-Anfangs-Treffer höher als Wort-im-Titel", () => {
    const results = searchOwnContent("camping", {
      packLists: [{ id: 1, name: "Herbst-Camping" }],
      spots: [{ id: 2, name: "Camping Aareufer", note: null }],
    });
    expect(results[0]?.path).toBe("/zeltplaetze/2");
  });

  it("verlangt alle Suchwörter und liefert sonst nichts", () => {
    expect(searchOwnContent("tessin duschen", own)).toEqual([]);
    expect(searchOwnContent("", own)).toEqual([]);
  });

  it("kommt mit fehlenden/leeren Listen zurecht", () => {
    expect(searchOwnContent("tessin", {})).toEqual([]);
    expect(searchOwnContent("tessin", { packLists: [] })).toEqual([]);
  });

  it("respektiert das Limit", () => {
    const many: OwnContent = {
      packLists: Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `Liste ${i + 1}`,
      })),
    };
    expect(searchOwnContent("liste", many, 4)).toHaveLength(4);
  });
});
