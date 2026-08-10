import { describe, expect, it } from "vitest";
import {
  DEFAULT_PAYLOAD_PLAN,
  checkLimit,
  evaluatePayload,
  formatKg,
  noseWeightRule,
  sanitizePayloadPlan,
  sumLoads,
  type PayloadCheckKey,
} from "@shared/payload";
import {
  defaultVehicles,
  migrateVehicles,
  parseKgInput,
  sanitizeVehicles,
  selectedVehicleId,
  type VehicleProfile,
} from "@shared/vehicles";

const names = { tent: "Zelt", bus: "Bus", caravan: "Wohnwagen" };

function vehicle(over: Partial<VehicleProfile>): VehicleProfile {
  return {
    id: "v1",
    name: "Fahrzeug",
    kind: "bus",
    role: "tow",
    emptyKg: null,
    grossKg: null,
    towKg: null,
    noseKg: null,
    axleKg: null,
    tireFrontBar: null,
    tireRearBar: null,
    serviceDue: null,
    wheelbaseCm: null,
    trackCm: null,
    ...over,
  };
}

/** Bequemer Zugriff auf eine einzelne Ampel. */
function check(
  result: ReturnType<typeof evaluatePayload>,
  key: PayloadCheckKey
) {
  const found = result.checks.find(c => c.key === key);
  if (!found) throw new Error(`Ampel ${key} fehlt`);
  return found;
}

const car = vehicle({
  id: "auto",
  name: "Kombi",
  kind: "bus",
  role: "tow",
  emptyKg: 1600,
  grossKg: 2100,
  towKg: 1500,
  noseKg: 75,
});

const caravan = vehicle({
  id: "wowa",
  name: "Wohnwagen",
  kind: "caravan",
  role: "trailer",
  emptyKg: 1050,
  grossKg: 1400,
  towKg: null,
  noseKg: 100,
  axleKg: 1300,
});

describe("sumLoads", () => {
  it("summiert je Position und ignoriert Unsinn", () => {
    const totals = sumLoads([
      { kg: 20, where: "tow" },
      { kg: 12.5, where: "trailer" },
      { kg: -5, where: "tow" },
      { kg: Number.NaN, where: "trailer" },
    ]);
    expect(totals).toEqual({ tow: 20, trailer: 12.5 });
  });

  it("liefert ohne Ladung zwei Nullen", () => {
    expect(sumLoads([])).toEqual({ tow: 0, trailer: 0 });
  });
});

describe("checkLimit", () => {
  it("meldet grün, solange genug Luft bleibt", () => {
    const c = checkLimit("towGross", 1800, 2100);
    expect(c.status).toBe("ok");
    expect(c.freeKg).toBe(300);
    expect(c.overKg).toBe(0);
    expect(c.percent).toBe(86);
  });

  it("zählt exakt am Limit noch nicht als Überladung", () => {
    const c = checkLimit("towGross", 2100, 2100);
    expect(c.status).toBe("tight");
    expect(c.freeKg).toBe(0);
    expect(c.overKg).toBe(0);
    expect(c.percent).toBe(100);
  });

  it("meldet rot mit der Überschreitung in kg", () => {
    const c = checkLimit("towGross", 2180.4, 2100);
    expect(c.status).toBe("over");
    expect(c.overKg).toBe(80.4);
    expect(c.freeKg).toBe(0);
  });

  it("bleibt grau, wenn Grenzwert oder Ist-Wert fehlen", () => {
    expect(checkLimit("towGross", 1800, null).status).toBe("unknown");
    expect(checkLimit("towGross", 1800, null).missing).toBe("limit");
    expect(checkLimit("towGross", null, 2100).missing).toBe("value");
    expect(
      checkLimit("towAxle", null, 1200, { notComputable: true }).missing
    ).toBe("notComputable");
  });
});

describe("evaluatePayload", () => {
  it("rechnet die Stützlast beim Zugfahrzeug zum Gesamtgewicht", () => {
    const result = evaluatePayload({
      towing: car,
      trailer: caravan,
      loads: [
        { kg: 150, where: "tow" },
        { kg: 200, where: "trailer" },
      ],
      measuredNoseKg: 70,
    });
    expect(result.trailerTotalKg).toBe(1250);
    // 1600 Leergewicht + 150 Zuladung + 70 Stützlast
    expect(result.towTotalKg).toBe(1820);
    expect(result.trainTotalKg).toBe(3070);
    expect(check(result, "towGross").status).toBe("ok");
    expect(check(result, "towGross").freeKg).toBe(280);
    expect(check(result, "trailerGross").freeKg).toBe(150);
    expect(check(result, "towCapacity").actualKg).toBe(1250);
    expect(check(result, "towCapacity").freeKg).toBe(250);
    expect(result.worst).toBe("ok");
  });

  it("nimmt den kleineren der beiden Stützlast-Grenzwerte", () => {
    const result = evaluatePayload({
      towing: car, // 75 kg
      trailer: caravan, // 100 kg
      loads: [],
      measuredNoseKg: 80,
    });
    const nose = check(result, "noseWeight");
    expect(nose.limitKg).toBe(75);
    expect(nose.status).toBe("over");
    expect(nose.overKg).toBe(5);
    expect(nose.estimated).toBe(false);
    expect(result.worst).toBe("over");
  });

  it("schätzt die Stützlast nach der Faustregel, wenn sie nicht gewogen ist", () => {
    const result = evaluatePayload({
      towing: car,
      trailer: caravan,
      loads: [{ kg: 150, where: "trailer" }],
      measuredNoseKg: null,
    });
    expect(result.trailerTotalKg).toBe(1200);
    expect(result.noseKg).toBe(60); // 5 % von 1200
    expect(result.noseEstimated).toBe(true);
    expect(check(result, "noseWeight").estimated).toBe(true);
    // Einachser-Näherung: Gesamtgewicht minus Stützlast liegt auf der Achse
    expect(check(result, "trailerAxle").actualKg).toBe(1140);
    expect(check(result, "trailerAxle").status).toBe("ok");
  });

  it("meldet die Überladung des Anhängers in Kilo", () => {
    const result = evaluatePayload({
      towing: car,
      trailer: caravan,
      loads: [{ kg: 420, where: "trailer" }],
      measuredNoseKg: 70,
    });
    expect(check(result, "trailerGross").status).toBe("over");
    expect(check(result, "trailerGross").overKg).toBe(70);
    // 1470 kg tatsächliches Anhängergewicht bei 1500 kg Anhängelast: knapp
    expect(check(result, "towCapacity").status).toBe("tight");
    expect(check(result, "towCapacity").freeKg).toBe(30);
    expect(result.worst).toBe("over");
  });

  it("prüft einen Anhänger auch ohne Zugfahrzeug", () => {
    const result = evaluatePayload({
      towing: null,
      trailer: caravan,
      loads: [{ kg: 200, where: "trailer" }],
      measuredNoseKg: null,
    });
    expect(result.towTotalKg).toBeNull();
    expect(result.trainTotalKg).toBeNull();
    expect(check(result, "trailerGross").status).toBe("ok");
    // Ohne Zugfahrzeug fehlt die zulässige Anhängelast
    expect(check(result, "towCapacity").status).toBe("unknown");
    expect(check(result, "towCapacity").missing).toBe("limit");
    // Die Stützlast-Grenze des Anhängers gilt weiterhin
    expect(check(result, "noseWeight").limitKg).toBe(100);
    expect(result.checks.some(c => c.key === "towGross")).toBe(false);
  });

  it("bleibt ohne Leergewicht grau statt grün", () => {
    const result = evaluatePayload({
      towing: vehicle({ id: "auto", grossKg: 2100 }),
      trailer: null,
      loads: [{ kg: 300, where: "tow" }],
      measuredNoseKg: null,
    });
    expect(result.towTotalKg).toBeNull();
    expect(check(result, "towGross").status).toBe("unknown");
    expect(check(result, "towGross").missing).toBe("value");
    expect(result.worst).toBe("unknown");
  });

  it("rechnet ein Einzelfahrzeug ohne Anhänger durch", () => {
    const result = evaluatePayload({
      towing: vehicle({ id: "bus", emptyKg: 2800, grossKg: 3500 }),
      trailer: null,
      loads: [
        { kg: 150, where: "tow" },
        { kg: 999, where: "trailer" },
      ],
      measuredNoseKg: null,
    });
    // Ladung «im Anhänger» zählt ohne Anhänger nirgends mit
    expect(result.towTotalKg).toBe(2950);
    expect(result.trainTotalKg).toBe(2950);
    expect(result.noseKg).toBeNull();
    expect(result.checks.map(c => c.key)).toEqual(["towGross"]);
  });

  it("erklärt die Achslast des Zugfahrzeugs als nicht berechenbar", () => {
    const result = evaluatePayload({
      towing: vehicle({ emptyKg: 1600, grossKg: 2100, axleKg: 1100 }),
      trailer: null,
      loads: [],
      measuredNoseKg: null,
    });
    const axle = check(result, "towAxle");
    expect(axle.status).toBe("unknown");
    expect(axle.missing).toBe("notComputable");
    expect(axle.limitKg).toBe(1100);
  });

  it("liefert ohne jedes Fahrzeug eine leere, graue Bilanz", () => {
    const result = evaluatePayload({
      towing: null,
      trailer: null,
      loads: [{ kg: 100, where: "tow" }],
      measuredNoseKg: null,
    });
    expect(result.checks).toEqual([]);
    expect(result.worst).toBe("ok");
    expect(result.loadKg).toEqual({ tow: 100, trailer: 0 });
  });
});

describe("noseWeightRule", () => {
  it("spannt das 4–7-%-Fenster auf und kappt es am zulässigen Wert", () => {
    const rule = noseWeightRule(1200, 75);
    expect(rule).not.toBeNull();
    expect(rule?.minKg).toBe(48);
    expect(rule?.maxKg).toBe(84);
    expect(rule?.recommendedKg).toBe(75);
  });

  it("bleibt ohne Anhängergewicht still", () => {
    expect(noseWeightRule(null, 75)).toBeNull();
    expect(noseWeightRule(0, 75)).toBeNull();
  });
});

describe("formatKg", () => {
  it("schreibt Dezimal-Komma ausser im Englischen", () => {
    expect(formatKg(1250)).toBe("1250 kg");
    expect(formatKg(12.55)).toBe("12,6 kg");
    expect(formatKg(12.55, "en")).toBe("12.6 kg");
  });
});

describe("sanitizePayloadPlan", () => {
  it("liefert für Unsinn den Standard-Plan", () => {
    expect(sanitizePayloadPlan(null)).toEqual(DEFAULT_PAYLOAD_PLAN);
    expect(sanitizePayloadPlan("kaputt")).toEqual(DEFAULT_PAYLOAD_PLAN);
  });

  it("wirft unbrauchbare Posten weg und begrenzt die Werte", () => {
    const plan = sanitizePayloadPlan({
      towVehicleId: "auto",
      trailerVehicleId: "wowa",
      personCount: 99,
      personKg: 0,
      packListId: 4.5,
      packListWhere: "trailer",
      measuredNoseKg: 70,
      items: [
        { id: "a", label: " Wasser ", kg: 60, where: "trailer" },
        { id: "b", label: "", kg: 20, where: "tow" },
        { id: "c", label: "Gas", kg: 0, where: "tow" },
        { id: "a", label: "Doppelt", kg: 5, where: "tow" },
      ],
    });
    expect(plan.personCount).toBe(12);
    expect(plan.personKg).toBe(75);
    expect(plan.packListId).toBeNull();
    expect(plan.packListWhere).toBe("trailer");
    expect(plan.measuredNoseKg).toBe(70);
    expect(plan.items).toEqual([
      { id: "a", label: "Wasser", kg: 60, where: "trailer" },
    ]);
  });
});

describe("Fahrzeug-Profile", () => {
  it("legt beim ersten Start die drei Wasserwaagen-Profile an", () => {
    const state = migrateVehicles(null, "bus", names);
    expect(state.changed).toBe(true);
    expect(state.vehicles.map(v => v.id)).toEqual(["tent", "bus", "caravan"]);
    expect(state.selectedId).toBe("bus");
    expect(state.vehicles.map(v => v.role)).toEqual(["none", "tow", "trailer"]);
  });

  it("behält gespeicherte Fahrzeuge und die alte Profil-Wahl", () => {
    const stored = defaultVehicles(names).map(v =>
      v.id === "caravan" ? { ...v, id: "eigener", emptyKg: 1050 } : v
    );
    const state = migrateVehicles(stored, "caravan", names);
    expect(state.changed).toBe(false);
    // Die alte Wahl «caravan» findet das Profil derselben Art wieder
    expect(state.selectedId).toBe("eigener");
  });

  it("säubert kaputte Fahrzeug-Daten", () => {
    const cleaned = sanitizeVehicles([
      { id: "a", name: "  Bus  ", kind: "bus", emptyKg: 2800 },
      { id: "b", name: "", kind: "bus" },
      { id: "a", name: "Doppelte Id", kind: "bus" },
      { id: "c", name: "Fantasie", kind: "ufo", grossKg: -5, noseKg: 1e9 },
      "kaputt",
    ]);
    expect(cleaned.map(v => v.id)).toEqual(["a", "c"]);
    expect(cleaned[0].name).toBe("Bus");
    expect(cleaned[0].role).toBe("tow");
    // Unbekannte Art fällt auf das Standard-Profil zurück
    expect(cleaned[1].kind).toBe("caravan");
    expect(cleaned[1].grossKg).toBeNull();
    expect(cleaned[1].noseKg).toBe(40000);
  });

  it("findet eine gültige Auswahl auch nach dem Löschen", () => {
    const vehicles = defaultVehicles(names);
    expect(selectedVehicleId(vehicles, "bus")).toBe("bus");
    expect(selectedVehicleId(vehicles, "weg")).toBe("caravan");
    expect(selectedVehicleId([], "bus")).toBe("caravan");
  });

  it("liest kg-Eingaben mit Komma, Apostroph und Leerzeichen", () => {
    expect(parseKgInput("1'450")).toBe(1450);
    expect(parseKgInput("75,5")).toBe(75.5);
    expect(parseKgInput(" 2 100 ")).toBe(2100);
    expect(parseKgInput("")).toBeNull();
    expect(parseKgInput("schwer")).toBeNull();
    expect(parseKgInput("-5")).toBeNull();
  });
});
