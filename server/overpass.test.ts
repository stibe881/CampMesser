import { describe, expect, it } from "vitest";
// Overpass-Parser liegt im Client-Code, ist aber reine Logik ohne DOM.
import {
  OVERPASS_MAX_RESULTS,
  overpassQuery,
  parseCampsites,
} from "../client/src/lib/overpass";

describe("overpassQuery", () => {
  it("baut die Abfrage mit gerundeter Bounding-Box und Limit 100", () => {
    const q = overpassQuery(46.712345678, 7.1, 46.9, 7.3);
    expect(q).toContain("[out:json][timeout:15];");
    expect(q).toContain(
      'node["tourism"="camp_site"](46.71235,7.10000,46.90000,7.30000)'
    );
    expect(q).toContain(
      'way["tourism"="camp_site"](46.71235,7.10000,46.90000,7.30000)'
    );
    expect(q).toContain("out center 100;");
  });
});

describe("parseCampsites", () => {
  it("übersetzt nodes direkt und ways über center", () => {
    const result = parseCampsites({
      elements: [
        {
          type: "node",
          id: 1,
          lat: 46.5,
          lon: 7.2,
          tags: { name: "Camping Seeblick" },
        },
        {
          type: "way",
          id: 2,
          center: { lat: 46.6, lon: 7.3 },
          tags: { name: "Camping Aare" },
        },
      ],
    });
    expect(result).toEqual([
      {
        id: "node/1",
        lat: 46.5,
        lon: 7.2,
        name: "Camping Seeblick",
        website: undefined,
        phone: undefined,
      },
      {
        id: "way/2",
        lat: 46.6,
        lon: 7.3,
        name: "Camping Aare",
        website: undefined,
        phone: undefined,
      },
    ]);
  });

  it("übernimmt Website und Telefon nur als sinnvolle Werte", () => {
    const result = parseCampsites({
      elements: [
        {
          type: "node",
          id: 1,
          lat: 1,
          lon: 2,
          tags: {
            name: "  A  ",
            website: "https://camping-a.ch",
            phone: " +41 31 000 00 00 ",
          },
        },
        {
          type: "node",
          id: 2,
          lat: 1,
          lon: 2,
          tags: { website: "www.camping-b.ch", phone: "" },
        },
        {
          type: "node",
          id: 3,
          lat: 1,
          lon: 2,
          tags: { website: "kein-link", name: 42 },
        },
      ],
    });
    expect(result[0].name).toBe("A");
    expect(result[0].website).toBe("https://camping-a.ch");
    expect(result[0].phone).toBe("+41 31 000 00 00");
    expect(result[1].website).toBe("https://www.camping-b.ch");
    expect(result[1].phone).toBeUndefined();
    expect(result[2].website).toBeUndefined();
    expect(result[2].name).toBeUndefined();
  });

  it("überspringt kaputte Elemente und Duplikate still", () => {
    const result = parseCampsites({
      elements: [
        null,
        "quatsch",
        { type: "relation", id: 1, lat: 1, lon: 2 },
        { type: "node", id: "1", lat: 1, lon: 2 },
        { type: "node", id: 4, lat: "1", lon: 2 },
        { type: "node", id: 5, lat: Number.NaN, lon: 2 },
        { type: "way", id: 6 },
        { type: "way", id: 7, center: { lat: 1 } },
        { type: "node", id: 8, lat: 1, lon: 2 },
        { type: "node", id: 8, lat: 9, lon: 9 },
        { type: "way", id: 8, center: { lat: 3, lon: 4 } },
      ],
    });
    expect(result.map(c => c.id)).toEqual(["node/8", "way/8"]);
  });

  it("liefert bei unbrauchbarer Antwort eine leere Liste", () => {
    expect(parseCampsites(null)).toEqual([]);
    expect(parseCampsites(undefined)).toEqual([]);
    expect(parseCampsites("html-fehlerseite")).toEqual([]);
    expect(parseCampsites({})).toEqual([]);
    expect(parseCampsites({ elements: "nope" })).toEqual([]);
  });

  it("begrenzt das Ergebnis hart auf 100 Einträge", () => {
    const elements = [];
    for (let i = 0; i < 130; i++) {
      elements.push({ type: "node", id: i, lat: 1, lon: 2 });
    }
    const result = parseCampsites({ elements });
    expect(result).toHaveLength(OVERPASS_MAX_RESULTS);
    expect(result[99].id).toBe("node/99");
  });
});
