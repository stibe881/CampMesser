/**
 * Küchen-Timer im Rezept (#218): erkennt Zeitangaben im Rezept-Text
 * («15 Minuten köcheln», «ca. 1 Std.») und formatiert Restzeiten.
 * Reine Funktionen ohne DOM/React – von der Rezept-Seite, der globalen
 * Timer-Leiste und den Tests genutzt.
 *
 * Bewusst OHNE Unicode-Property-Regexes (\p{L}): die Einheiten aller vier
 * Sprachen (Minuten/Min./minutes/minuti, Stunden/Std./heures/ore) kommen
 * mit ASCII-Buchstaben aus.
 */

/** Eine im Rezept-Text gefundene Zeitangabe. */
export interface ParsedDuration {
  /** Der Wortlaut aus dem Rezept (z. B. «ca. 1 Std.») – so steht er auf dem Knopf. */
  label: string;
  /** Dauer in ganzen Minuten; bei Bereichen («15–20 Min.») die UNTERE Grenze. */
  minutes: number;
}

/** Schnellwahl-Chips für den Timer (Minuten). */
export const QUICK_TIMER_MINUTES = [1, 3, 5, 10, 15, 20, 30] as const;

/** Längster erlaubter Timer: 10 Stunden – fängt Tippfehler ab. */
export const MAX_TIMER_MINUTES = 600;

/** Höchstens so viele Timer gleichzeitig (Beilage + Hauptgang + Reserve). */
export const MAX_ACTIVE_TIMERS = 6;

/** Höchstens so viele Zeitangaben pro Schritt anbieten. */
const MAX_DURATIONS_PER_TEXT = 4;

/** Minuten-Einheiten in DE/FR/IT/EN (klein geschrieben, ohne Schlusspunkt). */
const MINUTE_UNITS = [
  "min",
  "mins",
  "minute",
  "minuten",
  "minutes",
  "minuto",
  "minuti",
];

/** Stunden-Einheiten in DE/FR/IT/EN (klein geschrieben, ohne Schlusspunkt). */
const HOUR_UNITS = [
  "h",
  "hr",
  "hrs",
  "std",
  "stunde",
  "stunden",
  "hour",
  "hours",
  "heure",
  "heures",
  "ora",
  "ore",
];

/**
 * Zahl (auch mit Dezimalkomma), optional ein Bereich («15–20», «10 bis 15»,
 * «5 à 10», «5 a 10»), danach das Einheiten-Wort mit optionalem Schlusspunkt.
 * Nur ASCII-Buchstabenklassen – keine Unicode-Property-Escapes.
 */
const DURATION_RE =
  /(\d+(?:[.,]\d+)?)\s*(?:(?:-|–|—|bis|to|à|a|e)\s*(\d+(?:[.,]\d+)?)\s*)?([a-z]+)\.?/gi;

/** «ca.», «etwa», «environ» … direkt vor der Zahl – gehört mit aufs Etikett. */
const APPROX_RE =
  /(ca\.|circa|etwa|rund|ungefähr|ungefaehr|env\.|environ|about|approx\.|around|roughly)\s*$/i;

/** Trennwörter zwischen «1 Std.» und «30 Min.» – beides gehört zusammen. */
const HOUR_MINUTE_GLUE_RE = /^[\s,]*(?:und|and|et|e)?[\s,]*$/i;

/**
 * Abkürzungen, bei denen der Punkt zum Wort gehört («Min.», «Std.»).
 * Bei ausgeschriebenen Einheiten ist ein Punkt dahinter der Satzschluss und
 * bleibt draussen («Backe 20 Minuten.» → Etikett «20 Minuten»).
 */
const DOTTED_UNITS = ["min", "mins", "std", "h", "hr", "hrs"];

/** Einheiten-Wort auf «Stunde», «Minute» oder «unbekannt» abbilden. */
function unitKind(word: string): "h" | "min" | null {
  const key = word.toLowerCase();
  if (MINUTE_UNITS.includes(key)) return "min";
  if (HOUR_UNITS.includes(key)) return "h";
  return null;
}

/** «1,5» und «1.5» gleichermassen lesen. */
function toNumber(raw: string): number {
  const value = Number(raw.replace(",", "."));
  return Number.isFinite(value) ? value : NaN;
}

interface RawMatch {
  start: number;
  end: number;
  minutes: number;
  kind: "h" | "min";
}

/**
 * Zeitangaben aus einem Rezept-Text lesen – für den «Timer»-Knopf pro Schritt.
 *
 * - Erkennt Minuten und Stunden in DE/FR/IT/EN, inklusive Kurzformen
 *   («Min.», «Std.», «h», «ore»).
 * - Bereiche («15–20 Minuten») ergeben die UNTERE Grenze: lieber einmal zu
 *   früh nachschauen als das Essen verbrennen lassen.
 * - «1 Std. 30 Min.» wird zu einer einzigen Angabe von 90 Minuten
 *   zusammengezogen.
 * - Angaben ohne Zeiteinheit («180 Grad», «2 EL») werden ignoriert, ebenso
 *   0 Minuten und alles über {@link MAX_TIMER_MINUTES}.
 * - Mehrfach genannte gleiche Dauern erscheinen nur einmal.
 */
export function parseDurations(text: string): ParsedDuration[] {
  if (typeof text !== "string" || text.trim() === "") return [];
  const raw: RawMatch[] = [];
  DURATION_RE.lastIndex = 0;
  let match = DURATION_RE.exec(text);
  while (match !== null) {
    const word = (match[3] ?? "").toLowerCase();
    const kind = unitKind(word);
    if (kind) {
      // Bei Bereichen zählt die untere Grenze (= die erste Zahl)
      const value = toNumber(match[1] ?? "");
      if (Number.isFinite(value) && value > 0) {
        const whole = match[0];
        // Satzschlusspunkt nach ausgeschriebener Einheit nicht mitnehmen
        const trailingDot = whole.endsWith(".") && !DOTTED_UNITS.includes(word);
        raw.push({
          start: match.index,
          end: match.index + whole.length - (trailingDot ? 1 : 0),
          minutes: kind === "h" ? value * 60 : value,
          kind,
        });
      }
    }
    match = DURATION_RE.exec(text);
  }

  // «1 Std. 30 Min.» → eine Angabe von 90 Minuten
  const merged: RawMatch[] = [];
  for (let i = 0; i < raw.length; i++) {
    const current = raw[i];
    const next = raw[i + 1];
    if (
      current.kind === "h" &&
      next &&
      next.kind === "min" &&
      HOUR_MINUTE_GLUE_RE.test(text.slice(current.end, next.start))
    ) {
      merged.push({
        start: current.start,
        end: next.end,
        minutes: current.minutes + next.minutes,
        kind: "h",
      });
      i++; // die Minuten-Angabe ist verbraucht
    } else {
      merged.push(current);
    }
  }

  const result: ParsedDuration[] = [];
  const seen: number[] = [];
  for (let i = 0; i < merged.length; i++) {
    const entry = merged[i];
    const minutes = Math.round(entry.minutes);
    if (minutes < 1 || minutes > MAX_TIMER_MINUTES) continue;
    if (seen.includes(minutes)) continue;
    seen.push(minutes);
    // «ca.» & Co. vor der Zahl gehören mit aufs Etikett
    const before = text.slice(0, entry.start);
    const approx = APPROX_RE.exec(before);
    const labelStart = approx ? entry.start - approx[0].length : entry.start;
    const label = text.slice(labelStart, entry.end).replace(/\s+/g, " ").trim();
    result.push({ label, minutes });
    if (result.length >= MAX_DURATIONS_PER_TEXT) break;
  }
  return result;
}

/**
 * Restzeit als «M:SS» bzw. «H:MM:SS» ausgeben. Angebrochene Sekunden werden
 * aufgerundet, damit die Anzeige bei «0:01» endet und nicht bei «0:00» hängt.
 * Negative Werte gelten als abgelaufen («0:00»).
 */
export function formatRemaining(totalSeconds: number): string {
  const seconds = Number.isFinite(totalSeconds)
    ? Math.max(0, Math.ceil(totalSeconds))
    : 0;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(rest)}`
    : `${minutes}:${pad(rest)}`;
}

/**
 * Eingabe des Minuten-Feldes prüfen: erlaubt sind ganze Minuten von 1 bis
 * {@link MAX_TIMER_MINUTES}; alles andere (leer, Text, 0, zu gross) ergibt null.
 */
export function parseTimerMinutes(value: string): number | null {
  const trimmed = (value ?? "").trim().replace(",", ".");
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;
  const minutes = Math.round(parsed);
  if (minutes < 1 || minutes > MAX_TIMER_MINUTES) return null;
  return minutes;
}
