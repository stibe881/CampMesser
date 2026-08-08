import { describe, expect, it } from "vitest";
import {
  buildGpx,
  evaluateTrackPoint,
  formatTrackDuration,
  gpxFileName,
  guessTrackActivity,
  MAX_TRACK_POINTS,
  normalizeTrackActivity,
  parseTrackPoints,
  serializeTrackPoints,
  shouldAppendPoint,
  TRACK_ELEVATION_THRESHOLD_M,
  TRACK_PAUSE_GAP_MS,
  trackStats,
  type TrackPoint,
  totalTimeS,
} from "@shared/track";

/** Startpunkt im Flachland (Bern) – von hier aus wird gerechnet. */
const BASE = { lat: 46.948, lon: 7.4474 };

/**
 * Punkt in `metersNorth` Metern nördlich der Basis, `seconds` Sekunden nach
 * dem Start. 1° Breite ≈ 111'320 m – für kurze Strecken genau genug.
 */
function north(metersNorth: number, seconds: number, ele: number | null = 500) {
  return {
    lat: BASE.lat + metersNorth / 111_320,
    lon: BASE.lon,
    ele,
    t: 1_000_000_000_000 + seconds * 1000,
  };
}

describe("evaluateTrackPoint", () => {
  it("nimmt den ersten brauchbaren Punkt an", () => {
    expect(evaluateTrackPoint(null, { ...north(0, 0), accuracyM: 8 })).toBe(
      "ok"
    );
  });

  it("verwirft Punkte mit schlechter Genauigkeit", () => {
    expect(evaluateTrackPoint(null, { ...north(0, 0), accuracyM: 120 })).toBe(
      "inaccurate"
    );
    expect(evaluateTrackPoint(null, { ...north(0, 0), accuracyM: null })).toBe(
      "inaccurate"
    );
    expect(
      evaluateTrackPoint(null, { ...north(0, 0), accuracyM: Number.NaN })
    ).toBe("inaccurate");
  });

  it("verwirft unbrauchbare Koordinaten und Zeiten", () => {
    expect(
      evaluateTrackPoint(null, {
        lat: Number.NaN,
        lon: 7,
        ele: null,
        t: 1,
        accuracyM: 5,
      })
    ).toBe("invalid");
    expect(
      evaluateTrackPoint(null, {
        lat: 95,
        lon: 7,
        ele: null,
        t: 1,
        accuracyM: 5,
      })
    ).toBe("invalid");
    expect(
      evaluateTrackPoint(null, {
        lat: 46,
        lon: 7,
        ele: null,
        t: Number.NaN,
        accuracyM: 5,
      })
    ).toBe("invalid");
  });

  it("verwirft Rauschen: zu nah am letzten Punkt", () => {
    const last = north(0, 0);
    expect(evaluateTrackPoint(last, { ...north(2, 10), accuracyM: 6 })).toBe(
      "tooClose"
    );
    expect(evaluateTrackPoint(last, { ...north(12, 10), accuracyM: 6 })).toBe(
      "ok"
    );
  });

  it("verwirft doppelte oder rückwärts laufende Zeitstempel", () => {
    const last = north(0, 100);
    expect(evaluateTrackPoint(last, { ...north(50, 100), accuracyM: 6 })).toBe(
      "stale"
    );
    expect(evaluateTrackPoint(last, { ...north(50, 90), accuracyM: 6 })).toBe(
      "stale"
    );
  });

  it("verwirft unplausible Sprünge, nicht aber Sprünge nach einer Pause", () => {
    const last = north(0, 0);
    // 500 m in 10 s = 50 m/s – zu Fuss unmöglich
    expect(evaluateTrackPoint(last, { ...north(500, 10), accuracyM: 6 })).toBe(
      "implausible"
    );
    // Dieselben 500 m nach einer Pausen-Lücke sind völlig normal
    const afterPause = TRACK_PAUSE_GAP_MS / 1000 + 10;
    expect(
      evaluateTrackPoint(last, { ...north(500, afterPause), accuracyM: 6 })
    ).toBe("ok");
  });

  it("shouldAppendPoint ist der Kurzschluss auf «ok»", () => {
    expect(shouldAppendPoint(null, { ...north(0, 0), accuracyM: 5 })).toBe(
      true
    );
    expect(shouldAppendPoint(null, { ...north(0, 0), accuracyM: 500 })).toBe(
      false
    );
  });
});

describe("trackStats", () => {
  it("liefert bei 0 und 1 Punkt lauter Nullen", () => {
    const empty = trackStats([]);
    expect(empty).toEqual({
      distanceM: 0,
      durationS: 0,
      ascentM: 0,
      descentM: 0,
      avgSpeedKmh: 0,
    });
    expect(trackStats([north(0, 0)])).toEqual(empty);
  });

  it("rechnet Strecke, Dauer und Tempo einer geraden Strecke", () => {
    const points: TrackPoint[] = [north(0, 0), north(100, 60), north(200, 120)];
    const stats = trackStats(points);
    // 200 m in 120 s = 6 km/h
    expect(stats.distanceM).toBeGreaterThan(195);
    expect(stats.distanceM).toBeLessThan(205);
    expect(stats.durationS).toBe(120);
    expect(stats.avgSpeedKmh).toBeGreaterThan(5.8);
    expect(stats.avgSpeedKmh).toBeLessThan(6.2);
  });

  it("lässt Pausen-Lücken aus Zeit UND Strecke heraus", () => {
    const gapS = TRACK_PAUSE_GAP_MS / 1000 + 60;
    const points: TrackPoint[] = [
      north(0, 0),
      north(100, 60),
      // Lange Lücke: Handy in der Tasche, Empfang weg
      north(600, 60 + gapS),
      north(700, 120 + gapS),
    ];
    const stats = trackStats(points);
    // Nur die beiden 100-m-Abschnitte zählen, nicht die 500 m über die Lücke
    expect(stats.distanceM).toBeGreaterThan(190);
    expect(stats.distanceM).toBeLessThan(210);
    expect(stats.durationS).toBe(120);
  });

  it("ignoriert rückwärts laufende Zeitstempel", () => {
    const points: TrackPoint[] = [
      north(0, 100),
      north(100, 40),
      north(200, 160),
    ];
    const stats = trackStats(points);
    expect(stats.durationS).toBe(120);
  });

  it("glättet Höhen-Zittern unterhalb der Schwelle weg", () => {
    const wobble: TrackPoint[] = [
      north(0, 0, 500),
      north(20, 20, 502),
      north(40, 40, 498),
      north(60, 60, 501),
      north(80, 80, 500),
    ];
    const stats = trackStats(wobble);
    expect(stats.ascentM).toBe(0);
    expect(stats.descentM).toBe(0);
  });

  it("zählt echte Höhenmeter auf- und abwärts", () => {
    const climb: TrackPoint[] = [
      north(0, 0, 500),
      north(20, 20, 520),
      north(40, 40, 560),
      north(60, 60, 530),
      north(80, 80, 500),
    ];
    const stats = trackStats(climb);
    expect(stats.ascentM).toBe(60);
    expect(stats.descentM).toBe(60);
  });

  it("wertet Punkte ohne Höhe, ohne die Reihe zu unterbrechen", () => {
    const points: TrackPoint[] = [
      north(0, 0, 500),
      north(20, 20, null),
      north(40, 40, 530),
    ];
    const stats = trackStats(points);
    expect(stats.ascentM).toBe(30);
    expect(stats.descentM).toBe(0);
  });

  it("bucht eine Änderung genau auf der Schwelle", () => {
    const points: TrackPoint[] = [
      north(0, 0, 500),
      north(20, 20, 500 + TRACK_ELEVATION_THRESHOLD_M),
    ];
    expect(trackStats(points).ascentM).toBe(TRACK_ELEVATION_THRESHOLD_M);
  });

  it("liefert kein Tempo, wenn alle Punkte durch Pausen getrennt sind", () => {
    const gapS = TRACK_PAUSE_GAP_MS / 1000 + 10;
    const stats = trackStats([north(0, 0), north(100, gapS)]);
    expect(stats.durationS).toBe(0);
    expect(stats.distanceM).toBe(0);
    expect(stats.avgSpeedKmh).toBe(0);
  });
});

describe("formatTrackDuration", () => {
  it("formatiert Minuten und Stunden", () => {
    expect(formatTrackDuration(0)).toBe("0:00");
    expect(formatTrackDuration(59)).toBe("0:59");
    expect(formatTrackDuration(125)).toBe("2:05");
    expect(formatTrackDuration(3600)).toBe("1:00:00");
    expect(formatTrackDuration(5025)).toBe("1:23:45");
  });

  it("behandelt unbrauchbare Werte als 0", () => {
    expect(formatTrackDuration(-5)).toBe("0:00");
    expect(formatTrackDuration(Number.NaN)).toBe("0:00");
  });
});

describe("serializeTrackPoints / parseTrackPoints", () => {
  it("überlebt den Rundlauf", () => {
    const points: TrackPoint[] = [north(0, 0, 500.25), north(50, 30, null)];
    const back = parseTrackPoints(serializeTrackPoints(points));
    expect(back).toHaveLength(2);
    expect(back[0].lat).toBeCloseTo(points[0].lat, 5);
    expect(back[0].ele).toBe(500.3);
    expect(back[1].ele).toBeNull();
  });

  it("liest auch die ausführliche Objekt-Schreibweise", () => {
    const json = JSON.stringify([
      { lat: 46.9, lon: 7.4, ele: 500, t: 1000 },
      { lat: 46.91, lon: 7.41, t: 2000 },
    ]);
    const points = parseTrackPoints(json);
    expect(points).toHaveLength(2);
    expect(points[1].ele).toBeNull();
  });

  it("verwirft kaputte Inhalte und Einträge", () => {
    expect(parseTrackPoints(null)).toEqual([]);
    expect(parseTrackPoints("")).toEqual([]);
    expect(parseTrackPoints("kein json")).toEqual([]);
    expect(parseTrackPoints('{"a":1}')).toEqual([]);
    expect(
      parseTrackPoints('[["a","b",null,1],[46.9,7.4,null,2]]')
    ).toHaveLength(1);
  });

  it("deckelt die Punktzahl", () => {
    const many = JSON.stringify(
      Array.from({ length: MAX_TRACK_POINTS + 50 }, (_, i) => [
        46.9,
        7.4,
        null,
        i,
      ])
    );
    expect(parseTrackPoints(many)).toHaveLength(MAX_TRACK_POINTS);
    expect(parseTrackPoints(many, 10)).toHaveLength(10);
  });
});

describe("buildGpx", () => {
  it("baut gültiges GPX mit Höhen und Zeiten", () => {
    const gpx = buildGpx({
      name: "Seerunde",
      points: [
        {
          lat: 46.948,
          lon: 7.4474,
          ele: 540,
          t: Date.UTC(2026, 7, 3, 8, 0, 0),
        },
        {
          lat: 46.949,
          lon: 7.4484,
          ele: null,
          t: Date.UTC(2026, 7, 3, 8, 5, 0),
        },
      ],
    });
    expect(gpx.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(gpx).toContain("<name>Seerunde</name>");
    expect(gpx).toContain('<trkpt lat="46.948000" lon="7.447400">');
    expect(gpx).toContain("<ele>540.0</ele>");
    expect(gpx).toContain("<time>2026-08-03T08:00:00.000Z</time>");
    // Der zweite Punkt hat keine Höhe – also auch kein <ele>
    expect(gpx.match(/<ele>/g)).toHaveLength(1);
    expect(gpx.match(/<trkpt /g)).toHaveLength(2);
    expect(gpx.trimEnd().endsWith("</gpx>")).toBe(true);
  });

  it("entschärft Sonderzeichen im Namen", () => {
    const gpx = buildGpx({ name: 'Tour <a> & "B"', points: [] });
    expect(gpx).toContain("Tour &lt;a&gt; &amp; &quot;B&quot;");
    expect(gpx).not.toContain("<a>");
  });

  it("kommt mit einer leeren Punktreihe zurecht", () => {
    const gpx = buildGpx({ name: "Leer", points: [] });
    expect(gpx).toContain("<trkseg>");
    expect(gpx).not.toContain("<trkpt");
  });
});

describe("gpxFileName", () => {
  it("baut einen sauberen Dateinamen", () => {
    expect(gpxFileName("Über den Grat", new Date("2026-08-03T10:00:00Z"))).toBe(
      "2026-08-03-ueber-den-grat.gpx"
    );
  });

  it("fällt bei leerem Namen auf «wanderung» zurück", () => {
    expect(gpxFileName("!!!", new Date("2026-08-03T10:00:00Z"))).toBe(
      "2026-08-03-wanderung.gpx"
    );
  });
});

describe("Aktivitätstyp (#449)", () => {
  it("normalisiert unbekannte Werte zu «hike»", () => {
    expect(normalizeTrackActivity("bike")).toBe("bike");
    expect(normalizeTrackActivity("hike")).toBe("hike");
    expect(normalizeTrackActivity("sup")).toBe("hike");
    expect(normalizeTrackActivity(null)).toBe("hike");
  });

  it("rät die Aktivität aus dem Bewegungs-Schnitt", () => {
    // 5 km in 1 h = 5 km/h → Wandern
    expect(guessTrackActivity(5000, 3600)).toBe("hike");
    // 12 km in 1 h = 12 km/h → Velo
    expect(guessTrackActivity(12000, 3600)).toBe("bike");
    // Ohne Bewegungszeit bleibt es eine Wanderung
    expect(guessTrackActivity(5000, 0)).toBe("hike");
    expect(guessTrackActivity(0, 3600)).toBe("hike");
  });
});

describe("totalTimeS (#480)", () => {
  it("misst vom ersten bis zum letzten Punkt, Pausen inklusive", () => {
    const points = [
      { lat: 46.8, lon: 8.2, ele: null, t: 1_000_000 },
      { lat: 46.801, lon: 8.201, ele: null, t: 1_060_000 },
      // 10 Minuten Rast – die Bewegungszeit liesse diese Lücke weg
      { lat: 46.802, lon: 8.202, ele: null, t: 1_660_000 },
    ];
    expect(totalTimeS(points)).toBe(660);
  });

  it("ohne zwei Punkte gibt es keine Zeit", () => {
    expect(totalTimeS([])).toBe(0);
    expect(totalTimeS([{ lat: 46.8, lon: 8.2, ele: null, t: 5 }])).toBe(0);
  });
});
