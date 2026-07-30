import { useMemo, useState } from "react";
import {
  BatteryCharging,
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
import { trpc } from "@/lib/trpc";
import { calcEnergyBudget } from "@shared/calculators";
import { cn } from "@/lib/utils";

const presetConsumers = [
  { name: "Kompressor-Kühlbox", watts: 45, hoursPerDay: 8 },
  { name: "Laptop", watts: 60, hoursPerDay: 2 },
  { name: "Drohnen-Akku laden", watts: 90, hoursPerDay: 1 },
  { name: "Smartphone laden", watts: 15, hoursPerDay: 2 },
  { name: "LED-Beleuchtung", watts: 8, hoursPerDay: 4 },
  { name: "Kamera-Akkus", watts: 20, hoursPerDay: 1.5 },
];

export default function EnergyPage() {
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const query = trpc.energy.consumers.useQuery(undefined, { enabled: isAuthenticated });

  const [batteryWh, setBatteryWh] = useState("1024");
  const [solarWatts, setSolarWatts] = useState("400");
  const [sunHours, setSunHours] = useState(4);
  const [form, setForm] = useState({ name: "", watts: "", hoursPerDay: "" });

  const addMutation = trpc.energy.add.useMutation({
    onSuccess: () => {
      utils.energy.consumers.invalidate();
      setForm({ name: "", watts: "", hoursPerDay: "" });
    },
    onError: () => toast.error("Verbraucher konnte nicht gespeichert werden"),
  });
  const updateMutation = trpc.energy.update.useMutation({
    onMutate: async input => {
      await utils.energy.consumers.cancel();
      const prev = utils.energy.consumers.getData();
      utils.energy.consumers.setData(undefined, old =>
        old?.map(c => (c.id === input.id ? { ...c, ...input } : c)),
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
    [batteryWh, solarWatts, sunHours, consumers],
  );

  if (loading) {
    return (
      <div className="container flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Lädt" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-6">
        <PageHeader
          title="Energie-Budget-Rechner"
          subtitle="Wie lange reicht deine Powerstation? Verbraucher erfassen und Autarkie berechnen."
        />
        <LoginPrompt feature="deine Energie-Verbraucher" />
      </div>
    );
  }

  const autonomyLabel = result.selfSufficient
    ? "Unbegrenzt – Solar deckt den Verbrauch"
    : result.autonomyDays === Infinity
      ? "–"
      : result.autonomyDays >= 14
        ? "> 14 Tage"
        : `${result.autonomyDays.toFixed(1)} Tage`;

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader
        title="Energie-Budget-Rechner"
        subtitle="Verbraucher, Solarertrag und Akkukapazität kombiniert: So lange kannst du autark stehen."
      />

      {/* Ergebnis */}
      <Card className={cn("mb-6", result.selfSufficient ? "border-primary/50 bg-accent/40" : "")}>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="text-center">
              <p className="font-serif text-2xl font-bold text-primary">{autonomyLabel}</p>
              <p className="text-xs text-muted-foreground">Autarkie-Dauer</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{Math.round(result.dailyConsumptionWh)} Wh</p>
              <p className="text-xs text-muted-foreground">Verbrauch / Tag</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{Math.round(result.dailySolarYieldWh)} Wh</p>
              <p className="text-xs text-muted-foreground">Solarertrag / Tag</p>
            </div>
            <div className="text-center">
              <p className={cn("text-2xl font-bold", result.netDailyWh > 0 ? "text-destructive" : "text-primary")}>
                {result.netDailyWh > 0 ? "−" : "+"}
                {Math.abs(Math.round(result.netDailyWh))} Wh
              </p>
              <p className="text-xs text-muted-foreground">Bilanz / Tag</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Einstellungen */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="mb-1.5 flex items-center gap-2">
              <BatteryCharging className="h-4 w-4 text-primary" aria-hidden="true" />
              <Label htmlFor="battery">Akkukapazität (Wh)</Label>
            </div>
            <Input
              id="battery"
              type="number"
              min="0"
              value={batteryWh}
              onChange={e => setBatteryWh(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Standard: DJI Power 1000 mit 1024 Wh
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="mb-1.5 flex items-center gap-2">
              <Sun className="h-4 w-4 text-chart-1" aria-hidden="true" />
              <Label htmlFor="solar">Solarpanels (W gesamt)</Label>
            </div>
            <Input
              id="solar"
              type="number"
              min="0"
              value={solarWatts}
              onChange={e => setSolarWatts(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">z. B. 2 × 200-W-Panels = 400</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="mb-2 flex items-center justify-between">
            <Label htmlFor="sun-hours">Effektive Sonnenstunden pro Tag</Label>
            <span className="rounded-md bg-muted px-2.5 py-1 font-mono text-sm font-semibold">
              {sunHours} h
            </span>
          </div>
          <Slider
            id="sun-hours"
            min={0}
            max={10}
            step={0.5}
            value={[sunHours]}
            onValueChange={v => setSunHours(v[0])}
            aria-label="Effektive Sonnenstunden pro Tag"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Richtwerte Schweiz: Sommer sonnig 5–6 h, wechselhaft 3–4 h, bedeckt 1–2 h. Verschattung
            durch Bäume oder Berge reduziert den Wert deutlich – prüfe den Sonnenverlauf im{" "}
            <a href="/sonne" className="font-medium text-primary hover:underline">
              Sonnenstand-Kompass
            </a>
            . Die Rechnung berücksichtigt bereits einen Systemverlust von 30 %.
          </p>
        </CardContent>
      </Card>

      {/* Verbraucher */}
      <h2 className="mb-3 font-serif text-lg font-semibold">Deine Verbraucher</h2>

      <form
        className="mb-3 grid grid-cols-[1fr_5rem_5rem_auto] gap-2"
        onSubmit={e => {
          e.preventDefault();
          const name = form.name.trim();
          const watts = Number(form.watts);
          const hours = Number(form.hoursPerDay);
          if (!name || !(watts > 0) || !(hours > 0)) {
            toast.error("Bitte Name, Watt und Stunden angeben");
            return;
          }
          addMutation.mutate({ name, watts, hoursPerDay: Math.min(24, hours) });
        }}
      >
        <Input
          placeholder="Verbraucher"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          aria-label="Name des Verbrauchers"
        />
        <Input
          placeholder="Watt"
          type="number"
          min="0"
          value={form.watts}
          onChange={e => setForm(f => ({ ...f, watts: e.target.value }))}
          aria-label="Leistung in Watt"
        />
        <Input
          placeholder="h/Tag"
          type="number"
          min="0"
          max="24"
          step="0.5"
          value={form.hoursPerDay}
          onChange={e => setForm(f => ({ ...f, hoursPerDay: e.target.value }))}
          aria-label="Betriebsstunden pro Tag"
        />
        <Button type="submit" disabled={addMutation.isPending} aria-label="Verbraucher hinzufügen">
          <Plus className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>

      {/* Vorschläge */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {presetConsumers
          .filter(p => !consumers.some(c => c.name === p.name))
          .map(p => (
            <button
              key={p.name}
              type="button"
              onClick={() => addMutation.mutate(p)}
              className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              aria-label={`Vorschlag ${p.name} hinzufügen`}
            >
              + {p.name} ({p.watts} W)
            </button>
          ))}
      </div>

      {query.isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Lädt" />
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
                  !c.enabled && "opacity-55",
                )}
              >
                <Zap className="h-4 w-4 shrink-0 text-chart-1" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.watts} W · {c.hoursPerDay} h/Tag = {Math.round(dailyWh)} Wh
                  </p>
                </div>
                <Switch
                  checked={c.enabled}
                  onCheckedChange={enabled => updateMutation.mutate({ id: c.id, enabled })}
                  aria-label={`${c.name} ${c.enabled ? "deaktivieren" : "aktivieren"}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground/60 hover:text-destructive"
                  onClick={() => removeMutation.mutate({ id: c.id })}
                  aria-label={`${c.name} löschen`}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Noch keine Verbraucher erfasst – nutze die Vorschläge oben oder trage eigene Geräte ein.
        </p>
      )}
    </div>
  );
}
