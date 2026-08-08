import { describe, expect, it } from "vitest";
import {
  bathingComfort,
  hydroLatestUrl,
  marineWaterUrl,
  MAX_STATION_DISTANCE_M,
  nearestWaterStation,
  parseHydroLatest,
  parseMarineWater,
  tideExtremes,
  TIDE_MIN_RANGE_M,
  waveLevel,
  TREND_THRESHOLD_C,
  waterStations,
  waterTrend,
  type WaterStation,
} from "@shared/bathingWater";

describe("waterStations", () => {
  it("hat einen sauberen Datensatz mit eindeutigen Nummern", () => {
    expect(waterStations.length).toBeGreaterThan(200);
    const ids = new Set(waterStations.map(s => s.id));
    expect(ids.size).toBe(waterStations.length);
    waterStations.forEach(station => {
      expect(station.name.length).toBeGreaterThan(0);
      expect(station.waterBody.length).toBeGreaterThan(0);
      // Alle Messstellen liegen in der Schweiz
      expect(station.latitude).toBeGreaterThan(45.7);
      expect(station.latitude).toBeLessThan(47.9);
      expect(station.longitude).toBeGreaterThan(5.8);
      expect(station.longitude).toBeLessThan(10.6);
    });
  });

  it("enthält See- und Fluss-Messstellen und solche mit Temperatur", () => {
    expect(waterStations.some(s => s.type === "lake")).toBe(true);
    expect(waterStations.some(s => s.type === "river")).toBe(true);
    expect(
      waterStations.filter(s => s.measuresTemperature).length
    ).toBeGreaterThan(50);
  });
});

describe("nearestWaterStation", () => {
  const stations: WaterStation[] = [
    {
      id: "nah-ohne",
      name: "Nah ohne Temperatur",
      waterBody: "Bach",
      type: "river",
      latitude: 47.0,
      longitude: 8.0,
      measuresTemperature: false,
    },
    {
      id: "mittel-mit",
      name: "Etwas weiter mit Temperatur",
      waterBody: "See",
      type: "lake",
      latitude: 47.05,
      longitude: 8.0,
      measuresTemperature: true,
    },
    {
      id: "fern-mit",
      name: "Weit weg",
      waterBody: "Fluss",
      type: "river",
      latitude: 47.9,
      longitude: 8.0,
      measuresTemperature: true,
    },
  ];

  it("bevorzugt die nächste Stelle MIT Wassertemperatur", () => {
    const found = nearestWaterStation(47.0, 8.0, { stations });
    expect(found?.station.id).toBe("mittel-mit");
    expect(found?.distanceM).toBeGreaterThan(5000);
    expect(found?.distanceM).toBeLessThan(6000);
  });

  it("nimmt eine reine Pegel-Stelle, wenn keine Temperatur in Reichweite ist", () => {
    const found = nearestWaterStation(47.0, 8.0, {
      stations: [stations[0], stations[2]],
    });
    expect(found?.station.id).toBe("nah-ohne");
  });

  it("liefert mit requireTemperature nur Temperatur-Stellen", () => {
    const found = nearestWaterStation(47.0, 8.0, {
      stations: [stations[0]],
      requireTemperature: true,
    });
    expect(found).toBeNull();
  });

  it("gibt ausserhalb des Umkreises nichts zurück", () => {
    // 47.5°N liegt von allen drei Test-Stellen mehr als 40 km entfernt
    expect(
      nearestWaterStation(47.5, 8.0, { stations, maxDistanceM: 1000 })
    ).toBeNull();
    // Mitten im Atlantik ist keine Schweizer Messstelle in der Nähe
    expect(nearestWaterStation(30, -40)).toBeNull();
  });

  it("verträgt kaputte Koordinaten und leere Listen", () => {
    expect(nearestWaterStation(Number.NaN, 8.0, { stations })).toBeNull();
    expect(nearestWaterStation(47.0, 8.0, { stations: [] })).toBeNull();
  });

  it("findet im echten Datensatz die Stelle am Vierwaldstättersee", () => {
    const found = nearestWaterStation(47.0502, 8.3093);
    expect(found).not.toBeNull();
    expect(found!.distanceM).toBeLessThan(MAX_STATION_DISTANCE_M);
    expect(found!.station.measuresTemperature).toBe(true);
  });
});

describe("hydroLatestUrl und parseHydroLatest", () => {
  it("fragt genau eine Stelle mit den nötigen Parametern ab", () => {
    const url = hydroLatestUrl("2135");
    expect(url).toContain("api.existenz.ch/apiv1/hydro/latest");
    expect(url).toContain("locations=2135");
    expect(url).toContain("temperature");
    expect(url).toContain("flow");
    expect(url).toContain("height");
    expect(url).toContain("app=CampMesser");
  });

  it("liest Temperatur, Abfluss und Pegel der richtigen Stelle", () => {
    const reading = parseHydroLatest(
      {
        payload: [
          { timestamp: 1785768600, loc: "2135", par: "temperature", val: 21.4 },
          { timestamp: 1785768600, loc: "2135", par: "flow", val: 194.5 },
          { timestamp: 1785769200, loc: "2135", par: "height", val: 502.1 },
          { timestamp: 1785768600, loc: "9999", par: "temperature", val: 4 },
        ],
      },
      "2135"
    );
    expect(reading.temperatureC).toBe(21.4);
    expect(reading.flowM3s).toBe(194.5);
    expect(reading.levelMasl).toBe(502.1);
    // Der jüngste Zeitstempel der übernommenen Werte gewinnt
    expect(reading.measuredAtMs).toBe(1785769200000);
  });

  it("ignoriert unbekannte Parameter und kaputte Werte", () => {
    const reading = parseHydroLatest(
      {
        payload: [
          { timestamp: 1785768600, loc: "2135", par: "acidity", val: 8.5 },
          { timestamp: 1785768600, loc: "2135", par: "temperature", val: null },
          { timestamp: "kaputt", loc: "2135", par: "flow", val: 12 },
        ],
      },
      "2135"
    );
    expect(reading.temperatureC).toBeNull();
    expect(reading.flowM3s).toBe(12);
    // Kaputter Zeitstempel darf keinen Zeitpunkt erfinden
    expect(reading.measuredAtMs).toBeNull();
  });

  it("verträgt fehlende und kaputte Antworten", () => {
    expect(parseHydroLatest(null, "2135").temperatureC).toBeNull();
    expect(parseHydroLatest({}, "2135").flowM3s).toBeNull();
    expect(parseHydroLatest({ payload: "nein" }, "2135").levelMasl).toBeNull();
  });
});

describe("marineWaterUrl und parseMarineWater", () => {
  it("fragt aktuellen Wert und Verlauf ab", () => {
    const url = marineWaterUrl(43.5432, 7.1234);
    expect(url).toContain("marine-api.open-meteo.com/v1/marine");
    expect(url).toContain("latitude=43.5432");
    expect(url).toContain("current=sea_surface_temperature");
    expect(url).toContain("past_days=1");
  });

  it("liest den aktuellen Wert samt Vergleichswert von vor sechs Stunden", () => {
    const marine = parseMarineWater({
      current: { time: "2026-08-03T15:00", sea_surface_temperature: 24.5 },
      hourly: {
        time: ["2026-08-03T09:00", "2026-08-03T12:00", "2026-08-03T15:00"],
        sea_surface_temperature: [23.1, 23.9, 24.5],
      },
    });
    expect(marine?.temperatureC).toBe(24.5);
    expect(marine?.measuredAtMs).toBe(Date.parse("2026-08-03T15:00Z"));
    expect(marine?.previousC).toBe(23.1);
  });

  it("gibt über Land (lauter null) nichts zurück", () => {
    expect(
      parseMarineWater({
        current: { time: "2026-08-03T15:00", sea_surface_temperature: null },
      })
    ).toBeNull();
    expect(parseMarineWater({})).toBeNull();
    expect(parseMarineWater(null)).toBeNull();
  });

  it("kommt ohne Verlauf aus", () => {
    const marine = parseMarineWater({
      current: { time: "2026-08-03T15:00", sea_surface_temperature: 24.5 },
    });
    expect(marine?.previousC).toBeNull();
  });
});

describe("waterTrend", () => {
  it("erkennt steigend, fallend und gleichbleibend", () => {
    expect(waterTrend(21, 20)).toBe("rising");
    expect(waterTrend(20, 21)).toBe("falling");
    expect(waterTrend(20.1, 20)).toBe("steady");
  });

  it("nimmt die Schwelle genau", () => {
    expect(waterTrend(20 + TREND_THRESHOLD_C, 20)).toBe("rising");
    expect(waterTrend(20 + TREND_THRESHOLD_C - 0.01, 20)).toBe("steady");
  });

  it("behauptet ohne Vergleichswert nichts", () => {
    expect(waterTrend(21, null)).toBe("unknown");
    expect(waterTrend(21, Number.NaN)).toBe("unknown");
  });
});

describe("bathingComfort", () => {
  it("staffelt von kalt bis warm", () => {
    expect(bathingComfort(9)).toBe("cold");
    expect(bathingComfort(14.9)).toBe("cold");
    expect(bathingComfort(15)).toBe("brisk");
    expect(bathingComfort(19)).toBe("pleasant");
    expect(bathingComfort(23)).toBe("warm");
    expect(bathingComfort(28)).toBe("warm");
  });
});

describe("Wellen (#451)", () => {
  it("liest Wellenhöhe und -richtung aus der Marine-Antwort", () => {
    const marine = parseMarineWater({
      current: {
        time: "2026-08-08T10:00",
        sea_surface_temperature: 24.1,
        wave_height: 0.7,
        wave_direction: 370,
      },
    });
    expect(marine?.waveHeightM).toBe(0.7);
    // 370° wird auf 10° normalisiert
    expect(marine?.waveDirectionDeg).toBe(10);
  });

  it("lässt fehlende oder kaputte Wellen-Werte ehrlich null", () => {
    const marine = parseMarineWater({
      current: {
        time: "2026-08-08T10:00",
        sea_surface_temperature: 24.1,
        wave_height: -1,
        wave_direction: 90,
      },
    });
    expect(marine?.waveHeightM).toBeNull();
    // Ohne Höhe gibt es auch keine Richtung
    expect(marine?.waveDirectionDeg).toBeNull();
  });

  it("stuft die Wellenhöhe fürs Baden ein", () => {
    expect(waveLevel(0.2)).toBe("calm");
    expect(waveLevel(0.8)).toBe("moderate");
    expect(waveLevel(1.6)).toBe("rough");
  });
});

describe("tideExtremes (#462)", () => {
  /** Stunden-Reihe ab 00:00 UTC am 8.8.2026 mit gegebenen Höhen. */
  const series = (heights: number[]) => ({
    times: heights.map((_, i) => `2026-08-08T${String(i).padStart(2, "0")}:00`),
    heights,
  });
  const atHour = (h: number) =>
    Date.parse(`2026-08-08T${String(h).padStart(2, "0")}:00Z`);

  it("findet das nächste Hoch- und Niedrigwasser nach «jetzt»", () => {
    // Flut bei Stunde 4, Ebbe bei Stunde 10, wieder Flut bei 16
    const { times, heights } = series([
      0.2, 0.6, 1.0, 1.3, 1.5, 1.3, 1.0, 0.6, 0.3, 0.1, 0.0, 0.2, 0.5, 0.9, 1.2,
      1.4, 1.5, 1.3, 1.0,
    ]);
    const extremes = tideExtremes(times, heights, atHour(5));
    expect(extremes).toHaveLength(2);
    expect(extremes[0]).toEqual({
      kind: "low",
      timeMs: atHour(10),
      heightM: 0.0,
    });
    expect(extremes[1].kind).toBe("high");
    expect(extremes[1].timeMs).toBe(atHour(16));
  });

  it("meldet nichts bei winzigem Tidenhub (Mittelmeer)", () => {
    const { times, heights } = series([
      0.1, 0.15, 0.2, 0.15, 0.1, 0.05, 0.0, 0.05, 0.1, 0.15, 0.2, 0.15,
    ]);
    // Hub 0.2 m liegt unter der Schwelle
    expect(0.2).toBeLessThan(TIDE_MIN_RANGE_M);
    expect(tideExtremes(times, heights, atHour(1))).toEqual([]);
  });

  it("zählt ein Plateau am Scheitel nur einmal und ignoriert Kaputtes", () => {
    const { times, heights } = series([
      0.0, 0.8, 1.5, 1.5, 0.8, 0.0, 0.8, 1.5, 0.8,
    ]);
    const extremes = tideExtremes(times, heights, atHour(0), 5);
    expect(extremes.map(e => e.kind)).toEqual(["high", "low", "high"]);
    expect(extremes[0].timeMs).toBe(atHour(2));
    // Unbrauchbare Reihen bleiben leer statt zu raten
    expect(tideExtremes(["kaputt"], [1], atHour(0))).toEqual([]);
    expect(tideExtremes([], [], atHour(0))).toEqual([]);
  });

  it("hängt die Gezeiten an parseMarineWater an", () => {
    const heights = [
      0.2, 0.6, 1.0, 1.3, 1.5, 1.3, 1.0, 0.6, 0.3, 0.1, 0.0, 0.2, 0.5,
    ];
    const marine = parseMarineWater({
      current: { time: "2026-08-08T05:00", sea_surface_temperature: 21.4 },
      hourly: {
        time: heights.map(
          (_, i) => `2026-08-08T${String(i).padStart(2, "0")}:00`
        ),
        sea_level_height_msl: heights,
      },
    });
    expect(marine?.tides).toHaveLength(1);
    expect(marine?.tides[0].kind).toBe("low");
  });
});
