/**
 * Suchindex der Offline-Wissensmodule – BEWUSST EIN EIGENES MODUL.
 *
 * Hier hängen Erste Hilfe, Knoten, Rezepte, Natur-Lexikon, Wolken und die
 * beiden Pflege-Ratgeber dran: zusammen gegen 500 kB Text in vier Sprachen.
 * Solange diese Datei aus `globalSearch.ts` heraus statisch importiert wurde,
 * landete all das im Haupt-Bundle und musste beim ERSTEN Aufruf der App
 * geladen und geparst werden – für eine Startseite, auf der niemand sucht.
 *
 * Deshalb wird das Modul ausschliesslich per `await import()` geholt, und
 * zwar erst, wenn das Suchfeld angetippt wird (`ensureKnowledgeIndex`). Wer
 * hier eine Zeile ergänzt, achtet darauf, dass sie NICHT anderswo statisch
 * importiert wird – sonst ist der Effekt sofort wieder weg.
 */
import { firstAidTopics } from "@/data/firstAid";
import { cloudBandLabels, cloudEntries } from "@/data/clouds";
import { knotCategoryLabels, knots } from "@/data/knots";
import { gearRepairGuides } from "@/data/gearRepair";
import { tentCareGuides } from "@/data/tentCare";
import { groupLabels, modules } from "@/data/modules";
import { natureEntries } from "@/data/nature";
import { recipes } from "@/data/recipes";
import { RECIPE_METHOD_LABELS } from "@shared/customRecipes";
import { l4, pick, type L4, type Language } from "@shared/i18n";
import { normalizeText } from "@shared/textMatch";
import {
  shorten,
  type IndexEntry,
  type SearchCategory,
} from "@/lib/searchIndexEntry";

const MIN_ABBR = l4("Min.", "min", "min", "min");
const INGREDIENTS_LABEL = l4(
  "Zutaten",
  "Ingrédients",
  "Ingredienti",
  "Ingredients"
);

/** Index für eine Sprache aufbauen (Aufrufer cachet das Ergebnis). */
export function buildIndex(lang: Language): IndexEntry[] {
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
  // Wolken: der lateinische Name ist bewusst im Suchtext, damit auch «Cirrus»
  // oder «Cumulonimbus» aus einer anderen Wetter-App hier landen
  for (const c of cloudEntries) {
    add(`cloud-${c.id}`, p(c.name), "clouds", "/wolken", p(c.meaning), [
      c.latin,
      p(cloudBandLabels[c.band]),
      p(c.appearance),
      p(c.meaning),
      p(c.campTip),
    ]);
  }
  // Pflege-Anleitungen: gesucht wird meist nach dem Problem («Schimmel»,
  // «Reissverschluss»), deshalb stehen Anlass und Fehler mit im Suchtext
  for (const [prefix, path, guides] of [
    ["tentcare", "/zeltpflege", tentCareGuides],
    ["gearrepair", "/reparatur", gearRepairGuides],
  ] as const) {
    for (const g of guides) {
      add(`${prefix}-${g.id}`, p(g.title), "care", path, p(g.summary), [
        p(g.summary),
        p(g.when),
        ...g.materials.map(m => p(m)),
        ...g.steps.map(s => `${p(s.title)} ${p(s.text)}`),
        p(g.mistake),
      ]);
    }
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
