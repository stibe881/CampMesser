/**
 * Zeltpflege-Ratgeber (#265): imprägnieren, flicken, Reissverschluss,
 * Schimmel – die sieben Arbeiten, die ein Zelt über Jahre am Leben halten.
 *
 * Warum das ein eigenes Modul ist und nicht ein Merkzettel: Fast alle
 * Zeltschäden entstehen nicht am Zeltplatz, sondern im Keller. Feucht
 * eingepackt, ein Sommer Pause, und die Beschichtung ist hin – dagegen
 * hilft kein Material, nur Wissen im richtigen Moment.
 *
 * Die Reihenfolge der Einträge folgt dem Ablauf einer Saison: nach der
 * Reise (trocknen, reinigen), vor der Saison (imprägnieren, Nähte,
 * Reissverschluss) und im Schadensfall (Riss, Schimmel).
 *
 * Alle Angaben gelten für die in Europa üblichen Zeltstoffe – Polyester
 * und Nylon mit PU- oder Silikon-Beschichtung sowie Baumwoll-Mischgewebe.
 * Wo sich die Behandlung je nach Stoff unterscheidet, steht das im Schritt
 * dabei, statt eine Regel für alle zu behaupten.
 */
import { l4 } from "@shared/i18n";
import { type CareGuide } from "./careGuides";

export const tentCareGuides: CareGuide[] = [
  {
    id: "trocknen-lagern",
    title: l4(
      "Trocknen und einlagern",
      "Sécher et ranger",
      "Asciugare e riporre",
      "Drying and storing"
    ),
    summary: l4(
      "Die wichtigste Pflege überhaupt: Ein Zelt stirbt fast nie am Zeltplatz, sondern feucht verpackt im Keller.",
      "Le soin le plus important de tous : une tente ne meurt presque jamais au camping, mais rangée humide à la cave.",
      "La cura più importante in assoluto: una tenda non muore quasi mai in campeggio, ma riposta umida in cantina.",
      "The single most important bit of care: a tent almost never dies at the campsite, but packed away damp in the cellar."
    ),
    when: l4(
      "Nach jeder Reise – auch nach einem trockenen Wochenende, denn Morgentau reicht völlig aus.",
      "Après chaque voyage – même après un week-end sec, car la rosée du matin suffit largement.",
      "Dopo ogni viaggio – anche dopo un fine settimana asciutto, perché la rugiada del mattino basta e avanza.",
      "After every trip – even a dry weekend, because morning dew is quite enough on its own."
    ),
    materials: [
      l4(
        "Trockener, schattiger Platz (Estrich, Garage, Wäscheleine)",
        "Un endroit sec et ombragé (galetas, garage, corde à linge)",
        "Un posto asciutto e ombreggiato (solaio, garage, filo da bucato)",
        "A dry, shaded spot (attic, garage, washing line)"
      ),
      l4(
        "Grosser, luftiger Sack oder Kiste statt der engen Packhülle",
        "Un grand sac aéré ou une caisse plutôt que la housse serrée",
        "Un sacco grande e areato o una cassa invece della custodia stretta",
        "A large, breathable bag or box instead of the tight stuff sack"
      ),
    ],
    steps: [
      {
        title: l4(
          "Zu Hause nochmals aufstellen",
          "Remonter à la maison",
          "Rimontare a casa",
          "Pitch it again at home"
        ),
        text: l4(
          "Zelt im Garten oder in der Garage aufstellen, alle Türen und Fenster öffnen. Geht das nicht: über zwei Wäscheleinen hängen und einmal wenden. Zwei bis drei Stunden reichen meist, der Boden braucht am längsten.",
          "Monte la tente au jardin ou au garage, ouvre toutes les portes et fenêtres. Si c'est impossible : suspends-la sur deux cordes à linge et retourne-la une fois. Deux à trois heures suffisent en général, le tapis de sol est le plus lent.",
          "Monta la tenda in giardino o in garage, apri tutte le porte e le finestre. Se non è possibile: appendila su due fili da bucato e giratela una volta. Due o tre ore di solito bastano, il fondo è il più lento.",
          "Pitch the tent in the garden or garage and open every door and window. If that is not possible, hang it over two washing lines and turn it once. Two to three hours is usually enough; the groundsheet takes longest."
        ),
      },
      {
        title: l4(
          "Boden und Nähte prüfen",
          "Contrôler le tapis de sol et les coutures",
          "Controllare fondo e cuciture",
          "Check the floor and seams"
        ),
        text: l4(
          "Mit der flachen Hand über den Zeltboden fahren: Fühlt es sich irgendwo kalt und klamm an, ist es noch nicht trocken. Ecken und Nahtbänder besonders anschauen, dort hält sich die Feuchte am längsten.",
          "Passe la main à plat sur le tapis de sol : si quelque part c'est froid et moite, ce n'est pas encore sec. Regarde surtout les angles et les bandes de couture, l'humidité y reste le plus longtemps.",
          "Passa la mano aperta sul fondo della tenda: se da qualche parte è freddo e umidiccio, non è ancora asciutto. Guarda soprattutto angoli e nastri di cucitura, lì l'umidità resta più a lungo.",
          "Run a flat hand over the groundsheet: wherever it feels cold and clammy, it is not dry yet. Look especially at the corners and seam tape, where damp lingers longest."
        ),
      },
      {
        title: l4(
          "Locker und trocken lagern",
          "Ranger sans serrer et au sec",
          "Riporre senza stringere e all'asciutto",
          "Store it loose and dry"
        ),
        text: l4(
          "Nicht eng gerollt in der Originalhülle lagern, sondern locker in einem grösseren Sack – so bleiben nicht immer dieselben Knicke belastet. Kühl, dunkel und trocken; nicht direkt auf den Kellerboden und nicht neben die Heizung.",
          "Ne range pas la tente serrée dans sa housse d'origine, mais sans serrer dans un sac plus grand – ainsi ce ne sont pas toujours les mêmes plis qui souffrent. Au frais, à l'abri de la lumière et au sec ; pas à même le sol de la cave ni près du chauffage.",
          "Non riporla stretta nella custodia originale, ma allentata in un sacco più grande – così non sono sempre le stesse pieghe a soffrire. Al fresco, al buio e all'asciutto; non direttamente sul pavimento della cantina né vicino al riscaldamento.",
          "Do not store it tightly rolled in its original sack, but loosely in a bigger bag – that way the same creases are not always under strain. Cool, dark and dry; not directly on the cellar floor and not next to the heating."
        ),
      },
    ],
    mistake: l4(
      "«Nur ein bisschen feucht, das trocknet im Sack.» Tut es nicht. Bei Zimmertemperatur reichen zwei Tage, bis es riecht, und aus dem Geruch wird Schimmel, der die Beschichtung frisst.",
      "« À peine humide, ça séchera dans le sac. » Non. À température ambiante, deux jours suffisent pour que ça sente, et l'odeur devient de la moisissure qui ronge l'enduction.",
      "«È solo un po' umida, si asciuga nel sacco.» No. A temperatura ambiente bastano due giorni perché puzzi, e dall'odore nasce la muffa che mangia la spalmatura.",
      "“It's only slightly damp, it'll dry in the bag.” It will not. At room temperature two days are enough for it to smell, and that smell becomes mould that eats the coating."
    ),
    minutes: 20,
    intervalMonths: null,
  },
  {
    id: "reinigen",
    title: l4(
      "Zelt reinigen",
      "Nettoyer la tente",
      "Pulire la tenda",
      "Cleaning the tent"
    ),
    summary: l4(
      "Erde, Vogelkot und Baumharz gehören weg – aber ohne Waschmaschine, Weichspüler und Hochdruckreiniger.",
      "Terre, fientes et résine doivent partir – mais sans machine à laver, adoucissant ni nettoyeur haute pression.",
      "Terra, escrementi di uccelli e resina devono sparire – ma senza lavatrice, ammorbidente e idropulitrice.",
      "Soil, bird droppings and tree resin have to go – but without a washing machine, fabric softener or pressure washer."
    ),
    when: l4(
      "Einmal pro Saison und immer dann, wenn sichtbarer Schmutz draufliegt. Vogelkot und Harz sofort, beide greifen die Beschichtung an.",
      "Une fois par saison et dès qu'il y a de la saleté visible. Fientes et résine tout de suite : les deux attaquent l'enduction.",
      "Una volta a stagione e ogni volta che c'è sporco visibile. Escrementi di uccelli e resina subito: entrambi aggrediscono la spalmatura.",
      "Once a season, and whenever there is visible dirt. Bird droppings and resin straight away – both attack the coating."
    ),
    materials: [
      l4(
        "Weicher Schwamm oder Bürste mit weichen Borsten",
        "Une éponge douce ou une brosse à poils souples",
        "Una spugna morbida o una spazzola a setole morbide",
        "A soft sponge or soft-bristled brush"
      ),
      l4(
        "Lauwarmes Wasser, höchstens 30 °C",
        "De l'eau tiède, 30 °C au maximum",
        "Acqua tiepida, al massimo 30 °C",
        "Lukewarm water, 30 °C at most"
      ),
      l4(
        "Spezialreiniger für Outdoor-Gewebe – kein Geschirrspülmittel",
        "Un nettoyant spécial tissus outdoor – pas de liquide vaisselle",
        "Un detergente specifico per tessuti outdoor – non detersivo per piatti",
        "A dedicated outdoor fabric cleaner – not washing-up liquid"
      ),
    ],
    steps: [
      {
        title: l4(
          "Trocken ausbürsten",
          "Brosser à sec",
          "Spazzolare a secco",
          "Brush it out dry"
        ),
        text: l4(
          "Zelt aufstellen oder auslegen und zuerst trocken ausschütteln und ausbürsten. Sand und Erde nass zu verreiben schmirgelt die Beschichtung – trocken geht das meiste sowieso weg.",
          "Monte ou étale la tente et commence par la secouer et la brosser à sec. Frotter le sable et la terre mouillés ponce l'enduction – à sec, l'essentiel part de toute façon.",
          "Monta o stendi la tenda e per prima cosa scuotila e spazzolala a secco. Strofinare sabbia e terra bagnate carteggia la spalmatura – a secco va via quasi tutto lo stesso.",
          "Pitch or lay out the tent and first shake and brush it out dry. Rubbing wet sand and soil around sands down the coating – dry, most of it comes off anyway."
        ),
      },
      {
        title: l4(
          "Flecken von Hand lösen",
          "Détacher les taches à la main",
          "Togliere le macchie a mano",
          "Work stains off by hand"
        ),
        text: l4(
          "Mit Schwamm, lauwarmem Wasser und wenig Spezialreiniger punktuell arbeiten. Baumharz vorher mit etwas Speiseöl anlösen, dann abwischen und die Stelle mit Wasser nachwaschen.",
          "Travaille par endroits avec l'éponge, de l'eau tiède et un peu de nettoyant spécial. Ramollis d'abord la résine avec un peu d'huile de table, essuie, puis rince la zone à l'eau.",
          "Lavora sui singoli punti con spugna, acqua tiepida e poco detergente specifico. Ammorbidisci prima la resina con un po' d'olio da cucina, poi asciuga e risciacqua la zona con acqua.",
          "Work spot by spot with the sponge, lukewarm water and a little dedicated cleaner. Soften tree resin first with a drop of cooking oil, wipe it off, then rinse the spot with water."
        ),
      },
      {
        title: l4(
          "Klar nachspülen und trocknen",
          "Rincer à l'eau claire et sécher",
          "Risciacquare e asciugare",
          "Rinse clean and dry"
        ),
        text: l4(
          "Reste des Reinigers gut ausspülen – sie ziehen sonst Wasser an und machen genau das kaputt, was die Imprägnierung leisten soll. Danach vollständig trocknen wie nach der Reise.",
          "Rince bien les restes de nettoyant – sinon ils attirent l'eau et ruinent justement ce que l'imperméabilisation doit faire. Sèche ensuite complètement, comme après un voyage.",
          "Risciacqua bene i residui di detergente – altrimenti attirano l'acqua e rovinano proprio ciò che l'impregnazione deve fare. Poi asciuga completamente come dopo un viaggio.",
          "Rinse out all cleaner residue – otherwise it attracts water and ruins exactly what the waterproofing is supposed to do. Then dry it fully, as after a trip."
        ),
      },
    ],
    mistake: l4(
      "Zelt in die Waschmaschine. Die Trommel knickt die Beschichtung, das Waschmittel löst sie an, und Weichspüler zerstört jede Imprägnierung endgültig. Auch der Hochdruckreiniger ist keine Abkürzung – er treibt Wasser durch die Nähte.",
      "Mettre la tente en machine. Le tambour casse l'enduction, la lessive l'attaque et l'adoucissant détruit définitivement toute imperméabilisation. Le nettoyeur haute pression n'est pas un raccourci non plus – il pousse l'eau à travers les coutures.",
      "Mettere la tenda in lavatrice. Il cestello piega la spalmatura, il detersivo la aggredisce e l'ammorbidente distrugge definitivamente ogni impregnazione. Nemmeno l'idropulitrice è una scorciatoia: spinge l'acqua attraverso le cuciture.",
      "Putting the tent in the washing machine. The drum creases the coating, detergent attacks it, and fabric softener destroys any waterproofing for good. A pressure washer is no shortcut either – it drives water straight through the seams."
    ),
    minutes: 45,
    intervalMonths: 12,
  },
  {
    id: "impraegnieren",
    title: l4(
      "Aussenzelt imprägnieren",
      "Imperméabiliser le double-toit",
      "Impermeabilizzare il telo esterno",
      "Re-waterproofing the flysheet"
    ),
    summary: l4(
      "Wenn der Regen nicht mehr abperlt, sondern das Gewebe dunkel wird: Zeit für eine neue Imprägnierung.",
      "Quand la pluie ne perle plus et que le tissu fonce : il est temps de réimperméabiliser.",
      "Quando la pioggia non scivola più e il tessuto si scurisce: è ora di reimpregnare.",
      "When rain stops beading up and the fabric goes dark instead: time to re-waterproof."
    ),
    when: l4(
      "Alle ein bis zwei Saisons, je nach Sonne und Gebrauch. Test: Wasser aufsprühen – bildet es Tropfen, ist alles gut; saugt sich der Stoff dunkel voll, ist die Imprägnierung müde.",
      "Toutes les une à deux saisons, selon le soleil et l'usage. Test : vaporise de l'eau – si elle perle, tout va bien ; si le tissu s'imbibe et fonce, l'imperméabilisation est fatiguée.",
      "Ogni una o due stagioni, a seconda di sole e uso. Test: spruzza dell'acqua – se forma gocce va tutto bene; se il tessuto si imbeve e si scurisce, l'impregnazione è stanca.",
      "Every one to two seasons, depending on sun and use. Test: spray on water – if it beads, all is well; if the fabric soaks up and darkens, the finish is tired."
    ),
    materials: [
      l4(
        "Imprägnierspray oder -mittel, passend zum Stoff (Polyester/Nylon oder Baumwolle)",
        "Un spray ou produit d'imperméabilisation adapté au tissu (polyester/nylon ou coton)",
        "Spray o prodotto impregnante adatto al tessuto (poliestere/nylon o cotone)",
        "Waterproofing spray or wash-in, matched to the fabric (polyester/nylon or cotton)"
      ),
      l4(
        "Sauberes, trockenes Zelt – aufgestellt oder gespannt aufgehängt",
        "Une tente propre et sèche – montée ou suspendue tendue",
        "Una tenda pulita e asciutta – montata o appesa in tensione",
        "A clean, dry tent – pitched or hung up under tension"
      ),
      l4(
        "Tuch zum Verteilen, Handschuhe, Platz im Freien",
        "Un chiffon pour étaler, des gants, de la place dehors",
        "Un panno per stendere, guanti, spazio all'aperto",
        "A cloth for spreading, gloves, space outdoors"
      ),
    ],
    steps: [
      {
        title: l4(
          "Erst reinigen, dann behandeln",
          "Nettoyer d'abord, traiter ensuite",
          "Prima pulire, poi trattare",
          "Clean first, then treat"
        ),
        text: l4(
          "Imprägnierung hält nur auf sauberem Gewebe. Zelt also zuerst reinigen und vollständig trocknen lassen – auf Schmutz aufgetragen, hält das Mittel nur bis zum ersten Regen.",
          "L'imperméabilisant ne tient que sur un tissu propre. Nettoie donc d'abord la tente et laisse-la sécher complètement – appliqué sur la saleté, le produit ne tient que jusqu'à la première pluie.",
          "L'impregnante tiene solo su tessuto pulito. Quindi pulisci prima la tenda e lasciala asciugare del tutto – applicato sullo sporco, il prodotto dura solo fino alla prima pioggia.",
          "Waterproofing only holds on clean fabric. So clean the tent first and let it dry completely – applied over dirt, the product lasts until the first shower."
        ),
      },
      {
        title: l4(
          "Gleichmässig auftragen",
          "Appliquer uniformément",
          "Applicare in modo uniforme",
          "Apply it evenly"
        ),
        text: l4(
          "Aus etwa 20 cm Abstand in überlappenden Bahnen sprühen, von oben nach unten. Auf die Aussenseite des Aussenzelts, nicht ins Innenzelt. Läufer und Pfützen sofort mit dem Tuch verteilen.",
          "Vaporise à environ 20 cm en bandes qui se recouvrent, du haut vers le bas. Sur la face extérieure du double-toit, pas sur la chambre intérieure. Étale aussitôt les coulures avec le chiffon.",
          "Spruzza da circa 20 cm in strisce sovrapposte, dall'alto verso il basso. Sul lato esterno del telo esterno, non sulla camera interna. Distribuisci subito colature e ristagni con il panno.",
          "Spray from about 20 cm in overlapping passes, top to bottom. On the outside of the flysheet, not the inner tent. Spread runs and puddles straight away with the cloth."
        ),
      },
      {
        title: l4(
          "Aushärten lassen",
          "Laisser durcir",
          "Lasciare indurire",
          "Let it cure"
        ),
        text: l4(
          "Im Schatten trocknen lassen, meist einige Stunden – die Angabe auf der Flasche gilt. Manche Mittel brauchen Wärme zum Aushärten; dann hilft ein sonniger, aber nicht brennend heisser Tag.",
          "Laisse sécher à l'ombre, en général quelques heures – suis l'indication sur le flacon. Certains produits ont besoin de chaleur pour durcir ; une journée ensoleillée mais pas brûlante fait l'affaire.",
          "Lascia asciugare all'ombra, di solito alcune ore – vale l'indicazione sulla confezione. Alcuni prodotti hanno bisogno di calore per indurire; allora aiuta una giornata soleggiata ma non rovente.",
          "Let it dry in the shade, usually a few hours – follow the bottle. Some products need warmth to cure; a sunny but not blazing day helps then."
        ),
      },
      {
        title: l4(
          "Kurz gegentesten",
          "Vérifier rapidement",
          "Verificare brevemente",
          "Test it briefly"
        ),
        text: l4(
          "Mit der Giesskanne oder dem Gartenschlauch prüfen, ob das Wasser wieder abperlt. Stellen, die weiterhin dunkel saugen, ein zweites Mal behandeln statt gleich das ganze Zelt.",
          "Vérifie à l'arrosoir ou au tuyau si l'eau perle à nouveau. Traite une seconde fois les zones qui s'imbibent encore, plutôt que toute la tente.",
          "Con l'annaffiatoio o il tubo verifica se l'acqua torna a perlare. Ritratta i punti che ancora si imbevono, invece di rifare tutta la tenda.",
          "Check with a watering can or hose whether water beads again. Treat any patches that still soak up a second time, rather than redoing the whole tent."
        ),
      },
    ],
    mistake: l4(
      "Das Innenzelt mitimprägnieren. Es soll atmen – wird es abgedichtet, bleibt die Feuchtigkeit der Nacht drinnen, und am Morgen tropft es von innen. Genau dann ruft man «das Zelt ist undicht», obwohl es Kondenswasser ist.",
      "Imperméabiliser aussi la chambre intérieure. Elle doit respirer – si on la rend étanche, l'humidité de la nuit reste dedans et le matin ça goutte de l'intérieur. C'est là qu'on dit « la tente fuit », alors que c'est de la condensation.",
      "Impregnare anche la camera interna. Deve respirare – se la si sigilla, l'umidità della notte resta dentro e al mattino gocciola dall'interno. È lì che si dice «la tenda perde», mentre è condensa.",
      "Waterproofing the inner tent as well. It needs to breathe – seal it and the night's moisture stays inside, and in the morning it drips from within. That is exactly when people say “the tent leaks”, when it is condensation."
    ),
    minutes: 60,
    intervalMonths: 24,
  },
  {
    id: "naehte",
    title: l4(
      "Nähte abdichten",
      "Étanchéifier les coutures",
      "Sigillare le cuciture",
      "Sealing the seams"
    ),
    summary: l4(
      "Wo Wasser eindringt, ist fast immer die Naht schuld – nicht der Stoff. Nahtband löst sich mit den Jahren ab.",
      "Là où l'eau entre, c'est presque toujours la couture, pas le tissu. Le ruban de couture se décolle avec les années.",
      "Dove entra l'acqua è quasi sempre colpa della cucitura, non del tessuto. Il nastro di cucitura si stacca con gli anni.",
      "Where water gets in, the seam is almost always to blame – not the fabric. Seam tape peels off over the years."
    ),
    when: l4(
      "Wenn nach Regen Tropfen an einer Naht stehen oder sich das Nahtband innen abrollt und weiss abblättert.",
      "Quand des gouttes perlent le long d'une couture après la pluie, ou que le ruban se décolle et s'effrite en blanc à l'intérieur.",
      "Quando dopo la pioggia si formano gocce lungo una cucitura o il nastro si arrotola e si sfalda in bianco all'interno.",
      "When drops sit along a seam after rain, or the tape inside is curling up and flaking off white."
    ),
    materials: [
      l4(
        "Nahtdichter passend zur Beschichtung (PU oder Silikon – nicht verwechseln)",
        "Un mastic de couture adapté à l'enduction (PU ou silicone – ne pas confondre)",
        "Sigillante per cuciture adatto alla spalmatura (PU o silicone – da non confondere)",
        "Seam sealant matched to the coating (PU or silicone – do not mix them up)"
      ),
      l4(
        "Pinsel oder der Applikator der Flasche",
        "Un pinceau ou l'applicateur du flacon",
        "Pennello o l'applicatore della confezione",
        "A brush or the bottle's applicator"
      ),
      l4(
        "Lappen und Reinigungsalkohol für die alten Reste",
        "Un chiffon et de l'alcool de nettoyage pour les vieux résidus",
        "Un panno e alcol per pulire i vecchi residui",
        "A cloth and rubbing alcohol for the old residue"
      ),
    ],
    steps: [
      {
        title: l4(
          "Undichte Naht finden",
          "Trouver la couture qui fuit",
          "Trovare la cucitura che perde",
          "Find the leaking seam"
        ),
        text: l4(
          "Zelt aufstellen und von aussen mit dem Gartenschlauch abduschen, innen mit der Taschenlampe suchen. Meist sind es First, Ecken und die Stellen, an denen Abspannschlaufen sitzen.",
          "Monte la tente, arrose-la de l'extérieur au tuyau et cherche à l'intérieur avec une lampe. Ce sont le plus souvent le faîte, les angles et les points d'ancrage des haubans.",
          "Monta la tenda, bagnala dall'esterno con il tubo e cerca dentro con la torcia. Di solito sono il colmo, gli angoli e i punti dove sono cucite le asole dei tiranti.",
          "Pitch the tent, hose it from the outside and search inside with a torch. Usually it is the ridge, the corners and the points where guy loops are stitched on."
        ),
      },
      {
        title: l4(
          "Alte Reste entfernen",
          "Enlever les vieux restes",
          "Rimuovere i vecchi residui",
          "Remove the old residue"
        ),
        text: l4(
          "Loses Nahtband vorsichtig abziehen, bröselige Reste mit Lappen und Reinigungsalkohol abnehmen. Fest sitzendes Band bleibt dran – nur die losen Stellen kommen weg.",
          "Retire délicatement le ruban qui se décolle, enlève les résidus friables au chiffon et à l'alcool. Le ruban encore bien collé reste en place – seules les parties décollées partent.",
          "Stacca con cautela il nastro allentato, togli i residui friabili con panno e alcol. Il nastro ben aderente resta – si toglie solo ciò che è staccato.",
          "Peel off any loose tape carefully and wipe crumbling residue away with cloth and alcohol. Tape that is still firmly stuck stays – only the loose bits come off."
        ),
      },
      {
        title: l4(
          "Dünn auftragen, von innen",
          "Appliquer une couche fine, de l'intérieur",
          "Applicare uno strato sottile, dall'interno",
          "Apply a thin coat, from the inside"
        ),
        text: l4(
          "Nahtdichter dünn auf die Innenseite der Naht streichen, etwa einen halben Zentimeter über die Stichlöcher hinaus. Dünn und gleichmässig hält länger als dick und wulstig.",
          "Applique une fine couche à l'intérieur de la couture, en débordant d'un demi-centimètre au-delà des trous d'aiguille. Fin et régulier tient mieux qu'épais et bourrelé.",
          "Stendi il sigillante in strato sottile sul lato interno della cucitura, sconfinando mezzo centimetro oltre i fori dell'ago. Sottile e uniforme dura più di spesso e a bolli.",
          "Brush the sealant thinly onto the inside of the seam, going about half a centimetre beyond the needle holes. Thin and even lasts longer than thick and lumpy."
        ),
      },
      {
        title: l4(
          "Aufgestellt trocknen lassen",
          "Laisser sécher montée",
          "Lasciare asciugare montata",
          "Let it dry pitched"
        ),
        text: l4(
          "Über Nacht aufgestellt lassen, damit nichts zusammenklebt. Erst zusammenpacken, wenn die Naht nicht mehr klebrig ist – sonst klebt das Zelt an sich selbst fest.",
          "Laisse la tente montée toute la nuit pour que rien ne colle ensemble. Ne la replie que lorsque la couture n'est plus poisseuse – sinon la tente se colle à elle-même.",
          "Lasciala montata tutta la notte, così non si incolla nulla. Ripiegala solo quando la cucitura non è più appiccicosa – altrimenti la tenda si incolla su sé stessa.",
          "Leave it pitched overnight so nothing sticks together. Only pack it away once the seam is no longer tacky – otherwise the tent glues itself shut."
        ),
      },
    ],
    mistake: l4(
      "Silikon-Dichter auf ein PU-beschichtetes Zelt (oder umgekehrt). Er hält nicht, lässt sich kaum entfernen und verhindert, dass später der richtige Dichter greift. Steht im Zelt-Datenblatt «silikonisiert», braucht es einen Silikon-Dichter.",
      "Du mastic silicone sur une tente enduite PU (ou l'inverse). Il ne tient pas, s'enlève très mal et empêche le bon produit d'accrocher ensuite. Si la fiche indique « siliconé », il faut un mastic silicone.",
      "Sigillante siliconico su una tenda spalmata PU (o viceversa). Non tiene, si toglie a fatica e impedisce al prodotto giusto di aderire in seguito. Se la scheda dice «siliconata», serve un sigillante al silicone.",
      "Silicone sealant on a PU-coated tent (or the other way round). It will not hold, is very hard to remove and stops the right sealant from bonding later. If the spec sheet says “siliconised”, you need a silicone sealant."
    ),
    minutes: 40,
    intervalMonths: null,
  },
  {
    id: "riss",
    title: l4(
      "Riss oder Loch flicken",
      "Réparer une déchirure ou un trou",
      "Riparare uno strappo o un buco",
      "Patching a tear or hole"
    ),
    summary: l4(
      "Ein Funkenloch oder ein Riss von einem Ast ist am Platz in zehn Minuten geflickt – und zu Hause dauerhaft.",
      "Un trou d'étincelle ou une déchirure due à une branche se répare en dix minutes sur place – et durablement à la maison.",
      "Un buco di scintilla o uno strappo da un ramo si ripara in dieci minuti sul posto – e in modo duraturo a casa.",
      "A spark hole or a branch tear is patched in ten minutes on site – and permanently once home."
    ),
    when: l4(
      "Sofort, sobald du es entdeckst. Jeder Riss wandert weiter, sobald Wind ins Gewebe fährt.",
      "Tout de suite, dès que tu le vois. Toute déchirure s'agrandit dès que le vent s'engouffre dans le tissu.",
      "Subito, appena lo scopri. Ogni strappo si allarga non appena il vento entra nel tessuto.",
      "Straight away, as soon as you spot it. Every tear keeps travelling once the wind gets into the fabric."
    ),
    materials: [
      l4(
        "Selbstklebende Reparaturflicken fürs Zeltgewebe (im Reparaturset)",
        "Des rustines autocollantes pour toile de tente (dans le kit de réparation)",
        "Toppe autoadesive per il telo della tenda (nel kit di riparazione)",
        "Self-adhesive repair patches for tent fabric (in the repair kit)"
      ),
      l4(
        "Schere mit runder Spitze, Lappen, etwas Reinigungsalkohol",
        "Des ciseaux à bout rond, un chiffon, un peu d'alcool de nettoyage",
        "Forbici a punta arrotondata, un panno, un po' di alcol",
        "Round-tipped scissors, a cloth, a little rubbing alcohol"
      ),
      l4(
        "Für zu Hause: Nadel, Faden und Nahtdichter",
        "Pour la maison : aiguille, fil et mastic de couture",
        "Per casa: ago, filo e sigillante per cuciture",
        "For home: needle, thread and seam sealant"
      ),
    ],
    steps: [
      {
        title: l4(
          "Stelle trocknen und reinigen",
          "Sécher et nettoyer la zone",
          "Asciugare e pulire il punto",
          "Dry and clean the spot"
        ),
        text: l4(
          "Der Flicken hält nur auf trockenem, fettfreiem Gewebe. Stelle abwischen, mit etwas Alkohol entfetten und kurz trocknen lassen.",
          "La rustine ne tient que sur un tissu sec et sans gras. Essuie la zone, dégraisse à l'alcool et laisse sécher un instant.",
          "La toppa tiene solo su tessuto asciutto e sgrassato. Pulisci il punto, sgrassalo con un po' d'alcol e lascia asciugare un attimo.",
          "The patch only holds on dry, grease-free fabric. Wipe the area, degrease it with a little alcohol and let it dry briefly."
        ),
      },
      {
        title: l4(
          "Flicken rund zuschneiden",
          "Découper la rustine en rond",
          "Tagliare la toppa rotonda",
          "Cut the patch round"
        ),
        text: l4(
          "Flicken so zuschneiden, dass er den Schaden auf allen Seiten um mindestens zwei Zentimeter überragt – und immer mit RUNDEN Ecken. Eckige Ecken lösen sich als Erstes ab.",
          "Découpe la rustine pour qu'elle dépasse d'au moins deux centimètres de chaque côté – et toujours avec des coins ARRONDIS. Les coins pointus se décollent en premier.",
          "Taglia la toppa in modo che superi il danno di almeno due centimetri su ogni lato – e sempre con angoli ARROTONDATI. Gli angoli vivi sono i primi a staccarsi.",
          "Cut the patch so it overlaps the damage by at least two centimetres on every side – and always with ROUNDED corners. Square corners are the first to peel off."
        ),
      },
      {
        title: l4(
          "Von aussen kleben, von innen sichern",
          "Coller à l'extérieur, doubler à l'intérieur",
          "Incollare fuori, rinforzare dentro",
          "Stick outside, back it inside"
        ),
        text: l4(
          "Ersten Flicken auf die Aussenseite kleben und von der Mitte nach aussen fest andrücken, damit keine Luftblase bleibt. Bei einem längeren Riss zusätzlich einen zweiten Flicken innen gegenkleben.",
          "Colle la première rustine à l'extérieur et presse du centre vers les bords pour ne pas laisser de bulle. Pour une longue déchirure, ajoute une seconde rustine à l'intérieur.",
          "Incolla la prima toppa all'esterno e premi dal centro verso i bordi per non lasciare bolle d'aria. Per uno strappo lungo aggiungi una seconda toppa all'interno.",
          "Stick the first patch on the outside and press from the middle outwards so no air bubble is trapped. For a longer tear, add a second patch on the inside."
        ),
      },
      {
        title: l4(
          "Zu Hause dauerhaft machen",
          "Rendre durable à la maison",
          "Rendere duraturo a casa",
          "Make it permanent at home"
        ),
        text: l4(
          "Lange Risse zu Hause zusätzlich mit kleinen Stichen zusammennähen und die Naht danach von innen mit Nahtdichter versiegeln. Der Flicken bleibt drauf – er ist die Abdichtung.",
          "À la maison, couds en plus les longues déchirures à petits points, puis scelle la couture à l'intérieur avec du mastic. La rustine reste en place – c'est elle qui étanchéifie.",
          "A casa cuci in più gli strappi lunghi a piccoli punti e poi sigilla la cucitura dall'interno. La toppa resta – è lei a fare tenuta.",
          "At home, also sew long tears closed with small stitches and then seal the seam from the inside. The patch stays on – it is what keeps the water out."
        ),
      },
    ],
    mistake: l4(
      "Paketklebeband oder Isolierband «für den Moment». Der Kleber bleibt im Gewebe zurück, wird in der Sonne hart und macht es genau dort spröde, wo später der richtige Flicken halten müsste. Lieber gar nichts als das falsche Band.",
      "Du ruban d'emballage ou de l'isolant « en attendant ». La colle reste dans le tissu, durcit au soleil et le fragilise justement là où la vraie rustine devrait tenir plus tard. Mieux vaut rien que le mauvais ruban.",
      "Nastro da pacchi o isolante «per il momento». La colla resta nel tessuto, indurisce al sole e lo rende fragile proprio dove poi dovrebbe tenere la toppa giusta. Meglio niente che il nastro sbagliato.",
      "Packing tape or electrical tape “just for now”. The adhesive stays in the fabric, hardens in the sun and makes it brittle exactly where the proper patch would need to stick later. Better nothing than the wrong tape."
    ),
    minutes: 15,
    intervalMonths: null,
  },
  {
    id: "reissverschluss",
    title: l4(
      "Reissverschluss retten",
      "Sauver la fermeture éclair",
      "Salvare la cerniera",
      "Rescuing the zip"
    ),
    summary: l4(
      "Der Reissverschluss ist das Teil, das zuerst aufgibt – meist nicht kaputt, sondern nur verschmutzt oder ausgeleiert.",
      "La fermeture éclair est la pièce qui lâche en premier – le plus souvent pas cassée, juste encrassée ou fatiguée.",
      "La cerniera è la parte che cede per prima – di solito non è rotta, solo sporca o allentata.",
      "The zip is the part that gives up first – usually not broken, just dirty or worn loose."
    ),
    when: l4(
      "Wenn er hakt, sich schwer ziehen lässt oder die Zähne hinter dem Schieber wieder aufgehen.",
      "Quand elle accroche, se tire difficilement ou que les dents se rouvrent derrière le curseur.",
      "Quando si inceppa, scorre a fatica o i denti si riaprono dietro il cursore.",
      "When it snags, drags heavily, or the teeth open again behind the slider."
    ),
    materials: [
      l4(
        "Alte Zahnbürste und Wasser",
        "Une vieille brosse à dents et de l'eau",
        "Un vecchio spazzolino e acqua",
        "An old toothbrush and water"
      ),
      l4(
        "Silikonspray oder Reissverschluss-Wachs – kein Öl",
        "Un spray silicone ou de la cire pour fermeture – pas d'huile",
        "Spray al silicone o cera per cerniere – niente olio",
        "Silicone spray or zip wax – not oil"
      ),
      l4(
        "Kleine Zange für den ausgeleierten Schieber",
        "Une petite pince pour le curseur fatigué",
        "Una pinzetta per il cursore allentato",
        "Small pliers for a worn slider"
      ),
    ],
    steps: [
      {
        title: l4(
          "Sand ausbürsten",
          "Brosser le sable",
          "Spazzolare via la sabbia",
          "Brush the sand out"
        ),
        text: l4(
          "Zähne beidseitig mit der Zahnbürste und klarem Wasser auswaschen. Neun von zehn hakenden Reissverschlüssen sind einfach voller Sand – mehr braucht es oft nicht.",
          "Brosse les dents des deux côtés à la brosse à dents et à l'eau claire. Neuf fermetures qui accrochent sur dix sont simplement pleines de sable – souvent il n'en faut pas plus.",
          "Lava i denti su entrambi i lati con lo spazzolino e acqua pulita. Nove cerniere inceppate su dieci sono semplicemente piene di sabbia – spesso non serve altro.",
          "Scrub the teeth on both sides with the toothbrush and clean water. Nine out of ten sticking zips are simply full of sand – often that is all it takes."
        ),
      },
      {
        title: l4(
          "Trocken schmieren",
          "Lubrifier à sec",
          "Lubrificare a secco",
          "Lubricate dry"
        ),
        text: l4(
          "Nach dem Trocknen dünn mit Silikonspray oder Wachs behandeln und den Schieber mehrmals durchziehen. Kein Speiseöl und kein Kriechöl – die binden Staub und machen es nach zwei Wochen schlimmer.",
          "Une fois sec, applique un peu de spray silicone ou de cire et fais coulisser le curseur plusieurs fois. Pas d'huile de table ni de dégrippant – ils fixent la poussière et aggravent tout après deux semaines.",
          "Dopo l'asciugatura tratta con poco spray al silicone o cera e fai scorrere più volte il cursore. Niente olio da cucina né sbloccante – legano la polvere e dopo due settimane peggiorano tutto.",
          "Once dry, treat it lightly with silicone spray or wax and run the slider through several times. No cooking oil or penetrating oil – they hold dust and make things worse within a fortnight."
        ),
      },
      {
        title: l4(
          "Schieber nachdrücken",
          "Resserrer le curseur",
          "Stringere il cursore",
          "Squeeze the slider"
        ),
        text: l4(
          "Gehen die Zähne hinter dem Schieber wieder auf, ist er ausgeleiert: mit der Zange oben und unten VORSICHTIG einen Hauch zusammendrücken, dann testen. Lieber dreimal wenig als einmal zu viel – zu fest und der Schieber blockiert.",
          "Si les dents se rouvrent derrière le curseur, il est fatigué : pince-le DÉLICATEMENT en haut et en bas, puis teste. Mieux vaut trois petites fois qu'une fois de trop – trop serré, le curseur bloque.",
          "Se i denti si riaprono dietro il cursore, è allentato: stringilo CON CAUTELA sopra e sotto con la pinza, poi prova. Meglio tre volte poco che una volta troppo – se stretto troppo, il cursore si blocca.",
          "If the teeth reopen behind the slider, it is worn: squeeze it GENTLY top and bottom with the pliers, then test. Three small squeezes beat one too many – too tight and the slider jams."
        ),
      },
      {
        title: l4(
          "Belastung wegnehmen",
          "Réduire la tension",
          "Togliere la tensione",
          "Take the strain off"
        ),
        text: l4(
          "Wenn der Reissverschluss beim Schliessen unter Spannung steht, hilft keine Pflege. Zelt etwas weniger straff abspannen und den Verschluss immer mit einer Hand am Stoff führen, statt mit Kraft zu ziehen.",
          "Si la fermeture est sous tension quand tu la fermes, aucun entretien n'y changera rien. Tends la tente un peu moins et accompagne la fermeture d'une main sur la toile au lieu de tirer en force.",
          "Se la cerniera è in tensione mentre la chiudi, nessuna manutenzione basta. Tendi la tenda un po' meno e accompagna la cerniera con una mano sul telo invece di tirare a forza.",
          "If the zip is under tension as you close it, no amount of care will help. Pitch the tent a little less taut and guide the zip with one hand on the fabric instead of pulling hard."
        ),
      },
    ],
    mistake: l4(
      "Mit Kraft ziehen, wenn es hakt. Genau dann verbiegt sich der Schieber oder reisst Stoff in die Zähne – aus einer Minute Putzen wird ein Fall für den Fachbetrieb.",
      "Tirer en force quand ça accroche. C'est exactement là que le curseur se tord ou que le tissu se coince dans les dents – une minute de nettoyage devient un cas pour l'atelier.",
      "Tirare a forza quando si inceppa. È proprio allora che il cursore si piega o il tessuto entra nei denti – un minuto di pulizia diventa un caso da laboratorio.",
      "Yanking when it snags. That is exactly when the slider bends or fabric gets caught in the teeth – one minute of cleaning turns into a job for the repair shop."
    ),
    minutes: 20,
    intervalMonths: 12,
  },
  {
    id: "schimmel",
    title: l4(
      "Schimmel entfernen",
      "Éliminer la moisissure",
      "Togliere la muffa",
      "Removing mould"
    ),
    summary: l4(
      "Schwarze Punkte und Modergeruch: Schimmel lässt sich stoppen, aber die Flecken bleiben meist sichtbar.",
      "Points noirs et odeur de moisi : on peut arrêter la moisissure, mais les taches restent en général visibles.",
      "Punti neri e odore di muffa: la muffa si può fermare, ma le macchie di solito restano visibili.",
      "Black spots and a musty smell: mould can be stopped, but the stains usually stay visible."
    ),
    when: l4(
      "Sobald du dunkle Punkte oder den typischen Kellergeruch bemerkst – je früher, desto mehr ist zu retten.",
      "Dès que tu remarques des points sombres ou l'odeur de cave typique – plus tôt tu agis, plus tu sauves.",
      "Appena noti punti scuri o il tipico odore di cantina – prima intervieni, più salvi.",
      "As soon as you notice dark spots or that typical cellar smell – the earlier you act, the more you save."
    ),
    materials: [
      l4(
        "Weiche Bürste und lauwarmes Wasser",
        "Une brosse douce et de l'eau tiède",
        "Spazzola morbida e acqua tiepida",
        "A soft brush and lukewarm water"
      ),
      l4(
        "Spezialmittel gegen Schimmel auf Zeltstoff oder verdünnter Essig",
        "Un produit antimoisissure pour toile de tente ou du vinaigre dilué",
        "Prodotto antimuffa per teli da tenda o aceto diluito",
        "A mould treatment made for tent fabric, or diluted vinegar"
      ),
      l4(
        "Handschuhe und ein Platz im Freien",
        "Des gants et un endroit en plein air",
        "Guanti e un posto all'aperto",
        "Gloves and a spot outdoors"
      ),
    ],
    steps: [
      {
        title: l4(
          "Draussen aufstellen und lüften",
          "Monter dehors et aérer",
          "Montare all'aperto e arieggiare",
          "Pitch it outside and air it"
        ),
        text: l4(
          "Zelt im Freien aufstellen – nicht im Wohnraum, Schimmelsporen gehören nicht in die Innenluft. Erst einmal einige Stunden durchlüften lassen.",
          "Monte la tente dehors – pas dans le logement, les spores n'ont rien à faire dans l'air intérieur. Laisse d'abord aérer quelques heures.",
          "Monta la tenda all'aperto – non in casa, le spore non devono finire nell'aria interna. Lascia prima arieggiare qualche ora.",
          "Pitch the tent outdoors – not indoors; mould spores do not belong in your room air. First let it air out for a few hours."
        ),
      },
      {
        title: l4(
          "Trocken abbürsten",
          "Brosser à sec",
          "Spazzolare a secco",
          "Brush it off dry"
        ),
        text: l4(
          "Den trockenen Belag zuerst vorsichtig abbürsten, mit Handschuhen und abgewandtem Gesicht. Nass verschmiert sich der Schimmel und dringt tiefer ins Gewebe.",
          "Brosse d'abord délicatement le dépôt sec, avec des gants et le visage détourné. Mouillée, la moisissure s'étale et pénètre plus profondément dans le tissu.",
          "Spazzola prima con cautela la patina asciutta, con i guanti e il viso girato. Da bagnata la muffa si spalma e penetra più a fondo nel tessuto.",
          "First brush the dry growth off carefully, wearing gloves and with your face turned away. Wet, the mould smears and works deeper into the fabric."
        ),
      },
      {
        title: l4(
          "Behandeln, nicht bleichen",
          "Traiter, ne pas blanchir",
          "Trattare, non candeggiare",
          "Treat it, do not bleach it"
        ),
        text: l4(
          "Spezialmittel nach Anleitung auftragen oder Essig-Wasser (1 Teil Essig, 4 Teile Wasser) einwirken lassen und mit klarem Wasser nachspülen. Chlorbleiche zerstört Gewebe und Beschichtung – Finger weg.",
          "Applique le produit spécial selon la notice, ou laisse agir du vinaigre dilué (1 volume pour 4 d'eau) puis rince à l'eau claire. L'eau de Javel détruit le tissu et l'enduction – à éviter.",
          "Applica il prodotto specifico secondo le istruzioni oppure lascia agire aceto diluito (1 parte di aceto, 4 d'acqua) e risciacqua con acqua pulita. La candeggina distrugge tessuto e spalmatura – da evitare.",
          "Apply the dedicated product as instructed, or let diluted vinegar (1 part vinegar to 4 parts water) work in and rinse with clean water. Chlorine bleach destroys both fabric and coating – hands off."
        ),
      },
      {
        title: l4(
          "Neu imprägnieren",
          "Réimperméabiliser",
          "Reimpregnare",
          "Re-waterproof it"
        ),
        text: l4(
          "Die Behandlung greift die Imprägnierung an. Nach dem vollständigen Trocknen deshalb neu imprägnieren – sonst saugt sich der Stoff beim nächsten Regen voll.",
          "Le traitement attaque l'imperméabilisation. Après séchage complet, réimperméabilise donc – sinon le tissu s'imbibera à la prochaine pluie.",
          "Il trattamento aggredisce l'impregnazione. Dopo l'asciugatura completa reimpregna quindi il telo – altrimenti alla prossima pioggia si imbeve.",
          "The treatment attacks the waterproofing. Once fully dry, re-waterproof it – otherwise the fabric will soak through in the next shower."
        ),
      },
    ],
    mistake: l4(
      "Zu erwarten, dass die Flecken verschwinden. Der Schimmel lässt sich abtöten, die Verfärbung bleibt – und wo das Gewebe schon weich und brüchig ist, hat er es bereits zersetzt. Dort hilft nur ein Flicken oder ein neues Aussenzelt.",
      "S'attendre à ce que les taches disparaissent. On peut tuer la moisissure, la coloration reste – et là où le tissu est déjà mou et cassant, elle l'a déjà détruit. Seule une rustine ou un nouveau double-toit aide alors.",
      "Aspettarsi che le macchie spariscano. La muffa si può uccidere, lo scolorimento resta – e dove il tessuto è già molle e fragile, l'ha già decomposto. Lì serve solo una toppa o un nuovo telo esterno.",
      "Expecting the stains to disappear. The mould can be killed, the discolouration stays – and wherever the fabric already feels soft and brittle, it has already been eaten through. There, only a patch or a new flysheet helps."
    ),
    minutes: 90,
    intervalMonths: null,
  },
];
