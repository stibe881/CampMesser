/**
 * Astro-Kalender: die grossen jährlichen Sternschnuppen-Ströme mit Maximum,
 * Raten und Beobachtungstipps – statische Daten, offline berechenbar.
 * Die Mondstörung am Maximum kommt aus shared/moon.ts.
 * Anzeigetexte (Name, Radiant, Tipp) sind L4 – Anzeige via `pick(..., lang)`.
 */
import { l4, type L4 } from "./i18n";
import { getMoonInfo } from "./moon";

export interface MeteorShower {
  id: string;
  name: L4;
  /** Maximum (Monat 1–12, Tag) – jährlich ungefähr gleich */
  peakMonth: number;
  peakDay: number;
  /** Aktivitätszeitraum */
  fromMonth: number;
  fromDay: number;
  toMonth: number;
  toDay: number;
  /** Zenitstundenrate: Sternschnuppen pro Stunde unter Idealbedingungen */
  zhr: number;
  /** Herkunftsrichtung am Himmel (Radiant) als Alltagstext */
  radiant: L4;
  tip: L4;
}

export const meteorShowers: MeteorShower[] = [
  {
    id: "quadrantiden",
    name: l4("Quadrantiden", "Quadrantides", "Quadrantidi", "Quadrantids"),
    peakMonth: 1,
    peakDay: 3,
    fromMonth: 12,
    fromDay: 28,
    toMonth: 1,
    toDay: 12,
    zhr: 110,
    radiant: l4(
      "Nordosten (unterhalb des Grossen Wagens)",
      "nord-est (sous la Grande Ourse)",
      "nord-est (sotto il Grande Carro)",
      "north-east (below the Big Dipper)"
    ),
    tip: l4(
      "Kurzes, scharfes Maximum von wenigen Stunden – die zweite Nachthälfte lohnt sich am meisten.",
      "Maximum court et marqué de quelques heures – la seconde moitié de la nuit est la plus intéressante.",
      "Massimo breve e netto di poche ore – la seconda metà della notte è la più conveniente.",
      "Short, sharp peak of just a few hours – the second half of the night is most rewarding."
    ),
  },
  {
    id: "lyriden",
    name: l4("Lyriden", "Lyrides", "Liridi", "Lyrids"),
    peakMonth: 4,
    peakDay: 22,
    fromMonth: 4,
    fromDay: 14,
    toMonth: 4,
    toDay: 30,
    zhr: 18,
    radiant: l4(
      "Osten (beim hellen Stern Wega)",
      "est (près de l'étoile brillante Véga)",
      "est (vicino alla stella luminosa Vega)",
      "east (near the bright star Vega)"
    ),
    tip: l4(
      "Erster grösserer Strom im Frühling – gelegentlich helle Feuerkugeln.",
      "Premier essaim important du printemps – parfois des bolides brillants.",
      "Primo sciame importante di primavera – occasionalmente bolidi luminosi.",
      "First larger shower of spring – occasionally bright fireballs."
    ),
  },
  {
    id: "eta-aquariiden",
    name: l4(
      "Eta-Aquariiden",
      "Êta aquarides",
      "Eta Aquaridi",
      "Eta Aquariids"
    ),
    peakMonth: 5,
    peakDay: 6,
    fromMonth: 4,
    fromDay: 19,
    toMonth: 5,
    toDay: 28,
    zhr: 50,
    radiant: l4(
      "Osten, tief am Horizont",
      "est, bas sur l'horizon",
      "est, basso sull'orizzonte",
      "east, low on the horizon"
    ),
    tip: l4(
      "Staub des Halleyschen Kometen – am besten in den letzten zwei Stunden vor der Morgendämmerung.",
      "Poussière de la comète de Halley – au mieux dans les deux dernières heures avant l'aube.",
      "Polvere della cometa di Halley – al meglio nelle ultime due ore prima dell'alba.",
      "Dust from Halley's Comet – best in the last two hours before dawn."
    ),
  },
  {
    id: "delta-aquariiden",
    name: l4(
      "Delta-Aquariiden",
      "Delta aquarides",
      "Delta Aquaridi",
      "Delta Aquariids"
    ),
    peakMonth: 7,
    peakDay: 30,
    fromMonth: 7,
    fromDay: 12,
    toMonth: 8,
    toDay: 23,
    zhr: 25,
    radiant: l4("Süden", "sud", "sud", "south"),
    tip: l4(
      "Breites Maximum ohne Spitze – über mehrere Nächte gleich gut zu sehen.",
      "Maximum large sans pic – aussi bien visible sur plusieurs nuits.",
      "Massimo ampio senza picco – visibile ugualmente bene per più notti.",
      "Broad peak without a spike – equally good over several nights."
    ),
  },
  {
    id: "perseiden",
    name: l4("Perseiden", "Perséides", "Perseidi", "Perseids"),
    peakMonth: 8,
    peakDay: 12,
    fromMonth: 7,
    fromDay: 17,
    toMonth: 8,
    toDay: 24,
    zhr: 100,
    radiant: l4(
      "Nordosten (Sternbild Perseus)",
      "nord-est (constellation de Persée)",
      "nord-est (costellazione di Perseo)",
      "north-east (constellation Perseus)"
    ),
    tip: l4(
      "Der Klassiker der Camping-Saison: warme Nächte, hohe Raten – Liegestuhl raus ab 22 Uhr.",
      "Le classique de la saison de camping : nuits chaudes, taux élevés – sors la chaise longue dès 22 h.",
      "Il classico della stagione del campeggio: notti calde, tassi elevati – fuori la sdraio dalle 22.",
      "The classic of the camping season: warm nights, high rates – get the deckchair out from 10 pm."
    ),
  },
  {
    id: "draconiden",
    name: l4("Draconiden", "Draconides", "Draconidi", "Draconids"),
    peakMonth: 10,
    peakDay: 8,
    fromMonth: 10,
    fromDay: 6,
    toMonth: 10,
    toDay: 10,
    zhr: 10,
    radiant: l4(
      "Nordwesten (Sternbild Drache)",
      "nord-ouest (constellation du Dragon)",
      "nord-ovest (costellazione del Drago)",
      "north-west (constellation Draco)"
    ),
    tip: l4(
      "Ausnahme-Strom: am besten am frühen Abend statt nach Mitternacht.",
      "Essaim atypique : au mieux en début de soirée plutôt qu'après minuit.",
      "Sciame atipico: al meglio in prima serata invece che dopo mezzanotte.",
      "The exception among showers: best in the early evening instead of after midnight."
    ),
  },
  {
    id: "orioniden",
    name: l4("Orioniden", "Orionides", "Orionidi", "Orionids"),
    peakMonth: 10,
    peakDay: 21,
    fromMonth: 10,
    fromDay: 2,
    toMonth: 11,
    toDay: 7,
    zhr: 20,
    radiant: l4(
      "Osten (oberhalb des Orion)",
      "est (au-dessus d'Orion)",
      "est (sopra Orione)",
      "east (above Orion)"
    ),
    tip: l4(
      "Schnelle, oft helle Meteore – ebenfalls Staub des Halleyschen Kometen.",
      "Météores rapides, souvent brillants – également de la poussière de la comète de Halley.",
      "Meteore veloci, spesso luminose – anch'esse polvere della cometa di Halley.",
      "Fast, often bright meteors – also dust from Halley's Comet."
    ),
  },
  {
    id: "leoniden",
    name: l4("Leoniden", "Léonides", "Leonidi", "Leonids"),
    peakMonth: 11,
    peakDay: 17,
    fromMonth: 11,
    fromDay: 6,
    toMonth: 11,
    toDay: 30,
    zhr: 15,
    radiant: l4(
      "Osten (Sternbild Löwe)",
      "est (constellation du Lion)",
      "est (costellazione del Leone)",
      "east (constellation Leo)"
    ),
    tip: l4(
      "Sehr schnelle Meteore mit langen Leuchtspuren – zweite Nachthälfte.",
      "Météores très rapides avec de longues traînées lumineuses – seconde moitié de la nuit.",
      "Meteore molto veloci con lunghe scie luminose – seconda metà della notte.",
      "Very fast meteors with long glowing trails – second half of the night."
    ),
  },
  {
    id: "geminiden",
    name: l4("Geminiden", "Géminides", "Geminidi", "Geminids"),
    peakMonth: 12,
    peakDay: 13,
    fromMonth: 12,
    fromDay: 4,
    toMonth: 12,
    toDay: 17,
    zhr: 150,
    radiant: l4(
      "Osten (Sternbild Zwillinge)",
      "est (constellation des Gémeaux)",
      "est (costellazione dei Gemelli)",
      "east (constellation Gemini)"
    ),
    tip: l4(
      "Der stärkste Strom des Jahres – lohnt sich trotz Kälte schon ab dem frühen Abend.",
      "L'essaim le plus fort de l'année – vaut le coup malgré le froid dès le début de soirée.",
      "Lo sciame più forte dell'anno – vale la pena nonostante il freddo già dalla prima serata.",
      "The strongest shower of the year – worth it despite the cold from the early evening."
    ),
  },
  {
    id: "ursiden",
    name: l4("Ursiden", "Ursides", "Ursidi", "Ursids"),
    peakMonth: 12,
    peakDay: 22,
    fromMonth: 12,
    fromDay: 17,
    toMonth: 12,
    toDay: 26,
    zhr: 10,
    radiant: l4(
      "Norden (Kleiner Wagen)",
      "nord (Petite Ourse)",
      "nord (Piccolo Carro)",
      "north (Little Dipper)"
    ),
    tip: l4(
      "Kleiner, oft übersehener Strom in den längsten Nächten des Jahres.",
      "Petit essaim souvent oublié pendant les nuits les plus longues de l'année.",
      "Sciame piccolo e spesso trascurato nelle notti più lunghe dell'anno.",
      "Small, often overlooked shower during the longest nights of the year."
    ),
  },
];

export interface UpcomingShower {
  shower: MeteorShower;
  /** Nächstes Maximum (heute oder in der Zukunft) */
  peakDate: Date;
  daysUntilPeak: number;
  /** Ist der Strom am Stichtag bereits aktiv? */
  activeNow: boolean;
  /** Mondbeleuchtung am Maximum (0–1) */
  moonIllumination: number;
  /** Stört der Mond die Beobachtung deutlich (> 60 % beleuchtet)? */
  moonInterferes: boolean;
}

const DAY_MS = 86400000;

function nextPeakDate(shower: MeteorShower, from: Date): Date {
  const candidate = new Date(
    from.getFullYear(),
    shower.peakMonth - 1,
    shower.peakDay
  );
  if (candidate.getTime() < from.getTime() - DAY_MS / 2) {
    return new Date(
      from.getFullYear() + 1,
      shower.peakMonth - 1,
      shower.peakDay
    );
  }
  return candidate;
}

/** Liegt das Datum im Aktivitätszeitraum (auch über den Jahreswechsel)? */
export function isShowerActive(shower: MeteorShower, date: Date): boolean {
  const dayKey = (date.getMonth() + 1) * 100 + date.getDate();
  const fromKey = shower.fromMonth * 100 + shower.fromDay;
  const toKey = shower.toMonth * 100 + shower.toDay;
  if (fromKey <= toKey) return dayKey >= fromKey && dayKey <= toKey;
  // Zeitraum über den Jahreswechsel (z. B. Quadrantiden Ende Dez. – Mitte Jan.)
  return dayKey >= fromKey || dayKey <= toKey;
}

/** Die nächsten Strom-Maxima ab Stichtag, sortiert nach Nähe. */
export function upcomingShowers(from: Date, count = 4): UpcomingShower[] {
  const startOfDay = new Date(
    from.getFullYear(),
    from.getMonth(),
    from.getDate()
  );
  return meteorShowers
    .map(shower => {
      const peakDate = nextPeakDate(shower, startOfDay);
      const moon = getMoonInfo(peakDate);
      return {
        shower,
        peakDate,
        daysUntilPeak: Math.round(
          (peakDate.getTime() - startOfDay.getTime()) / DAY_MS
        ),
        activeNow: isShowerActive(shower, startOfDay),
        moonIllumination: moon.illumination,
        moonInterferes: moon.illumination > 0.6,
      };
    })
    .sort((a, b) => a.daysUntilPeak - b.daysUntilPeak)
    .slice(0, count);
}
