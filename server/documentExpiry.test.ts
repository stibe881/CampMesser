import { describe, expect, it } from "vitest";
import {
  DOC_EXPIRY_WARN_DAYS,
  documentExpiryStatus,
  expiringDocuments,
} from "@shared/documentExpiry";
import { buildDocsAlert } from "./push";

/** Ablaufdaten für Karten & Ausweise (#476). */
describe("documentExpiryStatus", () => {
  const today = "2026-08-08";

  it("stuft nach Abstand zum Stichtag ein", () => {
    expect(documentExpiryStatus("2026-12-31", today)).toBe("ok");
    expect(documentExpiryStatus("2026-08-20", today)).toBe("soon");
    expect(documentExpiryStatus("2026-08-01", today)).toBe("expired");
  });

  it("der Ablauftag selbst gilt noch als «läuft bald ab»", () => {
    expect(documentExpiryStatus(today, today)).toBe("soon");
    expect(documentExpiryStatus("2026-08-07", today)).toBe("expired");
  });

  it("die Warnschwelle liegt bei 30 Tagen", () => {
    expect(DOC_EXPIRY_WARN_DAYS).toBe(30);
    expect(documentExpiryStatus("2026-09-07", today)).toBe("soon"); // 30 Tage
    expect(documentExpiryStatus("2026-09-08", today)).toBe("ok"); // 31 Tage
  });

  it("ohne Datum gibt es nichts zu sagen", () => {
    expect(documentExpiryStatus(null, today)).toBeNull();
    expect(documentExpiryStatus(undefined, today)).toBeNull();
  });
});

describe("expiringDocuments", () => {
  it("liefert nur bald ablaufende und abgelaufene, sortiert nach Datum", () => {
    const cards = [
      { title: "ACSI-Card", expiresOn: "2026-08-20" },
      { title: "TCS", expiresOn: "2027-01-01" },
      { title: "Vignette", expiresOn: "2026-01-31" },
      { title: "Camping Key", expiresOn: null },
    ];
    const due = expiringDocuments(cards, "2026-08-08");
    expect(due.map(c => c.title)).toEqual(["Vignette", "ACSI-Card"]);
  });
});

describe("buildDocsAlert", () => {
  it("baut die Erinnerung mit Monats-Schlüssel", () => {
    const alert = buildDocsAlert(
      [{ title: "ACSI-Card", expiresOn: "2026-08-20" }],
      "2026-08-08"
    );
    expect(alert).not.toBeNull();
    expect(alert?.key).toBe("docs:2026-08");
    expect(alert?.body).toContain("ACSI-Card");
  });

  it("ohne fällige Karten gibt es keine Meldung", () => {
    expect(
      buildDocsAlert(
        [
          { title: "TCS", expiresOn: "2027-01-01" },
          { title: "Camping Key", expiresOn: null },
        ],
        "2026-08-08"
      )
    ).toBeNull();
  });
});
