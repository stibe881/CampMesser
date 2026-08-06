import { lazy, Suspense } from "react";

// Diagramm erst nach dem ersten Bild (#354): recharts ist 384 kB.
const TrackProfileChart = lazy(
  () => import("@/components/charts/TrackProfileChart")
);
/**
 * Höhenprofil und Zwischenzeiten zu einer aufgezeichneten Wanderung
 * (#280).
 *
 * Das Diagramm zeigt die Höhe über der zurückgelegten Strecke – nicht
 * über der Zeit. Über der Zeit sähe eine Pause wie eine Ebene aus, und
 * genau das will man nicht wissen.
 *
 * Fehlen dem Track Höhenangaben (manche Geräte liefern keine), erscheint
 * das Diagramm nicht, sondern ein Satz, der das sagt. Die
 * Zwischenzeiten bleiben trotzdem – die gibt es auch ohne Höhe.
 */
import { Mountain } from "lucide-react";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import { formatTrackDuration, type TrackPoint } from "@shared/track";
import {
  elevationProfile,
  elevationRange,
  hasElevation,
  kilometerSplits,
} from "@shared/trackProfile";

export default function TrackProfile({
  points,
  className,
}: {
  points: TrackPoint[];
  className?: string;
}) {
  const { lang, t } = useI18n();
  const tp = t.trackProfile;
  if (points.length < 2) return null;

  const withElevation = hasElevation(points);
  const range = elevationRange(points);
  const profile = elevationProfile(points).filter(p => p.elevationM !== null);
  const splits = kilometerSplits(points);
  const decimalSeparator = lang === "en" ? "." : ",";

  const chartData = profile.map(point => ({
    km: point.distanceM / 1000,
    ele: point.elevationM as number,
  }));

  return (
    <section className={cn("mt-4", className)} aria-label={tp.sectionAria}>
      <div className="mb-2 flex flex-wrap items-baseline gap-x-3">
        <h3 className="flex items-center gap-1.5 font-serif text-base font-semibold">
          <Mountain className="h-4 w-4 text-primary" aria-hidden="true" />
          {tp.title}
        </h3>
        {range && (
          <span className="text-xs text-muted-foreground">
            {tp.rangeLine(Math.round(range.minM), Math.round(range.maxM))}
          </span>
        )}
      </div>

      {!withElevation ? (
        <p className="text-sm text-muted-foreground">{tp.noElevation}</p>
      ) : (
        <div className="h-44 w-full" role="img" aria-label={tp.chartAria}>
          <Suspense fallback={null}>
            <TrackProfileChart
              data={chartData}
              decimalSeparator={decimalSeparator}
              labels={{
                elevation: tp.tooltipElevation,
                distance: tp.tooltipDistance,
              }}
            />
          </Suspense>
        </div>
      )}

      {splits.length > 0 && (
        <>
          <h3 className="mb-1.5 mt-4 font-serif text-base font-semibold">
            {tp.splitsTitle}
          </h3>
          <ul className="space-y-1">
            {splits.map(split => (
              <li
                key={split.km}
                className="flex items-center gap-3 rounded-lg border border-border/70 bg-background px-3 py-1.5 text-sm"
              >
                <span className="w-14 shrink-0 text-muted-foreground">
                  {split.complete ? tp.kmLabel(split.km) : tp.kmPartial}
                </span>
                <span className="flex-1 tabular-nums">
                  {formatTrackDuration(split.seconds)}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {tp.climbLine(split.ascentM, split.descentM)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">{tp.note}</p>
        </>
      )}
    </section>
  );
}
