import { describe, expect, it } from "vitest";
import {
  delayMinutesBetween,
  nearbyStationsUrl,
  nearestTransitStations,
  parseStationKind,
  parseStationboard,
  parseTransitStations,
  parseTransportTime,
  stationboardUrl,
  TRANSPORT_MAX_STATION_DISTANCE_M,
  transportLineLabel,
  upcomingDepartures,
  type TransitDeparture,
  type TransitStation,
  connectionsUrl,
  connectionDurationMinutes,
  parseConnections,
} from "@shared/transport";

/** Kurzform für eine Haltestelle in den Sortier-Tests. */
function station(
  id: string,
  distanceM: number,
  extra: Partial<TransitStation> = {}
): TransitStation {
  return {
    id,
    name: `Halt ${id}`,
    lat: 46.8,
    lon: 7.5,
    distanceM,
    kind: "bus",
    ...extra,
  };
}

/** Kurzform für eine Abfahrt in den Filter-Tests. */
function departure(
  id: string,
  departureMs: number,
  delayMin?: number
): TransitDeparture {
  return { id, line: "B 1", to: "Irgendwo", departureMs, delayMin };
}

describe("nearbyStationsUrl / stationboardUrl", () => {
  it("schickt x als Länge und y als Breite, auf fünf Stellen gerundet", () => {
    const url = nearbyStationsUrl(46.712345678, 7.987654321);
    expect(url).toBe(
      "https://transport.opendata.ch/v1/locations?x=7.98765&y=46.71235&type=station"
    );
  });

  it("maskiert die Haltestellen-Id und setzt das Limit", () => {
    expect(stationboardUrl("8503000", 8)).toBe(
      "https://transport.opendata.ch/v1/stationboard?station=8503000&limit=8"
    );
    expect(stationboardUrl("Bern, Bahnhof/Nord", 8)).toContain(
      "station=Bern%2C%20Bahnhof%2FNord"
    );
  });

  it("kappt unsinnige Limits", () => {
    expect(stationboardUrl("1", 0)).toContain("limit=1");
    expect(stationboardUrl("1", 999)).toContain("limit=40");
  });
});

describe("parseTransportTime", () => {
  it("nimmt den Sekunden-Zeitstempel, wenn es ihn gibt", () => {
    expect(parseTransportTime("2026-08-04T04:33:00+0200", 1785810780)).toBe(
      1785810780000
    );
  });

  it("liest den ISO-Text mit kurzem Offset, wenn der Zeitstempel fehlt", () => {
    expect(parseTransportTime("2026-08-04T04:33:00+0200")).toBe(
      Date.parse("2026-08-04T04:33:00+02:00")
    );
  });

  it("liest auch den langen Offset und Zulu-Zeit", () => {
    expect(parseTransportTime("2026-08-04T04:33:00+02:00")).toBe(
      Date.parse("2026-08-04T04:33:00+02:00")
    );
    expect(parseTransportTime("2026-08-04T02:33:00Z")).toBe(
      Date.parse("2026-08-04T02:33:00Z")
    );
  });

  it("gibt null für Unlesbares und für leere Werte", () => {
    expect(parseTransportTime(null, null)).toBeNull();
    expect(parseTransportTime("morgen früh")).toBeNull();
    expect(parseTransportTime("   ")).toBeNull();
    expect(parseTransportTime(undefined, 0)).toBeNull();
  });
});

describe("delayMinutesBetween", () => {
  it("rechnet angefangene Minuten ab, statt aufzurunden", () => {
    const planned = Date.parse("2026-08-04T08:00:00Z");
    expect(delayMinutesBetween(planned, planned + 70_000)).toBe(1);
    expect(delayMinutesBetween(planned, planned + 300_000)).toBe(5);
  });

  it("macht aus einer verfrühten Abfahrt keine negative Verspätung", () => {
    const planned = Date.parse("2026-08-04T08:00:00Z");
    expect(delayMinutesBetween(planned, planned - 120_000)).toBe(0);
    expect(delayMinutesBetween(planned, planned)).toBe(0);
  });

  it("verträgt kaputte Zahlen", () => {
    expect(delayMinutesBetween(Number.NaN, 5)).toBe(0);
  });
});

describe("parseStationKind", () => {
  it("kennt die Verkehrsmittel der API", () => {
    expect(parseStationKind("train")).toBe("train");
    expect(parseStationKind("BUS")).toBe("bus");
    expect(parseStationKind("tram")).toBe("tram");
    expect(parseStationKind("ship")).toBe("ship");
    expect(parseStationKind("cableway")).toBe("cableway");
  });

  it("fällt bei Unbekanntem und bei null auf «other» zurück", () => {
    expect(parseStationKind("funicular")).toBe("other");
    expect(parseStationKind(null)).toBe("other");
  });
});

describe("transportLineLabel", () => {
  it("setzt Kategorie und Liniennummer zusammen", () => {
    expect(transportLineLabel("B", "31")).toBe("B 31");
    expect(transportLineLabel("S", "8")).toBe("S 8");
    expect(transportLineLabel("IR", "37")).toBe("IR 37");
  });

  it("wirft die interne Fahrtnummer weg und lässt die Kategorie stehen", () => {
    expect(transportLineLabel("S", "018011")).toBe("S");
    expect(transportLineLabel("S", "019016")).toBe("S");
  });

  it("kommt auch mit halben Angaben klar", () => {
    expect(transportLineLabel(null, "12")).toBe("12");
    expect(transportLineLabel("ICE", null)).toBe("ICE");
    expect(transportLineLabel(null, null)).toBeUndefined();
    expect(transportLineLabel("  ", "  ")).toBeUndefined();
  });
});

describe("parseTransitStations", () => {
  const sample = {
    stations: [
      {
        id: null,
        name: "Bahnhofquai 15, Zürich",
        coordinate: { type: "WGS84", x: null, y: null },
        distance: 23.7,
        icon: null,
      },
      {
        id: "8587349",
        name: "Zürich, Bahnhofquai/HB",
        coordinate: { type: "WGS84", x: 47.377556, y: 8.541741 },
        distance: 73,
        icon: "bus",
      },
      {
        id: "8503000",
        name: "Zürich HB",
        coordinate: { type: "WGS84", x: 47.377847, y: 8.540502 },
        distance: 139,
        icon: "train",
      },
    ],
  };

  it("übersetzt Haltestellen und überspringt Adress-Treffer ohne Id", () => {
    const list = parseTransitStations(sample);
    expect(list).toHaveLength(2);
    expect(list[0]).toEqual({
      id: "8587349",
      name: "Zürich, Bahnhofquai/HB",
      lat: 47.377556,
      lon: 8.541741,
      distanceM: 73,
      kind: "bus",
    });
    expect(list[1].kind).toBe("train");
  });

  it("liest x als Breite und y als Länge (umgekehrt zur Anfrage)", () => {
    const list = parseTransitStations(sample);
    expect(list[1].lat).toBeCloseTo(47.377847, 5);
    expect(list[1].lon).toBeCloseTo(8.540502, 5);
  });

  it("entfernt Doppelte und unmögliche Koordinaten", () => {
    const list = parseTransitStations({
      stations: [
        {
          id: "1",
          name: "Eins",
          coordinate: { x: 46.9, y: 7.4 },
          distance: 10,
        },
        {
          id: "1",
          name: "Eins nochmals",
          coordinate: { x: 46.9, y: 7.4 },
          distance: 10,
        },
        {
          id: "2",
          name: "Kaputt",
          coordinate: { x: 191, y: 7.4 },
          distance: 10,
        },
      ],
    });
    expect(list.map(s => s.id)).toEqual(["1"]);
  });

  it("setzt eine fehlende Distanz auf 0 und schluckt Zahlen als Text", () => {
    const list = parseTransitStations({
      stations: [
        { id: "1", name: "Ohne", coordinate: { x: 46.9, y: 7.4 } },
        {
          id: "2",
          name: "Text",
          coordinate: { x: "46.9", y: "7.4" },
          distance: "250",
        },
      ],
    });
    expect(list[0].distanceM).toBe(0);
    expect(list[1].distanceM).toBe(250);
  });

  it("liefert für Unsinn eine leere Liste", () => {
    expect(parseTransitStations(null)).toEqual([]);
    expect(parseTransitStations({})).toEqual([]);
    expect(parseTransitStations({ stations: "nope" })).toEqual([]);
    expect(parseTransitStations({ stations: [null, 42] })).toEqual([]);
  });
});

describe("nearestTransitStations", () => {
  it("sortiert nach Distanz und kürzt auf das Limit", () => {
    const list = nearestTransitStations(
      [station("c", 900), station("a", 100), station("b", 400)],
      2
    );
    expect(list.map(s => s.id)).toEqual(["a", "b"]);
  });

  it("wirft alles jenseits des Fussweg-Radius weg", () => {
    const list = nearestTransitStations([
      station("nah", 300),
      station("fern", TRANSPORT_MAX_STATION_DISTANCE_M + 1),
    ]);
    expect(list.map(s => s.id)).toEqual(["nah"]);
  });

  it("entscheidet bei gleicher Distanz über die Id", () => {
    const list = nearestTransitStations([
      station("b", 200),
      station("a", 200),
      station("c", 200),
    ]);
    expect(list.map(s => s.id)).toEqual(["a", "b", "c"]);
  });

  it("lässt die Eingabeliste unangetastet", () => {
    const input = [station("b", 500), station("a", 100)];
    nearestTransitStations(input);
    expect(input.map(s => s.id)).toEqual(["b", "a"]);
  });

  it("gibt bei Limit 0 nichts zurück", () => {
    expect(nearestTransitStations([station("a", 10)], 0)).toEqual([]);
  });
});

describe("parseStationboard", () => {
  const now = Date.parse("2026-08-04T06:00:00Z");

  it("liest Linie, Ziel, Zeit, Verspätung und Kante", () => {
    const list = parseStationboard({
      stationboard: [
        {
          name: "058774",
          category: "B",
          number: "31",
          to: "Zürich, Hardplatz",
          stop: {
            departure: "2026-08-04T08:12:00+0200",
            departureTimestamp: now / 1000,
            delay: 3,
            platform: "C",
            prognosis: { departure: null },
          },
        },
      ],
    });
    expect(list).toHaveLength(1);
    expect(list[0].line).toBe("B 31");
    expect(list[0].to).toBe("Zürich, Hardplatz");
    expect(list[0].departureMs).toBe(now);
    expect(list[0].delayMin).toBe(3);
    expect(list[0].platform).toBe("C");
  });

  it("rechnet die Verspätung aus der Prognose, wenn delay fehlt", () => {
    const list = parseStationboard({
      stationboard: [
        {
          category: "S",
          number: "8",
          to: "Pfäffikon SZ",
          stop: {
            departure: "2026-08-04T08:00:00+0200",
            departureTimestamp: null,
            delay: null,
            prognosis: { departure: "2026-08-04T08:04:00+0200" },
          },
        },
      ],
    });
    expect(list[0].delayMin).toBe(4);
  });

  it("lässt die Verspätung unbekannt, wenn weder delay noch Prognose da sind", () => {
    const list = parseStationboard({
      stationboard: [
        {
          category: "B",
          number: "46",
          to: "Rütihof",
          stop: {
            departure: "2026-08-04T08:00:00+0200",
            delay: null,
            prognosis: { departure: null },
          },
        },
      ],
    });
    expect(list[0].delayMin).toBeUndefined();
  });

  it("überspringt Einträge ohne Zeit und ohne Ziel", () => {
    const list = parseStationboard({
      stationboard: [
        { category: "B", number: "1", to: "Ziel", stop: { departure: null } },
        {
          category: "B",
          number: "2",
          to: null,
          stop: { departureTimestamp: now / 1000 },
        },
        { category: "B", number: "3", to: "Gut", stop: null },
        {
          category: "B",
          number: "4",
          to: "Gut",
          stop: { departureTimestamp: now / 1000 },
        },
      ],
    });
    expect(list.map(d => d.line)).toEqual(["B 4"]);
  });

  it("entfernt doppelte Fahrten derselben Zeit", () => {
    const entry = {
      name: "058774",
      category: "B",
      number: "31",
      to: "Hardplatz",
      stop: { departureTimestamp: now / 1000 },
    };
    const list = parseStationboard({ stationboard: [entry, { ...entry }] });
    expect(list).toHaveLength(1);
  });

  it("liefert für Unsinn eine leere Liste", () => {
    expect(parseStationboard(null)).toEqual([]);
    expect(parseStationboard({ stationboard: {} })).toEqual([]);
    expect(parseStationboard({ stationboard: [7, null] })).toEqual([]);
  });
});

describe("upcomingDepartures", () => {
  const now = Date.parse("2026-08-04T08:00:00Z");
  const min = 60_000;

  it("wirft vergangene Abfahrten weg und sortiert aufsteigend", () => {
    const list = upcomingDepartures(
      [
        departure("c", now + 20 * min),
        departure("alt", now - 5 * min),
        departure("a", now + 2 * min),
        departure("b", now + 9 * min),
      ],
      now
    );
    expect(list.map(d => d.id)).toEqual(["a", "b", "c"]);
  });

  it("behält eine verspätete Abfahrt, die planmässig schon weg wäre", () => {
    const list = upcomingDepartures([departure("spät", now - 2 * min, 5)], now);
    expect(list.map(d => d.id)).toEqual(["spät"]);
  });

  it("sortiert nach der geplanten Zeit, nicht nach der verspäteten", () => {
    const list = upcomingDepartures(
      [
        departure("später", now + 10 * min),
        departure("früher", now + 1 * min, 30),
      ],
      now
    );
    expect(list.map(d => d.id)).toEqual(["früher", "später"]);
  });

  it("behält die Abfahrt in genau dieser Minute", () => {
    expect(upcomingDepartures([departure("jetzt", now)], now)).toHaveLength(1);
  });

  it("entscheidet bei gleicher Zeit über die Id", () => {
    const list = upcomingDepartures(
      [departure("b", now + min), departure("a", now + min)],
      now
    );
    expect(list.map(d => d.id)).toEqual(["a", "b"]);
  });

  it("kürzt auf das Limit und lässt die Eingabe unangetastet", () => {
    const input = [
      departure("c", now + 3 * min),
      departure("a", now + 1 * min),
      departure("b", now + 2 * min),
    ];
    expect(upcomingDepartures(input, now, 2).map(d => d.id)).toEqual([
      "a",
      "b",
    ]);
    expect(upcomingDepartures(input, now, 0)).toEqual([]);
    expect(input.map(d => d.id)).toEqual(["c", "a", "b"]);
  });
});

describe("Verbindungssuche (#491)", () => {
  it("baut die connections-URL aus zwei Koordinaten", () => {
    const url = connectionsUrl(
      { lat: 46.94809, lon: 7.44744 },
      { lat: 46.68, lon: 7.85 }
    );
    expect(url).toContain("/connections?");
    expect(url).toContain("from=46.94809%2C7.44744");
    expect(url).toContain("to=46.68000%2C7.85000");
    expect(url).toContain("limit=4");
  });

  it("liest die Dauer «00d01:23:00» als Minuten", () => {
    expect(connectionDurationMinutes("00d01:23:00")).toBe(83);
    expect(connectionDurationMinutes("01d00:05:00")).toBe(1445);
    expect(connectionDurationMinutes("kaputt")).toBeNull();
    expect(connectionDurationMinutes(42)).toBeNull();
  });

  it("parst Verbindungen defensiv und überspringt Löchriges", () => {
    const parsed = parseConnections({
      connections: [
        {
          from: {
            departureTimestamp: 1754660000,
            station: { name: "Bern" },
          },
          to: { arrivalTimestamp: 1754665000, station: { name: "Spiez" } },
          duration: "00d01:23:00",
          transfers: 1,
          products: ["IC 61", "B 61"],
        },
        // Ohne Zeitstempel keine Verbindung
        { from: {}, to: {}, duration: "00d00:30:00" },
      ],
    });
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({
      durationMin: 83,
      transfers: 1,
      products: ["IC 61", "B 61"],
      fromName: "Bern",
      toName: "Spiez",
    });
    expect(parseConnections(null)).toEqual([]);
  });
});
