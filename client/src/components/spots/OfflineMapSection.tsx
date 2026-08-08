/**
 * «Offline-Karte» im Platz-Dossier (#217/#439, aus SpotDetail.tsx
 * herausgelöst): lädt die Karten-Kacheln rund um den Platz vorab in den
 * Cache, damit Karte und Zelt-Finder ohne Empfang funktionieren.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Trash2, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { fmtNumeric } from "@/lib/dateFormat";
import type { MapLayerKind } from "@/lib/mapLayers";
import {
  currentTileLayer,
  deleteTiles,
  downloadTiles,
  forgetOfflineMap,
  loadOfflineMaps,
  MAX_OFFLINE_TILES,
  OFFLINE_MAX_ZOOMS,
  OFFLINE_RADII_KM,
  rememberOfflineMap,
  tileCacheSupported,
  tilesForArea,
  zoomLevelsUpTo,
  type OfflineMapPack,
} from "@/lib/mapTiles";
import { useI18n } from "@/i18n";
import { LOCALE_TAGS } from "@shared/i18n";
import { cn } from "@/lib/utils";

/**
 * «Offline-Karte»: lädt die Karten-Kacheln rund um den Platz vorab in den
 * Cache «campmesser-map-tiles», damit Karte und Zelt-Finder ohne Empfang
 * funktionieren. Der Service Worker bedient die Kachel-Hosts danach
 * cache-first. Geladen wird der aktuell gewählte Basis-Layer (Karte oder
 * Satellit); welcher Platz ein Paket hat, merkt sich localStorage.
 */
export default function OfflineMapSection({
  spot,
}: {
  spot: { id: number; name: string; latitude: number; longitude: number };
}) {
  const { lang, t } = useI18n();
  const [radiusKm, setRadiusKm] = useState<number>(OFFLINE_RADII_KM[1]);
  const [maxZoom, setMaxZoom] = useState<number>(OFFLINE_MAX_ZOOMS[1]);
  const [pack, setPack] = useState<OfflineMapPack | null>(null);
  const [progress, setProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const supported = tileCacheSupported();

  // Gespeichertes Paket dieses Platzes laden – und die Auswahl darauf setzen
  useEffect(() => {
    const stored = loadOfflineMaps()[String(spot.id)] ?? null;
    setPack(stored);
    if (stored) {
      setRadiusKm(stored.radiusKm);
      setMaxZoom(stored.maxZoom);
    }
  }, [spot.id]);

  const tiles = useMemo(
    () =>
      tilesForArea(
        spot.latitude,
        spot.longitude,
        radiusKm,
        zoomLevelsUpTo(maxZoom)
      ),
    [spot.latitude, spot.longitude, radiusKm, maxZoom]
  );
  const capped = tiles.length >= MAX_OFFLINE_TILES;

  const layerName = (layer: MapLayerKind) =>
    layer === "satellite" ? t.mapView.layerSatellite : t.mapView.layerMap;

  const startDownload = async () => {
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setProgress({ done: 0, total: tiles.length });
    const layer = currentTileLayer();
    try {
      // Reste eines früheren Pakets, die jetzt nicht mehr dazugehören,
      // vorher wegräumen – sonst wachsen die Kacheln im Cache still an.
      if (pack) {
        const keep = new Set(
          tiles.map(tile => `${tile.z}/${tile.x}/${tile.y}`)
        );
        const stale = tilesForArea(
          spot.latitude,
          spot.longitude,
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
          radiusKm,
          maxZoom,
          layer,
          tiles: result.stored,
          bytes: result.bytes,
          savedAt: new Date().toISOString(),
        };
        rememberOfflineMap(spot.id, next);
        setPack(next);
      } else {
        forgetOfflineMap(spot.id);
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
        tilesForArea(
          spot.latitude,
          spot.longitude,
          pack.radiusKm,
          zoomLevelsUpTo(pack.maxZoom)
        ),
        pack.layer
      );
    } catch {
      /* Cache nicht erreichbar – der Eintrag verschwindet trotzdem */
    } finally {
      forgetOfflineMap(spot.id);
      setPack(null);
      setBusy(false);
      toast.success(t.spotDetail.offlineMapDeleted);
    }
  };

  const chipClass = (active: boolean) =>
    cn(
      "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
      active
        ? "bg-primary text-primary-foreground"
        : "bg-muted text-muted-foreground hover:text-foreground"
    );

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <WifiOff className="h-4 w-4 text-primary" aria-hidden="true" />
          {t.spotDetail.offlineMapTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {t.spotDetail.offlineMapDesc}
        </p>
        {!supported ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {t.spotDetail.offlineMapUnsupported}
          </p>
        ) : (
          <>
            <div className="mt-3">
              <p className="mb-1.5 text-sm font-medium">
                {t.spotDetail.offlineMapRadiusLabel}
              </p>
              <div
                className="flex flex-wrap gap-1.5"
                role="group"
                aria-label={t.spotDetail.offlineMapRadiusGroupAria}
              >
                {OFFLINE_RADII_KM.map(km => (
                  <button
                    key={km}
                    type="button"
                    disabled={busy}
                    onClick={() => setRadiusKm(km)}
                    className={chipClass(radiusKm === km)}
                    aria-pressed={radiusKm === km}
                  >
                    {t.spotDetail.offlineMapRadiusOption(km)}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3">
              <p className="mb-1.5 text-sm font-medium">
                {t.spotDetail.offlineMapDetailLabel}
              </p>
              <div
                className="flex flex-wrap gap-1.5"
                role="group"
                aria-label={t.spotDetail.offlineMapDetailGroupAria}
              >
                {OFFLINE_MAX_ZOOMS.map(zoom => (
                  <button
                    key={zoom}
                    type="button"
                    disabled={busy}
                    onClick={() => setMaxZoom(zoom)}
                    className={chipClass(maxZoom === zoom)}
                    aria-pressed={maxZoom === zoom}
                  >
                    {t.spotDetail.offlineMapDetailOption(zoom)}
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-3 text-sm">
              {t.spotDetail.offlineMapTileCount(tiles.length)}
              <span className="text-muted-foreground">
                {" · "}
                {t.spotDetail.offlineMapLayerNote(
                  layerName(currentTileLayer())
                )}
              </span>
            </p>
            {capped && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t.spotDetail.offlineMapCapped(MAX_OFFLINE_TILES)}
              </p>
            )}

            {progress && (
              <div className="mt-3">
                <Progress
                  value={
                    progress.total > 0
                      ? (progress.done / progress.total) * 100
                      : 0
                  }
                  aria-label={t.spotDetail.offlineMapProgress(
                    progress.done,
                    progress.total
                  )}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.spotDetail.offlineMapProgress(
                    progress.done,
                    progress.total
                  )}
                </p>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {busy ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => abortRef.current?.abort()}
                >
                  {t.spotDetail.offlineMapCancel}
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={startDownload}
                  aria-label={t.spotDetail.offlineMapDownloadAria(spot.name)}
                >
                  <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {t.spotDetail.offlineMapDownload}
                </Button>
              )}
              {pack && !busy && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removePack}
                  aria-label={t.spotDetail.offlineMapDeleteAria(spot.name)}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {t.spotDetail.offlineMapDelete}
                </Button>
              )}
            </div>

            {pack && (
              <p className="mt-2 text-sm text-muted-foreground">
                {t.spotDetail.offlineMapSaved(
                  pack.tiles,
                  new Intl.NumberFormat(LOCALE_TAGS[lang], {
                    maximumFractionDigits: 1,
                  }).format(pack.bytes / (1024 * 1024))
                )}
                {pack.savedAt
                  ? ` · ${t.spotDetail.offlineMapSavedAt(
                      fmtNumeric(new Date(pack.savedAt), lang)
                    )}`
                  : ""}
              </p>
            )}

            <p className="mt-3 text-xs text-muted-foreground">
              {t.spotDetail.offlineMapFairUse}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
