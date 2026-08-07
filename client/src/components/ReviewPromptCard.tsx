/**
 * «Wie war's? Füll den Rückblick aus» – die Karte nach der Heimkehr (#390).
 *
 * WARUM SIE EXISTIERT und warum sie KEIN Push ist, steht in
 * `shared/reviewPrompt.ts`: Der Rückblick (#381) verbessert die
 * Packliste nur, wenn ihn jemand ausfüllt, und eine Woche später weiss
 * niemand mehr, was gefehlt hat. Die Trocknungs-Erinnerung (#89) kommt
 * schon per Push – eine zweite Meldung wäre Lärm.
 *
 * DAS WEGKLICKEN GILT JE REISE und liegt in localStorage, nicht in der
 * Sitzung: Wer die Frage zu dieser Reise verneint hat, soll sie beim
 * nächsten Öffnen nicht wieder vorgesetzt bekommen – aber zur nächsten
 * Reise sehr wohl.
 */
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { RotateCcw, X } from "lucide-react";
import { useI18n } from "@/i18n";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useTodayIso } from "@/lib/useTodayIso";
import { reviewCandidate } from "@shared/reviewPrompt";
import { tripDisplayName } from "@shared/tripName";

const DISMISSED_KEY = "campmesser.reviewPromptDismissed";

function loadDismissed(): Set<number> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(
      Array.isArray(parsed) ? parsed.filter(v => typeof v === "number") : []
    );
  } catch {
    return new Set();
  }
}

export default function ReviewPromptCard() {
  const { lang, t } = useI18n();
  const rp = t.reviewPrompt;
  const { isAuthenticated } = useAuth();
  const today = useTodayIso();
  const [dismissed, setDismissed] = useState<Set<number>>(loadDismissed);

  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const feedbackQuery = trpc.packing.feedback.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const reviewed = useMemo(
    () => new Set((feedbackQuery.data ?? []).map(row => row.tripId)),
    [feedbackQuery.data]
  );
  // Erst urteilen, wenn die Rückmeldungen geladen sind: Sonst erschiene
  // die Karte kurz zu einer längst beantworteten Reise und verschwände
  // wieder – ein Zucken, das wie ein Fehler aussieht.
  const candidate =
    isAuthenticated && feedbackQuery.data
      ? reviewCandidate(tripsQuery.data ?? [], today, reviewed, dismissed)
      : null;

  if (!candidate) return null;

  const dismiss = () => {
    const next = new Set(dismissed);
    next.add(candidate.id);
    setDismissed(next);
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(next)));
    } catch {
      // Speicher blockiert – dann bleibt sie nur für diese Ansicht weg
    }
  };

  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-border bg-card p-3">
      <RotateCcw
        className="mt-0.5 h-4 w-4 shrink-0 text-primary"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {rp.title(tripDisplayName(candidate, lang))}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{rp.body}</p>
        <Link
          href={`/tagebuch/${candidate.id}`}
          className="mt-1.5 inline-block text-sm font-medium text-primary hover:underline"
        >
          {rp.open}
        </Link>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label={rp.dismissAria}
        className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-accent"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
