import { describe, expect, it } from "vitest";
// Die Kachel-Rechnerei liegt im Client-Code, ist aber reine Geometrie ohne DOM.
import {
  latToTileY,
  lonToTileX,
  MAX_OFFLINE_TILES,
  OFFLINE_BASE_ZOOM,
  tileUrl,
  tilesForArea,
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
