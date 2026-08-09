/**
 * Offline-Paket für die GANZE Rundreise (#561): lädt die Karten-Kacheln
 * um jede Etappe (2-km-Umkreis, Details bis Zoom 14) plus einen gröberen
 * Korridor entlang der Verbindungslinien – dieselbe Technik wie das
 * Platz-Paket (#217) und das Routen-Paket (#552), derselbe Cache, der
 * Service Worker bedient die Kacheln ohne Änderung.
 *
 * DIE ETAPPEN ZUERST: Greift die Kachel-Obergrenze, fehlen zuerst die
 * Verbindungswege – dort fährt man durch, an den Etappen verbringt man
 * die Tage.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fmtNumeric } from "@/lib/dateFormat";
import {
  currentTileLayer,
  deleteTiles,
  downloadTiles,
  forgetOfflineTripPack,
  loadOfflineTripPacks,
  rememberOfflineTripPack,
  tileCacheSupported,
  tilesForTrip,
  TRIP_STAGE_RADIUS_KM,
  TRIP_STAGE_MAX_ZOOM,
  type OfflineMapPack,
} from "@/lib/mapTiles";
import { useI18n } from "@/i18n";
import { LOCALE_TAGS } from "@shared/i18n";

export default function TripStagesOfflinePack({
  tripId,
  tripName,
  stops,
}: {
  tripId: number;
  tripName: string;
  /** Etappen MIT Koordinaten, in Reihenfolge. */
  stops: { lat: number; lon: number }[];
}) {
  const { lang, t } = useI18n();
  const ts = t.tripStops;
  const [pack, setPack] = useState<OfflineMapPack | null>(null);
  const [progress, setProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setPack(loadOfflineTripPacks()[String(tripId)] ?? null);
  }, [tripId]);

  const tiles = useMemo(() => tilesForTrip(stops), [stops]);

  if (!tileCacheSupported() || stops.length === 0) return null;

  const startDownload = async () => {
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setProgress({ done: 0, total: tiles.length });
    const layer = currentTileLayer();
    try {
      // Kacheln eines früheren Stands wegräumen (Etappen verschoben oder
      // Layer gewechselt) – gleiche Regel wie beim Routen-Paket.
      if (pack) {
        const keep = new Set(
          tiles.map(tile => `${tile.z}/${tile.x}/${tile.y}`)
        );
        const stale = tilesForTrip(stops).filter(
          tile =>
            pack.layer !== layer || !keep.has(`${tile.z}/${tile.x}/${tile.y}`)
        );
        await deleteTiles(stale, pack.layer);
      }
      const result = await downloadTiles(tiles, layer, {
        signal: controller.signal,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      if (result.stored > 0) {
        const next: OfflineMapPack = {
          radiusKm: TRIP_STAGE_RADIUS_KM,
          maxZoom: TRIP_STAGE_MAX_ZOOM,
          layer,
          tiles: result.stored,
          bytes: result.bytes,
          savedAt: new Date().toISOString(),
        };
        rememberOfflineTripPack(tripId, next);
        setPack(next);
      } else {
        forgetOfflineTripPack(tripId);
        setPack(null);
      }
      if (result.cancelled) toast.info(t.spotDetail.offlineMapCancelled);
      else if (result.stored === 0) toast.error(t.spotDetail.offlineMapNothing);
      else toast.success(t.spotDetail.offlineMapDone(result.stored));
    } catch {
      toast.error(t.spotDetail.offlineMapNothing);
    } finally {
      abortRef.current = null;
      setBusy(false);
      setProgress(null);
    }
  };

  const removePack = async () => {
    if (!pack) return;
    setBusy(true);
    try {
      await deleteTiles(tilesForTrip(stops), pack.layer);
    } catch {
      /* Cache nicht erreichbar – der Eintrag verschwindet trotzdem */
    } finally {
      forgetOfflineTripPack(tripId);
      setPack(null);
      setBusy(false);
      toast.success(t.spotDetail.offlineMapDeleted);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {busy ? (
        <>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => abortRef.current?.abort()}
          >
            {t.spotDetail.offlineMapCancel}
          </Button>
          {progress && (
            <span className="text-xs tabular-nums text-muted-foreground">
              {t.spotDetail.offlineMapProgress(progress.done, progress.total)}
            </span>
          )}
        </>
      ) : (
        <>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => void startDownload()}
            aria-label={ts.offlineDownloadAria(tripName)}
            title={ts.offlineHint}
          >
            <Download className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            {t.routePlan.offlineDownload}
          </Button>
          {pack && (
            <>
              <span className="text-xs text-muted-foreground">
                {t.routePlan.offlineSaved(
                  pack.tiles,
                  new Intl.NumberFormat(LOCALE_TAGS[lang], {
                    maximumFractionDigits: 1,
                  }).format(pack.bytes / (1024 * 1024))
                )}
                {pack.savedAt
                  ? ` · ${fmtNumeric(new Date(pack.savedAt), lang)}`
                  : ""}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => void removePack()}
                aria-label={ts.offlineDeleteAria(tripName)}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                {t.routePlan.offlineDelete}
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
}
