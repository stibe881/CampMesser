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
import { LOCALE_TAGS } from "@shared/i18n";
import { todayIso } from "@shared/localDate";
import {
  FUEL_MAX_LITERS10,
  FUEL_MAX_ODOMETER_KM,
  averageConsumptionL100,
  fuelMonthlyCosts,
  fuelSegments,
} from "@shared/fuelLog";
import { fuelLogCsvFileName, fuelLogToCsv } from "@shared/fuelLogCsv";
import { loadVehicles } from "@/lib/vehicleStore";
import { cn } from "@/lib/utils";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
  // Fahrzeug (#503): Namen aus den Fahrzeug-Profilen (#200) – wer Auto
  // UND Wohnmobil fährt, bekommt sonst Verbrauchs-Brei.
  const vehicles = useState(() => loadVehicles(t.level.profileNames))[0];
  const [vehicle, setVehicle] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState<string>("alle");

  /** Fahrzeuge, die im Tankbuch tatsächlich vorkommen. */
  const usedVehicles = useMemo(() => {
    const names = new Set<string>();
    let unassigned = false;
    fills.forEach(fill => {
      if (fill.vehicle) names.add(fill.vehicle);
      else unassigned = true;
    });
    return { names: Array.from(names).sort(), unassigned };
  }, [fills]);
  const filteredFills = useMemo(
    () =>
      vehicleFilter === "alle"
        ? fills
        : fills.filter(fill =>
            vehicleFilter === ""
              ? fill.vehicle == null
              : fill.vehicle === vehicleFilter
          ),
    [fills, vehicleFilter]
  );

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

  const average = useMemo(
    () => averageConsumptionL100(filteredFills),
    [filteredFills]
  );
  /** Verbrauch je Füllung: Abschnitt, der an dieser Füllung ENDET. */
  const segmentByToKm = useMemo(() => {
    const map = new Map<number, ReturnType<typeof fuelSegments>[number]>();
    fuelSegments(filteredFills).forEach(segment =>
      map.set(segment.toKm, segment)
    );
    return map;
  }, [filteredFills]);

  /** Tank-Kosten pro Monat (#610) – nur Füllungen mit erfasstem Betrag. */
  const monthlyCosts = useMemo(
    () => fuelMonthlyCosts(filteredFills),
    [filteredFills]
  );

  /** Verbrauchs-Verlauf (#504): plausible Abschnitte, älteste zuerst. */
  const chartData = useMemo(
    () =>
      fuelSegments(filteredFills)
        .filter(segment => segment.plausible)
        .map(segment => ({ km: segment.toKm, l100: segment.l100 })),
    [filteredFills]
  );

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
    addMutation.mutate({
      day,
      odometerKm,
      liters10,
      priceRappen,
      vehicle: vehicle || null,
    });
  };

  /**
   * CSV-Export (#477): gleiches Blob-Muster wie bei der Reisekasse (#258)
   * – rein im Browser, die Datei landet im Download-Ordner.
   */
  const downloadCsv = () => {
    try {
      const csv = fuelLogToCsv(filteredFills, { headers: tf.csvHeaders });
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
          {/* Fahrzeug-Filter (#503): erst sichtbar, wenn das Tankbuch
              überhaupt Fahrzeuge kennt */}
          {usedVehicles.names.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {[
                ["alle", tf.vehicleAll] as const,
                ...usedVehicles.names.map(name => [name, name] as const),
                ...(usedVehicles.unassigned
                  ? [["", tf.vehicleNone] as const]
                  : []),
              ].map(([value, label]) => (
                <button
                  key={value === "" ? "__none" : value}
                  type="button"
                  onClick={() => setVehicleFilter(value)}
                  aria-pressed={vehicleFilter === value}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm transition-colors",
                    vehicleFilter === value
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

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

          {/* Tank-Kosten pro Monat (#610): was das Fahren wirklich kostet –
              nur Füllungen mit Betrag, ohne Betrag wird nichts geraten */}
          {monthlyCosts.length > 0 && (
            <Card className="mb-5">
              <CardContent className="pt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {tf.monthlyTitle}
                </p>
                <ul className="mt-2 space-y-1">
                  {monthlyCosts.map(entry => (
                    <li
                      key={entry.month}
                      className="flex items-baseline justify-between text-sm"
                    >
                      <span>
                        {new Date(
                          `${entry.month}-01T00:00:00`
                        ).toLocaleDateString(LOCALE_TAGS[lang], {
                          month: "long",
                          year: "numeric",
                        })}
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          {tf.monthlyFills(entry.fills)}
                        </span>
                      </span>
                      <span className="font-medium tabular-nums">
                        CHF {formatChf(entry.totalRappen, lang)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">
                  {tf.monthlyHint}
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

          {/* Verbrauchs-Verlauf (#504): ein schleichender Mehrverbrauch
              fällt in Zahlenreihen nicht auf – als Linie schon. Erst ab
              zwei plausiblen Abschnitten ist eine Linie ehrlich. */}
          {chartData.length >= 2 && (
            <Card className="mb-5">
              <CardContent className="pt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {tf.chartTitle}
                </p>
                <div className="mt-2 h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 5, right: 8, bottom: 0, left: -18 }}
                    >
                      <XAxis
                        dataKey="km"
                        tickFormatter={value => `${Math.round(value / 1000)}k`}
                        fontSize={11}
                      />
                      <YAxis
                        domain={["dataMin - 1", "dataMax + 1"]}
                        tickFormatter={value => Number(value).toFixed(0)}
                        fontSize={11}
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          `${value.toFixed(1)} l/100 km`,
                          "",
                        ]}
                        labelFormatter={value =>
                          `${Number(value).toLocaleString()} km`
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="l100"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tf.chartHint}
                </p>
              </CardContent>
            </Card>
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
                {/* Fahrzeug (#503): aus den Fahrzeug-Profilen (#200) */}
                <div>
                  <Label htmlFor="fuel-vehicle">{tf.vehicleLabel}</Label>
                  <select
                    id="fuel-vehicle"
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={vehicle}
                    onChange={e => setVehicle(e.target.value)}
                  >
                    <option value="">{tf.vehicleNone}</option>
                    {vehicles.vehicles.map(profile => (
                      <option key={profile.id} value={profile.name}>
                        {profile.name}
                      </option>
                    ))}
                  </select>
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
          ) : filteredFills.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tf.empty}</p>
          ) : (
            <ul className="space-y-1.5">
              {filteredFills.map(fill => {
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
                        {fill.vehicle && ` · ${fill.vehicle}`}
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
