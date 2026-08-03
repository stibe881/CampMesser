import { describe, expect, it } from "vitest";
import {
  costLevelSymbols,
  excursionCategories,
  excursionDistanceM,
  excursionsRequestUrl,
  EXCURSIONS_SELECT,
  EXCURSIONS_SELECT_WITHOUT_CATEGORIES,
  MAX_COST_LEVEL,
  nearestExcursions,
  normalizeCostLevel,
  parseExcursion,
  parseExcursions,
  parseSeasons,
  photoUrls,
  primaryPhotoUrl,
  sortByDistance,
  SEASON_KEYS,
  type Excursion,
} from "@shared/excursions";

/** Eine Zeile, wie sie PostgREST liefert – vollständig gepflegt. */
const FULL_ROW = {
  id: 12,
  name: "Trümmelbachfälle",
  beschreibung: "Zehn Gletscherwasserfälle im Berginnern.",
  adresse: "3824 Lauterbrunnen",
  land: "Schweiz",
  region: "Berner Oberland",
  kategorie_alt: "Natur",
  parkplatz: "Parkplatz beim Eingang",
  parkplatz_kostenlos: false,
  kosten_stufe: 3,
  jahreszeiten: "spring,summer,autumn",
  website_url: "https://truemmelbachfaelle.ch",
  lat: 46.5837,
  lng: 7.9105,
  nice_to_know: "Warme Jacke mitnehmen, im Berg ist es kühl.",
  dauer_min: null,
  dauer_max: null,
  dauer_stunden: 2,
  distanz_km: 1.5,
  is_rundtour: true,
  is_von_a_nach_b: false,
  altersempfehlung: "ab 4 Jahren",
  suitable_for_babies: false,
  opening_hours: "April bis November, 9–17 Uhr",
  status: "approved",
  created_at: "2026-05-01T10:00:00Z",
  ausfluege_fotos: [
    { full_url: "https://example.org/zweit.jpg", is_primary: false },
    { full_url: "https://example.org/titel.jpg", is_primary: true },
  ],
  ausflug_kategorien: [
    { kategorien: { id: 1, name: "Natur" } },
    { kategorien: { id: 2, name: "Familie" } },
  ],
};

/** Kürzest mögliche brauchbare Zeile: Name und Koordinaten, sonst nichts. */
const MINIMAL_ROW = { id: "abc", name: "Feuerstelle", lat: 47, lng: 8 };

function excursionAt(id: string, lat: number, lon: number): Excursion {
  return {
    id,
    name: id,
    description: null,
    address: null,
    country: null,
    region: null,
    categories: [],
    seasons: [],
    costLevel: null,
    parking: null,
    parkingFree: null,
    websiteUrl: null,
    latitude: lat,
    longitude: lon,
    niceToKnow: null,
    openingHours: null,
    lengthKm: null,
    tourShape: null,
    ageAdvice: null,
    suitableForBabies: false,
    photoUrl: null,
    photoUrls: [],
  };
}

describe("excursionsRequestUrl", () => {
  it("baut die PostgREST-Adresse aus der Projekt-URL", () => {
    const url = excursionsRequestUrl("https://beispiel.supabase.co");
    expect(
      url.startsWith("https://beispiel.supabase.co/rest/v1/ausfluege?")
    ).toBe(true);
    const params = new URL(url).searchParams;
    expect(params.get("select")).toBe(EXCURSIONS_SELECT);
    expect(params.get("order")).toBe("name.asc");
    expect(Number(params.get("limit"))).toBeGreaterThan(0);
  });

  it("verträgt Schrägstriche am Ende und eine bereits vollständige REST-Basis", () => {
    const a = excursionsRequestUrl("https://beispiel.supabase.co/");
    const b = excursionsRequestUrl("https://beispiel.supabase.co/rest/v1/");
    const c = excursionsRequestUrl("  https://beispiel.supabase.co  ");
    expect(a).toBe(b);
    expect(a).toBe(c);
    expect(a.includes("/rest/v1/rest/v1/")).toBe(false);
  });

  it("filtert NICHT auf status – alle Ziele sollen erscheinen", () => {
    expect(excursionsRequestUrl("https://beispiel.supabase.co")).not.toContain(
      "status"
    );
  });

  it("nimmt die Ausweich-Abfrage ohne Kategorien entgegen", () => {
    const url = excursionsRequestUrl(
      "https://beispiel.supabase.co",
      EXCURSIONS_SELECT_WITHOUT_CATEGORIES
    );
    expect(new URL(url).searchParams.get("select")).toBe(
      EXCURSIONS_SELECT_WITHOUT_CATEGORIES
    );
    expect(EXCURSIONS_SELECT_WITHOUT_CATEGORIES).not.toContain("kategorien");
  });
});

describe("parseSeasons", () => {
  it("liest die CSV-Schreibweise der App", () => {
    expect(parseSeasons("spring,summer,autumn")).toEqual([
      "spring",
      "summer",
      "autumn",
    ]);
  });

  it("sortiert nach dem Jahreslauf, nicht nach der Zeichenkette", () => {
    expect(parseSeasons("winter,spring")).toEqual(["spring", "winter"]);
  });

  it("verträgt Leerzeichen, Grossschreibung und Doppelte", () => {
    expect(parseSeasons(" Summer , summer;WINTER ")).toEqual([
      "summer",
      "winter",
    ]);
  });

  it("verwirft Unbekanntes statt zu raten", () => {
    expect(parseSeasons("spring,,quatsch,42")).toEqual(["spring"]);
    expect(parseSeasons("")).toEqual([]);
    expect(parseSeasons(null)).toEqual([]);
    expect(parseSeasons(undefined)).toEqual([]);
    expect(parseSeasons(["spring"])).toEqual([]);
    expect(parseSeasons(7)).toEqual([]);
  });

  it("kennt auch deutsche Schreibweisen und «fall»", () => {
    expect(parseSeasons("Frühling,Sommer,Herbst,Winter")).toEqual([
      ...SEASON_KEYS,
    ]);
    expect(parseSeasons("fall")).toEqual(["autumn"]);
  });
});

describe("Kostenstufe", () => {
  it("säubert die Stufe auf 0 bis 4", () => {
    expect(normalizeCostLevel(0)).toBe(0);
    expect(normalizeCostLevel(4)).toBe(MAX_COST_LEVEL);
    expect(normalizeCostLevel("3")).toBe(3);
    expect(normalizeCostLevel(2.4)).toBe(2);
  });

  it("meldet Unbrauchbares als «keine Angabe»", () => {
    expect(normalizeCostLevel(null)).toBeNull();
    expect(normalizeCostLevel(undefined)).toBeNull();
    expect(normalizeCostLevel(-1)).toBeNull();
    expect(normalizeCostLevel(5)).toBeNull();
    expect(normalizeCostLevel("gratis")).toBeNull();
    expect(normalizeCostLevel(Number.NaN)).toBeNull();
  });

  it("zeigt die Stufe als CHF-Symbole", () => {
    expect(costLevelSymbols(3)).toBe("CHF CHF CHF");
    expect(costLevelSymbols(1)).toBe("CHF");
    // Stufe 0 ergibt eine leere Zeichenkette – die Oberfläche schreibt «gratis»
    expect(costLevelSymbols(0)).toBe("");
    expect(costLevelSymbols(null)).toBeNull();
    expect(costLevelSymbols(undefined)).toBeNull();
  });
});

describe("Titelbild", () => {
  it("nimmt das als primary markierte Foto", () => {
    expect(primaryPhotoUrl(FULL_ROW.ausfluege_fotos)).toBe(
      "https://example.org/titel.jpg"
    );
  });

  it("nimmt sonst das erste brauchbare Foto", () => {
    expect(
      primaryPhotoUrl([
        { full_url: "https://example.org/a.jpg", is_primary: false },
        { full_url: "https://example.org/b.jpg", is_primary: false },
      ])
    ).toBe("https://example.org/a.jpg");
  });

  it("kommt ohne Fotos und mit kaputten Einträgen zurecht", () => {
    expect(primaryPhotoUrl([])).toBeNull();
    expect(primaryPhotoUrl(null)).toBeNull();
    expect(primaryPhotoUrl(undefined)).toBeNull();
    expect(primaryPhotoUrl("nope")).toBeNull();
    expect(primaryPhotoUrl([{ full_url: null }, null, 7])).toBeNull();
    expect(primaryPhotoUrl([{ full_url: "   " }])).toBeNull();
  });

  it("lässt nur http(s)-Adressen durch", () => {
    expect(primaryPhotoUrl([{ full_url: "javascript:alert(1)" }])).toBeNull();
    expect(primaryPhotoUrl([{ full_url: "/lokal.jpg" }])).toBeNull();
  });

  it("listet alle Bilder mit dem Titelbild zuerst, ohne Doppelte", () => {
    expect(
      photoUrls([
        { full_url: "https://example.org/a.jpg", is_primary: false },
        { full_url: "https://example.org/b.jpg", is_primary: true },
        { full_url: "https://example.org/a.jpg", is_primary: false },
      ])
    ).toEqual(["https://example.org/b.jpg", "https://example.org/a.jpg"]);
  });
});

describe("excursionCategories", () => {
  it("liest die Verknüpfungstabelle", () => {
    expect(excursionCategories(FULL_ROW)).toEqual(["Natur", "Familie"]);
  });

  it("liest auch die direkte Einbettung von kategorien", () => {
    expect(
      excursionCategories({
        kategorien: [{ name: "Wandern" }, { name: "See" }],
      })
    ).toEqual(["Wandern", "See"]);
  });

  it("fällt auf kategorie_alt zurück, wenn keine Verknüpfung da ist", () => {
    expect(excursionCategories({ kategorie_alt: "Aussicht" })).toEqual([
      "Aussicht",
    ]);
    expect(
      excursionCategories({ ausflug_kategorien: [], kategorie_alt: "Aussicht" })
    ).toEqual(["Aussicht"]);
  });

  it("entfernt Doppelte unabhängig von der Schreibweise", () => {
    expect(
      excursionCategories({
        ausflug_kategorien: [
          { kategorien: { name: "Natur" } },
          { kategorien: { name: "natur" } },
        ],
      })
    ).toEqual(["Natur"]);
  });

  it("liefert ohne jede Angabe eine leere Liste", () => {
    expect(excursionCategories({})).toEqual([]);
    expect(
      excursionCategories({ ausflug_kategorien: [null, { kategorien: null }] })
    ).toEqual([]);
  });
});

describe("parseExcursion", () => {
  it("liest eine vollständige Zeile", () => {
    const excursion = parseExcursion(FULL_ROW);
    expect(excursion).not.toBeNull();
    if (!excursion) return;
    expect(excursion.id).toBe("12");
    expect(excursion.name).toBe("Trümmelbachfälle");
    expect(excursion.region).toBe("Berner Oberland");
    expect(excursion.categories).toEqual(["Natur", "Familie"]);
    expect(excursion.seasons).toEqual(["spring", "summer", "autumn"]);
    expect(excursion.costLevel).toBe(3);
    expect(excursion.parkingFree).toBe(false);
    expect(excursion.websiteUrl).toBe("https://truemmelbachfaelle.ch");
    expect(excursion.photoUrl).toBe("https://example.org/titel.jpg");
    expect(excursion.photoUrls).toHaveLength(2);
    expect(excursion.lengthKm).toBe(1.5);
    expect(excursion.tourShape).toBe("loop");
    expect(excursion.openingHours).toBe("April bis November, 9–17 Uhr");
    expect(excursion.suitableForBabies).toBe(false);
  });

  it("füllt fehlende Felder mit null statt mit Erfundenem", () => {
    const excursion = parseExcursion(MINIMAL_ROW);
    expect(excursion).not.toBeNull();
    if (!excursion) return;
    expect(excursion.description).toBeNull();
    expect(excursion.region).toBeNull();
    expect(excursion.costLevel).toBeNull();
    expect(excursion.parkingFree).toBeNull();
    expect(excursion.openingHours).toBeNull();
    expect(excursion.ageAdvice).toBeNull();
    expect(excursion.tourShape).toBeNull();
    expect(excursion.photoUrl).toBeNull();
    expect(excursion.photoUrls).toEqual([]);
    expect(excursion.categories).toEqual([]);
    expect(excursion.seasons).toEqual([]);
    expect(excursion.suitableForBabies).toBe(false);
  });

  it("wirft leere Texte weg, statt sie als Inhalt auszugeben", () => {
    const excursion = parseExcursion({
      ...MINIMAL_ROW,
      beschreibung: "   ",
      region: "",
    });
    expect(excursion?.description).toBeNull();
    expect(excursion?.region).toBeNull();
  });

  it("verwirft Zeilen ohne Koordinaten, ohne Namen oder mit Unsinn", () => {
    expect(parseExcursion({ ...MINIMAL_ROW, lat: null })).toBeNull();
    expect(parseExcursion({ ...MINIMAL_ROW, lng: undefined })).toBeNull();
    expect(parseExcursion({ ...MINIMAL_ROW, lat: 95 })).toBeNull();
    expect(parseExcursion({ ...MINIMAL_ROW, lng: 250 })).toBeNull();
    expect(parseExcursion({ ...MINIMAL_ROW, name: "  " })).toBeNull();
    expect(parseExcursion({ lat: 47, lng: 8, name: "Ohne Id" })).toBeNull();
    expect(parseExcursion(null)).toBeNull();
    expect(parseExcursion([MINIMAL_ROW])).toBeNull();
    expect(parseExcursion("nope")).toBeNull();
  });

  it("liest Koordinaten auch als Zeichenkette (PostgREST-Numerik)", () => {
    const excursion = parseExcursion({
      ...MINIMAL_ROW,
      lat: "47.1",
      lng: "8.2",
    });
    expect(excursion?.latitude).toBeCloseTo(47.1, 5);
    expect(excursion?.longitude).toBeCloseTo(8.2, 5);
  });

  it("erkennt «von A nach B», wenn keine Rundtour gesetzt ist", () => {
    expect(
      parseExcursion({ ...MINIMAL_ROW, is_von_a_nach_b: true })?.tourShape
    ).toBe("aToB");
    expect(
      parseExcursion({
        ...MINIMAL_ROW,
        is_rundtour: false,
        is_von_a_nach_b: false,
      })?.tourShape
    ).toBeNull();
  });
});

describe("parseExcursions", () => {
  it("liest eine Antwort und überspringt unbrauchbare Zeilen still", () => {
    const list = parseExcursions([
      FULL_ROW,
      MINIMAL_ROW,
      { id: 3, name: "Ohne Ort" },
      null,
    ]);
    expect(list.map(e => e.name)).toEqual(["Trümmelbachfälle", "Feuerstelle"]);
  });

  it("liefert bei einer kaputten Antwort eine leere Liste", () => {
    expect(parseExcursions(null)).toEqual([]);
    expect(parseExcursions({ message: "permission denied" })).toEqual([]);
    expect(parseExcursions("[]")).toEqual([]);
  });
});

describe("Distanz und Auswahl", () => {
  const bern = { lat: 46.948, lon: 7.447 };
  const list = [
    excursionAt("weit", 47.376, 8.541), // Zürich
    excursionAt("nah", 46.95, 7.45), // Bern
    excursionAt("mittel", 46.686, 7.663), // Thun
  ];

  it("misst die Luftlinie zum Bezugspunkt", () => {
    const meters = excursionDistanceM(list[1], bern.lat, bern.lon);
    expect(meters).toBeLessThan(500);
    expect(excursionDistanceM(list[0], bern.lat, bern.lon)).toBeGreaterThan(
      90000
    );
  });

  it("sortiert nach Distanz", () => {
    expect(
      sortByDistance(list, bern.lat, bern.lon).map(e => e.excursion.id)
    ).toEqual(["nah", "mittel", "weit"]);
  });

  it("entscheidet bei gleicher Distanz nach dem Namen (stabile Reihenfolge)", () => {
    const same = [excursionAt("Bravo", 47, 8), excursionAt("Alpha", 47, 8)];
    expect(sortByDistance(same, 47, 8).map(e => e.excursion.id)).toEqual([
      "Alpha",
      "Bravo",
    ]);
  });

  it("liefert nur die gewünschte Anzahl der nächsten Ziele", () => {
    const nearest = nearestExcursions(list, bern.lat, bern.lon, 2);
    expect(nearest.map(e => e.excursion.id)).toEqual(["nah", "mittel"]);
    expect(nearest[0].distanceM).toBeLessThan(nearest[1].distanceM);
  });

  it("kommt mit leerer Liste und unsinnigem Limit zurecht", () => {
    expect(nearestExcursions([], bern.lat, bern.lon, 8)).toEqual([]);
    expect(nearestExcursions(list, bern.lat, bern.lon, 0)).toEqual([]);
    expect(nearestExcursions(list, bern.lat, bern.lon, -3)).toEqual([]);
    expect(nearestExcursions(list, bern.lat, bern.lon, 99)).toHaveLength(3);
  });

  it("verändert die übergebene Liste nicht", () => {
    const original = [...list];
    nearestExcursions(list, bern.lat, bern.lon, 1);
    expect(list).toEqual(original);
  });
});
