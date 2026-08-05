/**
 * Öffentliche Ansicht einer geteilten Wanderung (#282).
 *
 * Wer den Link im Chat antippt, will die Runde sehen: wo sie langgeht, wie
 * weit sie ist, wie lange sie gedauert hat und wie steil sie war. Genau das
 * steht hier – Karte, Eckdaten, Höhenprofil und der GPX-Download, damit die
 * Runde auf dem eigenen Gerät landen kann.
 *
 * Bewusst NICHT dabei: der Name der wandernden Person und die
 * Reise-Zuordnung. Geteilt wird die Wanderung, nicht das Konto.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { fmtLong } from "@/lib/dateFormat";
import { useParams } from "wouter";
import { Download, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import TrackProfile from "@/components/TrackProfile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { loadMapLayer } from "@/lib/mapLayers";
import {
  createMap,
  latLngBounds,
  type LatLngTuple,
  type MapEngine,
} from "@/lib/mapEngine";
import { useMapConfig } from "@/hooks/useMapConfig";
import { LOCALE_TAGS } from "@shared/i18n";
import { formatDistance } from "@shared/geo";
import {
  buildGpx,
  formatTrackDuration,
  gpxFileName,
  type TrackPoint,
} from "@shared/track";

/** Karte der geteilten Runde: Linie, Start grün, Ziel rot. */
function SharedTrackMap({ points }: { points: TrackPoint[] }) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<MapEngine | null>(null);
  const [libFailed, setLibFailed] = useState(false);
  const maps = useMapConfig();

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
    return <p className="text-sm text-muted-foreground">{t.hike.mapFailed}</p>;
  }
  if (!maps.ready) return <Skeleton className="h-64 w-full rounded-lg" />;
  return (
    <div
      ref={containerRef}
      className="h-64 w-full overflow-hidden rounded-lg border border-border"
      role="img"
      aria-label={t.hike.mapAria}
    />
  );
}

export default function SharedTrackPage() {
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";
  const { lang, t } = useI18n();
  const st = t.sharedTrack;

  const query = trpc.tracks.sharedGet.useQuery(
    { token },
    { enabled: token.length >= 8 }
  );

  const track = query.data?.track ?? null;
  const points = useMemo(() => track?.points ?? [], [track]);

  const download = () => {
    if (!track) return;
    const startedAt = new Date(track.startedAt);
    const gpx = buildGpx({
      name: track.name,
      points,
      createdAt: startedAt,
    });
    const blob = new Blob([gpx], { type: "application/gpx+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = gpxFileName(track.name, startedAt);
    link.click();
    URL.revokeObjectURL(url);
  };

  if (query.isLoading) {
    return (
      <div className="container max-w-3xl py-6">
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          {st.loading}
        </div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="container max-w-3xl py-6">
        <PageHeader
          title={st.notFoundTitle}
          backHref="/"
          backLabel={st.backHome}
        />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {st.invalidLink}
          </CardContent>
        </Card>
      </div>
    );
  }

  const startedAt = new Date(track.startedAt);

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader
        title={track.name}
        subtitle={fmtLong(startedAt, lang)}
        backHref="/"
        backLabel={st.backHome}
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <SharedTrackMap points={points} />

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg bg-accent/50 px-3 py-2.5 text-center">
              <p className="font-mono text-lg font-bold leading-tight">
                {formatDistance(track.distanceM, lang)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {st.distance}
              </p>
            </div>
            <div className="rounded-lg bg-accent/50 px-3 py-2.5 text-center">
              <p className="font-mono text-lg font-bold leading-tight">
                {formatTrackDuration(track.durationS)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {st.duration}
              </p>
            </div>
            <div className="rounded-lg bg-accent/50 px-3 py-2.5 text-center">
              <p className="font-mono text-lg font-bold leading-tight">
                {track.ascentM} m
              </p>
              <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" aria-hidden="true" />
                {st.ascent}
              </p>
            </div>
            <div className="rounded-lg bg-accent/50 px-3 py-2.5 text-center">
              <p className="font-mono text-lg font-bold leading-tight">
                {track.descentM} m
              </p>
              <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <TrendingDown className="h-3 w-3" aria-hidden="true" />
                {st.descent}
              </p>
            </div>
          </div>

          {/* Höhenprofil und Zwischenzeiten wie in der eigenen Ansicht (#280) */}
          <TrackProfile points={points} />

          <Button size="sm" variant="outline" onClick={download}>
            <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {st.download}
          </Button>
          <p className="text-xs text-muted-foreground">{st.note}</p>
        </CardContent>
      </Card>
    </div>
  );
}
