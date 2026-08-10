/**
 * Reiseziel-Ideen nach Monat (#654): «Wohin im Oktober?» – die Antwort
 * kommt aus den EIGENEN vergangenen Reisen (shared/monthIdeas.ts), nicht
 * aus einem Katalog. Vorausgewählt ist der NÄCHSTE Monat, denn geplant
 * wird nach vorn.
 */
import { useMemo, useState } from "react";
import { Lightbulb } from "lucide-react";
import { useI18n } from "@/i18n";
import { LOCALE_TAGS } from "@shared/i18n";
import { ideasForMonth } from "@shared/monthIdeas";

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function MonthIdeas({
  trips,
}: {
  trips: readonly {
    spotName?: string | null;
    location: string | null;
    title: string | null;
    startDate: string;
    endDate: string;
  }[];
}) {
  const { lang, t } = useI18n();
  const [month, setMonth] = useState(
    () => (new Date().getMonth() + 1) % 12 || 12
  );

  const monthName = (m: number) =>
    new Intl.DateTimeFormat(LOCALE_TAGS[lang], { month: "long" }).format(
      // Tag 15, damit keine Zeitzone den Monat verschiebt
      new Date(2026, m - 1, 15)
    );

  const ideas = useMemo(
    () =>
      ideasForMonth(
        trips.map(trip => ({
          placeName: trip.spotName || trip.location || trip.title || null,
          startDate: trip.startDate,
          endDate: trip.endDate,
        })),
        month
      ).slice(0, 6),
    [trips, month]
  );

  if (trips.length === 0) return null;

  return (
    <section
      className="mt-6 rounded-xl border border-border/70 bg-background p-4"
      aria-label={t.trips.monthIdeasAria}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Lightbulb
          className="h-4 w-4 shrink-0 text-chart-1"
          aria-hidden="true"
        />
        <h2 className="text-sm font-semibold">{t.trips.monthIdeasTitle}</h2>
        <select
          value={month}
          onChange={e => setMonth(Number(e.target.value))}
          aria-label={t.trips.monthIdeasAria}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
        >
          {MONTHS.map(m => (
            <option key={m} value={m}>
              {monthName(m)}
            </option>
          ))}
        </select>
      </div>
      {ideas.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {t.trips.monthIdeasEmpty(monthName(month))}
        </p>
      ) : (
        <ul className="mt-2 space-y-1">
          {ideas.map(idea => (
            <li key={idea.place} className="text-sm">
              <span className="font-medium">{idea.place}</span>{" "}
              <span className="text-muted-foreground">
                {t.trips.monthIdeasRow(idea.visits, idea.nights, idea.lastYear)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
