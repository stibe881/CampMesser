import { useState } from "react";
import { Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { pick } from "@shared/i18n";
import { todayIso } from "@shared/localDate";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_CURRENCIES,
  EXPENSE_MAX_RAPPEN,
  EXPENSE_PAID_BY_MAX_LENGTH,
  dailyBudgetLeftRappen,
  expensesTotalRappen,
  toChfExpenses,
  type ExpenseCategory,
  type ExpenseCurrency,
} from "@shared/expenses";
import { formatChf } from "@/lib/money";

/**
 * Ausgabe direkt aus der Heute-Ansicht erfassen (#541): Betrag, Kategorie,
 * fertig – ohne Umweg über die Reise-Seite. Der Eintrag landet in der
 * Reisekasse der laufenden Reise mit dem heutigen Tag; als «wer bezahlt hat»
 * gilt das eigene Konto. Alles Weitere (umbuchen, löschen, Kurs) bleibt
 * bewusst auf der Reise-Seite – hier zählt der schnelle Griff an der Kasse.
 */
export default function QuickExpense({ tripId }: { tripId: number }) {
  const { lang, t } = useI18n();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<ExpenseCurrency>("CHF");
  const [category, setCategory] = useState<ExpenseCategory>("essen");
  const [description, setDescription] = useState("");

  /**
   * Tagesbudget im Schnell-Dialog (#586): Wer an der Kasse steht, will
   * wissen, was heute noch drinliegt – nicht erst auf der Reise-Seite.
   * Budget und Kurs stehen an der Reise (trips.list ist ohnehin
   * geladen); die Ausgaben kommen erst beim Öffnen des Dialogs.
   */
  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled: open,
    staleTime: 60_000,
  });
  const trip = (tripsQuery.data ?? []).find(tr => tr.id === tripId) ?? null;
  const expensesQuery = trpc.trips.expenses.list.useQuery(
    { tripId },
    { enabled: open && trip != null && trip.budgetRappen != null }
  );
  const daily = (() => {
    if (!trip || trip.budgetRappen == null || !expensesQuery.data) return null;
    const { converted } = toChfExpenses(
      expensesQuery.data,
      trip.eurRateX10000 ?? null
    );
    return dailyBudgetLeftRappen({
      budgetRappen: trip.budgetRappen,
      spentRappen: expensesTotalRappen(converted),
      startDate: trip.startDate,
      endDate: trip.endDate,
      todayIso: todayIso(),
    });
  })();

  const mutation = trpc.trips.expenses.add.useMutation({
    onSuccess: () => {
      utils.trips.expenses.invalidate();
      setOpen(false);
      setAmount("");
      setDescription("");
      toast.success(t.today.expenseSaved);
    },
    onError: e => toast.error(e.message || t.common.saveFailed),
  });

  const submit = () => {
    const value = Number(amount.trim().replace(",", "."));
    const rappen = Math.round(value * 100);
    if (!Number.isFinite(value) || rappen < 1 || rappen > EXPENSE_MAX_RAPPEN) {
      toast.error(t.today.expenseInvalid);
      return;
    }
    mutation.mutate({
      tripId,
      amountRappen: rappen,
      currency,
      category,
      description: description.trim() || null,
      day: todayIso(),
      paidBy: (user?.name || user?.email || "–")
        .trim()
        .slice(0, EXPENSE_PAID_BY_MAX_LENGTH),
    });
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Wallet className="mr-1.5 h-4 w-4" aria-hidden="true" />
        {t.today.expenseButton}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.today.expenseButton}</DialogTitle>
            <DialogDescription>{t.today.expenseHint}</DialogDescription>
          </DialogHeader>
          {/* Tagesbudget (#586): dieselbe Zeile wie in der Reisekasse –
              nur wenn ein Budget gesetzt ist und noch etwas drinliegt. */}
          {daily !== null && (
            <p className="text-sm font-medium text-primary">
              {t.tripExpenses.dailyBudgetLine(`${formatChf(daily, lang)} CHF`)}
            </p>
          )}
          <form
            onSubmit={e => {
              e.preventDefault();
              submit();
            }}
          >
            <Label htmlFor="quick-expense-amount">
              {t.today.expenseAmountLabel}
            </Label>
            <div className="mt-1.5 flex gap-2">
              <Input
                id="quick-expense-amount"
                inputMode="decimal"
                placeholder="12.50"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                autoFocus
              />
              {EXPENSE_CURRENCIES.map(code => (
                <Button
                  key={code}
                  type="button"
                  variant={currency === code ? "default" : "outline"}
                  className="px-3"
                  aria-pressed={currency === code}
                  onClick={() => setCurrency(code)}
                >
                  {code}
                </Button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {EXPENSE_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={category === cat}
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm transition-colors",
                    category === cat
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  )}
                >
                  {pick(EXPENSE_CATEGORY_LABELS[cat], lang)}
                </button>
              ))}
            </div>
            <Input
              className="mt-3"
              placeholder={t.today.expenseNotePlaceholder}
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={160}
            />
            <Button
              type="submit"
              className="mt-4 w-full"
              disabled={mutation.isPending || !amount.trim()}
            >
              {mutation.isPending && (
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              {t.today.expenseSave}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
