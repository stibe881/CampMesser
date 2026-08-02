/**
 * Karte der Plätze & Reisen: alle gespeicherten Zeltplatz-Favoriten als Pins
 * auf einer OpenStreetMap-Karte (Leaflet, ohne react-leaflet). Im Popup steht
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
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Compass,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  PawPrint,
  Satellite,
  Search,
  Tent,
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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
import { directionsUrl } from "@/lib/directions";
import { useSyncedSetting } from "@/lib/useSyncedSetting";
import {
  OVERPASS_MIN_ZOOM,
  OVERPASS_URL,
  overpassQuery,
  parseCampsites,
  type OsmCampsite,
} from "@/lib/overpass";
import {
  createBaseLayer,
  loadMapLayer,
  storeMapLayer,
  type MapLayerKind,
} from "@/lib/mapLayers";
import {
  LEGACY_TARGET_KEY,
  TARGETS_KEY,
  migrateTargets,
  sanitizeTargets,
  type TentFinderTarget,
} from "@/lib/tentFinderTargets";
import { cn } from "@/lib/utils";
import { useI18n, useT } from "@/i18n";
import { LOCALE_TAGS } from "@shared/i18n";
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
const FALLBACK_CENTER: L.LatLngTuple = [46.8, 8.2];
const FALLBACK_ZOOM = 8;

/** Runder Zelt-Marker als divIcon – keine Bild-Assets nötig (Bundler-sicher). */
const spotIcon = L.divIcon({
  className: "",
  html: `<svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#2f6b4f" stroke="#ffffff" stroke-width="2.5"/><path d="M14 8.5 20 19h-4.2L14 15.8 12.2 19H8Z" fill="#ffffff"/></svg>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

/** Zelt-Finder-Ziel als bernsteinfarbener Fadenkreuz-Marker (gleiches divIcon-Muster). */
const targetIcon = L.divIcon({
  className: "",
  html: `<svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#b45309" stroke="#ffffff" stroke-width="2.5"/><circle cx="14" cy="14" r="3" fill="#ffffff"/><path d="M14 5.5v4M14 18.5v4M5.5 14h4M18.5 14h4" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/></svg>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

/** Entdeckter OSM-Campingplatz: blauer Kreis mit Zelt-Umriss (dritte Farbe). */
const campsiteIcon = L.divIcon({
  className: "",
  html: `<svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#0369a1" stroke="#ffffff" stroke-width="2.5"/><path d="M14 8.5 20 19h-4.2L14 15.8 12.2 19H8Z" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

/** Natur-Beobachtung: violetter Kreis mit Pfoten-Punkten (vierte Farbe). */
const sightingIcon = L.divIcon({
  className: "",
  html: `<svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#7c3aed" stroke="#ffffff" stroke-width="2.5"/><ellipse cx="14" cy="16.5" rx="3.4" ry="2.9" fill="#ffffff"/><circle cx="9.6" cy="12.4" r="1.7" fill="#ffffff"/><circle cx="13" cy="10.4" r="1.7" fill="#ffffff"/><circle cx="16.8" cy="10.9" r="1.7" fill="#ffffff"/><circle cx="19.4" cy="13.7" r="1.6" fill="#ffffff"/></svg>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

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
  nightsBySpotId,
}: {
  spots: SpotPin[];
  targets: TentFinderTarget[];
  sightings: SightingPin[];
  nightsBySpotId: Map<number, number>;
}) {
  const t = useT();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const campLayerRef = useRef<L.LayerGroup | null>(null);
  const didFitRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const popupJustClosedRef = useRef(0);

  // Karten-Klick auf freie Stelle: Vorschlag für einen neuen Favoriten
  const [proposed, setProposed] = useState<{ lat: number; lon: number } | null>(
    null
  );
  const [newName, setNewName] = useState("");

  // Basis-Layer «Karte / Satellit» – Wahl bleibt in localStorage erhalten
  const [layerKind, setLayerKind] = useState<MapLayerKind>(loadMapLayer);

  // Entdecker-Layer: Zustand der Overpass-Suche (Standard AUS)
  const [discoverOn, setDiscoverOn] = useState(false);
  const [campsites, setCampsites] = useState<OsmCampsite[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverError, setDiscoverError] = useState(false);
  const [needsZoom, setNeedsZoom] = useState(false);
  const [searched, setSearched] = useState(false);
  const [moved, setMoved] = useState(false);

  // Karte einmalig initialisieren und beim Verlassen sauber abbauen
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: FALLBACK_CENTER,
      zoom: FALLBACK_ZOOM,
      scrollWheelZoom: true,
    });
    // Der Basis-Layer (Karte/Satellit) kommt aus dem eigenen Effect darunter –
    // so lässt er sich später tauschen, ohne die Karte neu aufzubauen.
    markersRef.current = L.layerGroup().addTo(map);
    campLayerRef.current = L.layerGroup().addTo(map);
    // Klick auf freie Kartenstelle → Dialog «Favorit hier anlegen?».
    // Marker/Popups schlucken ihre Klicks selbst, Panning feuert kein click.
    // Ein Klick, der gerade erst ein Popup geschlossen hat, soll aber nur
    // schliessen – deshalb der kurze Zeit-Abstand zu popupclose.
    map.on("popupclose", () => {
      popupJustClosedRef.current = Date.now();
    });
    map.on("click", (event: L.LeafletMouseEvent) => {
      if (Date.now() - popupJustClosedRef.current < 200) return;
      setProposed({ lat: event.latlng.lat, lon: event.latlng.lng });
    });
    mapRef.current = map;
    return () => {
      abortRef.current?.abort();
      map.remove();
      mapRef.current = null;
      baseLayerRef.current = null;
      markersRef.current = null;
      campLayerRef.current = null;
    };
  }, []);

  // Basis-Layer (Karte/Satellit) setzen bzw. tauschen – erst hinzufügen,
  // dann den alten entfernen, damit die Karte nie «leer» aufblitzt.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const next = createBaseLayer(L, layerKind).addTo(map);
    baseLayerRef.current?.remove();
    baseLayerRef.current = next;
  }, [layerKind]);

  /** Umschalter «Karte / Satellit»: Wahl merken und Layer tauschen. */
  const switchLayer = useCallback((kind: MapLayerKind) => {
    setLayerKind(kind);
    storeMapLayer(kind);
  }, []);

  /** Overpass für den aktuellen Ausschnitt abfragen (nie automatisch beim Verschieben). */
  const searchHere = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;
    setMoved(false);
    if (map.getZoom() < OVERPASS_MIN_ZOOM) {
      setNeedsZoom(true);
      setDiscoverError(false);
      return;
    }
    setNeedsZoom(false);
    setDiscoverError(false);
    setDiscoverLoading(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const b = map.getBounds();
    try {
      const res = await fetch(OVERPASS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(
          overpassQuery(b.getSouth(), b.getWest(), b.getNorth(), b.getEast())
        )}`,
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`overpass ${res.status}`);
      const json: unknown = await res.json();
      setCampsites(parseCampsites(json));
      setSearched(true);
      setDiscoverLoading(false);
    } catch {
      if (controller.signal.aborted) return;
      setDiscoverLoading(false);
      setDiscoverError(true);
    }
  }, []);

  /** Toggle-Chip: Einschalten sucht sofort, Ausschalten räumt alles weg. */
  const toggleDiscover = useCallback(() => {
    setDiscoverOn(prev => {
      const next = !prev;
      if (next) {
        void searchHere();
      } else {
        abortRef.current?.abort();
        setCampsites([]);
        setDiscoverLoading(false);
        setDiscoverError(false);
        setNeedsZoom(false);
        setSearched(false);
        setMoved(false);
      }
      return next;
    });
  }, [searchHere]);

  // Kartenbewegung merken: statt automatisch neu zu laden, zeigen wir den Such-Button
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !discoverOn) return;
    const onMove = () => setMoved(true);
    map.on("moveend", onMove);
    map.on("zoomend", onMove);
    return () => {
      map.off("moveend", onMove);
      map.off("zoomend", onMove);
    };
  }, [discoverOn]);

  // Pins nachführen, sobald Plätze oder Übernachtungszahlen ändern
  useEffect(() => {
    const map = mapRef.current;
    const layer = markersRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    spots.forEach(spot => {
      const marker = L.marker([spot.latitude, spot.longitude], {
        icon: spotIcon,
        alt: spot.name,
      });
      // Popup-Inhalt per DOM aufbauen: Platzname ist Nutzertext (kein innerHTML)
      const popup = document.createElement("div");
      popup.className = "space-y-1";
      const name = document.createElement("p");
      name.className = "font-semibold";
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
      link.className = "block text-sm font-medium underline";
      link.addEventListener("click", event => {
        event.preventDefault();
        navigate(`/zeltplaetze/${spot.id}`);
      });
      popup.appendChild(link);
      // Anreise-Route: externer Karten-Link (Apple/Google je nach Gerät)
      const route = document.createElement("a");
      route.href = directionsUrl(spot.latitude, spot.longitude);
      route.target = "_blank";
      route.rel = "noopener noreferrer";
      route.textContent = t.mapView.routeLink;
      route.className = "block text-sm font-medium underline";
      popup.appendChild(route);
      marker.bindPopup(popup);
      marker.addTo(layer);
    });

    // Zelt-Finder-Ziele als eigene Pins – Popup mit «Anpeilen»-Link
    targets.forEach(tgt => {
      const marker = L.marker([tgt.lat, tgt.lon], {
        icon: targetIcon,
        alt: tgt.name,
      });
      const popup = document.createElement("div");
      popup.className = "space-y-1";
      const name = document.createElement("p");
      name.className = "font-semibold";
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
      marker.addTo(layer);
    });

    // Natur-Beobachtungen mit Koordinaten als eigene (violette) Pins –
    // Popup mit Titel und Beobachtungs-Datum.
    sightings.forEach(sighting => {
      const marker = L.marker([sighting.lat, sighting.lon], {
        icon: sightingIcon,
        alt: sighting.title,
      });
      const popup = document.createElement("div");
      popup.className = "space-y-1";
      const name = document.createElement("p");
      name.className = "font-semibold";
      name.textContent = sighting.title;
      popup.appendChild(name);
      const kind = document.createElement("p");
      kind.className = "text-xs";
      kind.textContent = `${t.mapView.sightingKind} · ${sighting.dateLabel}`;
      popup.appendChild(kind);
      marker.bindPopup(popup);
      marker.addTo(layer);
    });

    // Nur beim ersten Aufbau einpassen – spätere Refetches (z. B. nach dem
    // Übernehmen eines OSM-Platzes) sollen den Ausschnitt nicht verspringen.
    if (!didFitRef.current) {
      didFitRef.current = true;
      const points: L.LatLngTuple[] = [
        ...spots.map(s => [s.latitude, s.longitude] as L.LatLngTuple),
        ...targets.map(tgt => [tgt.lat, tgt.lon] as L.LatLngTuple),
      ];
      if (points.length > 0) {
        map.fitBounds(L.latLngBounds(points), {
          padding: [40, 40],
          maxZoom: 13,
        });
      } else {
        map.setView(FALLBACK_CENTER, FALLBACK_ZOOM);
      }
    }
  }, [spots, targets, sightings, nightsBySpotId, t, navigate]);

  // Entdeckte OSM-Campingplätze als eigene (blaue) Pins nachführen
  useEffect(() => {
    const map = mapRef.current;
    const layer = campLayerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    campsites.forEach(site => {
      // Bereits übernommene Plätze nicht doppelt zeigen – dort steht nach dem
      // Refetch der grüne Favoriten-Pin.
      if (isNearFavorite(site, spots)) return;
      const displayName = site.name ?? t.mapView.osmFallbackName;
      const marker = L.marker([site.lat, site.lon], {
        icon: campsiteIcon,
        alt: displayName,
      });
      const popup = document.createElement("div");
      popup.className = "space-y-1";
      const name = document.createElement("p");
      name.className = "font-semibold";
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
          map.closePopup();
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
      marker.addTo(layer);
    });
  }, [campsites, spots, t, utils]);

  const visibleCampsites = useMemo(
    () => campsites.filter(site => !isNearFavorite(site, spots)),
    [campsites, spots]
  );

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
          onClick={toggleDiscover}
          aria-pressed={discoverOn}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            discoverOn
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <Compass className="h-3.5 w-3.5" aria-hidden="true" />
          {t.mapView.discoverToggle}
        </button>
        {discoverOn && (
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
      </div>
      <div className="relative">
        <div
          ref={containerRef}
          role="region"
          aria-label={t.mapView.mapAria}
          className="h-[65vh] min-h-80 w-full rounded-xl border border-border"
        />
        {discoverOn && moved && !discoverLoading && (
          <button
            type="button"
            onClick={() => void searchHere()}
            className="absolute left-1/2 top-3 z-[1000] flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-medium shadow-md hover:bg-muted"
          >
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            {t.mapView.discoverSearchHere}
          </button>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Tent className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          {t.mapView.legend(spots.length)}
        </span>
        {targets.length > 0 && (
          <span className="flex items-center gap-1.5">
            <LocateFixed
              className="h-3.5 w-3.5 text-amber-glow"
              aria-hidden="true"
            />
            {t.mapView.targetLegend(targets.length)}
          </span>
        )}
        {sightings.length > 0 && (
          <span className="flex items-center gap-1.5">
            <PawPrint
              className="h-3.5 w-3.5 text-violet-700 dark:text-violet-400"
              aria-hidden="true"
            />
            {t.mapView.sightingLegend(sightings.length)}
          </span>
        )}
        {discoverOn && visibleCampsites.length > 0 && (
          <span className="flex items-center gap-1.5">
            <Compass
              className="h-3.5 w-3.5 text-sky-700 dark:text-sky-400"
              aria-hidden="true"
            />
            {t.mapView.discoverLegend(visibleCampsites.length)}
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
          dateLabel: new Date(`${s.sightedAt}T00:00:00`).toLocaleDateString(
            LOCALE_TAGS[lang],
            { day: "numeric", month: "long", year: "numeric" }
          ),
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
            nightsBySpotId={nightsBySpotId}
          />
        </>
      )}
    </div>
  );
}
