/**
 * Reise-Bingo (#240): der Motiv-Pool für die Autofahrt.
 *
 * Alles hier muss vom Rücksitz aus durch die Scheibe zu entdecken sein –
 * keine Aufgaben, keine Fragen, nur Dinge, die unterwegs vorbeikommen.
 * Bewusst gemischt aus «kommt fast sicher» (Tunnel, Lastwagen) und
 * «da braucht es Glück» (Gleitschirm, Regenbogen), damit eine Karte weder
 * in fünf Minuten voll ist noch die ganze Fahrt lang leer bleibt.
 *
 * Die Mischung und die Bingo-Prüfung liegen in shared/travelBingo.ts –
 * hier stehen nur die Motive. Jedes Motiv trägt ein Emoji als sprachfreies
 * Bild (die Kleinen erkennen die Karte daran, bevor sie lesen können) und
 * einen Text in allen vier Sprachen.
 */
import { l4, type L4 } from "@shared/i18n";

export interface BingoMotif {
  /** Stabile Id – landet über den Seed indirekt in localStorage. */
  id: string;
  /** Sprachfreies Bild fürs Feld. */
  emoji: string;
  /** Was es zu entdecken gibt. */
  label: L4;
}

export const bingoMotifs: BingoMotif[] = [
  {
    id: "gelbes-auto",
    emoji: "🚗",
    label: l4("Gelbes Auto", "Voiture jaune", "Auto gialla", "Yellow car"),
  },
  {
    id: "lastwagen",
    emoji: "🚚",
    label: l4("Lastwagen", "Camion", "Camion", "Lorry"),
  },
  {
    id: "wohnwagen",
    emoji: "🚐",
    label: l4(
      "Wohnwagen oder Wohnmobil",
      "Caravane ou camping-car",
      "Roulotte o camper",
      "Caravan or motorhome"
    ),
  },
  {
    id: "postauto",
    emoji: "🚌",
    label: l4(
      "Gelbes Postauto",
      "Car postal jaune",
      "Autopostale giallo",
      "Yellow postbus"
    ),
  },
  {
    id: "feuerwehrauto",
    emoji: "🚒",
    label: l4(
      "Feuerwehrauto",
      "Camion de pompiers",
      "Camion dei pompieri",
      "Fire engine"
    ),
  },
  {
    id: "polizeiauto",
    emoji: "🚓",
    label: l4(
      "Polizeiauto",
      "Voiture de police",
      "Auto della polizia",
      "Police car"
    ),
  },
  {
    id: "roter-traktor",
    emoji: "🚜",
    label: l4(
      "Roter Traktor",
      "Tracteur rouge",
      "Trattore rosso",
      "Red tractor"
    ),
  },
  {
    id: "motorrad",
    emoji: "🏍️",
    label: l4("Motorrad", "Moto", "Moto", "Motorbike"),
  },
  {
    id: "velofahrerin",
    emoji: "🚴",
    label: l4("Velofahrerin", "Cycliste", "Ciclista", "Cyclist"),
  },
  {
    id: "zug",
    emoji: "🚆",
    label: l4("Zug", "Train", "Treno", "Train"),
  },
  {
    id: "flugzeug",
    emoji: "✈️",
    label: l4(
      "Flugzeug am Himmel",
      "Avion dans le ciel",
      "Aereo nel cielo",
      "Aeroplane in the sky"
    ),
  },
  {
    id: "boot",
    emoji: "⛵",
    label: l4(
      "Boot auf dem Wasser",
      "Bateau sur l'eau",
      "Barca sull'acqua",
      "Boat on the water"
    ),
  },
  {
    id: "gleitschirm",
    emoji: "🪂",
    label: l4("Gleitschirm", "Parapente", "Parapendio", "Paraglider"),
  },
  {
    id: "seilbahn",
    emoji: "🚡",
    label: l4(
      "Seilbahn oder Gondel",
      "Téléphérique ou télécabine",
      "Funivia o cabinovia",
      "Cable car or gondola"
    ),
  },
  {
    id: "tunnel",
    emoji: "🕳️",
    label: l4("Tunnel", "Tunnel", "Galleria", "Tunnel"),
  },
  {
    id: "bruecke",
    emoji: "🌉",
    label: l4("Brücke", "Pont", "Ponte", "Bridge"),
  },
  {
    id: "baustelle",
    emoji: "🚧",
    label: l4("Baustelle", "Chantier", "Cantiere", "Roadworks"),
  },
  {
    id: "baukran",
    emoji: "🏗️",
    label: l4("Baukran", "Grue de chantier", "Gru da cantiere", "Crane"),
  },
  {
    id: "ampel",
    emoji: "🚦",
    label: l4("Ampel", "Feu de circulation", "Semaforo", "Traffic light"),
  },
  {
    id: "kreisel",
    emoji: "🔄",
    label: l4("Kreisel", "Giratoire", "Rotonda", "Roundabout"),
  },
  {
    id: "tankstelle",
    emoji: "⛽",
    label: l4(
      "Tankstelle",
      "Station-service",
      "Distributore di benzina",
      "Petrol station"
    ),
  },
  {
    id: "wanderwegweiser",
    emoji: "➡️",
    label: l4(
      "Gelber Wanderwegweiser",
      "Panneau jaune de randonnée",
      "Cartello giallo dei sentieri",
      "Yellow hiking signpost"
    ),
  },
  {
    id: "campingschild",
    emoji: "⛺",
    label: l4(
      "Campingplatz-Schild",
      "Panneau de camping",
      "Cartello di campeggio",
      "Campsite sign"
    ),
  },
  {
    id: "rastplatz",
    emoji: "🧺",
    label: l4(
      "Rastplatz mit Picknicktisch",
      "Aire avec table de pique-nique",
      "Area di sosta con tavolo da picnic",
      "Rest area with a picnic table"
    ),
  },
  {
    id: "kirchturm",
    emoji: "⛪",
    label: l4("Kirchturm", "Clocher", "Campanile", "Church tower"),
  },
  {
    id: "burg",
    emoji: "🏰",
    label: l4(
      "Burg oder Schloss",
      "Château fort ou château",
      "Castello o rocca",
      "Castle"
    ),
  },
  {
    id: "bauernhof",
    emoji: "🏡",
    label: l4("Bauernhof", "Ferme", "Fattoria", "Farm"),
  },
  {
    id: "rotes-ziegeldach",
    emoji: "🏘️",
    label: l4(
      "Rotes Ziegeldach",
      "Toit de tuiles rouges",
      "Tetto di tegole rosse",
      "Red tiled roof"
    ),
  },
  {
    id: "solaranlage",
    emoji: "🔆",
    label: l4(
      "Solaranlage auf einem Dach",
      "Panneaux solaires sur un toit",
      "Pannelli solari su un tetto",
      "Solar panels on a roof"
    ),
  },
  {
    id: "windrad",
    emoji: "💨",
    label: l4("Windrad", "Éolienne", "Pala eolica", "Wind turbine"),
  },
  {
    id: "strommast",
    emoji: "⚡",
    label: l4("Strommast", "Pylône électrique", "Traliccio", "Pylon"),
  },
  {
    id: "dorfbrunnen",
    emoji: "⛲",
    label: l4(
      "Dorfbrunnen",
      "Fontaine de village",
      "Fontana del paese",
      "Village fountain"
    ),
  },
  {
    id: "kuhherde",
    emoji: "🐄",
    label: l4(
      "Kuhherde",
      "Troupeau de vaches",
      "Mandria di mucche",
      "Herd of cows"
    ),
  },
  {
    id: "schafe",
    emoji: "🐑",
    label: l4(
      "Schafe auf der Weide",
      "Moutons au pré",
      "Pecore al pascolo",
      "Sheep in a field"
    ),
  },
  {
    id: "pferd",
    emoji: "🐴",
    label: l4("Pferd", "Cheval", "Cavallo", "Horse"),
  },
  {
    id: "huehner",
    emoji: "🐓",
    label: l4("Hühner", "Poules", "Galline", "Chickens"),
  },
  {
    id: "ziege",
    emoji: "🐐",
    label: l4("Ziege", "Chèvre", "Capra", "Goat"),
  },
  {
    id: "reh",
    emoji: "🦌",
    label: l4("Reh", "Chevreuil", "Capriolo", "Roe deer"),
  },
  {
    id: "greifvogel",
    emoji: "🦅",
    label: l4(
      "Greifvogel, der in der Luft kreist",
      "Rapace qui plane dans le ciel",
      "Rapace che volteggia in cielo",
      "Bird of prey circling in the sky"
    ),
  },
  {
    id: "vogelschwarm",
    emoji: "🐦",
    label: l4(
      "Vogelschwarm auf einem Draht",
      "Volée d'oiseaux sur un fil",
      "Stormo di uccelli su un filo",
      "Flock of birds on a wire"
    ),
  },
  {
    id: "katze",
    emoji: "🐈",
    label: l4("Katze", "Chat", "Gatto", "Cat"),
  },
  {
    id: "hund-im-auto",
    emoji: "🐕",
    label: l4(
      "Hund in einem anderen Auto",
      "Chien dans une autre voiture",
      "Cane in un'altra auto",
      "Dog in another car"
    ),
  },
  {
    id: "see",
    emoji: "🏞️",
    label: l4("See", "Lac", "Lago", "Lake"),
  },
  {
    id: "fluss",
    emoji: "🌊",
    label: l4("Fluss", "Rivière", "Fiume", "River"),
  },
  {
    id: "wasserfall",
    emoji: "💦",
    label: l4("Wasserfall", "Cascade", "Cascata", "Waterfall"),
  },
  {
    id: "berggipfel",
    emoji: "🏔️",
    label: l4(
      "Schneebedeckter Berggipfel",
      "Sommet enneigé",
      "Cima innevata",
      "Snow-capped peak"
    ),
  },
  {
    id: "tannenwald",
    emoji: "🌲",
    label: l4("Tannenwald", "Forêt de sapins", "Bosco di abeti", "Fir forest"),
  },
  {
    id: "sonnenblumenfeld",
    emoji: "🌻",
    label: l4(
      "Sonnenblumenfeld",
      "Champ de tournesols",
      "Campo di girasoli",
      "Field of sunflowers"
    ),
  },
  {
    id: "heuballen",
    emoji: "🌾",
    label: l4(
      "Heuballen auf dem Feld",
      "Balles de foin dans un champ",
      "Balle di fieno in un campo",
      "Hay bales in a field"
    ),
  },
  {
    id: "rebberg",
    emoji: "🍇",
    label: l4("Rebberg", "Vignoble", "Vigneto", "Vineyard"),
  },
  {
    id: "regenbogen",
    emoji: "🌈",
    label: l4("Regenbogen", "Arc-en-ciel", "Arcobaleno", "Rainbow"),
  },
  {
    id: "tierwolke",
    emoji: "🌥️",
    label: l4(
      "Wolke, die wie ein Tier aussieht",
      "Nuage qui ressemble à un animal",
      "Nuvola che sembra un animale",
      "Cloud shaped like an animal"
    ),
  },
];

/** Nur die Ids – so kommt der Pool in die Misch-Funktion. */
export const bingoMotifIds: string[] = bingoMotifs.map(motif => motif.id);

/** Motiv zu einer Id (undefined, falls ein alter Seed etwas Unbekanntes zieht). */
export function bingoMotifById(id: string): BingoMotif | undefined {
  return bingoMotifs.find(motif => motif.id === id);
}
