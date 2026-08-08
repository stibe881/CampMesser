/**
 * Die Lagerfeuer-Ampel (#389).
 *
 * WAS FEHLTE: Drei Quellen waren da und keine kannte die andere – die
 * amtliche Waldbrand-Gefahrenstufe (#4), die Verbots-Schwelle aus der
 * Kantonsübersicht (#263) und die Windböen aus der Prognose. Die Frage
 * am Abend ist aber eine einzige: «Können wir heute Feuer machen?»
 * Bisher musste man sie sich aus drei Modulen zusammenlesen.
 *
 * DIE AMPEL SAGT «SPRICHT NICHTS DAGEGEN», NIE «ERLAUBT». Die
 * Gefahrenstufe ist eine Einschätzung des Bundes, das Verbot eine
 * Verfügung von Kanton oder Gemeinde, und was auf der Tafel an der
 * Rezeption steht, kann keine App wissen. Deshalb ist das beste Urteil
 * hier «ok» mit dem Satz, dass die Platzordnung das letzte Wort hat –
 * und der Link zum amtlichen Portal bleibt daneben.
 *
 * WIND ZÄHLT ÜBER DIE BÖEN, aus demselben Grund wie beim Trockenfenster
 * (#384): Der Funke fliegt in der Böe, nicht im Mittelwert. Ab
 * SPARK_GUSTS fliegt Funkenflug ins Trockene nebenan, ab NO_FIRE_GUSTS
 * ist offenes Feuer schlicht keine gute Idee mehr – egal wie feucht der
 * Boden ist.
 *
 * WAS FEHLT, WIRD GESAGT: Ausserhalb der Schweiz gibt es keine
 * Gefahrenstufe. Dann urteilt die Ampel nur über den Wind und sagt
 * dazu, dass die halbe Rechnung fehlt – ein grünes Licht aus halben
 * Daten wäre eine Zusage, die niemand geben kann.
 */
import { BAN_LIKELY_FROM_LEVEL } from "./fireBans";

/** Ab hier trägt die Böe Funken ins Trockene nebenan. */
export const SPARK_GUSTS_KMH = 30;
/** Ab hier ist offenes Feuer keine gute Idee mehr, egal wie feucht es ist. */
export const NO_FIRE_GUSTS_KMH = 45;

export type CampfireState = "no" | "caution" | "ok" | "unknown";

export interface CampfireVerdict {
  state: CampfireState;
  /** Verbot wahrscheinlich (amtliche Stufe ≥ BAN_LIKELY_FROM_LEVEL). */
  banLikely: boolean;
  /** Erhöhte Waldbrandgefahr (Stufe 3). */
  elevatedDanger: boolean;
  /** Böen über der Funkenflug-Schwelle. */
  sparkWind: boolean;
  /** Böen über der Schwelle, ab der Feuer generell keine Idee mehr ist. */
  strongWind: boolean;
  /** Lag überhaupt eine Gefahrenstufe vor? (Nur in der Schweiz.) */
  dangerKnown: boolean;
  /** Lag überhaupt ein Windwert vor? */
  windKnown: boolean;
}

/**
 * Das Urteil bilden.
 *
 * DAS SCHLECHTESTE ARGUMENT GEWINNT: Ein Verbot schlägt alles, dann der
 * starke Wind, dann die Vorsichts-Gründe. Zwei Vorsichts-Gründe werden
 * nicht zu einem Verbot aufaddiert – die Ampel soll begründbar bleiben,
 * nicht dramatisch.
 */
export function campfireVerdict(input: {
  /** Amtliche Gefahrenstufe 1–5; null = unbekannt (ausserhalb CH). */
  dangerLevel: number | null;
  /** Höchste erwartete Böe heute in km/h; null = keine Prognose. */
  gustsMaxKmh: number | null;
}): CampfireVerdict {
  const dangerKnown =
    input.dangerLevel !== null && Number.isFinite(input.dangerLevel);
  const windKnown =
    input.gustsMaxKmh !== null && Number.isFinite(input.gustsMaxKmh);
  const level = dangerKnown ? (input.dangerLevel as number) : 0;
  const gusts = windKnown ? (input.gustsMaxKmh as number) : 0;

  const banLikely = dangerKnown && level >= BAN_LIKELY_FROM_LEVEL;
  const elevatedDanger = dangerKnown && level === 3;
  const strongWind = windKnown && gusts >= NO_FIRE_GUSTS_KMH;
  const sparkWind = windKnown && !strongWind && gusts >= SPARK_GUSTS_KMH;

  let state: CampfireState;
  if (!dangerKnown && !windKnown) state = "unknown";
  else if (banLikely || strongWind) state = "no";
  else if (elevatedDanger || sparkWind || !dangerKnown) {
    // «!dangerKnown»: Ohne Gefahrenstufe (ausserhalb der Schweiz) gibt
    // es kein Grün – die halbe Rechnung reicht für eine Warnung, aber
    // nicht für eine Entwarnung.
    state = "caution";
  } else state = "ok";

  return {
    state,
    banLikely,
    elevatedDanger,
    sparkWind,
    strongWind,
    dangerKnown,
    windKnown,
  };
}
