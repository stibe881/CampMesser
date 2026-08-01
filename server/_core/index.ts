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
import { serveStatic, setupVite } from "./vite";

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
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
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
