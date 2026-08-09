/**
 * Route vorher zeichnen (#281): Wegpunkte auf der Karte setzen, Länge,
 * Höhenmeter und Gehzeit schätzen.
 *
 * WARUM: «Sind das zwei Stunden oder vier?» entscheidet am Vorabend über
 * die Wanderung. Die Länge kann man auf der Karte abschätzen, die Gehzeit
 * nicht – die hängt an den Höhenmetern, und die sieht man einer Linie
 * nicht an.
 *
 * DIE HÖHEN kommen aus dem Höhenmodell von Open-Meteo, und zwar nicht nur
 * zu den geklickten Punkten, sondern zu Stützstellen alle 200 Meter: Wer
 * zwei Klicks drei Kilometer auseinander setzt, hat dazwischen womöglich
 * einen Sattel – und genau der macht die Gehzeit aus. Abgefragt wird
 * bewusst erst auf Knopfdruck, nicht bei jedem Klick.
 *
 * DIE STRECKE FOLGT DEN WEGEN: Zwischen den gesetzten Punkten wird eine
 * echte Fussgänger-Route berechnet (OSRM, siehe client/src/lib/routing.ts)
 * und die gezeichnete Linie folgt ihr. Der Unterschied ist gross – wer im
 * Gebirge zwei Punkte setzt, hat Luftlinie zwei Kilometer und über den
 * Wanderweg mit seinen Kehren fünf. Auch die Höhen-Stützstellen liegen
 * dann auf dem WEG und nicht quer über den Grat.
 *
 * Ohne Netz bleibt es bei den geraden Verbindungen; die Ansicht sagt das,
 * statt eine Weglänge zu behaupten, die niemand gemessen hat.
 *
 * Leaflet wird wie überall dynamisch geladen; ohne Netz bleibt die Karte
 * leer, und ein Satz sagt das.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Mountain, Route, Save, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import TurnaroundCard from "@/components/TurnaroundCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { fetchElevations } from "@/lib/elevation";
import { loadMapLayer } from "@/lib/mapLayers";
import {
  createMap,
  latLngBounds,
  type LatLngTuple,
  type LayerGroupObject,
  type MapEngine,
} from "@/lib/mapEngine";
import { useMapConfig } from "@/hooks/useMapConfig";
import { formatDistance } from "@shared/geo";
import {
  MAX_ROUTE_PATH_POINTS,
  pointsAlongRoute,
  routeLengthM,
} from "@shared/routing";
import { fetchRoute } from "@/lib/routing";
import RouteOfflinePack from "@/components/RouteOfflinePack";
import {
  deleteTiles,
  forgetOfflineRoutePack,
  loadOfflineRoutePacks,
  tilesForCorridor,
  zoomLevelsUpTo,
} from "@/lib/mapTiles";
import {
  MAX_ROUTE_WAYPOINTS,
  ROUTE_NAME_MAX_LENGTH,
  ROUTE_PACE_FACTORS,
  hikingMinutes,
  parseWaypoints,
  routeDistanceM,
  routeElevation,
  routeSamples,
  type RoutePace,
  type RouteWaypoint,
} from "@shared/routePlan";
import { cn } from "@/lib/utils";

/** Startausschnitt, wenn weder Route noch Standort bekannt sind: Schweiz. */
const DEFAULT_CENTER: LatLngTuple = [46.8, 8.23];

/** Gehzeit lesbar: «2 h 15 min» bzw. «45 min». */
function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export default function RoutePlanner({
  trips,
  className,
}: {
  trips: { id: number; label: string }[];
  className?: string;
}) {
  const { lang, t } = useI18n();
  const rp = t.routePlan;
  const utils = trpc.useUtils();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<MapEngine | null>(null);
  const layerRef = useRef<LayerGroupObject | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [libFailed, setLibFailed] = useState(false);
  const maps = useMapConfig();

  const [waypoints, setWaypoints] = useState<RouteWaypoint[]>([]);
  const [sampleElevations, setSampleElevations] = useState<(number | null)[]>(
    []
  );
  const [loadingElevation, setLoadingElevation] = useState(false);
  const [name, setName] = useState("");
  const [tripId, setTripId] = useState<number | null>(null);
  const [pace, setPace] = useState<RoutePace>("normal");
  const [editingId, setEditingId] = useState<number | null>(null);
  /** Verlauf entlang echter Wege; leer = nur die geraden Verbindungen. */
  const [pathPoints, setPathPoints] = useState<RouteWaypoint[]>([]);
  const [snapping, setSnapping] = useState(false);
  const routeAbortRef = useRef<AbortController | null>(null);

  const routesQuery = trpc.routes.list.useQuery();
  const saveMutation = trpc.routes.save.useMutation({
    onSuccess: () => {
      void utils.routes.list.invalidate();
      toast.success(rp.saved);
    },
    onError: () => toast.error(rp.saveFailed),
  });
  const removeMutation = trpc.routes.remove.useMutation({
    onSuccess: () => void utils.routes.list.invalidate(),
    onError: () => toast.error(rp.removeFailed),
  });

  // Karte einmal aufbauen; Klicks hängen einen Wegpunkt hinten an
  useEffect(() => {
    const container = containerRef.current;
    if (!container || engineRef.current || !maps.ready) return;
    let cancelled = false;
    void createMap(container, {
      center: DEFAULT_CENTER,
      zoom: 8,
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
        layerRef.current = engine.layerGroup();
        engine.onClick(event => {
          const { lat, lng } = event.latlng;
          setWaypoints(current => {
            if (current.length >= MAX_ROUTE_WAYPOINTS) return current;
            return [...current, { lat, lon: lng, ele: null }];
          });
          // Neue Punkte machen die alten Höhen ungültig
          setSampleElevations([]);
        });
        setMapReady(true);
      })
      .catch(() => {
        if (!cancelled) setLibFailed(true);
      });
    return () => {
      cancelled = true;
      engineRef.current?.destroy();
      engineRef.current = null;
      layerRef.current = null;
      setMapReady(false);
    };
  }, [maps.ready, maps.config]);

  // Linie und Punkte neu zeichnen, wenn sich die Route ändert
  useEffect(() => {
    const engine = engineRef.current;
    const layer = layerRef.current;
    if (!engine || !layer || !mapReady) return;
    layer.clear();
    if (waypoints.length === 0) return;
    const latlngs: LatLngTuple[] = waypoints.map(w => [w.lat, w.lon]);
    // Die Linie folgt dem berechneten Weg, die Punkte bleiben die gesetzten
    const line: LatLngTuple[] =
      pathPoints.length >= 2
        ? pathPoints.map(p => [p.lat, p.lon] as LatLngTuple)
        : latlngs;
    if (line.length > 1) {
      engine.polyline(line, {
        color: "#2563eb",
        weight: 4,
        opacity: 0.9,
        layer,
      });
    }
    latlngs.forEach((latlng, index) => {
      engine.circleMarker(latlng, {
        radius: index === 0 || index === latlngs.length - 1 ? 7 : 5,
        color: "#ffffff",
        weight: 2,
        fillColor:
          index === 0
            ? "#16a34a"
            : index === latlngs.length - 1
              ? "#dc2626"
              : "#2563eb",
        fillOpacity: 1,
        layer,
      });
    });
  }, [mapReady, waypoints, pathPoints]);

  // Wegpunkte auf echte Wege legen (Fussgänger-Profil). Bei jeder Änderung
  // neu – der Zwischenspeicher fängt das Meiste ab.
  useEffect(() => {
    routeAbortRef.current?.abort();
    setPathPoints([]);
    if (waypoints.length < 2) return;
    const controller = new AbortController();
    routeAbortRef.current = controller;
    setSnapping(true);
    void fetchRoute(
      waypoints.map(w => ({ lat: w.lat, lon: w.lon })),
      "foot",
      { signal: controller.signal }
    )
      .then(route => {
        if (controller.signal.aborted) return;
        setPathPoints(
          route && route.points.length >= 2
            ? route.points.map(p => ({ lat: p.lat, lon: p.lon, ele: null }))
            : []
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setSnapping(false);
      });
    return () => controller.abort();
  }, [waypoints]);

  /** Für Länge, Höhen und Linie zählt der Weg, sonst die gerade Verbindung. */
  const routed = pathPoints.length >= 2;
  const pathForMeasuring = routed ? pathPoints : waypoints;
  const distanceM = useMemo(
    () => (routed ? routeLengthM(pathPoints) : routeDistanceM(waypoints)),
    [routed, pathPoints, waypoints]
  );
  const samples = useMemo(
    () => routeSamples(pathForMeasuring),
    [pathForMeasuring]
  );
  const elevation = useMemo(() => {
    if (sampleElevations.length === 0) return null;
    return routeElevation(
      samples.map((s, i) => ({ ...s, ele: sampleElevations[i] ?? null }))
    );
  }, [samples, sampleElevations]);
  const minutes = useMemo(
    () =>
      hikingMinutes({
        distanceM,
        ascentM: elevation?.ascentM ?? 0,
        descentM: elevation?.descentM ?? 0,
        pace,
      }),
    [distanceM, elevation, pace]
  );

  const loadElevation = async () => {
    if (samples.length < 2) return;
    setLoadingElevation(true);
    try {
      const values = await fetchElevations(
        samples.map(s => ({ lat: s.lat, lon: s.lon }))
      );
      if (values.every(v => v === null)) {
        toast.error(rp.elevationFailed);
        return;
      }
      setSampleElevations(values);
    } finally {
      setLoadingElevation(false);
    }
  };

  const reset = () => {
    setWaypoints([]);
    setSampleElevations([]);
    setName("");
    setTripId(null);
    setEditingId(null);
  };

  const save = () => {
    if (waypoints.length < 2) return;
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error(rp.nameMissing);
      return;
    }
    saveMutation.mutate(
      {
        ...(editingId !== null ? { id: editingId } : {}),
        name: trimmed,
        tripId,
        pace,
        waypoints: waypoints.map(w => ({ lat: w.lat, lon: w.lon })),
        ...(sampleElevations.length > 0
          ? { sampleElevations: sampleElevations }
          : {}),
        // Den berechneten Weg mitschicken, damit der Server dieselbe
        // Länge und dieselben Stützstellen sieht wie die Ansicht
        ...(routed
          ? {
              pathPoints: pointsAlongRoute(
                pathPoints.map(p => ({ lat: p.lat, lon: p.lon })),
                MAX_ROUTE_PATH_POINTS
              ),
            }
          : {}),
      },
      { onSuccess: () => reset() }
    );
  };

  /** Gespeicherte Route zum Weiterzeichnen in die Karte holen. */
  const edit = (route: {
    id: number;
    name: string;
    tripId: number | null;
    pace: string;
    waypointsJson: string;
  }) => {
    const points = parseWaypoints(route.waypointsJson);
    if (points.length === 0) return;
    setWaypoints(points);
    setSampleElevations([]);
    setName(route.name);
    setTripId(route.tripId);
    setPace(
      route.pace in ROUTE_PACE_FACTORS ? (route.pace as RoutePace) : "normal"
    );
    setEditingId(route.id);
    engineRef.current?.fitBounds(
      latLngBounds(points.map(p => [p.lat, p.lon] as LatLngTuple)),
      { padding: 20, maxZoom: 15 }
    );
  };

  /**
   * Route löschen – ein dazu geladenes Offline-Paket (#552) räumt gleich
   * mit ab, sonst lägen die Kacheln herrenlos im Cache.
   */
  const removeRoute = (route: { id: number; waypointsJson: string }) => {
    const pack = loadOfflineRoutePacks()[String(route.id)];
    if (pack) {
      const points = parseWaypoints(route.waypointsJson).map(p => ({
        lat: p.lat,
        lon: p.lon,
      }));
      void deleteTiles(
        tilesForCorridor(points, pack.radiusKm, zoomLevelsUpTo(pack.maxZoom)),
        pack.layer
      ).catch(() => {});
      forgetOfflineRoutePack(route.id);
    }
    removeMutation.mutate({ id: route.id });
  };

  const routes = routesQuery.data ?? [];

  return (
    <section className={cn("space-y-3", className)} aria-label={rp.sectionAria}>
      <div>
        <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
          <Route className="h-5 w-5 text-primary" aria-hidden="true" />
          {rp.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{rp.intro}</p>
      </div>

      {libFailed ? (
        <p className="text-sm text-muted-foreground">{rp.mapFailed}</p>
      ) : !maps.ready ? (
        <Skeleton className="h-72 w-full rounded-lg" />
      ) : (
        <div
          ref={containerRef}
          className="h-72 w-full overflow-hidden rounded-lg border border-border"
          aria-label={rp.mapAria}
        />
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setWaypoints(current => current.slice(0, -1));
            setSampleElevations([]);
          }}
          disabled={waypoints.length === 0}
        >
          <Undo2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {rp.undo}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={reset}
          disabled={waypoints.length === 0}
        >
          <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {rp.clear}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void loadElevation()}
          disabled={waypoints.length < 2 || loadingElevation}
        >
          {loadingElevation ? (
            <Loader2
              className="mr-1.5 h-4 w-4 animate-spin"
              aria-hidden="true"
            />
          ) : (
            <Mountain className="mr-1.5 h-4 w-4" aria-hidden="true" />
          )}
          {rp.loadElevation}
        </Button>
      </div>

      {waypoints.length < 2 ? (
        <p className="text-sm text-muted-foreground">{rp.hint}</p>
      ) : (
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="font-mono text-lg font-bold leading-tight">
                {formatDistance(distanceM, lang)}
              </p>
              <p className="text-xs text-muted-foreground">{rp.length}</p>
            </div>
            <div>
              <p className="font-mono text-lg font-bold leading-tight">
                {elevation
                  ? `↑ ${elevation.ascentM} / ↓ ${elevation.descentM} m`
                  : "–"}
              </p>
              <p className="text-xs text-muted-foreground">{rp.elevation}</p>
            </div>
            <div>
              <p className="font-mono text-lg font-bold leading-tight">
                {formatMinutes(minutes)}
              </p>
              <p className="text-xs text-muted-foreground">{rp.walkingTime}</p>
            </div>
          </div>

          {/* Umkehrzeit (#379): Sonnenuntergang am STARTPUNKT plus die
              eben gerechnete Gehzeit. Erst ab zwei Wegpunkten – vorher
              gibt es weder Route noch Ort. */}
          {waypoints.length >= 2 && (
            <TurnaroundCard
              latitude={waypoints[0].lat}
              longitude={waypoints[0].lon}
              totalMinutes={minutes}
              className="mt-3"
            />
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">{rp.pace}</span>
            {(["slow", "normal", "fast"] as const).map(option => (
              <Button
                key={option}
                size="sm"
                variant={pace === option ? "default" : "outline"}
                onClick={() => setPace(option)}
              >
                {rp.paceLabels[option]}
              </Button>
            ))}
          </div>

          {snapping && (
            <p className="text-xs text-muted-foreground">{rp.snapping}</p>
          )}
          {!snapping && !routed && (
            <p className="text-xs text-muted-foreground">{rp.notRouted}</p>
          )}

          {!elevation && (
            <p className="mt-2 text-xs text-muted-foreground">
              {rp.noElevationYet}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">{rp.note}</p>

          <div className="mt-3 space-y-2">
            <div>
              <Label htmlFor="route-name">{rp.nameLabel}</Label>
              <Input
                id="route-name"
                value={name}
                maxLength={ROUTE_NAME_MAX_LENGTH}
                onChange={e => setName(e.target.value)}
                placeholder={rp.namePlaceholder}
              />
            </div>
            {trips.length > 0 && (
              <div>
                <Label htmlFor="route-trip">{rp.tripLabel}</Label>
                <select
                  id="route-trip"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={tripId === null ? "" : String(tripId)}
                  onChange={e =>
                    setTripId(e.target.value ? Number(e.target.value) : null)
                  }
                >
                  <option value="">{rp.tripNone}</option>
                  {trips.map(trip => (
                    <option key={trip.id} value={trip.id}>
                      {trip.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Button
              size="sm"
              onClick={save}
              disabled={saveMutation.isPending || !name.trim()}
            >
              <Save className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {editingId !== null ? rp.update : rp.save}
            </Button>
          </div>
        </div>
      )}

      {routes.length > 0 && (
        <div>
          <h3 className="mb-1.5 font-serif text-base font-semibold">
            {rp.savedTitle}
          </h3>
          <ul className="space-y-1.5">
            {routes.map(route => (
              <li
                key={route.id}
                className="rounded-lg border border-border bg-background px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex-1 text-left"
                    onClick={() => edit(route)}
                  >
                    <span className="text-sm font-medium">{route.name}</span>
                    <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground">
                      {rp.summary(
                        formatDistance(route.distanceM, lang),
                        route.ascentM,
                        formatMinutes(route.minutes)
                      )}
                    </span>
                  </button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => removeRoute(route)}
                    disabled={removeMutation.isPending}
                    aria-label={rp.removeAria(route.name)}
                  >
                    <Trash2
                      className="h-4 w-4 text-destructive"
                      aria-hidden="true"
                    />
                  </Button>
                </div>
                {/* Offline-Paket entlang der Route (#552) */}
                <RouteOfflinePack route={route} />
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {rp.offlineHint}
          </p>
        </div>
      )}
    </section>
  );
}
