import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ShareExpiryNote, ShareExpirySelect } from "@/components/ShareExpiry";
import type { ShareExpiryDays } from "@shared/sharing";
import { Link, useParams } from "wouter";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  Compass,
  Download,
  Droplets,
  Images,
  Loader2,
  MapPin,
  Moon,
  Mountain,
  MountainSnow,
  Navigation,
  Phone,
  QrCode,
  Share2,
  SlidersHorizontal,
  Sunrise,
  Trash2,
  Wallet,
  Waves,
  WifiOff,
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import QRCode from "qrcode";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import LazySection from "@/components/LazySection";
import LoginPrompt from "@/components/LoginPrompt";
import PhotoGallery from "@/components/PhotoGallery";
import DarkSkyPanel from "@/components/DarkSkyPanel";
import NearbyHikes from "@/components/NearbyHikes";
import NearbyExcursions from "@/components/NearbyExcursions";
import NearbyFirepits from "@/components/NearbyFirepits";
import PicnicStops from "@/components/PicnicStops";
import RouteWeather from "@/components/RouteWeather";
import DeparturePlanner from "@/components/DeparturePlanner";
import NearbyFamilyPlaces from "@/components/NearbyFamilyPlaces";
import NearbyShops from "@/components/NearbyShops";
import SpotRating from "@/components/SpotRating";
import NearbyTransit from "@/components/NearbyTransit";
import TickRiskPanel from "@/components/TickRiskPanel";
import SpotAttributeChips from "@/components/SpotAttributeChips";
import { MAX_PHOTOS_PER_SPOT } from "@shared/tripPhotos";
import {
  parseSpotAttributes,
  SPOT_ATTRIBUTES,
  type SpotAttributes,
} from "@shared/spotAttributes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { directionsUrl } from "@/lib/directions";
import { formatElevation, useAutoElevation } from "@/lib/elevation";
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
import { nightlyRappen } from "@shared/spotCosts";
import { formatChf, parseChfInput, rappenToInput } from "@/lib/money";
import { altitudeHint } from "@shared/altitude";
import { bathingComfort } from "@shared/bathingWater";
import { formatDistance } from "@shared/geo";
import { getSunTimes } from "@/lib/sun";
import { loadObstacleProfiles } from "@/lib/obstacleStore";
import { computeTripStats, tripNights } from "@shared/trips";
import {
  aggregateMonthlyClimate,
  bestTravelMonths,
  climateRequestUrl,
  climateYearRange,
  type MonthlyClimate,
} from "@shared/climate";
import { describeWeatherCode } from "@shared/weather";
import { fetchDossierWeather, type DossierWeather } from "@/lib/dossierWeather";
import { useI18n } from "@/i18n";
import { LOCALE_TAGS, pick } from "@shared/i18n";
import { cn } from "@/lib/utils";

// Wetter-Abruf ausgelagert: teilt sich das Dossier mit der öffentlichen
// Teil-Ansicht (/platz/:token)

/** Ladezustand «Beste Reisezeit»: die Archiv-API wird erst auf Klick befragt. */
type ClimateState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | {
      status: "ready";
      months: MonthlyClimate[];
      best: number[];
      fromYear: number;
      toYear: number;
    };

/**
 * Überschrift über einem Abschnitt des Dossiers.
 *
 * WOZU: Die Seite trägt zwei Dutzend Karten. Ohne Gliederung sucht man das
 * Zeckenrisiko zwischen Badestelle und Wanderwegen und die Reisekosten
 * irgendwo zwischen Kontaktdaten und Sonnenlauf. Die fünf Abschnitte
 * folgen der Reihenfolge, in der man die Fragen stellt: Was ist das für
 * ein Platz – wie komme ich hin – was für Wetter erwartet mich – was gibt
 * es rundherum – und was habe ich selbst dort abgelegt.
 *
 * Ein `<h2>`, kein optisch gestylter Absatz: Wer die Seite mit einer
 * Vorlesehilfe durchgeht, springt damit von Abschnitt zu Abschnitt.
 */
function SectionHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      // scroll-mt: Beim Sprung aus der Leiste soll die Überschrift nicht
      // unter der Kopfzeile verschwinden.
      className="mb-2 mt-6 scroll-mt-20 font-serif text-sm font-semibold uppercase tracking-wide text-muted-foreground"
    >
      {children}
    </h2>
  );
}

/** Die fünf Abschnitte des Dossiers – Reihenfolge wie auf der Seite. */
const SECTION_IDS = {
  place: "abschnitt-platz",
  arrival: "abschnitt-anreise",
  weather: "abschnitt-wetter",
  around: "abschnitt-umgebung",
  own: "abschnitt-eigenes",
} as const;

/**
 * Sprungleiste über die fünf Abschnitte.
 *
 * Das Dossier ist lang – wer unterwegs die Öffnungszeiten des Ladens sucht,
 * scrollt sonst an Wetter, Sonne und Anreise vorbei. Bewusst normale
 * Sprungmarken (`<a href="#…">`): Das funktioniert ohne JavaScript, die
 * Tastatur kann es, und der Zurück-Knopf bleibt unbelastet.
 */
function SectionNav({
  labels,
  ariaLabel,
}: {
  labels: [string, string][];
  ariaLabel: string;
}) {
  return (
    <nav
      aria-label={ariaLabel}
      className="mb-4 -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0"
    >
      <ul className="flex w-max gap-1.5">
        {labels.map(([id, label]) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className="inline-block rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * «Offline-Karte»: lädt die Karten-Kacheln rund um den Platz vorab in den
 * Cache «campmesser-map-tiles», damit Karte und Zelt-Finder ohne Empfang
 * funktionieren. Der Service Worker bedient die Kachel-Hosts danach
 * cache-first. Geladen wird der aktuell gewählte Basis-Layer (Karte oder
 * Satellit); welcher Platz ein Paket hat, merkt sich localStorage.
 */
function OfflineMapSection({
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
                      new Date(pack.savedAt).toLocaleDateString(
                        LOCALE_TAGS[lang],
                        { day: "2-digit", month: "2-digit", year: "numeric" }
                      )
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

/**
 * Badestellen-Info (#223): Wassertemperatur am Platz plus, wo vorhanden,
 * Abfluss und Pegel. In der Schweiz aus den offenen Hydrodaten der
 * nächstgelegenen BAFU-Messstelle, sonst aus der Meerwasser-Temperatur der
 * Marine-API. Liegt der Platz nicht am Wasser, bleibt die Karte ganz weg –
 * eine leere Karte «Wasser» wäre auf dem Berg nur Ballast.
 */
function BathingWaterCard({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const { lang, t } = useI18n();
  const query = trpc.water.nearby.useQuery(
    { latitude, longitude },
    { staleTime: 10 * 60 * 1000 }
  );
  const tw = t.bathingWater;

  if (query.isPending) {
    return (
      <Card className="mb-4">
        <CardContent className="py-4">
          <Skeleton className="h-16 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }
  const data = query.data;
  if (!data || data.source === "none") return null;

  const temperatureC =
    data.source === "station"
      ? data.reading.temperatureC
      : (data.marine?.temperatureC ?? null);
  const trend =
    data.source === "station"
      ? data.reading.trend
      : (data.marine?.trend ?? "unknown");
  const measuredAtMs =
    data.source === "station"
      ? data.reading.measuredAtMs
      : (data.marine?.measuredAtMs ?? null);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Waves className="h-4 w-4 text-primary" aria-hidden="true" />
          {tw.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted-foreground">
          {data.source === "station"
            ? tw.stationLine(
                data.station.waterBody,
                data.station.name,
                formatDistance(data.station.distanceM, lang)
              )
            : tw.marineLine}
        </p>

        {temperatureC !== null ? (
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-3xl font-semibold text-primary">
              {temperatureC.toFixed(1)}°C
            </p>
            <p className="text-sm font-medium">
              {tw.comfort[bathingComfort(temperatureC)]}
            </p>
            {trend !== "unknown" && (
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                {tw.trend[trend]}
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{tw.noTemperature}</p>
        )}

        {data.source === "station" &&
          (data.reading.flowM3s !== null ||
            data.reading.levelMasl !== null) && (
            <dl className="mt-3 space-y-1 text-sm">
              {data.reading.flowM3s !== null && (
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <dt className="w-32 shrink-0 text-muted-foreground">
                    {tw.flowLabel}
                  </dt>
                  <dd>{tw.flowValue(data.reading.flowM3s.toFixed(1))}</dd>
                </div>
              )}
              {data.reading.levelMasl !== null && (
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <dt className="w-32 shrink-0 text-muted-foreground">
                    {tw.levelLabel}
                  </dt>
                  <dd>{tw.levelValue(data.reading.levelMasl.toFixed(2))}</dd>
                </div>
              )}
            </dl>
          )}

        {measuredAtMs !== null && (
          <p className="mt-3 text-xs text-muted-foreground">
            {tw.measuredAt(
              new Date(measuredAtMs).toLocaleString(LOCALE_TAGS[lang], {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })
            )}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {data.source === "station" ? tw.sourceStation : tw.sourceMarine}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">{tw.safetyNote}</p>
      </CardContent>
    </Card>
  );
}

export default function SpotDetailPage() {
  const { lang, t } = useI18n();
  const params = useParams<{ id: string }>();
  const spotId = Number(params.id);
  const { isAuthenticated, loading } = useAuth();
  const spotsQuery = trpc.spots.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const [weather, setWeather] = useState<DossierWeather | null>(null);
  const [weatherFailed, setWeatherFailed] = useState(false);
  const [climateOpen, setClimateOpen] = useState(false);
  const [climate, setClimate] = useState<ClimateState>({ status: "idle" });
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareExpiresIn, setShareExpiresIn] = useState<ShareExpiryDays | null>(
    null
  );
  const [shareExpiresAt, setShareExpiresAt] = useState<Date | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const shareMutation = trpc.spots.share.useMutation();
  const unshareMutation = trpc.spots.unshare.useMutation();
  const updateMutation = trpc.spots.update.useMutation();
  const [attrDialogOpen, setAttrDialogOpen] = useState(false);
  const [attrDraft, setAttrDraft] = useState<SpotAttributes>({});
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactDraft, setContactDraft] = useState({
    phone: "",
    checkin: "",
    parcel: "",
  });
  // Platzkosten (#243): beide Beträge als Franken-Text im Formular,
  // gespeichert wird in Rappen (Muster Reisekasse/Inventar).
  const [costDialogOpen, setCostDialogOpen] = useState(false);
  const [costDraft, setCostDraft] = useState({ price: "", extra: "" });
  const utils = trpc.useUtils();
  const photosQuery = trpc.spots.photos.list.useQuery(
    { spotId },
    { enabled: isAuthenticated && Number.isInteger(spotId) && spotId > 0 }
  );
  const removePhotoMutation = trpc.spots.photos.remove.useMutation();

  // QR-Code zum Teil-Link erzeugen: am Platz einfach abscannen lassen statt Link verschicken
  useEffect(() => {
    if (!shareUrl) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(shareUrl, {
      width: 480,
      margin: 1,
      errorCorrectionLevel: "M",
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [shareUrl]);

  const spot = spotsQuery.data?.find(s => s.id === spotId);

  // Höhe über Meer einmalig bei Open-Meteo holen, falls noch nicht gespeichert
  useAutoElevation(spot);

  useEffect(() => {
    if (!spot) return;
    let cancelled = false;
    setWeatherFailed(false);
    fetchDossierWeather(spot.latitude, spot.longitude, lang)
      .then(data => {
        if (!cancelled) setWeather(data);
      })
      .catch(() => {
        if (!cancelled) setWeatherFailed(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spot?.id, lang]);

  // Klima-Abschnitt beim Platzwechsel zurücksetzen (Daten gehören zum Ort)
  useEffect(() => {
    setClimateOpen(false);
    setClimate({ status: "idle" });
  }, [spotId]);

  // Historisches Wetter (letzte 5 volle Jahre) laden – bewusst erst auf Klick,
  // die Archive-API ist deutlich träger als die Vorhersage-API.
  const loadClimate = async (lat: number, lon: number) => {
    setClimate({ status: "loading" });
    try {
      const range = climateYearRange(new Date());
      const res = await fetch(
        climateRequestUrl(lat, lon, range.startDate, range.endDate)
      );
      if (!res.ok) throw new Error(`climate service error ${res.status}`);
      const json = await res.json();
      const months = aggregateMonthlyClimate(json.daily);
      setClimate({
        status: "ready",
        months,
        best: bestTravelMonths(months),
        fromYear: range.fromYear,
        toYear: range.toYear,
      });
    } catch {
      setClimate({ status: "error" });
    }
  };

  const toggleClimate = () => {
    const next = !climateOpen;
    setClimateOpen(next);
    if (next && climate.status === "idle" && spot) {
      void loadClimate(spot.latitude, spot.longitude);
    }
  };

  // Monatsnamen in der aktiven Sprache (Jahr egal – nur der Monat zählt)
  const monthLabel = (month: number, style: "short" | "long") =>
    new Date(2000, month - 1, 1).toLocaleDateString(LOCALE_TAGS[lang], {
      month: style,
    });

  const climateChartData = useMemo(
    () =>
      climate.status === "ready"
        ? climate.months.map(m => ({
            label: monthLabel(m.month, "short"),
            max: m.avgTempMaxC,
            min: m.avgTempMinC,
            rain: m.rainDays,
          }))
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [climate, lang]
  );

  const sun = useMemo(
    () =>
      spot ? getSunTimes(new Date(), spot.latitude, spot.longitude) : null,
    [spot]
  );
  const obstacles = useMemo(
    () => loadObstacleProfiles().spots[String(spotId)] ?? [],
    [spotId]
  );
  const spotTrips = useMemo(
    () => (tripsQuery.data ?? []).filter(t => t.spotId === spotId),
    [tripsQuery.data, spotId]
  );
  const tripStats = useMemo(
    () =>
      computeTripStats(
        spotTrips.map(t => ({
          startDate: t.startDate,
          endDate: t.endDate,
          placeName: "x",
        })),
        lang
      ),
    [spotTrips, lang]
  );

  const fmtTime = (d: Date | null) =>
    d
      ? d.toLocaleTimeString(LOCALE_TAGS[lang], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "–";

  /** Rappen als «CHF 45.50» – gleiche Schreibweise wie in der Reisekasse. */
  const fmtChf = (rappen: number) =>
    `${t.tripExpenses.currency} ${formatChf(rappen, lang)}`;

  if (loading || (isAuthenticated && spotsQuery.isLoading)) {
    return (
      <div className="container flex justify-center py-16">
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          aria-label={t.common.loading}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-6">
        <PageHeader
          title={t.spotDetail.fallbackTitle}
          backHref="/zeltplaetze"
          backLabel={t.spotDetail.backLabel}
        />
        <LoginPrompt feature={t.spots.loginFeature} />
      </div>
    );
  }

  if (!spot) {
    return (
      <div className="container py-6">
        <PageHeader
          title={t.spotDetail.notFoundTitle}
          backHref="/zeltplaetze"
          backLabel={t.spotDetail.backLabel}
        />
      </div>
    );
  }

  const attributes = parseSpotAttributes(spot.attributesJson);

  const openAttrDialog = () => {
    setAttrDraft(attributes);
    setAttrDialogOpen(true);
  };

  const openContactDialog = () => {
    setContactDraft({
      phone: spot.receptionPhone ?? "",
      checkin: spot.checkinInfo ?? "",
      parcel: spot.parcelNumber ?? "",
    });
    setContactDialogOpen(true);
  };

  const saveContact = () => {
    updateMutation.mutate(
      {
        id: spot.id,
        receptionPhone: contactDraft.phone,
        checkinInfo: contactDraft.checkin,
        parcelNumber: contactDraft.parcel,
      },
      {
        onSuccess: () => {
          utils.spots.list.invalidate();
          setContactDialogOpen(false);
          toast.success(t.spotDetail.contactSaved);
        },
        onError: () => toast.error(t.common.saveFailed),
      }
    );
  };

  /** Etwas zum Anzeigen? Sonst zeigt die Karte den Leer-Hinweis. */
  const hasContact = Boolean(
    spot.receptionPhone || spot.checkinInfo || spot.parcelNumber
  );

  const openCostDialog = () => {
    setCostDraft({
      price: rappenToInput(spot.pricePerNightRappen),
      extra: rappenToInput(spot.extraPerNightRappen),
    });
    setCostDialogOpen(true);
  };

  const saveCosts = () => {
    updateMutation.mutate(
      {
        id: spot.id,
        // Leeres Feld → 0 → der Server löscht den Wert (null)
        pricePerNightRappen: parseChfInput(costDraft.price) ?? 0,
        extraPerNightRappen: parseChfInput(costDraft.extra) ?? 0,
      },
      {
        onSuccess: () => {
          utils.spots.list.invalidate();
          setCostDialogOpen(false);
          toast.success(t.spotDetail.costSaved);
        },
        onError: () => toast.error(t.common.saveFailed),
      }
    );
  };

  /** Preis pro Nacht inkl. Nebenkosten in Rappen; null = nichts erfasst. */
  const spotNightly = nightlyRappen(spot);
  /** Grobe Kosten-Schätzung für alle bisherigen Nächte an diesem Platz. */
  const costEstimateRappen =
    spotNightly !== null && tripStats.totalNights > 0
      ? spotNightly * tripStats.totalNights
      : null;

  const saveAttributes = () => {
    const json =
      Object.keys(attrDraft).length > 0 ? JSON.stringify(attrDraft) : null;
    updateMutation.mutate(
      { id: spot.id, attributesJson: json },
      {
        onSuccess: () => {
          utils.spots.list.invalidate();
          setAttrDialogOpen(false);
          toast.success(t.spotDetail.attributesSaved);
        },
        onError: () => toast.error(t.common.saveFailed),
      }
    );
  };

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader
        title={spot.name}
        backHref="/zeltplaetze"
        backLabel={t.spotDetail.backLabel}
      />
      <p className="mb-1 flex items-center gap-1.5 text-sm text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
        {spot.latitude.toFixed(4)}°, {spot.longitude.toFixed(4)}°
      </p>
      {spot.elevationM !== null && (
        <>
          <p className="mb-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MountainSnow className="h-3.5 w-3.5" aria-hidden="true" />
            {t.spotDetail.elevation(formatElevation(spot.elevationM, lang))}
          </p>
          {altitudeHint(spot.elevationM, lang) && (
            <p className="mb-2 rounded-lg bg-accent/50 px-3 py-2 text-xs text-accent-foreground">
              {altitudeHint(spot.elevationM, lang)}
            </p>
          )}
        </>
      )}
      {spot.note && (
        <p className="mb-4 text-sm text-muted-foreground">{spot.note}</p>
      )}

      <SectionNav
        ariaLabel={t.spotDetail.sectionNavAria}
        labels={[
          [SECTION_IDS.place, t.spotDetail.sectionPlace],
          [SECTION_IDS.arrival, t.spotDetail.sectionArrival],
          [SECTION_IDS.weather, t.spotDetail.sectionWeather],
          [SECTION_IDS.around, t.spotDetail.sectionAround],
          [SECTION_IDS.own, t.spotDetail.sectionOwn],
        ]}
      />

      <SectionHeading id={SECTION_IDS.place}>
        {t.spotDetail.sectionPlace}
      </SectionHeading>

      {/* Platz-Eigenschaften: Schatten, Sanitär, Lärm, WLAN … */}
      <Card className="mb-4 mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <SlidersHorizontal
              className="h-4 w-4 text-primary"
              aria-hidden="true"
            />
            {t.spotDetail.attributesTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(attributes).length > 0 ? (
            <SpotAttributeChips attributes={attributes} lang={lang} />
          ) : (
            <p className="text-sm text-muted-foreground">
              {t.spotDetail.attributesEmpty}
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={openAttrDialog}
          >
            {t.spotDetail.attributesEditButton}
          </Button>
        </CardContent>
      </Card>

      {/* Kontakt & Check-in: Rezeptions-Telefon, Zeiten, Parzellen-Nummer */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.spotDetail.contactTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasContact ? (
            <dl className="space-y-2 text-sm">
              {spot.receptionPhone && (
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <dt className="w-36 shrink-0 text-muted-foreground">
                    {t.spotDetail.contactPhoneLabel}
                  </dt>
                  <dd>
                    <a
                      href={`tel:${spot.receptionPhone.replace(/[^+\d]/g, "")}`}
                      className="font-medium text-primary hover:underline"
                      aria-label={t.spotDetail.contactPhoneAria(spot.name)}
                    >
                      {spot.receptionPhone}
                    </a>
                  </dd>
                </div>
              )}
              {spot.checkinInfo && (
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <dt className="w-36 shrink-0 text-muted-foreground">
                    {t.spotDetail.contactCheckinLabel}
                  </dt>
                  <dd>{spot.checkinInfo}</dd>
                </div>
              )}
              {spot.parcelNumber && (
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <dt className="w-36 shrink-0 text-muted-foreground">
                    {t.spotDetail.contactParcelLabel}
                  </dt>
                  <dd>{spot.parcelNumber}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t.spotDetail.contactEmpty}
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={openContactDialog}
          >
            {t.spotDetail.contactEditButton}
          </Button>
        </CardContent>
      </Card>

      {/* Platzkosten (#243): Preis pro Nacht und Nebenkosten pro Nacht */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.spotDetail.costTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {spotNightly !== null ? (
            <>
              <dl className="space-y-2 text-sm">
                {spot.pricePerNightRappen ? (
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <dt className="w-36 shrink-0 text-muted-foreground">
                      {t.spotDetail.costPriceLabel}
                    </dt>
                    <dd className="font-medium">
                      {fmtChf(spot.pricePerNightRappen)}
                    </dd>
                  </div>
                ) : null}
                {spot.extraPerNightRappen ? (
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <dt className="w-36 shrink-0 text-muted-foreground">
                      {t.spotDetail.costExtraLabel}
                    </dt>
                    <dd className="font-medium">
                      {fmtChf(spot.extraPerNightRappen)}
                    </dd>
                  </div>
                ) : null}
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <dt className="w-36 shrink-0 text-muted-foreground">
                    {t.spotDetail.costNightlyLabel}
                  </dt>
                  <dd className="font-serif text-lg font-bold text-primary">
                    {fmtChf(spotNightly)}
                  </dd>
                </div>
              </dl>
              {costEstimateRappen !== null && (
                <p className="mt-3 rounded-lg bg-accent/50 px-3 py-2 text-xs text-accent-foreground">
                  {t.spotDetail.costEstimate(
                    tripStats.totalNights,
                    fmtChf(costEstimateRappen)
                  )}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {t.spotDetail.costHint}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t.spotDetail.costEmpty}
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={openCostDialog}
          >
            {t.spotDetail.costEditButton}
          </Button>
        </CardContent>
      </Card>

      {/* Eigene Bewertung nach Kriterien (#278) – Sanitär, Ruhe, Schatten,
          Kinderfreundlichkeit einzeln */}
      <SpotRating
        spotId={spot.id}
        ratings={{
          sanitary: spot.ratingSanitary ?? null,
          quiet: spot.ratingQuiet ?? null,
          shade: spot.ratingShade ?? null,
          kids: spot.ratingKids ?? null,
        }}
        className="mb-4"
      />

      {/* Hindernis-Profil */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Mountain className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.spotDetail.obstacleTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {obstacles.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              {t.spotDetail.obstaclesRecorded(obstacles.length)}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t.spotDetail.obstacleEmpty}
            </p>
          )}
          <Link
            href={`/sonne?lat=${spot.latitude}&lon=${spot.longitude}&name=${encodeURIComponent(spot.name)}&spot=${spot.id}`}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Compass className="h-4 w-4" aria-hidden="true" />
            {obstacles.length > 0
              ? t.spotDetail.obstacleEdit
              : t.spotDetail.obstacleCreate}
          </Link>
        </CardContent>
      </Card>

      <SectionHeading id={SECTION_IDS.arrival}>
        {t.spotDetail.sectionArrival}
      </SectionHeading>

      {/* Anreise-Route zum Platz */}
      <div className="mt-1 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <a
            href={directionsUrl(spot.latitude, spot.longitude)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.spotDetail.routeAria}
          >
            <Navigation className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {t.spotDetail.routeButton}
          </a>
        </Button>
      </div>

      {/* Beste Abfahrtszeit (#285): von der Check-in-Zeit rückwärts,
          Pausen eingerechnet */}
      <LazySection minHeight={200}>
        <DeparturePlanner
          latitude={spot.latitude}
          longitude={spot.longitude}
          className="mb-4"
        />
      </LazySection>

      {/* Rast unterwegs: Picknickplätze im Korridor der Anfahrt (#250) */}
      <LazySection minHeight={200}>
        <PicnicStops
          latitude={spot.latitude}
          longitude={spot.longitude}
          placeName={spot.name}
          className="mb-4"
        />
      </LazySection>

      {/* Unwetter auf der Fahrtstrecke (#275): Wetter dort, wo man unterwegs
          sein wird – und zu der Zeit, zu der man dort sein wird */}
      <LazySection minHeight={200}>
        <RouteWeather
          latitude={spot.latitude}
          longitude={spot.longitude}
          placeName={spot.name}
          className="mb-4"
        />
      </LazySection>

      <SectionHeading id={SECTION_IDS.weather}>
        {t.spotDetail.sectionWeather}
      </SectionHeading>

      {/* Wetter */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Droplets className="h-4 w-4 text-chart-2" aria-hidden="true" />
            {t.spotDetail.weatherTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weatherFailed && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              {t.spotDetail.weatherFailed}
            </p>
          )}
          {!weather && !weatherFailed && (
            <Skeleton className="h-24 w-full rounded-lg" />
          )}
          {weather && (
            <>
              {weather.alerts.length > 0 ? (
                <p
                  className={cn(
                    "mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                    weather.alerts[0].severity === "gefahr"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-chart-4/15"
                  )}
                >
                  <AlertTriangle
                    className="h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  {weather.alerts[0].title}
                  {weather.alerts.length > 1 &&
                    t.spotDetail.moreAlerts(weather.alerts.length - 1)}
                </p>
              ) : (
                <p className="mb-3 text-sm text-muted-foreground">
                  {t.spotDetail.noAlerts}
                </p>
              )}
              <div className="divide-y divide-border/60">
                {weather.daily.map((d, i) => (
                  <div
                    key={d.date}
                    className="flex items-center gap-3 py-2 text-sm"
                  >
                    <span className="w-16 font-medium">
                      {i === 0
                        ? t.common.today
                        : new Date(d.date).toLocaleDateString(
                            LOCALE_TAGS[lang],
                            {
                              weekday: "short",
                              day: "numeric",
                            }
                          )}
                    </span>
                    <span className="flex-1 text-muted-foreground">
                      {describeWeatherCode(d.weatherCode, lang).label}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-chart-2">
                      <Droplets className="h-3 w-3" aria-hidden="true" />
                      {Math.round(d.precipProbability)} %
                    </span>
                    <span>
                      <span className="font-semibold">
                        {Math.round(d.tempMaxC)}°
                      </span>
                      <span className="text-muted-foreground">
                        {" "}
                        / {Math.round(d.tempMinC)}°
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Sonne heute */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sunrise className="h-4 w-4 text-chart-4" aria-hidden="true" />
            {t.spotDetail.sunTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-accent/50 py-2.5">
              <p className="font-mono text-lg font-bold">
                {fmtTime(sun?.sunrise ?? null)}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.spotDetail.sunrise}
              </p>
            </div>
            <div className="rounded-lg bg-accent/50 py-2.5">
              <p className="font-mono text-lg font-bold">
                {fmtTime(sun?.solarNoon ?? null)}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.spotDetail.noon}
              </p>
            </div>
            <div className="rounded-lg bg-accent/50 py-2.5">
              <p className="font-mono text-lg font-bold">
                {fmtTime(sun?.sunset ?? null)}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.spotDetail.sunset}
              </p>
            </div>
          </div>
          <Link
            href={`/sonne?lat=${spot.latitude}&lon=${spot.longitude}&name=${encodeURIComponent(spot.name)}&spot=${spot.id}`}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Compass className="h-4 w-4" aria-hidden="true" />
            {t.spotDetail.sunCompassLink}
          </Link>
        </CardContent>
      </Card>

      {/* Dunkler Himmel: geschätzte Bortle-Klasse plus «heute Nacht» */}
      <LazySection minHeight={200}>
        <DarkSkyPanel
          latitude={spot.latitude}
          longitude={spot.longitude}
          placeName={spot.name}
          astroLink
          className="mb-4"
        />
      </LazySection>

      {/* Beste Reisezeit: historisches Wetter, lädt erst beim Aufklappen */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            <button
              type="button"
              onClick={toggleClimate}
              aria-expanded={climateOpen}
              aria-controls="climate-section"
              className="flex w-full items-center gap-2 text-left"
            >
              <CalendarRange
                className="h-4 w-4 text-primary"
                aria-hidden="true"
              />
              {t.spotDetail.climateTitle}
              <ChevronDown
                className={cn(
                  "ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  climateOpen && "rotate-180"
                )}
                aria-hidden="true"
              />
            </button>
          </CardTitle>
        </CardHeader>
        {climateOpen && (
          <CardContent id="climate-section">
            <p className="mb-3 text-sm text-muted-foreground">
              {t.spotDetail.climateIntro}
            </p>
            {climate.status === "loading" && (
              <div
                aria-busy="true"
                aria-label={t.spotDetail.climateLoadingAria}
              >
                <Skeleton className="h-48 w-full rounded-lg" />
              </div>
            )}
            {climate.status === "error" && (
              <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                {t.spotDetail.climateFailed}
                <button
                  type="button"
                  onClick={() => loadClimate(spot.latitude, spot.longitude)}
                  className="font-medium text-primary underline"
                >
                  {t.spotDetail.climateRetry}
                </button>
              </p>
            )}
            {climate.status === "ready" && (
              <>
                {climate.best.length > 0 && (
                  <p className="mb-3 flex flex-wrap items-center gap-1.5 text-sm">
                    <span className="font-medium">
                      {t.spotDetail.climateBestTitle}
                    </span>
                    {climate.best.map(month => (
                      <span
                        key={month}
                        className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-medium"
                      >
                        {monthLabel(month, "long")}
                      </span>
                    ))}
                  </p>
                )}
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={climateChartData}
                      margin={{ top: 4, right: -18, bottom: 0, left: -18 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-border/60"
                      />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="temp" tick={{ fontSize: 10 }} />
                      <YAxis
                        yAxisId="rain"
                        orientation="right"
                        domain={[
                          0,
                          (max: number) => Math.max(10, Math.ceil(max)),
                        ]}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) =>
                          name === t.spotDetail.climateChartRain
                            ? [`${value} ${t.spotDetail.climateDaysUnit}`, name]
                            : [`${value} °C`, name]
                        }
                      />
                      <Bar
                        yAxisId="rain"
                        dataKey="rain"
                        name={t.spotDetail.climateChartRain}
                        fill="var(--chart-2)"
                        fillOpacity={0.55}
                        isAnimationActive={false}
                      />
                      <Line
                        yAxisId="temp"
                        type="monotone"
                        dataKey="max"
                        name={t.spotDetail.climateChartMax}
                        stroke="var(--chart-1)"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                      <Line
                        yAxisId="temp"
                        type="monotone"
                        dataKey="min"
                        name={t.spotDetail.climateChartMin}
                        stroke="var(--chart-4)"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t.spotDetail.climateLegend}
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {t.spotDetail.climateSource(climate.fromYear, climate.toYear)}
                </p>
              </>
            )}
          </CardContent>
        )}
      </Card>

      {/* Badestellen-Info: Wassertemperatur, Abfluss und Pegel am Platz */}
      <LazySection minHeight={160}>
        <BathingWaterCard latitude={spot.latitude} longitude={spot.longitude} />
      </LazySection>

      {/* Zeckenrisiko: FSME-Einstufung der Region plus Saison und Höhenlage */}
      <TickRiskPanel
        latitude={spot.latitude}
        longitude={spot.longitude}
        elevationM={spot.elevationM}
        className="mb-4"
      />

      <SectionHeading id={SECTION_IDS.around}>
        {t.spotDetail.sectionAround}
      </SectionHeading>

      {/* Wandern in der Umgebung: markierte OSM-Routen rund um den Platz */}
      <LazySection minHeight={90}>
        <NearbyHikes
          latitude={spot.latitude}
          longitude={spot.longitude}
          placeName={spot.name}
          className="mb-4"
        />
      </LazySection>

      {/* Feuer- und Grillstellen aus OpenStreetMap (#247) – lädt erst beim
          Aufklappen, Overpass wird nie automatisch gefragt */}
      <LazySection minHeight={90}>
        <NearbyFirepits
          latitude={spot.latitude}
          longitude={spot.longitude}
          placeName={spot.name}
          className="mb-4"
        />
      </LazySection>

      {/* Spielplätze und Badeplätze aus OpenStreetMap (#248) – gemischt nach
          Distanz, lädt ebenfalls erst beim Aufklappen */}
      <LazySection minHeight={90}>
        <NearbyFamilyPlaces
          latitude={spot.latitude}
          longitude={spot.longitude}
          placeName={spot.name}
          className="mb-4"
        />
      </LazySection>

      {/* Einkaufen in Platznähe (#273): Supermarkt, Bäckerei, Hofladen mit
          Öffnungszeiten – ebenfalls erst beim Aufklappen geholt */}
      <LazySection minHeight={90}>
        <NearbyShops
          latitude={spot.latitude}
          longitude={spot.longitude}
          placeName={spot.name}
          className="mb-4"
        />
      </LazySection>

      {/* ÖV ab Platz (#249): Haltestellen mit Distanz, auf Antippen die
          Abfahrtstafel – beides erst beim Aufklappen geholt */}
      <LazySection minHeight={90}>
        <NearbyTransit
          latitude={spot.latitude}
          longitude={spot.longitude}
          placeName={spot.name}
          className="mb-4"
        />
      </LazySection>

      {/* Ausflüge in der Nähe aus der eigenen Ausflugfinder-App (#271) –
          lädt erst beim Aufklappen, damit das Dossier nicht darauf wartet */}
      <LazySection minHeight={90}>
        <NearbyExcursions
          latitude={spot.latitude}
          longitude={spot.longitude}
          placeName={spot.name}
          className="mb-4"
        />
      </LazySection>

      <SectionHeading id={SECTION_IDS.own}>
        {t.spotDetail.sectionOwn}
      </SectionHeading>

      {/* Aufenthalte */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.spotDetail.staysTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {spotTrips.length > 0 ? (
            <>
              <div className="mb-3 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg bg-accent/50 py-2.5">
                  <p className="flex items-center justify-center gap-1.5 font-serif text-xl font-bold text-primary">
                    <Moon className="h-4 w-4" aria-hidden="true" />
                    {tripStats.totalNights}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.spotDetail.nightsTotalLabel(tripStats.totalNights)}
                  </p>
                </div>
                <div className="rounded-lg bg-accent/50 py-2.5">
                  <p className="font-serif text-xl font-bold">
                    {spotTrips.length}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.spotDetail.staysCountLabel(spotTrips.length)}
                  </p>
                </div>
              </div>
              <ul className="space-y-1.5">
                {spotTrips.slice(0, 3).map(trip => (
                  <li
                    key={trip.id}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <CalendarDays
                      className="h-3.5 w-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    {new Date(`${trip.startDate}T00:00:00`).toLocaleDateString(
                      LOCALE_TAGS[lang],
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }
                    )}{" "}
                    · {tripNights(trip.startDate, trip.endDate)}{" "}
                    {tripNights(trip.startDate, trip.endDate) === 1
                      ? t.common.night
                      : t.common.nights}
                    {trip.title && ` · ${trip.title}`}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t.spotDetail.staysEmpty}
            </p>
          )}
          <Link
            href="/tagebuch"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            {t.spotDetail.toDiary}
          </Link>
        </CardContent>
      </Card>

      {/* Fotos: privat – die geteilte Ansicht (/platz/:token) zeigt sie nicht */}
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Images className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.spotDetail.photosTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t.spotDetail.photosHint}
          </p>
          <PhotoGallery
            photos={photosQuery.data ?? []}
            loadFailed={photosQuery.isError}
            name={spot.name}
            maxPhotos={MAX_PHOTOS_PER_SPOT}
            uploadUrl={`/api/spots/${spot.id}/photos`}
            photoSrc={fileName => `/api/spots/photos/${fileName}`}
            onChanged={() => utils.spots.photos.list.invalidate({ spotId })}
            deletePhoto={photoId =>
              removePhotoMutation.mutateAsync({ photoId })
            }
            texts={{
              addPhotos: t.spotDetail.addPhotos,
              addPhotosAria: t.spotDetail.addPhotosAria,
              photoCountHint: t.spotDetail.photoCountHint,
              photoUploading: t.spotDetail.photoUploading,
              photoUploaded: t.spotDetail.photoUploaded,
              photoLimitReached: t.spotDetail.photoLimitReached,
              photoTooLarge: t.spotDetail.photoTooLarge,
              photoUnsupportedType: t.spotDetail.photoUnsupportedType,
              photoHeic: t.spotDetail.photoHeic,
              photoReadFailed: t.spotDetail.photoReadFailed,
              photoUploadFailed: t.spotDetail.photoUploadFailed,
              photosLoadFailed: t.spotDetail.photosLoadFailed,
              photoDeleteConfirm: t.spotDetail.photoDeleteConfirm,
              photoDeleted: t.spotDetail.photoDeleted,
              photoDeleteAria: t.spotDetail.photoDeleteAria,
              photoAlt: t.spotDetail.photoAlt,
              photoOpenAria: t.spotDetail.photoOpenAria,
              galleryTitle: t.spotDetail.galleryTitle,
              galleryCounter: t.spotDetail.galleryCounter,
              galleryPrev: t.spotDetail.galleryPrev,
              galleryNext: t.spotDetail.galleryNext,
              deleteFailed: t.common.deleteFailed,
            }}
          />
        </CardContent>
      </Card>

      {/* Offline-Karte: Kacheln rund um den Platz vorab laden */}
      <LazySection minHeight={120}>
        <OfflineMapSection spot={spot} />
      </LazySection>

      {/* Dossier teilen */}
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Share2 className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.spotDetail.shareTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            {t.spotDetail.shareDesc}
          </p>
          {shareUrl ? (
            <div>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                <code className="min-w-0 flex-1 truncate text-xs">
                  {shareUrl}
                </code>
                <button
                  type="button"
                  className="shrink-0 text-xs font-medium text-primary hover:underline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(shareUrl);
                      toast.success(t.common.linkCopied);
                    } catch {
                      toast.error(t.common.copyFailed);
                    }
                  }}
                >
                  {t.common.copy}
                </button>
                <button
                  type="button"
                  className="shrink-0 text-xs font-medium text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    unshareMutation.mutate(
                      { id: spot.id },
                      {
                        onSuccess: () => {
                          setShareUrl(null);
                          toast.success(t.spotDetail.stopShared);
                        },
                      }
                    )
                  }
                >
                  {t.spotDetail.stopShare}
                </button>
              </div>
              <div className="mt-2 space-y-1">
                <ShareExpirySelect
                  value={shareExpiresIn}
                  onChange={days => {
                    setShareExpiresIn(days);
                    shareMutation.mutate(
                      { id: spot.id, expiresInDays: days },
                      {
                        onSuccess: ({ expiresAt }) =>
                          setShareExpiresAt(expiresAt),
                        onError: () => toast.error(t.spotDetail.shareFailed),
                      }
                    );
                  }}
                />
                <ShareExpiryNote expiresAt={shareExpiresAt} />
              </div>
              {qrDataUrl && (
                <div className="mt-3 flex items-center gap-4 rounded-lg border border-border bg-card p-4">
                  {/* Weisser Rahmen, damit der Code auch im Dark Mode zuverlässig scannbar bleibt */}
                  <div className="shrink-0 rounded-md bg-white p-2 shadow-sm">
                    <img
                      src={qrDataUrl}
                      alt={t.spotDetail.qrAlt(spot.name)}
                      className="h-36 w-36"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-semibold">
                      <QrCode
                        className="h-4 w-4 text-primary"
                        aria-hidden="true"
                      />
                      {t.spotDetail.qrTitle}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.spotDetail.qrText}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <ShareExpirySelect
                value={shareExpiresIn}
                onChange={setShareExpiresIn}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={shareMutation.isPending}
                onClick={() =>
                  shareMutation.mutate(
                    { id: spot.id, expiresInDays: shareExpiresIn },
                    {
                      onSuccess: async ({ token, expiresAt }) => {
                        const url = `${window.location.origin}/platz/${token}`;
                        setShareUrl(url);
                        setShareExpiresAt(expiresAt);
                        try {
                          await navigator.clipboard.writeText(url);
                          toast.success(t.spotDetail.shareLinkCopied);
                        } catch {
                          toast.success(t.spotDetail.shareLinkCreated);
                        }
                      },
                      onError: () => toast.error(t.spotDetail.shareFailed),
                    }
                  )
                }
              >
                <Share2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {t.spotDetail.shareButton}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Eigenschaften bearbeiten */}
      <Dialog open={attrDialogOpen} onOpenChange={setAttrDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {t.spotDetail.attributesDialogTitle}
            </DialogTitle>
            <DialogDescription>
              {t.spotDetail.attributesDialogDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {SPOT_ATTRIBUTES.map(def => {
              const current = attrDraft[def.key];
              return (
                <div key={def.key}>
                  <p className="mb-1.5 text-sm font-medium">
                    {pick(def.label, lang)}
                  </p>
                  <div
                    className="flex flex-wrap gap-1.5"
                    role="group"
                    aria-label={t.spotDetail.attributeGroupAria(
                      pick(def.label, lang)
                    )}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setAttrDraft(prev => {
                          const next = { ...prev };
                          delete next[def.key];
                          return next;
                        })
                      }
                      className={cn(
                        "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                        current === undefined
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      )}
                      aria-pressed={current === undefined}
                    >
                      {t.spotDetail.attributeUnset}
                    </button>
                    {def.values.map(value => (
                      <button
                        key={value.value}
                        type="button"
                        onClick={() =>
                          setAttrDraft(prev => ({
                            ...prev,
                            [def.key]: value.value,
                          }))
                        }
                        className={cn(
                          "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                          current === value.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        )}
                        aria-pressed={current === value.value}
                      >
                        {pick(value.label, lang)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttrDialogOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button
              onClick={saveAttributes}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? t.common.saving : t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kontakt & Check-in bearbeiten (Muster Eigenschaften-Dialog) */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">
              {t.spotDetail.contactDialogTitle}
            </DialogTitle>
            <DialogDescription>
              {t.spotDetail.contactDialogDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="contact-phone">
                {t.spotDetail.contactPhoneLabel}
              </Label>
              <Input
                id="contact-phone"
                type="tel"
                maxLength={40}
                value={contactDraft.phone}
                onChange={e =>
                  setContactDraft(prev => ({ ...prev, phone: e.target.value }))
                }
                placeholder={t.spotDetail.contactPhonePlaceholder}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-checkin">
                {t.spotDetail.contactCheckinLabel}
              </Label>
              <Input
                id="contact-checkin"
                maxLength={120}
                value={contactDraft.checkin}
                onChange={e =>
                  setContactDraft(prev => ({
                    ...prev,
                    checkin: e.target.value,
                  }))
                }
                placeholder={t.spotDetail.contactCheckinPlaceholder}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-parcel">
                {t.spotDetail.contactParcelLabel}
              </Label>
              <Input
                id="contact-parcel"
                maxLength={40}
                value={contactDraft.parcel}
                onChange={e =>
                  setContactDraft(prev => ({ ...prev, parcel: e.target.value }))
                }
                placeholder={t.spotDetail.contactParcelPlaceholder}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setContactDialogOpen(false)}
            >
              {t.common.cancel}
            </Button>
            <Button onClick={saveContact} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t.common.saving : t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Platzkosten bearbeiten (#243) */}
      <Dialog open={costDialogOpen} onOpenChange={setCostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">
              {t.spotDetail.costDialogTitle}
            </DialogTitle>
            <DialogDescription>{t.spotDetail.costDialogDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cost-price">
                {t.spotDetail.costPriceInputLabel}
              </Label>
              <Input
                id="cost-price"
                type="text"
                inputMode="decimal"
                maxLength={10}
                value={costDraft.price}
                onChange={e =>
                  setCostDraft(prev => ({ ...prev, price: e.target.value }))
                }
                placeholder={t.spotDetail.costPricePlaceholder}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cost-extra">
                {t.spotDetail.costExtraInputLabel}
              </Label>
              <Input
                id="cost-extra"
                type="text"
                inputMode="decimal"
                maxLength={10}
                value={costDraft.extra}
                onChange={e =>
                  setCostDraft(prev => ({ ...prev, extra: e.target.value }))
                }
                placeholder={t.spotDetail.costExtraPlaceholder}
              />
              <p className="text-xs text-muted-foreground">
                {t.spotDetail.costExtraHelp}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCostDialogOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={saveCosts} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t.common.saving : t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
