import { describe, expect, it } from "vitest";
import { firstNameOf, greetingKey } from "@shared/greeting";

describe("greetingKey", () => {
  it("teilt den Tag in Morgen, Tag und Abend", () => {
    expect(greetingKey(5)).toBe("morning");
    expect(greetingKey(10)).toBe("morning");
    expect(greetingKey(11)).toBe("day");
    expect(greetingKey(17)).toBe("day");
    expect(greetingKey(18)).toBe("evening");
    expect(greetingKey(23)).toBe("evening");
    expect(greetingKey(0)).toBe("evening");
    expect(greetingKey(4)).toBe("evening");
  });

  it("normalisiert Ausreisser-Stunden", () => {
    expect(greetingKey(29)).toBe("morning");
    expect(greetingKey(-1)).toBe("evening");
  });
});

describe("firstNameOf", () => {
  it("liefert das erste Wort des Anzeigenamens", () => {
    expect(firstNameOf("Stefan Gross")).toBe("Stefan");
    expect(firstNameOf("  Anna  ")).toBe("Anna");
  });

  it("liefert null für leere Namen", () => {
    expect(firstNameOf("")).toBeNull();
    expect(firstNameOf("   ")).toBeNull();
    expect(firstNameOf(null)).toBeNull();
    expect(firstNameOf(undefined)).toBeNull();
  });
});
