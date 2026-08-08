import { describe, expect, it } from "vitest";
import { tripKindRows } from "@shared/tripKindStats";

describe("Statistik nach Reise-Art (#467)", () => {
  it("zählt Reisen und Nächte pro Art, stärkste zuerst", () => {
    const rows = tripKindRows([
      { kind: "camping", startDate: "2026-07-01", endDate: "2026-07-08" },
      { kind: "camping", startDate: "2026-08-01", endDate: "2026-08-03" },
      { kind: "strand", startDate: "2026-06-01", endDate: "2026-06-15" },
      { kind: "tagesausflug", startDate: "2026-05-01", endDate: "2026-05-01" },
    ]);
    expect(rows).toEqual([
      { kind: "strand", trips: 1, nights: 14 },
      { kind: "camping", trips: 2, nights: 9 },
      { kind: "tagesausflug", trips: 1, nights: 0 },
    ]);
  });

  it("zählt alte Zeilen ohne Art als Camping", () => {
    const rows = tripKindRows([
      { startDate: "2026-07-01", endDate: "2026-07-02" },
      { kind: "unsinn", startDate: "2026-07-05", endDate: "2026-07-06" },
    ]);
    expect(rows).toEqual([{ kind: "camping", trips: 2, nights: 2 }]);
  });

  it("bleibt ohne Reisen leer", () => {
    expect(tripKindRows([])).toEqual([]);
  });
});
