/**
 * Dunkelheitskarte pro Platz (#239): Wie dunkel ist der Himmel hier? Die
 * Einstufung nach der Bortle-Skala (1–9) steht mit Kurzname, dem, was du an
 * einem solchen Himmel siehst, und dem, was das fürs Sternegucken heisst.
 *
 * Gerechnet wird alles offline in shared/darkSky.ts – aus der Distanz zu den
 * grössten Städten und Agglomerationen. Das ist eine SCHÄTZUNG, und der
 * Kasten sagt das auch: eine frei abrufbare Messung der Himmelshelligkeit
 * gibt es nicht. Ausserhalb des abgedeckten Gebiets zeigt der Kasten gar
 * keine Klasse, statt eine zu erfinden.
 *
 * «Heute Nacht»: verbindet die Dunkelheit mit der bestehenden
 * Wetteranbindung (Open-Meteo, Bewölkung ab 21 Uhr – dieselbe Rechnung wie
 * die Sternschnuppen-Erinnerung im Push-Dienst) und dem Mondstand aus
 * shared/moon.ts. Nur wenn dunkler Himmel, klare Nacht und wenig Mondlicht
 * zusammenkommen, heisst es «heute Nacht lohnt es sich besonders».
 *
 * Der Rotlicht-Modus (#84) greift automatisch: Der Kasten macht keine eigene
 * Overlay-Ebene auf, und die Bortle-Skala unterscheidet sich in der
 * Helligkeit statt nur in der Farbe – sie bleibt unter dem Rotfilter lesbar.
 *
 * Bewusst als eigenes Bauteil, weil derselbe Kasten an zwei Stellen steht:
 * im Platz-Dossier und im Sternengucker-Bereich der Natur-Seite.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Moon, Telescope } from "lucide-react";
import { useI18n } from "@/i18n";
import {
  bortleLabel,
  bortleSkyDescription,
  bortleStargazingTip,
  estimateDarkSky,
  isInDarkSkyCoverage,
  stargazingOutlook,
  type BortleClass,
} from "@shared/darkSky";
import { formatDistance } from "@shared/geo";
import { getMoonInfo } from "@shared/moon";
import { nightCloudCover } from "@shared/weather";
import { cn } from "@/lib/utils";

/** Graustufen der Bortle-Skala: dunkel (1) bis hell (9). */
const SCALE_SHADES = [
  "#05070d",
  "#0d1220",
  "#1b2438",
  "#2f3c56",
  "#4a5a74",
  "#6b7c94",
  "#94a3b4",
  "#c2ccd6",
  "#e9eef3",
];

/**
 * Bewölkung der kommenden Nacht holen: Stunden-Prognose von Open-Meteo,
 * dieselbe Quelle wie das Wetter im Dossier. `past_days=1`, damit auch nach
 * Mitternacht noch die laufende Nacht gerechnet werden kann.
 */
async function fetchNightClouds(
  lat: number,
  lon: number,
  signal: AbortSignal
): Promise<{ time: string; cloudCover: number }[]> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    timezone: "auto",
    past_days: "1",
    forecast_days: "2",
    hourly: "cloud_cover",
  });
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
    { signal }
  );
  if (!res.ok) throw new Error("weather");
  const json = await res.json();
  const times: string[] = json?.hourly?.time ?? [];
  const cover: number[] = json?.hourly?.cloud_cover ?? [];
  return times.map((time, i) => ({
    time,
    cloudCover: Number(cover[i] ?? 0),
  }));
}

/** Datum der Nacht, die gerade ansteht: vor 5 Uhr zählt noch die laufende. */
function nightDateIso(now: Date): string {
  const ref = new Date(now);
  if (ref.getHours() < 5) ref.setDate(ref.getDate() - 1);
  const month = `${ref.getMonth() + 1}`.padStart(2, "0");
  const day = `${ref.getDate()}`.padStart(2, "0");
  return `${ref.getFullYear()}-${month}-${day}`;
}

export default function DarkSkyPanel({
  latitude,
  longitude,
  placeName,
  astroLink = false,
  className,
}: {
  latitude: number;
  longitude: number;
  placeName?: string | null;
  /** Verweis auf den Sternengucker-Bereich zeigen (im Dossier sinnvoll). */
  astroLink?: boolean;
  className?: string;
}) {
  const { lang, t } = useI18n();
  const td = t.darkSky;
  const [now] = useState(() => new Date());
  const [clouds, setClouds] = useState<number | null>(null);
  const [cloudsLoading, setCloudsLoading] = useState(true);

  const covered = isInDarkSkyCoverage(latitude, longitude);
  const estimate = estimateDarkSky(latitude, longitude);
  const moon = getMoonInfo(now, lang);

  useEffect(() => {
    const controller = new AbortController();
    setCloudsLoading(true);
    setClouds(null);
    fetchNightClouds(latitude, longitude, controller.signal)
      .then(hours => {
        setClouds(nightCloudCover(hours, nightDateIso(now)));
        setCloudsLoading(false);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setCloudsLoading(false);
      });
    return () => controller.abort();
  }, [latitude, longitude, now]);

  const outlook = stargazingOutlook({
    bortle: estimate.bortle,
    cloudCoverPercent: clouds,
    moonIllumination: moon.illumination,
  });
  const moonPercent = Math.round(moon.illumination * 100);

  return (
    <section
      className={cn("rounded-xl border border-border bg-card p-4", className)}
      aria-label={td.sectionAria}
    >
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <Telescope className="h-4 w-4 text-primary" aria-hidden="true" />
        <h3 className="font-serif text-lg font-semibold">{td.title}</h3>
        {covered && (
          <span className="ml-auto rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
            {td.badge(estimate.bortle)}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        {placeName ? td.subtitleAtPlace(placeName) : td.subtitle}
      </p>

      {!covered ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {td.outsideCoverage}
        </p>
      ) : (
        <>
          {/* Bortle-Skala: neun Stufen von dunkel nach hell */}
          <div
            className="mt-3 flex gap-1"
            role="img"
            aria-label={td.scaleAria(estimate.bortle)}
          >
            {SCALE_SHADES.map((shade, i) => {
              const step = (i + 1) as BortleClass;
              const active = step === estimate.bortle;
              return (
                <div
                  key={step}
                  className={cn(
                    "flex h-9 flex-1 items-center justify-center rounded text-xs font-semibold",
                    active
                      ? "ring-2 ring-primary ring-offset-1 ring-offset-card"
                      : ""
                  )}
                  style={{
                    backgroundColor: shade,
                    color: i > 5 ? "#111827" : "#e5e7eb",
                  }}
                >
                  {active ? step : ""}
                </div>
              );
            })}
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
            <span>{td.scaleDark}</span>
            <span>{td.scaleBright}</span>
          </div>

          <p className="mt-3 font-medium">
            {td.classLine(estimate.bortle, bortleLabel(estimate.bortle, lang))}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {bortleSkyDescription(estimate.bortle, lang)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {bortleStargazingTip(estimate.bortle, lang)}
          </p>

          {/* Heute Nacht: Dunkelheit trifft Bewölkung und Mond */}
          <div className="mt-3 rounded-lg bg-accent/50 p-3">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Moon className="h-4 w-4" aria-hidden="true" />
              {td.tonightTitle}
            </p>
            <p className="mt-1 text-sm">
              {cloudsLoading
                ? td.tonightLoading
                : outlook.verdict === "worthIt"
                  ? td.tonightWorthIt
                  : outlook.verdict === "clouds"
                    ? td.tonightClouds(Math.round(clouds ?? 0))
                    : outlook.verdict === "moon"
                      ? td.tonightMoon(moonPercent)
                      : outlook.verdict === "brightSky"
                        ? td.tonightBrightSky
                        : td.tonightUnknown}
            </p>
            {!cloudsLoading && (
              <p className="mt-1 text-xs text-muted-foreground">
                {clouds === null
                  ? td.moonLine(moonPercent)
                  : `${td.cloudLine(Math.round(clouds))} · ${td.moonLine(moonPercent)}`}
              </p>
            )}
            {astroLink && (
              <Link
                href="/natur"
                className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
              >
                {td.astroLink}
              </Link>
            )}
          </div>

          <p className="mt-3 text-sm">
            <span className="font-medium">{td.nearestTitle}</span>{" "}
            <span className="text-muted-foreground">
              {estimate.nearest
                .map(entry =>
                  td.nearestItem(
                    entry.source.name,
                    formatDistance(entry.distanceKm * 1000, lang)
                  )
                )
                .join(" · ")}
            </span>
          </p>
        </>
      )}

      <p className="mt-3 text-xs text-muted-foreground">{td.estimateNote}</p>
    </section>
  );
}
