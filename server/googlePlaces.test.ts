import { describe, expect, it } from "vitest";
import {
  GOOGLE_ATTRIBUTION,
  GOOGLE_PICNIC_TYPES,
  GOOGLE_PLACES_FIELD_MASK,
  GOOGLE_PLACES_MAX_RESULTS,
  GOOGLE_SHOP_TYPES,
  googlePicnicKind,
  googlePlacesBody,
  googleShopKind,
  parseGooglePlaces,
  placesCacheKey,
} from "@shared/googlePlaces";

const place = (over: Record<string, unknown> = {}) => ({
  id: "ChIJtest",
  location: { latitude: 46.95, longitude: 7.45 },
  displayName: { text: "Coop" },
  primaryType: "supermarket",
  types: ["supermarket", "grocery_store", "store"],
  regularOpeningHours: {
    openNow: true,
    weekdayDescriptions: ["Montag: 08:00–19:00", "Dienstag: 08:00–19:00"],
  },
  websiteUri: "https://coop.ch",
  nationalPhoneNumber: "031 123 45 67",
  ...over,
});

describe("Orte von Google", () => {
  describe("Anfrage", () => {
    it("sucht im Umkreis und ordnet nach Entfernung", () => {
      // Am Zeltplatz zählt, was zu Fuss erreichbar ist – nicht, was die
      // meisten Bewertungen hat
      const body = googlePlacesBody(46.95, 7.45, 3000, ["bakery"]);
      expect(body.rankPreference).toBe("DISTANCE");
      expect(body.includedTypes).toEqual(["bakery"]);
      const circle = (
        body.locationRestriction as { circle: { radius: number } }
      ).circle;
      expect(circle.radius).toBe(3000);
    });

    it("hält den Radius in Googles Grenzen", () => {
      const far = googlePlacesBody(46.95, 7.45, 999999, ["bakery"]);
      const circle = (far.locationRestriction as { circle: { radius: number } })
        .circle;
      expect(circle.radius).toBe(50000);
    });

    it("begrenzt die Trefferzahl", () => {
      // Jede Abfrage kostet – und niemand liest am Handy zwanzig Läden
      expect(
        googlePlacesBody(46.95, 7.45, 3000, ["bakery"]).maxResultCount
      ).toBe(GOOGLE_PLACES_MAX_RESULTS);
      expect(
        googlePlacesBody(46.95, 7.45, 3000, ["bakery"], 99).maxResultCount
      ).toBe(20);
    });

    it("gibt die Sprache mit", () => {
      expect(
        googlePlacesBody(46.95, 7.45, 3000, ["bakery"], 5, "it").languageCode
      ).toBe("it");
    });
  });

  describe("Antwort lesen", () => {
    it("liest einen Treffer mit allen Feldern", () => {
      const [p] = parseGooglePlaces({ places: [place()] });
      expect(p.id).toBe("ChIJtest");
      expect(p.name).toBe("Coop");
      expect(p.lat).toBe(46.95);
      expect(p.openNow).toBe(true);
      expect(p.hours).toHaveLength(2);
      expect(p.website).toBe("https://coop.ch");
      expect(p.phone).toBe("031 123 45 67");
    });

    it("stellt den Haupttyp nach vorne und lässt keinen doppelt", () => {
      const [p] = parseGooglePlaces({ places: [place()] });
      expect(p.types[0]).toBe("supermarket");
      expect(p.types.filter(t => t === "supermarket")).toHaveLength(1);
    });

    it("kommt ohne Öffnungszeiten zurecht", () => {
      // Google weiss es nicht – das ist etwas anderes als «geschlossen»
      const [p] = parseGooglePlaces({
        places: [place({ regularOpeningHours: undefined })],
      });
      expect(p.openNow).toBeNull();
      expect(p.hours).toEqual([]);
    });

    it("wirft Treffer ohne Koordinaten weg", () => {
      // Ohne Ort lässt sich weder einordnen noch hinfahren
      expect(parseGooglePlaces({ places: [place({ location: {} })] })).toEqual(
        []
      );
      expect(parseGooglePlaces({ places: [place({ id: "" })] })).toEqual([]);
    });

    it("kommt mit einer kaputten oder leeren Antwort zurecht", () => {
      expect(parseGooglePlaces(null)).toEqual([]);
      expect(parseGooglePlaces({})).toEqual([]);
      expect(parseGooglePlaces({ places: "nope" })).toEqual([]);
      expect(parseGooglePlaces({ places: [] })).toEqual([]);
    });
  });

  describe("Zuordnung", () => {
    it("erkennt die Ladenarten", () => {
      expect(googleShopKind(["bakery", "store"])).toBe("bakery");
      expect(googleShopKind(["butcher_shop"])).toBe("butcher");
      expect(googleShopKind(["convenience_store"])).toBe("convenience");
      expect(googleShopKind(["supermarket"])).toBe("supermarket");
      expect(googleShopKind(["grocery_store"])).toBe("supermarket");
    });

    it("stellt die Bäckerei über den Supermarkt", () => {
      // Ein Ort mit beiden Typen ist die Bäckerei im Supermarkt – wer
      // morgens Brot sucht, will sie als Bäckerei sehen
      expect(googleShopKind(["supermarket", "bakery"])).toBe("bakery");
    });

    it("meldet null für alles andere", () => {
      expect(googleShopKind(["restaurant"])).toBeNull();
      expect(googleShopKind([])).toBeNull();
      expect(googlePicnicKind(["restaurant"])).toBeNull();
    });

    it("erkennt Rastplätze", () => {
      expect(googlePicnicKind(["rest_stop"])).toBe("site");
      expect(googlePicnicKind(["picnic_ground"])).toBe("table");
    });

    it("sucht keine Parks als Rastplatz", () => {
      // Sonst käme jede Grünfläche der Stadt mit; gemeint ist der Tisch
      // an der Landstrasse
      expect(GOOGLE_PICNIC_TYPES.indexOf("park" as never)).toBe(-1);
    });

    it("sucht keinen Hofladen – dafür gibt es bei Google keinen Typ", () => {
      expect(GOOGLE_SHOP_TYPES.indexOf("farm" as never)).toBe(-1);
    });
  });

  describe("Zwischenspeicher-Schlüssel", () => {
    it("ist für benachbarte Punkte derselbe", () => {
      // Ein GPS-Zittern von zwanzig Metern darf keine neue Abfrage auslösen
      const a = placesCacheKey(46.95001, 7.45001, 3000, ["bakery"]);
      const b = placesCacheKey(46.95004, 7.45002, 3000, ["bakery"]);
      expect(a).toBe(b);
    });

    it("unterscheidet Radius und Typen", () => {
      const base = placesCacheKey(46.95, 7.45, 3000, ["bakery"]);
      expect(placesCacheKey(46.95, 7.45, 5000, ["bakery"])).not.toBe(base);
      expect(placesCacheKey(46.95, 7.45, 3000, ["supermarket"])).not.toBe(base);
    });

    it("hängt nicht an der Reihenfolge der Typen", () => {
      expect(placesCacheKey(46.95, 7.45, 3000, ["a", "b"])).toBe(
        placesCacheKey(46.95, 7.45, 3000, ["b", "a"])
      );
    });
  });

  it("fragt die Öffnungszeiten wirklich ab", () => {
    // Ohne sie wäre die ganze Anbindung sinnlos – OSM kennt die Läden auch
    expect(GOOGLE_PLACES_FIELD_MASK).toContain(
      "places.regularOpeningHours.weekdayDescriptions"
    );
    expect(GOOGLE_PLACES_FIELD_MASK).toContain("places.location");
  });

  it("nennt die Quelle", () => {
    // Die Nutzungsbedingungen verlangen die Angabe
    expect(GOOGLE_ATTRIBUTION).toBe("Powered by Google");
  });
});
