/**
 * Der Rückblick nach der Reise (#381).
 *
 * ZWEI FRAGEN, MEHR NICHT: Was hast du nicht gebraucht? Was hat gefehlt?
 * Alles Weitere («war zu schwer», «war kaputt») wäre ein Formular, das
 * niemand ausfüllt – und ein Rückblick, den niemand ausfüllt, verbessert
 * keine Packliste.
 *
 * ERST NACH DER REISE: Vorher weiss man es nicht, und die Karte wäre nur
 * ein weiterer grauer Balken in einer Liste, die seit #359 schlank sein
 * soll. Sie steht deshalb bei den vergangenen Reisen, hinter dem
 * «Mehr»-Schalter.
 *
 * WAS DARAUS WIRD, steht in `shared/packFeedback.ts`: gezählt über die
 * Reisen hinweg, und erst ab dem zweiten Mal wird aus einer Beobachtung
 * ein Hinweis. Entschieden wird nie automatisch – die App streicht
 * nichts und fügt nichts ein.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Plus, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { cleanFeedbackName, MAX_MISSING_PER_TRIP } from "@shared/packFeedback";

export default function TripReview({
  tripId,
  packListId,
  tripName,
  initialOpen = false,
}: {
  tripId: number;
  /** Verknüpfte Packliste; ohne sie gibt es nichts abzuhaken. */
  packListId: number | null;
  tripName: string;
  /**
   * Offen starten und in Sicht scrollen (?rueckblick=1): Der Link der
   * Heimkehr-Karte soll DIREKT hier landen, nicht auf der Reise-Karte,
   * unter der man den Rückblick erst suchen muss.
   */
  initialOpen?: boolean;
}) {
  const t = useT();
  const tr = t.tripReview;
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(initialOpen);
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!initialOpen) return;
    // Nach dem ersten Rendern scrollen – der Abschnitt liegt in einer
    // LazySection, direkt beim Mount stimmt die Position noch nicht.
    const timer = window.setTimeout(() => {
      containerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [initialOpen]);
  const [unused, setUnused] = useState<Set<string>>(new Set());
  const [missing, setMissing] = useState<
    { name: string; category: string | null; person: string | null }[]
  >([]);
  const [draft, setDraft] = useState("");
  /** Kategorie fürs nächste fehlende Ding; "" = ohne Kategorie. */
  const [draftCategory, setDraftCategory] = useState("");
  /** Person fürs nächste fehlende Ding; "" = «Allgemein». */
  const [draftPerson, setDraftPerson] = useState("");
  /**
   * Personen-Filter wie auf der Packliste (Nutzerwunsch 09.08.2026):
   * null = alle Bereiche, "" = «Allgemein» (ohne Person), sonst der Name.
   */
  const [personFilter, setPersonFilter] = useState<string | null>(null);

  const itemsQuery = trpc.packing.items.useQuery(
    { listId: packListId ?? 0 },
    { enabled: open && packListId !== null }
  );
  const feedbackQuery = trpc.packing.feedback.list.useQuery(undefined, {
    enabled: open,
  });
  const saveMutation = trpc.packing.feedback.save.useMutation({
    onSuccess: () => {
      toast.success(tr.saved);
      void utils.packing.feedback.list.invalidate();
    },
    onError: () => toast.error(t.common.saveFailed),
  });

  /**
   * Den gespeicherten Stand übernehmen, sobald er da ist – aber nur
   * einmal je Öffnen. Sonst würde jedes Neuladen der Abfrage die
   * Eingaben überschreiben, an denen man gerade sitzt.
   */
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!open || loaded || !feedbackQuery.data) return;
    const mine = feedbackQuery.data.filter(row => row.tripId === tripId);
    setUnused(new Set(mine.filter(r => r.kind === "unused").map(r => r.name)));
    setMissing(
      mine
        .filter(r => r.kind === "missing")
        .map(r => ({
          name: r.name,
          category: r.category ?? null,
          person: r.person ?? null,
        }))
    );
    setLoaded(true);
  }, [open, loaded, feedbackQuery.data, tripId]);

  // `packing.items` liefert Liste, Mitglieder UND Einträge – hier zählt
  // nur der letzte Teil.
  const items = useMemo(
    () => itemsQuery.data?.items ?? [],
    [itemsQuery.data?.items]
  );
  /**
   * Personen-Bereiche wie auf der Packliste (#127): jede zugeteilte
   * Person einmal, in der Reihenfolge ihres ersten Auftauchens. Gibt es
   * keine, verschwinden Filter und Personen-Auswahl komplett.
   */
  const persons = useMemo(() => {
    const seenPersons = new Set<string>();
    const list: string[] = [];
    for (const item of items) {
      const name = item.assignee?.trim();
      if (!name || seenPersons.has(name)) continue;
      seenPersons.add(name);
      list.push(name);
    }
    return list;
  }, [items]);
  const hasGeneralItems = useMemo(
    () => items.some(item => !item.assignee?.trim()),
    [items]
  );
  /** Die Einträge des gewählten Personen-Bereichs (null = alle). */
  const visibleItems = useMemo(() => {
    if (personFilter === null) return items;
    return items.filter(item => (item.assignee?.trim() || "") === personFilter);
  }, [items, personFilter]);
  /**
   * Nach Kategorien gruppiert, in der Reihenfolge ihres ersten
   * Auftauchens – dieselbe Ordnung wie auf der Packliste selbst
   * (Nutzerwunsch 09.08.2026: keine flache Liste mehr).
   */
  const grouped = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const item of visibleItems) {
      const key = item.category?.trim() || "";
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [visibleItems]);
  /** Kategorien der GANZEN Liste – für die Auswahl beim fehlenden Ding. */
  const categories = useMemo(() => {
    const seenCategories = new Set<string>();
    const list: string[] = [];
    for (const item of items) {
      const key = item.category?.trim();
      if (!key || seenCategories.has(key)) continue;
      seenCategories.add(key);
      list.push(key);
    }
    return list;
  }, [items]);
  /** Person eines abgehakten Eintrags – fürs Speichern (erster Treffer). */
  const personOf = (name: string): string | null => {
    const item = items.find(entry => entry.name === name);
    return item?.assignee?.trim() || null;
  };
  const toggle = (name: string) =>
    setUnused(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const addMissing = () => {
    const clean = cleanFeedbackName(draft);
    if (!clean || missing.length >= MAX_MISSING_PER_TRIP) return;
    if (!missing.some(entry => entry.name === clean)) {
      setMissing(prev => [
        ...prev,
        {
          name: clean,
          category: draftCategory || null,
          person: draftPerson || null,
        },
      ]);
    }
    setDraft("");
  };

  return (
    <div
      ref={containerRef}
      className="mt-2 scroll-mt-16 rounded-xl border border-border p-3"
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 text-left"
        aria-expanded={open}
        aria-label={tr.toggleAria(tripName)}
        onClick={() => setOpen(value => !value)}
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <RotateCcw className="h-4 w-4 text-primary" aria-hidden="true" />
          {tr.title}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="mt-3">
          <p className="text-xs text-muted-foreground">{tr.intro}</p>

          <p className="mt-3 text-sm font-medium">{tr.unusedTitle}</p>
          {/* Personen-Bereiche wie auf der Packliste (#127): filtern statt
              alles auf einmal – wer den eigenen Rucksack durchgeht, will
              nicht durch fremde Zeilen scrollen. */}
          {persons.length > 0 && items.length > 0 && (
            <div
              className="mt-1.5 flex flex-wrap gap-1.5"
              role="group"
              aria-label={tr.personFilterAria}
            >
              {[
                { value: null as string | null, label: tr.personAll },
                ...(hasGeneralItems
                  ? [{ value: "" as string | null, label: tr.personGeneral }]
                  : []),
                ...persons.map(person => ({
                  value: person as string | null,
                  label: person,
                })),
              ].map(option => (
                <button
                  key={option.value ?? "__alle__"}
                  type="button"
                  aria-pressed={personFilter === option.value}
                  onClick={() => setPersonFilter(option.value)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    personFilter === option.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
          {packListId === null ? (
            <p className="mt-1 text-xs text-muted-foreground">{tr.noList}</p>
          ) : items.length === 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">{tr.emptyList}</p>
          ) : (
            <div className="mt-1.5 space-y-2.5">
              {grouped.map(([category, groupItems]) => (
                <div key={category || "__ohne__"}>
                  <p className="text-xs font-medium text-muted-foreground">
                    {category || tr.noCategory}
                  </p>
                  <ul className="mt-1 space-y-1">
                    {groupItems.map(item => (
                      <li key={item.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`review-${item.id}`}
                          checked={unused.has(item.name)}
                          onCheckedChange={() => toggle(item.name)}
                        />
                        <label
                          htmlFor={`review-${item.id}`}
                          className="min-w-0 flex-1 truncate text-sm"
                        >
                          {item.name}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          <p className="mt-4 text-sm font-medium">{tr.missingTitle}</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <Input
              className="min-w-0 flex-1 basis-40"
              value={draft}
              placeholder={tr.missingPlaceholder}
              aria-label={tr.missingTitle}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addMissing();
                }
              }}
            />
            {/* Kategorie wie beim Eintragen auf der Packliste (#126) –
                der Vorschlag landet später gleich in der richtigen
                Gruppe statt in «Allgemein». */}
            {categories.length > 0 && (
              <Select
                value={draftCategory || "__ohne__"}
                onValueChange={value =>
                  setDraftCategory(value === "__ohne__" ? "" : value)
                }
              >
                <SelectTrigger
                  className="w-36 shrink-0"
                  aria-label={tr.missingCategoryAria}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__ohne__">{tr.noCategory}</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {/* Person wie auf der Packliste – der Vorschlag landet später
                gleich im richtigen Personen-Bereich. */}
            {persons.length > 0 && (
              <Select
                value={draftPerson || "__ohne__"}
                onValueChange={value =>
                  setDraftPerson(value === "__ohne__" ? "" : value)
                }
              >
                <SelectTrigger
                  className="w-36 shrink-0"
                  aria-label={tr.missingPersonAria}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__ohne__">{tr.personGeneral}</SelectItem>
                  {persons.map(person => (
                    <SelectItem key={person} value={person}>
                      {person}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={tr.missingAdd}
              disabled={missing.length >= MAX_MISSING_PER_TRIP}
              onClick={addMissing}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          {missing.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {missing.map(entry => (
                <li key={entry.name}>
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs hover:bg-accent"
                    aria-label={tr.missingRemove(entry.name)}
                    onClick={() =>
                      setMissing(prev =>
                        prev.filter(x => x.name !== entry.name)
                      )
                    }
                  >
                    {entry.name}
                    {entry.category && (
                      <span className="text-muted-foreground">
                        · {entry.category}
                      </span>
                    )}
                    {entry.person && (
                      <span className="text-muted-foreground">
                        · {entry.person}
                      </span>
                    )}
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <Button
            type="button"
            className="mt-4 w-full"
            disabled={saveMutation.isPending}
            onClick={() =>
              saveMutation.mutate({
                tripId,
                // Person des Eintrags mitschicken – der spätere Vorschlag
                // kennt damit den richtigen Personen-Bereich.
                unused: Array.from(unused).map(name => ({
                  name,
                  person: personOf(name),
                })),
                missing,
              })
            }
          >
            {tr.save}
          </Button>
          <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
            {tr.note}
          </p>
        </div>
      )}
    </div>
  );
}
