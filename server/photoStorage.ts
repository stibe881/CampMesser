import fs from "node:fs/promises";
import path from "node:path";

/**
 * Dateiablage für hochgeladene Fotos auf dem Webspace (kein S3).
 *
 * Zentrale Pfad-Konstante: `uploads/` liegt relativ zum App-Root – in
 * Produktion also neben `dist/` (Passenger startet die App im App-Root,
 * gleiches Muster wie `logs/` in server/_core/index.ts). Das Verzeichnis
 * ist in .gitignore ausgenommen und wird vom Git-Pull-Deployment nie
 * angefasst; Details in DEPLOYMENT-HETZNER.md.
 */
export const UPLOADS_ROOT = path.join(process.cwd(), "uploads");

/** Nur serverseitig generierte Namen (nanoid + Endung) – kein Pfad-Traversal möglich. */
export const PHOTO_FILENAME_PATTERN = /^[A-Za-z0-9_-]{8,40}\.(jpg|png|webp)$/;

/** Ablage für eine Foto-Kategorie: uploads/<subdir>/<fileName>. */
export interface PhotoStorage {
  /** Absoluter Pfad des Ablage-Verzeichnisses. */
  dir: string;
  /** Absoluter Pfad einer Foto-Datei. */
  photoPath(fileName: string): string;
  /** Foto speichern; legt das Verzeichnis bei Bedarf an. */
  saveFile(fileName: string, data: Buffer): Promise<void>;
  /**
   * Foto-Dateien löschen. Fehlende Dateien werden ignoriert – der DB-Eintrag
   * ist die Wahrheit, eine verwaiste Datei darf das Löschen nie blockieren.
   */
  deleteFiles(fileNames: string[]): Promise<void>;
}

export function createPhotoStorage(subdir: string): PhotoStorage {
  const dir = path.join(UPLOADS_ROOT, subdir);
  const photoPath = (fileName: string) => path.join(dir, fileName);
  return {
    dir,
    photoPath,
    async saveFile(fileName, data) {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(photoPath(fileName), data);
    },
    async deleteFiles(fileNames) {
      await Promise.all(
        fileNames.map(fileName =>
          fs.unlink(photoPath(fileName)).catch(() => {})
        )
      );
    },
  };
}

/** Tagebuch-Fotos: uploads/trips/<fileName> */
export const tripPhotoStorage = createPhotoStorage("trips");

/** Fotos eigener Rezepte: uploads/recipes/<fileName> */
export const recipePhotoStorage = createPhotoStorage("recipes");

/** Fotos zu Zeltplatz-Favoriten: uploads/spots/<fileName> */
export const spotPhotoStorage = createPhotoStorage("spots");

/** Fotos zu Inventar-Gegenständen: uploads/inventory/<fileName> */
export const inventoryPhotoStorage = createPhotoStorage("inventory");

/** Belege (Kaufquittungen) zu Inventar-Gegenständen: uploads/receipts/<fileName> */
export const receiptPhotoStorage = createPhotoStorage("receipts");

/** Fotos zu Natur-Beobachtungen: uploads/sightings/<fileName> */
export const sightingPhotoStorage = createPhotoStorage("sightings");

/** Fotos zu Fängen im Fangbuch: uploads/catches/<fileName> */
export const catchPhotoStorage = createPhotoStorage("catches");

/** Fotos zu freien Notizen (#433): uploads/notes/<fileName> */
export const notePhotoStorage = createPhotoStorage("notes");

/**
 * Buchungsbestätigungen zu Reisen (#279): uploads/reservations/<fileName>.
 * Als einzige Ablage sind hier auch PDF erlaubt – die Prüfung von Typ und
 * Dateiname steht in shared/reservations.ts.
 */
export const reservationStorage = createPhotoStorage("reservations");
