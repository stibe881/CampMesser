import { describe, expect, it } from "vitest";
// Overpass-Parser liegt im Client-Code, ist aber reine Logik ohne DOM.
import {
  combinedBboxQuery,
  boundingBoxAround,
  familyPlacesQuery,
  firepitsQuery,
  hikingRoutesQuery,
  nearestFamilyPlaces,
  nearestFirepits,
  OVERPASS_FAMILY_MAX_RESULTS,
  OVERPASS_FIREPIT_MAX_RESULTS,
  OVERPASS_HIKING_MAX_RESULTS,
  OVERPASS_MAX_RESULTS,
  OVERPASS_PICNIC_MAX_RESULTS,
  parseCampsites,
  parseFamilyPlaces,
  parseFirepits,
  parseHikingRoutes,
  parsePicnicSites,
  picnicSitesQuery,
  parseOsmAgeYears,
  parseOsmYesNo,
  parseSights,
  sightsQuery,
  beachesQuery,
  parseBeaches,
  drinkingWaterQuery,
  parseDrinkingWater,
  chargersQuery,
  parseChargers,
  defibrillatorsQuery,
  parseDefibrillators,
  nearestPois,
} from "../client/src/lib/overpass";

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

describe("firepitsQuery", () => {
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

describe("familyPlacesQuery", () => {
  it("fragt Spielplätze und Badestellen als node und way im Umkreis ab", () => {
    const q = familyPlacesQuery(46.8, 8.2, 5000);
    expect(q).toContain("[out:json][timeout:20];");
    expect(q).toContain(
      'node["leisure"="playground"](around:5000,46.80000,8.20000)'
    );
    expect(q).toContain(
      'way["leisure"="playground"](around:5000,46.80000,8.20000)'
    );
    expect(q).toContain('node["leisure"~"^(bathing_place|beach_resort)$"]');
    expect(q).toContain('way["leisure"~"^(bathing_place|beach_resort)$"]');
    expect(q).toContain(`out center ${OVERPASS_FAMILY_MAX_RESULTS};`);
  });
});

describe("parseOsmAgeYears", () => {
  it("übernimmt nur glatte Jahresangaben von 0 bis 18", () => {
    expect(parseOsmAgeYears("3")).toBe(3);
    expect(parseOsmAgeYears(" 12 ")).toBe(12);
    expect(parseOsmAgeYears("0")).toBe(0);
    expect(parseOsmAgeYears("18")).toBe(18);
  });

  it("lässt Freitext und unplausible Werte offen", () => {
    expect(parseOsmAgeYears("ab 3")).toBeUndefined();
    expect(parseOsmAgeYears("3-12")).toBeUndefined();
    expect(parseOsmAgeYears("99")).toBeUndefined();
    expect(parseOsmAgeYears("")).toBeUndefined();
    expect(parseOsmAgeYears(6)).toBeUndefined();
  });
});

describe("parseFamilyPlaces", () => {
  it("unterscheidet Spielplatz und Badeplatz und liest die passenden Tags", () => {
    const result = parseFamilyPlaces({
      elements: [
        {
          type: "node",
          id: 1,
          lat: 46.5,
          lon: 7.2,
          tags: {
            leisure: "playground",
            name: "Spielplatz Seematte",
            min_age: "3",
            max_age: "12",
            fenced: "yes",
            covered: "no",
          },
        },
        {
          type: "way",
          id: 2,
          center: { lat: 46.6, lon: 7.3 },
          tags: {
            leisure: "bathing_place",
            supervised: "yes",
            fee: "no",
          },
        },
      ],
    });
    expect(result[0]).toMatchObject({
      id: "node/1",
      kind: "playground",
      name: "Spielplatz Seematte",
      minAgeYears: 3,
      maxAgeYears: 12,
      fenced: true,
      covered: false,
    });
    expect(result[1]).toMatchObject({
      id: "way/2",
      kind: "bathing",
      supervised: true,
      fee: false,
    });
  });

  it("wertet nur die Tags der jeweiligen Kategorie aus", () => {
    const result = parseFamilyPlaces({
      elements: [
        {
          type: "node",
          id: 1,
          lat: 1,
          lon: 2,
          // Eintritt am Spielplatz sagt nichts übers Baden – und umgekehrt
          tags: { leisure: "playground", fee: "yes", supervised: "yes" },
        },
        {
          type: "node",
          id: 2,
          lat: 1,
          lon: 2,
          tags: { leisure: "beach_resort", min_age: "6", fenced: "yes" },
        },
      ],
    });
    expect(result[0].fee).toBeUndefined();
    expect(result[0].supervised).toBeUndefined();
    expect(result[1].minAgeYears).toBeUndefined();
    expect(result[1].fenced).toBeUndefined();
  });

  it("nimmt Strände nur mit Zugang und überspringt Fremdes", () => {
    const result = parseFamilyPlaces({
      elements: [
        null,
        { type: "node", id: 1, lat: 1, lon: 2, tags: { amenity: "toilets" } },
        {
          type: "node",
          id: 2,
          lat: 1,
          lon: 2,
          tags: { natural: "beach", access: "private" },
        },
        {
          type: "node",
          id: 3,
          lat: 1,
          lon: 2,
          tags: { natural: "beach", access: "no" },
        },
        { type: "node", id: 4, lat: 1, lon: 2, tags: { natural: "beach" } },
        {
          type: "node",
          id: 5,
          lat: 1,
          lon: 2,
          tags: { natural: "beach", access: "yes" },
        },
      ],
    });
    expect(result.map(p => p.id)).toEqual(["node/4", "node/5"]);
    expect(result.every(p => p.kind === "bathing")).toBe(true);
  });

  it("entfernt Duplikate und begrenzt das Ergebnis hart", () => {
    const elements: unknown[] = [
      { type: "node", id: 1, lat: 1, lon: 2, tags: { leisure: "playground" } },
      { type: "node", id: 1, lat: 9, lon: 9, tags: { leisure: "playground" } },
    ];
    expect(parseFamilyPlaces({ elements }).map(p => p.id)).toEqual(["node/1"]);

    const many = [];
    for (let i = 0; i < OVERPASS_FAMILY_MAX_RESULTS + 7; i++) {
      many.push({
        type: "node",
        id: i,
        lat: 46.5,
        lon: 7.2,
        tags: { leisure: "playground" },
      });
    }
    expect(parseFamilyPlaces({ elements: many })).toHaveLength(
      OVERPASS_FAMILY_MAX_RESULTS
    );
  });

  it("liefert bei unbrauchbarer Antwort eine leere Liste", () => {
    expect(parseFamilyPlaces(null)).toEqual([]);
    expect(parseFamilyPlaces("html-fehlerseite")).toEqual([]);
    expect(parseFamilyPlaces({ elements: "nope" })).toEqual([]);
  });
});

describe("nearestFamilyPlaces", () => {
  const place = (id: number, lat: number, kind: "playground" | "bathing") => ({
    id: `node/${id}`,
    lat,
    lon: 8.2,
    kind,
  });

  it("mischt beide Kategorien und sortiert allein nach Luftlinie", () => {
    const result = nearestFamilyPlaces(
      [
        place(1, 46.9, "playground"),
        place(2, 46.83, "bathing"),
        place(3, 46.81, "playground"),
      ],
      46.8,
      8.2,
      2
    );
    expect(result.map(entry => entry.place.id)).toEqual(["node/3", "node/2"]);
    expect(result[0].place.kind).toBe("playground");
    expect(result[1].place.kind).toBe("bathing");
  });

  it("liefert bei limit <= 0 nichts", () => {
    expect(
      nearestFamilyPlaces([place(1, 46.81, "bathing")], 46.8, 8.2, 0)
    ).toEqual([]);
  });
});

describe("picnicSitesQuery", () => {
  const points = [
    { lat: 46.948, lon: 7.4474 },
    { lat: 46.5, lon: 8.2 },
    { lat: 46.0037, lon: 8.9511 },
  ];

  it("hängt alle Stützpunkte in EINEN around-Filter", () => {
    const query = picnicSitesQuery(points, 5000);
    expect(query).toContain(
      "around:5000,46.94800,7.44740,46.50000,8.20000,46.00370,8.95110"
    );
    // ein Filter je Element-Art, nicht einer je Stützpunkt
    expect(query.match(/around:/g)?.length).toBe(4);
  });

  it("fragt Rastplätze und Tische als node und way ab", () => {
    const query = picnicSitesQuery(points, 2000);
    expect(query).toContain('node["tourism"="picnic_site"]');
    expect(query).toContain('way["tourism"="picnic_site"]');
    expect(query).toContain('node["leisure"="picnic_table"]');
    expect(query).toContain('way["leisure"="picnic_table"]');
    expect(query).toContain(`out center ${OVERPASS_PICNIC_MAX_RESULTS};`);
  });

  it("fragt ohne brauchbare Punkte gar nichts ab", () => {
    expect(picnicSitesQuery([], 5000)).not.toContain("around");
    expect(picnicSitesQuery([{ lat: NaN, lon: 8 }], 5000)).not.toContain(
      "around"
    );
  });

  it("rundet den Radius auf ganze Meter", () => {
    expect(picnicSitesQuery(points, 4999.6)).toContain("around:5000,");
  });
});

describe("parsePicnicSites", () => {
  it("unterscheidet Rastplatz und Tisch", () => {
    const list = parsePicnicSites({
      elements: [
        {
          type: "node",
          id: 1,
          lat: 46.9,
          lon: 7.4,
          tags: { tourism: "picnic_site", name: "Waldrast" },
        },
        {
          type: "node",
          id: 2,
          lat: 46.8,
          lon: 7.5,
          tags: { leisure: "picnic_table" },
        },
      ],
    });
    expect(list.map(entry => entry.kind)).toEqual(["site", "table"]);
    expect(list[0].name).toBe("Waldrast");
    expect(list[1].name).toBeUndefined();
  });

  it("liest gedeckt, Feuerstelle und Trinkwasser nur bei klaren Tags", () => {
    const [site] = parsePicnicSites({
      elements: [
        {
          type: "way",
          id: 7,
          center: { lat: 46.5, lon: 8.1 },
          tags: {
            tourism: "picnic_site",
            covered: "yes",
            fireplace: "no",
            drinking_water: "vielleicht",
          },
        },
      ],
    });
    expect(site.covered).toBe(true);
    expect(site.fireplace).toBe(false);
    expect(site.drinkingWater).toBeUndefined();
  });

  it("wirft Elemente ohne passenden Typ weg", () => {
    expect(
      parsePicnicSites({
        elements: [
          {
            type: "node",
            id: 3,
            lat: 46.1,
            lon: 8.1,
            tags: { amenity: "bbq" },
          },
        ],
      })
    ).toEqual([]);
  });

  it("entfernt Duplikate und begrenzt die Menge", () => {
    const doppelt = {
      type: "node",
      id: 5,
      lat: 46.2,
      lon: 8.3,
      tags: { tourism: "picnic_site" },
    };
    expect(parsePicnicSites({ elements: [doppelt, doppelt] }).length).toBe(1);

    const viele = Array.from({ length: 200 }, (_, i) => ({
      type: "node",
      id: 1000 + i,
      lat: 46 + i / 1000,
      lon: 8,
      tags: { leisure: "picnic_table" },
    }));
    expect(parsePicnicSites({ elements: viele }).length).toBe(
      OVERPASS_PICNIC_MAX_RESULTS
    );
  });

  it("liefert bei unbrauchbarer Antwort eine leere Liste", () => {
    expect(parsePicnicSites(null)).toEqual([]);
    expect(parsePicnicSites("html-fehlerseite")).toEqual([]);
    expect(parsePicnicSites({ elements: 42 })).toEqual([]);
  });
});

describe("Kombinierte Abfrage für die Karte (#339)", () => {
  it("eine Abfrage deckt alle gewünschten Ebenen ab", () => {
    // Vorher waren es drei gleichzeitige Anfragen an denselben
    // rate-limitierten Spiegel – der Grund, warum die Feuerstellen so
    // lange brauchten.
    const q = combinedBboxQuery(
      ["campsites", "firepits", "family"],
      46.7,
      7.1,
      46.9,
      7.3
    );
    expect(q).toContain('tourism"="camp_site"');
    expect(q).toContain('leisure"="firepit"');
    expect(q).toContain('amenity"="bbq"');
    expect(q).toContain('leisure"="playground"');
  });

  it("ausgeschaltete Ebenen kommen nicht vor", () => {
    const q = combinedBboxQuery(["firepits"], 46.7, 7.1, 46.9, 7.3);
    expect(q).toContain('leisure"="firepit"');
    expect(q).not.toContain("camp_site");
    expect(q).not.toContain("playground");
  });

  it("die Obergrenze ist die Summe der Ebenen", () => {
    // Sonst schnitte eine dichte Ebene den anderen die Treffer weg, und
    // auf der Karte fehlten Stellen, ohne dass irgendwo ein Hinweis stünde.
    const one = combinedBboxQuery(["firepits"], 46.7, 7.1, 46.9, 7.3);
    const all = combinedBboxQuery(
      ["campsites", "firepits", "family"],
      46.7,
      7.1,
      46.9,
      7.3
    );
    const limitOf = (q: string) => Number(/out center (\d+);/.exec(q)?.[1]);
    expect(limitOf(all)).toBeGreaterThan(limitOf(one));
  });

  it("das Zeit-Budget bleibt unter der Geduld des Clients", () => {
    // 10 s Server gegen 12 s Client: So darf Overpass ordentlich aufgeben
    // und uns antworten, statt mitten in der Rechnung abgeschnitten zu
    // werden – sonst beginnt derselbe Aufwand beim nächsten Spiegel neu.
    const q = combinedBboxQuery(["firepits"], 46.7, 7.1, 46.9, 7.3);
    expect(q).toContain("[out:json][timeout:10]");
  });

  it("die Koordinaten werden gekürzt, nicht in voller Länge geschickt", () => {
    const q = combinedBboxQuery(["firepits"], 46.712345678, 7.1, 46.9, 7.3);
    expect(q).toContain("46.71235");
    expect(q).not.toContain("46.712345678");
  });
});

describe("Sehenswürdigkeiten (#479)", () => {
  it("baut die Abfrage mit tourism- und historic-Filtern", () => {
    const query = sightsQuery(46.8, 8.2, 5000);
    expect(query).toContain("tourism");
    expect(query).toContain("museum|viewpoint|zoo|theme_park|attraction");
    expect(query).toContain("castle|monument");
    expect(query).toContain("around:5000,46.80000,8.20000");
  });

  it("übernimmt bekannte Arten und verwirft namenlose Attraktionen", () => {
    const sights = parseSights({
      elements: [
        {
          type: "node",
          id: 1,
          lat: 46.8,
          lon: 8.2,
          tags: { tourism: "museum", name: "Talmuseum" },
        },
        // Namenloser Aussichtspunkt bleibt drin – die Art trägt den Titel
        {
          type: "node",
          id: 2,
          lat: 46.81,
          lon: 8.21,
          tags: { tourism: "viewpoint" },
        },
        // Namenlose «Attraktion» ist Kartenrauschen und fliegt raus
        {
          type: "node",
          id: 3,
          lat: 46.82,
          lon: 8.22,
          tags: { tourism: "attraction" },
        },
        {
          type: "way",
          id: 4,
          center: { lat: 46.83, lon: 8.23 },
          tags: { historic: "castle", name: "Schloss Berg" },
        },
        {
          type: "node",
          id: 5,
          lat: 46.84,
          lon: 8.24,
          tags: { tourism: "hotel", name: "Kein Ziel" },
        },
      ],
    });
    expect(sights.map(s => s.kind)).toEqual(["museum", "viewpoint", "castle"]);
    expect(sights[2].id).toBe("way/4");
  });
});

describe("Einfache Punkt-Suchen (#487/#492/#493/#494)", () => {
  it("baut die vier Abfragen mit den richtigen Tags", () => {
    expect(beachesQuery(46.8, 8.2, 5000)).toContain('"natural"="beach"');
    expect(beachesQuery(46.8, 8.2, 5000)).toContain('"leisure"="beach_resort"');
    expect(drinkingWaterQuery(46.8, 8.2, 1000)).toContain(
      '"amenity"="drinking_water"'
    );
    expect(chargersQuery(46.8, 8.2, 5000)).toContain(
      '"amenity"="charging_station"'
    );
    expect(defibrillatorsQuery(46.8, 8.2, 1000)).toContain(
      '"emergency"="defibrillator"'
    );
    expect(defibrillatorsQuery(46.8, 8.2, 1000)).toContain(
      "around:1000,46.80000,8.20000"
    );
  });

  it("parst Punkte mit den passenden Detail-Zeilen", () => {
    const beaches = parseBeaches({
      elements: [
        {
          type: "node",
          id: 1,
          lat: 46.8,
          lon: 8.2,
          tags: { natural: "beach" },
        },
        {
          type: "way",
          id: 2,
          center: { lat: 46.81, lon: 8.21 },
          tags: { leisure: "beach_resort", name: "Strandbad See" },
        },
      ],
    });
    // Naturstrände sind oft namenlos – sie bleiben trotzdem drin
    expect(beaches).toHaveLength(2);
    expect(beaches[0].name).toBeUndefined();
    expect(beaches[1].detail).toBe("resort");

    const chargers = parseChargers({
      elements: [
        {
          type: "node",
          id: 3,
          lat: 46.8,
          lon: 8.2,
          tags: {
            amenity: "charging_station",
            operator: "Werke AG",
            capacity: "4",
          },
        },
      ],
    });
    expect(chargers[0].detail).toBe("Werke AG · 4×");

    const defis = parseDefibrillators({
      elements: [
        {
          type: "node",
          id: 4,
          lat: 46.8,
          lon: 8.2,
          tags: {
            emergency: "defibrillator",
            "defibrillator:location": "Eingang Gemeindehaus",
          },
        },
      ],
    });
    expect(defis[0].detail).toBe("Eingang Gemeindehaus");
    expect(parseDrinkingWater({ elements: [] })).toEqual([]);
  });

  it("sortiert nach Distanz und kappt die Liste", () => {
    const pois = [
      { id: "a", lat: 47.0, lon: 8.5 },
      { id: "b", lat: 46.81, lon: 8.21 },
      { id: "c", lat: 46.8, lon: 8.2 },
    ];
    const nearest = nearestPois(pois, 46.8, 8.2, 2);
    expect(nearest.map(row => row.place.id)).toEqual(["c", "b"]);
    expect(nearest[0].distanceM).toBe(0);
  });
});
