import { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { useTodayIso } from "@/lib/useTodayIso";

// Diagramme erst nach dem ersten Bild (#354): recharts ist 384 kB.
const RainChart = lazy(() => import("@/components/charts/RainChart"));
const DayHoursChart = lazy(() => import("@/components/charts/DayHoursChart"));
import { fmtShort, fmtWeekdayDay } from "@/lib/dateFormat";
import { weekendWindows } from "@shared/weatherWindow";
import {
  AlertTriangle,
  ArrowLeftRight,
  ChevronDown,
  CloudRain,
  Bug,
  Cloudy,
  Droplets,
  Flame,
  Flower2,
  Info,
  LocateFixed,
  MapPin,
  Plus,
  RefreshCw,
  Star,
  Sun,
  Sunrise,
  Sunset,
  Tent,
  TrendingDown,
  Wind,
  X,
} from "lucide-react";
import { Link } from "wouter";
import PageHeader from "@/components/PageHeader";
import OfficialWarnings from "@/components/OfficialWarnings";
import RainRadar from "@/components/RainRadar";
import CondensationCard from "@/components/CondensationCard";
import WeatherTurnCard from "@/components/WeatherTurnCard";
import WinterCard from "@/components/WinterCard";
import AirQualityCard from "@/components/AirQualityCard";
import DryWindowCard from "@/components/DryWindowCard";
import { weatherTurn } from "@shared/weatherTurn";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";

import { trpc } from "@/lib/trpc";
import { useSyncedSetting } from "@/lib/useSyncedSetting";
import {
  MAX_WEATHER_PLACES,
  addWeatherPlace,
  isSameWeatherPlace,
  removeWeatherPlace,
  sanitizeWeatherPlace,
  sanitizeWeatherPlaces,
  loadStoredWeatherPlaces,
  storeWeatherPlaces,
  loadLastWeatherPlace,
  storeLastWeatherPlace,
  type WeatherPlace,
} from "@/lib/weatherPlaces";
import { cn } from "@/lib/utils";
import FireBanOverview from "@/components/FireBanOverview";
import { heatAdvice } from "@shared/heatCare";
import {
  eveningMosquitoIndex,
  mosquitoAdvice,
  mosquitoLevelLabel,
} from "@shared/mosquito";
import { LOCALE_TAGS } from "@shared/i18n";
import {
  describeUvIndex,
  describeWeatherCode,
  detectAlerts,
  nextRainWindow,
  pressureTrend,
  PRESSURE_STRONG_HPA,
  type UvLevel,
  type WeatherAlert,
} from "@shared/weather";
import {
  describePollenLevel,
  parsePollenResponse,
  pollenRequestUrl,
  pollenTypeName,
  POLLEN_TYPES,
  type PollenLevel,
  type PollenReading,
  type PollenType,
} from "@shared/pollen";
import {
  loadPollenProfile,
  sanitizePollenProfile,
  sortPollenReadings,
  storePollenProfile,
  togglePollenType,
} from "@/lib/pollenProfile";
import {
  describeFireDanger,
  fireDangerRequestUrl,
  parseFireDangerResponse,
  type FireDangerInfo,
  type FireDangerLevel,
} from "@shared/fireDanger";

import { wgs84ToLV95 } from "@/lib/sun";
import WeatherIcon from "@/components/weather/WeatherIcon";
import DayWindRow from "@/components/weather/DayWindRow";
import PlaceSearch from "@/components/weather/PlaceSearch";
import CompareSection from "@/components/weather/CompareSection";
import YourPlacesSection from "@/components/weather/YourPlacesSection";
import { severityStyles } from "@/components/weather/weatherStyles";
import {
  fetchWeather,
  WeatherServiceError,
  type WeatherData,
} from "@/lib/weatherFetch";

type LoadState = "idle" | "locating" | "loading" | "ready" | "error";

const fireLevelStyles: Record<FireDangerLevel, string> = {
  1: "border-primary/30 bg-primary/5 text-foreground",
  2: "border-chart-4/50 bg-chart-4/10 text-foreground",
  3: "border-chart-1/60 bg-chart-1/10 text-foreground",
  4: "border-destructive/50 bg-destructive/10 text-destructive",
  5: "border-destructive bg-destructive/20 text-destructive",
};

// UV-Stufen (WHO-Skala) in dieselbe Farblogik wie die Waldbrand-Stufen übersetzen
const uvLevelStyles: Record<UvLevel, string> = {
  niedrig: "border-primary/30 bg-primary/5 text-foreground",
  maessig: "border-chart-4/50 bg-chart-4/10 text-foreground",
  hoch: "border-chart-1/60 bg-chart-1/10 text-foreground",
  sehrHoch: "border-destructive/50 bg-destructive/10 text-destructive",
  extrem: "border-destructive bg-destructive/20 text-destructive",
};

const pollenLevelStyles: Record<PollenLevel, string> = {
  keine: "border-border bg-secondary/60 text-foreground",
  gering: "border-primary/30 bg-primary/5 text-foreground",
  maessig: "border-chart-4/50 bg-chart-4/10 text-foreground",
  hoch: "border-chart-1/60 bg-chart-1/10 text-foreground",
  sehrHoch: "border-destructive/50 bg-destructive/10 text-destructive",
};

/** Eigener Ladezustand für den Pollenflug – ein Ausfall der
 *  Air-Quality-API darf die Wettervorhersage nicht brechen. */
type PollenState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "empty" }
  | { status: "ready"; readings: PollenReading[] };

export default function WeatherPage() {
  const { lang, t } = useI18n();
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    null
  );
  const [data, setData] = useState<WeatherData | null>(null);
  // Ausgewählter Ort: null = eigener Standort, sonst ID des Zeltplatz-Favoriten
  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(null);
  // Ausgewählter Wetter-Favorit (per Ortssuche gespeicherter Ort)
  const [selectedPlace, setSelectedPlace] = useState<WeatherPlace | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  // Gespeicherte Wetter-Orte (localStorage + Geräte-Sync)
  const [places, setPlaces] = useState<WeatherPlace[]>(loadStoredWeatherPlaces);
  const [placeSearchOpen, setPlaceSearchOpen] = useState(false);
  const [fireDanger, setFireDanger] = useState<FireDangerInfo | null>(null);
  const [pollen, setPollen] = useState<PollenState>({ status: "idle" });
  // Allergie-Profil (localStorage + Geräte-Sync) und der Nur-meine-Arten-Filter.
  // Der Filter bleibt bewusst Sitzungs-Zustand – gespeichert wird nur die Auswahl.
  const [pollenProfile, setPollenProfile] =
    useState<PollenType[]>(loadPollenProfile);
  const [onlyMyPollen, setOnlyMyPollen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  // Aufgeklappter Tag der 7-Tage-Vorschau (Datum) – nur einer gleichzeitig
  const [openDay, setOpenDay] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const { data: spots } = trpc.spots.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  // Reise-Ort als Wetter-Ort (#533): Freitext-Reisen mit Koordinaten aus
  // der Ortssuche (Hotel in Rom) tauchen sonst nirgends als Chip auf –
  // die Zeltplatz-Chips decken nur verknüpfte Plätze ab.
  const { data: tripsForPlaces } = trpc.trips.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Geräte-Sync: Wetter-Orte vom Konto übernehmen bzw. Änderungen hochladen
  const placesSync = useSyncedSetting<WeatherPlace[]>(
    "weatherPlaces",
    value => {
      const clean = sanitizeWeatherPlaces(value);
      setPlaces(clean);
      storeWeatherPlaces(clean);
    }
  );

  const todayIsoForTrips = useTodayIso();
  const tripPlaceSuggestion = useMemo(() => {
    const candidates = (tripsForPlaces ?? [])
      .filter(
        trip =>
          trip.spotId === null &&
          trip.latitude != null &&
          trip.longitude != null &&
          trip.endDate >= todayIsoForTrips
      )
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
    for (const trip of candidates) {
      const suggestion: WeatherPlace = {
        name: (trip.location || trip.title || "").slice(0, 80),
        lat: trip.latitude as number,
        lon: trip.longitude as number,
      };
      if (!suggestion.name) continue;
      if (places.some(place => isSameWeatherPlace(place, suggestion))) continue;
      return suggestion;
    }
    return null;
  }, [tripsForPlaces, places, todayIsoForTrips]);

  const savePlaces = (next: WeatherPlace[]) => {
    setPlaces(next);
    storeWeatherPlaces(next);
    placesSync.push(next);
  };

  // Geräte-Sync des Allergie-Profils (Muster weatherPlaces)
  const pollenSync = useSyncedSetting<PollenType[]>("pollenProfile", value => {
    const clean = sanitizePollenProfile(value);
    setPollenProfile(clean);
    storePollenProfile(clean);
  });

  /** Pollenart an-/abwählen und die Auswahl lokal wie im Konto sichern. */
  const togglePollenProfileType = (type: PollenType) => {
    const next = togglePollenType(pollenProfile, type);
    setPollenProfile(next);
    storePollenProfile(next);
    pollenSync.push(next);
    if (next.length === 0) setOnlyMyPollen(false);
  };

  // Waldbrandgefahr (offizielle BAFU-Warnkarte) für den gewählten Ort laden.
  // Nur innerhalb der Schweiz verfügbar – ausserhalb bleibt der Abschnitt ausgeblendet.
  useEffect(() => {
    setFireDanger(null);
    if (!coords) return;
    const lv95 = wgs84ToLV95(coords.lat, coords.lon);
    if (!lv95) return;
    let cancelled = false;
    fetch(fireDangerRequestUrl(lv95.east, lv95.north))
      .then(res => (res.ok ? res.json() : null))
      .then(json => {
        if (!cancelled) setFireDanger(parseFireDangerResponse(json));
      })
      .catch(() => {
        // Stilles Scheitern: Waldbrand-Info ist eine Zusatzinfo, kein Kern-Feature
      });
    return () => {
      cancelled = true;
    };
  }, [coords]);

  // Pollenflug (Open-Meteo Air-Quality-API) für den gewählten Ort laden.
  // Separater Zustand: schlägt der Abruf fehl, bleibt das Wetter unberührt.
  useEffect(() => {
    if (!coords) {
      setPollen({ status: "idle" });
      return;
    }
    let cancelled = false;
    setPollen({ status: "loading" });
    fetch(pollenRequestUrl(coords.lat, coords.lon))
      .then(res => (res.ok ? res.json() : Promise.reject(new Error())))
      .then(json => {
        if (cancelled) return;
        const readings = parsePollenResponse(json);
        setPollen(
          readings ? { status: "ready", readings } : { status: "empty" }
        );
      })
      .catch(() => {
        if (!cancelled) setPollen({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [coords]);

  const loadForCoords = async (lat: number, lon: number) => {
    setState("loading");
    setCoords({ lat, lon });
    setOpenDay(null);
    try {
      setData(await fetchWeather(lat, lon));
      setState("ready");
    } catch (e) {
      setState("error");
      setError(
        e instanceof WeatherServiceError
          ? t.weather.serviceError(e.status)
          : t.weather.loadFailed
      );
    }
  };

  const load = () => {
    setState("locating");
    setError(null);
    setSelectedSpotId(null);
    setSelectedPlace(null);
    setLocationLabel(null);
    storeLastWeatherPlace(null);
    if (!navigator.geolocation) {
      setState("error");
      setError(t.weather.geoUnsupported);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords;
        await loadForCoords(latitude, longitude);
      },
      () => {
        setState("error");
        setError(t.weather.geoDenied);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const selectSpot = (spot: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
  }) => {
    setSelectedSpotId(spot.id);
    setSelectedPlace(null);
    setLocationLabel(spot.name);
    setError(null);
    storeLastWeatherPlace(null);
    void loadForCoords(spot.latitude, spot.longitude);
  };

  /** Gespeicherten Wetter-Ort anzeigen und als «zuletzt gewählt» merken. */
  const selectPlace = (place: WeatherPlace) => {
    setSelectedSpotId(null);
    setSelectedPlace(place);
    setLocationLabel(place.name);
    setError(null);
    storeLastWeatherPlace(place);
    void loadForCoords(place.lat, place.lon);
  };

  /** Suchresultat übernehmen: Ort speichern (Stern) und sofort anzeigen. */
  const pickSearchResult = (place: WeatherPlace) => {
    const next = addWeatherPlace(places, place);
    if (next) savePlaces(next);
    setPlaceSearchOpen(false);
    const saved = sanitizeWeatherPlace(place);
    if (saved) selectPlace(saved);
  };

  /** Klick in «Deine Plätze»: Ort in der Hauptansicht anzeigen. */
  const selectOverviewPlace = (place: {
    name: string;
    lat: number;
    lon: number;
    spotId: number | null;
  }) => {
    setSelectedSpotId(place.spotId);
    setSelectedPlace(null);
    setLocationLabel(place.name);
    setError(null);
    storeLastWeatherPlace(null);
    void loadForCoords(place.lat, place.lon);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /** Stern entfernen – ein gerade angezeigter Ort bleibt sichtbar. */
  const removePlace = (place: WeatherPlace) => {
    savePlaces(removeWeatherPlace(places, place));
    if (selectedPlace && isSameWeatherPlace(selectedPlace, place)) {
      setSelectedPlace(null);
      storeLastWeatherPlace(null);
    }
  };

  useEffect(() => {
    // Zuletzt gewählter Wetter-Favorit gewinnt beim Start – sonst Standort
    const last = loadLastWeatherPlace();
    if (last) {
      setSelectedPlace(last);
      setLocationLabel(last.name);
      void loadForCoords(last.lat, last.lon);
    } else {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const alerts: WeatherAlert[] = useMemo(
    () => (data ? detectAlerts(data.hourly, lang) : []),
    [data, lang]
  );

  // Aus dem Unwetter-Badge der Startseite kommt man mit #warnungen hierher –
  // der Abschnitt existiert erst, wenn die Prognose da ist, deshalb erst dann
  // (und genau einmal) hinscrollen.
  const alertsScrolledRef = useRef(false);
  useEffect(() => {
    if (alertsScrolledRef.current || !data) return;
    if (window.location.hash !== "#warnungen") return;
    const section = document.getElementById("warnungen");
    if (!section) return;
    alertsScrolledRef.current = true;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [data]);
  // Regen-Kurzfrist-Hinweis: nur zeigen, wenn Regen innerhalb der nächsten
  // 2 Stunden beginnt oder aufhört – sonst bleibt die Zeile weg.
  const rainNotice = useMemo(() => {
    if (!data) return null;
    const now = new Date();
    const window = nextRainWindow(data.minutely, now);
    if (!window) return null;
    const limit = now.getTime() + 2 * 3600000;
    if (
      !window.ongoing &&
      window.startsAt &&
      new Date(window.startsAt).getTime() <= limit
    ) {
      return { kind: "start" as const, time: new Date(window.startsAt) };
    }
    if (
      window.ongoing &&
      window.endsAt &&
      new Date(window.endsAt).getTime() <= limit
    ) {
      return { kind: "end" as const, time: new Date(window.endsAt) };
    }
    return null;
  }, [data]);
  // Luftdruck-Trend: als Frühindikator zeigen wir bewusst nur FALLENDEN Druck
  // (steigender oder gleichbleibender Druck braucht keinen Hinweis).
  const pressureNotice = useMemo(() => {
    if (!data) return null;
    const trend = pressureTrend(data.hourly, new Date());
    if (!trend || trend.direction !== "falling") return null;
    return {
      strong: trend.hPaPer3h <= -PRESSURE_STRONG_HPA,
      hPa: Math.abs(trend.hPaPer3h).toFixed(1),
    };
  }, [data]);
  // Pollen-Anzeige: eigene Arten zuerst, auf Wunsch nur diese
  const visiblePollenReadings = useMemo(() => {
    if (pollen.status !== "ready") return [];
    const sorted = sortPollenReadings(pollen.readings, pollenProfile);
    return onlyMyPollen && pollenProfile.length > 0
      ? sorted.filter(r => pollenProfile.includes(r.type))
      : sorted;
  }, [pollen, pollenProfile, onlyMyPollen]);
  const next24 = data?.hourly.slice(0, 24) ?? [];
  // Heutiger Max-UV (WHO-Skala) – Wert kommt aus demselben Forecast-Abruf
  const uvToday = data?.daily[0]?.uvIndexMax ?? null;
  const uvInfo = uvToday !== null ? describeUvIndex(uvToday, lang) : null;
  // Sonnencreme & Trinken (#260/#261): dieselbe Rechnung wie in der
  // Push-Erinnerung, damit Anzeige und Mitteilung nie auseinanderlaufen.
  const heatToday = heatAdvice(uvToday ?? 0, data?.daily[0]?.tempMaxC ?? 0);
  /**
   * Stechmücken-Index (#262) für den kommenden Abend: die schlechteste
   * Stunde zwischen 18 und 23 Uhr, weil die Dämmerung die Hauptflugzeit
   * ist. Der Regen der letzten Tage steckt als Brut-Faktor drin – hier
   * ersatzweise die Summe der vergangenen 48 Prognose-Stunden, weil das
   * Wetter-Modul keine Vergangenheit lädt.
   */
  const mosquitoTonight = useMemo(() => {
    if (!data) return null;
    const rain48 = data.hourly
      .slice(0, 48)
      .reduce((sum, h) => sum + (h.precipitationMm || 0), 0);
    const hours = data.hourly
      .slice(0, 24)
      .filter(h => h.humidityPercent !== undefined)
      .map(h => ({
        hour: new Date(h.time).getHours(),
        temperatureC: h.temperatureC,
        humidityPercent: h.humidityPercent ?? 0,
        windKmh: h.windSpeedKmh,
        recentRainMm: rain48,
      }));
    return eveningMosquitoIndex(hours);
  }, [data]);

  /** Dezimaltrennzeichen der aktiven Sprache («3.5 l» bzw. «3,5 l»). */
  const decimalSeparator = (1.1).toLocaleString(LOCALE_TAGS[lang]).slice(1, 2);
  // Regen-Grafik: 48 h mit Menge und Wahrscheinlichkeit
  const rainData = useMemo(
    () =>
      (data?.hourly.slice(0, 48) ?? []).map(h => ({
        label: `${new Date(h.time).getHours()}:00`,
        mm: h.precipitationMm,
        prob: h.precipitationProbability,
      })),
    [data]
  );
  // Stundenverlauf des aufgeklappten Tages (0–24 Uhr, Zeit via LOCALE_TAGS)
  const openDayHours = useMemo(
    () =>
      data && openDay
        ? data.hourlyAll
            .filter(h => h.time.startsWith(openDay))
            .map(h => ({
              label: new Date(h.time).toLocaleTimeString(LOCALE_TAGS[lang], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              temp: h.temperatureC,
              mm: h.precipitationMm,
              apparentC: h.apparentC,
              gustsKmh: h.windGustsKmh,
              windDirectionDeg: h.windDirectionDeg,
            }))
        : [],
    [data, openDay, lang]
  );

  return (
    <div className="container max-w-3xl py-6 md:py-8">
      <PageHeader title={t.weather.title} subtitle={t.weather.subtitle} />

      {/* Ortsauswahl: eigener Standort, Zeltplatz-Favoriten und Wetter-Orte */}
      <div
        className="mb-4 flex flex-wrap items-center gap-2"
        role="group"
        aria-label={t.weather.locationGroupAria}
      >
        <button
          type="button"
          onClick={load}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            selectedSpotId === null &&
              selectedPlace === null &&
              locationLabel === null
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:border-primary/50"
          )}
        >
          <LocateFixed className="h-3.5 w-3.5" aria-hidden="true" />
          {t.weather.myLocation}
        </button>
        {(spots ?? []).map(spot => (
          <button
            key={spot.id}
            type="button"
            onClick={() => selectSpot(spot)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              selectedSpotId === spot.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/50"
            )}
          >
            <Tent className="h-3.5 w-3.5" aria-hidden="true" />
            {spot.name}
          </button>
        ))}
        {places.map(place => {
          const active =
            selectedPlace !== null && isSameWeatherPlace(selectedPlace, place);
          return (
            <span
              key={`${place.name}-${place.lat}-${place.lon}`}
              className={cn(
                "flex items-center overflow-hidden rounded-full border text-xs font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50"
              )}
            >
              <button
                type="button"
                onClick={() => selectPlace(place)}
                className="flex items-center gap-1.5 py-1.5 pl-3 pr-1.5"
              >
                <Star className="h-3.5 w-3.5" aria-hidden="true" />
                {place.name}
              </button>
              <button
                type="button"
                onClick={() => removePlace(place)}
                aria-label={t.weather.placeRemoveAria(place.name)}
                className="py-1.5 pl-1 pr-2.5 opacity-70 transition-opacity hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </span>
          );
        })}
        {tripPlaceSuggestion && (
          <button
            type="button"
            onClick={() => {
              const next = addWeatherPlace(places, tripPlaceSuggestion);
              if (next) savePlaces(next);
            }}
            className="flex items-center gap-1.5 rounded-full border border-dashed border-primary/50 bg-card px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:border-primary"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            {t.weather.tripPlaceSuggest(tripPlaceSuggestion.name)}
          </button>
        )}
        <button
          type="button"
          onClick={() => setPlaceSearchOpen(open => !open)}
          aria-expanded={placeSearchOpen}
          className="flex items-center gap-1.5 rounded-full border border-dashed border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {t.weather.placeAddButton}
        </button>
      </div>

      {/* Ortssuche für neue Wetter-Orte (nur auf Wunsch eingeblendet) */}
      {placeSearchOpen &&
        (places.length >= MAX_WEATHER_PLACES ? (
          <p className="mb-4 text-sm text-muted-foreground">
            {t.weather.placeLimitHint(MAX_WEATHER_PLACES)}
          </p>
        ) : (
          <PlaceSearch
            onPick={pickSearchResult}
            onClose={() => setPlaceSearchOpen(false)}
          />
        ))}

      {(state === "locating" || state === "loading") && (
        <div
          className="space-y-3"
          aria-busy="true"
          aria-label={t.weather.loadingAria}
        >
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      )}

      {state === "error" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertTriangle
              className="h-8 w-8 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={load} className="mt-1">
              <LocateFixed className="mr-2 h-4 w-4" aria-hidden="true" />
              {t.weather.retry}
            </Button>
            <p className="max-w-sm text-xs text-muted-foreground">
              {t.weather.offlineHint}
            </p>
          </CardContent>
        </Card>
      )}

      {state === "ready" && data && (
        <>
          {/* Aktuell */}
          <Card className="mb-4 overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {locationLabel ??
                      (coords
                        ? `${coords.lat.toFixed(3)}°, ${coords.lon.toFixed(3)}°`
                        : "")}{" "}
                    · {t.weather.elevation(Math.round(data.elevation))}
                  </p>
                  <p className="mt-1 font-serif text-4xl font-semibold">
                    {Math.round(data.current.temperatureC)}°
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t.weather.feelsLike(Math.round(data.current.apparentC))} ·{" "}
                    {describeWeatherCode(data.current.weatherCode, lang).label}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <WeatherIcon
                    code={data.current.weatherCode}
                    className="h-14 w-14 text-primary"
                  />
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Wind className="h-3.5 w-3.5" aria-hidden="true" />
                    {Math.round(data.current.windKmh)} km/h
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sunrise
                    className="h-4 w-4 text-chart-4"
                    aria-hidden="true"
                  />
                  {new Date(data.daily[0].sunrise).toLocaleTimeString(
                    LOCALE_TAGS[lang],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                  <Sunset
                    className="ml-3 h-4 w-4 text-chart-1"
                    aria-hidden="true"
                  />
                  {new Date(data.daily[0].sunset).toLocaleTimeString(
                    LOCALE_TAGS[lang],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={load}
                  aria-label={t.weather.refreshAria}
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Regen-Kurzfrist: dezente Zeile, nur wenn in den nächsten 2 h
              Regen beginnt oder aufhört (15-Minuten-Prognose) */}
          {rainNotice && (
            <p
              role="status"
              aria-label={t.weather.rainSoonAria}
              className="mb-4 flex items-center gap-2 rounded-xl border border-chart-2/40 bg-chart-2/10 px-4 py-2.5 text-sm"
            >
              <CloudRain
                className="h-4 w-4 shrink-0 text-chart-2"
                aria-hidden="true"
              />
              {rainNotice.kind === "start"
                ? t.weather.rainStartsAt(
                    rainNotice.time.toLocaleTimeString(LOCALE_TAGS[lang], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  )
                : t.weather.rainEndsAt(
                    rainNotice.time.toLocaleTimeString(LOCALE_TAGS[lang], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  )}
            </p>
          )}

          {/* Luftdruck-Trend: dezenter Frühindikator bei fallendem Druck */}
          {pressureNotice && (
            <p
              role="status"
              aria-label={t.weather.pressureAria}
              className="mb-4 flex items-center gap-2 rounded-xl border border-chart-4/40 bg-chart-4/10 px-4 py-2.5 text-sm"
            >
              <TrendingDown
                className="h-4 w-4 shrink-0 text-chart-4"
                aria-hidden="true"
              />
              {pressureNotice.strong
                ? t.weather.pressureFallingStrong(pressureNotice.hPa)
                : t.weather.pressureFalling(pressureNotice.hPa)}
            </p>
          )}

          {/* Warnungen – Anker für das Unwetter-Badge der Startseite */}
          <section
            id="warnungen"
            aria-label={t.weather.alertsAria}
            className="mb-6 scroll-mt-20 space-y-2.5"
          >
            {/* Amtliche Warnungen zuoberst: Wenn MeteoSchweiz etwas
                ausgibt, ist das die Nachricht – der selbst gerechnete
                Windwert daneben ist die Ergänzung. */}
            {coords && (
              <OfficialWarnings latitude={coords.lat} longitude={coords.lon} />
            )}
            {alerts.length === 0 ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
                <Info
                  className="h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                {t.weather.noAlerts}
              </div>
            ) : (
              alerts.map(alert => (
                <div
                  key={alert.id}
                  className={cn(
                    "rounded-xl border px-4 py-3",
                    severityStyles[alert.severity]
                  )}
                  role={alert.severity === "gefahr" ? "alert" : undefined}
                >
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <AlertTriangle
                      className="h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    {alert.title}
                    <span className="ml-auto rounded-full bg-background/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                      {t.weather.severity[alert.severity]}
                    </span>
                  </p>
                  <p className="mt-1 text-sm">{alert.description}</p>
                  <p className="mt-1.5 text-xs opacity-90">{alert.advice}</p>
                </div>
              ))
            )}
          </section>

          {/* «Deine Plätze»: Warnungs-Übersicht für Zeltplätze + Heim-Ort */}
          {isAuthenticated && (
            <YourPlacesSection spots={spots} onSelect={selectOverviewPlace} />
          )}

          {/* Waldbrandgefahr (nur Schweiz) */}
          {fireDanger && (
            <section aria-label={t.weather.fireAria} className="mb-6">
              <div
                className={cn(
                  "rounded-xl border px-4 py-3",
                  fireLevelStyles[fireDanger.level]
                )}
                role={fireDanger.level >= 4 ? "alert" : undefined}
              >
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Flame className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {t.weather.fireTitle(
                    describeFireDanger(fireDanger.level, lang).title
                  )}
                  <span className="ml-auto rounded-full bg-background/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                    {t.weather.fireLevelBadge(fireDanger.level)}
                  </span>
                </p>
                <p className="mt-1 text-sm">
                  {fireDanger.regionName}
                  {fireDanger.validFrom &&
                    ` · ${t.weather.fireValidFrom(fireDanger.validFrom)}`}
                </p>
                <p className="mt-1.5 text-xs opacity-90">
                  {describeFireDanger(fireDanger.level, lang).advice}
                </p>
                <p className="mt-1.5 text-xs opacity-75">
                  {t.weather.fireSourcePrefix}
                  <a
                    href="https://www.waldbrandgefahr.ch"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium underline"
                  >
                    waldbrandgefahr.ch
                  </a>
                  .
                </p>
              </div>
            </section>
          )}

          {/* Feuerverbote nach Kanton (#263) – Ergänzung zur Stufe oben */}
          <FireBanOverview />

          {/* UV-Index: heutiges Maximum mit WHO-Stufe und Schutzhinweis ab «hoch» */}
          {uvInfo && uvToday !== null && (
            <section aria-label={t.weather.uvAria} className="mb-6">
              <div
                className={cn(
                  "rounded-xl border px-4 py-3",
                  uvLevelStyles[uvInfo.level]
                )}
              >
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Sun className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {t.weather.uvTitle}
                  <span className="ml-auto rounded-full bg-background/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                    {uvInfo.label}
                  </span>
                </p>
                <p className="mt-1 text-sm">
                  {t.weather.uvTodayMax(Math.round(uvToday))}
                </p>
                {uvInfo.advice && (
                  <p className="mt-1.5 text-xs opacity-90">{uvInfo.advice}</p>
                )}
                {/* Sonnencreme & Trinken (#260/#261): konkrete Zahlen zum
                    heutigen Tag – dieselbe Rechnung wie in der Erinnerung */}
                {heatToday && (
                  <p className="mt-1.5 text-xs font-medium">
                    {heatToday.sunscreen &&
                      t.weather.heatSunscreen(
                        heatToday.reapplyMinutes,
                        heatToday.burnMinutes
                      )}
                    {heatToday.sunscreen && heatToday.hydration && " · "}
                    {heatToday.hydration &&
                      t.weather.heatDrink(
                        heatToday.litersPerAdult
                          .toFixed(1)
                          .replace(".", decimalSeparator)
                      )}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Stechmücken-Index (#262): Abendwerte am gewählten Ort */}
          {mosquitoTonight && (
            <section aria-label={t.weather.mosquitoAria} className="mb-6">
              <div className="rounded-xl border border-border bg-card px-4 py-3">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Bug
                    className="h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  {t.weather.mosquitoTitle}
                  <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent-foreground">
                    {mosquitoLevelLabel(mosquitoTonight.level, lang)}
                  </span>
                </p>
                <div
                  className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
                  role="img"
                  aria-label={t.weather.mosquitoBarAria(mosquitoTonight.score)}
                >
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      mosquitoTonight.score >= 78
                        ? "bg-destructive"
                        : mosquitoTonight.score >= 55
                          ? "bg-amber-500"
                          : "bg-primary"
                    )}
                    style={{ width: `${mosquitoTonight.score}%` }}
                  />
                </div>
                <p className="mt-1.5 text-sm">
                  {mosquitoAdvice(mosquitoTonight.level, lang)}
                </p>
                {mosquitoTonight.limitingFactor && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.weather.mosquitoLimiting[mosquitoTonight.limitingFactor]}
                  </p>
                )}
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {t.weather.mosquitoHint}
                </p>
              </div>
            </section>
          )}

          {/* Wolken-Lexikon (#264): Der Blick nach oben ergänzt die Prognose */}
          <Link
            href="/wolken"
            className="mb-6 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-all hover:border-primary/40 hover:shadow-md"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Cloudy className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">
                {t.clouds.title}
              </span>
              <span className="block text-xs text-muted-foreground">
                {t.weather.cloudLexiconHint}
              </span>
            </span>
          </Link>

          {/* Pollenflug: aktuelle Belastung pro Art (eigener Ladezustand) */}
          {pollen.status !== "idle" && (
            <section aria-label={t.weather.pollenAria} className="mb-6">
              <h2 className="mb-2.5 font-serif text-lg font-semibold">
                {t.weather.pollenTitle}
              </h2>
              <Card>
                <CardContent className="pt-5">
                  {pollen.status === "loading" && (
                    <div
                      aria-busy="true"
                      aria-label={t.weather.pollenLoadingAria}
                    >
                      <Skeleton className="h-9 w-full rounded-lg" />
                    </div>
                  )}
                  {pollen.status === "error" && (
                    <p className="text-sm text-muted-foreground">
                      {t.weather.pollenUnavailable}
                    </p>
                  )}
                  {pollen.status === "empty" && (
                    <p className="text-sm text-muted-foreground">
                      {t.weather.pollenNoData}
                    </p>
                  )}
                  {pollen.status === "ready" && (
                    <>
                      <ul
                        className="flex flex-wrap gap-2"
                        aria-label={t.weather.pollenListAria}
                      >
                        {visiblePollenReadings.map(r => {
                          const mine = pollenProfile.includes(r.type);
                          return (
                            <li key={r.type}>
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium",
                                  pollenLevelStyles[r.level],
                                  mine && "ring-2 ring-primary/60"
                                )}
                              >
                                <Flower2
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                                {pollenTypeName(r.type, lang)}
                                {mine && (
                                  <span className="sr-only">
                                    {t.weather.pollenMineSr}
                                  </span>
                                )}
                                <span className="rounded-full bg-background/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                                  {describePollenLevel(r.level, lang)}
                                </span>
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                      {pollenProfile.length > 0 && (
                        <div className="mt-3 flex items-center gap-2">
                          <Switch
                            id="pollen-only-mine"
                            checked={onlyMyPollen}
                            onCheckedChange={setOnlyMyPollen}
                          />
                          <Label
                            htmlFor="pollen-only-mine"
                            className="text-xs font-normal text-muted-foreground"
                          >
                            {t.weather.pollenOnlyMine}
                          </Label>
                        </div>
                      )}
                      <div className="mt-3 border-t border-border/60 pt-3">
                        <p className="text-xs font-medium">
                          {t.weather.pollenProfileTitle}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {t.weather.pollenProfileIntro}
                        </p>
                        <div
                          className="mt-2 flex flex-wrap gap-2"
                          role="group"
                          aria-label={t.weather.pollenProfileTitle}
                        >
                          {POLLEN_TYPES.map(type => {
                            const active = pollenProfile.includes(type);
                            return (
                              <button
                                key={type}
                                type="button"
                                aria-pressed={active}
                                onClick={() => togglePollenProfileType(type)}
                                className={cn(
                                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                                  active
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-card text-muted-foreground hover:border-primary/50"
                                )}
                              >
                                {pollenTypeName(type, lang)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">
                        {t.weather.pollenSource}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </section>
          )}

          {/* Stundenverlauf */}
          <h2 className="mb-2.5 font-serif text-lg font-semibold">
            {t.weather.next24}
          </h2>
          <div className="mb-6 overflow-x-auto rounded-xl border border-border/70 bg-card">
            <div className="flex min-w-max gap-0 px-2 py-3">
              {next24.map(h => (
                <div
                  key={h.time}
                  className="flex w-16 shrink-0 flex-col items-center gap-1 text-center"
                >
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(h.time).getHours()}:00
                  </p>
                  <WeatherIcon
                    code={h.weatherCode}
                    className="h-5 w-5 text-primary"
                  />
                  <p className="text-sm font-semibold">
                    {Math.round(h.temperatureC)}°
                  </p>
                  <p className="flex items-center gap-0.5 text-[10px] text-chart-2">
                    <Droplets className="h-3 w-3" aria-hidden="true" />
                    {Math.round(h.precipitationProbability)}%
                  </p>
                  <p className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <Wind className="h-3 w-3" aria-hidden="true" />
                    {Math.round(h.windGustsKmh)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Niederschlags-Grafik: wann genau kommt der Regen? */}
          <h2 className="mb-2.5 font-serif text-lg font-semibold">
            {t.weather.rain48}
          </h2>
          <Card className="mb-6">
            <CardContent className="pt-5">
              <div className="h-44 w-full">
                <Suspense fallback={null}>
                  <RainChart
                    data={rainData}
                    labels={{
                      rain: t.weather.chartRain,
                      prob: t.weather.chartProb,
                      hour: t.weather.chartTooltipHour,
                    }}
                  />
                </Suspense>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t.weather.chartLegend}
              </p>
            </CardContent>
          </Card>

          {/* Frost & Schneefallgrenze (#428/#429): melden sich nur,
              wenn eine der beiden Zahlen betrifft. */}
          <WinterCard days={data.daily} hours={data.hourly} className="mb-4" />

          {/* Luftqualität (#565): EAQI-Ampel mit Feinstaub und Ozon –
              die Ergänzung zu UV und Pollen. */}
          {coords && (
            <AirQualityCard
              latitude={coords.lat}
              longitude={coords.lon}
              className="mb-4"
            />
          )}

          {/* Wetterumschwung (#417): «Morgen kippt das Wetter» – nur,
              wenn morgen deutlich schlechter wird als heute. */}
          <WeatherTurnCard
            turn={weatherTurn(data.daily[0], data.daily[1])}
            className="mb-4"
          />

          {/* Tau in der Nacht (#397): erscheint nur, wenn das Zelt nass zu
              werden droht – ein tägliches «bleibt trocken» wäre eine
              Zusage, die die Prognose nicht geben kann. */}
          <CondensationCard hours={data.hourly} className="mb-4" />

          {/* Trockenes Zeitfenster (#384): Die Stundendaten liegen ohnehin
              vor; hier beantworten sie die Frage «wann baue ich ab?»
              statt nur eine Tabelle zu füllen. */}
          <DryWindowCard hours={data.hourly} className="mb-4" />

          {/* Regenradar: Leaflet-Karte mit RainViewer-Animation, lädt erst beim Aufklappen */}
          {coords && (
            <RainRadar
              key={`${coords.lat.toFixed(3)},${coords.lon.toFixed(3)}`}
              lat={coords.lat}
              lon={coords.lon}
            />
          )}

          {/* 7-Tage */}
          <h2 className="mb-2.5 font-serif text-lg font-semibold">
            {t.weather.forecast7}
          </h2>
          <Card>
            <CardContent className="divide-y divide-border/60 pt-2">
              {data.daily.slice(0, 7).map((d, i) => {
                const dayLabel =
                  i === 0
                    ? t.common.today
                    : fmtWeekdayDay(new Date(d.date), lang);
                const isOpen = openDay === d.date;
                return (
                  <div key={d.date}>
                    <button
                      type="button"
                      onClick={() => setOpenDay(isOpen ? null : d.date)}
                      aria-expanded={isOpen}
                      aria-controls={`day-hours-${d.date}`}
                      aria-label={t.weather.dayToggleAria(dayLabel)}
                      className="flex w-full items-center gap-3 py-2.5 text-left"
                    >
                      <p className="w-16 text-sm font-medium">{dayLabel}</p>
                      <WeatherIcon
                        code={d.weatherCode}
                        className="h-5 w-5 shrink-0 text-primary"
                      />
                      <p className="flex w-14 items-center gap-1 text-xs text-chart-2">
                        <Droplets
                          className="h-3 w-3 shrink-0"
                          aria-hidden="true"
                        />
                        {Math.round(d.precipitationProbabilityMax)}%
                      </p>
                      <p className="hidden w-16 items-center gap-1 text-xs text-muted-foreground sm:flex">
                        <Wind className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {Math.round(d.windGustsMaxKmh)} km/h
                      </p>
                      <p className="ml-auto text-sm">
                        <span className="font-semibold">
                          {Math.round(d.tempMaxC)}°
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          / {Math.round(d.tempMinC)}°
                        </span>
                      </p>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                          isOpen && "rotate-180"
                        )}
                        aria-hidden="true"
                      />
                    </button>
                    {isOpen && (
                      <div id={`day-hours-${d.date}`} className="pb-3">
                        {openDayHours.length > 0 ? (
                          <>
                            <div className="h-40 w-full">
                              <Suspense fallback={null}>
                                <DayHoursChart
                                  data={openDayHours}
                                  labels={{
                                    rain: t.weather.chartRain,
                                    temp: t.weather.chartTemp,
                                  }}
                                />
                              </Suspense>
                            </div>
                            <p className="mt-1.5 text-xs text-muted-foreground">
                              {t.weather.hourlyLegend}
                            </p>
                            <DayWindRow hours={openDayHours} />
                            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <Wind
                                className="h-3 w-3 shrink-0"
                                aria-hidden="true"
                              />
                              {t.weather.dayWindPeak(
                                Math.round(d.windGustsMaxKmh)
                              )}
                              {openDayHours.length > 0 && (
                                <span className="text-muted-foreground">
                                  {" · "}
                                  {t.weather.dayFeelsLike(
                                    Math.round(
                                      Math.max(
                                        ...openDayHours.map(h => h.apparentC)
                                      )
                                    )
                                  )}
                                </span>
                              )}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {t.weather.dayHoursEmpty}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Wetterfenster (#538): Welches Wochenende taugt fürs Rausgehen?
              Bewertet aus der ohnehin geladenen 16-Tage-Prognose. */}
          {(() => {
            const windows = weekendWindows(data.daily, todayIsoForTrips);
            if (windows.length === 0) return null;
            return (
              <section aria-label={t.weather.windowTitle} className="mt-6">
                <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <h2 className="font-serif text-lg font-semibold">
                    {t.weather.windowTitle}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {t.weather.windowHint}
                  </p>
                </div>
                <Card>
                  <CardContent className="divide-y divide-border/60 pt-2">
                    {windows.map(w => (
                      <div
                        key={w.saturday.date}
                        className="flex items-center gap-3 py-2.5"
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "h-2.5 w-2.5 shrink-0 rounded-full",
                            w.verdict === "top"
                              ? "bg-primary"
                              : w.verdict === "ok"
                                ? "bg-amber-500"
                                : "bg-destructive/70"
                          )}
                        />
                        <span className="min-w-0 flex-1 text-sm font-medium">
                          {t.weather.windowWeekend(
                            fmtShort(
                              new Date(`${w.saturday.date}T00:00:00`),
                              lang
                            ),
                            fmtShort(
                              new Date(`${w.sunday.date}T00:00:00`),
                              lang
                            )
                          )}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {t.weather.windowSummary(w.tempMaxC, w.rainMm)}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                            w.verdict === "top"
                              ? "bg-primary/15 text-primary"
                              : w.verdict === "ok"
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-500"
                                : "bg-destructive/10 text-destructive"
                          )}
                        >
                          {t.weather.windowVerdicts[w.verdict]}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </section>
            );
          })()}

          {/* Woche 2: kompakter Ausblick ohne Stunden-Detail – die Prognose
              ist so weit voraus deutlich unsicherer, daher der Hinweis. */}
          {data.daily.length > 7 && (
            <section aria-label={t.weather.week2Aria} className="mt-6">
              <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <h2 className="font-serif text-lg font-semibold">
                  {t.weather.week2Title}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t.weather.week2Hint}
                </p>
              </div>
              <Card>
                <CardContent className="divide-y divide-border/60 pt-2">
                  {data.daily.slice(7).map(d => (
                    <div key={d.date} className="flex items-center gap-3 py-2">
                      <p className="w-16 text-sm font-medium">
                        {fmtWeekdayDay(new Date(d.date), lang)}
                      </p>
                      <WeatherIcon
                        code={d.weatherCode}
                        className="h-5 w-5 shrink-0 text-primary"
                      />
                      <span className="sr-only">
                        {describeWeatherCode(d.weatherCode, lang).label}
                      </span>
                      <p className="flex w-14 items-center gap-1 text-xs text-chart-2">
                        <Droplets
                          className="h-3 w-3 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="sr-only">
                          {t.weather.compareSrRain}:{" "}
                        </span>
                        {Math.round(d.precipitationProbabilityMax)}%
                      </p>
                      <p className="ml-auto text-sm">
                        <span className="font-semibold">
                          {Math.round(d.tempMaxC)}°
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          / {Math.round(d.tempMinC)}°
                        </span>
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          )}

          {/* Orte vergleichen: 7-Tage-Prognosen zweier Orte nebeneinander */}
          {compareOpen ? (
            <CompareSection
              baseLabel={locationLabel ?? t.weather.myLocation}
              baseDaily={data.daily.slice(0, 7)}
              spots={spots}
              onClose={() => setCompareOpen(false)}
            />
          ) : (
            <Button
              variant="outline"
              className="mt-4 w-full sm:w-auto"
              onClick={() => setCompareOpen(true)}
            >
              <ArrowLeftRight className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.weather.compareButton}
            </Button>
          )}

          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            {t.weather.dataSource}
          </p>
        </>
      )}
    </div>
  );
}
