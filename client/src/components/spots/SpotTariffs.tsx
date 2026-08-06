import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import {
  MAX_SPOT_TARIFFS,
  MAX_TARIFF_ROWS,
  TARIFF_NAME_MAX_LENGTH,
  TARIFF_ROW_LABEL_MAX_LENGTH,
  formatRappen,
  parseSpotTariffs,
  serializeSpotTariffs,
  tariffTotalRappen,
  type SpotTariff,
} from "@shared/spotTariffs";

/**
 * Mehrere Tarife eines Zeltplatzes anzeigen und pflegen (#369).
 *
 * DIE PREISTAFEL AN DER REZEPTION hat zwei Ebenen: Saison und darunter
 * Erwachsene/Kind/Stellplatz. Genau das bildet der Editor ab – Tarife
 * untereinander, in jedem seine Zeilen.
 *
 * DER GRUNDPREIS DARÜBER BLEIBT UNBERÜHRT: Er ist der eine Wert, mit dem
 * die Statistik die Plätze vergleicht (#243). Ein Vergleich über sechs
 * Tarife wäre keiner mehr; hier steht das Nachschlagewerk daneben.
 *
 * BETRÄGE ALS TEXT IM ENTWURF, nicht als Zahl: Wer «12.5» tippt, ist
 * mitten in «12.50» – eine sofortige Umrechnung würde ihm die Eingabe
 * unter den Fingern umschreiben. Gerechnet wird erst beim Speichern.
 */

/** Entwurfs-Form: Beträge bleiben Text, solange getippt wird. */
interface DraftRow {
  label: string;
  price: string;
}
interface DraftTariff {
  name: string;
  rows: DraftRow[];
}

/** «12.50» → 1250 Rappen; unlesbares und Negatives wird zu null. */
function parseChf(value: string): number | null {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) return null;
  const num = Number(normalized);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100);
}

/** Rappen → «12.50» fürs Eingabefeld (0 bleibt «0»). */
function toInput(rappen: number): string {
  return (rappen / 100).toFixed(2);
}

export default function SpotTariffs({
  spotId,
  tariffsJson,
}: {
  spotId: number;
  tariffsJson: string | null;
}) {
  const { lang, t } = useI18n();
  const ts = t.spotDetail;
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DraftTariff[]>([]);

  const tariffs = parseSpotTariffs(tariffsJson);

  const updateMutation = trpc.spots.update.useMutation({
    onSuccess: () => {
      void utils.spots.list.invalidate();
      setOpen(false);
      toast.success(ts.tariffsSaved);
    },
    onError: () => toast.error(t.common.saveFailed),
  });

  const openEditor = () => {
    setDraft(
      tariffs.map(tariff => ({
        name: tariff.name,
        rows: tariff.rows.map(row => ({
          label: row.label,
          price: toInput(row.priceRappen),
        })),
      }))
    );
    setOpen(true);
  };

  const save = () => {
    const clean: SpotTariff[] = draft.map(tariff => ({
      name: tariff.name,
      rows: tariff.rows
        .map(row => ({ label: row.label, priceRappen: parseChf(row.price) }))
        // Zeilen ohne lesbaren Betrag fallen weg statt als 0 zu erscheinen
        .filter(
          (row): row is { label: string; priceRappen: number } =>
            row.priceRappen !== null
        ),
    }));
    updateMutation.mutate({
      id: spotId,
      tariffsJson: serializeSpotTariffs(clean),
    });
  };

  /** Einen Tarif im Entwurf ändern, ohne die anderen anzufassen. */
  const patch = (index: number, next: Partial<DraftTariff>) =>
    setDraft(list =>
      list.map((tariff, i) => (i === index ? { ...tariff, ...next } : tariff))
    );

  return (
    <div className="mt-4 border-t border-border pt-3">
      <p className="mb-2 text-sm font-medium">{ts.tariffsTitle}</p>
      {tariffs.length === 0 ? (
        <p className="text-sm text-muted-foreground">{ts.tariffsEmpty}</p>
      ) : (
        <ul className="space-y-3">
          {tariffs.map(tariff => (
            <li
              key={tariff.name}
              className="rounded-lg border border-border px-3 py-2"
            >
              <p className="text-sm font-semibold">{tariff.name}</p>
              {tariff.rows.length === 0 ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {ts.tariffRowsEmpty}
                </p>
              ) : (
                <>
                  <dl className="mt-1 space-y-0.5 text-sm">
                    {tariff.rows.map(row => (
                      <div
                        key={row.label}
                        className="flex flex-wrap items-baseline gap-x-3"
                      >
                        <dt className="w-32 shrink-0 text-muted-foreground">
                          {row.label}
                        </dt>
                        <dd className="font-medium tabular-nums">
                          {formatRappen(row.priceRappen, lang)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {/* Die Summe ist nur dann eine Aussage, wenn es mehr als
                      eine Zeile gibt – sonst wiederholt sie die Zeile. */}
                  {tariff.rows.length > 1 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {ts.tariffTotal(
                        formatRappen(tariffTotalRappen(tariff), lang)
                      )}
                    </p>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-xs text-muted-foreground">{ts.tariffsHint}</p>
      <Button variant="outline" size="sm" className="mt-3" onClick={openEditor}>
        {ts.tariffsEditButton}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{ts.tariffsTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {draft.map((tariff, index) => (
              <div key={index} className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={tariff.name}
                    maxLength={TARIFF_NAME_MAX_LENGTH}
                    placeholder={ts.tariffNamePlaceholder}
                    aria-label={ts.tariffNamePlaceholder}
                    onChange={e => patch(index, { name: e.target.value })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-muted-foreground/60 hover:text-destructive"
                    onClick={() =>
                      setDraft(list => list.filter((_, i) => i !== index))
                    }
                    aria-label={ts.tariffRemoveAria(
                      tariff.name || ts.tariffNamePlaceholder
                    )}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
                <ul className="mt-2 space-y-2">
                  {tariff.rows.map((row, rowIndex) => (
                    <li key={rowIndex} className="flex items-center gap-2">
                      <Input
                        value={row.label}
                        maxLength={TARIFF_ROW_LABEL_MAX_LENGTH}
                        placeholder={ts.tariffRowLabelPlaceholder}
                        aria-label={ts.tariffRowLabelPlaceholder}
                        onChange={e =>
                          patch(index, {
                            rows: tariff.rows.map((r, i) =>
                              i === rowIndex
                                ? { ...r, label: e.target.value }
                                : r
                            ),
                          })
                        }
                      />
                      <Input
                        value={row.price}
                        inputMode="decimal"
                        className="w-28"
                        placeholder="0.00"
                        aria-label={ts.tariffRowPriceAria}
                        onChange={e =>
                          patch(index, {
                            rows: tariff.rows.map((r, i) =>
                              i === rowIndex
                                ? { ...r, price: e.target.value }
                                : r
                            ),
                          })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-muted-foreground/60 hover:text-destructive"
                        onClick={() =>
                          patch(index, {
                            rows: tariff.rows.filter((_, i) => i !== rowIndex),
                          })
                        }
                        aria-label={ts.tariffRowRemoveAria(
                          row.label || ts.tariffRowLabelPlaceholder
                        )}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </li>
                  ))}
                </ul>
                {tariff.rows.length < MAX_TARIFF_ROWS && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() =>
                      patch(index, {
                        rows: [...tariff.rows, { label: "", price: "" }],
                      })
                    }
                  >
                    <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    {ts.tariffRowAdd}
                  </Button>
                )}
              </div>
            ))}
            {draft.length < MAX_SPOT_TARIFFS && (
              <Button
                variant="outline"
                onClick={() =>
                  setDraft(list => [
                    ...list,
                    { name: "", rows: [{ label: "", price: "" }] },
                  ])
                }
              >
                <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {ts.tariffAdd}
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={updateMutation.isPending}
            >
              {t.common.cancel}
            </Button>
            <Button onClick={save} disabled={updateMutation.isPending}>
              {t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
