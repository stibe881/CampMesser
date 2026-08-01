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
  /** Hindernis-Profil des Sonnen-Kompasses */
  "sunObstacles",
  /** Eigene Materialien im Trockenzeiten-Rechner */
  "dryingCustomItems",
] as const;

export type SyncedSettingKey = (typeof SYNCED_SETTING_KEYS)[number];

/** Obergrenze pro Wert – schützt die DB vor versehentlich riesigen Payloads. */
export const SETTING_VALUE_MAX_LENGTH = 20000;
