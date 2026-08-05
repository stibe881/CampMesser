import { fmtMedium } from "@/lib/dateFormat";
import type { Language } from "@shared/i18n";

/**
 * Kleinteile, die sich Trips.tsx und die ausgelagerten Reise-Bausteine
 * teilen (#322).
 *
 * WARUM EINE EIGENE DATEI: Beim Aufteilen von Trips.tsx (5375 Zeilen)
 * blieben genau drei Dinge übrig, die BEIDE Seiten brauchen. Sie aus der
 * Seite zu exportieren hätte einen Ring ergeben – Seite importiert
 * Baustein, Baustein importiert Seite –, und Ringe sind die Art Fehler,
 * die erst im Browser auffällt.
 */

/** Wie lange die Wettervorhersage reicht (Open-Meteo liefert 16 Tage). */
export const MAX_FORECAST_DAYS = 16;

/** Adresse eines Reise-Fotos. */
export const tripPhotoSrc = (fileName: string) =>
  `/api/trips/photos/${fileName}`;

/** Zeitraum einer Reise als Text, z. B. «3. Aug. 2026 – 9. Aug. 2026». */
export function formatTripRange(
  startDate: string,
  endDate: string,
  lang: Language
): string {
  const fmt = (iso: string) => fmtMedium(new Date(`${iso}T00:00:00`), lang);
  if (startDate === endDate) return fmt(startDate);
  return `${fmt(startDate)} – ${fmt(endDate)}`;
}
