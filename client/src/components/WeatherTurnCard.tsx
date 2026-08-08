/**
 * Wetterumschwung-Karte (#417): «Morgen kippt das Wetter – heute Abend
 * abspannen.» Erscheint nur, wenn `weatherTurn` etwas zu sagen hat;
 * Regeln und Schwellen in shared/weatherTurn.ts.
 */
import { CloudRain, ThermometerSnowflake, Wind } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/i18n";
import type { Translation } from "@/i18n/de";
import type { WeatherTurn } from "@shared/weatherTurn";

/**
 * Meldung und Rat zum Umschwung – auch die Heute-Ansicht nutzt sie,
 * dort als eine Zeile statt als Karte.
 */
export function weatherTurnTexts(
  t: Translation,
  turn: WeatherTurn
): { line: string; advice: string } {
  const wt = t.weatherTurn;
  if (turn.kind === "wind") {
    return { line: wt.windLine(turn.value), advice: wt.windAdvice };
  }
  if (turn.kind === "rain") {
    return { line: wt.rainLine(turn.value), advice: wt.rainAdvice };
  }
  return { line: wt.coldLine(turn.value), advice: wt.coldAdvice };
}

const ICONS = {
  wind: Wind,
  rain: CloudRain,
  cold: ThermometerSnowflake,
} as const;

export default function WeatherTurnCard({
  turn,
  className,
}: {
  turn: WeatherTurn | null;
  className?: string;
}) {
  const t = useT();
  if (!turn) return null;
  const { line, advice } = weatherTurnTexts(t, turn);
  const Icon = ICONS[turn.kind];

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
          {t.weatherTurn.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm font-medium">{line}</p>
        <p className="mt-1 text-sm text-muted-foreground">{advice}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          {t.weatherTurn.note}
        </p>
      </CardContent>
    </Card>
  );
}
