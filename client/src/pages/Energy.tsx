import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BatteryCharging,
  Compass,
  Loader2,
  Plus,
  Sun,
  Trash2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import FirewoodCalculator from "@/components/FirewoodCalculator";
import LoginPrompt from "@/components/LoginPrompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { LOCALE_TAGS } from "@shared/i18n";
import { compassDirection, computeSolarAlignment } from "@shared/solar";
import {
  BATTERY_CHEMISTRIES,
  COMMON_VOLTAGES,
  CONSUMER_TEMPLATES,
  DEFAULT_USABLE_PERCENT,
  MIN_USABLE_PERCENT,
  consumerBreakdown,
  evaluatePowerBudget,
  formatWh,
  runtimeDisplay,
  sanitizePowerStorage,
  usablePercentOf,
  type PowerStorage,
} from "@shared/powerBudget";
import {
  DEFAULT_SYSTEM_EFFICIENCY,
  SOLAR_FORECAST_DAYS,
  SOLAR_LOSS_STEPS,
  averageYieldWh,
  dailyYieldWh,
  parseSolarForecast,
  sanitizeSolarPanel,
  solarBalance,
  solarForecastUrl,
  yieldFromSunHours,
  type RadiationDay,
  type SolarPanelSetup,
} from "@shared/solarForecast";
import { loadObstacleProfiles } from "@/lib/obstacleStore";
import { getProfileObstacles } from "@shared/obstacleProfiles";
import {
  loadPowerStorage,
  loadSolarPanel,
  savePowerStorage,
  saveSolarPanel,
} from "@/lib/energyStore";
import { useSyncedSetting } from "@/lib/useSyncedSetting";
import { cn } from "@/lib/utils";

/** Zahl aus einem Eingabefeld lesen: leer oder Unsinn ergibt null. */
function parseNumberInput(value: string): number | null {
  const cleaned = value.trim().replace(",", ".");
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/** Zahl fürs Eingabefeld: null bleibt leer. */
function numberToInput(value: number | null): string {
  return value === null ? "" : String(value);
}

export default function EnergyPage() {
  const { isAuthenticated, loading } = useAuth();
  const { lang, t } = useI18n();
  const utils = trpc.useUtils();
  const query = trpc.energy.consumers.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Strom-Speicher (#229): Einstellung, keine DB-Tabelle – lokal plus Geräte-Sync
  const [storage, setStorage] = useState<PowerStorage>(() =>
    loadPowerStorage()
  );
  const [capacityInputs, setCapacityInputs] = useState(() => {
    const initial = loadPowerStorage();
    return {
      wh: numberToInput(initial.capacityWh),
      ah: numberToInput(initial.capacityAh),
      voltage: numberToInput(initial.voltage),
    };
  });
  const storageSync = useSyncedSetting<PowerStorage>("powerStorage", value => {
    const clean = sanitizePowerStorage(value);
    setStorage(clean);
    setCapacityInputs({
      wh: numberToInput(clean.capacityWh),
      ah: numberToInput(clean.capacityAh),
      voltage: numberToInput(clean.voltage),
    });
  });
  const writeStorage = (patch: Partial<PowerStorage>) => {
    const next = sanitizePowerStorage({ ...storage, ...patch });
    setStorage(next);
    savePowerStorage(next);
    storageSync.push(next);
  };

  // Solaranlage (#230): Nennleistung und Aufstellung, ebenfalls über den Geräte-Sync
  const [panel, setPanel] = useState<SolarPanelSetup>(() => loadSolarPanel());
  const [solarWatts, setSolarWatts] = useState(() =>
    numberToInput(loadSolarPanel().watts)
  );
  const panelRef = useRef(panel);
  panelRef.current = panel;
  const panelSync = useSyncedSetting<SolarPanelSetup>("solarPanel", value => {
    const clean = sanitizeSolarPanel(value);
    setPanel(clean);
    setSolarWatts(numberToInput(clean.watts));
  });
  const writePanel = (patch: Partial<SolarPanelSetup>) => {
    const next = sanitizeSolarPanel({ ...panel, ...patch });
    setPanel(next);
    panelRef.current = next;
    saveSolarPanel(next);
    panelSync.push(next);
  };

  const [sunHours, setSunHours] = useState(4);
  // Auto: Prognose-Wert wird übernommen; Manuell: eigener Wert bleibt bestehen
  const [sunHoursAuto, setSunHoursAuto] = useState(true);
  const sunHoursAutoRef = useRef(true);
  sunHoursAutoRef.current = sunHoursAuto;
  const [form, setForm] = useState({ name: "", watts: "", hoursPerDay: "" });
  const [forecastState, setForecastState] = useState<
    | { status: "idle" | "loading" | "error" }
    | {
        status: "ok";
        avgSunHours: number;
        /** Tageswerte der Einstrahlung – Grundlage der Ertrags-Prognose (#230) */
        days: RadiationDay[];
        // null = eigener Standort, sonst Name des Zeltplatz-Favoriten
        sourceSpotName: string | null;
      }
  >({ status: "idle" });
  // Koordinaten des zuletzt geladenen Orts – Basis für die Panel-Ausrichtungshilfe.
  // spotId gesetzt = Prognose kam von einem Zeltplatz-Favoriten → dessen Hindernis-Profil nutzen
  const [panelCoords, setPanelCoords] = useState<{
    lat: number;
    lng: number;
    spotId?: number;
  } | null>(null);
  // Hindernis-Profile aus dem Sonnen-Kompass (einmal beim Öffnen laden)
  const [profiles] = useState(() => loadObstacleProfiles());
  const spotsQuery = trpc.spots.list.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  // Aktuelle Favoritenliste für Callbacks (GPS-Fehler kann vor dem Laden der Favoriten eintreten)
  const spotsRef = useRef<typeof spotsQuery.data>(undefined);
  spotsRef.current = spotsQuery.data;

  /**
   * Prognose für Koordinaten laden: Sonnenschein-Dauer (für die effektiven
   * Sonnenstunden) und Einstrahlung (für den Ertrag, #230) im selben Abruf.
   * Ein frei aufgestelltes Panel richtet man in die Sonne – dann fragen wir
   * die Einstrahlung gleich für die Neigung und Ausrichtung ab, welche die
   * Ausrichtungshilfe für diesen Ort empfiehlt.
   */
  const fetchSunshine = async (
    lat: number,
    lng: number,
    sourceSpotName: string | null,
    spotId?: number
  ) => {
    setPanelCoords({ lat, lng, spotId });
    const alignment =
      panelRef.current.mount === "portable"
        ? computeSolarAlignment(
            new Date(),
            lat,
            lng,
            getProfileObstacles(profiles, spotId ?? null)
          )
        : null;
    const res = await fetch(
      solarForecastUrl(
        lat,
        lng,
        SOLAR_FORECAST_DAYS,
        alignment ? { tilt: alignment.tilt, azimuth: alignment.azimuth } : null
      )
    );
    if (!res.ok) throw new Error("Wetterdienst nicht erreichbar");
    const days = parseSolarForecast(await res.json());
    if (days.length === 0) throw new Error("Keine Daten");
    const withSunshine = days.filter(d => d.sunshineHours !== null);
    const avgHours =
      withSunshine.length > 0
        ? withSunshine.reduce((s, d) => s + (d.sunshineHours ?? 0), 0) /
          withSunshine.length
        : 0;
    const rounded = Math.min(10, Math.round(avgHours * 2) / 2);
    if (sunHoursAutoRef.current) setSunHours(rounded);
    setForecastState({
      status: "ok",
      avgSunHours: rounded,
      days,
      sourceSpotName,
    });
  };

  const applyWeatherForecast = () => {
    setForecastState({ status: "loading" });
    const fallbackToSpot = () => {
      // Ohne GPS: Prognose für den ersten gespeicherten Zeltplatz übernehmen
      const spot = spotsRef.current?.[0];
      if (spot) {
        fetchSunshine(spot.latitude, spot.longitude, spot.name, spot.id).catch(
          () => setForecastState({ status: "error" })
        );
      } else {
        setForecastState({ status: "error" });
      }
    };
    if (!navigator.geolocation) {
      fallbackToSpot();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos =>
        fetchSunshine(pos.coords.latitude, pos.coords.longitude, null).catch(
          () => setForecastState({ status: "error" })
        ),
      fallbackToSpot,
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
    );
  };

  // Prognose beim Seitenaufruf automatisch übernehmen (stille Fehlerbehandlung:
  // ohne Standortfreigabe bleibt der manuelle Richtwert bestehen)
  useEffect(() => {
    applyWeatherForecast();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Falls der erste Versuch scheiterte (z. B. GPS abgelehnt, Favoriten noch nicht
  // geladen): erneut versuchen, sobald die Favoriten verfügbar sind
  const retriedWithSpots = useRef(false);
  useEffect(() => {
    if (
      forecastState.status === "error" &&
      !retriedWithSpots.current &&
      spotsQuery.data &&
      spotsQuery.data.length > 0
    ) {
      retriedWithSpots.current = true;
      const spot = spotsQuery.data[0];
      setForecastState({ status: "loading" });
      fetchSunshine(spot.latitude, spot.longitude, spot.name, spot.id).catch(
        () => setForecastState({ status: "error" })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forecastState.status, spotsQuery.data]);

  const addMutation = trpc.energy.add.useMutation({
    onSuccess: () => {
      utils.energy.consumers.invalidate();
      setForm({ name: "", watts: "", hoursPerDay: "" });
    },
    onError: () => toast.error(t.energy.saveFailed),
  });
  const updateMutation = trpc.energy.update.useMutation({
    onMutate: async input => {
      await utils.energy.consumers.cancel();
      const prev = utils.energy.consumers.getData();
      utils.energy.consumers.setData(undefined, old =>
        old?.map(c => (c.id === input.id ? { ...c, ...input } : c))
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) utils.energy.consumers.setData(undefined, ctx.prev);
    },
  });
  const removeMutation = trpc.energy.remove.useMutation({
    onSuccess: () => utils.energy.consumers.invalidate(),
  });

  const consumers = useMemo(() => query.data ?? [], [query.data]);

  const budgetConsumers = useMemo(
    () =>
      consumers.map(c => ({
        name: c.name,
        watts: c.watts,
        hoursPerDay: c.hoursPerDay,
        enabled: c.enabled,
      })),
    [consumers]
  );

  // Ertrags-Prognose (#230): Einstrahlung je Tag × Nennleistung × Wirkungsgrad
  const panelWatts = panel.watts ?? 0;
  const radiationDays = useMemo(
    () => (forecastState.status === "ok" ? forecastState.days : []),
    [forecastState]
  );
  const yieldDays = useMemo(
    () =>
      radiationDays.map(day => ({
        date: day.date,
        irradiationKwhPerM2: day.irradiationKwhPerM2,
        tilted: day.tilted,
        yieldWh: dailyYieldWh(panelWatts, day.irradiationKwhPerM2),
      })),
    [radiationDays, panelWatts]
  );
  // Im Auto-Modus zählt die Einstrahlungs-Prognose, im manuellen Modus der
  // eigene Sonnenstunden-Wert – zwei Wege zur selben Zahl, nie beide zugleich.
  const forecastYieldPerDay =
    yieldDays.length > 0 && panelWatts > 0 ? averageYieldWh(yieldDays) : null;
  const usesForecastYield = sunHoursAuto && forecastYieldPerDay !== null;
  const solarWhPerDay = usesForecastYield
    ? (forecastYieldPerDay ?? 0)
    : yieldFromSunHours(panelWatts, sunHours);

  const result = useMemo(
    () =>
      evaluatePowerBudget({
        storage,
        consumers: budgetConsumers,
        rechargeWhPerDay: solarWhPerDay,
      }),
    [storage, budgetConsumers, solarWhPerDay]
  );
  const shares = useMemo(
    () => consumerBreakdown(budgetConsumers),
    [budgetConsumers]
  );
  const sharePercent = (name: string) =>
    shares.find(s => s.name === name)?.percent ?? null;

  // Gegenüberstellung Ertrag ↔ Verbrauch über die Prognosetage
  const balance = useMemo(
    () =>
      solarBalance({
        days: yieldDays,
        dailyConsumptionWh: result.dailyConsumptionWh,
        startWh: result.availableWh,
        usableWh: result.usableWh,
      }),
    [yieldDays, result.dailyConsumptionWh, result.availableWh, result.usableWh]
  );

  // Optimale Panel-Ausrichtung für heute am zuletzt geladenen Ort. Kam die
  // Prognose von einem Zeltplatz-Favoriten, gilt dessen Hindernis-Profil,
  // sonst das allgemeine Profil aus dem Sonnen-Kompass.
  const obstacles = useMemo(
    () => getProfileObstacles(profiles, panelCoords?.spotId ?? null),
    [profiles, panelCoords?.spotId]
  );
  const alignment = useMemo(
    () =>
      panelCoords
        ? computeSolarAlignment(
            new Date(),
            panelCoords.lat,
            panelCoords.lng,
            obstacles
          )
        : null,
    [panelCoords, obstacles]
  );

  if (loading) {
    return (
      <div className="container flex justify-center py-16">
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          aria-label={t.common.loading}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-6">
        <PageHeader
          title={t.energy.title}
          subtitle={t.energy.subtitleLoggedOut}
        />
        <LoginPrompt feature={t.energy.loginFeature} />
      </div>
    );
  }

  const range = runtimeDisplay(result);
  const rangeLabel = result.selfSufficient
    ? t.energy.rangeSelfSufficient
    : range.unit === "hours"
      ? t.energy.rangeHours(range.value)
      : range.unit === "days"
        ? t.energy.rangeDays(range.value)
        : range.unit === "overMax"
          ? t.energy.rangeOverMax(range.value)
          : t.energy.rangeUnknown;
  const defaultUsablePercent = DEFAULT_USABLE_PERCENT[storage.chemistry];

  /** Prognosetag als kurzes Datum (Mittag, damit die Zeitzone nichts verschiebt). */
  const formatForecastDay = (date: string) =>
    date
      ? new Date(`${date}T12:00:00`).toLocaleDateString(LOCALE_TAGS[lang], {
          weekday: "short",
          day: "numeric",
          month: "short",
        })
      : "";

  const timeFormat: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  };

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader title={t.energy.title} subtitle={t.energy.subtitle} />

      {/* Ergebnis */}
      <Card
        className={cn(
          "mb-6",
          result.selfSufficient ? "border-primary/50 bg-accent/40" : ""
        )}
      >
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="text-center">
              <p
                className={cn(
                  "font-serif text-2xl font-bold",
                  result.status === "critical"
                    ? "text-destructive"
                    : "text-primary"
                )}
              >
                {rangeLabel}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.energy.rangeLabel}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {Math.round(result.dailyConsumptionWh)} Wh
              </p>
              <p className="text-xs text-muted-foreground">
                {t.energy.consumptionPerDay}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {Math.round(solarWhPerDay)} Wh
              </p>
              <p className="text-xs text-muted-foreground">
                {t.energy.solarPerDay}
              </p>
            </div>
            <div className="text-center">
              <p
                className={cn(
                  "text-2xl font-bold",
                  result.netDailyWh > 0 ? "text-destructive" : "text-primary"
                )}
              >
                {result.netDailyWh > 0 ? "−" : "+"}
                {Math.abs(Math.round(result.netDailyWh))} Wh
              </p>
              <p className="text-xs text-muted-foreground">
                {t.energy.balancePerDay}
              </p>
            </div>
          </div>

          {panelWatts > 0 && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {usesForecastYield
                ? t.energy.yieldSourceForecast
                : t.energy.yieldSourceSunHours}
            </p>
          )}

          {/* Restkapazität: was über der Tiefentlade-Reserve wirklich übrig ist */}
          <p className="mt-4 text-center text-xs text-muted-foreground">
            {result.nominalWh !== null &&
            result.usableWh !== null &&
            result.reserveWh !== null ? (
              <>
                <span className="font-semibold text-foreground">
                  {t.energy.availableLabel}:{" "}
                  {formatWh(result.availableWh ?? 0, lang)}
                </span>{" "}
                {t.energy.capacitySummary(
                  formatWh(result.nominalWh, lang),
                  formatWh(result.usableWh, lang),
                  formatWh(result.reserveWh, lang)
                )}
              </>
            ) : result.missing.includes("voltage") ? (
              t.energy.voltageMissing
            ) : (
              t.energy.capacityUnknown
            )}
          </p>

          {result.deepDischargeRisk && (
            <p className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <span>
                <strong>{t.energy.deepDischargeTitle}</strong>{" "}
                {t.energy.deepDischargeText}
              </span>
            </p>
          )}

          {result.missing.includes("storage") && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {t.energy.missingStorageHint}
            </p>
          )}
          {result.missing.includes("consumers") && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {t.energy.missingConsumersHint}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Speicher: Kapazität, Bauart, nutzbarer Anteil und Ladestand */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="mb-1.5 flex items-center gap-2">
            <BatteryCharging
              className="h-4 w-4 text-primary"
              aria-hidden="true"
            />
            <h2 className="font-serif text-base font-semibold">
              {t.energy.storageTitle}
            </h2>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            {t.energy.storageIntro}
          </p>

          <Label className="text-xs text-muted-foreground">
            {t.energy.chemistryLabel}
          </Label>
          <div className="mb-4 mt-1.5 flex flex-wrap gap-1.5">
            {BATTERY_CHEMISTRIES.map(chemistry => (
              <button
                key={chemistry}
                type="button"
                onClick={() => writeStorage({ chemistry })}
                aria-pressed={storage.chemistry === chemistry}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  storage.chemistry === chemistry
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {t.energy.chemistryNames[chemistry]}
              </button>
            ))}
          </div>

          <Label className="text-xs text-muted-foreground">
            {t.energy.modeLabel}
          </Label>
          <div className="mb-3 mt-1.5 flex gap-1.5">
            {(["wh", "ah"] as const).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => writeStorage({ mode })}
                aria-pressed={storage.mode === mode}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  storage.mode === mode
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {mode === "wh" ? t.energy.modeWh : t.energy.modeAh}
              </button>
            ))}
          </div>

          {storage.mode === "wh" ? (
            <div className="mb-4">
              <Label htmlFor="capacity-wh">{t.energy.capacityWhLabel}</Label>
              <Input
                id="capacity-wh"
                type="number"
                min="0"
                inputMode="decimal"
                className="mt-1.5"
                value={capacityInputs.wh}
                onChange={e => {
                  setCapacityInputs(v => ({ ...v, wh: e.target.value }));
                  writeStorage({
                    capacityWh: parseNumberInput(e.target.value),
                  });
                }}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t.energy.capacityWhHint}
              </p>
            </div>
          ) : (
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="capacity-ah">{t.energy.capacityAhLabel}</Label>
                <Input
                  id="capacity-ah"
                  type="number"
                  min="0"
                  inputMode="decimal"
                  className="mt-1.5"
                  value={capacityInputs.ah}
                  onChange={e => {
                    setCapacityInputs(v => ({ ...v, ah: e.target.value }));
                    writeStorage({
                      capacityAh: parseNumberInput(e.target.value),
                    });
                  }}
                />
              </div>
              <div>
                <Label htmlFor="voltage">{t.energy.voltageLabel}</Label>
                <Input
                  id="voltage"
                  type="number"
                  min="0"
                  inputMode="decimal"
                  className="mt-1.5"
                  value={capacityInputs.voltage}
                  onChange={e => {
                    setCapacityInputs(v => ({ ...v, voltage: e.target.value }));
                    writeStorage({ voltage: parseNumberInput(e.target.value) });
                  }}
                />
                <div className="mt-1.5 flex gap-1.5">
                  {COMMON_VOLTAGES.map(volt => (
                    <button
                      key={volt}
                      type="button"
                      onClick={() => {
                        setCapacityInputs(v => ({
                          ...v,
                          voltage: String(volt),
                        }));
                        writeStorage({ voltage: volt });
                      }}
                      className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    >
                      {volt} V
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {t.energy.voltageHint}
                </p>
              </div>
            </div>
          )}

          <div className="mb-1.5 flex items-center justify-between">
            <Label htmlFor="usable-share">{t.energy.usableLabel}</Label>
            <span className="rounded-md bg-muted px-2.5 py-1 font-mono text-sm font-semibold">
              {usablePercentOf(storage)} %
            </span>
          </div>
          <Slider
            id="usable-share"
            min={MIN_USABLE_PERCENT}
            max={100}
            step={5}
            value={[usablePercentOf(storage)]}
            onValueChange={v => writeStorage({ usablePercent: v[0] })}
            aria-label={t.energy.usableAria}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            {t.energy.usableDefaultHint(defaultUsablePercent)}
            {storage.usablePercent !== null && (
              <>
                {" "}
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => writeStorage({ usablePercent: null })}
                >
                  {t.energy.usableReset}
                </button>
              </>
            )}
          </p>

          <div className="mb-1.5 mt-4 flex items-center justify-between">
            <Label htmlFor="charge-state">{t.energy.chargeLabel}</Label>
            <span className="rounded-md bg-muted px-2.5 py-1 font-mono text-sm font-semibold">
              {storage.chargePercent} %
            </span>
          </div>
          <Slider
            id="charge-state"
            min={0}
            max={100}
            step={5}
            value={[storage.chargePercent]}
            onValueChange={v => writeStorage({ chargePercent: v[0] })}
            aria-label={t.energy.chargeAria}
          />
        </CardContent>
      </Card>

      {/* Solaranlage: Nennleistung und Aufstellung */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="mb-1.5 flex items-center gap-2">
            <Sun className="h-4 w-4 text-chart-1" aria-hidden="true" />
            <Label htmlFor="solar">{t.energy.solarLabel}</Label>
          </div>
          <Input
            id="solar"
            type="number"
            min="0"
            value={solarWatts}
            onChange={e => {
              setSolarWatts(e.target.value);
              writePanel({ watts: parseNumberInput(e.target.value) });
            }}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            {t.energy.solarHint}
          </p>

          <Label className="mt-4 block text-xs text-muted-foreground">
            {t.energy.mountLabel}
          </Label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {(["roof", "portable"] as const).map(mount => (
              <button
                key={mount}
                type="button"
                aria-pressed={panel.mount === mount}
                onClick={() => {
                  if (panel.mount === mount) return;
                  writePanel({ mount });
                  // Die Aufstellung entscheidet, welche Einstrahlung wir
                  // abrufen – darum gleich neu laden
                  applyWeatherForecast();
                }}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  panel.mount === mount
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {mount === "roof" ? t.energy.mountRoof : t.energy.mountPortable}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {panel.mount === "roof"
              ? t.energy.mountRoofHint
              : t.energy.mountPortableHint}
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="mb-2 flex items-center justify-between">
            <Label htmlFor="sun-hours">{t.energy.sunHoursLabel}</Label>
            <span className="rounded-md bg-muted px-2.5 py-1 font-mono text-sm font-semibold">
              {sunHours} h
            </span>
          </div>
          <div className="mb-3 flex items-center justify-between rounded-lg bg-accent/50 px-3 py-2">
            <Label htmlFor="sun-auto" className="cursor-pointer text-sm">
              {t.energy.sunAutoLabel}
            </Label>
            <Switch
              id="sun-auto"
              checked={sunHoursAuto}
              onCheckedChange={checked => {
                setSunHoursAuto(checked);
                if (checked) {
                  // Zurück auf Auto: zuletzt geladene Prognose sofort übernehmen
                  if (forecastState.status === "ok")
                    setSunHours(forecastState.avgSunHours);
                  else applyWeatherForecast();
                }
              }}
              aria-label={t.energy.sunAutoAria}
            />
          </div>
          <Slider
            id="sun-hours"
            min={0}
            max={10}
            step={0.5}
            value={[sunHours]}
            onValueChange={v => {
              setSunHours(v[0]);
              // Manuelles Ziehen schaltet auf manuellen Modus um
              if (sunHoursAuto) setSunHoursAuto(false);
            }}
            aria-label={t.energy.sunSliderAria}
          />
          {!sunHoursAuto && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t.energy.manualModeHint}
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={applyWeatherForecast}
            disabled={forecastState.status === "loading"}
          >
            {forecastState.status === "loading"
              ? t.energy.forecastLoading
              : forecastState.status === "ok"
                ? t.energy.forecastRefresh
                : t.energy.forecastApply}
          </Button>
          {forecastState.status === "ok" && (
            <p className="mt-2 text-xs text-primary">
              {t.energy.forecastOk(
                forecastState.avgSunHours,
                forecastState.days.length,
                forecastState.sourceSpotName === null
                  ? t.energy.sourceLocation
                  : t.energy.sourceSpot(forecastState.sourceSpotName)
              )}
            </p>
          )}
          {forecastState.status === "error" && (
            <p className="mt-2 text-xs text-destructive">
              {t.energy.forecastError}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            {t.energy.guidelinePrefix}
            <a
              href="/sonne"
              className="font-medium text-primary hover:underline"
            >
              {t.energy.sunCompassLink}
            </a>
            {t.energy.guidelineSuffix}
          </p>
        </CardContent>
      </Card>

      {/* Ertragsprognose: Einstrahlung → Ertrag → Vergleich mit dem Verbrauch */}
      {yieldDays.length > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="mb-1.5 flex items-center gap-2">
              <Sun className="h-4 w-4 text-chart-1" aria-hidden="true" />
              <h2 className="font-serif text-base font-semibold">
                {t.energy.forecastTitle}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {t.energy.forecastSubtitle(yieldDays.length)}{" "}
              {yieldDays[0].tilted
                ? t.energy.forecastTilted
                : t.energy.forecastHorizontal}
            </p>

            {panelWatts <= 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                {t.energy.noPanelHint}
              </p>
            ) : (
              <>
                <ul className="mt-3 space-y-1.5">
                  {balance.days.map((day, index) => (
                    <li
                      key={day.date}
                      className={cn(
                        "grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 rounded-lg border px-3 py-2 text-xs",
                        day.empty
                          ? "border-destructive/50 bg-destructive/5"
                          : "border-border"
                      )}
                    >
                      <span className="font-semibold">
                        {formatForecastDay(day.date)}
                      </span>
                      <span className="text-muted-foreground">
                        {t.energy.dayYield(
                          formatWh(day.yieldWh, lang),
                          yieldDays[index].irradiationKwhPerM2
                        )}
                      </span>
                      <span
                        className={cn(
                          "font-mono font-semibold",
                          day.empty
                            ? "text-destructive"
                            : day.netWh >= 0
                              ? "text-primary"
                              : "text-foreground"
                        )}
                      >
                        {day.batteryPercent !== null
                          ? t.energy.dayBattery(day.batteryPercent)
                          : `${day.netWh >= 0 ? "+" : "−"}${formatWh(
                              Math.abs(day.netWh),
                              lang
                            )}`}
                      </span>
                    </li>
                  ))}
                </ul>

                <p className="mt-3 text-xs text-muted-foreground">
                  {t.energy.balanceTotals(
                    formatWh(balance.totalYieldWh, lang),
                    formatWh(balance.totalConsumptionWh, lang),
                    balance.days.length
                  )}
                  {balance.wastedWh > 0 && (
                    <>
                      {" "}
                      {t.energy.wastedHint(formatWh(balance.wastedWh, lang))}
                    </>
                  )}
                </p>

                <p
                  className={cn(
                    "mt-2 text-xs font-medium",
                    result.usableWh === null
                      ? "text-muted-foreground"
                      : balance.covered
                        ? "text-primary"
                        : "text-destructive"
                  )}
                >
                  {result.usableWh === null
                    ? t.energy.balanceNoStorage
                    : balance.covered
                      ? t.energy.balanceCovered(balance.days.length)
                      : t.energy.balanceEmpty(
                          formatForecastDay(balance.firstEmptyDate ?? ""),
                          balance.coveredDays
                        )}
                </p>

                <p className="mt-3 text-xs text-muted-foreground">
                  {t.energy.efficiencyIntro(
                    Math.round(DEFAULT_SYSTEM_EFFICIENCY * 100)
                  )}{" "}
                  {SOLAR_LOSS_STEPS.map(
                    step =>
                      `${t.energy.lossNames[step.key]} −${step.lossPercent} %`
                  ).join(" · ")}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Panel-Ausrichtung heute */}
      {alignment && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="mb-3 flex items-center gap-2">
              <Compass className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="font-serif text-base font-semibold">
                {t.energy.alignmentTitle}
              </h2>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-accent/50 py-2.5">
                <p className="font-serif text-xl font-bold text-primary">
                  {alignment.azimuth}°{" "}
                  {compassDirection(alignment.azimuth, lang)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.energy.alignmentDirection}
                </p>
              </div>
              <div className="rounded-lg bg-accent/50 py-2.5">
                <p className="font-serif text-xl font-bold text-primary">
                  {alignment.tilt}°
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.energy.alignmentTilt}
                </p>
              </div>
              <div className="rounded-lg bg-accent/50 py-2.5">
                <p className="font-serif text-xl font-bold text-primary">
                  +{alignment.gainVsFlatPercent} %
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.energy.alignmentVsFlat}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {alignment.firstSun && alignment.lastSun
                ? t.energy.directSun(
                    alignment.firstSun.toLocaleTimeString(
                      LOCALE_TAGS[lang],
                      timeFormat
                    ),
                    alignment.lastSun.toLocaleTimeString(
                      LOCALE_TAGS[lang],
                      timeFormat
                    ),
                    alignment.usableSunHours
                  )
                : t.energy.directSunNoTimes(alignment.usableSunHours)}
              {alignment.shadedHours > 0 && (
                <>
                  {" "}
                  {t.energy.shadedPrefix(alignment.shadedHours)}
                  <a
                    href="/sonne"
                    className="font-medium text-primary hover:underline"
                  >
                    {t.energy.shadedLink}
                  </a>
                  {t.energy.shadedSuffix}
                </>
              )}
              {alignment.shadedHours === 0 && obstacles.length === 0 && (
                <>
                  {" "}
                  {t.energy.obstacleTipPrefix}
                  <a
                    href="/sonne"
                    className="font-medium text-primary hover:underline"
                  >
                    {t.energy.shadedLink}
                  </a>
                  {t.energy.obstacleTipSuffix}
                </>
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Verbraucher */}
      <h2 className="mb-3 font-serif text-lg font-semibold">
        {t.energy.consumersTitle}
      </h2>

      <form
        className="mb-3 grid grid-cols-[1fr_5rem_5rem_auto] gap-2"
        onSubmit={e => {
          e.preventDefault();
          const name = form.name.trim();
          const watts = Number(form.watts);
          const hours = Number(form.hoursPerDay);
          if (!name || !(watts > 0) || !(hours > 0)) {
            toast.error(t.energy.formError);
            return;
          }
          addMutation.mutate({ name, watts, hoursPerDay: Math.min(24, hours) });
        }}
      >
        <Input
          placeholder={t.energy.consumerPlaceholder}
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          aria-label={t.energy.consumerNameAria}
        />
        <Input
          placeholder={t.energy.wattsPlaceholder}
          type="number"
          min="0"
          value={form.watts}
          onChange={e => setForm(f => ({ ...f, watts: e.target.value }))}
          aria-label={t.energy.wattsAria}
        />
        <Input
          placeholder={t.energy.hoursPlaceholder}
          type="number"
          min="0"
          max="24"
          step="0.5"
          value={form.hoursPerDay}
          onChange={e => setForm(f => ({ ...f, hoursPerDay: e.target.value }))}
          aria-label={t.energy.hoursAria}
        />
        <Button
          type="submit"
          disabled={addMutation.isPending}
          aria-label={t.energy.addAria}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>

      {/* Vorlagen: Anhaltspunkte aus der Praxis, keine Herstellerangaben */}
      <div className="mb-1.5 flex flex-wrap gap-1.5">
        {CONSUMER_TEMPLATES.filter(
          p => !consumers.some(c => c.name === t.energy.presets[p.key])
        ).map(p => (
          <button
            key={p.key}
            type="button"
            onClick={() =>
              addMutation.mutate({
                name: t.energy.presets[p.key],
                watts: p.watts,
                hoursPerDay: p.hoursPerDay,
              })
            }
            className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            aria-label={t.energy.presetAddAria(t.energy.presets[p.key])}
          >
            + {t.energy.presets[p.key]} ({p.watts} W)
          </button>
        ))}
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        {t.energy.templatesHint}
      </p>

      {query.isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2
            className="h-6 w-6 animate-spin text-muted-foreground"
            aria-label={t.common.loading}
          />
        </div>
      ) : consumers.length > 0 ? (
        <ul className="space-y-2">
          {consumers.map(c => {
            const dailyWh = c.watts * c.hoursPerDay;
            const share = c.enabled ? sharePercent(c.name) : null;
            return (
              <li
                key={c.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3",
                  !c.enabled && "opacity-55"
                )}
              >
                <Zap
                  className="h-4 w-4 shrink-0 text-chart-1"
                  aria-hidden="true"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.energy.consumerLine(
                      c.watts,
                      c.hoursPerDay,
                      Math.round(dailyWh)
                    )}
                    {share !== null && share > 0 && (
                      <> · {t.energy.consumerShare(share)}</>
                    )}
                  </p>
                </div>
                <Switch
                  checked={c.enabled}
                  onCheckedChange={enabled =>
                    updateMutation.mutate({ id: c.id, enabled })
                  }
                  aria-label={
                    c.enabled
                      ? t.energy.disableAria(c.name)
                      : t.energy.enableAria(c.name)
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground/60 hover:text-destructive"
                  onClick={() => removeMutation.mutate({ id: c.id })}
                  aria-label={t.energy.deleteAria(c.name)}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t.energy.empty}
        </p>
      )}

      {/* Feuerholz-Bedarf (#287): auch Energie, nur ohne Kabel – und die
          Frage stellt sich beim Packen, nicht am Feuer */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <FirewoodCalculator />
        </CardContent>
      </Card>
    </div>
  );
}
