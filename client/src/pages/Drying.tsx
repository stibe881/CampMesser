import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  BellRing,
  CloudRain,
  CloudSun,
  Droplets,
  LocateFixed,
  Plus,
  RefreshCw,
  Shirt,
  Tent,
  Thermometer,
  Trash2,
  Wind,
} from "lucide-react";
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
  rainBeforeDry,
  sunsetVerdict,
  type DryingConditions,
  type DryingItem,
  type HourlyConditions,
} from "@shared/drying";
import { getSunTimes } from "@/lib/sun";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useSyncedSetting } from "@/lib/useSyncedSetting";

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
  const [reminderOn, setReminderOn] = useState(false);
  const [leadMinutes, setLeadMinutes] = useState(30);
  const reminderTimers = useRef<number[]>([]);
  const [reminderInfo, setReminderInfo] = useState<string | null>(null);
  const [now] = useState(() => new Date());
  const [hourly, setHourly] = useState<HourlyConditions[] | null>(null);
  const [customItems, setCustomItems] = useState<DryingItem[]>(() => loadCustomItems());
  const [newLabel, setNewLabel] = useState("");
  const [newHours, setNewHours] = useState("");
  // Standort-Auswahl: eigener Standort oder gespeicherter Zeltplatz-Favorit
  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(null);
  const { isAuthenticated } = useAuth();
  const { data: spots } = trpc.spots.list.useQuery(undefined, { enabled: isAuthenticated });

  // Geräte-Sync: eigene Materialien vom Konto übernehmen bzw. Änderungen hochladen
  const customItemsSync = useSyncedSetting<DryingItem[]>("dryingCustomItems", value => {
    if (!Array.isArray(value)) return;
    const clean = value.filter(i => i && i.id && i.label && i.baseHours > 0);
    setCustomItems(clean);
    try {
      localStorage.setItem(CUSTOM_ITEMS_KEY, JSON.stringify(clean));
    } catch {
      /* egal */
    }
  });

  const saveCustomItems = (items: DryingItem[]) => {
    setCustomItems(items);
    try {
      localStorage.setItem(CUSTOM_ITEMS_KEY, JSON.stringify(items));
    } catch {
      /* egal */
    }
    customItemsSync.push(items);
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

  const fetchForLocation = async (lat: number, lng: number) => {
    try {
      const params = new URLSearchParams({
        latitude: lat.toFixed(4),
        longitude: lng.toFixed(4),
        timezone: "auto",
        current: "temperature_2m,relative_humidity_2m,wind_speed_10m",
        hourly:
          "temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,precipitation_probability",
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
      // Stündlicher Verlauf für Trocknungs-Schätzung + Regen-Warnung
      if (json.hourly?.time && Array.isArray(json.hourly.time)) {
        const hours: HourlyConditions[] = json.hourly.time.map((t: string, i: number) => ({
          time: new Date(t),
          temperature: json.hourly.temperature_2m?.[i] ?? cur.temperature_2m,
          humidity: json.hourly.relative_humidity_2m?.[i] ?? cur.relative_humidity_2m,
          windSpeed: json.hourly.wind_speed_10m?.[i] ?? cur.wind_speed_10m,
          precipitation: json.hourly.precipitation?.[i] ?? 0,
          precipitationProbability: json.hourly.precipitation_probability?.[i] ?? 0,
        }));
        setHourly(hours);
      }
      const times = getSunTimes(new Date(), lat, lng);
      setSunset(times.sunset);
      setWeather({ status: "ok", lat, lng });
    } catch {
      setWeather({ status: "error" });
    }
  };

  const loadWeather = () => {
    // Gespeicherter Zeltplatz ausgewählt → dessen Koordinaten verwenden
    if (selectedSpotId !== null) {
      const spot = spots?.find(s => s.id === selectedSpotId);
      if (spot) {
        setWeather({ status: "loading" });
        void fetchForLocation(spot.latitude, spot.longitude);
        return;
      }
    }
    if (!navigator.geolocation) {
      setWeather({ status: "error" });
      return;
    }
    setWeather({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      pos => void fetchForLocation(pos.coords.latitude, pos.coords.longitude),
      () => setWeather({ status: "error" }),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 },
    );
  };

  // Beim Öffnen automatisch die aktuellen Bedingungen laden
  useEffect(() => {
    loadWeather();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSpotId]);

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
        const rain = hourly && hourly.length > 0 ? rainBeforeDry(hourly, now, dryAt) : null;
        return { item, hours, dryAt, verdict, rain };
      }),
    [conditions, sunset, now, hourly, customItems],
  );

  /** Frühester Regen-Zeitpunkt über alle Teile, die noch nicht trocken sind. */
  const earliestRain = useMemo(() => {
    let earliest: Date | null = null;
    for (const r of results) {
      if (r.rain?.rainAt) {
        if (!earliest || r.rain.rainAt < earliest) earliest = r.rain.rainAt;
      }
    }
    return earliest;
  }, [results]);

  const clearReminderTimers = () => {
    for (const t of reminderTimers.current) window.clearTimeout(t);
    reminderTimers.current = [];
  };

  /** Erinnerung aktivieren: Timer für Regen- und Sonnenuntergangs-Warnung stellen. */
  const toggleReminder = async () => {
    if (reminderOn) {
      clearReminderTimers();
      setReminderOn(false);
      setReminderInfo(null);
      return;
    }
    let canNotify = false;
    if ("Notification" in window) {
      if (Notification.permission === "granted") canNotify = true;
      else if (Notification.permission !== "denied") {
        canNotify = (await Notification.requestPermission()) === "granted";
      }
    }
    const notify = (title: string, body: string) => {
      toast.warning(title, { description: body, duration: 30000 });
      if (canNotify) {
        try {
          new Notification(title, { body, icon: "/icons/icon-192.png" });
        } catch {
          // Einige Browser (iOS) erlauben den Konstruktor nicht – Toast reicht
        }
      }
      if ("vibrate" in navigator) navigator.vibrate?.([200, 100, 200]);
    };
    const nowMs = Date.now();
    const leadMs = leadMinutes * 60_000;
    const scheduled: string[] = [];
    if (earliestRain) {
      const fireAt = earliestRain.getTime() - leadMs;
      if (fireAt > nowMs) {
        reminderTimers.current.push(
          window.setTimeout(() => {
            notify(
              "Regen im Anzug!",
              `In ca. ${leadMinutes} Minuten beginnt es zu regnen – hol die Wäsche rein.`,
            );
          }, fireAt - nowMs),
        );
        scheduled.push(
          `Regen-Warnung um ${new Date(fireAt).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })} Uhr`,
        );
      }
    }
    if (sunset) {
      const fireAt = sunset.getTime() - leadMs;
      if (fireAt > nowMs) {
        reminderTimers.current.push(
          window.setTimeout(() => {
            notify(
              "Sonne geht bald unter",
              `Noch ca. ${leadMinutes} Minuten bis Sonnenuntergang – Wäsche vor dem Abendtau reinholen.`,
            );
          }, fireAt - nowMs),
        );
        scheduled.push(
          `Sonnenuntergangs-Erinnerung um ${new Date(fireAt).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })} Uhr`,
        );
      }
    }
    if (scheduled.length === 0) {
      toast.info("Keine Erinnerung nötig", {
        description: "Weder Regen noch Sonnenuntergang stehen in nächster Zeit bevor.",
      });
      return;
    }
    setReminderOn(true);
    setReminderInfo(scheduled.join(" · "));
  };

  // Timer aufräumen, wenn die Seite verlassen wird
  useEffect(() => clearReminderTimers, []);

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader
        title="Trockenzeiten"
        subtitle="Wird die Wäsche an der Leine bis Sonnenuntergang trocken? Berechnet aus Temperatur, Luftfeuchtigkeit und Wind."
      />

      {/* Standort-Auswahl: eigener Standort oder gespeicherte Zeltplätze */}
      {isAuthenticated && spots && spots.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant={selectedSpotId === null ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => setSelectedSpotId(null)}
          >
            <LocateFixed className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Mein Standort
          </Button>
          {spots.map(spot => (
            <Button
              key={spot.id}
              type="button"
              variant={selectedSpotId === spot.id ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => setSelectedSpotId(spot.id)}
            >
              <Tent className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> {spot.name}
            </Button>
          ))}
        </div>
      )}

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
      <Card className="mb-5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BellRing className="h-4 w-4 text-primary" aria-hidden="true" />
            Wäsche-Erinnerung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Erhalte eine Warnung, bevor Regen einsetzt oder die Sonne untergeht – damit du die
            Wäsche rechtzeitig reinholen kannst. Die Erinnerung funktioniert, solange die App
            geöffnet ist (auch im Hintergrund-Tab).
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor="lead" className="text-xs">
              Vorlaufzeit:
            </Label>
            <div className="flex gap-1.5" role="group" aria-label="Vorlaufzeit wählen">
              {[15, 30, 60].map(min => (
                <Button
                  key={min}
                  type="button"
                  size="sm"
                  variant={leadMinutes === min ? "default" : "outline"}
                  className="rounded-full"
                  disabled={reminderOn}
                  onClick={() => setLeadMinutes(min)}
                >
                  {min} Min.
                </Button>
              ))}
            </div>
            <Button
              type="button"
              size="sm"
              variant={reminderOn ? "destructive" : "default"}
              className="ml-auto"
              onClick={() => void toggleReminder()}
            >
              <BellRing className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              {reminderOn ? "Erinnerung stoppen" : "Erinnerung aktivieren"}
            </Button>
          </div>
          {reminderOn && reminderInfo && (
            <p className="mt-2.5 rounded-lg bg-accent px-3 py-2 text-xs text-accent-foreground">
              Aktiv: {reminderInfo}
            </p>
          )}
        </CardContent>
      </Card>
      <div className="space-y-3">
        {results.map(({ item, hours, dryAt, verdict, rain }) => (
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
            {rain && (
              <p className="mt-2 flex items-start gap-2 rounded-lg bg-chart-4/15 px-3 py-2 text-sm font-medium text-foreground">
                <CloudRain className="mt-0.5 h-4 w-4 shrink-0 text-chart-4" aria-hidden="true" />
                <span>
                  Achtung: Ab{" "}
                  <span className="font-mono font-semibold">
                    {rain.rainAt.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
                  </span>{" "}
                  Uhr{rain.rainAt.getDate() !== now.getDate() && " (morgen)"} ist Regen angesagt
                  {rain.probability !== null && ` (${rain.probability} %)`} – vorher abnehmen oder
                  unters Vordach hängen!
                </span>
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
