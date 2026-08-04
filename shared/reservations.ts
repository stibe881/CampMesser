/**
 * Reservation ablegen (#279): die Buchungsbestätigung als Foto oder PDF
 * an der Reise.
 *
 * WARUM ÜBERHAUPT: Die Bestätigung liegt im Mail-Postfach, und genau
 * dort kommt man an der Schranke um 22 Uhr ohne Empfang nicht heran.
 * Deshalb hängt sie hier an der Reise – und der Service Worker legt die
 * einmal geöffnete Datei in einen eigenen Cache, damit sie auch ohne
 * Netz noch da ist.
 *
 * PDF ist bewusst zugelassen, obwohl die App sonst nur Bilder speichert:
 * Buchungsbestätigungen kommen als PDF, und jemanden zum Abfotografieren
 * seines eigenen PDFs zu zwingen wäre albern.
 */

/** Erlaubte Inhaltstypen und ihre Dateiendung. */
export const RESERVATION_MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

/**
 * Grösse pro Datei. Ein abfotografierter Zettel liegt bei ein bis zwei
 * Megabyte, ein PDF einer Buchungsplattform selten über fünf – zehn ist
 * grosszügig und begrenzt trotzdem, was ein Konto belegen kann.
 */
export const MAX_RESERVATION_BYTES = 10 * 1024 * 1024;

/** Nur serverseitig erzeugte Namen (nanoid + Endung) – kein Pfad-Traversal. */
export const RESERVATION_FILENAME_PATTERN =
  /^[A-Za-z0-9_-]{8,40}\.(jpg|png|webp|pdf)$/;

/**
 * Endung zu einem Inhaltstyp; null, wenn der Typ nicht erlaubt ist.
 * Der Typ wird ohne Parameter («; charset=…») und klein verglichen.
 */
export function reservationExtension(contentType: string): string | null {
  const clean = contentType.split(";")[0].trim().toLowerCase();
  return RESERVATION_MIME_EXTENSIONS[clean] ?? null;
}

/** Ist der Dateiname ein gültiger Reservations-Name? */
export function isReservationFileName(fileName: string): boolean {
  return RESERVATION_FILENAME_PATTERN.test(fileName);
}

/** PDF oder Bild? Bestimmt, ob die Ansicht einbettet oder verlinkt. */
export function isPdfReservation(fileName: string): boolean {
  return fileName.toLowerCase().endsWith(".pdf");
}
