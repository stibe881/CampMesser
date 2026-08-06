import { describe, expect, it } from "vitest";
import {
  MAX_SPOT_TARIFFS,
  parseSpotTariffs,
  serializeSpotTariffs,
  tariffRange,
  tariffTotalRappen,
} from "@shared/spotTariffs";

/**
 * Mehrere Tarife pro Zeltplatz (#369).
 *
 * WORAUF ES ANKOMMT: Die Tarife stehen als JSON in einer Spalte. Was von
 * dort zurückkommt, ist nicht vertrauenswürdig – ein halb gespeicherter
 * Datensatz oder ein Stand aus einer älteren Version darf die Platzseite
 * nicht kippen. Unlesbares wird still weggelassen, nicht gemeldet.
 */
describe("Platz-Tarife", () => {
  it("nichts erfasst ist eine leere Liste", () => {
    expect(parseSpotTariffs(null)).toEqual([]);
    expect(parseSpotTariffs("")).toEqual([]);
    expect(parseSpotTariffs("kein json")).toEqual([]);
    expect(parseSpotTariffs('{"name":"x"}')).toEqual([]);
  });

  it("ein Tarif mit Untertarifen kommt heil zurück", () => {
    const json = JSON.stringify([
      {
        name: "Nebensaison",
        rows: [
          { label: "Erwachsene", priceRappen: 1200 },
          { label: "Kind", priceRappen: 600 },
        ],
      },
    ]);
    const [tariff] = parseSpotTariffs(json);
    expect(tariff.name).toBe("Nebensaison");
    expect(tariff.rows).toHaveLength(2);
    expect(tariffTotalRappen(tariff)).toBe(1800);
  });

  it("gratis ist eine Angabe, keine fehlende", () => {
    // «Kind bis 6 Jahre: gratis» muss dastehen dürfen.
    const json = JSON.stringify([
      { name: "Hauptsaison", rows: [{ label: "Kleinkind", priceRappen: 0 }] },
    ]);
    expect(parseSpotTariffs(json)[0].rows).toEqual([
      { label: "Kleinkind", priceRappen: 0 },
    ]);
  });

  it("kaputte Zeilen fallen weg, der Rest bleibt", () => {
    const json = JSON.stringify([
      {
        name: "Nebensaison",
        rows: [
          { label: "", priceRappen: 100 },
          { label: "Kind", priceRappen: "keine Zahl" },
          { label: "Hund", priceRappen: -5 },
          { label: "Erwachsene", priceRappen: 1200 },
        ],
      },
      { name: "", rows: [] },
      "Unsinn",
    ]);
    const tariffs = parseSpotTariffs(json);
    expect(tariffs).toHaveLength(1);
    expect(tariffs[0].rows).toEqual([
      { label: "Erwachsene", priceRappen: 1200 },
    ]);
  });

  it("mehr Tarife als erlaubt werden abgeschnitten", () => {
    const many = Array.from({ length: MAX_SPOT_TARIFFS + 5 }, (_, i) => ({
      name: `T${i}`,
      rows: [],
    }));
    expect(parseSpotTariffs(JSON.stringify(many))).toHaveLength(
      MAX_SPOT_TARIFFS
    );
  });

  it("leer speichern heisst NULL, nicht «[]»", () => {
    // «nicht erfasst» und «leer erfasst» sollen unterscheidbar bleiben.
    expect(serializeSpotTariffs([])).toBeNull();
    expect(serializeSpotTariffs([{ name: "  ", rows: [] }])).toBeNull();
  });

  it("Speichern säubert mit derselben Regel wie das Lesen", () => {
    const json = serializeSpotTariffs([
      {
        name: "  Hauptsaison  ",
        rows: [{ label: " Erwachsene ", priceRappen: 1599.6 }],
      },
    ]);
    expect(parseSpotTariffs(json)).toEqual([
      {
        name: "Hauptsaison",
        rows: [{ label: "Erwachsene", priceRappen: 1600 }],
      },
    ]);
  });

  it("die Spanne über alle Tarife für die Kurzfassung", () => {
    const tariffs = parseSpotTariffs(
      JSON.stringify([
        { name: "Neben", rows: [{ label: "Kind", priceRappen: 600 }] },
        { name: "Haupt", rows: [{ label: "Erwachsene", priceRappen: 2400 }] },
      ])
    );
    expect(tariffRange(tariffs)).toEqual({ minRappen: 600, maxRappen: 2400 });
    expect(tariffRange([])).toBeNull();
  });
});
