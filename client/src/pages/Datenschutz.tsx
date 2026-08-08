/**
 * Datenschutzerklärung (#409, Nutzerwunsch 07.08.2026).
 *
 * Geschrieben nach dem, was die App WIRKLICH tut – revidiertes Schweizer
 * Datenschutzgesetz (revDSG) und, soweit anwendbar, DSGVO. Bewusst nur
 * auf Deutsch (Begründung in Impressum.tsx); massgeblich ist diese
 * Fassung. Wenn die App neue Dienste anbindet, gehört diese Seite
 * NACHGEFÜHRT – sie ist eine Zusage, kein Feigenblatt.
 */
import { Link } from "wouter";
import PageHeader from "@/components/PageHeader";
import { useI18n } from "@/i18n";

/** Externe Dienste, die der Browser direkt abruft (IP-Adresse sichtbar). */
const EXTERNAL_SERVICES: { name: string; purpose: string }[] = [
  { name: "Open-Meteo", purpose: "Wetter-, Klima- und Solar-Prognosen" },
  {
    name: "OpenStreetMap / Kachel-Server",
    purpose: "Kartenanzeige und Offline-Karten",
  },
  { name: "Overpass API", purpose: "Orte in der Umgebung (Läden, Wege …)" },
  { name: "OSRM", purpose: "Routen- und Fahrzeitberechnung" },
  { name: "RainViewer", purpose: "Regenradar" },
  { name: "MeteoAlarm", purpose: "Amtliche Unwetterwarnungen" },
  {
    name: "geo.admin.ch / BAFU",
    purpose: "Waldbrandgefahr und amtliche Geodaten (Schweiz)",
  },
  { name: "transport.opendata.ch", purpose: "ÖV-Abfahrten am Platz" },
  {
    name: "Google Maps",
    purpose: "Kartenanzeige, nur falls eingerichtet – sonst OpenStreetMap",
  },
  {
    name: "Ausflugfinder (eigene Anbindung)",
    purpose: "Ausflugsziele in der Umgebung",
  },
];

export default function DatenschutzPage() {
  const { t } = useI18n();
  return (
    <div className="container max-w-2xl py-6">
      <PageHeader title={t.legal.privacyTitle} subtitle="" />
      <div className="space-y-5 text-sm leading-relaxed">
        <section>
          <h2 className="mb-1 font-serif text-base font-semibold">
            1. Verantwortlicher
          </h2>
          <p className="text-muted-foreground">
            Verantwortlich für die Datenbearbeitung ist die im{" "}
            <Link
              href="/impressum"
              className="font-medium text-primary hover:underline"
            >
              Impressum
            </Link>{" "}
            genannte Person. Es gelten das revidierte Schweizer
            Datenschutzgesetz (revDSG) und, soweit anwendbar, die DSGVO.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-serif text-base font-semibold">
            2. Konto und eigene Inhalte
          </h2>
          <p className="text-muted-foreground">
            Für ein Konto speichert CampMesser deine E-Mail-Adresse, das
            Passwort ausschliesslich als Hash (oder einen Passkey) sowie die
            Inhalte, die du selbst anlegst: Reisen, Pack- und Einkaufslisten,
            Plätze, Fotos, Notizen, Einstellungen und Ähnliches. Zweck ist
            allein der Betrieb der App. Gelöschtes liegt bis 30 Tage im
            Papierkorb; die Konto-Löschung im Profil entfernt sämtliche Daten
            endgültig.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-serif text-base font-semibold">
            3. Hosting und Server-Protokolle
          </h2>
          <p className="text-muted-foreground">
            Die App läuft auf Servern von Hetzner (Deutschland). Beim Zugriff
            entstehen technische Protokolle (IP-Adresse, Zeitpunkt, aufgerufene
            Adresse), die dem sicheren Betrieb dienen und turnusmässig gelöscht
            werden.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-serif text-base font-semibold">
            4. Cookies und lokale Speicherung
          </h2>
          <p className="text-muted-foreground">
            CampMesser verwendet ausschliesslich technisch notwendige Cookies
            (Anmelde-Sitzung) und die lokale Speicherung des Geräts
            (Einstellungen, Offline-Daten). Es gibt kein Tracking, keine Werbung
            und keine Analyse-Dienste – deshalb auch keinen
            Einwilligungs-Banner, sondern nur diesen Hinweis.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-serif text-base font-semibold">
            5. Wetter-, Karten- und Umgebungsdienste
          </h2>
          <p className="mb-2 text-muted-foreground">
            Einige Funktionen rufen Daten direkt von externen Diensten ab. Dabei
            erhält der jeweilige Dienst technisch bedingt deine IP-Adresse und
            die angefragten Koordinaten (z. B. die deines Platzes).
            Standortdaten deines Geräts werden nur mit deiner Freigabe im
            Browser/Betriebssystem verwendet und nicht auf dem CampMesser-Server
            gespeichert, ausser du legst sie selbst ab (z. B. als Platz).
          </p>
          <ul className="space-y-1 text-muted-foreground">
            {EXTERNAL_SERVICES.map(service => (
              <li key={service.name}>
                <span className="font-medium text-foreground">
                  {service.name}
                </span>{" "}
                – {service.purpose}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-1 font-serif text-base font-semibold">
            6. Mitteilungen und E-Mail
          </h2>
          <p className="text-muted-foreground">
            Push-Mitteilungen gibt es nur, wenn du sie im Gerät ausdrücklich
            erlaubst; abbestellen kannst du sie jederzeit im Profil oder im
            Betriebssystem. E-Mails verschickt die App nur funktional
            (Bestätigung, Passwort-Zurücksetzen) – keinen Newsletter.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-serif text-base font-semibold">
            7. Geteilte Links
          </h2>
          <p className="text-muted-foreground">
            Teil-Links (Platz-Dossier, Packvorlagen, Reise-Hub …) machen genau
            die verlinkten Inhalte für alle lesbar, die den Link kennen. Du
            kannst jeden Teil-Link in der App widerrufen; ausserdem lassen sich
            Ablaufdaten setzen.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-serif text-base font-semibold">
            8. Deine Rechte
          </h2>
          <p className="text-muted-foreground">
            Du hast das Recht auf Auskunft, Berichtigung und Löschung deiner
            Daten sowie auf Widerspruch gegen eine Bearbeitung. Am schnellsten:
            Inhalte direkt in der App ändern oder das Konto im Profil löschen.
            Für alles andere genügt eine E-Mail an die im Impressum genannte
            Adresse.
          </p>
        </section>

        <p className="text-xs text-muted-foreground">
          Stand: 7. August 2026. Massgeblich ist die deutsche Fassung.
        </p>
      </div>
    </div>
  );
}
