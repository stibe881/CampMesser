/**
 * «Heute»-Ansicht während der Reise (#298).
 *
 * Auf dem Platz braucht niemand ein Menü aus vierzig Kacheln. Man will
 * wissen: welcher Tag ist das, wie wird das Wetter, was gibt es zu essen,
 * was steht noch an – und das, ohne zu suchen.
 *
 * OHNE LAUFENDE REISE ist die Seite ehrlich leer und zeigt den Weg zu den
 * Kacheln. Eine «Heute»-Ansicht im November hätte nichts zu sagen.
 *
 * Die Reihenfolge ist bewusst: Wetter zuerst, weil es den Tag bestimmt;
 * dann das Essen, weil das die nächste Frage ist; dann die Aufgaben.
 */
import { useMemo } from "react";
import { fmtWeekdayLong } from "@/lib/dateFormat";
import { Link } from "wouter";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  CloudSunRain,
  NotebookPen,
  ShoppingCart,
  Tent,
  UtensilsCrossed,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import LoginPrompt from "@/components/LoginPrompt";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { tripDisplayName } from "@shared/tripName";
import { trpc } from "@/lib/trpc";
import { LOCALE_TAGS, pick } from "@shared/i18n";
import { MEAL_LABELS } from "@shared/menuPlan";
import { currentTripDay } from "@shared/trips";
import {
  nightsLeft,
  openTasks,
  pickRunningTrip,
  todayMeals,
} from "@shared/todayView";
import { recipes } from "@/data/recipes";
import { loadTodayStart, saveTodayStart } from "@/lib/todayStart";
import { useSyncedSetting } from "@/lib/useSyncedSetting";
import { useState } from "react";

export default function TodayPage() {
  const { lang, t } = useI18n();
  const td = t.today;
  const { isAuthenticated, loading } = useAuth();

  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const today = new Date().toISOString().slice(0, 10);
  const trip = useMemo(
    () => pickRunningTrip(tripsQuery.data ?? [], today),
    [tripsQuery.data, today]
  );

  const menuQuery = trpc.menu.listByTrip.useQuery(
    { tripId: trip?.id ?? 0 },
    { enabled: Boolean(trip) }
  );
  const boardQuery = trpc.trips.board.list.useQuery(
    { tripId: trip?.id ?? 0 },
    { enabled: Boolean(trip) }
  );
  const customQuery = trpc.recipes.list.useQuery(undefined, {
    enabled: Boolean(trip),
    staleTime: 5 * 60_000,
  });

  // Einstellung «mit Heute starten» – hier, wo man sie braucht
  const [startWithToday, setStartWithToday] = useState(() => loadTodayStart());
  const startSync = useSyncedSetting<unknown>("todayStart", value => {
    if (typeof value !== "boolean") return;
    setStartWithToday(value);
    saveTodayStart(value);
  });
  const toggleStart = (next: boolean) => {
    setStartWithToday(next);
    saveTodayStart(next);
    startSync.push(next);
  };

  const meals = useMemo(
    () => todayMeals(menuQuery.data?.entries ?? [], today),
    [menuQuery.data, today]
  );
  const tasks = useMemo(
    () => openTasks(boardQuery.data ?? []),
    [boardQuery.data]
  );

  /** Was auf dem Teller steht – Rezeptname oder Freitext. */
  const mealText = (entry: {
    recipeId: string | null;
    customRecipeId: number | null;
    freeText: string | null;
  }) => {
    if (entry.freeText) return entry.freeText;
    if (entry.recipeId) {
      const recipe = recipes.find(r => r.id === entry.recipeId);
      if (recipe) return pick(recipe.name, lang);
    }
    if (entry.customRecipeId != null) {
      const own = (customQuery.data ?? []).find(
        r => r.id === entry.customRecipeId
      );
      if (own) return own.name;
    }
    return td.mealUnknown;
  };

  if (loading) {
    return (
      <div className="container max-w-2xl py-6">
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }
  if (!isAuthenticated) return <LoginPrompt feature={td.title} />;

  const progress = trip ? currentTripDay(trip, today) : null;
  // Ortsname wie auf der Startseite: Titel, sonst Platz-Name, sonst Freitext
  const place = trip ? tripDisplayName(trip, lang) : "";
  const nights = trip ? nightsLeft(trip, today) : null;

  return (
    <div className="container max-w-2xl py-6">
      <PageHeader
        title={td.title}
        subtitle={fmtWeekdayLong(new Date(), lang)}
      />

      {tripsQuery.isLoading ? (
        <Skeleton className="h-40 w-full rounded-lg" />
      ) : !trip ? (
        // Ohne laufende Reise ehrlich leer statt künstlich gefüllt
        <div className="rounded-xl border border-dashed border-border p-6 text-center">
          <Tent
            className="mx-auto mb-2 h-8 w-8 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">{td.noTrip}</p>
          <Button asChild variant="outline" className="mt-3">
            <Link href="/">{td.toModules}</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="rounded-xl border-2 border-primary/40 bg-accent/30 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {progress ? td.dayOf(progress.day, progress.total) : ""}
            </p>
            <h2 className="mt-0.5 flex items-center gap-2 text-xl font-semibold">
              <Tent className="h-5 w-5 text-primary" aria-hidden="true" />
              {place}
            </h2>
            {nights !== null && (
              <p className="mt-1 text-sm text-muted-foreground">
                {nights === 0 ? td.departureToday : td.nightsLeft(nights)}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/wetter">
                  <CloudSunRain className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {td.weather}
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`/menueplan/${trip.id}`}>
                  <UtensilsCrossed
                    className="mr-1.5 h-4 w-4"
                    aria-hidden="true"
                  />
                  {td.menu}
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`/reise-einkauf/${trip.id}`}>
                  <ShoppingCart className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {td.shopping}
                </Link>
              </Button>
            </div>
          </div>

          {/* Essen: die zweite Frage des Tages */}
          <section className="mt-4 rounded-xl border border-border bg-card p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <UtensilsCrossed
                className="h-4 w-4 text-primary"
                aria-hidden="true"
              />
              {td.mealsTitle}
            </h3>
            {menuQuery.isLoading ? (
              <Skeleton className="mt-2 h-16 w-full rounded" />
            ) : meals.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {td.mealsEmpty}
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {meals.map(({ meal, entry }) => (
                  <li key={meal} className="flex gap-2 text-sm">
                    <span className="w-24 shrink-0 text-muted-foreground">
                      {pick(MEAL_LABELS[meal], lang)}
                    </span>
                    <span className="min-w-0 font-medium">
                      {mealText(entry)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Aufgaben: was noch offen ist */}
          <section className="mt-4 rounded-xl border border-border bg-card p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <ClipboardList
                className="h-4 w-4 text-primary"
                aria-hidden="true"
              />
              {td.tasksTitle}
            </h3>
            {boardQuery.isLoading ? (
              <Skeleton className="mt-2 h-16 w-full rounded" />
            ) : tasks.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {td.tasksEmpty}
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {tasks.map(task => (
                  <li key={task.id} className="flex gap-2 text-sm">
                    <span aria-hidden="true">•</span>
                    <span className="min-w-0">{task.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/tagebuch">
                <NotebookPen className="mr-2 h-4 w-4" aria-hidden="true" />
                {td.journal}
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/">
                <CalendarDays className="mr-2 h-4 w-4" aria-hidden="true" />
                {td.toModules}
                <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </>
      )}

      {/* Die Einstellung steht dort, wo sie wirkt */}
      <div className="mt-6 flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background p-3">
        <Label htmlFor="today-start" className="text-sm font-normal">
          {td.startSetting}
        </Label>
        <Switch
          id="today-start"
          checked={startWithToday}
          onCheckedChange={toggleStart}
        />
      </div>

      <p className="mt-3 text-xs text-muted-foreground">{td.note}</p>
    </div>
  );
}
