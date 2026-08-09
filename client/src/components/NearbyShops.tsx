/**
 * Einkaufen in Platznähe (#273): Supermarkt, Bäckerei, Hofladen und
 * Metzgerei rund um einen Platz.
 *
 * ZWEI QUELLEN, IN DIESER REIHENFOLGE (Nutzerwunsch 04.08.2026):
 *
 * 1. GOOGLE, wenn der Schlüssel in der Server-`.env` steht. Der Grund
 *    sind die ÖFFNUNGSZEITEN: In OSM sind sie bei den meisten Läden
 *    schlicht nicht erfasst – auf einem Bildschirm mit fünf Treffern
 *    stand viermal «Öffnungszeiten nicht erfasst». Und «hat der Coop
 *    jetzt noch offen» ist genau die Frage, für die man diese Liste
 *    aufmacht.
 * 2. OPENSTREETMAP über Overpass, wenn Google nicht eingerichtet ist
 *    oder nicht antwortet. Kein blosser Notnagel: Hofläden sind in OSM
 *    oft erfasst, und bei Google gibt es für sie gar keinen Typ.
 *
 * Wie bei Feuerstellen (#247) und Spielplätzen (#248) wird ERST BEIM
 * AUFKLAPPEN geladen – Overpass ist ein freier, rate-limitierter Dienst,
 * und eine Google-Abfrage kostet Geld.
 *
 * ÖFFNUNGSZEITEN AUS OSM sind der heikle Teil. OSM speichert sie in einer
 * eigenen kleinen Sprache; `shared/openingHours.ts` versteht davon nur
 * den einfachen Teil. Wo die Deutung nicht sicher ist, steht «Zeiten
 * prüfen» und die Rohangabe daneben – lieber ein Blick mehr als jemand,
 * der zehn Kilometer weit vor eine geschlossene Tür fährt. Von Google
 * kommt «offen/geschlossen» dagegen als fertige Auskunft; dann steht
 * keine Vermutung da, sondern die Antwort.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Croissant,
  Navigation,
  ShoppingCart,
  Sprout,
  Store,
  PawPrint,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  defaultProvider,
  directionsUrl,
  openDirections,
} from "@/lib/directions";
import {
  fetchOverpass,
  SHOP_DEFAULT_RADIUS_M,
  SHOP_SEARCH_RADII_M,
  nearestShops,
  parseShops,
  shopsQuery,
  type OsmShop,
  type ShopKind,
} from "@/lib/overpass";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { distanceMeters, formatDistance } from "@shared/geo";
import { GOOGLE_ATTRIBUTION, googleShopKind } from "@shared/googlePlaces";
import { applyRouteDistances } from "@shared/routing";
import { useRoutedDistances } from "@/hooks/useRoutedDistances";
import { hoursForDay, isOpenAt } from "@shared/openingHours";
import { cn } from "@/lib/utils";

/** So viele Läden zeigt das Dossier – mehr wird zur Liste statt zum Tipp. */
const NEARBY_LIMIT = 8;

type Status = "idle" | "loading" | "ready" | "failed";

/**
 * Ein Laden, wie ihn die Liste führt. `openNow`/`todayLine` sind die
 * fertige Auskunft von Google; bei OSM bleiben sie leer, und dann greift
 * die Deutung aus `shared/openingHours.ts`.
 */
type ShopEntry = OsmShop & {
  openNow?: boolean | null;
  todayLine?: string;
};

interface ShopRow {
  place: ShopEntry;
  distanceM: number;
}

const kindIcons: Record<ShopKind, typeof Store> = {
  supermarket: ShoppingCart,
  convenience: Store,
  bakery: Croissant,
  farm: Sprout,
  butcher: Store,
  vet: PawPrint,
};

export default function NearbyShops({
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
  const tp = t.shops;
  const [open, setOpen] = useState(false);
  const [radiusM, setRadiusM] = useState(SHOP_DEFAULT_RADIUS_M);
  const [status, setStatus] = useState<Status>("idle");
  const [shops, setShops] = useState<ShopRow[]>([]);
  /** Woher die aktuelle Liste stammt – die Quellenangabe hängt daran. */
  const [source, setSource] = useState<"osm" | "google">("osm");
  const utils = trpc.useUtils();
  // Wegstrecke statt Luftlinie (eine Tabellen-Abfrage für die ganze Liste):
  // Der Laden am anderen Flussufer ist 500 m entfernt und 6 km weit weg
  const routed = useRoutedDistances(
    shops.length > 0 ? { lat: latitude, lon: longitude } : null,
    shops.map(({ place }) => ({
      id: place.id,
      lat: place.lat,
      lon: place.lon,
    })),
    "car"
  );
  const shopList = applyRouteDistances(shops, routed.byId);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  /**
   * Suchen – nur auf Klick, nie automatisch.
   *
   * Erst Google (falls eingerichtet), sonst Overpass. Antwortet Google
   * nicht oder kennt es hier nichts, fällt die Suche auf OSM zurück
   * statt eine leere Liste zu zeigen: «Google kennt hier keinen Laden»
   * heisst nicht, dass keiner da ist.
   */
  const search = useCallback(
    async (radius: number) => {
      setStatus("loading");
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // Heute ist Montag = 0 in Googles Wochenliste, sonntags = 6
      const weekday = (new Date().getDay() + 6) % 7;

      try {
        const google = await utils.places.nearby.fetch({
          latitude,
          longitude,
          radiusM: radius,
          kind: "shops",
          language: lang,
        });
        if (controller.signal.aborted) return;
        if (google.configured && google.places.length > 0) {
          const rows: ShopRow[] = [];
          google.places.forEach(place => {
            const kind = googleShopKind(place.types);
            if (!kind) return;
            rows.push({
              place: {
                id: place.id,
                lat: place.lat,
                lon: place.lon,
                kind,
                name: place.name || undefined,
                website: place.website ?? undefined,
                phone: place.phone ?? undefined,
                openNow: place.openNow,
                todayLine: place.hours[weekday],
              },
              distanceM: distanceMeters(
                latitude,
                longitude,
                place.lat,
                place.lon
              ),
            });
          });
          if (rows.length > 0) {
            rows.sort((a, b) => a.distanceM - b.distanceM);
            setShops(rows.slice(0, NEARBY_LIMIT));
            setSource("google");
            setStatus("ready");
            return;
          }
        }
      } catch {
        // Kein Google: Der Weg über OSM steht gleich darunter
      }
      if (controller.signal.aborted) return;

      try {
        const res = await fetchOverpass(
          `data=${encodeURIComponent(shopsQuery(latitude, longitude, radius))}`,
          controller.signal
        );
        const json: unknown = await res.json();
        setShops(
          nearestShops(parseShops(json), latitude, longitude, NEARBY_LIMIT)
        );
        setSource("osm");
        setStatus("ready");
      } catch {
        if (controller.signal.aborted) return;
        setStatus("failed");
      }
    },
    [latitude, longitude, lang, utils]
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

  const now = new Date();

  return (
    <section
      className={cn("rounded-xl border border-border bg-card p-4", className)}
      aria-label={tp.sectionAria}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="nearby-shops"
        className="flex w-full items-center gap-2 text-left"
      >
        <ShoppingCart className="h-4 w-4 text-primary" aria-hidden="true" />
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
        <div id="nearby-shops">
          <div
            className="mt-3 flex flex-wrap items-center gap-2"
            role="group"
            aria-label={tp.radiusGroupAria}
          >
            <span className="text-sm text-muted-foreground">
              {tp.radiusLabel}
            </span>
            {SHOP_SEARCH_RADII_M.map(value => (
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
              role="status"
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
          {status === "ready" && shops.length === 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              {tp.empty(Math.round(radiusM / 1000))}
            </p>
          )}

          {status === "ready" && shops.length > 0 && (
            <>
              <p className="mt-3 text-sm font-medium">
                {tp.resultCount(shops.length)}
              </p>
              <ul className="mt-2 space-y-3">
                {shopList.map(({ place, distanceM, routed: byRoad }) => {
                  const kindLabel = tp.kind[place.kind];
                  const title = place.name ?? kindLabel;
                  const KindIcon = kindIcons[place.kind];
                  // Von Google kommt «offen/geschlossen» als Auskunft, aus
                  // OSM nur als Vermutung aus der Rohangabe
                  const openNow =
                    place.openNow !== undefined
                      ? place.openNow
                      : isOpenAt(place.openingHours, now);
                  const today =
                    place.todayLine ?? hoursForDay(place.openingHours, now);
                  const hasHours =
                    place.todayLine != null || place.openingHours != null;
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
                            : tp.distanceAway(formatDistance(distanceM, lang))}
                        </span>
                      </div>

                      {/* Offen/geschlossen nur, wenn die Angabe eindeutig ist */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                        {openNow === true && (
                          <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 font-medium text-primary">
                            {tp.openNow}
                          </span>
                        )}
                        {openNow === false && (
                          <span className="rounded-full border border-border bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                            {tp.closedNow}
                          </span>
                        )}
                        {openNow === null && hasHours && (
                          <span className="rounded-full border border-amber-600/40 bg-amber-500/10 px-2 py-0.5 font-medium text-amber-800 dark:text-amber-300">
                            {tp.checkHours}
                          </span>
                        )}
                        {today ? (
                          <span className="text-muted-foreground">
                            {tp.todayHours(today)}
                          </span>
                        ) : (
                          place.openingHours && (
                            <span className="text-muted-foreground">
                              {place.openingHours}
                            </span>
                          )
                        )}
                        {!hasHours && (
                          <span className="text-muted-foreground">
                            {tp.noHours}
                          </span>
                        )}
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
                          aria-label={tp.navAria(title)}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                        >
                          <Navigation className="h-4 w-4" aria-hidden="true" />
                          {tp.navButton}
                        </a>
                        {place.website && (
                          <a
                            href={place.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            {tp.website}
                          </a>
                        )}
                        {place.phone && (
                          <a
                            href={`tel:${place.phone.replace(/\s/g, "")}`}
                            className="text-sm text-primary hover:underline"
                          >
                            {place.phone}
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {/* Der Hinweis erklärt die Deutung der OSM-Rohangabe. Bei
              Google-Treffern gibt es nichts zu deuten – dort wäre er nur
              eine Warnung vor einem Problem, das gerade nicht besteht. */}
          {source === "osm" && (
            <p className="mt-3 text-xs text-muted-foreground">{tp.hoursNote}</p>
          )}
        </div>
      )}

      {/* Quellenangabe: bei Google-Treffern verlangen es die Bedingungen */}
      <p className="mt-3 text-xs text-muted-foreground">
        {source === "google" ? GOOGLE_ATTRIBUTION : tp.source}
      </p>
    </section>
  );
}
