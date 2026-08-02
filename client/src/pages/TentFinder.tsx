import { useEffect, useMemo, useState } from "react";
import { Compass, Loader2, LocateFixed, MapPin, Tent } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useDeviceHeading } from "@/hooks/useDeviceHeading";
import { bearingDegrees, distanceMeters } from "@shared/geo";
import { compassDirection } from "@shared/solar";
import { LOCALE_TAGS, type Language } from "@shared/i18n";
import { useI18n } from "@/i18n";

/**
 * Zelt-Finder: Kompass-Peilung und Distanz zum gespeicherten Zeltplatz oder
 * zu einem lokal gemerkten Standort. Funktioniert offline (reine Geometrie,
 * GPS + Sensoren) – nur die Zeltplatz-Liste kommt per tRPC.
 */

const TARGET_KEY = "campmesser.tentFinderTarget";

interface SavedTarget {
  lat: number;
  lon: number;
  savedAt: number;
}

function loadSavedTarget(): SavedTarget | null {
  try {
    const raw = localStorage.getItem(TARGET_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedTarget;
    if (
      typeof parsed?.lat === "number" &&
      typeof parsed?.lon === "number" &&
      Number.isFinite(parsed.lat) &&
      Number.isFinite(parsed.lon)
    ) {
      return parsed;
    }
  } catch {
    /* kein gemerktes Ziel */
  }
  return null;
}

function storeSavedTarget(target: SavedTarget) {
  try {
    localStorage.setItem(TARGET_KEY, JSON.stringify(target));
  } catch {
    /* Sitzung reicht */
  }
}

/** Distanz formatieren: unter 1 km in Metern, sonst km mit einer Nachkommastelle. */
function formatDistance(meters: number, lang: Language): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = new Intl.NumberFormat(LOCALE_TAGS[lang], {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(meters / 1000);
  return `${km} km`;
}

interface GeoState {
  status: "loading" | "ok" | "error";
  lat?: number;
  lon?: number;
  accuracy?: number;
  /** Bewegungsrichtung aus dem GPS (0 = Nord), null wenn stehend/unbekannt. */
  moveHeading?: number | null;
  errorKey?: "geoUnsupported" | "geoDenied" | "geoFailed";
}

export default function TentFinderPage() {
  const { lang, t } = useI18n();
  const { isAuthenticated } = useAuth();
  const spotsQuery = trpc.spots.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const spots = spotsQuery.data ?? [];

  const [savedTarget, setSavedTarget] = useState<SavedTarget | null>(() =>
    loadSavedTarget()
  );
  // ?spot=<id> wählt den Zeltplatz aus dem Dossier vor
  const [selection, setSelection] = useState<string | null>(() => {
    const spotParam = new URLSearchParams(window.location.search).get("spot");
    return spotParam ? `spot:${spotParam}` : null;
  });
  const [remembering, setRemembering] = useState(false);
  const [geo, setGeo] = useState<GeoState>({ status: "loading" });
  const { heading, permission, start } = useDeviceHeading();

  // Kompass direkt starten (Android/Desktop); iOS verlangt den Button unten
  useEffect(() => {
    void start();
  }, [start]);

  // Eigene Position laufend verfolgen – hohe Genauigkeit fürs Peilen
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeo({ status: "error", errorKey: "geoUnsupported" });
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      pos =>
        setGeo({
          status: "ok",
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          moveHeading:
            pos.coords.heading !== null && Number.isFinite(pos.coords.heading)
              ? pos.coords.heading
              : null,
        }),
      err =>
        setGeo({
          status: "error",
          errorKey:
            err.code === err.PERMISSION_DENIED ? "geoDenied" : "geoFailed",
        }),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const effectiveSelection = selection ?? (savedTarget ? "saved" : null);

  const target = useMemo<{
    name: string;
    lat: number;
    lon: number;
  } | null>(() => {
    if (effectiveSelection === "saved") {
      return savedTarget
        ? {
            name: t.tentFinder.savedTarget,
            lat: savedTarget.lat,
            lon: savedTarget.lon,
          }
        : null;
    }
    if (effectiveSelection?.startsWith("spot:")) {
      const id = Number(effectiveSelection.slice(5));
      const spot = spots.find(s => s.id === id);
      return spot
        ? { name: spot.name, lat: spot.latitude, lon: spot.longitude }
        : null;
    }
    return null;
  }, [effectiveSelection, savedTarget, spots, t]);

  const rememberHere = () => {
    if (!navigator.geolocation) {
      toast.error(t.tentFinder.geoUnsupported);
      return;
    }
    setRemembering(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const next: SavedTarget = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          savedAt: Date.now(),
        };
        storeSavedTarget(next);
        setSavedTarget(next);
        setSelection("saved");
        setRemembering(false);
        toast.success(t.tentFinder.rememberSaved);
      },
      () => {
        setRemembering(false);
        toast.error(t.tentFinder.rememberFailed);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Peilung und Distanz (reine Geometrie – offline verfügbar)
  const fix =
    geo.status === "ok" && geo.lat !== undefined && geo.lon !== undefined
      ? { lat: geo.lat, lon: geo.lon }
      : null;
  const distance =
    fix && target
      ? distanceMeters(fix.lat, fix.lon, target.lat, target.lon)
      : null;
  const bearing =
    fix && target
      ? bearingDegrees(fix.lat, fix.lon, target.lat, target.lon)
      : null;

  // Nordreferenz: Kompass des Geräts, sonst Bewegungsrichtung aus dem GPS
  const usedHeading = heading ?? geo.moveHeading ?? null;
  const rotation =
    bearing !== null && usedHeading !== null
      ? (bearing - usedHeading + 360) % 360
      : null;
  const usingMovement = heading === null && geo.moveHeading !== null;

  const directionLabel =
    bearing !== null ? compassDirection(bearing, lang) : null;
  const distanceLabel =
    distance !== null ? formatDistance(distance, lang) : null;

  const selectOptions: { value: string; label: string }[] = [
    ...(savedTarget
      ? [{ value: "saved", label: t.tentFinder.savedTarget }]
      : []),
    ...spots.map(s => ({ value: `spot:${s.id}`, label: s.name })),
  ];

  return (
    <div className="container max-w-xl py-6">
      <PageHeader title={t.tentFinder.title} subtitle={t.tentFinder.subtitle} />

      {/* Ziel wählen */}
      <Card className="mb-4">
        <CardContent className="space-y-3 pt-6">
          <div className="flex items-center gap-2">
            <Tent className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="text-sm font-semibold">
              {t.tentFinder.targetTitle}
            </span>
          </div>
          {selectOptions.length > 0 && (
            <div>
              <Label className="sr-only" htmlFor="tent-finder-target">
                {t.tentFinder.targetSelectAria}
              </Label>
              <Select
                value={effectiveSelection ?? undefined}
                onValueChange={setSelection}
              >
                <SelectTrigger
                  id="tent-finder-target"
                  aria-label={t.tentFinder.targetSelectAria}
                >
                  <SelectValue placeholder={t.tentFinder.targetSelectAria} />
                </SelectTrigger>
                <SelectContent>
                  {selectOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {savedTarget && (
            <p className="text-xs text-muted-foreground">
              {t.tentFinder.savedTargetInfo(
                new Date(savedTarget.savedAt).toLocaleString(
                  LOCALE_TAGS[lang],
                  {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )
              )}{" "}
              · {savedTarget.lat.toFixed(4)}°, {savedTarget.lon.toFixed(4)}°
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={remembering}
            onClick={rememberHere}
          >
            {remembering ? (
              <Loader2
                className="mr-1.5 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <LocateFixed className="mr-1.5 h-4 w-4" aria-hidden="true" />
            )}
            {remembering
              ? t.tentFinder.remembering
              : t.tentFinder.rememberButton}
          </Button>
          {!isAuthenticated && (
            <p className="text-xs text-muted-foreground">
              {t.tentFinder.loginHint}
            </p>
          )}
          {!target && (
            <p className="text-sm text-muted-foreground">
              {t.tentFinder.noTarget}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Peilung */}
      {target && (
        <Card>
          <CardContent className="flex flex-col items-center pt-6">
            <p className="mb-4 flex items-center gap-1.5 text-sm font-medium">
              <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
              {target.name}
            </p>

            {geo.status === "error" && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {geo.errorKey === "geoUnsupported"
                  ? t.tentFinder.geoUnsupported
                  : geo.errorKey === "geoDenied"
                    ? t.tentFinder.geoDenied
                    : t.tentFinder.geoFailed}
              </p>
            )}

            {geo.status === "loading" && (
              <p className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                {t.tentFinder.geoWaiting}
              </p>
            )}

            {geo.status === "ok" &&
              distance !== null &&
              directionLabel !== null &&
              distanceLabel !== null && (
                <>
                  {/* Pfeil-Anzeige (mit Text-Alternative darunter) */}
                  <div
                    role="img"
                    aria-label={t.tentFinder.arrowAria(
                      directionLabel,
                      distanceLabel
                    )}
                    className="relative flex h-56 w-56 items-center justify-center rounded-full border-2 border-border bg-card shadow-inner"
                  >
                    {rotation !== null ? (
                      <svg
                        viewBox="0 0 100 100"
                        className="h-36 w-36 text-primary transition-transform duration-150 ease-out"
                        style={{ transform: `rotate(${rotation}deg)` }}
                        aria-hidden="true"
                      >
                        <path
                          d="M50 6 L74 78 L50 62 L26 78 Z"
                          fill="currentColor"
                        />
                      </svg>
                    ) : (
                      <span
                        className="font-serif text-5xl font-bold text-primary"
                        aria-hidden="true"
                      >
                        {directionLabel}
                      </span>
                    )}
                  </div>

                  <p className="mt-5 font-mono text-3xl font-bold">
                    {distanceLabel}
                  </p>
                  {/* Textliche Alternative zum Pfeil */}
                  <p className="mt-1 text-center text-sm text-muted-foreground">
                    {t.tentFinder.directionText(directionLabel, distanceLabel)}
                  </p>
                  {distance < 25 && (
                    <p className="mt-3 rounded-lg bg-primary/10 px-4 py-2.5 text-center text-sm font-semibold text-primary">
                      {t.tentFinder.arrived}
                    </p>
                  )}
                  {geo.accuracy !== undefined && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {t.tentFinder.accuracyInfo(Math.round(geo.accuracy))}
                    </p>
                  )}

                  {/* Kompass-Status und Fallback-Hinweise */}
                  {heading === null && permission === "denied" && (
                    <div className="mt-4 flex flex-col items-center gap-2 text-center">
                      <p className="text-xs text-muted-foreground">
                        {t.tentFinder.compassActivateHint}
                      </p>
                      <Button size="sm" onClick={() => void start()}>
                        <Compass
                          className="mr-1.5 h-4 w-4"
                          aria-hidden="true"
                        />
                        {t.tentFinder.compassActivate}
                      </Button>
                    </div>
                  )}
                  {usingMovement && (
                    <p className="mt-4 text-center text-xs text-muted-foreground">
                      {t.tentFinder.movementHint}
                    </p>
                  )}
                  {heading === null &&
                    geo.moveHeading === null &&
                    permission !== "denied" && (
                      <p className="mt-4 text-center text-xs text-muted-foreground">
                        {t.tentFinder.noCompassHint}
                      </p>
                    )}
                </>
              )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
