/**
 * Aus Home.tsx herausgelöst (#419): Die Startseite war mit 2005 Zeilen
 * die grösste Datei im Client – die Widgets wohnen jetzt hier (Muster
 * wie Trips #322 und Profil #414).
 */
import { Link } from "wouter";
import { CheckCircle2, Circle, X } from "lucide-react";
import { useI18n } from "@/i18n";
import { useEffect, useState } from "react";
import {
  ONBOARDING_DISMISSED_KEY,
  onboardingComplete,
  onboardingSteps,
  type OnboardingStepId,
} from "@/lib/onboarding";
import { getExistingSubscription, pushSupported } from "@/lib/pushClient";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

/**
 * Erste-Schritte-Karte für neue Nutzer*innen: Häkchen-Liste der wichtigsten
 * ersten Aktionen (Konto, Zeltplatz, Packliste, Reise, Push) mit Links zu
 * den Modulen. Der Erledigt-Status kommt komplett aus den vorhandenen
 * Queries bzw. dem Push-Abo dieses Geräts (client/src/lib/onboarding.ts,
 * keine neuen Server-Felder). Sichtbar nur, solange nicht alles erledigt
 * ist und die Karte nicht weggeklickt wurde (localStorage). Gäste sehen
 * nur den Konto-Schritt verlinkt, der Rest ist ausgegraut.
 */
export default function OnboardingCard() {
  const { t } = useI18n();
  const { isAuthenticated, loading } = useAuth();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ONBOARDING_DISMISSED_KEY) === "1";
    } catch {
      return false;
    }
  });
  const enabled = isAuthenticated && !dismissed;
  const spotsQuery = trpc.spots.list.useQuery(undefined, {
    enabled,
    staleTime: 60_000,
  });
  const listsQuery = trpc.packing.lists.useQuery(undefined, {
    enabled,
    staleTime: 60_000,
  });
  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled,
    staleTime: 60_000,
  });

  // Push-Abo dieses Geräts prüfen (ohne den vapidKey-Roundtrip des Profils)
  const [pushEnabled, setPushEnabled] = useState(false);
  useEffect(() => {
    if (!enabled || !pushSupported()) return;
    getExistingSubscription()
      .then(sub => setPushEnabled(Boolean(sub)))
      .catch(() => setPushEnabled(false));
  }, [enabled]);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(ONBOARDING_DISMISSED_KEY, "1");
    } catch {
      // Speicher blockiert – die Karte bleibt nur für diese Sitzung weg
    }
  };

  if (loading || dismissed) return null;
  // Angemeldet erst rendern, wenn die Daten da sind (kein Häkchen-Flackern)
  if (
    isAuthenticated &&
    (!spotsQuery.data || !listsQuery.data || !tripsQuery.data)
  )
    return null;

  const steps = onboardingSteps({
    isAuthenticated,
    hasSpot: (spotsQuery.data?.length ?? 0) > 0,
    hasPackList: (listsQuery.data?.length ?? 0) > 0,
    hasTrip: (tripsQuery.data?.length ?? 0) > 0,
    pushSupported: pushSupported(),
    pushEnabled,
  });
  if (onboardingComplete(steps)) return null;

  const labels: Record<OnboardingStepId, string> = t.home.onboardingSteps;

  return (
    <section
      className="mb-6 rounded-xl border border-border/70 bg-card p-4 shadow-sm"
      aria-label={t.home.onboardingTitle}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h2 className="font-serif text-base font-semibold">
            {t.home.onboardingTitle}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t.home.onboardingSubtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-md p-1 text-muted-foreground/60 transition-colors hover:text-foreground"
          aria-label={t.home.onboardingDismissAria}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <ul className="space-y-1.5">
        {steps.map(step => {
          const label = labels[step.id];
          const suffix = step.optional ? ` (${t.home.onboardingOptional})` : "";
          return (
            <li key={step.id} className="flex items-center gap-2 text-sm">
              {step.done ? (
                <CheckCircle2
                  className="h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
              ) : (
                <Circle
                  className="h-4 w-4 shrink-0 text-muted-foreground/40"
                  aria-hidden="true"
                />
              )}
              {step.done ? (
                <span
                  className="text-muted-foreground line-through"
                  aria-label={t.home.onboardingDoneAria(label)}
                >
                  {label}
                </span>
              ) : step.locked ? (
                // Volles text-muted-foreground statt /50: die abgeschwächte
                // Variante fiel im axe-Kontrast-Check durch (2.1 : 1)
                <span
                  className="text-muted-foreground"
                  aria-label={t.home.onboardingLockedAria(label)}
                >
                  {label}
                  {suffix}
                </span>
              ) : (
                <Link
                  href={step.path}
                  className="font-medium text-foreground underline-offset-2 hover:text-primary hover:underline"
                  aria-label={t.home.onboardingOpenAria(label)}
                >
                  {label}
                  {suffix}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * Trip-Widget der Startseite: Läuft HEUTE ein Aufenthalt (Anreise ≤ heute ≤
 * Abreise), zeigt es «Du bist in <Ort> – Tag X von Y» mit kompaktem Wetter
 * vor Ort und Schnellzugriffen (Menüplan, Platz-Dossier, Einkaufsliste) –
 * sonst wie bisher den Countdown zum nächsten geplanten Trip.
 */
