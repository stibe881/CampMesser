/**
 * Design-Präferenz (Hell/Dunkel/Automatisch) aus dem Profil – eigenes Modul,
 * damit der App-Start sie lesen kann, ohne die ganze Profil-Seite ins
 * Haupt-Bundle zu ziehen.
 */
const THEME_PREF_KEY = "campmesser.themePreference";

/** Wählbare Design-Präferenz: fest hell/dunkel oder dem System folgen. */
export type ThemePreference = "light" | "dark" | "auto";

/** Tatsächlich angewendetes Design. */
export type ResolvedTheme = "light" | "dark";

/** Prüft, ob ein gespeicherter Wert eine gültige Design-Präferenz ist. */
export function isThemePreference(v: unknown): v is ThemePreference {
  return v === "light" || v === "dark" || v === "auto";
}

/**
 * Reine Auflösungs-Logik: "auto" folgt der System-Einstellung
 * (prefers-color-scheme), feste Werte bleiben unverändert.
 */
export function resolveTheme(
  pref: ThemePreference,
  systemDark: boolean
): ResolvedTheme {
  if (pref === "auto") return systemDark ? "dark" : "light";
  return pref;
}

/**
 * Nächste Stufe des Umschalters: hell → dunkel → automatisch → hell.
 *
 * Steht hier und nicht im ThemeContext, weil der Knopf in der Kopfzeile
 * seit #360 auch mitteilen muss, WAS er gleich einstellt (damit die Wahl
 * ans Konto geht) – zwei Stellen mit derselben Reihenfolge im Kopf sind
 * eine Stelle zu viel.
 */
export function nextThemePreference(current: ThemePreference): ThemePreference {
  return current === "light" ? "dark" : current === "dark" ? "auto" : "light";
}

/** Gespeicherte Design-Präferenz lesen ("light" | "dark" | "auto" | null). */
export function getThemePreference(): ThemePreference | null {
  try {
    const v = localStorage.getItem(THEME_PREF_KEY);
    return isThemePreference(v) ? v : null;
  } catch {
    return null;
  }
}

/** Design-Präferenz auf dem Gerät speichern. */
export function saveThemePreference(pref: ThemePreference) {
  try {
    localStorage.setItem(THEME_PREF_KEY, pref);
  } catch {
    // localStorage nicht verfügbar
  }
}
