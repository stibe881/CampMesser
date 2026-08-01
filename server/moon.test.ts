import { describe, expect, it } from "vitest";
import {
  getMoonInfo,
  moonAge,
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
