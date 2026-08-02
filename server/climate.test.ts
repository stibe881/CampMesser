import { describe, expect, it } from "vitest";
import {
  aggregateMonthlyClimate,
  bestTravelMonths,
  climateRequestUrl,
  climateScore,
  climateYearRange,
  type DailyClimateData,
} from "../shared/climate";

/** Kompakte Testdaten: Tageswerte aus (Datum, max, min, Niederschlag). */
function dailyOf(
  rows: Array<[string, number | null, number | null, number | null]>
): DailyClimateData {
  return {
    time: rows.map(r => r[0]),
    temperature_2m_max: rows.map(r => r[1]),
    temperature_2m_min: rows.map(r => r[2]),
    precipitation_sum: rows.map(r => r[3]),
  };
}

describe("climateRequestUrl", () => {
  it("fragt die Archive-API mit den drei Tageswerten an", () => {
    const url = climateRequestUrl(46.9481, 7.4474, "2021-01-01", "2025-12-31");
    expect(url).toContain("archive-api.open-meteo.com/v1/archive");
    expect(url).toContain("latitude=46.9481");
    expect(url).toContain("longitude=7.4474");
    expect(url).toContain("start_date=2021-01-01");
    expect(url).toContain("end_date=2025-12-31");
    expect(decodeURIComponent(url)).toContain(
      "daily=temperature_2m_max,temperature_2m_min,precipitation_sum"
    );
  });
});

describe("climateYearRange", () => {
  it("liefert die letzten fünf vollen Kalenderjahre", () => {
    const range = climateYearRange(new Date("2026-08-02T12:00:00"));
    expect(range).toEqual({
      startDate: "2021-01-01",
      endDate: "2025-12-31",
      fromYear: 2021,
      toYear: 2025,
    });
  });

  it("respektiert eine andere Jahresanzahl", () => {
    const range = climateYearRange(new Date("2026-01-01T00:00:00"), 2);
    expect(range.startDate).toBe("2024-01-01");
    expect(range.endDate).toBe("2025-12-31");
  });
});

describe("aggregateMonthlyClimate", () => {
  it("mittelt Temperaturen pro Monat über mehrere Jahre", () => {
    const daily = dailyOf([
      ["2024-07-01", 24, 12, 0],
      ["2024-07-02", 28, 14, 0],
      ["2025-07-01", 26, 13, 0],
      ["2025-07-02", 30, 15, 0],
    ]);
    const july = aggregateMonthlyClimate(daily)[6];
    expect(july.month).toBe(7);
    expect(july.avgTempMaxC).toBe(27);
    expect(july.avgTempMinC).toBe(13.5);
  });

  it("zählt Regentage (> 1 mm) als Durchschnitt pro Jahr-Monat", () => {
    const daily = dailyOf([
      // 2024-06: 2 Regentage (1 mm zählt NICHT, 1.1 und 12 schon)
      ["2024-06-01", 20, 10, 1],
      ["2024-06-02", 20, 10, 1.1],
      ["2024-06-03", 20, 10, 12],
      // 2025-06: 1 Regentag
      ["2025-06-01", 20, 10, 0],
      ["2025-06-02", 20, 10, 5],
    ]);
    const june = aggregateMonthlyClimate(daily)[5];
    // (2 + 1) / 2 Jahre = 1.5
    expect(june.rainDays).toBe(1.5);
  });

  it("überspringt null-Lücken und liefert null für Monate ohne Daten", () => {
    const daily = dailyOf([
      ["2025-03-01", null, null, null],
      ["2025-03-02", 10, null, 2],
    ]);
    const months = aggregateMonthlyClimate(daily);
    const march = months[2];
    expect(march.avgTempMaxC).toBe(10);
    expect(march.avgTempMinC).toBeNull();
    expect(march.rainDays).toBe(1);
    // Monat ohne jegliche Daten
    expect(months[0]).toEqual({
      month: 1,
      avgTempMaxC: null,
      avgTempMinC: null,
      rainDays: null,
    });
    expect(months).toHaveLength(12);
  });
});

describe("climateScore / bestTravelMonths", () => {
  const month = (
    m: number,
    max: number | null,
    rain: number | null
  ): Parameters<typeof climateScore>[0] => ({
    month: m,
    avgTempMaxC: max,
    avgTempMinC: null,
    rainDays: rain,
  });

  it("rechnet Score = Ø-Max − 0.7 × Regentage", () => {
    expect(climateScore(month(7, 25, 10))).toBe(18);
    expect(climateScore(month(7, 20, 0))).toBe(20);
    expect(climateScore(month(7, null, 3))).toBeNull();
    expect(climateScore(month(7, 20, null))).toBeNull();
  });

  it("wählt die wärmsten Monate mit den wenigsten Regentagen", () => {
    const months = [
      month(5, 18, 8), // 12.4
      month(6, 24, 10), // 17
      month(7, 27, 9), // 20.7
      month(8, 26, 4), // 23.2
      month(9, 21, 6), // 16.8
      month(1, null, null),
    ];
    expect(bestTravelMonths(months)).toEqual([8, 7, 6]);
    expect(bestTravelMonths(months, 2)).toEqual([8, 7]);
  });

  it("löst Gleichstände deterministisch über den früheren Monat", () => {
    const months = [month(9, 20, 0), month(4, 20, 0)];
    expect(bestTravelMonths(months, 2)).toEqual([4, 9]);
  });
});
