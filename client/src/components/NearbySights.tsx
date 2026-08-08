/**
 * Sehenswürdigkeiten in der Nähe (#479): Museen, Aussichtspunkte,
 * Schlösser, Zoos und Attraktionen rund um einen Platz – roh aus
 * OpenStreetMap über Overpass, gleiche Bauart wie «Einkaufen in
 * Platznähe» (#273): laden erst beim Aufklappen, nie automatisch.
 *
 * BEWUSST NEBEN DEM AUSFLUGFINDER (#271): Dort stehen kuratierte
 * Ausflüge mit Beschreibung, hier die ungefilterte Kartensicht – ohne
 * Redaktion, dafür überall. Beides hat seinen Platz; die Quellzeile
 * unten sagt ehrlich, woher die Liste stammt.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Castle,
  ChevronDown,
  Eye,
  FerrisWheel,
  Landmark,
  Navigation,
  PawPrint,
  Sparkles,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  defaultProvider,
  directionsUrl,
  openDirections,
} from "@/lib/directions";
import {
  fetchOverpass,
  nearestSights,
  parseSights,
  SIGHT_DEFAULT_RADIUS_M,
  SIGHT_SEARCH_RADII_M,
  sightsQuery,
  type OsmSight,
  type SightKind,
} from "@/lib/overpass";
import { useI18n } from "@/i18n";
import { formatDistance } from "@shared/geo";
import { applyRouteDistances } from "@shared/routing";
import { useRoutedDistances } from "@/hooks/useRoutedDistances";
import { cn } from "@/lib/utils";

/** Mehr wird zur Liste statt zum Tipp – wie bei den Läden (#273). */
const NEARBY_LIMIT = 10;

type Status = "idle" | "loading" | "ready" | "failed";

interface SightRow {
  place: OsmSight;
  distanceM: number;
}

const kindIcons: Record<SightKind, typeof Landmark> = {
  museum: Landmark,
  viewpoint: Eye,
  castle: Castle,
  zoo: PawPrint,
  themePark: FerrisWheel,
  monument: Landmark,
  attraction: Sparkles,
};

export default function NearbySights({
  latitude,
  longitude,
  placeName,
  className,
}: {
  latitude: number;
  longitude: number;
  placeName?: string | null;
  className?: string;
}) {
  const { lang, t } = useI18n();
  const ts = t.sights;
  const [open, setOpen] = useState(false);
  const [radiusM, setRadiusM] = useState(SIGHT_DEFAULT_RADIUS_M);
  const [status, setStatus] = useState<Status>("idle");
  const [sights, setSights] = useState<SightRow[]>([]);
  const routed = useRoutedDistances(
    sights.length > 0 ? { lat: latitude, lon: longitude } : null,
    sights.map(({ place }) => ({
      id: place.id,
      lat: place.lat,
      lon: place.lon,
    })),
    "car"
  );
  const sightList = applyRouteDistances(sights, routed.byId);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  /** Suchen – nur auf Klick, nie automatisch (Overpass ist rate-limitiert). */
  const search = useCallback(
    async (radius: number) => {
      setStatus("loading");
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetchOverpass(
          `data=${encodeURIComponent(sightsQuery(latitude, longitude, radius))}`,
          controller.signal
        );
        const json: unknown = await res.json();
        setSights(
          nearestSights(parseSights(json), latitude, longitude, NEARBY_LIMIT)
        );
        setStatus("ready");
      } catch {
        if (controller.signal.aborted) return;
        setStatus("failed");
      }
    },
    [latitude, longitude]
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
      aria-label={ts.sectionAria}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="nearby-sights"
        className="flex w-full items-center gap-2 text-left"
      >
        <Landmark className="h-4 w-4 text-primary" aria-hidden="true" />
        <span className="font-serif text-lg font-semibold">{ts.title}</span>
        <ChevronDown
          className={cn(
            "ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
      <p className="mt-1 text-sm text-muted-foreground">
        {placeName ? ts.subtitleAtPlace(placeName) : ts.subtitle}
      </p>

      {open && (
        <div id="nearby-sights">
          <div
            className="mt-3 flex flex-wrap items-center gap-2"
            role="group"
            aria-label={ts.radiusGroupAria}
          >
            <span className="text-sm text-muted-foreground">
              {ts.radiusLabel}
            </span>
            {SIGHT_SEARCH_RADII_M.map(value => (
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
                {ts.radiusOption(Math.round(value / 1000))}
              </button>
            ))}
          </div>

          {status === "loading" && (
            <div
              className="mt-3 space-y-2"
              aria-busy="true"
              aria-label={ts.loading}
            >
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          )}
          {status === "failed" && (
            <p className="mt-3 text-sm text-muted-foreground">
              {ts.loadFailed}
            </p>
          )}
          {status === "ready" && sights.length === 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              {ts.empty(Math.round(radiusM / 1000))}
            </p>
          )}

          {status === "ready" && sights.length > 0 && (
            <>
              <p className="mt-3 text-sm font-medium">
                {ts.resultCount(sights.length)}
              </p>
              <ul className="mt-2 space-y-3">
                {sightList.map(({ place, distanceM, routed: byRoad }) => {
                  const kindLabel = ts.kind[place.kind];
                  const title = place.name ?? kindLabel;
                  const KindIcon = kindIcons[place.kind];
                  return (
                    <li
                      key={place.id}
                      className="rounded-lg border border-border/70 bg-background p-3"
                    >
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <KindIcon
                          className="h-4 w-4 shrink-0 self-center text-primary"
                          aria-hidden="true"
                        />
                        <span className="font-medium">{title}</span>
                        <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                          {kindLabel}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {byRoad
                            ? t.common.distanceByRoad(
                                formatDistance(distanceM, lang)
                              )
                            : formatDistance(distanceM, lang)}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-3">
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
                          aria-label={ts.navAria(title)}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                        >
                          <Navigation className="h-4 w-4" aria-hidden="true" />
                          {ts.navButton}
                        </a>
                        {place.website && (
                          <a
                            href={place.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            {ts.website}
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}

      <p className="mt-3 text-xs text-muted-foreground">{ts.source}</p>
    </section>
  );
}
