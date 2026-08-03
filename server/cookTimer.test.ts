import { describe, expect, it } from "vitest";
import {
  formatRemaining,
  MAX_TIMER_MINUTES,
  parseDurations,
  parseTimerMinutes,
  QUICK_TIMER_MINUTES,
} from "@shared/cookTimer";

describe("parseDurations – Deutsch", () => {
  it("findet ausgeschriebene Minuten", () => {
    expect(parseDurations("15 Minuten köcheln lassen")).toEqual([
      { label: "15 Minuten", minutes: 15 },
    ]);
  });

  it("findet die Kurzform «Min.» samt Punkt", () => {
    expect(parseDurations("Deckel drauf, 8 Min. ziehen lassen")).toEqual([
      { label: "8 Min.", minutes: 8 },
    ]);
  });

  it("nimmt den Satzschlusspunkt nicht ins Etikett", () => {
    expect(parseDurations("Backe alles 20 Minuten.")).toEqual([
      { label: "20 Minuten", minutes: 20 },
    ]);
  });

  it("rechnet Stunden in Minuten um und behält «ca.» im Etikett", () => {
    expect(parseDurations("Alles ca. 1 Std. schmoren lassen")).toEqual([
      { label: "ca. 1 Std.", minutes: 60 },
    ]);
    expect(parseDurations("Etwa 2 Stunden garen")).toEqual([
      { label: "Etwa 2 Stunden", minutes: 120 },
    ]);
  });

  it("zieht «1 Std. 30 Min.» zu einer Angabe zusammen", () => {
    expect(parseDurations("Der Braten braucht 1 Std. 30 Min.")).toEqual([
      { label: "1 Std. 30 Min.", minutes: 90 },
    ]);
    expect(parseDurations("2 Stunden und 15 Minuten backen")).toEqual([
      { label: "2 Stunden und 15 Minuten", minutes: 135 },
    ]);
  });

  it("nimmt bei Bereichen die untere Grenze", () => {
    expect(parseDurations("15–20 Minuten braten")).toEqual([
      { label: "15–20 Minuten", minutes: 15 },
    ]);
    expect(parseDurations("10 bis 15 Min. ziehen lassen")).toEqual([
      { label: "10 bis 15 Min.", minutes: 10 },
    ]);
  });

  it("versteht halbe Stunden mit Dezimalkomma", () => {
    expect(parseDurations("0,5 Std. ruhen lassen")).toEqual([
      { label: "0,5 Std.", minutes: 30 },
    ]);
    expect(parseDurations("1.5 h köcheln")).toEqual([
      { label: "1.5 h", minutes: 90 },
    ]);
  });
});

describe("parseDurations – Französisch, Italienisch, Englisch", () => {
  it("findet französische Angaben", () => {
    expect(parseDurations("Laisser mijoter 15 minutes")).toEqual([
      { label: "15 minutes", minutes: 15 },
    ]);
    expect(parseDurations("Cuire environ 2 heures")).toEqual([
      { label: "environ 2 heures", minutes: 120 },
    ]);
    expect(parseDurations("Cuire 5 à 10 minutes")).toEqual([
      { label: "5 à 10 minutes", minutes: 5 },
    ]);
  });

  it("findet italienische Angaben", () => {
    expect(parseDurations("Cuocere per 20 minuti")).toEqual([
      { label: "20 minuti", minutes: 20 },
    ]);
    expect(parseDurations("Lasciare riposare 1 ora")).toEqual([
      { label: "1 ora", minutes: 60 },
    ]);
    expect(parseDurations("Cuocere da 2 a 3 ore")).toEqual([
      { label: "2 a 3 ore", minutes: 120 },
    ]);
  });

  it("findet englische Angaben", () => {
    expect(parseDurations("Simmer for 25 minutes")).toEqual([
      { label: "25 minutes", minutes: 25 },
    ]);
    expect(parseDurations("Roast about 1 hour")).toEqual([
      { label: "about 1 hour", minutes: 60 },
    ]);
    expect(parseDurations("Rest 10-12 mins")).toEqual([
      { label: "10-12 mins", minutes: 10 },
    ]);
  });
});

describe("parseDurations – Abgrenzung", () => {
  it("ignoriert Mengen, Temperaturen und Sekunden", () => {
    expect(parseDurations("Ofen auf 180 Grad vorheizen")).toEqual([]);
    expect(parseDurations("Backofen auf 200 °C stellen")).toEqual([]);
    expect(parseDurations("2 EL Öl und 3 dl Wasser dazugeben")).toEqual([]);
    expect(parseDurations("30 Sekunden anbraten")).toEqual([]);
    expect(parseDurations("4 Zwiebeln schneiden")).toEqual([]);
  });

  it("liefert bei leerem oder ungültigem Text nichts", () => {
    expect(parseDurations("")).toEqual([]);
    expect(parseDurations("   ")).toEqual([]);
    expect(parseDurations("Alles gut umrühren")).toEqual([]);
  });

  it("verwirft 0 Minuten und unplausibel lange Angaben", () => {
    expect(parseDurations("0 Minuten warten")).toEqual([]);
    expect(parseDurations("48 Stunden marinieren")).toEqual([]);
    // exakt an der Obergrenze bleibt gültig
    expect(parseDurations(`${MAX_TIMER_MINUTES} Minuten`)).toEqual([
      { label: `${MAX_TIMER_MINUTES} Minuten`, minutes: MAX_TIMER_MINUTES },
    ]);
  });

  it("findet mehrere verschiedene Angaben, aber keine Doppel", () => {
    expect(
      parseDurations("10 Minuten anbraten, dann 25 Minuten schmoren")
    ).toEqual([
      { label: "10 Minuten", minutes: 10 },
      { label: "25 Minuten", minutes: 25 },
    ]);
    expect(parseDurations("5 Min. rühren, danach 5 Minuten ruhen")).toEqual([
      { label: "5 Min.", minutes: 5 },
    ]);
  });

  it("kommt mit gemischtem Text zurecht", () => {
    expect(
      parseDurations(
        "Bei 180 Grad 35 Minuten backen, danach 2 EL Öl und 5 Min. ruhen lassen."
      )
    ).toEqual([
      { label: "35 Minuten", minutes: 35 },
      { label: "5 Min.", minutes: 5 },
    ]);
  });
});

describe("formatRemaining", () => {
  it("zeigt Minuten und Sekunden", () => {
    expect(formatRemaining(0)).toBe("0:00");
    expect(formatRemaining(9)).toBe("0:09");
    expect(formatRemaining(75)).toBe("1:15");
    expect(formatRemaining(600)).toBe("10:00");
  });

  it("zeigt ab einer Stunde auch die Stunden", () => {
    expect(formatRemaining(3600)).toBe("1:00:00");
    expect(formatRemaining(3661)).toBe("1:01:01");
  });

  it("rundet angebrochene Sekunden auf und klemmt negative Werte", () => {
    expect(formatRemaining(0.2)).toBe("0:01");
    expect(formatRemaining(59.6)).toBe("1:00");
    expect(formatRemaining(-5)).toBe("0:00");
    expect(formatRemaining(Number.NaN)).toBe("0:00");
  });
});

describe("parseTimerMinutes", () => {
  it("nimmt ganze Minuten an", () => {
    expect(parseTimerMinutes("12")).toBe(12);
    expect(parseTimerMinutes(" 7 ")).toBe(7);
    expect(parseTimerMinutes("2,6")).toBe(3);
    expect(parseTimerMinutes(String(MAX_TIMER_MINUTES))).toBe(
      MAX_TIMER_MINUTES
    );
  });

  it("weist Leeres, Text und Werte ausserhalb der Grenzen ab", () => {
    expect(parseTimerMinutes("")).toBeNull();
    expect(parseTimerMinutes("abc")).toBeNull();
    expect(parseTimerMinutes("0")).toBeNull();
    expect(parseTimerMinutes("-5")).toBeNull();
    expect(parseTimerMinutes(String(MAX_TIMER_MINUTES + 1))).toBeNull();
  });
});

describe("QUICK_TIMER_MINUTES", () => {
  it("ist aufsteigend und liegt in den erlaubten Grenzen", () => {
    const values = Array.from(QUICK_TIMER_MINUTES);
    expect(values).toEqual([...values].sort((a, b) => a - b));
    values.forEach(minutes => {
      expect(minutes).toBeGreaterThanOrEqual(1);
      expect(minutes).toBeLessThanOrEqual(MAX_TIMER_MINUTES);
    });
  });
});
