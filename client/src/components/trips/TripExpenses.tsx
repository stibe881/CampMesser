import { useEffect, useMemo, useRef, useState } from "react";
import {
  fmtDayMonth,
  fmtMedium,
  fmtShort,
  fmtWeekdayLong,
} from "@/lib/dateFormat";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import PitchCostEstimator from "./PitchCostEstimator";
import { trpc } from "@/lib/trpc";
import { useI18n, useT } from "@/i18n";
import { LOCALE_TAGS, pick, type Language } from "@shared/i18n";
import {
  COLLAGE_LAYOUTS,
  collageCapacity,
  type CollageLayoutId,
} from "@shared/collageLayout";
import { cn } from "@/lib/utils";
import { formatChf, parseChfInput, rappenToInput } from "@/lib/money";
import { useTodayIso } from "@/lib/useTodayIso";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_DESCRIPTION_MAX_LENGTH,
  EXPENSE_MAX_RAPPEN,
  EXPENSE_PAID_BY_MAX_LENGTH,
  expensesByCategory,
  budgetForecast,
  budgetStatus,
  BUDGET_MAX_RAPPEN,
  expensesTotalRappen,
  normalizeExpenseCategory,
  settleUp,
  type ExpenseCategory,
} from "@shared/expenses";
import { csvFileName, expensesToCsv } from "@shared/expensesCsv";
import {
  DEFAULT_CONSUMPTION_L100,
  DEFAULT_FUEL_PRICE_RAPPEN,
  fuelCost,
} from "@shared/fuelCost";
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
import TripCalendar, { type CalendarTrip } from "@/components/TripCalendar";
import { todayIso } from "@shared/localDate";

const EXPENSE_CATEGORY_BARS: Record<ExpenseCategory, string> = {
  camping: "bg-chart-1",
  essen: "bg-chart-2",
  sprit: "bg-chart-3",
  freizeit: "bg-chart-4",
  sonstiges: "bg-chart-5",
};

/**
 * Reisekasse einer Reise (#219): Ausgabenliste mit Summe, Aufteilung nach
 * Kategorie und «wer schuldet wem». Aufklappbar wie das Reise-Tagebuch –
 * die Ausgaben werden erst beim Öffnen geladen. Beträge stecken durchgehend
 * als Rappen-Ganzzahlen in der Datenbank; gerechnet wird in shared/expenses.ts.
 */
export default function TripExpenses({
  tripId,
  tripName,
  defaultDay,
  shared,
  budgetRappen,
  spotId,
  startDate,
  endDate,
}: {
  tripId: number;
  tripName: string;
  /** Vorschlag fürs Datumsfeld: heute, sonst der Reisebeginn. */
  defaultDay: string;
  shared: boolean;
  /** Reise-Budget in Rappen (#256); null = keins gesetzt. */
  budgetRappen: number | null;
  /** Verknüpfter Zeltplatz – Quelle der Tarife für die Schätzung (#386). */
  spotId: number | null;
  startDate: string;
  endDate: string;
}) {
  const ask = useConfirm();
  const { lang, t } = useI18n();
  const today = useTodayIso();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  /** null = Formular zu, "neu" = neue Ausgabe, sonst die Id der bearbeiteten. */
  const [editing, setEditing] = useState<number | "neu" | null>(null);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("essen");
  const [description, setDescription] = useState("");
  const [day, setDay] = useState(defaultDay);
  const [paidBy, setPaidBy] = useState("");
  /** Budget-Feld (#256): offen = Eingabe sichtbar. */
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  /** Fahrtkosten-Rechner (#259). */
  const [fuelOpen, setFuelOpen] = useState(false);
  const [fuelKm, setFuelKm] = useState("");
  const [fuelConsumption, setFuelConsumption] = useState(
    String(DEFAULT_CONSUMPTION_L100)
  );
  const [fuelPrice, setFuelPrice] = useState(
    rappenToInput(DEFAULT_FUEL_PRICE_RAPPEN)
  );
  const [fuelRoundTrip, setFuelRoundTrip] = useState(true);

  const query = trpc.trips.expenses.list.useQuery(
    { tripId },
    { enabled: open }
  );
  const expenses = useMemo(() => query.data ?? [], [query.data]);

  /**
   * Der Betrag am ZUGEKLAPPTEN Abschnitt (#345).
   *
   * Die Einzelposten kommen erst beim Aufklappen – zugeklappt gäbe es
   * also nichts zu summieren, und genau deshalb fehlte die Zahl bisher
   * dort, wo sie am meisten wert ist. Die Summen holt darum eine eigene,
   * kleine Abfrage über ALLE Reisen. Sie ist für jeden Abschnitt
   * dieselbe, TanStack Query macht daraus eine einzige Anfrage.
   */
  const totalsQuery = trpc.trips.expenses.totals.useQuery(undefined, {
    staleTime: 60_000,
  });
  const storedTotal =
    totalsQuery.data?.find(row => row.tripId === tripId)?.totalRappen ?? 0;

  const closeForm = () => {
    setEditing(null);
    setAmount("");
    setDescription("");
  };

  const invalidate = () => {
    utils.trips.expenses.list.invalidate({ tripId });
    // Auch die Summen (#345), sonst zeigte das Zeichen am zugeklappten
    // Abschnitt bis zum nächsten Seitenaufbau den alten Betrag.
    utils.trips.expenses.totals.invalidate();
  };

  const addMutation = trpc.trips.expenses.add.useMutation({
    onSuccess: () => {
      invalidate();
      closeForm();
      toast.success(t.tripExpenses.saved);
    },
    onError: e => toast.error(e.message || t.tripExpenses.saveFailed),
  });
  const updateMutation = trpc.trips.expenses.update.useMutation({
    onSuccess: () => {
      invalidate();
      closeForm();
      toast.success(t.tripExpenses.updated);
    },
    onError: e => toast.error(e.message || t.tripExpenses.saveFailed),
  });
  const removeMutation = trpc.trips.expenses.remove.useMutation({
    onSuccess: () => {
      invalidate();
      toast.success(t.tripExpenses.deleted);
    },
    onError: () => toast.error(t.tripExpenses.deleteFailed),
  });

  const total = useMemo(() => expensesTotalRappen(expenses), [expenses]);
  // Offen zählt die geladene Liste – sie ist nach dem Erfassen sofort
  // aktuell, während die Summen-Abfrage erst nachzieht.
  const badgeTotal = open && !query.isLoading ? total : storedTotal;
  const byCategory = useMemo(() => expensesByCategory(expenses), [expenses]);
  const budget = budgetStatus(total, budgetRappen);
  // Hochrechnung (#398): nur WÄHREND der Reise, solange Tage übrig sind –
  // die Regeln (Platz & Sprit einmalig) stehen in shared/expenses.ts.
  const forecast = useMemo(
    () =>
      budgetForecast({
        expenses,
        startDate,
        endDate,
        todayIso: today,
        budgetRappen,
      }),
    [expenses, startDate, endDate, today, budgetRappen]
  );
  const budgetMutation = trpc.trips.expenses.setBudget.useMutation({
    onSuccess: () => {
      utils.trips.list.invalidate();
      setEditingBudget(false);
      toast.success(t.tripExpenses.budgetSaved);
    },
    onError: e => toast.error(e.message || t.tripExpenses.budgetSaveFailed),
  });
  const settlements = useMemo(
    () =>
      settleUp(expenses.map(e => ({ who: e.paidBy, rappen: e.amountRappen }))),
    [expenses]
  );
  /** Bereits erfasste Zahlende – als Vorschläge fürs Namensfeld. */
  const knownPayers = useMemo(() => {
    const names: string[] = [];
    expenses.forEach(e => {
      const name = e.paidBy.trim();
      if (name && !names.some(n => n.toLowerCase() === name.toLowerCase())) {
        names.push(name);
      }
    });
    return names.slice(0, 6);
  }, [expenses]);

  const money = (rappen: number) =>
    `${t.tripExpenses.currency} ${formatChf(rappen, lang)}`;
  const fmtDay = (iso: string) => fmtShort(new Date(`${iso}T00:00:00`), lang);
  const labelOf = (expense: { description: string | null }) =>
    expense.description?.trim() || t.tripExpenses.untitled;

  const startNew = () => {
    setEditing("neu");
    setAmount("");
    setCategory("essen");
    setDescription("");
    setDay(defaultDay);
    setPaidBy(
      knownPayers[0] ?? user?.name ?? user?.email ?? t.tripExpenses.meFallback
    );
  };

  const startEditExpense = (expense: (typeof expenses)[number]) => {
    setEditing(expense.id);
    setAmount(rappenToInput(expense.amountRappen));
    setCategory(normalizeExpenseCategory(expense.category));
    setDescription(expense.description ?? "");
    setDay(expense.day);
    setPaidBy(expense.paidBy);
  };

  const submit = () => {
    const rappen = parseChfInput(amount);
    if (rappen === null || rappen < 1) {
      toast.error(t.tripExpenses.amountInvalid);
      return;
    }
    const who = paidBy.trim();
    if (!who) {
      toast.error(t.tripExpenses.paidByRequired);
      return;
    }
    const payload = {
      amountRappen: Math.min(rappen, EXPENSE_MAX_RAPPEN),
      category,
      description: description.trim().slice(0, EXPENSE_DESCRIPTION_MAX_LENGTH),
      day,
      paidBy: who.slice(0, EXPENSE_PAID_BY_MAX_LENGTH),
    };
    if (editing === "neu") addMutation.mutate({ tripId, ...payload });
    else if (typeof editing === "number")
      updateMutation.mutate({ id: editing, ...payload });
  };

  const busy = addMutation.isPending || updateMutation.isPending;

  /** Zwischenstand des Fahrtkosten-Rechners (#259). */
  const fuelResult = fuelCost({
    distanceKm: Number(fuelKm.replace(",", ".")) || 0,
    consumptionL100: Number(fuelConsumption.replace(",", ".")) || 0,
    pricePerLiterRappen: parseChfInput(fuelPrice) ?? 0,
    roundTrip: fuelRoundTrip,
  });

  /**
   * Ergebnis in die Reisekasse übernehmen: Das Formular wird VORAUSGEFÜLLT
   * statt sofort gespeichert – der Betrag ist eine Schätzung, und wer sie
   * nicht will, soll sie nicht erst wieder löschen müssen.
   */
  const applyFuelResult = () => {
    if (fuelResult.rappen < 1) {
      toast.error(t.tripExpenses.fuelInvalid);
      return;
    }
    setEditing("neu");
    setAmount(rappenToInput(fuelResult.rappen));
    setCategory("sprit");
    setDescription(
      t.tripExpenses.fuelDescription(Math.round(fuelResult.totalKm))
    );
    setDay(defaultDay);
    setPaidBy(
      knownPayers[0] ?? user?.name ?? user?.email ?? t.tripExpenses.meFallback
    );
    setFuelOpen(false);
  };

  /**
   * CSV herunterladen (#258): Die Datei entsteht im Browser aus den
   * bereits geladenen Zeilen – kein zweiter Abruf, und die Ausgaben
   * verlassen das Gerät nicht noch einmal.
   */
  const downloadCsv = () => {
    const csv = expensesToCsv(expenses, {
      headers: t.tripExpenses.csvHeaders,
      categoryLabel: category =>
        pick(EXPENSE_CATEGORY_LABELS[normalizeExpenseCategory(category)], lang),
      totalLabel: t.tripExpenses.total,
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = csvFileName(tripName, todayIso());
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-2 rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={t.tripExpenses.toggleAria(tripName)}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm"
      >
        <Wallet className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-left font-medium">
          {t.tripExpenses.title}
        </span>
        {/* Der Betrag steht auch ZUGEKLAPPT da (#345) – dort ist er der
            einzige Grund, den Abschnitt überhaupt anzusehen. */}
        {badgeTotal > 0 && (
          <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
            {money(badgeTotal)}
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
        <div className="space-y-3 border-t border-border px-3 py-2.5">
          <p className="text-xs text-muted-foreground">{t.tripExpenses.hint}</p>
          {/* Budget (#256): steht ÜBER den Ausgaben und auch dann, wenn
              noch keine erfasst ist – ein Budget setzt man vorher. */}
          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
            {editingBudget ? (
              <div className="flex flex-wrap items-center gap-2">
                <label
                  className="text-xs text-muted-foreground"
                  htmlFor={`budget-${tripId}`}
                >
                  {t.tripExpenses.budgetLabel}
                </label>
                <Input
                  id={`budget-${tripId}`}
                  inputMode="decimal"
                  className="w-28"
                  value={budgetInput}
                  placeholder="0.00"
                  onChange={e => setBudgetInput(e.target.value)}
                />
                <Button
                  size="sm"
                  disabled={budgetMutation.isPending}
                  onClick={() => {
                    const rappen = parseChfInput(budgetInput);
                    if (rappen === null || rappen < 1) {
                      toast.error(t.tripExpenses.budgetInvalid);
                      return;
                    }
                    budgetMutation.mutate({
                      tripId,
                      budgetRappen: Math.min(rappen, BUDGET_MAX_RAPPEN),
                    });
                  }}
                >
                  {t.common.save}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingBudget(false)}
                >
                  {t.common.cancel}
                </Button>
                {budgetRappen != null && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground"
                    disabled={budgetMutation.isPending}
                    onClick={() =>
                      budgetMutation.mutate({ tripId, budgetRappen: null })
                    }
                  >
                    {t.tripExpenses.budgetRemove}
                  </Button>
                )}
              </div>
            ) : budget ? (
              <>
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.tripExpenses.budgetTitle}
                  </span>
                  <span className="font-mono text-sm tabular-nums">
                    {money(budget.spentRappen)} / {money(budget.budgetRappen)}
                  </span>
                </div>
                <div
                  className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted"
                  role="img"
                  aria-label={t.tripExpenses.budgetBarAria(budget.percent)}
                >
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      budget.level === "over"
                        ? "bg-destructive"
                        : budget.level === "tight"
                          ? "bg-amber-500"
                          : "bg-primary"
                    )}
                    // Der Balken wird bei 100 % gekappt, die ZAHL nicht –
                    // «142 %» sagt mehr als ein voller Balken.
                    style={{ width: `${Math.min(100, budget.percent)}%` }}
                  />
                </div>
                <p
                  className={cn(
                    "mt-1 text-xs",
                    budget.level === "over"
                      ? "font-medium text-destructive"
                      : "text-muted-foreground"
                  )}
                >
                  {budget.level === "over"
                    ? t.tripExpenses.budgetOver(
                        money(-budget.remainingRappen),
                        budget.percent
                      )
                    : t.tripExpenses.budgetLeft(
                        money(budget.remainingRappen),
                        budget.percent
                      )}
                </p>
                {/* Hochrechnung (#398): «Reicht das bei diesem Tempo?» –
                    die Frage stellt sich mitten in der Reise, nicht am
                    Ende, wenn der Stand-Balken sie längst beantwortet. */}
                {forecast && (
                  <>
                    <p
                      className={cn(
                        "mt-1.5 text-xs",
                        forecast.level === "over"
                          ? "font-medium text-destructive"
                          : "text-muted-foreground"
                      )}
                    >
                      {t.tripExpenses.forecastLine(
                        money(forecast.projectedRappen),
                        forecast.elapsedDays,
                        forecast.elapsedDays + forecast.remainingDays
                      )}
                      {forecast.level === "over" &&
                        ` ${t.tripExpenses.forecastOver}`}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {t.tripExpenses.forecastNote}
                    </p>
                  </>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-1 h-7 px-2 text-xs text-muted-foreground"
                  onClick={() => {
                    setBudgetInput(rappenToInput(budget.budgetRappen));
                    setEditingBudget(true);
                  }}
                >
                  {t.tripExpenses.budgetEdit}
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setBudgetInput("");
                  setEditingBudget(true);
                }}
              >
                {t.tripExpenses.budgetSet}
              </Button>
            )}
          </div>
          {query.isLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t.common.loading}
            </p>
          ) : (
            <>
              {expenses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t.tripExpenses.empty}
                </p>
              ) : (
                <>
                  {/* Summe */}
                  <div className="flex items-baseline justify-between rounded-lg bg-muted/40 px-3 py-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t.tripExpenses.total}
                    </span>
                    <span className="font-mono text-lg font-bold tabular-nums">
                      {money(total)}
                    </span>
                  </div>

                  {/* Aufteilung nach Kategorie – schlichte Balken */}
                  <div>
                    <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t.tripExpenses.categoryTitle}
                    </h4>
                    <ul className="space-y-1.5">
                      {byCategory
                        .filter(entry => entry.rappen > 0)
                        .map(entry => {
                          const percent =
                            total > 0
                              ? Math.round((entry.rappen / total) * 100)
                              : 0;
                          return (
                            <li key={entry.category}>
                              <div className="flex items-baseline justify-between text-xs">
                                <span className="font-medium">
                                  {pick(
                                    EXPENSE_CATEGORY_LABELS[entry.category],
                                    lang
                                  )}
                                </span>
                                <span className="font-mono tabular-nums text-muted-foreground">
                                  {money(entry.rappen)} ·{" "}
                                  {t.tripExpenses.categoryShare(percent)}
                                </span>
                              </div>
                              <div
                                className="mt-0.5 h-2 w-full overflow-hidden rounded-full bg-border"
                                aria-hidden="true"
                              >
                                <div
                                  className={cn(
                                    "h-full rounded-full",
                                    EXPENSE_CATEGORY_BARS[entry.category]
                                  )}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </li>
                          );
                        })}
                    </ul>
                  </div>

                  {/* Wer schuldet wem */}
                  <div>
                    <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t.tripExpenses.settleTitle}
                    </h4>
                    {settlements.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t.tripExpenses.settleNone}
                      </p>
                    ) : (
                      <ul className="space-y-1">
                        {settlements.map((s, i) => (
                          <li
                            key={`${s.from}-${s.to}-${i}`}
                            className="flex flex-wrap items-center gap-1.5 rounded-lg bg-muted/40 px-3 py-1.5 text-sm"
                          >
                            <span className="font-medium">{s.from}</span>
                            <ArrowRight
                              className="h-3.5 w-3.5 text-muted-foreground"
                              aria-hidden="true"
                            />
                            <span className="font-medium">{s.to}</span>
                            <span className="ml-auto font-mono font-semibold tabular-nums">
                              {money(s.rappen)}
                            </span>
                            <span className="sr-only">
                              {t.tripExpenses.settleLine(
                                s.from,
                                s.to,
                                money(s.rappen)
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.tripExpenses.settleHint}
                    </p>
                  </div>

                  {/* CSV-Export (#258) – für die Abrechnung daheim */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadCsv}
                    aria-label={t.tripExpenses.csvAria(tripName)}
                  >
                    <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    {t.tripExpenses.csvButton}
                  </Button>

                  {/* Platzkosten schätzen (#386): Tarife (#369) × Nächte ×
                      Personen. Trägt nichts von selbst ein – die Rezeption
                      rechnet am Ende doch anders. */}
                  <PitchCostEstimator
                    tripId={tripId}
                    spotId={spotId}
                    startDate={startDate}
                    endDate={endDate}
                    onAdded={invalidate}
                  />

                  {/* Fahrtkosten-Rechner (#259): der einzige Posten ohne
                      Beleg – man weiss nur, wie weit man gefahren ist */}
                  <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setFuelOpen(o => !o)}
                      aria-expanded={fuelOpen}
                      className="flex w-full items-center gap-2 text-left text-sm font-medium"
                    >
                      <Fuel
                        className="h-4 w-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <span className="flex-1">{t.tripExpenses.fuelTitle}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                          fuelOpen && "rotate-180"
                        )}
                        aria-hidden="true"
                      />
                    </button>
                    {fuelOpen && (
                      <div className="mt-2 space-y-2">
                        <p className="text-xs text-muted-foreground">
                          {t.tripExpenses.fuelHint}
                        </p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <div>
                            <label
                              className="text-xs text-muted-foreground"
                              htmlFor={`fuel-km-${tripId}`}
                            >
                              {t.tripExpenses.fuelKmLabel}
                            </label>
                            <Input
                              id={`fuel-km-${tripId}`}
                              inputMode="decimal"
                              value={fuelKm}
                              placeholder="0"
                              onChange={e => setFuelKm(e.target.value)}
                            />
                          </div>
                          <div>
                            <label
                              className="text-xs text-muted-foreground"
                              htmlFor={`fuel-l-${tripId}`}
                            >
                              {t.tripExpenses.fuelConsumptionLabel}
                            </label>
                            <Input
                              id={`fuel-l-${tripId}`}
                              inputMode="decimal"
                              value={fuelConsumption}
                              onChange={e => setFuelConsumption(e.target.value)}
                            />
                          </div>
                          <div>
                            <label
                              className="text-xs text-muted-foreground"
                              htmlFor={`fuel-p-${tripId}`}
                            >
                              {t.tripExpenses.fuelPriceLabel}
                            </label>
                            <Input
                              id={`fuel-p-${tripId}`}
                              inputMode="decimal"
                              value={fuelPrice}
                              onChange={e => setFuelPrice(e.target.value)}
                            />
                          </div>
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={fuelRoundTrip}
                            onCheckedChange={value =>
                              setFuelRoundTrip(value === true)
                            }
                          />
                          {t.tripExpenses.fuelRoundTrip}
                        </label>
                        <p className="text-sm">
                          {t.tripExpenses.fuelResult(
                            Math.round(fuelResult.totalKm),
                            fuelResult.liters.toFixed(1),
                            money(fuelResult.rappen)
                          )}
                        </p>
                        <Button
                          size="sm"
                          onClick={applyFuelResult}
                          disabled={fuelResult.rappen < 1}
                        >
                          {t.tripExpenses.fuelApply}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Einzelne Ausgaben */}
                  <ul className="space-y-1">
                    {expenses.map(expense => (
                      <li
                        key={expense.id}
                        className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-x-2 text-sm font-medium">
                            {labelOf(expense)}
                            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
                              {pick(
                                EXPENSE_CATEGORY_LABELS[
                                  normalizeExpenseCategory(expense.category)
                                ],
                                lang
                              )}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {fmtDay(expense.day)} ·{" "}
                            {t.tripExpenses.paidByLine(expense.paidBy)}
                            {shared && expense.createdByName
                              ? ` · ${t.tripExpenses.byLine(expense.createdByName)}`
                              : ""}
                          </p>
                        </div>
                        <span className="shrink-0 font-mono text-sm font-semibold tabular-nums">
                          {money(expense.amountRappen)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground/60 hover:text-foreground"
                          onClick={() => startEditExpense(expense)}
                          aria-label={t.tripExpenses.editAria(labelOf(expense))}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground/60 hover:text-destructive"
                          onClick={async () => {
                            if (
                              await ask({
                                title: t.tripExpenses.deleteConfirm(
                                  labelOf(expense)
                                ),
                              })
                            ) {
                              removeMutation.mutate({ id: expense.id });
                            }
                          }}
                          aria-label={t.tripExpenses.deleteAria(
                            labelOf(expense)
                          )}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* Erfassen / Bearbeiten */}
              {editing === null ? (
                <Button variant="outline" size="sm" onClick={startNew}>
                  <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {t.tripExpenses.addButton}
                </Button>
              ) : (
                <div className="space-y-2 rounded-lg border border-border p-3">
                  <p className="text-sm font-semibold">
                    {editing === "neu"
                      ? t.tripExpenses.newTitle
                      : t.tripExpenses.editTitle}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <Label htmlFor={`expense-amount-${tripId}`}>
                        {t.tripExpenses.amountLabel}
                      </Label>
                      <Input
                        id={`expense-amount-${tripId}`}
                        className="mt-1"
                        inputMode="decimal"
                        placeholder={t.tripExpenses.amountPlaceholder}
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`expense-day-${tripId}`}>
                        {t.tripExpenses.dayLabel}
                      </Label>
                      <Input
                        id={`expense-day-${tripId}`}
                        className="mt-1"
                        type="date"
                        value={day}
                        onChange={e => setDay(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="mb-1 block">
                      {t.tripExpenses.categoryLabel}
                    </Label>
                    <div
                      className="flex flex-wrap gap-1.5"
                      role="group"
                      aria-label={t.tripExpenses.categoryAria}
                    >
                      {EXPENSE_CATEGORIES.map(key => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setCategory(key)}
                          aria-pressed={category === key}
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                            category === key
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {pick(EXPENSE_CATEGORY_LABELS[key], lang)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor={`expense-desc-${tripId}`}>
                      {t.tripExpenses.descriptionLabel}
                    </Label>
                    <Input
                      id={`expense-desc-${tripId}`}
                      className="mt-1"
                      maxLength={EXPENSE_DESCRIPTION_MAX_LENGTH}
                      placeholder={t.tripExpenses.descriptionPlaceholder}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`expense-paidby-${tripId}`}>
                      {t.tripExpenses.paidByLabel}
                    </Label>
                    <Input
                      id={`expense-paidby-${tripId}`}
                      className="mt-1"
                      maxLength={EXPENSE_PAID_BY_MAX_LENGTH}
                      placeholder={t.tripExpenses.paidByPlaceholder}
                      value={paidBy}
                      onChange={e => setPaidBy(e.target.value)}
                    />
                    {knownPayers.length > 0 && (
                      <div
                        className="mt-1.5 flex flex-wrap gap-1.5"
                        role="group"
                        aria-label={t.tripExpenses.paidBySuggestionsAria}
                      >
                        {knownPayers.map(name => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => setPaidBy(name)}
                            className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" disabled={busy} onClick={submit}>
                      {busy ? t.common.saving : t.tripExpenses.save}
                    </Button>
                    <Button size="sm" variant="outline" onClick={closeForm}>
                      {t.common.cancel}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** URL eines Trip-Fotos (gleiche Origin – Canvas bleibt dadurch untainted). */
