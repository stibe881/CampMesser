import { describe, expect, it } from "vitest";
import {
  buildTripAlert,
  type PackProgressLike,
  type TripForAlert,
} from "./push";

const TODAY = "2026-08-02";

function trip(overrides: Partial<TripForAlert> = {}): TripForAlert {
  return {
    id: 1,
    name: "Camping Aareschlucht",
    startDate: "2026-08-05",
    packListId: null,
    ...overrides,
  };
}

const noProgress = new Map<number, PackProgressLike>();

describe("buildTripAlert", () => {
  it("gibt null zurück ohne Trips oder ohne Anreise im 3-Tage-Fenster", () => {
    expect(buildTripAlert([], noProgress, TODAY)).toBeNull();
    expect(
      buildTripAlert(
        [
          // zu weit weg, heute (Countdown vorbei) und bereits vergangen
          trip({ startDate: "2026-08-06" }),
          trip({ id: 2, startDate: "2026-08-02" }),
          trip({ id: 3, startDate: "2026-07-20" }),
        ],
        noProgress,
        TODAY
      )
    ).toBeNull();
  });

  it("meldet genau 3 Tage vor der Anreise (ohne Packliste ohne Prozent-Teil)", () => {
    const alert = buildTripAlert(
      [trip({ startDate: "2026-08-05" })],
      noProgress,
      TODAY
    );
    expect(alert).toEqual({
      title: "⛺ In 3 Tagen: Camping Aareschlucht",
      body: "Dein Aufenthalt beginnt bald – denk ans Packen.",
      key: "trip:1",
    });
  });

  it("greift bei verpasstem Cron auch 2 oder 1 Tag vorher (Singular «In 1 Tag»)", () => {
    const twoDays = buildTripAlert(
      [trip({ startDate: "2026-08-04" })],
      noProgress,
      TODAY
    );
    expect(twoDays!.title).toBe("⛺ In 2 Tagen: Camping Aareschlucht");
    const oneDay = buildTripAlert(
      [trip({ startDate: "2026-08-03" })],
      noProgress,
      TODAY
    );
    expect(oneDay!.title).toBe("⛺ In 1 Tag: Camping Aareschlucht");
  });

  it("hängt den Pack-Fortschritt der verknüpften Liste an (Rundung wie packing.progress)", () => {
    const progress = new Map<number, PackProgressLike>([
      [7, { total: 19, checked: 12 }],
    ]);
    const alert = buildTripAlert(
      [trip({ startDate: "2026-08-05", packListId: 7 })],
      progress,
      TODAY
    );
    // 12/19 = 63.15… → gerundet 63
    expect(alert!.body).toBe("Packliste zu 63 % erledigt");
  });

  it("zeigt 0 % bei leerer Packliste und lässt den Teil bei unbekannter Liste weg", () => {
    const progress = new Map<number, PackProgressLike>([
      [7, { total: 0, checked: 0 }],
    ]);
    expect(
      buildTripAlert([trip({ packListId: 7 })], progress, TODAY)!.body
    ).toBe("Packliste zu 0 % erledigt");
    // Liste verknüpft, aber (mehr) nicht vorhanden → wie ohne Packliste
    expect(
      buildTripAlert([trip({ packListId: 99 })], noProgress, TODAY)!.body
    ).toBe("Dein Aufenthalt beginnt bald – denk ans Packen.");
  });

  it("meldet den am nächsten bevorstehenden Trip und liefert dessen Dedup-Key", () => {
    const alert = buildTripAlert(
      [
        trip({ id: 5, name: "Später", startDate: "2026-08-05" }),
        trip({ id: 9, name: "Zuerst", startDate: "2026-08-03" }),
      ],
      noProgress,
      TODAY
    );
    expect(alert!.title).toBe("⛺ In 1 Tag: Zuerst");
    expect(alert!.key).toBe("trip:9");
  });

  it("Dedup: derselbe Trip liefert an allen Schwellen denselben Key", () => {
    // Der Aufruf ist pur – die eigentliche Deduplizierung passiert in
    // checkAndNotify über lastTripKey. Wichtig ist nur: der Key hängt
    // ausschliesslich an der Trip-Id, nicht an Schwelle oder Datum.
    const at3 = buildTripAlert(
      [trip({ startDate: "2026-08-05" })],
      noProgress,
      "2026-08-02"
    );
    const at1 = buildTripAlert(
      [trip({ startDate: "2026-08-05" })],
      noProgress,
      "2026-08-04"
    );
    expect(at3!.key).toBe("trip:1");
    expect(at1!.key).toBe(at3!.key);
  });
});
