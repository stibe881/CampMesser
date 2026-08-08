/**
 * «Heute»-Ansicht während der Reise (#298, ausgebaut in #330).
 *
 * Auf dem Platz braucht niemand ein Menü aus vierzig Kacheln. Man will
 * wissen: welcher Tag ist das, wie wird das Wetter, was gibt es zu essen,
 * was steht noch an – und das, ohne zu suchen.
 *
 * OHNE LAUFENDE REISE ist die Seite ehrlich leer und zeigt den Weg zu den
 * Kacheln. Eine «Heute»-Ansicht im November hätte nichts zu sagen.
 *
 * Die Reihenfolge ist bewusst: Wetter zuerst, weil es den Tag bestimmt;
 * dann das Essen, weil das die nächste Frage ist; dann die Handgriffe.
 *
 * WAS #330 DAZUGEBRACHT HAT, und warum: Die Seite ist WÄHREND der Reise
 * der Hauptbildschirm, zeigte aber zwei leere Kästen und drei Knöpfe, die
 * woanders hinführen. Neu stehen die Ämtli des Tages hier – mit Häkchen,
 * nicht als Verweis, denn ein Ämtli hakt man im Vorbeigehen ab und öffnet
 * dafür keine zweite Seite. Dazu, was in der Kühlbox heute oder morgen
 * abläuft: Das ist die einzige Information des Tages, die verdirbt.
 *
 * KEINE NEUEN ABFRAGEN OHNE REISE: Alles hängt an `enabled: Boolean(trip)`.
 * Wer die Seite im Winter öffnet, holt nichts.
 */
import { useMemo } from "react";
import { fmtWeekdayLong } from "@/lib/dateFormat";
import { Link } from "wouter";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ClipboardList,
  CloudSunRain,
  KeyRound,
  ListChecks,
  NotebookPen,
  Refrigerator,
  ShoppingCart,
  Tent,
  UtensilsCrossed,
  TriangleAlert,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import LoginPrompt from "@/components/LoginPrompt";
import QueryError from "@/components/QueryError";
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
import { expiryInfo, isUrgentExpiry } from "@shared/food";
import {
  nightsLeft,
  openTasks,
  pickRunningTrip,
  todayMeals,
} from "@shared/todayView";
import { recipes } from "@/data/recipes";
import { loadTodayStart, saveTodayStart } from "@/lib/todayStart";
import { useSyncedSetting } from "@/lib/useSyncedSetting";
import { useDayWeather } from "@/lib/useDayWeather";
import { weatherTurnTexts } from "@/components/WeatherTurnCard";
import { enqueueToggle } from "@/lib/offlineQueue";
import { hapticTick } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";
import { useTodayIso } from "@/lib/useTodayIso";
import CampfireLight from "@/components/CampfireLight";
import LazySection from "@/components/LazySection";
import BathingWaterCard from "@/components/spots/BathingWaterCard";
import { modules } from "@/data/modules";
import { tripKindPreset } from "@shared/tripKind";

export default function TodayPage() {
  const { lang, t } = useI18n();
  const td = t.today;
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();

  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const today = useTodayIso();
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

  // Der Zeltplatz liefert die Koordinaten fürs Wetter. Bei einer geteilten
  // Reise gehört der Platz jemand anderem – dann fehlen die Koordinaten,
  // und die Wetter-Zeile bleibt weg statt falsch zu sein.
  const spotsQuery = trpc.spots.list.useQuery(undefined, {
    enabled: Boolean(trip),
    staleTime: 5 * 60_000,
  });
  const spot =
    trip?.spotId != null
      ? (spotsQuery.data ?? []).find(s => s.id === trip.spotId)
      : undefined;
  // Koordinaten: Zeltplatz zuerst, sonst die der Reise aus der Ortssuche
  // (#465) – damit haben auch Hotel- und Strandreisen Wetter und Wasser.
  const coords = spot
    ? { latitude: spot.latitude, longitude: spot.longitude }
    : trip?.latitude != null && trip?.longitude != null
      ? { latitude: trip.latitude, longitude: trip.longitude }
      : null;
  const weather = useDayWeather(coords?.latitude, coords?.longitude, lang);

  const choresQuery = trpc.chores.assignments.useQuery(
    { day: today },
    { enabled: Boolean(trip) }
  );
  const choreListQuery = trpc.chores.list.useQuery(undefined, {
    enabled: Boolean(trip),
    staleTime: 5 * 60_000,
  });
  const foodQuery = trpc.food.list.useQuery(undefined, {
    enabled: Boolean(trip),
    staleTime: 60_000,
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

  /** Die Ämtli des Tages, mit ihrem Namen aus der Ämtli-Liste. */
  const chores = useMemo(() => {
    const names = new Map(
      (choreListQuery.data ?? []).map(chore => [chore.id, chore.title])
    );
    return (choresQuery.data ?? []).flatMap(row => {
      const title = names.get(row.choreId);
      return title ? [{ id: row.id, title, done: row.doneAt !== null }] : [];
    });
  }, [choresQuery.data, choreListQuery.data]);

  /**
   * Was heute oder morgen abläuft – mehr nicht.
   *
   * Dieselbe Schwelle wie beim App-Icon-Zähler (#132) und im Widget: Was
   * in fünf Tagen abläuft, ist keine Sache für heute, und eine Liste, die
   * jeden Tag dasselbe zeigt, liest bald niemand mehr.
   */
  const expiring = useMemo(
    () =>
      (foodQuery.data ?? []).flatMap(item => {
        if (!isUrgentExpiry(item.expiryDate, today)) return [];
        const info = expiryInfo(item.expiryDate, today, lang);
        return info
          ? [{ id: item.id, name: item.name, label: info.label }]
          : [];
      }),
    [foodQuery.data, today, lang]
  );

  /**
   * Ämtli abhaken – derselbe Weg wie auf der Ämtli-Seite (#320):
   * optimistisch und offline gepuffert. Abgehakt wird auf dem Platz, also
   * dort, wo kein Empfang ist.
   */
  const setDone = trpc.chores.setDone.useMutation({
    onMutate: async input => {
      hapticTick();
      if (!navigator.onLine) enqueueToggle("chore", input.id, input.done);
      await utils.chores.assignments.cancel();
      const stamp = input.done ? new Date() : null;
      utils.chores.assignments.setData({ day: today }, rows =>
        rows?.map(row =>
          row.id === input.id ? { ...row, doneAt: stamp } : row
        )
      );
    },
    onSuccess: () => {
      void utils.chores.assignments.invalidate();
    },
    onError: e => {
      toast.error(e.message);
      void utils.chores.assignments.invalidate();
    },
  });

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
  // Reise-Art (#460): Was diese Ansicht hervorhebt, entscheidet die Art
  // der laufenden Reise – Strandferien fragen nicht nach der
  // Lagerfeuer-Ampel, Camping nicht nach der Badewasser-Karte.
  const preset = tripKindPreset(trip?.kind);
  /** Zusätzliche Schnellzugriffe der Art, gegen den Kachel-Katalog gelöst. */
  const quickModules = preset.quickModules.flatMap(path => {
    const mod = modules.find(m => m.path === path);
    return mod ? [mod] : [];
  });

  return (
    <div className="container max-w-2xl py-6">
      <PageHeader
        title={td.title}
        subtitle={fmtWeekdayLong(new Date(), lang)}
      />

      {tripsQuery.isLoading ? (
        <Skeleton className="h-40 w-full rounded-lg" />
      ) : tripsQuery.isError ? (
        // Ohne diesen Zweig behauptete die Seite «Gerade läuft keine
        // Reise», wenn bloss der Server nicht antwortete – eine falsche
        // Aussage über die eigenen Daten, mitten in der Reise.
        <QueryError
          onRetry={() => void tripsQuery.refetch()}
          retrying={tripsQuery.isFetching}
        />
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
            {/* Check-in/Check-out (#400): Die Zeiten stehen seit #152 am
                Platz – gesucht werden sie genau am An- und Abreisetag,
                und genau dann stehen sie jetzt hier. An allen anderen
                Tagen wäre die Zeile Lärm. */}
            {spot?.checkinInfo &&
              (trip.startDate === today || trip.endDate === today) && (
                <p className="mt-1 flex items-center gap-1.5 text-sm">
                  <KeyRound
                    className="h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  {spot.checkinInfo}
                </p>
              )}
            {/* Das Wetter bestimmt den Tag – es gehört in die Kopfzeile,
                nicht hinter einen Knopf. Ohne Koordinaten oder ohne Netz
                bleibt die Zeile weg statt zu behaupten, es sei nichts. */}
            {weather && (
              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                <CloudSunRain
                  className="h-4 w-4 text-primary"
                  aria-hidden="true"
                />
                {td.weatherLine(
                  Math.round(weather.minC),
                  Math.round(weather.maxC),
                  weather.label
                )}
              </p>
            )}
            {/* Wetterumschwung (#417): «Morgen kippt das Wetter» steht
                genau dort, wo man abends draufschaut – als eine Zeile,
                die nur erscheint, wenn es etwas zu sagen gibt. */}
            {weather?.turn && (
              <p className="mt-1.5 flex items-start gap-1.5 text-sm">
                <TriangleAlert
                  className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span>
                  {weatherTurnTexts(t, weather.turn).line}{" "}
                  {weatherTurnTexts(t, weather.turn).advice}
                </span>
              </p>
            )}
            {/* Lagerfeuer-Ampel (#389): Die Frage stellt sich am Abend
                genau hier. Ohne Platz-Koordinaten oder Prognose bleibt
                sie weg – ein Urteil ohne Quellen wäre ein Orakel. Bei
                Hotel-, Strand- oder Städte-Reisen (#460) stellt sie
                niemand, dann fehlt sie ebenfalls. */}
            {preset.campfire && coords && weather && (
              <CampfireLight
                latitude={coords.latitude}
                longitude={coords.longitude}
                gustsMaxKmh={weather.gustsMaxKmh}
                className="mt-2"
              />
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
              {/* Schnellzugriffe der Reise-Art (#460): Wandern zeigt die
                  Tour-Aufzeichnung, Städtereisen die Ausweise – zusätzlich
                  zu den drei Standard-Knöpfen, nie an deren Stelle. */}
              {quickModules.map(mod => {
                const Icon = mod.icon;
                return (
                  <Button asChild size="sm" variant="outline" key={mod.path}>
                    <Link href={mod.path}>
                      <Icon className="mr-1.5 h-4 w-4" aria-hidden="true" />
                      {pick(mod.title, lang)}
                    </Link>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Badewasser (#460): Bei Strandferien ist das Wasser der Kern
              des Tages – Temperatur, Wellen und Gezeiten stehen darum
              gleich unter der Kopfzeile statt nur im Platz-Dossier.
              Ohne Platz-Koordinaten bleibt die Karte weg. */}
          {preset.bathing && coords && (
            <LazySection minHeight={160}>
              <div className="mt-4">
                <BathingWaterCard
                  latitude={coords.latitude}
                  longitude={coords.longitude}
                />
              </div>
            </LazySection>
          )}

          {/* Essen: die zweite Frage des Tages.
              GANZE KARTE ANTIPPBAR (#343): Wer hier «nichts eingetragen»
              liest, will genau eines – es eintragen. Der Link trägt dafür
              ein `after`, das die Karte überdeckt; vorgelesen wird
              trotzdem erst der Inhalt und dann ein Link mit eigenem Text.
              Ein `aria-label` auf der Karte hätte den Inhalt verschluckt. */}
          <section className="relative mt-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <UtensilsCrossed
                className="h-4 w-4 text-primary"
                aria-hidden="true"
              />
              {td.mealsTitle}
            </h3>
            {menuQuery.isLoading ? (
              <Skeleton className="mt-2 h-16 w-full rounded" />
            ) : menuQuery.isError ? (
              // `z-10`, sonst läge der Wiederholen-Knopf unter der
              // Klickfläche der Karte und liesse sich nicht drücken.
              <div className="relative z-10 mt-2">
                <QueryError
                  onRetry={() => void menuQuery.refetch()}
                  retrying={menuQuery.isFetching}
                />
              </div>
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
            <Link
              href={`/menueplan/${trip.id}`}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary after:absolute after:inset-0 after:rounded-xl hover:underline"
            >
              {td.mealsLink}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </section>

          {/* Ämtli: der Handgriff, den man hier auch TUT.
              Ein Verweis auf die Ämtli-Seite wäre ein Zwischenschritt für
              zwei Häkchen – deshalb steht die Liste hier zum Abhaken, und
              nur der Weg zum Verteilen führt weiter. Die Karte ist ganz
              antippbar (#343); die Häkchen liegen mit `z-10` DARÜBER,
              sonst hätte die Klickfläche sie geschluckt. */}
          <section className="relative mt-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <ListChecks className="h-4 w-4 text-primary" aria-hidden="true" />
              {td.choresTitle}
            </h3>
            {choresQuery.isLoading || choreListQuery.isLoading ? (
              <Skeleton className="mt-2 h-16 w-full rounded" />
            ) : choresQuery.isError ? (
              <div className="relative z-10 mt-2">
                <QueryError
                  onRetry={() => void choresQuery.refetch()}
                  retrying={choresQuery.isFetching}
                />
              </div>
            ) : chores.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {td.choresEmpty}
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {chores.map(chore => (
                  <li key={chore.id} className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        setDone.mutate({ id: chore.id, done: !chore.done })
                      }
                      className={cn(
                        "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        chore.done
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border"
                      )}
                      aria-pressed={chore.done}
                      aria-label={td.choresToggleAria(chore.title)}
                    >
                      {chore.done && (
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                    </button>
                    <span
                      className={cn(
                        "min-w-0 text-sm",
                        chore.done && "line-through opacity-70"
                      )}
                    >
                      {chore.title}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/aemtli"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary after:absolute after:inset-0 after:rounded-xl hover:underline"
            >
              {td.choresAll}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </section>

          {/* Kühlbox: die einzige Information des Tages, die VERDIRBT.
              Ohne etwas Ablaufendes fehlt der Kasten ganz – «nichts läuft
              ab» ist keine Nachricht, sondern Platzverbrauch. */}
          {expiring.length > 0 && (
            <section className="relative mt-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Refrigerator
                  className="h-4 w-4 text-primary"
                  aria-hidden="true"
                />
                {td.expiryTitle}
              </h3>
              <ul className="mt-2 space-y-1.5">
                {expiring.map(item => (
                  <li key={item.id} className="flex gap-2 text-sm">
                    <span className="min-w-0 font-medium">{item.name}</span>
                    <span className="text-muted-foreground">{item.label}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/kuehlbox"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary after:absolute after:inset-0 after:rounded-xl hover:underline"
              >
                {td.expiryLink}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </section>
          )}

          {/* Aufgaben: was noch offen ist – und wo man sie einträgt */}
          <section className="relative mt-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <ClipboardList
                className="h-4 w-4 text-primary"
                aria-hidden="true"
              />
              {td.tasksTitle}
            </h3>
            {boardQuery.isLoading ? (
              <Skeleton className="mt-2 h-16 w-full rounded" />
            ) : boardQuery.isError ? (
              // «Nichts offen. Geniess den Tag.» ist eine Auskunft, nach
              // der man handelt – die darf nicht aus einem Serverfehler
              // entstehen.
              <div className="relative z-10 mt-2">
                <QueryError
                  onRetry={() => void boardQuery.refetch()}
                  retrying={boardQuery.isFetching}
                />
              </div>
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
            <Link
              href={`/tagebuch/${trip.id}#pinnwand`}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary after:absolute after:inset-0 after:rounded-xl hover:underline"
            >
              {td.tasksLink}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </section>

          <div className="mt-4 flex flex-wrap gap-2">
            {/* «Ins Journal schreiben» führte auf die Liste ALLER Reisen
                (#344): Statistik, Jahresrückblick, Kalender – überall dort
                schreibt man nichts. Das Tages-Journal steckt in der einen
                laufenden Reise, also führt der Knopf jetzt dorthin und
                klappt es auf. */}
            <Button asChild variant="outline" className="flex-1">
              <Link href={`/tagebuch/${trip.id}#journal`}>
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
