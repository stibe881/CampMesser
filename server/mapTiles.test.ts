import { describe, expect, it } from "vitest";
// Die Kachel-Rechnerei liegt im Client-Code, ist aber reine Geometrie ohne DOM.
import {
  latToTileY,
  lonToTileX,
  MAX_OFFLINE_TILES,
  OFFLINE_BASE_ZOOM,
  tileUrl,
  tilesForArea,
  tilesForCorridor,
  tilesForTrip,
  TRIP_STAGE_MAX_ZOOM,
  zoomLevelsUpTo,
} from "../client/src/lib/mapTiles";

/** Zeltplatz-Koordinate für die Tests (Zürich). */
const LAT = 47.3769;
const LON = 8.5417;

describe("lonToTileX / latToTileY", () => {
  it("liefert auf Zoom 0 immer die einzige Weltkachel", () => {
    expect(lonToTileX(0, 0)).toBe(0);
    expect(lonToTileX(179.9, 0)).toBe(0);
    expect(latToTileY(0, 0)).toBe(0);
    expect(latToTileY(-60, 0)).toBe(0);
  });

  it("teilt die Welt auf Zoom 1 in vier Quadranten", () => {
    // Nullmeridian/Äquator liegt genau auf der Ecke der vier Kacheln
    expect(lonToTileX(0, 1)).toBe(1);
    expect(latToTileY(0, 1)).toBe(1);
    // Nordwesten
    expect(lonToTileX(-179.9, 1)).toBe(0);
    expect(latToTileY(84, 1)).toBe(0);
    // Südosten
    expect(lonToTileX(179.9, 1)).toBe(1);
    expect(latToTileY(-84, 1)).toBe(1);
  });

  it("klemmt jenseits der Mercator-Grenze statt negativ zu werden", () => {
    expect(latToTileY(89, 5)).toBe(0);
    expect(latToTileY(-89, 5)).toBe(2 ** 5 - 1);
    expect(lonToTileX(180, 5)).toBe(0);
    expect(lonToTileX(-180, 5)).toBe(0);
  });

  it("rechnet eine bekannte Kachel korrekt aus", () => {
    // Zürich auf Zoom 14 – Referenzwerte aus der Slippy-Map-Formel
    expect(lonToTileX(LON, 14)).toBe(8580);
    expect(latToTileY(LAT, 14)).toBe(5737);
  });
});

describe("zoomLevelsUpTo", () => {
  it("beginnt beim Basis-Zoom und endet einschliesslich beim Wunsch-Zoom", () => {
    expect(zoomLevelsUpTo(14)).toEqual([12, 13, 14]);
    expect(zoomLevelsUpTo(16)).toEqual([12, 13, 14, 15, 16]);
    expect(zoomLevelsUpTo(OFFLINE_BASE_ZOOM)).toEqual([OFFLINE_BASE_ZOOM]);
  });

  it("liefert für zu kleine Werte eine leere Liste", () => {
    expect(zoomLevelsUpTo(5)).toEqual([]);
  });
});

describe("tilesForArea", () => {
  it("enthält für jede Zoomstufe die Kachel des Platzes selbst", () => {
    const tiles = tilesForArea(LAT, LON, 2, [12, 13, 14]);
    [12, 13, 14].forEach(z => {
      expect(tiles).toContainEqual({
        z,
        x: lonToTileX(LON, z),
        y: latToTileY(LAT, z),
      });
    });
  });

  it("liefert bei Radius 0 genau eine Kachel pro Zoomstufe", () => {
    const tiles = tilesForArea(LAT, LON, 0, [12, 13, 14]);
    expect(tiles).toHaveLength(3);
  });

  it("behandelt einen negativen Radius wie 0", () => {
    expect(tilesForArea(LAT, LON, -5, [14])).toEqual(
      tilesForArea(LAT, LON, 0, [14])
    );
  });

  it("enthält keine Duplikate – auch nicht bei doppelten Zoom-Angaben", () => {
    const tiles = tilesForArea(LAT, LON, 5, [14, 14, 13, 13]);
    const keys = tiles.map(t => `${t.z}/${t.x}/${t.y}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(tiles.map(t => t.z))).toEqual(new Set([13, 14]));
  });

  it("wächst mit Radius und Detailgrad", () => {
    const small = tilesForArea(LAT, LON, 2, zoomLevelsUpTo(14));
    const wide = tilesForArea(LAT, LON, 10, zoomLevelsUpTo(14));
    const detailed = tilesForArea(LAT, LON, 2, zoomLevelsUpTo(16));
    expect(wide.length).toBeGreaterThan(small.length);
    expect(detailed.length).toBeGreaterThan(small.length);
  });

  it("hält die harte Obergrenze auch beim grössten Paket ein", () => {
    const tiles = tilesForArea(LAT, LON, 10, zoomLevelsUpTo(16));
    expect(tiles.length).toBe(MAX_OFFLINE_TILES);
    // Beim Abschneiden bleiben die groben Stufen vollständig erhalten
    const zooms = tiles.map(t => t.z);
    expect(Math.min(...zooms)).toBe(12);
    expect(zooms.filter(z => z === 12).length).toBe(
      tilesForArea(LAT, LON, 10, [12]).length
    );
  });

  it("sortiert innerhalb einer Zoomstufe von der Mitte nach aussen", () => {
    const tiles = tilesForArea(LAT, LON, 5, [14]);
    const centerX = lonToTileX(LON, 14);
    const centerY = latToTileY(LAT, 14);
    const ring = (i: number) =>
      Math.max(Math.abs(tiles[i].x - centerX), Math.abs(tiles[i].y - centerY));
    expect(ring(0)).toBe(0);
    for (let i = 1; i < tiles.length; i++) {
      expect(ring(i)).toBeGreaterThanOrEqual(ring(i - 1));
    }
  });

  it("bleibt bei unbrauchbaren Koordinaten leer", () => {
    expect(tilesForArea(Number.NaN, LON, 5, [14])).toEqual([]);
    expect(tilesForArea(LAT, Number.POSITIVE_INFINITY, 5, [14])).toEqual([]);
  });

  it("liefert ohne Zoomstufen nichts", () => {
    expect(tilesForArea(LAT, LON, 5, [])).toEqual([]);
  });
});

describe("tilesForCorridor", () => {
  // Eine ~7 km lange Linie von Zürich Richtung Uetliberg/Albis
  const ROUTE = [
    { lat: 47.3769, lon: 8.5417 },
    { lat: 47.35, lon: 8.49 },
    { lat: 47.32, lon: 8.51 },
  ];

  it("deckt Start und Ziel auf jeder Zoomstufe ab", () => {
    const tiles = tilesForCorridor(ROUTE, 1, [12, 13, 14]);
    [12, 13, 14].forEach(z => {
      const first = ROUTE[0];
      const last = ROUTE[ROUTE.length - 1];
      expect(tiles).toContainEqual({
        z,
        x: lonToTileX(first.lon, z),
        y: latToTileY(first.lat, z),
      });
      expect(tiles).toContainEqual({
        z,
        x: lonToTileX(last.lon, z),
        y: latToTileY(last.lat, z),
      });
    });
  });

  it("lässt zwischen weit auseinander liegenden Wegpunkten keine Lücke", () => {
    // Nur Start und Ziel gesetzt – die Stützstellen müssen die Strecke
    // dazwischen füllen: auch die Kachel der Streckenmitte ist dabei.
    const tiles = tilesForCorridor([ROUTE[0], ROUTE[2]], 0.5, [15]);
    const mid = {
      lat: (ROUTE[0].lat + ROUTE[2].lat) / 2,
      lon: (ROUTE[0].lon + ROUTE[2].lon) / 2,
    };
    expect(tiles).toContainEqual({
      z: 15,
      x: lonToTileX(mid.lon, 15),
      y: latToTileY(mid.lat, 15),
    });
  });

  it("enthält keine Duplikate und braucht weit weniger Kacheln als die Fläche", () => {
    const tiles = tilesForCorridor(ROUTE, 1, zoomLevelsUpTo(15));
    const keys = tiles.map(t => `${t.z}/${t.x}/${t.y}`);
    expect(new Set(keys).size).toBe(keys.length);
    // Der Korridor ist der ganze Zweck: gleiche Strecke als Umkreis-Paket
    // (Radius ≈ halbe Streckenlänge) wäre um ein Mehrfaches grösser.
    const area = tilesForArea(47.35, 8.52, 4, zoomLevelsUpTo(15));
    expect(tiles.length).toBeLessThan(area.length);
  });

  it("hält die harte Obergrenze ein und behält die grobe Übersicht", () => {
    // Eine lange Strecke quer durch die Schweiz sprengt die Grenze
    const long = [
      { lat: 46.2, lon: 6.15 },
      { lat: 47.55, lon: 9.35 },
    ];
    const tiles = tilesForCorridor(long, 2, zoomLevelsUpTo(16));
    expect(tiles.length).toBe(MAX_OFFLINE_TILES);
    const coarse = tilesForCorridor(long, 2, [OFFLINE_BASE_ZOOM]);
    expect(tiles.filter(t => t.z === OFFLINE_BASE_ZOOM).length).toBe(
      coarse.length
    );
  });

  it("bleibt ohne brauchbare Punkte oder Zoomstufen leer", () => {
    expect(tilesForCorridor([], 1, [14])).toEqual([]);
    expect(tilesForCorridor([{ lat: Number.NaN, lon: 8.5 }], 1, [14])).toEqual(
      []
    );
    expect(tilesForCorridor(ROUTE, 1, [])).toEqual([]);
  });
});

describe("tilesForTrip (#561)", () => {
  const STOPS = [
    { lat: 46.02, lon: 8.96 }, // Lugano
    { lat: 45.44, lon: 9.19 }, // Mailand
  ];

  it("sammelt Etappen-Umkreise und den Verbindungs-Korridor ohne Duplikate", () => {
    const tiles = tilesForTrip(STOPS);
    expect(tiles.length).toBeGreaterThan(0);
    expect(tiles.length).toBeLessThanOrEqual(MAX_OFFLINE_TILES);
    const keys = new Set(tiles.map(t => `${t.z}/${t.x}/${t.y}`));
    expect(keys.size).toBe(tiles.length);
    // Die feinen Zoomstufen gibt es nur um die Etappen – der Korridor
    // bleibt gröber (TRIP_LEG_MAX_ZOOM < TRIP_STAGE_MAX_ZOOM).
    const fine = tiles.filter(t => t.z === TRIP_STAGE_MAX_ZOOM);
    expect(fine.length).toBeGreaterThan(0);
    // Beide Etappen tragen feine Kacheln bei (x der Kachel um Lugano und
    // Mailand unterscheiden sich auf Zoom 14 deutlich)
    const luganoX = lonToTileX(STOPS[0].lon, TRIP_STAGE_MAX_ZOOM);
    const milanX = lonToTileX(STOPS[1].lon, TRIP_STAGE_MAX_ZOOM);
    expect(fine.some(t => Math.abs(t.x - luganoX) <= 2)).toBe(true);
    expect(fine.some(t => Math.abs(t.x - milanX) <= 2)).toBe(true);
  });

  it("eine einzelne Etappe ergibt nur ihren Umkreis, keinen Korridor", () => {
    const single = tilesForTrip([STOPS[0]]);
    const area = tilesForArea(
      STOPS[0].lat,
      STOPS[0].lon,
      2,
      zoomLevelsUpTo(TRIP_STAGE_MAX_ZOOM)
    );
    expect(single.length).toBe(area.length);
  });

  it("ohne Etappen bleibt es leer", () => {
    expect(tilesForTrip([])).toEqual([]);
  });
});

describe("tileUrl", () => {
  it("nutzt für die Karte das OSM-Schema z/x/y", () => {
    expect(tileUrl({ z: 14, x: 8580, y: 5737 }, "map")).toBe(
      "https://tile.openstreetmap.org/14/8580/5737.png"
    );
  });

  it("nutzt für den Satelliten das Esri-Schema z/y/x", () => {
    expect(tileUrl({ z: 14, x: 8580, y: 5737 }, "satellite")).toBe(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/14/5737/8580"
    );
  });
});
