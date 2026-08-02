import "dotenv/config";
console.log("DEBUG NODE_ENV IS:", process.env.NODE_ENV);
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { loadDevHtml, loadProdHtml, serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  // Hetzner leitet HTTPS über Apache/Passenger weiter – Express muss dem
  // X-Forwarded-Proto Header vertrauen, damit req.protocol === "https"
  // und Secure-Cookies korrekt gesetzt werden.
  app.set("trust proxy", 1);
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // Health-Check für die Uptime-Überwachung: prüft Prozess und DB-Verbindung.
  // 200 = alles ok, 503 = Datenbank nicht erreichbar.
  let versionInfo: { version: string; builtAt: string | null } | null = null;
  app.get("/api/health", async (_req, res) => {
    const startedAt = Date.now();
    let dbOk = false;
    try {
      const [{ getDb }, { sql }] = await Promise.all([
        import("../db"),
        import("drizzle-orm"),
      ]);
      const db = await getDb();
      if (db) {
        await db.execute(sql`select 1`);
        dbOk = true;
      }
    } catch {
      // dbOk bleibt false
    }
    if (!versionInfo) {
      // dist/version.json entsteht beim Build (scripts/write-version.mjs);
      // im Dev-Modus existiert sie nicht → "dev"
      try {
        const fs = await import("node:fs/promises");
        const path = await import("node:path");
        const raw = await fs.readFile(
          path.join(import.meta.dirname, "version.json"),
          "utf8"
        );
        const parsed = JSON.parse(raw) as {
          version?: string;
          builtAt?: string;
        };
        versionInfo = {
          version: parsed.version ?? "unbekannt",
          builtAt: parsed.builtAt ?? null,
        };
      } catch {
        versionInfo = { version: "dev", builtAt: null };
      }
    }
    res.status(dbOk ? 200 : 503).json({
      status: dbOk ? "ok" : "degraded",
      db: dbOk ? "ok" : "down",
      version: versionInfo.version,
      builtAt: versionInfo.builtAt,
      uptimeSeconds: Math.round(process.uptime()),
      latencyMs: Date.now() - startedAt,
    });
  });
  // Client-Fehlerprotokoll: der ErrorBoundary meldet Abstürze hierher.
  // Anhängen an logs/client-errors.log mit einfacher Grössen-Rotation.
  // Rate-Limit pro IP, damit der Endpoint nicht als Spam-Ziel taugt.
  const logBuckets = new Map<string, { count: number; resetAt: number }>();
  app.post("/api/log", async (req, res) => {
    const ip = req.ip ?? "?";
    const now = Date.now();
    const bucket = logBuckets.get(ip);
    if (!bucket || now > bucket.resetAt) {
      if (logBuckets.size > 5000) logBuckets.clear();
      logBuckets.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
    } else if (bucket.count >= 20) {
      res.status(429).json({ success: false });
      return;
    } else {
      bucket.count += 1;
    }
    try {
      const body = req.body as Record<string, unknown> | undefined;
      const clean = (v: unknown, max: number) =>
        typeof v === "string" ? v.replace(/\s+/g, " ").slice(0, max) : "";
      const line = JSON.stringify({
        at: new Date().toISOString(),
        message: clean(body?.message, 500),
        url: clean(body?.url, 300),
        stack: clean(body?.stack, 4000),
        componentStack: clean(body?.componentStack, 2000),
        userAgent: clean(body?.userAgent, 300),
      });
      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      const logDir = path.join(process.cwd(), "logs");
      const logFile = path.join(logDir, "client-errors.log");
      await fs.mkdir(logDir, { recursive: true });
      await fs.appendFile(logFile, `${line}\n`, "utf8");
      // Rotation: bei über 1 MB die ältesten Zeilen verwerfen
      const stat = await fs.stat(logFile);
      if (stat.size > 1024 * 1024) {
        const content = await fs.readFile(logFile, "utf8");
        const lines = content.split("\n");
        await fs.writeFile(
          logFile,
          lines.slice(Math.floor(lines.length / 2)).join("\n"),
          "utf8"
        );
      }
    } catch {
      // Logging darf den Betrieb nie stören
    }
    res.json({ success: true });
  });
  // Unwetter-Push-Check: wird vom konsoleH-Cronjob aufgerufen (Passenger
  // legt den Prozess schlafen, ein interner Scheduler wäre unzuverlässig).
  // Abgesichert über CRON_SECRET, damit niemand fremde Checks auslösen kann.
  app.get("/api/push/check", async (req, res) => {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.query.secret !== secret) {
      res.status(403).json({ error: "forbidden" });
      return;
    }
    try {
      const { checkAndNotify } = await import("../push");
      const result = await checkAndNotify();
      res.json({ status: "ok", ...result });
    } catch (error) {
      res.status(500).json({ status: "error", message: String(error) });
    }
  });
  // ── Fotos im Reise-Tagebuch ─────────────────────────────────────────────
  // Uploads liegen als Dateien unter uploads/trips/ auf dem Webspace
  // (kein S3). Auth läuft über dieselbe Session-Prüfung wie tRPC
  // (sdk.authenticateRequest: Session-Cookie bzw. Bearer-Fallback).
  const {
    MAX_PHOTO_BYTES,
    MAX_PHOTOS_PER_TRIP,
    MAX_PHOTOS_PER_SPOT,
    PHOTO_MIME_EXTENSIONS,
  } = await import("@shared/tripPhotos");
  /** Session prüfen; bei ungültiger Session wird 401 gesendet und null geliefert. */
  const authenticatePhotoRequest = async (
    req: express.Request,
    res: express.Response
  ) => {
    try {
      const { sdk } = await import("./sdk");
      return await sdk.authenticateRequest(req);
    } catch {
      res.status(401).json({ error: "unauthorized" });
      return null;
    }
  };
  // Upload: der Client verkleinert das Bild vorab (Canvas, max. 1600 px)
  // und schickt es als Raw-Body mit Bild-MIME – Multipart/multer ist
  // dafür unnötig. Serverseitig wird bewusst nicht transformiert
  // (keine sharp-Abhängigkeit auf dem Webhosting).
  app.post(
    "/api/trips/:tripId/photos",
    express.raw({ type: "image/*", limit: MAX_PHOTO_BYTES }),
    async (req, res) => {
      try {
        const user = await authenticatePhotoRequest(req, res);
        if (!user) return;
        const tripId = Number(req.params.tripId);
        if (!Number.isInteger(tripId) || tripId <= 0) {
          res.status(400).json({ error: "badRequest" });
          return;
        }
        const db = await import("../db");
        // Besitzerin/Besitzer ODER eingeladene Mitreisende dürfen hochladen
        const trip = await db.canAccessTrip(tripId, user.id);
        if (!trip) {
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
        if ((await db.countTripPhotosForTrip(tripId)) >= MAX_PHOTOS_PER_TRIP) {
          res.status(409).json({ error: "limitReached" });
          return;
        }
        const { nanoid } = await import("nanoid");
        const fileName = `${nanoid(16)}${extension}`;
        const { tripPhotoStorage } = await import("../photoStorage");
        await tripPhotoStorage.saveFile(fileName, body);
        const id = await db.addTripPhoto({ userId: user.id, tripId, fileName });
        res.json({ id, fileName });
      } catch (error) {
        console.error("[TripPhotos] Upload fehlgeschlagen:", error);
        if (!res.headersSent) res.status(500).json({ error: "serverError" });
      }
    }
  );
  // Auslieferung: Fotos sind privat – nur wer Zugriff auf die Reise hat
  // (Besitzerin/Besitzer oder eingeladenes Mitglied) sieht die Datei.
  app.get("/api/trips/photos/:fileName", async (req, res) => {
    try {
      const user = await authenticatePhotoRequest(req, res);
      if (!user) return;
      const { PHOTO_FILENAME_PATTERN, tripPhotoStorage } =
        await import("../photoStorage");
      const fileName = req.params.fileName;
      if (!PHOTO_FILENAME_PATTERN.test(fileName)) {
        res.status(400).json({ error: "badRequest" });
        return;
      }
      const db = await import("../db");
      const photo = await db.getTripPhotoByFileNameAny(fileName);
      if (!photo || !(await db.canAccessTrip(photo.tripId, user.id))) {
        res.status(404).json({ error: "notFound" });
        return;
      }
      res.sendFile(
        tripPhotoStorage.photoPath(fileName),
        { headers: { "Cache-Control": "private, max-age=3600" } },
        error => {
          // Datei fehlt auf der Platte (z. B. nach Server-Umzug ohne uploads/)
          if (error && !res.headersSent) {
            res.status(404).json({ error: "notFound" });
          }
        }
      );
    } catch (error) {
      console.error("[TripPhotos] Auslieferung fehlgeschlagen:", error);
      if (!res.headersSent) res.status(500).json({ error: "serverError" });
    }
  });
  // ── Foto für eigene Rezepte ─────────────────────────────────────────────
  // Gleiche Technik wie die Tagebuch-Fotos (Raw-Body, Client-Resize,
  // Ablage unter uploads/recipes/), aber genau EIN Foto pro Rezept:
  // ein neuer Upload ersetzt das bisherige Foto.
  app.post(
    "/api/recipes/:recipeId/photo",
    express.raw({ type: "image/*", limit: MAX_PHOTO_BYTES }),
    async (req, res) => {
      try {
        const user = await authenticatePhotoRequest(req, res);
        if (!user) return;
        const recipeId = Number(req.params.recipeId);
        if (!Number.isInteger(recipeId) || recipeId <= 0) {
          res.status(400).json({ error: "badRequest" });
          return;
        }
        const db = await import("../db");
        const recipe = await db.getCustomRecipe(recipeId, user.id);
        if (!recipe) {
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
        const { recipePhotoStorage } = await import("../photoStorage");
        await recipePhotoStorage.saveFile(fileName, body);
        await db.updateCustomRecipe(recipeId, user.id, {
          imageFileName: fileName,
        });
        // Altes Foto erst nach erfolgreichem DB-Update entfernen
        if (recipe.imageFileName) {
          await recipePhotoStorage.deleteFiles([recipe.imageFileName]);
        }
        res.json({ fileName });
      } catch (error) {
        console.error("[RecipePhotos] Upload fehlgeschlagen:", error);
        if (!res.headersSent) res.status(500).json({ error: "serverError" });
      }
    }
  );
  // Auslieferung: nur die Besitzerin/der Besitzer des Rezepts sieht das Foto.
  app.get("/api/recipes/photos/:fileName", async (req, res) => {
    try {
      const user = await authenticatePhotoRequest(req, res);
      if (!user) return;
      const { PHOTO_FILENAME_PATTERN, recipePhotoStorage } =
        await import("../photoStorage");
      const fileName = req.params.fileName;
      if (!PHOTO_FILENAME_PATTERN.test(fileName)) {
        res.status(400).json({ error: "badRequest" });
        return;
      }
      const db = await import("../db");
      const recipe = await db.getCustomRecipeByImageFileName(fileName, user.id);
      if (!recipe) {
        res.status(404).json({ error: "notFound" });
        return;
      }
      res.sendFile(
        recipePhotoStorage.photoPath(fileName),
        { headers: { "Cache-Control": "private, max-age=3600" } },
        error => {
          // Datei fehlt auf der Platte (z. B. nach Server-Umzug ohne uploads/)
          if (error && !res.headersSent) {
            res.status(404).json({ error: "notFound" });
          }
        }
      );
    } catch (error) {
      console.error("[RecipePhotos] Auslieferung fehlgeschlagen:", error);
      if (!res.headersSent) res.status(500).json({ error: "serverError" });
    }
  });
  // ── Foto für Inventar-Gegenstände ───────────────────────────────────────
  // Gleiche Technik wie das Rezept-Foto (Raw-Body, Client-Resize, Ablage
  // unter uploads/inventory/), genau EIN Foto pro Gegenstand: ein neuer
  // Upload ersetzt das bisherige Foto.
  app.post(
    "/api/inventory/:itemId/photo",
    express.raw({ type: "image/*", limit: MAX_PHOTO_BYTES }),
    async (req, res) => {
      try {
        const user = await authenticatePhotoRequest(req, res);
        if (!user) return;
        const itemId = Number(req.params.itemId);
        if (!Number.isInteger(itemId) || itemId <= 0) {
          res.status(400).json({ error: "badRequest" });
          return;
        }
        const db = await import("../db");
        const item = await db.getInventoryItem(itemId, user.id);
        if (!item) {
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
        const { inventoryPhotoStorage } = await import("../photoStorage");
        await inventoryPhotoStorage.saveFile(fileName, body);
        await db.updateInventoryItem(itemId, user.id, {
          imageFileName: fileName,
        });
        // Altes Foto erst nach erfolgreichem DB-Update entfernen
        if (item.imageFileName) {
          await inventoryPhotoStorage.deleteFiles([item.imageFileName]);
        }
        res.json({ fileName });
      } catch (error) {
        console.error("[InventoryPhotos] Upload fehlgeschlagen:", error);
        if (!res.headersSent) res.status(500).json({ error: "serverError" });
      }
    }
  );
  // Auslieferung: nur die Besitzerin/der Besitzer des Gegenstands sieht das Foto.
  app.get("/api/inventory/photos/:fileName", async (req, res) => {
    try {
      const user = await authenticatePhotoRequest(req, res);
      if (!user) return;
      const { PHOTO_FILENAME_PATTERN, inventoryPhotoStorage } =
        await import("../photoStorage");
      const fileName = req.params.fileName;
      if (!PHOTO_FILENAME_PATTERN.test(fileName)) {
        res.status(400).json({ error: "badRequest" });
        return;
      }
      const db = await import("../db");
      const item = await db.getInventoryItemByImageFileName(fileName, user.id);
      if (!item) {
        res.status(404).json({ error: "notFound" });
        return;
      }
      res.sendFile(
        inventoryPhotoStorage.photoPath(fileName),
        { headers: { "Cache-Control": "private, max-age=3600" } },
        error => {
          // Datei fehlt auf der Platte (z. B. nach Server-Umzug ohne uploads/)
          if (error && !res.headersSent) {
            res.status(404).json({ error: "notFound" });
          }
        }
      );
    } catch (error) {
      console.error("[InventoryPhotos] Auslieferung fehlgeschlagen:", error);
      if (!res.headersSent) res.status(500).json({ error: "serverError" });
    }
  });
  // ── Foto für Natur-Beobachtungen ────────────────────────────────────────
  // Gleiche Technik wie das Inventar-Foto (Raw-Body, Client-Resize, Ablage
  // unter uploads/sightings/), genau EIN Foto pro Beobachtung: ein neuer
  // Upload ersetzt das bisherige Foto.
  app.post(
    "/api/sightings/:id/photo",
    express.raw({ type: "image/*", limit: MAX_PHOTO_BYTES }),
    async (req, res) => {
      try {
        const user = await authenticatePhotoRequest(req, res);
        if (!user) return;
        const sightingId = Number(req.params.id);
        if (!Number.isInteger(sightingId) || sightingId <= 0) {
          res.status(400).json({ error: "badRequest" });
          return;
        }
        const db = await import("../db");
        const sighting = await db.getNatureSighting(sightingId, user.id);
        if (!sighting) {
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
        const { sightingPhotoStorage } = await import("../photoStorage");
        await sightingPhotoStorage.saveFile(fileName, body);
        await db.updateNatureSighting(sightingId, user.id, { fileName });
        // Altes Foto erst nach erfolgreichem DB-Update entfernen
        if (sighting.fileName) {
          await sightingPhotoStorage.deleteFiles([sighting.fileName]);
        }
        res.json({ fileName });
      } catch (error) {
        console.error("[SightingPhotos] Upload fehlgeschlagen:", error);
        if (!res.headersSent) res.status(500).json({ error: "serverError" });
      }
    }
  );
  // Auslieferung: nur die Besitzerin/der Besitzer der Beobachtung sieht das Foto.
  app.get("/api/sightings/photos/:fileName", async (req, res) => {
    try {
      const user = await authenticatePhotoRequest(req, res);
      if (!user) return;
      const { PHOTO_FILENAME_PATTERN, sightingPhotoStorage } =
        await import("../photoStorage");
      const fileName = req.params.fileName;
      if (!PHOTO_FILENAME_PATTERN.test(fileName)) {
        res.status(400).json({ error: "badRequest" });
        return;
      }
      const db = await import("../db");
      const sighting = await db.getNatureSightingByFileName(fileName, user.id);
      if (!sighting) {
        res.status(404).json({ error: "notFound" });
        return;
      }
      res.sendFile(
        sightingPhotoStorage.photoPath(fileName),
        { headers: { "Cache-Control": "private, max-age=3600" } },
        error => {
          // Datei fehlt auf der Platte (z. B. nach Server-Umzug ohne uploads/)
          if (error && !res.headersSent) {
            res.status(404).json({ error: "notFound" });
          }
        }
      );
    } catch (error) {
      console.error("[SightingPhotos] Auslieferung fehlgeschlagen:", error);
      if (!res.headersSent) res.status(500).json({ error: "serverError" });
    }
  });
  // ── Fotos für Zeltplatz-Favoriten ───────────────────────────────────────
  // Gleiche Technik wie die Tagebuch-Fotos (Raw-Body, Client-Resize,
  // Ablage unter uploads/spots/), max. 12 Fotos pro Platz. Die Fotos sind
  // privat – die geteilte Ansicht (/platz/:token) zeigt sie bewusst nicht.
  app.post(
    "/api/spots/:spotId/photos",
    express.raw({ type: "image/*", limit: MAX_PHOTO_BYTES }),
    async (req, res) => {
      try {
        const user = await authenticatePhotoRequest(req, res);
        if (!user) return;
        const spotId = Number(req.params.spotId);
        if (!Number.isInteger(spotId) || spotId <= 0) {
          res.status(400).json({ error: "badRequest" });
          return;
        }
        const db = await import("../db");
        const spot = await db.getCampSpot(spotId, user.id);
        if (!spot) {
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
        if (
          (await db.countSpotPhotos(spotId, user.id)) >= MAX_PHOTOS_PER_SPOT
        ) {
          res.status(409).json({ error: "limitReached" });
          return;
        }
        const { nanoid } = await import("nanoid");
        const fileName = `${nanoid(16)}${extension}`;
        const { spotPhotoStorage } = await import("../photoStorage");
        await spotPhotoStorage.saveFile(fileName, body);
        const id = await db.addSpotPhoto({ userId: user.id, spotId, fileName });
        res.json({ id, fileName });
      } catch (error) {
        console.error("[SpotPhotos] Upload fehlgeschlagen:", error);
        if (!res.headersSent) res.status(500).json({ error: "serverError" });
      }
    }
  );
  // Auslieferung: Fotos sind privat – nur die Besitzerin/der Besitzer
  // (DB-Lookup über fileName + userId) bekommt die Datei zu sehen.
  app.get("/api/spots/photos/:fileName", async (req, res) => {
    try {
      const user = await authenticatePhotoRequest(req, res);
      if (!user) return;
      const { PHOTO_FILENAME_PATTERN, spotPhotoStorage } =
        await import("../photoStorage");
      const fileName = req.params.fileName;
      if (!PHOTO_FILENAME_PATTERN.test(fileName)) {
        res.status(400).json({ error: "badRequest" });
        return;
      }
      const db = await import("../db");
      const photo = await db.getSpotPhotoByFileName(fileName, user.id);
      if (!photo) {
        res.status(404).json({ error: "notFound" });
        return;
      }
      res.sendFile(
        spotPhotoStorage.photoPath(fileName),
        { headers: { "Cache-Control": "private, max-age=3600" } },
        error => {
          // Datei fehlt auf der Platte (z. B. nach Server-Umzug ohne uploads/)
          if (error && !res.headersSent) {
            res.status(404).json({ error: "notFound" });
          }
        }
      );
    } catch (error) {
      console.error("[SpotPhotos] Auslieferung fehlgeschlagen:", error);
      if (!res.headersSent) res.status(500).json({ error: "serverError" });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // OpenGraph-Vorschau für geteilte Links: für bekannte Teil-Token wird das
  // SPA-HTML mit OG-Meta-Tags ausgeliefert (Messenger laden kein JavaScript).
  // Unbekannte Token oder Fehler fallen aufs normale SPA-HTML zurück.
  // Der HTML-Loader wird je nach Modus (Vite/Build) unten gesetzt.
  let loadSpaHtml: ((url: string) => Promise<string>) | null = null;
  app.get(
    [
      "/liste/:token",
      "/platz/:token",
      "/vorlage/:token",
      "/einkaufsliste/:token",
    ],
    async (req, res, next) => {
      try {
        if (!loadSpaHtml) {
          next();
          return;
        }
        const { injectOgTags, ogMetaForShareRequest } = await import("./og");
        const origin = `${req.protocol}://${req.get("host")}`;
        const meta = await ogMetaForShareRequest(req.path, origin);
        if (!meta) {
          next();
          return;
        }
        const html = await loadSpaHtml(req.originalUrl);
        res
          .status(200)
          .set({ "Content-Type": "text/html" })
          .send(injectOgTags(html, meta));
      } catch {
        // DB nicht erreichbar o. Ä. → normales SPA-HTML ohne OG-Tags
        next();
      }
    }
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    const vite = await setupVite(app, server);
    loadSpaHtml = url => loadDevHtml(vite, url);
  } else {
    serveStatic(app);
    loadSpaHtml = () => loadProdHtml();
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port =
    process.env.NODE_ENV === "production"
      ? preferredPort
      : await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
