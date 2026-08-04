import { describe, expect, it } from "vitest";
import { songs } from "../client/src/data/songs";
import {
  MAX_TRANSPOSE,
  MIN_TRANSPOSE,
  parseChordLine,
  songChords,
  transposeChord,
  transposeLabel,
  transposeLine,
} from "@shared/songs";
import { LANGUAGES, pick } from "@shared/i18n";

describe("Lagerfeuer-Liederbuch (#269)", () => {
  it("zerlegt eine Zeile in Akkord- und Textstücke", () => {
    expect(parseChordLine("[G]Der Mond ist auf[C]gegangen")).toEqual([
      { chord: "G", text: "Der Mond ist auf" },
      { chord: "C", text: "gegangen" },
    ]);
  });

  it("Text vor dem ersten Akkord behält seine Stelle", () => {
    expect(parseChordLine("Der [D]Wald steht schwarz")).toEqual([
      { chord: null, text: "Der " },
      { chord: "D", text: "Wald steht schwarz" },
    ]);
  });

  it("kommt mit Zeilen ohne und mit kaputten Klammern zurecht", () => {
    expect(parseChordLine("nur Text")).toEqual([
      { chord: null, text: "nur Text" },
    ]);
    expect(parseChordLine("")).toEqual([]);
    // Fehlende schliessende Klammer: der Rest bleibt Text, nichts geht verloren
    expect(parseChordLine("Text [G")).toEqual([
      { chord: null, text: "Text [G" },
    ]);
  });

  it("listet die Akkorde eines Liedes in der Reihenfolge des Auftretens", () => {
    const song = songs.find(s => s.id === "michael-row-the-boat-ashore")!;
    expect(songChords(song)).toEqual(["C", "F", "Am", "G"]);
  });

  it("transponiert Akkorde inklusive Bass-Ton", () => {
    expect(transposeChord("G", 2)).toBe("A");
    expect(transposeChord("Am", 3)).toBe("Cm");
    expect(transposeChord("G7", -2)).toBe("F7");
    expect(transposeChord("G/B", 1)).toBe("G#/C");
    // Über das Ende der Skala hinaus wird umgebrochen
    expect(transposeChord("B", 1)).toBe("C");
    expect(transposeChord("C", -1)).toBe("B");
  });

  it("versteht b-Schreibweisen und lässt Unbekanntes stehen", () => {
    expect(transposeChord("Bb", 2)).toBe("C");
    expect(transposeChord("N.C.", 2)).toBe("N.C.");
    expect(transposeChord("H", 2)).toBe("H");
  });

  it("transponiert eine ganze Zeile, ohne den Text anzufassen", () => {
    expect(transposeLine("[G]Der Mond ist auf[C]gegangen", 2)).toBe(
      "[A]Der Mond ist auf[D]gegangen"
    );
    expect(transposeLine("[G]Text", 0)).toBe("[G]Text");
  });

  it("beschriftet die Transponierung mit Vorzeichen", () => {
    expect(transposeLabel(0)).toBe("0");
    expect(transposeLabel(2)).toBe("+2");
    expect(transposeLabel(-3)).toBe("−3");
  });

  it("die Transponier-Grenzen bleiben in einer Oktave", () => {
    expect(MIN_TRANSPOSE).toBeGreaterThanOrEqual(-12);
    expect(MAX_TRANSPOSE).toBeLessThanOrEqual(12);
  });

  it("jedes Lied nennt Herkunft und Hinweis in vier Sprachen", () => {
    expect(songs.length).toBeGreaterThanOrEqual(8);
    const ids = songs.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const song of songs) {
      expect(song.title.length).toBeGreaterThan(3);
      expect(song.verses.length).toBeGreaterThan(0);
      for (const lang of LANGUAGES) {
        // Die Herkunft ist zugleich der Beleg fürs Gemeinfreie – nie leer
        expect(pick(song.origin, lang).length).toBeGreaterThan(25);
        expect(pick(song.note, lang).length).toBeGreaterThan(30);
      }
    }
  });

  it("jedes Lied trägt Akkorde, sonst nützt das Buch am Feuer nichts", () => {
    for (const song of songs) {
      expect(songChords(song).length).toBeGreaterThan(0);
    }
  });

  it("jede Herkunftsangabe nennt eine Jahreszahl oder das Jahrhundert", () => {
    for (const song of songs) {
      const origin = pick(song.origin, "de");
      expect(origin).toMatch(/\d{4}|Jahrhundert|überliefert/);
    }
  });
});
