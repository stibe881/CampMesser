import { useEffect } from "react";
import { fmtLong } from "@/lib/dateFormat";
import { useParams } from "wouter";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/BrandLogo";
import LoginPrompt from "@/components/LoginPrompt";
import { BADGES } from "@shared/badges";
import { LOCALE_TAGS, pick, type Language } from "@shared/i18n";
import { useI18n } from "@/i18n";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { isStandaloneApp } from "@/lib/standalone";

/**
 * Festliche, druckfreundliche Abzeichen-Urkunde eines Kindes: Name gross,
 * alle verdienten Abzeichen aus dem Katalog (Emoji, Titel, Datum), Logo und
 * Doppelrahmen – bewusst schwarz-weiss-tauglich, das PDF entsteht über den
 * Browser-Druckdialog (Muster HuntPrint inkl. Standalone-Fallback).
 */

export default function BadgeCertificatePage() {
  const { lang, t } = useI18n();
  const tc = t.badgeCertificate;
  const standalone = isStandaloneApp();
  const params = useParams<{ childId: string }>();
  const childId = Number(params.childId);
  const validId = Number.isInteger(childId) && childId > 0;
  const { isAuthenticated, loading: authLoading } = useAuth();
  const childrenQuery = trpc.family.children.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const badgesQuery = trpc.family.badges.listByChild.useQuery(
    { childId },
    { enabled: isAuthenticated && validId }
  );
  const child = validId
    ? childrenQuery.data?.find(c => c.id === childId)
    : undefined;

  useEffect(() => {
    document.title = child ? tc.docTitle(child.name) : tc.docTitleFallback;
    return () => {
      document.title = tc.appTitle;
    };
  }, [child, tc]);

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="container max-w-2xl py-8">
        <LoginPrompt feature={tc.loginFeature} />
      </div>
    );
  }

  if (authLoading || childrenQuery.isLoading || badgesQuery.isLoading) {
    return (
      <div className="container flex justify-center py-16">
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          aria-label={t.common.loading}
        />
      </div>
    );
  }

  if (!child) {
    return (
      <div className="container max-w-2xl py-8">
        <p className="text-muted-foreground">{tc.notFound}</p>
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

  // Verdiente Abzeichen in Katalog-Reihenfolge mit Verleih-Datum
  const earnedAtById: Record<string, Date | string> = {};
  (badgesQuery.data ?? []).forEach(b => {
    earnedAtById[b.badgeId] = b.earnedAt;
  });
  const earned = BADGES.filter(def => earnedAtById[def.id]);

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
          {tc.printButton}
        </Button>
      </div>
      {standalone && (
        <p className="mb-6 text-xs text-muted-foreground print:hidden">
          {tc.printBrowserHint}
        </p>
      )}

      <div className="print-sheet rounded-lg border-4 border-double border-foreground p-2">
        <div className="rounded-md border border-foreground/60 px-6 py-10 text-center sm:px-10">
          <span className="mx-auto flex h-14 w-14 items-center justify-center">
            <BrandLogo className="h-12 w-12" />
          </span>
          <p className="mt-2 text-xs font-semibold uppercase tracking-widest">
            {tc.kicker}
          </p>

          <h1 className="mt-6 font-serif text-4xl font-bold uppercase tracking-wide">
            {tc.heading}
          </h1>
          <div
            className="mx-auto mt-4 h-px w-24 bg-foreground"
            aria-hidden="true"
          />
          <p className="mt-4 text-sm">{tc.awardedTo}</p>
          <p className="mt-1 font-serif text-3xl font-bold">{child.name}</p>

          {earned.length > 0 ? (
            <>
              <p className="mt-6 text-sm">{tc.badgesIntro(earned.length)}</p>
              <ul className="mx-auto mt-4 grid max-w-md grid-cols-2 gap-3">
                {earned.map(def => (
                  <li
                    key={def.id}
                    className="print-station rounded-lg border border-foreground/40 p-3"
                  >
                    <span className="block text-3xl" aria-hidden="true">
                      {def.emoji}
                    </span>
                    <span className="mt-1 block text-sm font-semibold">
                      {pick(def.title, lang)}
                    </span>
                    <span className="mt-0.5 block text-xs">
                      {tc.earnedOn(
                        fmtLong(new Date(earnedAtById[def.id]), lang)
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mx-auto mt-6 max-w-sm text-sm">{tc.noBadges}</p>
          )}

          <div
            className="mx-auto mt-8 h-px w-24 bg-foreground"
            aria-hidden="true"
          />
          <p className="mt-4 text-sm">
            {tc.issuedOn(fmtLong(new Date(), lang))}
          </p>
          <p className="mt-6 text-xs">{tc.footer}</p>
        </div>
      </div>
    </div>
  );
}
