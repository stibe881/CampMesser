/**
 * «Orte vergleichen» (#71/#438, aus Weather.tsx herausgelöst): zweiter
 * Ort per Ortssuche oder gespeichertem Zeltplatz, dann beide
 * 7-Tage-Prognosen nebeneinander. Der Vergleichsort bleibt in
 * localStorage gemerkt.
 */
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Droplets,
  MapPin,
  Search,
  Tent,
  Wind,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtWeekdayDay } from "@/lib/dateFormat";
import { useI18n } from "@/i18n";
import { searchPlaces, type PlaceResult } from "@/lib/placeSearch";
import { fetchWeather } from "@/lib/weatherFetch";
import WeatherIcon from "@/components/weather/WeatherIcon";
import { describeWeatherCode, type DailyWeather } from "@shared/weather";

/** Zweiter Ort für den Wetter-Vergleich – wird in localStorage gemerkt. */
interface ComparePlace {
  name: string;
  lat: number;
  lon: number;
}

const COMPARE_STORAGE_KEY = "campmesser.weatherCompareLocation";

function loadStoredComparePlace(): ComparePlace | null {
  try {
    const raw = localStorage.getItem(COMPARE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ComparePlace>;
    if (
      typeof parsed.name === "string" &&
      typeof parsed.lat === "number" &&
      Number.isFinite(parsed.lat) &&
      typeof parsed.lon === "number" &&
      Number.isFinite(parsed.lon)
    ) {
      return { name: parsed.name, lat: parsed.lat, lon: parsed.lon };
    }
  } catch {
    // defekter Eintrag – einfach ignorieren
  }
  return null;
}

function storeComparePlace(place: ComparePlace) {
  try {
    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(place));
  } catch {
    // Speicher voll/blockiert – der Vergleich funktioniert trotzdem
  }
}

/** Kompakte Tageszelle im Vergleich: Icon, Max/Min, Regen, Böen. */
function CompareDayCell({ day }: { day: DailyWeather | undefined }) {
  const { lang, t } = useI18n();
  if (!day) return <p className="text-xs text-muted-foreground">–</p>;
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-1.5">
        <WeatherIcon
          code={day.weatherCode}
          className="h-4 w-4 shrink-0 text-primary"
        />
        <span className="sr-only">
          {describeWeatherCode(day.weatherCode, lang).label}
        </span>
        <span className="whitespace-nowrap">
          <span className="font-semibold">{Math.round(day.tempMaxC)}°</span>
          <span className="text-muted-foreground">
            {" "}
            / {Math.round(day.tempMinC)}°
          </span>
        </span>
      </p>
      <p className="flex items-center gap-1 whitespace-nowrap text-xs text-chart-2">
        <Droplets className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span className="sr-only">{t.weather.compareSrRain}: </span>
        {day.precipitationSumMm.toFixed(1)} mm ·{" "}
        {Math.round(day.precipitationProbabilityMax)} %
      </p>
      <p className="flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground">
        <Wind className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span className="sr-only">{t.weather.compareSrWind}: </span>
        {Math.round(day.windGustsMaxKmh)} km/h
      </p>
    </div>
  );
}

/** Eigener Ladezustand für die Vergleichs-Prognose */
type CompareForecastState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; daily: DailyWeather[] };

/**
 * «Orte vergleichen»: zweiter Ort per Ortssuche oder gespeichertem Zeltplatz,
 * dann beide 7-Tage-Prognosen nebeneinander (Tabelle, mobil 2 Spalten).
 */
export default function CompareSection({
  baseLabel,
  baseDaily,
  spots,
  onClose,
}: {
  baseLabel: string;
  baseDaily: DailyWeather[];
  spots:
    | { id: number; name: string; latitude: number; longitude: number }[]
    | undefined;
  onClose: () => void;
}) {
  const { lang, t } = useI18n();
  const [place, setPlace] = useState<ComparePlace | null>(
    loadStoredComparePlace
  );
  const [editing, setEditing] = useState(place === null);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [results, setResults] = useState<PlaceResult[] | null>(null);
  const [forecast, setForecast] = useState<CompareForecastState>({
    status: "idle",
  });

  // Prognose des Vergleichsorts laden – gleicher Abruf wie die Hauptprognose
  useEffect(() => {
    if (!place) {
      setForecast({ status: "idle" });
      return;
    }
    let cancelled = false;
    setForecast({ status: "loading" });
    fetchWeather(place.lat, place.lon)
      .then(data => {
        if (!cancelled) setForecast({ status: "ready", daily: data.daily });
      })
      .catch(() => {
        if (!cancelled) setForecast({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [place]);

  const selectPlace = (next: ComparePlace) => {
    setPlace(next);
    storeComparePlace(next);
    setEditing(false);
    setQuery("");
    setResults(null);
    setSearchFailed(false);
  };

  const runSearch = async () => {
    const q = query.trim();
    if (q.length < 2 || searching) return;
    setSearching(true);
    setSearchFailed(false);
    setResults(null);
    try {
      setResults(await searchPlaces(q, lang));
    } catch {
      setSearchFailed(true);
    } finally {
      setSearching(false);
    }
  };

  return (
    <section aria-label={t.weather.compareAria} className="mt-6">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h2 className="font-serif text-lg font-semibold">
          {t.weather.compareTitle}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label={t.weather.compareCloseAria}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      <Card>
        <CardContent className="pt-5">
          {editing || !place ? (
            <>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  void runSearch();
                }}
              >
                <Label htmlFor="compare-search">
                  {t.weather.compareSearchLabel}
                </Label>
                <div className="mt-1.5 flex gap-2">
                  <Input
                    id="compare-search"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder={t.weather.compareSearchPlaceholder}
                    autoComplete="off"
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={searching || query.trim().length < 2}
                  >
                    <Search className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    {t.weather.compareSearchButton}
                  </Button>
                </div>
              </form>
              {searching && (
                <div
                  className="mt-3"
                  role="status"
                  aria-busy="true"
                  aria-label={t.weather.compareSearchingAria}
                >
                  <Skeleton className="h-9 w-full rounded-lg" />
                </div>
              )}
              {searchFailed && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {t.weather.compareSearchFailed}
                </p>
              )}
              {!searching && results !== null && results.length === 0 && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {t.weather.compareNoResults}
                </p>
              )}
              {!searching && results !== null && results.length > 0 && (
                <ul
                  aria-label={t.weather.compareResultsAria}
                  className="mt-3 space-y-1.5"
                >
                  {results.map(r => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() =>
                          selectPlace({
                            name: r.name,
                            lat: r.latitude,
                            lon: r.longitude,
                          })
                        }
                        className="flex w-full items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-left text-sm transition-colors hover:border-primary/50"
                      >
                        <MapPin
                          className="h-3.5 w-3.5 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        <span className="font-medium">{r.name}</span>
                        {r.region && (
                          <span className="truncate text-xs text-muted-foreground">
                            {r.region}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {(spots?.length ?? 0) > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground">
                    {t.weather.compareSpotsLabel}
                  </p>
                  <div
                    className="mt-1.5 flex flex-wrap gap-2"
                    role="group"
                    aria-label={t.weather.compareSpotsLabel}
                  >
                    {spots!.map(spot => (
                      <button
                        key={spot.id}
                        type="button"
                        onClick={() =>
                          selectPlace({
                            name: spot.name,
                            lat: spot.latitude,
                            lon: spot.longitude,
                          })
                        }
                        className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50"
                      >
                        <Tent className="h-3.5 w-3.5" aria-hidden="true" />
                        {spot.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="flex min-w-0 items-center gap-1.5 text-sm font-medium">
                  <MapPin
                    className="h-3.5 w-3.5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span className="truncate">{place.name}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="shrink-0 text-xs font-medium text-primary hover:underline"
                >
                  {t.weather.compareChange}
                </button>
              </div>
              {forecast.status === "loading" && (
                <div
                  role="status"
                  aria-busy="true"
                  aria-label={t.weather.compareLoadingAria}
                  className="space-y-2"
                >
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-40 w-full rounded-lg" />
                </div>
              )}
              {forecast.status === "error" && (
                <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  {t.weather.compareLoadFailed}
                  <button
                    type="button"
                    onClick={() => selectPlace(place)}
                    className="font-medium text-primary underline"
                  >
                    {t.weather.retry}
                  </button>
                </p>
              )}
              {forecast.status === "ready" && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <caption className="sr-only">
                      {t.weather.compareCaption(baseLabel, place.name)}
                    </caption>
                    <thead>
                      <tr className="border-b border-border/60 text-left">
                        <th
                          scope="col"
                          className="w-12 py-2 pr-2 text-xs font-medium text-muted-foreground"
                        >
                          {t.weather.compareDayHeader}
                        </th>
                        <th
                          scope="col"
                          className="py-2 pr-3 text-xs font-medium"
                        >
                          {baseLabel}
                        </th>
                        <th scope="col" className="py-2 text-xs font-medium">
                          {place.name}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {baseDaily.map((d, i) => (
                        <tr
                          key={d.date}
                          className="border-b border-border/40 align-top last:border-0"
                        >
                          <th
                            scope="row"
                            className="py-2.5 pr-2 text-left text-xs font-medium"
                          >
                            {i === 0
                              ? t.common.today
                              : fmtWeekdayDay(new Date(d.date), lang)}
                          </th>
                          <td className="py-2.5 pr-3">
                            <CompareDayCell day={d} />
                          </td>
                          <td className="py-2.5">
                            <CompareDayCell
                              day={forecast.daily.find(x => x.date === d.date)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
