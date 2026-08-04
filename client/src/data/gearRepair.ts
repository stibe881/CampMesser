/**
 * Reparatur-Ratgeber Ausrüstung (#266): die sieben Schäden, die eine
 * Camping-Ausrüstung tatsächlich lahmlegen – und wie man sie am Platz
 * oder am Küchentisch behebt.
 *
 * Auswahlkriterium war nicht «was kann kaputtgehen», sondern «was fällt
 * aus und ruiniert den Abend»: keine Matte heisst kalt schlafen, kein
 * Kocher heisst kalt essen, eine gebrochene Stange heisst kein Zelt.
 *
 * Dieselbe Form wie die Zeltpflege (#265): wann es fällig ist, was man
 * braucht, wie es geht, häufigster Fehler. Wer eine Anleitung einmal
 * gelesen hat, findet sich in der nächsten sofort zurecht.
 *
 * Was NICHT drinsteht: Reparaturen an gasführenden Teilen jenseits von
 * Dichtung und Düse. Ein undichter Schlauch oder ein defektes Ventil
 * gehört in den Fachbetrieb – das steht auch so im Kocher-Eintrag.
 */
import { l4 } from "@shared/i18n";
import { type CareGuide } from "./careGuides";

export const gearRepairGuides: CareGuide[] = [
  {
    id: "matte",
    title: l4(
      "Isomatte flicken",
      "Réparer le matelas",
      "Riparare il materassino",
      "Patching the sleeping mat"
    ),
    summary: l4(
      "Ein Loch von der Grösse eines Nadelstichs reicht, damit du um drei Uhr auf dem Boden liegst.",
      "Un trou de la taille d'une piqûre d'aiguille suffit pour te retrouver par terre à trois heures du matin.",
      "Basta un buco grande come una puntura d'ago per ritrovarti per terra alle tre di notte.",
      "A hole the size of a pinprick is all it takes to leave you on the ground at three in the morning."
    ),
    when: l4(
      "Wenn die Matte über Nacht weich wird. Erst suchen, dann flicken – ohne die undichte Stelle nützt der beste Flicken nichts.",
      "Quand le matelas se dégonfle pendant la nuit. Cherche d'abord, répare ensuite – sans la fuite, la meilleure rustine ne sert à rien.",
      "Quando il materassino si sgonfia durante la notte. Prima cerca, poi ripara – senza il punto che perde la toppa migliore non serve.",
      "When the mat goes soft overnight. Find it first, then patch – without locating the leak, the best patch is useless."
    ),
    materials: [
      l4(
        "Reparaturset der Matte (Flicken und Kleber) oder universelle Flicken",
        "Le kit de réparation du matelas (rustines et colle) ou des rustines universelles",
        "Il kit di riparazione del materassino (toppe e colla) o toppe universali",
        "The mat's repair kit (patches and glue) or universal patches"
      ),
      l4(
        "Wasser mit etwas Seife in einer Schüssel oder Sprühflasche",
        "De l'eau savonneuse dans un récipient ou un vaporisateur",
        "Acqua con un po' di sapone in una bacinella o in uno spruzzino",
        "Soapy water in a bowl or spray bottle"
      ),
      l4(
        "Etwas Gewicht zum Beschweren, z. B. Bücher oder ein Wasserkanister",
        "Un poids pour presser, par exemple des livres ou un jerrican",
        "Un peso per pressare, ad esempio dei libri o una tanica d'acqua",
        "Something heavy to press with – books or a water canister"
      ),
    ],
    steps: [
      {
        title: l4(
          "Loch finden",
          "Trouver le trou",
          "Trovare il buco",
          "Find the hole"
        ),
        text: l4(
          "Matte prall aufblasen und mit Seifenwasser abreiben – wo es blubbert, ist das Loch. Kein Wasser zur Hand? Matte aufblasen, ans Ohr halten und langsam abfahren; das Zischen ist erstaunlich gut hörbar. Fundstelle sofort markieren.",
          "Gonfle bien le matelas et passe de l'eau savonneuse – là où ça fait des bulles se trouve le trou. Pas d'eau ? Gonfle, approche l'oreille et longe lentement la surface ; le sifflement s'entend étonnamment bien. Marque tout de suite l'endroit.",
          "Gonfia bene il materassino e passaci acqua saponata – dove fa le bolle c'è il buco. Niente acqua? Gonfialo, avvicina l'orecchio e percorrilo lentamente; il sibilo si sente sorprendentemente bene. Segna subito il punto.",
          "Inflate the mat firmly and wipe it with soapy water – where it bubbles is the hole. No water to hand? Inflate it, hold it to your ear and move slowly along; the hiss is surprisingly audible. Mark the spot immediately."
        ),
      },
      {
        title: l4(
          "Stelle vorbereiten",
          "Préparer la zone",
          "Preparare il punto",
          "Prepare the spot"
        ),
        text: l4(
          "Luft ablassen, die Stelle trocknen und fettfrei wischen. Bei einer Matte mit rauer Oberfläche die Klebefläche vorsichtig glattreiben, sonst zieht die Luft durch die Struktur unter dem Flicken hindurch.",
          "Dégonfle, sèche la zone et essuie-la pour la dégraisser. Sur un matelas à surface rugueuse, lisse doucement la zone de collage, sinon l'air passe sous la rustine par la texture.",
          "Sgonfia, asciuga il punto e puliscilo dal grasso. Se il materassino ha una superficie ruvida, leviga con cautela la zona da incollare, altrimenti l'aria passa sotto la toppa attraverso la trama.",
          "Deflate it, dry the spot and wipe it free of grease. On a mat with a textured surface, gently smooth the bonding area, otherwise air travels under the patch through the texture."
        ),
      },
      {
        title: l4(
          "Kleben und beschweren",
          "Coller et presser",
          "Incollare e pressare",
          "Glue it and weigh it down"
        ),
        text: l4(
          "Flicken mit runden Ecken zuschneiden, so dass er das Loch um zwei Zentimeter überragt. Kleber dünn auftragen, Flicken aufdrücken und mit Gewicht beschweren. Mindestens 12 Stunden aushärten lassen, besser über Nacht.",
          "Découpe une rustine à coins arrondis qui dépasse le trou de deux centimètres. Applique une fine couche de colle, presse la rustine et pose un poids. Laisse durcir au moins 12 heures, idéalement une nuit.",
          "Ritaglia una toppa con angoli arrotondati che superi il buco di due centimetri. Stendi poca colla, premi la toppa e appoggia un peso. Lascia indurire almeno 12 ore, meglio una notte.",
          "Cut a patch with rounded corners that overlaps the hole by two centimetres. Apply a thin layer of glue, press the patch on and weigh it down. Let it cure for at least 12 hours, ideally overnight."
        ),
      },
      {
        title: l4(
          "Am Ventil weitersuchen",
          "Continuer par la valve",
          "Continuare dalla valvola",
          "Check the valve next"
        ),
        text: l4(
          "Findest du kein Loch, ist meist das Ventil undicht. Ventil ganz herausdrehen (wenn möglich), Dichtring reinigen und mit etwas Silikonfett wieder einsetzen. Sitzt der Ring schief, entweicht die Luft dort und nirgends sonst.",
          "Si tu ne trouves pas de trou, c'est généralement la valve qui fuit. Dévisse-la complètement (si possible), nettoie le joint et remonte-le avec un peu de graisse silicone. Un joint de travers laisse fuir l'air là et nulle part ailleurs.",
          "Se non trovi buchi, di solito perde la valvola. Svitala del tutto (se possibile), pulisci la guarnizione e rimontala con un po' di grasso al silicone. Se l'anello è storto, l'aria esce lì e da nessun'altra parte.",
          "If you find no hole, the valve is usually the leak. Unscrew it fully (if possible), clean the sealing ring and refit it with a little silicone grease. A ring sitting askew lets the air out there and nowhere else."
        ),
      },
    ],
    mistake: l4(
      "Den Flicken auf die pralle Matte kleben. Beim Ablassen zieht sich das Material zusammen, der Flicken wirft Falten und die Luft findet sofort einen neuen Weg. Immer im leeren Zustand kleben und erst nach dem Aushärten aufblasen.",
      "Coller la rustine sur un matelas gonflé. En dégonflant, le matériau se rétracte, la rustine plisse et l'air trouve aussitôt un nouveau passage. Colle toujours à plat et ne gonfle qu'après durcissement.",
      "Incollare la toppa sul materassino gonfio. Sgonfiandolo il materiale si ritira, la toppa fa pieghe e l'aria trova subito una nuova via. Incolla sempre da sgonfio e gonfia solo dopo l'indurimento.",
      "Sticking the patch on while the mat is inflated. As it deflates the material contracts, the patch wrinkles and the air immediately finds a new way out. Always patch it flat and only inflate once cured."
    ),
    minutes: 25,
    intervalMonths: null,
  },
  {
    id: "gestaenge",
    title: l4(
      "Gestänge schienen",
      "Attelle sur un arceau",
      "Steccare la bacchetta",
      "Splinting a broken pole"
    ),
    summary: l4(
      "Eine gebrochene Zeltstange ist in fünf Minuten geschient – wenn die Reparaturhülse dabei ist.",
      "Un arceau cassé se répare en cinq minutes – à condition d'avoir le manchon de réparation.",
      "Una bacchetta rotta si stecca in cinque minuti – se hai con te il manicotto di riparazione.",
      "A broken tent pole is splinted in five minutes – provided the repair sleeve is with you."
    ),
    when: l4(
      "Sofort, sobald ein Segment knickt oder splittert. Eine angeknackste Stange bricht beim nächsten Windstoss ganz.",
      "Tout de suite, dès qu'un segment se plie ou se fend. Un arceau fêlé casse complètement à la prochaine rafale.",
      "Subito, appena un segmento si piega o si scheggia. Una bacchetta incrinata si rompe del tutto alla prossima raffica.",
      "Straight away, as soon as a section kinks or splinters. A cracked pole snaps fully in the next gust."
    ),
    materials: [
      l4(
        "Reparaturhülse aus dem Zeltsack (das kurze Rohrstück)",
        "Le manchon de réparation du sac de tente (le petit tube)",
        "Il manicotto di riparazione dal sacco della tenda (il tubetto corto)",
        "The repair sleeve from the tent bag (the short tube)"
      ),
      l4(
        "Gewebeband oder Panzertape",
        "Du ruban toilé ou du gaffer",
        "Nastro telato o americano",
        "Cloth tape or duct tape"
      ),
      l4(
        "Ersatzweise ein Hering oder ein gerader Ast als Schiene",
        "À défaut, une sardine ou une branche droite comme attelle",
        "In alternativa un picchetto o un ramo dritto come stecca",
        "Failing that, a tent peg or a straight stick as a splint"
      ),
    ],
    steps: [
      {
        title: l4(
          "Bruchstelle richten",
          "Remettre la cassure droite",
          "Raddrizzare la rottura",
          "Straighten the break"
        ),
        text: l4(
          "Splitter und abstehende Fasern vorsichtig glätten, damit die Hülse überhaupt darüber passt. Die innen laufende Gummischnur nicht durchtrennen – sie hält die Segmente zusammen.",
          "Lisse délicatement les échardes et les fibres qui dépassent pour que le manchon puisse glisser dessus. Ne coupe pas le sandow intérieur – c'est lui qui tient les segments ensemble.",
          "Liscia con cautela schegge e fibre sporgenti, così il manicotto ci passa sopra. Non tagliare l'elastico interno – è lui che tiene insieme i segmenti.",
          "Gently smooth off splinters and stray fibres so the sleeve will slide over at all. Do not cut the shock cord running inside – it holds the sections together."
        ),
      },
      {
        title: l4(
          "Hülse mittig setzen",
          "Centrer le manchon",
          "Centrare il manicotto",
          "Centre the sleeve"
        ),
        text: l4(
          "Reparaturhülse über die Bruchstelle schieben, so dass sie beidseitig gleich weit übersteht. Passt sie nicht über die Stelle, den Bruch mit einem Hering als Schiene unterlegen.",
          "Fais glisser le manchon sur la cassure de façon qu'il dépasse également des deux côtés. S'il ne passe pas, place une sardine en attelle le long de la cassure.",
          "Fai scorrere il manicotto sulla rottura in modo che sporga ugualmente da entrambi i lati. Se non passa, metti un picchetto come stecca lungo la rottura.",
          "Slide the repair sleeve over the break so it overhangs equally on both sides. If it will not pass over the spot, lay a tent peg alongside as a splint."
        ),
      },
      {
        title: l4(
          "Fest umwickeln",
          "Enrouler fermement",
          "Fasciare stretto",
          "Wrap it tight"
        ),
        text: l4(
          "Hülse oder Schiene straff mit Gewebeband umwickeln, an beiden Enden mindestens fünf Zentimeter über die Bruchstelle hinaus. Die Wicklung soll fest sitzen, aber die Stange darf sich noch in die Zeltkanäle schieben lassen.",
          "Enroule fermement du ruban toilé sur le manchon ou l'attelle, en débordant d'au moins cinq centimètres de chaque côté. Le bandage doit tenir ferme, mais l'arceau doit encore glisser dans les fourreaux.",
          "Fascia stretto con nastro telato il manicotto o la stecca, sconfinando di almeno cinque centimetri da entrambi i lati. La fasciatura deve tenere bene, ma la bacchetta deve ancora scorrere nelle guaine.",
          "Wrap cloth tape tightly over the sleeve or splint, extending at least five centimetres beyond the break on both sides. The wrap must hold firm, but the pole still has to slide through the sleeves."
        ),
      },
      {
        title: l4(
          "Zu Hause ersetzen",
          "Remplacer à la maison",
          "Sostituire a casa",
          "Replace it at home"
        ),
        text: l4(
          "Die Schiene ist eine Notlösung für die laufende Reise. Zu Hause das einzelne Segment nachbestellen – bei den meisten Herstellern gibt es Ersatzsegmente, ein ganzes Gestänge braucht es fast nie.",
          "L'attelle est une solution provisoire pour le voyage en cours. À la maison, commande le segment concerné – la plupart des fabricants vendent des segments de rechange, il est rarement nécessaire de remplacer tout l'arceau.",
          "La stecca è una soluzione d'emergenza per il viaggio in corso. A casa ordina il singolo segmento – quasi tutti i produttori vendono segmenti di ricambio, raramente serve un'intera bacchetta.",
          "The splint is a stopgap for the current trip. At home, order the individual section – most makers sell replacement sections, and a whole pole set is almost never needed."
        ),
      },
    ],
    mistake: l4(
      "Die geschiente Stange gleich wieder voll spannen. Die Reparatur trägt weniger als das heile Rohr; das Zelt lieber etwas flacher aufbauen und bei angekündigtem Sturm die Abspannung so setzen, dass der Wind nicht auf die reparierte Seite drückt.",
      "Retendre aussitôt l'arceau réparé à fond. La réparation supporte moins que le tube intact ; monte plutôt la tente un peu plus basse et, si une tempête est annoncée, oriente les haubans pour que le vent n'appuie pas sur le côté réparé.",
      "Rimettere subito in piena tensione la bacchetta steccata. La riparazione regge meno del tubo intero; monta la tenda un po' più bassa e, se è previsto vento forte, orienta i tiranti in modo che non prema sul lato riparato.",
      "Tensioning the splinted pole fully again straight away. The repair carries less than the intact tube; pitch the tent a little lower and, if a storm is forecast, set the guy lines so the wind does not push on the repaired side."
    ),
    minutes: 10,
    intervalMonths: null,
  },
  {
    id: "kocher",
    title: l4(
      "Gaskocher warten",
      "Entretenir le réchaud à gaz",
      "Manutenzione del fornello a gas",
      "Servicing the gas stove"
    ),
    summary: l4(
      "Gelbe, flackernde Flamme und lange Kochzeiten: Der Kocher ist fast nie kaputt, sondern verstopft.",
      "Flamme jaune et vacillante, cuissons interminables : le réchaud n'est presque jamais cassé, il est bouché.",
      "Fiamma gialla e tremolante e tempi lunghi: il fornello non è quasi mai rotto, è intasato.",
      "A yellow, flickering flame and long cooking times: the stove is almost never broken, just clogged."
    ),
    when: l4(
      "Wenn die Flamme gelb statt blau brennt, ungleichmässig läuft oder das Wasser doppelt so lange braucht wie sonst.",
      "Quand la flamme est jaune au lieu de bleue, irrégulière, ou que l'eau met deux fois plus de temps.",
      "Quando la fiamma è gialla invece che blu, irregolare, o l'acqua ci mette il doppio.",
      "When the flame burns yellow instead of blue, runs unevenly, or water takes twice as long as usual."
    ),
    materials: [
      l4(
        "Weiche Bürste und ein Zahnstocher aus Holz",
        "Une brosse douce et un cure-dent en bois",
        "Una spazzola morbida e uno stuzzicadenti di legno",
        "A soft brush and a wooden toothpick"
      ),
      l4(
        "Passender Schlüssel für die Düse (oft im Lieferumfang)",
        "La clé adaptée pour le gicleur (souvent fournie)",
        "La chiave adatta per l'ugello (spesso in dotazione)",
        "The right spanner for the jet (often supplied)"
      ),
      l4(
        "Seifenwasser für die Dichtheitsprüfung",
        "De l'eau savonneuse pour le test d'étanchéité",
        "Acqua saponata per la prova di tenuta",
        "Soapy water for the leak test"
      ),
    ],
    steps: [
      {
        title: l4(
          "Kartusche abnehmen",
          "Retirer la cartouche",
          "Staccare la cartuccia",
          "Take the cartridge off"
        ),
        text: l4(
          "Vor jeder Arbeit die Gaskartusche abschrauben und den Kocher auskühlen lassen. Gearbeitet wird im Freien, nie neben einer offenen Flamme oder Zigarette.",
          "Avant toute intervention, dévisse la cartouche et laisse refroidir le réchaud. Travaille dehors, jamais près d'une flamme nue ou d'une cigarette.",
          "Prima di qualsiasi intervento svita la cartuccia e lascia raffreddare il fornello. Si lavora all'aperto, mai vicino a una fiamma libera o a una sigaretta.",
          "Before any work, unscrew the gas cartridge and let the stove cool. Work outdoors, never next to an open flame or a cigarette."
        ),
      },
      {
        title: l4(
          "Brennerkranz reinigen",
          "Nettoyer la couronne du brûleur",
          "Pulire la corona del bruciatore",
          "Clean the burner ring"
        ),
        text: l4(
          "Übergekochte Speisereste sitzen in den Brennerlöchern. Kranz mit der Bürste ausbürsten und die Löcher einzeln mit dem Holz-Zahnstocher freimachen – kein Draht und keine Nadel, beide weiten die Löcher und die Flamme wird nie wieder gleichmässig.",
          "Les débordements bouchent les trous du brûleur. Brosse la couronne et libère chaque trou avec le cure-dent en bois – pas de fil de fer ni d'aiguille : les deux élargissent les trous et la flamme ne redeviendra jamais régulière.",
          "I residui traboccati stanno nei fori del bruciatore. Spazzola la corona e libera i fori uno a uno con lo stuzzicadenti di legno – niente fil di ferro né aghi: allargano i fori e la fiamma non tornerà mai uniforme.",
          "Boil-over residue sits in the burner holes. Brush the ring out and clear each hole with the wooden toothpick – no wire and no needle, both widen the holes and the flame will never burn evenly again."
        ),
      },
      {
        title: l4(
          "Düse prüfen",
          "Contrôler le gicleur",
          "Controllare l'ugello",
          "Check the jet"
        ),
        text: l4(
          "Bei Kochern mit abschraubbarer Düse diese herausdrehen und gegen das Licht halten: Man muss durch die winzige Bohrung hindurchsehen. Nur ausblasen oder in warmem Wasser einweichen, niemals aufbohren.",
          "Sur les réchauds à gicleur démontable, dévisse-le et regarde à contre-jour : on doit voir à travers le minuscule orifice. Souffle ou fais tremper à l'eau chaude, ne perce jamais.",
          "Sui fornelli con ugello svitabile, toglilo e guardalo controluce: si deve vedere attraverso il foro minuscolo. Soffia o lascia in ammollo in acqua calda, mai allargare col trapano.",
          "On stoves with a removable jet, unscrew it and hold it to the light: you must be able to see through the tiny orifice. Only blow it clear or soak it in warm water – never drill it."
        ),
      },
      {
        title: l4(
          "Dichtung und Dichtheit prüfen",
          "Vérifier le joint et l'étanchéité",
          "Controllare guarnizione e tenuta",
          "Check the seal and for leaks"
        ),
        text: l4(
          "Gummidichtung am Anschluss ansehen: rissig oder hart heisst ersetzen. Danach Kartusche anschrauben, Ventil geschlossen lassen und die Verbindung mit Seifenwasser bestreichen – Blasen bedeuten undicht. Dann sofort abschrauben und den Kocher in den Fachbetrieb geben.",
          "Regarde le joint en caoutchouc du raccord : fissuré ou durci, il faut le remplacer. Ensuite, visse la cartouche, laisse la vanne fermée et badigeonne le raccord d'eau savonneuse – des bulles signifient une fuite. Dans ce cas, dévisse aussitôt et confie le réchaud à un atelier.",
          "Guarda la guarnizione in gomma dell'attacco: se è screpolata o dura va sostituita. Poi avvita la cartuccia, tieni la valvola chiusa e passa acqua saponata sul raccordo – le bolle significano perdita. In tal caso svita subito e porta il fornello in officina.",
          "Look at the rubber seal at the connector: cracked or hardened means replace it. Then screw the cartridge on, keep the valve closed and brush the joint with soapy water – bubbles mean a leak. If so, unscrew it at once and take the stove to a repair shop."
        ),
      },
    ],
    mistake: l4(
      "Selbst an Schlauch, Ventil oder Druckregler herumschrauben. Gasführende Teile jenseits von Dichtung und Düse gehören in den Fachbetrieb – hier steht nicht ein Kochtopf auf dem Spiel, sondern das Zelt.",
      "Bricoler soi-même le tuyau, la vanne ou le détendeur. Les pièces sous gaz au-delà du joint et du gicleur relèvent d'un atelier – ici, ce n'est pas une casserole qui est en jeu, mais la tente.",
      "Mettere mano da soli a tubo, valvola o riduttore di pressione. Le parti sotto gas oltre guarnizione e ugello vanno in officina – qui non è in gioco una pentola, ma la tenda.",
      "Fiddling with the hose, valve or regulator yourself. Gas-carrying parts beyond the seal and the jet belong in a workshop – what is at stake here is not a saucepan but the tent."
    ),
    minutes: 30,
    intervalMonths: 12,
  },
  {
    id: "schlafsack",
    title: l4(
      "Schlafsack waschen und auffrischen",
      "Laver et regonfler le sac de couchage",
      "Lavare e rinfrescare il sacco a pelo",
      "Washing and reviving the sleeping bag"
    ),
    summary: l4(
      "Ein flach gewordener Schlafsack ist meist nicht alt, sondern schmutzig – Hautfett verklebt die Füllung.",
      "Un sac de couchage aplati n'est en général pas vieux, mais sale – le sébum colle le garnissage.",
      "Un sacco a pelo appiattito di solito non è vecchio, ma sporco – il sebo incolla l'imbottitura.",
      "A sleeping bag that has gone flat is usually not old but dirty – body oils clog the fill."
    ),
    when: l4(
      "Wenn er nach dem Ausschütteln nicht mehr richtig aufplustert oder anfängt zu riechen. Bei normalem Gebrauch etwa einmal pro Saison.",
      "Quand il ne regonfle plus correctement après avoir été secoué, ou qu'il commence à sentir. En usage normal, environ une fois par saison.",
      "Quando dopo averlo scosso non si gonfia più bene o inizia a odorare. Con uso normale circa una volta a stagione.",
      "When it no longer lofts up properly after shaking, or starts to smell. With normal use, about once a season."
    ),
    materials: [
      l4(
        "Spezialwaschmittel für Daune oder Kunstfaser",
        "Une lessive spéciale duvet ou fibre synthétique",
        "Detersivo specifico per piuma o fibra sintetica",
        "A dedicated down or synthetic wash"
      ),
      l4(
        "Waschmaschine ohne Bottichkreuz oder eine grosse Badewanne",
        "Une machine à laver sans agitateur ou une grande baignoire",
        "Una lavatrice senza agitatore o una vasca grande",
        "A washing machine without an agitator, or a large bathtub"
      ),
      l4(
        "Zwei bis drei Tennisbälle für den Trockner",
        "Deux à trois balles de tennis pour le sèche-linge",
        "Due o tre palline da tennis per l'asciugatrice",
        "Two or three tennis balls for the dryer"
      ),
    ],
    steps: [
      {
        title: l4(
          "Erst lüften, dann waschen",
          "Aérer d'abord, laver ensuite",
          "Prima arieggiare, poi lavare",
          "Air it first, wash it second"
        ),
        text: l4(
          "Oft reicht ein Tag im Schatten an der frischen Luft. Waschen ist immer eine Belastung für die Füllung – deshalb so oft wie nötig und so selten wie möglich.",
          "Souvent, une journée à l'ombre au grand air suffit. Le lavage sollicite toujours le garnissage – donc aussi souvent que nécessaire et aussi rarement que possible.",
          "Spesso basta una giornata all'ombra all'aria aperta. Il lavaggio è sempre uno stress per l'imbottitura – quindi tanto spesso quanto necessario e il più raramente possibile.",
          "Often a day in the shade in fresh air is enough. Washing always stresses the fill – so as often as necessary and as rarely as possible."
        ),
      },
      {
        title: l4(
          "Schonend waschen",
          "Laver en douceur",
          "Lavare con delicatezza",
          "Wash it gently"
        ),
        text: l4(
          "Reissverschlüsse schliessen, Feinwaschgang bei 30 °C, Spezialwaschmittel, kein Weichspüler. Zweimal spülen, damit keine Waschmittelreste in der Füllung bleiben.",
          "Ferme les fermetures éclair, programme délicat à 30 °C, lessive spéciale, pas d'adoucissant. Rince deux fois pour qu'aucun résidu ne reste dans le garnissage.",
          "Chiudi le cerniere, programma delicato a 30 °C, detersivo specifico, niente ammorbidente. Risciacqua due volte, così non restano residui nell'imbottitura.",
          "Close the zips, delicate cycle at 30 °C, dedicated detergent, no fabric softener. Rinse twice so no detergent stays in the fill."
        ),
      },
      {
        title: l4(
          "Nass tragen wie ein Baby",
          "Porter mouillé comme un bébé",
          "Portarlo bagnato come un bebè",
          "Carry it wet like a baby"
        ),
        text: l4(
          "Ein nasser Schlafsack wiegt viele Kilo. Nie am Fussende hochheben – die nassen Kammern reissen innen ein. Immer mit beiden Armen von unten stützen.",
          "Un sac mouillé pèse plusieurs kilos. Ne le soulève jamais par le pied – les cloisons mouillées se déchirent à l'intérieur. Soutiens-le toujours à deux bras par en dessous.",
          "Un sacco bagnato pesa parecchi chili. Non sollevarlo mai dal fondo – le camere bagnate si strappano all'interno. Sostienilo sempre con entrambe le braccia da sotto.",
          "A wet bag weighs several kilos. Never lift it by the foot end – the wet baffles tear inside. Always support it from underneath with both arms."
        ),
      },
      {
        title: l4(
          "Mit Bällen trocknen",
          "Sécher avec des balles",
          "Asciugare con le palline",
          "Dry it with balls"
        ),
        text: l4(
          "Im Trockner bei NIEDRIGER Temperatur mit zwei bis drei Tennisbällen trocknen; die Bälle schlagen die Klumpen auf. Das dauert bei Daune mehrere Stunden – erst fertig, wenn sich keine Klümpchen mehr ertasten lassen.",
          "Sèche au sèche-linge à BASSE température avec deux ou trois balles de tennis ; les balles cassent les grumeaux. Avec du duvet, cela prend plusieurs heures – c'est fini seulement quand on ne sent plus aucune boulette.",
          "Asciuga in asciugatrice a temperatura BASSA con due o tre palline da tennis; le palline rompono i grumi. Con la piuma ci vogliono più ore – è pronto solo quando non si sentono più grumetti.",
          "Tumble dry on LOW heat with two or three tennis balls; the balls break up the clumps. With down this takes several hours – only done when you can no longer feel any lumps."
        ),
      },
    ],
    mistake: l4(
      "Den Schlafsack im Packsack aufbewahren. Zusammengepresst verliert die Füllung dauerhaft an Bauschkraft, und genau die hält warm. Zu Hause gehört er locker in einen grossen Baumwollsack oder über einen Bügel.",
      "Conserver le sac dans son sac de compression. Comprimé, le garnissage perd durablement son gonflant – et c'est justement lui qui tient chaud. À la maison, il va sans serrer dans un grand sac en coton ou sur un cintre.",
      "Conservare il sacco a pelo nella sacca di compressione. Compressa, l'imbottitura perde stabilmente il potere gonfiante – ed è proprio quello che tiene caldo. A casa va tenuto largo in un grande sacco di cotone o su una gruccia.",
      "Storing the bag in its stuff sack. Compressed, the fill permanently loses loft – and loft is what keeps you warm. At home it belongs loosely in a big cotton sack or over a hanger."
    ),
    minutes: 45,
    intervalMonths: 12,
  },
  {
    id: "regenjacke",
    title: l4(
      "Regenjacke wieder dicht bekommen",
      "Redonner son étanchéité à la veste de pluie",
      "Rendere di nuovo impermeabile la giacca antipioggia",
      "Getting the rain jacket working again"
    ),
    summary: l4(
      "Wenn die Jacke innen klamm wird, ist meist nicht die Membran kaputt, sondern die Aussenhaut saugt Wasser.",
      "Quand la veste devient moite à l'intérieur, ce n'est en général pas la membrane qui est morte : c'est le tissu extérieur qui boit l'eau.",
      "Quando la giacca diventa umida all'interno, di solito non è la membrana a essere rotta: è il tessuto esterno che assorbe acqua.",
      "When the jacket feels clammy inside, the membrane is usually fine – the outer face is soaking up water."
    ),
    when: l4(
      "Wenn das Wasser auf dem Ärmel nicht mehr abperlt, sondern der Stoff dunkel wird. Das nennt sich «durchnässt» und fühlt sich von innen wie undicht an.",
      "Quand l'eau ne perle plus sur la manche et que le tissu fonce. Cela s'appelle « mouillage » et donne de l'intérieur l'impression d'une fuite.",
      "Quando l'acqua non perla più sulla manica e il tessuto si scurisce. Si chiama «bagnamento» e da dentro sembra una perdita.",
      "When water no longer beads on the sleeve and the fabric darkens instead. That is called wetting out, and from the inside it feels like a leak."
    ),
    materials: [
      l4(
        "Spezialwaschmittel für Membrantextilien",
        "Une lessive spéciale pour textiles à membrane",
        "Detersivo specifico per tessuti con membrana",
        "A dedicated wash for membrane fabrics"
      ),
      l4(
        "Imprägniermittel zum Einwaschen oder Aufsprühen",
        "Un imperméabilisant à laver ou à vaporiser",
        "Impregnante da lavaggio o spray",
        "A wash-in or spray-on waterproofing treatment"
      ),
      l4(
        "Trockner oder Bügeleisen mit Tuch (je nach Pflegeetikett)",
        "Un sèche-linge ou un fer à repasser avec un linge (selon l'étiquette)",
        "Asciugatrice o ferro da stiro con un panno (secondo l'etichetta)",
        "A dryer or an iron with a cloth (as the care label allows)"
      ),
    ],
    steps: [
      {
        title: l4(
          "Zuerst waschen",
          "Laver d'abord",
          "Prima lavare",
          "Wash it first"
        ),
        text: l4(
          "Schmutz, Schweiss und Waschmittelreste sind der häufigste Grund für eine saugende Aussenhaut. Feinwaschgang mit Spezialwaschmittel, kein Weichspüler, zweimal spülen.",
          "Saleté, transpiration et résidus de lessive sont la cause la plus fréquente d'un tissu qui boit. Programme délicat avec lessive spéciale, pas d'adoucissant, double rinçage.",
          "Sporco, sudore e residui di detersivo sono la causa più frequente di un tessuto che assorbe. Programma delicato con detersivo specifico, niente ammorbidente, doppio risciacquo.",
          "Dirt, sweat and detergent residue are the most common reason for an outer face that soaks up water. Delicate cycle with a dedicated wash, no softener, rinse twice."
        ),
      },
      {
        title: l4(
          "Imprägnierung erneuern",
          "Renouveler l'imperméabilisation",
          "Rinnovare l'impregnazione",
          "Renew the finish"
        ),
        text: l4(
          "Einwaschmittel im zweiten Waschgang oder Spray auf die feuchte Jacke, gleichmässig und auch auf Schultern und Ärmel – dort scheuert der Rucksack die Imprägnierung zuerst weg.",
          "Produit à laver lors d'un second cycle ou spray sur la veste humide, uniformément et aussi sur les épaules et les manches – c'est là que le sac à dos use l'imperméabilisation en premier.",
          "Prodotto da lavaggio in un secondo ciclo o spray sulla giacca umida, in modo uniforme e anche su spalle e maniche – lì lo zaino consuma per primo l'impregnazione.",
          "Wash-in product on a second cycle, or spray onto the damp jacket, evenly and including shoulders and sleeves – that is where a rucksack rubs the finish off first."
        ),
      },
      {
        title: l4(
          "Mit Wärme aktivieren",
          "Activer par la chaleur",
          "Attivare con il calore",
          "Activate it with heat"
        ),
        text: l4(
          "Die meisten Imprägnierungen brauchen Wärme: 20 Minuten in den Trockner bei niedriger Stufe oder mit dem Bügeleisen auf kleiner Stufe UND einem Tuch dazwischen. Was das Pflegeetikett verbietet, gilt.",
          "La plupart des imperméabilisants ont besoin de chaleur : 20 minutes au sèche-linge à basse température, ou au fer doux AVEC un linge entre les deux. Ce que l'étiquette interdit fait foi.",
          "La maggior parte degli impregnanti ha bisogno di calore: 20 minuti in asciugatrice a bassa temperatura oppure con il ferro a bassa temperatura E un panno in mezzo. Vale quello che vieta l'etichetta.",
          "Most finishes need heat: 20 minutes in the dryer on low, or an iron on a low setting WITH a cloth in between. Whatever the care label forbids wins."
        ),
      },
      {
        title: l4(
          "Nähte kontrollieren",
          "Contrôler les coutures",
          "Controllare le cuciture",
          "Check the seams"
        ),
        text: l4(
          "Löst sich innen das Nahtband ab, hilft keine Imprägnierung mehr. Kleine Stellen lassen sich mit Nahtdichter für Membranstoffe retten, grossflächig abgelöste Bänder sind ein Fall für den Fachbetrieb.",
          "Si le ruban de couture se décolle à l'intérieur, aucun imperméabilisant n'y changera rien. De petites zones se rattrapent avec un mastic pour tissus à membrane ; des bandes largement décollées relèvent d'un atelier.",
          "Se all'interno si stacca il nastro di cucitura, nessun impregnante serve più. I punti piccoli si salvano con un sigillante per tessuti con membrana, i nastri staccati su ampie zone sono un caso da officina.",
          "If the seam tape is peeling off inside, no waterproofing will help. Small areas can be saved with a sealant for membrane fabrics; widely detached tape is a job for a repair shop."
        ),
      },
    ],
    mistake: l4(
      "Die Jacke nie zu waschen, um sie zu schonen. Genau das macht sie undicht: Eine schmutzige Aussenhaut saugt Wasser, die Membran kann die Feuchtigkeit von innen nicht mehr abgeben – und die Jacke fühlt sich nass an, obwohl kein Tropfen durchkommt.",
      "Ne jamais laver la veste pour la ménager. C'est justement ce qui la rend « perméable » : un tissu sale boit l'eau, la membrane ne peut plus évacuer l'humidité de l'intérieur – et la veste semble mouillée alors que pas une goutte ne passe.",
      "Non lavare mai la giacca per non rovinarla. È proprio questo a renderla «permeabile»: un tessuto sporco assorbe acqua, la membrana non riesce più a far uscire l'umidità dall'interno – e la giacca sembra bagnata anche se non passa una goccia.",
      "Never washing the jacket to spare it. That is exactly what makes it “leak”: a dirty outer face soaks up water, the membrane can no longer let moisture out – and the jacket feels wet even though not a drop gets through."
    ),
    minutes: 30,
    intervalMonths: 12,
  },
  {
    id: "lampen",
    title: l4(
      "Lampen und Batteriekontakte",
      "Lampes et contacts de piles",
      "Lampade e contatti delle batterie",
      "Lamps and battery contacts"
    ),
    summary: l4(
      "Die Stirnlampe geht nicht mehr an? In den meisten Fällen sind es die Kontakte, nicht die Elektronik.",
      "La frontale ne s'allume plus ? Dans la plupart des cas, ce sont les contacts, pas l'électronique.",
      "La frontale non si accende più? Nella maggior parte dei casi sono i contatti, non l'elettronica.",
      "Head torch not coming on? In most cases it is the contacts, not the electronics."
    ),
    when: l4(
      "Wenn die Lampe flackert, nur bei Druck aufs Gehäuse leuchtet oder nach dem Winter gar nicht mehr angeht.",
      "Quand la lampe clignote, ne s'allume qu'en appuyant sur le boîtier ou ne démarre plus après l'hiver.",
      "Quando la lampada sfarfalla, si accende solo premendo sul corpo o dopo l'inverno non parte più.",
      "When the lamp flickers, only lights when you squeeze the housing, or will not start at all after winter."
    ),
    materials: [
      l4(
        "Wattestäbchen und etwas Haushaltsessig oder Zitronensäure",
        "Des cotons-tiges et un peu de vinaigre ménager ou d'acide citrique",
        "Cotton fioc e un po' di aceto o acido citrico",
        "Cotton buds and a little household vinegar or citric acid"
      ),
      l4(
        "Feines Schleifpapier oder ein Radiergummi",
        "Du papier de verre fin ou une gomme",
        "Carta vetrata fine o una gomma da cancellare",
        "Fine sandpaper or a pencil eraser"
      ),
      l4(
        "Frische Batterien desselben Typs",
        "Des piles neuves du même type",
        "Batterie nuove dello stesso tipo",
        "Fresh batteries of the same type"
      ),
    ],
    steps: [
      {
        title: l4(
          "Fach öffnen und anschauen",
          "Ouvrir le compartiment et regarder",
          "Aprire il vano e guardare",
          "Open the compartment and look"
        ),
        text: l4(
          "Weisse, krümelige Beläge an den Federn sind ausgelaufene Batterien. Mit Handschuhen arbeiten und den Krümel nicht einatmen – das Zeug ist ätzend.",
          "Des dépôts blancs et friables sur les ressorts indiquent des piles qui ont coulé. Travaille avec des gants et n'inhale pas la poudre – c'est corrosif.",
          "Depositi bianchi e friabili sulle molle indicano batterie che hanno perso. Lavora con i guanti e non inalare la polvere – è corrosiva.",
          "White, crumbly deposits on the springs mean leaked batteries. Wear gloves and do not breathe in the dust – the stuff is caustic."
        ),
      },
      {
        title: l4(
          "Kontakte reinigen",
          "Nettoyer les contacts",
          "Pulire i contatti",
          "Clean the contacts"
        ),
        text: l4(
          "Belag mit einem in Essig getauchten Wattestäbchen lösen, danach mit klarem Wasser nachwischen und gut trocknen. Blanke Stellen mit Schleifpapier oder dem Radiergummi aufhellen, bis sie metallisch glänzen.",
          "Dissous le dépôt avec un coton-tige imbibé de vinaigre, essuie à l'eau claire et sèche bien. Ravive les surfaces avec du papier de verre ou la gomme jusqu'à ce qu'elles brillent.",
          "Sciogli il deposito con un cotton fioc imbevuto di aceto, poi passa acqua pulita e asciuga bene. Ravviva i contatti con carta vetrata o gomma finché brillano.",
          "Dissolve the deposit with a vinegar-dipped cotton bud, wipe with clean water and dry thoroughly. Brighten the contacts with sandpaper or the eraser until they shine."
        ),
      },
      {
        title: l4(
          "Alle Batterien gemeinsam ersetzen",
          "Remplacer toutes les piles ensemble",
          "Sostituire tutte le batterie insieme",
          "Replace all batteries together"
        ),
        text: l4(
          "Immer den ganzen Satz wechseln und nie Marken oder Typen mischen. Eine schwache Zelle im Satz wird von den anderen tiefentladen – genau so laufen Batterien aus.",
          "Change toujours le jeu complet et ne mélange jamais marques ni types. Une cellule faible est déchargée à fond par les autres – c'est exactement ainsi que les piles coulent.",
          "Cambia sempre tutto il set e non mischiare marche o tipi. Una cella debole viene scaricata a fondo dalle altre – è proprio così che le batterie perdono.",
          "Always change the whole set and never mix brands or types. A weak cell gets deep-discharged by the others – that is exactly how batteries leak."
        ),
      },
      {
        title: l4(
          "Für die Lagerung entnehmen",
          "Retirer pour le stockage",
          "Togliere per il rimessaggio",
          "Take them out for storage"
        ),
        text: l4(
          "Vor der Winterpause die Batterien aus allen Lampen nehmen. Das ist die einzige Massnahme, die ausgelaufene Batterien wirklich verhindert.",
          "Avant la pause hivernale, retire les piles de toutes les lampes. C'est la seule mesure qui empêche vraiment les fuites.",
          "Prima della pausa invernale togli le batterie da tutte le lampade. È l'unica misura che impedisce davvero le perdite.",
          "Before the winter break, take the batteries out of every lamp. It is the one measure that genuinely prevents leaks."
        ),
      },
    ],
    mistake: l4(
      "Auf Verdacht eine neue Lampe kaufen. Selbst wenn eine Leuchtdiode wirklich defekt ist: Bei den meisten Modellen gibt es Ersatzteile, und der Reparaturversuch kostet zwanzig Minuten – ein neues Gerät kostet ein Vielfaches und die alte Lampe landet im Elektroschrott.",
      "Acheter une nouvelle lampe au premier doute. Même si une LED est vraiment morte : la plupart des modèles ont des pièces de rechange, et une tentative de réparation coûte vingt minutes – un appareil neuf coûte bien plus, et l'ancien finit aux déchets électroniques.",
      "Comprare subito una lampada nuova. Anche se un LED è davvero guasto: per la maggior parte dei modelli esistono i ricambi e un tentativo di riparazione costa venti minuti – un apparecchio nuovo costa molto di più e il vecchio finisce nei rifiuti elettronici.",
      "Buying a new lamp on suspicion. Even if an LED really has failed: most models have spare parts, and an attempted repair costs twenty minutes – a new device costs many times that, and the old lamp ends up as electronic waste."
    ),
    minutes: 20,
    intervalMonths: 12,
  },
  {
    id: "rucksack",
    title: l4(
      "Rucksack: Schnalle, Naht, Reissverschluss",
      "Sac à dos : boucle, couture, fermeture",
      "Zaino: fibbia, cucitura, cerniera",
      "Rucksack: buckle, seam, zip"
    ),
    summary: l4(
      "Ein Rucksack fällt selten ganz aus – aber eine gebrochene Hüftschnalle macht ihn unbrauchbar.",
      "Un sac à dos tombe rarement en panne complète – mais une boucle de ceinture cassée le rend inutilisable.",
      "Uno zaino raramente si rompe del tutto – ma una fibbia del cinturone rotta lo rende inutilizzabile.",
      "A rucksack rarely fails completely – but a broken hip buckle makes it useless."
    ),
    when: l4(
      "Wenn eine Schnalle Risse zeigt, eine Naht aufgeht oder der Reissverschluss hinter dem Schieber aufspringt.",
      "Quand une boucle se fissure, qu'une couture lâche ou que la fermeture se rouvre derrière le curseur.",
      "Quando una fibbia mostra crepe, una cucitura si apre o la cerniera si riapre dietro il cursore.",
      "When a buckle shows cracks, a seam gives way, or the zip springs open behind the slider."
    ),
    materials: [
      l4(
        "Ersatzschnalle in der passenden Gurtbreite (20, 25, 38 oder 50 mm)",
        "Une boucle de rechange à la bonne largeur de sangle (20, 25, 38 ou 50 mm)",
        "Fibbia di ricambio della larghezza giusta (20, 25, 38 o 50 mm)",
        "A replacement buckle in the right webbing width (20, 25, 38 or 50 mm)"
      ),
      l4(
        "Reissnadel oder Sattlernadel und starkes Garn",
        "Une aiguille solide ou aiguille de sellier et du fil résistant",
        "Ago robusto o da sellaio e filo forte",
        "A heavy-duty or saddler's needle and strong thread"
      ),
      l4(
        "Feuerzeug zum Versiegeln der Gurtenden",
        "Un briquet pour sceller les extrémités de sangle",
        "Un accendino per sigillare le estremità del nastro",
        "A lighter to seal the webbing ends"
      ),
    ],
    steps: [
      {
        title: l4(
          "Schnalle ausmessen",
          "Mesurer la boucle",
          "Misurare la fibbia",
          "Measure the buckle"
        ),
        text: l4(
          "Nicht die Schnalle messen, sondern die GURTBREITE – danach richtet sich das Ersatzteil. Es gibt Steckschnallen zum Auffädeln und geteilte zum Nachrüsten, die sich ohne Auftrennen der Naht montieren lassen.",
          "Ne mesure pas la boucle, mais la LARGEUR DE SANGLE – c'est elle qui détermine la pièce. Il existe des boucles à enfiler et des boucles en deux parties, qui se montent sans découdre.",
          "Non misurare la fibbia, ma la LARGHEZZA DEL NASTRO – da lì dipende il ricambio. Esistono fibbie da infilare e fibbie divise, montabili senza scucire.",
          "Do not measure the buckle, measure the WEBBING WIDTH – that determines the spare part. There are buckles to thread on and split ones that fit without unpicking the seam."
        ),
      },
      {
        title: l4(
          "Gurtende sichern",
          "Sécuriser le bout de sangle",
          "Fissare l'estremità del nastro",
          "Secure the webbing end"
        ),
        text: l4(
          "Vor dem Auffädeln das Gurtband mit dem Feuerzeug kurz anschmelzen, damit es nicht ausfranst. Nach dem Einfädeln das Ende umschlagen und mit ein paar kräftigen Stichen sichern.",
          "Avant d'enfiler, fais fondre brièvement le bout de la sangle au briquet pour qu'elle ne s'effiloche pas. Après l'enfilage, replie l'extrémité et fixe-la de quelques points solides.",
          "Prima di infilare, fondi brevemente l'estremità del nastro con l'accendino perché non si sfilacci. Dopo averlo infilato, ripiega il capo e fissalo con qualche punto robusto.",
          "Before threading, melt the webbing end briefly with the lighter so it does not fray. Once threaded, fold the end over and secure it with a few firm stitches."
        ),
      },
      {
        title: l4(
          "Nähte doppelt nähen",
          "Coudre les coutures en double",
          "Cucire due volte le cuciture",
          "Sew seams twice"
        ),
        text: l4(
          "Aufgegangene Nähte an Trägern und Schlaufen mit doppeltem Faden und im Rückstich nähen, dann eine zweite Reihe daneben. Ein Träger trägt das ganze Gewicht – hier ist Doppeltnähen keine Übertreibung.",
          "Couds les coutures lâchées des bretelles et des boucles avec un fil double au point arrière, puis une seconde rangée à côté. Une bretelle porte tout le poids – ici, coudre en double n'est pas exagéré.",
          "Cuci le cuciture aperte di spallacci e asole con filo doppio a punto indietro, poi una seconda fila accanto. Uno spallaccio regge tutto il peso – qui cucire due volte non è esagerato.",
          "Sew failed seams on straps and loops with doubled thread in backstitch, then add a second row alongside. A shoulder strap carries the whole load – doubling up is not overkill here."
        ),
      },
      {
        title: l4(
          "Reissverschluss retten",
          "Sauver la fermeture éclair",
          "Salvare la cerniera",
          "Rescue the zip"
        ),
        text: l4(
          "Springt der Verschluss hinter dem Schieber auf, ist der Schieber ausgeleiert: mit der Zange oben und unten vorsichtig einen Hauch zusammendrücken. Fehlen Zähne, hilft nur ein neuer Reissverschluss aus dem Fachbetrieb.",
          "Si la fermeture se rouvre derrière le curseur, celui-ci est fatigué : pince-le délicatement en haut et en bas. S'il manque des dents, seule une nouvelle fermeture posée en atelier aide.",
          "Se la cerniera si riapre dietro il cursore, il cursore è allentato: stringilo con cautela sopra e sotto con la pinza. Se mancano dei denti, serve una cerniera nuova montata in officina.",
          "If the zip springs open behind the slider, the slider is worn: squeeze it gently top and bottom with pliers. If teeth are missing, only a new zip fitted by a repair shop will do."
        ),
      },
    ],
    mistake: l4(
      "Für die Reparatur die Hersteller-Garantie aufs Spiel setzen. Viele Rucksack-Hersteller reparieren jahrzehntelang und oft kostenlos – vor dem Auftrennen einer Naht lohnt eine kurze Anfrage beim Hersteller mehr als jeder Flicken.",
      "Compromettre la garantie du fabricant en réparant soi-même. Beaucoup de fabricants de sacs réparent pendant des décennies, souvent gratuitement – avant de découdre, une demande au fabricant vaut mieux que n'importe quelle rustine.",
      "Mettere a rischio la garanzia del produttore riparando da sé. Molti produttori di zaini riparano per decenni, spesso gratuitamente – prima di scucire, una domanda al produttore vale più di qualsiasi toppa.",
      "Risking the maker's warranty by repairing it yourself. Many rucksack makers repair for decades, often free of charge – before unpicking a seam, a quick question to the manufacturer beats any patch."
    ),
    minutes: 35,
    intervalMonths: null,
  },
];
