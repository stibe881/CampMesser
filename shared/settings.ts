/**
 * Schlüssel der geräteübergreifend synchronisierten Client-Einstellungen.
 * Client und Server teilen sich diese Liste – neue synchronisierbare
 * Einstellungen hier ergänzen.
 */
export const SYNCED_SETTING_KEYS = [
  /** Kachel-Reihenfolge der Startseite */
  "moduleOrder",
  /** Auf der Startseite ausgeblendete Kacheln */
  "hiddenModules",
  /** Auf der Startseite ausgeblendete Widgets (Wetter, Tipp des Tages …) */
  "hiddenWidgets",
  /** Hindernis-Profil des Sonnen-Kompasses */
  "sunObstacles",
  /** Eigene Materialien im Trockenzeiten-Rechner */
  "dryingCustomItems",
  /** Benannte Ziele des Zelt-Finders (Zelt, Duschen …) */
  "tentFinderTargets",
  /** Gewählte App-Sprache (de/fr/it/en) */
  "language",
  /** Lernfortschritt des Knoten-Quiz (Statistik pro Knoten) */
  "knotProgress",
  /** Bestzeiten der Schnitzeljagden (Sekunden pro Jagd-Id) */
  "huntBestTimes",
  /** Favorisierte Rezepte (statische Ids + «eigenes-<id>») */
  "recipeFavorites",
  /** Einkaufs-Verlauf für Autocomplete-Vorschläge */
  "shoppingHistory",
  /** Gespeicherte Wetter-Orte (Favoriten der Wettervorhersage) */
  "weatherPlaces",
  /** Allergie-Profil: eigene Pollenarten im Wetter-Modul */
  "pollenProfile",
  /** Fahrzeug-Profile (Wasserwaage + Zuladungs-Rechner) */
  "vehicles",
  /** Zuladungs-Plan: Fahrzeugwahl, Personen und freie Posten */
  "payloadPlan",
  /** Strom-Speicher des Energie-Budgets (Kapazität, Bauart, Ladestand) */
  "powerStorage",
  /** Eigene Solaranlage (Nennleistung, Aufstellung) für die Ertrags-Prognose */
  "solarPanel",
  /** Frei belegte Plätze der Schnellzugriff-Leiste (#297) */
  "quickBar",
  /** Während einer laufenden Reise mit der «Heute»-Ansicht starten (#298) */
  "todayStart",
] as const;

export type SyncedSettingKey = (typeof SYNCED_SETTING_KEYS)[number];

/** Obergrenze pro Wert – schützt die DB vor versehentlich riesigen Payloads. */
export const SETTING_VALUE_MAX_LENGTH = 20000;
