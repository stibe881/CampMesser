import { useEffect, useRef, useState } from "react";
import { fmtDate, fmtMedium } from "@/lib/dateFormat";
import { useConfirm } from "@/components/ConfirmDialog";
import { ShareExpiryNote, ShareExpirySelect } from "@/components/ShareExpiry";
import type { ShareExpiryDays } from "@shared/sharing";
import { Link } from "wouter";
import {
  Award,
  BadgeCheck,
  Check,
  Compass as CompassIcon,
  Gift,
  Leaf,
  Lightbulb,
  Link2,
  Map,
  PartyPopper,
  Pencil,
  Plus,
  Printer,
  QrCode,
  RotateCcw,
  Share2,
  Sparkles,
  Swords,
  Timer,
  Trash2,
  Trophy,
  Volume2,
  VolumeX,
  WifiOff,
} from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import QueryError from "@/components/QueryError";
import TreasureHunt from "@/components/TreasureHunt";
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
import { LOCALE_TAGS, pick, type Language } from "@shared/i18n";
import { BADGES, earnedBadges, type BadgeEvent } from "@shared/badges";
import { useI18n, useT } from "@/i18n";
import { MAX_STATIONS, parseHuntStations } from "@shared/hunts";
import { MAX_QUIZ_QUESTIONS, parseQuizQuestions } from "@shared/quizzes";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  customHuntToScavengerHunt,
  type CustomHuntRow,
} from "@/lib/customHunts";
import {
  customQuizToNatureQuiz,
  type CustomQuizRow,
} from "@/lib/customQuizzes";
import { quizEntries } from "@/data/nature";
import { buildNatureQuiz, NATURE_QUIZ_QUESTIONS } from "@/lib/natureQuiz";
import {
  duelFinished,
  duelPlayer,
  duelQuestionIndex,
  duelWinner,
} from "@/lib/quizDuel";
import {
  formatHuntSeconds,
  loadHuntBestTimes,
  recordHuntTime,
  sanitizeHuntBestTimes,
  storeHuntBestTimes,
  type HuntBestTimes,
} from "@/lib/huntTimes";
import { useSyncedSetting } from "@/lib/useSyncedSetting";
import { useSpeech } from "@/lib/speech";
import TravelBingo from "@/components/TravelBingo";
import BedtimeStories from "@/components/BedtimeStories";
import ArrivalProgress from "@/components/ArrivalProgress";
import { cn } from "@/lib/utils";

/** Buchstabe einer Station in der aktiven Sprache ("" = keiner). */
const stationLetter = (station: HuntStation, lang: Language): string =>
  station.letter ? pick(station.letter, lang) : "";

/** Zuletzt gewähltes Kind fürs «Wer spielt?»-Vorauswählen. */
const ACTIVE_CHILD_KEY = "campmesser.activeChild";

/** Player-Id des automatisch erzeugten Natur-Lexikon-Quiz. */
const NATURE_LEXICON_QUIZ_ID = "natur-lexikon-quiz";

function loadStoredActiveChild(): number | null {
  try {
    const raw = localStorage.getItem(ACTIVE_CHILD_KEY);
    if (raw) {
      const id = Number(raw);
      if (Number.isInteger(id) && id > 0) return id;
    }
  } catch {
    // Speicher blockiert – ohne Vorauswahl starten
  }
  return null;
}

function storeActiveChild(id: number | null) {
  try {
    if (id === null) localStorage.removeItem(ACTIVE_CHILD_KEY);
    else localStorage.setItem(ACTIVE_CHILD_KEY, String(id));
  } catch {
    // Speicher blockiert – die Auswahl gilt trotzdem für diese Sitzung
  }
}

/** Ergebnis eines fertig gespielten Quiz für die Abzeichen-Prüfung. */
interface QuizResult {
  quizId: string;
  perfect: boolean;
  correctStreak: number;
}

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

/** Formular-Zustand einer Quiz-Frage im Editor. */
interface EditorQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const emptyQuestion = (): EditorQuestion => ({
  question: "",
  options: ["", "", ""],
  correctIndex: 0,
  explanation: "",
});

/** Editor für eigene Quizze: erstellen und bearbeiten. */
function QuizEditorDialog({
  initial,
  onClose,
}: {
  initial: CustomQuizRow | null;
  onClose: () => void;
}) {
  const t = useT();
  const qe = t.family.quizEditor;
  const utils = trpc.useUtils();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [questions, setQuestions] = useState<EditorQuestion[]>(() => {
    if (initial) {
      const parsed = parseQuizQuestions(initial.questionsJson);
      if (parsed.length > 0) {
        return parsed.map(q => ({
          question: q.question,
          options: [...q.options],
          correctIndex: q.correctIndex,
          explanation: q.explanation ?? "",
        }));
      }
    }
    return [emptyQuestion()];
  });

  const onSaved = () => {
    utils.quizzes.list.invalidate();
    toast.success(initial ? qe.updated : qe.created);
    onClose();
  };
  const onSaveError = (e: { message?: string }) =>
    toast.error(e.message || t.common.saveFailed);
  const createMutation = trpc.quizzes.create.useMutation({
    onSuccess: onSaved,
    onError: onSaveError,
  });
  const updateMutation = trpc.quizzes.update.useMutation({
    onSuccess: onSaved,
    onError: onSaveError,
  });
  const isPending = createMutation.isPending || updateMutation.isPending;

  const updateQuestion = (index: number, patch: Partial<EditorQuestion>) =>
    setQuestions(prev =>
      prev.map((q, i) => (i === index ? { ...q, ...patch } : q))
    );

  const canSave =
    title.trim() &&
    questions.length > 0 &&
    questions.every(
      q => q.question.trim() && q.options.every(option => option.trim())
    );

  const save = () => {
    const payload = {
      title: title.trim(),
      questions: questions.map(q => ({
        question: q.question.trim(),
        options: q.options.map(option => option.trim()),
        correctIndex: q.correctIndex,
        explanation: q.explanation.trim() || undefined,
      })),
    };
    if (initial) updateMutation.mutate({ id: initial.id, ...payload });
    else createMutation.mutate(payload);
  };

  return (
    <DialogContent className="max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="font-serif text-xl">
          {initial ? qe.titleEdit : qe.titleNew}
        </DialogTitle>
        <DialogDescription>{qe.description}</DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <div>
          <Label htmlFor="quiz-title">{qe.titleLabel}</Label>
          <Input
            id="quiz-title"
            className="mt-1.5"
            placeholder={qe.titlePlaceholder}
            value={title}
            maxLength={140}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        {/* Fragen */}
        <div>
          <p className="mb-2 text-sm font-semibold">
            {qe.questionsTitle(questions.length)}
          </p>
          <div className="space-y-3">
            {questions.map((q, i) => (
              <div key={i} className="rounded-lg border border-border p-3">
                <div className="mb-2 flex items-start gap-2">
                  <Textarea
                    rows={2}
                    placeholder={qe.questionPlaceholder}
                    value={q.question}
                    onChange={e =>
                      updateQuestion(i, { question: e.target.value })
                    }
                    aria-label={qe.questionAria(i + 1)}
                  />
                  <button
                    type="button"
                    disabled={questions.length <= 1}
                    onClick={() =>
                      setQuestions(prev => prev.filter((_, idx) => idx !== i))
                    }
                    className="mt-1 shrink-0 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-30"
                    aria-label={qe.removeQuestionAria(i + 1)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <p className="mb-1.5 text-xs text-muted-foreground">
                  {qe.correctHint}
                </p>
                <div className="mb-2 space-y-2">
                  {q.options.map((option, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`quiz-correct-${i}`}
                        checked={q.correctIndex === j}
                        onChange={() => updateQuestion(i, { correctIndex: j })}
                        className="h-4 w-4 shrink-0 accent-primary"
                        aria-label={qe.correctAria(i + 1, j + 1)}
                      />
                      <Input
                        placeholder={qe.optionPlaceholder(j + 1)}
                        value={option}
                        maxLength={200}
                        onChange={e =>
                          updateQuestion(i, {
                            options: q.options.map((o, idx) =>
                              idx === j ? e.target.value : o
                            ),
                          })
                        }
                        aria-label={qe.optionAria(i + 1, j + 1)}
                      />
                    </div>
                  ))}
                </div>
                <Input
                  placeholder={qe.explanationPlaceholder}
                  value={q.explanation}
                  maxLength={1000}
                  onChange={e =>
                    updateQuestion(i, { explanation: e.target.value })
                  }
                  aria-label={qe.explanationAria(i + 1)}
                />
              </div>
            ))}
          </div>
          {questions.length < MAX_QUIZ_QUESTIONS && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setQuestions(prev => [...prev, emptyQuestion()])}
            >
              <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              {qe.addQuestion}
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button
            className="flex-1"
            disabled={!canSave || isPending}
            onClick={save}
          >
            {isPending ? t.common.saving : t.common.save}
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
  bestTime,
  onClose,
  onCompleted,
  onFinished,
}: {
  hunt: ScavengerHunt;
  /** Bisherige Bestzeit dieser Jagd in Sekunden (null = noch keine). */
  bestTime: number | null;
  onClose: () => void;
  /** Wird gemeldet, wenn die Jagd in dieser Sitzung fertig abgehakt wurde. */
  onCompleted?: () => void;
  /** Wird beim Abschluss mit der gestoppten Zeit in Sekunden gemeldet. */
  onFinished?: (seconds: number) => void;
}) {
  const { lang, t } = useI18n();
  const [checked, setChecked] = useHuntProgress(hunt.id, hunt.stations.length);
  const [revealedHints, setRevealedHints] = useState<Record<number, boolean>>(
    {}
  );
  const doneCount = checked.filter(Boolean).length;
  const allDone = doneCount === hunt.stations.length;

  // ── Stoppuhr: läuft ab dem Öffnen, Schliessen bricht ab (kein Pausieren) ──
  const startRef = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);
  /** Ergebnis der in DIESER SITZUNG beendeten Jagd (null = noch offen). */
  const [finish, setFinish] = useState<{
    seconds: number;
    isNewBest: boolean;
  } | null>(null);
  useEffect(() => {
    if (allDone) return;
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [allDone]);

  // ── Vorlese-Modus: eine Station gleichzeitig, Stationswechsel stoppt ──
  const speech = useSpeech();
  const [speakingStation, setSpeakingStation] = useState<number | null>(null);
  useEffect(() => {
    if (!speech.speaking) setSpeakingStation(null);
  }, [speech.speaking]);
  const stopSpeaking = () => {
    speech.stop();
    setSpeakingStation(null);
  };
  /** Geschichte + Aufgabe (+ aufgedeckter Hinweis) der Station vorlesen. */
  const toggleSpeak = (index: number, station: HuntStation) => {
    if (speakingStation === index) {
      stopSpeaking();
      return;
    }
    const parts = [pick(station.story, lang), pick(station.task, lang)];
    if (revealedHints[index] && station.hint) {
      parts.push(pick(station.hint, lang));
    }
    speech.speak(parts.filter(Boolean).join("\n"), lang);
    setSpeakingStation(index);
  };

  // Abschluss nur melden, wenn die Jagd IN DIESER SITZUNG fertig wurde –
  // eine schon beim Öffnen komplette Jagd (localStorage) zählt nicht erneut.
  const sawIncompleteRef = useRef(false);
  const onCompletedRef = useRef(onCompleted);
  onCompletedRef.current = onCompleted;
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;
  const bestTimeRef = useRef(bestTime);
  bestTimeRef.current = bestTime;
  useEffect(() => {
    if (!allDone) {
      sawIncompleteRef.current = true;
      return;
    }
    if (sawIncompleteRef.current) {
      sawIncompleteRef.current = false;
      // Stoppuhr anhalten und gegen die bisherige Bestzeit vergleichen
      const seconds = Math.max(
        1,
        Math.floor((Date.now() - startRef.current) / 1000)
      );
      setElapsed(seconds);
      const previous = bestTimeRef.current;
      setFinish({
        seconds,
        isNewBest: previous === null || seconds < previous,
      });
      onFinishedRef.current?.(seconds);
      onCompletedRef.current?.();
    }
  }, [allDone]);
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
        {/* Dezente Stoppuhr: läuft ab dem Öffnen mit */}
        {(!allDone || finish !== null) && (
          <p
            className="flex items-center gap-1 text-xs tabular-nums text-muted-foreground"
            aria-label={t.family.stopwatchAria}
          >
            <Timer className="h-3.5 w-3.5" aria-hidden="true" />
            {formatHuntSeconds(finish ? finish.seconds : elapsed)}
          </p>
        )}
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
                  onCheckedChange={value => {
                    // Stationswechsel: laufendes Vorlesen stoppen
                    stopSpeaking();
                    setChecked(prev =>
                      prev.map((c, idx) => (idx === i ? value === true : c))
                    );
                  }}
                  className="mt-0.5"
                  aria-label={t.family.stationDoneAria(
                    pick(station.title, lang)
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
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
                    {speech.supported && (
                      <button
                        type="button"
                        onClick={() => toggleSpeak(i, station)}
                        aria-pressed={speakingStation === i}
                        aria-label={
                          speakingStation === i
                            ? t.family.readAloudStopAria(
                                pick(station.title, lang)
                              )
                            : t.family.readAloudAria(pick(station.title, lang))
                        }
                        className={cn(
                          "-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors",
                          speakingStation === i
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {speakingStation === i ? (
                          <VolumeX className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Volume2 className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    )}
                  </div>
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
          {/* Gestoppte Zeit im Vergleich zur Bestzeit dieser Jagd */}
          {finish && (
            <p className="flex items-center gap-2 text-sm font-medium">
              <Timer
                className="h-4 w-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              {finish.isNewBest
                ? t.family.newBestTimeLine(formatHuntSeconds(finish.seconds))
                : t.family.finishTimeLine(
                    formatHuntSeconds(finish.seconds),
                    formatHuntSeconds(bestTime ?? finish.seconds)
                  )}
            </p>
          )}
        </div>
      )}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => {
            stopSpeaking();
            setChecked(new Array(hunt.stations.length).fill(false));
            setRevealedHints({});
            // Stoppuhr neu starten
            startRef.current = Date.now();
            setElapsed(0);
            setFinish(null);
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
  onCompleted,
}: {
  quiz: NatureQuiz;
  onClose: () => void;
  /** Wird nach der letzten Frage mit dem Ergebnis gemeldet (Abzeichen). */
  onCompleted?: (result: QuizResult) => void;
}) {
  const { lang, t } = useI18n();
  const [current, setCurrent] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  // Antwort-Serie fürs Serien-Abzeichen: aktuelle und beste Serie des Durchgangs
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const question = quiz.questions[current];
  // Eigene Quizze dürfen die Erklärung weglassen – dann keinen leeren Kasten zeigen
  const explanationText =
    answered !== null && question ? pick(question.explanation, lang) : "";

  const answer = (idx: number) => {
    if (answered !== null) return;
    setAnswered(idx);
    if (idx === question.correctIndex) {
      setScore(s => s + 1);
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      if (nextStreak > bestStreak) setBestStreak(nextStreak);
    } else {
      setStreak(0);
    }
  };

  const next = () => {
    if (current + 1 >= quiz.questions.length) {
      setFinished(true);
      onCompleted?.({
        quizId: quiz.id,
        perfect: score === quiz.questions.length,
        correctStreak: bestStreak,
      });
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
    setStreak(0);
    setBestStreak(0);
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
              {explanationText && (
                <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                  {explanationText}
                </p>
              )}
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

/** Kind-Profil im Duell – die Reihenfolge im Tupel ist die Zugreihenfolge. */
interface DuelChild {
  id: number;
  name: string;
}

/**
 * Quiz-Duell für zwei Kinder: beide beantworten abwechselnd dieselben
 * Fragen (A Frage 1, B Frage 1, A Frage 2 …). Vor jedem Zug zeigt ein
 * Übergabe-Banner, wer dran ist, damit das Gerät weitergereicht wird.
 * Am Ende vergleicht die Auswertung beide Punktestände (Unentschieden
 * möglich); Zugreihenfolge/Punkte-Logik liegt in client/src/lib/quizDuel.ts.
 */
function DuelQuizDialog({
  quiz,
  players,
  onClose,
  onCompleted,
}: {
  quiz: NatureQuiz;
  players: [DuelChild, DuelChild];
  onClose: () => void;
  /** Wird nach dem letzten Zug mit den Ergebnissen BEIDER Kinder gemeldet. */
  onCompleted?: (results: [QuizResult, QuizResult]) => void;
}) {
  const { lang, t } = useI18n();
  const [turn, setTurn] = useState(0);
  // «handover» = Übergabe-Banner zwischen den Zügen, «question» = Frage offen
  const [phase, setPhase] = useState<"handover" | "question">("handover");
  const [answered, setAnswered] = useState<number | null>(null);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [streaks, setStreaks] = useState<[number, number]>([0, 0]);
  const [bestStreaks, setBestStreaks] = useState<[number, number]>([0, 0]);
  const [finished, setFinished] = useState(false);

  const player = duelPlayer(turn);
  const questionIndex = duelQuestionIndex(turn);
  const question = quiz.questions[questionIndex];
  const explanationText =
    answered !== null && question ? pick(question.explanation, lang) : "";

  const setForPlayer = (
    values: [number, number],
    value: number
  ): [number, number] =>
    player === 0 ? [value, values[1]] : [values[0], value];

  const answer = (idx: number) => {
    if (answered !== null) return;
    setAnswered(idx);
    if (idx === question.correctIndex) {
      setScores(prev => setForPlayer(prev, prev[player] + 1));
      const nextStreak = streaks[player] + 1;
      setStreaks(prev => setForPlayer(prev, nextStreak));
      if (nextStreak > bestStreaks[player]) {
        setBestStreaks(prev => setForPlayer(prev, nextStreak));
      }
    } else {
      setStreaks(prev => setForPlayer(prev, 0));
    }
  };

  const next = () => {
    const nextTurn = turn + 1;
    setAnswered(null);
    if (duelFinished(nextTurn, quiz.questions.length)) {
      setFinished(true);
      onCompleted?.([
        {
          quizId: quiz.id,
          perfect: scores[0] === quiz.questions.length,
          correctStreak: bestStreaks[0],
        },
        {
          quizId: quiz.id,
          perfect: scores[1] === quiz.questions.length,
          correctStreak: bestStreaks[1],
        },
      ]);
    } else {
      setTurn(nextTurn);
      setPhase("handover");
    }
  };

  const restart = () => {
    setTurn(0);
    setPhase("handover");
    setAnswered(null);
    setScores([0, 0]);
    setStreaks([0, 0]);
    setBestStreaks([0, 0]);
    setFinished(false);
  };

  const winner = duelWinner(scores[0], scores[1]);

  return (
    <DialogContent className="max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="font-serif text-xl">
          {pick(quiz.title, lang)}
        </DialogTitle>
        <DialogDescription>
          {t.family.duelVs(players[0].name, players[1].name)}
        </DialogDescription>
      </DialogHeader>

      {finished ? (
        <div className="space-y-4 text-center">
          <Trophy
            className="mx-auto h-12 w-12 text-amber-glow"
            aria-hidden="true"
          />
          <p className="font-serif text-2xl font-bold">
            {winner === null
              ? t.family.duelTie
              : t.family.duelWinner(players[winner].name)}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {players.map((p, i) => (
              <div
                key={p.id}
                className={cn(
                  "rounded-lg border p-3",
                  winner === i
                    ? "border-primary bg-accent"
                    : "border-border bg-card"
                )}
              >
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="text-sm text-muted-foreground">
                  {t.family.points(scores[i])}
                </p>
              </div>
            ))}
          </div>
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
      ) : phase === "handover" ? (
        <div className="space-y-4 py-2 text-center">
          <p className="text-sm text-muted-foreground">
            {t.family.questionProgress(
              questionIndex + 1,
              quiz.questions.length
            )}
          </p>
          <p
            role="status"
            className="rounded-xl bg-accent p-4 font-serif text-xl font-bold"
          >
            {t.family.duelNowPlaying(players[player].name)}
          </p>
          <p className="text-sm text-muted-foreground">
            {t.family.duelHandoverHint(players[player].name)}
          </p>
          <Button className="w-full" onClick={() => setPhase("question")}>
            {t.family.duelGo}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 text-sm">
            {players.map((p, i) => (
              <span
                key={p.id}
                className={cn(
                  "min-w-0 truncate",
                  player === i
                    ? "font-bold text-primary"
                    : "text-muted-foreground"
                )}
              >
                {t.family.duelScore(p.name, scores[i])}
              </span>
            ))}
          </div>
          <div
            role="status"
            className="rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold"
          >
            {t.family.duelNowPlaying(players[player].name)} ·{" "}
            {t.family.questionProgress(
              questionIndex + 1,
              quiz.questions.length
            )}
          </div>
          <Progress
            value={(turn / (quiz.questions.length * 2)) * 100}
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
              {explanationText && (
                <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                  {explanationText}
                </p>
              )}
              <Button className="w-full" onClick={next}>
                {duelFinished(turn + 1, quiz.questions.length)
                  ? t.family.showResult
                  : t.family.duelPassTo(players[duelPlayer(turn + 1)].name)}
              </Button>
            </>
          )}
        </div>
      )}
    </DialogContent>
  );
}

/**
 * Abzeichen-Galerie eines Kindes: verdiente farbig mit Datum, offene
 * ausgegraut mit der Bedingung als Hinweis.
 */
function ChildBadgeGallery({ childId }: { childId: number }) {
  const { lang, t } = useI18n();
  const badgesQuery = trpc.family.badges.listByChild.useQuery({ childId });
  // Kein `new Map(...)`: der Bezeichner Map ist hier das lucide-Icon
  const earnedAtById: Record<string, Date | string> = {};
  (badgesQuery.data ?? []).forEach(b => {
    earnedAtById[b.badgeId] = b.earnedAt;
  });
  const earnedCount = Object.keys(earnedAtById).length;
  const fmtDate = (value: Date | string) => fmtMedium(new Date(value), lang);
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {t.family.badgeCount(earnedCount, BADGES.length)}
        </p>
        {earnedCount > 0 && (
          <Link
            href={`/familie/urkunde/${childId}`}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Printer className="h-3 w-3" aria-hidden="true" />
            {t.badgeCertificate.galleryLink}
          </Link>
        )}
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {BADGES.map(def => {
          const earnedAt = earnedAtById[def.id];
          return (
            <li
              key={def.id}
              className={cn(
                "rounded-lg border p-2.5 text-center",
                earnedAt
                  ? "border-primary/40 bg-accent"
                  : "border-dashed border-border opacity-60"
              )}
            >
              <span
                className={cn("block text-2xl", !earnedAt && "grayscale")}
                aria-hidden="true"
              >
                {def.emoji}
              </span>
              <span className="mt-1 block text-xs font-semibold">
                {pick(def.title, lang)}
              </span>
              <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                {earnedAt
                  ? t.family.badgeEarnedOn(fmtDate(earnedAt))
                  : pick(def.description, lang)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Abschnitt «Kinder & Abzeichen»: Kinder-Profile verwalten (Name anlegen,
 * umbenennen, löschen) und pro Kind die Abzeichen-Galerie zeigen.
 */
function ChildrenSection({
  children: kids,
}: {
  children: { id: number; name: string }[];
}) {
  const ask = useConfirm();
  const t = useT();
  const utils = trpc.useUtils();
  const [newName, setNewName] = useState("");
  // null = keine Umbenennung offen, sonst {id, name} des Formulars
  const [editing, setEditing] = useState<{ id: number; name: string } | null>(
    null
  );

  const addMutation = trpc.family.children.add.useMutation({
    onSuccess: () => {
      utils.family.children.list.invalidate();
      setNewName("");
    },
    onError: () => toast.error(t.common.saveFailed),
  });
  const renameMutation = trpc.family.children.rename.useMutation({
    onSuccess: () => {
      utils.family.children.list.invalidate();
      setEditing(null);
    },
    onError: () => toast.error(t.common.saveFailed),
  });
  const removeMutation = trpc.family.children.remove.useMutation({
    onSuccess: () => utils.family.children.list.invalidate(),
    onError: () => toast.error(t.common.deleteFailed),
  });

  return (
    <>
      <h2 className="mb-1 flex items-center gap-2 font-serif text-xl font-semibold">
        <Award className="h-5 w-5 text-primary" aria-hidden="true" />
        {t.family.childrenTitle}
      </h2>
      <p className="mb-3 text-sm text-muted-foreground">
        {t.family.childrenSubtitle}
      </p>
      {kids.length === 0 && (
        <p className="mb-3 rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
          {t.family.childrenEmpty}
        </p>
      )}
      <div className="mb-4 space-y-3">
        {kids.map(child => (
          <div
            key={child.id}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="mb-3 flex items-center gap-2">
              {editing?.id === child.id ? (
                <form
                  className="flex flex-1 items-center gap-2"
                  onSubmit={e => {
                    e.preventDefault();
                    const name = editing.name.trim();
                    if (!name) return;
                    renameMutation.mutate({ id: child.id, name });
                  }}
                >
                  <Input
                    value={editing.name}
                    maxLength={60}
                    autoFocus
                    onChange={e =>
                      setEditing({ id: child.id, name: e.target.value })
                    }
                    aria-label={t.family.renameChildAria(child.name)}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    disabled={!editing.name.trim() || renameMutation.isPending}
                    aria-label={t.family.renameSaveAria(child.name)}
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </form>
              ) : (
                <>
                  <p className="min-w-0 flex-1 truncate font-semibold">
                    {child.name}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setEditing({ id: child.id, name: child.name })
                    }
                    className="shrink-0 text-muted-foreground transition-colors hover:text-primary"
                    aria-label={t.family.renameChildAria(child.name)}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        await ask({
                          title: t.family.deleteChildConfirm(child.name),
                        })
                      ) {
                        removeMutation.mutate({ id: child.id });
                      }
                    }}
                    className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                    aria-label={t.family.deleteChildAria(child.name)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </>
              )}
            </div>
            <ChildBadgeGallery childId={child.id} />
          </div>
        ))}
      </div>
      <form
        className="mb-8 flex items-center gap-2"
        onSubmit={e => {
          e.preventDefault();
          const name = newName.trim();
          if (!name) return;
          addMutation.mutate({ name });
        }}
      >
        <Input
          className="max-w-60"
          placeholder={t.family.childNamePlaceholder}
          value={newName}
          maxLength={60}
          onChange={e => setNewName(e.target.value)}
          aria-label={t.family.childNamePlaceholder}
        />
        <Button
          type="submit"
          variant="outline"
          disabled={!newName.trim() || addMutation.isPending}
        >
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {t.family.addChild}
        </Button>
      </form>
    </>
  );
}

export default function FamilyPage() {
  const ask = useConfirm();
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

  // ── Schnitzeljagd-Bestzeiten: localStorage als schnelle Quelle, Geräte-Sync fürs Konto ──
  const [bestTimes, setBestTimes] = useState<HuntBestTimes>(() =>
    loadHuntBestTimes()
  );
  const bestTimesRef = useRef(bestTimes);
  bestTimesRef.current = bestTimes;
  const bestTimesSync = useSyncedSetting<HuntBestTimes>(
    "huntBestTimes",
    value => {
      const clean = sanitizeHuntBestTimes(value);
      setBestTimes(clean);
      storeHuntBestTimes(clean);
    }
  );
  /** Gestoppte Zeit einer beendeten Jagd festhalten (nur bessere gewinnen). */
  const handleHuntFinished = (huntId: string, seconds: number) => {
    const { times, isNewBest } = recordHuntTime(
      bestTimesRef.current,
      huntId,
      seconds
    );
    if (!isNewBest) return;
    bestTimesRef.current = times;
    setBestTimes(times);
    storeHuntBestTimes(times);
    bestTimesSync.push(times);
  };
  const customQuizzesQuery = trpc.quizzes.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  // null = Quiz-Editor zu, "neu" = neues Quiz, sonst das zu bearbeitende Quiz
  const [quizEditorState, setQuizEditorState] = useState<
    CustomQuizRow | "neu" | null
  >(null);
  const removeQuizMutation = trpc.quizzes.remove.useMutation({
    onSuccess: () => utils.quizzes.list.invalidate(),
    onError: () => toast.error(t.common.deleteFailed),
  });

  // ── Eigenes Quiz per Link teilen (Muster PackLists-Vorlagen) ──
  /** Quiz, dessen Teil-Link gerade im Dialog gezeigt wird. */
  const [quizShare, setQuizShare] = useState<{
    id: number;
    title: string;
    url: string;
    expiresAt: Date | null;
  } | null>(null);
  const [quizQr, setQuizQr] = useState<string | null>(null);
  /** Im Dialog gewählte Gültigkeit; null = unbegrenzt. */
  const [quizExpiresIn, setQuizExpiresIn] = useState<ShareExpiryDays | null>(
    null
  );

  // QR-Code zum Teil-Link erzeugen: einfach abscannen lassen
  useEffect(() => {
    if (!quizShare) {
      setQuizQr(null);
      return;
    }
    QRCode.toDataURL(quizShare.url, {
      width: 480,
      margin: 1,
      errorCorrectionLevel: "M",
    })
      .then(setQuizQr)
      .catch(() => setQuizQr(null));
  }, [quizShare]);

  const shareQuizMutation = trpc.quizzes.share.useMutation({
    onError: () => toast.error(t.family.quizShareFailed),
  });

  /** Teil-Link des Quiz erzeugen (idempotent), Dialog öffnen, Link kopieren. */
  const openQuizShare = (
    quiz: { id: number; title: string },
    // undefined = Gültigkeit unverändert lassen (Dialog nur öffnen)
    expiresInDays?: ShareExpiryDays | null
  ) => {
    shareQuizMutation.mutate(
      { id: quiz.id, expiresInDays },
      {
        onSuccess: async ({ token, expiresAt }) => {
          const url = `${window.location.origin}/quiz/${token}`;
          setQuizShare({ id: quiz.id, title: quiz.title, url, expiresAt });
          utils.quizzes.list.invalidate();
          try {
            await navigator.clipboard.writeText(url);
            toast.success(t.family.quizShareCopied);
          } catch {
            // Zwischenablage blockiert – der Link steht im Dialog
          }
        },
      }
    );
  };

  const unshareQuizMutation = trpc.quizzes.unshare.useMutation({
    onSuccess: () => {
      utils.quizzes.list.invalidate();
      setQuizShare(null);
      toast.success(t.family.quizUnshared);
    },
    onError: () => toast.error(t.family.quizUnshareFailed),
  });

  // ── Kinder-Profile & Abzeichen ──
  const childrenQuery = trpc.family.children.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const children = childrenQuery.data ?? [];
  const [activeChildId, setActiveChildId] = useState<number | null>(
    loadStoredActiveChild
  );
  // Noch nicht gestartete Aktivität, solange «Wer spielt?» offen ist
  const [pendingActivity, setPendingActivity] = useState<
    { hunt: ScavengerHunt } | { quiz: NatureQuiz } | null
  >(null);
  // Duell-Aufbau: Quiz gewählt, dann zwei Kinder nacheinander bestimmen
  const [duelSetup, setDuelSetup] = useState<{
    quiz: NatureQuiz;
    firstId: number | null;
  } | null>(null);
  // Laufendes Duell mit fixer Zugreihenfolge (players[0] beginnt)
  const [activeDuel, setActiveDuel] = useState<{
    quiz: NatureQuiz;
    players: [DuelChild, DuelChild];
  } | null>(null);

  const recordMutation = trpc.family.stats.record.useMutation();
  const awardMutation = trpc.family.badges.award.useMutation();

  /** Jagd/Quiz starten – mit Kindern zuerst «Wer spielt?» fragen. */
  const startHunt = (hunt: ScavengerHunt) => {
    if (isAuthenticated && children.length > 0) {
      setPendingActivity({ hunt });
    } else {
      setActiveHunt(hunt);
    }
  };
  const startQuiz = (quiz: NatureQuiz) => {
    if (isAuthenticated && children.length > 0) {
      setPendingActivity({ quiz });
    } else {
      setActiveQuiz(quiz);
    }
  };

  /**
   * Natur-Quiz: wird bei jedem Start frisch aus dem Lexikon gewürfelt
   * (Fragen und Optionen sind darum jedes Mal neu). Danach läuft es über
   * denselben Quiz-Player wie die eingebauten Quizze – inklusive Duell,
   * Zähler und Abzeichen.
   */
  const startNatureLexiconQuiz = () => {
    startQuiz({
      id: NATURE_LEXICON_QUIZ_ID,
      title: t.family.lexiconQuizTitle,
      ageHint: t.family.lexiconQuizAgeHint,
      questions: buildNatureQuiz(quizEntries, lang),
    });
  };

  /** Auswahl im «Wer spielt?»-Dialog: Kind merken und Aktivität starten. */
  const chooseChild = (childId: number | null) => {
    setActiveChildId(childId);
    storeActiveChild(childId);
    if (pendingActivity) {
      if ("hunt" in pendingActivity) setActiveHunt(pendingActivity.hunt);
      else setActiveQuiz(pendingActivity.quiz);
    }
    setPendingActivity(null);
  };

  /**
   * Abschluss einer Jagd/eines Quiz: Zähler des Kindes atomar fortschreiben,
   * Bedingungen prüfen und neue Abzeichen idempotent vergeben – schlicht
   * gefeiert mit einem Toast pro Abzeichen. Fehler bleiben still.
   */
  const handleCompletedFor = async (childId: number, event: BadgeEvent) => {
    const child = children.find(c => c.id === childId);
    if (!child) return;
    try {
      const stats = await recordMutation.mutateAsync({
        childId: child.id,
        type: event.type,
        correctStreak:
          event.type === "quizCompleted" ? event.correctStreak : undefined,
      });
      const candidates = earnedBadges(stats, event);
      const existing = await utils.family.badges.listByChild.fetch({
        childId: child.id,
      });
      const owned = new Set(existing.map(b => b.badgeId));
      const fresh = candidates.filter(id => !owned.has(id));
      for (const badgeId of fresh) {
        await awardMutation.mutateAsync({ childId: child.id, badgeId });
        const def = BADGES.find(b => b.id === badgeId);
        if (def) {
          toast.success(
            t.family.badgeEarnedToast(
              child.name,
              `${def.emoji} ${pick(def.title, lang)}`
            )
          );
        }
      }
      if (fresh.length > 0) {
        utils.family.badges.listByChild.invalidate({ childId: child.id });
      }
    } catch {
      // Offline/Fehler: kein Abzeichen-Update – die Vergabe ist idempotent,
      // beim nächsten Abschluss klappt es wieder
    }
  };

  /** Solo-Abschluss: Zähler/Abzeichen fürs zuvor gewählte Kind. */
  const handleCompleted = async (event: BadgeEvent) => {
    if (activeChildId === null) return;
    await handleCompletedFor(activeChildId, event);
  };

  /** Duell-Abschluss: Zähler/Abzeichen für BEIDE Kinder nacheinander. */
  const handleDuelCompleted = async (
    players: [DuelChild, DuelChild],
    results: [QuizResult, QuizResult]
  ) => {
    await handleCompletedFor(players[0].id, {
      type: "quizCompleted",
      ...results[0],
    });
    await handleCompletedFor(players[1].id, {
      type: "quizCompleted",
      ...results[1],
    });
  };

  return (
    <div className="container py-6">
      <PageHeader title={t.family.title} subtitle={t.family.subtitle} />

      <div className="mb-6 flex items-center gap-2 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t.family.offlineNote}
      </div>

      {/* Kinder-Profile & Abzeichen */}
      {/* Bei einem Serverfehler ist die Liste leer wie bei «noch keine
          Kinder angelegt» (#319) – nur dass hier welche existieren. */}
      {isAuthenticated && childrenQuery.isError && (
        <div className="mb-6">
          <QueryError
            onRetry={() => void childrenQuery.refetch()}
            retrying={childrenQuery.isFetching}
          />
        </div>
      )}
      {isAuthenticated &&
        !childrenQuery.isLoading &&
        !childrenQuery.isError && <ChildrenSection children={children} />}

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
              onClick={() => startHunt(hunt)}
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
                {bestTimes[hunt.id] != null && (
                  <span className="mt-1.5 flex items-center gap-1 text-xs font-medium text-primary">
                    <Timer className="h-3 w-3" aria-hidden="true" />
                    {t.family.bestTimeBadge(
                      formatHuntSeconds(bestTimes[hunt.id])
                    )}
                  </span>
                )}
              </span>
            </button>
            <div className="mt-3 flex items-center gap-4 border-t border-border/60 pt-2.5 text-xs">
              <button
                type="button"
                onClick={() => startHunt(hunt)}
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
                    onClick={() => startHunt(hunt)}
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
                      {bestTimes[hunt.id] != null && (
                        <span className="mt-1.5 flex items-center gap-1 text-xs font-medium text-primary">
                          <Timer className="h-3 w-3" aria-hidden="true" />
                          {t.family.bestTimeBadge(
                            formatHuntSeconds(bestTimes[hunt.id])
                          )}
                        </span>
                      )}
                    </span>
                  </button>
                  <div className="mt-3 flex items-center gap-4 border-t border-border/60 pt-2.5 text-xs">
                    <button
                      type="button"
                      onClick={() => startHunt(hunt)}
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
                      onClick={async () => {
                        if (
                          await ask({
                            title: t.family.deleteConfirm(row.title),
                          })
                        ) {
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

      {/* GPS-Schatzsuche (#267): war eine eigene Kachel zwischen Erste
          Hilfe und Knoten – dort sucht sie niemand. Sie gehört dorthin, wo
          Eltern nach Beschäftigung für die Kinder schauen. GPS und Kompass
          starten erst auf Knopfdruck. */}
      <TreasureHunt />

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
            onClick={() => startQuiz(quiz)}
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

        {/* Natur-Quiz: bei jedem Start frisch aus dem Lexikon erzeugt */}
        <button
          type="button"
          onClick={startNatureLexiconQuiz}
          className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.99]"
          aria-label={t.family.startQuizAria(t.family.lexiconQuizTitle)}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Leaf className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="font-semibold">{t.family.lexiconQuizTitle}</span>
          <span className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">
              {t.family.questionCount(NATURE_QUIZ_QUESTIONS)}
            </Badge>
            <Badge variant="outline">{t.family.lexiconQuizBadge}</Badge>
          </span>
          <span className="text-xs text-muted-foreground">
            {t.family.lexiconQuizHint}
          </span>
        </button>

        {/* Eigene Quizze: spielbar über denselben Player, mit «Eigenes»-Badge */}
        {isAuthenticated &&
          (customQuizzesQuery.data ?? []).map(row => {
            const quiz = customQuizToNatureQuiz(row);
            return (
              <div
                key={row.id}
                className="flex flex-col rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => startQuiz(quiz)}
                  className="flex flex-1 flex-col items-start gap-2 text-left active:scale-[0.99]"
                  aria-label={t.family.startQuizAria(row.title)}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <CompassIcon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="font-semibold">{row.title}</span>
                  <span className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary">
                      {t.family.questionCount(quiz.questions.length)}
                    </Badge>
                    <Badge variant="outline">{t.family.ownBadge}</Badge>
                    {row.shareToken != null && (
                      <Badge variant="outline">
                        {t.family.quizSharedBadge}
                      </Badge>
                    )}
                  </span>
                </button>
                <div className="mt-3 flex items-center gap-4 border-t border-border/60 pt-2.5 text-xs">
                  <button
                    type="button"
                    onClick={() => startQuiz(quiz)}
                    className="font-medium text-primary hover:underline"
                  >
                    {t.family.play}
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuizEditorState(row)}
                    className="flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    <Pencil className="h-3 w-3" aria-hidden="true" />
                    {t.common.edit}
                  </button>
                  <button
                    type="button"
                    disabled={shareQuizMutation.isPending}
                    onClick={() => openQuizShare(row)}
                    className="flex items-center gap-1 font-medium text-primary hover:underline disabled:opacity-50"
                    aria-label={t.family.quizShareAria(row.title)}
                  >
                    <Share2 className="h-3 w-3" aria-hidden="true" />
                    {t.family.quizShareButton}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        await ask({
                          title: t.family.quizDeleteConfirm(row.title),
                        })
                      ) {
                        removeQuizMutation.mutate({ id: row.id });
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
        {isAuthenticated && (
          <button
            type="button"
            onClick={() => setQuizEditorState("neu")}
            className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary/50 p-4 text-primary transition-all hover:border-primary hover:bg-accent/40 active:scale-[0.99]"
            aria-label={t.family.newQuizAria}
          >
            <Plus className="h-6 w-6" aria-hidden="true" />
            <span className="text-sm font-semibold">{t.family.newQuiz}</span>
          </button>
        )}
      </div>

      {/* «Wie weit noch?» – Fortschrittsbalken zur Ankunft für den Rücksitz */}
      <div className="mt-8">
        <ArrivalProgress />
      </div>

      {/* Reise-Bingo für die Fahrt – läuft ohne Konto und ohne Empfang */}
      <TravelBingo />

      {/* Gute-Nacht-Geschichten – zum Vorlesen im Zelt */}
      <BedtimeStories />

      {/* «Wer spielt?»: Kind wählen, bevor Jagd/Quiz startet */}
      <Dialog
        open={pendingActivity !== null}
        onOpenChange={open => !open && setPendingActivity(null)}
      >
        {pendingActivity !== null && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">
                {t.family.whoPlaysTitle}
              </DialogTitle>
              <DialogDescription>
                {t.family.whoPlaysDescription}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              {children.map(child => (
                <Button
                  key={child.id}
                  variant={child.id === activeChildId ? "default" : "outline"}
                  onClick={() => chooseChild(child.id)}
                >
                  {child.name}
                </Button>
              ))}
              {"quiz" in pendingActivity && children.length >= 2 && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setDuelSetup({ quiz: pendingActivity.quiz, firstId: null });
                    setPendingActivity(null);
                  }}
                >
                  <Swords className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {t.family.duelMode}
                </Button>
              )}
              <Button variant="ghost" onClick={() => chooseChild(null)}>
                {t.family.whoPlaysNobody}
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Duell-Aufbau: erst das startende, dann das zweite Kind wählen */}
      <Dialog
        open={duelSetup !== null}
        onOpenChange={open => !open && setDuelSetup(null)}
      >
        {duelSetup !== null && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">
                {t.family.duelSetupTitle}
              </DialogTitle>
              <DialogDescription>
                {t.family.duelSetupDescription}
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm font-medium" role="status">
              {duelSetup.firstId === null
                ? t.family.duelPickFirst
                : `${t.family.duelFirstChosen(
                    children.find(c => c.id === duelSetup.firstId)?.name ?? ""
                  )} ${t.family.duelPickSecond}`}
            </p>
            <div className="grid gap-2">
              {children
                .filter(c => c.id !== duelSetup.firstId)
                .map(child => (
                  <Button
                    key={child.id}
                    variant="outline"
                    onClick={() => {
                      if (duelSetup.firstId === null) {
                        setDuelSetup({ ...duelSetup, firstId: child.id });
                        return;
                      }
                      const first = children.find(
                        c => c.id === duelSetup.firstId
                      );
                      if (!first) return;
                      setActiveDuel({
                        quiz: duelSetup.quiz,
                        players: [first, child],
                      });
                      setDuelSetup(null);
                    }}
                  >
                    {child.name}
                  </Button>
                ))}
            </div>
          </DialogContent>
        )}
      </Dialog>

      <Dialog
        open={activeHunt !== null}
        onOpenChange={open => !open && setActiveHunt(null)}
      >
        {activeHunt && (
          <HuntDialog
            hunt={activeHunt}
            bestTime={bestTimes[activeHunt.id] ?? null}
            onClose={() => setActiveHunt(null)}
            onCompleted={() => void handleCompleted({ type: "huntCompleted" })}
            onFinished={seconds => handleHuntFinished(activeHunt.id, seconds)}
          />
        )}
      </Dialog>
      <Dialog
        open={activeQuiz !== null}
        onOpenChange={open => !open && setActiveQuiz(null)}
      >
        {activeQuiz && (
          <QuizDialog
            quiz={activeQuiz}
            onClose={() => setActiveQuiz(null)}
            onCompleted={result =>
              void handleCompleted({ type: "quizCompleted", ...result })
            }
          />
        )}
      </Dialog>
      <Dialog
        open={activeDuel !== null}
        onOpenChange={open => !open && setActiveDuel(null)}
      >
        {activeDuel && (
          <DuelQuizDialog
            quiz={activeDuel.quiz}
            players={activeDuel.players}
            onClose={() => setActiveDuel(null)}
            onCompleted={results =>
              void handleDuelCompleted(activeDuel.players, results)
            }
          />
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
      <Dialog
        open={quizEditorState !== null}
        onOpenChange={open => !open && setQuizEditorState(null)}
      >
        {quizEditorState !== null && (
          <QuizEditorDialog
            initial={quizEditorState === "neu" ? null : quizEditorState}
            onClose={() => setQuizEditorState(null)}
          />
        )}
      </Dialog>

      {/* Teil-Link eines Quiz: Link + QR-Code, Teilen beenden */}
      <Dialog
        open={quizShare !== null}
        onOpenChange={open => !open && setQuizShare(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.family.quizShareTitle}</DialogTitle>
            <DialogDescription>
              {t.family.quizShareDescription}
            </DialogDescription>
          </DialogHeader>
          {quizShare && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                <Link2
                  className="h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <code className="min-w-0 flex-1 truncate text-xs">
                  {quizShare.url}
                </code>
                <button
                  type="button"
                  className="shrink-0 text-xs font-medium text-primary hover:underline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(quizShare.url);
                      toast.success(t.common.linkCopied);
                    } catch {
                      toast.error(t.common.copyFailed);
                    }
                  }}
                >
                  {t.common.copy}
                </button>
              </div>
              {quizQr && (
                <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
                  {/* Weisser Rahmen, damit der Code auch im Dark Mode scannbar bleibt */}
                  <div className="shrink-0 rounded-md bg-white p-2 shadow-sm">
                    <img
                      src={quizQr}
                      alt={t.family.quizQrAlt(quizShare.title)}
                      className="h-36 w-36"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-semibold">
                      <QrCode
                        className="h-4 w-4 text-primary"
                        aria-hidden="true"
                      />
                      {t.family.quizQrTitle}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.family.quizQrText}
                    </p>
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <ShareExpirySelect
                  value={quizExpiresIn}
                  onChange={days => {
                    setQuizExpiresIn(days);
                    openQuizShare(quizShare, days);
                  }}
                />
                <ShareExpiryNote expiresAt={quizShare.expiresAt} />
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={unshareQuizMutation.isPending}
                onClick={() => unshareQuizMutation.mutate({ id: quizShare.id })}
              >
                {t.family.quizUnshare}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
