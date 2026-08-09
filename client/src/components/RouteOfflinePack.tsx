/**
 * Offline-Paket für eine geplante Route (#552): lädt die Karten-Kacheln
 * in einem 1-km-Korridor entlang der gezeichneten Route in den Cache
 * «campmesser-map-tiles» – dieselbe Technik wie das Offline-Paket pro
 * Platz (#217), nur folgt die Fläche hier dem Weg statt einem Umkreis.
 *
 * WARUM: Die Route zeichnet man am Vorabend im WLAN, gebraucht wird sie
 * am nächsten Tag im Funkloch. Der Umkreis um den Platz deckt eine
 * Tageswanderung nicht ab – der Korridor entlang der Strecke schon, mit
 * einem Bruchteil der Kacheln.
 *
 * Bewusst OHNE Wahlmöglichkeiten: Korridor und Detailgrad sind fixiert
 * (ROUTE_CORRIDOR_KM, ROUTE_MAX_ZOOM). Wer feiner steuern will, hat das
 * Platz-Paket – hier zählt der Ein-Klick-Download in der Routenliste.
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
  forgetOfflineRoutePack,
  loadOfflineRoutePacks,
  rememberOfflineRoutePack,
  ROUTE_CORRIDOR_KM,
  ROUTE_MAX_ZOOM,
  tileCacheSupported,
  tilesForCorridor,
  zoomLevelsUpTo,
  type OfflineMapPack,
} from "@/lib/mapTiles";
import { parseWaypoints } from "@shared/routePlan";
import { useI18n } from "@/i18n";
import { LOCALE_TAGS } from "@shared/i18n";

export default function RouteOfflinePack({
  route,
}: {
  route: { id: number; name: string; waypointsJson: string };
}) {
  const { lang, t } = useI18n();
  const rp = t.routePlan;
  const [pack, setPack] = useState<OfflineMapPack | null>(null);
  const [progress, setProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setPack(loadOfflineRoutePacks()[String(route.id)] ?? null);
  }, [route.id]);

  const points = useMemo(
    () =>
      parseWaypoints(route.waypointsJson).map(p => ({
        lat: p.lat,
        lon: p.lon,
      })),
    [route.waypointsJson]
  );
  const tiles = useMemo(
    () =>
      tilesForCorridor(
        points,
        ROUTE_CORRIDOR_KM,
        zoomLevelsUpTo(ROUTE_MAX_ZOOM)
      ),
    [points]
  );

  if (!tileCacheSupported() || points.length < 2) return null;

  const startDownload = async () => {
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setProgress({ done: 0, total: tiles.length });
    const layer = currentTileLayer();
    try {
      // Kacheln eines früheren Stands wegräumen, die zum neuen Paket
      // nicht mehr gehören (Route verändert oder Layer gewechselt).
      if (pack) {
        const keep = new Set(
          tiles.map(tile => `${tile.z}/${tile.x}/${tile.y}`)
        );
        const stale = tilesForCorridor(
          points,
          pack.radiusKm,
          zoomLevelsUpTo(pack.maxZoom)
        ).filter(
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
          radiusKm: ROUTE_CORRIDOR_KM,
          maxZoom: ROUTE_MAX_ZOOM,
          layer,
          tiles: result.stored,
          bytes: result.bytes,
          savedAt: new Date().toISOString(),
        };
        rememberOfflineRoutePack(route.id, next);
        setPack(next);
      } else {
        forgetOfflineRoutePack(route.id);
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
      await deleteTiles(
        tilesForCorridor(points, pack.radiusKm, zoomLevelsUpTo(pack.maxZoom)),
        pack.layer
      );
    } catch {
      /* Cache nicht erreichbar – der Eintrag verschwindet trotzdem */
    } finally {
      forgetOfflineRoutePack(route.id);
      setPack(null);
      setBusy(false);
      toast.success(t.spotDetail.offlineMapDeleted);
    }
  };

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-2">
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
            aria-label={rp.offlineDownloadAria(route.name)}
          >
            <Download className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            {rp.offlineDownload}
          </Button>
          {pack && (
            <>
              <span className="text-xs text-muted-foreground">
                {rp.offlineSaved(
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
                aria-label={rp.offlineDeleteAria(route.name)}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                {rp.offlineDelete}
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
}
