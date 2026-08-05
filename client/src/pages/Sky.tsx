import { useState } from "react";
import { useLocation } from "wouter";
import PageHeader from "@/components/PageHeader";
import RedLightMode from "@/components/RedLightMode";
import {
  ConstellationFinder,
  DarkSkySection,
  IssPasses,
  MeteorCalendar,
  MoonCalendar,
  RedLightSection,
} from "@/components/SkyPanels";
import { useI18n } from "@/i18n";
import type { NatureEntry } from "@/data/nature";

/**
 * «Himmel»: alles für den Abend draussen an einem Ort.
 *
 * WARUM ES DIESE SEITE GIBT: Mond, Sternschnuppen, ISS-Überflüge und der
 * Sternbild-Finder standen im Natur-Modul, die Dunkelheit im Platz-Dossier
 * und der Sonnenstand in einem eigenen Werkzeug. Das ist EINE Tätigkeit –
 * es dämmert, man setzt sich hin und schaut hoch –, verteilt auf vier
 * Einstiege, von denen die Hälfte gar keinen sichtbaren hatte. Wer wissen
 * wollte, ob heute Nacht etwas los ist, musste raten, wo er nachschaut.
 *
 * REIHENFOLGE nach dem Ablauf des Abends: Erst die Frage «lohnt es sich
 * überhaupt» (Mond, Dunkelheit), dann «gibt es etwas Besonderes»
 * (Sternschnuppen, ISS), dann das Werkzeug zum Hinschauen (Sternbilder) und
 * zuletzt das Rotlicht, das man einschaltet, wenn man wirklich draussen
 * sitzt.
 *
 * Der Sprung ins Natur-Lexikon geht über die Adresse `/natur?eintrag=…`,
 * weil das Lexikon auf der anderen Seite geblieben ist.
 */
export default function SkyPage() {
  const { t } = useI18n();
  const [, navigate] = useLocation();
  const [redLight, setRedLight] = useState(false);

  /** Aus dem Sternbild-Finder ins Natur-Lexikon springen. */
  const openLexiconEntry = (entry: NatureEntry) => {
    navigate(`/natur?eintrag=${encodeURIComponent(entry.id)}`);
  };

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader title={t.sky.title} subtitle={t.sky.subtitle} />

      <MoonCalendar />
      <DarkSkySection />
      <MeteorCalendar />
      <IssPasses />
      <ConstellationFinder onOpenEntry={openLexiconEntry} />
      <RedLightSection
        active={redLight}
        onToggle={() => setRedLight(v => !v)}
      />
      {redLight && <RedLightMode onExit={() => setRedLight(false)} />}
    </div>
  );
}
