/**
 * Der Schalter für die Zahl am App-Icon (#373).
 *
 * WARUM ES IHN BRAUCHT: Der Zähler summiert zwei Dinge, die man von aussen
 * nicht sieht – Kühlbox-Einträge, die heute oder morgen ablaufen, und
 * fällige Pflege-Aufgaben. Eine Pflege-Aufgabe bleibt fällig, bis man sie
 * abhakt; sie kann Monate offen stehen. Am Icon steht dann dauerhaft eine
 * «1», die nach einer ungelesenen Mitteilung AUSSIEHT, aber keine ist –
 * und die man nicht wegtippen kann, weil in der App nichts Ungelesenes
 * liegt. Genau so liest sich «der Badge geht nicht mehr weg».
 *
 * Der Schalter ist die ehrliche Antwort darauf: Wer die Zahl nicht will,
 * schaltet sie aus, und sie ist weg. Wer sie will, behält sie – nichts
 * ändert sich für ihn.
 *
 * VORGABE IST EIN, weil es die Funktion ist, die seit #132 besteht.
 */
export const APP_BADGE_KEY = "campmesser.appBadge";

export function loadAppBadgeEnabled(): boolean {
  try {
    const raw = localStorage.getItem(APP_BADGE_KEY);
    return raw === null ? true : raw === "true";
  } catch {
    return true;
  }
}

/**
 * Der Schalter steht im Profil, gerechnet wird app-weit in `AppShell`.
 * Damit das Umlegen SOFORT wirkt und nicht erst beim nächsten Laden,
 * meldet das Speichern die Änderung im Fenster an.
 */
const CHANGE_EVENT = "campmesser:appBadge";

export function saveAppBadgeEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(APP_BADGE_KEY, String(enabled));
  } catch {
    /* Sitzung reicht */
  }
  try {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: enabled }));
  } catch {
    /* ohne Fenster (Tests, SSR) gibt es nichts zu melden */
  }
}

/** Auf das Umlegen des Schalters hören; gibt die Abmeldung zurück. */
export function onAppBadgeEnabledChange(
  handler: (enabled: boolean) => void
): () => void {
  const listener = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    if (typeof detail === "boolean") handler(detail);
  };
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}
