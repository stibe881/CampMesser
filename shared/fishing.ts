/**
 * Fangbuch (#236): Fischarten-Datensatz und Prüflogik fürs Angeln in der
 * Schweiz.
 *
 * WICHTIG zur Rechtslage: Die Fischerei ist in der Schweiz kantonal geregelt.
 * Der Bund gibt in der Verordnung zum Bundesgesetz über die Fischerei
 * (VBGF, SR 923.01, Stand 1. Januar 2021) nur MINDESTVORGABEN vor:
 *
 * - Art. 1 Abs. 1: die Schonzeit muss für einige Arten mindestens so viele
 *   WOCHEN dauern (der Bund nennt bewusst KEINE Kalenderdaten).
 * - Art. 1 Abs. 2: die Kantone legen Beginn und Ende so fest, dass die
 *   Fortpflanzungsperiode umfasst ist. Abs. 3: sie dürfen verlängern und auf
 *   weitere Arten ausdehnen.
 * - Art. 2 Abs. 1: Fangmindestmasse in cm für wenige Arten; Abs. 2: gemessen
 *   von der Kopfspitze bis zu den Spitzen der natürlich ausgebreiteten
 *   Schwanzflosse. Abs. 4: die Kantone dürfen sie erhöhen und ausdehnen.
 * - Art. 2a Abs. 1: Fische, die in Anhang 1 mit Gefährdungsstatus 0, 1 oder 2
 *   stehen und für die keine Schonzeit und kein Fangmindestmass gilt, dürfen
 *   NICHT gefangen werden. Abs. 2: Lachse sind der kantonalen Fischereifach-
 *   stelle unverzüglich zu melden.
 *
 * Deshalb trägt jede Art hier drei klar getrennte Ebenen:
 * `federal`   – wörtlich aus der VBGF, verbindliche Untergrenze des Bundes.
 * `guide`     – Richtwert-Schonzeit als Kalenderfenster. NICHT verbindlich:
 *               abgeleitet aus der Laichzeit (dem Kriterium, das die VBGF den
 *               Kantonen vorgibt) und abgeglichen mit kantonalen Erlassen.
 * `cantonHint`– was Kantone in der Praxis strenger regeln.
 *
 * Massgebend sind immer die kantonale Fischereiverordnung und das Patent.
 */

import { l4, type L4 } from "./i18n";

/** Stand des Datensatzes (ISO) – wird in der App sichtbar angezeigt. */
export const FISHING_DATA_UPDATED = "2026-08-03";

/** Fassung der VBGF, auf der die Bundeswerte beruhen. */
export const VBGF_VERSION = "SR 923.01, Stand 1. Januar 2021";

/**
 * Formale Obergrenzen der Eingabe – bewusst grosszügig: der Wels wird in
 * europäischen Gewässern über zwei Meter lang und weit über 50 kg schwer.
 */
export const FISH_MAX_LENGTH_CM = 300;
export const FISH_MAX_WEIGHT_KG = 150;

/** Kalenderfenster (Tag/Monat), Wechsel über den Jahresanfang erlaubt. */
export interface DayWindow {
  fromMonth: number;
  fromDay: number;
  toMonth: number;
  toDay: number;
}

/** Gefährdungsstatus nach VBGF Anhang 1 (0 = ausgestorben … NG = nicht gefährdet). */
export type RedListStatus = "0" | "1" | "2" | "3" | "4" | "NG";

/** Bundesrechtliche Mindestvorgaben einer Art (VBGF Art. 1, 2 und 2a). */
export interface FederalRule {
  /** Fangmindestmass in cm nach Art. 2 Abs. 1; null = keine Bundesvorgabe. */
  minLengthCm: number | null;
  /** Mindestdauer der Schonzeit in Wochen nach Art. 1 Abs. 1; null = keine. */
  closedWeeks: number | null;
  /** Zusatz zum Bundeswert (z. B. abweichendes Mass in grossen Seen). */
  note?: L4;
  /** Gefährdungsstatus nach Anhang 1 VBGF. */
  status: RedListStatus;
  /** true = Fangverbot nach Art. 2a Abs. 1 (Status 0/1/2 ohne Schonvorschrift). */
  banned?: boolean;
  /** true = Meldepflicht an die kantonale Fischereifachstelle (Art. 2a Abs. 2). */
  reportRequired?: boolean;
}

export interface FishSpecies {
  id: string;
  name: L4;
  /** Wissenschaftlicher Name – sprachneutral. */
  latin: string;
  /** Bevorzugtes Gewässer: fliessend, stehend oder beides. */
  waters: "fliessend" | "stehend" | "beide";
  federal: FederalRule;
  /**
   * Richtwert-Schonzeit (Kalenderfenster). NICHT verbindlich – siehe Kopf.
   * null = für diese Art ist keine verbreitete Schonzeit hinterlegt.
   */
  guideClosedSeason: DayWindow | null;
  /** Was Kantone typischerweise strenger regeln (Masse, Schonzeiten). */
  cantonHint: L4;
  /** Lebensraum und wo man die Art findet. */
  habitat: L4;
  /** Köder- und Methoden-Tipp. */
  method: L4;
}

/**
 * Die wichtigsten Arten der Schweizer Angelfischerei.
 * Bundeswerte wörtlich aus VBGF Art. 1/2/2a und Anhang 1.
 */
export const FISH_SPECIES: FishSpecies[] = [
  {
    id: "bachforelle",
    name: l4(
      "Bachforelle",
      "Truite de rivière",
      "Trota di torrente",
      "Brown trout"
    ),
    latin: "Salmo trutta",
    waters: "fliessend",
    federal: {
      minLengthCm: 22,
      closedWeeks: 16,
      status: "4",
      note: l4(
        "In grösseren stehenden Gewässern unter 800 m ü. M. gilt 35 cm; die Mindestdauer der Schonzeit beträgt dort 12 statt 16 Wochen.",
        "Dans les plus grands plans d'eau stagnante en dessous de 800 m d'altitude, la limite est de 35 cm ; la durée minimale de protection y est de 12 semaines au lieu de 16.",
        "Nelle acque stagnanti più grandi sotto gli 800 m s.l.m. valgono 35 cm; la durata minima del periodo di protezione è di 12 settimane invece di 16.",
        "In larger standing waters below 800 m the limit is 35 cm; the minimum closed season there is 12 weeks instead of 16."
      ),
    },
    guideClosedSeason: { fromMonth: 10, fromDay: 1, toMonth: 3, toDay: 15 },
    cantonHint: l4(
      "Viele Kantone verlangen 24–28 cm, an Seen bis 40 cm, und setzen die Schonzeit von Anfang Oktober bis Mitte März oder Ende April.",
      "De nombreux cantons exigent 24–28 cm, jusqu'à 40 cm sur les lacs, et fixent la protection de début octobre à mi-mars ou fin avril.",
      "Molti cantoni chiedono 24–28 cm, fino a 40 cm sui laghi, e fissano il periodo di protezione da inizio ottobre a metà marzo o fine aprile.",
      "Many cantons require 24–28 cm, up to 40 cm on lakes, and set the closed season from early October to mid-March or end of April."
    ),
    habitat: l4(
      "Kühle, sauerstoffreiche Bäche und Flüsse mit Kiesgrund, Unterstände unter Wurzeln und Steinen.",
      "Ruisseaux et rivières frais et bien oxygénés à fond de gravier, abris sous racines et pierres.",
      "Ruscelli e fiumi freschi e ricchi di ossigeno con fondo ghiaioso, ripari sotto radici e pietre.",
      "Cool, well-oxygenated brooks and rivers with gravel beds, cover under roots and stones."
    ),
    method: l4(
      "Nymphe, Trockenfliege oder kleiner Spinner flussaufwärts geführt.",
      "Nymphe, mouche sèche ou petite cuiller ramenée vers l'amont.",
      "Ninfa, mosca secca o piccolo cucchiaino condotto verso monte.",
      "Nymph, dry fly or a small spinner worked upstream."
    ),
  },
  {
    id: "seeforelle",
    name: l4("Seeforelle", "Truite lacustre", "Trota lacustre", "Lake trout"),
    latin: "Salmo trutta lacustris",
    waters: "stehend",
    federal: {
      minLengthCm: 35,
      closedWeeks: 12,
      status: "2",
      note: l4(
        "35 cm gelten in grösseren stehenden Gewässern unter 800 m ü. M.; in den übrigen Gewässern 22 cm.",
        "Les 35 cm s'appliquent aux plus grands plans d'eau stagnante en dessous de 800 m ; ailleurs 22 cm.",
        "I 35 cm valgono nelle acque stagnanti più grandi sotto gli 800 m; altrove 22 cm.",
        "The 35 cm apply in larger standing waters below 800 m; elsewhere 22 cm."
      ),
    },
    guideClosedSeason: { fromMonth: 10, fromDay: 1, toMonth: 12, toDay: 31 },
    cantonHint: l4(
      "An den grossen Seen liegt das Mass meist bei 40–50 cm, die Schonzeit oft vom 1. Oktober bis 25. Dezember.",
      "Sur les grands lacs, la taille est en général de 40–50 cm, la protection souvent du 1er octobre au 25 décembre.",
      "Sui grandi laghi la misura è di solito 40–50 cm, il periodo di protezione spesso dal 1° ottobre al 25 dicembre.",
      "On the big lakes the size is usually 40–50 cm, the closed season often 1 October to 25 December."
    ),
    habitat: l4(
      "Tiefe Seen; zum Laichen zieht sie in die Zuflüsse.",
      "Lacs profonds ; elle remonte les affluents pour frayer.",
      "Laghi profondi; per la frega risale gli immissari.",
      "Deep lakes; runs up the inflowing rivers to spawn."
    ),
    method: l4(
      "Schleppfischerei mit Blinker oder Köderfisch in mittlerer Tiefe.",
      "Pêche à la traîne avec cuiller ondulante ou poisson-appât à mi-profondeur.",
      "Pesca a traina con ondulante o pesce esca a media profondità.",
      "Trolling with a spoon or bait fish at mid depth."
    ),
  },
  {
    id: "regenbogenforelle",
    name: l4(
      "Regenbogenforelle",
      "Truite arc-en-ciel",
      "Trota iridea",
      "Rainbow trout"
    ),
    latin: "Oncorhynchus mykiss",
    waters: "beide",
    federal: {
      minLengthCm: null,
      closedWeeks: null,
      status: "NG",
      note: l4(
        "Landesfremde Art (VBGF Anhang 2) – der Bund macht weder Mass noch Schonzeit vor.",
        "Espèce non indigène (annexe 2 OLFP) – la Confédération ne fixe ni taille ni protection.",
        "Specie non indigena (allegato 2 OLFP) – la Confederazione non fissa né misura né protezione.",
        "Non-native species (VBGF annex 2) – the federal level sets neither size nor closed season."
      ),
    },
    guideClosedSeason: null,
    cantonHint: l4(
      "Meist ohne Schonzeit, das Mindestmass liegt je nach Kanton bei 22–26 cm.",
      "Le plus souvent sans période de protection, la taille minimale est de 22–26 cm selon le canton.",
      "Di solito senza periodo di protezione, la misura minima è di 22–26 cm a seconda del cantone.",
      "Usually no closed season, the minimum size is 22–26 cm depending on the canton."
    ),
    habitat: l4(
      "Besetzte Bäche, Stauseen und Fischerteiche; verträgt wärmeres Wasser als die Bachforelle.",
      "Ruisseaux empoissonnés, retenues et étangs de pêche ; supporte une eau plus chaude que la truite de rivière.",
      "Ruscelli ripopolati, bacini e laghetti di pesca; tollera acqua più calda della trota di torrente.",
      "Stocked brooks, reservoirs and fishing ponds; tolerates warmer water than the brown trout."
    ),
    method: l4(
      "Spinner, Streamer oder Teig – sie beisst deutlich unbekümmerter.",
      "Cuiller, streamer ou pâte – elle mord nettement plus volontiers.",
      "Cucchiaino, streamer o pasta – abbocca decisamente più facilmente.",
      "Spinner, streamer or paste bait – it takes far more readily."
    ),
  },
  {
    id: "seesaibling",
    name: l4(
      "Seesaibling (Rötel)",
      "Omble chevalier",
      "Salmerino alpino",
      "Arctic char"
    ),
    latin: "Salvelinus umbla",
    waters: "stehend",
    federal: { minLengthCm: 22, closedWeeks: 8, status: "3" },
    guideClosedSeason: { fromMonth: 10, fromDay: 1, toMonth: 12, toDay: 31 },
    cantonHint: l4(
      "Häufig 25–30 cm und eine Schonzeit vom 1. Oktober bis 25. Dezember.",
      "Souvent 25–30 cm et une protection du 1er octobre au 25 décembre.",
      "Spesso 25–30 cm e una protezione dal 1° ottobre al 25 dicembre.",
      "Often 25–30 cm and a closed season from 1 October to 25 December."
    ),
    habitat: l4(
      "Kalte, tiefe Seen des Mittellands und der Alpen.",
      "Lacs froids et profonds du Plateau et des Alpes.",
      "Laghi freddi e profondi dell'Altopiano e delle Alpi.",
      "Cold, deep lakes of the Swiss Plateau and the Alps."
    ),
    method: l4(
      "Hegene mit kleinen Nymphen im Freiwasser, oft tief.",
      "Gambe de perche avec de petites nymphes en pleine eau, souvent profond.",
      "Bandiera con piccole ninfe in acqua libera, spesso in profondità.",
      "A team of small nymphs fished in open water, often deep."
    ),
  },
  {
    id: "felchen",
    name: l4("Felchen", "Corégone", "Coregone", "Whitefish"),
    latin: "Coregonus spp.",
    waters: "stehend",
    federal: { minLengthCm: 25, closedWeeks: 6, status: "4" },
    guideClosedSeason: { fromMonth: 11, fromDay: 1, toMonth: 1, toDay: 15 },
    cantonHint: l4(
      "Seespezifisch geregelt – Schonzeiten liegen meist zwischen Mitte November und Mitte Januar, dazu gelten oft Tagesfanglimiten.",
      "Réglé lac par lac – les périodes de protection vont le plus souvent de mi-novembre à mi-janvier, avec souvent des limites de prise journalières.",
      "Regolato lago per lago – i periodi di protezione vanno per lo più da metà novembre a metà gennaio, spesso con limiti giornalieri di cattura.",
      "Regulated lake by lake – closed seasons usually run from mid-November to mid-January, often with daily catch limits."
    ),
    habitat: l4(
      "Freiwasser der grossen Seen, im Sommer in mittlerer Tiefe.",
      "Pleine eau des grands lacs, à mi-profondeur en été.",
      "Acqua libera dei grandi laghi, a media profondità d'estate.",
      "Open water of the big lakes, at mid depth in summer."
    ),
    method: l4(
      "Hegene mit mehreren kleinen Nymphen, sanft gezupft.",
      "Gambe de perche avec plusieurs petites nymphes, animée doucement.",
      "Bandiera con più ninfe piccole, mossa delicatamente.",
      "A team of several small nymphs, twitched gently."
    ),
  },
  {
    id: "aesche",
    name: l4("Äsche", "Ombre commun", "Temolo", "Grayling"),
    latin: "Thymallus thymallus",
    waters: "fliessend",
    federal: { minLengthCm: 28, closedWeeks: 10, status: "2" },
    guideClosedSeason: { fromMonth: 1, fromDay: 1, toMonth: 5, toDay: 15 },
    cantonHint: l4(
      "Die Äsche ist stark gefährdet: mehrere Kantone schützen sie ganzjährig oder verlangen 32–36 cm.",
      "L'ombre est fortement menacé : plusieurs cantons le protègent toute l'année ou exigent 32–36 cm.",
      "Il temolo è fortemente minacciato: diversi cantoni lo proteggono tutto l'anno o chiedono 32–36 cm.",
      "The grayling is strongly endangered: several cantons protect it all year or require 32–36 cm."
    ),
    habitat: l4(
      "Rasch fliessende, kiesige Flussabschnitte der Äschenregion.",
      "Tronçons de rivière rapides et graveleux de la zone à ombres.",
      "Tratti fluviali veloci e ghiaiosi della zona del temolo.",
      "Fast, gravelly river stretches of the grayling zone."
    ),
    method: l4(
      "Trockenfliege oder Nymphe – sie steht dicht über dem Grund.",
      "Mouche sèche ou nymphe – il se tient juste au-dessus du fond.",
      "Mosca secca o ninfa – sta appena sopra il fondo.",
      "Dry fly or nymph – it holds just above the bottom."
    ),
  },
  {
    id: "hecht",
    name: l4("Hecht", "Brochet", "Luccio", "Pike"),
    latin: "Esox lucius",
    waters: "beide",
    federal: { minLengthCm: null, closedWeeks: null, status: "NG" },
    guideClosedSeason: { fromMonth: 3, fromDay: 1, toMonth: 4, toDay: 30 },
    cantonHint: l4(
      "Rein kantonal: Mindestmasse liegen meist bei 40–50 cm, die Schonzeit im März und April – an einzelnen Seen gibt es gar keine.",
      "Purement cantonal : les tailles minimales sont le plus souvent de 40–50 cm, la protection en mars et avril – sur certains lacs il n'y en a aucune.",
      "Puramente cantonale: le misure minime sono per lo più 40–50 cm, la protezione a marzo e aprile – su alcuni laghi non ce n'è nessuna.",
      "Purely cantonal: minimum sizes are usually 40–50 cm, the closed season in March and April – on some lakes there is none at all."
    ),
    habitat: l4(
      "Krautige Uferzonen, Schilfkanten und Buchten in Seen und ruhigen Flüssen.",
      "Zones de rive herbeuses, bordures de roseaux et baies des lacs et rivières calmes.",
      "Zone rivierasche erbose, bordi di canneto e insenature di laghi e fiumi calmi.",
      "Weedy margins, reed edges and bays in lakes and slow rivers."
    ),
    method: l4(
      "Grosse Gummifische, Blinker oder Köderfisch am Stahlvorfach.",
      "Gros leurres souples, cuillers ondulantes ou poisson-appât sur bas de ligne acier.",
      "Grandi esche siliconiche, ondulanti o pesce esca su terminale d'acciaio.",
      "Big soft baits, spoons or a bait fish on a wire trace."
    ),
  },
  {
    id: "zander",
    name: l4("Zander", "Sandre", "Lucioperca", "Zander"),
    latin: "Sander lucioperca",
    waters: "beide",
    federal: { minLengthCm: null, closedWeeks: null, status: "NG" },
    guideClosedSeason: { fromMonth: 4, fromDay: 1, toMonth: 5, toDay: 31 },
    cantonHint: l4(
      "Rein kantonal: verbreitet 40–50 cm und eine Schonzeit im April und Mai.",
      "Purement cantonal : couramment 40–50 cm et une protection en avril et mai.",
      "Puramente cantonale: di solito 40–50 cm e una protezione ad aprile e maggio.",
      "Purely cantonal: commonly 40–50 cm and a closed season in April and May."
    ),
    habitat: l4(
      "Trübe, tiefere Seen und grosse Flüsse; jagt in der Dämmerung.",
      "Lacs troubles et plus profonds, grands fleuves ; chasse au crépuscule.",
      "Laghi torbidi e più profondi, grandi fiumi; caccia al crepuscolo.",
      "Turbid, deeper lakes and large rivers; hunts at dusk."
    ),
    method: l4(
      "Gummifisch am Jigkopf dicht über Grund, langsam gezupft.",
      "Leurre souple sur tête plombée près du fond, animé lentement.",
      "Esca siliconica su testa piombata vicino al fondo, mossa lentamente.",
      "Soft bait on a jig head close to the bottom, worked slowly."
    ),
  },
  {
    id: "egli",
    name: l4("Egli (Flussbarsch)", "Perche", "Persico reale", "Perch"),
    latin: "Perca fluviatilis",
    waters: "beide",
    federal: { minLengthCm: null, closedWeeks: null, status: "NG" },
    guideClosedSeason: null,
    cantonHint: l4(
      "Meist ohne Schonzeit und ohne Mindestmass, dafür oft mit einer Tagesfanglimite (z. B. 50 Stück).",
      "Le plus souvent sans protection ni taille minimale, mais souvent avec une limite journalière (p. ex. 50 pièces).",
      "Di solito senza protezione né misura minima, ma spesso con un limite giornaliero (p. es. 50 pezzi).",
      "Usually no closed season and no minimum size, but often a daily bag limit (e.g. 50 fish)."
    ),
    habitat: l4(
      "In Schwärmen entlang Hafenmauern, Kanten und Krautfeldern.",
      "En bancs le long des murs de port, des cassures et des herbiers.",
      "In branchi lungo i muri dei porti, i gradini e le praterie d'alghe.",
      "In shoals along harbour walls, drop-offs and weed beds."
    ),
    method: l4(
      "Kleiner Gummifisch, Spinner oder Wurm am leichten Gerät.",
      "Petit leurre souple, cuiller ou ver au matériel léger.",
      "Piccola esca siliconica, cucchiaino o verme con attrezzatura leggera.",
      "Small soft bait, spinner or worm on light tackle."
    ),
  },
  {
    id: "truesche",
    name: l4("Trüsche", "Lotte de rivière", "Bottatrice", "Burbot"),
    latin: "Lota lota",
    waters: "beide",
    federal: { minLengthCm: null, closedWeeks: null, status: "NG" },
    guideClosedSeason: { fromMonth: 12, fromDay: 1, toMonth: 1, toDay: 31 },
    cantonHint: l4(
      "Laicht mitten im Winter; wo eine Schonzeit gilt, liegt sie über den Jahreswechsel. Mindestmasse um 25–30 cm.",
      "Fraie en plein hiver ; là où une protection existe, elle chevauche le Nouvel An. Tailles minimales autour de 25–30 cm.",
      "Frega in pieno inverno; dove esiste una protezione, questa attraversa il capodanno. Misure minime attorno a 25–30 cm.",
      "Spawns in midwinter; where a closed season exists it spans the turn of the year. Minimum sizes around 25–30 cm."
    ),
    habitat: l4(
      "Kühle Seen und Flüsse, nachtaktiv am Grund unter Steinen.",
      "Lacs et rivières frais, active la nuit sur le fond sous les pierres.",
      "Laghi e fiumi freschi, attiva di notte sul fondo sotto le pietre.",
      "Cool lakes and rivers, active at night on the bottom under stones."
    ),
    method: l4(
      "Grundmontage mit Wurm oder Fischfetzen nach Einbruch der Dunkelheit.",
      "Montage de fond avec ver ou lambeau de poisson après la tombée de la nuit.",
      "Montatura di fondo con verme o pezzo di pesce dopo il tramonto.",
      "Bottom rig with worm or fish strip after dark."
    ),
  },
  {
    id: "karpfen",
    name: l4("Karpfen", "Carpe", "Carpa", "Carp"),
    latin: "Cyprinus carpio",
    waters: "stehend",
    federal: { minLengthCm: null, closedWeeks: null, status: "4" },
    guideClosedSeason: { fromMonth: 5, fromDay: 1, toMonth: 6, toDay: 30 },
    cantonHint: l4(
      "Rein kantonal: verbreitet 35 cm Mindestmass und eine Schonzeit während der Laichzeit im Mai und Juni.",
      "Purement cantonal : couramment 35 cm et une protection pendant le frai en mai et juin.",
      "Puramente cantonale: di solito 35 cm e una protezione durante la frega a maggio e giugno.",
      "Purely cantonal: commonly a 35 cm minimum and a closed season during spawning in May and June."
    ),
    habitat: l4(
      "Warme, flache Seen, Weiher und ruhige Flussabschnitte mit weichem Grund.",
      "Lacs chauds et peu profonds, étangs et tronçons calmes à fond meuble.",
      "Laghi caldi e poco profondi, stagni e tratti calmi con fondo morbido.",
      "Warm, shallow lakes, ponds and calm river stretches with soft bottoms."
    ),
    method: l4(
      "Boilie oder Mais am Haaransatz auf Grund, mit Geduld.",
      "Bouillette ou maïs en cheveu sur le fond, avec de la patience.",
      "Boilie o mais sul capello, sul fondo, con pazienza.",
      "Boilie or sweetcorn on a hair rig on the bottom, with patience."
    ),
  },
  {
    id: "schleie",
    name: l4("Schleie", "Tanche", "Tinca", "Tench"),
    latin: "Tinca tinca",
    waters: "stehend",
    federal: { minLengthCm: null, closedWeeks: null, status: "NG" },
    guideClosedSeason: { fromMonth: 5, fromDay: 1, toMonth: 6, toDay: 30 },
    cantonHint: l4(
      "Rein kantonal geregelt, oft 25–30 cm Mindestmass.",
      "Réglé uniquement par les cantons, souvent 25–30 cm.",
      "Regolato solo dai cantoni, spesso 25–30 cm.",
      "Regulated by the cantons only, often a 25–30 cm minimum."
    ),
    habitat: l4(
      "Verkrautete Flachwasserzonen von Weihern und Altarmen.",
      "Zones peu profondes et herbeuses des étangs et bras morts.",
      "Zone poco profonde e ricche di vegetazione di stagni e lanche.",
      "Weedy shallows of ponds and backwaters."
    ),
    method: l4(
      "Feine Posenmontage mit Mais oder Made dicht am Kraut.",
      "Montage flotteur fin avec maïs ou asticot près des herbiers.",
      "Montatura leggera a galleggiante con mais o camola vicino alle alghe.",
      "Fine float rig with sweetcorn or maggot close to the weed."
    ),
  },
  {
    id: "alet",
    name: l4("Alet (Döbel)", "Chevaine", "Cavedano", "Chub"),
    latin: "Squalius cephalus",
    waters: "fliessend",
    federal: { minLengthCm: null, closedWeeks: null, status: "NG" },
    guideClosedSeason: null,
    cantonHint: l4(
      "Meist ohne Schonzeit und ohne Mindestmass – ein guter Fisch fürs Üben und zum Zurücksetzen.",
      "Le plus souvent sans protection ni taille minimale – un bon poisson pour s'exercer et remettre à l'eau.",
      "Di solito senza protezione né misura minima – un buon pesce per esercitarsi e rilasciare.",
      "Usually no closed season and no minimum size – a good fish to practise on and release."
    ),
    habitat: l4(
      "Strömungsberuhigte Stellen hinter Buhnen, unter überhängenden Ästen.",
      "Zones calmes derrière les épis, sous les branches surplombantes.",
      "Zone calme dietro i pennelli, sotto i rami sporgenti.",
      "Slack water behind groynes, under overhanging branches."
    ),
    method: l4(
      "Brotflocke an der Oberfläche oder kleiner Wobbler an der Kante.",
      "Flocon de pain en surface ou petit poisson nageur le long de la bordure.",
      "Fiocco di pane in superficie o piccolo minnow lungo il bordo.",
      "Bread flake on the surface or a small crankbait along the edge."
    ),
  },
  {
    id: "rotauge",
    name: l4("Rotauge (Schwal)", "Gardon", "Triotto", "Roach"),
    latin: "Rutilus rutilus",
    waters: "beide",
    federal: { minLengthCm: null, closedWeeks: null, status: "NG" },
    guideClosedSeason: null,
    cantonHint: l4(
      "Meist frei; wo Köderfische erlaubt sind, gelten dafür eigene kantonale Regeln.",
      "Le plus souvent libre ; là où les poissons-appâts sont autorisés, des règles cantonales propres s'appliquent.",
      "Di solito libero; dove i pesci esca sono ammessi valgono regole cantonali proprie.",
      "Usually unrestricted; where bait fish are allowed, separate cantonal rules apply."
    ),
    habitat: l4(
      "Überall im Flachwasser, oft in grossen Schwärmen.",
      "Partout en eau peu profonde, souvent en grands bancs.",
      "Ovunque in acqua bassa, spesso in grandi branchi.",
      "Everywhere in shallow water, often in large shoals."
    ),
    method: l4(
      "Leichte Posenmontage mit Made, Brot oder Mais.",
      "Montage flotteur léger avec asticot, pain ou maïs.",
      "Montatura leggera a galleggiante con camola, pane o mais.",
      "Light float rig with maggot, bread or sweetcorn."
    ),
  },
  {
    id: "barbe",
    name: l4("Barbe", "Barbeau", "Barbo", "Barbel"),
    latin: "Barbus barbus",
    waters: "fliessend",
    federal: { minLengthCm: null, closedWeeks: null, status: "4" },
    guideClosedSeason: { fromMonth: 5, fromDay: 1, toMonth: 6, toDay: 30 },
    cantonHint: l4(
      "Potenziell gefährdet – mehrere Kantone verlangen 30–40 cm oder schonen sie zur Laichzeit.",
      "Potentiellement menacé – plusieurs cantons exigent 30–40 cm ou le protègent pendant le frai.",
      "Potenzialmente minacciato – diversi cantoni chiedono 30–40 cm o lo proteggono durante la frega.",
      "Potentially endangered – several cantons require 30–40 cm or protect it while spawning."
    ),
    habitat: l4(
      "Kiesige, gut durchströmte Flussabschnitte der Barbenregion.",
      "Tronçons de rivière graveleux et bien courants de la zone à barbeaux.",
      "Tratti fluviali ghiaiosi e ben correnti della zona del barbo.",
      "Gravelly, well-flowing river stretches of the barbel zone."
    ),
    method: l4(
      "Grundmontage mit Käse, Mais oder Wurm in der Rinne.",
      "Montage de fond avec fromage, maïs ou ver dans la veine d'eau.",
      "Montatura di fondo con formaggio, mais o verme nella corrente.",
      "Bottom rig with cheese, sweetcorn or worm in the channel."
    ),
  },
  {
    id: "wels",
    name: l4("Wels", "Silure", "Siluro", "Wels catfish"),
    latin: "Silurus glanis",
    waters: "beide",
    federal: { minLengthCm: null, closedWeeks: null, status: "NG" },
    guideClosedSeason: { fromMonth: 5, fromDay: 1, toMonth: 6, toDay: 30 },
    cantonHint: l4(
      "Rein kantonal; in einigen Gewässern ist der Wels unerwünscht und darf ohne Mass entnommen werden.",
      "Purement cantonal ; dans certaines eaux le silure est indésirable et peut être prélevé sans taille minimale.",
      "Puramente cantonale; in alcune acque il siluro è indesiderato e può essere prelevato senza misura minima.",
      "Purely cantonal; in some waters the catfish is unwanted and may be taken without a size limit."
    ),
    habitat: l4(
      "Tiefe Löcher und Totholz in grossen Flüssen und Seen.",
      "Fosses profondes et bois mort dans les grands fleuves et lacs.",
      "Buche profonde e legname sommerso in grandi fiumi e laghi.",
      "Deep holes and sunken wood in large rivers and lakes."
    ),
    method: l4(
      "Grosser Köderfisch oder Tauwurmbündel am Grund, nachts.",
      "Gros poisson-appât ou bouquet de vers de terre sur le fond, de nuit.",
      "Grande pesce esca o mazzetto di lombrichi sul fondo, di notte.",
      "Large bait fish or a bunch of lobworms on the bottom, at night."
    ),
  },
  {
    id: "alborella",
    name: l4("Alborella", "Ablette du Tessin", "Alborella", "Alborella bleak"),
    latin: "Alburnus arborella",
    waters: "beide",
    federal: { minLengthCm: null, closedWeeks: 4, status: "1" },
    guideClosedSeason: { fromMonth: 5, fromDay: 1, toMonth: 6, toDay: 30 },
    cantonHint: l4(
      "Nur im Tessin und vom Aussterben bedroht – im Zweifel zurücksetzen und die kantonalen Vorgaben genau lesen.",
      "Uniquement au Tessin et en danger d'extinction – dans le doute, remettre à l'eau et lire attentivement les règles cantonales.",
      "Solo in Ticino e in pericolo d'estinzione – nel dubbio rilascia e leggi con attenzione le regole cantonali.",
      "Only in Ticino and critically endangered – when in doubt release it and read the cantonal rules carefully."
    ),
    habitat: l4(
      "Ufernahe Schwärme in den Südtessiner Seen.",
      "Bancs proches des rives dans les lacs du Sud du Tessin.",
      "Branchi vicino a riva nei laghi del Sud del Ticino.",
      "Shoals near the shore in the lakes of southern Ticino."
    ),
    method: l4(
      "Feinste Posenmontage – wird vor allem als Beifang gefangen.",
      "Montage flotteur très fin – surtout pris comme prise accessoire.",
      "Montatura a galleggiante finissima – si prende soprattutto come cattura accessoria.",
      "Very fine float rig – mostly caught incidentally."
    ),
  },
  {
    id: "aal",
    name: l4("Aal", "Anguille", "Anguilla", "Eel"),
    latin: "Anguilla anguilla",
    waters: "beide",
    federal: {
      minLengthCm: null,
      closedWeeks: null,
      status: "1",
      banned: true,
      note: l4(
        "Vom Aussterben bedroht (Anhang 1 VBGF, Status 1). Nach Art. 2a Abs. 1 VBGF darf der Aal nicht gefangen werden, solange keine Schonzeit und kein Fangmindestmass für ihn gelten.",
        "En danger d'extinction (annexe 1 OLFP, statut 1). Selon l'art. 2a al. 1 OLFP, l'anguille ne doit pas être capturée tant qu'aucune période de protection ni taille minimale ne lui est applicable.",
        "In pericolo d'estinzione (allegato 1 OLFP, stato 1). Secondo l'art. 2a cpv. 1 OLFP l'anguilla non può essere catturata finché non valgono per essa un periodo di protezione o una misura minima.",
        "Critically endangered (VBGF annex 1, status 1). Under art. 2a para. 1 VBGF the eel must not be caught as long as no closed season and no minimum size apply to it."
      ),
    },
    guideClosedSeason: null,
    cantonHint: l4(
      "Sofort schonend zurücksetzen. Einzelne Kantone kennen Ausnahmen – ohne ausdrückliche Erlaubnis gilt das Fangverbot.",
      "Remettre à l'eau immédiatement avec ménagement. Certains cantons prévoient des exceptions – sans autorisation expresse, l'interdiction s'applique.",
      "Rilascia subito con delicatezza. Alcuni cantoni prevedono eccezioni – senza autorizzazione esplicita vale il divieto.",
      "Release it gently at once. A few cantons have exceptions – without explicit permission the ban applies."
    ),
    habitat: l4(
      "Nachtaktiv am Grund von Flüssen und Seen, versteckt unter Steinen.",
      "Actif la nuit sur le fond des rivières et des lacs, caché sous les pierres.",
      "Attiva di notte sul fondo di fiumi e laghi, nascosta sotto le pietre.",
      "Active at night on the bottom of rivers and lakes, hidden under stones."
    ),
    method: l4(
      "Nicht gezielt befischen – als Beifang vorsichtig abhaken und zurücksetzen.",
      "Ne pas cibler – en prise accessoire, décrocher avec soin et relâcher.",
      "Non pescare mirato – come cattura accessoria slama con cura e rilascia.",
      "Do not target – if caught incidentally, unhook carefully and release."
    ),
  },
  {
    id: "nase",
    name: l4("Nase", "Nase", "Naso", "Common nase"),
    latin: "Chondrostoma nasus",
    waters: "fliessend",
    federal: {
      minLengthCm: null,
      closedWeeks: null,
      status: "1",
      banned: true,
      note: l4(
        "Vom Aussterben bedroht (Anhang 1 VBGF, Status 1) – Fangverbot nach Art. 2a Abs. 1 VBGF.",
        "En danger d'extinction (annexe 1 OLFP, statut 1) – interdiction de capture selon l'art. 2a al. 1 OLFP.",
        "In pericolo d'estinzione (allegato 1 OLFP, stato 1) – divieto di cattura secondo l'art. 2a cpv. 1 OLFP.",
        "Critically endangered (VBGF annex 1, status 1) – catch ban under art. 2a para. 1 VBGF."
      ),
    },
    guideClosedSeason: null,
    cantonHint: l4(
      "Beifang schonend im Wasser lösen. Laichzüge im Frühling nicht stören.",
      "Décrocher les prises accessoires dans l'eau. Ne pas déranger les montaisons de frai au printemps.",
      "Slama le catture accessorie in acqua. Non disturbare le risalite di frega in primavera.",
      "Unhook incidental catches in the water. Do not disturb the spring spawning runs."
    ),
    habitat: l4(
      "Kiesige, rasch fliessende Flüsse; weidet Algen von Steinen ab.",
      "Rivières rapides à fond de gravier ; broute les algues sur les pierres.",
      "Fiumi veloci con fondo ghiaioso; bruca le alghe dalle pietre.",
      "Fast, gravelly rivers; grazes algae off stones."
    ),
    method: l4(
      "Nicht gezielt befischen.",
      "Ne pas cibler.",
      "Non pescare mirato.",
      "Do not target."
    ),
  },
  {
    id: "lachs",
    name: l4("Lachs", "Saumon", "Salmone", "Atlantic salmon"),
    latin: "Salmo salar",
    waters: "fliessend",
    federal: {
      minLengthCm: null,
      closedWeeks: null,
      status: "0",
      banned: true,
      reportRequired: true,
      note: l4(
        "Im Rhein-Einzugsgebiet ausgestorben (Anhang 1 VBGF, Status 0) – Fangverbot nach Art. 2a Abs. 1. Zurückversetzte oder beim Angeln festgestellte Lachse sind der kantonalen Fischereifachstelle unverzüglich zu melden (Art. 2a Abs. 2).",
        "Éteint dans le bassin du Rhin (annexe 1 OLFP, statut 0) – interdiction de capture selon l'art. 2a al. 1. Les saumons remis à l'eau ou observés à la pêche doivent être annoncés sans délai au service cantonal de la pêche (art. 2a al. 2).",
        "Estinto nel bacino del Reno (allegato 1 OLFP, stato 0) – divieto di cattura secondo l'art. 2a cpv. 1. I salmoni rilasciati o osservati durante la pesca vanno annunciati senza indugio al servizio cantonale della pesca (art. 2a cpv. 2).",
        "Extinct in the Rhine catchment (VBGF annex 1, status 0) – catch ban under art. 2a para. 1. Salmon released or observed while angling must be reported to the cantonal fisheries office without delay (art. 2a para. 2)."
      ),
    },
    guideClosedSeason: null,
    cantonHint: l4(
      "Wiederansiedlung läuft – jede Beobachtung ist für die Fachstelle wertvoll.",
      "La réintroduction est en cours – chaque observation est précieuse pour le service spécialisé.",
      "Il ripopolamento è in corso – ogni osservazione è preziosa per il servizio specializzato.",
      "Reintroduction is under way – every observation is valuable to the specialist office."
    ),
    habitat: l4(
      "Hochrhein und seine Zuflüsse; steigt zum Laichen flussaufwärts.",
      "Haut-Rhin et ses affluents ; remonte le fleuve pour frayer.",
      "Alto Reno e i suoi affluenti; risale il fiume per la frega.",
      "High Rhine and its tributaries; runs upstream to spawn."
    ),
    method: l4(
      "Nicht gezielt befischen – im Wasser lösen und sofort melden.",
      "Ne pas cibler – décrocher dans l'eau et annoncer immédiatement.",
      "Non pescare mirato – slama in acqua e annuncia subito.",
      "Do not target – unhook in the water and report immediately."
    ),
  },
];

/** Art zu einer Id (undefined = freier Eintrag ohne Arten-Bezug). */
export function findFishSpecies(id: string | null | undefined) {
  if (!id) return undefined;
  return FISH_SPECIES.find(species => species.id === id);
}

/** Tag/Monat als vergleichbare Zahl (MMDD) – nur für Fensterprüfungen. */
function dayKey(month: number, day: number): number {
  return month * 100 + day;
}

/**
 * Liegt der Tag im Fenster (inklusive beider Grenzen)?
 * Wechsel über den Jahresanfang wird unterstützt: `fromMonth > toMonth`
 * bedeutet «über den Jahreswechsel hinweg» (z. B. 1.12.–31.1.).
 */
export function inDayWindow(
  window: DayWindow | null | undefined,
  date: Date
): boolean {
  if (!window) return false;
  const key = dayKey(date.getMonth() + 1, date.getDate());
  const from = dayKey(window.fromMonth, window.fromDay);
  const to = dayKey(window.toMonth, window.toDay);
  if (from <= to) return key >= from && key <= to;
  return key >= from || key <= to;
}

/** Fällt der Fang in die Richtwert-Schonzeit der Art? */
export function inGuideClosedSeason(species: FishSpecies, date: Date): boolean {
  return inDayWindow(species.guideClosedSeason, date);
}

/** Ein Hinweis beim Erfassen eines Fangs – der Text kommt aus dem Wörterbuch. */
export type CatchHintCode =
  /** Fangverbot des Bundes (VBGF Art. 2a Abs. 1). */
  | "ban"
  /** Meldepflicht an die kantonale Fischereifachstelle (Art. 2a Abs. 2). */
  | "report"
  /** Der Fangtag liegt in der Richtwert-Schonzeit. */
  | "closedSeason"
  /** Die Länge liegt unter dem bundesrechtlichen Fangmindestmass. */
  | "underMinLength"
  /** Die Länge liegt knapp über dem Bundesmass – Kantone verlangen oft mehr. */
  | "nearMinLength"
  /** Immer: der Kanton kann strenger sein. */
  | "cantonal";

export type CatchHintLevel = "danger" | "warning" | "info";

export interface CatchHint {
  code: CatchHintCode;
  level: CatchHintLevel;
  /** Bundesmass in cm – nur bei `underMinLength`/`nearMinLength` gesetzt. */
  minLengthCm?: number;
}

export interface CatchCheckInput {
  /** Länge in cm; null/undefined = nicht gemessen, dann kein Mass-Hinweis. */
  lengthCm?: number | null;
  /** Fangdatum. */
  date: Date;
}

/**
 * Spanne über dem Bundesmass, in der zusätzlich gewarnt wird, weil Kantone
 * das Mass fast immer erhöhen (in cm).
 */
export const NEAR_MIN_LENGTH_MARGIN_CM = 6;

/**
 * Prüft einen Fang gegen die bundesrechtlichen Mindestvorgaben und die
 * Richtwert-Schonzeit. Reihenfolge: Fangverbot, Meldepflicht, Schonzeit,
 * Mindestmass, kantonaler Vorbehalt (immer als letzter Hinweis).
 */
export function checkCatch(
  species: FishSpecies | undefined,
  input: CatchCheckInput
): CatchHint[] {
  if (!species) return [];
  const hints: CatchHint[] = [];
  if (species.federal.banned) hints.push({ code: "ban", level: "danger" });
  if (species.federal.reportRequired) {
    hints.push({ code: "report", level: "warning" });
  }
  if (inGuideClosedSeason(species, input.date)) {
    hints.push({ code: "closedSeason", level: "warning" });
  }
  const min = species.federal.minLengthCm;
  const length = input.lengthCm;
  if (min !== null && typeof length === "number" && Number.isFinite(length)) {
    if (length < min) {
      hints.push({ code: "underMinLength", level: "danger", minLengthCm: min });
    } else if (length < min + NEAR_MIN_LENGTH_MARGIN_CM) {
      hints.push({ code: "nearMinLength", level: "warning", minLengthCm: min });
    }
  }
  hints.push({ code: "cantonal", level: "info" });
  return hints;
}

/** Ein erfasster Fang, so weit die Auswertung ihn braucht. */
export interface CatchRecord {
  /** Id einer Art aus FISH_SPECIES; null = freier Eintrag. */
  speciesId: string | null;
  /** Angezeigter Arten-Name (bei freien Einträgen der Freitext). */
  speciesName: string;
  lengthCm: number | null;
  weightKg: number | null;
  water: string;
  /** Fangdatum als ISO-String (YYYY-MM-DD). */
  caughtAt: string;
  released: boolean;
}

export interface SpeciesRecord {
  /** Gruppen-Schlüssel: Arten-Id oder – bei freien Einträgen – der Name. */
  key: string;
  speciesId: string | null;
  name: string;
  count: number;
  /** Grösster Fang dieser Art (nur Einträge mit Länge). */
  bestLengthCm: number | null;
  /** Schwerster Fang dieser Art (nur Einträge mit Gewicht). */
  bestWeightKg: number | null;
  /** Datum des grössten Fangs (ISO) – null, wenn nie eine Länge erfasst wurde. */
  bestOn: string | null;
}

export interface YearCount {
  year: number;
  count: number;
  released: number;
}

export interface CatchStats {
  total: number;
  released: number;
  kept: number;
  /** Rekorde je Art, absteigend nach Länge (Arten ohne Länge zuletzt). */
  records: SpeciesRecord[];
  /** Fänge pro Jahr, neuestes Jahr zuerst. */
  years: YearCount[];
  /** Alle vorkommenden Gewässer, alphabetisch. */
  waters: string[];
}

/** Jahreszahl aus einem ISO-Datum; NaN bei Unsinn. */
function isoYear(iso: string): number {
  return Number(iso.slice(0, 4));
}

/**
 * Statistik über alle Fänge: Rekorde je Art, Fänge pro Jahr, Gewässerliste.
 * Freie Einträge ohne Arten-Id werden über ihren Namen gruppiert, damit
 * «Egli» aus dem Freitext nicht als Dutzend Einzelarten erscheint.
 */
export function catchStats(catches: CatchRecord[]): CatchStats {
  const bySpecies: Record<string, SpeciesRecord> = {};
  const byYear: Record<number, YearCount> = {};
  const waters: string[] = [];
  let released = 0;

  catches.forEach(entry => {
    const key = entry.speciesId ?? `frei:${entry.speciesName.toLowerCase()}`;
    const slot = bySpecies[key] ?? {
      key,
      speciesId: entry.speciesId,
      name: entry.speciesName,
      count: 0,
      bestLengthCm: null,
      bestWeightKg: null,
      bestOn: null,
    };
    slot.count += 1;
    if (
      typeof entry.lengthCm === "number" &&
      Number.isFinite(entry.lengthCm) &&
      (slot.bestLengthCm === null || entry.lengthCm > slot.bestLengthCm)
    ) {
      slot.bestLengthCm = entry.lengthCm;
      slot.bestOn = entry.caughtAt;
    }
    if (
      typeof entry.weightKg === "number" &&
      Number.isFinite(entry.weightKg) &&
      (slot.bestWeightKg === null || entry.weightKg > slot.bestWeightKg)
    ) {
      slot.bestWeightKg = entry.weightKg;
    }
    bySpecies[key] = slot;

    const year = isoYear(entry.caughtAt);
    if (Number.isFinite(year)) {
      const yearSlot = byYear[year] ?? { year, count: 0, released: 0 };
      yearSlot.count += 1;
      if (entry.released) yearSlot.released += 1;
      byYear[year] = yearSlot;
    }

    const water = entry.water.trim();
    if (water && !waters.includes(water)) waters.push(water);
    if (entry.released) released += 1;
  });

  const records = Object.keys(bySpecies)
    .map(key => bySpecies[key])
    .sort((a, b) => {
      const aLength = a.bestLengthCm ?? -1;
      const bLength = b.bestLengthCm ?? -1;
      if (aLength !== bLength) return bLength - aLength;
      if (a.count !== b.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });

  const years = Object.keys(byYear)
    .map(key => byYear[Number(key)])
    .sort((a, b) => b.year - a.year);

  return {
    total: catches.length,
    released,
    kept: catches.length - released,
    records,
    years,
    waters: waters.sort((a, b) => a.localeCompare(b)),
  };
}

/** Filter für die Übersicht: Art und Gewässer, je "alle" als Leerwert. */
export interface CatchFilter {
  /** Arten-Schlüssel wie in `SpeciesRecord.key`; null = alle Arten. */
  speciesKey?: string | null;
  /** Gewässername (exakt, ohne Gross-/Kleinschreibung); null = alle. */
  water?: string | null;
}

/** Fänge nach Art und Gewässer filtern – leere Filter lassen alles durch. */
export function filterCatches<T extends CatchRecord>(
  catches: T[],
  filter: CatchFilter
): T[] {
  const water = filter.water?.trim().toLowerCase() || null;
  return catches.filter(entry => {
    if (filter.speciesKey) {
      const key = entry.speciesId ?? `frei:${entry.speciesName.toLowerCase()}`;
      if (key !== filter.speciesKey) return false;
    }
    if (water && entry.water.trim().toLowerCase() !== water) return false;
    return true;
  });
}
