import { describe, expect, it } from "vitest";
import { countByMessage, parseClientErrorLog } from "@shared/clientErrorLog";

/**
 * Das Absturz-Protokoll (#352).
 *
 * WORAUF ES ANKOMMT: Die Datei wird bei 1 MB in der Mitte abgeschnitten,
 * die erste Zeile danach ist also regelmässig ein halber Datensatz. Wenn
 * die Ansicht daran scheitert, sieht man ausgerechnet dann nichts, wenn
 * viel passiert ist.
 */
const line = (at: string, message: string) =>
  JSON.stringify({
    at,
    message,
    url: "/heute",
    stack: "",
    componentStack: "",
    userAgent: "",
  });

describe("Absturz-Protokoll", () => {
  it("neueste Meldung zuerst", () => {
    const text = [
      line("2026-08-01T10:00:00.000Z", "alt"),
      line("2026-08-06T10:00:00.000Z", "neu"),
    ].join("\n");
    expect(parseClientErrorLog(text).map(e => e.message)).toEqual([
      "neu",
      "alt",
    ]);
  });

  it("eine abgeschnittene Zeile lässt den Rest stehen", () => {
    const text = [
      '{"at":"2026-08-0',
      line("2026-08-06T10:00:00.000Z", "ganz"),
    ].join("\n");
    const entries = parseClientErrorLog(text);
    expect(entries).toHaveLength(1);
    expect(entries[0].message).toBe("ganz");
  });

  it("ohne Zeitstempel kein Eintrag", () => {
    // «Wann» ist die eine Angabe, ohne die eine Meldung nichts nützt.
    const text = JSON.stringify({ message: "irgendwas" });
    expect(parseClientErrorLog(text)).toEqual([]);
  });

  it("die Grenze wird eingehalten", () => {
    const text = Array.from({ length: 50 }, (_, i) =>
      line(`2026-08-06T10:00:${String(i).padStart(2, "0")}.000Z`, `m${i}`)
    ).join("\n");
    expect(parseClientErrorLog(text, 5)).toHaveLength(5);
    expect(parseClientErrorLog(text, 5)[0].message).toBe("m49");
  });

  it("gleiche Meldungen werden gezählt", () => {
    // Eine Absturzschleife sieht in einer reinen Liste aus wie dreissig
    // verschiedene Probleme.
    const text = [
      line("2026-08-06T10:00:00.000Z", "Boom"),
      line("2026-08-06T10:00:01.000Z", "Boom"),
      line("2026-08-06T10:00:02.000Z", "Anderes"),
    ].join("\n");
    expect(countByMessage(parseClientErrorLog(text))).toEqual([
      { message: "Boom", count: 2 },
      { message: "Anderes", count: 1 },
    ]);
  });

  it("leeres Protokoll ist kein Fehler", () => {
    expect(parseClientErrorLog("")).toEqual([]);
  });
});
