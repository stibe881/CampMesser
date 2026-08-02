/**
 * Winkel-Glättung für den Geräte-Kompass: Sensor-Werte zappeln, ein
 * gewöhnlicher gleitender Mittelwert über Gradzahlen scheitert aber am
 * Umschlag bei 0°/360° (359° → 1° dürfte nie über 180° «mitteln»).
 * Deshalb wird über die Einheitsvektoren gemittelt: sin/cos gewichtet
 * mischen, per atan2 zurück in einen Winkel – wrap-around-sicher.
 */

/** Glättungsfaktor des exponentiellen Mittels (Anteil des neuen Werts). */
export const HEADING_SMOOTHING_ALPHA = 0.2;

/**
 * Winkel in den Bereich [0, 360) bringen (auch negative Werte).
 * Doppeltes Modulo statt `n < 0 ? n + 360 : n`: bei winzig negativen
 * Werten (z. B. -1e-16 aus atan2) würde die Addition sonst durch
 * Gleitkomma-Rundung exakt 360 liefern.
 */
export function normalizeHeading(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

/**
 * Exponentiell gleitender Mittelwert über Winkel (wrap-around-sicher).
 * `prev` ist der bisher geglättete Wert (null = erster Messwert, wird
 * unverändert übernommen), `next` der neue Sensor-Wert, `alpha` das
 * Gewicht des neuen Werts (0..1). Heben sich die beiden Richtungen
 * praktisch auf (entgegengesetzte Vektoren), gewinnt der neue Wert.
 */
export function smoothHeading(
  prev: number | null,
  next: number,
  alpha: number = HEADING_SMOOTHING_ALPHA
): number {
  if (prev === null) return normalizeHeading(next);
  const weight = Math.min(1, Math.max(0, alpha));
  const prevRad = (prev * Math.PI) / 180;
  const nextRad = (next * Math.PI) / 180;
  const x = (1 - weight) * Math.cos(prevRad) + weight * Math.cos(nextRad);
  const y = (1 - weight) * Math.sin(prevRad) + weight * Math.sin(nextRad);
  // Degenerierter Fall: Vektoren löschen sich aus (z. B. 0° vs. 180° bei
  // alpha 0.5) – atan2(0, 0) wäre willkürlich, also den neuen Wert nehmen.
  if (Math.hypot(x, y) < 1e-9) return normalizeHeading(next);
  return normalizeHeading((Math.atan2(y, x) * 180) / Math.PI);
}
