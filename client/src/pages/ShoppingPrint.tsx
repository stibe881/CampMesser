import { useEffect, useMemo } from "react";
import { fmtLong } from "@/lib/dateFormat";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PrintButton from "@/components/PrintButton";
import LoginPrompt from "@/components/LoginPrompt";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { isStandaloneApp } from "@/lib/standalone";
import { LOCALE_TAGS } from "@shared/i18n";
import {
  groupByShoppingCategory,
  shoppingCategoryLabel,
} from "@shared/shopping";

/**
 * Druckfreundliche Ansicht der Einkaufsliste: offene Einträge nach
 * Laden-Kategorien gruppiert (Katalog-Reihenfolge, dann die eigenen
 * Kategorien alphabetisch (#272), «Ohne Kategorie» zuletzt),
 * pro Eintrag ein Papier-Kästchen zum Abhaken im Laden. PDF entsteht über
 * den Browser-Druckdialog.
 *
 * Welche der persönlichen Listen gedruckt wird, steht in `?liste=<id>` (#215);
 * ohne Parameter druckt die erste bzw. Standard-Liste.
 */
export default function ShoppingPrintPage() {
  const { lang, t } = useI18n();
  const standalone = isStandaloneApp();
  const { isAuthenticated, loading } = useAuth();
  // Gewünschte Liste aus der Adresse (?liste=12); ungültige Werte = Vorgabe
  const listId = useMemo(() => {
    const raw = new URLSearchParams(window.location.search).get("liste");
    const id = Number(raw);
    return raw && Number.isInteger(id) && id > 0 ? id : undefined;
  }, []);
  const query = trpc.shopping.list.useQuery(
    { listId, lang },
    { enabled: isAuthenticated }
  );
  const listsQuery = trpc.shopping.lists.useQuery(
    { lang },
    { enabled: isAuthenticated }
  );
  /** Name der gedruckten Liste (null, solange unbekannt). */
  const listName =
    (listId === undefined
      ? listsQuery.data?.[0]?.name
      : listsQuery.data?.find(l => l.id === listId)?.name) ?? null;

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

  /** Offene Einträge nach Kategorie gruppiert – Katalog, eigene, ohne zuletzt. */
  const grouped = useMemo(
    () => groupByShoppingCategory(openItems, lang),
    [openItems, lang]
  );

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
        <PrintButton label={t.shoppingPrint.printButton} />
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
            {listName ?? t.shoppingPrint.title}
          </h1>
          <p className="mt-1 text-sm">
            {t.shoppingPrint.meta(openItems.length, grouped.length)}
            {" · "}
            {t.shoppingPrint.printedOn(fmtLong(new Date(), lang))}
          </p>
        </header>

        {openItems.length === 0 && (
          <p className="text-sm">{t.shoppingPrint.emptyList}</p>
        )}

        <section className="space-y-5">
          {grouped.map(group => (
            <div key={group.key ?? "none"}>
              <h2 className="mb-2 border-b border-foreground/30 pb-1 text-sm font-bold uppercase tracking-wide">
                {shoppingCategoryLabel(group.key, lang) ??
                  t.shopping.noCategory}
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
