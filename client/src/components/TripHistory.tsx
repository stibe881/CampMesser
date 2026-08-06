/**
 * Änderungsverlauf pro Reise (#296): wer hat wann was geändert.
 *
 * Aufklappbar wie die Nachbarn in der Reise-Karte, und geladen wird erst
 * beim Öffnen – der Verlauf ist Nachschlagewerk, nicht Startbild.
 *
 * NUR BEI GEMEINSAMEN REISEN eingeblendet (siehe Trips.tsx): Allein ist
 * die Frage «wer war das» schon beantwortet.
 */
import { useMemo, useState } from "react";
import { ChevronDown, History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useTripSectionCounts } from "@/hooks/useTripSectionCounts";
import { useI18n } from "@/i18n";
import { LOCALE_TAGS, pick } from "@shared/i18n";
import {
  ACTION_LABELS,
  AREA_LABELS,
  groupByDay,
  isChangeAction,
  isChangeArea,
  shownLabels,
  type ChangeGroup,
} from "@shared/tripHistory";
import { cn } from "@/lib/utils";

export default function TripHistory({
  tripId,
  tripName,
}: {
  tripId: number;
  tripName: string;
}) {
  const { lang, t } = useI18n();
  const th = t.tripHistory;
  const [open, setOpen] = useState(false);

  const query = trpc.trips.history.useQuery({ tripId }, { enabled: open });

  const days = useMemo(
    () => groupByDay(query.data?.groups ?? []),
    [query.data]
  );
  const names = query.data?.names ?? {};
  const total = query.data?.groups.length ?? 0;
  /**
   * Zugeklappt kommt die Zahl aus dem gemeinsamen Zähler (#346).
   *
   * EHRLICHE UNSCHÄRFE: Der Verlauf wächst durch Änderungen ANDERSWO –
   * eine neue Ausgabe, ein Häkchen auf der Packliste. Diese Stellen
   * erneuern den Zähler nicht; die Zahl kann also bis zum nächsten
   * Seitenaufbau eine zu tief stehen. Für «ist da was passiert?» genügt
   * das, und jede Mutation der App darauf zu verpflichten wäre eine
   * Fessel für eine Nebensache.
   */
  const stored = useTripSectionCounts(tripId);
  const badgeTotal = open && !query.isLoading ? total : (stored?.changes ?? 0);

  const timeOf = (at: number) =>
    new Intl.DateTimeFormat(LOCALE_TAGS[lang], {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(at));

  const dayLabel = (day: string) =>
    new Intl.DateTimeFormat(LOCALE_TAGS[lang], {
      weekday: "short",
      day: "2-digit",
      month: "short",
    }).format(new Date(`${day}T12:00:00`));

  /** «Anna hat die Reisekasse ergänzt» – ohne Satzbau-Akrobatik. */
  const describe = (group: ChangeGroup) => {
    const who = names[String(group.userId)] ?? th.someone;
    const area = isChangeArea(group.area)
      ? pick(AREA_LABELS[group.area], lang)
      : group.area;
    const action = isChangeAction(group.action)
      ? pick(ACTION_LABELS[group.action], lang)
      : group.action;
    return th.line(who, area, action, group.count);
  };

  return (
    <div className="mt-2 rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={th.toggleAria(tripName)}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm"
      >
        <History className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-left font-medium">
          {th.title}
        </span>
        {badgeTotal > 0 && (
          <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
            {th.count(badgeTotal)}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="border-t border-border px-3 py-2.5">
          {query.isLoading ? (
            <Skeleton className="h-24 w-full rounded" />
          ) : days.length === 0 ? (
            <p className="text-xs text-muted-foreground">{th.empty}</p>
          ) : (
            <ol className="space-y-3">
              {days.map(day => (
                <li key={day.day}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {dayLabel(day.day)}
                  </p>
                  <ul className="mt-1 space-y-1.5">
                    {day.groups.map(group => {
                      const { shown, more } = shownLabels(group);
                      return (
                        <li key={group.id} className="flex gap-2 text-sm">
                          <span className="w-11 shrink-0 tabular-nums text-xs text-muted-foreground">
                            {timeOf(group.at)}
                          </span>
                          <span className="min-w-0">
                            {describe(group)}
                            {shown.length > 0 && (
                              <span className="text-muted-foreground">
                                {" – "}
                                {shown.join(", ")}
                                {more > 0 ? ` ${th.andMore(more)}` : ""}
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-3 text-xs text-muted-foreground">{th.note}</p>
        </div>
      )}
    </div>
  );
}
