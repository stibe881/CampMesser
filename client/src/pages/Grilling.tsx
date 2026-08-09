/**
 * Grill- & Garzeiten-Ratgeber (#502): Kerntemperaturen und Faustregeln
 * fürs Grillieren – offline, denn am Grill steht man selten mit Empfang.
 */
import { Beef, Flame, WifiOff } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { coreTemperatures, grillTips } from "@/data/grilling";
import { useI18n } from "@/i18n";
import { pick } from "@shared/i18n";

export default function GrillingPage() {
  const { lang, t } = useI18n();
  const tg = t.grilling;

  return (
    <div className="container py-6">
      <PageHeader title={tg.title} subtitle={tg.subtitle} />

      <div className="mb-6 flex items-center gap-2 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        {tg.offlineNote}
      </div>

      <section className="mb-8">
        <h2 className="mb-1 flex items-center gap-2 font-serif text-lg font-bold">
          <Beef className="h-5 w-5 text-primary" aria-hidden="true" />
          {tg.tempsTitle}
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">{tg.tempsIntro}</p>
        <div className="space-y-3">
          {coreTemperatures.map(entry => (
            <Card key={entry.id}>
              <CardContent className="p-4">
                <p className="font-semibold">{pick(entry.title, lang)}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {pick(entry.text, lang)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-1 flex items-center gap-2 font-serif text-lg font-bold">
          <Flame className="h-5 w-5 text-primary" aria-hidden="true" />
          {tg.tipsTitle}
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">{tg.tipsIntro}</p>
        <div className="space-y-3">
          {grillTips.map(entry => (
            <Card key={entry.id}>
              <CardContent className="p-4">
                <p className="font-semibold">{pick(entry.title, lang)}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {pick(entry.text, lang)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <p className="rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
        {tg.sourceNote}
      </p>
    </div>
  );
}
