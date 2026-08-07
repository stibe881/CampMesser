/**
 * «Bis wann muss ich umkehren?» (#379)
 *
 * Die beiden Hälften der Antwort kennt die App längst: den
 * Sonnenuntergang am Startpunkt (#144) und die Gehzeit nach SAC (#281).
 * Zusammengebracht wurden sie nie – dabei ist das die Frage, die man
 * unterwegs tatsächlich stellt.
 *
 * WARUM DER SONNENUNTERGANG UND NICHT DIE «BLAUE STUNDE»: Im Wald und
 * im Tal ist es lange vor dem rechnerischen Untergang zu dunkel zum
 * Gehen. Statt eine Dämmerungsformel zu erfinden, die je nach Gelände
 * ohnehin falsch liegt, gibt es eine sichtbare, verstellbare Reserve.
 * Wer sie kürzt, weiss dann wenigstens, dass er es tut.
 *
 * Gerechnet wird in `shared/turnaround.ts`; hier steht nur die Anzeige.
 */
import { useEffect, useMemo, useState } from "react";
import { CloudLightning, Sunset, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import { getSunTimes } from "@/lib/sun";
import { useNowMinutes } from "@/lib/useNowMinutes";
import {
  cleanBuffer,
  DEFAULT_BUFFER_MIN,
  formatDuration,
  formatMinutes,
  turnaroundTime,
  type RouteShape,
} from "@shared/turnaround";
import { firstStormRisk, stormClock, type StormHour } from "@shared/hikeStorm";
import { useTodayIso } from "@/lib/useTodayIso";

export default function TurnaroundCard({
  latitude,
  longitude,
  totalMinutes,
  className,
}: {
  /** Startpunkt der Route – dort geht die Sonne unter, die zählt. */
  latitude: number;
  longitude: number;
  /** Gehzeit der ganzen geplanten Tour in Minuten. */
  totalMinutes: number;
  className?: string;
}) {
  const t = useT();
  const ta = t.turnaround;
  const nowMinutes = useNowMinutes();
  const [shape, setShape] = useState<RouteShape>("outAndBack");
  const [bufferInput, setBufferInput] = useState(String(DEFAULT_BUFFER_MIN));

  /**
   * Der Sonnenuntergang hängt am TAG, nicht an der Minute – sonst würde
   * die Rechnung jede halbe Minute neu laufen. Deshalb hier nur das
   * Datum als Abhängigkeit.
   */
  const sunsetMinutes = useMemo(() => {
    const times = getSunTimes(new Date(), latitude, longitude);
    if (!times.sunset) return null;
    return times.sunset.getHours() * 60 + times.sunset.getMinutes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, Math.floor(nowMinutes / 60)]);

  const buffer = cleanBuffer(Number.parseInt(bufferInput, 10));
  const result = turnaroundTime({
    nowMinutes,
    sunsetMinutes,
    bufferMinutes: buffer,
    totalMinutes,
    shape,
  });

  /**
   * Gewitterrisiko heute (#391): In den Bergen ist das Nachmittags-
   * gewitter das zweite, oft frühere Ende des Tages – dann ist nicht der
   * Sonnenuntergang die Deadline, sondern die Wolke. Dieselben Schwellen
   * wie die Unwetter-Erkennung; stilles Scheitern, denn ohne Netz ist
   * die Umkehrzeit trotzdem etwas wert.
   */
  const today = useTodayIso();
  const [stormHours, setStormHours] = useState<StormHour[] | null>(null);
  useEffect(() => {
    setStormHours(null);
    let cancelled = false;
    const params = new URLSearchParams({
      latitude: latitude.toFixed(4),
      longitude: longitude.toFixed(4),
      timezone: "auto",
      forecast_days: "1",
      hourly: "weather_code,cape",
    });
    fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`)
      .then(res => (res.ok ? res.json() : null))
      .then(json => {
        if (cancelled || !json?.hourly?.time) return;
        setStormHours(
          (json.hourly.time as string[]).map((time: string, i: number) => ({
            time,
            weatherCode: json.hourly.weather_code?.[i] ?? 0,
            cape: json.hourly.cape?.[i] ?? 0,
          }))
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);
  const storm = useMemo(
    () => (stormHours ? firstStormRisk(stormHours, today, nowMinutes) : null),
    // Nur zur vollen Stunde neu rechnen – wie beim Sonnenuntergang oben.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stormHours, today, Math.floor(nowMinutes / 60)]
  );

  if (sunsetMinutes === null) return null;

  const warn = !result.fits || result.overdue;

  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        warn ? "border-destructive/50 bg-destructive/5" : "border-border",
        className
      )}
    >
      <p className="flex items-center gap-2 text-sm font-medium">
        {warn ? (
          <TriangleAlert
            className="h-4 w-4 shrink-0 text-destructive"
            aria-hidden="true"
          />
        ) : (
          <Sunset
            className="h-4 w-4 shrink-0 text-primary"
            aria-hidden="true"
          />
        )}
        {ta.title}
      </p>

      <div
        className="mt-2 flex flex-wrap gap-2"
        role="group"
        aria-label={ta.shapeLabel}
      >
        {(["outAndBack", "loop"] as const).map(option => (
          <Button
            key={option}
            type="button"
            size="sm"
            variant={shape === option ? "default" : "outline"}
            onClick={() => setShape(option)}
          >
            {option === "outAndBack" ? ta.outAndBack : ta.loop}
          </Button>
        ))}
      </div>

      <p className="mt-3 font-mono text-2xl font-bold leading-tight">
        {result.overdue
          ? ta.overdue
          : shape === "outAndBack" && result.turnaroundMinutes !== null
            ? formatMinutes(result.turnaroundMinutes)
            : result.latestStartMinutes !== null
              ? formatMinutes(result.latestStartMinutes)
              : "–"}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {shape === "outAndBack" ? ta.turnaroundLabel : ta.latestStartLabel}
        {!result.overdue &&
        result.minutesLeft !== null &&
        result.minutesLeft > 0
          ? ` · ${ta.left(formatDuration(result.minutesLeft))}`
          : ""}
      </p>

      {!result.fits && !result.overdue && (
        <p className="mt-2 text-xs font-medium text-destructive">
          {ta.tooLong(formatDuration(totalMinutes))}
        </p>
      )}

      {/* Gewitterrisiko (#391): erscheint nur, wenn heute wirklich etwas
          in der Prognose steht – ein Dauerhinweis wäre Lärm. */}
      {storm && (
        <p className="mt-2 flex items-start gap-1.5 text-xs font-medium text-destructive">
          <CloudLightning
            className="mt-0.5 h-3.5 w-3.5 shrink-0"
            aria-hidden="true"
          />
          <span>
            {storm.kind === "forecast"
              ? ta.stormForecast(stormClock(storm.minutes))
              : ta.stormPropensity(stormClock(storm.minutes))}{" "}
            {storm.minutes < sunsetMinutes - buffer && ta.stormBeatsSunset}
          </span>
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <Label
          htmlFor="turnaround-buffer"
          className="flex-1 text-xs font-normal text-muted-foreground"
        >
          {ta.bufferLabel}
        </Label>
        <Input
          id="turnaround-buffer"
          type="number"
          inputMode="numeric"
          className="w-20"
          min={0}
          max={180}
          value={bufferInput}
          onChange={e => setBufferInput(e.target.value)}
          onBlur={() => setBufferInput(String(buffer))}
        />
        <span className="text-xs text-muted-foreground">
          {ta.sunsetAt(formatMinutes(sunsetMinutes))}
        </span>
      </div>
      <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
        {ta.note}
      </p>
    </div>
  );
}
