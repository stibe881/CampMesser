/**
 * ReiseKompass-Bildmarke: ein Kompass mit schräg auf Nordost gestellter
 * Nadel. Der Ring ist das Zifferblatt, die Nordhälfte der Nadel ist gefüllt,
 * der Punkt in der Mitte ist die Lagerung – darüber sitzt der Nord-Strich.
 * Die Nadel zeigt bewusst nicht stur nach oben: Aufbruch, nicht Stillstand.
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
      {/* Zifferblatt */}
      <circle cx="32" cy="34" r="21" />
      {/* Nord-Strich über dem Ring */}
      <path d="M32 5 L32 9" />
      {/*
        Nadel als Raute von Südwest nach Nordost. Die Nordhälfte (Spitze
        oben rechts) ist gefüllt, damit die Richtung auch klein lesbar bleibt.
      */}
      <path d="M42.6 23.4 L35.2 37.2 L28.8 30.8 Z" fill="currentColor" />
      <path d="M42.6 23.4 L35.2 37.2 L21.4 44.6 L28.8 30.8 Z" />
      {/* Lagerpunkt der Nadel */}
      <circle cx="32" cy="34" r="2.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
