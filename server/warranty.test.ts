import { describe, expect, it } from "vitest";
import {
  countWarrantiesEndingSoon,
  warrantyStatus,
  MAX_WARRANTY_MONTHS,
  WARRANTY_SOON_DAYS,
} from "@shared/warranty";

describe("warrantyStatus", () => {
  it("berechnet das Garantie-Ende aus Kaufdatum + Monaten", () => {
    const status = warrantyStatus("2025-08-03", 24, "2026-08-03");
    expect(status).not.toBeNull();
    expect(status?.endsOn).toBe("2027-08-03");
    expect(status?.state).toBe("active");
    expect(status?.daysLeft).toBe(365);
  });

  it("markiert eine laufende Garantie als «active»", () => {
    const status = warrantyStatus("2026-01-15", 12, "2026-08-03");
    expect(status?.endsOn).toBe("2027-01-15");
    expect(status?.state).toBe("active");
  });

  it("markiert Garantien mit höchstens 60 Tagen Restlaufzeit als «endingSoon»", () => {
    // 03.10.2026 ist genau 61 Tage nach dem 03.08.2026 → noch «active»
    expect(warrantyStatus("2024-10-03", 24, "2026-08-03")?.state).toBe(
      "active"
    );
    // 02.10.2026 sind genau 60 Tage → «endingSoon»
    const soon = warrantyStatus("2024-10-02", 24, "2026-08-03");
    expect(soon?.daysLeft).toBe(WARRANTY_SOON_DAYS);
    expect(soon?.state).toBe("endingSoon");
  });

  it("gilt am letzten Garantietag noch als «endingSoon», danach als «expired»", () => {
    const lastDay = warrantyStatus("2024-08-03", 24, "2026-08-03");
    expect(lastDay?.daysLeft).toBe(0);
    expect(lastDay?.state).toBe("endingSoon");
    const over = warrantyStatus("2024-08-02", 24, "2026-08-03");
    expect(over?.daysLeft).toBe(-1);
    expect(over?.state).toBe("expired");
  });

  it("klemmt Monatsenden auf den letzten Tag des Ziel-Monats", () => {
    // 31.08. + 6 Monate → 28.02. (2027 ist kein Schaltjahr)
    expect(warrantyStatus("2026-08-31", 6, "2026-08-03")?.endsOn).toBe(
      "2027-02-28"
    );
    // 31.08.2023 + 6 Monate → 29.02.2024 (Schaltjahr)
    expect(warrantyStatus("2023-08-31", 6, "2026-08-03")?.endsOn).toBe(
      "2024-02-29"
    );
    // 31.01. + 1 Monat → 28.02.
    expect(warrantyStatus("2026-01-31", 1, "2026-08-03")?.endsOn).toBe(
      "2026-02-28"
    );
    // 29.02. eines Schaltjahres + 12 Monate → 28.02.
    expect(warrantyStatus("2024-02-29", 12, "2026-08-03")?.endsOn).toBe(
      "2025-02-28"
    );
  });

  it("liefert null, wenn Kaufdatum oder Garantiedauer fehlen", () => {
    expect(warrantyStatus(null, 24, "2026-08-03")).toBeNull();
    expect(warrantyStatus(undefined, 24, "2026-08-03")).toBeNull();
    expect(warrantyStatus("", 24, "2026-08-03")).toBeNull();
    expect(warrantyStatus("2025-08-03", null, "2026-08-03")).toBeNull();
    expect(warrantyStatus("2025-08-03", undefined, "2026-08-03")).toBeNull();
    expect(warrantyStatus("2025-08-03", 0, "2026-08-03")).toBeNull();
  });

  it("liefert null bei unbrauchbaren Angaben", () => {
    expect(warrantyStatus("03.08.2025", 24, "2026-08-03")).toBeNull();
    expect(warrantyStatus("2025-13-40", 24, "2026-08-03")).toBeNull();
    expect(warrantyStatus("2025-08-03", Number.NaN, "2026-08-03")).toBeNull();
    expect(
      warrantyStatus("2025-08-03", MAX_WARRANTY_MONTHS + 1, "2026-08-03")
    ).toBeNull();
    expect(warrantyStatus("2025-08-03", -12, "2026-08-03")).toBeNull();
    expect(warrantyStatus("2025-08-03", 24, "keindatum")).toBeNull();
  });
});

describe("countWarrantiesEndingSoon", () => {
  it("zählt nur Gegenstände, deren Garantie bald abläuft", () => {
    const items = [
      // läuft in 30 Tagen ab → zählt
      { purchaseDate: "2024-09-02", warrantyMonths: 24 },
      // läuft heute ab → zählt
      { purchaseDate: "2025-08-03", warrantyMonths: 12 },
      // noch lange gültig → zählt nicht
      { purchaseDate: "2026-01-01", warrantyMonths: 24 },
      // längst abgelaufen → zählt nicht
      { purchaseDate: "2020-01-01", warrantyMonths: 24 },
      // keine Angaben → zählt nicht
      { purchaseDate: null, warrantyMonths: 24 },
      { purchaseDate: "2026-01-01", warrantyMonths: null },
    ];
    expect(countWarrantiesEndingSoon(items, "2026-08-03")).toBe(2);
  });

  it("liefert 0 für ein leeres Inventar", () => {
    expect(countWarrantiesEndingSoon([], "2026-08-03")).toBe(0);
  });
});
