/**
 * Geteilte Orte (#584): Der Parser übersetzt Teilen-Daten (Titel/Text/URL)
 * in Koordinaten. Die Fixtures entsprechen dem, was gängige Karten-Apps
 * tatsächlich in den Teilen-Dialog legen.
 */
import { describe, expect, it } from "vitest";
import { parseSharedPlace } from "../shared/sharedPlace";

describe("parseSharedPlace", () => {
  it("liest geo:-URIs mit Label", () => {
    const place = parseSharedPlace(
      null,
      null,
      "geo:0,0?q=47.0502,8.3093(Rigi Kulm)"
    );
    expect(place).toEqual({
      name: "Rigi Kulm",
      latitude: 47.0502,
      longitude: 8.3093,
    });
  });

  it("liest nackte geo:-URIs und nimmt den Titel als Namen", () => {
    const place = parseSharedPlace("Grillstelle", null, "geo:46.8,9.53");
    expect(place).toEqual({
      name: "Grillstelle",
      latitude: 46.8,
      longitude: 9.53,
    });
  });

  it("liest Google-Maps-Links mit /place/ und @-Koordinaten", () => {
    const place = parseSharedPlace(
      null,
      "https://www.google.com/maps/place/Camping+Aareggli/@46.685,7.716,17z"
    );
    expect(place).toEqual({
      name: "Camping Aareggli",
      latitude: 46.685,
      longitude: 7.716,
    });
  });

  it("bevorzugt den Pin aus dem !3d/!4d-Daten-Blob vor dem Ausschnitt", () => {
    const place = parseSharedPlace(
      null,
      null,
      "https://www.google.com/maps/place/X/@46.0,7.0,17z/data=!3m1!4b1!4m6!3m5!8m2!3d46.0207!4d7.7491"
    );
    expect(place?.latitude).toBe(46.0207);
    expect(place?.longitude).toBe(7.7491);
  });

  it("liest maps.google.com mit q=-Koordinaten", () => {
    const place = parseSharedPlace(
      null,
      null,
      "https://maps.google.com/?q=46.5197,6.6323"
    );
    expect(place?.latitude).toBe(46.5197);
    expect(place?.longitude).toBe(6.6323);
  });

  it("liest OpenStreetMap-Marker (mlat/mlon vor #map=)", () => {
    const place = parseSharedPlace(
      null,
      null,
      "https://www.openstreetmap.org/?mlat=46.9481&mlon=7.4474#map=15/46.9000/7.4000"
    );
    expect(place?.latitude).toBe(46.9481);
    expect(place?.longitude).toBe(7.4474);
  });

  it("liest nackte Koordinaten aus dem Text", () => {
    const place = parseSharedPlace("Schöner Platz", "47.3769, 8.5417");
    expect(place).toEqual({
      name: "Schöner Platz",
      latitude: 47.3769,
      longitude: 8.5417,
    });
  });

  it("liefert null ohne Koordinaten (auch bei Kurzlinks)", () => {
    expect(parseSharedPlace("Zermatt", "Schau dir das an!")).toBeNull();
    // Kurzlinks tragen die Koordinaten nicht im Link – bewusst kein Abruf
    expect(
      parseSharedPlace(null, null, "https://maps.app.goo.gl/AbCdEf123")
    ).toBeNull();
    expect(parseSharedPlace()).toBeNull();
  });

  it("verwirft 0,0 und Werte ausserhalb des Rasters", () => {
    expect(parseSharedPlace(null, null, "geo:0,0")).toBeNull();
    expect(parseSharedPlace(null, "123.5, 8.3")).toBeNull();
  });

  it("übernimmt Link- oder Koordinaten-Titel nicht als Namen", () => {
    const place = parseSharedPlace(
      "https://example.com",
      null,
      "geo:46.8,9.53"
    );
    expect(place?.name).toBe("");
  });
});
