/**
 * «Wo waren wir schon»-Karte (#633): alle besuchten Orte – Reisen mit
 * Koordinaten (#465), verknüpfte Zeltplätze und Etappen (#536) – als
 * Punkte auf einer Mini-Karte in der Statistik. Gleiche Karten-Technik
 * wie die Etappen-Karte; ohne Netz bleibt die Karte einfach weg, die
 * Zahlen darüber sagen alles Nötige.
 */
import { useEffect, useRef, useState } from "react";
import { loadMapLayer } from "@/lib/mapLayers";
import {
  createMap,
  divIcon,
  latLngBounds,
  type LatLngTuple,
  type MapEngine,
} from "@/lib/mapEngine";
import { useMapConfig } from "@/hooks/useMapConfig";

export interface VisitedPoint {
  lat: number;
  lng: number;
  name: string;
}

/** Kleiner Punkt – dezenter als die nummerierten Etappen-Marker. */
function visitedIcon() {
  return divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:9999px;background:#2563eb;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.35);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -8],
  });
}

export default function VisitedMap({
  points,
  ariaLabel,
}: {
  points: VisitedPoint[];
  ariaLabel: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<MapEngine | null>(null);
  const [ready, setReady] = useState(false);
  const maps = useMapConfig();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || engineRef.current || !maps.ready) return;
    if (points.length === 0) return;
    let cancelled = false;
    void createMap(container, {
      center: [points[0].lat, points[0].lng],
      zoom: 5,
      baseKind: loadMapLayer(),
      config: maps.config,
      minimal: true,
    })
      .then(engine => {
        if (cancelled) {
          engine.destroy();
          return;
        }
        engineRef.current = engine;
        setReady(true);
      })
      .catch(() => {
        // Ohne Netz keine Karte – die Statistik darüber bleibt vollständig
      });
    return () => {
      cancelled = true;
      engineRef.current?.destroy();
      engineRef.current = null;
      setReady(false);
    };
    // Aufbau nur einmal, sobald es Punkte gibt – das Zeichnen unten folgt
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maps.ready, maps.config, points.length > 0]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !ready || points.length === 0) return;
    const line: LatLngTuple[] = points.map(point => [point.lat, point.lng]);
    points.forEach(point => {
      engine.marker([point.lat, point.lng], {
        icon: visitedIcon(),
        title: point.name,
      });
    });
    engine.fitBounds(latLngBounds(line), { padding: 30, maxZoom: 9 });
  }, [ready, points]);

  if (points.length === 0) return null;
  return (
    <div
      ref={containerRef}
      className="h-64 w-full overflow-hidden rounded-lg border border-border"
      aria-label={ariaLabel}
    />
  );
}
