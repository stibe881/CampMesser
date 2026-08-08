import { describe, expect, it } from "vitest";
import {
  avalancheDangerAt,
  dangerLevelFromValue,
  inSwitzerland,
  pointInGeometry,
  pointInRing,
} from "@shared/avalanche";

/** SLF-Lawinen-Warnstufe (#471): Punkt-in-Region und CAAML-Stufen. */
describe("inSwitzerland", () => {
  it("kennt die grobe Bounding-Box der Schweiz", () => {
    expect(inSwitzerland(46.8, 8.2)).toBe(true); // Zentralschweiz
    expect(inSwitzerland(46.0, 7.75)).toBe(true); // Zermatt
    expect(inSwitzerland(52.5, 13.4)).toBe(false); // Berlin
    expect(inSwitzerland(45.0, 7.7)).toBe(false); // Turin
  });
});

describe("dangerLevelFromValue", () => {
  it("übersetzt CAAML-Namen in die Stufen 1–5", () => {
    expect(dangerLevelFromValue("low")).toBe(1);
    expect(dangerLevelFromValue("moderate")).toBe(2);
    expect(dangerLevelFromValue("considerable")).toBe(3);
    expect(dangerLevelFromValue("high")).toBe(4);
    expect(dangerLevelFromValue("very_high")).toBe(5);
  });

  it("nimmt auch Zahlen und Zahl-Strings", () => {
    expect(dangerLevelFromValue(3)).toBe(3);
    expect(dangerLevelFromValue("2")).toBe(2);
  });

  it("verwirft Unbrauchbares", () => {
    expect(dangerLevelFromValue("extreme")).toBeNull();
    expect(dangerLevelFromValue(0)).toBeNull();
    expect(dangerLevelFromValue(6)).toBeNull();
    expect(dangerLevelFromValue(null)).toBeNull();
  });
});

describe("pointInRing / pointInGeometry", () => {
  // Quadrat um (46–47 N, 8–9 E), GeoJSON-Reihenfolge [lon, lat]
  const square = [
    [8, 46],
    [9, 46],
    [9, 47],
    [8, 47],
    [8, 46],
  ];

  it("findet Punkte im Ring und lässt äussere draussen", () => {
    expect(pointInRing(square, 46.5, 8.5)).toBe(true);
    expect(pointInRing(square, 47.5, 8.5)).toBe(false);
    expect(pointInRing(square, 46.5, 9.5)).toBe(false);
  });

  it("behandelt Löcher: Punkt im Loch ist draussen", () => {
    const hole = [
      [8.4, 46.4],
      [8.6, 46.4],
      [8.6, 46.6],
      [8.4, 46.6],
      [8.4, 46.4],
    ];
    const geometry = { type: "Polygon", coordinates: [square, hole] };
    expect(pointInGeometry(geometry, 46.5, 8.5)).toBe(false);
    expect(pointInGeometry(geometry, 46.9, 8.9)).toBe(true);
  });

  it("kennt MultiPolygon", () => {
    const geometry = { type: "MultiPolygon", coordinates: [[square]] };
    expect(pointInGeometry(geometry, 46.5, 8.5)).toBe(true);
    expect(pointInGeometry(geometry, 45.5, 8.5)).toBe(false);
  });
});

describe("avalancheDangerAt", () => {
  const region = (
    coordinates: number[][],
    properties: Record<string, unknown>
  ) => ({
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [coordinates] },
    properties,
  });
  const square = [
    [8, 46],
    [9, 46],
    [9, 47],
    [8, 47],
    [8, 46],
  ];

  it("liefert die höchste Stufe der getroffenen Region", () => {
    const geojson = {
      type: "FeatureCollection",
      features: [
        region(square, {
          // Nach Höhe geteilt: oberhalb «erheblich», unterhalb «mässig»
          dangerRatings: [
            { mainValue: "moderate" },
            { mainValue: "considerable" },
          ],
        }),
      ],
    };
    expect(avalancheDangerAt(geojson, 46.5, 8.5)).toEqual({ level: 3 });
  });

  it("ausserhalb aller Regionen gibt es nichts", () => {
    const geojson = {
      type: "FeatureCollection",
      features: [region(square, { dangerRatings: [{ mainValue: "high" }] })],
    };
    expect(avalancheDangerAt(geojson, 47.5, 8.5)).toBeNull();
  });

  it("ohne Stufe in den Properties wird nichts behauptet", () => {
    const geojson = {
      type: "FeatureCollection",
      features: [region(square, {})],
    };
    expect(avalancheDangerAt(geojson, 46.5, 8.5)).toBeNull();
    expect(avalancheDangerAt(null, 46.5, 8.5)).toBeNull();
    expect(avalancheDangerAt({ features: "kaputt" }, 46.5, 8.5)).toBeNull();
  });
});
