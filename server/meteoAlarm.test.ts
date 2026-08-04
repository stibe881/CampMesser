import { describe, expect, it } from "vitest";
import { LANGUAGES } from "@shared/i18n";
import {
  ATTRIBUTION,
  EVENT_LABELS,
  METEOALARM_FEED_URL,
  eventLabel,
  isPushWorthy,
  isWarningActive,
  parseMeteoAlarmFeed,
  parsePolygon,
  pointInRing,
  severityRank,
  severityToAlert,
  warningCoversPoint,
  warningKey,
  warningsForPoint,
  warningsKey,
  type OfficialWarning,
} from "@shared/meteoAlarm";

/** Ein Quadrat um Bern herum, im Format des Feeds (lat,lon). */
const SQUARE = "46.9,7.4 46.9,7.5 47.0,7.5 47.0,7.4 46.9,7.4";

const feedEntry = (over: Partial<Record<string, string>> = {}) => {
  const f = {
    identifier: "2.49.0.0.756.0.CH.test1",
    event: "Heavy thunderstorm",
    areaDesc: "Bern",
    severity: "Severe",
    onset: "2026-08-04T18:00:00+00:00",
    expires: "2026-08-04T20:00:00+00:00",
    status: "Actual",
    message_type: "Alert",
    polygon: SQUARE,
    ...over,
  };
  return `<entry>
    <cap:polygon>${f.polygon}</cap:polygon>
    <cap:areaDesc>${f.areaDesc}</cap:areaDesc>
    <cap:event>${f.event}</cap:event>
    <cap:expires>${f.expires}</cap:expires>
    <cap:onset>${f.onset}</cap:onset>
    <cap:severity>${f.severity}</cap:severity>
    <cap:message_type>${f.message_type}</cap:message_type>
    <cap:status>${f.status}</cap:status>
    <cap:identifier>${f.identifier}</cap:identifier>
    <title>Orange Thunderstorm Warning issued for Switzerland - ${f.areaDesc}</title>
  </entry>`;
};

const feed = (...entries: string[]) =>
  `<?xml version="1.0" encoding="UTF-8"?><feed xmlns="http://www.w3.org/2005/Atom" xmlns:cap="urn:oasis:names:tc:emergency:cap:1.2">${entries.join("")}</feed>`;

const warning = (over: Partial<OfficialWarning> = {}): OfficialWarning => ({
  id: "test",
  event: "Heavy thunderstorm",
  areaDesc: "Bern",
  severity: "Severe",
  onset: "2026-08-04T18:00:00+00:00",
  expires: "2026-08-04T20:00:00+00:00",
  polygons: [
    [
      [46.9, 7.4],
      [46.9, 7.5],
      [47.0, 7.5],
      [47.0, 7.4],
    ],
  ],
  ...over,
});

describe("Amtliche Warnungen (MeteoAlarm)", () => {
  describe("Feed lesen", () => {
    it("liest einen Eintrag mit allen Feldern", () => {
      const [w] = parseMeteoAlarmFeed(feed(feedEntry()));
      expect(w.id).toBe("2.49.0.0.756.0.CH.test1");
      expect(w.event).toBe("Heavy thunderstorm");
      expect(w.areaDesc).toBe("Bern");
      expect(w.severity).toBe("Severe");
      expect(w.polygons).toHaveLength(1);
      expect(w.polygons[0]).toHaveLength(5);
      expect(w.polygons[0][0]).toEqual([46.9, 7.4]);
    });

    it("liest mehrere Einträge", () => {
      const parsed = parseMeteoAlarmFeed(
        feed(feedEntry({ identifier: "a" }), feedEntry({ identifier: "b" }))
      );
      expect(parsed.map(w => w.id)).toEqual(["a", "b"]);
    });

    it("lässt Testmeldungen und Übungen weg", () => {
      // Eine Übung darf niemandem den Abend verderben
      expect(parseMeteoAlarmFeed(feed(feedEntry({ status: "Test" })))).toEqual(
        []
      );
      expect(
        parseMeteoAlarmFeed(feed(feedEntry({ status: "Exercise" })))
      ).toEqual([]);
      expect(
        parseMeteoAlarmFeed(feed(feedEntry({ message_type: "Cancel" })))
      ).toEqual([]);
    });

    it("lässt Einträge ohne Kennung oder Gebiet weg", () => {
      // Ohne Gebiet lässt sich nicht sagen, ob es einen betrifft
      expect(parseMeteoAlarmFeed(feed(feedEntry({ identifier: "" })))).toEqual(
        []
      );
      expect(
        parseMeteoAlarmFeed(feed(feedEntry({ polygon: "46.9,7.4" })))
      ).toEqual([]);
    });

    it("kommt mit einem leeren oder kaputten Feed zurecht", () => {
      expect(parseMeteoAlarmFeed("")).toEqual([]);
      expect(parseMeteoAlarmFeed("<html>Fehler</html>")).toEqual([]);
      expect(parseMeteoAlarmFeed(feed())).toEqual([]);
    });

    it("überspringt kaputte Punkte statt die Warnung zu verwerfen", () => {
      const ring = parsePolygon("46.9,7.4 kaputt 47.0,7.5 x,y 47.0,7.4");
      expect(ring).toEqual([
        [46.9, 7.4],
        [47.0, 7.5],
        [47.0, 7.4],
      ]);
    });
  });

  describe("Betrifft mich das?", () => {
    it("erkennt einen Punkt im Warngebiet", () => {
      expect(warningCoversPoint(warning(), 46.95, 7.45)).toBe(true);
    });

    it("erkennt einen Punkt ausserhalb", () => {
      expect(warningCoversPoint(warning(), 47.5, 8.5)).toBe(false);
      expect(warningCoversPoint(warning(), 46.95, 7.9)).toBe(false);
    });

    it("prüft alle Ringe einer Warnung", () => {
      const two = warning({
        polygons: [
          [
            [46.9, 7.4],
            [46.9, 7.5],
            [47.0, 7.5],
          ],
          [
            [45.0, 9.0],
            [45.0, 9.2],
            [45.2, 9.2],
            [45.2, 9.0],
          ],
        ],
      });
      expect(warningCoversPoint(two, 45.1, 9.1)).toBe(true);
    });

    it("kommt mit einem entarteten Ring zurecht", () => {
      expect(pointInRing(46.95, 7.45, [])).toBe(false);
      expect(
        pointInRing(46.95, 7.45, [
          [46.9, 7.4],
          [46.9, 7.4],
        ])
      ).toBe(false);
    });
  });

  describe("Gültigkeit", () => {
    const now = Date.parse("2026-08-04T19:00:00Z");

    it("lässt eine laufende Warnung gelten", () => {
      expect(isWarningActive(warning(), now)).toBe(true);
    });

    it("verwirft eine abgelaufene Warnung", () => {
      expect(
        isWarningActive(warning({ expires: "2026-08-04T18:30:00+00:00" }), now)
      ).toBe(false);
    });

    it("behält eine Warnung ohne Ablaufzeit", () => {
      // Lieber eine Warnung zu viel als eine verschwiegene
      expect(isWarningActive(warning({ expires: "" }), now)).toBe(true);
    });
  });

  describe("Warnungen für einen Ort", () => {
    const now = Date.parse("2026-08-04T19:00:00Z");

    it("stellt die schärfste Warnung zuoberst", () => {
      // Wer «Gewitter» und «Hitze» hat, soll das Gewitter zuoberst sehen
      const list = warningsForPoint(
        [
          warning({ id: "hitze", severity: "Moderate", event: "Heat wave" }),
          warning({ id: "gewitter", severity: "Extreme" }),
        ],
        46.95,
        7.45,
        now
      );
      expect(list.map(w => w.id)).toEqual(["gewitter", "hitze"]);
    });

    it("lässt fremde Gebiete und Abgelaufenes weg", () => {
      const list = warningsForPoint(
        [
          warning({ id: "hier" }),
          warning({
            id: "anderswo",
            polygons: [
              [
                [45.0, 9.0],
                [45.0, 9.2],
                [45.2, 9.2],
              ],
            ],
          }),
          warning({ id: "vorbei", expires: "2026-08-04T18:00:00+00:00" }),
        ],
        46.95,
        7.45,
        now
      );
      expect(list.map(w => w.id)).toEqual(["hier"]);
    });

    it("liefert eine leere Liste, wenn nichts anliegt", () => {
      expect(warningsForPoint([], 46.95, 7.45, now)).toEqual([]);
    });
  });

  describe("Stufen", () => {
    it("ordnet die CAP-Stufen", () => {
      expect(severityRank("Extreme")).toBeGreaterThan(severityRank("Severe"));
      expect(severityRank("Severe")).toBeGreaterThan(severityRank("Moderate"));
      expect(severityRank("Moderate")).toBeGreaterThan(severityRank("Minor"));
      expect(severityRank("Unsinn")).toBe(0);
    });

    it("übersetzt sie in die Stufen der App", () => {
      expect(severityToAlert("Extreme")).toBe("gefahr");
      expect(severityToAlert("Severe")).toBe("gefahr");
      expect(severityToAlert("Moderate")).toBe("warnung");
      expect(severityToAlert("Minor")).toBe("info");
      expect(severityToAlert("")).toBe("info");
    });

    it("schickt nur ab «Severe» einen Push", () => {
      // Ein Push mitten in der Nacht muss etwas bedeuten
      expect(isPushWorthy(warning({ severity: "Extreme" }))).toBe(true);
      expect(isPushWorthy(warning({ severity: "Severe" }))).toBe(true);
      expect(isPushWorthy(warning({ severity: "Moderate" }))).toBe(false);
      expect(isPushWorthy(warning({ severity: "Minor" }))).toBe(false);
    });
  });

  describe("Benennung", () => {
    it("übersetzt bekannte Ereignisse", () => {
      expect(eventLabel("Heavy thunderstorm", "de")).toBe("Kräftiges Gewitter");
      expect(eventLabel("Heat wave", "fr")).toBe("Canicule");
    });

    it("reicht Unbekanntes unverändert durch", () => {
      // Lieber ein englisches Wort als eine verschwiegene Warnung
      expect(eventLabel("Sandstorm", "de")).toBe("Sandstorm");
    });

    it("benennt jedes bekannte Ereignis in allen vier Sprachen", () => {
      Object.keys(EVENT_LABELS).forEach(event => {
        LANGUAGES.forEach(lang =>
          expect(
            EVENT_LABELS[event][lang]?.trim().length,
            event
          ).toBeGreaterThan(0)
        );
      });
    });

    it("kennt die Ereignisse, die MeteoSchweiz wirklich sendet", () => {
      // Aus dem echten Feed am 4.8.2026 abgelesen
      [
        "Heavy thunderstorm",
        "Violent thunderstorm",
        "Widespread heavy thunderstorms possible",
        "Heat wave",
        "Extreme heat wave",
      ].forEach(event => expect(EVENT_LABELS[event], event).toBeDefined());
    });
  });

  describe("Schon gemeldet?", () => {
    it("hängt am CAP-Bezeichner", () => {
      expect(warningKey(warning({ id: "abc" }))).toBe("amtlich:abc");
    });

    it("ändert den Sammel-Schlüssel, sobald eine Warnung dazukommt", () => {
      const a = warningsKey([warning({ id: "1" })]);
      const b = warningsKey([warning({ id: "1" }), warning({ id: "2" })]);
      expect(a).not.toBe(b);
    });

    it("bleibt bei gleicher Lage gleich, egal in welcher Reihenfolge", () => {
      const a = warningsKey([warning({ id: "1" }), warning({ id: "2" })]);
      const b = warningsKey([warning({ id: "2" }), warning({ id: "1" })]);
      expect(a).toBe(b);
    });
  });

  it("nennt Herausgeber und Quelle", () => {
    // Die Lizenz verlangt die Angabe – ohne sie dürfen wir nichts zeigen
    expect(ATTRIBUTION.issuer).toBe("MeteoSchweiz");
    expect(ATTRIBUTION.source).toBe("MeteoAlarm");
    expect(ATTRIBUTION.url).toMatch(/^https:\/\//);
    expect(METEOALARM_FEED_URL).toMatch(/^https:\/\/feeds\.meteoalarm\.org\//);
  });
});
