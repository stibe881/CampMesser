/**
 * Overpass-API-Anbindung für «Campingplätze entdecken» auf der Karte:
 * baut die Abfrage für einen Kartenausschnitt (tourism=camp_site als node
 * oder way) und parst die Antwort defensiv – Overpass liefert je nach
 * Spiegel/Server auch unvollständige Elemente, die wir still überspringen.
 * Reine Logik ohne DOM, damit sie in vitest (server/overpass.test.ts)
 * testbar bleibt.
 */

export interface OsmCampsite {
  /** Eindeutig über Element-Typen hinweg, z. B. "node/123" oder "way/456". */
  id: string;
  lat: number;
  lon: number;
  name?: string;
  website?: string;
  phone?: string;
}

export const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

/** Overpass ist rate-limitiert – wir fragen nie mehr als 100 Elemente ab. */
export const OVERPASS_MAX_RESULTS = 100;

/** Unterhalb dieses Zoom-Levels wäre der Ausschnitt zu gross für Overpass. */
export const OVERPASS_MIN_ZOOM = 9;

/** Overpass-QL für Campingplätze im Rechteck Süd/West/Nord/Ost. */
export function overpassQuery(
  south: number,
  west: number,
  north: number,
  east: number
): string {
  const bbox = [south, west, north, east].map(v => v.toFixed(5)).join(",");
  return (
    `[out:json][timeout:15];` +
    `(node["tourism"="camp_site"](${bbox});` +
    `way["tourism"="camp_site"](${bbox}););` +
    `out center ${OVERPASS_MAX_RESULTS};`
  );
}

/** Nur nicht-leere Strings übernehmen (Overpass-Tags sind Freitext). */
function cleanTag(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Website-Tag normalisieren: http(s) direkt, www.-Adressen ergänzen, Rest verwerfen. */
function cleanWebsite(value: unknown): string | undefined {
  const raw = cleanTag(value);
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^www\./i.test(raw)) return `https://${raw}`;
  return undefined;
}

/**
 * Overpass-JSON defensiv in Campingplatz-Pins übersetzen:
 * node → lat/lon direkt, way → center.lat/lon (aus `out center`).
 * Elemente ohne brauchbare Koordinaten werden übersprungen, Duplikate
 * (gleicher Typ + gleiche id) entfernt, hart auf 100 Ergebnisse begrenzt.
 */
export function parseCampsites(json: unknown): OsmCampsite[] {
  if (typeof json !== "object" || json === null) return [];
  const elements = (json as { elements?: unknown }).elements;
  if (!Array.isArray(elements)) return [];

  const seen = new Set<string>();
  const result: OsmCampsite[] = [];
  for (let i = 0; i < elements.length; i++) {
    if (result.length >= OVERPASS_MAX_RESULTS) break;
    const el = elements[i];
    if (typeof el !== "object" || el === null) continue;
    const { type, id, lat, lon, center, tags } = el as {
      type?: unknown;
      id?: unknown;
      lat?: unknown;
      lon?: unknown;
      center?: unknown;
      tags?: unknown;
    };
    if ((type !== "node" && type !== "way") || typeof id !== "number") {
      continue;
    }

    let pinLat: unknown = lat;
    let pinLon: unknown = lon;
    if (type === "way") {
      if (typeof center !== "object" || center === null) continue;
      pinLat = (center as { lat?: unknown }).lat;
      pinLon = (center as { lon?: unknown }).lon;
    }
    if (
      typeof pinLat !== "number" ||
      typeof pinLon !== "number" ||
      !Number.isFinite(pinLat) ||
      !Number.isFinite(pinLon)
    ) {
      continue;
    }

    const key = `${type}/${id}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const tagObj =
      typeof tags === "object" && tags !== null
        ? (tags as Record<string, unknown>)
        : {};
    result.push({
      id: key,
      lat: pinLat,
      lon: pinLon,
      name: cleanTag(tagObj.name),
      website: cleanWebsite(tagObj.website),
      phone: cleanTag(tagObj.phone),
    });
  }
  return result;
}
