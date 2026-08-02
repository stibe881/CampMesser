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
