import { describe, expect, it } from "vitest";
// Sonnenberechnung liegt im Client-Code, ist aber reine Logik ohne DOM.
import {
  formatDMS,
  getSunPosition,
  getSunTimes,
  wgs84ToLV95,
} from "../client/src/lib/sun";

// Referenzort: Bern, Schweiz
const BERN_LAT = 46.948;
const BERN_LNG = 7.4474;

describe("getSunPosition", () => {
  it("zeigt die Sonne am Mittag (Sommer, Bern) hoch im Süden", () => {
    // 21. Juni 2026, 13:30 Lokalzeit (MESZ) ≈ Sonnenhöchststand
    const date = new Date("2026-06-21T11:30:00Z");
    const pos = getSunPosition(date, BERN_LAT, BERN_LNG);
    expect(pos.altitude).toBeGreaterThan(60); // Sommersonnenwende ≈ 66°
    expect(pos.azimuth).toBeGreaterThan(150);
    expect(pos.azimuth).toBeLessThan(210);
  });

  it("zeigt die Sonne um Mitternacht unter dem Horizont", () => {
    const date = new Date("2026-06-21T00:00:00Z");
    const pos = getSunPosition(date, BERN_LAT, BERN_LNG);
    expect(pos.altitude).toBeLessThan(0);
  });
});

describe("getSunTimes", () => {
  it("liefert plausible Auf- und Untergangszeiten für Bern im Sommer", () => {
    const date = new Date("2026-06-21T12:00:00Z");
    const times = getSunTimes(date, BERN_LAT, BERN_LNG);
    expect(times.sunrise).not.toBeNull();
    expect(times.sunset).not.toBeNull();
    // Sonnenaufgang Bern am 21.6. ≈ 05:37 Lokalzeit (03:37 UTC)
    const sunriseUTC =
      times.sunrise!.getUTCHours() + times.sunrise!.getUTCMinutes() / 60;
    expect(sunriseUTC).toBeGreaterThan(3);
    expect(sunriseUTC).toBeLessThan(4.5);
    // Sonnenuntergang ≈ 21:26 Lokalzeit (19:26 UTC)
    const sunsetUTC =
      times.sunset!.getUTCHours() + times.sunset!.getUTCMinutes() / 60;
    expect(sunsetUTC).toBeGreaterThan(19);
    expect(sunsetUTC).toBeLessThan(20.5);
  });
});

describe("wgs84ToLV95", () => {
  it("rechnet den LV95-Nullpunkt Bern korrekt um (±30 m)", () => {
    // Referenz swisstopo: alte Sternwarte Bern = E 2600000 / N 1200000 (46.95108° N, 7.43863° E)
    const result = wgs84ToLV95(46.95108, 7.43863);
    expect(result).not.toBeNull();
    expect(Math.abs(result!.east - 2600000)).toBeLessThan(30);
    expect(Math.abs(result!.north - 1200000)).toBeLessThan(30);
  });

  it("gibt null zurück ausserhalb der Schweiz", () => {
    expect(wgs84ToLV95(52.52, 13.405)).toBeNull(); // Berlin
  });
});

describe("formatDMS", () => {
  it("formatiert Koordinaten mit Himmelsrichtungen", () => {
    const s = formatDMS(46.948, 7.4474);
    expect(s).toContain("N");
    expect(s).toContain("E");
    expect(s).toContain("46°");
  });
});
