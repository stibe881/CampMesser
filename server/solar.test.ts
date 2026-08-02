import { describe, expect, it } from "vitest";
import {
  compassDirection,
  computeSolarAlignment,
  goldenBlueHours,
} from "@shared/solar";
import { getSunTimes } from "../client/src/lib/sun";

// Referenzort: Bern, Schweiz
const BERN = { lat: 46.948, lng: 7.4474 };
const summerDay = new Date(2026, 5, 21, 12, 0, 0); // 21. Juni
const winterDay = new Date(2026, 11, 21, 12, 0, 0); // 21. Dezember

describe("computeSolarAlignment", () => {
  it("empfiehlt im Sommer in Bern eine Südausrichtung mit moderater Neigung", () => {
    const result = computeSolarAlignment(summerDay, BERN.lat, BERN.lng);
    expect(result).not.toBeNull();
    expect(result!.azimuth).toBeGreaterThanOrEqual(150);
    expect(result!.azimuth).toBeLessThanOrEqual(210);
    expect(result!.tilt).toBeGreaterThanOrEqual(10);
    expect(result!.tilt).toBeLessThanOrEqual(60);
    expect(result!.usableSunHours).toBeGreaterThan(10);
    expect(result!.shadedHours).toBe(0);
    expect(result!.firstSun).not.toBeNull();
    expect(result!.lastSun!.getTime()).toBeGreaterThan(
      result!.firstSun!.getTime()
    );
  });

  it("empfiehlt im Winter eine steilere Neigung als im Sommer (tiefe Sonne)", () => {
    const summer = computeSolarAlignment(summerDay, BERN.lat, BERN.lng)!;
    const winter = computeSolarAlignment(winterDay, BERN.lat, BERN.lng)!;
    expect(winter.tilt).toBeGreaterThan(summer.tilt);
    expect(winter.usableSunHours).toBeLessThan(summer.usableSunHours);
  });

  it("bringt gegenüber flach liegendem Panel im Winter deutlichen Mehrertrag", () => {
    const winter = computeSolarAlignment(winterDay, BERN.lat, BERN.lng)!;
    expect(winter.gainVsFlatPercent).toBeGreaterThan(30);
  });

  it("verschiebt die Ausrichtung nach Westen, wenn ein Hindernis den Osten verdeckt", () => {
    const free = computeSolarAlignment(summerDay, BERN.lat, BERN.lng)!;
    const blockedEast = computeSolarAlignment(summerDay, BERN.lat, BERN.lng, [
      { azimuth: 90, width: 140, height: 60 },
    ])!;
    expect(blockedEast.azimuth).toBeGreaterThan(free.azimuth);
    expect(blockedEast.usableSunHours).toBeLessThan(free.usableSunHours);
    expect(blockedEast.shadedHours).toBeGreaterThan(0);
    // Erste direkte Sonne kommt später als ohne Hindernis
    expect(blockedEast.firstSun!.getTime()).toBeGreaterThan(
      free.firstSun!.getTime()
    );
  });

  it("gibt null zurück, wenn der Standort komplett verschattet ist", () => {
    const result = computeSolarAlignment(summerDay, BERN.lat, BERN.lng, [
      { azimuth: 0, width: 360, height: 90 },
      { azimuth: 180, width: 360, height: 90 },
    ]);
    expect(result).toBeNull();
  });
});

describe("compassDirection", () => {
  it("übersetzt Azimut in Himmelsrichtungen", () => {
    expect(compassDirection(0)).toBe("N");
    expect(compassDirection(90)).toBe("O");
    expect(compassDirection(184)).toBe("S");
    expect(compassDirection(270)).toBe("W");
    expect(compassDirection(359)).toBe("N");
  });
});

describe("goldenBlueHours", () => {
  it("liefert in Bern plausible Fenster rund um Auf- und Untergang", () => {
    const result = goldenBlueHours(summerDay, BERN.lat, BERN.lng);
    expect(result.morning).not.toBeNull();
    expect(result.evening).not.toBeNull();
    const m = result.morning!;
    const e = result.evening!;

    // Morgens: blaue Stunde vor der goldenen, nahtloser Übergang bei −4°
    expect(m.blueStart.getTime()).toBeLessThan(m.blueEnd.getTime());
    expect(m.blueEnd.getTime()).toBe(m.goldenStart.getTime());
    expect(m.goldenStart.getTime()).toBeLessThan(m.goldenEnd.getTime());
    // Abends umgekehrt: goldene Stunde vor der blauen
    expect(e.goldenStart.getTime()).toBeLessThan(e.goldenEnd.getTime());
    expect(e.goldenEnd.getTime()).toBe(e.blueStart.getTime());
    expect(e.blueStart.getTime()).toBeLessThan(e.blueEnd.getTime());
    // Abend liegt nach dem Morgen
    expect(e.goldenStart.getTime()).toBeGreaterThan(m.goldenEnd.getTime());

    // Sonnenauf-/-untergang (Höhe ≈ −0.8°) liegen in der goldenen Stunde
    const times = getSunTimes(summerDay, BERN.lat, BERN.lng);
    expect(times.sunrise!.getTime()).toBeGreaterThan(m.goldenStart.getTime());
    expect(times.sunrise!.getTime()).toBeLessThan(m.goldenEnd.getTime());
    expect(times.sunset!.getTime()).toBeGreaterThan(e.goldenStart.getTime());
    expect(times.sunset!.getTime()).toBeLessThan(e.blueEnd.getTime());

    // Dauern in Bern: blaue Stunde 10–60 min, goldene Stunde 20–120 min
    const blueMin = (m.blueEnd.getTime() - m.blueStart.getTime()) / 60000;
    const goldenMin = (m.goldenEnd.getTime() - m.goldenStart.getTime()) / 60000;
    expect(blueMin).toBeGreaterThanOrEqual(10);
    expect(blueMin).toBeLessThanOrEqual(60);
    expect(goldenMin).toBeGreaterThanOrEqual(20);
    expect(goldenMin).toBeLessThanOrEqual(120);
  });

  it("gibt im Winter spätere Morgen-Fenster als im Sommer zurück", () => {
    const summer = goldenBlueHours(summerDay, BERN.lat, BERN.lng).morning!;
    const winter = goldenBlueHours(winterDay, BERN.lat, BERN.lng).morning!;
    // Minuten seit Mitternacht vergleichen (beide Tage lokal um 00:00 gestartet)
    const minutesOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes();
    expect(minutesOfDay(winter.goldenStart)).toBeGreaterThan(
      minutesOfDay(summer.goldenStart)
    );
  });

  it("liefert in Polarfällen null (Mitternachtssonne und Polarnacht)", () => {
    // Longyearbyen (Spitzbergen, 78°N): Sonne im Juni nie unter +6°,
    // im Dezember nie über −6° – beide Seiten bleiben null
    const midnightSun = goldenBlueHours(summerDay, 78.22, 15.65);
    expect(midnightSun.morning).toBeNull();
    expect(midnightSun.evening).toBeNull();
    const polarNight = goldenBlueHours(winterDay, 78.22, 15.65);
    expect(polarNight.morning).toBeNull();
    expect(polarNight.evening).toBeNull();
  });
});
