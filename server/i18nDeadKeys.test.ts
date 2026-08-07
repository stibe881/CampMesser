import { describe, expect, it } from "vitest";
import { readFileSync, globSync } from "node:fs";
import { join } from "node:path";

/**
 * Übersetzungs-Schlüssel, die niemand mehr benutzt (#375).
 *
 * WAS DER COMPILER SCHON KANN: Seit #50 sind `fr`, `it` und `en` mit
 * `: Translation` typisiert. Ein FEHLENDER Schlüssel ist damit ein
 * Übersetzungsfehler beim Bauen – da kommt nichts durch.
 *
 * WAS ER NICHT KANN: das Gegenteil. Ein Schlüssel, den keine Zeile mehr
 * liest, bleibt in ALLEN VIER Paketen stehen und stört niemanden. Beim
 * Umbau der Kopfzeile (#374) waren es auf einen Schlag drei
 * (`shell.languageMenu`, `profile.historyTitle`,
 * `profile.historyToggleAria`) – gefunden von Hand, weil ich zufällig
 * hingeschaut habe. Bei vier Sprachen ist jeder tote Schlüssel vier
 * Zeilen, die jemand pflegt, übersetzt und beim Lesen mitdenkt.
 *
 * WIE GESUCHT WIRD, und wo die Grenze liegt: Der Test sammelt die Namen
 * aller Schlüssel aus `de.ts` und prüft, ob der Name IRGENDWO sonst im
 * Quelltext vorkommt. Das ist absichtlich grob:
 *
 *   – Es findet nur, was NIRGENDS mehr steht. Ein Name, der in einer
 *     anderen Gruppe weiterlebt (`historyTitle` gibt es auch im
 *     Gewitter-Modul), gilt als benutzt. Ein Pfad-genauer Test müsste
 *     `const tt = t.thunder` und ähnliche Abkürzungen auflösen – das
 *     wäre eine halbe Typprüfung und würde bei jedem Umbau falsch
 *     anschlagen.
 *   – Dafür gibt es keine falschen Treffer, und genau darauf kommt es
 *     an: Ein Test, der grundlos meckert, wird abgeschaltet.
 *
 * Ein Fund heisst deshalb immer: von Hand nachschauen und in allen vier
 * Paketen löschen.
 */
const ROOT = join(import.meta.dirname, "..");

/**
 * Namen, die es im Wörterbuch gibt, ohne dass sie im Quelltext stehen
 * müssen – mit Begründung, warum das in Ordnung ist.
 */
const ALLOWED = new Set<string>([
  // Die vier Sprachpakete selbst (LANGUAGES kommt aus shared/i18n.ts).
  "de",
  "fr",
  "it",
  "en",
]);

/** Alle Schlüssel-Namen aus dem deutschen Paket (Gruppen eingeschlossen). */
function germanKeys(): string[] {
  const text = readFileSync(
    join(ROOT, "client", "src", "i18n", "de.ts"),
    "utf8"
  );
  const keys = new Set<string>();
  for (const match of text.matchAll(/^\s+([A-Za-z_$][\w$]*)\s*:/gm)) {
    keys.add(match[1]);
  }
  return Array.from(keys);
}

/**
 * Jedes Wort, das im Quelltext ausserhalb der Sprachpakete vorkommt.
 * Als Menge, damit die Prüfung über tausend Schlüssel nicht Minuten
 * dauert.
 */
function usedWords(): Set<string> {
  const files = globSync(
    ["client/src/**/*.{ts,tsx}", "shared/**/*.ts", "server/**/*.ts"],
    { cwd: ROOT }
  ).filter(file => !file.startsWith("client/src/i18n/"));
  const words = new Set<string>();
  for (const file of files) {
    const text = readFileSync(join(ROOT, file), "utf8");
    for (const match of text.matchAll(/[A-Za-z_$][\w$]*/g)) {
      words.add(match[0]);
    }
  }
  return words;
}

describe("Keine toten Übersetzungs-Schlüssel", () => {
  it("jeder Schlüssel aus de.ts kommt im Quelltext vor", () => {
    const words = usedWords();
    const dead = germanKeys()
      .filter(key => !ALLOWED.has(key))
      .filter(key => !words.has(key))
      .sort();
    expect(dead).toEqual([]);
  });
});
