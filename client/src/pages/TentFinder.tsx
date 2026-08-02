import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Compass,
  Loader2,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Pencil,
  Tent,
  Trash2,
} from "lucide-react";
import type * as Leaflet from "leaflet";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeviceHeading } from "@/hooks/useDeviceHeading";
import { useSyncedSetting } from "@/lib/useSyncedSetting";
import {
  LEGACY_TARGET_KEY,
  MAX_NAME_LENGTH,
  MAX_TARGETS,
  TARGETS_KEY,
  migrateTargets,
  newTargetId,
  renameTarget,
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
 * Zielen (Zelt, Duschen, Abwaschstelle …). Funktioniert offline
 * (reine Geometrie, GPS + Sensoren) – nur der Geräte-Sync der Ziele
 * läuft über den Server.
 */

function storeTargets(targets: TentFinderTarget[]) {
  try {
    localStorage.setItem(TARGETS_KEY, JSON.stringify(targets));
  } catch {
    /* Sitzung reicht */
  }
}

/** Merkt sich, ob die Mini-Karte auf- oder eingeklappt ist (Standard: zu). */
const MAP_OPEN_KEY = "campmesser.tentFinderMap";

/** Schweiz als Ausgangs-Ausschnitt, solange weder Position noch Ziele da sind. */
const MAP_FALLBACK_CENTER: Leaflet.LatLngTuple = [46.8, 8.2];
const MAP_FALLBACK_ZOOM = 8;

/**
 * Ziel-Pin als divIcon (keine Bild-Assets nötig – Muster MapView): das aktive
 * Ziel gross und grün, die übrigen als bernsteinfarbenes Fadenkreuz.
 */
function targetPinIcon(L: typeof Leaflet, active: boolean): Leaflet.DivIcon {
  const size = active ? 32 : 26;
  const fill = active ? "#2f6b4f" : "#b45309";
  return L.divIcon({
    className: "",
    html: `<svg viewBox="0 0 28 28" width="${size}" height="${size}" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="${fill}" stroke="#ffffff" stroke-width="2.5"/><circle cx="14" cy="14" r="3" fill="#ffffff"/><path d="M14 5.5v4M14 18.5v4M5.5 14h4M18.5 14h4" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/></svg>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/** Ladezustand der lazy geladenen Leaflet-Bibliothek. */
type MiniMapState = "idle" | "loading" | "error" | "ready";

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

  // ?target=<id> wählt ein eigenes Ziel vor (z. B. von der Karte der Plätze)
  const [selection, setSelection] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
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
    return null;
  }, [effectiveSelection, targets]);

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

  // ---- Ziel umbenennen: Inline-Textfeld, Enter/Blur speichert, Escape bricht ab ----
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  /** Escape gedrückt → der folgende Blur darf NICHT speichern. */
  const renameCancelledRef = useRef(false);

  const startRename = (tgt: TentFinderTarget) => {
    renameCancelledRef.current = false;
    setRenamingId(tgt.id);
    setRenameValue(tgt.name);
  };

  /** Neuen Namen übernehmen (Validierung wie beim Anlegen, Sync inklusive). */
  const commitRename = (tgt: TentFinderTarget) => {
    const next = renameTarget(targets, tgt.id, renameValue);
    if (next === null) {
      toast.error(t.tentFinder.nameMissing);
      return;
    }
    const renamed = next.find(x => x.id === tgt.id);
    if (!renamed || renamed.name === tgt.name) return; // unverändert
    saveTargets(next);
    toast.success(t.tentFinder.renamedToast(renamed.name));
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

  // ---- Mini-Karte (aufklappbar, Leaflet lazy – Muster RainRadar) ----
  const [mapOpen, setMapOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(MAP_OPEN_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [mapState, setMapState] = useState<MiniMapState>("idle");
  const [online, setOnline] = useState<boolean>(() => navigator.onLine);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const targetLayerRef = useRef<Leaflet.LayerGroup | null>(null);
  const positionMarkerRef = useRef<Leaflet.CircleMarker | null>(null);
  /** Einmalig einpassen; kommt die GPS-Position später an, EINMAL nachziehen. */
  const fitDoneRef = useRef(false);
  const fitWithFixDoneRef = useRef(false);

  const toggleMap = () => {
    setMapOpen(prev => {
      const next = !prev;
      try {
        localStorage.setItem(MAP_OPEN_KEY, next ? "1" : "0");
      } catch {
        /* Sitzung reicht */
      }
      return next;
    });
  };

  // Ohne Netz laden die OSM-Kacheln nicht – Hinweis zeigen (Kompass läuft weiter)
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Leaflet erst beim ersten Aufklappen laden – der Zelt-Finder-Chunk bleibt klein
  useEffect(() => {
    if (!mapOpen || mapState !== "idle") return;
    let cancelled = false;
    setMapState("loading");
    Promise.all([import("leaflet"), import("leaflet/dist/leaflet.css")])
      .then(([leafletModule]) => {
        if (cancelled) return;
        leafletRef.current = leafletModule.default;
        setMapState("ready");
      })
      .catch(() => {
        if (!cancelled) setMapState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [mapOpen, mapState]);

  // Karte aufbauen, sobald Leaflet bereit und der Abschnitt offen ist;
  // beim Einklappen/Verlassen sauber abbauen (Bibliothek bleibt geladen)
  useEffect(() => {
    const L = leafletRef.current;
    if (!mapOpen || mapState !== "ready" || !L) return;
    const container = mapContainerRef.current;
    if (!container || mapRef.current) return;

    const map = L.map(container, {
      center: MAP_FALLBACK_CENTER,
      zoom: MAP_FALLBACK_ZOOM,
      scrollWheelZoom: false,
    });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    targetLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    fitDoneRef.current = false;
    fitWithFixDoneRef.current = false;
    return () => {
      map.remove();
      mapRef.current = null;
      targetLayerRef.current = null;
      positionMarkerRef.current = null;
    };
  }, [mapOpen, mapState]);

  // Ziel-Pins nachführen (aktives Ziel hervorgehoben; Klick wählt das Ziel)
  useEffect(() => {
    const L = leafletRef.current;
    const layer = targetLayerRef.current;
    if (!mapOpen || mapState !== "ready" || !L || !layer) return;
    layer.clearLayers();
    targets.forEach(tgt => {
      const active = effectiveSelection === `target:${tgt.id}`;
      const marker = L.marker([tgt.lat, tgt.lon], {
        icon: targetPinIcon(L, active),
        alt: tgt.name,
        title: tgt.name,
      });
      marker.on("click", () => setSelection(`target:${tgt.id}`));
      marker.addTo(layer);
    });
  }, [mapOpen, mapState, targets, effectiveSelection]);

  // Eigene Position als blauer Punkt – folgt der laufenden watchPosition
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!mapOpen || mapState !== "ready" || !L || !map || !fix) return;
    if (positionMarkerRef.current) {
      positionMarkerRef.current.setLatLng([fix.lat, fix.lon]);
    } else {
      positionMarkerRef.current = L.circleMarker([fix.lat, fix.lon], {
        radius: 7,
        color: "#ffffff",
        weight: 2,
        fillColor: "#2563eb",
        fillOpacity: 1,
      }).addTo(map);
    }
  }, [mapOpen, mapState, fix]);

  // Initial über Position + Ziele einpassen (Position darf einmal nachziehen)
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!mapOpen || mapState !== "ready" || !L || !map) return;
    if (fitDoneRef.current && (!fix || fitWithFixDoneRef.current)) return;
    const points: Leaflet.LatLngTuple[] = targets.map(tgt => [
      tgt.lat,
      tgt.lon,
    ]);
    if (fix) points.push([fix.lat, fix.lon]);
    if (points.length === 0) return;
    fitDoneRef.current = true;
    if (fix) fitWithFixDoneRef.current = true;
    if (points.length === 1) {
      map.setView(points[0], 16);
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [24, 24], maxZoom: 17 });
    }
  }, [mapOpen, mapState, targets, fix]);

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

          {targets.length === 0 && (
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
                {targets.map(tgt =>
                  renamingId === tgt.id ? (
                    <li key={tgt.id} className="flex items-center gap-1.5">
                      {/* Inline-Umbenennen: Enter/Blur speichert, Escape bricht ab */}
                      <Input
                        autoFocus
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        maxLength={MAX_NAME_LENGTH}
                        aria-label={t.tentFinder.renameInputAria}
                        onFocus={e => e.currentTarget.select()}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            e.currentTarget.blur();
                          } else if (e.key === "Escape") {
                            renameCancelledRef.current = true;
                            e.currentTarget.blur();
                          }
                        }}
                        onBlur={() => {
                          const cancelled = renameCancelledRef.current;
                          renameCancelledRef.current = false;
                          setRenamingId(null);
                          if (!cancelled) commitRename(tgt);
                        }}
                      />
                    </li>
                  ) : (
                    <li key={tgt.id} className="flex items-center gap-1.5">
                      {optionRow(
                        `target:${tgt.id}`,
                        tgt.name,
                        tgt.lat,
                        tgt.lon
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                        aria-label={t.tentFinder.renameAria(tgt.name)}
                        onClick={() => startRename(tgt)}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Button>
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
                  )
                )}
              </ul>
            </div>
          )}

          {!target && targets.length > 0 && (
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

      {/* Mini-Karte: eigene Position + gespeicherte Ziele (aufklappbar) */}
      <Card className="mt-4">
        <CardContent className="pt-6">
          <button
            type="button"
            onClick={toggleMap}
            aria-expanded={mapOpen}
            aria-controls="tent-finder-map"
            className="flex w-full items-center gap-2 text-left text-sm font-semibold"
          >
            <MapIcon className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.tentFinder.mapTitle}
            <ChevronDown
              className={cn(
                "ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                mapOpen && "rotate-180"
              )}
              aria-hidden="true"
            />
          </button>
          {mapOpen && (
            <div id="tent-finder-map" className="mt-3 space-y-2">
              {mapState === "loading" && (
                <Skeleton className="h-[200px] w-full rounded-xl" />
              )}
              {mapState === "error" && (
                <p className="text-sm text-muted-foreground">
                  {t.tentFinder.mapLoadFailed}{" "}
                  <button
                    type="button"
                    onClick={() => setMapState("idle")}
                    className="font-medium text-primary underline"
                  >
                    {t.tentFinder.mapRetry}
                  </button>
                </p>
              )}
              {mapState === "ready" && (
                <>
                  <div
                    ref={mapContainerRef}
                    role="region"
                    aria-label={t.tentFinder.mapAria}
                    className="h-[200px] w-full rounded-xl border border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    {targets.length > 0
                      ? t.tentFinder.mapHint
                      : t.tentFinder.mapNoTargets}
                  </p>
                  {!online && (
                    <p className="text-xs text-muted-foreground" role="status">
                      {t.tentFinder.mapOffline}
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
