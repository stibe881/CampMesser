/**
 * Routen holen (OSRM der FOSSGIS) – mit Zwischenspeicher und Rückfall.
 *
 * DREI REGELN, die den Umgang mit einem fremden, kostenlosen Dienst
 * bestimmen:
 *
 * 1. NUR AUF ANFORDERUNG. Keine Route wird beim Seitenaufbau geholt,
 *    sondern erst, wenn jemand die Zahl wirklich sehen will.
 * 2. ZWISCHENSPEICHER. Strassen ändern sich selten; dieselbe Strecke wird
 *    nicht zweimal abgefragt. Der Speicher liegt in localStorage und
 *    überlebt damit auch einen Neustart der App.
 * 3. RÜCKFALL STATT FEHLER. Ohne Netz gibt es die Luftlinie mit
 *    Umwegfaktor – als Schätzung gekennzeichnet, nie als Messung.
 */
import {
  MAX_TABLE_TARGETS,
  estimateRoadDistanceM,
  osrmRouteUrl,
  osrmTableUrl,
  parseOsrmRoute,
  parseOsrmTable,
  routeCacheKey,
  type RouteResult,
  type RoutingProfile,
} from "@shared/routing";
import { distanceMeters } from "@shared/geo";
import type { GeoPoint } from "@shared/hiking";

/** localStorage-Schlüssel des Routen-Zwischenspeichers. */
const CACHE_KEY = "campmesser.routeCache";

/** So viele Routen werden behalten; die ältesten fallen heraus. */
const MAX_CACHED_ROUTES = 40;

/**
 * Nach einem Monat neu holen. Länger wäre auch vertretbar – aber eine neue
 * Umfahrungsstrasse soll irgendwann ankommen.
 */
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Abbruch nach 15 Sekunden: Lieber die Schätzung als ein hängendes Feld. */
const REQUEST_TIMEOUT_MS = 15000;

interface CachedRoute {
  at: number;
  distanceM: number;
  durationS: number;
  /** Verlauf, auf 5 Nachkommastellen gerundet gespeichert. */
  points: [number, number][];
}

type Cache = Record<string, CachedRoute>;

function readCache(): Cache {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Cache) : {};
  } catch {
    return {};
  }
}

function writeCache(cache: Cache) {
  try {
    const entries = Object.entries(cache)
      .sort((a, b) => b[1].at - a[1].at)
      .slice(0, MAX_CACHED_ROUTES);
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify(Object.fromEntries(entries))
    );
  } catch {
    /* Voller Speicher: dann eben ohne Zwischenspeicher */
  }
}

/** Schätzung aus der Luftlinie – der Rückfall, wenn keine Route kommt. */
export function estimatedRoute(
  points: GeoPoint[],
  speedKmh: number
): RouteResult {
  let straight = 0;
  for (let i = 1; i < points.length; i++) {
    straight += distanceMeters(
      points[i - 1].lat,
      points[i - 1].lon,
      points[i].lat,
      points[i].lon
    );
  }
  const distanceM = estimateRoadDistanceM(straight);
  return {
    distanceM,
    durationS: speedKmh > 0 ? (distanceM / 1000 / speedKmh) * 3600 : 0,
    points: [...points],
    source: "estimate",
  };
}

/**
 * Route holen. Liefert null, wenn der Dienst nicht erreichbar ist – die
 * Entscheidung, ob dann geschätzt oder nichts angezeigt wird, trifft die
 * aufrufende Ansicht.
 */
export async function fetchRoute(
  points: GeoPoint[],
  profile: RoutingProfile,
  options: { signal?: AbortSignal } = {}
): Promise<RouteResult | null> {
  if (points.length < 2) return null;
  const key = routeCacheKey(profile, points);
  const cache = readCache();
  const hit = cache[key];
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return {
      distanceM: hit.distanceM,
      durationS: hit.durationS,
      points: hit.points.map(([lat, lon]) => ({ lat, lon })),
      source: "route",
    };
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  options.signal?.addEventListener("abort", onAbort);
  try {
    const response = await fetch(osrmRouteUrl(profile, points), {
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const route = parseOsrmRoute(await response.json());
    if (!route) return null;
    cache[key] = {
      at: Date.now(),
      distanceM: route.distanceM,
      durationS: route.durationS,
      points: route.points.map(p => [
        Number(p.lat.toFixed(5)),
        Number(p.lon.toFixed(5)),
      ]),
    };
    writeCache(cache);
    return route;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
    options.signal?.removeEventListener("abort", onAbort);
  }
}

/**
 * Route holen, sonst schätzen. Für Ansichten, die auf jeden Fall eine Zahl
 * zeigen wollen – die Herkunft steht in `source` und gehört sichtbar
 * dazugeschrieben.
 */
export async function routeOrEstimate(
  points: GeoPoint[],
  profile: RoutingProfile,
  fallbackSpeedKmh: number,
  options: { signal?: AbortSignal } = {}
): Promise<RouteResult> {
  const route = await fetchRoute(points, profile, options);
  return route ?? estimatedRoute(points, fallbackSpeedKmh);
}

// ── Distanzen zu vielen Fundorten ─────────────────────────────────────────

/** Zwischenspeicher der Tabellen-Abfragen (Sitzung, nicht localStorage). */
const tableCache = new Map<string, Map<string, number>>();

/**
 * Wegstrecken vom Standort zu mehreren Fundorten – EINE Abfrage für die
 * ganze Liste.
 *
 * Die Suche selbst (Overpass) arbeitet weiter mit einem Radius auf der
 * Luftlinie; das ist die Frage «was ist in der Nähe». Was danach ANGEZEIGT
 * und SORTIERT wird, ist die Wegstrecke: Am anderen Flussufer sind
 * fünfhundert Meter Luftlinie sechs Kilometer über die Brücke.
 *
 * Liefert eine leere Map, wenn nichts zu holen war – die Ansicht bleibt
 * dann bei der Luftlinie und sagt das.
 */
export async function fetchPlaceDistances(
  origin: GeoPoint,
  targets: { id: string; lat: number; lon: number }[],
  profile: RoutingProfile,
  options: { signal?: AbortSignal } = {}
): Promise<Map<string, number>> {
  const limited = targets.slice(0, MAX_TABLE_TARGETS);
  if (limited.length === 0) return new Map();
  const key = `${profile}:${origin.lat.toFixed(3)},${origin.lon.toFixed(3)}|${limited
    .map(t => t.id)
    .join(",")}`;
  const cached = tableCache.get(key);
  if (cached) return cached;

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  options.signal?.addEventListener("abort", onAbort);
  try {
    const response = await fetch(osrmTableUrl(profile, origin, limited), {
      signal: controller.signal,
    });
    if (!response.ok) return new Map();
    const values = parseOsrmTable(await response.json(), limited.length);
    const result = new Map<string, number>();
    limited.forEach((target, index) => {
      const value = values[index];
      if (value != null) result.set(target.id, value);
    });
    tableCache.set(key, result);
    return result;
  } catch {
    return new Map();
  } finally {
    window.clearTimeout(timer);
    options.signal?.removeEventListener("abort", onAbort);
  }
}
