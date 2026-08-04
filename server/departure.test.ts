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
  returnPlan,
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

describe("Rückreise-Planung (#286)", () => {
  it("rechnet von der Wunsch-Ankunft daheim rückwärts", () => {
    // 140 km = 2 h, keine Pause, 20 min Reserve → 15:40 losfahren
    const result = returnPlan({
      distanceKm: 140,
      homeArrivalTime: "18:00",
      checkoutTime: null,
      profile: "kinder",
    })!;
    expect(result.plan.departureTime).toBe("15:40");
    expect(result.afterCheckout).toBe(false);
    expect(result.arrivalIfCheckout).toBeNull();
  });

  it("nimmt für die Rückreise weniger Puffer als für die Anreise", () => {
    const hin = departurePlan({
      distanceKm: 140,
      arrivalTime: "18:00",
      profile: "keine",
    })!;
    const zurueck = returnPlan({
      distanceKm: 140,
      homeArrivalTime: "18:00",
      checkoutTime: null,
      profile: "keine",
    })!;
    // Daheim wartet keine Rezeption, die um 18 Uhr schliesst
    expect(zurueck.plan.bufferMinutes).toBeLessThan(hin.bufferMinutes);
  });

  it("meldet, wenn die Wunschzeit nach dem Check-out losfahren hiesse", () => {
    // Kurze Fahrt, späte Wunsch-Ankunft: rein rechnerisch könnte man bis
    // 15:40 bleiben – der Platz will die Wiese aber um 11 zurück
    const result = returnPlan({
      distanceKm: 140,
      homeArrivalTime: "18:00",
      checkoutTime: "11:00",
      profile: "keine",
    })!;
    expect(result.afterCheckout).toBe(true);
    // Dann zählt die ehrliche Zahl: um 11 los, um 13:20 daheim
    expect(result.arrivalIfCheckout).toBe("13:20");
  });

  it("behandelt eine unhaltbare Wunschzeit wie «nach dem Check-out»", () => {
    // 700 km und um 8 Uhr daheim sein: die Abfahrt läge am Vortag
    const result = returnPlan({
      distanceKm: 700,
      homeArrivalTime: "08:00",
      checkoutTime: "11:00",
      profile: "kinder",
    })!;
    expect(result.plan.daysEarlier).toBeGreaterThan(0);
    expect(result.afterCheckout).toBe(true);
    expect(result.arrivalIfCheckout).not.toBeNull();
  });

  it("sagt nichts über den Check-out, wenn keiner angegeben ist", () => {
    const result = returnPlan({
      distanceKm: 700,
      homeArrivalTime: "08:00",
      checkoutTime: null,
      profile: "kinder",
    })!;
    expect(result.afterCheckout).toBe(false);
  });

  it("erkennt eine Heimkehr nach Mitternacht", () => {
    const result = returnPlan({
      distanceKm: 900,
      homeArrivalTime: "10:00",
      checkoutTime: "11:00",
      profile: "kinder",
    })!;
    expect(result.arrivalDaysLater).toBeGreaterThanOrEqual(0);
    expect(result.arrivalIfCheckout).toMatch(/^\d{2}:\d{2}$/);
  });

  it("weist unbrauchbare Zeiten ab", () => {
    expect(
      returnPlan({
        distanceKm: 100,
        homeArrivalTime: "irgendwann",
        profile: "keine",
      })
    ).toBeNull();
  });
});

describe("Fahrzeit aus einer echten Route", () => {
  it("nimmt die Fahrzeit des Routendienstes, wenn sie vorliegt", () => {
    // Zürich–Biel: Luftlinie 87 km, Strasse 122 km und 91 Minuten
    const geschaetzt = departurePlan({
      distanceKm: 87,
      arrivalTime: "16:00",
      profile: "keine",
    })!;
    const geroutet = departurePlan({
      distanceKm: 122,
      arrivalTime: "16:00",
      profile: "keine",
      driveMinutes: 91,
    })!;
    expect(geschaetzt.driveMinutes).toBe(75);
    expect(geroutet.driveMinutes).toBe(91);
    // Wer mit der Luftlinie plant, fährt eine Viertelstunde zu spät los
    expect(parseTime(geroutet.departureTime)!).toBeLessThan(
      parseTime(geschaetzt.departureTime)!
    );
  });

  it("rechnet die Pausen auf der echten Fahrzeit", () => {
    // 130 Minuten Fahrt: mit Kindern eine Pause – über die Luftlinie
    // (110 Minuten) wäre es keine
    const plan = departurePlan({
      distanceKm: 128,
      arrivalTime: "16:00",
      profile: "kinder",
      driveMinutes: 130,
    })!;
    expect(plan.breaks).toBe(1);
  });

  it("fällt ohne Fahrzeit auf die Streckenlänge zurück", () => {
    const plan = departurePlan({
      distanceKm: 140,
      arrivalTime: "16:00",
      profile: "keine",
      driveMinutes: null,
    })!;
    expect(plan.driveMinutes).toBe(120);
  });

  it("gibt die Fahrzeit auch an die Rückreise weiter", () => {
    const result = returnPlan({
      distanceKm: 122,
      homeArrivalTime: "18:00",
      checkoutTime: null,
      profile: "keine",
      driveMinutes: 91,
    })!;
    expect(result.plan.driveMinutes).toBe(91);
  });
});
