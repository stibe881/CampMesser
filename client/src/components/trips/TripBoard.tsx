import { useMemo, useState } from "react";
import { useConfirm } from "@/components/ConfirmDialog";
import { relativeAge, type ShareExpiryDays } from "@shared/sharing";
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarClock,
  CalendarPlus,
  Clock,
  CalendarDays,
  ChevronDown,
  CloudSun,
  Copy,
  Eye,
  EyeOff,
  CopyPlus,
  Download,
  Fuel,
  Gauge,
  GraduationCap,
  LayoutGrid,
  List,
  ListChecks,
  Loader2,
  LogOut,
  MapPin,
  MapPinned,
  MessageSquare,
  Moon,
  Pencil,
  Pin,
  Plus,
  Printer,
  Share2,
  ShoppingBasket,
  Signpost,
  Sparkles,
  Star,
  Tent,
  Trash2,
  Trophy,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useI18n, useT } from "@/i18n";
import { LOCALE_TAGS, pick, type Language } from "@shared/i18n";
import {
  COLLAGE_LAYOUTS,
  collageCapacity,
  type CollageLayoutId,
} from "@shared/collageLayout";
import { cn } from "@/lib/utils";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_DESCRIPTION_MAX_LENGTH,
  EXPENSE_MAX_RAPPEN,
  EXPENSE_PAID_BY_MAX_LENGTH,
  expensesByCategory,
  budgetStatus,
  BUDGET_MAX_RAPPEN,
  expensesTotalRappen,
  normalizeExpenseCategory,
  settleUp,
  type ExpenseCategory,
} from "@shared/expenses";
import {
  TRIP_BOARD_KINDS,
  TRIP_BOARD_KIND_LABELS,
  TRIP_BOARD_TEXT_MAX_LENGTH,
  isValidTripBoardText,
  normalizeTripBoardKind,
  tripBoardCounts,
  type TripBoardKind,
} from "@shared/tripBoard";
import { buildTripIcs, icsFileName, type IcsTrip } from "@shared/ics";
import {
  countMainSlots,
  tripReadiness,
  type ReadinessKey,
} from "@shared/tripReadiness";
import {
  packingSuggestions,
  type ForecastDay,
  type PackSuggestion,
} from "@shared/packSuggestions";
import { loadCantonHolidays, type CantonHolidays } from "@/lib/holidays";
import { useHashSection } from "@/hooks/useHashSection";
import { useTripSectionCounts } from "@/hooks/useTripSectionCounts";
import TripCalendar, { type CalendarTrip } from "@/components/TripCalendar";

export default function TripBoard({
  tripId,
  tripName,
  shared,
}: {
  tripId: number;
  tripName: string;
  /**
   * Gemeinsame Reise? Ändert NUR den Hinweistext (#344). Die Pinnwand gibt
   * es seit #344 bei jeder Reise – siehe den Hinweis am Aufrufer –, aber
   * «Zurufe für alle Mitreisenden» wäre allein eine seltsame Ansage.
   */
  shared: boolean;
}) {
  const ask = useConfirm();
  const { lang, t } = useI18n();
  const utils = trpc.useUtils();
  // Tiefer Link aus der «Heute»-Ansicht (#343/#344)
  const { matched: deepLinked, ref: cardRef } = useHashSection("#pinnwand");
  const [open, setOpen] = useState(deepLinked);
  const [kind, setKind] = useState<TripBoardKind>("message");
  const [draft, setDraft] = useState("");
  const query = trpc.trips.board.list.useQuery(
    { tripId },
    // Refetch-Intervall wie bei den geteilten Listen (SharedPackList/SharedTrip)
    { enabled: open, refetchInterval: open ? 15000 : false }
  );
  const addMutation = trpc.trips.board.add.useMutation({
    onSuccess: () => {
      utils.trips.board.list.invalidate({ tripId });
      utils.trips.counts.invalidate();
      setDraft("");
      toast.success(t.tripBoard.added);
    },
    onError: e => toast.error(e.message || t.tripBoard.addFailed),
  });
  const doneMutation = trpc.trips.board.setDone.useMutation({
    onSuccess: () => {
      utils.trips.board.list.invalidate({ tripId });
      utils.trips.counts.invalidate();
    },
    onError: e => toast.error(e.message || t.tripBoard.doneFailed),
  });
  const removeMutation = trpc.trips.board.remove.useMutation({
    onSuccess: () => {
      utils.trips.board.list.invalidate({ tripId });
      utils.trips.counts.invalidate();
      toast.success(t.tripBoard.removed);
    },
    onError: e => toast.error(e.message || t.tripBoard.removeFailed),
  });

  const notes = query.data ?? [];
  const counts = useMemo(() => tripBoardCounts(notes), [notes]);
  // Zugeklappt kommt die Zahl aus dem gemeinsamen Zähler (#346); offen
  // zählt die geladene Liste, weil sie nach dem Abhaken sofort stimmt.
  const stored = useTripSectionCounts(tripId);
  const badgeOpenTasks =
    open && !query.isLoading ? counts.openTasks : (stored?.openTasks ?? 0);

  /** «vor 5 Minuten» in der aktiven Sprache (Muster SharedLocation/Sos). */
  const ago = (timestamp: Date | string) => {
    const { value, unit } = relativeAge(timestamp);
    return new Intl.RelativeTimeFormat(LOCALE_TAGS[lang], {
      numeric: "auto",
    }).format(value, unit);
  };

  const submit = () => {
    if (!isValidTripBoardText(draft)) {
      toast.error(t.tripBoard.textRequired);
      return;
    }
    addMutation.mutate({ tripId, kind, text: draft });
  };

  return (
    <div ref={cardRef} className="mt-2 rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={t.tripBoard.toggleAria(tripName)}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm"
      >
        <Pin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-left font-medium">
          {t.tripBoard.title}
        </span>
        {badgeOpenTasks > 0 && (
          <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
            {t.tripBoard.openTasks(badgeOpenTasks)}
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
          <p className="mb-2 text-xs text-muted-foreground">
            {shared ? t.tripBoard.hint : t.tripBoard.hintSolo}
          </p>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start">
            <Select
              value={kind}
              onValueChange={v => setKind(v as TripBoardKind)}
            >
              <SelectTrigger
                className="sm:w-40"
                aria-label={t.tripBoard.kindAria}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRIP_BOARD_KINDS.map(k => (
                  <SelectItem key={k} value={k}>
                    {pick(TRIP_BOARD_KIND_LABELS[k], lang)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              value={draft}
              rows={2}
              maxLength={TRIP_BOARD_TEXT_MAX_LENGTH}
              placeholder={
                kind === "task"
                  ? t.tripBoard.taskPlaceholder
                  : t.tripBoard.messagePlaceholder
              }
              onChange={e => setDraft(e.target.value)}
              aria-label={t.tripBoard.textAria}
              className="flex-1"
            />
            <Button
              size="sm"
              className="shrink-0"
              disabled={addMutation.isPending}
              onClick={submit}
            >
              <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.tripBoard.addButton}
            </Button>
          </div>
          {query.isLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t.common.loading}
            </p>
          ) : notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.tripBoard.empty}</p>
          ) : (
            <ul className="space-y-2">
              {notes.map(note => {
                const isTask = normalizeTripBoardKind(note.kind) === "task";
                const done = isTask && note.done;
                return (
                  <li
                    key={note.id}
                    className={cn(
                      "flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2",
                      done && "opacity-60"
                    )}
                  >
                    {isTask ? (
                      <Checkbox
                        checked={note.done}
                        disabled={doneMutation.isPending}
                        onCheckedChange={checked =>
                          doneMutation.mutate({
                            id: note.id,
                            done: checked === true,
                          })
                        }
                        aria-label={t.tripBoard.doneAria(note.text)}
                        className="mt-0.5 shrink-0"
                      />
                    ) : (
                      <MessageSquare
                        className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "whitespace-pre-line break-words text-sm",
                          done && "line-through"
                        )}
                      >
                        {note.text}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t.tripBoard.byLine(
                          note.createdByName ?? t.tripBoard.unknownPerson,
                          ago(note.createdAt)
                        )}
                      </p>
                      {done && note.doneAt && (
                        <p className="text-xs text-muted-foreground">
                          {t.tripBoard.doneLine(
                            note.doneByName ?? t.tripBoard.unknownPerson,
                            ago(note.doneAt)
                          )}
                        </p>
                      )}
                    </div>
                    {note.canRemove && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground/60 hover:text-destructive"
                        disabled={removeMutation.isPending}
                        onClick={async () => {
                          if (
                            !(await ask({ title: t.tripBoard.removeConfirm }))
                          )
                            return;
                          removeMutation.mutate({ id: note.id });
                        }}
                        aria-label={t.tripBoard.removeAria(note.text)}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/** Balkenfarbe je Kategorie – feste Zuordnung, damit sie wiedererkennbar bleibt. */
