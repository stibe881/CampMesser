/**
 * Kinder-Reisepass (#292): für jeden besuchten Platz ein Stempel.
 *
 * Die Stempel entstehen aus den eingetragenen Reisen – nichts wird
 * doppelt erfasst. Jeder Platz bekommt ein Aussehen, das aus seinem
 * NAMEN gerechnet ist: dieselbe Form, dieselbe Farbe, dieselbe
 * Schräglage, auf jedem Gerät und nach jedem Neuladen.
 *
 * Der Pass ist zum Herzeigen gedacht, deshalb ist er auch druckbar.
 */
import { useMemo } from "react";
import { Printer, Stamp } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import LoginPrompt from "@/components/LoginPrompt";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { LOCALE_TAGS, pick } from "@shared/i18n";
import { passportSummary, type PassportStamp } from "@shared/passport";

/** Ein Stempel als SVG – Form und Farbe kommen aus dem Platznamen. */
function StampMark({ stamp, label }: { stamp: PassportStamp; label: string }) {
  const { shape, color, tiltDeg } = stamp;
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-20 w-20"
      style={{ transform: `rotate(${tiltDeg}deg)` }}
      role="img"
      aria-label={label}
    >
      {shape === "kreis" && (
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke={color}
          strokeWidth="5"
        />
      )}
      {shape === "raute" && (
        <path
          d="M50 6 L94 50 L50 94 L6 50 Z"
          fill="none"
          stroke={color}
          strokeWidth="5"
        />
      )}
      {shape === "wappen" && (
        <path
          d="M14 14 H86 V58 Q86 84 50 94 Q14 84 14 58 Z"
          fill="none"
          stroke={color}
          strokeWidth="5"
        />
      )}
      {shape === "zackenrad" && (
        <>
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeDasharray="7 5"
          />
          <circle
            cx="50"
            cy="50"
            r="30"
            fill="none"
            stroke={color}
            strokeWidth="2"
          />
        </>
      )}
      <text
        x="50"
        y="47"
        textAnchor="middle"
        fontSize="19"
        fontWeight="700"
        fill={color}
      >
        {stamp.visits}×
      </text>
      <text x="50" y="66" textAnchor="middle" fontSize="12" fill={color}>
        {stamp.firstVisit.slice(0, 4)}
      </text>
    </svg>
  );
}

export default function PassportPage() {
  const { lang, t } = useI18n();
  const pp = t.passport;
  const { isAuthenticated, loading } = useAuth();
  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const summary = useMemo(
    () => passportSummary(tripsQuery.data ?? []),
    [tripsQuery.data]
  );

  if (loading) {
    return (
      <div className="container max-w-2xl py-6">
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }
  if (!isAuthenticated) return <LoginPrompt feature={pp.title} />;

  return (
    <div className="container max-w-2xl py-6">
      <PageHeader title={pp.title} subtitle={pp.intro} />

      {/* Deckblatt: Titel, Plätze, Nächte */}
      <div className="rounded-xl border-2 border-primary/40 bg-accent/30 p-4 text-center print:border-black">
        <Stamp
          className="mx-auto mb-2 h-8 w-8 text-primary"
          aria-hidden="true"
        />
        <p className="font-serif text-2xl font-bold text-primary">
          {summary.rank ? pick(summary.rank.title, lang) : pp.noRank}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {pp.summary(summary.places, summary.nights)}
        </p>
        {summary.next && (
          <p className="mt-1 text-xs text-muted-foreground">
            {pp.toNext(
              summary.next.missing,
              pick(summary.next.rank.title, lang)
            )}
          </p>
        )}
      </div>

      {tripsQuery.isLoading ? (
        <Skeleton className="mt-6 h-40 w-full rounded-lg" />
      ) : summary.stamps.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {pp.empty}
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {summary.stamps.map(stamp => (
            <li
              key={stamp.place}
              className="flex flex-col items-center rounded-lg border border-border/70 bg-background p-3 text-center"
            >
              <StampMark
                stamp={stamp}
                label={pp.stampAria(stamp.place, stamp.visits)}
              />
              <span className="mt-1 text-sm font-medium">{stamp.place}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(stamp.firstVisit).toLocaleDateString(
                  LOCALE_TAGS[lang]
                )}
              </span>
              <span className="text-xs text-muted-foreground">
                {pp.nights(stamp.nights)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {summary.stamps.length > 0 && (
        <Button
          variant="outline"
          className="mt-6 w-full print:hidden"
          onClick={() => window.print()}
        >
          <Printer className="mr-2 h-4 w-4" aria-hidden="true" />
          {pp.print}
        </Button>
      )}

      <p className="mt-6 text-xs text-muted-foreground print:hidden">
        {pp.note}
      </p>
    </div>
  );
}
