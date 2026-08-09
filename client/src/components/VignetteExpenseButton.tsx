/**
 * Vignetten-Preis in die Reisekasse übernehmen (#604): Auf der Länder-Seite
 * steht der Richtpreis der Vignette – ein Knopf daneben trägt ihn als
 * Ausgabe in die Reisekasse einer gewählten Reise ein. So landet der
 * Posten dort, wo er beim Abrechnen ohnehin gebraucht wird, ohne dass man
 * ihn abtippen muss.
 *
 * Der Betrag ist ein RICHTPREIS aus dem gepflegten Länderkatalog (#228)
 * und in der Reisekasse ganz normal änderbar – der Dialog sagt das auch.
 * «Wer bezahlt hat» ist das eigene Konto (Muster QuickExpense #541).
 */
import { useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";
import { fmtShort } from "@/lib/dateFormat";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { formatChf } from "@/lib/money";
import { pick } from "@shared/i18n";
import { todayIso } from "@shared/localDate";
import { EXPENSE_PAID_BY_MAX_LENGTH } from "@shared/expenses";
import { tripDisplayName } from "@shared/tripName";
import type { CountryVignette } from "@/data/roadRules";

export default function VignetteExpenseButton({
  vignette,
  countryName,
}: {
  vignette: CountryVignette;
  countryName: string;
}) {
  const { lang, t } = useI18n();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [tripId, setTripId] = useState("");

  const tripsQuery = trpc.trips.list.useQuery(undefined, { enabled: open });
  // Neuste zuerst: Die Vignette kauft man für die nächste Fahrt, nicht
  // für die Reise von vor drei Jahren.
  const trips = (tripsQuery.data ?? [])
    .filter(trip => trip.archivedAt == null)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  useEffect(() => {
    if (open && tripId === "" && trips.length > 0) {
      setTripId(String(trips[0].id));
    }
  }, [open, tripId, trips]);

  const price = `${formatChf(vignette.amountRappen, lang)} ${vignette.currency}`;

  const mutation = trpc.trips.expenses.add.useMutation({
    onSuccess: () => {
      void utils.trips.expenses.invalidate();
      setOpen(false);
      toast.success(t.roadRules.vignetteExpenseSaved);
    },
    onError: e => toast.error(e.message || t.common.saveFailed),
  });

  const submit = () => {
    const id = Number(tripId);
    if (!Number.isInteger(id) || id <= 0) return;
    mutation.mutate({
      tripId: id,
      amountRappen: vignette.amountRappen,
      currency: vignette.currency,
      category: "sonstiges",
      description: `${pick(vignette.label, lang)} ${countryName}`.slice(0, 160),
      day: todayIso(),
      paidBy: (user?.name || user?.email || "–")
        .trim()
        .slice(0, EXPENSE_PAID_BY_MAX_LENGTH),
    });
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="mt-2"
        onClick={() => setOpen(true)}
      >
        <Wallet className="mr-1.5 h-4 w-4" aria-hidden="true" />
        {t.roadRules.vignetteExpenseButton(price)}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.roadRules.vignetteExpenseTitle}</DialogTitle>
            <DialogDescription>
              {t.roadRules.vignetteExpenseHint(
                `${pick(vignette.label, lang)} ${countryName}`,
                price
              )}
            </DialogDescription>
          </DialogHeader>
          {trips.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t.roadRules.vignetteExpenseNoTrips}
            </p>
          ) : (
            <form
              onSubmit={e => {
                e.preventDefault();
                submit();
              }}
            >
              <Label htmlFor="vignette-expense-trip">
                {t.roadRules.vignetteExpenseTripLabel}
              </Label>
              <Select value={tripId} onValueChange={setTripId}>
                <SelectTrigger
                  id="vignette-expense-trip"
                  className="mt-1.5"
                  aria-label={t.roadRules.vignetteExpenseTripLabel}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {trips.map(trip => (
                    <SelectItem key={trip.id} value={String(trip.id)}>
                      {tripDisplayName(trip, lang)} ·{" "}
                      {fmtShort(new Date(`${trip.startDate}T00:00:00`), lang)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="submit"
                className="mt-4 w-full"
                disabled={mutation.isPending || !tripId}
              >
                {mutation.isPending && (
                  <Loader2
                    className="mr-2 h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                )}
                {t.roadRules.vignetteExpenseSave}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
