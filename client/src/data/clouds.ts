/**
 * Wolken-Lexikon (#264): Wolkenart erkennen und wissen, was kommt.
 *
 * Am Zeltplatz gibt es keine Wetterstation, aber immer einen Himmel. Wer
 * die zehn Grundformen auseinanderhalten kann, sieht ein Gewitter oft eine
 * Stunde früher als die Prognose es meldet – und weiss auch, wann der
 * graue Deckel harmlos ist.
 *
 * Aufbau der Einträge: was man SIEHT (Aussehen), was es BEDEUTET (welches
 * Wetter folgt) und was am Platz zu TUN ist. In dieser Reihenfolge, weil
 * man vom Himmel ausgeht und nicht vom Fachbegriff.
 *
 * Die lateinischen Namen stehen als Zweitname dabei – sie sind
 * international gleich und stehen in jeder Wetter-App; die Anzeige führt
 * aber den umgangssprachlichen Namen, weil man den auch aussprechen kann.
 *
 * Zur Vorwarnzeit: `leadHours` ist eine GROBE Faustregel für die
 * Zugbahn-Geschwindigkeit mitteleuropäischer Fronten. Sie steht als
 * Spanne im Text und nicht als Countdown – Wolken sind kein Fahrplan.
 */
import { l4, type L4 } from "@shared/i18n";

/** Stockwerk, in dem die Wolke hängt – bestimmt auch die Reihenfolge. */
export type CloudBand = "hoch" | "mittel" | "tief" | "vertikal";

export const cloudBandLabels: Record<CloudBand, L4> = {
  hoch: l4(
    "Hohe Wolken (ab 6 km)",
    "Nuages élevés (dès 6 km)",
    "Nuvole alte (da 6 km)",
    "High clouds (from 6 km)"
  ),
  mittel: l4(
    "Mittelhohe Wolken (2–7 km)",
    "Nuages moyens (2–7 km)",
    "Nuvole medie (2–7 km)",
    "Mid-level clouds (2–7 km)"
  ),
  tief: l4(
    "Tiefe Wolken (bis 2 km)",
    "Nuages bas (jusqu'à 2 km)",
    "Nuvole basse (fino a 2 km)",
    "Low clouds (up to 2 km)"
  ),
  vertikal: l4(
    "Quellwolken (über alle Stockwerke)",
    "Nuages à développement vertical",
    "Nuvole a sviluppo verticale",
    "Clouds with vertical growth"
  ),
};

/** Wie dringend ist die Wolke? Bestimmt Farbe und Reihenfolge der Anzeige. */
export type CloudUrgency = "gut" | "beobachten" | "warnung";

export interface CloudEntry {
  id: string;
  /** Umgangssprachlicher Name – der, den man aussprechen kann. */
  name: L4;
  /** Lateinischer Fachname, international gleich. */
  latin: string;
  band: CloudBand;
  urgency: CloudUrgency;
  /** Was man am Himmel sieht. */
  appearance: L4;
  /** Welches Wetter daraus folgt. */
  meaning: L4;
  /** Was das am Zeltplatz heisst. */
  campTip: L4;
  /**
   * Grobe Vorwarnzeit in Stunden, bis das angekündigte Wetter da ist.
   * null, wenn die Wolke nichts ankündigt (Schönwetterwolken) oder wenn
   * es bereits so weit ist (Gewitterwolke).
   */
  leadHours: [number, number] | null;
}

export const cloudEntries: CloudEntry[] = [
  // ── Hohe Wolken ──
  {
    id: "cirrus",
    name: l4("Federwolke", "Cirrus", "Cirro", "Mare's tail"),
    latin: "Cirrus",
    band: "hoch",
    urgency: "beobachten",
    appearance: l4(
      "Feine weisse Fäden oder Haken, wie mit dem Pinsel gezogen. Sie werfen keinen Schatten und die Sonne scheint ungehindert durch.",
      "Fins filaments blancs ou crochets, comme tracés au pinceau. Ils ne projettent pas d'ombre et le soleil passe sans obstacle.",
      "Fini filamenti bianchi o uncini, come tracciati col pennello. Non fanno ombra e il sole passa indisturbato.",
      "Fine white filaments or hooks, as if brushed on. They cast no shadow and the sun shines straight through."
    ),
    meaning: l4(
      "Einzelne Federwolken sind harmlos. Werden sie im Lauf des Tages mehr und ziehen sie alle aus derselben Richtung auf, kündigen sie eine Warmfront an – Regen folgt.",
      "Quelques cirrus isolés sont inoffensifs. S'ils se multiplient au fil de la journée et arrivent tous de la même direction, ils annoncent un front chaud – la pluie suit.",
      "Qualche cirro isolato è innocuo. Se durante la giornata aumentano e arrivano tutti dalla stessa direzione, annunciano un fronte caldo – seguirà la pioggia.",
      "A few isolated cirrus are harmless. If they multiply through the day and all move in from the same direction, they announce a warm front – rain follows."
    ),
    campTip: l4(
      "Noch nichts tun, aber den Himmel im Auge behalten. Wäsche kann hängen bleiben.",
      "Ne rien faire encore, mais garder un œil sur le ciel. Le linge peut rester dehors.",
      "Ancora niente da fare, ma tieni d'occhio il cielo. Il bucato può restare fuori.",
      "Nothing to do yet, but keep an eye on the sky. Laundry can stay out."
    ),
    leadHours: [12, 24],
  },
  {
    id: "cirrostratus",
    name: l4(
      "Schleierwolke",
      "Voile de cirrostratus",
      "Velo di cirrostrato",
      "Halo veil"
    ),
    latin: "Cirrostratus",
    band: "hoch",
    urgency: "beobachten",
    appearance: l4(
      "Milchiger weisser Schleier über dem ganzen Himmel. Erkennungszeichen: ein Ring (Halo) um Sonne oder Mond.",
      "Voile blanc laiteux sur tout le ciel. Signe distinctif : un anneau (halo) autour du soleil ou de la lune.",
      "Velo bianco lattiginoso su tutto il cielo. Segno distintivo: un anello (alone) attorno al sole o alla luna.",
      "A milky white veil across the whole sky. Telltale sign: a ring (halo) around the sun or moon."
    ),
    meaning: l4(
      "Der Halo ist eines der zuverlässigsten Zeichen überhaupt: Die Warmfront ist nah, der Regen kommt meist innerhalb eines halben Tages.",
      "Le halo est l'un des signes les plus fiables : le front chaud est proche, la pluie arrive généralement en moins d'une demi-journée.",
      "L'alone è uno dei segni più affidabili: il fronte caldo è vicino, la pioggia arriva di solito entro mezza giornata.",
      "The halo is one of the most reliable signs there is: the warm front is close, and rain usually arrives within half a day."
    ),
    campTip: l4(
      "Jetzt trocknen, was trocknen soll. Vorzelt und Abspannung prüfen, Holz unter Dach bringen.",
      "Fais sécher maintenant ce qui doit sécher. Vérifie l'auvent et les haubans, mets le bois à l'abri.",
      "Asciuga ora quello che deve asciugare. Controlla veranda e tiranti, metti la legna al riparo.",
      "Dry now whatever needs drying. Check the awning and guy lines, get firewood under cover."
    ),
    leadHours: [8, 16],
  },
  {
    id: "cirrocumulus",
    name: l4(
      "Kleine Schäfchenwolken",
      "Petits moutons",
      "Pecorelle piccole",
      "Mackerel sky"
    ),
    latin: "Cirrocumulus",
    band: "hoch",
    urgency: "beobachten",
    appearance: l4(
      "Viele winzige weisse Bällchen in Reihen, wie Fischschuppen. Keine Schatten, jedes Bällchen kleiner als ein Fingernagel bei ausgestrecktem Arm.",
      "Une multitude de petites boules blanches en rangées, comme des écailles de poisson. Pas d'ombre, chaque boule plus petite qu'un ongle à bout de bras.",
      "Tante minuscole palline bianche in file, come squame di pesce. Nessuna ombra, ogni pallina più piccola di un'unghia a braccio teso.",
      "Many tiny white balls in rows, like fish scales. No shadows, each ball smaller than a fingernail at arm's length."
    ),
    meaning: l4(
      "Unruhige Luft in der Höhe. Meist folgt innerhalb eines Tages ein Wetterwechsel – die alte Seemannsregel «Makrelenhimmel und Stutenschwänze halten keine 24 Stunden» trifft erstaunlich oft zu.",
      "Air instable en altitude. Un changement de temps suit généralement en un jour – la vieille règle des marins « ciel pommelé et queues de jument ne tiennent pas 24 heures » se vérifie étonnamment souvent.",
      "Aria instabile in quota. Di solito entro un giorno segue un cambio di tempo – la vecchia regola dei marinai «cielo a pecorelle, acqua a catinelle» si verifica sorprendentemente spesso.",
      "Unsettled air aloft. A change of weather usually follows within a day – the old sailors' rule “mackerel sky and mares' tails make tall ships carry low sails” holds up surprisingly often."
    ),
    campTip: l4(
      "Den Tag nutzen, die Nacht könnte ungemütlich werden. Heringe nachziehen.",
      "Profite de la journée, la nuit pourrait être agitée. Retends les sardines.",
      "Sfrutta la giornata, la notte potrebbe essere movimentata. Ritendi i picchetti.",
      "Make use of the day, the night could get rough. Re-tension the pegs."
    ),
    leadHours: [12, 24],
  },
  // ── Mittelhohe Wolken ──
  {
    id: "altocumulus",
    name: l4("Schäfchenwolken", "Moutons", "Pecorelle", "Sheep clouds"),
    latin: "Altocumulus",
    band: "mittel",
    urgency: "beobachten",
    appearance: l4(
      "Weiss-graue Ballen oder Walzen mit erkennbaren Schattenseiten, deutlich grösser als beim Makrelenhimmel – etwa daumenbreit bei ausgestrecktem Arm.",
      "Boules ou rouleaux blanc-gris avec des faces ombrées visibles, nettement plus gros que le ciel pommelé – environ un pouce à bout de bras.",
      "Batuffoli o rulli bianco-grigi con lati in ombra riconoscibili, molto più grandi delle pecorelle piccole – circa un pollice a braccio teso.",
      "White-grey balls or rolls with visible shaded sides, clearly larger than a mackerel sky – about a thumb's width at arm's length."
    ),
    meaning: l4(
      "Meist harmlos. ACHTUNG aber, wenn sie am MORGEN türmchenartig nach oben wachsen (Altocumulus castellanus): Dann ist die Luft labil, und am Nachmittag gibt es mit hoher Wahrscheinlichkeit Gewitter.",
      "Généralement inoffensifs. ATTENTION toutefois s'ils poussent en petites tours le MATIN (altocumulus castellanus) : l'air est alors instable et des orages sont très probables l'après-midi.",
      "Di solito innocue. ATTENZIONE però se al MATTINO crescono a torrette (altocumulus castellanus): allora l'aria è instabile e nel pomeriggio i temporali sono molto probabili.",
      "Usually harmless. But WATCH OUT if they grow into little turrets in the MORNING (altocumulus castellanus): the air is unstable and thunderstorms are very likely in the afternoon."
    ),
    campTip: l4(
      "Türmchen am Morgen: Ausflug früh planen und am Nachmittag in Zeltnähe bleiben.",
      "Petites tours le matin : prévois l'excursion tôt et reste près de la tente l'après-midi.",
      "Torrette al mattino: pianifica l'escursione presto e nel pomeriggio resta vicino alla tenda.",
      "Turrets in the morning: plan the outing early and stay near the tent in the afternoon."
    ),
    leadHours: [4, 8],
  },
  {
    id: "altostratus",
    name: l4("Graue Schicht", "Couche grise", "Strato grigio", "Grey sheet"),
    latin: "Altostratus",
    band: "mittel",
    urgency: "beobachten",
    appearance: l4(
      "Gleichmässig graue Decke über den ganzen Himmel. Die Sonne steht wie hinter Milchglas – noch als heller Fleck erkennbar, aber ohne Schatten am Boden.",
      "Couche grise uniforme sur tout le ciel. Le soleil est comme derrière un verre dépoli – encore visible comme tache claire, mais sans ombre au sol.",
      "Coltre grigia uniforme su tutto il cielo. Il sole è come dietro un vetro smerigliato – ancora visibile come macchia chiara, ma senza ombra a terra.",
      "An even grey sheet across the whole sky. The sun looks like it is behind frosted glass – still a bright patch, but no shadows on the ground."
    ),
    meaning: l4(
      "Die Warmfront ist da. Der Regen setzt meist innerhalb weniger Stunden ein und hält dann länger an – kein Schauer, sondern Landregen.",
      "Le front chaud est là. La pluie commence généralement en quelques heures et dure longtemps – pas une averse, mais une pluie continue.",
      "Il fronte caldo è arrivato. La pioggia inizia di solito entro poche ore e dura a lungo – non un rovescio, ma pioggia continua.",
      "The warm front has arrived. Rain usually starts within a few hours and then lasts – not a shower, but steady rain."
    ),
    campTip: l4(
      "Alles unter Dach, Vorzelt schliessen, Regenkleidung griffbereit. Guter Zeitpunkt für den Kochplan.",
      "Tout à l'abri, ferme l'auvent, garde les habits de pluie à portée. Bon moment pour le plan de repas.",
      "Tutto al riparo, chiudi la veranda, tieni a portata l'abbigliamento da pioggia. Buon momento per il piano dei pasti.",
      "Everything under cover, close the awning, keep rain gear handy. Good moment for the meal plan."
    ),
    leadHours: [2, 6],
  },
  {
    id: "lenticularis",
    name: l4("Föhnfisch", "Lenticulaire", "Lenticolare", "Lens cloud"),
    latin: "Altocumulus lenticularis",
    band: "mittel",
    urgency: "beobachten",
    appearance: l4(
      "Glatte, linsen- oder mandelförmige Wolke, die über einem Berggrat steht und sich nicht von der Stelle bewegt, obwohl es windet.",
      "Nuage lisse en forme de lentille ou d'amande, posé au-dessus d'une crête et qui ne bouge pas malgré le vent.",
      "Nuvola liscia a forma di lente o mandorla, ferma sopra una cresta e immobile nonostante il vento.",
      "A smooth lens- or almond-shaped cloud sitting over a ridge and not moving, even though it is windy."
    ),
    meaning: l4(
      "Starker Wind in der Höhe, in den Alpen meist Föhn. Am Boden kann es noch ruhig sein – nachts frischt es oft kräftig auf.",
      "Vent fort en altitude, dans les Alpes le plus souvent le föhn. Au sol, le calme peut encore régner – la nuit, le vent se lève souvent fortement.",
      "Vento forte in quota, nelle Alpi di solito favonio. Al suolo può essere ancora calmo – di notte spesso rinforza decisamente.",
      "Strong wind aloft, in the Alps usually the föhn. It can still be calm at ground level – the wind often picks up sharply at night."
    ),
    campTip: l4(
      "Zelt zusätzlich abspannen, Sturmleinen setzen, Sonnensegel abbauen. Föhn bringt Wärme, aber auch die Böen.",
      "Haubane la tente en plus, pose les tendeurs de tempête, démonte la voile d'ombrage. Le föhn apporte la chaleur, mais aussi les rafales.",
      "Tendi ulteriormente la tenda, monta i tiranti da tempesta, smonta la vela ombreggiante. Il favonio porta caldo, ma anche raffiche.",
      "Add extra guy lines, set the storm lines, take down the sun sail. The föhn brings warmth – and gusts."
    ),
    leadHours: [3, 12],
  },
  // ── Tiefe Wolken ──
  {
    id: "nimbostratus",
    name: l4("Regenwolke", "Nuage de pluie", "Nuvola di pioggia", "Rain cloud"),
    latin: "Nimbostratus",
    band: "tief",
    urgency: "beobachten",
    appearance: l4(
      "Dunkelgraue, formlose Schicht, die den Himmel vollständig zudeckt. Die Sonne ist gar nicht mehr zu sehen, die Unterseite wirkt ausgefranst.",
      "Couche gris foncé et informe qui couvre entièrement le ciel. Le soleil n'est plus visible du tout, la base paraît effilochée.",
      "Strato grigio scuro e informe che copre completamente il cielo. Il sole non si vede più, la base appare sfrangiata.",
      "A dark grey, shapeless layer covering the sky completely. The sun is gone entirely and the base looks ragged."
    ),
    meaning: l4(
      "Das ist die Wolke, aus der es stundenlang regnet oder schneit. Keine Blitze, kein Sturm – aber auch keine baldige Besserung.",
      "C'est le nuage dont il pleut ou neige pendant des heures. Pas d'éclairs, pas de tempête – mais pas d'amélioration rapide non plus.",
      "È la nuvola da cui piove o nevica per ore. Niente fulmini, niente tempesta – ma nemmeno un miglioramento in tempi brevi.",
      "This is the cloud it rains or snows from for hours. No lightning, no storm – but no quick improvement either."
    ),
    campTip: l4(
      "Auf einen Regentag einstellen. Zeltboden kontrollieren, nichts direkt an die Innenwand lehnen.",
      "Prépare-toi à une journée de pluie. Contrôle le tapis de sol, n'appuie rien contre la paroi intérieure.",
      "Preparati a una giornata di pioggia. Controlla il fondo della tenda, non appoggiare nulla alla parete interna.",
      "Settle in for a wet day. Check the groundsheet and keep everything off the inner wall."
    ),
    leadHours: null,
  },
  {
    id: "stratus",
    name: l4("Hochnebel", "Stratus", "Nebbia alta", "Low stratus"),
    latin: "Stratus",
    band: "tief",
    urgency: "gut",
    appearance: l4(
      "Grauer, gleichförmiger Deckel knapp über dem Boden – Nebel, der den Boden nicht ganz berührt. Oft im Herbst und Winter im Mittelland.",
      "Couvercle gris et uniforme juste au-dessus du sol – du brouillard qui ne touche pas tout à fait le sol. Fréquent en automne et en hiver sur le Plateau.",
      "Coperchio grigio e uniforme appena sopra il suolo – nebbia che non tocca del tutto il terreno. Frequente in autunno e inverno sull'Altopiano.",
      "A grey, uniform lid just above the ground – fog that does not quite reach it. Common in autumn and winter on the Swiss plateau."
    ),
    meaning: l4(
      "Trüb, aber harmlos: höchstens Nieselregen. Oft reissen ein paar hundert Höhenmeter weiter oben die Wolken auf – über dem Nebelmeer scheint die Sonne.",
      "Terne, mais inoffensif : au pire de la bruine. Souvent, quelques centaines de mètres plus haut, les nuages se déchirent – au-dessus de la mer de brouillard, le soleil brille.",
      "Cupo, ma innocuo: al massimo pioviggine. Spesso qualche centinaio di metri più in alto le nuvole si aprono – sopra il mare di nebbia splende il sole.",
      "Dreary but harmless: drizzle at worst. Often the cloud breaks a few hundred metres higher up – above the fog sea the sun is shining."
    ),
    campTip: l4(
      "Guter Tag für eine Wanderung nach oben. Feuchte Wäsche trocknet unten heute nicht.",
      "Bonne journée pour une randonnée en altitude. Le linge humide ne séchera pas en bas aujourd'hui.",
      "Buona giornata per un'escursione in quota. Il bucato umido oggi in basso non asciuga.",
      "A good day for a walk up high. Damp laundry will not dry down here today."
    ),
    leadHours: null,
  },
  {
    id: "stratocumulus",
    name: l4(
      "Aufgelockerte Schicht",
      "Couche fragmentée",
      "Strato frammentato",
      "Broken layer"
    ),
    latin: "Stratocumulus",
    band: "tief",
    urgency: "gut",
    appearance: l4(
      "Graue bis weisse Ballen und Walzen, die zusammenhängen, aber blaue Lücken lassen. Deutlich grösser als Schäfchenwolken – gut handbreit bei ausgestrecktem Arm.",
      "Boules et rouleaux gris à blancs, liés entre eux mais laissant des trouées bleues. Nettement plus gros que les moutons – une bonne largeur de main à bout de bras.",
      "Batuffoli e rulli da grigi a bianchi, uniti ma con squarci azzurri. Molto più grandi delle pecorelle – una buona mano a braccio teso.",
      "Grey to white rolls and lumps that hang together but leave blue gaps. Clearly bigger than sheep clouds – a good hand's width at arm's length."
    ),
    meaning: l4(
      "Wetterberuhigung. Aus Stratocumulus fällt selten mehr als ein paar Tropfen; oft löst er sich gegen Abend auf.",
      "Accalmie. Il tombe rarement plus que quelques gouttes du stratocumulus ; souvent il se dissipe vers le soir.",
      "Il tempo si calma. Dallo stratocumulo cadono raramente più di poche gocce; spesso si dissolve verso sera.",
      "Things are settling. Stratocumulus rarely drops more than a few spots and often dissolves towards evening."
    ),
    campTip: l4(
      "Nichts zu tun. Der Abend am Feuer dürfte trocken bleiben.",
      "Rien à faire. La soirée au feu devrait rester sèche.",
      "Nulla da fare. La serata attorno al fuoco dovrebbe restare asciutta.",
      "Nothing to do. The evening by the fire should stay dry."
    ),
    leadHours: null,
  },
  // ── Quellwolken ──
  {
    id: "cumulus-humilis",
    name: l4(
      "Schönwetterwolke",
      "Cumulus de beau temps",
      "Cumulo di bel tempo",
      "Fair-weather cumulus"
    ),
    latin: "Cumulus humilis",
    band: "vertikal",
    urgency: "gut",
    appearance: l4(
      "Kleine weisse Wattebäusche mit flacher, grauer Unterseite und scharfen Rändern. Breiter als hoch, mit viel Blau dazwischen.",
      "Petits flocons de coton blancs à base plate et grise, aux bords nets. Plus larges que hauts, avec beaucoup de bleu entre eux.",
      "Piccoli batuffoli bianchi con base piatta e grigia e bordi netti. Più larghi che alti, con molto azzurro in mezzo.",
      "Small white cotton puffs with a flat grey base and crisp edges. Wider than tall, with plenty of blue between them."
    ),
    meaning: l4(
      "Das schönste Zeichen am Himmel: stabile Luft, sonniger Tag. Sie entstehen am Vormittag, wachsen wenig und lösen sich gegen Abend auf.",
      "Le plus beau signe du ciel : air stable, journée ensoleillée. Ils apparaissent en matinée, grandissent peu et se dissipent vers le soir.",
      "Il segno più bello del cielo: aria stabile, giornata soleggiata. Si formano in mattinata, crescono poco e si dissolvono verso sera.",
      "The finest sign in the sky: stable air, a sunny day. They form in the morning, grow little and dissolve towards evening."
    ),
    campTip: l4(
      "Idealer Tag für Ausflug, Wäsche und Sonnensegel.",
      "Journée idéale pour une excursion, la lessive et la voile d'ombrage.",
      "Giornata ideale per escursione, bucato e vela ombreggiante.",
      "An ideal day for an outing, laundry and the sun sail."
    ),
    leadHours: null,
  },
  {
    id: "cumulus-congestus",
    name: l4(
      "Quellwolke",
      "Cumulus bourgeonnant",
      "Cumulo in sviluppo",
      "Towering cumulus"
    ),
    latin: "Cumulus congestus",
    band: "vertikal",
    urgency: "beobachten",
    appearance: l4(
      "Deutlich höher als breit, blumenkohlartig nach oben wachsend, Oberseite noch scharf umrissen und weiss. Unterseite wird dunkler.",
      "Nettement plus haut que large, poussant vers le haut en chou-fleur, sommet encore net et blanc. La base s'assombrit.",
      "Nettamente più alto che largo, cresce verso l'alto a cavolfiore, la cima è ancora netta e bianca. La base si scurisce.",
      "Clearly taller than wide, growing upwards like a cauliflower, top still sharply outlined and white. The base darkens."
    ),
    meaning: l4(
      "Die Vorstufe zum Gewitter. Wächst die Wolke weiter und wird ihr Rand oben faserig, entsteht daraus in einer halben bis einer Stunde eine Gewitterwolke.",
      "Le stade qui précède l'orage. Si le nuage continue de grandir et que son sommet devient fibreux, il devient un cumulonimbus en une demi-heure à une heure.",
      "Lo stadio che precede il temporale. Se la nuvola continua a crescere e la cima diventa fibrosa, in mezz'ora o un'ora diventa un cumulonembo.",
      "The stage before a thunderstorm. If the cloud keeps growing and its top turns fibrous, it becomes a thundercloud within half an hour to an hour."
    ),
    campTip: l4(
      "Jetzt handeln, nicht später: Sonnensegel abbauen, loses Zeug sichern, Rückweg planen. Auf dem Wasser oder auf dem Grat sofort umkehren.",
      "Agis maintenant, pas plus tard : démonte la voile d'ombrage, sécurise ce qui traîne, prévois le retour. Sur l'eau ou sur une crête, fais demi-tour tout de suite.",
      "Agisci ora, non dopo: smonta la vela ombreggiante, fissa le cose sciolte, pianifica il rientro. Sull'acqua o in cresta torna indietro subito.",
      "Act now, not later: take down the sun sail, secure loose gear, plan the way back. On water or on a ridge, turn back immediately."
    ),
    leadHours: [1, 2],
  },
  {
    id: "cumulonimbus",
    name: l4(
      "Gewitterwolke",
      "Nuage d'orage",
      "Nube temporalesca",
      "Thundercloud"
    ),
    latin: "Cumulonimbus",
    band: "vertikal",
    urgency: "warnung",
    appearance: l4(
      "Riesig, dunkle Basis, oben faserig ausgefranst und seitlich ausgezogen – der berühmte Amboss. Darunter oft Regenschleier und plötzlich auffrischender, böiger Wind.",
      "Immense, base sombre, sommet fibreux étalé sur le côté – la fameuse enclume. En dessous, souvent des rideaux de pluie et un vent qui se lève brusquement en rafales.",
      "Enorme, base scura, cima sfrangiata e allargata di lato – la famosa incudine. Sotto spesso veli di pioggia e vento a raffiche che si alza all'improvviso.",
      "Huge, dark base, fibrous top drawn out to one side – the famous anvil. Below it, often curtains of rain and a wind that suddenly picks up in gusts."
    ),
    meaning: l4(
      "Gewitter mit Blitz, Sturmböen und Hagel. Die gefährlichste Wolke überhaupt – die Böenfront trifft oft ein, bevor der erste Tropfen fällt.",
      "Orage avec éclairs, rafales de tempête et grêle. Le nuage le plus dangereux qui soit – le front de rafales arrive souvent avant la première goutte.",
      "Temporale con fulmini, raffiche di burrasca e grandine. La nuvola più pericolosa in assoluto – il fronte delle raffiche arriva spesso prima della prima goccia.",
      "A thunderstorm with lightning, squalls and hail. The most dangerous cloud there is – the gust front often arrives before the first drop."
    ),
    campTip: l4(
      "Zelt ist kein Schutz vor Blitz. Ins Auto oder in ein festes Gebäude, weg von einzelnen Bäumen, Masten und Wasser. Erst 30 Minuten nach dem letzten Donner wieder raus.",
      "Une tente ne protège pas de la foudre. Va dans la voiture ou dans un bâtiment en dur, loin des arbres isolés, des mâts et de l'eau. Ne ressors que 30 minutes après le dernier coup de tonnerre.",
      "La tenda non protegge dai fulmini. Vai in auto o in un edificio solido, lontano da alberi isolati, pali e acqua. Esci solo 30 minuti dopo l'ultimo tuono.",
      "A tent is no protection from lightning. Get into the car or a solid building, away from lone trees, poles and water. Only come out 30 minutes after the last thunder."
    ),
    leadHours: [0, 1],
  },
];

/** Reihenfolge der Stockwerke in der Anzeige: von oben nach unten. */
export const cloudBandOrder: CloudBand[] = [
  "hoch",
  "mittel",
  "tief",
  "vertikal",
];

/** Alle Wolken eines Stockwerks, in der Reihenfolge des Lexikons. */
export function cloudsInBand(band: CloudBand): CloudEntry[] {
  return cloudEntries.filter(entry => entry.band === band);
}
