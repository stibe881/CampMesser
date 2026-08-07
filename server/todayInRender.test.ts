import { describe, expect, it } from "vitest";
import { readFileSync, globSync } from "node:fs";
import { join } from "node:path";

/**
 * Die Rückfallsperre zu #373/#375: kein `todayIso()` im Rumpf einer
 * Komponente.
 *
 * DER FEHLER, DEN DAS BEHEBT, ist zweimal passiert und beide Male
 * unsichtbar geblieben – beim App-Icon-Zähler (#373) und im
 * Widget-Abgleich (#375). Er sieht so aus:
 *
 *     function Irgendwas() {
 *       const today = todayIso();   // ← einmal beim Zeichnen, dann nie mehr
 *
 * Das stimmt, solange die Komponente neu gezeichnet wird. Neu gezeichnet
 * wird sie, wenn sich Zustand oder Abfragedaten ändern – und TanStack
 * Query gibt bei gleichem Inhalt DASSELBE Objekt zurück, löst also
 * nichts aus. In der nativen App, deren WebView beim Weglegen des Handys
 * nicht entladen wird, lebt eine Seite tagelang. Der Tag von Montag gilt
 * dann am Donnerstag weiter.
 *
 * `useTodayIso()` liefert denselben Text, dreht sich aber um Mitternacht
 * und bei jeder Rückkehr in die App weiter.
 *
 * WAS ERLAUBT BLEIBT: `todayIso()` INNERHALB einer Funktion – ein
 * Klick-Handler, ein Effekt, ein `useMemo`-Rumpf laufen zum Zeitpunkt
 * des Ereignisses und lesen den Tag dann frisch. Erkannt wird deshalb
 * nur der Einzug von genau zwei Leerzeichen: die oberste Ebene eines
 * Komponenten-Rumpfs.
 */
const ROOT = join(import.meta.dirname, "..");

/** `  const irgendwas = todayIso();` auf Komponenten-Ebene. */
const RENDER_LEVEL = /^ {2}const \w+ = todayIso\(\);$/m;

function components(): string[] {
  return globSync("client/src/**/*.tsx", { cwd: ROOT }).filter(
    file => !file.includes(".test.")
  );
}

describe("Kein eingefrorener Tag im Zeichnen", () => {
  it("Komponenten holen den Tag über useTodayIso()", () => {
    const offenders = components().filter(file =>
      RENDER_LEVEL.test(readFileSync(join(ROOT, file), "utf8"))
    );
    expect(offenders).toEqual([]);
  });

  it("der Haken selbst ist da und hängt an einem Wecker", () => {
    const text = readFileSync(
      join(ROOT, "client", "src", "lib", "useTodayIso.ts"),
      "utf8"
    );
    expect(text).toContain("export function useTodayIso");
    // Ohne diese drei Wege wäre der Haken nur eine teurere Schreibweise
    // für `todayIso()`.
    expect(text).toContain("msUntilNextLocalDay");
    expect(text).toContain("visibilitychange");
    expect(text).toContain("focus");
  });
});
