import { describe, expect, it } from "vitest";
import {
  buildEvePackAlert,
  EVE_PACK_SEND_HOUR_FROM,
  EVE_PACK_SEND_HOUR_TO,
  type PackProgressLike,
  type TripForAlert,
} from "./push";

const TODAY = "2026-08-03";
/** Anreise morgen – der Abend davor ist genau das Fenster des Checks. */
const TOMORROW = "2026-08-04";

function trip(overrides: Partial<TripForAlert> = {}): TripForAlert {
  return {
    id: 1,
    name: "Camping Aareschlucht",
    startDate: TOMORROW,
    packListId: 7,
    ...overrides,
  };
}

function progress(
  entries: [number, PackProgressLike][]
): Map<number, PackProgressLike> {
  return new Map(entries);
}

describe("buildEvePackAlert", () => {
  it("erinnert am Abend vor der Anreise mit Prozent-Stand", () => {
    const alert = buildEvePackAlert(
      [trip()],
      progress([[7, { total: 10, checked: 6 }]]),
      TODAY
    );
    expect(alert).not.toBeNull();
    expect(alert!.title).toContain("Camping Aareschlucht");
    expect(alert!.body).toContain("60 %");
    expect(alert!.key).toBe("evepack:1");
  });

  it("meldet nichts bei vollständig abgehakter Packliste", () => {
    expect(
      buildEvePackAlert(
        [trip()],
        progress([[7, { total: 10, checked: 10 }]]),
        TODAY
      )
    ).toBeNull();
  });

  it("meldet nichts ohne verknüpfte Packliste", () => {
    expect(
      buildEvePackAlert(
        [trip({ packListId: null })],
        progress([[7, { total: 10, checked: 1 }]]),
        TODAY
      )
    ).toBeNull();
  });

  it("meldet nichts bei leerer Packliste", () => {
    expect(
      buildEvePackAlert(
        [trip()],
        progress([[7, { total: 0, checked: 0 }]]),
        TODAY
      )
    ).toBeNull();
  });

  it("meldet nichts, wenn die Anreise nicht morgen ist", () => {
    const progressMap = progress([[7, { total: 10, checked: 2 }]]);
    expect(buildEvePackAlert([], progressMap, TODAY)).toBeNull();
    expect(
      buildEvePackAlert(
        [
          // heute angereist, übermorgen und bereits vergangen
          trip({ startDate: TODAY }),
          trip({ id: 2, startDate: "2026-08-05" }),
          trip({ id: 3, startDate: "2026-07-30" }),
        ],
        progressMap,
        TODAY
      )
    ).toBeNull();
  });

  it("wählt bei mehreren Reisen die am wenigsten gepackte", () => {
    const alert = buildEvePackAlert(
      [
        trip({ id: 1, packListId: 7, name: "Fast fertig" }),
        trip({ id: 2, packListId: 8, name: "Kaum gepackt" }),
      ],
      progress([
        [7, { total: 10, checked: 9 }],
        [8, { total: 10, checked: 2 }],
      ]),
      TODAY
    );
    expect(alert!.key).toBe("evepack:2");
    expect(alert!.body).toContain("20 %");
  });

  it("liefert pro Reise denselben Dedup-Schlüssel (auch bei neuem Stand)", () => {
    const first = buildEvePackAlert(
      [trip()],
      progress([[7, { total: 10, checked: 3 }]]),
      TODAY
    );
    const second = buildEvePackAlert(
      [trip()],
      progress([[7, { total: 10, checked: 8 }]]),
      TODAY
    );
    expect(first!.key).toBe("evepack:1");
    expect(second!.key).toBe(first!.key);
  });

  it("sendet nur am Abend (17–21 Uhr Europe/Zurich)", () => {
    expect(EVE_PACK_SEND_HOUR_FROM).toBe(17);
    expect(EVE_PACK_SEND_HOUR_TO).toBe(21);
  });
});

/** Etappen-Vorabend-Hinweis (#579): «Morgen weiter nach …». */
describe("buildStageMoveAlert", () => {
  const stops = [
    { tripId: 3, name: "Verona", startDate: TOMORROW },
    { tripId: 3, name: "Comersee", startDate: "2026-08-01" },
  ];

  it("meldet die Etappe, die morgen beginnt", async () => {
    const { buildStageMoveAlert } = await import("./push");
    const alert = buildStageMoveAlert(stops, new Set([3]), TODAY);
    expect(alert?.title).toContain("Verona");
    expect(alert?.key).toBe(`stagemove:3:${TOMORROW}`);
    expect(alert?.url).toBe("/heute");
  });

  it("schweigt ohne Wechsel morgen oder ohne laufende Reise", async () => {
    const { buildStageMoveAlert } = await import("./push");
    expect(buildStageMoveAlert(stops, new Set([99]), TODAY)).toBeNull();
    expect(buildStageMoveAlert(stops, new Set([3]), "2026-08-05")).toBeNull();
  });

  it("übersetzt den Titel", async () => {
    const { buildStageMoveAlert } = await import("./push");
    const alert = buildStageMoveAlert(stops, new Set([3]), TODAY, "fr");
    expect(alert?.title).toBe("Demain, direction Verona");
  });

  // Wetter am Ziel (#630): die Zusatz-Zeile hängt an, wenn eine
  // Prognose mitkommt – ohne bleibt der Text wie bisher.
  it("hängt das Wetter am Ziel an, wenn eine Prognose mitkommt", async () => {
    const { buildStageMoveAlert } = await import("./push");
    const alert = buildStageMoveAlert(stops, new Set([3]), TODAY, "de", {
      tMaxC: 23.6,
      precipitationMm: 4.2,
    });
    expect(alert?.body).toContain("Wetter am Ziel: 24 °C, 4 mm Regen.");
    const dry = buildStageMoveAlert(stops, new Set([3]), TODAY, "de", {
      tMaxC: 18.2,
      precipitationMm: 0.3,
    });
    expect(dry?.body).toContain("18 °C, trocken");
    const plain = buildStageMoveAlert(stops, new Set([3]), TODAY);
    expect(plain?.body).not.toContain("Wetter am Ziel");
  });

  it("findet die Ziel-Etappe samt Koordinaten (nextStageMove)", async () => {
    const { nextStageMove } = await import("./push");
    const withCoords = [
      { tripId: 3, name: "Verona", startDate: TOMORROW, latitude: 45.4 },
    ];
    expect(nextStageMove(withCoords, new Set([3]), TODAY)?.latitude).toBe(45.4);
    expect(nextStageMove(withCoords, new Set([9]), TODAY)).toBeNull();
  });
});

/** Feiertags-Vorwarnung (#606): «Morgen ist Feiertag: …». */
describe("buildHolidayEveAlert", () => {
  const holidays = new Map([
    ["IT", { date: TOMORROW, localName: "Ferragosto" }],
    ["FR", null],
  ]);

  it("meldet den Feiertag von morgen im Reiseland", async () => {
    const { buildHolidayEveAlert } = await import("./push");
    const alert = buildHolidayEveAlert(
      [{ id: 4, countryCode: "IT" }],
      holidays,
      TOMORROW
    );
    expect(alert?.title).toContain("Ferragosto");
    expect(alert?.key).toBe(`holiday:4:${TOMORROW}`);
    expect(alert?.url).toBe("/heute");
  });

  it("schweigt ohne Feiertag, ohne Land und in der Schweiz", async () => {
    const { buildHolidayEveAlert } = await import("./push");
    expect(
      buildHolidayEveAlert([{ id: 4, countryCode: "FR" }], holidays, TOMORROW)
    ).toBeNull();
    expect(
      buildHolidayEveAlert([{ id: 4, countryCode: null }], holidays, TOMORROW)
    ).toBeNull();
    // Daheim kennt man seine Feiertage – CH bleibt bewusst still
    const chHolidays = new Map([
      ["CH", { date: TOMORROW, localName: "Bundesfeier" }],
    ]);
    expect(
      buildHolidayEveAlert([{ id: 4, countryCode: "CH" }], chHolidays, TOMORROW)
    ).toBeNull();
  });

  it("übersetzt den Titel", async () => {
    const { buildHolidayEveAlert } = await import("./push");
    const alert = buildHolidayEveAlert(
      [{ id: 4, countryCode: "IT" }],
      holidays,
      TOMORROW,
      "it"
    );
    expect(alert?.title).toBe("Domani è festivo: Ferragosto");
  });
});
