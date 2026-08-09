/**
 * Reise-Zeitachse (#626): Journal, Tages-Fotos, Ausgaben und
 * Etappenwechsel chronologisch gemischt – die Reise als Geschichte statt
 * als Abschnitts-Stapel. Aufklappbar wie das Journal; alle Daten kommen
 * erst beim Öffnen (enabled-Flag), die Abfragen selbst existieren längst
 * (Journal #192, Fotos #55, Reisekasse #219, Etappen #556) – hier wird
 * nur gemischt, nichts doppelt gespeichert.
 */
import { useMemo, useState } from "react";
import {
  BookOpen,
  Camera,
  ChevronDown,
  History,
  Loader2,
  Signpost,
  Wallet,
} from "lucide-react";
import { fmtWeekdayLong } from "@/lib/dateFormat";
import { formatChf } from "@/lib/money";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/i18n";
import { pick } from "@shared/i18n";
import {
  EXPENSE_CATEGORY_LABELS,
  normalizeExpenseCategory,
  normalizeExpenseCurrency,
} from "@shared/expenses";
import { cn } from "@/lib/utils";

interface DayEvents {
  day: string;
  stageArrivals: string[];
  journal: { text: string; photoFileName: string | null }[];
  photos: { id: number; fileName: string }[];
  expenses: { id: number; label: string; amount: string }[];
}

export default function TripTimeline({
  tripId,
  tripName,
}: {
  tripId: number;
  tripName: string;
}) {
  const { lang, t } = useI18n();
  const [open, setOpen] = useState(false);

  const journalQuery = trpc.trips.journal.list.useQuery(
    { tripId },
    { enabled: open }
  );
  const photosQuery = trpc.trips.photos.list.useQuery(
    { tripId },
    { enabled: open }
  );
  const expensesQuery = trpc.trips.expenses.list.useQuery(
    { tripId },
    { enabled: open }
  );
  const stopsQuery = trpc.trips.stops.list.useQuery(
    { tripId },
    { enabled: open, staleTime: 5 * 60_000 }
  );

  const loading =
    open &&
    (journalQuery.isLoading ||
      photosQuery.isLoading ||
      expensesQuery.isLoading ||
      stopsQuery.isLoading);

  /** Alle Ereignisse nach Tag gebündelt, chronologisch aufsteigend. */
  const days = useMemo<DayEvents[]>(() => {
    const byDay = new Map<string, DayEvents>();
    const dayOf = (iso: string): DayEvents => {
      let entry = byDay.get(iso);
      if (!entry) {
        entry = {
          day: iso,
          stageArrivals: [],
          journal: [],
          photos: [],
          expenses: [],
        };
        byDay.set(iso, entry);
      }
      return entry;
    };
    for (const stop of stopsQuery.data ?? []) {
      dayOf(stop.startDate).stageArrivals.push(stop.name);
    }
    for (const entry of journalQuery.data ?? []) {
      dayOf(entry.day).journal.push({
        text: entry.text,
        photoFileName: entry.photoFileName ?? null,
      });
    }
    for (const photo of photosQuery.data ?? []) {
      // Reise-Fotos tragen kein Aufnahmedatum – der Upload-Zeitpunkt ist
      // die ehrlichste Näherung, die es gibt.
      const iso = new Date(photo.createdAt).toISOString().slice(0, 10);
      dayOf(iso).photos.push({ id: photo.id, fileName: photo.fileName });
    }
    for (const expense of expensesQuery.data ?? []) {
      const currency = normalizeExpenseCurrency(expense.currency);
      dayOf(expense.day).expenses.push({
        id: expense.id,
        label:
          expense.description?.trim() ||
          pick(
            EXPENSE_CATEGORY_LABELS[normalizeExpenseCategory(expense.category)],
            lang
          ),
        amount: `${formatChf(expense.amountRappen, lang)} ${currency}`,
      });
    }
    return Array.from(byDay.values()).sort((a, b) =>
      a.day.localeCompare(b.day)
    );
  }, [
    stopsQuery.data,
    journalQuery.data,
    photosQuery.data,
    expensesQuery.data,
    lang,
  ]);

  const fmtDay = (iso: string) =>
    fmtWeekdayLong(new Date(`${iso}T00:00:00`), lang);

  return (
    <div className="mt-2 rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={t.trips.timelineToggleAria(tripName)}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm"
      >
        <History className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-left font-medium">
          {t.trips.timelineTitle}
        </span>
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
          {loading ? (
            <p
              role="status"
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t.common.loading}
            </p>
          ) : days.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t.trips.timelineEmpty}
            </p>
          ) : (
            <ol className="space-y-3 border-l-2 border-border pl-3">
              {days.map(day => (
                <li key={day.day}>
                  <p className="text-xs font-semibold capitalize text-muted-foreground">
                    {fmtDay(day.day)}
                  </p>
                  <div className="mt-1 space-y-1.5">
                    {day.stageArrivals.map(name => (
                      <p
                        key={name}
                        className="flex items-center gap-1.5 text-sm font-medium"
                      >
                        <Signpost
                          className="h-3.5 w-3.5 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        {t.trips.timelineArrival(name)}
                      </p>
                    ))}
                    {day.journal.map((entry, index) => (
                      <div key={index} className="flex items-start gap-1.5">
                        <BookOpen
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="whitespace-pre-line text-sm">
                            {entry.text}
                          </p>
                          {entry.photoFileName && (
                            <img
                              src={`/api/trips/journal/photos/${entry.photoFileName}`}
                              alt=""
                              loading="lazy"
                              className="mt-1 h-16 w-16 rounded-md object-cover"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                    {day.photos.length > 0 && (
                      <div className="flex items-start gap-1.5">
                        <Camera
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <div className="flex flex-wrap gap-1.5">
                          {day.photos.map(photo => (
                            <img
                              key={photo.id}
                              src={`/api/trips/photos/${photo.fileName}`}
                              alt=""
                              loading="lazy"
                              className="h-14 w-14 rounded-md object-cover"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {day.expenses.map(expense => (
                      <p
                        key={expense.id}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground"
                      >
                        <Wallet
                          className="h-3.5 w-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1 truncate">
                          {expense.label}
                        </span>
                        <span className="shrink-0 tabular-nums">
                          {expense.amount}
                        </span>
                      </p>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
