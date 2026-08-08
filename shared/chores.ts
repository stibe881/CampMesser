/**
 * Ämtli-Plan im Camp (#270): Aufgaben verteilen, Kinder sammeln Punkte.
 *
 * Der Streit am Zeltplatz geht nie darum, DASS abgewaschen wird, sondern
 * darum, wer schon wieder. Deshalb ist die Verteilung hier keine
 * Zufallssache, sondern eine ROTATION: Wer heute abwäscht, holt morgen
 * Holz. Der Tag bestimmt den Startpunkt, damit sich die Reihenfolge jeden
 * Tag um eins verschiebt – nachvollziehbar und für Kinder überprüfbar,
 * denn genau das ist der Punkt.
 *
 * Punkte gibt es erst beim Abhaken. Eine zugeteilte Aufgabe ist kein
 * Verdienst.
 */

export const MAX_CHORE_TITLE_LENGTH = 60;
export const MIN_CHORE_POINTS = 1;
export const MAX_CHORE_POINTS = 10;
export const DEFAULT_CHORE_POINTS = 1;

/** Mehr Ämtli als das plant niemand ernsthaft – und niemand macht sie. */
export const MAX_CHORES = 20;

export interface ChoreLike {
  id: number;
  title: string;
  points: number;
  /**
   * Wochentage (#447) als JSON-Liste von ISO-Wochentagen (1 = Montag …
   * 7 = Sonntag); null/undefined = jeden Tag.
   */
  weekdaysJson?: string | null;
}

export interface AssignmentLike {
  id: number;
  choreId: number;
  /** Zugeteiltes Kind; null = noch niemand zugeteilt. */
  childId: number | null;
  /** Tag als ISO-Datum (YYYY-MM-DD). */
  day: string;
  doneAt: Date | string | null;
}

export interface ChildLike {
  id: number;
  name: string;
  /**
   * Sammelt diese Person Punkte? (#370)
   *
   * Ämtli machen alle – der Punktestand ist der Wettbewerb der Kinder.
   * Wer mitverteilt wird, ohne mitzuzählen, steht hier auf `false`.
   * `undefined` gilt als `true`: Profile aus der Zeit vor der Spalte
   * sollen zählen wie bisher.
   */
  earnsPoints?: boolean;
}

/** Zählt diese Person in der Rangliste mit? */
export function countsForPoints(child: ChildLike): boolean {
  return child.earnsPoints !== false;
}

/** Punkte auf den erlaubten Bereich bringen. */
export function clampPoints(points: number): number {
  if (!Number.isFinite(points)) return DEFAULT_CHORE_POINTS;
  return Math.max(
    MIN_CHORE_POINTS,
    Math.min(MAX_CHORE_POINTS, Math.round(points))
  );
}

/**
 * Tagesindex aus einem ISO-Datum – die Anzahl Tage seit dem 1.1.1970.
 * Er bestimmt, um wie viel die Rotation an diesem Tag verschoben ist.
 * Ungültige Daten geben 0, damit die Verteilung trotzdem funktioniert.
 */
export function dayIndex(iso: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return 0;
  const time = Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  );
  return Math.floor(time / 86400000);
}

/**
 * Ämtli nur an bestimmten Wochentagen (#447): «Abfall rausbringen» fällt
 * nur dienstags an, Abwasch täglich. Gespeichert als JSON-Liste von
 * ISO-Wochentagen; alles Unlesbare wird verworfen. null heisst «jeden
 * Tag» – auch eine Liste mit allen sieben Tagen wird dazu normalisiert,
 * damit «alle angekreuzt» und «nichts eingeschränkt» dasselbe sind.
 */
export function parseChoreWeekdays(
  json: string | null | undefined
): number[] | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return null;
    const days = Array.from(
      new Set(
        parsed.filter(
          (d): d is number => Number.isInteger(d) && d >= 1 && d <= 7
        )
      )
    ).sort((a, b) => a - b);
    if (days.length === 0 || days.length === 7) return null;
    return days;
  } catch {
    return null;
  }
}

/** ISO-Wochentag (1 = Montag … 7 = Sonntag) eines ISO-Datums; 0 = ungültig. */
export function isoWeekday(iso: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return 0;
  const day = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  ).getUTCDay();
  return day === 0 ? 7 : day;
}

/**
 * Die an einem Tag anfallenden Ämtli. Ein ungültiges Datum lässt alle
 * gelten – lieber ein Ämtli zu viel verteilt als eines verschluckt.
 */
export function choresForDay<T extends ChoreLike>(
  chores: readonly T[],
  day: string
): T[] {
  const weekday = isoWeekday(day);
  if (weekday === 0) return chores.slice();
  return chores.filter(chore => {
    const days = parseChoreWeekdays(chore.weekdaysJson);
    return days === null || days.includes(weekday);
  });
}

/**
 * Aufgaben reihum auf die Kinder verteilen. Die Verschiebung nach Tag
 * sorgt dafür, dass nicht immer dasselbe Kind dieselbe Aufgabe bekommt –
 * ohne Zufall, damit man die Reihenfolge nachrechnen kann.
 */
export function rotateAssignments(
  chores: readonly ChoreLike[],
  children: readonly ChildLike[],
  day: string
): { choreId: number; childId: number }[] {
  if (children.length === 0) return [];
  const offset = dayIndex(day);
  return chores.map((chore, index) => ({
    choreId: chore.id,
    childId:
      children[
        (((index + offset) % children.length) + children.length) %
          children.length
      ].id,
  }));
}

export interface ScoreRow {
  childId: number;
  name: string;
  /** Punkte aus erledigten Ämtli. */
  points: number;
  /** Erledigte Ämtli – für den Fall, dass Punkte gleich sind. */
  done: number;
}

/**
 * Punktestand: gezählt wird nur, was auch abgehakt ist. Sortiert nach
 * Punkten, bei Gleichstand nach Name – NICHT nach Kind-Id, sonst hängt
 * die Reihenfolge davon ab, wer zuerst angelegt wurde.
 *
 * WER NICHT MITZÄHLT, STEHT NICHT DRIN (#370): Die Erwachsenen machen
 * Ämtli, aber sie stehen nicht im Wettbewerb der Kinder – ein Vater mit
 * 40 Punkten an der Spitze macht die Rangliste sinnlos. Verteilt wird
 * trotzdem an alle; das entscheidet `rotateAssignments`, nicht diese
 * Funktion.
 */
export function scoreboard(
  children: readonly ChildLike[],
  chores: readonly ChoreLike[],
  assignments: readonly AssignmentLike[]
): ScoreRow[] {
  const pointsById = new Map<number, number>();
  for (const chore of chores) pointsById.set(chore.id, chore.points);

  const rows = children.filter(countsForPoints).map(child => {
    const mine = assignments.filter(
      a => a.childId === child.id && a.doneAt !== null
    );
    const points = mine.reduce(
      (sum, a) => sum + (pointsById.get(a.choreId) ?? 0),
      0
    );
    return { childId: child.id, name: child.name, points, done: mine.length };
  });

  return rows.sort(
    (a, b) =>
      b.points - a.points || b.done - a.done || a.name.localeCompare(b.name)
  );
}

/** Zuteilungen eines Tages, in der Reihenfolge der Aufgabenliste. */
export function assignmentsForDay<T extends AssignmentLike>(
  assignments: readonly T[],
  day: string
): T[] {
  return assignments.filter(a => a.day === day);
}

export interface DayProgress {
  done: number;
  total: number;
  percent: number;
  allDone: boolean;
}

export function dayProgress(
  assignments: readonly AssignmentLike[]
): DayProgress {
  const total = assignments.length;
  const done = assignments.filter(a => a.doneAt !== null).length;
  return {
    done,
    total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
    allDone: total > 0 && done === total,
  };
}
