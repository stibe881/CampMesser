import { describe, expect, it } from "vitest";
import { angleDiff, isBlocked } from "../shared/obstacles";

describe("angleDiff", () => {
  it("berechnet einfache Differenzen", () => {
    expect(angleDiff(180, 170)).toBe(10);
    expect(angleDiff(170, 180)).toBe(10);
  });

  it("behandelt den Nord-Übergang (359° vs. 1°)", () => {
    expect(angleDiff(359, 1)).toBe(2);
    expect(angleDiff(350, 10)).toBe(20);
  });

  it("liefert maximal 180°", () => {
    expect(angleDiff(0, 180)).toBe(180);
  });
});

describe("isBlocked", () => {
  const wallSouth = [{ azimuth: 180, width: 40, height: 30 }];

  it("blockiert Sonne tief im Süden hinter der Wand", () => {
    expect(isBlocked(180, 20, wallSouth)).toBe(true);
    expect(isBlocked(195, 29, wallSouth)).toBe(true);
  });

  it("blockiert nicht, wenn die Sonne über dem Hindernis steht", () => {
    expect(isBlocked(180, 31, wallSouth)).toBe(false);
  });

  it("blockiert nicht ausserhalb des Sektors", () => {
    expect(isBlocked(220, 10, wallSouth)).toBe(false);
    expect(isBlocked(90, 10, wallSouth)).toBe(false);
  });

  it("funktioniert über den Nord-Übergang hinweg", () => {
    const northTree = [{ azimuth: 0, width: 30, height: 25 }];
    expect(isBlocked(350, 10, northTree)).toBe(true);
    expect(isBlocked(10, 10, northTree)).toBe(true);
    expect(isBlocked(20, 10, northTree)).toBe(false);
  });

  it("gibt false bei leerer Hindernis-Liste", () => {
    expect(isBlocked(180, 5, [])).toBe(false);
  });
});
