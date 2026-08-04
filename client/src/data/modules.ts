/**
 * Modul-Katalog der Startseite: Kacheln mit Gruppe, Icon und Beschreibung.
 * Eigenes Datenmodul, damit auch die globale Suche die Werkzeuge findet.
 * Alle sichtbaren Texte liegen als L4 in vier Sprachen vor.
 */
import { l4, type L4 } from "@shared/i18n";
import {
  BatteryCharging,
  BookOpen,
  Cable,
  CloudSunRain,
  Cloudy,
  Compass,
  CookingPot,
  Cross,
  Dices,
  Droplets,
  Footprints,
  Gauge,
  Gem,
  Hammer,
  Languages,
  ListChecks,
  LocateFixed,
  Map as MapIcon,
  Moon,
  Music,
  NotebookPen,
  Package,
  PackageOpen,
  Refrigerator,
  Scale,
  Shirt,
  ShoppingCart,
  Signpost,
  Siren,
  Sprout,
  Tent,
  TreePine,
  Truck,
  Users,
  Wrench,
} from "lucide-react";

export interface Module {
  path: string;
  title: L4;
  description: L4;
  icon: React.ComponentType<{ className?: string }>;
  group:
    | "reise"
    | "ausruestung"
    | "vorOrt"
    | "Sicherheit"
    | "Erste Hilfe"
    | "Energie & Wasser";
  offline?: boolean;
}

export const modules: Module[] = [
  {
    path: "/tagebuch",
    title: l4("Meine Reisen", "Mes voyages", "I miei viaggi", "My trips"),
    description: l4(
      "Aufenthalte festhalten, Nächte und Lieblingsplätze zählen",
      "Note tes séjours, compte les nuits et tes lieux préférés",
      "Annota i soggiorni, conta notti e posti preferiti",
      "Log your stays, count nights and favourite spots"
    ),
    icon: BookOpen,
    group: "reise",
  },
  {
    path: "/packlisten",
    title: l4(
      "Packlisten",
      "Listes de bagages",
      "Liste bagagli",
      "Packing lists"
    ),
    description: l4(
      "Szenario-basierte Checklisten zum Abhaken",
      "Checklists par scénario à cocher",
      "Checklist per scenario da spuntare",
      "Scenario-based checklists to tick off"
    ),
    icon: ListChecks,
    group: "reise",
  },
  {
    path: "/inventar",
    title: l4("Inventar", "Inventaire", "Inventario", "Inventory"),
    description: l4(
      "Ausrüstung mit Gewicht und Volumen erfassen",
      "Saisis ton équipement avec poids et volume",
      "Registra l'attrezzatura con peso e volume",
      "Track your gear with weight and volume"
    ),
    icon: Package,
    group: "ausruestung",
  },
  {
    path: "/kisten",
    title: l4("Kisten", "Caisses", "Casse", "Boxes"),
    description: l4(
      "Was liegt in welcher Box? Etiketten mit QR-Code zum Ausdrucken",
      "Qu'y a-t-il dans quelle caisse ? Étiquettes avec QR-code à imprimer",
      "Cosa c'è in quale cassa? Etichette con codice QR da stampare",
      "What is in which box? Printable labels with QR code"
    ),
    icon: PackageOpen,
    group: "ausruestung",
  },
  {
    path: "/packen",
    title: l4(
      "Pack-Optimierung",
      "Optimisation des bagages",
      "Ottimizzazione bagagli",
      "Packing optimiser"
    ),
    description: l4(
      "Gewicht und Packmass im Griff behalten",
      "Garde le poids et le volume sous contrôle",
      "Tieni sotto controllo peso e ingombro",
      "Keep weight and packed size under control"
    ),
    icon: Scale,
    group: "ausruestung",
  },
  {
    path: "/zuladung",
    title: l4(
      "Zuladungs-Rechner",
      "Calculateur de charge utile",
      "Calcolatore del carico",
      "Payload calculator"
    ),
    description: l4(
      "Ist das Gespann überladen? Gesamtgewicht, Anhängelast, Stützlast",
      "L'attelage est-il surchargé ? Poids total, charge tractable, charge sur la boule",
      "Il traino è sovraccarico? Peso totale, massa rimorchiabile, carico sul gancio",
      "Is the rig overloaded? Gross weight, towing capacity, nose weight"
    ),
    icon: Truck,
    group: "ausruestung",
    offline: true,
  },
  {
    path: "/laenderregeln",
    title: l4(
      "Maut, Vignette & Regeln",
      "Péage, vignette & règles",
      "Pedaggi, vignetta e regole",
      "Tolls, vignettes & rules"
    ),
    description: l4(
      "Kurzinfo je Land: Maut, Tempo mit Anhänger, Pflichtausrüstung, Notruf",
      "Fiche par pays : péage, vitesse avec remorque, équipement obligatoire, urgences",
      "Scheda per paese: pedaggi, velocità con rimorchio, dotazione obbligatoria, emergenze",
      "Country briefing: tolls, speeds when towing, mandatory kit, emergency number"
    ),
    icon: Signpost,
    group: "reise",
    offline: true,
  },
  {
    path: "/notizen",
    title: l4("Notizen", "Notes", "Note", "Notes"),
    description: l4(
      "Freie Notizen mit Stichwörtern – für alles, was sonst nirgends passt",
      "Notes libres avec mots-clés – pour tout ce qui n'a pas sa place ailleurs",
      "Note libere con parole chiave – per tutto ciò che non trova posto altrove",
      "Free-form notes with keywords – for everything that fits nowhere else"
    ),
    icon: NotebookPen,
    group: "reise",
  },
  {
    path: "/karte",
    title: l4("Karte", "Carte", "Mappa", "Map"),
    description: l4(
      "Alle gespeicherten Zeltplätze mit Übernachtungen auf der Karte",
      "Tous les emplacements enregistrés avec les nuitées sur la carte",
      "Tutte le piazzole salvate con i pernottamenti sulla mappa",
      "All saved pitches with overnight stays on the map"
    ),
    icon: MapIcon,
    group: "vorOrt",
  },
  {
    path: "/zeltplaetze",
    title: l4(
      "Zeltplatz-Favoriten",
      "Emplacements favoris",
      "Piazzole preferite",
      "Favourite pitches"
    ),
    description: l4(
      "Orte speichern, Wetter und Sonne im Voraus prüfen",
      "Enregistre des lieux, vérifie météo et soleil à l'avance",
      "Salva i luoghi e controlla in anticipo meteo e sole",
      "Save places, check weather and sun in advance"
    ),
    icon: Tent,
    group: "vorOrt",
  },
  {
    path: "/wasserwaage",
    title: l4("Wasserwaage", "Niveau à bulle", "Livella", "Spirit level"),
    description: l4(
      "Wohnwagen und Tisch mit dem Lagesensor ausrichten",
      "Mets la caravane et la table à niveau avec le capteur",
      "Metti in piano caravan e tavolo con il sensore",
      "Level your caravan and table with the motion sensor"
    ),
    icon: Gauge,
    group: "vorOrt",
    offline: true,
  },
  {
    path: "/sonne",
    title: l4(
      "Sonnenstand-Kompass",
      "Boussole solaire",
      "Bussola solare",
      "Sun compass"
    ),
    description: l4(
      "Sonnenposition, Auf- und Untergang am Standort",
      "Position du soleil, lever et coucher sur place",
      "Posizione del sole, alba e tramonto sul posto",
      "Sun position, sunrise and sunset at your location"
    ),
    icon: Compass,
    group: "vorOrt",
  },
  {
    path: "/zeltfinder",
    title: l4("Zelt-Finder", "Retrouve-tente", "Trova-tenda", "Tent finder"),
    description: l4(
      "Kompass-Pfeil und Distanz zurück zum Zelt",
      "Flèche boussole et distance pour retrouver la tente",
      "Freccia bussola e distanza per ritrovare la tenda",
      "Compass arrow and distance back to your tent"
    ),
    icon: LocateFixed,
    group: "vorOrt",
    offline: true,
  },
  {
    path: "/wanderung",
    title: l4(
      "Wanderung aufzeichnen",
      "Enregistrer une randonnée",
      "Registra un'escursione",
      "Record a hike"
    ),
    description: l4(
      "GPS-Track mit Strecke, Dauer, Tempo und Höhenmetern",
      "Trace GPS avec distance, durée, allure et dénivelé",
      "Traccia GPS con distanza, durata, andatura e dislivello",
      "GPS track with distance, duration, pace and elevation"
    ),
    icon: Footprints,
    group: "vorOrt",
  },
  {
    path: "/rasen",
    title: l4("Rasenschoner", "Protège-gazon", "Salva-prato", "Lawn saver"),
    description: l4(
      "Wie lange darf das Zelt auf dem Rasen stehen?",
      "Combien de temps la tente peut-elle rester sur l'herbe ?",
      "Per quanto tempo la tenda può restare sul prato?",
      "How long can the tent stay on the grass?"
    ),
    icon: Sprout,
    group: "vorOrt",
    offline: true,
  },
  {
    path: "/trockenzeiten",
    title: l4(
      "Trockenzeiten",
      "Temps de séchage",
      "Tempi di asciugatura",
      "Drying times"
    ),
    description: l4(
      "Wird die Wäsche bis Sonnenuntergang trocken?",
      "Le linge sera-t-il sec avant le coucher du soleil ?",
      "Il bucato si asciugherà prima del tramonto?",
      "Will the laundry dry before sunset?"
    ),
    icon: Shirt,
    group: "vorOrt",
  },
  {
    path: "/wetter",
    title: l4(
      "Camp-Wetter",
      "Météo du camp",
      "Meteo del campo",
      "Camp weather"
    ),
    description: l4(
      "Hyperlokale Vorhersage und Unwetterwarnungen",
      "Prévisions hyperlocales et alertes d'intempéries",
      "Previsioni iperlocali e allerte maltempo",
      "Hyperlocal forecast and severe weather warnings"
    ),
    icon: CloudSunRain,
    group: "Sicherheit",
  },
  {
    path: "/sos",
    title: l4(
      "SOS & Notfall",
      "SOS & urgences",
      "SOS ed emergenze",
      "SOS & emergency"
    ),
    description: l4(
      "GPS-Koordinaten und Notfallnummern",
      "Coordonnées GPS et numéros d'urgence",
      "Coordinate GPS e numeri d'emergenza",
      "GPS coordinates and emergency numbers"
    ),
    icon: Siren,
    group: "Sicherheit",
  },
  {
    path: "/erste-hilfe",
    title: l4("Erste Hilfe", "Premiers secours", "Primo soccorso", "First aid"),
    description: l4(
      "Offline-Ratgeber für Outdoor-Verletzungen",
      "Guide hors ligne pour les blessures en plein air",
      "Guida offline per gli infortuni all'aperto",
      "Offline guide for outdoor injuries"
    ),
    icon: Cross,
    group: "Sicherheit",
    offline: true,
  },
  {
    path: "/nachtruhe",
    title: l4(
      "Camp-Quiet-Timer",
      "Camp Quiet Timer",
      "Camp Quiet Timer",
      "Camp quiet timer"
    ),
    description: l4(
      "Lautstärke im Blick während der Nachtruhe",
      "Garde un œil sur le volume pendant le repos nocturne",
      "Tieni d'occhio il volume durante il riposo notturno",
      "Keep an eye on noise during quiet hours"
    ),
    icon: Moon,
    group: "Sicherheit",
  },
  {
    path: "/energie",
    title: l4(
      "Energie-Budget",
      "Budget énergie",
      "Budget energia",
      "Energy budget"
    ),
    description: l4(
      "Reichweite, Verbrauch und Solarertrag-Prognose",
      "Autonomie, consommation et prévision solaire",
      "Autonomia, consumo e previsione solare",
      "Runtime, consumption and solar yield forecast"
    ),
    icon: BatteryCharging,
    group: "Energie & Wasser",
  },
  {
    path: "/wasser",
    title: l4(
      "Trinkwasser-Rechner",
      "Calculateur d'eau potable",
      "Calcolatore acqua potabile",
      "Drinking water calculator"
    ),
    description: l4(
      "Wasserbedarf für Personen, Tage und Hitze",
      "Besoins en eau selon personnes, jours et chaleur",
      "Fabbisogno d'acqua per persone, giorni e caldo",
      "Water needs for people, days and heat"
    ),
    icon: Droplets,
    group: "Energie & Wasser",
  },
  {
    path: "/rezepte",
    title: l4(
      "Campfire-Rezepte",
      "Recettes de feu de camp",
      "Ricette da falò",
      "Campfire recipes"
    ),
    description: l4(
      "Kochen auf Gaskocher und offenem Feuer",
      "Cuisine au réchaud à gaz et au feu ouvert",
      "Cucina su fornello a gas e fuoco vivo",
      "Cooking on a gas stove and open fire"
    ),
    icon: CookingPot,
    group: "Erste Hilfe",
    offline: true,
  },
  {
    path: "/kuehlbox",
    title: l4(
      "Kühlbox & Trockenvorrat",
      "Glacière & provisions sèches",
      "Frigo box e dispensa",
      "Cool box & dry store"
    ),
    description: l4(
      "Vorräte erfassen, passende Rezepte finden",
      "Saisis tes provisions et trouve des recettes adaptées",
      "Registra le scorte e trova ricette adatte",
      "Track supplies and find matching recipes"
    ),
    icon: Refrigerator,
    group: "Erste Hilfe",
  },
  {
    path: "/einkauf",
    title: l4(
      "Einkaufsliste",
      "Liste de courses",
      "Lista della spesa",
      "Shopping list"
    ),
    description: l4(
      "Abhaken beim Einkauf, Zutaten aus dem Rezeptbuch übernehmen",
      "Coche en faisant les courses, reprends les ingrédients des recettes",
      "Spunta durante la spesa, riprendi gli ingredienti dal ricettario",
      "Tick off while shopping, take ingredients from the recipe book"
    ),
    icon: ShoppingCart,
    group: "Erste Hilfe",
  },
  {
    path: "/knoten",
    title: l4(
      "Knoten-Bibliothek",
      "Bibliothèque de nœuds",
      "Biblioteca dei nodi",
      "Knot library"
    ),
    description: l4(
      "Die wichtigsten Outdoor-Knoten, Schritt für Schritt",
      "Les nœuds outdoor essentiels, pas à pas",
      "I nodi outdoor più importanti, passo dopo passo",
      "The key outdoor knots, step by step"
    ),
    icon: Cable,
    group: "Erste Hilfe",
    offline: true,
  },
  {
    path: "/natur",
    title: l4(
      "Natur-Entdecker",
      "Explorateur nature",
      "Esploratore della natura",
      "Nature explorer"
    ),
    description: l4(
      "Tierspuren, Sternbilder, Bäume, Pilze, Beeren – und dein Fangbuch",
      "Traces d'animaux, constellations, arbres, champignons, baies – et ton carnet de pêche",
      "Tracce di animali, costellazioni, alberi, funghi, bacche – e il tuo libretto delle catture",
      "Animal tracks, constellations, trees, mushrooms, berries – and your catch log"
    ),
    icon: TreePine,
    group: "Erste Hilfe",
    offline: true,
  },
  {
    path: "/wolken",
    title: l4(
      "Wolken-Lexikon",
      "Lexique des nuages",
      "Lessico delle nuvole",
      "Cloud lexicon"
    ),
    description: l4(
      "Wolkenart erkennen und wissen, welches Wetter folgt",
      "Reconnais le type de nuage et sais quel temps arrive",
      "Riconosci il tipo di nuvola e sai che tempo arriva",
      "Recognise the cloud type and know what weather follows"
    ),
    icon: Cloudy,
    group: "Erste Hilfe",
    offline: true,
  },
  {
    path: "/zeltpflege",
    title: l4(
      "Zeltpflege",
      "Entretien de la tente",
      "Cura della tenda",
      "Tent care"
    ),
    description: l4(
      "Imprägnieren, flicken, Reissverschluss, Schimmel – Schritt für Schritt",
      "Imperméabiliser, réparer, fermeture éclair, moisissure – pas à pas",
      "Impermeabilizzare, riparare, cerniera, muffa – passo dopo passo",
      "Waterproofing, patching, zips, mould – step by step"
    ),
    icon: Wrench,
    group: "Erste Hilfe",
    offline: true,
  },
  {
    path: "/reparatur",
    title: l4(
      "Reparatur-Ratgeber",
      "Guide de réparation",
      "Guida alle riparazioni",
      "Repair guide"
    ),
    description: l4(
      "Matte flicken, Gestänge schienen, Kocher warten – am Platz und daheim",
      "Réparer le matelas, attelle sur un arceau, entretenir le réchaud – sur place et chez soi",
      "Riparare il materassino, steccare la bacchetta, curare il fornello – sul posto e a casa",
      "Patch the mat, splint a pole, service the stove – on site and at home"
    ),
    icon: Hammer,
    group: "Erste Hilfe",
    offline: true,
  },
  {
    path: "/sprachhilfe",
    title: l4(
      "Sprachhilfe",
      "Aide linguistique",
      "Aiuto linguistico",
      "Phrasebook"
    ),
    description: l4(
      "Camping-Sätze in vier Sprachen, zum Zeigen und Vorlesen",
      "Phrases de camping en quatre langues, à montrer et à écouter",
      "Frasi da campeggio in quattro lingue, da mostrare e ascoltare",
      "Camping phrases in four languages, to show and to hear"
    ),
    icon: Languages,
    group: "Erste Hilfe",
    offline: true,
  },
  {
    path: "/schatzsuche",
    title: l4(
      "GPS-Schatzsuche",
      "Chasse au trésor GPS",
      "Caccia al tesoro GPS",
      "GPS treasure hunt"
    ),
    description: l4(
      "Verstecke am Platz anlegen, Kinder suchen mit warm und kalt",
      "Cache des trésors sur place, les enfants cherchent au chaud-froid",
      "Nascondi tesori sul posto, i bambini cercano con caldo e freddo",
      "Hide caches on site, kids search by hot and cold"
    ),
    icon: Gem,
    group: "Erste Hilfe",
  },
  {
    path: "/erzaehlwuerfel",
    title: l4(
      "Erzählwürfel",
      "Dés à histoires",
      "Dadi delle storie",
      "Story dice"
    ),
    description: l4(
      "Symbole würfeln und daraus reihum eine Geschichte erfinden",
      "Lance les symboles et inventez une histoire à tour de rôle",
      "Tira i simboli e inventate a turno una storia",
      "Roll symbols and make up a story together"
    ),
    icon: Dices,
    group: "Erste Hilfe",
    offline: true,
  },
  {
    path: "/liederbuch",
    title: l4(
      "Lagerfeuer-Liederbuch",
      "Chansonnier du feu de camp",
      "Canzoniere del falò",
      "Campfire songbook"
    ),
    description: l4(
      "Texte und Akkorde, transponierbar und mit Rotlicht fürs Dunkel",
      "Textes et accords, transposables, avec mode lumière rouge",
      "Testi e accordi, trasponibili, con modalità luce rossa",
      "Lyrics and chords, transposable, with a red-light mode"
    ),
    icon: Music,
    group: "Erste Hilfe",
    offline: true,
  },
  {
    path: "/familie",
    title: l4(
      "Familien-Modus",
      "Mode famille",
      "Modalità famiglia",
      "Family mode"
    ),
    description: l4(
      "Kinder-Checklisten, Schnitzeljagden und Quiz",
      "Checklists pour enfants, chasses au trésor et quiz",
      "Checklist per bambini, cacce al tesoro e quiz",
      "Kids' checklists, scavenger hunts and quizzes"
    ),
    icon: Users,
    // Inhaltlich Wissen & Freizeit – der Gruppen-Schlüssel «Erste Hilfe»
    // bleibt aus historischen Gründen stabil (Anzeige-Label siehe groupLabels)
    group: "Erste Hilfe",
  },
];

export const groups = [
  "reise",
  "ausruestung",
  "vorOrt",
  "Sicherheit",
  "Energie & Wasser",
  "Erste Hilfe",
] as const;

/** Anzeige-Namen der Gruppen (die Gruppen-Schlüssel selbst bleiben stabil). */
export const groupLabels: Record<(typeof groups)[number], L4> = {
  reise: l4(
    "Reise planen",
    "Planifier le voyage",
    "Pianificare il viaggio",
    "Plan your trip"
  ),
  ausruestung: l4("Ausrüstung", "Équipement", "Attrezzatura", "Gear"),
  vorOrt: l4("Vor Ort", "Sur place", "Sul posto", "On site"),
  Sicherheit: l4("Sicherheit", "Sécurité", "Sicurezza", "Safety"),
  // Historischer Schlüssel «Erste Hilfe»: die Gruppe enthält längst Knoten,
  // Natur, Rezepte, Kühlbox, Einkauf und den Familien-Modus – der Schlüssel
  // bleibt stabil (gespeicherte Sortierungen sind pfad-basiert), nur das
  // Anzeige-Label ist verallgemeinert.
  "Erste Hilfe": l4(
    "Wissen & Familie",
    "Savoir & famille",
    "Sapere & famiglia",
    "Knowledge & family"
  ),
  "Energie & Wasser": l4(
    "Energie & Wasser",
    "Énergie & eau",
    "Energia e acqua",
    "Energy & water"
  ),
};
