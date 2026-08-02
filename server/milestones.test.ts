import { describe, expect, it } from "vitest";
import { milestones, seasonOf, type MilestoneTrip } from "@shared/milestones";

const TODAY = "2026-08-02";

/** Kurzform: Trip mit Ort und Zeitraum. */
function trip(
  startDate: string,
  endDate: string,
  placeName?: string | null
): MilestoneTrip {
  return { startDate, endDate, placeName };
}

function byId(list: ReturnType<typeof milestones>, id: string) {
  const found = list.find(m => m.id === id);
  if (!found) throw new Error(`Meilenstein ${id} fehlt`);
  return found;
}

describe("seasonOf", () => {
  it("ordnet die meteorologischen Jahreszeiten korrekt zu", () => {
    expect(seasonOf("2026-03-01")).toBe("spring");
    expect(seasonOf("2026-06-15")).toBe("summer");
    expect(seasonOf("2026-11-30")).toBe("autumn");
    expect(seasonOf("2026-12-01")).toBe("winter");
    expect(seasonOf("2026-02-28")).toBe("winter");
  });

  it("gibt null für kaputte Daten zurück", () => {
    expect(seasonOf("kaputt")).toBeNull();
  });
});

describe("milestones – Übernachtungen", () => {
  it("erreicht die 10-Nächte-Schwelle mit dem Enddatum des auslösenden Trips", () => {
    const list = milestones(
      [
        trip("2026-07-01", "2026-07-07", "Aareschlucht"), // 6 Nächte
        trip("2026-07-20", "2026-07-25", "Grimsel"), // 5 Nächte → 11
      ],
      TODAY
    );
    const m = byId(list, "nights-10");
    expect(m.achieved).toBe(true);
    expect(m.achievedOn).toBe("2026-07-25");
    expect(m.current).toBe(10); // auf das Ziel gedeckelt
  });

  it("zeigt offene Schwellen mit Fortschritt x/y", () => {
    const list = milestones([trip("2026-07-01", "2026-07-07", "A")], TODAY);
    const m = byId(list, "nights-25");
    expect(m.achieved).toBe(false);
    expect(m.achievedOn).toBeNull();
    expect(m.current).toBe(6);
    expect(m.target).toBe(25);
  });

  it("ignoriert geplante und laufende Trips (endDate nach today)", () => {
    const list = milestones(
      [
        trip("2026-07-01", "2026-07-07", "A"),
        trip("2026-08-01", "2026-08-20", "B"), // läuft noch
      ],
      TODAY
    );
    expect(byId(list, "nights-10").current).toBe(6);
    expect(byId(list, "trips-5").current).toBe(1);
  });
});

describe("milestones – Orte und Aufenthalte", () => {
  it("zählt verschiedene Orte ohne Gross-/Klein-Unterscheidung", () => {
    const list = milestones(
      [
        trip("2026-01-02", "2026-01-03", "Grimsel"),
        trip("2026-02-02", "2026-02-03", "grimsel"),
        trip("2026-03-02", "2026-03-03", "Aare"),
        trip("2026-04-02", "2026-04-03", "Susten"),
        trip("2026-05-02", "2026-05-03", "Furka"),
        trip("2026-06-02", "2026-06-03", "Gotthard"),
      ],
      TODAY
    );
    const m = byId(list, "places-5");
    expect(m.achieved).toBe(true);
    // Der 5. verschiedene Ort (Gotthard) löst den Meilenstein aus
    expect(m.achievedOn).toBe("2026-06-03");
  });

  it("erreicht 5 Aufenthalte mit dem Enddatum des 5. Trips", () => {
    const trips = [1, 2, 3, 4, 5].map(n =>
      trip(`2026-0${n}-01`, `2026-0${n}-02`, "A")
    );
    const m = byId(milestones(trips, TODAY), "trips-5");
    expect(m.achieved).toBe(true);
    expect(m.achievedOn).toBe("2026-05-02");
  });
});

describe("milestones – 4 Jahreszeiten und Wiederkehrer", () => {
  it("verlangt Trips in allen vier meteorologischen Jahreszeiten (Startdatum zählt)", () => {
    const threeSeasons = milestones(
      [
        trip("2025-04-10", "2025-04-12", "A"), // Frühling
        trip("2025-07-10", "2025-07-12", "B"), // Sommer
        trip("2025-10-10", "2025-10-12", "C"), // Herbst
      ],
      TODAY
    );
    expect(byId(threeSeasons, "seasons").achieved).toBe(false);
    expect(byId(threeSeasons, "seasons").current).toBe(3);

    const allFour = milestones(
      [
        trip("2025-04-10", "2025-04-12", "A"),
        trip("2025-07-10", "2025-07-12", "B"),
        trip("2025-10-10", "2025-10-12", "C"),
        // Startdatum im Dezember zählt als Winter, auch wenn die Reise im Januar endet
        trip("2025-12-30", "2026-01-02", "D"),
      ],
      TODAY
    );
    const m = byId(allFour, "seasons");
    expect(m.achieved).toBe(true);
    expect(m.achievedOn).toBe("2026-01-02");
  });

  it("vergibt «Wiederkehrer» beim dritten Besuch desselben Orts", () => {
    const list = milestones(
      [
        trip("2026-01-02", "2026-01-03", "Grimsel"),
        trip("2026-02-02", "2026-02-03", "Aare"),
        trip("2026-03-02", "2026-03-03", "Grimsel"),
        trip("2026-04-02", "2026-04-03", "Grimsel"),
      ],
      TODAY
    );
    const m = byId(list, "returner");
    expect(m.achieved).toBe(true);
    expect(m.achievedOn).toBe("2026-04-03");
    expect(m.current).toBe(3);
  });

  it("zählt Trips ohne Ortsname weder als Ort noch als Wiederkehrer", () => {
    const list = milestones(
      [trip("2026-01-02", "2026-01-03"), trip("2026-02-02", "2026-02-03", "")],
      TODAY
    );
    expect(byId(list, "places-5").current).toBe(0);
    expect(byId(list, "returner").current).toBe(0);
    expect(byId(list, "trips-5").current).toBe(2);
  });
});

describe("milestones – Sprache und Katalog", () => {
  it("liefert die Labels in der gewünschten Sprache (Default de)", () => {
    const trips = [trip("2026-07-01", "2026-07-07", "A")];
    expect(byId(milestones(trips, TODAY), "nights-10").label).toBe(
      "10 Übernachtungen"
    );
    expect(byId(milestones(trips, TODAY, "fr"), "nights-10").label).toBe(
      "10 nuitées"
    );
    expect(byId(milestones(trips, TODAY, "it"), "seasons").label).toBe(
      "4 stagioni"
    );
    expect(byId(milestones(trips, TODAY, "en"), "trips-5").label).toBe(
      "5 stays"
    );
  });

  it("liefert den kompletten Katalog (4+3+3+1+1 = 12 Einträge) – auch ohne Trips", () => {
    const list = milestones([], TODAY);
    expect(list).toHaveLength(12);
    expect(list.every(m => !m.achieved && m.current === 0)).toBe(true);
  });
});
