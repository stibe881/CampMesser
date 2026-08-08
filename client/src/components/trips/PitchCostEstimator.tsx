/**
 * Was der Platz wirklich kostet (#386).
 *
 * WAS DA HERUMLAG: Seit #369 stehen die Tarife am Platz – Nebensaison,
 * Hauptsaison, darunter Erwachsene, Kind, Stellplatz. Seit #256 gibt es
 * ein Reise-Budget, seit #219 die Reisekasse. Multipliziert hat das noch
 * nie jemand, obwohl «zwei Erwachsene, ein Kind, fünf Nächte» genau die
 * Rechnung ist, die man vor der Abreise im Kopf macht – und verrechnet.
 *
 * ES BLEIBT EIN VORSCHLAG. Der Knopf trägt den Betrag in die Reisekasse
 * ein, wenn man ihn drückt, und sonst nicht. Eine Kasse, die sich selbst
 * füllt, stimmt nie und wird darum nicht mehr geführt – und die
 * Rezeption rechnet ohnehin anders: Kurtaxe nach Alter, Hund, Strom nach
 * Verbrauch.
 *
 * DIE ANZAHLEN STARTEN BEI 0. Wer sie selbst eintippt, prüft sie dabei;
 * eine vorgesetzte «2» übersieht man und nimmt sie falsch ins Budget.
 *
 * ERSCHEINT NUR, wenn der Aufenthalt einen Platz hat und der Platz
 * Preise kennt. Ohne Zahlen gäbe es nichts zu rechnen.
 */
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  DEFAULT_TARIFF_CURRENCY,
  formatRappen,
  parseSpotTariffs,
  tariffActiveOn,
} from "@shared/spotTariffs";
import {
  cleanCount,
  emptyCounts,
  estimatePitchCost,
  nightsBetween,
  type CountedRow,
} from "@shared/pitchCostEstimate";
import { cn } from "@/lib/utils";

export default function PitchCostEstimator({
  tripId,
  spotId,
  startDate,
  endDate,
  onAdded,
}: {
  tripId: number;
  spotId: number | null;
  startDate: string;
  endDate: string;
  /** Nach dem Eintragen aufräumen (Listen und Summen neu holen). */
  onAdded: () => void;
}) {
  const { lang, t } = useI18n();
  const pc = t.pitchCost;
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [tariffIndex, setTariffIndex] = useState(0);
  const [counts, setCounts] = useState<CountedRow[] | null>(null);
  /**
   * «Wer hat bezahlt» ist ein Pflichtfeld der Reisekasse. Hier steht der
   * eigene Name als Vorgabe – wer geteilt abrechnet, ändert ihn danach
   * im Posten. Ein zweites Eingabefeld im Rechner wäre eine Hürde
   * zwischen Zahl und Eintrag.
   */
  const paidBy = user?.name || user?.email || pc.meFallback;

  const spotsQuery = trpc.spots.list.useQuery(undefined, {
    enabled: open && spotId !== null,
    staleTime: 60_000,
  });
  const spot = (spotsQuery.data ?? []).find(s => s.id === spotId);
  const tariffs = useMemo(
    () => parseSpotTariffs(spot?.tariffsJson ?? null),
    [spot?.tariffsJson]
  );
  const nights = nightsBetween(startDate, endDate);

  const addMutation = trpc.trips.expenses.add.useMutation({
    onSuccess: () => {
      toast.success(pc.added);
      onAdded();
    },
    onError: e => toast.error(e.message || t.common.saveFailed),
  });

  // Der Tarif, der zum REISEBEGINN gilt (#394), ist vorgewählt – wer im
  // Juli plant, meint die Hauptsaison. Nur solange noch nichts getippt
  // ist; eine Wahl von Hand wird nie übersteuert.
  useEffect(() => {
    if (counts !== null) return;
    const active = tariffs.findIndex(entry => tariffActiveOn(entry, startDate));
    if (active > 0) setTariffIndex(active);
  }, [tariffs, counts, startDate]);

  const tariff = tariffs[tariffIndex];
  const rows = counts ?? (tariff ? emptyCounts(tariff) : []);
  const nightly =
    (spot?.pricePerNightRappen ?? 0) + (spot?.extraPerNightRappen ?? 0);
  const estimate = estimatePitchCost({
    nights,
    rows,
    nightlyRappen: nightly,
  });
  // Der Grundpreis (#243) ist immer CHF; nur die Tarif-Rechnung trägt
  // seit #395 eine eigene Währung.
  const currency =
    estimate?.source === "tariff"
      ? (tariff?.currency ?? DEFAULT_TARIFF_CURRENCY)
      : DEFAULT_TARIFF_CURRENCY;

  // Ohne Platz oder ohne jede Preisangabe gibt es nichts zu rechnen.
  if (spotId === null) return null;
  if (open && tariffs.length === 0 && nightly <= 0) return null;

  const chooseTariff = (index: number) => {
    setTariffIndex(index);
    setCounts(tariffs[index] ? emptyCounts(tariffs[index]) : null);
  };

  return (
    <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left text-sm font-medium"
      >
        <Wallet className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="flex-1">{pc.title}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          <p className="text-xs text-muted-foreground">{pc.hint(nights)}</p>

          {tariffs.length > 1 && (
            <div
              className="flex flex-wrap gap-1.5"
              role="group"
              aria-label={pc.tariffGroupAria}
            >
              {tariffs.map((entry, index) => (
                <button
                  key={entry.name}
                  type="button"
                  aria-pressed={index === tariffIndex}
                  onClick={() => chooseTariff(index)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    index === tariffIndex
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  {entry.name}
                </button>
              ))}
            </div>
          )}

          {rows.length > 0 ? (
            <ul className="space-y-1.5">
              {rows.map((row, index) => (
                <li key={row.label} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {row.label}
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      {formatRappen(
                        row.priceRappen,
                        lang,
                        tariff?.currency ?? DEFAULT_TARIFF_CURRENCY
                      )}
                      {row.oneOff && ` · ${t.spotDetail.tariffRowOneOff}`}
                    </span>
                  </span>
                  <Input
                    className="w-16 shrink-0"
                    inputMode="numeric"
                    aria-label={pc.countAria(row.label)}
                    value={String(row.count)}
                    onChange={e =>
                      setCounts(
                        rows.map((entry, i) =>
                          i === index
                            ? { ...entry, count: cleanCount(e.target.value) }
                            : entry
                        )
                      )
                    }
                  />
                </li>
              ))}
            </ul>
          ) : (
            // Kein Tarif erfasst: dann eben der eine Preis pro Nacht
            // (#243) – grob, aber besser als nichts, und es steht dabei.
            <p className="text-xs text-muted-foreground">{pc.nightlyOnly}</p>
          )}

          {estimate ? (
            <>
              <p className="font-serif text-xl font-bold">
                {formatRappen(estimate.totalRappen, lang, currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                {pc.breakdown(
                  formatRappen(estimate.perNightRappen, lang, currency),
                  estimate.nights
                )}
                {/* Einmaliges (#415) steht getrennt – es skaliert nicht
                    mit den Nächten und soll auch nicht so aussehen. */}
                {estimate.oneOffRappen > 0 &&
                  ` · ${pc.oneOffPart(
                    formatRappen(estimate.oneOffRappen, lang, currency)
                  )}`}
                {estimate.source === "nightly" && ` · ${pc.sourceNightly}`}
              </p>
              {/* Die Reisekasse wird in CHF geführt (#219). Einen
                  EUR-Betrag als CHF einzutragen wäre eine falsche Zahl
                  mit einem Knopfdruck – dann lieber kein Knopf und ein
                  ehrlicher Satz. */}
              {currency === "CHF" ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={addMutation.isPending}
                  onClick={() =>
                    addMutation.mutate({
                      tripId,
                      amountRappen: estimate.totalRappen,
                      category: "camping",
                      description: pc.expenseLabel(estimate.nights),
                      day: startDate,
                      paidBy,
                    })
                  }
                >
                  {pc.addToExpenses}
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {pc.foreignCurrency(currency)}
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">{pc.nothingYet}</p>
          )}

          <p className="text-[11px] leading-snug text-muted-foreground">
            {pc.note}
          </p>
        </div>
      )}
    </div>
  );
}
