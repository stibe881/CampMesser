import { describe, expect, it } from "vitest";
import {
  DEFAULT_SOLAR_PANEL,
  DEFAULT_SYSTEM_EFFICIENCY,
  MJ_PER_KWH,
  SOLAR_LOSS_STEPS,
  averageYieldWh,
  dailyYieldWh,
  openMeteoAzimuth,
  parseSolarForecast,
  sanitizeSolarPanel,
  solarBalance,
  solarForecastUrl,
  systemEfficiency,
  yieldFromSunHours,
} from "@shared/solarForecast";

describe("systemEfficiency", () => {
  it("ist das Produkt der einzelnen Verlustschritte", () => {
    const manual = SOLAR_LOSS_STEPS.reduce(
      (product, step) => product * (1 - step.lossPercent / 100),
      1
    );
    expect(DEFAULT_SYSTEM_EFFICIENCY).toBeCloseTo(manual, 4);
  });

  it("liegt in der Grössenordnung der Faustregel «rechne mit 70 %»", () => {
    expect(DEFAULT_SYSTEM_EFFICIENCY).toBeGreaterThan(0.6);
    expect(DEFAULT_SYSTEM_EFFICIENCY).toBeLessThan(0.8);
  });

  it("hat für jeden Schritt einen plausiblen Verlust", () => {
    const keys = SOLAR_LOSS_STEPS.map(s => s.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const step of SOLAR_LOSS_STEPS) {
      expect(step.lossPercent).toBeGreaterThan(0);
      expect(step.lossPercent).toBeLessThan(30);
    }
  });

  it("rechnet mit eigenen Schritten", () => {
    expect(systemEfficiency([{ key: "cable", lossPercent: 50 }])).toBe(0.5);
    expect(systemEfficiency([])).toBe(1);
  });
});

describe("openMeteoAzimuth", () => {
  it("übersetzt die Kompass-Konvention (0 = Nord) nach Open-Meteo (0 = Süd)", () => {
    expect(openMeteoAzimuth(180)).toBe(0);
    expect(openMeteoAzimuth(90)).toBe(-90);
    expect(openMeteoAzimuth(270)).toBe(90);
  });

  it("bleibt für Nord im Bereich −180…180", () => {
    expect(Math.abs(openMeteoAzimuth(0))).toBe(180);
    expect(openMeteoAzimuth(360)).toBe(180);
  });
});

describe("solarForecastUrl", () => {
  it("holt Sonnenschein und Einstrahlung im selben Abruf", () => {
    const url = solarForecastUrl(46.8182, 8.2275, 5);
    expect(url).toContain("api.open-meteo.com/v1/forecast");
    expect(url).toContain("daily=sunshine_duration%2Cshortwave_radiation_sum");
    expect(url).toContain("forecast_days=5");
    expect(url).not.toContain("tilt");
  });

  it("fragt bei bekannter Ausrichtung die geneigte Fläche ab", () => {
    const url = solarForecastUrl(46.8182, 8.2275, 3, {
      tilt: 35,
      azimuth: 180,
    });
    expect(url).toContain("hourly=global_tilted_irradiance");
    expect(url).toContain("tilt=35");
    expect(url).toContain("azimuth=0");
  });

  it("begrenzt die Prognosetage", () => {
    expect(solarForecastUrl(0, 0, 99)).toContain("forecast_days=16");
    expect(solarForecastUrl(0, 0, 0)).toContain("forecast_days=1");
  });
});

describe("parseSolarForecast", () => {
  const dailyJson = {
    daily: {
      time: ["2026-08-03", "2026-08-04"],
      sunshine_duration: [36000, 18000],
      shortwave_radiation_sum: [21.6, 10.8],
    },
  };

  it("rechnet die Tagessumme von MJ/m² in kWh/m² um", () => {
    const days = parseSolarForecast(dailyJson);
    expect(days).toHaveLength(2);
    expect(days[0].irradiationKwhPerM2).toBe(21.6 / MJ_PER_KWH);
    expect(days[0].sunshineHours).toBe(10);
    expect(days[0].tilted).toBe(false);
    expect(days[1].irradiationKwhPerM2).toBe(3);
  });

  it("lässt die stündliche Einstrahlung auf der geneigten Fläche vorgehen", () => {
    const days = parseSolarForecast({
      ...dailyJson,
      hourly: {
        time: ["2026-08-03T10:00", "2026-08-03T11:00", "2026-08-04T10:00"],
        global_tilted_irradiance: [800, 700, 500],
      },
    });
    expect(days[0].tilted).toBe(true);
    expect(days[0].irradiationKwhPerM2).toBe(1.5);
    expect(days[1].irradiationKwhPerM2).toBe(0.5);
  });

  it("verträgt Lücken und Unsinn", () => {
    expect(parseSolarForecast(null)).toEqual([]);
    expect(parseSolarForecast({})).toEqual([]);
    const days = parseSolarForecast({
      daily: {
        time: ["2026-08-03"],
        shortwave_radiation_sum: [null],
      },
    });
    expect(days[0].irradiationKwhPerM2).toBe(0);
    expect(days[0].sunshineHours).toBeNull();
  });
});

describe("dailyYieldWh", () => {
  it("rechnet Nennleistung mal Einstrahlung mal Wirkungsgrad", () => {
    expect(dailyYieldWh(400, 5, 0.7)).toBe(1400);
  });

  it("nutzt ohne Angabe den Vorgabe-Wirkungsgrad", () => {
    expect(dailyYieldWh(400, 5)).toBe(
      Math.round(400 * 5 * DEFAULT_SYSTEM_EFFICIENCY)
    );
  });

  it("gibt ohne Panel oder ohne Sonne null zurück", () => {
    expect(dailyYieldWh(0, 5)).toBe(0);
    expect(dailyYieldWh(400, 0)).toBe(0);
    expect(dailyYieldWh(-400, 5)).toBe(0);
  });

  it("rechnet effektive Sonnenstunden wie 1 kWh/m² je Stunde", () => {
    expect(yieldFromSunHours(400, 5, 0.7)).toBe(dailyYieldWh(400, 5, 0.7));
    expect(yieldFromSunHours(400, -3)).toBe(0);
  });
});

describe("solarBalance", () => {
  const days = (yields: number[]) =>
    yields.map((yieldWh, i) => ({
      date: `2026-08-0${i + 3}`,
      yieldWh,
    }));

  it("stellt Ertrag und Verbrauch gegenüber und führt den Speicher mit", () => {
    const result = solarBalance({
      days: days([600, 200, 100]),
      dailyConsumptionWh: 400,
      startWh: 900,
      usableWh: 900,
    });
    expect(result.days[0].netWh).toBe(200);
    // Tag 1 lädt auf 900 (Deckel), Tag 2 verliert 200, Tag 3 verliert 300
    expect(result.days.map(d => d.batteryWh)).toEqual([900, 700, 400]);
    expect(result.days[0].wastedWh).toBe(200);
    expect(result.totalYieldWh).toBe(900);
    expect(result.totalConsumptionWh).toBe(1200);
    expect(result.netWh).toBe(-300);
    expect(result.covered).toBe(true);
    expect(result.firstEmptyDate).toBeNull();
    expect(result.coveredDays).toBe(3);
  });

  it("merkt sich den ersten Tag, an dem der Speicher leer ist", () => {
    const result = solarBalance({
      days: days([100, 100, 100, 100]),
      dailyConsumptionWh: 500,
      startWh: 900,
      usableWh: 1000,
    });
    // 900 → 500 → 100 → an Tag 3 reicht es nicht mehr für die vollen 400 Wh
    expect(result.days.map(d => d.empty)).toEqual([false, false, true, true]);
    expect(result.firstEmptyDate).toBe("2026-08-05");
    expect(result.coveredDays).toBe(2);
    expect(result.covered).toBe(false);
  });

  it("rechnet den Prozentstand auf die nutzbare Kapazität", () => {
    const result = solarBalance({
      days: days([0]),
      dailyConsumptionWh: 250,
      startWh: 1000,
      usableWh: 1000,
    });
    expect(result.days[0].batteryPercent).toBe(75);
  });

  it("verwirft Überschuss, sobald der Speicher voll ist", () => {
    const result = solarBalance({
      days: days([2000, 2000]),
      dailyConsumptionWh: 0,
      startWh: 500,
      usableWh: 1000,
    });
    expect(result.wastedWh).toBe(1500 + 2000);
    expect(result.days[1].batteryWh).toBe(1000);
  });

  it("liefert ohne Speicher-Angaben trotzdem die Summen", () => {
    const result = solarBalance({
      days: days([300, 300]),
      dailyConsumptionWh: 500,
      startWh: null,
      usableWh: null,
    });
    expect(result.totalYieldWh).toBe(600);
    expect(result.netWh).toBe(-400);
    expect(result.days[0].batteryWh).toBeNull();
    expect(result.days[0].batteryPercent).toBeNull();
    expect(result.firstEmptyDate).toBeNull();
  });

  it("bleibt ohne Prognosetage leer", () => {
    const result = solarBalance({
      days: [],
      dailyConsumptionWh: 500,
      startWh: 900,
      usableWh: 900,
    });
    expect(result.days).toEqual([]);
    expect(result.totalYieldWh).toBe(0);
    expect(result.covered).toBe(true);
    expect(result.coveredDays).toBe(0);
  });
});

describe("averageYieldWh", () => {
  it("mittelt die Erträge", () => {
    expect(averageYieldWh([{ yieldWh: 100 }, { yieldWh: 300 }])).toBe(200);
  });

  it("bleibt ohne Tage bei null", () => {
    expect(averageYieldWh([])).toBe(0);
  });
});

describe("sanitizeSolarPanel", () => {
  it("gibt bei Unsinn die Vorgabe zurück", () => {
    expect(sanitizeSolarPanel(null)).toEqual(DEFAULT_SOLAR_PANEL);
    expect(sanitizeSolarPanel("kaputt")).toEqual(DEFAULT_SOLAR_PANEL);
  });

  it("räumt kaputte Felder auf", () => {
    expect(sanitizeSolarPanel({ watts: -5, mount: "unfug" })).toEqual({
      watts: null,
      mount: "roof",
    });
    expect(sanitizeSolarPanel({ watts: 999999, mount: "portable" })).toEqual({
      watts: 20000,
      mount: "portable",
    });
  });
});
