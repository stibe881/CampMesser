import { describe, expect, it } from "vitest";
import {
  APP_PUBLIC_URL,
  addDaysIso,
  buildTripIcs,
  escapeIcsText,
  foldIcsLine,
  icsDate,
  icsFileName,
  icsUtcStamp,
  tripEventLines,
  type IcsTrip,
} from "@shared/ics";

/** Fester Zeitstempel – das shared-Modul kennt kein Date.now(). */
const DTSTAMP = new Date("2026-08-03T19:30:00Z");

/** Eine schlichte Reise ohne Zeiten. */
const trip: IcsTrip = {
  id: 12,
  title: "Sommerferien am See",
  startDate: "2026-08-10",
  endDate: "2026-08-15",
  placeName: "Camping Thunersee",
  latitude: 46.6863,
  longitude: 7.6663,
};

/** Zeilen der erzeugten Datei – trennt bewusst an CRLF. */
function lines(ics: string): string[] {
  return ics.split("\r\n");
}

/** Wert einer Eigenschaft (erste Fundstelle, ungefaltet erwartet). */
function prop(ics: string, name: string): string | undefined {
  return lines(ics).find(line => line.startsWith(`${name}:`));
}

describe("escapeIcsText", () => {
  it("maskiert Komma, Semikolon und Backslash", () => {
    expect(escapeIcsText("Zelt, Stuhl; Tisch")).toBe("Zelt\\, Stuhl\\; Tisch");
    expect(escapeIcsText("C:\\Pfad")).toBe("C:\\\\Pfad");
  });

  it("maskiert den Backslash zuerst, nicht doppelt", () => {
    // Ein echter Backslash vor einem Komma darf nicht zu «\\\,» werden
    expect(escapeIcsText("a\\,b")).toBe("a\\\\\\,b");
  });

  it("macht aus Zeilenumbrüchen \\n", () => {
    expect(escapeIcsText("Zeile 1\nZeile 2")).toBe("Zeile 1\\nZeile 2");
    expect(escapeIcsText("Zeile 1\r\nZeile 2")).toBe("Zeile 1\\nZeile 2");
  });

  it("lässt Umlaute in Ruhe", () => {
    expect(escapeIcsText("Nächte am Bächli")).toBe("Nächte am Bächli");
  });
});

describe("foldIcsLine", () => {
  /** Länge einer Zeile in UTF-8-Oktetten. */
  const octets = (value: string) => Buffer.byteLength(value, "utf8");

  it("lässt kurze Zeilen unverändert", () => {
    expect(foldIcsLine("SUMMARY:Kurz")).toBe("SUMMARY:Kurz");
    // exakt 75 Oktette bleiben ungefaltet
    const exact = `X:${"a".repeat(73)}`;
    expect(octets(exact)).toBe(75);
    expect(foldIcsLine(exact)).toBe(exact);
  });

  it("faltet ab 76 Oktetten mit CRLF und Leerzeichen", () => {
    const long = `X:${"a".repeat(74)}`;
    const folded = foldIcsLine(long);
    expect(folded).toContain("\r\n ");
    const parts = folded.split("\r\n");
    expect(parts[0]).toBe(`X:${"a".repeat(73)}`);
    expect(parts[1]).toBe(" a");
  });

  it("hält jede Zeile inklusive Leerzeichen unter 76 Oktetten", () => {
    const folded = foldIcsLine(`DESCRIPTION:${"ä".repeat(200)}`);
    for (const line of folded.split("\r\n")) {
      expect(octets(line)).toBeLessThanOrEqual(75);
    }
  });

  it("zerschneidet keine mehrbyteigen Zeichen", () => {
    const folded = foldIcsLine(`DESCRIPTION:${"ä".repeat(200)}`);
    // Ohne kaputte Zeichen ergibt das Zusammensetzen exakt das Original
    const rejoined = folded.split("\r\n ").join("");
    expect(rejoined).toBe(`DESCRIPTION:${"ä".repeat(200)}`);
    expect(folded).not.toContain("\uFFFD");
  });

  it("verkraftet Emoji (4 Oktette) an der Faltgrenze", () => {
    const folded = foldIcsLine(`SUMMARY:${"a".repeat(64)}${"🏕".repeat(10)}`);
    for (const line of folded.split("\r\n")) {
      expect(Buffer.byteLength(line, "utf8")).toBeLessThanOrEqual(75);
    }
    expect(folded.split("\r\n ").join("")).toBe(
      `SUMMARY:${"a".repeat(64)}${"🏕".repeat(10)}`
    );
  });
});

describe("Datums-Helfer", () => {
  it("formt ISO-Tage zu iCalendar-DATE", () => {
    expect(icsDate("2026-08-10")).toBe("20260810");
  });

  it("zählt über den Jahreswechsel weiter", () => {
    expect(addDaysIso("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysIso("2027-01-01", -1)).toBe("2026-12-31");
  });

  it("kennt den Schalttag", () => {
    expect(addDaysIso("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDaysIso("2028-02-29", 1)).toBe("2028-03-01");
  });

  it("macht aus dem Zeitstempel eine UTC-Angabe mit Z", () => {
    expect(icsUtcStamp(DTSTAMP)).toBe("20260803T193000Z");
  });
});

describe("tripEventLines", () => {
  it("baut ein ganztägiges Ereignis mit exklusivem DTEND", () => {
    const event = tripEventLines(trip, { dtstamp: DTSTAMP });
    expect(event).not.toBeNull();
    expect(event).toContain("DTSTART;VALUE=DATE:20260810");
    // Abreise am 15. → DTEND 16. (exklusiv)
    expect(event).toContain("DTEND;VALUE=DATE:20260816");
  });

  it("hält die UID pro Reise stabil", () => {
    const a = tripEventLines(trip, { dtstamp: DTSTAMP });
    const b = tripEventLines(
      { ...trip, title: "Anderer Titel" },
      { dtstamp: new Date("2027-01-01T00:00:00Z") }
    );
    expect(a).toContain("UID:trip-12@campmesser.ch");
    expect(b).toContain("UID:trip-12@campmesser.ch");
  });

  it("nimmt Ort und Koordinaten auf", () => {
    const event = tripEventLines(trip, { dtstamp: DTSTAMP }) ?? [];
    expect(event).toContain("LOCATION:Camping Thunersee");
    expect(event).toContain("GEO:46.686300;7.666300");
  });

  it("lässt GEO bei fehlenden oder unsinnigen Koordinaten weg", () => {
    const ohne =
      tripEventLines(
        { ...trip, latitude: null, longitude: null },
        { dtstamp: DTSTAMP }
      ) ?? [];
    expect(ohne.some(line => line.startsWith("GEO:"))).toBe(false);
    const kaputt =
      tripEventLines(
        { ...trip, latitude: 999, longitude: 7 },
        { dtstamp: DTSTAMP }
      ) ?? [];
    expect(kaputt.some(line => line.startsWith("GEO:"))).toBe(false);
  });

  it("wird zeitgenau, sobald beide Zeiten gesetzt sind", () => {
    const event =
      tripEventLines(
        { ...trip, arrivalTime: "14:30", departureTime: "11:00" },
        { dtstamp: DTSTAMP }
      ) ?? [];
    expect(event).toContain("DTSTART:20260810T143000");
    // zeitgenau heisst: Ende ist der echte Abreisetag, nicht der Folgetag
    expect(event).toContain("DTEND:20260815T110000");
  });

  it("bleibt ganztägig, wenn nur eine Zeit gesetzt ist", () => {
    const event =
      tripEventLines({ ...trip, arrivalTime: "14:30" }, { dtstamp: DTSTAMP }) ??
      [];
    expect(event).toContain("DTSTART;VALUE=DATE:20260810");
    expect(event).toContain("DTEND;VALUE=DATE:20260816");
  });

  it("bleibt ganztägig, wenn die Zeiten unbrauchbar sind", () => {
    const event =
      tripEventLines(
        { ...trip, arrivalTime: "25:00", departureTime: "11:00" },
        { dtstamp: DTSTAMP }
      ) ?? [];
    expect(event).toContain("DTSTART;VALUE=DATE:20260810");
  });

  it("fällt bei Tagesausflügen mit Ende vor Beginn auf ganztägig zurück", () => {
    const event =
      tripEventLines(
        {
          ...trip,
          endDate: "2026-08-10",
          arrivalTime: "14:00",
          departureTime: "11:00",
        },
        { dtstamp: DTSTAMP }
      ) ?? [];
    expect(event).toContain("DTSTART;VALUE=DATE:20260810");
    expect(event).toContain("DTEND;VALUE=DATE:20260811");
  });

  it("nimmt den Platznamen als Titel, wenn die Reise keinen hat", () => {
    const event =
      tripEventLines({ ...trip, title: "  " }, { dtstamp: DTSTAMP }) ?? [];
    expect(event).toContain("SUMMARY:Camping Thunersee");
  });

  it("hat immer einen Titel, notfalls den Ersatznamen je Sprache", () => {
    const de =
      tripEventLines(
        { ...trip, title: "", placeName: null },
        { dtstamp: DTSTAMP }
      ) ?? [];
    expect(de).toContain("SUMMARY:Reise");
    const en =
      tripEventLines(
        { ...trip, title: "", placeName: null },
        { dtstamp: DTSTAMP, lang: "en" }
      ) ?? [];
    expect(en).toContain("SUMMARY:Trip");
  });

  it("schreibt Nächte und Link in die Beschreibung", () => {
    const event = tripEventLines(trip, { dtstamp: DTSTAMP }) ?? [];
    expect(event).toContain(
      `DESCRIPTION:5 Nächte · Geplant mit ReiseKompass\\n${APP_PUBLIC_URL}`
    );
    const it = tripEventLines(trip, { dtstamp: DTSTAMP, lang: "it" }) ?? [];
    expect(it).toContain(
      `DESCRIPTION:5 notti · Pianificato con ReiseKompass\\n${APP_PUBLIC_URL}`
    );
  });

  it("lässt die Nächte-Angabe beim Tagesausflug weg", () => {
    const event =
      tripEventLines(
        { ...trip, endDate: "2026-08-10" },
        { dtstamp: DTSTAMP }
      ) ?? [];
    expect(event).toContain(
      `DESCRIPTION:Geplant mit ReiseKompass\\n${APP_PUBLIC_URL}`
    );
  });

  it("verweigert kaputte Daten", () => {
    expect(
      tripEventLines({ ...trip, startDate: "irgendwann" }, { dtstamp: DTSTAMP })
    ).toBeNull();
    expect(
      tripEventLines({ ...trip, startDate: "2026-02-30" }, { dtstamp: DTSTAMP })
    ).toBeNull();
    expect(
      tripEventLines(
        { ...trip, startDate: "2026-08-20", endDate: "2026-08-10" },
        { dtstamp: DTSTAMP }
      )
    ).toBeNull();
  });
});

describe("buildTripIcs", () => {
  it("liefert einen gültigen Kalender mit CRLF-Zeilenenden", () => {
    const ics = buildTripIcs([trip], { dtstamp: DTSTAMP });
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("PRODID:-//ReiseKompass//Reisen//DE");
    // kein einziges nacktes \n ausserhalb der CRLF-Paare
    expect(ics.replace(/\r\n/g, "")).not.toContain("\n");
  });

  it("setzt DTSTAMP aus dem übergebenen Zeitpunkt", () => {
    const ics = buildTripIcs([trip], { dtstamp: DTSTAMP });
    expect(prop(ics, "DTSTAMP")).toBe("DTSTAMP:20260803T193000Z");
  });

  it("packt mehrere Reisen in eine Datei", () => {
    const ics = buildTripIcs(
      [trip, { ...trip, id: 13, title: "Herbstferien" }],
      { dtstamp: DTSTAMP }
    );
    expect(ics.split("BEGIN:VEVENT").length - 1).toBe(2);
    expect(ics).toContain("UID:trip-12@campmesser.ch");
    expect(ics).toContain("UID:trip-13@campmesser.ch");
  });

  it("überspringt kaputte Reisen, statt die Datei zu verderben", () => {
    const ics = buildTripIcs([trip, { ...trip, id: 99, startDate: "kaputt" }], {
      dtstamp: DTSTAMP,
    });
    expect(ics.split("BEGIN:VEVENT").length - 1).toBe(1);
    expect(ics).not.toContain("trip-99");
  });

  it("bleibt ohne Reisen ein gültiger, leerer Kalender", () => {
    const ics = buildTripIcs([], { dtstamp: DTSTAMP });
    expect(ics).toBe(
      "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//ReiseKompass//Reisen//DE\r\n" +
        "CALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\nEND:VCALENDAR\r\n"
    );
  });

  it("rechnet über den Jahreswechsel richtig", () => {
    const ics = buildTripIcs(
      [
        {
          ...trip,
          id: 7,
          title: "Silvester im Schnee",
          startDate: "2026-12-28",
          endDate: "2026-12-31",
        },
      ],
      { dtstamp: DTSTAMP }
    );
    expect(ics).toContain("DTSTART;VALUE=DATE:20261228");
    expect(ics).toContain("DTEND;VALUE=DATE:20270101");
    expect(ics).toContain("DESCRIPTION:3 Nächte");
  });

  it("faltet lange Titel und behält den Text bei", () => {
    const langerTitel =
      "Grosse Sommerreise mit Zelt, Kanu und Kindern quer durch die Westschweiz bis ans Meer";
    const ics = buildTripIcs([{ ...trip, title: langerTitel }], {
      dtstamp: DTSTAMP,
    });
    for (const line of lines(ics)) {
      expect(Buffer.byteLength(line, "utf8")).toBeLessThanOrEqual(75);
    }
    // entfalten muss den maskierten Originaltext ergeben
    const unfolded = ics.split("\r\n ").join("");
    expect(unfolded).toContain(
      `SUMMARY:${langerTitel.replace(/,/g, "\\,")}\r\n`
    );
  });

  it("maskiert Sonderzeichen in Titel und Ort", () => {
    const ics = buildTripIcs(
      [
        {
          ...trip,
          title: "Ferien; Zelt, Kanu",
          placeName: "Camping «Süd», Parzelle B12",
        },
      ],
      { dtstamp: DTSTAMP }
    );
    expect(ics).toContain("SUMMARY:Ferien\\; Zelt\\, Kanu");
    expect(ics).toContain("LOCATION:Camping «Süd»\\, Parzelle B12");
  });
});

describe("icsFileName", () => {
  it("baut Datum und Namensteil zusammen", () => {
    expect(icsFileName("Sommerferien am See", "2026-08-10")).toBe(
      "2026-08-10-sommerferien-am-see.ics"
    );
  });

  it("ersetzt Umlaute und Sonderzeichen", () => {
    expect(icsFileName("Zelt & Bär – Größe", "2026-08-10")).toBe(
      "2026-08-10-zelt-baer-groesse.ics"
    );
  });

  it("greift ohne brauchbaren Namen zum Ersatz", () => {
    expect(icsFileName("!!!", "2026-08-10")).toBe("2026-08-10-reise.ics");
    expect(icsFileName("", "2026-08-10", "reisen")).toBe(
      "2026-08-10-reisen.ics"
    );
  });

  it("verkraftet ein kaputtes Datum", () => {
    expect(icsFileName("Reise", "irgendwann")).toBe("0000-00-00-reise.ics");
  });
});
