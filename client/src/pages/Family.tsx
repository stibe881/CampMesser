import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  BadgeCheck,
  Compass as CompassIcon,
  Gift,
  Lightbulb,
  Map,
  PartyPopper,
  Pencil,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Trophy,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  natureQuizzes,
  scavengerHunts,
  type HuntStation,
  type NatureQuiz,
  type ScavengerHunt,
} from "@/data/familyActivities";
import { pick, type Language } from "@shared/i18n";
import { useI18n, useT } from "@/i18n";
import { MAX_STATIONS, parseHuntStations } from "@shared/hunts";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  customHuntToScavengerHunt,
  type CustomHuntRow,
} from "@/lib/customHunts";
import { cn } from "@/lib/utils";

/** Buchstabe einer Station in der aktiven Sprache ("" = keiner). */
const stationLetter = (station: HuntStation, lang: Language): string =>
  station.letter ? pick(station.letter, lang) : "";

/** Formular-Zustand einer Station im Editor. */
interface EditorStation {
  title: string;
  story: string;
  task: string;
  hint: string;
  letter: string;
}

const emptyStation = (title: string): EditorStation => ({
  title,
  story: "",
  task: "",
  hint: "",
  letter: "",
});

/** Editor für eigene Schnitzeljagden: erstellen und bearbeiten. */
function HuntEditorDialog({
  initial,
  onClose,
}: {
  initial: CustomHuntRow | null;
  onClose: () => void;
}) {
  const t = useT();
  const ed = t.family.editor;
  const utils = trpc.useUtils();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [ageHint, setAgeHint] = useState(initial?.ageHint ?? "");
  const [duration, setDuration] = useState(
    String(initial?.durationMinutes ?? 30)
  );
  const [intro, setIntro] = useState(initial?.intro ?? "");
  const [preparation, setPreparation] = useState(initial?.preparation ?? "");
  const [finale, setFinale] = useState(initial?.finale ?? "");
  const [stations, setStations] = useState<EditorStation[]>(() => {
    if (initial) {
      const parsed = parseHuntStations(initial.stationsJson);
      if (parsed.length > 0) {
        return parsed.map(s => ({
          title: s.title,
          story: s.story,
          task: s.task,
          hint: s.hint ?? "",
          letter: s.letter ?? "",
        }));
      }
    }
    return [emptyStation(ed.defaultStationTitle(1))];
  });

  const saveMutation = trpc.hunts.save.useMutation({
    onSuccess: () => {
      utils.hunts.list.invalidate();
      toast.success(initial ? ed.updated : ed.created);
      onClose();
    },
    onError: e => toast.error(e.message || t.common.saveFailed),
  });

  const updateStation = (index: number, patch: Partial<EditorStation>) =>
    setStations(prev =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );

  const solutionPreview = stations
    .map(s => s.letter.trim().slice(0, 1).toUpperCase())
    .filter(Boolean)
    .join("");

  const canSave =
    title.trim() &&
    intro.trim() &&
    finale.trim() &&
    stations.length > 0 &&
    stations.every(s => s.title.trim() && s.task.trim());

  return (
    <DialogContent className="max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="font-serif text-xl">
          {initial ? ed.titleEdit : ed.titleNew}
        </DialogTitle>
        <DialogDescription>{ed.description}</DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <div>
          <Label htmlFor="hunt-title">{ed.titleLabel}</Label>
          <Input
            id="hunt-title"
            className="mt-1.5"
            placeholder={ed.titlePlaceholder}
            value={title}
            maxLength={140}
            onChange={e => setTitle(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="hunt-age">{ed.ageLabel}</Label>
            <Input
              id="hunt-age"
              className="mt-1.5"
              placeholder={ed.agePlaceholder}
              value={ageHint}
              maxLength={80}
              onChange={e => setAgeHint(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="hunt-duration">{ed.durationLabel}</Label>
            <Input
              id="hunt-duration"
              className="mt-1.5"
              type="number"
              min={5}
              max={240}
              value={duration}
              onChange={e => setDuration(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="hunt-intro">{ed.introLabel}</Label>
          <Textarea
            id="hunt-intro"
            className="mt-1.5"
            rows={3}
            placeholder={ed.introPlaceholder}
            value={intro}
            onChange={e => setIntro(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="hunt-prep">{ed.prepLabel}</Label>
          <Textarea
            id="hunt-prep"
            className="mt-1.5"
            rows={2}
            placeholder={ed.prepPlaceholder}
            value={preparation}
            onChange={e => setPreparation(e.target.value)}
          />
        </div>

        {/* Stationen */}
        <div>
          <p className="mb-2 text-sm font-semibold">
            {ed.stationsTitle(stations.length)}
          </p>
          <div className="space-y-3">
            {stations.map((s, i) => (
              <div key={i} className="rounded-lg border border-border p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Input
                    value={s.title}
                    maxLength={140}
                    onChange={e => updateStation(i, { title: e.target.value })}
                    aria-label={ed.stationTitleAria(i + 1)}
                  />
                  <button
                    type="button"
                    disabled={stations.length <= 1}
                    onClick={() =>
                      setStations(prev => prev.filter((_, idx) => idx !== i))
                    }
                    className="shrink-0 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-30"
                    aria-label={ed.removeStationAria(i + 1)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <Textarea
                  className="mb-2"
                  rows={2}
                  placeholder={ed.storyPlaceholder}
                  value={s.story}
                  onChange={e => updateStation(i, { story: e.target.value })}
                  aria-label={ed.storyAria(i + 1)}
                />
                <Textarea
                  className="mb-2"
                  rows={2}
                  placeholder={ed.taskPlaceholder}
                  value={s.task}
                  onChange={e => updateStation(i, { task: e.target.value })}
                  aria-label={ed.taskAria(i + 1)}
                />
                <div className="grid grid-cols-[1fr_5rem] gap-2">
                  <Input
                    placeholder={ed.hintPlaceholder}
                    value={s.hint}
                    maxLength={500}
                    onChange={e => updateStation(i, { hint: e.target.value })}
                    aria-label={ed.hintAria(i + 1)}
                  />
                  <Input
                    placeholder={ed.letterPlaceholder}
                    value={s.letter}
                    maxLength={1}
                    onChange={e => updateStation(i, { letter: e.target.value })}
                    aria-label={ed.letterAria(i + 1)}
                  />
                </div>
              </div>
            ))}
          </div>
          {stations.length < MAX_STATIONS && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() =>
                setStations(prev => [
                  ...prev,
                  emptyStation(ed.defaultStationTitle(prev.length + 1)),
                ])
              }
            >
              <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              {ed.addStation}
            </Button>
          )}
          {solutionPreview && (
            <p className="mt-2 text-xs text-muted-foreground">
              {ed.solutionPreviewLabel}{" "}
              <span className="font-mono font-bold">{solutionPreview}</span>
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="hunt-finale">{ed.finaleLabel}</Label>
          <Textarea
            id="hunt-finale"
            className="mt-1.5"
            rows={2}
            placeholder={ed.finalePlaceholder}
            value={finale}
            onChange={e => setFinale(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button
            className="flex-1"
            disabled={!canSave || saveMutation.isPending}
            onClick={() =>
              saveMutation.mutate({
                id: initial?.id,
                title: title.trim(),
                ageHint: ageHint.trim() || null,
                durationMinutes: Math.min(
                  240,
                  Math.max(5, Number(duration) || 30)
                ),
                intro: intro.trim(),
                preparation: preparation.trim() || null,
                finale: finale.trim(),
                stations: stations.map(s => ({
                  title: s.title.trim(),
                  story: s.story.trim(),
                  task: s.task.trim(),
                  hint: s.hint.trim() || undefined,
                  letter: s.letter.trim() || undefined,
                })),
              })
            }
          >
            {saveMutation.isPending ? t.common.saving : t.common.save}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

/** Fortschritt der Schnitzeljagden wird lokal gespeichert – funktioniert offline. */
function useHuntProgress(huntId: string, taskCount: number) {
  const storageKey = `campmesser-hunt-${huntId}`;
  const [checked, setChecked] = useState<boolean[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as boolean[];
        if (Array.isArray(parsed) && parsed.length === taskCount) return parsed;
      }
    } catch {
      // ignorieren
    }
    return new Array(taskCount).fill(false);
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(checked));
    } catch {
      // ignorieren
    }
  }, [checked, storageKey]);

  return [checked, setChecked] as const;
}

function HuntDialog({
  hunt,
  onClose,
}: {
  hunt: ScavengerHunt;
  onClose: () => void;
}) {
  const { lang, t } = useI18n();
  const [checked, setChecked] = useHuntProgress(hunt.id, hunt.stations.length);
  const [revealedHints, setRevealedHints] = useState<Record<number, boolean>>(
    {}
  );
  const doneCount = checked.filter(Boolean).length;
  const allDone = doneCount === hunt.stations.length;
  // Die nächste offene Station – nur bis dahin wird die Geschichte enthüllt
  const nextOpenIndex = checked.findIndex(c => !c);
  const visibleCount =
    nextOpenIndex === -1 ? hunt.stations.length : nextOpenIndex + 1;
  // Stationen mit Buchstabe in der aktiven Sprache (Lösungswörter sind je Sprache nachgedichtet)
  const letterStationCount = hunt.stations.filter(
    s => stationLetter(s, lang) !== ""
  ).length;
  const collectedLetters = hunt.stations
    .map((s, i) => (checked[i] ? stationLetter(s, lang) : ""))
    .filter(l => l !== "");

  return (
    <DialogContent className="max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="font-serif text-xl">
          {pick(hunt.title, lang)}
        </DialogTitle>
        <DialogDescription>
          {pick(hunt.ageHint, lang)} ·{" "}
          {t.family.durationLong(hunt.durationMinutes)}
        </DialogDescription>
      </DialogHeader>
      <p className="rounded-lg bg-accent/60 p-3 text-sm italic text-accent-foreground">
        {pick(hunt.intro, lang)}
      </p>
      {hunt.preparation && (
        <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
          {pick(hunt.preparation, lang)}
        </p>
      )}
      <Progress
        value={(doneCount / hunt.stations.length) * 100}
        aria-label={t.family.progressAria(doneCount, hunt.stations.length)}
      />

      {/* Gesammelte Buchstaben (falls die Jagd ein Lösungswort hat) */}
      {hunt.solutionWord && letterStationCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2.5">
          <Sparkles
            className="h-4 w-4 shrink-0 text-primary"
            aria-hidden="true"
          />
          <span className="text-sm font-medium">
            {t.family.collectedLetters}
          </span>
          <span className="flex gap-1.5">
            {Array.from({ length: letterStationCount }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md border font-mono text-sm font-bold",
                  collectedLetters.length > i
                    ? "border-primary bg-accent text-primary"
                    : "border-dashed border-border text-transparent"
                )}
              >
                {collectedLetters.length > i ? collectedLetters[i] : "?"}
              </span>
            ))}
          </span>
        </div>
      )}

      <ol className="space-y-3">
        {hunt.stations.slice(0, visibleCount).map((station, i) => {
          const letter = stationLetter(station, lang);
          const hint = station.hint ? pick(station.hint, lang) : "";
          return (
            <li
              key={i}
              className={cn(
                "rounded-xl border border-border bg-card p-4",
                checked[i] && "border-primary/30 bg-muted/50"
              )}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  id={`${hunt.id}-station-${i}`}
                  checked={checked[i]}
                  onCheckedChange={value =>
                    setChecked(prev =>
                      prev.map((c, idx) => (idx === i ? value === true : c))
                    )
                  }
                  className="mt-0.5"
                  aria-label={t.family.stationDoneAria(
                    pick(station.title, lang)
                  )}
                />
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor={`${hunt.id}-station-${i}`}
                    className={cn(
                      "cursor-pointer text-sm font-semibold",
                      checked[i] && "text-muted-foreground"
                    )}
                  >
                    {pick(station.title, lang)}
                    {letter && checked[i] && (
                      <span className="ml-2 rounded bg-accent px-1.5 py-0.5 font-mono text-xs font-bold text-primary">
                        {t.family.letterBadge(letter)}
                      </span>
                    )}
                  </label>
                  <p className="mt-1 text-xs italic text-muted-foreground">
                    {pick(station.story, lang)}
                  </p>
                  <p
                    className={cn(
                      "mt-1.5 text-sm",
                      checked[i] && "text-muted-foreground line-through"
                    )}
                  >
                    {pick(station.task, lang)}
                  </p>
                  {hint && !checked[i] && (
                    <div className="mt-2">
                      {revealedHints[i] ? (
                        <p className="flex items-start gap-1.5 rounded-md bg-muted p-2 text-xs text-muted-foreground">
                          <Lightbulb
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-chart-4"
                            aria-hidden="true"
                          />
                          {hint}
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setRevealedHints(prev => ({ ...prev, [i]: true }))
                          }
                          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          <Lightbulb
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                          {t.family.showHint}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {visibleCount < hunt.stations.length && (
        <p className="text-center text-xs text-muted-foreground">
          {t.family.secretStations(hunt.stations.length - visibleCount)}
        </p>
      )}

      {allDone && (
        <div className="space-y-3 rounded-xl bg-accent p-4">
          <div className="flex items-center gap-3">
            <PartyPopper
              className="h-6 w-6 shrink-0 text-primary"
              aria-hidden="true"
            />
            <p className="font-serif text-base font-bold">
              {hunt.solutionWord
                ? t.family.solutionWordLine(pick(hunt.solutionWord, lang))
                : t.family.allDone}
            </p>
          </div>
          <p className="flex items-start gap-2 text-sm">
            <Gift
              className="mt-0.5 h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            {pick(hunt.finale, lang)}
          </p>
        </div>
      )}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => {
            setChecked(new Array(hunt.stations.length).fill(false));
            setRevealedHints({});
          }}
          aria-label={t.family.resetAria}
        >
          <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {t.family.restart}
        </Button>
        <Button className="flex-1" onClick={onClose}>
          {t.family.done}
        </Button>
      </div>
    </DialogContent>
  );
}

function QuizDialog({
  quiz,
  onClose,
}: {
  quiz: NatureQuiz;
  onClose: () => void;
}) {
  const { lang, t } = useI18n();
  const [current, setCurrent] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = quiz.questions[current];

  const answer = (idx: number) => {
    if (answered !== null) return;
    setAnswered(idx);
    if (idx === question.correctIndex) setScore(s => s + 1);
  };

  const next = () => {
    if (current + 1 >= quiz.questions.length) {
      setFinished(true);
    } else {
      setCurrent(c => c + 1);
      setAnswered(null);
    }
  };

  const restart = () => {
    setCurrent(0);
    setAnswered(null);
    setScore(0);
    setFinished(false);
  };

  return (
    <DialogContent className="max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="font-serif text-xl">
          {pick(quiz.title, lang)}
        </DialogTitle>
        <DialogDescription>{pick(quiz.ageHint, lang)}</DialogDescription>
      </DialogHeader>

      {finished ? (
        <div className="space-y-4 text-center">
          <Trophy
            className="mx-auto h-12 w-12 text-amber-glow"
            aria-hidden="true"
          />
          <p className="font-serif text-2xl font-bold">
            {t.family.scoreLine(score, quiz.questions.length)}
          </p>
          <p className="text-sm text-muted-foreground">
            {score === quiz.questions.length
              ? t.family.verdictPerfect
              : score >= quiz.questions.length / 2
                ? t.family.verdictGood
                : t.family.verdictTryAgain}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={restart}>
              <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.family.again}
            </Button>
            <Button className="flex-1" onClick={onClose}>
              {t.family.done}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {t.family.questionProgress(current + 1, quiz.questions.length)}
            </span>
            <span>{t.family.points(score)}</span>
          </div>
          <Progress
            value={(current / quiz.questions.length) * 100}
            aria-label={t.family.quizProgressAria}
          />
          <p className="font-semibold">{pick(question.question, lang)}</p>
          <div className="space-y-2">
            {question.options.map((option, idx) => {
              const isCorrect = idx === question.correctIndex;
              const isSelected = answered === idx;
              const optionText = pick(option, lang);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => answer(idx)}
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
                  aria-label={t.family.answerAria(optionText)}
                >
                  {optionText}
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
                {pick(question.explanation, lang)}
              </p>
              <Button className="w-full" onClick={next}>
                {current + 1 >= quiz.questions.length
                  ? t.family.showResult
                  : t.family.nextQuestion}
              </Button>
            </>
          )}
        </div>
      )}
    </DialogContent>
  );
}

export default function FamilyPage() {
  const { lang, t } = useI18n();
  const [activeHunt, setActiveHunt] = useState<ScavengerHunt | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<NatureQuiz | null>(null);
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const customHuntsQuery = trpc.hunts.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  // null = Editor zu, "neu" = neue Jagd, sonst die zu bearbeitende Jagd
  const [editorState, setEditorState] = useState<CustomHuntRow | "neu" | null>(
    null
  );
  const removeHuntMutation = trpc.hunts.remove.useMutation({
    onSuccess: () => utils.hunts.list.invalidate(),
    onError: () => toast.error(t.common.deleteFailed),
  });

  return (
    <div className="container py-6">
      <PageHeader title={t.family.title} subtitle={t.family.subtitle} />

      <div className="mb-6 flex items-center gap-2 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t.family.offlineNote}
      </div>

      {/* Schnitzeljagden */}
      <h2 className="mb-1 font-serif text-xl font-semibold">
        {t.family.huntsTitle}
      </h2>
      <p className="mb-3 text-sm text-muted-foreground">
        {t.family.huntsSubtitle}
      </p>
      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        {scavengerHunts.map(hunt => (
          <div
            key={hunt.id}
            className="flex flex-col rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md"
          >
            <button
              type="button"
              onClick={() => setActiveHunt(hunt)}
              className="flex items-start gap-3.5 text-left active:scale-[0.99]"
              aria-label={t.family.startHuntAria(pick(hunt.title, lang))}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Map className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-semibold">
                  {pick(hunt.title, lang)}
                </span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {pick(hunt.ageHint, lang)} ·{" "}
                  {t.family.durationShort(hunt.durationMinutes)} ·{" "}
                  {t.family.stationsCount(hunt.stations.length)}
                </span>
                <span className="mt-1.5 line-clamp-2 block text-xs italic text-muted-foreground">
                  {pick(hunt.intro, lang)}
                </span>
              </span>
            </button>
            <div className="mt-3 flex items-center gap-4 border-t border-border/60 pt-2.5 text-xs">
              <button
                type="button"
                onClick={() => setActiveHunt(hunt)}
                className="font-medium text-primary hover:underline"
              >
                {t.family.playOnPhone}
              </button>
              <Link
                href={`/familie/drucken/${hunt.id}`}
                className="font-medium text-primary hover:underline"
              >
                {t.family.printPdf}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Eigene Schnitzeljagden */}
      {isAuthenticated && (
        <>
          <h2 className="mb-1 font-serif text-xl font-semibold">
            {t.family.ownHuntsTitle}
          </h2>
          <p className="mb-3 text-sm text-muted-foreground">
            {t.family.ownHuntsSubtitle}
          </p>
          <div className="mb-8 grid gap-3 sm:grid-cols-2">
            {(customHuntsQuery.data ?? []).map(row => {
              const hunt = customHuntToScavengerHunt(row);
              return (
                <div
                  key={row.id}
                  className="flex flex-col rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => setActiveHunt(hunt)}
                    className="flex items-start gap-3.5 text-left active:scale-[0.99]"
                    aria-label={t.family.startHuntAria(row.title)}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Map className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block font-semibold">{row.title}</span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {pick(hunt.ageHint, lang)} ·{" "}
                        {t.family.durationShort(row.durationMinutes)} ·{" "}
                        {t.family.stationsCount(hunt.stations.length)}
                      </span>
                      <span className="mt-1.5 line-clamp-2 block text-xs italic text-muted-foreground">
                        {row.intro}
                      </span>
                    </span>
                  </button>
                  <div className="mt-3 flex items-center gap-4 border-t border-border/60 pt-2.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveHunt(hunt)}
                      className="font-medium text-primary hover:underline"
                    >
                      {t.family.play}
                    </button>
                    <Link
                      href={`/familie/drucken/${hunt.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {t.family.print}
                    </Link>
                    <button
                      type="button"
                      onClick={() => setEditorState(row)}
                      className="flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                      <Pencil className="h-3 w-3" aria-hidden="true" />
                      {t.common.edit}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(t.family.deleteConfirm(row.title))) {
                          removeHuntMutation.mutate({ id: row.id });
                        }
                      }}
                      className="ml-auto flex items-center gap-1 font-medium text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" aria-hidden="true" />
                      {t.common.delete}
                    </button>
                  </div>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => setEditorState("neu")}
              className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary/50 p-4 text-primary transition-all hover:border-primary hover:bg-accent/40 active:scale-[0.99]"
              aria-label={t.family.newHuntAria}
            >
              <Plus className="h-6 w-6" aria-hidden="true" />
              <span className="text-sm font-semibold">{t.family.newHunt}</span>
            </button>
          </div>
        </>
      )}

      {/* Natur-Quizze */}
      <h2 className="mb-1 font-serif text-xl font-semibold">
        {t.family.quizzesTitle}
      </h2>
      <p className="mb-3 text-sm text-muted-foreground">
        {t.family.quizzesSubtitlePrefix}
        <Link
          href="/natur"
          className="font-medium text-primary hover:underline"
        >
          {t.family.quizzesSubtitleLink}
        </Link>
        {t.family.quizzesSubtitleSuffix}
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {natureQuizzes.map(quiz => (
          <button
            key={quiz.id}
            type="button"
            onClick={() => setActiveQuiz(quiz)}
            className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.99]"
            aria-label={t.family.startQuizAria(pick(quiz.title, lang))}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <CompassIcon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-semibold">{pick(quiz.title, lang)}</span>
            <Badge variant="secondary">
              {t.family.questionCount(quiz.questions.length)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {pick(quiz.ageHint, lang)}
            </span>
          </button>
        ))}
      </div>

      <Dialog
        open={activeHunt !== null}
        onOpenChange={open => !open && setActiveHunt(null)}
      >
        {activeHunt && (
          <HuntDialog hunt={activeHunt} onClose={() => setActiveHunt(null)} />
        )}
      </Dialog>
      <Dialog
        open={activeQuiz !== null}
        onOpenChange={open => !open && setActiveQuiz(null)}
      >
        {activeQuiz && (
          <QuizDialog quiz={activeQuiz} onClose={() => setActiveQuiz(null)} />
        )}
      </Dialog>
      <Dialog
        open={editorState !== null}
        onOpenChange={open => !open && setEditorState(null)}
      >
        {editorState !== null && (
          <HuntEditorDialog
            initial={editorState === "neu" ? null : editorState}
            onClose={() => setEditorState(null)}
          />
        )}
      </Dialog>
    </div>
  );
}
