/**
 * Startdatei für Hetzner Webhosting (konsoleH → Services → Node.js Konfiguration).
 *
 * konsoleH ruft genau eine Datei ohne weitere Argumente auf. Diese Datei lädt
 * die Werte aus der .env-Datei im selben Verzeichnis und startet anschliessend
 * den gebauten Server aus dist/index.js.
 *
 * Voraussetzung: einmalig "pnpm build" (oder "npm run build") per SSH ausführen.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const rootDir = dirname(fileURLToPath(import.meta.url));

// --- .env einlesen (einfacher Parser, bewusst ohne zusätzliche Abhängigkeit) ---
const envFile = resolve(rootDir, ".env");
if (existsSync(envFile)) {
  for (const rawLine of readFileSync(envFile, "utf8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // Werte aus der konsoleH-Konfiguration haben Vorrang vor der .env-Datei.
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

process.env.NODE_ENV = process.env.NODE_ENV || "production";

const serverEntry = resolve(rootDir, "dist", "index.js");
if (!existsSync(serverEntry)) {
  console.error(
    "[CampMesser] dist/index.js fehlt. Bitte einmalig per SSH ausführen:\n" +
      "  cd " +
      rootDir +
      " && pnpm install && pnpm build"
  );
  process.exit(1);
}

console.log(
  `[CampMesser] Starte Server (NODE_ENV=${process.env.NODE_ENV}, PORT=${process.env.PORT ?? "3000"})`
);

await import(pathToFileURL(serverEntry).href);
