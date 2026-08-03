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

/**
 * Fahrzeug-/Unterkunfts-Profil: bestimmt, wie genau es sein muss und wie die
 * Unterleg-Tipps formuliert sind. Beim Zelt reicht eine grobe Ebene, ein
 * Wohnwagen mit Absorber-Kühlschrank will es dagegen sehr genau.
 */
export type LevelProfile = "tent" | "bus" | "caravan";

/** Alle Profile in Anzeige-Reihenfolge (grob → genau). */
export const LEVEL_PROFILES: LevelProfile[] = ["tent", "bus", "caravan"];

/** Toleranz je Profil in Grad. */
export const LEVEL_TOLERANCES: Record<LevelProfile, number> = {
  tent: 1.5,
  bus: 0.8,
  caravan: 0.4,
};

/** Standard-Profil – entspricht der bisherigen Toleranz von 0,4°. */
export const DEFAULT_LEVEL_PROFILE: LevelProfile = "caravan";

/** Unbekannte Werte (localStorage) auf ein gültiges Profil zurückführen. */
export function sanitizeLevelProfile(value: unknown): LevelProfile {
  return LEVEL_PROFILES.indexOf(value as LevelProfile) >= 0
    ? (value as LevelProfile)
    : DEFAULT_LEVEL_PROFILE;
}

/** Grad-Wert formatieren (Dezimal-Komma ausser im Englischen). */
function fmtDeg(v: number, lang: Language): string {
  const fixed = Math.abs(v).toFixed(1);
  return lang === "en" ? fixed : fixed.replace(".", ",");
}

type TipKey = "frontHigher" | "backHigher" | "rightHigher" | "leftHigher";

/**
 * Unterleg-Tipp-Texte je Profil: {deg} wird durch den formatierten Winkel
 * ersetzt. Die Wohnwagen-Texte sind die ursprünglichen (allgemeinen) Tipps und
 * bleiben damit das Standard-Verhalten.
 */
const TIP_TEXTS: Record<LevelProfile, Record<TipKey, L4>> = {
  tent: {
    frontHigher: {
      de: "Vorne ist {deg}° höher – schlaf mit dem Kopf nach vorne oder polstere hinten unter der Matte.",
      fr: "L'avant est plus haut de {deg}° – dors la tête vers l'avant ou rembourre sous le matelas à l'arrière.",
      it: "Il lato anteriore è più alto di {deg}° – dormi con la testa in avanti o imbottisci dietro sotto il materassino.",
      en: "The front is {deg}° higher – sleep with your head towards the front or pad under the mat at the back.",
    },
    backHigher: {
      de: "Hinten ist {deg}° höher – schlaf mit dem Kopf nach hinten oder polstere vorne unter der Matte.",
      fr: "L'arrière est plus haut de {deg}° – dors la tête vers l'arrière ou rembourre sous le matelas à l'avant.",
      it: "Il lato posteriore è più alto di {deg}° – dormi con la testa all'indietro o imbottisci davanti sotto il materassino.",
      en: "The back is {deg}° higher – sleep with your head towards the back or pad under the mat at the front.",
    },
    rightHigher: {
      de: "Rechts ist {deg}° höher – dreh das Zelt quer oder polstere links unter der Matte.",
      fr: "La droite est plus haute de {deg}° – tourne la tente ou rembourre sous le matelas à gauche.",
      it: "Il lato destro è più alto di {deg}° – gira la tenda o imbottisci a sinistra sotto il materassino.",
      en: "The right side is {deg}° higher – turn the tent or pad under the mat on the left.",
    },
    leftHigher: {
      de: "Links ist {deg}° höher – dreh das Zelt quer oder polstere rechts unter der Matte.",
      fr: "La gauche est plus haute de {deg}° – tourne la tente ou rembourre sous le matelas à droite.",
      it: "Il lato sinistro è più alto di {deg}° – gira la tenda o imbottisci a destra sotto il materassino.",
      en: "The left side is {deg}° higher – turn the tent or pad under the mat on the right.",
    },
  },
  bus: {
    frontHigher: {
      de: "Vorne ist {deg}° höher – fahr mit den Hinterrädern auf Keile.",
      fr: "L'avant est plus haut de {deg}° – monte les roues arrière sur des cales.",
      it: "Il lato anteriore è più alto di {deg}° – sali con le ruote posteriori sui cunei.",
      en: "The front is {deg}° higher – drive the rear wheels onto levelling ramps.",
    },
    backHigher: {
      de: "Hinten ist {deg}° höher – fahr mit den Vorderrädern auf Keile.",
      fr: "L'arrière est plus haut de {deg}° – monte les roues avant sur des cales.",
      it: "Il lato posteriore è più alto di {deg}° – sali con le ruote anteriori sui cunei.",
      en: "The back is {deg}° higher – drive the front wheels onto levelling ramps.",
    },
    rightHigher: {
      de: "Rechts ist {deg}° höher – fahr mit den linken Rädern auf Keile.",
      fr: "La droite est plus haute de {deg}° – monte les roues gauches sur des cales.",
      it: "Il lato destro è più alto di {deg}° – sali con le ruote sinistre sui cunei.",
      en: "The right side is {deg}° higher – drive the left wheels onto levelling ramps.",
    },
    leftHigher: {
      de: "Links ist {deg}° höher – fahr mit den rechten Rädern auf Keile.",
      fr: "La gauche est plus haute de {deg}° – monte les roues droites sur des cales.",
      it: "Il lato sinistro è più alto di {deg}° – sali con le ruote destre sui cunei.",
      en: "The left side is {deg}° higher – drive the right wheels onto levelling ramps.",
    },
  },
  caravan: {
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
  },
};

function tipText(
  profile: LevelProfile,
  key: TipKey,
  deg: number,
  lang: Language
): string {
  return pick(TIP_TEXTS[profile][key], lang).replace(
    "{deg}",
    fmtDeg(deg, lang)
  );
}

/**
 * Unterleg-Tipps aus der Neigung ableiten. Ohne `threshold` gilt die Toleranz
 * des Profils (Standard «caravan» = 0,4°, also das bisherige Verhalten); ein
 * ausdrücklich übergebener Wert hat Vorrang.
 */
export function levelingAdvice(
  tilt: Tilt,
  threshold?: number,
  lang: Language = "de",
  profile: LevelProfile = DEFAULT_LEVEL_PROFILE
): LevelAdvice {
  const limit = threshold ?? LEVEL_TOLERANCES[profile];
  const tips: string[] = [];
  if (tilt.pitch > limit) {
    tips.push(tipText(profile, "frontHigher", tilt.pitch, lang));
  } else if (tilt.pitch < -limit) {
    tips.push(tipText(profile, "backHigher", tilt.pitch, lang));
  }
  if (tilt.roll > limit) {
    tips.push(tipText(profile, "rightHigher", tilt.roll, lang));
  } else if (tilt.roll < -limit) {
    tips.push(tipText(profile, "leftHigher", tilt.roll, lang));
  }
  return { level: tips.length === 0, tips };
}
