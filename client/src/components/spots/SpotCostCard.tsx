/**
 * Platzkosten im Dossier (#243): Preis und Nebenkosten pro Nacht, die
 * grobe Schätzung über alle bisherigen Nächte und die Tarif-Tafel (#369)
 * – Karte und Bearbeiten-Dialog in einem Baustein. Aus SpotDetail.tsx
 * herausgelöst (#458); von der Seite braucht der Block nur die
 * Kosten-Felder des Platzes und die Nächte-Summe aus der Statistik.
 */
import { useState } from "react";
import { Wallet } from "lucide-react";
import { toast } from "sonner";
import SpotTariffs from "@/components/spots/SpotTariffs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { nightlyRappen } from "@shared/spotCosts";
import { formatChf, parseChfInput, rappenToInput } from "@/lib/money";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/i18n";

export default function SpotCostCard({
  spot,
  totalNights,
  className,
}: {
  spot: {
    id: number;
    name: string;
    pricePerNightRappen: number | null;
    extraPerNightRappen: number | null;
    tariffsJson: string | null;
  };
  /** Bisherige Nächte an diesem Platz – Grundlage der Kosten-Schätzung. */
  totalNights: number;
  className?: string;
}) {
  const { lang, t } = useI18n();
  const utils = trpc.useUtils();
  const updateMutation = trpc.spots.update.useMutation();
  // Beide Beträge als Franken-Text im Formular, gespeichert wird in
  // Rappen (Muster Reisekasse/Inventar).
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState({ price: "", extra: "" });

  /** Rappen als «CHF 45.50» – gleiche Schreibweise wie in der Reisekasse. */
  const fmtChf = (rappen: number) =>
    `${t.tripExpenses.currency} ${formatChf(rappen, lang)}`;

  const openDialog = () => {
    setDraft({
      price: rappenToInput(spot.pricePerNightRappen),
      extra: rappenToInput(spot.extraPerNightRappen),
    });
    setDialogOpen(true);
  };

  const saveCosts = () => {
    updateMutation.mutate(
      {
        id: spot.id,
        // Leeres Feld → 0 → der Server löscht den Wert (null)
        pricePerNightRappen: parseChfInput(draft.price) ?? 0,
        extraPerNightRappen: parseChfInput(draft.extra) ?? 0,
      },
      {
        onSuccess: () => {
          utils.spots.list.invalidate();
          setDialogOpen(false);
          toast.success(t.spotDetail.costSaved);
        },
        onError: () => toast.error(t.common.saveFailed),
      }
    );
  };

  /** Preis pro Nacht inkl. Nebenkosten in Rappen; null = nichts erfasst. */
  const spotNightly = nightlyRappen(spot);
  /** Grobe Kosten-Schätzung für alle bisherigen Nächte an diesem Platz. */
  const costEstimateRappen =
    spotNightly !== null && totalNights > 0 ? spotNightly * totalNights : null;

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.spotDetail.costTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {spotNightly !== null ? (
            <>
              <dl className="space-y-2 text-sm">
                {spot.pricePerNightRappen ? (
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <dt className="w-36 shrink-0 text-muted-foreground">
                      {t.spotDetail.costPriceLabel}
                    </dt>
                    <dd className="font-medium">
                      {fmtChf(spot.pricePerNightRappen)}
                    </dd>
                  </div>
                ) : null}
                {spot.extraPerNightRappen ? (
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <dt className="w-36 shrink-0 text-muted-foreground">
                      {t.spotDetail.costExtraLabel}
                    </dt>
                    <dd className="font-medium">
                      {fmtChf(spot.extraPerNightRappen)}
                    </dd>
                  </div>
                ) : null}
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <dt className="w-36 shrink-0 text-muted-foreground">
                    {t.spotDetail.costNightlyLabel}
                  </dt>
                  <dd className="font-serif text-lg font-bold text-primary">
                    {fmtChf(spotNightly)}
                  </dd>
                </div>
              </dl>
              {costEstimateRappen !== null && (
                <p className="mt-3 rounded-lg bg-accent/50 px-3 py-2 text-xs text-accent-foreground">
                  {t.spotDetail.costEstimate(
                    totalNights,
                    fmtChf(costEstimateRappen)
                  )}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {t.spotDetail.costHint}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t.spotDetail.costEmpty}
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={openDialog}
          >
            {t.spotDetail.costEditButton}
          </Button>
          {/* Mehrere Tarife (#369): So steht es auf der Tafel an der
              Rezeption – Nebensaison/Hauptsaison, darunter Erwachsene,
              Kind, Stellplatz. Der Preis oben bleibt der eine Wert für
              den Platz-Vergleich in der Statistik. */}
          <SpotTariffs spotId={spot.id} tariffsJson={spot.tariffsJson} />
        </CardContent>
      </Card>

      {/* Platzkosten bearbeiten (#243) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">
              {t.spotDetail.costDialogTitle}
            </DialogTitle>
            <DialogDescription>{t.spotDetail.costDialogDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cost-price">
                {t.spotDetail.costPriceInputLabel}
              </Label>
              <Input
                id="cost-price"
                type="text"
                inputMode="decimal"
                maxLength={10}
                value={draft.price}
                onChange={e =>
                  setDraft(prev => ({ ...prev, price: e.target.value }))
                }
                placeholder={t.spotDetail.costPricePlaceholder}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cost-extra">
                {t.spotDetail.costExtraInputLabel}
              </Label>
              <Input
                id="cost-extra"
                type="text"
                inputMode="decimal"
                maxLength={10}
                value={draft.extra}
                onChange={e =>
                  setDraft(prev => ({ ...prev, extra: e.target.value }))
                }
                placeholder={t.spotDetail.costExtraPlaceholder}
              />
              <p className="text-xs text-muted-foreground">
                {t.spotDetail.costExtraHelp}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={saveCosts} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t.common.saving : t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
