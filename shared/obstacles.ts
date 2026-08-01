/**
 * Hindernis-Logik für den Sonnenstand-Kompass: Bäume, Berge oder Gebäude
 * verdecken einen Richtungs-Sektor bis zu einer bestimmten Höhe über dem Horizont.
 * Reine Funktionen, damit sie serverseitig testbar sind.
 */

export interface ObstacleShape {
  /** Richtung zur Mitte des Hindernisses in Grad (0 = Nord, 90 = Ost) */
  azimuth: number;
  /** Breite des Sektors in Grad */
  width: number;
  /** Höhenwinkel der Oberkante in Grad über dem Horizont */
  height: number;
}

/** Kürzeste Winkeldifferenz zwischen zwei Azimuten (Ergebnis 0–180°). */
export function angleDiff(a: number, b: number): number {
  return Math.abs(((a - b + 540) % 360) - 180);
}

/** Prüft, ob die Sonne an gegebener Position hinter einem der Hindernisse steht. */
export function isBlocked(
  azimuth: number,
  altitude: number,
  obstacles: ObstacleShape[]
): boolean {
  return obstacles.some(
    o => angleDiff(azimuth, o.azimuth) <= o.width / 2 && altitude <= o.height
  );
}
