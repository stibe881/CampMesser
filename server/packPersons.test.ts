import { describe, expect, it } from "vitest";
import {
  MAX_PERSON_NAME_LENGTH,
  MAX_PERSONS,
  normalizePersons,
  parsePersons,
  serializePersons,
} from "@shared/packPersons";

describe("normalizePersons", () => {
  it("übernimmt gültige Namen getrimmt", () => {
    expect(normalizePersons([" Mama ", "Papa"])).toEqual(["Mama", "Papa"]);
  });

  it("ignoriert Nicht-Strings und leere Namen", () => {
    expect(normalizePersons(["Mama", 42, null, "  ", {}, "Papa"])).toEqual([
      "Mama",
      "Papa",
    ]);
  });

  it("liefert für Nicht-Arrays eine leere Liste", () => {
    expect(normalizePersons("Mama")).toEqual([]);
    expect(normalizePersons({ 0: "Mama" })).toEqual([]);
    expect(normalizePersons(undefined)).toEqual([]);
  });

  it("entfernt Duplikate unabhängig von Gross-/Kleinschreibung", () => {
    expect(normalizePersons(["Mama", "mama", " MAMA "])).toEqual(["Mama"]);
  });

  it("begrenzt auf höchstens zehn Personen", () => {
    const many = Array.from({ length: 15 }, (_, i) => `Person ${i}`);
    expect(normalizePersons(many)).toHaveLength(MAX_PERSONS);
  });

  it("kürzt überlange Namen auf 80 Zeichen ohne Rand-Leerzeichen", () => {
    const long = `${"a".repeat(79)} b`;
    const [name] = normalizePersons([long]);
    expect(name).toHaveLength(MAX_PERSON_NAME_LENGTH - 1);
    expect(name.endsWith(" ")).toBe(false);
  });
});

describe("parsePersons", () => {
  it("parst eine gespeicherte Liste", () => {
    expect(parsePersons('["Mama","Papa"]')).toEqual(["Mama", "Papa"]);
  });

  it("liefert für null/leer/kaputtes JSON eine leere Liste", () => {
    expect(parsePersons(null)).toEqual([]);
    expect(parsePersons(undefined)).toEqual([]);
    expect(parsePersons("")).toEqual([]);
    expect(parsePersons("nicht json")).toEqual([]);
    expect(parsePersons('{"name":"Mama"}')).toEqual([]);
  });

  it("bereinigt auch gespeicherte Daten defensiv", () => {
    expect(parsePersons('[" Mama ", "", 3, "Mama"]')).toEqual(["Mama"]);
  });
});

describe("serializePersons", () => {
  it("serialisiert bereinigt und rundreisefest", () => {
    const json = serializePersons([" Mama ", "Papa", "mama"]);
    expect(json).not.toBeNull();
    expect(parsePersons(json)).toEqual(["Mama", "Papa"]);
  });

  it("wird bei leerer Liste zu null", () => {
    expect(serializePersons([])).toBeNull();
    expect(serializePersons(["   "])).toBeNull();
  });
});
