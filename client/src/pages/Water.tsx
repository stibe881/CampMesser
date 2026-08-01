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
          aria-label={`${label} verringern`}
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
          aria-label={`${label} erhöhen`}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

export default function WaterPage() {
  const [adults, setAdults] = useState(2);
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
      <PageHeader
        title="Trinkwasser-Rechner"
        subtitle="Wie viel Wasser musst du mitnehmen, wenn es am Zeltplatz keinen Frischwasseranschluss gibt?"
      />

      {/* Ergebnis */}
      <Card className="mb-6 border-primary/40 bg-accent/40">
        <CardContent className="pt-6 text-center">
          <Droplets
            className="mx-auto mb-2 h-8 w-8 text-chart-5"
            aria-hidden="true"
          />
          <p className="font-serif text-4xl font-bold text-primary">
            {result.recommendedLiters} Liter
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            empfohlene Gesamtmenge inkl. 20 % Sicherheitsreserve
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Das entspricht etwa {canisters} × 10-Liter-Kanister
          </p>
        </CardContent>
      </Card>

      {/* Eingaben */}
      <div className="mb-4 space-y-2.5">
        <Counter
          label="Erwachsene"
          value={adults}
          onChange={setAdults}
          min={0}
        />
        <Counter
          label="Kinder"
          value={children}
          onChange={setChildren}
          min={0}
        />
        <Counter
          label="Hunde"
          value={dogs}
          onChange={setDogs}
          min={0}
          max={6}
        />
        <Counter
          label="Tage ohne Wasseranschluss"
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
              Erwartete Tageshöchsttemperatur
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
            aria-label="Erwartete Tageshöchsttemperatur in Grad Celsius"
          />
          {forecast && tempAuto && (
            <p className="mt-2 text-xs text-primary">
              Automatisch übernommen: Höchstwert der nächsten {forecast.days}{" "}
              Tage an deinem Standort ({forecast.maxTemp} °C).
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
              Prognose wieder übernehmen ({forecast.maxTemp} °C)
            </button>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Ab 20 °C rechnen wir pro 5 °C einen Zuschlag von 0.5 l pro Person
            und Tag.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="pt-6">
          <p className="mb-2 text-sm font-medium">Aktivitätslevel</p>
          <div
            className="grid grid-cols-3 gap-2"
            role="group"
            aria-label="Aktivitätslevel wählen"
          >
            {(
              [
                { id: "ruhig", label: "Ruhig", hint: "Camp & Baden" },
                { id: "normal", label: "Normal", hint: "Spaziergänge" },
                { id: "aktiv", label: "Aktiv", hint: "Wandern & Sport" },
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
            <p className="text-sm font-medium">Kochen & Abwasch einrechnen</p>
            <p className="text-xs text-muted-foreground">
              +1.5 l pro Person und Tag
            </p>
          </div>
          <Switch
            checked={includeCookingHygiene}
            onCheckedChange={setIncludeCookingHygiene}
            aria-label="Wasser für Kochen und Abwasch einrechnen"
          />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="flex items-center justify-between pt-6">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <ShowerHead className="h-4 w-4 text-chart-5" aria-hidden="true" />
              Komfortable Körperpflege
            </p>
            <p className="text-xs text-muted-foreground">
              Katzenwäsche oder Solar-Dusche: +4 l pro Person und Tag
            </p>
          </div>
          <Switch
            checked={includeComfortHygiene}
            onCheckedChange={setIncludeComfortHygiene}
            aria-label="Wasser für komfortable Körperpflege einrechnen"
          />
        </CardContent>
      </Card>

      {/* Aufschlüsselung */}
      <h2 className="mb-3 font-serif text-lg font-semibold">Aufschlüsselung</h2>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-border/60">
              <td className="px-4 py-2.5 text-muted-foreground">
                Trinken Erwachsene ({result.drinkingLitersPerAdult.toFixed(1)}{" "}
                l/Tag × {adults} × {days} Tage)
              </td>
              <td className="px-4 py-2.5 text-right font-mono">
                {(adults * result.drinkingLitersPerAdult * days).toFixed(1)} l
              </td>
            </tr>
            <tr className="border-b border-border/60">
              <td className="px-4 py-2.5 text-muted-foreground">
                Trinken Kinder ({result.drinkingLitersPerChild.toFixed(1)} l/Tag
                × {children} × {days} Tage)
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
                    Hunde ({result.drinkingLitersPerDog.toFixed(1)} l/Tag ×{" "}
                    {dogs} × {days} Tage)
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right font-mono">
                  {result.dogLiters.toFixed(1)} l
                </td>
              </tr>
            )}
            <tr className="border-b border-border/60">
              <td className="px-4 py-2.5 text-muted-foreground">
                Kochen & Abwasch
              </td>
              <td className="px-4 py-2.5 text-right font-mono">
                {result.cookingHygieneLiters.toFixed(1)} l
              </td>
            </tr>
            {includeComfortHygiene && (
              <tr className="border-b border-border/60">
                <td className="px-4 py-2.5 text-muted-foreground">
                  Körperpflege komfortabel
                </td>
                <td className="px-4 py-2.5 text-right font-mono">
                  {result.comfortHygieneLiters.toFixed(1)} l
                </td>
              </tr>
            )}
            <tr className="border-b border-border/60">
              <td className="px-4 py-2.5 text-muted-foreground">
                Sicherheitsreserve (20 %)
              </td>
              <td className="px-4 py-2.5 text-right font-mono">
                {(result.recommendedLiters - result.totalLiters).toFixed(1)} l
              </td>
            </tr>
            <tr className="bg-muted/40 font-semibold">
              <td className="px-4 py-2.5">Total empfohlen</td>
              <td className="px-4 py-2.5 text-right font-mono">
                {result.recommendedLiters} l
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        Hinweis: Werte sind Richtwerte für gemässigtes Klima. Bei Hitzewellen,
        Höhenlagen oder körperlicher Arbeit grosszügiger planen. Hunde-Richtwert
        gilt für mittelgrosse Hunde (ca. 20 kg). Wasser aus Bächen nur gefiltert
        oder abgekocht verwenden.
      </p>
    </div>
  );
}
