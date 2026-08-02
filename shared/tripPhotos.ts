/**
 * Gemeinsame Regeln für Foto-Uploads (Reise-Tagebuch, Rezepte, Zeltplätze).
 * Server (Upload-Limits) und Client (Hinweise, Vorab-Prüfung) nutzen dieselben Werte.
 */

/** Maximale Anzahl Fotos pro Aufenthalt. */
export const MAX_PHOTOS_PER_TRIP = 12;

/** Maximale Anzahl Fotos pro Zeltplatz-Favorit. */
export const MAX_PHOTOS_PER_SPOT = 12;

/** Maximale Dateigrösse pro Foto in Bytes (5 MB). */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** Erlaubte Bildformate → Dateiendung des serverseitig generierten Namens. */
export const PHOTO_MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

/** MIME-Typen, die bewusst abgelehnt werden (Browser können sie nicht anzeigen). */
export const REJECTED_HEIC_TYPES = ["image/heic", "image/heif"];
