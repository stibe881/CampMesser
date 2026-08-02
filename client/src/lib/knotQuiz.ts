/**
 * Knoten-Quiz: baut aus der Knoten-Bibliothek Karteikarten-Fragen
 * («Situation → welcher Knoten?»). RNG ist injizierbar, damit die Logik
 * deterministisch testbar bleibt. Alle Texte werden in der gewünschten
 * Sprache aus den L4-Daten gepickt (Default Deutsch).
 */
import type { Knot } from "@/data/knots";
import { pick, type Language } from "@shared/i18n";

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
  rng: () => number = Math.random,
  lang: Language = "de"
): KnotQuizQuestion[] {
  if (all.length < 4) return [];
  return shuffle(all, rng)
    .slice(0, count)
    .map(knot => {
      // Situation abwechselnd aus dem Camping-Einsatz oder dem Anwendungsfall
      const prompt = pick(rng() < 0.5 ? knot.campingUse : knot.useCase, lang);
      const wrong = shuffle(
        all.filter(k => k.id !== knot.id),
        rng
      )
        .slice(0, 3)
        .map(k => pick(k.name, lang));
      const name = pick(knot.name, lang);
      const options = shuffle([name, ...wrong], rng);
      return {
        prompt,
        options,
        correctIndex: options.indexOf(name),
        knotId: knot.id,
        knotName: name,
        proTip: pick(knot.proTip, lang),
      };
    });
}
