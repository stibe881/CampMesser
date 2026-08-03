import { describe, expect, it } from "vitest";
import {
  COLLAGE_LAYOUTS,
  HERO_HEIGHT_SHARE,
  MAX_COLLAGE_PHOTOS,
  collageCapacity,
  collageTiles,
  type CollageArea,
  type CollageLayoutId,
  type CollageTile,
} from "@shared/collageLayout";

const AREA: CollageArea = { x: 60, y: 340, width: 960, height: 800 };
const GAP = 16;
const LAYOUT_IDS = COLLAGE_LAYOUTS.map(entry => entry.id);

/** Überlappen sich zwei Kacheln (mit kleiner Toleranz gegen Rundung)? */
function overlaps(a: CollageTile, b: CollageTile): boolean {
  const eps = 0.001;
  return (
    a.x < b.x + b.width - eps &&
    b.x < a.x + a.width - eps &&
    a.y < b.y + b.height - eps &&
    b.y < a.y + a.height - eps
  );
}

describe("COLLAGE_LAYOUTS", () => {
  it("hat eindeutige Ids und sinnvolle Kapazitäten", () => {
    const ids = COLLAGE_LAYOUTS.map(entry => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    COLLAGE_LAYOUTS.forEach(entry => {
      expect(entry.capacity).toBeGreaterThanOrEqual(2);
      expect(entry.capacity).toBeLessThanOrEqual(MAX_COLLAGE_PHOTOS);
    });
    // Die grösste Anordnung bestimmt die Obergrenze der Auswahl
    expect(Math.max(...COLLAGE_LAYOUTS.map(e => e.capacity))).toBe(
      MAX_COLLAGE_PHOTOS
    );
  });

  it("kennt die Kapazität jeder Anordnung", () => {
    expect(collageCapacity("grid2")).toBe(4);
    expect(collageCapacity("grid3")).toBe(9);
    expect(collageCapacity("hero")).toBe(5);
    expect(collageCapacity("gibtsnicht" as CollageLayoutId)).toBe(0);
  });
});

describe("collageTiles – Randfälle", () => {
  it("liefert ohne Fotos keine Kacheln", () => {
    LAYOUT_IDS.forEach(layout => {
      expect(collageTiles(layout, 0, AREA, GAP)).toEqual([]);
      expect(collageTiles(layout, -3, AREA, GAP)).toEqual([]);
    });
  });

  it("lässt ein einzelnes Foto die ganze Fläche füllen", () => {
    LAYOUT_IDS.forEach(layout => {
      const tiles = collageTiles(layout, 1, AREA, GAP);
      expect(tiles).toHaveLength(1);
      expect(tiles[0]).toEqual({
        x: AREA.x,
        y: AREA.y,
        width: AREA.width,
        height: AREA.height,
      });
    });
  });

  it("schneidet überzählige Fotos ab statt sie zu quetschen", () => {
    LAYOUT_IDS.forEach(layout => {
      const capacity = collageCapacity(layout);
      const tiles = collageTiles(layout, capacity + 7, AREA, GAP);
      expect(tiles).toHaveLength(capacity);
      // Genau voll ergibt dasselbe Bild wie überfüllt
      expect(tiles).toEqual(collageTiles(layout, capacity, AREA, GAP));
    });
  });

  it("rundet Bruchzahlen von Fotos ab", () => {
    expect(collageTiles("grid3", 3.9, AREA, GAP)).toHaveLength(3);
  });

  it("bleibt bei winzigen Flächen und grossen Abständen bei 0", () => {
    const tiny: CollageArea = { x: 0, y: 0, width: 10, height: 10 };
    LAYOUT_IDS.forEach(layout => {
      collageTiles(layout, collageCapacity(layout), tiny, 100).forEach(tile => {
        expect(tile.width).toBeGreaterThanOrEqual(0);
        expect(tile.height).toBeGreaterThanOrEqual(0);
      });
    });
  });
});

describe("collageTiles – allgemeine Zusagen", () => {
  it("bleibt für jede Fotozahl innerhalb der Fläche und überlappungsfrei", () => {
    LAYOUT_IDS.forEach(layout => {
      for (let count = 1; count <= collageCapacity(layout); count++) {
        const tiles = collageTiles(layout, count, AREA, GAP);
        expect(tiles).toHaveLength(count);
        tiles.forEach(tile => {
          expect(tile.width).toBeGreaterThan(0);
          expect(tile.height).toBeGreaterThan(0);
          expect(tile.x).toBeGreaterThanOrEqual(AREA.x - 0.001);
          expect(tile.y).toBeGreaterThanOrEqual(AREA.y - 0.001);
          expect(tile.x + tile.width).toBeLessThanOrEqual(
            AREA.x + AREA.width + 0.001
          );
          expect(tile.y + tile.height).toBeLessThanOrEqual(
            AREA.y + AREA.height + 0.001
          );
        });
        for (let i = 0; i < tiles.length; i++) {
          for (let j = i + 1; j < tiles.length; j++) {
            expect(overlaps(tiles[i], tiles[j])).toBe(false);
          }
        }
      }
    });
  });

  it("füllt die Breite jeder Reihe restlos aus (keine Löcher)", () => {
    LAYOUT_IDS.forEach(layout => {
      for (let count = 1; count <= collageCapacity(layout); count++) {
        const tiles = collageTiles(layout, count, AREA, GAP);
        // Kacheln nach Reihen gruppieren (gleiche y-Position)
        const rows = new Map<number, CollageTile[]>();
        tiles.forEach(tile => {
          const key = Math.round(tile.y);
          rows.set(key, [...(rows.get(key) ?? []), tile]);
        });
        Array.from(rows.values()).forEach(row => {
          const left = Math.min(...row.map(tile => tile.x));
          const right = Math.max(...row.map(tile => tile.x + tile.width));
          expect(left).toBeCloseTo(AREA.x, 6);
          expect(right).toBeCloseTo(AREA.x + AREA.width, 6);
        });
      }
    });
  });

  it("verschiebt sich mit der Fläche mit", () => {
    const moved: CollageArea = {
      x: AREA.x + 200,
      y: AREA.y - 100,
      width: AREA.width,
      height: AREA.height,
    };
    const before = collageTiles("grid3", 5, AREA, GAP);
    const after = collageTiles("grid3", 5, moved, GAP);
    after.forEach((tile, index) => {
      expect(tile.x - before[index].x).toBeCloseTo(200, 6);
      expect(tile.y - before[index].y).toBeCloseTo(-100, 6);
      expect(tile.width).toBeCloseTo(before[index].width, 6);
      expect(tile.height).toBeCloseTo(before[index].height, 6);
    });
  });
});

describe("collageTiles – Raster", () => {
  it("legt zwei Fotos im 2er-Raster nebeneinander", () => {
    const tiles = collageTiles("grid2", 2, AREA, GAP);
    expect(tiles).toHaveLength(2);
    expect(tiles[0].y).toBe(tiles[1].y);
    expect(tiles[0].height).toBeCloseTo(AREA.height, 6);
    expect(tiles[0].width).toBeCloseTo((AREA.width - GAP) / 2, 6);
  });

  it("streckt die letzte Reihe des 2er-Rasters bei drei Fotos", () => {
    const tiles = collageTiles("grid2", 3, AREA, GAP);
    expect(tiles).toHaveLength(3);
    const rowHeight = (AREA.height - GAP) / 2;
    expect(tiles[0].height).toBeCloseTo(rowHeight, 6);
    // Die dritte Kachel steht allein in der zweiten Reihe – über die volle Breite
    expect(tiles[2].width).toBeCloseTo(AREA.width, 6);
    expect(tiles[2].y).toBeCloseTo(AREA.y + rowHeight + GAP, 6);
  });

  it("baut aus vier Fotos ein sauberes 2×2", () => {
    const tiles = collageTiles("grid2", 4, AREA, GAP);
    const width = (AREA.width - GAP) / 2;
    const height = (AREA.height - GAP) / 2;
    tiles.forEach(tile => {
      expect(tile.width).toBeCloseTo(width, 6);
      expect(tile.height).toBeCloseTo(height, 6);
    });
    expect(new Set(tiles.map(tile => Math.round(tile.y))).size).toBe(2);
  });

  it("baut aus neun Fotos ein sauberes 3×3", () => {
    const tiles = collageTiles("grid3", 9, AREA, GAP);
    expect(tiles).toHaveLength(9);
    const width = (AREA.width - 2 * GAP) / 3;
    tiles.forEach(tile => expect(tile.width).toBeCloseTo(width, 6));
    expect(new Set(tiles.map(tile => Math.round(tile.y))).size).toBe(3);
  });

  it("nutzt im 3er-Raster bei zwei Fotos nur zwei Spalten", () => {
    const tiles = collageTiles("grid3", 2, AREA, GAP);
    expect(tiles).toHaveLength(2);
    expect(tiles[0].width).toBeCloseTo((AREA.width - GAP) / 2, 6);
    expect(tiles[0].height).toBeCloseTo(AREA.height, 6);
  });
});

describe("collageTiles – ein grosses Bild plus kleine", () => {
  it("gibt dem ersten Bild die volle Breite und den grösseren Anteil", () => {
    const tiles = collageTiles("hero", 4, AREA, GAP);
    expect(tiles).toHaveLength(4);
    expect(tiles[0].width).toBeCloseTo(AREA.width, 6);
    expect(tiles[0].height).toBeCloseTo(
      (AREA.height - GAP) * HERO_HEIGHT_SHARE,
      6
    );
    // Die drei kleinen stehen in einer Reihe darunter
    expect(tiles[1].y).toBeCloseTo(tiles[2].y, 6);
    expect(tiles[2].y).toBeCloseTo(tiles[3].y, 6);
    expect(tiles[1].y).toBeCloseTo(AREA.y + tiles[0].height + GAP, 6);
    expect(tiles[1].width).toBeCloseTo((AREA.width - 2 * GAP) / 3, 6);
  });

  it("stellt bei zwei Fotos ein breites Band unter das grosse Bild", () => {
    const tiles = collageTiles("hero", 2, AREA, GAP);
    expect(tiles).toHaveLength(2);
    expect(tiles[1].width).toBeCloseTo(AREA.width, 6);
    expect(tiles[0].height).toBeGreaterThan(tiles[1].height);
  });

  it("macht das grosse Bild grösser als jedes kleine", () => {
    const tiles = collageTiles("hero", 5, AREA, GAP);
    const heroArea = tiles[0].width * tiles[0].height;
    tiles.slice(1).forEach(tile => {
      expect(tile.width * tile.height).toBeLessThan(heroArea);
    });
  });
});
