/**
 * Offline-Knoten-Bibliothek – alle Anleitungen sind im App-Bundle enthalten.
 * Alle Anzeigetexte liegen als L4 (de/fr/it/en) vor; Knoten-Namen verwenden
 * die etablierten Bezeichnungen der jeweiligen Sprache.
 */
import { l4, type L4 } from "@shared/i18n";
import img_knoten_mastwurf from "@/assets/knoten-mastwurf.webp";
import img_knoten_palstek from "@/assets/knoten-palstek.webp";
import img_knoten_spannknoten from "@/assets/knoten-spannknoten.webp";
import img_knoten_kreuzknoten from "@/assets/knoten-kreuzknoten.webp";
import img_knoten_schotstek from "@/assets/knoten-schotstek.webp";
import img_knoten_prusik from "@/assets/knoten-prusik.webp";
import img_knoten_achterknoten from "@/assets/knoten-achterknoten.webp";
import img_knoten_fischerknoten from "@/assets/knoten-fischerknoten.webp";

export type KnotCategory = "befestigen" | "spannen" | "verbinden" | "schlaufen";

/** Anzeige-Labels der Kategorien (auch für Filter und Suche). */
export const knotCategoryLabels: Record<KnotCategory, L4> = {
  befestigen: l4("Befestigen", "Fixer", "Fissare", "Attach"),
  spannen: l4("Spannen", "Tendre", "Tendere", "Tension"),
  verbinden: l4("Verbinden", "Relier", "Unire", "Join"),
  schlaufen: l4("Schlaufen", "Boucles", "Asole", "Loops"),
};

export interface Knot {
  id: string;
  name: L4;
  altName?: L4;
  category: KnotCategory;
  difficulty: 1 | 2 | 3;
  useCase: L4;
  campingUse: L4;
  steps: L4[];
  proTip: L4;
  image?: string;
}

export const knots: Knot[] = [
  {
    id: "mastwurf",
    name: l4("Mastwurf", "Nœud de cabestan", "Nodo parlato", "Clove hitch"),
    altName: l4(
      "Webeleinenstek",
      "Nœud de batelier",
      "Nodo barcaiolo",
      "Ratline hitch"
    ),
    category: "befestigen",
    difficulty: 1,
    image: img_knoten_mastwurf,
    useCase: l4(
      "Ein Seil schnell an einem Baum, Pfahl oder Hering befestigen.",
      "Fixer rapidement une corde à un arbre, un poteau ou une sardine.",
      "Fissare rapidamente una corda a un albero, un palo o un picchetto.",
      "Quickly attach a rope to a tree, post or tent peg."
    ),
    campingUse: l4(
      "Tarp-Leine am Baumstamm oder an der Zeltstange festmachen – schnell gelegt und ebenso schnell wieder gelöst.",
      "Attacher la corde du tarp au tronc d'arbre ou au mât de tente – vite fait et tout aussi vite défait.",
      "Fissare la corda del tarp al tronco o alla palina della tenda – veloce da fare e altrettanto veloce da sciogliere.",
      "Tie a tarp line to a tree trunk or tent pole – quick to tie and just as quick to undo."
    ),
    steps: [
      l4(
        "Das Seil einmal um den Baum oder Pfahl legen, sodass das lose Ende über dem festen Ende kreuzt.",
        "Passer la corde une fois autour de l'arbre ou du poteau, de sorte que le bout libre croise par-dessus le brin fixe.",
        "Passare la corda una volta attorno all'albero o al palo, in modo che il capo libero incroci sopra il capo fisso.",
        "Pass the rope once around the tree or post so the working end crosses over the standing end."
      ),
      l4(
        "Eine zweite Runde um den Pfahl legen, parallel oberhalb der ersten.",
        "Faire un deuxième tour autour du poteau, parallèle au-dessus du premier.",
        "Fare un secondo giro attorno al palo, parallelo sopra il primo.",
        "Make a second turn around the post, parallel and above the first."
      ),
      l4(
        "Das lose Ende unter der zweiten Runde (unter dem eigenen Kreuzungspunkt) durchstecken.",
        "Glisser le bout libre sous le deuxième tour (sous son propre point de croisement).",
        "Infilare il capo libero sotto il secondo giro (sotto il proprio punto di incrocio).",
        "Tuck the working end under the second turn (under its own crossing point)."
      ),
      l4(
        "Beide Enden in entgegengesetzte Richtungen ziehen, bis der Knoten fest sitzt.",
        "Tirer les deux bouts dans des directions opposées jusqu'à ce que le nœud soit bien serré.",
        "Tirare i due capi in direzioni opposte finché il nodo è ben stretto.",
        "Pull both ends in opposite directions until the knot is tight."
      ),
    ],
    proTip: l4(
      "Der Mastwurf hält nur unter Zug zuverlässig. Für dauerhafte Befestigungen mit einem halben Schlag sichern.",
      "Le nœud de cabestan ne tient de façon fiable que sous tension. Pour une fixation durable, le sécuriser avec une demi-clé.",
      "Il nodo parlato tiene in modo affidabile solo sotto tensione. Per fissaggi duraturi, assicurarlo con una mezza chiave.",
      "The clove hitch only holds reliably under load. For lasting attachments, secure it with a half hitch."
    ),
  },
  {
    id: "palstek",
    name: l4("Palstek", "Nœud de chaise", "Gassa d'amante", "Bowline"),
    altName: l4("Bulin", "Nœud de bouline", "Nodo bolina", "Bowline knot"),
    category: "schlaufen",
    difficulty: 2,
    image: img_knoten_palstek,
    useCase: l4(
      "Eine feste Schlaufe, die sich unter Last nicht zuzieht – der «König der Knoten».",
      "Une boucle fixe qui ne se resserre pas sous charge – le «roi des nœuds».",
      "Un'asola fissa che non si stringe sotto carico – il «re dei nodi».",
      "A fixed loop that does not tighten under load – the 'king of knots'."
    ),
    campingUse: l4(
      "Feste Schlaufe zum Einhängen in Heringe, zum Abschleppen oder um etwas Schweres zu sichern.",
      "Boucle fixe pour accrocher aux sardines, pour remorquer ou pour assurer une charge lourde.",
      "Asola fissa da agganciare ai picchetti, per trainare o per assicurare qualcosa di pesante.",
      "A fixed loop for hooking onto pegs, for towing or for securing something heavy."
    ),
    steps: [
      l4(
        "Ein kleines Auge ins Seil legen – das lose Ende liegt oben auf dem festen Ende.",
        "Former une petite boucle dans la corde – le bout libre passe au-dessus du brin fixe.",
        "Formare un piccolo occhiello nella corda – il capo libero sta sopra il capo fisso.",
        "Form a small eye in the rope – the working end lies on top of the standing end."
      ),
      l4(
        "Das lose Ende von unten durch das Auge führen («der Fuchs kommt aus der Höhle»).",
        "Passer le bout libre dans la boucle par en dessous («le serpent sort du puits»).",
        "Far passare il capo libero nell'occhiello da sotto («il serpente esce dal pozzo»).",
        "Bring the working end up through the eye ('the rabbit comes out of the hole')."
      ),
      l4(
        "Das lose Ende hinter dem festen Ende herumführen («läuft um den Baum»).",
        "Faire passer le bout libre derrière le brin fixe («il fait le tour de l'arbre»).",
        "Far girare il capo libero dietro il capo fisso («gira attorno all'albero»).",
        "Pass the working end around behind the standing end ('runs around the tree')."
      ),
      l4(
        "Das lose Ende wieder von oben in das Auge zurückstecken («zurück in die Höhle») und festziehen.",
        "Repasser le bout libre dans la boucle par le haut («il redescend dans le puits») et serrer.",
        "Reinfilare il capo libero nell'occhiello dall'alto («rientra nel pozzo») e stringere.",
        "Tuck the working end back down through the eye ('back into the hole') and tighten."
      ),
    ],
    proTip: l4(
      "Nach dem Festziehen prüfen: Die Schlaufe darf sich unter Zug nicht verkleinern. Lässt sich auch nach starker Belastung leicht wieder öffnen.",
      "Après le serrage, vérifier : la boucle ne doit pas rétrécir sous tension. Se défait facilement même après une forte charge.",
      "Dopo aver stretto, verificare: l'asola non deve restringersi sotto tensione. Si scioglie facilmente anche dopo un carico forte.",
      "After tightening, check that the loop does not shrink under load. It stays easy to untie even after heavy loading."
    ),
  },
  {
    id: "spannknoten",
    name: l4(
      "Spannknoten",
      "Nœud de tendeur",
      "Nodo tenditore",
      "Taut-line hitch"
    ),
    altName: l4(
      "Tautline Hitch",
      "Tautline hitch",
      "Tautline hitch",
      "Tautline hitch"
    ),
    category: "spannen",
    difficulty: 2,
    image: img_knoten_spannknoten,
    useCase: l4(
      "Verstellbarer Knoten, der eine Leine auf Spannung hält – nachspannbar ohne Neubinden.",
      "Nœud réglable qui maintient une corde sous tension – retendable sans le refaire.",
      "Nodo regolabile che mantiene in tensione una corda – ritensionabile senza rifarlo.",
      "An adjustable knot that keeps a line taut – can be re-tensioned without retying."
    ),
    campingUse: l4(
      "Der wichtigste Zeltknoten: Abspannleinen von Zelt und Tarp lassen sich damit stufenlos nachspannen, wenn sie sich über Nacht lockern.",
      "Le nœud de tente le plus important : il permet de retendre en continu les haubans de la tente et du tarp quand ils se relâchent pendant la nuit.",
      "Il nodo da tenda più importante: permette di ritensionare in modo continuo i tiranti di tenda e tarp quando si allentano durante la notte.",
      "The most important tent knot: guy lines of tent and tarp can be re-tensioned steplessly when they loosen overnight."
    ),
    steps: [
      l4(
        "Das Seil um den Hering führen und mit dem losen Ende zurück zur Leine gehen.",
        "Passer la corde autour de la sardine et revenir vers la corde tendue avec le bout libre.",
        "Passare la corda attorno al picchetto e tornare verso la corda tesa con il capo libero.",
        "Pass the rope around the peg and bring the working end back towards the standing line."
      ),
      l4(
        "Das lose Ende zweimal innerhalb der entstandenen Schlaufe um die stehende Leine wickeln (Richtung Hering).",
        "Enrouler le bout libre deux fois autour du brin tendu, à l'intérieur de la boucle formée (en direction de la sardine).",
        "Avvolgere il capo libero due volte attorno alla corda tesa, all'interno dell'anello formato (in direzione del picchetto).",
        "Wrap the working end twice around the standing line inside the loop just formed (towards the peg)."
      ),
      l4(
        "Eine dritte Wicklung aussen, oberhalb der Schlaufe, um die stehende Leine legen.",
        "Faire un troisième tour à l'extérieur, au-dessus de la boucle, autour du brin tendu.",
        "Fare un terzo avvolgimento all'esterno, sopra l'anello, attorno alla corda tesa.",
        "Make a third wrap outside, above the loop, around the standing line."
      ),
      l4(
        "Festziehen – der Knoten lässt sich nun auf der Leine verschieben und hält unter Zug.",
        "Serrer – le nœud peut maintenant coulisser sur la corde et tient sous tension.",
        "Stringere – ora il nodo può scorrere sulla corda e tiene sotto tensione.",
        "Tighten – the knot can now slide along the line and holds under tension."
      ),
    ],
    proTip: l4(
      "Funktioniert am besten mit leicht rauen Leinen. Bei sehr glatten Dyneema-Schnüren eine zusätzliche Wicklung einbauen.",
      "Fonctionne le mieux avec des cordes légèrement rugueuses. Avec des cordelettes Dyneema très lisses, ajouter un tour supplémentaire.",
      "Funziona meglio con corde leggermente ruvide. Con cordini Dyneema molto lisci, aggiungere un avvolgimento in più.",
      "Works best with slightly rough lines. With very slippery Dyneema cord, add an extra wrap."
    ),
  },
  {
    id: "kreuzknoten",
    name: l4("Kreuzknoten", "Nœud plat", "Nodo piano", "Reef knot"),
    altName: l4(
      "Weberknoten",
      "Nœud droit",
      "Nodo di terzarolo",
      "Square knot"
    ),
    category: "verbinden",
    difficulty: 1,
    image: img_knoten_kreuzknoten,
    useCase: l4(
      "Zwei gleich dicke Seilenden miteinander verbinden.",
      "Relier deux bouts de corde de même diamètre.",
      "Unire due capi di corda dello stesso diametro.",
      "Join two rope ends of equal thickness."
    ),
    campingUse: l4(
      "Gerissene Zeltleine flicken oder zwei kurze Schnüre zu einer langen verbinden (bei gleicher Dicke).",
      "Réparer une corde de tente cassée ou relier deux cordelettes courtes en une longue (à diamètre égal).",
      "Riparare un tirante strappato o unire due cordini corti in uno lungo (a parità di diametro).",
      "Mend a snapped guy line or join two short cords into one long one (same thickness)."
    ),
    steps: [
      l4(
        "Beide Seilenden kreuzen: links über rechts, dann einmal umeinander schlagen.",
        "Croiser les deux bouts : gauche sur droite, puis les enrouler une fois l'un autour de l'autre.",
        "Incrociare i due capi: sinistro sopra destro, poi avvolgerli una volta l'uno attorno all'altro.",
        "Cross the two ends: left over right, then wrap them once around each other."
      ),
      l4(
        "Die Enden erneut kreuzen: jetzt rechts über links.",
        "Croiser à nouveau les bouts : cette fois droite sur gauche.",
        "Incrociare di nuovo i capi: ora destro sopra sinistro.",
        "Cross the ends again: now right over left."
      ),
      l4(
        "Wieder umeinander schlagen und beide Enden festziehen.",
        "Les enrouler encore une fois l'un autour de l'autre et serrer les deux bouts.",
        "Avvolgerli di nuovo l'uno attorno all'altro e stringere entrambi i capi.",
        "Wrap around each other again and pull both ends tight."
      ),
      l4(
        "Kontrolle: Beide Enden müssen parallel aus dem Knoten austreten – sonst ist es ein (unsicherer) Altweiberknoten.",
        "Contrôle : les deux bouts doivent sortir du nœud parallèlement – sinon c'est un nœud de vache (peu sûr).",
        "Controllo: i due capi devono uscire dal nodo paralleli – altrimenti è un nodo della nonna (poco sicuro).",
        "Check: both ends must exit the knot parallel – otherwise it is an (unsafe) granny knot."
      ),
    ],
    proTip: l4(
      "Merkspruch: «Links über rechts, rechts über links.» Für unterschiedlich dicke Seile stattdessen den Schotstek verwenden.",
      "Moyen mnémotechnique : «gauche sur droite, droite sur gauche». Pour des cordes de diamètres différents, utiliser plutôt le nœud d'écoute.",
      "Regola mnemonica: «sinistro sopra destro, destro sopra sinistro». Per corde di diametro diverso usare invece il nodo bandiera.",
      "Mnemonic: 'left over right, right over left'. For ropes of different thickness, use the sheet bend instead."
    ),
  },
  {
    id: "schotstek",
    name: l4("Schotstek", "Nœud d'écoute", "Nodo bandiera", "Sheet bend"),
    category: "verbinden",
    difficulty: 2,
    image: img_knoten_schotstek,
    useCase: l4(
      "Zwei unterschiedlich dicke Seile sicher verbinden.",
      "Relier de façon sûre deux cordes de diamètres différents.",
      "Unire in modo sicuro due corde di diametro diverso.",
      "Securely join two ropes of different thickness."
    ),
    campingUse: l4(
      "Dünne Reepschnur an ein dickeres Seil knüpfen, z. B. um eine Tarp-Leine zu verlängern.",
      "Attacher une cordelette fine à une corde plus épaisse, p. ex. pour rallonger une corde de tarp.",
      "Legare un cordino sottile a una corda più spessa, ad es. per allungare la corda di un tarp.",
      "Tie thin cord to a thicker rope, for example to extend a tarp line."
    ),
    steps: [
      l4(
        "Aus dem dickeren Seil eine Bucht (offene Schlaufe) formen.",
        "Former une ganse (boucle ouverte) avec la corde la plus épaisse.",
        "Formare un doppino (asola aperta) con la corda più spessa.",
        "Form a bight (open loop) in the thicker rope."
      ),
      l4(
        "Das dünnere Seil von unten durch die Bucht führen.",
        "Passer la corde fine dans la ganse par en dessous.",
        "Far passare la corda sottile nel doppino da sotto.",
        "Pass the thinner rope up through the bight from below."
      ),
      l4(
        "Mit dem dünnen Seil einmal um beide Schenkel der Bucht herumfahren.",
        "Faire un tour avec la corde fine autour des deux brins de la ganse.",
        "Con la corda sottile fare un giro attorno a entrambi i rami del doppino.",
        "Take the thin rope once around both legs of the bight."
      ),
      l4(
        "Das dünne Ende unter sich selbst durchstecken und festziehen – beide losen Enden liegen auf derselben Seite.",
        "Glisser le bout fin sous lui-même et serrer – les deux bouts libres se trouvent du même côté.",
        "Infilare il capo sottile sotto sé stesso e stringere – i due capi liberi restano sullo stesso lato.",
        "Tuck the thin end under itself and tighten – both free ends lie on the same side."
      ),
    ],
    proTip: l4(
      "Für glatte oder stark unterschiedliche Seile den doppelten Schotstek binden (zweite Wicklung um die Bucht).",
      "Pour des cordes lisses ou très différentes, faire le nœud d'écoute double (deuxième tour autour de la ganse).",
      "Per corde lisce o molto diverse, fare il nodo bandiera doppio (secondo giro attorno al doppino).",
      "For slippery or very different ropes, tie the double sheet bend (a second wrap around the bight)."
    ),
  },
  {
    id: "prusik",
    name: l4("Prusikknoten", "Nœud de Prusik", "Nodo Prusik", "Prusik knot"),
    category: "schlaufen",
    difficulty: 2,
    image: img_knoten_prusik,
    useCase: l4(
      "Klemmknoten, der sich auf einem gespannten Seil verschieben lässt und unter Last blockiert.",
      "Nœud autobloquant qui coulisse sur une corde tendue et se bloque sous charge.",
      "Nodo autobloccante che scorre su una corda tesa e si blocca sotto carico.",
      "A friction hitch that slides along a taut rope and locks under load."
    ),
    campingUse: l4(
      "Perfekt für die Tarp-Firstleine: Damit lassen sich Aufhängepunkte verschieben, die unter Zug sofort festklemmen.",
      "Parfait pour la faîtière du tarp : il permet de déplacer des points d'accrochage qui se bloquent aussitôt sous tension.",
      "Perfetto per la corda di colmo del tarp: permette di spostare punti di aggancio che sotto tensione si bloccano subito.",
      "Perfect for a tarp ridgeline: attachment points can be shifted and lock instantly under tension."
    ),
    steps: [
      l4(
        "Eine Reepschnur-Schlinge hinter das gespannte Seil legen.",
        "Placer un anneau de cordelette derrière la corde tendue.",
        "Mettere un anello di cordino dietro la corda tesa.",
        "Place a loop of accessory cord behind the taut rope."
      ),
      l4(
        "Die Schlinge zwei- bis dreimal durch sich selbst um das Seil wickeln.",
        "Enrouler l'anneau deux à trois fois autour de la corde en le passant dans lui-même.",
        "Avvolgere l'anello due o tre volte attorno alla corda facendolo passare dentro sé stesso.",
        "Wrap the loop through itself around the rope two to three times."
      ),
      l4(
        "Die Wicklungen ordentlich nebeneinander legen – keine Überkreuzungen.",
        "Ranger les tours proprement côte à côte – sans croisements.",
        "Disporre gli avvolgimenti ordinati uno accanto all'altro – senza incroci.",
        "Lay the wraps neatly side by side – no crossings."
      ),
      l4(
        "Festziehen: Unter Last klemmt der Knoten, ohne Last lässt er sich verschieben.",
        "Serrer : sous charge le nœud bloque, sans charge il coulisse.",
        "Stringere: sotto carico il nodo blocca, senza carico scorre.",
        "Tighten: under load the knot grips, without load it slides."
      ),
    ],
    proTip: l4(
      "Die Schlinge sollte etwa halb so dick sein wie das Hauptseil, sonst klemmt der Knoten nicht zuverlässig.",
      "L'anneau doit faire environ la moitié du diamètre de la corde principale, sinon le nœud ne bloque pas de façon fiable.",
      "Il cordino dovrebbe avere circa la metà del diametro della corda principale, altrimenti il nodo non blocca in modo affidabile.",
      "The cord should be about half the diameter of the main rope, otherwise the knot will not grip reliably."
    ),
  },
  {
    id: "achterknoten",
    name: l4(
      "Achterknoten",
      "Nœud en huit",
      "Nodo Savoia",
      "Figure-eight knot"
    ),
    category: "befestigen",
    difficulty: 1,
    image: img_knoten_achterknoten,
    useCase: l4(
      "Stopperknoten, der verhindert, dass ein Seilende durch eine Öse rutscht.",
      "Nœud d'arrêt qui empêche un bout de corde de glisser à travers un œillet.",
      "Nodo di arresto che impedisce a un capo di corda di scivolare attraverso un occhiello.",
      "A stopper knot that prevents a rope end slipping through an eyelet."
    ),
    campingUse: l4(
      "Am Ende von Zeltleinen, damit sie nicht aus den Ösen oder Leinenspannern rutschen.",
      "Au bout des cordes de tente, pour qu'elles ne glissent pas hors des œillets ou des tendeurs.",
      "All'estremità dei tiranti della tenda, perché non scivolino fuori da occhielli o tenditori.",
      "At the end of tent lines so they cannot slip out of eyelets or line tensioners."
    ),
    steps: [
      l4(
        "Mit dem Seilende ein Auge legen – das Ende liegt unter dem festen Teil.",
        "Former une boucle avec le bout de la corde – le bout passe sous le brin fixe.",
        "Formare un occhiello con il capo della corda – il capo passa sotto la parte fissa.",
        "Form an eye with the rope end – the end lies under the standing part."
      ),
      l4(
        "Das Ende einmal um das feste Teil herumführen (eine halbe Drehung mehr als beim Überhandknoten).",
        "Faire passer le bout une fois autour du brin fixe (un demi-tour de plus que pour le nœud simple).",
        "Far girare il capo una volta attorno alla parte fissa (mezzo giro in più rispetto al nodo semplice).",
        "Take the end once around the standing part (half a turn more than for an overhand knot)."
      ),
      l4(
        "Das Ende von oben durch das Auge stecken.",
        "Passer le bout dans la boucle par le haut.",
        "Infilare il capo nell'occhiello dall'alto.",
        "Push the end down through the eye from above."
      ),
      l4(
        "Festziehen – der Knoten bildet eine deutlich sichtbare «8».",
        "Serrer – le nœud forme un «8» bien visible.",
        "Stringere – il nodo forma un «8» ben visibile.",
        "Tighten – the knot forms a clearly visible figure '8'."
      ),
    ],
    proTip: l4(
      "Lässt sich im Gegensatz zum einfachen Überhandknoten auch nach starker Belastung wieder gut lösen.",
      "Contrairement au nœud simple, il se défait encore facilement après une forte charge.",
      "A differenza del nodo semplice, si scioglie facilmente anche dopo un carico forte.",
      "Unlike a simple overhand knot, it can still be untied easily after heavy loading."
    ),
  },
  {
    id: "fischerknoten",
    name: l4(
      "Doppelter Spierenstich",
      "Nœud de pêcheur double",
      "Nodo del pescatore doppio",
      "Double fisherman's knot"
    ),
    altName: l4(
      "Fischerknoten",
      "Nœud de pêcheur",
      "Doppio inglese",
      "Grapevine knot"
    ),
    category: "verbinden",
    difficulty: 3,
    image: img_knoten_fischerknoten,
    useCase: l4(
      "Bombenfeste Verbindung zweier Seile – auch bei glatten, dünnen Schnüren.",
      "Jonction ultra-solide de deux cordes – même avec des cordelettes fines et lisses.",
      "Unione solidissima di due corde – anche con cordini sottili e lisci.",
      "A rock-solid join between two ropes – even with thin, slippery cords."
    ),
    campingUse: l4(
      "Gerissene Abspannleinen dauerhaft flicken oder eine geschlossene Prusikschlinge aus Reepschnur knüpfen.",
      "Réparer durablement des haubans cassés ou confectionner un anneau de Prusik fermé en cordelette.",
      "Riparare in modo duraturo tiranti strappati o creare un anello di Prusik chiuso con del cordino.",
      "Permanently mend snapped guy lines or tie a closed Prusik loop from accessory cord."
    ),
    steps: [
      l4(
        "Beide Seilenden parallel, aber gegenläufig nebeneinander legen.",
        "Poser les deux bouts de corde côte à côte, parallèles mais en sens opposés.",
        "Disporre i due capi affiancati, paralleli ma in direzioni opposte.",
        "Lay the two rope ends side by side, parallel but pointing in opposite directions."
      ),
      l4(
        "Mit dem ersten Ende zwei Wicklungen um das andere Seil legen und durch die eigenen Wicklungen stecken.",
        "Avec le premier bout, faire deux tours autour de l'autre corde et le passer dans ses propres tours.",
        "Con il primo capo fare due avvolgimenti attorno all'altra corda e infilarlo nei propri avvolgimenti.",
        "With the first end, make two wraps around the other rope and pass it back through its own wraps."
      ),
      l4(
        "Mit dem zweiten Ende ebenso zwei Wicklungen um das erste Seil legen und durchstecken.",
        "Avec le deuxième bout, faire de même deux tours autour de la première corde et le passer dedans.",
        "Con il secondo capo fare allo stesso modo due avvolgimenti attorno alla prima corda e infilarlo.",
        "Do the same with the second end: two wraps around the first rope, then pass it through."
      ),
      l4(
        "Beide festen Enden ziehen – die zwei Einzelknoten rutschen zusammen und verkeilen sich.",
        "Tirer les deux brins fixes – les deux nœuds glissent l'un vers l'autre et se coincent.",
        "Tirare i due capi fissi – i due nodi scorrono l'uno verso l'altro e si incastrano.",
        "Pull both standing ends – the two knots slide together and jam against each other."
      ),
    ],
    proTip: l4(
      "Sehr sicher, aber nach starker Belastung kaum mehr zu öffnen – für dauerhafte Verbindungen gedacht.",
      "Très sûr, mais presque impossible à défaire après une forte charge – conçu pour des jonctions durables.",
      "Molto sicuro, ma quasi impossibile da sciogliere dopo un carico forte – pensato per unioni permanenti.",
      "Very secure, but almost impossible to untie after heavy loading – meant for permanent joins."
    ),
  },
  {
    id: "truckerhitch",
    name: l4(
      "Trucker-Hitch",
      "Nœud de camionneur",
      "Nodo del carrettiere",
      "Trucker's hitch"
    ),
    altName: l4(
      "Fuhrmannsknoten",
      "Nœud de charretier",
      "Nodo del camionista",
      "Power cinch"
    ),
    category: "spannen",
    difficulty: 3,
    useCase: l4(
      "Flaschenzug-Effekt: Eine Leine mit Hebelwirkung strammziehen und die Spannung sofort festsetzen.",
      "Effet de palan : tendre fortement une corde grâce à un démultiplicateur et bloquer aussitôt la tension.",
      "Effetto paranco: tendere fortemente una corda con un rinvio e bloccare subito la tensione.",
      "A pulley effect: pull a line really tight with mechanical advantage and lock the tension straight away."
    ),
    campingUse: l4(
      "Tarp-Firstleine bretthart spannen oder Gepäck auf dem Dachträger festzurren – ganz ohne Leinenspanner.",
      "Tendre la faîtière du tarp comme une planche ou arrimer les bagages sur la galerie – sans aucun tendeur.",
      "Tendere la corda di colmo del tarp come una tavola o fissare i bagagli sul portapacchi – senza alcun tenditore.",
      "Pull a tarp ridgeline drum-tight or lash luggage onto a roof rack – with no line tensioner at all."
    ),
    steps: [
      l4(
        "Ein Ende der Leine am ersten Fixpunkt (Baum, Öse) fest anschlagen.",
        "Amarrer solidement un bout de la corde au premier point fixe (arbre, anneau).",
        "Fissare saldamente un capo della corda al primo punto fisso (albero, anello).",
        "Tie one end of the line firmly to the first anchor (tree, ring)."
      ),
      l4(
        "Etwa auf halbem Weg eine Schlaufe in die Leine legen – sie dient als Umlenkrolle.",
        "Former une boucle à mi-chemin dans la corde – elle sert de poulie de renvoi.",
        "Formare un'asola a metà corda – funge da carrucola di rinvio.",
        "Form a loop about halfway along the line – it acts as a pulley."
      ),
      l4(
        "Das lose Ende um den zweiten Fixpunkt (Hering, Ring, Stange) führen und von unten zurück durch die Schlaufe ziehen.",
        "Passer le bout libre autour du deuxième point fixe (sardine, anneau, mât) et le ramener dans la boucle par en dessous.",
        "Passare il capo libero attorno al secondo punto fisso (picchetto, anello, palina) e riportarlo nell'asola dal basso.",
        "Take the working end around the second anchor (peg, ring, pole) and back up through the loop from below."
      ),
      l4(
        "Am losen Ende ziehen, bis die Leine straff ist – die Schlaufe verdreifacht dabei deine Zugkraft.",
        "Tirer sur le bout libre jusqu'à ce que la corde soit tendue – la boucle triple ta force de traction.",
        "Tirare il capo libero finché la corda è tesa – l'asola triplica la tua forza di trazione.",
        "Pull on the working end until the line is taut – the loop roughly triples your pulling force."
      ),
      l4(
        "Die Spannung mit zwei halben Schlägen direkt unter der Schlaufe sichern; den letzten als Slipstek legen, damit er sich schnell öffnen lässt.",
        "Bloquer la tension avec deux demi-clés juste sous la boucle ; faire la dernière en demi-clé gansée pour pouvoir l'ouvrir vite.",
        "Bloccare la tensione con due mezzi colli subito sotto l'asola; fare l'ultimo con una gassa, così si apre in fretta.",
        "Lock the tension with two half hitches just below the loop; make the last one slipped so it opens quickly."
      ),
    ],
    proTip: l4(
      "Die Umlenkschlaufe belastet die Leine stark – bei dünnen Schnüren nicht mit voller Kraft ziehen. Als Schlaufe eignet sich ein Palstek, wenn du sie später wieder lösen willst.",
      "La boucle de renvoi sollicite fortement la corde – avec des cordelettes fines, ne tire pas de toutes tes forces. Un nœud de chaise fait une bonne boucle si tu veux la défaire ensuite.",
      "L'asola di rinvio sollecita molto la corda – con cordini sottili non tirare a tutta forza. Come asola va bene una gassa d'amante, se poi vuoi scioglierla.",
      "The pulley loop puts a lot of strain on the line – do not haul with full force on thin cord. A bowline makes a good loop if you want to undo it later."
    ),
  },
  {
    id: "slipstek",
    name: l4(
      "Slipstek",
      "Demi-clé gansée",
      "Mezzo collo con gassa",
      "Slipped half hitch"
    ),
    altName: l4(
      "Halber Schlag auf Slip",
      "Demi-clé à ganse",
      "Mezzo collo a occhiello",
      "Quick-release hitch"
    ),
    category: "befestigen",
    difficulty: 1,
    useCase: l4(
      "Eine Befestigung, die sich mit einem einzigen Zug am losen Ende wieder öffnet.",
      "Une fixation qui s'ouvre d'un seul coup en tirant sur le bout libre.",
      "Un fissaggio che si apre con un solo tiro sul capo libero.",
      "A tie-off that opens again with a single pull on the free end."
    ),
    campingUse: l4(
      "Wäscheleine, Tarp-Abspannung oder Sackverschluss, den du in Sekunden lösen willst – klappt auch mit klammen Fingern und Handschuhen.",
      "Corde à linge, hauban de tarp ou fermeture de sac que tu veux défaire en quelques secondes – même avec les doigts gelés ou des gants.",
      "Corda per il bucato, tirante del tarp o chiusura di un sacco da sciogliere in pochi secondi – funziona anche con le dita infreddolite o con i guanti.",
      "A washing line, tarp guy line or sack tie you want to release in seconds – it works with cold fingers or gloves on."
    ),
    steps: [
      l4(
        "Das Seil um Pfahl, Baum oder Ring legen.",
        "Passer la corde autour du poteau, de l'arbre ou de l'anneau.",
        "Passare la corda attorno al palo, all'albero o all'anello.",
        "Pass the rope around the post, tree or ring."
      ),
      l4(
        "Das lose Ende über die stehende Leine führen, sodass ein halber Schlag entsteht – aber noch nichts durchziehen.",
        "Faire passer le bout libre par-dessus le brin fixe pour former une demi-clé – sans encore rien engager.",
        "Portare il capo libero sopra la corda fissa formando un mezzo collo – senza ancora infilare nulla.",
        "Bring the working end over the standing line to form a half hitch – but do not tuck anything through yet."
      ),
      l4(
        "Statt des Endes eine Bucht (doppelt gelegte Schlaufe) durch den Schlag stecken.",
        "Engager une ganse (boucle double) dans la demi-clé, à la place du bout.",
        "Infilare nel mezzo collo un doppino (asola ripiegata) invece del capo.",
        "Push a bight (a doubled loop) through the hitch instead of the end."
      ),
      l4(
        "Festziehen – der Knoten hält. Ein Zug am losen Ende zieht die Bucht heraus und öffnet ihn sofort.",
        "Serrer – le nœud tient. Un coup sur le bout libre retire la ganse et l'ouvre aussitôt.",
        "Stringere – il nodo tiene. Un tiro sul capo libero sfila il doppino e lo apre subito.",
        "Tighten – the knot holds. One pull on the free end draws the bight out and releases it instantly."
      ),
    ],
    proTip: l4(
      "Unter Dauerzug lieber zwei halbe Schläge legen und nur den zweiten gansen – ein einzelner Slipstek kann sich sonst von selbst öffnen. Nie zur Sicherung von Personen verwenden.",
      "Sous tension permanente, mieux vaut faire deux demi-clés et ne ganser que la seconde – une demi-clé gansée seule peut s'ouvrir d'elle-même. Ne jamais l'utiliser pour assurer des personnes.",
      "Sotto tensione continua meglio fare due mezzi colli e mettere la gassa solo sul secondo – da solo il mezzo collo con gassa può aprirsi da sé. Mai usarlo per assicurare persone.",
      "Under constant load, tie two half hitches and slip only the second – a single slipped half hitch can shake loose on its own. Never use it to secure people."
    ),
  },
  {
    id: "zimmermannsschlag",
    name: l4(
      "Zimmermannsschlag",
      "Nœud de bois",
      "Nodo del legnaiolo",
      "Timber hitch"
    ),
    altName: l4(
      "Holzfällerstek",
      "Nœud de bûcheron",
      "Nodo del taglialegna",
      "Lumberman's hitch"
    ),
    category: "befestigen",
    difficulty: 1,
    useCase: l4(
      "Ein Seil an einem runden Gegenstand anschlagen, um ihn zu ziehen oder zu bündeln – und danach mühelos wieder lösen.",
      "Amarrer une corde à un objet cylindrique pour le tirer ou le fagoter – et la défaire ensuite sans effort.",
      "Legare una corda a un oggetto cilindrico per trascinarlo o per farne un fascio – e scioglierla poi senza fatica.",
      "Attach a rope to a round object in order to drag or bundle it – and undo it again effortlessly."
    ),
    campingUse: l4(
      "Feuerholz zu einem Bündel schnüren, einen Ast aus dem Weg ziehen oder die Tarp-Firstleine am Stamm anschlagen.",
      "Fagoter du bois de feu, tirer une branche hors du chemin ou amarrer la faîtière du tarp au tronc.",
      "Legare la legna da ardere in un fascio, trascinare via un ramo o fissare al tronco la corda di colmo del tarp.",
      "Bundle up firewood, drag a branch out of the way or anchor a tarp ridgeline to a trunk."
    ),
    steps: [
      l4(
        "Das lose Ende um den Stamm oder das Holzbündel legen.",
        "Passer le bout libre autour du tronc ou du fagot de bois.",
        "Passare il capo libero attorno al tronco o al fascio di legna.",
        "Pass the working end around the trunk or the bundle of wood."
      ),
      l4(
        "Das Ende einmal um die stehende Leine schlagen.",
        "Faire un tour du bout autour du brin fixe.",
        "Fare un giro del capo attorno alla corda fissa.",
        "Take the end once around the standing line."
      ),
      l4(
        "Das Ende drei- bis fünfmal um sich selbst wickeln – innerhalb der Schlinge und in Zugrichtung.",
        "Enrouler le bout trois à cinq fois autour de lui-même – à l'intérieur de la boucle et dans le sens de la traction.",
        "Avvolgere il capo tre-cinque volte attorno a sé stesso – dentro l'anello e nel senso della trazione.",
        "Wrap the end around itself three to five times – inside the loop and in the direction of pull."
      ),
      l4(
        "An der stehenden Leine ziehen: Die Wicklungen legen sich um das Holz und klemmen fest.",
        "Tirer sur le brin fixe : les tours se plaquent contre le bois et se coincent.",
        "Tirare la corda fissa: gli avvolgimenti si stringono attorno al legno e si bloccano.",
        "Pull on the standing line: the wraps bed down against the wood and grip."
      ),
    ],
    proTip: l4(
      "Der Knoten hält nur unter Zug – ohne Last fällt er von selbst auseinander, genau deshalb ist er so schnell wieder gelöst. Zum Ziehen zusätzlich einen halben Schlag weiter vorn setzen, dann bleibt die Richtung stabil.",
      "Le nœud ne tient que sous traction – sans charge il se défait tout seul, d'où sa rapidité de démontage. Pour tirer, ajoute une demi-clé plus en avant : la direction reste stable.",
      "Il nodo tiene solo sotto trazione – senza carico si disfa da solo, ed è proprio per questo che si scioglie in un attimo. Per trascinare, aggiungi un mezzo collo più avanti: la direzione resta stabile.",
      "The hitch only holds under tension – with no load it falls apart by itself, which is exactly why it comes off so quickly. For dragging, add a half hitch further along so the direction stays stable."
    ),
  },
  {
    id: "achterschlaufe",
    name: l4(
      "Achterschlaufe",
      "Nœud en huit double",
      "Nodo a otto ripassato",
      "Figure-eight loop"
    ),
    altName: l4(
      "Doppelter Achterknoten",
      "Huit repassé",
      "Asola a otto",
      "Figure-eight on a bight"
    ),
    category: "schlaufen",
    difficulty: 2,
    useCase: l4(
      "Sehr sichere feste Schlaufe – auch mitten in der Leine, ohne dass ein Seilende frei sein muss.",
      "Boucle fixe très sûre – réalisable aussi en plein milieu de la corde, sans avoir besoin d'un bout libre.",
      "Asola fissa molto sicura – realizzabile anche in mezzo alla corda, senza bisogno di un capo libero.",
      "A very secure fixed loop – it can be tied in the middle of a line, with no free end needed."
    ),
    campingUse: l4(
      "Aufhängepunkte in der Tarp-Firstleine, Griffschlaufen zum Ziehen oder eine Öse zum Einhängen der Wäscheleine.",
      "Points d'accrochage sur la faîtière du tarp, poignées pour tirer ou œillet pour accrocher la corde à linge.",
      "Punti di aggancio sulla corda di colmo del tarp, maniglie per tirare o un occhiello per agganciare la corda del bucato.",
      "Attachment points along a tarp ridgeline, grab loops for pulling or an eye to hook a washing line into."
    ),
    steps: [
      l4(
        "Das Seil an der gewünschten Stelle zu einer Bucht doppeln – so gross, wie die Schlaufe später sein soll.",
        "Doubler la corde à l'endroit voulu pour former une ganse – de la taille souhaitée pour la boucle.",
        "Piegare la corda nel punto desiderato formando un doppino – grande quanto sarà l'asola.",
        "Double the rope into a bight at the chosen spot – as big as you want the finished loop."
      ),
      l4(
        "Mit dem doppelten Strang ein Auge legen und einmal um den Strang herumführen.",
        "Former une boucle avec le brin double et faire un tour autour de lui.",
        "Con il capo doppio formare un occhiello e fare un giro attorno al capo stesso.",
        "Form an eye with the doubled strand and take it once around itself."
      ),
      l4(
        "Die Bucht von oben durch das Auge stecken – es entsteht eine liegende «8».",
        "Passer la ganse dans la boucle par le haut – un «8» couché apparaît.",
        "Infilare il doppino nell'occhiello dall'alto – si forma un «8» coricato.",
        "Push the bight down through the eye – a sideways figure '8' appears."
      ),
      l4(
        "Alle vier Stränge einzeln und gleichmässig festziehen, damit der Knoten sauber und flach liegt.",
        "Serrer les quatre brins un par un et régulièrement, pour que le nœud soit propre et plat.",
        "Stringere i quattro capi uno a uno e in modo uniforme, così il nodo resta ordinato e piatto.",
        "Tighten all four strands one by one and evenly so the knot sits neat and flat."
      ),
    ],
    proTip: l4(
      "Zum Prüfen die «8» mit dem Finger nachfahren: Die beiden Stränge müssen im ganzen Knoten parallel laufen, ohne sich zu kreuzen. Im Gegensatz zum Palstek hält die Achterschlaufe auch bei wechselnder Belastung.",
      "Pour contrôler, suis le «8» avec le doigt : les deux brins doivent rester parallèles dans tout le nœud, sans se croiser. Contrairement au nœud de chaise, la boucle en huit tient aussi sous charge variable.",
      "Per controllare, segui l'«8» con il dito: i due capi devono restare paralleli in tutto il nodo, senza incrociarsi. A differenza della gassa d'amante, l'asola a otto tiene anche con carichi variabili.",
      "To check it, trace the '8' with a finger: both strands must run parallel throughout the knot without crossing. Unlike a bowline, the figure-eight loop also holds under changing loads."
    ),
  },
];
