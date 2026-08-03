import { useMemo } from "react";
import { useT } from "@/i18n";
import { passwordStrength } from "@shared/passwordStrength";

/** So viele Segmente hat der Balken (Score 1–4). */
const SEGMENTS = 4;
/** Bis zu diesem Score werden die Verbesserungs-Hinweise gezeigt. */
const HINT_MAX_SCORE = 2;

/** Farbe des gefüllten Balkens je Bewertung (0–4). */
const BAR_COLORS = [
  "bg-destructive",
  "bg-destructive",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-emerald-600",
] as const;

/**
 * Passwort-Stärke-Anzeige (#199): Balken plus Label unter einem Passwort-Feld,
 * dazu kurze Verbesserungs-Hinweise, solange die Bewertung schwach ist.
 * Reine Anzeige – nichts wird blockiert, die Mindestlänge prüft weiterhin das
 * Formular bzw. der Server. Bei leerem Feld wird gar nichts gerendert.
 */
export default function PasswordStrengthMeter({
  password,
  className,
}: {
  password: string;
  className?: string;
}) {
  const t = useT();
  const { score, hints } = useMemo(
    () => passwordStrength(password),
    [password]
  );
  if (!password) return null;

  const labels = [
    t.password.weak,
    t.password.weak,
    t.password.medium,
    t.password.good,
    t.password.strong,
  ];
  const label = labels[score];
  const filled = Math.max(1, score);

  return (
    <div className={className ?? "mt-1.5"}>
      <div
        className="flex items-center gap-2"
        role="status"
        aria-label={t.password.strengthAria(label)}
      >
        <div className="flex flex-1 gap-1" aria-hidden="true">
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i < filled ? BAR_COLORS[score] : "bg-muted"
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          {t.password.strengthLabel}: {label}
        </span>
      </div>
      {score < HINT_MAX_SCORE && hints.length > 0 && (
        <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
          {hints.map(hint => (
            <li key={hint} className="flex gap-1.5">
              <span aria-hidden="true">·</span>
              <span>{t.password.hints[hint]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
