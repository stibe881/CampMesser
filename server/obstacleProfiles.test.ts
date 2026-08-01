import { describe, expect, it } from "vitest";
import {
  emptyProfiles,
  getProfileObstacles,
  normalizeProfiles,
  withProfileObstacles,
  type Obstacle,
} from "@shared/obstacleProfiles";

const tree: Obstacle = { id: "1", kind: "baum", azimuth: 120, width: 30, height: 25 };
const hill: Obstacle = { id: "2", kind: "berg", azimuth: 250, width: 60, height: 15 };

describe("normalizeProfiles", () => {
  it("migriert die alte Array-Form ins globale Profil", () => {
    expect(normalizeProfiles([tree])).toEqual({ global: [tree], spots: {} });
  });

  it("übernimmt die neue Profil-Form und filtert Müll heraus", () => {
    const result = normalizeProfiles({
      global: [tree, null, { kaputt: true }],
      spots: { "7": [hill], "9": [], "11": "quatsch" },
    });
    expect(result).toEqual({ global: [tree], spots: { "7": [hill] } });
  });

  it("gibt null für unbrauchbare Werte zurück", () => {
    expect(normalizeProfiles(null)).toBeNull();
    expect(normalizeProfiles("text")).toBeNull();
    expect(normalizeProfiles({ irgendwas: 1 })).toBeNull();
  });
});

describe("getProfileObstacles / withProfileObstacles", () => {
  const profiles = { global: [tree], spots: { "7": [hill] } };

  it("liefert das globale Profil ohne Platz-Auswahl", () => {
    expect(getProfileObstacles(profiles, null)).toEqual([tree]);
  });

  it("liefert das Platz-Profil bzw. leer, wenn keines existiert", () => {
    expect(getProfileObstacles(profiles, 7)).toEqual([hill]);
    expect(getProfileObstacles(profiles, 99)).toEqual([]);
  });

  it("ersetzt das globale Profil, ohne Platz-Profile anzufassen", () => {
    const next = withProfileObstacles(profiles, null, [hill]);
    expect(next.global).toEqual([hill]);
    expect(next.spots).toEqual({ "7": [hill] });
  });

  it("legt Platz-Profile an und entfernt leere wieder", () => {
    const added = withProfileObstacles(emptyProfiles(), 7, [tree]);
    expect(added.spots).toEqual({ "7": [tree] });
    const removed = withProfileObstacles(added, 7, []);
    expect(removed.spots).toEqual({});
  });
});
