/**
 * Overpass-API-Anbindung für «Campingplätze entdecken» auf der Karte:
 * baut die Abfrage für einen Kartenausschnitt (tourism=camp_site als node
 * oder way) und parst die Antwort defensiv – Overpass liefert je nach
 * Spiegel/Server auch unvollständige Elemente, die wir still überspringen.
 * Reine Logik ohne DOM, damit sie in vitest (server/overpass.test.ts)
 * testbar bleibt.
 *
 * Zweiter Nutzer derselben Anbindung: die markierten Wanderrouten rund um
 * einen Platz (#238, `hikingRoutesQuery`/`parseHikingRoutes`). Gleiches
 * Muster, gleiche Rücksicht: gefragt wird nur auf ausdrücklichen Klick, nie
 * automatisch – Overpass ist rate-limitiert.
 *
 * Dritter Nutzer: die offiziellen Feuer- und Grillstellen (#247,
 * `firepitsQuery`/`firepitsBboxQuery`/`parseFirepits`).
 */
import { distanceMeters } from "@shared/geo";
import {
  parseOsmDistanceMeters,
  parseOsmElevationMeters,
  parseSacScale,
  type GeoPoint,
  type SacGrade,
} from "@shared/hiking";

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

/** Die `elements`-Liste einer Overpass-Antwort defensiv lesen. */
function readElements(json: unknown): unknown[] {
  if (typeof json !== "object" || json === null) return [];
  const elements = (json as { elements?: unknown }).elements;
  return Array.isArray(elements) ? elements : [];
}

/** Ein Overpass-Element, auf Punkt und Tags heruntergebrochen. */
interface OsmPointElement {
  /** Eindeutig über Element-Typen hinweg, z. B. "node/123" oder "way/456". */
  key: string;
  lat: number;
  lon: number;
  tags: Record<string, unknown>;
}

/**
 * node/way defensiv auf einen Punkt reduzieren: node → lat/lon direkt,
 * way → center.lat/lon (aus `out center`). Alles Unbrauchbare ergibt `null`
 * und wird von den Parsern still übersprungen.
 */
function readPointElement(el: unknown): OsmPointElement | null {
  if (typeof el !== "object" || el === null) return null;
  const { type, id, lat, lon, center, tags } = el as {
    type?: unknown;
    id?: unknown;
    lat?: unknown;
    lon?: unknown;
    center?: unknown;
    tags?: unknown;
  };
  if ((type !== "node" && type !== "way") || typeof id !== "number") {
    return null;
  }

  let pinLat: unknown = lat;
  let pinLon: unknown = lon;
  if (type === "way") {
    if (typeof center !== "object" || center === null) return null;
    pinLat = (center as { lat?: unknown }).lat;
    pinLon = (center as { lon?: unknown }).lon;
  }
  if (
    typeof pinLat !== "number" ||
    typeof pinLon !== "number" ||
    !Number.isFinite(pinLat) ||
    !Number.isFinite(pinLon)
  ) {
    return null;
  }

  return {
    key: `${type}/${id}`,
    lat: pinLat,
    lon: pinLon,
    tags:
      typeof tags === "object" && tags !== null
        ? (tags as Record<string, unknown>)
        : {},
  };
}

/**
 * Overpass-JSON defensiv in Campingplatz-Pins übersetzen.
 * Elemente ohne brauchbare Koordinaten werden übersprungen, Duplikate
 * (gleicher Typ + gleiche id) entfernt, hart auf 100 Ergebnisse begrenzt.
 */
export function parseCampsites(json: unknown): OsmCampsite[] {
  const elements = readElements(json);
  const seen = new Set<string>();
  const result: OsmCampsite[] = [];
  for (let i = 0; i < elements.length; i++) {
    if (result.length >= OVERPASS_MAX_RESULTS) break;
    const point = readPointElement(elements[i]);
    if (!point || seen.has(point.key)) continue;
    seen.add(point.key);
    result.push({
      id: point.key,
      lat: point.lat,
      lon: point.lon,
      name: cleanTag(point.tags.name),
      website: cleanWebsite(point.tags.website),
      phone: cleanTag(point.tags.phone),
    });
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* Wanderwege in der Nähe (#238)                                       */
/* ------------------------------------------------------------------ */

/** Eine markierte Wanderroute aus OSM (Relation mit route=hiking/foot). */
export interface OsmHikingRoute {
  /** Eindeutige Id, z. B. "relation/123". */
  id: string;
  name?: string;
  /** Wegnummer der Route, z. B. "4" für den Alpenpanorama-Weg. */
  ref?: string;
  /** Netz-Ebene: iwn/nwn/rwn/lwn (international … lokal). */
  network?: string;
  /** Schwierigkeit nach SAC-Skala – nur wenn sac_scale gepflegt ist. */
  sacScale?: SacGrade;
  /** Gesamtlänge in Metern aus dem distance-Tag (nicht aus der Geometrie). */
  distanceM?: number;
  /** Aufstieg in Metern aus dem ascent-Tag. */
  ascentM?: number;
  /** Abstieg in Metern aus dem descent-Tag. */
  descentM?: number;
  website?: string;
  /**
   * Wegführung im Suchausschnitt, ein Eintrag je Relations-Mitglied. Overpass
   * schneidet sie auf die Bounding-Box zu (`out geom(bbox)`) – für einen
   * Weitwanderweg kommt also nur das Stück in der Nähe.
   */
  segments: GeoPoint[][];
}

/** Auswählbare Suchradien rund um den Platz in Metern. */
export const HIKING_SEARCH_RADII_M = [5000, 10000, 20000];

/** Voreingestellter Suchradius in Metern. */
export const HIKING_DEFAULT_RADIUS_M = 10000;

/** Höchstzahl der Routen je Abfrage – die Antwort trägt Geometrie mit. */
export const OVERPASS_HIKING_MAX_RESULTS = 30;

/** Grad pro Meter in Nord-Süd-Richtung (Erdumfang durch 360). */
const METERS_PER_DEGREE_LAT = 111320;

/**
 * Umkreis in eine Bounding-Box umrechnen (grob, aber für den Kartenausschnitt
 * genau genug): Nord-Süd fix, Ost-West mit dem Kosinus der Breite gestreckt.
 * Nahe den Polen wird der Kosinus geklemmt, damit die Box endlich bleibt.
 */
export function boundingBoxAround(
  lat: number,
  lon: number,
  radiusM: number
): { south: number; west: number; north: number; east: number } {
  const dLat = radiusM / METERS_PER_DEGREE_LAT;
  const cos = Math.max(0.01, Math.cos((lat * Math.PI) / 180));
  const dLon = radiusM / (METERS_PER_DEGREE_LAT * cos);
  return {
    south: Math.max(-90, lat - dLat),
    west: Math.max(-180, lon - dLon),
    north: Math.min(90, lat + dLat),
    east: Math.min(180, lon + dLon),
  };
}

/**
 * Overpass-QL für markierte Wanderrouten im Umkreis: Relationen vom Typ
 * route mit route=hiking oder route=foot. `out geom(bbox)` liefert die
 * Wegführung bereits auf den Suchausschnitt zugeschnitten – damit bleibt die
 * Antwort auch bei Weitwanderwegen klein und die Distanz zum Platz lässt sich
 * ehrlich am Weg messen statt an dessen Mitte.
 */
export function hikingRoutesQuery(
  lat: number,
  lon: number,
  radiusM: number
): string {
  const box = boundingBoxAround(lat, lon, radiusM);
  const bbox = [box.south, box.west, box.north, box.east]
    .map(v => v.toFixed(5))
    .join(",");
  const around = `${Math.round(radiusM)},${lat.toFixed(5)},${lon.toFixed(5)}`;
  return (
    `[out:json][timeout:25];` +
    `relation["type"="route"]["route"~"^(hiking|foot)$"](around:${around});` +
    `out geom(${bbox}) ${OVERPASS_HIKING_MAX_RESULTS};`
  );
}

/** Punktreihe eines Relations-Mitglieds defensiv lesen (kaputte Punkte raus). */
function parseGeometry(value: unknown): GeoPoint[] {
  if (!Array.isArray(value)) return [];
  const points: GeoPoint[] = [];
  for (let i = 0; i < value.length; i++) {
    const raw = value[i];
    if (typeof raw !== "object" || raw === null) continue;
    const { lat, lon } = raw as { lat?: unknown; lon?: unknown };
    if (
      typeof lat !== "number" ||
      typeof lon !== "number" ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon)
    ) {
      continue;
    }
    points.push({ lat, lon });
  }
  return points;
}

/**
 * Overpass-JSON in Wanderrouten übersetzen. Relationen ohne einen einzigen
 * brauchbaren Punkt fliegen raus (ohne Wegführung liesse sich weder Distanz
 * noch Karte zeigen); Duplikate werden entfernt, das Ergebnis hart begrenzt.
 * Fehlende Tags bleiben `undefined` – die Oberfläche zeigt dann «–», statt zu
 * schätzen.
 */
export function parseHikingRoutes(json: unknown): OsmHikingRoute[] {
  const elements = readElements(json);
  const seen = new Set<string>();
  const result: OsmHikingRoute[] = [];
  for (let i = 0; i < elements.length; i++) {
    if (result.length >= OVERPASS_HIKING_MAX_RESULTS) break;
    const el = elements[i];
    if (typeof el !== "object" || el === null) continue;
    const { type, id, members, tags } = el as {
      type?: unknown;
      id?: unknown;
      members?: unknown;
      tags?: unknown;
    };
    if (type !== "relation" || typeof id !== "number") continue;

    const key = `relation/${id}`;
    if (seen.has(key)) continue;

    const segments: GeoPoint[][] = [];
    if (Array.isArray(members)) {
      for (let m = 0; m < members.length; m++) {
        const member = members[m];
        if (typeof member !== "object" || member === null) continue;
        const points = parseGeometry(
          (member as { geometry?: unknown }).geometry
        );
        if (points.length >= 2) segments.push(points);
      }
    }
    if (segments.length === 0) continue;
    seen.add(key);

    const tagObj =
      typeof tags === "object" && tags !== null
        ? (tags as Record<string, unknown>)
        : {};
    const distanceM = parseOsmDistanceMeters(tagObj.distance);
    const ascentM = parseOsmElevationMeters(tagObj.ascent);
    const descentM = parseOsmElevationMeters(tagObj.descent);
    const sacScale = parseSacScale(tagObj.sac_scale);
    result.push({
      id: key,
      name: cleanTag(tagObj.name),
      ref: cleanTag(tagObj.ref),
      network: cleanTag(tagObj.network),
      sacScale: sacScale ?? undefined,
      distanceM: distanceM ?? undefined,
      ascentM: ascentM ?? undefined,
      descentM: descentM ?? undefined,
      website: cleanWebsite(tagObj.website),
      segments,
    });
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* Feuerstellen & Grillstellen (#247)                                  */
/* ------------------------------------------------------------------ */

/**
 * Zwei klar verschiedene Dinge, die OSM getrennt führt und die wir deshalb
 * auch getrennt kennzeichnen: `leisure=firepit` ist die offene Feuerstelle
 * (Ring aus Steinen, Grillrost, meist mit Sitzgelegenheit), `amenity=bbq`
 * der fest installierte Grill.
 */
export type FirepitKind = "firepit" | "bbq";

/** Eine offizielle Feuer- oder Grillstelle aus OSM. */
export interface OsmFirepit {
  /** Eindeutig über Element-Typen hinweg, z. B. "node/123". */
  id: string;
  lat: number;
  lon: number;
  kind: FirepitKind;
  name?: string;
  /** `covered=yes/no` – überdacht (Unterstand, Hütte). */
  covered?: boolean;
  /** `fuel:wood=yes/no` – Brennholz vor Ort. */
  firewood?: boolean;
  /** `drinking_water=yes/no` – Trinkwasser an der Stelle. */
  drinkingWater?: boolean;
}

/** Auswählbare Suchradien rund um den Platz in Metern. */
export const FIREPIT_SEARCH_RADII_M = [2000, 5000, 10000];

/** Voreingestellter Suchradius in Metern – Feuerstellen sucht man zu Fuss. */
export const FIREPIT_DEFAULT_RADIUS_M = 5000;

/** Höchstzahl der Stellen je Abfrage. */
export const OVERPASS_FIREPIT_MAX_RESULTS = 60;

/**
 * Die vier abgefragten Element-Arten mit demselben Ortsfilter (`(around:…)`
 * oder eine Bounding-Box). Grillstellen sind meist Punkte, grosse Feuerstellen
 * gelegentlich Flächen – deshalb node UND way.
 */
function firepitElements(filter: string): string {
  return (
    `node["leisure"="firepit"]${filter};` +
    `way["leisure"="firepit"]${filter};` +
    `node["amenity"="bbq"]${filter};` +
    `way["amenity"="bbq"]${filter};`
  );
}

/** Overpass-QL für Feuer- und Grillstellen im Umkreis (Platz-Dossier). */
export function firepitsQuery(
  lat: number,
  lon: number,
  radiusM: number
): string {
  const filter = `(around:${Math.round(radiusM)},${lat.toFixed(5)},${lon.toFixed(5)})`;
  return (
    `[out:json][timeout:20];` +
    `(${firepitElements(filter)});` +
    `out center ${OVERPASS_FIREPIT_MAX_RESULTS};`
  );
}

/** Overpass-QL für Feuer- und Grillstellen im Kartenausschnitt (Karten-Ebene). */
export function firepitsBboxQuery(
  south: number,
  west: number,
  north: number,
  east: number
): string {
  const bbox = [south, west, north, east].map(v => v.toFixed(5)).join(",");
  return (
    `[out:json][timeout:20];` +
    `(${firepitElements(`(${bbox})`)});` +
    `out center ${OVERPASS_FIREPIT_MAX_RESULTS};`
  );
}

/**
 * OSM-Ja/Nein-Tag lesen. Alles Uneindeutige (`limited`, `seasonal`, Freitext)
 * bleibt `undefined` – die Oberfläche behauptet dann nichts, statt zu raten.
 */
export function parseOsmYesNo(value: unknown): boolean | undefined {
  const raw = cleanTag(value);
  if (!raw) return undefined;
  const normalized = raw.toLowerCase();
  if (normalized === "yes" || normalized === "true" || normalized === "1") {
    return true;
  }
  if (normalized === "no" || normalized === "false" || normalized === "0") {
    return false;
  }
  return undefined;
}

/** Feuerstelle oder Grill? Alles andere gehört nicht in diese Ebene. */
function firepitKind(tags: Record<string, unknown>): FirepitKind | null {
  if (cleanTag(tags.leisure) === "firepit") return "firepit";
  if (cleanTag(tags.amenity) === "bbq") return "bbq";
  return null;
}

/**
 * Overpass-JSON in Feuer- und Grillstellen übersetzen. Elemente ohne
 * passenden Typ-Tag fliegen raus (die Abfrage kann bei zusammengesetzten
 * Antworten mehr liefern), Duplikate werden entfernt, das Ergebnis hart
 * begrenzt. Fehlende Tags bleiben `undefined`.
 */
export function parseFirepits(json: unknown): OsmFirepit[] {
  const elements = readElements(json);
  const seen = new Set<string>();
  const result: OsmFirepit[] = [];
  for (let i = 0; i < elements.length; i++) {
    if (result.length >= OVERPASS_FIREPIT_MAX_RESULTS) break;
    const point = readPointElement(elements[i]);
    if (!point || seen.has(point.key)) continue;
    const kind = firepitKind(point.tags);
    if (!kind) continue;
    seen.add(point.key);
    result.push({
      id: point.key,
      lat: point.lat,
      lon: point.lon,
      kind,
      name: cleanTag(point.tags.name),
      covered: parseOsmYesNo(point.tags.covered),
      firewood: parseOsmYesNo(point.tags["fuel:wood"]),
      drinkingWater: parseOsmYesNo(point.tags.drinking_water),
    });
  }
  return result;
}

/** Eine Feuerstelle mit der Luftlinie zum Bezugspunkt. */
export interface FirepitDistance {
  firepit: OsmFirepit;
  distanceM: number;
}

/**
 * Feuer- und Grillstellen nach Luftlinie sortieren und auf die nächsten
 * `limit` kürzen. Bei gleicher Distanz entscheidet die Id, damit die
 * Reihenfolge stabil und ohne Locale-Einfluss testbar bleibt.
 */
export function nearestFirepits(
  list: readonly OsmFirepit[],
  latitude: number,
  longitude: number,
  limit: number
): FirepitDistance[] {
  if (limit <= 0) return [];
  return list
    .map(firepit => ({
      firepit,
      distanceM: distanceMeters(latitude, longitude, firepit.lat, firepit.lon),
    }))
    .sort(
      (a, b) =>
        a.distanceM - b.distanceM ||
        (a.firepit.id < b.firepit.id ? -1 : a.firepit.id > b.firepit.id ? 1 : 0)
    )
    .slice(0, limit);
}
