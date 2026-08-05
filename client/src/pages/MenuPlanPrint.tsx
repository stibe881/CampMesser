import { useEffect, useMemo } from "react";
import { fmtLong, fmtWeekdayShort } from "@/lib/dateFormat";
import { useParams } from "wouter";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoginPrompt from "@/components/LoginPrompt";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { isStandaloneApp } from "@/lib/standalone";
import { recipes } from "@/data/recipes";
import { LOCALE_TAGS, pick } from "@shared/i18n";
import { MEALS, MEAL_LABELS, tripDays, type Meal } from "@shared/menuPlan";

/**
 * Druckfreundliche Ansicht des Menüplans eines Trips: Tage × Mahlzeiten als
 * Tabelle, Rezept-Titel in der aktiven Sprache, Freitext wie erfasst;
 * Trip-Name und Zeitraum im Kopf. PDF entsteht über den Browser-Druckdialog.
 */
export default function MenuPlanPrintPage() {
  const { lang, t } = useI18n();
  const standalone = isStandaloneApp();
  const params = useParams<{ tripId: string }>();
  const tripId = Number(params.tripId);
  const { isAuthenticated, loading } = useAuth();
  const menuQuery = trpc.menu.listByTrip.useQuery(
    { tripId },
    { enabled: isAuthenticated && Number.isInteger(tripId) && tripId > 0 }
  );
  const customQuery = trpc.recipes.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const spotsQuery = trpc.spots.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const trip = menuQuery.data?.trip ?? null;
  const entries = useMemo(
    () => menuQuery.data?.entries ?? [],
    [menuQuery.data]
  );
  const days = useMemo(
    () => (trip ? tripDays(trip.startDate, trip.endDate) : []),
    [trip]
  );

  const spotName =
    trip?.spotId != null
      ? (spotsQuery.data ?? []).find(s => s.id === trip.spotId)?.name
      : undefined;
  const tripName = trip
    ? trip.title || spotName || trip.location || t.trips.unknownPlace
    : null;

  useEffect(() => {
    document.title = tripName
      ? t.menuPlanPrint.docTitle(tripName)
      : t.menuPlanPrint.docTitleFallback;
    return () => {
      document.title = t.menuPlanPrint.appTitle;
    };
  }, [tripName, t]);

  /** Statische Rezepte nach Id, eigene Rezepte nach Server-Id. */
  const staticById = useMemo(() => {
    const map = new Map<string, (typeof recipes)[number]>();
    recipes.forEach(r => map.set(r.id, r));
    return map;
  }, []);
  const customById = useMemo(() => {
    const map = new Map<number, NonNullable<typeof customQuery.data>[number]>();
    (customQuery.data ?? []).forEach(r => map.set(r.id, r));
    return map;
  }, [customQuery.data]);

  const entryFor = (day: string, meal: Meal) =>
    entries.find(e => e.day === day && e.meal === meal);

  /** Tages-Notiz eines Tages – erscheint kursiv unter dem Tages-Datum. */
  const dayNotes = menuQuery.data?.dayNotes ?? [];
  const noteFor = (day: string) => dayNotes.find(n => n.day === day)?.note;

  /** Anzeigetitel eines Slots in der aktiven Sprache (Freitext wie erfasst). */
  const entryTitle = (entry: NonNullable<ReturnType<typeof entryFor>>) => {
    if (entry.recipeId) {
      const recipe = staticById.get(entry.recipeId);
      return recipe ? pick(recipe.name, lang) : entry.recipeId;
    }
    if (entry.customRecipeId != null) {
      return customById.get(entry.customRecipeId)?.name ?? "–";
    }
    return entry.freeText ?? "–";
  };

  const formatDay = (iso: string) =>
    fmtWeekdayShort(new Date(`${iso}T00:00:00`), lang);

  if (loading || (isAuthenticated && menuQuery.isLoading)) {
    return (
      <div className="container flex justify-center py-16">
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          aria-label={t.common.loading}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container max-w-2xl py-8">
        <LoginPrompt feature={t.menuPlan.loginFeature} />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="container max-w-2xl py-8">
        <p className="text-muted-foreground">{t.menuPlanPrint.notFound}</p>
        <Button
          variant="outline"
          className="mt-3"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {t.common.back}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 print:max-w-none print:px-0 print:py-0">
      {/* Bedienleiste – wird nicht mitgedruckt */}
      <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {t.common.back}
        </Button>
        <Button
          size="sm"
          onClick={() => {
            if (standalone) {
              window.open(window.location.href, "_blank", "noopener");
            } else {
              window.print();
            }
          }}
        >
          <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {t.menuPlanPrint.printButton}
        </Button>
      </div>
      {standalone && (
        <p className="mb-6 text-xs text-muted-foreground print:hidden">
          {t.menuPlanPrint.printBrowserHint}
        </p>
      )}

      <div className="print-sheet">
        <header className="mb-6 border-b-2 border-foreground pb-4">
          <p className="text-xs font-semibold uppercase tracking-widest">
            {t.menuPlanPrint.headerKicker}
          </p>
          <h1 className="mt-1 font-serif text-3xl font-bold">{tripName}</h1>
          <p className="mt-1 text-sm">
            {formatDay(trip.startDate)} – {formatDay(trip.endDate)}
            {" · "}
            {t.menuPlan.daysCount(days.length)}
            {" · "}
            {t.menuPlanPrint.printedOn(fmtLong(new Date(), lang))}
          </p>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-foreground/40 px-2 py-1.5 text-left text-xs font-bold uppercase tracking-wide">
                  {t.menuPlanPrint.dayHeader}
                </th>
                {MEALS.map(meal => (
                  <th
                    key={meal}
                    className="border border-foreground/40 px-2 py-1.5 text-left text-xs font-bold uppercase tracking-wide"
                  >
                    {pick(MEAL_LABELS[meal], lang)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map(day => (
                <tr key={day} className="print-station">
                  <th className="border border-foreground/40 px-2 py-1.5 text-left align-top text-xs font-semibold capitalize">
                    {formatDay(day)}
                    {noteFor(day) && (
                      <span className="block break-words font-normal normal-case italic">
                        {noteFor(day)}
                      </span>
                    )}
                  </th>
                  {MEALS.map(meal => {
                    const entry = entryFor(day, meal);
                    return (
                      <td
                        key={meal}
                        className="border border-foreground/40 px-2 py-1.5 align-top"
                      >
                        {entry ? (
                          <span className="break-words">
                            {entryTitle(entry)}
                          </span>
                        ) : (
                          <span
                            className="text-foreground/40"
                            aria-hidden="true"
                          >
                            –
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="mt-8 border-t border-foreground/30 pt-3 text-center text-xs">
          {t.menuPlanPrint.footer}
        </footer>
      </div>
    </div>
  );
}
