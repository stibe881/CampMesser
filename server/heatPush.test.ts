import { describe, expect, it } from "vitest";
import { buildHeatAlert } from "./push";

const base = {
  date: "2026-08-04",
  placeName: "Camping Sedrun",
};

describe("buildHeatAlert", () => {
  it("schweigt an einem milden Tag", () => {
    expect(buildHeatAlert({ ...base, uvIndexMax: 3, maxTempC: 22 })).toBeNull();
  });

  it("erinnert bei hohem UV ans Eincremen", () => {
    const alert = buildHeatAlert({ ...base, uvIndexMax: 8, maxTempC: 24 });
    expect(alert?.title).toContain("UV");
    expect(alert?.body).toContain("eincremen");
    expect(alert?.body).not.toContain("Wasser");
  });

  it("erinnert an einem Hitzetag ans Trinken", () => {
    const alert = buildHeatAlert({ ...base, uvIndexMax: 2, maxTempC: 31 });
    expect(alert?.body).toContain("Wasser");
    expect(alert?.body).not.toContain("eincremen");
  });

  it("packt beides in EINE Meldung", () => {
    const alert = buildHeatAlert({ ...base, uvIndexMax: 9, maxTempC: 33 });
    expect(alert?.body).toContain("eincremen");
    expect(alert?.body).toContain("Wasser");
    expect(alert?.body.split("·").length).toBe(2);
  });

  it("nennt den Ort im Titel", () => {
    const alert = buildHeatAlert({ ...base, uvIndexMax: 9, maxTempC: 33 });
    expect(alert?.title).toContain("Camping Sedrun");
  });

  it("benutzt einen Tages-Schlüssel für die Entprellung", () => {
    const alert = buildHeatAlert({ ...base, uvIndexMax: 9, maxTempC: 33 });
    expect(alert?.key).toBe("heat:2026-08-04");
  });
});
