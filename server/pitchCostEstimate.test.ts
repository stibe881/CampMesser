import { describe, expect, it } from "vitest";
import {
  cleanCount,
  emptyCounts,
  estimatePitchCost,
  nightsBetween,
  perNightFromRows,
} from "@shared/pitchCostEstimate";

const ROWS = [
  { label: "Erwachsene", priceRappen: 1600, count: 2 },
  { label: "Kind", priceRappen: 800, count: 1 },
  { label: "Stellplatz", priceRappen: 2400, count: 1 },
];

describe("nightsBetween", () => {
  it("zählt NÄCHTE und nicht Tage", () => {
    // Freitag bis Sonntag sind zwei Nächte – genau hier verrechnet man
    // sich im Kopf.
    expect(nightsBetween("2026-08-07", "2026-08-09")).toBe(2);
  });

  it("gibt für denselben Tag 0 zurück", () => {
    expect(nightsBetween("2026-08-07", "2026-08-07")).toBe(0);
  });

  it("wird bei verdrehten Daten nicht negativ", () => {
    expect(nightsBetween("2026-08-09", "2026-08-07")).toBe(0);
  });

  it("läuft über den Monatswechsel", () => {
    expect(nightsBetween("2026-07-30", "2026-08-02")).toBe(3);
  });

  it("gibt bei Unsinn 0 zurück statt NaN", () => {
    expect(nightsBetween("keine", "daten")).toBe(0);
  });
});

describe("cleanCount", () => {
  it("lässt nur ganze, nicht negative Anzahlen durch", () => {
    expect(cleanCount(2)).toBe(2);
    expect(cleanCount(2.7)).toBe(2);
    expect(cleanCount(-1)).toBe(0);
    expect(cleanCount("drei")).toBe(0);
    expect(cleanCount(500)).toBe(99);
  });
});

describe("perNightFromRows", () => {
  it("multipliziert je Zeile und summiert", () => {
    // 2 × 16.– + 1 × 8.– + 1 × 24.– = 64.–
    expect(perNightFromRows(ROWS)).toBe(6400);
  });

  it("ignoriert Zeilen ohne Anzahl", () => {
    expect(
      perNightFromRows([{ label: "Hund", priceRappen: 500, count: 0 }])
    ).toBe(0);
  });
});

describe("estimatePitchCost", () => {
  it("rechnet aus dem Tarif für alle Nächte", () => {
    const found = estimatePitchCost({ nights: 5, rows: ROWS });
    expect(found).toEqual({
      perNightRappen: 6400,
      totalRappen: 32000,
      nights: 5,
      source: "tariff",
    });
  });

  it("fällt ohne Tarif auf den einen Preis pro Nacht zurück", () => {
    const found = estimatePitchCost({ nights: 3, nightlyRappen: 4200 });
    expect(found).toMatchObject({ totalRappen: 12600, source: "nightly" });
  });

  it("nimmt den Tarif, wenn beides da ist", () => {
    // Die genaue Rechnung schlägt die grobe.
    expect(
      estimatePitchCost({ nights: 2, rows: ROWS, nightlyRappen: 4200 })?.source
    ).toBe("tariff");
  });

  it("behauptet ohne Nächte nichts", () => {
    expect(estimatePitchCost({ nights: 0, rows: ROWS })).toBeNull();
  });

  it("schlägt keine 0.– vor", () => {
    // Ein Eintrag über null Franken ist einer, den man wieder löscht.
    expect(
      estimatePitchCost({
        nights: 3,
        rows: [{ label: "Hund", priceRappen: 500, count: 0 }],
        nightlyRappen: 0,
      })
    ).toBeNull();
  });
});

describe("emptyCounts", () => {
  it("startet bei 0 statt zu raten", () => {
    // Wer die Zahl selbst eintippt, prüft sie dabei; eine vorgesetzte
    // Zahl übersieht man und nimmt sie falsch ins Budget.
    const counts = emptyCounts({
      name: "Hauptsaison",
      rows: [
        { label: "Erwachsene", priceRappen: 1600 },
        { label: "Kind", priceRappen: 800 },
      ],
    });
    expect(counts.map(row => row.count)).toEqual([0, 0]);
    expect(counts[0]).toMatchObject({ label: "Erwachsene", priceRappen: 1600 });
  });
});
