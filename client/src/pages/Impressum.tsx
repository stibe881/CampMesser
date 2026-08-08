/**
 * Impressum (#409, Nutzerwunsch 07.08.2026).
 *
 * BEWUSST NUR AUF DEUTSCH: Rechtstexte sind Zusagen, keine Bedienoberfläche.
 * Eine maschinell übersetzte Datenschutzerklärung in vier Sprachen wäre
 * vier Mal eine Zusage, die niemand geprüft hat – die deutsche Fassung
 * ist die massgebliche, und das steht auch so da.
 *
 * DIE PLATZHALTER IN ECKIGEN KLAMMERN muss die Betreiberin/der Betreiber
 * selbst ausfüllen – Name und Postadresse erfindet die App nicht.
 */
import { Link } from "wouter";
import PageHeader from "@/components/PageHeader";
import { useI18n } from "@/i18n";

export default function ImpressumPage() {
  const { t } = useI18n();
  return (
    <div className="container max-w-2xl py-6">
      <PageHeader title={t.legal.imprintTitle} subtitle="" />
      <div className="space-y-4 text-sm leading-relaxed">
        <section>
          <h2 className="mb-1 font-serif text-base font-semibold">
            Verantwortlich für diese App
          </h2>
          <p>
            [Vorname Nachname]
            <br />
            [Strasse und Hausnummer]
            <br />
            [PLZ Ort]
            <br />
            Schweiz
          </p>
          <p className="mt-2">
            E-Mail:{" "}
            <a
              href="mailto:stefan.gross@stibe.me"
              className="font-medium text-primary hover:underline"
            >
              stefan.gross@stibe.me
            </a>
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-serif text-base font-semibold">Haftung</h2>
          <p className="text-muted-foreground">
            ReiseKompass ist ein privates Projekt ohne kommerzielle Absicht. Die
            Inhalte (Wetterdaten, Warnungen, Ratgeber, Rechenwerte) sind mit
            Sorgfalt zusammengestellt, bleiben aber Hinweise ohne Gewähr –
            massgeblich sind immer die amtlichen Stellen, die Platzordnung und
            der eigene Blick zum Himmel. Für Inhalte verlinkter externer Dienste
            sind deren Betreiber verantwortlich.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-serif text-base font-semibold">
            Datenschutz
          </h2>
          <p className="text-muted-foreground">
            Wie ReiseKompass mit Daten umgeht, steht in der{" "}
            <Link
              href="/datenschutz"
              className="font-medium text-primary hover:underline"
            >
              Datenschutzerklärung
            </Link>
            .
          </p>
        </section>
        <p className="text-xs text-muted-foreground">
          Massgeblich ist die deutsche Fassung dieser Seite.
        </p>
      </div>
    </div>
  );
}
