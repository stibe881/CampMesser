import { describe, expect, it } from "vitest";
import { changelog } from "../client/src/data/changelog";
import { changelogArchive } from "../client/src/data/changelogArchive";
import { LATEST_CHANGELOG_ID } from "../client/src/data/changelogMeta";

/**
 * Die Meta-Datei nennt die Id des neuesten Changelog-Blocks, damit der
 * Start-Dialog «gibt es etwas Neues?» beantworten kann, OHNE die grosse
 * Changelog-Datei zu laden. Der Preis dafür ist ein zweiter Handgriff beim
 * Pflegen – dieser Test macht daraus einen roten Lauf statt eines stillen
 * Fehlers: Wer oben einen Block einfügt und die Id vergisst, bekäme sonst
 * den Hinweis nie zu sehen.
 *
 * Seit #535 ist das Changelog zweigeteilt: `changelog.ts` trägt nur die
 * neusten Blöcke, alles Ältere liegt im `changelogArchive.ts`, das erst
 * auf «Ältere anzeigen» geladen wird. Auch diese Teilung ist ein
 * Pflege-Handgriff – die Tests hier wachen darüber.
 */
describe("changelogMeta", () => {
  it("nennt die Id des obersten Blocks", () => {
    expect(changelog.length).toBeGreaterThan(0);
    expect(LATEST_CHANGELOG_ID).toBe(changelog[0].id);
  });

  it("hält die Blöcke absteigend sortiert (Id-Vergleich genügt)", () => {
    const ids = [...changelog, ...changelogArchive].map(block => block.id);
    const sorted = [...ids].sort().reverse();
    expect(ids).toEqual(sorted);
  });

  it("vergibt jede Id nur einmal – über beide Dateien hinweg", () => {
    const ids = [...changelog, ...changelogArchive].map(block => block.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("hält den aktuellen Teil klein: höchstens drei Blöcke (#535)", () => {
    // Mehr als drei? Dann die ältesten UNVERÄNDERT zuoberst ins Archiv
    // schieben – der aktuelle Teil wird beim App-Start geladen, das
    // Archiv nur auf «Ältere anzeigen».
    expect(changelog.length).toBeLessThanOrEqual(3);
    expect(changelogArchive.length).toBeGreaterThan(0);
  });
});
