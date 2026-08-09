/**
 * Transportkisten (#276): Kennungen, Etiketten-Adressen und die Zuordnung
 * von Ausrüstung zu Boxen.
 *
 * Der Kern ist die KENNUNG (`code`) einer Kiste – kurz, gross gedruckt und
 * im QR-Code enthalten. Sie muss dreierlei können:
 *  - auf einem Etikett aus zwei Metern lesbar sein (also kurz),
 *  - in einer Adresse stehen, ohne kodiert werden zu müssen,
 *  - beim Abtippen keine Verwechslung erlauben.
 *
 * Deshalb sind nur Grossbuchstaben, Ziffern und Bindestrich erlaubt, und
 * die leicht verwechselbaren Zeichen O/0 sowie I/1 werden beim automatisch
 * vergebenen Vorschlag gemieden. Wer von Hand «K1» tippt, darf das – die
 * Regel gilt für Vorschläge, nicht als Verbot.
 *
 * Reine Rechnerei, kein Abruf und kein DOM – Client, Server und Tests
 * teilen sich dieselbe Logik.
 */

/** Höchstlänge der Kennung – so lang wie die DB-Spalte. */
export const MAX_BOX_CODE_LENGTH = 12;

/** Höchstlänge des Kisten-Namens. */
export const MAX_BOX_NAME_LENGTH = 80;

/**
 * Kennung säubern: Grossbuchstaben, Ziffern und Bindestrich, sonst nichts.
 * Kleinbuchstaben werden gross geschrieben, alles andere fällt weg –
 * «k 3» wird also zu «K3», und ein Etikett bleibt eindeutig.
 */
export function normalizeBoxCode(value: string): string {
  return (value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, MAX_BOX_CODE_LENGTH);
}

/** Taugt der Wert als Kennung? */
export function isValidBoxCode(value: string): boolean {
  const code = normalizeBoxCode(value);
  return code.length > 0 && code === value.toUpperCase().trim();
}

/**
 * Nächste freie Kennung im Muster «K1», «K2», … vorschlagen. Gesucht wird
 * die kleinste freie Zahl, nicht einfach «Anzahl + 1»: Wer K2 löscht, soll
 * die Kennung wiederverwenden können, statt Lücken zu sammeln.
 */
export function nextBoxCode(existing: readonly string[], prefix = "K"): string {
  const taken = new Set(existing.map(code => normalizeBoxCode(code)));
  for (let i = 1; i <= 999; i++) {
    const candidate = `${prefix}${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${prefix}${Date.now() % 1000}`;
}

/**
 * Adresse, die im QR-Code steckt. Bewusst ein normaler Link auf die App:
 * Jede Kamera öffnet ihn, ohne dass ReiseKompass installiert sein muss, und
 * wer angemeldet ist, sieht sofort den Inhalt der Kiste.
 */
export function boxScanUrl(origin: string, code: string): string {
  const base = origin.replace(/\/+$/, "");
  return `${base}/kisten/${encodeURIComponent(normalizeBoxCode(code))}`;
}

/** Eine Kiste, so weit die Etiketten- und Zähl-Logik sie braucht. */
export interface BoxLike {
  id: number;
  code: string;
  name: string;
  location?: string | null;
  notes?: string | null;
}

/** Ein Ausrüstungs-Gegenstand, so weit die Zuordnung ihn braucht. */
export interface BoxItemLike {
  id: number;
  name: string;
  quantity: number;
  weightGrams: number;
  boxId?: number | null;
}

/** Was in einer Kiste steckt – Inhalt, Stückzahl und Gewicht. */
export interface BoxContents<T extends BoxLike = BoxLike> {
  box: T;
  items: BoxItemLike[];
  /** Summe der Stückzahlen, nicht der Zeilen. */
  itemCount: number;
  /** Gesamtgewicht in Gramm (Gewicht × Stückzahl). */
  totalGrams: number;
}

/** Gewicht einer Zeile: Stückgewicht × Anzahl, nie negativ. */
export function lineGrams(item: BoxItemLike): number {
  const grams = Number.isFinite(item.weightGrams) ? item.weightGrams : 0;
  const quantity = Number.isFinite(item.quantity) ? item.quantity : 0;
  return Math.max(0, grams) * Math.max(0, quantity);
}

/**
 * Inhalt einer Kiste zusammenstellen. Die Reihenfolge der Gegenstände
 * bleibt, wie sie hereinkommt – sortiert wird in der Ansicht, damit hier
 * keine sprachabhängige Ordnung entsteht.
 */
export function boxContents<T extends BoxLike>(
  box: T,
  items: readonly BoxItemLike[]
): BoxContents<T> {
  const inBox = items.filter(item => item.boxId === box.id);
  return {
    box,
    items: inBox,
    itemCount: inBox.reduce(
      (sum, item) => sum + Math.max(0, item.quantity || 0),
      0
    ),
    totalGrams: inBox.reduce((sum, item) => sum + lineGrams(item), 0),
  };
}

/** Inhalt aller Kisten auf einmal – für die Übersicht. */
export function allBoxContents<T extends BoxLike>(
  boxes: readonly T[],
  items: readonly BoxItemLike[]
): BoxContents<T>[] {
  return boxes.map(box => boxContents(box, items));
}

/** Gegenstände, die (noch) in keiner Kiste liegen. */
export function looseItems<T extends BoxItemLike>(
  items: readonly T[],
  boxes: readonly BoxLike[]
): T[] {
  const known = new Set(boxes.map(box => box.id));
  // Auch ein Verweis auf eine gelöschte Kiste zählt als «nicht eingeräumt»
  return items.filter(item => item.boxId == null || !known.has(item.boxId));
}

/** Kiste zu einer Kennung finden (Gross-/Kleinschreibung egal). */
export function findBoxByCode<T extends { code: string }>(
  boxes: readonly T[],
  code: string
): T | null {
  const wanted = normalizeBoxCode(code);
  return boxes.find(box => normalizeBoxCode(box.code) === wanted) ?? null;
}
