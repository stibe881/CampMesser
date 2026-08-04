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
 * Leaflet wird wie überall dynamisch geladen; ohne Netz bleibt die Karte
 * leer, und ein Satz sagt das.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { Loader2, Mountain, Route, Save, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { fetchElevations } from "@/lib/elevation";
import { createBaseLayer, loadMapLayer } from "@/lib/mapLayers";
import { formatDistance } from "@shared/geo";
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
const DEFAULT_CENTER: Leaflet.LatLngTuple = [46.8, 8.23];

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
  const mapRef = useRef<Leaflet.Map | null>(null);
  const layerRef = useRef<Leaflet.LayerGroup | null>(null);
  const [leaflet, setLeaflet] = useState<typeof Leaflet | null>(null);
  const [libFailed, setLibFailed] = useState(false);

  const [waypoints, setWaypoints] = useState<RouteWaypoint[]>([]);
  const [sampleElevations, setSampleElevations] = useState<(number | null)[]>(
    []
  );
  const [loadingElevation, setLoadingElevation] = useState(false);
  const [name, setName] = useState("");
  const [tripId, setTripId] = useState<number | null>(null);
  const [pace, setPace] = useState<RoutePace>("normal");
  const [editingId, setEditingId] = useState<number | null>(null);

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

  useEffect(() => {
    let cancelled = false;
    Promise.all([import("leaflet"), import("leaflet/dist/leaflet.css")])
      .then(([mod]) => {
        if (!cancelled) setLeaflet(mod.default);
      })
      .catch(() => {
        if (!cancelled) setLibFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Karte einmal aufbauen; Klicks hängen einen Wegpunkt hinten an
  useEffect(() => {
    const L = leaflet;
    const container = containerRef.current;
    if (!L || !container || mapRef.current) return;
    const map = L.map(container, { scrollWheelZoom: false }).setView(
      DEFAULT_CENTER,
      8
    );
    createBaseLayer(L, loadMapLayer()).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    map.on("click", event => {
      const { lat, lng } = event.latlng;
      setWaypoints(current => {
        if (current.length >= MAX_ROUTE_WAYPOINTS) return current;
        return [...current, { lat, lon: lng, ele: null }];
      });
      // Neue Punkte machen die alten Höhen ungültig
      setSampleElevations([]);
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, [leaflet]);

  // Linie und Punkte neu zeichnen, wenn sich die Route ändert
  useEffect(() => {
    const L = leaflet;
    const layer = layerRef.current;
    if (!L || !layer) return;
    layer.clearLayers();
    if (waypoints.length === 0) return;
    const latlngs: Leaflet.LatLngTuple[] = waypoints.map(w => [w.lat, w.lon]);
    if (latlngs.length > 1) {
      L.polyline(latlngs, {
        color: "#2563eb",
        weight: 4,
        opacity: 0.9,
      }).addTo(layer);
    }
    latlngs.forEach((latlng, index) => {
      L.circleMarker(latlng, {
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
      }).addTo(layer);
    });
  }, [leaflet, waypoints]);

  const distanceM = useMemo(() => routeDistanceM(waypoints), [waypoints]);
  const samples = useMemo(() => routeSamples(waypoints), [waypoints]);
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
    const map = mapRef.current;
    const L = leaflet;
    if (map && L) {
      map.fitBounds(
        L.latLngBounds(points.map(p => [p.lat, p.lon] as Leaflet.LatLngTuple)),
        { padding: [20, 20], maxZoom: 15 }
      );
    }
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
      ) : !leaflet ? (
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
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"
              >
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
                  onClick={() => removeMutation.mutate({ id: route.id })}
                  disabled={removeMutation.isPending}
                  aria-label={rp.removeAria(route.name)}
                >
                  <Trash2
                    className="h-4 w-4 text-destructive"
                    aria-hidden="true"
                  />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
