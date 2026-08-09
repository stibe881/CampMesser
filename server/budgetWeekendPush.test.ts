import { describe, expect, it } from "vitest";
import { buildBudgetAlert, buildWeekendAlert, isOutingWeather } from "./push";

describe("Budget-Warnung (#665)", () => {
  const trip = (id: number, budget: number, spent: number) => ({
    id,
    name: `Reise ${id}`,
    budgetRappen: budget,
    spentRappen: spent,
  });

  it("meldet ab 80 % der Limite, mit Stufe im Schlüssel", () => {
    const alert = buildBudgetAlert([trip(7, 100000, 85000)], "de");
    expect(alert?.key).toBe("budget:7:80");
    expect(alert?.title).toContain("80 %");
    expect(alert?.body).toBe("850 von 1000 CHF ausgegeben.");
  });

  it("wechselt beim Erreichen der Limite auf die 100er-Stufe", () => {
    const alert = buildBudgetAlert([trip(7, 100000, 101000)], "de");
    expect(alert?.key).toBe("budget:7:100");
    expect(alert?.title).toContain("Limite erreicht");
  });

  it("schweigt unter 80 % und ohne Limite", () => {
    expect(buildBudgetAlert([trip(7, 100000, 79000)])).toBeNull();
    expect(buildBudgetAlert([trip(7, 0, 5000)])).toBeNull();
    expect(buildBudgetAlert([])).toBeNull();
  });

  it("nimmt bei mehreren Reisen die mit dem vollsten Budget", () => {
    const alert = buildBudgetAlert([
      trip(1, 100000, 82000),
      trip(2, 50000, 60000),
    ]);
    expect(alert?.key).toBe("budget:2:100");
  });
});

describe("Wochenend-Wetter (#659)", () => {
  const day = (date: string, tempMaxC: number, precip: number) => ({
    date,
    tempMaxC,
    precipitationSumMm: precip,
    windGustsMaxKmh: 20,
  });

  it("meldet bei Ausflugs-Wetter an mindestens einem Tag", () => {
    const alert = buildWeekendAlert(
      [
        day("2026-08-14", 22, 0),
        day("2026-08-15", 26, 0),
        day("2026-08-16", 19, 8),
      ],
      "2026-08-15",
      "2026-08-16",
      "de"
    );
    expect(alert?.key).toBe("weekend:2026-08-15");
    expect(alert?.body).toContain("Sa 26°");
    expect(alert?.body).toContain("So 19° · 8 mm");
  });

  it("schweigt bei Sauwetter an beiden Tagen und ohne Prognose", () => {
    expect(
      buildWeekendAlert(
        [day("2026-08-15", 14, 12), day("2026-08-16", 15, 6)],
        "2026-08-15",
        "2026-08-16"
      )
    ).toBeNull();
    expect(buildWeekendAlert([], "2026-08-15", "2026-08-16")).toBeNull();
  });

  it("kennt die Ausflugs-Schwelle (18 °C, unter 2 mm)", () => {
    expect(isOutingWeather(day("x", 18, 1.9))).toBe(true);
    expect(isOutingWeather(day("x", 17.9, 0))).toBe(false);
    expect(isOutingWeather(day("x", 25, 2))).toBe(false);
  });
});
