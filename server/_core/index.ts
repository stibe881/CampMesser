import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { MAX_JSON_BODY } from "@shared/tripPhotos";
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
  /**
   * Obergrenze für JSON-Rümpfe (#337).
   *
   * HIER STANDEN 50 MB, mit dem Kommentar «larger size limit for file
   * uploads». Nur laufen Uploads gar nicht hierüber: Sie kommen als
   * Rohdaten mit Bild-MIME und haben unter `/api/trips/:id/photos` ihre
   * eigene, engere Grenze (`express.raw` mit `MAX_PHOTO_BYTES`).
   *
   * WARUM DAS NICHT BLOSS UNORDENTLICH WAR: Der Rumpf wird geparst,
   * BEVOR irgendeine Prüfung stattfindet – vor der Anmeldung, vor tRPC.
   * Wer 50 MB JSON schickt, belegt so viel Speicher im Prozess, ohne ein
   * Konto zu haben. Auf einem Webhosting mit knappem Arbeitsspeicher
   * genügen wenige gleichzeitige Anfragen.
   *
   * WARUM 3 MB UND NICHT WENIGER: Der grösste ehrliche Rumpf ist eine
   * aufgezeichnete Wanderung mit `MAX_TRACK_POINTS` (20 000) Punkten –
   * rund 2 MB JSON. Kein tRPC-Eingang nimmt einen Text über 2000 Zeichen,
   * und base64-Bilder gibt es nirgends.
   */
  app.use(express.json({ limit: MAX_JSON_BODY }));
  app.use(express.urlencoded({ limit: MAX_JSON_BODY, extended: true }));
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
    // Letzter erfolgreicher Cron-Lauf (#314): Ein Überwachungsdienst,
    // der ohnehin schon /api/health abfragt, kann damit auch den
    // stillschweigend ausgefallenen Cronjob bemerken.
    let lastPushCheckAt: string | null = null;
    if (dbOk) {
      const { getState } = await import("../systemState");
      lastPushCheckAt = await getState("lastPushCheck");
    }
    res.status(dbOk ? 200 : 503).json({
      status: dbOk ? "ok" : "degraded",
      db: dbOk ? "ok" : "down",
      version: versionInfo.version,
      builtAt: versionInfo.builtAt,
      uptimeSeconds: Math.round(process.uptime()),
      latencyMs: Date.now() - startedAt,
      lastPushCheckAt,
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
      // Papierkorb (#295) am selben Cronjob aufräumen: ein zweiter
      // Cronjob wäre eine zweite Sache, die eingerichtet werden muss und
      // vergessen werden kann. Ein Fehler beim Aufräumen darf den
      // Push-Check nicht scheitern lassen.
      const { RETENTION_DAYS } = await import("@shared/trash");
      const { purgeExpired } = await import("../trash");
      const purged = await purgeExpired(
        new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000)
      ).catch(error => {
        console.error("[Papierkorb] Aufräumen fehlgeschlagen:", error);
        return 0;
      });
      // WebSub-Abo bei MeteoAlarm erneuern. Der Hub kürzt die Laufzeit
      // nach Gutdünken; ein zweites `subscribe` auf dieselbe Adresse
      // verlängert bloss, es entsteht kein zweites Abo. Scheitert es,
      // holt der Cronjob den Feed weiterhin selbst – der Hub ist die
      // Abkürzung, nicht die Grundlage.
      const { hubConfigured, subscribeToHub } = await import("../meteoAlarm");
      const hub = hubConfigured()
        ? await subscribeToHub().catch(() => "fehler" as const)
        : ("nicht-konfiguriert" as const);
      // Zeitstempel des erfolgreichen Laufs festhalten (#314). Erst hier,
      // nach getaner Arbeit – ein Eintrag am Anfang würde auch dann
      // «läuft» melden, wenn der Check gleich darauf scheitert.
      const { setState } = await import("../systemState");
      await setState("lastPushCheck", new Date().toISOString());
      res.json({ status: "ok", ...result, trashPurged: purged, hub });
    } catch (error) {
      res.status(500).json({ status: "error", message: String(error) });
    }
  });

  // ── WebSub: MeteoAlarm meldet neue amtliche Warnungen ────────────────────
  //
  // DER HUB LIEFERT NUR DAS SIGNAL, NIE DIE DATEN. Trifft eine Meldung
  // ein, wird der Zwischenspeicher verworfen und der Feed NEU bei
  // MeteoAlarm geholt. Damit ist es egal, ob jemand Fremdes an diesen
  // Endpunkt POSTet: Es kostet höchstens einen zusätzlichen Abruf, und
  // eine erfundene Warnung lässt sich so nicht in die App schieben.
  //
  // GET beantwortet die Prüfung des Hubs (er ruft uns mit einer
  // Zufallszeichenkette auf, die wir zurückgeben müssen) – und zwar nur
  // für UNSER Thema, sonst liesse sich der Endpunkt benutzen, um uns bei
  // beliebigen Feeds anzumelden.
  app.get("/api/warnings/hub", async (req, res) => {
    const { verifyChallenge } = await import("../meteoAlarm");
    const challenge = verifyChallenge(req.query);
    if (!challenge) {
      res.status(404).send("not found");
      return;
    }
    res.type("text/plain").send(challenge);
  });

  app.post("/api/warnings/hub", async (_req, res) => {
    // SOFORT ANTWORTEN, DANN ARBEITEN: Der Hub erwartet ein schnelles
    // 2xx und stellt sonst irgendwann die Zustellung ein.
    res.status(204).end();
    try {
      const { invalidateWarnings } = await import("../meteoAlarm");
      invalidateWarnings();
      const { checkAndNotify } = await import("../push");
      await checkAndNotify();
    } catch (error) {
      console.error(
        "[MeteoAlarm] Prüfung nach Hub-Meldung fehlgeschlagen:",
        error
      );
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
  const { MAX_RESERVATION_BYTES, isReservationFileName, reservationExtension } =
    await import("@shared/reservations");
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
        // Änderungsverlauf (#296): Fotos landen hier und nicht über tRPC –
        // ein Upload ist trotzdem eine Änderung an der Reise. Ein Fehler
        // beim Protokollieren darf den Upload nicht scheitern lassen.
        await db
          .recordTripChange({
            tripId,
            userId: user.id,
            area: "photo",
            action: "add",
          })
          .catch(error =>
            console.error("[Reise-Verlauf] Foto-Eintrag fehlgeschlagen:", error)
          );
        res.json({ id, fileName });
      } catch (error) {
        console.error("[TripPhotos] Upload fehlgeschlagen:", error);
        if (!res.headersSent) res.status(500).json({ error: "serverError" });
      }
    }
  );
  // ── Kalender-Abo (#377) ──────────────────────────────────────────────────
  //
  // KEIN LOGIN, UND DAS MUSS SO SEIN: Kalender-Programme kennen weder
  // Konto noch Sitzung – sie holen in regelmässigen Abständen eine
  // Adresse. Die Berechtigung steckt deshalb im Schlüssel darin, wie
  // beim geteilten Platz-Dossier (#45). Wer ihn neu erzeugt (Profil),
  // macht jeden weitergegebenen Link sofort wertlos.
  //
  // Was ausgeliefert wird, ist bewusst wenig: Ort, Zeitraum, Ankunfts-
  // und Abreisezeit. Keine Notizen, keine Fotos, keine Mitreisenden.
  //
  // DIE ENDUNG WIRD SELBST ABGESCHNITTEN und steht nicht als `:token.ics`
  // im Pfad: Wie Express einen Punkt in einem Platzhalter behandelt, hat
  // sich zwischen den Hauptversionen schon geändert. Ein Platzhalter ohne
  // Sonderzeichen und ein `endsWith` daneben tun dasselbe und überleben
  // das nächste Update.
  app.get("/api/kalender/:file", async (req, res) => {
    const { isCalendarToken } = await import("@shared/calendarFeed");
    // Form ZUERST prüfen, dann erst die Datenbank fragen – ein offener
    // Endpunkt soll nicht bei jedem Unsinn in der Adresszeile eine
    // Abfrage auslösen.
    const file = req.params.file ?? "";
    const token = file.endsWith(".ics") ? file.slice(0, -4) : "";
    if (!isCalendarToken(token)) {
      res.status(404).type("text/plain").send("not found");
      return;
    }
    try {
      const db = await import("../db/trips");
      const owner = await db.getUserByCalendarToken(token);
      if (!owner) {
        res.status(404).type("text/plain").send("not found");
        return;
      }
      const [trips, spots] = await Promise.all([
        db.getTripLogs(owner.id),
        (await import("../db/spots")).getCampSpots(owner.id),
      ]);
      const spotById = new Map(spots.map(spot => [spot.id, spot]));
      const { buildTripIcs } = await import("@shared/ics");
      const { tripDisplayName } = await import("@shared/tripName");
      const ics = buildTripIcs(
        trips.map(trip => {
          const spot = trip.spotId != null ? spotById.get(trip.spotId) : null;
          return {
            id: trip.id,
            title: tripDisplayName(trip, "de"),
            startDate: trip.startDate,
            endDate: trip.endDate,
            arrivalTime: trip.arrivalTime,
            departureTime: trip.departureTime,
            placeName: spot?.name ?? trip.location ?? null,
            latitude: spot?.latitude ?? null,
            longitude: spot?.longitude ?? null,
          };
        }),
        { dtstamp: new Date() }
      );
      // Eine halbe Stunde: Kalender fragen von sich aus meist stündlich
      // bis täglich – häufiger zu erlauben bringt nichts, seltener macht
      // eine verschobene Reise unnötig lange falsch.
      res.setHeader("Cache-Control", "private, max-age=1800");
      res.type("text/calendar; charset=utf-8").send(ics);
    } catch (error) {
      console.error("[Kalender-Abo] Abruf fehlgeschlagen:", error);
      res.status(500).type("text/plain").send("error");
    }
  });

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
  // ── Ein-Foto-Ablagen über die Fabrik (#457) ─────────────────────────────
  // Rezept, Inventar-Foto, Inventar-Beleg, Beobachtung, Fang und Notiz
  // teilen exakt dieselbe Upload/Auslieferungs-Logik – registriert aus
  // je einer Beschreibung (server/_core/photoRoutes.ts). Verhalten und
  // Pfade sind unverändert.
  const { registerSinglePhotoRoutes } = await import("./photoRoutes");
  registerSinglePhotoRoutes(app, authenticatePhotoRequest, {
    uploadPath: "/api/recipes/:id/photo",
    servePath: "/api/recipes/photos/:fileName",
    logTag: "RecipePhotos",
    storage: async () => (await import("../photoStorage")).recipePhotoStorage,
    load: async (id, userId) => {
      const db = await import("../db");
      const recipe = await db.getCustomRecipe(id, userId);
      return recipe ? { current: recipe.imageFileName ?? null } : null;
    },
    save: async (id, userId, fileName) => {
      const db = await import("../db");
      await db.updateCustomRecipe(id, userId, { imageFileName: fileName });
    },
    findOwnedByFileName: async (fileName, userId) => {
      const db = await import("../db");
      return db.getCustomRecipeByImageFileName(fileName, userId);
    },
  });
  registerSinglePhotoRoutes(app, authenticatePhotoRequest, {
    uploadPath: "/api/inventory/:id/photo",
    servePath: "/api/inventory/photos/:fileName",
    logTag: "InventoryPhotos",
    storage: async () =>
      (await import("../photoStorage")).inventoryPhotoStorage,
    load: async (id, userId) => {
      const db = await import("../db");
      const item = await db.getInventoryItem(id, userId);
      return item ? { current: item.imageFileName ?? null } : null;
    },
    save: async (id, userId, fileName) => {
      const db = await import("../db");
      await db.updateInventoryItem(id, userId, { imageFileName: fileName });
    },
    findOwnedByFileName: async (fileName, userId) => {
      const db = await import("../db");
      return db.getInventoryItemByImageFileName(fileName, userId);
    },
  });
  registerSinglePhotoRoutes(app, authenticatePhotoRequest, {
    uploadPath: "/api/inventory/:id/receipt",
    servePath: "/api/inventory/receipts/:fileName",
    logTag: "InventoryReceipts",
    storage: async () => (await import("../photoStorage")).receiptPhotoStorage,
    load: async (id, userId) => {
      const db = await import("../db");
      const item = await db.getInventoryItem(id, userId);
      return item ? { current: item.receiptFileName ?? null } : null;
    },
    save: async (id, userId, fileName) => {
      const db = await import("../db");
      await db.updateInventoryItem(id, userId, { receiptFileName: fileName });
    },
    findOwnedByFileName: async (fileName, userId) => {
      const db = await import("../db");
      return db.getInventoryItemByReceiptFileName(fileName, userId);
    },
  });
  registerSinglePhotoRoutes(app, authenticatePhotoRequest, {
    uploadPath: "/api/sightings/:id/photo",
    servePath: "/api/sightings/photos/:fileName",
    logTag: "SightingPhotos",
    storage: async () => (await import("../photoStorage")).sightingPhotoStorage,
    load: async (id, userId) => {
      const db = await import("../db");
      const sighting = await db.getNatureSighting(id, userId);
      return sighting ? { current: sighting.fileName ?? null } : null;
    },
    save: async (id, userId, fileName) => {
      const db = await import("../db");
      await db.updateNatureSighting(id, userId, { fileName });
    },
    findOwnedByFileName: async (fileName, userId) => {
      const db = await import("../db");
      return db.getNatureSightingByFileName(fileName, userId);
    },
  });
  registerSinglePhotoRoutes(app, authenticatePhotoRequest, {
    uploadPath: "/api/catches/:id/photo",
    servePath: "/api/catches/photos/:fileName",
    logTag: "CatchPhotos",
    storage: async () => (await import("../photoStorage")).catchPhotoStorage,
    load: async (id, userId) => {
      const db = await import("../db");
      const entry = await db.getFishCatch(id, userId);
      return entry ? { current: entry.fileName ?? null } : null;
    },
    save: async (id, userId, fileName) => {
      const db = await import("../db");
      await db.updateFishCatch(id, userId, { fileName });
    },
    findOwnedByFileName: async (fileName, userId) => {
      const db = await import("../db");
      return db.getFishCatchByFileName(fileName, userId);
    },
  });
  registerSinglePhotoRoutes(app, authenticatePhotoRequest, {
    uploadPath: "/api/notes/:id/photo",
    servePath: "/api/notes/photos/:fileName",
    logTag: "NotePhotos",
    storage: async () => (await import("../photoStorage")).notePhotoStorage,
    load: async (id, userId) => {
      const db = await import("../db");
      const note = await db.getUserNote(id, userId);
      return note ? { current: note.fileName ?? null } : null;
    },
    save: async (id, userId, fileName) => {
      const db = await import("../db");
      await db.updateUserNote(id, userId, { fileName });
    },
    findOwnedByFileName: async (fileName, userId) => {
      const db = await import("../db");
      return db.getUserNoteByFileName(fileName, userId);
    },
  });
  // ── Buchungsbestätigung zur Reise (#279) ────────────────────────────────
  // Als einzige Ablage sind hier auch PDF erlaubt: Bestätigungen kommen als
  // PDF, und jemanden zum Abfotografieren seines eigenen PDFs zu zwingen
  // wäre albern. Genau EINE Datei pro Reise – ein neuer Upload ersetzt sie.
  app.post(
    "/api/trips/:tripId/reservation",
    express.raw({
      type: ["image/*", "application/pdf"],
      limit: MAX_RESERVATION_BYTES,
    }),
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
        const trip = await db.getTripLog(tripId, user.id);
        if (!trip) {
          res.status(404).json({ error: "notFound" });
          return;
        }
        const extension = reservationExtension(
          String(req.headers["content-type"] ?? "")
        );
        if (!extension) {
          res.status(415).json({ error: "unsupportedType" });
          return;
        }
        const body = req.body as unknown;
        if (!Buffer.isBuffer(body) || body.length === 0) {
          res.status(400).json({ error: "emptyBody" });
          return;
        }
        if (body.length > MAX_RESERVATION_BYTES) {
          res.status(413).json({ error: "tooLarge" });
          return;
        }
        const { nanoid } = await import("nanoid");
        const fileName = `${nanoid(16)}${extension}`;
        const { reservationStorage } = await import("../photoStorage");
        await reservationStorage.saveFile(fileName, body);
        await db.updateTripLog(tripId, user.id, {
          reservationFileName: fileName,
        });
        // Alte Datei erst nach erfolgreichem DB-Update entfernen
        if (trip.reservationFileName) {
          await reservationStorage.deleteFiles([trip.reservationFileName]);
        }
        res.json({ fileName });
      } catch (error) {
        console.error("[Reservations] Upload fehlgeschlagen:", error);
        if (!res.headersSent) res.status(500).json({ error: "serverError" });
      }
    }
  );
  // Auslieferung: nur die Besitzerin/der Besitzer der Reise sieht die Datei.
  // Der Service Worker legt genau diese Antworten in einen eigenen Cache,
  // damit die Bestätigung an der Schranke auch ohne Empfang da ist.
  app.get("/api/trips/reservations/:fileName", async (req, res) => {
    try {
      const user = await authenticatePhotoRequest(req, res);
      if (!user) return;
      const fileName = req.params.fileName;
      if (!isReservationFileName(fileName)) {
        res.status(400).json({ error: "badRequest" });
        return;
      }
      const db = await import("../db");
      const trip = await db.getTripLogByReservationFileName(fileName, user.id);
      if (!trip) {
        res.status(404).json({ error: "notFound" });
        return;
      }
      const { reservationStorage } = await import("../photoStorage");
      res.sendFile(
        reservationStorage.photoPath(fileName),
        { headers: { "Cache-Control": "private, max-age=3600" } },
        error => {
          if (error && !res.headersSent) {
            res.status(404).json({ error: "notFound" });
          }
        }
      );
    } catch (error) {
      console.error("[Reservations] Auslieferung fehlgeschlagen:", error);
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
        // «plan» = der Campingplatz-Plan (#401): höchstens einer pro
        // Platz, ein neuer ersetzt den alten. Alles andere ist Galerie.
        const kind = req.query.kind === "plan" ? "plan" : "foto";
        const existing = await db.getSpotPhotos(spotId, user.id);
        if (kind === "foto") {
          // Der Plan belegt keinen der 12 Galerie-Plätze.
          const galleryCount = existing.filter(p => p.kind !== "plan").length;
          if (galleryCount >= MAX_PHOTOS_PER_SPOT) {
            res.status(409).json({ error: "limitReached" });
            return;
          }
        }
        const { nanoid } = await import("nanoid");
        const fileName = `${nanoid(16)}${extension}`;
        const { spotPhotoStorage } = await import("../photoStorage");
        await spotPhotoStorage.saveFile(fileName, body);
        const id = await db.addSpotPhoto({
          userId: user.id,
          spotId,
          fileName,
          kind,
        });
        if (kind === "plan") {
          // Den alten Plan erst NACH dem erfolgreichen Speichern wegräumen –
          // schlägt der Upload fehl, bleibt wenigstens der alte stehen.
          const oldPlans = existing.filter(p => p.kind === "plan");
          for (const old of oldPlans) {
            await db.deleteSpotPhoto(old.id, user.id);
          }
          if (oldPlans.length > 0) {
            await spotPhotoStorage.deleteFiles(oldPlans.map(p => p.fileName));
          }
        }
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
      "/reise/:token",
      "/quiz/:token",
      "/rezept/:token",
      "/standort/:token",
      "/wanderung/:token",
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
  // Share-Target-Fallback: normalerweise fängt der Service Worker den POST
  // des System-Teilen-Dialogs auf /teilen ab. Läuft (noch) kein aktueller
  // Service Worker, landet der POST hier – dann leiten wir ohne Datei-
  // Übernahme auf die GET-Seite um, die einen erklärenden Hinweis zeigt.
  app.post("/teilen", (_req, res) => {
    res.redirect(303, "/teilen");
  });

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
