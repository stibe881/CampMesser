/**
 * Feuer-Ratgeber (#507): Aufbau, Anzünden, Unterhalten und richtiges
 * Löschen – als nummerierte Abfolge, offline. Verwandte Werkzeuge sind
 * verlinkt: Feuerverbot (#263), Feuerstellen (#247), Feuerholz (#287).
 */
import { ArrowRight, Flame, WifiOff } from "lucide-react";
import { Link } from "wouter";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { fireGuideSteps } from "@/data/fireGuide";
import { useI18n } from "@/i18n";
import { pick } from "@shared/i18n";

export default function FireGuidePage() {
  const { lang, t } = useI18n();
  const tf = t.fireGuide;

  return (
    <div className="container py-6">
      <PageHeader title={tf.title} subtitle={tf.subtitle} />

      <div className="mb-6 flex items-center gap-2 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        {tf.offlineNote}
      </div>

      <section className="mb-6">
        <h2 className="mb-1 flex items-center gap-2 font-serif text-lg font-bold">
          <Flame className="h-5 w-5 text-primary" aria-hidden="true" />
          {tf.listTitle}
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">{tf.listIntro}</p>
        <ol className="space-y-3">
          {fireGuideSteps.map((step, index) => (
            <li key={step.id}>
              <Card>
                <CardContent className="flex gap-3 p-4">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-serif text-sm font-bold text-primary"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-semibold">{pick(step.title, lang)}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {pick(step.text, lang)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* Die Werkzeuge zum Thema – hier fragt man sich das als Nächstes.
          Feuerverbot (#263) wohnt im Wetter-Modul, der Holz-Rechner hat
          eine eigene Kachel. */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          ["/wetter", tf.linkBans],
          ["/feuerholz", tf.linkWood],
        ].map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-primary hover:border-primary/40"
          >
            {label}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        ))}
      </div>

      <p className="rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
        {tf.sourceNote}
      </p>
    </div>
  );
}
