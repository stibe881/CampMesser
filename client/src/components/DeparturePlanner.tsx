/**
 * Beste Abfahrtszeit (#285) und Rückreise-Planung (#286): rückwärts
 * rechnen – hin zur Check-in-Zeit, zurück zur Wunschzeit daheim.
 *
 * Die Rechnung ist einfach – schwierig ist, die richtigen Zahlen
 * einzusetzen. «Zwei Stunden Fahrt» meint die reine Fahrzeit und lässt
 * zwei Pausen und den Puffer an der Schranke weg; genau deshalb steht man
 * vor einer geschlossenen Rezeption.
 *
 * DIE STRECKE ist eine ECHTE Route über die Strasse (OSRM, siehe
 * client/src/lib/routing.ts) – samt der Fahrzeit des Dienstes, die Pässe,
 * Ortsdurchfahrten und Tempolimiten kennt. Nur wenn kein Netz da ist,
 * wird aus der Luftlinie mit Umwegfaktor geschätzt, und dann steht das
 * auch so da. Ohne gespeicherten Heim-Standort erscheint statt einer
 * erfundenen Zahl der Hinweis, wo man ihn setzt.
 *
 * DIE RÜCKREISE ist dieselbe Rechnung mit einem zusätzlichen Abgleich:
 * Die reine Rückwärtsrechnung kann «um 15:40 losfahren» sagen, und das
 * nützt nichts, wenn der Platz um 11 Uhr geräumt sein will. Dann steht
 * da, wann man WIRKLICH losfährt und wann man entsprechend daheim ist.
 */
import { useEffect, useRef, useState } from "react";
import { Clock, Coffee, Car, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { formatDistance } from "@shared/geo";
import { routeOrEstimate } from "@/lib/routing";
import { useDriveTime } from "@/hooks/useDriveTime";
import { nextOccurrenceMs } from "@shared/googleRoutes";
import type { RouteResult } from "@shared/routing";
import {
  BREAK_PROFILES,
  DEFAULT_CHECKOUT_TIME,
  DRIVE_SPEED_KMH,
  breakSchedule,
  departurePlan,
  returnPlan,
  type BreakProfile,
} from "@shared/departure";

const PROFILE_ORDER: BreakProfile[] = [
  "keine",
  "erwachsene",
  "kinder",
  "kleinkinder",
];

/** Minuten lesbar: «2 h 15 min» bzw. «45 min». */
function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export default function DeparturePlanner({
  latitude,
  longitude,
  className,
}: {
  latitude: number;
  longitude: number;
  className?: string;
}) {
  const { lang, t } = useI18n();
  const dp = t.departure;
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [arrivalTime, setArrivalTime] = useState("16:00");
  const [profile, setProfile] = useState<BreakProfile>("kinder");
  /** Hinfahrt zum Platz oder Rückreise nach Hause (#286). */
  const [direction, setDirection] = useState<"hin" | "zurueck">("hin");
  const [homeArrivalTime, setHomeArrivalTime] = useState("18:00");
  const [checkoutTime, setCheckoutTime] = useState(DEFAULT_CHECKOUT_TIME);

  const homeQuery = trpc.home.get.useQuery(undefined, {
    enabled: isAuthenticated && open,
  });
  const home = homeQuery.data ?? null;

  /** Gefahrene Route Heim → Platz; null, solange sie geholt wird. */
  const [route, setRoute] = useState<RouteResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Route erst holen, wenn der Abschnitt offen ist und ein Heim-Standort
  // existiert – und pro Platz nur einmal (der Zwischenspeicher hilft dabei)
  useEffect(() => {
    if (!open || !home) return;
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    setRoute(null);
    void routeOrEstimate(
      [
        { lat: home.latitude, lon: home.longitude },
        { lat: latitude, lon: longitude },
      ],
      "car",
      DRIVE_SPEED_KMH,
      { signal: controller.signal }
    ).then(result => {
      if (!controller.signal.aborted) setRoute(result);
    });
    return () => controller.abort();
  }, [open, home, latitude, longitude]);

  const distanceKm = route ? route.distanceM / 1000 : 0;
  const osrmMinutes = route ? Math.round(route.durationS / 60) : null;

  /** Die ganze Rechnung, einmal als Funktion – sie läuft zweimal (s. u.). */
  const buildPlan = (driveMinutes: number | null) => {
    const backPlan =
      home && direction === "zurueck"
        ? returnPlan({
            distanceKm,
            homeArrivalTime,
            checkoutTime: checkoutTime || null,
            profile,
            driveMinutes,
          })
        : null;
    const forwardPlan =
      !home || !route
        ? null
        : direction === "hin"
          ? departurePlan({
              distanceKm,
              arrivalTime,
              profile,
              driveMinutes,
            })
          : (backPlan?.plan ?? null);
    return { back: backPlan, plan: forwardPlan };
  };

  // ZWEI DURCHGÄNGE, und das aus einem handfesten Grund: Für die Frage nach
  // dem Verkehr braucht Google einen Zeitpunkt – aber wann man losfährt,
  // ist ja gerade das Ergebnis der Rechnung. Also einmal mit der
  // OSRM-Fahrzeit rechnen, um die Abfahrts-UHRZEIT zu bekommen, damit den
  // Verkehr erfragen und mit dieser Fahrzeit noch einmal rechnen.
  const firstPass = buildPlan(osrmMinutes);
  const firstDeparture =
    firstPass.back?.afterCheckout && checkoutTime
      ? checkoutTime
      : (firstPass.plan?.departureTime ?? null);
  const drive = useDriveTime(
    home ? { lat: home.latitude, lon: home.longitude } : null,
    { lat: latitude, lon: longitude },
    {
      enabled: open && route != null,
      departureAtMs: firstDeparture
        ? nextOccurrenceMs(firstDeparture, Date.now())
        : null,
    }
  );
  const trafficMinutes =
    drive.durationS != null ? Math.round(drive.durationS / 60) : null;
  const { back, plan } =
    trafficMinutes != null ? buildPlan(trafficMinutes) : firstPass;
  // Bei der Rückreise zählt die Abfahrt, die man wirklich hinbekommt
  const effectiveDeparture =
    back?.afterCheckout && checkoutTime ? checkoutTime : plan?.departureTime;
  const stops =
    plan && effectiveDeparture
      ? breakSchedule(effectiveDeparture, plan.driveMinutes, profile)
      : [];

  return (
    <section
      className={cn("rounded-lg border border-border bg-card p-3", className)}
      aria-label={dp.title}
    >
      <p className="flex items-center gap-1.5 text-sm font-medium">
        <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
        {dp.title}
      </p>

      {!open ? (
        <>
          <p className="mt-1 text-xs text-muted-foreground">{dp.intro}</p>
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={() => setOpen(true)}
          >
            {dp.openButton}
          </Button>
        </>
      ) : !isAuthenticated ? (
        <p className="mt-2 text-sm text-muted-foreground">{dp.loginNote}</p>
      ) : homeQuery.isLoading ? (
        <p className="mt-2 text-sm text-muted-foreground">{t.common.loading}</p>
      ) : !home ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {dp.noHome}{" "}
          <Link href="/profil" className="font-medium text-primary underline">
            {dp.noHomeLink}
          </Link>
        </p>
      ) : (
        <div className="mt-2 space-y-3">
          {/* Hinfahrt oder Rückreise (#286) */}
          <div
            className="flex gap-2"
            role="group"
            aria-label={dp.directionAria}
          >
            {(["hin", "zurueck"] as const).map(mode => (
              <Button
                key={mode}
                size="sm"
                variant={direction === mode ? "default" : "outline"}
                className="flex-1"
                onClick={() => setDirection(mode)}
                aria-pressed={direction === mode}
              >
                {mode === "hin" ? dp.directionOut : dp.directionBack}
              </Button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="departure-arrival">
                {direction === "hin" ? dp.arrivalLabel : dp.homeArrivalLabel}
              </Label>
              <Input
                id="departure-arrival"
                type="time"
                value={direction === "hin" ? arrivalTime : homeArrivalTime}
                onChange={e =>
                  direction === "hin"
                    ? setArrivalTime(e.target.value)
                    : setHomeArrivalTime(e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="departure-profile">{dp.profileLabel}</Label>
              <select
                id="departure-profile"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={profile}
                onChange={e => setProfile(e.target.value as BreakProfile)}
              >
                {PROFILE_ORDER.map(key => (
                  <option key={key} value={key}>
                    {dp.profiles[key]}
                  </option>
                ))}
              </select>
            </div>
            {direction === "zurueck" && (
              <div>
                <Label htmlFor="departure-checkout">{dp.checkoutLabel}</Label>
                <Input
                  id="departure-checkout"
                  type="time"
                  value={checkoutTime}
                  onChange={e => setCheckoutTime(e.target.value)}
                />
              </div>
            )}
          </div>

          {!route && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {dp.routing}
            </p>
          )}

          {plan && (
            <>
              <div className="rounded-lg bg-accent/50 p-3 text-center">
                <p className="font-mono text-2xl font-bold leading-tight">
                  {back?.afterCheckout ? checkoutTime : plan.departureTime}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {back?.afterCheckout
                    ? dp.departureAtCheckout
                    : plan.daysEarlier > 0
                      ? dp.departureDayBefore(plan.daysEarlier)
                      : dp.departureLabel}
                </p>
              </div>

              {/* Der Check-out entscheidet: früher los, dafür früher daheim */}
              {back?.afterCheckout && back.arrivalIfCheckout && (
                <p className="rounded-lg border border-amber-600/40 bg-amber-500/10 p-3 text-sm">
                  {dp.checkoutNote(
                    checkoutTime,
                    back.arrivalIfCheckout,
                    back.arrivalDaysLater
                  )}
                </p>
              )}

              <ul className="space-y-1 text-sm">
                <li className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Car className="h-4 w-4" aria-hidden="true" />
                    {dp.driveLine(formatDistance(distanceKm * 1000, lang))}
                  </span>
                  <span className="tabular-nums">
                    {formatMinutes(plan.driveMinutes)}
                  </span>
                </li>
                <li className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Coffee className="h-4 w-4" aria-hidden="true" />
                    {dp.breaksLine(
                      plan.breaks,
                      BREAK_PROFILES[profile].breakMinutes
                    )}
                  </span>
                  <span className="tabular-nums">
                    {formatMinutes(plan.breakMinutes)}
                  </span>
                </li>
                <li className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{dp.bufferLine}</span>
                  <span className="tabular-nums">
                    {formatMinutes(plan.bufferMinutes)}
                  </span>
                </li>
                <li className="flex items-center justify-between gap-3 border-t border-border/70 pt-1 font-medium">
                  <span>{dp.totalLine}</span>
                  <span className="tabular-nums">
                    {formatMinutes(plan.totalMinutes)}
                  </span>
                </li>
              </ul>

              {stops.length > 0 && (
                <p className="text-sm">{dp.stopsLine(stops.join(", "))}</p>
              )}
            </>
          )}

          <p className="text-xs text-muted-foreground">
            {route?.source === "estimate"
              ? dp.noteEstimate
              : trafficMinutes != null
                ? dp.noteTraffic
                : dp.note}
          </p>
        </div>
      )}
    </section>
  );
}
