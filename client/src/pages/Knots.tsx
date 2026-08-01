import { useState } from "react";
import {
  BadgeCheck,
  Cable,
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
import { knots, type Knot } from "@/data/knots";
import { buildKnotQuiz, type KnotQuizQuestion } from "@/lib/knotQuiz";
import { cn } from "@/lib/utils";

/** Übungsmodus: «Welcher Knoten passt zur Situation?» als Karteikarten-Quiz. */
function KnotQuizDialog({ onClose }: { onClose: () => void }) {
  const [questions, setQuestions] = useState<KnotQuizQuestion[]>(() =>
    buildKnotQuiz(knots, 8)
  );
  const [current, setCurrent] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = questions[current];

  const restart = () => {
    setQuestions(buildKnotQuiz(knots, 8));
    setCurrent(0);
    setAnswered(null);
    setScore(0);
    setFinished(false);
  };

  return (
    <DialogContent className="max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="font-serif text-xl">Knoten-Quiz</DialogTitle>
        <DialogDescription>
          Welcher Knoten passt zur Situation? Übe, bis die Griffe sitzen.
        </DialogDescription>
      </DialogHeader>

      {finished ? (
        <div className="space-y-4 text-center">
          <Trophy
            className="mx-auto h-12 w-12 text-chart-1"
            aria-hidden="true"
          />
          <p className="font-serif text-2xl font-bold">
            {score} von {questions.length} richtig!
          </p>
          <p className="text-sm text-muted-foreground">
            {score === questions.length
              ? "Knoten-Profi! Jetzt fehlt nur noch die Übung mit echtem Seil."
              : score >= questions.length / 2
                ? "Solide! Schau dir die verpassten Knoten in der Bibliothek nochmal an."
                : "Kein Problem – die Bibliothek unten erklärt jeden Knoten Schritt für Schritt."}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={restart}>
              <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Neue Runde
            </Button>
            <Button className="flex-1" onClick={onClose}>
              Fertig
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Frage {current + 1} von {questions.length}
            </span>
            <span>{score} Punkte</span>
          </div>
          <Progress
            value={(current / questions.length) * 100}
            aria-label="Quiz-Fortschritt"
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
                    if (idx === question.correctIndex) setScore(s => s + 1);
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
                  aria-label={`Antwort: ${option}`}
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
                  ? "Ergebnis anzeigen"
                  : "Nächste Frage"}
              </Button>
            </>
          )}
        </div>
      )}
    </DialogContent>
  );
}

const categories = [
  "Alle",
  "Befestigen",
  "Spannen",
  "Verbinden",
  "Schlaufen",
] as const;

function DifficultyDots({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span
      className="flex items-center gap-1"
      aria-label={`Schwierigkeit ${level} von 3`}
    >
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
  const [category, setCategory] = useState<(typeof categories)[number]>("Alle");
  const [selected, setSelected] = useState<Knot | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);

  const filtered =
    category === "Alle" ? knots : knots.filter(k => k.category === category);

  return (
    <div className="container py-6">
      <PageHeader
        title="Knoten-Bibliothek"
        subtitle="Die wichtigsten Outdoor-Knoten mit Schritt-für-Schritt-Anleitungen – offline verfügbar."
      />

      <div className="mb-4 flex items-center gap-2 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        Alle Anleitungen sind in der App gespeichert und ohne Internetverbindung
        nutzbar.
      </div>

      {/* Übungsmodus */}
      <button
        type="button"
        onClick={() => setQuizOpen(true)}
        className="mb-6 flex w-full items-center gap-4 rounded-xl border border-primary/40 bg-accent/40 p-4 text-left transition-all hover:border-primary hover:shadow-md active:scale-[0.99]"
        aria-label="Knoten-Quiz starten"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCap className="h-5.5 w-5.5" aria-hidden="true" />
        </span>
        <span>
          <span className="block font-semibold">Knoten-Quiz</span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            8 Situationen, 4 Antworten – welcher Knoten ist der richtige?
          </span>
        </span>
      </button>

      <div
        className="mb-6 flex flex-wrap gap-2"
        role="group"
        aria-label="Nach Kategorie filtern"
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
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(knot => (
          <button
            key={knot.id}
            type="button"
            onClick={() => setSelected(knot)}
            className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.99]"
            aria-label={`Anleitung für ${knot.name} öffnen`}
          >
            {knot.image && (
              <img
                src={knot.image}
                alt={`Schritt-für-Schritt-Anleitung: ${knot.name}`}
                loading="lazy"
                className="aspect-[4/3] w-full rounded-lg border border-border/60 object-cover"
              />
            )}
            <div className="flex w-full items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Cable className="h-5 w-5" aria-hidden="true" />
              </span>
              <DifficultyDots level={knot.difficulty} />
            </div>
            <div>
              <p className="font-semibold">{knot.name}</p>
              {knot.altName && (
                <p className="text-xs text-muted-foreground">
                  auch: {knot.altName}
                </p>
              )}
            </div>
            <Badge variant="secondary">{knot.category}</Badge>
            <p className="text-sm text-muted-foreground">{knot.useCase}</p>
          </button>
        ))}
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
                  {selected.name}
                  {selected.altName && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({selected.altName})
                    </span>
                  )}
                </DialogTitle>
                <DialogDescription>{selected.useCase}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {selected.image && (
                  <img
                    src={selected.image}
                    alt={`Schritt-für-Schritt-Bild: ${selected.name} binden`}
                    loading="lazy"
                    className="w-full rounded-lg border border-border/60"
                  />
                )}
                <div className="rounded-lg bg-accent/60 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Beim Camping
                  </p>
                  <p className="mt-1 text-sm">{selected.campingUse}</p>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Schritt für Schritt
                  </h3>
                  <ol className="space-y-2.5">
                    {selected.steps.map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          {i + 1}
                        </span>
                        <p className="text-sm">{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="rounded-lg border border-border bg-muted/50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Profi-Tipp
                  </p>
                  <p className="mt-1 text-sm">{selected.proTip}</p>
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
        {quizOpen && <KnotQuizDialog onClose={() => setQuizOpen(false)} />}
      </Dialog>
    </div>
  );
}
