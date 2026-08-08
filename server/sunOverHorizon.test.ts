import { describe, expect, it } from "vitest";
import type { ObstacleShape } from "@shared/obstacles";
import {
  delayVersusOpen,
  SUN_MIN_ALTITUDE_DEG,
  sunWindow,
  type SunSample,
} from "@shared/sunOverHorizon";

/**
 * Die Sonne über dem ECHTEN Horizont (#380).
 *
 * WARUM DAS GEPRÜFT GEHÖRT: Das Ergebnis ist eine Uhrzeit, und eine
 * falsche Uhrzeit sieht genauso aus wie eine richtige. Am Bildschirm
 * merkt man den Fehler frühestens am nächsten Morgen auf dem Platz –
 * und dann hält man ihn für schlechtes Wetter.
 *
 * Die Proben sind von Hand gebaut: eine Sonne, die im Osten aufgeht, im
 * Süden kulminiert und im Westen untergeht. Genau dafür ist die
 * Trennung von Rechnung (Client) und Auswertung (hier) da.
 */

/** Ein einfacher Tag: alle 10 Minuten eine Probe von 06:00 bis 20:00. */
function dayCurve(): SunSample[] {
  const samples: SunSample[] = [];
  for (let minutes = 360; minutes <= 1200; minutes += 10) {
    // Azimut von 90° (Ost, 06:00) über 180° (Süd, 13:00) auf 270° (West)
    const progress = (minutes - 360) / (1200 - 360);
    const azimuth = 90 + progress * 180;
    // Höhe als Halbwelle: 0° am Rand, 60° in der Mitte
    const altitude = Math.sin(progress * Math.PI) * 60;
    samples.push({ minutes, azimuth, altitude });
  }
  return samples;
}

describe("Freier Horizont", () => {
  it("die Sonne ist da, sobald sie über der Schwelle steht", () => {
    const result = sunWindow(dayCurve(), []);
    expect(result.firstMinutes).toBe(370); // 06:10 – 06:00 liegt bei 0°
    expect(result.lastMinutes).toBe(1190);
    expect(result.fullyShaded).toBe(false);
    expect(result.sunnyMinutes).toBe(830);
  });
});

describe("Berg im Osten", () => {
  /** Ein Grat von 60° bis 120° Azimut, 20° hoch. */
  const ridge: ObstacleShape[] = [{ azimuth: 90, width: 60, height: 20 }];

  it("verschiebt den Sonnenaufgang nach hinten", () => {
    const open = sunWindow(dayCurve(), []);
    const behind = sunWindow(dayCurve(), ridge);
    expect(behind.firstMinutes).not.toBeNull();
    expect(behind.firstMinutes!).toBeGreaterThan(open.firstMinutes!);
    // Der Abend bleibt unberührt – der Grat steht im Osten.
    expect(behind.lastMinutes).toBe(open.lastMinutes);
  });

  it("die Verspätung ist die Zahl, die man versteht", () => {
    const open = sunWindow(dayCurve(), []);
    const behind = sunWindow(dayCurve(), ridge);
    const delay = delayVersusOpen(behind.firstMinutes, open.firstMinutes);
    expect(delay).not.toBeNull();
    expect(delay!).toBeGreaterThan(30);
  });
});

describe("Schattenplatz", () => {
  it("wird als solcher gemeldet, nicht als «keine Daten»", () => {
    // Eine Wand rundum, höher als die Sonne je steht.
    const walls: ObstacleShape[] = [{ azimuth: 0, width: 360, height: 89 }];
    const result = sunWindow(dayCurve(), walls);
    expect(result.firstMinutes).toBeNull();
    expect(result.sunnyMinutes).toBe(0);
    expect(result.fullyShaded).toBe(true);
  });

  it("Polarnacht ist kein Schattenplatz", () => {
    // Die Sonne kommt gar nicht hoch – das ist etwas anderes, als von
    // einem Berg verdeckt zu werden, und darf nicht so heissen.
    const night: SunSample[] = [
      { minutes: 600, azimuth: 180, altitude: -5 },
      { minutes: 610, azimuth: 185, altitude: -4 },
    ];
    const result = sunWindow(night, []);
    expect(result.firstMinutes).toBeNull();
    expect(result.fullyShaded).toBe(false);
  });
});

describe("Lücken im Horizont", () => {
  it("ein Zwischengipfel kürzt die besonnte Zeit, nicht das Fenster", () => {
    // Ein schmaler Turm mitten am Tag: Anfang und Ende bleiben, die
    // Summe der besonnten Minuten wird kleiner.
    const tower: ObstacleShape[] = [{ azimuth: 180, width: 10, height: 70 }];
    const open = sunWindow(dayCurve(), []);
    const withTower = sunWindow(dayCurve(), tower);
    expect(withTower.firstMinutes).toBe(open.firstMinutes);
    expect(withTower.lastMinutes).toBe(open.lastMinutes);
    expect(withTower.sunnyMinutes).toBeLessThan(open.sunnyMinutes);
  });
});

describe("Kanten", () => {
  it("zu wenige Proben ergeben nichts, statt zu raten", () => {
    expect(sunWindow([], []).firstMinutes).toBeNull();
    expect(
      sunWindow([{ minutes: 600, azimuth: 180, altitude: 40 }], []).sunnyMinutes
    ).toBe(0);
  });

  it("die Schwelle ist ein halbes Grad, nicht null", () => {
    // Bei genau 0° steht die Sonne halb hinter dem Horizont und wärmt
    // nichts – sie darf nicht als «da» zählen.
    const flat: SunSample[] = [
      { minutes: 600, azimuth: 90, altitude: 0 },
      { minutes: 610, azimuth: 95, altitude: SUN_MIN_ALTITUDE_DEG },
    ];
    expect(sunWindow(flat, []).firstMinutes).toBe(610);
  });

  it("ohne eine der beiden Zeiten gibt es keine Verspätung", () => {
    expect(delayVersusOpen(null, 400)).toBeNull();
    expect(delayVersusOpen(500, null)).toBeNull();
    // Nie negativ: Ein Horizont kann die Sonne nicht früher bringen.
    expect(delayVersusOpen(380, 400)).toBe(0);
  });
});
