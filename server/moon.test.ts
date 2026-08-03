import { describe, expect, it } from "vitest";
import {
  getMoonInfo,
  moonAge,
  moonMonth,
  nextFullMoons,
  nextNewMoons,
  stargazingQuality,
} from "../shared/moon";

describe("moonAge", () => {
  it("liefert ~0 am Referenz-Neumond (6.1.2000)", () => {
    const age = moonAge(new Date(Date.UTC(2000, 0, 6, 18, 14)));
    expect(age).toBeLessThan(0.01);
  });

  it("liefert ~14.77 einen halben Monat später (Vollmond)", () => {
    const age = moonAge(new Date(Date.UTC(2000, 0, 21, 4, 40)));
    expect(age).toBeGreaterThan(13.5);
    expect(age).toBeLessThan(16);
  });
});

describe("getMoonInfo", () => {
  it("erkennt bekannten Vollmond (31. Oktober 2020)", () => {
    const info = getMoonInfo(new Date(Date.UTC(2020, 9, 31, 14, 49)));
    expect(info.phase).toBe("vollmond");
    expect(info.illumination).toBeGreaterThan(0.95);
  });

  it("erkennt bekannten Neumond (14. Dezember 2020, Sonnenfinsternis)", () => {
    const info = getMoonInfo(new Date(Date.UTC(2020, 11, 14, 16, 17)));
    expect(info.phase).toBe("neumond");
    expect(info.illumination).toBeLessThan(0.05);
  });
});

describe("nextFullMoons", () => {
  it("liefert aufsteigende Daten im Abstand eines synodischen Monats", () => {
    const from = new Date(Date.UTC(2026, 0, 1));
    const moons = nextFullMoons(from, 3);
    expect(moons).toHaveLength(3);
    const gap = (moons[1].getTime() - moons[0].getTime()) / 86400000;
    expect(gap).toBeGreaterThan(29);
    expect(gap).toBeLessThan(30);
    // Jeder Termin muss tatsächlich ~voll beleuchtet sein
    for (const m of moons) {
      expect(getMoonInfo(m).illumination).toBeGreaterThan(0.95);
    }
  });
});

describe("nextNewMoons", () => {
  it("liefert Termine mit minimaler Beleuchtung", () => {
    const from = new Date(Date.UTC(2026, 0, 1));
    const moons = nextNewMoons(from, 2);
    for (const m of moons) {
      expect(getMoonInfo(m).illumination).toBeLessThan(0.05);
    }
  });
});

describe("stargazingQuality", () => {
  it("bewertet dunkle Nächte als hervorragend und helle als schlecht", () => {
    expect(stargazingQuality(0.05).score).toBe("hervorragend");
    expect(stargazingQuality(0.3).score).toBe("gut");
    expect(stargazingQuality(0.6).score).toBe("mittel");
    expect(stargazingQuality(0.95).score).toBe("schlecht");
  });
});

describe("moonMonth", () => {
  it("liefert das Monatsgitter mit Phase pro Tag", () => {
    const weeks = moonMonth(2026, 8);
    expect(weeks.length).toBeGreaterThanOrEqual(4);
    for (const week of weeks) {
      expect(week).toHaveLength(7);
      for (const day of week) {
        expect(day.iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(day.illumination).toBeGreaterThanOrEqual(0);
        expect(day.illumination).toBeLessThanOrEqual(1);
        expect(day.phaseLabel.length).toBeGreaterThan(0);
      }
    }
    const inMonth = weeks.flat().filter(d => d.inMonth);
    expect(inMonth).toHaveLength(31);
  });

  it("markiert pro Lunation genau einen Neu- und einen Vollmond-Tag", () => {
    const days = moonMonth(2026, 8).flat();
    const newMoons = days.filter(d => d.isNewMoon);
    const fullMoons = days.filter(d => d.isFullMoon);
    // 42 Gitter-Tage können knapp zwei Lunationen streifen
    expect(newMoons.length).toBeGreaterThanOrEqual(1);
    expect(newMoons.length).toBeLessThanOrEqual(2);
    expect(fullMoons.length).toBeGreaterThanOrEqual(1);
    expect(fullMoons.length).toBeLessThanOrEqual(2);
    for (const day of newMoons) expect(day.illumination).toBeLessThan(0.02);
    for (const day of fullMoons) expect(day.illumination).toBeGreaterThan(0.98);
    // Neu- und Vollmond fallen nie auf denselben Tag
    expect(days.every(d => !(d.isNewMoon && d.isFullMoon))).toBe(true);
  });

  it("übersetzt die Phasen-Bezeichnung", () => {
    const de = moonMonth(2026, 8, "de")
      .flat()
      .find(d => d.isFullMoon)!;
    const fr = moonMonth(2026, 8, "fr")
      .flat()
      .find(d => d.isFullMoon)!;
    expect(de.phaseLabel).toBe("Vollmond");
    expect(fr.phaseLabel).toBe("Pleine lune");
    expect(de.iso).toBe(fr.iso);
  });

  it("rechnet zeitzonen-unabhängig (Zellen decken sich mit monthGrid)", () => {
    const weeks = moonMonth(2027, 1);
    expect(weeks[0][0].iso <= "2027-01-01").toBe(true);
    expect(weeks.flat().filter(d => d.inMonth)[0].iso).toBe("2027-01-01");
  });
});
