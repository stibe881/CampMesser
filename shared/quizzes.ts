/**
 * Eigene Quizze: Fragen-Format und sichere JSON-Übersetzung.
 * Reine Funktionen – von Client, Server und Tests genutzt (Muster shared/hunts.ts).
 */

export interface CustomQuizQuestion {
  /** Die Frage, z. B. «Welcher Baum verliert im Winter seine Nadeln?» */
  question: string;
  /** Antwortmöglichkeiten (2–4) */
  options: string[];
  /** Index der richtigen Antwort innerhalb von options */
  correctIndex: number;
  /** Optionale Erklärung, die nach dem Antworten angezeigt wird */
  explanation?: string;
}

export const MAX_QUIZ_QUESTIONS = 30;
export const MIN_QUIZ_OPTIONS = 2;
export const MAX_QUIZ_OPTIONS = 4;

/** Fragen-JSON aus der Datenbank sicher in Quiz-Fragen übersetzen. */
export function parseQuizQuestions(json: string): CustomQuizQuestion[] {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    const questions: CustomQuizQuestion[] = [];
    parsed.forEach(q => {
      if (questions.length >= MAX_QUIZ_QUESTIONS) return;
      if (!q || typeof q.question !== "string" || !q.question.trim()) return;
      if (!Array.isArray(q.options)) return;
      const options = q.options
        .filter(
          (o: unknown): o is string => typeof o === "string" && o.trim() !== ""
        )
        .slice(0, MAX_QUIZ_OPTIONS);
      if (options.length < MIN_QUIZ_OPTIONS) return;
      if (
        typeof q.correctIndex !== "number" ||
        !Number.isInteger(q.correctIndex) ||
        q.correctIndex < 0 ||
        q.correctIndex >= options.length
      )
        return;
      questions.push({
        question: q.question,
        options,
        correctIndex: q.correctIndex,
        explanation:
          typeof q.explanation === "string" && q.explanation.trim()
            ? q.explanation
            : undefined,
      });
    });
    return questions;
  } catch {
    return [];
  }
}
