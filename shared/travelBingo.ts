/**
 * Reise-Bingo für die Autofahrt (#240): Karten deterministisch aus einem
 * Seed mischen und prüfen, ob eine Reihe, eine Spalte oder eine Diagonale
 * voll ist. Reine Funktionen ohne Abhängigkeiten – Client und Tests nutzen
 * dieselbe Wahrheit (Muster shared/quizzes.ts).
 *
 * Warum deterministisch aus einem Seed statt Math.random()? Zwei Kinder
 * sollen verschiedene Karten bekommen, aber jedes Kind seine eigene Karte
 * auch nach dem Neuladen der App wiederfinden. Gespeichert wird deshalb nur
 * der Seed – die 9 bzw. 16 Motive ergeben sich daraus jedes Mal neu.
 */

/** Kantenlänge der Karte: 3×3 für die Kleinen, 4×4 als Standard. */
export type BingoSize = 3 | 4;

/** Erlaubte Kantenlängen in Anzeige-Reihenfolge. */
export const BINGO_SIZES: BingoSize[] = [3, 4];

/** So viele Karten laufen höchstens parallel (z. B. drei Kinder + Papa). */
export const MAX_BINGO_CARDS = 4;

/** Längenbegrenzung des Namens pro Karte (localStorage, Anzeige). */
export const MAX_BINGO_NAME_LENGTH = 24;

/** Eine laufende Bingo-Karte, so wie sie in localStorage liegt. */
export interface BingoCard {
  /** Stabile Id der Karte (zugleich Speicher-Schlüssel innerhalb der Liste). */
  id: string;
  /** Wem gehört die Karte? Leer erlaubt – dann zeigt die Oberfläche «Karte n». */
  name: string;
  size: BingoSize;
  /** Mischungs-Seed: bestimmt, welche Motive in welcher Reihenfolge stehen. */
  seed: string;
  /** Gefunden-Zustand je Feld, Länge immer size·size (zeilenweise). */
  found: boolean[];
  /** Anlage-Zeitpunkt in Millisekunden seit Epoch (Sortierung). */
  createdAt: number;
}

/** Ist die Zahl eine erlaubte Kantenlänge? */
export function isBingoSize(value: unknown): value is BingoSize {
  return value === 3 || value === 4;
}

/**
 * Zufallsgenerator mit Zustand (mulberry32): aus einer 32-Bit-Zahl folgt eine
 * immer gleiche Zahlenreihe in [0, 1). Klein, schnell und – anders als
 * Math.random() – reproduzierbar, worauf die ganze Karte aufbaut.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seed-Text auf eine 32-Bit-Zahl abbilden (FNV-1a). */
export function seedNumber(seed: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Liste deterministisch mischen (Fisher-Yates mit Seed-Generator).
 * Die Eingabe bleibt unangetastet; gleicher Seed ⇒ gleiche Reihenfolge.
 */
export function shuffleWithSeed<T>(items: readonly T[], seed: string): T[] {
  const result = items.slice();
  const random = mulberry32(seedNumber(seed));
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const swap = result[i]!;
    result[i] = result[j]!;
    result[j] = swap;
  }
  return result;
}

/**
 * Die Motive einer Karte ziehen: aus dem Pool deterministisch gemischt und
 * auf size·size gekürzt. Ist der Pool kleiner als die Karte, kommt zurück,
 * was da ist – die Oberfläche zeigt dann eben weniger Felder (der Pool ist
 * per Test auf mindestens 40 Motive festgenagelt, also passiert das nicht).
 */
export function drawBingoCard(
  pool: readonly string[],
  size: BingoSize,
  seed: string
): string[] {
  return shuffleWithSeed(pool, seed).slice(0, size * size);
}

/**
 * Alle Bingo-Linien einer Karte als Feld-Indizes: erst die Reihen, dann die
 * Spalten, zuletzt die beiden Diagonalen (oben links → unten rechts, dann
 * oben rechts → unten links).
 */
export function bingoLines(size: BingoSize): number[][] {
  const lines: number[][] = [];
  for (let row = 0; row < size; row++) {
    const cells: number[] = [];
    for (let col = 0; col < size; col++) cells.push(row * size + col);
    lines.push(cells);
  }
  for (let col = 0; col < size; col++) {
    const cells: number[] = [];
    for (let row = 0; row < size; row++) cells.push(row * size + col);
    lines.push(cells);
  }
  const down: number[] = [];
  const up: number[] = [];
  for (let i = 0; i < size; i++) {
    down.push(i * size + i);
    up.push(i * size + (size - 1 - i));
  }
  lines.push(down, up);
  return lines;
}

/** Die vollständig gefundenen Linien (je als Feld-Indizes). */
export function completedLines(
  found: readonly boolean[],
  size: BingoSize
): number[][] {
  return bingoLines(size).filter(line =>
    line.every(cell => found[cell] === true)
  );
}

/** Alle Felder, die zu mindestens einer vollen Linie gehören. */
export function bingoCells(
  found: readonly boolean[],
  size: BingoSize
): number[] {
  const marked: number[] = [];
  completedLines(found, size).forEach(line =>
    line.forEach(cell => {
      if (!marked.includes(cell)) marked.push(cell);
    })
  );
  return marked.sort((a, b) => a - b);
}

/** Mindestens eine Reihe, Spalte oder Diagonale voll? */
export function hasBingo(found: readonly boolean[], size: BingoSize): boolean {
  return completedLines(found, size).length > 0;
}

/** Ist die ganze Karte voll («Vollbild»)? Leere Karten zählen nicht. */
export function isFullCard(
  found: readonly boolean[],
  size: BingoSize
): boolean {
  const cells = size * size;
  if (found.length < cells) return false;
  for (let i = 0; i < cells; i++) {
    if (found[i] !== true) return false;
  }
  return true;
}

/** Anzahl gefundener Felder (für den Fortschrittsbalken). */
export function foundCount(found: readonly boolean[]): number {
  return found.filter(Boolean).length;
}

/**
 * Einen neuen Seed erzeugen. Zeitanteil plus Zufall, damit zwei Karten im
 * selben Moment («Neue Karte» für zwei Kinder direkt hintereinander)
 * verschieden ausfallen.
 */
export function newBingoSeed(now: number = Date.now()): string {
  const random = Math.floor(Math.random() * 0xffffff).toString(36);
  return `${now.toString(36)}-${random}`;
}

/** Frische Karte mit leerem Fortschritt anlegen. */
export function createBingoCard(
  name: string,
  size: BingoSize,
  now: number = Date.now()
): BingoCard {
  return {
    id: `${now.toString(36)}-${Math.floor(Math.random() * 0xffff).toString(36)}`,
    name: name.trim().slice(0, MAX_BINGO_NAME_LENGTH),
    size,
    seed: newBingoSeed(now),
    found: new Array(size * size).fill(false),
    createdAt: now,
  };
}

/**
 * Karten aus localStorage sicher einlesen: alles Unbrauchbare fliegt raus,
 * statt die Seite abstürzen zu lassen. Zu kurze/lange found-Listen werden
 * auf die Kartengrösse gebracht, damit ein alter Stand nach einem
 * Grössenwechsel nicht die Bingo-Prüfung verwirrt.
 */
export function sanitizeBingoCards(value: unknown): BingoCard[] {
  if (!Array.isArray(value)) return [];
  const cards: BingoCard[] = [];
  value.forEach(entry => {
    if (cards.length >= MAX_BINGO_CARDS) return;
    if (typeof entry !== "object" || entry === null) return;
    const card = entry as Partial<BingoCard>;
    if (typeof card.id !== "string" || card.id === "") return;
    if (typeof card.seed !== "string" || card.seed === "") return;
    if (!isBingoSize(card.size)) return;
    const cells = card.size * card.size;
    const found = new Array<boolean>(cells).fill(false);
    if (Array.isArray(card.found)) {
      for (let i = 0; i < cells; i++) found[i] = card.found[i] === true;
    }
    cards.push({
      id: card.id,
      name:
        typeof card.name === "string"
          ? card.name.trim().slice(0, MAX_BINGO_NAME_LENGTH)
          : "",
      size: card.size,
      seed: card.seed,
      found,
      createdAt:
        typeof card.createdAt === "number" && Number.isFinite(card.createdAt)
          ? card.createdAt
          : 0,
    });
  });
  return cards;
}
