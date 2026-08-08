/**
 * Freie Notizen (#246): Längenregeln, Stichwort-Normalisierung, Suche und
 * Sortierung. Reine Funktionen ohne DOM/React – Notizen-Seite, Router und
 * Tests benutzen dieselben Regeln, damit ein Stichwort überall identisch
 * geschrieben in der Datenbank landet.
 *
 * Die Stichwörter stehen kommagetrennt in EINER Spalte (varchar(300)).
 * NOTE_MAX_TAGS × NOTE_TAG_MAX_LENGTH plus die Trennkommas passt genau
 * hinein – die Kappung hier ist also zugleich die Zusicherung, dass nichts
 * an der Spaltenbreite abgeschnitten wird.
 */
import { normalizeText } from "./textMatch";

/** Maximale Länge des Titels (DB: varchar(140)); leer ist erlaubt. */
export const NOTE_TITLE_MAX_LENGTH = 140;
/** Maximale Länge des Notiztexts (DB: text, hier bewusst begrenzt). */
export const NOTE_TEXT_MAX_LENGTH = 4000;
/** Maximale Länge eines einzelnen Stichworts. */
export const NOTE_TAG_MAX_LENGTH = 24;
/** So viele Stichwörter passen an eine Notiz. */
export const NOTE_MAX_TAGS = 12;

/**
 * Text auf ganze Code Points kürzen – ein Emoji am Ende darf nicht
 * halbiert werden, sonst bleibt ein defektes Ersatzzeichen stehen.
 */
function cutCodePoints(value: string, max: number): string {
  if (value.length <= max) return value;
  return Array.from(value).slice(0, max).join("");
}

/**
 * Stichwörter säubern: aus kommagetrenntem Text oder einer Liste wird eine
 * saubere Liste – Rand-Leerraum weg, innerer Leerraum auf ein Leerzeichen
 * zusammengezogen, Leeres raus, auf NOTE_TAG_MAX_LENGTH gekürzt, Duplikate
 * OHNE Rücksicht auf Gross-/Kleinschreibung entfernt («Zelt» und «zelt»
 * sind dasselbe Stichwort) und auf NOTE_MAX_TAGS begrenzt.
 *
 * Die Schreibweise des ERSTEN Vorkommens bleibt erhalten: Wer «Tessin»
 * tippt, will «Tessin» sehen und nicht «tessin» – kleingeschrieben wird nur
 * zum Vergleichen.
 */
export function normalizeNoteTags(input: string | readonly string[]): string[] {
  const raw = typeof input === "string" ? input.split(",") : input;
  const seen: string[] = [];
  const result: string[] = [];
  for (let i = 0; i < raw.length; i++) {
    const tag = cutCodePoints(
      String(raw[i] ?? "")
        .replace(/\s+/g, " ")
        .trim(),
      NOTE_TAG_MAX_LENGTH
    ).trim();
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.indexOf(key) >= 0) continue;
    seen.push(key);
    result.push(tag);
    if (result.length >= NOTE_MAX_TAGS) break;
  }
  return result;
}

/** Stichwörter für die Datenbank zusammensetzen (bereits normalisiert). */
export function serializeNoteTags(input: string | readonly string[]): string {
  return normalizeNoteTags(input).join(",");
}

/** Gespeicherte Stichwörter lesen; null/leer ergibt eine leere Liste. */
export function parseNoteTags(stored: string | null | undefined): string[] {
  return stored ? normalizeNoteTags(stored) : [];
}

/** Titel säubern: getrimmt und gekürzt; leer ergibt null (= ohne Titel). */
export function normalizeNoteTitle(
  raw: string | null | undefined
): string | null {
  const trimmed = (raw ?? "").replace(/\s+/g, " ").trim();
  if (!trimmed) return null;
  return cutCodePoints(trimmed, NOTE_TITLE_MAX_LENGTH).trim();
}

/**
 * Notiztext säubern: Zeilenenden vereinheitlichen, Rand-Leerraum weg, mehr
 * als zwei Leerzeilen am Stück zusammenziehen und auf die Höchstlänge
 * kürzen (wieder zwischen ganzen Code Points).
 */
export function normalizeNoteText(raw: string): string {
  const cleaned = raw
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return cutCodePoints(cleaned, NOTE_TEXT_MAX_LENGTH);
}

/** Minimalform einer Notiz für Suche, Filter und Sortierung. */
export interface NoteLike {
  id: number;
  title?: string | null;
  text: string;
  tags?: string | null;
  updatedAt?: Date | string | number;
  /** Angepinnt (#455)? undefined gilt als false (Zeilen vor der Spalte). */
  pinned?: boolean | null;
}

/** Zeitstempel als Zahl; unbrauchbare Werte gelten als «uralt». */
function updatedMs(value: Date | string | number | undefined): number {
  if (value === undefined) return 0;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

/** Trägt die Notiz dieses Stichwort? Gross-/Kleinschreibung egal. */
export function noteHasTag(note: NoteLike, tag: string): boolean {
  const wanted = tag.trim().toLowerCase();
  if (!wanted) return false;
  return parseNoteTags(note.tags).some(t => t.toLowerCase() === wanted);
}

/**
 * Volltext-Filter der Notizenliste: gesucht wird über Titel, Text UND
 * Stichwörter. Alle Suchwörter müssen vorkommen (UND-Verknüpfung), und
 * verglichen wird über normalizeText – «Baume» findet also auch «Bäume».
 * Eine leere Anfrage lässt alles durch.
 */
export function noteMatchesQuery(note: NoteLike, query: string): boolean {
  const words = normalizeText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = normalizeText(
    [note.title ?? "", note.text, parseNoteTags(note.tags).join(" ")].join(" ")
  );
  return words.every(word => haystack.includes(word));
}

/**
 * Notizen sortieren: zuletzt geändert zuoberst, bei gleichem Zeitstempel
 * entscheidet die höhere Id. Sortiert wird auf einer Kopie – die Eingabe
 * bleibt unangetastet.
 */
export function sortNotes<T extends NoteLike>(notes: readonly T[]): T[] {
  return notes.slice().sort((a, b) => {
    // Angepinnte (#455) zuerst; innerhalb gilt «zuletzt geändert zuerst»
    const pinDiff = Number(b.pinned ?? false) - Number(a.pinned ?? false);
    if (pinDiff !== 0) return pinDiff;
    const diff = updatedMs(b.updatedAt) - updatedMs(a.updatedAt);
    return diff !== 0 ? diff : b.id - a.id;
  });
}

/**
 * Alle vorkommenden Stichwörter mit ihrer Häufigkeit – Grundlage der
 * Filter-Chips. Häufigste zuerst, bei Gleichstand alphabetisch nach der
 * kleingeschriebenen Fassung (bewusst ohne Locale: die Reihenfolge soll in
 * jeder Sprache dieselbe und damit testbar sein). Verschiedene
 * Schreibweisen desselben Stichworts werden zusammengezählt; angezeigt wird
 * die zuerst gefundene.
 */
export function collectNoteTags(
  notes: readonly NoteLike[]
): { tag: string; count: number }[] {
  const order: string[] = [];
  const labels: Record<string, string> = {};
  const counts: Record<string, number> = {};
  notes.forEach(note => {
    parseNoteTags(note.tags).forEach(tag => {
      const key = tag.toLowerCase();
      if (order.indexOf(key) < 0) {
        order.push(key);
        labels[key] = tag;
        counts[key] = 0;
      }
      counts[key] += 1;
    });
  });
  return order
    .map(key => ({ tag: labels[key], count: counts[key], key }))
    .sort((a, b) => b.count - a.count || (a.key < b.key ? -1 : 1))
    .map(({ tag, count }) => ({ tag, count }));
}
