import { useEffect, useMemo, useState } from "react";
import { useParams } from "wouter";
import {
  AlertTriangle,
  Droplets,
  Loader2,
  MapPin,
  Sunrise,
  Tent,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { getSunTimes } from "@/lib/sun";
import { describeWeatherCode } from "@shared/weather";
import { fetchDossierWeather, type DossierWeather } from "@/lib/dossierWeather";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

/**
 * Öffentliche, nur lesende Ansicht eines geteilten Zeltplatzes:
 * Name, Koordinaten, Sonnenzeiten und Wetter – ohne Anmeldung erreichbar.
 */
export default function SharedSpotPage() {
  const { lang } = useI18n();
  const params = useParams<{ token: string }>();
  const spotQuery = trpc.spots.sharedGet.useQuery(
    { token: params.token ?? "" },
    { enabled: Boolean(params.token), retry: false }
  );
  const spot = spotQuery.data;
  const [weather, setWeather] = useState<DossierWeather | null>(null);
  const [weatherFailed, setWeatherFailed] = useState(false);

  useEffect(() => {
    if (!spot) return;
    let cancelled = false;
    fetchDossierWeather(spot.latitude, spot.longitude, lang)
      .then(data => {
        if (!cancelled) setWeather(data);
      })
      .catch(() => {
        if (!cancelled) setWeatherFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [spot, lang]);

  const sun = useMemo(
    () =>
      spot ? getSunTimes(new Date(), spot.latitude, spot.longitude) : null,
    [spot]
  );
  const fmtTime = (d: Date | null) =>
    d
      ? d.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })
      : "–";

  if (spotQuery.isLoading) {
    return (
      <div className="container flex justify-center py-16">
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          aria-label="Lädt"
        />
      </div>
    );
  }

  if (!spot) {
    return (
      <div className="container max-w-xl py-16 text-center">
        <Tent
          className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50"
          aria-hidden="true"
        />
        <p className="font-medium">Dieser Teil-Link ist nicht mehr gültig.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Die Besitzerin oder der Besitzer hat das Teilen beendet.
        </p>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-6">
      <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
        <Tent className="h-3.5 w-3.5" aria-hidden="true" />
        Geteilter Zeltplatz
      </p>
      <h1 className="font-serif text-2xl font-bold md:text-3xl">{spot.name}</h1>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
        {spot.latitude.toFixed(4)}°, {spot.longitude.toFixed(4)}°
      </p>
      {spot.note && (
        <p className="mt-2 text-sm text-muted-foreground">{spot.note}</p>
      )}

      {/* Sonne heute */}
      <Card className="mb-4 mt-5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sunrise className="h-4 w-4 text-chart-4" aria-hidden="true" />
            Sonne heute
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-accent/50 py-2.5">
              <p className="font-mono text-lg font-bold">
                {fmtTime(sun?.sunrise ?? null)}
              </p>
              <p className="text-xs text-muted-foreground">Aufgang</p>
            </div>
            <div className="rounded-lg bg-accent/50 py-2.5">
              <p className="font-mono text-lg font-bold">
                {fmtTime(sun?.solarNoon ?? null)}
              </p>
              <p className="text-xs text-muted-foreground">Höchststand</p>
            </div>
            <div className="rounded-lg bg-accent/50 py-2.5">
              <p className="font-mono text-lg font-bold">
                {fmtTime(sun?.sunset ?? null)}
              </p>
              <p className="text-xs text-muted-foreground">Untergang</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wetter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Droplets className="h-4 w-4 text-chart-2" aria-hidden="true" />
            Wetter-Vorschau
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weatherFailed && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              Wetter konnte nicht geladen werden.
            </p>
          )}
          {!weather && !weatherFailed && (
            <Skeleton className="h-24 w-full rounded-lg" />
          )}
          {weather && (
            <>
              {weather.alerts.length > 0 ? (
                <p
                  className={cn(
                    "mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                    weather.alerts[0].severity === "gefahr"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-chart-4/15"
                  )}
                >
                  <AlertTriangle
                    className="h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  {weather.alerts[0].title}
                  {weather.alerts.length > 1 &&
                    ` (+${weather.alerts.length - 1} weitere)`}
                </p>
              ) : (
                <p className="mb-3 text-sm text-muted-foreground">
                  Keine Unwetterwarnungen in den nächsten 48 Stunden.
                </p>
              )}
              <div className="divide-y divide-border/60">
                {weather.daily.map((d, i) => (
                  <div
                    key={d.date}
                    className="flex items-center gap-3 py-2 text-sm"
                  >
                    <span className="w-16 font-medium">
                      {i === 0
                        ? "Heute"
                        : new Date(d.date).toLocaleDateString("de-CH", {
                            weekday: "short",
                            day: "numeric",
                          })}
                    </span>
                    <span className="flex-1 text-muted-foreground">
                      {describeWeatherCode(d.weatherCode, lang).label}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-chart-2">
                      <Droplets className="h-3 w-3" aria-hidden="true" />
                      {Math.round(d.precipProbability)} %
                    </span>
                    <span>
                      <span className="font-semibold">
                        {Math.round(d.tempMaxC)}°
                      </span>
                      <span className="text-muted-foreground">
                        {" "}
                        / {Math.round(d.tempMinC)}°
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        Geteilt mit CampMesser – dem Schweizer Taschenmesser fürs Zelt-Camping.
      </p>
    </div>
  );
}
