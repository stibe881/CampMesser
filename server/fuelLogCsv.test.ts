import { describe, expect, it } from "vitest";
import { fuelLogCsvFileName, fuelLogToCsv } from "@shared/fuelLogCsv";

/** Tankbuch-CSV-Export (#477). */
describe("fuelLogToCsv", () => {
  const headers = [
    "Datum",
    "Kilometerstand",
    "Liter",
    "Betrag CHF",
    "Verbrauch l/100 km",
    "Fahrzeug",
  ];

  it("baut Kopfzeile, Zeilen und Verbrauchs-Spalte", () => {
    const csv = fuelLogToCsv(
      [
        {
          day: "2026-07-01",
          odometerKm: 84_000,
          liters10: 425,
          priceRappen: 7490,
          vehicle: "Bus",
        },
        {
          day: "2026-07-15",
          odometerKm: 84_600,
          liters10: 480,
          priceRappen: null,
        },
      ],
      { headers }
    );
    const lines = csv.replace(/^﻿/, "").trim().split("\r\n");
    expect(lines[0]).toBe(
      "Datum;Kilometerstand;Liter;Betrag CHF;Verbrauch l/100 km;Fahrzeug"
    );
    // Erste Füllung: kein Abschnitt davor → Verbrauchs-Spalte leer
    expect(lines[1]).toBe("2026-07-01;84000;42.5;74.90;;Bus");
    // Zweite Füllung: 48 l auf 600 km = 8.0 l/100 km, Betrag nicht erfasst
    expect(lines[2]).toBe("2026-07-15;84600;48.0;;8.0;");
  });

  it("sortiert nach Kilometerstand, nicht nach Eingabe-Reihenfolge", () => {
    const csv = fuelLogToCsv(
      [
        { day: "2026-07-15", odometerKm: 84_600, liters10: 480 },
        { day: "2026-07-01", odometerKm: 84_000, liters10: 425 },
      ],
      { headers }
    );
    const lines = csv.replace(/^﻿/, "").trim().split("\r\n");
    expect(lines[1].startsWith("2026-07-01;84000")).toBe(true);
  });

  it("beginnt mit dem BOM, damit Excel UTF-8 erkennt", () => {
    const csv = fuelLogToCsv([], { headers });
    expect(csv.startsWith("﻿")).toBe(true);
  });
});

describe("fuelLogCsvFileName", () => {
  it("hängt den Tag an", () => {
    expect(fuelLogCsvFileName("2026-08-08")).toBe("tankbuch-2026-08-08.csv");
  });
});
