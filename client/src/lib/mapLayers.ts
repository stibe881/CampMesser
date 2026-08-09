/**
 * Gemeinsame Basis-Layer für die Leaflet-Karten: OpenStreetMap («Karte»)
 * und Esri World Imagery («Satellit»). Die Wahl wird in localStorage
 * gemerkt, damit Platz-Karte und Zelt-Finder-Mini-Karte denselben Layer
 * zeigen. Attributionen sind Pflicht (OSM-Lizenz bzw. Esri-Nutzungsbedingungen).
 */
import type * as Leaflet from "leaflet";

export type MapLayerKind = "map" | "satellite";

export const MAP_LAYER_KEY = "campmesser.mapLayer";

const OSM_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const ESRI_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const ESRI_ATTRIBUTION = "Esri, Maxar, Earthstar Geographics";

/** Gemerkte Layer-Wahl lesen – alles ausser «satellite» fällt auf die Karte zurück. */
export function loadMapLayer(): MapLayerKind {
  try {
    return localStorage.getItem(MAP_LAYER_KEY) === "satellite"
      ? "satellite"
      : "map";
  } catch {
    return "map";
  }
}

export function storeMapLayer(kind: MapLayerKind) {
  try {
    localStorage.setItem(MAP_LAYER_KEY, kind);
  } catch {
    /* Sitzung reicht */
  }
}

// ---- Ein-/ausblendbare Pin-Ebenen der grossen Karte -----------------------

export const LAYER_VISIBILITY_KEY = "campmesser.mapLayers";

/**
 * Welche Pin-Ebenen die Karte zeigt. Standard: alle an – ausser den Ebenen,
 * die ihre Pins erst über die Overpass-API holen müssen. Die sind aus, bis
 * sie jemand ausdrücklich einschaltet (Overpass ist rate-limitiert und wird
 * nie ungefragt belastet).
 */
export interface MapLayerVisibility {
  favorites: boolean;
  targets: boolean;
  sightings: boolean;
  campsites: boolean;
  /** Ausflugsziele aus der Ausflugfinder-App (#271). */
  excursions: boolean;
  /** Feuer- und Grillstellen aus OpenStreetMap (#247) – Standard aus. */
  firepits: boolean;
  /** Spiel- und Badeplätze aus OpenStreetMap (#248) – Standard aus. */
  family: boolean;
  /** Merkorte / Wunschziele (#537). */
  savedPlaces: boolean;
  /** Etappen-Routen der Rundreisen als Linien (#596). */
  routes: boolean;
}

export const DEFAULT_LAYER_VISIBILITY: MapLayerVisibility = {
  favorites: true,
  targets: true,
  sightings: true,
  campsites: true,
  excursions: true,
  firepits: false,
  family: false,
  savedPlaces: true,
  routes: true,
};

/**
 * Gemerkte Ebenen-Wahl lesen – fehlende/kaputte Werte fallen auf den
 * jeweiligen Standard aus `DEFAULT_LAYER_VISIBILITY` zurück.
 */
export function loadLayerVisibility(): MapLayerVisibility {
  try {
    const raw = localStorage.getItem(LAYER_VISIBILITY_KEY);
    if (!raw) return { ...DEFAULT_LAYER_VISIBILITY };
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return { ...DEFAULT_LAYER_VISIBILITY };
    }
    const obj = parsed as Record<string, unknown>;
    const read = (key: keyof MapLayerVisibility) =>
      typeof obj[key] === "boolean"
        ? (obj[key] as boolean)
        : DEFAULT_LAYER_VISIBILITY[key];
    return {
      favorites: read("favorites"),
      targets: read("targets"),
      sightings: read("sightings"),
      campsites: read("campsites"),
      excursions: read("excursions"),
      firepits: read("firepits"),
      family: read("family"),
      savedPlaces: read("savedPlaces"),
      routes: read("routes"),
    };
  } catch {
    return { ...DEFAULT_LAYER_VISIBILITY };
  }
}

export function storeLayerVisibility(visibility: MapLayerVisibility) {
  try {
    localStorage.setItem(LAYER_VISIBILITY_KEY, JSON.stringify(visibility));
  } catch {
    /* Sitzung reicht */
  }
}

/**
 * Basis-Layer für die gewünschte Darstellung erzeugen (noch nicht zur Karte
 * hinzugefügt). `L` kommt als Parameter, damit auch dynamisch geladene
 * Leaflet-Instanzen (Zelt-Finder) den Helfer nutzen können.
 */
export function createBaseLayer(
  L: typeof Leaflet,
  kind: MapLayerKind
): Leaflet.TileLayer {
  if (kind === "satellite") {
    return L.tileLayer(ESRI_TILE_URL, {
      maxZoom: 19,
      attribution: ESRI_ATTRIBUTION,
    });
  }
  return L.tileLayer(OSM_TILE_URL, {
    maxZoom: 19,
    attribution: OSM_ATTRIBUTION,
  });
}
