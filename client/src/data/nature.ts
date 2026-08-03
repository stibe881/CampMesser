/**
 * Natur-Entdecker-Lexikon – offline, kindgerecht aufbereitet.
 * Alle Anzeigetexte liegen als L4 (de/fr/it/en) vor; Arten-Namen verwenden
 * die etablierten Trivialnamen der jeweiligen Sprache, wissenschaftliche
 * Namen bleiben unverändert (sprachneutrale Strings).
 */
import { l4, type L4 } from "@shared/i18n";
import type { Season } from "@shared/season";
import img_natur_reh from "@/assets/natur-reh.webp";
import img_natur_fuchs from "@/assets/natur-fuchs.webp";
import img_natur_wildschwein from "@/assets/natur-wildschwein.webp";
import img_natur_eichhoernchen from "@/assets/natur-eichhoernchen.webp";
import img_natur_dachs from "@/assets/natur-dachs.webp";
import img_natur_grosser_wagen from "@/assets/natur-grosser-wagen.webp";
import img_natur_polarstern from "@/assets/natur-polarstern.webp";
import img_natur_kassiopeia from "@/assets/natur-kassiopeia.webp";
import img_natur_orion from "@/assets/natur-orion.webp";
import img_natur_sommerdreieck from "@/assets/natur-sommerdreieck.webp";
import img_natur_fichte from "@/assets/natur-fichte.webp";
import img_natur_tanne from "@/assets/natur-tanne.webp";
import img_natur_buche from "@/assets/natur-buche.webp";
import img_natur_eiche from "@/assets/natur-eiche.webp";
import img_natur_birke from "@/assets/natur-birke.webp";
import img_natur_laerche from "@/assets/natur-laerche.webp";

export type NatureCategoryId = "tierspuren" | "sternbilder" | "baeume";

export interface NatureEntry {
  id: string;
  name: L4;
  /** Wissenschaftlicher Name (string, sprachneutral) oder übersetzter Zusatz (L4). */
  latinOrExtra?: L4 | string;
  category: NatureCategoryId;
  description: L4;
  funFact: L4;
  kidQuestion: L4;
  features: L4[];
  image?: string;
  /**
   * Beste Beobachtungs-Monate (inklusive, wrap-around erlaubt) –
   * fehlt das Feld, ist der Eintrag ganzjährig zu sehen.
   */
  season?: Season;
}

export interface NatureCategory {
  id: NatureCategoryId;
  label: L4;
  icon: string;
  intro: L4;
}

export const natureCategories: NatureCategory[] = [
  {
    id: "tierspuren",
    label: l4(
      "Tierspuren",
      "Traces d'animaux",
      "Tracce di animali",
      "Animal tracks"
    ),
    icon: "PawPrint",
    intro: l4(
      "Wer war hier unterwegs? Spuren im Schlamm oder Schnee verraten es.",
      "Qui est passé par ici ? Les traces dans la boue ou la neige le révèlent.",
      "Chi è passato di qui? Le tracce nel fango o nella neve lo svelano.",
      "Who passed through here? Tracks in mud or snow give it away."
    ),
  },
  {
    id: "sternbilder",
    label: l4(
      "Sternbilder",
      "Constellations",
      "Costellazioni",
      "Constellations"
    ),
    icon: "Sparkles",
    intro: l4(
      "Was funkelt da oben? Die bekanntesten Sternbilder für klare Campingnächte.",
      "Qu'est-ce qui scintille là-haut ? Les constellations les plus connues pour les nuits de camping dégagées.",
      "Cosa brilla lassù? Le costellazioni più famose per le notti limpide in campeggio.",
      "What is twinkling up there? The best-known constellations for clear camping nights."
    ),
  },
  {
    id: "baeume",
    label: l4("Bäume", "Arbres", "Alberi", "Trees"),
    icon: "TreePine",
    intro: l4(
      "Blätter, Nadeln, Rinde – so erkennst du die häufigsten Bäume rund ums Camp.",
      "Feuilles, aiguilles, écorce – voici comment reconnaître les arbres les plus fréquents autour du camp.",
      "Foglie, aghi, corteccia – ecco come riconoscere gli alberi più comuni attorno al campo.",
      "Leaves, needles, bark – how to recognise the most common trees around camp."
    ),
  },
];

export const natureEntries: NatureEntry[] = [
  // ── Tierspuren ──
  {
    id: "reh",
    name: l4("Reh", "Chevreuil", "Capriolo", "Roe deer"),
    latinOrExtra: "Capreolus capreolus",
    category: "tierspuren",
    image: img_natur_reh,
    description: l4(
      "Die Trittsiegel des Rehs sind klein, spitz und herzförmig – etwa 4–5 cm lang. Die beiden Schalenhälften laufen vorne spitz zu. Rehe sind in der Dämmerung am Waldrand unterwegs.",
      "Les empreintes du chevreuil sont petites, pointues et en forme de cœur – environ 4–5 cm de long. Les deux moitiés du sabot se terminent en pointe à l'avant. Les chevreuils circulent au crépuscule en lisière de forêt.",
      "Le orme del capriolo sono piccole, appuntite e a forma di cuore – lunghe circa 4–5 cm. Le due metà dello zoccolo terminano a punta davanti. I caprioli si muovono al crepuscolo ai margini del bosco.",
      "Roe deer tracks are small, pointed and heart-shaped – about 4–5 cm long. The two halves of the hoof taper to a point at the front. Roe deer move along the forest edge at dusk."
    ),
    funFact: l4(
      "Rehe bellen! Wenn sie erschrecken, stossen sie einen rauen Beller aus, der wie ein Hund klingt.",
      "Les chevreuils aboient ! Quand ils sont effrayés, ils poussent un aboiement rauque qui ressemble à celui d'un chien.",
      "I caprioli abbaiano! Quando si spaventano, emettono un abbaio rauco che sembra quello di un cane.",
      "Roe deer bark! When startled, they let out a rough bark that sounds like a dog."
    ),
    kidQuestion: l4(
      "Findest du eine Spur, die aussieht wie zwei kleine Kommas nebeneinander?",
      "Tu trouves une trace qui ressemble à deux petites virgules côte à côte ?",
      "Riesci a trovare un'orma che sembra due piccole virgole una accanto all'altra?",
      "Can you find a track that looks like two little commas side by side?"
    ),
    features: [
      l4(
        "4–5 cm lange, herzförmige Spur",
        "Empreinte en forme de cœur de 4–5 cm",
        "Orma a forma di cuore di 4–5 cm",
        "4–5 cm long, heart-shaped track"
      ),
      l4(
        "Zwei spitze Schalen",
        "Deux sabots pointus",
        "Due unghielli appuntiti",
        "Two pointed hoof halves"
      ),
      l4(
        "Oft auf weichen Waldwegen",
        "Souvent sur les chemins forestiers meubles",
        "Spesso sui sentieri morbidi del bosco",
        "Often on soft forest paths"
      ),
    ],
  },
  {
    id: "fuchs",
    name: l4("Fuchs", "Renard roux", "Volpe rossa", "Red fox"),
    latinOrExtra: "Vulpes vulpes",
    category: "tierspuren",
    image: img_natur_fuchs,
    description: l4(
      "Fuchsspuren ähneln kleinen Hundespuren (ca. 5 cm), sind aber schmaler und laufen wie auf einer Perlenschnur in einer geraden Linie – das nennt man «schnüren».",
      "Les traces de renard ressemblent à celles d'un petit chien (env. 5 cm), mais elles sont plus étroites et s'alignent comme sur un fil de perles en ligne droite – on dit que le renard «trace au cordeau».",
      "Le tracce di volpe assomigliano a quelle di un piccolo cane (ca. 5 cm), ma sono più strette e si allineano come perle su un filo in linea retta – si dice che la volpe «cammina in fila».",
      "Fox tracks look like small dog tracks (about 5 cm) but are narrower and line up like beads on a string in a straight line – this is called 'perfect registering'."
    ),
    funFact: l4(
      "Füchse nutzen das Erdmagnetfeld, um beim Mäusesprung die Entfernung zu ihrer Beute abzuschätzen.",
      "Les renards utilisent le champ magnétique terrestre pour estimer la distance de leur proie lors du saut de mulotage.",
      "Le volpi usano il campo magnetico terrestre per stimare la distanza dalla preda durante il balzo sui topi.",
      "Foxes use the Earth's magnetic field to judge the distance to their prey when pouncing on mice."
    ),
    kidQuestion: l4(
      "Laufen die Abdrücke wie an einer Schnur aufgereiht? Dann war es wahrscheinlich ein Fuchs, kein Hund!",
      "Les empreintes sont alignées comme sur un fil ? Alors c'était probablement un renard, pas un chien !",
      "Le impronte sono allineate come su un filo? Allora era probabilmente una volpe, non un cane!",
      "Are the prints lined up as if on a string? Then it was probably a fox, not a dog!"
    ),
    features: [
      l4(
        "Ca. 5 cm, oval und schmal",
        "Env. 5 cm, ovale et étroite",
        "Ca. 5 cm, ovale e stretta",
        "About 5 cm, oval and narrow"
      ),
      l4(
        "4 Zehenballen mit Krallenabdruck",
        "4 coussinets avec empreintes de griffes",
        "4 cuscinetti con impronte delle unghie",
        "4 toe pads with claw marks"
      ),
      l4(
        "Spuren in gerader Linie («geschnürt»)",
        "Traces en ligne droite («au cordeau»)",
        "Tracce in linea retta («in fila»)",
        "Tracks in a straight line ('registering')"
      ),
    ],
  },
  {
    id: "wildschwein",
    name: l4("Wildschwein", "Sanglier", "Cinghiale", "Wild boar"),
    latinOrExtra: "Sus scrofa",
    category: "tierspuren",
    image: img_natur_wildschwein,
    description: l4(
      "Wildschweinspuren sind breit und stumpf (6–8 cm). Typisch: Hinter den zwei Hauptschalen drücken sich fast immer die zwei seitlichen Afterklauen ab. Umgewühlte Erde in der Nähe ist ein sicheres Zeichen.",
      "Les traces de sanglier sont larges et émoussées (6–8 cm). Typique : derrière les deux sabots principaux, les deux gardes latérales s'impriment presque toujours. De la terre retournée à proximité est un signe sûr.",
      "Le tracce di cinghiale sono larghe e tozze (6–8 cm). Tipico: dietro i due unghielli principali si imprimono quasi sempre i due speroni laterali. Terra smossa nelle vicinanze è un segno sicuro.",
      "Wild boar tracks are broad and blunt (6–8 cm). Typically, the two side dewclaws leave marks behind the two main hooves almost every time. Churned-up soil nearby is a sure sign."
    ),
    funFact: l4(
      "Wildschweine sind ausgezeichnete Schwimmer und können ganze Seen durchqueren.",
      "Les sangliers sont d'excellents nageurs et peuvent traverser des lacs entiers.",
      "I cinghiali sono ottimi nuotatori e possono attraversare interi laghi.",
      "Wild boars are excellent swimmers and can cross entire lakes."
    ),
    kidQuestion: l4(
      "Siehst du neben der grossen Spur zwei kleine Punkte? Das sind die «Zwergenzehen» des Wildschweins!",
      "Tu vois deux petits points à côté de la grande empreinte ? Ce sont les «doigts de lutin» du sanglier !",
      "Vedi due puntini accanto all'orma grande? Sono le «dita da gnomo» del cinghiale!",
      "Do you see two little dots next to the big track? Those are the wild boar's 'dwarf toes'!"
    ),
    features: [
      l4(
        "6–8 cm, breit und rundlich",
        "6–8 cm, large et arrondie",
        "6–8 cm, larga e arrotondata",
        "6–8 cm, broad and rounded"
      ),
      l4(
        "Afterklauen sichtbar (4 Abdrücke)",
        "Gardes visibles (4 empreintes)",
        "Speroni visibili (4 impronte)",
        "Dewclaws visible (4 marks)"
      ),
      l4(
        "Wühlspuren im Boden in der Nähe",
        "Traces de fouissage dans le sol à proximité",
        "Segni di scavo nel terreno nelle vicinanze",
        "Rooting marks in the ground nearby"
      ),
    ],
  },
  {
    id: "eichhoernchen",
    name: l4(
      "Eichhörnchen",
      "Écureuil roux",
      "Scoiattolo rosso",
      "Red squirrel"
    ),
    latinOrExtra: "Sciurus vulgaris",
    category: "tierspuren",
    image: img_natur_eichhoernchen,
    description: l4(
      "Beim Hüpfen landen die grossen Hinterpfoten vor den kleinen Vorderpfoten – das ergibt ein typisches Sprungmuster. Angenagte Tannenzapfen, die wie abgenagte Maiskolben aussehen, sind sein Markenzeichen.",
      "En sautant, les grandes pattes arrière atterrissent devant les petites pattes avant – cela donne un motif de sauts typique. Les cônes rongés, qui ressemblent à des épis de maïs grignotés, sont sa marque de fabrique.",
      "Saltando, le grandi zampe posteriori atterrano davanti alle piccole zampe anteriori – ne risulta un tipico schema a balzi. Le pigne rosicchiate, che sembrano pannocchie spolpate, sono il suo marchio di fabbrica.",
      "When hopping, the large hind paws land in front of the small front paws – creating a typical bounding pattern. Gnawed cones that look like nibbled corn cobs are its trademark."
    ),
    funFact: l4(
      "Eichhörnchen vergessen viele ihrer Nussverstecke – und pflanzen so nebenbei neue Bäume.",
      "Les écureuils oublient beaucoup de leurs cachettes de noix – et plantent ainsi de nouveaux arbres sans le vouloir.",
      "Gli scoiattoli dimenticano molti dei loro nascondigli di noci – e così, senza volerlo, piantano nuovi alberi.",
      "Squirrels forget many of their nut caches – and so plant new trees along the way."
    ),
    kidQuestion: l4(
      "Findest du einen abgenagten Zapfen, der aussieht wie ein Maiskolben?",
      "Tu trouves un cône rongé qui ressemble à un épi de maïs ?",
      "Riesci a trovare una pigna rosicchiata che sembra una pannocchia?",
      "Can you find a gnawed cone that looks like a corn cob?"
    ),
    features: [
      l4(
        "Sprungmuster: hinten vor vorne",
        "Motif de sauts : l'arrière devant l'avant",
        "Schema a balzi: posteriori davanti agli anteriori",
        "Bounding pattern: hind before front"
      ),
      l4(
        "Kleine Krallenabdrücke",
        "Petites empreintes de griffes",
        "Piccole impronte di unghie",
        "Small claw marks"
      ),
      l4(
        "Zapfenreste an Baumstümpfen",
        "Restes de cônes sur les souches",
        "Resti di pigne sui ceppi",
        "Cone remains on tree stumps"
      ),
    ],
  },
  {
    id: "dachs",
    name: l4("Dachs", "Blaireau", "Tasso", "Badger"),
    latinOrExtra: "Meles meles",
    category: "tierspuren",
    image: img_natur_dachs,
    // Winterruhe: von Spätherbst bis Ende Winter kaum frische Spuren
    season: { from: 3, to: 11 },
    description: l4(
      "Dachsspuren wirken wie kleine Bärentatzen: fünf Zehen mit langen, deutlich sichtbaren Krallen vor einem breiten Ballen. Dachse laufen auf festen Pfaden, die sie über Generationen benutzen.",
      "Les traces de blaireau ressemblent à de petites pattes d'ours : cinq doigts avec de longues griffes bien visibles devant un large coussinet. Les blaireaux suivent des sentiers fixes qu'ils utilisent depuis des générations.",
      "Le tracce di tasso sembrano piccole zampe d'orso: cinque dita con lunghe unghie ben visibili davanti a un cuscinetto largo. I tassi seguono sentieri fissi che usano da generazioni.",
      "Badger tracks look like small bear paws: five toes with long, clearly visible claws in front of a broad pad. Badgers travel along fixed paths used for generations."
    ),
    funFact: l4(
      "Dachse legen richtige Burgen mit mehreren Etagen an – manche sind über 100 Jahre alt und werden vererbt.",
      "Les blaireaux construisent de véritables châteaux à plusieurs étages – certains ont plus de 100 ans et se transmettent de génération en génération.",
      "I tassi costruiscono vere e proprie fortezze a più piani – alcune hanno più di 100 anni e vengono ereditate.",
      "Badgers build real fortresses with several storeys – some are over 100 years old and are passed down through generations."
    ),
    kidQuestion: l4(
      "Kannst du fünf kleine Krallenspitzen vor dem Fussabdruck zählen?",
      "Tu peux compter cinq petites pointes de griffes devant l'empreinte ?",
      "Riesci a contare cinque piccole punte di unghie davanti all'impronta?",
      "Can you count five little claw tips in front of the footprint?"
    ),
    features: [
      l4(
        "5 Zehen mit langen Krallen",
        "5 doigts avec de longues griffes",
        "5 dita con unghie lunghe",
        "5 toes with long claws"
      ),
      l4(
        "Breiter, nieriger Ballen",
        "Coussinet large en forme de rein",
        "Cuscinetto largo a forma di rene",
        "Broad, kidney-shaped pad"
      ),
      l4(
        "Deutliche Trampelpfade",
        "Sentiers bien marqués",
        "Sentieri ben battuti",
        "Well-worn trails"
      ),
    ],
  },
  {
    id: "feldhase",
    name: l4("Feldhase", "Lièvre d'Europe", "Lepre europea", "Brown hare"),
    latinOrExtra: "Lepus europaeus",
    category: "tierspuren",
    description: l4(
      "Hasenspuren erkennst du an der Vierergruppe: Die langen Hinterpfoten landen VOR den kleinen Vorderpfoten, weil der Hase sie beim Sprung nach vorne schwingt. Die Spur zeigt vier Zehen ohne deutliche Krallen.",
      "Tu reconnais les traces de lièvre à leur groupe de quatre : les longues pattes arrière se posent DEVANT les petites pattes avant, car le lièvre les projette vers l'avant en bondissant. L'empreinte montre quatre doigts sans griffes marquées.",
      "Riconosci le orme della lepre dal gruppo di quattro: le lunghe zampe posteriori atterrano DAVANTI a quelle anteriori, perché la lepre le porta in avanti nel salto. L'impronta mostra quattro dita senza unghie marcate.",
      "You can spot hare tracks by their group of four: the long hind feet land IN FRONT of the small front feet, because the hare swings them forward as it leaps. The print shows four toes without clear claw marks."
    ),
    funFact: l4(
      "Junge Feldhasen kommen mit Fell und offenen Augen zur Welt – Kaninchenbabys dagegen nackt und blind.",
      "Les levrauts naissent avec leur pelage et les yeux ouverts – les bébés lapins, eux, arrivent nus et aveugles.",
      "I piccoli di lepre nascono con il pelo e gli occhi aperti – i coniglietti invece nudi e ciechi.",
      "Young hares are born with fur and open eyes – rabbit kits, by contrast, arrive naked and blind."
    ),
    kidQuestion: l4(
      "Findest du eine Spur, bei der die grossen Abdrücke vorne und die kleinen hinten liegen?",
      "Tu trouves une trace où les grandes empreintes sont devant et les petites derrière ?",
      "Riesci a trovare un'orma con le impronte grandi davanti e quelle piccole dietro?",
      "Can you find a track where the big prints are in front and the small ones behind?"
    ),
    features: [
      l4(
        "Vierergruppe pro Sprung",
        "Groupe de quatre à chaque bond",
        "Gruppo di quattro a ogni balzo",
        "Group of four per leap"
      ),
      l4(
        "Lange, schmale Hinterpfoten",
        "Pattes arrière longues et étroites",
        "Zampe posteriori lunghe e strette",
        "Long, narrow hind feet"
      ),
      l4(
        "Offene Wiesen und Feldränder",
        "Prairies ouvertes et bordures de champs",
        "Prati aperti e bordi dei campi",
        "Open meadows and field edges"
      ),
    ],
  },
  {
    id: "biber",
    name: l4("Biber", "Castor d'Europe", "Castoro europeo", "Eurasian beaver"),
    latinOrExtra: "Castor fiber",
    category: "tierspuren",
    description: l4(
      "Am Ufer verrät sich der Biber weniger durch Pfotenabdrücke als durch seine Arbeit: angenagte Bäume mit sanduhrförmigem Stumpf, Nagespäne im Gras und glatte Rutschbahnen ins Wasser. Die Hinterpfote ist bis 15 cm lang und hat Schwimmhäute.",
      "Au bord de l'eau, le castor se trahit moins par ses empreintes que par son travail : arbres rongés en forme de sablier, copeaux dans l'herbe et glissoires lisses vers l'eau. La patte arrière mesure jusqu'à 15 cm et porte des palmures.",
      "In riva all'acqua il castoro si tradisce meno con le impronte che con il suo lavoro: alberi rosicchiati a forma di clessidra, trucioli nell'erba e scivoli lisci verso l'acqua. La zampa posteriore misura fino a 15 cm ed è palmata.",
      "On the bank, the beaver gives itself away less by its prints than by its work: gnawed trees with an hourglass-shaped stump, wood chips in the grass and smooth slides into the water. The hind foot is up to 15 cm long and webbed."
    ),
    funFact: l4(
      "Biberzähne sind orange – der harte Zahnschmelz enthält Eisen und wird beim Nagen von selbst wieder scharf.",
      "Les dents du castor sont oranges – l'émail dur contient du fer et s'aiguise tout seul en rongeant.",
      "I denti del castoro sono arancioni – lo smalto duro contiene ferro e si riaffila da solo rosicchiando.",
      "Beaver teeth are orange – the hard enamel contains iron and resharpens itself as the animal gnaws."
    ),
    kidQuestion: l4(
      "Siehst du am Ufer einen Baumstumpf, der aussieht wie ein angespitzter Bleistift?",
      "Tu vois au bord de l'eau une souche qui ressemble à un crayon taillé ?",
      "Vedi in riva un ceppo che sembra una matita temperata?",
      "Can you see a tree stump on the bank that looks like a sharpened pencil?"
    ),
    features: [
      l4(
        "Sanduhrförmig angenagte Stämme",
        "Troncs rongés en forme de sablier",
        "Tronchi rosicchiati a clessidra",
        "Trunks gnawed into an hourglass shape"
      ),
      l4(
        "Rutschbahnen und Trampelpfade am Ufer",
        "Glissoires et sentes sur la rive",
        "Scivoli e sentieri battuti sulla riva",
        "Slides and beaten paths on the bank"
      ),
      l4(
        "Grosse Hinterpfote mit Schwimmhäuten",
        "Grande patte arrière palmée",
        "Grande zampa posteriore palmata",
        "Large webbed hind foot"
      ),
    ],
  },
  {
    id: "steinmarder",
    name: l4("Steinmarder", "Fouine", "Faina", "Beech marten"),
    latinOrExtra: "Martes foina",
    category: "tierspuren",
    description: l4(
      "Der Steinmarder hinterlässt kleine Spuren mit fünf Zehen und feinen Krallenpunkten. Weil er hüpft, liegen die Abdrücke meist paarweise schräg nebeneinander. Er lebt gern in der Nähe von Menschen – auch auf dem Campingplatz.",
      "La fouine laisse de petites empreintes à cinq doigts avec de fines marques de griffes. Comme elle se déplace par bonds, les traces sont souvent par paires, légèrement décalées. Elle aime vivre près des humains – même au camping.",
      "La faina lascia piccole impronte con cinque dita e sottili segni delle unghie. Poiché si muove a balzi, le orme stanno spesso in coppia, leggermente sfalsate. Vive volentieri vicino all'uomo – anche in campeggio.",
      "The beech marten leaves small five-toed prints with fine claw marks. Because it bounds along, the prints usually sit in slanted pairs. It likes living close to people – campsites included."
    ),
    funFact: l4(
      "Marder knabbern gern an Kabeln unter der Motorhaube – parkierte Autos sind für sie eine warme Höhle.",
      "Les fouines aiment grignoter les câbles sous le capot – une voiture garée est pour elles une tanière bien chaude.",
      "Alle faine piace rosicchiare i cavi sotto il cofano – un'auto parcheggiata per loro è una tana calda.",
      "Martens like nibbling cables under the bonnet – a parked car is a nice warm den to them."
    ),
    kidQuestion: l4(
      "Zähl die Zehen im Abdruck: Fünf? Dann war es kein Hund, sondern ein Marder!",
      "Compte les doigts dans l'empreinte : cinq ? Alors ce n'était pas un chien, mais une fouine !",
      "Conta le dita nell'impronta: cinque? Allora non era un cane, ma una faina!",
      "Count the toes in the print: five? Then it wasn't a dog but a marten!"
    ),
    features: [
      l4(
        "Fünf Zehen mit feinen Krallen",
        "Cinq doigts avec de fines griffes",
        "Cinque dita con unghie sottili",
        "Five toes with fine claws"
      ),
      l4(
        "Paarweise, schräge Sprungspur",
        "Traces de bonds par paires, en biais",
        "Orme di salto a coppie, oblique",
        "Slanted pairs of bounding tracks"
      ),
      l4(
        "Oft bei Scheunen, Autos und Zeltplätzen",
        "Souvent près des granges, voitures et campings",
        "Spesso vicino a fienili, auto e campeggi",
        "Often near barns, cars and campsites"
      ),
    ],
  },
  // ── Sternbilder ──
  {
    id: "grosser-wagen",
    name: l4(
      "Grosser Wagen",
      "Grand Chariot",
      "Grande Carro",
      "The Plough (Big Dipper)"
    ),
    latinOrExtra: l4(
      "Teil des Sternbilds Grosser Bär",
      "Partie de la constellation de la Grande Ourse",
      "Parte della costellazione dell'Orsa Maggiore",
      "Part of the constellation Ursa Major"
    ),
    category: "sternbilder",
    image: img_natur_grosser_wagen,
    description: l4(
      "Sieben helle Sterne bilden einen Kastenwagen mit Deichsel. Er ist das ganze Jahr über am Nordhimmel sichtbar und der beste Startpunkt für alle Sternentdecker*innen.",
      "Sept étoiles brillantes forment un chariot avec son timon. Il est visible toute l'année dans le ciel du nord et constitue le meilleur point de départ pour toutes les exploratrices et tous les explorateurs d'étoiles.",
      "Sette stelle luminose formano un carro con il timone. È visibile tutto l'anno nel cielo settentrionale ed è il miglior punto di partenza per chi esplora le stelle.",
      "Seven bright stars form a cart with a handle. It is visible in the northern sky all year round and is the best starting point for every star explorer."
    ),
    funFact: l4(
      "Verlängert man die hintere Kastenkante fünfmal, landet man genau beim Polarstern – dem Wegweiser nach Norden.",
      "En prolongeant cinq fois le bord arrière du chariot, on tombe exactement sur l'étoile polaire – le guide vers le nord.",
      "Prolungando cinque volte il bordo posteriore del carro, si arriva esattamente alla Stella polare – la guida verso nord.",
      "Extend the back edge of the box five times and you land exactly on the Pole Star – the signpost to the north."
    ),
    kidQuestion: l4(
      "Findest du den grossen Kochtopf mit dem langen Stiel am Himmel?",
      "Tu trouves la grande casserole avec son long manche dans le ciel ?",
      "Riesci a trovare la grande pentola con il lungo manico nel cielo?",
      "Can you find the big saucepan with the long handle in the sky?"
    ),
    features: [
      l4(
        "7 helle Sterne",
        "7 étoiles brillantes",
        "7 stelle luminose",
        "7 bright stars"
      ),
      l4(
        "Form: Kasten mit Deichsel",
        "Forme : chariot avec timon",
        "Forma: carro con timone",
        "Shape: box with handle"
      ),
      l4(
        "Ganzjährig sichtbar",
        "Visible toute l'année",
        "Visibile tutto l'anno",
        "Visible all year round"
      ),
    ],
  },
  {
    id: "polarstern",
    name: l4(
      "Polarstern & Kleiner Wagen",
      "Étoile polaire & Petit Chariot",
      "Stella polare & Piccolo Carro",
      "Pole Star & Little Dipper"
    ),
    latinOrExtra: "Polaris",
    category: "sternbilder",
    image: img_natur_polarstern,
    description: l4(
      "Der Polarstern steht fast genau über dem Nordpol und bewegt sich scheinbar nie. Er ist der letzte Stern in der Deichsel des Kleinen Wagens – und ein natürlicher Kompass.",
      "L'étoile polaire se trouve presque exactement au-dessus du pôle Nord et semble ne jamais bouger. C'est la dernière étoile du timon du Petit Chariot – et une boussole naturelle.",
      "La Stella polare si trova quasi esattamente sopra il Polo Nord e sembra non muoversi mai. È l'ultima stella del timone del Piccolo Carro – e una bussola naturale.",
      "The Pole Star sits almost exactly above the North Pole and never seems to move. It is the last star in the handle of the Little Dipper – and a natural compass."
    ),
    funFact: l4(
      "Alle anderen Sterne scheinen sich in der Nacht um den Polarstern zu drehen – er ist der ruhende Punkt des Himmels.",
      "Toutes les autres étoiles semblent tourner autour de l'étoile polaire pendant la nuit – c'est le point fixe du ciel.",
      "Tutte le altre stelle sembrano ruotare attorno alla Stella polare durante la notte – è il punto fermo del cielo.",
      "All the other stars seem to circle the Pole Star during the night – it is the still point of the sky."
    ),
    kidQuestion: l4(
      "Wenn du den Polarstern gefunden hast: Wo ist dann Norden? Genau – direkt darunter!",
      "Une fois l'étoile polaire trouvée : où est le nord ? Exactement – juste en dessous !",
      "Una volta trovata la Stella polare: dov'è il nord? Esatto – proprio lì sotto!",
      "Once you have found the Pole Star: where is north? Exactly – right below it!"
    ),
    features: [
      l4(
        "Zeigt immer nach Norden",
        "Indique toujours le nord",
        "Indica sempre il nord",
        "Always points north"
      ),
      l4(
        "Ende der Deichsel des Kleinen Wagens",
        "Bout du timon du Petit Chariot",
        "Estremità del timone del Piccolo Carro",
        "End of the Little Dipper's handle"
      ),
      l4(
        "Nicht besonders hell, aber konstant",
        "Pas particulièrement brillante, mais constante",
        "Non particolarmente luminosa, ma costante",
        "Not especially bright, but constant"
      ),
    ],
  },
  {
    id: "kassiopeia",
    name: l4("Kassiopeia", "Cassiopée", "Cassiopea", "Cassiopeia"),
    latinOrExtra: l4(
      "Das «Himmels-W»",
      "Le «W céleste»",
      "La «W del cielo»",
      "The 'celestial W'"
    ),
    category: "sternbilder",
    image: img_natur_kassiopeia,
    description: l4(
      "Fünf helle Sterne formen ein deutliches W (oder M, je nach Jahreszeit). Kassiopeia steht dem Grossen Wagen am Himmel genau gegenüber – der Polarstern liegt in der Mitte.",
      "Cinq étoiles brillantes forment un W bien net (ou un M, selon la saison). Cassiopée se trouve exactement à l'opposé du Grand Chariot dans le ciel – l'étoile polaire est au milieu.",
      "Cinque stelle luminose formano una netta W (o M, a seconda della stagione). Cassiopea si trova esattamente di fronte al Grande Carro nel cielo – la Stella polare sta nel mezzo.",
      "Five bright stars form a clear W (or M, depending on the season). Cassiopeia sits exactly opposite the Plough in the sky – with the Pole Star in between."
    ),
    funFact: l4(
      "In der griechischen Sage war Kassiopeia eine eitle Königin, die zur Strafe an den Himmel gesetzt wurde.",
      "Dans la légende grecque, Cassiopée était une reine vaniteuse, placée dans le ciel en guise de punition.",
      "Nella leggenda greca, Cassiopea era una regina vanitosa, messa in cielo per punizione.",
      "In Greek legend, Cassiopeia was a vain queen who was placed in the sky as punishment."
    ),
    kidQuestion: l4(
      "Suchst du das grosse W am Himmel? Manchmal steht es auf dem Kopf und wird zum M!",
      "Tu cherches le grand W dans le ciel ? Parfois il est à l'envers et devient un M !",
      "Cerchi la grande W nel cielo? A volte è capovolta e diventa una M!",
      "Looking for the big W in the sky? Sometimes it is upside down and becomes an M!"
    ),
    features: [
      l4(
        "5 Sterne in W-Form",
        "5 étoiles en forme de W",
        "5 stelle a forma di W",
        "5 stars in a W shape"
      ),
      l4(
        "Gegenüber dem Grossen Wagen",
        "À l'opposé du Grand Chariot",
        "Di fronte al Grande Carro",
        "Opposite the Plough"
      ),
      l4(
        "Ganzjährig sichtbar",
        "Visible toute l'année",
        "Visibile tutto l'anno",
        "Visible all year round"
      ),
    ],
  },
  {
    id: "orion",
    name: l4("Orion", "Orion", "Orione", "Orion"),
    latinOrExtra: l4(
      "Der Himmelsjäger",
      "Le chasseur céleste",
      "Il cacciatore celeste",
      "The celestial hunter"
    ),
    category: "sternbilder",
    image: img_natur_orion,
    // Wintersternbild – Sichtbarkeit laut Beschreibung Oktober bis März
    season: { from: 10, to: 3 },
    description: l4(
      "Das prächtigste Wintersternbild: Drei Sterne in einer Reihe bilden den Gürtel des Jägers, umrahmt von vier hellen Ecksternen. Unter dem Gürtel schimmert der Orionnebel.",
      "La plus splendide constellation d'hiver : trois étoiles alignées forment la ceinture du chasseur, encadrée par quatre étoiles brillantes aux coins. Sous la ceinture scintille la nébuleuse d'Orion.",
      "La più splendida costellazione invernale: tre stelle in fila formano la cintura del cacciatore, incorniciata da quattro stelle luminose agli angoli. Sotto la cintura brilla la Nebulosa di Orione.",
      "The most magnificent winter constellation: three stars in a row form the hunter's belt, framed by four bright corner stars. Below the belt shimmers the Orion Nebula."
    ),
    funFact: l4(
      "Der rote Schulterstern Beteigeuze ist so riesig, dass er bis fast zum Jupiter reichen würde, stünde er an der Stelle unserer Sonne.",
      "L'étoile rouge de l'épaule, Bételgeuse, est si gigantesque qu'elle s'étendrait presque jusqu'à Jupiter si elle était à la place de notre Soleil.",
      "La stella rossa della spalla, Betelgeuse, è così gigantesca che arriverebbe quasi fino a Giove se fosse al posto del nostro Sole.",
      "The red shoulder star Betelgeuse is so huge that it would reach almost to Jupiter if it stood in place of our Sun."
    ),
    kidQuestion: l4(
      "Findest du die drei Gürtelsterne, die wie auf einer Perlenkette aufgereiht sind?",
      "Tu trouves les trois étoiles de la ceinture, alignées comme sur un collier de perles ?",
      "Riesci a trovare le tre stelle della cintura, allineate come su una collana di perle?",
      "Can you find the three belt stars strung out like beads on a necklace?"
    ),
    features: [
      l4(
        "3 Gürtelsterne in Reihe",
        "3 étoiles de ceinture alignées",
        "3 stelle della cintura in fila",
        "3 belt stars in a row"
      ),
      l4(
        "4 helle Ecksterne",
        "4 étoiles brillantes aux coins",
        "4 stelle luminose agli angoli",
        "4 bright corner stars"
      ),
      l4(
        "Sichtbar von Oktober bis März",
        "Visible d'octobre à mars",
        "Visibile da ottobre a marzo",
        "Visible from October to March"
      ),
    ],
  },
  {
    id: "sommerdreieck",
    name: l4(
      "Sommerdreieck",
      "Triangle d'été",
      "Triangolo estivo",
      "Summer Triangle"
    ),
    latinOrExtra: l4(
      "Wega, Deneb, Atair",
      "Véga, Deneb, Altaïr",
      "Vega, Deneb, Altair",
      "Vega, Deneb, Altair"
    ),
    category: "sternbilder",
    image: img_natur_sommerdreieck,
    // Sommerhimmel – Sichtbarkeit laut Beschreibung Juni bis Oktober
    season: { from: 6, to: 10 },
    description: l4(
      "Drei sehr helle Sterne aus drei Sternbildern (Leier, Schwan, Adler) bilden ein riesiges Dreieck – das auffälligste Muster des Sommerhimmels, perfekt für laue Zeltnächte.",
      "Trois étoiles très brillantes de trois constellations (Lyre, Cygne, Aigle) forment un triangle géant – le motif le plus marquant du ciel d'été, parfait pour les douces nuits sous tente.",
      "Tre stelle molto luminose di tre costellazioni (Lira, Cigno, Aquila) formano un triangolo gigantesco – il disegno più appariscente del cielo estivo, perfetto per le miti notti in tenda.",
      "Three very bright stars from three constellations (Lyra, Cygnus, Aquila) form a giant triangle – the most striking pattern of the summer sky, perfect for mild nights in the tent."
    ),
    funFact: l4(
      "Mitten durch das Sommerdreieck zieht sich das Band der Milchstrasse – bei dunklem Himmel als schimmernder Nebel sichtbar.",
      "La bande de la Voie lactée traverse le Triangle d'été en plein milieu – visible comme une brume scintillante par ciel sombre.",
      "La striscia della Via Lattea attraversa il Triangolo estivo proprio nel mezzo – visibile come una nebbia luminosa con cielo scuro.",
      "The band of the Milky Way runs right through the Summer Triangle – visible as a shimmering mist under a dark sky."
    ),
    kidQuestion: l4(
      "Welcher der drei Sterne funkelt am hellsten? Das ist die Wega!",
      "Laquelle des trois étoiles scintille le plus ? C'est Véga !",
      "Quale delle tre stelle brilla di più? È Vega!",
      "Which of the three stars twinkles the brightest? That is Vega!"
    ),
    features: [
      l4(
        "3 sehr helle Sterne",
        "3 étoiles très brillantes",
        "3 stelle molto luminose",
        "3 very bright stars"
      ),
      l4(
        "Riesiges Dreieck im Zenit",
        "Triangle géant au zénith",
        "Triangolo gigantesco allo zenit",
        "Giant triangle at the zenith"
      ),
      l4(
        "Sichtbar von Juni bis Oktober",
        "Visible de juin à octobre",
        "Visibile da giugno a ottobre",
        "Visible from June to October"
      ),
    ],
  },
  {
    id: "perseus",
    name: l4("Perseus", "Persée", "Perseo", "Perseus"),
    latinOrExtra: l4(
      "Der Held der Sternschnuppen",
      "Le héros des étoiles filantes",
      "L'eroe delle stelle cadenti",
      "The hero of the shooting stars"
    ),
    category: "sternbilder",
    // Herbst- und Wintersternbild; ab den Perseiden im August gut zu sehen
    season: { from: 8, to: 2 },
    description: l4(
      "Perseus steht zwischen Kassiopeia und den Plejaden und sieht aus wie ein leicht geknickter Sternenbogen. Sein bekanntester Stern heisst Algol und ändert alle knapp drei Tage seine Helligkeit.",
      "Persée se trouve entre Cassiopée et les Pléiades et ressemble à un arc d'étoiles légèrement plié. Son étoile la plus connue s'appelle Algol et change de luminosité tous les trois jours environ.",
      "Perseo si trova tra Cassiopea e le Pleiadi e sembra un arco di stelle leggermente piegato. La sua stella più nota si chiama Algol e cambia luminosità ogni tre giorni circa.",
      "Perseus sits between Cassiopeia and the Pleiades and looks like a slightly bent arc of stars. Its best-known star is called Algol and changes brightness roughly every three days."
    ),
    funFact: l4(
      "Im August scheinen die Perseiden-Sternschnuppen aus diesem Sternbild zu regnen – in guten Nächten über 50 pro Stunde.",
      "En août, les étoiles filantes des Perséides semblent pleuvoir de cette constellation – plus de 50 par heure lors des bonnes nuits.",
      "In agosto le stelle cadenti delle Perseidi sembrano piovere da questa costellazione – più di 50 all'ora nelle notti migliori.",
      "In August the Perseid shooting stars seem to rain out of this constellation – over 50 an hour on good nights."
    ),
    kidQuestion: l4(
      "Schau im August in Richtung Kassiopeia: Wie viele Sternschnuppen zählst du in zehn Minuten?",
      "En août, regarde vers Cassiopée : combien d'étoiles filantes comptes-tu en dix minutes ?",
      "Ad agosto guarda verso Cassiopea: quante stelle cadenti conti in dieci minuti?",
      "In August look towards Cassiopeia: how many shooting stars can you count in ten minutes?"
    ),
    features: [
      l4(
        "Geknickter Sternenbogen",
        "Arc d'étoiles plié",
        "Arco di stelle piegato",
        "Bent arc of stars"
      ),
      l4(
        "Direkt neben Kassiopeia",
        "Juste à côté de Cassiopée",
        "Proprio accanto a Cassiopea",
        "Right next to Cassiopeia"
      ),
      l4(
        "Ausgangspunkt der Perseiden im August",
        "Point de départ des Perséides en août",
        "Punto di origine delle Perseidi in agosto",
        "Radiant of the Perseids in August"
      ),
    ],
  },
  {
    id: "plejaden",
    name: l4("Plejaden", "Pléiades", "Pleiadi", "Pleiades"),
    latinOrExtra: l4(
      "Das Siebengestirn",
      "Les Sept Sœurs",
      "Le Sette Sorelle",
      "The Seven Sisters"
    ),
    category: "sternbilder",
    // Von Herbst bis Frühling am Abendhimmel
    season: { from: 10, to: 4 },
    description: l4(
      "Ein kleiner, neblig wirkender Sternhaufen, den viele zuerst für den Kleinen Wagen halten. Mit blossem Auge zählst du sechs bis sieben Sterne, mit dem Feldstecher plötzlich Dutzende.",
      "Un petit amas d'étoiles d'aspect brumeux, que beaucoup prennent d'abord pour la Petite Ourse. À l'œil nu, tu comptes six à sept étoiles, aux jumelles soudain des dizaines.",
      "Un piccolo ammasso di stelle dall'aspetto nebbioso, che molti scambiano per il Piccolo Carro. A occhio nudo conti sei o sette stelle, con il binocolo all'improvviso decine.",
      "A small, hazy-looking star cluster that many people first mistake for the Little Dipper. With the naked eye you count six or seven stars, with binoculars suddenly dozens."
    ),
    funFact: l4(
      "Die Plejaden sind rund 1000 junge Sterne, die zusammen entstanden sind – ein echtes Sternen-Geschwisterpaket.",
      "Les Pléiades comptent environ 1000 jeunes étoiles nées ensemble – une véritable fratrie stellaire.",
      "Le Pleiadi sono circa 1000 stelle giovani nate insieme – una vera famiglia di stelle.",
      "The Pleiades are about 1000 young stars born together – a genuine family of stars."
    ),
    kidQuestion: l4(
      "Wie viele Sterne siehst du ohne Hilfsmittel? Schau einmal knapp daneben – dann wirken sie heller!",
      "Combien d'étoiles vois-tu sans aide ? Regarde un peu à côté – elles paraissent alors plus brillantes !",
      "Quante stelle vedi a occhio nudo? Guarda un po' di lato – così sembrano più luminose!",
      "How many stars can you see unaided? Look slightly to one side – they appear brighter that way!"
    ),
    features: [
      l4(
        "Kleiner, dicht gedrängter Sternhaufen",
        "Petit amas d'étoiles serrées",
        "Piccolo ammasso di stelle fitte",
        "Small, tightly packed star cluster"
      ),
      l4(
        "Sechs bis sieben Sterne ohne Feldstecher",
        "Six à sept étoiles sans jumelles",
        "Sei o sette stelle senza binocolo",
        "Six or seven stars without binoculars"
      ),
      l4(
        "Oberhalb des Stiers, nahe Orion",
        "Au-dessus du Taureau, près d'Orion",
        "Sopra il Toro, vicino a Orione",
        "Above Taurus, near Orion"
      ),
    ],
  },
  // ── Bäume ──
  {
    id: "fichte",
    name: l4("Fichte", "Épicéa commun", "Abete rosso", "Norway spruce"),
    latinOrExtra: "Picea abies",
    category: "baeume",
    image: img_natur_fichte,
    description: l4(
      "Der häufigste Nadelbaum der Schweiz. Ihre Nadeln sind spitz und stechen, die Zapfen hängen nach unten und fallen als Ganzes ab. Merkspruch: «Die Fichte sticht, die Tanne nicht.»",
      "Le conifère le plus fréquent de Suisse. Ses aiguilles sont pointues et piquent, ses cônes pendent vers le bas et tombent entiers. Moyen mnémotechnique : «L'épicéa pique, le sapin non.»",
      "La conifera più diffusa della Svizzera. I suoi aghi sono appuntiti e pungono, le pigne pendono verso il basso e cadono intere. Regola mnemonica: «L'abete rosso punge, l'abete bianco no.»",
      "Switzerland's most common conifer. Its needles are sharp and prickly, its cones hang downwards and fall off whole. Memory aid: 'The spruce pricks, the fir does not.'"
    ),
    funFact: l4(
      "Fichtenharz war früher der Kaugummi der Alpen – Hirtenkinder kauten das goldgelbe Harz.",
      "La résine d'épicéa était autrefois le chewing-gum des Alpes – les enfants de bergers mâchaient la résine jaune doré.",
      "La resina di abete rosso era un tempo la gomma da masticare delle Alpi – i figli dei pastori masticavano la resina giallo oro.",
      "Spruce resin used to be the chewing gum of the Alps – shepherd children chewed the golden-yellow resin."
    ),
    kidQuestion: l4(
      "Streichle vorsichtig über die Nadeln: Piksen sie? Dann ist es eine Fichte!",
      "Caresse prudemment les aiguilles : elles piquent ? Alors c'est un épicéa !",
      "Accarezza con cautela gli aghi: pungono? Allora è un abete rosso!",
      "Gently stroke the needles: do they prick? Then it is a spruce!"
    ),
    features: [
      l4(
        "Spitze, stechende Nadeln rund um den Zweig",
        "Aiguilles pointues et piquantes tout autour du rameau",
        "Aghi appuntiti e pungenti tutt'attorno al rametto",
        "Sharp, prickly needles all around the twig"
      ),
      l4(
        "Hängende Zapfen",
        "Cônes pendants",
        "Pigne pendenti",
        "Hanging cones"
      ),
      l4(
        "Rötlich-braune, schuppige Rinde",
        "Écorce brun rougeâtre et écailleuse",
        "Corteccia bruno-rossastra e squamosa",
        "Reddish-brown, scaly bark"
      ),
    ],
  },
  {
    id: "tanne",
    name: l4("Weisstanne", "Sapin blanc", "Abete bianco", "Silver fir"),
    latinOrExtra: "Abies alba",
    category: "baeume",
    image: img_natur_tanne,
    description: l4(
      "Ihre Nadeln sind weich, vorne eingekerbt und haben zwei weisse Wachsstreifen auf der Unterseite. Die Zapfen stehen aufrecht wie Kerzen auf den Ästen und zerfallen am Baum.",
      "Ses aiguilles sont souples, échancrées au bout et portent deux bandes de cire blanches sur la face inférieure. Les cônes se dressent comme des bougies sur les branches et se désagrègent sur l'arbre.",
      "I suoi aghi sono morbidi, incavati in punta e con due strisce di cera bianche sul lato inferiore. Le pigne stanno dritte come candele sui rami e si sfaldano sull'albero.",
      "Its needles are soft, notched at the tip and have two white wax stripes on the underside. The cones stand upright like candles on the branches and disintegrate on the tree."
    ),
    funFact: l4(
      "Tannenzapfen findet man nie am Boden – sie zerfallen hoch oben am Ast in einzelne Schuppen.",
      "On ne trouve jamais de cônes de sapin au sol – ils se désagrègent en écailles tout en haut, sur la branche.",
      "Le pigne di abete bianco non si trovano mai a terra – si sfaldano in singole squame in alto sul ramo.",
      "You never find fir cones on the ground – they break up into single scales high up on the branch."
    ),
    kidQuestion: l4(
      "Dreh eine Nadel um: Siehst du die zwei weissen Streifen? Das ist das Tannen-Geheimzeichen!",
      "Retourne une aiguille : tu vois les deux bandes blanches ? C'est le signe secret du sapin !",
      "Gira un ago: vedi le due strisce bianche? È il segno segreto dell'abete bianco!",
      "Turn a needle over: can you see the two white stripes? That is the fir's secret sign!"
    ),
    features: [
      l4(
        "Weiche Nadeln mit 2 weissen Streifen unten",
        "Aiguilles souples avec 2 bandes blanches dessous",
        "Aghi morbidi con 2 strisce bianche sotto",
        "Soft needles with 2 white stripes underneath"
      ),
      l4(
        "Aufrecht stehende Zapfen",
        "Cônes dressés",
        "Pigne erette",
        "Upright cones"
      ),
      l4(
        "Glatte, graue Rinde",
        "Écorce lisse et grise",
        "Corteccia liscia e grigia",
        "Smooth, grey bark"
      ),
    ],
  },
  {
    id: "buche",
    name: l4("Rotbuche", "Hêtre commun", "Faggio", "Common beech"),
    latinOrExtra: "Fagus sylvatica",
    category: "baeume",
    image: img_natur_buche,
    // Laubzeit: Blattaustrieb bis Herbstfärbung/Bucheckern
    season: { from: 4, to: 10 },
    description: l4(
      "Die «Mutter des Waldes» hat eine glatte, silbergraue Rinde und eiförmige Blätter mit welligem Rand. Im Herbst fallen die dreikantigen Bucheckern aus ihren stacheligen Hüllen.",
      "La «mère de la forêt» a une écorce lisse gris argenté et des feuilles ovales au bord ondulé. En automne, les faînes à trois côtés tombent de leurs enveloppes épineuses.",
      "La «madre del bosco» ha una corteccia liscia grigio-argentea e foglie ovali dal bordo ondulato. In autunno, le faggiole a tre spigoli cadono dai loro ricci spinosi.",
      "The 'mother of the forest' has smooth, silver-grey bark and egg-shaped leaves with a wavy edge. In autumn, the three-sided beechnuts fall from their prickly husks."
    ),
    funFact: l4(
      "Buchenwälder werden auch «Kathedralen des Waldes» genannt, weil ihre glatten Stämme wie Säulen wirken.",
      "Les hêtraies sont aussi appelées «cathédrales de la forêt», car leurs troncs lisses ressemblent à des colonnes.",
      "Le faggete sono chiamate anche «cattedrali del bosco», perché i loro tronchi lisci sembrano colonne.",
      "Beech forests are also called 'cathedrals of the forest' because their smooth trunks look like columns."
    ),
    kidQuestion: l4(
      "Findest du eine dreieckige kleine Nuss am Boden? Das ist eine Buchecker!",
      "Tu trouves une petite noix triangulaire par terre ? C'est une faîne !",
      "Riesci a trovare una piccola noce triangolare per terra? È una faggiola!",
      "Can you find a little triangular nut on the ground? That is a beechnut!"
    ),
    features: [
      l4(
        "Glatte, silbergraue Rinde",
        "Écorce lisse gris argenté",
        "Corteccia liscia grigio-argentea",
        "Smooth, silver-grey bark"
      ),
      l4(
        "Eiförmige Blätter mit welligem Rand",
        "Feuilles ovales au bord ondulé",
        "Foglie ovali dal bordo ondulato",
        "Egg-shaped leaves with a wavy edge"
      ),
      l4(
        "Dreikantige Bucheckern",
        "Faînes à trois côtés",
        "Faggiole a tre spigoli",
        "Three-sided beechnuts"
      ),
    ],
  },
  {
    id: "eiche",
    name: l4("Stieleiche", "Chêne pédonculé", "Farnia", "English oak"),
    latinOrExtra: "Quercus robur",
    category: "baeume",
    image: img_natur_eiche,
    // Laubzeit: gebuchtete Blätter und Eicheln von Frühling bis Herbst
    season: { from: 4, to: 10 },
    description: l4(
      "Erkennbar an den gebuchteten Blättern und den Eicheln, die an langen Stielen hängen. Die Rinde ist tief gefurcht. Eichen können über 800 Jahre alt werden.",
      "Reconnaissable à ses feuilles lobées et à ses glands suspendus à de longs pédoncules. L'écorce est profondément crevassée. Les chênes peuvent vivre plus de 800 ans.",
      "Riconoscibile dalle foglie lobate e dalle ghiande appese a lunghi peduncoli. La corteccia è profondamente solcata. Le querce possono superare gli 800 anni.",
      "Recognisable by its lobed leaves and acorns hanging on long stalks. The bark is deeply furrowed. Oaks can live for over 800 years."
    ),
    funFact: l4(
      "Eine alte Eiche beherbergt bis zu 500 verschiedene Tierarten – mehr als jeder andere Baum bei uns.",
      "Un vieux chêne abrite jusqu'à 500 espèces animales différentes – plus que tout autre arbre chez nous.",
      "Una vecchia quercia ospita fino a 500 specie animali diverse – più di qualsiasi altro albero da noi.",
      "An old oak is home to up to 500 different animal species – more than any other tree in our region."
    ),
    kidQuestion: l4(
      "Wie viele «Finger» hat ein Eichenblatt? Zähl die runden Buchten!",
      "Combien de «doigts» a une feuille de chêne ? Compte les lobes arrondis !",
      "Quante «dita» ha una foglia di quercia? Conta i lobi arrotondati!",
      "How many 'fingers' does an oak leaf have? Count the rounded lobes!"
    ),
    features: [
      l4(
        "Gebuchtete Blätter ohne Spitzen",
        "Feuilles lobées sans pointes",
        "Foglie lobate senza punte",
        "Lobed leaves without points"
      ),
      l4(
        "Eicheln an langen Stielen",
        "Glands à longs pédoncules",
        "Ghiande su lunghi peduncoli",
        "Acorns on long stalks"
      ),
      l4(
        "Tief gefurchte, dunkle Rinde",
        "Écorce sombre profondément crevassée",
        "Corteccia scura profondamente solcata",
        "Deeply furrowed, dark bark"
      ),
    ],
  },
  {
    id: "birke",
    name: l4(
      "Hängebirke",
      "Bouleau verruqueux",
      "Betulla bianca",
      "Silver birch"
    ),
    latinOrExtra: "Betula pendula",
    category: "baeume",
    image: img_natur_birke,
    // Laubzeit: die gezackten Blätter tragen sie von Frühling bis Herbst
    season: { from: 4, to: 10 },
    description: l4(
      "Unverwechselbar durch die weisse, papierartige Rinde mit schwarzen Rissen. Die kleinen, gezackten Blätter zittern schon bei leichtem Wind an ihren dünnen Zweigen.",
      "Impossible à confondre grâce à son écorce blanche comme du papier, marquée de fissures noires. Ses petites feuilles dentées tremblent au moindre vent sur leurs fins rameaux.",
      "Inconfondibile per la corteccia bianca simile a carta con fessure nere. Le piccole foglie dentellate tremano già alla minima brezza sui loro rametti sottili.",
      "Unmistakable thanks to its white, papery bark with black cracks. Its small, serrated leaves tremble on their thin twigs at the slightest breeze."
    ),
    funFact: l4(
      "Birkenrinde brennt dank ihrer ätherischen Öle sogar nass – der beste natürliche Feuerstarter des Waldes.",
      "Grâce à ses huiles essentielles, l'écorce de bouleau brûle même mouillée – le meilleur allume-feu naturel de la forêt.",
      "Grazie ai suoi oli essenziali, la corteccia di betulla brucia anche bagnata – il miglior accendifuoco naturale del bosco.",
      "Thanks to its essential oils, birch bark burns even when wet – the forest's best natural fire starter."
    ),
    kidQuestion: l4(
      "Welcher Baum trägt ein weisses Kleid mit schwarzen Flecken? Die Birke!",
      "Quel arbre porte une robe blanche à taches noires ? Le bouleau !",
      "Quale albero indossa un vestito bianco a macchie nere? La betulla!",
      "Which tree wears a white dress with black spots? The birch!"
    ),
    features: [
      l4(
        "Weisse, papierartige Rinde",
        "Écorce blanche comme du papier",
        "Corteccia bianca simile a carta",
        "White, papery bark"
      ),
      l4(
        "Kleine, gezackte, dreieckige Blätter",
        "Petites feuilles dentées et triangulaires",
        "Piccole foglie dentellate e triangolari",
        "Small, serrated, triangular leaves"
      ),
      l4(
        "Hängende, dünne Zweige",
        "Rameaux fins et retombants",
        "Rametti sottili e penduli",
        "Thin, drooping twigs"
      ),
    ],
  },
  {
    id: "laerche",
    name: l4("Lärche", "Mélèze d'Europe", "Larice", "European larch"),
    latinOrExtra: "Larix decidua",
    category: "baeume",
    image: img_natur_laerche,
    // Nadelzeit inkl. goldener Herbstfärbung – im Winter kahl
    season: { from: 4, to: 11 },
    description: l4(
      "Der einzige heimische Nadelbaum, der im Herbst seine Nadeln verliert – vorher färben sie sich leuchtend goldgelb. Die weichen Nadeln wachsen in Büscheln an kurzen Trieben.",
      "Le seul conifère indigène qui perd ses aiguilles en automne – avant cela, elles se colorent d'un jaune doré éclatant. Les aiguilles souples poussent en touffes sur de courts rameaux.",
      "L'unica conifera indigena che perde gli aghi in autunno – prima però si tingono di un giallo oro luminoso. Gli aghi morbidi crescono a ciuffi su brevi rametti.",
      "The only native conifer that loses its needles in autumn – but first they turn a brilliant golden yellow. The soft needles grow in tufts on short shoots."
    ),
    funFact: l4(
      "Im Herbst verwandeln Lärchen ganze Berghänge in ein goldenes Meer, bevor die Nadeln fallen.",
      "En automne, les mélèzes transforment des pans de montagne entiers en mer dorée avant que les aiguilles ne tombent.",
      "In autunno i larici trasformano interi versanti montani in un mare dorato, prima che gli aghi cadano.",
      "In autumn, larches turn entire mountainsides into a golden sea before the needles fall."
    ),
    kidQuestion: l4(
      "Ein Nadelbaum, der im Winter nackt ist? Ja, das gibt es – die Lärche!",
      "Un conifère tout nu en hiver ? Oui, ça existe – le mélèze !",
      "Una conifera nuda in inverno? Sì, esiste – il larice!",
      "A conifer that is bare in winter? Yes, it exists – the larch!"
    ),
    features: [
      l4(
        "Weiche Nadeln in Büscheln",
        "Aiguilles souples en touffes",
        "Aghi morbidi a ciuffi",
        "Soft needles in tufts"
      ),
      l4(
        "Goldgelbe Herbstfärbung",
        "Coloration automnale jaune doré",
        "Colorazione autunnale giallo oro",
        "Golden-yellow autumn colour"
      ),
      l4(
        "Kleine, runde Zapfen",
        "Petits cônes ronds",
        "Piccole pigne rotonde",
        "Small, round cones"
      ),
    ],
  },
  {
    id: "bergahorn",
    name: l4(
      "Bergahorn",
      "Érable sycomore",
      "Acero di monte",
      "Sycamore maple"
    ),
    latinOrExtra: "Acer pseudoplatanus",
    category: "baeume",
    season: { from: 4, to: 10 },
    description: l4(
      "Grosse, fünflappige Blätter mit grob gezähntem Rand sitzen sich am Zweig immer paarweise gegenüber. Die Früchte sind zwei zusammengewachsene Flügel, die im Herbst wie Propeller zu Boden trudeln.",
      "De grandes feuilles à cinq lobes au bord grossièrement denté se font toujours face par paires sur le rameau. Les fruits sont deux ailes soudées qui tombent en automne en tournoyant comme des hélices.",
      "Grandi foglie a cinque lobi con bordo grossolanamente dentato stanno sempre a coppie opposte sul ramo. I frutti sono due ali unite che in autunno scendono ruotando come eliche.",
      "Large five-lobed leaves with coarsely toothed edges always sit opposite each other in pairs on the twig. The fruits are two joined wings that spin down like propellers in autumn."
    ),
    funFact: l4(
      "Die Flügelfrüchte lassen sich aufklappen und als «Nasenzwicker» auf die Nase kleben – ein Klassiker unter Kindern.",
      "Les fruits ailés s'ouvrent et se collent sur le nez comme un « pince-nez » – un grand classique chez les enfants.",
      "I frutti alati si aprono e si appiccicano sul naso come un «pizzico-naso» – un classico tra i bambini.",
      "The winged fruits can be split open and stuck on your nose like a 'nose pincher' – a classic children's trick."
    ),
    kidQuestion: l4(
      "Wirf eine Flügelfrucht hoch: Wie lange dreht sie sich, bevor sie landet?",
      "Lance un fruit ailé en l'air : combien de temps tourne-t-il avant d'atterrir ?",
      "Lancia in aria un frutto alato: quanto gira prima di atterrare?",
      "Throw a winged fruit into the air: how long does it spin before it lands?"
    ),
    features: [
      l4(
        "Fünflappige Blätter, paarweise gegenüber",
        "Feuilles à cinq lobes, opposées par paires",
        "Foglie a cinque lobi, opposte a coppie",
        "Five-lobed leaves in opposite pairs"
      ),
      l4(
        "Propeller-Früchte im Herbst",
        "Fruits hélicoptères en automne",
        "Frutti a elica in autunno",
        "Helicopter fruits in autumn"
      ),
      l4(
        "Rinde blättert in Platten ab",
        "Écorce qui se détache en plaques",
        "Corteccia che si sfalda a placche",
        "Bark flaking off in plates"
      ),
    ],
  },
  {
    id: "waldfoehre",
    name: l4("Waldföhre", "Pin sylvestre", "Pino silvestre", "Scots pine"),
    latinOrExtra: "Pinus sylvestris",
    category: "baeume",
    description: l4(
      "Die Nadeln stehen immer zu zweit in einer Scheide, sind 4–7 cm lang und leicht gedreht. Das sicherste Erkennungszeichen ist der obere Stammteil: Dort leuchtet die Rinde fuchsrot bis orange.",
      "Les aiguilles poussent toujours par deux dans une gaine, mesurent 4 à 7 cm et sont légèrement torsadées. Le signe le plus sûr est la partie haute du tronc : l'écorce y brille d'un roux orangé.",
      "Gli aghi crescono sempre a due a due in una guaina, sono lunghi 4–7 cm e leggermente ritorti. Il segno più sicuro è la parte alta del tronco: lì la corteccia brilla di un rosso volpe tendente all'arancione.",
      "The needles always grow in pairs in a sheath, are 4–7 cm long and slightly twisted. The surest sign is the upper trunk: there the bark glows fox-red to orange."
    ),
    funFact: l4(
      "Aus dem Harz der Föhre wurde früher Pech gekocht – es dichtete Boote ab und diente als erstes Kaugummi.",
      "Autrefois, on faisait cuire la résine du pin pour obtenir de la poix – elle rendait les bateaux étanches et servait de premier chewing-gum.",
      "Un tempo dalla resina del pino si cuoceva la pece – rendeva impermeabili le barche e serviva come prima gomma da masticare.",
      "In the past, pine resin was boiled down into pitch – it sealed boats and served as the earliest chewing gum."
    ),
    kidQuestion: l4(
      "Zähl die Nadeln an einem Büschel: Immer genau zwei? Dann steht eine Föhre vor dir!",
      "Compte les aiguilles d'un faisceau : toujours exactement deux ? Alors tu es devant un pin sylvestre !",
      "Conta gli aghi di un ciuffo: sempre esattamente due? Allora hai davanti un pino silvestre!",
      "Count the needles in a bundle: always exactly two? Then you're standing in front of a Scots pine!"
    ),
    features: [
      l4(
        "Nadeln paarweise, leicht gedreht",
        "Aiguilles par deux, légèrement torsadées",
        "Aghi a coppie, leggermente ritorti",
        "Needles in pairs, slightly twisted"
      ),
      l4(
        "Fuchsrote Rinde im oberen Stamm",
        "Écorce roux orangé en haut du tronc",
        "Corteccia rosso volpe nella parte alta",
        "Fox-red bark on the upper trunk"
      ),
      l4(
        "Lockere, schirmartige Krone",
        "Couronne claire, en forme de parasol",
        "Chioma rada, a ombrello",
        "Open, umbrella-like crown"
      ),
    ],
  },
  {
    id: "vogelbeere",
    name: l4(
      "Vogelbeere",
      "Sorbier des oiseleurs",
      "Sorbo degli uccellatori",
      "Rowan"
    ),
    latinOrExtra: "Sorbus aucuparia",
    category: "baeume",
    season: { from: 5, to: 10 },
    description: l4(
      "Ein kleiner Baum mit gefiederten Blättern aus 9 bis 19 gezähnten Blättchen – fast wie eine Feder. Ab August hängen leuchtend orangerote Beerendolden daran, die man von Weitem sieht.",
      "Un petit arbre aux feuilles composées de 9 à 19 folioles dentées – presque comme une plume. Dès août, il porte des grappes de baies orange vif visibles de loin.",
      "Un piccolo albero con foglie composte da 9 a 19 foglioline dentate – quasi come una piuma. Da agosto porta grappoli di bacche rosso-arancio che si vedono da lontano.",
      "A small tree with pinnate leaves made of 9 to 19 toothed leaflets – almost like a feather. From August it carries clusters of bright orange-red berries visible from afar."
    ),
    funFact: l4(
      "Über 60 Vogelarten fressen die Beeren. Roh schmecken sie uns Menschen bitter – gekocht werden sie zu Gelee.",
      "Plus de 60 espèces d'oiseaux mangent ces baies. Crues, elles nous paraissent amères – cuites, elles deviennent de la gelée.",
      "Più di 60 specie di uccelli mangiano queste bacche. Crude a noi sembrano amare – cotte diventano gelatina.",
      "More than 60 bird species eat the berries. Raw they taste bitter to us – cooked they turn into jelly."
    ),
    kidQuestion: l4(
      "Beobachte einen Vogelbeerbaum im Herbst: Welche Vögel kommen zum Naschen? (Du selbst probierst nichts roh!)",
      "Observe un sorbier en automne : quels oiseaux viennent se régaler ? (Toi, tu ne goûtes rien de cru !)",
      "Osserva un sorbo in autunno: quali uccelli vengono a mangiare? (Tu però non assaggi niente di crudo!)",
      "Watch a rowan in autumn: which birds come for a snack? (You don't taste anything raw yourself!)"
    ),
    features: [
      l4(
        "Gefiederte Blätter mit vielen Blättchen",
        "Feuilles composées de nombreuses folioles",
        "Foglie composte da tante foglioline",
        "Pinnate leaves with many leaflets"
      ),
      l4(
        "Orangerote Beerendolden ab August",
        "Grappes de baies orange dès août",
        "Grappoli di bacche arancioni da agosto",
        "Orange-red berry clusters from August"
      ),
      l4(
        "Wächst bis weit hinauf in die Berge",
        "Pousse très haut en altitude",
        "Cresce fin molto in alto in montagna",
        "Grows high up into the mountains"
      ),
    ],
  },
];
