import { describe, expect, it } from "vitest";
import {
  NOTE_MAX_TAGS,
  NOTE_TAG_MAX_LENGTH,
  NOTE_TEXT_MAX_LENGTH,
  NOTE_TITLE_MAX_LENGTH,
  collectNoteTags,
  noteHasTag,
  noteMatchesQuery,
  normalizeNoteTags,
  normalizeNoteText,
  normalizeNoteTitle,
  parseNoteTags,
  serializeNoteTags,
  sortNotes,
} from "@shared/notes";

describe("normalizeNoteTags", () => {
  it("trennt kommagetrennten Text und trimmt", () => {
    expect(normalizeNoteTags(" Zelt , Tessin ,Sommer ")).toEqual([
      "Zelt",
      "Tessin",
      "Sommer",
    ]);
  });

  it("nimmt genauso eine Liste entgegen", () => {
    expect(normalizeNoteTags(["  Zelt ", "Tessin"])).toEqual([
      "Zelt",
      "Tessin",
    ]);
  });

  it("wirft leere Stichwörter weg", () => {
    expect(normalizeNoteTags(",,Zelt,, ,")).toEqual(["Zelt"]);
    expect(normalizeNoteTags("")).toEqual([]);
    expect(normalizeNoteTags("   ")).toEqual([]);
  });

  it("entdoppelt ohne Rücksicht auf Gross-/Kleinschreibung", () => {
    expect(normalizeNoteTags("Zelt,zelt,ZELT,Tessin")).toEqual([
      "Zelt",
      "Tessin",
    ]);
  });

  it("behält die Schreibweise des ersten Vorkommens", () => {
    expect(normalizeNoteTags("tessin,Tessin")).toEqual(["tessin"]);
    expect(normalizeNoteTags("Tessin,tessin")).toEqual(["Tessin"]);
  });

  it("zieht inneren Leerraum zusammen", () => {
    expect(normalizeNoteTags("  Camping   Tessin  ")).toEqual([
      "Camping Tessin",
    ]);
    // Nach dem Zusammenziehen sind beide Fassungen dasselbe Stichwort
    expect(normalizeNoteTags("Camping  Tessin,Camping Tessin")).toEqual([
      "Camping Tessin",
    ]);
  });

  it("kürzt zu lange Stichwörter", () => {
    const long = "a".repeat(NOTE_TAG_MAX_LENGTH + 10);
    expect(normalizeNoteTags(long)[0].length).toBe(NOTE_TAG_MAX_LENGTH);
  });

  it("begrenzt die Anzahl der Stichwörter", () => {
    const many = Array.from({ length: NOTE_MAX_TAGS + 5 }, (_, i) => `t${i}`);
    expect(normalizeNoteTags(many).length).toBe(NOTE_MAX_TAGS);
    expect(normalizeNoteTags(many)[0]).toBe("t0");
  });

  it("hält die gespeicherte Zeichenkette in der Spaltenbreite", () => {
    // NOTE_MAX_TAGS × NOTE_TAG_MAX_LENGTH plus Trennkommas muss in
    // varchar(300) passen – sonst schneidet die Datenbank stumm ab.
    const many = Array.from({ length: NOTE_MAX_TAGS + 5 }, (_, i) =>
      `${i}`.padEnd(NOTE_TAG_MAX_LENGTH, "x")
    );
    expect(serializeNoteTags(many).length).toBeLessThanOrEqual(300);
  });
});

describe("serializeNoteTags / parseNoteTags", () => {
  it("schreibt und liest dieselbe Liste", () => {
    const stored = serializeNoteTags([" Zelt ", "zelt", "Tessin"]);
    expect(stored).toBe("Zelt,Tessin");
    expect(parseNoteTags(stored)).toEqual(["Zelt", "Tessin"]);
  });

  it("verträgt null und leere Werte", () => {
    expect(parseNoteTags(null)).toEqual([]);
    expect(parseNoteTags(undefined)).toEqual([]);
    expect(parseNoteTags("")).toEqual([]);
    expect(serializeNoteTags([])).toBe("");
  });
});

describe("normalizeNoteTitle", () => {
  it("trimmt und zieht Leerraum zusammen", () => {
    expect(normalizeNoteTitle("  Ideen   fürs  Tessin ")).toBe(
      "Ideen fürs Tessin"
    );
  });

  it("macht aus leer null", () => {
    expect(normalizeNoteTitle("")).toBeNull();
    expect(normalizeNoteTitle("   ")).toBeNull();
    expect(normalizeNoteTitle(null)).toBeNull();
    expect(normalizeNoteTitle(undefined)).toBeNull();
  });

  it("kürzt zu lange Titel", () => {
    expect(
      normalizeNoteTitle("x".repeat(NOTE_TITLE_MAX_LENGTH + 20))
    ).toHaveLength(NOTE_TITLE_MAX_LENGTH);
  });
});

describe("normalizeNoteText", () => {
  it("vereinheitlicht Zeilenenden und trimmt", () => {
    expect(normalizeNoteText("  a\r\nb\rc  ")).toBe("a\nb\nc");
  });

  it("zieht mehr als zwei Leerzeilen zusammen", () => {
    expect(normalizeNoteText("oben\n\n\n\nunten")).toBe("oben\n\nunten");
  });

  it("kürzt auf die Höchstlänge", () => {
    expect(
      normalizeNoteText("x".repeat(NOTE_TEXT_MAX_LENGTH + 100))
    ).toHaveLength(NOTE_TEXT_MAX_LENGTH);
  });

  it("schneidet nur zwischen ganzen Code Points", () => {
    const text = "a".repeat(NOTE_TEXT_MAX_LENGTH - 1) + "🏕b";
    const cut = normalizeNoteText(text);
    expect(cut.endsWith("🏕")).toBe(true);
    expect(cut.includes("�")).toBe(false);
  });
});

describe("noteHasTag", () => {
  const note = { id: 1, text: "egal", tags: "Zelt,Tessin" };

  it("findet unabhängig von der Schreibweise", () => {
    expect(noteHasTag(note, "zelt")).toBe(true);
    expect(noteHasTag(note, " TESSIN ")).toBe(true);
  });

  it("meldet fehlende Stichwörter", () => {
    expect(noteHasTag(note, "Winter")).toBe(false);
    expect(noteHasTag(note, "")).toBe(false);
    expect(noteHasTag({ id: 2, text: "x", tags: null }, "Zelt")).toBe(false);
  });
});

describe("noteMatchesQuery", () => {
  const note = {
    id: 1,
    title: "Ideen fürs Tessin",
    text: "Bäume beim Fluss suchen",
    tags: "Sommer,Ferien",
  };

  it("sucht im Titel, im Text und in den Stichwörtern", () => {
    expect(noteMatchesQuery(note, "tessin")).toBe(true);
    expect(noteMatchesQuery(note, "fluss")).toBe(true);
    expect(noteMatchesQuery(note, "ferien")).toBe(true);
  });

  it("faltet Umlaute", () => {
    expect(noteMatchesQuery(note, "baume")).toBe(true);
    expect(noteMatchesQuery(note, "BÄUME")).toBe(true);
  });

  it("verlangt alle Suchwörter", () => {
    expect(noteMatchesQuery(note, "tessin ferien")).toBe(true);
    expect(noteMatchesQuery(note, "tessin winter")).toBe(false);
  });

  it("lässt eine leere Anfrage alles durch", () => {
    expect(noteMatchesQuery(note, "")).toBe(true);
    expect(noteMatchesQuery(note, "   ")).toBe(true);
  });

  it("kommt ohne Titel zurecht", () => {
    expect(
      noteMatchesQuery(
        { id: 2, title: null, text: "Heringe nachkaufen" },
        "hering"
      )
    ).toBe(true);
  });
});

describe("sortNotes", () => {
  it("stellt die zuletzt geänderte Notiz zuoberst", () => {
    const sorted = sortNotes([
      { id: 1, text: "a", updatedAt: "2026-08-01T10:00:00Z" },
      { id: 2, text: "b", updatedAt: "2026-08-03T10:00:00Z" },
      { id: 3, text: "c", updatedAt: "2026-08-02T10:00:00Z" },
    ]);
    expect(sorted.map(n => n.id)).toEqual([2, 3, 1]);
  });

  it("entscheidet bei gleichem Zeitstempel über die höhere Id", () => {
    const sorted = sortNotes([
      { id: 4, text: "a", updatedAt: "2026-08-03T10:00:00Z" },
      { id: 9, text: "b", updatedAt: "2026-08-03T10:00:00Z" },
    ]);
    expect(sorted.map(n => n.id)).toEqual([9, 4]);
  });

  it("behandelt fehlende und kaputte Zeitstempel als uralt", () => {
    const sorted = sortNotes([
      { id: 1, text: "a" },
      { id: 2, text: "b", updatedAt: "irgendwann" },
      { id: 3, text: "c", updatedAt: "2026-08-01T10:00:00Z" },
    ]);
    expect(sorted[0].id).toBe(3);
  });

  it("lässt die Eingabe unangetastet", () => {
    const input = [
      { id: 1, text: "a", updatedAt: "2026-08-01T10:00:00Z" },
      { id: 2, text: "b", updatedAt: "2026-08-03T10:00:00Z" },
    ];
    sortNotes(input);
    expect(input.map(n => n.id)).toEqual([1, 2]);
  });
});

describe("collectNoteTags", () => {
  it("zählt Stichwörter über alle Notizen", () => {
    expect(
      collectNoteTags([
        { id: 1, text: "a", tags: "Zelt,Tessin" },
        { id: 2, text: "b", tags: "Zelt" },
        { id: 3, text: "c", tags: "Winter" },
      ])
    ).toEqual([
      { tag: "Zelt", count: 2 },
      { tag: "Tessin", count: 1 },
      { tag: "Winter", count: 1 },
    ]);
  });

  it("zählt verschiedene Schreibweisen zusammen und zeigt die erste", () => {
    expect(
      collectNoteTags([
        { id: 1, text: "a", tags: "Tessin" },
        { id: 2, text: "b", tags: "tessin" },
      ])
    ).toEqual([{ tag: "Tessin", count: 2 }]);
  });

  it("sortiert bei Gleichstand alphabetisch", () => {
    expect(
      collectNoteTags([{ id: 1, text: "a", tags: "beta,alpha,gamma" }]).map(
        e => e.tag
      )
    ).toEqual(["alpha", "beta", "gamma"]);
  });

  it("liefert ohne Stichwörter eine leere Liste", () => {
    expect(collectNoteTags([])).toEqual([]);
    expect(collectNoteTags([{ id: 1, text: "a", tags: null }])).toEqual([]);
  });
});
