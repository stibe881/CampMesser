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
];
