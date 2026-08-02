/**
 * Globale Suche über alle Offline-Wissensmodule: Erste Hilfe, Knoten,
 * Rezepte und Natur-Lexikon. Der Index wird pro Sprache einmal aus den
 * statischen Bundle-Daten aufgebaut – funktioniert komplett offline.
 * Alle Textfelder laufen durch `pick()`, damit sowohl heutige string-
 * als auch künftige L4-Felder korrekt in der aktiven Sprache landen.
 */
import { firstAidTopics } from "@/data/firstAid";
import { knotCategoryLabels, knots } from "@/data/knots";
import { groupLabels, modules } from "@/data/modules";
import { natureEntries } from "@/data/nature";
import { recipes } from "@/data/recipes";
import { LOCALE_TAGS, l4, pick, type L4, type Language } from "@shared/i18n";

/** Kategorie-Schlüssel eines Treffers – das Anzeige-Label liefert das Wörterbuch. */
export type SearchCategory =
  | "module"
  | "firstAid"
  | "knots"
  | "recipes"
  | "nature";

export interface SearchResult {
  id: string;
  title: string;
  /** Kategorie des Treffers, z. B. "firstAid" – Label via Wörterbuch */
  module: SearchCategory;
  /** Route des Moduls */
  path: string;
  /** Kurzer Kontext-Text fürs Ergebnis */
  snippet: string;
  score: number;
}

interface IndexEntry {
  id: string;
  title: string;
  module: SearchCategory;
  path: string;
  snippet: string;
  /** Normalisierter Titel */
  normTitle: string;
  /** Normalisierter Gesamttext (Titel + Inhalt) */
  normBody: string;
}

/** Kleinschreibung + Umlaut-Faltung, damit «Baume» auch «Bäume» findet. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/é|è|ê/g, "e")
    .replace(/à|â/g, "a")
    .replace(/ß/g, "ss");
}

function shorten(s: string, max = 110): string {
  return s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;
}

const MIN_ABBR = l4("Min.", "min", "min", "min");
const INGREDIENTS_LABEL = l4(
  "Zutaten",
  "Ingrédients",
  "Ingredienti",
  "Ingredients"
);

const indexCache: Partial<Record<Language, IndexEntry[]>> = {};

function buildIndex(lang: Language): IndexEntry[] {
  /** Textfeld in der aktiven Sprache lesen (strings laufen unverändert durch). */
  const p = (x: L4 | string) => pick(x, lang);
  const entries: IndexEntry[] = [];
  const add = (
    id: string,
    title: string,
    module: SearchCategory,
    path: string,
    snippet: string,
    bodyParts: (string | undefined)[]
  ) => {
    const body = [title, ...bodyParts.filter(Boolean)].join(" ");
    entries.push({
      id,
      title,
      module,
      path,
      snippet: shorten(snippet),
      normTitle: normalize(title),
      normBody: normalize(body),
    });
  };

  // Werkzeuge selbst sind auch findbar: «wasserwaage» führt direkt zur Kachel
  for (const m of modules) {
    add(`module-${m.path}`, p(m.title), "module", m.path, p(m.description), [
      p(m.description),
      p(groupLabels[m.group]),
    ]);
  }
  for (const t of firstAidTopics) {
    add(
      `firstaid-${t.id}`,
      p(t.title),
      "firstAid",
      "/erste-hilfe",
      p(t.summary),
      [
        p(t.summary),
        ...t.symptoms.map(s => p(s)),
        ...t.steps.map(s => `${p(s.title)} ${p(s.text)}`),
        p(t.warning),
      ]
    );
  }
  for (const k of knots) {
    add(`knot-${k.id}`, p(k.name), "knots", "/knoten", p(k.useCase), [
      k.altName ? p(k.altName) : undefined,
      p(knotCategoryLabels[k.category]),
      p(k.useCase),
      p(k.campingUse),
      ...k.steps.map(s => p(s)),
      p(k.proTip),
    ]);
  }
  for (const r of recipes) {
    add(
      `recipe-${r.id}`,
      p(r.name),
      "recipes",
      "/rezepte",
      `${p(r.method)} · ${r.timeMinutes} ${p(MIN_ABBR)} · ${p(INGREDIENTS_LABEL)}: ${r.ingredients
        .slice(0, 5)
        .map(i => p(i))
        .join(", ")}`,
      [
        p(r.method),
        ...r.ingredients.map(i => p(i)),
        ...r.steps.map(s => p(s)),
        r.tip ? p(r.tip) : undefined,
      ]
    );
  }
  for (const n of natureEntries) {
    add(`nature-${n.id}`, p(n.name), "nature", "/natur", p(n.description), [
      n.latinOrExtra ? p(n.latinOrExtra) : undefined,
      p(n.description),
      p(n.funFact),
      ...n.features.map(f => p(f)),
    ]);
  }
  return entries;
}

/**
 * Wissensmodule durchsuchen. Alle Suchwörter müssen vorkommen;
 * Titel-Treffer werden höher gewichtet als Text-Treffer.
 */
export function searchKnowledge(
  query: string,
  limit = 12,
  lang: Language = "de"
): SearchResult[] {
  const words = normalize(query.trim())
    .split(/\s+/)
    .filter(w => w.length >= 2);
  if (words.length === 0) return [];
  const index = (indexCache[lang] ??= buildIndex(lang));

  const results: SearchResult[] = [];
  for (const entry of index) {
    let score = 0;
    let allMatch = true;
    for (const word of words) {
      if (entry.normTitle.includes(word)) {
        score += entry.normTitle.startsWith(word) ? 14 : 10;
      } else if (entry.normBody.includes(word)) {
        score += 3;
      } else {
        allMatch = false;
        break;
      }
    }
    if (!allMatch || score === 0) continue;
    results.push({
      id: entry.id,
      title: entry.title,
      module: entry.module,
      path: entry.path,
      snippet: entry.snippet,
      score,
    });
  }
  return results
    .sort(
      (a, b) =>
        b.score - a.score || a.title.localeCompare(b.title, LOCALE_TAGS[lang])
    )
    .slice(0, limit);
}
