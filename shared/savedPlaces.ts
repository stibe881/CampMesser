/**
 * Merkorte (#537): Wunschziele, die man beim Stöbern auf der Karte
 * ablegt – «da wollen wir mal hin». Bewusst LEICHTER als ein
 * Zeltplatz-Favorit: nur Name, Notiz und Pin-Farbe, kein Dossier.
 * Beim Anlegen einer Reise schlägt das Formular die Merkorte als
 * Ort mit Koordinaten vor.
 */
import { l4, type L4 } from "./i18n";

export const SAVED_PLACE_NAME_MAX_LENGTH = 120;
export const SAVED_PLACE_NOTE_MAX_LENGTH = 240;

/** Wählbare Pin-Farben (Schlüssel englisch in der DB, wie MEALS). */
export const SAVED_PLACE_COLORS = [
  "red",
  "orange",
  "green",
  "blue",
  "purple",
] as const;
export type SavedPlaceColor = (typeof SAVED_PLACE_COLORS)[number];

/**
 * Hex-Werte der Pin-Farben – bewusst die HELLEN Tailwind-500er, damit
 * sich die Merkorte von den dunkleren Ebenen-Pins der Karte abheben
 * (Platz-Grün #2f6b4f, OSM-Blau #0369a1, Feuer-Rot #dc2626 …).
 */
export const SAVED_PLACE_COLOR_HEX: Record<SavedPlaceColor, string> = {
  red: "#ef4444",
  orange: "#f97316",
  green: "#22c55e",
  blue: "#3b82f6",
  purple: "#a855f7",
};

export const SAVED_PLACE_COLOR_LABELS: Record<SavedPlaceColor, L4> = {
  red: l4("Rot", "Rouge", "Rosso", "Red"),
  orange: l4("Orange", "Orange", "Arancione", "Orange"),
  green: l4("Grün", "Vert", "Verde", "Green"),
  blue: l4("Blau", "Bleu", "Blu", "Blue"),
  purple: l4("Violett", "Violet", "Viola", "Purple"),
};

/** Unbekannte Werte (alte Zeilen, Tippfehler) fallen auf Rot zurück. */
export function normalizeSavedPlaceColor(value: string): SavedPlaceColor {
  return (SAVED_PLACE_COLORS as readonly string[]).includes(value)
    ? (value as SavedPlaceColor)
    : "red";
}
