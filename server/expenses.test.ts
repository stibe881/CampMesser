import { describe, expect, it } from "vitest";
import {
  budgetForecast,
  budgetStatus,
  BUDGET_TIGHT_RATIO,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  expensesByCategory,
  expensesTotalRappen,
  normalizeExpenseCategory,
  expenseStats,
  perNightRappen,
  settleUp,
  type Payment,
} from "@shared/expenses";
import { LANGUAGES } from "@shared/i18n";

/** Summe aller Ausgleichszahlungen – muss exakt aufgehen. */
function transferSum(settlements: { rappen: number }[]): number {
  return settlements.reduce((sum, s) => sum + s.rappen, 0);
}

describe("expensesTotalRappen", () => {
  it("zählt die Beträge zusammen", () => {
    expect(
      expensesTotalRappen([
        { amountRappen: 1250, category: "essen" },
        { amountRappen: 3000, category: "sprit" },
      ])
    ).toBe(4250);
    expect(expensesTotalRappen([])).toBe(0);
  });

  it("ignoriert unplausible Beträge", () => {
    expect(
      expensesTotalRappen([
        { amountRappen: 500, category: "essen" },
        { amountRappen: -900, category: "essen" },
        { amountRappen: Number.NaN, category: "essen" },
      ])
    ).toBe(500);
  });
});

describe("expensesByCategory", () => {
  it("liefert alle Kategorien in fester Reihenfolge", () => {
    const result = expensesByCategory([
      { amountRappen: 2000, category: "essen" },
      { amountRappen: 1000, category: "essen" },
      { amountRappen: 4500, category: "camping" },
    ]);
    expect(result.map(r => r.category)).toEqual([...EXPENSE_CATEGORIES]);
    expect(result.find(r => r.category === "essen")?.rappen).toBe(3000);
    expect(result.find(r => r.category === "camping")?.rappen).toBe(4500);
    expect(result.find(r => r.category === "sprit")?.rappen).toBe(0);
  });

  it("bucht unbekannte Kategorien auf «Sonstiges»", () => {
    const result = expensesByCategory([
      { amountRappen: 700, category: "unfug" },
    ]);
    expect(result.find(r => r.category === "sonstiges")?.rappen).toBe(700);
    // Die Gesamtsumme bleibt erhalten
    expect(result.reduce((sum, r) => sum + r.rappen, 0)).toBe(700);
  });
});

describe("normalizeExpenseCategory", () => {
  it("lässt bekannte Schlüssel durch und fängt den Rest ab", () => {
    expect(normalizeExpenseCategory("sprit")).toBe("sprit");
    expect(normalizeExpenseCategory("")).toBe("sonstiges");
    expect(normalizeExpenseCategory("Essen")).toBe("sonstiges");
  });
});

describe("EXPENSE_CATEGORY_LABELS", () => {
  it("ist in allen vier Sprachen gefüllt", () => {
    EXPENSE_CATEGORIES.forEach(category => {
      LANGUAGES.forEach(lang => {
        expect(EXPENSE_CATEGORY_LABELS[category][lang].length).toBeGreaterThan(
          0
        );
      });
    });
  });
});

describe("settleUp", () => {
  it("gibt bei zu wenig Zahlenden nichts zurück", () => {
    expect(settleUp([])).toEqual([]);
    expect(settleUp([{ who: "Anna", rappen: 5000 }])).toEqual([]);
    // Namenlose Einträge zählen nicht als Person
    expect(
      settleUp([
        { who: "Anna", rappen: 5000 },
        { who: "   ", rappen: 5000 },
      ])
    ).toEqual([]);
  });

  it("gleicht bei zwei Personen die halbe Differenz aus", () => {
    expect(
      settleUp([
        { who: "Anna", rappen: 10000 },
        { who: "Beat", rappen: 0 },
      ])
    ).toEqual([{ from: "Beat", to: "Anna", rappen: 5000 }]);
  });

  it("lässt bei gleichen Beiträgen alles offen", () => {
    expect(
      settleUp([
        { who: "Anna", rappen: 4000 },
        { who: "Beat", rappen: 4000 },
        { who: "Chiara", rappen: 4000 },
      ])
    ).toEqual([]);
  });

  it("zählt mehrere Zeilen derselben Person zusammen", () => {
    const result = settleUp([
      { who: "Anna", rappen: 3000 },
      { who: "anna ", rappen: 3000 },
      { who: "Beat", rappen: 0 },
    ]);
    // Anzeige nutzt die zuerst erfasste Schreibweise
    expect(result).toEqual([{ from: "Beat", to: "Anna", rappen: 3000 }]);
  });

  it("verteilt den Rest bei nicht teilbaren Summen exakt", () => {
    // 100 Rappen auf 3 Personen: Anteile 34/33/33 – nichts bleibt liegen
    const payments: Payment[] = [
      { who: "Anna", rappen: 100 },
      { who: "Beat", rappen: 0 },
      { who: "Chiara", rappen: 0 },
    ];
    const result = settleUp(payments);
    expect(transferSum(result)).toBe(66);
    expect(result).toEqual([
      { from: "Beat", to: "Anna", rappen: 33 },
      { from: "Chiara", to: "Anna", rappen: 33 },
    ]);
  });

  it("geht auch bei krummen Beträgen exakt auf", () => {
    const payments: Payment[] = [
      { who: "Anna", rappen: 4237 },
      { who: "Beat", rappen: 1119 },
      { who: "Chiara", rappen: 0 },
      { who: "Dario", rappen: 913 },
    ];
    const total = payments.reduce((sum, p) => sum + p.rappen, 0);
    const result = settleUp(payments);
    // Was jede Person am Ende bezahlt hat, entspricht ihrem Anteil
    const paid = new Map<string, number>();
    payments.forEach(p => paid.set(p.who, (paid.get(p.who) ?? 0) + p.rappen));
    result.forEach(s => {
      paid.set(s.from, (paid.get(s.from) ?? 0) + s.rappen);
      paid.set(s.to, (paid.get(s.to) ?? 0) - s.rappen);
    });
    const shares = Array.from(paid.values());
    expect(shares.reduce((sum, value) => sum + value, 0)).toBe(total);
    const base = Math.floor(total / payments.length);
    shares.forEach(share => {
      expect(share === base || share === base + 1).toBe(true);
    });
  });

  it("kommt mit höchstens n-1 Zahlungen aus", () => {
    const payments: Payment[] = [
      { who: "Anna", rappen: 12000 },
      { who: "Beat", rappen: 0 },
      { who: "Chiara", rappen: 3000 },
      { who: "Dario", rappen: 0 },
      { who: "Elin", rappen: 0 },
    ];
    // Summe 15 000, Anteil je 3000: Anna hat 9000 zugut, Chiara ist genau
    // ausgeglichen, Beat/Dario/Elin schulden je 3000
    const result = settleUp(payments);
    expect(result.length).toBeLessThanOrEqual(payments.length - 1);
    expect(transferSum(result)).toBe(9000);
    expect(result.every(s => s.to === "Anna")).toBe(true);
  });

  it("behandelt fehlende und negative Beträge als 0, die Person zählt aber mit", () => {
    const result = settleUp([
      { who: "Anna", rappen: 6000 },
      { who: "Beat", rappen: -500 },
      { who: "Chiara", rappen: Number.NaN },
    ]);
    expect(transferSum(result)).toBe(4000);
    expect(result).toEqual([
      { from: "Beat", to: "Anna", rappen: 2000 },
      { from: "Chiara", to: "Anna", rappen: 2000 },
    ]);
  });

  it("liefert bei Gesamtsumme 0 keine Zahlungen", () => {
    expect(
      settleUp([
        { who: "Anna", rappen: 0 },
        { who: "Beat", rappen: 0 },
      ])
    ).toEqual([]);
  });

  it("verteilt bei mehreren Gläubigern gierig und exakt", () => {
    const payments: Payment[] = [
      { who: "Anna", rappen: 9000 },
      { who: "Beat", rappen: 6000 },
      { who: "Chiara", rappen: 0 },
      { who: "Dario", rappen: 0 },
    ];
    // Anteil je 3750: Anna +5250, Beat +2250, Chiara/Dario je -3750
    const result = settleUp(payments);
    expect(result).toEqual([
      { from: "Chiara", to: "Anna", rappen: 3750 },
      { from: "Dario", to: "Anna", rappen: 1500 },
      { from: "Dario", to: "Beat", rappen: 2250 },
    ]);
    expect(transferSum(result)).toBe(7500);
  });
});

describe("budgetStatus", () => {
  it("rechnet Rest und Anteil aus", () => {
    const status = budgetStatus(30_000, 100_000);
    expect(status?.remainingRappen).toBe(70_000);
    expect(status?.percent).toBe(30);
    expect(status?.level).toBe("ok");
  });

  it("warnt, bevor das Budget reisst", () => {
    const status = budgetStatus(
      Math.round(100_000 * BUDGET_TIGHT_RATIO),
      100_000
    );
    expect(status?.level).toBe("tight");
  });

  it("zählt über 100 % weiter, statt zu kappen", () => {
    const status = budgetStatus(142_000, 100_000);
    expect(status?.percent).toBe(142);
    expect(status?.remainingRappen).toBe(-42_000);
    expect(status?.level).toBe("over");
  });

  it("gibt ohne Budget nichts zurück", () => {
    expect(budgetStatus(5000, null)).toBeNull();
    expect(budgetStatus(5000, 0)).toBeNull();
    expect(budgetStatus(5000, -100)).toBeNull();
  });

  it("verträgt kaputte Ausgaben-Summen", () => {
    expect(budgetStatus(Number.NaN, 100_000)?.spentRappen).toBe(0);
  });
});

describe("perNightRappen", () => {
  it("teilt durch die Nächte und rundet", () => {
    expect(perNightRappen(10_000, 3)).toBe(3333);
  });

  it("gibt es ohne Nächte nicht", () => {
    expect(perNightRappen(10_000, 0)).toBeNull();
    expect(perNightRappen(10_000, -2)).toBeNull();
  });
});

describe("expenseStats", () => {
  const trips = [
    { id: 1, startDate: "2025-07-10", endDate: "2025-07-14" }, // 4 Nächte
    { id: 2, startDate: "2026-05-01", endDate: "2026-05-03" }, // 2 Nächte
    // Silvester-Reise: beginnt 2025, endet 2026
    { id: 3, startDate: "2025-12-30", endDate: "2026-01-02" }, // 3 Nächte
    { id: 4, startDate: "2026-06-01", endDate: "2026-06-03" }, // ohne Ausgaben
  ];
  const expenses = [
    { tripId: 1, amountRappen: 20_000, category: "camping" },
    { tripId: 1, amountRappen: 10_000, category: "essen" },
    { tripId: 2, amountRappen: 6_000, category: "essen" },
    { tripId: 3, amountRappen: 9_000, category: "sprit" },
  ];

  it("summiert alle Ausgaben", () => {
    expect(expenseStats(trips, expenses).totalRappen).toBe(45_000);
  });

  it("ordnet eine Ausgabe dem Jahr der REISE zu, nicht dem der Ausgabe", () => {
    // Die Silvester-Reise beginnt 2025 – ihre Kosten stehen dort komplett
    const stats = expenseStats(trips, expenses);
    const y2025 = stats.years.find(y => y.year === 2025);
    expect(y2025?.rappen).toBe(39_000);
    expect(stats.years.find(y => y.year === 2026)?.rappen).toBe(6_000);
  });

  it("sortiert die Jahre absteigend", () => {
    expect(expenseStats(trips, expenses).years.map(y => y.year)).toEqual([
      2026, 2025,
    ]);
  });

  it("zählt nur die Nächte von Reisen MIT Ausgaben", () => {
    // Reise 4 (2 Nächte, keine Ausgaben) darf den Schnitt nicht drücken
    const stats = expenseStats(trips, expenses);
    expect(stats.totalNights).toBe(4 + 2 + 3);
    expect(stats.perNightRappen).toBe(Math.round(45_000 / 9));
  });

  it("nennt die teuerste Kategorie", () => {
    expect(expenseStats(trips, expenses).topCategory).toEqual({
      category: "camping",
      rappen: 20_000,
    });
  });

  it("zählt die Reisen pro Jahr", () => {
    const stats = expenseStats(trips, expenses);
    expect(stats.years.find(y => y.year === 2025)?.trips).toBe(2);
  });

  it("ignoriert Ausgaben ohne bekannte Reise", () => {
    const stats = expenseStats(trips, [
      ...expenses,
      { tripId: 99, amountRappen: 100_000, category: "essen" },
    ]);
    expect(stats.totalRappen).toBe(45_000);
  });

  it("kommt ohne Ausgaben klar", () => {
    const stats = expenseStats(trips, []);
    expect(stats.totalRappen).toBe(0);
    expect(stats.years).toEqual([]);
    expect(stats.topCategory).toBeNull();
    expect(stats.perNightRappen).toBeNull();
  });
});

/**
 * Budget-Hochrechnung (#398): «Reicht das Budget bei diesem Tempo?»
 */
describe("budgetForecast", () => {
  const TRIP = { startDate: "2026-08-01", endDate: "2026-08-07" };

  it("rechnet laufende Kosten hoch, Grundkosten nur einmal", () => {
    // Tag 3 von 7: Platz 200.–, Essen bisher 90.– (30.–/Tag).
    const forecast = budgetForecast({
      ...TRIP,
      todayIso: "2026-08-03",
      expenses: [
        { amountRappen: 20000, category: "camping" },
        { amountRappen: 6000, category: "essen" },
        { amountRappen: 3000, category: "essen" },
      ],
    });
    // 200 + 90 + 4 × 30 = 410 – NICHT 7 × (290/3): Die Platzmiete
    // fällt nicht jeden Tag noch einmal an.
    expect(forecast).not.toBeNull();
    expect(forecast!.projectedRappen).toBe(41000);
    expect(forecast!.variablePerDayRappen).toBe(3000);
    expect(forecast!.elapsedDays).toBe(3);
    expect(forecast!.remainingDays).toBe(4);
  });

  it("misst die Prognose am Budget mit denselben Stufen wie der Stand", () => {
    const base = {
      ...TRIP,
      todayIso: "2026-08-03",
      expenses: [{ amountRappen: 9000, category: "essen" }],
    };
    // Hochrechnung: 90 + 4 × 30 = 210
    expect(budgetForecast({ ...base, budgetRappen: 30000 })!.level).toBe("ok");
    expect(budgetForecast({ ...base, budgetRappen: 25000 })!.level).toBe(
      "tight"
    );
    expect(budgetForecast({ ...base, budgetRappen: 20000 })!.level).toBe(
      "over"
    );
    expect(budgetForecast(base)!.level).toBeNull();
  });

  it("schweigt vor der Reise, am letzten Tag und danach", () => {
    const expenses = [{ amountRappen: 1000, category: "essen" }];
    expect(
      budgetForecast({ ...TRIP, todayIso: "2026-07-31", expenses })
    ).toBeNull();
    expect(
      budgetForecast({ ...TRIP, todayIso: "2026-08-07", expenses })
    ).toBeNull();
    expect(
      budgetForecast({ ...TRIP, todayIso: "2026-08-09", expenses })
    ).toBeNull();
  });

  it("Sprit zählt wie die Platzmiete zu den Grundkosten", () => {
    // Getankt wird an Fahrtagen – wer das täglich hochrechnet, tankt in
    // der Prognose jeden Tag.
    const forecast = budgetForecast({
      ...TRIP,
      todayIso: "2026-08-02",
      expenses: [{ amountRappen: 8000, category: "sprit" }],
    });
    expect(forecast!.projectedRappen).toBe(8000);
    expect(forecast!.variablePerDayRappen).toBe(0);
  });

  it("ohne Ausgaben ist die Prognose schlicht 0", () => {
    const forecast = budgetForecast({
      ...TRIP,
      todayIso: "2026-08-03",
      expenses: [],
    });
    expect(forecast!.projectedRappen).toBe(0);
  });
});
