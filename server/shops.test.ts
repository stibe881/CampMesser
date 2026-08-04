import { describe, expect, it } from "vitest";
import {
  SHOP_DEFAULT_RADIUS_M,
  nearestShops,
  parseShops,
  shopsQuery,
} from "../client/src/lib/overpass";
import {
  formatMinutes,
  hoursForDay,
  isOpenAt,
  parseOpeningHours,
  weekdayIndex,
} from "@shared/openingHours";

/** Ein Dienstag, 10:00 Uhr Ortszeit. */
const tuesdayMorning = new Date(2026, 7, 4, 10, 0);
/** Derselbe Dienstag, 22:00 Uhr. */
const tuesdayNight = new Date(2026, 7, 4, 22, 0);
/** Der folgende Sonntag, 10:00 Uhr. */
const sunday = new Date(2026, 7, 9, 10, 0);

describe("Öffnungszeiten aus OSM (#273)", () => {
  it("versteht den häufigen einfachen Fall", () => {
    const rules = parseOpeningHours("Mo-Fr 08:00-19:00");
    expect(rules).toEqual([
      { days: [0, 1, 2, 3, 4], spans: [{ from: 480, to: 1140 }] },
    ]);
  });

  it("kennt Mittagspausen und mehrere Regeln", () => {
    const spec = "Mo-Fr 08:00-12:00,13:30-18:30; Sa 08:00-16:00";
    expect(isOpenAt(spec, tuesdayMorning)).toBe(true);
    // 12:30 Uhr liegt in der Mittagspause
    expect(isOpenAt(spec, new Date(2026, 7, 4, 12, 30))).toBe(false);
    expect(hoursForDay(spec, tuesdayMorning)).toBe("08:00–12:00, 13:30–18:30");
  });

  it("«24/7» ist immer offen", () => {
    expect(isOpenAt("24/7", tuesdayNight)).toBe(true);
    expect(isOpenAt("24/7", sunday)).toBe(true);
  });

  it("versteht «off» für geschlossene Tage", () => {
    const spec = "Mo-Sa 08:00-18:00; Su off";
    expect(isOpenAt(spec, sunday)).toBe(false);
    expect(hoursForDay(spec, sunday)).toBe("");
  });

  it("spätere Regeln überschreiben frühere", () => {
    // Mittwoch nur vormittags, obwohl die erste Regel Mo-Sa abdeckt
    const spec = "Mo-Sa 08:00-18:00; We 08:00-12:00";
    const wednesdayAfternoon = new Date(2026, 7, 5, 15, 0);
    expect(isOpenAt(spec, wednesdayAfternoon)).toBe(false);
    expect(isOpenAt(spec, new Date(2026, 7, 5, 9, 0))).toBe(true);
  });

  it("Tage ohne Regel gelten als unbekannt, nicht als geschlossen", () => {
    // Nur Samstag geregelt – über den Dienstag sagt die Angabe nichts
    expect(isOpenAt("Sa 08:00-16:00", tuesdayMorning)).toBeNull();
  });

  it("gibt bei allem Komplexeren ehrlich null zurück", () => {
    for (const spec of [
      "Mo-Fr 08:00-18:00; PH off",
      "Mar-Oct 09:00-17:00",
      'Mo-Fr 08:00-18:00; Sa 08:00-12:00 open "nur Vormittag"',
      "sunrise-sunset",
      "Mo-Fr 08:00+",
      "irgendwas",
    ]) {
      expect(isOpenAt(spec, tuesdayMorning)).toBeNull();
      expect(hoursForDay(spec, tuesdayMorning)).toBeNull();
    }
    expect(isOpenAt(undefined, tuesdayMorning)).toBeNull();
    expect(isOpenAt("", tuesdayMorning)).toBeNull();
  });

  it("rechnet Wochentage nach ISO (Montag = 0)", () => {
    expect(weekdayIndex(tuesdayMorning)).toBe(1);
    expect(weekdayIndex(sunday)).toBe(6);
  });

  it("formatiert Minuten als Uhrzeit", () => {
    expect(formatMinutes(0)).toBe("00:00");
    expect(formatMinutes(480)).toBe("08:00");
    expect(formatMinutes(1140)).toBe("19:00");
  });
});

describe("Läden in Platznähe (#273)", () => {
  it("fragt genau die Ladenarten ab, die am Platz zählen", () => {
    const query = shopsQuery(46.9481, 7.4474, SHOP_DEFAULT_RADIUS_M);
    expect(query).toContain("around:5000,46.94810,7.44740");
    expect(query).toContain("supermarket|convenience|bakery|farm|butcher");
    expect(query).toContain("node[");
    expect(query).toContain("way[");
  });

  it("liest Läden defensiv aus der Overpass-Antwort", () => {
    const shops = parseShops({
      elements: [
        {
          type: "node",
          id: 1,
          lat: 46.95,
          lon: 7.45,
          tags: {
            shop: "bakery",
            name: "Dorfbäckerei",
            opening_hours: "Mo-Sa 06:00-12:00",
            website: "www.beispiel.ch",
          },
        },
        // Kein Laden – wird übersprungen
        { type: "node", id: 2, lat: 46.9, lon: 7.4, tags: { amenity: "bar" } },
        // Ohne Koordinaten – wird übersprungen
        { type: "way", id: 3, tags: { shop: "supermarket" } },
      ],
    });
    expect(shops).toHaveLength(1);
    expect(shops[0]).toMatchObject({
      kind: "bakery",
      name: "Dorfbäckerei",
      openingHours: "Mo-Sa 06:00-12:00",
      website: "https://www.beispiel.ch",
    });
  });

  it("sortiert nach Luftlinie, ohne Vorrang für eine Ladenart", () => {
    const shops = [
      { id: "node/1", lat: 47.0, lon: 7.5, kind: "supermarket" as const },
      { id: "node/2", lat: 46.951, lon: 7.451, kind: "bakery" as const },
    ];
    const nearest = nearestShops(shops, 46.95, 7.45, 2);
    expect(nearest[0].place.id).toBe("node/2");
    expect(nearest[0].distanceM).toBeLessThan(nearest[1].distanceM);
  });
});
