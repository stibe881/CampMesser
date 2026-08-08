/**
 * Foto-Routen-Fabrik (#457): In server/_core/index.ts standen sechs fast
 * wortgleiche Upload/Auslieferungs-Blöcke für «genau EIN Foto pro
 * Datensatz» (Rezepte, Inventar-Foto, Inventar-Beleg, Beobachtungen,
 * Fänge, Notizen – mit den Karten & Ausweisen (#454) ein siebter). Wer
 * dort eine Prüfung nachzog, musste an sechs Stellen dasselbe tippen.
 *
 * Die Fabrik registriert beide Routen aus einer Beschreibung; das
 * VERHALTEN ist unverändert: Raw-Body mit Bild-MIME (Client-Resize),
 * HEIC-Absage, Grössen-Limit, neuer Dateiname per nanoid, altes Foto
 * erst nach erfolgreichem DB-Update löschen, Auslieferung nur an die
 * Besitzerin/den Besitzer.
 *
 * NICHT über die Fabrik laufen die Sonderfälle: Reise-Fotos (mehrere
 * pro Reise + Änderungsverlauf), Platz-Galerie (max. 12) und die
 * Buchungsbestätigung (PDF erlaubt, eigenes Limit).
 */
import express from "express";
import { MAX_PHOTO_BYTES, PHOTO_MIME_EXTENSIONS } from "@shared/tripPhotos";

interface AuthedUser {
  id: number;
}

/** Der Ausschnitt aus createPhotoStorage(), den die Routen brauchen. */
interface PhotoStorageLike {
  saveFile(fileName: string, data: Buffer): Promise<void>;
  deleteFiles(fileNames: string[]): Promise<void>;
  photoPath(fileName: string): string;
}

export interface SinglePhotoRoutes {
  /** Upload-Route, z. B. "/api/recipes/:id/photo" – Platzhalter heisst :id. */
  uploadPath: string;
  /** Auslieferungs-Route, z. B. "/api/recipes/photos/:fileName". */
  servePath: string;
  /** Präfix der Fehler-Logzeilen, z. B. "RecipePhotos". */
  logTag: string;
  /** Ablage (lazy, wie bisher per import in der Anfrage). */
  storage(): Promise<PhotoStorageLike>;
  /** Datensatz laden; null = nicht gefunden/kein Zugriff. `current` ist
   * der bisherige Dateiname (wird nach dem Ersetzen gelöscht). */
  load(id: number, userId: number): Promise<{ current: string | null } | null>;
  /** Neuen Dateinamen am Datensatz speichern. */
  save(id: number, userId: number, fileName: string): Promise<void>;
  /** Datensatz zur Auslieferung über den Dateinamen finden (nur eigene). */
  findOwnedByFileName(fileName: string, userId: number): Promise<unknown>;
}

export function registerSinglePhotoRoutes(
  app: express.Express,
  authenticate: (
    req: express.Request,
    res: express.Response
  ) => Promise<AuthedUser | null>,
  routes: SinglePhotoRoutes
): void {
  app.post(
    routes.uploadPath,
    express.raw({ type: "image/*", limit: MAX_PHOTO_BYTES }),
    async (req, res) => {
      try {
        const user = await authenticate(req, res);
        if (!user) return;
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
          res.status(400).json({ error: "badRequest" });
          return;
        }
        const record = await routes.load(id, user.id);
        if (!record) {
          res.status(404).json({ error: "notFound" });
          return;
        }
        const contentType = String(req.headers["content-type"] ?? "")
          .split(";")[0]
          .trim()
          .toLowerCase();
        if (contentType === "image/heic" || contentType === "image/heif") {
          res.status(415).json({ error: "heicNotSupported" });
          return;
        }
        const extension = PHOTO_MIME_EXTENSIONS[contentType];
        if (!extension) {
          res.status(415).json({ error: "unsupportedType" });
          return;
        }
        const body = req.body as unknown;
        if (!Buffer.isBuffer(body) || body.length === 0) {
          res.status(400).json({ error: "emptyBody" });
          return;
        }
        if (body.length > MAX_PHOTO_BYTES) {
          res.status(413).json({ error: "tooLarge" });
          return;
        }
        const { nanoid } = await import("nanoid");
        const fileName = `${nanoid(16)}${extension}`;
        const storage = await routes.storage();
        await storage.saveFile(fileName, body);
        await routes.save(id, user.id, fileName);
        // Altes Foto erst nach erfolgreichem DB-Update entfernen
        if (record.current) {
          await storage.deleteFiles([record.current]);
        }
        res.json({ fileName });
      } catch (error) {
        console.error(`[${routes.logTag}] Upload fehlgeschlagen:`, error);
        if (!res.headersSent) res.status(500).json({ error: "serverError" });
      }
    }
  );

  // Auslieferung: nur die Besitzerin/der Besitzer sieht die Datei.
  app.get(routes.servePath, async (req, res) => {
    try {
      const user = await authenticate(req, res);
      if (!user) return;
      const { PHOTO_FILENAME_PATTERN } = await import("../photoStorage");
      const fileName = req.params.fileName;
      if (!PHOTO_FILENAME_PATTERN.test(fileName)) {
        res.status(400).json({ error: "badRequest" });
        return;
      }
      const record = await routes.findOwnedByFileName(fileName, user.id);
      if (!record) {
        res.status(404).json({ error: "notFound" });
        return;
      }
      const storage = await routes.storage();
      res.sendFile(
        storage.photoPath(fileName),
        { headers: { "Cache-Control": "private, max-age=3600" } },
        error => {
          // Datei fehlt auf der Platte (z. B. nach Server-Umzug ohne uploads/)
          if (error && !res.headersSent) {
            res.status(404).json({ error: "notFound" });
          }
        }
      );
    } catch (error) {
      console.error(`[${routes.logTag}] Auslieferung fehlgeschlagen:`, error);
      if (!res.headersSent) res.status(500).json({ error: "serverError" });
    }
  });
}
