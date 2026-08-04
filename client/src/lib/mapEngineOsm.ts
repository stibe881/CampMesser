/**
 * OpenStreetMap-Antrieb der Karten-Maschine (Leaflet).
 *
 * Der Rückfall – und in zwei Fällen die einzig mögliche Wahl: ohne Netz
 * (die Offline-Pakete speichern OSM-Kacheln, Google-Kacheln darf man nicht
 * speichern) und solange kein Google-Schlüssel eingerichtet ist.
 *
 * Weil die Ansichten früher direkt gegen Leaflet gearbeitet haben, ist
 * diese Datei dünn: Sie reicht fast alles unverändert weiter.
 */
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { createBaseLayer, type MapLayerKind } from "./mapLayers";
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

function toIcon(spec: IconSpec): L.DivIcon {
  return L.divIcon({
    html: spec.html,
    className: spec.className,
    iconSize: spec.size,
    iconAnchor: spec.anchor,
  });
}

function pathOptions(style: PathStyle): L.PathOptions {
  return {
    color: style.color,
    weight: style.weight,
    opacity: style.opacity,
    fillColor: style.fillColor,
    fillOpacity: style.fillOpacity,
    dashArray: style.dashArray,
  };
}

export function createOsmEngine(
  container: HTMLElement,
  options: CreateMapOptions
): MapEngine {
  const map = L.map(container, {
    center: options.center,
    zoom: options.zoom,
    scrollWheelZoom: true,
    zoomControl: !options.minimal,
    attributionControl: true,
  });
  let baseLayer = createBaseLayer(L, options.baseKind).addTo(map);

  /** Zielort eines Objekts: die Gruppe, sonst die Karte selbst. */
  const target = (layer?: LayerGroupObject): L.Map | L.LayerGroup =>
    layer ? (layer as unknown as { raw: L.LayerGroup }).raw : map;

  const wrap = (layer: L.Layer): MapObject => ({
    remove: () => {
      layer.remove();
    },
  });

  const wrapMarker = (marker: L.Marker | L.CircleMarker): MarkerObject => {
    const object: MarkerObject = {
      remove: () => {
        marker.remove();
      },
      bindPopup: (content: string | HTMLElement) => {
        marker.bindPopup(content);
        return object;
      },
      updatePopup: () => {
        marker.getPopup()?.update();
      },
      openPopup: () => {
        marker.openPopup();
      },
      onClick: (handler: () => void) => {
        marker.on("click", handler);
        return object;
      },
      setLatLng: (position: LatLngTuple) => {
        marker.setLatLng(position);
      },
    };
    return object;
  };

  return {
    kind: "osm",

    marker: (position, opts) => {
      const marker = L.marker(position, {
        icon: toIcon(opts.icon),
        title: opts.title,
      }).addTo(target(opts.layer));
      return wrapMarker(marker);
    },

    circleMarker: (position, opts) => {
      const marker = L.circleMarker(position, {
        radius: opts.radius,
        ...pathOptions(opts),
      }).addTo(target(opts.layer));
      return wrapMarker(marker);
    },

    circle: (position, opts) => {
      const circle = L.circle(position, {
        radius: opts.radius,
        ...pathOptions(opts),
      }).addTo(target(opts.layer));
      return { ...wrap(circle), setPoints: () => {} };
    },

    polyline: (points, opts) => {
      const line = L.polyline(points, pathOptions(opts)).addTo(
        target(opts.layer)
      );
      return {
        remove: () => {
          line.remove();
        },
        setPoints: (next: LatLngTuple[]) => line.setLatLngs(next),
      };
    },

    layerGroup: () => {
      const group = L.layerGroup().addTo(map);
      const object = {
        raw: group,
        add: () => {
          /* Leaflet-Objekte hängen sich beim Anlegen selbst ein */
        },
        clear: () => group.clearLayers(),
        remove: () => {
          group.remove();
        },
      };
      return object as unknown as LayerGroupObject;
    },

    overlayTiles: (url, opts) => {
      const layer = L.tileLayer(url, { opacity: opts?.opacity ?? 1 }).addTo(
        map
      );
      return wrap(layer);
    },

    setView: (center: LatLngTuple, zoom: number) => {
      map.setView(center, zoom);
    },

    fitBounds: (bounds: BoundsSpec, opts) => {
      if (bounds.points.length === 0) return;
      map.fitBounds(L.latLngBounds(bounds.points), {
        padding: [opts?.padding ?? 40, opts?.padding ?? 40],
        maxZoom: opts?.maxZoom,
      });
    },

    getZoom: () => map.getZoom(),

    getBounds: () => {
      const b = map.getBounds();
      return {
        south: b.getSouth(),
        west: b.getWest(),
        north: b.getNorth(),
        east: b.getEast(),
      };
    },

    getCenter: (): LatLng => {
      const center = map.getCenter();
      return { lat: center.lat, lng: center.lng };
    },

    onClick: (handler: (event: MapClickEvent) => void) => {
      map.on("click", (event: L.LeafletMouseEvent) =>
        handler({ latlng: { lat: event.latlng.lat, lng: event.latlng.lng } })
      );
    },

    onZoom: (handler: (zoom: number) => void) => {
      map.on("zoomend", () => handler(map.getZoom()));
    },

    onMove: (handler: () => void) => {
      map.on("moveend", handler);
      map.on("zoomend", handler);
      return () => {
        map.off("moveend", handler);
        map.off("zoomend", handler);
      };
    },

    setBaseKind: (kind: MapLayerKind) => {
      // Erst den neuen Layer hinzufügen, dann den alten entfernen – sonst
      // blitzt die Karte kurz leer auf.
      const next = createBaseLayer(L, kind).addTo(map);
      baseLayer.remove();
      baseLayer = next;
    },

    closePopup: () => {
      map.closePopup();
    },

    refresh: () => {
      map.invalidateSize();
    },

    destroy: () => {
      map.remove();
    },
  };
}
