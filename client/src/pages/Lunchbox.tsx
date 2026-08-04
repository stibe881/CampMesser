/**
 * Znüni- & Lunchbox-Planer (#289): was für den Ausflug in den Rucksack.
 *
 * Die ganze Entscheidungslogik steckt in `shared/lunchbox.ts` – hier
 * stehen nur die Regler und die Ausgabe. Die Vorschläge lassen sich in
 * einem Zug auf die Einkaufsliste schieben; das ist der eigentliche Sinn
 * der Sache, denn geplant wird am Vorabend und eingekauft am Morgen.
 */
import { useMemo, useState } from "react";
import { Backpack, Droplets, ShoppingCart, Sandwich } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { pick } from "@shared/i18n";
import {
  BOTTLE_ML,
  EFFORTS,
  TRIP_LENGTHS,
  lunchboxPlan,
  type Effort,
  type LunchboxItemPlan,
  type TripLength,
} from "@shared/lunchbox";

const LENGTHS = Object.keys(TRIP_LENGTHS) as TripLength[];
const EFFORT_KEYS = Object.keys(EFFORTS) as Effort[];

/** Zahl aus einem Feld lesen, ohne bei leerer Eingabe NaN zu erzeugen. */
function toCount(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.min(20, Math.round(n)) : 0;
}

export default function LunchboxPage() {
  const { lang, t } = useI18n();
  const lb = t.lunchbox;
  const { isAuthenticated } = useAuth();
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("2");
  const [length, setLength] = useState<TripLength>("ganztag");
  const [effort, setEffort] = useState<Effort>("wandern");
  const [temperature, setTemperature] = useState("20");
  const [coolPack, setCoolPack] = useState(true);

  const plan = useMemo(
    () =>
      lunchboxPlan({
        adults: toCount(adults),
        children: toCount(children),
        length,
        effort,
        temperatureC: Number(temperature) || 0,
        coolPack,
      }),
    [adults, children, length, effort, temperature, coolPack]
  );

  const utils = trpc.useUtils();
  const addToShopping = trpc.shopping.addMany.useMutation({
    onSuccess: () => {
      toast.success(lb.addedToList);
      void utils.shopping.invalidate();
    },
    onError: () => toast.error(t.common.saveFailed),
  });

  /** Beide Mahlzeiten zusammen auf die Einkaufsliste. */
  const addAll = () => {
    const names = [...plan.znueni, ...plan.mittag].map(entry => ({
      name: `${entry.portions}× ${pick(entry.item.name, lang)}`.slice(0, 160),
      note: lb.fromPlanner.slice(0, 160),
    }));
    if (names.length === 0) {
      toast.error(lb.nothingToAdd);
      return;
    }
    addToShopping.mutate({ names });
  };

  const Section = ({
    title,
    items,
  }: {
    title: string;
    items: LunchboxItemPlan[];
  }) => {
    if (items.length === 0) return null;
    return (
      <div className="mt-4">
        <h2 className="mb-2 font-serif text-base font-semibold">{title}</h2>
        <ul className="space-y-1.5">
          {items.map(entry => (
            <li
              key={entry.item.id}
              className="flex items-baseline justify-between gap-3 rounded-lg border border-border/70 bg-background px-3 py-2"
            >
              <span>{pick(entry.item.name, lang)}</span>
              <span className="shrink-0 text-sm text-muted-foreground">
                {lb.portions(entry.portions)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="container max-w-2xl py-6">
      <PageHeader title={lb.title} subtitle={lb.intro} />

      {/* Eingaben */}
      <Card>
        <CardContent className="grid gap-3 pt-6 sm:grid-cols-2">
          <div>
            <Label htmlFor="lunchbox-adults">{lb.adultsLabel}</Label>
            <Input
              id="lunchbox-adults"
              type="number"
              min={0}
              max={20}
              value={adults}
              onChange={e => setAdults(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="lunchbox-children">{lb.childrenLabel}</Label>
            <Input
              id="lunchbox-children"
              type="number"
              min={0}
              max={20}
              value={children}
              onChange={e => setChildren(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="lunchbox-length">{lb.lengthLabel}</Label>
            <select
              id="lunchbox-length"
              value={length}
              onChange={e => setLength(e.target.value as TripLength)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {LENGTHS.map(key => (
                <option key={key} value={key}>
                  {lb.length[key]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="lunchbox-effort">{lb.effortLabel}</Label>
            <select
              id="lunchbox-effort"
              value={effort}
              onChange={e => setEffort(e.target.value as Effort)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {EFFORT_KEYS.map(key => (
                <option key={key} value={key}>
                  {lb.effort[key]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="lunchbox-temp">{lb.temperatureLabel}</Label>
            <Input
              id="lunchbox-temp"
              type="number"
              min={-20}
              max={45}
              value={temperature}
              onChange={e => setTemperature(e.target.value)}
            />
          </div>
          <div className="flex items-end justify-between gap-3 pb-1">
            <Label htmlFor="lunchbox-cool" className="leading-tight">
              {lb.coolPackLabel}
            </Label>
            <Switch
              id="lunchbox-cool"
              checked={coolPack}
              onCheckedChange={setCoolPack}
            />
          </div>
        </CardContent>
      </Card>

      {/* Trinken zuerst – daran scheitert der Tag am ehesten */}
      <Card className="mt-6 border-primary/40 bg-accent/40">
        <CardContent className="pt-6 text-center">
          <Droplets
            className="mx-auto mb-2 h-8 w-8 text-chart-5"
            aria-hidden="true"
          />
          <p className="font-serif text-4xl font-bold text-primary">
            {lb.bottles(plan.bottles)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {lb.waterHint(Math.round(plan.waterMl / 100) / 10, BOTTLE_ML)}
          </p>
        </CardContent>
      </Card>

      <Section title={lb.znueniTitle} items={plan.znueni} />
      <Section title={lb.mittagTitle} items={plan.mittag} />

      {/* Nicht vergessen */}
      <div className="mt-6">
        <h2 className="mb-2 flex items-center gap-2 font-serif text-base font-semibold">
          <Backpack className="h-4 w-4 text-primary" aria-hidden="true" />
          {lb.remindersTitle}
        </h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          {plan.reminders.map((reminder, index) => (
            <li key={index}>{pick(reminder, lang)}</li>
          ))}
        </ul>
      </div>

      {isAuthenticated && (
        <Button
          className="mt-6 w-full"
          onClick={addAll}
          disabled={addToShopping.isPending}
        >
          <ShoppingCart className="mr-2 h-4 w-4" aria-hidden="true" />
          {lb.addToList}
        </Button>
      )}

      <p className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
        <Sandwich className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        {lb.note}
      </p>
    </div>
  );
}
