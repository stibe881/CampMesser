import { describe, expect, it } from "vitest";
import {
  CALENDAR_TOKEN_LENGTH,
  calendarFeedPath,
  calendarFeedUrl,
  calendarWebcalUrl,
  isCalendarToken,
} from "@shared/calendarFeed";

/**
 * Das Kalender-Abo (#377).
 *
 * WAS HIER SCHIEFGEHEN KANN, ohne dass man es merkt: Der Schlüssel in der
 * Adresse IST die Berechtigung – Kalender-Programme können sich nicht
 * anmelden. Eine zu lockere Prüfung macht aus dem offenen Endpunkt eine
 * Einladung zum Herumprobieren; eine zu strenge lässt den eigenen Link
 * ins Leere laufen, und niemand versteht, warum der Kalender leer bleibt.
 */
describe("isCalendarToken", () => {
  it("nimmt einen nanoid-Schlüssel in der benutzten Länge", () => {
    expect(isCalendarToken("V1StGXR8_Z5jdHi6B-myT")).toBe(true);
    expect(isCalendarToken("a".repeat(CALENDAR_TOKEN_LENGTH))).toBe(true);
  });

  it("lehnt ab, was keiner sein kann", () => {
    expect(isCalendarToken("")).toBe(false);
    expect(isCalendarToken("zu-kurz")).toBe(false);
    expect(isCalendarToken("a".repeat(64))).toBe(false);
    // Pfad-Trennzeichen und Punkte gehören nie in einen Schlüssel – sonst
    // liesse sich über die Adresse aus dem Verzeichnis hinauslaufen.
    expect(isCalendarToken("../../etc/passwd")).toBe(false);
    expect(isCalendarToken("abcdefghijklmnop.ics")).toBe(false);
    expect(isCalendarToken(null)).toBe(false);
    expect(isCalendarToken(42)).toBe(false);
  });
});

describe("Adressen des Abos", () => {
  const token = "V1StGXR8_Z5jdHi6B-myT";

  it("der Pfad endet auf .ics – daran erkennen Kalender die Datei", () => {
    expect(calendarFeedPath(token)).toBe(`/api/kalender/${token}.ics`);
  });

  it("baut eine vollständige Adresse ohne doppelten Schrägstrich", () => {
    expect(calendarFeedUrl("https://meinreisekompass.ch", token)).toBe(
      `https://meinreisekompass.ch/api/kalender/${token}.ics`
    );
    expect(calendarFeedUrl("https://meinreisekompass.ch/", token)).toBe(
      `https://meinreisekompass.ch/api/kalender/${token}.ics`
    );
  });

  it("webcal:// ist dieselbe Adresse mit anderem Vorspann", () => {
    // Ein Klick darauf öffnet die Kalender-App und fragt «abonnieren?»,
    // statt die Datei herunterzuladen.
    expect(calendarWebcalUrl("https://meinreisekompass.ch", token)).toBe(
      `webcal://meinreisekompass.ch/api/kalender/${token}.ics`
    );
    expect(calendarWebcalUrl("http://localhost:3000", token)).toBe(
      `webcal://localhost:3000/api/kalender/${token}.ics`
    );
  });
});
