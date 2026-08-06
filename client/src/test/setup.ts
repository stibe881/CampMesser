import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

/**
 * Vorbereitung für die Komponenten-Tests (#340).
 *
 * WAS JSDOM NICHT KANN und die App trotzdem benutzt: `matchMedia` (das
 * Design fragt nach dunkel/hell), `ResizeObserver` (Radix-Bauteile) und
 * `scrollIntoView`. Fehlen sie, stirbt der Test an einer Kleinigkeit, die
 * mit dem Geprüften nichts zu tun hat – deshalb hier einmal für alle,
 * statt in jedem Test von Hand.
 *
 * NICHT NACHGEBAUT wird alles, was echtes Verhalten hätte: kein fetch,
 * keine Datenbank, kein Netz. Wer das braucht, gibt es im Test selbst
 * vor – sonst prüft man am Ende die Attrappe statt die App.
 */
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});
