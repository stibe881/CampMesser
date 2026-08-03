/**
 * Abruf der ISS-Überflüge (#222) bei der freien Schnittstelle
 * api.g7vrd.co.uk – serverseitig, damit ein zwischengespeicherter Abruf
 * allen Nutzer*innen in derselben Gegend dient und die kleine, freiwillig
 * betriebene Quelle nicht von jedem Seitenaufruf getroffen wird.
 *
 * Der Zwischenspeicher liegt im Prozess (kein Redis im Projekt) und ist auf
 * Gitterzellen von 0.1° (rund 11 km) gerundet – feiner macht für Überflüge
 * einer 400 km hohen Bahn keinen Unterschied.
 */
import { issPassesUrl, parseIssPasses, type RawIssPass } from "@shared/iss";

/** Wie lange ein Abruf gilt. Die Bahndaten der Quelle sind tagesaktuell. */
const CACHE_TTL_MS = 3 * 60 * 60 * 1000;

/** Obergrenze des Zwischenspeichers – verhindert unbegrenztes Wachsen. */
const CACHE_MAX_ENTRIES = 200;

/** Zeitlimit des Abrufs: lieber ohne Überflüge als mit hängender Seite. */
const FETCH_TIMEOUT_MS = 8000;

interface CacheEntry {
  expiresAt: number;
  passes: RawIssPass[];
}

const cache = new Map<string, CacheEntry>();

/** Gitterzelle von 0.1° als Schlüssel – Nachbarorte teilen sich einen Abruf. */
function cacheKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(1)},${longitude.toFixed(1)}`;
}

/**
 * Abgelaufene Einträge entfernen und, falls immer noch zu viele, die
 * ältesten opfern. Ohne `for..of` über Map-Iteratoren (tsconfig ohne
 * downlevelIteration).
 */
function pruneCache(now: number): void {
  const entries = Array.from(cache.entries());
  entries.forEach(([key, entry]) => {
    if (entry.expiresAt <= now) cache.delete(key);
  });
  if (cache.size <= CACHE_MAX_ENTRIES) return;
  const remaining = Array.from(cache.entries()).sort(
    (a, b) => a[1].expiresAt - b[1].expiresAt
  );
  const excess = cache.size - CACHE_MAX_ENTRIES;
  for (let i = 0; i < excess; i++) cache.delete(remaining[i][0]);
}

/** Nur für Tests: Zwischenspeicher leeren. */
export function clearIssCache(): void {
  cache.clear();
}

/**
 * Geometrisch mögliche Überflüge für einen Ort holen. Fehler der Quelle
 * (nicht erreichbar, kaputte Antwort) liefern eine leere Liste – die Seite
 * zeigt dann ihren Hinweis statt einer Fehlermeldung.
 */
export async function fetchIssPasses(
  latitude: number,
  longitude: number
): Promise<RawIssPass[]> {
  const now = Date.now();
  const key = cacheKey(latitude, longitude);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) return cached.passes;

  let passes: RawIssPass[] = [];
  try {
    const res = await fetch(issPassesUrl(latitude, longitude), {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`iss pass service error ${res.status}`);
    passes = parseIssPasses(await res.json());
  } catch {
    // Ein Ausfall der Quelle darf die Astro-Seite nicht mitreissen. Ein
    // vorhandener, gerade abgelaufener Eintrag ist besser als nichts.
    if (cached) return cached.passes;
    return [];
  }

  pruneCache(now);
  cache.set(key, { expiresAt: now + CACHE_TTL_MS, passes });
  return passes;
}
