import { defineConfig } from "@playwright/test";

/**
 * Smoke-Tests gegen den Produktions-Build: `pnpm run build` muss vorher
 * gelaufen sein. Der Server startet ohne Datenbank (öffentliche Seiten
 * funktionieren trotzdem). Lokal kann mit PW_CHROMIUM_PATH ein vorhandenes
 * Chromium verwendet werden, statt eines herunterzuladen.
 */
export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://127.0.0.1:3900",
    // Die App erkennt seit Runde 15 die Browsersprache beim Erstbesuch –
    // die Tests prüfen deutsche Texte, also deterministisch de-CH erzwingen.
    locale: "de-CH",
    launchOptions: process.env.PW_CHROMIUM_PATH
      ? { executablePath: process.env.PW_CHROMIUM_PATH }
      : {},
  },
  webServer: {
    command: "node dist/index.js",
    // Auf die Startseite warten – /api/health liefert ohne Datenbank bewusst 503
    url: "http://127.0.0.1:3900/",
    reuseExistingServer: false,
    timeout: 30_000,
    env: {
      NODE_ENV: "production",
      PORT: "3900",
      JWT_SECRET: "smoke-test-secret",
    },
  },
});
