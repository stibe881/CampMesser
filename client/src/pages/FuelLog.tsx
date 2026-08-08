/**
 * Tankbuch (#443): Tankfüllungen mit Kilometerstand und Litern – daraus
 * der echte Verbrauch statt des geratenen Standardwerts im
 * Fahrtkosten-Rechner (#259). Rechnung in shared/fuelLog.ts; es gilt die
 * übliche Tankbuch-Konvention «immer volltanken».
 */
import { useMemo, useState } from "react";
import { Download, Fuel, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import QueryError from "@/components/QueryError";
import LoginPrompt from "@/components/LoginPrompt";
import { useConfirm } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { fmtShort } from "@/lib/dateFormat";
import { formatChf, parseChfInput } from "@/lib/money";
import { todayIso } from "@shared/localDate";
import {
  FUEL_MAX_LITERS10,
  FUEL_MAX_ODOMETER_KM,
  averageConsumptionL100,
  fuelSegments,
} from "@shared/fuelLog";
import { fuelLogCsvFileName, fuelLogToCsv } from "@shared/fuelLogCsv";

export default function FuelLogPage() {
  const ask = useConfirm();
  const { lang, t } = useI18n();
  const tf = t.fuelLog;
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const query = trpc.fuelLog.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const fills = useMemo(() => query.data ?? [], [query.data]);

  const [day, setDay] = useState(todayIso);
  const [odometer, setOdometer] = useState("");
  const [liters, setLiters] = useState("");
  const [price, setPrice] = useState("");

  const addMutation = trpc.fuelLog.add.useMutation({
    onSuccess: () => {
      utils.fuelLog.list.invalidate();
      setOdometer("");
      setLiters("");
      setPrice("");
      toast.success(tf.saved);
    },
    onError: e => toast.error(e.message || t.common.saveFailed),
  });
  const removeMutation = trpc.fuelLog.remove.useMutation({
    onSuccess: () => utils.fuelLog.list.invalidate(),
    onError: () => toast.error(t.common.actionFailed),
  });

  const average = useMemo(() => averageConsumptionL100(fills), [fills]);
  /** Verbrauch je Füllung: Abschnitt, der an dieser Füllung ENDET. */
  const segmentByToKm = useMemo(() => {
    const map = new Map<number, ReturnType<typeof fuelSegments>[number]>();
    fuelSegments(fills).forEach(segment => map.set(segment.toKm, segment));
    return map;
  }, [fills]);

  const submit = () => {
    const odometerKm = Math.round(Number(odometer.replace(",", ".")));
    if (
      !Number.isFinite(odometerKm) ||
      odometerKm < 0 ||
      odometerKm > FUEL_MAX_ODOMETER_KM
    ) {
      toast.error(tf.odometerInvalid);
      return;
    }
    const litersValue = Number(liters.replace(",", "."));
    const liters10 = Math.round(litersValue * 10);
    if (
      !Number.isFinite(litersValue) ||
      liters10 < 1 ||
      liters10 > FUEL_MAX_LITERS10
    ) {
      toast.error(tf.litersInvalid);
      return;
    }
    const priceRappen = price.trim() ? parseChfInput(price) : null;
    if (price.trim() && (priceRappen === null || priceRappen < 1)) {
      toast.error(tf.priceInvalid);
      return;
    }
    addMutation.mutate({ day, odometerKm, liters10, priceRappen });
  };

  /**
   * CSV-Export (#477): gleiches Blob-Muster wie bei der Reisekasse (#258)
   * – rein im Browser, die Datei landet im Download-Ordner.
   */
  const downloadCsv = () => {
    try {
      const csv = fuelLogToCsv(fills, { headers: tf.csvHeaders });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fuelLogCsvFileName(todayIso());
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t.common.actionFailed);
    }
  };

  if (loading) return null;

  return (
    <div className="container max-w-3xl py-6 md:py-8">
      <PageHeader title={tf.title} subtitle={tf.subtitle} />

      {!isAuthenticated ? (
        <LoginPrompt feature={tf.loginFeature} />
      ) : (
        <>
          {average !== null && (
            <Card className="mb-5">
              <CardContent className="pt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {tf.averageTitle}
                </p>
                <p className="mt-1 text-3xl font-bold text-primary">
                  {average.toFixed(1)}{" "}
                  <span className="text-base font-medium text-muted-foreground">
                    l/100 km
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tf.averageHint}
                </p>
              </CardContent>
            </Card>
          )}

          {/* CSV-Export (#477): fürs Weiterrechnen daheim */}
          {fills.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mb-5"
              onClick={downloadCsv}
            >
              <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {tf.csvButton}
            </Button>
          )}

          {/* Erfassen */}
          <Card className="mb-5">
            <CardContent className="pt-5">
              <p className="mb-2 flex items-center gap-2 font-serif text-lg font-bold">
                <Fuel className="h-5 w-5 text-primary" aria-hidden="true" />
                {tf.addTitle}
              </p>
              <p className="mb-3 text-xs text-muted-foreground">{tf.addHint}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <Label htmlFor="fuel-day">{tf.dayLabel}</Label>
                  <Input
                    id="fuel-day"
                    className="mt-1"
                    type="date"
                    value={day}
                    onChange={e => setDay(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="fuel-odometer">{tf.odometerLabel}</Label>
                  <Input
                    id="fuel-odometer"
                    className="mt-1"
                    inputMode="numeric"
                    placeholder="84500"
                    value={odometer}
                    onChange={e => setOdometer(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="fuel-liters">{tf.litersLabel}</Label>
                  <Input
                    id="fuel-liters"
                    className="mt-1"
                    inputMode="decimal"
                    placeholder="42.5"
                    value={liters}
                    onChange={e => setLiters(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="fuel-price">{tf.priceLabel}</Label>
                  <Input
                    id="fuel-price"
                    className="mt-1"
                    inputMode="decimal"
                    placeholder="74.90"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                  />
                </div>
              </div>
              <Button
                className="mt-3"
                size="sm"
                disabled={addMutation.isPending}
                onClick={submit}
              >
                <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {tf.addButton}
              </Button>
            </CardContent>
          </Card>

          {/* Füllungen */}
          {query.isError ? (
            <QueryError
              onRetry={() => void query.refetch()}
              retrying={query.isFetching}
            />
          ) : query.isLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t.common.loading}
            </p>
          ) : fills.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tf.empty}</p>
          ) : (
            <ul className="space-y-1.5">
              {fills.map(fill => {
                const segment = segmentByToKm.get(fill.odometerKm);
                return (
                  <li
                    key={fill.id}
                    className="flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {fill.odometerKm.toLocaleString()} km ·{" "}
                        {(fill.liters10 / 10).toFixed(1)} l
                        {fill.priceRappen != null &&
                          ` · CHF ${formatChf(fill.priceRappen, lang)}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fmtShort(new Date(`${fill.day}T00:00:00`), lang)}
                        {segment &&
                          ` · ${tf.segmentLine(
                            segment.distanceKm,
                            segment.l100.toFixed(1)
                          )}`}
                        {segment && !segment.plausible && (
                          <span className="ml-1 text-destructive">
                            {tf.segmentImplausible}
                          </span>
                        )}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground/60 hover:text-destructive"
                      disabled={removeMutation.isPending}
                      onClick={async () => {
                        if (!(await ask({ title: tf.deleteConfirm }))) return;
                        removeMutation.mutate({ id: fill.id });
                      }}
                      aria-label={tf.deleteAria(fill.odometerKm)}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
