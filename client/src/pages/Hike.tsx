/**
 * Wanderung aufzeichnen (#220): Aufzeichnungsmodus für Wanderungen und
 * Spaziergänge vom Zeltplatz aus.
 *
 * Die Messung selbst steckt in lib/hikeTracking.ts – bewusst ausserhalb von
 * React, damit sie einen Seitenwechsel übersteht und in localStorage
 * weiterlebt. Diese Seite ist nur Anzeige und Bedienung: Start/Pause/Stopp,
 * Live-Zahlen aus `trackStats()`, das Speichern-Formular und die Liste der
 * gespeicherten Tracks samt Karte und GPX-Export.
 *
 * Leaflet wird erst geladen, wenn eine Karte wirklich aufgeht (dynamischer
 * Import wie im Zelt-Finder) – der Chunk dieser Seite bleibt so schlank.
 *
 * Zwischen Aufzeichnung und Track-Liste steht «Wandern in der Umgebung»
 * (#238): dasselbe Bauteil wie im Platz-Dossier, hier ohne Koordinaten – es
 * holt sich den Standort auf Klick selbst.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  Footprints,
  Loader2,
  MapPin,
  Pause,
  Pencil,
  Play,
  Square,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import type * as Leaflet from "leaflet";
import PageHeader from "@/components/PageHeader";
import LoginPrompt from "@/components/LoginPrompt";
import NearbyHikes from "@/components/NearbyHikes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { createBaseLayer, loadMapLayer } from "@/lib/mapLayers";
import {
  discardHikeRecording,
  pauseHikeRecording,
  resumeHikeRecording,
  setHikeRecordingTrip,
  startHikeRecording,
  stopHikeRecording,
  useHikeRecording,
  type HikeRecording,
} from "@/lib/hikeTracking";
import { useWakeLock } from "@/lib/useWakeLock";
import { useI18n } from "@/i18n";
import { LOCALE_TAGS, type Language } from "@shared/i18n";
import {
  buildGpx,
  formatTrackDuration,
  gpxFileName,
  parseTrackPoints,
  trackStats,
  TRACK_NAME_MAX_LENGTH,
  TRACK_PAUSE_GAP_MS,
  type TrackPoint,
} from "@shared/track";
import { cn } from "@/lib/utils";

/** Strecke lesbar machen: unter 1 km in Metern, darüber in Kilometern. */
function formatDistance(meters: number, lang: Language): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toLocaleString(LOCALE_TAGS[lang], {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} km`;
}

/** Tempo mit einer Nachkommastelle. */
function formatSpeed(kmh: number, lang: Language): string {
  return `${kmh.toLocaleString(LOCALE_TAGS[lang], {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} km/h`;
}

/** Eine Kennzahl der Live-Anzeige bzw. der Trackliste. */
function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-accent/50 px-3 py-2.5 text-center">
      <p className="font-mono text-lg font-bold leading-tight">{value}</p>
      <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-muted-foreground">
        {icon}
        {label}
      </p>
    </div>
  );
}

/**
 * Karte eines gespeicherten Tracks. Die Punkte kommen erst beim Aufklappen
 * vom Server (tracks.get) – die Liste selbst bleibt dadurch leichtgewichtig.
 */
function TrackMap({ trackId }: { trackId: number }) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const [leaflet, setLeaflet] = useState<typeof Leaflet | null>(null);
  const [libFailed, setLibFailed] = useState(false);
  const trackQuery = trpc.tracks.get.useQuery({ id: trackId });

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

  const points = useMemo(
    () => parseTrackPoints(trackQuery.data?.pointsJson ?? null),
    [trackQuery.data?.pointsJson]
  );

  // Karte aufbauen, sobald Leaflet UND die Punkte da sind
  useEffect(() => {
    const L = leaflet;
    const container = containerRef.current;
    if (!L || !container || mapRef.current || points.length === 0) return;
    const latlngs: Leaflet.LatLngTuple[] = points.map(p => [p.lat, p.lon]);
    const map = L.map(container, { scrollWheelZoom: false });
    createBaseLayer(L, loadMapLayer()).addTo(map);
    L.polyline(latlngs, { color: "#16a34a", weight: 4, opacity: 0.9 }).addTo(
      map
    );
    L.circleMarker(latlngs[0], {
      radius: 6,
      color: "#ffffff",
      weight: 2,
      fillColor: "#16a34a",
      fillOpacity: 1,
    }).addTo(map);
    L.circleMarker(latlngs[latlngs.length - 1], {
      radius: 6,
      color: "#ffffff",
      weight: 2,
      fillColor: "#dc2626",
      fillOpacity: 1,
    }).addTo(map);
    map.fitBounds(L.latLngBounds(latlngs), { padding: [20, 20], maxZoom: 17 });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [leaflet, points]);

  if (libFailed) {
    return (
      <p className="mt-3 text-sm text-muted-foreground">{t.hike.mapFailed}</p>
    );
  }
  if (trackQuery.isLoading || !leaflet) {
    return <Skeleton className="mt-3 h-64 w-full rounded-lg" />;
  }
  if (points.length === 0) {
    return (
      <p className="mt-3 text-sm text-muted-foreground">{t.hike.mapEmpty}</p>
    );
  }
  return (
    <div
      ref={containerRef}
      className="mt-3 h-64 w-full overflow-hidden rounded-lg border border-border"
      role="img"
      aria-label={t.hike.mapAria}
    />
  );
}

export default function HikePage() {
  const { lang, t } = useI18n();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { recording, geoError, now } = useHikeRecording();
  const [keepAwake, setKeepAwake] = useState(true);
  // Display nur anlassen, solange wirklich aufgezeichnet wird
  const wakeLock = useWakeLock(keepAwake && recording?.status === "recording");

  /** Fertige Aufzeichnung, die noch benannt und gespeichert werden will. */
  const [finished, setFinished] = useState<HikeRecording | null>(null);
  const [name, setName] = useState("");
  const [tripId, setTripId] = useState<number | null>(null);
  const [openMapId, setOpenMapId] = useState<number | null>(null);
  const [editing, setEditing] = useState<{
    id: number;
    name: string;
    tripId: number | null;
  } | null>(null);

  const utils = trpc.useUtils();
  const tracksQuery = trpc.tracks.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const addMutation = trpc.tracks.add.useMutation();
  const updateMutation = trpc.tracks.update.useMutation();
  const removeMutation = trpc.tracks.remove.useMutation();

  const trips = tripsQuery.data ?? [];
  const tripName = (id: number | null) => {
    if (id === null) return null;
    const trip = trips.find(tr => tr.id === id);
    if (!trip) return null;
    return trip.title || trip.location || t.hike.tripFallback;
  };

  // Live-Statistik – neu gerechnet, sobald ein Punkt dazukommt
  const liveStats = useMemo(
    () => trackStats(recording?.points ?? []),
    [recording?.points]
  );

  /**
   * Damit die Uhr auch zwischen zwei Messpunkten weiterläuft, kommt zur
   * gerechneten Bewegungszeit die Zeit seit dem letzten Punkt dazu – gedeckelt
   * auf die Pausen-Schwelle, ab der `trackStats()` eine Lücke ohnehin nicht
   * mehr mitzählt. Beim Pausieren bleibt die Anzeige stehen.
   */
  const lastPointT = recording?.points.length
    ? recording.points[recording.points.length - 1].t
    : null;
  const runningS =
    recording?.status === "recording" && lastPointT !== null
      ? Math.min(Math.max(0, now - lastPointT), TRACK_PAUSE_GAP_MS) / 1000
      : 0;
  const shownDurationS = liveStats.durationS + runningS;
  const shownSpeedKmh =
    shownDurationS > 0 ? (liveStats.distanceM / shownDurationS) * 3.6 : 0;

  const geoMessage =
    geoError === "unsupported"
      ? t.hike.geoUnsupported
      : geoError === "denied"
        ? t.hike.geoDenied
        : geoError === "failed"
          ? t.hike.geoFailed
          : null;

  const stop = () => {
    const done = stopHikeRecording();
    if (!done || done.points.length < 2) {
      toast.info(t.hike.tooFewPoints);
      return;
    }
    setFinished(done);
    setTripId(done.tripId);
    setName(
      t.hike.defaultName(
        new Date(done.startedAt).toLocaleDateString(LOCALE_TAGS[lang], {
          day: "2-digit",
          month: "2-digit",
        })
      )
    );
  };

  /** GPX-Datei erzeugen und herunterladen (rein im Browser, offline). */
  const downloadGpx = (
    trackName: string,
    points: TrackPoint[],
    startedAt: Date
  ) => {
    try {
      const blob = new Blob([buildGpx({ name: trackName, points })], {
        type: "application/gpx+xml",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = gpxFileName(trackName, startedAt);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(t.hike.gpxDone);
    } catch {
      toast.error(t.hike.gpxFailed);
    }
  };

  /** GPX eines gespeicherten Tracks: Punkte gezielt nachladen. */
  const exportSavedTrack = async (id: number) => {
    try {
      const track = await utils.tracks.get.fetch({ id });
      downloadGpx(
        track.name,
        parseTrackPoints(track.pointsJson),
        new Date(track.startedAt)
      );
    } catch {
      toast.error(t.hike.gpxFailed);
    }
  };

  const save = () => {
    if (!finished) return;
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error(t.hike.nameRequired);
      return;
    }
    addMutation.mutate(
      {
        name: trimmed.slice(0, TRACK_NAME_MAX_LENGTH),
        tripId,
        points: finished.points.map(p => ({
          lat: p.lat,
          lon: p.lon,
          ele: p.ele,
          t: p.t,
        })),
      },
      {
        onSuccess: () => {
          setFinished(null);
          void utils.tracks.list.invalidate();
          toast.success(t.hike.saved);
        },
        onError: () => toast.error(t.common.saveFailed),
      }
    );
  };

  const startedLabel = recording
    ? new Date(recording.startedAt).toLocaleTimeString(LOCALE_TAGS[lang], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="container max-w-3xl py-6 md:py-8">
      <PageHeader title={t.hike.title} subtitle={t.hike.subtitle} />

      {/* Aufzeichnung */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Footprints className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.hike.recorderTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!recording && (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                {t.hike.recorderIntro}
              </p>
              <Button onClick={() => startHikeRecording(null)}>
                <Play className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {t.hike.start}
              </Button>
            </>
          )}

          {recording && (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                    recording.status === "recording"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      recording.status === "recording"
                        ? "animate-pulse bg-destructive"
                        : "bg-muted-foreground"
                    )}
                    aria-hidden="true"
                  />
                  {recording.status === "recording"
                    ? t.hike.statusRecording
                    : t.hike.statusPaused}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t.hike.startedAt(startedLabel)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t.hike.pointCount(recording.points.length)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat
                  label={t.hike.statDistance}
                  value={formatDistance(liveStats.distanceM, lang)}
                />
                <Stat
                  label={t.hike.statDuration}
                  value={formatTrackDuration(shownDurationS)}
                />
                <Stat
                  label={t.hike.statSpeed}
                  value={formatSpeed(shownSpeedKmh, lang)}
                />
                <Stat
                  label={t.hike.statElevation}
                  value={`↑${liveStats.ascentM} / ↓${liveStats.descentM} m`}
                />
              </div>

              {recording.status === "recording" &&
                recording.points.length === 0 && (
                  <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    {t.hike.waitingFix}
                  </p>
                )}
              {recording.lastAccuracyM !== null && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {t.hike.accuracy(Math.round(recording.lastAccuracyM))}
                </p>
              )}
              {recording.status === "paused" && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {t.hike.pausedHint}
                </p>
              )}
              {geoMessage && (
                <p className="mt-2 text-sm text-destructive">{geoMessage}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {recording.status === "recording" ? (
                  <Button variant="outline" onClick={pauseHikeRecording}>
                    <Pause className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    {t.hike.pause}
                  </Button>
                ) : (
                  <Button variant="outline" onClick={resumeHikeRecording}>
                    <Play className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    {t.hike.resume}
                  </Button>
                )}
                <Button onClick={stop}>
                  <Square className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {t.hike.stop}
                </Button>
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    if (!window.confirm(t.hike.discardConfirm)) return;
                    discardHikeRecording();
                  }}
                >
                  {t.hike.discard}
                </Button>
              </div>

              {/* Reise-Zuordnung schon während der Aufzeichnung wählbar */}
              {isAuthenticated && trips.length > 0 && (
                <div className="mt-4">
                  <Label
                    htmlFor="hike-live-trip"
                    className="text-xs text-muted-foreground"
                  >
                    {t.hike.tripLabel}
                  </Label>
                  <select
                    id="hike-live-trip"
                    className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={recording.tripId ?? ""}
                    onChange={e =>
                      setHikeRecordingTrip(
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                  >
                    <option value="">{t.hike.tripNone}</option>
                    {trips.map(trip => (
                      <option key={trip.id} value={trip.id}>
                        {trip.title || trip.location || t.hike.tripFallback}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                <Label
                  htmlFor="hike-wake-lock"
                  className="text-sm font-normal text-muted-foreground"
                >
                  {t.hike.keepAwakeLabel}
                </Label>
                <Switch
                  id="hike-wake-lock"
                  checked={keepAwake}
                  onCheckedChange={setKeepAwake}
                  aria-label={t.hike.keepAwakeLabel}
                />
              </div>
              {wakeLock.active && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {t.common.screenAwake}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Wanderwege in der Nähe: OSM-Routen rund um den aktuellen Standort */}
      <NearbyHikes className="mt-6" />

      {/* Gespeicherte Wanderungen */}
      <h2 className="mb-3 mt-6 font-serif text-lg font-semibold">
        {t.hike.listTitle}
      </h2>
      {!authLoading && !isAuthenticated ? (
        <LoginPrompt feature={t.hike.loginFeature} />
      ) : tracksQuery.isLoading ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : (tracksQuery.data?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <Footprints
            className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50"
            aria-hidden="true"
          />
          <p className="font-medium">{t.hike.listEmpty}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.hike.listEmptyHint}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(tracksQuery.data ?? []).map(track => {
            const trip = tripName(track.tripId);
            return (
              <Card key={track.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold">{track.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(track.startedAt).toLocaleDateString(
                          LOCALE_TAGS[lang],
                          { day: "2-digit", month: "2-digit", year: "numeric" }
                        )}
                        {" · "}
                        {new Date(track.startedAt).toLocaleTimeString(
                          LOCALE_TAGS[lang],
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                        {trip && ` · ${t.hike.tripBadge(trip)}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t.hike.editAria(track.name)}
                        onClick={() =>
                          setEditing({
                            id: track.id,
                            name: track.name,
                            tripId: track.tripId,
                          })
                        }
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t.hike.gpxAria(track.name)}
                        onClick={() => void exportSavedTrack(track.id)}
                      >
                        <Download className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t.hike.deleteAria(track.name)}
                        onClick={() => {
                          if (!window.confirm(t.hike.deleteConfirm)) return;
                          removeMutation.mutate(
                            { id: track.id },
                            {
                              onSuccess: () => {
                                if (openMapId === track.id) setOpenMapId(null);
                                void utils.tracks.list.invalidate();
                                toast.success(t.hike.deleted);
                              },
                              onError: () => toast.error(t.common.deleteFailed),
                            }
                          );
                        }}
                      >
                        <Trash2
                          className="h-4 w-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Stat
                      label={t.hike.statDistance}
                      value={formatDistance(track.distanceM, lang)}
                    />
                    <Stat
                      label={t.hike.statDuration}
                      value={formatTrackDuration(track.durationS)}
                    />
                    <Stat
                      label={t.hike.statAscent}
                      value={`${track.ascentM} m`}
                      icon={
                        <TrendingUp className="h-3 w-3" aria-hidden="true" />
                      }
                    />
                    <Stat
                      label={t.hike.statDescent}
                      value={`${track.descentM} m`}
                      icon={
                        <TrendingDown className="h-3 w-3" aria-hidden="true" />
                      }
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() =>
                      setOpenMapId(openMapId === track.id ? null : track.id)
                    }
                  >
                    <MapPin className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    {openMapId === track.id ? t.hike.hideMap : t.hike.showMap}
                  </Button>
                  {openMapId === track.id && <TrackMap trackId={track.id} />}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Nach dem Stoppen: benennen und speichern */}
      <Dialog
        open={finished !== null}
        onOpenChange={open => {
          if (!open) setFinished(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">{t.hike.saveTitle}</DialogTitle>
            <DialogDescription>{t.hike.saveDesc}</DialogDescription>
          </DialogHeader>
          {finished && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(() => {
                  const stats = trackStats(finished.points);
                  return (
                    <>
                      <Stat
                        label={t.hike.statDistance}
                        value={formatDistance(stats.distanceM, lang)}
                      />
                      <Stat
                        label={t.hike.statDuration}
                        value={formatTrackDuration(stats.durationS)}
                      />
                      <Stat
                        label={t.hike.statAscent}
                        value={`${stats.ascentM} m`}
                      />
                      <Stat
                        label={t.hike.statDescent}
                        value={`${stats.descentM} m`}
                      />
                    </>
                  );
                })()}
              </div>
              <div>
                <Label htmlFor="hike-name">{t.hike.nameLabel}</Label>
                <Input
                  id="hike-name"
                  value={name}
                  maxLength={TRACK_NAME_MAX_LENGTH}
                  onChange={e => setName(e.target.value)}
                  placeholder={t.hike.namePlaceholder}
                  className="mt-1"
                />
              </div>
              {isAuthenticated && trips.length > 0 && (
                <div>
                  <Label htmlFor="hike-trip">{t.hike.tripLabel}</Label>
                  <select
                    id="hike-trip"
                    className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={tripId ?? ""}
                    onChange={e =>
                      setTripId(e.target.value ? Number(e.target.value) : null)
                    }
                  >
                    <option value="">{t.hike.tripNone}</option>
                    {trips.map(trip => (
                      <option key={trip.id} value={trip.id}>
                        {trip.title || trip.location || t.hike.tripFallback}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {!isAuthenticated && (
                <p className="text-sm text-muted-foreground">
                  {t.hike.saveNeedsLogin}
                </p>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() =>
                finished &&
                downloadGpx(
                  name.trim() || t.hike.gpxFallbackName,
                  finished.points,
                  new Date(finished.startedAt)
                )
              }
            >
              <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.hike.gpxExport}
            </Button>
            {isAuthenticated && (
              <Button onClick={save} disabled={addMutation.isPending}>
                {addMutation.isPending ? t.common.saving : t.common.save}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Umbenennen / Reise zuordnen */}
      <Dialog
        open={editing !== null}
        onOpenChange={open => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">{t.hike.editTitle}</DialogTitle>
            <DialogDescription>{t.hike.editDesc}</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="hike-edit-name">{t.hike.nameLabel}</Label>
                <Input
                  id="hike-edit-name"
                  value={editing.name}
                  maxLength={TRACK_NAME_MAX_LENGTH}
                  onChange={e =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              {trips.length > 0 && (
                <div>
                  <Label htmlFor="hike-edit-trip">{t.hike.tripLabel}</Label>
                  <select
                    id="hike-edit-trip"
                    className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={editing.tripId ?? ""}
                    onChange={e =>
                      setEditing({
                        ...editing,
                        tripId: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  >
                    <option value="">{t.hike.tripNone}</option>
                    {trips.map(trip => (
                      <option key={trip.id} value={trip.id}>
                        {trip.title || trip.location || t.hike.tripFallback}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              {t.common.cancel}
            </Button>
            <Button
              disabled={updateMutation.isPending}
              onClick={() => {
                if (!editing) return;
                const trimmed = editing.name.trim();
                if (!trimmed) {
                  toast.error(t.hike.nameRequired);
                  return;
                }
                updateMutation.mutate(
                  { id: editing.id, name: trimmed, tripId: editing.tripId },
                  {
                    onSuccess: () => {
                      setEditing(null);
                      void utils.tracks.list.invalidate();
                    },
                    onError: () => toast.error(t.common.saveFailed),
                  }
                );
              }}
            >
              {updateMutation.isPending ? t.common.saving : t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
