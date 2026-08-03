import { describe, expect, it } from "vitest";
// Overpass-Parser liegt im Client-Code, ist aber reine Logik ohne DOM.
import {
  boundingBoxAround,
  firepitsBboxQuery,
  firepitsQuery,
  hikingRoutesQuery,
  nearestFirepits,
  OVERPASS_FIREPIT_MAX_RESULTS,
  OVERPASS_HIKING_MAX_RESULTS,
  OVERPASS_MAX_RESULTS,
  overpassQuery,
  parseCampsites,
  parseFirepits,
  parseHikingRoutes,
  parseOsmYesNo,
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

describe("boundingBoxAround", () => {
  it("rechnet den Umkreis in eine Box um (Ost-West mit Kosinus gestreckt)", () => {
    const box = boundingBoxAround(46.8, 8.2, 10000);
    expect(box.north - 46.8).toBeCloseTo(10000 / 111320, 6);
    expect(box.south).toBeLessThan(46.8);
    // Auf 46.8° Breite ist ein Längengrad rund 68 km lang → grössere Spanne
    expect(box.east - 8.2).toBeGreaterThan(box.north - 46.8);
    expect(box.east - 8.2).toBeCloseTo(
      10000 / (111320 * Math.cos((46.8 * Math.PI) / 180)),
      6
    );
  });

  it("bleibt am Pol endlich und klemmt auf gültige Koordinaten", () => {
    const box = boundingBoxAround(90, 0, 50000);
    expect(Number.isFinite(box.east)).toBe(true);
    expect(box.north).toBeLessThanOrEqual(90);
    expect(
      boundingBoxAround(-89.999, 179.999, 100000).south
    ).toBeGreaterThanOrEqual(-90);
  });
});

describe("hikingRoutesQuery", () => {
  it("fragt Wander-Relationen im Umkreis mit zugeschnittener Geometrie ab", () => {
    const q = hikingRoutesQuery(46.8, 8.2, 10000);
    expect(q).toContain("[out:json][timeout:25];");
    expect(q).toContain('relation["type"="route"]["route"~"^(hiking|foot)$"]');
    expect(q).toContain("(around:10000,46.80000,8.20000)");
    expect(q).toContain("out geom(");
    expect(q).toContain(` ${OVERPASS_HIKING_MAX_RESULTS};`);
  });
});

describe("parseHikingRoutes", () => {
  it("liest Tags und Wegführung je Relations-Mitglied", () => {
    const routes = parseHikingRoutes({
      elements: [
        {
          type: "relation",
          id: 42,
          tags: {
            name: "Panoramaweg",
            ref: "12",
            network: "rwn",
            distance: "8.5",
            ascent: "420",
            descent: "420 m",
            sac_scale: "mountain_hiking",
            website: "www.beispiel.ch",
          },
          members: [
            {
              type: "way",
              geometry: [
                { lat: 46.5, lon: 7.2 },
                { lat: 46.51, lon: 7.21 },
              ],
            },
            {
              type: "way",
              geometry: [
                { lat: 46.52, lon: 7.22 },
                { lat: 46.53, lon: 7.23 },
              ],
            },
          ],
        },
      ],
    });
    expect(routes).toHaveLength(1);
    expect(routes[0]).toMatchObject({
      id: "relation/42",
      name: "Panoramaweg",
      ref: "12",
      network: "rwn",
      distanceM: 8500,
      ascentM: 420,
      descentM: 420,
      sacScale: "T2",
      website: "https://www.beispiel.ch",
    });
    expect(routes[0].segments).toHaveLength(2);
    expect(routes[0].segments[0][0]).toEqual({ lat: 46.5, lon: 7.2 });
  });

  it("lässt fehlende Angaben offen, statt sie zu schätzen", () => {
    const routes = parseHikingRoutes({
      elements: [
        {
          type: "relation",
          id: 7,
          tags: { distance: "etwa 5 km", sac_scale: "sehr steil" },
          members: [
            {
              type: "way",
              geometry: [
                { lat: 46.5, lon: 7.2 },
                { lat: 46.51, lon: 7.21 },
              ],
            },
          ],
        },
      ],
    });
    expect(routes[0].name).toBeUndefined();
    expect(routes[0].distanceM).toBeUndefined();
    expect(routes[0].ascentM).toBeUndefined();
    expect(routes[0].sacScale).toBeUndefined();
  });

  it("überspringt Relationen ohne brauchbare Wegführung und Duplikate", () => {
    const routes = parseHikingRoutes({
      elements: [
        null,
        "quatsch",
        { type: "way", id: 1, members: [] },
        { type: "relation", id: "2" },
        { type: "relation", id: 3, members: [] },
        {
          type: "relation",
          id: 4,
          members: [{ type: "way", geometry: [{ lat: 46.5, lon: 7.2 }] }],
        },
        {
          type: "relation",
          id: 5,
          members: [
            {
              type: "way",
              geometry: [
                { lat: 46.5, lon: "x" },
                { lat: 46.5, lon: 7.2 },
                { lat: Number.NaN, lon: 7.2 },
                { lat: 46.51, lon: 7.2 },
              ],
            },
          ],
        },
        {
          type: "relation",
          id: 5,
          members: [
            {
              type: "way",
              geometry: [
                { lat: 47, lon: 8 },
                { lat: 47.1, lon: 8.1 },
              ],
            },
          ],
        },
      ],
    });
    expect(routes.map(r => r.id)).toEqual(["relation/5"]);
    expect(routes[0].segments[0]).toHaveLength(2);
  });

  it("liefert bei unbrauchbarer Antwort eine leere Liste", () => {
    expect(parseHikingRoutes(null)).toEqual([]);
    expect(parseHikingRoutes("html-fehlerseite")).toEqual([]);
    expect(parseHikingRoutes({ elements: "nope" })).toEqual([]);
  });

  it("begrenzt das Ergebnis hart", () => {
    const elements = [];
    for (let i = 0; i < OVERPASS_HIKING_MAX_RESULTS + 12; i++) {
      elements.push({
        type: "relation",
        id: i,
        members: [
          {
            type: "way",
            geometry: [
              { lat: 46.5, lon: 7.2 },
              { lat: 46.51, lon: 7.2 },
            ],
          },
        ],
      });
    }
    expect(parseHikingRoutes({ elements })).toHaveLength(
      OVERPASS_HIKING_MAX_RESULTS
    );
  });
});

describe("firepitsQuery / firepitsBboxQuery", () => {
  it("fragt Feuerstellen und Grills als node und way im Umkreis ab", () => {
    const q = firepitsQuery(46.8, 8.2, 5000);
    expect(q).toContain("[out:json][timeout:20];");
    expect(q).toContain(
      'node["leisure"="firepit"](around:5000,46.80000,8.20000)'
    );
    expect(q).toContain(
      'way["leisure"="firepit"](around:5000,46.80000,8.20000)'
    );
    expect(q).toContain('node["amenity"="bbq"](around:5000,46.80000,8.20000)');
    expect(q).toContain('way["amenity"="bbq"](around:5000,46.80000,8.20000)');
    expect(q).toContain(`out center ${OVERPASS_FIREPIT_MAX_RESULTS};`);
  });

  it("nutzt für die Karte dieselben Typen mit gerundeter Bounding-Box", () => {
    const q = firepitsBboxQuery(46.712345678, 7.1, 46.9, 7.3);
    expect(q).toContain(
      'node["leisure"="firepit"](46.71235,7.10000,46.90000,7.30000)'
    );
    expect(q).toContain(
      'way["amenity"="bbq"](46.71235,7.10000,46.90000,7.30000)'
    );
    expect(q).toContain(`out center ${OVERPASS_FIREPIT_MAX_RESULTS};`);
  });
});

describe("parseOsmYesNo", () => {
  it("liest yes/no in allen üblichen Schreibweisen", () => {
    expect(parseOsmYesNo("yes")).toBe(true);
    expect(parseOsmYesNo(" YES ")).toBe(true);
    expect(parseOsmYesNo("true")).toBe(true);
    expect(parseOsmYesNo("1")).toBe(true);
    expect(parseOsmYesNo("no")).toBe(false);
    expect(parseOsmYesNo("FALSE")).toBe(false);
    expect(parseOsmYesNo("0")).toBe(false);
  });

  it("lässt Uneindeutiges offen, statt zu raten", () => {
    expect(parseOsmYesNo("limited")).toBeUndefined();
    expect(parseOsmYesNo("seasonal")).toBeUndefined();
    expect(parseOsmYesNo("")).toBeUndefined();
    expect(parseOsmYesNo(undefined)).toBeUndefined();
    expect(parseOsmYesNo(42)).toBeUndefined();
  });
});

describe("parseFirepits", () => {
  it("unterscheidet Feuerstelle und fest installierten Grill", () => {
    const result = parseFirepits({
      elements: [
        {
          type: "node",
          id: 1,
          lat: 46.5,
          lon: 7.2,
          tags: { leisure: "firepit", name: "Feuerstelle Waldrand" },
        },
        {
          type: "way",
          id: 2,
          center: { lat: 46.6, lon: 7.3 },
          tags: { amenity: "bbq" },
        },
      ],
    });
    expect(result).toEqual([
      {
        id: "node/1",
        lat: 46.5,
        lon: 7.2,
        kind: "firepit",
        name: "Feuerstelle Waldrand",
        covered: undefined,
        firewood: undefined,
        drinkingWater: undefined,
      },
      {
        id: "way/2",
        lat: 46.6,
        lon: 7.3,
        kind: "bbq",
        name: undefined,
        covered: undefined,
        firewood: undefined,
        drinkingWater: undefined,
      },
    ]);
  });

  it("übernimmt gedeckt, Brennholz und Trinkwasser nur bei klaren Tags", () => {
    const result = parseFirepits({
      elements: [
        {
          type: "node",
          id: 1,
          lat: 1,
          lon: 2,
          tags: {
            leisure: "firepit",
            covered: "yes",
            "fuel:wood": "no",
            drinking_water: "yes",
          },
        },
        {
          type: "node",
          id: 2,
          lat: 1,
          lon: 2,
          tags: {
            leisure: "firepit",
            covered: "vielleicht",
            drinking_water: "seasonal",
          },
        },
      ],
    });
    expect(result[0].covered).toBe(true);
    expect(result[0].firewood).toBe(false);
    expect(result[0].drinkingWater).toBe(true);
    expect(result[1].covered).toBeUndefined();
    expect(result[1].firewood).toBeUndefined();
    expect(result[1].drinkingWater).toBeUndefined();
  });

  it("überspringt fremde Typen, kaputte Elemente und Duplikate", () => {
    const result = parseFirepits({
      elements: [
        null,
        "quatsch",
        { type: "node", id: 1, lat: 1, lon: 2, tags: { amenity: "toilets" } },
        { type: "node", id: 2, lat: 1, lon: 2 },
        { type: "relation", id: 3, tags: { leisure: "firepit" } },
        { type: "way", id: 4, tags: { leisure: "firepit" } },
        { type: "node", id: 5, lat: 1, lon: 2, tags: { leisure: "firepit" } },
        { type: "node", id: 5, lat: 9, lon: 9, tags: { amenity: "bbq" } },
        {
          type: "way",
          id: 5,
          center: { lat: 3, lon: 4 },
          tags: { amenity: "bbq" },
        },
      ],
    });
    expect(result.map(f => f.id)).toEqual(["node/5", "way/5"]);
    expect(result[0].kind).toBe("firepit");
    expect(result[1].kind).toBe("bbq");
  });

  it("liefert bei unbrauchbarer Antwort eine leere Liste", () => {
    expect(parseFirepits(null)).toEqual([]);
    expect(parseFirepits("html-fehlerseite")).toEqual([]);
    expect(parseFirepits({ elements: "nope" })).toEqual([]);
  });

  it("begrenzt das Ergebnis hart", () => {
    const elements = [];
    for (let i = 0; i < OVERPASS_FIREPIT_MAX_RESULTS + 9; i++) {
      elements.push({
        type: "node",
        id: i,
        lat: 46.5,
        lon: 7.2,
        tags: { leisure: "firepit" },
      });
    }
    expect(parseFirepits({ elements })).toHaveLength(
      OVERPASS_FIREPIT_MAX_RESULTS
    );
  });
});

describe("nearestFirepits", () => {
  const at = (id: number, lat: number, lon: number) => ({
    id: `node/${id}`,
    lat,
    lon,
    kind: "firepit" as const,
  });

  it("sortiert nach Luftlinie und kürzt auf die gewünschte Anzahl", () => {
    const result = nearestFirepits(
      [at(1, 46.9, 8.2), at(2, 46.81, 8.2), at(3, 46.85, 8.2)],
      46.8,
      8.2,
      2
    );
    expect(result.map(entry => entry.firepit.id)).toEqual(["node/2", "node/3"]);
    expect(result[0].distanceM).toBeLessThan(result[1].distanceM);
    // rund 1.1 km bei 0.01° Breitenunterschied
    expect(result[0].distanceM).toBeGreaterThan(1000);
    expect(result[0].distanceM).toBeLessThan(1200);
  });

  it("hält die Reihenfolge bei gleicher Distanz über die Id stabil", () => {
    const result = nearestFirepits(
      [at(9, 46.81, 8.2), at(2, 46.81, 8.2)],
      46.8,
      8.2,
      5
    );
    expect(result.map(entry => entry.firepit.id)).toEqual(["node/2", "node/9"]);
  });

  it("liefert bei limit <= 0 nichts", () => {
    expect(nearestFirepits([at(1, 46.81, 8.2)], 46.8, 8.2, 0)).toEqual([]);
  });
});
