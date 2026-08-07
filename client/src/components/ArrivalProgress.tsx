/**
 * «Wie weit noch?» (#242).
 *
 * Für die Kinder auf dem Rücksitz: ein Fortschrittsbalken zur Ankunft.
 * Ziel ist der Platz der laufenden oder nächsten Reise, wahlweise ein
 * anderer gespeicherter Platz. Beim Losfahren wird der aktuelle Standort
 * als Startpunkt gesetzt; von da an rechnet shared/arrivalProgress.ts.
 *
 * Die Zahl ist eine LUFTLINIE, und das steht auch da. Die Strasse ist
 * länger – über einen Pass viel länger –, und lieber steht der Balken
 * ehrlich falsch als falsch genau.
 *
 * Gemessen wird sparsam (lib/arrivalTracking.ts): grober Standort, ein Fix
 * pro Minute. Auf der Fahrt hängt das Handy oft nicht am Strom, und für
 * «noch 84 Kilometer» braucht es keine Metergenauigkeit.
 */
import { useEffect, useRef, useState } from "react";
import {
  Flag,
  Loader2,
  MapPin,
  Navigation,
  PartyPopper,
  Square,
  Tent,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { formatDistance } from "@shared/geo";
import { LOCALE_TAGS } from "@shared/i18n";
import { currentTripDay, isUpcomingTrip } from "@shared/trips";
import {
  ARRIVAL_MILESTONES,
  arrivalProgress,
  crossedMilestones,
} from "@shared/arrivalProgress";
import {
  currentPosition,
  recordArrivalPercent,
  refreshArrivalPosition,
  startArrivalTrip,
  stopArrivalTrip,
  useArrivalTrip,
} from "@/lib/arrivalTracking";
import { hapticCelebrate } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { useTodayIso } from "@/lib/useTodayIso";

export default function ArrivalProgress() {
  const { lang, t } = useI18n();
  const ap = t.arrival;
  const { isAuthenticated } = useAuth();
  const { trip, geoError } = useArrivalTrip();
  const [starting, setStarting] = useState(false);
  const [chosenSpotId, setChosenSpotId] = useState<string>("");

  const spotsQuery = trpc.spots.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const spots = spotsQuery.data ?? [];

  // Vorschlag: der Platz der laufenden Reise, sonst der der nächsten
  const today = useTodayIso();
  const ownTrips = (tripsQuery.data ?? []).filter(row => row.role === "owner");
  const suggestedTrip =
    ownTrips
      .filter(row => currentTripDay(row, today) !== null)
      .sort((a, b) => b.startDate.localeCompare(a.startDate))[0] ??
    ownTrips
      .filter(row => isUpcomingTrip(row.startDate, today))
      .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  const suggestedSpotId =
    suggestedTrip?.spotId != null &&
    spots.some(spot => spot.id === suggestedTrip.spotId)
      ? suggestedTrip.spotId
      : (spots[0]?.id ?? null);

  // Vorauswahl im Select, sobald die Plätze da sind
  useEffect(() => {
    if (chosenSpotId === "" && suggestedSpotId !== null) {
      setChosenSpotId(String(suggestedSpotId));
    }
  }, [chosenSpotId, suggestedSpotId]);

  const progress = trip
    ? arrivalProgress(
        { lat: trip.startLat, lon: trip.startLon },
        { lat: trip.currentLat, lon: trip.currentLon },
        { lat: trip.targetLat, lon: trip.targetLon }
      )
    : null;

  /**
   * Meilensteine feiern. Verglichen wird gegen den gespeicherten Höchststand,
   * damit ein Zickzack im Signal (oder ein Neuladen) nicht noch einmal jubelt.
   */
  const celebratedRef = useRef<number>(trip?.maxPercent ?? 0);
  useEffect(() => {
    if (!trip || !progress) return;
    const before = Math.max(celebratedRef.current, trip.maxPercent);
    const crossed = crossedMilestones(before, progress.percent);
    celebratedRef.current = Math.max(before, progress.percent);
    recordArrivalPercent(progress.percent);
    if (crossed.length > 0) {
      hapticCelebrate();
      toast.success(ap.milestoneToast(crossed[crossed.length - 1]!));
    }
    // Absichtlich nur am Fortschritt und am Ziel hängend: jeder neue Fix
    // rechnet neu, ein Zielwechsel setzt die Feier-Schwelle zurück.
  }, [progress?.percent, trip?.targetName]);

  const beginTrip = async () => {
    const spot = spots.find(entry => String(entry.id) === chosenSpotId);
    if (!spot) return;
    setStarting(true);
    try {
      const position = await currentPosition();
      startArrivalTrip({
        name: spot.name,
        lat: spot.latitude,
        lon: spot.longitude,
        spotId: spot.id,
        startLat: position.coords.latitude,
        startLon: position.coords.longitude,
      });
      celebratedRef.current = 0;
    } catch {
      toast.error(ap.locationFailed);
    } finally {
      setStarting(false);
    }
  };

  return (
    <section className="mb-8">
      <h2 className="mb-1 font-serif text-xl font-semibold">{ap.title}</h2>
      <p className="mb-3 text-sm text-muted-foreground">{ap.subtitle}</p>

      {!isAuthenticated && (
        <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
          {ap.loginHint}
        </p>
      )}

      {isAuthenticated && !trip && (
        <div className="rounded-xl border border-border bg-card p-4">
          {spots.length === 0 ? (
            <p className="text-sm text-muted-foreground">{ap.noSpots}</p>
          ) : (
            <>
              <p className="mb-2 text-sm text-muted-foreground">
                {suggestedTrip ? ap.suggestedFromTrip : ap.suggestedWithoutTrip}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={chosenSpotId} onValueChange={setChosenSpotId}>
                  <SelectTrigger
                    className="max-w-64"
                    aria-label={ap.targetSelectAria}
                  >
                    <SelectValue placeholder={ap.targetPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {spots.map(spot => (
                      <SelectItem key={spot.id} value={String(spot.id)}>
                        {spot.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => void beginTrip()}
                  disabled={starting || chosenSpotId === ""}
                >
                  {starting ? (
                    <Loader2
                      className="mr-1.5 h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Navigation className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  )}
                  {ap.start}
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {ap.startNote}
              </p>
            </>
          )}
        </div>
      )}

      {trip && progress && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <MapPin
              className="h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span className="font-semibold">{trip.targetName}</span>
            <Badge variant="secondary">{ap.straightLineBadge}</Badge>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => stopArrivalTrip()}
            >
              <Square className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {ap.stop}
            </Button>
          </div>

          {/* Der Balken: Auto fährt los, Zelt rückt näher */}
          <div
            className="relative h-14"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress.percent)}
            aria-label={ap.progressAria(trip.targetName)}
          >
            <div className="absolute inset-x-0 top-7 h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            {/* Meilenstein-Markierungen bei 25/50/75 % */}
            {ARRIVAL_MILESTONES.map(milestone => (
              <span
                key={milestone}
                className={cn(
                  "absolute top-7 h-3 w-0.5",
                  progress.percent >= milestone
                    ? "bg-primary-foreground/70"
                    : "bg-border"
                )}
                style={{ left: `${milestone}%` }}
                aria-hidden="true"
              />
            ))}
            {/* Das Auto sitzt auf dem Fortschritt */}
            <span
              className="absolute top-0 -translate-x-1/2 text-xl transition-all duration-700"
              style={{ left: `${progress.percent}%` }}
              aria-hidden="true"
            >
              🚗
            </span>
            {/* Das Zelt steht am Ziel und wird beim Ankommen gefeiert */}
            <span
              className={cn(
                "absolute right-0 top-11 flex items-center gap-1 text-xs font-medium",
                progress.arrived ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Tent className="h-3.5 w-3.5" aria-hidden="true" />
              {ap.targetLabel}
            </span>
            <span className="absolute left-0 top-11 flex items-center gap-1 text-xs text-muted-foreground">
              <Flag className="h-3.5 w-3.5" aria-hidden="true" />
              {ap.startLabel}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="font-serif text-3xl font-bold tabular-nums text-primary">
              {ap.percent(Math.round(progress.percent))}
            </span>
            <span className="text-sm">
              {ap.remaining(formatDistance(progress.remainingM, lang))}
            </span>
            <span className="text-xs text-muted-foreground">
              {ap.ofTotal(formatDistance(progress.totalM, lang))}
            </span>
          </div>

          {progress.arrived ? (
            <p className="mt-3 flex items-center gap-2 rounded-lg bg-accent p-3 text-sm font-semibold">
              <PartyPopper
                className="h-5 w-5 shrink-0 text-primary motion-safe:animate-bounce"
                aria-hidden="true"
              />
              {ap.arrived(trip.targetName)}
            </p>
          ) : (
            <p className="mt-3 text-sm">
              {ap.encouragement(nextStep(progress.percent))}
            </p>
          )}

          <p className="mt-2 text-xs text-muted-foreground">
            {ap.straightLineNote}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshArrivalPosition()}
            >
              <Navigation className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {ap.refresh}
            </Button>
            <span className="text-xs text-muted-foreground">
              {trip.lastFixAt
                ? ap.lastFix(
                    new Date(trip.lastFixAt).toLocaleTimeString(
                      LOCALE_TAGS[lang],
                      { hour: "2-digit", minute: "2-digit" }
                    )
                  )
                : ap.noFixYet}
            </span>
          </div>

          {geoError && (
            <p className="mt-2 text-xs text-destructive">
              {geoError === "denied"
                ? ap.geoDenied
                : geoError === "unsupported"
                  ? ap.geoUnsupported
                  : ap.geoFailed}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

/** Der nächste noch offene Meilenstein (100 = nur noch das Ziel). */
function nextStep(percent: number): number {
  return ARRIVAL_MILESTONES.find(milestone => percent < milestone) ?? 100;
}
