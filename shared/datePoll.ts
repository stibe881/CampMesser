/**
 * Termin-Finder (#253): Mitreisende stimmen über mögliche Reisedaten ab.
 *
 * Das Muster kennt jede/r vom Doodle – hier auf Datums-SPANNEN statt
 * einzelner Tage, weil eine Reise von–bis geht und «22.–24. August» als
 * Ganzes passt oder nicht.
 *
 * Zur Auswertung eine bewusste Entscheidung: Gewichtete Punkte allein
 * taugen nicht. Wer an einem Termin ARBEITEN muss, kann nicht mit, egal
 * wie begeistert die übrigen sind – ein «Nein» ist ein Ausschluss, keine
 * schlechte Note. Deshalb wird zuerst nach der Zahl der Absagen sortiert
 * und erst danach nach Zustimmung. Ein Termin ohne Absage und mit drei
 * «Vielleicht» schlägt einen mit vier «Ja» und einer Absage.
 *
 * Reine Rechnerei auf ISO-Daten – Client, Server und Tests teilen sie.
 */
import { tripNights } from "./trips";

/** Antwortmöglichkeiten, absichtlich nur drei – mehr wählt niemand aus. */
export const VOTE_VALUES = ["yes", "maybe", "no"] as const;
export type Vote = (typeof VOTE_VALUES)[number];

/** Höchstlänge der Notiz zu einem Vorschlag (DB: varchar(140)). */
export const MAX_OPTION_NOTE_LENGTH = 140;

/** Mehr Vorschläge beantwortet niemand mehr – Grenze für den Router. */
export const MAX_DATE_OPTIONS = 12;

/** Ist der Wert eine gültige Antwort? */
export function isVote(value: unknown): value is Vote {
  return (
    typeof value === "string" &&
    (VOTE_VALUES as readonly string[]).includes(value)
  );
}

/** Ein Datums-Vorschlag, so weit die Auswertung ihn braucht. */
export interface DateOptionLike {
  id: number;
  startDate: string;
  endDate: string;
  note?: string | null;
}

/** Eine abgegebene Stimme. */
export interface DateVoteLike {
  optionId: number;
  userId: number;
  vote: Vote;
}

/** Auswertung eines Vorschlags. */
export interface OptionTally<T extends DateOptionLike = DateOptionLike> {
  option: T;
  yes: number;
  maybe: number;
  no: number;
  /** Mitreisende, die zu diesem Vorschlag (noch) nichts gesagt haben. */
  pending: number;
  /** Nächte der Spanne – dieselbe Rechnung wie bei einer Reise. */
  nights: number;
  /** Zustimmung als Punkte: Ja = 2, Vielleicht = 1, Nein = 0. */
  score: number;
  /** Alle Befragten haben mit Ja geantwortet. */
  unanimous: boolean;
}

/** Punkte eines Vorschlags – nur Zustimmung, Absagen zählen separat. */
function scoreOf(yes: number, maybe: number): number {
  return yes * 2 + maybe;
}

/**
 * Gültige Spanne? Ende nach Anfang, und beides muss ein echtes Datum sein.
 * Ein eintägiger Vorschlag (0 Nächte) ist keine Reise und fällt durch.
 */
export function isValidOptionRange(
  startDate: string,
  endDate: string
): boolean {
  return tripNights(startDate, endDate) > 0;
}

/** Steht dieselbe Spanne schon zur Wahl? */
export function isDuplicateOption(
  options: readonly DateOptionLike[],
  startDate: string,
  endDate: string
): boolean {
  return options.some(
    option => option.startDate === startDate && option.endDate === endDate
  );
}

/**
 * Einen Vorschlag auswerten. `participantIds` sind alle Stimmberechtigten
 * (Besitzer:in plus Mitreisende) – daraus ergibt sich, wie viele noch
 * fehlen. Stimmen von Konten, die nicht mehr dabei sind, werden NICHT
 * mitgezählt: Wer die Reise verlassen hat, soll das Ergebnis nicht mehr
 * bestimmen; die Zeile bleibt in der Datenbank, falls die Person
 * zurückkommt.
 */
export function tallyOption<T extends DateOptionLike>(
  option: T,
  votes: readonly DateVoteLike[],
  participantIds: readonly number[]
): OptionTally<T> {
  const participants = new Set(participantIds);
  let yes = 0;
  let maybe = 0;
  let no = 0;
  const voted = new Set<number>();
  votes.forEach(vote => {
    if (vote.optionId !== option.id) return;
    if (!participants.has(vote.userId)) return;
    if (voted.has(vote.userId)) return;
    voted.add(vote.userId);
    if (vote.vote === "yes") yes++;
    else if (vote.vote === "maybe") maybe++;
    else no++;
  });
  return {
    option,
    yes,
    maybe,
    no,
    pending: Math.max(0, participants.size - voted.size),
    nights: tripNights(option.startDate, option.endDate),
    score: scoreOf(yes, maybe),
    unanimous: participants.size > 0 && yes === participants.size,
  };
}

/**
 * Alle Vorschläge auswerten und in die Reihenfolge bringen, in der man sie
 * lesen will: erst die mit den wenigsten Absagen, dann die mit der
 * grössten Zustimmung, und bei Gleichstand das frühere Datum – wer sich
 * nicht entscheiden kann, fährt lieber früher los.
 */
export function rankOptions<T extends DateOptionLike>(
  options: readonly T[],
  votes: readonly DateVoteLike[],
  participantIds: readonly number[]
): OptionTally<T>[] {
  return options
    .map(option => tallyOption(option, votes, participantIds))
    .sort((a, b) => {
      if (a.no !== b.no) return a.no - b.no;
      if (a.score !== b.score) return b.score - a.score;
      if (a.option.startDate !== b.option.startDate) {
        return a.option.startDate < b.option.startDate ? -1 : 1;
      }
      return a.option.id - b.option.id;
    });
}

/**
 * Der Vorschlag, den man nehmen würde – der erste der Rangliste, sofern
 * überhaupt jemand abgestimmt hat. Ohne eine einzige Stimme gibt es keinen
 * Sieger, sonst stünde ein willkürlicher Termin als «bester» da.
 */
export function bestOption<T extends DateOptionLike>(
  ranked: readonly OptionTally<T>[]
): OptionTally<T> | null {
  const first = ranked[0];
  if (!first) return null;
  const anyVote = ranked.some(tally => tally.yes + tally.maybe + tally.no > 0);
  return anyVote ? first : null;
}

/**
 * Ist die Abstimmung entschieden? Entschieden heisst: alle Befragten haben
 * geantwortet UND es gibt genau einen führenden Vorschlag. Bei Gleichstand
 * an der Spitze bleibt es offen – dann entscheidet ein Mensch, nicht die
 * Sortierung.
 */
export function isDecided(
  ranked: readonly OptionTally<DateOptionLike>[]
): boolean {
  const first = ranked[0];
  if (!first || first.pending > 0) return false;
  const second = ranked[1];
  if (!second) return first.yes + first.maybe > 0;
  return first.no !== second.no || first.score !== second.score;
}

/** Wer hat zu diesem Vorschlag noch nichts gesagt? */
export function pendingVoters(
  optionId: number,
  votes: readonly DateVoteLike[],
  participantIds: readonly number[]
): number[] {
  const voted = new Set(
    votes.filter(vote => vote.optionId === optionId).map(vote => vote.userId)
  );
  return participantIds.filter(id => !voted.has(id));
}

/** Eigene Antwort zu einem Vorschlag (null = noch nicht abgestimmt). */
export function myVote(
  optionId: number,
  userId: number,
  votes: readonly DateVoteLike[]
): Vote | null {
  const found = votes.find(
    vote => vote.optionId === optionId && vote.userId === userId
  );
  return found ? found.vote : null;
}

/**
 * Wie weit ist die Abstimmung insgesamt? Gezählt wird über alle Vorschläge
 * hinweg, damit «3 von 8 Antworten» im Kopf der Karte stehen kann.
 */
export function pollProgress(
  options: readonly DateOptionLike[],
  votes: readonly DateVoteLike[],
  participantIds: readonly number[]
): { answered: number; expected: number; complete: boolean } {
  const participants = new Set(participantIds);
  const optionIds = new Set(options.map(option => option.id));
  const seen = new Set<string>();
  votes.forEach(vote => {
    if (!optionIds.has(vote.optionId)) return;
    if (!participants.has(vote.userId)) return;
    seen.add(`${vote.optionId}:${vote.userId}`);
  });
  const expected = optionIds.size * participants.size;
  return {
    answered: seen.size,
    expected,
    complete: expected > 0 && seen.size === expected,
  };
}
