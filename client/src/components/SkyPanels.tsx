/**
 * Die Himmels-Abschnitte: Mondkalender, Dunkelheit, Sternschnuppen,
 * ISS-Überflüge, Sternbild-Finder und der Rotlicht-Umschalter.
 *
 * WARUM EIN EIGENES MODUL: Diese sechs Abschnitte gehörten zum Natur-Modul,
 * weil sie dort einmal entstanden sind – gebraucht werden sie aber alle in
 * derselben halben Stunde: abends draussen sitzen und hochschauen. Wer den
 * Mond nachschlagen wollte, landete zwischen Tierspuren und Pilzen, und der
 * Sonnenstand-Kompass lag noch einmal ganz woanders. Jetzt sammelt die Seite
 * /himmel alles an einem Ort; das Natur-Modul bleibt Lexikon, Sammelalbum
 * und Beobachtungen.
 *
 * Die Bauteile sind bewusst unverändert übernommen worden – dieselbe
 * Darstellung, dieselben Texte, nur an einem anderen Ort. Einzige Ausnahme:
 * Der Sternbild-Finder bekommt seinen «zum Lexikon»-Sprung neu von aussen
 * gereicht, weil das Lexikon jetzt auf einer anderen Seite steht.
 */
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  Flashlight,
  Loader2,
  Moon,
  Satellite,
  Sparkles,
  Telescope,
} from "lucide-react";
import DarkSkyPanel from "@/components/DarkSkyPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { natureEntries, type NatureEntry } from "@/data/nature";
import { addMonths } from "@shared/calendar";
import {
  getMoonInfo,
  moonMonth,
  nextFullMoons,
  nextNewMoons,
  stargazingQuality,
  type MoonPhaseId,
} from "@shared/moon";
import {
  PEAK_WINDOW_DAYS,
  showersNearPeak,
  upcomingShowers,
} from "@shared/astro";
import { passPathText } from "@shared/iss";
import {
  isDarkEnough,
  nightReferenceTime,
  objectInView,
  skyObjectsAt,
  visibleSkyObjects,
  type SkySighting,
} from "@shared/skyPosition";
import { compassDirection } from "@shared/solar";
import { LOCALE_TAGS, pick, type Language } from "@shared/i18n";
import { useAuth } from "@/_core/hooks/useAuth";
import { useDeviceHeading } from "@/hooks/useDeviceHeading";
import { useI18n, useT } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { fmtDate } from "@/lib/dateFormat";

const QUALITY_STYLES: Record<string, string> = {
  hervorragend: "bg-primary/15 text-primary",
  gut: "bg-chart-2/20 text-foreground",
  mittel: "bg-chart-4/20 text-foreground",
  schlecht: "bg-destructive/10 text-destructive",
};

function fmtTime(d: Date, lang: Language) {
  return d.toLocaleTimeString(LOCALE_TAGS[lang], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Zunehmende Phasen – bestimmt, auf welcher Seite das Symbol beleuchtet ist. */
const WAXING_PHASES: MoonPhaseId[] = [
  "neumond",
  "zunehmende-sichel",
  "erstes-viertel",
  "zunehmender-mond",
];

/**
 * Kleines Mondphasen-Symbol: heller Kreis mit Schattenanteil.
 * Aus der Beleuchtung folgt der Phasenwinkel (illumination = (1 − cos φ)/2),
 * dessen Kosinus die Halbachse des Terminators (der Licht-Schatten-Grenze)
 * liefert – so entstehen Sichel und «Buckelmond» mit derselben Formel.
 */
function MoonGlyph({
  illumination,
  waxing,
}: {
  illumination: number;
  waxing: boolean;
}) {
  const r = 9;
  const rx = r * Math.abs(1 - 2 * illumination);
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-5 w-5"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="10"
        cy="10"
        r={r}
        className="fill-muted stroke-border"
        strokeWidth="0.75"
      />
      {/* Halbkreis auf der beleuchteten Seite … */}
      <path
        d={`M 10 1 A ${r} ${r} 0 0 ${waxing ? 1 : 0} 10 19 Z`}
        className="fill-amber-glow"
      />
      {/* … und darüber der Terminator, hell bei mehr als halbem Mond. */}
      <ellipse
        cx="10"
        cy="10"
        rx={rx}
        ry={r}
        className={illumination > 0.5 ? "fill-amber-glow" : "fill-muted"}
      />
    </svg>
  );
}

/**
 * Aufklappbare Monatsansicht des Mondkalenders: Monatsgitter (Start Montag)
 * mit Phasen-Symbol pro Tag, hervorgehobenen Neu-/Vollmonden und markierten
 * Sternschnuppen-Nächten (Maximum ±3 Tage). Alles offline berechnet.
 */
function MoonMonthView({ today }: { today: Date }) {
  const { lang, t } = useI18n();
  const [cursor, setCursor] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  }));
  const weeks = useMemo(
    () => moonMonth(cursor.year, cursor.month, lang),
    [cursor, lang]
  );
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const caption = new Date(
    Date.UTC(cursor.year, cursor.month - 1, 1)
  ).toLocaleDateString(LOCALE_TAGS[lang], {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  // Wochentags-Kürzel aus einer bekannten Montags-Woche (1.1.2024 war ein Montag)
  const weekdays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        new Date(Date.UTC(2024, 0, 1 + i)).toLocaleDateString(
          LOCALE_TAGS[lang],
          { weekday: "short", timeZone: "UTC" }
        )
      ),
    [lang]
  );
  const isCurrentMonth =
    cursor.year === today.getFullYear() &&
    cursor.month === today.getMonth() + 1;

  return (
    <div className="mt-4 rounded-lg border border-border/60 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          aria-label={t.nature.moonMonthPrev}
          onClick={() => setCursor(c => addMonths(c.year, c.month, -1))}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <p className="flex-1 text-center text-sm font-semibold">{caption}</p>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          aria-label={t.nature.moonMonthNext}
          onClick={() => setCursor(c => addMonths(c.year, c.month, 1))}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      {!isCurrentMonth && (
        <div className="mb-2 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setCursor({
                year: today.getFullYear(),
                month: today.getMonth() + 1,
              })
            }
          >
            {t.nature.moonMonthToday}
          </Button>
        </div>
      )}

      <table
        className="w-full table-fixed border-collapse"
        aria-label={t.nature.moonMonthTableAria(caption)}
      >
        <thead>
          <tr>
            {weekdays.map(name => (
              <th
                key={name}
                scope="col"
                className="pb-1 text-center text-[11px] font-medium text-muted-foreground"
              >
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map(week => (
            <tr key={week[0].iso}>
              {week.map(day => {
                const showers = showersNearPeak(
                  new Date(`${day.iso}T12:00:00Z`)
                );
                const isToday = day.iso === todayIso;
                const dateLabel = new Date(
                  `${day.iso}T12:00:00Z`
                ).toLocaleDateString(LOCALE_TAGS[lang], {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  timeZone: "UTC",
                });
                const parts = [
                  t.nature.moonMonthDayAria(dateLabel, day.phaseLabel),
                ];
                if (showers.length > 0) {
                  parts.push(
                    t.nature.moonMonthMeteorAria(
                      showers.map(s => pick(s.name, lang)).join(", ")
                    )
                  );
                }
                if (isToday) parts.push(t.nature.moonMonthTodayAria);
                return (
                  <td
                    key={day.iso}
                    className="p-0.5"
                    aria-label={parts.join(", ")}
                  >
                    <div
                      className={cn(
                        "flex flex-col items-center gap-0.5 rounded-md border p-1",
                        isToday
                          ? "border-primary bg-accent"
                          : "border-transparent",
                        !day.inMonth && "opacity-40"
                      )}
                    >
                      <span className="text-[11px] leading-none text-muted-foreground">
                        {Number(day.iso.slice(8, 10))}
                      </span>
                      <MoonGlyph
                        illumination={day.illumination}
                        waxing={WAXING_PHASES.includes(day.phase)}
                      />
                      <span className="flex h-3 items-center gap-0.5">
                        {(day.isNewMoon || day.isFullMoon) && (
                          <span className="text-[9px] font-semibold leading-none text-primary">
                            {day.isNewMoon
                              ? t.nature.moonMonthNewShort
                              : t.nature.moonMonthFullShort}
                          </span>
                        )}
                        {showers.length > 0 && (
                          <Sparkles
                            className="h-2.5 w-2.5 text-chart-1"
                            aria-hidden="true"
                          />
                        )}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <span className="font-semibold text-primary">
            {t.nature.moonMonthNewShort}
          </span>
          {t.nature.moonMonthLegendNew}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="font-semibold text-primary">
            {t.nature.moonMonthFullShort}
          </span>
          {t.nature.moonMonthLegendFull}
        </li>
        <li className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-chart-1" aria-hidden="true" />
          {t.nature.moonMonthLegendMeteor(PEAK_WINDOW_DAYS)}
        </li>
        <li className="flex items-center gap-1.5">
          <span
            className="h-3 w-3 rounded-sm border border-primary bg-accent"
            aria-hidden="true"
          />
          {t.nature.moonMonthLegendToday}
        </li>
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        {t.nature.moonMonthNote}
      </p>
    </div>
  );
}

/** Mondphasen-Kalender: aktuelle Phase, Sternbeobachtungs-Tipp und nächste Termine – rein offline berechnet. */
export function MoonCalendar() {
  const { lang, t } = useI18n();
  const [now] = useState(() => new Date());
  const moon = useMemo(() => getMoonInfo(now, lang), [now, lang]);
  const quality = useMemo(
    () => stargazingQuality(moon.illumination, lang),
    [moon, lang]
  );
  const fullMoons = useMemo(() => nextFullMoons(now, 3), [now]);
  const newMoons = useMemo(() => nextNewMoons(now, 3), [now]);
  const [monthOpen, setMonthOpen] = useState(false);

  return (
    <section
      className="mb-6 rounded-xl border border-border bg-card p-4"
      aria-label={t.nature.moonSectionAria}
    >
      <div className="mb-3 flex items-center gap-2">
        <Moon className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 className="font-serif text-lg font-semibold">
          {t.nature.moonTitle}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-5xl" role="img" aria-label={moon.phaseLabel}>
          {moon.symbol}
        </span>
        <div>
          <p className="font-semibold">{moon.phaseLabel}</p>
          <p className="text-sm text-muted-foreground">
            {t.nature.illuminated(Math.round(moon.illumination * 100))}
          </p>
          <Badge
            className={cn("mt-1.5 border-0", QUALITY_STYLES[quality.score])}
          >
            {t.nature.stargazing(t.nature.quality[quality.score])}
          </Badge>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{quality.note}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-accent/50 p-3">
          <p className="mb-1.5 text-sm font-semibold">
            {t.nature.fullMoonsTitle}
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {fullMoons.map((d, i) => (
              <li key={i}>{fmtDate(d, lang)}</li>
            ))}
          </ul>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {t.nature.fullMoonsNote}
          </p>
        </div>
        <div className="rounded-lg bg-accent/50 p-3">
          <p className="mb-1.5 text-sm font-semibold">
            {t.nature.newMoonsTitle}
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {newMoons.map((d, i) => (
              <li key={i}>{fmtDate(d, lang)}</li>
            ))}
          </ul>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {t.nature.newMoonsNote}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setMonthOpen(v => !v)}
        aria-expanded={monthOpen}
        aria-controls="mond-monatsansicht"
        className="mt-4 flex w-full items-center gap-2 rounded-lg border border-border bg-accent/40 px-3 py-2 text-sm font-medium transition-colors hover:border-primary/40"
      >
        <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
        {monthOpen
          ? t.nature.moonMonthToggleHide
          : t.nature.moonMonthToggleShow}
        <ChevronDown
          className={cn(
            "ml-auto h-4 w-4 transition-transform",
            monthOpen && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
      <div id="mond-monatsansicht">
        {monthOpen && <MoonMonthView today={now} />}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {t.nature.moonCalcNote}
      </p>
    </section>
  );
}

/** Sternschnuppen-Kalender: die nächsten Strom-Maxima inkl. Mondstörung – offline berechnet. */
export function MeteorCalendar() {
  const { lang, t } = useI18n();
  const [now] = useState(() => new Date());
  const showers = useMemo(() => upcomingShowers(now, 4), [now]);

  return (
    <section
      className="mb-6 rounded-xl border border-border bg-card p-4"
      aria-label={t.nature.meteorSectionAria}
    >
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 className="font-serif text-lg font-semibold">
          {t.nature.meteorTitle}
        </h2>
      </div>
      <ul className="space-y-3">
        {showers.map(entry => (
          <li key={entry.shower.id} className="rounded-lg bg-accent/50 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{pick(entry.shower.name, lang)}</p>
              {entry.activeNow && (
                <Badge className="border-0 bg-primary/15 text-primary">
                  {t.nature.activeNow}
                </Badge>
              )}
              <span className="ml-auto text-sm text-muted-foreground">
                {entry.daysUntilPeak === 0
                  ? t.nature.peakToday
                  : entry.daysUntilPeak === 1
                    ? t.nature.peakTomorrow
                    : t.nature.peakInDays(entry.daysUntilPeak)}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {fmtDate(entry.peakDate, lang)} ·{" "}
              {t.nature.meteorRate(entry.shower.zhr)} ·{" "}
              {t.nature.radiantDirection(pick(entry.shower.radiant, lang))}
            </p>
            <p className="mt-1.5 text-sm">{pick(entry.shower.tip, lang)}</p>
            <p
              className={cn(
                "mt-1.5 text-xs",
                entry.moonInterferes
                  ? "text-destructive"
                  : "text-muted-foreground"
              )}
            >
              {entry.moonInterferes
                ? t.nature.moonInterferes(
                    Math.round(entry.moonIllumination * 100)
                  )
                : t.nature.moonOk(Math.round(entry.moonIllumination * 100))}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        {t.nature.meteorFootnote}
      </p>
    </section>
  );
}

/**
 * Beobachtungsort für die Astro-Abschnitte: bevorzugt GPS, sonst der erste
 * gespeicherte Zeltplatz (dann mit Namen). Ohne beides bleibt `coords` null –
 * die Abschnitte zeigen dann ihren Hinweis. Einmal bestimmt, bleibt der Ort
 * für die Sitzung stehen; ISS-Überflüge und Sternbild-Finder nutzen
 * dieselbe Logik.
 */
function useStargazingLocation(): {
  coords: { lat: number; lon: number } | null;
  placeName: string | null;
  locating: boolean;
} {
  const { isAuthenticated } = useAuth();
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    null
  );
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [locating, setLocating] = useState(true);
  const spotsQuery = trpc.spots.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const spots = spotsQuery.data;
  const spotsLoading = isAuthenticated && spotsQuery.isPending;
  useEffect(() => {
    if (coords || spotsLoading) return;
    let cancelled = false;
    const fallbackToSpot = () => {
      if (cancelled) return;
      const spot = spots?.[0];
      if (spot) {
        setCoords({ lat: spot.latitude, lon: spot.longitude });
        setPlaceName(spot.name);
      }
      setLocating(false);
    };
    if (!navigator.geolocation) {
      fallbackToSpot();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        if (cancelled) return;
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setPlaceName(null);
        setLocating(false);
      },
      fallbackToSpot,
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 }
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotsLoading, spots]);

  return { coords, placeName, locating };
}

/**
 * Dunkler Himmel am Beobachtungsort (#239): geschätzte Bortle-Klasse plus
 * «heute Nacht lohnt es sich besonders», wenn dunkler Himmel, klare Nacht
 * und wenig Mondlicht zusammenkommen. Ort wie bei ISS-Überflügen und
 * Sternbild-Finder: GPS zuerst, sonst der erste gespeicherte Zeltplatz.
 */
export function DarkSkySection() {
  const t = useT();
  const { coords, placeName, locating } = useStargazingLocation();

  if (!coords) {
    return (
      <section
        className="mb-6 rounded-xl border border-border bg-card p-4"
        aria-label={t.darkSky.sectionAria}
      >
        <div className="mb-1 flex items-center gap-2">
          <Telescope className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 className="font-serif text-lg font-semibold">
            {t.darkSky.title}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {locating ? t.darkSky.locating : t.darkSky.noLocation}
        </p>
      </section>
    );
  }

  return (
    <DarkSkyPanel
      latitude={coords.lat}
      longitude={coords.lon}
      placeName={placeName}
      className="mb-6"
    />
  );
}

/**
 * ISS-Überflüge (#222): die nächsten SICHTBAREN Überflüge der Raumstation
 * über dem eigenen Standort. Die Bahnrechnung macht der Server (server/iss.ts
 * mit Zwischenspeicher), die Auswahl der sichtbaren Überflüge shared/iss.ts.
 * Ort: bevorzugt GPS, sonst der erste gespeicherte Zeltplatz.
 */
export function IssPasses() {
  const { lang, t } = useI18n();
  const { coords, placeName, locating } = useStargazingLocation();

  const passesQuery = trpc.iss.passes.useQuery(
    { latitude: coords?.lat ?? 0, longitude: coords?.lon ?? 0 },
    { enabled: coords !== null, staleTime: 30 * 60 * 1000 }
  );
  const passes = passesQuery.data?.passes ?? [];

  return (
    <section
      className="mb-6 rounded-xl border border-border bg-card p-4"
      aria-label={t.iss.sectionAria}
    >
      <div className="mb-1 flex items-center gap-2">
        <Satellite className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 className="font-serif text-lg font-semibold">{t.iss.title}</h2>
      </div>
      <p className="mb-3 text-sm text-muted-foreground">
        {placeName ? t.iss.subtitleAtPlace(placeName) : t.iss.subtitle}
      </p>

      {locating || (coords !== null && passesQuery.isPending) ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {t.iss.loading}
        </p>
      ) : coords === null ? (
        <p className="text-sm text-muted-foreground">{t.iss.noLocation}</p>
      ) : passesQuery.isError ? (
        <p className="text-sm text-muted-foreground">{t.iss.loadFailed}</p>
      ) : passes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {passesQuery.data?.sourceReachable
            ? t.iss.noneVisible
            : t.iss.loadFailed}
        </p>
      ) : (
        <ul className="space-y-3">
          {passes.map(pass => (
            <li key={pass.startMs} className="rounded-lg bg-accent/50 p-3">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p className="font-semibold">
                  {fmtDate(new Date(pass.startMs), lang)}
                </p>
                <p className="font-semibold text-primary">
                  {fmtTime(new Date(pass.startMs), lang)}
                </p>
                <span className="ml-auto text-sm text-muted-foreground">
                  {t.iss.duration(pass.durationMinutes)}
                </span>
              </div>
              <p className="mt-1 text-sm">
                {t.iss.path(passPathText(pass, lang))}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t.iss.maxElevation(Math.round(pass.maxElevationDeg))} ·{" "}
                {t.iss.brightness(pass.magnitude.toFixed(1))}
              </p>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-xs text-muted-foreground">{t.iss.footnote}</p>
    </section>
  );
}

/**
 * Sternbild-Finder (#225): Handy an den Himmel halten und ablesen, welches
 * Sternbild dort steht. Die Blickrichtung kommt aus dem Kompass (heading,
 * derselbe geglättete Hook wie im Zelt-Finder), die Blickhöhe aus der Neigung
 * des Geräts (viewAltitude). Gerechnet wird alles in shared/skyPosition.ts.
 *
 * Fallback wie im Zelt-Finder: Ohne Kompass (iOS-Erlaubnis verweigert, kein
 * Sensor) erscheint ein verständlicher Hinweis samt Knopf zum Nachfragen –
 * die Liste «heute Nacht sichtbar» steht in jedem Fall.
 *
 * Der Rotlicht-Modus (#84) legt seinen Filter über die ganze Seite und greift
 * dadurch auch hier; der Abschnitt verwendet bewusst keine eigenen
 * Overlay-Ebenen, die darüber liegen könnten.
 */
export function ConstellationFinder({
  onOpenEntry,
}: {
  onOpenEntry: (entry: NatureEntry) => void;
}) {
  const { lang, t } = useI18n();
  const { coords, placeName, locating } = useStargazingLocation();
  const { heading, viewAltitude, permission, start } = useDeviceHeading();

  // Kompass direkt starten (Android/Desktop); iOS verlangt den Knopf unten
  useEffect(() => {
    void start();
  }, [start]);

  // Der Himmel dreht sich – die Positionen alle 20 Sekunden nachführen
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 20000);
    return () => window.clearInterval(id);
  }, []);

  const nowSightings = useMemo(
    () => (coords ? skyObjectsAt(now, coords.lat, coords.lon) : []),
    [coords, now]
  );
  const nightTime = useMemo(() => nightReferenceTime(now), [now]);
  const tonight = useMemo(
    () => (coords ? visibleSkyObjects(nightTime, coords.lat, coords.lon) : []),
    [coords, nightTime]
  );
  const bright = coords ? !isDarkEnough(now, coords.lat, coords.lon) : false;

  const compassReady = heading !== null && viewAltitude !== null;
  const inView = compassReady
    ? objectInView(nowSightings, heading, viewAltitude)
    : null;

  /** Lexikon-Eintrag zu einem Himmelsobjekt öffnen, sofern es einen gibt. */
  const openLexicon = (entryId: string | undefined) => {
    const entry = entryId
      ? natureEntries.find(candidate => candidate.id === entryId)
      : undefined;
    if (entry) onOpenEntry(entry);
  };

  /** Eine Zeile «Name · Richtung · Höhe» mit optionalem Lexikon-Knopf. */
  const sightingRow = (sighting: SkySighting) => (
    <li key={sighting.object.id} className="rounded-lg bg-accent/50 p-3">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <p className="font-semibold">{pick(sighting.object.name, lang)}</p>
        <span className="ml-auto font-mono text-sm text-muted-foreground">
          {t.skyFinder.position(
            compassDirection(sighting.position.azimuth, lang),
            Math.round(sighting.position.altitude)
          )}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {pick(sighting.object.hint, lang)}
      </p>
      {sighting.object.natureEntryId && (
        <button
          type="button"
          onClick={() => openLexicon(sighting.object.natureEntryId)}
          className="mt-1.5 text-sm font-medium text-primary underline"
        >
          {t.skyFinder.lexiconLink}
        </button>
      )}
    </li>
  );

  return (
    <section
      className="mb-6 rounded-xl border border-border bg-card p-4"
      aria-label={t.skyFinder.sectionAria}
    >
      <div className="mb-1 flex items-center gap-2">
        <Telescope className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 className="font-serif text-lg font-semibold">
          {t.skyFinder.title}
        </h2>
      </div>
      <p className="mb-3 text-sm text-muted-foreground">
        {placeName
          ? t.skyFinder.subtitleAtPlace(placeName)
          : t.skyFinder.subtitle}
      </p>

      {locating ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {t.skyFinder.locating}
        </p>
      ) : coords === null ? (
        <p className="text-sm text-muted-foreground">
          {t.skyFinder.noLocation}
        </p>
      ) : (
        <>
          {/* Blickrichtung: nur mit Kompass UND Neigung sinnvoll */}
          {compassReady ? (
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-3.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t.skyFinder.viewTitle}
              </p>
              <p className="mt-0.5 font-mono text-sm text-muted-foreground">
                {t.skyFinder.viewDirection(
                  compassDirection(heading, lang),
                  Math.round(viewAltitude)
                )}
              </p>
              {inView ? (
                <>
                  <p className="mt-2 font-serif text-2xl font-semibold text-primary">
                    {pick(inView.sighting.object.name, lang)}
                  </p>
                  <p className="mt-1 text-sm">
                    {pick(inView.sighting.object.hint, lang)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.skyFinder.separation(Math.round(inView.separationDeg))}
                  </p>
                  {inView.sighting.object.natureEntryId && (
                    <button
                      type="button"
                      onClick={() =>
                        openLexicon(inView.sighting.object.natureEntryId)
                      }
                      className="mt-1.5 text-sm font-medium text-primary underline"
                    >
                      {t.skyFinder.lexiconLink}
                    </button>
                  )}
                </>
              ) : (
                <p className="mt-2 text-sm">
                  {viewAltitude < 0
                    ? t.skyFinder.viewGround
                    : t.skyFinder.viewNothing}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-start gap-2 rounded-lg border border-border bg-muted/40 p-3.5">
              <p className="text-sm text-muted-foreground">
                {permission === "unsupported"
                  ? t.skyFinder.noCompass
                  : permission === "denied"
                    ? t.skyFinder.compassDenied
                    : t.skyFinder.compassHint}
              </p>
              {permission !== "unsupported" && (
                <Button size="sm" onClick={() => void start()}>
                  <Compass className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {t.skyFinder.compassStart}
                </Button>
              )}
            </div>
          )}

          {bright && (
            <p className="mt-3 text-sm text-muted-foreground">
              {t.skyFinder.daylightHint}
            </p>
          )}

          {/* Liste – steht auch ohne Kompass immer zur Verfügung */}
          <h3 className="mb-2 mt-4 text-sm font-semibold">
            {t.skyFinder.tonightTitle(fmtTime(nightTime, lang))}
          </h3>
          {tonight.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t.skyFinder.tonightEmpty}
            </p>
          ) : (
            <ul className="space-y-2">{tonight.map(sightingRow)}</ul>
          )}
        </>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        {t.skyFinder.footnote}
      </p>
    </section>
  );
}

/**
 * Rotlicht-Umschalter im Astro-Bereich: erklärt die Dunkeladaption und
 * schaltet den App-weiten Rotfilter ein. Zustand bewusst nur im Speicher.
 */
export function RedLightSection({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: () => void;
}) {
  const { t } = useI18n();
  return (
    <section
      className="mb-6 rounded-xl border border-border bg-card p-4"
      aria-label={t.nature.redLightSectionAria}
    >
      <div className="mb-2 flex items-center gap-2">
        <Flashlight className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 className="font-serif text-lg font-semibold">
          {t.nature.redLightTitle}
        </h2>
      </div>
      <p className="mb-3 text-sm text-muted-foreground">
        {t.nature.redLightHint}
      </p>
      <Button
        variant="outline"
        size="sm"
        aria-pressed={active}
        onClick={onToggle}
      >
        <Flashlight className="mr-1.5 h-4 w-4" aria-hidden="true" />
        {active ? t.nature.redLightOff : t.nature.redLightOn}
      </Button>
    </section>
  );
}
