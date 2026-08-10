/**
 * Szenario-basierte Packlisten-Vorlagen.
 * Wird von Client (Anzeige) und Server (Listen-Erstellung) verwendet.
 * Alle sichtbaren Texte sind vollständig übersetzt (L4); beim Schreiben in
 * die Datenbank wird mit `pick()` die aktuelle Sprache gewählt – gespeicherte
 * Listen bleiben bewusst einsprachig.
 */
import { l4, type L4 } from "./i18n";

export interface PackTemplateItem {
  name: L4;
  category: L4;
  quantity?: number;
}

export interface PackScenario {
  id: string;
  label: L4;
  description: L4;
  icon: string;
  items: PackTemplateItem[];
}

/** Wiederverwendete Kategorie-Namen der Vorlagen. */
const cat = {
  schlafen: l4("Schlafen", "Sommeil", "Dormire", "Sleeping"),
  lichtEnergie: l4(
    "Licht & Energie",
    "Lumière & énergie",
    "Luce & energia",
    "Light & power"
  ),
  kueche: l4("Küche", "Cuisine", "Cucina", "Kitchen"),
  werkzeug: l4("Werkzeug", "Outils", "Attrezzi", "Tools"),
  sicherheit: l4("Sicherheit", "Sécurité", "Sicurezza", "Safety"),
  hygiene: l4("Hygiene", "Hygiène", "Igiene", "Hygiene"),
  kleidung: l4("Kleidung", "Vêtements", "Abbigliamento", "Clothing"),
  sonstiges: l4("Sonstiges", "Divers", "Varie", "Miscellaneous"),
  orientierung: l4("Orientierung", "Orientation", "Orientamento", "Navigation"),
  kinder: l4("Kinder", "Enfants", "Bambini", "Kids"),
  komfort: l4("Komfort", "Confort", "Comfort", "Comfort"),
  gepaeck: l4("Gepäck", "Bagages", "Bagagli", "Luggage"),
  kinderSicherheit: l4(
    "Kinder-Sicherheit",
    "Sécurité des enfants",
    "Sicurezza bambini",
    "Child safety"
  ),
  kinderApotheke: l4(
    "Kinder-Apotheke",
    "Pharmacie des enfants",
    "Farmacia dei bambini",
    "Children's medicine kit"
  ),
  dokumente: l4("Dokumente", "Documents", "Documenti", "Documents"),
};

/** Kategorien auch für andere Module (z. B. Wetter-Packvorschläge) nutzbar. */
export const packCategories = cat;

const topfPfanne = l4(
  "Topf & Pfanne",
  "Casserole & poêle",
  "Pentola e padella",
  "Pot & pan"
);

const basisAusruestung: PackTemplateItem[] = [
  {
    name: l4(
      "Zelt inkl. Heringe & Leinen",
      "Tente avec sardines & haubans",
      "Tenda con picchetti e tiranti",
      "Tent incl. pegs & guy lines"
    ),
    category: cat.schlafen,
  },
  {
    name: l4("Schlafsack", "Sac de couchage", "Sacco a pelo", "Sleeping bag"),
    category: cat.schlafen,
  },
  {
    name: l4(
      "Isomatte",
      "Matelas isolant",
      "Materassino isolante",
      "Sleeping mat"
    ),
    category: cat.schlafen,
  },
  {
    name: l4(
      "Stirnlampe + Ersatzbatterien",
      "Lampe frontale + piles de rechange",
      "Lampada frontale + batterie di ricambio",
      "Head torch + spare batteries"
    ),
    category: cat.lichtEnergie,
  },
  {
    name: l4("Powerbank", "Powerbank", "Powerbank", "Power bank"),
    category: cat.lichtEnergie,
  },
  {
    name: l4(
      "Gaskocher + Kartusche",
      "Réchaud à gaz + cartouche",
      "Fornello a gas + cartuccia",
      "Gas stove + cartridge"
    ),
    category: cat.kueche,
  },
  { name: topfPfanne, category: cat.kueche },
  {
    name: l4(
      "Geschirr & Besteck",
      "Vaisselle & couverts",
      "Stoviglie e posate",
      "Crockery & cutlery"
    ),
    category: cat.kueche,
  },
  {
    name: l4(
      "Taschenmesser",
      "Couteau de poche",
      "Coltellino tascabile",
      "Pocket knife"
    ),
    category: cat.werkzeug,
  },
  {
    name: l4(
      "Reparatur-Set (Tape, Nähzeug, Kabelbinder)",
      "Kit de réparation (ruban adhésif, couture, serre-câbles)",
      "Kit riparazione (nastro, kit cucito, fascette)",
      "Repair kit (tape, sewing kit, cable ties)"
    ),
    category: cat.werkzeug,
  },
  {
    name: l4(
      "Erste-Hilfe-Set",
      "Kit de premiers secours",
      "Kit di primo soccorso",
      "First aid kit"
    ),
    category: cat.sicherheit,
  },
  {
    name: l4(
      "Sonnencrème & Sonnenhut",
      "Crème solaire & chapeau de soleil",
      "Crema solare e cappello da sole",
      "Sun cream & sun hat"
    ),
    category: cat.hygiene,
  },
  {
    name: l4(
      "Zeckenzange",
      "Pince à tiques",
      "Pinzetta per zecche",
      "Tick tweezers"
    ),
    category: cat.sicherheit,
  },
  {
    name: l4(
      "Regenjacke",
      "Veste de pluie",
      "Giacca antipioggia",
      "Rain jacket"
    ),
    category: cat.kleidung,
  },
  {
    name: l4(
      "Warme Schicht (Fleece/Daune)",
      "Couche chaude (polaire/duvet)",
      "Strato caldo (pile/piumino)",
      "Warm layer (fleece/down)"
    ),
    category: cat.kleidung,
  },
  {
    name: l4(
      "Wanderschuhe",
      "Chaussures de randonnée",
      "Scarponi da trekking",
      "Hiking boots"
    ),
    category: cat.kleidung,
  },
  {
    name: l4("Trinkflaschen", "Gourdes", "Borracce", "Water bottles"),
    category: cat.kueche,
  },
  {
    name: l4(
      "Abfallsäcke",
      "Sacs poubelle",
      "Sacchi per rifiuti",
      "Rubbish bags"
    ),
    category: cat.sonstiges,
  },
];

export const packScenarios: PackScenario[] = [
  {
    id: "solo",
    label: l4("Solo-Trip", "Trip en solo", "Viaggio in solitaria", "Solo trip"),
    description: l4(
      "Leicht und minimalistisch – du trägst alles selbst.",
      "Léger et minimaliste – tu portes tout toi-même.",
      "Leggero e minimalista – porti tutto tu.",
      "Light and minimalist – you carry everything yourself."
    ),
    icon: "Backpack",
    items: [
      ...basisAusruestung,
      {
        name: l4(
          "Ultraleicht-Handtuch",
          "Linge ultraléger",
          "Asciugamano ultraleggero",
          "Ultralight towel"
        ),
        category: cat.hygiene,
      },
      {
        name: l4(
          "Wasserfilter oder Entkeimungstabletten",
          "Filtre à eau ou pastilles de purification",
          "Filtro per l'acqua o pastiglie potabilizzanti",
          "Water filter or purification tablets"
        ),
        category: cat.kueche,
      },
      {
        name: l4(
          "Notfall-Biwaksack",
          "Sursac de bivouac d'urgence",
          "Sacco da bivacco d'emergenza",
          "Emergency bivvy bag"
        ),
        category: cat.sicherheit,
      },
      {
        name: l4(
          "Karte & Kompass",
          "Carte & boussole",
          "Cartina e bussola",
          "Map & compass"
        ),
        category: cat.orientierung,
      },
      {
        name: l4(
          "Buch oder E-Reader",
          "Livre ou liseuse",
          "Libro o e-reader",
          "Book or e-reader"
        ),
        category: cat.sonstiges,
      },
    ],
  },
  {
    id: "familie",
    label: l4(
      "Familienurlaub",
      "Vacances en famille",
      "Vacanza in famiglia",
      "Family holiday"
    ),
    description: l4(
      "Mit Kindern unterwegs – Komfort und Beschäftigung zählen.",
      "En route avec des enfants – le confort et les occupations comptent.",
      "In viaggio con i bambini – contano comfort e intrattenimento.",
      "Travelling with kids – comfort and entertainment matter."
    ),
    icon: "Users",
    items: [
      ...basisAusruestung,
      {
        name: l4(
          "Grosses Familienzelt mit Vorraum",
          "Grande tente familiale avec avancée",
          "Grande tenda familiare con veranda",
          "Large family tent with porch"
        ),
        category: cat.schlafen,
      },
      {
        name: l4(
          "Kinderschlafsäcke",
          "Sacs de couchage enfants",
          "Sacchi a pelo per bambini",
          "Kids' sleeping bags"
        ),
        category: cat.schlafen,
        quantity: 2,
      },
      {
        name: l4(
          "Lieblingskuscheltier",
          "Doudou préféré",
          "Peluche preferito",
          "Favourite cuddly toy"
        ),
        category: cat.kinder,
      },
      {
        name: l4(
          "Nachtlicht fürs Zelt",
          "Veilleuse pour la tente",
          "Lucina notturna per la tenda",
          "Night light for the tent"
        ),
        category: cat.kinder,
      },
      {
        name: l4(
          "Spielsachen & Sandspielzeug",
          "Jouets & jouets de sable",
          "Giocattoli e giochi da sabbia",
          "Toys & sand toys"
        ),
        category: cat.kinder,
      },
      {
        name: l4(
          "Bilderbücher / Vorlesebuch",
          "Livres d'images / livre à lire à voix haute",
          "Libri illustrati / libro da leggere",
          "Picture books / storybook"
        ),
        category: cat.kinder,
      },
      {
        name: l4(
          "Becherlupe & Kinderfernglas",
          "Loupe à insectes & jumelles pour enfants",
          "Lente d'ingrandimento e binocolo per bambini",
          "Bug viewer & kids' binoculars"
        ),
        category: cat.kinder,
      },
      {
        name: l4(
          "Wechselkleidung (mehr als du denkst)",
          "Vêtements de rechange (plus que tu ne penses)",
          "Vestiti di ricambio (più di quanto pensi)",
          "Spare clothes (more than you think)"
        ),
        category: cat.kinder,
      },
      {
        name: l4(
          "Feuchttücher",
          "Lingettes humides",
          "Salviettine umidificate",
          "Wet wipes"
        ),
        category: cat.hygiene,
      },
      {
        name: l4(
          "Campingstühle & Tisch",
          "Chaises de camping & table",
          "Sedie da campeggio e tavolo",
          "Camping chairs & table"
        ),
        category: cat.komfort,
      },
      {
        name: l4("Kühlbox", "Glacière", "Frigo box", "Cool box"),
        category: cat.kueche,
      },
      {
        name: l4(
          "Snacks für die Fahrt",
          "Snacks pour la route",
          "Snack per il viaggio",
          "Snacks for the journey"
        ),
        category: cat.kueche,
      },
    ],
  },
  {
    id: "motorrad",
    label: l4(
      "Motorrad-Zelten",
      "Camping à moto",
      "Campeggio in moto",
      "Motorcycle camping"
    ),
    description: l4(
      "Minimales Packmass – jeder Liter Stauraum zählt.",
      "Encombrement minimal – chaque litre de rangement compte.",
      "Ingombro minimo – ogni litro di spazio conta.",
      "Minimal pack size – every litre of storage counts."
    ),
    icon: "Bike",
    items: [
      ...basisAusruestung.filter(i => i.name.de !== topfPfanne.de),
      {
        name: l4(
          "Kompakter Topf (Pfanne als Deckel)",
          "Casserole compacte (poêle en couvercle)",
          "Pentola compatta (padella come coperchio)",
          "Compact pot (pan as lid)"
        ),
        category: cat.kueche,
      },
      {
        name: l4(
          "Kompressionssäcke",
          "Sacs de compression",
          "Sacchi a compressione",
          "Compression sacks"
        ),
        category: cat.gepaeck,
      },
      {
        name: l4(
          "Gepäckrollen / Seitentaschen wasserdicht",
          "Sacs de selle / sacoches latérales étanches",
          "Borse arrotolabili / borse laterali impermeabili",
          "Waterproof luggage rolls / panniers"
        ),
        category: cat.gepaeck,
      },
      {
        name: l4(
          "Spanngurte & Netz",
          "Sangles & filet",
          "Cinghie e rete",
          "Straps & cargo net"
        ),
        category: cat.gepaeck,
      },
      {
        name: l4(
          "Motorrad-Regenkombi",
          "Combinaison de pluie moto",
          "Completo antipioggia da moto",
          "Motorcycle rain suit"
        ),
        category: cat.kleidung,
      },
      {
        name: l4(
          "Kettenspray & Mini-Werkzeug",
          "Spray pour chaîne & mini-outils",
          "Spray per catena e mini attrezzi",
          "Chain spray & mini tool kit"
        ),
        category: cat.werkzeug,
      },
      {
        name: l4(
          "Ultraleicht-Zelt (1–2 Personen)",
          "Tente ultralégère (1–2 personnes)",
          "Tenda ultraleggera (1–2 persone)",
          "Ultralight tent (1–2 people)"
        ),
        category: cat.schlafen,
      },
      {
        name: l4(
          "Ohrstöpsel",
          "Bouchons d'oreilles",
          "Tappi per le orecchie",
          "Earplugs"
        ),
        category: cat.hygiene,
      },
    ],
  },
  /**
   * Freies Campen (Nutzerwunsch 09.08.2026): Zelt ohne Platz heisst ohne
   * Wasserhahn, ohne WC und ohne Abfalleimer – die Liste ergänzt genau
   * das, was der Platz sonst stellt. Grundsatz: alles wieder mitnehmen.
   */
  {
    id: "wildcampen",
    label: l4(
      "Freies Campen",
      "Camping sauvage",
      "Campeggio libero",
      "Wild camping"
    ),
    description: l4(
      "Zelten ohne Platz: Wasser, Hygiene und Abfall selbst organisiert.",
      "Camper sans emplacement : eau, hygiène et déchets à organiser soi-même.",
      "Campeggiare senza piazzola: acqua, igiene e rifiuti da organizzare da sé.",
      "Camping without a site: water, hygiene and waste organised yourself."
    ),
    icon: "Trees",
    items: [
      ...basisAusruestung,
      {
        name: l4(
          "Wasserkanister / Wassersack",
          "Bidon / poche à eau",
          "Tanica / sacca per l'acqua",
          "Water canister / water bag"
        ),
        category: cat.kueche,
      },
      {
        name: l4(
          "Wasserfilter oder Entkeimungstabletten",
          "Filtre à eau ou pastilles de purification",
          "Filtro per l'acqua o pastiglie potabilizzanti",
          "Water filter or purification tablets"
        ),
        category: cat.kueche,
      },
      {
        name: l4(
          "Kleine Schaufel (Toilettengang)",
          "Petite pelle (besoins naturels)",
          "Piccola pala (bisogni nel bosco)",
          "Small trowel (toilet duty)"
        ),
        category: cat.hygiene,
      },
      {
        name: l4(
          "Abfallsäcke (alles wieder mitnehmen)",
          "Sacs poubelle (tout remporter)",
          "Sacchi per i rifiuti (riportare tutto)",
          "Rubbish bags (pack everything out)"
        ),
        category: cat.sonstiges,
      },
      {
        name: l4(
          "Powerbank gross (keine Steckdose)",
          "Grande powerbank (pas de prise)",
          "Powerbank grande (nessuna presa)",
          "Large power bank (no socket)"
        ),
        category: cat.lichtEnergie,
      },
      {
        name: l4(
          "Ersatzbatterien für die Stirnlampe",
          "Piles de rechange pour la lampe frontale",
          "Batterie di ricambio per la frontale",
          "Spare batteries for the headlamp"
        ),
        category: cat.lichtEnergie,
      },
      {
        name: l4(
          "Biologisch abbaubare Seife",
          "Savon biodégradable",
          "Sapone biodegradabile",
          "Biodegradable soap"
        ),
        category: cat.hygiene,
      },
      {
        name: l4(
          "Karte / Offline-Karten der Gegend",
          "Carte / cartes hors ligne de la région",
          "Mappa / mappe offline della zona",
          "Map / offline maps of the area"
        ),
        category: cat.orientierung,
      },
    ],
  },
  /**
   * Szenarien für die Nicht-Camping-Reise-Arten (#468): bewusst OHNE die
   * Basis-Ausrüstung – wer ins Hotel oder auf die Piste fährt, braucht
   * weder Zelt noch Gaskocher auf der Liste.
   */
  {
    id: "staedtereise",
    label: l4("Städtereise", "City trip", "Viaggio in città", "City break"),
    description: l4(
      "Leichtes Gepäck für ein paar Tage Stadt – ohne Campingausrüstung.",
      "Bagage léger pour quelques jours en ville – sans matériel de camping.",
      "Bagaglio leggero per qualche giorno in città – senza attrezzatura da campeggio.",
      "Light luggage for a few days in the city – no camping gear."
    ),
    icon: "Building2",
    items: [
      {
        name: l4(
          "Bequeme Schuhe (eingelaufen)",
          "Chaussures confortables (déjà rodées)",
          "Scarpe comode (già collaudate)",
          "Comfortable shoes (broken in)"
        ),
        category: cat.kleidung,
      },
      {
        name: l4(
          "Tagesrucksack",
          "Sac à dos de jour",
          "Zaino da giorno",
          "Day pack"
        ),
        category: cat.gepaeck,
      },
      {
        name: l4(
          "Regenschirm oder Regenjacke",
          "Parapluie ou veste de pluie",
          "Ombrello o giacca antipioggia",
          "Umbrella or rain jacket"
        ),
        category: cat.kleidung,
      },
      {
        name: l4(
          "Ausgeh-Outfit für den Abend",
          "Tenue de sortie pour le soir",
          "Outfit per la sera",
          "Evening outfit"
        ),
        category: cat.kleidung,
      },
      {
        name: l4(
          "Powerbank + Ladekabel",
          "Powerbank + câble de charge",
          "Powerbank + cavo di ricarica",
          "Power bank + charging cable"
        ),
        category: cat.lichtEnergie,
      },
      {
        name: l4(
          "Ausweis / Pass",
          "Carte d'identité / passeport",
          "Carta d'identità / passaporto",
          "ID card / passport"
        ),
        category: cat.dokumente,
      },
      {
        name: l4(
          "Reservationen & Tickets (digital oder gedruckt)",
          "Réservations & billets (numériques ou imprimés)",
          "Prenotazioni e biglietti (digitali o stampati)",
          "Reservations & tickets (digital or printed)"
        ),
        category: cat.dokumente,
      },
      {
        name: l4(
          "Offline-Karte / Stadtplan",
          "Carte hors ligne / plan de ville",
          "Mappa offline / pianta della città",
          "Offline map / city map"
        ),
        category: cat.orientierung,
      },
      {
        name: l4("Trinkflasche", "Gourde", "Borraccia", "Water bottle"),
        category: cat.kueche,
      },
      {
        name: l4(
          "Kulturbeutel",
          "Trousse de toilette",
          "Beauty case",
          "Toiletry bag"
        ),
        category: cat.hygiene,
      },
      {
        name: l4(
          "Ohrstöpsel & Schlafmaske",
          "Bouchons d'oreilles & masque de sommeil",
          "Tappi per le orecchie e mascherina per dormire",
          "Earplugs & sleep mask"
        ),
        category: cat.hygiene,
      },
      {
        name: l4(
          "Kleines Portemonnaie / Geldgürtel",
          "Petit portefeuille / ceinture porte-monnaie",
          "Portafoglio piccolo / marsupio portasoldi",
          "Small wallet / money belt"
        ),
        category: cat.sicherheit,
      },
      {
        name: l4(
          "Sonnencrème & Sonnenbrille",
          "Crème solaire & lunettes de soleil",
          "Crema solare e occhiali da sole",
          "Sun cream & sunglasses"
        ),
        category: cat.hygiene,
      },
      {
        name: l4(
          "Blasenpflaster & Mini-Apotheke",
          "Pansements anti-ampoules & mini-pharmacie",
          "Cerotti per vesciche e mini farmacia",
          "Blister plasters & mini first aid kit"
        ),
        category: cat.sicherheit,
      },
    ],
  },
  {
    id: "strand",
    label: l4(
      "Strandferien",
      "Vacances à la plage",
      "Vacanze al mare",
      "Beach holiday"
    ),
    description: l4(
      "Alles für Tage am Wasser – Sonnenschutz, Badezeug und Strandspiel.",
      "Tout pour des journées au bord de l'eau – protection solaire, affaires de bain et jeux de plage.",
      "Tutto per giornate in riva al mare – protezione solare, costumi e giochi da spiaggia.",
      "Everything for days by the water – sun protection, swimwear and beach toys."
    ),
    icon: "Umbrella",
    items: [
      {
        name: l4(
          "Badekleidung",
          "Maillots de bain",
          "Costumi da bagno",
          "Swimwear"
        ),
        category: cat.kleidung,
        quantity: 2,
      },
      {
        name: l4(
          "Strandtücher",
          "Linges de plage",
          "Teli da spiaggia",
          "Beach towels"
        ),
        category: cat.hygiene,
        quantity: 2,
      },
      {
        name: l4(
          "Sonnencrème wasserfest LSF 50",
          "Crème solaire résistante à l'eau IP 50",
          "Crema solare resistente all'acqua SPF 50",
          "Waterproof sun cream SPF 50"
        ),
        category: cat.hygiene,
      },
      {
        name: l4(
          "After-Sun-Lotion",
          "Lotion après-soleil",
          "Lozione doposole",
          "After-sun lotion"
        ),
        category: cat.hygiene,
      },
      {
        name: l4(
          "Sonnenschirm oder Strandmuschel",
          "Parasol ou abri de plage",
          "Ombrellone o tenda da spiaggia",
          "Parasol or beach shelter"
        ),
        category: cat.komfort,
      },
      {
        name: l4(
          "Sonnenhut & Sonnenbrille",
          "Chapeau de soleil & lunettes de soleil",
          "Cappello da sole e occhiali da sole",
          "Sun hat & sunglasses"
        ),
        category: cat.kleidung,
      },
      {
        name: l4(
          "Badeschuhe",
          "Chaussures de bain",
          "Scarpe da scoglio",
          "Water shoes"
        ),
        category: cat.kleidung,
      },
      {
        name: l4(
          "Strandmatte / Picknickdecke",
          "Natte de plage / couverture de pique-nique",
          "Stuoia da spiaggia / coperta da picnic",
          "Beach mat / picnic blanket"
        ),
        category: cat.komfort,
      },
      {
        name: l4(
          "Kühltasche für Getränke",
          "Sac isotherme pour les boissons",
          "Borsa frigo per le bevande",
          "Cool bag for drinks"
        ),
        category: cat.kueche,
      },
      {
        name: l4("Trinkflaschen", "Gourdes", "Borracce", "Water bottles"),
        category: cat.kueche,
      },
      {
        name: l4(
          "Wasserdichte Handy-Hülle",
          "Pochette étanche pour le téléphone",
          "Custodia impermeabile per il telefono",
          "Waterproof phone pouch"
        ),
        category: cat.sonstiges,
      },
      {
        name: l4(
          "Schwimmhilfen für Kinder",
          "Aides à la natation pour enfants",
          "Braccioli / aiuti al galleggiamento per bambini",
          "Swimming aids for kids"
        ),
        category: cat.kinder,
      },
      {
        name: l4(
          "Sandspielzeug",
          "Jouets de sable",
          "Giochi da sabbia",
          "Sand toys"
        ),
        category: cat.kinder,
      },
      {
        name: l4(
          "Abfallsack für den Strand",
          "Sac poubelle pour la plage",
          "Sacchetto per i rifiuti in spiaggia",
          "Rubbish bag for the beach"
        ),
        category: cat.sonstiges,
      },
    ],
  },
  {
    id: "wintersport",
    label: l4(
      "Wintersport",
      "Sports d'hiver",
      "Sport invernali",
      "Winter sports"
    ),
    description: l4(
      "Piste und Schnee – warme Schichten, Schutz und Ausrüstung.",
      "Pistes et neige – couches chaudes, protection et équipement.",
      "Piste e neve – strati caldi, protezioni e attrezzatura.",
      "Slopes and snow – warm layers, protection and gear."
    ),
    icon: "Snowflake",
    items: [
      {
        name: l4(
          "Ski-/Snowboardjacke & -hose",
          "Veste & pantalon de ski/snowboard",
          "Giacca e pantaloni da sci/snowboard",
          "Ski/snowboard jacket & trousers"
        ),
        category: cat.kleidung,
      },
      {
        name: l4(
          "Thermounterwäsche",
          "Sous-vêtements thermiques",
          "Intimo termico",
          "Thermal underwear"
        ),
        category: cat.kleidung,
        quantity: 2,
      },
      {
        name: l4(
          "Skisocken",
          "Chaussettes de ski",
          "Calze da sci",
          "Ski socks"
        ),
        category: cat.kleidung,
        quantity: 3,
      },
      {
        name: l4(
          "Handschuhe + Ersatzpaar",
          "Gants + paire de rechange",
          "Guanti + paio di ricambio",
          "Gloves + spare pair"
        ),
        category: cat.kleidung,
      },
      {
        name: l4(
          "Mütze & Stirnband",
          "Bonnet & bandeau",
          "Berretto e fascia",
          "Beanie & headband"
        ),
        category: cat.kleidung,
      },
      {
        name: l4("Helm", "Casque", "Casco", "Helmet"),
        category: cat.sicherheit,
      },
      {
        name: l4(
          "Skibrille",
          "Masque de ski",
          "Maschera da sci",
          "Ski goggles"
        ),
        category: cat.sicherheit,
      },
      {
        name: l4(
          "Rückenprotektor",
          "Protection dorsale",
          "Paraschiena",
          "Back protector"
        ),
        category: cat.sicherheit,
      },
      {
        name: l4(
          "Sonnencrème & Lippenschutz mit UV-Schutz",
          "Crème solaire & stick à lèvres avec protection UV",
          "Crema solare e burrocacao con protezione UV",
          "Sun cream & UV lip balm"
        ),
        category: cat.hygiene,
      },
      {
        name: l4(
          "Skipass / Abo",
          "Forfait de ski / abonnement",
          "Skipass / abbonamento",
          "Ski pass / season pass"
        ),
        category: cat.dokumente,
      },
      {
        name: l4(
          "Ski-/Snowboard-Ausrüstung oder Miet-Reservation",
          "Équipement de ski/snowboard ou réservation de location",
          "Attrezzatura da sci/snowboard o prenotazione del noleggio",
          "Ski/snowboard gear or rental reservation"
        ),
        category: cat.sonstiges,
      },
      {
        name: l4(
          "Thermosflasche für Tee",
          "Bouteille thermos pour le thé",
          "Thermos per il tè",
          "Thermos flask for tea"
        ),
        category: cat.kueche,
      },
      {
        name: l4(
          "Warme Winterschuhe",
          "Chaussures d'hiver chaudes",
          "Scarpe invernali calde",
          "Warm winter boots"
        ),
        category: cat.kleidung,
      },
      {
        name: l4("Handwärmer", "Chauffe-mains", "Scaldamani", "Hand warmers"),
        category: cat.komfort,
      },
    ],
  },
  {
    id: "hotelferien",
    label: l4(
      "Hotelferien",
      "Vacances à l'hôtel",
      "Vacanze in hotel",
      "Hotel holiday"
    ),
    description: l4(
      "Koffer statt Zelt – Papiere, Ladegeräte und Kleider, ohne Camping-Ballast.",
      "Valise au lieu de la tente – papiers, chargeurs et vêtements, sans le matériel de camping.",
      "Valigia invece della tenda – documenti, caricatori e vestiti, senza zavorra da campeggio.",
      "Suitcase instead of tent – papers, chargers and clothes, without the camping load."
    ),
    icon: "Building2",
    items: [
      {
        name: l4(
          "Reisepass / ID",
          "Passeport / CI",
          "Passaporto / CI",
          "Passport / ID"
        ),
        category: cat.dokumente,
      },
      {
        name: l4(
          "Buchungsbestätigung",
          "Confirmation de réservation",
          "Conferma di prenotazione",
          "Booking confirmation"
        ),
        category: cat.dokumente,
      },
      {
        name: l4(
          "Kreditkarte & Bargeld",
          "Carte de crédit & espèces",
          "Carta di credito e contanti",
          "Credit card & cash"
        ),
        category: cat.dokumente,
      },
      {
        name: l4(
          "Ladegeräte & Kabel",
          "Chargeurs & câbles",
          "Caricatori e cavi",
          "Chargers & cables"
        ),
        category: cat.lichtEnergie,
      },
      {
        name: l4(
          "Reiseadapter",
          "Adaptateur de voyage",
          "Adattatore da viaggio",
          "Travel adapter"
        ),
        category: cat.lichtEnergie,
      },
      {
        name: l4("Powerbank", "Batterie externe", "Powerbank", "Power bank"),
        category: cat.lichtEnergie,
      },
      {
        name: l4(
          "Kulturbeutel",
          "Trousse de toilette",
          "Beauty case",
          "Toiletry bag"
        ),
        category: cat.hygiene,
      },
      {
        name: l4(
          "Medikamente & Apotheke",
          "Médicaments & pharmacie",
          "Medicinali e farmacia",
          "Medication & first aid"
        ),
        category: cat.sicherheit,
      },
      {
        name: l4(
          "Wechselwäsche pro Tag",
          "Linge de rechange par jour",
          "Cambio per ogni giorno",
          "Change of clothes per day"
        ),
        category: cat.kleidung,
      },
      {
        name: l4(
          "Bequeme Schuhe",
          "Chaussures confortables",
          "Scarpe comode",
          "Comfortable shoes"
        ),
        category: cat.kleidung,
      },
      {
        name: l4(
          "Regenjacke",
          "Veste de pluie",
          "Giacca antipioggia",
          "Rain jacket"
        ),
        category: cat.kleidung,
      },
      {
        name: l4(
          "Badesachen fürs Hotelbad",
          "Affaires de bain pour la piscine",
          "Costume per la piscina",
          "Swim kit for the hotel pool"
        ),
        category: cat.kleidung,
      },
      {
        name: l4(
          "Ohrenstöpsel & Schlafmaske",
          "Bouchons d'oreilles & masque",
          "Tappi e mascherina",
          "Earplugs & sleep mask"
        ),
        category: cat.komfort,
      },
      {
        name: l4(
          "Tagesrucksack",
          "Sac à dos de jour",
          "Zainetto da giorno",
          "Day pack"
        ),
        category: cat.gepaeck,
      },
      {
        name: l4(
          "Wäschesack",
          "Sac à linge",
          "Sacco biancheria",
          "Laundry bag"
        ),
        category: cat.gepaeck,
      },
      {
        name: l4(
          "Buch / Reiselektüre",
          "Livre / lecture",
          "Libro / lettura",
          "Book / holiday reading"
        ),
        category: cat.komfort,
      },
    ],
  },
  {
    id: "velotour",
    label: l4("Velotour", "Randonnée à vélo", "Tour in bici", "Bike tour"),
    description: l4(
      "Alles für Tagesetappen auf zwei Rädern – Werkzeug, Licht und Verpflegung.",
      "Tout pour des étapes à vélo – outils, éclairage et ravitaillement.",
      "Tutto per le tappe in bici – attrezzi, luci e viveri.",
      "Everything for day stages on two wheels – tools, lights and provisions."
    ),
    icon: "Bike",
    items: [
      {
        name: l4("Velohelm", "Casque vélo", "Casco bici", "Bike helmet"),
        category: cat.sicherheit,
      },
      {
        name: l4(
          "Flickzeug & Ersatzschlauch",
          "Kit de réparation & chambre à air",
          "Kit riparazione e camera d'aria",
          "Repair kit & spare tube"
        ),
        category: cat.werkzeug,
      },
      {
        name: l4("Pumpe", "Pompe", "Pompa", "Pump"),
        category: cat.werkzeug,
      },
      {
        name: l4(
          "Multitool & Kettenöl",
          "Multitool & huile de chaîne",
          "Multitool e olio catena",
          "Multitool & chain oil"
        ),
        category: cat.werkzeug,
      },
      {
        name: l4(
          "Velolichter & Ersatzakku",
          "Éclairage & batterie de rechange",
          "Luci e batteria di scorta",
          "Bike lights & spare battery"
        ),
        category: cat.lichtEnergie,
      },
      {
        name: l4("Veloschloss", "Antivol", "Lucchetto", "Bike lock"),
        category: cat.sicherheit,
      },
      {
        name: l4(
          "Velotaschen / Gepäckträgertasche",
          "Sacoches",
          "Borse da bici",
          "Panniers"
        ),
        category: cat.gepaeck,
      },
      {
        name: l4(
          "Velohandschuhe",
          "Gants vélo",
          "Guanti bici",
          "Cycling gloves"
        ),
        category: cat.kleidung,
      },
      {
        name: l4(
          "Velohose & Trikots",
          "Cuissard & maillots",
          "Pantaloncini e maglie",
          "Bike shorts & jerseys"
        ),
        category: cat.kleidung,
      },
      {
        name: l4(
          "Regenjacke",
          "Veste de pluie",
          "Giacca antipioggia",
          "Rain jacket"
        ),
        category: cat.kleidung,
      },
      {
        name: l4("Trinkflaschen", "Bidons", "Borracce", "Water bottles"),
        category: cat.kueche,
        quantity: 2,
      },
      {
        name: l4(
          "Riegel & Notproviant",
          "Barres & en-cas de secours",
          "Barrette e scorta d'emergenza",
          "Bars & emergency snacks"
        ),
        category: cat.kueche,
      },
      {
        name: l4(
          "Sonnencreme & Brille",
          "Crème solaire & lunettes",
          "Crema solare e occhiali",
          "Sunscreen & glasses"
        ),
        category: cat.sicherheit,
      },
      {
        name: l4(
          "Karte / GPS-Halterung",
          "Carte / support GPS",
          "Mappa / supporto GPS",
          "Map / GPS mount"
        ),
        category: cat.orientierung,
      },
      {
        name: l4(
          "Erste-Hilfe-Set",
          "Trousse de premiers secours",
          "Kit di primo soccorso",
          "First aid kit"
        ),
        category: cat.sicherheit,
      },
      {
        name: l4(
          "Wechselkleider für abends",
          "Vêtements pour le soir",
          "Vestiti per la sera",
          "Change of clothes for the evening"
        ),
        category: cat.kleidung,
      },
    ],
  },
  {
    id: "hund",
    label: l4(
      "Camping mit Hund",
      "Camping avec chien",
      "Campeggio con il cane",
      "Camping with a dog"
    ),
    description: l4(
      "Alles für den Vierbeiner – vom Napf bis zum Heimtierausweis.",
      "Tout pour le compagnon à quatre pattes – de la gamelle au passeport.",
      "Tutto per l'amico a quattro zampe – dalla ciotola al passaporto.",
      "Everything for the four-legged friend – from bowl to pet passport."
    ),
    icon: "PawPrint",
    items: [
      ...basisAusruestung,
      {
        name: l4(
          "Hundefutter für alle Tage",
          "Croquettes pour tout le s\u00e9jour",
          "Cibo per cane per tutti i giorni",
          "Dog food for every day"
        ),
        category: cat.kueche,
      },
      {
        name: l4(
          "Futter- und Wassernapf",
          "Gamelles (nourriture et eau)",
          "Ciotole per cibo e acqua",
          "Food and water bowls"
        ),
        category: cat.kueche,
      },
      {
        name: l4(
          "Leine & Laufleine mit Erdspiess",
          "Laisse & longe avec piquet",
          "Guinzaglio e cavo con picchetto",
          "Leash & tie-out with ground stake"
        ),
        category: cat.sonstiges,
      },
      {
        name: l4("Maulkorb", "Muselière", "Museruola", "Muzzle"),
        category: cat.sonstiges,
      },
      {
        name: l4(
          "Hundebett oder Decke",
          "Panier ou couverture",
          "Cuccia o coperta",
          "Dog bed or blanket"
        ),
        category: cat.schlafen,
      },
      {
        name: l4(
          "Kotbeutel",
          "Sacs \u00e0 crottes",
          "Sacchetti igienici",
          "Poop bags"
        ),
        category: cat.hygiene,
      },
      {
        name: l4(
          "Zeckenzange & Pfoten-Erste-Hilfe",
          "Pince \u00e0 tiques & premiers secours pour pattes",
          "Pinza per zecche e primo soccorso per le zampe",
          "Tick tweezers & paw first aid"
        ),
        category: cat.sicherheit,
      },
      {
        name: l4(
          "Heimtierausweis & Impfnachweis",
          "Passeport animal & preuves de vaccination",
          "Passaporto dell'animale e vaccinazioni",
          "Pet passport & vaccination proof"
        ),
        category: cat.sonstiges,
      },
      {
        name: l4(
          "Hundehandtuch",
          "Linge pour le chien",
          "Asciugamano per il cane",
          "Dog towel"
        ),
        category: cat.hygiene,
      },
      {
        name: l4(
          "Reise-Wassernapf f\u00fcr unterwegs",
          "Gamelle de voyage pour la route",
          "Ciotola da viaggio per strada",
          "Travel water bowl for the road"
        ),
        category: cat.sonstiges,
      },
    ],
  },
  {
    id: "custom",
    label: l4(
      "Eigene Liste",
      "Liste personnelle",
      "Lista personale",
      "Custom list"
    ),
    description: l4(
      "Leere Liste – stelle deine Ausrüstung selbst zusammen.",
      "Liste vide – compose ton équipement toi-même.",
      "Lista vuota – componi tu la tua attrezzatura.",
      "Empty list – put together your own gear."
    ),
    icon: "ListPlus",
    items: [],
  },
];

/** Familien-Modus: Zusatzpakete, die jeder Liste hinzugefügt werden können. */
export const familyAddOns: {
  id: string;
  label: L4;
  description: L4;
  items: PackTemplateItem[];
}[] = [
  {
    id: "kindersicherheit",
    label: l4(
      "Kindersichere Ausrüstung",
      "Équipement sécurisé pour enfants",
      "Attrezzatura a misura di bambino",
      "Child-safe equipment"
    ),
    description: l4(
      "Sicherheits-Ergänzungen für Kleinkinder und Kinder bis ca. 8 Jahre.",
      "Compléments de sécurité pour les tout-petits et les enfants jusqu'à 8 ans environ.",
      "Integrazioni di sicurezza per i più piccoli e i bambini fino a circa 8 anni.",
      "Safety additions for toddlers and children up to about 8 years."
    ),
    items: [
      {
        name: l4(
          "Reflektierende Armbänder / Leuchtbänder",
          "Bracelets réfléchissants / bandes lumineuses",
          "Braccialetti riflettenti / fasce luminose",
          "Reflective wristbands / glow bands"
        ),
        category: cat.kinderSicherheit,
        quantity: 2,
      },
      {
        name: l4(
          "Notfall-Armband mit Handynummer der Eltern",
          "Bracelet d'urgence avec le numéro de portable des parents",
          "Braccialetto d'emergenza con il numero di cellulare dei genitori",
          "Emergency wristband with parents' mobile number"
        ),
        category: cat.kinderSicherheit,
        quantity: 2,
      },
      {
        name: l4(
          "Trillerpfeife pro Kind",
          "Sifflet par enfant",
          "Fischietto per ogni bambino",
          "Whistle per child"
        ),
        category: cat.kinderSicherheit,
        quantity: 2,
      },
      {
        name: l4(
          "Kindgerechte Stirnlampe",
          "Lampe frontale adaptée aux enfants",
          "Lampada frontale per bambini",
          "Child-friendly head torch"
        ),
        category: cat.kinderSicherheit,
        quantity: 2,
      },
      {
        name: l4(
          "Steckdosen-/Kocher-Abschirmung (Kleinkind)",
          "Protection prises/réchaud (tout-petit)",
          "Protezione prese/fornello (bimbo piccolo)",
          "Socket/stove guard (toddler)"
        ),
        category: cat.kinderSicherheit,
      },
      {
        name: l4(
          "Sonnenzelt / UV-Schutz fürs Kleinkind",
          "Tente solaire / protection UV pour le tout-petit",
          "Tenda parasole / protezione UV per il bimbo piccolo",
          "Sun shelter / UV protection for the toddler"
        ),
        category: cat.kinderSicherheit,
      },
      {
        name: l4(
          "Schwimmhilfe (falls Gewässer in der Nähe)",
          "Aide à la natation (si plan d'eau à proximité)",
          "Aiuto al galleggiamento (se c'è acqua nelle vicinanze)",
          "Swimming aid (if water nearby)"
        ),
        category: cat.kinderSicherheit,
      },
    ],
  },
  {
    id: "reiseapotheke-kinder",
    label: l4(
      "Reiseapotheke für Kinder",
      "Pharmacie de voyage pour enfants",
      "Farmacia da viaggio per bambini",
      "Travel first aid kit for kids"
    ),
    description: l4(
      "Erweiterung der Standard-Apotheke für Kleinkind und Schulkind.",
      "Extension de la pharmacie standard pour tout-petit et enfant scolarisé.",
      "Estensione della farmacia standard per bimbi piccoli e in età scolare.",
      "Extension of the standard kit for toddlers and school-age children."
    ),
    items: [
      {
        name: l4(
          "Fieberthermometer",
          "Thermomètre médical",
          "Termometro per la febbre",
          "Fever thermometer"
        ),
        category: cat.kinderApotheke,
      },
      {
        name: l4(
          "Fieber-/Schmerzzäpfchen oder -sirup (altersgerecht)",
          "Suppositoires ou sirop contre fièvre/douleurs (adapté à l'âge)",
          "Supposte o sciroppo per febbre/dolori (adatti all'età)",
          "Fever/pain suppositories or syrup (age-appropriate)"
        ),
        category: cat.kinderApotheke,
      },
      {
        name: l4(
          "Elektrolytlösung für Kinder",
          "Solution électrolytique pour enfants",
          "Soluzione elettrolitica per bambini",
          "Electrolyte solution for children"
        ),
        category: cat.kinderApotheke,
      },
      {
        name: l4(
          "Kinder-Sonnencrème LSF 50+",
          "Crème solaire enfants IP 50+",
          "Crema solare bambini SPF 50+",
          "Kids' sun cream SPF 50+"
        ),
        category: cat.kinderApotheke,
      },
      {
        name: l4(
          "Insektenschutz für Kinder",
          "Anti-insectes pour enfants",
          "Repellente per insetti per bambini",
          "Insect repellent for children"
        ),
        category: cat.kinderApotheke,
      },
      {
        name: l4(
          "Wund- und Heilsalbe",
          "Pommade cicatrisante",
          "Pomata cicatrizzante",
          "Wound-healing ointment"
        ),
        category: cat.kinderApotheke,
      },
      {
        name: l4(
          "Kinderpflaster (bunt hilft!)",
          "Pansements enfants (les couleurs aident !)",
          "Cerotti per bambini (colorati aiutano!)",
          "Kids' plasters (colourful helps!)"
        ),
        category: cat.kinderApotheke,
      },
      {
        name: l4(
          "Kühlendes Gel für Insektenstiche",
          "Gel apaisant pour piqûres d'insectes",
          "Gel rinfrescante per punture d'insetto",
          "Cooling gel for insect bites"
        ),
        category: cat.kinderApotheke,
      },
      {
        name: l4(
          "Windeln & Wundschutzcrème (Kleinkind)",
          "Couches & crème pour le change (tout-petit)",
          "Pannolini e crema protettiva (bimbo piccolo)",
          "Nappies & nappy cream (toddler)"
        ),
        category: cat.kinderApotheke,
      },
    ],
  },
];

/**
 * Eintrag einer eigenen Packlisten-Vorlage (packTemplatesCustom.itemsJson).
 * Bewusst einsprachig: die Vorlage friert die Texte der Ursprungs-Liste ein.
 */
export interface CustomTemplateItem {
  name: string;
  category: string;
  quantity: number;
}

/** itemsJson defensiv parsen – kaputte Daten ergeben eine leere Vorlage. */
export function parseCustomTemplateItems(json: string): CustomTemplateItem[] {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    const items: CustomTemplateItem[] = [];
    for (const entry of parsed) {
      if (typeof entry !== "object" || entry === null) continue;
      const { name, category, quantity } = entry as Record<string, unknown>;
      if (typeof name !== "string" || name.length === 0) continue;
      items.push({
        name,
        category: typeof category === "string" ? category : "Allgemein",
        quantity:
          typeof quantity === "number" && Number.isFinite(quantity)
            ? Math.max(1, Math.min(99, Math.round(quantity)))
            : 1,
      });
    }
    return items;
  } catch {
    return [];
  }
}
