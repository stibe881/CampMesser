import { describe, expect, it } from "vitest";
import {
  ASTRO_CLOUD_MAX_PERCENT,
  ASTRO_MOON_MAX_ILLUMINATION,
  buildMeteorAlert,
  nightCloudCover,
  showerNearPeak,
} from "./push";

/** Klare, dunkle Perseiden-Nacht als Ausgangslage – Abweichungen pro Test. */
const BASE = {
  date: "2026-08-12",
  cloudCoverNight: 15,
  moonIllumination: 0.2,
  activeShower: { name: "Perseiden", zhr: 100 },
  placeName: "Zuhause",
};

describe("buildMeteorAlert", () => {
  it("meldet den Strom bei klarer, dunkler Nacht (Dedup-Schlüssel astro:<Datum>)", () => {
    expect(buildMeteorAlert(BASE)).toEqual({
      title: "🌠 Heute Nacht: Perseiden",
      body: "Klarer Himmel am Ort «Zuhause» – bis zu 100 Sternschnuppen pro Stunde.",
      key: "astro:2026-08-12",
    });
  });

  it("schweigt ohne aktiven Strom in Peak-Nähe", () => {
    expect(buildMeteorAlert({ ...BASE, activeShower: null })).toBeNull();
  });

  it("schweigt bei bewölktem Himmel oder unbekannter Bewölkung", () => {
    expect(
      buildMeteorAlert({ ...BASE, cloudCoverNight: ASTRO_CLOUD_MAX_PERCENT })
    ).toBeNull();
    expect(buildMeteorAlert({ ...BASE, cloudCoverNight: null })).toBeNull();
    // knapp unter der Schwelle wird gemeldet
    expect(
      buildMeteorAlert({
        ...BASE,
        cloudCoverNight: ASTRO_CLOUD_MAX_PERCENT - 0.1,
      })
    ).not.toBeNull();
  });

  it("schweigt bei hellem Mond (ab 60 % Beleuchtung)", () => {
    expect(
      buildMeteorAlert({
        ...BASE,
        moonIllumination: ASTRO_MOON_MAX_ILLUMINATION,
      })
    ).toBeNull();
    expect(buildMeteorAlert({ ...BASE, moonIllumination: 0.95 })).toBeNull();
    // knapp darunter wird gemeldet
    expect(
      buildMeteorAlert({
        ...BASE,
        moonIllumination: ASTRO_MOON_MAX_ILLUMINATION - 0.01,
      })
    ).not.toBeNull();
  });
});

describe("showerNearPeak", () => {
  it("findet die Perseiden am Maximum und im ±3-Tage-Fenster", () => {
    expect(showerNearPeak(new Date(2026, 7, 12))?.id).toBe("perseiden");
    expect(showerNearPeak(new Date(2026, 7, 9))?.id).toBe("perseiden");
    expect(showerNearPeak(new Date(2026, 7, 15))?.id).toBe("perseiden");
  });

  it("gibt null zurück, wenn Ströme zwar aktiv, die Maxima aber fern sind", () => {
    // 20. Juli: Delta-Aquariiden (Peak 30.7.) und Perseiden (Peak 12.8.)
    // sind aktiv, beide Maxima liegen aber mehr als 3 Tage entfernt.
    expect(showerNearPeak(new Date(2026, 6, 20))).toBeNull();
  });

  it("funktioniert über den Jahreswechsel (Quadrantiden, Peak 3.1.)", () => {
    expect(showerNearPeak(new Date(2026, 11, 31))?.id).toBe("quadrantiden");
    expect(showerNearPeak(new Date(2027, 0, 2))?.id).toBe("quadrantiden");
  });

  it("wählt bei mehreren aktiven Strömen den näheren Peak", () => {
    // 2. August: Delta-Aquariiden-Peak (30.7.) 3 Tage entfernt,
    // Perseiden-Peak (12.8.) 10 Tage → die Delta-Aquariiden gewinnen.
    expect(showerNearPeak(new Date(2026, 7, 2))?.id).toBe("delta-aquariiden");
  });
});

describe("nightCloudCover", () => {
  it("mittelt genau die Stunden 21–24 Uhr des Datums", () => {
    const hourly = [
      { time: "2026-08-12T20:00", cloudCover: 100 },
      { time: "2026-08-12T21:00", cloudCover: 10 },
      { time: "2026-08-12T22:00", cloudCover: 20 },
      { time: "2026-08-12T23:00", cloudCover: 30 },
      { time: "2026-08-13T21:00", cloudCover: 90 },
    ];
    expect(nightCloudCover(hourly, "2026-08-12")).toBe(20);
  });

  it("gibt null ohne passende Nacht-Stunden zurück", () => {
    expect(nightCloudCover([], "2026-08-12")).toBeNull();
    expect(
      nightCloudCover(
        [{ time: "2026-08-12T12:00", cloudCover: 5 }],
        "2026-08-12"
      )
    ).toBeNull();
  });
});
