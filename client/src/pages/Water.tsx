import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dog,
  Droplets,
  Minus,
  Plus,
  ShowerHead,
  Thermometer,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { calcWaterNeeds, type WaterInput } from "@shared/calculators";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

function Counter({
  label,
  value,
  onChange,
  min = 0,
  max = 12,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const t = useT();
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={t.water.decreaseAria(label)}
        >
          <Minus className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
        <span
          className="w-6 text-center font-mono text-lg font-semibold"
          aria-live="polite"
        >
          {value}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={t.water.increaseAria(label)}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

/** Frisch-/Grauwasser-Tracker (#640): Stand pro Gerät gemerkt. */
const WATER_TANKS_KEY = "campmesser.waterTanks";

interface WaterTanks {
  freshLiters: number;
  greyLiters: number;
  freshPercent: number;
  greyPercent: number;
}

function loadWaterTanks(): WaterTanks {
  const fallback: WaterTanks = {
    freshLiters: 100,
    greyLiters: 100,
    freshPercent: 100,
    greyPercent: 0,
  };
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(WATER_TANKS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<WaterTanks>;
    const clamp = (value: unknown, max: number, def: number) =>
      typeof value === "number" && Number.isFinite(value)
        ? Math.min(max, Math.max(0, value))
        : def;
    return {
      freshLiters: clamp(parsed.freshLiters, 1000, fallback.freshLiters),
      greyLiters: clamp(parsed.greyLiters, 1000, fallback.greyLiters),
      freshPercent: clamp(parsed.freshPercent, 100, fallback.freshPercent),
      greyPercent: clamp(parsed.greyPercent, 100, fallback.greyPercent),
    };
  } catch {
    return fallback;
  }
}

export default function WaterPage() {
  const t = useT();
  const [adults, setAdults] = useState(2);
  // Frisch-/Grauwasser-Tracker (#640)
  const [tanks, setTanks] = useState<WaterTanks>(() => loadWaterTanks());
  const updateTanks = (patch: Partial<WaterTanks>) => {
    setTanks(prev => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(WATER_TANKS_KEY, JSON.stringify(next));
      } catch {
        /* Sitzung reicht */
      }
      return next;
    });
  };
  const [children, setChildren] = useState(2);
  const [dogs, setDogs] = useState(0);
  const [days, setDays] = useState(3);
  const [maxTempC, setMaxTempC] = useState(25);
  // Auto: Prognose-Höchstwert wird übernommen; manuelles Ziehen des Sliders schaltet ab
  const [tempAuto, setTempAuto] = useState(true);
  const tempAutoRef = useRef(true);
  tempAutoRef.current = tempAuto;
  const [forecast, setForecast] = useState<{
    maxTemp: number;
    days: number;
  } | null>(null);
  const [activity, setActivity] = useState<WaterInput["activity"]>("normal");

  // Höchsttemperatur der nächsten 3 Tage vom Standort übernehmen (stille
  // Fehlerbehandlung: ohne Standortfreigabe bleibt der manuelle Wert bestehen)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const params = new URLSearchParams({
            latitude: pos.coords.latitude.toFixed(4),
            longitude: pos.coords.longitude.toFixed(4),
            timezone: "auto",
            forecast_days: "3",
            daily: "temperature_2m_max",
          });
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?${params.toString()}`
          );
          if (!res.ok) return;
          const json = await res.json();
          const temps: number[] = json.daily?.temperature_2m_max ?? [];
          if (temps.length === 0) return;
          const max = Math.min(40, Math.max(5, Math.round(Math.max(...temps))));
          setForecast({ maxTemp: max, days: temps.length });
          if (tempAutoRef.current) setMaxTempC(max);
        } catch {
          // Wetterdienst nicht erreichbar: manueller Wert bleibt
        }
      },
      () => {},
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
    );
  }, []);
  const [includeCookingHygiene, setIncludeCookingHygiene] = useState(true);
  const [includeComfortHygiene, setIncludeComfortHygiene] = useState(false);

  const result = useMemo(
    () =>
      calcWaterNeeds({
        adults,
        children,
        dogs,
        days,
        maxTempC,
        activity,
        includeCookingHygiene,
        includeComfortHygiene,
      }),
    [
      adults,
      children,
      dogs,
      days,
      maxTempC,
      activity,
      includeCookingHygiene,
      includeComfortHygiene,
    ]
  );

  const canisters = Math.ceil(result.recommendedLiters / 10);

  return (
    <div className="container max-w-2xl py-6">
      <PageHeader title={t.water.title} subtitle={t.water.subtitle} />

      {/* Ergebnis */}
      <Card className="mb-6 border-primary/40 bg-accent/40">
        <CardContent className="pt-6 text-center">
          <Droplets
            className="mx-auto mb-2 h-8 w-8 text-chart-5"
            aria-hidden="true"
          />
          <p className="font-serif text-4xl font-bold text-primary">
            {t.water.liters(result.recommendedLiters)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.water.recommendedNote}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {t.water.canisterNote(canisters)}
          </p>
        </CardContent>
      </Card>

      {/* Eingaben */}
      <div className="mb-4 space-y-2.5">
        <Counter
          label={t.water.adults}
          value={adults}
          onChange={setAdults}
          min={0}
        />
        <Counter
          label={t.water.children}
          value={children}
          onChange={setChildren}
          min={0}
        />
        <Counter
          label={t.water.dogs}
          value={dogs}
          onChange={setDogs}
          min={0}
          max={6}
        />
        <Counter
          label={t.water.daysWithoutWater}
          value={days}
          onChange={setDays}
          min={1}
          max={21}
        />
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="mb-2 flex items-center justify-between">
            <Label htmlFor="temp-slider" className="flex items-center gap-1.5">
              <Thermometer
                className="h-4 w-4 text-destructive"
                aria-hidden="true"
              />
              {t.water.tempLabel}
            </Label>
            <span className="rounded-md bg-muted px-2.5 py-1 font-mono text-sm font-semibold">
              {maxTempC} °C
            </span>
          </div>
          <Slider
            id="temp-slider"
            min={5}
            max={40}
            step={1}
            value={[maxTempC]}
            onValueChange={v => {
              setMaxTempC(v[0]);
              // Manuelles Ziehen schaltet die automatische Übernahme ab
              if (tempAuto) setTempAuto(false);
            }}
            aria-label={t.water.tempSliderAria}
          />
          {forecast && tempAuto && (
            <p className="mt-2 text-xs text-primary">
              {t.water.tempAuto(forecast.days, forecast.maxTemp)}
            </p>
          )}
          {forecast && !tempAuto && (
            <button
              type="button"
              className="mt-2 text-xs font-medium text-primary hover:underline"
              onClick={() => {
                setTempAuto(true);
                setMaxTempC(forecast.maxTemp);
              }}
            >
              {t.water.tempReapply(forecast.maxTemp)}
            </button>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            {t.water.tempHint}
          </p>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="pt-6">
          <p className="mb-2 text-sm font-medium">{t.water.activityTitle}</p>
          <div
            className="grid grid-cols-3 gap-2"
            role="group"
            aria-label={t.water.activityGroupAria}
          >
            {(
              [
                {
                  id: "ruhig",
                  label: t.water.activityCalm,
                  hint: t.water.activityCalmHint,
                },
                {
                  id: "normal",
                  label: t.water.activityNormal,
                  hint: t.water.activityNormalHint,
                },
                {
                  id: "aktiv",
                  label: t.water.activityActive,
                  hint: t.water.activityActiveHint,
                },
              ] as const
            ).map(a => (
              <button
                key={a.id}
                type="button"
                onClick={() => setActivity(a.id)}
                className={cn(
                  "rounded-lg border p-3 text-center transition-all",
                  activity === a.id
                    ? "border-primary bg-accent"
                    : "border-border bg-card hover:border-primary/40"
                )}
                aria-pressed={activity === a.id}
              >
                <span className="block text-sm font-semibold">{a.label}</span>
                <span className="block text-xs text-muted-foreground">
                  {a.hint}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="flex items-center justify-between pt-6">
          <div>
            <p className="text-sm font-medium">{t.water.cookingTitle}</p>
            <p className="text-xs text-muted-foreground">
              {t.water.cookingHint}
            </p>
          </div>
          <Switch
            checked={includeCookingHygiene}
            onCheckedChange={setIncludeCookingHygiene}
            aria-label={t.water.cookingAria}
          />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="flex items-center justify-between pt-6">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <ShowerHead className="h-4 w-4 text-chart-5" aria-hidden="true" />
              {t.water.comfortTitle}
            </p>
            <p className="text-xs text-muted-foreground">
              {t.water.comfortHint}
            </p>
          </div>
          <Switch
            checked={includeComfortHygiene}
            onCheckedChange={setIncludeComfortHygiene}
            aria-label={t.water.comfortAria}
          />
        </CardContent>
      </Card>

      {/* Aufschlüsselung */}
      <h2 className="mb-3 font-serif text-lg font-semibold">
        {t.water.breakdownTitle}
      </h2>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-border/60">
              <td className="px-4 py-2.5 text-muted-foreground">
                {t.water.rowAdults(
                  result.drinkingLitersPerAdult.toFixed(1),
                  adults,
                  days
                )}
              </td>
              <td className="px-4 py-2.5 text-right font-mono">
                {(adults * result.drinkingLitersPerAdult * days).toFixed(1)} l
              </td>
            </tr>
            <tr className="border-b border-border/60">
              <td className="px-4 py-2.5 text-muted-foreground">
                {t.water.rowChildren(
                  result.drinkingLitersPerChild.toFixed(1),
                  children,
                  days
                )}
              </td>
              <td className="px-4 py-2.5 text-right font-mono">
                {(children * result.drinkingLitersPerChild * days).toFixed(1)} l
              </td>
            </tr>
            {dogs > 0 && (
              <tr className="border-b border-border/60">
                <td className="px-4 py-2.5 text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Dog className="h-3.5 w-3.5" aria-hidden="true" />
                    {t.water.rowDogs(
                      result.drinkingLitersPerDog.toFixed(1),
                      dogs,
                      days
                    )}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right font-mono">
                  {result.dogLiters.toFixed(1)} l
                </td>
              </tr>
            )}
            <tr className="border-b border-border/60">
              <td className="px-4 py-2.5 text-muted-foreground">
                {t.water.rowCooking}
              </td>
              <td className="px-4 py-2.5 text-right font-mono">
                {result.cookingHygieneLiters.toFixed(1)} l
              </td>
            </tr>
            {includeComfortHygiene && (
              <tr className="border-b border-border/60">
                <td className="px-4 py-2.5 text-muted-foreground">
                  {t.water.rowComfort}
                </td>
                <td className="px-4 py-2.5 text-right font-mono">
                  {result.comfortHygieneLiters.toFixed(1)} l
                </td>
              </tr>
            )}
            <tr className="border-b border-border/60">
              <td className="px-4 py-2.5 text-muted-foreground">
                {t.water.rowReserve}
              </td>
              <td className="px-4 py-2.5 text-right font-mono">
                {(result.recommendedLiters - result.totalLiters).toFixed(1)} l
              </td>
            </tr>
            <tr className="bg-muted/40 font-semibold">
              <td className="px-4 py-2.5">{t.water.rowTotal}</td>
              <td className="px-4 py-2.5 text-right font-mono">
                {result.recommendedLiters} l
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        {t.water.footnote}
      </p>

      {/* Frisch-/Grauwasser-Tracker (#640): Tankgrössen und Füllstände –
          der Tagesbedarf von oben sagt, wie lange es noch reicht bzw.
          wann der Grauwassertank voll ist. */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <h2 className="mb-1 font-serif text-lg font-semibold">
            {t.water.tanksTitle}
          </h2>
          <p className="mb-3 text-xs text-muted-foreground">
            {t.water.tanksHint}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                {
                  key: "fresh" as const,
                  label: t.water.tanksFresh,
                  liters: tanks.freshLiters,
                  percent: tanks.freshPercent,
                  onLiters: (value: number) =>
                    updateTanks({ freshLiters: value }),
                  onPercent: (value: number) =>
                    updateTanks({ freshPercent: value }),
                },
                {
                  key: "grey" as const,
                  label: t.water.tanksGrey,
                  liters: tanks.greyLiters,
                  percent: tanks.greyPercent,
                  onLiters: (value: number) =>
                    updateTanks({ greyLiters: value }),
                  onPercent: (value: number) =>
                    updateTanks({ greyPercent: value }),
                },
              ] as const
            ).map(tank => (
              <div
                key={tank.key}
                className="rounded-lg border border-border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{tank.label}</p>
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    <input
                      type="number"
                      min={0}
                      max={1000}
                      value={tank.liters}
                      onChange={e =>
                        tank.onLiters(
                          Math.min(1000, Math.max(0, Number(e.target.value)))
                        )
                      }
                      className="h-8 w-20 rounded-md border border-input bg-background px-2 text-right text-sm"
                      aria-label={t.water.tanksSizeAria(tank.label)}
                    />
                    l
                  </label>
                </div>
                <div className="mt-3">
                  <Slider
                    value={[tank.percent]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={([value]) => tank.onPercent(value)}
                    aria-label={t.water.tanksLevelAria(tank.label)}
                  />
                  <p className="mt-1.5 text-sm tabular-nums text-muted-foreground">
                    {t.water.tanksLevel(
                      tank.percent,
                      Math.round((tank.liters * tank.percent) / 100)
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {(() => {
            const dailyLiters = days > 0 ? result.totalLiters / days : 0;
            if (dailyLiters <= 0) return null;
            const freshLeft = (tanks.freshLiters * tanks.freshPercent) / 100;
            const greyFree =
              (tanks.greyLiters * (100 - tanks.greyPercent)) / 100;
            const freshDays = freshLeft / dailyLiters;
            const greyDays = greyFree / dailyLiters;
            return (
              <p className="mt-3 text-sm">
                {t.water.tanksForecast(
                  dailyLiters.toFixed(1),
                  freshDays.toFixed(1),
                  greyDays.toFixed(1)
                )}
              </p>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
