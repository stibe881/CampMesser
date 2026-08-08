/**
 * Wintersport-Wissen (#472): FIS-Pistenregeln und Lawinen-Grundwissen als
 * Nachschlage-Seite. Statische Inhalte, offline verfügbar – auf dem
 * Sessellift und im Funkloch am Berg genauso lesbar wie daheim.
 */
import { Mountain, Snowflake, WifiOff } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { avalancheBasics, fisRules } from "@/data/winterKnowledge";
import { useI18n } from "@/i18n";
import { pick } from "@shared/i18n";

export default function WinterKnowledgePage() {
  const { lang, t } = useI18n();
  const wk = t.winterKnowledge;

  return (
    <div className="container py-6">
      <PageHeader title={wk.title} subtitle={wk.subtitle} />

      <div className="mb-6 flex items-center gap-2 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        {wk.offlineNote}
      </div>

      <section className="mb-8">
        <h2 className="mb-1 flex items-center gap-2 font-serif text-lg font-bold">
          <Snowflake className="h-5 w-5 text-primary" aria-hidden="true" />
          {wk.fisTitle}
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">{wk.fisIntro}</p>
        <ol className="space-y-3">
          {fisRules.map((rule, index) => (
            <li key={rule.id}>
              <Card>
                <CardContent className="flex gap-3 p-4">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-serif text-sm font-bold text-primary"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-semibold">{pick(rule.title, lang)}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {pick(rule.text, lang)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-1 flex items-center gap-2 font-serif text-lg font-bold">
          <Mountain className="h-5 w-5 text-primary" aria-hidden="true" />
          {wk.avalancheTitle}
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">
          {wk.avalancheIntro}
        </p>
        <div className="space-y-3">
          {avalancheBasics.map(entry => (
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
        {wk.sourceNote}
      </p>
    </div>
  );
}
