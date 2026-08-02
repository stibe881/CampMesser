import { describe, expect, it } from "vitest";
import {
  MAX_PLACE_NAME_LENGTH,
  MAX_WEATHER_PLACES,
  addWeatherPlace,
  isSameWeatherPlace,
  removeWeatherPlace,
  sanitizeWeatherPlace,
  sanitizeWeatherPlaces,
  type WeatherPlace,
} from "../client/src/lib/weatherPlaces";

function place(overrides: Partial<WeatherPlace> = {}): WeatherPlace {
  return { name: "Locarno", lat: 46.17, lon: 8.79, ...overrides };
}

describe("sanitizeWeatherPlace", () => {
  it("lässt gültige Orte unverändert durch", () => {
    expect(sanitizeWeatherPlace(place())).toEqual(place());
  });

  it("lehnt Nicht-Objekte, fehlende Namen und kaputte Koordinaten ab", () => {
    expect(sanitizeWeatherPlace(null)).toBeNull();
    expect(sanitizeWeatherPlace("Locarno")).toBeNull();
    expect(sanitizeWeatherPlace(place({ name: "   " }))).toBeNull();
    expect(
      sanitizeWeatherPlace(place({ name: 7 as unknown as string }))
    ).toBeNull();
    expect(sanitizeWeatherPlace(place({ lat: Number.NaN }))).toBeNull();
    expect(sanitizeWeatherPlace(place({ lat: 91 }))).toBeNull();
    expect(sanitizeWeatherPlace(place({ lon: 181 }))).toBeNull();
  });

  it("trimmt und kürzt den Namen", () => {
    const cleaned = sanitizeWeatherPlace(
      place({ name: `  ${"x".repeat(MAX_PLACE_NAME_LENGTH + 10)}  ` })
    );
    expect(cleaned?.name).toHaveLength(MAX_PLACE_NAME_LENGTH);
  });
});

describe("sanitizeWeatherPlaces", () => {
  it("gibt für Nicht-Arrays eine leere Liste zurück", () => {
    expect(sanitizeWeatherPlaces(null)).toEqual([]);
    expect(sanitizeWeatherPlaces("kaputt")).toEqual([]);
    expect(sanitizeWeatherPlaces({ name: "Locarno" })).toEqual([]);
  });

  it("behält gültige Einträge und verwirft ungültige", () => {
    const list = [
      place(),
      place({ name: "Scuol", lat: 46.8, lon: 10.3 }),
      place({ name: "", lat: 47 }),
      place({ name: "KaputteBreite", lat: 999 }),
      null,
      "quatsch",
    ];
    expect(sanitizeWeatherPlaces(list).map(p => p.name)).toEqual([
      "Locarno",
      "Scuol",
    ]);
  });

  it("verwirft Duplikate nach Name (case-insensitiv) oder Koordinaten", () => {
    const list = [
      place(),
      place({ name: "LOCARNO", lat: 40, lon: 5 }),
      place({ name: "Anders", lat: 46.17, lon: 8.79 }),
    ];
    expect(sanitizeWeatherPlaces(list)).toEqual([place()]);
  });

  it("begrenzt die Listenlänge auf MAX_WEATHER_PLACES", () => {
    const many = Array.from({ length: MAX_WEATHER_PLACES + 5 }, (_, i) =>
      place({ name: `Ort ${i}`, lat: 40 + i, lon: 5 + i })
    );
    expect(sanitizeWeatherPlaces(many)).toHaveLength(MAX_WEATHER_PLACES);
  });
});

describe("addWeatherPlace", () => {
  it("hängt einen gültigen Ort als NEUE Liste an", () => {
    const list = [place()];
    const next = addWeatherPlace(list, {
      name: " Scuol ",
      lat: 46.8,
      lon: 10.3,
    });
    expect(next?.map(p => p.name)).toEqual(["Locarno", "Scuol"]);
    // Eingabe bleibt unverändert (reine Funktion)
    expect(list).toHaveLength(1);
  });

  it("lehnt ungültige Orte und Duplikate ab (null)", () => {
    const list = [place()];
    expect(addWeatherPlace(list, place({ name: "  " }))).toBeNull();
    expect(addWeatherPlace(list, place({ lat: 91 }))).toBeNull();
    expect(addWeatherPlace(list, place({ name: "locarno" }))).toBeNull();
    expect(addWeatherPlace(list, place({ name: "Gleicher Punkt" }))).toBeNull();
  });

  it("lehnt das Anhängen an eine volle Liste ab", () => {
    const full = Array.from({ length: MAX_WEATHER_PLACES }, (_, i) =>
      place({ name: `Ort ${i}`, lat: 40 + i, lon: 5 + i })
    );
    expect(addWeatherPlace(full, place({ name: "Zu viel" }))).toBeNull();
  });
});

describe("removeWeatherPlace", () => {
  const list = [place(), place({ name: "Scuol", lat: 46.8, lon: 10.3 })];

  it("entfernt genau den passenden Ort (NEUE Liste)", () => {
    const next = removeWeatherPlace(list, place());
    expect(next.map(p => p.name)).toEqual(["Scuol"]);
    expect(list).toHaveLength(2);
  });

  it("lässt die Liste bei unbekanntem Ort unangetastet", () => {
    expect(
      removeWeatherPlace(list, place({ name: "Anderswo", lat: 10, lon: 10 }))
    ).toEqual(list);
  });
});

describe("isSameWeatherPlace", () => {
  it("erkennt gleiche Namen unabhängig von der Schreibung", () => {
    expect(isSameWeatherPlace(place(), place({ name: "lOcArNo" }))).toBe(true);
  });

  it("erkennt praktisch identische Koordinaten trotz anderem Namen", () => {
    expect(
      isSameWeatherPlace(
        place(),
        place({ name: "Anders", lat: 46.17004, lon: 8.79004 })
      )
    ).toBe(true);
  });

  it("unterscheidet verschiedene Orte", () => {
    expect(
      isSameWeatherPlace(
        place(),
        place({ name: "Scuol", lat: 46.8, lon: 10.3 })
      )
    ).toBe(false);
  });
});
