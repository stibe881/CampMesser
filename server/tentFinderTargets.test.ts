import { describe, expect, it } from "vitest";
import {
  MAX_NAME_LENGTH,
  MAX_TARGETS,
  migrateTargets,
  newTargetId,
  renameTarget,
  sanitizeTargets,
  type TentFinderTarget,
} from "../client/src/lib/tentFinderTargets";

function target(overrides: Partial<TentFinderTarget> = {}): TentFinderTarget {
  return {
    id: "a",
    name: "Zelt",
    lat: 46.95,
    lon: 7.44,
    savedAt: 1_700_000_000_000,
    ...overrides,
  };
}

describe("sanitizeTargets", () => {
  it("gibt für Nicht-Arrays eine leere Liste zurück", () => {
    expect(sanitizeTargets(null)).toEqual([]);
    expect(sanitizeTargets("kaputt")).toEqual([]);
    expect(sanitizeTargets({ id: "a" })).toEqual([]);
  });

  it("behält gültige Einträge unverändert", () => {
    const list = [target(), target({ id: "b", name: "Duschen", lat: -33.9 })];
    expect(sanitizeTargets(list)).toEqual(list);
  });

  it("verwirft Einträge ohne Namen oder mit ungültigen Koordinaten", () => {
    const list = [
      target({ id: "ok" }),
      target({ id: "leer", name: "   " }),
      target({ id: "keinName", name: 7 as unknown as string }),
      target({ id: "latKaputt", lat: Number.NaN }),
      target({ id: "latZuGross", lat: 91 }),
      target({ id: "lonZuGross", lon: 181 }),
      null,
      "quatsch",
    ];
    expect(sanitizeTargets(list).map(t => t.id)).toEqual(["ok"]);
  });

  it("trimmt und kürzt Namen, repariert savedAt und fehlende ids", () => {
    const [cleaned] = sanitizeTargets([
      target({
        id: undefined as unknown as string,
        name: `  ${"x".repeat(MAX_NAME_LENGTH + 10)}  `,
        savedAt: "gestern" as unknown as number,
      }),
    ]);
    expect(cleaned.name).toHaveLength(MAX_NAME_LENGTH);
    expect(cleaned.savedAt).toBe(0);
    expect(cleaned.id).toBe("target-0-0");
  });

  it("verwirft doppelte ids und begrenzt die Listenlänge", () => {
    const dupes = [target(), target({ name: "Kopie" })];
    expect(sanitizeTargets(dupes)).toHaveLength(1);

    const many = Array.from({ length: MAX_TARGETS + 5 }, (_, i) =>
      target({ id: `t${i}` })
    );
    expect(sanitizeTargets(many)).toHaveLength(MAX_TARGETS);
  });
});

describe("migrateTargets", () => {
  const legacyRaw = JSON.stringify({
    lat: 46.95,
    lon: 7.44,
    savedAt: 1_700_000_000_000,
  });

  it("lässt eine bestehende Liste ohne Alt-Schlüssel unangetastet", () => {
    const raw = JSON.stringify([target()]);
    const { targets, changed } = migrateTargets(raw, null, "Zelt");
    expect(changed).toBe(false);
    expect(targets).toEqual([target()]);
  });

  it("übernimmt das alte Einzel-Ziel als benannten Eintrag", () => {
    const { targets, changed } = migrateTargets(null, legacyRaw, "Zelt");
    expect(changed).toBe(true);
    expect(targets).toEqual([
      {
        id: "legacy-1700000000000",
        name: "Zelt",
        lat: 46.95,
        lon: 7.44,
        savedAt: 1_700_000_000_000,
      },
    ]);
  });

  it("hängt das Alt-Ziel an eine bereits bestehende Liste an", () => {
    const raw = JSON.stringify([target({ id: "b", name: "Duschen" })]);
    const { targets, changed } = migrateTargets(raw, legacyRaw, "Zelt");
    expect(changed).toBe(true);
    expect(targets.map(t => t.name)).toEqual(["Duschen", "Zelt"]);
  });

  it("räumt kaputte oder ungültige Alt-Werte nur auf (changed, nichts übernommen)", () => {
    expect(migrateTargets(null, "kein json", "Zelt")).toEqual({
      targets: [],
      changed: true,
    });
    const invalid = JSON.stringify({ lat: 999, lon: 7.44 });
    expect(migrateTargets(null, invalid, "Zelt")).toEqual({
      targets: [],
      changed: true,
    });
  });

  it("übersteht eine kaputte Liste und rettet das Alt-Ziel", () => {
    const { targets, changed } = migrateTargets("{{{", legacyRaw, "Zelt");
    expect(changed).toBe(true);
    expect(targets.map(t => t.name)).toEqual(["Zelt"]);
  });
});

describe("renameTarget", () => {
  const list = [target(), target({ id: "b", name: "Duschen" })];

  it("benennt genau das Ziel mit der id um und lässt andere unangetastet", () => {
    const renamed = renameTarget(list, "b", "Abwaschstelle");
    expect(renamed?.map(t => t.name)).toEqual(["Zelt", "Abwaschstelle"]);
    // Koordinaten und id bleiben erhalten
    expect(renamed?.[1]).toMatchObject({ id: "b", lat: 46.95, lon: 7.44 });
  });

  it("trimmt und kürzt den neuen Namen wie beim Anlegen", () => {
    const renamed = renameTarget(
      list,
      "a",
      `  ${"x".repeat(MAX_NAME_LENGTH + 10)}  `
    );
    expect(renamed?.[0].name).toHaveLength(MAX_NAME_LENGTH);
  });

  it("lehnt leere Namen und unbekannte ids ab (null)", () => {
    expect(renameTarget(list, "a", "   ")).toBeNull();
    expect(renameTarget(list, "gibtsNicht", "Neu")).toBeNull();
  });

  it("ändert die übergebene Liste nicht (reine Funktion)", () => {
    renameTarget(list, "b", "Neu");
    expect(list[1].name).toBe("Duschen");
  });
});

describe("newTargetId", () => {
  it("liefert nicht-leere, unterschiedliche ids", () => {
    const a = newTargetId();
    const b = newTargetId();
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
    expect(a).not.toBe(b);
  });
});
