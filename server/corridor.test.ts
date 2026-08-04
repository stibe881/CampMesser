import { describe, expect, it } from "vitest";
import {
  CORRIDOR_MAX_POINTS,
  CORRIDOR_SPACING_M,
  corridorPoints,
  interpolateGreatCircle,
  routePosition,
  stopsAlongRoute,
} from "@shared/corridor";
import { distanceMeters } from "@shared/geo";

/** Bern → Lugano, eine typische Anfahrt quer durch die Schweiz. */
const BERN = { lat: 46.948, lon: 7.4474 };
const LUGANO = { lat: 46.0037, lon: 8.9511 };

describe("interpolateGreatCircle", () => {
  it("gibt an den Enden genau Start und Ziel", () => {
    const start = interpolateGreatCircle(BERN, LUGANO, 0);
    const end = interpolateGreatCircle(BERN, LUGANO, 1);
    expect(start.lat).toBeCloseTo(BERN.lat, 6);
    expect(start.lon).toBeCloseTo(BERN.lon, 6);
    expect(end.lat).toBeCloseTo(LUGANO.lat, 6);
    expect(end.lon).toBeCloseTo(LUGANO.lon, 6);
  });

  it("legt die Mitte auf die halbe Strecke", () => {
    const total = distanceMeters(BERN.lat, BERN.lon, LUGANO.lat, LUGANO.lon);
    const mid = interpolateGreatCircle(BERN, LUGANO, 0.5);
    const toMid = distanceMeters(BERN.lat, BERN.lon, mid.lat, mid.lon);
    expect(toMid).toBeCloseTo(total / 2, -1);
  });

  it("klemmt Werte ausserhalb von 0 bis 1", () => {
    expect(interpolateGreatCircle(BERN, LUGANO, -3).lat).toBeCloseTo(
      BERN.lat,
      6
    );
    expect(interpolateGreatCircle(BERN, LUGANO, 7).lat).toBeCloseTo(
      LUGANO.lat,
      6
    );
  });

  it("kommt mit Start gleich Ziel klar", () => {
    const point = interpolateGreatCircle(BERN, BERN, 0.5);
    expect(point.lat).toBeCloseTo(BERN.lat, 6);
    expect(point.lon).toBeCloseTo(BERN.lon, 6);
  });
});

describe("corridorPoints", () => {
  it("beginnt am Start und endet am Ziel", () => {
    const points = corridorPoints(BERN, LUGANO);
    expect(points.length).toBeGreaterThan(2);
    expect(points[0].lat).toBeCloseTo(BERN.lat, 5);
    expect(points[points.length - 1].lat).toBeCloseTo(LUGANO.lat, 5);
  });

  it("hält den Regelabstand ungefähr ein", () => {
    const points = corridorPoints(BERN, LUGANO);
    for (let i = 1; i < points.length; i++) {
      const step = distanceMeters(
        points[i - 1].lat,
        points[i - 1].lon,
        points[i].lat,
        points[i].lon
      );
      expect(step).toBeLessThanOrEqual(CORRIDOR_SPACING_M * 1.5);
    }
  });

  it("überschreitet die Höchstzahl nie", () => {
    const weit = { lat: 36.72, lon: -4.42 }; // Málaga
    const points = corridorPoints(BERN, weit);
    expect(points.length).toBeLessThanOrEqual(CORRIDOR_MAX_POINTS);
    expect(points.length).toBeGreaterThan(2);
  });

  it("gibt bei Start gleich Ziel genau einen Punkt", () => {
    expect(corridorPoints(BERN, BERN)).toEqual([
      { lat: BERN.lat, lon: BERN.lon },
    ]);
  });

  it("gibt bei kaputten Koordinaten nichts zurück", () => {
    expect(corridorPoints({ lat: NaN, lon: 7 }, LUGANO)).toEqual([]);
    expect(corridorPoints(BERN, { lat: 91, lon: 7 })).toEqual([]);
  });

  it("liefert bei kurzer Strecke Start und Ziel", () => {
    const nah = { lat: BERN.lat + 0.01, lon: BERN.lon };
    expect(corridorPoints(BERN, nah).length).toBe(2);
  });
});

describe("routePosition", () => {
  it("ordnet den Start bei km 0 ein", () => {
    const pos = routePosition(BERN, LUGANO, BERN.lat, BERN.lon);
    expect(pos.alongM).toBeCloseTo(0, -1);
    expect(pos.offsetM).toBeLessThan(50);
  });

  it("ordnet das Ziel am Ende ein", () => {
    const pos = routePosition(BERN, LUGANO, LUGANO.lat, LUGANO.lon);
    expect(pos.alongM).toBeCloseTo(pos.totalM, -2);
  });

  it("ordnet einen Punkt auf der Linie in der Mitte ein", () => {
    const mid = interpolateGreatCircle(BERN, LUGANO, 0.5);
    const pos = routePosition(BERN, LUGANO, mid.lat, mid.lon);
    expect(pos.alongM / pos.totalM).toBeCloseTo(0.5, 2);
    expect(pos.offsetM).toBeLessThan(2000);
  });

  it("misst den Abstand neben der Linie", () => {
    const mid = interpolateGreatCircle(BERN, LUGANO, 0.5);
    const daneben = { lat: mid.lat + 0.05, lon: mid.lon };
    const pos = routePosition(BERN, LUGANO, daneben.lat, daneben.lon);
    expect(pos.offsetM).toBeGreaterThan(2000);
    expect(pos.offsetM).toBeLessThan(10000);
  });

  it("klemmt hinter dem Ziel auf die Gesamtlänge", () => {
    const dahinter = { lat: LUGANO.lat - 0.5, lon: LUGANO.lon + 0.3 };
    const pos = routePosition(BERN, LUGANO, dahinter.lat, dahinter.lon);
    expect(pos.alongM).toBeLessThanOrEqual(pos.totalM + 1);
  });

  it("klemmt vor dem Start auf null", () => {
    const davor = { lat: BERN.lat + 0.5, lon: BERN.lon - 0.3 };
    const pos = routePosition(BERN, LUGANO, davor.lat, davor.lon);
    expect(pos.alongM).toBeGreaterThanOrEqual(0);
  });

  it("bleibt bei kaputten Eingaben bei null", () => {
    const pos = routePosition(BERN, LUGANO, NaN, 8);
    expect(pos.alongM).toBe(0);
    expect(pos.totalM).toBeGreaterThan(0);
  });
});

describe("stopsAlongRoute", () => {
  const place = (id: string, fraction: number, offsetDeg = 0) => {
    const point = interpolateGreatCircle(BERN, LUGANO, fraction);
    return { id, lat: point.lat + offsetDeg, lon: point.lon };
  };

  it("sortiert nach der Reihenfolge der Fahrt", () => {
    const list = [place("c", 0.9), place("a", 0.1), place("b", 0.5)];
    const stops = stopsAlongRoute(list, BERN, LUGANO, 10);
    expect(stops.map(s => s.place.id)).toEqual(["a", "b", "c"]);
  });

  it("bevorzugt bei gleicher Marke den Ort näher an der Linie", () => {
    // Strecke genau nach Süden: ein Versatz nach Osten verschiebt die
    // Kilometermarke nicht, nur den Abstand zur Linie
    const nord = { lat: 47.0, lon: 8.0 };
    const sued = { lat: 46.0, lon: 8.0 };
    const list = [
      { id: "weit", lat: 46.5, lon: 8.06 },
      { id: "nah", lat: 46.5, lon: 8.01 },
    ];
    const stops = stopsAlongRoute(list, nord, sued, 10);
    expect(stops[0].alongM).toBeCloseTo(stops[1].alongM, 0);
    expect(stops[0].place.id).toBe("nah");
  });

  it("begrenzt die Anzahl", () => {
    const list = [place("a", 0.1), place("b", 0.3), place("c", 0.6)];
    expect(stopsAlongRoute(list, BERN, LUGANO, 2).length).toBe(2);
    expect(stopsAlongRoute(list, BERN, LUGANO, 0)).toEqual([]);
  });

  it("lässt die Eingabeliste unverändert", () => {
    const list = [place("c", 0.9), place("a", 0.1)];
    const ids = list.map(p => p.id);
    stopsAlongRoute(list, BERN, LUGANO, 10);
    expect(list.map(p => p.id)).toEqual(ids);
  });

  it("gibt Kilometermarke und Gesamtlänge mit", () => {
    const stops = stopsAlongRoute([place("a", 0.25)], BERN, LUGANO, 10);
    const total = distanceMeters(BERN.lat, BERN.lon, LUGANO.lat, LUGANO.lon);
    expect(stops[0].alongM / total).toBeCloseTo(0.25, 2);
  });
});
