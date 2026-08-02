import fs from "node:fs/promises";
import path from "node:path";

/**
 * Dateiablage für Tagebuch-Fotos auf dem Webspace (kein S3).
 *
 * Zentrale Pfad-Konstante: `uploads/` liegt relativ zum App-Root – in
 * Produktion also neben `dist/` (Passenger startet die App im App-Root,
 * gleiches Muster wie `logs/` in server/_core/index.ts). Das Verzeichnis
 * ist in .gitignore ausgenommen und wird vom Git-Pull-Deployment nie
 * angefasst; Details in DEPLOYMENT-HETZNER.md.
 */
export const UPLOADS_ROOT = path.join(process.cwd(), "uploads");

/** Ablage der Tagebuch-Fotos: uploads/trips/<fileName> */
export const TRIP_PHOTOS_DIR = path.join(UPLOADS_ROOT, "trips");

/** Nur serverseitig generierte Namen (nanoid + Endung) – kein Pfad-Traversal möglich. */
export const TRIP_PHOTO_FILENAME_PATTERN =
  /^[A-Za-z0-9_-]{8,40}\.(jpg|png|webp)$/;

/** Absoluter Pfad einer Foto-Datei. */
export function tripPhotoPath(fileName: string): string {
  return path.join(TRIP_PHOTOS_DIR, fileName);
}

/** Foto speichern; legt das Verzeichnis bei Bedarf an. */
export async function saveTripPhotoFile(
  fileName: string,
  data: Buffer
): Promise<void> {
  await fs.mkdir(TRIP_PHOTOS_DIR, { recursive: true });
  await fs.writeFile(tripPhotoPath(fileName), data);
}

/**
 * Foto-Dateien löschen. Fehlende Dateien werden ignoriert – der DB-Eintrag
 * ist die Wahrheit, eine verwaiste Datei darf das Löschen nie blockieren.
 */
export async function deleteTripPhotoFiles(fileNames: string[]): Promise<void> {
  await Promise.all(
    fileNames.map(fileName =>
      fs.unlink(tripPhotoPath(fileName)).catch(() => {})
    )
  );
}
