import { useState } from "react";
import { Scale } from "lucide-react";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/i18n";
import { pick } from "@shared/i18n";
import {
  celsiusToFahrenheit,
  convertVolume,
  DENSITY_INGREDIENTS,
  DENSITY_INGREDIENT_LABELS,
  fahrenheitToCelsius,
  gramsToMl,
  mlToGrams,
  OVEN_LEVELS,
  ovenLevelForCelsius,
  roundResult,
  VOLUME_LABELS,
  VOLUME_SHORT_LABELS,
  VOLUME_UNITS,
  type DensityIngredient,
  type VolumeUnit,
} from "@shared/kitchenUnits";
import { formatAmount, parseNumberToken } from "@shared/servings";
import { cn } from "@/lib/utils";

/** Eingabefeld lesen – «1,5», «1.5» und «1/2» sind alle erlaubt. */
function readNumber(raw: string): number {
  if (raw.trim() === "") return 0;
  const value = parseNumberToken(raw);
  return Number.isFinite(value) ? value : 0;
}

/**
 * Mass- & Temperatur-Umrechner (#232): kleines Werkzeug fürs Kochen am Platz –
 * Tasse/Esslöffel/Teelöffel ↔ ml, Gramm ↔ ml für die gängigsten Zutaten,
 * °C ↔ °F und die Backofen-Tabelle mit den Gasstufen. Die Rechnerei liegt in
 * shared/kitchenUnits.ts; hier steht nur die Bedienung.
 */
export default function KitchenConverterDialog() {
  const { lang, t } = useI18n();
  const format = (value: number) => formatAmount(roundResult(value), lang);

  // ── Tassen & Löffel ──
  const [volumeInput, setVolumeInput] = useState("1");
  const [volumeUnit, setVolumeUnit] = useState<VolumeUnit>("cup");
  const volumeValue = readNumber(volumeInput);

  // ── Gramm ↔ Milliliter ──
  const [weightInput, setWeightInput] = useState("100");
  const [ingredient, setIngredient] = useState<DensityIngredient>("flour");
  const [toVolume, setToVolume] = useState(true);
  const weightValue = readNumber(weightInput);
  const weightResult = toVolume
    ? gramsToMl(weightValue, ingredient)
    : mlToGrams(weightValue, ingredient);

  // ── Temperatur ──
  const [tempInput, setTempInput] = useState("180");
  const [tempIsCelsius, setTempIsCelsius] = useState(true);
  const tempValue = readNumber(tempInput);
  const celsius = tempIsCelsius ? tempValue : fahrenheitToCelsius(tempValue);
  const fahrenheit = tempIsCelsius ? celsiusToFahrenheit(tempValue) : tempValue;
  const ovenLevel = ovenLevelForCelsius(celsius);

  /** Chip-Knopf für die Richtungs- und Einheiten-Wahl. */
  const chip = (active: boolean) =>
    cn(
      "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
      active
        ? "bg-primary text-primary-foreground"
        : "bg-muted text-muted-foreground hover:text-foreground"
    );

  return (
    <DialogContent className="max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 font-serif text-xl">
          <Scale className="h-5 w-5 text-primary" aria-hidden="true" />
          {t.converter.title}
        </DialogTitle>
        <DialogDescription>{t.converter.description}</DialogDescription>
      </DialogHeader>

      <div className="space-y-5">
        {/* Tassen & Löffel ↔ Milliliter */}
        <section>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t.converter.volumeTitle}
          </h3>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <Label htmlFor="converter-volume">
                {t.converter.amountLabel}
              </Label>
              <Input
                id="converter-volume"
                className="mt-1.5 w-28"
                inputMode="decimal"
                value={volumeInput}
                onChange={e => setVolumeInput(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="converter-volume-unit">
                {t.converter.unitLabel}
              </Label>
              <Select
                value={volumeUnit}
                onValueChange={value => setVolumeUnit(value as VolumeUnit)}
              >
                <SelectTrigger
                  id="converter-volume-unit"
                  className="mt-1.5 w-48"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VOLUME_UNITS.map(unit => (
                    <SelectItem key={unit} value={unit}>
                      {pick(VOLUME_LABELS[unit], lang)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-1.5 text-sm sm:grid-cols-3">
            {VOLUME_UNITS.filter(unit => unit !== volumeUnit).map(unit => (
              <li
                key={unit}
                className="rounded-lg border border-border bg-muted/40 px-2.5 py-1.5"
              >
                <span className="font-semibold tabular-nums">
                  {format(convertVolume(volumeValue, volumeUnit, unit))}
                </span>{" "}
                <span className="text-muted-foreground">
                  {pick(VOLUME_SHORT_LABELS[unit], lang)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Gramm ↔ Milliliter über die Dichte */}
        <section>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t.converter.weightTitle}
          </h3>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <Label htmlFor="converter-weight">
                {t.converter.amountLabel}
              </Label>
              <Input
                id="converter-weight"
                className="mt-1.5 w-28"
                inputMode="decimal"
                value={weightInput}
                onChange={e => setWeightInput(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="converter-ingredient">
                {t.converter.ingredientLabel}
              </Label>
              <Select
                value={ingredient}
                onValueChange={value =>
                  setIngredient(value as DensityIngredient)
                }
              >
                <SelectTrigger
                  id="converter-ingredient"
                  className="mt-1.5 w-40"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DENSITY_INGREDIENTS.map(key => (
                    <SelectItem key={key} value={key}>
                      {pick(DENSITY_INGREDIENT_LABELS[key], lang)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div
            className="mt-2 flex gap-1.5"
            role="group"
            aria-label={t.converter.directionAria}
          >
            <button
              type="button"
              className={chip(toVolume)}
              aria-pressed={toVolume}
              onClick={() => setToVolume(true)}
            >
              {t.converter.gramsToMl}
            </button>
            <button
              type="button"
              className={chip(!toVolume)}
              aria-pressed={!toVolume}
              onClick={() => setToVolume(false)}
            >
              {t.converter.mlToGrams}
            </button>
          </div>
          <p className="mt-2 rounded-lg bg-accent/60 px-3 py-2 text-sm">
            <span className="font-semibold tabular-nums">
              {format(weightResult)}
            </span>{" "}
            {toVolume ? "ml" : "g"}
            <span className="text-muted-foreground">
              {" · "}
              {pick(DENSITY_INGREDIENT_LABELS[ingredient], lang)}
            </span>
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {t.converter.weightHint}
          </p>
        </section>

        {/* Temperatur und Backofen-Stufen */}
        <section>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t.converter.tempTitle}
          </h3>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <Label htmlFor="converter-temp">{t.converter.tempLabel}</Label>
              <Input
                id="converter-temp"
                className="mt-1.5 w-28"
                inputMode="decimal"
                value={tempInput}
                onChange={e => setTempInput(e.target.value)}
              />
            </div>
            <div
              className="flex gap-1.5 pb-0.5"
              role="group"
              aria-label={t.converter.tempUnitAria}
            >
              <button
                type="button"
                className={chip(tempIsCelsius)}
                aria-pressed={tempIsCelsius}
                onClick={() => setTempIsCelsius(true)}
              >
                °C
              </button>
              <button
                type="button"
                className={chip(!tempIsCelsius)}
                aria-pressed={!tempIsCelsius}
                onClick={() => setTempIsCelsius(false)}
              >
                °F
              </button>
            </div>
          </div>
          <p className="mt-2 rounded-lg bg-accent/60 px-3 py-2 text-sm">
            <span className="font-semibold tabular-nums">
              {tempIsCelsius ? format(fahrenheit) : format(celsius)}
            </span>{" "}
            {tempIsCelsius ? "°F" : "°C"}
            <span className="text-muted-foreground">
              {" · "}
              {ovenLevel
                ? `${t.converter.gasMark(ovenLevel.gasMark)} (${pick(ovenLevel.label, lang)})`
                : t.converter.noGasMark}
            </span>
          </p>
        </section>

        {/* Backofen-Tabelle */}
        <section>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t.converter.ovenTitle}
          </h3>
          <ul className="space-y-1 text-sm">
            {OVEN_LEVELS.map(level => (
              <li
                key={level.gasMark}
                className={cn(
                  "flex flex-wrap items-baseline gap-x-2 rounded-lg border px-2.5 py-1.5",
                  ovenLevel?.gasMark === level.gasMark
                    ? "border-primary bg-primary/10"
                    : "border-border"
                )}
              >
                <span className="font-semibold">
                  {t.converter.gasMark(level.gasMark)}
                </span>
                <span className="tabular-nums">
                  {level.celsius} °C ·{" "}
                  {format(celsiusToFahrenheit(level.celsius))} °F
                </span>
                <span className="text-muted-foreground">
                  {pick(level.label, lang)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {t.converter.ovenHint}
          </p>
        </section>
      </div>
    </DialogContent>
  );
}
