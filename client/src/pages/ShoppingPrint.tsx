import { useEffect, useMemo } from "react";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoginPrompt from "@/components/LoginPrompt";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { isStandaloneApp } from "@/lib/standalone";
import { LOCALE_TAGS, pick } from "@shared/i18n";
import {
  isShoppingCategory,
  SHOPPING_CATEGORIES,
  SHOPPING_CATEGORY_LABELS,
  type ShoppingCategory,
} from "@shared/shopping";

/**
 * Druckfreundliche Ansicht der Einkaufsliste: offene Einträge nach
 * Laden-Kategorien gruppiert (Katalog-Reihenfolge, «Ohne Kategorie» zuletzt),
 * pro Eintrag ein Papier-Kästchen zum Abhaken im Laden. PDF entsteht über
 * den Browser-Druckdialog.
 */
export default function ShoppingPrintPage() {
  const { lang, t } = useI18n();
  const standalone = isStandaloneApp();
  const { isAuthenticated, loading } = useAuth();
  const query = trpc.shopping.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    document.title = t.shoppingPrint.docTitle;
    return () => {
      document.title = t.shoppingPrint.appTitle;
    };
  }, [t]);

  const openItems = useMemo(
    () => (query.data ?? []).filter(i => !i.checked),
    [query.data]
  );

  /** Offene Einträge nach Kategorie gruppiert – Katalog-Reihenfolge, ohne Kategorie zuletzt. */
  const grouped = useMemo(() => {
    const groups: {
      key: ShoppingCategory | null;
      items: typeof openItems;
    }[] = [];
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

  if (loading || (isAuthenticated && query.isLoading)) {
    return (
      <div className="container flex justify-center py-16">
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          aria-label={t.common.loading}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container max-w-2xl py-8">
        <LoginPrompt feature={t.shopping.loginFeature} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 print:max-w-none print:px-0 print:py-0">
      {/* Bedienleiste – wird nicht mitgedruckt */}
      <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {t.common.back}
        </Button>
        <Button
          size="sm"
          onClick={() => {
            if (standalone) {
              window.open(window.location.href, "_blank", "noopener");
            } else {
              window.print();
            }
          }}
        >
          <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {t.shoppingPrint.printButton}
        </Button>
      </div>
      {standalone && (
        <p className="mb-6 text-xs text-muted-foreground print:hidden">
          {t.shoppingPrint.printBrowserHint}
        </p>
      )}

      <div className="print-sheet">
        <header className="mb-6 border-b-2 border-foreground pb-4">
          <p className="text-xs font-semibold uppercase tracking-widest">
            {t.shoppingPrint.headerKicker}
          </p>
          <h1 className="mt-1 font-serif text-3xl font-bold">
            {t.shoppingPrint.title}
          </h1>
          <p className="mt-1 text-sm">
            {t.shoppingPrint.meta(openItems.length, grouped.length)}
            {" · "}
            {t.shoppingPrint.printedOn(
              new Date().toLocaleDateString(LOCALE_TAGS[lang], {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            )}
          </p>
        </header>

        {openItems.length === 0 && (
          <p className="text-sm">{t.shoppingPrint.emptyList}</p>
        )}

        <section className="space-y-5">
          {grouped.map(group => (
            <div key={group.key ?? "none"}>
              <h2 className="mb-2 border-b border-foreground/30 pb-1 text-sm font-bold uppercase tracking-wide">
                {group.key === null
                  ? t.shopping.noCategory
                  : pick(SHOPPING_CATEGORY_LABELS[group.key], lang)}
              </h2>
              <ul className="space-y-1.5">
                {group.items.map(item => (
                  <li
                    key={item.id}
                    className="print-station flex items-center gap-3 text-sm"
                  >
                    <span
                      className="inline-block h-4 w-4 shrink-0 rounded border-2 border-foreground"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      {item.name}
                      {item.quantity && (
                        <span className="ml-2 font-semibold">
                          {item.quantity}
                        </span>
                      )}
                      {item.note && (
                        <span className="block text-xs text-foreground/70">
                          {item.note}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <footer className="mt-8 border-t border-foreground/30 pt-3 text-center text-xs">
          {t.shoppingPrint.footer}
        </footer>
      </div>
    </div>
  );
}
