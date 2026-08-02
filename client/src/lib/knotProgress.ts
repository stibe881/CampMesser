/**
 * Knoten-Lernfortschritt: reine Statistik-Logik pro Knoten.
 * Nach jeder Quiz-Antwort wird (Knoten-Id, richtig/falsch) festgehalten;
 * daraus ergibt sich ein Beherrschungs-Grad («neu» | «üben» | «sicher»).
 * Persistiert in localStorage und über den Geräte-Sync (useSyncedSetting).
 */

/** localStorage-Schlüssel des Lernfortschritts. */
export const KNOT_PROGRESS_KEY = "campmesser.knotProgress";

/** So viele letzte Antworten werden pro Knoten behalten. */
export const RECENT_LIMIT = 5;

/** «sicher» = letzte SECURE_STREAK Antworten richtig UND insgesamt ≥ SECURE_MIN_CORRECT richtige. */
export const SECURE_STREAK = 3;
export const SECURE_MIN_CORRECT = 3;

/** Obergrenze erfasster Knoten – schützt localStorage und den Sync-Payload. */
export const MAX_TRACKED_KNOTS = 200;

export interface KnotStat {
  /** Letzte Antworten, älteste zuerst (max. RECENT_LIMIT Einträge) */
  recent: boolean[];
  /** Insgesamt richtig beantwortete Fragen zu diesem Knoten */
  correct: number;
  /** Insgesamt beantwortete Fragen zu diesem Knoten */
  total: number;
}

/** Statistik pro Knoten-Id. */
export type KnotProgress = Record<string, KnotStat>;

export type MasteryLevel = "neu" | "üben" | "sicher";

/** Eine beantwortete Quiz-Frage festhalten – gibt eine neue Statistik zurück. */
export function recordAnswer(
  stats: KnotProgress,
  knotId: string,
  correct: boolean
): KnotProgress {
  const prev = stats[knotId] ?? { recent: [], correct: 0, total: 0 };
  return {
    ...stats,
    [knotId]: {
      recent: [...prev.recent, correct].slice(-RECENT_LIMIT),
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    },
  };
}

/** Beherrschungs-Grad eines Knotens aus der Statistik ableiten. */
export function masteryLevel(
  stats: KnotProgress,
  knotId: string
): MasteryLevel {
  const s = stats[knotId];
  if (!s || s.total < 1) return "neu";
  const streak = s.recent.slice(-SECURE_STREAK);
  if (
    streak.length >= SECURE_STREAK &&
    streak.every(Boolean) &&
    s.correct >= SECURE_MIN_CORRECT
  ) {
    return "sicher";
  }
  return "üben";
}

/**
 * Unbekannte Daten (localStorage/Geräte-Sync) defensiv in eine saubere
 * Statistik überführen: nur plausible Einträge, Zähler nie negativ,
 * recent auf boolean-Werte und RECENT_LIMIT gekappt.
 */
export function sanitizeKnotProgress(value: unknown): KnotProgress {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: KnotProgress = {};
  let count = 0;
  for (const [knotId, raw] of Object.entries(
    value as Record<string, unknown>
  )) {
    if (count >= MAX_TRACKED_KNOTS) break;
    if (!knotId || !raw || typeof raw !== "object" || Array.isArray(raw)) {
      continue;
    }
    const entry = raw as Partial<KnotStat>;
    if (
      typeof entry.correct !== "number" ||
      !Number.isInteger(entry.correct) ||
      entry.correct < 0 ||
      typeof entry.total !== "number" ||
      !Number.isInteger(entry.total) ||
      entry.total < entry.correct
    ) {
      continue;
    }
    const recent = Array.isArray(entry.recent)
      ? entry.recent
          .filter((r): r is boolean => typeof r === "boolean")
          .slice(-RECENT_LIMIT)
      : [];
    result[knotId] = { recent, correct: entry.correct, total: entry.total };
    count++;
  }
  return result;
}

/** Fortschritt aus localStorage laden (defensiv – kaputte Werte ergeben {}). */
export function loadKnotProgress(): KnotProgress {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(KNOT_PROGRESS_KEY);
    return raw ? sanitizeKnotProgress(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

/** Fortschritt in localStorage schreiben (Fehler wie volle Quota ignorieren). */
export function storeKnotProgress(progress: KnotProgress): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(KNOT_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    /* Quota voll o. Ä. – der Geräte-Sync gleicht es später aus */
  }
}
