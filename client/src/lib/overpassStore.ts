import {
  isFresh,
  overpassCacheKey,
  putCacheEntry,
  type BBox,
  type CacheEntry,
} from "@shared/overpassCache";

/**
 * Der Zwischenspeicher für Overpass-Antworten (#339).
 *
 * WARUM ES IHN BRAUCHT: Ohne ihn war jede Suche eine neue Anfrage – auch
 * für einen Ausschnitt, den man eine Minute vorher schon angeschaut
 * hatte. Overpass rechnet je nach Gebiet Sekunden; die Antwort noch
 * einmal zu holen ist verlorene Zeit für die Nutzenden und unnötige Last
 * für einen freien Dienst.
 *
 * WAS GESPEICHERT WIRD, ist die ROHE Antwort (`elements`) und nicht das
 * fertig Geparste: So kann derselbe Eintrag alle drei Ebenen bedienen,
 * und ein Umbau an den `parse…`-Funktionen macht den Speicher nicht
 * ungültig.
 *
 * DER PREIS, ehrlich: Eine Feuerstelle, die heute in OpenStreetMap
 * eingetragen wird, erscheint bis zu einen Tag später. Für ortsfeste
 * Grillstellen ist das keine Grösse – die Rechnung sähe anders aus, wenn
 * es um Öffnungszeiten ginge.
 *
 * `localStorage` und nicht IndexedDB: Es sind wenige, kleine Einträge,
 * und der Speicher muss synchron lesbar sein, damit ein Treffer die
 * Anfrage gar nicht erst auslöst.
 */
const STORE_KEY = "campmesser.overpassCache";

type Store = Record<string, CacheEntry<unknown>>;

function read(): Store {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Store)
      : {};
  } catch {
    // Kaputter oder gesperrter Speicher: ohne Zwischenspeicher weiter.
    return {};
  }
}

function write(store: Store): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    /* Voll oder gesperrt – der Speicher ist Beschleunigung, kein Fundament. */
  }
}

/** Gespeicherte Antwort für Ausschnitt + Ebenen, sofern noch frisch. */
export function readOverpassCache(
  box: BBox,
  layers: readonly string[]
): unknown | null {
  const entry = read()[overpassCacheKey(box, layers)];
  return isFresh(entry, Date.now()) ? entry.data : null;
}

/** Antwort ablegen. */
export function writeOverpassCache(
  box: BBox,
  layers: readonly string[],
  data: unknown
): void {
  write(putCacheEntry(read(), overpassCacheKey(box, layers), data, Date.now()));
}
