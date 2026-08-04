import { describe, expect, it } from "vitest";
import {
  MIN_RATE_MS,
  SECTOR_COUNT,
  addSighting,
  dominantSector,
  effectiveMs,
  isObserving,
  logTotals,
  newSession,
  nightKey,
  nightSummaries,
  pauseSession,
  resumeSession,
  sectorCounts,
  sessionStats,
  undoSighting,
  type MeteorSession,
} from "@shared/meteorLog";

/** 12. August 2026, 22:00 Uhr lokal – Perseiden-Nacht. */
const at = (day: number, hour: number, minute = 0) =>
  new Date(2026, 7, day, hour, minute).getTime();

const MINUTE = 60000;
const HOUR = 60 * MINUTE;

describe("Sternschnuppen-Protokoll", () => {
  describe("Nacht-Zuordnung", () => {
    it("zählt den Abend zur eigenen Nacht", () => {
      expect(nightKey(at(12, 22))).toBe("2026-08-12");
    });

    it("zählt die Stunden nach Mitternacht zur Nacht des Vorabends", () => {
      // Sonst zerfällt jede Beobachtung in zwei halbe
      expect(nightKey(at(13, 1, 30))).toBe("2026-08-12");
      expect(nightKey(at(13, 4))).toBe("2026-08-12");
    });

    it("beginnt die neue Nacht am Mittag", () => {
      expect(nightKey(at(13, 11, 59))).toBe("2026-08-12");
      expect(nightKey(at(13, 12))).toBe("2026-08-13");
    });

    it("hält eine Beobachtung über Mitternacht zusammen", () => {
      expect(nightKey(at(12, 23, 50))).toBe(nightKey(at(13, 0, 10)));
    });
  });

  describe("Beobachtungszeit", () => {
    it("startet laufend", () => {
      const session = newSession("a", at(12, 22));
      expect(isObserving(session)).toBe(true);
      expect(effectiveMs(session, at(12, 23))).toBe(HOUR);
    });

    it("lässt die Uhr in der Pause stehen", () => {
      // Wer Tee holt, beobachtet nicht
      let session = newSession("a", at(12, 22));
      session = pauseSession(session, at(12, 23));
      expect(isObserving(session)).toBe(false);
      // Eine Stunde später ist die beobachtete Zeit immer noch eine Stunde
      expect(effectiveMs(session, at(13, 0))).toBe(HOUR);
    });

    it("zählt nach dem Weitermachen wieder mit", () => {
      let session = newSession("a", at(12, 22));
      session = pauseSession(session, at(12, 23));
      session = resumeSession(session, at(13, 0));
      expect(effectiveMs(session, at(13, 0, 30))).toBe(HOUR + 30 * MINUTE);
    });

    it("ändert nichts, wenn zweimal pausiert oder fortgesetzt wird", () => {
      const session = newSession("a", at(12, 22));
      expect(resumeSession(session, at(12, 23))).toBe(session);
      const paused = pauseSession(session, at(12, 23));
      expect(pauseSession(paused, at(12, 24 - 1))).toBe(paused);
    });
  });

  describe("Zählen", () => {
    it("hält Zeit und Richtung mit einem Griff fest", () => {
      let session = newSession("a", at(12, 22));
      session = addSighting(session, 2, at(12, 22, 5));
      expect(session.sightings).toEqual([{ at: at(12, 22, 5), sector: 2 }]);
    });

    it("nimmt eine Sternschnuppe auch ohne Richtung", () => {
      // Eine ohne Richtung ist mehr wert als eine, die man nicht erfasst hat
      const session = addSighting(
        newSession("a", at(12, 22)),
        null,
        at(12, 22, 5)
      );
      expect(session.sightings[0].sector).toBeNull();
    });

    it("wirft unsinnige Sektoren auf «unklar» zurück", () => {
      const session = addSighting(
        newSession("a", at(12, 22)),
        99,
        at(12, 22, 5)
      );
      expect(session.sightings[0].sector).toBeNull();
    });

    it("nimmt die Beobachtung wieder auf, wenn während der Pause eine kommt", () => {
      // Wer eine sieht, hat offensichtlich hingeschaut
      let session = newSession("a", at(12, 22));
      session = pauseSession(session, at(12, 23));
      session = addSighting(session, 0, at(13, 0));
      expect(isObserving(session)).toBe(true);
      // Die Pause davor bleibt Pause
      expect(effectiveMs(session, at(13, 0))).toBe(HOUR);
    });

    it("nimmt einen Vertipper zurück", () => {
      let session = newSession("a", at(12, 22));
      session = addSighting(session, 1, at(12, 22, 5));
      session = addSighting(session, 3, at(12, 22, 9));
      session = undoSighting(session);
      expect(session.sightings).toHaveLength(1);
      expect(session.sightings[0].sector).toBe(1);
    });

    it("kommt mit dem Zurücknehmen ohne Eintrag zurecht", () => {
      const session = newSession("a", at(12, 22));
      expect(undoSighting(session)).toBe(session);
    });
  });

  describe("Rate", () => {
    it("weist unter einer Viertelstunde keine Rate aus", () => {
      // Eine Sternschnuppe in zwei Minuten sind nicht dreissig pro Stunde
      let session = newSession("a", at(12, 22));
      session = addSighting(session, 0, at(12, 22, 1));
      const stats = sessionStats(session, at(12, 22, 2));
      expect(stats.count).toBe(1);
      expect(stats.perHour).toBeNull();
      expect(stats.observedMs).toBeLessThan(MIN_RATE_MS);
    });

    it("rechnet die Rate auf die effektive Zeit, nicht auf die Uhrzeit", () => {
      let session = newSession("a", at(12, 22));
      // 30 Minuten beobachtet, dann eine Stunde Pause
      for (let i = 0; i < 10; i++) {
        session = addSighting(session, 4, at(12, 22, i * 3));
      }
      session = pauseSession(session, at(12, 22, 30));
      const stats = sessionStats(session, at(13, 0));
      expect(stats.observedMs).toBe(30 * MINUTE);
      expect(stats.perHour).toBe(20);
    });

    it("nennt die erste und die letzte Sternschnuppe", () => {
      let session = newSession("a", at(12, 22));
      session = addSighting(session, 0, at(12, 23));
      session = addSighting(session, 0, at(12, 22, 10));
      const stats = sessionStats(session, at(13, 0));
      expect(stats.firstAt).toBe(at(12, 22, 10));
      expect(stats.lastAt).toBe(at(12, 23));
    });

    it("lässt Zeiten leer, solange nichts gezählt wurde", () => {
      const stats = sessionStats(newSession("a", at(12, 22)), at(12, 23));
      expect(stats.count).toBe(0);
      expect(stats.firstAt).toBeNull();
      expect(stats.lastAt).toBeNull();
      expect(stats.perHour).toBe(0);
    });
  });

  describe("Richtungen", () => {
    it("zeigt alle acht Sektoren, auch die leeren", () => {
      // Eine Verteilung mit Lücken liest sich falsch
      const session = addSighting(
        newSession("a", at(12, 22)),
        3,
        at(12, 22, 1)
      );
      const counts = sectorCounts(session);
      expect(counts).toHaveLength(SECTOR_COUNT);
      expect(counts[3].count).toBe(1);
      expect(counts[0].count).toBe(0);
    });

    it("hängt «unklar» nur an, wenn es vorkommt", () => {
      let session = newSession("a", at(12, 22));
      session = addSighting(session, null, at(12, 22, 1));
      const counts = sectorCounts(session);
      expect(counts).toHaveLength(SECTOR_COUNT + 1);
      expect(counts[SECTOR_COUNT]).toEqual({ sector: null, count: 1 });
    });

    it("nennt eine Richtung erst, wenn sie wirklich heraussticht", () => {
      let session = newSession("a", at(12, 22));
      // Fünf aus fünf Richtungen sind kein Radiant
      [0, 1, 2, 3, 4].forEach((sector, i) => {
        session = addSighting(session, sector, at(12, 22, i));
      });
      expect(dominantSector(session)).toBeNull();
    });

    it("erkennt die Richtung, aus der es auffällig oft kam", () => {
      let session = newSession("a", at(12, 22));
      for (let i = 0; i < 8; i++) {
        session = addSighting(session, 1, at(12, 22, i));
      }
      session = addSighting(session, 5, at(12, 22, 9));
      expect(dominantSector(session)).toBe(1);
    });

    it("nennt bei zu wenigen Sternschnuppen gar keine Richtung", () => {
      let session = newSession("a", at(12, 22));
      session = addSighting(session, 2, at(12, 22, 1));
      session = addSighting(session, 2, at(12, 22, 2));
      expect(dominantSector(session)).toBeNull();
    });
  });

  describe("Übersicht", () => {
    const sessions: MeteorSession[] = [
      {
        id: "a",
        night: "2026-08-12",
        showerId: "perseiden",
        spans: [{ from: at(12, 22), to: at(13, 0) }],
        sightings: [
          { at: at(12, 22, 10), sector: 1 },
          { at: at(12, 23, 10), sector: 1 },
        ],
      },
      {
        id: "b",
        night: "2026-08-14",
        showerId: null,
        spans: [{ from: at(14, 22), to: at(14, 23) }],
        sightings: [],
      },
    ];

    it("sortiert die Nächte, neueste zuerst", () => {
      const nights = nightSummaries(sessions, at(15, 12));
      expect(nights.map(n => n.night)).toEqual(["2026-08-14", "2026-08-12"]);
    });

    it("behält Nächte ohne eine einzige Sternschnuppe", () => {
      // Ohne die Null-Nächte sieht jede Statistik zu gut aus
      const nights = nightSummaries(sessions, at(15, 12));
      expect(nights[0].count).toBe(0);
      expect(nights[0].perHour).toBe(0);
    });

    it("summiert über alle Nächte", () => {
      const totals = logTotals(sessions, at(15, 12));
      expect(totals.nights).toBe(2);
      expect(totals.count).toBe(2);
      expect(totals.observedMs).toBe(3 * HOUR);
    });

    it("kommt mit einem leeren Protokoll zurecht", () => {
      expect(nightSummaries([], at(15, 12))).toEqual([]);
      expect(logTotals([], at(15, 12))).toEqual({
        nights: 0,
        count: 0,
        observedMs: 0,
      });
    });
  });
});
