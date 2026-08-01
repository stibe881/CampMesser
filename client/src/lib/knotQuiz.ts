/**
 * Knoten-Quiz: baut aus der Knoten-Bibliothek Karteikarten-Fragen
 * («Situation → welcher Knoten?»). RNG ist injizierbar, damit die Logik
 * deterministisch testbar bleibt.
 */
import type { Knot } from "@/data/knots";

export interface KnotQuizQuestion {
  /** Die Situation, z. B. «Tarp zwischen zwei Bäumen spannen» */
  prompt: string;
  /** Antwort-Optionen (Knotennamen) */
  options: string[];
  correctIndex: number;
  /** Der gesuchte Knoten – für Erklärung und Profi-Tipp */
  knotId: string;
  knotName: string;
  proTip: string;
}

function shuffle<T>(list: T[], rng: () => number): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Quiz aus den Knoten-Daten bauen: eine Frage pro Knoten, max. `count`. */
export function buildKnotQuiz(
  all: Knot[],
  count = 8,
  rng: () => number = Math.random
): KnotQuizQuestion[] {
  if (all.length < 4) return [];
  return shuffle(all, rng)
    .slice(0, count)
    .map(knot => {
      // Situation abwechselnd aus dem Camping-Einsatz oder dem Anwendungsfall
      const prompt = rng() < 0.5 ? knot.campingUse : knot.useCase;
      const wrong = shuffle(
        all.filter(k => k.id !== knot.id),
        rng
      )
        .slice(0, 3)
        .map(k => k.name);
      const options = shuffle([knot.name, ...wrong], rng);
      return {
        prompt,
        options,
        correctIndex: options.indexOf(knot.name),
        knotId: knot.id,
        knotName: knot.name,
        proTip: knot.proTip,
      };
    });
}
