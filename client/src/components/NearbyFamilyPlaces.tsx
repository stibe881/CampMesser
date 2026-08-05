/**
 * Für Familien in der Nähe (#248): Spielplätze und offizielle Badeplätze
 * rund um einen Platz – aus OpenStreetMap über die Overpass-API, dieselbe
 * Anbindung wie Campingplätze (#113), Wanderwege (#238) und Feuerstellen
 * (#247).
 *
 * Beides steht in EINER Liste, gemischt und allein nach Luftlinie sortiert:
 * wer mit Kindern unterwegs ist, will wissen, was am nächsten liegt, und
 * nicht zwei Listen vergleichen. Unterschieden werden die beiden Kategorien
 * über Symbol und Bezeichnung.
 *
 * Wie «Ausflüge in der Nähe» lädt der Abschnitt ERST BEIM AUFKLAPPEN –
 * Overpass ist ein freier, rate-limitierter Dienst und wird nie automatisch
 * gefragt. Alter, Zaun, Aufsicht und Eintritt stehen nur dort, wo die Tags in
 * OSM gepflegt sind; fehlt einer, behauptet CampMesser nichts.
 *
 * Beim Baden kommen zwei Hinweise dazu, kurz und ohne Zeigefinger: die
 * Wassertemperatur steht schon weiter oben in der Badestellen-Info (#223),
 * und die Verantwortung fürs Reinspringen bleibt bei dir.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Baby, ChevronDown, Navigation, Waves } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  defaultProvider,
  directionsUrl,
  openDirections,
} from "@/lib/directions";
import {
  FAMILY_DEFAULT_RADIUS_M,
  FAMILY_SEARCH_RADII_M,
  fetchOverpass,
  familyPlacesQuery,
  nearestFamilyPlaces,
  parseFamilyPlaces,
  type FamilyPlaceDistance,
  type OsmFamilyPlace,
} from "@/lib/overpass";
import { useI18n } from "@/i18n";
import { formatDistance } from "@shared/geo";
import { applyRouteDistances } from "@shared/routing";
import { useRoutedDistances } from "@/hooks/useRoutedDistances";
import { cn } from "@/lib/utils";

/** So viele Orte zeigt das Dossier – mehr wird zur Liste statt zum Tipp. */
const NEARBY_LIMIT = 6;

type Status = "idle" | "loading" | "ready" | "failed";

export default function NearbyFamilyPlaces({
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
  const tp = t.familyPlaces;
  const [open, setOpen] = useState(false);
  const [radiusM, setRadiusM] = useState(FAMILY_DEFAULT_RADIUS_M);
  const [status, setStatus] = useState<Status>("idle");
  const [places, setPlaces] = useState<FamilyPlaceDistance[]>([]);
  // Wegstrecke zu Fuss statt Luftlinie – mit Kindern zählt der Weg
  const routed = useRoutedDistances(
    places.length > 0 ? { lat: latitude, lon: longitude } : null,
    places.map(({ place }) => ({
      id: place.id,
      lat: place.lat,
      lon: place.lon,
    })),
    "foot"
  );
  const placeList = applyRouteDistances(places, routed.byId);
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
        const res = await fetchOverpass(
          `data=${encodeURIComponent(familyPlacesQuery(latitude, longitude, radius))}`,
          controller.signal
        );
        const json: unknown = await res.json();
        setPlaces(
          nearestFamilyPlaces(
            parseFamilyPlaces(json),
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

  /** Gepflegte Angaben als Chip-Texte – fehlende Tags kommen gar nicht vor. */
  const featuresOf = (place: OsmFamilyPlace): string[] => {
    const features: string[] = [];
    if (place.minAgeYears !== undefined && place.maxAgeYears !== undefined) {
      features.push(tp.ageRange(place.minAgeYears, place.maxAgeYears));
    } else if (place.minAgeYears !== undefined) {
      features.push(tp.minAge(place.minAgeYears));
    } else if (place.maxAgeYears !== undefined) {
      features.push(tp.maxAge(place.maxAgeYears));
    }
    if (place.fenced === true) features.push(tp.fenced);
    if (place.covered === true) features.push(tp.covered);
    if (place.supervised === true) features.push(tp.supervised);
    if (place.fee === true) features.push(tp.feePaid);
    if (place.fee === false) features.push(tp.feeFree);
    return features;
  };

  const hasBathing = places.some(entry => entry.place.kind === "bathing");

  return (
    <section
      className={cn("rounded-xl border border-border bg-card p-4", className)}
      aria-label={tp.sectionAria}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="nearby-family-places"
        className="flex w-full items-center gap-2 text-left"
      >
        <Baby className="h-4 w-4 text-primary" aria-hidden="true" />
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
        <div id="nearby-family-places">
          <div
            className="mt-3 flex flex-wrap items-center gap-2"
            role="group"
            aria-label={tp.radiusGroupAria}
          >
            <span className="text-sm text-muted-foreground">
              {tp.radiusLabel}
            </span>
            {FAMILY_SEARCH_RADII_M.map(value => (
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
                {tp.radiusOption(Math.round(value / 1000))}
              </button>
            ))}
          </div>

          {status === "loading" && (
            <div
              className="mt-3 space-y-2"
              aria-busy="true"
              aria-label={tp.loading}
            >
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          )}
          {status === "failed" && (
            <p className="mt-3 text-sm text-muted-foreground">
              {tp.loadFailed}
            </p>
          )}
          {status === "ready" && places.length === 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              {tp.empty(Math.round(radiusM / 1000))}
            </p>
          )}

          {status === "ready" && places.length > 0 && (
            <>
              <p className="mt-3 text-sm font-medium">
                {tp.resultCount(places.length)}
              </p>
              <ul className="mt-2 space-y-3">
                {placeList.map(({ place, distanceM, routed: onFoot }) => {
                  const kindLabel = tp.kind[place.kind];
                  const title = place.name ?? kindLabel;
                  const features = featuresOf(place);
                  const KindIcon = place.kind === "bathing" ? Waves : Baby;
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
                          {onFoot
                            ? t.common.distanceOnPath(
                                formatDistance(distanceM, lang)
                              )
                            : tp.distanceAway(formatDistance(distanceM, lang))}
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
            </>
          )}

          {/* Nur wenn wirklich ein Badeplatz dabei ist – sonst wäre es Beiwerk */}
          {hasBathing && (
            <p className="mt-3 text-xs text-muted-foreground">
              {tp.bathingNote(t.bathingWater.title)}
            </p>
          )}
        </div>
      )}

      <p className="mt-3 text-xs text-muted-foreground">{tp.source}</p>
    </section>
  );
}
