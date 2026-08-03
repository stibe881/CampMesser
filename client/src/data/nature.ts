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

export type NatureCategoryId =
  "tierspuren" | "sternbilder" | "baeume" | "pilze" | "beeren";

/**
 * Giftiger Doppelgänger eines Speisepilzes (#237). Steht bei Pilz-Einträgen
 * ZWINGEND – ein Pilzeintrag ohne Verwechslungsgefahr wäre fahrlässig.
 */
export interface NatureLookalike {
  name: L4;
  /** Wissenschaftlicher Name – sprachneutral. */
  latin: string;
  /** Woran du den Doppelgänger erkennst und was er anrichtet. */
  warning: L4;
}

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
  /** Wo der Eintrag wächst bzw. vorkommt (Saisonkalender #237). */
  habitat?: L4;
  /** Wofür man ihn verwendet (Saisonkalender #237). */
  use?: L4;
  /** Giftige Doppelgänger – bei Pilzen Pflicht. */
  lookalikes?: NatureLookalike[];
}

export interface NatureCategory {
  id: NatureCategoryId;
  label: L4;
  icon: string;
  intro: L4;
  /**
   * Ernst gemeinte Sicherheits-Warnung der Kategorie (Pilze und Beeren) –
   * wird über der Liste angezeigt, nicht bloss im Kleingedruckten.
   */
  warning?: L4;
  /** Hinweis auf kantonale Sammelbeschränkungen. */
  rulesHint?: L4;
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
  {
    id: "pilze",
    label: l4("Pilze", "Champignons", "Funghi", "Mushrooms"),
    icon: "Sprout",
    intro: l4(
      "Wann wächst was? Die gängigen Speisepilze mit Saison, Fundort – und ihren giftigen Doppelgängern.",
      "Quand pousse quoi ? Les champignons comestibles courants avec leur saison, leur habitat – et leurs sosies toxiques.",
      "Quando cresce cosa? I funghi commestibili più comuni con stagione, habitat – e i loro sosia velenosi.",
      "What grows when? The common edible mushrooms with season, habitat – and their poisonous look-alikes."
    ),
    warning: l4(
      "Iss nur, was du sicher bestimmt hast. Diese Seite ersetzt keine Bestimmung: Ein paar Zeilen Text und ein Merkmal reichen nie, um einen Pilz freizugeben. Der Grüne Knollenblätterpilz wird regelmässig mit Champignons und Täublingen verwechselt und ist schon in kleiner Menge tödlich – Symptome kommen oft erst nach Stunden, wenn das Gift die Leber bereits angreift. Im geringsten Zweifel: nicht essen, sondern den ganzen Fund der amtlichen Pilzkontrollstelle deiner Gemeinde zeigen. Sie ist gratis oder kostet wenig. Bei Verdacht auf eine Vergiftung: Tox Info Suisse 145.",
      "Ne mange que ce que tu as identifié avec certitude. Cette page ne remplace pas une détermination : quelques lignes et un seul critère ne suffisent jamais à libérer un champignon. L'amanite phalloïde est régulièrement confondue avec des champignons de couche et des russules et elle est mortelle en petite quantité – les symptômes n'arrivent souvent qu'après plusieurs heures, quand le poison attaque déjà le foie. Au moindre doute : ne pas manger, mais montrer toute la récolte au contrôle officiel des champignons de ta commune. Il est gratuit ou peu coûteux. En cas de suspicion d'intoxication : Tox Info Suisse 145.",
      "Mangia solo ciò che hai identificato con certezza. Questa pagina non sostituisce una determinazione: poche righe e un solo carattere non bastano mai per liberare un fungo. L'amanita falloide viene regolarmente confusa con prataioli e russule ed è mortale già in piccola quantità – i sintomi arrivano spesso solo dopo ore, quando il veleno attacca già il fegato. Al minimo dubbio: non mangiare, ma mostrare tutto il raccolto all'ispettorato ufficiale dei funghi del tuo comune. È gratuito o costa poco. In caso di sospetta intossicazione: Tox Info Suisse 145.",
      "Only eat what you have identified with certainty. This page does not replace identification: a few lines of text and one feature are never enough to clear a mushroom. The death cap is regularly mistaken for field mushrooms and brittlegills and is lethal in small amounts – symptoms often appear only after hours, when the toxin is already attacking the liver. At the slightest doubt: do not eat it, take the whole find to your municipality's official mushroom inspection service. It is free or costs little. If you suspect poisoning: Tox Info Suisse 145."
    ),
    rulesHint: l4(
      "Sammeln ist kantonal geregelt: Viele Kantone kennen eine Mengenbegrenzung (verbreitet 1 kg pro Person und Tag), Schonzeiten in den ersten Tagen jedes Monats und Sammelverbote in Schutzgebieten und Reservaten. Prüf vor dem Sammeln die Regeln deines Kantons und der Gemeinde.",
      "La cueillette est réglée par les cantons : de nombreux cantons connaissent une limite de quantité (couramment 1 kg par personne et par jour), des périodes de protection les premiers jours de chaque mois et des interdictions de cueillette dans les zones protégées et les réserves. Vérifie les règles de ton canton et de ta commune avant de cueillir.",
      "La raccolta è regolata dai cantoni: molti cantoni prevedono un limite di quantità (di solito 1 kg per persona al giorno), periodi di divieto nei primi giorni di ogni mese e divieti di raccolta nelle zone protette e nelle riserve. Prima di raccogliere controlla le regole del tuo cantone e del comune.",
      "Picking is regulated by the cantons: many cantons have a quantity limit (commonly 1 kg per person per day), closed periods in the first days of each month and picking bans in protected areas and reserves. Check the rules of your canton and municipality before you pick."
    ),
  },
  {
    id: "beeren",
    label: l4(
      "Wildbeeren",
      "Baies sauvages",
      "Bacche selvatiche",
      "Wild berries"
    ),
    icon: "Cherry",
    intro: l4(
      "Von der Heidelbeere im Juli bis zur Schlehe nach dem ersten Frost – wann du was am Wegrand findest.",
      "De la myrtille en juillet à la prunelle après les premières gelées – ce que tu trouves quand au bord du chemin.",
      "Dal mirtillo di luglio alla prugnola dopo la prima gelata – cosa trovi e quando lungo il sentiero.",
      "From bilberries in July to sloes after the first frost – what you find by the wayside and when."
    ),
    warning: l4(
      "Auch bei Beeren gilt: nur essen, was du sicher bestimmt hast. Tollkirsche, Seidelbast, Aronstab und Zaunrübe stehen an denselben Wegrändern und sind giftig, für Kinder schon in kleiner Menge. Beeren gut waschen – der Fuchsbandwurm ist selten, aber die Vorsicht kostet nichts. Bei Verdacht auf eine Vergiftung: Tox Info Suisse 145.",
      "Pour les baies aussi : ne mange que ce que tu as identifié avec certitude. Belladone, daphné, arum et bryone poussent aux mêmes bords de chemin et sont toxiques, pour les enfants déjà en petite quantité. Lave bien les baies – l'échinocoque est rare, mais la prudence ne coûte rien. En cas de suspicion d'intoxication : Tox Info Suisse 145.",
      "Anche per le bacche vale: mangia solo ciò che hai identificato con certezza. Belladonna, dafne, gigaro e brionia crescono sugli stessi bordi di sentiero e sono velenosi, per i bambini già in piccola quantità. Lava bene le bacche – l'echinococco è raro, ma la prudenza non costa nulla. In caso di sospetta intossicazione: Tox Info Suisse 145.",
      "Berries too: only eat what you have identified with certainty. Deadly nightshade, mezereon, lords-and-ladies and white bryony grow along the same paths and are poisonous, for children even in small amounts. Wash berries well – the fox tapeworm is rare, but caution costs nothing. If you suspect poisoning: Tox Info Suisse 145."
    ),
    rulesHint: l4(
      "Auch fürs Beerensammeln gelten kantonale Regeln: meist eine Handmenge für den Eigengebrauch, in Schutzgebieten und Reservaten oft gar nichts. Auf Privatgrund fragst du zuerst.",
      "La cueillette des baies suit aussi des règles cantonales : le plus souvent une quantité pour la consommation personnelle, et rien du tout dans les zones protégées et les réserves. Sur terrain privé, demande d'abord.",
      "Anche per le bacche valgono regole cantonali: di solito una quantità per il consumo proprio, nelle zone protette e nelle riserve spesso nulla. Su terreno privato chiedi prima.",
      "Berry picking follows cantonal rules too: usually a hand-picked amount for your own use, and nothing at all in protected areas and reserves. On private land, ask first."
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
  // ── Pilze (#237) ──
  {
    id: "steinpilz",
    name: l4("Steinpilz", "Cèpe de Bordeaux", "Porcino", "Penny bun"),
    latinOrExtra: "Boletus edulis",
    category: "pilze",
    season: { from: 7, to: 10 },
    description: l4(
      "Der bekannteste Röhrling: brauner, oft leicht klebriger Hut, darunter weisse bis grüngelbe Röhren statt Lamellen, und ein bauchiger heller Stiel mit feinem weissem Netz oben. Das Fleisch bleibt beim Anschneiden weiss.",
      "Le bolet le plus connu : chapeau brun, souvent un peu visqueux, dessous des tubes blancs à jaune verdâtre au lieu de lames, et un pied ventru clair portant un fin réseau blanc vers le haut. La chair reste blanche à la coupe.",
      "Il boleto più conosciuto: cappello bruno, spesso un po' vischioso, sotto tubuli bianchi o giallo-verdi invece delle lamelle, e un gambo panciuto chiaro con un fine reticolo bianco in alto. La carne resta bianca al taglio.",
      "The best-known bolete: brown, often slightly sticky cap, white to greenish-yellow tubes instead of gills underneath, and a bulbous pale stem with a fine white net at the top. The flesh stays white when cut."
    ),
    habitat: l4(
      "Fichten-, Buchen- und Eichenwälder, gern am Waldrand und an moosigen Böschungen, ab 800 m auch später im Jahr.",
      "Forêts d'épicéas, de hêtres et de chênes, volontiers en lisière et sur les talus moussus ; au-dessus de 800 m aussi plus tard dans l'année.",
      "Boschi di abete rosso, faggio e quercia, volentieri ai margini e su scarpate muschiose; sopra gli 800 m anche più tardi nell'anno.",
      "Spruce, beech and oak woods, often at the forest edge and on mossy banks; above 800 m also later in the year."
    ),
    use: l4(
      "Jung roh im Salat, sonst gebraten, als Risotto oder in Scheiben getrocknet – getrocknet wird das Aroma am stärksten.",
      "Jeune en salade crue, sinon poêlé, en risotto ou séché en lamelles – c'est séché que l'arôme est le plus fort.",
      "Da giovane crudo in insalata, altrimenti in padella, in risotto o essiccato a fette – essiccato l'aroma è più intenso.",
      "Young and raw in a salad, otherwise fried, in risotto or dried in slices – dried, the aroma is strongest."
    ),
    funFact: l4(
      "Ein Steinpilz wächst nicht aus dem Nichts: Unter dem Boden lebt sein Pilzgeflecht seit Jahren mit den Baumwurzeln zusammen und tauscht Wasser gegen Zucker.",
      "Un cèpe ne surgit pas de nulle part : sous le sol, son mycélium vit depuis des années avec les racines des arbres et échange de l'eau contre du sucre.",
      "Un porcino non nasce dal nulla: sotto terra il suo micelio vive da anni assieme alle radici degli alberi e scambia acqua con zucchero.",
      "A penny bun does not appear from nowhere: below ground its mycelium has lived with the tree roots for years, trading water for sugar."
    ),
    kidQuestion: l4(
      "Schau dir die Unterseite an: Siehst du feine Röhren wie ein Schwamm – oder Lamellen wie Buchseiten?",
      "Regarde le dessous : vois-tu de fins tubes comme une éponge – ou des lames comme les pages d'un livre ?",
      "Guarda la parte inferiore: vedi tubuli fini come una spugna – oppure lamelle come pagine di un libro?",
      "Look underneath: do you see fine tubes like a sponge – or gills like the pages of a book?"
    ),
    features: [
      l4(
        "Röhren statt Lamellen, weiss bis grüngelb",
        "Tubes au lieu de lames, blancs à jaune verdâtre",
        "Tubuli invece di lamelle, da bianchi a giallo-verdi",
        "Tubes instead of gills, white to greenish yellow"
      ),
      l4(
        "Heller Stiel mit feinem weissem Netz",
        "Pied clair avec un fin réseau blanc",
        "Gambo chiaro con fine reticolo bianco",
        "Pale stem with a fine white net"
      ),
      l4(
        "Fleisch bleibt beim Anschneiden weiss",
        "La chair reste blanche à la coupe",
        "La carne resta bianca al taglio",
        "Flesh stays white when cut"
      ),
    ],
    lookalikes: [
      {
        name: l4(
          "Gallenröhrling",
          "Bolet amer",
          "Boleto amaro",
          "Bitter bolete"
        ),
        latin: "Tylopilus felleus",
        warning: l4(
          "Nicht giftig, aber bitter wie Galle – ein einziger Hut verdirbt die ganze Pfanne. Erkennungszeichen: rosa angehauchte Röhren und ein grobes, dunkles Netz auf dem Stiel.",
          "Non toxique mais amer comme le fiel – un seul chapeau gâche toute la poêlée. Signes : tubes teintés de rose et réseau grossier et foncé sur le pied.",
          "Non velenoso ma amaro come il fiele – un solo cappello rovina l'intera padella. Segni: tubuli rosati e reticolo grossolano e scuro sul gambo.",
          "Not poisonous but bitter as gall – a single cap ruins the whole pan. Signs: pink-tinged tubes and a coarse, dark net on the stem."
        ),
      },
      {
        name: l4(
          "Satansröhrling",
          "Bolet Satan",
          "Boleto di Satana",
          "Devil's bolete"
        ),
        latin: "Rubroboletus satanas",
        warning: l4(
          "Giftig, führt zu heftigem Erbrechen. Heller Hut, aber rote Röhrenmündungen und ein rot geflammter Stiel; das Fleisch blaut beim Anschneiden. Wächst auf Kalk unter Eichen und Buchen.",
          "Toxique, provoque de violents vomissements. Chapeau clair, mais pores rouges et pied flammé de rouge ; la chair bleuit à la coupe. Pousse sur calcaire sous chênes et hêtres.",
          "Velenoso, provoca vomito violento. Cappello chiaro, ma pori rossi e gambo fiammato di rosso; la carne vira al blu al taglio. Cresce su calcare sotto querce e faggi.",
          "Poisonous, causes violent vomiting. Pale cap, but red pore mouths and a red-flamed stem; the flesh turns blue when cut. Grows on limestone under oaks and beeches."
        ),
      },
    ],
  },
  {
    id: "eierschwamm",
    name: l4(
      "Eierschwamm (Pfifferling)",
      "Girolle",
      "Finferlo (gallinaccio)",
      "Chanterelle"
    ),
    latinOrExtra: "Cantharellus cibarius",
    category: "pilze",
    season: { from: 6, to: 10 },
    description: l4(
      "Dottergelb von oben bis unten, trichterförmig mit welligem Rand. Unten keine echten Lamellen, sondern stumpfe Leisten, die weit am Stiel hinunterlaufen. Riecht deutlich nach Aprikose.",
      "Jaune d'œuf du chapeau au pied, en forme d'entonnoir à bord ondulé. Dessous, pas de vraies lames mais des plis épais qui descendent longuement sur le pied. Odeur nette d'abricot.",
      "Giallo tuorlo da cima a fondo, a imbuto con bordo ondulato. Sotto non ha vere lamelle ma pliche spesse che scendono a lungo sul gambo. Odore netto di albicocca.",
      "Egg-yellow from top to bottom, funnel-shaped with a wavy edge. Underneath there are no true gills but blunt ridges running far down the stem. Smells distinctly of apricot."
    ),
    habitat: l4(
      "Moos- und Heidelbeerpolster in Nadel- und Mischwäldern, oft truppweise an derselben Stelle über Jahre.",
      "Coussins de mousse et de myrtilles en forêts de conifères et mixtes, souvent en troupes au même endroit pendant des années.",
      "Cuscini di muschio e mirtillo in boschi di conifere e misti, spesso a gruppi nello stesso posto per anni.",
      "Moss and bilberry cushions in conifer and mixed woods, often in troops at the same spot for years."
    ),
    use: l4(
      "In Butter mit Zwiebeln gebraten, zu Rührei oder Rahmsauce. Nicht trocknen – er wird zäh; besser einfrieren nach kurzem Anbraten.",
      "Poêlée au beurre avec des oignons, avec des œufs brouillés ou en sauce à la crème. Ne pas sécher – il devient coriace ; mieux vaut le congeler après un rapide passage à la poêle.",
      "In padella con burro e cipolla, con uova strapazzate o in salsa di panna. Non essiccarlo – diventa coriaceo; meglio congelarlo dopo una breve rosolatura.",
      "Fried in butter with onions, with scrambled eggs or in a cream sauce. Do not dry it – it turns tough; better to freeze it after a quick fry."
    ),
    funFact: l4(
      "Eierschwämme werden fast nie madig: Sie enthalten Stoffe, die Insektenlarven fernhalten.",
      "Les girolles sont presque jamais véreuses : elles contiennent des substances qui tiennent les larves d'insectes à distance.",
      "I finferli non sono quasi mai bacati: contengono sostanze che tengono lontane le larve degli insetti.",
      "Chanterelles are almost never maggoty: they contain substances that keep insect larvae away."
    ),
    kidQuestion: l4(
      "Riech einmal daran: Findest du den Duft nach Aprikose?",
      "Sens-le une fois : trouves-tu le parfum d'abricot ?",
      "Annusalo: senti il profumo di albicocca?",
      "Give it a sniff: can you find the apricot scent?"
    ),
    features: [
      l4(
        "Durchgehend dottergelb, trichterförmig",
        "Entièrement jaune d'œuf, en entonnoir",
        "Tutto giallo tuorlo, a imbuto",
        "Egg-yellow throughout, funnel-shaped"
      ),
      l4(
        "Stumpfe Leisten statt scharfer Lamellen",
        "Plis épais au lieu de lames fines",
        "Pliche spesse invece di lamelle sottili",
        "Blunt ridges instead of sharp gills"
      ),
      l4(
        "Aprikosen-Duft, festes Fleisch",
        "Odeur d'abricot, chair ferme",
        "Odore di albicocca, carne soda",
        "Apricot scent, firm flesh"
      ),
    ],
    lookalikes: [
      {
        name: l4(
          "Falscher Pfifferling",
          "Fausse girolle",
          "Falso finferlo",
          "False chanterelle"
        ),
        latin: "Hygrophoropsis aurantiaca",
        warning: l4(
          "Orange statt dottergelb, mit echten, dünnen und gegabelten Lamellen und weichem Fleisch. Gilt als unverträglich und löst bei manchen Magen-Darm-Beschwerden aus.",
          "Orange au lieu de jaune d'œuf, avec de vraies lames fines et fourchues et une chair molle. Réputée indigeste, elle provoque chez certains des troubles digestifs.",
          "Arancione invece che giallo tuorlo, con vere lamelle sottili e forcate e carne molle. È considerato indigesto e in alcuni provoca disturbi gastrointestinali.",
          "Orange instead of egg-yellow, with true thin, forked gills and soft flesh. Considered indigestible and causes stomach upsets in some people."
        ),
      },
      {
        name: l4(
          "Ölbaumtrichterling",
          "Clitocybe de l'olivier",
          "Fungo dell'olivo",
          "Jack-o'-lantern"
        ),
        latin: "Omphalotus olearius",
        warning: l4(
          "Giftig, führt zu stundenlangem Erbrechen. Leuchtend orange, deutlich grösser, mit echten Lamellen; wächst büschelig an Stümpfen und Wurzeln von Laubbäumen, nie einzeln im Moos.",
          "Toxique, provoque des vomissements pendant des heures. Orange vif, nettement plus grand, avec de vraies lames ; pousse en touffes sur les souches et racines de feuillus, jamais isolé dans la mousse.",
          "Velenoso, provoca vomito per ore. Arancione acceso, decisamente più grande, con vere lamelle; cresce a ciuffi su ceppi e radici di latifoglie, mai isolato nel muschio.",
          "Poisonous, causes hours of vomiting. Bright orange, clearly larger, with true gills; grows in tufts on stumps and roots of broadleaf trees, never singly in moss."
        ),
      },
    ],
  },
  {
    id: "maronenroehrling",
    name: l4("Maronenröhrling", "Bolet bai", "Boleto baio", "Bay bolete"),
    latinOrExtra: "Imleria badia",
    category: "pilze",
    season: { from: 8, to: 11 },
    description: l4(
      "Kastanienbrauner, bei Nässe klebriger Hut. Die Röhren sind blassgelb und blauen auf Druck deutlich – das gehört dazu und ist kein Warnzeichen. Der Stiel ist braun faserig, ohne Netz.",
      "Chapeau brun châtaigne, visqueux par temps humide. Les tubes sont jaune pâle et bleuissent nettement à la pression – c'est normal, ce n'est pas un signal d'alarme. Le pied est brun fibrilleux, sans réseau.",
      "Cappello bruno castagna, vischioso con l'umidità. I tubuli sono giallo pallido e virano nettamente al blu alla pressione – è normale, non è un segnale d'allarme. Il gambo è bruno fibrilloso, senza reticolo.",
      "Chestnut-brown cap, sticky when damp. The tubes are pale yellow and turn distinctly blue when pressed – that is normal, not a warning sign. The stem is brown and fibrous, without a net."
    ),
    habitat: l4(
      "Nadelwälder, besonders unter Fichten auf saurem Boden; hält länger durch als der Steinpilz und steht oft bis in den November.",
      "Forêts de conifères, surtout sous les épicéas sur sol acide ; il tient plus longtemps que le cèpe et se trouve souvent jusqu'en novembre.",
      "Boschi di conifere, soprattutto sotto abeti rossi su suolo acido; resiste più a lungo del porcino e si trova spesso fino a novembre.",
      "Conifer woods, especially under spruce on acid soils; it lasts longer than the penny bun and often stands into November."
    ),
    use: l4(
      "Wie der Steinpilz zu verwenden, etwas milder. Junge Hüte trocknen gut, alte Röhren vor dem Kochen abziehen.",
      "S'utilise comme le cèpe, en un peu plus doux. Les jeunes chapeaux sèchent bien ; retire les tubes des vieux avant cuisson.",
      "Si usa come il porcino, un po' più delicato. I cappelli giovani si essiccano bene; togli i tubuli da quelli vecchi prima di cuocerli.",
      "Used like the penny bun, a little milder. Young caps dry well; strip the tubes from old ones before cooking."
    ),
    funFact: l4(
      "Das Blauen ist eine Reaktion mit dem Luftsauerstoff und verschwindet beim Kochen wieder.",
      "Le bleuissement est une réaction avec l'oxygène de l'air et disparaît à la cuisson.",
      "Il viraggio al blu è una reazione con l'ossigeno dell'aria e sparisce con la cottura.",
      "The blueing is a reaction with the oxygen in the air and disappears again when cooked."
    ),
    kidQuestion: l4(
      "Drück vorsichtig auf die Unterseite: Wird der Fleck blau?",
      "Appuie doucement sur le dessous : la tache devient-elle bleue ?",
      "Premi delicatamente la parte inferiore: la macchia diventa blu?",
      "Press the underside gently: does the mark turn blue?"
    ),
    features: [
      l4(
        "Kastanienbrauner, bei Nässe klebriger Hut",
        "Chapeau brun châtaigne, visqueux par temps humide",
        "Cappello bruno castagna, vischioso con l'umidità",
        "Chestnut-brown cap, sticky when damp"
      ),
      l4(
        "Blassgelbe Röhren, blauen auf Druck",
        "Tubes jaune pâle, bleuissant à la pression",
        "Tubuli giallo pallido, virano al blu alla pressione",
        "Pale yellow tubes, blueing when pressed"
      ),
      l4(
        "Brauner Stiel ohne Netz",
        "Pied brun sans réseau",
        "Gambo bruno senza reticolo",
        "Brown stem without a net"
      ),
    ],
    lookalikes: [
      {
        name: l4(
          "Gallenröhrling",
          "Bolet amer",
          "Boleto amaro",
          "Bitter bolete"
        ),
        latin: "Tylopilus felleus",
        warning: l4(
          "Steht im selben Wald und wird auch mit der Marone verwechselt: rosa Röhren, grobes Netz am Stiel, bitter. Eine Zungenspitze am rohen Fleisch verrät ihn – der Bissen wird danach ausgespuckt.",
          "Il pousse dans la même forêt et se confond aussi avec le bolet bai : tubes roses, réseau grossier sur le pied, amer. Une pointe de langue sur la chair crue le trahit – la bouchée est ensuite recrachée.",
          "Cresce nello stesso bosco e si confonde anche con il boleto baio: tubuli rosa, reticolo grossolano sul gambo, amaro. Una punta di lingua sulla carne cruda lo tradisce – il boccone va poi sputato.",
          "It grows in the same wood and is mistaken for the bay bolete too: pink tubes, coarse net on the stem, bitter. A touch of the tongue on the raw flesh gives it away – then spit it out."
        ),
      },
    ],
  },
  {
    id: "parasol",
    name: l4(
      "Parasol (Riesenschirmling)",
      "Coulemelle",
      "Mazza di tamburo",
      "Parasol mushroom"
    ),
    latinOrExtra: "Macrolepiota procera",
    category: "pilze",
    season: { from: 7, to: 10 },
    description: l4(
      "Bis 30 cm breiter Hut, beige mit groben braunen Schuppen und einem glatten Buckel in der Mitte. Der lange Stiel ist genattert wie eine Schlangenhaut und trägt einen verschiebbaren Ring. Junge Exemplare sehen aus wie ein Paukenschlägel.",
      "Chapeau jusqu'à 30 cm, beige à grosses écailles brunes et mamelon lisse au centre. Le long pied est zébré comme une peau de serpent et porte un anneau coulissant. Les jeunes ressemblent à une baguette de tambour.",
      "Cappello fino a 30 cm, beige con grosse squame brune e un umbone liscio al centro. Il gambo lungo è zebrato come pelle di serpente e porta un anello scorrevole. Gli esemplari giovani sembrano una bacchetta da tamburo.",
      "Cap up to 30 cm across, beige with coarse brown scales and a smooth boss in the middle. The long stem is snake-patterned and carries a movable ring. Young ones look like a drumstick."
    ),
    habitat: l4(
      "Wiesen, Weiden, Waldränder und lichte Wälder – gern dort, wo Gras und Wald aneinanderstossen.",
      "Prairies, pâturages, lisières et forêts claires – volontiers là où l'herbe et la forêt se touchent.",
      "Prati, pascoli, margini del bosco e boschi radi – volentieri dove erba e bosco si toccano.",
      "Meadows, pastures, forest edges and open woods – often where grass and forest meet."
    ),
    use: l4(
      "Der Klassiker: Hut paniert wie ein Schnitzel braten. Der zähe Stiel wird getrocknet und zu Pilzpulver gemahlen.",
      "Le classique : chapeau pané et poêlé comme une escalope. Le pied coriace se sèche et se moud en poudre de champignon.",
      "Il classico: cappello impanato e fritto come una cotoletta. Il gambo coriaceo si essicca e si macina in polvere di funghi.",
      "The classic: bread the cap and fry it like a schnitzel. The tough stem is dried and ground into mushroom powder."
    ),
    funFact: l4(
      "Der Ring lässt sich am Stiel hoch- und runterschieben wie ein Ring an einem Finger – das kann kein anderer heimischer Pilz.",
      "L'anneau se déplace le long du pied comme une bague sur un doigt – aucun autre champignon indigène ne fait cela.",
      "L'anello scorre su e giù lungo il gambo come un anello su un dito – nessun altro fungo nostrano lo fa.",
      "The ring slides up and down the stem like a ring on a finger – no other native mushroom does that."
    ),
    kidQuestion: l4(
      "Schau dir den Stiel an: Erkennst du das Muster einer Schlangenhaut?",
      "Regarde le pied : reconnais-tu le motif d'une peau de serpent ?",
      "Guarda il gambo: riconosci il disegno di una pelle di serpente?",
      "Look at the stem: can you make out a snakeskin pattern?"
    ),
    features: [
      l4(
        "Grosser beiger Hut mit braunen Schuppen",
        "Grand chapeau beige à écailles brunes",
        "Grande cappello beige con squame brune",
        "Large beige cap with brown scales"
      ),
      l4(
        "Genatterter Stiel, verschiebbarer Ring",
        "Pied zébré, anneau coulissant",
        "Gambo zebrato, anello scorrevole",
        "Snake-patterned stem, movable ring"
      ),
      l4(
        "Weisse Lamellen, weisser Sporenstaub",
        "Lames blanches, sporée blanche",
        "Lamelle bianche, sporata bianca",
        "White gills, white spore print"
      ),
    ],
    lookalikes: [
      {
        name: l4(
          "Grüner Knollenblätterpilz",
          "Amanite phalloïde",
          "Amanita falloide",
          "Death cap"
        ),
        latin: "Amanita phalloides",
        warning: l4(
          "TÖDLICH GIFTIG, schon ein halber Hut kann reichen. Er hat einen glatten, oliv-grünlichen Hut, weisse Lamellen, einen Ring UND unten eine häutige Scheide in einer Knolle – graben statt abschneiden, sonst siehst du die Knolle gar nie. Junge Parasole ohne aufgeschirmten Hut sind besonders heikel.",
          "MORTELLE, un demi-chapeau peut suffire. Chapeau lisse vert olivâtre, lames blanches, un anneau ET, à la base, une volve membraneuse dans un bulbe – déterre au lieu de couper, sinon tu ne verras jamais le bulbe. Les jeunes coulemelles au chapeau encore fermé sont particulièrement délicates.",
          "MORTALE, può bastare mezzo cappello. Cappello liscio verde oliva, lamelle bianche, un anello E alla base una volva membranosa in un bulbo – estrai invece di tagliare, altrimenti il bulbo non lo vedi mai. Le mazze di tamburo giovani, ancora chiuse, sono particolarmente insidiose.",
          "DEADLY POISONOUS, half a cap can be enough. Smooth olive-green cap, white gills, a ring AND a membranous sac in a bulb at the base – dig it up instead of cutting, or you will never see the bulb. Young parasols with an unopened cap are especially tricky."
        ),
      },
      {
        name: l4(
          "Gift-Riesenschirmling",
          "Lépiote brun-incarnat",
          "Lepiota velenosa",
          "Poisonous parasol"
        ),
        latin: "Chlorophyllum brunneum",
        warning: l4(
          "Verursacht heftige Magen-Darm-Beschwerden. Kleiner, mit gerandeter Knolle statt schlankem Stiel, und das Fleisch verfärbt sich beim Anschneiden orangerot bis braun. Wächst gern auf gedüngten Wiesen, Komposthaufen und in Gärten.",
          "Provoque de violents troubles digestifs. Plus petite, avec un bulbe marginé au lieu d'un pied élancé, et la chair vire à l'orange rougeâtre ou au brun à la coupe. Pousse volontiers sur prairies fumées, tas de compost et dans les jardins.",
          "Provoca forti disturbi gastrointestinali. Più piccola, con bulbo marginato invece di un gambo slanciato, e la carne vira all'arancio-rosso o al bruno al taglio. Cresce volentieri su prati concimati, cumuli di compost e nei giardini.",
          "Causes severe stomach and bowel upsets. Smaller, with a rimmed bulb instead of a slender stem, and the flesh turns orange-red to brown when cut. Likes manured meadows, compost heaps and gardens."
        ),
      },
    ],
  },
  {
    id: "morchel",
    name: l4("Speisemorchel", "Morille", "Spugnola", "Morel"),
    latinOrExtra: "Morchella esculenta",
    category: "pilze",
    season: { from: 3, to: 5 },
    description: l4(
      "Ein Frühlingspilz mit wabenförmigem, gelbbraunem Hut – wie ein kleiner Schwamm auf einem hohlen weisslichen Stiel. Wichtig: Hut und Stiel sind INNEN durchgehend hohl, ohne Wattefüllung.",
      "Un champignon de printemps au chapeau alvéolé brun-jaune – comme une petite éponge sur un pied blanchâtre creux. Important : chapeau et pied sont creux à l'intérieur, sans bourre cotonneuse.",
      "Un fungo di primavera con cappello alveolato bruno-giallo – come una piccola spugna su un gambo biancastro cavo. Importante: cappello e gambo sono cavi all'interno, senza imbottitura cotonosa.",
      "A spring mushroom with a honeycombed yellow-brown cap – like a small sponge on a hollow whitish stem. Important: cap and stem are hollow inside, with no cottony filling."
    ),
    habitat: l4(
      "Auenwälder, Eschen- und Ulmenbestände, Obstgärten, Rindenmulch und Brandstellen – oft an überraschenden Orten in Siedlungsnähe.",
      "Forêts alluviales, peuplements de frênes et d'ormes, vergers, paillis d'écorce et places à feu – souvent à des endroits surprenants près des habitations.",
      "Boschi golenali, frassineti e olmeti, frutteti, corteccia sminuzzata e zone bruciate – spesso in luoghi sorprendenti vicino agli abitati.",
      "Floodplain woods, ash and elm stands, orchards, bark mulch and old fire sites – often in surprising places near settlements."
    ),
    use: l4(
      "IMMER durchgaren – roh und ungenügend gekocht sind Morcheln unverträglich. Klassisch in Rahmsauce; sie trocknen sehr gut.",
      "TOUJOURS bien cuire – crues ou insuffisamment cuites, les morilles sont indigestes. Classiquement en sauce à la crème ; elles sèchent très bien.",
      "SEMPRE ben cotte – crude o poco cotte le spugnole sono indigeste. Classiche in salsa di panna; si essiccano molto bene.",
      "ALWAYS cook them through – raw or undercooked, morels are indigestible. Classically in a cream sauce; they dry very well."
    ),
    funFact: l4(
      "Nach einem Waldbrand oder auf frischem Rindenmulch schiessen Morcheln oft massenhaft aus dem Boden – ein Jahr später ist wieder nichts.",
      "Après un incendie de forêt ou sur un paillis d'écorce frais, les morilles sortent souvent en masse – un an plus tard, plus rien.",
      "Dopo un incendio boschivo o su corteccia fresca le spugnole spuntano spesso in massa – un anno dopo non c'è più nulla.",
      "After a forest fire or on fresh bark mulch, morels often erupt in numbers – a year later there is nothing again."
    ),
    kidQuestion: l4(
      "Schneide ihn längs durch (mit einer erwachsenen Person): Ist er innen ganz hohl?",
      "Coupe-le en deux dans la longueur (avec un adulte) : est-il entièrement creux à l'intérieur ?",
      "Taglialo per il lungo (con un adulto): è completamente cavo all'interno?",
      "Cut it lengthwise (with a grown-up): is it completely hollow inside?"
    ),
    features: [
      l4(
        "Wabenförmiger Hut mit Gruben und Rippen",
        "Chapeau alvéolé à fossettes et côtes",
        "Cappello alveolato con fossette e costole",
        "Honeycombed cap with pits and ribs"
      ),
      l4(
        "Hut und Stiel innen durchgehend hohl",
        "Chapeau et pied creux d'un bout à l'autre",
        "Cappello e gambo cavi da cima a fondo",
        "Cap and stem hollow all the way through"
      ),
      l4(
        "Hut ist mit dem Stiel verwachsen",
        "Chapeau soudé au pied",
        "Cappello saldato al gambo",
        "Cap fused to the stem"
      ),
    ],
    lookalikes: [
      {
        name: l4(
          "Frühjahrslorchel",
          "Gyromitre comestible",
          "Falsa spugnola",
          "False morel"
        ),
        latin: "Gyromitra esculenta",
        warning: l4(
          "Giftig, das Gyromitrin schädigt die Leber und gilt als krebserregend – auch das Kochwasser und der Dampf sind gefährlich. Der Hut ist nicht wabig, sondern hirnartig gewunden und rotbraun, das Innere kammerig statt hohl. Wächst zur gleichen Zeit unter Kiefern.",
          "Toxique : la gyromitrine attaque le foie et est considérée comme cancérogène – l'eau de cuisson et la vapeur sont aussi dangereuses. Le chapeau n'est pas alvéolé mais circonvolu comme un cerveau et brun-rouge, l'intérieur cloisonné au lieu d'être creux. Pousse en même temps sous les pins.",
          "Velenosa: la girometrina danneggia il fegato ed è considerata cancerogena – anche l'acqua di cottura e il vapore sono pericolosi. Il cappello non è alveolato ma circonvoluto come un cervello e bruno-rosso, l'interno è camerato invece che cavo. Cresce nello stesso periodo sotto i pini.",
          "Poisonous: gyromitrin damages the liver and is considered carcinogenic – the cooking water and the steam are dangerous too. The cap is not honeycombed but brain-like and red-brown, the inside chambered rather than hollow. Grows at the same time under pines."
        ),
      },
    ],
  },
  {
    id: "herbsttrompete",
    name: l4(
      "Herbsttrompete (Totentrompete)",
      "Trompette-des-morts",
      "Trombetta dei morti",
      "Horn of plenty"
    ),
    latinOrExtra: "Craterellus cornucopioides",
    category: "pilze",
    season: { from: 8, to: 11 },
    description: l4(
      "Ein dünnfleischiger, grauschwarzer Trichter, der oben offen ist und bis zum Boden durchgeht – wie ein kleines Horn. Aussen glatt bis leicht runzlig, ohne Lamellen. Im nassen Laub praktisch unsichtbar.",
      "Un entonnoir gris-noir à chair fine, ouvert en haut et creux jusqu'en bas – comme une petite corne. Extérieur lisse à légèrement ridé, sans lames. Presque invisible dans les feuilles mouillées.",
      "Un imbuto grigio-nero dalla carne sottile, aperto in alto e cavo fino in fondo – come un piccolo corno. Esterno liscio o leggermente rugoso, senza lamelle. Nelle foglie bagnate è quasi invisibile.",
      "A thin-fleshed, grey-black funnel, open at the top and hollow to the base – like a small horn. Smooth to slightly wrinkled outside, without gills. Practically invisible in wet leaf litter."
    ),
    habitat: l4(
      "Buchen- und Eichenwälder auf kalkhaltigem Boden, in Gruppen im Laub – wer eine findet, findet meist zwanzig.",
      "Hêtraies et chênaies sur sol calcaire, en groupes dans les feuilles – qui en trouve une en trouve souvent vingt.",
      "Faggete e querceti su suolo calcareo, a gruppi tra le foglie – chi ne trova una ne trova spesso venti.",
      "Beech and oak woods on limy soils, in groups in the litter – find one and you usually find twenty."
    ),
    use: l4(
      "Getrocknet und gemahlen ein kräftiges Würzpulver; frisch in Rahmsaucen und Risotto. Vor dem Kochen der Länge nach aufschneiden und ausspülen – im Trichter sitzen Nadeln und Schnecken.",
      "Séchée et moulue, une poudre aromatique puissante ; fraîche en sauce à la crème et en risotto. Avant la cuisson, la fendre dans la longueur et la rincer – aiguilles et limaces logent dans l'entonnoir.",
      "Essiccata e macinata è una polvere aromatica intensa; fresca in salse di panna e risotto. Prima di cuocerla tagliala per il lungo e sciacquala – nell'imbuto stanno aghi e lumache.",
      "Dried and ground it makes a powerful seasoning powder; fresh it suits cream sauces and risotto. Before cooking, cut it lengthwise and rinse – needles and slugs sit inside the funnel."
    ),
    funFact: l4(
      "Der düstere Name kommt vom Aussehen und von der Saison um Allerheiligen – gefährlich ist an ihr nichts.",
      "Le nom lugubre vient de son apparence et de sa saison autour de la Toussaint – elle n'a rien de dangereux.",
      "Il nome lugubre viene dall'aspetto e dalla stagione attorno a Ognissanti – di pericoloso non ha nulla.",
      "The gloomy name comes from its looks and its season around All Saints' Day – there is nothing dangerous about it."
    ),
    kidQuestion: l4(
      "Knie dich hin und schau ins Laub: Wie viele Trompeten entdeckst du auf einem Quadratmeter?",
      "Mets-toi à genoux et regarde dans les feuilles : combien de trompettes découvres-tu sur un mètre carré ?",
      "Inginocchiati e guarda tra le foglie: quante trombette scopri su un metro quadrato?",
      "Kneel down and look into the leaves: how many horns can you spot on one square metre?"
    ),
    features: [
      l4(
        "Grauschwarzer, bis unten hohler Trichter",
        "Entonnoir gris-noir, creux jusqu'en bas",
        "Imbuto grigio-nero, cavo fino in fondo",
        "Grey-black funnel, hollow to the base"
      ),
      l4(
        "Aussen glatt bis runzlig, keine Lamellen",
        "Extérieur lisse à ridé, sans lames",
        "Esterno liscio o rugoso, senza lamelle",
        "Smooth to wrinkled outside, no gills"
      ),
      l4(
        "Dünnes, brüchiges Fleisch",
        "Chair mince et cassante",
        "Carne sottile e fragile",
        "Thin, brittle flesh"
      ),
    ],
    lookalikes: [
      {
        name: l4(
          "Trompetenpfifferling",
          "Chanterelle en tube",
          "Finferla",
          "Yellowfoot"
        ),
        latin: "Craterellus tubaeformis",
        warning: l4(
          "Ebenfalls essbar, darum harmlos zu verwechseln: gelber Stiel und deutliche Leisten aussen. Die eigentliche Gefahr liegt woanders – im dunklen Laub greift man schnell daneben. Nimm jeden Pilz einzeln in die Hand, bevor er in den Korb wandert.",
          "Également comestible, la confusion est donc sans danger : pied jaune et plis marqués à l'extérieur. Le vrai risque est ailleurs – dans les feuilles sombres, on attrape vite autre chose. Prends chaque champignon en main avant de le mettre au panier.",
          "Anch'essa commestibile, quindi la confusione è innocua: gambo giallo e pliche evidenti all'esterno. Il vero pericolo è altrove – tra le foglie scure si afferra in fretta qualcos'altro. Prendi in mano ogni fungo prima di metterlo nel cesto.",
          "Also edible, so the mix-up is harmless: yellow stem and clear ridges outside. The real risk lies elsewhere – in dark litter you easily grab something else. Pick up every mushroom individually before it goes into the basket."
        ),
      },
    ],
  },
  // ── Wildbeeren (#237) ──
  {
    id: "heidelbeere",
    name: l4("Heidelbeere", "Myrtille", "Mirtillo", "Bilberry"),
    latinOrExtra: "Vaccinium myrtillus",
    category: "beeren",
    season: { from: 7, to: 9 },
    description: l4(
      "Ein kniehoher Zwergstrauch mit kantigen grünen Zweigen und kleinen, blau bereiften Beeren. Das Fruchtfleisch ist innen dunkelviolett – daher die blaue Zunge.",
      "Un sous-arbrisseau à hauteur de genou, aux rameaux verts anguleux et aux petites baies bleutées. La chair est violet foncé à l'intérieur – d'où la langue bleue.",
      "Un arbusto nano alto fino al ginocchio, con rametti verdi spigolosi e piccole bacche pruinose di blu. La polpa è viola scuro all'interno – da qui la lingua blu.",
      "A knee-high dwarf shrub with angular green twigs and small, blue-bloomed berries. The flesh is dark purple inside – hence the blue tongue."
    ),
    habitat: l4(
      "Saure Böden in Nadelwäldern und auf Bergweiden, von etwa 500 bis über 2000 m; je höher, desto später reif.",
      "Sols acides en forêts de conifères et sur les pâturages de montagne, d'environ 500 à plus de 2000 m ; plus c'est haut, plus c'est tardif.",
      "Suoli acidi nei boschi di conifere e sui pascoli di montagna, da circa 500 a oltre 2000 m; più in alto, più tardi maturano.",
      "Acid soils in conifer woods and on mountain pastures, from about 500 to over 2000 m; the higher up, the later they ripen."
    ),
    use: l4(
      "Roh, als Konfitüre, im Kuchen oder als Sirup. Waschen, bevor du sie isst.",
      "Crues, en confiture, en gâteau ou en sirop. Lave-les avant de les manger.",
      "Crudi, in confettura, nella torta o come sciroppo. Lavali prima di mangiarli.",
      "Raw, as jam, in a cake or as a cordial. Wash them before eating."
    ),
    funFact: l4(
      "Die Kulturheidelbeere aus dem Laden ist innen hell – nur die wilde Heidelbeere färbt Zunge und Finger blau.",
      "La myrtille cultivée du magasin est claire à l'intérieur – seule la myrtille sauvage colore la langue et les doigts en bleu.",
      "Il mirtillo coltivato del negozio è chiaro all'interno – solo quello selvatico colora lingua e dita di blu.",
      "The cultivated blueberry from the shop is pale inside – only the wild bilberry turns your tongue and fingers blue."
    ),
    kidQuestion: l4(
      "Streck nach drei Beeren die Zunge heraus: Welche Farbe hat sie?",
      "Après trois baies, tire la langue : de quelle couleur est-elle ?",
      "Dopo tre bacche tira fuori la lingua: di che colore è?",
      "After three berries, stick out your tongue: what colour is it?"
    ),
    features: [
      l4(
        "Kantige, immergrün wirkende Zweige",
        "Rameaux anguleux, d'aspect toujours vert",
        "Rametti spigolosi, d'aspetto sempreverde",
        "Angular twigs that look evergreen"
      ),
      l4(
        "Beeren einzeln in den Blattachseln",
        "Baies isolées à l'aisselle des feuilles",
        "Bacche singole all'ascella delle foglie",
        "Berries singly in the leaf axils"
      ),
      l4(
        "Fruchtfleisch dunkelviolett",
        "Chair violet foncé",
        "Polpa viola scuro",
        "Dark purple flesh"
      ),
    ],
    lookalikes: [
      {
        name: l4("Tollkirsche", "Belladone", "Belladonna", "Deadly nightshade"),
        latin: "Atropa belladonna",
        warning: l4(
          "Hochgiftig, für Kinder können wenige Beeren tödlich sein. Sie sitzt an einer mannshohen Staude, ist einzeln, kirschgross, glänzend schwarz und steht auf einem fünfzipfligen grünen Kelchstern – nie an einem kniehohen Zwergstrauch.",
          "Très toxique ; pour les enfants, quelques baies peuvent être mortelles. Elle pousse sur une grande plante herbacée, isolée, de la taille d'une cerise, noir brillant, posée sur un calice vert à cinq pointes – jamais sur un sous-arbrisseau bas.",
          "Molto velenosa; per i bambini poche bacche possono essere mortali. Sta su una pianta erbacea alta, è singola, grossa come una ciliegia, nero lucido e poggia su un calice verde a cinque punte – mai su un arbusto nano basso.",
          "Highly poisonous; for children a few berries can be lethal. It sits on a tall herb, singly, cherry-sized, glossy black, on a five-pointed green calyx – never on a knee-high dwarf shrub."
        ),
      },
    ],
  },
  {
    id: "brombeere",
    name: l4("Brombeere", "Mûre sauvage", "Mora di rovo", "Blackberry"),
    latinOrExtra: "Rubus fruticosus",
    category: "beeren",
    season: { from: 8, to: 10 },
    description: l4(
      "Ein rankender Strauch mit kräftigen, gebogenen Stacheln. Die Sammelfrucht ist glänzend schwarz und lässt sich nur mitsamt dem weissen Fruchtboden pflücken – der bleibt in der Beere.",
      "Un arbuste sarmenteux aux aiguillons robustes et recourbés. Le fruit composé est noir brillant et ne se cueille qu'avec le réceptacle blanc – qui reste dans la baie.",
      "Un arbusto rampicante con aculei robusti e ricurvi. Il frutto composto è nero lucido e si stacca solo assieme al ricettacolo bianco – che resta nella bacca.",
      "A scrambling shrub with strong, curved prickles. The aggregate fruit is glossy black and comes away only with the white core – which stays inside the berry."
    ),
    habitat: l4(
      "Waldränder, Hecken, Bahndämme und Brachflächen bis etwa 1500 m – oft in undurchdringlichen Dickichten.",
      "Lisières, haies, talus de chemin de fer et friches jusque vers 1500 m – souvent en fourrés impénétrables.",
      "Margini del bosco, siepi, scarpate ferroviarie e incolti fino a circa 1500 m – spesso in boscaglie impenetrabili.",
      "Forest edges, hedges, railway embankments and waste ground up to about 1500 m – often in impenetrable thickets."
    ),
    use: l4(
      "Roh, als Konfitüre oder Sirup; die jungen Blätter geben einen guten Tee.",
      "Crues, en confiture ou en sirop ; les jeunes feuilles donnent une bonne tisane.",
      "Crude, in confettura o sciroppo; le foglie giovani danno un buon infuso.",
      "Raw, as jam or cordial; the young leaves make a good tea."
    ),
    funFact: l4(
      "Brombeeren bilden ihre Samen oft ohne Befruchtung – deshalb gibt es in Europa Hunderte fast gleich aussehender Kleinarten.",
      "Les mûres forment souvent leurs graines sans fécondation – d'où des centaines de micro-espèces presque identiques en Europe.",
      "I rovi formano spesso i semi senza fecondazione – per questo in Europa esistono centinaia di microspecie quasi identiche.",
      "Blackberries often set seed without fertilisation – which is why Europe has hundreds of nearly identical microspecies."
    ),
    kidQuestion: l4(
      "Fahr vorsichtig mit dem Finger den Zweig entlang: In welche Richtung zeigen die Stacheln?",
      "Passe prudemment le doigt le long de la tige : dans quelle direction pointent les aiguillons ?",
      "Passa con cautela il dito lungo il ramo: in che direzione puntano gli aculei?",
      "Run a finger carefully along the stem: which way do the prickles point?"
    ),
    features: [
      l4(
        "Kräftige, gebogene Stacheln am Trieb",
        "Aiguillons robustes et recourbés sur la tige",
        "Aculei robusti e ricurvi sul fusto",
        "Strong, curved prickles on the stem"
      ),
      l4(
        "Glänzend schwarze Sammelfrucht",
        "Fruit composé noir brillant",
        "Frutto composto nero lucido",
        "Glossy black aggregate fruit"
      ),
      l4(
        "Weisser Fruchtboden bleibt in der Beere",
        "Le réceptacle blanc reste dans la baie",
        "Il ricettacolo bianco resta nella bacca",
        "The white core stays inside the berry"
      ),
    ],
  },
  {
    id: "himbeere",
    name: l4("Himbeere", "Framboise sauvage", "Lampone", "Raspberry"),
    latinOrExtra: "Rubus idaeus",
    category: "beeren",
    season: { from: 6, to: 8 },
    description: l4(
      "Aufrechte Ruten mit feinen, weichen Stacheln und unterseits weissfilzigen Blättern. Die rote Sammelfrucht löst sich als hohler Fingerhut vom Fruchtboden – der bleibt am Strauch.",
      "Tiges dressées à fins aiguillons souples et feuilles blanches tomenteuses dessous. Le fruit rouge se détache comme un dé à coudre creux – le réceptacle reste sur la plante.",
      "Fusti eretti con aculei fini e morbidi e foglie bianco-tomentose sotto. Il frutto rosso si stacca come un ditale cavo – il ricettacolo resta sulla pianta.",
      "Upright canes with fine, soft prickles and leaves white-felted underneath. The red fruit comes off like a hollow thimble – the core stays on the plant."
    ),
    habitat: l4(
      "Schlagflächen, Lawinenzüge, Waldränder und Lichtungen bis über 2000 m – überall dort, wo Licht in den Wald fällt.",
      "Coupes, couloirs d'avalanche, lisières et clairières jusqu'au-dessus de 2000 m – partout où la lumière entre en forêt.",
      "Tagliate, canaloni da valanga, margini e radure fin oltre i 2000 m – ovunque la luce entri nel bosco.",
      "Clear-cuts, avalanche tracks, forest edges and clearings up to over 2000 m – wherever light reaches the forest floor."
    ),
    use: l4(
      "Roh, als Konfitüre, Sirup oder im Dessert. Sie hält sich kaum einen Tag – gleich verarbeiten.",
      "Crue, en confiture, en sirop ou en dessert. Elle ne tient guère une journée – à travailler tout de suite.",
      "Crudo, in confettura, sciroppo o dessert. Si conserva a malapena un giorno – lavoralo subito.",
      "Raw, as jam, cordial or in a dessert. It barely keeps a day – process it straight away."
    ),
    funFact: l4(
      "Der hohle Fingerhut ist das sicherste Erkennungszeichen: Bleibt der weisse Zapfen am Strauch, hast du eine Himbeere.",
      "Le dé à coudre creux est le signe le plus sûr : si le cône blanc reste sur la plante, tu as une framboise.",
      "Il ditale cavo è il segno più sicuro: se il cono bianco resta sulla pianta, hai un lampone.",
      "The hollow thimble is the surest sign: if the white cone stays on the plant, you have a raspberry."
    ),
    kidQuestion: l4(
      "Zieh eine reife Beere ab: Bleibt der weisse Zapfen am Strauch zurück?",
      "Cueille une baie mûre : le cône blanc reste-t-il sur la plante ?",
      "Stacca una bacca matura: il cono bianco resta sulla pianta?",
      "Pull off a ripe berry: does the white cone stay on the plant?"
    ),
    features: [
      l4(
        "Aufrechte Ruten mit weichen Stacheln",
        "Tiges dressées à aiguillons souples",
        "Fusti eretti con aculei morbidi",
        "Upright canes with soft prickles"
      ),
      l4(
        "Blattunterseite weissfilzig",
        "Dessous des feuilles blanc tomenteux",
        "Pagina inferiore delle foglie bianco-tomentosa",
        "Leaf undersides white-felted"
      ),
      l4(
        "Frucht löst sich hohl vom Fruchtboden",
        "Le fruit se détache creux du réceptacle",
        "Il frutto si stacca cavo dal ricettacolo",
        "The fruit comes off hollow from the core"
      ),
    ],
  },
  {
    id: "holunder",
    name: l4("Schwarzer Holunder", "Sureau noir", "Sambuco nero", "Elderberry"),
    latinOrExtra: "Sambucus nigra",
    category: "beeren",
    season: { from: 8, to: 9 },
    description: l4(
      "Ein grosser Strauch oder kleiner Baum mit gefiederten Blättern und schweren, hängenden Dolden aus glänzend schwarzen Beeren. Die Zweige sind innen mit weissem Mark gefüllt.",
      "Un grand arbuste ou petit arbre à feuilles composées et à lourdes ombelles pendantes de baies noir brillant. Les rameaux sont remplis d'une moelle blanche.",
      "Un grande arbusto o piccolo albero con foglie composte e pesanti ombrelle pendenti di bacche nero lucido. I rami sono pieni di midollo bianco.",
      "A large shrub or small tree with pinnate leaves and heavy, drooping umbels of glossy black berries. The twigs are filled with white pith."
    ),
    habitat: l4(
      "Hecken, Waldränder, Bachufer und Hofplätze – gern auf stickstoffreichem Boden nahe bei Menschen.",
      "Haies, lisières, bords de ruisseaux et cours de ferme – volontiers sur sols riches en azote près des habitations.",
      "Siepi, margini del bosco, rive dei ruscelli e cortili – volentieri su suoli ricchi di azoto vicino alle case.",
      "Hedges, forest edges, stream banks and farmyards – happily on nitrogen-rich soils close to people."
    ),
    use: l4(
      "NUR gekocht: Roh sind die Beeren unverträglich und lösen Übelkeit aus. Gekocht werden sie zu Sirup, Gelee oder Suppe; die Blüten im Juni ergeben Sirup und Küchlein.",
      "SEULEMENT cuites : crues, les baies sont indigestes et provoquent des nausées. Cuites, elles donnent sirop, gelée ou soupe ; les fleurs de juin font du sirop et des beignets.",
      "SOLO cotte: crude le bacche sono indigeste e provocano nausea. Cotte danno sciroppo, gelatina o zuppa; i fiori di giugno danno sciroppo e frittelle.",
      "ONLY cooked: raw, the berries are indigestible and cause nausea. Cooked they make cordial, jelly or soup; the June flowers make cordial and fritters."
    ),
    funFact: l4(
      "Der Saft färbt so kräftig, dass er früher zum Färben von Stoff und Wein verwendet wurde – auf hellen Jacken bleibt er auch heute.",
      "Le jus teint si fort qu'il servait autrefois à colorer tissus et vin – sur une veste claire, il tient encore aujourd'hui.",
      "Il succo tinge così forte che un tempo si usava per colorare stoffe e vino – su una giacca chiara resiste ancora oggi.",
      "The juice stains so strongly that it was once used to dye cloth and wine – on a light jacket it still holds today."
    ),
    kidQuestion: l4(
      "Schau dir die Dolde an: Hängt sie nach unten – oder steht sie aufrecht?",
      "Regarde l'ombelle : pend-elle vers le bas – ou est-elle dressée ?",
      "Guarda l'ombrella: pende verso il basso – o è eretta?",
      "Look at the umbel: does it hang down – or stand upright?"
    ),
    features: [
      l4(
        "Gefiederte Blätter, weisses Mark im Zweig",
        "Feuilles composées, moelle blanche dans le rameau",
        "Foglie composte, midollo bianco nel ramo",
        "Pinnate leaves, white pith in the twig"
      ),
      l4(
        "Schwere Dolden hängen nach unten",
        "Lourdes ombelles pendantes",
        "Ombrelle pesanti che pendono",
        "Heavy umbels hanging downwards"
      ),
      l4(
        "Verholzter Strauch, oft mannshoch und höher",
        "Arbuste ligneux, souvent plus haut qu'un adulte",
        "Arbusto legnoso, spesso più alto di una persona",
        "Woody shrub, often taller than a person"
      ),
    ],
    lookalikes: [
      {
        name: l4("Attich (Zwergholunder)", "Hièble", "Ebbio", "Dwarf elder"),
        latin: "Sambucus ebulus",
        warning: l4(
          "Giftig – schon wenige Beeren führen zu Erbrechen und Durchfall. Er ist krautig statt verholzt, wird kaum mannshoch, seine Dolden stehen AUFRECHT, und die zerriebenen Blätter stinken unangenehm.",
          "Toxique – quelques baies suffisent à provoquer vomissements et diarrhées. Il est herbacé et non ligneux, dépasse rarement la taille d'un adulte, ses ombelles sont DRESSÉES et ses feuilles froissées sentent mauvais.",
          "Velenoso – bastano poche bacche per provocare vomito e diarrea. È erbaceo e non legnoso, supera raramente l'altezza di una persona, le sue ombrelle sono ERETTE e le foglie stropicciate puzzano.",
          "Poisonous – a few berries are enough to cause vomiting and diarrhoea. It is herbaceous, not woody, rarely taller than a person, its umbels stand UPRIGHT, and the crushed leaves smell unpleasant."
        ),
      },
    ],
  },
  {
    id: "hagebutte",
    name: l4("Hagebutte", "Cynorrhodon", "Rosa canina", "Rosehip"),
    latinOrExtra: "Rosa canina",
    category: "beeren",
    season: { from: 9, to: 12 },
    description: l4(
      "Die leuchtend rote Scheinfrucht der Hundsrose, oval bis flaschenförmig, mit einem eingetrockneten Kelchrest an der Spitze. Innen sitzen harte Nüsschen zwischen feinen Härchen.",
      "Le faux-fruit rouge vif de l'églantier, ovale à piriforme, portant un reste de calice sec à la pointe. À l'intérieur, des akènes durs entre de fins poils.",
      "Il falso frutto rosso acceso della rosa canina, ovale o a fiaschetto, con un resto di calice secco all'apice. Dentro ci sono acheni duri tra peli sottili.",
      "The bright red false fruit of the dog rose, oval to flask-shaped, with a dried calyx remnant at the tip. Inside sit hard nutlets among fine hairs."
    ),
    habitat: l4(
      "Hecken, Böschungen, Waldränder und Weiden bis etwa 1500 m; nach dem ersten Frost wird sie weich und süss.",
      "Haies, talus, lisières et pâturages jusque vers 1500 m ; après les premières gelées, il devient mou et sucré.",
      "Siepi, scarpate, margini del bosco e pascoli fino a circa 1500 m; dopo la prima gelata diventa morbida e dolce.",
      "Hedges, banks, forest edges and pastures up to about 1500 m; after the first frost it turns soft and sweet."
    ),
    use: l4(
      "Zu Mus, Konfitüre oder Tee. Die Härchen im Innern reizen die Haut – Früchte halbieren, auskratzen und gut ausspülen.",
      "En purée, confiture ou tisane. Les poils intérieurs irritent la peau – coupe les fruits en deux, gratte-les et rince bien.",
      "In purea, confettura o infuso. I peli interni irritano la pelle – taglia i frutti a metà, raschiali e sciacqua bene.",
      "As a purée, jam or tea. The hairs inside irritate the skin – halve the fruits, scrape them out and rinse well."
    ),
    funFact: l4(
      "Hagebutten enthalten mehr Vitamin C als Zitronen – und die Härchen waren früher das Juckpulver auf dem Pausenplatz.",
      "Les cynorrhodons contiennent plus de vitamine C que les citrons – et leurs poils servaient autrefois de poil à gratter dans la cour d'école.",
      "Le rose canine contengono più vitamina C dei limoni – e i loro peli erano un tempo la polvere pizzicante del cortile.",
      "Rosehips contain more vitamin C than lemons – and the hairs were once the itching powder of the schoolyard."
    ),
    kidQuestion: l4(
      "Halbiere eine Hagebutte: Wie viele harte Kerne zählst du darin?",
      "Coupe un cynorrhodon en deux : combien de graines dures comptes-tu ?",
      "Taglia a metà una rosa canina: quanti semi duri conti?",
      "Cut a rosehip in half: how many hard seeds can you count?"
    ),
    features: [
      l4(
        "Leuchtend rot, oval bis flaschenförmig",
        "Rouge vif, ovale à piriforme",
        "Rosso acceso, ovale o a fiaschetto",
        "Bright red, oval to flask-shaped"
      ),
      l4(
        "Vertrockneter Kelchrest an der Spitze",
        "Reste de calice sec à la pointe",
        "Resto di calice secco all'apice",
        "Dried calyx remnant at the tip"
      ),
      l4(
        "Strauch mit gebogenen Stacheln",
        "Arbuste à aiguillons recourbés",
        "Arbusto con aculei ricurvi",
        "Shrub with curved prickles"
      ),
    ],
  },
  {
    id: "schlehe",
    name: l4("Schlehe", "Prunelle", "Prugnola", "Sloe"),
    latinOrExtra: "Prunus spinosa",
    category: "beeren",
    season: { from: 10, to: 1 },
    description: l4(
      "Kleine, blau bereifte Steinfrüchte an einem sparrigen, dornigen Strauch. Roh zieht die Schlehe den Mund zusammen – nach dem ersten Frost wird sie milder.",
      "Petites drupes bleutées sur un arbuste épineux et divariqué. Crue, la prunelle serre la bouche – après les premières gelées, elle s'adoucit.",
      "Piccole drupe pruinose di blu su un arbusto spinoso e divaricato. Cruda la prugnola allappa – dopo la prima gelata diventa più dolce.",
      "Small, blue-bloomed stone fruits on a stiff, thorny shrub. Raw, a sloe puckers your mouth – after the first frost it grows milder."
    ),
    habitat: l4(
      "Sonnige Hecken, Waldsäume und Böschungen; blüht schon im März weiss, lange bevor die Blätter kommen.",
      "Haies ensoleillées, lisières et talus ; elle fleurit en blanc dès mars, bien avant les feuilles.",
      "Siepi soleggiate, orli boschivi e scarpate; fiorisce in bianco già a marzo, molto prima delle foglie.",
      "Sunny hedges, wood margins and banks; it flowers white as early as March, long before the leaves appear."
    ),
    use: l4(
      "Zu Gelee, Likör oder Sirup; roh nur sparsam. Ein Frost oder eine Nacht im Tiefkühler nimmt die Gerbstoffe.",
      "En gelée, liqueur ou sirop ; crue, avec parcimonie. Une gelée ou une nuit au congélateur enlève les tanins.",
      "In gelatina, liquore o sciroppo; cruda solo con parsimonia. Una gelata o una notte in congelatore toglie i tannini.",
      "As jelly, liqueur or cordial; raw only sparingly. A frost or a night in the freezer takes out the tannins."
    ),
    funFact: l4(
      "Die Schlehe ist die Urform unserer Zwetschge – und ihre Dornen sind so hart, dass Hecken daraus früher als Zaun genügten.",
      "La prunelle est la forme sauvage de nos quetsches – et ses épines sont si dures que les haies suffisaient autrefois comme clôture.",
      "La prugnola è la forma originaria delle nostre susine – e le sue spine sono così dure che un tempo la siepe bastava come recinto.",
      "The sloe is the ancestor of our plums – and its thorns are so hard that a hedge of it once served as a fence."
    ),
    kidQuestion: l4(
      "Streich mit dem Finger über eine Schlehe: Was passiert mit dem blauen Reif?",
      "Passe le doigt sur une prunelle : qu'arrive-t-il à la pruine bleue ?",
      "Passa il dito su una prugnola: cosa succede alla pruina blu?",
      "Wipe a sloe with your finger: what happens to the blue bloom?"
    ),
    features: [
      l4(
        "Blau bereifte, erbsengrosse Steinfrucht",
        "Drupe bleutée de la taille d'un pois",
        "Drupa pruinosa grossa come un pisello",
        "Blue-bloomed stone fruit the size of a pea"
      ),
      l4(
        "Sparriger Strauch mit echten Dornen",
        "Arbuste divariqué à véritables épines",
        "Arbusto divaricato con vere spine",
        "Stiff shrub with true thorns"
      ),
      l4(
        "Weisse Blüte im März vor dem Laub",
        "Floraison blanche en mars avant les feuilles",
        "Fioritura bianca a marzo prima delle foglie",
        "White blossom in March before the leaves"
      ),
    ],
  },
];

/**
 * Einträge für das automatisch erzeugte Natur-Quiz (Familien-Bereich).
 * Die Pilze bleiben bewusst draussen: Eine Quizfrage «welche Art passt zu
 * dieser Beschreibung?» darf nie den Eindruck erwecken, man könne Speisepilze
 * spielerisch bestimmen. Dafür gibt es die amtliche Pilzkontrollstelle.
 */
export const quizEntries: NatureEntry[] = natureEntries.filter(
  entry => entry.category !== "pilze"
);
