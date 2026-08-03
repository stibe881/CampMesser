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
import { RECIPE_METHOD_LABELS } from "@shared/customRecipes";
import { LOCALE_TAGS, l4, pick, type L4, type Language } from "@shared/i18n";
import { fuzzyWordMatch, levenshtein, normalizeText } from "@shared/textMatch";
import { parseNoteTags } from "@shared/notes";

// Die fehlertoleranten Grundfunktionen liegen neu in shared/textMatch.ts,
// damit auch der Resteverwertungs-Abgleich (#235) sie nutzt. Für bestehende
// Aufrufer bleiben sie hier abrufbar.
export { fuzzyWordMatch, levenshtein };

/** Kategorie-Schlüssel eines Treffers – das Anzeige-Label liefert das Wörterbuch. */
export type SearchCategory =
  "module" | "firstAid" | "knots" | "recipes" | "nature" | "own";

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
      normTitle: normalizeText(title),
      normBody: normalizeText(body),
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
      `${p(RECIPE_METHOD_LABELS[r.method])} · ${r.timeMinutes} ${p(MIN_ABBR)} · ${p(INGREDIENTS_LABEL)}: ${r.ingredients
        .slice(0, 5)
        .map(i => p(i))
        .join(", ")}`,
      [
        p(RECIPE_METHOD_LABELS[r.method]),
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

/** Suchwörter einer Anfrage (normalisiert, min. 2 Zeichen). */
function queryWords(query: string): string[] {
  return normalizeText(query.trim())
    .split(/\s+/)
    .filter(w => w.length >= 2);
}

/**
 * Einträge gegen die Suchwörter bewerten: alle Wörter müssen vorkommen –
 * exakt als Teilstring oder fehlertolerant (Levenshtein) gegen die Wörter
 * des Ziels. Titel-Treffer werden höher gewichtet als Text-Treffer, und
 * Tippfehler-Treffer ranken bewusst NACH allen exakten Treffern.
 */
function rankEntries(
  entries: IndexEntry[],
  words: string[],
  limit: number,
  lang: Language
): SearchResult[] {
  const results: SearchResult[] = [];
  for (const entry of entries) {
    let score = 0;
    let allMatch = true;
    for (const word of words) {
      if (entry.normTitle.includes(word)) {
        score += entry.normTitle.startsWith(word) ? 14 : 10;
      } else if (entry.normBody.includes(word)) {
        score += 3;
        // Levenshtein nur für Kandidaten ohne Teilstring-Treffer –
        // der Index bleibt unverändert, geprüft wird mit max-Cutoff.
      } else if (fuzzyWordMatch(word, entry.normTitle)) {
        score += 2;
      } else if (fuzzyWordMatch(word, entry.normBody)) {
        score += 1;
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

/**
 * Wissensmodule durchsuchen. Alle Suchwörter müssen vorkommen;
 * Titel-Treffer werden höher gewichtet als Text-Treffer.
 */
export function searchKnowledge(
  query: string,
  limit = 12,
  lang: Language = "de"
): SearchResult[] {
  const words = queryWords(query);
  if (words.length === 0) return [];
  const index = (indexCache[lang] ??= buildIndex(lang));
  return rankEntries(index, words, limit, lang);
}

/**
 * Eigene Inhalte angemeldeter Nutzer*innen für die globale Suche.
 * Alle Felder sind optional – noch nicht geladene Listen fehlen einfach.
 * Nutzertexte sind einsprachige Strings, laufen aber defensiv durch pick().
 */
export interface OwnContent {
  packLists?: { id: number; name: string }[];
  spots?: { id: number; name: string; note?: string | null }[];
  recipes?: { id: number; name: string }[];
  hunts?: { id: number; title: string }[];
  quizzes?: { id: number; title: string }[];
  tentTargets?: { id: string; name: string }[];
  notes?: {
    id: number;
    title?: string | null;
    text: string;
    tags?: string | null;
  }[];
}

/** Typ-Labels für die Snippet-Zeile eigener Treffer. */
const OWN_KIND_LABELS = {
  packList: l4(
    "Packliste",
    "Liste de bagages",
    "Lista bagagli",
    "Packing list"
  ),
  spot: l4("Zeltplatz", "Emplacement", "Piazzola", "Pitch"),
  recipe: l4(
    "Eigenes Rezept",
    "Recette personnelle",
    "Ricetta personale",
    "Own recipe"
  ),
  hunt: l4(
    "Eigene Schnitzeljagd",
    "Chasse au trésor personnelle",
    "Caccia al tesoro personale",
    "Own treasure hunt"
  ),
  quiz: l4("Eigenes Quiz", "Quiz personnel", "Quiz personale", "Own quiz"),
  tentTarget: l4(
    "Zelt-Finder-Ziel",
    "Cible du localisateur de tente",
    "Obiettivo del trova-tenda",
    "Tent finder target"
  ),
  note: l4("Notiz", "Note", "Nota", "Note"),
};

/** Notiz ohne Titel: die Überschrift kommt dann aus dem Text. */
const NOTE_UNTITLED = l4("Notiz", "Note", "Nota", "Note");

/**
 * Eigene Inhalte durchsuchen (Packlisten, Zeltplätze, eigene Rezepte,
 * Jagden, Quizze, Zelt-Finder-Ziele). Gleiche Wort- und Gewichtungsregeln
 * wie searchKnowledge; ohne Cache, weil sich Nutzerdaten laufend ändern.
 */
export function searchOwnContent(
  query: string,
  own: OwnContent,
  limit = 6,
  lang: Language = "de"
): SearchResult[] {
  const words = queryWords(query);
  if (words.length === 0) return [];
  const p = (x: L4 | string) => pick(x, lang);

  const entries: IndexEntry[] = [];
  const add = (
    id: string,
    title: string,
    path: string,
    snippet: string,
    bodyParts: (string | undefined)[] = []
  ) => {
    const body = [title, ...bodyParts.filter(Boolean)].join(" ");
    entries.push({
      id,
      title,
      module: "own",
      path,
      snippet: shorten(snippet),
      normTitle: normalizeText(title),
      normBody: normalizeText(body),
    });
  };

  for (const list of own.packLists ?? []) {
    add(
      `own-list-${list.id}`,
      p(list.name),
      `/packlisten/${list.id}`,
      p(OWN_KIND_LABELS.packList)
    );
  }
  for (const spot of own.spots ?? []) {
    const kind = p(OWN_KIND_LABELS.spot);
    add(
      `own-spot-${spot.id}`,
      p(spot.name),
      `/zeltplaetze/${spot.id}`,
      spot.note ? `${kind} · ${spot.note}` : kind,
      [spot.note ?? undefined]
    );
  }
  for (const recipe of own.recipes ?? []) {
    add(
      `own-recipe-${recipe.id}`,
      p(recipe.name),
      "/rezepte",
      p(OWN_KIND_LABELS.recipe)
    );
  }
  for (const hunt of own.hunts ?? []) {
    add(
      `own-hunt-${hunt.id}`,
      p(hunt.title),
      "/familie",
      p(OWN_KIND_LABELS.hunt)
    );
  }
  for (const quiz of own.quizzes ?? []) {
    add(
      `own-quiz-${quiz.id}`,
      p(quiz.title),
      "/familie",
      p(OWN_KIND_LABELS.quiz)
    );
  }
  for (const target of own.tentTargets ?? []) {
    add(
      `own-target-${target.id}`,
      p(target.name),
      `/zeltfinder?target=${encodeURIComponent(target.id)}`,
      p(OWN_KIND_LABELS.tentTarget)
    );
  }
  // Freie Notizen (#246): gesucht wird über Titel, Text UND Stichwörter.
  // Ohne Titel trägt die erste Textzeile die Überschrift – eine Notiz ganz
  // ohne Titel soll im Treffer trotzdem wiedererkennbar sein.
  for (const note of own.notes ?? []) {
    const tags = parseNoteTags(note.tags);
    const firstLine = note.text.split("\n")[0]?.trim() ?? "";
    const title = note.title?.trim() || firstLine || p(NOTE_UNTITLED);
    const kind = p(OWN_KIND_LABELS.note);
    add(
      `own-note-${note.id}`,
      title,
      "/notizen",
      tags.length > 0 ? `${kind} · ${tags.join(", ")}` : kind,
      [note.text, tags.join(" ")]
    );
  }

  return rankEntries(entries, words, limit, lang);
}
