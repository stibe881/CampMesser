/**
 * Wetter-Orte: eigene Favoriten für die Wettervorhersage, per Ortssuche
 * gespeichert. Reine Logik – Validierung unbekannter Daten (localStorage/
 * Geräte-Sync) sowie Hinzufügen/Entfernen. Ohne DOM-Abhängigkeiten,
 * damit testbar (Muster tentFinderTargets).
 */

/** localStorage-Schlüssel der gespeicherten Wetter-Orte. */
export const WEATHER_PLACES_KEY = "campmesser.weatherPlaces";
/** localStorage-Schlüssel des zuletzt gewählten Wetter-Orts. */
export const LAST_WEATHER_PLACE_KEY = "campmesser.weatherLastPlace";

/** Obergrenzen – schützen localStorage und den Geräte-Sync-Payload. */
export const MAX_WEATHER_PLACES = 12;
export const MAX_PLACE_NAME_LENGTH = 80;

export interface WeatherPlace {
  name: string;
  lat: number;
  lon: number;
}

function isValidCoords(lat: unknown, lon: unknown): boolean {
  return (
    typeof lat === "number" &&
    Number.isFinite(lat) &&
    Math.abs(lat) <= 90 &&
    typeof lon === "number" &&
    Number.isFinite(lon) &&
    Math.abs(lon) <= 180
  );
}

/**
 * Zwei Orte gelten als derselbe Eintrag bei gleichem Namen (gross-/klein-
 * schreibungsunabhängig) ODER praktisch gleichen Koordinaten (~11 m) –
 * verhindert doppelte Chips für denselben Ort aus zwei Suchläufen.
 */
export function isSameWeatherPlace(a: WeatherPlace, b: WeatherPlace): boolean {
  if (a.name.toLowerCase() === b.name.toLowerCase()) return true;
  return Math.abs(a.lat - b.lat) < 1e-4 && Math.abs(a.lon - b.lon) < 1e-4;
}

/**
 * Einen einzelnen unbekannten Wert in einen sauberen Ort überführen –
 * Name getrimmt und gekürzt, Koordinaten geprüft; sonst null.
 */
export function sanitizeWeatherPlace(value: unknown): WeatherPlace | null {
  if (!value || typeof value !== "object") return null;
  const entry = value as Partial<WeatherPlace>;
  if (typeof entry.name !== "string") return null;
  const name = entry.name.trim().slice(0, MAX_PLACE_NAME_LENGTH);
  if (!name) return null;
  if (!isValidCoords(entry.lat, entry.lon)) return null;
  return { name, lat: entry.lat as number, lon: entry.lon as number };
}

/**
 * Unbekannte Daten in eine saubere Orts-Liste überführen: nur gültige
 * Einträge, Duplikate verworfen, Länge auf MAX_WEATHER_PLACES begrenzt.
 */
export function sanitizeWeatherPlaces(value: unknown): WeatherPlace[] {
  if (!Array.isArray(value)) return [];
  const result: WeatherPlace[] = [];
  for (let i = 0; i < value.length && result.length < MAX_WEATHER_PLACES; i++) {
    const place = sanitizeWeatherPlace(value[i]);
    if (!place) continue;
    if (result.some(p => isSameWeatherPlace(p, place))) continue;
    result.push(place);
  }
  return result;
}

/**
 * Ort anhängen: liefert eine NEUE Liste – oder null, wenn nichts zu tun ist
 * (ungültiger Eintrag, Duplikat oder Liste voll). Die Eingabe bleibt
 * unverändert.
 */
export function addWeatherPlace(
  places: WeatherPlace[],
  candidate: WeatherPlace
): WeatherPlace[] | null {
  const place = sanitizeWeatherPlace(candidate);
  if (!place) return null;
  if (places.length >= MAX_WEATHER_PLACES) return null;
  if (places.some(p => isSameWeatherPlace(p, place))) return null;
  return [...places, place];
}

/** Ort entfernen (Vergleich wie beim Anlegen): liefert eine NEUE Liste. */
export function removeWeatherPlace(
  places: WeatherPlace[],
  doomed: WeatherPlace
): WeatherPlace[] {
  return places.filter(p => !isSameWeatherPlace(p, doomed));
}

/** Gespeicherte Wetter-Orte laden (defensiv – kaputte Daten werden bereinigt). */
export function loadStoredWeatherPlaces(): WeatherPlace[] {
  try {
    const raw = localStorage.getItem(WEATHER_PLACES_KEY);
    return raw ? sanitizeWeatherPlaces(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function storeWeatherPlaces(places: WeatherPlace[]) {
  try {
    localStorage.setItem(WEATHER_PLACES_KEY, JSON.stringify(places));
  } catch {
    // Speicher voll/blockiert – die Chips leben dann nur diese Sitzung
  }
}

/** Zuletzt gewählten Wetter-Ort laden – null = eigener Standort. */
export function loadLastWeatherPlace(): WeatherPlace | null {
  try {
    const raw = localStorage.getItem(LAST_WEATHER_PLACE_KEY);
    return raw ? sanitizeWeatherPlace(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

/** Zuletzt gewählten Wetter-Ort merken bzw. (null) wieder vergessen. */
export function storeLastWeatherPlace(place: WeatherPlace | null) {
  try {
    if (place) {
      localStorage.setItem(LAST_WEATHER_PLACE_KEY, JSON.stringify(place));
    } else {
      localStorage.removeItem(LAST_WEATHER_PLACE_KEY);
    }
  } catch {
    // Speicher blockiert – dann startet die Seite eben mit dem Standort
  }
}
