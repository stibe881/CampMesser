/**
 * Länder-Quiz für Kinder (#642): baut aus dem Länder-Nachschlagewerk
 * (#228, client/src/data/roadRules.ts) automatisch Flaggen-Fragen – so
 * wächst das Quiz mit jedem neuen Land mit, ohne dass Fragen von Hand
 * gepflegt werden. Zwei Fragetypen: Flagge → Land und Land → Flagge.
 *
 * Der Zufall ist wie bei client/src/lib/natureQuiz.ts injizierbar, damit
 * die Logik deterministisch testbar bleibt.
 */
import { roadRules, type CountryRules } from "@/data/roadRules";
import { l4, pick, type L4, type Language } from "@shared/i18n";
import type { QuizQuestion } from "@/data/familyActivities";

export const COUNTRY_QUIZ_OPTIONS = 3;
export const COUNTRY_QUIZ_QUESTIONS = 8;

const Q_FLAG: L4 = l4(
  "Zu welchem Land gehört die Flagge {flag}?",
  "À quel pays appartient le drapeau {flag} ?",
  "A quale paese appartiene la bandiera {flag}?",
  "Which country does the flag {flag} belong to?"
);
const Q_NAME: L4 = l4(
  "Welche Flagge gehört zu {name}?",
  "Quel drapeau appartient à {name} ?",
  "Quale bandiera appartiene a {name}?",
  "Which flag belongs to {name}?"
);
const E_ANSWER: L4 = l4(
  "{flag} ist die Flagge von {name}.",
  "{flag} est le drapeau de {name}.",
  "{flag} è la bandiera di {name}.",
  "{flag} is the flag of {name}."
);

/** Platzhalter ersetzen (kein Regex – Namen dürfen alles enthalten). */
function fill(template: string, values: Record<string, string>): string {
  let out = template;
  Object.keys(values).forEach(key => {
    out = out.split(`{${key}}`).join(values[key]);
  });
  return out.trim();
}

/** Fisher-Yates mit injizierbarem Zufall. */
function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Länder-Quiz würfeln: pro Land höchstens eine Frage, Typ wechselt ab.
 * Falsch-Antworten kommen aus den übrigen Ländern des Nachschlagewerks.
 */
export function buildCountryQuiz(
  lang: Language,
  random: () => number = Math.random,
  countries: readonly CountryRules[] = roadRules
): QuizQuestion[] {
  if (countries.length < COUNTRY_QUIZ_OPTIONS) return [];
  const picked = shuffle(countries, random).slice(0, COUNTRY_QUIZ_QUESTIONS);
  return picked.map((country, index) => {
    const others = shuffle(
      countries.filter(entry => entry.code !== country.code),
      random
    ).slice(0, COUNTRY_QUIZ_OPTIONS - 1);
    const pool = shuffle([country, ...others], random);
    const correctIndex = pool.findIndex(entry => entry.code === country.code);
    const name = pick(country.name, lang);
    const explanation = fill(pick(E_ANSWER, lang), {
      flag: country.flag,
      name,
    });
    // Typ wechselt ab: Flagge → Land, dann Land → Flagge
    if (index % 2 === 0) {
      return {
        question: fill(pick(Q_FLAG, lang), { flag: country.flag }),
        options: pool.map(entry => pick(entry.name, lang)),
        correctIndex,
        explanation,
      };
    }
    return {
      question: fill(pick(Q_NAME, lang), { name }),
      options: pool.map(entry => entry.flag),
      correctIndex,
      explanation,
    };
  });
}
