/**
 * Feuerstellen in der Nähe (#247): offizielle Feuer- und Grillstellen rund um
 * einen Platz – aus OpenStreetMap über die Overpass-API, dieselbe Anbindung
 * wie der Entdecker-Layer der Karte (#113) und die Wanderwege (#238).
 *
 * Zwei Dinge bestimmen den Aufbau:
 *
 * 1. Der Abschnitt LÄDT ERST BEIM AUFKLAPPEN – wie «Ausflüge in der Nähe».
 *    Das Dossier holt schon Wetter, Wasserwerte und Höhe; Overpass ist ein
 *    freier, rate-limitierter Dienst und wird deshalb nie automatisch
 *    gefragt, sondern nur auf einen ausdrücklichen Klick.
 * 2. Ehrlichkeit vor Vollständigkeit: gedeckt, Brennholz und Trinkwasser
 *    stehen nur dort, wo die Tags in OSM gepflegt sind. Fehlt ein Tag,
 *    behauptet CampMesser nichts – dann steht schlicht nichts da.
 *
 * Ob am gewählten Tag überhaupt gefeuert werden darf, sagt nicht OSM, sondern
 * die Waldbrandgefahr-Anzeige im Wetter-Modul. Statt den Text zu doppeln,
 * verlinkt der Abschnitt sie dezent.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ChevronDown, Flame, Navigation } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { directionsUrl } from "@/lib/directions";
import {
  FIREPIT_DEFAULT_RADIUS_M,
  FIREPIT_SEARCH_RADII_M,
  OVERPASS_URL,
  firepitsQuery,
  nearestFirepits,
  parseFirepits,
  type FirepitDistance,
} from "@/lib/overpass";
import { useI18n } from "@/i18n";
import { formatDistance } from "@shared/geo";
import { applyRouteDistances } from "@shared/routing";
import { useRoutedDistances } from "@/hooks/useRoutedDistances";
import { cn } from "@/lib/utils";

/** So viele Stellen zeigt das Dossier – mehr wird zur Liste statt zum Tipp. */
const NEARBY_LIMIT = 6;

type Status = "idle" | "loading" | "ready" | "failed";

export default function NearbyFirepits({
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
  const tf = t.firepits;
  const [open, setOpen] = useState(false);
  const [radiusM, setRadiusM] = useState(FIREPIT_DEFAULT_RADIUS_M);
  const [status, setStatus] = useState<Status>("idle");
  const [places, setPlaces] = useState<FirepitDistance[]>([]);
  // Wegstrecke zu Fuss statt Luftlinie – eine Abfrage für die ganze Liste
  const routed = useRoutedDistances(
    places.length > 0 ? { lat: latitude, lon: longitude } : null,
    places.map(({ firepit }) => ({
      id: firepit.id,
      lat: firepit.lat,
      lon: firepit.lon,
    })),
    "foot"
  );
  const placeList = applyRouteDistances(
    places.map(({ firepit, distanceM }) => ({ place: firepit, distanceM })),
    routed.byId
  );
  const abortRef = useRef<AbortController | null>(null);

  // Beim Verlassen die laufende Overpass-Anfrage abbrechen
  useEffect(() => () => abortRef.current?.abort(), []);

  /** Overpass fragen – nur auf Klick, nie automatisch (Rate-Limit). */
  const search = useCallback(
    async (radius: number) => {
      setStatus("loading");
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(OVERPASS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `data=${encodeURIComponent(
            firepitsQuery(latitude, longitude, radius)
          )}`,
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`overpass ${res.status}`);
        const json: unknown = await res.json();
        setPlaces(
          nearestFirepits(
            parseFirepits(json),
            latitude,
            longitude,
            NEARBY_LIMIT
          )
        );
        setStatus("ready");
      } catch {
        if (controller.signal.aborted) return;
        setStatus("failed");
      }
    },
    [latitude, longitude]
  );

  /** Aufklappen holt die Daten einmalig nach – zugeklappt passiert nichts. */
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
      aria-label={tf.sectionAria}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="nearby-firepits"
        className="flex w-full items-center gap-2 text-left"
      >
        <Flame className="h-4 w-4 text-primary" aria-hidden="true" />
        <span className="font-serif text-lg font-semibold">{tf.title}</span>
        <ChevronDown
          className={cn(
            "ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
      <p className="mt-1 text-sm text-muted-foreground">
        {placeName ? tf.subtitleAtPlace(placeName) : tf.subtitle}
      </p>

      {open && (
        <div id="nearby-firepits">
          <div
            className="mt-3 flex flex-wrap items-center gap-2"
            role="group"
            aria-label={tf.radiusGroupAria}
          >
            <span className="text-sm text-muted-foreground">
              {tf.radiusLabel}
            </span>
            {FIREPIT_SEARCH_RADII_M.map(value => (
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
                {tf.radiusOption(Math.round(value / 1000))}
              </button>
            ))}
          </div>

          {status === "loading" && (
            <div
              className="mt-3 space-y-2"
              aria-busy="true"
              aria-label={tf.loading}
            >
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          )}
          {status === "failed" && (
            <p className="mt-3 text-sm text-muted-foreground">
              {tf.loadFailed}
            </p>
          )}
          {status === "ready" && places.length === 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              {tf.empty(Math.round(radiusM / 1000))}
            </p>
          )}

          {status === "ready" && places.length > 0 && (
            <>
              <p className="mt-3 text-sm font-medium">
                {tf.resultCount(places.length)}
              </p>
              <ul className="mt-2 space-y-3">
                {placeList.map(
                  ({ place: firepit, distanceM, routed: onFoot }) => {
                    const kindLabel = tf.kind[firepit.kind];
                    const title = firepit.name ?? kindLabel;
                    const features = [
                      firepit.covered === true ? tf.covered : null,
                      firepit.firewood === true ? tf.firewood : null,
                      firepit.drinkingWater === true ? tf.drinkingWater : null,
                    ].filter((value): value is string => value !== null);
                    return (
                      <li
                        key={firepit.id}
                        className="rounded-lg border border-border/70 bg-background p-3"
                      >
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <span className="font-medium">{title}</span>
                          <span
                            className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground"
                            title={tf.kindHint[firepit.kind]}
                          >
                            {kindLabel}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {onFoot
                              ? t.common.distanceOnPath(
                                  formatDistance(distanceM, lang)
                                )
                              : tf.distanceAway(
                                  formatDistance(distanceM, lang)
                                )}
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
                          href={directionsUrl(firepit.lat, firepit.lon)}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={tf.navAria(title)}
                          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                        >
                          <Navigation className="h-4 w-4" aria-hidden="true" />
                          {tf.navButton}
                        </a>
                      </li>
                    );
                  }
                )}
              </ul>
            </>
          )}
        </div>
      )}

      {/* Ob gefeuert werden darf, sagt die Waldbrandgefahr-Anzeige im Wetter */}
      <Link
        href="/wetter"
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <Flame className="h-4 w-4" aria-hidden="true" />
        {tf.fireDangerLink}
      </Link>
      <p className="mt-2 text-xs text-muted-foreground">{tf.source}</p>
    </section>
  );
}
