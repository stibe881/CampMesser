import { describe, expect, it } from "vitest";
import {
  buildDryingAlert,
  DRY_ALERT_RAIN_MM,
  type TripForDrying,
} from "./push";

const TODAY = "2026-08-02";
/** endDate = gestern relativ zu TODAY */
const YESTERDAY = "2026-08-01";

function trip(overrides: Partial<TripForDrying> = {}): TripForDrying {
  return {
    id: 1,
    name: "Camping Aareschlucht",
    endDate: YESTERDAY,
    ...overrides,
  };
}

const noRain = new Map<number, number>();

describe("buildDryingAlert", () => {
  it("gibt null zurück ohne Trips oder wenn kein Trip gestern endete", () => {
    expect(buildDryingAlert([], noRain, TODAY)).toBeNull();
    expect(
      buildDryingAlert(
        [
          // noch unterwegs, heute zurück und schon länger daheim
          trip({ endDate: "2026-08-05" }),
          trip({ id: 2, endDate: TODAY }),
          trip({ id: 3, endDate: "2026-07-28" }),
        ],
        noRain,
        TODAY
      )
    ).toBeNull();
  });

  it("erinnert ans Trocknen, wenn es während des Aufenthalts geregnet hat", () => {
    const rain = new Map([[1, 7.4]]);
    const alert = buildDryingAlert([trip()], rain, TODAY);
    expect(alert).toEqual({
      title: "⛺ Zelt trocknen nicht vergessen",
      body: "Während «Camping Aareschlucht» sind rund 7 mm Regen gefallen – häng das Zelt zum Trocknen auf, bevor es ins Lager kommt.",
      key: "dry:1",
    });
  });

  it("schweigt bei trockenem Aufenthalt (Regensumme unter der Schwelle)", () => {
    const rain = new Map([[1, DRY_ALERT_RAIN_MM - 0.1]]);
    expect(buildDryingAlert([trip()], rain, TODAY)).toBeNull();
    // genau an der Schwelle wird erinnert
    const atThreshold = buildDryingAlert(
      [trip()],
      new Map([[1, DRY_ALERT_RAIN_MM]]),
      TODAY
    );
    expect(atThreshold).not.toBeNull();
  });

  it("erinnert ohne Koordinaten (keine Regensumme) immer – mit neutralem Text", () => {
    const alert = buildDryingAlert(
      [trip({ id: 4, name: "Wiese am Bach" })],
      noRain,
      TODAY
    );
    expect(alert).toEqual({
      title: "⛺ Zelt auslüften nicht vergessen",
      body: "Willkommen zurück von «Wiese am Bach» – lüfte das Zelt gut aus, bevor es ins Lager kommt.",
      key: "dry:4",
    });
  });

  it("bevorzugt bei mehreren Heimkehren den Trip mit dem meisten Regen", () => {
    const rain = new Map([
      [1, 4],
      [2, 12],
    ]);
    const alert = buildDryingAlert(
      [
        trip({ id: 1, name: "Wenig Regen" }),
        trip({ id: 2, name: "Viel Regen" }),
        trip({ id: 3, name: "Ohne Koordinaten" }),
      ],
      rain,
      TODAY
    );
    expect(alert!.key).toBe("dry:2");
    expect(alert!.body).toContain("Viel Regen");
  });

  it("Dedup: der Schlüssel hängt nur an der Trip-Id («dry:<id>»)", () => {
    const wet = buildDryingAlert([trip({ id: 9 })], new Map([[9, 20]]), TODAY);
    const dry = buildDryingAlert([trip({ id: 9 })], noRain, TODAY);
    // gleicher Trip → gleicher Schlüssel, unabhängig vom Regen-Wissen
    expect(wet!.key).toBe("dry:9");
    expect(dry!.key).toBe(wet!.key);
  });
});
