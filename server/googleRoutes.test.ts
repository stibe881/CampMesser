import { describe, expect, it } from "vitest";
import {
  GOOGLE_ROUTES_FIELD_MASK,
  MAX_TRAFFIC_LEAD_MS,
  driveTimeCacheKey,
  googleRouteBody,
  nextOccurrenceMs,
  parseGoogleDuration,
  parseGoogleRoute,
  decodePolyline,
  googleTrafficBody,
  levelAtIndex,
  parseSpeedIntervals,
  trafficAtPoints,
  GOOGLE_ROUTES_TRAFFIC_FIELD_MASK,
  trafficUsableAt,
  type LatLon,
} from "@shared/googleRoutes";

const HOME: LatLon = { lat: 47.3769, lon: 8.5417 };
const SPOT: LatLon = { lat: 46.948, lon: 7.4474 };

describe("Fahrzeiten von Google", () => {
  it("fragt nach einer Autofahrt mit Verkehr", () => {
    const body = googleRouteBody(HOME, SPOT) as {
      travelMode: string;
      routingPreference: string;
      origin: { location: { latLng: { latitude: number; longitude: number } } };
    };
    expect(body.travelMode).toBe("DRIVE");
    expect(body.routingPreference).toBe("TRAFFIC_AWARE");
    // Google will latitude/longitude benannt – nicht als Paar wie OSRM
    expect(body.origin.location.latLng).toEqual({
      latitude: 47.3769,
      longitude: 8.5417,
    });
  });

  it("holt nur die zwei Zahlen, die wir brauchen", () => {
    // Die Feldmaske ist auch die Rechnung: keine Geometrie, keine Hinweise
    expect(GOOGLE_ROUTES_FIELD_MASK).toBe(
      "routes.duration,routes.distanceMeters"
    );
    expect(GOOGLE_ROUTES_FIELD_MASK).not.toContain("polyline");
  });

  it("schickt die Abfahrtszeit nur mit, wenn eine da ist", () => {
    expect(googleRouteBody(HOME, SPOT)).not.toHaveProperty("departureTime");
    expect(googleRouteBody(HOME, SPOT, null)).not.toHaveProperty(
      "departureTime"
    );
    const withTime = googleRouteBody(HOME, SPOT, Date.UTC(2026, 7, 7, 15, 0));
    expect(withTime.departureTime).toBe("2026-08-07T15:00:00.000Z");
  });

  it("liest «5466s» als Sekunden", () => {
    expect(parseGoogleDuration("5466s")).toBe(5466);
    expect(parseGoogleDuration("5466.5s")).toBeCloseTo(5466.5, 1);
    expect(parseGoogleDuration(5466)).toBe(5466);
    // Ohne «s» ist es keine Google-Dauer – lieber null als NaN
    expect(parseGoogleDuration("5466")).toBeNull();
    expect(parseGoogleDuration(null)).toBeNull();
  });

  it("liest Fahrzeit und Strecke aus der Antwort", () => {
    const value = parseGoogleRoute({
      routes: [{ duration: "8123s", distanceMeters: 128456 }],
    })!;
    expect(value.durationS).toBe(8123);
    expect(value.distanceM).toBe(128456);
  });

  it("gibt bei kaputten Antworten null, statt etwas zu erfinden", () => {
    expect(parseGoogleRoute(null)).toBeNull();
    expect(parseGoogleRoute({ routes: [] })).toBeNull();
    expect(parseGoogleRoute({ routes: [{ distanceMeters: 100 }] })).toBeNull();
    expect(parseGoogleRoute({ routes: [{ duration: "0s" }] })).toBeNull();
  });

  it("nimmt die nächste Uhrzeit: heute, sonst morgen", () => {
    const monday10 = new Date(2026, 7, 3, 10, 0, 0, 0).getTime();
    // 17:00 steht heute noch bevor
    const evening = nextOccurrenceMs("17:00", monday10)!;
    expect(new Date(evening).getDate()).toBe(3);
    expect(new Date(evening).getHours()).toBe(17);
    // 07:30 ist vorbei – also morgen
    const morning = nextOccurrenceMs("07:30", monday10)!;
    expect(new Date(morning).getDate()).toBe(4);
    expect(new Date(morning).getHours()).toBe(7);
    expect(new Date(morning).getMinutes()).toBe(30);
  });

  it("weist unmögliche Uhrzeiten ab", () => {
    const now = Date.now();
    expect(nextOccurrenceMs("25:00", now)).toBeNull();
    expect(nextOccurrenceMs("12:99", now)).toBeNull();
    expect(nextOccurrenceMs("morgen", now)).toBeNull();
  });

  it("fragt den Verkehr nur, solange Google ihn kennen kann", () => {
    const now = Date.UTC(2026, 7, 4, 12, 0);
    expect(trafficUsableAt(now + 3 * 60 * 60 * 1000, now)).toBe(true);
    // Vergangenheit: Google weist die Anfrage zurück
    expect(trafficUsableAt(now - 60 * 1000, now)).toBe(false);
    // In drei Monaten weiss auch Google nichts
    expect(trafficUsableAt(now + MAX_TRAFFIC_LEAD_MS + 1000, now)).toBe(false);
    expect(trafficUsableAt(null, now)).toBe(false);
  });

  it("erkennt dieselbe Fahrt trotz GPS-Zittern wieder", () => {
    const at = Date.UTC(2026, 7, 7, 15, 3);
    const a = driveTimeCacheKey(HOME, SPOT, at);
    const b = driveTimeCacheKey(
      { lat: 47.37692, lon: 8.54171 },
      { lat: 46.94802, lon: 7.44739 },
      at + 4 * 60 * 1000 // vier Minuten später ist derselbe Verkehr
    );
    expect(a).toBe(b);
    // Eine Stunde später ist er es nicht mehr
    expect(driveTimeCacheKey(HOME, SPOT, at + 60 * 60 * 1000)).not.toBe(a);
    // Ohne Abfahrtszeit ist es eine andere Frage als mit
    expect(driveTimeCacheKey(HOME, SPOT, null)).not.toBe(a);
  });

  describe("Stau punktgenau", () => {
    it("fragt die Verkehrslage auf der Linie mit an", () => {
      const body = googleTrafficBody(
        { lat: 47.4, lon: 8.5 },
        { lat: 46.0, lon: 8.9 }
      );
      expect(body.extraComputations).toEqual(["TRAFFIC_ON_POLYLINE"]);
      // Ohne TRAFFIC_AWARE liefert Google gar keine Einstufung
      expect(body.routingPreference).toBe("TRAFFIC_AWARE");
      // Grobe Linie genügt: Wir tasten acht Punkte ab, kein Navi
      expect(body.polylineQuality).toBe("OVERVIEW");
    });

    it("verlangt Linie und Abschnitte in der Feldmaske", () => {
      // Die Abschnitte zeigen auf Indizes IN der Linie – eines ohne das
      // andere ist wertlos
      expect(GOOGLE_ROUTES_TRAFFIC_FIELD_MASK).toContain(
        "routes.polyline.encodedPolyline"
      );
      expect(GOOGLE_ROUTES_TRAFFIC_FIELD_MASK).toContain(
        "routes.travelAdvisory.speedReadingIntervals"
      );
    });

    it("entschlüsselt Googles Streckenzug", () => {
      // Beispiel aus Googles eigener Beschreibung des Verfahrens
      const points = decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@");
      expect(points).toHaveLength(3);
      expect(points[0].lat).toBeCloseTo(38.5, 4);
      expect(points[0].lon).toBeCloseTo(-120.2, 4);
      expect(points[1].lat).toBeCloseTo(40.7, 4);
      expect(points[1].lon).toBeCloseTo(-120.95, 4);
      expect(points[2].lat).toBeCloseTo(43.252, 4);
      expect(points[2].lon).toBeCloseTo(-126.453, 4);
    });

    it("kommt mit einer leeren Linie zurecht", () => {
      expect(decodePolyline("")).toEqual([]);
    });

    it("liest die Abschnitte", () => {
      const intervals = parseSpeedIntervals({
        routes: [
          {
            travelAdvisory: {
              speedReadingIntervals: [
                { endPolylinePointIndex: 3, speed: "NORMAL" },
                {
                  startPolylinePointIndex: 3,
                  endPolylinePointIndex: 6,
                  speed: "TRAFFIC_JAM",
                },
              ],
            },
          },
        ],
      });
      expect(intervals).toHaveLength(2);
      // Google lässt den Startindex bei 0 weg – das darf nicht NaN geben
      expect(intervals[0].start).toBe(0);
      expect(intervals[1].level).toBe("jam");
    });

    it("lässt unbekannte Einstufungen weg", () => {
      const intervals = parseSpeedIntervals({
        routes: [
          {
            travelAdvisory: {
              speedReadingIntervals: [{ speed: "SPEED_UNSPECIFIED" }],
            },
          },
        ],
      });
      expect(intervals).toEqual([]);
    });

    it("kommt mit einer Antwort ohne Verkehrsangaben zurecht", () => {
      expect(parseSpeedIntervals(null)).toEqual([]);
      expect(parseSpeedIntervals({ routes: [] })).toEqual([]);
      expect(parseSpeedIntervals({ routes: [{}] })).toEqual([]);
    });

    it("findet die Einstufung an einem Index", () => {
      const intervals = [
        { start: 0, end: 2, level: "normal" as const },
        { start: 2, end: 5, level: "jam" as const },
      ];
      expect(levelAtIndex(intervals, 1)).toBe("normal");
      expect(levelAtIndex(intervals, 4)).toBe("jam");
      // Ausserhalb aller Abschnitte gilt «normal» – keine Angabe ist kein Stau
      expect(levelAtIndex(intervals, 99)).toBe("normal");
      expect(levelAtIndex([], 0)).toBe("normal");
    });

    it("ordnet unsere Punkte dem nächstgelegenen Linien-Punkt zu", () => {
      // Unsere Stützstellen liegen auf der OSRM-Route, Googles Linie setzt
      // ihre Punkte anders – zugeordnet wird über die Nähe
      const polyline = [
        { lat: 47.0, lon: 8.0 },
        { lat: 46.5, lon: 8.2 },
        { lat: 46.0, lon: 8.4 },
      ];
      const intervals = [{ start: 1, end: 2, level: "jam" as const }];
      const levels = trafficAtPoints(
        [
          { lat: 46.99, lon: 8.01 },
          { lat: 46.02, lon: 8.39 },
        ],
        polyline,
        intervals
      );
      expect(levels).toEqual(["normal", "jam"]);
    });

    it("meldet «normal», wenn keine Linie da ist", () => {
      expect(trafficAtPoints([{ lat: 47, lon: 8 }], [], [])).toEqual([
        "normal",
      ]);
    });
  });
});
