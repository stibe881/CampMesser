/**
 * Grill- & Garzeiten-Ratgeber (#502): Kerntemperaturen und Faustregeln
 * fürs Grillieren – offline, denn am Grill steht man selten mit Empfang.
 * Richtwerte nach gängiger Küchenpraxis (BLV-Empfehlung: Geflügel und
 * Hackfleisch immer durchgaren); ein Kernthermometer schlägt jede Regel.
 */
import { l4, type L4 } from "@shared/i18n";

export interface GrillEntry {
  id: string;
  title: L4;
  text: L4;
}

/** Kerntemperaturen – die Zahl, die man am Grill nachschlägt. */
export const coreTemperatures: GrillEntry[] = [
  {
    id: "rind",
    title: l4(
      "Rind (Steak)",
      "Bœuf (steak)",
      "Manzo (bistecca)",
      "Beef (steak)"
    ),
    text: l4(
      "Saignant 50–52 °C, medium 55–58 °C, durch ab 65 °C. Vor dem Anschneiden 3–5 Minuten ruhen lassen.",
      "Saignant 50–52 °C, à point 55–58 °C, bien cuit dès 65 °C. Laisser reposer 3–5 minutes avant de couper.",
      "Al sangue 50–52 °C, media 55–58 °C, ben cotta da 65 °C. Far riposare 3–5 minuti prima di tagliare.",
      "Rare 50–52 °C, medium 55–58 °C, well done from 65 °C. Rest 3–5 minutes before slicing."
    ),
  },
  {
    id: "schwein",
    title: l4("Schwein", "Porc", "Maiale", "Pork"),
    text: l4(
      "Kotelett und Nierstück 62–68 °C – leicht rosa ist heute in Ordnung. Geschnetzeltes und Spiessli durchgaren.",
      "Côtelette et filet 62–68 °C – légèrement rosé est acceptable aujourd'hui. Émincé et brochettes bien cuits.",
      "Costoletta e lombo 62–68 °C – leggermente rosato oggi va bene. Sminuzzato e spiedini ben cotti.",
      "Chops and loin 62–68 °C – slightly pink is fine nowadays. Cook strips and skewers through."
    ),
  },
  {
    id: "poulet",
    title: l4(
      "Poulet & Geflügel",
      "Poulet & volaille",
      "Pollo & pollame",
      "Chicken & poultry"
    ),
    text: l4(
      "IMMER durchgaren: 72 °C und mehr im Kern, Saft läuft klar. Keine Ausnahme – Salmonellen verzeihen nicht.",
      "TOUJOURS bien cuire : 72 °C et plus à cœur, le jus est clair. Aucune exception – les salmonelles ne pardonnent pas.",
      "SEMPRE ben cotto: 72 °C e più al cuore, il succo esce chiaro. Nessuna eccezione – la salmonella non perdona.",
      "ALWAYS cook through: 72 °C or more at the core, juices run clear. No exception – salmonella does not forgive."
    ),
  },
  {
    id: "hack",
    title: l4(
      "Hamburger & Hackfleisch",
      "Burgers & viande hachée",
      "Hamburger & carne macinata",
      "Burgers & minced meat"
    ),
    text: l4(
      "Durchgaren (70 °C+): Beim Hacken verteilen sich Keime durchs ganze Fleisch – «medium» gilt nur fürs ganze Stück.",
      "Bien cuire (70 °C+) : le hachage répand les germes dans toute la viande – «à point» ne vaut que pour la pièce entière.",
      "Ben cotto (70 °C+): macinando, i germi si distribuiscono in tutta la carne – «media» vale solo per il pezzo intero.",
      "Cook through (70 °C+): mincing spreads germs through the meat – “medium” only applies to whole cuts."
    ),
  },
  {
    id: "fisch",
    title: l4("Fisch", "Poisson", "Pesce", "Fish"),
    text: l4(
      "58–60 °C – das Fleisch wird gerade glasig-fest und löst sich in Flocken. In der Folie oder auf der Planke reisst nichts an.",
      "58–60 °C – la chair devient juste nacrée et se détache en flocons. En papillote ou sur planche, rien n'attache.",
      "58–60 °C – la carne diventa appena opaca e si sfalda. Al cartoccio o su tavoletta non si attacca nulla.",
      "58–60 °C – the flesh turns just opaque and flakes. In foil or on a plank nothing sticks or tears."
    ),
  },
  {
    id: "wurst",
    title: l4(
      "Cervelat & Würste",
      "Cervelas & saucisses",
      "Cervelat & salsicce",
      "Cervelat & sausages"
    ),
    text: l4(
      "Brühwürste sind vorgegart – sie brauchen nur Hitze und Farbe. Rohbratwürste dagegen durchgaren (69 °C+).",
      "Les saucisses échaudées sont précuites – il ne leur faut que chaleur et couleur. Les saucisses crues, bien les cuire (69 °C+).",
      "Le salsicce scottate sono precotte – servono solo calore e colore. Le salsicce crude vanno ben cotte (69 °C+).",
      "Scalded sausages are pre-cooked – they only need heat and colour. Raw sausages must be cooked through (69 °C+)."
    ),
  },
];

/** Faustregeln, die den Unterschied machen. */
export const grillTips: GrillEntry[] = [
  {
    id: "glut",
    title: l4(
      "Glut statt Flamme",
      "Braise plutôt que flamme",
      "Brace invece di fiamma",
      "Embers, not flames"
    ),
    text: l4(
      "Grilliert wird über Glut mit weisser Ascheschicht, nie über offener Flamme – die verbrennt aussen und lässt innen roh.",
      "On grille sur la braise couverte de cendre blanche, jamais sur flamme vive – elle brûle l'extérieur et laisse l'intérieur cru.",
      "Si griglia sulla brace coperta di cenere bianca, mai sulla fiamma viva – brucia fuori e lascia crudo dentro.",
      "Grill over embers with a white ash layer, never over open flames – they char the outside and leave the inside raw."
    ),
  },
  {
    id: "handprobe",
    title: l4(
      "Hitze ohne Thermometer schätzen",
      "Estimer la chaleur sans thermomètre",
      "Stimare il calore senza termometro",
      "Judging heat without a thermometer"
    ),
    text: l4(
      "Handprobe eine Handbreit über dem Rost: 2–3 Sekunden aushaltbar = starke Hitze, 4–5 = mittel, 6+ = mild.",
      "Test de la main à une largeur de main au-dessus de la grille : tenable 2–3 secondes = feu vif, 4–5 = moyen, 6+ = doux.",
      "Prova della mano a un palmo sopra la griglia: sopportabile 2–3 secondi = calore forte, 4–5 = medio, 6+ = dolce.",
      "Hand test one hand's width above the grate: bearable for 2–3 seconds = high heat, 4–5 = medium, 6+ = low."
    ),
  },
  {
    id: "zonen",
    title: l4(
      "Zwei Zonen einrichten",
      "Aménager deux zones",
      "Creare due zone",
      "Set up two zones"
    ),
    text: l4(
      "Glut auf eine Seite schieben: heisse Seite zum Anbraten, kühle Seite zum Fertigziehen und Parkieren – nichts verbrennt.",
      "Pousser la braise d'un côté : côté chaud pour saisir, côté doux pour finir la cuisson et attendre – rien ne brûle.",
      "Spingere la brace da un lato: lato caldo per rosolare, lato dolce per finire la cottura e attendere – niente brucia.",
      "Push the embers to one side: hot side for searing, cool side for finishing and holding – nothing burns."
    ),
  },
  {
    id: "ruhe",
    title: l4(
      "Fleisch ruhen lassen",
      "Laisser reposer la viande",
      "Far riposare la carne",
      "Rest the meat"
    ),
    text: l4(
      "Nach dem Grillieren 3–5 Minuten zugedeckt ruhen lassen – der Saft verteilt sich, statt auf den Teller zu laufen.",
      "Après la cuisson, laisser reposer 3–5 minutes à couvert – le jus se répartit au lieu de couler dans l'assiette.",
      "Dopo la cottura, far riposare coperto 3–5 minuti – i succhi si ridistribuiscono invece di finire nel piatto.",
      "After grilling, rest covered for 3–5 minutes – the juices redistribute instead of running onto the plate."
    ),
  },
  {
    id: "gemuese",
    title: l4(
      "Gemüse & Beilagen",
      "Légumes & accompagnements",
      "Verdure & contorni",
      "Vegetables & sides"
    ),
    text: l4(
      "Peperoni, Zucchetti, Maiskolben direkt auf den Rost (10–15 min, wenden); Kartoffeln vorgekocht oder in der Folie in die Glut (30–40 min).",
      "Poivrons, courgettes, épis de maïs directement sur la grille (10–15 min, retourner) ; pommes de terre précuites ou en papillote dans la braise (30–40 min).",
      "Peperoni, zucchine, pannocchie direttamente sulla griglia (10–15 min, girare); patate precotte o al cartoccio nella brace (30–40 min).",
      "Peppers, courgettes and corn cobs straight on the grate (10–15 min, turn); potatoes par-boiled or foil-wrapped in the embers (30–40 min)."
    ),
  },
  {
    id: "hygiene",
    title: l4(
      "Zwei Teller, zwei Zangen",
      "Deux assiettes, deux pinces",
      "Due piatti, due pinze",
      "Two plates, two tongs"
    ),
    text: l4(
      "Rohes und Grilliertes nie über denselben Teller oder dieselbe Zange führen – Marinade vom rohen Fleisch gehört nicht ans fertige.",
      "Ne jamais faire passer cru et grillé par la même assiette ou pince – la marinade de viande crue n'a rien à faire sur le cuit.",
      "Mai far passare crudo e grigliato dallo stesso piatto o dalla stessa pinza – la marinata della carne cruda non va sul cotto.",
      "Never use the same plate or tongs for raw and cooked – marinade from raw meat has no place on the finished food."
    ),
  },
];
