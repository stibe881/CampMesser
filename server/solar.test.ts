import { describe, expect, it } from "vitest";
import { compassDirection, computeSolarAlignment } from "@shared/solar";

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
