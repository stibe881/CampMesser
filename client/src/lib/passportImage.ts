/**
 * Reisepass als teilbares Bild (#646, 1080×1350 wie der Jahresrückblick):
 * zeichnet Deckblatt und Stempel mit der Canvas-API im ReiseKompass-Look.
 * Die Stempelformen sind dieselben wie im SVG der Pass-Seite (Kreis,
 * Raute, Wappen, Zackenrad) – Form, Farbe und Schräglage kommen aus
 * `stampLook`, der Pass sieht als Bild also aus wie am Bildschirm.
 *
 * NEBENWIRKUNG MIT ABSICHT: In der nativen App braucht das Bild kein
 * neues Expo-Build – «Als Bild sichern» funktioniert dort sofort, auch
 * solange der Druck-Weg noch auf das App-Update wartet.
 *
 * Bewusst ohne Unit-Test – Canvas ist im jsdom nicht sinnvoll prüfbar
 * (gleiche Begründung wie yearReviewImage.ts).
 */
import { LOCALE_TAGS, type Language } from "@shared/i18n";
import type { PassportStamp } from "@shared/passport";

export interface PassportImageLabels {
  /** Zeile unter dem Markennamen, z. B. «Reisepass · Familie». */
  subtitle: string;
  /** Titel-Zeile («Zeltgast» …) oder der Kein-Stempel-Text. */
  rankTitle: string;
  /** Zusammenfassung «5 Plätze · 23 Nächte». */
  summary: string;
  nights: (count: number) => string;
}

const GREEN = "#28523c";
const CREAM = "#faf7ee";
const INK = "#2f3a33";
const MUTED = "#6b756c";

const WIDTH = 1080;
const HEIGHT = 1350;

const SERIF = "Fraunces, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";

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

/** Eine Stempelform um (0,0) mit «Radius» r zeichnen – wie das SVG. */
function drawStampShape(
  ctx: CanvasRenderingContext2D,
  stamp: PassportStamp,
  r: number
) {
  ctx.strokeStyle = stamp.color;
  ctx.lineWidth = r * 0.12;
  ctx.beginPath();
  if (stamp.shape === "kreis") {
    ctx.arc(0, 0, r * 0.84, 0, Math.PI * 2);
  } else if (stamp.shape === "raute") {
    ctx.moveTo(0, -r * 0.88);
    ctx.lineTo(r * 0.88, 0);
    ctx.lineTo(0, r * 0.88);
    ctx.lineTo(-r * 0.88, 0);
    ctx.closePath();
  } else if (stamp.shape === "wappen") {
    // M14 14 H86 V58 Q86 84 50 94 Q14 84 14 58 Z – auf r skaliert
    const s = (v: number) => ((v - 50) / 50) * r;
    ctx.moveTo(s(14), s(14));
    ctx.lineTo(s(86), s(14));
    ctx.lineTo(s(86), s(58));
    ctx.quadraticCurveTo(s(86), s(84), s(50), s(94));
    ctx.quadraticCurveTo(s(14), s(84), s(14), s(58));
    ctx.closePath();
  } else {
    // Zackenrad: gestrichelter Aussenkreis + feiner Innenkreis
    ctx.setLineDash([r * 0.14, r * 0.1]);
    ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.lineWidth = r * 0.05;
    ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
  }
  ctx.stroke();
}

/**
 * Den Pass auf das Canvas zeichnen. Gezeigt werden höchstens 12 Stempel
 * (3×4) – wer mehr hat, sieht die neusten; das Bild bleibt lesbar.
 */
export function drawPassport(
  canvas: HTMLCanvasElement,
  stamps: readonly PassportStamp[],
  labels: PassportImageLabels,
  lang: Language
): void {
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Kopf: grünes Band mit Marke und Untertitel
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, WIDTH, 220);
  ctx.fillStyle = CREAM;
  ctx.font = `700 64px ${SERIF}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText("ReiseKompass", 64, 105);
  ctx.font = `400 40px ${SANS}`;
  ctx.globalAlpha = 0.85;
  ctx.fillText(ellipsize(ctx, labels.subtitle, WIDTH - 128), 64, 170);
  ctx.globalAlpha = 1;

  // Deckblatt-Zeilen: Titel gross, Zusammenfassung darunter
  ctx.fillStyle = GREEN;
  ctx.font = `700 72px ${SERIF}`;
  ctx.fillText(ellipsize(ctx, labels.rankTitle, WIDTH - 128), 64, 330);
  ctx.fillStyle = MUTED;
  ctx.font = `400 42px ${SANS}`;
  ctx.fillText(ellipsize(ctx, labels.summary, WIDTH - 128), 64, 395);

  // Stempel-Raster 3×4, die NEUSTEN zuerst, gezeichnet in Leserichtung
  const shown = stamps.slice(-12);
  const cols = 3;
  const cellW = (WIDTH - 128) / cols;
  const cellH = 220;
  const top = 460;
  shown.forEach((stamp, index) => {
    const cx = 64 + (index % cols) * cellW + cellW / 2;
    const cy = top + Math.floor(index / cols) * cellH + 80;
    const r = 72;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((stamp.tiltDeg * Math.PI) / 180);
    drawStampShape(ctx, stamp, r);
    ctx.fillStyle = stamp.color;
    ctx.textAlign = "center";
    ctx.font = `700 34px ${SANS}`;
    ctx.fillText(`${stamp.visits}×`, 0, -2);
    ctx.font = `400 24px ${SANS}`;
    ctx.fillText(stamp.firstVisit.slice(0, 4), 0, 32);
    ctx.restore();

    ctx.textAlign = "center";
    ctx.fillStyle = INK;
    ctx.font = `600 28px ${SANS}`;
    ctx.fillText(ellipsize(ctx, stamp.place, cellW - 24), cx, cy + 118);
    ctx.fillStyle = MUTED;
    ctx.font = `400 24px ${SANS}`;
    ctx.fillText(labels.nights(stamp.nights), cx, cy + 150);
    ctx.textAlign = "left";
  });

  // Fusszeile mit Stand-Datum
  ctx.fillStyle = MUTED;
  ctx.font = `400 28px ${SANS}`;
  ctx.fillText(
    new Date().toLocaleDateString(LOCALE_TAGS[lang]),
    64,
    HEIGHT - 48
  );
  ctx.textAlign = "right";
  ctx.fillText("meinreisekompass.ch", WIDTH - 64, HEIGHT - 48);
  ctx.textAlign = "left";
}
