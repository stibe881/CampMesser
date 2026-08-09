import { describe, expect, it } from "vitest";
import { weekendWindows } from "@shared/weatherWindow";

/** Bequemer Tages-Baukasten mit trocken-warmen Standardwerten. */
function day(
  date: string,
  over: Partial<{
    tempMaxC: number;
    precipitationSumMm: number;
    precipitationProbabilityMax: number;
    windGustsMaxKmh: number;
  }> = {}
) {
  return {
    date,
    tempMaxC: 24,
    precipitationSumMm: 0,
    precipitationProbabilityMax: 10,
    windGustsMaxKmh: 20,
    ...over,
  };
}

describe("Wetterfenster-Finder (#538)", () => {
  it("findet beide Wochenenden und stellt das bessere zuoberst", () => {
    const days = [
      day("2026-08-14"),
      day("2026-08-15", { precipitationSumMm: 8, tempMaxC: 16 }),
      day("2026-08-16", { precipitationSumMm: 5 }),
      day("2026-08-17"),
      day("2026-08-22"),
      day("2026-08-23", { tempMaxC: 26 }),
    ];
    const windows = weekendWindows(days, "2026-08-09");
    expect(windows).toHaveLength(2);
    expect(windows[0].saturday.date).toBe("2026-08-22");
    expect(windows[0].verdict).toBe("top");
    expect(windows[1].saturday.date).toBe("2026-08-15");
    expect(windows[1].verdict).not.toBe("top");
    expect(windows[1].rainMm).toBe(13);
    expect(windows[0].tempMaxC).toBe(26);
  });

  it("zählt nur vollständige, bevorstehende Wochenenden", () => {
    // Sonntag ohne Samstag davor (heute IST Sonntag) zählt nicht,
    // ein Samstag am Prognose-Ende ohne Sonntag ebenfalls nicht.
    const days = [day("2026-08-09"), day("2026-08-15")];
    expect(weekendWindows(days, "2026-08-09")).toHaveLength(0);
  });

  it("straft Regen härter als kühle Temperaturen", () => {
    const rainy = weekendWindows(
      [
        day("2026-08-15", { precipitationSumMm: 12 }),
        day("2026-08-16", { precipitationSumMm: 10 }),
      ],
      "2026-08-09"
    )[0];
    const chilly = weekendWindows(
      [
        day("2026-08-15", { tempMaxC: 12 }),
        day("2026-08-16", { tempMaxC: 13 }),
      ],
      "2026-08-09"
    )[0];
    expect(rainy.verdict).toBe("bad");
    expect(chilly.score).toBeGreaterThan(rainy.score);
  });

  it("bewertet ein perfektes Wochenende mit voller Punktzahl", () => {
    const [w] = weekendWindows(
      [day("2026-08-15"), day("2026-08-16")],
      "2026-08-09"
    );
    expect(w.score).toBe(100);
    expect(w.verdict).toBe("top");
  });
});

/** Reisetage-Ampel (#587): bewertet DIE Tage einer konkreten Reise. */
describe("tripWindow", () => {
  const day = (date: string, rain = 0, temp = 22) => ({
    date,
    tempMaxC: temp,
    precipitationSumMm: rain,
  });

  it("bewertet die Reisetage und meldet volle Abdeckung", async () => {
    const { tripWindow } = await import("@shared/weatherWindow");
    const days = [
      day("2026-08-10"),
      day("2026-08-11"),
      day("2026-08-12"),
      day("2026-08-13"),
    ];
    const wx = tripWindow(days, "2026-08-11", "2026-08-12");
    expect(wx?.verdict).toBe("top");
    expect(wx?.coveredDays).toBe(2);
    expect(wx?.complete).toBe(true);
  });

  it("sagt ehrlich «vorläufig», wenn Tage fehlen", async () => {
    const { tripWindow } = await import("@shared/weatherWindow");
    const wx = tripWindow([day("2026-08-11", 12)], "2026-08-11", "2026-08-14");
    expect(wx?.complete).toBe(false);
    expect(wx?.coveredDays).toBe(1);
    expect(wx?.verdict).toBe("bad");
  });

  it("liefert null ausserhalb der Prognose", async () => {
    const { tripWindow } = await import("@shared/weatherWindow");
    expect(
      tripWindow([day("2026-08-10")], "2026-09-01", "2026-09-03")
    ).toBeNull();
  });
});
