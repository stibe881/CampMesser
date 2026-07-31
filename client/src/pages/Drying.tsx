import { useEffect, useMemo, useState } from "react";
import { CloudSun, Droplets, Plus, RefreshCw, Shirt, Thermometer, Trash2, Wind } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DRYING_ITEMS,
  estimateDryingTime,
  estimateDryingWithForecast,
  formatHours,
  sunsetVerdict,
  type DryingConditions,
  type DryingItem,
  type HourlyConditions,
} from "@shared/drying";
import { getSunTimes } from "@/lib/sun";
import { cn } from "@/lib/utils";

type WeatherState =
  | { status: "idle" | "loading" | "error" }
  | { status: "ok"; lat: number; lng: number };

const CUSTOM_ITEMS_KEY = "campmesser.drying.customItems";

function loadCustomItems(): DryingItem[] {
  try {
    const raw = localStorage.getItem(CUSTOM_ITEMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DryingItem[];
      if (Array.isArray(parsed)) return parsed.filter(i => i.id && i.label && i.baseHours > 0);
    }
  } catch {
    /* defaults */
  }
  return [];
}

export default function DryingPage() {
  const [conditions, setConditions] = useState<DryingConditions>({
    temperature: 20,
    humidity: 60,
    windSpeed: 5,
  });
  const [weather, setWeather] = useState<WeatherState>({ status: "idle" });
  const [sunset, setSunset] = useState<Date | null>(null);
  const [now] = useState(() => new Date());
  const [hourly, setHourly] = useState<HourlyConditions[] | null>(null);
  const [customItems, setCustomItems] = useState<DryingItem[]>(() => loadCustomItems());
  const [newLabel, setNewLabel] = useState("");
  const [newHours, setNewHours] = useState("");

  const saveCustomItems = (items: DryingItem[]) => {
    setCustomItems(items);
    try {
      localStorage.setItem(CUSTOM_ITEMS_KEY, JSON.stringify(items));
    } catch {
      /* egal */
    }
  };

  const addCustomItem = () => {
    const hours = parseFloat(newHours.replace(",", "."));
    const label = newLabel.trim();
    if (!label || Number.isNaN(hours) || hours <= 0 || hours > 48) return;
    const item: DryingItem = {
      id: `custom-${Date.now()}`,
      label,
      baseHours: hours,
      note: "Eigenes Material",
    };
    saveCustomItems([...customItems, item]);
    setNewLabel("");
    setNewHours("");
  };

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
            hourly: "temperature_2m,relative_humidity_2m,wind_speed_10m",
            forecast_days: "2",
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
          // Stündlicher Verlauf für die genauere Trocknungs-Schätzung
          if (json.hourly?.time && Array.isArray(json.hourly.time)) {
            const hours: HourlyConditions[] = json.hourly.time.map((t: string, i: number) => ({
              time: new Date(t),
              temperature: json.hourly.temperature_2m?.[i] ?? cur.temperature_2m,
              humidity: json.hourly.relative_humidity_2m?.[i] ?? cur.relative_humidity_2m,
              windSpeed: json.hourly.wind_speed_10m?.[i] ?? cur.wind_speed_10m,
            }));
            setHourly(hours);
          }
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
    // Manuelle Eingabe → Punktschätzung statt Prognose-Verlauf verwenden
    setHourly(null);
  };

  const results = useMemo(
    () =>
      [...DRYING_ITEMS, ...customItems].map(item => {
        let hours: number;
        let dryAt: Date | null = null;
        if (hourly && hourly.length > 0) {
          const fc = estimateDryingWithForecast(item.baseHours, hourly, now);
          // Verlauf reicht nicht bis zum Trocknen → konservativ hochrechnen
          hours = fc.dryAt ? fc.hours : Math.max(fc.hours, 48);
          dryAt = fc.dryAt;
        } else {
          hours = estimateDryingTime(item.baseHours, conditions).hours;
        }
        const verdict = sunset ? sunsetVerdict(hours, now, sunset) : null;
        return { item, hours, dryAt, verdict };
      }),
    [conditions, sunset, now, hourly, customItems],
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
              {hourly && hourly.length > 0 && (
                <> Die Schätzung rechnet mit dem stündlichen Prognose-Verlauf (genauer als eine Momentaufnahme).</>
              )}
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
        {results.map(({ item, hours, dryAt, verdict }) => (
          <div key={item.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.note}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Badge variant="outline" className="font-mono">
                  {hours >= 48 ? "> 24 Std." : formatHours(hours)}
                </Badge>
                {item.id.startsWith("custom-") && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => saveCustomItems(customItems.filter(c => c.id !== item.id))}
                    aria-label={`${item.label} entfernen`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                )}
              </div>
            </div>
            {dryAt && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Voraussichtlich trocken um{" "}
                <span className="font-mono font-semibold">
                  {dryAt.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
                </span>{" "}
                Uhr
                {dryAt.getDate() !== now.getDate() && " (morgen)"}.
              </p>
            )}
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

      {/* Eigenes Material hinzufügen */}
      <Card className="mt-5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4 text-primary" aria-hidden="true" />
            Eigenes Material hinzufügen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="new-label" className="mb-1.5 block text-xs">
                Bezeichnung
              </Label>
              <Input
                id="new-label"
                placeholder="z. B. Wollpullover"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
              />
            </div>
            <div className="w-28">
              <Label htmlFor="new-hours" className="mb-1.5 block text-xs">
                Basis (Std.)
              </Label>
              <Input
                id="new-hours"
                inputMode="decimal"
                placeholder="4"
                value={newHours}
                onChange={e => setNewHours(e.target.value)}
              />
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={addCustomItem}
            disabled={!newLabel.trim() || !newHours.trim()}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Hinzufügen
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Basis-Trockenzeit = wie lange das Teil bei mildem Sommerwetter (20 °C, 60 % Feuchte,
            leichter Wind) zum Trocknen braucht. Deine Materialien bleiben auf diesem Gerät
            gespeichert.
          </p>
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground">
        Schätzwerte für gut ausgewrungene, frei hängende Sachen. Direkte Sonne beschleunigt das
        Trocknen zusätzlich, Schatten und Windstille verlangsamen es. Bei Regen gilt: alles unters
        Vordach.
      </p>
    </div>
  );
}
