/**
 * Tagesplan einer Reise (#666, Nutzerwunsch 10.08.2026): pro Reisetag
 * eintragen, WAS ansteht – «Di: Wanderung Seealpsee, 14:00 Schwimmbad».
 *
 * WARUM EIN EIGENER ABSCHNITT und nicht der Menüplan oder das Journal:
 * Der Menüplan beantwortet «was essen wir», das Journal «wie war es» –
 * beide zu IHREM Zeitpunkt. Der Tagesplan beantwortet «was haben wir
 * vor», VOR der Reise beim Planen und unterwegs als Checkliste: Die
 * Heute-Ansicht zeigt die Einträge des Tages zum Abhaken.
 *
 * Aufklappbar wie Journal und Reisekasse – geladen erst beim Öffnen.
 * Einträge gehören zur REISE (Mitreisende planen mit); optionale Zeit
 * sortiert den Tag, Einträge ohne Zeit folgen dahinter.
 */
import { useMemo, useState } from "react";
import {
  CalendarCheck,
  ChevronDown,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ConfirmDialog";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/i18n";
import { fmtWeekdayLong } from "@/lib/dateFormat";
import { tripDays } from "@shared/menuPlan";
import {
  TRIP_PLAN_TITLE_MAX_LENGTH,
  planItemsForDay,
  planProgress,
} from "@shared/tripPlan";
import { cn } from "@/lib/utils";

export default function TripPlan({
  tripId,
  tripName,
  startDate,
  endDate,
  today,
}: {
  tripId: number;
  tripName: string;
  startDate: string;
  endDate: string;
  /** Heutiges ISO-Datum – hebt den laufenden Tag hervor. */
  today: string;
}) {
  const { lang, t } = useI18n();
  const tp = t.tripPlan;
  const ask = useConfirm();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  /** Tag, dessen Eintrags-Formular offen ist (null = keines). */
  const [addingDay, setAddingDay] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [timeAt, setTimeAt] = useState("");
  /** Eintrag, der gerade bearbeitet wird (null = keiner). */
  const [editingId, setEditingId] = useState<number | null>(null);

  const query = trpc.trips.plan.list.useQuery({ tripId }, { enabled: open });
  const items = useMemo(() => query.data ?? [], [query.data]);
  const progress = useMemo(() => planProgress(items), [items]);
  const days = useMemo(
    () => tripDays(startDate, endDate),
    [startDate, endDate]
  );

  const invalidate = () => utils.trips.plan.list.invalidate({ tripId });
  const closeForm = () => {
    setAddingDay(null);
    setEditingId(null);
    setTitle("");
    setTimeAt("");
  };

  const addMutation = trpc.trips.plan.add.useMutation({
    onSuccess: () => {
      invalidate();
      // Formular offen lassen, nur leeren – oft plant man mehrere
      // Punkte für denselben Tag nacheinander.
      setTitle("");
      setTimeAt("");
    },
    onError: e => toast.error(e.message || t.common.saveFailed),
  });
  const updateMutation = trpc.trips.plan.update.useMutation({
    onSuccess: () => {
      invalidate();
      closeForm();
    },
    onError: e => toast.error(e.message || t.common.saveFailed),
  });
  const toggleMutation = trpc.trips.plan.toggle.useMutation({
    onSuccess: invalidate,
    onError: () => toast.error(t.common.actionFailed),
  });
  const removeMutation = trpc.trips.plan.remove.useMutation({
    onSuccess: invalidate,
    onError: () => toast.error(t.common.actionFailed),
  });

  const fmtDay = (iso: string) =>
    fmtWeekdayLong(new Date(`${iso}T00:00:00`), lang);

  const submit = (day: string) => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    const time = /^([01]\d|2[0-3]):[0-5]\d$/.test(timeAt) ? timeAt : null;
    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, title: cleanTitle, timeAt: time });
    } else {
      addMutation.mutate({ tripId, day, title: cleanTitle, timeAt: time });
    }
  };

  return (
    <div className="mt-2 rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={tp.toggleAria(tripName)}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm"
      >
        <CalendarCheck
          className="h-4 w-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate text-left font-medium">
          {tp.title}
        </span>
        {open && !query.isLoading && progress.total > 0 && (
          <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
            {tp.count(progress.done, progress.total)}
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
            <Skeleton className="h-24 w-full rounded-md" />
          ) : (
            <>
              <p className="mb-2 text-xs text-muted-foreground">{tp.hint}</p>
              <ul className="space-y-2.5">
                {days.map(day => {
                  const dayItems = planItemsForDay(items, day);
                  const adding = addingDay === day;
                  return (
                    <li key={day}>
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            "min-w-0 flex-1 truncate text-xs font-semibold capitalize",
                            day === today
                              ? "text-primary"
                              : "text-muted-foreground"
                          )}
                        >
                          {fmtDay(day)}
                          {day === today && ` · ${tp.todayBadge}`}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground/60 hover:text-foreground"
                          aria-label={tp.addAria(fmtDay(day))}
                          onClick={() => {
                            if (adding) {
                              closeForm();
                            } else {
                              closeForm();
                              setAddingDay(day);
                            }
                          }}
                        >
                          {adding ? (
                            <X className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                        </Button>
                      </div>
                      {dayItems.length > 0 && (
                        <ul className="mt-1 space-y-1">
                          {dayItems.map(item => (
                            <li
                              key={item.id}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="checkbox"
                                checked={item.done}
                                onChange={() =>
                                  toggleMutation.mutate({
                                    id: item.id,
                                    done: !item.done,
                                  })
                                }
                                aria-label={tp.doneAria(item.title)}
                                className="h-4 w-4 shrink-0 accent-primary"
                              />
                              {item.timeAt && (
                                <span className="shrink-0 rounded bg-accent px-1.5 py-0.5 font-mono text-xs text-accent-foreground">
                                  {item.timeAt}
                                </span>
                              )}
                              <span
                                className={cn(
                                  "min-w-0 flex-1 break-words text-sm",
                                  item.done &&
                                    "text-muted-foreground line-through"
                                )}
                              >
                                {item.title}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  closeForm();
                                  setAddingDay(day);
                                  setEditingId(item.id);
                                  setTitle(item.title);
                                  setTimeAt(item.timeAt ?? "");
                                }}
                                className="shrink-0 text-muted-foreground/60 transition-colors hover:text-foreground"
                                aria-label={tp.editAria(item.title)}
                              >
                                <Pencil
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (
                                    await ask({
                                      title: tp.deleteConfirm(item.title),
                                    })
                                  ) {
                                    removeMutation.mutate({ id: item.id });
                                  }
                                }}
                                className="shrink-0 text-muted-foreground/60 transition-colors hover:text-destructive"
                                aria-label={tp.deleteAria(item.title)}
                              >
                                <Trash2
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      {adding && (
                        <form
                          className="mt-1.5 flex flex-wrap items-center gap-1.5"
                          onSubmit={e => {
                            e.preventDefault();
                            submit(day);
                          }}
                        >
                          <Input
                            autoFocus
                            value={title}
                            maxLength={TRIP_PLAN_TITLE_MAX_LENGTH}
                            placeholder={tp.titlePlaceholder}
                            aria-label={tp.titlePlaceholder}
                            onChange={e => setTitle(e.target.value)}
                            className="h-9 min-w-0 flex-1 basis-40"
                          />
                          <Input
                            type="time"
                            value={timeAt}
                            aria-label={tp.timeLabel}
                            onChange={e => setTimeAt(e.target.value)}
                            className="h-9 w-28 shrink-0"
                          />
                          <Button
                            type="submit"
                            size="sm"
                            className="shrink-0"
                            disabled={
                              !title.trim() ||
                              addMutation.isPending ||
                              updateMutation.isPending
                            }
                          >
                            {editingId !== null ? tp.save : tp.add}
                          </Button>
                        </form>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
