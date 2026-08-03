/**
 * Offline-Paket für Karten-Kacheln: reine Slippy-Map-Rechnerei plus ein
 * schlanker Download in einen eigenen Cache («campmesser-map-tiles»).
 *
 * Warum: Karte und Zelt-Finder brauchen Kacheln vom Netz. Auf dem Zeltplatz
 * gibt es oft keinen Empfang – deshalb lassen sich die Kacheln rund um einen
 * gespeicherten Platz vorab laden. Der Service Worker (client/public/sw.js)
 * bedient Anfragen an die Kachel-Hosts danach zuerst aus diesem Cache.
 *
 * Fairness: OSM und Esri stellen die Kacheln gratis zur Verfügung. Deshalb
 * gibt es eine harte Obergrenze (MAX_OFFLINE_TILES) und einen sequenziellen
 * Download mit nur wenigen parallelen Anfragen – kein Massen-Download.
 */
import { loadMapLayer, type MapLayerKind } from "./mapLayers";

/** Kachel-Koordinate im Slippy-Map-Schema (z/x/y). */
export interface MapTile {
  z: number;
  x: number;
  y: number;
}

/** Eigener Cache – der Aufräumer im Service Worker lässt ihn bewusst stehen. */
export const TILE_CACHE_NAME = "campmesser-map-tiles";

/** Harte Obergrenze pro Paket (Fair Use gegenüber OSM/Esri). */
export const MAX_OFFLINE_TILES = 600;

/** Gröbster Zoom eines Pakets – darunter reicht die Online-Übersicht. */
export const OFFLINE_BASE_ZOOM = 12;

/** Auswählbarer Umkreis in Kilometern. */
export const OFFLINE_RADII_KM = [2, 5, 10] as const;

/** Auswählbarer Detailgrad (feinster Zoom des Pakets). */
export const OFFLINE_MAX_ZOOMS = [14, 15, 16] as const;

const OSM_TILE_HOST = "https://tile.openstreetmap.org";
const ESRI_TILE_HOST =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile";

/** Grad Breite pro Kilometer (Erdumfang über die Pole / 360). */
const KM_PER_DEGREE_LAT = 111.32;

/** Web-Mercator kennt nur ±85.05113° – darüber gibt es keine Kacheln. */
const MAX_MERCATOR_LAT = 85.05112878;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Kachel-Spalte (x) für einen Längengrad auf der Zoomstufe z. */
export function lonToTileX(lon: number, z: number): number {
  const n = 2 ** z;
  const normalized = ((((lon + 180) % 360) + 360) % 360) / 360;
  return clamp(Math.floor(normalized * n), 0, n - 1);
}

/** Kachel-Zeile (y) für einen Breitengrad auf der Zoomstufe z. */
export function latToTileY(lat: number, z: number): number {
  const n = 2 ** z;
  const rad = (clamp(lat, -MAX_MERCATOR_LAT, MAX_MERCATOR_LAT) * Math.PI) / 180;
  const y = ((1 - Math.asinh(Math.tan(rad)) / Math.PI) / 2) * n;
  return clamp(Math.floor(y), 0, n - 1);
}

/** Zoomstufen eines Pakets: von OFFLINE_BASE_ZOOM bis einschliesslich maxZoom. */
export function zoomLevelsUpTo(maxZoom: number): number[] {
  const levels: number[] = [];
  for (let z = OFFLINE_BASE_ZOOM; z <= Math.floor(maxZoom); z++) levels.push(z);
  return levels;
}

/**
 * Alle Kacheln im Quadrat um (lat, lon) mit der Kantenlänge 2 × radiusKm,
 * für jede gewünschte Zoomstufe – ohne Duplikate und höchstens
 * MAX_OFFLINE_TILES Stück.
 *
 * Reihenfolge (und damit Auswahl beim Abschneiden): Zoomstufen aufsteigend,
 * innerhalb einer Stufe von der Mitte nach aussen. Greift die Obergrenze,
 * bleibt so die grobe Übersicht vollständig und der Detailgrad rund um den
 * Platz erhalten – genau das, was am Zeltplatz zählt.
 */
export function tilesForArea(
  lat: number,
  lon: number,
  radiusKm: number,
  zoomLevels: number[]
): MapTile[] {
  const tiles: MapTile[] = [];
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return tiles;

  const radius = Number.isFinite(radiusKm) ? Math.max(0, radiusKm) : 0;
  const centerLat = clamp(lat, -MAX_MERCATOR_LAT, MAX_MERCATOR_LAT);
  const latDelta = radius / KM_PER_DEGREE_LAT;
  // Längengrade rücken zu den Polen hin zusammen – Breitengrad einrechnen.
  const cosLat = Math.max(0.01, Math.cos((centerLat * Math.PI) / 180));
  const lonDelta = radius / (KM_PER_DEGREE_LAT * cosLat);

  const seen = new Set<string>();
  const levels = Array.from(new Set(zoomLevels.filter(z => Number.isFinite(z))))
    .map(z => Math.floor(z))
    .filter(z => z >= 0 && z <= 20)
    .sort((a, b) => a - b);

  for (let i = 0; i < levels.length; i++) {
    const z = levels[i];
    const minX = lonToTileX(lon - lonDelta, z);
    const maxX = lonToTileX(lon + lonDelta, z);
    // Nach Norden wird y kleiner – deshalb ist maxLat die obere Grenze.
    const minY = latToTileY(centerLat + latDelta, z);
    const maxY = latToTileY(centerLat - latDelta, z);
    const centerX = lonToTileX(lon, z);
    const centerY = latToTileY(centerLat, z);

    const level: MapTile[] = [];
    for (let x = Math.min(minX, maxX); x <= Math.max(minX, maxX); x++) {
      for (let y = Math.min(minY, maxY); y <= Math.max(minY, maxY); y++) {
        const key = `${z}/${x}/${y}`;
        if (seen.has(key)) continue;
        seen.add(key);
        level.push({ z, x, y });
      }
    }
    // Von der Mitte nach aussen sortieren (Ring-Distanz), damit ein
    // abgeschnittenes Paket die Umgebung des Platzes zuerst abdeckt.
    level.sort(
      (a, b) =>
        Math.max(Math.abs(a.x - centerX), Math.abs(a.y - centerY)) -
        Math.max(Math.abs(b.x - centerX), Math.abs(b.y - centerY))
    );
    for (let j = 0; j < level.length; j++) {
      if (tiles.length >= MAX_OFFLINE_TILES) return tiles;
      tiles.push(level[j]);
    }
  }
  return tiles;
}

/** Kachel-URL für den gewünschten Basis-Layer (OSM: z/x/y, Esri: z/y/x). */
export function tileUrl(tile: MapTile, layer: MapLayerKind): string {
  return layer === "satellite"
    ? `${ESRI_TILE_HOST}/${tile.z}/${tile.y}/${tile.x}`
    : `${OSM_TILE_HOST}/${tile.z}/${tile.x}/${tile.y}.png`;
}

// ---- Gespeicherte Pakete (localStorage) -----------------------------------

export const OFFLINE_MAPS_KEY = "campmesser.offlineMaps";

/** Was für einen Platz gespeichert ist – reicht zum Löschen und Anzeigen. */
export interface OfflineMapPack {
  radiusKm: number;
  maxZoom: number;
  layer: MapLayerKind;
  tiles: number;
  bytes: number;
  /** ISO-Zeitpunkt des Downloads. */
  savedAt: string;
}

/** Alle gespeicherten Pakete lesen (Schlüssel = Platz-ID als Text). */
export function loadOfflineMaps(): Record<string, OfflineMapPack> {
  try {
    const raw = localStorage.getItem(OFFLINE_MAPS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    const result: Record<string, OfflineMapPack> = {};
    Object.keys(parsed as Record<string, unknown>).forEach(key => {
      const entry = (parsed as Record<string, unknown>)[key];
      if (typeof entry !== "object" || entry === null) return;
      const obj = entry as Record<string, unknown>;
      if (
        typeof obj.radiusKm !== "number" ||
        typeof obj.maxZoom !== "number" ||
        typeof obj.tiles !== "number"
      ) {
        return;
      }
      result[key] = {
        radiusKm: obj.radiusKm,
        maxZoom: obj.maxZoom,
        layer: obj.layer === "satellite" ? "satellite" : "map",
        tiles: obj.tiles,
        bytes: typeof obj.bytes === "number" ? obj.bytes : 0,
        savedAt: typeof obj.savedAt === "string" ? obj.savedAt : "",
      };
    });
    return result;
  } catch {
    return {};
  }
}

function storeOfflineMaps(packs: Record<string, OfflineMapPack>) {
  try {
    localStorage.setItem(OFFLINE_MAPS_KEY, JSON.stringify(packs));
  } catch {
    /* Speicher voll oder gesperrt – der Cache selbst bleibt trotzdem gültig */
  }
}

export function rememberOfflineMap(spotId: number, pack: OfflineMapPack) {
  const packs = loadOfflineMaps();
  packs[String(spotId)] = pack;
  storeOfflineMaps(packs);
}

export function forgetOfflineMap(spotId: number) {
  const packs = loadOfflineMaps();
  delete packs[String(spotId)];
  storeOfflineMaps(packs);
}

// ---- Download / Löschen ----------------------------------------------------

/** Gleichzeitige Anfragen – bewusst klein, die Kachel-Server sind gratis. */
const DOWNLOAD_CONCURRENCY = 4;

export interface TileDownloadResult {
  /** Tatsächlich abgelegte Kacheln. */
  stored: number;
  /** Summe der Antwort-Grössen in Byte. */
  bytes: number;
  /** true, wenn per AbortSignal abgebrochen wurde. */
  cancelled: boolean;
}

/** Ob der Browser überhaupt einen Cache anbietet (Safari im privaten Modus?). */
export function tileCacheSupported(): boolean {
  return typeof caches !== "undefined";
}

/**
 * Kacheln laden und im Cache ablegen. Fehlende einzelne Kacheln (404, kein
 * Netz) werden übersprungen – ein Paket darf lückenhaft sein, die Karte holt
 * den Rest online nach.
 */
export async function downloadTiles(
  tiles: MapTile[],
  layer: MapLayerKind,
  options: {
    onProgress?: (done: number, total: number) => void;
    signal?: AbortSignal;
  } = {}
): Promise<TileDownloadResult> {
  if (!tileCacheSupported()) {
    return { stored: 0, bytes: 0, cancelled: false };
  }
  const cache = await caches.open(TILE_CACHE_NAME);
  let done = 0;
  let stored = 0;
  let bytes = 0;
  let index = 0;

  const worker = async () => {
    while (index < tiles.length) {
      if (options.signal?.aborted) return;
      const tile = tiles[index++];
      const url = tileUrl(tile, layer);
      try {
        // Bewusst CORS statt no-cors: undurchsichtige Antworten lassen sich
        // nicht in den Cache legen. OSM und Esri erlauben CORS.
        const response = await fetch(url, { mode: "cors" });
        if (response.ok) {
          const body = await response.clone().arrayBuffer();
          await cache.put(url, response);
          stored++;
          bytes += body.byteLength;
        }
      } catch {
        /* Kachel überspringen – das Paket darf Lücken haben */
      }
      done++;
      options.onProgress?.(done, tiles.length);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(DOWNLOAD_CONCURRENCY, tiles.length) }, () =>
      worker()
    )
  );
  return { stored, bytes, cancelled: Boolean(options.signal?.aborted) };
}

/** Die Kacheln eines Pakets wieder aus dem Cache entfernen. */
export async function deleteTiles(
  tiles: MapTile[],
  layer: MapLayerKind
): Promise<number> {
  if (!tileCacheSupported()) return 0;
  const cache = await caches.open(TILE_CACHE_NAME);
  let removed = 0;
  for (let i = 0; i < tiles.length; i++) {
    if (await cache.delete(tileUrl(tiles[i], layer))) removed++;
  }
  return removed;
}

/** Der aktuell gewählte Basis-Layer – dessen Kacheln wandern ins Paket. */
export function currentTileLayer(): MapLayerKind {
  return loadMapLayer();
}
