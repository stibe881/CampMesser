import { describe, expect, it } from "vitest";
import {
  describeUvIndex,
  describeWeatherCode,
  detectAlerts,
  nextRainWindow,
  pressureTrend,
  PRESSURE_STEADY_HPA,
  PRESSURE_STRONG_HPA,
  uvLevelForIndex,
  type HourlyWeather,
  type RainSlot,
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

describe("detectAlerts mit eigenen Warn-Schwellen", () => {
  /** 48 ruhige Stunden mit einer auffälligen Stunde in der Mitte. */
  function withPeak(peak: Partial<HourlyWeather>) {
    return Array.from({ length: 48 }, (_, i) => hour(i === 6 ? peak : {}, i));
  }

  it("lässt die Standard-Schwellen unverändert (ohne thresholds)", () => {
    // 70 km/h: Warnung, aber keine Gefahr; 8 mm: Warnung, keine Gefahr
    const wind = detectAlerts(withPeak({ windGustsKmh: 70 }));
    expect(wind.some(a => a.id === "wind" && a.severity === "warnung")).toBe(
      true
    );
    const rain = detectAlerts(withPeak({ precipitationMm: 8 }));
    expect(rain.some(a => a.id === "regen" && a.severity === "warnung")).toBe(
      true
    );
  });

  it("meldet mit eigener Wind-Schwelle schon früher Gefahr", () => {
    const alerts = detectAlerts(withPeak({ windGustsKmh: 50 }), "de", {
      windKmh: 45,
    });
    expect(alerts.some(a => a.id === "sturm" && a.severity === "gefahr")).toBe(
      true
    );
    // Die Warnstufe rutscht nicht über die Gefahrenschwelle – nur eine Meldung
    expect(alerts.filter(a => a.id === "wind")).toHaveLength(0);
  });

  it("meldet mit eigener Regen-Schwelle schon früher Gefahr", () => {
    const alerts = detectAlerts(withPeak({ precipitationMm: 9 }), "de", {
      rainMm: 8,
    });
    expect(
      alerts.some(a => a.id === "starkregen" && a.severity === "gefahr")
    ).toBe(true);
    expect(alerts.filter(a => a.id === "regen")).toHaveLength(0);
  });

  it("schweigt mit höher gesetzten Schwellen bei sonst gefährlichen Werten", () => {
    const wind = detectAlerts(withPeak({ windGustsKmh: 95 }), "de", {
      windKmh: 140,
    });
    expect(wind.some(a => a.severity === "gefahr")).toBe(false);
    // Die Standard-Warnstufe (60 km/h) greift weiterhin
    expect(wind.some(a => a.id === "wind" && a.severity === "warnung")).toBe(
      true
    );
    const rain = detectAlerts(withPeak({ precipitationMm: 20 }), "de", {
      rainMm: 50,
    });
    expect(rain.some(a => a.severity === "gefahr")).toBe(false);
    expect(rain.some(a => a.id === "regen" && a.severity === "warnung")).toBe(
      true
    );
  });

  it("wirkt je Wetterart getrennt (nur Wind gesetzt)", () => {
    const alerts = detectAlerts(
      Array.from({ length: 48 }, (_, i) =>
        hour(i === 6 ? { windGustsKmh: 50, precipitationMm: 20 } : {}, i)
      ),
      "de",
      { windKmh: 45 }
    );
    expect(alerts.some(a => a.id === "sturm")).toBe(true);
    expect(
      alerts.some(a => a.id === "starkregen" && a.severity === "gefahr")
    ).toBe(true);
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

describe("nextRainWindow", () => {
  /** 15-Minuten-Slots ab 14:00 lokaler Zeit; mm[i] = Menge des i-ten Slots. */
  function slots(mm: number[]): RainSlot[] {
    const base = new Date(2026, 7, 2, 14, 0, 0, 0);
    return mm.map((precipitationMm, i) => ({
      time: new Date(base.getTime() + i * 15 * 60000).toISOString(),
      precipitationMm,
    }));
  }
  const now = new Date(2026, 7, 2, 14, 5, 0, 0); // im ersten Slot (14:00–14:15)

  it("meldet Regen, der bald beginnt (inkl. Ende)", () => {
    const result = nextRainWindow(slots([0, 0, 0.3, 0.5, 0]), now);
    expect(result).not.toBeNull();
    expect(result!.ongoing).toBe(false);
    expect(new Date(result!.startsAt!).getTime()).toBe(
      new Date(2026, 7, 2, 14, 30).getTime()
    );
    expect(new Date(result!.endsAt!).getTime()).toBe(
      new Date(2026, 7, 2, 15, 0).getTime()
    );
  });

  it("erkennt laufenden Regen und wann er aufhört", () => {
    const result = nextRainWindow(slots([0.4, 0.2, 0, 0]), now);
    expect(result).not.toBeNull();
    expect(result!.ongoing).toBe(true);
    expect(result!.startsAt).toBeNull();
    expect(new Date(result!.endsAt!).getTime()).toBe(
      new Date(2026, 7, 2, 14, 30).getTime()
    );
  });

  it("liefert null ohne Regen und bei leeren Daten", () => {
    expect(nextRainWindow(slots([0, 0.05, 0, 0]), now)).toBeNull();
    expect(nextRainWindow([], now)).toBeNull();
  });

  it("lässt endsAt offen, wenn der Regen die Datenreichweite überdauert", () => {
    const result = nextRainWindow(slots([0, 0.2, 0.4, 0.6]), now);
    expect(result!.ongoing).toBe(false);
    expect(result!.endsAt).toBeNull();
  });

  it("ignoriert bereits vergangene Slots", () => {
    // «now» liegt im dritten Slot – der Regen der ersten beiden ist vorbei
    const later = new Date(2026, 7, 2, 14, 35, 0, 0);
    const result = nextRainWindow(slots([0.5, 0.5, 0, 0.2, 0]), later);
    expect(result!.ongoing).toBe(false);
    expect(new Date(result!.startsAt!).getTime()).toBe(
      new Date(2026, 7, 2, 14, 45).getTime()
    );
  });
});

describe("pressureTrend", () => {
  /** Stundenwerte ab 14:00 lokaler Zeit; hPa[i] = Druck der i-ten Stunde. */
  function hours(hPa: (number | undefined)[]) {
    const base = new Date(2026, 7, 2, 14, 0, 0, 0);
    return hPa.map((pressureHpa, i) => ({
      time: new Date(base.getTime() + i * 3600000).toISOString(),
      pressureHpa,
    }));
  }
  const now = new Date(2026, 7, 2, 14, 20, 0, 0); // in der ersten Stunde

  it("erkennt gleichbleibenden Druck (|Δ| < 1 hPa/3 h)", () => {
    const trend = pressureTrend(hours([1013, 1013, 1012.7, 1012.5]), now);
    expect(trend).not.toBeNull();
    expect(trend!.direction).toBe("steady");
    expect(trend!.hPaPer3h).toBeCloseTo(-0.5, 5);
  });

  it("erkennt leicht fallenden Druck ab 1 hPa/3 h", () => {
    const trend = pressureTrend(hours([1015, 1014.4, 1013.8, 1013.2]), now);
    expect(trend!.direction).toBe("falling");
    expect(trend!.hPaPer3h).toBeCloseTo(-1.8, 5);
  });

  it("erkennt stark fallenden Druck (≥ 3 hPa/3 h)", () => {
    const trend = pressureTrend(hours([1010, 1008.5, 1007, 1005.5]), now);
    expect(trend!.direction).toBe("falling");
    expect(trend!.hPaPer3h).toBeCloseTo(-4.5, 5);
    expect(trend!.hPaPer3h).toBeLessThanOrEqual(-PRESSURE_STRONG_HPA);
  });

  it("erkennt steigenden Druck", () => {
    const trend = pressureTrend(hours([1005, 1006, 1007, 1008]), now);
    expect(trend!.direction).toBe("rising");
    expect(trend!.hPaPer3h).toBeCloseTo(3, 5);
  });

  it("liegt die Schwelle genau bei 1 hPa/3 h, gilt der Druck als fallend", () => {
    const trend = pressureTrend(hours([1013, 1012.7, 1012.3, 1012]), now);
    expect(trend!.direction).toBe("falling");
    expect(trend!.hPaPer3h).toBeCloseTo(-PRESSURE_STEADY_HPA, 5);
  });

  it("normiert ein kürzeres Fenster auf 3 Stunden", () => {
    // Nur zwei Stunden Vorlauf: −2 hPa/2 h entsprechen −3 hPa/3 h
    const trend = pressureTrend(hours([1010, 1009, 1008]), now);
    expect(trend!.direction).toBe("falling");
    expect(trend!.hPaPer3h).toBeCloseTo(-3, 5);
  });

  it("liefert null ohne brauchbare Druckwerte", () => {
    expect(pressureTrend([], now)).toBeNull();
    expect(pressureTrend(hours([1013]), now)).toBeNull();
    expect(pressureTrend(hours([undefined, undefined, undefined]), now)).toBe(
      null
    );
    // Zu kurzes Fenster (nur eine Folgestunde) → keine belastbare Aussage
    expect(pressureTrend(hours([1013, 1010]), now)).toBeNull();
  });

  it("startet bei der laufenden Stunde, nicht am Listenanfang", () => {
    const later = new Date(2026, 7, 2, 16, 10, 0, 0); // dritte Stunde
    // Ab 16:00 steigt der Druck wieder, davor fiel er stark
    const trend = pressureTrend(
      hours([1010, 1006, 1004, 1005, 1006, 1007]),
      later
    );
    expect(trend!.direction).toBe("rising");
    expect(trend!.hPaPer3h).toBeCloseTo(3, 5);
  });
});
