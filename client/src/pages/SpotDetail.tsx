import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  Compass,
  Droplets,
  Loader2,
  MapPin,
  Moon,
  Mountain,
  Share2,
  Sunrise,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import LoginPrompt from "@/components/LoginPrompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getSunTimes } from "@/lib/sun";
import { loadObstacleProfiles } from "@/lib/obstacleStore";
import { computeTripStats, tripNights } from "@shared/trips";
import { describeWeatherCode } from "@shared/weather";
import { fetchDossierWeather, type DossierWeather } from "@/lib/dossierWeather";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

// Wetter-Abruf ausgelagert: teilt sich das Dossier mit der öffentlichen
// Teil-Ansicht (/platz/:token)

export default function SpotDetailPage() {
  const { lang } = useI18n();
  const params = useParams<{ id: string }>();
  const spotId = Number(params.id);
  const { isAuthenticated, loading } = useAuth();
  const spotsQuery = trpc.spots.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const [weather, setWeather] = useState<DossierWeather | null>(null);
  const [weatherFailed, setWeatherFailed] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const shareMutation = trpc.spots.share.useMutation();
  const unshareMutation = trpc.spots.unshare.useMutation();

  const spot = spotsQuery.data?.find(s => s.id === spotId);

  useEffect(() => {
    if (!spot) return;
    let cancelled = false;
    setWeatherFailed(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spot?.id, lang]);

  const sun = useMemo(
    () =>
      spot ? getSunTimes(new Date(), spot.latitude, spot.longitude) : null,
    [spot]
  );
  const obstacles = useMemo(
    () => loadObstacleProfiles().spots[String(spotId)] ?? [],
    [spotId]
  );
  const spotTrips = useMemo(
    () => (tripsQuery.data ?? []).filter(t => t.spotId === spotId),
    [tripsQuery.data, spotId]
  );
  const tripStats = useMemo(
    () =>
      computeTripStats(
        spotTrips.map(t => ({
          startDate: t.startDate,
          endDate: t.endDate,
          placeName: "x",
        }))
      ),
    [spotTrips]
  );

  const fmtTime = (d: Date | null) =>
    d
      ? d.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })
      : "–";

  if (loading || (isAuthenticated && spotsQuery.isLoading)) {
    return (
      <div className="container flex justify-center py-16">
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          aria-label="Lädt"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-6">
        <PageHeader
          title="Zeltplatz"
          backHref="/zeltplaetze"
          backLabel="Zeltplätze"
        />
        <LoginPrompt feature="deine Zeltplatz-Favoriten" />
      </div>
    );
  }

  if (!spot) {
    return (
      <div className="container py-6">
        <PageHeader
          title="Zeltplatz nicht gefunden"
          backHref="/zeltplaetze"
          backLabel="Zeltplätze"
        />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader
        title={spot.name}
        backHref="/zeltplaetze"
        backLabel="Zeltplätze"
      />
      <p className="mb-1 flex items-center gap-1.5 text-sm text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
        {spot.latitude.toFixed(4)}°, {spot.longitude.toFixed(4)}°
      </p>
      {spot.note && (
        <p className="mb-4 text-sm text-muted-foreground">{spot.note}</p>
      )}

      {/* Sonne heute */}
      <Card className="mb-4 mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sunrise className="h-4 w-4 text-chart-4" aria-hidden="true" />
            Sonne heute an diesem Platz
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
          <Link
            href={`/sonne?lat=${spot.latitude}&lon=${spot.longitude}&name=${encodeURIComponent(spot.name)}&spot=${spot.id}`}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Compass className="h-4 w-4" aria-hidden="true" />
            Sonnenbahn und Schatten im Kompass ansehen
          </Link>
        </CardContent>
      </Card>

      {/* Wetter */}
      <Card className="mb-4">
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
              Wetter konnte nicht geladen werden (offline?).
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

      {/* Hindernis-Profil */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Mountain className="h-4 w-4 text-primary" aria-hidden="true" />
            Hindernis-Profil
          </CardTitle>
        </CardHeader>
        <CardContent>
          {obstacles.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              {obstacles.length}{" "}
              {obstacles.length === 1
                ? "Hindernis erfasst"
                : "Hindernisse erfasst"}{" "}
              – Schattenzeiten und Panel-Ausrichtung berücksichtigen dieses
              Profil automatisch.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Für diesen Platz ist noch kein Hindernis-Profil erfasst. Trage
              Bäume, Berge oder Gebäude im Sonnen-Kompass ein, um Schattenzeiten
              zu sehen.
            </p>
          )}
          <Link
            href={`/sonne?lat=${spot.latitude}&lon=${spot.longitude}&name=${encodeURIComponent(spot.name)}&spot=${spot.id}`}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Compass className="h-4 w-4" aria-hidden="true" />
            Profil im Sonnen-Kompass{" "}
            {obstacles.length > 0 ? "bearbeiten" : "anlegen"}
          </Link>
        </CardContent>
      </Card>

      {/* Aufenthalte */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
            Deine Aufenthalte hier
          </CardTitle>
        </CardHeader>
        <CardContent>
          {spotTrips.length > 0 ? (
            <>
              <div className="mb-3 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg bg-accent/50 py-2.5">
                  <p className="flex items-center justify-center gap-1.5 font-serif text-xl font-bold text-primary">
                    <Moon className="h-4 w-4" aria-hidden="true" />
                    {tripStats.totalNights}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tripStats.totalNights === 1 ? "Nacht" : "Nächte"} gesamt
                  </p>
                </div>
                <div className="rounded-lg bg-accent/50 py-2.5">
                  <p className="font-serif text-xl font-bold">
                    {spotTrips.length}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {spotTrips.length === 1 ? "Aufenthalt" : "Aufenthalte"}
                  </p>
                </div>
              </div>
              <ul className="space-y-1.5">
                {spotTrips.slice(0, 3).map(trip => (
                  <li
                    key={trip.id}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <CalendarDays
                      className="h-3.5 w-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    {new Date(`${trip.startDate}T00:00:00`).toLocaleDateString(
                      "de-CH",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }
                    )}{" "}
                    · {tripNights(trip.startDate, trip.endDate)}{" "}
                    {tripNights(trip.startDate, trip.endDate) === 1
                      ? "Nacht"
                      : "Nächte"}
                    {trip.title && ` · ${trip.title}`}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Noch kein Aufenthalt an diesem Platz im Tagebuch.
            </p>
          )}
          <Link
            href="/tagebuch"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            Zum Reise-Tagebuch
          </Link>
        </CardContent>
      </Card>

      {/* Dossier teilen */}
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Share2 className="h-4 w-4 text-primary" aria-hidden="true" />
            Platz teilen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Wer den Link hat, sieht Name, Koordinaten, Wetter und Sonnenzeiten
            dieses Platzes – ohne Anmeldung und nur lesend. Deine Notizen,
            Hindernisse und Tagebuch-Einträge bleiben privat.
          </p>
          {shareUrl ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
              <code className="min-w-0 flex-1 truncate text-xs">
                {shareUrl}
              </code>
              <button
                type="button"
                className="shrink-0 text-xs font-medium text-primary hover:underline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shareUrl);
                    toast.success("Link kopiert");
                  } catch {
                    toast.error(
                      "Kopieren nicht möglich – bitte manuell markieren"
                    );
                  }
                }}
              >
                Kopieren
              </button>
              <button
                type="button"
                className="shrink-0 text-xs font-medium text-muted-foreground hover:text-destructive"
                onClick={() =>
                  unshareMutation.mutate(
                    { id: spot.id },
                    {
                      onSuccess: () => {
                        setShareUrl(null);
                        toast.success("Teilen beendet – der Link ist ungültig");
                      },
                    }
                  )
                }
              >
                Teilen beenden
              </button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={shareMutation.isPending}
              onClick={() =>
                shareMutation.mutate(
                  { id: spot.id },
                  {
                    onSuccess: async ({ token }) => {
                      const url = `${window.location.origin}/platz/${token}`;
                      setShareUrl(url);
                      try {
                        await navigator.clipboard.writeText(url);
                        toast.success("Teil-Link kopiert");
                      } catch {
                        toast.success("Teil-Link erstellt – kopiere ihn oben");
                      }
                    },
                    onError: () => toast.error("Teilen fehlgeschlagen"),
                  }
                )
              }
            >
              <Share2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Platz per Link teilen
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
