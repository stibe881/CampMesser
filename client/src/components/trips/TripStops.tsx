/**
 * Etappen einer Reise (#536): Rundreisen bestehen aus mehreren Orten mit
 * je eigenem Von/Bis. Der Abschnitt ist aufklappbar wie die Reisekasse –
 * die Etappen werden erst beim Öffnen geladen.
 *
 * DIE KARTE VERBINDET: Etappen mit Koordinaten stehen als nummerierte
 * Punkte auf einer Mini-Karte, eine Linie zeigt die Reihenfolge. Die
 * Koordinaten kommen aus derselben Ortssuche wie im Reise-Formular
 * (#465) – ohne gewählten Treffer bleibt die Etappe ohne Punkt, und die
 * Ansicht sagt das.
 *
 * WETTER JE ETAPPE: Die Heute-Ansicht nimmt während der Reise die
 * Koordinaten der AKTUELLEN Etappe (shared/tripStops.ts) – Wetter,
 * Umgebung und Karten wandern automatisch mit.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  MapPin,
  Pencil,
  Plus,
  Route,
  Search,
  Star,
  Tent,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ConfirmDialog";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/i18n";
import { fmtShort } from "@/lib/dateFormat";
import { useTodayIso } from "@/lib/useTodayIso";
import { searchPlaces, type PlaceResult } from "@/lib/placeSearch";
import { routeOrEstimate } from "@/lib/routing";
import TripStagesOfflinePack from "@/components/trips/TripStagesOfflinePack";
import WeatherIcon from "@/components/weather/WeatherIcon";
import { shiftIsoDay } from "@shared/localDate";
import { loadMapLayer } from "@/lib/mapLayers";
import {
  createMap,
  divIcon,
  latLngBounds,
  type LatLngTuple,
  type LayerGroupObject,
  type MapEngine,
} from "@/lib/mapEngine";
import { useMapConfig } from "@/hooks/useMapConfig";
import {
  MAX_TRIP_STOPS,
  TRIP_STOP_NAME_MAX_LENGTH,
  currentTripStop,
} from "@shared/tripStops";
import { cn } from "@/lib/utils";

/** Kilometer knapp formatieren: unter 10 km eine Nachkommastelle. */
function fmtKm(distanceM: number): string {
  const km = distanceM / 1000;
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

/** Fahrzeit als «2 h 40» bzw. «35 min». */
function fmtDrive(durationS: number): string {
  const minutes = Math.round(durationS / 60);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}

/** Nummerierter Etappen-Punkt – gleiche divIcon-Technik wie die Karte. */
function stopIcon(index: number, active: boolean) {
  const fill = active ? "#16a34a" : "#2563eb";
  return divIcon({
    className: "",
    html: `<div style="width:26px;height:26px;border-radius:9999px;background:${fill};color:#fff;border:2.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;">${index}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });
}

export default function TripStops({
  tripId,
  tripName,
  startDate,
  endDate,
}: {
  tripId: number;
  tripName: string;
  startDate: string;
  endDate: string;
}) {
  const { lang, t } = useI18n();
  const ts = t.tripStops;
  const ask = useConfirm();
  const utils = trpc.useUtils();
  const today = useTodayIso();
  const [open, setOpen] = useState(false);

  const query = trpc.trips.stops.list.useQuery({ tripId }, { enabled: open });
  const stops = useMemo(() => query.data ?? [], [query.data]);
  const current = useMemo(() => currentTripStop(stops, today), [stops, today]);

  /** null = Formular zu, "neu" = neue Etappe, sonst die Id der bearbeiteten. */
  const [editing, setEditing] = useState<number | "neu" | null>(null);
  /**
   * Favoriten und Merkorte als Etappen-Vorschlag (#576/#577): Die
   * Rundreise entsteht aus der Wunschliste – ein Tipp übernimmt Name
   * UND Koordinaten. Geladen erst, wenn das Formular offen ist.
   */
  const spotsQuery = trpc.spots.list.useQuery(undefined, {
    enabled: editing !== null,
    staleTime: 5 * 60_000,
  });
  const savedPlacesQuery = trpc.savedPlaces.list.useQuery(undefined, {
    enabled: editing !== null,
    staleTime: 5 * 60_000,
  });
  const pickSuggestions = useMemo(
    () => [
      ...(spotsQuery.data ?? []).map(spot => ({
        key: `spot-${spot.id}`,
        name: spot.name,
        lat: spot.latitude,
        lng: spot.longitude,
        kind: "spot" as const,
      })),
      ...(savedPlacesQuery.data ?? []).map(place => ({
        key: `place-${place.id}`,
        name: place.name,
        lat: place.latitude,
        lng: place.longitude,
        kind: "saved" as const,
      })),
    ],
    [spotsQuery.data, savedPlacesQuery.data]
  );

  const [name, setName] = useState("");
  const [from, setFrom] = useState(startDate);
  const [to, setTo] = useState(endDate);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [placeResults, setPlaceResults] = useState<PlaceResult[] | null>(null);
  const [placeSearching, setPlaceSearching] = useState(false);

  const invalidate = () => utils.trips.stops.list.invalidate({ tripId });

  const closeForm = () => {
    setEditing(null);
    setName("");
    setCoords(null);
    setPlaceResults(null);
  };

  const addMutation = trpc.trips.stops.add.useMutation({
    onSuccess: () => {
      invalidate();
      closeForm();
      toast.success(ts.saved);
    },
    onError: e => toast.error(e.message || t.common.saveFailed),
  });
  const updateMutation = trpc.trips.stops.update.useMutation({
    onSuccess: () => {
      invalidate();
      closeForm();
      toast.success(ts.updated);
    },
    onError: e => toast.error(e.message || t.common.saveFailed),
  });
  const removeMutation = trpc.trips.stops.remove.useMutation({
    onSuccess: () => {
      invalidate();
      toast.success(ts.deleted);
    },
    onError: () => toast.error(t.common.actionFailed),
  });

  const startNew = () => {
    setEditing("neu");
    setName("");
    // Sinnvoller Vorschlag: die neue Etappe beginnt, wo die letzte endet
    const last = stops[stops.length - 1];
    setFrom(last ? last.endDate : startDate);
    setTo(endDate);
    setCoords(null);
    setPlaceResults(null);
  };

  const startEdit = (stop: (typeof stops)[number]) => {
    setEditing(stop.id);
    setName(stop.name);
    setFrom(stop.startDate);
    setTo(stop.endDate);
    setCoords(
      stop.latitude != null && stop.longitude != null
        ? { lat: stop.latitude, lng: stop.longitude }
        : null
    );
    setPlaceResults(null);
  };

  /** Ortssuche (#465): Treffer zur getippten Eingabe holen. */
  const runPlaceSearch = async () => {
    const search = name.trim();
    if (!search) return;
    setPlaceSearching(true);
    try {
      setPlaceResults(await searchPlaces(search, lang));
    } catch {
      toast.error(t.trips.locationSearchFailed);
    } finally {
      setPlaceSearching(false);
    }
  };

  const pickPlace = (place: PlaceResult) => {
    setName(place.name);
    setCoords({ lat: place.latitude, lng: place.longitude });
    setPlaceResults(null);
  };

  /** Tage zwischen zwei ISO-Daten (b − a), Vorzeichen inklusive. */
  const isoDayDiff = (a: string, b: string) =>
    Math.round(
      (new Date(`${b}T00:00:00`).getTime() -
        new Date(`${a}T00:00:00`).getTime()) /
        86_400_000
    );

  /**
   * Folge-Etappen mitverschieben (#578): Wer eine Etappe verlängert,
   * will selten alle folgenden von Hand anfassen. Nach dem Speichern
   * fragt die App einmal – auf Wunsch wandern alle Etappen, die ab der
   * ALTEN Weiterreise beginnen, um dieselbe Tagezahl.
   */
  const maybeShiftFollowers = async (
    original: (typeof stops)[number] | null,
    newEnd: string
  ) => {
    if (!original || original.endDate === newEnd) return;
    const delta = isoDayDiff(original.endDate, newEnd);
    const followers = stops.filter(
      stop => stop.id !== original.id && stop.startDate >= original.endDate
    );
    if (delta === 0 || followers.length === 0) return;
    if (!(await ask({ title: ts.shiftConfirm(followers.length, delta) }))) {
      return;
    }
    try {
      for (const stop of followers) {
        await utils.client.trips.stops.update.mutate({
          id: stop.id,
          startDate: shiftIsoDay(stop.startDate, delta),
          endDate: shiftIsoDay(stop.endDate, delta),
        });
      }
      toast.success(ts.shifted(followers.length));
    } catch {
      toast.error(t.common.saveFailed);
    } finally {
      void invalidate();
    }
  };

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error(ts.nameRequired);
      return;
    }
    const payload = {
      name: trimmed.slice(0, TRIP_STOP_NAME_MAX_LENGTH),
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      startDate: from,
      endDate: to,
    };
    if (editing === "neu") {
      addMutation.mutate({ tripId, ...payload });
    } else if (typeof editing === "number") {
      const original = stops.find(stop => stop.id === editing) ?? null;
      updateMutation.mutate(
        { id: editing, ...payload },
        {
          onSuccess: () => void maybeShiftFollowers(original, payload.endDate),
        }
      );
    }
  };

  const busy = addMutation.isPending || updateMutation.isPending;
  const fmtDay = (iso: string) => fmtShort(new Date(`${iso}T00:00:00`), lang);

  // ── Mini-Karte: Etappen als nummerierte Punkte, Linie in Reihenfolge ──
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<MapEngine | null>(null);
  const layerRef = useRef<LayerGroupObject | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const maps = useMapConfig();
  const mapStops = useMemo(
    () =>
      stops.filter(
        (
          stop
        ): stop is (typeof stops)[number] & {
          latitude: number;
          longitude: number;
        } => stop.latitude != null && stop.longitude != null
      ),
    [stops]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!open || !container || engineRef.current || !maps.ready) return;
    if (mapStops.length === 0) return;
    let cancelled = false;
    void createMap(container, {
      center: [mapStops[0].latitude, mapStops[0].longitude],
      zoom: 7,
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
        layerRef.current = engine.layerGroup();
        setMapReady(true);
      })
      .catch(() => {
        // Ohne Netz bleibt die Karte weg – die Liste sagt alles Nötige
      });
    return () => {
      cancelled = true;
      engineRef.current?.destroy();
      engineRef.current = null;
      layerRef.current = null;
      setMapReady(false);
    };
    // mapStops.length nur als "gibt es überhaupt Punkte" – der Aufbau
    // selbst passiert einmal, das Nachzeichnen unten.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, maps.ready, maps.config, mapStops.length > 0]);

  /**
   * Fahrzeit & Distanz zwischen den Etappen (#558): OSRM-Routing (#299)
   * je Abschnitt, Schlüssel ist die ZIEL-Etappe. Ohne Netz kommt die
   * Luftlinien-Schätzung – als solche gekennzeichnet. Der Routen-Cache
   * in fetchRoute macht Wiederholungen gratis.
   */
  const [legs, setLegs] = useState<
    Map<number, { distanceM: number; durationS: number; estimated: boolean }>
  >(new Map());
  useEffect(() => {
    if (!open || mapStops.length < 2) {
      setLegs(new Map());
      return;
    }
    let cancelled = false;
    void (async () => {
      const next = new Map<
        number,
        { distanceM: number; durationS: number; estimated: boolean }
      >();
      for (let i = 1; i < mapStops.length; i++) {
        const fromStop = mapStops[i - 1];
        const toStop = mapStops[i];
        const route = await routeOrEstimate(
          [
            { lat: fromStop.latitude, lon: fromStop.longitude },
            { lat: toStop.latitude, lon: toStop.longitude },
          ],
          "car",
          70
        );
        if (cancelled) return;
        next.set(toStop.id, {
          distanceM: route.distanceM,
          durationS: route.durationS,
          estimated: route.source !== "route",
        });
      }
      if (!cancelled) setLegs(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, mapStops]);
  const legTotal = useMemo(() => {
    if (legs.size === 0 || legs.size < mapStops.length - 1) return null;
    let distanceM = 0;
    let durationS = 0;
    let estimated = false;
    legs.forEach(leg => {
      distanceM += leg.distanceM;
      durationS += leg.durationS;
      estimated = estimated || leg.estimated;
    });
    return { distanceM, durationS, estimated };
  }, [legs, mapStops.length]);

  /**
   * Wetter je Etappe (#560): Symbol und Höchsttemperatur am Ankunftstag,
   * soweit die 16-Tage-Prognose reicht – weiter draussen bleibt die Zeile
   * ehrlich leer. Ein Abruf je Etappe mit Koordinaten im Fenster.
   */
  const [stageWeather, setStageWeather] = useState<
    Map<number, { code: number; tMax: number }>
  >(new Map());
  useEffect(() => {
    if (!open) return;
    const horizon = shiftIsoDay(today, 15);
    const targets = mapStops.filter(
      stop => stop.startDate >= today && stop.startDate <= horizon
    );
    if (targets.length === 0) {
      setStageWeather(new Map());
      return;
    }
    let cancelled = false;
    void Promise.all(
      targets.map(async stop => {
        try {
          const params = new URLSearchParams({
            latitude: String(stop.latitude),
            longitude: String(stop.longitude),
            daily: "weather_code,temperature_2m_max",
            timezone: "auto",
            start_date: stop.startDate,
            end_date: stop.startDate,
          });
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?${params.toString()}`
          );
          if (!res.ok) return null;
          const json = (await res.json()) as {
            daily?: { weather_code?: number[]; temperature_2m_max?: number[] };
          };
          const code = json.daily?.weather_code?.[0];
          const tMax = json.daily?.temperature_2m_max?.[0];
          if (typeof code !== "number" || typeof tMax !== "number") return null;
          return { id: stop.id, code, tMax };
        } catch {
          return null;
        }
      })
    ).then(rows => {
      if (cancelled) return;
      const next = new Map<number, { code: number; tMax: number }>();
      for (const row of rows) {
        if (row) next.set(row.id, { code: row.code, tMax: row.tMax });
      }
      setStageWeather(next);
    });
    return () => {
      cancelled = true;
    };
  }, [open, mapStops, today]);

  useEffect(() => {
    const engine = engineRef.current;
    const layer = layerRef.current;
    if (!engine || !layer || !mapReady) return;
    layer.clear();
    if (mapStops.length === 0) return;
    const line: LatLngTuple[] = mapStops.map(stop => [
      stop.latitude,
      stop.longitude,
    ]);
    if (line.length > 1) {
      engine.polyline(line, {
        color: "#2563eb",
        weight: 3,
        opacity: 0.8,
        dashArray: "6 6",
        layer,
      });
    }
    mapStops.forEach((stop, index) => {
      engine.marker([stop.latitude, stop.longitude], {
        icon: stopIcon(index + 1, current?.id === stop.id),
        title: stop.name,
        layer,
      });
    });
    engine.fitBounds(latLngBounds(line), { padding: 30, maxZoom: 11 });
  }, [mapReady, mapStops, current]);

  return (
    <div className="mt-2 rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={ts.toggleAria(tripName)}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm"
      >
        <Route className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-left font-medium">
          {ts.title}
        </span>
        {stops.length > 0 && (
          <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
            {stops.length}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="space-y-3 border-t border-border px-3 py-2.5">
          <p className="text-xs text-muted-foreground">{ts.hint}</p>

          {query.isLoading ? (
            <Skeleton className="h-16 w-full rounded-lg" />
          ) : (
            <>
              {mapStops.length > 0 && (
                <div
                  ref={containerRef}
                  className="h-56 w-full overflow-hidden rounded-lg border border-border"
                  aria-label={ts.mapAria}
                />
              )}
              {stops.length > 0 && mapStops.length < stops.length && (
                <p className="text-xs text-muted-foreground">
                  {ts.noCoordsNote}
                </p>
              )}

              {stops.length === 0 ? (
                <p className="text-sm text-muted-foreground">{ts.empty}</p>
              ) : (
                <ol className="space-y-1">
                  {stops.map((stop, index) => (
                    <li
                      key={stop.id}
                      className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2"
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white",
                          current?.id === stop.id
                            ? "bg-green-600"
                            : "bg-primary"
                        )}
                        aria-hidden="true"
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-x-2 text-sm font-medium">
                          {stop.name}
                          {current?.id === stop.id && (
                            <span className="rounded-full bg-green-600/15 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:text-green-400">
                              {ts.currentBadge}
                            </span>
                          )}
                        </p>
                        <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                          <span>
                            {fmtDay(stop.startDate)} – {fmtDay(stop.endDate)}
                            {stop.latitude == null && ` · ${ts.noCoordsShort}`}
                          </span>
                          {/* Wetter am Ankunftstag (#560), soweit die
                              16-Tage-Prognose reicht */}
                          {(() => {
                            const wx = stageWeather.get(stop.id);
                            return wx ? (
                              <span className="flex items-center gap-1">
                                <WeatherIcon
                                  code={wx.code}
                                  className="h-3.5 w-3.5"
                                />
                                {Math.round(wx.tMax)}°
                              </span>
                            ) : null;
                          })()}
                        </p>
                        {/* Fahrt ab der vorherigen Etappe (#558) */}
                        {(() => {
                          const leg = legs.get(stop.id);
                          return leg ? (
                            <p className="text-xs text-muted-foreground">
                              {ts.legLine(
                                fmtKm(leg.distanceM),
                                fmtDrive(leg.durationS)
                              )}
                              {leg.estimated && ` (${ts.legEstimated})`}
                            </p>
                          ) : null;
                        })()}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground/60 hover:text-foreground"
                        onClick={() => startEdit(stop)}
                        aria-label={ts.editAria(stop.name)}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground/60 hover:text-destructive"
                        onClick={async () => {
                          if (await ask({ title: ts.deleteConfirm(stop.name) }))
                            removeMutation.mutate({ id: stop.id });
                        }}
                        aria-label={ts.deleteAria(stop.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </li>
                  ))}
                </ol>
              )}
              {/* Offline-Paket der ganzen Rundreise (#561) */}
              {mapStops.length > 0 && (
                <TripStagesOfflinePack
                  tripId={tripId}
                  tripName={tripName}
                  stops={mapStops.map(stop => ({
                    lat: stop.latitude,
                    lon: stop.longitude,
                  }))}
                />
              )}
              {/* Summe der Rundreise (#558): erst wenn alle Abschnitte da sind */}
              {legTotal && (
                <p className="text-xs font-medium text-muted-foreground">
                  {ts.legTotal(
                    fmtKm(legTotal.distanceM),
                    fmtDrive(legTotal.durationS)
                  )}
                  {legTotal.estimated && ` (${ts.legEstimated})`}
                </p>
              )}

              {editing === null ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startNew}
                  disabled={stops.length >= MAX_TRIP_STOPS}
                >
                  <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {stops.length >= MAX_TRIP_STOPS
                    ? ts.maxReached(MAX_TRIP_STOPS)
                    : ts.addButton}
                </Button>
              ) : (
                <div className="space-y-2 rounded-lg border border-border p-3">
                  <p className="text-sm font-semibold">
                    {editing === "neu" ? ts.newTitle : ts.editTitle}
                  </p>
                  <div>
                    <Label htmlFor={`stop-name-${tripId}`}>
                      {ts.nameLabel}
                    </Label>
                    <Input
                      id={`stop-name-${tripId}`}
                      className="mt-1"
                      maxLength={TRIP_STOP_NAME_MAX_LENGTH}
                      placeholder={ts.namePlaceholder}
                      value={name}
                      onChange={e => {
                        // Von Hand geändert → alte Koordinaten gelten nicht
                        setCoords(null);
                        setName(e.target.value);
                      }}
                    />
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!name.trim() || placeSearching}
                        onClick={() => void runPlaceSearch()}
                      >
                        <Search
                          className="mr-1.5 h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                        {t.trips.locationSearchButton}
                      </Button>
                      {coords && (
                        <span className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                          <MapPin className="h-3 w-3" aria-hidden="true" />
                          {t.trips.locationCoordsSet}
                          <button
                            type="button"
                            onClick={() => setCoords(null)}
                            aria-label={t.trips.locationCoordsClearAria}
                            className="ml-0.5 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3 w-3" aria-hidden="true" />
                          </button>
                        </span>
                      )}
                    </div>
                    {/* Favoriten & Merkorte als Ein-Tipp-Vorschlag
                        (#576/#577): Name UND Koordinaten auf einmal –
                        die Rundreise entsteht aus der Wunschliste. */}
                    {pickSuggestions.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">
                          {ts.suggestionsLabel}
                        </span>
                        {pickSuggestions.slice(0, 8).map(pick => (
                          <button
                            key={pick.key}
                            type="button"
                            onClick={() => {
                              setName(pick.name);
                              setCoords({ lat: pick.lat, lng: pick.lng });
                              setPlaceResults(null);
                            }}
                            className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                          >
                            {pick.kind === "spot" ? (
                              <Tent className="h-3 w-3" aria-hidden="true" />
                            ) : (
                              <Star className="h-3 w-3" aria-hidden="true" />
                            )}
                            {pick.name}
                          </button>
                        ))}
                      </div>
                    )}
                    {placeResults !== null &&
                      (placeResults.length === 0 ? (
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          {t.trips.locationSearchNoResults}
                        </p>
                      ) : (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {placeResults.map(place => (
                            <button
                              key={place.id}
                              type="button"
                              onClick={() => pickPlace(place)}
                              className="rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                            >
                              {place.name}
                              {place.region && (
                                <span className="text-xs">
                                  {" "}
                                  · {place.region}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor={`stop-from-${tripId}`}>
                        {ts.fromLabel}
                      </Label>
                      <Input
                        id={`stop-from-${tripId}`}
                        className="mt-1"
                        type="date"
                        value={from}
                        onChange={e => {
                          const value = e.target.value;
                          setFrom(value);
                          setTo(current => (current < value ? value : current));
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`stop-to-${tripId}`}>{ts.toLabel}</Label>
                      <Input
                        id={`stop-to-${tripId}`}
                        className="mt-1"
                        type="date"
                        min={from}
                        value={to}
                        onChange={e => setTo(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" disabled={busy} onClick={submit}>
                      {busy ? t.common.saving : t.common.save}
                    </Button>
                    <Button size="sm" variant="outline" onClick={closeForm}>
                      {t.common.cancel}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
