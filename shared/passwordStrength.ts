/**
 * Passwort-Stärke-Anzeige (#199): reine Heuristik ohne Abhängigkeiten –
 * bewertet ein Passwort von 0 (sehr schwach) bis 4 (stark) und liefert dazu
 * Verbesserungs-Hinweise als SCHLÜSSEL. Die Texte stehen im Wörterbuch
 * (Namespace `password`), damit die Bewertung sprachneutral bleibt.
 *
 * Wichtig: Die Anzeige ist reine Hilfestellung – blockiert wird nichts.
 * Die harte Mindestlänge prüft weiterhin der Server (auth.register &
 * auth.performReset), diese Datei bewertet nur.
 */

/** Ab dieser Länge gilt ein Passwort überhaupt als brauchbar (wie im Server). */
export const PASSWORD_MIN_LENGTH = 8;
/** Ab dieser Länge gibt es einen zusätzlichen Punkt. */
export const PASSWORD_GOOD_LENGTH = 12;
/** Ab dieser Länge gibt es den letzten Längen-Punkt. */
export const PASSWORD_LONG_LENGTH = 16;
/** So viele Hinweise werden höchstens zurückgegeben (kurze Liste in der UI). */
export const PASSWORD_HINT_LIMIT = 3;

/** Schlüssel der Verbesserungs-Hinweise – übersetzt im Namespace `password`. */
export type PasswordHint =
  | "tooShort"
  | "addLength"
  | "addCase"
  | "addNumber"
  | "addSpecial"
  | "avoidCommon"
  | "avoidRepeat";

export interface PasswordStrengthResult {
  /** 0–1 = schwach, 2 = mittel, 3 = gut, 4 = stark */
  score: 0 | 1 | 2 | 3 | 4;
  /** Höchstens PASSWORD_HINT_LIMIT Schlüssel, wichtigster zuerst. */
  hints: PasswordHint[];
}

/**
 * Häufige Muster, die ein Passwort erratbar machen – klein geschrieben,
 * geprüft wird als Teilzeichenkette in der kleingeschriebenen Fassung.
 * «camp» steht bewusst dabei: der Produktname liegt bei dieser App nahe.
 */
const COMMON_PATTERNS = [
  "12345",
  "123456",
  "abcdef",
  "qwert",
  "asdfg",
  "passwort",
  "password",
  "geheim",
  "hallo",
  "admin",
  "letmein",
  "camping",
  "camp",
  "zelt",
];

/** Dreifach wiederholtes Zeichen («aaa», «111») */
const TRIPLE_CHAR = /(.)\1\1/;

/**
 * Zeichenklassen inklusive der gängigen Umlaute/Akzente der vier App-Sprachen –
 * bewusst ohne Unicode-Eigenschaften (\p{L}), weil das tsconfig-Ziel dieses
 * Projekts das `u`-Flag nicht zulässt.
 */
const ACCENTS_LOWER = "äöüàáâãçèéêëìíîïñòóôõùúûýÿåæøœß";
const ACCENTS_UPPER = "ÄÖÜÀÁÂÃÇÈÉÊËÌÍÎÏÑÒÓÔÕÙÚÛÝÅÆØŒ";
const LOWER_CHARS = new RegExp(`[a-z${ACCENTS_LOWER}]`);
const UPPER_CHARS = new RegExp(`[A-Z${ACCENTS_UPPER}]`);
/** Alles, was weder Buchstabe (inkl. Akzente) noch Ziffer ist. */
const SPECIAL_CHARS = new RegExp(
  `[^a-zA-Z0-9${ACCENTS_LOWER}${ACCENTS_UPPER}]`
);

/** Ganzes Passwort besteht aus einem kurzen, wiederholten Block («abcabcabc»). */
function isRepeatedBlock(pw: string): boolean {
  for (let size = 1; size <= Math.floor(pw.length / 2); size++) {
    if (pw.length % size !== 0) continue;
    const block = pw.slice(0, size);
    let same = true;
    for (let i = size; i < pw.length; i += size) {
      if (pw.slice(i, i + size) !== block) {
        same = false;
        break;
      }
    }
    if (same) return true;
  }
  return false;
}

/**
 * Passwort bewerten: Länge (8/12/16 Zeichen), gemischte Gross-/Kleinschreibung,
 * Ziffern und Sonderzeichen geben Punkte; häufige Muster («12345», «passwort»,
 * «camp») und Wiederholungen ziehen wieder ab. Zu kurze Passwörter landen
 * immer auf 0. Reine Funktion – gleiche Eingabe, gleiches Ergebnis.
 */
export function passwordStrength(pw: string): PasswordStrengthResult {
  const length = pw.length;
  const lower = LOWER_CHARS.test(pw);
  const upper = UPPER_CHARS.test(pw);
  const digit = /\d/.test(pw);
  const special = SPECIAL_CHARS.test(pw);
  const lowerPw = pw.toLowerCase();
  const common =
    length > 0 && COMMON_PATTERNS.some(pattern => lowerPw.includes(pattern));
  const repeated =
    length > 0 && (TRIPLE_CHAR.test(pw) || isRepeatedBlock(lowerPw));

  let points = 0;
  if (length >= PASSWORD_MIN_LENGTH) points += 1;
  if (length >= PASSWORD_GOOD_LENGTH) points += 1;
  if (length >= PASSWORD_LONG_LENGTH) points += 1;
  if (lower && upper) points += 1;
  if (digit) points += 1;
  if (special) points += 1;
  if (common) points -= 2;
  if (repeated) points -= 1;

  // Zu kurz bleibt zu kurz – sonst 0–1 Punkte «schwach», 6 Punkte «stark».
  const raw =
    length < PASSWORD_MIN_LENGTH ? 0 : Math.max(0, Math.min(6, points));
  const score: PasswordStrengthResult["score"] =
    raw <= 1 ? 0 : raw === 2 ? 1 : raw === 3 ? 2 : raw === 4 ? 3 : 4;

  const hints: PasswordHint[] = [];
  if (length < PASSWORD_MIN_LENGTH) hints.push("tooShort");
  if (common) hints.push("avoidCommon");
  if (repeated) hints.push("avoidRepeat");
  if (!(lower && upper)) hints.push("addCase");
  if (!digit) hints.push("addNumber");
  if (!special) hints.push("addSpecial");
  if (length >= PASSWORD_MIN_LENGTH && length < PASSWORD_GOOD_LENGTH) {
    hints.push("addLength");
  }
  return { score, hints: hints.slice(0, PASSWORD_HINT_LIMIT) };
}
