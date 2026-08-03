/**
 * Natur-Quiz: baut aus dem Natur-Lexikon automatisch Fragen – so wächst das
 * Quiz mit jedem neuen Lexikon-Eintrag mit, ohne dass Fragen von Hand gepflegt
 * werden müssen. Drei Fragetypen: Beschreibung → Art, Saison einer Art und
 * Bereich (Kategorie) einer Art.
 *
 * Der Zufall ist wie bei client/src/lib/knotQuiz.ts injizierbar, damit die
 * Logik deterministisch testbar bleibt. Alle Texte werden in der gewünschten
 * Sprache aus den L4-Daten gepickt (Default Deutsch).
 */
import { natureCategories, type NatureEntry } from "@/data/nature";
import { l4, pick, LOCALE_TAGS, type L4, type Language } from "@shared/i18n";
import type { Season } from "@shared/season";

/** Fragetypen des generierten Quiz. */
export type NatureQuizType = "description" | "season" | "category";

export interface NatureQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  /** Lexikon-Eintrag, aus dem die Frage stammt (eine Frage pro Eintrag). */
  entryId: string;
  type: NatureQuizType;
}

/** Antwort-Optionen pro Frage – wie bei den eingebauten Natur-Quizzen. */
export const NATURE_QUIZ_OPTIONS = 3;
/** Voreinstellung: so viele Fragen umfasst ein Durchgang. */
export const NATURE_QUIZ_QUESTIONS = 10;
/** Maximale Länge des Beschreibungs-Auszugs in Zeichen. */
const EXCERPT_MAX = 170;

const Q_DESCRIPTION: L4 = l4(
  "Welche Art passt zu dieser Beschreibung?",
  "Quelle espèce correspond à cette description ?",
  "Quale specie corrisponde a questa descrizione?",
  "Which species matches this description?"
);
const Q_SEASON: L4 = l4(
  "Wann ist «{name}» am besten zu sehen?",
  "Quand peut-on le mieux observer « {name} » ?",
  "Quando si osserva al meglio «{name}»?",
  "When is “{name}” best seen?"
);
const Q_CATEGORY: L4 = l4(
  "Zu welchem Bereich gehört «{name}»?",
  "À quel domaine appartient « {name} » ?",
  "A quale ambito appartiene «{name}»?",
  "Which area does “{name}” belong to?"
);
const E_NAME: L4 = l4(
  "Richtig ist «{name}». {fact}",
  "La bonne réponse est « {name} ». {fact}",
  "La risposta giusta è «{name}». {fact}",
  "The correct answer is “{name}”. {fact}"
);
const E_SEASON: L4 = l4(
  "«{name}»: beste Zeit {season}. {fact}",
  "« {name} » : meilleure période {season}. {fact}",
  "«{name}»: periodo migliore {season}. {fact}",
  "“{name}”: best time {season}. {fact}"
);
const E_CATEGORY: L4 = l4(
  "«{name}» gehört zu «{category}». {fact}",
  "« {name} » fait partie de « {category} ». {fact}",
  "«{name}» appartiene a «{category}». {fact}",
  "“{name}” belongs to “{category}”. {fact}"
);

/** Platzhalter im Muster ersetzen (kein Regex – Namen dürfen alles enthalten). */
function fill(template: string, values: Record<string, string>): string {
  let out = template;
  Object.keys(values).forEach(key => {
    out = out.split(`{${key}}`).join(values[key]);
  });
  return out.trim();
}

function shuffle<T>(list: T[], rng: () => number): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Monatsname (1–12) in der gewünschten Sprache, z. B. «Mai». */
function monthName(month: number, lang: Language): string {
  return new Date(Date.UTC(2000, month - 1, 1)).toLocaleDateString(
    LOCALE_TAGS[lang],
    { month: "long", timeZone: "UTC" }
  );
}

/** Saison als Antwort-Text, z. B. «April–Oktober». */
export function seasonLabel(season: Season, lang: Language): string {
  return `${monthName(season.from, lang)}–${monthName(season.to, lang)}`;
}

/**
 * Den Arten-Namen (auch in gebeugter oder zusammengesetzter Form) aus dem
 * Auszug entfernen – sonst verrät «Dachsspuren wirken wie …» die Lösung.
 */
export function maskName(text: string, name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(`\\p{L}*${escaped}\\p{L}*`, "giu"), "…");
}

/** Auszug auf EXCERPT_MAX Zeichen kürzen, an einer Wortgrenze. */
export function excerpt(text: string): string {
  if (text.length <= EXCERPT_MAX) return text;
  const cut = text.slice(0, EXCERPT_MAX);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim()} …`;
}

/**
 * Quiz aus den Lexikon-Daten bauen: höchstens eine Frage pro Eintrag,
 * insgesamt `count` Fragen. Der Fragetyp wird pro Eintrag ausgelost; die
 * Saison-Frage entfällt für Einträge ohne Saison oder wenn zu wenige
 * unterschiedliche Saison-Zeiträume für Falsch-Antworten übrig bleiben.
 */
export function buildNatureQuiz(
  entries: NatureEntry[],
  lang: Language = "de",
  rng: () => number = Math.random,
  count = NATURE_QUIZ_QUESTIONS
): NatureQuizQuestion[] {
  if (entries.length < NATURE_QUIZ_OPTIONS) return [];
  // Unterschiedliche Saison-Texte des ganzen Lexikons – Grundlage der
  // Falsch-Antworten bei Saison-Fragen (ohne Duplikate wie 2× April–Oktober).
  const seasonTexts: string[] = [];
  entries.forEach(entry => {
    if (!entry.season) return;
    const label = seasonLabel(entry.season, lang);
    if (!seasonTexts.includes(label)) seasonTexts.push(label);
  });

  const questions: NatureQuizQuestion[] = [];
  for (const entry of shuffle(entries, rng)) {
    if (questions.length >= count) break;
    const name = pick(entry.name, lang);
    const fact = pick(entry.funFact, lang);
    const seasonPossible =
      entry.season !== undefined && seasonTexts.length >= NATURE_QUIZ_OPTIONS;
    const types: NatureQuizType[] = ["description", "category"];
    if (seasonPossible) types.push("season");
    const type = types[Math.floor(rng() * types.length)];

    let question: string;
    let correct: string;
    let wrong: string[];
    let explanation: string;

    if (type === "season" && entry.season) {
      correct = seasonLabel(entry.season, lang);
      question = fill(pick(Q_SEASON, lang), { name });
      wrong = shuffle(
        seasonTexts.filter(s => s !== correct),
        rng
      ).slice(0, NATURE_QUIZ_OPTIONS - 1);
      explanation = fill(pick(E_SEASON, lang), { name, season: correct, fact });
    } else if (type === "category") {
      const own = natureCategories.find(c => c.id === entry.category);
      correct = own ? pick(own.label, lang) : entry.category;
      question = fill(pick(Q_CATEGORY, lang), { name });
      wrong = shuffle(
        natureCategories.filter(c => c.id !== entry.category),
        rng
      )
        .slice(0, NATURE_QUIZ_OPTIONS - 1)
        .map(c => pick(c.label, lang));
      explanation = fill(pick(E_CATEGORY, lang), {
        name,
        category: correct,
        fact,
      });
    } else {
      correct = name;
      question = `${pick(Q_DESCRIPTION, lang)} «${excerpt(
        maskName(pick(entry.description, lang), name)
      )}»`;
      wrong = shuffle(
        entries.filter(e => e.id !== entry.id),
        rng
      )
        .slice(0, NATURE_QUIZ_OPTIONS - 1)
        .map(e => pick(e.name, lang));
      explanation = fill(pick(E_NAME, lang), { name, fact });
    }

    // Zu wenige unterschiedliche Falsch-Antworten: Frage überspringen statt
    // eine Frage mit doppelten Optionen zu stellen.
    if (wrong.length < NATURE_QUIZ_OPTIONS - 1) continue;
    const options = shuffle([correct, ...wrong], rng);
    questions.push({
      question,
      options,
      correctIndex: options.indexOf(correct),
      explanation,
      entryId: entry.id,
      type: type === "season" && !entry.season ? "description" : type,
    });
  }
  return questions;
}
