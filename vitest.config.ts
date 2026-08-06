import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

/**
 * ZWEI TESTUMGEBUNGEN, weil es zwei Arten von Code gibt (#340).
 *
 * BIS HIERHER war alles `environment: "node"` und lag unter `server/**` –
 * gut zweitausend Tests, die ausschliesslich die Logik in `shared/`
 * prüfen. Die ist damit hervorragend abgedeckt. Was NIRGENDS geprüft
 * wurde: ob eine Komponente überhaupt rendert, ob ein Knopf an der
 * richtigen Mutation hängt, ob der Lade- oder Fehlerzweig erscheint.
 *
 * Der Beleg dafür sind die letzten Fehler, die aufgefallen sind: ein zu
 * unscheinbarer Knopf, ein Briefing ohne Weg zur Heute-Ansicht, eine
 * Reise, die auf einer Seite anders hiess als auf der anderen. Alle drei
 * hat ein Mensch auf einem Bildschirmfoto gesehen, kein Test.
 *
 * Der zweite Durchlauf («ui») rendert deshalb echte Komponenten in jsdom.
 * Er ersetzt die Playwright-Prüfungen nicht – die sehen den echten
 * Browser –, aber er ist schnell genug, um bei jedem Lauf mitzugehen.
 */
export default defineConfig({
  root: templateRoot,
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "logik",
          environment: "node",
          include: ["server/**/*.test.ts", "server/**/*.spec.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "ui",
          environment: "jsdom",
          include: ["client/src/**/*.test.tsx"],
          setupFiles: ["client/src/test/setup.ts"],
          // Ohne das teilen sich die Testdateien einen jsdom und damit
          // localStorage und Zwischenspeicher – ein Test würde dann den
          // nächsten beeinflussen, je nach Reihenfolge.
          isolate: true,
        },
      },
    ],
  },
});
