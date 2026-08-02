import { useRef, useState } from "react";
import {
  BadgeCheck,
  Cable,
  Check,
  GraduationCap,
  RotateCcw,
  Trophy,
  WifiOff,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  knotCategoryLabels,
  knots,
  type Knot,
  type KnotCategory,
} from "@/data/knots";
import { useI18n } from "@/i18n";
import { buildKnotQuiz, type KnotQuizQuestion } from "@/lib/knotQuiz";
import {
  loadKnotProgress,
  masteryLevel,
  recordAnswer,
  sanitizeKnotProgress,
  storeKnotProgress,
  type KnotProgress,
  type MasteryLevel,
} from "@/lib/knotProgress";
import { useSyncedSetting } from "@/lib/useSyncedSetting";
import { cn } from "@/lib/utils";
import { pick } from "@shared/i18n";

/** Beherrschungs-Badge eines Knotens: sicher = grün mit Häkchen, üben = amber. */
function MasteryBadge({
  level,
  label,
}: {
  level: MasteryLevel;
  label: string;
}) {
  if (level === "neu") return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        level === "sicher"
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-amber-600/40 bg-amber-500/15 text-amber-800 dark:text-amber-300"
      )}
    >
      {level === "sicher" && <Check className="h-3 w-3" aria-hidden="true" />}
      {label}
    </span>
  );
}

/** Übungsmodus: «Welcher Knoten passt zur Situation?» als Karteikarten-Quiz. */
function KnotQuizDialog({
  onClose,
  onAnswer,
  progress,
  onOpenKnot,
}: {
  onClose: () => void;
  /** Meldet jede beantwortete Frage (Knoten-Id, richtig/falsch) an die Statistik */
  onAnswer: (knotId: string, correct: boolean) => void;
  progress: KnotProgress;
  /** Quiz schliessen und die Anleitung des Knotens öffnen */
  onOpenKnot: (knotId: string) => void;
}) {
  const { lang, t } = useI18n();
  const [questions, setQuestions] = useState<KnotQuizQuestion[]>(() =>
    buildKnotQuiz(knots, 8, Math.random, lang)
  );
  const [current, setCurrent] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = questions[current];

  const restart = () => {
    setQuestions(buildKnotQuiz(knots, 8, Math.random, lang));
    setCurrent(0);
    setAnswered(null);
    setScore(0);
    setFinished(false);
  };

  return (
    <DialogContent className="max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="font-serif text-xl">
          {t.knots.quizTitle}
        </DialogTitle>
        <DialogDescription>{t.knots.quizDescription}</DialogDescription>
      </DialogHeader>

      {finished ? (
        <div className="space-y-4 text-center">
          <Trophy
            className="mx-auto h-12 w-12 text-chart-1"
            aria-hidden="true"
          />
          <p className="font-serif text-2xl font-bold">
            {t.knots.resultLine(score, questions.length)}
          </p>
          <p className="text-sm text-muted-foreground">
            {score === questions.length
              ? t.knots.resultPerfect
              : score >= questions.length / 2
                ? t.knots.resultGood
                : t.knots.resultTryAgain}
          </p>
          {(() => {
            // Auswertung: abgefragte Knoten, die noch nicht «sicher» sitzen
            const toPractice = questions
              .map(q => knots.find(k => k.id === q.knotId))
              .filter((k): k is Knot => Boolean(k))
              .filter(k => masteryLevel(progress, k.id) !== "sicher");
            if (toPractice.length === 0) {
              return (
                <p className="rounded-lg bg-accent/60 p-3 text-sm">
                  {t.knots.reviewAllSecure}
                </p>
              );
            }
            return (
              <div className="rounded-lg bg-muted p-3 text-left">
                <p className="text-sm font-semibold">{t.knots.reviewTitle}</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {toPractice.map(knot => {
                    const name = pick(knot.name, lang);
                    return (
                      <li key={knot.id}>
                        <button
                          type="button"
                          onClick={() => onOpenKnot(knot.id)}
                          className="rounded-full border border-amber-600/40 bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-800 hover:border-amber-600 dark:text-amber-300"
                          aria-label={t.knots.openAria(name)}
                        >
                          {name}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })()}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={restart}>
              <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.knots.newRound}
            </Button>
            <Button className="flex-1" onClick={onClose}>
              {t.knots.finish}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{t.knots.questionOf(current + 1, questions.length)}</span>
            <span>{t.knots.points(score)}</span>
          </div>
          <Progress
            value={(current / questions.length) * 100}
            aria-label={t.knots.quizProgressAria}
          />
          <p className="font-semibold">{question.prompt}</p>
          <div className="space-y-2">
            {question.options.map((option, idx) => {
              const isCorrect = idx === question.correctIndex;
              const isSelected = answered === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (answered !== null) return;
                    setAnswered(idx);
                    const correct = idx === question.correctIndex;
                    if (correct) setScore(s => s + 1);
                    onAnswer(question.knotId, correct);
                  }}
                  disabled={answered !== null}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left text-sm font-medium transition-all",
                    answered === null &&
                      "border-border bg-card hover:border-primary/50",
                    answered !== null &&
                      isCorrect &&
                      "border-primary bg-accent",
                    answered !== null &&
                      isSelected &&
                      !isCorrect &&
                      "border-destructive bg-destructive/10",
                    answered !== null &&
                      !isSelected &&
                      !isCorrect &&
                      "border-border opacity-60"
                  )}
                  aria-label={t.knots.answerAria(option)}
                >
                  {option}
                  {answered !== null && isCorrect && (
                    <BadgeCheck
                      className="ml-2 inline h-4 w-4 text-primary"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
          {answered !== null && (
            <>
              <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {question.knotName}:
                </span>{" "}
                {question.proTip}
              </p>
              <Button
                className="w-full"
                onClick={() => {
                  if (current + 1 >= questions.length) setFinished(true);
                  else {
                    setCurrent(c => c + 1);
                    setAnswered(null);
                  }
                }}
              >
                {current + 1 >= questions.length
                  ? t.knots.showResult
                  : t.knots.nextQuestion}
              </Button>
            </>
          )}
        </div>
      )}
    </DialogContent>
  );
}

const categories = [
  "alle",
  "befestigen",
  "spannen",
  "verbinden",
  "schlaufen",
] as const;

function DifficultyDots({ level, label }: { level: 1 | 2 | 3; label: string }) {
  return (
    <span className="flex items-center gap-1" aria-label={label}>
      {[1, 2, 3].map(i => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            i <= level ? "bg-primary" : "bg-border"
          )}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

export default function KnotsPage() {
  const { lang, t } = useI18n();
  const [category, setCategory] = useState<"alle" | KnotCategory>("alle");
  const [selected, setSelected] = useState<Knot | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [practiceOnly, setPracticeOnly] = useState(false);

  // Lernfortschritt: localStorage als schnelle Quelle, Geräte-Sync fürs Konto
  const [progress, setProgress] = useState<KnotProgress>(() =>
    loadKnotProgress()
  );
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const progressSync = useSyncedSetting<KnotProgress>("knotProgress", value => {
    const clean = sanitizeKnotProgress(value);
    setProgress(clean);
    storeKnotProgress(clean);
  });
  const handleAnswer = (knotId: string, correct: boolean) => {
    const next = recordAnswer(progressRef.current, knotId, correct);
    progressRef.current = next;
    setProgress(next);
    storeKnotProgress(next);
    progressSync.push(next);
  };

  const masteryLabels: Record<Exclude<MasteryLevel, "neu">, string> = {
    sicher: t.knots.masterySecure,
    üben: t.knots.masteryPractice,
  };

  const filtered = knots.filter(
    k =>
      (category === "alle" || k.category === category) &&
      (!practiceOnly || masteryLevel(progress, k.id) === "üben")
  );

  return (
    <div className="container py-6">
      <PageHeader title={t.knots.title} subtitle={t.knots.subtitle} />

      <div className="mb-4 flex items-center gap-2 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t.knots.offlineNote}
      </div>

      {/* Übungsmodus */}
      <button
        type="button"
        onClick={() => setQuizOpen(true)}
        className="mb-6 flex w-full items-center gap-4 rounded-xl border border-primary/40 bg-accent/40 p-4 text-left transition-all hover:border-primary hover:shadow-md active:scale-[0.99]"
        aria-label={t.knots.quizStartAria}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCap className="h-5.5 w-5.5" aria-hidden="true" />
        </span>
        <span>
          <span className="block font-semibold">{t.knots.quizTitle}</span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            {t.knots.quizTeaser}
          </span>
        </span>
      </button>

      <div
        className="mb-6 flex flex-wrap gap-2"
        role="group"
        aria-label={t.knots.filterAria}
      >
        {categories.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              category === c
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={category === c}
          >
            {c === "alle"
              ? t.knots.filterAll
              : pick(knotCategoryLabels[c], lang)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPracticeOnly(v => !v)}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
            practiceOnly
              ? "bg-amber-600 text-white dark:bg-amber-500 dark:text-black"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
          aria-pressed={practiceOnly}
          aria-label={t.knots.practiceFilterAria}
        >
          {t.knots.practiceFilter}
        </button>
      </div>

      {filtered.length === 0 && (
        <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
          {t.knots.practiceEmpty}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(knot => {
          const name = pick(knot.name, lang);
          const level = masteryLevel(progress, knot.id);
          return (
            <button
              key={knot.id}
              type="button"
              onClick={() => setSelected(knot)}
              className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.99]"
              aria-label={
                level === "neu"
                  ? t.knots.openAria(name)
                  : t.knots.openAriaLevel(name, masteryLabels[level])
              }
            >
              {knot.image && (
                <img
                  src={knot.image}
                  alt={t.knots.cardImageAlt(name)}
                  loading="lazy"
                  className="aspect-[4/3] w-full rounded-lg border border-border/60 object-cover"
                />
              )}
              <div className="flex w-full items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Cable className="h-5 w-5" aria-hidden="true" />
                </span>
                <DifficultyDots
                  level={knot.difficulty}
                  label={t.knots.difficultyAria(knot.difficulty)}
                />
              </div>
              <div>
                <p className="font-semibold">{name}</p>
                {knot.altName && (
                  <p className="text-xs text-muted-foreground">
                    {t.knots.alsoKnownAs(pick(knot.altName, lang))}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary">
                  {pick(knotCategoryLabels[knot.category], lang)}
                </Badge>
                {level !== "neu" && (
                  <MasteryBadge level={level} label={masteryLabels[level]} />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {pick(knot.useCase, lang)}
              </p>
            </button>
          );
        })}
      </div>

      <Dialog
        open={selected !== null}
        onOpenChange={open => !open && setSelected(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">
                  {pick(selected.name, lang)}
                  {selected.altName && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({pick(selected.altName, lang)})
                    </span>
                  )}
                </DialogTitle>
                <DialogDescription>
                  {pick(selected.useCase, lang)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {selected.image && (
                  <img
                    src={selected.image}
                    alt={t.knots.detailImageAlt(pick(selected.name, lang))}
                    loading="lazy"
                    className="w-full rounded-lg border border-border/60"
                  />
                )}
                <div className="rounded-lg bg-accent/60 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.knots.campingTitle}
                  </p>
                  <p className="mt-1 text-sm">
                    {pick(selected.campingUse, lang)}
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.knots.stepsTitle}
                  </h3>
                  <ol className="space-y-2.5">
                    {selected.steps.map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          {i + 1}
                        </span>
                        <p className="text-sm">{pick(step, lang)}</p>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="rounded-lg border border-border bg-muted/50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.knots.proTipTitle}
                  </p>
                  <p className="mt-1 text-sm">{pick(selected.proTip, lang)}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={quizOpen}
        onOpenChange={open => !open && setQuizOpen(false)}
      >
        {quizOpen && (
          <KnotQuizDialog
            onClose={() => setQuizOpen(false)}
            onAnswer={handleAnswer}
            progress={progress}
            onOpenKnot={knotId => {
              setQuizOpen(false);
              const knot = knots.find(k => k.id === knotId);
              if (knot) setSelected(knot);
            }}
          />
        )}
      </Dialog>
    </div>
  );
}
