import { describe, expect, it } from "vitest";
import { REVIEW_PROMPT_DAYS, reviewCandidate } from "@shared/reviewPrompt";

const none = new Set<number>();

const trip = (id: number, endDate: string, role?: "owner" | "member") => ({
  id,
  endDate,
  role,
});

describe("reviewCandidate", () => {
  it("erinnert nach der Heimkehr an die Reise", () => {
    const found = reviewCandidate(
      [trip(1, "2026-08-05")],
      "2026-08-07",
      none,
      none
    );
    expect(found?.id).toBe(1);
  });

  it("schweigt am Abreisetag selbst", () => {
    // Am Abreisetag packt man aus und hat Besseres zu tun als Formulare.
    expect(
      reviewCandidate([trip(1, "2026-08-07")], "2026-08-07", none, none)
    ).toBeNull();
  });

  it("gibt nach REVIEW_PROMPT_DAYS Tagen wieder Ruhe", () => {
    const late = reviewCandidate(
      [trip(1, "2026-07-01")],
      "2026-08-07",
      none,
      none
    );
    expect(late).toBeNull();
    // Am letzten Tag der Frist erinnert sie noch.
    const lastDay = reviewCandidate(
      [trip(1, "2026-08-01")],
      `2026-08-0${1 + REVIEW_PROMPT_DAYS > 9 ? 8 : 1 + REVIEW_PROMPT_DAYS}`,
      none,
      none
    );
    expect(lastDay?.id).toBe(1);
  });

  it("verschwindet nach dem Ausfüllen", () => {
    expect(
      reviewCandidate([trip(1, "2026-08-05")], "2026-08-07", new Set([1]), none)
    ).toBeNull();
  });

  it("gilt beim Wegklicken JE REISE, nicht für immer", () => {
    const trips = [trip(1, "2026-08-03"), trip(2, "2026-08-05")];
    const found = reviewCandidate(trips, "2026-08-07", none, new Set([2]));
    // Reise 2 ist weggeklickt – Reise 1 darf trotzdem erinnern.
    expect(found?.id).toBe(1);
  });

  it("nimmt bei zwei Heimkehrten die JÜNGSTE Abreise", () => {
    // Die frische Reise ist die, zu der man noch etwas weiss.
    const found = reviewCandidate(
      [trip(1, "2026-08-02"), trip(2, "2026-08-05")],
      "2026-08-07",
      none,
      none
    );
    expect(found?.id).toBe(2);
  });

  it("übergeht Mitglieds-Reisen", () => {
    // Der Rückblick prüft den Besitz beim Speichern – eine Karte, die
    // dort scheitert, wäre eine Falle.
    expect(
      reviewCandidate(
        [trip(1, "2026-08-05", "member")],
        "2026-08-07",
        none,
        none
      )
    ).toBeNull();
  });

  it("läuft über den Monatswechsel", () => {
    const found = reviewCandidate(
      [trip(1, "2026-07-30")],
      "2026-08-03",
      none,
      none
    );
    expect(found?.id).toBe(1);
  });
});
