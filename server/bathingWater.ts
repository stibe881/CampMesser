/**
 * Badestellen-Info (#223) serverseitig abrufen: Wassertemperatur, Abfluss und
 * Pegel der nächstgelegenen Schweizer Messstelle (offene Hydrodaten des BAFU
 * über api.existenz.ch) beziehungsweise die Meerwasser-Temperatur der
 * Open-Meteo-Marine-API im Ausland.
 *
 * Serverseitig aus zwei Gründen: erstens dient ein Abruf allen, die am selben
 * Gewässer stehen (Zwischenspeicher im Prozess, wie bei den ISS-Überflügen);
 * zweitens kennen die offenen Hydrodaten NUR den jeweils jüngsten Wert – für
 * einen Trend muss sich jemand die Vorwerte merken, und das kann nur der
 * Server. Fehlt der Vorwert (frisch gestartet), bleibt der Trend «unknown»
 * statt geraten zu werden.
 */
import {
  hydroLatestUrl,
  marineWaterUrl,
  parseHydroLatest,
  parseMarineWater,
  TREND_WINDOW_HOURS,
  waterTrend,
  type MarineWater,
  type WaterReading,
  type WaterTrend,
} from "@shared/bathingWater";

/** Wie lange ein Messwert gilt. Die Hydrodaten werden alle 10 Minuten frisch. */
const CACHE_TTL_MS = 10 * 60 * 1000;

/** Obergrenze des Zwischenspeichers – verhindert unbegrenztes Wachsen. */
const CACHE_MAX_ENTRIES = 300;

/** Zeitlimit des Abrufs: lieber ohne Wasserwerte als mit hängender Seite. */
const FETCH_TIMEOUT_MS = 8000;

/** So weit zurück wird der Verlauf für den Trend behalten. */
const HISTORY_KEEP_MS = 12 * 60 * 60 * 1000;

/**
 * Ein Vorwert zählt erst ab diesem Alter als Vergleich. Zwei Messungen aus
 * derselben Stunde unterscheiden sich nur im Rauschen.
 */
const MIN_TREND_AGE_MS = 2 * 60 * 60 * 1000;

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

const hydroCache = new Map<string, CacheEntry<WaterReading>>();
const marineCache = new Map<string, CacheEntry<MarineWater | null>>();

/** Gemessene Temperaturen einer Stelle, für den Trend behalten. */
const hydroHistory = new Map<
  string,
  { atMs: number; temperatureC: number }[]
>();

/**
 * Abgelaufene Einträge entfernen und, falls immer noch zu viele, die ältesten
 * opfern. Ohne `for..of` über Map-Iteratoren (tsconfig ohne downlevelIteration).
 */
function pruneCache<T>(cache: Map<string, CacheEntry<T>>, now: number): void {
  Array.from(cache.entries()).forEach(([key, entry]) => {
    if (entry.expiresAt <= now) cache.delete(key);
  });
  if (cache.size <= CACHE_MAX_ENTRIES) return;
  const remaining = Array.from(cache.entries()).sort(
    (a, b) => a[1].expiresAt - b[1].expiresAt
  );
  const excess = cache.size - CACHE_MAX_ENTRIES;
  for (let i = 0; i < excess; i++) cache.delete(remaining[i][0]);
}

/** Nur für Tests: Zwischenspeicher und Verlauf leeren. */
export function clearBathingWaterCache(): void {
  hydroCache.clear();
  marineCache.clear();
  hydroHistory.clear();
}

/**
 * Messwert in den Verlauf aufnehmen und den Trend gegenüber dem Wert von vor
 * rund `TREND_WINDOW_HOURS` Stunden bestimmen. Zu junge Vorwerte zählen
 * nicht – sonst entstünde aus Messrauschen ein «steigend».
 */
function trackTrend(
  stationId: string,
  temperatureC: number,
  atMs: number
): WaterTrend {
  const history = (hydroHistory.get(stationId) ?? []).filter(
    point => atMs - point.atMs < HISTORY_KEEP_MS
  );
  const targetMs = atMs - TREND_WINDOW_HOURS * 3600000;
  let previousC: number | null = null;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (let i = 0; i < history.length; i++) {
    const point = history[i];
    if (atMs - point.atMs < MIN_TREND_AGE_MS) continue;
    const diff = Math.abs(point.atMs - targetMs);
    if (diff < bestDiff) {
      bestDiff = diff;
      previousC = point.temperatureC;
    }
  }
  // Denselben Messzeitpunkt nicht doppelt aufnehmen (Zwischenspeicher-Treffer
  // liefern ihn wiederholt).
  if (!history.some(point => point.atMs === atMs)) {
    history.push({ atMs, temperatureC });
  }
  hydroHistory.set(stationId, history);
  return waterTrend(temperatureC, previousC);
}

export interface StationReading extends WaterReading {
  trend: WaterTrend;
}

/**
 * Jüngste Werte einer Schweizer Messstelle. Fehler der Quelle liefern lauter
 * null-Werte – die Anzeige bleibt dann weg statt eine Fehlermeldung zu zeigen.
 */
export async function fetchStationReading(
  stationId: string
): Promise<StationReading> {
  const now = Date.now();
  const cached = hydroCache.get(stationId);
  const reading =
    cached && cached.expiresAt > now
      ? cached.value
      : await (async (): Promise<WaterReading | null> => {
          try {
            const res = await fetch(hydroLatestUrl(stationId), {
              signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
              headers: { accept: "application/json" },
            });
            if (!res.ok) throw new Error(`hydro service error ${res.status}`);
            const fresh = parseHydroLatest(await res.json(), stationId);
            pruneCache(hydroCache, now);
            hydroCache.set(stationId, {
              expiresAt: now + CACHE_TTL_MS,
              value: fresh,
            });
            return fresh;
          } catch {
            return cached ? cached.value : null;
          }
        })();

  if (!reading) {
    return {
      temperatureC: null,
      flowM3s: null,
      levelMasl: null,
      measuredAtMs: null,
      trend: "unknown",
    };
  }
  const trend =
    reading.temperatureC !== null && reading.measuredAtMs !== null
      ? trackTrend(stationId, reading.temperatureC, reading.measuredAtMs)
      : "unknown";
  return { ...reading, trend };
}

/**
 * Meerwasser-Temperatur für Koordinaten im Ausland. Über Land liefert die
 * Marine-API lauter null – dann kommt hier null zurück.
 */
export async function fetchMarineWater(
  latitude: number,
  longitude: number
): Promise<MarineWater | null> {
  const now = Date.now();
  // Gitterzelle von 0.1° (~11 km) – feiner löst die Marine-API ohnehin nicht auf.
  const key = `${latitude.toFixed(1)},${longitude.toFixed(1)}`;
  const cached = marineCache.get(key);
  if (cached && cached.expiresAt > now) return cached.value;
  try {
    const res = await fetch(marineWaterUrl(latitude, longitude), {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`marine service error ${res.status}`);
    const value = parseMarineWater(await res.json());
    pruneCache(marineCache, now);
    marineCache.set(key, { expiresAt: now + CACHE_TTL_MS, value });
    return value;
  } catch {
    return cached ? cached.value : null;
  }
}
