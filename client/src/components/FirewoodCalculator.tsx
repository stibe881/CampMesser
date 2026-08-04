/**
 * Feuerholz-Bedarf (#287): wie viele Netze ins Auto.
 *
 * Gerechnet wird in NETZEN, nicht nur in Kilogramm – so kauft man Holz,
 * und so passt es in den Kofferraum. Die Kilogramm stehen daneben, weil
 * man am Platz manchmal einen offenen Korb bekommt.
 *
 * Die Zahlen sind Faustwerte: Wind, Feuchte und wer das Feuer hütet,
 * machen leicht die Hälfte aus. Das steht als Satz darunter, statt eine
 * Nachkommastelle Genauigkeit vorzutäuschen.
 */
import { useState } from "react";
import { Flame } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import {
  eveningsFromStock,
  firewoodEstimate,
  type FireKind,
  type WoodType,
} from "@shared/firewood";

const KINDS: FireKind[] = [
  "kochfeuer",
  "feuerschale",
  "lagerfeuer",
  "waermefeuer",
];
const WOODS: WoodType[] = ["hart", "gemischt", "weich"];

export default function FirewoodCalculator({
  className,
}: {
  className?: string;
}) {
  const { t } = useI18n();
  const fw = t.firewood;
  const [evenings, setEvenings] = useState(3);
  const [hours, setHours] = useState(3);
  const [kind, setKind] = useState<FireKind>("lagerfeuer");
  const [wood, setWood] = useState<WoodType>("gemischt");
  const [stock, setStock] = useState("");

  const estimate = firewoodEstimate({
    evenings,
    hoursPerEvening: hours,
    kind,
    wood,
  });
  const stockKg = Number(stock.replace(",", "."));
  const stockEvenings =
    Number.isFinite(stockKg) && stockKg > 0
      ? eveningsFromStock({ stockKg, hoursPerEvening: hours, kind, wood })
      : null;

  return (
    <section className={cn("", className)} aria-label={fw.title}>
      <h2 className="mb-1 flex items-center gap-2 font-serif text-base font-semibold">
        <Flame className="h-4 w-4 text-primary" aria-hidden="true" />
        {fw.title}
      </h2>
      <p className="mb-3 text-sm text-muted-foreground">{fw.intro}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="firewood-evenings">{fw.eveningsLabel}</Label>
          <Input
            id="firewood-evenings"
            type="number"
            min={0}
            max={30}
            value={evenings}
            onChange={e => setEvenings(Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="firewood-hours">{fw.hoursLabel}</Label>
          <Input
            id="firewood-hours"
            type="number"
            min={0}
            max={12}
            step={0.5}
            value={hours}
            onChange={e => setHours(Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="firewood-kind">{fw.kindLabel}</Label>
          <select
            id="firewood-kind"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={kind}
            onChange={e => setKind(e.target.value as FireKind)}
          >
            {KINDS.map(key => (
              <option key={key} value={key}>
                {fw.kinds[key]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="firewood-wood">{fw.woodLabel}</Label>
          <select
            id="firewood-wood"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={wood}
            onChange={e => setWood(e.target.value as WoodType)}
          >
            {WOODS.map(key => (
              <option key={key} value={key}>
                {fw.woods[key]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-accent/50 px-3 py-2.5">
          <p className="font-mono text-lg font-bold leading-tight">
            {estimate.nets}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{fw.netsLabel}</p>
        </div>
        <div className="rounded-lg bg-accent/50 px-3 py-2.5">
          <p className="font-mono text-lg font-bold leading-tight">
            {estimate.totalKg} kg
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {fw.totalLabel}
          </p>
        </div>
        <div className="rounded-lg bg-accent/50 px-3 py-2.5">
          <p className="font-mono text-lg font-bold leading-tight">
            {estimate.kgPerEvening} kg
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {fw.perEveningLabel}
          </p>
        </div>
      </div>

      <p className="mt-2 text-sm">{fw.kindlingLine(estimate.kindlingKg)}</p>

      {/* Umgekehrte Frage: Der Vorrat steht da, reicht er noch? */}
      <div className="mt-3">
        <Label htmlFor="firewood-stock">{fw.stockLabel}</Label>
        <Input
          id="firewood-stock"
          inputMode="decimal"
          placeholder={fw.stockPlaceholder}
          value={stock}
          onChange={e => setStock(e.target.value)}
        />
        {stockEvenings !== null && (
          <p className="mt-1 text-sm">{fw.stockLine(stockEvenings)}</p>
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">{fw.note}</p>
    </section>
  );
}
