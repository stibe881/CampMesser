import { describe, expect, it } from "vitest";
import { changelog } from "../client/src/data/changelog";
import { LATEST_CHANGELOG_ID } from "../client/src/data/changelogMeta";

/**
 * Die Meta-Datei nennt die Id des neuesten Changelog-Blocks, damit der
 * Start-Dialog «gibt es etwas Neues?» beantworten kann, OHNE die gegen
 * 280 kB grosse Changelog-Datei zu laden. Der Preis dafür ist ein zweiter
 * Handgriff beim Pflegen – dieser Test macht daraus einen roten Lauf statt
 * eines stillen Fehlers: Wer oben einen Block einfügt und die Id vergisst,
 * bekäme sonst den Hinweis nie zu sehen.
 */
describe("changelogMeta", () => {
  it("nennt die Id des obersten Blocks", () => {
    expect(changelog.length).toBeGreaterThan(0);
    expect(LATEST_CHANGELOG_ID).toBe(changelog[0].id);
  });

  it("hält die Blöcke absteigend sortiert (Id-Vergleich genügt)", () => {
    const ids = changelog.map(block => block.id);
    const sorted = [...ids].sort().reverse();
    expect(ids).toEqual(sorted);
  });

  it("vergibt jede Id nur einmal", () => {
    const ids = changelog.map(block => block.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
