import { useEffect } from "react";
import { useParams } from "wouter";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PrintButton from "@/components/PrintButton";
import { scavengerHunts } from "@/data/familyActivities";
import { pick } from "@shared/i18n";
import { useI18n } from "@/i18n";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { customHuntDbId, customHuntToScavengerHunt } from "@/lib/customHunts";
import { printNeedsBrowserTab } from "@/lib/standalone";

/**
 * Druckfreundliche Ansicht einer Schnitzeljagd: Stationen, Rätsel und
 * Buchstabenfelder zum Ausfüllen – ohne Lösungen, damit Kinder ohne Handy
 * auf die Suche gehen können. PDF entsteht über den Browser-Druckdialog.
 * Unterstützt eingebaute und eigene Jagden (IDs mit «eigene-»-Präfix).
 */

export default function HuntPrintPage() {
  const { lang, t } = useI18n();
  const standalone = printNeedsBrowserTab();
  const params = useParams<{ id: string }>();
  const customId = customHuntDbId(params.id ?? "");
  const { isAuthenticated } = useAuth();
  const customQuery = trpc.hunts.list.useQuery(undefined, {
    enabled: customId !== null && isAuthenticated,
  });
  const customRow = customQuery.data?.find(h => h.id === customId);
  const hunt =
    customId !== null
      ? customRow
        ? customHuntToScavengerHunt(customRow)
        : undefined
      : scavengerHunts.find(h => h.id === params.id);

  useEffect(() => {
    document.title = hunt
      ? t.huntPrint.docTitle(pick(hunt.title, lang))
      : t.huntPrint.docTitleFallback;
    return () => {
      document.title = t.huntPrint.appTitle;
    };
  }, [hunt, lang, t]);

  if (customId !== null && customQuery.isLoading) {
    return (
      <div className="container flex justify-center py-16">
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          aria-label={t.common.loading}
        />
      </div>
    );
  }

  if (!hunt) {
    return (
      <div className="container max-w-2xl py-8">
        <p className="text-muted-foreground">{t.huntPrint.notFound}</p>
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

  // Buchstaben-Stationen in der aktiven Sprache (Lösungswörter sind je Sprache nachgedichtet)
  const stationHasLetter = hunt.stations.map(s =>
    s.letter ? pick(s.letter, lang) !== "" : false
  );
  const letterCount = stationHasLetter.filter(Boolean).length;
  const solutionWord = hunt.solutionWord ? pick(hunt.solutionWord, lang) : "";

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
        <PrintButton label={t.huntPrint.printButton} />
      </div>
      {standalone && (
        <p className="mb-6 text-xs text-muted-foreground print:hidden">
          {t.huntPrint.printBrowserHint}
        </p>
      )}

      <div className="print-sheet">
        <header className="mb-6 border-b-2 border-foreground pb-4">
          <p className="text-xs font-semibold uppercase tracking-widest">
            {t.huntPrint.headerKicker}
          </p>
          <h1 className="mt-1 font-serif text-3xl font-bold">
            {pick(hunt.title, lang)}
          </h1>
          <p className="mt-1 text-sm">
            {t.huntPrint.meta(
              pick(hunt.ageHint, lang),
              hunt.durationMinutes,
              hunt.stations.length
            )}
          </p>
        </header>

        <section className="mb-5">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-wide">
            {t.huntPrint.missionTitle}
          </h2>
          <p className="text-sm leading-relaxed">{pick(hunt.intro, lang)}</p>
        </section>

        {hunt.preparation && (
          <section className="mb-5 rounded-lg border border-dashed border-foreground/40 p-3">
            <h2 className="mb-1 text-sm font-bold uppercase tracking-wide">
              {t.huntPrint.adultsTitle}
            </h2>
            <p className="text-sm leading-relaxed">
              {pick(hunt.preparation, lang)}
            </p>
          </section>
        )}

        <section className="space-y-4">
          {hunt.stations.map((station, i) => (
            <div
              key={i}
              className="print-station rounded-lg border border-foreground/30 p-4"
            >
              <h3 className="font-serif text-lg font-bold">
                {pick(station.title, lang)}
              </h3>
              <p className="mt-1 text-sm italic leading-relaxed">
                {pick(station.story, lang)}
              </p>
              <p className="mt-2 text-sm leading-relaxed">
                <strong>{t.huntPrint.taskLabel}</strong>{" "}
                {pick(station.task, lang)}
              </p>
              {station.hint && (
                <p className="mt-1.5 text-xs leading-relaxed">
                  <strong>{t.huntPrint.hintLabel}</strong>{" "}
                  {pick(station.hint, lang)}
                </p>
              )}
              <div className="mt-3 flex items-center gap-3 text-sm">
                <span>{t.huntPrint.doneLabel}</span>
                <span
                  className="inline-block h-5 w-5 rounded border-2 border-foreground"
                  aria-hidden="true"
                />
                {stationHasLetter[i] && (
                  <span className="ml-auto flex items-center gap-2">
                    {t.huntPrint.letterLabel}
                    <span
                      className="inline-block h-8 w-8 rounded border-2 border-foreground"
                      aria-hidden="true"
                    />
                  </span>
                )}
              </div>
            </div>
          ))}
        </section>

        {solutionWord && (
          <section className="mt-6 rounded-lg border-2 border-foreground p-4">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide">
              {t.huntPrint.solutionTitle}
            </h2>
            <p className="mb-3 text-sm">
              {t.huntPrint.solutionText(letterCount)}
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: solutionWord.length }, (_, i) => (
                <span
                  key={i}
                  className="inline-block h-10 w-10 rounded border-2 border-foreground"
                  aria-hidden="true"
                />
              ))}
            </div>
          </section>
        )}

        <section className="mt-5">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-wide">
            {t.huntPrint.finaleTitle}
          </h2>
          <p className="text-sm leading-relaxed">{pick(hunt.finale, lang)}</p>
        </section>

        <footer className="mt-8 border-t border-foreground/30 pt-3 text-center text-xs">
          {t.huntPrint.footer}
        </footer>
      </div>
    </div>
  );
}
