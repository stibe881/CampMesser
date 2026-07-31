import { useMemo, useState } from "react";
import { Sprout, Tent, Thermometer, Sun, Droplets, Clock, RefreshCcw } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  estimateLawnTolerance,
  formatHours,
  lawnVerdict,
  type FloorType,
  type GrassCondition,
  type Moisture,
  type SunExposure,
} from "@shared/lawn";

const floorOptions: { value: FloorType; label: string; hint: string }[] = [
  { value: "mesh", label: "Mesh / ohne Boden", hint: "Licht und Luft kommen durch" },
  { value: "standard", label: "Standard-Zeltboden", hint: "übliche Bodenwanne" },
  { value: "footprint", label: "Boden + Footprint", hint: "dichtet vollständig ab" },
];
const grassOptions: { value: GrassCondition; label: string; hint: string }[] = [
  { value: "robust", label: "Robust", hint: "Sport-/Campingwiese" },
  { value: "normal", label: "Normal", hint: "gewöhnliche Wiese" },
  { value: "delicate", label: "Empfindlich", hint: "Zierrasen, frisch gesät" },
];
const sunOptions: { value: SunExposure; label: string }[] = [
  { value: "shade", label: "Schattig" },
  { value: "partial", label: "Halbschatten" },
  { value: "full", label: "Pralle Sonne" },
];
const moistureOptions: { value: Moisture; label: string }[] = [
  { value: "dry", label: "Trocken" },
  { value: "normal", label: "Normal" },
  { value: "wet", label: "Nass" },
];

/** Rasenschoner-Rechner: Wie lange darf das Zelt auf dem Rasen stehen? */
export default function LawnPage() {
  const [floor, setFloor] = useState<FloorType>("standard");
  const [grass, setGrass] = useState<GrassCondition>("normal");
  const [temperature, setTemperature] = useState(20);
  const [sun, setSun] = useState<SunExposure>("partial");
  const [moisture, setMoisture] = useState<Moisture>("normal");
  const [plannedDays, setPlannedDays] = useState(3);

  const result = useMemo(
    () => estimateLawnTolerance({ floor, grass, temperature, sun, moisture }),
    [floor, grass, temperature, sun, moisture],
  );
  const verdict = lawnVerdict(plannedDays * 24, result);

  const verdictStyle = {
    safe: "border-primary/40 bg-primary/10 text-primary",
    caution: "border-amber-glow/50 bg-amber-glow/10 text-amber-glow",
    damage: "border-destructive/40 bg-destructive/10 text-destructive",
  }[verdict];
  const verdictText = {
    safe: "Unbedenklich – der Rasen erholt sich innert weniger Tage von selbst.",
    caution:
      "Vorsicht – das Gras wird vergilben. Es erholt sich meist in 1–2 Wochen, plane das Umstellen ein.",
    damage:
      "Bleibende Schäden wahrscheinlich – bei dieser Standzeit stirbt das Gras darunter ab. Stelle das Zelt zwingend um.",
  }[verdict];

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
      <PageHeader
        title="Rasenschoner"
        subtitle="Wie lange darf das Zelt auf dem Rasen stehen, bevor das Gras Schaden nimmt?"
      />

      <Card className="mb-5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Tent className="h-4 w-4 text-primary" aria-hidden="true" />
            Dein Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <OptionRow label="Zeltboden" options={floorOptions} value={floor} onChange={setFloor} />
          <OptionRow label="Rasen-Zustand" options={grassOptions} value={grass} onChange={setGrass} />
          <OptionRow label="Sonneneinstrahlung am Stellplatz" options={sunOptions} value={sun} onChange={setSun} />
          <OptionRow label="Bodenfeuchte" options={moistureOptions} value={moisture} onChange={setMoisture} />
          <div>
            <Label className="mb-1.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <Thermometer className="h-3.5 w-3.5" aria-hidden="true" /> Tagestemperatur
              </span>
              <span className="font-semibold">{temperature} °C</span>
            </Label>
            <Slider
              value={[temperature]}
              min={0}
              max={38}
              step={1}
              onValueChange={v => setTemperature(v[0] ?? 20)}
              aria-label="Tagestemperatur in Grad Celsius"
            />
          </div>
          <div>
            <Label className="mb-1.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Geplante Standzeit
              </span>
              <span className="font-semibold">
                {plannedDays} Tag{plannedDays > 1 ? "e" : ""}
              </span>
            </Label>
            <Slider
              value={[plannedDays]}
              min={1}
              max={14}
              step={1}
              onValueChange={v => setPlannedDays(v[0] ?? 3)}
              aria-label="Geplante Standzeit in Tagen"
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
            <Sun className="mx-auto mb-1.5 h-5 w-5 text-amber-glow" aria-hidden="true" />
            <p className="text-lg font-bold">{formatHours(result.yellowingHours)}</p>
            <p className="text-xs text-muted-foreground">bis erste Vergilbung</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <Droplets className="mx-auto mb-1.5 h-5 w-5 text-destructive" aria-hidden="true" />
            <p className="text-lg font-bold">{formatHours(result.damageHours)}</p>
            <p className="text-xs text-muted-foreground">bis bleibende Schäden</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <RefreshCcw className="mx-auto mb-1.5 h-5 w-5 text-primary" aria-hidden="true" />
            <p className="text-lg font-bold">{formatHours(result.moveAfterHours)}</p>
            <p className="text-xs text-muted-foreground">spätestens dann umstellen</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sprout className="h-4 w-4 text-primary" aria-hidden="true" />
            Tipps zum Rasenschonen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Zelt regelmässig umstellen:</strong> Schon ein
              Versetzen um eine Zeltbreite gibt dem Gras Licht und Luft zurück.
            </li>
            <li>
              <strong className="text-foreground">Zelt tagsüber lüften:</strong> Boden anheben oder
              Apsiden öffnen, damit Hitze und Feuchtigkeit entweichen.
            </li>
            <li>
              <strong className="text-foreground">Vergilbtes Gras:</strong> erholt sich meist in 1–2
              Wochen von selbst – braunes, matschiges Gras braucht oft eine Nachsaat.
            </li>
            <li>
              <strong className="text-foreground">Heisse Tage:</strong> Bei über 30 °C in praller
              Sonne leidet der Rasen unter dem Zeltboden schon nach einem Tag.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
