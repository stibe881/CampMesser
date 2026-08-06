import { useEffect, useMemo, useState } from "react";
import { fmtShort } from "@/lib/dateFormat";
import { Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { tripDisplayName } from "@shared/tripName";
import { formatChf } from "@/lib/money";
import { trpc } from "@/lib/trpc";
import { LOCALE_TAGS, pick } from "@shared/i18n";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_DESCRIPTION_MAX_LENGTH,
  EXPENSE_PAID_BY_MAX_LENGTH,
  type ExpenseCategory,
} from "@shared/expenses";
import {
  cleanPriceRappen,
  shoppingBooking,
  shoppingBookingDescription,
  type PricedShoppingItem,
} from "@shared/shoppingPrices";

/** Was die Übernahme an den Aufrufer meldet (Router-Eingabe ohne Liste/Reise). */
export interface ShoppingBookingInput {
  tripId: number;
  itemIds: number[];
  category: ExpenseCategory;
  description: string;
  day: string;
  paidBy: string;
}

/**
 * «In die Reisekasse übernehmen» (#234): abgehakte Einkäufe mit Preis als
 * EINE Ausgabe in die Reisekasse einer Reise buchen. Kategorie «Essen» ist
 * vorbelegt, Beschreibung und Zahler*in lassen sich anpassen, Datum ist
 * heute. Auf der Reise-Einkaufsliste steht die Reise über `fixedTripId`
 * schon fest, auf der persönlichen Liste wählt man sie hier.
 *
 * Der Dialog zeigt nur ÜBERNEHMBARE Einträge (abgehakt, mit Preis, noch
 * nicht verbucht) – bereits verbuchte kommen gar nicht erst vor, damit
 * derselbe Einkauf nicht zweimal in der Kasse landet.
 */
export default function ShoppingBookingDialog({
  open,
  onOpenChange,
  items,
  fixedTripId = null,
  saving,
  onBook,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Abgehakte Einträge der Liste – gefiltert wird hier. */
  items: PricedShoppingItem[];
  /** Reise der Reise-Liste; null = Reise im Dialog wählen. */
  fixedTripId?: number | null;
  saving: boolean;
  onBook: (input: ShoppingBookingInput) => Promise<unknown>;
}) {
  const { lang, t } = useI18n();
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);

  const bookable = useMemo(() => shoppingBooking(items).itemIds, [items]);
  const bookableItems = useMemo(
    () => items.filter(item => bookable.includes(item.id)),
    [items, bookable]
  );

  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());
  const [tripId, setTripId] = useState<string>("");
  const [category, setCategory] = useState<ExpenseCategory>("essen");
  const [description, setDescription] = useState("");
  const [day, setDay] = useState(today);
  const [paidBy, setPaidBy] = useState("");

  // Reisen nur laden, wenn die Reise gewählt werden muss
  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled: open && fixedTripId === null,
  });
  const trips = useMemo(() => tripsQuery.data ?? [], [tripsQuery.data]);

  /** Beim Öffnen alles vorbelegen: alle Einträge gewählt, Datum heute. */
  useEffect(() => {
    if (!open) return;
    setSelected(new Set(bookableItems.map(i => i.id)));
    setCategory("essen");
    setDescription(shoppingBookingDescription(bookableItems, lang));
    setDay(today);
    setPaidBy(user?.name ?? user?.email ?? t.tripExpenses.meFallback);
    // Bewusst nur beim Öffnen – der Entwurf soll danach stehen bleiben.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /** Reise vorbelegen: feste Reise, sonst die neuste. */
  useEffect(() => {
    if (!open) return;
    if (fixedTripId !== null) {
      setTripId(String(fixedTripId));
      return;
    }
    if (tripId === "" && trips.length > 0) setTripId(String(trips[0].id));
  }, [open, fixedTripId, trips, tripId]);

  const toggle = (id: number) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const chosen = bookableItems.filter(item => selected.has(item.id));
  const sumRappen = chosen.reduce(
    (sum, item) => sum + cleanPriceRappen(item.priceRappen),
    0
  );
  const money = (rappen: number) =>
    `${t.tripExpenses.currency} ${formatChf(rappen, lang)}`;

  const tripLabel = (trip: (typeof trips)[number]) =>
    tripDisplayName(trip, lang);
  const fmtDay = (iso: string) => fmtShort(new Date(`${iso}T00:00:00`), lang);

  const submit = async () => {
    const trip = Number(tripId);
    if (!Number.isInteger(trip) || trip <= 0 || chosen.length === 0) return;
    await onBook({
      tripId: trip,
      itemIds: chosen.map(item => item.id),
      category,
      description: description.trim().slice(0, EXPENSE_DESCRIPTION_MAX_LENGTH),
      day,
      paidBy: paidBy.trim().slice(0, EXPENSE_PAID_BY_MAX_LENGTH),
    });
  };

  return (
    <Dialog open={open} onOpenChange={o => !saving && onOpenChange(o)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.shopping.bookTitle}</DialogTitle>
          <DialogDescription>{t.shopping.bookDesc}</DialogDescription>
        </DialogHeader>

        {bookableItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t.shopping.bookNothing}
          </p>
        ) : (
          <form
            className="grid gap-3"
            onSubmit={e => {
              e.preventDefault();
              void submit();
            }}
          >
            <ul className="grid max-h-56 gap-1.5 overflow-y-auto">
              {bookableItems.map(item => (
                <li
                  key={item.id}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5"
                >
                  <Checkbox
                    checked={selected.has(item.id)}
                    disabled={saving}
                    onCheckedChange={() => toggle(item.id)}
                    aria-label={t.shopping.bookItemAria(item.name)}
                  />
                  <span className="min-w-0 flex-1 break-words text-sm">
                    {item.name}
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                    {money(cleanPriceRappen(item.priceRappen))}
                  </span>
                </li>
              ))}
            </ul>

            <p className="flex items-center justify-between rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground">
              <span>{t.shopping.bookSumLabel(chosen.length)}</span>
              <span className="tabular-nums">{money(sumRappen)}</span>
            </p>

            {fixedTripId === null && (
              <div>
                <Label htmlFor="shopping-book-trip">
                  {t.shopping.bookTripLabel}
                </Label>
                {trips.length === 0 ? (
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {t.shopping.bookNoTrips}
                  </p>
                ) : (
                  <Select value={tripId} onValueChange={setTripId}>
                    <SelectTrigger
                      id="shopping-book-trip"
                      className="mt-1.5"
                      aria-label={t.shopping.bookTripLabel}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {trips.map(trip => (
                        <SelectItem key={trip.id} value={String(trip.id)}>
                          {tripLabel(trip)} · {fmtDay(trip.startDate)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <div className="min-w-36 flex-1">
                <Label htmlFor="shopping-book-category">
                  {t.shopping.bookCategoryLabel}
                </Label>
                <Select
                  value={category}
                  onValueChange={value => setCategory(value as ExpenseCategory)}
                >
                  <SelectTrigger id="shopping-book-category" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(key => (
                      <SelectItem key={key} value={key}>
                        {pick(EXPENSE_CATEGORY_LABELS[key], lang)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-36 flex-1">
                <Label htmlFor="shopping-book-day">
                  {t.shopping.bookDayLabel}
                </Label>
                <Input
                  id="shopping-book-day"
                  type="date"
                  className="mt-1.5"
                  value={day}
                  onChange={e => setDay(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="shopping-book-description">
                {t.shopping.bookDescriptionLabel}
              </Label>
              <Input
                id="shopping-book-description"
                className="mt-1.5"
                value={description}
                maxLength={EXPENSE_DESCRIPTION_MAX_LENGTH}
                placeholder={t.shopping.bookDescriptionPlaceholder}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="shopping-book-paidby">
                {t.shopping.bookPaidByLabel}
              </Label>
              <Input
                id="shopping-book-paidby"
                className="mt-1.5"
                value={paidBy}
                maxLength={EXPENSE_PAID_BY_MAX_LENGTH}
                placeholder={t.shopping.bookPaidByPlaceholder}
                onChange={e => setPaidBy(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={
                saving ||
                chosen.length === 0 ||
                sumRappen <= 0 ||
                !paidBy.trim() ||
                !tripId
              }
            >
              {saving ? (
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Wallet className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              {t.shopping.bookConfirm(money(sumRappen))}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
