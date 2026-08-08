import { describe, expect, it } from "vitest";
import {
  CALM_GUSTS_KMH,
  DEFAULT_WINDOW_HOURS,
  ROUGH_GUSTS_KMH,
  bestDryWindow,
  hourScore,
  windowClock,
  windowDate,
  windowVerdict,
  type DryHour,
} from "@shared/dryWindow";

const hour = (time: string, over: Partial<DryHour> = {}): DryHour => ({
  time,
  precipitationMm: 0,
  precipitationProbability: 0,
  windSpeedKmh: 8,
  windGustsKmh: 15,
  ...over,
});

/** Eine Reihe trockener Stunden ab 06:00. */
function calmDay(count: number, over: Partial<DryHour> = {}): DryHour[] {
  return Array.from({ length: count }, (_, i) =>
    hour(`2026-08-08T${String(6 + i).padStart(2, "0")}:00`, over)
  );
}

describe("hourScore", () => {
  it("gibt einer trockenen, windstillen Stunde die volle Note", () => {
    expect(hourScore(hour("2026-08-08T08:00"))).toBe(100);
  });

  it("straft Nieseln weniger als Guss", () => {
    const niesel = hourScore(
      hour("2026-08-08T08:00", {
        precipitationMm: 0.3,
        precipitationProbability: 70,
      })
    );
    const guss = hourScore(
      hour("2026-08-08T08:00", {
        precipitationMm: 4,
        precipitationProbability: 70,
      })
    );
    expect(niesel).toBeGreaterThan(guss);
  });

  it("misst den Wind an den BÖEN, nicht am Mittel", () => {
    // Weggeflogen ist ein Zelt in der Böe, nicht im Mittelwert.
    const boeig = hourScore(
      hour("2026-08-08T08:00", { windSpeedKmh: 10, windGustsKmh: 60 })
    );
    const gleichmaessig = hourScore(
      hour("2026-08-08T08:00", { windSpeedKmh: 30, windGustsKmh: 32 })
    );
    expect(boeig).toBeLessThan(gleichmaessig);
  });

  it("lässt Wind unter der Schwelle unbestraft", () => {
    expect(
      hourScore(hour("2026-08-08T08:00", { windGustsKmh: CALM_GUSTS_KMH }))
    ).toBe(100);
  });
});

describe("bestDryWindow", () => {
  it("findet das trockene Fenster zwischen zwei Regenblöcken", () => {
    const hours = [
      hour("2026-08-08T06:00", {
        precipitationMm: 3,
        precipitationProbability: 90,
      }),
      hour("2026-08-08T07:00", {
        precipitationMm: 3,
        precipitationProbability: 90,
      }),
      hour("2026-08-08T08:00"),
      hour("2026-08-08T09:00"),
      hour("2026-08-08T10:00", {
        precipitationMm: 5,
        precipitationProbability: 95,
      }),
    ];
    const found = bestDryWindow(hours, 2);
    expect(found?.startTime).toBe("2026-08-08T08:00");
    expect(found?.endTime).toBe("2026-08-08T09:00");
    expect(found?.fullyDry).toBe(true);
  });

  it("nimmt bei Gleichstand das FRÜHERE Fenster", () => {
    // Wer morgens abbaut, hat den Tag noch; wer aufs gleich gute Fenster
    // am Abend wartet, fährt im Dunkeln heim.
    const found = bestDryWindow(calmDay(8), 2);
    expect(found?.startTime).toBe("2026-08-08T06:00");
  });

  it("gibt null zurück, wenn die Prognose kürzer ist als das Fenster", () => {
    expect(bestDryWindow(calmDay(1), 3)).toBeNull();
    expect(bestDryWindow([], DEFAULT_WINDOW_HOURS)).toBeNull();
  });

  it("meldet Regenmenge und höchste Böe des Fensters", () => {
    const hours = [
      hour("2026-08-08T06:00", { precipitationMm: 0.4, windGustsKmh: 30 }),
      hour("2026-08-08T07:00", { precipitationMm: 0.2, windGustsKmh: 44 }),
    ];
    const found = bestDryWindow(hours, 2);
    expect(found?.precipitationMm).toBeCloseTo(0.6, 5);
    expect(found?.maxGustsKmh).toBe(44);
    expect(found?.fullyDry).toBe(false);
  });

  it("schaut nicht weiter als zwei Tage voraus", () => {
    // Ab da ist die Stundenprognose eine Erzählung. Die perfekte Stunde
    // in 60 Stunden darf das Ergebnis nicht bestimmen.
    const lang: DryHour[] = Array.from({ length: 70 }, (_, i) =>
      hour(`h${i}`, {
        precipitationMm: i >= 60 ? 0 : 5,
        precipitationProbability: 90,
      })
    );
    const found = bestDryWindow(lang, 2);
    expect(found?.fullyDry).toBe(false);
  });
});

describe("windowVerdict", () => {
  it("nennt ein trockenes, ruhiges Fenster gut", () => {
    expect(windowVerdict(bestDryWindow(calmDay(4), 2))).toBe("good");
  });

  it("überstimmt die gute Note bei starken Böen", () => {
    // Ohne einen Tropfen Regen, aber 55 km/h Böen: kein Zeltwetter,
    // egal was die Zahl sagt.
    const stuermisch = bestDryWindow(
      calmDay(4, { windGustsKmh: ROUGH_GUSTS_KMH + 5 }),
      2
    );
    expect(stuermisch!.fullyDry).toBe(true);
    expect(windowVerdict(stuermisch)).toBe("poor");
  });

  it("nennt Dauerregen schlecht statt das beste von lauter schlechten zu loben", () => {
    const nass = bestDryWindow(
      calmDay(4, { precipitationMm: 4, precipitationProbability: 95 }),
      2
    );
    expect(windowVerdict(nass)).toBe("poor");
  });

  it("hält ein Fenster ohne Daten für schlecht und nicht für gut", () => {
    expect(windowVerdict(null)).toBe("poor");
  });
});

describe("windowClock / windowDate", () => {
  it("rechnet das Ende auf das ENDE der letzten Stunde", () => {
    // Wer bis 10:00 abbauen will, hat die Stunde ab 09:00 noch ganz.
    const found = bestDryWindow(calmDay(2), 2)!;
    expect(windowClock(found)).toEqual({ from: "06:00", to: "08:00" });
  });

  it("läuft über Mitternacht", () => {
    const found = bestDryWindow(
      [hour("2026-08-08T22:00"), hour("2026-08-08T23:00")],
      2
    )!;
    expect(windowClock(found).to).toBe("00:00");
  });

  it("nennt den Tag des Fensters", () => {
    expect(windowDate(bestDryWindow(calmDay(2), 2)!)).toBe("2026-08-08");
  });
});
