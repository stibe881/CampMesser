/**
 * Wasserwaagen-Logik: Übersetzung der DeviceOrientation-Winkel (beta/gamma)
 * in Bildschirm-bezogene Neigung, Libellen-Position und Unterleg-Tipps.
 * Reine Funktionen – testbar ohne Sensor.
 *
 * Semantik (Gerät flach, Display nach oben, natürliche Ausrichtung):
 * - pitch > 0: obere Kante («vorne») ist höher
 * - roll  > 0: rechte Kante ist höher
 */

export interface Tilt {
  pitch: number;
  roll: number;
}

/**
 * Geräte-Winkel in Bildschirm-Koordinaten umrechnen. beta/gamma beziehen sich
 * auf die natürliche Geräte-Ausrichtung; ist der Bildschirm gedreht
 * (screen.orientation.angle 90/180/270), müssen die Achsen mitdrehen, damit
 * «links/rechts/vorne/hinten» zur Anzeige passt.
 */
export function screenTilt(beta: number, gamma: number, screenAngle: number): Tilt {
  const a = ((Math.round(screenAngle) % 360) + 360) % 360;
  // Achsen-Remap für gedrehte Bildschirme (übliche Transformation β'/γ'),
  // danach Vorzeichen-Konvention: pitch = β', roll = −γ'
  switch (a) {
    case 90:
      return { pitch: gamma, roll: beta };
    case 180:
      return { pitch: -beta, roll: gamma };
    case 270:
      return { pitch: -gamma, roll: -beta };
    default:
      return { pitch: beta, roll: -gamma };
  }
}

/**
 * Position der Luftblase in der Libelle (−1…1 je Achse). Die Blase wandert
 * zur höheren Seite: x > 0 = rechts, y > 0 = zur oberen Kante.
 */
export function bubblePosition(tilt: Tilt, maxDeg = 10): { x: number; y: number } {
  const clamp = (v: number) => Math.max(-1, Math.min(1, v / maxDeg));
  return { x: clamp(tilt.roll), y: clamp(tilt.pitch) };
}

export interface LevelAdvice {
  /** Innerhalb der Toleranz in beiden Achsen? */
  level: boolean;
  /** Konkrete Unterleg-Tipps (leer, wenn in Waage) */
  tips: string[];
}

function fmtDeg(v: number): string {
  return Math.abs(v).toFixed(1).replace(".", ",");
}

/** Unterleg-Tipps aus der Neigung ableiten (Standard-Toleranz 0,4°). */
export function levelingAdvice(tilt: Tilt, threshold = 0.4): LevelAdvice {
  const tips: string[] = [];
  if (tilt.pitch > threshold) {
    tips.push(`Vorne ist ${fmtDeg(tilt.pitch)}° höher – lege hinten unter.`);
  } else if (tilt.pitch < -threshold) {
    tips.push(`Hinten ist ${fmtDeg(tilt.pitch)}° höher – lege vorne unter.`);
  }
  if (tilt.roll > threshold) {
    tips.push(`Rechts ist ${fmtDeg(tilt.roll)}° höher – lege links unter.`);
  } else if (tilt.roll < -threshold) {
    tips.push(`Links ist ${fmtDeg(tilt.roll)}° höher – lege rechts unter.`);
  }
  return { level: tips.length === 0, tips };
}
