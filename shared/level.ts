/**
 * Wasserwaagen-Logik: Übersetzung der DeviceOrientation-Winkel (beta/gamma)
 * in Bildschirm-bezogene Neigung, Libellen-Position und Unterleg-Tipps.
 * Reine Funktionen – testbar ohne Sensor.
 *
 * Semantik (Gerät flach, Display nach oben, natürliche Ausrichtung):
 * - pitch > 0: obere Kante («vorne») ist höher
 * - roll  > 0: rechte Kante ist höher
 *
 * Anzeigetexte (Unterleg-Tipps) sind vollständig übersetzt; Default-Sprache
 * bleibt Deutsch, damit bestehende Aufrufer unverändert funktionieren.
 */

import { pick, type L4, type Language } from "./i18n";

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
export function screenTilt(
  beta: number,
  gamma: number,
  screenAngle: number
): Tilt {
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
export function bubblePosition(
  tilt: Tilt,
  maxDeg = 10
): { x: number; y: number } {
  const clamp = (v: number) => Math.max(-1, Math.min(1, v / maxDeg));
  return { x: clamp(tilt.roll), y: clamp(tilt.pitch) };
}

export interface LevelAdvice {
  /** Innerhalb der Toleranz in beiden Achsen? */
  level: boolean;
  /** Konkrete Unterleg-Tipps (leer, wenn in Waage) */
  tips: string[];
}

/** Grad-Wert formatieren (Dezimal-Komma ausser im Englischen). */
function fmtDeg(v: number, lang: Language): string {
  const fixed = Math.abs(v).toFixed(1);
  return lang === "en" ? fixed : fixed.replace(".", ",");
}

/** Unterleg-Tipp-Texte: {deg} wird durch den formatierten Winkel ersetzt. */
const TIP_TEXTS: Record<
  "frontHigher" | "backHigher" | "rightHigher" | "leftHigher",
  L4
> = {
  frontHigher: {
    de: "Vorne ist {deg}° höher – lege hinten unter.",
    fr: "L'avant est plus haut de {deg}° – cale à l'arrière.",
    it: "Il lato anteriore è più alto di {deg}° – metti spessori dietro.",
    en: "The front is {deg}° higher – place shims at the back.",
  },
  backHigher: {
    de: "Hinten ist {deg}° höher – lege vorne unter.",
    fr: "L'arrière est plus haut de {deg}° – cale à l'avant.",
    it: "Il lato posteriore è più alto di {deg}° – metti spessori davanti.",
    en: "The back is {deg}° higher – place shims at the front.",
  },
  rightHigher: {
    de: "Rechts ist {deg}° höher – lege links unter.",
    fr: "La droite est plus haute de {deg}° – cale à gauche.",
    it: "Il lato destro è più alto di {deg}° – metti spessori a sinistra.",
    en: "The right side is {deg}° higher – place shims on the left.",
  },
  leftHigher: {
    de: "Links ist {deg}° höher – lege rechts unter.",
    fr: "La gauche est plus haute de {deg}° – cale à droite.",
    it: "Il lato sinistro è più alto di {deg}° – metti spessori a destra.",
    en: "The left side is {deg}° higher – place shims on the right.",
  },
};

function tipText(
  key: keyof typeof TIP_TEXTS,
  deg: number,
  lang: Language
): string {
  return pick(TIP_TEXTS[key], lang).replace("{deg}", fmtDeg(deg, lang));
}

/** Unterleg-Tipps aus der Neigung ableiten (Standard-Toleranz 0,4°). */
export function levelingAdvice(
  tilt: Tilt,
  threshold = 0.4,
  lang: Language = "de"
): LevelAdvice {
  const tips: string[] = [];
  if (tilt.pitch > threshold) {
    tips.push(tipText("frontHigher", tilt.pitch, lang));
  } else if (tilt.pitch < -threshold) {
    tips.push(tipText("backHigher", tilt.pitch, lang));
  }
  if (tilt.roll > threshold) {
    tips.push(tipText("rightHigher", tilt.roll, lang));
  } else if (tilt.roll < -threshold) {
    tips.push(tipText("leftHigher", tilt.roll, lang));
  }
  return { level: tips.length === 0, tips };
}
