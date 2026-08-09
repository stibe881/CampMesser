/**
 * Camping-Knigge (#508): die Regeln des Zusammenlebens auf dem Platz –
 * Ruhezeiten, Grauwasser, Hunde, Parzellen-Grenzen. Offline.
 */
import { Handshake, WifiOff } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { etiquetteRules } from "@/data/etiquette";
import { useI18n } from "@/i18n";
import { pick } from "@shared/i18n";

export default function EtiquettePage() {
  const { lang, t } = useI18n();
  const te = t.etiquette;

  return (
    <div className="container py-6">
      <PageHeader title={te.title} subtitle={te.subtitle} />

      <div className="mb-6 flex items-center gap-2 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        {te.offlineNote}
      </div>

      <section className="mb-8">
        <h2 className="mb-1 flex items-center gap-2 font-serif text-lg font-bold">
          <Handshake className="h-5 w-5 text-primary" aria-hidden="true" />
          {te.listTitle}
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">{te.listIntro}</p>
        <div className="space-y-3">
          {etiquetteRules.map(rule => (
            <Card key={rule.id}>
              <CardContent className="p-4">
                <p className="font-semibold">{pick(rule.title, lang)}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {pick(rule.text, lang)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <p className="rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
        {te.sourceNote}
      </p>
    </div>
  );
}
