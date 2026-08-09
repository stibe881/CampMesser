/**
 * Was die letzten Reisen über diese Liste sagen (#381).
 *
 * DIE GEGENSTÜCK-KARTE ZUM RÜCKBLICK: Dort wird festgehalten, was nicht
 * nötig war und was gefehlt hat; hier kommt es zurück – vor der nächsten
 * Reise, wo es etwas nützt.
 *
 * ZWEI SEHR VERSCHIEDENE SCHWELLEN, und das ist Absicht:
 *
 *   Nicht gebraucht  erst ab dem ZWEITEN Mal. Einmal ist Wetter – die
 *                    Sonnencreme im verregneten Juli kommt wieder mit.
 *   Hat gefehlt      schon beim ERSTEN Mal. Etwas zu vergessen, das man
 *                    gebraucht hätte, ist teuer; ein zweiter Blick
 *                    kostet nichts.
 *
 * GESTRICHEN WIRD NICHTS AUTOMATISCH. Beim Nicht-Gebrauchten steht die
 * Beobachtung samt Anzahl, ohne Knopf: Ob die Regenhose mitkommt,
 * entscheidet die Prognose und nicht die Statistik. Beim Gefehlten gibt
 * es einen Knopf – da ist die Entscheidung schon gefallen, es fehlt nur
 * noch der Eintrag.
 */
import { useMemo } from "react";
import { History, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";
import { trpc } from "@/lib/trpc";
import {
  missingSuggestions,
  summarizeFeedback,
  unusedHints,
} from "@shared/packFeedback";

export default function PackExperienceHints({ listId }: { listId: number }) {
  const t = useT();
  const pe = t.packExperience;
  const utils = trpc.useUtils();
  const itemsQuery = trpc.packing.items.useQuery({ listId });
  const feedbackQuery = trpc.packing.feedback.list.useQuery();

  const addMutation = trpc.packing.addItems.useMutation({
    onSuccess: (_data, vars) => {
      utils.packing.items.invalidate({ listId });
      utils.packing.progress.invalidate({ listId });
      toast.success(pe.added(vars.items[0]?.name ?? ""));
    },
    onError: () => toast.error(t.common.saveFailed),
  });

  const items = useMemo(() => itemsQuery.data?.items ?? [], [itemsQuery.data]);
  const summary = useMemo(
    () => summarizeFeedback(feedbackQuery.data ?? []),
    [feedbackQuery.data]
  );
  const unused = useMemo(() => unusedHints(items, summary), [items, summary]);
  const missing = useMemo(
    () => missingSuggestions(items, summary),
    [items, summary]
  );

  if (unused.length === 0 && missing.length === 0) return null;

  return (
    <div className="mt-2 rounded-lg border border-border bg-card p-3">
      <p className="flex items-center gap-2 text-sm font-medium">
        <History className="h-4 w-4 text-primary" aria-hidden="true" />
        {pe.title}
      </p>

      {missing.length > 0 && (
        <>
          <p className="mt-2 text-xs text-muted-foreground">{pe.missingHint}</p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {missing.map(entry => (
              <li key={entry.name}>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={addMutation.isPending}
                  aria-label={pe.addAria(entry.name)}
                  onClick={() =>
                    addMutation.mutate({
                      listId,
                      items: [
                        {
                          name: entry.name,
                          // Kategorie und Person aus dem Rückblick; alte
                          // Meldungen ohne Angabe landen wie bisher in
                          // «Allgemein»
                          category: entry.category ?? "Allgemein",
                          quantity: 1,
                          assignee: entry.person,
                        },
                      ],
                    })
                  }
                >
                  <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                  {entry.name}
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}

      {unused.length > 0 && (
        <>
          <p className="mt-3 text-xs text-muted-foreground">{pe.unusedHint}</p>
          <ul className="mt-1 space-y-0.5">
            {unused.map(entry => (
              <li key={entry.name} className="text-sm">
                <span className="font-medium">{entry.name}</span>{" "}
                <span className="text-xs text-muted-foreground">
                  {pe.unusedCount(entry.unusedTrips)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
