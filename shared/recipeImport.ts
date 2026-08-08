/**
 * Rezept aus Text übernehmen (#444): ein kopiertes Rezept (Website,
 * WhatsApp, Foto-Abschrift) heuristisch in Name, Zutaten und Schritte
 * zerlegen, damit man es nicht Zeile für Zeile abtippen muss.
 *
 * Bewusst eine HEURISTIK, kein Parser mit Anspruch auf Wahrheit: Das
 * Ergebnis landet im Editor und bleibt dort VOR dem Speichern
 * korrigierbar. Zwei Wege:
 *
 * 1. Mit Abschnitts-Titeln («Zutaten», «Zubereitung» – auch FR/IT/EN):
 *    Die Titel gewinnen, alles darunter gehört zum Abschnitt.
 * 2. Ohne Titel: Zeilen, die mit einer Menge beginnen («200 g Reis»,
 *    «½ Zwiebel») oder als Aufzählung markiert sind, gelten als Zutat;
 *    der Rest als Schritt. Die erste kurze freie Zeile wird zum Namen.
 */

export interface ParsedRecipeText {
  name: string | null;
  ingredients: string[];
  steps: string[];
}

/** Obergrenzen des Rezept-Editors – mehr würde beim Speichern gekappt. */
export const IMPORT_MAX_INGREDIENTS = 30;
export const IMPORT_MAX_STEPS = 20;
const MAX_LINE_LENGTH = 300;
const MAX_NAME_LENGTH = 80;

const INGREDIENT_HEADER =
  /^(zutaten|ingredients?|ingrédients?|ingredienti)\s*:?\s*$/i;
const STEP_HEADER =
  /^(zubereitung|anleitung|schritte|zubereitungsschritte|steps?|instructions?|method|preparation|préparation|preparazione|procedimento)\s*:?\s*$/i;

/** Aufzählungszeichen am Zeilenanfang entfernen («- 200 g Reis»). */
function stripBullet(line: string): string {
  return line.replace(/^[-–—*•●▪]\s*/, "").trim();
}

/** Schritt-Nummerierung entfernen («1.», «2)», «Schritt 3:»). */
function stripStepNumber(line: string): string {
  return line
    .replace(/^(schritt|step|étape|etape|passo|fase)\s*\d+\s*[.:)]?\s*/i, "")
    .replace(/^\d{1,2}\s*[.)]\s+/, "")
    .trim();
}

/** Beginnt die Zeile mit einer Menge? («200 g», «½», «1-2», «3/4») */
export function startsWithQuantity(line: string): boolean {
  return /^(\d+([.,]\d+)?(\s*[-–]\s*\d+([.,]\d+)?)?|\d+\s*\/\s*\d+|[½⅓¼¾⅔⅛])\s*\S/.test(
    line
  );
}

/** Sieht die Zeile nach einer Schritt-Nummerierung aus? */
function looksNumberedStep(line: string): boolean {
  return (
    /^(schritt|step|étape|etape|passo|fase)\s*\d+/i.test(line) ||
    /^\d{1,2}\s*[.)]\s+\D/.test(line)
  );
}

function pushCapped(list: string[], value: string, cap: number) {
  const trimmed = value.slice(0, MAX_LINE_LENGTH).trim();
  if (trimmed && list.length < cap) list.push(trimmed);
}

/**
 * Kopierten Rezept-Text in Editor-Felder zerlegen. Liefert leere Listen,
 * wenn nichts Brauchbares erkennbar ist – der Aufrufer meldet das ehrlich,
 * statt Unsinn einzufüllen.
 */
export function parseRecipeText(text: string): ParsedRecipeText {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  const result: ParsedRecipeText = { name: null, ingredients: [], steps: [] };
  if (lines.length === 0) return result;

  const hasHeaders = lines.some(
    l => INGREDIENT_HEADER.test(l) || STEP_HEADER.test(l)
  );

  if (hasHeaders) {
    let mode: "before" | "ingredients" | "steps" = "before";
    for (const raw of lines) {
      if (INGREDIENT_HEADER.test(raw)) {
        mode = "ingredients";
        continue;
      }
      if (STEP_HEADER.test(raw)) {
        mode = "steps";
        continue;
      }
      if (mode === "before") {
        // Erste freie Zeile vor den Abschnitten ist der Name-Kandidat
        if (result.name === null && raw.length <= MAX_NAME_LENGTH) {
          result.name = stripBullet(raw);
        }
        continue;
      }
      if (mode === "ingredients") {
        pushCapped(
          result.ingredients,
          stripBullet(raw),
          IMPORT_MAX_INGREDIENTS
        );
      } else {
        pushCapped(result.steps, stripStepNumber(raw), IMPORT_MAX_STEPS);
      }
    }
    return result;
  }

  // Ohne Abschnitts-Titel: Zeile für Zeile raten
  for (const raw of lines) {
    const bulleted = /^[-–—*•●▪]\s*/.test(raw);
    const line = stripBullet(raw);
    if (looksNumberedStep(line)) {
      pushCapped(result.steps, stripStepNumber(line), IMPORT_MAX_STEPS);
      continue;
    }
    if (startsWithQuantity(line) || (bulleted && !looksNumberedStep(line))) {
      pushCapped(result.ingredients, line, IMPORT_MAX_INGREDIENTS);
      continue;
    }
    if (
      result.name === null &&
      result.ingredients.length === 0 &&
      result.steps.length === 0 &&
      line.length <= MAX_NAME_LENGTH
    ) {
      result.name = line;
      continue;
    }
    pushCapped(result.steps, line, IMPORT_MAX_STEPS);
  }
  return result;
}
