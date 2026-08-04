import { useState } from "react";
import { CircleAlert, Clock, RefreshCw, Wrench, WifiOff } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { type CareGuide } from "@/data/careGuides";
import { useI18n } from "@/i18n";
import { pick } from "@shared/i18n";

/**
 * Anzeige für Pflege- und Reparatur-Ratgeber (#265, #266).
 *
 * Bewusst ein gemeinsames Bauteil: Zeltpflege und Ausrüstungs-Reparatur
 * unterscheiden sich im Inhalt, nicht in der Form – und wer eine Anleitung
 * einmal gelesen hat, soll die nächste am selben Ort suchen können.
 */
export default function CareGuides({
  guides,
  title,
  subtitle,
}: {
  guides: CareGuide[];
  title: string;
  subtitle: string;
}) {
  const { lang, t } = useI18n();
  const [selected, setSelected] = useState<CareGuide | null>(null);

  /** Wiederholung als Text – «bei Bedarf», wenn kein Intervall gilt. */
  const intervalLine = (guide: CareGuide) =>
    guide.intervalMonths === null
      ? t.care.intervalNone
      : t.care.intervalMonths(guide.intervalMonths);

  return (
    <div className="container py-6">
      <PageHeader title={title} subtitle={subtitle} />

      <div className="mb-6 flex items-center gap-2 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t.care.offlineNote}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {guides.map(guide => {
          const name = pick(guide.title, lang);
          return (
            <button
              key={guide.id}
              type="button"
              onClick={() => setSelected(guide)}
              className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.99]"
              aria-label={t.care.openAria(name)}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Wrench className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="font-semibold">{name}</p>
              <p className="text-sm text-muted-foreground">
                {pick(guide.summary, lang)}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary">
                  <Clock className="mr-1 h-3 w-3" aria-hidden="true" />
                  {t.care.minutes(guide.minutes)}
                </Badge>
                <Badge variant="outline">
                  <RefreshCw className="mr-1 h-3 w-3" aria-hidden="true" />
                  {intervalLine(guide)}
                </Badge>
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-6 rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
        {t.care.reminderHint}
      </p>

      <Dialog
        open={selected !== null}
        onOpenChange={open => !open && setSelected(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">
                  {pick(selected.title, lang)}
                </DialogTitle>
                <DialogDescription>
                  {pick(selected.summary, lang)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary">
                    {t.care.minutes(selected.minutes)}
                  </Badge>
                  <Badge variant="outline">{intervalLine(selected)}</Badge>
                </div>

                <div className="rounded-lg bg-accent/60 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.care.whenTitle}
                  </p>
                  <p className="mt-1 text-sm">{pick(selected.when, lang)}</p>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.care.materialsTitle}
                  </h3>
                  <ul className="space-y-1.5">
                    {selected.materials.map((item, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                          aria-hidden="true"
                        />
                        {pick(item, lang)}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.care.stepsTitle}
                  </h3>
                  <ol className="space-y-3">
                    {selected.steps.map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          {i + 1}
                        </span>
                        <span>
                          <span className="block text-sm font-semibold">
                            {pick(step.title, lang)}
                          </span>
                          <span className="mt-0.5 block text-sm text-muted-foreground">
                            {pick(step.text, lang)}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="rounded-lg border border-amber-600/40 bg-amber-500/10 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                    <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />
                    {t.care.mistakeTitle}
                  </p>
                  <p className="mt-1 text-sm">{pick(selected.mistake, lang)}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
