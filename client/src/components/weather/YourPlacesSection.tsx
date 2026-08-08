/**
 * «Deine Plätze» (#169/#438, aus Weather.tsx herausgelöst): prüft für
 * gespeicherte Zeltplätze und den Heim-Ort parallel die aktuellen
 * Unwetterwarnungen – geladen wird erst beim Aufklappen.
 */
import { useEffect, useState } from "react";
import { CheckCircle2, ChevronDown, Home, Tent } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { fetchWeather } from "@/lib/weatherFetch";
import { severityStyles } from "@/components/weather/weatherStyles";
import { detectAlerts, type HourlyWeather } from "@shared/weather";

/** Obergrenze paralleler Warn-Prüfungen in «Deine Plätze». */
const MAX_PLACE_CHECKS = 8;

/**
 * Sitzungs-Cache der Stundenprognosen pro Koordinate: die Übersicht lädt
 * jeden Ort höchstens einmal pro Seitenaufruf, egal wie oft sie auf- und
 * zugeklappt wird. Warnungen werden beim Rendern sprachrichtig abgeleitet.
 */
const placeHoursCache = new Map<string, HourlyWeather[]>();

interface PlaceCheck {
  key: string;
  name: string;
  lat: number;
  lon: number;
  /** null = Heim-Ort, sonst ID des Zeltplatz-Favoriten */
  spotId: number | null;
  /** null = Abruf fehlgeschlagen */
  hours: HourlyWeather[] | null;
}

/**
 * «Deine Plätze»: prüft für gespeicherte Zeltplätze und den Heim-Ort
 * parallel die aktuellen Unwetterwarnungen – geladen wird erst beim
 * Aufklappen, begrenzt auf MAX_PLACE_CHECKS Orte. Ein Klick auf eine
 * Zeile wählt den Ort in der Hauptansicht aus.
 */
export default function YourPlacesSection({
  spots,
  onSelect,
}: {
  spots:
    | { id: number; name: string; latitude: number; longitude: number }[]
    | undefined;
  onSelect: (place: {
    name: string;
    lat: number;
    lon: number;
    spotId: number | null;
  }) => void;
}) {
  const { lang, t } = useI18n();
  const [open, setOpen] = useState(false);
  // Heim-Ort erst beim Aufklappen abfragen – vorher braucht ihn niemand
  const homeQuery = trpc.home.get.useQuery(undefined, { enabled: open });
  const homeSettled = homeQuery.isSuccess || homeQuery.isError;
  const home = homeQuery.data ?? null;
  const [checks, setChecks] = useState<PlaceCheck[] | null>(null);

  useEffect(() => {
    if (!open || !homeSettled) return;
    const list: Omit<PlaceCheck, "hours">[] = [];
    if (home) {
      list.push({
        key: "home",
        name: home.name,
        lat: home.latitude,
        lon: home.longitude,
        spotId: null,
      });
    }
    (spots ?? []).forEach(spot => {
      if (Number.isFinite(spot.latitude) && Number.isFinite(spot.longitude)) {
        list.push({
          key: `spot-${spot.id}`,
          name: spot.name,
          lat: spot.latitude,
          lon: spot.longitude,
          spotId: spot.id,
        });
      }
    });
    const limited = list.slice(0, MAX_PLACE_CHECKS);
    let cancelled = false;
    setChecks(null);
    void Promise.all(
      limited.map(async place => {
        const cacheKey = `${place.lat.toFixed(4)},${place.lon.toFixed(4)}`;
        const cached = placeHoursCache.get(cacheKey);
        if (cached) return { ...place, hours: cached };
        try {
          const data = await fetchWeather(place.lat, place.lon);
          placeHoursCache.set(cacheKey, data.hourly);
          return { ...place, hours: data.hourly };
        } catch {
          return { ...place, hours: null };
        }
      })
    ).then(results => {
      if (!cancelled) setChecks(results);
    });
    return () => {
      cancelled = true;
    };
  }, [open, homeSettled, home, spots]);

  return (
    <section aria-label={t.weather.placesAria} className="mb-6">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="mb-2.5 flex w-full items-center justify-between gap-2 text-left"
      >
        <h2 className="font-serif text-lg font-semibold">
          {t.weather.placesTitle}
        </h2>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
      {open && (
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">
              {t.weather.placesIntro}
            </p>
            {!homeSettled || checks === null ? (
              <div
                className="mt-3 space-y-2"
                aria-busy="true"
                aria-label={t.weather.placesLoadingAria}
              >
                <Skeleton className="h-9 w-full rounded-lg" />
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            ) : checks.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {t.weather.placesEmpty}
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-border/60">
                {checks.map(place => {
                  const alerts = place.hours
                    ? detectAlerts(place.hours, lang)
                    : null;
                  const PlaceIcon = place.spotId !== null ? Tent : Home;
                  return (
                    <li key={place.key}>
                      <button
                        type="button"
                        onClick={() => onSelect(place)}
                        aria-label={t.weather.placesSelectAria(place.name)}
                        className="flex w-full flex-wrap items-center gap-x-2 gap-y-1.5 py-2.5 text-left text-sm"
                      >
                        <PlaceIcon
                          className="h-4 w-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1 truncate font-medium">
                          {place.name}
                        </span>
                        {alerts === null ? (
                          <span className="text-xs text-muted-foreground">
                            {t.weather.placesCheckFailed}
                          </span>
                        ) : alerts.length === 0 ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-primary">
                            <CheckCircle2
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            {t.weather.placesNoAlert}
                          </span>
                        ) : (
                          <span className="flex flex-wrap items-center gap-1.5">
                            {alerts.map(alert => (
                              <span
                                key={alert.id}
                                className={cn(
                                  "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                                  severityStyles[alert.severity]
                                )}
                              >
                                {alert.title}
                              </span>
                            ))}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </section>
  );
}
