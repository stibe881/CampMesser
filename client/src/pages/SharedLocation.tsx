/**
 * Öffentliche Ansicht eines geteilten Standorts (#221): «Hier bin ich».
 *
 * Bewusst schlank – wer den Link im Chat antippt, will genau drei Dinge:
 * sehen, wo die Person ist, dorthin navigieren und die Koordinaten kopieren
 * können. Deshalb kein Wetter, keine Kontodaten, nur Karte, Koordinaten,
 * Genauigkeit und Alter der Messung.
 *
 * Der Standort wird nachgeführt: solange der Link gültig ist, kann die
 * teilende Person ihn aktualisieren. Ein Refetch-Intervall holt den neuen
 * Stand, ohne dass jemand neu laden muss. Abgelaufene oder deaktivierte
 * Links verhalten sich wie unbekannte Tokens und zeigen den bekannten
 * Ablauf-Hinweis.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "wouter";
import { Copy, Loader2, MapPin, Navigation } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  defaultProvider,
  directionsUrl,
  openDirections,
} from "@/lib/directions";
import { loadMapLayer } from "@/lib/mapLayers";
import {
  createMap,
  type MapEngine,
  type MarkerObject,
  type PathObject,
} from "@/lib/mapEngine";
import { useMapConfig } from "@/hooks/useMapConfig";
import { useI18n } from "@/i18n";
import { LOCALE_TAGS } from "@shared/i18n";
import { relativeAge } from "@shared/sharing";

/** Karte mit einem einzelnen Punkt samt Genauigkeits-Kreis. */
function LocationMap({
  lat,
  lon,
  accuracyM,
}: {
  lat: number;
  lon: number;
  accuracyM: number | null;
}) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<MapEngine | null>(null);
  const markerRef = useRef<MarkerObject | null>(null);
  const haloRef = useRef<PathObject | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const maps = useMapConfig();

  // Karte einmalig aufbauen – erst, wenn feststeht, welcher Kartendienst
  // es wird (Google, sonst OpenStreetMap)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || engineRef.current || !maps.ready) return;
    let cancelled = false;
    void createMap(container, {
      center: [lat, lon],
      zoom: 16,
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
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      engineRef.current?.destroy();
      engineRef.current = null;
      markerRef.current = null;
      haloRef.current = null;
      setReady(false);
    };
    // Nur beim ersten Aufbau – spätere Positionen zieht der Effect darunter nach
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maps.ready]);

  // Position nachführen, wenn der Standort aktualisiert wurde
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !ready) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lon]);
    } else {
      markerRef.current = engine.circleMarker([lat, lon], {
        radius: 8,
        color: "#ffffff",
        weight: 2,
        fillColor: "#2563eb",
        fillOpacity: 1,
      });
    }
    // Genauigkeits-Kreis: zeigt ehrlich, wie scharf die Position ist
    haloRef.current?.remove();
    haloRef.current = null;
    if (accuracyM !== null && accuracyM > 0) {
      haloRef.current = engine.circle([lat, lon], {
        radius: accuracyM,
        color: "#2563eb",
        weight: 1,
        fillColor: "#2563eb",
        fillOpacity: 0.12,
      });
    }
    engine.setView([lat, lon], engine.getZoom());
  }, [ready, lat, lon, accuracyM]);

  if (failed) {
    return (
      <p className="text-sm text-muted-foreground">
        {t.sharedLocation.mapFailed}
      </p>
    );
  }
  if (!maps.ready) return <Skeleton className="h-72 w-full rounded-lg" />;
  return (
    <div
      ref={containerRef}
      className="h-72 w-full overflow-hidden rounded-lg border border-border"
      role="img"
      aria-label={t.sharedLocation.mapAria}
    />
  );
}

export default function SharedLocationPage() {
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";
  const { lang, t } = useI18n();
  const query = trpc.location.sharedGet.useQuery(
    { token },
    // Der Standort wird nachgeführt – alle 30 s nachschauen genügt völlig
    { enabled: token.length >= 8, retry: false, refetchInterval: 30_000 }
  );
  const share = query.data;

  // Minutentakt, damit «vor 5 Minuten» nicht stehen bleibt
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const ageText = useMemo(() => {
    if (!share) return "";
    const { value, unit } = relativeAge(share.capturedAt, new Date(now));
    return new Intl.RelativeTimeFormat(LOCALE_TAGS[lang], {
      numeric: "auto",
    }).format(value, unit);
  }, [share, now, lang]);

  const coords = share
    ? `${share.latitude.toFixed(5)}, ${share.longitude.toFixed(5)}`
    : "";

  if (query.isLoading) {
    return (
      <div className="container flex justify-center py-16">
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          aria-label={t.common.loading}
        />
      </div>
    );
  }

  if (!share) {
    return (
      <div className="container max-w-xl py-16 text-center">
        <MapPin
          className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50"
          aria-hidden="true"
        />
        <p className="font-medium">{t.sharing.expiredOrInvalid}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.sharedLocation.invalidHint}
        </p>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-6">
      <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
        {t.sharedLocation.badge}
      </p>
      <h1 className="font-serif text-2xl font-bold md:text-3xl">
        {share.name
          ? t.sharedLocation.titleNamed(share.name)
          : t.sharedLocation.title}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t.sharedLocation.capturedAgo(ageText)}
      </p>

      <Card className="mt-5">
        <CardContent className="pt-6">
          <LocationMap
            lat={share.latitude}
            lon={share.longitude}
            accuracyM={share.accuracyM}
          />

          <div className="mt-4 rounded-lg bg-muted p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t.sharedLocation.coordsLabel}
            </p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="font-mono text-lg font-semibold">{coords}</p>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t.sharedLocation.copyAria}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(coords);
                    toast.success(t.sharedLocation.coordsCopied);
                  } catch {
                    toast.error(t.common.copyFailed);
                  }
                }}
              >
                <Copy className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            {share.accuracyM !== null &&
              `${t.sharedLocation.accuracy(share.accuracyM)} · `}
            {t.sharedLocation.capturedAt(
              new Date(share.capturedAt).toLocaleTimeString(LOCALE_TAGS[lang], {
                hour: "2-digit",
                minute: "2-digit",
              })
            )}
          </p>

          <Button asChild className="mt-4 w-full">
            <a
              href={directionsUrl(
                share.latitude,
                share.longitude,
                defaultProvider()
              )}
              onClick={event => {
                event.preventDefault();
                openDirections(share.latitude, share.longitude);
              }}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Navigation className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.sharedLocation.navigate}
            </a>
          </Button>
        </CardContent>
      </Card>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        {t.sharedLocation.expiresNote(
          new Date(share.expiresAt).toLocaleString(LOCALE_TAGS[lang], {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        )}
      </p>
      <p className="mt-1 text-center text-xs text-muted-foreground">
        {t.sharedLocation.footer}
      </p>
    </div>
  );
}
