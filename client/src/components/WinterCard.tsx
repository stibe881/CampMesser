/**
 * Frost- und Schneefallgrenzen-Karte im Camp-Wetter (#428/#429).
 * Erscheint nur, wenn eine der beiden Zahlen etwas zu sagen hat –
 * Regeln in shared/winter.ts.
 */
import { Snowflake } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/i18n";
import { fmtWeekdayShort } from "@/lib/dateFormat";
import {
  frostNights,
  snowDepthNow,
  snowLineOutlook,
  type FrostDay,
  type SnowLineHour,
} from "@shared/winter";

export default function WinterCard({
  days,
  hours,
  className,
}: {
  days: readonly FrostDay[];
  hours: readonly SnowLineHour[];
  className?: string;
}) {
  const { lang, t } = useI18n();
  const wc = t.winter;
  const frost = frostNights(days);
  const snowLine = snowLineOutlook(hours);
  const snowDepth = snowDepthNow(hours);
  if (frost.length === 0 && !snowLine && !snowDepth) return null;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Snowflake className="h-4 w-4 text-primary" aria-hidden="true" />
          {wc.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {frost.length > 0 && (
          <>
            <p className="text-sm font-medium">
              {wc.frostLine(
                frost
                  .map(
                    day =>
                      `${fmtWeekdayShort(day.date, lang)} ${Math.round(day.tempMinC)} °C`
                  )
                  .join(", ")
              )}
            </p>
            <p className="text-sm text-muted-foreground">{wc.frostAdvice}</p>
          </>
        )}
        {snowLine && (
          <p className="text-sm">{wc.snowLine(snowLine.minLevelM)}</p>
        )}
        {snowDepth && (
          <p className="text-sm">{wc.snowDepth(snowDepth.depthCm)}</p>
        )}
        <p className="text-xs text-muted-foreground">{wc.note}</p>
      </CardContent>
    </Card>
  );
}
