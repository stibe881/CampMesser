/**
 * Google-Antrieb der Karten-Maschine (Maps JavaScript API).
 *
 * Warum die JavaScript-API und nicht einfach Google-Kacheln in Leaflet:
 * Die Nutzungsbedingungen verlangen, dass eine Google-Karte auch von
 * Google gezeichnet wird – mit ihrem Logo, ihren Rechtehinweisen und dem
 * Link auf die Nutzungsbedingungen. Kacheln aus einer fremden Quelle in
 * einen anderen Renderer zu hängen, wäre der bequeme, aber falsche Weg.
 *
 * DIE PINS bleiben dieselben HTML-Schnipsel wie bisher. Google nimmt sie
 * über `AdvancedMarkerElement` entgegen, das ein echtes DOM-Element als
 * Inhalt akzeptiert – deshalb sehen die Pins auf beiden Karten gleich aus.
 * Dafür braucht es eine KARTEN-ID; ohne sie gibt es keine solchen Pins,
 * und die Maschine bleibt bei OpenStreetMap.
 *
 * Diese Datei ist die einzige Stelle mit Google-eigenen Aufrufen. Sie
 * beschreibt sich ihre Typen selbst, statt ein weiteres Typ-Paket in die
 * Abhängigkeiten zu holen.
 */
import type {
  BoundsSpec,
  MapBounds,
  CreateMapOptions,
  IconSpec,
  LatLng,
  LatLngTuple,
  LayerGroupObject,
  MapClickEvent,
  MapEngine,
  MapObject,
  MarkerObject,
  PathObject,
  PathStyle,
} from "./mapEngine";
import type { MapLayerKind } from "./mapLayers";

// ── Die Ausschnitte der Google-API, die wir benutzen ──────────────────────

interface GLatLngLiteral {
  lat: number;
  lng: number;
}

interface GLatLng {
  lat(): number;
  lng(): number;
}

interface GMapMouseEvent {
  latLng: GLatLng | null;
}

interface GMap {
  setCenter(position: GLatLngLiteral): void;
  setZoom(zoom: number): void;
  getZoom(): number | undefined;
  getCenter(): GLatLng | undefined;
  getBounds(): GLatLngBounds | undefined;
  setMapTypeId(id: string): void;
  fitBounds(bounds: GLatLngBounds, padding?: number): void;
  addListener(event: string, handler: (e: GMapMouseEvent) => void): unknown;
  overlayMapTypes: { push(type: unknown): void; clear(): void };
}

interface GLatLngBounds {
  extend(point: GLatLngLiteral): GLatLngBounds;
  isEmpty(): boolean;
  getSouthWest(): GLatLng;
  getNorthEast(): GLatLng;
}

interface GMarker {
  map: GMap | null;
  position: GLatLngLiteral | null;
  content?: HTMLElement | null;
  addListener(event: string, handler: () => void): unknown;
}

interface GPath {
  setMap(map: GMap | null): void;
  setPath(points: GLatLngLiteral[]): void;
}

interface GInfoWindow {
  setContent(content: string | HTMLElement): void;
  open(options: { map: GMap; anchor: GMarker }): void;
  close(): void;
}

interface GoogleMapsApi {
  Map: new (container: HTMLElement, options: Record<string, unknown>) => GMap;
  LatLngBounds: new () => GLatLngBounds;
  Polyline: new (options: Record<string, unknown>) => GPath;
  Circle: new (options: Record<string, unknown>) => GPath;
  InfoWindow: new (options?: Record<string, unknown>) => GInfoWindow;
  ImageMapType: new (options: Record<string, unknown>) => unknown;
  Point: new (x: number, y: number) => unknown;
  marker?: {
    AdvancedMarkerElement: new (options: Record<string, unknown>) => GMarker;
  };
  event: {
    clearInstanceListeners(instance: unknown): void;
    removeListener(listener: unknown): void;
  };
}

function api(): GoogleMapsApi | null {
  const google = (window as unknown as { google?: { maps?: GoogleMapsApi } })
    .google;
  return google?.maps ?? null;
}

/** «Karte» und «Satellit» heissen bei Google anders. */
function mapTypeFor(kind: MapLayerKind): string {
  return kind === "satellite" ? "hybrid" : "roadmap";
}

/**
 * Aus dem HTML eines Pins ein DOM-Element bauen. Der Anker sitzt bei
 * Google unten mittig; unsere Symbole geben ihren Ankerpunkt selbst an,
 * also wird der Unterschied als Verschiebung nachgereicht.
 */
function iconElement(spec: IconSpec): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = spec.className;
  wrapper.innerHTML = spec.html;
  wrapper.style.width = `${spec.size[0]}px`;
  wrapper.style.height = `${spec.size[1]}px`;
  // Google setzt den Punkt unten mittig auf die Koordinate
  const dx = spec.size[0] / 2 - spec.anchor[0];
  const dy = spec.size[1] - spec.anchor[1];
  wrapper.style.transform = `translate(${dx}px, ${dy}px)`;
  return wrapper;
}

function strokeOptions(style: PathStyle): Record<string, unknown> {
  return {
    strokeColor: style.color ?? "#2563eb",
    strokeWeight: style.weight ?? 3,
    strokeOpacity: style.opacity ?? 1,
    fillColor: style.fillColor ?? style.color ?? "#2563eb",
    fillOpacity: style.fillOpacity ?? 0,
  };
}

export function createGoogleEngine(
  container: HTMLElement,
  options: CreateMapOptions,
  mapId: string
): MapEngine | null {
  const maps = api();
  // Ohne die Pin-Bibliothek gäbe es keine HTML-Symbole – dann lieber OSM
  if (!maps?.marker?.AdvancedMarkerElement) return null;
  const AdvancedMarker = maps.marker.AdvancedMarkerElement;

  const map = new maps.Map(container, {
    center: { lat: options.center[0], lng: options.center[1] },
    zoom: options.zoom,
    mapId,
    mapTypeId: mapTypeFor(options.baseKind),
    // Die eigene Umschaltung «Karte/Satellit» und der eigene
    // Standort-Knopf bleiben – Googles Bedienelemente wären doppelt.
    mapTypeControl: false,
    fullscreenControl: false,
    streetViewControl: false,
    zoomControl: !options.minimal,
    clickableIcons: false,
  });

  /**
   * EIN Popup-Fenster für die ganze Karte. Google öffnet sonst beliebig
   * viele nebeneinander; Leaflet schloss das vorige automatisch, und genau
   * daran ist die Bedienung gewöhnt.
   */
  const infoWindow = new maps.InfoWindow();
  let openMarker: GMarker | null = null;

  const groups: GoogleGroup[] = [];

  interface GoogleGroup extends LayerGroupObject {
    members: MapObject[];
  }

  const makeGroup = (): GoogleGroup => {
    const members: MapObject[] = [];
    const group: GoogleGroup = {
      members,
      add: (object: MapObject) => {
        members.push(object);
      },
      clear: () => {
        members.splice(0).forEach(member => member.remove());
      },
      remove: () => {
        members.splice(0).forEach(member => member.remove());
        const index = groups.indexOf(group);
        if (index >= 0) groups.splice(index, 1);
      },
    };
    groups.push(group);
    return group;
  };

  const attach = (object: MapObject, layer?: LayerGroupObject) => {
    if (layer) (layer as GoogleGroup).add(object);
    return object;
  };

  const markerObject = (marker: GMarker): MarkerObject => {
    let popupContent: string | HTMLElement | null = null;
    const object: MarkerObject = {
      remove: () => {
        if (openMarker === marker) {
          infoWindow.close();
          openMarker = null;
        }
        maps.event.clearInstanceListeners(marker);
        marker.map = null;
      },
      bindPopup: (content: string | HTMLElement) => {
        popupContent = content;
        marker.addListener("click", () => {
          if (popupContent == null) return;
          infoWindow.setContent(popupContent);
          infoWindow.open({ map, anchor: marker });
          openMarker = marker;
        });
        return object;
      },
      openPopup: () => {
        if (popupContent == null) return;
        infoWindow.setContent(popupContent);
        infoWindow.open({ map, anchor: marker });
        openMarker = marker;
      },
      updatePopup: () => {
        // Das Fenster misst seinen Inhalt selbst nach – nichts zu tun
      },
      onClick: (handler: () => void) => {
        marker.addListener("click", handler);
        return object;
      },
      setLatLng: (position: LatLngTuple) => {
        marker.position = { lat: position[0], lng: position[1] };
      },
    };
    return object;
  };

  const pathObject = (path: GPath): PathObject => ({
    remove: () => path.setMap(null),
    setPoints: (points: LatLngTuple[]) =>
      path.setPath(points.map(([lat, lng]) => ({ lat, lng }))),
  });

  return {
    kind: "google",

    marker: (position, opts) => {
      const marker = new AdvancedMarker({
        map,
        position: { lat: position[0], lng: position[1] },
        content: iconElement(opts.icon),
        title: opts.title,
      });
      const object = markerObject(marker);
      attach(object, opts.layer);
      return object;
    },

    /**
     * Ein Punkt fester Pixelgrösse – bei Google gibt es dafür keinen
     * eigenen Typ, also ein winziger Pin mit rundem Inhalt.
     */
    circleMarker: (position, opts) => {
      const dot = document.createElement("div");
      const size = opts.radius * 2;
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      dot.style.borderRadius = "9999px";
      dot.style.background = opts.fillColor ?? opts.color ?? "#2563eb";
      dot.style.opacity = String(opts.fillOpacity ?? 1);
      dot.style.border = `${opts.weight ?? 1}px solid ${opts.color ?? "#fff"}`;
      const marker = new AdvancedMarker({
        map,
        position: { lat: position[0], lng: position[1] },
        content: dot,
      });
      const object = markerObject(marker);
      attach(object, opts.layer);
      return object;
    },

    circle: (position, opts) => {
      const circle = new maps.Circle({
        map,
        center: { lat: position[0], lng: position[1] },
        radius: opts.radius,
        ...strokeOptions(opts),
      });
      const object = pathObject(circle);
      attach(object, opts.layer);
      return object;
    },

    polyline: (points, opts) => {
      const line = new maps.Polyline({
        map,
        path: points.map(([lat, lng]) => ({ lat, lng })),
        ...strokeOptions(opts),
      });
      const object = pathObject(line);
      attach(object, opts.layer);
      return object;
    },

    layerGroup: () => makeGroup(),

    overlayTiles: (url, opts) => {
      // Kachel-Auflagen (Regenradar) legt Google über die Karte; die
      // Vorlage {z}/{x}/{y} muss dafür selbst eingesetzt werden.
      const type = new maps.ImageMapType({
        getTileUrl: (coord: { x: number; y: number }, zoom: number) =>
          url
            .replace("{z}", String(zoom))
            .replace("{x}", String(coord.x))
            .replace("{y}", String(coord.y)),
        tileSize: new maps.Point(256, 256),
        opacity: opts?.opacity ?? 1,
      });
      map.overlayMapTypes.push(type);
      return {
        remove: () => map.overlayMapTypes.clear(),
      };
    },

    setView: (center: LatLngTuple, zoom: number) => {
      map.setCenter({ lat: center[0], lng: center[1] });
      map.setZoom(zoom);
    },

    fitBounds: (bounds: BoundsSpec, opts) => {
      if (bounds.points.length === 0) return;
      const box = new maps.LatLngBounds();
      bounds.points.forEach(([lat, lng]) => box.extend({ lat, lng }));
      map.fitBounds(box, opts?.padding ?? 40);
      const maxZoom = opts?.maxZoom;
      if (maxZoom != null && (map.getZoom() ?? 0) > maxZoom) {
        map.setZoom(maxZoom);
      }
    },

    getZoom: () => map.getZoom() ?? options.zoom,

    getBounds: (): MapBounds => {
      const b = map.getBounds();
      if (!b) {
        // Vor dem ersten Zeichnen kennt Google den Ausschnitt noch nicht
        const [lat, lng] = options.center;
        return { south: lat, west: lng, north: lat, east: lng };
      }
      const sw = b.getSouthWest();
      const ne = b.getNorthEast();
      return {
        south: sw.lat(),
        west: sw.lng(),
        north: ne.lat(),
        east: ne.lng(),
      };
    },

    getCenter: (): LatLng => {
      const center = map.getCenter();
      return center
        ? { lat: center.lat(), lng: center.lng() }
        : { lat: options.center[0], lng: options.center[1] };
    },

    onClick: (handler: (event: MapClickEvent) => void) => {
      map.addListener("click", (event: GMapMouseEvent) => {
        if (!event.latLng) return;
        handler({
          latlng: { lat: event.latLng.lat(), lng: event.latLng.lng() },
        });
      });
    },

    onZoom: (handler: (zoom: number) => void) => {
      map.addListener("zoom_changed", () =>
        handler(map.getZoom() ?? options.zoom)
      );
    },

    onMove: (handler: () => void) => {
      const listener = map.addListener("idle", handler);
      return () => maps.event.removeListener(listener);
    },

    setBaseKind: (kind: MapLayerKind) => {
      map.setMapTypeId(mapTypeFor(kind));
    },

    closePopup: () => {
      infoWindow.close();
      openMarker = null;
    },

    refresh: () => {
      // Google misst selbst nach; nichts zu tun.
    },

    destroy: () => {
      infoWindow.close();
      groups.splice(0).forEach(group => group.clear());
      maps.event.clearInstanceListeners(map);
      container.replaceChildren();
    },
  };
}
