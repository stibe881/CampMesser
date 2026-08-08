/**
 * «Wohin am Wochenende?» (#383).
 *
 * DIE FRAGE, DIE NICHTS BEANTWORTET HAT: Es gibt Favoriten, und für
 * jeden gibt es eine Prognose – aber um zu wissen, wo am Samstag die
 * Sonne scheint, musste man zwölf Dossiers nacheinander aufmachen. Also
 * fährt man dorthin, wo man immer hinfährt, und steht im Regen, während
 * es zwanzig Kilometer weiter trocken ist.
 *
 * ERST AUF KLICK. Die Prognose für zwölf Plätze ist eine Abfrage gegen
 * einen fremden, kostenlosen Dienst; sie beim Seitenaufbau zu holen
 * wäre unhöflich und auf dem Telefon langsam. Die Fahrzeiten kommen
 * noch einmal getrennt und nur, wenn ein Zuhause hinterlegt ist.
 *
 * DIE NOTE IST AUFGESCHLÜSSELT. Wer eine Rangliste sieht, will wissen,
 * warum etwas oben steht – sonst glaubt er ihr nicht und rechnet doch
 * selbst nach. Trocken, warm und windstill stehen deshalb einzeln
 * daneben; die Begründung der Gewichte steht in `shared/spotPick.ts`.
 *
 * DIE FAHRZEIT IST NICHT TEIL DER NOTE. Sie steht daneben und man kann
 * danach sortieren. Stunden und Grad in eine Zahl zu mischen hiesse, für
 * jemanden zu entscheiden, was ihm eine Stunde Fahrt wert ist.
 */
import { useState } from "react";
import { CloudSun, Loader2, Car, Thermometer, Wind } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { useTodayIso } from "@/lib/useTodayIso";
import { fetchSpotForecasts, MAX_FORECAST_SPOTS } from "@/lib/spotForecasts";
import { fetchPlaceDurations } from "@/lib/routing";
import {
  daysInRange,
  formatTravel,
  nextWeekend,
  rankSpots,
  type PickDay,
  type PickSort,
} from "@shared/spotPick";
import { cn } from "@/lib/utils";

interface SpotLike {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

/** Wie weit die Prognose reicht, damit das nächste Wochenende sicher drin liegt. */
const FORECAST_DAYS = 10;

export default function WeekendPicker({ spots }: { spots: SpotLike[] }) {
  const t = useT();
  const wp = t.weekendPicker;
  const today = useTodayIso();
  const [open, setOpen] = useState(false);
  const [sort, setSort] = useState<PickSort>("weather");
  const [forecasts, setForecasts] = useState<Map<number, PickDay[]> | null>(
    null
  );
  const [travel, setTravel] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const homeQuery = trpc.home.get.useQuery(undefined, { enabled: open });
  const weekend = nextWeekend(today);
  const considered = spots.slice(0, MAX_FORECAST_SPOTS);

  const load = async () => {
    setOpen(true);
    if (forecasts || loading) return;
    setLoading(true);
    setFailed(false);
    try {
      setForecasts(await fetchSpotForecasts(considered, FORECAST_DAYS));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fahrzeiten getrennt und erst auf Wunsch: ein zweiter fremder Dienst,
   * und ohne hinterlegtes Zuhause gibt es nichts zu rechnen.
   */
  const loadTravel = async () => {
    const home = homeQuery.data;
    if (!home) return;
    const times = await fetchPlaceDurations(
      { lat: home.latitude, lon: home.longitude },
      considered.map(s => ({
        id: String(s.id),
        lat: s.latitude,
        lon: s.longitude,
      })),
      "car"
    );
    const mapped = new Map<number, number>();
    times.forEach((seconds, id) => mapped.set(Number(id), seconds));
    setTravel(mapped);
    setSort("travel");
  };

  const ranked = rankSpots(
    considered.map(spot => ({
      spot,
      days: daysInRange(
        forecasts?.get(spot.id) ?? [],
        weekend.from,
        weekend.to
      ),
      travelSeconds: travel.get(spot.id) ?? null,
    })),
    sort
  );

  if (spots.length < 2) return null;

  return (
    <div className="mb-4 rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium">
          <CloudSun className="h-4 w-4 text-primary" aria-hidden="true" />
          {wp.title}
        </p>
        {!open && (
          <Button type="button" size="sm" variant="outline" onClick={load}>
            {wp.show}
          </Button>
        )}
      </div>

      {open && (
        <>
          <p className="mt-1 text-xs text-muted-foreground">
            {wp.range(weekend.from, weekend.to)}
          </p>

          {loading && (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t.common.loading}
            </p>
          )}
          {failed && (
            <p className="mt-3 text-sm text-muted-foreground">{wp.failed}</p>
          )}

          {forecasts && !loading && (
            <>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant={sort === "weather" ? "default" : "outline"}
                  onClick={() => setSort("weather")}
                >
                  {wp.sortWeather}
                </Button>
                {homeQuery.data && (
                  <Button
                    type="button"
                    size="sm"
                    variant={sort === "travel" ? "default" : "outline"}
                    onClick={() =>
                      travel.size > 0 ? setSort("travel") : void loadTravel()
                    }
                  >
                    <Car className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                    {wp.sortTravel}
                  </Button>
                )}
              </div>

              <ol className="mt-3 space-y-1.5">
                {ranked.map((entry, index) => (
                  <li key={entry.spot.id}>
                    <Link
                      href={`/zeltplaetze/${entry.spot.id}`}
                      className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent"
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold",
                          index === 0 && entry.score
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent"
                        )}
                      >
                        {entry.score ? entry.score.total : "–"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {entry.spot.name}
                        </span>
                        {entry.score ? (
                          <span className="flex flex-wrap items-center gap-x-2.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CloudSun
                                className="h-3 w-3"
                                aria-hidden="true"
                              />
                              {wp.dry(entry.score.dry)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Thermometer
                                className="h-3 w-3"
                                aria-hidden="true"
                              />
                              {wp.warmth(entry.score.warmth)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Wind className="h-3 w-3" aria-hidden="true" />
                              {wp.wind(entry.score.wind)}
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {wp.noForecast}
                          </span>
                        )}
                      </span>
                      {formatTravel(entry.travelSeconds) && (
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">
                          {formatTravel(entry.travelSeconds)}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ol>

              {spots.length > MAX_FORECAST_SPOTS && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {wp.capped(MAX_FORECAST_SPOTS, spots.length)}
                </p>
              )}
              <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                {wp.note}
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
