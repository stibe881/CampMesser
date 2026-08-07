import { describe, expect, it } from "vitest";
import {
  DETOUR_FACTOR,
  applyRouteDistances,
  osrmTableUrl,
  parseOsrmTable,
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

describe("Distanzen zu Fundorten über den Weg", () => {
  it("fragt alle Ziele in EINER Tabellen-Anfrage ab", () => {
    const url = osrmTableUrl("foot", ZUERICH, [BIEL, { lat: 47, lon: 8 }]);
    expect(url).toContain("/routed-foot/table/v1/driving/");
    // Standort zuerst, danach die Ziele – und nur der Standort ist Quelle
    expect(url).toContain("8.54170,47.37690;7.44740,46.94800;8.00000,47.00000");
    expect(url).toContain("sources=0");
    expect(url).toContain("annotations=distance");
  });

  it("liest die Wegstrecken je Ziel aus der Antwort", () => {
    const distances = parseOsrmTable(
      { code: "Ok", distances: [[0, 983.7, 1392.7]] },
      2
    );
    expect(distances).toEqual([983.7, 1392.7]);
  });

  it("macht aus unerreichbaren Zielen null statt einer Zahl", () => {
    expect(
      parseOsrmTable({ code: "Ok", distances: [[0, null, 500]] }, 2)
    ).toEqual([null, 500]);
    expect(parseOsrmTable({ code: "NoTable" }, 2)).toEqual([null, null]);
    expect(parseOsrmTable(null, 3)).toEqual([null, null, null]);
  });

  it("liest auf Wunsch die FAHRZEIT statt der Strecke (#383)", () => {
    // Vierzig Kilometer über den Pass sind eine Stunde, vierzig über die
    // Autobahn zwanzig Minuten – «Wohin am Wochenende?» entscheidet nach
    // der Uhr, nicht nach Kilometern. Beide Zahlen stehen in derselben
    // Antwort.
    const answer = {
      code: "Ok",
      distances: [[0, 40000, 40000]],
      durations: [[0, 3600, 1200]],
    };
    expect(parseOsrmTable(answer, 2, "durations")).toEqual([3600, 1200]);
    expect(parseOsrmTable(answer, 2)).toEqual([40000, 40000]);
  });

  it("gibt ohne Fahrzeit-Spalte null zurück statt Meter zu verwechseln", () => {
    expect(
      parseOsrmTable({ code: "Ok", distances: [[0, 500]] }, 1, "durations")
    ).toEqual([null]);
  });

  it("sortiert die Liste nach der Wegstrecke neu", () => {
    // Der Laden am anderen Flussufer: 500 m Luftlinie, 6 km über die Brücke
    const list = [
      { place: { id: "fluss" }, distanceM: 500 },
      { place: { id: "dorf" }, distanceM: 1200 },
    ];
    const routed = applyRouteDistances(
      list,
      new Map([
        ["fluss", 6000],
        ["dorf", 1400],
      ])
    );
    expect(routed[0].place.id).toBe("dorf");
    expect(routed[0].distanceM).toBe(1400);
    expect(routed[0].routed).toBe(true);
    expect(routed[1].distanceM).toBe(6000);
  });

  it("behält die Luftlinie, wo keine Wegstrecke vorliegt", () => {
    const routed = applyRouteDistances(
      [
        { place: { id: "a" }, distanceM: 800 },
        { place: { id: "b" }, distanceM: 300 },
      ],
      new Map([["a", 900]])
    );
    const b = routed.find(r => r.place.id === "b")!;
    expect(b.distanceM).toBe(300);
    expect(b.routed).toBe(false);
  });

  it("lässt die Eingabeliste unangetastet", () => {
    const list = [{ place: { id: "a" }, distanceM: 800 }];
    applyRouteDistances(list, new Map([["a", 900]]));
    expect(list[0].distanceM).toBe(800);
  });
});
