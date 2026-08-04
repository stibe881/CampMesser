/**
 * Orte von Google holen – ausschliesslich serverseitig.
 *
 * Serverseitig aus denselben Gründen wie bei den Fahrzeiten: Der
 * Schlüssel bleibt auf dem Server und steht nicht im Bundle; ein Abruf
 * dient allen Geräten gleichzeitig; und ein Schlüssel im Browser liesse
 * sich trotz Sperren missbrauchen – bei einem Konto mit hinterlegter
 * Kreditkarte ist das ein Risiko, das man nicht eingehen muss.
 *
 * ZWISCHENSPEICHER IST HIER KEIN LUXUS, SONDERN DIE KOSTENBREMSE. Jede
 * Abfrage wird abgerechnet, und ein Zeltplatz wandert nicht. Eine Stunde
 * frisch zu halten deckt den Fall ab, für den das Feature da ist: Man
 * kommt an, schaut nach, was in der Nähe ist, und schaut abends nochmal.
 *
 * WIE LANGE MAN GOOGLE-DATEN BEHALTEN DARF, ist in den Bedingungen
 * geregelt – dauerhaft nur die Place-Id, alles andere nicht. Deshalb
 * liegt der Speicher im Arbeitsspeicher und nicht in der Datenbank: Er
 * ist beim nächsten Neustart weg, und niemand muss eine Aufbewahrungsfrist
 * überwachen.
 *
 * Ohne `GOOGLE_MAPS_API_KEY` ist die Anbindung schlicht nicht eingerichtet:
 * `isPlacesConfigured()` meldet `false`, und die Ansichten holen ihre
 * Treffer weiter aus OpenStreetMap. Kein Fehlerzustand, keine leere Liste.
 */
import { ENV } from "./_core/env";
import {
  GOOGLE_PLACES_FIELD_MASK,
  GOOGLE_PLACES_URL,
  googlePlacesBody,
  parseGooglePlaces,
  placesCacheKey,
  type GooglePlace,
} from "@shared/googlePlaces";

/** So lange gelten geholte Treffer als frisch. */
const CACHE_TTL_MS = 60 * 60 * 1000;

/** So viele Umkreise werden behalten; die ältesten fallen heraus. */
const MAX_CACHE_ENTRIES = 100;

/** Zeitlimit: lieber die OSM-Liste als eine hängende Seite. */
const FETCH_TIMEOUT_MS = 8000;

interface CacheEntry {
  expiresAt: number;
  value: GooglePlace[];
}

const cache = new Map<string, CacheEntry>();

/** Ist die Anbindung eingerichtet (Schlüssel in der `.env`)? */
export function isPlacesConfigured(): boolean {
  return ENV.googleMapsApiKey.trim().length > 0;
}

/** Nur für Tests und Entwicklung: Zwischenspeicher leeren. */
export function clearPlacesCache(): void {
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
 * Orte im Umkreis holen.
 *
 * Liefert null, wenn die Anbindung fehlt, der Dienst nicht antwortet oder
 * die Antwort unbrauchbar ist. NULL UND NICHT «LEERE LISTE», weil die
 * Ansicht die beiden unterscheiden muss: «Google kennt hier nichts» ist
 * eine Antwort, «Google hat nicht geantwortet» ein Grund, OSM zu fragen.
 */
export async function fetchNearbyPlaces(
  lat: number,
  lon: number,
  radiusM: number,
  types: readonly string[],
  languageCode = "de"
): Promise<GooglePlace[] | null> {
  if (!isPlacesConfigured()) return null;

  const now = Date.now();
  const key = `${languageCode}|${placesCacheKey(lat, lon, radiusM, types)}`;
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) return hit.value;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(GOOGLE_PLACES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": ENV.googleMapsApiKey,
        "X-Goog-FieldMask": GOOGLE_PLACES_FIELD_MASK,
      },
      body: JSON.stringify(
        googlePlacesBody(lat, lon, radiusM, types, undefined, languageCode)
      ),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const value = parseGooglePlaces(await response.json());
    prune(now);
    cache.set(key, { expiresAt: now + CACHE_TTL_MS, value });
    return value;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
