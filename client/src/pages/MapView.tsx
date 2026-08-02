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
 * Tagebuch-Einträge mit reinem Freitext-Ort haben keine Koordinaten und
 * erscheinen deshalb nicht als eigene Pins.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { LocateFixed, MapPin, Tent } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import PageHeader from "@/components/PageHeader";
import LoginPrompt from "@/components/LoginPrompt";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useSyncedSetting } from "@/lib/useSyncedSetting";
import {
  LEGACY_TARGET_KEY,
  TARGETS_KEY,
  migrateTargets,
  sanitizeTargets,
  type TentFinderTarget,
} from "@/lib/tentFinderTargets";
import { useT } from "@/i18n";
import { tripNights } from "@shared/trips";

interface SpotPin {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
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

function SpotsMap({
  spots,
  targets,
  nightsBySpotId,
}: {
  spots: SpotPin[];
  targets: TentFinderTarget[];
  nightsBySpotId: Map<number, number>;
}) {
  const t = useT();
  const [, navigate] = useLocation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Karte einmalig initialisieren und beim Verlassen sauber abbauen
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: FALLBACK_CENTER,
      zoom: FALLBACK_ZOOM,
      scrollWheelZoom: true,
    });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, []);

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
      link.className = "text-sm font-medium underline";
      link.addEventListener("click", event => {
        event.preventDefault();
        navigate(`/zeltplaetze/${spot.id}`);
      });
      popup.appendChild(link);
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

    const points: L.LatLngTuple[] = [
      ...spots.map(s => [s.latitude, s.longitude] as L.LatLngTuple),
      ...targets.map(tgt => [tgt.lat, tgt.lon] as L.LatLngTuple),
    ];
    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 13 });
    } else {
      map.setView(FALLBACK_CENTER, FALLBACK_ZOOM);
    }
  }, [spots, targets, nightsBySpotId, t, navigate]);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={t.mapView.mapAria}
      className="h-[65vh] min-h-80 w-full rounded-xl border border-border"
    />
  );
}

export default function MapViewPage() {
  const t = useT();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: spots, isLoading: spotsLoading } = trpc.spots.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: trips } = trpc.trips.list.useQuery(undefined, {
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
            nightsBySpotId={nightsBySpotId}
          />
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Tent className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              {t.mapView.legend(spotPins.length)}
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
          </div>
        </>
      )}
    </div>
  );
}
