/**
 * Notfall-Übung für Kinder (#291).
 *
 * Der Ablauf ist bewusst: erst LESEN, dann DURCHSPIELEN, dann die
 * KONTROLLFRAGE – und erst danach lässt sich «geübt» setzen. Wer nur
 * abhakt, hat nichts geübt; deshalb schaltet der Knopf erst frei, wenn
 * die Frage richtig beantwortet ist.
 *
 * GESPEICHERT WIRD NUR DAS DATUM je Übung, auf dem Gerät. Keine Namen,
 * keine Nummern: Was ein Kind auswendig können muss, übt man mit ihm,
 * statt es in einer App zu hinterlegen.
 */
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  CircleCheck,
  ShieldQuestion,
  X,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useI18n } from "@/i18n";
import { LOCALE_TAGS, pick } from "@shared/i18n";
import {
  drillDue,
  drillsForAge,
  dueCount,
  type DrillScenario,
} from "@shared/emergencyDrill";
import { cn } from "@/lib/utils";

const AGE_KEY = "campmesser.drillAge";
const DONE_KEY = "campmesser.drillDone";

/** Zeitstempel je Übungs-Id. */
type DoneMap = Record<string, number | undefined>;

function loadDone(): DoneMap {
  try {
    const raw = localStorage.getItem(DONE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const result: DoneMap = {};
    Object.entries(parsed as Record<string, unknown>).forEach(([id, at]) => {
      if (typeof at === "number" && Number.isFinite(at)) result[id] = at;
    });
    return result;
  } catch {
    return {};
  }
}

function loadAge(): number {
  try {
    const raw = Number(localStorage.getItem(AGE_KEY));
    return Number.isFinite(raw) && raw >= 3 && raw <= 14 ? raw : 7;
  } catch {
    return 7;
  }
}

function Scenario({
  scenario,
  lastAt,
  onDone,
}: {
  scenario: DrillScenario;
  lastAt: number | null;
  onDone: () => void;
}) {
  const { lang, t } = useI18n();
  const ed = t.drill;
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const due = drillDue(lastAt, Date.now());
  const correct = picked === scenario.correct;

  return (
    <li className="rounded-lg border border-border/70 bg-background">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 p-3 text-left"
      >
        {due ? (
          <AlertTriangle
            className="h-4 w-4 shrink-0 text-amber-600"
            aria-hidden="true"
          />
        ) : (
          <CircleCheck
            className="h-4 w-4 shrink-0 text-primary"
            aria-hidden="true"
          />
        )}
        <span className="min-w-0 flex-1">
          <span className="block font-medium">
            {pick(scenario.title, lang)}
          </span>
          <span className="block text-xs text-muted-foreground">
            {lastAt
              ? ed.lastPracticed(
                  new Date(lastAt).toLocaleDateString(LOCALE_TAGS[lang])
                )
              : ed.neverPracticed}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="space-y-4 border-t border-border/60 p-3">
          <p className="text-sm text-muted-foreground">
            {pick(scenario.situation, lang)}
          </p>

          <div>
            <h3 className="text-sm font-semibold">{ed.stepsTitle}</h3>
            <ol className="mt-1 list-inside list-decimal space-y-1 text-sm">
              {scenario.steps.map((step, i) => (
                <li key={i}>{pick(step, lang)}</li>
              ))}
            </ol>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{ed.mistakesTitle}</h3>
            <ul className="mt-1 space-y-1 text-sm">
              {scenario.mistakes.map((m, i) => (
                <li key={i} className="flex gap-2">
                  <X
                    className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                    aria-hidden="true"
                  />
                  <span>{pick(m, lang)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg bg-accent/50 p-3">
            <h3 className="text-sm font-semibold">{ed.practiceTitle}</h3>
            <p className="mt-1 text-sm">{pick(scenario.practice, lang)}</p>
          </div>

          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <ShieldQuestion
                className="h-4 w-4 text-primary"
                aria-hidden="true"
              />
              {ed.questionTitle}
            </h3>
            <p className="mt-1 text-sm">{pick(scenario.question, lang)}</p>
            <div className="mt-2 space-y-2">
              {scenario.answers.map((answer, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPicked(i)}
                  className={cn(
                    "block w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
                    picked === null
                      ? "border-border hover:bg-accent"
                      : i === scenario.correct
                        ? "border-primary bg-primary/10 font-medium"
                        : picked === i
                          ? "border-destructive bg-destructive/10"
                          : "border-border opacity-60"
                  )}
                >
                  {pick(answer, lang)}
                </button>
              ))}
            </div>
            {picked !== null && (
              <p className="mt-2 text-sm text-muted-foreground">
                <span
                  className={cn(
                    "font-medium",
                    correct ? "text-primary" : "text-destructive"
                  )}
                >
                  {correct ? ed.right : ed.wrong}{" "}
                </span>
                {pick(scenario.explain, lang)}
              </p>
            )}
          </div>

          <Button className="w-full" onClick={onDone} disabled={!correct}>
            <Check className="mr-2 h-4 w-4" aria-hidden="true" />
            {ed.markDone}
          </Button>
          {!correct && (
            <p className="text-xs text-muted-foreground">{ed.answerFirst}</p>
          )}
        </div>
      )}
    </li>
  );
}

export default function EmergencyDrillPage() {
  const { t } = useI18n();
  const ed = t.drill;
  const [age, setAge] = useState(loadAge);
  const [done, setDone] = useState<DoneMap>(loadDone);

  useEffect(() => {
    try {
      localStorage.setItem(AGE_KEY, String(age));
    } catch {
      /* Sitzung reicht */
    }
  }, [age]);

  useEffect(() => {
    try {
      localStorage.setItem(DONE_KEY, JSON.stringify(done));
    } catch {
      /* Sitzung reicht */
    }
  }, [done]);

  const scenarios = useMemo(() => drillsForAge(age), [age]);
  const open = dueCount(scenarios, done, Date.now());

  return (
    <div className="container max-w-2xl py-6">
      <PageHeader title={ed.title} subtitle={ed.intro} />

      <div className="rounded-xl border border-border bg-card p-4">
        <Label htmlFor="drill-age" className="flex items-center gap-2">
          {ed.ageLabel}
          <span className="text-sm font-normal text-muted-foreground">
            {ed.ageYears(age)}
          </span>
        </Label>
        <Slider
          id="drill-age"
          className="mt-2"
          min={3}
          max={14}
          step={1}
          value={[age]}
          onValueChange={([next]) => setAge(next)}
        />
      </div>

      <p className="mt-4 text-sm font-medium">
        {open === 0 ? ed.allDone : ed.openCount(open)}
      </p>

      <ul className="mt-2 space-y-3">
        {scenarios.map(scenario => (
          <Scenario
            key={scenario.id}
            scenario={scenario}
            lastAt={done[scenario.id] ?? null}
            onDone={() =>
              setDone(current => ({ ...current, [scenario.id]: Date.now() }))
            }
          />
        ))}
      </ul>

      <p className="mt-6 text-xs text-muted-foreground">{ed.note}</p>
    </div>
  );
}
