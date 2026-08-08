import { useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
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
  DEFAULT_TARIFF_CURRENCY,
  MAX_SPOT_TARIFFS,
  MAX_TARIFF_PERIODS,
  MAX_TARIFF_ROWS,
  TARIFF_CURRENCIES,
  TARIFF_NAME_MAX_LENGTH,
  TARIFF_ROW_LABEL_MAX_LENGTH,
  TARIFF_UNIT_MAX_LENGTH,
  formatMonthDay,
  formatRappen,
  formatTariffPeriods,
  parseAmountInput,
  parseDayMonthInput,
  parseSpotTariffs,
  serializeSpotTariffs,
  tariffActiveOn,
  tariffTotalRappen,
  type SpotTariff,
  type TariffCurrency,
} from "@shared/spotTariffs";
import { useTodayIso } from "@/lib/useTodayIso";

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
  /** Einmalig statt pro Nacht (#415). */
  oneOff: boolean;
}
/** Ein Zeitraum im Entwurf: beide Enden als «TT.MM.»-Text. */
interface DraftPeriod {
  from: string;
  to: string;
}
interface DraftTariff {
  name: string;
  rows: DraftRow[];
  currency: TariffCurrency;
  unit: string;
  periods: DraftPeriod[];
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
  const today = useTodayIso();
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
          oneOff: row.oneOff ?? false,
        })),
        currency: tariff.currency,
        unit: tariff.unit ?? "",
        periods: (tariff.periods ?? []).map(period => ({
          from: formatMonthDay(period.from),
          to: formatMonthDay(period.to),
        })),
      }))
    );
    setOpen(true);
  };

  const save = () => {
    // HALBE ZEILEN SIND EIN FEHLER, KEIN SCHWUND: Früher fielen Zeilen
    // ohne lesbaren Betrag beim Speichern stumm weg – wer «12.–» tippte,
    // sah seine neue Zeile verschwinden und meldete «man kann keine
    // Untertarife mehr hinzufügen». Jetzt bleibt der Dialog offen und
    // sagt, welche Zeile klemmt. Nur GANZ leere Zeilen (die unberührte
    // Vorlage) fallen weiter still weg.
    const clean: SpotTariff[] = [];
    for (const tariff of draft) {
      const rows: { label: string; priceRappen: number; oneOff?: boolean }[] =
        [];
      for (const row of tariff.rows) {
        const label = row.label.trim();
        const priceRappen = parseAmountInput(row.price);
        if (!label && !row.price.trim()) continue;
        if (!label) {
          toast.error(ts.tariffRowLabelMissing);
          return;
        }
        if (priceRappen === null) {
          toast.error(ts.tariffRowPriceInvalid(label));
          return;
        }
        rows.push({
          label,
          priceRappen,
          ...(row.oneOff ? { oneOff: true } : {}),
        });
      }
      clean.push({
        name: tariff.name,
        rows,
        currency: tariff.currency,
        unit: tariff.unit,
        // Zeiträume (#394): Nur vollständig lesbare Paare zählen – ein
        // halber Zeitraum ist keiner. Der Parser nimmt «2.4.» wie «02.04.».
        periods: tariff.periods.flatMap(period => {
          const from = parseDayMonthInput(period.from);
          const to = parseDayMonthInput(period.to);
          return from && to ? [{ from, to }] : [];
        }),
      });
    }
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
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                {tariff.name}
                {tariff.unit && (
                  <span className="font-normal text-muted-foreground">
                    {tariff.unit}
                  </span>
                )}
                {/* «gilt jetzt» nur mit erfassten Zeiträumen – ohne
                    Angabe sagt der Tarif nichts über heute. */}
                {tariffActiveOn(tariff, today) && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    {ts.tariffActiveNow}
                  </span>
                )}
              </p>
              {tariff.periods && tariff.periods.length > 0 && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatTariffPeriods(tariff.periods)}
                </p>
              )}
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
                          {formatRappen(row.priceRappen, lang, tariff.currency)}
                          {row.oneOff && (
                            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                              {ts.tariffRowOneOff}
                            </span>
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {/* Die Summe ist nur dann eine Aussage, wenn es mehr als
                      eine Zeile gibt – sonst wiederholt sie die Zeile. */}
                  {tariff.rows.length > 1 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {ts.tariffTotal(
                        formatRappen(
                          tariffTotalRappen(tariff),
                          lang,
                          tariff.currency
                        )
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
                  {/* Duplizieren (Nutzerwunsch 07.08.2026): Die Preistafel
                      hat oft zwei fast gleiche Saisons – abtippen wäre
                      Fleissarbeit. Die Kopie landet direkt darunter. */}
                  {draft.length < MAX_SPOT_TARIFFS && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 text-muted-foreground/60"
                      onClick={() =>
                        setDraft(list => {
                          if (list.length >= MAX_SPOT_TARIFFS) return list;
                          const source = list[index];
                          const copy: DraftTariff = {
                            ...source,
                            name: `${source.name} ${ts.tariffCopySuffix}`
                              .trim()
                              .slice(0, TARIFF_NAME_MAX_LENGTH),
                            rows: source.rows.map(row => ({ ...row })),
                            periods: source.periods.map(period => ({
                              ...period,
                            })),
                          };
                          return [
                            ...list.slice(0, index + 1),
                            copy,
                            ...list.slice(index + 1),
                          ];
                        })
                      }
                      aria-label={ts.tariffDuplicateAria(
                        tariff.name || ts.tariffNamePlaceholder
                      )}
                    >
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  )}
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
                {/* Währung ist Pflicht (#395) – als Auswahl, damit «Fr.»,
                    «SFr» und «CHF» nicht drei Währungen werden. Die
                    Einheit («pro Tag») bleibt Freitext und freiwillig. */}
                <div className="mt-2 flex items-center gap-2">
                  <select
                    className="h-9 w-24 shrink-0 rounded-md border border-input bg-background px-2 text-sm"
                    value={tariff.currency}
                    aria-label={ts.tariffCurrencyAria}
                    onChange={e =>
                      patch(index, {
                        currency: e.target.value as TariffCurrency,
                      })
                    }
                  >
                    {TARIFF_CURRENCIES.map(code => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={tariff.unit}
                    maxLength={TARIFF_UNIT_MAX_LENGTH}
                    placeholder={ts.tariffUnitPlaceholder}
                    aria-label={ts.tariffUnitPlaceholder}
                    onChange={e => patch(index, { unit: e.target.value })}
                  />
                </div>

                {/* Zeiträume (#394): mehrere «von–bis», ohne Jahr – die
                    Saison wiederholt sich. Freiwillig: Ein Tarif ohne
                    Zeitraum ist ein gültiger Tarif. */}
                {tariff.periods.length > 0 && (
                  <ul className="mt-2 space-y-2">
                    {tariff.periods.map((period, periodIndex) => (
                      <li key={periodIndex} className="flex items-center gap-2">
                        <Input
                          value={period.from}
                          className="w-24"
                          placeholder="02.04."
                          aria-label={ts.tariffPeriodFromAria}
                          onChange={e =>
                            patch(index, {
                              periods: tariff.periods.map((entry, i) =>
                                i === periodIndex
                                  ? { ...entry, from: e.target.value }
                                  : entry
                              ),
                            })
                          }
                        />
                        <span
                          className="text-muted-foreground"
                          aria-hidden="true"
                        >
                          –
                        </span>
                        <Input
                          value={period.to}
                          className="w-24"
                          placeholder="06.04."
                          aria-label={ts.tariffPeriodToAria}
                          onChange={e =>
                            patch(index, {
                              periods: tariff.periods.map((entry, i) =>
                                i === periodIndex
                                  ? { ...entry, to: e.target.value }
                                  : entry
                              ),
                            })
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0 text-muted-foreground/60 hover:text-destructive"
                          aria-label={ts.tariffPeriodRemoveAria}
                          onClick={() =>
                            patch(index, {
                              periods: tariff.periods.filter(
                                (_, i) => i !== periodIndex
                              ),
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                {tariff.periods.length < MAX_TARIFF_PERIODS && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1"
                    onClick={() =>
                      patch(index, {
                        periods: [...tariff.periods, { from: "", to: "" }],
                      })
                    }
                  >
                    <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    {ts.tariffPeriodAdd}
                  </Button>
                )}

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
                      {/* Einmalig statt pro Nacht (#415): Endreinigung,
                          Buchungsgebühr – der Schätzer zählt sie einmal. */}
                      <Button
                        type="button"
                        variant={row.oneOff ? "secondary" : "ghost"}
                        size="sm"
                        className="h-9 shrink-0 px-2 text-xs"
                        aria-pressed={row.oneOff}
                        aria-label={ts.tariffRowOneOffAria(
                          row.label || ts.tariffRowLabelPlaceholder
                        )}
                        onClick={() =>
                          patch(index, {
                            rows: tariff.rows.map((r, i) =>
                              i === rowIndex ? { ...r, oneOff: !r.oneOff } : r
                            ),
                          })
                        }
                      >
                        {ts.tariffRowOneOff}
                      </Button>
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
                        rows: [
                          ...tariff.rows,
                          { label: "", price: "", oneOff: false },
                        ],
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
                    {
                      name: "",
                      rows: [{ label: "", price: "", oneOff: false }],
                      currency: DEFAULT_TARIFF_CURRENCY,
                      unit: "",
                      periods: [],
                    },
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
