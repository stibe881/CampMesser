import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Binoculars,
  CalendarCheck,
  CalendarDays,
  Cherry,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  Flashlight,
  HelpCircle,
  ImagePlus,
  Info,
  LayoutGrid,
  Lightbulb,
  Loader2,
  LocateFixed,
  MapPin,
  Moon,
  PawPrint,
  Pencil,
  Plus,
  Satellite,
  Sparkles,
  Sprout,
  Telescope,
  Trash2,
  TreePine,
  UtensilsCrossed,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import FishingLog from "@/components/FishingLog";
import LoginPrompt from "@/components/LoginPrompt";
import DarkSkyPanel from "@/components/DarkSkyPanel";
import RedLightMode from "@/components/RedLightMode";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  natureCategories,
  natureEntries,
  type NatureEntry,
} from "@/data/nature";
import {
  getMoonInfo,
  moonMonth,
  nextFullMoons,
  nextNewMoons,
  stargazingQuality,
  type MoonPhaseId,
} from "@shared/moon";
import { addMonths } from "@shared/calendar";
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
import {
  ALL_MONTHS,
  inSeason,
  seasonMonths,
  type Season,
} from "@shared/season";
import { useAuth } from "@/_core/hooks/useAuth";
import { useDeviceHeading } from "@/hooks/useDeviceHeading";
import { useI18n, useT } from "@/i18n";
import { resizeImageForUpload } from "@/lib/imageResize";
import {
  collectionProgress,
  type CollectionSighting,
} from "@/lib/natureCollection";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

/** Private Foto-URL einer Beobachtung (Auth über Session-Cookie). */
function sightingPhotoUrl(fileName: string): string {
  return `/api/sightings/photos/${fileName}`;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  PawPrint,
  Sparkles,
  TreePine,
  Sprout,
  Cherry,
};

const QUALITY_STYLES: Record<string, string> = {
  hervorragend: "bg-primary/15 text-primary",
  gut: "bg-chart-2/20 text-foreground",
  mittel: "bg-chart-4/20 text-foreground",
  schlecht: "bg-destructive/10 text-destructive",
};

function fmtDate(d: Date, lang: Language) {
  return d.toLocaleDateString(LOCALE_TAGS[lang], {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Uhrzeit in der aktiven Sprache, z. B. «21:34». */
function fmtTime(d: Date, lang: Language) {
  return d.toLocaleTimeString(LOCALE_TAGS[lang], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Monatsname (1–12) in der aktiven Sprache, z. B. «Mai». */
function monthName(month: number, lang: Language): string {
  return new Date(2000, month - 1, 1).toLocaleDateString(LOCALE_TAGS[lang], {
    month: "long",
  });
}

/** Einbuchstabiges Monats-Kürzel für den Saison-Streifen, z. B. «M». */
function monthNarrow(month: number, lang: Language): string {
  return new Date(2000, month - 1, 1).toLocaleDateString(LOCALE_TAGS[lang], {
    month: "narrow",
  });
}

/**
 * Zwölf-Monats-Streifen einer Saison: die Monate der Saison sind eingefärbt.
 * Die Monatsliste kommt aus `seasonMonths` (@shared/season), damit Zeiträume
 * über den Jahreswechsel – Schlehe Oktober bis Januar – ohne Sonderfall
 * stimmen. Rein visuell: die Saison steht als Text daneben, darum aria-hidden.
 */
function SeasonStrip({ season, lang }: { season: Season; lang: Language }) {
  const active = seasonMonths(season);
  return (
    <ul className="mb-4 grid grid-cols-12 gap-0.5" aria-hidden="true">
      {ALL_MONTHS.map(month => (
        <li
          key={month}
          className={cn(
            "rounded-sm py-1 text-center text-[10px] font-semibold uppercase",
            active.includes(month)
              ? "bg-primary/20 text-primary"
              : "bg-muted text-muted-foreground"
          )}
        >
          {monthNarrow(month, lang)}
        </li>
      ))}
    </ul>
  );
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
function MoonCalendar() {
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
function MeteorCalendar() {
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
function DarkSkySection() {
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
function IssPasses() {
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
function ConstellationFinder({
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
function RedLightSection({
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

/**
 * Arten-Sammelalbum: alle Lexikon-Arten als Raster – beobachtete farbig mit
 * dem Datum der ersten Sichtung, offene ausgegraut. Ein Klick öffnet den
 * Lexikon-Eintrag weiter unten auf der Seite.
 */
function CollectionAlbum({
  sightings,
  onOpenEntry,
}: {
  sightings: CollectionSighting[];
  onOpenEntry: (entry: NatureEntry) => void;
}) {
  const { lang, t } = useI18n();
  const tc = t.nature.collection;
  const progress = useMemo(
    () => collectionProgress(natureEntries, sightings),
    [sightings]
  );

  return (
    <div className="mt-5 border-t border-border/60 pt-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <LayoutGrid className="h-4 w-4 text-primary" aria-hidden="true" />
        <h3 className="font-semibold">{tc.title}</h3>
        <span className="ml-auto text-sm text-muted-foreground">
          {tc.progress(progress.seenCount, progress.total)}
        </span>
      </div>
      <Progress
        value={Math.round(progress.ratio * 100)}
        className="mb-3 h-2"
        aria-label={tc.progressAria}
      />
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {progress.items.map(item => {
          const name = pick(item.entry.name, lang);
          const seenOn = item.firstSeen
            ? fmtDate(new Date(`${item.firstSeen}T00:00:00`), lang)
            : null;
          return (
            <li key={item.entry.id}>
              <button
                type="button"
                onClick={() => onOpenEntry(item.entry)}
                aria-label={
                  seenOn ? tc.seenAria(name, seenOn) : tc.openAria(name)
                }
                className={cn(
                  "flex h-full w-full flex-col items-center gap-1 rounded-lg border p-2 text-center transition-colors hover:border-primary/50",
                  item.firstSeen
                    ? "border-primary/40 bg-accent/50"
                    : "border-border bg-card"
                )}
              >
                {item.entry.image ? (
                  <img
                    src={item.entry.image}
                    alt=""
                    loading="lazy"
                    className={cn(
                      "h-12 w-full rounded-md object-cover",
                      !item.firstSeen && "opacity-40 grayscale"
                    )}
                  />
                ) : (
                  <span
                    className={cn(
                      "flex h-12 w-full items-center justify-center rounded-md bg-muted",
                      !item.firstSeen && "opacity-40"
                    )}
                  >
                    <TreePine
                      className="h-5 w-5 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </span>
                )}
                <span
                  className={cn(
                    "text-xs font-medium leading-tight",
                    !item.firstSeen && "text-muted-foreground"
                  )}
                >
                  {name}
                </span>
                <span className="text-[10px] leading-tight text-muted-foreground">
                  {seenOn ?? tc.notSeen}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">{tc.hint}</p>
    </div>
  );
}

/** Formular-Zustand einer Beobachtung – Foto-Schritte laufen beim Speichern. */
interface SightingFormState {
  id?: number;
  title: string;
  /** "none" = keine Lexikon-Verknüpfung (Select kennt keinen Leerwert) */
  entryId: string;
  sightedAt: string;
  lat: number | null;
  lon: number | null;
  note: string;
  fileName: string | null;
}

function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * «Meine Beobachtungen»: persönliches Sichtungs-Tagebuch – Liste mit Foto und
 * Arten-Chip, Formular mit Lexikon-Vorschlag, Geolocation-Knopf und Foto.
 * Beobachtungen mit Koordinaten erscheinen zusätzlich als Pins auf /karte.
 */
function SightingsSection({
  onOpenEntry,
}: {
  onOpenEntry: (entry: NatureEntry) => void;
}) {
  const { lang, t } = useI18n();
  const ts = t.nature.sightings;
  const { isAuthenticated, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  const query = trpc.sightings.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const emptyForm: SightingFormState = {
    title: "",
    entryId: "none",
    sightedAt: todayIso(),
    lat: null,
    lon: null,
    note: "",
    fileName: null,
  };
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<SightingFormState>(emptyForm);
  // Foto: neu ausgewählt (bereits verkleinert), Vorschau-URL und
  // «bestehendes Foto entfernen»-Wunsch – ausgeführt wird alles beim Speichern.
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [locating, setLocating] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Objekt-URL der Vorschau beim Ersetzen/Schliessen wieder freigeben
  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  const addMutation = trpc.sightings.add.useMutation();
  const updateMutation = trpc.sightings.update.useMutation();
  const removePhotoMutation = trpc.sightings.removePhoto.useMutation();
  const removeMutation = trpc.sightings.remove.useMutation({
    onSuccess: () => {
      void utils.sightings.list.invalidate();
      toast.success(ts.deleted);
    },
    onError: () => toast.error(t.common.deleteFailed),
  });

  const resetPhotoState = () => {
    setPhotoBlob(null);
    setPhotoPreviewUrl(null);
    setRemovePhoto(false);
  };

  const openNew = () => {
    setForm({ ...emptyForm, sightedAt: todayIso() });
    resetPhotoState();
    setDialogOpen(true);
  };

  const openEdit = (sighting: NonNullable<typeof query.data>[number]) => {
    setForm({
      id: sighting.id,
      title: sighting.title,
      entryId: sighting.entryId ?? "none",
      sightedAt: sighting.sightedAt,
      lat: sighting.lat,
      lon: sighting.lon,
      note: sighting.note ?? "",
      fileName: sighting.fileName ?? null,
    });
    resetPhotoState();
    setDialogOpen(true);
  };

  // Aktuelle Vorschau: neues Foto > bestehendes Foto (sofern nicht entfernt)
  const previewUrl =
    photoPreviewUrl ??
    (form.fileName && !removePhoto ? sightingPhotoUrl(form.fileName) : null);

  const handlePhotoSelected = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (photoInputRef.current) photoInputRef.current.value = "";
    if (!file) return;
    try {
      const blob = await resizeImageForUpload(file);
      setPhotoBlob(blob);
      setPhotoPreviewUrl(URL.createObjectURL(blob));
      setRemovePhoto(false);
    } catch {
      // Dekodieren fehlgeschlagen – bei HEIC/HEIF gezielt darauf hinweisen
      const isHeic =
        /image\/hei[cf]/.test(file.type) || /\.hei[cf]$/i.test(file.name);
      toast.error(isHeic ? ts.photoHeic : ts.photoReadFailed);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoBlob(null);
    setPhotoPreviewUrl(null);
    if (form.fileName) setRemovePhoto(true);
  };

  /** Lexikon-Auswahl füllt den Titel als Vorschlag vor (bleibt editierbar). */
  const handleEntrySelected = (value: string) => {
    setForm(prev => {
      const entry =
        value === "none" ? undefined : natureEntries.find(e => e.id === value);
      return {
        ...prev,
        entryId: value,
        title: entry ? pick(entry.name, lang) : prev.title,
      };
    });
  };

  /** Aktuellen Geräte-Standort übernehmen (auf 5 Stellen gerundet). */
  const useCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error(ts.locationUnsupported);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        setLocating(false);
        setForm(prev => ({
          ...prev,
          lat: Number(position.coords.latitude.toFixed(5)),
          lon: Number(position.coords.longitude.toFixed(5)),
        }));
      },
      () => {
        setLocating(false);
        toast.error(ts.locationFailed);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const submit = async () => {
    const title = form.title.trim();
    if (!title) {
      toast.error(ts.titleRequired);
      return;
    }
    const data = {
      title,
      entryId: form.entryId === "none" ? null : form.entryId,
      sightedAt: form.sightedAt || todayIso(),
      lat: form.lat,
      lon: form.lon,
      note: form.note.trim() || null,
    };
    try {
      let id: number;
      if (form.id) {
        await updateMutation.mutateAsync({ id: form.id, ...data });
        id = form.id;
      } else {
        ({ id } = await addMutation.mutateAsync(data));
      }
      // Foto-Schritt nach dem Speichern: Upload ersetzt ein bestehendes
      // Foto serverseitig, Entfernen läuft über tRPC.
      if (photoBlob) {
        setPhotoUploading(true);
        try {
          const response = await fetch(`/api/sightings/${id}/photo`, {
            method: "POST",
            headers: { "Content-Type": "image/jpeg" },
            body: photoBlob,
            credentials: "include",
          });
          if (!response.ok) {
            toast.error(
              response.status === 413 ? ts.photoTooLarge : ts.photoUploadFailed
            );
          }
        } catch {
          toast.error(ts.photoUploadFailed);
        } finally {
          setPhotoUploading(false);
        }
      } else if (removePhoto && form.fileName) {
        try {
          await removePhotoMutation.mutateAsync({ id });
        } catch {
          toast.error(ts.photoRemoveFailed);
        }
      }
      void utils.sightings.list.invalidate();
      setDialogOpen(false);
      toast.success(form.id ? ts.updated : ts.created);
    } catch {
      toast.error(t.common.saveFailed);
    }
  };

  const sightings = query.data ?? [];
  const saving =
    addMutation.isPending || updateMutation.isPending || photoUploading;

  return (
    <section
      className="mb-6 rounded-xl border border-border bg-card p-4"
      aria-label={ts.sectionAria}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Binoculars className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 className="font-serif text-lg font-semibold">{ts.title}</h2>
        {isAuthenticated && sightings.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {ts.count(sightings.length)}
          </span>
        )}
        {isAuthenticated && (
          <Button
            size="sm"
            className="ml-auto"
            onClick={openNew}
            aria-label={ts.addAria}
          >
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {ts.addButton}
          </Button>
        )}
      </div>
      <p className="mb-4 text-sm text-muted-foreground">{ts.intro}</p>

      {!authLoading && !isAuthenticated ? (
        <LoginPrompt feature={ts.loginFeature} />
      ) : query.isLoading || authLoading ? (
        <div className="flex justify-center py-8">
          <Loader2
            className="h-6 w-6 animate-spin text-muted-foreground"
            aria-label={t.common.loading}
          />
        </div>
      ) : query.isError ? (
        <p className="text-sm text-destructive">{ts.loadFailed}</p>
      ) : sightings.length === 0 ? (
        <p className="rounded-lg bg-accent/50 p-3 text-sm text-muted-foreground">
          {ts.empty}
        </p>
      ) : (
        <ul className="space-y-3">
          {sightings.map(sighting => {
            const entry = sighting.entryId
              ? natureEntries.find(e => e.id === sighting.entryId)
              : undefined;
            return (
              <li
                key={sighting.id}
                className="flex gap-3 rounded-lg border border-border/60 bg-background p-3"
              >
                {sighting.fileName && (
                  <img
                    src={sightingPhotoUrl(sighting.fileName)}
                    alt={ts.photoAlt(sighting.title)}
                    loading="lazy"
                    className="h-16 w-16 shrink-0 rounded-md border border-border/60 object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">
                    {fmtDate(new Date(`${sighting.sightedAt}T00:00:00`), lang)}
                  </p>
                  <p className="font-semibold">{sighting.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {entry && (
                      <Badge className="border-0 bg-primary/15 text-primary">
                        {pick(entry.name, lang)}
                      </Badge>
                    )}
                    {sighting.lat != null && sighting.lon != null && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <LocateFixed
                          className="h-3 w-3 shrink-0"
                          aria-hidden="true"
                        />
                        {ts.onMapHint}
                      </span>
                    )}
                  </div>
                  {sighting.note && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {sighting.note}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => openEdit(sighting)}
                    aria-label={ts.editAria(sighting.title)}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      if (confirm(ts.deleteConfirm(sighting.title))) {
                        removeMutation.mutate({ id: sighting.id });
                      }
                    }}
                    aria-label={ts.deleteAria(sighting.title)}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {isAuthenticated &&
        !authLoading &&
        !query.isLoading &&
        !query.isError && (
          <CollectionAlbum sightings={sightings} onOpenEntry={onOpenEntry} />
        )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {form.id ? ts.dialogTitleEdit : ts.dialogTitleNew}
            </DialogTitle>
            <DialogDescription>{ts.dialogDescription}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="sighting-entry">{ts.entryLabel}</Label>
              <Select value={form.entryId} onValueChange={handleEntrySelected}>
                <SelectTrigger id="sighting-entry" aria-label={ts.entryLabel}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{ts.entryNone}</SelectItem>
                  {natureEntries.map(entry => (
                    <SelectItem key={entry.id} value={entry.id}>
                      {pick(entry.name, lang)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sighting-title">{ts.titleLabel}</Label>
              <Input
                id="sighting-title"
                value={form.title}
                onChange={e =>
                  setForm(prev => ({ ...prev, title: e.target.value }))
                }
                placeholder={ts.titlePlaceholder}
                maxLength={120}
              />
            </div>
            <div>
              <Label htmlFor="sighting-date">{ts.dateLabel}</Label>
              <Input
                id="sighting-date"
                type="date"
                value={form.sightedAt}
                onChange={e =>
                  setForm(prev => ({ ...prev, sightedAt: e.target.value }))
                }
              />
            </div>
            <fieldset>
              <legend className="mb-1.5 text-sm font-medium">
                {ts.locationLegend}
              </legend>
              {form.lat != null && form.lon != null ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <LocateFixed
                      className="h-4 w-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    {ts.locationSet(form.lat.toFixed(5), form.lon.toFixed(5))}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() =>
                      setForm(prev => ({ ...prev, lat: null, lon: null }))
                    }
                  >
                    {ts.removeLocation}
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={useCurrentLocation}
                  disabled={locating}
                >
                  {locating ? (
                    <Loader2
                      className="mr-1.5 h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <LocateFixed
                      className="mr-1.5 h-4 w-4"
                      aria-hidden="true"
                    />
                  )}
                  {locating ? ts.locating : ts.useLocation}
                </Button>
              )}
              <p className="mt-1.5 text-xs text-muted-foreground">
                {ts.onMapHint}
              </p>
            </fieldset>
            <div>
              <Label htmlFor="sighting-note">{ts.noteLabel}</Label>
              <Textarea
                id="sighting-note"
                value={form.note}
                onChange={e =>
                  setForm(prev => ({ ...prev, note: e.target.value }))
                }
                placeholder={ts.notePlaceholder}
                maxLength={500}
                rows={3}
              />
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium">{ts.photoLabel}</p>
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt={ts.photoPreviewAlt}
                  className="mb-2 aspect-[4/3] w-full rounded-lg border border-border/60 object-cover"
                />
              )}
              <div className="flex gap-2">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => void handlePhotoSelected(e.target.files)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => photoInputRef.current?.click()}
                >
                  <ImagePlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {previewUrl ? ts.photoChange : ts.photoChoose}
                </Button>
                {previewUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={handleRemovePhoto}
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    {ts.photoRemove}
                  </Button>
                )}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {ts.photoHint}
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => void submit()}
              disabled={saving}
            >
              {saving && (
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              {photoUploading ? ts.photoUploading : t.common.save}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default function NaturePage() {
  const { lang, t } = useI18n();
  const [category, setCategory] = useState<string>("tierspuren");
  const [redLight, setRedLight] = useState(false);
  // «Jetzt zu sehen»: nur Einträge, deren Saison den aktuellen Monat umfasst
  const [nowOnly, setNowOnly] = useState(false);
  // Offener Lexikon-Eintrag (Accordion kontrolliert, damit das Sammelalbum
  // gezielt einen Eintrag aufklappen kann); "" = alles zu.
  const [openEntryId, setOpenEntryId] = useState("");
  // Nur nach einem Klick im Sammelalbum wird gescrollt – nicht beim normalen
  // Auf- und Zuklappen im Lexikon.
  const scrollToRef = useRef<string | null>(null);
  const currentMonth = new Date().getMonth() + 1;
  const activeCategory = natureCategories.find(c => c.id === category)!;
  const entries = natureEntries.filter(
    e =>
      e.category === category && (!nowOnly || inSeason(e.season, currentMonth))
  );

  /** Aus dem Sammelalbum zum Lexikon-Eintrag springen und ihn aufklappen. */
  const openLexiconEntry = (entry: NatureEntry) => {
    setCategory(entry.category);
    // Der Saison-Filter könnte den Eintrag ausblenden – deshalb zurücksetzen
    setNowOnly(false);
    setOpenEntryId(entry.id);
    scrollToRef.current = entry.id;
  };

  useEffect(() => {
    if (!scrollToRef.current || scrollToRef.current !== openEntryId) return;
    scrollToRef.current = null;
    document
      .getElementById(`natur-eintrag-${openEntryId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [openEntryId, category, nowOnly]);

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader title={t.nature.title} subtitle={t.nature.subtitle} />

      <div className="mb-4 flex items-center gap-2 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t.nature.offlineNote}
      </div>

      <MoonCalendar />
      <DarkSkySection />
      <MeteorCalendar />
      <IssPasses />
      <ConstellationFinder onOpenEntry={openLexiconEntry} />
      <SightingsSection onOpenEntry={openLexiconEntry} />
      <FishingLog />
      <RedLightSection
        active={redLight}
        onToggle={() => setRedLight(v => !v)}
      />
      {redLight && <RedLightMode onExit={() => setRedLight(false)} />}

      <div
        className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-5"
        role="group"
        aria-label={t.nature.categoryAria}
      >
        {natureCategories.map(c => {
          const Icon = iconMap[c.icon] ?? TreePine;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border p-3.5 transition-all",
                category === c.id
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              )}
              aria-pressed={category === c.id}
            >
              <Icon className="h-6 w-6" aria-hidden="true" />
              <span className="text-sm font-semibold">
                {pick(c.label, lang)}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        {pick(activeCategory.intro, lang)}
      </p>

      {/* Sicherheits-Warnung der Kategorie (Pilze, Beeren) – nicht im
          Kleingedruckten, sondern über der Liste. */}
      {activeCategory.warning && (
        <div className="mb-3 flex gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 p-3">
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <div className="text-sm">
            <p className="font-semibold text-destructive">
              {t.nature.safetyTitle}
            </p>
            <p className="mt-1">{pick(activeCategory.warning, lang)}</p>
          </div>
        </div>
      )}
      {activeCategory.rulesHint && (
        <div className="mb-4 flex gap-2.5 rounded-lg bg-accent/60 p-3">
          <Info
            className="mt-0.5 h-4 w-4 shrink-0 text-primary"
            aria-hidden="true"
          />
          <div className="text-sm">
            <p className="font-semibold">{t.nature.rulesTitle}</p>
            <p className="mt-1">{pick(activeCategory.rulesHint, lang)}</p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setNowOnly(v => !v)}
        aria-pressed={nowOnly}
        aria-label={t.nature.nowFilterAria}
        className={cn(
          "mb-5 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
          nowOnly
            ? "border-primary bg-accent text-primary"
            : "border-border bg-card text-muted-foreground hover:border-primary/40"
        )}
      >
        <CalendarCheck className="h-4 w-4" aria-hidden="true" />
        {t.nature.nowFilter}
      </button>

      {entries.length === 0 && (
        <p className="rounded-lg bg-accent/50 p-3 text-sm text-muted-foreground">
          {t.nature.nowFilterEmpty}
        </p>
      )}

      <Accordion
        type="single"
        collapsible
        className="space-y-3"
        value={openEntryId}
        onValueChange={setOpenEntryId}
      >
        {entries.map(entry => (
          <AccordionItem
            key={entry.id}
            id={`natur-eintrag-${entry.id}`}
            value={entry.id}
            className="overflow-hidden rounded-xl border border-border bg-card px-0"
          >
            <AccordionTrigger className="px-4 py-3.5 hover:no-underline">
              <div className="text-left">
                <p className="font-semibold">{pick(entry.name, lang)}</p>
                {entry.latinOrExtra && (
                  <p className="text-xs italic text-muted-foreground">
                    {pick(entry.latinOrExtra, lang)}
                  </p>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {entry.image && (
                <img
                  src={entry.image}
                  alt={t.nature.imageAlt(pick(entry.name, lang))}
                  loading="lazy"
                  className="mb-4 aspect-[4/3] w-full rounded-lg border border-border object-cover"
                />
              )}
              <p className="mb-4 text-sm leading-relaxed">
                {pick(entry.description, lang)}
              </p>

              {entry.season && (
                <>
                  <p className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays
                      className="h-4 w-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    {t.nature.seasonLine(
                      monthName(entry.season.from, lang),
                      monthName(entry.season.to, lang)
                    )}
                  </p>
                  <SeasonStrip season={entry.season} lang={lang} />
                </>
              )}

              {entry.habitat && (
                <p className="mb-3 flex gap-2 text-sm">
                  <MapPin
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span>
                    <span className="font-semibold">
                      {t.nature.habitatTitle}
                    </span>{" "}
                    {pick(entry.habitat, lang)}
                  </span>
                </p>
              )}
              {entry.use && (
                <p className="mb-4 flex gap-2 text-sm">
                  <UtensilsCrossed
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span>
                    <span className="font-semibold">{t.nature.useTitle}</span>{" "}
                    {pick(entry.use, lang)}
                  </span>
                </p>
              )}

              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t.nature.featuresTitle}
              </h3>
              <ul className="mb-4 space-y-1 text-sm">
                {entry.features.map(f => (
                  <li key={f.de} className="flex gap-2">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                    {pick(f, lang)}
                  </li>
                ))}
              </ul>

              <div className="mb-3 flex gap-2.5 rounded-lg bg-accent/60 p-3">
                <Lightbulb
                  className="h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <p className="text-sm">
                  <span className="font-semibold">{t.nature.funFactTitle}</span>{" "}
                  {pick(entry.funFact, lang)}
                </p>
              </div>

              <div className="flex gap-2.5 rounded-lg border border-chart-1/40 bg-chart-1/10 p-3">
                <HelpCircle
                  className="h-4 w-4 shrink-0 text-amber-glow"
                  aria-hidden="true"
                />
                <p className="text-sm">
                  <span className="font-semibold">{t.nature.kidsTitle}</span>{" "}
                  {pick(entry.kidQuestion, lang)}
                </p>
              </div>

              {entry.lookalikes && entry.lookalikes.length > 0 && (
                <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3">
                  <p className="flex items-center gap-2 font-semibold text-destructive">
                    <AlertTriangle
                      className="h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    {t.nature.lookalikeTitle}
                  </p>
                  <p className="mt-1 text-sm">{t.nature.lookalikeIntro}</p>
                  <ul className="mt-2 space-y-2">
                    {entry.lookalikes.map(look => (
                      <li key={look.latin} className="text-sm">
                        <p className="font-semibold">
                          {pick(look.name, lang)}{" "}
                          <span className="font-normal italic text-muted-foreground">
                            {look.latin}
                          </span>
                        </p>
                        <p>{pick(look.warning, lang)}</p>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs font-medium">
                    {t.nature.lookalikeCheck}
                  </p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
