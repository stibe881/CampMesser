import { useEffect, useMemo, useState } from "react";
import {
  Compass,
  Loader2,
  LocateFixed,
  MapPin,
  Tent,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useDeviceHeading } from "@/hooks/useDeviceHeading";
import { useSyncedSetting } from "@/lib/useSyncedSetting";
import {
  LEGACY_TARGET_KEY,
  MAX_NAME_LENGTH,
  MAX_TARGETS,
  TARGETS_KEY,
  migrateTargets,
  newTargetId,
  sanitizeTargets,
  type TentFinderTarget,
} from "@/lib/tentFinderTargets";
import { bearingDegrees, distanceMeters } from "@shared/geo";
import { compassDirection } from "@shared/solar";
import { LOCALE_TAGS, type Language } from "@shared/i18n";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

/**
 * Zelt-Finder: Kompass-Peilung und Distanz zu beliebig vielen benannten
 * Zielen (Zelt, Duschen, Abwaschstelle …) oder zu einem gespeicherten
 * Zeltplatz. Funktioniert offline (reine Geometrie, GPS + Sensoren) –
 * nur Zeltplatz-Liste und Geräte-Sync laufen über den Server.
 */

function storeTargets(targets: TentFinderTarget[]) {
  try {
    localStorage.setItem(TARGETS_KEY, JSON.stringify(targets));
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

  // Benannte Ziele laden; altes Einzel-Ziel wird einmalig als «Zelt» übernommen
  const [targets, setTargets] = useState<TentFinderTarget[]>(() => {
    try {
      const { targets: initial, changed } = migrateTargets(
        localStorage.getItem(TARGETS_KEY),
        localStorage.getItem(LEGACY_TARGET_KEY),
        t.tentFinder.suggestionTent
      );
      if (changed) {
        storeTargets(initial);
        localStorage.removeItem(LEGACY_TARGET_KEY);
      }
      return initial;
    } catch {
      return [];
    }
  });

  // Geräte-Sync: Ziele vom Konto übernehmen bzw. Änderungen hochladen
  const targetsSync = useSyncedSetting<TentFinderTarget[]>(
    "tentFinderTargets",
    value => {
      const clean = sanitizeTargets(value);
      setTargets(clean);
      storeTargets(clean);
    }
  );

  const saveTargets = (next: TentFinderTarget[]) => {
    setTargets(next);
    storeTargets(next);
    targetsSync.push(next);
  };

  // ?spot=<id> wählt den Zeltplatz aus dem Dossier vor,
  // ?target=<id> ein eigenes Ziel (z. B. von der Karte der Plätze)
  const [selection, setSelection] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const spotParam = params.get("spot");
    if (spotParam) return `spot:${spotParam}`;
    const targetParam = params.get("target");
    return targetParam ? `target:${targetParam}` : null;
  });
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
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

  // Ohne explizite Wahl: zuletzt gespeichertes eigenes Ziel anpeilen
  const effectiveSelection =
    selection ??
    (targets.length > 0 ? `target:${targets[targets.length - 1].id}` : null);

  const target = useMemo<{
    name: string;
    lat: number;
    lon: number;
  } | null>(() => {
    if (effectiveSelection?.startsWith("target:")) {
      const id = effectiveSelection.slice(7);
      const own = targets.find(x => x.id === id);
      return own ? { name: own.name, lat: own.lat, lon: own.lon } : null;
    }
    if (effectiveSelection?.startsWith("spot:")) {
      const id = Number(effectiveSelection.slice(5));
      const spot = spots.find(s => s.id === id);
      return spot
        ? { name: spot.name, lat: spot.latitude, lon: spot.longitude }
        : null;
    }
    return null;
  }, [effectiveSelection, targets, spots]);

  const saveHere = () => {
    const name = newName.trim().slice(0, MAX_NAME_LENGTH);
    if (!name) {
      toast.error(t.tentFinder.nameMissing);
      return;
    }
    if (targets.length >= MAX_TARGETS) {
      toast.error(t.tentFinder.tooMany);
      return;
    }
    if (!navigator.geolocation) {
      toast.error(t.tentFinder.geoUnsupported);
      return;
    }
    setSaving(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const next: TentFinderTarget = {
          id: newTargetId(),
          name,
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          savedAt: Date.now(),
        };
        saveTargets([...targets, next]);
        setSelection(`target:${next.id}`);
        setNewName("");
        setSaving(false);
        toast.success(t.tentFinder.savedToast(name));
      },
      () => {
        setSaving(false);
        toast.error(t.tentFinder.rememberFailed);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const deleteTarget = (doomed: TentFinderTarget) => {
    if (!confirm(t.tentFinder.deleteConfirm(doomed.name))) return;
    saveTargets(targets.filter(x => x.id !== doomed.id));
    if (selection === `target:${doomed.id}`) setSelection(null);
    toast.success(t.tentFinder.deletedToast(doomed.name));
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

  const suggestions = [
    t.tentFinder.suggestionTent,
    t.tentFinder.suggestionShowers,
    t.tentFinder.suggestionWc,
    t.tentFinder.suggestionDishes,
    t.tentFinder.suggestionPlayground,
    t.tentFinder.suggestionReception,
  ];

  const optionRow = (value: string, name: string, lat: number, lon: number) => {
    const active = effectiveSelection === value;
    const dist = fix ? distanceMeters(fix.lat, fix.lon, lat, lon) : null;
    return (
      <button
        type="button"
        onClick={() => setSelection(value)}
        aria-pressed={active}
        className={cn(
          "flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
          active
            ? "border-primary bg-primary/10 font-medium"
            : "border-border hover:bg-muted"
        )}
      >
        <span className="truncate">{name}</span>
        {dist !== null && (
          <span className="shrink-0 font-mono text-xs text-muted-foreground">
            {formatDistance(dist, lang)}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="container max-w-xl py-6">
      <PageHeader title={t.tentFinder.title} subtitle={t.tentFinder.subtitle} />

      {/* Ziel wählen */}
      <Card className="mb-4">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center gap-2">
            <Tent className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="text-sm font-semibold">
              {t.tentFinder.targetTitle}
            </span>
          </div>

          {targets.length === 0 && spots.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {t.tentFinder.empty}
            </p>
          )}

          {targets.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                {t.tentFinder.ownTargetsTitle}
              </p>
              <ul className="space-y-1.5">
                {targets.map(tgt => (
                  <li key={tgt.id} className="flex items-center gap-1.5">
                    {optionRow(`target:${tgt.id}`, tgt.name, tgt.lat, tgt.lon)}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label={t.tentFinder.deleteAria(tgt.name)}
                      onClick={() => deleteTarget(tgt)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {spots.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                {t.tentFinder.spotsTitle}
              </p>
              <ul className="space-y-1.5">
                {spots.map(s => (
                  <li key={s.id} className="flex">
                    {optionRow(`spot:${s.id}`, s.name, s.latitude, s.longitude)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!target && (targets.length > 0 || spots.length > 0) && (
            <p className="text-sm text-muted-foreground">
              {t.tentFinder.noTarget}
            </p>
          )}

          {/* Aktuellen Standort unter eigenem Namen speichern */}
          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-sm font-medium">{t.tentFinder.addTitle}</p>
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              maxLength={MAX_NAME_LENGTH}
              placeholder={t.tentFinder.namePlaceholder}
              aria-label={t.tentFinder.nameAria}
            />
            <div
              className="flex flex-wrap gap-1.5"
              role="group"
              aria-label={t.tentFinder.suggestionsAria}
            >
              {suggestions.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setNewName(s)}
                  className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs transition-colors hover:bg-accent"
                >
                  {s}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={saveHere}
            >
              {saving ? (
                <Loader2
                  className="mr-1.5 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <LocateFixed className="mr-1.5 h-4 w-4" aria-hidden="true" />
              )}
              {saving ? t.tentFinder.remembering : t.tentFinder.saveButton}
            </Button>
            {!isAuthenticated && (
              <p className="text-xs text-muted-foreground">
                {t.tentFinder.loginHint}
              </p>
            )}
          </div>
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
