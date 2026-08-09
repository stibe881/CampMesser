/**
 * Druckansicht des Platz-Dossiers (#416): das Blatt fürs Handschuhfach.
 *
 * Packliste (#66), Menüplan (#94) und Reisebericht (#131) hatten längst
 * Druckansichten – das Dossier nicht, dabei ist es genau das Blatt, das
 * man ohne App weitergibt: Kontakt, Check-in, Tarife, Eigenschaften,
 * Platzplan, eigene Notizen auf einer Seite. PDF entsteht über den
 * Browser-Druckdialog, wie bei allen Druckansichten.
 *
 * NUR, WAS DA IST: Ein leerer Abschnitt wird nicht gedruckt – ein Blatt
 * voller «keine Angabe» wäre Papierverschwendung.
 */
import { useEffect } from "react";
import { useParams } from "wouter";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PrintButton from "@/components/PrintButton";
import LoginPrompt from "@/components/LoginPrompt";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { fmtLong } from "@/lib/dateFormat";
import { printNeedsBrowserTab } from "@/lib/standalone";
import { pick } from "@shared/i18n";
import {
  listSpotAttributes,
  parseSpotAttributes,
} from "@shared/spotAttributes";
import { parseNextTimeNotes } from "@shared/nextTime";
import {
  formatRappen,
  formatTariffPeriods,
  parseSpotTariffs,
} from "@shared/spotTariffs";

export default function SpotPrintPage() {
  const { lang, t } = useI18n();
  const sp = t.spotPrint;
  const standalone = printNeedsBrowserTab();
  const params = useParams<{ id: string }>();
  const spotId = Number(params.id);
  const { isAuthenticated, loading } = useAuth();

  const spotsQuery = trpc.spots.list.useQuery(undefined, {
    enabled: isAuthenticated && !isNaN(spotId),
  });
  const spot = (spotsQuery.data ?? []).find(s => s.id === spotId) ?? null;
  const photosQuery = trpc.spots.photos.list.useQuery(
    { spotId },
    { enabled: isAuthenticated && !isNaN(spotId) }
  );
  const plan = (photosQuery.data ?? []).find(photo => photo.kind === "plan");

  useEffect(() => {
    document.title = spot ? sp.docTitle(spot.name) : t.packListPrint.appTitle;
    return () => {
      document.title = t.packListPrint.appTitle;
    };
  }, [spot, sp, t]);

  if (loading || (isAuthenticated && spotsQuery.isLoading)) {
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
        <LoginPrompt feature={t.spots.loginFeature} />
      </div>
    );
  }

  if (!spot) {
    return (
      <div className="container max-w-2xl py-8">
        <p className="text-muted-foreground">{sp.notFound}</p>
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

  const tariffs = parseSpotTariffs(spot.tariffsJson);
  const attributes = listSpotAttributes(
    parseSpotAttributes(spot.attributesJson)
  );
  const notes = parseNextTimeNotes(spot.nextTimeJson);
  const baseRappen =
    (spot.pricePerNightRappen ?? 0) + (spot.extraPerNightRappen ?? 0);
  const hasContact = Boolean(
    spot.receptionPhone || spot.checkinInfo || spot.parcelNumber
  );

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
        <PrintButton label={t.packListPrint.printButton} />
      </div>
      {standalone && (
        <p className="mb-6 text-xs text-muted-foreground print:hidden">
          {t.packListPrint.printBrowserHint}
        </p>
      )}

      <div className="print-sheet">
        <header className="mb-6 border-b-2 border-foreground pb-4">
          <p className="text-xs font-semibold uppercase tracking-widest">
            {sp.kicker}
          </p>
          <h1 className="mt-1 font-serif text-3xl font-bold">{spot.name}</h1>
          <p className="mt-1 text-sm">
            {sp.coords(spot.latitude.toFixed(5), spot.longitude.toFixed(5))}
            {spot.elevationM != null && ` · ${sp.elevation(spot.elevationM)}`}
            {" · "}
            {t.packListPrint.printedOn(fmtLong(new Date(), lang))}
          </p>
        </header>

        <div className="space-y-6 text-sm">
          {hasContact && (
            <section>
              <h2 className="mb-2 border-b border-foreground/30 pb-1 text-sm font-bold uppercase tracking-wide">
                {sp.contactTitle}
              </h2>
              <dl className="space-y-1">
                {spot.receptionPhone && (
                  <div className="flex gap-3">
                    <dt className="w-32 shrink-0 text-muted-foreground">
                      {sp.phoneLabel}
                    </dt>
                    <dd>{spot.receptionPhone}</dd>
                  </div>
                )}
                {spot.checkinInfo && (
                  <div className="flex gap-3">
                    <dt className="w-32 shrink-0 text-muted-foreground">
                      {sp.checkinLabel}
                    </dt>
                    <dd>{spot.checkinInfo}</dd>
                  </div>
                )}
                {spot.parcelNumber && (
                  <div className="flex gap-3">
                    <dt className="w-32 shrink-0 text-muted-foreground">
                      {sp.parcelLabel}
                    </dt>
                    <dd>{spot.parcelNumber}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {(tariffs.length > 0 || baseRappen > 0) && (
            <section>
              <h2 className="mb-2 border-b border-foreground/30 pb-1 text-sm font-bold uppercase tracking-wide">
                {sp.tariffsTitle}
              </h2>
              {baseRappen > 0 && (
                <p className="mb-2">
                  {sp.basePrice(formatRappen(baseRappen, lang))}
                </p>
              )}
              <div className="space-y-3">
                {tariffs.map(tariff => (
                  <div key={tariff.name}>
                    <p className="font-semibold">
                      {tariff.name}
                      {tariff.unit && (
                        <span className="ml-1.5 font-normal text-muted-foreground">
                          {tariff.unit}
                        </span>
                      )}
                    </p>
                    {tariff.periods && tariff.periods.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {formatTariffPeriods(tariff.periods)}
                      </p>
                    )}
                    <dl className="mt-1 space-y-0.5">
                      {tariff.rows.map(row => (
                        <div key={row.label} className="flex gap-3">
                          <dt className="w-40 shrink-0 text-muted-foreground">
                            {row.label}
                          </dt>
                          <dd className="tabular-nums">
                            {formatRappen(
                              row.priceRappen,
                              lang,
                              tariff.currency
                            )}
                            {row.oneOff && (
                              <span className="ml-1.5 text-xs text-muted-foreground">
                                {t.spotDetail.tariffRowOneOff}
                              </span>
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            </section>
          )}

          {attributes.length > 0 && (
            <section>
              <h2 className="mb-2 border-b border-foreground/30 pb-1 text-sm font-bold uppercase tracking-wide">
                {sp.attributesTitle}
              </h2>
              <dl className="space-y-1">
                {attributes.map(({ def, value }) => (
                  <div key={def.key} className="flex gap-3">
                    <dt className="w-40 shrink-0 text-muted-foreground">
                      {pick(def.label, lang)}
                    </dt>
                    <dd>{pick(value.label, lang)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {notes.length > 0 && (
            <section>
              <h2 className="mb-2 border-b border-foreground/30 pb-1 text-sm font-bold uppercase tracking-wide">
                {sp.nextTimeTitle}
              </h2>
              <ul className="list-disc space-y-0.5 pl-5">
                {notes.map((note, index) => (
                  <li key={`${index}-${note}`}>{note}</li>
                ))}
              </ul>
            </section>
          )}

          {spot.note && (
            <section>
              <h2 className="mb-2 border-b border-foreground/30 pb-1 text-sm font-bold uppercase tracking-wide">
                {sp.noteTitle}
              </h2>
              <p className="whitespace-pre-wrap">{spot.note}</p>
            </section>
          )}

          {plan && (
            <section>
              <h2 className="mb-2 border-b border-foreground/30 pb-1 text-sm font-bold uppercase tracking-wide">
                {sp.planTitle}
              </h2>
              <img
                src={`/api/spots/photos/${plan.fileName}`}
                alt={t.sitePlan.alt(spot.name)}
                className="max-h-[600px] w-full rounded border border-border object-contain"
              />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
