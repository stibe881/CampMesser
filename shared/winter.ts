/**
 * Winter-Hinweise fürs Camp-Wetter: Frost (#428) und Schneefallgrenze
 * (#429). Für Herbst- und Wintercamping entscheiden diese zwei Zahlen
 * den Abend: Bei Frost gehören Wassertank und Leitungen geleert, und ob
 * es am Berg regnet oder schneit, sagt die Schneefallgrenze.
 *
 * BEIDE MELDEN SICH NUR, WENN ES ETWAS ZU SAGEN GIBT – dasselbe Prinzip
 * wie Kondens- (#397) und Umschwung-Hinweis (#417): Eine Karte «kein
 * Frost» im Juli wäre Lärm, und Lärm schaltet man ab.
 */

/** Ab dieser Tiefsttemperatur gilt die Nacht als Frostnacht. */
export const FROST_LIMIT_C = 0;

export interface FrostDay {
  date: string;
  tempMinC: number;
}

/**
 * Die Frostnächte der nächsten Tage (höchstens `limit` Prognosetage).
 * Leer heisst: kein Frost in Sicht, nichts anzeigen.
 */
export function frostNights(days: readonly FrostDay[], limit = 3): FrostDay[] {
  return days
    .slice(0, limit)
    .filter(day => day.tempMinC <= FROST_LIMIT_C)
    .map(day => ({ date: day.date, tempMinC: day.tempMinC }));
}

/** Schneefallgrenze ≈ Nullgradgrenze minus dieser Faustwert (Meter). */
export const SNOW_LINE_OFFSET_M = 300;
/** Oberhalb davon ist die Grenze fürs Camping-Publikum kein Thema. */
export const SNOW_LINE_RELEVANT_M = 2500;
/** Ab dieser Regenwahrscheinlichkeit ist Niederschlag «in Sicht». */
export const SNOW_LINE_MIN_PRECIP_PROBABILITY = 30;

export interface SnowLineHour {
  freezingLevelM?: number | null;
  precipitationProbability: number;
  /** Schneehöhe am Boden in Metern (#470) – fehlt bei alten Abrufen. */
  snowDepthM?: number | null;
}

/** Unter dieser Schneehöhe (cm) gibt es nichts zu melden – das ist Reif. */
export const SNOW_DEPTH_MIN_CM = 5;

/**
 * Aktuelle Schneehöhe am Boden (#470): der erste vorhandene Stundenwert,
 * auf ganze Zentimeter gerundet. null, wenn der Dienst nichts liefert
 * oder weniger als SNOW_DEPTH_MIN_CM liegt – eine Karte «0 cm Schnee»
 * im Juli wäre Lärm.
 */
export function snowDepthNow(
  hours: readonly SnowLineHour[]
): { depthCm: number } | null {
  const meters = hours.find(
    hour => typeof hour.snowDepthM === "number"
  )?.snowDepthM;
  if (typeof meters !== "number") return null;
  const depthCm = Math.round(meters * 100);
  if (depthCm < SNOW_DEPTH_MIN_CM) return null;
  return { depthCm };
}

/**
 * Die tiefste zu erwartende Schneefallgrenze der nächsten Stunden –
 * gerundet auf 100 m. null, wenn (a) der Dienst keine Nullgradgrenze
 * liefert, (b) gar kein Niederschlag in Sicht ist (eine Schneefallgrenze
 * ohne Niederschlag ist ein akademischer Wert) oder (c) die Grenze so
 * hoch liegt, dass sie niemanden betrifft.
 */
export function snowLineOutlook(
  hours: readonly SnowLineHour[],
  count = 24
): { minLevelM: number } | null {
  const window = hours.slice(0, count);
  const withPrecip = window.some(
    hour => hour.precipitationProbability >= SNOW_LINE_MIN_PRECIP_PROBABILITY
  );
  if (!withPrecip) return null;
  const levels = window
    .map(hour => hour.freezingLevelM)
    .filter((level): level is number => typeof level === "number");
  if (levels.length === 0) return null;
  const minLevel = Math.min(...levels) - SNOW_LINE_OFFSET_M;
  if (minLevel > SNOW_LINE_RELEVANT_M) return null;
  return { minLevelM: Math.max(0, Math.round(minLevel / 100) * 100) };
}
