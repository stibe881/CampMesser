/**
 * Baderegeln & Strandflaggen (#473): die sechs SLRG-Baderegeln und die
 * üblichen Strandflaggen als Nachschlage-Seite – offline, denn am Strand
 * liest man sie im Zweifel ohne Netz. Verlinkt aus der Badewasser-Karte.
 */
import { Flag, LifeBuoy, WifiOff } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { bathingRules, beachFlags } from "@/data/waterSafety";
import { useI18n } from "@/i18n";
import { pick } from "@shared/i18n";
import { cn } from "@/lib/utils";

export default function WaterSafetyPage() {
  const { lang, t } = useI18n();
  const ws = t.waterSafety;

  return (
    <div className="container py-6">
      <PageHeader title={ws.title} subtitle={ws.subtitle} />

      <div className="mb-6 flex items-center gap-2 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        {ws.offlineNote}
      </div>

      <section className="mb-8">
        <h2 className="mb-1 flex items-center gap-2 font-serif text-lg font-bold">
          <LifeBuoy className="h-5 w-5 text-primary" aria-hidden="true" />
          {ws.rulesTitle}
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">{ws.rulesIntro}</p>
        <ol className="space-y-3">
          {bathingRules.map((rule, index) => (
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
          <Flag className="h-5 w-5 text-primary" aria-hidden="true" />
          {ws.flagsTitle}
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">{ws.flagsIntro}</p>
        <div className="space-y-3">
          {beachFlags.map(flag => (
            <Card key={flag.id}>
              <CardContent className="flex gap-3 p-4">
                <span
                  className={cn(
                    "mt-0.5 h-8 w-10 shrink-0 rounded border border-border",
                    flag.swatch
                  )}
                  aria-hidden="true"
                />
                <div>
                  <p className="font-semibold">{pick(flag.title, lang)}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {pick(flag.text, lang)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <p className="rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
        {ws.sourceNote}
      </p>
    </div>
  );
}
