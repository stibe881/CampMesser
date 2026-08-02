/**
 * Erste-Schritte-Karte der Startseite: reine Ableitung der Schritt-Liste aus
 * dem vorhandenen App-Zustand (Anmeldung, Zeltplätze/Packlisten/Reisen aus
 * den bestehenden Queries, Push-Abo dieses Geräts) – KEINE neuen Server-
 * Felder. Getestet in server/onboarding.test.ts.
 */

/** Weggeklickt-Merker der Karte (localStorage, "1" = ausgeblendet). */
export const ONBOARDING_DISMISSED_KEY = "campmesser.onboardingDismissed";

export type OnboardingStepId =
  "account" | "spot" | "packList" | "trip" | "push";

export interface OnboardingState {
  isAuthenticated: boolean;
  /** Mindestens ein gespeicherter Zeltplatz */
  hasSpot: boolean;
  /** Mindestens eine Packliste */
  hasPackList: boolean;
  /** Mindestens eine Reise (geplant oder vergangen) */
  hasTrip: boolean;
  /** Kann dieser Browser überhaupt Web Push? */
  pushSupported: boolean;
  /** Hat dieses Gerät ein aktives Push-Abo? */
  pushEnabled: boolean;
}

export interface OnboardingStep {
  id: OnboardingStepId;
  /** Ziel-Route des Schritts */
  path: string;
  done: boolean;
  /** Erst mit Konto machbar – für Gäste ausgegraut, ohne Link */
  locked: boolean;
  /** Zählt nicht zur Vollständigkeit (z. B. Push ohne Browser-Support) */
  optional: boolean;
}

/**
 * Die fünf Erste-Schritte in fester Reihenfolge: Konto, Zeltplatz, Packliste,
 * Reise, Push. Ohne Anmeldung ist nur der Konto-Schritt verlinkbar, die
 * Inhalts-Schritte gelten erst mit Konto als erledigt. Der Push-Schritt ist
 * in Browsern ohne Web-Push-Support optional (blockiert das «Fertig» nicht).
 */
export function onboardingSteps(state: OnboardingState): OnboardingStep[] {
  const authed = state.isAuthenticated;
  return [
    {
      id: "account",
      path: "/anmelden",
      done: authed,
      locked: false,
      optional: false,
    },
    {
      id: "spot",
      path: "/zeltplaetze",
      done: authed && state.hasSpot,
      locked: !authed,
      optional: false,
    },
    {
      id: "packList",
      path: "/packlisten",
      done: authed && state.hasPackList,
      locked: !authed,
      optional: false,
    },
    {
      id: "trip",
      path: "/tagebuch",
      done: authed && state.hasTrip,
      locked: !authed,
      optional: false,
    },
    {
      id: "push",
      path: "/profil",
      done: authed && state.pushSupported && state.pushEnabled,
      locked: !authed,
      optional: !state.pushSupported,
    },
  ];
}

/** Alles erledigt? Optionale Schritte zählen nicht als Blocker. */
export function onboardingComplete(steps: OnboardingStep[]): boolean {
  return steps.every(step => step.done || step.optional);
}
