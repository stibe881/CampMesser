/**
 * Abzeichen-Katalog für die Kinder-Profile im Familien-Modus: Titel und
 * Beschreibung als L4, Bedingungen als reine Prüf-Funktion über die
 * Zähler eines Kindes plus das gerade abgeschlossene Ereignis.
 * Reine Funktionen – von Client, Server (badgeId-Validierung) und Tests
 * genutzt (Muster shared/quizzes.ts).
 */
import { l4, type L4 } from "./i18n";

/** Quiz-IDs aus client/src/data/familyActivities.ts, an die Abzeichen koppeln. */
export const FOREST_QUIZ_ID = "wald-quiz";
export const STAR_QUIZ_ID = "sternen-quiz";

/** So viele richtige Antworten in Folge verlangt das Serien-Abzeichen. */
export const STREAK_BADGE_TARGET = 10;

export interface BadgeDef {
  /** Stabiler Schlüssel (childBadges.badgeId, max. 40 Zeichen) */
  id: string;
  /** Emoji fürs Abzeichen – sprachneutral, ohne Icon-Bibliothek */
  emoji: string;
  title: L4;
  /** Beschreibung = Bedingung, auch als Hinweis bei noch offenen Abzeichen */
  description: L4;
}

/** Alle Abzeichen in Anzeige-Reihenfolge. */
export const BADGES: BadgeDef[] = [
  {
    id: "hunt-first",
    emoji: "🗺️",
    title: l4(
      "Schatzsucher*in",
      "Chercheur·euse de trésor",
      "Cercatore di tesori",
      "Treasure hunter"
    ),
    description: l4(
      "Erste Schnitzeljagd abgeschlossen",
      "Première chasse au trésor terminée",
      "Prima caccia al tesoro completata",
      "Completed the first scavenger hunt"
    ),
  },
  {
    id: "hunt-three",
    emoji: "🧭",
    title: l4(
      "Jagd-Profi",
      "Pro de la chasse",
      "Professionista della caccia",
      "Hunt pro"
    ),
    description: l4(
      "3 Schnitzeljagden abgeschlossen",
      "3 chasses au trésor terminées",
      "3 cacce al tesoro completate",
      "Completed 3 scavenger hunts"
    ),
  },
  {
    id: "quiz-first",
    emoji: "❓",
    title: l4(
      "Quiz-Entdecker*in",
      "Explorateur·rice de quiz",
      "Esploratore di quiz",
      "Quiz explorer"
    ),
    description: l4(
      "Erstes Quiz gespielt",
      "Premier quiz joué",
      "Primo quiz giocato",
      "Played the first quiz"
    ),
  },
  {
    id: "quiz-perfect",
    emoji: "🎯",
    title: l4("Fehlerfrei", "Sans faute", "Senza errori", "Flawless"),
    description: l4(
      "Ein Quiz ohne einen einzigen Fehler geschafft",
      "Un quiz réussi sans aucune faute",
      "Un quiz completato senza nemmeno un errore",
      "Finished a quiz without a single mistake"
    ),
  },
  {
    id: "quiz-five",
    emoji: "🦊",
    title: l4("Quiz-Fuchs", "Renard des quiz", "Volpe dei quiz", "Quiz fox"),
    description: l4(
      "5 Quizze fertig gespielt",
      "5 quiz terminés",
      "5 quiz completati",
      "Finished 5 quizzes"
    ),
  },
  {
    id: "quiz-forest-perfect",
    emoji: "🦉",
    title: l4(
      "Waldkenner*in",
      "Expert·e de la forêt",
      "Esperto del bosco",
      "Forest expert"
    ),
    description: l4(
      "Das grosse Wald-Quiz fehlerfrei geschafft",
      "Le grand quiz de la forêt réussi sans faute",
      "Il grande quiz del bosco completato senza errori",
      "Aced the Big Forest Quiz"
    ),
  },
  {
    id: "quiz-star-perfect",
    emoji: "🌟",
    title: l4(
      "Sternengucker*in",
      "Observateur·rice d'étoiles",
      "Osservatore di stelle",
      "Stargazer"
    ),
    description: l4(
      "Das Sternengucker-Quiz fehlerfrei geschafft",
      "Le quiz des observateurs d'étoiles réussi sans faute",
      "Il quiz degli osservatori di stelle completato senza errori",
      "Aced the Stargazer Quiz"
    ),
  },
  {
    id: "streak-ten",
    emoji: "🔥",
    title: l4(
      "Serien-Sieger*in",
      "Champion·ne des séries",
      "Campione delle serie",
      "Streak champion"
    ),
    description: l4(
      "10 Fragen in Folge richtig beantwortet",
      "10 questions correctes d'affilée",
      "10 domande corrette di fila",
      "Answered 10 questions in a row correctly"
    ),
  },
];

/** Gültiger Abzeichen-Schlüssel aus dem Katalog? */
export function isBadgeId(id: string): boolean {
  return BADGES.some(b => b.id === id);
}

/** Zähler eines Kindes NACH dem aktuellen Ereignis (childStats-Zeile). */
export interface BadgeProgress {
  huntsCompleted: number;
  quizzesCompleted: number;
  bestStreak: number;
}

/** Gerade abgeschlossenes Ereignis – schlankes Modell für die Prüfung. */
export type BadgeEvent =
  | { type: "huntCompleted" }
  | {
      type: "quizCompleted";
      /** Quiz-ID (eingebaute Quizze; eigene z. B. «eigenes-quiz-7») */
      quizId?: string;
      /** Alle Fragen richtig beantwortet? */
      perfect?: boolean;
      /** Längste Serie richtiger Antworten in diesem Durchgang */
      correctStreak?: number;
    };

/**
 * Alle Abzeichen, deren Bedingung mit den Zählern (nach dem Ereignis) und
 * dem Ereignis selbst erfüllt ist. Bereits verdiente werden nicht
 * herausgefiltert – die Vergabe ist idempotent (unique childId+badgeId).
 */
export function earnedBadges(
  progress: BadgeProgress,
  event?: BadgeEvent
): string[] {
  const earned: string[] = [];
  if (progress.huntsCompleted >= 1) earned.push("hunt-first");
  if (progress.huntsCompleted >= 3) earned.push("hunt-three");
  if (progress.quizzesCompleted >= 1) earned.push("quiz-first");
  if (progress.quizzesCompleted >= 5) earned.push("quiz-five");
  if (progress.bestStreak >= STREAK_BADGE_TARGET) earned.push("streak-ten");
  if (event?.type === "quizCompleted" && event.perfect) {
    earned.push("quiz-perfect");
    if (event.quizId === FOREST_QUIZ_ID) earned.push("quiz-forest-perfect");
    if (event.quizId === STAR_QUIZ_ID) earned.push("quiz-star-perfect");
  }
  return earned;
}
