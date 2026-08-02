import { useEffect, useMemo, useRef, useState } from "react";
import {
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
import { calcEnergyBudget } from "@shared/calculators";
import { LOCALE_TAGS } from "@shared/i18n";
import { compassDirection, computeSolarAlignment } from "@shared/solar";
import { loadObstacleProfiles } from "@/lib/obstacleStore";
import { getProfileObstacles } from "@shared/obstacleProfiles";
import { cn } from "@/lib/utils";

const presetConsumers = [
  { key: "coolbox", watts: 45, hoursPerDay: 8 },
  { key: "laptop", watts: 60, hoursPerDay: 2 },
  { key: "drone", watts: 90, hoursPerDay: 1 },
  { key: "phone", watts: 15, hoursPerDay: 2 },
  { key: "led", watts: 8, hoursPerDay: 4 },
  { key: "camera", watts: 20, hoursPerDay: 1.5 },
] as const;

export default function EnergyPage() {
  const { isAuthenticated, loading } = useAuth();
  const { lang, t } = useI18n();
  const utils = trpc.useUtils();
  const query = trpc.energy.consumers.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const [batteryWh, setBatteryWh] = useState("1024");
  const [solarWatts, setSolarWatts] = useState("400");
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
        days: number;
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

  /** Sonnenschein-Prognose für Koordinaten laden und als effektive Sonnenstunden übernehmen. */
  const fetchSunshine = async (
    lat: number,
    lng: number,
    sourceSpotName: string | null,
    spotId?: number
  ) => {
    setPanelCoords({ lat, lng, spotId });
    const params = new URLSearchParams({
      latitude: lat.toFixed(4),
      longitude: lng.toFixed(4),
      timezone: "auto",
      forecast_days: "3",
      daily: "sunshine_duration",
    });
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params.toString()}`
    );
    if (!res.ok) throw new Error("Wetterdienst nicht erreichbar");
    const json = await res.json();
    const durations: number[] = json.daily?.sunshine_duration ?? [];
    if (durations.length === 0) throw new Error("Keine Daten");
    const avgHours =
      durations.reduce((s, d) => s + (d ?? 0), 0) / durations.length / 3600;
    const rounded = Math.min(10, Math.round(avgHours * 2) / 2);
    if (sunHoursAutoRef.current) setSunHours(rounded);
    setForecastState({
      status: "ok",
      avgSunHours: rounded,
      days: durations.length,
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

  const result = useMemo(
    () =>
      calcEnergyBudget({
        batteryWh: Number(batteryWh) || 0,
        solarPanelWatts: Number(solarWatts) || 0,
        sunHoursPerDay: sunHours,
        consumers: consumers.map(c => ({
          name: c.name,
          watts: c.watts,
          hoursPerDay: c.hoursPerDay,
          enabled: c.enabled,
        })),
      }),
    [batteryWh, solarWatts, sunHours, consumers]
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

  const autonomyLabel = result.selfSufficient
    ? t.energy.autonomyUnlimited
    : result.autonomyDays === Infinity
      ? "–"
      : result.autonomyDays >= 14
        ? t.energy.autonomyMoreThan14
        : t.energy.autonomyDays(result.autonomyDays.toFixed(1));

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
              <p className="font-serif text-2xl font-bold text-primary">
                {autonomyLabel}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.energy.autonomyLabel}
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
                {Math.round(result.dailySolarYieldWh)} Wh
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
        </CardContent>
      </Card>

      {/* Einstellungen */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="mb-1.5 flex items-center gap-2">
              <BatteryCharging
                className="h-4 w-4 text-primary"
                aria-hidden="true"
              />
              <Label htmlFor="battery">{t.energy.batteryLabel}</Label>
            </div>
            <Input
              id="battery"
              type="number"
              min="0"
              value={batteryWh}
              onChange={e => setBatteryWh(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {t.energy.batteryHint}
            </p>
          </CardContent>
        </Card>
        <Card>
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
              onChange={e => setSolarWatts(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {t.energy.solarHint}
            </p>
          </CardContent>
        </Card>
      </div>

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
                forecastState.days,
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

      {/* Vorschläge */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {presetConsumers
          .filter(p => !consumers.some(c => c.name === t.energy.presets[p.key]))
          .map(p => (
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
    </div>
  );
}
