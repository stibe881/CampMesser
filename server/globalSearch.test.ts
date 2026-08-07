import { beforeAll, describe, expect, it, vi } from "vitest";
// Suchindex liegt im Client-Code, ist aber reine Logik ohne DOM.
import {
  ensureKnowledgeIndex,
  fuzzyWordMatch,
  isKnowledgeIndexReady,
  levenshtein,
  searchKnowledge,
  searchOwnContent,
  type OwnContent,
} from "../client/src/lib/globalSearch";

// Die Wissensdaten hängen seit dem Bundle-Umbau an einem dynamischen Import
// und müssen vor den Suchtests einmal geholt werden – genau so, wie es die
// Oberfläche beim ersten Fokus aufs Suchfeld tut.
beforeAll(async () => {
  await ensureKnowledgeIndex("de");
});

describe("levenshtein", () => {
  it("misst die Editier-Distanz korrekt", () => {
    expect(levenshtein("palstek", "palstek", 2)).toBe(0);
    expect(levenshtein("palstck", "palstek", 2)).toBe(1);
    expect(levenshtein("zeltplaz", "zeltplatz", 2)).toBe(1);
    expect(levenshtein("kitten", "sitting", 3)).toBe(3);
    expect(levenshtein("", "abc", 3)).toBe(3);
  });

  it("bricht oberhalb der Schwelle früh ab (max + 1)", () => {
    expect(levenshtein("abc", "xyz", 1)).toBe(2);
    expect(levenshtein("kurz", "vielviellaenger", 2)).toBe(3);
    expect(levenshtein("palsxyz", "palstek", 2)).toBe(3);
  });
});

describe("fuzzyWordMatch", () => {
  it("vergleicht gegen die Wörter des Ziels, nicht den ganzen Text", () => {
    expect(fuzzyWordMatch("palstck", "der palstek haelt sicher")).toBe(true);
    expect(fuzzyWordMatch("zeltplaz", "zeltplatz-favoriten")).toBe(true);
    expect(fuzzyWordMatch("mastwurf", "der palstek haelt sicher")).toBe(false);
  });

  it("erlaubt 1 Tippfehler ab 4 Zeichen und 2 ab 8 Zeichen", () => {
    expect(fuzzyWordMatch("knotn", "knoten lernen")).toBe(true);
    expect(fuzzyWordMatch("zeltplayz", "zeltplatz")).toBe(true);
    // unter 4 Zeichen keine Toleranz
    expect(fuzzyWordMatch("zek", "zeh")).toBe(false);
    // Distanz 2 bei nur 7 Zeichen → kein Treffer
    expect(fuzzyWordMatch("pilstik", "palstek")).toBe(false);
  });
});

describe("Wissens-Index nachladen", () => {
  it("liefert ohne geladenen Index nichts statt zu blockieren", async () => {
    // Frische Modul-Instanz: der Index-Cache ist darin noch leer.
    vi.resetModules();
    const fresh = await import("../client/src/lib/globalSearch");
    expect(fresh.isKnowledgeIndexReady("de")).toBe(false);
    expect(fresh.searchKnowledge("zecke")).toEqual([]);
    // Eigene Inhalte sind davon unberührt und sofort durchsuchbar.
    expect(
      fresh.searchOwnContent("seeblick", {
        spots: [{ id: 1, name: "Seeblick" }],
      }).length
    ).toBe(1);
    await fresh.ensureKnowledgeIndex("de");
    expect(fresh.isKnowledgeIndexReady("de")).toBe(true);
    expect(fresh.searchKnowledge("zecke").length).toBeGreaterThan(0);
  });

  it("baut den Index pro Sprache getrennt auf", async () => {
    await ensureKnowledgeIndex("fr");
    expect(isKnowledgeIndexReady("fr")).toBe(true);
    expect(searchKnowledge("tique", 5, "fr").length).toBeGreaterThan(0);
  });
});

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
    // Modul heisst inzwischen «Meine Reisen» (Route /tagebuch bleibt)
    const trips = searchKnowledge("reisen");
    expect(trips.some(r => r.path === "/tagebuch")).toBe(true);
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

  it("toleriert Tippfehler: «Palstck» findet den Palstek", () => {
    const results = searchKnowledge("Palstck");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toBe("Palstek");
    expect(results[0].module).toBe("knots");
  });

  // Seit #403 heisst die Kachel «Campingplätze» – der alte Suchbegriff
  // «Zeltplatz» muss trotzdem hinführen (steht dafür in der Beschreibung).
  it("toleriert Tippfehler: «Zeltplaz» findet die Campingplätze", () => {
    const results = searchKnowledge("Zeltplaz");
    expect(results.some(r => r.path === "/zeltplaetze")).toBe(true);
  });

  it("rankt Tippfehler-Treffer nach exakten Treffern", () => {
    // Bei gemischten Ergebnismengen gewinnt der exakte Teilstring-Treffer:
    // eigener Inhalt «Zeltplatz» (fuzzy zu «zeltplaz») vs. «Zeltplaz» (exakt).
    const results = searchOwnContent("zeltplaz", {
      spots: [
        { id: 1, name: "Zeltplatz Aare", note: null },
        { id: 2, name: "Zeltplaz-Wiese", note: null },
      ],
    });
    expect(results.map(r => r.path)).toEqual([
      "/zeltplaetze/2",
      "/zeltplaetze/1",
    ]);
  });

  it("findet nichts bei Distanz 3", () => {
    expect(searchKnowledge("Palsxyz")).toEqual([]);
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

describe("searchOwnContent: Ausrüstung, Kisten, Vorräte, Aufenthalte", () => {
  it("findet einen Gegenstand und nennt die Kiste im Snippet", () => {
    // Der eigentliche Zweck: «Wo ist die Stirnlampe?» soll die Kiste nennen,
    // ohne dass man den Treffer erst öffnen muss.
    const results = searchOwnContent("stirnlampe", {
      inventory: [
        {
          id: 4,
          name: "Stirnlampe",
          category: "licht",
          boxCode: "K3",
          boxName: "Küchenkiste",
        },
      ],
    });
    expect(results).toHaveLength(1);
    expect(results[0].path).toBe("/inventar");
    expect(results[0].snippet).toContain("K3");
    expect(results[0].snippet).toContain("Küchenkiste");
  });

  it("findet den Gegenstand auch über den Namen der Kiste", () => {
    const results = searchOwnContent("küchenkiste", {
      inventory: [
        { id: 4, name: "Stirnlampe", boxCode: "K3", boxName: "Küchenkiste" },
      ],
    });
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Stirnlampe");
  });

  it("findet Kisten über Kennung, Name und Standort", () => {
    const boxes = [
      { id: 1, code: "K3", name: "Küchenkiste", location: "Keller" },
    ];
    expect(searchOwnContent("k3", { boxes })).toHaveLength(1);
    expect(searchOwnContent("keller", { boxes })).toHaveLength(1);
    expect(searchOwnContent("k3", { boxes })[0].path).toBe("/kisten/K3");
  });

  it("unterscheidet Kühlbox und Trockenvorrat im Snippet", () => {
    const cooled = searchOwnContent("butter", {
      food: [{ id: 1, name: "Butter", storage: "cooled" }],
    });
    const dry = searchOwnContent("reis", {
      food: [{ id: 2, name: "Reis", storage: "dry" }],
    });
    expect(cooled[0].snippet).toContain("Kühlbox");
    expect(dry[0].snippet).toContain("Trockenvorrat");
  });

  it("findet Aufenthalte über Titel und über den Ort", () => {
    const trips = [
      {
        id: 7,
        title: "Herbstferien",
        location: "Bern",
        spotName: "Seeblick",
        startDate: "2026-10-05",
      },
    ];
    expect(searchOwnContent("herbstferien", { trips })[0].path).toBe(
      "/tagebuch/7"
    );
    expect(searchOwnContent("seeblick", { trips })).toHaveLength(1);
  });

  it("überspringt Aufenthalte ganz ohne Namen", () => {
    // Ein Treffer ohne Beschriftung wäre eine leere Zeile in der Liste.
    expect(
      searchOwnContent("2026", { trips: [{ id: 8, startDate: "2026-10-05" }] })
    ).toEqual([]);
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

  // Freie Notizen (#246) – eigene Fixture, damit die Treffer der übrigen
  // Tests unverändert bleiben.
  const withNotes: OwnContent = {
    notes: [
      {
        id: 5,
        title: "Platzwart Aareufer",
        text: "Telefon 079 123 45 67, ab 8 Uhr erreichbar",
        tags: "Kontakt,Aare",
      },
      { id: 6, title: null, text: "Heringszieher nachkaufen", tags: null },
    ],
  };

  it("findet Notizen über Titel, Text und Stichwörter", () => {
    expect(searchOwnContent("platzwart", withNotes)[0]?.path).toBe("/notizen");
    expect(searchOwnContent("erreichbar", withNotes)[0]?.id).toBe("own-note-5");
    expect(searchOwnContent("kontakt", withNotes)[0]?.id).toBe("own-note-5");
  });

  it("nimmt bei einer Notiz ohne Titel die erste Textzeile", () => {
    expect(searchOwnContent("heringszieher", withNotes)[0]?.title).toBe(
      "Heringszieher nachkaufen"
    );
  });

  it("kommt mit Notizen ohne Stichwörter zurecht", () => {
    expect(searchOwnContent("nachkaufen", withNotes)).toHaveLength(1);
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
