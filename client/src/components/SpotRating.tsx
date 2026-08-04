/**
 * Eigene Platz-Bewertung nach Kriterien (#278).
 *
 * Vier Zeilen mit je fünf Sternen. Ein zweiter Tipp auf denselben Stern
 * LÖSCHT die Bewertung wieder – wer im Regen nie draussen sass, soll den
 * Schatten auch zurücknehmen können, statt mit einer erfundenen Drei zu
 * leben.
 *
 * Gespeichert wird sofort beim Antippen; ein «Speichern»-Knopf für vier
 * Sterne wäre eine Zumutung.
 */
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { pick } from "@shared/i18n";
import {
  MAX_STARS,
  SPOT_CRITERIA,
  SPOT_CRITERION_HINTS,
  SPOT_CRITERION_LABELS,
  overallRating,
  ratedCount,
  type SpotCriterion,
  type SpotRatings,
} from "@shared/spotRatings";

export default function SpotRating({
  spotId,
  ratings,
  className,
}: {
  spotId: number;
  ratings: SpotRatings;
  className?: string;
}) {
  const { lang, t } = useI18n();
  const tr = t.spotRating;
  const utils = trpc.useUtils();

  const rateMutation = trpc.spots.rate.useMutation({
    onSuccess: () => void utils.spots.list.invalidate(),
    onError: () => toast.error(tr.saveFailed),
  });

  const setStars = (criterion: SpotCriterion, stars: number) => {
    // Zweiter Tipp auf denselben Stern nimmt die Bewertung zurück
    const next = ratings[criterion] === stars ? null : stars;
    rateMutation.mutate({
      id: spotId,
      sanitary: criterion === "sanitary" ? next : ratings.sanitary,
      quiet: criterion === "quiet" ? next : ratings.quiet,
      shade: criterion === "shade" ? next : ratings.shade,
      kids: criterion === "kids" ? next : ratings.kids,
    });
  };

  const overall = overallRating(ratings);
  const rated = ratedCount(ratings);
  const decimalSeparator = lang === "en" ? "." : ",";

  return (
    <section
      className={cn("rounded-xl border border-border bg-card p-4", className)}
      aria-label={tr.sectionAria}
    >
      <div className="flex flex-wrap items-baseline gap-x-2">
        <h2 className="font-serif text-lg font-semibold">{tr.title}</h2>
        {overall !== null && (
          <span className="text-sm text-muted-foreground">
            {tr.overall(
              overall.toFixed(1).replace(".", decimalSeparator),
              rated,
              SPOT_CRITERIA.length
            )}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{tr.subtitle}</p>

      <ul className="mt-3 space-y-3">
        {SPOT_CRITERIA.map(criterion => {
          const value = ratings[criterion];
          return (
            <li key={criterion}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium">
                  {pick(SPOT_CRITERION_LABELS[criterion], lang)}
                </span>
                <div
                  className="flex items-center gap-0.5"
                  role="group"
                  aria-label={pick(SPOT_CRITERION_LABELS[criterion], lang)}
                >
                  {Array.from({ length: MAX_STARS }, (_, i) => i + 1).map(
                    stars => (
                      <button
                        key={stars}
                        type="button"
                        onClick={() => setStars(criterion, stars)}
                        disabled={rateMutation.isPending}
                        aria-label={tr.starAria(
                          stars,
                          pick(SPOT_CRITERION_LABELS[criterion], lang)
                        )}
                        aria-pressed={value !== null && stars <= value}
                        className="p-0.5 disabled:opacity-60"
                      >
                        <Star
                          className={cn(
                            "h-5 w-5 transition-colors",
                            value !== null && stars <= value
                              ? "fill-chart-1 text-chart-1"
                              : "text-muted-foreground/40"
                          )}
                          aria-hidden="true"
                        />
                      </button>
                    )
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {value === null
                  ? tr.notRated
                  : pick(SPOT_CRITERION_HINTS[criterion], lang)}
              </p>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-xs text-muted-foreground">{tr.note}</p>
    </section>
  );
}
