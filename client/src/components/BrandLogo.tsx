/**
 * CampMesser-Bildmarke: die aufgeklappte Klinge eines Taschenmessers, deren
 * Rücken schräg nach rechts oben in eine Spitze läuft. Der Griff darunter
 * trägt den Nietenpunkt. Klinge und Griff bilden zusammen die Andeutung eines
 * Zeltes – Werkzeug und Camping in einem Zeichen.
 *
 * Als handgezeichnetes SVG umgesetzt (statt Bilddatei), damit die Marke in jeder
 * Grösse scharf bleibt, echte Transparenz besitzt und ihre Farbe per
 * `currentColor` übernimmt – so funktioniert sie unverändert im hellen und im
 * dunklen Design.
 */
export default function BrandLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/*
        Klinge: vom Drehpunkt links unten steigt der Rücken zur Spitze rechts
        oben, die Schneide verläuft darunter flacher zurück – eine geschlossene,
        asymmetrische Form, die eindeutig als Messerklinge lesbar ist.
      */}
      <path d="M14 40 L52 12 C54 19 48 32 36 40 Z" />
      {/* Griff des Taschenmessers */}
      <rect x="8" y="43" width="48" height="13" rx="6.5" />
      {/* Nietenpunkt am Griff */}
      <circle cx="17.5" cy="49.5" r="2.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
