/**
 * Globale Suche über alle Offline-Wissensmodule: Erste Hilfe, Knoten,
 * Rezepte und Natur-Lexikon. Der Index wird einmal aus den statischen
 * Bundle-Daten aufgebaut – funktioniert komplett offline.
 */
import { firstAidTopics } from "@/data/firstAid";
import { knots } from "@/data/knots";
import { natureEntries } from "@/data/nature";
import { recipes } from "@/data/recipes";

export interface SearchResult {
  id: string;
  title: string;
  /** Modul-Anzeigename, z. B. «Erste Hilfe» */
  module: string;
  /** Route des Moduls */
  path: string;
  /** Kurzer Kontext-Text fürs Ergebnis */
  snippet: string;
  score: number;
}

interface IndexEntry {
  id: string;
  title: string;
  module: string;
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

let index: IndexEntry[] | null = null;

function buildIndex(): IndexEntry[] {
  const entries: IndexEntry[] = [];
  const add = (
    id: string,
    title: string,
    module: string,
    path: string,
    snippet: string,
    bodyParts: (string | undefined)[],
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

  for (const t of firstAidTopics) {
    add(`firstaid-${t.id}`, t.title, "Erste Hilfe", "/erste-hilfe", t.summary, [
      t.summary,
      ...t.symptoms,
      ...t.steps.map(s => `${s.title} ${s.text}`),
      t.warning,
    ]);
  }
  for (const k of knots) {
    add(`knot-${k.id}`, k.name, "Knoten", "/knoten", k.useCase, [
      k.altName,
      k.category,
      k.useCase,
      k.campingUse,
      ...k.steps,
      k.proTip,
    ]);
  }
  for (const r of recipes) {
    add(`recipe-${r.id}`, r.name, "Rezepte", "/rezepte", `${r.method} · ${r.timeMinutes} Min. · Zutaten: ${r.ingredients.slice(0, 5).join(", ")}`, [
      r.method,
      ...r.ingredients,
      ...r.steps,
      r.tip,
    ]);
  }
  for (const n of natureEntries) {
    add(`nature-${n.id}`, n.name, "Natur", "/natur", n.description, [
      n.latinOrExtra,
      n.description,
      n.funFact,
      ...n.features,
    ]);
  }
  return entries;
}

/**
 * Wissensmodule durchsuchen. Alle Suchwörter müssen vorkommen;
 * Titel-Treffer werden höher gewichtet als Text-Treffer.
 */
export function searchKnowledge(query: string, limit = 12): SearchResult[] {
  const words = normalize(query.trim()).split(/\s+/).filter(w => w.length >= 2);
  if (words.length === 0) return [];
  if (!index) index = buildIndex();

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
  return results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "de-CH")).slice(0, limit);
}
