/**
 * Wanderwege in der Nähe (#238): markierte Wanderrouten rund um einen Platz
 * oder den aktuellen Standort – Name, Länge, geschätzte Gehzeit, Höhenmeter
 * und SAC-Schwierigkeit, sortiert nach der Luftlinie zum Weg.
 *
 * Datengrundlage ist OpenStreetMap über die Overpass-API – dieselbe
 * Anbindung wie beim Entdecker-Layer der Karte (#113) und mit derselben
 * Rücksicht: gefragt wird ausschliesslich auf Klick, nie automatisch, mit
 * hartem Ergebnis-Limit und abbrechbarer Anfrage. Die Wegführung kommt
 * bereits auf den Suchumkreis zugeschnitten zurück (`out geom(bbox)`), damit
 * auch ein Weitwanderweg die Antwort nicht sprengt.
 *
 * Ehrlichkeit vor Vollständigkeit: Länge, Höhenmeter und Schwierigkeit
 * stehen nur da, wenn sie in OSM gepflegt sind – sonst «–». Geschätzt wird
 * einzig die Gehzeit, und die ist als Schätzung benannt.
 *
 * Bewusst als eigenes Bauteil, weil derselbe Kasten an zwei Stellen steht:
 * im Platz-Dossier (mit den Koordinaten des Platzes) und im Wander-Modul
 * (dort ohne Koordinaten – das Bauteil holt sich den Standort selbst).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bike,
  Footprints,
  Loader2,
  Map as MapIcon,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  defaultProvider,
  directionsUrl,
  openDirections,
} from "@/lib/directions";
import { loadMapLayer } from "@/lib/mapLayers";
import {
  createMap,
  latLngBounds,
  type LatLngTuple,
  type MapEngine,
} from "@/lib/mapEngine";
import { useMapConfig } from "@/hooks/useMapConfig";
import {
  bicycleRoutesQuery,
  hikingRoutesQuery,
  HIKING_DEFAULT_RADIUS_M,
  HIKING_SEARCH_RADII_M,
  fetchOverpass,
  parseHikingRoutes,
  type OsmHikingRoute,
} from "@/lib/overpass";
import { useI18n } from "@/i18n";
import { applyRouteDistances } from "@shared/routing";
import { useRoutedDistances } from "@/hooks/useRoutedDistances";
import { formatDistance } from "@shared/geo";
import {
  cyclingTimeMinutes,
  formatWalkingTime,
  nearestRoutePoint,
  routeLengthMeters,
  sacScaleDescription,
  sacScaleLabel,
  walkingTimeMinutes,
  type GeoPoint,
  routeLengthClass,
  type RouteLengthClass,
} from "@shared/hiking";
import { cn } from "@/lib/utils";

/** Eine Route mit den am Ort gerechneten Werten – fertig zum Anzeigen. */
interface RouteView {
  route: OsmHikingRoute;
  /** Luftlinie vom Ort zum nächsten Punkt des Wegs. */
  distanceM: number;
  /** Nächster Punkt des Wegs – Ziel der Anreise-Navigation. */
  entry: GeoPoint;
  /** Gemessene Länge des Stücks im Suchumkreis. */
  sectionLengthM: number;
}

type Status =
  "idle" | "locating" | "loading" | "ready" | "failed" | "noLocation";

/**
 * Karte einer Route: Wegführung als Linie, der eigene Ort als Punkt.
 * Leaflet wird erst geladen, wenn eine Karte wirklich aufgeht (dynamischer
 * Import wie im Wander-Modul) – der Chunk der Seite bleibt so schlank.
 */
function RouteMap({
  segments,
  origin,
  label,
}: {
  segments: GeoPoint[][];
  origin: GeoPoint;
  label: string;
}) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<MapEngine | null>(null);
  const [libFailed, setLibFailed] = useState(false);
  const maps = useMapConfig();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || engineRef.current || segments.length === 0 || !maps.ready)
      return;
    const all: LatLngTuple[] = [];
    segments.forEach(points =>
      points.forEach(p => all.push([p.lat, p.lon] as LatLngTuple))
    );
    const here: LatLngTuple = [origin.lat, origin.lon];
    all.push(here);
    let cancelled = false;
    void createMap(container, {
      center: here,
      zoom: 14,
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
        segments.forEach(points => {
          engine.polyline(
            points.map(p => [p.lat, p.lon] as LatLngTuple),
            { color: "#b45309", weight: 4, opacity: 0.9 }
          );
        });
        engine.circleMarker(here, {
          radius: 6,
          color: "#ffffff",
          weight: 2,
          fillColor: "#16a34a",
          fillOpacity: 1,
        });
        engine.fitBounds(latLngBounds(all), { padding: 20, maxZoom: 15 });
      })
      .catch(() => {
        if (!cancelled) setLibFailed(true);
      });
    return () => {
      cancelled = true;
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, [maps.ready, maps.config, segments, origin]);

  if (libFailed) {
    return (
      <p className="mt-3 text-sm text-muted-foreground">
        {t.nearbyHikes.mapFailed}
      </p>
    );
  }
  if (!maps.ready) return <Skeleton className="mt-3 h-56 w-full rounded-lg" />;
  return (
    <div
      ref={containerRef}
      className="mt-3 h-56 w-full overflow-hidden rounded-lg border border-border"
      role="img"
      aria-label={label}
    />
  );
}

export default function NearbyHikes({
  latitude,
  longitude,
  placeName,
  className,
  mode = "hiking",
}: {
  latitude?: number | null;
  longitude?: number | null;
  placeName?: string | null;
  className?: string;
  /** «bicycle» sucht Velorouten (#478) statt Wanderwege – gleicher Kasten. */
  mode?: "hiking" | "bicycle";
}) {
  const { lang, t } = useI18n();
  const bike = mode === "bicycle";
  // Velo-Variante (#478): eigene Texte nur, wo es ums Velo geht – der
  // Rest (Radius, Karte, Navigation) bleibt wortgleich.
  const tn = bike ? { ...t.nearbyHikes, ...t.nearbyBikes } : t.nearbyHikes;
  const TitleIcon = bike ? Bike : Footprints;
  const [radiusM, setRadiusM] = useState(HIKING_DEFAULT_RADIUS_M);
  const [status, setStatus] = useState<Status>("idle");
  const [routes, setRoutes] = useState<RouteView[]>([]);
  // Längen-Filter (#495): In dichten Netzen macht erst «bis 5 km» die
  // Liste brauchbar. Routen ohne Länge erscheinen nur unter «alle».
  const [lengthFilter, setLengthFilter] = useState<RouteLengthClass | "alle">(
    "alle"
  );
  const [openId, setOpenId] = useState<string | null>(null);
  const [gpsOrigin, setGpsOrigin] = useState<GeoPoint | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const propOrigin = useMemo<GeoPoint | null>(
    () =>
      latitude != null && longitude != null
        ? { lat: latitude, lon: longitude }
        : null,
    [latitude, longitude]
  );
  const origin = propOrigin ?? gpsOrigin;

  // Wegstrecke zum Einstieg statt Luftlinie: Auf der anderen Talseite sind
  // achthundert Meter Luftlinie eine Stunde Fussmarsch
  const routedDistances = useRoutedDistances(
    routes.length > 0 ? origin : null,
    routes.map(view => ({
      id: view.route.id,
      lat: view.entry.lat,
      lon: view.entry.lon,
    })),
    bike ? "bike" : "foot"
  );
  /** Liste in der Reihenfolge der Wegstrecke (sonst der Luftlinie). */
  const routeList = useMemo(
    () =>
      applyRouteDistances(
        routes.map(view => ({
          // Der Schlüssel ist die Id des Wegs – applyRouteDistances erwartet
          // ein Objekt mit `id`, der ganze View hängt daran
          place: { id: view.route.id, view },
          distanceM: view.distanceM,
        })),
        routedDistances.byId
      ).map(entry => ({
        view: entry.place.view,
        distanceM: entry.distanceM,
        onFoot: entry.routed,
      })),
    [routes, routedDistances.byId]
  );
  const filteredRouteList = useMemo(
    () =>
      lengthFilter === "alle"
        ? routeList
        : routeList.filter(
            entry =>
              routeLengthClass(entry.view.route.distanceM) === lengthFilter
          ),
    [routeList, lengthFilter]
  );

  // Beim Verlassen die laufende Overpass-Anfrage abbrechen
  useEffect(() => () => abortRef.current?.abort(), []);

  /** Standort holen, wenn keiner mitgegeben wurde (Wander-Modul). */
  const locate = useCallback(async (): Promise<GeoPoint | null> => {
    if (!navigator.geolocation) return null;
    setStatus("locating");
    return new Promise<GeoPoint | null>(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const point = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          setGpsOrigin(point);
          resolve(point);
        },
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 }
      );
    });
  }, []);

  /** Overpass fragen – nur auf Klick, nie automatisch (Rate-Limit). */
  const search = useCallback(async () => {
    const point = origin ?? (await locate());
    if (!point) {
      setStatus("noLocation");
      return;
    }
    setStatus("loading");
    setOpenId(null);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const query = bike
        ? bicycleRoutesQuery(point.lat, point.lon, radiusM)
        : hikingRoutesQuery(point.lat, point.lon, radiusM);
      const res = await fetchOverpass(
        `data=${encodeURIComponent(query)}`,
        controller.signal
      );
      const json: unknown = await res.json();
      const views: RouteView[] = [];
      parseHikingRoutes(json).forEach(route => {
        const nearest = nearestRoutePoint(route.segments, point.lat, point.lon);
        if (!nearest) return;
        views.push({
          route,
          distanceM: nearest.distanceM,
          entry: nearest.point,
          sectionLengthM: routeLengthMeters(route.segments),
        });
      });
      views.sort((a, b) => a.distanceM - b.distanceM);
      setRoutes(views);
      setStatus("ready");
    } catch {
      if (controller.signal.aborted) return;
      setStatus("failed");
    }
  }, [bike, locate, origin, radiusM]);

  const subtitle = placeName ? tn.subtitleAtPlace(placeName) : tn.subtitle;

  return (
    <section
      className={cn("rounded-xl border border-border bg-card p-4", className)}
      aria-label={tn.sectionAria}
    >
      <div className="mb-1 flex items-center gap-2">
        <TitleIcon className="h-4 w-4 text-primary" aria-hidden="true" />
        <h3 className="font-serif text-lg font-semibold">{tn.title}</h3>
      </div>
      <p className="mb-3 text-sm text-muted-foreground">{subtitle}</p>

      <div
        className="mb-3 flex flex-wrap items-center gap-2"
        role="group"
        aria-label={tn.radiusGroupAria}
      >
        <span className="text-sm text-muted-foreground">{tn.radiusLabel}</span>
        {HIKING_SEARCH_RADII_M.map(value => (
          <button
            key={value}
            type="button"
            onClick={() => setRadiusM(value)}
            aria-pressed={radiusM === value}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              radiusM === value
                ? "border-primary bg-accent text-accent-foreground"
                : "border-border text-muted-foreground hover:border-primary/40"
            )}
          >
            {tn.radiusOption(Math.round(value / 1000))}
          </button>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => void search()}
        disabled={status === "loading" || status === "locating"}
      >
        {(status === "loading" || status === "locating") && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        {status === "ready" || status === "failed"
          ? tn.searchAgain
          : tn.searchButton}
      </Button>

      {status === "locating" && (
        <p className="mt-3 text-sm text-muted-foreground">{tn.locating}</p>
      )}
      {status === "loading" && (
        <div
          className="mt-3 space-y-2"
          aria-busy="true"
          aria-label={tn.loading}
        >
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      )}
      {status === "noLocation" && (
        <p className="mt-3 text-sm text-muted-foreground">{tn.noLocation}</p>
      )}
      {status === "failed" && (
        <p className="mt-3 text-sm text-muted-foreground">{tn.loadFailed}</p>
      )}
      {status === "ready" && routes.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">
          {tn.empty(Math.round(radiusM / 1000))}
        </p>
      )}

      {status === "ready" && routes.length > 0 && origin && (
        <>
          <div
            className="mt-3 flex flex-wrap items-center gap-2"
            role="group"
            aria-label={tn.lengthFilterAria}
          >
            {(
              [
                ["alle", tn.lengthAll],
                ["kurz", tn.lengthShort],
                ["mittel", tn.lengthMedium],
                ["lang", tn.lengthLong],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setLengthFilter(value)}
                aria-pressed={lengthFilter === value}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm transition-colors",
                  lengthFilter === value
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm font-medium">
            {tn.resultCount(filteredRouteList.length)}
          </p>
          <ul className="mt-2 space-y-3">
            {filteredRouteList.map(({ view, distanceM, onFoot }) => {
              const { route } = view;
              const title =
                route.name ??
                (route.ref ? tn.routeWithRef(route.ref) : tn.unnamed);
              const lengthM = route.distanceM;
              const minutes =
                lengthM === undefined
                  ? null
                  : bike
                    ? cyclingTimeMinutes({ lengthM, ascentM: route.ascentM })
                    : walkingTimeMinutes({
                        lengthM,
                        ascentM: route.ascentM,
                        descentM: route.descentM,
                      });
              // Wander- (iwn…lwn) und Velo-Netze (icn…lcn) haben je eigene
              // Schlüssel – der Blick in die Landkarte bleibt derselbe.
              const networkMap = tn.network as Record<string, string>;
              const networkLabel =
                route.network && route.network in networkMap
                  ? networkMap[route.network]
                  : null;
              const open = openId === route.id;
              return (
                <li
                  key={route.id}
                  className="rounded-lg border border-border/70 bg-background p-3"
                >
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="font-medium">{title}</span>
                    {route.name && route.ref && (
                      <span className="text-xs text-muted-foreground">
                        {tn.routeWithRef(route.ref)}
                      </span>
                    )}
                    {networkLabel && (
                      <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs">
                        {networkLabel}
                      </span>
                    )}
                    {route.sacScale && (
                      <span
                        className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground"
                        title={sacScaleDescription(route.sacScale, lang)}
                      >
                        {sacScaleLabel(route.sacScale, lang)}
                      </span>
                    )}
                  </div>

                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm sm:grid-cols-4">
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        {tn.distanceLabel}
                      </dt>
                      <dd className="font-medium">
                        {onFoot
                          ? t.common.distanceOnPath(
                              formatDistance(distanceM, lang)
                            )
                          : formatDistance(distanceM, lang)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        {tn.lengthLabel}
                      </dt>
                      <dd className="font-medium">
                        {lengthM === undefined
                          ? tn.unknown
                          : formatDistance(lengthM, lang)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        {tn.durationLabel}
                      </dt>
                      <dd className="font-medium">
                        {minutes === null
                          ? tn.unknown
                          : formatWalkingTime(minutes)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        {tn.ascentLabel}
                      </dt>
                      <dd className="font-medium">
                        {route.ascentM === undefined
                          ? tn.unknown
                          : `${Math.round(route.ascentM)} m`}
                      </dd>
                    </div>
                  </dl>

                  {minutes !== null && route.ascentM === undefined && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {tn.durationFlatOnly}
                    </p>
                  )}
                  {route.sacScale && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {sacScaleDescription(route.sacScale, lang)}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : route.id)}
                      aria-expanded={open}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      <MapIcon className="h-4 w-4" aria-hidden="true" />
                      {open ? tn.hideMap : tn.showMap}
                    </button>
                    <a
                      href={directionsUrl(
                        view.entry.lat,
                        view.entry.lon,
                        defaultProvider()
                      )}
                      onClick={event => {
                        event.preventDefault();
                        openDirections(view.entry.lat, view.entry.lon);
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={tn.navAria(title)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      <Navigation className="h-4 w-4" aria-hidden="true" />
                      {tn.navButton}
                    </a>
                    {route.website && (
                      <a
                        href={route.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {tn.websiteLink}
                      </a>
                    )}
                  </div>

                  {open && (
                    <>
                      <RouteMap
                        segments={route.segments}
                        origin={origin}
                        label={tn.mapAria(title)}
                      />
                      <p className="mt-2 text-xs text-muted-foreground">
                        {tn.sectionLength(
                          formatDistance(view.sectionLengthM, lang),
                          Math.round(radiusM / 1000)
                        )}
                      </p>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      <p className="mt-3 text-xs text-muted-foreground">{tn.durationNote}</p>
      <p className="mt-1.5 text-xs text-muted-foreground">{tn.footnote}</p>
    </section>
  );
}
