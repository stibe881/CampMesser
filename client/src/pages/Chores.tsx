/**
 * Ämtli-Plan im Camp (#270): Aufgaben verteilen, Kinder sammeln Punkte.
 *
 * Verteilt wird per Rotation und nicht per Zufall – wer heute abwäscht,
 * holt morgen Holz. Das ist für Kinder nachrechenbar, und genau darum
 * geht es beim Ämtli-Streit.
 *
 * Die Kinder kommen aus dem Familien-Modus; ein zweites Namensverzeichnis
 * wollte niemand pflegen.
 */
import { useMemo, useState } from "react";
import {
  Check,
  ClipboardList,
  Plus,
  Shuffle,
  Trash2,
  Trophy,
  Users,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import PageHeader from "@/components/PageHeader";
import RewardGoals from "@/components/family/RewardGoals";
import LoginPrompt from "@/components/LoginPrompt";
import { useConfirm } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { enqueueToggle } from "@/lib/offlineQueue";
import { hapticTick } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { fmtDayMonth } from "@/lib/dateFormat";
import { todayIso } from "@shared/localDate";
import { weeklyPointsHistory } from "@shared/choreHistory";
import {
  DEFAULT_CHORE_POINTS,
  MAX_CHORE_POINTS,
  MAX_CHORE_TITLE_LENGTH,
  MIN_CHORE_POINTS,
  dayProgress,
  scoreboard,
} from "@shared/chores";
import { newlyReachableRewards } from "@shared/rewards";

export default function ChoresPage() {
  const ask = useConfirm();
  const { lang, t } = useI18n();
  const tc = t.chores;
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();

  const [day, setDay] = useState(todayIso);
  const [newPerson, setNewPerson] = useState("");
  const [form, setForm] = useState({
    title: "",
    points: String(DEFAULT_CHORE_POINTS),
  });

  const choresQuery = trpc.chores.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const childrenQuery = trpc.family.children.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const dayQuery = trpc.chores.assignments.useQuery(
    { day },
    { enabled: isAuthenticated }
  );
  // Für den Punktestand zählen alle Tage, nicht nur der gewählte
  const allQuery = trpc.chores.assignments.useQuery(
    {},
    { enabled: isAuthenticated }
  );
  // Für den Ziel-erreicht-Moment (#413) – dieselben Abfragen wie in
  // RewardGoals, React Query dedupliziert sie.
  const rewardsQuery = trpc.rewards.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const redemptionsQuery = trpc.rewards.redemptions.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const chores = useMemo(() => choresQuery.data ?? [], [choresQuery.data]);
  const children = useMemo(
    () => childrenQuery.data ?? [],
    [childrenQuery.data]
  );
  const dayAssignments = useMemo(() => dayQuery.data ?? [], [dayQuery.data]);
  const allAssignments = useMemo(() => allQuery.data ?? [], [allQuery.data]);

  const refresh = () => {
    void utils.chores.list.invalidate();
    void utils.chores.assignments.invalidate();
  };
  /**
   * PERSONEN DIREKT HIER PFLEGEN (#370, Nutzerwunsch): Bisher stand nur
   * «Im Familien-Modus trägst du sie ein» da – ein Verweis auf eine
   * andere Seite, mitten in der Arbeit. Es ist dieselbe Liste (die
   * Kinder-Profile), sie lässt sich jetzt bloss auch von hier aus
   * ergänzen.
   */
  const refreshPersons = () => void utils.family.children.list.invalidate();
  const addPerson = trpc.family.children.add.useMutation({
    onSuccess: () => {
      setNewPerson("");
      toast.success(tc.personAdded);
      refreshPersons();
    },
    onError: e => toast.error(e.message),
  });
  const setEarnsPoints = trpc.family.children.setEarnsPoints.useMutation({
    onSuccess: refreshPersons,
    onError: e => toast.error(e.message),
  });
  const removePerson = trpc.family.children.remove.useMutation({
    onSuccess: () => {
      refreshPersons();
      refresh();
    },
    onError: e => toast.error(e.message),
  });
  const addChore = trpc.chores.add.useMutation({
    onSuccess: () => {
      setForm({ title: "", points: String(DEFAULT_CHORE_POINTS) });
      refresh();
    },
    onError: e => toast.error(e.message),
  });
  const removeChore = trpc.chores.remove.useMutation({
    onSuccess: refresh,
    onError: e => toast.error(e.message),
  });
  const autoAssign = trpc.chores.autoAssign.useMutation({
    onSuccess: refresh,
    onError: e => toast.error(e.message),
  });
  const assign = trpc.chores.assign.useMutation({
    onSuccess: refresh,
    onError: e => toast.error(e.message),
  });
  /**
   * Ämtli abhaken – optimistisch und offline gepuffert (#320).
   *
   * Abgehakt wird auf dem Platz, also dort, wo kein Empfang ist. Vorher
   * wartete der Haken auf die Antwort des Servers und war beim nächsten
   * App-Start wieder weg; jetzt steht er sofort und wird nachgeschickt,
   * sobald wieder Verbindung besteht (components/OfflineSync.tsx).
   */
  const setDone = trpc.chores.setDone.useMutation({
    onMutate: async input => {
      hapticTick();
      if (!navigator.onLine) enqueueToggle("chore", input.id, input.done);
      await utils.chores.assignments.cancel();
      const stamp = input.done ? new Date() : null;
      // BEIDE Abfragen anpassen: die des Tages und die für den
      // Punktestand. Sonst springt der Zähler unten erst nach dem
      // nächsten Laden – und sieht dann aus wie ein Fehler.
      const patch = (rows: typeof dayAssignments | undefined) =>
        rows?.map(row =>
          row.id === input.id ? { ...row, doneAt: stamp } : row
        );
      utils.chores.assignments.setData({ day }, patch);
      utils.chores.assignments.setData({}, patch);
    },
    onSuccess: refresh,
    onError: e => {
      toast.error(e.message);
      refresh();
    },
  });

  const progress = dayProgress(dayAssignments);
  const scores = scoreboard(children, chores, allAssignments);
  // Punkte-Verlauf (#431): wochenweise, aus denselben Zuteilungen
  const history = useMemo(
    () => weeklyPointsHistory(children, chores, allAssignments, todayIso()),
    [children, chores, allAssignments]
  );

  if (loading) return null;
  if (!isAuthenticated) {
    return (
      <div className="container max-w-3xl py-6">
        <PageHeader title={tc.title} subtitle={tc.subtitle} />
        <LoginPrompt feature={tc.loginFeature} />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader title={tc.title} subtitle={tc.subtitle} />

      {/* Personen (#370): dieselbe Liste wie im Familien-Modus, hier
          ergänzbar – und mit dem Schalter, der über die Punkte entscheidet. */}
      <Card className="mb-5">
        <CardContent className="pt-5">
          <p className="mb-1 flex items-center gap-2 font-serif text-lg font-bold">
            <Users className="h-5 w-5 text-primary" aria-hidden="true" />
            {tc.personsTitle}
          </p>
          <p className="mb-3 text-xs text-muted-foreground">{tc.personsHint}</p>
          {children.length === 0 ? (
            <p className="mb-3 rounded-lg border border-amber-600/40 bg-amber-500/10 p-3 text-sm">
              {tc.noChildren}
            </p>
          ) : (
            <ul className="mb-3 space-y-2">
              {children.map(child => (
                <li
                  key={child.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background p-2.5"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {child.name}
                  </span>
                  <Label
                    htmlFor={`earns-${child.id}`}
                    className="text-xs text-muted-foreground"
                  >
                    {tc.earnsPointsLabel}
                  </Label>
                  <Switch
                    id={`earns-${child.id}`}
                    checked={child.earnsPoints !== false}
                    disabled={setEarnsPoints.isPending}
                    onCheckedChange={value =>
                      setEarnsPoints.mutate({
                        id: child.id,
                        earnsPoints: value,
                      })
                    }
                    aria-label={tc.earnsPointsAria(child.name)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground/60 hover:text-destructive"
                    disabled={removePerson.isPending}
                    onClick={async () => {
                      if (
                        await ask({
                          title: tc.removePersonConfirm(child.name),
                          confirmLabel: t.common.delete,
                        })
                      ) {
                        removePerson.mutate({ id: child.id });
                      }
                    }}
                    aria-label={tc.removePersonAria(child.name)}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <Input
              value={newPerson}
              onChange={e => setNewPerson(e.target.value)}
              placeholder={tc.addPersonPlaceholder}
              maxLength={60}
              aria-label={tc.addPerson}
              onKeyDown={e => {
                if (e.key === "Enter" && newPerson.trim()) {
                  addPerson.mutate({ name: newPerson.trim() });
                }
              }}
            />
            <Button
              onClick={() => addPerson.mutate({ name: newPerson.trim() })}
              disabled={!newPerson.trim() || addPerson.isPending}
            >
              <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {tc.addPerson}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tag wählen und verteilen */}
      <div className="mb-5 flex flex-wrap items-end gap-2">
        <div>
          <Label htmlFor="chore-day">{tc.dayLabel}</Label>
          <Input
            id="chore-day"
            type="date"
            value={day}
            onChange={e => setDay(e.target.value)}
            className="w-44"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => autoAssign.mutate({ day })}
          disabled={
            autoAssign.isPending || chores.length === 0 || children.length === 0
          }
        >
          <Shuffle className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {tc.distribute}
        </Button>
      </div>

      {/* Wochenplan drucken (#430): der Plan hängt am besten am
          Kühlschrank im Vorzelt. */}
      {chores.length > 0 && children.length > 0 && (
        <Button asChild variant="outline" size="sm" className="mb-4">
          <Link href="/aemtli/drucken">
            <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {t.choresPrint.openButton}
          </Link>
        </Button>
      )}

      {dayAssignments.length > 0 && (
        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-semibold">{tc.dayPlanTitle}</span>
            <span className="text-muted-foreground">
              {tc.progressLine(progress.done, progress.total)}
            </span>
          </div>
          <Progress value={progress.percent} aria-label={tc.progressAria} />
        </div>
      )}

      <ul className="mb-6 space-y-2">
        {dayAssignments.map(assignment => {
          const chore = chores.find(c => c.id === assignment.choreId);
          if (!chore) return null;
          const done = assignment.doneAt !== null;
          return (
            <li
              key={assignment.id}
              className={cn(
                "flex flex-wrap items-center gap-3 rounded-lg border p-3",
                done
                  ? "border-primary/50 bg-accent/40"
                  : "border-border bg-card"
              )}
            >
              <button
                type="button"
                onClick={() => {
                  // Ziel-erreicht-Moment (#413): Nur beim ABHAKEN und nur
                  // mit geladenen Zielen/Einlösungen – ein falsches «genug
                  // Punkte!» wäre schlimmer als ein verpasstes.
                  if (
                    !done &&
                    assignment.childId !== null &&
                    rewardsQuery.data &&
                    redemptionsQuery.data
                  ) {
                    const { childId } = assignment;
                    const row = scores.find(s => s.childId === childId);
                    const reached = row
                      ? newlyReachableRewards(
                          rewardsQuery.data,
                          redemptionsQuery.data,
                          childId,
                          row.points,
                          row.points + chore.points
                        )
                      : [];
                    if (reached.length > 0) {
                      toast.success(
                        t.rewards.reachedToast(row!.name, reached[0].title)
                      );
                    }
                  }
                  setDone.mutate({ id: assignment.id, done: !done });
                }}
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border"
                )}
                aria-pressed={done}
                aria-label={tc.toggleAria(chore.title)}
              >
                {done && <Check className="h-4 w-4" aria-hidden="true" />}
              </button>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block text-sm font-medium",
                    done && "line-through opacity-70"
                  )}
                >
                  {chore.title}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {tc.pointsLine(chore.points)}
                </span>
              </span>
              <select
                value={assignment.childId ?? ""}
                onChange={e =>
                  assign.mutate({
                    id: assignment.id,
                    childId: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                aria-label={tc.assignAria(chore.title)}
              >
                <option value="">{tc.unassigned}</option>
                {children.map(child => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </select>
            </li>
          );
        })}
      </ul>

      {/* Punktestand */}
      {scores.length > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-5">
            <p className="mb-3 flex items-center gap-2 font-serif text-lg font-bold">
              <Trophy className="h-5 w-5 text-chart-1" aria-hidden="true" />
              {tc.scoreTitle}
            </p>
            <ul className="space-y-1.5">
              {scores.map((row, index) => (
                <li
                  key={row.childId}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className="w-5 text-muted-foreground">
                    {index + 1}.
                  </span>
                  <span className="flex-1 font-medium">{row.name}</span>
                  <span className="tabular-nums">
                    {tc.scoreLine(row.points, row.done)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">{tc.scoreHint}</p>

            {/* Punkte-Verlauf pro Kind (#431): Wochenbalken statt nur Stand */}
            {history && (
              <div className="mt-4 border-t border-border pt-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {tc.historyTitle}
                </p>
                <div className="space-y-3">
                  {history.rows.map(row => (
                    <div key={row.childId}>
                      <p className="mb-1 text-xs font-medium">{row.name}</p>
                      <div className="flex items-end gap-1.5">
                        {row.points.map((points, i) => (
                          <div
                            key={history.weekStarts[i]}
                            className="min-w-0 flex-1"
                          >
                            <div
                              className="flex h-10 items-end overflow-hidden rounded bg-muted"
                              role="img"
                              aria-label={tc.historyBarAria(
                                fmtDayMonth(history.weekStarts[i], lang),
                                points
                              )}
                            >
                              <div
                                className="w-full rounded bg-chart-1"
                                style={{
                                  height: `${Math.round((points / history.maxPoints) * 100)}%`,
                                }}
                              />
                            </div>
                            <p className="mt-0.5 text-center text-[10px] tabular-nums text-muted-foreground">
                              {points}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-1.5" aria-hidden="true">
                    {history.weekStarts.map(start => (
                      <p
                        key={start}
                        className="min-w-0 flex-1 text-center text-[10px] text-muted-foreground"
                      >
                        {fmtDayMonth(start, lang)}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Belohnungs-Ziele (#399): Die Punkte direkt unter der Rangliste
          einlösbar machen – ohne Ziel ist die Tabelle nur eine Tabelle. */}
      <RewardGoals scores={scores} className="mb-6" />

      {/* Ämtli-Katalog */}
      <h2 className="mb-2 font-serif text-lg font-bold">{tc.choresTitle}</h2>
      <ul className="mb-3 space-y-2">
        {chores.map(chore => (
          <li
            key={chore.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
          >
            <ClipboardList
              className="h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 text-sm">{chore.title}</span>
            <span className="text-xs text-muted-foreground">
              {tc.pointsLine(chore.points)}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeChore.mutate({ id: chore.id })}
              aria-label={tc.removeAria(chore.title)}
            >
              <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-40 flex-1">
          <Label htmlFor="chore-title">{tc.newChore}</Label>
          <Input
            id="chore-title"
            value={form.title}
            maxLength={MAX_CHORE_TITLE_LENGTH}
            placeholder={tc.newChorePlaceholder}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
        </div>
        <div className="w-24">
          <Label htmlFor="chore-points">{tc.pointsLabel}</Label>
          <Input
            id="chore-points"
            type="number"
            inputMode="numeric"
            min={MIN_CHORE_POINTS}
            max={MAX_CHORE_POINTS}
            value={form.points}
            onChange={e => setForm(f => ({ ...f, points: e.target.value }))}
          />
        </div>
        <Button
          onClick={() =>
            addChore.mutate({
              title: form.title.trim(),
              points: Number(form.points) || DEFAULT_CHORE_POINTS,
            })
          }
          disabled={!form.title.trim() || addChore.isPending}
        >
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {tc.addChore}
        </Button>
      </div>

      <p className="mt-6 rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
        {tc.rotationHint}
      </p>
    </div>
  );
}
