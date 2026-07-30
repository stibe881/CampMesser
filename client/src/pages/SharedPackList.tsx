import { useParams } from "wouter";
import { ListChecks, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

/**
 * Öffentliche Ansicht einer geteilten Packliste: Mitreisende können ohne
 * Anmeldung mitlesen und gemeinsam abhaken. Der Link-Token dient als Zugang.
 */
export default function SharedPackListPage() {
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";
  const utils = trpc.useUtils();

  const query = trpc.packing.sharedGet.useQuery(
    { token },
    { enabled: token.length >= 8, refetchInterval: 15000 },
  );

  const toggleMutation = trpc.packing.sharedToggle.useMutation({
    onMutate: async input => {
      await utils.packing.sharedGet.cancel({ token });
      const prev = utils.packing.sharedGet.getData({ token });
      utils.packing.sharedGet.setData({ token }, old =>
        old
          ? {
              ...old,
              items: old.items.map(i =>
                i.id === input.itemId ? { ...i, checked: input.checked } : i,
              ),
            }
          : old,
      );
      return { prev };
    },
    onError: (_e, _i, ctx) => {
      utils.packing.sharedGet.setData({ token }, ctx?.prev);
      toast.error("Abhaken fehlgeschlagen");
    },
    onSettled: () => utils.packing.sharedGet.invalidate({ token }),
  });

  if (query.isLoading) {
    return (
      <div className="container max-w-3xl py-6">
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          Geteilte Liste wird geladen …
        </div>
      </div>
    );
  }

  if (!query.data?.list) {
    return (
      <div className="container max-w-3xl py-6">
        <PageHeader title="Liste nicht gefunden" backHref="/" backLabel="Startseite" />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Dieser Teil-Link ist ungültig oder wurde von der Besitzerin bzw. dem Besitzer
            zurückgezogen.
          </CardContent>
        </Card>
      </div>
    );
  }

  const { list, items } = query.data;
  const checkedCount = items.filter(i => i.checked).length;
  const progress = items.length > 0 ? (checkedCount / items.length) * 100 : 0;

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader
        title={list.name}
        subtitle={`Geteilte Packliste · ${checkedCount} von ${items.length} Einträgen gepackt`}
        backHref="/"
        backLabel="Startseite"
      />

      <div className="mb-4 flex items-center gap-2 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
        <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
        Gemeinsames Abhaken: Alle mit diesem Link sehen den gleichen Stand – die Anzeige
        aktualisiert sich automatisch.
      </div>

      <div className="mb-6">
        <Progress value={progress} aria-label={`Fortschritt: ${Math.round(progress)} Prozent gepackt`} />
      </div>

      {items.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <ListChecks className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Diese Liste ist noch leer.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-5">
        {Object.entries(grouped).map(([category, categoryItems]) => (
          <section key={category}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {category}
            </h2>
            <ul className="space-y-1.5">
              {categoryItems.map(item => (
                <li
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-2.5",
                    item.checked && "bg-muted/60",
                  )}
                >
                  <Checkbox
                    id={`shared-item-${item.id}`}
                    checked={item.checked}
                    onCheckedChange={value =>
                      toggleMutation.mutate({ token, itemId: item.id, checked: value === true })
                    }
                    aria-label={`${item.name} abhaken`}
                  />
                  <label
                    htmlFor={`shared-item-${item.id}`}
                    className={cn(
                      "flex-1 cursor-pointer text-sm",
                      item.checked && "text-muted-foreground line-through",
                    )}
                  >
                    {item.name}
                    {item.quantity > 1 && (
                      <span className="ml-1.5 text-xs text-muted-foreground">× {item.quantity}</span>
                    )}
                  </label>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

