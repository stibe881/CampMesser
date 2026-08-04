import { useState } from "react";
import { AlertTriangle, Cloud, Eye, Sun, WifiOff } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  cloudBandLabels,
  cloudBandOrder,
  cloudEntries,
  cloudsInBand,
  type CloudBand,
  type CloudEntry,
  type CloudUrgency,
} from "@/data/clouds";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import { pick } from "@shared/i18n";

/**
 * Wolken-Lexikon (#264). Die Ansicht geht vom Himmel aus, nicht vom
 * Fachbegriff: erst das Stockwerk wählen (dort schaut man hin), dann das
 * Bild vergleichen, dann lesen, was folgt.
 */

/** Farbe und Symbol je Dringlichkeit – dasselbe Muster wie in der Wetter-Ansicht. */
const urgencyStyles: Record<CloudUrgency, { badge: string; icon: typeof Sun }> =
  {
    gut: {
      badge: "border-primary/40 bg-primary/10 text-primary",
      icon: Sun,
    },
    beobachten: {
      badge:
        "border-amber-600/40 bg-amber-500/15 text-amber-800 dark:text-amber-300",
      icon: Eye,
    },
    warnung: {
      badge: "border-destructive/40 bg-destructive/10 text-destructive",
      icon: AlertTriangle,
    },
  };

export default function CloudsPage() {
  const { lang, t } = useI18n();
  const [band, setBand] = useState<"alle" | CloudBand>("alle");
  const [selected, setSelected] = useState<CloudEntry | null>(null);

  const urgencyLabels: Record<CloudUrgency, string> = {
    gut: t.clouds.urgencyGood,
    beobachten: t.clouds.urgencyWatch,
    warnung: t.clouds.urgencyWarning,
  };

  // Vorwarnzeit als Text: eine Spanne, kein Countdown – Wolken sind kein Fahrplan.
  const leadLine = (entry: CloudEntry) =>
    entry.leadHours === null
      ? t.clouds.leadNone
      : entry.leadHours[0] === 0
        ? t.clouds.leadNow(entry.leadHours[1])
        : t.clouds.leadRange(entry.leadHours[0], entry.leadHours[1]);

  const visibleBands = cloudBandOrder.filter(
    b => band === "alle" || band === b
  );

  return (
    <div className="container py-6">
      <PageHeader title={t.clouds.title} subtitle={t.clouds.subtitle} />

      <div className="mb-4 flex items-center gap-2 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t.clouds.offlineNote}
      </div>

      <div className="mb-6 rounded-lg border border-border bg-muted/50 p-3.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t.clouds.howToTitle}
        </p>
        <p className="mt-1 text-sm">{t.clouds.howToText}</p>
      </div>

      <div
        className="mb-6 flex flex-wrap gap-2"
        role="group"
        aria-label={t.clouds.filterAria}
      >
        {(["alle", ...cloudBandOrder] as const).map(b => (
          <button
            key={b}
            type="button"
            onClick={() => setBand(b)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              band === b
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={band === b}
          >
            {b === "alle" ? t.clouds.filterAll : pick(cloudBandLabels[b], lang)}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {visibleBands.map(currentBand => (
          <section key={currentBand}>
            <h2 className="mb-3 font-serif text-lg font-bold">
              {pick(cloudBandLabels[currentBand], lang)}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cloudsInBand(currentBand).map(entry => {
                const name = pick(entry.name, lang);
                const style = urgencyStyles[entry.urgency];
                const UrgencyIcon = style.icon;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setSelected(entry)}
                    className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.99]"
                    aria-label={t.clouds.openAria(name)}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                        <Cloud className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                          style.badge
                        )}
                      >
                        <UrgencyIcon className="h-3 w-3" aria-hidden="true" />
                        {urgencyLabels[entry.urgency]}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{name}</p>
                      <p className="text-xs italic text-muted-foreground">
                        {entry.latin}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {pick(entry.appearance, lang)}
                    </p>
                    <Badge variant="secondary">{leadLine(entry)}</Badge>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <Dialog
        open={selected !== null}
        onOpenChange={open => !open && setSelected(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">
                  {pick(selected.name, lang)}
                  <span className="ml-2 text-sm font-normal italic text-muted-foreground">
                    {selected.latin}
                  </span>
                </DialogTitle>
                <DialogDescription>
                  {pick(cloudBandLabels[selected.band], lang)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
                      urgencyStyles[selected.urgency].badge
                    )}
                  >
                    {urgencyLabels[selected.urgency]}
                  </span>
                  <Badge variant="secondary">{leadLine(selected)}</Badge>
                </div>

                <div>
                  <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.clouds.appearanceTitle}
                  </h3>
                  <p className="text-sm">{pick(selected.appearance, lang)}</p>
                </div>

                <div>
                  <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.clouds.meaningTitle}
                  </h3>
                  <p className="text-sm">{pick(selected.meaning, lang)}</p>
                </div>

                <div className="rounded-lg bg-accent/60 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.clouds.campTipTitle}
                  </p>
                  <p className="mt-1 text-sm">{pick(selected.campTip, lang)}</p>
                </div>

                <p className="rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
                  {t.clouds.leadDisclaimer}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        {t.clouds.countLine(cloudEntries.length)}
      </p>
    </div>
  );
}
