import { describe, expect, it } from "vitest";
import {
  parseTripWeather,
  summarizeTripWeather,
  TRIP_WEATHER_MAX_PRECIP_MM,
  weatherLuck,
} from "@shared/tripWeather";

describe("summarizeTripWeather", () => {
  it("aggregiert Extremwerte, Regentage und Niederschlagssumme", () => {
    const summary = summarizeTripWeather({
      temperature_2m_max: [24.3, 31.2, 27.8],
      temperature_2m_min: [12.4, 15.1, 11.9],
      precipitation_sum: [0, 4.2, 0.6],
    });
    expect(summary).toEqual({
      tMax: 31.2,
      tMin: 11.9,
      rainDays: 1,
      totalPrecip: 4.8,
    });
  });

  it("überspringt null-Werte (Archiv-Lücken) bei der Aggregation", () => {
    const summary = summarizeTripWeather({
      temperature_2m_max: [null, 22.5],
      temperature_2m_min: [8.0, null],
      precipitation_sum: [null, 2.4],
    });
    expect(summary).toEqual({
      tMax: 22.5,
      tMin: 8,
      rainDays: 1,
      totalPrecip: 2.4,
    });
  });

  it("liefert null, wenn keine gültigen Temperatur-Tage vorliegen", () => {
    expect(
      summarizeTripWeather({
        temperature_2m_max: [null, null],
        temperature_2m_min: [null, null],
        precipitation_sum: [1.2, 0],
      })
    ).toBeNull();
    expect(
      summarizeTripWeather({
        temperature_2m_max: [],
        temperature_2m_min: [],
        precipitation_sum: [],
      })
    ).toBeNull();
  });

  it("verwirft unplausible Temperaturen und negative Niederschläge", () => {
    const summary = summarizeTripWeather({
      temperature_2m_max: [999, 25],
      temperature_2m_min: [-999, 10],
      precipitation_sum: [-5, 3],
    });
    expect(summary).toEqual({
      tMax: 25,
      tMin: 10,
      rainDays: 1,
      totalPrecip: 3,
    });
  });

  it("zählt genau 1 mm nicht als Regentag (Schwelle: mehr als 1 mm)", () => {
    const summary = summarizeTripWeather({
      temperature_2m_max: [20],
      temperature_2m_min: [10],
      precipitation_sum: [1],
    });
    expect(summary?.rainDays).toBe(0);
    expect(summary?.totalPrecip).toBe(1);
  });

  it("rundet Temperaturen und Summe auf eine Nachkommastelle", () => {
    const summary = summarizeTripWeather({
      temperature_2m_max: [24.36],
      temperature_2m_min: [11.94],
      precipitation_sum: [0.33, 0.33, 0.33],
    });
    expect(summary).toEqual({
      tMax: 24.4,
      tMin: 11.9,
      rainDays: 0,
      totalPrecip: 1,
    });
  });
});

describe("parseTripWeather", () => {
  const valid = { tMax: 31, tMin: 12, rainDays: 2, totalPrecip: 14.5 };

  it("liest gültiges JSON zurück", () => {
    expect(parseTripWeather(JSON.stringify(valid))).toEqual(valid);
  });

  it("liefert null bei leerem, kaputtem oder nicht-Objekt-JSON", () => {
    expect(parseTripWeather(null)).toBeNull();
    expect(parseTripWeather(undefined)).toBeNull();
    expect(parseTripWeather("")).toBeNull();
    expect(parseTripWeather("{kaputt")).toBeNull();
    expect(parseTripWeather('"nur ein String"')).toBeNull();
    expect(parseTripWeather("[1,2]")).toBeNull();
  });

  it("verwirft unplausible Wertebereiche", () => {
    expect(parseTripWeather(JSON.stringify({ ...valid, tMax: 80 }))).toBeNull();
    expect(
      parseTripWeather(JSON.stringify({ ...valid, tMin: -80 }))
    ).toBeNull();
    // tMin über tMax ist widersprüchlich
    expect(
      parseTripWeather(JSON.stringify({ ...valid, tMin: 40, tMax: 20 }))
    ).toBeNull();
    expect(
      parseTripWeather(JSON.stringify({ ...valid, rainDays: -1 }))
    ).toBeNull();
    expect(
      parseTripWeather(JSON.stringify({ ...valid, rainDays: 2.5 }))
    ).toBeNull();
    expect(
      parseTripWeather(
        JSON.stringify({
          ...valid,
          totalPrecip: TRIP_WEATHER_MAX_PRECIP_MM + 1,
        })
      )
    ).toBeNull();
  });

  it("verwirft fehlende Felder", () => {
    expect(parseTripWeather(JSON.stringify({ tMax: 20, tMin: 10 }))).toBeNull();
  });
});

describe("weatherLuck", () => {
  const archive = (
    tMax: number,
    rainDays: number,
    tMin = 8,
    totalPrecip = rainDays * 5
  ) => JSON.stringify({ tMax, tMin, rainDays, totalPrecip });

  it("aggregiert Trocken-Anteil, Ø-Tagesmaximum und wärmsten Trip", () => {
    const luck = weatherLuck([
      // 3 Nächte → 4 Campingtage, 1 Regentag
      {
        startDate: "2025-07-01",
        endDate: "2025-07-04",
        placeName: "Tessin",
        weatherJson: archive(31, 1),
      },
      // 1 Nacht → 2 Campingtage, 0 Regentage
      {
        startDate: "2025-08-10",
        endDate: "2025-08-11",
        placeName: "Berner Oberland",
        weatherJson: archive(24, 0),
      },
    ]);
    expect(luck).toEqual({
      trips: 2,
      totalDays: 6,
      dryDays: 5,
      dryShare: 5 / 6,
      avgTMax: 27.5,
      warmest: { place: "Tessin", tMax: 31 },
    });
  });

  it("liefert null ohne (gültiges) Wetterarchiv", () => {
    expect(weatherLuck([])).toBeNull();
    expect(
      weatherLuck([
        { startDate: "2025-07-01", endDate: "2025-07-04" },
        {
          startDate: "2025-07-10",
          endDate: "2025-07-12",
          weatherJson: "{kaputt",
        },
        {
          startDate: "2025-07-20",
          endDate: "2025-07-22",
          weatherJson: JSON.stringify({
            tMax: 999,
            tMin: 5,
            rainDays: 0,
            totalPrecip: 0,
          }),
        },
      ])
    ).toBeNull();
  });

  it("überspringt Trips ohne Archiv, zählt die übrigen", () => {
    const luck = weatherLuck([
      { startDate: "2025-07-01", endDate: "2025-07-02" },
      {
        startDate: "2025-07-10",
        endDate: "2025-07-11",
        placeName: "Jura",
        weatherJson: archive(19, 2),
      },
    ]);
    expect(luck?.trips).toBe(1);
    expect(luck?.warmest).toEqual({ place: "Jura", tMax: 19 });
  });

  it("klemmt Regentage auf die Campingtage (dryShare nie < 0)", () => {
    // Tagesausflug (gleicher Tag = 1 Campingtag), Archiv meldet 3 Regentage
    const luck = weatherLuck([
      {
        startDate: "2025-07-01",
        endDate: "2025-07-01",
        weatherJson: archive(15, 3),
      },
    ]);
    expect(luck?.totalDays).toBe(1);
    expect(luck?.dryDays).toBe(0);
    expect(luck?.dryShare).toBe(0);
  });

  it("bei Gleichstand des Tagesmaximums gewinnt der erste Trip", () => {
    const luck = weatherLuck([
      {
        startDate: "2025-06-01",
        endDate: "2025-06-03",
        placeName: "Wallis",
        weatherJson: archive(28, 0),
      },
      {
        startDate: "2025-09-01",
        endDate: "2025-09-03",
        placeName: "Graubünden",
        weatherJson: archive(28, 1),
      },
    ]);
    expect(luck?.warmest).toEqual({ place: "Wallis", tMax: 28 });
  });

  it("fehlender Ortsname → leerer place, Ø wird gerundet", () => {
    const luck = weatherLuck([
      {
        startDate: "2025-07-01",
        endDate: "2025-07-02",
        weatherJson: archive(22.3, 0),
      },
      {
        startDate: "2025-07-10",
        endDate: "2025-07-11",
        weatherJson: archive(22.2, 0),
      },
    ]);
    expect(luck?.avgTMax).toBe(22.3);
    expect(luck?.warmest).toEqual({ place: "", tMax: 22.3 });
  });
});
