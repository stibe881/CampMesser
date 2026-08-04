import { describe, expect, it } from "vitest";
import {
  guestbookAuthorLabel,
  guestbookSummary,
  isMemberEntry,
  isValidGuestbookMessage,
  MAX_GUEST_NAME_LENGTH,
  MAX_GUESTBOOK_MESSAGE_LENGTH,
  normalizeGuestbookMessage,
  normalizeGuestName,
  sortGuestbookEntries,
} from "@shared/guestbook";

describe("normalizeGuestName", () => {
  it("fasst Leerraum zusammen und trimmt", () => {
    expect(normalizeGuestName("  Anna   Maria \n")).toBe("Anna Maria");
  });

  it("kürzt auf die Länge der Spalte", () => {
    expect(normalizeGuestName("x".repeat(200)).length).toBe(
      MAX_GUEST_NAME_LENGTH
    );
  });

  it("verträgt leere Eingabe", () => {
    expect(normalizeGuestName("")).toBe("");
    expect(normalizeGuestName("   ")).toBe("");
  });
});

describe("normalizeGuestbookMessage", () => {
  it("behält Absätze, kürzt aber Leerzeilen-Kaskaden", () => {
    expect(normalizeGuestbookMessage("Hallo\n\n\n\nTschüss")).toBe(
      "Hallo\n\nTschüss"
    );
  });

  it("trimmt aussen", () => {
    expect(normalizeGuestbookMessage("\n  Gruss  \n")).toBe("Gruss");
  });

  it("kürzt auf die Länge der Spalte", () => {
    expect(normalizeGuestbookMessage("y".repeat(900)).length).toBe(
      MAX_GUESTBOOK_MESSAGE_LENGTH
    );
  });

  it("macht aus Windows-Zeilenenden normale", () => {
    expect(normalizeGuestbookMessage("a\r\nb")).toBe("a\nb");
  });
});

describe("isValidGuestbookMessage", () => {
  it("nimmt echten Text an", () => {
    expect(isValidGuestbookMessage("Schöne Ferien!")).toBe(true);
  });

  it("lehnt Leeres ab", () => {
    expect(isValidGuestbookMessage("")).toBe(false);
    expect(isValidGuestbookMessage("   \n  ")).toBe(false);
  });
});

describe("guestbookAuthorLabel", () => {
  it("nimmt den gesäuberten Namen", () => {
    expect(guestbookAuthorLabel({ authorName: "  Opa  " }, "Gast")).toBe("Opa");
  });

  it("fällt ohne Namen auf den Platzhalter zurück", () => {
    expect(guestbookAuthorLabel({ authorName: "   " }, "Gast")).toBe("Gast");
  });
});

describe("isMemberEntry", () => {
  it("unterscheidet Konto und Gast", () => {
    expect(isMemberEntry({ userId: 7 })).toBe(true);
    expect(isMemberEntry({ userId: null })).toBe(false);
    expect(isMemberEntry({})).toBe(false);
  });
});

describe("sortGuestbookEntries", () => {
  const entry = (id: number, createdAt: string, userId: number | null = null) =>
    ({ id, createdAt, userId, authorName: "x", message: "y" }) as const;

  it("stellt die neusten nach oben", () => {
    const sorted = sortGuestbookEntries([
      entry(1, "2026-08-01T10:00:00Z"),
      entry(2, "2026-08-03T10:00:00Z"),
      entry(3, "2026-08-02T10:00:00Z"),
    ]);
    expect(sorted.map(e => e.id)).toEqual([2, 3, 1]);
  });

  it("entscheidet bei gleicher Zeit über die Id", () => {
    const sorted = sortGuestbookEntries([
      entry(5, "2026-08-01T10:00:00Z"),
      entry(9, "2026-08-01T10:00:00Z"),
    ]);
    expect(sorted.map(e => e.id)).toEqual([9, 5]);
  });

  it("lässt die Eingabe unangetastet", () => {
    const input = [entry(1, "2026-08-01T10:00:00Z")];
    sortGuestbookEntries(input);
    expect(input.length).toBe(1);
  });

  it("verträgt kaputte Zeitstempel", () => {
    const sorted = sortGuestbookEntries([
      entry(1, "kein Datum"),
      entry(2, "2026-08-01T10:00:00Z"),
    ]);
    expect(sorted[0].id).toBe(2);
  });
});

describe("guestbookSummary", () => {
  it("zählt Konto- und Gast-Einträge sowie Fotos", () => {
    const summary = guestbookSummary([
      {
        id: 1,
        userId: 4,
        authorName: "a",
        message: "m",
        photoId: 12,
        createdAt: "2026-08-01T10:00:00Z",
      },
      {
        id: 2,
        userId: null,
        authorName: "b",
        message: "m",
        createdAt: "2026-08-01T10:00:00Z",
      },
      {
        id: 3,
        userId: null,
        authorName: "c",
        message: "m",
        createdAt: "2026-08-01T10:00:00Z",
      },
    ]);
    expect(summary.total).toBe(3);
    expect(summary.fromMembers).toBe(1);
    expect(summary.fromGuests).toBe(2);
    expect(summary.withPhoto).toBe(1);
  });

  it("kommt mit leerer Liste klar", () => {
    expect(guestbookSummary([])).toEqual({
      total: 0,
      fromGuests: 0,
      fromMembers: 0,
      withPhoto: 0,
    });
  });
});
