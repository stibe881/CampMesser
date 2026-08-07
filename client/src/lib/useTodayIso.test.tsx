import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTodayIso } from "./useTodayIso";
import {
  APP_BADGE_KEY,
  loadAppBadgeEnabled,
  onAppBadgeEnabledChange,
  saveAppBadgeEnabled,
} from "./appBadgeSetting";

/**
 * Der eingefrorene Tag (#373).
 *
 * WARUM DAS EINEN TEST BRAUCHT: Der Fehler war unsichtbar. Die Zahl am
 * App-Icon wurde einmal gerechnet und blieb dann stehen – auffallen
 * konnte das erst am nächsten Tag, und dann sah es nach einem Fehler im
 * Handy aus, nicht nach einem in der App. Ein Test mit gestellter Uhr
 * zeigt in Millisekunden, was sonst einen Tag Wartezeit bräuchte.
 */
function Harness() {
  return <span data-testid="tag">{useTodayIso()}</span>;
}

describe("useTodayIso", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("liefert zuerst den heutigen lokalen Tag", () => {
    vi.setSystemTime(new Date(2026, 7, 7, 17, 0));
    render(<Harness />);
    expect(screen.getByTestId("tag").textContent).toBe("2026-08-07");
  });

  it("dreht um Mitternacht von selbst weiter", () => {
    vi.setSystemTime(new Date(2026, 7, 7, 23, 59, 30));
    render(<Harness />);
    expect(screen.getByTestId("tag").textContent).toBe("2026-08-07");
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByTestId("tag").textContent).toBe("2026-08-08");
  });

  it("holt den Tag bei der Rückkehr in die App nach", () => {
    // Der Fall der nativen App: iOS friert Zeitgeber im Hintergrund ein,
    // der Wecker von gestern Abend feuert also gar nicht. Beim Aufwecken
    // muss der Tag trotzdem stimmen.
    vi.setSystemTime(new Date(2026, 7, 7, 22, 0));
    render(<Harness />);
    vi.setSystemTime(new Date(2026, 7, 10, 8, 0));
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(screen.getByTestId("tag").textContent).toBe("2026-08-10");
  });

  it("derselbe Tag löst kein Neuzeichnen aus", () => {
    vi.setSystemTime(new Date(2026, 7, 7, 12, 0));
    render(<Harness />);
    const before = screen.getByTestId("tag");
    act(() => {
      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new Event("focus"));
    });
    // Dasselbe Element, nicht nur derselbe Text: React hätte bei einem
    // neuen Zustand neu gezeichnet.
    expect(screen.getByTestId("tag")).toBe(before);
    expect(before.textContent).toBe("2026-08-07");
  });
});

describe("Schalter für die Zahl am App-Icon", () => {
  beforeEach(() => {
    localStorage.removeItem(APP_BADGE_KEY);
  });

  it("ist ohne Angabe eingeschaltet", () => {
    expect(loadAppBadgeEnabled()).toBe(true);
  });

  it("merkt sich das Ausschalten", () => {
    saveAppBadgeEnabled(false);
    expect(loadAppBadgeEnabled()).toBe(false);
    saveAppBadgeEnabled(true);
    expect(loadAppBadgeEnabled()).toBe(true);
  });

  it("meldet die Änderung sofort im Fenster", () => {
    // Ohne diese Meldung würde der Zähler in AppShell erst beim nächsten
    // Laden merken, dass er nicht mehr erwünscht ist.
    const seen: boolean[] = [];
    const off = onAppBadgeEnabledChange(value => seen.push(value));
    saveAppBadgeEnabled(false);
    saveAppBadgeEnabled(true);
    off();
    saveAppBadgeEnabled(false);
    expect(seen).toEqual([false, true]);
  });
});
