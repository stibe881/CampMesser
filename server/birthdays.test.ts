import { describe, expect, it } from "vitest";
import { birthdaysInRange } from "@shared/birthdays";

describe("Geburtstage unterwegs (#656)", () => {
  const people = [
    { name: "Mira", birthday: "2018-08-15" },
    { name: "Jon", birthday: "2016-01-02" },
    { name: "Ohne", birthday: null },
  ];

  it("findet Geburtstage im Reisezeitraum samt Alter", () => {
    const hits = birthdaysInRange(people, "2026-08-10", "2026-08-20");
    expect(hits).toEqual([{ name: "Mira", date: "2026-08-15", age: 8 }]);
  });

  it("kommt über den Jahreswechsel", () => {
    const hits = birthdaysInRange(people, "2026-12-28", "2027-01-05");
    expect(hits).toEqual([{ name: "Jon", date: "2027-01-02", age: 11 }]);
  });

  it("feiert den 29. Februar in Nicht-Schaltjahren am 28.", () => {
    const leapKid = [{ name: "Lea", birthday: "2020-02-29" }];
    expect(birthdaysInRange(leapKid, "2026-02-25", "2026-03-01")).toEqual([
      { name: "Lea", date: "2026-02-28", age: 6 },
    ]);
    expect(birthdaysInRange(leapKid, "2028-02-25", "2028-03-01")).toEqual([
      { name: "Lea", date: "2028-02-29", age: 8 },
    ]);
  });

  it("liefert nichts ausserhalb des Zeitraums oder ohne Datum", () => {
    expect(birthdaysInRange(people, "2026-03-01", "2026-03-10")).toEqual([]);
  });
});
