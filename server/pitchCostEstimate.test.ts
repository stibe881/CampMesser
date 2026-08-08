import { describe, expect, it } from "vitest";
import {
  cleanCount,
  estimateAcrossSeasons,
  nightsPerTariff,
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
      oneOffRappen: 0,
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

// Einmalige Posten (#415): Endreinigung und Buchungsgebühr zählen genau
// einmal – nicht mal Nächte.
describe("einmalige Posten", () => {
  it("rechnet Einmaliges nicht mit den Nächten hoch", () => {
    const estimate = estimatePitchCost({
      nights: 5,
      rows: [
        { label: "Erwachsene", priceRappen: 1200, count: 2 },
        { label: "Endreinigung", priceRappen: 5000, count: 1, oneOff: true },
      ],
      nightlyRappen: 0,
    });
    expect(estimate).toMatchObject({
      perNightRappen: 2400,
      oneOffRappen: 5000,
      totalRappen: 2400 * 5 + 5000,
      source: "tariff",
    });
  });

  it("nur Einmaliges ist trotzdem eine Rechnung", () => {
    const estimate = estimatePitchCost({
      nights: 3,
      rows: [
        { label: "Buchungsgebühr", priceRappen: 800, count: 1, oneOff: true },
      ],
      nightlyRappen: 0,
    });
    expect(estimate).toMatchObject({
      perNightRappen: 0,
      oneOffRappen: 800,
      totalRappen: 800,
    });
  });

  it("emptyCounts trägt das Einmalig-Merkmal weiter", () => {
    const counts = emptyCounts({
      name: "Hauptsaison",
      currency: "CHF",
      rows: [
        { label: "Erwachsene", priceRappen: 1600 },
        { label: "Endreinigung", priceRappen: 5000, oneOff: true },
      ],
    });
    expect(counts[0].oneOff).toBeUndefined();
    expect(counts[1].oneOff).toBe(true);
  });
});

// Saisonwechsel (#420): jede Nacht gehört zu ihrem Datum.
describe("Saisonwechsel", () => {
  const tariffs = [
    {
      name: "Nebensaison",
      currency: "CHF" as const,
      rows: [{ label: "Erwachsene", priceRappen: 1000 }],
      periods: [{ from: "04-01", to: "06-27" }],
    },
    {
      name: "Hauptsaison",
      currency: "CHF" as const,
      rows: [{ label: "Erwachsene", priceRappen: 1500 }],
      periods: [{ from: "06-28", to: "08-23" }],
    },
  ];

  it("teilt die Nächte an der Tarifgrenze auf", () => {
    // 26.06.–01.07. = 5 Nächte: 26./27.06. Nebensaison, 28.–30.06. Haupt.
    expect(nightsPerTariff(tariffs, "2026-06-26", "2026-07-01", 0)).toEqual([
      { tariffIndex: 0, nights: 2 },
      { tariffIndex: 1, nights: 3 },
    ]);
  });

  it("Nächte ohne Zeitraum fallen auf den gewählten Tarif zurück", () => {
    // September liegt in keinem Zeitraum – gerechnet wird der gewählte.
    expect(nightsPerTariff(tariffs, "2026-09-01", "2026-09-03", 1)).toEqual([
      { tariffIndex: 1, nights: 2 },
    ]);
  });

  it("rechnet je Nacht den gültigen Preis, Einmaliges einmal", () => {
    const result = estimateAcrossSeasons({
      tariffs,
      rows: [
        { label: "Erwachsene", priceRappen: 1000, count: 2 },
        { label: "Endreinigung", priceRappen: 3000, count: 1, oneOff: true },
      ],
      startDate: "2026-06-26",
      endDate: "2026-07-01",
      fallbackIndex: 0,
    });
    // 2 Nächte × 2×10.– + 3 Nächte × 2×15.– + 30.– einmalig
    expect(result).toEqual({
      parts: [
        { tariffIndex: 0, nights: 2, perNightRappen: 2000 },
        { tariffIndex: 1, nights: 3, perNightRappen: 3000 },
      ],
      oneOffRappen: 3000,
      totalRappen: 2 * 2000 + 3 * 3000 + 3000,
    });
  });

  it("eine Zeile ohne Gegenstück behält ihren gewählten Preis", () => {
    // «Hund» gibt es nur in der Nebensaison – lieber leicht ungenau als
    // eine stumm verschwundene Position.
    const result = estimateAcrossSeasons({
      tariffs,
      rows: [{ label: "Hund", priceRappen: 300, count: 1 }],
      startDate: "2026-06-26",
      endDate: "2026-07-01",
      fallbackIndex: 0,
    });
    expect(result?.parts.map(p => p.perNightRappen)).toEqual([300, 300]);
  });
});
