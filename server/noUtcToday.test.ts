import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { globSync } from "node:fs";

/**
 * Die Rückfallsperre zu #333.
 *
 * `new Date().toISOString().slice(0, 10)` sieht harmlos aus und ist die
 * naheliegendste Art, «heute» als ISO-Tag zu schreiben. Sie ist an 24
 * Stellen dieses Projekts gestanden und war an allen 24 falsch: Zwischen
 * Mitternacht und zwei Uhr Ortszeit liefert sie den Vortag.
 *
 * Ein Test, der den Quelltext liest, ist hier das richtige Werkzeug –
 * tsc kann den Unterschied nicht sehen, und ein Laufzeit-Test würde ihn
 * nur in den zwei betroffenen Nachtstunden zeigen.
 *
 * ERLAUBT BLEIBT `toISOString().slice(0, 10)` auf einem Datum, das aus
 * einem ISO-Tag ENTSTANDEN ist (`Date.parse("…T00:00:00Z")`, `Date.UTC`):
 * Dort sind Hin- und Rückweg beide UTC und heben sich auf. Deshalb greift
 * die Sperre nur bei `new Date()` ohne Argument.
 */
const ROOT = join(import.meta.dirname, "..");

const FORBIDDEN = "new Date().toISOString().slice(0, 10)";

function sources(): string[] {
  return (
    globSync(["client/src/**/*.{ts,tsx}", "shared/**/*.ts", "server/**/*.ts"], {
      cwd: ROOT,
    })
      .filter(file => !file.includes(".test."))
      // `shared/localDate.ts` erklärt den Fehler in seinem Kopfkommentar und
      // muss die Zeile dafür zitieren dürfen.
      .filter(file => !file.endsWith("shared/localDate.ts"))
  );
}

describe("Kein «heute» über UTC", () => {
  it("die Quelldateien benutzen todayIso() statt toISOString()", () => {
    const offenders = sources().filter(file =>
      readFileSync(join(ROOT, file), "utf8").includes(FORBIDDEN)
    );
    expect(offenders).toEqual([]);
  });

  it("der Helfer ist da, wo Client, Server und shared ihn finden", () => {
    const text = readFileSync(join(ROOT, "shared", "localDate.ts"), "utf8");
    expect(text).toContain("export function localDay");
    expect(text).toContain("export function todayIso");
  });
});
