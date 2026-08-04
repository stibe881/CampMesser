/**
 * Termin-Finder (#253): Wann können alle? Mitreisende schlagen Zeiträume
 * vor und antworten je Vorschlag mit Ja, Vielleicht oder Nein.
 *
 * Der Abschnitt hängt an einer bestehenden Reise – wer mitreist, steht
 * damit schon fest, und der gewählte Termin wandert per Knopfdruck in die
 * An- und Abreise derselben Reise. Bis dahin trägt die Reise das zuerst
 * eingetragene Datum; die Abstimmung ändert nichts hinter dem Rücken.
 *
 * Gezeigt wird nur bei gemeinsamen Reisen: Allein braucht niemand eine
 * Abstimmung mit sich selbst.
 *
 * Die Auswertung (Rangliste, Sieger, «entschieden») liegt vollständig in
 * `shared/datePoll.ts` und ist getestet; hier steht Bedienung und Anzeige.
 */
import { useMemo, useState } from "react";
import {
  Calendar,
  Check,
  ChevronDown,
  CircleHelp,
  Plus,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { LOCALE_TAGS } from "@shared/i18n";
import {
  bestOption,
  isDecided,
  isValidOptionRange,
  MAX_DATE_OPTIONS,
  MAX_OPTION_NOTE_LENGTH,
  pollProgress,
  rankOptions,
  VOTE_VALUES,
  type Vote,
} from "@shared/datePoll";
import { cn } from "@/lib/utils";

/** Symbol je Antwort – dieselbe Reihenfolge wie die Knöpfe. */
const VOTE_ICONS = { yes: Check, maybe: CircleHelp, no: X } as const;

export default function TripDatePoll({
  tripId,
  tripName,
}: {
  tripId: number;
  tripName: string;
}) {
  const { lang, t } = useI18n();
  const tp = t.datePoll;
  const utils = trpc.useUtils();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");

  const query = trpc.trips.dates.list.useQuery(
    { tripId },
    // Wie die Pinnwand: solange offen, regelmässig nachsehen – bei einer
    // Abstimmung will man die Antwort der anderen sehen, ohne neu zu laden.
    { enabled: open, refetchInterval: open ? 15000 : false }
  );

  const invalidate = () => utils.trips.dates.list.invalidate({ tripId });

  const addMutation = trpc.trips.dates.add.useMutation({
    onSuccess: () => {
      invalidate();
      setStartDate("");
      setEndDate("");
      setNote("");
      toast.success(tp.added);
    },
    onError: e => toast.error(e.message || tp.addFailed),
  });
  const voteMutation = trpc.trips.dates.vote.useMutation({
    onSuccess: () => invalidate(),
    onError: e => toast.error(e.message || tp.voteFailed),
  });
  const removeMutation = trpc.trips.dates.remove.useMutation({
    onSuccess: () => {
      invalidate();
      toast.success(tp.removed);
    },
    onError: e => toast.error(e.message || tp.removeFailed),
  });
  const applyMutation = trpc.trips.dates.adopt.useMutation({
    onSuccess: () => {
      invalidate();
      utils.trips.list.invalidate();
      toast.success(tp.applied);
    },
    onError: e => toast.error(e.message || tp.applyFailed),
  });

  const data = query.data;
  const participantIds = useMemo(
    () => (data?.participants ?? []).map(p => p.userId),
    [data]
  );
  const votes = useMemo(
    () => (data?.votes ?? []).map(v => ({ ...v, vote: v.vote as Vote })),
    [data]
  );
  const ranked = useMemo(
    () => rankOptions(data?.options ?? [], votes, participantIds),
    [data, votes, participantIds]
  );
  const winner = bestOption(ranked);
  const decided = isDecided(ranked);
  const progress = pollProgress(data?.options ?? [], votes, participantIds);
  const nameOf = (userId: number) =>
    data?.participants.find(p => p.userId === userId)?.name ?? `#${userId}`;

  const formatRange = (start: string, end: string) => {
    const fmt = new Intl.DateTimeFormat(LOCALE_TAGS[lang], {
      day: "2-digit",
      month: "short",
    });
    return `${fmt.format(new Date(`${start}T12:00:00`))} – ${fmt.format(
      new Date(`${end}T12:00:00`)
    )}`;
  };

  const submit = () => {
    if (!isValidOptionRange(startDate, endDate)) {
      toast.error(tp.rangeInvalid);
      return;
    }
    addMutation.mutate({ tripId, startDate, endDate, note: note || undefined });
  };

  const myVote = (optionId: number): Vote | null => {
    if (!user) return null;
    const found = votes.find(
      v => v.optionId === optionId && v.userId === user.id
    );
    return found ? found.vote : null;
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
        <Calendar
          className="h-4 w-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate text-left font-medium">
          {tp.title}
        </span>
        {open && !query.isLoading && progress.expected > 0 && (
          <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
            {tp.progress(progress.answered, progress.expected)}
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
          <p className="mb-2 text-xs text-muted-foreground">{tp.hint}</p>

          {query.isLoading && (
            <Skeleton
              className="h-24 w-full rounded-lg"
              aria-label={tp.title}
            />
          )}

          {!query.isLoading && ranked.length === 0 && (
            <p className="text-sm text-muted-foreground">{tp.empty}</p>
          )}

          {ranked.length > 0 && (
            <ul className="space-y-2">
              {ranked.map(tally => {
                const isWinner = winner?.option.id === tally.option.id;
                const mine = myVote(tally.option.id);
                const missing = participantIds.filter(
                  id =>
                    !votes.some(
                      v => v.optionId === tally.option.id && v.userId === id
                    )
                );
                return (
                  <li
                    key={tally.option.id}
                    className={cn(
                      "rounded-lg border px-3 py-2",
                      isWinner
                        ? "border-primary bg-primary/5"
                        : "border-border bg-muted/20"
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      {isWinner && (
                        <Trophy
                          className="h-4 w-4 shrink-0 text-primary"
                          aria-label={tp.leadingAria}
                        />
                      )}
                      <span className="font-medium">
                        {formatRange(
                          tally.option.startDate,
                          tally.option.endDate
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {tp.nights(tally.nights)}
                      </span>
                      {tally.unanimous && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {tp.unanimous}
                        </span>
                      )}
                      {(data?.isOwner ||
                        tally.option.createdByUserId === user?.id) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-auto h-7 w-7 text-muted-foreground/60 hover:text-destructive"
                          onClick={() =>
                            removeMutation.mutate({ optionId: tally.option.id })
                          }
                          aria-label={tp.removeAria(
                            formatRange(
                              tally.option.startDate,
                              tally.option.endDate
                            )
                          )}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      )}
                    </div>

                    {tally.option.note && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {tally.option.note}
                      </p>
                    )}

                    <div
                      className="mt-2 flex flex-wrap gap-1.5"
                      role="group"
                      aria-label={tp.voteGroupAria}
                    >
                      {VOTE_VALUES.map(value => {
                        const Icon = VOTE_ICONS[value];
                        const active = mine === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            aria-pressed={active}
                            disabled={voteMutation.isPending}
                            onClick={() =>
                              voteMutation.mutate({
                                optionId: tally.option.id,
                                vote: value,
                              })
                            }
                            className={cn(
                              "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors",
                              active
                                ? "border-primary bg-accent text-accent-foreground"
                                : "border-border text-muted-foreground hover:border-primary/40"
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                            {tp.voteLabel[value]}
                            <span className="font-medium">
                              {value === "yes"
                                ? tally.yes
                                : value === "maybe"
                                  ? tally.maybe
                                  : tally.no}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {missing.length > 0 && (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {tp.missing(missing.map(nameOf).join(", "))}
                      </p>
                    )}

                    {data?.isOwner &&
                      (tally.option.startDate !== data.tripStartDate ||
                        tally.option.endDate !== data.tripEndDate) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          disabled={applyMutation.isPending}
                          onClick={() =>
                            applyMutation.mutate({ optionId: tally.option.id })
                          }
                        >
                          {tp.applyButton}
                        </Button>
                      )}
                    {tally.option.startDate === data?.tripStartDate &&
                      tally.option.endDate === data?.tripEndDate && (
                        <p className="mt-1.5 text-xs font-medium text-primary">
                          {tp.currentDate}
                        </p>
                      )}
                  </li>
                );
              })}
            </ul>
          )}

          {decided && winner && (
            <p className="mt-2 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
              {tp.decided(
                formatRange(winner.option.startDate, winner.option.endDate)
              )}
            </p>
          )}

          {/* Neuer Vorschlag */}
          {ranked.length < MAX_DATE_OPTIONS ? (
            <div className="mt-3 border-t border-border pt-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex-1">
                  <label
                    className="text-xs text-muted-foreground"
                    htmlFor={`poll-start-${tripId}`}
                  >
                    {tp.startLabel}
                  </label>
                  <Input
                    id={`poll-start-${tripId}`}
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label
                    className="text-xs text-muted-foreground"
                    htmlFor={`poll-end-${tripId}`}
                  >
                    {tp.endLabel}
                  </label>
                  <Input
                    id={`poll-end-${tripId}`}
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <Input
                className="mt-2"
                value={note}
                maxLength={MAX_OPTION_NOTE_LENGTH}
                placeholder={tp.notePlaceholder}
                aria-label={tp.noteAria}
                onChange={e => setNote(e.target.value)}
              />
              <Button
                size="sm"
                className="mt-2"
                disabled={addMutation.isPending}
                onClick={submit}
              >
                <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {tp.addButton}
              </Button>
            </div>
          ) : (
            <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
              {tp.maxReached(MAX_DATE_OPTIONS)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
