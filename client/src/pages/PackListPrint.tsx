import { useEffect, useMemo } from "react";
import { useParams } from "wouter";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoginPrompt from "@/components/LoginPrompt";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { isStandaloneApp } from "@/lib/standalone";
import { LOCALE_TAGS } from "@shared/i18n";

/**
 * Druckfreundliche Ansicht einer Packliste: Kategorien als Abschnitte,
 * pro Eintrag ein Papier-Kästchen zum Abhaken, Menge und – falls zugewiesen –
 * die packende Person. PDF entsteht über den Browser-Druckdialog.
 * Mit ?person=<Name> lässt sich nur der Anteil einer Person drucken.
 */
export default function PackListPrintPage() {
  const { lang, t } = useI18n();
  const standalone = isStandaloneApp();
  const params = useParams<{ id: string }>();
  const listId = Number(params.id);
  const { isAuthenticated, loading } = useAuth();
  const query = trpc.packing.items.useQuery(
    { listId },
    { enabled: isAuthenticated && !isNaN(listId) }
  );
  const list = query.data?.list ?? null;

  // Optionaler Druck-Filter «nur Person X» über den Query-Parameter person
  const personFilter = useMemo(
    () =>
      new URLSearchParams(window.location.search).get("person")?.trim() || null,
    []
  );

  useEffect(() => {
    document.title = list
      ? t.packListPrint.docTitle(list.name)
      : t.packListPrint.docTitleFallback;
    return () => {
      document.title = t.packListPrint.appTitle;
    };
  }, [list, t]);

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
        <LoginPrompt feature={t.packListDetail.loginFeature} />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="container max-w-2xl py-8">
        <p className="text-muted-foreground">{t.packListPrint.notFound}</p>
        <Button
          variant="outline"
          className="mt-3"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {t.common.back}
        </Button>
      </div>
    );
  }

  const items = (query.data?.items ?? []).filter(
    item =>
      personFilter === null || (item.assignee ?? "").trim() === personFilter
  );

  // Kategorien in Listen-Reihenfolge gruppieren (wie in der Detail-Ansicht)
  const grouped: [string, typeof items][] = [];
  for (const item of items) {
    const key = item.category || t.packListDetail.generalCategory;
    const group = grouped.find(([category]) => category === key);
    if (group) group[1].push(item);
    else grouped.push([key, [item]]);
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
          {t.packListPrint.printButton}
        </Button>
      </div>
      {standalone && (
        <p className="mb-6 text-xs text-muted-foreground print:hidden">
          {t.packListPrint.printBrowserHint}
        </p>
      )}

      <div className="print-sheet">
        <header className="mb-6 border-b-2 border-foreground pb-4">
          <p className="text-xs font-semibold uppercase tracking-widest">
            {t.packListPrint.headerKicker}
          </p>
          <h1 className="mt-1 font-serif text-3xl font-bold">{list.name}</h1>
          <p className="mt-1 text-sm">
            {t.packListPrint.meta(items.length, grouped.length)}
            {" · "}
            {t.packListPrint.printedOn(
              new Date().toLocaleDateString(LOCALE_TAGS[lang], {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            )}
          </p>
          {personFilter && (
            <p className="mt-1 text-sm font-semibold">
              {t.packListPrint.personFilterInfo(personFilter)}
            </p>
          )}
        </header>

        {items.length === 0 && (
          <p className="text-sm">{t.packListPrint.emptyList}</p>
        )}

        <section className="space-y-5">
          {grouped.map(([category, categoryItems]) => (
            <div key={category}>
              <h2 className="mb-2 border-b border-foreground/30 pb-1 text-sm font-bold uppercase tracking-wide">
                {category}
              </h2>
              <ul className="space-y-1.5">
                {categoryItems.map(item => (
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
                      {item.quantity > 1 && (
                        <span className="ml-1.5 text-xs">
                          × {item.quantity}
                        </span>
                      )}
                    </span>
                    {item.assignee && !personFilter && (
                      <span className="max-w-32 truncate rounded-full border border-foreground/50 px-2 py-0.5 text-xs">
                        {item.assignee}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <footer className="mt-8 border-t border-foreground/30 pt-3 text-center text-xs">
          {t.packListPrint.footer}
        </footer>
      </div>
    </div>
  );
}
