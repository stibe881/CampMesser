/**
 * Karten-Seite /karte (#574 aufgeteilt): Die Seite holt die Daten (Favoriten,
 * Reisen, Ziele, Beobachtungen, Merkorte, Ausflüge), reicht sie an die
 * Karten-Komponente weiter und zeigt darunter die Merkorte-Verwaltungsliste
 * (#563). Die Karte selbst (Pins, Ebenen, Cluster, Popups, Dialoge) wohnt in
 * components/map/SpotsMap.tsx, das Pin-Vokabular in components/map/mapPins.ts.
 */
import { useMemo, useState } from "react";
import { fmtLong } from "@/lib/dateFormat";
import { Link, useSearch } from "wouter";
import { MapPin, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import LoginPrompt from "@/components/LoginPrompt";
import { Button } from "@/components/ui/button";
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
import { useI18n } from "@/i18n";
import {
  SAVED_PLACE_COLOR_HEX,
  normalizeSavedPlaceColor,
} from "@shared/savedPlaces";
import { distanceMeters } from "@shared/geo";
import { type Excursion } from "@shared/excursions";
import { tripNights } from "@shared/trips";
import SpotsMap from "@/components/map/SpotsMap";
import { type SpotPin, type SightingPin } from "@/components/map/mapPins";

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
  // Merkorte (#537) – Wunschziele mit eigener Pin-Farbe
  const { data: savedPlacesData } = trpc.savedPlaces.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  // Verwaltungsliste (#563): Distanz von zuhause, Sprung zum Pin
  const { data: home } = trpc.home.get.useQuery(undefined, {
    enabled: isAuthenticated && (savedPlacesData?.length ?? 0) > 0,
    staleTime: 5 * 60_000,
  });
  const [focusPoint, setFocusPoint] = useState<{
    lat: number;
    lon: number;
    nonce: number;
  } | null>(null);
  const utils = trpc.useUtils();
  const removePlaceMutation = trpc.savedPlaces.remove.useMutation({
    onSuccess: () => {
      toast.success(t.mapView.savedPlaceDeleted);
      void utils.savedPlaces.list.invalidate();
    },
    onError: () => toast.error(t.common.actionFailed),
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
            savedPlaces={savedPlacesData ?? []}
            focusPoint={focusPoint}
          />

          {/* Merkorte-Verwaltungsliste (#563): Bei vielen Sternen skaliert
              die Karte allein nicht mehr – hier stehen alle mit Farbe,
              Notiz und Distanz von zuhause; Klick fährt die Karte hin. */}
          {(savedPlacesData?.length ?? 0) > 0 && (
            <Card className="mt-4">
              <CardContent className="py-4">
                <h2 className="mb-2 flex items-center gap-2 font-serif text-base font-semibold">
                  <Star className="h-4 w-4 text-primary" aria-hidden="true" />
                  {t.mapView.savedPlacesListTitle}
                </h2>
                <ul className="space-y-1">
                  {(savedPlacesData ?? []).map(place => {
                    const distanceKm = home
                      ? distanceMeters(
                          home.latitude,
                          home.longitude,
                          place.latitude,
                          place.longitude
                        ) / 1000
                      : null;
                    return (
                      <li
                        key={place.id}
                        className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2"
                      >
                        <button
                          type="button"
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                          aria-label={t.mapView.savedPlacesListAria(place.name)}
                          onClick={() =>
                            setFocusPoint({
                              lat: place.latitude,
                              lon: place.longitude,
                              nonce: Date.now(),
                            })
                          }
                        >
                          <span
                            className="h-3 w-3 shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                SAVED_PLACE_COLOR_HEX[
                                  normalizeSavedPlaceColor(place.color)
                                ],
                            }}
                            aria-hidden="true"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">
                              {place.name}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {[
                                place.note || null,
                                distanceKm !== null
                                  ? t.mapView.savedPlacesDistance(
                                      `${Math.round(distanceKm)} km`
                                    )
                                  : null,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          </span>
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground/60 hover:text-destructive"
                          disabled={removePlaceMutation.isPending}
                          onClick={() =>
                            removePlaceMutation.mutate({ id: place.id })
                          }
                          aria-label={t.mapView.savedPlaceDelete}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
