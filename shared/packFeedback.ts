/**
 * Der Rückblick, der die nächste Packliste verbessert (#381).
 *
 * WAS FEHLTE: Die App hat Packlisten, Vorlagen und seit #277 sogar einen
 * Vorschlag aus vergangenen Reisen. Was sie nie hatte, ist die
 * RÜCKMELDUNG. Ohne sie schleppt man das Rechaud, das seit vier Jahren
 * im Kofferraum bleibt, ein fünftes Mal mit – und vergisst die
 * Wäscheklammern zum fünften Mal, weil niemand festgehalten hat, dass
 * sie gefehlt haben.
 *
 * ZWEI FRAGEN NACH DER REISE, mehr nicht: Was hast du nicht gebraucht?
 * Was hat gefehlt? Alles Weitere («war zu schwer», «war kaputt») wäre
 * ein Formular, das niemand ausfüllt.
 *
 * DIE ANTWORTEN WERDEN GEZÄHLT, NICHT BEFOLGT. Einmal nicht gebraucht
 * heisst nichts – die Sonnencreme im verregneten Juli kommt nächstes
 * Jahr wieder mit. Erst wenn dasselbe MEHRFACH auffällt, wird daraus ein
 * Hinweis. Deshalb `MIN_UNUSED_HINTS`: Ein Vorschlag, der beim ersten
 * Mal zuschlägt, wird zur Nervensäge und dann abgeschaltet.
 *
 * ENTSCHIEDEN WIRD NIE AUTOMATISCH. Die App streicht nichts und fügt
 * nichts ein; sie zeigt an, was aufgefallen ist. Eine Packliste, die
 * sich selbst umbaut, ist keine Packliste mehr, sondern eine Überraschung.
 *
 * Verglichen wird über `normalizeItemName` aus #277 – dieselbe Regel wie
 * beim Packvorschlag, damit «Gummistiefel» und «gummistiefel » nicht
 * zwei Dinge sind.
 */
import { normalizeItemName } from "./packHistory";

/** Die beiden Rückmeldungen. */
export const FEEDBACK_KINDS = ["unused", "missing"] as const;
export type FeedbackKind = (typeof FEEDBACK_KINDS)[number];

/** So viele fehlende Dinge nimmt eine Reise entgegen – mehr ist ein Roman. */
export const MAX_MISSING_PER_TRIP = 20;
/** Feldlänge wie bei den Packlisten-Einträgen. */
export const FEEDBACK_NAME_MAX_LENGTH = 160;

/**
 * Ab so vielen Reisen wird aus einer Beobachtung ein Hinweis.
 *
 * Zwei, nicht eins: Einmal nicht gebraucht ist Wetter, zweimal ist ein
 * Muster. Und nicht drei, weil man sonst Jahre wartet – die meisten
 * fahren zwei- bis dreimal im Jahr weg.
 */
export const MIN_UNUSED_HINTS = 2;

export function isFeedbackKind(value: unknown): value is FeedbackKind {
  return (FEEDBACK_KINDS as readonly unknown[]).includes(value);
}

/** Eine gespeicherte Rückmeldung. */
export interface FeedbackRow {
  tripId: number;
  kind: FeedbackKind;
  name: string;
  /** Kategorie wie auf der Packliste; null bei alten Zeilen/ohne Angabe. */
  category?: string | null;
}

/** Was über einen Gegenstand bekannt ist. */
export interface FeedbackCount {
  /** Anzeigename – die zuletzt benutzte Schreibweise. */
  label: string;
  /** Auf wie vielen REISEN als «nicht gebraucht» gemeldet. */
  unusedTrips: number;
  /** Auf wie vielen Reisen als «hat gefehlt» gemeldet. */
  missingTrips: number;
  /** Zuletzt gemeldete Kategorie – für den Vorschlag auf der Liste. */
  category: string | null;
}

/**
 * Rückmeldungen zusammenzählen – je Gegenstand und je REISE.
 *
 * Pro Reise zählt jede Meldung einmal, auch wenn ein Gegenstand auf der
 * Liste dreimal stand (dieselbe Entscheidung wie in `packHistory`): Das
 * ist eine Erfahrung, nicht drei.
 */
export function summarizeFeedback(
  rows: readonly FeedbackRow[]
): Map<string, FeedbackCount> {
  const seen = new Set<string>();
  const summary = new Map<string, FeedbackCount>();
  for (const row of rows) {
    const key = normalizeItemName(row.name);
    if (!key) continue;
    const perTrip = `${row.tripId}:${row.kind}:${key}`;
    if (seen.has(perTrip)) continue;
    seen.add(perTrip);
    const entry = summary.get(key) ?? {
      label: row.name.trim(),
      unusedTrips: 0,
      missingTrips: 0,
      category: null,
    };
    // Die zuletzt gesehene Schreibweise gewinnt – Zeilen kommen
    // chronologisch, und die jüngste ist die, die man wiedererkennt.
    entry.label = row.name.trim() || entry.label;
    if (row.category?.trim()) entry.category = row.category.trim();
    if (row.kind === "unused") entry.unusedTrips += 1;
    else entry.missingTrips += 1;
    summary.set(key, entry);
  }
  return summary;
}

/** Ein Eintrag der aktuellen Liste, soweit hier relevant. */
export interface ListedItem {
  name: string;
}

/**
 * Was auf der Liste steht und mehrfach nicht gebraucht wurde.
 *
 * ABSICHTLICH KEIN VORSCHLAG ZUM LÖSCHEN, nur die Beobachtung samt
 * Anzahl. Ob die Regenhose mitkommt, entscheidet die Wetterprognose und
 * nicht die Statistik – aber wer sieht, dass sie dreimal ungenutzt
 * mitgefahren ist, entscheidet anders.
 */
export function unusedHints(
  items: readonly ListedItem[],
  summary: Map<string, FeedbackCount>,
  minTrips = MIN_UNUSED_HINTS
): { name: string; unusedTrips: number }[] {
  const hints: { name: string; unusedTrips: number }[] = [];
  const done = new Set<string>();
  for (const item of items) {
    const key = normalizeItemName(item.name);
    if (!key || done.has(key)) continue;
    const found = summary.get(key);
    if (!found || found.unusedTrips < minTrips) continue;
    done.add(key);
    hints.push({ name: item.name.trim(), unusedTrips: found.unusedTrips });
  }
  return hints.sort(
    (a, b) =>
      b.unusedTrips - a.unusedTrips || a.name.localeCompare(b.name, "de")
  );
}

/**
 * Was schon einmal gefehlt hat und noch nicht auf der Liste steht.
 *
 * HIER REICHT EIN EINZIGES MAL, anders als beim Nicht-Gebrauchten: Etwas
 * zu vergessen, das man wirklich gebraucht hätte, ist teuer; es noch
 * einmal vorgeschlagen zu bekommen, kostet einen Blick.
 */
export function missingSuggestions(
  items: readonly ListedItem[],
  summary: Map<string, FeedbackCount>
): { name: string; missingTrips: number; category: string | null }[] {
  const onList = new Set(
    items.map(item => normalizeItemName(item.name)).filter(Boolean)
  );
  const suggestions: {
    name: string;
    missingTrips: number;
    category: string | null;
  }[] = [];
  summary.forEach((count, key) => {
    if (count.missingTrips <= 0 || onList.has(key)) return;
    suggestions.push({
      name: count.label,
      missingTrips: count.missingTrips,
      category: count.category,
    });
  });
  return suggestions.sort(
    (a, b) =>
      b.missingTrips - a.missingTrips || a.name.localeCompare(b.name, "de")
  );
}

/** Freitext säubern und kürzen; leer bleibt leer. */
export function cleanFeedbackName(value: string): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed.slice(0, FEEDBACK_NAME_MAX_LENGTH);
}
