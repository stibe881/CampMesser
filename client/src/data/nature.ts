/**
 * Natur-Entdecker-Lexikon – offline, kindgerecht aufbereitet.
 */
export interface NatureEntry {
  id: string;
  name: string;
  latinOrExtra?: string;
  category: "tierspuren" | "sternbilder" | "baeume";
  description: string;
  funFact: string;
  kidQuestion: string;
  features: string[];
  image?: string;
}

export const natureCategories = [
  { id: "tierspuren", label: "Tierspuren", icon: "PawPrint", intro: "Wer war hier unterwegs? Spuren im Schlamm oder Schnee verraten es." },
  { id: "sternbilder", label: "Sternbilder", icon: "Sparkles", intro: "Was funkelt da oben? Die bekanntesten Sternbilder für klare Campingnächte." },
  { id: "baeume", label: "Bäume", icon: "TreePine", intro: "Blätter, Nadeln, Rinde – so erkennst du die häufigsten Bäume rund ums Camp." },
] as const;

export const natureEntries: NatureEntry[] = [
  // ── Tierspuren ──
  {
    id: "reh",
    name: "Reh",
    latinOrExtra: "Capreolus capreolus",
    category: "tierspuren",
    image: "/manus-storage/natur-reh_2304e34b.png",
    description:
      "Die Trittsiegel des Rehs sind klein, spitz und herzförmig – etwa 4–5 cm lang. Die beiden Schalenhälften laufen vorne spitz zu. Rehe sind in der Dämmerung am Waldrand unterwegs.",
    funFact: "Rehe bellen! Wenn sie erschrecken, stossen sie einen rauen Beller aus, der wie ein Hund klingt.",
    kidQuestion: "Findest du eine Spur, die aussieht wie zwei kleine Kommas nebeneinander?",
    features: ["4–5 cm lange, herzförmige Spur", "Zwei spitze Schalen", "Oft auf weichen Waldwegen"],
  },
  {
    id: "fuchs",
    name: "Fuchs",
    latinOrExtra: "Vulpes vulpes",
    category: "tierspuren",
    image: "/manus-storage/natur-fuchs_d9e9a959.png",
    description:
      "Fuchsspuren ähneln kleinen Hundespuren (ca. 5 cm), sind aber schmaler und laufen wie auf einer Perlenschnur in einer geraden Linie – das nennt man «schnüren».",
    funFact: "Füchse nutzen das Erdmagnetfeld, um beim Mäusesprung die Entfernung zu ihrer Beute abzuschätzen.",
    kidQuestion: "Laufen die Abdrücke wie an einer Schnur aufgereiht? Dann war es wahrscheinlich ein Fuchs, kein Hund!",
    features: ["Ca. 5 cm, oval und schmal", "4 Zehenballen mit Krallenabdruck", "Spuren in gerader Linie («geschnürt»)"],
  },
  {
    id: "wildschwein",
    name: "Wildschwein",
    latinOrExtra: "Sus scrofa",
    category: "tierspuren",
    image: "/manus-storage/natur-wildschwein_79298aa5.png",
    description:
      "Wildschweinspuren sind breit und stumpf (6–8 cm). Typisch: Hinter den zwei Hauptschalen drücken sich fast immer die zwei seitlichen Afterklauen ab. Umgewühlte Erde in der Nähe ist ein sicheres Zeichen.",
    funFact: "Wildschweine sind ausgezeichnete Schwimmer und können ganze Seen durchqueren.",
    kidQuestion: "Siehst du neben der grossen Spur zwei kleine Punkte? Das sind die «Zwergenzehen» des Wildschweins!",
    features: ["6–8 cm, breit und rundlich", "Afterklauen sichtbar (4 Abdrücke)", "Wühlspuren im Boden in der Nähe"],
  },
  {
    id: "eichhoernchen",
    name: "Eichhörnchen",
    latinOrExtra: "Sciurus vulgaris",
    category: "tierspuren",
    image: "/manus-storage/natur-eichhoernchen_9a32d146.png",
    description:
      "Beim Hüpfen landen die grossen Hinterpfoten vor den kleinen Vorderpfoten – das ergibt ein typisches Sprungmuster. Angenagte Tannenzapfen, die wie abgenagte Maiskolben aussehen, sind sein Markenzeichen.",
    funFact: "Eichhörnchen vergessen viele ihrer Nussverstecke – und pflanzen so nebenbei neue Bäume.",
    kidQuestion: "Findest du einen abgenagten Zapfen, der aussieht wie ein Maiskolben?",
    features: ["Sprungmuster: hinten vor vorne", "Kleine Krallenabdrücke", "Zapfenreste an Baumstümpfen"],
  },
  {
    id: "dachs",
    name: "Dachs",
    latinOrExtra: "Meles meles",
    category: "tierspuren",
    image: "/manus-storage/natur-dachs_45f6a2f3.png",
    description:
      "Dachsspuren wirken wie kleine Bärentatzen: fünf Zehen mit langen, deutlich sichtbaren Krallen vor einem breiten Ballen. Dachse laufen auf festen Pfaden, die sie über Generationen benutzen.",
    funFact: "Dachse legen richtige Burgen mit mehreren Etagen an – manche sind über 100 Jahre alt und werden vererbt.",
    kidQuestion: "Kannst du fünf kleine Krallenspitzen vor dem Fussabdruck zählen?",
    features: ["5 Zehen mit langen Krallen", "Breiter, nieriger Ballen", "Deutliche Trampelpfade"],
  },
  // ── Sternbilder ──
  {
    id: "grosser-wagen",
    name: "Grosser Wagen",
    latinOrExtra: "Teil des Sternbilds Grosser Bär",
    category: "sternbilder",
    image: "/manus-storage/natur-grosser-wagen_a766651d.png",
    description:
      "Sieben helle Sterne bilden einen Kastenwagen mit Deichsel. Er ist das ganze Jahr über am Nordhimmel sichtbar und der beste Startpunkt für alle Sternentdecker*innen.",
    funFact: "Verlängert man die hintere Kastenkante fünfmal, landet man genau beim Polarstern – dem Wegweiser nach Norden.",
    kidQuestion: "Findest du den grossen Kochtopf mit dem langen Stiel am Himmel?",
    features: ["7 helle Sterne", "Form: Kasten mit Deichsel", "Ganzjährig sichtbar"],
  },
  {
    id: "polarstern",
    name: "Polarstern & Kleiner Wagen",
    latinOrExtra: "Polaris",
    category: "sternbilder",
    image: "/manus-storage/natur-polarstern_0d3cac24.png",
    description:
      "Der Polarstern steht fast genau über dem Nordpol und bewegt sich scheinbar nie. Er ist der letzte Stern in der Deichsel des Kleinen Wagens – und ein natürlicher Kompass.",
    funFact: "Alle anderen Sterne scheinen sich in der Nacht um den Polarstern zu drehen – er ist der ruhende Punkt des Himmels.",
    kidQuestion: "Wenn du den Polarstern gefunden hast: Wo ist dann Norden? Genau – direkt darunter!",
    features: ["Zeigt immer nach Norden", "Ende der Deichsel des Kleinen Wagens", "Nicht besonders hell, aber konstant"],
  },
  {
    id: "kassiopeia",
    name: "Kassiopeia",
    latinOrExtra: "Das «Himmels-W»",
    category: "sternbilder",
    image: "/manus-storage/natur-kassiopeia_948c79c1.png",
    description:
      "Fünf helle Sterne formen ein deutliches W (oder M, je nach Jahreszeit). Kassiopeia steht dem Grossen Wagen am Himmel genau gegenüber – der Polarstern liegt in der Mitte.",
    funFact: "In der griechischen Sage war Kassiopeia eine eitle Königin, die zur Strafe an den Himmel gesetzt wurde.",
    kidQuestion: "Suchst du das grosse W am Himmel? Manchmal steht es auf dem Kopf und wird zum M!",
    features: ["5 Sterne in W-Form", "Gegenüber dem Grossen Wagen", "Ganzjährig sichtbar"],
  },
  {
    id: "orion",
    name: "Orion",
    latinOrExtra: "Der Himmelsjäger",
    category: "sternbilder",
    image: "/manus-storage/natur-orion_b35423fb.png",
    description:
      "Das prächtigste Wintersternbild: Drei Sterne in einer Reihe bilden den Gürtel des Jägers, umrahmt von vier hellen Ecksternen. Unter dem Gürtel schimmert der Orionnebel.",
    funFact: "Der rote Schulterstern Beteigeuze ist so riesig, dass er bis fast zum Jupiter reichen würde, stünde er an der Stelle unserer Sonne.",
    kidQuestion: "Findest du die drei Gürtelsterne, die wie auf einer Perlenkette aufgereiht sind?",
    features: ["3 Gürtelsterne in Reihe", "4 helle Ecksterne", "Sichtbar von Oktober bis März"],
  },
  {
    id: "sommerdreieck",
    name: "Sommerdreieck",
    latinOrExtra: "Wega, Deneb, Atair",
    category: "sternbilder",
    image: "/manus-storage/natur-sommerdreieck_539d5445.png",
    description:
      "Drei sehr helle Sterne aus drei Sternbildern (Leier, Schwan, Adler) bilden ein riesiges Dreieck – das auffälligste Muster des Sommerhimmels, perfekt für laue Zeltnächte.",
    funFact: "Mitten durch das Sommerdreieck zieht sich das Band der Milchstrasse – bei dunklem Himmel als schimmernder Nebel sichtbar.",
    kidQuestion: "Welcher der drei Sterne funkelt am hellsten? Das ist die Wega!",
    features: ["3 sehr helle Sterne", "Riesiges Dreieck im Zenit", "Sichtbar von Juni bis Oktober"],
  },
  // ── Bäume ──
  {
    id: "fichte",
    name: "Fichte",
    latinOrExtra: "Picea abies",
    category: "baeume",
    image: "/manus-storage/natur-fichte_738ee4b4.png",
    description:
      "Der häufigste Nadelbaum der Schweiz. Ihre Nadeln sind spitz und stechen, die Zapfen hängen nach unten und fallen als Ganzes ab. Merkspruch: «Die Fichte sticht, die Tanne nicht.»",
    funFact: "Fichtenharz war früher der Kaugummi der Alpen – Hirtenkinder kauten das goldgelbe Harz.",
    kidQuestion: "Streichle vorsichtig über die Nadeln: Piksen sie? Dann ist es eine Fichte!",
    features: ["Spitze, stechende Nadeln rund um den Zweig", "Hängende Zapfen", "Rötlich-braune, schuppige Rinde"],
  },
  {
    id: "tanne",
    name: "Weisstanne",
    latinOrExtra: "Abies alba",
    category: "baeume",
    image: "/manus-storage/natur-tanne_d0db954a.png",
    description:
      "Ihre Nadeln sind weich, vorne eingekerbt und haben zwei weisse Wachsstreifen auf der Unterseite. Die Zapfen stehen aufrecht wie Kerzen auf den Ästen und zerfallen am Baum.",
    funFact: "Tannenzapfen findet man nie am Boden – sie zerfallen hoch oben am Ast in einzelne Schuppen.",
    kidQuestion: "Dreh eine Nadel um: Siehst du die zwei weissen Streifen? Das ist das Tannen-Geheimzeichen!",
    features: ["Weiche Nadeln mit 2 weissen Streifen unten", "Aufrecht stehende Zapfen", "Glatte, graue Rinde"],
  },
  {
    id: "buche",
    name: "Rotbuche",
    latinOrExtra: "Fagus sylvatica",
    category: "baeume",
    image: "/manus-storage/natur-buche_8af46d78.png",
    description:
      "Die «Mutter des Waldes» hat eine glatte, silbergraue Rinde und eiförmige Blätter mit welligem Rand. Im Herbst fallen die dreikantigen Bucheckern aus ihren stacheligen Hüllen.",
    funFact: "Buchenwälder werden auch «Kathedralen des Waldes» genannt, weil ihre glatten Stämme wie Säulen wirken.",
    kidQuestion: "Findest du eine dreieckige kleine Nuss am Boden? Das ist eine Buchecker!",
    features: ["Glatte, silbergraue Rinde", "Eiförmige Blätter mit welligem Rand", "Dreikantige Bucheckern"],
  },
  {
    id: "eiche",
    name: "Stieleiche",
    latinOrExtra: "Quercus robur",
    category: "baeume",
    image: "/manus-storage/natur-eiche_5c86e6fe.png",
    description:
      "Erkennbar an den gebuchteten Blättern und den Eicheln, die an langen Stielen hängen. Die Rinde ist tief gefurcht. Eichen können über 800 Jahre alt werden.",
    funFact: "Eine alte Eiche beherbergt bis zu 500 verschiedene Tierarten – mehr als jeder andere Baum bei uns.",
    kidQuestion: "Wie viele «Finger» hat ein Eichenblatt? Zähl die runden Buchten!",
    features: ["Gebuchtete Blätter ohne Spitzen", "Eicheln an langen Stielen", "Tief gefurchte, dunkle Rinde"],
  },
  {
    id: "birke",
    name: "Hängebirke",
    latinOrExtra: "Betula pendula",
    category: "baeume",
    image: "/manus-storage/natur-birke_d48b4371.png",
    description:
      "Unverwechselbar durch die weisse, papierartige Rinde mit schwarzen Rissen. Die kleinen, gezackten Blätter zittern schon bei leichtem Wind an ihren dünnen Zweigen.",
    funFact: "Birkenrinde brennt dank ihrer ätherischen Öle sogar nass – der beste natürliche Feuerstarter des Waldes.",
    kidQuestion: "Welcher Baum trägt ein weisses Kleid mit schwarzen Flecken? Die Birke!",
    features: ["Weisse, papierartige Rinde", "Kleine, gezackte, dreieckige Blätter", "Hängende, dünne Zweige"],
  },
  {
    id: "laerche",
    name: "Lärche",
    latinOrExtra: "Larix decidua",
    category: "baeume",
    image: "/manus-storage/natur-laerche_0fdd8159.png",
    description:
      "Der einzige heimische Nadelbaum, der im Herbst seine Nadeln verliert – vorher färben sie sich leuchtend goldgelb. Die weichen Nadeln wachsen in Büscheln an kurzen Trieben.",
    funFact: "Im Herbst verwandeln Lärchen ganze Berghänge in ein goldenes Meer, bevor die Nadeln fallen.",
    kidQuestion: "Ein Nadelbaum, der im Winter nackt ist? Ja, das gibt es – die Lärche!",
    features: ["Weiche Nadeln in Büscheln", "Goldgelbe Herbstfärbung", "Kleine, runde Zapfen"],
  },
];
