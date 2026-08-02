import { describe, expect, it } from "vitest";
import {
  describeUvIndex,
  describeWeatherCode,
  detectAlerts,
  uvLevelForIndex,
  type HourlyWeather,
} from "../shared/weather";
import { calcWaterNeeds } from "../shared/calculators";

function hour(overrides: Partial<HourlyWeather> = {}, i = 0): HourlyWeather {
  return {
    time: new Date(Date.now() + i * 3600000).toISOString(),
    temperatureC: 20,
    apparentC: 20,
    precipitationMm: 0,
    precipitationProbability: 0,
    windSpeedKmh: 10,
    windGustsKmh: 20,
    weatherCode: 1,
    cape: 100,
    cloudCover: 30,
    ...overrides,
  };
}

describe("describeWeatherCode", () => {
  it("übersetzt zentrale WMO-Codes ins Deutsche", () => {
    expect(describeWeatherCode(0).label).toBe("Klarer Himmel");
    expect(describeWeatherCode(63).label).toBe("Regen");
    expect(describeWeatherCode(95).label).toBe("Gewitter");
    expect(describeWeatherCode(96).label).toBe("Gewitter mit Hagel");
  });
});

describe("uvLevelForIndex / describeUvIndex", () => {
  it("ordnet die WHO-Stufen korrekt zu (gerundet)", () => {
    expect(uvLevelForIndex(0)).toBe("niedrig");
    expect(uvLevelForIndex(2.4)).toBe("niedrig"); // rundet auf 2
    expect(uvLevelForIndex(2.6)).toBe("maessig"); // rundet auf 3
    expect(uvLevelForIndex(5)).toBe("maessig");
    expect(uvLevelForIndex(6)).toBe("hoch");
    expect(uvLevelForIndex(7.4)).toBe("hoch");
    expect(uvLevelForIndex(8)).toBe("sehrHoch");
    expect(uvLevelForIndex(10)).toBe("sehrHoch");
    expect(uvLevelForIndex(11)).toBe("extrem");
    expect(uvLevelForIndex(13.5)).toBe("extrem");
  });

  it("liefert deutsche Labels als Default", () => {
    expect(describeUvIndex(1).label).toBe("Niedrig");
    expect(describeUvIndex(4).label).toBe("Mässig");
    expect(describeUvIndex(7).label).toBe("Hoch");
    expect(describeUvIndex(9).label).toBe("Sehr hoch");
    expect(describeUvIndex(12).label).toBe("Extrem");
  });

  it("gibt Schutzhinweise erst ab Stufe «hoch»", () => {
    expect(describeUvIndex(2).advice).toBeNull();
    expect(describeUvIndex(5).advice).toBeNull();
    expect(describeUvIndex(6).advice).toContain("Sonnencreme");
    expect(describeUvIndex(9).advice).toContain("Schatten");
    expect(describeUvIndex(11).advice).toContain("Mittagssonne");
  });

  it("übersetzt Labels und Hinweise in die gewählte Sprache", () => {
    expect(describeUvIndex(7, "fr").label).toBe("Élevé");
    expect(describeUvIndex(7, "it").label).toBe("Alto");
    expect(describeUvIndex(7, "en").label).toBe("High");
    expect(describeUvIndex(7, "en").advice).toContain("sunscreen");
  });
});

describe("detectAlerts", () => {
  it("meldet keine Warnungen bei ruhigem Wetter", () => {
    const hours = Array.from({ length: 48 }, (_, i) => hour({}, i));
    expect(detectAlerts(hours)).toHaveLength(0);
  });

  it("erkennt Sturmböen als Gefahr", () => {
    const hours = Array.from({ length: 48 }, (_, i) =>
      hour({ windGustsKmh: i === 5 ? 95 : 20 }, i)
    );
    const alerts = detectAlerts(hours);
    expect(alerts.some(a => a.id === "sturm" && a.severity === "gefahr")).toBe(
      true
    );
  });

  it("erkennt Gewitter über den WMO-Code", () => {
    const hours = Array.from({ length: 48 }, (_, i) =>
      hour({ weatherCode: i === 10 ? 95 : 1 }, i)
    );
    const alerts = detectAlerts(hours);
    expect(alerts.some(a => a.id === "gewitter")).toBe(true);
  });

  it("erkennt Starkregen und sortiert Gefahr vor Info", () => {
    const hours = Array.from({ length: 48 }, (_, i) =>
      hour(
        { precipitationMm: i === 3 ? 20 : 0, temperatureC: i === 30 ? -2 : 15 },
        i
      )
    );
    const alerts = detectAlerts(hours);
    expect(alerts[0].severity).toBe("gefahr");
    expect(alerts.some(a => a.id === "frost")).toBe(true);
  });
});

describe("calcWaterNeeds mit Hunden und Körperpflege", () => {
  it("rechnet Hunde-Wasserbedarf ein", () => {
    const base = calcWaterNeeds({
      adults: 2,
      children: 0,
      dogs: 0,
      days: 2,
      maxTempC: 20,
      activity: "ruhig",
      includeCookingHygiene: false,
    });
    const withDog = calcWaterNeeds({
      adults: 2,
      children: 0,
      dogs: 1,
      days: 2,
      maxTempC: 20,
      activity: "ruhig",
      includeCookingHygiene: false,
    });
    expect(withDog.dogLiters).toBeCloseTo(3.0, 1); // 1.5 l × 2 Tage
    expect(withDog.totalLiters).toBeGreaterThan(base.totalLiters);
  });

  it("rechnet komfortable Körperpflege mit 4 l pro Person und Tag", () => {
    const result = calcWaterNeeds({
      adults: 2,
      children: 1,
      days: 3,
      maxTempC: 18,
      activity: "ruhig",
      includeCookingHygiene: false,
      includeComfortHygiene: true,
    });
    expect(result.comfortHygieneLiters).toBe(3 * 4 * 3); // 3 Personen × 4 l × 3 Tage
  });

  it("bleibt abwärtskompatibel ohne neue Felder", () => {
    const result = calcWaterNeeds({
      adults: 1,
      children: 0,
      days: 1,
      maxTempC: 20,
      activity: "ruhig",
      includeCookingHygiene: false,
    });
    expect(result.dogLiters).toBe(0);
    expect(result.comfortHygieneLiters).toBe(0);
    expect(result.totalLiters).toBeCloseTo(2, 1);
  });
});
