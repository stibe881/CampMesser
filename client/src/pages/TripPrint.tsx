import { useEffect, useMemo } from "react";
import { fmtLong, fmtWeekdayLong, fmtWeekdayShort } from "@/lib/dateFormat";
import { useParams } from "wouter";
import { ArrowLeft, Loader2, Printer, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoginPrompt from "@/components/LoginPrompt";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { tripDisplayName, tripPlaceName } from "@shared/tripName";
import { trpc } from "@/lib/trpc";
import { isStandaloneApp } from "@/lib/standalone";
import { recipes } from "@/data/recipes";
import { LOCALE_TAGS, pick } from "@shared/i18n";
import { MEALS, MEAL_LABELS, tripDays, type Meal } from "@shared/menuPlan";
import { tripNights } from "@shared/trips";
import { parseTripWeather } from "@shared/tripWeather";
import { cn } from "@/lib/utils";

/** URL eines Trip-Fotos über die bestehende private GET-Route. */
const tripPhotoSrc = (fileName: string) => `/api/trips/photos/${fileName}`;

/**
 * Druckfreundliche Reise-Ansicht (/tagebuch/:id/drucken): Titelbild als
 * Kopfbild, Titel/Ort/Zeitraum/Sterne, Wetterarchiv-Zeile, Notizen,
 * Foto-Galerie als Raster und kompakter Menüplan. Fotos laufen über die
 * private GET-Route – die Ansicht ist nur für Besitzer*in und Mitreisende.
 * PDF entsteht über den Browser-Druckdialog (Muster PackListPrint).
 */
export default function TripPrintPage() {
  const { lang, t } = useI18n();
  const standalone = isStandaloneApp();
  const params = useParams<{ id: string }>();
  const tripId = Number(params.id);
  const { isAuthenticated, loading } = useAuth();
  const validId = Number.isInteger(tripId) && tripId > 0;

  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const spotsQuery = trpc.spots.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const photosQuery = trpc.trips.photos.list.useQuery(
    { tripId },
    { enabled: isAuthenticated && validId }
  );
  const menuQuery = trpc.menu.listByTrip.useQuery(
    { tripId },
    { enabled: isAuthenticated && validId }
  );
  // Tages-Journal (#192) – wird als eigener Abschnitt mitgedruckt
  const journalQuery = trpc.trips.journal.list.useQuery(
    { tripId },
    { enabled: isAuthenticated && validId }
  );
  const customQuery = trpc.recipes.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const trip = (tripsQuery.data ?? []).find(tr => tr.id === tripId) ?? null;
  const spot =
    trip?.spotId != null
      ? ((spotsQuery.data ?? []).find(s => s.id === trip.spotId) ?? null)
      : null;
  const placeName = tripPlaceName(trip ?? {}, lang, spot?.name);
  const tripName = trip ? tripDisplayName(trip, lang, spot?.name) : null;

  const photos = photosQuery.data ?? [];
  const cover =
    trip?.coverPhotoId != null
      ? (photos.find(p => p.id === trip.coverPhotoId) ?? null)
      : null;
  const galleryPhotos = photos.filter(p => p.id !== cover?.id);

  const weather = useMemo(
    () => parseTripWeather(trip?.weatherJson ?? null),
    [trip?.weatherJson]
  );

  const entries = useMemo(
    () => menuQuery.data?.entries ?? [],
    [menuQuery.data]
  );
  const menuDays = useMemo(
    () =>
      trip
        ? tripDays(trip.startDate, trip.endDate).filter(day =>
            entries.some(e => e.day === day)
          )
        : [],
    [trip, entries]
  );

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

  const journalEntries = useMemo(
    () => journalQuery.data ?? [],
    [journalQuery.data]
  );

  const entryFor = (day: string, meal: Meal) =>
    entries.find(e => e.day === day && e.meal === meal);

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

  const fmtDay = (iso: string) =>
    fmtWeekdayShort(new Date(`${iso}T00:00:00`), lang);
  const fmtJournalDay = (iso: string) =>
    fmtWeekdayLong(new Date(`${iso}T00:00:00`), lang);
  const formatRange = (startDate: string, endDate: string): string => {
    const fmt = (iso: string) => fmtLong(new Date(`${iso}T00:00:00`), lang);
    if (startDate === endDate) return fmt(startDate);
    return `${fmt(startDate)} – ${fmt(endDate)}`;
  };

  useEffect(() => {
    document.title = tripName
      ? t.tripPrint.docTitle(tripName)
      : t.tripPrint.docTitleFallback;
    return () => {
      document.title = t.tripPrint.appTitle;
    };
  }, [tripName, t]);

  if (loading || (isAuthenticated && tripsQuery.isLoading)) {
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
        <LoginPrompt feature={t.trips.loginFeature} />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="container max-w-2xl py-8">
        <p className="text-muted-foreground">{t.tripPrint.notFound}</p>
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

  const nights = tripNights(trip.startDate, trip.endDate);

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 print:max-w-none print:px-0 print:py-0">
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
          {t.tripPrint.printButton}
        </Button>
      </div>
      {standalone && (
        <p className="mb-6 text-xs text-muted-foreground print:hidden">
          {t.tripPrint.printBrowserHint}
        </p>
      )}

      <div className="print-sheet">
        {/* Titelbild als Kopfbild (falls vorhanden) */}
        {cover && (
          <img
            src={tripPhotoSrc(cover.fileName)}
            alt={t.trips.coverAlt(tripName ?? placeName)}
            className="mb-4 max-h-64 w-full rounded-lg object-cover"
          />
        )}
        <header className="mb-6 border-b-2 border-foreground pb-4">
          <p className="text-xs font-semibold uppercase tracking-widest">
            {t.tripPrint.headerKicker}
          </p>
          <h1 className="mt-1 font-serif text-3xl font-bold">{tripName}</h1>
          <p className="mt-1 text-sm">
            {trip.title ? `${placeName} · ` : ""}
            {formatRange(trip.startDate, trip.endDate)}
            {" · "}
            {t.trips.nightsCount(nights)}
            {" · "}
            {t.tripPrint.printedOn(fmtLong(new Date(), lang))}
          </p>
          {trip.rating != null && (
            <p
              className="mt-1.5 flex items-center gap-0.5"
              aria-label={t.tripPrint.ratingAria(trip.rating)}
            >
              {[1, 2, 3, 4, 5].map(n => (
                <Star
                  key={n}
                  className={cn(
                    "h-4 w-4",
                    n <= (trip.rating ?? 0)
                      ? "fill-foreground text-foreground"
                      : "text-foreground/25"
                  )}
                  aria-hidden="true"
                />
              ))}
            </p>
          )}
          {weather && (
            <p className="mt-1 text-sm">
              {t.trips.weatherTitle}:{" "}
              {t.trips.weatherSummary(
                Math.round(weather.tMax),
                Math.round(weather.tMin)
              )}{" "}
              · {t.trips.weatherRainDays(weather.rainDays)}
            </p>
          )}
        </header>

        {/* Notizen */}
        {trip.notes && (
          <section className="mb-6">
            <h2 className="mb-2 border-b border-foreground/30 pb-1 text-sm font-bold uppercase tracking-wide">
              {t.tripPrint.notesTitle}
            </h2>
            <p className="whitespace-pre-line text-sm">{trip.notes}</p>
          </section>
        )}

        {/* Menüplan kompakt (nur Tage mit Einträgen) */}
        {menuDays.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-2 border-b border-foreground/30 pb-1 text-sm font-bold uppercase tracking-wide">
              {t.tripPrint.menuTitle}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border border-foreground/40 px-2 py-1.5 text-left text-xs font-bold uppercase tracking-wide">
                      {t.tripPrint.dayHeader}
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
                  {menuDays.map(day => (
                    <tr key={day} className="print-station">
                      <th className="border border-foreground/40 px-2 py-1.5 text-left align-top text-xs font-semibold capitalize">
                        {fmtDay(day)}
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
          </section>
        )}

        {/* Tages-Journal (#192): nur Tage mit Eintrag, chronologisch */}
        {journalEntries.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-2 border-b border-foreground/30 pb-1 text-sm font-bold uppercase tracking-wide">
              {t.trips.journalTitle}
            </h2>
            <ul className="space-y-2.5">
              {journalEntries.map(entry => (
                <li key={entry.id} className="print-station">
                  <p className="text-xs font-semibold capitalize">
                    {fmtJournalDay(entry.day)}
                    {entry.createdByName
                      ? ` · ${t.trips.journalBy(entry.createdByName)}`
                      : ""}
                  </p>
                  <p className="whitespace-pre-line text-sm">{entry.text}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Foto-Galerie als Raster */}
        {galleryPhotos.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-2 border-b border-foreground/30 pb-1 text-sm font-bold uppercase tracking-wide">
              {t.tripPrint.photosTitle}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {galleryPhotos.map((photo, index) => (
                <img
                  key={photo.id}
                  src={tripPhotoSrc(photo.fileName)}
                  alt={t.tripPrint.photoAlt(index + 1, tripName ?? placeName)}
                  loading="lazy"
                  className="print-station aspect-square w-full rounded-lg object-cover"
                />
              ))}
            </div>
          </section>
        )}

        <footer className="mt-8 border-t border-foreground/30 pt-3 text-center text-xs">
          {t.tripPrint.footer}
        </footer>
      </div>
    </div>
  );
}
