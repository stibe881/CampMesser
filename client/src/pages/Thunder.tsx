/**
 * Gewitter-Entfernung messen (#274): Blitz antippen, Donner antippen –
 * die App rechnet die Distanz und sagt, ob das Gewitter näher zieht.
 *
 * Die Bedienung ist auf EINEN grossen Knopf ausgelegt, weil man dabei in
 * den Himmel schaut und nicht aufs Handy. Erster Tipp startet die Zählung
 * beim Blitz, zweiter Tipp stoppt sie beim Donner.
 *
 * Die Messungen bleiben bewusst nur im Arbeitsspeicher: Eine
 * Gewitter-Zählung ist für die nächsten dreissig Minuten interessant und
 * danach nie wieder.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CloudLightning,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  Volume2,
  Zap,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import {
  ALL_CLEAR_MINUTES,
  MAX_COUNT_SECONDS,
  minutesUntilAllClear,
  stormLevel,
  stormTrend,
  strikeDistanceKm,
  type StormLevel,
  type StrikeMeasurement,
} from "@shared/thunder";

const levelStyles: Record<StormLevel, string> = {
  gefahr: "border-destructive/50 bg-destructive/10 text-destructive",
  warnung:
    "border-amber-600/40 bg-amber-500/15 text-amber-800 dark:text-amber-300",
  beobachten: "border-primary/40 bg-primary/10 text-primary",
};

export default function ThunderPage() {
  const { lang, t } = useI18n();
  const tt = t.thunder;
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [measurements, setMeasurements] = useState<StrikeMeasurement[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const timerRef = useRef<number | null>(null);

  // Laufende Zählung zehnmal pro Sekunde nachführen; die Uhr für die
  // Entwarnung reicht einmal pro Sekunde
  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setNow(Date.now());
      setStartedAt(current => {
        if (current !== null) setElapsed((Date.now() - current) / 1000);
        return current;
      });
    }, 100);
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, []);

  const decimalSeparator = lang === "en" ? "." : ",";
  const formatKm = (km: number) => km.toFixed(1).replace(".", decimalSeparator);

  const tap = () => {
    if (startedAt === null) {
      setStartedAt(Date.now());
      setElapsed(0);
      return;
    }
    const seconds = (Date.now() - startedAt) / 1000;
    setStartedAt(null);
    const distanceKm = strikeDistanceKm(seconds);
    if (distanceKm === null) return;
    setMeasurements(list => [...list, { at: Date.now(), seconds, distanceKm }]);
    setElapsed(0);
    // Kurzes Rütteln als Rückmeldung – man schaut ja nach oben
    navigator.vibrate?.(40);
  };

  const latest = measurements[measurements.length - 1] ?? null;
  const trend = useMemo(() => stormTrend(measurements), [measurements]);
  const level = latest ? stormLevel(latest.distanceKm) : null;
  const untilAllClear = minutesUntilAllClear(measurements, now);

  return (
    <div className="container max-w-2xl py-6">
      <PageHeader title={tt.title} subtitle={tt.subtitle} />

      {/* Der grosse Knopf: erster Tipp Blitz, zweiter Tipp Donner */}
      <button
        type="button"
        onClick={tap}
        className={cn(
          "mb-4 flex w-full flex-col items-center gap-2 rounded-2xl border-2 p-8 transition-all active:scale-[0.99]",
          startedAt === null
            ? "border-primary bg-accent/40"
            : "border-amber-600 bg-amber-500/15"
        )}
        aria-label={
          startedAt === null ? tt.tapLightningAria : tt.tapThunderAria
        }
      >
        {startedAt === null ? (
          <Zap className="h-12 w-12 text-primary" aria-hidden="true" />
        ) : (
          <Volume2
            className="h-12 w-12 text-amber-700 dark:text-amber-300"
            aria-hidden="true"
          />
        )}
        <span className="font-serif text-2xl font-bold">
          {startedAt === null ? tt.tapLightning : tt.tapThunder}
        </span>
        {startedAt !== null && (
          <span className="text-4xl font-bold tabular-nums">
            {elapsed.toFixed(1).replace(".", decimalSeparator)} s
          </span>
        )}
        <span className="text-sm text-muted-foreground">
          {startedAt === null ? tt.tapLightningHint : tt.tapThunderHint}
        </span>
      </button>

      {/* Letzte Messung mit Stufe und Trend */}
      {latest && level && (
        <div className={cn("mb-4 rounded-xl border p-4", levelStyles[level])}>
          <p className="text-xs font-semibold uppercase tracking-wide">
            {tt.lastStrike}
          </p>
          <p className="mt-1 font-serif text-3xl font-bold">
            {tt.distanceKm(formatKm(latest.distanceKm))}
          </p>
          <p className="mt-1 text-sm">
            {tt.secondsCounted(
              latest.seconds.toFixed(1).replace(".", decimalSeparator)
            )}
          </p>
          {trend && trend !== "gleich" && (
            <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold">
              {trend === "naeher" ? (
                <TrendingDown className="h-4 w-4" aria-hidden="true" />
              ) : (
                <TrendingUp className="h-4 w-4" aria-hidden="true" />
              )}
              {trend === "naeher" ? tt.trendCloser : tt.trendFurther}
            </p>
          )}
          {trend === "gleich" && <p className="mt-2 text-sm">{tt.trendSame}</p>}
          <p className="mt-2 text-sm">{tt.advice[level]}</p>
        </div>
      )}

      {/* Entwarnung nach der 30-30-Regel */}
      {untilAllClear !== null && (
        <p className="mb-4 rounded-lg border border-border bg-muted/50 p-3 text-sm">
          {untilAllClear > 0
            ? tt.allClearIn(untilAllClear)
            : tt.allClearReached(ALL_CLEAR_MINUTES)}
        </p>
      )}

      {measurements.length > 0 && (
        <>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold">{tt.historyTitle}</h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setMeasurements([]);
                setStartedAt(null);
                setElapsed(0);
              }}
            >
              <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {tt.reset}
            </Button>
          </div>
          <ul className="mb-6 space-y-1.5">
            {measurements
              .slice()
              .reverse()
              .map(entry => (
                <li
                  key={entry.at}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm"
                >
                  <CloudLightning
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="flex-1 tabular-nums">
                    {tt.distanceKm(formatKm(entry.distanceKm))}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {entry.seconds.toFixed(1).replace(".", decimalSeparator)} s
                  </span>
                </li>
              ))}
          </ul>
        </>
      )}

      <div className="rounded-lg border border-border bg-muted/50 p-3.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {tt.ruleTitle}
        </p>
        <p className="mt-1 text-sm">{tt.ruleText}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          {tt.methodNote(MAX_COUNT_SECONDS)}
        </p>
      </div>
    </div>
  );
}
