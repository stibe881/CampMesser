import { describe, expect, it } from "vitest";
import {
  avalancheDangerAt,
  dangerLevelFromValue,
  inSwitzerland,
  pointInGeometry,
  pointInRing,
  euregioBulletinUrl,
  euregioDangerForRegion,
  euregioMicroRegionsUrl,
  euregioRegionsAt,
  microRegionAt,
  parseEuregioDate,
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

describe("Euregio-Lawinenreport (#490)", () => {
  it("kennt die drei Regionen und findet Kandidaten per Bounding-Box", () => {
    // Innsbruck → Tirol
    expect(euregioRegionsAt(47.26, 11.39)).toEqual(["AT-07"]);
    // Bozen → Südtirol (und wegen Überlappung evtl. Tirol)
    expect(euregioRegionsAt(46.5, 11.35)).toContain("IT-32-BZ");
    // Trento → Trentino
    expect(euregioRegionsAt(46.07, 11.12)).toContain("IT-32-TN");
    // Bern liegt in keiner Euregio-Region
    expect(euregioRegionsAt(46.95, 7.45)).toEqual([]);
  });

  it("liest das Bulletin-Datum und baut die Endpunkt-URLs", () => {
    expect(parseEuregioDate({ date: "2026-05-02T15:00:00Z" })).toBe(
      "2026-05-02"
    );
    expect(parseEuregioDate({ date: 42 })).toBeNull();
    expect(parseEuregioDate(null)).toBeNull();
    expect(euregioBulletinUrl("2026-05-02", "AT-07")).toBe(
      "https://static.avalanche.report/eaws_bulletins/2026-05-02/2026-05-02-AT-07.json"
    );
    expect(euregioMicroRegionsUrl("IT-32-BZ")).toBe(
      "https://regions.avalanches.org/micro-regions/IT-32-BZ_micro-regions.geojson.json"
    );
  });

  it("findet die Mikro-Region eines Punkts über die Polygone", () => {
    const geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { id: "AT-07-05" },
          geometry: {
            type: "MultiPolygon",
            coordinates: [
              [
                [
                  [11.0, 47.0],
                  [12.0, 47.0],
                  [12.0, 47.5],
                  [11.0, 47.5],
                  [11.0, 47.0],
                ],
              ],
            ],
          },
        },
      ],
    };
    expect(microRegionAt(geojson, 47.25, 11.5)).toBe("AT-07-05");
    expect(microRegionAt(geojson, 46.0, 11.5)).toBeNull();
    expect(microRegionAt({}, 47.25, 11.5)).toBeNull();
  });

  it("nimmt die höchste Stufe aller Bulletins der Mikro-Region", () => {
    const bulletins = {
      bulletins: [
        {
          regions: [{ regionID: "AT-07-05" }],
          dangerRatings: [
            { mainValue: "moderate", validTimePeriod: "earlier" },
            { mainValue: "considerable", validTimePeriod: "later" },
          ],
        },
        {
          regions: [{ regionID: "AT-07-99" }],
          dangerRatings: [{ mainValue: "high" }],
        },
      ],
    };
    expect(euregioDangerForRegion(bulletins, "AT-07-05")).toEqual({
      level: 3,
    });
    // Fremde Mikro-Region färbt nicht ab; Unbekanntes ergibt null
    expect(euregioDangerForRegion(bulletins, "AT-07-01")).toBeNull();
    expect(euregioDangerForRegion({}, "AT-07-05")).toBeNull();
  });
});
