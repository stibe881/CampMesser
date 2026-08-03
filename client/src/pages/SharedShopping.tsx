import { useMemo } from "react";
import { useParams } from "wouter";
import { Loader2, ShoppingCart, Users } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { pick } from "@shared/i18n";
import {
  isShoppingCategory,
  SHOPPING_CATEGORIES,
  SHOPPING_CATEGORY_LABELS,
  type ShoppingCategory,
} from "@shared/shopping";

/**
 * Öffentliche Ansicht einer geteilten Einkaufsliste: Mitreisende können ohne
 * Anmeldung mitlesen und beim Einkaufen mit abhaken. Der Link-Token dient als
 * Zugang; ein Refetch-Intervall hält den Stand aller Beteiligten frisch.
 * Seit #215 hängt der Token an EINER persönlichen Liste – deren Name steht
 * als Titel über der Seite.
 */
export default function SharedShoppingPage() {
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";
  const { lang, t } = useI18n();
  const utils = trpc.useUtils();

  const query = trpc.shopping.sharedGet.useQuery(
    { token },
    { enabled: token.length >= 8, refetchInterval: 10000 }
  );

  const toggleMutation = trpc.shopping.sharedToggle.useMutation({
    onMutate: async input => {
      await utils.shopping.sharedGet.cancel({ token });
      const prev = utils.shopping.sharedGet.getData({ token });
      utils.shopping.sharedGet.setData({ token }, old =>
        old
          ? {
              ...old,
              items: old.items.map(i =>
                i.id === input.itemId ? { ...i, checked: input.checked } : i
              ),
            }
          : old
      );
      return { prev };
    },
    onError: (_e, _i, ctx) => {
      utils.shopping.sharedGet.setData({ token }, ctx?.prev);
      toast.error(t.sharedShopping.toggleFailed);
    },
    onSettled: () => utils.shopping.sharedGet.invalidate({ token }),
  });

  const items = useMemo(() => query.data?.items ?? [], [query.data]);
  const openItems = useMemo(() => items.filter(i => !i.checked), [items]);
  const doneItems = useMemo(() => items.filter(i => i.checked), [items]);

  /** Offene Einträge nach Laden-Kategorien gruppiert («Ohne Kategorie» zuletzt). */
  const grouped = useMemo(() => {
    const groups: { key: ShoppingCategory | null; items: typeof openItems }[] =
      [];
    SHOPPING_CATEGORIES.forEach(cat => {
      const catItems = openItems.filter(i => i.category === cat);
      if (catItems.length > 0) groups.push({ key: cat, items: catItems });
    });
    const uncategorized = openItems.filter(
      i => !isShoppingCategory(i.category)
    );
    if (uncategorized.length > 0)
      groups.push({ key: null, items: uncategorized });
    return groups;
  }, [openItems]);

  const groupLabel = (key: ShoppingCategory | null) =>
    key === null
      ? t.shopping.noCategory
      : pick(SHOPPING_CATEGORY_LABELS[key], lang);

  if (query.isLoading) {
    return (
      <div className="container max-w-2xl py-6">
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          {t.sharedShopping.loading}
        </div>
      </div>
    );
  }

  if (!query.data?.active) {
    return (
      <div className="container max-w-2xl py-6">
        <PageHeader
          title={t.sharedShopping.notFoundTitle}
          backHref="/"
          backLabel={t.sharedShopping.backHome}
        />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t.sharedShopping.invalidLink}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-6">
      <PageHeader
        title={query.data.name ?? t.shopping.title}
        subtitle={t.sharedShopping.subtitle(openItems.length, items.length)}
        backHref="/"
        backLabel={t.sharedShopping.backHome}
      />

      <div className="mb-6 flex items-center gap-2 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
        <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t.sharedShopping.sharedInfo}
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <ShoppingCart
              className="h-8 w-8 text-muted-foreground/50"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              {t.sharedShopping.emptyList}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Offene Einträge, nach Laden-Kategorien gruppiert */}
          <section>
            <h2 className="mb-2 font-serif text-base font-semibold">
              {t.shopping.openTitle}
            </h2>
            {openItems.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                {t.sharedShopping.allDone}
              </p>
            ) : (
              <div className="space-y-4">
                {grouped.map(group => (
                  <div key={group.key ?? "none"}>
                    <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {groupLabel(group.key)}
                    </h3>
                    <ul className="overflow-hidden rounded-xl border border-border">
                      {group.items.map(item => (
                        <li
                          key={item.id}
                          className="flex items-center gap-3 border-b border-border/60 bg-card px-3.5 py-2.5 last:border-0"
                        >
                          <Checkbox
                            id={`shared-shopping-${item.id}`}
                            checked={false}
                            onCheckedChange={() =>
                              toggleMutation.mutate({
                                token,
                                itemId: item.id,
                                checked: true,
                              })
                            }
                            aria-label={t.sharedShopping.checkAria(item.name)}
                          />
                          <label
                            htmlFor={`shared-shopping-${item.id}`}
                            className="min-w-0 flex-1 cursor-pointer"
                          >
                            <span className="break-words text-sm">
                              {item.name}
                              {item.quantity && (
                                <span className="ml-2 inline-block rounded bg-muted px-1.5 py-0.5 align-middle text-xs font-medium text-muted-foreground">
                                  {item.quantity}
                                </span>
                              )}
                            </span>
                            {item.note && (
                              <span className="block break-words text-xs text-muted-foreground">
                                {item.note}
                              </span>
                            )}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Erledigte Einträge */}
          {doneItems.length > 0 && (
            <section>
              <h2 className="mb-2 font-serif text-base font-semibold text-muted-foreground">
                {t.shopping.doneTitle}
              </h2>
              <ul className="overflow-hidden rounded-xl border border-border">
                {doneItems.map(item => (
                  <li
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 border-b border-border/60 bg-muted/30 px-3.5 py-2.5 last:border-0"
                    )}
                  >
                    <Checkbox
                      id={`shared-shopping-${item.id}`}
                      checked
                      onCheckedChange={() =>
                        toggleMutation.mutate({
                          token,
                          itemId: item.id,
                          checked: false,
                        })
                      }
                      aria-label={t.sharedShopping.uncheckAria(item.name)}
                    />
                    <label
                      htmlFor={`shared-shopping-${item.id}`}
                      className="min-w-0 flex-1 cursor-pointer"
                    >
                      <span className="break-words text-sm text-muted-foreground line-through">
                        {item.name}
                        {item.quantity && (
                          <span className="ml-2 inline-block rounded bg-muted px-1.5 py-0.5 align-middle text-xs font-medium no-underline">
                            {item.quantity}
                          </span>
                        )}
                      </span>
                      {item.note && (
                        <span className="block break-words text-xs text-muted-foreground/70">
                          {item.note}
                        </span>
                      )}
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
