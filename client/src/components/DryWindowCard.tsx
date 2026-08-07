/**
 * «Wann baue ich ab?» – das trockene Zeitfenster (#384).
 *
 * DIE FRAGE VOR DER ABREISE lautet nicht «wie ist das Wetter», sondern
 * «WANN packe ich zusammen». Ein Zelt nass einzupacken kostet zu Hause
 * einen Trockentag und im schlechten Fall Schimmel. Die Stundenprognose
 * lag längst vollständig vor und wurde nur als Tabelle gezeigt – hier
 * wird die Frage beantwortet statt der Rohdaten.
 *
 * ZWEI KNÖPFE FÜR DIE LÄNGE, mehr nicht: Ein Wurfzelt ist in einer
 * Stunde weg, ein Vorzelt braucht drei. Eine Minutenwahl wäre eine
 * Genauigkeit, die die Prognose nicht hat.
 *
 * DAS URTEIL DARF DIE NOTE ÜBERSTIMMEN. Trocken und 55-km/h-Böen ergibt
 * eine gute Zahl und trotzdem kein Zeltwetter; die Begründung dafür
 * steht in `shared/dryWindow.ts`.
 */
import { useMemo, useState } from "react";
import { PackageOpen, TriangleAlert, Wind } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/i18n";
import { fmtWeekdayDay } from "@/lib/dateFormat";
import { useTodayIso } from "@/lib/useTodayIso";
import {
  DEFAULT_WINDOW_HOURS,
  bestDryWindow,
  windowClock,
  windowDate,
  windowVerdict,
  type DryHour,
} from "@shared/dryWindow";
import { cn } from "@/lib/utils";

/** Zur Wahl stehende Längen in Stunden – Wurfzelt bis Vorzelt. */
const LENGTHS = [1, 2, 3] as const;

export default function DryWindowCard({
  hours,
  className,
}: {
  hours: readonly DryHour[];
  className?: string;
}) {
  const { lang, t } = useI18n();
  const dw = t.dryWindow;
  const today = useTodayIso();
  const [length, setLength] = useState<number>(DEFAULT_WINDOW_HOURS);

  const found = useMemo(() => bestDryWindow(hours, length), [hours, length]);
  const verdict = windowVerdict(found);

  if (hours.length === 0) return null;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <PackageOpen className="h-4 w-4 text-primary" aria-hidden="true" />
          {dw.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="mb-3 flex flex-wrap gap-1.5"
          role="group"
          aria-label={dw.lengthGroupAria}
        >
          {LENGTHS.map(value => (
            <button
              key={value}
              type="button"
              aria-pressed={length === value}
              onClick={() => setLength(value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                length === value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              {dw.hours(value)}
            </button>
          ))}
        </div>

        {!found ? (
          <p className="text-sm text-muted-foreground">{dw.tooShort}</p>
        ) : (
          <>
            <p className="font-serif text-2xl font-bold">
              {windowClock(found).from} – {windowClock(found).to}
            </p>
            <p className="text-sm text-muted-foreground">
              {windowDate(found) === today
                ? t.common.today
                : fmtWeekdayDay(new Date(windowDate(found)), lang)}
            </p>

            <p
              className={cn(
                "mt-3 rounded-lg px-3 py-2 text-sm",
                verdict === "good" && "bg-primary/10",
                verdict === "usable" && "bg-accent",
                verdict === "poor" && "bg-destructive/10 text-destructive"
              )}
            >
              {verdict === "good" && dw.verdictGood}
              {verdict === "usable" && dw.verdictUsable}
              {/* Der schlechte Fall wird BENANNT und nicht beschönigt: Das
                  beste Fenster von lauter schlechten bleibt schlecht. */}
              {verdict === "poor" && dw.verdictPoor}
            </p>

            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <dt className="text-muted-foreground">{dw.rainLabel}</dt>
              <dd>
                {found.fullyDry
                  ? dw.rainNone
                  : dw.rainAmount(found.precipitationMm)}
              </dd>
              <dt className="text-muted-foreground">{dw.gustsLabel}</dt>
              <dd
                className={cn(
                  "flex items-center gap-1",
                  verdict === "poor" && found.maxGustsKmh >= 50 && "font-medium"
                )}
              >
                <Wind className="h-3 w-3" aria-hidden="true" />
                {dw.gusts(found.maxGustsKmh)}
              </dd>
            </dl>

            {found.maxGustsKmh >= 50 && (
              <p className="mt-2 flex items-start gap-1.5 text-xs text-destructive">
                <TriangleAlert
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                />
                {dw.gustWarning}
              </p>
            )}
          </>
        )}

        <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
          {dw.note}
        </p>
      </CardContent>
    </Card>
  );
}
