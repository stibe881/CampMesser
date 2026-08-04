/**
 * Bestimmungsschlüssel für Bäume (#293): Frage für Frage zur Art.
 *
 * WARUM EIN SCHLÜSSEL UND KEINE LISTE: Im Natur-Lexikon stehen die neun
 * häufigsten Bäume mit Bild und Beschreibung – das nützt nur, wer den
 * Namen schon ahnt. Wer vor dem Baum steht und ihn NICHT kennt, blättert
 * neun Einträge durch und rät. Ein Schlüssel dreht das um: Er fragt nach
 * dem, was man sieht, und jede Antwort halbiert das Feld. Nach drei
 * Fragen steht die Art.
 *
 * DICHOTOM, ALSO IMMER ZWEI ANTWORTEN. Drei Wahlmöglichkeiten wären
 * schneller, aber ein Kind vor einem Baum vergleicht zuverlässig zwei
 * Dinge, nicht drei. Deshalb hat jede Frage genau zwei Antworten – und
 * jede fragt nach etwas, das man ANFASSEN oder ansehen kann, nie nach
 * Wuchshöhe oder Standort.
 *
 * JEDE ART BEKOMMT EINE GEGENPROBE. Der Schlüssel behauptet nichts, er
 * schlägt vor: Zum Ergebnis gehört ein zweites Merkmal, das passen muss,
 * und der Baum, mit dem man ihn am ehesten verwechselt. Ein Schlüssel
 * ohne Gegenprobe erzieht zum Raten.
 *
 * Die Arten-Ids sind dieselben wie im Natur-Lexikon
 * (`client/src/data/nature.ts`) – ein Test hält das zusammen.
 */
import { l4, type L4 } from "./i18n";

/** Bei dieser Frage fängt jeder Durchgang an. */
export const START_NODE = "start";

/**
 * Reissleine gegen Kreise: So viele Fragen darf ein Weg höchstens haben.
 * Wird sie erreicht, ist der Schlüssel falsch verdrahtet – ein Test
 * prüft das, statt die Seite hängen zu lassen.
 */
export const MAX_STEPS = 10;

export interface TreeAnswer {
  /** Was auf dem Knopf steht – kurz, damit es auf ein Handy passt. */
  label: L4;
  /** Eine Zeile mehr, für den Fall, dass die Antwort nicht eindeutig ist. */
  hint: L4;
  /** Weiterfrage – gesetzt, wenn diese Antwort noch nicht entscheidet. */
  next?: string;
  /** Ergebnis – gesetzt, wenn die Antwort die Art festlegt. */
  species?: string;
}

export interface TreeQuestion {
  id: string;
  /** Die Frage selbst. */
  question: L4;
  /** Was man dafür in die Hand nehmen oder anschauen soll. */
  look: L4;
  answers: TreeAnswer[];
}

export interface TreeSpecies {
  /** Gleiche Id wie im Natur-Lexikon. */
  id: string;
  name: L4;
  /** Wissenschaftlicher Name – sprachneutral. */
  latin: string;
  /** Das Merkmal, das die Art trägt. */
  mark: L4;
  /** Gegenprobe: etwas Zweites, das auch passen muss. */
  check: L4;
  /** Womit man sie verwechselt – und woran man den Unterschied sieht. */
  confusion: L4;
}

/**
 * Die Fragen. Reihenfolge im Array = Reihenfolge in der Übersicht auf der
 * Seite; für den Ablauf zählen nur die Verweise.
 */
export const TREE_QUESTIONS: TreeQuestion[] = [
  {
    id: "start",
    question: l4(
      "Nadeln oder Blätter?",
      "Aiguilles ou feuilles ?",
      "Aghi o foglie?",
      "Needles or leaves?"
    ),
    look: l4(
      "Schau auf einen Zweig, den du erreichst.",
      "Regarde un rameau que tu peux atteindre.",
      "Guarda un rametto che riesci a raggiungere.",
      "Look at a twig you can reach."
    ),
    answers: [
      {
        label: l4("Nadeln", "Aiguilles", "Aghi", "Needles"),
        hint: l4(
          "Schmal und spitz, meist das ganze Jahr grün.",
          "Étroites et pointues, vertes presque toute l'année.",
          "Stretti e appuntiti, verdi quasi tutto l'anno.",
          "Narrow and pointed, green most of the year."
        ),
        next: "nadeln",
      },
      {
        label: l4("Blätter", "Feuilles", "Foglie", "Leaves"),
        hint: l4(
          "Flach und breit, im Herbst fallen sie ab.",
          "Plates et larges, elles tombent en automne.",
          "Piatte e larghe, in autunno cadono.",
          "Flat and broad, they fall off in autumn."
        ),
        next: "blaetter",
      },
    ],
  },
  {
    id: "nadeln",
    question: l4(
      "Sitzen die Nadeln einzeln oder mehrere zusammen?",
      "Les aiguilles sont-elles isolées ou groupées ?",
      "Gli aghi sono singoli o riuniti in gruppi?",
      "Are the needles single or in bunches?"
    ),
    look: l4(
      "Verfolge eine Nadel bis dorthin, wo sie am Zweig ansetzt.",
      "Suis une aiguille jusqu'à son point d'attache sur le rameau.",
      "Segui un ago fino al punto in cui si attacca al rametto.",
      "Follow one needle down to where it joins the twig."
    ),
    answers: [
      {
        label: l4(
          "Mehrere aus einem Punkt",
          "Plusieurs au même point",
          "Più aghi dallo stesso punto",
          "Several from one point"
        ),
        hint: l4(
          "Wie ein Pinsel oder wie ein Paar.",
          "Comme un pinceau ou comme une paire.",
          "Come un pennello o come una coppia.",
          "Like a brush, or like a pair."
        ),
        next: "nadelbuendel",
      },
      {
        label: l4(
          "Jede Nadel für sich",
          "Chaque aiguille séparément",
          "Ogni ago per conto suo",
          "Each needle on its own"
        ),
        hint: l4(
          "Die Nadeln stehen einzeln dem Zweig entlang.",
          "Les aiguilles sont insérées une à une le long du rameau.",
          "Gli aghi sono inseriti uno a uno lungo il rametto.",
          "The needles sit one by one along the twig."
        ),
        next: "nadeleinzeln",
      },
    ],
  },
  {
    id: "nadelbuendel",
    question: l4(
      "Wie viele Nadeln stecken zusammen?",
      "Combien d'aiguilles sont réunies ?",
      "Quanti aghi stanno insieme?",
      "How many needles are bundled together?"
    ),
    look: l4(
      "Zähl an einem einzigen Büschel nach.",
      "Compte-les sur un seul faisceau.",
      "Contali su un solo ciuffo.",
      "Count them on a single bundle."
    ),
    answers: [
      {
        label: l4(
          "Viele, weich wie ein Pinsel",
          "Beaucoup, souples comme un pinceau",
          "Molti, morbidi come un pennello",
          "Many, soft like a brush"
        ),
        hint: l4(
          "Zwanzig und mehr, hellgrün und weich.",
          "Vingt et plus, vert clair et souples.",
          "Venti e più, verde chiaro e morbidi.",
          "Twenty or more, light green and soft."
        ),
        species: "laerche",
      },
      {
        label: l4(
          "Genau zwei, lang und steif",
          "Exactement deux, longues et rigides",
          "Esattamente due, lunghi e rigidi",
          "Exactly two, long and stiff"
        ),
        hint: l4(
          "Ein Paar in einer braunen Hülle, oft leicht gedreht.",
          "Une paire dans une gaine brune, souvent un peu tordues.",
          "Una coppia in una guaina bruna, spesso un po' ritorti.",
          "A pair in a brown sheath, often slightly twisted."
        ),
        species: "waldfoehre",
      },
    ],
  },
  {
    id: "nadeleinzeln",
    question: l4(
      "Piksen die Nadeln?",
      "Les aiguilles piquent-elles ?",
      "Gli aghi pungono?",
      "Do the needles prick?"
    ),
    look: l4(
      "Streich vorsichtig mit der flachen Hand über den Zweig.",
      "Passe doucement la paume de la main sur le rameau.",
      "Passa delicatamente il palmo della mano sul rametto.",
      "Gently run your flat hand along the twig."
    ),
    answers: [
      {
        label: l4(
          "Ja, sie stechen",
          "Oui, elles piquent",
          "Sì, pungono",
          "Yes, they prick"
        ),
        hint: l4(
          "Die Nadel lässt sich zwischen den Fingern rollen – sie ist rund.",
          "L'aiguille roule entre les doigts – elle est ronde.",
          "L'ago rotola tra le dita – è tondo.",
          "The needle rolls between your fingers – it is round."
        ),
        species: "fichte",
      },
      {
        label: l4(
          "Nein, sie sind weich",
          "Non, elles sont souples",
          "No, sono morbidi",
          "No, they are soft"
        ),
        hint: l4(
          "Flach, vorne eingekerbt, unten zwei weisse Streifen.",
          "Plates, échancrées au bout, deux bandes blanches dessous.",
          "Piatti, incavati in punta, due strisce bianche sotto.",
          "Flat, notched at the tip, two white stripes underneath."
        ),
        species: "tanne",
      },
    ],
  },
  {
    id: "blaetter",
    question: l4(
      "Ein ganzes Blatt oder viele kleine an einem Stiel?",
      "Une feuille entière ou beaucoup de petites sur une tige ?",
      "Una foglia intera o tante piccole su un picciolo?",
      "One whole leaf or many small ones on one stalk?"
    ),
    look: l4(
      "Zupf ein Blatt ab und schau, wo es aufhört.",
      "Cueille une feuille et regarde où elle s'arrête.",
      "Stacca una foglia e guarda dove finisce.",
      "Pick one leaf and see where it ends."
    ),
    answers: [
      {
        label: l4(
          "Viele kleine Blättchen",
          "Beaucoup de petites folioles",
          "Tante piccole foglioline",
          "Many small leaflets"
        ),
        hint: l4(
          "Neun bis neunzehn Blättchen paarweise an einem Stiel.",
          "Neuf à dix-neuf folioles par paires sur une tige.",
          "Da nove a diciannove foglioline appaiate su un picciolo.",
          "Nine to nineteen leaflets in pairs on one stalk."
        ),
        species: "vogelbeere",
      },
      {
        label: l4(
          "Ein einzelnes Blatt",
          "Une seule feuille",
          "Una sola foglia",
          "A single leaf"
        ),
        hint: l4(
          "Eine Fläche, ein Stiel.",
          "Une surface, une tige.",
          "Una lamina, un picciolo.",
          "One blade, one stalk."
        ),
        next: "blattform",
      },
    ],
  },
  {
    id: "blattform",
    question: l4(
      "Hat das Blatt tiefe Buchten?",
      "La feuille a-t-elle des découpes profondes ?",
      "La foglia ha insenature profonde?",
      "Does the leaf have deep bays?"
    ),
    look: l4(
      "Leg das Blatt flach auf die Hand und schau den Rand an.",
      "Pose la feuille à plat sur la main et regarde le bord.",
      "Appoggia la foglia sul palmo e osserva il bordo.",
      "Lay the leaf flat on your hand and look at the edge."
    ),
    answers: [
      {
        label: l4(
          "Ja, deutliche Lappen",
          "Oui, des lobes nets",
          "Sì, lobi evidenti",
          "Yes, clear lobes"
        ),
        hint: l4(
          "Der Rand geht tief hinein und wieder heraus.",
          "Le bord rentre profondément puis ressort.",
          "Il bordo rientra in profondità e poi riesce.",
          "The edge cuts deep in and out again."
        ),
        next: "gelappt",
      },
      {
        label: l4(
          "Nein, der Rand bleibt geschlossen",
          "Non, le bord reste continu",
          "No, il bordo resta continuo",
          "No, the edge stays closed"
        ),
        hint: l4(
          "Höchstens gezähnt oder wellig, aber ohne Buchten.",
          "Tout au plus denté ou ondulé, mais sans découpes.",
          "Al massimo dentato o ondulato, ma senza insenature.",
          "Toothed or wavy at most, but without bays."
        ),
        next: "ungelappt",
      },
    ],
  },
  {
    id: "gelappt",
    question: l4(
      "Sind die Lappen rund oder spitz?",
      "Les lobes sont-ils arrondis ou pointus ?",
      "I lobi sono arrotondati o appuntiti?",
      "Are the lobes rounded or pointed?"
    ),
    look: l4(
      "Fahr mit dem Finger dem Rand entlang.",
      "Suis le bord avec le doigt.",
      "Segui il bordo con il dito.",
      "Trace the edge with your finger."
    ),
    answers: [
      {
        label: l4(
          "Rund, wie Wellen",
          "Arrondis, comme des vagues",
          "Arrotondati, come onde",
          "Rounded, like waves"
        ),
        hint: l4(
          "Das Blatt ist länger als breit, der Stiel sehr kurz.",
          "La feuille est plus longue que large, la tige très courte.",
          "La foglia è più lunga che larga, il picciolo cortissimo.",
          "The leaf is longer than wide, the stalk very short."
        ),
        species: "eiche",
      },
      {
        label: l4(
          "Spitz, wie eine Hand",
          "Pointus, comme une main",
          "Appuntiti, come una mano",
          "Pointed, like a hand"
        ),
        hint: l4(
          "Fünf Zipfel, das Blatt ist so breit wie lang.",
          "Cinq pointes, la feuille est aussi large que longue.",
          "Cinque punte, la foglia è larga quanto lunga.",
          "Five tips, the leaf as wide as it is long."
        ),
        species: "bergahorn",
      },
    ],
  },
  {
    id: "ungelappt",
    question: l4(
      "Wie sieht die Rinde am Stamm aus?",
      "À quoi ressemble l'écorce du tronc ?",
      "Com'è la corteccia del tronco?",
      "What does the bark on the trunk look like?"
    ),
    look: l4(
      "Tritt einen Schritt zurück und schau den Stamm an.",
      "Recule d'un pas et regarde le tronc.",
      "Fai un passo indietro e guarda il tronco.",
      "Step back and look at the trunk."
    ),
    answers: [
      {
        label: l4(
          "Weiss mit schwarzen Rissen",
          "Blanche avec des fissures noires",
          "Bianca con fessure nere",
          "White with black cracks"
        ),
        hint: l4(
          "Sie schält sich in dünnen Streifen ab; das Blatt ist dreieckig.",
          "Elle se détache en fines lanières ; la feuille est triangulaire.",
          "Si sfoglia in strisce sottili; la foglia è triangolare.",
          "It peels off in thin strips; the leaf is triangular."
        ),
        species: "birke",
      },
      {
        label: l4(
          "Glatt und silbergrau",
          "Lisse et gris argenté",
          "Liscia e grigio argento",
          "Smooth and silver-grey"
        ),
        hint: l4(
          "Wie Elefantenhaut; das Blatt ist oval mit welligem Rand.",
          "Comme la peau d'un éléphant ; la feuille est ovale au bord ondulé.",
          "Come pelle d'elefante; la foglia è ovale con bordo ondulato.",
          "Like elephant skin; the leaf is oval with a wavy edge."
        ),
        species: "buche",
      },
    ],
  },
];

/**
 * Die Arten. Namen und wissenschaftliche Namen sind dieselben wie im
 * Natur-Lexikon – wer den Schlüssel durchgeht, findet dort Bild und
 * Geschichte dazu.
 */
export const TREE_SPECIES: TreeSpecies[] = [
  {
    id: "fichte",
    name: l4("Fichte", "Épicéa commun", "Abete rosso", "Norway spruce"),
    latin: "Picea abies",
    mark: l4(
      "Spitze Nadeln rundum am Zweig – sie lassen sich zwischen den Fingern rollen.",
      "Aiguilles pointues tout autour du rameau – elles roulent entre les doigts.",
      "Aghi appuntiti tutt'attorno al rametto – rotolano tra le dita.",
      "Sharp needles all around the twig – they roll between your fingers."
    ),
    check: l4(
      "Unter dem Baum liegen ganze Zapfen: Fichtenzapfen hängen und fallen im Stück herunter.",
      "Sous l'arbre gisent des cônes entiers : ceux de l'épicéa pendent et tombent d'une pièce.",
      "Sotto l'albero ci sono pigne intere: quelle dell'abete rosso pendono e cadono intere.",
      "Whole cones lie under the tree: spruce cones hang and drop in one piece."
    ),
    confusion: l4(
      "Weisstanne. Merkspruch: «Die Fichte sticht, die Tanne nicht.»",
      "Sapin blanc. Moyen mnémotechnique : «L'épicéa pique, le sapin non.»",
      "Abete bianco. Regola mnemonica: «L'abete rosso punge, l'abete bianco no.»",
      "Silver fir. Memory aid: 'The spruce pricks, the fir does not.'"
    ),
  },
  {
    id: "tanne",
    name: l4("Weisstanne", "Sapin blanc", "Abete bianco", "Silver fir"),
    latin: "Abies alba",
    mark: l4(
      "Weiche, flache Nadeln mit zwei weissen Streifen auf der Unterseite.",
      "Aiguilles souples et plates avec deux bandes blanches dessous.",
      "Aghi morbidi e piatti con due strisce bianche sul lato inferiore.",
      "Soft, flat needles with two white stripes underneath."
    ),
    check: l4(
      "Am Boden liegt kein einziger Zapfen – Tannenzapfen zerfallen oben am Ast.",
      "Aucun cône au sol – ceux du sapin se désagrègent en haut, sur la branche.",
      "Nessuna pigna a terra – quelle dell'abete bianco si sfaldano in alto sul ramo.",
      "Not a single cone on the ground – fir cones fall apart up on the branch."
    ),
    confusion: l4(
      "Fichte. Dreh eine Nadel um: Ohne die zwei weissen Streifen ist es eine Fichte.",
      "Épicéa. Retourne une aiguille : sans les deux bandes blanches, c'est un épicéa.",
      "Abete rosso. Gira un ago: senza le due strisce bianche è un abete rosso.",
      "Norway spruce. Turn a needle over: without the two white stripes it is a spruce."
    ),
  },
  {
    id: "waldfoehre",
    name: l4("Waldföhre", "Pin sylvestre", "Pino silvestre", "Scots pine"),
    latin: "Pinus sylvestris",
    mark: l4(
      "Immer genau zwei lange, leicht gedrehte Nadeln in einer braunen Hülle.",
      "Toujours exactement deux longues aiguilles un peu tordues dans une gaine brune.",
      "Sempre esattamente due aghi lunghi e un po' ritorti in una guaina bruna.",
      "Always exactly two long, slightly twisted needles in a brown sheath."
    ),
    check: l4(
      "Der obere Stamm leuchtet orange-rot – daran erkennst du sie schon von weitem.",
      "Le haut du tronc est orange-rouge – tu la reconnais de loin à cela.",
      "La parte alta del tronco è rosso-arancio – la riconosci già da lontano.",
      "The upper trunk glows orange-red – you can spot it from far away."
    ),
    confusion: l4(
      "Lärche. Die Lärche hat viele weiche Nadeln im Büschel, die Föhre genau zwei.",
      "Mélèze. Le mélèze porte de nombreuses aiguilles souples en faisceau, le pin exactement deux.",
      "Larice. Il larice ha molti aghi morbidi a ciuffo, il pino esattamente due.",
      "Larch. The larch has many soft needles per bundle, the pine exactly two."
    ),
  },
  {
    id: "laerche",
    name: l4("Lärche", "Mélèze d'Europe", "Larice", "European larch"),
    latin: "Larix decidua",
    mark: l4(
      "Zwanzig und mehr weiche, hellgrüne Nadeln aus einem Punkt, wie ein Pinsel.",
      "Vingt aiguilles et plus, souples et vert clair, en pinceau depuis un même point.",
      "Venti e più aghi morbidi e verde chiaro dallo stesso punto, come un pennello.",
      "Twenty or more soft, light-green needles from one point, like a brush."
    ),
    check: l4(
      "Im Herbst wird sie golden und steht im Winter kahl da – als einziger Nadelbaum bei uns.",
      "En automne elle devient dorée et reste nue en hiver – seul conifère de chez nous à le faire.",
      "In autunno diventa dorata e in inverno resta spoglia – unica conifera da noi.",
      "In autumn it turns golden and stands bare in winter – our only conifer that does."
    ),
    confusion: l4(
      "Waldföhre. Zähl die Nadeln im Büschel: zwei heisst Föhre.",
      "Pin sylvestre. Compte les aiguilles du faisceau : deux, c'est le pin.",
      "Pino silvestre. Conta gli aghi del ciuffo: due significa pino.",
      "Scots pine. Count the needles per bundle: two means pine."
    ),
  },
  {
    id: "vogelbeere",
    name: l4(
      "Vogelbeere",
      "Sorbier des oiseleurs",
      "Sorbo degli uccellatori",
      "Rowan"
    ),
    latin: "Sorbus aucuparia",
    mark: l4(
      "Ein Stiel trägt neun bis neunzehn kleine, gezähnte Blättchen.",
      "Une tige porte neuf à dix-neuf petites folioles dentées.",
      "Un picciolo porta da nove a diciannove foglioline dentate.",
      "One stalk carries nine to nineteen small, toothed leaflets."
    ),
    check: l4(
      "Ab August hängen orange-rote Beeren in dichten Dolden.",
      "Dès août, des baies rouge orangé pendent en corymbes serrés.",
      "Da agosto pendono bacche rosso-arancio in corimbi fitti.",
      "From August, orange-red berries hang in dense clusters."
    ),
    confusion: l4(
      "Esche. Deren Blättchen sind grösser und die Knospen tiefschwarz.",
      "Frêne. Ses folioles sont plus grandes et ses bourgeons d'un noir profond.",
      "Frassino. Le sue foglioline sono più grandi e le gemme nero intenso.",
      "Ash. Its leaflets are larger and its buds are deep black."
    ),
  },
  {
    id: "eiche",
    name: l4("Stieleiche", "Chêne pédonculé", "Farnia", "English oak"),
    latin: "Quercus robur",
    mark: l4(
      "Rund gebuchtetes Blatt, länger als breit, und ein sehr kurzer Stiel.",
      "Feuille aux lobes arrondis, plus longue que large, à tige très courte.",
      "Foglia con lobi arrotondati, più lunga che larga, con picciolo cortissimo.",
      "Rounded, lobed leaf, longer than wide, on a very short stalk."
    ),
    check: l4(
      "Im Herbst liegen Eicheln am Boden – bei der Stieleiche an einem langen Stiel.",
      "En automne, des glands jonchent le sol – chez le chêne pédonculé sur un long pédoncule.",
      "In autunno le ghiande sono a terra – nella farnia su un lungo peduncolo.",
      "In autumn acorns lie on the ground – on a long stalk in the English oak."
    ),
    confusion: l4(
      "Traubeneiche. Bei ihr sitzen die Eicheln fast ohne Stiel am Zweig, das Blatt hat einen langen.",
      "Chêne sessile. Chez lui les glands sont presque sans pédoncule et la feuille en a un long.",
      "Rovere. In esso le ghiande sono quasi senza peduncolo e la foglia ne ha uno lungo.",
      "Sessile oak. Its acorns sit almost stalkless on the twig, while the leaf has a long stalk."
    ),
  },
  {
    id: "bergahorn",
    name: l4(
      "Bergahorn",
      "Érable sycomore",
      "Acero di monte",
      "Sycamore maple"
    ),
    latin: "Acer pseudoplatanus",
    mark: l4(
      "Handförmiges Blatt mit fünf spitzen Lappen, so breit wie lang.",
      "Feuille palmée à cinq lobes pointus, aussi large que longue.",
      "Foglia palmata con cinque lobi appuntiti, larga quanto lunga.",
      "Hand-shaped leaf with five pointed lobes, as wide as it is long."
    ),
    check: l4(
      "Die Blätter stehen sich paarweise gegenüber, und im Herbst drehen sich die Flügelnüsschen herunter.",
      "Les feuilles sont opposées par paires et en automne les samares descendent en tournant.",
      "Le foglie sono opposte a coppie e in autunno le samare scendono ruotando.",
      "The leaves sit in opposite pairs, and in autumn the winged seeds spin down."
    ),
    confusion: l4(
      "Spitzahorn. Bricht man dessen Blattstiel ab, tritt weisser Milchsaft aus.",
      "Érable plane. Si l'on casse sa tige, un latex blanc s'en écoule.",
      "Acero riccio. Spezzando il suo picciolo esce un lattice bianco.",
      "Norway maple. Snap its leaf stalk and white milky sap comes out."
    ),
  },
  {
    id: "birke",
    name: l4(
      "Hängebirke",
      "Bouleau verruqueux",
      "Betulla bianca",
      "Silver birch"
    ),
    latin: "Betula pendula",
    mark: l4(
      "Weisse Rinde mit schwarzen Rissen, die sich in dünnen Streifen abschält.",
      "Écorce blanche à fissures noires, qui se détache en fines lanières.",
      "Corteccia bianca con fessure nere, che si sfoglia in strisce sottili.",
      "White bark with black cracks that peels off in thin strips."
    ),
    check: l4(
      "Das Blatt ist dreieckig und doppelt gezähnt, die dünnen Zweige hängen herab.",
      "La feuille est triangulaire et doublement dentée, les rameaux fins retombent.",
      "La foglia è triangolare e doppiamente dentata, i rametti sottili pendono.",
      "The leaf is triangular and doubly toothed, the thin twigs hang down."
    ),
    confusion: l4(
      "Moorbirke. Ihre Zweige hängen nicht und sind fein behaart.",
      "Bouleau pubescent. Ses rameaux ne retombent pas et sont finement velus.",
      "Betulla pubescente. I suoi rametti non pendono e sono finemente pelosi.",
      "Downy birch. Its twigs do not droop and are finely hairy."
    ),
  },
  {
    id: "buche",
    name: l4("Rotbuche", "Hêtre commun", "Faggio", "Common beech"),
    latin: "Fagus sylvatica",
    mark: l4(
      "Glatte, silbergraue Rinde und ein ovales Blatt mit welligem Rand.",
      "Écorce lisse gris argenté et feuille ovale au bord ondulé.",
      "Corteccia liscia grigio argento e foglia ovale con bordo ondulato.",
      "Smooth, silver-grey bark and an oval leaf with a wavy edge."
    ),
    check: l4(
      "Am Boden liegen stachelige Hüllen mit dreikantigen Bucheckern darin.",
      "Au sol gisent des cupules épineuses contenant des faînes à trois côtés.",
      "A terra ci sono cupole spinose con dentro faggiole a tre spigoli.",
      "Spiky husks lie on the ground with three-sided beechnuts inside."
    ),
    confusion: l4(
      "Hainbuche. Deren Blatt ist scharf gesägt und der Stamm hat Längswülste wie Muskeln.",
      "Charme. Sa feuille est nettement dentée en scie et son tronc est cannelé comme des muscles.",
      "Carpino bianco. La sua foglia è seghettata e il tronco è scanalato come muscoli.",
      "Hornbeam. Its leaf is sharply saw-toothed and its trunk is ridged like muscles."
    ),
  },
];

/** Eine Frage nachschlagen – null, wenn es sie nicht gibt. */
export function treeQuestion(id: string): TreeQuestion | null {
  return TREE_QUESTIONS.find(question => question.id === id) ?? null;
}

/** Eine Art nachschlagen – null, wenn es sie nicht gibt. */
export function treeSpecies(id: string): TreeSpecies | null {
  return TREE_SPECIES.find(species => species.id === id) ?? null;
}

/** Eine beantwortete Frage auf dem Weg zum Ergebnis. */
export interface TreeStep {
  question: TreeQuestion;
  answer: TreeAnswer;
  /** Welche Antwort es war – für den Zurück-Knopf. */
  index: number;
}

export interface TreeWalk {
  /** Was bisher beantwortet wurde, in der Reihenfolge der Fragen. */
  trail: TreeStep[];
  /** Die Frage, die jetzt dran ist – null, sobald die Art feststeht. */
  current: TreeQuestion | null;
  /** Das Ergebnis – null, solange noch gefragt wird. */
  species: TreeSpecies | null;
}

/**
 * Den Schlüssel entlanggehen.
 *
 * Der Zustand der Seite ist damit eine simple Liste von Antwort-Nummern:
 * eine Antwort anhängen heisst weiter, die letzte wegnehmen heisst
 * zurück. Ungültige Nummern brechen den Weg an dieser Stelle ab, statt
 * die Seite umzuwerfen – ein alter Link darf nichts kaputtmachen.
 */
export function walkTreeKey(answers: readonly number[]): TreeWalk {
  const trail: TreeStep[] = [];
  let current = treeQuestion(START_NODE);
  let species: TreeSpecies | null = null;

  for (let i = 0; i < answers.length; i++) {
    if (!current) break;
    const answer = current.answers[answers[i]];
    if (!answer) break;
    trail.push({ question: current, answer, index: answers[i] });
    if (answer.species) {
      species = treeSpecies(answer.species);
      current = null;
      break;
    }
    current = answer.next ? treeQuestion(answer.next) : null;
  }

  return { trail, current, species };
}

/** Ein vollständiger Weg durch den Schlüssel. */
export interface TreePath {
  /** Die Antwort-Nummern, die zu dieser Art führen. */
  answers: number[];
  species: TreeSpecies;
}

/**
 * Alle Wege aufzählen. Dient dem Test: Jeder Weg muss bei einer Art
 * enden, jede Art muss vorkommen, und keiner darf sich im Kreis drehen.
 */
export function treeKeyPaths(): TreePath[] {
  const paths: TreePath[] = [];

  const walk = (nodeId: string, answers: number[]) => {
    if (answers.length >= MAX_STEPS) return;
    const question = treeQuestion(nodeId);
    if (!question) return;
    question.answers.forEach((answer, index) => {
      const taken = answers.concat(index);
      if (answer.species) {
        const species = treeSpecies(answer.species);
        if (species) paths.push({ answers: taken, species });
        return;
      }
      if (answer.next) walk(answer.next, taken);
    });
  };

  walk(START_NODE, []);
  return paths;
}
