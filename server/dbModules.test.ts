import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Dieselbe Sperre wie für die Router-Module (#331), aus demselben Grund:
 * Ein Modul, das entsteht und nie herausgereicht wird, ist für tsc kein
 * Fehler – aber `db.neueFunktion` gibt es dann zur Laufzeit nicht, und
 * man sucht in der Datenbank statt in der Barrel-Datei.
 */
const ROOT = join(import.meta.dirname, "..");
const DIR = join(ROOT, "server", "db");

describe("Datenbank-Module", () => {
  const modules = readdirSync(DIR)
    .filter(name => name.endsWith(".ts") && !name.startsWith("_"))
    .map(name => name.replace(/\.ts$/, ""));

  it("es gibt überhaupt welche", () => {
    expect(modules.length).toBeGreaterThan(5);
  });

  it("jedes Modul wird von db.ts weitergereicht", () => {
    const index = readFileSync(join(ROOT, "server", "db.ts"), "utf8");
    for (const mod of modules) {
      expect(index).toContain(`export * from "./db/${mod}"`);
    }
  });

  it("die Verbindung kommt aus einer Hand", () => {
    // Ein zweites `drizzle(...)` irgendwo im Baum wäre ein zweiter Pool –
    // und auf einem Webhosting mit begrenzten Verbindungen der schnellste
    // Weg zu «too many connections».
    for (const mod of modules) {
      const text = readFileSync(join(DIR, `${mod}.ts`), "utf8");
      expect(text).not.toContain("drizzle(");
    }
  });

  it("kein Modul greift an `_shared` vorbei auf den Nachbarn zu", () => {
    for (const mod of modules) {
      const text = readFileSync(join(DIR, `${mod}.ts`), "utf8");
      for (const other of modules) {
        if (other === mod) continue;
        expect(text).not.toContain(`from "./${other}"`);
      }
    }
  });
});
