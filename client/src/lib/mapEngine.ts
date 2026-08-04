/**
 * Karten-Maschine: Google Maps als Karte, OpenStreetMap als Rückfall.
 *
 * Alle Karten der App liefen bisher direkt gegen Leaflet. Weil die Karte
 * neu Google Maps sein soll, liegt zwischen den Ansichten und dem
 * Kartendienst jetzt DIESE Schicht. Sie bietet genau die Handvoll Dinge
 * an, die CampMesser wirklich braucht – Karte, Pin, Popup, Linie, Kreis,
 * Ebene, Ausschnitt – und nicht mehr.
 *
 * ZWEI ANTRIEBE, und der zweite ist keine Bequemlichkeit:
 *
 * 1. GOOGLE, sobald in der Server-`.env` ein Browser-Schlüssel und eine
 *    Karten-Id stehen (siehe EINRICHTUNG-OFFEN.md).
 * 2. OPENSTREETMAP sonst – und zwar zwingend in zwei Fällen: ohne Netz
 *    (die Offline-Pakete, #217, speichern OSM-Kacheln; Google-Kacheln darf
 *    man gar nicht speichern) und wenn kein Schlüssel eingerichtet ist.
 *    Eine Karte, die ohne Schlüssel einfach leer bleibt, wäre keine.
 *
 * Die PINS sind in beiden Fällen dieselben: `divIcon()` liefert nur eine
 * Beschreibung (HTML plus Grösse), keine Leaflet-Instanz. Deshalb dürfen
 * die Ansichten ihre Symbole weiterhin beim Laden des Moduls anlegen,
 * lange bevor irgendeine Karte da ist.
 */
import type * as Leaflet from "leaflet";
import type { MapLayerKind } from "./mapLayers";

// ── Beschreibungen (rein, ohne Kartendienst) ──────────────────────────────

export type LatLngTuple = [number, number];

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapClickEvent {
  latlng: LatLng;
}

/** Ein Pin-Symbol: HTML plus Masse. Bewusst ohne Bindung an einen Dienst. */
export interface IconSpec {
  html: string;
  className: string;
  /** Breite und Höhe in Pixeln. */
  size: [number, number];
  /** Punkt im Symbol, der auf der Koordinate sitzt. */
  anchor: [number, number];
}

export function divIcon(spec: {
  html: string;
  className?: string;
  iconSize?: [number, number];
  iconAnchor?: [number, number];
}): IconSpec {
  const size = spec.iconSize ?? [28, 28];
  return {
    html: spec.html,
    className: spec.className ?? "",
    size,
    anchor: spec.iconAnchor ?? [size[0] / 2, size[1] / 2],
  };
}

/** Ein Ausschnitt als reine Punktliste – wer ihn braucht, rechnet ihn um. */
export interface BoundsSpec {
  points: LatLngTuple[];
}

export function latLngBounds(points: LatLngTuple[]): BoundsSpec {
  return { points };
}

export interface PathStyle {
  color?: string;
  weight?: number;
  opacity?: number;
  fillColor?: string;
  fillOpacity?: number;
  dashArray?: string;
}

// ── Was eine Karte können muss ────────────────────────────────────────────

export interface MapObject {
  /** Aus der Karte bzw. ihrer Ebene entfernen. */
  remove(): void;
}

export interface MarkerObject extends MapObject {
  /** Popup-Inhalt als HTML – wie bisher, die Ansichten bauen ihn selbst. */
  bindPopup(html: string): MarkerObject;
  openPopup(): void;
  onClick(handler: () => void): MarkerObject;
  setLatLng(position: LatLngTuple): void;
}

export interface PathObject extends MapObject {
  setPoints(points: LatLngTuple[]): void;
}

/** Eine Gruppe, die man in einem Zug leeren kann (Pins neu aufbauen). */
export interface LayerGroupObject extends MapObject {
  add(object: MapObject): void;
  clear(): void;
}

export interface MapEngine {
  /** Welcher Dienst zeichnet gerade? Gehört sichtbar in die Fussnote. */
  readonly kind: "google" | "osm";
  marker(
    position: LatLngTuple,
    options: { icon: IconSpec; title?: string; layer?: LayerGroupObject }
  ): MarkerObject;
  circleMarker(
    position: LatLngTuple,
    options: PathStyle & { radius: number; layer?: LayerGroupObject }
  ): MarkerObject;
  circle(
    position: LatLngTuple,
    options: PathStyle & { radius: number; layer?: LayerGroupObject }
  ): PathObject;
  polyline(
    points: LatLngTuple[],
    options: PathStyle & { layer?: LayerGroupObject }
  ): PathObject;
  layerGroup(): LayerGroupObject;
  /** Regenradar und andere Kachel-Auflagen (#69). */
  overlayTiles(url: string, options?: { opacity?: number }): MapObject;
  setView(center: LatLngTuple, zoom: number): void;
  fitBounds(
    bounds: BoundsSpec,
    options?: { padding?: number; maxZoom?: number }
  ): void;
  getZoom(): number;
  getCenter(): LatLng;
  onClick(handler: (event: MapClickEvent) => void): void;
  onZoom(handler: (zoom: number) => void): void;
  /** «Karte» oder «Satellit» – bei Google der Kartentyp, sonst der Kachel-Layer. */
  setBaseKind(kind: MapLayerKind): void;
  /** Nach Grössenänderung des Behälters (aufklappende Abschnitte). */
  refresh(): void;
  destroy(): void;
}

// ── Google Maps laden ─────────────────────────────────────────────────────

export interface MapConfig {
  key: string | null;
  mapId: string | null;
}

/** Nach zwölf Sekunden gilt Google als nicht erreichbar – dann OSM. */
const LOAD_TIMEOUT_MS = 12000;

const SCRIPT_ID = "campmesser-google-maps";

let loadPromise: Promise<boolean> | null = null;

/**
 * Die Maps JavaScript API nachladen. Der Schlüssel MUSS in den Browser –
 * anders lädt keine Google-Karte. Geschützt wird er über die
 * Herkunfts-Sperre in der Cloud Console, nicht über Verstecken.
 *
 * Liefert false, wenn es nicht klappt (kein Netz, falscher Schlüssel,
 * Kontingent aufgebraucht). Dann zeichnet OpenStreetMap.
 */
export function loadGoogleMaps(config: MapConfig): Promise<boolean> {
  const key = config.key;
  if (!key || !config.mapId) return Promise.resolve(false);
  if (loadPromise) return loadPromise;
  loadPromise = new Promise<boolean>(resolve => {
    if (typeof document === "undefined") {
      resolve(false);
      return;
    }
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      resolve(googleReady());
      return;
    }
    const timer = window.setTimeout(() => resolve(false), LOAD_TIMEOUT_MS);
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src =
      "https://maps.googleapis.com/maps/api/js?" +
      new URLSearchParams({
        key,
        v: "weekly",
        libraries: "marker",
        loading: "async",
      }).toString();
    script.onload = () => {
      window.clearTimeout(timer);
      resolve(googleReady());
    };
    script.onerror = () => {
      window.clearTimeout(timer);
      resolve(false);
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}

interface GoogleGlobal {
  maps?: unknown;
}

function googleReady(): boolean {
  const g = (window as unknown as { google?: GoogleGlobal }).google;
  return Boolean(g && g.maps);
}

/** Nur für Tests: den Ladezustand zurücksetzen. */
export function resetGoogleMapsLoader(): void {
  loadPromise = null;
}

// ── Karte erzeugen ────────────────────────────────────────────────────────

export interface CreateMapOptions {
  center: LatLngTuple;
  zoom: number;
  baseKind: MapLayerKind;
  config: MapConfig;
  /** Bedienelemente ausblenden (Mini-Karten, geteilte Ansichten). */
  minimal?: boolean;
}

/**
 * Karte anlegen. Versucht Google und fällt lautlos auf OpenStreetMap
 * zurück – welcher Dienst es geworden ist, steht in `engine.kind` und
 * gehört in die Fussnote der Ansicht.
 */
export async function createMap(
  container: HTMLElement,
  options: CreateMapOptions
): Promise<MapEngine> {
  const useGoogle = await loadGoogleMaps(options.config);
  if (useGoogle && options.config.mapId) {
    const { createGoogleEngine } = await import("./mapEngineGoogle");
    const engine = createGoogleEngine(container, options, options.config.mapId);
    if (engine) return engine;
  }
  const { createOsmEngine } = await import("./mapEngineOsm");
  return createOsmEngine(container, options);
}

/** Leaflet-Typen, die beide Antriebe teilen (nur für die OSM-Seite). */
export type LeafletModule = typeof Leaflet;
