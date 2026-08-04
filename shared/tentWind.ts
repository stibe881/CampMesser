/**
 * Windrichtungs-Assistent (#251): Wie stelle ich Zelt oder Tarp in den Wind?
 *
 * Die Faustregeln dahinter sind alt und einfach:
 *  - Ein Tunnel- oder Firstzelt zeigt mit dem SCHMALEN Ende (Eingang bzw.
 *    Fussende) in den Wind. Der Wind streicht dann über die lange, flache
 *    Seite ab, statt gegen die grosse Fläche zu drücken.
 *  - Ein Kuppelzelt ist weitgehend rund; entscheidend ist, dass der EINGANG
 *    windabgewandt liegt – sonst bläht der Wind das Zelt beim Öffnen auf.
 *  - Ein Tarp wird mit der TIEFEN Kante gegen den Wind abgespannt.
 *
 * Meteorologisch zählt: Die Windrichtung gibt an, WOHER der Wind kommt.
 * Ein Wind aus 270° (West) bläst also nach Osten. Genau das ist die häufigste
 * Verwechslung, deshalb rechnet dieses Modul es einmal sauber aus und alle
 * Anzeigen greifen darauf zu.
 *
 * Reine Rechnerei, kein Abruf und kein DOM – Client und Tests teilen sich das.
 */

/** Bauart, nach der sich die Ausrichtung richtet. */
export const TENT_SHAPES = ["tunnel", "dome", "tarp"] as const;
export type TentShape = (typeof TENT_SHAPES)[number];

/** Windstärken-Stufen für die Empfehlung (Böen in km/h). */
export type WindLevel = "calm" | "breezy" | "windy" | "storm";

/** Ab diesen Böen wird es unangenehm bzw. gefährlich (km/h). */
export const WIND_LEVEL_THRESHOLDS = {
  breezy: 20,
  windy: 40,
  storm: 60,
} as const;

/** Winkel auf 0…360 bringen. */
export function normalizeDegrees(deg: number): number {
  if (!Number.isFinite(deg)) return 0;
  const value = deg % 360;
  return value < 0 ? value + 360 : value;
}

/**
 * Richtung, in die der Wind BLÄST – die Gegenrichtung zur gemeldeten
 * Herkunft. Aus 270° (Wind aus West) wird 90° (bläst nach Osten).
 */
export function windBlowsToward(fromDeg: number): number {
  return normalizeDegrees(fromDeg + 180);
}

/**
 * Kleinster Winkel zwischen zwei Richtungen, 0…180 – egal, herum welche
 * Seite. Damit lässt sich sagen, wie weit die aktuelle Ausrichtung von der
 * empfohlenen abweicht.
 */
export function angleDifference(a: number, b: number): number {
  const diff = Math.abs(normalizeDegrees(a) - normalizeDegrees(b));
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Empfohlene Ausrichtung je Bauart, als Winkel, in den die Zeltspitze bzw.
 * die tiefe Tarp-Kante zeigen soll.
 *
 * - Tunnel/First: schmales Ende IN den Wind, also in die Herkunftsrichtung.
 * - Kuppel: Eingang WEG vom Wind, also in die Blasrichtung.
 * - Tarp: tiefe Kante gegen den Wind, wie beim Tunnel.
 */
export function recommendedHeading(
  windFromDeg: number,
  shape: TentShape
): number {
  const from = normalizeDegrees(windFromDeg);
  return shape === "dome" ? windBlowsToward(from) : from;
}

/** Einstufung der Böen. */
export function windLevel(gustKmh: number): WindLevel {
  if (!Number.isFinite(gustKmh) || gustKmh < WIND_LEVEL_THRESHOLDS.breezy) {
    return "calm";
  }
  if (gustKmh < WIND_LEVEL_THRESHOLDS.windy) return "breezy";
  if (gustKmh < WIND_LEVEL_THRESHOLDS.storm) return "windy";
  return "storm";
}

/** Wie gut die aktuelle Ausrichtung passt. */
export type AlignmentQuality = "good" | "fair" | "poor";

/** Ab dieser Abweichung gilt die Ausrichtung als gut bzw. brauchbar. */
export const ALIGNMENT_GOOD_DEG = 20;
export const ALIGNMENT_FAIR_DEG = 45;

export function alignmentQuality(offsetDeg: number): AlignmentQuality {
  const offset = Math.abs(offsetDeg);
  if (offset <= ALIGNMENT_GOOD_DEG) return "good";
  if (offset <= ALIGNMENT_FAIR_DEG) return "fair";
  return "poor";
}

/** Ergebnis der Ausrichtungs-Hilfe. */
export interface TentWindAdvice {
  /** Woher der Wind kommt, 0…360. */
  windFromDeg: number;
  /** Wohin der Wind bläst, 0…360. */
  windTowardDeg: number;
  /** Empfohlene Ausrichtung für die gewählte Bauart, 0…360. */
  recommendedDeg: number;
  /** Abweichung der aktuellen Blickrichtung von der Empfehlung, 0…180. */
  offsetDeg: number | null;
  /** Bewertung der aktuellen Ausrichtung – null ohne Kompass. */
  quality: AlignmentQuality | null;
  /** Einstufung der Böen. */
  level: WindLevel;
  /** In welche Richtung man sich drehen muss: -180…180, negativ = links. */
  turnDeg: number | null;
}

/**
 * Alles auf einmal: empfohlene Ausrichtung, Abweichung und in welche Richtung
 * gedreht werden muss. Ohne Kompass (heading = null) bleiben die
 * gerätebezogenen Werte null – die Empfehlung selbst steht trotzdem.
 */
export function tentWindAdvice(
  windFromDeg: number,
  gustKmh: number,
  shape: TentShape,
  headingDeg: number | null
): TentWindAdvice {
  const from = normalizeDegrees(windFromDeg);
  const recommended = recommendedHeading(from, shape);
  const hasHeading = headingDeg !== null && Number.isFinite(headingDeg);
  const heading = hasHeading ? normalizeDegrees(headingDeg as number) : null;
  const offset =
    heading === null ? null : angleDifference(heading, recommended);
  // Vorzeichen: negativ nach links, positiv nach rechts drehen
  let turn: number | null = null;
  if (heading !== null) {
    const raw = normalizeDegrees(recommended - heading);
    turn = raw > 180 ? raw - 360 : raw;
  }
  return {
    windFromDeg: from,
    windTowardDeg: windBlowsToward(from),
    recommendedDeg: recommended,
    offsetDeg: offset,
    quality: offset === null ? null : alignmentQuality(offset),
    level: windLevel(gustKmh),
    turnDeg: turn,
  };
}
