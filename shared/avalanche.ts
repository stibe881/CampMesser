/**
 * SLF-Lawinen-Warnstufe (#471) für Wintersport-Reisen in der Schweiz.
 *
 * QUELLE: Das offene Lawinenbulletin des WSL-Instituts für Schnee- und
 * Lawinenforschung SLF (aws.slf.ch, CAAML-GeoJSON). Es deckt NUR die
 * Schweiz ab – für Reiseziele ausserhalb bleibt die Zeile ehrlich weg,
 * statt eine fremde Skala zu erfinden.
 *
 * Die Zuordnung Koordinate → Warnregion läuft über einen einfachen
 * Punkt-in-Polygon-Test (Ray Casting) über die GeoJSON-Flächen des
 * Bulletins. Reine Funktionen – Client und Tests teilen sie.
 */

import { l4, type L4 } from "./i18n";

/** Bulletin-URL; die Warnstufen sind in jeder Sprache dieselben. */
export const SLF_BULLETIN_URL =
  "https://aws.slf.ch/api/bulletin/caaml/de/geojson";

/**
 * Grobe Bounding-Box der Schweiz: reicht, um zu entscheiden, ob sich die
 * Anfrage ans SLF überhaupt lohnt. Die Feinarbeit macht danach der
 * Punkt-in-Polygon-Test gegen die echten Warnregionen.
 */
export function inSwitzerland(lat: number, lon: number): boolean {
  return lat >= 45.7 && lat <= 47.95 && lon >= 5.8 && lon <= 10.6;
}

/** Europäische Gefahrenskala 1–5 – Namen wie im Bulletin. */
export const AVALANCHE_LEVEL_LABELS: Record<number, L4> = {
  1: l4("gering", "faible", "debole", "low"),
  2: l4("mässig", "limité", "moderato", "moderate"),
  3: l4("erheblich", "marqué", "marcato", "considerable"),
  4: l4("gross", "fort", "forte", "high"),
  5: l4("sehr gross", "très fort", "molto forte", "very high"),
};

/** CAAML-Textwerte («considerable») oder Zahlen auf die Stufe 1–5 bringen. */
export function dangerLevelFromValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const level = Math.round(value);
    return level >= 1 && level <= 5 ? level : null;
  }
  if (typeof value !== "string") return null;
  const named: Record<string, number> = {
    low: 1,
    moderate: 2,
    considerable: 3,
    high: 4,
    very_high: 5,
  };
  const trimmed = value.trim().toLowerCase();
  if (trimmed in named) return named[trimmed];
  const numeric = Number(trimmed);
  if (Number.isFinite(numeric) && numeric >= 1 && numeric <= 5) {
    return Math.round(numeric);
  }
  return null;
}

/** Ein GeoJSON-Ring ([lon, lat][]) – liegt der Punkt darin? (Ray Casting) */
export function pointInRing(
  ring: readonly (readonly number[])[],
  lat: number,
  lon: number
): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Punkt-in-Geometrie für Polygon und MultiPolygon: Der erste Ring ist die
 * Aussengrenze, weitere Ringe sind Löcher (Punkt im Loch = draussen).
 */
export function pointInGeometry(
  geometry: unknown,
  lat: number,
  lon: number
): boolean {
  if (!geometry || typeof geometry !== "object") return false;
  const { type, coordinates } = geometry as {
    type?: unknown;
    coordinates?: unknown;
  };
  if (!Array.isArray(coordinates)) return false;
  const inPolygon = (rings: unknown): boolean => {
    if (!Array.isArray(rings) || rings.length === 0) return false;
    if (!pointInRing(rings[0] as number[][], lat, lon)) return false;
    for (let i = 1; i < rings.length; i++) {
      if (pointInRing(rings[i] as number[][], lat, lon)) return false;
    }
    return true;
  };
  if (type === "Polygon") return inPolygon(coordinates);
  if (type === "MultiPolygon") {
    return coordinates.some(polygon => inPolygon(polygon));
  }
  return false;
}

/**
 * Höchste Warnstufe der Region, in der der Punkt liegt – oder null, wenn
 * keine Region passt oder das Bulletin keine Stufe nennt. Bei nach Höhe
 * geteilten Stufen (oberhalb/unterhalb) zählt bewusst die höhere.
 */
export function avalancheDangerAt(
  geojson: unknown,
  lat: number,
  lon: number
): { level: number } | null {
  if (!geojson || typeof geojson !== "object") return null;
  const features = (geojson as { features?: unknown }).features;
  if (!Array.isArray(features)) return null;
  let max: number | null = null;
  for (const feature of features) {
    if (!feature || typeof feature !== "object") continue;
    const { geometry, properties } = feature as {
      geometry?: unknown;
      properties?: unknown;
    };
    if (!pointInGeometry(geometry, lat, lon)) continue;
    for (const level of featureDangerLevels(properties)) {
      if (max === null || level > max) max = level;
    }
  }
  return max === null ? null : { level: max };
}

/** Alle Stufen aus den Properties eines Features (defensiv gelesen). */
function featureDangerLevels(properties: unknown): number[] {
  if (!properties || typeof properties !== "object") return [];
  const record = properties as Record<string, unknown>;
  const levels: number[] = [];
  const push = (value: unknown) => {
    const level = dangerLevelFromValue(value);
    if (level !== null) levels.push(level);
  };
  // CAAML v6: dangerRatings: [{ mainValue: "considerable", … }, …]
  if (Array.isArray(record.dangerRatings)) {
    for (const rating of record.dangerRatings) {
      if (rating && typeof rating === "object") {
        push((rating as Record<string, unknown>).mainValue);
      }
    }
  }
  // Verbreitete Kurzformen in aggregierten GeoJSON-Diensten
  push(record.max_danger_rating);
  push(record.maxDangerRating);
  push(record.dangerLevel);
  return levels;
}

/* ------------------------------------------------------------------ */
/* Euregio Tirol/Südtirol/Trentino (#490)                              */
/* ------------------------------------------------------------------ */

/**
 * Neben dem SLF gibt es genau eine weitere offene Quelle mit gleicher
 * europäischer Gefahrenskala und stabiler Schnittstelle: das gemeinsame
 * Bulletin der Euregio (avalanche.report, Lawinenwarndienste Tirol,
 * Südtirol und Trentino). Es deckt NUR diese drei Regionen ab – der
 * Rest Österreichs und Italiens bleibt ehrlich ohne Zeile.
 *
 * Der Weg ist dreistufig, alle Endpunkte öffentlich und ohne Schlüssel:
 *   1. «latest» nennt das Datum des aktuellen Bulletins.
 *   2. Das CAAML-JSON pro Region nennt Warnstufen je Mikro-Region-ID.
 *   3. Die EAWS-Mikro-Region-Polygone machen aus der Koordinate die ID.
 */
export const EUREGIO_LATEST_URL =
  "https://api.avalanche.report/albina/api/bulletins/latest";

export interface EuregioRegion {
  code: string;
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

/** Grobe Bounding-Boxen – die Feinarbeit machen die Mikro-Regionen. */
export const EUREGIO_REGIONS: EuregioRegion[] = [
  { code: "AT-07", minLat: 46.6, maxLat: 47.8, minLon: 10.0, maxLon: 12.9 },
  { code: "IT-32-BZ", minLat: 46.2, maxLat: 47.1, minLon: 10.3, maxLon: 12.5 },
  { code: "IT-32-TN", minLat: 45.6, maxLat: 46.55, minLon: 10.4, maxLon: 12.0 },
];

/** Kandidaten-Regionen für eine Koordinate (Boxen überlappen bewusst). */
export function euregioRegionsAt(lat: number, lon: number): string[] {
  return EUREGIO_REGIONS.filter(
    r =>
      lat >= r.minLat && lat <= r.maxLat && lon >= r.minLon && lon <= r.maxLon
  ).map(r => r.code);
}

/** «2026-05-02T15:00:00Z» → «2026-05-02»; alles andere → null. */
export function parseEuregioDate(json: unknown): string | null {
  if (!json || typeof json !== "object") return null;
  const date = (json as { date?: unknown }).date;
  if (typeof date !== "string") return null;
  const day = date.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

export function euregioBulletinUrl(day: string, region: string): string {
  return `https://static.avalanche.report/eaws_bulletins/${day}/${day}-${region}.json`;
}

export function euregioMicroRegionsUrl(region: string): string {
  return `https://regions.avalanches.org/micro-regions/${region}_micro-regions.geojson.json`;
}

/** Mikro-Region-ID, in deren Polygon die Koordinate liegt – oder null. */
export function microRegionAt(
  geojson: unknown,
  lat: number,
  lon: number
): string | null {
  if (!geojson || typeof geojson !== "object") return null;
  const features = (geojson as { features?: unknown }).features;
  if (!Array.isArray(features)) return null;
  for (const feature of features) {
    if (!feature || typeof feature !== "object") continue;
    const { geometry, properties } = feature as {
      geometry?: unknown;
      properties?: unknown;
    };
    if (!pointInGeometry(geometry, lat, lon)) continue;
    const id =
      properties && typeof properties === "object"
        ? (properties as { id?: unknown }).id
        : undefined;
    if (typeof id === "string" && id) return id;
  }
  return null;
}

/**
 * Höchste Warnstufe aller Bulletins, die diese Mikro-Region nennen – wie
 * beim SLF zählt bei nach Höhe/Tageszeit geteilten Stufen die höhere.
 */
export function euregioDangerForRegion(
  bulletinsJson: unknown,
  regionId: string
): { level: number } | null {
  if (!bulletinsJson || typeof bulletinsJson !== "object") return null;
  const bulletins = (bulletinsJson as { bulletins?: unknown }).bulletins;
  if (!Array.isArray(bulletins)) return null;
  let max: number | null = null;
  for (const bulletin of bulletins) {
    if (!bulletin || typeof bulletin !== "object") continue;
    const record = bulletin as Record<string, unknown>;
    const regions = Array.isArray(record.regions) ? record.regions : [];
    const hit = regions.some(
      region =>
        region &&
        typeof region === "object" &&
        (region as { regionID?: unknown }).regionID === regionId
    );
    if (!hit) continue;
    const ratings = Array.isArray(record.dangerRatings)
      ? record.dangerRatings
      : [];
    for (const rating of ratings) {
      if (!rating || typeof rating !== "object") continue;
      const level = dangerLevelFromValue(
        (rating as { mainValue?: unknown }).mainValue
      );
      if (level !== null && (max === null || level > max)) max = level;
    }
  }
  return max === null ? null : { level: max };
}
