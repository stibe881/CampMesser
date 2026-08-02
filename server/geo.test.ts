import { describe, expect, it } from "vitest";
import { bearingDegrees, distanceMeters } from "@shared/geo";

// Referenzorte (WGS84)
const BERN = { lat: 46.948, lon: 7.4474 };
const ZUERICH = { lat: 47.3769, lon: 8.5417 };
const GENF = { lat: 46.2044, lon: 6.1432 };

describe("distanceMeters", () => {
  it("liefert 0 für identische Punkte", () => {
    expect(distanceMeters(BERN.lat, BERN.lon, BERN.lat, BERN.lon)).toBe(0);
  });

  it("misst 1 Längengrad am Äquator als ~111.19 km", () => {
    // Bekannter Referenzwert: Erdumfang / 360 ≈ 111.195 km
    expect(distanceMeters(0, 0, 0, 1)).toBeCloseTo(111195, -1);
  });

  it("misst 1 Breitengrad als ~111.19 km (unabhängig vom Längengrad)", () => {
    expect(distanceMeters(0, 0, 1, 0)).toBeCloseTo(111195, -1);
    expect(distanceMeters(46, 7, 47, 7)).toBeCloseTo(111195, -1);
  });

  it("misst Bern–Zürich als ~95.5 km (Grosskreis)", () => {
    const d = distanceMeters(BERN.lat, BERN.lon, ZUERICH.lat, ZUERICH.lon);
    expect(d).toBeGreaterThan(94500);
    expect(d).toBeLessThan(96500);
  });

  it("ist symmetrisch (Hin- und Rückrichtung gleich lang)", () => {
    const hin = distanceMeters(BERN.lat, BERN.lon, GENF.lat, GENF.lon);
    const zurueck = distanceMeters(GENF.lat, GENF.lon, BERN.lat, BERN.lon);
    expect(hin).toBeCloseTo(zurueck, 3);
    // Bern–Genf ≈ 129.5 km
    expect(hin).toBeGreaterThan(128000);
    expect(hin).toBeLessThan(131000);
  });
});

describe("bearingDegrees", () => {
  it("kennt die vier Haupt-Himmelsrichtungen am Äquator", () => {
    expect(bearingDegrees(0, 0, 1, 0)).toBeCloseTo(0, 5); // Nord
    expect(bearingDegrees(0, 0, 0, 1)).toBeCloseTo(90, 5); // Ost
    expect(bearingDegrees(0, 0, -1, 0)).toBeCloseTo(180, 5); // Süd
    expect(bearingDegrees(0, 0, 0, -1)).toBeCloseTo(270, 5); // West
  });

  it("peilt Zürich von Bern aus mit ~60° (Nordost)", () => {
    const b = bearingDegrees(BERN.lat, BERN.lon, ZUERICH.lat, ZUERICH.lon);
    expect(b).toBeGreaterThan(58);
    expect(b).toBeLessThan(62);
  });

  it("peilt Genf von Bern aus mit ~231° (Südwest)", () => {
    const b = bearingDegrees(BERN.lat, BERN.lon, GENF.lat, GENF.lon);
    expect(b).toBeGreaterThan(229);
    expect(b).toBeLessThan(233);
  });

  it("liefert immer Werte in [0, 360)", () => {
    const b = bearingDegrees(10, 20, 5, -30); // Richtung Westen → > 180°
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThan(360);
    expect(b).toBeGreaterThan(180);
  });
});
