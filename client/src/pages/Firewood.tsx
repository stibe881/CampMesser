/**
 * Feuerholz-Bedarf (#287) als eigenes Modul (Nutzerwunsch 04.08.2026).
 *
 * Der Rechner sass zuerst unten im Energie-Budget, weil Holz auch Energie
 * ist. In der Bedienung stimmte das aber nicht: Das Energie-Modul dreht
 * sich um Powerstation, Verbraucher und Solarertrag – wer wissen will, wie
 * viele Netze ins Auto müssen, sucht das nicht unter «Strom». Zwei ganz
 * verschiedene Fragen, also zwei Kacheln.
 *
 * Die Seite ist bewusst dünn: Die ganze Rechnung steckt in
 * `shared/firewood.ts` und der Bedienteil in `FirewoodCalculator`, der
 * seit jeher eigenständig ist.
 */
import PageHeader from "@/components/PageHeader";
import FirewoodCalculator from "@/components/FirewoodCalculator";
import { useT } from "@/i18n";

export default function FirewoodPage() {
  const t = useT();
  return (
    <div className="container max-w-2xl py-6">
      <PageHeader title={t.firewood.title} subtitle={t.firewood.intro} />
      <FirewoodCalculator />
    </div>
  );
}
