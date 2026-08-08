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
 * Die Karte wird erst gebaut, wenn eine wirklich aufgeht (dynamischer
 * Import wie im Zelt-Finder) – der Chunk dieser Seite bleibt so schlank.
 *
 * Zwischen Aufzeichnung und Track-Liste steht «Wandern in der Umgebung»
 * (#238): dasselbe Bauteil wie im Platz-Dossier, hier ohne Koordinaten – es
 * holt sich den Standort auf Klick selbst.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { fmtDayMonth, fmtNumeric } from "@/lib/dateFormat";
import { useConfirm } from "@/components/ConfirmDialog";
import {
  Bike,
  Download,
  Footprints,
  Link2,
  Loader2,
  MapPin,
  Pause,
  Pencil,
  Play,
  Share2,
  Square,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import TrackProfile from "@/components/TrackProfile";
import LoginPrompt from "@/components/LoginPrompt";
import NearbyHikes from "@/components/NearbyHikes";
import RoutePlanner from "@/components/RoutePlanner";
import { ShareExpiryNote, ShareExpirySelect } from "@/components/ShareExpiry";
import type { ShareExpiryDays } from "@shared/sharing";
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
import { loadMapLayer } from "@/lib/mapLayers";
import {
  createMap,
  latLngBounds,
  type LatLngTuple,
  type MapEngine,
} from "@/lib/mapEngine";
import { useMapConfig } from "@/hooks/useMapConfig";
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
import { tripDisplayName } from "@shared/tripName";
import { LOCALE_TAGS, type Language } from "@shared/i18n";
import {
  buildGpx,
  formatTrackDuration,
  gpxFileName,
  guessTrackActivity,
  normalizeTrackActivity,
  parseTrackPoints,
  trackStats,
  TRACK_ACTIVITIES,
  TRACK_NAME_MAX_LENGTH,
  TRACK_PAUSE_GAP_MS,
  type TrackActivity,
  type TrackPoint,
} from "@shared/track";
import { GPX_IMPORT_MAX_BYTES, parseGpx } from "@shared/gpxImport";
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
  const engineRef = useRef<MapEngine | null>(null);
  const [libFailed, setLibFailed] = useState(false);
  const maps = useMapConfig();
  const trackQuery = trpc.tracks.get.useQuery({ id: trackId });

  const points = useMemo(
    () => parseTrackPoints(trackQuery.data?.pointsJson ?? null),
    [trackQuery.data?.pointsJson]
  );

  // Karte aufbauen, sobald die Punkte da sind und feststeht, welcher
  // Kartendienst zeichnet
  useEffect(() => {
    const container = containerRef.current;
    if (!container || engineRef.current || points.length === 0 || !maps.ready)
      return;
    const latlngs: LatLngTuple[] = points.map(p => [p.lat, p.lon]);
    let cancelled = false;
    void createMap(container, {
      center: latlngs[0],
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
        engine.polyline(latlngs, {
          color: "#16a34a",
          weight: 4,
          opacity: 0.9,
        });
        engine.circleMarker(latlngs[0], {
          radius: 6,
          color: "#ffffff",
          weight: 2,
          fillColor: "#16a34a",
          fillOpacity: 1,
        });
        engine.circleMarker(latlngs[latlngs.length - 1], {
          radius: 6,
          color: "#ffffff",
          weight: 2,
          fillColor: "#dc2626",
          fillOpacity: 1,
        });
        engine.fitBounds(latLngBounds(latlngs), { padding: 20, maxZoom: 17 });
      })
      .catch(() => {
        if (!cancelled) setLibFailed(true);
      });
    return () => {
      cancelled = true;
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, [maps.ready, maps.config, points]);

  if (libFailed) {
    return (
      <p className="mt-3 text-sm text-muted-foreground">{t.hike.mapFailed}</p>
    );
  }
  if (trackQuery.isLoading || !maps.ready) {
    return <Skeleton className="mt-3 h-64 w-full rounded-lg" />;
  }
  if (points.length === 0) {
    return (
      <p className="mt-3 text-sm text-muted-foreground">{t.hike.mapEmpty}</p>
    );
  }
  return (
    <>
      <div
        ref={containerRef}
        className="mt-3 h-64 w-full overflow-hidden rounded-lg border border-border"
        role="img"
        aria-label={t.hike.mapAria}
      />
      {/* Höhenprofil und Zwischenzeiten (#280) */}
      <TrackProfile points={points} />
    </>
  );
}

export default function HikePage() {
  const ask = useConfirm();
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
  // Aktivität (#449): beim Stoppen aus dem Tempo vorgeraten, umstellbar
  const [activity, setActivity] = useState<TrackActivity>("hike");
  const [openMapId, setOpenMapId] = useState<number | null>(null);
  const [editing, setEditing] = useState<{
    id: number;
    name: string;
    tripId: number | null;
    activity: TrackActivity;
  } | null>(null);

  const utils = trpc.useUtils();
  const tracksQuery = trpc.tracks.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const addMutation = trpc.tracks.add.useMutation();
  const gpxInputRef = useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);
  const updateMutation = trpc.tracks.update.useMutation();
  const removeMutation = trpc.tracks.remove.useMutation();

  // ── Wanderung per Link teilen (#282) ──
  /** Offener Teilen-Dialog samt erzeugtem Link. */
  const [share, setShare] = useState<{
    id: number;
    name: string;
    url: string;
    expiresAt: Date | null;
  } | null>(null);
  const [shareExpiresIn, setShareExpiresIn] = useState<ShareExpiryDays | null>(
    null
  );
  const shareMutation = trpc.tracks.share.useMutation({
    onError: () => toast.error(t.hike.shareFailed),
  });
  const unshareMutation = trpc.tracks.unshare.useMutation({
    onSuccess: () => {
      void utils.tracks.list.invalidate();
      setShare(null);
      toast.success(t.hike.unshared);
    },
    onError: () => toast.error(t.hike.unshareFailed),
  });

  /**
   * Teil-Link erzeugen (idempotent: ein bestehender Token bleibt derselbe),
   * Dialog öffnen und den Link gleich in die Zwischenablage legen.
   */
  const openShare = (
    track: { id: number; name: string },
    // undefined = Gültigkeit unverändert lassen (Dialog nur öffnen)
    expiresInDays?: ShareExpiryDays | null
  ) => {
    shareMutation.mutate(
      { id: track.id, expiresInDays },
      {
        onSuccess: async ({ token, expiresAt }) => {
          const url = `${window.location.origin}/wanderung/${token}`;
          setShare({ id: track.id, name: track.name, url, expiresAt });
          void utils.tracks.list.invalidate();
          try {
            await navigator.clipboard.writeText(url);
            toast.success(t.hike.shareCopied);
          } catch {
            // Zwischenablage blockiert – der Link steht im Dialog
          }
        },
      }
    );
  };

  const trips = tripsQuery.data ?? [];
  const tripName = (id: number | null) => {
    if (id === null) return null;
    const trip = trips.find(tr => tr.id === id);
    if (!trip) return null;
    return tripDisplayName(trip, lang);
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
    setName(t.hike.defaultName(fmtDayMonth(new Date(done.startedAt), lang)));
    const doneStats = trackStats(done.points);
    setActivity(guessTrackActivity(doneStats.distanceM, doneStats.durationS));
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

  /** GPX-Datei einlesen und als Wanderung speichern (#426). */
  const importGpx = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > GPX_IMPORT_MAX_BYTES) {
      toast.error(t.hike.gpxImportFailed);
      return;
    }
    setImporting(true);
    try {
      const parsed = parseGpx(await file.text(), Date.now());
      if (!parsed) {
        toast.error(t.hike.gpxImportFailed);
        return;
      }
      await addMutation.mutateAsync({
        name: (parsed.name ?? file.name.replace(/\.gpx$/i, "")).slice(
          0,
          TRACK_NAME_MAX_LENGTH
        ),
        points: parsed.points,
      });
      await utils.tracks.list.invalidate();
      toast.success(
        parsed.timesEstimated ? t.hike.gpxImportedEstimated : t.hike.gpxImported
      );
    } catch {
      toast.error(t.hike.gpxImportFailed);
    } finally {
      setImporting(false);
      if (gpxInputRef.current) gpxInputRef.current.value = "";
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
        activity,
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
                  onClick={async () => {
                    if (
                      !(await ask({
                        title: t.hike.discardConfirm,
                        confirmLabel: t.common.confirmDiscard,
                      }))
                    )
                      return;
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
                        {tripDisplayName(trip, lang)}
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

      {/* Route vorher zeichnen (#281): das Gegenstück zur Aufzeichnung –
          erst planen, dann laufen. Nur angemeldet, weil die Route
          gespeichert wird. */}
      {isAuthenticated && (
        <RoutePlanner
          className="mt-6"
          trips={trips.map(trip => ({
            id: trip.id,
            label: tripDisplayName(trip, lang),
          }))}
        />
      )}

      {/* Wanderwege in der Nähe: OSM-Routen rund um den aktuellen Standort */}
      <NearbyHikes className="mt-6" />

      {/* Gespeicherte Wanderungen */}
      <div className="mb-3 mt-6 flex items-center justify-between gap-2">
        <h2 className="font-serif text-lg font-semibold">{t.hike.listTitle}</h2>
        {/* GPX-Import (#426): Komoot- und Garmin-Dateien als Wanderung
            übernehmen – die Gegenrichtung zum Export. */}
        {isAuthenticated && (
          <>
            <input
              ref={gpxInputRef}
              type="file"
              accept=".gpx,application/gpx+xml"
              className="hidden"
              tabIndex={-1}
              aria-hidden="true"
              onChange={e => void importGpx(e.target.files?.[0])}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={importing}
              onClick={() => gpxInputRef.current?.click()}
            >
              <Upload className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {importing ? t.hike.gpxImporting : t.hike.gpxImport}
            </Button>
          </>
        )}
      </div>
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
                      <p className="flex items-center gap-1.5 font-semibold">
                        {/* Aktivität (#449): Velo sichtbar machen; Wandern
                            bleibt ohne Icon der Normalfall */}
                        {normalizeTrackActivity(track.activity) === "bike" && (
                          <Bike
                            className="h-4 w-4 shrink-0 text-primary"
                            aria-label={t.hike.activityBike}
                          />
                        )}
                        {track.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {fmtNumeric(new Date(track.startedAt), lang)}
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
                            activity: normalizeTrackActivity(track.activity),
                          })
                        }
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      {/* Wanderung per Link teilen (#282) */}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t.hike.shareAria(track.name)}
                        onClick={() =>
                          openShare({ id: track.id, name: track.name })
                        }
                        disabled={shareMutation.isPending}
                      >
                        <Share2
                          className={cn(
                            "h-4 w-4",
                            track.shareToken ? "text-primary" : undefined
                          )}
                          aria-hidden="true"
                        />
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
                        onClick={async () => {
                          if (!(await ask({ title: t.hike.deleteConfirm })))
                            return;
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
              {/* Aktivität (#449): aus dem Tempo vorgeraten, umstellbar */}
              <div>
                <Label className="mb-1.5 block">{t.hike.activityLabel}</Label>
                <div
                  className="flex gap-1.5"
                  role="group"
                  aria-label={t.hike.activityLabel}
                >
                  {TRACK_ACTIVITIES.map(kind => (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => setActivity(kind)}
                      aria-pressed={activity === kind}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                        activity === kind
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {kind === "bike" ? (
                        <Bike className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Footprints
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                      )}
                      {kind === "bike"
                        ? t.hike.activityBike
                        : t.hike.activityHike}
                    </button>
                  ))}
                </div>
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
                        {tripDisplayName(trip, lang)}
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

      {/* Teil-Link zur Wanderung (#282) */}
      <Dialog
        open={share !== null}
        onOpenChange={open => {
          if (!open) setShare(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">
              {t.hike.shareTitle}
            </DialogTitle>
            <DialogDescription>{t.hike.shareDesc}</DialogDescription>
          </DialogHeader>
          {share && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                <Link2
                  className="h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <code className="min-w-0 flex-1 truncate text-xs">
                  {share.url}
                </code>
                <button
                  type="button"
                  className="shrink-0 text-xs font-medium text-primary hover:underline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(share.url);
                      toast.success(t.common.linkCopied);
                    } catch {
                      toast.error(t.common.copyFailed);
                    }
                  }}
                >
                  {t.common.copy}
                </button>
              </div>
              <div className="space-y-1">
                <ShareExpirySelect
                  value={shareExpiresIn}
                  onChange={days => {
                    setShareExpiresIn(days);
                    openShare(share, days);
                  }}
                />
                <ShareExpiryNote expiresAt={share.expiresAt} />
              </div>
              <Button
                variant="outline"
                onClick={() => unshareMutation.mutate({ id: share.id })}
                disabled={unshareMutation.isPending}
              >
                {t.hike.unshare}
              </Button>
            </div>
          )}
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
              <div>
                <Label className="mb-1.5 block">{t.hike.activityLabel}</Label>
                <div
                  className="flex gap-1.5"
                  role="group"
                  aria-label={t.hike.activityLabel}
                >
                  {TRACK_ACTIVITIES.map(kind => (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => setEditing({ ...editing, activity: kind })}
                      aria-pressed={editing.activity === kind}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                        editing.activity === kind
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {kind === "bike" ? (
                        <Bike className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Footprints
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                      )}
                      {kind === "bike"
                        ? t.hike.activityBike
                        : t.hike.activityHike}
                    </button>
                  ))}
                </div>
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
                        {tripDisplayName(trip, lang)}
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
                  {
                    id: editing.id,
                    name: trimmed,
                    tripId: editing.tripId,
                    activity: editing.activity,
                  },
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
