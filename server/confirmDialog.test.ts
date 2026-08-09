import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Wächter gegen den Rückfall (#317).
 *
 * `window.confirm` ist bequem: eine Zeile, Antwort sofort. Genau deshalb
 * waren es 35 Stellen. Der Ersatz ist fast so kurz, aber wer ihn nicht
 * kennt, greift beim nächsten Löschen-Knopf wieder zum Browser-Dialog –
 * und niemand merkt es, weil er ja funktioniert. Nur eben in der Sprache
 * des Betriebssystems, mit «OK» statt «Löschen» und in der nativen App
 * mit «meinreisekompass.ch» darüber.
 *
 * Dieser Test liest den Client-Quelltext und lässt es nicht durch.
 */
const CLIENT = join(import.meta.dirname, "..", "client", "src");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(name) ? [full] : [];
  });
}

describe("Bestätigungen laufen über den App-Dialog", () => {
  it("kein window.confirm und kein blosses confirm() im Client", () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(CLIENT)) {
      // Der Ersatz selbst darf den alten Namen im erklärenden Text nennen.
      if (file.endsWith("ConfirmDialog.tsx")) continue;
      const text = readFileSync(file, "utf8");
      text.split("\n").forEach((line, i) => {
        // `onConfirm`, `confirmLabel`, `useConfirm` usw. sind erlaubt –
        // gesucht ist der AUFRUF der globalen Browser-Funktion.
        if (/(?<![\w.])(?:window\.)?confirm\s*\(/.test(line)) {
          offenders.push(`${file.slice(CLIENT.length + 1)}:${i + 1}`);
        }
      });
    }
    expect(offenders).toEqual([]);
  });

  it("auch kein window.alert oder window.prompt", () => {
    // Dieselbe Begründung; beide sind bisher nirgends benutzt und sollen
    // es bleiben.
    const offenders: string[] = [];
    for (const file of sourceFiles(CLIENT)) {
      const text = readFileSync(file, "utf8");
      if (/window\.(alert|prompt)\s*\(/.test(text)) {
        offenders.push(file.slice(CLIENT.length + 1));
      }
    }
    expect(offenders).toEqual([]);
  });
});
