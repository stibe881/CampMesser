import { useEffect, useMemo, useState } from "react";
import { CloudSun, Droplets, RefreshCw, Shirt, Thermometer, Wind } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DRYING_ITEMS,
  estimateDryingTime,
  formatHours,
  sunsetVerdict,
  type DryingConditions,
} from "@shared/drying";
import { getSunTimes } from "@/lib/sun";
import { cn } from "@/lib/utils";

type WeatherState =
  | { status: "idle" | "loading" | "error" }
  | { status: "ok"; lat: number; lng: number };

export default function DryingPage() {
  const [conditions, setConditions] = useState<DryingConditions>({
    temperature: 20,
    humidity: 60,
    windSpeed: 5,
  });
  const [weather, setWeather] = useState<WeatherState>({ status: "idle" });
  const [sunset, setSunset] = useState<Date | null>(null);
  const [now] = useState(() => new Date());

  const loadWeather = () => {
    if (!navigator.geolocation) {
      setWeather({ status: "error" });
      return;
    }
    setWeather({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const params = new URLSearchParams({
            latitude: pos.coords.latitude.toFixed(4),
            longitude: pos.coords.longitude.toFixed(4),
            timezone: "auto",
            current: "temperature_2m,relative_humidity_2m,wind_speed_10m",
          });
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
          if (!res.ok) throw new Error("Wetterdienst nicht erreichbar");
          const json = await res.json();
          const cur = json.current;
          if (!cur) throw new Error("Keine Daten");
          setConditions({
            temperature: Math.round(cur.temperature_2m),
            humidity: Math.round(cur.relative_humidity_2m),
            windSpeed: Math.round(cur.wind_speed_10m),
          });
          const times = getSunTimes(new Date(), pos.coords.latitude, pos.coords.longitude);
          setSunset(times.sunset);
          setWeather({ status: "ok", lat: pos.coords.latitude, lng: pos.coords.longitude });
        } catch {
          setWeather({ status: "error" });
        }
      },
      () => setWeather({ status: "error" }),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 },
    );
  };

  // Beim Öffnen automatisch die aktuellen Bedingungen laden
  useEffect(() => {
    loadWeather();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (field: keyof DryingConditions, raw: string) => {
    const v = parseFloat(raw.replace(",", "."));
    setConditions(c => ({ ...c, [field]: Number.isNaN(v) ? 0 : v }));
  };

  const results = useMemo(
    () =>
      DRYING_ITEMS.map(item => {
        const est = estimateDryingTime(item.baseHours, conditions);
        const verdict = sunset ? sunsetVerdict(est.hours, now, sunset) : null;
        return { item, est, verdict };
      }),
    [conditions, sunset, now],
  );

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader
        title="Trockenzeiten"
        subtitle="Wird die Wäsche an der Leine bis Sonnenuntergang trocken? Berechnet aus Temperatur, Luftfeuchtigkeit und Wind."
      />

      <Card className="mb-5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CloudSun className="h-4 w-4 text-primary" aria-hidden="true" />
            Aktuelle Bedingungen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="temp" className="mb-1.5 flex items-center gap-1 text-xs">
                <Thermometer className="h-3.5 w-3.5" aria-hidden="true" /> Temp. (°C)
              </Label>
              <Input
                id="temp"
                inputMode="decimal"
                value={String(conditions.temperature)}
                onChange={e => setField("temperature", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="hum" className="mb-1.5 flex items-center gap-1 text-xs">
                <Droplets className="h-3.5 w-3.5" aria-hidden="true" /> Feuchte (%)
              </Label>
              <Input
                id="hum"
                inputMode="decimal"
                value={String(conditions.humidity)}
                onChange={e => setField("humidity", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="wind" className="mb-1.5 flex items-center gap-1 text-xs">
                <Wind className="h-3.5 w-3.5" aria-hidden="true" /> Wind (km/h)
              </Label>
              <Input
                id="wind"
                inputMode="decimal"
                value={String(conditions.windSpeed)}
                onChange={e => setField("windSpeed", e.target.value)}
              />
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={loadWeather}
            disabled={weather.status === "loading"}
          >
            <RefreshCw
              className={cn("mr-1.5 h-3.5 w-3.5", weather.status === "loading" && "animate-spin")}
              aria-hidden="true"
            />
            {weather.status === "loading"
              ? "Wetter wird geladen …"
              : "Aktuelles Wetter vom Standort übernehmen"}
          </Button>
          {weather.status === "ok" && sunset && (
            <p className="mt-2 text-xs text-primary">
              Wetter übernommen – Sonnenuntergang heute um{" "}
              {sunset.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })} Uhr.
            </p>
          )}
          {weather.status === "error" && (
            <p className="mt-2 text-xs text-destructive">
              Wetter konnte nicht geladen werden – trage die Werte von Hand ein (Sonnenuntergangs-
              Empfehlung braucht die Standortfreigabe).
            </p>
          )}
        </CardContent>
      </Card>

      <h2 className="mb-3 flex items-center gap-2 font-serif text-lg font-semibold">
        <Shirt className="h-4 w-4 text-primary" aria-hidden="true" />
        Was hängt an der Leine?
      </h2>
      <div className="space-y-3">
        {results.map(({ item, est, verdict }) => (
          <div key={item.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.note}</p>
              </div>
              <Badge variant="outline" className="shrink-0 font-mono">
                {formatHours(est.hours)}
              </Badge>
            </div>
            {verdict && (
              <p
                className={cn(
                  "mt-2.5 rounded-lg px-3 py-2 text-sm",
                  verdict.driesBeforeSunset
                    ? "bg-primary/10 text-primary"
                    : "bg-destructive/10 text-destructive",
                )}
              >
                {verdict.recommendation}
              </p>
            )}
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Schätzwerte für gut ausgewrungene, frei hängende Sachen. Direkte Sonne beschleunigt das
        Trocknen zusätzlich, Schatten und Windstille verlangsamen es. Bei Regen gilt: alles unters
        Vordach.
      </p>
    </div>
  );
}
