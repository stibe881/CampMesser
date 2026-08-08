import { useEffect, useMemo, useState, type ReactNode, Fragment } from "react";
import { fmtMedium, fmtWeekdayDay } from "@/lib/dateFormat";
import { Link, useParams } from "wouter";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  Compass,
  Droplets,
  Grid2x2,
  Images,
  Loader2,
  MapPin,
  Moon,
  Mountain,
  MountainSnow,
  Navigation,
  Printer,
  Sunrise,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import QueryError from "@/components/QueryError";
import LazySection from "@/components/LazySection";
import LoginPrompt from "@/components/LoginPrompt";
import PhotoGallery from "@/components/PhotoGallery";
import DarkSkyPanel from "@/components/DarkSkyPanel";
import NearbyHikes from "@/components/NearbyHikes";
import NearbyExcursions from "@/components/NearbyExcursions";
import NearbyFirepits from "@/components/NearbyFirepits";
import PicnicStops from "@/components/PicnicStops";
import RouteWeather from "@/components/RouteWeather";
import { useTodayIso } from "@/lib/useTodayIso";
import {
  spotPhase,
  spotSectionOrder,
  type SpotSectionKey,
} from "@shared/spotSections";
import PitchSketchCard from "@/components/spots/PitchSketchCard";
import NextTimeNotes from "@/components/spots/NextTimeNotes";
import SitePlanCard from "@/components/spots/SitePlanCard";
import CampfireLight from "@/components/CampfireLight";
import DeparturePlanner from "@/components/DeparturePlanner";
import NearbyFamilyPlaces from "@/components/NearbyFamilyPlaces";
import NearbyShops from "@/components/NearbyShops";
import SpotRating from "@/components/SpotRating";
import NearbyTransit from "@/components/NearbyTransit";
import TickRiskPanel from "@/components/TickRiskPanel";
import { MAX_PHOTOS_PER_SPOT } from "@shared/tripPhotos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  defaultProvider,
  directionsUrl,
  openDirections,
} from "@/lib/directions";
import { formatElevation, useAutoElevation } from "@/lib/elevation";
import { altitudeHint } from "@shared/altitude";
import { getSunTimes } from "@/lib/sun";
import { loadObstacleProfiles } from "@/lib/obstacleStore";
import { computeTripStats, tripNights } from "@shared/trips";
import { describeWeatherCode } from "@shared/weather";
import { fetchDossierWeather, type DossierWeather } from "@/lib/dossierWeather";
import { useI18n } from "@/i18n";
import { LOCALE_TAGS } from "@shared/i18n";
import { cn } from "@/lib/utils";

// Wetter-Abruf ausgelagert: teilt sich das Dossier mit der öffentlichen
// Teil-Ansicht (/platz/:token)
import {
  SectionHeading,
  SectionNav,
  SECTION_IDS,
  SECTION_LABELS,
} from "@/components/spots/SpotSections";
import OfflineMapSection from "@/components/spots/OfflineMapSection";
import BathingWaterCard from "@/components/spots/BathingWaterCard";
// Karte-und-Dialog-Bausteine des Dossiers, herausgelöst in #458 – die
// Seite reicht nur noch die Platz-Felder hinein.
import SpotContactCard from "@/components/spots/SpotContactCard";
import SpotAttributesCard from "@/components/spots/SpotAttributesCard";
import SpotCostCard from "@/components/spots/SpotCostCard";
import SpotClimateCard from "@/components/spots/SpotClimateCard";
import SpotShareCard from "@/components/spots/SpotShareCard";

export default function SpotDetailPage() {
  const { lang, t } = useI18n();
  const today = useTodayIso();
  const params = useParams<{ id: string }>();
  const spotId = Number(params.id);
  const { isAuthenticated, loading } = useAuth();
  const spotsQuery = trpc.spots.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const [weather, setWeather] = useState<DossierWeather | null>(null);
  const [weatherFailed, setWeatherFailed] = useState(false);
  const utils = trpc.useUtils();
  const photosQuery = trpc.spots.photos.list.useQuery(
    { spotId },
    { enabled: isAuthenticated && Number.isInteger(spotId) && spotId > 0 }
  );
  const removePhotoMutation = trpc.spots.photos.remove.useMutation();
  // Galerie (#82) und Platzplan (#401) teilen sich Tabelle und Abfrage –
  // getrennt wird erst hier, über `kind`.
  const galleryPhotos = (photosQuery.data ?? []).filter(p => p.kind !== "plan");
  const planPhoto =
    (photosQuery.data ?? []).find(p => p.kind === "plan") ?? null;

  const spot = spotsQuery.data?.find(s => s.id === spotId);

  // Höhe über Meer einmalig bei Open-Meteo holen, falls noch nicht gespeichert
  useAutoElevation(spot);

  useEffect(() => {
    if (!spot) return;
    let cancelled = false;
    setWeatherFailed(false);
    fetchDossierWeather(spot.latitude, spot.longitude, lang)
      .then(data => {
        if (!cancelled) setWeather(data);
      })
      .catch(() => {
        if (!cancelled) setWeatherFailed(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spot?.id, lang]);

  const sun = useMemo(
    () =>
      spot ? getSunTimes(new Date(), spot.latitude, spot.longitude) : null,
    [spot]
  );
  const obstacles = useMemo(
    () => loadObstacleProfiles().spots[String(spotId)] ?? [],
    [spotId]
  );
  const spotTrips = useMemo(
    () => (tripsQuery.data ?? []).filter(t => t.spotId === spotId),
    [tripsQuery.data, spotId]
  );
  const tripStats = useMemo(
    () =>
      computeTripStats(
        spotTrips.map(t => ({
          startDate: t.startDate,
          endDate: t.endDate,
          placeName: "x",
        })),
        lang
      ),
    [spotTrips, lang]
  );

  const fmtTime = (d: Date | null) =>
    d
      ? d.toLocaleTimeString(LOCALE_TAGS[lang], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "–";

  if (loading || (isAuthenticated && spotsQuery.isLoading)) {
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
      <div className="container py-6">
        <PageHeader
          title={t.spotDetail.fallbackTitle}
          backHref="/zeltplaetze"
          backLabel={t.spotDetail.backLabel}
        />
        <LoginPrompt feature={t.spots.loginFeature} />
      </div>
    );
  }

  if (!spot) {
    return (
      <div className="container py-6">
        <PageHeader
          title={
            // «Nicht gefunden» ist eine Aussage über den Platz – die darf
            // nur fallen, wenn die Liste tatsächlich geladen wurde (#319).
            // Antwortet der Server nicht, wäre sie schlicht falsch: Der
            // Platz existiert, wir wissen es nur gerade nicht.
            spotsQuery.isError
              ? t.spotDetail.fallbackTitle
              : t.spotDetail.notFoundTitle
          }
          backHref="/zeltplaetze"
          backLabel={t.spotDetail.backLabel}
        />
        {spotsQuery.isError && (
          <QueryError
            onRetry={() => void spotsQuery.refetch()}
            retrying={spotsQuery.isFetching}
          />
        )}
      </div>
    );
  }

  /**
   * Läuft hier gerade eine Reise, ist eine geplant, oder keins von beidem?
   * Danach richtet sich die Reihenfolge der Abschnitte (#371).
   */
  const sectionOrder = spotSectionOrder(spotPhase(spotTrips, today));

  /**
   * DIE ABSCHNITTE ALS BAUSTEINE (#371): Die Reihenfolge unten hängt
   * davon ab, ob hier gerade eine Reise läuft, eine geplant ist oder
   * keins von beidem – die Regel steht als reine Funktion in
   * `shared/spotSections.ts` und ist dort geprüft.
   */
  const sectionBlocks: Record<SpotSectionKey, ReactNode> = {
    place: (
      <>
        <SectionHeading id={SECTION_IDS.place}>
          {t.spotDetail.sectionPlace}
        </SectionHeading>

        {/* NEU GEORDNET (#402, Nutzerwunsch): zuerst das Operative
            (Kontakt, Plan, Skizze – was man VOR ORT sucht), dann die
            Beschreibung (Eigenschaften, Kosten), zuletzt das eigene
            Urteil und das Spezialwerkzeug fürs Sonnen-Modul. */}
        {/* Kontakt & Check-in: Rezeptions-Telefon, Zeiten, Parzellen-Nummer */}
        <SpotContactCard spot={spot} className="mb-4" />

        {/* Campingplatz-Plan (#401): das Blatt von der Rezeption –
            wo die Parzelle liegt, wo Duschen und Abwasch sind. Direkt
            nach dem Kontakt, denn zusammen beantworten sie «wie finde
            ich mich hier zurecht». */}
        <SitePlanCard
          spotId={spot.id}
          spotName={spot.name}
          plan={planPhoto}
          onChanged={() => utils.spots.photos.list.invalidate({ spotId })}
          deletePhoto={photoId => removePhotoMutation.mutateAsync({ photoId })}
          className="mb-4"
        />

        {/* Stellplatz-Skizze (#382): Wie es beim letzten Mal gepasst hat.
            Die Parzellennummer und das WLAN wechseln bei jedem Besuch und
            stehen deshalb an der Reise (#252); die Skizze nützt genau
            dann, wenn man wiederkommt, und gehört darum zum Platz. */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Grid2x2 className="h-4 w-4 text-primary" aria-hidden="true" />
              {t.pitchSketch.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PitchSketchCard
              spotId={spot.id}
              pitchSketchJson={spot.pitchSketchJson}
            />
          </CardContent>
        </Card>
        {/* Platz-Eigenschaften: Schatten, Sanitär, Lärm, WLAN … */}
        <SpotAttributesCard
          spotId={spot.id}
          attributesJson={spot.attributesJson}
          className="mb-4 mt-4"
        />

        {/* Platzkosten (#243): Preis pro Nacht und Nebenkosten pro Nacht */}
        <SpotCostCard
          spot={spot}
          totalNights={tripStats.totalNights}
          className="mb-4"
        />

        {/* Eigene Bewertung nach Kriterien (#278) – Sanitär, Ruhe, Schatten,
            Kinderfreundlichkeit einzeln */}
        <SpotRating
          spotId={spot.id}
          ratings={{
            sanitary: spot.ratingSanitary ?? null,
            quiet: spot.ratingQuiet ?? null,
            shade: spot.ratingShade ?? null,
            kids: spot.ratingKids ?? null,
          }}
          className="mb-4"
        />

        {/* Hindernis-Profil */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mountain className="h-4 w-4 text-primary" aria-hidden="true" />
              {t.spotDetail.obstacleTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {obstacles.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                {t.spotDetail.obstaclesRecorded(obstacles.length)}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t.spotDetail.obstacleEmpty}
              </p>
            )}
            <Link
              href={`/sonne?lat=${spot.latitude}&lon=${spot.longitude}&name=${encodeURIComponent(spot.name)}&spot=${spot.id}`}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <Compass className="h-4 w-4" aria-hidden="true" />
              {obstacles.length > 0
                ? t.spotDetail.obstacleEdit
                : t.spotDetail.obstacleCreate}
            </Link>
          </CardContent>
        </Card>
      </>
    ),
    arrival: (
      <>
        <SectionHeading id={SECTION_IDS.arrival}>
          {t.spotDetail.sectionArrival}
        </SectionHeading>

        {/* Anreise-Route zum Platz.
            HERVORGEHOBEN, nicht als Umriss-Knopf: Das ist die eine Handlung
            des ganzen Abschnitts – alles andere darunter (Abfahrtszeit,
            Rast, Streckenwetter) sind Karten mit Erklärtext. Ein kleiner
            grauer Knopf davor las sich wie eine Beschriftung. */}
        {/* `mb-4` gehört hierher, nicht nur an die Karte darunter (#364):
            Der Route-Knopf klebte an «Beste Abfahrtszeit», weil alle
            folgenden Abschnitte nur einen UNTEREN Abstand haben. */}
        <div className="mb-4 mt-1">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <a
              href={directionsUrl(
                spot.latitude,
                spot.longitude,
                defaultProvider()
              )}
              onClick={event => {
                event.preventDefault();
                openDirections(spot.latitude, spot.longitude);
              }}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.spotDetail.routeAria}
            >
              <Navigation className="mr-1.5 h-5 w-5" aria-hidden="true" />
              {t.spotDetail.routeButton}
            </a>
          </Button>
        </div>

        {/* Beste Abfahrtszeit (#285): von der Check-in-Zeit rückwärts,
            Pausen eingerechnet */}
        <LazySection minHeight={200}>
          <DeparturePlanner
            latitude={spot.latitude}
            longitude={spot.longitude}
            className="mb-4"
          />
        </LazySection>

        {/* Rast unterwegs: Picknickplätze im Korridor der Anfahrt (#250) */}
        <LazySection minHeight={200}>
          <PicnicStops
            latitude={spot.latitude}
            longitude={spot.longitude}
            placeName={spot.name}
            className="mb-4"
          />
        </LazySection>

        {/* Unwetter auf der Fahrtstrecke (#275): Wetter dort, wo man unterwegs
            sein wird – und zu der Zeit, zu der man dort sein wird */}
        <LazySection minHeight={200}>
          <RouteWeather
            latitude={spot.latitude}
            longitude={spot.longitude}
            placeName={spot.name}
            className="mb-4"
          />
        </LazySection>
      </>
    ),
    weather: (
      <>
        <SectionHeading id={SECTION_IDS.weather}>
          {t.spotDetail.sectionWeather}
        </SectionHeading>

        {/* Wetter */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Droplets className="h-4 w-4 text-chart-2" aria-hidden="true" />
              {t.spotDetail.weatherTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weatherFailed && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                {t.spotDetail.weatherFailed}
              </p>
            )}
            {!weather && !weatherFailed && (
              <Skeleton className="h-24 w-full rounded-lg" />
            )}
            {weather && (
              <>
                {weather.alerts.length > 0 ? (
                  <p
                    className={cn(
                      "mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                      weather.alerts[0].severity === "gefahr"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-chart-4/15"
                    )}
                  >
                    <AlertTriangle
                      className="h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    {weather.alerts[0].title}
                    {weather.alerts.length > 1 &&
                      t.spotDetail.moreAlerts(weather.alerts.length - 1)}
                  </p>
                ) : (
                  <p className="mb-3 text-sm text-muted-foreground">
                    {t.spotDetail.noAlerts}
                  </p>
                )}
                {/* Lagerfeuer-Ampel (#389): Gefahrenstufe, Verbots-Schwelle
                    und Böen in EINER Antwort statt in drei Modulen. */}
                <CampfireLight
                  latitude={spot.latitude}
                  longitude={spot.longitude}
                  gustsMaxKmh={weather.maxGusts24hKmh}
                  className="mb-3"
                />
                <div className="divide-y divide-border/60">
                  {weather.daily.map((d, i) => (
                    <div
                      key={d.date}
                      className="flex items-center gap-3 py-2 text-sm"
                    >
                      <span className="w-16 font-medium">
                        {i === 0
                          ? t.common.today
                          : fmtWeekdayDay(new Date(d.date), lang)}
                      </span>
                      <span className="flex-1 text-muted-foreground">
                        {describeWeatherCode(d.weatherCode, lang).label}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-chart-2">
                        <Droplets className="h-3 w-3" aria-hidden="true" />
                        {Math.round(d.precipProbability)} %
                      </span>
                      <span>
                        <span className="font-semibold">
                          {Math.round(d.tempMaxC)}°
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          / {Math.round(d.tempMinC)}°
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sonne heute */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sunrise className="h-4 w-4 text-chart-4" aria-hidden="true" />
              {t.spotDetail.sunTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-accent/50 py-2.5">
                <p className="font-mono text-lg font-bold">
                  {fmtTime(sun?.sunrise ?? null)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.spotDetail.sunrise}
                </p>
              </div>
              <div className="rounded-lg bg-accent/50 py-2.5">
                <p className="font-mono text-lg font-bold">
                  {fmtTime(sun?.solarNoon ?? null)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.spotDetail.noon}
                </p>
              </div>
              <div className="rounded-lg bg-accent/50 py-2.5">
                <p className="font-mono text-lg font-bold">
                  {fmtTime(sun?.sunset ?? null)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.spotDetail.sunset}
                </p>
              </div>
            </div>
            <Link
              href={`/sonne?lat=${spot.latitude}&lon=${spot.longitude}&name=${encodeURIComponent(spot.name)}&spot=${spot.id}`}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <Compass className="h-4 w-4" aria-hidden="true" />
              {t.spotDetail.sunCompassLink}
            </Link>
          </CardContent>
        </Card>

        {/* Dunkler Himmel: geschätzte Bortle-Klasse plus «heute Nacht» */}
        <LazySection minHeight={200}>
          <DarkSkyPanel
            latitude={spot.latitude}
            longitude={spot.longitude}
            placeName={spot.name}
            astroLink
            className="mb-4"
          />
        </LazySection>

        {/* Beste Reisezeit: historisches Wetter, lädt erst beim Aufklappen */}
        <SpotClimateCard
          latitude={spot.latitude}
          longitude={spot.longitude}
          className="mb-4"
        />

        {/* Badestellen-Info: Wassertemperatur, Abfluss und Pegel am Platz */}
        <LazySection minHeight={160}>
          <BathingWaterCard
            latitude={spot.latitude}
            longitude={spot.longitude}
          />
        </LazySection>

        {/* Zeckenrisiko: FSME-Einstufung der Region plus Saison und Höhenlage */}
        <TickRiskPanel
          latitude={spot.latitude}
          longitude={spot.longitude}
          elevationM={spot.elevationM}
          className="mb-4"
        />
      </>
    ),
    around: (
      <>
        <SectionHeading id={SECTION_IDS.around}>
          {t.spotDetail.sectionAround}
        </SectionHeading>

        {/* Wandern in der Umgebung: markierte OSM-Routen rund um den Platz */}
        <LazySection minHeight={90}>
          <NearbyHikes
            latitude={spot.latitude}
            longitude={spot.longitude}
            placeName={spot.name}
            className="mb-4"
          />
        </LazySection>

        {/* Velorouten (#478): derselbe Kasten, andere OSM-Routen */}
        <LazySection minHeight={90}>
          <NearbyHikes
            mode="bicycle"
            latitude={spot.latitude}
            longitude={spot.longitude}
            placeName={spot.name}
            className="mb-4"
          />
        </LazySection>

        {/* Feuer- und Grillstellen aus OpenStreetMap (#247) – lädt erst beim
            Aufklappen, Overpass wird nie automatisch gefragt */}
        <LazySection minHeight={90}>
          <NearbyFirepits
            latitude={spot.latitude}
            longitude={spot.longitude}
            placeName={spot.name}
            className="mb-4"
          />
        </LazySection>

        {/* Spielplätze und Badeplätze aus OpenStreetMap (#248) – gemischt nach
            Distanz, lädt ebenfalls erst beim Aufklappen */}
        <LazySection minHeight={90}>
          <NearbyFamilyPlaces
            latitude={spot.latitude}
            longitude={spot.longitude}
            placeName={spot.name}
            className="mb-4"
          />
        </LazySection>

        {/* Einkaufen in Platznähe (#273): Supermarkt, Bäckerei, Hofladen mit
            Öffnungszeiten – ebenfalls erst beim Aufklappen geholt */}
        <LazySection minHeight={90}>
          <NearbyShops
            latitude={spot.latitude}
            longitude={spot.longitude}
            placeName={spot.name}
            className="mb-4"
          />
        </LazySection>

        {/* ÖV ab Platz (#249): Haltestellen mit Distanz, auf Antippen die
            Abfahrtstafel – beides erst beim Aufklappen geholt */}
        <LazySection minHeight={90}>
          <NearbyTransit
            latitude={spot.latitude}
            longitude={spot.longitude}
            placeName={spot.name}
            className="mb-4"
          />
        </LazySection>

        {/* Ausflüge in der Nähe aus der eigenen Ausflugfinder-App (#271) –
            lädt erst beim Aufklappen, damit das Dossier nicht darauf wartet */}
        <LazySection minHeight={90}>
          <NearbyExcursions
            latitude={spot.latitude}
            longitude={spot.longitude}
            placeName={spot.name}
            className="mb-4"
          />
        </LazySection>
      </>
    ),
    own: (
      <>
        <SectionHeading id={SECTION_IDS.own}>
          {t.spotDetail.sectionOwn}
        </SectionHeading>

        {/* Aufenthalte */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
              {t.spotDetail.staysTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {spotTrips.length > 0 ? (
              <>
                <div className="mb-3 grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-lg bg-accent/50 py-2.5">
                    <p className="flex items-center justify-center gap-1.5 font-serif text-xl font-bold text-primary">
                      <Moon className="h-4 w-4" aria-hidden="true" />
                      {tripStats.totalNights}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.spotDetail.nightsTotalLabel(tripStats.totalNights)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-accent/50 py-2.5">
                    <p className="font-serif text-xl font-bold">
                      {spotTrips.length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.spotDetail.staysCountLabel(spotTrips.length)}
                    </p>
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {spotTrips.slice(0, 3).map(trip => (
                    <li
                      key={trip.id}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <CalendarDays
                        className="h-3.5 w-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      {fmtMedium(new Date(`${trip.startDate}T00:00:00`), lang)}{" "}
                      · {tripNights(trip.startDate, trip.endDate)}{" "}
                      {tripNights(trip.startDate, trip.endDate) === 1
                        ? t.common.night
                        : t.common.nights}
                      {trip.title && ` · ${trip.title}`}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t.spotDetail.staysEmpty}
              </p>
            )}
            <Link
              href="/tagebuch"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              {t.spotDetail.toDiary}
            </Link>
          </CardContent>
        </Card>

        {/* «Beim nächsten Mal» (#396): der Zettel, der beim Planen der
            nächsten Reise hierher von selbst wieder auftaucht. Direkt
            nach den Aufenthalten – Rückschau und Vorsatz gehören
            nebeneinander. Bleibt privat, wie die Fotos darunter. */}
        <NextTimeNotes
          spotId={spot.id}
          nextTimeJson={spot.nextTimeJson}
          className="mt-4"
        />

        {/* Fotos: privat – die geteilte Ansicht (/platz/:token) zeigt sie nicht */}
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Images className="h-4 w-4 text-primary" aria-hidden="true" />
              {t.spotDetail.photosTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t.spotDetail.photosHint}
            </p>
            <PhotoGallery
              photos={galleryPhotos}
              loadFailed={photosQuery.isError}
              name={spot.name}
              maxPhotos={MAX_PHOTOS_PER_SPOT}
              uploadUrl={`/api/spots/${spot.id}/photos`}
              photoSrc={fileName => `/api/spots/photos/${fileName}`}
              onChanged={() => utils.spots.photos.list.invalidate({ spotId })}
              deletePhoto={photoId =>
                removePhotoMutation.mutateAsync({ photoId })
              }
              texts={{
                addPhotos: t.spotDetail.addPhotos,
                addPhotosAria: t.spotDetail.addPhotosAria,
                photoCountHint: t.spotDetail.photoCountHint,
                photoUploading: t.spotDetail.photoUploading,
                photoUploaded: t.spotDetail.photoUploaded,
                photoLimitReached: t.spotDetail.photoLimitReached,
                photoTooLarge: t.spotDetail.photoTooLarge,
                photoUnsupportedType: t.spotDetail.photoUnsupportedType,
                photoHeic: t.spotDetail.photoHeic,
                photoReadFailed: t.spotDetail.photoReadFailed,
                photoUploadFailed: t.spotDetail.photoUploadFailed,
                photosLoadFailed: t.spotDetail.photosLoadFailed,
                photoDeleteConfirm: t.spotDetail.photoDeleteConfirm,
                photoDeleted: t.spotDetail.photoDeleted,
                photoDeleteAria: t.spotDetail.photoDeleteAria,
                photoAlt: t.spotDetail.photoAlt,
                photoOpenAria: t.spotDetail.photoOpenAria,
                galleryTitle: t.spotDetail.galleryTitle,
                galleryCounter: t.spotDetail.galleryCounter,
                galleryPrev: t.spotDetail.galleryPrev,
                galleryNext: t.spotDetail.galleryNext,
                deleteFailed: t.common.deleteFailed,
              }}
            />
          </CardContent>
        </Card>

        {/* Offline-Karte: Kacheln rund um den Platz vorab laden */}
        <LazySection minHeight={120}>
          <OfflineMapSection spot={spot} />
        </LazySection>

        {/* Dossier drucken (#416): das Blatt fürs Handschuhfach – auch
            zum Weitergeben an Mitreisende ohne App. */}
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href={`/zeltplaetze/${spot.id}/drucken`}>
            <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {t.spotPrint.openButton}
          </Link>
        </Button>

        {/* Dossier teilen */}
        <SpotShareCard spotId={spot.id} spotName={spot.name} className="mt-4" />
      </>
    ),
  };

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader
        title={spot.name}
        backHref="/zeltplaetze"
        backLabel={t.spotDetail.backLabel}
      />
      <p className="mb-1 flex items-center gap-1.5 text-sm text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
        {spot.latitude.toFixed(4)}°, {spot.longitude.toFixed(4)}°
      </p>
      {spot.elevationM !== null && (
        <>
          <p className="mb-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MountainSnow className="h-3.5 w-3.5" aria-hidden="true" />
            {t.spotDetail.elevation(formatElevation(spot.elevationM, lang))}
          </p>
          {altitudeHint(spot.elevationM, lang) && (
            <p className="mb-2 rounded-lg bg-accent/50 px-3 py-2 text-xs text-accent-foreground">
              {altitudeHint(spot.elevationM, lang)}
            </p>
          )}
        </>
      )}
      {spot.note && (
        <p className="mb-4 text-sm text-muted-foreground">{spot.note}</p>
      )}

      {/* Die Sprungleiste folgt derselben Reihenfolge wie die Abschnitte
          (#371) – eine Leiste, die anders sortiert ist als die Seite,
          wäre schlimmer als gar keine. */}
      <SectionNav
        ariaLabel={t.spotDetail.sectionNavAria}
        labels={sectionOrder.map(key => [
          SECTION_IDS[key],
          SECTION_LABELS(t)[key],
        ])}
      />

      {/* In der Reihenfolge, die zur Lage passt (#371) */}
      {sectionOrder.map(key => (
        <Fragment key={key}>{sectionBlocks[key]}</Fragment>
      ))}
    </div>
  );
}
