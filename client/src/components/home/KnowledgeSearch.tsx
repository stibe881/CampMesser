/**
 * Aus Home.tsx herausgelöst (#419): Die Startseite war mit 2005 Zeilen
 * die grösste Datei im Client – die Widgets wohnen jetzt hier (Muster
 * wie Trips #322 und Profil #414).
 */
import { Link } from "wouter";
import { fmtShort } from "@/lib/dateFormat";
import { Search } from "lucide-react";
import { useI18n } from "@/i18n";
import { useEffect, useMemo, useState } from "react";
import {
  ensureKnowledgeIndex,
  isKnowledgeIndexReady,
  searchKnowledge,
  searchOwnContent,
} from "@/lib/globalSearch";
import {
  TARGETS_KEY,
  sanitizeTargets,
  type TentFinderTarget,
} from "@/lib/tentFinderTargets";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { tripDisplayName } from "@shared/tripName";

/**
 * Globale Suche über die Offline-Wissensmodule (Erste Hilfe, Knoten, Rezepte,
 * Natur) – angemeldet zusätzlich über eigene Inhalte (Packlisten, Zeltplätze,
 * eigene Rezepte/Jagden/Quizze, Zelt-Finder-Ziele, Notizen). Die Nutzerdaten werden
 * erst geladen, wenn das Suchfeld benutzt wird (enabled-Flag), nicht beim
 * Seitenaufbau.
 */
const RECENT_SEARCHES_KEY = "campmesser.recentSearches";

function loadRecentSearches(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) ?? "[]");
    if (Array.isArray(raw)) {
      return raw.filter(v => typeof v === "string" && v.trim()).slice(0, 8);
    }
  } catch {
    /* egal */
  }
  return [];
}

export default function KnowledgeSearch({
  className = "mb-8",
}: {
  /** Aussenabstand/Breite – im Hero (#556) anders als früher im Grid. */
  className?: string;
}) {
  const { lang, t } = useI18n();
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState("");
  const [activated, setActivated] = useState(false);
  const [tentTargets, setTentTargets] = useState<TentFinderTarget[]>([]);
  const [focused, setFocused] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  /**
   * Steht der Wissens-Index bereit? Er wird erst beim ersten Fokus geholt
   * (gegen 500 kB Text in vier Sprachen, siehe lib/globalSearch.ts) – bis
   * dahin erscheinen nur eigene Treffer, mit Hinweis statt «nichts gefunden».
   */
  const [indexReady, setIndexReady] = useState(() =>
    isKnowledgeIndexReady(lang)
  );

  /** Suchbegriff beim Klick auf ein Resultat in den Verlauf aufnehmen. */
  const rememberSearch = () => {
    const term = query.trim();
    if (term.length < 2) return;
    const next = [
      term,
      ...recent.filter(r => r.toLowerCase() !== term.toLowerCase()),
    ].slice(0, 8);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    } catch {
      /* egal */
    }
  };

  // Sprachwechsel bei offenem Suchfeld: Der Index gilt pro Sprache, der
  // neue muss also erst gebaut werden.
  useEffect(() => {
    setIndexReady(isKnowledgeIndexReady(lang));
    if (!activated) return;
    void ensureKnowledgeIndex(lang).then(() => setIndexReady(true));
  }, [lang, activated]);

  const clearRecent = () => {
    setRecent([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      /* egal */
    }
  };

  const enabled = isAuthenticated && activated;
  const queryOpts = { enabled, staleTime: 60_000 } as const;
  const packListsQuery = trpc.packing.lists.useQuery(undefined, queryOpts);
  const spotsQuery = trpc.spots.list.useQuery(undefined, queryOpts);
  const recipesQuery = trpc.recipes.list.useQuery(undefined, queryOpts);
  const huntsQuery = trpc.hunts.list.useQuery(undefined, queryOpts);
  const quizzesQuery = trpc.quizzes.list.useQuery(undefined, queryOpts);
  const notesQuery = trpc.notes.list.useQuery(undefined, queryOpts);
  // Ausrüstung, Kisten, Vorräte und Aufenthalte (#307): Genau danach fragt
  // man unterwegs («wo ist die Stirnlampe», «in welcher Kiste ist der
  // Kocher»), und genau das fand die Suche bisher nicht. Geladen wird erst
  // beim Antippen des Suchfelds – wie alle anderen Listen hier auch.
  const gearQuery = trpc.inventory.list.useQuery(undefined, queryOpts);
  const boxesQuery = trpc.boxes.list.useQuery(undefined, queryOpts);
  const foodQuery = trpc.food.list.useQuery(undefined, queryOpts);
  const searchTripsQuery = trpc.trips.list.useQuery(undefined, queryOpts);
  // Ausweise & Tankbuch (#482): auch die sollen sich ertippen lassen
  const documentsQuery = trpc.documents.list.useQuery(undefined, queryOpts);
  const fuelLogQuery = trpc.fuelLog.list.useQuery(undefined, queryOpts);
  // Der geschriebene Inhalt der Reisen (#349): Journal, Pinnwand,
  // Gästebuch. Wie alle Listen hier erst beim Antippen des Suchfelds –
  // es sind alle Journal-Texte auf einmal, und wer nie sucht, holt nichts.
  const tripTextsQuery = trpc.trips.texts.useQuery(undefined, queryOpts);

  /**
   * Journal-, Pinnwand- und Gästebuch-Einträge in eine Liste für die Suche
   * (#349). Der REISENAME kommt hier dazu, weil ihn `tripDisplayName` an
   * einer Stelle bildet (#329) – ein Treffer ohne «zu welcher Reise
   * gehört das» wäre die halbe Antwort.
   */
  const tripTexts = useMemo(() => {
    const raw = tripTextsQuery.data;
    if (!raw) return undefined;
    const names = new Map(
      (searchTripsQuery.data ?? []).map(trip => [
        trip.id,
        tripDisplayName(trip, lang),
      ])
    );
    const nameOf = (tripId: number) => names.get(tripId) ?? "";
    return [
      ...raw.journal.map(entry => ({
        id: `journal-${entry.id}`,
        tripId: entry.tripId,
        tripName: nameOf(entry.tripId),
        kind: "journal" as const,
        text: entry.text,
        detail: fmtShort(entry.day, lang),
      })),
      ...raw.board.map(entry => ({
        id: `board-${entry.id}`,
        tripId: entry.tripId,
        tripName: nameOf(entry.tripId),
        kind: "board" as const,
        text: entry.text,
      })),
      ...raw.guestbook.map(entry => ({
        id: `guestbook-${entry.id}`,
        tripId: entry.tripId,
        tripName: nameOf(entry.tripId),
        kind: "guestbook" as const,
        text: entry.text,
        detail: entry.authorName,
      })),
    ];
  }, [tripTextsQuery.data, searchTripsQuery.data, lang]);

  /**
   * Beim ersten Fokus/Tippen: Wissens-Index nachladen, tRPC-Queries
   * freischalten, lokale Ziele lesen. Der Index kommt bewusst hier und
   * nicht beim Seitenaufbau – siehe lib/globalSearch.ts.
   */
  const activate = () => {
    void ensureKnowledgeIndex(lang).then(() => setIndexReady(true));
    if (activated) return;
    setActivated(true);
    setRecent(loadRecentSearches());
    try {
      setTentTargets(
        sanitizeTargets(JSON.parse(localStorage.getItem(TARGETS_KEY) ?? "[]"))
      );
    } catch {
      // Kaputter localStorage-Wert: dann eben ohne Zelt-Finder-Ziele suchen
    }
  };

  const hasQuery = query.trim().length >= 2;
  const ownResults =
    hasQuery && isAuthenticated
      ? searchOwnContent(
          query,
          {
            packLists: packListsQuery.data,
            spots: spotsQuery.data,
            recipes: recipesQuery.data,
            hunts: huntsQuery.data,
            quizzes: quizzesQuery.data,
            tentTargets,
            notes: notesQuery.data,
            inventory: gearQuery.data?.map(item => {
              // Die Kiste steht am Gegenstand nur als Id – der Name kommt
              // aus der Kisten-Liste, die ohnehin schon geladen ist.
              const box = boxesQuery.data?.find(b => b.id === item.boxId);
              return {
                id: item.id,
                name: item.name,
                category: item.category,
                notes: item.notes,
                boxName: box?.name ?? null,
                boxCode: box?.code ?? null,
              };
            }),
            boxes: boxesQuery.data,
            food: foodQuery.data,
            trips: searchTripsQuery.data?.map(trip => ({
              id: trip.id,
              title: trip.title,
              location: trip.location,
              spotName: trip.spotName,
              startDate: trip.startDate,
            })),
            tripTexts: tripTexts,
            documents: documentsQuery.data,
            fuelFills: fuelLogQuery.data,
          },
          6,
          lang
        )
      : [];
  const results = hasQuery ? searchKnowledge(query, 8, lang) : [];
  // Eigene Treffer stehen vor den statischen Wissens-Inhalten
  const combined = [...ownResults, ...results];
  return (
    <div className={className}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onFocus={() => {
            activate();
            setFocused(true);
          }}
          onBlur={() => {
            // Verzögert, damit Klicks auf die Verlaufs-Chips noch greifen
            window.setTimeout(() => setFocused(false), 150);
          }}
          onChange={e => {
            activate();
            setQuery(e.target.value);
          }}
          placeholder={t.home.searchPlaceholder}
          aria-label={t.home.searchAria}
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50"
        />
      </div>
      {!hasQuery && focused && recent.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">
            {t.home.recentSearches}
          </span>
          {recent.map(term => (
            <button
              key={term}
              type="button"
              onClick={() => setQuery(term)}
              className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {term}
            </button>
          ))}
          <button
            type="button"
            onClick={clearRecent}
            aria-label={t.home.recentSearchesClear}
            className="rounded-full px-1.5 py-1 text-xs text-muted-foreground/70 underline-offset-2 hover:underline"
          >
            {t.home.recentSearchesClear}
          </button>
        </div>
      )}
      {hasQuery && (
        <div className="mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {combined.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              {/* Ohne Index wäre «nichts gefunden» schlicht gelogen – die
                  Wissensmodule sind dann noch gar nicht durchsucht. */}
              {indexReady ? t.home.searchNoResults : t.home.searchPreparing}
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {combined.map(r => (
                <li key={r.id}>
                  <Link
                    href={r.path}
                    onClick={rememberSearch}
                    className="flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-accent/50"
                  >
                    <span className="mt-0.5 shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-secondary-foreground">
                      {t.home.searchCategories[r.module]}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">
                        {r.title}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {r.snippet}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
