/**
 * Eigene Quizze: Abbildung der Datenbank-Zeilen auf das NatureQuiz-Format,
 * damit der bestehende Quiz-Player sie genauso wie die eingebauten Quizze
 * verwenden kann (eigene Quizze sind einsprachige Strings – pick() verarbeitet
 * beides; Muster client/src/lib/customHunts.ts).
 */
import type { NatureQuiz } from "@/data/familyActivities";
import { l4 } from "@shared/i18n";
import { parseQuizQuestions } from "@shared/quizzes";

export interface CustomQuizRow {
  id: number;
  title: string;
  questionsJson: string;
}

/** Präfix der Player-IDs eigener Quizze (z. B. «eigenes-quiz-7»). */
export const CUSTOM_QUIZ_ID_PREFIX = "eigenes-quiz-";

export function customQuizToNatureQuiz(row: CustomQuizRow): NatureQuiz {
  return {
    id: `${CUSTOM_QUIZ_ID_PREFIX}${row.id}`,
    title: row.title,
    ageHint: l4(
      "selbst erstellt",
      "création maison",
      "creato da te",
      "self-made"
    ),
    questions: parseQuizQuestions(row.questionsJson).map(q => ({
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation ?? "",
    })),
  };
}
