// Erzeugt alle App-Symbole aus der Kompass-Bildmarke (BrandLogo.tsx).
// Aufruf: node scripts/generate-icons.mjs
//
// WARUM VON HAND GERECHNET: Das Repo hat bewusst keine Bild-Bibliothek
// (sharp & Co. sind native Abhängigkeiten für einen einmaligen Zweck).
// Die Marke besteht aus Kreis, Strecken und einer Raute – das lässt sich
// exakt als Abstandsrechnung pro Pixel auswerten, 8-fach überabgetastet,
// und als PNG (zlib ist in Node eingebaut) bzw. ICO schreiben. Die
// Geometrie MUSS mit BrandLogo.tsx übereinstimmen (64er-Koordinatenraum).
import { deflateSync, crc32 } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "../client/public");

/** Alpine-Elegance-Farben (index.css): Tannengrün und Creme. */
const FOREST = [0x1d, 0x42, 0x30, 255];
const CREAM = [0xfa, 0xf6, 0xef, 255];
const CLEAR = [0, 0, 0, 0];

// --- Geometrie im 64er-Raum von BrandLogo.tsx ---
const CX = 32;
const CY = 34;
const RING_R = 21;
const TICK = [32, 5, 32, 9];
// Nadel-Raute: Nordost-Spitze, Ost-Taille, Südwest-Spitze, West-Taille.
const NE = [42.6, 23.4];
const E = [35.2, 37.2];
const SW = [21.4, 44.6];
const W = [28.8, 30.8];
const DOT_R = 2.4;

function distSeg(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(
    0,
    Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy))
  );
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function inTriangle(px, py, [ax, ay], [bx, by], [cx, cy]) {
  const s1 = (bx - ax) * (py - ay) - (by - ay) * (px - ax);
  const s2 = (cx - bx) * (py - by) - (cy - by) * (px - bx);
  const s3 = (ax - cx) * (py - cy) - (ay - cy) * (px - cx);
  return (s1 >= 0 && s2 >= 0 && s3 >= 0) || (s1 <= 0 && s2 <= 0 && s3 <= 0);
}

/** Gehört der Punkt (im 64er-Raum) zur Marke? stroke = Strichbreite. */
function inMark(x, y, stroke, withDetails) {
  const half = stroke / 2;
  if (Math.abs(Math.hypot(x - CX, y - CY) - RING_R) <= half) return true;
  const edges = [
    [NE, E],
    [E, SW],
    [SW, W],
    [W, NE],
  ];
  for (const [a, b] of edges) if (distSeg(x, y, a, b) <= half) return true;
  if (inTriangle(x, y, NE, E, W)) return true;
  if (withDetails) {
    if (distSeg(x, y, [TICK[0], TICK[1]], [TICK[2], TICK[3]]) <= half)
      return true;
    if (Math.hypot(x - CX, y - CY) <= DOT_R) return true;
  }
  return false;
}

/**
 * Rendert die Marke als RGBA-Puffer (überabgetastet, weiche Kanten).
 * `pad` schrumpft die Marke um einen Rand in 64er-Einheiten – nötig für
 * Maskable-Icons: Android darf kreisrund maskieren, und der Nord-Strich
 * läge sonst ausserhalb der sicheren Zone (innere 80 %).
 */
function render(size, { stroke = 4, bg = FOREST, fg = CREAM, pad = 0 } = {}) {
  const withDetails = size >= 32;
  const ss = size <= 64 ? 8 : 4;
  const px = new Uint8Array(size * size * 4);
  const step = (64 + 2 * pad) / size / ss;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let hits = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const ux = (x * ss + sx + 0.5) * step - pad;
          const uy = (y * ss + sy + 0.5) * step - pad;
          if (inMark(ux, uy, stroke, withDetails)) hits++;
        }
      }
      const a = hits / (ss * ss);
      const o = (y * size + x) * 4;
      for (let c = 0; c < 4; c++) {
        px[o + c] = Math.round(bg[c] + (fg[c] - bg[c]) * a);
      }
    }
  }
  return px;
}

// --- PNG-Schreiber (Farbtyp 6 = RGBA, Filter 0 pro Zeile) ---
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
}

function toPng(pixels, size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // Bittiefe
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    Buffer.from(pixels.buffer, y * size * 4, size * 4).copy(
      raw,
      y * (size * 4 + 1) + 1
    );
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// --- ICO-Schreiber (32-Bit-BGRA-Bitmaps mit leerer AND-Maske) ---
function toIco(entries) {
  const header = Buffer.alloc(6 + entries.length * 16);
  header.writeUInt16LE(1, 2); // Typ: Icon
  header.writeUInt16LE(entries.length, 4);
  let offset = header.length;
  const blobs = [];
  entries.forEach(({ pixels, size }, i) => {
    const maskRow = Math.ceil(size / 32) * 4;
    const bmp = Buffer.alloc(40 + size * size * 4 + size * maskRow);
    bmp.writeUInt32LE(40, 0);
    bmp.writeInt32LE(size, 4);
    bmp.writeInt32LE(size * 2, 8); // Höhe zählt XOR- und AND-Maske
    bmp.writeUInt16LE(1, 12);
    bmp.writeUInt16LE(32, 14);
    for (let y = 0; y < size; y++) {
      const src = (size - 1 - y) * size * 4; // Bitmaps stehen kopf
      for (let x = 0; x < size; x++) {
        const o = 40 + (y * size + x) * 4;
        bmp[o] = pixels[src + x * 4 + 2];
        bmp[o + 1] = pixels[src + x * 4 + 1];
        bmp[o + 2] = pixels[src + x * 4];
        bmp[o + 3] = pixels[src + x * 4 + 3];
      }
    }
    const e = 6 + i * 16;
    header[e] = size < 256 ? size : 0;
    header[e + 1] = size < 256 ? size : 0;
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(bmp.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += bmp.length;
    blobs.push(bmp);
  });
  return Buffer.concat([header, ...blobs]);
}

mkdirSync(join(OUT, "icons"), { recursive: true });
const write = (rel, buf) => {
  writeFileSync(join(OUT, rel), buf);
  console.log(rel, buf.length, "Bytes");
};

// Kleine Grössen bekommen dickere Striche, sonst verschwindet der Ring.
write("icons/favicon-16.png", toPng(render(16, { stroke: 6.5 }), 16));
write("icons/favicon-32.png", toPng(render(32, { stroke: 5 }), 32));
write("icons/icon-192.png", toPng(render(192, { pad: 6 }), 192));
write("icons/icon-512.png", toPng(render(512, { pad: 6 }), 512));
write("icons/apple-touch-icon.png", toPng(render(180), 180));
write(
  "icons/logo-mark.png",
  toPng(render(512, { bg: CLEAR, fg: FOREST }), 512)
);
write(
  "favicon.ico",
  toIco([
    { size: 16, pixels: render(16, { stroke: 6.5 }) },
    { size: 32, pixels: render(32, { stroke: 5 }) },
    { size: 48, pixels: render(48, { stroke: 4.5 }) },
  ])
);
