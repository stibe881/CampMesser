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
import { fmtLong } from "@/lib/dateFormat";
import { Link, useLocation, useSearch } from "wouter";
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
  Tent,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import LoginPrompt from "@/components/LoginPrompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  defaultProvider,
  directionsUrl,
  openDirections,
} from "@/lib/directions";
import { useSyncedSetting } from "@/lib/useSyncedSetting";
import { readOverpassCache, writeOverpassCache } from "@/lib/overpassStore";
import {
  OVERPASS_MIN_ZOOM,
  fetchOverpass,
  combinedBboxQuery,
  type OverpassLayer,
  parseCampsites,
  parseFamilyPlaces,
  parseFirepits,
  type FamilyPlaceKind,
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
  divIcon,
  latLngBounds,
  type IconSpec,
  type LatLngTuple,
  type LayerGroupObject,
  type MapEngine,
  type MarkerObject,
} from "@/lib/mapEngine";
import { useMapConfig } from "@/hooks/useMapConfig";
import {
  LEGACY_TARGET_KEY,
  TARGETS_KEY,
  migrateTargets,
  sanitizeTargets,
  targetIconGlyph,
  type TargetIcon,
  type TentFinderTarget,
} from "@/lib/tentFinderTargets";
import { cn } from "@/lib/utils";
import { useI18n, useT } from "@/i18n";
import { LOCALE_TAGS } from "@shared/i18n";
import { distanceMeters } from "@shared/geo";
import { costLevelSymbols, type Excursion } from "@shared/excursions";
import { tripNights } from "@shared/trips";

interface SpotPin {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

/** Natur-Beobachtung mit Koordinaten – Datum bereits sprachrichtig formatiert. */
interface SightingPin {
  id: number;
  title: string;
  dateLabel: string;
  lat: number;
  lon: number;
}

/** Schweiz als Ausgangs-Ausschnitt, solange keine Pins vorhanden sind. */
const FALLBACK_CENTER: LatLngTuple = [46.8, 8.2];
const FALLBACK_ZOOM = 8;

/** Runder Zelt-Marker als divIcon – keine Bild-Assets nötig (Bundler-sicher). */
const spotIcon = divIcon({
  className: "",
  html: `<svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#2f6b4f" stroke="#ffffff" stroke-width="2.5"/><path d="M14 8.5 20 19h-4.2L14 15.8 12.2 19H8Z" fill="#ffffff"/></svg>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

/**
 * Zelt-Finder-Ziel als bernsteinfarbener Marker (gleiches divIcon-Muster);
 * im Kreis steht der SVG-Glyph des gewählten Symbols, ohne Wahl das
 * Fadenkreuz wie bisher.
 */
function targetIconFor(icon: TargetIcon | undefined): IconSpec {
  return divIcon({
    className: "",
    html: `<svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#b45309" stroke="#ffffff" stroke-width="2.5"/>${targetIconGlyph(icon)}</svg>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

/** Entdeckter OSM-Campingplatz: blauer Kreis mit Zelt-Umriss (dritte Farbe). */
const campsiteIcon = divIcon({
  className: "",
  html: `<svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#0369a1" stroke="#ffffff" stroke-width="2.5"/><path d="M14 8.5 20 19h-4.2L14 15.8 12.2 19H8Z" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

/** Natur-Beobachtung: violetter Kreis mit Pfoten-Punkten (vierte Farbe). */
const sightingIcon = divIcon({
  className: "",
  html: `<svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#7c3aed" stroke="#ffffff" stroke-width="2.5"/><ellipse cx="14" cy="16.5" rx="3.4" ry="2.9" fill="#ffffff"/><circle cx="9.6" cy="12.4" r="1.7" fill="#ffffff"/><circle cx="13" cy="10.4" r="1.7" fill="#ffffff"/><circle cx="16.8" cy="10.9" r="1.7" fill="#ffffff"/><circle cx="19.4" cy="13.7" r="1.6" fill="#ffffff"/></svg>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

/**
 * Ausflugsziel aus der Ausflugfinder-App (#271): dunkelroter Kreis mit
 * Riesenrad-Stern – fünfte Farbe, klar unterscheidbar von Plätzen (grün),
 * Zielen (bernstein), Beobachtungen (violett) und OSM-Funden (blau).
 */
const excursionIcon = divIcon({
  className: "",
  html: `<svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#be123c" stroke="#ffffff" stroke-width="2.5"/><circle cx="14" cy="14" r="5.4" fill="none" stroke="#ffffff" stroke-width="1.6"/><path d="M14 6.6v3M14 18.4v3M6.6 14h3M18.4 14h3M9 9l2.1 2.1M16.9 16.9 19 19M19 9l-2.1 2.1M11.1 16.9 9 19" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

/**
 * Feuer- bzw. Grillstelle aus OpenStreetMap (#247): reines Rot mit Flamme –
 * sechste Farbe, deutlich heller und satter als das Bernstein der Ziele und
 * das dunkle Karminrot der Ausflüge, dazu ein unverwechselbarer Umriss.
 */
const firepitIcon = divIcon({
  className: "",
  html: `<svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#dc2626" stroke="#ffffff" stroke-width="2.5"/><path d="M14.4 6.6c2.5 2.9 4.3 5 4.3 7.8a4.7 4.7 0 0 1-9.4 0c0-1.8.8-3.2 2-4.6.2 1.2.8 2 1.7 2.3.6-2.1.3-3.8-.9-5.7 1 .1 1.7.2 2.3.2Z" fill="#ffffff"/></svg>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

/**
 * Spielplatz bzw. Badeplatz (#248): beide in Petrol #0d9488 – siebte Farbe,
 * klar getrennt vom Platz-Grün und vom Blau der OSM-Campingplätze. Weil beide
 * zur selben Ebene «Familie» gehören, unterscheidet sie nicht die Farbe,
 * sondern der Umriss: Rutschbahn für den Spielplatz, Wellen fürs Baden.
 */
const FAMILY_GLYPHS: Record<FamilyPlaceKind, string> = {
  playground: `<path d="M10.2 19.4v-8.2M10.2 11.6h1.8M10.2 14.2h1.8M10.2 16.8h1.8" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round" fill="none"/><path d="M12 10.8c3.1 1.5 5.2 4.5 6.2 8.6" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" fill="none"/><path d="M7.8 19.6h12.4" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>`,
  bathing: `<circle cx="11" cy="10.4" r="2" fill="#ffffff"/><path d="M7.4 15.4c1.3-1.5 2.6-1.5 3.9 0s2.6 1.5 3.9 0 2.6-1.5 3.9 0M7.4 18.8c1.3-1.5 2.6-1.5 3.9 0s2.6 1.5 3.9 0 2.6-1.5 3.9 0" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" fill="none"/>`,
};

function familyIconFor(kind: FamilyPlaceKind): IconSpec {
  return divIcon({
    className: "",
    html: `<svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#0d9488" stroke="#ffffff" stroke-width="2.5"/>${FAMILY_GLYPHS[kind]}</svg>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

/** Pin-Typen für die Cluster-Färbung (Farben wie die jeweiligen Einzel-Icons). */
type PinKind =
  | "spot"
  | "target"
  | "sighting"
  | "campsite"
  | "excursion"
  | "firepit"
  | "family";

const PIN_COLORS: Record<PinKind, string> = {
  spot: "#2f6b4f",
  target: "#b45309",
  sighting: "#7c3aed",
  campsite: "#0369a1",
  excursion: "#be123c",
  firepit: "#dc2626",
  family: "#0d9488",
};

/** Neutrales Grau, wenn kein Pin-Typ im Cluster klar dominiert. */
const CLUSTER_NEUTRAL_COLOR = "#475569";

/** Farbe des dominanten Pin-Typs – bei Gleichstand neutral. */
function clusterColor(kinds: readonly PinKind[]): string {
  const counts = new Map<PinKind, number>();
  kinds.forEach(kind => counts.set(kind, (counts.get(kind) ?? 0) + 1));
  let bestKind: PinKind | null = null;
  let bestCount = 0;
  let tied = false;
  counts.forEach((count, kind) => {
    if (count > bestCount) {
      bestKind = kind;
      bestCount = count;
      tied = false;
    } else if (count === bestCount) {
      tied = true;
    }
  });
  return bestKind && !tied ? PIN_COLORS[bestKind] : CLUSTER_NEUTRAL_COLOR;
}

/** Zahlen-Kreis für gruppierte Pins – Grösse wächst leicht mit der Anzahl. */
/** Beschriftung der Messstrecke – ein Pin statt eines Tooltips. */
function measureLabelIcon(label: string): IconSpec {
  const width = Math.max(44, label.length * 8 + 16);
  return divIcon({
    className: "",
    html: `<div style="background:#0ea5e9;color:#fff;border-radius:9999px;padding:2px 8px;font-size:11px;font-weight:600;white-space:nowrap;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.3)">${label}</div>`,
    iconSize: [width, 20],
    iconAnchor: [width / 2, 10],
  });
}

function clusterIcon(count: number, color: string, label: string): IconSpec {
  const size = count < 10 ? 34 : count < 100 ? 40 : 46;
  return divIcon({
    className: "",
    html: `<div role="img" aria-label="${label}" style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};color:#ffffff;border:2.5px solid #ffffff;box-shadow:0 1px 4px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-weight:600;font-size:13px;">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/** Liegt der OSM-Platz praktisch auf einem Favoriten? (~50 m Toleranz) */
function isNearFavorite(campsite: OsmCampsite, spots: SpotPin[]): boolean {
  return spots.some(
    s =>
      Math.abs(s.latitude - campsite.lat) < 0.0005 &&
      Math.abs(s.longitude - campsite.lon) < 0.0005
  );
}

function SpotsMap({
  spots,
  targets,
  sightings,
  excursions,
  excursionsAvailable,
  focusExcursionId,
  nightsBySpotId,
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
  const [proposed, setProposed] = useState<{ lat: number; lon: number } | null>(
    null
  );
  const [newName, setNewName] = useState("");

  // Basis-Layer «Karte / Satellit» – Wahl bleibt in localStorage erhalten
  const [layerKind, setLayerKind] = useState<MapLayerKind>(loadMapLayer);

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
    ];

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

  const closeCreateDialog = () => {
    setProposed(null);
    setNewName("");
  };

  const submitCreate = (event: React.FormEvent) => {
    event.preventDefault();
    if (!proposed || createMutation.isPending) return;
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error(t.mapView.createNameRequired);
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
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeCreateDialog}
              >
                {t.common.cancel}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending
                  ? t.common.saving
                  : t.mapView.createConfirm}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function MapViewPage() {
  const { lang, t } = useI18n();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: spots, isLoading: spotsLoading } = trpc.spots.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: trips } = trpc.trips.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: sightingsData } = trpc.sightings.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Ausflugfinder-Anbindung (#271): zuerst die billige Frage, ob das Feature
  // überhaupt eingerichtet ist (fasst die Quelle nicht an) – erst wenn ja,
  // werden die Ziele geholt. Der Abruf ist serverseitig zwischengespeichert
  // und liefert die ganze (kleine) Sammlung auf einmal.
  const { data: excursionStatus } = trpc.excursions.status.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const excursionsAvailable = excursionStatus?.configured === true;
  const { data: excursionData } = trpc.excursions.list.useQuery(undefined, {
    enabled: isAuthenticated && excursionsAvailable,
    staleTime: 10 * 60 * 1000,
  });
  const excursions = useMemo<Excursion[]>(
    () => excursionData?.excursions ?? [],
    [excursionData]
  );

  // Aus dem Platz-Dossier verlinktes Ziel: /karte?ausflug=<id>
  const search = useSearch();
  const focusExcursionId = useMemo(
    () => new URLSearchParams(search).get("ausflug"),
    [search]
  );

  // Zelt-Finder-Ziele wie im Zelt-Finder laden (inkl. einmaliger Migration des Alt-Ziels)
  const [targets, setTargets] = useState<TentFinderTarget[]>(() => {
    try {
      const { targets: initial, changed } = migrateTargets(
        localStorage.getItem(TARGETS_KEY),
        localStorage.getItem(LEGACY_TARGET_KEY),
        t.tentFinder.suggestionTent
      );
      if (changed) {
        localStorage.setItem(TARGETS_KEY, JSON.stringify(initial));
        localStorage.removeItem(LEGACY_TARGET_KEY);
      }
      return initial;
    } catch {
      return [];
    }
  });

  // Geräte-Sync: Konto-Stand übernehmen (die Karte liest nur, push braucht sie nicht)
  useSyncedSetting<TentFinderTarget[]>("tentFinderTargets", value => {
    const clean = sanitizeTargets(value);
    setTargets(clean);
    try {
      localStorage.setItem(TARGETS_KEY, JSON.stringify(clean));
    } catch {
      /* Sitzung reicht */
    }
  });

  // Übernachtungen pro Platz: Tagebuch-Einträge über spotId zuordnen,
  // Freitext-Orte über den Namen (case-insensitiv, wie computeTripStats)
  const nightsBySpotId = useMemo(() => {
    const result = new Map<number, number>();
    if (!spots || !trips) return result;
    const idByName = new Map<string, number>();
    spots.forEach(spot => {
      idByName.set(spot.name.trim().toLowerCase(), spot.id);
    });
    trips.forEach(trip => {
      const nights = tripNights(trip.startDate, trip.endDate);
      if (nights === 0) return;
      let spotId: number | undefined;
      if (trip.spotId != null && spots.some(s => s.id === trip.spotId)) {
        spotId = trip.spotId;
      } else if (trip.location) {
        spotId = idByName.get(trip.location.trim().toLowerCase());
      }
      if (spotId != null) {
        result.set(spotId, (result.get(spotId) ?? 0) + nights);
      }
    });
    return result;
  }, [spots, trips]);

  const spotPins = useMemo<SpotPin[]>(
    () =>
      (spots ?? []).map(spot => ({
        id: spot.id,
        name: spot.name,
        latitude: spot.latitude,
        longitude: spot.longitude,
      })),
    [spots]
  );

  // Natur-Beobachtungen mit Koordinaten – das Datum wird hier sprachrichtig
  // vorformatiert, damit der Karten-Popup-Aufbau reine Strings erhält.
  const sightingPins = useMemo<SightingPin[]>(
    () =>
      (sightingsData ?? [])
        .filter(s => s.lat != null && s.lon != null)
        .map(s => ({
          id: s.id,
          title: s.title,
          dateLabel: fmtLong(new Date(`${s.sightedAt}T00:00:00`), lang),
          lat: s.lat as number,
          lon: s.lon as number,
        })),
    [sightingsData, lang]
  );

  return (
    <div className="container max-w-5xl py-6 md:py-8">
      <PageHeader title={t.mapView.title} subtitle={t.mapView.subtitle} />

      {!authLoading && !isAuthenticated ? (
        <LoginPrompt feature={t.mapView.loginFeature} />
      ) : spotsLoading || authLoading ? (
        <Skeleton className="h-[65vh] min-h-80 w-full rounded-xl" />
      ) : (
        <>
          {spotPins.length === 0 && targets.length === 0 && (
            <Card className="mb-4">
              <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
                <MapPin
                  className="h-8 w-8 text-muted-foreground/50"
                  aria-hidden="true"
                />
                <p className="text-sm text-muted-foreground">
                  {t.mapView.empty}
                </p>
                <Link
                  href="/zeltplaetze"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {t.mapView.emptyCta}
                </Link>
              </CardContent>
            </Card>
          )}
          <SpotsMap
            spots={spotPins}
            targets={targets}
            sightings={sightingPins}
            excursions={excursions}
            excursionsAvailable={excursionsAvailable}
            focusExcursionId={focusExcursionId}
            nightsBySpotId={nightsBySpotId}
          />
        </>
      )}
    </div>
  );
}
