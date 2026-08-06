import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Nach der Aufteilung von `routers.ts` (#331) gibt es eine neue Art,
 * still zu scheitern: Ein Modul entsteht, wird aber nie eingehängt. Der
 * Client bekommt dann «No procedure found» – und man sucht den Fehler in
 * der Datenbank, weil die Datei ja da ist und übersetzt.
 *
 * tsc merkt davon nichts: Eine nicht importierte Datei ist kein Fehler.
 */
const ROOT = join(import.meta.dirname, "..");
const DIR = join(ROOT, "server", "routers");

describe("Router-Module", () => {
  const modules = readdirSync(DIR)
    .filter(name => name.endsWith(".ts") && !name.startsWith("_"))
    .map(name => name.replace(/\.ts$/, ""));

  it("es gibt überhaupt welche", () => {
    expect(modules.length).toBeGreaterThan(5);
  });

  it("jedes Modul ist in routers.ts eingehängt", () => {
    const index = readFileSync(join(ROOT, "server", "routers.ts"), "utf8");
    for (const mod of modules) {
      expect(index).toContain(`from "./routers/${mod}"`);
      // Importieren allein genügt nicht – es muss auch hineingelegt sein.
      expect(index).toContain(`...${mod}Routers,`);
    }
  });

  it("jedes Modul exportiert genau den erwarteten Namen", () => {
    for (const mod of modules) {
      const text = readFileSync(join(DIR, `${mod}.ts`), "utf8");
      expect(text).toContain(`export const ${mod}Routers = {`);
    }
  });

  it("kein Modul greift an `_shared` vorbei auf den Nachbarn zu", () => {
    // Die Module sollen sich nicht gegenseitig importieren; wer etwas
    // gemeinsam braucht, legt es in `_shared.ts`. Sonst entsteht genau
    // das Geflecht zurück, das die Aufteilung aufgelöst hat.
    for (const mod of modules) {
      const text = readFileSync(join(DIR, `${mod}.ts`), "utf8");
      for (const other of modules) {
        if (other === mod) continue;
        expect(text).not.toContain(`from "./${other}"`);
      }
    }
  });
});
