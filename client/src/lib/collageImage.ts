/**
 * Foto-Collage einer Reise als teilbares Bild (1080×1350, Instagram-Portrait):
 * zeichnet die gewählten Tagebuch-Fotos schlicht mit der Canvas-API im
 * ReiseKompass-Look – dunkelgrüne Kopfzeile mit der Bildmarke aus BrandLogo.tsx,
 * cremefarbener Grund, bernsteinfarbener Zeitraum, dezente Fusszeile.
 * Dasselbe Muster wie beim Jahresrückblick (#91, lib/yearReviewImage.ts),
 * nur mit Bildern statt Kennzahlen.
 *
 * Die Kachel-Geometrie kommt aus shared/collageLayout.ts und ist dort einzeln
 * geprüft; hier bleibt nur das Zeichnen. Die Bilder müssen von der eigenen
 * Origin geladen sein (/api/trips/photos/…), sonst wäre das Canvas «tainted»
 * und `toBlob` würde scheitern. Bewusst ohne Unit-Test – Canvas ist im jsdom
 * nicht sinnvoll prüfbar.
 */
import {
  collageTiles,
  type CollageArea,
  type CollageLayoutId,
} from "@shared/collageLayout";

// App-Farben (Hex-Näherungen der oklch-Werte aus index.css, helles Design)
const GREEN = "#28523c"; // --primary
const CREAM = "#faf7ee"; // --background
const AMBER = "#dd9a3f"; // --chart-1
const MUTED = "#e7e2d5"; // Platzhalterfläche für fehlende Bilder

const WIDTH = 1080;
const HEIGHT = 1350;
const HEADER_HEIGHT = 250;
const FOOTER_HEIGHT = 80;

/** Fläche der Bilder – zwischen Kopf- und Fusszeile, mit Rand ringsum. */
const PHOTO_AREA: CollageArea = {
  x: 56,
  y: HEADER_HEIGHT + 26,
  width: WIDTH - 112,
  height: HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT - 52,
};
const PHOTO_GAP = 14;
const PHOTO_RADIUS = 18;

const SERIF = "Fraunces, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";

export interface CollageImageData {
  /** Fotos in der gewünschten Reihenfolge – überzählige bleiben aussen vor. */
  photos: HTMLImageElement[];
  layout: CollageLayoutId;
  /** Name der Reise (Kopfzeile) */
  title: string;
  /** Zeitraum der Reise (Zeile darunter) */
  subtitle: string;
}

/** Text auf maxWidth kürzen (mit «…»), damit lange Reisenamen nicht überlaufen. */
function ellipsize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) {
    cut = cut.slice(0, -1);
  }
  return `${cut.trimEnd()}…`;
}

/** Bild «cover»-beschnitten (mittig, füllend) in ein abgerundetes Rechteck. */
function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const scale = Math.max(w / iw, h / ih);
  const sw = w / scale;
  const sh = h / scale;
  ctx.save();
  const clip = new Path2D();
  clip.roundRect(x, y, w, h, radius);
  ctx.clip(clip);
  ctx.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, w, h);
  ctx.restore();
}

/** Die ReiseKompass-Bildmarke (Pfad aus BrandLogo.tsx, viewBox 64) zeichnen. */
function drawLogo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 64, size / 64);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const blade = new Path2D("M14 40 L52 12 C54 19 48 32 36 40 Z");
  ctx.stroke(blade);
  const handle = new Path2D();
  handle.roundRect(8, 43, 48, 13, 6.5);
  ctx.stroke(handle);
  ctx.beginPath();
  ctx.arc(17.5, 49.5, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Die Collage auf das Canvas zeichnen (setzt width/height selbst) und
 * zurückgeben, wie viele Fotos tatsächlich Platz gefunden haben. Danach kann
 * die Aufrufstelle das Canvas per toBlob teilen oder herunterladen.
 */
export function drawCollage(
  canvas: HTMLCanvasElement,
  data: CollageImageData
): number {
  const { photos, layout, title, subtitle } = data;
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return 0;

  // Grund + Kopfzeile
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, WIDTH, HEADER_HEIGHT);
  drawLogo(ctx, WIDTH / 2 - 36, 26, 72, CREAM);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = CREAM;
  ctx.font = `700 56px ${SERIF}`;
  ctx.fillText(ellipsize(ctx, title, WIDTH - 120), WIDTH / 2, 165);
  ctx.fillStyle = AMBER;
  ctx.font = `600 32px ${SANS}`;
  ctx.fillText(ellipsize(ctx, subtitle, WIDTH - 120), WIDTH / 2, 213);

  // Fotos in den berechneten Kacheln
  const tiles = collageTiles(layout, photos.length, PHOTO_AREA, PHOTO_GAP);
  tiles.forEach((tile, index) => {
    const photo = photos[index];
    if (!photo) return;
    // Heller Grund unter dem Bild: fällt ein Foto aus (kaputt, noch nicht
    // geladen), bleibt eine ruhige Fläche statt eines Lochs stehen
    ctx.save();
    ctx.fillStyle = MUTED;
    const shape = new Path2D();
    shape.roundRect(tile.x, tile.y, tile.width, tile.height, PHOTO_RADIUS);
    ctx.fill(shape);
    ctx.restore();
    drawCoverImage(
      ctx,
      photo,
      tile.x,
      tile.y,
      tile.width,
      tile.height,
      PHOTO_RADIUS
    );
  });

  // Fusszeile
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, HEIGHT - FOOTER_HEIGHT, WIDTH, FOOTER_HEIGHT);
  ctx.fillStyle = CREAM;
  ctx.font = `600 32px ${SANS}`;
  ctx.fillText("meinreisekompass.ch", WIDTH / 2, HEIGHT - 30);

  return tiles.length;
}
