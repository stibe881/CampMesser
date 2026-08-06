import { describe, expect, it } from "vitest";
import {
  buildWidgetPayload,
  countSupplies,
  MAX_WIDGET_TASKS,
  selectWidgetTrip,
  widgetPayloadChanged,
  type WidgetInput,
} from "@shared/widgetData";
import { LANGUAGES } from "@shared/i18n";

const TODAY = "2026-08-05";

const base: WidgetInput = {
  trips: [],
  foodItems: [],
  gearTasks: [],
  packing: null,
  today: TODAY,
  lang: "de",
};

const trip = (
  id: number,
  startDate: string,
  endDate: string,
  title?: string
) => ({
  id,
  startDate,
  endDate,
  title: title ?? null,
});

describe("Welcher Aufenthalt ins Widget kommt", () => {
  it("der laufende schlägt den kommenden", () => {
    // Wer auf dem Platz steht, will nicht lesen, dass in drei Wochen die
    // nächste Reise ansteht.
    const found = selectWidgetTrip(
      [
        trip(1, "2026-08-25", "2026-08-30"),
        trip(2, "2026-08-03", "2026-08-09"),
      ],
      TODAY
    );
    expect(found?.trip.id).toBe(2);
    expect(found?.running).toBe(true);
  });

  it("sonst der nächste kommende", () => {
    const found = selectWidgetTrip(
      [
        trip(1, "2026-09-01", "2026-09-05"),
        trip(2, "2026-08-20", "2026-08-24"),
      ],
      TODAY
    );
    expect(found?.trip.id).toBe(2);
    expect(found?.running).toBe(false);
  });

  it("vergangene zählen nicht", () => {
    expect(
      selectWidgetTrip([trip(1, "2026-07-01", "2026-07-08")], TODAY)
    ).toBeNull();
  });
});

describe("Reise-Feld", () => {
  it("ohne Reise steht ein Hinweis statt einer Zahl", () => {
    const panel = buildWidgetPayload(base).trip;
    expect(panel.value).toBe("–");
    expect(panel.url).toBe("/tagebuch");
  });

  it("zählt die Tage bis zur Anreise", () => {
    const panel = buildWidgetPayload({
      ...base,
      trips: [trip(7, "2026-08-08", "2026-08-12", "Seeblick")],
    }).trip;
    expect(panel.value).toBe("3");
    expect(panel.title).toBe("Seeblick");
    expect(panel.subtitle).toContain("3");
    // Antippen führt zur Reise selbst, nicht in die Liste.
    expect(panel.url).toBe("/tagebuch/7");
  });

  it("eine heute beginnende Reise läuft bereits – Tag 1, nicht «in 0 Tagen»", () => {
    // Der Anreisetag IST der erste Aufenthaltstag; «noch 0 Tage» wäre
    // eine Zahl, die niemand braucht.
    const panel = buildWidgetPayload({
      ...base,
      trips: [trip(1, TODAY, "2026-08-09")],
    }).trip;
    expect(panel.value).toBe("1");
    expect(panel.subtitle).toBe("Tag 1 von 5");
  });

  it("morgen bekommt eigene Worte", () => {
    expect(
      buildWidgetPayload({
        ...base,
        trips: [trip(1, "2026-08-06", "2026-08-09")],
      }).trip.subtitle
    ).toContain("morgen");
  });

  it("während der Reise steht der Aufenthaltstag", () => {
    const panel = buildWidgetPayload({
      ...base,
      trips: [trip(3, "2026-08-03", "2026-08-09", "Seeblick")],
    }).trip;
    expect(panel.value).toBe("3");
    expect(panel.subtitle).toBe("Tag 3 von 7");
  });
});

describe("Vorrat-Feld", () => {
  const soon = { expiryDate: "2026-08-06" };
  const later = { expiryDate: "2026-09-01" };
  const gone = { expiryDate: "2026-08-01" };

  it("zählt wie der App-Icon-Zähler: heute und morgen, nichts Abgelaufenes", () => {
    expect(
      countSupplies({
        foodItems: [soon, later, gone],
        gearTasks: [],
        today: TODAY,
      })
    ).toEqual({ expiring: 1, due: 0 });
  });

  it("ohne alles steht ein Haken", () => {
    const panel = buildWidgetPayload(base).supplies;
    expect(panel.value).toBe("✓");
  });

  it("führt zur Kühlbox, wenn dort etwas abläuft", () => {
    const panel = buildWidgetPayload({ ...base, foodItems: [soon] }).supplies;
    expect(panel.value).toBe("1");
    expect(panel.url).toBe("/kuehlbox");
  });

  it("führt zur Ausrüstung, wenn nur Pflege fällig ist", () => {
    const panel = buildWidgetPayload({
      ...base,
      gearTasks: [
        {
          intervalMonths: 6,
          lastDoneAt: "2025-01-01",
          createdAt: "2025-01-01",
        },
      ],
    }).supplies;
    expect(panel.url).toBe("/inventar");
    expect(panel.subtitle).toContain("Pflege");
  });
});

describe("Packstand", () => {
  it("null ohne verknüpfte Liste", () => {
    expect(buildWidgetPayload(base).packing).toBeNull();
    expect(
      buildWidgetPayload({ ...base, packing: { total: 0, checked: 0 } }).packing
    ).toBeNull();
  });

  it("Verhältnis und Beschriftung", () => {
    const p = buildWidgetPayload({
      ...base,
      packing: { total: 10, checked: 6 },
    }).packing;
    expect(p?.ratio).toBeCloseTo(0.6);
    expect(p?.label).toContain("60");
  });
});

describe("Nutzlast", () => {
  it("ist in jeder Sprache vollständig", () => {
    for (const lang of LANGUAGES) {
      const payload = buildWidgetPayload({
        ...base,
        lang,
        trips: [trip(1, "2026-08-08", "2026-08-12", "Seeblick")],
        foodItems: [{ expiryDate: "2026-08-06" }],
      });
      for (const panel of [payload.trip, payload.supplies]) {
        expect(panel.value.length).toBeGreaterThan(0);
        expect(panel.title.length).toBeGreaterThan(0);
        expect(panel.subtitle.length).toBeGreaterThan(0);
        expect(panel.url.startsWith("/")).toBe(true);
      }
    }
  });

  it("ein neuer Tag allein ist kein Grund zum Neuzeichnen", () => {
    // iOS drosselt Widgets, die ohne Grund nachladen – verglichen wird
    // deshalb die Nutzlast ohne den Zeitstempel.
    const a = buildWidgetPayload(base);
    const b = { ...a, builtAt: "2026-09-09T00:00:00Z" };
    expect(widgetPayloadChanged(a, b)).toBe(false);
  });

  it("geänderte Texte werden gemeldet", () => {
    const a = buildWidgetPayload(base);
    const b = buildWidgetPayload({
      ...base,
      trips: [trip(1, "2026-08-08", "2026-08-12", "Seeblick")],
    });
    expect(widgetPayloadChanged(a, b)).toBe(true);
    expect(widgetPayloadChanged(null, a)).toBe(true);
  });
});

describe("Liste zum Abhaken (#327)", () => {
  const packItems = [
    { id: 1, name: "Zelt", checked: true },
    { id: 2, name: "Schlafsack", checked: false },
    { id: 3, name: "Kocher", checked: false },
    { id: 4, name: "Stirnlampe", checked: false },
    { id: 5, name: "Regenjacke", checked: false },
  ];
  const chores = [
    { id: 10, title: "Abwasch", doneAt: null },
    { id: 11, title: "Wasser holen", doneAt: "2026-08-05T09:00:00Z" },
  ];

  it("vor der Reise steht die Packliste", () => {
    const p = buildWidgetPayload({
      ...base,
      trips: [trip(1, "2026-08-08", "2026-08-12")],
      packItems,
      chores,
    });
    expect(p.tasksTitle).toBe("Noch zu packen");
    expect(p.tasks.every(t => t.kind === "packing")).toBe(true);
  });

  it("während der Reise stehen die Ämtli", () => {
    // Auf dem Platz nützt die Packliste nichts mehr.
    const p = buildWidgetPayload({
      ...base,
      trips: [trip(1, "2026-08-03", "2026-08-09")],
      packItems,
      chores,
    });
    expect(p.tasksTitle).toBe("Heute im Camp");
    expect(p.tasks.map(t => t.id)).toEqual([10, 11]);
    expect(p.tasks[0].checked).toBe(false);
    expect(p.tasks[1].checked).toBe(true);
  });

  it("offene zuerst, erledigte dahinter", () => {
    const p = buildWidgetPayload({
      ...base,
      trips: [trip(1, "2026-08-08", "2026-08-12")],
      packItems,
    });
    // «Zelt» ist erledigt und rutscht ans Ende – aber es verschwindet
    // nicht, sonst wäre nach dem Antippen unklar, ob es ankam.
    expect(p.tasks.map(t => t.title)).toEqual([
      "Schlafsack",
      "Kocher",
      "Stirnlampe",
      "Regenjacke",
    ]);
  });

  it("höchstens vier Zeilen", () => {
    const p = buildWidgetPayload({
      ...base,
      trips: [trip(1, "2026-08-08", "2026-08-12")],
      packItems: Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        name: `Sache ${i + 1}`,
        checked: false,
      })),
    });
    expect(p.tasks).toHaveLength(MAX_WIDGET_TASKS);
  });

  it("ohne Reise bleibt die Liste leer, mit passendem Text", () => {
    const p = buildWidgetPayload(base);
    expect(p.tasks).toEqual([]);
    expect(p.tasksEmpty).toBe("Alles gepackt");
  });

  it("in jeder Sprache beschriftet", () => {
    for (const lang of LANGUAGES) {
      const p = buildWidgetPayload({ ...base, lang });
      expect(p.tasksTitle.length).toBeGreaterThan(0);
      expect(p.tasksEmpty.length).toBeGreaterThan(0);
    }
  });

  it("das Ziel neben den Häkchen führt in die passende Liste", () => {
    // Wer neben ein Häkchen tippt, will die ganze Liste sehen – und zwar
    // die, die im Widget steht.
    const running = buildWidgetPayload({
      ...base,
      trips: [trip(1, "2026-08-03", "2026-08-09")],
      chores,
    });
    expect(running.tasksUrl).toBe("/aemtli");

    const upcoming = buildWidgetPayload({
      ...base,
      trips: [{ ...trip(1, "2026-08-08", "2026-08-12"), packListId: 42 }],
      packItems,
    });
    expect(upcoming.tasksUrl).toBe("/packlisten/42");

    // Ohne verknüpfte Liste bleibt die Übersicht.
    expect(buildWidgetPayload(base).tasksUrl).toBe("/packlisten");
  });
});
