/**
 * Plätze nach Bewertungs-Kriterien vergleichen (#278).
 *
 * Der zweite Teil der Bewertung: einzeln bewerten ist erst dann nützlich,
 * wenn man die Plätze auch nebeneinander sehen kann. Ein Tipp auf ein
 * Kriterium ordnet die Liste danach – «wo war es am ruhigsten» ist genau
 * die Frage, die man beim Planen stellt.
 *
 * Plätze ohne Bewertung in diesem Kriterium stehen am Ende und tragen
 * einen Strich statt einer Null: «nicht bewertet» ist nicht «schlecht».
 */
import { useState } from "react";
import { Star } from "lucide-react";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import { pick } from "@shared/i18n";
import {
  SPOT_CRITERIA,
  SPOT_CRITERION_LABELS,
  overallRating,
  rankByCriterion,
  rankByOverall,
  type RatedSpot,
  type SpotCriterion,
} from "@shared/spotRatings";

export default function SpotRatingCompare({
  spots,
  className,
}: {
  spots: RatedSpot[];
  className?: string;
}) {
  const { lang, t } = useI18n();
  const tr = t.spotRating;
  const [criterion, setCriterion] = useState<SpotCriterion | "overall">(
    "overall"
  );

  // Nur Plätze mit mindestens einer Bewertung – der Rest wäre eine leere Liste
  const rated = spots.filter(spot => overallRating(spot.ratings) !== null);
  if (rated.length < 2) return null;

  const ordered =
    criterion === "overall"
      ? rankByOverall(rated)
      : rankByCriterion(rated, criterion);
  const decimalSeparator = lang === "en" ? "." : ",";

  const valueOf = (spot: RatedSpot): string => {
    if (criterion === "overall") {
      const overall = overallRating(spot.ratings);
      return overall === null
        ? tr.unrated
        : overall.toFixed(1).replace(".", decimalSeparator);
    }
    const value = spot.ratings[criterion];
    return value === null ? tr.unrated : String(value);
  };

  return (
    <section
      className={cn("rounded-xl border border-border bg-card p-4", className)}
      aria-label={tr.compareTitle}
    >
      <h2 className="font-serif text-lg font-semibold">{tr.compareTitle}</h2>

      <div
        className="mt-2 flex flex-wrap gap-1.5"
        role="group"
        aria-label={tr.compareTitle}
      >
        {(["overall", ...SPOT_CRITERIA] as const).map(key => (
          <button
            key={key}
            type="button"
            onClick={() => setCriterion(key)}
            aria-pressed={criterion === key}
            className={cn(
              "rounded-full px-3 py-1 text-sm transition-colors",
              criterion === key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {key === "overall"
              ? tr.compareAll
              : pick(SPOT_CRITERION_LABELS[key], lang)}
          </button>
        ))}
      </div>

      <ul className="mt-3 space-y-1.5">
        {ordered.map((spot, index) => (
          <li
            key={spot.id}
            className="flex items-center gap-3 rounded-lg border border-border/70 bg-background px-3 py-2 text-sm"
          >
            <span className="w-5 shrink-0 text-muted-foreground">
              {index + 1}.
            </span>
            <span className="min-w-0 flex-1 truncate">{spot.name}</span>
            <span className="flex shrink-0 items-center gap-1 tabular-nums">
              {valueOf(spot)}
              <Star className="h-3.5 w-3.5 text-chart-1" aria-hidden="true" />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
