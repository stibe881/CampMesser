/**
 * Reine Ablauf-Logik des Quiz-Duells im Familien-Modus: zwei Kinder
 * beantworten abwechselnd dieselben Fragen (Kind A Frage 1, Kind B Frage 1,
 * Kind A Frage 2 …). Ein «Zug» ist eine beantwortete Frage eines Kindes –
 * bei n Fragen gibt es also 2n Züge. Reine Funktionen ohne UI-Abhängigkeiten,
 * getestet in server/quizDuel.test.ts.
 */

/** Index des Kindes im Duell: 0 = beginnt, 1 = antwortet als zweites. */
export type DuelPlayer = 0 | 1;

/** Wer ist bei Zug `turn` (0-basiert) dran? Gerade Züge spielt Kind A. */
export function duelPlayer(turn: number): DuelPlayer {
  return (turn % 2) as DuelPlayer;
}

/** Welche Frage (0-basiert) wird bei Zug `turn` gestellt? */
export function duelQuestionIndex(turn: number): number {
  return Math.floor(turn / 2);
}

/** Sind bei `questionCount` Fragen alle Züge gespielt? */
export function duelFinished(turn: number, questionCount: number): boolean {
  return turn >= questionCount * 2;
}

/** Sieger nach Punkten: Kind-Index oder null bei Unentschieden. */
export function duelWinner(scoreA: number, scoreB: number): DuelPlayer | null {
  if (scoreA === scoreB) return null;
  return scoreA > scoreB ? 0 : 1;
}
