import { describe, expect, it } from "vitest";
import {
  MAX_NEXT_TIME_NOTES,
  NEXT_TIME_NOTE_MAX_LENGTH,
  parseNextTimeNotes,
  serializeNextTimeNotes,
} from "@shared/nextTime";

/**
 * «Beim nächsten Mal»-Merker (#396): Der Text kommt aus einer
 * JSON-Spalte – Kaputtes darf die Platzseite nie kippen.
 */
describe("Beim-nächsten-Mal-Merker", () => {
  it("Zeilen überleben Speichern und Lesen", () => {
    const json = serializeNextTimeNotes([
      "Kabeltrommel 25 m",
      "Parzelle 12 meiden",
    ]);
    expect(parseNextTimeNotes(json)).toEqual([
      "Kabeltrommel 25 m",
      "Parzelle 12 meiden",
    ]);
  });

  it("Unlesbares fällt still weg statt die Seite zu kippen", () => {
    expect(parseNextTimeNotes(null)).toEqual([]);
    expect(parseNextTimeNotes("kein json")).toEqual([]);
    expect(parseNextTimeNotes('{"a":1}')).toEqual([]);
    expect(parseNextTimeNotes('[42, {"x":1}, "  echt  "]')).toEqual(["echt"]);
  });

  it("leer speichern heisst NULL, nicht «[]»", () => {
    expect(serializeNextTimeNotes([])).toBeNull();
    expect(serializeNextTimeNotes(["   ", ""])).toBeNull();
  });

  it("kürzt zu lange Zeilen und schneidet den Zettel ab", () => {
    const long = "x".repeat(NEXT_TIME_NOTE_MAX_LENGTH + 50);
    expect(parseNextTimeNotes(JSON.stringify([long]))[0]).toHaveLength(
      NEXT_TIME_NOTE_MAX_LENGTH
    );
    const many = Array.from({ length: MAX_NEXT_TIME_NOTES + 5 }, (_, i) =>
      String(i)
    );
    expect(parseNextTimeNotes(JSON.stringify(many))).toHaveLength(
      MAX_NEXT_TIME_NOTES
    );
  });

  it("faltet Leerraum, wie es die Anzeige tut", () => {
    expect(parseNextTimeNotes('["  zwei   Wörter  "]')).toEqual([
      "zwei Wörter",
    ]);
  });
});
