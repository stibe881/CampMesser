import { describe, expect, it } from "vitest";
import {
  onboardingComplete,
  onboardingSteps,
  type OnboardingState,
} from "../client/src/lib/onboarding";

const base: OnboardingState = {
  isAuthenticated: false,
  hasSpot: false,
  hasPackList: false,
  hasTrip: false,
  pushSupported: true,
  pushEnabled: false,
};

describe("onboardingSteps", () => {
  it("Gast: nur der Konto-Schritt ist offen und verlinkbar, Rest gesperrt", () => {
    const steps = onboardingSteps(base);
    expect(steps.map(s => s.id)).toEqual([
      "account",
      "spot",
      "packList",
      "trip",
      "push",
    ]);
    const account = steps[0];
    expect(account).toMatchObject({
      done: false,
      locked: false,
      path: "/anmelden",
    });
    steps.slice(1).forEach(step => {
      expect(step.done).toBe(false);
      expect(step.locked).toBe(true);
    });
    expect(onboardingComplete(steps)).toBe(false);
  });

  it("angemeldet: Konto erledigt, Inhalts-Schritte folgen den Daten", () => {
    const steps = onboardingSteps({
      ...base,
      isAuthenticated: true,
      hasSpot: true,
      hasTrip: true,
    });
    expect(steps.find(s => s.id === "account")?.done).toBe(true);
    expect(steps.find(s => s.id === "spot")?.done).toBe(true);
    expect(steps.find(s => s.id === "packList")?.done).toBe(false);
    expect(steps.find(s => s.id === "trip")?.done).toBe(true);
    steps.forEach(step => expect(step.locked).toBe(false));
    expect(onboardingComplete(steps)).toBe(false);
  });

  it("Inhalts-Daten ohne Anmeldung zählen nicht als erledigt", () => {
    const steps = onboardingSteps({ ...base, hasSpot: true, hasTrip: true });
    expect(steps.find(s => s.id === "spot")?.done).toBe(false);
    expect(steps.find(s => s.id === "trip")?.done).toBe(false);
  });

  it("Push: erledigt nur mit Support UND Abo, ohne Support optional", () => {
    const withAbo = onboardingSteps({
      ...base,
      isAuthenticated: true,
      pushEnabled: true,
    });
    expect(withAbo.find(s => s.id === "push")).toMatchObject({
      done: true,
      optional: false,
    });
    const unsupported = onboardingSteps({
      ...base,
      isAuthenticated: true,
      pushSupported: false,
      pushEnabled: true,
    });
    expect(unsupported.find(s => s.id === "push")).toMatchObject({
      done: false,
      optional: true,
    });
  });
});

describe("onboardingComplete", () => {
  const done: OnboardingState = {
    isAuthenticated: true,
    hasSpot: true,
    hasPackList: true,
    hasTrip: true,
    pushSupported: true,
    pushEnabled: true,
  };

  it("alle Schritte erledigt → fertig", () => {
    expect(onboardingComplete(onboardingSteps(done))).toBe(true);
  });

  it("Push offen blockiert nur, wenn der Browser Push kann", () => {
    expect(
      onboardingComplete(onboardingSteps({ ...done, pushEnabled: false }))
    ).toBe(false);
    expect(
      onboardingComplete(
        onboardingSteps({ ...done, pushSupported: false, pushEnabled: false })
      )
    ).toBe(true);
  });

  it("offener Inhalts-Schritt → nicht fertig", () => {
    expect(
      onboardingComplete(onboardingSteps({ ...done, hasPackList: false }))
    ).toBe(false);
  });
});
