/**
 * Liederbuch fürs Lagerfeuer (#269).
 *
 * AUSWAHLKRITERIUM ist zuerst das Urheberrecht und erst dann der
 * Geschmack: Aufgenommen sind ausschliesslich Volkslieder und Stücke,
 * deren Urheber seit mehr als 70 Jahren verstorben sind – also
 * gemeinfrei. Bei jedem Lied steht die Herkunft mit Jahr, damit das
 * nachvollziehbar bleibt. Moderne Lagerfeuer-Klassiker fehlen deshalb
 * bewusst; sie hier abzudrucken wäre schlicht nicht erlaubt.
 *
 * Die Akkorde sind eine einfache, gitarrenfreundliche Fassung in
 * bequemer Lage – keine Originaltonart, sondern die, in der eine Runde
 * am Feuer mitsingen kann. Wer tiefer singt, transponiert in der
 * Ansicht.
 *
 * Titel und Text stehen in ihrer Originalsprache. Ein Lied wird nicht
 * übersetzt – man singt «Frère Jacques» auch auf Deutsch so.
 */
import { l4 } from "@shared/i18n";
import { type Song } from "@shared/songs";

export const songs: Song[] = [
  {
    id: "mond-ist-aufgegangen",
    title: "Der Mond ist aufgegangen",
    language: "de",
    origin: l4(
      "Text: Matthias Claudius, 1779 · Melodie: Johann Abraham Peter Schulz, 1790",
      "Texte : Matthias Claudius, 1779 · Mélodie : Johann Abraham Peter Schulz, 1790",
      "Testo: Matthias Claudius, 1779 · Melodia: Johann Abraham Peter Schulz, 1790",
      "Words: Matthias Claudius, 1779 · Melody: Johann Abraham Peter Schulz, 1790"
    ),
    note: l4(
      "Das Abendlied schlechthin – ruhig und langsam, als letztes Lied vor dem Zelt.",
      "LA chanson du soir – calme et lente, la dernière avant d'aller sous la tente.",
      "La canzone della sera per eccellenza – calma e lenta, l'ultima prima della tenda.",
      "The evening song – slow and calm, the last one before heading to the tent."
    ),
    verses: [
      [
        "[G]Der Mond ist auf[D]gegangen,",
        "die [G]goldnen Stern[D]lein prangen",
        "am [G]Himmel [C]hell und [D]klar.",
        "Der [G]Wald steht [C]schwarz und [D]schweiget,",
        "und [G]aus den [C]Wiesen [D]steiget",
        "der [G]weisse [C]Nebel [D]wunder[G]bar.",
      ],
      [
        "[G]Wie ist die Welt so [D]stille",
        "und [G]in der Dämmrung [D]Hülle",
        "so [G]traulich [C]und so [D]hold,",
        "als [G]eine [C]stille [D]Kammer,",
        "wo [G]ihr des [C]Tages [D]Jammer",
        "ver[G]schlafen [C]und ver[D]gessen [G]sollt.",
      ],
      [
        "[G]Seht ihr den Mond dort [D]stehen?",
        "Er [G]ist nur halb zu [D]sehen",
        "und [G]ist doch [C]rund und [D]schön.",
        "So [G]sind wohl [C]manche [D]Sachen,",
        "die [G]wir ge[C]trost be[D]lachen,",
        "weil [G]unsre [C]Augen [D]sie nicht [G]sehn.",
      ],
    ],
  },
  {
    id: "kein-schoener-land",
    title: "Kein schöner Land in dieser Zeit",
    language: "de",
    origin: l4(
      "Volkslied, gesammelt und herausgegeben von Anton Wilhelm von Zuccalmaglio, 1840",
      "Chanson populaire, recueillie et publiée par Anton Wilhelm von Zuccalmaglio, 1840",
      "Canto popolare, raccolto e pubblicato da Anton Wilhelm von Zuccalmaglio, 1840",
      "Folk song, collected and published by Anton Wilhelm von Zuccalmaglio, 1840"
    ),
    note: l4(
      "Geht auch mehrstimmig: Die zweite Stimme setzt eine Terz tiefer ein.",
      "Se chante aussi à deux voix : la seconde entre une tierce plus bas.",
      "Si canta anche a due voci: la seconda entra una terza sotto.",
      "Works in harmony too: the second voice comes in a third below."
    ),
    verses: [
      [
        "[G]Kein schöner Land in [C]dieser [G]Zeit",
        "als [C]hier das [G]unsre [D]weit und [G]breit,",
        "wo [C]wir uns [G]finden",
        "wohl [C]unter [G]Linden",
        "zur [D]Abend[G]zeit.",
      ],
      [
        "[G]Da haben wir so [C]manche [G]Stund",
        "ge[C]sessen [G]da in [D]froher [G]Rund",
        "und [C]taten [G]singen,",
        "die [C]Lieder [G]klingen",
        "im [D]Eichen[G]grund.",
      ],
      [
        "[G]Dass wir uns hier in [C]diesem [G]Tal",
        "noch [C]treffen [G]so viel [D]hundert[G]mal:",
        "Gott [C]mag es [G]schenken,",
        "Gott [C]mag es [G]lenken,",
        "er [D]hat die [G]Gnad.",
      ],
    ],
  },
  {
    id: "bruder-jakob",
    title: "Bruder Jakob / Frère Jacques",
    language: "de",
    origin: l4(
      "Kanon, überliefert seit dem 18. Jahrhundert – in ganz Europa zu Hause",
      "Canon transmis depuis le XVIIIe siècle – chez lui dans toute l'Europe",
      "Canone tramandato dal Settecento – di casa in tutta Europa",
      "A canon handed down since the 18th century – at home all over Europe"
    ),
    note: l4(
      "Kanon für vier Gruppen: Jede Gruppe beginnt zwei Zeilen später. Jede Strophe ist dasselbe Lied in einer anderen Sprache.",
      "Canon à quatre groupes : chaque groupe commence deux lignes plus tard. Chaque strophe est la même chanson dans une autre langue.",
      "Canone per quattro gruppi: ognuno inizia due righe dopo. Ogni strofa è la stessa canzone in un'altra lingua.",
      "A canon for four groups: each starts two lines later. Every verse is the same song in a different language."
    ),
    verses: [
      [
        "[C]Bruder Jakob, Bruder Jakob,",
        "schläfst du noch, schläfst du noch?",
        "Hörst du nicht die Glocken, hörst du nicht die Glocken?",
        "Ding dang dong, ding dang dong.",
      ],
      [
        "[C]Frère Jacques, Frère Jacques,",
        "dormez-vous, dormez-vous ?",
        "Sonnez les matines, sonnez les matines,",
        "ding dang dong, ding dang dong.",
      ],
      [
        "[C]Fra Martino, campanaro,",
        "dormi tu, dormi tu?",
        "Suona le campane, suona le campane,",
        "din don dan, din don dan.",
      ],
      [
        "[C]Are you sleeping, are you sleeping,",
        "brother John, brother John?",
        "Morning bells are ringing, morning bells are ringing,",
        "ding dang dong, ding dang dong.",
      ],
    ],
  },
  {
    id: "hejo-spann-den-wagen-an",
    title: "Hejo, spann den Wagen an",
    language: "de",
    origin: l4(
      "Volksweise, überliefert – ein Kanon aus der Erntezeit",
      "Air populaire traditionnel – un canon du temps des moissons",
      "Melodia popolare tramandata – un canone del tempo del raccolto",
      "Traditional folk tune – a canon from harvest time"
    ),
    note: l4(
      "Kurzer Kanon für drei Gruppen – funktioniert auch mit ganz kleinen Kindern.",
      "Canon court à trois groupes – fonctionne même avec de tout petits enfants.",
      "Canone breve per tre gruppi – funziona anche con bambini piccolissimi.",
      "A short canon for three groups – works even with very small children."
    ),
    verses: [
      [
        "[Am]Hejo, spann den Wagen an,",
        "denn der [E7]Wind treibt Regen übers [Am]Land.",
        "Hol die goldnen Garben,",
        "hol die goldnen [E7]Gar[Am]ben.",
      ],
    ],
  },
  {
    id: "wenn-ich-ein-voeglein-waer",
    title: "Wenn ich ein Vöglein wär",
    language: "de",
    origin: l4(
      "Volkslied, veröffentlicht von Johann Gottfried Herder, 1778",
      "Chanson populaire, publiée par Johann Gottfried Herder, 1778",
      "Canto popolare, pubblicato da Johann Gottfried Herder, 1778",
      "Folk song, published by Johann Gottfried Herder, 1778"
    ),
    note: l4(
      "Sehr leise singen – zwei Strophen reichen, dann schlafen die Kleinen ohnehin.",
      "À chanter tout doucement – deux strophes suffisent, les petits dorment déjà.",
      "Da cantare pianissimo – bastano due strofe, i piccoli dormono già.",
      "Sing it very softly – two verses are enough, the little ones are asleep by then."
    ),
    verses: [
      [
        "[G]Wenn ich ein [C]Vöglein [G]wär",
        "und auch [D]zwei Flüglein [G]hätt,",
        "flög ich zu [D]dir.",
        "Weils aber [G]nicht kann [C]sein,",
        "weils aber [G]nicht kann [D]sein,",
        "bleib ich all[G]hier.",
      ],
      [
        "[G]Bin ich gleich [C]weit von [G]dir,",
        "bin ich doch [D]im Schlaf bei [G]dir",
        "und red mit [D]dir.",
        "Wenn ich er[G]wachen [C]tu,",
        "wenn ich er[G]wachen [D]tu,",
        "bin ich al[G]lein.",
      ],
    ],
  },
  {
    id: "vo-luzern-uf-waeggis-zue",
    title: "Vo Luzern uf Wäggis zue",
    language: "de",
    origin: l4(
      "Schweizer Volkslied, überliefert seit dem 19. Jahrhundert",
      "Chanson populaire suisse, transmise depuis le XIXe siècle",
      "Canto popolare svizzero, tramandato dall'Ottocento",
      "Swiss folk song, handed down since the 19th century"
    ),
    note: l4(
      "Der Refrain gehört allen: Strophe vorsingen, «Holderidiho» singen alle mit. Weitere Strophen werden frei dazugedichtet – so war es immer.",
      "Le refrain est à tout le monde : une personne chante le couplet, tous reprennent le « Holderidiho ». D'autres couplets s'inventent librement – il en a toujours été ainsi.",
      "Il ritornello è di tutti: uno canta la strofa, tutti rispondono «Holderidiho». Altre strofe si inventano liberamente – è sempre stato così.",
      "The refrain belongs to everyone: one person sings the verse, all join in on “Holderidiho”. Further verses are made up freely – that is how it has always been."
    ),
    verses: [
      [
        "[G]Vo Luzern uf Wäggis zue, holderi, hol[D]dero,",
        "[D]bruucht me weder Strümpf no Schue, holderi, hol[G]dero.",
        "Holderidi[C]ho, holderidi[G]ho,",
        "holderi, hol[D]de[G]ro.",
      ],
    ],
  },
  {
    id: "alouette",
    title: "Alouette",
    language: "fr",
    origin: l4(
      "Französisch-kanadisches Volkslied, gedruckt seit 1879",
      "Chanson populaire canadienne-française, imprimée depuis 1879",
      "Canto popolare franco-canadese, stampato dal 1879",
      "French-Canadian folk song, in print since 1879"
    ),
    note: l4(
      "Mitmachlied: Eine Person singt vor, alle antworten – und mit jeder Strophe kommt ein Körperteil dazu, den man zeigt.",
      "Chanson à répondre : une personne lance, tout le monde répond – et à chaque couplet s'ajoute une partie du corps que l'on montre.",
      "Canto a risposta: uno intona, tutti rispondono – e a ogni strofa si aggiunge una parte del corpo da indicare.",
      "A call-and-response song: one person leads, everyone answers – and each verse adds a body part to point at."
    ),
    verses: [
      [
        "[C]Alouette, gentille a[G7]louette,",
        "[G7]alouette, je te plume[C]rai.",
      ],
      [
        "[C]Je te plumerai la [G7]tête,",
        "je te plumerai la [C]tête,",
        "et la [G7]tête, et la [C]tête,",
        "a[G7]louette, a[C]louette, o-o-o-oh !",
      ],
      [
        "[C]Je te plumerai le [G7]bec,",
        "je te plumerai le [C]bec,",
        "et le [G7]bec, et le [C]bec,",
        "et la [G7]tête, et la [C]tête,",
        "a[G7]louette, a[C]louette, o-o-o-oh !",
      ],
    ],
  },
  {
    id: "michael-row-the-boat-ashore",
    title: "Michael, Row the Boat Ashore",
    language: "en",
    origin: l4(
      "Spiritual von den Sea Islands, erstmals aufgezeichnet 1867",
      "Spiritual des Sea Islands, noté pour la première fois en 1867",
      "Spiritual delle Sea Islands, trascritto per la prima volta nel 1867",
      "A spiritual from the Sea Islands, first written down in 1867"
    ),
    note: l4(
      "Zwei Akkorde, endlos viele Strophen – ideal, um Kinder eigene Zeilen erfinden zu lassen.",
      "Deux accords, une infinité de couplets – idéal pour laisser les enfants inventer leurs propres lignes.",
      "Due accordi, strofe infinite – ideale per far inventare ai bambini le proprie righe.",
      "Two chords, endless verses – ideal for letting kids make up lines of their own."
    ),
    verses: [
      [
        "[C]Michael, row the boat a[F]shore,",
        "[C]halle[Am]lu[G]jah.",
        "[C]Michael, row the boat a[F]shore,",
        "[C]halle[G]lu[C]jah.",
      ],
      [
        "[C]Sister, help to trim the [F]sail,",
        "[C]halle[Am]lu[G]jah.",
        "[C]Sister, help to trim the [F]sail,",
        "[C]halle[G]lu[C]jah.",
      ],
      [
        "[C]River Jordan is chilly and [F]cold,",
        "[C]halle[Am]lu[G]jah.",
        "[C]Chills the body but not the [F]soul,",
        "[C]halle[G]lu[C]jah.",
      ],
    ],
  },
];
