/**
 * Lagerfeuer-Liederbuch (#269): Texte mit Akkorden, gedacht fürs Singen
 * im Dunkeln.
 *
 * URHEBERRECHT ist hier die entscheidende Einschränkung, nicht die
 * Technik: Aufgenommen werden AUSSCHLIESSLICH Lieder, deren Text und
 * Melodie gemeinfrei sind – Volkslieder und Stücke, deren Urheber seit
 * mehr als 70 Jahren verstorben sind. Deshalb steht bei jedem Lied die
 * Herkunft mit Jahr; ein modernes Lagerfeuer-Lied wäre schön, wäre aber
 * eine Urheberrechtsverletzung.
 *
 * Akkorde stehen IM Text in eckigen Klammern («[G]Der Mond ist
 * auf[C]gegangen»), weil sie zur Silbe gehören, an der gegriffen wird.
 * Die Anzeige zerlegt die Zeile mit `parseChordLine` und setzt die
 * Akkorde über die richtige Stelle.
 */
import { type L4 } from "./i18n";

/** Ein Textstück mit dem Akkord, der an seinem Anfang gegriffen wird. */
export interface ChordSegment {
  /** Akkord an dieser Stelle; null = die Zeile beginnt ohne Akkord. */
  chord: string | null;
  text: string;
}

export interface Song {
  id: string;
  /**
   * Titel in der Originalsprache – ein Lied wird nicht übersetzt, so wie
   * man «Frère Jacques» auch auf Deutsch so nennt.
   */
  title: string;
  /** Sprache des Textes; bestimmt nur die Filter, nicht die Anzeige. */
  language: "de" | "fr" | "it" | "en";
  /** Herkunft und Jahr – zugleich der Beleg, dass das Lied gemeinfrei ist. */
  origin: L4;
  /** Kurzer Hinweis zum Singen (Kanon, Tempo, wann es passt). */
  note: L4;
  /** Strophen; jede Strophe ist eine Liste von Zeilen mit [Akkorden]. */
  verses: string[][];
}

/**
 * Eine Zeile in Akkord-/Textstücke zerlegen. Text vor dem ersten Akkord
 * bekommt `chord: null`, damit die Anzeige ihn ohne Lücke setzen kann.
 */
export function parseChordLine(line: string): ChordSegment[] {
  const segments: ChordSegment[] = [];
  let rest = line;
  let current: ChordSegment = { chord: null, text: "" };
  while (rest.length > 0) {
    const open = rest.indexOf("[");
    const close = open === -1 ? -1 : rest.indexOf("]", open);
    if (open === -1 || close === -1) {
      current.text += rest;
      break;
    }
    current.text += rest.slice(0, open);
    // Ein leeres Stück am Zeilenanfang würde nur eine Lücke erzeugen
    if (current.text.length > 0 || current.chord !== null) {
      segments.push(current);
    }
    current = { chord: rest.slice(open + 1, close), text: "" };
    rest = rest.slice(close + 1);
  }
  if (current.text.length > 0 || current.chord !== null) segments.push(current);
  return segments;
}

/** Die im Lied vorkommenden Akkorde, in der Reihenfolge des ersten Auftretens. */
export function songChords(song: Song): string[] {
  const seen: string[] = [];
  for (const verse of song.verses) {
    for (const line of verse) {
      for (const segment of parseChordLine(line)) {
        if (segment.chord && !seen.includes(segment.chord)) {
          seen.push(segment.chord);
        }
      }
    }
  }
  return seen;
}

/** Halbtonleiter mit Kreuzen – die Anzeige bleibt bei einer Schreibweise. */
const SCALE = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** Enharmonische Schreibweisen auf die Kreuz-Form bringen. */
const FLAT_TO_SHARP: Record<string, string> = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
};

export const MIN_TRANSPOSE = -6;
export const MAX_TRANSPOSE = 6;

/** Einen einzelnen Grundton verschieben (null, wenn es keiner ist). */
function shiftRoot(root: string, semitones: number): string | null {
  const normalized = FLAT_TO_SHARP[root] ?? root;
  const index = SCALE.indexOf(normalized);
  if (index === -1) return null;
  const shifted = (((index + semitones) % 12) + 12) % 12;
  return SCALE[shifted];
}

/**
 * Einen Akkord transponieren – inklusive Bass-Ton nach dem Schrägstrich
 * («G/B»). Unbekanntes bleibt unverändert stehen, statt Unsinn zu
 * erzeugen: Ein falsch geratener Akkord ist schlimmer als ein fremder.
 */
export function transposeChord(chord: string, semitones: number): string {
  if (semitones === 0) return chord;
  return chord
    .split("/")
    .map(part => {
      const match = /^([A-G][b#]?)(.*)$/.exec(part);
      if (!match) return part;
      const shifted = shiftRoot(match[1], semitones);
      return shifted === null ? part : shifted + match[2];
    })
    .join("/");
}

/** Eine ganze Zeile transponieren, Text bleibt unangetastet. */
export function transposeLine(line: string, semitones: number): string {
  if (semitones === 0) return line;
  return line.replace(/\[([^\]]+)\]/g, (_, chord: string) => {
    return `[${transposeChord(chord, semitones)}]`;
  });
}

/** Anzeige der Transponierung: «+2», «−1», «0». */
export function transposeLabel(semitones: number): string {
  if (semitones === 0) return "0";
  return semitones > 0 ? `+${semitones}` : `−${Math.abs(semitones)}`;
}
