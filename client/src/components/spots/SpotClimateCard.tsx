/**
 * Beste Reisezeit im Platz-Dossier (#68): historisches Wetter der letzten
 * fünf vollen Jahre, monatlich zusammengefasst, mit den besten Monaten
 * als Chips und dem Klima-Diagramm. Aus SpotDetail.tsx herausgelöst
 * (#458) – der Block hängt nur an den Koordinaten.
 *
 * Geladen wird bewusst erst beim Aufklappen: Die Archive-API ist deutlich
 * träger als die Vorhersage-API.
 */
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarRange, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  aggregateMonthlyClimate,
  bestTravelMonths,
  climateRequestUrl,
  climateYearRange,
  type MonthlyClimate,
} from "@shared/climate";
import { useI18n } from "@/i18n";
import { LOCALE_TAGS } from "@shared/i18n";
import { cn } from "@/lib/utils";

// Diagramm erst nach dem ersten Bild (#354): recharts ist 384 kB.
const ClimateChart = lazy(() => import("@/components/charts/ClimateChart"));

/** Ladezustand «Beste Reisezeit»: die Archiv-API wird erst auf Klick befragt. */
type ClimateState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | {
      status: "ready";
      months: MonthlyClimate[];
      best: number[];
      fromYear: number;
      toYear: number;
    };

export default function SpotClimateCard({
  latitude,
  longitude,
  className,
}: {
  latitude: number;
  longitude: number;
  className?: string;
}) {
  const { lang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [climate, setClimate] = useState<ClimateState>({ status: "idle" });

  // Beim Platzwechsel zurücksetzen (die Daten gehören zum Ort)
  useEffect(() => {
    setOpen(false);
    setClimate({ status: "idle" });
  }, [latitude, longitude]);

  // Historisches Wetter (letzte 5 volle Jahre) laden – bewusst erst auf Klick,
  // die Archive-API ist deutlich träger als die Vorhersage-API.
  const loadClimate = async () => {
    setClimate({ status: "loading" });
    try {
      const range = climateYearRange(new Date());
      const res = await fetch(
        climateRequestUrl(latitude, longitude, range.startDate, range.endDate)
      );
      if (!res.ok) throw new Error(`climate service error ${res.status}`);
      const json = await res.json();
      const months = aggregateMonthlyClimate(json.daily);
      setClimate({
        status: "ready",
        months,
        best: bestTravelMonths(months),
        fromYear: range.fromYear,
        toYear: range.toYear,
      });
    } catch {
      setClimate({ status: "error" });
    }
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && climate.status === "idle") void loadClimate();
  };

  // Monatsnamen in der aktiven Sprache (Jahr egal – nur der Monat zählt)
  const monthLabel = (month: number, style: "short" | "long") =>
    new Date(2000, month - 1, 1).toLocaleDateString(LOCALE_TAGS[lang], {
      month: style,
    });

  const chartData = useMemo(
    () =>
      climate.status === "ready"
        ? climate.months.map(m => ({
            label: monthLabel(m.month, "short"),
            max: m.avgTempMaxC,
            min: m.avgTempMinC,
            rain: m.rainDays,
          }))
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [climate, lang]
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-controls="climate-section"
            className="flex w-full items-center gap-2 text-left"
          >
            <CalendarRange
              className="h-4 w-4 text-primary"
              aria-hidden="true"
            />
            {t.spotDetail.climateTitle}
            <ChevronDown
              className={cn(
                "ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                open && "rotate-180"
              )}
              aria-hidden="true"
            />
          </button>
        </CardTitle>
      </CardHeader>
      {open && (
        <CardContent id="climate-section">
          <p className="mb-3 text-sm text-muted-foreground">
            {t.spotDetail.climateIntro}
          </p>
          {climate.status === "loading" && (
            <div
              role="status"
              aria-busy="true"
              aria-label={t.spotDetail.climateLoadingAria}
            >
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          )}
          {climate.status === "error" && (
            <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              {t.spotDetail.climateFailed}
              <button
                type="button"
                onClick={() => loadClimate()}
                className="font-medium text-primary underline"
              >
                {t.spotDetail.climateRetry}
              </button>
            </p>
          )}
          {climate.status === "ready" && (
            <>
              {climate.best.length > 0 && (
                <p className="mb-3 flex flex-wrap items-center gap-1.5 text-sm">
                  <span className="font-medium">
                    {t.spotDetail.climateBestTitle}
                  </span>
                  {climate.best.map(month => (
                    <span
                      key={month}
                      className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-medium"
                    >
                      {monthLabel(month, "long")}
                    </span>
                  ))}
                </p>
              )}
              <div className="h-52 w-full">
                <Suspense fallback={null}>
                  <ClimateChart
                    data={chartData}
                    labels={{
                      max: t.spotDetail.climateChartMax,
                      min: t.spotDetail.climateChartMin,
                      rain: t.spotDetail.climateChartRain,
                      daysUnit: t.spotDetail.climateDaysUnit,
                    }}
                  />
                </Suspense>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t.spotDetail.climateLegend}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t.spotDetail.climateSource(climate.fromYear, climate.toYear)}
              </p>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
