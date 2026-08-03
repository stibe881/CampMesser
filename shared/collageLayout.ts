/**
 * Kachel-Rechnerei für die Foto-Collage einer Reise (#226): verteilt n Bilder
 * auf eine rechteckige Fläche – reine Geometrie, ohne Canvas und ohne DOM,
 * damit sie einzeln prüfbar bleibt. Das Zeichnen macht danach
 * client/src/lib/collageImage.ts.
 *
 * Grundregel aller Anordnungen: KEINE Löcher. Passen weniger Bilder als
 * Plätze da sind, wird die letzte Reihe auf die volle Breite gestreckt –
 * ein einzelnes Foto füllt die ganze Fläche. Mehr Bilder als Plätze werden
 * nicht gequetscht, sondern abgeschnitten; die Aufrufstelle zeigt an, wie
 * viele hineinpassen.
 */

export type CollageLayoutId = "grid2" | "grid3" | "hero";

/** Rechteck (Bildkoordinaten in Pixel). */
export interface CollageArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Platz eines einzelnen Fotos in der Collage. */
export type CollageTile = CollageArea;

export interface CollageLayoutInfo {
  id: CollageLayoutId;
  /** Höchstzahl Fotos, die diese Anordnung aufnimmt */
  capacity: number;
}

/**
 * Die wählbaren Anordnungen:
 * - `grid2`: Raster mit zwei Spalten (bis 2×2)
 * - `grid3`: Raster mit drei Spalten (bis 3×3)
 * - `hero`: ein grosses Bild oben, darunter eine Reihe kleiner
 */
export const COLLAGE_LAYOUTS: CollageLayoutInfo[] = [
  { id: "grid2", capacity: 4 },
  { id: "grid3", capacity: 9 },
  { id: "hero", capacity: 5 },
];

/** Höchstzahl Fotos über alle Anordnungen – Obergrenze der Auswahl. */
export const MAX_COLLAGE_PHOTOS = 9;

/** Anteil der Höhe, den das grosse Bild der `hero`-Anordnung einnimmt. */
export const HERO_HEIGHT_SHARE = 0.6;

/** Wie viele Fotos diese Anordnung aufnimmt. */
export function collageCapacity(layout: CollageLayoutId): number {
  const info = COLLAGE_LAYOUTS.find(entry => entry.id === layout);
  return info ? info.capacity : 0;
}

/** Spaltenzahl der Raster-Anordnungen. */
function gridColumns(layout: CollageLayoutId): number {
  return layout === "grid3" ? 3 : 2;
}

/** Nie negative Kantenlängen zurückgeben (sehr kleine Flächen, grosse Lücken). */
function positive(value: number): number {
  return value > 0 ? value : 0;
}

/**
 * Eine Reihe von `count` Kacheln über die volle Breite verteilen.
 * Der Abstand `gap` liegt jeweils ZWISCHEN den Kacheln, nicht am Rand.
 */
function rowTiles(
  count: number,
  x: number,
  y: number,
  width: number,
  height: number,
  gap: number
): CollageTile[] {
  const tileWidth = positive((width - (count - 1) * gap) / count);
  const tiles: CollageTile[] = [];
  for (let index = 0; index < count; index++) {
    tiles.push({
      x: x + index * (tileWidth + gap),
      y,
      width: tileWidth,
      height: positive(height),
    });
  }
  return tiles;
}

/**
 * Die Plätze für `photoCount` Fotos in der gewählten Anordnung.
 * Zurück kommen höchstens `collageCapacity(layout)` Kacheln – überzählige
 * Fotos bleiben aussen vor.
 */
export function collageTiles(
  layout: CollageLayoutId,
  photoCount: number,
  area: CollageArea,
  gap: number
): CollageTile[] {
  const used = Math.min(
    Math.max(Math.floor(photoCount), 0),
    collageCapacity(layout)
  );
  if (used === 0) return [];
  // Ein einziges Foto füllt in jeder Anordnung die ganze Fläche
  if (used === 1) {
    return [
      {
        x: area.x,
        y: area.y,
        width: positive(area.width),
        height: positive(area.height),
      },
    ];
  }

  if (layout === "hero") {
    // Grosses Bild oben über die volle Breite, der Rest in einer Reihe darunter
    const heroHeight = positive((area.height - gap) * HERO_HEIGHT_SHARE);
    const restHeight = positive(area.height - gap - heroHeight);
    return [
      {
        x: area.x,
        y: area.y,
        width: positive(area.width),
        height: heroHeight,
      },
      ...rowTiles(
        used - 1,
        area.x,
        area.y + heroHeight + gap,
        area.width,
        restHeight,
        gap
      ),
    ];
  }

  // Raster: volle Spaltenzahl, ausser es gibt weniger Fotos als Spalten
  const columns = Math.min(gridColumns(layout), used);
  const rows = Math.ceil(used / columns);
  const rowHeight = positive((area.height - (rows - 1) * gap) / rows);
  const tiles: CollageTile[] = [];
  for (let row = 0; row < rows; row++) {
    // Die letzte Reihe nimmt nur den Rest – und streckt ihn auf die Breite
    const remaining = used - row * columns;
    const inRow = Math.min(columns, remaining);
    tiles.push(
      ...rowTiles(
        inRow,
        area.x,
        area.y + row * (rowHeight + gap),
        area.width,
        rowHeight,
        gap
      )
    );
  }
  return tiles;
}
