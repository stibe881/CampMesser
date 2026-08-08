/**
 * SLF-Lawinen-Warnstufe laden (#471) – das Bulletin-GeoJSON ist gross
 * (die Warnregionen der ganzen Schweiz), deshalb wird nur das ERGEBNIS
 * pro gerundeter Koordinate zwischengespeichert, nie das Rohdokument.
 * Das Bulletin erscheint zweimal täglich; drei Stunden Cache reichen.
 * Fehler ergeben null – die Zeile bleibt dann einfach weg.
 */
import { avalancheDangerAt, SLF_BULLETIN_URL } from "@shared/avalanche";

const CACHE_TTL_MS = 3 * 60 * 60 * 1000;
const CACHE_KEY_PREFIX = "campmesser.avalanche.";

interface CacheEntry {
  fetchedAt: number;
  /** null = Punkt liegt in keiner Warnregion oder ohne Stufe. */
  level: number | null;
}

const memoryCache = new Map<string, number | null>();

export async function loadAvalancheDanger(
  lat: number,
  lon: number,
  now = new Date()
): Promise<{ level: number } | null> {
  const cacheKey = `${CACHE_KEY_PREFIX}${lat.toFixed(2)},${lon.toFixed(2)}`;

  if (memoryCache.has(cacheKey)) {
    const level = memoryCache.get(cacheKey) ?? null;
    return level === null ? null : { level };
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
        memoryCache.set(cacheKey, parsed.level ?? null);
        return parsed.level == null ? null : { level: parsed.level };
      }
    }
  } catch {
    // defekter Eintrag – ignorieren, wird neu geladen
  }

  try {
    const res = await fetch(SLF_BULLETIN_URL);
    if (!res.ok) return null;
    const danger = avalancheDangerAt(await res.json(), lat, lon);
    memoryCache.set(cacheKey, danger?.level ?? null);
    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          fetchedAt: now.getTime(),
          level: danger?.level ?? null,
        } satisfies CacheEntry)
      );
    } catch {
      // Speicher voll/blockiert – der In-Memory-Cache reicht für die Sitzung
    }
    return danger;
  } catch {
    return null;
  }
}
