/**
 * Fahrzeiten von Google – der Abruf, ausschliesslich serverseitig.
 *
 * Serverseitig aus drei Gründen, denselben wie bei der Ausflugfinder-
 * Anbindung: Der Schlüssel bleibt auf dem Server und steht nicht im Bundle;
 * ein Abruf dient allen Geräten gleichzeitig; und ein Schlüssel im Browser
 * liesse sich trotz Sperren missbrauchen – bei einem Konto mit hinterlegter
 * Kreditkarte ist das ein Risiko, das man nicht eingehen muss.
 *
 * Ohne `GOOGLE_MAPS_API_KEY` ist das Feature schlicht nicht eingerichtet:
 * `isDriveTimeConfigured()` meldet `false`, und jede Ansicht rechnet weiter
 * mit der OSRM-Fahrzeit. Kein Fehlerzustand, keine leere Anzeige.
 */
import { ENV } from "./_core/env";
import {
  GOOGLE_ROUTES_FIELD_MASK,
  GOOGLE_ROUTES_URL,
  driveTimeCacheKey,
  googleRouteBody,
  parseGoogleRoute,
  trafficUsableAt,
  type DriveTime,
  type LatLon,
} from "@shared/googleRoutes";

/**
 * Wie lange eine Fahrzeit gilt. BEWUSST KURZ: Der Wert lebt von der
 * Verkehrslage, und die ändert sich. Ein Zwischenspeicher über Stunden
 * würde genau das wegwerfen, wofür wir den Dienst überhaupt fragen.
 */
const CACHE_TTL_MS = 10 * 60 * 1000;

/** So viele Strecken werden behalten; die ältesten fallen heraus. */
const MAX_CACHE_ENTRIES = 200;

/** Zeitlimit: lieber die OSRM-Fahrzeit als eine hängende Seite. */
const FETCH_TIMEOUT_MS = 8000;

interface CacheEntry {
  expiresAt: number;
  value: DriveTime;
}

const cache = new Map<string, CacheEntry>();

/** Ist die Anbindung eingerichtet (Schlüssel in der `.env`)? */
export function isDriveTimeConfigured(): boolean {
  return ENV.googleMapsApiKey.trim().length > 0;
}

/** Nur für Tests und Entwicklung: Zwischenspeicher leeren. */
export function clearDriveTimeCache(): void {
  cache.clear();
}

/** Abgelaufene Einträge entfernen und die Grösse begrenzen. */
function prune(now: number): void {
  const stale: string[] = [];
  cache.forEach((entry, key) => {
    if (entry.expiresAt <= now) stale.push(key);
  });
  stale.forEach(key => cache.delete(key));
  if (cache.size <= MAX_CACHE_ENTRIES) return;
  const excess = cache.size - MAX_CACHE_ENTRIES;
  const oldest: string[] = [];
  cache.forEach((_entry, key) => {
    if (oldest.length < excess) oldest.push(key);
  });
  oldest.forEach(key => cache.delete(key));
}

/**
 * Fahrzeit für eine Autofahrt holen.
 *
 * `departureAtMs` ist freiwillig: mit Zeitpunkt rechnet Google mit der
 * Verkehrs-Prognose für diese Tageszeit, ohne mit dem Verkehr von jetzt.
 *
 * Liefert null, wenn die Anbindung fehlt, der Dienst nicht antwortet oder
 * die Antwort unbrauchbar ist – die Ansicht bleibt dann bei OSRM.
 */
export async function fetchDriveTime(
  from: LatLon,
  to: LatLon,
  departureAtMs: number | null = null
): Promise<DriveTime | null> {
  if (!isDriveTimeConfigured()) return null;

  const now = Date.now();
  // Eine Abfahrt in der Vergangenheit weist Google zurück, eine in drei
  // Monaten kann es nicht wissen. In beiden Fällen fragen wir ohne
  // Zeitangabe – lieber der Verkehr von jetzt als gar keine Antwort.
  const departure = trafficUsableAt(departureAtMs, now) ? departureAtMs : null;
  const key = driveTimeCacheKey(from, to, departure);
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) return hit.value;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(GOOGLE_ROUTES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": ENV.googleMapsApiKey,
        "X-Goog-FieldMask": GOOGLE_ROUTES_FIELD_MASK,
      },
      body: JSON.stringify(googleRouteBody(from, to, departure)),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const value = parseGoogleRoute(await response.json());
    if (!value) return null;
    prune(now);
    cache.set(key, { expiresAt: now + CACHE_TTL_MS, value });
    return value;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
