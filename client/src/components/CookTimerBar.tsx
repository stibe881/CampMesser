import { AlarmClock, Check, Timer } from "lucide-react";
import { useLocation } from "wouter";
import { formatRemaining } from "@shared/cookTimer";
import {
  isExpired,
  removeCookTimer,
  remainingSeconds,
  useCookTimers,
} from "@/lib/cookTimers";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

/**
 * Globale Timer-Leiste (#218): dezenter Chip über der Bottom-Navigation,
 * solange mindestens ein Küchen-Timer läuft. Gezeigt wird der dringendste
 * Timer (kleinste Restzeit); weitere erscheinen als «+N». Ein Klick führt
 * zurück ins Rezept, aus dem der Timer gestartet wurde.
 *
 * Bewusst schmal und links platziert, damit der Schnellaktionen-Knopf unten
 * rechts frei bleibt.
 */
export default function CookTimerBar() {
  const t = useT();
  const [, navigate] = useLocation();
  const { timers, now } = useCookTimers();

  if (timers.length === 0) return null;

  // Abgelaufene zuerst, sonst die kleinste Restzeit
  const sorted = [...timers].sort((a, b) => {
    const expiredA = isExpired(a, now) ? 0 : 1;
    const expiredB = isExpired(b, now) ? 0 : 1;
    if (expiredA !== expiredB) return expiredA - expiredB;
    return remainingSeconds(a, now) - remainingSeconds(b, now);
  });
  const lead = sorted[0];
  const expired = isExpired(lead, now);
  const paused = lead.pausedSeconds !== null;
  const others = timers.length - 1;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 px-4 md:bottom-4">
      <div className="mx-auto flex max-w-md justify-start pr-14 md:pr-0">
        <div
          className={cn(
            "pointer-events-auto flex items-center gap-2 rounded-full border py-1.5 pl-3 pr-1.5 shadow-lg backdrop-blur-md",
            expired
              ? "animate-pulse border-destructive bg-destructive text-destructive-foreground"
              : "border-border bg-card/95 text-foreground"
          )}
          role="status"
          aria-live="polite"
        >
          <button
            type="button"
            className="flex min-w-0 items-center gap-2 text-left"
            onClick={() =>
              navigate(
                lead.recipeId
                  ? `/rezepte?rezept=${encodeURIComponent(lead.recipeId)}`
                  : "/rezepte"
              )
            }
            aria-label={
              expired
                ? t.cookTimer.barExpiredAria(lead.name)
                : t.cookTimer.barOpenAria(
                    lead.name,
                    formatRemaining(remainingSeconds(lead, now))
                  )
            }
          >
            {expired ? (
              <AlarmClock className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <Timer
                className={cn("h-4 w-4 shrink-0", !paused && "text-primary")}
                aria-hidden="true"
              />
            )}
            <span className="font-mono text-sm font-semibold tabular-nums">
              {expired
                ? t.cookTimer.expiredShort
                : formatRemaining(remainingSeconds(lead, now))}
            </span>
            <span className="min-w-0 max-w-32 truncate text-xs opacity-80">
              {lead.name}
            </span>
            {paused && !expired && (
              <span className="shrink-0 text-xs opacity-80">
                {t.cookTimer.pausedShort}
              </span>
            )}
            {others > 0 && (
              <span className="shrink-0 rounded-full bg-foreground/10 px-1.5 py-0.5 text-[11px] font-medium">
                {t.cookTimer.moreCount(others)}
              </span>
            )}
          </button>
          {expired && (
            <button
              type="button"
              onClick={() => removeCookTimer(lead.id)}
              aria-label={t.cookTimer.dismissAria(lead.name)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-destructive-foreground/15 transition-colors hover:bg-destructive-foreground/25"
            >
              <Check className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
