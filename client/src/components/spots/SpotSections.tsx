/**
 * Gliederung des Platz-Dossiers (#304/#439, aus SpotDetail.tsx
 * herausgelöst): Abschnitts-Überschriften, die fünf Abschnitts-Ids samt
 * Beschriftung und die Sprungleiste.
 */
import type { ReactNode } from "react";
import { useI18n } from "@/i18n";
import type { SpotSectionKey } from "@shared/spotSections";

/**
 * Überschrift über einem Abschnitt des Dossiers.
 *
 * WOZU: Die Seite trägt zwei Dutzend Karten. Ohne Gliederung sucht man das
 * Zeckenrisiko zwischen Badestelle und Wanderwegen und die Reisekosten
 * irgendwo zwischen Kontaktdaten und Sonnenlauf. Die fünf Abschnitte
 * folgen der Reihenfolge, in der man die Fragen stellt: Was ist das für
 * ein Platz – wie komme ich hin – was für Wetter erwartet mich – was gibt
 * es rundherum – und was habe ich selbst dort abgelegt.
 *
 * Ein `<h2>`, kein optisch gestylter Absatz: Wer die Seite mit einer
 * Vorlesehilfe durchgeht, springt damit von Abschnitt zu Abschnitt.
 */
export function SectionHeading({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return (
    <h2
      id={id}
      // scroll-mt: Beim Sprung aus der Leiste soll die Überschrift nicht
      // unter der Kopfzeile verschwinden.
      className="mb-2 mt-6 scroll-mt-20 font-serif text-sm font-semibold uppercase tracking-wide text-muted-foreground"
    >
      {children}
    </h2>
  );
}

/** Die fünf Abschnitte des Dossiers – Reihenfolge wie auf der Seite. */
export const SECTION_IDS = {
  place: "abschnitt-platz",
  arrival: "abschnitt-anreise",
  weather: "abschnitt-wetter",
  around: "abschnitt-umgebung",
  own: "abschnitt-eigenes",
} as const;

/**
 * Beschriftung je Abschnitt – als Funktion, weil die Sprache erst zur
 * Laufzeit feststeht. Sie steht neben den Ids, damit Sprungleiste und
 * Reihenfolge (#371) aus derselben Quelle schöpfen.
 */
export const SECTION_LABELS = (
  t: ReturnType<typeof useI18n>["t"]
): Record<SpotSectionKey, string> => ({
  place: t.spotDetail.sectionPlace,
  arrival: t.spotDetail.sectionArrival,
  weather: t.spotDetail.sectionWeather,
  around: t.spotDetail.sectionAround,
  own: t.spotDetail.sectionOwn,
});

/**
 * Sprungleiste über die fünf Abschnitte.
 *
 * Das Dossier ist lang – wer unterwegs die Öffnungszeiten des Ladens sucht,
 * scrollt sonst an Wetter, Sonne und Anreise vorbei. Bewusst normale
 * Sprungmarken (`<a href="#…">`): Das funktioniert ohne JavaScript, die
 * Tastatur kann es, und der Zurück-Knopf bleibt unbelastet.
 */
export function SectionNav({
  labels,
  ariaLabel,
}: {
  labels: [string, string][];
  ariaLabel: string;
}) {
  return (
    <nav
      aria-label={ariaLabel}
      className="mb-4 -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0"
    >
      <ul className="flex w-max gap-1.5">
        {labels.map(([id, label]) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className="inline-block rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
