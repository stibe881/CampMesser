import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  Award,
  BarChart3,
  Binoculars,
  CalendarDays,
  CloudSun,
  Footprints,
  Link2,
  Loader2,
  Star,
  Target,
  Tent,
  Trophy,
  Users,
  Wallet,
  Globe2,
  Route,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import QueryError from "@/components/QueryError";
import LoginPrompt from "@/components/LoginPrompt";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LOCALE_TAGS, pick } from "@shared/i18n";
import { computeTripStats, nightsPerYear } from "@shared/trips";
import { trackYearRows } from "@shared/trackYears";
import { distanceMeters } from "@shared/geo";
import { tripKindRows } from "@shared/tripKindStats";
import { tripKindLabel } from "@shared/tripKind";
import { visitedCountryRows } from "@/lib/tripCountries";
import { inventoryValue } from "@shared/inventoryValue";
import { estimatedTotalRappen, spotCostComparison } from "@shared/spotCosts";
import { EXPENSE_CATEGORY_LABELS } from "@shared/expenses";
import { formatChf } from "@/lib/money";
import { milestones } from "@shared/milestones";
import { weatherLuck } from "@shared/tripWeather";
import { BADGES } from "@shared/badges";
import { knots } from "@/data/knots";
import { natureEntries } from "@/data/nature";
import { collectionProgress } from "@/lib/natureCollection";
import {
  loadKnotProgress,
  masteryCounts,
  sanitizeKnotProgress,
  storeKnotProgress,
  type KnotProgress,
} from "@/lib/knotProgress";
import { useSyncedSetting } from "@/lib/useSyncedSetting";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useTodayIso } from "@/lib/useTodayIso";

/**
 * Statistik-Dashboard: bündelt die bereits vorhandenen Auswertungen der App
 * an einem Ort – Reise-Statistik, Wetter-Glück, Jahres-Vergleich und
 * Meilensteine (shared/trips.ts, shared/tripWeather.ts, shared/milestones.ts),
 * Knoten-Lernfortschritt, Arten-Sammelalbum samt Beobachtungen sowie den
 * Abzeichen-Stand der Kinder. Die Seite ist bewusst NUR lesend: sie ruft
 * dieselben reinen Funktionen auf wie «Meine Reisen» und «Natur» und
 * verlinkt für Details ins jeweilige Modul.
 */

/** Kopfzeile eines Abschnitts mit Icon und Direktlink ins Modul. */
function SectionHeader({
  icon: Icon,
  title,
  href,
  linkLabel,
}: {
  icon: typeof BarChart3;
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 font-serif text-base font-semibold">
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
        {title}
      </h2>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        {linkLabel}
        <ArrowRight className="h-3 w-3" aria-hidden="true" />
      </Link>
    </div>
  );
}

/** Eine Kennzahl mit Beschriftung. */
function Stat({
  value,
  label,
  strong,
}: {
  value: React.ReactNode;
  label: string;
  strong?: boolean;
}) {
  return (
    <div className="text-center">
      <p
        className={cn(
          "text-2xl font-bold",
          strong && "font-serif text-primary"
        )}
      >
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * Abzeichen-Stand EINES Kindes: eigene Query pro Kind, weil der Endpunkt
 * `family.badges.listByChild` genau ein Kind kennt (Muster
 * ChildBadgeGallery im Familien-Modus).
 */
function ChildBadgeRow({ childId, name }: { childId: number; name: string }) {
  const { t } = useI18n();
  const badgesQuery = trpc.family.badges.listByChild.useQuery({ childId });
  const earned = badgesQuery.data?.length ?? 0;
  const pct = BADGES.length === 0 ? 0 : (earned / BADGES.length) * 100;
  return (
    <li>
      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
        <span className="truncate font-medium">{name}</span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {t.stats.familyBadges(earned, BADGES.length)}
        </span>
      </div>
      <Progress
        value={pct}
        aria-label={`${name}: ${t.stats.familyBadges(earned, BADGES.length)}`}
      />
    </li>
  );
}

export default function Stats() {
  const { lang, t } = useI18n();
  const ts = t.stats;
  const { isAuthenticated, loading: authLoading } = useAuth();
  const enabled = isAuthenticated;

  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled,
    staleTime: 60_000,
  });
  const spotsQuery = trpc.spots.list.useQuery(undefined, {
    enabled,
    staleTime: 60_000,
  });
  // Ausgaben über alle Reisen (#257) – eine Abfrage, serverseitig gerechnet
  const expenseStatsQuery = trpc.trips.expenses.stats.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const sightingsQuery = trpc.sightings.list.useQuery(undefined, {
    enabled,
    staleTime: 60_000,
  });
  // Wander-Jahresbilanz (#450): aus den gespeicherten Tracks (#220)
  const inventoryQuery = trpc.inventory.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const tracksQuery = trpc.tracks.list.useQuery(undefined, {
    enabled,
    staleTime: 60_000,
  });
  const childrenQuery = trpc.family.children.list.useQuery(undefined, {
    enabled,
    staleTime: 60_000,
  });

  // Knoten-Lernfortschritt: localStorage als schnelle Quelle, Geräte-Sync
  // gleicht den Konto-Stand an (identisch zum Knoten-Modul).
  const [knotStats, setKnotStats] = useState<KnotProgress>(() =>
    loadKnotProgress()
  );
  useSyncedSetting<KnotProgress>("knotProgress", value => {
    const clean = sanitizeKnotProgress(value);
    setKnotStats(clean);
    storeKnotProgress(clean);
  });

  // Jahresziel Reisenächte (#553): selbst gesteckt, am Konto gesynct
  const [nightsGoal, setNightsGoal] = useState<number | null>(() => {
    try {
      const raw = localStorage.getItem("campmesser.nightsGoal");
      const value = raw === null ? NaN : Number(raw);
      return Number.isInteger(value) && value >= 1 && value <= 365
        ? value
        : null;
    } catch {
      return null;
    }
  });
  const [goalDraft, setGoalDraft] = useState("");
  const goalSync = useSyncedSetting<number | null>("nightsGoal", value => {
    const clean =
      typeof value === "number" && Number.isInteger(value) && value >= 1
        ? Math.min(value, 365)
        : null;
    setNightsGoal(clean);
    try {
      if (clean === null) localStorage.removeItem("campmesser.nightsGoal");
      else localStorage.setItem("campmesser.nightsGoal", String(clean));
    } catch {
      // localStorage nicht verfügbar
    }
  });
  const updateNightsGoal = (value: number | null) => {
    setNightsGoal(value);
    try {
      if (value === null) localStorage.removeItem("campmesser.nightsGoal");
      else localStorage.setItem("campmesser.nightsGoal", String(value));
    } catch {
      // localStorage nicht verfügbar
    }
    goalSync.push(value);
  };

  const today = useTodayIso();
  const currentYear = new Date().getFullYear();
  const trips = useMemo(() => tripsQuery.data ?? [], [tripsQuery.data]);
  const spots = useMemo(() => spotsQuery.data ?? [], [spotsQuery.data]);

  /** Trip auf die von den reinen Funktionen erwartete Minimalform bringen. */
  const tripLikes = useMemo(
    () =>
      trips.map(trip => ({
        startDate: trip.startDate,
        endDate: trip.endDate,
        placeName:
          (trip.spotId != null
            ? (spots.find(s => s.id === trip.spotId)?.name ?? trip.spotName)
            : null) ??
          trip.location ??
          "",
        rating: trip.rating,
        weatherJson: trip.weatherJson,
      })),
    [trips, spots]
  );

  const tripStats = useMemo(
    () => computeTripStats(tripLikes, lang),
    [tripLikes, lang]
  );
  const luck = useMemo(() => weatherLuck(tripLikes), [tripLikes]);
  const yearNights = useMemo(() => nightsPerYear(tripLikes), [tripLikes]);
  const milestoneItems = useMemo(
    () => milestones(tripLikes, today, lang),
    [tripLikes, today, lang]
  );
  const achievedCount = milestoneItems.filter(m => m.achieved).length;
  const nextMilestones = useMemo(
    () =>
      milestoneItems
        .filter(m => !m.achieved)
        .sort((a, b) => b.current / b.target - a.current / a.target)
        .slice(0, 3),
    [milestoneItems]
  );

  const knotCounts = useMemo(
    () =>
      masteryCounts(
        knotStats,
        knots.map(k => k.id)
      ),
    [knotStats]
  );

  const trackYears = useMemo(
    () => trackYearRows(tracksQuery.data ?? []),
    [tracksQuery.data]
  );

  // Reisen nach Art (#467) – erst ab zwei Arten interessant: eine
  // Tabelle mit einer einzigen Zeile «Camping» sagt niemandem etwas.
  const kindRows = useMemo(() => tripKindRows(trips), [trips]);
  /**
   * Länder-Statistik (#510): Land aus Ort/Titel/Platzname geraten –
   * seit #592 helfen auch die Etappen-Namen mit: Die Rundreise durch
   * drei Länder zählt drei, mit den Nächten der jeweiligen Etappe.
   */
  const allStopsQuery = trpc.trips.stops.listAll.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  });
  const countryStats = useMemo(() => {
    const spotNames = new Map(
      (spotsQuery.data ?? []).map(spot => [spot.id, spot.name])
    );
    const stopsByTrip = new Map<
      number,
      { name: string; startDate: string; endDate: string }[]
    >();
    for (const stop of allStopsQuery.data ?? []) {
      const list = stopsByTrip.get(stop.tripId) ?? [];
      list.push(stop);
      stopsByTrip.set(stop.tripId, list);
    }
    return visitedCountryRows(trips, spotNames, stopsByTrip);
  }, [trips, spotsQuery.data, allStopsQuery.data]);
  /**
   * Rundreise-Kilometer (#580): Summe der Etappen-Strecken je Jahr –
   * ehrlich als LUFTLINIE ausgewiesen, denn für Dutzende alte Reisen
   * jedes Mal den Routen-Dienst zu fragen wäre unverhältnismässig (die
   * echten Fahrzeiten stehen an der Reise selbst, #558). Gezählt werden
   * nur Abschnitte, deren beide Etappen Koordinaten haben – dafür holt
   * die Seite hier die VOLLEN Etappen einmalig je Reise.
   */
  const stageKmYears = useMemo(() => {
    const stopsByTrip = new Map<
      number,
      { latitude: number | null; longitude: number | null }[]
    >();
    for (const stop of allStopsQuery.data ?? []) {
      const list = stopsByTrip.get(stop.tripId) ?? [];
      list.push(stop);
      stopsByTrip.set(stop.tripId, list);
    }
    const metersByYear = new Map<string, number>();
    for (const trip of trips) {
      const stops = stopsByTrip.get(trip.id) ?? [];
      let meters = 0;
      for (let i = 1; i < stops.length; i++) {
        const a = stops[i - 1];
        const b = stops[i];
        if (
          a.latitude != null &&
          a.longitude != null &&
          b.latitude != null &&
          b.longitude != null
        ) {
          meters += distanceMeters(
            a.latitude,
            a.longitude,
            b.latitude,
            b.longitude
          );
        }
      }
      if (meters > 0) {
        const year = trip.startDate.slice(0, 4);
        metersByYear.set(year, (metersByYear.get(year) ?? 0) + meters);
      }
    }
    return Array.from(metersByYear.entries())
      .map(([year, meters]) => ({ year, meters }))
      .sort((a, b) => b.year.localeCompare(a.year));
  }, [trips, allStopsQuery.data]);
  /** Inventar-Gesamtwert (#511) aus den erfassten Kaufpreisen. */
  const inventoryWorth = useMemo(
    () => inventoryValue(inventoryQuery.data ?? []),
    [inventoryQuery.data]
  );

  const sightings = useMemo(
    () => sightingsQuery.data ?? [],
    [sightingsQuery.data]
  );
  const collection = useMemo(
    () =>
      collectionProgress(
        natureEntries,
        sightings.map(s => ({ entryId: s.entryId, sightedAt: s.sightedAt }))
      ),
    [sightings]
  );

  // Platz-Vergleich (#243): Preis pro Nacht je Platz, günstigster zuerst.
  // Die Nächte kommen aus den Reisen mit verknüpftem Zeltplatz.
  const spotCosts = useMemo(
    () =>
      spotCostComparison(
        spots,
        trips.map(trip => ({
          spotId: trip.spotId,
          startDate: trip.startDate,
          endDate: trip.endDate,
        })),
        lang
      ),
    [spots, trips, lang]
  );
  const spotCostTotal = useMemo(
    () => estimatedTotalRappen(spotCosts),
    [spotCosts]
  );

  const children = childrenQuery.data ?? [];
  const fmtChf = (rappen: number) =>
    `${t.tripExpenses.currency} ${formatChf(rappen, lang)}`;
  const fmtRating = (value: number) =>
    value.toLocaleString(LOCALE_TAGS[lang], {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

  if (authLoading) {
    return (
      <div className="container max-w-3xl py-6">
        <PageHeader title={ts.title} subtitle={ts.subtitle} />
        <div className="flex justify-center py-8">
          <Loader2
            className="h-6 w-6 animate-spin text-muted-foreground"
            aria-label={t.common.loading}
          />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container max-w-3xl py-6">
        <PageHeader title={ts.title} subtitle={ts.subtitle} />
        <LoginPrompt feature={ts.loginFeature} />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader title={ts.title} subtitle={ts.subtitle} />

      {/* Eine Statistik lügt beim Fehler besonders überzeugend (#319):
          Ohne Daten stehen überall Nullen, und «0 Übernachtungen» sieht
          nicht nach einer Störung aus, sondern nach einer Auskunft. Bei
          einem Fehler steht deshalb der Hinweis ganz oben, VOR den
          Kacheln – nicht statt ihnen, denn ein Teil der Zahlen (Knoten,
          Abzeichen) kommt vom Gerät und stimmt weiterhin. */}
      {(tripsQuery.isError || spotsQuery.isError) && (
        <div className="mb-6">
          <QueryError
            onRetry={() => {
              void tripsQuery.refetch();
              void spotsQuery.refetch();
            }}
            retrying={tripsQuery.isFetching || spotsQuery.isFetching}
          />
        </div>
      )}

      {/* Reise-Statistik: dieselben Kennzahlen wie in «Meine Reisen» */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <SectionHeader
            icon={BarChart3}
            title={ts.tripsTitle}
            href="/tagebuch"
            linkLabel={ts.tripsLink}
          />
          {tripStats.totalTrips === 0 ? (
            <p className="text-sm text-muted-foreground">{ts.tripsEmpty}</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              <Stat
                strong
                value={tripStats.nightsByYear[currentYear] ?? 0}
                label={ts.nightsInYear(currentYear)}
              />
              <Stat value={tripStats.totalNights} label={ts.nightsTotal} />
              <Stat value={tripStats.totalTrips} label={ts.staysLabel} />
              <Stat
                value={
                  <span className="flex items-center justify-center gap-1 text-sm font-semibold leading-8">
                    <Trophy
                      className="h-4 w-4 shrink-0 text-chart-1"
                      aria-hidden="true"
                    />
                    <span className="truncate">
                      {tripStats.topPlaces[0]?.name || "–"}
                    </span>
                  </span>
                }
                label={ts.favoriteLabel}
              />
              <Stat
                value={
                  <span className="flex items-center justify-center gap-1">
                    <Star
                      className="h-4 w-4 shrink-0 fill-chart-1 text-chart-1"
                      aria-hidden="true"
                    />
                    {tripStats.avgRating !== null
                      ? fmtRating(tripStats.avgRating)
                      : "–"}
                  </span>
                }
                label={ts.avgRatingLabel}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ausgaben über alle Reisen (#257) – erst ab der ersten Ausgabe */}
      {expenseStatsQuery.data && expenseStatsQuery.data.totalRappen > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <SectionHeader
              icon={Wallet}
              title={ts.expensesTitle}
              href="/reisen"
              linkLabel={ts.expensesLink}
            />
            <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat
                label={ts.expensesTotal}
                value={fmtChf(expenseStatsQuery.data.totalRappen)}
              />
              {expenseStatsQuery.data.perNightRappen !== null && (
                <Stat
                  label={ts.expensesPerNight}
                  value={fmtChf(expenseStatsQuery.data.perNightRappen)}
                />
              )}
              {expenseStatsQuery.data.topCategory && (
                <Stat
                  label={ts.expensesTopCategory}
                  value={pick(
                    EXPENSE_CATEGORY_LABELS[
                      expenseStatsQuery.data.topCategory.category
                    ],
                    lang
                  )}
                />
              )}
            </div>
            <ul className="space-y-2">
              {expenseStatsQuery.data.years.map(year => (
                <li
                  key={year.year}
                  className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 border-b border-border/60 pb-2 last:border-0 last:pb-0"
                >
                  <span className="text-sm font-medium">{year.year}</span>
                  <span className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold tabular-nums">
                      {fmtChf(year.rappen)}
                    </span>
                    {year.perNightRappen !== null && (
                      <span className="text-xs text-muted-foreground">
                        {ts.expensesYearDetail(
                          year.trips,
                          year.nights,
                          fmtChf(year.perNightRappen)
                        )}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              {ts.expensesHint}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Platz-Vergleich (#243): nur mit mindestens einem erfassten Preis */}
      {spotCosts.length > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <SectionHeader
              icon={Wallet}
              title={ts.spotCostsTitle}
              href="/zeltplaetze"
              linkLabel={ts.spotCostsLink}
            />
            <ul className="space-y-2">
              {spotCosts.map((row, index) => (
                <li
                  key={row.spotId}
                  className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 border-b border-border/60 pb-2 last:border-0 last:pb-0"
                >
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {index + 1}.
                    </span>
                    <Link
                      href={`/zeltplaetze/${row.spotId}`}
                      className="truncate text-sm font-medium hover:underline"
                    >
                      {row.name}
                    </Link>
                  </span>
                  <span className="flex items-baseline gap-2">
                    <span
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        index === 0 && "text-primary"
                      )}
                    >
                      {ts.spotCostsPerNight(fmtChf(row.nightlyRappen))}
                    </span>
                    {row.estimatedTotalRappen !== null && (
                      <span className="text-xs text-muted-foreground">
                        {ts.spotCostsEstimate(
                          row.nights,
                          fmtChf(row.estimatedTotalRappen)
                        )}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            {spotCostTotal > 0 && (
              <p className="mt-3 text-sm">
                {ts.spotCostsTotal(fmtChf(spotCostTotal))}
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {ts.spotCostsHint}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Wetter-Glück: nur mit mindestens einem gespeicherten Wetterarchiv */}
      {luck && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <SectionHeader
              icon={CloudSun}
              title={ts.weatherLuckTitle}
              href="/tagebuch"
              linkLabel={ts.tripsLink}
            />
            <p className="text-sm">
              {ts.weatherLuckDry(Math.round(luck.dryShare * 100))}
              {" · "}
              {ts.weatherLuckAvgMax(Math.round(luck.avgTMax))}
              {luck.warmest?.place && (
                <>
                  {" · "}
                  {ts.weatherLuckWarmest(
                    luck.warmest.place,
                    Math.round(luck.warmest.tMax)
                  )}
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {ts.weatherLuckHint(luck.trips)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Wander-Jahresbilanz (#450): Touren, km und Höhenmeter pro Jahr;
          Velo-Touren (#449) zählen mit, stehen aber getrennt dabei */}
      {trackYears.length > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <SectionHeader
              icon={Footprints}
              title={ts.hikeYearsTitle}
              href="/wanderung"
              linkLabel={ts.hikeYearsLink}
            />
            <ul className="space-y-2">
              {trackYears.map(row => (
                <li
                  key={row.year}
                  className="border-b border-border/60 pb-2 last:border-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <span className="text-sm font-semibold">{row.year}</span>
                    <span className="text-sm tabular-nums">
                      {ts.hikeYearsLine(
                        row.tours,
                        (row.distanceM / 1000).toLocaleString(
                          LOCALE_TAGS[lang],
                          { maximumFractionDigits: 1 }
                        ),
                        row.ascentM.toLocaleString(LOCALE_TAGS[lang])
                      )}
                    </span>
                  </div>
                  {row.bikeTours > 0 && (
                    <p className="mt-0.5 text-right text-xs text-muted-foreground">
                      {ts.hikeYearsBike(row.bikeTours)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Rundreise-Kilometer (#580): die Zahl, die am Lagerfeuer erzählt
          wird – ehrlich als Luftlinie zwischen den Etappen ausgewiesen. */}
      {stageKmYears.length > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <SectionHeader
              icon={Route}
              title={ts.stageKmTitle}
              href="/tagebuch"
              linkLabel={ts.tripsLink}
            />
            <ul className="space-y-2">
              {stageKmYears.map(row => (
                <li
                  key={row.year}
                  className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 border-b border-border/60 pb-2 last:border-0 last:pb-0"
                >
                  <span className="text-sm font-semibold">{row.year}</span>
                  <span className="text-sm tabular-nums">
                    {ts.stageKmLine(
                      Math.round(row.meters / 1000).toLocaleString(
                        LOCALE_TAGS[lang]
                      )
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              {ts.stageKmHint}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Reisen nach Art (#467): wie viel Camping steckt im Jahr wirklich?
          Erst ab zwei Arten – eine Ein-Zeilen-Tabelle wäre Tapete. */}
      {kindRows.length > 1 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <SectionHeader
              icon={Tent}
              title={ts.kindStatsTitle}
              href="/tagebuch"
              linkLabel={ts.tripsLink}
            />
            <ul className="space-y-2">
              {kindRows.map(row => (
                <li
                  key={row.kind}
                  className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 border-b border-border/60 pb-2 last:border-0 last:pb-0"
                >
                  <span className="text-sm font-semibold">
                    {tripKindLabel(row.kind, lang)}
                  </span>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {ts.kindStatsLine(row.trips, row.nights)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Länder-Statistik (#510): nur erkannte Länder – ein Ort wie
          «Thun» nennt kein Land und wird ehrlich als «ohne Angabe»
          gezählt statt geraten. */}
      {countryStats.rows.length > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <SectionHeader
              icon={Globe2}
              title={ts.countriesTitle}
              href="/tagebuch"
              linkLabel={ts.tripsLink}
            />
            <ul className="space-y-2">
              {countryStats.rows.map(row => (
                <li
                  key={row.code}
                  className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 border-b border-border/60 pb-2 last:border-0 last:pb-0"
                >
                  <span className="text-sm font-semibold">
                    {row.flag} {pick(row.name, lang)}
                  </span>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {ts.kindStatsLine(row.trips, row.nights)}
                  </span>
                </li>
              ))}
            </ul>
            {countryStats.unassigned > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                {ts.countriesUnassigned(countryStats.unassigned)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Inventar-Gesamtwert (#511): Untergrenze aus den erfassten
          Kaufpreisen – als Zahl fürs Versicherungs-Gespräch. */}
      {inventoryWorth.totalRappen > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <SectionHeader
              icon={Wallet}
              title={ts.inventoryValueTitle}
              href="/inventar"
              linkLabel={ts.inventoryLink}
            />
            <p className="font-serif text-2xl font-bold text-primary">
              CHF {formatChf(inventoryWorth.totalRappen, lang)}
            </p>
            <ul className="mt-2 space-y-1">
              {inventoryWorth.rows.slice(0, 6).map(row => (
                <li
                  key={row.category}
                  className="flex items-baseline justify-between gap-3 text-sm"
                >
                  <span>{row.category}</span>
                  <span className="tabular-nums text-muted-foreground">
                    CHF {formatChf(row.rappen, lang)}
                  </span>
                </li>
              ))}
            </ul>
            {inventoryWorth.unvaluedCount > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                {ts.inventoryValueHint(inventoryWorth.unvaluedCount)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Jahres-Vergleich: schlichte CSS-Balken, keine Chart-Bibliothek */}
      {yearNights.length >= 2 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <SectionHeader
              icon={CalendarDays}
              title={ts.yearCompareTitle}
              href="/tagebuch"
              linkLabel={ts.tripsLink}
            />
            <ul className="space-y-1.5">
              {yearNights.map(({ year, nights }) => {
                const max = yearNights.reduce(
                  (m, y) => Math.max(m, y.nights),
                  1
                );
                const isCurrent = year === currentYear;
                return (
                  <li key={year} className="flex items-center gap-2 text-sm">
                    <span
                      className={cn(
                        "w-12 tabular-nums",
                        isCurrent && "font-semibold text-primary"
                      )}
                    >
                      {year}
                    </span>
                    <span className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                      <span
                        className={cn(
                          "block h-full rounded-full",
                          isCurrent ? "bg-primary" : "bg-primary/50"
                        )}
                        style={{
                          width: `${Math.max(4, (nights / max) * 100)}%`,
                        }}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="w-24 text-right text-xs text-muted-foreground">
                      {ts.nightsCount(nights)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Jahresziel Reisenächte (#553): selbst gesteckt, mit Fortschritt */}
      {tripStats.totalTrips > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <SectionHeader
              icon={Target}
              title={ts.goalTitle}
              href="/tagebuch"
              linkLabel={ts.tripsLink}
            />
            {nightsGoal !== null ? (
              (() => {
                const nights = tripStats.nightsByYear[currentYear] ?? 0;
                const pct = Math.min(
                  100,
                  Math.round((nights / nightsGoal) * 100)
                );
                return (
                  <>
                    <p className="text-sm font-medium">
                      {ts.goalLine(nights, nightsGoal, currentYear)}
                    </p>
                    <Progress
                      className="mt-2"
                      value={pct}
                      aria-label={ts.goalAria(pct)}
                    />
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        {nights >= nightsGoal
                          ? ts.goalReached
                          : ts.goalRemaining(nightsGoal - nights)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground"
                        onClick={() => updateNightsGoal(null)}
                      >
                        {ts.goalRemove}
                      </Button>
                    </div>
                  </>
                );
              })()
            ) : (
              <>
                <p className="mb-2 text-sm text-muted-foreground">
                  {ts.goalHint}
                </p>
                <form
                  className="flex gap-2"
                  onSubmit={e => {
                    e.preventDefault();
                    const value = Number(goalDraft.trim());
                    if (Number.isInteger(value) && value >= 1 && value <= 365) {
                      updateNightsGoal(value);
                      setGoalDraft("");
                    }
                  }}
                >
                  <Input
                    inputMode="numeric"
                    placeholder="30"
                    className="w-28"
                    value={goalDraft}
                    onChange={e => setGoalDraft(e.target.value)}
                    aria-label={ts.goalTitle}
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={!goalDraft.trim()}
                  >
                    {ts.goalSet}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Meilensteine: Stand plus die drei nächstliegenden offenen */}
      {milestoneItems.length > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <SectionHeader
              icon={Award}
              title={ts.milestonesTitle}
              href="/tagebuch"
              linkLabel={ts.tripsLink}
            />
            <p className="text-sm">
              {ts.milestonesAchieved(achievedCount, milestoneItems.length)}
            </p>
            {nextMilestones.length > 0 && (
              <div className="mt-3">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {ts.milestonesNextTitle}
                </h3>
                <ul className="space-y-2.5">
                  {nextMilestones.map(m => (
                    <li key={m.id}>
                      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                        <span>{m.label}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {ts.milestonesProgress(m.current, m.target)}
                        </span>
                      </div>
                      <Progress
                        value={(m.current / m.target) * 100}
                        aria-label={`${m.label}: ${ts.milestonesProgress(m.current, m.target)}`}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Knoten-Lernfortschritt: sicher / üben / neu über alle Knoten */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <SectionHeader
            icon={Link2}
            title={ts.knotsTitle}
            href="/knoten"
            linkLabel={ts.knotsLink}
          />
          <p className="mb-3 text-sm">
            {ts.knotsSummary(knotCounts.secure, knotCounts.total)}
          </p>
          <Progress
            value={
              knotCounts.total === 0
                ? 0
                : (knotCounts.secure / knotCounts.total) * 100
            }
            className="mb-3 h-2"
            aria-label={ts.knotsProgressAria}
          />
          <div className="grid grid-cols-3 gap-4">
            <Stat value={knotCounts.secure} label={ts.knotsSecure} />
            <Stat value={knotCounts.practice} label={ts.knotsPractice} />
            <Stat value={knotCounts.fresh} label={ts.knotsFresh} />
          </div>
        </CardContent>
      </Card>

      {/* Natur: Sammelalbum-Fortschritt und Anzahl Beobachtungen */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <SectionHeader
            icon={Binoculars}
            title={ts.natureTitle}
            href="/natur"
            linkLabel={ts.natureLink}
          />
          <p className="mb-3 text-sm">
            {ts.natureCollection(collection.seenCount, collection.total)}
            {" · "}
            {ts.natureSightings(sightings.length)}
          </p>
          <Progress
            value={Math.round(collection.ratio * 100)}
            className="h-2"
            aria-label={ts.natureProgressAria}
          />
        </CardContent>
      </Card>

      {/* Familie: Abzeichen-Stand pro Kind (kompakt) */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <SectionHeader
            icon={Users}
            title={ts.familyTitle}
            href="/familie"
            linkLabel={ts.familyLink}
          />
          {children.length === 0 ? (
            <p className="text-sm text-muted-foreground">{ts.familyEmpty}</p>
          ) : (
            <ul className="space-y-2.5">
              {children.map(child => (
                <ChildBadgeRow
                  key={child.id}
                  childId={child.id}
                  name={child.name}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">{ts.footnote}</p>
    </div>
  );
}
