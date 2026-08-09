/**
 * Karte der Plätze & Reisen: alle gespeicherten Zeltplatz-Favoriten als Pins
 * auf der Karte (über die Karten-Maschine, siehe lib/mapEngine). Im Popup steht
 * neben dem Dossier-Link, wie viele Übernachtungen laut Reise-Tagebuch an
 * diesem Platz stattfanden (Verknüpfung über spotId oder Orts-Namen,
 * case-insensitiv – gleiche Idee wie computeTripStats).
 *
 * Zusätzlich erscheinen die gespeicherten Zelt-Finder-Ziele (Zelt, Duschen …)
 * als eigene bernsteinfarbene Pins – mit «Anpeilen»-Link in den Zelt-Finder.
 *
 * Basis-Layer umschaltbar: «Karte» (OpenStreetMap) oder «Satellit» (Esri
 * World Imagery). Die Wahl wird in localStorage gemerkt und der Layer beim
 * Umschalten getauscht, ohne die Karte neu aufzubauen – Ausschnitt, Pins und
 * offene Popups bleiben erhalten.
 *
 * Zuschaltbarer Entdecker-Layer: auf Wunsch fragt die Karte die Overpass-API
 * nach Campingplätzen (tourism=camp_site) im aktuellen Ausschnitt – bewusst
 * nie automatisch beim Verschieben (Overpass ist rate-limitiert), sondern nur
 * per Klick auf «In diesem Ausschnitt suchen». Gefundene Plätze lassen sich
 * direkt als Favorit übernehmen.
 *
 * Klick auf eine freie Kartenstelle (nicht auf Marker/Popup) öffnet einen
 * kleinen Dialog «Favorit hier anlegen?» mit Pflicht-Namensfeld – Bestätigen
 * legt den Platz über den spots-Router an. Karten-Panning löst dank Leaflet
 * kein click-Event aus, auf Touch-Geräten genügt der normale Tap.
 *
 * Tagebuch-Einträge mit reinem Freitext-Ort haben keine Koordinaten und
 * erscheinen deshalb nicht als eigene Pins.
 *
 * Pin-Gruppierung: Liegen mehrere Pins (Favoriten, Ziele, Beobachtungen,
 * OSM-Funde) auf der aktuellen Zoomstufe näher als ~48 Pixel beieinander,
 * fasst die eigene leichte Cluster-Logik (lib/mapCluster) sie zu einem
 * Zahlen-Kreis zusammen – eingefärbt nach dem dominanten Pin-Typ, neutral
 * bei Gleichstand. Klick auf den Kreis zoomt auf die enthaltenen Pins.
 * Nach jedem Zoom wird neu gruppiert (der Marker-Layer wird komplett neu
 * aufgebaut – bei < 500 Pins unkritisch); reines Verschieben ändert die
 * Pixel-Abstände nicht und braucht deshalb keinen Neuaufbau.
 *
 * Ebenen-Filter: Checkbox-Chips blenden die Pin-Ebenen (Favoriten, Ziele,
 * Beobachtungen, OSM-Funde, Feuerstellen, Familie, Ausflüge) einzeln aus. Die
 * Wahl liegt in localStorage (campmesser.mapLayers), Standard alle an; der
 * Filter greift vor dem Clustern, die Legende zeigt nur eingeblendete Ebenen.
 *
 * Ebene «Feuerstellen» (#247): offizielle Feuer- und Grillstellen aus OSM
 * (leisure=firepit bzw. amenity=bbq, beides getrennt gekennzeichnet). Sie
 * holt ihre Pins ebenfalls über Overpass und ist deshalb standardmässig AUS –
 * das Einschalten des Chips ist der ausdrückliche Klick, der die Suche im
 * aktuellen Ausschnitt auslöst; «In diesem Ausschnitt suchen» lädt danach
 * alle eingeschalteten Overpass-Ebenen neu. Das Popup nennt Typ, gepflegte
 * Eigenschaften (gedeckt, Brennholz, Trinkwasser), die Navigation und
 * verlinkt die Waldbrandgefahr-Anzeige im Wetter-Modul.
 *
 * Ebene «Familie» (#248): Spielplätze (leisure=playground) und offizielle
 * Badeplätze (leisure=bathing_place/beach_resort, natural=beach mit Zugang) –
 * bewusst EINE Ebene statt zwei, weil die Ebenen-Leiste sonst überquillt und
 * beide dieselbe Frage beantworten. Unterschieden werden sie am Pin-Umriss
 * (Rutschbahn bzw. Wellen) und im Popup. Sonst gilt dasselbe wie bei den
 * Feuerstellen: Standard aus, Chip-Klick sucht, Popup mit Angaben und
 * Navigation.
 *
 * Ebene «Ausflüge» (#271): die Ausflugsziele aus der eigenen
 * Ausflugfinder-App, geholt über den tRPC-Router `excursions` (serverseitig,
 * mit Zwischenspeicher – der Zugriffsschlüssel bleibt auf dem Server). Ist
 * die Anbindung nicht eingerichtet, gibt es die Ebene gar nicht: kein Chip,
 * keine Pins, keine Fehlermeldung. Das Popup zeigt Titelbild, Name,
 * Kategorien, Kostenstufe und Region, dazu «Details» (Beschreibung,
 * Hinweise, Öffnungszeiten, Website) und die Anreise-Navigation. Der Aufruf
 * `/karte?ausflug=<id>` aus dem Platz-Dossier fährt den Pin an und öffnet
 * sein Popup.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fmtDayMonth } from "@/lib/dateFormat";
import { useTodayIso } from "@/lib/useTodayIso";
import { tripDisplayName } from "@shared/tripName";
import { Link, useLocation } from "wouter";
import {
  Baby,
  Compass,
  FerrisWheel,
  Flame,
  LocateFixed,
  Ruler,
  Map as MapIcon,
  MapPin,
  PawPrint,
  Satellite,
  Search,
  Route,
  Star,
  Tent,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import {
  defaultProvider,
  directionsUrl,
  openDirections,
} from "@/lib/directions";
import { readOverpassCache, writeOverpassCache } from "@/lib/overpassStore";
import {
  OVERPASS_MIN_ZOOM,
  fetchOverpass,
  combinedBboxQuery,
  type OverpassLayer,
  parseCampsites,
  parseFamilyPlaces,
  parseFirepits,
  type OsmCampsite,
  type OsmFamilyPlace,
  type OsmFirepit,
} from "@/lib/overpass";
import {
  loadLayerVisibility,
  loadMapLayer,
  storeLayerVisibility,
  storeMapLayer,
  type MapLayerKind,
  type MapLayerVisibility,
} from "@/lib/mapLayers";
import {
  CLUSTER_THRESHOLD_PX,
  clusterPoints,
  projectToPixels,
} from "@/lib/mapCluster";
import {
  createMap,
  latLngBounds,
  type LatLngTuple,
  type LayerGroupObject,
  type MapEngine,
  type MarkerObject,
} from "@/lib/mapEngine";
import { useMapConfig } from "@/hooks/useMapConfig";
import { type TentFinderTarget } from "@/lib/tentFinderTargets";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";
import { LOCALE_TAGS, pick } from "@shared/i18n";
import {
  SAVED_PLACE_COLOR_HEX,
  SAVED_PLACE_COLOR_LABELS,
  SAVED_PLACE_COLORS,
  SAVED_PLACE_NOTE_MAX_LENGTH,
  type SavedPlaceColor,
} from "@shared/savedPlaces";
import { distanceMeters } from "@shared/geo";
import { costLevelSymbols, type Excursion } from "@shared/excursions";
import {
  type SpotPin,
  type SavedPlacePin,
  type SightingPin,
  FALLBACK_CENTER,
  FALLBACK_ZOOM,
  spotIcon,
  targetIconFor,
  campsiteIcon,
  sightingIcon,
  excursionIcon,
  firepitIcon,
  familyIconFor,
  savedPlaceIconFor,
  type PinKind,
  clusterColor,
  measureLabelIcon,
  clusterIcon,
  isNearFavorite,
} from "@/components/map/mapPins";

export default function SpotsMap({
  spots,
  targets,
  sightings,
  excursions,
  excursionsAvailable,
  focusExcursionId,
  nightsBySpotId,
  savedPlaces,
  stageRoutes = [],
  focusPoint = null,
}: {
  spots: SpotPin[];
  targets: TentFinderTarget[];
  sightings: SightingPin[];
  excursions: Excursion[];
  /** Ist die Ausflugfinder-Anbindung eingerichtet? Sonst gibt es die Ebene nicht. */
  excursionsAvailable: boolean;
  /** Ausflug, den das Platz-Dossier verlinkt hat (`/karte?ausflug=…`). */
  focusExcursionId: string | null;
  nightsBySpotId: Map<number, number>;
  /** Merkorte (#537). */
  savedPlaces: SavedPlacePin[];
  /**
   * Etappen-Routen der Rundreisen (#596): pro Reise die Kette ihrer
   * Etappen mit Koordinaten – gezeichnet als gestrichelte Linie auf der
   * eigenen, abschaltbaren Ebene «Routen».
   */
  stageRoutes?: { tripId: number; name: string; points: [number, number][] }[];
  /** Aus der Merkorte-Liste (#563) angefahrener Punkt; nonce = jeder Klick. */
  focusPoint?: { lat: number; lon: number; nonce: number } | null;
}) {
  const { lang, t } = useI18n();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<MapEngine | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const maps = useMapConfig();
  const markersRef = useRef<LayerGroupObject | null>(null);
  const didFitRef = useRef(false);
  // Aus dem Platz-Dossier angesteuerter Ausflug: einmal anfahren, dann öffnet
  // der Marker-Aufbau sein Popup. Die Ref merkt sich die bereits erledigte Id,
  // damit ein späteres Neu-Gruppieren nicht wieder hinspringt.
  const didFocusRef = useRef<string | null>(null);
  const popupJustClosedRef = useRef(0);
  // «Mein Standort»: blauer Punkt + Genauigkeitskreis, bei jedem Klick ersetzt
  const locateLayerRef = useRef<LayerGroupObject | null>(null);
  const [locating, setLocating] = useState(false);
  // Mess-Modus: zwei Punkte antippen → Luftlinie mit Distanz-Label
  const [measureOn, setMeasureOn] = useState(false);
  const measureOnRef = useRef(false);
  const measurePointsRef = useRef<LatLngTuple[]>([]);
  const measureLayerRef = useRef<LayerGroupObject | null>(null);
  const measureClickRef = useRef<(point: LatLngTuple) => void>(() => {});

  // Karten-Klick auf freie Stelle: Vorschlag für einen neuen Favoriten
  // – oder seit #537 wahlweise einen Merkort (Wunschziel mit Pin-Farbe)
  const [proposed, setProposed] = useState<{ lat: number; lon: number } | null>(
    null
  );
  const [newName, setNewName] = useState("");
  const [createKind, setCreateKind] = useState<"favorit" | "merkort">(
    "favorit"
  );
  const [newNote, setNewNote] = useState("");
  const [newColor, setNewColor] = useState<SavedPlaceColor>("red");
  /**
   * Merkort → Etappe (#562): der Merkort, der gerade an eine Reise
   * gehängt wird – der Dialog fragt nur noch «zu welcher?».
   */
  const [stagePlace, setStagePlace] = useState<SavedPlacePin | null>(null);
  const [stageBusy, setStageBusy] = useState(false);
  const stageToday = useTodayIso();
  const stageTripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled: stagePlace !== null,
  });
  /** Geplante und laufende Reisen – Vergangenes braucht keine Etappe mehr. */
  const stageTrips = (stageTripsQuery.data ?? []).filter(
    trip => trip.endDate >= stageToday
  );
  const addStageToTrip = async (
    trip: { id: number; startDate: string; endDate: string },
    label: string
  ) => {
    if (!stagePlace) return;
    setStageBusy(true);
    try {
      // Sinnvoller Vorschlag wie im Etappen-Formular: Die neue Etappe
      // beginnt, wo die letzte endet – angepasst wird in der Reise.
      const stops = await utils.client.trips.stops.list.query({
        tripId: trip.id,
      });
      const last = stops[stops.length - 1];
      const from = last ? last.endDate : trip.startDate;
      const to = trip.endDate < from ? from : trip.endDate;
      await utils.client.trips.stops.add.mutate({
        tripId: trip.id,
        name: stagePlace.name,
        latitude: stagePlace.latitude,
        longitude: stagePlace.longitude,
        startDate: from,
        endDate: to,
      });
      void utils.trips.stops.list.invalidate({ tripId: trip.id });
      toast.success(t.mapView.stageAdded(label));
      setStagePlace(null);
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : t.common.actionFailed
      );
    } finally {
      setStageBusy(false);
    }
  };

  // Basis-Layer «Karte / Satellit» – Wahl bleibt in localStorage erhalten
  const [layerKind, setLayerKind] = useState<MapLayerKind>(loadMapLayer);

  // Aus der Merkorte-Liste (#563) angeklickt: Karte zum Stern fahren.
  useEffect(() => {
    if (!focusPoint || !mapReady) return;
    engineRef.current?.setView([focusPoint.lat, focusPoint.lon], 13);
  }, [focusPoint, mapReady]);

  // Ein-/ausblendbare Pin-Ebenen (Favoriten/Ziele/Beobachtungen/OSM) –
  // Wahl bleibt in localStorage erhalten, Standard: alle an. Der Filter
  // greift VOR der Cluster-Rechnung: ausgeblendete Pins zählen nicht mit.
  const [layerVisibility, setLayerVisibility] =
    useState<MapLayerVisibility>(loadLayerVisibility);

  const toggleLayer = useCallback((key: keyof MapLayerVisibility) => {
    setLayerVisibility(prev => {
      const next = { ...prev, [key]: !prev[key] };
      storeLayerVisibility(next);
      return next;
    });
  }, []);

  // Entdecker-Layer: Zustand der Overpass-Suche (Standard AUS)

  const [campsites, setCampsites] = useState<OsmCampsite[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverError, setDiscoverError] = useState(false);
  const [needsZoom, setNeedsZoom] = useState(false);
  const [searched, setSearched] = useState(false);
  const [moved, setMoved] = useState(false);

  // Ebene «Feuerstellen» (#247): eigene Overpass-Abfrage, eigener Zustand.
  // Sie hängt am Ebenen-Chip statt an einem weiteren Knopf oben – Einschalten
  // sucht sofort im aktuellen Ausschnitt, Ausschalten räumt alles weg.
  const [firepits, setFirepits] = useState<OsmFirepit[]>([]);
  const [firepitLoading, setFirepitLoading] = useState(false);
  const [firepitError, setFirepitError] = useState(false);
  const [firepitNeedsZoom, setFirepitNeedsZoom] = useState(false);
  const [firepitSearched, setFirepitSearched] = useState(false);
  /** Eine Abfrage, ein Abbruch (#339). */
  const overpassAbortRef = useRef<AbortController | null>(null);

  // Ebene «Familie» (#248): Spiel- und Badeplätze, gleiches Muster wie oben.
  const [familyPlaces, setFamilyPlaces] = useState<OsmFamilyPlace[]>([]);
  const [familyLoading, setFamilyLoading] = useState(false);
  const [familyError, setFamilyError] = useState(false);
  const [familyNeedsZoom, setFamilyNeedsZoom] = useState(false);
  const [familySearched, setFamilySearched] = useState(false);

  // Aktuelle Zoomstufe für die Pin-Gruppierung: nach jedem Zoom werden die
  // Cluster neu berechnet. Verschieben ändert die Pixel-Abstände nicht
  // (map.project ist unabhängig vom Ausschnitt), darum reicht zoomend.
  const [clusterZoom, setClusterZoom] = useState(FALLBACK_ZOOM);

  // Die Wahl «Karte/Satellit» muss beim Aufbau schon feststehen
  const layerKindRef = useRef<MapLayerKind>(layerKind);
  layerKindRef.current = layerKind;

  /** Karte auf die aktuelle Position zentrieren (blauer Punkt + Genauigkeit). */
  const locateMe = useCallback(
    (silent = false) => {
      const map = engineRef.current;
      if (!map || !navigator.geolocation) {
        if (!silent) toast.error(t.mapView.locateFailed);
        return;
      }
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        pos => {
          setLocating(false);
          const { latitude, longitude, accuracy } = pos.coords;
          const m = engineRef.current;
          if (!m) return;
          if (!locateLayerRef.current) {
            locateLayerRef.current = m.layerGroup();
          }
          const locateLayer = locateLayerRef.current;
          locateLayer.clear();
          m.circle([latitude, longitude], {
            radius: Math.min(accuracy || 30, 500),
            color: "#3b82f6",
            weight: 1,
            fillColor: "#3b82f6",
            fillOpacity: 0.15,
            layer: locateLayer,
          });
          m.circleMarker([latitude, longitude], {
            radius: 6,
            color: "#fff",
            weight: 2,
            fillColor: "#2563eb",
            fillOpacity: 1,
            layer: locateLayer,
          });
          m.setView([latitude, longitude], Math.max(m.getZoom(), 14));
        },
        () => {
          setLocating(false);
          if (!silent) toast.error(t.mapView.locateFailed);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    },
    [t.mapView.locateFailed]
  );

  // Karte einmalig aufbauen und beim Verlassen sauber abbauen. Gebaut wird
  // erst, wenn feststeht, welcher Kartendienst zeichnet – sonst würde die
  // Karte gleich wieder weggeworfen.
  useEffect(() => {
    if (!containerRef.current || engineRef.current || !maps.ready) return;
    let cancelled = false;
    void createMap(containerRef.current, {
      center: FALLBACK_CENTER,
      zoom: FALLBACK_ZOOM,
      baseKind: layerKindRef.current,
      config: maps.config,
    }).then(engine => {
      if (cancelled) {
        engine.destroy();
        return;
      }
      engineRef.current = engine;
      markersRef.current = engine.layerGroup();
      // Zoomstufe für die Pin-Gruppierung nachführen (löst den Neuaufbau aus)
      engine.onZoom(zoom => setClusterZoom(zoom));
      // Klick auf freie Kartenstelle → Dialog «Favorit hier anlegen?».
      // Marker schlucken ihre Klicks selbst.
      engine.onClick(event => {
        const point: LatLngTuple = [event.latlng.lat, event.latlng.lng];
        // Im Mess-Modus sammeln Klicks Messpunkte statt Favoriten vorzuschlagen
        if (measureOnRef.current) {
          measureClickRef.current(point);
          return;
        }
        setProposed({ lat: event.latlng.lat, lon: event.latlng.lng });
      });
      setMapReady(true);
    });
    return () => {
      cancelled = true;
      overpassAbortRef.current?.abort();
      overpassAbortRef.current?.abort();
      overpassAbortRef.current?.abort();
      engineRef.current?.destroy();
      engineRef.current = null;
      markersRef.current = null;
      setMapReady(false);
    };
  }, [maps.ready, maps.config]);

  // Darstellung umschalten. Bei Google ist das der Kartentyp, bei
  // OpenStreetMap ein anderer Kachel-Layer – die Maschine weiss, welcher.
  useEffect(() => {
    if (!mapReady) return;
    engineRef.current?.setBaseKind(layerKind);
  }, [layerKind, mapReady]);

  /** Umschalter «Karte / Satellit»: Wahl merken und Layer tauschen. */
  const switchLayer = useCallback((kind: MapLayerKind) => {
    setLayerKind(kind);
    storeMapLayer(kind);
  }, []);

  /**
   * EINE Abfrage für alle gewünschten Ebenen (#339).
   *
   * VORHER WAREN ES DREI, gleichzeitig an denselben Spiegel: Zeltplätze,
   * Feuerstellen und Familien-Orte. Overpass begrenzt pro IP – zwei davon
   * liefen ins Rate-Limit, warteten den Timeout ab und begannen beim
   * nächsten Spiegel von vorn. Aus einer Suche wurden bis zu neun
   * Anfragen, und die Feuerstellen kamen als Letzte.
   *
   * DAZU EIN ZWISCHENSPEICHER: Wer den Ausschnitt verschiebt und
   * zurückkommt, bekommt die Antwort sofort statt sie neu zu holen. Der
   * Ausschnitt wird dafür auf ein Raster gerundet (`shared/overpassCache.ts`),
   * sonst wäre jeder Kartenschubs ein neuer Schlüssel.
   */
  const searchLayers = useCallback(async (layers: OverpassLayer[]) => {
    const map = engineRef.current;
    if (!map || layers.length === 0) return;
    setMoved(false);
    const want = {
      campsites: layers.includes("campsites"),
      firepits: layers.includes("firepits"),
      family: layers.includes("family"),
    };

    if (map.getZoom() < OVERPASS_MIN_ZOOM) {
      if (want.campsites) {
        setNeedsZoom(true);
        setDiscoverError(false);
      }
      if (want.firepits) {
        setFirepitNeedsZoom(true);
        setFirepitError(false);
      }
      if (want.family) {
        setFamilyNeedsZoom(true);
        setFamilyError(false);
      }
      return;
    }

    if (want.campsites) {
      setNeedsZoom(false);
      setDiscoverError(false);
      setDiscoverLoading(true);
    }
    if (want.firepits) {
      setFirepitNeedsZoom(false);
      setFirepitError(false);
      setFirepitLoading(true);
    }
    if (want.family) {
      setFamilyNeedsZoom(false);
      setFamilyError(false);
      setFamilyLoading(true);
    }

    /** Die Antwort auf die eingeschalteten Ebenen verteilen. */
    const apply = (json: unknown) => {
      if (want.campsites) {
        setCampsites(parseCampsites(json));
        setSearched(true);
        setDiscoverLoading(false);
      }
      if (want.firepits) {
        setFirepits(parseFirepits(json));
        setFirepitSearched(true);
        setFirepitLoading(false);
      }
      if (want.family) {
        setFamilyPlaces(parseFamilyPlaces(json));
        setFamilySearched(true);
        setFamilyLoading(false);
      }
    };

    const b = map.getBounds();
    const cached = readOverpassCache(b, layers);
    if (cached) {
      apply(cached);
      return;
    }

    overpassAbortRef.current?.abort();
    const controller = new AbortController();
    overpassAbortRef.current = controller;
    try {
      const res = await fetchOverpass(
        `data=${encodeURIComponent(
          combinedBboxQuery(layers, b.south, b.west, b.north, b.east)
        )}`,
        controller.signal
      );
      const json: unknown = await res.json();
      writeOverpassCache(b, layers, json);
      apply(json);
    } catch {
      if (controller.signal.aborted) return;
      if (want.campsites) {
        setDiscoverLoading(false);
        setDiscoverError(true);
      }
      if (want.firepits) {
        setFirepitLoading(false);
        setFirepitError(true);
      }
      if (want.family) {
        setFamilyLoading(false);
        setFamilyError(true);
      }
    }
  }, []);

  const searchCampsites = useCallback(
    () => searchLayers(["campsites"]),
    [searchLayers]
  );
  const searchFirepits = useCallback(
    () => searchLayers(["firepits"]),
    [searchLayers]
  );
  const searchFamilyPlaces = useCallback(
    () => searchLayers(["family"]),
    [searchLayers]
  );

  /** «In diesem Ausschnitt suchen»: alle eingeschalteten Overpass-Ebenen neu laden. */
  const searchHere = useCallback(() => {
    const layers: OverpassLayer[] = [];
    if (layerVisibility.campsites) layers.push("campsites");
    if (layerVisibility.firepits) layers.push("firepits");
    if (layerVisibility.family) layers.push("family");
    void searchLayers(layers);
    setMoved(false);
  }, [
    layerVisibility.campsites,
    layerVisibility.firepits,
    layerVisibility.family,
    searchLayers,
  ]);

  const clearCampsites = useCallback(() => {
    overpassAbortRef.current?.abort();
    setCampsites([]);
    setDiscoverLoading(false);
    setDiscoverError(false);
    setNeedsZoom(false);
    setSearched(false);
    setMoved(false);
  }, []);

  const clearFirepits = useCallback(() => {
    overpassAbortRef.current?.abort();
    setFirepits([]);
    setFirepitLoading(false);
    setFirepitError(false);
    setFirepitNeedsZoom(false);
    setFirepitSearched(false);
  }, []);

  const clearFamilyPlaces = useCallback(() => {
    overpassAbortRef.current?.abort();
    setFamilyPlaces([]);
    setFamilyLoading(false);
    setFamilyError(false);
    setFamilyNeedsZoom(false);
    setFamilySearched(false);
  }, []);

  /**
   * Ebenen-Chip antippen. Die Ebenen «Feuerstellen» und «Familie» holen ihre
   * Pins über Overpass – Einschalten löst deshalb sofort eine Suche im
   * aktuellen Ausschnitt aus, Ausschalten bricht ab und räumt weg.
   */
  const toggleLayerChip = useCallback(
    (key: keyof MapLayerVisibility) => {
      const willBeOn = !layerVisibility[key];
      toggleLayer(key);
      if (key === "firepits") {
        if (willBeOn) void searchFirepits();
        else clearFirepits();
      } else if (key === "family") {
        if (willBeOn) void searchFamilyPlaces();
        else clearFamilyPlaces();
      } else if (key === "campsites") {
        if (willBeOn) void searchCampsites();
        else clearCampsites();
      }
    },
    [
      clearCampsites,
      clearFamilyPlaces,
      clearFirepits,
      layerVisibility,
      searchCampsites,
      searchFamilyPlaces,
      searchFirepits,
      toggleLayer,
    ]
  );

  // Kartenbewegung merken: statt automatisch neu zu laden, zeigen wir den Such-Button
  const overpassLayersOn =
    layerVisibility.campsites ||
    layerVisibility.firepits ||
    layerVisibility.family;
  useEffect(() => {
    const map = engineRef.current;
    if (!map) return;
    const off = map.onMove(() => searchHere());
    return off;
  }, [searchHere, mapReady]);

  // Verlinkter Ausflug: hinfahren, sobald die Ziele geladen sind. Der
  // Zoom-Wechsel gruppiert neu, danach steht der Pin einzeln da und der
  // Marker-Aufbau unten öffnet sein Popup.
  useEffect(() => {
    const map = engineRef.current;
    if (!map || !focusExcursionId || didFocusRef.current === focusExcursionId) {
      return;
    }
    const target = excursions.find(e => e.id === focusExcursionId);
    if (!target) return;
    // Der erste Einpass-Vorgang darf den Ausschnitt nicht wieder wegziehen
    didFitRef.current = true;
    map.setView([target.latitude, target.longitude], 14);
  }, [excursions, focusExcursionId]);

  // Bereits übernommene OSM-Plätze nicht doppelt zeigen – dort steht nach dem
  // Refetch der grüne Favoriten-Pin.
  const visibleCampsites = useMemo(
    () => campsites.filter(site => !isNearFavorite(site, spots)),
    [campsites, spots]
  );

  // Alle Pins (Favoriten, Ziele, Beobachtungen, OSM-Funde) nachführen und
  // pro Zoomstufe gruppieren: nahe Pins werden zu einem Zahlen-Kreis
  // zusammengefasst, Klick darauf zoomt auf die enthaltenen Pins.
  useEffect(() => {
    const engine = engineRef.current;
    const layer = markersRef.current;
    if (!engine || !layer || !mapReady) return;
    layer.clear();

    const createSpotMarker = (spot: SpotPin): MarkerObject => {
      const marker = engine.marker([spot.latitude, spot.longitude], {
        icon: spotIcon,
        title: spot.name,
        layer,
      });
      // Popup-Inhalt per DOM aufbauen: Platzname ist Nutzertext (kein innerHTML)
      const popup = document.createElement("div");
      popup.className =
        "flex flex-col gap-1.5 overflow-y-auto max-h-[50vh] pr-1 pb-1";
      const name = document.createElement("p");
      name.className = "text-[15px] font-bold leading-tight text-slate-800";
      name.textContent = spot.name;
      popup.appendChild(name);
      const nights = nightsBySpotId.get(spot.id) ?? 0;
      if (nights > 0) {
        const stat = document.createElement("p");
        stat.className = "text-xs";
        stat.textContent = t.mapView.nightsHere(nights);
        popup.appendChild(stat);
      }
      const link = document.createElement("a");
      link.href = `/zeltplaetze/${spot.id}`;
      link.textContent = t.mapView.toDossier;
      link.className =
        "mt-1.5 flex w-full items-center justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors no-underline";
      link.addEventListener("click", event => {
        event.preventDefault();
        navigate(`/zeltplaetze/${spot.id}`);
      });
      popup.appendChild(link);
      // Anreise-Route: externer Karten-Link (Apple/Google je nach Gerät)
      const route = document.createElement("a");
      route.href = directionsUrl(
        spot.latitude,
        spot.longitude,
        defaultProvider()
      );
      // Klick geht über den Dialog: Er fragt beim ersten Mal nach der
      // Karten-App. Das href bleibt als Rückfall stehen, damit
      // «Link kopieren» und Mittelklick weiter funktionieren.
      route.addEventListener("click", event => {
        event.preventDefault();
        openDirections(spot.latitude, spot.longitude);
      });
      route.target = "_blank";
      route.rel = "noopener noreferrer";
      route.textContent = t.mapView.routeLink;
      route.className =
        "mt-1.5 flex w-full items-center justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors no-underline";
      popup.appendChild(route);
      marker.bindPopup(popup);
      return marker;
    };

    // Zelt-Finder-Ziele als eigene Pins – Popup mit «Anpeilen»-Link
    const createTargetMarker = (tgt: TentFinderTarget): MarkerObject => {
      const marker = engine.marker([tgt.lat, tgt.lon], {
        icon: targetIconFor(tgt.icon),
        title: tgt.name,
        layer,
      });
      const popup = document.createElement("div");
      popup.className =
        "flex flex-col gap-1.5 overflow-y-auto max-h-[50vh] pr-1 pb-1";
      const name = document.createElement("p");
      name.className = "text-[15px] font-bold leading-tight text-slate-800";
      name.textContent = tgt.name;
      popup.appendChild(name);
      const kind = document.createElement("p");
      kind.className = "text-xs";
      kind.textContent = t.mapView.targetKind;
      popup.appendChild(kind);
      const href = `/zeltfinder?target=${encodeURIComponent(tgt.id)}`;
      const link = document.createElement("a");
      link.href = href;
      link.textContent = t.mapView.aimTarget;
      link.className = "text-sm font-medium underline";
      link.addEventListener("click", event => {
        event.preventDefault();
        navigate(href);
      });
      popup.appendChild(link);
      marker.bindPopup(popup);
      return marker;
    };

    // Natur-Beobachtungen mit Koordinaten als eigene (violette) Pins –
    // Popup mit Titel und Beobachtungs-Datum.
    const createSightingMarker = (sighting: SightingPin): MarkerObject => {
      const marker = engine.marker([sighting.lat, sighting.lon], {
        icon: sightingIcon,
        title: sighting.title,
        layer,
      });
      const popup = document.createElement("div");
      popup.className =
        "flex flex-col gap-1.5 overflow-y-auto max-h-[50vh] pr-1 pb-1";
      const name = document.createElement("p");
      name.className = "text-[15px] font-bold leading-tight text-slate-800";
      name.textContent = sighting.title;
      popup.appendChild(name);
      const kind = document.createElement("p");
      kind.className = "text-xs";
      kind.textContent = `${t.mapView.sightingKind} · ${sighting.dateLabel}`;
      popup.appendChild(kind);
      marker.bindPopup(popup);
      return marker;
    };

    // Entdeckte OSM-Campingplätze als eigene (blaue) Pins
    const createCampsiteMarker = (site: OsmCampsite): MarkerObject => {
      const displayName = site.name ?? t.mapView.osmFallbackName;
      const marker = engine.marker([site.lat, site.lon], {
        icon: campsiteIcon,
        title: displayName,
        layer,
      });
      const popup = document.createElement("div");
      popup.className =
        "flex flex-col gap-1.5 overflow-y-auto max-h-[50vh] pr-1 pb-1";
      const name = document.createElement("p");
      name.className = "text-[15px] font-bold leading-tight text-slate-800";
      name.textContent = displayName;
      popup.appendChild(name);
      if (site.website) {
        const websiteLink = document.createElement("a");
        websiteLink.href = site.website;
        websiteLink.target = "_blank";
        websiteLink.rel = "noopener noreferrer";
        websiteLink.textContent = t.mapView.osmWebsite;
        websiteLink.className = "block text-sm font-medium underline";
        popup.appendChild(websiteLink);
      }
      if (site.phone) {
        const phone = document.createElement("p");
        phone.className = "text-xs";
        phone.textContent = site.phone;
        popup.appendChild(phone);
      }
      const adopt = document.createElement("button");
      adopt.type = "button";
      adopt.textContent = t.mapView.adoptFavorite;
      adopt.className = "block text-sm font-medium underline";
      adopt.addEventListener("click", async () => {
        adopt.disabled = true;
        try {
          await utils.client.spots.add.mutate({
            name: displayName,
            latitude: site.lat,
            longitude: site.lon,
          });
          toast.success(t.mapView.adopted(displayName));
          void utils.spots.list.invalidate();
          engineRef.current?.closePopup();
        } catch {
          toast.error(t.common.saveFailed);
          adopt.disabled = false;
        }
      });
      popup.appendChild(adopt);
      const source = document.createElement("p");
      source.className = "text-xs text-muted-foreground";
      source.textContent = t.mapView.osmSource;
      popup.appendChild(source);
      marker.bindPopup(popup);
      return marker;
    };

    // Feuer- und Grillstellen aus OpenStreetMap als eigene (rote) Pins.
    // Das Popup nennt den Typ, die gepflegten Eigenschaften und die
    // Navigation; ob heute überhaupt gefeuert werden darf, sagt die
    // Waldbrandgefahr-Anzeige im Wetter – dorthin geht der letzte Link,
    // statt den Hinweis hier zu doppeln.
    const createFirepitMarker = (firepit: OsmFirepit): MarkerObject => {
      const tf = t.firepits;
      const kindLabel = tf.kind[firepit.kind];
      const displayName = firepit.name ?? kindLabel;
      const marker = engine.marker([firepit.lat, firepit.lon], {
        icon: firepitIcon,
        title: displayName,
        layer,
      });
      const popup = document.createElement("div");
      popup.className =
        "flex flex-col gap-1.5 overflow-y-auto max-h-[50vh] pr-1 pb-1";

      const name = document.createElement("p");
      name.className = "text-[15px] font-bold leading-tight text-slate-800";
      name.textContent = displayName;
      popup.appendChild(name);

      const kind = document.createElement("p");
      kind.className = "text-xs";
      kind.textContent = `${kindLabel} · ${tf.kindHint[firepit.kind]}`;
      popup.appendChild(kind);

      const features = [
        firepit.covered === true ? tf.covered : null,
        firepit.firewood === true ? tf.firewood : null,
        firepit.drinkingWater === true ? tf.drinkingWater : null,
      ].filter((value): value is string => value !== null);
      if (features.length > 0) {
        const line = document.createElement("p");
        line.className = "text-xs";
        line.textContent = features.join(" · ");
        popup.appendChild(line);
      }

      const route = document.createElement("a");
      route.href = directionsUrl(firepit.lat, firepit.lon, defaultProvider());
      // Klick geht über den Dialog: Er fragt beim ersten Mal nach der
      // Karten-App. Das href bleibt als Rückfall stehen, damit
      // «Link kopieren» und Mittelklick weiter funktionieren.
      route.addEventListener("click", event => {
        event.preventDefault();
        openDirections(firepit.lat, firepit.lon);
      });
      route.target = "_blank";
      route.rel = "noopener noreferrer";
      route.textContent = tf.navButton;
      route.setAttribute("aria-label", tf.navAria(displayName));
      route.className =
        "mt-1.5 flex w-full items-center justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors no-underline";
      popup.appendChild(route);

      const fireDanger = document.createElement("a");
      fireDanger.href = "/wetter";
      fireDanger.textContent = tf.fireDangerShort;
      fireDanger.className = "block text-sm font-medium underline";
      fireDanger.addEventListener("click", event => {
        event.preventDefault();
        navigate("/wetter");
      });
      popup.appendChild(fireDanger);

      const source = document.createElement("p");
      source.className = "text-xs text-muted-foreground";
      source.textContent = t.mapView.osmSource;
      popup.appendChild(source);

      marker.bindPopup(popup);
      return marker;
    };

    // Spiel- und Badeplätze als Pins der Ebene «Familie» (petrol). Beide
    // Kategorien teilen sich Ebene und Farbe, tragen aber je einen eigenen
    // Umriss und ihre eigenen Angaben. Beim Baden steht zusätzlich der kurze
    // Eigenverantwortungs-Hinweis – die Wassertemperatur liefert das Dossier.
    const createFamilyMarker = (place: OsmFamilyPlace): MarkerObject => {
      const tp = t.familyPlaces;
      const kindLabel = tp.kind[place.kind];
      const displayName = place.name ?? kindLabel;
      const marker = engine.marker([place.lat, place.lon], {
        icon: familyIconFor(place.kind),
        title: displayName,
        layer,
      });
      const popup = document.createElement("div");
      popup.className =
        "flex flex-col gap-1.5 overflow-y-auto max-h-[50vh] pr-1 pb-1";

      const name = document.createElement("p");
      name.className = "text-[15px] font-bold leading-tight text-slate-800";
      name.textContent = displayName;
      popup.appendChild(name);

      const kind = document.createElement("p");
      kind.className = "text-xs";
      kind.textContent = kindLabel;
      popup.appendChild(kind);

      const features: string[] = [];
      if (place.minAgeYears !== undefined && place.maxAgeYears !== undefined) {
        features.push(tp.ageRange(place.minAgeYears, place.maxAgeYears));
      } else if (place.minAgeYears !== undefined) {
        features.push(tp.minAge(place.minAgeYears));
      } else if (place.maxAgeYears !== undefined) {
        features.push(tp.maxAge(place.maxAgeYears));
      }
      if (place.fenced === true) features.push(tp.fenced);
      if (place.covered === true) features.push(tp.covered);
      if (place.supervised === true) features.push(tp.supervised);
      if (place.fee === true) features.push(tp.feePaid);
      if (place.fee === false) features.push(tp.feeFree);
      if (features.length > 0) {
        const line = document.createElement("p");
        line.className = "text-xs";
        line.textContent = features.join(" · ");
        popup.appendChild(line);
      }

      const route = document.createElement("a");
      route.href = directionsUrl(place.lat, place.lon, defaultProvider());
      // Klick geht über den Dialog: Er fragt beim ersten Mal nach der
      // Karten-App. Das href bleibt als Rückfall stehen, damit
      // «Link kopieren» und Mittelklick weiter funktionieren.
      route.addEventListener("click", event => {
        event.preventDefault();
        openDirections(place.lat, place.lon);
      });
      route.target = "_blank";
      route.rel = "noopener noreferrer";
      route.textContent = tp.navButton;
      route.setAttribute("aria-label", tp.navAria(displayName));
      route.className =
        "mt-1.5 flex w-full items-center justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors no-underline";
      popup.appendChild(route);

      if (place.kind === "bathing") {
        const care = document.createElement("p");
        care.className = "text-xs text-muted-foreground";
        care.textContent = tp.bathingNoteShort;
        popup.appendChild(care);
      }

      const source = document.createElement("p");
      source.className = "text-xs text-muted-foreground";
      source.textContent = t.mapView.osmSource;
      popup.appendChild(source);

      marker.bindPopup(popup);
      return marker;
    };

    // Ausflugsziele aus der Ausflugfinder-App als eigene (dunkelrote) Pins.
    // Das Popup zeigt Titelbild, Name, Kategorien, Kostenstufe und Region;
    // «Details» klappt Beschreibung, Hinweise, Öffnungszeiten und Website auf.
    // Alles per DOM aufgebaut – die Inhalte sind Nutzertexte (kein innerHTML).
    const createExcursionMarker = (excursion: Excursion): MarkerObject => {
      const marker = engine.marker([excursion.latitude, excursion.longitude], {
        icon: excursionIcon,
        title: excursion.name,
        layer,
      });
      const te = t.excursions;
      const popup = document.createElement("div");
      popup.className =
        "flex flex-col gap-1.5 overflow-y-auto max-h-[50vh] pr-1 pb-1";
      popup.style.maxWidth = "230px";

      if (excursion.photoUrl) {
        const image = document.createElement("img");
        image.src = excursion.photoUrl;
        image.alt = te.photoAlt(excursion.name);
        image.loading = "lazy";
        image.className = "mb-2 h-28 w-full rounded-lg object-cover shadow-sm";
        popup.appendChild(image);
      }

      const name = document.createElement("p");
      name.className = "text-[15px] font-bold leading-tight text-slate-800";
      name.textContent = excursion.name;
      popup.appendChild(name);

      const facts = [
        excursion.categories.join(" · ") || null,
        excursion.region,
      ].filter((value): value is string => Boolean(value));
      if (facts.length > 0) {
        const meta = document.createElement("p");
        meta.className = "text-[13px] font-medium text-slate-500 leading-snug";
        meta.textContent = facts.join(" · ");
        popup.appendChild(meta);
      }

      const symbols = costLevelSymbols(excursion.costLevel);
      if (symbols !== null) {
        const cost = document.createElement("p");
        cost.className = "text-xs";
        cost.textContent = `${te.costLabel}: ${
          symbols === "" ? te.costFree : symbols
        }`;
        popup.appendChild(cost);
      }

      // Details bleiben eingeklappt, damit das Popup klein bleibt
      const details = document.createElement("div");
      details.className = "mt-1 space-y-1 text-xs";
      details.hidden = true;
      const addDetail = (label: string | null, value: string): void => {
        const line = document.createElement("p");
        line.textContent = label ? `${label}: ${value}` : value;
        details.appendChild(line);
      };
      if (excursion.description) addDetail(null, excursion.description);
      if (excursion.niceToKnow) {
        addDetail(te.niceToKnowLabel, excursion.niceToKnow);
      }
      if (excursion.openingHours) {
        addDetail(te.openingHoursLabel, excursion.openingHours);
      }
      if (excursion.websiteUrl) {
        const site = document.createElement("a");
        site.href = excursion.websiteUrl;
        site.target = "_blank";
        site.rel = "noopener noreferrer";
        site.textContent = te.websiteLink;
        site.className =
          "mt-1 flex w-full items-center justify-center rounded-md bg-secondary px-3 py-1.5 text-sm font-semibold text-secondary-foreground shadow-sm hover:bg-secondary/80 transition-colors no-underline";
        details.appendChild(site);
      }

      const hasDetails = details.childElementCount > 0;
      if (hasDetails) {
        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.textContent = te.detailsShow;
        toggle.setAttribute("aria-expanded", "false");
        toggle.className =
          "mt-1 text-[13px] font-semibold text-primary hover:underline transition-colors text-left";
        toggle.addEventListener("click", () => {
          details.hidden = !details.hidden;
          toggle.textContent = details.hidden ? te.detailsShow : te.detailsHide;
          toggle.setAttribute("aria-expanded", String(!details.hidden));
          // Leaflet rechnet die Popup-Grösse nur auf Zuruf neu
          marker.updatePopup();
        });
        popup.appendChild(toggle);
        popup.appendChild(details);
      }

      const route = document.createElement("a");
      route.href = directionsUrl(
        excursion.latitude,
        excursion.longitude,
        defaultProvider()
      );
      // Klick geht über den Dialog: Er fragt beim ersten Mal nach der
      // Karten-App. Das href bleibt als Rückfall stehen, damit
      // «Link kopieren» und Mittelklick weiter funktionieren.
      route.addEventListener("click", event => {
        event.preventDefault();
        openDirections(excursion.latitude, excursion.longitude);
      });
      route.target = "_blank";
      route.rel = "noopener noreferrer";
      route.textContent = te.navButton;
      route.setAttribute("aria-label", te.navAria(excursion.name));
      route.className =
        "mt-1.5 flex w-full items-center justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors no-underline";
      popup.appendChild(route);

      const source = document.createElement("p");
      source.className = "text-xs text-muted-foreground";
      source.textContent = te.source;
      popup.appendChild(source);

      marker.bindPopup(popup);
      return marker;
    };

    // Merkorte (#537): Stern-Pin in der gewählten Farbe. Das Popup zeigt
    // Name, Notiz und Navigation und erlaubt das Entfernen – bearbeitet
    // wird nicht: Ein Merkort ist schnell neu gesetzt.
    const createSavedPlaceMarker = (place: SavedPlacePin): MarkerObject => {
      const marker = engine.marker([place.latitude, place.longitude], {
        icon: savedPlaceIconFor(place.color),
        title: place.name,
        layer,
      });
      const popup = document.createElement("div");
      popup.className =
        "flex flex-col gap-1.5 overflow-y-auto max-h-[50vh] pr-1 pb-1";
      const name = document.createElement("p");
      name.className = "text-[15px] font-bold leading-tight text-slate-800";
      name.textContent = place.name;
      popup.appendChild(name);
      const kind = document.createElement("p");
      kind.className = "text-xs";
      kind.textContent = t.mapView.savedPlaceKind;
      popup.appendChild(kind);
      // Foto (#599): die Vorschau aus der Verwaltungsliste auch im Popup
      if (place.photoFileName) {
        const photo = document.createElement("img");
        photo.src = `/api/places/photos/${place.photoFileName}`;
        photo.alt = "";
        photo.loading = "lazy";
        photo.className = "mt-1 h-24 w-full rounded-md object-cover";
        popup.appendChild(photo);
      }
      if (place.note) {
        const note = document.createElement("p");
        note.className = "text-xs";
        note.textContent = place.note;
        popup.appendChild(note);
      }
      const route = document.createElement("a");
      route.href = directionsUrl(
        place.latitude,
        place.longitude,
        defaultProvider()
      );
      route.addEventListener("click", event => {
        event.preventDefault();
        openDirections(place.latitude, place.longitude);
      });
      route.target = "_blank";
      route.rel = "noopener noreferrer";
      route.textContent = t.mapView.routeLink;
      route.className =
        "mt-1.5 flex w-full items-center justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors no-underline";
      popup.appendChild(route);
      // Vom Wunsch zum Plan (#562): als Etappe an eine Reise hängen oder
      // gleich eine neue Reise mit diesem Ort beginnen.
      const addStage = document.createElement("button");
      addStage.type = "button";
      addStage.textContent = t.mapView.savedPlaceAddStage;
      addStage.className = "block text-sm font-medium underline";
      addStage.addEventListener("click", () => {
        engineRef.current?.closePopup();
        setStagePlace(place);
      });
      popup.appendChild(addStage);
      const planTrip = document.createElement("button");
      planTrip.type = "button";
      planTrip.textContent = t.mapView.savedPlacePlanTrip;
      planTrip.className = "block text-sm font-medium underline";
      planTrip.addEventListener("click", () => {
        navigate(
          `/tagebuch?neu=1&ort=${encodeURIComponent(place.name)}&lat=${place.latitude}&lng=${place.longitude}`
        );
      });
      popup.appendChild(planTrip);
      // Befördern (#600): aus dem Wunsch wird ein Favorit mit Dossier –
      // Name, Koordinaten, Notiz und Foto ziehen um, der Merkort geht.
      const promote = document.createElement("button");
      promote.type = "button";
      promote.textContent = t.mapView.savedPlacePromote;
      promote.className = "block text-sm font-medium underline";
      promote.addEventListener("click", async () => {
        promote.disabled = true;
        try {
          const { spotId } = await utils.client.savedPlaces.promote.mutate({
            id: place.id,
          });
          toast.success(t.mapView.savedPlacePromoted);
          void utils.savedPlaces.list.invalidate();
          void utils.spots.list.invalidate();
          engineRef.current?.closePopup();
          navigate(`/zeltplaetze/${spotId}`);
        } catch {
          toast.error(t.common.actionFailed);
          promote.disabled = false;
        }
      });
      popup.appendChild(promote);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = t.mapView.savedPlaceDelete;
      remove.className = "block text-sm font-medium underline";
      remove.addEventListener("click", async () => {
        remove.disabled = true;
        try {
          await utils.client.savedPlaces.remove.mutate({ id: place.id });
          toast.success(t.mapView.savedPlaceDeleted);
          void utils.savedPlaces.list.invalidate();
          engineRef.current?.closePopup();
        } catch {
          toast.error(t.common.actionFailed);
          remove.disabled = false;
        }
      });
      popup.appendChild(remove);
      marker.bindPopup(popup);
      return marker;
    };

    // Alle sichtbaren Pins einsammeln und pro Zoomstufe gruppieren.
    // `map.project` liefert absolute Pixel-Koordinaten der Zoomstufe –
    // unabhängig vom Ausschnitt, deshalb genügt der Neuaufbau nach Zoom.
    interface MapPin {
      lat: number;
      lon: number;
      kind: PinKind;
      createMarker: () => MarkerObject;
      /** Nur bei Ausflügen gesetzt – für den Sprung aus dem Platz-Dossier. */
      excursionId?: string;
    }
    // Ebenen-Filter greift vor dem Clustern: ausgeblendete Pins zählen nicht mit
    const pins: MapPin[] = [
      ...(layerVisibility.favorites
        ? spots.map<MapPin>(spot => ({
            lat: spot.latitude,
            lon: spot.longitude,
            kind: "spot" as const,
            createMarker: () => createSpotMarker(spot),
          }))
        : []),
      ...(layerVisibility.targets
        ? targets.map<MapPin>(tgt => ({
            lat: tgt.lat,
            lon: tgt.lon,
            kind: "target" as const,
            createMarker: () => createTargetMarker(tgt),
          }))
        : []),
      ...(layerVisibility.sightings
        ? sightings.map<MapPin>(sighting => ({
            lat: sighting.lat,
            lon: sighting.lon,
            kind: "sighting" as const,
            createMarker: () => createSightingMarker(sighting),
          }))
        : []),
      ...(layerVisibility.campsites
        ? visibleCampsites.map<MapPin>(site => ({
            lat: site.lat,
            lon: site.lon,
            kind: "campsite" as const,
            createMarker: () => createCampsiteMarker(site),
          }))
        : []),
      ...(layerVisibility.excursions
        ? excursions.map<MapPin>(excursion => ({
            lat: excursion.latitude,
            lon: excursion.longitude,
            kind: "excursion" as const,
            createMarker: () => createExcursionMarker(excursion),
            excursionId: excursion.id,
          }))
        : []),
      ...(layerVisibility.firepits
        ? firepits.map<MapPin>(firepit => ({
            lat: firepit.lat,
            lon: firepit.lon,
            kind: "firepit" as const,
            createMarker: () => createFirepitMarker(firepit),
          }))
        : []),
      ...(layerVisibility.family
        ? familyPlaces.map<MapPin>(place => ({
            lat: place.lat,
            lon: place.lon,
            kind: "family" as const,
            createMarker: () => createFamilyMarker(place),
          }))
        : []),
      ...(layerVisibility.savedPlaces
        ? savedPlaces.map<MapPin>(place => ({
            lat: place.latitude,
            lon: place.longitude,
            kind: "savedPlace" as const,
            createMarker: () => createSavedPlaceMarker(place),
          }))
        : []),
    ];

    // Etappen-Routen (#596): gestrichelte Linie je Rundreise – unter den
    // Pins, in derselben Marker-Ebene (der Neuaufbau räumt sie mit weg).
    if (layerVisibility.routes) {
      stageRoutes.forEach(routeInfo => {
        if (routeInfo.points.length < 2) return;
        engine.polyline(routeInfo.points, {
          color: "#2f6b4f",
          weight: 3,
          dashArray: "8 6",
          layer,
        });
      });
    }

    const clusters = clusterPoints(
      pins,
      (lat, lon) => projectToPixels(lat, lon, clusterZoom),
      CLUSTER_THRESHOLD_PX
    );

    clusters.forEach(cluster => {
      if (cluster.points.length === 1) {
        const single = cluster.points[0];
        const marker = single.createMarker();
        // Aus dem Dossier verlinkter Ausflug: sein Popup gleich aufmachen
        if (
          single.excursionId &&
          single.excursionId === focusExcursionId &&
          didFocusRef.current !== focusExcursionId
        ) {
          didFocusRef.current = focusExcursionId;
          marker.openPopup();
        }
        return;
      }
      const label = t.mapView.clusterAria(cluster.points.length);
      // Klick auf den Zahlen-Kreis: auf die enthaltenen Pins zoomen –
      // maxZoom verhindert Endlos-Zoom bei praktisch identischen Punkten.
      engine
        .marker([cluster.lat, cluster.lon], {
          icon: clusterIcon(
            cluster.points.length,
            clusterColor(cluster.points.map(p => p.kind)),
            label
          ),
          title: label,
          layer,
        })
        .onClick(() => {
          engine.fitBounds(
            latLngBounds(
              cluster.points.map(p => [p.lat, p.lon] as LatLngTuple)
            ),
            { padding: 40, maxZoom: 18 }
          );
        });
    });

    if (!didFitRef.current) {
      didFitRef.current = true;
      // Statt Pins einzupassen, zentrieren wir auf den eigenen Standort (silent).
      // Zuerst Fallback für den Fall, dass Standort nicht klappt:
      engine.setView(FALLBACK_CENTER, FALLBACK_ZOOM);
      locateMe(true);
    }
  }, [
    spots,
    targets,
    sightings,
    visibleCampsites,
    excursions,
    firepits,
    familyPlaces,
    savedPlaces,
    stageRoutes,
    focusExcursionId,
    nightsBySpotId,
    clusterZoom,
    layerVisibility,
    mapReady,
    t,
    navigate,
    utils,
  ]);

  // Neuen Favoriten aus dem Karten-Klick anlegen (Toast mit Dossier-Link)
  const createMutation = trpc.spots.add.useMutation({
    onSuccess: (id, vars) => {
      void utils.spots.list.invalidate();
      setProposed(null);
      setNewName("");
      toast.success(t.mapView.createdToast(vars.name), {
        action: {
          label: t.mapView.createdToastAction,
          onClick: () => navigate(`/zeltplaetze/${id}`),
        },
      });
    },
    onError: () => toast.error(t.common.saveFailed),
  });

  // Merkort aus dem Karten-Klick anlegen (#537) – Farbe/Notiz bleiben
  // für den nächsten Merkort stehen, wer sammelt, sammelt in Serie.
  const savedPlaceMutation = trpc.savedPlaces.add.useMutation({
    onSuccess: (_data, vars) => {
      void utils.savedPlaces.list.invalidate();
      setProposed(null);
      setNewName("");
      setNewNote("");
      toast.success(t.mapView.savedPlaceCreatedToast(vars.name));
    },
    onError: () => toast.error(t.common.saveFailed),
  });

  const closeCreateDialog = () => {
    setProposed(null);
    setNewName("");
    setNewNote("");
  };

  const submitCreate = (event: React.FormEvent) => {
    event.preventDefault();
    if (!proposed || createMutation.isPending || savedPlaceMutation.isPending) {
      return;
    }
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error(t.mapView.createNameRequired);
      return;
    }
    if (createKind === "merkort") {
      savedPlaceMutation.mutate({
        name: trimmed,
        latitude: Number(proposed.lat.toFixed(5)),
        longitude: Number(proposed.lon.toFixed(5)),
        note: newNote.trim() || null,
        color: newColor,
      });
      return;
    }
    createMutation.mutate({
      name: trimmed,
      latitude: Number(proposed.lat.toFixed(5)),
      longitude: Number(proposed.lon.toFixed(5)),
    });
  };

  const clearMeasure = () => {
    measurePointsRef.current = [];
    measureLayerRef.current?.clear();
  };

  /** Mess-Modus an/aus; Ausschalten räumt Punkte und Linie weg. */
  const toggleMeasure = () => {
    const next = !measureOnRef.current;
    measureOnRef.current = next;
    setMeasureOn(next);
    if (!next) clearMeasure();
  };

  // Aktuelle Fassung des Mess-Klicks (der Init-Effect ruft sie über die Ref auf,
  // damit lang/Übersetzungen nicht in einer veralteten Closure hängen bleiben)
  measureClickRef.current = (point: LatLngTuple) => {
    const map = engineRef.current;
    if (!map) return;
    if (!measureLayerRef.current) {
      measureLayerRef.current = map.layerGroup();
    }
    if (measurePointsRef.current.length >= 2) clearMeasure();
    measurePointsRef.current.push(point);
    const layer = measureLayerRef.current;
    map.circleMarker(point, {
      radius: 5,
      color: "#ffffff",
      weight: 2,
      fillColor: "#0ea5e9",
      fillOpacity: 1,
      layer,
    });
    if (measurePointsRef.current.length === 2) {
      const [a, b] = measurePointsRef.current;
      const dist = distanceMeters(a[0], a[1], b[0], b[1]);
      const label =
        dist < 1000
          ? `${Math.round(dist)} m`
          : `${(dist / 1000).toLocaleString(LOCALE_TAGS[lang], {
              maximumFractionDigits: 1,
            })} km`;
      map.polyline([a, b], {
        color: "#0ea5e9",
        weight: 2,
        dashArray: "6 4",
        layer,
      });
      // Das Mass steht als eigener Pin in der Mitte der Strecke. Ein
      // dauerhaftes Tooltip wäre der Leaflet-Weg – ein Pin funktioniert
      // auf beiden Karten gleich.
      map.marker([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], {
        icon: measureLabelIcon(label),
        title: label,
        layer,
      });
    }
  };

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div
          role="group"
          aria-label={t.mapView.layerGroupAria}
          className="flex items-center rounded-full bg-muted p-0.5"
        >
          <button
            type="button"
            onClick={() => switchLayer("map")}
            aria-pressed={layerKind === "map"}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
              layerKind === "map"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MapIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {t.mapView.layerMap}
          </button>
          <button
            type="button"
            onClick={() => switchLayer("satellite")}
            aria-pressed={layerKind === "satellite"}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
              layerKind === "satellite"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Satellite className="h-3.5 w-3.5" aria-hidden="true" />
            {t.mapView.layerSatellite}
          </button>
        </div>

        <button
          type="button"
          onClick={() => locateMe()}
          disabled={locating}
          className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
        >
          <LocateFixed className="h-3.5 w-3.5" aria-hidden="true" />
          {t.mapView.locateButton}
        </button>
        <button
          type="button"
          onClick={toggleMeasure}
          aria-pressed={measureOn}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            measureOn
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <Ruler className="h-3.5 w-3.5" aria-hidden="true" />
          {t.mapView.measureButton}
        </button>
        {measureOn && (
          <span className="text-xs text-muted-foreground" role="status">
            {t.mapView.measureHint}
          </span>
        )}
        {layerVisibility.campsites && (
          <span className="text-xs text-muted-foreground" role="status">
            {discoverLoading
              ? t.mapView.discoverLoading
              : discoverError
                ? t.mapView.discoverError
                : needsZoom
                  ? t.mapView.discoverZoomHint
                  : searched
                    ? t.mapView.discoverCount(campsites.length)
                    : null}
          </span>
        )}
        {layerVisibility.firepits && (
          <span className="text-xs text-muted-foreground" role="status">
            {firepitLoading
              ? t.mapView.firepitLoading
              : firepitError
                ? t.mapView.firepitError
                : firepitNeedsZoom
                  ? t.mapView.firepitZoomHint
                  : firepitSearched
                    ? t.mapView.firepitCount(firepits.length)
                    : t.mapView.firepitSearchHint}
          </span>
        )}
        {layerVisibility.family && (
          <span className="text-xs text-muted-foreground" role="status">
            {familyLoading
              ? t.mapView.familyLoading
              : familyError
                ? t.mapView.familyError
                : familyNeedsZoom
                  ? t.mapView.familyZoomHint
                  : familySearched
                    ? t.mapView.familyCount(familyPlaces.length)
                    : t.mapView.familySearchHint}
          </span>
        )}
      </div>
      {/* Pin-Ebenen einzeln ein-/ausblenden – Checkbox-Chips, Wahl bleibt erhalten */}
      <div
        role="group"
        aria-label={t.mapView.layerFilterAria}
        className="mb-3 flex flex-wrap items-center gap-1.5"
      >
        {(
          [
            {
              key: "favorites",
              label: t.mapView.layerFavorites,
              icon: (
                <Tent className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              ),
            },
            {
              key: "targets",
              label: t.mapView.layerTargets,
              icon: (
                <LocateFixed
                  className="h-3.5 w-3.5 text-amber-glow"
                  aria-hidden="true"
                />
              ),
            },
            {
              key: "sightings",
              label: t.mapView.layerSightings,
              icon: (
                <PawPrint
                  className="h-3.5 w-3.5 text-violet-700 dark:text-violet-400"
                  aria-hidden="true"
                />
              ),
            },
            {
              key: "campsites",
              label: t.mapView.layerCampsites,
              icon: (
                <Compass
                  className="h-3.5 w-3.5 text-sky-700 dark:text-sky-400"
                  aria-hidden="true"
                />
              ),
            },
            {
              key: "savedPlaces",
              label: t.mapView.layerSavedPlaces,
              icon: (
                <Star
                  className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400"
                  aria-hidden="true"
                />
              ),
            },
            // Etappen-Routen (#596) nur anbieten, wenn es welche gibt
            ...(stageRoutes.length > 0
              ? ([
                  {
                    key: "routes",
                    label: t.mapView.layerRoutes,
                    icon: (
                      <Route
                        className="h-3.5 w-3.5 text-primary"
                        aria-hidden="true"
                      />
                    ),
                  },
                ] as const)
              : []),
            {
              key: "firepits",
              label: t.mapView.layerFirepits,
              icon: (
                <Flame
                  className="h-3.5 w-3.5 text-red-600 dark:text-red-400"
                  aria-hidden="true"
                />
              ),
            },
            {
              key: "family",
              label: t.mapView.layerFamily,
              icon: (
                <Baby
                  className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400"
                  aria-hidden="true"
                />
              ),
            },
            // Die Ausflugs-Ebene erscheint nur, wenn die Anbindung eingerichtet ist
            ...(excursionsAvailable
              ? ([
                  {
                    key: "excursions",
                    label: t.mapView.layerExcursions,
                    icon: (
                      <FerrisWheel
                        className="h-3.5 w-3.5 text-rose-700 dark:text-rose-400"
                        aria-hidden="true"
                      />
                    ),
                  },
                ] as const)
              : []),
          ] as const
        ).map(({ key, label, icon }) => (
          <button
            key={key}
            type="button"
            role="checkbox"
            aria-checked={layerVisibility[key]}
            onClick={() => toggleLayerChip(key)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              layerVisibility[key]
                ? "border-primary/40 bg-primary/10 text-foreground"
                : "border-border bg-muted text-muted-foreground line-through hover:text-foreground"
            )}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>
      <div className="relative">
        <div
          ref={containerRef}
          role="region"
          aria-label={t.mapView.mapAria}
          className="h-[65vh] min-h-80 w-full rounded-xl border border-border"
        />
        {overpassLayersOn &&
          moved &&
          !discoverLoading &&
          !firepitLoading &&
          !familyLoading && (
            <button
              type="button"
              onClick={searchHere}
              className="absolute left-1/2 top-3 z-[1000] flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-medium shadow-md hover:bg-muted"
            >
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              {t.mapView.discoverSearchHere}
            </button>
          )}
      </div>
      {/* Legende: nur eingeblendete Ebenen erscheinen */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {layerVisibility.favorites && (
          <span className="flex items-center gap-1.5">
            <Tent className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            {t.mapView.legend(spots.length)}
          </span>
        )}
        {layerVisibility.targets && targets.length > 0 && (
          <span className="flex items-center gap-1.5">
            <LocateFixed
              className="h-3.5 w-3.5 text-amber-glow"
              aria-hidden="true"
            />
            {t.mapView.targetLegend(targets.length)}
          </span>
        )}
        {layerVisibility.sightings && sightings.length > 0 && (
          <span className="flex items-center gap-1.5">
            <PawPrint
              className="h-3.5 w-3.5 text-violet-700 dark:text-violet-400"
              aria-hidden="true"
            />
            {t.mapView.sightingLegend(sightings.length)}
          </span>
        )}
        {layerVisibility.campsites &&
          layerVisibility.campsites &&
          visibleCampsites.length > 0 && (
            <span className="flex items-center gap-1.5">
              <Compass
                className="h-3.5 w-3.5 text-sky-700 dark:text-sky-400"
                aria-hidden="true"
              />
              {t.mapView.discoverLegend(visibleCampsites.length)}
            </span>
          )}
        {layerVisibility.excursions && excursions.length > 0 && (
          <span className="flex items-center gap-1.5">
            <FerrisWheel
              className="h-3.5 w-3.5 text-rose-700 dark:text-rose-400"
              aria-hidden="true"
            />
            {t.mapView.excursionLegend(excursions.length)}
          </span>
        )}
        {layerVisibility.savedPlaces && savedPlaces.length > 0 && (
          <span className="flex items-center gap-1.5">
            <Star
              className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400"
              aria-hidden="true"
            />
            {t.mapView.savedPlaceLegend(savedPlaces.length)}
          </span>
        )}
        {layerVisibility.firepits && firepits.length > 0 && (
          <span className="flex items-center gap-1.5">
            <Flame
              className="h-3.5 w-3.5 text-red-600 dark:text-red-400"
              aria-hidden="true"
            />
            {t.mapView.firepitLegend(firepits.length)}
          </span>
        )}
        {layerVisibility.family && familyPlaces.length > 0 && (
          <span className="flex items-center gap-1.5">
            <Baby
              className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400"
              aria-hidden="true"
            />
            {t.mapView.familyLegend(familyPlaces.length)}
          </span>
        )}
      </div>

      {/* Merkort → Etappe (#562): geplante/laufende Reise wählen */}
      <Dialog
        open={stagePlace !== null}
        onOpenChange={open => {
          if (!open) setStagePlace(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.mapView.stageDialogTitle}</DialogTitle>
            <DialogDescription>{t.mapView.stageDialogHint}</DialogDescription>
          </DialogHeader>
          {stageTrips.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t.mapView.stageDialogEmpty}
            </p>
          ) : (
            <ul className="max-h-64 space-y-1.5 overflow-y-auto">
              {stageTrips.map(trip => {
                const label = tripDisplayName(trip, lang);
                return (
                  <li key={trip.id}>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      disabled={stageBusy}
                      onClick={() => void addStageToTrip(trip, label)}
                    >
                      <span className="min-w-0 flex-1 truncate text-left">
                        {label}
                      </span>
                      <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                        {fmtDayMonth(
                          new Date(`${trip.startDate}T00:00:00`),
                          lang
                        )}{" "}
                        –{" "}
                        {fmtDayMonth(
                          new Date(`${trip.endDate}T00:00:00`),
                          lang
                        )}
                      </span>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={proposed !== null}
        onOpenChange={open => {
          if (!open) closeCreateDialog();
        }}
      >
        <DialogContent className="max-w-sm">
          <form onSubmit={submitCreate} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-serif">
                {t.mapView.createTitle}
              </DialogTitle>
              <DialogDescription>
                {proposed
                  ? t.mapView.createDesc(
                      proposed.lat.toFixed(5),
                      proposed.lon.toFixed(5)
                    )
                  : ""}
              </DialogDescription>
            </DialogHeader>
            {/* Favorit oder Merkort (#537)? Der Favorit bleibt der
                Normalfall, der Merkort ist die leichte Ablage. */}
            <div
              className="flex gap-1.5"
              role="group"
              aria-label={t.mapView.createKindAria}
            >
              {(
                [
                  { key: "favorit", label: t.mapView.createKindFavorite },
                  { key: "merkort", label: t.mapView.createKindSavedPlace },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCreateKind(key)}
                  aria-pressed={createKind === key}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                    createKind === key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div>
              <Label htmlFor="map-new-spot-name">
                {t.mapView.createNameLabel}
              </Label>
              <Input
                id="map-new-spot-name"
                value={newName}
                onChange={event => setNewName(event.target.value)}
                placeholder={t.mapView.createNamePlaceholder}
                maxLength={120}
                required
              />
            </div>
            {createKind === "merkort" && (
              <>
                <div>
                  <Label htmlFor="map-new-place-note">
                    {t.mapView.createNoteLabel}
                  </Label>
                  <Input
                    id="map-new-place-note"
                    value={newNote}
                    onChange={event => setNewNote(event.target.value)}
                    placeholder={t.mapView.createNotePlaceholder}
                    maxLength={SAVED_PLACE_NOTE_MAX_LENGTH}
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block">
                    {t.mapView.createColorLabel}
                  </Label>
                  <div
                    className="flex gap-2"
                    role="group"
                    aria-label={t.mapView.createColorLabel}
                  >
                    {SAVED_PLACE_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewColor(color)}
                        aria-pressed={newColor === color}
                        aria-label={pick(SAVED_PLACE_COLOR_LABELS[color], lang)}
                        className={cn(
                          "h-7 w-7 rounded-full border-2 transition-transform",
                          newColor === color
                            ? "scale-110 border-foreground"
                            : "border-transparent hover:scale-105"
                        )}
                        style={{
                          backgroundColor: SAVED_PLACE_COLOR_HEX[color],
                        }}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeCreateDialog}
              >
                {t.common.cancel}
              </Button>
              <Button
                type="submit"
                disabled={
                  createMutation.isPending || savedPlaceMutation.isPending
                }
              >
                {createMutation.isPending || savedPlaceMutation.isPending
                  ? t.common.saving
                  : createKind === "merkort"
                    ? t.mapView.createSavedPlaceConfirm
                    : t.mapView.createConfirm}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
