import { describe, expect, it } from "vitest";
import {
  GOOGLE_ROUTES_FIELD_MASK,
  MAX_TRAFFIC_LEAD_MS,
  driveTimeCacheKey,
  googleRouteBody,
  nextOccurrenceMs,
  parseGoogleDuration,
  parseGoogleRoute,
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
});
