/**
 * Die Heimkehr-Karte: die Rückkehr an einem Ort (#410).
 *
 * NACH DER HEIMKEHR KLOPFTE BIS ZU VIERERLEI EINZELN AN: die
 * Trocknungs-Erinnerung (#89), der Sterne-/Packlisten-Rückblick
 * (#390/#381) – und der «Beim nächsten Mal»-Merker (#396) will genau in
 * diesem Moment gefüllt werden, nicht drei Monate später im Dossier.
 * Eine Karte bündelt das als kleine Abhak-Folge und verschwindet, wenn
 * alles erledigt ist.
 *
 * WELCHE REISE dran ist, entscheidet weiterhin `reviewCandidate`
 * (shared/reviewPrompt.ts): jüngste Abreise, Fenster von
 * REVIEW_PROMPT_DAYS Tagen, nur eigene Reisen, Wegklicken je Reise.
 * Nur das «schon beantwortet»-Kriterium fällt hier weg – beantwortet
 * ist die Heimkehr erst, wenn ALLE Schritte erledigt sind.
 */

export type HomecomingStepKey = "tent" | "review" | "nextTime";

export interface HomecomingStep {
  key: HomecomingStepKey;
  done: boolean;
}

export interface HomecomingInputs {
  /** Zelt/Planen als trocken abgehakt – von Hand, das weiss keine App. */
  tentDone: boolean;
  /** Packlisten-Rückblick (#381) zu dieser Reise gespeichert. */
  hasReview: boolean;
  /** Verknüpfter Platz – ohne ihn gibt es keinen Merker-Schritt. */
  spotId: number | null;
  /** Anzahl «Beim nächsten Mal»-Notizen am Platz. */
  nextTimeCount: number;
}

/**
 * Die Schrittliste der Karte. Der Merker-Schritt erscheint nur mit
 * verknüpftem Platz – ein Schritt, der nirgends hinführt, wäre eine
 * Aufgabe ohne Tür.
 */
export function homecomingSteps(inputs: HomecomingInputs): HomecomingStep[] {
  const steps: HomecomingStep[] = [
    { key: "tent", done: inputs.tentDone },
    { key: "review", done: inputs.hasReview },
  ];
  if (inputs.spotId !== null) {
    steps.push({ key: "nextTime", done: inputs.nextTimeCount > 0 });
  }
  return steps;
}

/** Alles erledigt? Dann hat die Karte nichts mehr zu sagen. */
export function homecomingDone(steps: readonly HomecomingStep[]): boolean {
  return steps.every(step => step.done);
}
