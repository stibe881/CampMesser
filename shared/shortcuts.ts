import { l4, pick, type Language } from "./i18n";

/**
 * Kurzbefehle beim langen Drücken auf das App-Icon (#316).
 *
 * ZWEI WELTEN, EINE LISTE: Als installierte Web-App liest Android die
 * `shortcuts` aus `client/public/manifest.json`. iOS liest sie NICHT – dort
 * gibt es beim langen Drücken auf ein Web-App-Symbol schlicht keine
 * Kurzbefehle, egal was im Manifest steht. Nur die native App kann das, über
 * `UIApplicationShortcutItem`. Deshalb steht die Liste hier: Das Manifest und
 * die native App sollen dasselbe anbieten, und ohne gemeinsame Quelle laufen
 * die beiden Listen mit der Zeit auseinander.
 *
 * VIER, NICHT MEHR: iOS zeigt höchstens vier Kurzbefehle. Die Auswahl folgt
 * dem, was man am Handy im Stehen macht, ohne die App vorher zu öffnen –
 * Notfall, Wetter, Einkauf, Wohnwagen ausrichten. Alles andere ist eine
 * Tätigkeit, bei der man ohnehin schon in der App ist.
 *
 * SPRACHE: `app.json` kann nur feste Texte – die stehen dort auf Deutsch und
 * gelten bis zum ersten Start. Danach schickt die Web-App die Liste in der
 * eingestellten Sprache an den nativen Rahmen (`SET_QUICK_ACTIONS`), und der
 * ersetzt sie. So heisst der Kurzbefehl auf einem französischen Gerät auch
 * französisch.
 */

export interface Shortcut {
  /** Stabiler Schlüssel; iOS gibt ihn beim Antippen zurück. */
  id: string;
  /** Ziel in der App (immer ein eigener Pfad). */
  url: string;
  /** SF-Symbol für iOS (Android nimmt das App-Icon). */
  icon: string;
  title: ReturnType<typeof l4>;
  subtitle: ReturnType<typeof l4>;
}

export const SHORTCUTS: readonly Shortcut[] = [
  {
    id: "sos",
    url: "/sos",
    icon: "symbol:cross.case.fill",
    title: l4("SOS", "SOS", "SOS", "SOS"),
    subtitle: l4(
      "Standort und Notfallnummern",
      "Position et numéros d’urgence",
      "Posizione e numeri d’emergenza",
      "Location and emergency numbers"
    ),
  },
  {
    id: "weather",
    url: "/wetter",
    icon: "symbol:cloud.sun.fill",
    title: l4("Wetter", "Météo", "Meteo", "Weather"),
    subtitle: l4(
      "Vorhersage und Warnungen",
      "Prévisions et avertissements",
      "Previsioni e avvisi",
      "Forecast and warnings"
    ),
  },
  {
    id: "shopping",
    url: "/einkauf",
    icon: "symbol:cart.fill",
    title: l4("Einkauf", "Courses", "Spesa", "Shopping"),
    subtitle: l4(
      "Offene Einkäufe abhaken",
      "Cocher les achats en attente",
      "Spuntare gli acquisti aperti",
      "Tick off open purchases"
    ),
  },
  {
    id: "level",
    url: "/wasserwaage",
    icon: "symbol:ruler.fill",
    title: l4("Wasserwaage", "Niveau", "Livella", "Level"),
    subtitle: l4(
      "Wohnwagen ausrichten",
      "Mettre la caravane de niveau",
      "Livellare la roulotte",
      "Level the caravan"
    ),
  },
] as const;

/** iOS zeigt nie mehr als vier – die Liste hält sich daran. */
export const MAX_SHORTCUTS = 4;

/** Die Liste in einer Sprache, fertig für `QuickActions.setItems`. */
export function shortcutsFor(lang: Language) {
  return SHORTCUTS.slice(0, MAX_SHORTCUTS).map(entry => ({
    id: entry.id,
    title: pick(entry.title, lang),
    subtitle: pick(entry.subtitle, lang),
    icon: entry.icon,
    params: { url: entry.url },
  }));
}

/** Zu welchem Pfad gehört ein Kurzbefehl? (null = unbekannter Schlüssel) */
export function shortcutUrl(id: string): string | null {
  return SHORTCUTS.find(entry => entry.id === id)?.url ?? null;
}
