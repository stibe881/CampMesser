import { describe, expect, it } from "vitest";
import {
  MAX_ROUTE_SAMPLES,
  ROUTE_ELEVATION_THRESHOLD_M,
  hikingMinutes,
  parseWaypoints,
  routeDistanceM,
  routeElevation,
  routeSamples,
  serializeWaypoints,
  type RouteWaypoint,
} from "@shared/routePlan";

/** Wegpunkte auf einer Ostlinie: rund 1 km je Schritt bei 47° Breite. */
function eastwards(
  count: number,
  ele: (i: number) => number | null = () => null
) {
  const points: RouteWaypoint[] = [];
  for (let i = 0; i < count; i++) {
    points.push({ lat: 47, lon: 8 + i * 0.0132, ele: ele(i) });
  }
  return points;
}

describe("Route vorher zeichnen (#281)", () => {
  it("summiert die Länge über alle Wegpunkte", () => {
    const distance = routeDistanceM(eastwards(3));
    expect(distance).toBeGreaterThan(1900);
    expect(distance).toBeLessThan(2100);
    expect(routeDistanceM([])).toBe(0);
    expect(routeDistanceM(eastwards(1))).toBe(0);
  });

  it("setzt Stützstellen zwischen weit auseinanderliegende Wegpunkte", () => {
    // Zwei Klicks, ein Kilometer auseinander: nur die beiden Punkte
    // abzufragen würde jeden Hügel dazwischen unterschlagen
    const samples = routeSamples(eastwards(2));
    expect(samples.length).toBeGreaterThan(2);
    expect(samples[0].distanceM).toBe(0);
    expect(samples[samples.length - 1].distanceM).toBeGreaterThan(900);
  });

  it("hält die Abfrage-Grenze auch bei langen Routen ein", () => {
    const samples = routeSamples(eastwards(30));
    expect(samples.length).toBeLessThanOrEqual(MAX_ROUTE_SAMPLES);
    // Ausgedünnt wird über die ganze Strecke, nicht hinten abgeschnitten
    const last = samples[samples.length - 1];
    expect(last.distanceM).toBeGreaterThan(28_000);
  });

  it("behält die gesetzten Wegpunkte in der Reihenfolge", () => {
    const samples = routeSamples(eastwards(3));
    expect(samples[0].lon).toBeCloseTo(8, 6);
    expect(samples[samples.length - 1].lon).toBeCloseTo(8 + 2 * 0.0132, 6);
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i].distanceM).toBeGreaterThanOrEqual(
        samples[i - 1].distanceM
      );
    }
  });

  it("rechnet Auf- und Abstieg aus den Höhen", () => {
    // 10 Punkte aufwärts (je +50 m), danach 10 abwärts
    const points = eastwards(21, i =>
      i <= 10 ? 500 + i * 50 : 1000 - (i - 10) * 50
    );
    const elevation = routeElevation(points)!;
    expect(elevation.ascentM).toBe(500);
    expect(elevation.descentM).toBe(500);
    expect(elevation.minM).toBe(500);
    expect(elevation.maxM).toBe(1000);
  });

  it("schluckt das Rauschen des Höhenmodells", () => {
    // Auf und ab um je 2 m – unterhalb der Schwelle, also keine Höhenmeter
    const noisy = eastwards(40, i => 600 + (i % 2 === 0 ? 0 : 2));
    const elevation = routeElevation(noisy)!;
    expect(ROUTE_ELEVATION_THRESHOLD_M).toBeGreaterThan(2);
    expect(elevation.ascentM).toBe(0);
    expect(elevation.descentM).toBe(0);
  });

  it("überspringt Löcher im Höhenmodell, statt sie als 0 zu lesen", () => {
    const points: RouteWaypoint[] = [
      { lat: 47, lon: 8, ele: 500 },
      { lat: 47, lon: 8.01, ele: null },
      { lat: 47, lon: 8.02, ele: 600 },
    ];
    const elevation = routeElevation(points)!;
    expect(elevation.ascentM).toBe(100);
    expect(elevation.descentM).toBe(0);
    expect(elevation.minM).toBe(500);
  });

  it("liefert ohne Höhen gar nichts, statt null Höhenmeter zu behaupten", () => {
    expect(routeElevation(eastwards(5))).toBeNull();
    expect(routeElevation([{ lat: 47, lon: 8, ele: 500 }])).toBeNull();
  });

  it("rechnet die Gehzeit nach SAC: grössere Zeit voll, kleinere halb", () => {
    // 8 km flach = 2 h horizontal, keine Vertikalzeit
    expect(hikingMinutes({ distanceM: 8000, ascentM: 0, descentM: 0 })).toBe(
      120
    );
    // 8 km mit 600 Hm Aufstieg: 2 h horizontal, 2 h vertikal → 3 h
    expect(hikingMinutes({ distanceM: 8000, ascentM: 600, descentM: 0 })).toBe(
      180
    );
  });

  it("die Höhenmeter dominieren die Gehzeit, nicht die Strecke", () => {
    const flat = hikingMinutes({ distanceM: 8000, ascentM: 0, descentM: 0 });
    const steep = hikingMinutes({
      distanceM: 8000,
      ascentM: 800,
      descentM: 800,
    });
    expect(steep).toBeGreaterThan(flat * 1.5);
  });

  it("berücksichtigt das gewählte Tempo", () => {
    const base = { distanceM: 10_000, ascentM: 400, descentM: 400 };
    const slow = hikingMinutes({ ...base, pace: "slow" });
    const normal = hikingMinutes({ ...base, pace: "normal" });
    const fast = hikingMinutes({ ...base, pace: "fast" });
    expect(slow).toBeGreaterThan(normal);
    expect(fast).toBeLessThan(normal);
  });

  it("speichert und liest Wegpunkte verlustarm", () => {
    const points: RouteWaypoint[] = [
      { lat: 46.8182, lon: 8.2275, ele: 1234.5 },
      { lat: 46.82, lon: 8.23, ele: null },
    ];
    const parsed = parseWaypoints(serializeWaypoints(points));
    expect(parsed).toHaveLength(2);
    expect(parsed[0].lat).toBeCloseTo(46.8182, 6);
    expect(parsed[0].ele).toBe(1234.5);
    expect(parsed[1].ele).toBeNull();
  });

  it("macht aus kaputtem Inhalt eine leere Route", () => {
    expect(parseWaypoints(null)).toEqual([]);
    expect(parseWaypoints("kein json")).toEqual([]);
    expect(parseWaypoints('{"lat":47}')).toEqual([]);
    // Unmögliche Koordinaten fallen einzeln weg
    expect(parseWaypoints("[[47,8,null],[999,8,null]]")).toHaveLength(1);
  });
});
