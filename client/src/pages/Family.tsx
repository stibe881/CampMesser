import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Baby,
  BadgeCheck,
  Compass as CompassIcon,
  Gift,
  Lightbulb,
  ListChecks,
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
import { Card, CardContent } from "@/components/ui/card";
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
  type NatureQuiz,
  type ScavengerHunt,
} from "@/data/familyActivities";
import { familyAddOns } from "@shared/packTemplates";
import { MAX_STATIONS, parseHuntStations } from "@shared/hunts";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { customHuntToScavengerHunt, type CustomHuntRow } from "@/lib/customHunts";
import { cn } from "@/lib/utils";

/** Formular-Zustand einer Station im Editor. */
interface EditorStation {
  title: string;
  story: string;
  task: string;
  hint: string;
  letter: string;
}

const emptyStation = (index: number): EditorStation => ({
  title: `Station ${index + 1}`,
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
  const utils = trpc.useUtils();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [ageHint, setAgeHint] = useState(initial?.ageHint ?? "");
  const [duration, setDuration] = useState(String(initial?.durationMinutes ?? 30));
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
    return [emptyStation(0)];
  });

  const saveMutation = trpc.hunts.save.useMutation({
    onSuccess: () => {
      utils.hunts.list.invalidate();
      toast.success(initial ? "Schnitzeljagd aktualisiert" : "Schnitzeljagd erstellt");
      onClose();
    },
    onError: e => toast.error(e.message || "Speichern fehlgeschlagen"),
  });

  const updateStation = (index: number, patch: Partial<EditorStation>) =>
    setStations(prev => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));

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
          {initial ? "Schnitzeljagd bearbeiten" : "Eigene Schnitzeljagd erstellen"}
        </DialogTitle>
        <DialogDescription>
          Geschichte, Stationen und Schatz-Finale – gespeichert in deinem Konto, spielbar und
          druckbar wie die eingebauten Jagden.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <div>
          <Label htmlFor="hunt-title">Titel</Label>
          <Input
            id="hunt-title"
            className="mt-1.5"
            placeholder="z. B. Das Geheimnis des Seeufers"
            value={title}
            maxLength={140}
            onChange={e => setTitle(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="hunt-age">Alter (optional)</Label>
            <Input
              id="hunt-age"
              className="mt-1.5"
              placeholder="z. B. ab 6 Jahren"
              value={ageHint}
              maxLength={80}
              onChange={e => setAgeHint(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="hunt-duration">Dauer (Minuten)</Label>
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
          <Label htmlFor="hunt-intro">Die Mission (Rahmengeschichte)</Label>
          <Textarea
            id="hunt-intro"
            className="mt-1.5"
            rows={3}
            placeholder="Wer braucht Hilfe? Was ist passiert? Was ist das Ziel?"
            value={intro}
            onChange={e => setIntro(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="hunt-prep">Für die Erwachsenen (optional)</Label>
          <Textarea
            id="hunt-prep"
            className="mt-1.5"
            rows={2}
            placeholder="Was muss vorher versteckt oder vorbereitet werden?"
            value={preparation}
            onChange={e => setPreparation(e.target.value)}
          />
        </div>

        {/* Stationen */}
        <div>
          <p className="mb-2 text-sm font-semibold">Stationen ({stations.length})</p>
          <div className="space-y-3">
            {stations.map((s, i) => (
              <div key={i} className="rounded-lg border border-border p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Input
                    value={s.title}
                    maxLength={140}
                    onChange={e => updateStation(i, { title: e.target.value })}
                    aria-label={`Titel der Station ${i + 1}`}
                  />
                  <button
                    type="button"
                    disabled={stations.length <= 1}
                    onClick={() => setStations(prev => prev.filter((_, idx) => idx !== i))}
                    className="shrink-0 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-30"
                    aria-label={`Station ${i + 1} entfernen`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <Textarea
                  className="mb-2"
                  rows={2}
                  placeholder="Erzähltext (optional): Wie geht die Geschichte hier weiter?"
                  value={s.story}
                  onChange={e => updateStation(i, { story: e.target.value })}
                  aria-label={`Geschichte der Station ${i + 1}`}
                />
                <Textarea
                  className="mb-2"
                  rows={2}
                  placeholder="Aufgabe oder Rätsel, z. B. «Findet drei verschiedene Blätter»"
                  value={s.task}
                  onChange={e => updateStation(i, { task: e.target.value })}
                  aria-label={`Aufgabe der Station ${i + 1}`}
                />
                <div className="grid grid-cols-[1fr_5rem] gap-2">
                  <Input
                    placeholder="Hinweis, falls die Kinder feststecken (optional)"
                    value={s.hint}
                    maxLength={500}
                    onChange={e => updateStation(i, { hint: e.target.value })}
                    aria-label={`Hinweis der Station ${i + 1}`}
                  />
                  <Input
                    placeholder="Bst."
                    value={s.letter}
                    maxLength={1}
                    onChange={e => updateStation(i, { letter: e.target.value })}
                    aria-label={`Buchstabe der Station ${i + 1} fürs Lösungswort`}
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
              onClick={() => setStations(prev => [...prev, emptyStation(prev.length)])}
            >
              <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              Station hinzufügen
            </Button>
          )}
          {solutionPreview && (
            <p className="mt-2 text-xs text-muted-foreground">
              Lösungswort aus den Buchstaben: <span className="font-mono font-bold">{solutionPreview}</span>
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="hunt-finale">Das Finale (Schatz/Belohnung)</Label>
          <Textarea
            id="hunt-finale"
            className="mt-1.5"
            rows={2}
            placeholder="Was passiert, wenn alle Stationen geschafft sind?"
            value={finale}
            onChange={e => setFinale(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Abbrechen
          </Button>
          <Button
            className="flex-1"
            disabled={!canSave || saveMutation.isPending}
            onClick={() =>
              saveMutation.mutate({
                id: initial?.id,
                title: title.trim(),
                ageHint: ageHint.trim() || null,
                durationMinutes: Math.min(240, Math.max(5, Number(duration) || 30)),
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
            {saveMutation.isPending ? "Wird gespeichert …" : "Speichern"}
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

function HuntDialog({ hunt, onClose }: { hunt: ScavengerHunt; onClose: () => void }) {
  const [checked, setChecked] = useHuntProgress(hunt.id, hunt.stations.length);
  const [revealedHints, setRevealedHints] = useState<Record<number, boolean>>({});
  const doneCount = checked.filter(Boolean).length;
  const allDone = doneCount === hunt.stations.length;
  // Die nächste offene Station – nur bis dahin wird die Geschichte enthüllt
  const nextOpenIndex = checked.findIndex(c => !c);
  const visibleCount = nextOpenIndex === -1 ? hunt.stations.length : nextOpenIndex + 1;
  const collectedLetters = hunt.stations
    .map((s, i) => (checked[i] ? s.letter : undefined))
    .filter((l): l is string => Boolean(l));

  return (
    <DialogContent className="max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="font-serif text-xl">{hunt.title}</DialogTitle>
        <DialogDescription>
          {hunt.ageHint} · ca. {hunt.durationMinutes} Minuten
        </DialogDescription>
      </DialogHeader>
      <p className="rounded-lg bg-accent/60 p-3 text-sm italic text-accent-foreground">{hunt.intro}</p>
      {hunt.preparation && (
        <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
          {hunt.preparation}
        </p>
      )}
      <Progress
        value={(doneCount / hunt.stations.length) * 100}
        aria-label={`${doneCount} von ${hunt.stations.length} Stationen geschafft`}
      />

      {/* Gesammelte Buchstaben (falls die Jagd ein Lösungswort hat) */}
      {hunt.solutionWord && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2.5">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="text-sm font-medium">Gesammelte Buchstaben:</span>
          <span className="flex gap-1.5">
            {hunt.stations
              .filter(s => s.letter)
              .map((s, i) => (
                <span
                  key={i}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md border font-mono text-sm font-bold",
                    collectedLetters.length > i
                      ? "border-primary bg-accent text-primary"
                      : "border-dashed border-border text-transparent",
                  )}
                >
                  {collectedLetters.length > i ? collectedLetters[i] : "?"}
                </span>
              ))}
          </span>
        </div>
      )}

      <ol className="space-y-3">
        {hunt.stations.slice(0, visibleCount).map((station, i) => (
          <li
            key={i}
            className={cn(
              "rounded-xl border border-border bg-card p-4",
              checked[i] && "border-primary/30 bg-muted/50",
            )}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                id={`${hunt.id}-station-${i}`}
                checked={checked[i]}
                onCheckedChange={value =>
                  setChecked(prev => prev.map((c, idx) => (idx === i ? value === true : c)))
                }
                className="mt-0.5"
                aria-label={`Station geschafft: ${station.title}`}
              />
              <div className="min-w-0 flex-1">
                <label
                  htmlFor={`${hunt.id}-station-${i}`}
                  className={cn(
                    "cursor-pointer text-sm font-semibold",
                    checked[i] && "text-muted-foreground",
                  )}
                >
                  {station.title}
                  {station.letter && checked[i] && (
                    <span className="ml-2 rounded bg-accent px-1.5 py-0.5 font-mono text-xs font-bold text-primary">
                      Buchstabe: {station.letter}
                    </span>
                  )}
                </label>
                <p className="mt-1 text-xs italic text-muted-foreground">{station.story}</p>
                <p className={cn("mt-1.5 text-sm", checked[i] && "text-muted-foreground line-through")}>
                  {station.task}
                </p>
                {station.hint && !checked[i] && (
                  <div className="mt-2">
                    {revealedHints[i] ? (
                      <p className="flex items-start gap-1.5 rounded-md bg-muted p-2 text-xs text-muted-foreground">
                        <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-chart-4" aria-hidden="true" />
                        {station.hint}
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRevealedHints(prev => ({ ...prev, [i]: true }))}
                        className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
                        Hinweis anzeigen
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>

      {visibleCount < hunt.stations.length && (
        <p className="text-center text-xs text-muted-foreground">
          Noch {hunt.stations.length - visibleCount} geheime{" "}
          {hunt.stations.length - visibleCount === 1 ? "Station" : "Stationen"} – hake die aktuelle
          Station ab, um weiterzukommen!
        </p>
      )}

      {allDone && (
        <div className="space-y-3 rounded-xl bg-accent p-4">
          <div className="flex items-center gap-3">
            <PartyPopper className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
            <p className="font-serif text-base font-bold">
              {hunt.solutionWord
                ? `Lösungswort: ${hunt.solutionWord}`
                : "Alle Stationen geschafft!"}
            </p>
          </div>
          <p className="flex items-start gap-2 text-sm">
            <Gift className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            {hunt.finale}
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
          aria-label="Fortschritt zurücksetzen"
        >
          <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Neu starten
        </Button>
        <Button className="flex-1" onClick={onClose}>
          Fertig
        </Button>
      </div>
    </DialogContent>
  );
}

function QuizDialog({ quiz, onClose }: { quiz: NatureQuiz; onClose: () => void }) {
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
        <DialogTitle className="font-serif text-xl">{quiz.title}</DialogTitle>
        <DialogDescription>{quiz.ageHint}</DialogDescription>
      </DialogHeader>

      {finished ? (
        <div className="space-y-4 text-center">
          <Trophy className="mx-auto h-12 w-12 text-amber-glow" aria-hidden="true" />
          <p className="font-serif text-2xl font-bold">
            {score} von {quiz.questions.length} richtig!
          </p>
          <p className="text-sm text-muted-foreground">
            {score === quiz.questions.length
              ? "Perfekt – du bist bereit für die Wildnis!"
              : score >= quiz.questions.length / 2
                ? "Stark! Beim nächsten Mal schaffst du alle."
                : "Übung macht den Meister – probier es gleich nochmal!"}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={restart}>
              <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Nochmal
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
              Frage {current + 1} von {quiz.questions.length}
            </span>
            <span>{score} Punkte</span>
          </div>
          <Progress value={(current / quiz.questions.length) * 100} aria-label="Quiz-Fortschritt" />
          <p className="font-semibold">{question.question}</p>
          <div className="space-y-2">
            {question.options.map((option, idx) => {
              const isCorrect = idx === question.correctIndex;
              const isSelected = answered === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => answer(idx)}
                  disabled={answered !== null}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left text-sm font-medium transition-all",
                    answered === null && "border-border bg-card hover:border-primary/50",
                    answered !== null && isCorrect && "border-primary bg-accent",
                    answered !== null && isSelected && !isCorrect && "border-destructive bg-destructive/10",
                    answered !== null && !isSelected && !isCorrect && "border-border opacity-60",
                  )}
                  aria-label={`Antwort: ${option}`}
                >
                  {option}
                  {answered !== null && isCorrect && (
                    <BadgeCheck className="ml-2 inline h-4 w-4 text-primary" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
          {answered !== null && (
            <>
              <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                {question.explanation}
              </p>
              <Button className="w-full" onClick={next}>
                {current + 1 >= quiz.questions.length ? "Ergebnis anzeigen" : "Nächste Frage"}
              </Button>
            </>
          )}
        </div>
      )}
    </DialogContent>
  );
}

export default function FamilyPage() {
  const [activeHunt, setActiveHunt] = useState<ScavengerHunt | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<NatureQuiz | null>(null);
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const customHuntsQuery = trpc.hunts.list.useQuery(undefined, { enabled: isAuthenticated });
  // null = Editor zu, "neu" = neue Jagd, sonst die zu bearbeitende Jagd
  const [editorState, setEditorState] = useState<CustomHuntRow | "neu" | null>(null);
  const removeHuntMutation = trpc.hunts.remove.useMutation({
    onSuccess: () => utils.hunts.list.invalidate(),
    onError: () => toast.error("Löschen fehlgeschlagen"),
  });

  return (
    <div className="container py-6">
      <PageHeader
        title="Familien-Modus"
        subtitle="Kindersichere Packlisten, Beschäftigung beim Zeltaufbau und spielerisches Naturwissen."
      />

      <div className="mb-6 flex items-center gap-2 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        Schnitzeljagden und Quizze funktionieren komplett offline – ideal für abgelegene Zeltplätze.
      </div>

      {/* Checklisten-Pakete */}
      <h2 className="mb-3 font-serif text-xl font-semibold">Checklisten für Familien</h2>
      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        {familyAddOns.map(addOn => (
          <Card key={addOn.id}>
            <CardContent className="pt-6">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Baby className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <p className="font-semibold">{addOn.label}</p>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">{addOn.description}</p>
              <ul className="mb-4 space-y-1 text-sm">
                {addOn.items.slice(0, 4).map(item => (
                  <li key={item.name} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                    {item.name}
                  </li>
                ))}
                {addOn.items.length > 4 && (
                  <li className="text-xs text-muted-foreground">
                    … und {addOn.items.length - 4} weitere Einträge
                  </li>
                )}
              </ul>
              <Button asChild variant="outline" size="sm">
                <Link href="/packlisten" aria-label="Zu den Packlisten, um das Paket hinzuzufügen">
                  <ListChecks className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Zu einer Packliste hinzufügen
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Schnitzeljagden */}
      <h2 className="mb-1 font-serif text-xl font-semibold">Schnitzeljagden</h2>
      <p className="mb-3 text-sm text-muted-foreground">
        Beschäftigung für die Kinder, während das Zelt steht – der Fortschritt wird auf dem Gerät gespeichert.
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
              aria-label={`Schnitzeljagd ${hunt.title} starten`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Map className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-semibold">{hunt.title}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {hunt.ageHint} · ca. {hunt.durationMinutes} Min. · {hunt.stations.length} Stationen
                </span>
                <span className="mt-1.5 line-clamp-2 block text-xs italic text-muted-foreground">
                  {hunt.intro}
                </span>
              </span>
            </button>
            <div className="mt-3 flex items-center gap-4 border-t border-border/60 pt-2.5 text-xs">
              <button
                type="button"
                onClick={() => setActiveHunt(hunt)}
                className="font-medium text-primary hover:underline"
              >
                Auf dem Handy spielen
              </button>
              <Link
                href={`/familie/drucken/${hunt.id}`}
                className="font-medium text-primary hover:underline"
              >
                Zum Ausdrucken (PDF)
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Eigene Schnitzeljagden */}
      {isAuthenticated && (
        <>
          <h2 className="mb-1 font-serif text-xl font-semibold">Eigene Schnitzeljagden</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Erfinde eigene Abenteuer – perfekt zugeschnitten auf euren Zeltplatz und das Alter
            deiner Kinder.
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
                    aria-label={`Schnitzeljagd ${row.title} starten`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Map className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block font-semibold">{row.title}</span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {hunt.ageHint} · ca. {row.durationMinutes} Min. · {hunt.stations.length}{" "}
                        Stationen
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
                      Spielen
                    </button>
                    <Link
                      href={`/familie/drucken/${hunt.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      Drucken
                    </Link>
                    <button
                      type="button"
                      onClick={() => setEditorState(row)}
                      className="flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                      <Pencil className="h-3 w-3" aria-hidden="true" />
                      Bearbeiten
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Schnitzeljagd «${row.title}» wirklich löschen?`)) {
                          removeHuntMutation.mutate({ id: row.id });
                        }
                      }}
                      className="ml-auto flex items-center gap-1 font-medium text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" aria-hidden="true" />
                      Löschen
                    </button>
                  </div>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => setEditorState("neu")}
              className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary/50 p-4 text-primary transition-all hover:border-primary hover:bg-accent/40 active:scale-[0.99]"
              aria-label="Neue Schnitzeljagd erstellen"
            >
              <Plus className="h-6 w-6" aria-hidden="true" />
              <span className="text-sm font-semibold">Neue Jagd erstellen</span>
            </button>
          </div>
        </>
      )}

      {/* Natur-Quizze */}
      <h2 className="mb-1 font-serif text-xl font-semibold">Natur-Quizze</h2>
      <p className="mb-3 text-sm text-muted-foreground">
        Spielerisch lernen – passend zum <Link href="/natur" className="font-medium text-primary hover:underline">Natur-Entdecker-Lexikon</Link>.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {natureQuizzes.map(quiz => (
          <button
            key={quiz.id}
            type="button"
            onClick={() => setActiveQuiz(quiz)}
            className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.99]"
            aria-label={`Quiz ${quiz.title} starten`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <CompassIcon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-semibold">{quiz.title}</span>
            <Badge variant="secondary">{quiz.questions.length} Fragen</Badge>
            <span className="text-xs text-muted-foreground">{quiz.ageHint}</span>
          </button>
        ))}
      </div>

      <Dialog open={activeHunt !== null} onOpenChange={open => !open && setActiveHunt(null)}>
        {activeHunt && <HuntDialog hunt={activeHunt} onClose={() => setActiveHunt(null)} />}
      </Dialog>
      <Dialog open={activeQuiz !== null} onOpenChange={open => !open && setActiveQuiz(null)}>
        {activeQuiz && <QuizDialog quiz={activeQuiz} onClose={() => setActiveQuiz(null)} />}
      </Dialog>
      <Dialog open={editorState !== null} onOpenChange={open => !open && setEditorState(null)}>
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
