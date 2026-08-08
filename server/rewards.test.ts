import { describe, expect, it } from "vitest";
import {
  availablePoints,
  canRedeem,
  clampRewardPoints,
  newlyReachableRewards,
  rewardProgress,
  spentPoints,
} from "@shared/rewards";

/**
 * Belohnungs-Ziele (#399): verdient − eingelöst, und die Einlösung prüft
 * gegen den echten Stand.
 */
describe("Belohnungs-Punkte", () => {
  const redemptions = [
    { childId: 1, points: 10 },
    { childId: 1, points: 5 },
    { childId: 2, points: 20 },
  ];

  it("zählt nur die Einlösungen DIESES Kindes", () => {
    expect(spentPoints(redemptions, 1)).toBe(15);
    expect(spentPoints(redemptions, 2)).toBe(20);
    expect(spentPoints(redemptions, 3)).toBe(0);
  });

  it("verfügbar = verdient − eingelöst, nie negativ", () => {
    expect(availablePoints(40, redemptions, 1)).toBe(25);
    // Punkte können sinken (Ämtli wieder abgehakt) – die Anzeige geht
    // trotzdem nie unter null.
    expect(availablePoints(10, redemptions, 1)).toBe(0);
  });

  it("einlösen geht nur, wenn es wirklich reicht", () => {
    expect(canRedeem(40, redemptions, 1, 25)).toBe(true);
    expect(canRedeem(40, redemptions, 1, 26)).toBe(false);
  });

  it("der Fortschritts-Balken ist bei 100 % gedeckelt", () => {
    expect(rewardProgress(10, 20)).toBe(50);
    expect(rewardProgress(30, 20)).toBe(100);
    expect(rewardProgress(0, 20)).toBe(0);
  });

  it("Preise bleiben im erlaubten Bereich", () => {
    expect(clampRewardPoints(0)).toBe(1);
    expect(clampRewardPoints(9999)).toBe(500);
    expect(clampRewardPoints(20.4)).toBe(20);
    expect(clampRewardPoints(NaN)).toBe(1);
  });

  // #413: Gemeldet wird nur der ÜBERGANG über die Ziel-Schwelle.
  it("meldet ein Ziel genau beim Überschreiten der Schwelle", () => {
    const rewards = [
      { title: "Glacé", points: 20 },
      { title: "Minigolf", points: 50 },
    ];
    // 18 → 21 Punkte: das Glacé wird erreichbar, Minigolf noch nicht.
    expect(newlyReachableRewards(rewards, [], 1, 18, 21)).toEqual([
      { title: "Glacé", points: 20 },
    ]);
    // 21 → 24: das Glacé war schon erreichbar – kein zweites Mal melden.
    expect(newlyReachableRewards(rewards, [], 1, 21, 24)).toEqual([]);
    // Abhaken rückgängig (Punkte sinken): nie melden.
    expect(newlyReachableRewards(rewards, [], 1, 21, 18)).toEqual([]);
  });

  it("rechnet Eingelöstes vor der Schwellen-Prüfung ab", () => {
    const rewards = [{ title: "Glacé", points: 20 }];
    const redemptions = [{ childId: 1, points: 10 }];
    // 25 → 28 verdient, 10 eingelöst: verfügbar 15 → 18, kein Übergang.
    expect(newlyReachableRewards(rewards, redemptions, 1, 25, 28)).toEqual([]);
    // 28 → 31 verdient: verfügbar 18 → 21, jetzt kippt es.
    expect(newlyReachableRewards(rewards, redemptions, 1, 28, 31)).toEqual(
      rewards
    );
  });
});
