import { describe, expect, it } from "vitest";
import {
  BBOX_GRID_DEG,
  isFresh,
  OVERPASS_CACHE_TTL_MS,
  orderEndpoints,
  overpassCacheKey,
  putCacheEntry,
  snapBBox,
} from "@shared/overpassCache";

const BOX = { south: 46.941, west: 7.432, north: 46.968, east: 7.471 };

describe("Ausschnitt aufs Raster runden", () => {
  it("der gerundete Ausschnitt UMFASST den gefragten", () => {
    // Wäre er kleiner, fehlten am Rand Feuerstellen – und zwar
    // stillschweigend, weil die Karte ja Treffer zeigt.
    const s = snapBBox(BOX);
    expect(s.south).toBeLessThanOrEqual(BOX.south);
    expect(s.west).toBeLessThanOrEqual(BOX.west);
    expect(s.north).toBeGreaterThanOrEqual(BOX.north);
    expect(s.east).toBeGreaterThanOrEqual(BOX.east);
  });

  it("kleines Verschieben trifft denselben Schlüssel", () => {
    // Genau darum geht es: Ohne Rundung wäre jeder Kartenschubs ein
    // neuer Schlüssel und der Zwischenspeicher nutzlos.
    const nudged = {
      south: BOX.south + 0.001,
      west: BOX.west + 0.001,
      north: BOX.north - 0.001,
      east: BOX.east - 0.001,
    };
    expect(overpassCacheKey(nudged, ["firepits"])).toBe(
      overpassCacheKey(BOX, ["firepits"])
    );
  });

  it("eine ganze Rasterzelle weiter ist ein anderer Schlüssel", () => {
    const far = {
      south: BOX.south + BBOX_GRID_DEG * 2,
      west: BOX.west + BBOX_GRID_DEG * 2,
      north: BOX.north + BBOX_GRID_DEG * 2,
      east: BOX.east + BBOX_GRID_DEG * 2,
    };
    expect(overpassCacheKey(far, ["firepits"])).not.toBe(
      overpassCacheKey(BOX, ["firepits"])
    );
  });

  it("die Reihenfolge der Arten ändert den Schlüssel nicht", () => {
    expect(overpassCacheKey(BOX, ["firepits", "campsites"])).toBe(
      overpassCacheKey(BOX, ["campsites", "firepits"])
    );
  });

  it("andere Arten sind ein anderer Schlüssel", () => {
    expect(overpassCacheKey(BOX, ["firepits"])).not.toBe(
      overpassCacheKey(BOX, ["firepits", "family"])
    );
  });
});

describe("Frische", () => {
  const now = 1_800_000_000_000;

  it("frisch innerhalb der Frist", () => {
    expect(isFresh({ at: now - 60_000 }, now)).toBe(true);
  });

  it("abgelaufen danach", () => {
    expect(isFresh({ at: now - OVERPASS_CACHE_TTL_MS - 1 }, now)).toBe(false);
  });

  it("nichts Gespeichertes ist nie frisch", () => {
    expect(isFresh(undefined, now)).toBe(false);
  });

  it("ein Eintrag aus der Zukunft gilt als kaputt", () => {
    // Verstellte Uhr: Ohne diese Regel bliebe der Eintrag für immer
    // «frisch» und die Karte zeigte ewig alte Daten.
    expect(isFresh({ at: now + 60_000 }, now)).toBe(false);
  });
});

describe("Speicher begrenzen", () => {
  it("die ältesten Einträge fallen weg", () => {
    let store: Record<string, { at: number; data: number }> = {};
    for (let i = 0; i < 5; i++) {
      store = putCacheEntry(store, `k${i}`, i, 1000 + i, 3);
    }
    expect(Object.keys(store).sort()).toEqual(["k2", "k3", "k4"]);
  });

  it("ein bestehender Schlüssel wird aufgefrischt, nicht verdoppelt", () => {
    let store = putCacheEntry({}, "k", 1, 1000);
    store = putCacheEntry(store, "k", 2, 2000);
    expect(Object.keys(store)).toEqual(["k"]);
    expect(store.k).toEqual({ at: 2000, data: 2 });
  });
});

describe("Spiegel-Reihenfolge", () => {
  const list = ["a", "b", "c"];

  it("der zuletzt erfolgreiche kommt zuerst", () => {
    expect(orderEndpoints(list, "c")).toEqual(["c", "a", "b"]);
  });

  it("ohne Merkposten bleibt die Reihenfolge", () => {
    expect(orderEndpoints(list, null)).toEqual(list);
  });

  it("ein unbekannter Merkposten wird ignoriert", () => {
    // Ein gemerkter Name ist ein Vorschlag, keine Erlaubnis, an der
    // Liste vorbei zu fragen – sonst hinge ein abgeschalteter Spiegel
    // ewig im Speicher.
    expect(orderEndpoints(list, "https://boese.example")).toEqual(list);
  });
});
