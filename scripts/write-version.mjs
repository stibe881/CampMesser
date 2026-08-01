/**
 * Schreibt die Build-Version (Git-Commit + Zeitpunkt) nach dist/version.json,
 * damit der Server sie im Health-Endpoint ausgeben kann. Läuft als letzter
 * Schritt von `pnpm run build`.
 */
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

let version = "unbekannt";
try {
  version = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
} catch {
  // Kein Git verfügbar (z. B. Tarball-Deployment)
}

const dist = path.join(root, "dist");
mkdirSync(dist, { recursive: true });
writeFileSync(
  path.join(dist, "version.json"),
  `${JSON.stringify({ version, builtAt: new Date().toISOString() }, null, 2)}\n`,
);
console.log(`Version ${version} nach dist/version.json geschrieben`);
