import { describe, expect, it } from "vitest";
import {
  SPOT_PRICE_MAX_RAPPEN,
  estimatedTotalRappen,
  hasAnySpotPrice,
  nightlyRappen,
  nightsBySpot,
  sanitizeRappen,
  spotCostComparison,
  type SpotCostLike,
  type SpotStayLike,
} from "@shared/spotCosts";

/** Drei Plätze mit unterschiedlich vollständigen Preisangaben. */
const spots: SpotCostLike[] = [
  // CHF 42.00 + CHF 3.50 Kurtaxe = CHF 45.50
  {
    id: 1,
    name: "Camping Thunersee",
    pricePerNightRappen: 4200,
    extraPerNightRappen: 350,
  },
  // CHF 28.00, keine Nebenkosten erfasst
  { id: 2, name: "Alpencamping", pricePerNightRappen: 2800 },
  // gar kein Preis erfasst
  { id: 3, name: "Wiese am Bach", pricePerNightRappen: null },
];

describe("sanitizeRappen", () => {
  it("übernimmt plausible Beträge unverändert", () => {
    expect(sanitizeRappen(4200)).toBe(4200);
    expect(sanitizeRappen(1)).toBe(1);
  });

  it("behandelt fehlende und unlesbare Werte als «nicht erfasst»", () => {
    expect(sanitizeRappen(null)).toBe(0);
    expect(sanitizeRappen(undefined)).toBe(0);
    expect(sanitizeRappen(Number.NaN)).toBe(0);
    expect(sanitizeRappen(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it("ignoriert negative Beträge und rundet Bruchteile", () => {
    expect(sanitizeRappen(-500)).toBe(0);
    expect(sanitizeRappen(0)).toBe(0);
    expect(sanitizeRappen(1234.6)).toBe(1235);
  });

  it("kappt unplausibel grosse Beträge", () => {
    expect(sanitizeRappen(SPOT_PRICE_MAX_RAPPEN + 1)).toBe(
      SPOT_PRICE_MAX_RAPPEN
    );
  });
});

describe("nightlyRappen", () => {
  it("addiert Grundpreis und Nebenkosten", () => {
    expect(nightlyRappen(spots[0])).toBe(4550);
  });

  it("kommt ohne Nebenkosten aus", () => {
    expect(nightlyRappen(spots[1])).toBe(2800);
  });

  it("liefert null, wenn nichts erfasst ist", () => {
    expect(nightlyRappen(spots[2])).toBeNull();
    expect(nightlyRappen({ id: 9, name: "Leer" })).toBeNull();
  });

  it("rechnet auch nur mit Nebenkosten", () => {
    expect(
      nightlyRappen({ id: 9, name: "Nur Kurtaxe", extraPerNightRappen: 300 })
    ).toBe(300);
  });
});

describe("hasAnySpotPrice", () => {
  it("erkennt mindestens einen erfassten Preis", () => {
    expect(hasAnySpotPrice(spots)).toBe(true);
  });

  it("ist ohne jeden Preis falsch", () => {
    expect(hasAnySpotPrice([spots[2]])).toBe(false);
    expect(hasAnySpotPrice([])).toBe(false);
  });
});

describe("nightsBySpot", () => {
  it("zählt die Nächte je Platz zusammen", () => {
    const stays: SpotStayLike[] = [
      { spotId: 1, startDate: "2026-07-10", endDate: "2026-07-13" },
      { spotId: 1, startDate: "2026-08-01", endDate: "2026-08-03" },
      { spotId: 2, startDate: "2026-06-05", endDate: "2026-06-06" },
    ];
    const nights = nightsBySpot(stays);
    expect(nights.get(1)).toBe(5);
    expect(nights.get(2)).toBe(1);
  });

  it("überspringt Aufenthalte ohne Platz und Tagesausflüge", () => {
    const nights = nightsBySpot([
      { spotId: null, startDate: "2026-07-10", endDate: "2026-07-13" },
      { startDate: "2026-07-10", endDate: "2026-07-13" },
      // gleicher Tag = keine Nacht
      { spotId: 1, startDate: "2026-07-10", endDate: "2026-07-10" },
      // Abreise vor Anreise = kaputt
      { spotId: 1, startDate: "2026-07-10", endDate: "2026-07-01" },
    ]);
    expect(nights.size).toBe(0);
  });
});

describe("spotCostComparison", () => {
  const stays: SpotStayLike[] = [
    { spotId: 1, startDate: "2026-07-10", endDate: "2026-07-14" },
    { spotId: 3, startDate: "2026-05-01", endDate: "2026-05-04" },
  ];

  it("sortiert nach Preis pro Nacht, günstigster zuerst", () => {
    const rows = spotCostComparison(spots, stays);
    expect(rows.map(r => r.name)).toEqual([
      "Alpencamping",
      "Camping Thunersee",
    ]);
    expect(rows[0].nightlyRappen).toBe(2800);
    expect(rows[1].nightlyRappen).toBe(4550);
  });

  it("lässt Plätze ohne Preis komplett weg", () => {
    const rows = spotCostComparison(spots, stays);
    expect(rows.some(r => r.spotId === 3)).toBe(false);
  });

  it("schätzt die Gesamtkosten aus Nächten × Preis", () => {
    const rows = spotCostComparison(spots, stays);
    const thunersee = rows.find(r => r.spotId === 1);
    expect(thunersee?.nights).toBe(4);
    expect(thunersee?.estimatedTotalRappen).toBe(4 * 4550);
  });

  it("lässt die Schätzung ohne Übernachtungen null (nicht 0)", () => {
    const rows = spotCostComparison(spots, []);
    expect(rows.every(r => r.nights === 0)).toBe(true);
    expect(rows.every(r => r.estimatedTotalRappen === null)).toBe(true);
  });

  it("trennt Grundpreis und Nebenkosten in der Zeile", () => {
    const row = spotCostComparison(spots, stays).find(r => r.spotId === 1);
    expect(row?.priceRappen).toBe(4200);
    expect(row?.extraRappen).toBe(350);
  });

  it("sortiert bei gleichem Preis alphabetisch", () => {
    const rows = spotCostComparison(
      [
        { id: 1, name: "Zeltwiese", pricePerNightRappen: 3000 },
        { id: 2, name: "Ahornhof", pricePerNightRappen: 3000 },
        { id: 3, name: "Mühlebach", pricePerNightRappen: 3000 },
      ],
      []
    );
    expect(rows.map(r => r.name)).toEqual([
      "Ahornhof",
      "Mühlebach",
      "Zeltwiese",
    ]);
  });

  it("verkraftet kaputte Preisfelder", () => {
    const rows = spotCostComparison(
      [
        { id: 1, name: "Minus", pricePerNightRappen: -100 },
        {
          id: 2,
          name: "Kaputt",
          pricePerNightRappen: Number.NaN,
          extraPerNightRappen: 500,
        },
      ],
      []
    );
    expect(rows.map(r => r.name)).toEqual(["Kaputt"]);
    expect(rows[0].nightlyRappen).toBe(500);
  });

  it("liefert ohne Plätze eine leere Liste", () => {
    expect(spotCostComparison([], stays)).toEqual([]);
  });
});

describe("estimatedTotalRappen", () => {
  it("summiert nur die bekannten Schätzungen", () => {
    const rows = spotCostComparison(spots, [
      { spotId: 1, startDate: "2026-07-10", endDate: "2026-07-12" },
      { spotId: 2, startDate: "2026-07-20", endDate: "2026-07-21" },
    ]);
    expect(estimatedTotalRappen(rows)).toBe(2 * 4550 + 1 * 2800);
  });

  it("ist ohne Übernachtungen 0", () => {
    expect(estimatedTotalRappen(spotCostComparison(spots, []))).toBe(0);
    expect(estimatedTotalRappen([])).toBe(0);
  });
});
