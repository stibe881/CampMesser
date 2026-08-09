import { useRef, useState } from "react";
import { Camera, Loader2, Wallet, X } from "lucide-react";
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
import { resizeImageForUpload } from "@/lib/imageResize";
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
  // Beleg-Foto (#607): an der Kasse gleich mitfotografieren – hochgeladen
  // wird NACH dem Speichern, erst dann gibt es eine Id (Muster #540).
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [saving, setSaving] = useState(false);

  const handlePhotoSelected = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (photoInputRef.current) photoInputRef.current.value = "";
    if (!file) return;
    try {
      setPhotoBlob(await resizeImageForUpload(file));
    } catch {
      const isHeic =
        /image\/hei[cf]/.test(file.type) || /\.hei[cf]$/i.test(file.name);
      toast.error(
        isHeic ? t.tripExpenses.photoHeic : t.tripExpenses.photoReadFailed
      );
    }
  };

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
    onError: e => toast.error(e.message || t.common.saveFailed),
  });

  const submit = async () => {
    const value = Number(amount.trim().replace(",", "."));
    const rappen = Math.round(value * 100);
    if (!Number.isFinite(value) || rappen < 1 || rappen > EXPENSE_MAX_RAPPEN) {
      toast.error(t.today.expenseInvalid);
      return;
    }
    setSaving(true);
    let id: number;
    try {
      ({ id } = await mutation.mutateAsync({
        tripId,
        amountRappen: rappen,
        currency,
        category,
        description: description.trim() || null,
        day: todayIso(),
        paidBy: (user?.name || user?.email || "–")
          .trim()
          .slice(0, EXPENSE_PAID_BY_MAX_LENGTH),
      }));
    } catch {
      // Fehler-Toast kommt aus onError der Mutation
      setSaving(false);
      return;
    }
    // Beleg (#607) NACH dem Speichern – ein gescheiterter Upload lässt
    // die Ausgabe stehen, das Foto lässt sich auf der Reise-Seite nachreichen
    if (photoBlob) {
      try {
        const response = await fetch(`/api/trips/expenses/${id}/photo`, {
          method: "POST",
          headers: { "Content-Type": "image/jpeg" },
          body: photoBlob,
          credentials: "include",
        });
        if (!response.ok) toast.error(t.tripExpenses.photoUploadFailed);
      } catch {
        toast.error(t.tripExpenses.photoUploadFailed);
      }
    }
    setSaving(false);
    void utils.trips.expenses.invalidate();
    setOpen(false);
    setAmount("");
    setDescription("");
    setPhotoBlob(null);
    toast.success(t.today.expenseSaved);
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
              void submit();
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
            {/* Beleg-Foto (#607): optional, an der Kasse gleich geknipst */}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
              onChange={e => void handlePhotoSelected(e.target.files)}
            />
            <div className="mt-3 flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => photoInputRef.current?.click()}
              >
                <Camera className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {photoBlob
                  ? t.tripExpenses.photoChange
                  : t.tripExpenses.photoAdd}
              </Button>
              {photoBlob && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={() => setPhotoBlob(null)}
                >
                  <X className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                  {t.tripExpenses.photoRemove}
                </Button>
              )}
            </div>
            <Button
              type="submit"
              className="mt-4 w-full"
              disabled={saving || !amount.trim()}
            >
              {saving && (
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
