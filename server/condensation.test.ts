import { describe, expect, it } from "vitest";
import {
  CONDENSATION_SPREAD_C,
  condensationOutlook,
  dewPointC,
  type CondensationHour,
} from "@shared/condensation";

const TODAY = "2026-08-08";

/** Eine Nachtstunde mit vernünftigen Standardwerten. */
const hour = (
  time: string,
  over: Partial<CondensationHour> = {}
): CondensationHour => ({
  time,
  temperatureC: 12,
  humidityPercent: 70,
  cloudCover: 20,
  windSpeedKmh: 5,
  ...over,
});

/** Die Stunden 21–04 Uhr, alle gleich – der Testfall ändert einzelne. */
const night = (over: Partial<CondensationHour> = {}): CondensationHour[] => [
  hour(`${TODAY}T21:00`, over),
  hour(`${TODAY}T22:00`, over),
  hour(`${TODAY}T23:00`, over),
  hour("2026-08-09T00:00", over),
  hour("2026-08-09T02:00", over),
  hour("2026-08-09T04:00", over),
];

describe("dewPointC", () => {
  it("liefert bei 100 % Luftfeuchte die Lufttemperatur", () => {
    expect(dewPointC(10, 100)).toBeCloseTo(10, 5);
  });

  it("liegt bei trockener Luft deutlich unter der Temperatur", () => {
    const dew = dewPointC(20, 40);
    expect(dew).not.toBeNull();
    expect(dew!).toBeLessThan(8);
  });

  it("sagt ohne brauchbare Feuchte nichts", () => {
    expect(dewPointC(10, 0)).toBeNull();
    expect(dewPointC(10, 101)).toBeNull();
    expect(dewPointC(NaN, 50)).toBeNull();
  });
});

describe("condensationOutlook", () => {
  it("klar, windstill und feucht: das Zelt wird wahrscheinlich nass", () => {
    const outlook = condensationOutlook(night({ humidityPercent: 95 }), TODAY);
    expect(outlook?.level).toBe("high");
    expect(outlook?.minSpreadC).toBeLessThanOrEqual(CONDENSATION_SPREAD_C);
  });

  it("Taupunkt erreicht, aber bedeckt und windig: nur noch «möglich»", () => {
    const outlook = condensationOutlook(
      night({ humidityPercent: 95, cloudCover: 90, windSpeedKmh: 20 }),
      TODAY
    );
    expect(outlook?.level).toBe("possible");
  });

  it("knapp über dem Taupunkt zählt NUR bei Abstrahlungswetter", () => {
    // Die Prognose misst die Luft in 2 m Höhe – das Zeltdach strahlt in
    // der klaren Nacht darunter ab. Bei Wolken fehlt genau dieser Effekt.
    const clear = condensationOutlook(night({ humidityPercent: 82 }), TODAY);
    expect(clear?.level).toBe("possible");
    const cloudy = condensationOutlook(
      night({ humidityPercent: 82, cloudCover: 90 }),
      TODAY
    );
    expect(cloudy).toBeNull();
  });

  it("eine trockene Nacht erzeugt KEINE Karte", () => {
    // «Zelt bleibt trocken» wäre eine Zusage, die die Prognose nicht
    // geben kann – dann lieber gar nichts.
    expect(condensationOutlook(night({ humidityPercent: 50 }), TODAY)).toBe(
      null
    );
  });

  it("zählt nur die kommende Nacht, nicht den Nachmittag", () => {
    const afternoon = [
      hour(`${TODAY}T14:00`, { humidityPercent: 99 }),
      ...night({ humidityPercent: 50 }),
    ];
    expect(condensationOutlook(afternoon, TODAY)).toBeNull();
  });

  it("sagt mit zu wenigen Nachtstunden gar nichts", () => {
    const few = night({ humidityPercent: 95 }).slice(0, 3);
    expect(condensationOutlook(few, TODAY)).toBeNull();
  });

  it("Stunden ohne Luftfeuchte fallen weg statt zu raten", () => {
    const few = night({ humidityPercent: 95 }).map((h, i) =>
      i < 3 ? { ...h, humidityPercent: undefined } : h
    );
    expect(condensationOutlook(few, TODAY)).toBeNull();
  });

  it("nennt die Stunde des kleinsten Abstands", () => {
    const hours = night({ humidityPercent: 80 }).map(h =>
      h.time === "2026-08-09T04:00" ? { ...h, humidityPercent: 97 } : h
    );
    const outlook = condensationOutlook(hours, TODAY);
    expect(outlook?.atTime).toBe("2026-08-09T04:00");
  });
});
