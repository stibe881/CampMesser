import { describe, expect, it } from "vitest";
import {
  STORM_CAPE_THRESHOLD,
  firstStormRisk,
  stormClock,
  type StormHour,
} from "@shared/hikeStorm";

const TODAY = "2026-08-08";

const hour = (time: string, over: Partial<StormHour> = {}): StormHour => ({
  time,
  weatherCode: 1,
  cape: 100,
  ...over,
});

describe("firstStormRisk", () => {
  it("findet die erste labile Stunde des Tages", () => {
    const risk = firstStormRisk(
      [
        hour(`${TODAY}T10:00`),
        hour(`${TODAY}T14:00`, { cape: STORM_CAPE_THRESHOLD + 1 }),
      ],
      TODAY,
      9 * 60
    );
    expect(risk).toEqual({ minutes: 14 * 60, kind: "propensity" });
  });

  it("nennt ein angesagtes Gewitter beim Namen", () => {
    const risk = firstStormRisk(
      [hour(`${TODAY}T15:00`, { weatherCode: 95 })],
      TODAY,
      9 * 60
    );
    expect(risk?.kind).toBe("forecast");
  });

  it("nimmt die FRÜHESTE Risiko-Stunde, nicht die schwerste", () => {
    // Wer um 13 Uhr in die labile Luft läuft, dem hilft es nichts, dass
    // das eigentliche Gewitter erst um 16 Uhr angesagt ist.
    const risk = firstStormRisk(
      [
        hour(`${TODAY}T13:00`, { cape: STORM_CAPE_THRESHOLD + 1 }),
        hour(`${TODAY}T16:00`, { weatherCode: 96 }),
      ],
      TODAY,
      9 * 60
    );
    expect(risk).toEqual({ minutes: 13 * 60, kind: "propensity" });
  });

  it("ignoriert das Gewitter von heute Morgen", () => {
    // Vorbei ist vorbei – eine Warnung vor der Vergangenheit verwirrt nur.
    const risk = firstStormRisk(
      [hour(`${TODAY}T08:00`, { weatherCode: 95 })],
      TODAY,
      10 * 60
    );
    expect(risk).toBeNull();
  });

  it("ignoriert das Gewitter von MORGEN", () => {
    // Die Umkehrzeit rechnet für heute – also auch das Gewitter.
    const risk = firstStormRisk(
      [hour("2026-08-09T14:00", { weatherCode: 95 })],
      TODAY,
      9 * 60
    );
    expect(risk).toBeNull();
  });

  it("gibt ohne Risiko null zurück", () => {
    expect(firstStormRisk([hour(`${TODAY}T14:00`)], TODAY, 9 * 60)).toBeNull();
  });

  it("nutzt DIESELBE Schwelle wie die Unwetter-Erkennung", () => {
    // Zwei Schwellen hiessen: Das Wetter-Modul warnt und die Wanderkarte
    // schweigt – und beides verliert das Vertrauen.
    expect(STORM_CAPE_THRESHOLD).toBe(1500);
    expect(
      firstStormRisk([hour(`${TODAY}T14:00`, { cape: 1500 })], TODAY, 9 * 60)
    ).toBeNull();
  });
});

describe("stormClock", () => {
  it("schreibt Minuten als Uhrzeit", () => {
    expect(stormClock(14 * 60)).toBe("14:00");
    expect(stormClock(9 * 60 + 30)).toBe("09:30");
  });
});
