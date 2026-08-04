/**
 * Notfall-Übung für Kinder (#291): vorher üben, was im Ernstfall zu tun ist.
 *
 * WARUM ÜBEN UND NICHT NUR SAGEN: Ein Kind, das sich verlaufen hat, ist
 * erschrocken. In dem Zustand fällt einem nicht ein, was die Eltern
 * irgendwann einmal erklärt haben – es fällt einem ein, was man schon
 * einmal GEMACHT hat. Deshalb hat jedes Szenario eine Übung, die man am
 * Platz wirklich durchspielt, und eine Kontrollfrage.
 *
 * DIE REIHENFOLGE DER SCHRITTE ist der Inhalt. «Bleib stehen» steht
 * überall zuerst, weil Weiterlaufen den Abstand vergrössert und weil
 * Suchende an einem Punkt suchen, nicht an einem beweglichen Ziel.
 *
 * KEINE PERSONENDATEN. Dieses Modul speichert weder Namen noch Nummern –
 * es merkt sich nur, WANN eine Übung zuletzt gemacht wurde. Was ein Kind
 * auswendig können muss, übt man mit ihm, statt es in einer App zu
 * hinterlegen.
 */
import { l4, type L4 } from "./i18n";

/**
 * Nach einem halben Jahr ist eine Übung wieder fällig. Kinder wachsen,
 * und der Platz ist beim nächsten Mal ein anderer.
 */
export const DRILL_DUE_DAYS = 182;

export interface DrillScenario {
  id: string;
  /** Die Lage, in kindgerechten Worten. */
  title: L4;
  /** Wann kommt das vor? Ein Satz zur Einordnung für die Eltern. */
  situation: L4;
  /** Ab diesem Alter verstehen Kinder die Schritte. */
  minAge: number;
  /** Was zu tun ist, in dieser Reihenfolge. */
  steps: L4[];
  /** Was man NICHT tut – oft der wichtigere Teil. */
  mistakes: L4[];
  /** Wie man es am Platz durchspielt. */
  practice: L4;
  /** Kontrollfrage mit Antwortmöglichkeiten. */
  question: L4;
  answers: L4[];
  /** Index der richtigen Antwort in `answers`. */
  correct: number;
  /** Warum diese Antwort richtig ist – gehört nach dem Tippen dazu. */
  explain: L4;
}

export const DRILL_SCENARIOS: DrillScenario[] = [
  {
    id: "platz-verloren",
    title: l4(
      "Ich finde unseren Platz nicht mehr",
      "Je ne retrouve plus notre emplacement",
      "Non trovo più la nostra piazzola",
      "I cannot find our pitch"
    ),
    situation: l4(
      "Der häufigste Fall: Alle Zelte sehen gleich aus, und die Reihe stimmt nicht mehr.",
      "Le cas le plus fréquent : toutes les tentes se ressemblent et on n'est plus dans la bonne rangée.",
      "Il caso più frequente: tutte le tende sembrano uguali e la fila non è quella giusta.",
      "The most common case: all the tents look alike and you are in the wrong row."
    ),
    minAge: 4,
    steps: [
      l4(
        "Stehen bleiben und bis zehn zählen.",
        "S'arrêter et compter jusqu'à dix.",
        "Fermarsi e contare fino a dieci.",
        "Stop and count to ten."
      ),
      l4(
        "Schau dich um: Siehst du etwas, das du kennst? Den Spielplatz, das Waschhaus, den Kiosk?",
        "Regarde autour de toi : vois-tu quelque chose que tu connais ? Le jeu, les sanitaires, le kiosque ?",
        "Guardati intorno: vedi qualcosa che conosci? Il parco giochi, i bagni, il chiosco?",
        "Look around: do you see something you know? The playground, the wash block, the kiosk?"
      ),
      l4(
        "Geh zur Rezeption oder zum Waschhaus – das findet man von überall.",
        "Va à la réception ou aux sanitaires – on les trouve de partout.",
        "Vai alla reception o ai bagni – si trovano da ovunque.",
        "Go to reception or the wash block – you can find those from anywhere."
      ),
      l4(
        "Sag einer erwachsenen Person, die dort arbeitet: «Ich finde meine Eltern nicht.»",
        "Dis à une personne qui y travaille : « Je ne retrouve pas mes parents. »",
        "Di' a una persona che lavora lì: «Non trovo i miei genitori.»",
        "Tell someone who works there: “I cannot find my parents.”"
      ),
      l4(
        "Dort bleiben, bis dich jemand abholt.",
        "Rester là jusqu'à ce qu'on vienne te chercher.",
        "Restare lì finché qualcuno viene a prenderti.",
        "Stay there until someone comes to get you."
      ),
    ],
    mistakes: [
      l4(
        "Nicht weiterlaufen und suchen – dann sucht ihr euch gegenseitig.",
        "Ne pas continuer à chercher en marchant – vous vous chercheriez mutuellement.",
        "Non continuare a cercare camminando – vi cerchereste a vicenda.",
        "Do not keep walking and searching – then you will be looking for each other."
      ),
      l4(
        "Nicht mit jemandem mitgehen, der dich nach Hause bringen will.",
        "Ne pas suivre quelqu'un qui propose de te ramener.",
        "Non seguire chi si offre di riportarti a casa.",
        "Do not go with anyone who offers to take you home."
      ),
    ],
    practice: l4(
      "Geht zusammen einmal den Weg von eurem Platz zur Rezeption und zurück. Dann soll das Kind vorangehen.",
      "Faites ensemble le chemin de votre emplacement à la réception et retour. Puis laissez l'enfant passer devant.",
      "Fate insieme il percorso dalla piazzola alla reception e ritorno. Poi lasciate andare avanti il bambino.",
      "Walk from your pitch to reception and back together. Then let the child lead the way."
    ),
    question: l4(
      "Du merkst, dass du den Platz nicht mehr findest. Was machst du ZUERST?",
      "Tu réalises que tu ne retrouves pas l'emplacement. Que fais-tu EN PREMIER ?",
      "Ti accorgi di non trovare la piazzola. Cosa fai PER PRIMA COSA?",
      "You realise you cannot find the pitch. What do you do FIRST?"
    ),
    answers: [
      l4("Stehen bleiben", "M'arrêter", "Mi fermo", "Stop where I am"),
      l4(
        "Schnell weitersuchen",
        "Chercher plus vite",
        "Cercare in fretta",
        "Search faster"
      ),
      l4(
        "Rufen und rennen",
        "Crier et courir",
        "Gridare e correre",
        "Shout and run"
      ),
    ],
    correct: 0,
    explain: l4(
      "Stehen bleiben macht den Abstand nicht grösser. Wer sucht, sucht einen Punkt – kein bewegliches Ziel.",
      "S'arrêter n'augmente pas la distance. Ceux qui cherchent cherchent un point, pas une cible mobile.",
      "Fermarsi non aumenta la distanza. Chi cerca cerca un punto, non un bersaglio in movimento.",
      "Standing still keeps the distance from growing. Searchers look for a point, not a moving target."
    ),
  },
  {
    id: "fremde-person",
    title: l4(
      "Jemand Fremdes spricht mich an",
      "Une personne inconnue m'aborde",
      "Uno sconosciuto mi parla",
      "A stranger talks to me"
    ),
    situation: l4(
      "Auf dem Campingplatz sind alle freundlich – das macht es für Kinder schwerer, Grenzen zu ziehen.",
      "Au camping tout le monde est aimable – d'où la difficulté pour les enfants de poser des limites.",
      "In campeggio sono tutti gentili – per i bambini è quindi più difficile porre limiti.",
      "At a campsite everyone is friendly – which makes it harder for children to draw a line."
    ),
    minAge: 5,
    steps: [
      l4(
        "Ein paar Schritte Abstand nehmen.",
        "Prendre quelques pas de recul.",
        "Fare qualche passo indietro.",
        "Take a few steps back."
      ),
      l4(
        "Freundlich, aber klar sagen: «Nein, danke.»",
        "Dire gentiment mais clairement : « Non, merci. »",
        "Dire gentilmente ma chiaramente: «No, grazie.»",
        "Say politely but clearly: “No, thank you.”"
      ),
      l4(
        "Dorthin gehen, wo andere Leute sind.",
        "Aller là où il y a d'autres gens.",
        "Andare dove ci sono altre persone.",
        "Go to where other people are."
      ),
      l4(
        "Den Eltern erzählen, was war – auch wenn nichts passiert ist.",
        "Raconter aux parents ce qui s'est passé – même s'il ne s'est rien passé.",
        "Raccontare ai genitori cos'è successo – anche se non è successo nulla.",
        "Tell your parents what happened – even if nothing happened."
      ),
    ],
    mistakes: [
      l4(
        "Nicht mitgehen, auch nicht «nur kurz» und nicht zu einem Tier.",
        "Ne pas suivre, même « juste un instant » et même pour voir un animal.",
        "Non seguire, nemmeno «solo un attimo» né per vedere un animale.",
        "Do not go along, not even “just for a moment” and not to see an animal."
      ),
      l4(
        "Nicht sagen, wo euer Platz ist oder dass ihr allein seid.",
        "Ne pas dire où est votre emplacement ni que vous êtes seuls.",
        "Non dire dov'è la piazzola né che siete soli.",
        "Do not say where your pitch is or that you are alone."
      ),
    ],
    practice: l4(
      "Spielt es einmal durch: Ein Elternteil spielt die fremde Person, das Kind übt das «Nein, danke» und das Weggehen. Danach loben.",
      "Jouez la scène : un parent joue l'inconnu, l'enfant s'exerce au « Non, merci » et à s'éloigner. Puis féliciter.",
      "Provate la scena: un genitore fa lo sconosciuto, il bambino esercita il «No, grazie» e l'allontanarsi. Poi lodare.",
      "Act it out: a parent plays the stranger, the child practises “No, thank you” and walking away. Then praise them."
    ),
    question: l4(
      "Jemand sagt: «Komm, ich zeige dir meinen Hund.» Was machst du?",
      "Quelqu'un dit : « Viens, je te montre mon chien. » Que fais-tu ?",
      "Qualcuno dice: «Vieni, ti mostro il mio cane.» Cosa fai?",
      "Someone says: “Come, I'll show you my dog.” What do you do?"
    ),
    answers: [
      l4(
        "«Nein, danke» sagen und zu anderen Leuten gehen",
        "Dire « Non, merci » et aller vers d'autres gens",
        "Dire «No, grazie» e andare da altre persone",
        "Say “No, thank you” and go to other people"
      ),
      l4(
        "Kurz mitgehen, es ist ja nur ein Hund",
        "Y aller un instant, ce n'est qu'un chien",
        "Andare un attimo, è solo un cane",
        "Go along briefly, it is only a dog"
      ),
      l4(
        "Fragen, wo der Hund ist",
        "Demander où est le chien",
        "Chiedere dov'è il cane",
        "Ask where the dog is"
      ),
    ],
    correct: 0,
    explain: l4(
      "Erwachsene, die Hilfe brauchen, fragen andere Erwachsene. Wer ein Kind lockt, hat etwas anderes vor.",
      "Les adultes qui ont besoin d'aide s'adressent à d'autres adultes. Qui attire un enfant a autre chose en tête.",
      "Gli adulti che hanno bisogno di aiuto chiedono ad altri adulti. Chi adesca un bambino ha altro in mente.",
      "Adults who need help ask other adults. Anyone luring a child has something else in mind."
    ),
  },
  {
    id: "verlaufen-wald",
    title: l4(
      "Ich habe mich im Wald verlaufen",
      "Je me suis perdu en forêt",
      "Mi sono perso nel bosco",
      "I got lost in the woods"
    ),
    situation: l4(
      "Auf der Wanderung ein paar Schritte hinterher – und die Abzweigung war die falsche.",
      "Quelques pas en arrière pendant la randonnée – et l'embranchement était le mauvais.",
      "Qualche passo indietro durante l'escursione – e il bivio era quello sbagliato.",
      "A few steps behind on the hike – and the fork was the wrong one."
    ),
    minAge: 6,
    steps: [
      l4(
        "Stehen bleiben. Nicht weiterlaufen, auch nicht bergab.",
        "S'arrêter. Ne pas continuer, même pas en descendant.",
        "Fermarsi. Non proseguire, nemmeno in discesa.",
        "Stop. Do not walk on, not even downhill."
      ),
      l4(
        "Laut rufen und dann still sein und horchen. Abwechselnd.",
        "Crier fort, puis se taire et écouter. En alternance.",
        "Gridare forte, poi tacere e ascoltare. Alternando.",
        "Call out loudly, then be quiet and listen. Take turns."
      ),
      l4(
        "Wenn du eine Pfeife hast: dreimal pfeifen, warten, wieder dreimal.",
        "Si tu as un sifflet : siffler trois fois, attendre, recommencer.",
        "Se hai un fischietto: fischiare tre volte, aspettare, di nuovo tre.",
        "If you have a whistle: three blasts, wait, three again."
      ),
      l4(
        "An einem offenen Ort bleiben, wo man dich sieht. Warm anziehen, was du dabei hast.",
        "Rester dans un endroit dégagé où l'on te voit. Mettre ce que tu as de chaud.",
        "Restare in un punto aperto dove ti si vede. Mettersi addosso ciò che hai di caldo.",
        "Stay in an open spot where you can be seen. Put on whatever warm things you have."
      ),
    ],
    mistakes: [
      l4(
        "Nicht abkürzen und nicht den Hang hinunter – dort holt einen niemand.",
        "Ne pas couper ni descendre la pente – personne ne vient te chercher là.",
        "Non tagliare e non scendere il pendio – lì nessuno ti trova.",
        "Do not cut across or head down the slope – nobody will find you there."
      ),
      l4(
        "Nicht im Bach oder Tobel weitergehen, auch wenn es abwärts führt.",
        "Ne pas suivre le ruisseau ou la gorge, même si ça descend.",
        "Non seguire il ruscello o la forra, anche se scende.",
        "Do not follow the stream or gully, even though it leads down."
      ),
    ],
    practice: l4(
      "Gebt jedem Kind eine Pfeife an die Jacke und übt das Signal einmal auf dem Platz: dreimal pfeifen heisst «ich bin hier».",
      "Donnez un sifflet à chaque enfant et exercez le signal une fois au camping : trois coups veut dire « je suis là ».",
      "Date a ogni bambino un fischietto ed esercitate il segnale in campeggio: tre fischi vogliono dire «sono qui».",
      "Give each child a whistle on their jacket and practise the signal once on site: three blasts means “I am here”."
    ),
    question: l4(
      "Du bist allein auf dem Wanderweg und weisst nicht mehr weiter. Was hilft am meisten?",
      "Tu es seul sur le sentier et tu ne sais plus où aller. Qu'est-ce qui aide le plus ?",
      "Sei solo sul sentiero e non sai più dove andare. Cosa aiuta di più?",
      "You are alone on the trail and do not know the way. What helps most?"
    ),
    answers: [
      l4(
        "Stehen bleiben, rufen oder pfeifen und warten",
        "S'arrêter, crier ou siffler et attendre",
        "Fermarsi, gridare o fischiare e aspettare",
        "Stop, call or whistle and wait"
      ),
      l4(
        "Bergab gehen, dort ist ein Dorf",
        "Descendre, il y a un village",
        "Scendere, là c'è un paese",
        "Head downhill, there is a village"
      ),
      l4(
        "Dem Bach folgen",
        "Suivre le ruisseau",
        "Seguire il ruscello",
        "Follow the stream"
      ),
    ],
    correct: 0,
    explain: l4(
      "Suchmannschaften gehen den Weg ab, auf dem du zuletzt warst. Wer querfeldein absteigt, ist genau dort nicht mehr.",
      "Les équipes de secours parcourent le chemin où tu étais en dernier. Qui descend à travers bois n'y est plus.",
      "Le squadre di ricerca percorrono il sentiero dove eri per ultimo. Chi scende fuori sentiero lì non c'è più.",
      "Search parties walk the path where you last were. Anyone descending cross-country is no longer on it."
    ),
  },
  {
    id: "notruf",
    title: l4(
      "Ich muss Hilfe holen",
      "Je dois chercher de l'aide",
      "Devo cercare aiuto",
      "I need to get help"
    ),
    situation: l4(
      "Jemand ist gestürzt und steht nicht mehr auf. Das Kind ist das Einzige, das laufen kann.",
      "Quelqu'un est tombé et ne se relève pas. L'enfant est le seul à pouvoir aller chercher de l'aide.",
      "Qualcuno è caduto e non si rialza. Il bambino è l'unico che può andare a chiamare aiuto.",
      "Someone has fallen and cannot get up. The child is the only one who can go for help."
    ),
    minAge: 7,
    steps: [
      l4(
        "Schau, ob es dir selbst gefährlich werden kann. Erst dann hingehen.",
        "Regarde si cela peut devenir dangereux pour toi. Ensuite seulement approcher.",
        "Guarda se può diventare pericoloso per te. Solo dopo avvicinarti.",
        "Check whether it could become dangerous for you. Only then go closer."
      ),
      l4(
        "Laut um Hilfe rufen – meist ist jemand näher, als man denkt.",
        "Appeler à l'aide fort – souvent quelqu'un est plus près qu'on ne croit.",
        "Chiamare aiuto ad alta voce – spesso qualcuno è più vicino di quanto si pensi.",
        "Shout for help – usually someone is closer than you think."
      ),
      l4(
        "144 anrufen (Notruf) und sagen: wo du bist, was passiert ist, wie du heisst.",
        "Appeler le 144 et dire : où tu es, ce qui s'est passé, comment tu t'appelles.",
        "Chiamare il 144 e dire: dove sei, cosa è successo, come ti chiami.",
        "Call 144 and say: where you are, what happened, what your name is."
      ),
      l4(
        "Nicht auflegen, bis die Person am Telefon es sagt.",
        "Ne pas raccrocher avant que la personne au téléphone le dise.",
        "Non riagganciare finché non lo dice la persona al telefono.",
        "Do not hang up until the person on the phone says so."
      ),
    ],
    mistakes: [
      l4(
        "Nicht zuerst wegrennen, um jemanden zu holen – erst rufen, dann anrufen.",
        "Ne pas partir en courant d'abord – d'abord appeler, puis téléphoner.",
        "Non correre via subito – prima gridare, poi telefonare.",
        "Do not run off first – shout first, then phone."
      ),
      l4(
        "Die verletzte Person nicht verschieben, ausser es ist dort gefährlich.",
        "Ne pas déplacer la personne blessée, sauf si l'endroit est dangereux.",
        "Non spostare la persona ferita, salvo se il posto è pericoloso.",
        "Do not move the injured person unless the spot is dangerous."
      ),
    ],
    practice: l4(
      "Übt das Gespräch mit ausgeschaltetem Telefon: «Wo bist du?» ist die erste Frage – und die schwierigste. Übt sie am aktuellen Platz.",
      "Exercez l'appel avec le téléphone éteint : « Où es-tu ? » est la première question – et la plus difficile. Exercez-la sur place.",
      "Provate la telefonata col telefono spento: «Dove sei?» è la prima domanda – e la più difficile. Provatela in piazzola.",
      "Practise the call with the phone switched off: “Where are you?” is the first question – and the hardest. Practise it at your pitch."
    ),
    question: l4(
      "Was ist am Telefon das Wichtigste, das du sagen musst?",
      "Au téléphone, quelle est la chose la plus importante à dire ?",
      "Al telefono, qual è la cosa più importante da dire?",
      "On the phone, what is the most important thing to say?"
    ),
    answers: [
      l4("Wo du bist", "Où tu es", "Dove sei", "Where you are"),
      l4(
        "Wie du heisst",
        "Comment tu t'appelles",
        "Come ti chiami",
        "Your name"
      ),
      l4(
        "Wie alt du bist",
        "Quel âge tu as",
        "Quanti anni hai",
        "How old you are"
      ),
    ],
    correct: 0,
    explain: l4(
      "Ohne Ort kommt keine Hilfe. Den Namen kann man später sagen; der Ort entscheidet, ob jemand kommt.",
      "Sans lieu, pas de secours. Le nom peut venir après ; le lieu décide si quelqu'un arrive.",
      "Senza il luogo non arriva aiuto. Il nome può venire dopo; il luogo decide se qualcuno arriva.",
      "Without a location no help arrives. The name can come later; the place decides whether anyone comes."
    ),
  },
  {
    id: "wasser",
    title: l4(
      "Am Wasser",
      "Au bord de l'eau",
      "In riva all'acqua",
      "At the water"
    ),
    situation: l4(
      "See, Fluss oder Schwimmbad direkt am Platz – die häufigste ernste Gefahr im Campingurlaub.",
      "Lac, rivière ou piscine juste à côté – le danger sérieux le plus fréquent en camping.",
      "Lago, fiume o piscina accanto – il pericolo grave più frequente in campeggio.",
      "A lake, river or pool right there – the most common serious danger on a camping holiday."
    ),
    minAge: 5,
    steps: [
      l4(
        "Nie allein ans Wasser. Immer zuerst fragen.",
        "Jamais seul au bord de l'eau. Toujours demander d'abord.",
        "Mai da soli all'acqua. Chiedere sempre prima.",
        "Never go to the water alone. Always ask first."
      ),
      l4(
        "Wenn jemand im Wasser Hilfe braucht: NICHT hineinspringen.",
        "Si quelqu'un a besoin d'aide dans l'eau : NE PAS sauter.",
        "Se qualcuno ha bisogno di aiuto in acqua: NON tuffarsi.",
        "If someone in the water needs help: do NOT jump in."
      ),
      l4(
        "Etwas hinhalten oder werfen: Stange, Ast, Schwimmreif.",
        "Tendre ou lancer quelque chose : perche, branche, bouée.",
        "Porgere o lanciare qualcosa: un palo, un ramo, un salvagente.",
        "Hold out or throw something: a pole, a branch, a float."
      ),
      l4(
        "Laut rufen und Erwachsene holen.",
        "Crier fort et aller chercher des adultes.",
        "Gridare forte e chiamare gli adulti.",
        "Shout loudly and fetch adults."
      ),
    ],
    mistakes: [
      l4(
        "Nicht selbst hinterherschwimmen – wer hilft, geht am häufigsten mit unter.",
        "Ne pas nager après – ceux qui aident coulent le plus souvent avec.",
        "Non nuotare dietro – chi aiuta è quello che affonda più spesso.",
        "Do not swim after them – the helper is the one who most often goes under."
      ),
      l4(
        "Nicht in unbekanntes Wasser springen, auch nicht vom Steg.",
        "Ne pas sauter dans une eau inconnue, même du ponton.",
        "Non tuffarsi in acqua sconosciuta, nemmeno dal pontile.",
        "Do not jump into unknown water, not even off the jetty."
      ),
    ],
    practice: l4(
      "Zeigt dem Kind am ersten Tag, wo die Rettungsstange oder der Rettungsring hängt. Einmal hingehen genügt, damit es später einfällt.",
      "Montrez à l'enfant le premier jour où sont la perche ou la bouée de sauvetage. Y aller une fois suffit pour s'en souvenir.",
      "Il primo giorno mostrate al bambino dove sono l'asta o il salvagente. Andarci una volta basta per ricordarselo.",
      "On the first day, show the child where the rescue pole or ring hangs. Going there once is enough to remember it."
    ),
    question: l4(
      "Dein Freund ist ins tiefe Wasser geraten und schafft es nicht zurück. Was machst du?",
      "Ton ami est allé en eau profonde et n'y arrive plus. Que fais-tu ?",
      "Il tuo amico è finito in acqua profonda e non ce la fa. Cosa fai?",
      "Your friend has got into deep water and cannot get back. What do you do?"
    ),
    answers: [
      l4(
        "Etwas hinhalten oder werfen und laut rufen",
        "Tendre ou lancer quelque chose et crier fort",
        "Porgere o lanciare qualcosa e gridare forte",
        "Hold out or throw something and shout loudly"
      ),
      l4(
        "Hinterherschwimmen",
        "Nager après lui",
        "Nuotare dietro",
        "Swim after them"
      ),
      l4(
        "Zum Zelt rennen und die Eltern holen",
        "Courir à la tente chercher les parents",
        "Correre alla tenda a chiamare i genitori",
        "Run to the tent to fetch your parents"
      ),
    ],
    correct: 0,
    explain: l4(
      "Wer hinterherschwimmt, wird oft mit hinuntergezogen. Und wer erst zum Zelt rennt, verliert die Minuten, auf die es ankommt – rufen geht sofort.",
      "Qui nage après est souvent entraîné vers le fond. Et courir à la tente coûte les minutes décisives – crier est immédiat.",
      "Chi nuota dietro viene spesso trascinato sotto. E correre alla tenda costa i minuti decisivi – gridare è immediato.",
      "Whoever swims after them is often pulled under. And running to the tent costs the decisive minutes – shouting is instant."
    ),
  },
  {
    id: "feuer",
    title: l4(
      "Es brennt",
      "Il y a le feu",
      "C'è un incendio",
      "There is a fire"
    ),
    situation: l4(
      "Gaskocher, Feuerschale, Grill: Auf einem Campingplatz brennt es schneller als daheim, und Zelte brennen sehr schnell.",
      "Réchaud, brasero, gril : au camping le feu prend plus vite qu'à la maison, et les tentes brûlent très vite.",
      "Fornello, braciere, griglia: in campeggio il fuoco prende più in fretta che a casa, e le tende bruciano molto in fretta.",
      "Stove, fire bowl, grill: on a campsite fire starts faster than at home, and tents burn very fast."
    ),
    minAge: 5,
    steps: [
      l4(
        "Sofort weg vom Zelt – nichts holen, gar nichts.",
        "S'éloigner immédiatement de la tente – ne rien aller chercher, rien.",
        "Allontanarsi subito dalla tenda – non prendere niente, proprio niente.",
        "Get away from the tent at once – fetch nothing, nothing at all."
      ),
      l4(
        "Laut rufen, damit die Nachbarn es hören.",
        "Crier fort pour que les voisins entendent.",
        "Gridare forte perché i vicini sentano.",
        "Shout loudly so the neighbours hear."
      ),
      l4(
        "Zum vereinbarten Treffpunkt gehen und dort bleiben.",
        "Aller au point de rendez-vous convenu et y rester.",
        "Andare al punto d'incontro concordato e restare lì.",
        "Go to the agreed meeting point and stay there."
      ),
      l4(
        "Erwachsene rufen 118 (Feuerwehr).",
        "Les adultes appellent le 118 (pompiers).",
        "Gli adulti chiamano il 118 (pompieri).",
        "Adults call 118 (fire brigade)."
      ),
    ],
    mistakes: [
      l4(
        "Nichts zurückholen – kein Kuscheltier, kein Tablet. Nichts davon ist ersetzbar durch dich.",
        "Ne rien récupérer – ni doudou ni tablette. Rien de tout cela ne te remplace.",
        "Non tornare a prendere niente – né peluche né tablet. Niente di ciò vale quanto te.",
        "Do not go back for anything – no cuddly toy, no tablet. None of it can replace you."
      ),
      l4(
        "Brennendes Fett nie mit Wasser löschen – Deckel drauf.",
        "Ne jamais éteindre de la graisse en feu avec de l'eau – mettre un couvercle.",
        "Mai spegnere il grasso in fiamme con l'acqua – mettere un coperchio.",
        "Never put water on burning fat – put a lid on it."
      ),
    ],
    practice: l4(
      "Macht am ersten Abend einen Treffpunkt aus – ein Baum, die Schranke, der Spielplatz – und geht einmal zusammen hin.",
      "Convenez d'un point de rendez-vous le premier soir – un arbre, la barrière, le jeu – et allez-y une fois ensemble.",
      "La prima sera stabilite un punto d'incontro – un albero, la sbarra, il parco giochi – e andateci insieme una volta.",
      "On the first evening agree a meeting point – a tree, the barrier, the playground – and walk there together once."
    ),
    question: l4(
      "Beim Zelt brennt es und dein Lieblingskuscheltier liegt drin. Was machst du?",
      "La tente brûle et ta peluche préférée est dedans. Que fais-tu ?",
      "La tenda brucia e il tuo peluche preferito è dentro. Cosa fai?",
      "The tent is on fire and your favourite cuddly toy is inside. What do you do?"
    ),
    answers: [
      l4(
        "Weggehen und laut rufen",
        "M'éloigner et crier fort",
        "Allontanarmi e gridare forte",
        "Get away and shout loudly"
      ),
      l4(
        "Schnell hineingreifen und es holen",
        "Vite tendre le bras et la prendre",
        "Allungare la mano e prenderlo",
        "Quickly reach in and grab it"
      ),
      l4(
        "Warten, bis Erwachsene kommen",
        "Attendre que des adultes arrivent",
        "Aspettare che arrivino gli adulti",
        "Wait until adults come"
      ),
    ],
    correct: 0,
    explain: l4(
      "Ein Zelt brennt in unter einer Minute ab. Ein Kuscheltier kann man ersetzen – und Warten am Zelt ist genauso gefährlich wie Hineingreifen.",
      "Une tente brûle en moins d'une minute. Une peluche se remplace – et attendre près de la tente est aussi dangereux que d'y entrer.",
      "Una tenda brucia in meno di un minuto. Un peluche si sostituisce – e aspettare vicino alla tenda è pericoloso quanto entrarci.",
      "A tent burns down in under a minute. A cuddly toy can be replaced – and waiting by the tent is as dangerous as reaching in."
    ),
  },
];

/** Übungen, die ein Kind dieses Alters verstehen kann. */
export function drillsForAge(age: number): DrillScenario[] {
  return DRILL_SCENARIOS.filter(scenario => age >= scenario.minAge);
}

/**
 * Ist die Übung wieder fällig? Nie geübt zählt als fällig – und nach
 * einem halben Jahr auch, denn Kinder wachsen und der Platz ist ein
 * anderer.
 */
export function drillDue(
  lastPracticedMs: number | null,
  nowMs: number
): boolean {
  if (lastPracticedMs == null) return true;
  return nowMs - lastPracticedMs > DRILL_DUE_DAYS * 24 * 60 * 60 * 1000;
}

/** Wie viele der passenden Übungen sind noch fällig? */
export function dueCount(
  scenarios: readonly DrillScenario[],
  lastById: Readonly<Record<string, number | undefined>>,
  nowMs: number
): number {
  return scenarios.filter(s => drillDue(lastById[s.id] ?? null, nowMs)).length;
}
