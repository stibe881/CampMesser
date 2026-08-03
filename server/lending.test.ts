import { describe, expect, it } from "vitest";
import { countLent, isLent, MAX_LENT_TO_LENGTH } from "@shared/lending";

describe("isLent", () => {
  it("gilt nur mit hinterlegtem Namen als verliehen", () => {
    expect(isLent({ lentTo: "Sarah", lentAt: "2026-08-01" })).toBe(true);
    expect(isLent({ lentTo: null, lentAt: null })).toBe(false);
    expect(isLent({})).toBe(false);
    // Leerzeichen zählen nicht als Name
    expect(isLent({ lentTo: "   ", lentAt: "2026-08-01" })).toBe(false);
  });

  it("kommt ohne Ausleih-Datum aus", () => {
    expect(isLent({ lentTo: "Sarah" })).toBe(true);
  });
});

describe("countLent", () => {
  it("zählt die verliehenen Gegenstände", () => {
    expect(
      countLent([
        { lentTo: "Sarah", lentAt: "2026-08-01" },
        { lentTo: "x".repeat(MAX_LENT_TO_LENGTH), lentAt: "2026-07-14" },
        { lentTo: null, lentAt: null },
      ])
    ).toBe(2);
    expect(countLent([])).toBe(0);
  });
});
