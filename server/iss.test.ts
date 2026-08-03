import { describe, expect, it } from "vitest";
import {
  culminationAzimuth,
  earthShadowLimitDeg,
  estimateMagnitude,
  isPassVisible,
  ISS_ALTITUDE_KM,
  issPassesUrl,
  parseIssPasses,
  passPathText,
  selectVisiblePasses,
  slantRangeKm,
  type RawIssPass,
} from "@shared/iss";

describe("issPassesUrl", () => {
  it("baut eine schlüssellose URL mit Koordinaten und Parametern", () => {
    const url = issPassesUrl(47.0502, 8.3093);
    expect(url).toContain("api.g7vrd.co.uk/v1/satellite-passes/25544/");
    expect(url).toContain("47.0502/8.3093.json");
    expect(url).toContain("hours=96");
    expect(url).toContain("minelevation=10");
    expect(url).not.toContain("key=");
  });

  it("übernimmt eigene Werte für Zeitraum und Mindesthöhe", () => {
    const url = issPassesUrl(47, 8, 24, 30);
    expect(url).toContain("hours=24");
    expect(url).toContain("minelevation=30");
  });
});

describe("parseIssPasses", () => {
  const good = {
    start: "2026-08-04T20:10:00.000Z",
    tca: "2026-08-04T20:13:30.000Z",
    end: "2026-08-04T20:17:00.000Z",
    aos_azimuth: 251,
    los_azimuth: 65,
    max_elevation: 66,
  };

  it("liest einen vollständigen Überflug", () => {
    const passes = parseIssPasses({ passes: [good] });
    expect(passes).toHaveLength(1);
    expect(passes[0].startMs).toBe(Date.parse(good.start));
    expect(passes[0].culminationMs).toBe(Date.parse(good.tca));
    expect(passes[0].maxElevationDeg).toBe(66);
    expect(passes[0].riseAzimuth).toBe(251);
  });

  it("verträgt fehlende, leere und kaputte Antworten", () => {
    expect(parseIssPasses(null)).toEqual([]);
    expect(parseIssPasses({})).toEqual([]);
    expect(parseIssPasses({ passes: "nein" })).toEqual([]);
    expect(parseIssPasses({ passes: [null, 42] })).toEqual([]);
  });

  it("wirft unplausible Einträge weg statt die Liste zu sprengen", () => {
    const passes = parseIssPasses({
      passes: [
        good,
        { ...good, end: good.start }, // Untergang nicht nach Aufgang
        { ...good, tca: "2026-08-04T23:00:00.000Z" }, // Gipfel ausserhalb
        { ...good, max_elevation: 0 },
        { ...good, max_elevation: 120 },
        { ...good, start: "kaputt" },
        { ...good, aos_azimuth: null },
      ],
    });
    expect(passes).toHaveLength(1);
  });

  it("sortiert nach Beginn und normalisiert Azimute", () => {
    const later = {
      ...good,
      start: "2026-08-05T20:10:00.000Z",
      tca: "2026-08-05T20:13:30.000Z",
      end: "2026-08-05T20:17:00.000Z",
    };
    const passes = parseIssPasses({
      passes: [
        { ...later, aos_azimuth: -90 },
        { ...good, los_azimuth: 400 },
      ],
    });
    expect(passes[0].startMs).toBeLessThan(passes[1].startMs);
    expect(passes[0].setAzimuth).toBe(40);
    expect(passes[1].riseAzimuth).toBe(270);
  });
});

describe("culminationAzimuth", () => {
  it("nimmt die Mitte der kürzeren Drehung", () => {
    // Aufgang WSW, Untergang ONO: der Bogen läuft über Norden
    expect(culminationAzimuth(251, 65)).toBeCloseTo(338, 5);
    expect(culminationAzimuth(315, 45)).toBeCloseTo(0, 5);
  });

  it("erkennt auch Bögen über Süden", () => {
    expect(culminationAzimuth(135, 225)).toBeCloseTo(180, 5);
    expect(culminationAzimuth(100, 260)).toBeCloseTo(180, 5);
  });

  it("legt bei genau 180° Drehung (Zenit-Durchgang) eine Seite fest", () => {
    // Aufgang O, Untergang W: beide Bögen sind gleich lang – die Richtung
    // ist dort ohnehin bedeutungslos, sie muss nur eindeutig sein.
    expect(culminationAzimuth(90, 270)).toBeCloseTo(0, 5);
  });

  it("liefert immer einen Winkel in [0, 360)", () => {
    for (let rise = 0; rise < 360; rise += 17) {
      for (let set = 0; set < 360; set += 23) {
        const azimuth = culminationAzimuth(rise, set);
        expect(azimuth).toBeGreaterThanOrEqual(0);
        expect(azimuth).toBeLessThan(360);
      }
    }
  });
});

describe("earthShadowLimitDeg", () => {
  it("liefert für die ISS-Bahnhöhe rund 20 Grad", () => {
    expect(earthShadowLimitDeg(ISS_ALTITUDE_KM)).toBeCloseTo(20.3, 1);
  });

  it("wächst mit der Bahnhöhe", () => {
    expect(earthShadowLimitDeg(1000)).toBeGreaterThan(
      earthShadowLimitDeg(ISS_ALTITUDE_KM)
    );
    expect(earthShadowLimitDeg(0)).toBeCloseTo(0, 6);
  });
});

describe("isPassVisible", () => {
  it("verwirft Überflüge bei Tag und in der hellen Dämmerung", () => {
    expect(isPassVisible(20)).toBe(false);
    expect(isPassVisible(0)).toBe(false);
    expect(isPassVisible(-2)).toBe(false);
  });

  it("nimmt Überflüge im dunklen Fenster an", () => {
    expect(isPassVisible(-6)).toBe(true);
    expect(isPassVisible(-12)).toBe(true);
    expect(isPassVisible(-20)).toBe(true);
  });

  it("verwirft Überflüge, bei denen die Station im Erdschatten steckt", () => {
    expect(isPassVisible(-21)).toBe(false);
    expect(isPassVisible(-40)).toBe(false);
  });

  it("verträgt kaputte Werte", () => {
    expect(isPassVisible(Number.NaN)).toBe(false);
    expect(isPassVisible(Number.POSITIVE_INFINITY)).toBe(false);
  });
});

describe("slantRangeKm und estimateMagnitude", () => {
  it("misst im Zenit genau die Bahnhöhe", () => {
    expect(slantRangeKm(90, ISS_ALTITUDE_KM)).toBeCloseTo(ISS_ALTITUDE_KM, 6);
  });

  it("wird zum Horizont hin deutlich weiter", () => {
    expect(slantRangeKm(10, ISS_ALTITUDE_KM)).toBeGreaterThan(1400);
    expect(slantRangeKm(0, ISS_ALTITUDE_KM)).toBeGreaterThan(
      slantRangeKm(10, ISS_ALTITUDE_KM)
    );
  });

  it("schätzt hohe Überflüge heller als flache", () => {
    const zenith = estimateMagnitude(90);
    const low = estimateMagnitude(10);
    expect(zenith).toBeLessThan(low);
    expect(zenith).toBeCloseTo(-3.7, 1);
    expect(low).toBeGreaterThan(-1.5);
  });
});

describe("selectVisiblePasses", () => {
  /** Ein Überflug rund um einen Zeitpunkt herum (Gipfel in der Mitte). */
  function passAt(culmination: string, maxElevationDeg = 60): RawIssPass {
    const culminationMs = Date.parse(culmination);
    return {
      startMs: culminationMs - 3 * 60000,
      culminationMs,
      endMs: culminationMs + 3 * 60000,
      riseAzimuth: 251,
      setAzimuth: 65,
      maxElevationDeg,
    };
  }

  // Luzern, Anfang August
  const lat = 47.05;
  const lon = 8.31;

  it("behält den Überflug in der Nacht und verwirft den am Mittag", () => {
    const night = passAt("2026-08-04T20:30:00.000Z");
    const noon = passAt("2026-08-04T11:00:00.000Z");
    const visible = selectVisiblePasses([noon, night], lat, lon);
    expect(visible).toHaveLength(1);
    expect(visible[0].culminationMs).toBe(night.culminationMs);
    expect(visible[0].sunAltitudeDeg).toBeLessThanOrEqual(-6);
  });

  it("verwirft die tiefe Nacht, in der die Station im Erdschatten steht", () => {
    // 01:00 Lokalzeit im Hochsommer: Sonne rund 25° unter dem Horizont
    const deepNight = selectVisiblePasses(
      [passAt("2026-08-04T23:00:00.000Z")],
      lat,
      lon
    );
    expect(deepNight).toHaveLength(0);
  });

  it("ergänzt Richtung, Dauer und Helligkeit", () => {
    const [pass] = selectVisiblePasses(
      [passAt("2026-08-04T20:30:00.000Z", 66)],
      lat,
      lon
    );
    expect(pass.culminationAzimuth).toBeCloseTo(338, 5);
    expect(pass.durationMinutes).toBe(6);
    expect(pass.magnitude).toBeLessThan(0);
    expect(passPathText(pass, "de")).toBe("W → N → NO");
    expect(passPathText(pass, "en")).toBe("W → N → NE");
  });

  it("hält sich an die Höchstzahl", () => {
    const passes = [
      passAt("2026-08-04T20:30:00.000Z"),
      passAt("2026-08-05T20:30:00.000Z"),
      passAt("2026-08-06T20:30:00.000Z"),
    ];
    expect(selectVisiblePasses(passes, lat, lon, 2)).toHaveLength(2);
    expect(selectVisiblePasses([], lat, lon)).toEqual([]);
  });
});
