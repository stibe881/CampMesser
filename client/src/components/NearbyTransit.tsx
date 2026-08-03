/**
 * ÖV ab Platz (#249): die nächstgelegenen Haltestellen rund um einen Platz und
 * ihre nächsten Abfahrten – aus der offenen Schweizer Fahrplan-API
 * `transport.opendata.ch` (schlüssellos, CORS erlaubt).
 *
 * Aufbau wie bei den Feuerstellen (#247) und den Spiel-/Badeplätzen (#248):
 *
 * 1. Der Abschnitt LÄDT ERST BEIM AUFKLAPPEN. Das Dossier holt schon Wetter,
 *    Wasserwerte und Höhe; ein freier Fremddienst wird nie automatisch
 *    gefragt, sondern nur auf einen ausdrücklichen Klick.
 * 2. ZWEI Stufen statt einer: erst die Haltestellen mit Distanz, und erst auf
 *    Antippen die Abfahrtstafel der einen Haltestelle. Für sechs Haltestellen
 *    gleichzeitig sechs Tafeln zu holen, wäre unhöflich gegenüber einem
 *    Dienst, den jemand anders gratis betreibt – und niemand liest sechs
 *    Tafeln auf einmal.
 * 3. Abfahrtszeiten veralten im Minutentakt. Deshalb steht bei der Tafel ein
 *    «Aktualisieren», und beim Wiederöffnen einer schon geladenen Tafel wird
 *    ohnehin neu geholt.
 *
 * Ehrlich bleibt: Die API bedient den Schweizer Fahrplan samt Grenzverkehr.
 * Für einen Platz weit im Ausland kommt nichts zurück – dann sagt der
 * Abschnitt genau das, statt eine Panne vorzutäuschen.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bus,
  CableCar,
  ChevronDown,
  Clock,
  MapPin,
  RefreshCw,
  Ship,
  Train,
  TramFront,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n";
import { LOCALE_TAGS } from "@shared/i18n";
import { formatDistance } from "@shared/geo";
import {
  nearbyStationsUrl,
  nearestTransitStations,
  parseStationboard,
  parseTransitStations,
  stationboardUrl,
  TRANSPORT_DEPARTURE_LIMIT,
  TRANSPORT_STATION_LIMIT,
  upcomingDepartures,
  type TransitDeparture,
  type TransitStation,
  type TransitStationKind,
} from "@shared/transport";
import { cn } from "@/lib/utils";

type Status = "idle" | "loading" | "ready" | "failed";

/**
 * Symbol je Verkehrsmittel. `other` bekommt bewusst den neutralen Ortspunkt
 * und nicht den Bus: die API kennt mehr Arten als wir (Standseilbahn, Metro),
 * und ein falsches Symbol wäre eine Behauptung.
 */
const KIND_ICONS: Record<TransitStationKind, typeof Bus> = {
  train: Train,
  tram: TramFront,
  bus: Bus,
  ship: Ship,
  cableway: CableCar,
  other: MapPin,
};

export default function NearbyTransit({
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
  const tt = t.transit;
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [stations, setStations] = useState<TransitStation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [boardStatus, setBoardStatus] = useState<Status>("idle");
  const [departures, setDepartures] = useState<TransitDeparture[]>([]);
  const stationsAbort = useRef<AbortController | null>(null);
  const boardAbort = useRef<AbortController | null>(null);

  // Beim Verlassen alles Laufende abbrechen
  useEffect(
    () => () => {
      stationsAbort.current?.abort();
      boardAbort.current?.abort();
    },
    []
  );

  /** Haltestellen um den Platz suchen – nur auf Klick, nie automatisch. */
  const loadStations = useCallback(async () => {
    setStatus("loading");
    setActiveId(null);
    setDepartures([]);
    setBoardStatus("idle");
    stationsAbort.current?.abort();
    const controller = new AbortController();
    stationsAbort.current = controller;
    try {
      const res = await fetch(nearbyStationsUrl(latitude, longitude), {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`transport ${res.status}`);
      const json: unknown = await res.json();
      setStations(
        nearestTransitStations(
          parseTransitStations(json),
          TRANSPORT_STATION_LIMIT
        )
      );
      setStatus("ready");
    } catch {
      if (controller.signal.aborted) return;
      setStatus("failed");
    }
  }, [latitude, longitude]);

  /** Abfahrtstafel einer Haltestelle holen; nur kommende Abfahrten zeigen. */
  const loadBoard = useCallback(async (stationId: string) => {
    setBoardStatus("loading");
    boardAbort.current?.abort();
    const controller = new AbortController();
    boardAbort.current = controller;
    try {
      const res = await fetch(
        stationboardUrl(stationId, TRANSPORT_DEPARTURE_LIMIT * 2),
        { signal: controller.signal }
      );
      if (!res.ok) throw new Error(`transport ${res.status}`);
      const json: unknown = await res.json();
      setDepartures(
        upcomingDepartures(
          parseStationboard(json),
          Date.now(),
          TRANSPORT_DEPARTURE_LIMIT
        )
      );
      setBoardStatus("ready");
    } catch {
      if (controller.signal.aborted) return;
      setBoardStatus("failed");
    }
  }, []);

  /** Aufklappen holt die Haltestellen einmalig nach. */
  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && status === "idle") void loadStations();
  };

  /** Antippen öffnet die Tafel – nochmals antippen klappt sie wieder zu. */
  const chooseStation = (stationId: string) => {
    if (activeId === stationId) {
      setActiveId(null);
      return;
    }
    setActiveId(stationId);
    void loadBoard(stationId);
  };

  const formatTime = (ms: number) =>
    new Date(ms).toLocaleTimeString(LOCALE_TAGS[lang], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <section
      className={cn("rounded-xl border border-border bg-card p-4", className)}
      aria-label={tt.sectionAria}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="nearby-transit"
        className="flex w-full items-center gap-2 text-left"
      >
        <Bus className="h-4 w-4 text-primary" aria-hidden="true" />
        <span className="font-serif text-lg font-semibold">{tt.title}</span>
        <ChevronDown
          className={cn(
            "ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
      <p className="mt-1 text-sm text-muted-foreground">
        {placeName ? tt.subtitleAtPlace(placeName) : tt.subtitle}
      </p>

      {open && (
        <div id="nearby-transit">
          {status === "loading" && (
            <div
              className="mt-3 space-y-2"
              aria-busy="true"
              aria-label={tt.loadingStations}
            >
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          )}
          {status === "failed" && (
            <p className="mt-3 text-sm text-muted-foreground">
              {tt.loadFailed}
            </p>
          )}
          {status === "ready" && stations.length === 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              {tt.emptyStations}
            </p>
          )}

          {status === "ready" && stations.length > 0 && (
            <ul className="mt-3 space-y-2">
              {stations.map(stop => {
                const Icon = KIND_ICONS[stop.kind];
                const active = activeId === stop.id;
                return (
                  <li
                    key={stop.id}
                    className="rounded-lg border border-border/70 bg-background"
                  >
                    <button
                      type="button"
                      onClick={() => chooseStation(stop.id)}
                      aria-expanded={active}
                      aria-label={tt.stationAria(stop.name)}
                      className="flex w-full items-center gap-2 p-3 text-left"
                    >
                      <Icon
                        className="h-4 w-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {stop.name}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {tt.kind[stop.kind]} ·{" "}
                          {tt.distanceAway(
                            formatDistance(stop.distanceM, lang)
                          )}
                        </span>
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                          active && "rotate-180"
                        )}
                        aria-hidden="true"
                      />
                    </button>

                    {active && (
                      <div className="border-t border-border/70 px-3 pb-3 pt-2">
                        {boardStatus === "loading" && (
                          <div
                            className="space-y-2"
                            aria-busy="true"
                            aria-label={tt.loadingBoard}
                          >
                            <Skeleton className="h-6 w-full rounded" />
                            <Skeleton className="h-6 w-full rounded" />
                            <Skeleton className="h-6 w-2/3 rounded" />
                          </div>
                        )}
                        {boardStatus === "failed" && (
                          <p className="text-sm text-muted-foreground">
                            {tt.loadFailed}
                          </p>
                        )}
                        {boardStatus === "ready" && departures.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            {tt.emptyBoard}
                          </p>
                        )}
                        {boardStatus === "ready" && departures.length > 0 && (
                          <ul className="space-y-1.5">
                            {departures.map(run => (
                              <li
                                key={run.id}
                                className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm"
                              >
                                <span className="font-mono tabular-nums">
                                  {formatTime(run.departureMs)}
                                </span>
                                {run.delayMin !== undefined &&
                                  run.delayMin > 0 && (
                                    <span className="font-medium text-destructive">
                                      {tt.delay(run.delayMin)}
                                    </span>
                                  )}
                                {run.line && (
                                  <span className="rounded bg-accent px-1.5 py-0.5 text-xs font-medium text-accent-foreground">
                                    {run.line}
                                  </span>
                                )}
                                <span className="min-w-0 flex-1 truncate">
                                  {run.to}
                                </span>
                                {run.platform && (
                                  <span className="text-xs text-muted-foreground">
                                    {tt.platform(run.platform)}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}

                        {boardStatus !== "loading" && (
                          <button
                            type="button"
                            onClick={() => void loadBoard(stop.id)}
                            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                          >
                            <RefreshCw
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            {tt.refresh}
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {(status === "ready" || status === "failed") && (
            <button
              type="button"
              onClick={() => void loadStations()}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {tt.refreshStations}
            </button>
          )}

          <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
            <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {tt.source}
          </p>
        </div>
      )}
    </section>
  );
}
