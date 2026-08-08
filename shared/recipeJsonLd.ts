/**
 * Rezept aus einem Web-Link (#501): Rezeptseiten tragen ihr Rezept fast
 * immer maschinenlesbar als schema.org/Recipe im JSON-LD – Name,
 * Zutatenliste und Schritte stehen dort sauberer, als jede Heuristik
 * (#444) sie aus dem Fliesstext raten könnte.
 *
 * Hier stehen reine Funktionen: JSON-LD-Blöcke aus dem HTML schneiden,
 * das Recipe-Objekt finden (auch in @graph-Listen), Zutaten und
 * Schritte defensiv lesen. Geholt wird die Seite SERVERSEITIG (CORS)
 * – die URL-Prüfung dagegen steht hier, damit sie testbar ist.
 */

/** Gleiche Kappung wie der Text-Import (#444). */
export const RECIPE_IMPORT_MAX_INGREDIENTS = 30;
export const RECIPE_IMPORT_MAX_STEPS = 20;

export interface ImportedRecipe {
  name: string | null;
  ingredients: string[];
  steps: string[];
}

/**
 * Nur echte Web-Adressen, und keine ins eigene Netz: Der Server holt
 * die Seite selbst – ohne diese Prüfung liesse er sich als Späher auf
 * localhost oder interne Adressen missbrauchen (SSRF).
 */
export function isAllowedImportUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) return false;
  if (host.endsWith(".local") || host.endsWith(".internal")) return false;
  // IPv6-Literale pauschal ablehnen – Rezeptseiten haben Hostnamen
  if (host.startsWith("[")) return false;
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 127 || a === 10 || a === 0) return false;
    if (a === 192 && b === 168) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 169 && b === 254) return false;
  }
  return true;
}

/** Grobe HTML-Reste aus Instruktionstexten entfernen. */
function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    // Der Tag-Ersatz hinterlässt Leerzeichen vor Satzzeichen («kochen .»)
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
  return text || null;
}

/** Alle <script type="application/ld+json">-Blöcke eines HTML-Texts. */
export function extractJsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const pattern =
    /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    try {
      blocks.push(JSON.parse(match[1]));
    } catch {
      // kaputtes JSON-LD ist draussen häufig – still überspringen
    }
  }
  return blocks;
}

/** Ist dieses Objekt ein schema.org-Recipe? (@type auch als Liste). */
function isRecipeNode(node: unknown): node is Record<string, unknown> {
  if (!node || typeof node !== "object") return false;
  const type = (node as { "@type"?: unknown })["@type"];
  if (typeof type === "string") return type.toLowerCase() === "recipe";
  if (Array.isArray(type)) {
    return type.some(
      t => typeof t === "string" && t.toLowerCase() === "recipe"
    );
  }
  return false;
}

/** Recipe-Knoten in einem JSON-LD-Dokument finden (auch in @graph). */
function findRecipeNode(doc: unknown): Record<string, unknown> | null {
  if (Array.isArray(doc)) {
    for (const entry of doc) {
      const found = findRecipeNode(entry);
      if (found) return found;
    }
    return null;
  }
  if (!doc || typeof doc !== "object") return null;
  if (isRecipeNode(doc)) return doc;
  const graph = (doc as { "@graph"?: unknown })["@graph"];
  if (Array.isArray(graph)) return findRecipeNode(graph);
  return null;
}

/** Schritte: Strings, HowToStep-Objekte oder HowToSection mit itemListElement. */
function readInstructions(value: unknown, into: string[]): void {
  if (into.length >= RECIPE_IMPORT_MAX_STEPS) return;
  if (typeof value === "string") {
    const text = cleanText(value);
    if (text) into.push(text);
    return;
  }
  if (Array.isArray(value)) {
    for (const entry of value) readInstructions(entry, into);
    return;
  }
  if (!value || typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  if (Array.isArray(record.itemListElement)) {
    readInstructions(record.itemListElement, into);
    return;
  }
  const text = cleanText(record.text) ?? cleanText(record.name);
  if (text) into.push(text);
}

/**
 * Rezept aus dem HTML einer Seite lesen – null, wenn kein brauchbares
 * schema.org/Recipe drinsteht (dann bleibt der Text-Import #444).
 */
export function parseRecipeFromHtml(html: string): ImportedRecipe | null {
  for (const doc of extractJsonLdBlocks(html)) {
    const recipe = findRecipeNode(doc);
    if (!recipe) continue;
    const ingredients = (
      Array.isArray(recipe.recipeIngredient) ? recipe.recipeIngredient : []
    )
      .map(cleanText)
      .filter((line): line is string => Boolean(line))
      .slice(0, RECIPE_IMPORT_MAX_INGREDIENTS);
    const steps: string[] = [];
    readInstructions(recipe.recipeInstructions, steps);
    const name = cleanText(recipe.name);
    if (!name && ingredients.length === 0 && steps.length === 0) continue;
    return {
      name,
      ingredients,
      steps: steps.slice(0, RECIPE_IMPORT_MAX_STEPS),
    };
  }
  return null;
}
