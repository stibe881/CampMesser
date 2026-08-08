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
import { useEffect, useState } from "react";
import { ChevronDown, Plus, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useT } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { cleanFeedbackName, MAX_MISSING_PER_TRIP } from "@shared/packFeedback";

export default function TripReview({
  tripId,
  packListId,
  tripName,
}: {
  tripId: number;
  /** Verknüpfte Packliste; ohne sie gibt es nichts abzuhaken. */
  packListId: number | null;
  tripName: string;
}) {
  const t = useT();
  const tr = t.tripReview;
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [unused, setUnused] = useState<Set<string>>(new Set());
  const [missing, setMissing] = useState<string[]>([]);
  const [draft, setDraft] = useState("");

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
    setMissing(mine.filter(r => r.kind === "missing").map(r => r.name));
    setLoaded(true);
  }, [open, loaded, feedbackQuery.data, tripId]);

  // `packing.items` liefert Liste, Mitglieder UND Einträge – hier zählt
  // nur der letzte Teil.
  const items = itemsQuery.data?.items ?? [];
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
    if (!missing.includes(clean)) setMissing(prev => [...prev, clean]);
    setDraft("");
  };

  return (
    <div className="mt-2 rounded-xl border border-border p-3">
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
          {packListId === null ? (
            <p className="mt-1 text-xs text-muted-foreground">{tr.noList}</p>
          ) : items.length === 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">{tr.emptyList}</p>
          ) : (
            <ul className="mt-1.5 space-y-1">
              {items.map(item => (
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
          )}

          <p className="mt-4 text-sm font-medium">{tr.missingTitle}</p>
          <div className="mt-1.5 flex gap-2">
            <Input
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
              {missing.map(name => (
                <li key={name}>
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs hover:bg-accent"
                    aria-label={tr.missingRemove(name)}
                    onClick={() =>
                      setMissing(prev => prev.filter(x => x !== name))
                    }
                  >
                    {name}
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
                unused: Array.from(unused),
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
