/**
 * Generische «Punkte in der Nähe»-Karte (#487/#492/#493/#494).
 *
 * Strände, Trinkwasser-Stellen, E-Ladesäulen und Defibrillatoren sind
 * dieselbe Ansicht mit anderer Abfrage: aufklappen, auf Klick suchen
 * (Overpass ist rate-limitiert, nie automatisch), Liste mit Distanz und
 * Navigation. Statt vier Kopien von NearbySights (#479) gibt es EINE
 * Karte, die Abfrage, Parser und Texte als Props bekommt.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Navigation, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  defaultProvider,
  directionsUrl,
  openDirections,
} from "@/lib/directions";
import {
  fetchOverpass,
  nearestPois,
  type OsmPoi,
  type PoiDistance,
} from "@/lib/overpass";
import { useI18n } from "@/i18n";
import { formatDistance } from "@shared/geo";
import { applyRouteDistances } from "@shared/routing";
import { useRoutedDistances } from "@/hooks/useRoutedDistances";
import { cn } from "@/lib/utils";

const NEARBY_LIMIT = 10;

type Status = "idle" | "loading" | "ready" | "failed";

/** Die Texte, die sich je Suche unterscheiden – alles andere ist gleich. */
export interface NearbyPointsTexts {
  title: string;
  subtitle: string;
  /** Titel für namenlose Punkte («Strand», «Brunnen», «Defibrillator»). */
  unnamed: string;
  empty: (radius: string) => string;
}

export default function NearbyPoints({
  latitude,
  longitude,
  icon: Icon,
  texts,
  query,
  parse,
  radii,
  defaultRadiusM,
  profile,
  sectionId,
  className,
}: {
  latitude: number;
  longitude: number;
  icon: LucideIcon;
  texts: NearbyPointsTexts;
  query: (lat: number, lon: number, radiusM: number) => string;
  parse: (json: unknown) => OsmPoi[];
  radii: number[];
  defaultRadiusM: number;
  /** Läuft man hin oder fährt man? Bestimmt die Weg-Distanzen (#299). */
  profile: "foot" | "car";
  sectionId: string;
  className?: string;
}) {
  const { lang, t } = useI18n();
  const tp = t.poi;
  const [open, setOpen] = useState(false);
  const [radiusM, setRadiusM] = useState(defaultRadiusM);
  const [status, setStatus] = useState<Status>("idle");
  const [points, setPoints] = useState<PoiDistance[]>([]);
  const routed = useRoutedDistances(
    points.length > 0 ? { lat: latitude, lon: longitude } : null,
    points.map(({ place }) => ({
      id: place.id,
      lat: place.lat,
      lon: place.lon,
    })),
    profile
  );
  const pointList = applyRouteDistances(points, routed.byId);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const search = useCallback(
    async (radius: number) => {
      setStatus("loading");
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetchOverpass(
          `data=${encodeURIComponent(query(latitude, longitude, radius))}`,
          controller.signal
        );
        const json: unknown = await res.json();
        setPoints(nearestPois(parse(json), latitude, longitude, NEARBY_LIMIT));
        setStatus("ready");
      } catch {
        if (controller.signal.aborted) return;
        setStatus("failed");
      }
    },
    [latitude, longitude, query, parse]
  );

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && status === "idle") void search(radiusM);
  };

  const chooseRadius = (value: number) => {
    setRadiusM(value);
    void search(value);
  };

  return (
    <section
      className={cn("rounded-xl border border-border bg-card p-4", className)}
      aria-label={texts.title}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={sectionId}
        className="flex w-full items-center gap-2 text-left"
      >
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
        <span className="font-serif text-lg font-semibold">{texts.title}</span>
        <ChevronDown
          className={cn(
            "ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
      <p className="mt-1 text-sm text-muted-foreground">{texts.subtitle}</p>

      {open && (
        <div id={sectionId}>
          <div
            className="mt-3 flex flex-wrap items-center gap-2"
            role="group"
            aria-label={tp.radiusGroupAria}
          >
            <span className="text-sm text-muted-foreground">
              {tp.radiusLabel}
            </span>
            {radii.map(value => (
              <button
                key={value}
                type="button"
                onClick={() => chooseRadius(value)}
                aria-pressed={radiusM === value}
                disabled={status === "loading"}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm transition-colors disabled:opacity-60",
                  radiusM === value
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                {formatDistance(value, lang)}
              </button>
            ))}
          </div>

          {status === "loading" && (
            <div
              className="mt-3 space-y-2"
              role="status"
              aria-busy="true"
              aria-label={tp.loading}
            >
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          )}
          {status === "failed" && (
            <p className="mt-3 text-sm text-muted-foreground">
              {tp.loadFailed}
            </p>
          )}
          {status === "ready" && points.length === 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              {texts.empty(formatDistance(radiusM, lang))}
            </p>
          )}

          {status === "ready" && points.length > 0 && (
            <ul className="mt-3 space-y-3">
              {pointList.map(({ place, distanceM, routed: byRoad }) => {
                const title = place.name ?? texts.unnamed;
                return (
                  <li
                    key={place.id}
                    className="rounded-lg border border-border/70 bg-background p-3"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="font-medium">{title}</span>
                      <span className="text-xs text-muted-foreground">
                        {byRoad
                          ? t.common.distanceByRoad(
                              formatDistance(distanceM, lang)
                            )
                          : formatDistance(distanceM, lang)}
                      </span>
                    </div>
                    {place.detail && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {place.detail}
                      </p>
                    )}
                    <a
                      href={directionsUrl(
                        place.lat,
                        place.lon,
                        defaultProvider()
                      )}
                      onClick={event => {
                        event.preventDefault();
                        openDirections(place.lat, place.lon);
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={tp.navAria(title)}
                      className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      <Navigation className="h-4 w-4" aria-hidden="true" />
                      {tp.navButton}
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <p className="mt-3 text-xs text-muted-foreground">{tp.source}</p>
    </section>
  );
}
