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

/** Zähler pro Beherrschungs-Grad über eine Menge von Knoten. */
export interface MasteryCounts {
  secure: number;
  practice: number;
  fresh: number;
  /** Anzahl betrachteter Knoten (secure + practice + fresh) */
  total: number;
}

/**
 * Wie viele der gegebenen Knoten sind «sicher», «üben» bzw. «neu»?
 * Reine Auswertung fürs Statistik-Dashboard – Knoten ohne Eintrag in der
 * Statistik zählen als «neu», Einträge zu unbekannten Knoten werden
 * ignoriert (die Knoten-Liste gibt den Rahmen vor). Doppelte Ids zählen
 * nur einmal.
 */
export function masteryCounts(
  stats: KnotProgress,
  knotIds: string[]
): MasteryCounts {
  const counts: MasteryCounts = {
    secure: 0,
    practice: 0,
    fresh: 0,
    total: 0,
  };
  const seen: Record<string, true> = {};
  for (const knotId of knotIds) {
    if (seen[knotId]) continue;
    seen[knotId] = true;
    counts.total += 1;
    const level = masteryLevel(stats, knotId);
    if (level === "sicher") counts.secure += 1;
    else if (level === "üben") counts.practice += 1;
    else counts.fresh += 1;
  }
  return counts;
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
