/**
 * Jahresrückblick als teilbares Bild (1080×1350, Instagram-Portrait):
 * zeichnet die Kennzahlen der Rückblick-Karte schlicht mit der Canvas-API
 * (keine html2canvas-Dependency) im CampMesser-Look – cremefarbener Grund,
 * dunkelgrüne Kopfzeile mit der Bildmarke aus BrandLogo.tsx, grosse Zahlen,
 * bernsteinfarbene Akzente. Die Texte kommen aus dem trips-Namespace des
 * Wörterbuchs und werden von der Aufrufstelle hereingereicht; `lang` steuert
 * nur die Zahlenformate (LOCALE_TAGS). Bewusst ohne Unit-Test – Canvas ist im
 * jsdom nicht sinnvoll prüfbar.
 */
import { LOCALE_TAGS, type Language } from "@shared/i18n";
import type { YearReview } from "@shared/trips";

export interface YearReviewImageLabels {
  /** Zeile unter dem Markennamen, z. B. «Jahresrückblick 2026» */
  subtitle: string;
  stays: string;
  nights: string;
  places: string;
  topPlace: string;
  longestStay: string;
  bestRated: string;
  nightsCount: (n: number) => string;
  starsAvg: (value: string) => string;
}

export interface YearReviewImageData {
  review: YearReview;
  labels: YearReviewImageLabels;
  /**
   * Optionales Titelbild (best bewerteter bzw. längster Trip des Jahres):
   * fertig geladenes Bild von der eigenen Origin (/api/trips/photos/…) –
   * das Canvas bleibt dadurch untainted und toBlob funktioniert. Ohne Bild
   * bleibt das Layout unverändert.
   */
  coverImage?: HTMLImageElement;
}

// App-Farben (Hex-Näherungen der oklch-Werte aus index.css, helles Design)
const GREEN = "#28523c"; // --primary
const CREAM = "#faf7ee"; // --background
const AMBER = "#dd9a3f"; // --chart-1
const INK = "#2f3a33"; // --foreground
const MUTED = "#6b756c"; // --muted-foreground

const WIDTH = 1080;
const HEIGHT = 1350;

const SERIF = "Fraunces, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";

/** Text auf maxWidth kürzen (mit «…»), damit lange Ortsnamen nicht überlaufen. */
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

/** Bild «cover»-beschnitten (mittig, füllend) in ein abgerundetes Rechteck zeichnen. */
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

/** Die CampMesser-Bildmarke (Pfad aus BrandLogo.tsx, viewBox 64) zeichnen. */
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
  // Klinge
  const blade = new Path2D("M14 40 L52 12 C54 19 48 32 36 40 Z");
  ctx.stroke(blade);
  // Griff (abgerundetes Rechteck)
  const handle = new Path2D();
  handle.roundRect(8, 43, 48, 13, 6.5);
  ctx.stroke(handle);
  // Nietenpunkt
  ctx.beginPath();
  ctx.arc(17.5, 49.5, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Den Jahresrückblick auf das Canvas zeichnen (setzt width/height selbst).
 * Danach kann die Aufrufstelle das Canvas per toBlob teilen oder herunterladen.
 */
export function drawYearReview(
  canvas: HTMLCanvasElement,
  data: YearReviewImageData,
  lang: Language
): void {
  const { review, labels, coverImage } = data;
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const fmt = (n: number) => n.toLocaleString(LOCALE_TAGS[lang]);
  const fmtRating = (n: number) =>
    n.toLocaleString(LOCALE_TAGS[lang], { maximumFractionDigits: 1 });

  // Grund + Kopfzeile
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, WIDTH, 330);
  drawLogo(ctx, WIDTH / 2 - 55, 40, 110, CREAM);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = CREAM;
  ctx.font = `700 64px ${SERIF}`;
  ctx.fillText("CampMesser", WIDTH / 2, 232);
  ctx.fillStyle = AMBER;
  ctx.font = `600 40px ${SANS}`;
  ctx.fillText(ellipsize(ctx, labels.subtitle, WIDTH - 120), WIDTH / 2, 296);

  // Drei grosse Zahlen: Aufenthalte · Nächte · Orte
  const stats: { value: string; label: string }[] = [
    { value: fmt(review.trips), label: labels.stays },
    { value: fmt(review.nights), label: labels.nights },
    { value: fmt(review.places), label: labels.places },
  ];
  const col = WIDTH / 3;
  stats.forEach((stat, i) => {
    const cx = col * i + col / 2;
    ctx.fillStyle = GREEN;
    ctx.font = `700 130px ${SERIF}`;
    ctx.fillText(stat.value, cx, 540);
    ctx.fillStyle = MUTED;
    ctx.font = `500 34px ${SANS}`;
    ctx.fillText(ellipsize(ctx, stat.label, col - 40), cx, 600);
  });

  // Mit Titelbild: abgerundetes Banner statt Trennlinie, Highlights kompakter
  const hasCover = Boolean(coverImage);
  if (coverImage) {
    drawCoverImage(ctx, coverImage, 80, 636, WIDTH - 160, 270, 24);
  } else {
    // Trennlinie
    ctx.strokeStyle = AMBER;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(140, 668);
    ctx.lineTo(WIDTH - 140, 668);
    ctx.stroke();
  }

  // Highlights: Top-Platz, längster Aufenthalt, best bewerteter Platz
  const dash = "–";
  const highlights: { label: string; value: string; extra: string }[] = [
    {
      label: labels.topPlace,
      value: review.topPlace?.name ?? dash,
      extra: review.topPlace ? labels.nightsCount(review.topPlace.nights) : "",
    },
    {
      label: labels.longestStay,
      value: review.longestStay?.name ?? dash,
      extra: review.longestStay
        ? labels.nightsCount(review.longestStay.nights)
        : "",
    },
    {
      label: labels.bestRated,
      value: review.bestRated?.name ?? dash,
      extra: review.bestRated
        ? labels.starsAvg(fmtRating(review.bestRated.rating))
        : "",
    },
  ];
  highlights.forEach((item, i) => {
    const top = hasCover ? 985 + i * 105 : 750 + i * 170;
    if (!hasCover) {
      // Rauten-Punkt als Akzent (nur im luftigen Layout ohne Titelbild)
      ctx.save();
      ctx.translate(WIDTH / 2, top - 12);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = AMBER;
      ctx.fillRect(-9, -9, 18, 18);
      ctx.restore();
    }
    ctx.fillStyle = MUTED;
    ctx.font = hasCover ? `600 26px ${SANS}` : `600 30px ${SANS}`;
    ctx.fillText(
      ellipsize(ctx, item.label.toUpperCase(), WIDTH - 160),
      WIDTH / 2,
      top + (hasCover ? 0 : 44)
    );
    ctx.fillStyle = INK;
    ctx.font = hasCover ? `600 42px ${SERIF}` : `600 48px ${SERIF}`;
    const value = item.extra
      ? `${ellipsize(ctx, item.value, WIDTH - 420)} · ${item.extra}`
      : item.value;
    ctx.fillText(
      ellipsize(ctx, value, WIDTH - 120),
      WIDTH / 2,
      top + (hasCover ? 48 : 104)
    );
  });

  // Fusszeile
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, HEIGHT - 80, WIDTH, 80);
  ctx.fillStyle = CREAM;
  ctx.font = `600 34px ${SANS}`;
  ctx.fillText("campmesser.ch", WIDTH / 2, HEIGHT - 30);
}
