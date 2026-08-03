/**
 * Startseiten-Widgets ein-/ausblenden: reine Logik ohne React, damit sie
 * unabhängig testbar bleibt. Pflicht-Bereiche (Hero, Suche, Modul-Kacheln)
 * tauchen hier bewusst NICHT auf – sie lassen sich nicht abschalten. Der
 * Zustand wird als Liste ausgeblendeter Widget-Ids gespeichert (Muster
 * hiddenModules): localStorage als schnelle Quelle, `hiddenWidgets` als
 * synchronisierte Einstellung fürs Konto.
 */

/** localStorage-Schlüssel der ausgeblendeten Widgets. */
export const HIDDEN_WIDGETS_KEY = "campmesser.hiddenWidgets";

/**
 * Abschaltbare Widgets der Startseite in Anzeige-Reihenfolge.
 * Die Ids sind stabil (gespeicherte Auswahlen hängen daran) – neue Widgets
 * bitte hinten anfügen, bestehende nie umbenennen.
 */
export const OPTIONAL_WIDGETS = [
  "onboarding",
  "trip",
  "anniversary",
  "weather",
  "tip",
  "recent",
] as const;

export type OptionalWidgetId = (typeof OPTIONAL_WIDGETS)[number];

/** Ist die Id eines der abschaltbaren Widgets? */
export function isOptionalWidget(value: unknown): value is OptionalWidgetId {
  return (
    typeof value === "string" &&
    (OPTIONAL_WIDGETS as readonly string[]).includes(value)
  );
}

/**
 * Unbekannte Daten (localStorage/Geräte-Sync) defensiv in eine saubere
 * Liste überführen: nur bekannte Ids, ohne Duplikate, in der Reihenfolge
 * von OPTIONAL_WIDGETS – so bleibt der gespeicherte Wert stabil.
 */
export function sanitizeHiddenWidgets(value: unknown): OptionalWidgetId[] {
  if (!Array.isArray(value)) return [];
  return OPTIONAL_WIDGETS.filter(id => value.includes(id));
}

/** Wird das Widget angezeigt? (unbekannte Ids gelten als sichtbar) */
export function isWidgetVisible(
  hidden: readonly string[],
  id: OptionalWidgetId
): boolean {
  return !hidden.includes(id);
}

/**
 * Widget aus- bzw. wieder einblenden. Liefert immer eine neue, bereinigte
 * Liste – kaputte Alt-Werte werden dabei nebenbei aufgeräumt.
 */
export function toggleWidget(
  hidden: readonly string[],
  id: OptionalWidgetId
): OptionalWidgetId[] {
  const next = hidden.includes(id)
    ? hidden.filter(entry => entry !== id)
    : [...hidden, id];
  return sanitizeHiddenWidgets(next);
}

/** Ausgeblendete Widgets aus localStorage laden (kaputte Werte ergeben []). */
export function loadHiddenWidgets(): OptionalWidgetId[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(HIDDEN_WIDGETS_KEY);
    return raw ? sanitizeHiddenWidgets(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

/** Ausgeblendete Widgets auf dem Gerät speichern (Quota-Fehler ignorieren). */
export function storeHiddenWidgets(hidden: readonly OptionalWidgetId[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(HIDDEN_WIDGETS_KEY, JSON.stringify(hidden));
  } catch {
    /* Speicher blockiert – die Auswahl gilt nur für diese Sitzung */
  }
}
