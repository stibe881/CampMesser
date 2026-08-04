import { describe, expect, it } from "vitest";
import {
  DETOUR_FACTOR,
  estimateRoadDistanceM,
  offsetOnRoute,
  osrmRouteUrl,
  parseOsrmRoute,
  pointsAlongRoute,
  routeCacheKey,
  routeLengthM,
} from "@shared/routing";
import type { GeoPoint } from "@shared/hiking";

const ZUERICH: GeoPoint = { lat: 47.3769, lon: 8.5417 };
const BIEL: GeoPoint = { lat: 46.948, lon: 7.4474 };

/** Eine gerade Route nach Osten: rund 100 m je Schritt bei 47° Breite. */
function straightRoute(count: number): GeoPoint[] {
  const points: GeoPoint[] = [];
  for (let i = 0; i < count; i++) {
    points.push({ lat: 47, lon: 8 + i * 0.00132 });
  }
  return points;
}

describe("Echte Wegstrecken (Routing)", () => {
  it("baut eine OSRM-Anfrage mit lon,lat in dieser Reihenfolge", () => {
    const url = osrmRouteUrl("car", [ZUERICH, BIEL]);
    // OSRM erwartet lon,lat – vertauscht landet man im Meer
    expect(url).toContain("/routed-car/route/v1/driving/8.54170,47.37690;");
    expect(url).toContain("7.44740,46.94800");
    expect(url).toContain("geometries=geojson");
    expect(url).toContain("overview=full");
  });

  it("kennt eigene Instanzen für Auto, zu Fuss und Velo", () => {
    expect(osrmRouteUrl("foot", [ZUERICH, BIEL])).toContain("routed-foot");
    expect(osrmRouteUrl("bike", [ZUERICH, BIEL])).toContain("routed-bike");
  });

  it("liest Strecke, Dauer und Verlauf aus der Antwort", () => {
    const route = parseOsrmRoute({
      code: "Ok",
      routes: [
        {
          distance: 121740.5,
          duration: 5466.6,
          geometry: {
            coordinates: [
              [8.5417, 47.3769],
              [8.4, 47.3],
              [7.4474, 46.948],
            ],
          },
        },
      ],
    })!;
    expect(route.distanceM).toBeCloseTo(121740.5, 1);
    expect(route.durationS).toBeCloseTo(5466.6, 1);
    expect(route.points).toHaveLength(3);
    expect(route.points[0]).toEqual({ lat: 47.3769, lon: 8.5417 });
    expect(route.source).toBe("route");
  });

  it("gibt bei kaputten Antworten null, statt etwas zu erfinden", () => {
    expect(parseOsrmRoute(null)).toBeNull();
    expect(parseOsrmRoute({ code: "NoRoute", routes: [] })).toBeNull();
    expect(parseOsrmRoute({ code: "Ok", routes: [] })).toBeNull();
    expect(
      parseOsrmRoute({ code: "Ok", routes: [{ duration: 10 }] })
    ).toBeNull();
  });

  it("überspringt unmögliche Koordinaten in der Geometrie", () => {
    const route = parseOsrmRoute({
      code: "Ok",
      routes: [
        {
          distance: 100,
          duration: 10,
          geometry: {
            coordinates: [
              [8, 47],
              [999, 47],
              ["a", "b"],
              [8.01, 47.01],
            ],
          },
        },
      ],
    })!;
    expect(route.points).toHaveLength(2);
  });

  it("schätzt die Strasse mit Umwegfaktor über der Luftlinie", () => {
    expect(estimateRoadDistanceM(100_000)).toBe(100_000 * DETOUR_FACTOR);
    expect(DETOUR_FACTOR).toBeGreaterThan(1);
    expect(estimateRoadDistanceM(-5)).toBe(0);
  });

  it("erkennt dieselbe Strecke trotz GPS-Zittern wieder", () => {
    const a = routeCacheKey("car", [ZUERICH, BIEL]);
    const b = routeCacheKey("car", [
      { lat: 47.37692, lon: 8.54171 },
      { lat: 46.94802, lon: 7.44739 },
    ]);
    expect(a).toBe(b);
    // Anderes Verkehrsmittel ist eine andere Route
    expect(routeCacheKey("foot", [ZUERICH, BIEL])).not.toBe(a);
  });

  it("summiert die Länge einer Punktreihe", () => {
    const length = routeLengthM(straightRoute(11));
    expect(length).toBeGreaterThan(950);
    expect(length).toBeLessThan(1050);
    expect(routeLengthM([])).toBe(0);
  });

  it("dünnt die Route über die STRECKE aus, nicht über den Index", () => {
    // Kreisel: viele Punkte auf wenigen Metern, danach eine lange Gerade
    const roundabout: GeoPoint[] = [];
    for (let i = 0; i < 60; i++) {
      roundabout.push({ lat: 47, lon: 8 + i * 0.000005 });
    }
    const straight = straightRoute(40).map(p => ({
      lat: p.lat,
      lon: p.lon + 0.001,
    }));
    const sampled = pointsAlongRoute([...roundabout, ...straight], 6);
    expect(sampled).toHaveLength(6);
    // Höchstens eine Stützstelle darf im Kreisel liegen
    const inRoundabout = sampled.filter(p => p.lon < 8.0005).length;
    expect(inRoundabout).toBeLessThanOrEqual(1);
  });

  it("behält Start und Ziel beim Ausdünnen", () => {
    const points = straightRoute(50);
    const sampled = pointsAlongRoute(points, 5);
    expect(sampled[0]).toEqual(points[0]);
    expect(sampled[sampled.length - 1]).toEqual(points[points.length - 1]);
  });

  it("ordnet einen Ort auf der Route ein: bei km x, y abseits", () => {
    const points = straightRoute(101); // rund 10 km
    const target: GeoPoint = { lat: 47.005, lon: 8 + 50 * 0.00132 };
    const offset = offsetOnRoute(target, points)!;
    expect(offset.alongM).toBeGreaterThan(4500);
    expect(offset.alongM).toBeLessThan(5500);
    // Rund 550 m nördlich der Strecke
    expect(offset.offsetM).toBeGreaterThan(400);
    expect(offset.offsetM).toBeLessThan(700);
    expect(offset.totalM).toBeGreaterThan(9500);
  });

  it("kommt mit einer leeren Route zurecht", () => {
    expect(offsetOnRoute(ZUERICH, [])).toBeNull();
    expect(pointsAlongRoute([], 5)).toEqual([]);
  });
});
