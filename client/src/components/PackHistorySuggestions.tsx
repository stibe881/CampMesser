/**
 * Packvorschlag aus vergangenen Reisen (#277).
 *
 * Zeigt nur, was auf FRÜHEREN Listen desselben Zeltplatzes wirklich
 * stand – keine weitere Standardliste, sondern die eigene Erfahrung.
 * Fehlt die Verknüpfung zu einem Platz oder gab es dort noch keine
 * frühere Reise, erscheint der Abschnitt gar nicht: Ein leerer Kasten
 * ist keine Information.
 */
import { History, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { suggestionShare } from "@shared/packHistory";

export default function PackHistorySuggestions({
  listId,
  className,
}: {
  listId: number;
  className?: string;
}) {
  const { t } = useI18n();
  const th = t.packHistory;
  const utils = trpc.useUtils();
  const query = trpc.packHistory.forList.useQuery({ listId });

  const addMutation = trpc.packing.addItems.useMutation({
    onSuccess: () => {
      void utils.packing.items.invalidate({ listId });
      void utils.packHistory.forList.invalidate({ listId });
    },
    onError: () => toast.error(t.packListDetail.addFailed),
  });

  const data = query.data;
  if (!data || data.suggestions.length === 0) return null;

  const addAll = () =>
    addMutation.mutate({
      listId,
      items: data.suggestions.map(s => ({
        name: s.name,
        category: s.category,
        quantity: 1,
      })),
    });

  return (
    <section
      className={cn("rounded-xl border border-border bg-card p-4", className)}
      aria-label={th.sectionAria}
    >
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 className="font-serif text-lg font-semibold">{th.title}</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {th.subtitle(data.tripCount)}
      </p>

      <ul className="mt-3 flex flex-wrap gap-1.5">
        {data.suggestions.map(suggestion => {
          const share = suggestionShare(suggestion, data.tripCount);
          const everyTime = share >= 1;
          return (
            <li key={suggestion.name}>
              <button
                type="button"
                onClick={() =>
                  addMutation.mutate({
                    listId,
                    items: [
                      {
                        name: suggestion.name,
                        category: suggestion.category,
                        quantity: 1,
                      },
                    ],
                  })
                }
                disabled={addMutation.isPending}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors disabled:opacity-60",
                  everyTime
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border bg-background hover:border-primary/40"
                )}
                aria-label={th.addAria(suggestion.name)}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                {suggestion.name}
                <span className="text-xs opacity-70">
                  {everyTime
                    ? th.everyTime
                    : th.tripCount(suggestion.trips, data.tripCount)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <Button
        size="sm"
        variant="outline"
        className="mt-3"
        onClick={addAll}
        disabled={addMutation.isPending}
      >
        {th.addAll(data.suggestions.length)}
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">{th.note}</p>
    </section>
  );
}
