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
};

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
