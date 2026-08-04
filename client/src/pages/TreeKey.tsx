/**
 * Bestimmungsschlüssel für Bäume (#293): Frage für Frage zur Art.
 *
 * Eine Frage pro Bildschirm, zwei grosse Knöpfe – mehr passt nicht in
 * eine Hand, die gleichzeitig einen Zweig hält. Der Weg bleibt oben
 * stehen: Jede beantwortete Frage ist anklickbar, damit man von dort aus
 * neu abbiegen kann, statt von vorne anzufangen.
 *
 * Der Zustand ist eine Liste von Antwort-Nummern. Zurück heisst: die
 * letzte Zahl wegnehmen. Deshalb braucht es hier keine Zustandsmaschine.
 */
import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Check,
  Eye,
  RotateCcw,
  TreePine,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { pick } from "@shared/i18n";
import { walkTreeKey } from "@shared/treeKey";

export default function TreeKeyPage() {
  const { lang, t } = useI18n();
  const tk = t.treeKey;
  const [answers, setAnswers] = useState<number[]>([]);

  const walk = useMemo(() => walkTreeKey(answers), [answers]);
  const current = walk.current;
  const species = walk.species;

  const choose = (index: number) => setAnswers(prev => prev.concat(index));
  const back = () => setAnswers(prev => prev.slice(0, -1));
  const restart = () => setAnswers([]);

  return (
    <div className="container max-w-2xl py-6">
      <PageHeader title={tk.title} subtitle={tk.intro} />

      {/* Der Weg bisher – jeder Schritt führt dorthin zurück */}
      {walk.trail.length > 0 && (
        <ol className="mb-4 flex flex-wrap items-center gap-1.5 text-xs">
          {walk.trail.map((step, i) => (
            <li key={step.question.id}>
              <button
                type="button"
                onClick={() => setAnswers(prev => prev.slice(0, i))}
                className="rounded-full border border-border bg-muted px-2.5 py-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                {pick(step.answer.label, lang)}
              </button>
            </li>
          ))}
        </ol>
      )}

      {current && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {tk.step(walk.trail.length + 1)}
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            {pick(current.question, lang)}
          </h2>
          <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
            <Eye className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {pick(current.look, lang)}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {current.answers.map((answer, index) => (
              <button
                key={`${current.id}-${index}`}
                type="button"
                onClick={() => choose(index)}
                className="rounded-lg border-2 border-border bg-background p-3 text-left transition-colors hover:border-primary hover:bg-accent/40"
              >
                <span className="block font-medium">
                  {pick(answer.label, lang)}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {pick(answer.hint, lang)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {species && (
        <div className="rounded-xl border-2 border-primary/40 bg-accent/30 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {tk.resultLabel}
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-semibold">
            <TreePine className="h-5 w-5 text-primary" aria-hidden="true" />
            {pick(species.name, lang)}
          </h2>
          <p className="text-sm italic text-muted-foreground">
            {species.latin}
          </p>

          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="flex items-center gap-2 font-medium">
                <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                {tk.markLabel}
              </dt>
              <dd className="mt-0.5 text-muted-foreground">
                {pick(species.mark, lang)}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 font-medium">
                <Eye className="h-4 w-4 text-primary" aria-hidden="true" />
                {tk.checkLabel}
              </dt>
              <dd className="mt-0.5 text-muted-foreground">
                {pick(species.check, lang)}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 font-medium">
                <AlertTriangle
                  className="h-4 w-4 text-primary"
                  aria-hidden="true"
                />
                {tk.confusionLabel}
              </dt>
              <dd className="mt-0.5 text-muted-foreground">
                {pick(species.confusion, lang)}
              </dd>
            </div>
          </dl>

          <Button asChild variant="outline" className="mt-4 w-full">
            <Link href="/natur">
              <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />
              {tk.toLexicon}
            </Link>
          </Button>
        </div>
      )}

      {walk.trail.length > 0 && (
        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={back}>
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            {tk.back}
          </Button>
          <Button variant="outline" className="flex-1" onClick={restart}>
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
            {tk.restart}
          </Button>
        </div>
      )}

      <p className="mt-6 text-xs text-muted-foreground">{tk.note}</p>
    </div>
  );
}
