import { describe, expect, it } from "vitest";
import {
  createPrintTicket,
  PRINT_TICKET_TTL_MS,
  sanitizeNextPath,
  verifyPrintTicket,
} from "./printTicket";

const SECRET = "test-geheimnis";
const NOW = 1_750_000_000_000;

describe("printTicket", () => {
  it("stellt ein Ticket aus und prüft es erfolgreich", () => {
    const ticket = createPrintTicket(42, SECRET, NOW);
    expect(verifyPrintTicket(ticket, SECRET, NOW)).toBe(42);
    // Kurz vor Ablauf gilt es noch
    expect(
      verifyPrintTicket(ticket, SECRET, NOW + PRINT_TICKET_TTL_MS - 1)
    ).toBe(42);
  });

  it("lehnt abgelaufene Tickets ab", () => {
    const ticket = createPrintTicket(42, SECRET, NOW);
    expect(
      verifyPrintTicket(ticket, SECRET, NOW + PRINT_TICKET_TTL_MS + 1)
    ).toBeNull();
  });

  it("lehnt verbogene und fremd signierte Tickets ab", () => {
    const ticket = createPrintTicket(42, SECRET, NOW);
    // Konto-Nummer manipuliert → Signatur passt nicht mehr
    const parts = ticket.split(".");
    expect(
      verifyPrintTicket(`7.${parts[1]}.${parts[2]}`, SECRET, NOW)
    ).toBeNull();
    // Anderes Geheimnis
    expect(verifyPrintTicket(ticket, "anderes-geheimnis", NOW)).toBeNull();
    // Müll und leeres Geheimnis
    expect(verifyPrintTicket("unsinn", SECRET, NOW)).toBeNull();
    expect(verifyPrintTicket(ticket, "", NOW)).toBeNull();
  });

  it("lässt nur eigene Pfade als Weiterleitungs-Ziel durch", () => {
    expect(sanitizeNextPath("/reisepass")).toBe("/reisepass");
    expect(sanitizeNextPath("/packlisten/3/drucken")).toBe(
      "/packlisten/3/drucken"
    );
    expect(sanitizeNextPath("https://boese.example")).toBe("/");
    expect(sanitizeNextPath("//boese.example")).toBe("/");
    expect(sanitizeNextPath(undefined)).toBe("/");
  });
});
