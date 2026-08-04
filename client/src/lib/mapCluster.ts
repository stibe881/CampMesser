/**
 * Leichte, eigene Pin-Gruppierung für die Leaflet-Karten (keine Zusatz-
 * Dependency): Punkte werden pro Zoomstufe in Pixel-Koordinaten projiziert
 * und greedy zu Clustern zusammengefasst, sobald sie einem bestehenden
 * Cluster-Schwerpunkt näher als `thresholdPx` kommen. Bei < 500 Pins ist
 * das O(n·k)-Verfahren völlig ausreichend und deterministisch.
 *
 * Die Projektion wird injiziert (auf der Karte `map.project(...)`, in Tests
 * eine simple lineare Abbildung) – so bleibt die Funktion rein testbar.
 */

export interface ProjectedPoint {
  x: number;
  y: number;
}

export interface ClusterPoint {
  lat: number;
  lon: number;
}

export interface Cluster<T extends ClusterPoint> {
  /** Alle Punkte des Clusters (mindestens einer). */
  points: T[];
  /** Geografischer Schwerpunkt – Anker für das Cluster-Icon. */
  lat: number;
  lon: number;
}

/** Standard-Abstand in Pixeln, unter dem Pins zusammengefasst werden. */
export const CLUSTER_THRESHOLD_PX = 48;

/**
 * Punkte zu Clustern gruppieren. Jeder Punkt wandert in den ersten Cluster,
 * dessen Pixel-Schwerpunkt näher als `thresholdPx` liegt; sonst eröffnet er
 * einen neuen. Schwerpunkte (Pixel und Geo) werden als laufender Mittelwert
 * nachgeführt. Cluster mit nur einem Punkt sind gewöhnliche Einzel-Pins.
 */
export function clusterPoints<T extends ClusterPoint>(
  points: readonly T[],
  project: (lat: number, lon: number) => ProjectedPoint,
  thresholdPx: number = CLUSTER_THRESHOLD_PX
): Cluster<T>[] {
  interface Working<U extends ClusterPoint> {
    points: U[];
    lat: number;
    lon: number;
    x: number;
    y: number;
  }
  const clusters: Working<T>[] = [];

  points.forEach(point => {
    const p = project(point.lat, point.lon);
    let best: Working<T> | null = null;
    let bestDist = Infinity;
    clusters.forEach(cluster => {
      const dx = cluster.x - p.x;
      const dy = cluster.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist < thresholdPx && dist < bestDist) {
        best = cluster;
        bestDist = dist;
      }
    });
    if (best) {
      const cluster: Working<T> = best;
      const n = cluster.points.length;
      cluster.points.push(point);
      // Laufender Mittelwert – bei nahen Punkten ist das geografische
      // Mittel als Icon-Anker völlig ausreichend.
      cluster.lat = (cluster.lat * n + point.lat) / (n + 1);
      cluster.lon = (cluster.lon * n + point.lon) / (n + 1);
      cluster.x = (cluster.x * n + p.x) / (n + 1);
      cluster.y = (cluster.y * n + p.y) / (n + 1);
    } else {
      clusters.push({
        points: [point],
        lat: point.lat,
        lon: point.lon,
        x: p.x,
        y: p.y,
      });
    }
  });

  return clusters.map(({ points: pts, lat, lon }) => ({
    points: pts,
    lat,
    lon,
  }));
}

/**
 * Koordinate in Pixel der gewünschten Zoomstufe umrechnen (Web-Mercator,
 * 256er-Kacheln – die Rechnung, die jede Slippy-Map benutzt).
 *
 * Früher kam das von `map.project()` aus Leaflet. Seit die Karte auch
 * Google sein kann, rechnet die Gruppierung selbst: Das Ergebnis ist
 * ohnehin unabhängig vom Ausschnitt und vom Kartendienst, und so bleibt
 * die Gruppierung dieselbe, egal wer zeichnet.
 */
export function projectToPixels(
  lat: number,
  lon: number,
  zoom: number
): ProjectedPoint {
  const scale = 256 * Math.pow(2, zoom);
  const x = ((lon + 180) / 360) * scale;
  // Nahe den Polen läuft die Mercator-Formel gegen unendlich – begrenzen
  const clamped = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const sin = Math.sin((clamped * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale;
  return { x, y };
}
