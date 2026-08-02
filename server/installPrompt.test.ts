import { describe, expect, it } from "vitest";
import {
  detectIosSafari,
  MIN_USAGE_MS,
  shouldShowInstallPrompt,
  type InstallPromptState,
} from "../client/src/lib/installPrompt";

/** Basis-Zustand: 2. Besuch, natives Install-Event vorhanden → sichtbar. */
function baseState(overrides: Partial<InstallPromptState> = {}) {
  return {
    isStandalone: false,
    dismissed: false,
    visitCount: 2,
    msSinceStart: 5_000,
    hasInstallEvent: true,
    isIos: false,
    ...overrides,
  } satisfies InstallPromptState;
}

describe("shouldShowInstallPrompt", () => {
  it("zeigt den Hinweis ab dem zweiten Besuch mit nativem Install-Event", () => {
    expect(shouldShowInstallPrompt(baseState())).toBe(true);
  });

  it("zeigt nichts, wenn die App bereits installiert läuft", () => {
    expect(shouldShowInstallPrompt(baseState({ isStandalone: true }))).toBe(
      false
    );
  });

  it("zeigt nichts, wenn der Hinweis früher abgewiesen wurde", () => {
    expect(shouldShowInstallPrompt(baseState({ dismissed: true }))).toBe(false);
  });

  it("zeigt nichts ohne Installations-Weg (kein Event, kein iOS)", () => {
    expect(
      shouldShowInstallPrompt(
        baseState({ hasInstallEvent: false, isIos: false })
      )
    ).toBe(false);
  });

  it("zeigt auf iOS Safari auch ohne beforeinstallprompt", () => {
    expect(
      shouldShowInstallPrompt(
        baseState({ hasInstallEvent: false, isIos: true })
      )
    ).toBe(true);
  });

  it("wartet beim ersten Besuch die Mindest-Nutzungsdauer ab", () => {
    expect(
      shouldShowInstallPrompt(
        baseState({ visitCount: 1, msSinceStart: MIN_USAGE_MS - 1 })
      )
    ).toBe(false);
    expect(
      shouldShowInstallPrompt(
        baseState({ visitCount: 1, msSinceStart: MIN_USAGE_MS })
      )
    ).toBe(true);
  });

  it("Abweisen gewinnt gegen alle anderen Bedingungen", () => {
    expect(
      shouldShowInstallPrompt(
        baseState({
          dismissed: true,
          visitCount: 10,
          msSinceStart: 10 * MIN_USAGE_MS,
          isIos: true,
        })
      )
    ).toBe(false);
  });
});

describe("detectIosSafari", () => {
  const iphoneSafari =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
  const iphoneChrome =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.0.0 Mobile/15E148 Safari/604.1";
  const androidChrome =
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";
  const ipadOsAsMac =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";

  it("erkennt Safari auf dem iPhone", () => {
    expect(detectIosSafari(iphoneSafari, true)).toBe(true);
  });

  it("erkennt iPadOS über navigator.standalone trotz Mac-UserAgent", () => {
    expect(detectIosSafari(ipadOsAsMac, true)).toBe(true);
  });

  it("ignoriert Chrome auf iOS (kein Zum-Home-Bildschirm-Menü)", () => {
    expect(detectIosSafari(iphoneChrome, true)).toBe(false);
  });

  it("ignoriert Android und Desktop ohne standalone-Eigenschaft", () => {
    expect(detectIosSafari(androidChrome, false)).toBe(false);
    expect(detectIosSafari(ipadOsAsMac, false)).toBe(false);
  });
});
