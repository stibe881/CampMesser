import { describe, expect, it } from "vitest";
import {
  MAX_ROUTE_WEATHER_POINTS,
  ROUTE_SPEED_KMH,
  etaAt,
  hourIndexFor,
  hourRisk,
  routeMinutes,
  sampleRoutePoints,
  worstSeverity,
} from "@shared/routeWeather";
import type { HourlyWeather } from "@shared/weather";

/** Eine Prognosestunde mit den Feldern, die auf der Strecke zählen. */
const hour = (
  time: string,
  overrides: Partial<HourlyWeather> = {}
): HourlyWeather => ({
  time,
  temperatureC: 18,
  apparentC: 18,
  precipitationMm: 0,
  precipitationProbability: 0,
  windSpeedKmh: 10,
  windGustsKmh: 20,
  weatherCode: 1,
  cape: 0,
  cloudCover: 30,
  ...overrides,
});

describe("Unwetter auf der Fahrtstrecke (#275)", () => {
  it("wählt gleichmässig aus und behält Start und Ziel", () => {
    const points = Array.from({ length: 40 }, (_, i) => i);
    const sample = sampleRoutePoints(points);
    expect(sample).toHaveLength(MAX_ROUTE_WEATHER_POINTS);
    expect(sample[0]).toBe(0);
    expect(sample[sample.length - 1]).toBe(39);
    // Kürzere Listen bleiben unverändert
    expect(sampleRoutePoints([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("schätzt die Ankunftszeit entlang der Strecke", () => {
    const start = Date.UTC(2026, 7, 4, 8, 0);
    // 140 km bei 70 km/h sind zwei Stunden
    expect(etaAt(start, 140, 0)).toBe(start);
    expect(etaAt(start, 140, 1)).toBe(start + 2 * 3_600_000);
    expect(etaAt(start, 140, 0.5)).toBe(start + 3_600_000);
    // Anteile ausserhalb 0…1 werden geklemmt
    expect(etaAt(start, 140, 2)).toBe(start + 2 * 3_600_000);
    expect(routeMinutes(140)).toBe(120);
    expect(routeMinutes(ROUTE_SPEED_KMH)).toBe(60);
  });

  it("findet die Prognosestunde, die der Ankunft am nächsten liegt", () => {
    const hours = [
      hour("2026-08-04T08:00"),
      hour("2026-08-04T09:00"),
      hour("2026-08-04T10:00"),
    ];
    const target = new Date("2026-08-04T09:20").getTime();
    expect(hourIndexFor(hours, target)).toBe(1);
  });

  it("gibt lieber nichts aus, als eine Stunde zu weit zu greifen", () => {
    const hours = [hour("2026-08-04T08:00")];
    const farAway = new Date("2026-08-05T20:00").getTime();
    expect(hourIndexFor(hours, farAway)).toBeNull();
    expect(hourIndexFor([], Date.now())).toBeNull();
  });

  it("erkennt Gewitter, Sturm, Starkregen und Schnee", () => {
    expect(hourRisk(hour("x", { weatherCode: 95 }))).toEqual({
      kind: "gewitter",
      severity: "gefahr",
    });
    expect(hourRisk(hour("x", { windGustsKmh: 95 }))).toEqual({
      kind: "sturm",
      severity: "gefahr",
    });
    expect(hourRisk(hour("x", { weatherCode: 73 }))).toEqual({
      kind: "schnee",
      severity: "warnung",
    });
    expect(hourRisk(hour("x", { precipitationMm: 20 }))).toEqual({
      kind: "regen",
      severity: "gefahr",
    });
    expect(hourRisk(hour("x", { windGustsKmh: 65 }))).toEqual({
      kind: "sturm",
      severity: "warnung",
    });
    expect(hourRisk(hour("x", { precipitationMm: 8 }))).toEqual({
      kind: "regen",
      severity: "warnung",
    });
  });

  it("ruhige Stunden bleiben ruhig", () => {
    expect(hourRisk(hour("x"))).toBeNull();
    expect(
      hourRisk(hour("x", { precipitationMm: 1, windGustsKmh: 30 }))
    ).toBeNull();
  });

  it("Gewitter geht dem Regen vor, weil es am Steuer gefährlicher ist", () => {
    const stormy = hour("x", { weatherCode: 95, precipitationMm: 20 });
    expect(hourRisk(stormy)?.kind).toBe("gewitter");
  });

  it("bestimmt die schlimmste Stufe der ganzen Strecke", () => {
    expect(
      worstSeverity([
        null,
        { kind: "regen", severity: "warnung" },
        { kind: "gewitter", severity: "gefahr" },
      ])
    ).toBe("gefahr");
    expect(worstSeverity([null, { kind: "regen", severity: "warnung" }])).toBe(
      "warnung"
    );
    expect(worstSeverity([null, null])).toBeNull();
    expect(worstSeverity([])).toBeNull();
  });
});
