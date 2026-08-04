/**
 * Rast unterwegs (#250): Picknickplätze und Picknicktische im Korridor
 * entlang der Anfahrt zum Zeltplatz – aus OpenStreetMap über Overpass,
 * dieselbe Anbindung wie Feuerstellen (#247) und Wanderwege (#238).
 *
 * Zwei Dinge bestimmen den Aufbau:
 *
 * 1. Der Abschnitt LÄDT ERST BEIM AUFKLAPPEN und erst auf einen Klick –
 *    Overpass ist ein freier, rate-limitierter Dienst, und ein Korridor
 *    quer durchs Land ist eine grosse Abfrage.
 * 2. Sortiert wird nach der REIHENFOLGE DER FAHRT, nicht nach der Distanz
 *    zum Ziel: Wer unterwegs rasten will, will wissen, was zuerst kommt.
 *
 * EHRLICH BLEIBT: Die Strecke ist die Luftlinie, nicht die Strasse – der
 * Hinweis steht sichtbar im Abschnitt, statt Genauigkeit vorzutäuschen.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  House,
  LocateFixed,
  Navigation,
  Trees,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { directionsUrl } from "@/lib/directions";
import {
  OVERPASS_URL,
  parsePicnicSites,
  picnicSitesQuery,
  type OsmPicnicSite,
} from "@/lib/overpass";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { distanceMeters, formatDistance } from "@shared/geo";
import {
  CORRIDOR_DEFAULT_RADIUS_M,
  CORRIDOR_RADII_M,
  corridorPoints,
  stopsAlongRoute,
  type RouteStop,
} from "@shared/corridor";
import { cn } from "@/lib/utils";

/** So viele Raststellen zeigt das Dossier – mehr wird unübersichtlich. */
const STOPS_LIMIT = 12;

type Status = "idle" | "locating" | "loading" | "ready" | "failed" | "noStart";

/** Woher die Fahrt startet. */
type StartMode = "home" | "current";

export default function PicnicStops({
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
  const tp = t.picnicStops;
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [startMode, setStartMode] = useState<StartMode>("home");
  const [radiusM, setRadiusM] = useState(CORRIDOR_DEFAULT_RADIUS_M);
  const [status, setStatus] = useState<Status>("idle");
  const [stops, setStops] = useState<RouteStop<OsmPicnicSite>[]>([]);
  const [totalM, setTotalM] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const homeQuery = trpc.home.get.useQuery(undefined, {
    enabled: isAuthenticated && open,
  });
  const home = homeQuery.data ?? null;

  // Beim Verlassen die laufende Overpass-Anfrage abbrechen
  useEffect(() => () => abortRef.current?.abort(), []);

  /** Aktuellen Standort holen – nur, wenn der Start darauf steht. */
  const currentPosition = useCallback(
    () =>
      new Promise<{ lat: number; lon: number } | null>(resolve => {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
          resolve(null);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          pos =>
            resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
        );
      }),
    []
  );

  /** Korridor abfragen – nur auf Klick, nie automatisch (Rate-Limit). */
  const search = useCallback(
    async (mode: StartMode, radius: number) => {
      let start: { lat: number; lon: number } | null = null;
      if (mode === "home") {
        start = home ? { lat: home.latitude, lon: home.longitude } : null;
      } else {
        setStatus("locating");
        start = await currentPosition();
      }
      if (!start) {
        setStops([]);
        setStatus("noStart");
        return;
      }

      const end = { lat: latitude, lon: longitude };
      const points = corridorPoints(start, end);
      if (points.length === 0) {
        setStops([]);
        setStatus("noStart");
        return;
      }

      setStatus("loading");
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(OVERPASS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `data=${encodeURIComponent(picnicSitesQuery(points, radius))}`,
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`overpass ${res.status}`);
        const json: unknown = await res.json();
        const found = stopsAlongRoute(
          parsePicnicSites(json),
          start,
          end,
          STOPS_LIMIT
        );
        setStops(found);
        setTotalM(distanceMeters(start.lat, start.lon, end.lat, end.lon));
        setStatus("ready");
      } catch {
        if (controller.signal.aborted) return;
        setStatus("failed");
      }
    },
    [currentPosition, home, latitude, longitude]
  );

  /** Aufklappen zeigt nur die Auswahl – gesucht wird erst auf Knopfdruck. */
  const toggle = () => setOpen(value => !value);

  const km = (meters: number) => Math.round(meters / 1000);

  return (
    <section
      className={cn("rounded-xl border border-border bg-card p-4", className)}
      aria-label={tp.sectionAria}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="picnic-stops"
        className="flex w-full items-center gap-2 text-left"
      >
        <Trees className="h-4 w-4 text-primary" aria-hidden="true" />
        <span className="font-serif text-lg font-semibold">{tp.title}</span>
        <ChevronDown
          className={cn(
            "ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
      <p className="mt-1 text-sm text-muted-foreground">
        {placeName ? tp.subtitleAtPlace(placeName) : tp.subtitle}
      </p>

      {open && (
        <div id="picnic-stops">
          <div
            className="mt-3 flex flex-wrap items-center gap-2"
            role="group"
            aria-label={tp.startGroupAria}
          >
            <span className="text-sm text-muted-foreground">
              {tp.startLabel}
            </span>
            <button
              type="button"
              onClick={() => setStartMode("home")}
              aria-pressed={startMode === "home"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
                startMode === "home"
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              <House className="h-3.5 w-3.5" aria-hidden="true" />
              {home ? home.name : tp.startHome}
            </button>
            <button
              type="button"
              onClick={() => setStartMode("current")}
              aria-pressed={startMode === "current"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
                startMode === "current"
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              <LocateFixed className="h-3.5 w-3.5" aria-hidden="true" />
              {tp.startCurrent}
            </button>
          </div>

          <div
            className="mt-2 flex flex-wrap items-center gap-2"
            role="group"
            aria-label={tp.radiusGroupAria}
          >
            <span className="text-sm text-muted-foreground">
              {tp.radiusLabel}
            </span>
            {CORRIDOR_RADII_M.map(value => (
              <button
                key={value}
                type="button"
                onClick={() => setRadiusM(value)}
                aria-pressed={radiusM === value}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm transition-colors",
                  radiusM === value
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                {tp.radiusOption(km(value))}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void search(startMode, radiusM)}
            disabled={status === "loading" || status === "locating"}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <Trees className="h-4 w-4" aria-hidden="true" />
            {tp.searchButton}
          </button>

          <p className="mt-2 text-xs text-muted-foreground">{tp.lineHint}</p>

          {(status === "loading" || status === "locating") && (
            <div
              className="mt-3 space-y-2"
              aria-busy="true"
              aria-label={status === "locating" ? tp.locating : tp.loading}
            >
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          )}
          {status === "noStart" && (
            <p className="mt-3 text-sm text-muted-foreground">
              {startMode === "home" ? tp.noHome : tp.noPosition}
            </p>
          )}
          {status === "failed" && (
            <p className="mt-3 text-sm text-muted-foreground">
              {tp.loadFailed}
            </p>
          )}
          {status === "ready" && stops.length === 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              {tp.empty(km(radiusM))}
            </p>
          )}

          {status === "ready" && stops.length > 0 && (
            <>
              <p className="mt-3 text-sm font-medium">
                {tp.resultCount(stops.length, km(totalM))}
              </p>
              <ul className="mt-2 space-y-3">
                {stops.map(({ place, alongM, offsetM }) => {
                  const kindLabel = tp.kind[place.kind];
                  const title = place.name ?? kindLabel;
                  const features = [
                    place.covered === true ? tp.covered : null,
                    place.fireplace === true ? tp.fireplace : null,
                    place.drinkingWater === true ? tp.drinkingWater : null,
                  ].filter((value): value is string => value !== null);
                  return (
                    <li
                      key={place.id}
                      className="rounded-lg border border-border/70 bg-background p-3"
                    >
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="font-mono text-xs font-semibold text-primary">
                          {tp.kmMark(km(alongM), km(totalM))}
                        </span>
                        <span className="font-medium">{title}</span>
                        <span
                          className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground"
                          title={tp.kindHint[place.kind]}
                        >
                          {kindLabel}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {tp.offsetHint(formatDistance(offsetM, lang))}
                        </span>
                      </div>

                      {features.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {features.map(feature => (
                            <span
                              key={feature}
                              className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      )}

                      <a
                        href={directionsUrl(place.lat, place.lon)}
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
              <p className="mt-3 text-xs text-muted-foreground">{tp.source}</p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
