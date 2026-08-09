/**
 * Globale Suche über alle Offline-Wissensmodule: Erste Hilfe, Knoten,
 * Rezepte und Natur-Lexikon. Der Index wird pro Sprache einmal aufgebaut
 * und danach behalten – funktioniert komplett offline. Alle Textfelder
 * laufen durch `pick()`, damit sowohl heutige string- als auch künftige
 * L4-Felder korrekt in der aktiven Sprache landen.
 *
 * WICHTIG: Die Wissensdaten selbst liegen in `knowledgeIndex.ts` und werden
 * NUR per `await import()` geholt (`ensureKnowledgeIndex`). Grund: Es sind
 * gegen 500 kB Text in vier Sprachen; statisch importiert hingen sie am
 * Haupt-Bundle und verzögerten jeden Erstaufruf der App – auch für alle,
 * die gar nie ins Suchfeld tippen. Deshalb liefert `searchKnowledge` eine
 * leere Liste, solange der Index noch nicht geladen ist; die Oberfläche
 * stösst das Laden beim ersten Fokus aufs Suchfeld an und zeigt so lange
 * einen Hinweis. Eigene Inhalte (`searchOwnContent`) sind davon nicht
 * betroffen und stehen sofort zur Verfügung.
 */
import { LOCALE_TAGS, l4, pick, type L4, type Language } from "@shared/i18n";
import { fuzzyWordMatch, levenshtein, normalizeText } from "@shared/textMatch";
import { parseNextTimeNotes } from "@shared/nextTime";
import { parseNoteTags } from "@shared/notes";
import { parseSpotTariffs } from "@shared/spotTariffs";
import { parseStringList } from "@shared/customRecipes";
import {
  shorten,
  type IndexEntry,
  type SearchCategory,
} from "@/lib/searchIndexEntry";
// Für bestehende Aufrufer bleibt die Kategorie hier abrufbar.
export type { SearchCategory } from "@/lib/searchIndexEntry";

// Die fehlertoleranten Grundfunktionen liegen neu in shared/textMatch.ts,
// damit auch der Resteverwertungs-Abgleich (#235) sie nutzt. Für bestehende
// Aufrufer bleiben sie hier abrufbar.
export { fuzzyWordMatch, levenshtein };

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

const indexCache: Partial<Record<Language, IndexEntry[]>> = {};

/** Läuft gerade ein Ladevorgang? Mehrfach-Aufrufe teilen sich dasselbe Versprechen. */
const pending: Partial<Record<Language, Promise<void>>> = {};

/**
 * Wissensdaten holen und den Index für diese Sprache aufbauen.
 *
 * Mehrfach aufrufbar: Ist der Index da, kehrt der Aufruf sofort zurück;
 * läuft schon ein Ladevorgang, hängt er sich an. Scheitert der Import
 * (offline, Chunk weg), bleibt der Index leer und der nächste Aufruf
 * versucht es erneut – die Suche zeigt dann nur eigene Inhalte.
 */
export function ensureKnowledgeIndex(lang: Language): Promise<void> {
  if (indexCache[lang]) return Promise.resolve();
  const running = pending[lang];
  if (running) return running;
  const task = import("@/lib/knowledgeIndex")
    .then(({ buildIndex }) => {
      indexCache[lang] = buildIndex(lang);
    })
    .catch(() => {
      /* Ohne Wissensdaten bleiben die eigenen Treffer – beim nächsten Mal neu */
    })
    .finally(() => {
      delete pending[lang];
    });
  pending[lang] = task;
  return task;
}

/** Steht der Wissens-Index für diese Sprache bereit? */
export function isKnowledgeIndexReady(lang: Language): boolean {
  return indexCache[lang] !== undefined;
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
 *
 * Bewusst synchron, damit die Trefferliste beim Tippen ohne Flackern
 * mitläuft: Wer sucht, hat den Index über `ensureKnowledgeIndex` bereits
 * angestossen. Fehlt er noch, bleibt die Liste leer statt zu blockieren.
 */
export function searchKnowledge(
  query: string,
  limit = 12,
  lang: Language = "de"
): SearchResult[] {
  const words = queryWords(query);
  if (words.length === 0) return [];
  const index = indexCache[lang];
  if (!index) return [];
  return rankEntries(index, words, limit, lang);
}

/**
 * Eigene Inhalte angemeldeter Nutzer*innen für die globale Suche.
 * Alle Felder sind optional – noch nicht geladene Listen fehlen einfach.
 * Nutzertexte sind einsprachige Strings, laufen aber defensiv durch pick().
 */
export interface OwnContent {
  /**
   * Der geschriebene Inhalt der Reisen (#349): Tages-Journal, Pinnwand,
   * Gästebuch. Bis dahin kannte die Suche zwar die Reise, aber nicht,
   * was darin steht – «wo habe ich notiert, dass der Platz keinen Strom
   * hat?» blieb unbeantwortet.
   *
   * `tripName` kommt vom Aufrufer, weil der Reisename an einer Stelle
   * gebildet wird (shared/tripName.ts) und hier nicht noch einmal.
   */
  tripTexts?: {
    id: string;
    tripId: number;
    tripName: string;
    kind: "journal" | "board" | "guestbook";
    text: string;
    /** Tag beim Journal, Verfasser beim Gästebuch – sonst leer. */
    detail?: string;
  }[];
  packLists?: { id: number; name: string }[];
  /**
   * Plätze. Seit #412 zählen auch die «Beim nächsten Mal»-Merker (#396)
   * und die Tarifnamen (#369) zum Suchtext: «Kabeltrommel» oder
   * «Hauptsaison» tippen soll den Platz finden – beides liegt als JSON
   * am Platz und war für die Suche bis dahin unsichtbar.
   */
  spots?: {
    id: number;
    name: string;
    note?: string | null;
    nextTimeJson?: string | null;
    tariffsJson?: string | null;
  }[];
  /** Eigene Rezepte – seit #435 zählen auch die Zutaten zum Suchtext. */
  recipes?: { id: number; name: string; ingredientsJson?: string | null }[];
  hunts?: { id: number; title: string }[];
  quizzes?: { id: number; title: string }[];
  tentTargets?: { id: string; name: string }[];
  notes?: {
    id: number;
    title?: string | null;
    text: string;
    tags?: string | null;
  }[];
  /**
   * Ausrüstung. «Wo ist die Stirnlampe?» war bis dahin die eine Frage, die
   * die Suche NICHT beantwortete – obwohl Inventar und Kisten genau dafür
   * gebaut sind. Die Kiste steht im Snippet, denn sie ist die Antwort.
   */
  inventory?: {
    id: number;
    name: string;
    category?: string | null;
    notes?: string | null;
    boxName?: string | null;
    boxCode?: string | null;
  }[];
  /** Kisten selbst – gesucht wird nach Name, Kennung und Standort. */
  boxes?: {
    id: number;
    code: string;
    name: string;
    location?: string | null;
    notes?: string | null;
  }[];
  /** Kühlbox und Trockenvorrat. */
  food?: {
    id: number;
    name: string;
    storage?: string | null;
    category?: string | null;
  }[];
  /** Karten & Ausweise (#482): gesucht wird über den Titel. */
  documents?: { id: number; title: string }[];
  /** Tankbuch (#482): gesucht wird über Datum und Kilometerstand. */
  fuelFills?: { id: number; day: string; odometerKm: number }[];
  /** Reisen: gesucht wird über Titel und Ort. */
  trips?: {
    id: number;
    title?: string | null;
    location?: string | null;
    spotName?: string | null;
    startDate?: string | null;
  }[];
  /** Merkorte (#564): gesucht wird über Name und Notiz, Treffer → Karte. */
  savedPlaces?: { id: number; name: string; note?: string | null }[];
  /**
   * Etappen von Rundreisen (#591): «Verona» tippen findet die Reise,
   * die dort Halt macht. `tripName` kommt vom Aufrufer (tripName.ts).
   */
  tripStops?: { id: number; tripId: number; name: string; tripName: string }[];
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
  gear: l4("Ausrüstung", "Équipement", "Attrezzatura", "Gear"),
  box: l4("Kiste", "Caisse", "Cassa", "Box"),
  foodCooled: l4("Kühlbox", "Glacière", "Frigo", "Cool box"),
  foodDry: l4("Trockenvorrat", "Réserve sèche", "Dispensa", "Dry store"),
  trip: l4("Aufenthalt", "Séjour", "Soggiorno", "Stay"),
  document: l4(
    "Ausweis / Karte",
    "Document / carte",
    "Documento / tessera",
    "Document / card"
  ),
  fuel: l4(
    "Tankbuch",
    "Carnet de carburant",
    "Registro carburante",
    "Fuel log"
  ),
  savedPlace: l4("Merkort", "Lieu à retenir", "Luogo salvato", "Saved place"),
  tripStop: l4("Etappe", "Étape", "Tappa", "Stage"),
  journal: l4(
    "Reise-Journal",
    "Journal du séjour",
    "Diario del viaggio",
    "Trip journal"
  ),
  board: l4("Pinnwand", "Tableau", "Bacheca", "Pinboard"),
  guestbook: l4("Gästebuch", "Livre d'or", "Libro degli ospiti", "Guest book"),
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
    // Merker-Notizen und Tarif-Texte in den Suchtext, nicht ins Snippet:
    // Die Antwort auf «Kabeltrommel» ist der Platz, nicht die Notiz.
    const notes = parseNextTimeNotes(spot.nextTimeJson ?? null);
    const tariffTexts = parseSpotTariffs(spot.tariffsJson ?? null).flatMap(
      tariff => [tariff.name, ...tariff.rows.map(row => row.label)]
    );
    add(
      `own-spot-${spot.id}`,
      p(spot.name),
      `/zeltplaetze/${spot.id}`,
      spot.note ? `${kind} · ${spot.note}` : kind,
      [spot.note ?? undefined, ...notes, ...tariffTexts]
    );
  }
  for (const recipe of own.recipes ?? []) {
    // «Reis» tippen soll das eigene Risotto finden (#435): Die Zutaten
    // zählen zum Suchtext – im Snippet bleibt die Rezept-Kennung.
    add(
      `own-recipe-${recipe.id}`,
      p(recipe.name),
      "/rezepte",
      p(OWN_KIND_LABELS.recipe),
      parseStringList(recipe.ingredientsJson ?? "[]")
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
  // Ausrüstung (#307): Der Gegenstand steht im Titel, die Kiste im Snippet –
  // «wo ist die Stirnlampe» wird mit «in K3 · Keller» beantwortet, ohne dass
  // man den Treffer erst öffnen muss.
  for (const item of own.inventory ?? []) {
    const kind = p(OWN_KIND_LABELS.gear);
    const place = [item.boxCode, item.boxName].filter(Boolean).join(" · ");
    add(
      `own-gear-${item.id}`,
      p(item.name),
      "/inventar",
      place ? `${kind} · ${place}` : kind,
      [item.category ?? undefined, item.notes ?? undefined, place || undefined]
    );
  }
  for (const box of own.boxes ?? []) {
    const kind = p(OWN_KIND_LABELS.box);
    const place = box.location?.trim();
    add(
      `own-box-${box.id}`,
      `${box.code} · ${p(box.name)}`,
      `/kisten/${encodeURIComponent(box.code)}`,
      place ? `${kind} · ${place}` : kind,
      [box.name, place, box.notes ?? undefined]
    );
  }
  for (const item of own.food ?? []) {
    const kind =
      item.storage === "dry"
        ? p(OWN_KIND_LABELS.foodDry)
        : p(OWN_KIND_LABELS.foodCooled);
    add(`own-food-${item.id}`, p(item.name), "/kuehlbox", kind, [
      item.category ?? undefined,
    ]);
  }
  // Karten & Ausweise (#482): «acsi» tippen soll die Karte finden.
  for (const card of own.documents ?? []) {
    add(
      `own-doc-${card.id}`,
      p(card.title),
      "/ausweise",
      p(OWN_KIND_LABELS.document)
    );
  }
  // Tankbuch (#482): gesucht wird über Datum und Kilometerstand – mehr
  // Text hat eine Tankfüllung nicht.
  for (const fill of own.fuelFills ?? []) {
    add(
      `own-fuel-${fill.id}`,
      `${fill.day} · ${fill.odometerKm} km`,
      "/tankbuch",
      p(OWN_KIND_LABELS.fuel)
    );
  }
  // Merkorte (#564): «Ossiacher See» tippen → Sprung auf die Karte zum
  // Stern. Die Notiz zählt zum Suchtext und steht im Snippet.
  for (const place of own.savedPlaces ?? []) {
    const kind = p(OWN_KIND_LABELS.savedPlace);
    add(
      `own-saved-place-${place.id}`,
      p(place.name),
      "/karte",
      place.note ? `${kind} · ${place.note}` : kind,
      [place.note ?? undefined]
    );
  }
  // Etappen (#591): Der Etappen-Ort führt zur Rundreise – im Snippet
  // steht, zu WELCHER Reise die Station gehört.
  for (const stop of own.tripStops ?? []) {
    add(
      `own-trip-stop-${stop.id}`,
      p(stop.name),
      `/tagebuch/${stop.tripId}`,
      `${p(OWN_KIND_LABELS.tripStop)} · ${stop.tripName}`,
      [stop.tripName]
    );
  }
  // Aufenthalte: Titel ODER Ort führen zum Ziel – man erinnert sich mal an
  // das eine, mal an das andere.
  for (const trip of own.trips ?? []) {
    const name = trip.title?.trim() || trip.spotName || trip.location;
    if (!name) continue;
    const kind = p(OWN_KIND_LABELS.trip);
    const place = trip.spotName || trip.location || "";
    const detail = [place, trip.startDate ?? ""].filter(Boolean).join(" · ");
    add(
      `own-trip-${trip.id}`,
      p(name),
      `/tagebuch/${trip.id}`,
      detail ? `${kind} · ${detail}` : kind,
      [place || undefined, trip.title ?? undefined]
    );
  }
  // Freie Notizen (#246): gesucht wird über Titel, Text UND Stichwörter.
  // Ohne Titel trägt die erste Textzeile die Überschrift – eine Notiz ganz
  // ohne Titel soll im Treffer trotzdem wiedererkennbar sein.
  /**
   * Der geschriebene Inhalt einer Reise (#349). Der TEXT ist hier die
   * Überschrift – man sucht ja nach dem, was man geschrieben hat, nicht
   * nach «Journal». Der Reisename steht daneben, damit man weiss, welcher
   * Aufenthalt gemeint ist.
   *
   * Das Ziel ist die Reise-Seite mit dem passenden Abschnitt AUFGEKLAPPT
   * (#344): Ohne den Hash landete man auf einer Seite voller zugeklappter
   * Balken und müsste den Treffer noch einmal suchen.
   */
  const TRIP_TEXT_HASH = {
    journal: "#journal",
    board: "#pinnwand",
    guestbook: "#gaestebuch",
  } as const;
  for (const entry of own.tripTexts ?? []) {
    const firstLine = entry.text.split("\n")[0]?.trim() ?? "";
    const title = firstLine || entry.text.trim();
    if (!title) continue;
    const kind = p(OWN_KIND_LABELS[entry.kind]);
    const detail = [entry.tripName, entry.detail].filter(Boolean).join(" · ");
    add(
      `own-triptext-${entry.id}`,
      title,
      `/tagebuch/${entry.tripId}${TRIP_TEXT_HASH[entry.kind]}`,
      detail ? `${kind} · ${detail}` : kind,
      // Der ganze Text in den Suchkörper, nicht nur die erste Zeile:
      // Gesucht wird oft nach einem Wort mitten im Eintrag.
      [entry.text, entry.tripName]
    );
  }
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
