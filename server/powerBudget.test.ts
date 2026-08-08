import { describe, expect, it } from "vitest";
import {
  CONSUMER_TEMPLATES,
  DEFAULT_POWER_STORAGE,
  DEFAULT_USABLE_PERCENT,
  consumerBreakdown,
  consumerDailyWh,
  evaluatePowerBudget,
  formatWh,
  runtimeDisplay,
  sanitizePowerStorage,
  storageCapacityWh,
  usablePercentOf,
  type PowerStorage,
  INVERTER_EFFICIENCY,
  applyWeatherToConsumers,
  coolingHoursPerDay,
} from "@shared/powerBudget";

const storage = (patch: Partial<PowerStorage> = {}): PowerStorage => ({
  ...DEFAULT_POWER_STORAGE,
  ...patch,
});

describe("storageCapacityWh", () => {
  it("nimmt die Wh-Angabe direkt", () => {
    expect(storageCapacityWh(storage({ capacityWh: 1024 }))).toBe(1024);
  });

  it("rechnet Ah mal Spannung", () => {
    expect(
      storageCapacityWh(
        storage({ mode: "ah", capacityAh: 100, voltage: 12, capacityWh: null })
      )
    ).toBe(1200);
  });

  it("gibt ohne Spannung null zurück statt zu raten (Ah sind keine Energie)", () => {
    expect(
      storageCapacityWh(
        storage({
          mode: "ah",
          capacityAh: 100,
          voltage: null,
          capacityWh: null,
        })
      )
    ).toBeNull();
  });

  it("gibt ohne Speicher null zurück", () => {
    expect(storageCapacityWh(null)).toBeNull();
    expect(storageCapacityWh(storage({ capacityWh: null }))).toBeNull();
  });
});

describe("usablePercentOf", () => {
  it("nutzt die Vorgabe der Bauart", () => {
    expect(usablePercentOf(storage({ chemistry: "lead" }))).toBe(
      DEFAULT_USABLE_PERCENT.lead
    );
    expect(usablePercentOf(storage({ chemistry: "lifepo4" }))).toBe(90);
  });

  it("lässt einen eigenen Wert vorgehen und begrenzt ihn", () => {
    expect(
      usablePercentOf(storage({ chemistry: "lead", usablePercent: 70 }))
    ).toBe(70);
    expect(usablePercentOf(storage({ usablePercent: 500 }))).toBe(100);
  });
});

describe("consumerDailyWh", () => {
  it("rechnet Watt mal Stunden", () => {
    expect(consumerDailyWh({ watts: 45, hoursPerDay: 8 })).toBe(360);
  });

  it("zählt ausgeschaltete Geräte nicht", () => {
    expect(consumerDailyWh({ watts: 45, hoursPerDay: 8, enabled: false })).toBe(
      0
    );
  });

  it("kappt bei 24 h und ignoriert negative Werte", () => {
    expect(consumerDailyWh({ watts: 10, hoursPerDay: 48 })).toBe(240);
    expect(consumerDailyWh({ watts: -10, hoursPerDay: 5 })).toBe(0);
  });
});

describe("consumerBreakdown", () => {
  it("sortiert absteigend und rechnet die Anteile", () => {
    const shares = consumerBreakdown([
      { name: "LED", watts: 8, hoursPerDay: 5 },
      { name: "Kühlbox", watts: 45, hoursPerDay: 8 },
      { name: "Aus", watts: 100, hoursPerDay: 5, enabled: false },
    ]);
    expect(shares.map(s => s.name)).toEqual(["Kühlbox", "LED"]);
    expect(shares[0].dailyWh).toBe(360);
    expect(shares[0].percent).toBe(90);
    expect(shares[1].percent).toBe(10);
  });

  it("bleibt bei leerer Liste leer", () => {
    expect(consumerBreakdown([])).toEqual([]);
  });
});

describe("evaluatePowerBudget", () => {
  it("rechnet Reichweite aus nutzbarer Kapazität", () => {
    const result = evaluatePowerBudget({
      storage: storage({ capacityWh: 1000, chemistry: "lifepo4" }),
      consumers: [{ watts: 30, hoursPerDay: 10 }],
    });
    expect(result.dailyConsumptionWh).toBe(300);
    expect(result.nominalWh).toBe(1000);
    expect(result.usableWh).toBe(900);
    expect(result.availableWh).toBe(900);
    expect(result.reserveWh).toBe(100);
    expect(result.runtimeDays).toBe(3);
    expect(result.runtimeHours).toBe(72);
    expect(result.status).toBe("ok");
    expect(result.missing).toEqual([]);
  });

  it("zieht den Ladestand von der Nennkapazität ab, nicht von der nutzbaren", () => {
    // Blei mit 50 % nutzbar und 50 % Ladung steht exakt an der Entladegrenze
    const result = evaluatePowerBudget({
      storage: storage({
        capacityWh: 1000,
        chemistry: "lead",
        chargePercent: 50,
      }),
      consumers: [{ watts: 10, hoursPerDay: 5 }],
    });
    expect(result.availableWh).toBe(0);
    expect(result.runtimeDays).toBe(0);
    expect(result.deepDischargeRisk).toBe(true);
    expect(result.status).toBe("critical");
  });

  it("warnt bei Tiefentladung, wenn es keinen ganzen Tag mehr reicht", () => {
    const result = evaluatePowerBudget({
      storage: storage({ capacityWh: 500, chemistry: "lifepo4" }),
      consumers: [{ watts: 100, hoursPerDay: 8 }],
    });
    expect(result.deepDischargeRisk).toBe(true);
    expect(result.status).toBe("critical");
    expect(result.runtimeHours).toBeCloseTo(13.5, 1);
  });

  it("stuft ein bis zwei Tage als knapp ein", () => {
    const result = evaluatePowerBudget({
      storage: storage({ capacityWh: 1000, chemistry: "lifepo4" }),
      consumers: [{ watts: 50, hoursPerDay: 12 }],
    });
    expect(result.runtimeDays).toBe(1.5);
    expect(result.status).toBe("tight");
    expect(result.deepDischargeRisk).toBe(false);
  });

  it("erkennt Autarkie, wenn die Nachladung den Verbrauch deckt", () => {
    const result = evaluatePowerBudget({
      storage: storage({ capacityWh: 1000 }),
      consumers: [{ watts: 30, hoursPerDay: 10 }],
      rechargeWhPerDay: 400,
    });
    expect(result.netDailyWh).toBe(-100);
    expect(result.selfSufficient).toBe(true);
    expect(result.runtimeDays).toBeNull();
    expect(result.status).toBe("selfSufficient");
  });

  it("rechnet mit der Nachladung, wenn sie nicht reicht", () => {
    const result = evaluatePowerBudget({
      storage: storage({ capacityWh: 1000, chemistry: "lifepo4" }),
      consumers: [{ watts: 50, hoursPerDay: 10 }],
      rechargeWhPerDay: 200,
    });
    expect(result.netDailyWh).toBe(300);
    expect(result.runtimeDays).toBe(3);
    expect(result.selfSufficient).toBe(false);
  });

  // Randfall: kein Speicher erfasst
  it("meldet den fehlenden Speicher, statt eine Reichweite zu erfinden", () => {
    const result = evaluatePowerBudget({
      storage: null,
      consumers: [{ watts: 45, hoursPerDay: 8 }],
    });
    expect(result.dailyConsumptionWh).toBe(360);
    expect(result.nominalWh).toBeNull();
    expect(result.availableWh).toBeNull();
    expect(result.runtimeDays).toBeNull();
    expect(result.status).toBe("unknown");
    expect(result.missing).toEqual(["storage"]);
  });

  // Randfall: kein Verbrauch
  it("meldet fehlende Verbraucher und rechnet keine Reichweite", () => {
    const result = evaluatePowerBudget({
      storage: storage({ capacityWh: 1000 }),
      consumers: [],
    });
    expect(result.dailyConsumptionWh).toBe(0);
    expect(result.activeConsumers).toBe(0);
    expect(result.usableWh).toBe(900);
    expect(result.runtimeDays).toBeNull();
    expect(result.selfSufficient).toBe(false);
    expect(result.status).toBe("unknown");
    expect(result.missing).toEqual(["consumers"]);
  });

  it("zählt nur eingeschaltete Verbraucher als aktiv", () => {
    const result = evaluatePowerBudget({
      storage: storage({ capacityWh: 1000 }),
      consumers: [{ watts: 45, hoursPerDay: 8, enabled: false }],
    });
    expect(result.dailyConsumptionWh).toBe(0);
    expect(result.missing).toEqual(["consumers"]);
  });

  // Randfall: Ah ohne Spannung
  it("meldet die fehlende Spannung bei Ah-Erfassung", () => {
    const result = evaluatePowerBudget({
      storage: storage({
        mode: "ah",
        capacityWh: null,
        capacityAh: 100,
        voltage: null,
      }),
      consumers: [{ watts: 45, hoursPerDay: 8 }],
    });
    expect(result.nominalWh).toBeNull();
    expect(result.missing).toEqual(["voltage"]);
    expect(result.status).toBe("unknown");
  });

  it("rechnet die Ah-Erfassung mit Spannung durch", () => {
    const result = evaluatePowerBudget({
      storage: storage({
        mode: "ah",
        capacityWh: null,
        capacityAh: 100,
        voltage: 12,
        chemistry: "lead",
      }),
      consumers: [{ watts: 25, hoursPerDay: 8 }],
    });
    expect(result.nominalWh).toBe(1200);
    expect(result.usableWh).toBe(600);
    expect(result.runtimeDays).toBe(3);
  });
});

describe("sanitizePowerStorage", () => {
  it("gibt bei Unsinn die Vorgabe zurück", () => {
    expect(sanitizePowerStorage(null)).toEqual(DEFAULT_POWER_STORAGE);
    expect(sanitizePowerStorage("kaputt")).toEqual(DEFAULT_POWER_STORAGE);
  });

  it("räumt kaputte Felder auf", () => {
    const clean = sanitizePowerStorage({
      chemistry: "unfug",
      mode: "ah",
      capacityWh: -5,
      capacityAh: 99999,
      voltage: 12.4,
      usablePercent: 200,
      chargePercent: -20,
    });
    expect(clean.chemistry).toBe(DEFAULT_POWER_STORAGE.chemistry);
    expect(clean.mode).toBe("ah");
    expect(clean.capacityWh).toBeNull();
    expect(clean.capacityAh).toBe(5000);
    expect(clean.voltage).toBe(12.4);
    expect(clean.usablePercent).toBe(100);
    expect(clean.chargePercent).toBe(0);
  });

  it("behält null als «Vorgabe der Bauart» für den nutzbaren Anteil", () => {
    expect(
      sanitizePowerStorage({ usablePercent: null }).usablePercent
    ).toBeNull();
  });
});

describe("runtimeDisplay", () => {
  const base = (days: number | null) =>
    ({
      runtimeDays: days,
      runtimeHours: days === null ? null : days * 24,
    }) as ReturnType<typeof evaluatePowerBudget>;

  it("zeigt unter zwei Tagen Stunden", () => {
    expect(runtimeDisplay(base(0.5))).toEqual({ unit: "hours", value: 12 });
  });

  it("zeigt ab zwei Tagen Tage", () => {
    expect(runtimeDisplay(base(3.25))).toEqual({ unit: "days", value: 3.3 });
  });

  it("deckelt sehr lange Reichweiten", () => {
    expect(runtimeDisplay(base(120))).toEqual({ unit: "overMax", value: 30 });
  });

  it("kennt den Fall ohne Reichweite", () => {
    expect(runtimeDisplay(base(null))).toEqual({ unit: "none", value: 0 });
  });
});

describe("formatWh", () => {
  it("bleibt unter 1000 bei Wh", () => {
    expect(formatWh(360)).toBe("360 Wh");
  });

  it("wechselt ab 1000 auf kWh mit Dezimalkomma", () => {
    expect(formatWh(1024)).toBe("1,02 kWh");
    expect(formatWh(1024, "en")).toBe("1.02 kWh");
  });
});

describe("CONSUMER_TEMPLATES", () => {
  it("hat eindeutige Schlüssel mit plausiblen Werten", () => {
    const keys = CONSUMER_TEMPLATES.map(t => t.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const template of CONSUMER_TEMPLATES) {
      expect(template.watts).toBeGreaterThan(0);
      expect(template.watts).toBeLessThan(3000);
      expect(template.hoursPerDay).toBeGreaterThan(0);
      expect(template.hoursPerDay).toBeLessThanOrEqual(24);
    }
  });
});

/**
 * Genauer rechnen (#405): Wechselrichter-Verlust und Kühlgeräte-Laufzeit
 * aus dem Wetter – die zwei grössten Ungenauigkeiten des alten Rechners.
 */
describe("Wechselrichter-Verlust (#405)", () => {
  it("ein 230-V-Gerät kostet den Umwandlungsverlust obendrauf", () => {
    const dc = consumerDailyWh({ watts: 85, hoursPerDay: 2 });
    const ac = consumerDailyWh({ watts: 85, hoursPerDay: 2, inverter: true });
    expect(dc).toBe(170);
    expect(ac).toBe(200);
    expect(INVERTER_EFFICIENCY).toBe(0.85);
  });

  it("ohne Kennzeichen ändert sich nichts an alten Einträgen", () => {
    expect(consumerDailyWh({ watts: 60, hoursPerDay: 8 })).toBe(480);
  });
});

describe("Kühlgeräte nach Wetter (#405)", () => {
  it("je wärmer, desto länger läuft der Kompressor", () => {
    expect(coolingHoursPerDay(15)).toBeLessThan(coolingHoursPerDay(25));
    expect(coolingHoursPerDay(25)).toBeLessThan(coolingHoursPerDay(35));
  });

  it("liefert plausible Werte: ~5 h bei 15 °C, ~12 h bei 30 °C", () => {
    expect(coolingHoursPerDay(15)).toBe(5);
    expect(coolingHoursPerDay(30)).toBe(12);
  });

  it("ist nach unten und oben gedeckelt", () => {
    // Auch der Hitzesommer lässt den Kompressor nicht rund um die Uhr
    // laufen – und im Winter steht er nie ganz still. Die Deckelwerte
    // sind auf halbe Stunden gerundet (0,15 × 24 ≈ 3,5; 0,7 × 24 ≈ 17).
    expect(coolingHoursPerDay(-10)).toBe(3.5);
    expect(coolingHoursPerDay(45)).toBe(17);
  });

  it("applyWeatherToConsumers fasst NUR Kühlgeräte an", () => {
    const consumers = [
      { name: "Kühlbox", watts: 45, hoursPerDay: 8, cooling: true },
      { name: "Licht", watts: 8, hoursPerDay: 4 },
    ];
    const adjusted = applyWeatherToConsumers(consumers, 30);
    expect(adjusted[0].hoursPerDay).toBe(coolingHoursPerDay(30));
    expect(adjusted[1].hoursPerDay).toBe(4);
  });

  it("ohne Prognose bleibt der gespeicherte Richtwert stehen", () => {
    // Lieber der alte Richtwert als eine erfundene Zahl.
    const consumers = [
      { name: "Kühlbox", watts: 45, hoursPerDay: 8, cooling: true },
    ];
    expect(applyWeatherToConsumers(consumers, null)[0].hoursPerDay).toBe(8);
  });
});
