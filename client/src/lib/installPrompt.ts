/**
 * Logik für den PWA-Install-Hinweis.
 *
 * Reine Entscheidungslogik (shouldShowInstallPrompt, detectIosSafari) ist
 * exportiert und wird in server/installPrompt.test.ts getestet. Daneben fängt
 * dieses Modul das `beforeinstallprompt`-Event früh ab (beim Laden des
 * Haupt-Bundles), damit es nicht verpasst wird, bevor die Komponente mountet.
 */

/** localStorage-Schlüssel: Hinweis wurde dauerhaft abgewiesen. */
export const INSTALL_DISMISS_KEY = "campmesser.installPromptDismissed";
/** localStorage-Schlüssel: Besuchszähler (einmal pro App-Start erhöht). */
export const INSTALL_VISIT_KEY = "campmesser.installVisitCount";
/** Mindest-Nutzungsdauer beim ersten Besuch, bevor der Hinweis erscheint. */
export const MIN_USAGE_MS = 30_000;

/** Chrome/Edge-Event für den nativen Install-Dialog (nicht in lib.dom). */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface InstallPromptState {
  /** App läuft bereits installiert (display-mode: standalone bzw. iOS-Flag). */
  isStandalone: boolean;
  /** Hinweis wurde früher abgewiesen. */
  dismissed: boolean;
  /** Wievielter Besuch (App-Start) ist das? 1 = erster Besuch. */
  visitCount: number;
  /** Millisekunden seit dem App-Start in dieser Sitzung. */
  msSinceStart: number;
  /** beforeinstallprompt wurde abgefangen (Android/Desktop-Chrome). */
  hasInstallEvent: boolean;
  /** iOS Safari (kann nur über Teilen → Zum Home-Bildschirm installieren). */
  isIos: boolean;
}

/**
 * Entscheidet, ob der Install-Hinweis angezeigt wird:
 * nie wenn bereits installiert oder abgewiesen; nur wenn es überhaupt einen
 * Installations-Weg gibt (natives Event oder iOS Safari); und erst ab dem
 * zweiten Besuch oder nach ~30 s Nutzung (nicht aufdringlich).
 */
export function shouldShowInstallPrompt(state: InstallPromptState): boolean {
  if (state.isStandalone) return false;
  if (state.dismissed) return false;
  if (!state.hasInstallEvent && !state.isIos) return false;
  return state.visitCount >= 2 || state.msSinceStart >= MIN_USAGE_MS;
}

/**
 * iOS Safari erkennen: klassische iOS-UserAgents oder das nur dort vorhandene
 * `navigator.standalone` (deckt iPadOS ab, das sich als Mac meldet).
 * Chrome/Firefox auf iOS (CriOS/FxiOS) zeigen kein «Zum Home-Bildschirm».
 */
export function detectIosSafari(
  userAgent: string,
  hasStandaloneProp: boolean
): boolean {
  if (/crios|fxios|edgios/i.test(userAgent)) return false;
  return /iphone|ipad|ipod/i.test(userAgent) || hasStandaloneProp;
}

/** Läuft die App bereits installiert (Standalone-Fenster)? */
export function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  } catch {
    /* egal */
  }
  return (
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isDismissed(): boolean {
  try {
    return localStorage.getItem(INSTALL_DISMISS_KEY) === "1";
  } catch {
    return true; // ohne localStorage lieber nie zeigen
  }
}

export function markDismissed(): void {
  try {
    localStorage.setItem(INSTALL_DISMISS_KEY, "1");
  } catch {
    /* egal */
  }
}

// ---------------------------------------------------------------------------
// Sitzungs-Zustand (Modul-Ebene = App-Start)
// ---------------------------------------------------------------------------

const appStartedAt = Date.now();

/** Millisekunden seit dem App-Start dieser Sitzung. */
export function msSinceAppStart(): number {
  return Date.now() - appStartedAt;
}

let visitCounted = false;

/**
 * Erhöht den Besuchszähler genau einmal pro App-Start und liefert den
 * aktuellen Stand (1 = erster Besuch).
 */
export function countVisit(): number {
  try {
    const raw = Number(localStorage.getItem(INSTALL_VISIT_KEY) ?? "0");
    const current = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
    if (visitCounted) return Math.max(current, 1);
    visitCounted = true;
    const next = current + 1;
    localStorage.setItem(INSTALL_VISIT_KEY, String(next));
    return next;
  } catch {
    return 1;
  }
}

// ---------------------------------------------------------------------------
// beforeinstallprompt früh abfangen
// ---------------------------------------------------------------------------

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<() => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", event => {
    // Mini-Infobar des Browsers unterdrücken, Event für unseren Button behalten
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    promptListeners.forEach(listener => listener());
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    markDismissed();
    promptListeners.forEach(listener => listener());
  });
}

/** Das abgefangene beforeinstallprompt-Event (oder null). */
export function getDeferredPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

/** Nach dem Aufruf von prompt() ist das Event verbraucht. */
export function clearDeferredPrompt(): void {
  deferredPrompt = null;
}

/** Benachrichtigt, sobald sich die Event-Verfügbarkeit ändert. */
export function subscribeInstallPrompt(listener: () => void): () => void {
  promptListeners.add(listener);
  return () => {
    promptListeners.delete(listener);
  };
}
