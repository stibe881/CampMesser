import { describe, expect, it } from "vitest";
import {
  BREAK_PROFILES,
  DEFAULT_BUFFER_MINUTES,
  arrivalPlan,
  breakCount,
  breakMinutes,
  breakSchedule,
  departurePlan,
  driveMinutes,
  formatTime,
  parseTime,
} from "@shared/departure";

describe("Beste Abfahrtszeit (#285)", () => {
  it("rechnet die Fahrzeit aus der Luftlinie", () => {
    expect(driveMinutes(70)).toBe(60);
    expect(driveMinutes(140)).toBe(120);
    expect(driveMinutes(0)).toBe(0);
    expect(driveMinutes(-5)).toBe(0);
  });

  it("macht nach der letzten Etappe keine Pause mehr", () => {
    // Genau zwei Stunden mit Kindern (alle 120 min): keine Pause fünf
    // Minuten vor dem Ziel
    expect(breakCount(120, "kinder")).toBe(0);
    expect(breakCount(121, "kinder")).toBe(1);
    expect(breakCount(240, "kinder")).toBe(1);
    expect(breakCount(241, "kinder")).toBe(2);
  });

  it("kennt das Profil ohne Pausen", () => {
    expect(breakCount(600, "keine")).toBe(0);
    expect(breakMinutes(600, "keine")).toBe(0);
  });

  it("mit Kleinkindern dauert dieselbe Fahrt deutlich länger", () => {
    const drive = 300; // fünf Stunden reine Fahrzeit
    expect(breakMinutes(drive, "erwachsene")).toBe(15);
    expect(breakMinutes(drive, "kinder")).toBe(50);
    expect(breakMinutes(drive, "kleinkinder")).toBe(90);
    expect(BREAK_PROFILES.kleinkinder.everyMinutes).toBeLessThan(
      BREAK_PROFILES.erwachsene.everyMinutes
    );
  });

  it("rechnet von der Check-in-Zeit rückwärts", () => {
    // 140 km = 2 h Fahrt, mit Kindern 1 Pause à 25 min, 30 min Puffer
    const plan = departurePlan({
      distanceKm: 140,
      arrivalTime: "16:00",
      profile: "kinder",
    })!;
    expect(plan.driveMinutes).toBe(120);
    expect(plan.breaks).toBe(0); // genau zwei Stunden → keine Pause
    expect(plan.bufferMinutes).toBe(DEFAULT_BUFFER_MINUTES);
    expect(plan.totalMinutes).toBe(150);
    expect(plan.departureTime).toBe("13:30");
    expect(plan.daysEarlier).toBe(0);
  });

  it("rechnet Pausen in die Abfahrtszeit ein", () => {
    const ohne = departurePlan({
      distanceKm: 350,
      arrivalTime: "16:00",
      profile: "keine",
    })!;
    const mitKindern = departurePlan({
      distanceKm: 350,
      arrivalTime: "16:00",
      profile: "kinder",
    })!;
    expect(mitKindern.totalMinutes).toBeGreaterThan(ohne.totalMinutes);
    // Wer die Pausen vergisst, fährt zu spät los
    expect(parseTime(mitKindern.departureTime)!).toBeLessThan(
      parseTime(ohne.departureTime)!
    );
  });

  it("sagt es, wenn die Abfahrt auf den Vortag fällt", () => {
    const plan = departurePlan({
      distanceKm: 700, // 10 h Fahrt
      arrivalTime: "08:00",
      profile: "kinder",
    })!;
    expect(plan.daysEarlier).toBe(1);
    // Die Uhrzeit selbst bleibt eine gültige Uhrzeit
    expect(plan.departureTime).toMatch(/^\d{2}:\d{2}$/);
  });

  it("rechnet für die Rückreise vorwärts", () => {
    const plan = arrivalPlan({
      distanceKm: 140,
      departureTime: "10:00",
      profile: "kinder",
    })!;
    expect(plan.arrivalTime).toBe("12:30");
    expect(plan.daysLater).toBe(0);
  });

  it("nennt die Uhrzeit jeder Pause", () => {
    // 5 h Fahrt mit Kindern: Pausen nach 2 h und nach 4 h Fahrt
    const stops = breakSchedule("09:00", 300, "kinder");
    expect(stops).toEqual(["11:00", "13:25"]);
  });

  it("weist unbrauchbare Zeiten ab, statt etwas zu erfinden", () => {
    expect(parseTime("25:00")).toBeNull();
    expect(parseTime("8:00")).toBeNull();
    expect(parseTime("")).toBeNull();
    expect(
      departurePlan({
        distanceKm: 100,
        arrivalTime: "abends",
        profile: "keine",
      })
    ).toBeNull();
  });

  it("formatiert Zeiten über Mitternacht hinaus richtig", () => {
    expect(formatTime(0)).toBe("00:00");
    expect(formatTime(1440 + 90)).toBe("01:30");
    expect(formatTime(-30)).toBe("23:30");
  });
});
