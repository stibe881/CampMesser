/**
 * Aus Home.tsx herausgelöst (#419): Die Startseite war mit 2005 Zeilen
 * die grösste Datei im Client – die Widgets wohnen jetzt hier (Muster
 * wie Trips #322 und Profil #414).
 */
import { CurrentTripWeather } from "@/components/home/HomeWeather";
import { Link } from "wouter";
import { ArrowRight, CloudSunRain, X } from "lucide-react";
import { pick } from "@shared/i18n";
import { MEAL_LABELS, MEALS } from "@shared/menuPlan";
import { useI18n } from "@/i18n";
import { useRecipes } from "@/hooks/useRecipes";
import { currentTripDay, daysUntilTrip, isUpcomingTrip } from "@shared/trips";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useTodayIso } from "@/lib/useTodayIso";
import {
  CalendarClock,
  ListChecks,
  MapPin,
  Refrigerator,
  ShoppingCart,
  Tent,
  UtensilsCrossed,
} from "lucide-react";

export default function NextTripWidget() {
  const { lang, t } = useI18n();
  const { isAuthenticated } = useAuth();
  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const spotsQuery = trpc.spots.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const today = useTodayIso();
  // Bewusst nur EIGENE Reisen im Widget (Mitglieds-Trips bleiben im Tagebuch)
  const ownTrips = (tripsQuery.data ?? []).filter(
    trip => trip.role === "owner"
  );
  // Laufender Aufenthalt: heute innerhalb des Zeitraums – bei Überlappung
  // gewinnt der zuletzt angetretene.
  const current = ownTrips
    .filter(trip => currentTripDay(trip, today) !== null)
    .sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
  const next = ownTrips
    .filter(trip => isUpcomingTrip(trip.startDate, today))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  const progress = trpc.packing.progress.useQuery(
    { listId: next?.packListId ?? 0 },
    { enabled: Boolean(next?.packListId) && !current }
  );

  // Heutige Mahlzeiten des laufenden Aufenthalts: Menüplan nur laden, wenn
  // wirklich ein Trip läuft; eigene Rezepte nur, wenn heute eines verplant ist.
  const menuQuery = trpc.menu.listByTrip.useQuery(
    { tripId: current?.id ?? 0 },
    { enabled: Boolean(current), staleTime: 60_000 }
  );
  const todayEntries = (menuQuery.data?.entries ?? []).filter(
    e => e.day === today
  );
  const recipes = useRecipes();
  const customRecipesQuery = trpc.recipes.list.useQuery(undefined, {
    enabled:
      Boolean(current) && todayEntries.some(e => e.customRecipeId != null),
    staleTime: 60_000,
  });

  /** Anzeigetitel eines Menüplan-Eintrags in der aktiven Sprache. */
  const mealTitle = (entry: (typeof todayEntries)[number]): string | null => {
    if (entry.recipeId) {
      // Das Rezeptbuch wird nachgeladen (#342); bis dahin steht die Kennung
      // da – besser als eine leere Zeile, die gleich wieder springt.
      const recipe = recipes?.find(r => r.id === entry.recipeId);
      return recipe ? pick(recipe.name, lang) : entry.recipeId;
    }
    if (entry.customRecipeId != null) {
      return (
        customRecipesQuery.data?.find(r => r.id === entry.customRecipeId)
          ?.name ?? null
      );
    }
    return entry.freeText ?? null;
  };

  // «Frühstück: X · Mittag: Y · Abend: Z» – nur belegte Slots, sonst leer
  const mealsLine = MEALS.map(meal => {
    const entry = todayEntries.find(e => e.meal === meal);
    if (!entry) return null;
    const title = mealTitle(entry);
    return title ? `${pick(MEAL_LABELS[meal], lang)}: ${title}` : null;
  })
    .filter((part): part is string => part !== null)
    .join(" · ");

  const tripPlace = (trip: NonNullable<typeof next>): string =>
    trip.title ||
    (trip.spotId != null
      ? (spotsQuery.data?.find(s => s.id === trip.spotId)?.name ?? "")
      : (trip.location ?? "")) ||
    t.home.nextTripFallback;

  if (current) {
    const day = currentTripDay(current, today);
    const place = tripPlace(current);
    const spot =
      current.spotId != null
        ? spotsQuery.data?.find(s => s.id === current.spotId)
        : undefined;
    // `relative z-10`: Die ganze Karte ist seit #356 ein Link zur Reise;
    // ohne das lägen diese drei Knöpfe unter dessen Klickfläche.
    const linkClass =
      "relative z-10 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-sm transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.98]";
    return (
      <div
        className="relative mb-6 rounded-xl border border-primary/40 bg-accent/30 p-4 shadow-sm transition-colors hover:border-primary/70"
        aria-label={t.home.currentTripAria(place)}
      >
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Tent className="h-5.5 w-5.5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-baseline gap-x-2">
              {/* DIE GANZE KARTE FÜHRT ZUR REISE (#356): Wer hier liest,
                  steckt gerade in diesem Aufenthalt – Journal, Reisekasse
                  und Pinnwand liegen alle dort. Der Link sitzt bewusst am
                  TITEL und überzieht die Karte mit einem `after`: So heisst
                  er vorgelesen «Du bist in …», also genau das Ziel, statt
                  eines nichtssagenden «Karte». Die drei Knöpfe unten liegen
                  mit `z-10` darüber und bleiben einzeln antippbar. */}
              <Link
                href={`/tagebuch/${current.id}`}
                className="font-semibold after:absolute after:inset-0 after:rounded-xl hover:underline"
              >
                {t.home.currentTripTitle(place)}
              </Link>
              {day && (
                <span className="text-sm font-semibold text-primary">
                  {t.home.currentTripDay(day.day, day.total)}
                </span>
              )}
            </span>
            {spot && (
              <CurrentTripWeather
                latitude={spot.latitude}
                longitude={spot.longitude}
              />
            )}
            {mealsLine && (
              <span className="mt-0.5 flex items-start gap-1.5 text-xs text-muted-foreground">
                <UtensilsCrossed
                  className="mt-0.5 h-3 w-3 shrink-0"
                  aria-hidden="true"
                />
                <span className="sr-only">{t.home.currentTripMealsSr}</span>
                <span className="min-w-0">{mealsLine}</span>
              </span>
            )}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/menueplan/${current.id}`}
            className={linkClass}
            aria-label={t.home.currentTripMenuAria(place)}
          >
            <UtensilsCrossed
              className="h-3.5 w-3.5 text-primary"
              aria-hidden="true"
            />
            {t.home.currentTripMenuLink}
          </Link>
          {current.spotId != null && (
            <Link
              href={`/zeltplaetze/${current.spotId}`}
              className={linkClass}
              aria-label={t.home.currentTripSpotAria(place)}
            >
              <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              {t.home.currentTripSpotLink}
            </Link>
          )}
          <Link href="/einkauf" className={linkClass}>
            <ShoppingCart
              className="h-3.5 w-3.5 text-primary"
              aria-hidden="true"
            />
            {t.home.currentTripShoppingLink}
          </Link>
          {/* DREI WEITERE WEGE AUS DEM AUFENTHALT (#366, Nutzerwunsch mit
              Bildschirmfoto): Rechts neben den drei Knöpfen war eine halbe
              Zeile leer, und genau die drei Module, die man auf dem Platz
              am häufigsten braucht, fehlten – was ist in der Kühlbox, wie
              wird das Wetter, wer ist heute mit dem Abwasch dran. Alle drei
              gehören zum Aufenthalt, hängen aber nicht an der Reise-Id:
              Kühlbox und Ämtli-Plan gibt es je einmal, das Wetter richtet
              sich nach dem Standort. */}
          <Link href="/kuehlbox" className={linkClass}>
            <Refrigerator
              className="h-3.5 w-3.5 text-primary"
              aria-hidden="true"
            />
            {t.home.currentTripFoodLink}
          </Link>
          <Link href="/wetter" className={linkClass}>
            <CloudSunRain
              className="h-3.5 w-3.5 text-primary"
              aria-hidden="true"
            />
            {t.home.currentTripWeatherLink}
          </Link>
          <Link href="/aemtli" className={linkClass}>
            <ListChecks
              className="h-3.5 w-3.5 text-primary"
              aria-hidden="true"
            />
            {t.home.currentTripChoresLink}
          </Link>
        </div>
      </div>
    );
  }

  if (!next) return null;

  const place = tripPlace(next);
  const days = daysUntilTrip(next.startDate, today);
  const packed = progress.data;
  const pct =
    packed && packed.total > 0
      ? Math.round((packed.checked / packed.total) * 100)
      : null;

  return (
    <Link
      href="/tagebuch"
      className="mb-6 flex items-center gap-4 rounded-xl border border-primary/40 bg-accent/30 p-4 shadow-sm transition-all hover:border-primary hover:shadow-md"
      aria-label={t.home.nextTripAria(place)}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <CalendarClock className="h-5.5 w-5.5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-semibold">{place}</span>
          <span className="text-sm font-semibold text-primary">
            {days === 0
              ? t.home.tripStartsToday
              : days === 1
                ? t.home.tripStartsTomorrow
                : t.home.tripDaysLeft(days)}
          </span>
          {next.arrivalTime && (
            <span className="text-xs text-muted-foreground">
              {t.home.tripArrivalAt(next.arrivalTime)}
            </span>
          )}
        </span>
        {pct !== null && packed ? (
          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ListChecks className="h-3 w-3 shrink-0" aria-hidden="true" />
            {t.home.tripPacked(packed.name, packed.checked, packed.total, pct)}
          </span>
        ) : (
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {t.home.tripPlannedNote}
          </span>
        )}
      </span>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-muted-foreground/50"
        aria-hidden="true"
      />
    </Link>
  );
}
