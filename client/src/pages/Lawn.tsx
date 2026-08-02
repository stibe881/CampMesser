import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sprout,
  Tent,
  Thermometer,
  Sun,
  Droplets,
  Clock,
  RefreshCcw,
  CloudSun,
  RefreshCw,
} from "lucide-react";
import { cn as cnUtil } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import {
  deriveMoisture,
  estimateLawnTolerance,
  formatHours,
  lawnVerdict,
  type FloorType,
  type GrassCondition,
  type Moisture,
  type SunExposure,
} from "@shared/lawn";

/** Aus der Prognose übernommene Werte – der Hinweistext wird sprachabhängig gerendert. */
interface WeatherNote {
  tempMax: number;
  /** Bodenfeuchte in %, null = keine Daten (Fallback über Niederschlag) */
  soilPercent: string | null;
  rain48: string;
  derived: Moisture;
}

/** Rasenschoner-Rechner: Wie lange darf das Zelt auf dem Rasen stehen? */
export default function LawnPage() {
  const { lang, t } = useI18n();
  const [floor, setFloor] = useState<FloorType>("standard");
  const [grass, setGrass] = useState<GrassCondition>("normal");
  const [temperature, setTemperature] = useState(20);
  const [sun, setSun] = useState<SunExposure>("partial");
  const [moisture, setMoisture] = useState<Moisture>("normal");
  const [plannedDays, setPlannedDays] = useState(3);
  const [weatherStatus, setWeatherStatus] = useState<
    "idle" | "loading" | "ok" | "error"
  >("idle");
  const [weatherNote, setWeatherNote] = useState<WeatherNote | null>(null);
  const autoTried = useRef(false);

  const floorOptions: { value: FloorType; label: string; hint: string }[] = [
    { value: "mesh", label: t.lawn.floorMesh, hint: t.lawn.floorMeshHint },
    {
      value: "standard",
      label: t.lawn.floorStandard,
      hint: t.lawn.floorStandardHint,
    },
    {
      value: "footprint",
      label: t.lawn.floorFootprint,
      hint: t.lawn.floorFootprintHint,
    },
  ];
  const grassOptions: { value: GrassCondition; label: string; hint: string }[] =
    [
      {
        value: "robust",
        label: t.lawn.grassRobust,
        hint: t.lawn.grassRobustHint,
      },
      {
        value: "normal",
        label: t.lawn.grassNormal,
        hint: t.lawn.grassNormalHint,
      },
      {
        value: "delicate",
        label: t.lawn.grassDelicate,
        hint: t.lawn.grassDelicateHint,
      },
    ];
  const sunOptions: { value: SunExposure; label: string }[] = [
    { value: "shade", label: t.lawn.sunShade },
    { value: "partial", label: t.lawn.sunPartial },
    { value: "full", label: t.lawn.sunFull },
  ];
  const moistureOptions: { value: Moisture; label: string }[] = [
    { value: "dry", label: t.lawn.moistureOptDry },
    { value: "normal", label: t.lawn.moistureOptNormal },
    { value: "wet", label: t.lawn.moistureOptWet },
  ];

  /** Temperatur + Bodenfeuchte aus der Wetter-Prognose übernehmen. */
  const loadWeather = () => {
    if (!navigator.geolocation) {
      setWeatherStatus("error");
      return;
    }
    setWeatherStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const params = new URLSearchParams({
            latitude: String(pos.coords.latitude),
            longitude: String(pos.coords.longitude),
            daily: "temperature_2m_max,precipitation_sum",
            hourly: "soil_moisture_0_to_7cm",
            past_days: "1",
            forecast_days: "1",
            timezone: "auto",
          });
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?${params.toString()}`
          );
          if (!res.ok) throw new Error("Wetter-API-Fehler");
          const json = await res.json();
          const tMax: number[] = json.daily?.temperature_2m_max ?? [];
          const rain: number[] = json.daily?.precipitation_sum ?? [];
          // Index 0 = gestern (past_days: 1), Index 1 = heute
          const todayMax = tMax[1] ?? tMax[0];
          const rain24h = (rain[0] ?? 0) + (rain[1] ?? 0);
          if (typeof todayMax !== "number")
            throw new Error("Keine Temperaturdaten");
          setTemperature(Math.round(todayMax));
          // Bodenfeuchte: echte soil_moisture-Prognose (aktuelle Stunde),
          // Fallback: Niederschlag der letzten 48 h
          const soilSeries: (number | null)[] =
            json.hourly?.soil_moisture_0_to_7cm ?? [];
          const times: string[] = json.hourly?.time ?? [];
          const nowIso = new Date().toISOString().slice(0, 13);
          let soilNow: number | null = null;
          const idx = times.findIndex(time => time.startsWith(nowIso));
          if (idx >= 0 && typeof soilSeries[idx] === "number")
            soilNow = soilSeries[idx];
          else {
            const lastValid = soilSeries.filter(
              (v): v is number => typeof v === "number"
            );
            if (lastValid.length > 0) soilNow = lastValid[lastValid.length - 1];
          }
          const derived = deriveMoisture(soilNow, rain24h);
          setMoisture(derived);
          setWeatherNote({
            tempMax: Math.round(todayMax),
            soilPercent: soilNow !== null ? (soilNow * 100).toFixed(0) : null,
            rain48: rain24h.toFixed(1),
            derived,
          });
          setWeatherStatus("ok");
        } catch {
          setWeatherStatus("error");
        }
      },
      () => setWeatherStatus("error"),
      { timeout: 10000 }
    );
  };

  // Beim Öffnen automatisch versuchen
  useEffect(() => {
    if (autoTried.current) return;
    autoTried.current = true;
    loadWeather();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const result = useMemo(
    () => estimateLawnTolerance({ floor, grass, temperature, sun, moisture }),
    [floor, grass, temperature, sun, moisture]
  );
  const verdict = lawnVerdict(plannedDays * 24, result);

  const verdictStyle = {
    safe: "border-primary/40 bg-primary/10 text-primary",
    caution: "border-amber-glow/50 bg-amber-glow/10 text-amber-glow",
    damage: "border-destructive/40 bg-destructive/10 text-destructive",
  }[verdict];
  const verdictText = {
    safe: t.lawn.verdictSafe,
    caution: t.lawn.verdictCaution,
    damage: t.lawn.verdictDamage,
  }[verdict];

  const moistureWord = (m: Moisture) =>
    m === "wet"
      ? t.lawn.moistureWet
      : m === "normal"
        ? t.lawn.moistureNormal
        : t.lawn.moistureDry;
  const weatherNoteText = weatherNote
    ? weatherNote.soilPercent !== null
      ? t.lawn.weatherNoteSoil(
          weatherNote.tempMax,
          weatherNote.soilPercent,
          moistureWord(weatherNote.derived)
        )
      : t.lawn.weatherNoteRain(
          weatherNote.tempMax,
          weatherNote.rain48,
          moistureWord(weatherNote.derived)
        )
    : null;

  const OptionRow = <T extends string>({
    options,
    value,
    onChange,
    label,
  }: {
    options: { value: T; label: string; hint?: string }[];
    value: T;
    onChange: (v: T) => void;
    label: string;
  }) => (
    <div>
      <Label className="mb-1.5 block text-xs">{label}</Label>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {options.map(o => (
          <Button
            key={o.value}
            type="button"
            size="sm"
            variant={value === o.value ? "default" : "outline"}
            className="rounded-full"
            onClick={() => onChange(o.value)}
            title={o.hint}
          >
            {o.label}
          </Button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader title={t.lawn.title} subtitle={t.lawn.subtitle} />

      <Card className="mb-5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Tent className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.lawn.setupTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={loadWeather}
              disabled={weatherStatus === "loading"}
            >
              <RefreshCw
                className={cnUtil(
                  "mr-1.5 h-3.5 w-3.5",
                  weatherStatus === "loading" && "animate-spin"
                )}
                aria-hidden="true"
              />
              {weatherStatus === "loading"
                ? t.lawn.loadingWeather
                : t.lawn.loadWeather}
            </Button>
            {weatherStatus === "ok" && weatherNoteText && (
              <p className="mt-1.5 flex items-start gap-1.5 text-xs text-primary">
                <CloudSun
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                />
                {t.lawn.fromForecast(weatherNoteText)}
              </p>
            )}
            {weatherStatus === "error" && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t.lawn.weatherError}
              </p>
            )}
          </div>
          <OptionRow
            label={t.lawn.floorLabel}
            options={floorOptions}
            value={floor}
            onChange={setFloor}
          />
          <OptionRow
            label={t.lawn.grassLabel}
            options={grassOptions}
            value={grass}
            onChange={setGrass}
          />
          <OptionRow
            label={t.lawn.sunLabel}
            options={sunOptions}
            value={sun}
            onChange={setSun}
          />
          <OptionRow
            label={t.lawn.moistureLabel}
            options={moistureOptions}
            value={moisture}
            onChange={setMoisture}
          />
          <div>
            <Label className="mb-1.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <Thermometer className="h-3.5 w-3.5" aria-hidden="true" />{" "}
                {t.lawn.tempLabel}
              </span>
              <span className="font-semibold">{temperature} °C</span>
            </Label>
            <Slider
              value={[temperature]}
              min={0}
              max={38}
              step={1}
              onValueChange={v => setTemperature(v[0] ?? 20)}
              aria-label={t.lawn.tempAria}
            />
          </div>
          <div>
            <Label className="mb-1.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />{" "}
                {t.lawn.plannedLabel}
              </span>
              <span className="font-semibold">{t.lawn.days(plannedDays)}</span>
            </Label>
            <Slider
              value={[plannedDays]}
              min={1}
              max={14}
              step={1}
              onValueChange={v => setPlannedDays(v[0] ?? 3)}
              aria-label={t.lawn.plannedAria}
            />
          </div>
        </CardContent>
      </Card>

      <div className={cn("mb-5 rounded-xl border p-4", verdictStyle)}>
        <p className="flex items-start gap-2 text-sm font-medium">
          <Sprout className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {verdictText}
        </p>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5 text-center">
            <Sun
              className="mx-auto mb-1.5 h-5 w-5 text-amber-glow"
              aria-hidden="true"
            />
            <p className="text-lg font-bold">
              {formatHours(result.yellowingHours, lang)}
            </p>
            <p className="text-xs text-muted-foreground">
              {t.lawn.statYellowing}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <Droplets
              className="mx-auto mb-1.5 h-5 w-5 text-destructive"
              aria-hidden="true"
            />
            <p className="text-lg font-bold">
              {formatHours(result.damageHours, lang)}
            </p>
            <p className="text-xs text-muted-foreground">{t.lawn.statDamage}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <RefreshCcw
              className="mx-auto mb-1.5 h-5 w-5 text-primary"
              aria-hidden="true"
            />
            <p className="text-lg font-bold">
              {formatHours(result.moveAfterHours, lang)}
            </p>
            <p className="text-xs text-muted-foreground">{t.lawn.statMove}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sprout className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.lawn.tipsTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">{t.lawn.tip1Title}</strong>{" "}
              {t.lawn.tip1Text}
            </li>
            <li>
              <strong className="text-foreground">{t.lawn.tip2Title}</strong>{" "}
              {t.lawn.tip2Text}
            </li>
            <li>
              <strong className="text-foreground">{t.lawn.tip3Title}</strong>{" "}
              {t.lawn.tip3Text}
            </li>
            <li>
              <strong className="text-foreground">{t.lawn.tip4Title}</strong>{" "}
              {t.lawn.tip4Text}
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
