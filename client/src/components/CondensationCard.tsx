/**
 * Tau- und Kondens-Hinweis für die kommende Nacht (#397).
 *
 * ERSCHEINT NUR, wenn etwas zu sagen ist: Eine tägliche Karte «Zelt
 * bleibt trocken» wäre eine Zusage, die die Prognose nicht geben kann,
 * und nach einer Woche liest sie niemand mehr. Die Rechnung steht in
 * shared/condensation.ts, die Begründung dort.
 */
import { useMemo } from "react";
import { Droplets } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/i18n";
import { useTodayIso } from "@/lib/useTodayIso";
import {
  condensationOutlook,
  type CondensationHour,
} from "@shared/condensation";

export default function CondensationCard({
  hours,
  className,
}: {
  hours: readonly CondensationHour[];
  className?: string;
}) {
  const { t } = useI18n();
  const cd = t.condensation;
  const today = useTodayIso();

  const outlook = useMemo(
    () => condensationOutlook(hours, today),
    [hours, today]
  );
  if (!outlook) return null;

  const clock = outlook.atTime.slice(11, 16);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Droplets className="h-4 w-4 text-primary" aria-hidden="true" />
          {cd.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm font-medium">
          {outlook.level === "high" ? cd.high(clock) : cd.possible(clock)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{cd.advice}</p>
        <p className="mt-2 text-xs text-muted-foreground">{cd.note}</p>
      </CardContent>
    </Card>
  );
}
