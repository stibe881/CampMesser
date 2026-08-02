/**
 * Regenradar (RainViewer): aufklappbarer Abschnitt im Wetter-Modul mit einer
 * Leaflet-Karte um den gewählten Ort (OSM-Tiles) und einem animierten
 * Niederschlags-Overlay – letzte ~60 Minuten plus Nowcast-Prognose.
 *
 * Leaflet und die Radar-Frames werden bewusst erst beim Aufklappen geladen
 * (dynamischer Import), damit die Wetter-Seite schlank bleibt. Alle Frames
 * werden als eigene Tile-Layer vorgehalten und nur per Opacity umgeschaltet,
 * damit die Animation nicht flackert; beim Schliessen/Verlassen wird die
 * Karte sauber abgebaut.
 */
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  CloudRain,
  Pause,
  Play,
} from "lucide-react";
import type * as Leaflet from "leaflet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import { LOCALE_TAGS } from "@shared/i18n";

/** Ein Radar-Frame der RainViewer-API (Unix-Sekunden + Tile-Pfad). */
interface RadarFrame {
  time: number;
  path: string;
  /** true = Nowcast (Kurzfrist-Prognose), false = Messung */
  forecast: boolean;
}

/** Abspielgeschwindigkeit der Animation. */
const FRAME_INTERVAL_MS = 500;
/** Deckkraft des Radar-Overlays über der Karte. */
const RADAR_OPACITY = 0.7;
/** Vergangene Frames (alle 10 Minuten) – 7 Stück ≈ letzte 60 Minuten. */
const PAST_FRAME_COUNT = 7;
/** Kartenausschnitt um den gewählten Ort. */
const RADAR_ZOOM = 8;

/** Radar-Tile-URL für einen Frame-Pfad der weather-maps.json. */
export function radarTileUrl(path: string): string {
  return `https://tilecache.rainviewer.com${path}/256/{z}/{x}/{y}/2/1_1.png`;
}

/** Frames (letzte ~60 min + Nowcast) von der RainViewer-API laden. */
async function fetchRadarFrames(): Promise<RadarFrame[]> {
  const res = await fetch(
    "https://api.rainviewer.com/public/weather-maps.json"
  );
  if (!res.ok) throw new Error(`rainviewer error ${res.status}`);
  const json = (await res.json()) as {
    radar?: {
      past?: { time?: unknown; path?: unknown }[];
      nowcast?: { time?: unknown; path?: unknown }[];
    };
  };
  const toFrames = (
    entries: { time?: unknown; path?: unknown }[] | undefined,
    forecast: boolean
  ): RadarFrame[] =>
    (entries ?? [])
      .filter(
        (f): f is { time: number; path: string } =>
          typeof f.time === "number" &&
          Number.isFinite(f.time) &&
          typeof f.path === "string" &&
          f.path.length > 0
      )
      .map(f => ({ time: f.time, path: f.path, forecast }));
  return [
    ...toFrames(json.radar?.past, false).slice(-PAST_FRAME_COUNT),
    ...toFrames(json.radar?.nowcast, true),
  ];
}

/** Ladezustand: Leaflet-Modul und Frames kommen gemeinsam an. */
type RadarState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; frames: RadarFrame[] };

export default function RainRadar({ lat, lon }: { lat: number; lon: number }) {
  const { lang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<RadarState>({ status: "idle" });
  const [playing, setPlaying] = useState(true);
  const [frameIndex, setFrameIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const frameLayersRef = useRef<Leaflet.TileLayer[]>([]);
  const leafletRef = useRef<typeof Leaflet | null>(null);

  // Radar-Daten und Leaflet erst beim Aufklappen laden (lazy)
  useEffect(() => {
    if (!open || state.status !== "idle") return;
    let cancelled = false;
    setState({ status: "loading" });
    Promise.all([
      import("leaflet"),
      import("leaflet/dist/leaflet.css"),
      fetchRadarFrames(),
    ])
      .then(([leafletModule, , frames]) => {
        if (cancelled) return;
        if (frames.length === 0) {
          setState({ status: "error" });
          return;
        }
        leafletRef.current = leafletModule.default;
        // Beim aktuellsten Messwert starten (letzter Nicht-Prognose-Frame)
        const lastPast = frames.filter(f => !f.forecast).length - 1;
        setFrameIndex(Math.max(0, lastPast));
        setState({ status: "ready", frames });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [open, state.status]);

  // Karte aufbauen, sobald Frames bereit sind – alle Frame-Layer werden
  // sofort (unsichtbar) hinzugefügt, damit ihre Tiles vorgeladen sind.
  useEffect(() => {
    const L = leafletRef.current;
    if (!open || state.status !== "ready" || !L) return;
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = L.map(container, {
      center: [lat, lon],
      zoom: RADAR_ZOOM,
      scrollWheelZoom: false,
    });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 12,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    L.circleMarker([lat, lon], {
      radius: 6,
      color: "#ffffff",
      weight: 2,
      fillColor: "#2f6b4f",
      fillOpacity: 1,
    }).addTo(map);
    frameLayersRef.current = state.frames.map(frame =>
      L.tileLayer(radarTileUrl(frame.path), {
        opacity: 0,
        maxZoom: 12,
        attribution: '<a href="https://www.rainviewer.com/">RainViewer</a>',
      }).addTo(map)
    );
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      frameLayersRef.current = [];
    };
  }, [open, state, lat, lon]);

  // Frame-Wechsel: nur Opacity umschalten statt Layer neu zu erzeugen
  useEffect(() => {
    frameLayersRef.current.forEach((layer, i) => {
      layer.setOpacity(i === frameIndex ? RADAR_OPACITY : 0);
    });
  }, [frameIndex, state, open]);

  // Animations-Loop
  useEffect(() => {
    if (!open || !playing || state.status !== "ready") return;
    const id = window.setInterval(() => {
      setFrameIndex(i => (i + 1) % state.frames.length);
    }, FRAME_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [open, playing, state]);

  const currentFrame =
    state.status === "ready" ? (state.frames[frameIndex] ?? null) : null;
  const frameTime = currentFrame
    ? new Date(currentFrame.time * 1000).toLocaleTimeString(LOCALE_TAGS[lang], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <section aria-label={t.weather.radarAria} className="mb-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            <button
              type="button"
              onClick={() => setOpen(o => !o)}
              aria-expanded={open}
              aria-controls="rain-radar-section"
              className="flex w-full items-center gap-2 text-left"
            >
              <CloudRain className="h-4 w-4 text-primary" aria-hidden="true" />
              {t.weather.radarTitle}
              <ChevronDown
                className={cn(
                  "ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  open && "rotate-180"
                )}
                aria-hidden="true"
              />
            </button>
          </CardTitle>
        </CardHeader>
        {open && (
          <CardContent id="rain-radar-section">
            <p className="mb-3 text-sm text-muted-foreground">
              {t.weather.radarIntro}
            </p>
            {state.status === "loading" && (
              <div aria-busy="true" aria-label={t.weather.radarLoadingAria}>
                <Skeleton className="h-72 w-full rounded-xl" />
              </div>
            )}
            {state.status === "error" && (
              <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                {t.weather.radarFailed}
                <button
                  type="button"
                  onClick={() => setState({ status: "idle" })}
                  className="font-medium text-primary underline"
                >
                  {t.weather.retry}
                </button>
              </p>
            )}
            {state.status === "ready" && (
              <>
                <div
                  ref={containerRef}
                  role="region"
                  aria-label={t.weather.radarMapAria}
                  className="h-72 w-full rounded-xl border border-border"
                />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPlaying(p => !p)}
                    aria-label={
                      playing
                        ? t.weather.radarPauseAria
                        : t.weather.radarPlayAria
                    }
                  >
                    {playing ? (
                      <Pause className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Play className="h-4 w-4" aria-hidden="true" />
                    )}
                  </Button>
                  {frameTime && (
                    <p className="text-sm font-medium tabular-nums">
                      {t.weather.radarTimestamp(frameTime)}
                      {currentFrame?.forecast && (
                        <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground">
                          {t.weather.radarForecastBadge}
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t.weather.radarSource}
                </p>
              </>
            )}
          </CardContent>
        )}
      </Card>
    </section>
  );
}
