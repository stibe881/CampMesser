/**
 * Lawinen-Warnstufe laden (#471, Euregio-Ausbau #490).
 *
 * Zwei Quellen, gleiche Skala: Das SLF-Bulletin für die Schweiz und das
 * Euregio-Bulletin (avalanche.report) für Tirol/Südtirol/Trentino. Die
 * Rohdokumente sind gross (Warnregionen samt Polygonen), deshalb wird
 * nur das ERGEBNIS pro gerundeter Koordinate zwischengespeichert, nie
 * das Rohdokument. Bulletins erscheinen zweimal täglich; drei Stunden
 * Cache reichen. Fehler ergeben null – die Zeile bleibt dann weg.
 */
import {
  avalancheDangerAt,
  euregioBulletinUrl,
  euregioDangerForRegion,
  euregioMicroRegionsUrl,
  euregioRegionsAt,
  EUREGIO_LATEST_URL,
  inSwitzerland,
  microRegionAt,
  parseEuregioDate,
  SLF_BULLETIN_URL,
} from "@shared/avalanche";

const CACHE_TTL_MS = 3 * 60 * 60 * 1000;
const CACHE_KEY_PREFIX = "campmesser.avalanche.";

export type AvalancheSource = "slf" | "euregio";

export interface AvalancheDangerResult {
  level: number;
  source: AvalancheSource;
}

interface CacheEntry {
  fetchedAt: number;
  /** null = Punkt liegt in keiner Warnregion oder ohne Stufe. */
  level: number | null;
  source?: AvalancheSource;
}

const memoryCache = new Map<string, CacheEntry>();

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`avalanche ${res.status}`);
  return res.json();
}

/** SLF: ein Dokument, Punkt-in-Polygon direkt über die Warnregionen. */
async function loadSlf(lat: number, lon: number): Promise<number | null> {
  const danger = avalancheDangerAt(await fetchJson(SLF_BULLETIN_URL), lat, lon);
  return danger?.level ?? null;
}

/**
 * Euregio: erst das Bulletin-Datum, dann pro Kandidaten-Region die
 * Mikro-Region des Punkts suchen und die Stufe aus dem CAAML lesen.
 */
async function loadEuregio(lat: number, lon: number): Promise<number | null> {
  const day = parseEuregioDate(await fetchJson(EUREGIO_LATEST_URL));
  if (!day) return null;
  for (const region of euregioRegionsAt(lat, lon)) {
    let regionId: string | null = null;
    try {
      regionId = microRegionAt(
        await fetchJson(euregioMicroRegionsUrl(region)),
        lat,
        lon
      );
    } catch {
      continue;
    }
    if (!regionId) continue;
    const danger = euregioDangerForRegion(
      await fetchJson(euregioBulletinUrl(day, region)),
      regionId
    );
    if (danger) return danger.level;
  }
  return null;
}

export async function loadAvalancheDanger(
  lat: number,
  lon: number,
  now = new Date()
): Promise<AvalancheDangerResult | null> {
  const source: AvalancheSource | null = inSwitzerland(lat, lon)
    ? "slf"
    : euregioRegionsAt(lat, lon).length > 0
      ? "euregio"
      : null;
  if (!source) return null;

  const cacheKey = `${CACHE_KEY_PREFIX}${lat.toFixed(2)},${lon.toFixed(2)}`;

  const cached = memoryCache.get(cacheKey);
  if (cached) {
    return cached.level === null
      ? null
      : { level: cached.level, source: cached.source ?? source };
  }

  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CacheEntry>;
      if (
        typeof parsed.fetchedAt === "number" &&
        now.getTime() - parsed.fetchedAt < CACHE_TTL_MS &&
        (parsed.level === null || typeof parsed.level === "number")
      ) {
        const entry: CacheEntry = {
          fetchedAt: parsed.fetchedAt,
          level: parsed.level ?? null,
          source: parsed.source ?? source,
        };
        memoryCache.set(cacheKey, entry);
        return entry.level == null
          ? null
          : { level: entry.level, source: entry.source ?? source };
      }
    }
  } catch {
    // defekter Eintrag – ignorieren, wird neu geladen
  }

  try {
    const level =
      source === "slf" ? await loadSlf(lat, lon) : await loadEuregio(lat, lon);
    const entry: CacheEntry = { fetchedAt: now.getTime(), level, source };
    memoryCache.set(cacheKey, entry);
    try {
      localStorage.setItem(cacheKey, JSON.stringify(entry));
    } catch {
      // Speicher voll/blockiert – der In-Memory-Cache reicht für die Sitzung
    }
    return level === null ? null : { level, source };
  } catch {
    return null;
  }
}
