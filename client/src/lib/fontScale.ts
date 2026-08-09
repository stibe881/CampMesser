/**
 * Schriftgrösse (#546): drei Stufen, angewendet über die Wurzel-Schriftgrösse
 * (alle Tailwind-Grössen sind rem und wachsen mit). Eigenes Mini-Modul wie
 * themePreference.ts, damit der App-Start die Stufe anwenden kann, ohne die
 * Profil-Seite ins Haupt-Bundle zu ziehen.
 *
 * Seit #611 wandert die Wahl AUCH ans Konto (synchronisierte
 * Einstellungen, Muster Design #360): Wer die Schrift braucht, braucht
 * sie auf jedem Gerät – der ursprüngliche Geräte-lokal-Entscheid (#546)
 * ist damit auf ausdrücklichen Nutzerwunsch revidiert. Der localStorage
 * bleibt als Sofort-Start-Wert bestehen.
 */
const FONT_SCALE_KEY = "campmesser.fontScale";

export type FontScale = "normal" | "large" | "xlarge";

export const FONT_SCALES: readonly FontScale[] = ["normal", "large", "xlarge"];

/** Wurzel-Schriftgrösse je Stufe in Prozent (100 = Browser-Standard 16px). */
export const FONT_SCALE_PERCENT: Record<FontScale, number> = {
  normal: 100,
  large: 112.5,
  xlarge: 125,
};

export function isFontScale(v: unknown): v is FontScale {
  return v === "normal" || v === "large" || v === "xlarge";
}

/** Gespeicherte Stufe lesen; ohne (oder kaputte) Wahl gilt «normal». */
export function getFontScale(): FontScale {
  try {
    const v = localStorage.getItem(FONT_SCALE_KEY);
    return isFontScale(v) ? v : "normal";
  } catch {
    return "normal";
  }
}

export function saveFontScale(scale: FontScale) {
  try {
    localStorage.setItem(FONT_SCALE_KEY, scale);
  } catch {
    // localStorage nicht verfügbar
  }
}

/**
 * Stufe anwenden: bei «normal» wird der Inline-Stil entfernt, damit der
 * Browser-Standard (und eine allfällige Nutzer-Einstellung im Browser)
 * wieder gilt.
 */
export function applyFontScale(scale: FontScale) {
  const percent = FONT_SCALE_PERCENT[scale];
  document.documentElement.style.fontSize =
    percent === 100 ? "" : `${percent}%`;
}
