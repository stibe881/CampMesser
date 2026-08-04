import { describe, expect, it } from "vitest";
import {
  PARKING_NOTE_MAX_LENGTH,
  PARKING_WARN_MINUTES,
  parkedMinutes,
  parkingStatus,
  sanitizeParkingLimit,
  sanitizeParkingNote,
  splitDuration,
} from "@shared/parking";
import {
  CAR_TARGET_ID,
  findCarTarget,
  parkCar,
  updateParking,
  type TentFinderTarget,
} from "../client/src/lib/tentFinderTargets";

const NOW = 1_700_000_000_000;
const MINUTE = 60_000;

const tent: TentFinderTarget = {
  id: "t1",
  name: "Zelt",
  lat: 47,
  lon: 8,
  savedAt: NOW,
  icon: "tent",
};

describe("Auto-Standort merken (#283)", () => {
  it("rechnet, wie lange das Auto schon steht", () => {
    expect(parkedMinutes(NOW - 90 * MINUTE, NOW)).toBe(90);
    expect(parkedMinutes(NOW, NOW)).toBe(0);
    // Verstellte Uhr soll keine negative Parkzeit erzeugen
    expect(parkedMinutes(NOW + 10 * MINUTE, NOW)).toBe(0);
    expect(parkedMinutes(0, NOW)).toBe(0);
  });

  it("erfindet ohne Limit keinen Ablauf", () => {
    const status = parkingStatus(NOW - 300 * MINUTE, null, NOW);
    expect(status.state).toBe("none");
    expect(status.remainingMinutes).toBeNull();
    expect(status.elapsedMinutes).toBe(300);
  });

  it("warnt rechtzeitig vor Ablauf der Parkzeit", () => {
    const laufend = parkingStatus(NOW - 30 * MINUTE, 120, NOW);
    expect(laufend.state).toBe("running");
    expect(laufend.remainingMinutes).toBe(90);

    const knapp = parkingStatus(
      NOW - (120 - PARKING_WARN_MINUTES) * MINUTE,
      120,
      NOW
    );
    expect(knapp.state).toBe("soon");

    const abgelaufen = parkingStatus(NOW - 150 * MINUTE, 120, NOW);
    expect(abgelaufen.state).toBe("expired");
    expect(abgelaufen.remainingMinutes).toBe(0);
  });

  it("nimmt nur die angebotenen Parkzeiten", () => {
    expect(sanitizeParkingLimit(60)).toBe(60);
    expect(sanitizeParkingLimit(45)).toBeNull();
    expect(sanitizeParkingLimit("60")).toBeNull();
    expect(sanitizeParkingLimit(undefined)).toBeNull();
  });

  it("säubert die Notiz, statt sie roh zu übernehmen", () => {
    expect(sanitizeParkingNote("  Ebene 3,\n Reihe C ")).toBe(
      "Ebene 3, Reihe C"
    );
    expect(sanitizeParkingNote("x".repeat(200))).toHaveLength(
      PARKING_NOTE_MAX_LENGTH
    );
    expect(sanitizeParkingNote(42)).toBe("");
  });

  it("zerlegt die Dauer in Stunden und Minuten", () => {
    expect(splitDuration(125)).toEqual({ hours: 2, minutes: 5 });
    expect(splitDuration(45)).toEqual({ hours: 0, minutes: 45 });
    expect(splitDuration(-5)).toEqual({ hours: 0, minutes: 0 });
  });

  it("merkt genau EIN Auto – ein neuer Tipp ersetzt den alten Standort", () => {
    const first = parkCar([tent], {
      lat: 47.1,
      lon: 8.1,
      savedAt: NOW,
      name: "Auto",
    });
    const second = parkCar(first, {
      lat: 47.2,
      lon: 8.2,
      savedAt: NOW + 3600_000,
      name: "Auto",
    });
    const cars = second.filter(x => x.id === CAR_TARGET_ID);
    expect(cars).toHaveLength(1);
    expect(cars[0].lat).toBeCloseTo(47.2, 5);
    // Das Zelt bleibt unberührt
    expect(second.some(x => x.id === "t1")).toBe(true);
  });

  it("nimmt Notiz und Parkzeit beim Umparkieren NICHT mit", () => {
    const parked = updateParking(
      parkCar([], { lat: 47, lon: 8, savedAt: NOW, name: "Auto" }),
      { note: "Ebene 3", parkingLimitMinutes: 120 }
    );
    expect(findCarTarget(parked)?.note).toBe("Ebene 3");
    const moved = parkCar(parked, {
      lat: 47.5,
      lon: 8.5,
      savedAt: NOW + 1000,
      name: "Auto",
    });
    // «Ebene 3» wäre am neuen Ort schlicht falsch
    expect(findCarTarget(moved)?.note).toBeUndefined();
    expect(findCarTarget(moved)?.parkingLimitMinutes).toBeUndefined();
  });

  it("ändert Notiz und Parkzeit, ohne Standort und Zeit anzufassen", () => {
    const parked = parkCar([], {
      lat: 47,
      lon: 8,
      savedAt: NOW,
      name: "Auto",
    });
    const updated = updateParking(parked, {
      note: "Reihe C",
      parkingLimitMinutes: 60,
    });
    const car = findCarTarget(updated)!;
    expect(car.savedAt).toBe(NOW);
    expect(car.lat).toBe(47);
    expect(car.note).toBe("Reihe C");
    expect(car.parkingLimitMinutes).toBe(60);
    // Leere Notiz und «ohne Limit» entfernen die Felder wieder
    const cleared = updateParking(updated, {
      note: "  ",
      parkingLimitMinutes: null,
    });
    expect(findCarTarget(cleared)?.note).toBeUndefined();
    expect(findCarTarget(cleared)?.parkingLimitMinutes).toBeUndefined();
  });

  it("ohne gemerktes Auto bleibt die Liste unverändert", () => {
    const list = [tent];
    expect(findCarTarget(list)).toBeUndefined();
    expect(updateParking(list, { note: "egal" })).toBe(list);
  });
});
