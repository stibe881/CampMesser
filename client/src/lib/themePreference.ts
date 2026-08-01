/**
 * Design-Präferenz (Hell/Dunkel) aus dem Profil – eigenes Modul, damit der
 * App-Start sie lesen kann, ohne die ganze Profil-Seite ins Haupt-Bundle zu ziehen.
 */
const THEME_PREF_KEY = "campmesser.themePreference";

/** Gespeicherte Design-Präferenz lesen ("light" | "dark" | null). */
export function getThemePreference(): "light" | "dark" | null {
  try {
    const v = localStorage.getItem(THEME_PREF_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

/** Design-Präferenz auf dem Gerät speichern. */
export function saveThemePreference(pref: "light" | "dark") {
  try {
    localStorage.setItem(THEME_PREF_KEY, pref);
  } catch {
    // localStorage nicht verfügbar
  }
}
