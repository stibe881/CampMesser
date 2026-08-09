/**
 * Heimkehr-Karte auf der Startseite (#410) – Nachfolgerin der reinen
 * Rückblick-Erinnerung (#390, ReviewPromptCard).
 *
 * Drei Handgriffe nach der Rückkehr, an einem Ort: Zelt trocknen (das
 * weiss keine App – wird von Hand abgehakt, je Reise und Gerät),
 * Rückblick ausfüllen (erledigt, sobald ein Packlisten-Rückblick #381
 * gespeichert ist) und «Beim nächsten Mal» am Platz notieren (erledigt,
 * sobald dort Notizen liegen – ob sie von diesem Besuch stammen, weiss
 * niemand; besser eine grosszügige Annahme als ein Haken, der nie
 * zugeht). Alles erledigt → die Karte verschwindet von selbst.
 *
 * ALTE WEGKLICKS GELTEN WEITER: Wer die Rückblick-Erinnerung zu einer
 * Reise schon verneint hat, bekommt sie nicht als Heimkehr-Karte
 * wieder vorgesetzt – der alte localStorage-Schlüssel wird mitgelesen.
 */
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Circle, Home as HomeIcon, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useTodayIso } from "@/lib/useTodayIso";
import { useDryingDay } from "@/lib/useDryingDay";
import { fmtWeekdayShort } from "@/lib/dateFormat";
import { homecomingDone, homecomingSteps } from "@shared/homecoming";
import {
  NEXT_TIME_NOTE_MAX_LENGTH,
  parseNextTimeNotes,
  serializeNextTimeNotes,
} from "@shared/nextTime";
import { reviewCandidate } from "@shared/reviewPrompt";
import { tripDisplayName } from "@shared/tripName";
import { cn } from "@/lib/utils";

const DISMISSED_KEY = "campmesser.homecomingDismissed";
/** Der Schlüssel der Vorgänger-Karte (#390) – Wegklicks gelten weiter. */
const LEGACY_DISMISSED_KEY = "campmesser.reviewPromptDismissed";
const TENT_KEY = "campmesser.homecomingTent";
/**
 * Auch Rückblick und Merker sind VON HAND abhakbar (Nutzerwunsch
 * 09.08.2026): Die Kreise sahen nach Checkboxen aus, liessen sich aber
 * nicht antippen – ihr Haken kam nur «von selbst» aus den Daten. Wer
 * einen Schritt ohne die App erledigt hat (oder ihn diesmal nicht
 * braucht), hakt ihn jetzt direkt ab; der Daten-Haken gilt weiterhin.
 */
const REVIEW_KEY = "campmesser.homecomingReview";
const NEXT_TIME_KEY = "campmesser.homecomingNextTime";

function loadIdSet(key: string): Set<number> {
  try {
    const raw = localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(
      Array.isArray(parsed) ? parsed.filter(v => typeof v === "number") : []
    );
  } catch {
    return new Set();
  }
}

function saveIdSet(key: string, ids: Set<number>) {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(ids)));
  } catch {
    // Speicher blockiert – dann gilt es nur für diese Ansicht
  }
}

const NO_REVIEWS: ReadonlySet<number> = new Set();

export default function HomecomingCard() {
  const { lang, t } = useI18n();
  const hc = t.homecoming;
  const { isAuthenticated } = useAuth();
  const today = useTodayIso();
  const [dismissed, setDismissed] = useState<Set<number>>(() => {
    const ids = loadIdSet(DISMISSED_KEY);
    loadIdSet(LEGACY_DISMISSED_KEY).forEach(id => ids.add(id));
    return ids;
  });
  const [tentDoneIds, setTentDoneIds] = useState<Set<number>>(() =>
    loadIdSet(TENT_KEY)
  );
  const [reviewDoneIds, setReviewDoneIds] = useState<Set<number>>(() =>
    loadIdSet(REVIEW_KEY)
  );
  const [nextTimeDoneIds, setNextTimeDoneIds] = useState<Set<number>>(() =>
    loadIdSet(NEXT_TIME_KEY)
  );
  // Merker direkt hier notieren (#418): Der Umweg übers Dossier war eine
  // Hürde genau in dem Moment, in dem einem die Notiz einfällt.
  const [noteDraft, setNoteDraft] = useState("");
  const utils = trpc.useUtils();
  const noteMutation = trpc.spots.update.useMutation({
    onSuccess: () => {
      void utils.spots.list.invalidate();
      setNoteDraft("");
    },
    onError: () => toast.error(t.common.saveFailed),
  });

  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const feedbackQuery = trpc.packing.feedback.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const spotsQuery = trpc.spots.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  // Bester Trocknungs-Tag daheim (#437): nur laden, solange der
  // Zelt-Schritt offen ist – danach ist die Frage beantwortet.
  const homeQuery = trpc.home.get.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  });

  const home = homeQuery.data ?? null;
  const dryingDay = useDryingDay(
    home?.latitude,
    home?.longitude,
    home !== null
  );

  const reviewed = useMemo(
    () => new Set((feedbackQuery.data ?? []).map(row => row.tripId)),
    [feedbackQuery.data]
  );
  // Erst urteilen, wenn die Rückmeldungen geladen sind – sonst zuckt
  // die Karte kurz auf und verschwindet wieder (Begründung wie #390).
  const candidate =
    isAuthenticated && feedbackQuery.data
      ? reviewCandidate(tripsQuery.data ?? [], today, NO_REVIEWS, dismissed)
      : null;

  if (!candidate) return null;

  const spot = candidate.spotId
    ? (spotsQuery.data ?? []).find(s => s.id === candidate.spotId)
    : undefined;
  // Erledigt ist, was die Daten sagen ODER was von Hand abgehakt wurde.
  const reviewDone =
    reviewed.has(candidate.id) || reviewDoneIds.has(candidate.id);
  const nextTimeDone =
    parseNextTimeNotes(spot?.nextTimeJson ?? null).length > 0 ||
    nextTimeDoneIds.has(candidate.id);
  const steps = homecomingSteps({
    tentDone: tentDoneIds.has(candidate.id),
    hasReview: reviewDone,
    spotId: spot ? spot.id : null,
    nextTimeCount: nextTimeDone ? 1 : 0,
  });
  if (homecomingDone(steps)) return null;

  const dismiss = () => {
    const next = new Set(dismissed);
    next.add(candidate.id);
    setDismissed(next);
    saveIdSet(DISMISSED_KEY, next);
  };

  const toggleIn = (
    key: string,
    ids: Set<number>,
    setIds: (next: Set<number>) => void
  ) => {
    const next = new Set(ids);
    if (next.has(candidate.id)) next.delete(candidate.id);
    else next.add(candidate.id);
    setIds(next);
    saveIdSet(key, next);
  };
  const toggleTent = () => toggleIn(TENT_KEY, tentDoneIds, setTentDoneIds);
  const toggleReview = () =>
    toggleIn(REVIEW_KEY, reviewDoneIds, setReviewDoneIds);
  const toggleNextTime = () =>
    toggleIn(NEXT_TIME_KEY, nextTimeDoneIds, setNextTimeDoneIds);

  const stepIcon = (done: boolean) =>
    done ? (
      <CheckCircle2
        className="h-4 w-4 shrink-0 text-primary"
        aria-hidden="true"
      />
    ) : (
      <Circle
        className="h-4 w-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
    );

  const stepClass = (done: boolean) =>
    cn(
      "flex items-center gap-2 text-sm",
      done && "text-muted-foreground line-through"
    );

  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-border bg-card p-3">
      <HomeIcon
        className="mt-0.5 h-4 w-4 shrink-0 text-primary"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {hc.title(tripDisplayName(candidate, lang))}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{hc.intro}</p>
        <ul className="mt-2 space-y-1.5">
          <li>
            <button
              type="button"
              onClick={toggleTent}
              aria-pressed={tentDoneIds.has(candidate.id)}
              aria-label={hc.stepTentAria}
              className={cn(
                stepClass(tentDoneIds.has(candidate.id)),
                "text-left"
              )}
            >
              {stepIcon(tentDoneIds.has(candidate.id))}
              {hc.stepTent}
            </button>
            {/* Wann lohnt sich Aufhängen? (#437) Nur solange der Schritt
                offen ist – danach ist die Frage beantwortet. */}
            {!tentDoneIds.has(candidate.id) && dryingDay && (
              <p className="mt-0.5 pl-6 text-xs text-muted-foreground">
                {hc.dryingDay(fmtWeekdayShort(dryingDay.date, lang))}
              </p>
            )}
          </li>
          <li>
            {/* Kreis = abhaken (Nutzerwunsch 09.08.2026), Text = Sprung
                DIREKT zum Rückblick (?rueckblick=1): «Mehr»-Schalter und
                Rückblick öffnen sich dort von selbst. */}
            <span className={stepClass(reviewDone)}>
              <button
                type="button"
                onClick={toggleReview}
                aria-pressed={reviewDone}
                aria-label={hc.stepReviewAria}
                className="shrink-0"
              >
                {stepIcon(reviewDone)}
              </button>
              <Link
                href={`/tagebuch/${candidate.id}?rueckblick=1`}
                className="text-left hover:underline"
              >
                {hc.stepReview}
              </Link>
            </span>
          </li>
          {spot && (
            <li>
              <span className={stepClass(nextTimeDone)}>
                <button
                  type="button"
                  onClick={toggleNextTime}
                  aria-pressed={nextTimeDone}
                  aria-label={hc.stepNextTimeAria}
                  className="shrink-0"
                >
                  {stepIcon(nextTimeDone)}
                </button>
                <Link
                  href={`/zeltplaetze/${spot.id}`}
                  className="text-left hover:underline"
                >
                  {hc.stepNextTime}
                </Link>
              </span>
              {/* Direkt notieren (#418): Die Notiz landet am Platz wie im
                  Dossier (#396), der Schritt hakt sich damit ab. */}
              {!nextTimeDone && (
                <form
                  className="mt-1.5 flex items-center gap-2 pl-6"
                  onSubmit={event => {
                    event.preventDefault();
                    const note = noteDraft.trim();
                    if (!note) return;
                    noteMutation.mutate({
                      id: spot.id,
                      nextTimeJson: serializeNextTimeNotes([note]),
                    });
                  }}
                >
                  <Input
                    className="h-8"
                    value={noteDraft}
                    maxLength={NEXT_TIME_NOTE_MAX_LENGTH}
                    placeholder={hc.notePlaceholder}
                    aria-label={hc.notePlaceholder}
                    onChange={e => setNoteDraft(e.target.value)}
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    disabled={!noteDraft.trim() || noteMutation.isPending}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                    {hc.noteSave}
                  </Button>
                </form>
              )}
            </li>
          )}
        </ul>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label={hc.dismissAria}
        className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-accent"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
