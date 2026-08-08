/**
 * Belohnungs-Ziele im Familien-Modus (#399, Nutzerwunsch 07.08.2026).
 *
 * DIE PUNKTE HATTEN KEINEN ZWECK: Der Ämtli-Plan (#270) zählt sie, die
 * Rangliste zeigt sie – aber man konnte nichts damit MACHEN. Ein Ziel
 * («Glacé am Kiosk – 20 Punkte») macht aus der Tabelle einen Anreiz:
 * Das Kind sieht, wie weit es noch ist, und löst ein, wenn es reicht.
 *
 * EINGELÖST WIRD MIT SCHNAPPSCHUSS: Die Einlösung speichert Titel und
 * Punkte selbst, nicht nur einen Verweis – das Ziel darf später teurer
 * werden oder verschwinden, ohne dass sich die Geschichte umschreibt.
 *
 * VERFÜGBAR = VERDIENT − EINGELÖST, nie unter null angezeigt, aber die
 * Einlösung prüft gegen den ECHTEN Stand: Wer 18 Punkte hat, löst kein
 * 20-Punkte-Glacé ein – sonst wäre das Sparen darauf sinnlos gewesen.
 */

export const MAX_REWARDS = 12;
export const REWARD_TITLE_MAX_LENGTH = 80;
export const MIN_REWARD_POINTS = 1;
/** Mehr Punkte sammelt kein Kind in einem Camping-Sommer. */
export const MAX_REWARD_POINTS = 500;

/** Punkte-Preis auf den erlaubten Bereich bringen. */
export function clampRewardPoints(points: number): number {
  if (!Number.isFinite(points)) return MIN_REWARD_POINTS;
  return Math.max(
    MIN_REWARD_POINTS,
    Math.min(MAX_REWARD_POINTS, Math.round(points))
  );
}

export interface RedemptionLike {
  childId: number;
  points: number;
}

/** Bereits eingelöste Punkte eines Kindes. */
export function spentPoints(
  redemptions: readonly RedemptionLike[],
  childId: number
): number {
  return redemptions
    .filter(r => r.childId === childId)
    .reduce((sum, r) => sum + Math.max(0, r.points), 0);
}

/** Was zum Einlösen übrig ist: verdient minus eingelöst, nie negativ. */
export function availablePoints(
  earnedPoints: number,
  redemptions: readonly RedemptionLike[],
  childId: number
): number {
  return Math.max(
    0,
    Math.max(0, earnedPoints) - spentPoints(redemptions, childId)
  );
}

/** Reicht der Stand für dieses Ziel? */
export function canRedeem(
  earnedPoints: number,
  redemptions: readonly RedemptionLike[],
  childId: number,
  rewardPoints: number
): boolean {
  return availablePoints(earnedPoints, redemptions, childId) >= rewardPoints;
}

export interface RewardLike {
  title: string;
  points: number;
}

/**
 * Welche Ziele durch einen Punkte-Zuwachs GERADE erreichbar wurden (#413).
 *
 * Der Moment, in dem der Balken voll wird, passierte stumm: Das Kind
 * hakt ein Ämtli ab, und niemand merkt, dass jetzt das Glacé drin
 * liegt. Gemeldet wird nur der ÜBERGANG – Ziele, die vorher schon
 * erreichbar waren, melden sich nicht bei jedem weiteren Ämtli neu.
 */
export function newlyReachableRewards<T extends RewardLike>(
  rewards: readonly T[],
  redemptions: readonly RedemptionLike[],
  childId: number,
  earnedBefore: number,
  earnedAfter: number
): T[] {
  const before = availablePoints(earnedBefore, redemptions, childId);
  const after = availablePoints(earnedAfter, redemptions, childId);
  if (after <= before) return [];
  return rewards.filter(
    reward =>
      reward.points > 0 && before < reward.points && after >= reward.points
  );
}

/** Fortschritt zu einem Ziel in Prozent (gedeckelt bei 100). */
export function rewardProgress(
  available: number,
  rewardPoints: number
): number {
  if (rewardPoints <= 0) return 100;
  return Math.min(
    100,
    Math.round((Math.max(0, available) / rewardPoints) * 100)
  );
}
