/**
 * Regentag-Ideen (#290): der Filter für den Moment, in dem einem nichts
 * einfällt.
 *
 * Bewusst KEINE Liste zum Blättern. Drei Regler – Alter, Zeit, Platz –
 * und darunter steht, was geht. Die Auswahl merkt sich das Gerät, damit
 * man am nächsten Regentag nicht wieder alles einstellt.
 */
import { useEffect, useMemo, useState } from "react";
import { CloudRain, Clock, Package, Volume2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/i18n";
import { pick } from "@shared/i18n";
import {
  SPACES,
  SPACE_LABELS,
  neededMaterials,
  rainyDayIdeas,
  type Space,
} from "@shared/rainyDay";
import { cn } from "@/lib/utils";

const STORE_KEY = "campmesser.rainyDay";

interface Stored {
  age: number | null;
  minutes: number;
  space: Space;
  quietOnly: boolean;
  together: boolean;
}

const DEFAULTS: Stored = {
  age: 8,
  minutes: 45,
  space: "vorzelt",
  quietOnly: false,
  together: true,
};

function load(): Stored {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Stored>;
    return {
      age:
        typeof parsed.age === "number"
          ? parsed.age
          : parsed.age === null
            ? null
            : DEFAULTS.age,
      minutes:
        typeof parsed.minutes === "number" ? parsed.minutes : DEFAULTS.minutes,
      space: SPACES.includes(parsed.space as Space)
        ? (parsed.space as Space)
        : DEFAULTS.space,
      quietOnly: parsed.quietOnly === true,
      together: parsed.together !== false,
    };
  } catch {
    return DEFAULTS;
  }
}

export default function RainyDayPage() {
  const { lang, t } = useI18n();
  const rd = t.rainyDay;
  const [state, setState] = useState<Stored>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch {
      /* Sitzung reicht */
    }
  }, [state]);

  const ideas = useMemo(
    () =>
      rainyDayIdeas({
        age: state.age,
        minutes: state.minutes,
        space: state.space,
        quietOnly: state.quietOnly,
        together: state.together,
      }),
    [state]
  );
  const materials = useMemo(() => neededMaterials(ideas), [ideas]);

  return (
    <div className="container max-w-2xl py-6">
      <PageHeader title={rd.title} subtitle={rd.intro} />

      {/* Platz zuerst: er entscheidet am meisten */}
      <div
        role="group"
        aria-label={rd.spaceLabel}
        className="mb-4 flex items-center rounded-full bg-muted p-0.5"
      >
        {SPACES.map(space => (
          <button
            key={space}
            type="button"
            onClick={() => setState(s => ({ ...s, space }))}
            aria-pressed={state.space === space}
            className={cn(
              "flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              state.space === space
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {pick(SPACE_LABELS[space], lang)}
          </button>
        ))}
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-card p-4">
        <div>
          <Label htmlFor="rainy-age" className="flex items-center gap-2">
            {rd.ageLabel}
            <span className="text-sm font-normal text-muted-foreground">
              {state.age === null ? rd.ageAny : rd.ageYears(state.age)}
            </span>
          </Label>
          <Slider
            id="rainy-age"
            className="mt-2"
            min={2}
            max={16}
            step={1}
            value={[state.age ?? 8]}
            onValueChange={([age]) => setState(s => ({ ...s, age }))}
          />
          <button
            type="button"
            onClick={() =>
              setState(s => ({ ...s, age: s.age === null ? 8 : null }))
            }
            className="mt-1 text-xs font-medium text-primary hover:underline"
          >
            {state.age === null ? rd.ageUse : rd.ageIgnore}
          </button>
        </div>

        <div>
          <Label htmlFor="rainy-minutes" className="flex items-center gap-2">
            <Clock
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            {rd.minutesLabel}
            <span className="text-sm font-normal text-muted-foreground">
              {rd.minutesValue(state.minutes)}
            </span>
          </Label>
          <Slider
            id="rainy-minutes"
            className="mt-2"
            min={10}
            max={120}
            step={5}
            value={[state.minutes]}
            onValueChange={([minutes]) => setState(s => ({ ...s, minutes }))}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="rainy-quiet" className="flex items-center gap-2">
            <Volume2
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            {rd.quietLabel}
          </Label>
          <Switch
            id="rainy-quiet"
            checked={state.quietOnly}
            onCheckedChange={quietOnly => setState(s => ({ ...s, quietOnly }))}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="rainy-together">{rd.togetherLabel}</Label>
          <Switch
            id="rainy-together"
            checked={state.together}
            onCheckedChange={together => setState(s => ({ ...s, together }))}
          />
        </div>
      </div>

      <p className="mt-4 text-sm font-medium">{rd.resultCount(ideas.length)}</p>

      {ideas.length === 0 ? (
        <p className="mt-2 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {rd.empty}
        </p>
      ) : (
        <ul className="mt-2 space-y-3">
          {ideas.map(idea => (
            <li
              key={idea.id}
              className="rounded-lg border border-border/70 bg-background p-3"
            >
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <CloudRain
                  className="h-4 w-4 shrink-0 self-center text-primary"
                  aria-hidden="true"
                />
                <span className="font-medium">{pick(idea.title, lang)}</span>
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                  {rd.minutesValue(idea.minutes)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {rd.ageRange(idea.minAge, idea.maxAge)}
                </span>
                {idea.quiet && (
                  <span className="text-xs text-muted-foreground">
                    · {rd.quietBadge}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {pick(idea.how, lang)}
              </p>
              {idea.needs.length > 0 && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {rd.needsLabel}:{" "}
                  </span>
                  {idea.needs.map(need => pick(need, lang)).join(", ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {materials.length > 0 && (
        <div className="mt-6 rounded-xl border border-border bg-card p-4">
          <h2 className="flex items-center gap-2 font-serif text-base font-semibold">
            <Package className="h-4 w-4 text-primary" aria-hidden="true" />
            {rd.materialsTitle}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {materials.map(m => pick(m, lang)).join(" · ")}
          </p>
        </div>
      )}

      <p className="mt-6 text-xs text-muted-foreground">{rd.note}</p>
    </div>
  );
}
