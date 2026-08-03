import { Minus, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";
import { MAX_SERVINGS, MIN_SERVINGS } from "@shared/servings";
import { cn } from "@/lib/utils";

/**
 * Personenzahl einstellen (#231): grosse Minus-/Plus-Flächen, dazwischen die
 * aktuelle Zahl. Wird im Rezept-Detail und im Menüplan genutzt; die
 * Umrechnung der Mengen macht `shared/servings.ts`.
 */
export default function ServingsStepper({
  value,
  onChange,
  min = MIN_SERVINGS,
  max = MAX_SERVINGS,
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  className?: string;
}) {
  const t = useT();
  return (
    <span className={cn("flex items-center gap-1.5", className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0"
        disabled={value <= min}
        aria-label={t.servings.decreaseAria}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </Button>
      <span
        className="flex min-w-24 items-center justify-center gap-1.5 text-sm font-semibold tabular-nums"
        aria-live="polite"
      >
        <Users
          className="h-3.5 w-3.5 text-muted-foreground"
          aria-hidden="true"
        />
        {t.servings.personCount(value)}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0"
        disabled={value >= max}
        aria-label={t.servings.increaseAria}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </Button>
    </span>
  );
}
