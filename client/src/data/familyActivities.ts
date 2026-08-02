/**
 * Familien-Modus: Offline-Schnitzeljagden und Natur-Quizze,
 * um Kinder zu beschäftigen, während das Zelt aufgebaut wird.
 *
 * Schnitzeljagden sind als Erlebnis aufgebaut: Jede Jagd erzählt eine
 * Geschichte und führt über Stationen mit Rätseln und Hinweisen zu einem
 * Lösungswort und einem Abschluss-Erlebnis (Schatz/Belohnung).
 *
 * Alle Texte liegen als L4 (de/fr/it/en) vor; eigene Jagden der Nutzer
 * bleiben einsprachige Strings – `pick()` verarbeitet beides. Lösungswörter
 * sind pro Sprache frei nachgedichtet, daher können sich auch die
 * Stations-Buchstaben (und deren Anzahl) je Sprache unterscheiden:
 * Ein leerer Buchstabe ("") bedeutet «in dieser Sprache kein Buchstabe».
 */
import { l4, type L4 } from "@shared/i18n";

export interface HuntStation {
  /** Titel der Station, z. B. «Station 1: Der geheime Briefkasten» */
  title: L4 | string;
  /** Erzähltext, der die Geschichte weiterführt */
  story: L4 | string;
  /** Die eigentliche Aufgabe oder das Rätsel an dieser Station */
  task: L4 | string;
  /** Optionaler Hinweis, falls die Kinder nicht weiterkommen */
  hint?: L4 | string;
  /** Buchstabe fürs Lösungswort ("" = in dieser Sprache keiner) */
  letter?: L4 | string;
}

export interface ScavengerHunt {
  id: string;
  title: L4 | string;
  ageHint: L4 | string;
  durationMinutes: number;
  /** Die Rahmengeschichte / Mission */
  intro: L4 | string;
  /** Was die Erwachsenen vorher wissen/vorbereiten sollten (1–2 Min.) */
  preparation?: L4 | string;
  stations: HuntStation[];
  /** Lösungswort, das sich aus den gesammelten Buchstaben ergibt */
  solutionWord?: L4 | string;
  /** Abschluss-Erlebnis: Was passiert, wenn alle Stationen geschafft sind */
  finale: L4 | string;
}

export interface QuizQuestion {
  question: L4 | string;
  options: (L4 | string)[];
  correctIndex: number;
  explanation: L4 | string;
}

export interface NatureQuiz {
  id: string;
  title: L4 | string;
  ageHint: L4 | string;
  questions: QuizQuestion[];
}

export const scavengerHunts: ScavengerHunt[] = [
  {
    id: "waldschatz",
    title: l4(
      "Der verlorene Waldschatz",
      "Le trésor perdu de la forêt",
      "Il tesoro perduto del bosco",
      "The Lost Forest Treasure"
    ),
    ageHint: l4(
      "ab ca. 4 Jahren (mit Begleitung)",
      "dès 4 ans env. (accompagné·e)",
      "da circa 4 anni (con accompagnamento)",
      "from about 4 years (with an adult)"
    ),
    durationMinutes: 25,
    intro: l4(
      "Vor langer Zeit hat das Eichhörnchen Nussli seinen Wintervorrat versteckt – und vergessen, wo! Nur wer die Waldgeister mit den richtigen Fundstücken besänftigt, bekommt Hinweise auf das Versteck. Hilfst du Nussli, seinen Schatz wiederzufinden?",
      "Il y a longtemps, l'écureuil Noisette a caché ses provisions d'hiver – et il a oublié où ! Seule la personne qui apaise les esprits de la forêt avec les bons trésors reçoit des indices sur la cachette. Aideras-tu Noisette à retrouver son trésor ?",
      "Tanto tempo fa lo scoiattolo Nocciolina ha nascosto le sue provviste per l'inverno – e ha dimenticato dove! Solo chi placa gli spiriti del bosco con i reperti giusti riceve indizi sul nascondiglio. Aiuti Nocciolina a ritrovare il suo tesoro?",
      "Long ago, Nutty the squirrel hid his winter supplies – and forgot where! Only those who soothe the forest spirits with the right finds will get clues to the hiding place. Will you help Nutty find his treasure again?"
    ),
    preparation: l4(
      "Vorbereitung für Erwachsene: Versteckt eine kleine Überraschung (Süssigkeit, Sticker oder ein «Schatzstein») in der Nähe des Zeltplatzes, z. B. unter einem markanten Baum. Am Ende führt das Lösungswort die Kinder dorthin.",
      "Préparation pour les adultes : cachez une petite surprise (bonbon, autocollant ou une « pierre au trésor ») près de l'emplacement, p. ex. sous un arbre bien reconnaissable. À la fin, le mot-code y conduit les enfants.",
      "Preparazione per gli adulti: nascondete una piccola sorpresa (dolcetto, adesivo o una «pietra del tesoro») vicino alla piazzola, ad es. sotto un albero ben riconoscibile. Alla fine la parola segreta guiderà i bambini fin lì.",
      "Preparation for adults: hide a small surprise (a sweet, a sticker or a 'treasure stone') near the pitch, e.g. under a distinctive tree. At the end, the secret word leads the children there."
    ),
    stations: [
      {
        title: l4(
          "Station 1: Das weiche Bett",
          "Station 1 : Le lit douillet",
          "Stazione 1: Il letto morbido",
          "Station 1: The Soft Bed"
        ),
        story: l4(
          "Nussli erinnert sich: «Mein Schatz lag auf etwas Weichem…»",
          "Noisette se souvient : « Mon trésor était posé sur quelque chose de doux… »",
          "Nocciolina ricorda: «Il mio tesoro era appoggiato su qualcosa di morbido…»",
          "Nutty remembers: 'My treasure lay on something soft…'"
        ),
        task: l4(
          "Finde etwas Weiches aus dem Wald (z. B. Moos) und lege es in deinen Sammelbecher.",
          "Trouve quelque chose de doux dans la forêt (p. ex. de la mousse) et mets-le dans ton gobelet de collecte.",
          "Trova qualcosa di morbido nel bosco (ad es. del muschio) e mettilo nel tuo bicchiere delle scoperte.",
          "Find something soft from the forest (e.g. moss) and put it in your collecting cup."
        ),
        hint: l4(
          "Schau an schattigen Stellen bei Baumstämmen und Steinen.",
          "Regarde dans les coins ombragés, près des troncs et des pierres.",
          "Cerca nei punti in ombra, vicino a tronchi e sassi.",
          "Look in shady spots near tree trunks and stones."
        ),
        letter: l4("B", "A", "A", "T"),
      },
      {
        title: l4(
          "Station 2: Die Zauberkugel",
          "Station 2 : La boule magique",
          "Stazione 2: La sfera magica",
          "Station 2: The Magic Ball"
        ),
        story: l4(
          "«Daneben lag eine runde Zauberkugel», flüstert Nussli.",
          "« À côté, il y avait une boule magique toute ronde », chuchote Noisette.",
          "«Accanto c'era una sfera magica tutta rotonda», sussurra Nocciolina.",
          "'Next to it lay a round magic ball,' whispers Nutty."
        ),
        task: l4(
          "Finde etwas Rundes – einen Kieselstein oder eine Kastanie.",
          "Trouve quelque chose de rond – un caillou ou une châtaigne.",
          "Trova qualcosa di rotondo – un sassolino o una castagna.",
          "Find something round – a pebble or a chestnut."
        ),
        hint: l4(
          "Am Wegrand oder Bachufer liegen oft runde Steine.",
          "Au bord du chemin ou du ruisseau, il y a souvent des pierres rondes.",
          "Sul bordo del sentiero o lungo il ruscello ci sono spesso sassi rotondi.",
          "Round stones often lie along paths and stream banks."
        ),
        letter: l4("A", "R", "L", "R"),
      },
      {
        title: l4(
          "Station 3: Das Riesenblatt",
          "Station 3 : La feuille géante",
          "Stazione 3: La foglia gigante",
          "Station 3: The Giant Leaf"
        ),
        story: l4(
          "«Ein Blatt, grösser als eine Kinderhand, hat den Schatz zugedeckt!»",
          "« Une feuille plus grande qu'une main d'enfant recouvrait le trésor ! »",
          "«Una foglia più grande di una mano di bambino copriva il tesoro!»",
          "'A leaf bigger than a child's hand covered the treasure!'"
        ),
        task: l4(
          "Finde ein Blatt, das grösser ist als deine Hand, und vergleiche.",
          "Trouve une feuille plus grande que ta main et compare.",
          "Trova una foglia più grande della tua mano e confrontala.",
          "Find a leaf that is bigger than your hand and compare."
        ),
        hint: l4(
          "Ahorn- und Platanenblätter sind besonders gross.",
          "Les feuilles d'érable et de platane sont particulièrement grandes.",
          "Le foglie di acero e di platano sono particolarmente grandi.",
          "Maple and plane-tree leaves are especially big."
        ),
        letter: l4("U", "B", "B", "E"),
      },
      {
        title: l4(
          "Station 4: Der Duft-Detektor",
          "Station 4 : Le détecteur d'odeurs",
          "Stazione 4: Il rilevatore di profumi",
          "Station 4: The Scent Detector"
        ),
        story: l4(
          "Waldgeister lieben gute Gerüche. Nur wer ihnen etwas Duftendes bringt, darf weiter.",
          "Les esprits de la forêt adorent les bonnes odeurs. Seule la personne qui leur apporte quelque chose de parfumé peut continuer.",
          "Gli spiriti del bosco amano i buoni profumi. Solo chi porta loro qualcosa di profumato può proseguire.",
          "Forest spirits love good smells. Only those who bring them something fragrant may go on."
        ),
        task: l4(
          "Finde etwas, das gut riecht (Tannennadeln, Harz, eine Blume) und lass alle daran schnuppern.",
          "Trouve quelque chose qui sent bon (aiguilles de sapin, résine, une fleur) et fais-le sentir à tout le monde.",
          "Trova qualcosa che profuma (aghi di abete, resina, un fiore) e fallo annusare a tutti.",
          "Find something that smells good (fir needles, resin, a flower) and let everyone have a sniff."
        ),
        hint: l4(
          "Zerreibe vorsichtig ein paar Nadeln zwischen den Fingern.",
          "Frotte doucement quelques aiguilles entre tes doigts.",
          "Strofina con delicatezza qualche ago tra le dita.",
          "Gently rub a few needles between your fingers."
        ),
        letter: l4("M", "R", "E", "E"),
      },
      {
        title: l4(
          "Station 5: Der Zauberstab",
          "Station 5 : La baguette magique",
          "Stazione 5: La bacchetta magica",
          "Station 5: The Magic Wand"
        ),
        story: l4(
          "«Mit einem Buchstaben-Zauberstab habe ich den Schatz verzaubert», sagt Nussli.",
          "« J'ai ensorcelé le trésor avec une baguette en forme de lettre », dit Noisette.",
          "«Ho stregato il tesoro con una bacchetta a forma di lettera», dice Nocciolina.",
          "'I enchanted the treasure with a letter-shaped magic wand,' says Nutty."
        ),
        task: l4(
          "Finde einen Stock, der wie ein Buchstabe aussieht. Welcher Buchstabe ist es?",
          "Trouve un bâton qui ressemble à une lettre. Quelle lettre est-ce ?",
          "Trova un bastoncino che assomiglia a una lettera. Che lettera è?",
          "Find a stick that looks like a letter. Which letter is it?"
        ),
        hint: l4(
          "Y, L, T und V sind am einfachsten zu finden.",
          "Les lettres Y, L, T et V sont les plus faciles à trouver.",
          "Y, L, T e V sono le più facili da trovare.",
          "Y, L, T and V are the easiest to find."
        ),
        letter: l4("", "E", "R", ""),
      },
      {
        title: l4(
          "Station 6: Die Schatzwächter-Feder",
          "Station 6 : La plume du gardien du trésor",
          "Stazione 6: La piuma del guardiano del tesoro",
          "Station 6: The Treasure Guardian's Feather"
        ),
        story: l4(
          "Ein Vogel bewacht den Schatz von oben. Sein Geschenk öffnet das letzte Tor.",
          "Un oiseau garde le trésor depuis le ciel. Son cadeau ouvre la dernière porte.",
          "Un uccello sorveglia il tesoro dall'alto. Il suo regalo apre l'ultima porta.",
          "A bird guards the treasure from above. Its gift opens the final gate."
        ),
        task: l4(
          "Finde eine Feder oder etwas anderes, das fliegen kann (z. B. einen Ahorn-Flügelsamen).",
          "Trouve une plume ou autre chose qui peut voler (p. ex. une samare d'érable).",
          "Trova una piuma o qualcos'altro che sa volare (ad es. una samara d'acero).",
          "Find a feather or something else that can fly (e.g. a winged maple seed)."
        ),
        hint: l4(
          "Flügelsamen drehen sich wie kleine Helikopter, wenn du sie wirfst.",
          "Les samares tournent comme de petits hélicoptères quand tu les lances.",
          "Le samare girano come piccoli elicotteri quando le lanci.",
          "Winged seeds spin like little helicopters when you throw them."
        ),
        letter: l4("", "", "O", ""),
      },
    ],
    solutionWord: l4("BAUM", "ARBRE", "ALBERO", "TREE"),
    finale: l4(
      "Setze die gesammelten Buchstaben zusammen – sie ergeben das Lösungswort «BAUM»! Lauft zum auffälligsten Baum beim Zeltplatz: Dort haben die Waldgeister Nusslis Schatz für euch versteckt. (Psst: Die Erwachsenen wissen, wo!)",
      "Assemble les lettres récoltées – elles forment le mot-code « ARBRE » ! Courez vers l'arbre le plus remarquable de l'emplacement : c'est là que les esprits de la forêt ont caché le trésor de Noisette. (Psst : les adultes savent où !)",
      "Metti insieme le lettere raccolte: formano la parola segreta «ALBERO»! Correte verso l'albero più appariscente della piazzola: è lì che gli spiriti del bosco hanno nascosto il tesoro di Nocciolina. (Psst: gli adulti sanno dove!)",
      "Put the collected letters together – they spell the secret word 'TREE'! Run to the most striking tree near your pitch: that's where the forest spirits hid Nutty's treasure. (Psst: the grown-ups know where!)"
    ),
  },
  {
    id: "geraeusche-safari",
    title: l4(
      "Geheimagent*in der Geräusche",
      "Espion·ne des sons",
      "Agente segreto dei suoni",
      "Secret Agent of Sounds"
    ),
    ageHint: l4(
      "ab ca. 5 Jahren",
      "dès 5 ans env.",
      "da circa 5 anni",
      "from about 5 years"
    ),
    durationMinutes: 20,
    intro: l4(
      "Du bist Geheimagent*in im Auftrag der Natur! Deine Mission: Belausche den Wald und knacke den Geheimcode der Geräusche. Für jede gelöste Horch-Mission bekommst du einen Codebuchstaben.",
      "Tu es espion·ne au service de la nature ! Ta mission : écoute la forêt et déchiffre le code secret des sons. Pour chaque mission d'écoute réussie, tu reçois une lettre du code.",
      "Sei un agente segreto al servizio della natura! La tua missione: origlia il bosco e decifra il codice segreto dei suoni. Per ogni missione d'ascolto riuscita ricevi una lettera del codice.",
      "You are a secret agent working for nature! Your mission: listen in on the forest and crack the secret code of sounds. For every listening mission you solve, you earn a code letter."
    ),
    preparation: l4(
      "Vorbereitung für Erwachsene: Die Kinder brauchen nur eine Sitzunterlage. Am Ende dürfen sie mit dem Lösungswort «OHR» einen Agenten-Titel und ein Abzeichen (z. B. einen aufgemalten Stern auf die Hand) abholen.",
      "Préparation pour les adultes : les enfants ont seulement besoin d'un coussin ou d'un tapis de sol. À la fin, avec le mot-code « SON », ils reçoivent un titre d'agent et un insigne (p. ex. une étoile dessinée sur la main).",
      "Preparazione per gli adulti: ai bambini serve solo qualcosa su cui sedersi. Alla fine, con la parola segreta «SUONO», ritirano un titolo da agente e un distintivo (ad es. una stellina disegnata sulla mano).",
      "Preparation for adults: the children only need something to sit on. At the end, the secret word 'EAR' lets them collect an agent title and a badge (e.g. a star drawn on their hand)."
    ),
    stations: [
      {
        title: l4(
          "Mission 1: Der singende Spion",
          "Mission 1 : L'espion chanteur",
          "Missione 1: La spia canterina",
          "Mission 1: The Singing Spy"
        ),
        story: l4(
          "Ein gefiederter Spion sendet Signale durch den Wald.",
          "Un espion à plumes envoie des signaux à travers la forêt.",
          "Una spia piumata invia segnali attraverso il bosco.",
          "A feathered spy is sending signals through the forest."
        ),
        task: l4(
          "Höre einen Vogel singen und versuche, seine Melodie nachzupfeifen oder nachzusummen.",
          "Écoute un oiseau chanter et essaie de siffloter ou de fredonner sa mélodie.",
          "Ascolta un uccello che canta e prova a rifare la sua melodia fischiettando o canticchiando.",
          "Listen to a bird singing and try to whistle or hum its tune."
        ),
        hint: l4(
          "Frühmorgens und abends singen die meisten Vögel.",
          "C'est tôt le matin et le soir que la plupart des oiseaux chantent.",
          "La maggior parte degli uccelli canta al mattino presto e alla sera.",
          "Most birds sing early in the morning and in the evening."
        ),
        letter: l4("O", "S", "S", "E"),
      },
      {
        title: l4(
          "Mission 2: Die Flüster-Bäume",
          "Mission 2 : Les arbres qui chuchotent",
          "Missione 2: Gli alberi che sussurrano",
          "Mission 2: The Whispering Trees"
        ),
        story: l4(
          "Die Bäume tauschen geheime Nachrichten aus, wenn der Wind sie anstösst.",
          "Les arbres échangent des messages secrets quand le vent les pousse.",
          "Gli alberi si scambiano messaggi segreti quando il vento li scuote.",
          "The trees swap secret messages when the wind nudges them."
        ),
        task: l4(
          "Schliess die Augen und höre den Wind in den Blättern. Klingt er eher wie Rauschen, Flüstern oder Knistern?",
          "Ferme les yeux et écoute le vent dans les feuilles. On dirait plutôt un bruissement, un chuchotement ou un crépitement ?",
          "Chiudi gli occhi e ascolta il vento tra le foglie. Assomiglia più a un fruscio, a un sussurro o a un crepitio?",
          "Close your eyes and listen to the wind in the leaves. Does it sound more like rushing, whispering or crackling?"
        ),
        letter: l4("H", "O", "U", "A"),
      },
      {
        title: l4(
          "Mission 3: Der Brumm-Funk",
          "Mission 3 : La radio qui bourdonne",
          "Missione 3: La radio ronzante",
          "Mission 3: The Buzzing Radio"
        ),
        story: l4(
          "Achtung, feindlicher Funkverkehr! Kleine Flieger senden Brummsignale.",
          "Attention, communications ennemies ! De petits aviateurs envoient des signaux bourdonnants.",
          "Attenzione, comunicazioni nemiche! Piccoli aviatori inviano segnali ronzanti.",
          "Warning, enemy radio traffic! Little flyers are sending buzzing signals."
        ),
        task: l4(
          "Höre ein Insekt summen oder brummen. Kannst du es auch sehen?",
          "Écoute un insecte bourdonner. Arrives-tu aussi à le voir ?",
          "Ascolta un insetto che ronza. Riesci anche a vederlo?",
          "Listen for an insect humming or buzzing. Can you spot it too?"
        ),
        hint: l4(
          "Bei Blumen und blühenden Sträuchern funkt es am meisten.",
          "C'est près des fleurs et des buissons en fleurs que ça bourdonne le plus.",
          "Vicino ai fiori e ai cespugli in fiore si ronza di più.",
          "There's the most buzzing near flowers and blossoming shrubs."
        ),
        letter: l4("R", "N", "O", "R"),
      },
      {
        title: l4(
          "Mission 4: Das leiseste Geräusch der Welt",
          "Mission 4 : Le bruit le plus discret du monde",
          "Missione 4: Il rumore più silenzioso del mondo",
          "Mission 4: The Quietest Sound in the World"
        ),
        story: l4(
          "Nur die besten Agent*innen hören, was sonst niemand hört.",
          "Seuls les meilleurs agents entendent ce que personne d'autre n'entend.",
          "Solo i migliori agenti sentono quello che nessun altro sente.",
          "Only the very best agents hear what no one else hears."
        ),
        task: l4(
          "Sei eine ganze Minute mucksmäuschenstill. Was ist das leiseste Geräusch, das du entdeckst?",
          "Reste sans bouger et sans bruit pendant une minute entière. Quel est le son le plus discret que tu découvres ?",
          "Resta in silenzio assoluto per un minuto intero. Qual è il suono più leggero che riesci a scoprire?",
          "Stay as quiet as a mouse for a whole minute. What is the quietest sound you can discover?"
        ),
        letter: l4("", "", "N", ""),
      },
      {
        title: l4(
          "Mission 5: Der Zahlen-Code",
          "Mission 5 : Le code chiffré",
          "Missione 5: Il codice numerico",
          "Mission 5: The Number Code"
        ),
        story: l4(
          "Zum Schluss musst du den Zahlencode knacken.",
          "Pour finir, tu dois craquer le code chiffré.",
          "Per finire devi decifrare il codice numerico.",
          "Finally, you must crack the number code."
        ),
        task: l4(
          "Zähle: Wie viele verschiedene Geräusche hörst du in einer Minute? Diese Zahl ist dein Geheimcode!",
          "Compte : combien de sons différents entends-tu en une minute ? Ce nombre est ton code secret !",
          "Conta: quanti suoni diversi senti in un minuto? Quel numero è il tuo codice segreto!",
          "Count: how many different sounds do you hear in one minute? That number is your secret code!"
        ),
        letter: l4("", "", "O", ""),
      },
    ],
    solutionWord: l4("OHR", "SON", "SUONO", "EAR"),
    finale: l4(
      "Deine Codebuchstaben ergeben «OHR» – das Erkennungszeichen der Geräusch-Agent*innen! Melde dich mit Lösungswort und Zahlencode bei der Agentenzentrale (den Erwachsenen) und erhalte feierlich deinen Titel: Meister-Lauscher*in des Waldes.",
      "Tes lettres de code forment « SON » – le signe de reconnaissance des agents des sons ! Présente-toi avec le mot-code et ton code chiffré à la centrale des agents (les adultes) et reçois solennellement ton titre : maître de l'écoute de la forêt.",
      "Le tue lettere formano «SUONO» – il segno di riconoscimento degli agenti dei suoni! Presentati con la parola segreta e il codice numerico alla centrale degli agenti (gli adulti) e ricevi solennemente il tuo titolo: maestro dell'ascolto del bosco.",
      "Your code letters spell 'EAR' – the secret sign of the sound agents! Report to agent headquarters (the grown-ups) with the code word and your number code, and be ceremonially awarded your title: Master Listener of the Forest."
    ),
  },
  {
    id: "zeltplatz-detektiv",
    title: l4(
      "Der Fall des verschwundenen Kompasses",
      "L'affaire de la boussole disparue",
      "Il caso della bussola scomparsa",
      "The Case of the Missing Compass"
    ),
    ageHint: l4(
      "ab ca. 6 Jahren",
      "dès 6 ans env.",
      "da circa 6 anni",
      "from about 6 years"
    ),
    durationMinutes: 35,
    intro: l4(
      "Alarm am Zeltplatz! Der magische Kompass der Campingfee ist verschwunden – ohne ihn verirren sich alle Wanderer. Als Detektiv*in folgst du den Spuren und sammelst Beweisbuchstaben. Das Lösungswort verrät, wo der Kompass versteckt ist.",
      "Alerte au camping ! La boussole magique de la fée du camping a disparu – sans elle, tous les randonneurs se perdent. En détective, tu suis les traces et tu récoltes des lettres-indices. Le mot-code révèle où la boussole est cachée.",
      "Allarme al campeggio! La bussola magica della fata del campeggio è scomparsa – senza di lei tutti gli escursionisti si perdono. Da detective segui le tracce e raccogli lettere-prova. La parola segreta rivela dove è nascosta la bussola.",
      "Alarm at the campsite! The camping fairy's magic compass has vanished – without it, every hiker gets lost. As a detective you follow the trail and collect evidence letters. The secret word reveals where the compass is hidden."
    ),
    preparation: l4(
      "Vorbereitung für Erwachsene: Versteckt einen «Kompass» (echter Kompass, Bild oder gebastelter Papierkompass) beim Ort des Lösungsworts «ZELT» – z. B. unter dem Vorzelt oder bei den Heringen.",
      "Préparation pour les adultes : cachez une « boussole » (vraie boussole, image ou boussole en papier bricolée) à l'endroit du mot-code « TENTE » – p. ex. sous l'auvent ou près des sardines.",
      "Preparazione per gli adulti: nascondete una «bussola» (bussola vera, immagine o bussola di carta fatta a mano) nel luogo della parola segreta «TENDA» – ad es. sotto il telone d'ingresso o vicino ai picchetti.",
      "Preparation for adults: hide a 'compass' (a real compass, a picture or a crafted paper compass) at the place named by the secret word 'TENT' – e.g. under the awning or by the tent pegs."
    ),
    stations: [
      {
        title: l4(
          "Spur 1: Die Zelt-Zählung",
          "Indice 1 : Le comptage des tentes",
          "Traccia 1: Il conteggio delle tende",
          "Clue 1: The Tent Count"
        ),
        story: l4(
          "Die Campingfee sah den Dieb zwischen den Zelten verschwinden.",
          "La fée du camping a vu le voleur disparaître entre les tentes.",
          "La fata del campeggio ha visto il ladro sparire tra le tende.",
          "The camping fairy saw the thief disappear between the tents."
        ),
        task: l4(
          "Zähle alle Zelte, die du von hier aus sehen kannst. Merk dir die Zahl – ein echter Detektiv vergisst nichts!",
          "Compte toutes les tentes que tu vois d'ici. Retiens le nombre – un vrai détective n'oublie rien !",
          "Conta tutte le tende che vedi da qui. Ricorda il numero – un vero detective non dimentica nulla!",
          "Count all the tents you can see from here. Remember the number – a real detective forgets nothing!"
        ),
        letter: l4("Z", "T", "T", "T"),
      },
      {
        title: l4(
          "Spur 2: Die Wind-Fährte",
          "Indice 2 : La piste du vent",
          "Traccia 2: La pista del vento",
          "Clue 2: The Wind Trail"
        ),
        story: l4(
          "Der Dieb floh mit dem Wind. Aber woher weht er?",
          "Le voleur s'est enfui avec le vent. Mais d'où souffle-t-il ?",
          "Il ladro è fuggito con il vento. Ma da dove soffia?",
          "The thief fled with the wind. But where is it blowing from?"
        ),
        task: l4(
          "Mach deinen Finger nass und halte ihn hoch: Die kalte Seite zeigt, woher der Wind kommt. In welche Himmelsrichtung ist der Dieb geflohen?",
          "Mouille ton doigt et lève-le : le côté froid montre d'où vient le vent. Dans quelle direction le voleur s'est-il enfui ?",
          "Bagna un dito e tienilo in alto: il lato freddo mostra da dove arriva il vento. In quale direzione è fuggito il ladro?",
          "Wet your finger and hold it up: the cold side shows where the wind comes from. In which compass direction did the thief escape?"
        ),
        hint: l4(
          "Die Seite, die zuerst kühl wird, zeigt zur Windrichtung.",
          "Le côté qui devient frais en premier indique la direction du vent.",
          "Il lato che si raffredda per primo indica la direzione del vento.",
          "The side that turns cool first points into the wind."
        ),
        letter: l4("E", "E", "E", "E"),
      },
      {
        title: l4(
          "Spur 3: Das Blätter-Beweisstück",
          "Indice 3 : La feuille à conviction",
          "Traccia 3: La foglia indiziata",
          "Clue 3: The Leaf Evidence"
        ),
        story: l4(
          "Am Fluchtweg liegen drei verdächtige Blätter.",
          "Trois feuilles suspectes traînent sur le chemin de fuite.",
          "Sulla via di fuga ci sono tre foglie sospette.",
          "Three suspicious leaves lie along the escape route."
        ),
        task: l4(
          "Suche drei verschiedene Blätter und lege sie der Grösse nach. Das mittlere ist das Beweisstück – von welchem Baum stammt es?",
          "Cherche trois feuilles différentes et classe-les par taille. Celle du milieu est la pièce à conviction – de quel arbre vient-elle ?",
          "Cerca tre foglie diverse e mettile in ordine di grandezza. Quella di mezzo è la prova – da quale albero viene?",
          "Find three different leaves and sort them by size. The middle one is the evidence – which tree does it come from?"
        ),
        hint: l4(
          "Vergleiche mit dem Natur-Entdecker in dieser App!",
          "Compare avec l'Explorateur nature de cette appli !",
          "Confrontala con l'Esploratore della natura di questa app!",
          "Compare it with the Nature Explorer in this app!"
        ),
        letter: l4("L", "N", "N", "N"),
      },
      {
        title: l4(
          "Spur 4: Der Verhör-Zeuge",
          "Indice 4 : Le témoin à interroger",
          "Traccia 4: Il testimone da interrogare",
          "Clue 4: The Witness Interview"
        ),
        story: l4(
          "Ein kleines Tier hat alles beobachtet. Du musst es finden und geduldig verhören.",
          "Un petit animal a tout observé. Tu dois le trouver et l'interroger patiemment.",
          "Un animaletto ha osservato tutto. Devi trovarlo e interrogarlo con pazienza.",
          "A small animal saw everything. You must find it and question it patiently."
        ),
        task: l4(
          "Entdecke ein Tier (eine Ameise zählt auch!) und beobachte es eine Minute lang. Was hat es «gesehen»? Denk dir aus, was es dir erzählen würde.",
          "Découvre un animal (une fourmi compte aussi !) et observe-le pendant une minute. Qu'a-t-il « vu » ? Imagine ce qu'il te raconterait.",
          "Scopri un animale (vale anche una formica!) e osservalo per un minuto. Che cosa ha «visto»? Inventa quello che ti racconterebbe.",
          "Spot an animal (an ant counts too!) and watch it for one minute. What did it 'see'? Make up what it would tell you."
        ),
        letter: l4("T", "T", "D", "T"),
      },
      {
        title: l4(
          "Spur 5: Die Karten-Skizze",
          "Indice 5 : Le croquis des lieux",
          "Traccia 5: Lo schizzo della mappa",
          "Clue 5: The Map Sketch"
        ),
        story: l4(
          "Jede*r gute Detektiv*in zeichnet den Tatort.",
          "Tout bon détective dessine la scène du crime.",
          "Ogni buon detective disegna la scena del crimine.",
          "Every good detective draws the scene of the crime."
        ),
        task: l4(
          "Male mit einem Stock eine Karte des Zeltplatzes in die Erde: Wo stehen die Zelte, wo ist der Eingang, wo war der Dieb?",
          "Avec un bâton, dessine dans la terre une carte du camping : où sont les tentes, où est l'entrée, où était le voleur ?",
          "Con un bastoncino disegna per terra una mappa del campeggio: dove sono le tende, dov'è l'entrata, dov'era il ladro?",
          "Use a stick to draw a map of the campsite in the dirt: where are the tents, where is the entrance, where was the thief?"
        ),
        letter: l4("", "E", "A", ""),
      },
      {
        title: l4(
          "Spur 6: Der Glücksstein-Test",
          "Indice 6 : Le test de la pierre porte-bonheur",
          "Traccia 6: La prova della pietra portafortuna",
          "Clue 6: The Lucky Stone Test"
        ),
        story: l4(
          "Der Dieb hat einen magischen Stein verloren. Wer ihn findet, kann den Kompass zurückzaubern.",
          "Le voleur a perdu une pierre magique. Qui la trouve peut faire revenir la boussole par magie.",
          "Il ladro ha perso una pietra magica. Chi la trova può far tornare la bussola con un incantesimo.",
          "The thief lost a magic stone. Whoever finds it can magic the compass back."
        ),
        task: l4(
          "Finde einen Stein, der genau in deine Hosentasche passt – dein Detektiv-Glücksstein!",
          "Trouve une pierre qui rentre pile dans ta poche – ta pierre porte-bonheur de détective !",
          "Trova un sasso che entra perfettamente nella tua tasca – la tua pietra portafortuna da detective!",
          "Find a stone that fits exactly into your trouser pocket – your detective lucky stone!"
        ),
      },
    ],
    solutionWord: l4("ZELT", "TENTE", "TENDA", "TENT"),
    finale: l4(
      "Die Beweisbuchstaben ergeben «ZELT»! Der Kompass muss beim Zelt versteckt sein. Such rund ums Zelt – hast du ihn gefunden, ist der Fall gelöst und die Campingfee ernennt dich zum Ober-Detektiv oder zur Ober-Detektivin des Zeltplatzes!",
      "Les lettres-indices forment « TENTE » ! La boussole doit être cachée près de la tente. Cherche tout autour – si tu la trouves, l'affaire est résolue et la fée du camping te nomme détective en chef du camping !",
      "Le lettere-prova formano «TENDA»! La bussola dev'essere nascosta vicino alla tenda. Cerca tutt'intorno – se la trovi, il caso è risolto e la fata del campeggio ti nomina capo-detective del campeggio!",
      "The evidence letters spell 'TENT'! The compass must be hidden by the tent. Search all around it – once you find it, the case is solved and the camping fairy appoints you Chief Detective of the campsite!"
    ),
  },
  {
    id: "farben-jagd",
    title: l4(
      "Die Regenbogen-Rettung",
      "Le sauvetage de l'arc-en-ciel",
      "Il salvataggio dell'arcobaleno",
      "The Rainbow Rescue"
    ),
    ageHint: l4(
      "ab ca. 3 Jahren (mit Begleitung)",
      "dès 3 ans env. (accompagné·e)",
      "da circa 3 anni (con accompagnamento)",
      "from about 3 years (with an adult)"
    ),
    durationMinutes: 20,
    intro: l4(
      "Oje! Ein Sturm hat den Regenbogen zerbrochen und alle Farben sind auf den Zeltplatz gefallen. Nur du kannst sie wieder einsammeln und den Regenbogen reparieren. Für jede gerettete Farbe darfst du ein Feld auf deinem Regenbogen ausmalen (oder einen Gegenstand aufs Regenbogen-Tuch legen).",
      "Oh non ! Une tempête a brisé l'arc-en-ciel et toutes ses couleurs sont tombées sur le camping. Toi seul·e peux les ramasser et réparer l'arc-en-ciel. Pour chaque couleur sauvée, tu peux colorier une case de ton arc-en-ciel (ou poser un objet sur le tissu arc-en-ciel).",
      "Oh no! Una tempesta ha rotto l'arcobaleno e tutti i colori sono caduti sul campeggio. Solo tu puoi raccoglierli e riparare l'arcobaleno. Per ogni colore salvato puoi colorare una casella del tuo arcobaleno (o posare un oggetto sul telo arcobaleno).",
      "Oh no! A storm has broken the rainbow and all its colours have fallen onto the campsite. Only you can gather them up and repair the rainbow. For every rescued colour you may colour in one field of your rainbow (or place an object on the rainbow cloth)."
    ),
    preparation: l4(
      "Vorbereitung für Erwachsene: Legt ein Tuch oder eine Matte als «Regenbogen-Sammelplatz» bereit. Dort ordnen die Kinder ihre Fundstücke als Farbbogen an.",
      "Préparation pour les adultes : préparez un tissu ou un tapis comme « place de collecte de l'arc-en-ciel ». Les enfants y disposent leurs trouvailles en arc de couleurs.",
      "Preparazione per gli adulti: preparate un telo o un tappetino come «punto di raccolta dell'arcobaleno». Lì i bambini dispongono i loro reperti a forma di arco colorato.",
      "Preparation for adults: lay out a cloth or mat as the 'rainbow collecting spot'. The children arrange their finds there as an arc of colours."
    ),
    stations: [
      {
        title: l4(
          "Farbe 1: Grün wie der Frosch",
          "Couleur 1 : Vert comme la grenouille",
          "Colore 1: Verde come la rana",
          "Colour 1: Green like the Frog"
        ),
        story: l4(
          "Die grüne Farbe ist ins Gras gehüpft!",
          "La couleur verte a sauté dans l'herbe !",
          "Il colore verde è saltato nell'erba!",
          "The green colour hopped into the grass!"
        ),
        task: l4(
          "Finde etwas Grünes und lege es an den Anfang deines Regenbogens.",
          "Trouve quelque chose de vert et pose-le au début de ton arc-en-ciel.",
          "Trova qualcosa di verde e mettilo all'inizio del tuo arcobaleno.",
          "Find something green and place it at the start of your rainbow."
        ),
      },
      {
        title: l4(
          "Farbe 2: Braun wie der Bär",
          "Couleur 2 : Brun comme l'ours",
          "Colore 2: Marrone come l'orso",
          "Colour 2: Brown like the Bear"
        ),
        story: l4(
          "Das Braun hat sich bei den Bäumen versteckt.",
          "Le brun s'est caché près des arbres.",
          "Il marrone si è nascosto vicino agli alberi.",
          "Brown hid itself among the trees."
        ),
        task: l4(
          "Finde etwas Braunes – Rinde, Erde oder einen Zapfen.",
          "Trouve quelque chose de brun – de l'écorce, de la terre ou une pomme de pin.",
          "Trova qualcosa di marrone – corteccia, terra o una pigna.",
          "Find something brown – bark, soil or a pine cone."
        ),
      },
      {
        title: l4(
          "Farbe 3: Gelb wie die Sonne",
          "Couleur 3 : Jaune comme le soleil",
          "Colore 3: Giallo come il sole",
          "Colour 3: Yellow like the Sun"
        ),
        story: l4(
          "Das Gelb ist zur Sonne geflogen und heruntergefallen.",
          "Le jaune s'est envolé vers le soleil et il est retombé.",
          "Il giallo è volato verso il sole ed è ricaduto giù.",
          "Yellow flew up to the sun and tumbled back down."
        ),
        task: l4(
          "Finde etwas Gelbes – eine Blume oder ein herbstliches Blatt.",
          "Trouve quelque chose de jaune – une fleur ou une feuille d'automne.",
          "Trova qualcosa di giallo – un fiore o una foglia autunnale.",
          "Find something yellow – a flower or an autumn leaf."
        ),
        hint: l4(
          "Löwenzahn wächst fast überall!",
          "Le pissenlit pousse presque partout !",
          "Il dente di leone cresce quasi ovunque!",
          "Dandelions grow almost everywhere!"
        ),
      },
      {
        title: l4(
          "Farbe 4: Rot wie das Feuer",
          "Couleur 4 : Rouge comme le feu",
          "Colore 4: Rosso come il fuoco",
          "Colour 4: Red like the Fire"
        ),
        story: l4(
          "Das Rot glüht irgendwo zwischen Beeren und Blättern.",
          "Le rouge rougeoie quelque part entre les baies et les feuilles.",
          "Il rosso arde da qualche parte tra bacche e foglie.",
          "Red is glowing somewhere among berries and leaves."
        ),
        task: l4(
          "Finde etwas Rotes oder Oranges. Achtung: Beeren nur anschauen, nicht essen!",
          "Trouve quelque chose de rouge ou d'orange. Attention : on regarde les baies, on ne les mange pas !",
          "Trova qualcosa di rosso o arancione. Attenzione: le bacche si guardano soltanto, non si mangiano!",
          "Find something red or orange. Careful: only look at berries, never eat them!"
        ),
      },
      {
        title: l4(
          "Farbe 5: Weiss wie die Wolke",
          "Couleur 5 : Blanc comme le nuage",
          "Colore 5: Bianco come la nuvola",
          "Colour 5: White like the Cloud"
        ),
        story: l4(
          "Das Weiss ist von einer Wolke getropft.",
          "Le blanc a coulé d'un nuage.",
          "Il bianco è gocciolato da una nuvola.",
          "White dripped down from a cloud."
        ),
        task: l4(
          "Finde etwas Weisses – einen hellen Stein, ein Gänseblümchen oder eine Feder.",
          "Trouve quelque chose de blanc – une pierre claire, une pâquerette ou une plume.",
          "Trova qualcosa di bianco – un sasso chiaro, una margheritina o una piuma.",
          "Find something white – a light stone, a daisy or a feather."
        ),
      },
      {
        title: l4(
          "Farbe 6: Blau wie der Himmel",
          "Couleur 6 : Bleu comme le ciel",
          "Colore 6: Blu come il cielo",
          "Colour 6: Blue like the Sky"
        ),
        story: l4(
          "Das Blau ist am schwersten zu retten – es versteckt sich fast immer oben.",
          "Le bleu est le plus difficile à sauver – il se cache presque toujours en haut.",
          "Il blu è il più difficile da salvare – si nasconde quasi sempre in alto.",
          "Blue is the hardest to rescue – it almost always hides up high."
        ),
        task: l4(
          "Finde etwas Blaues. Wenn du nichts findest: Zeig in den Himmel – der zählt auch!",
          "Trouve quelque chose de bleu. Si tu ne trouves rien : montre le ciel du doigt – ça compte aussi !",
          "Trova qualcosa di blu. Se non trovi niente: indica il cielo – vale anche quello!",
          "Find something blue. If you can't find anything: point at the sky – that counts too!"
        ),
      },
      {
        title: l4(
          "Zauber-Finale: Die Doppelfarbe",
          "Finale magique : La double couleur",
          "Finale magico: Il doppio colore",
          "Magic Finale: The Double Colour"
        ),
        story: l4(
          "Zum Schluss braucht der Regenbogen noch einen Zauberglanz.",
          "Pour finir, l'arc-en-ciel a besoin d'un éclat magique.",
          "Per finire, l'arcobaleno ha bisogno di una scintilla magica.",
          "To finish, the rainbow needs a magic sparkle."
        ),
        task: l4(
          "Finde etwas, das zwei Farben gleichzeitig hat, und lege es in die Mitte.",
          "Trouve quelque chose qui a deux couleurs à la fois et pose-le au milieu.",
          "Trova qualcosa che ha due colori insieme e mettilo al centro.",
          "Find something that has two colours at once and place it in the middle."
        ),
      },
    ],
    finale: l4(
      "Geschafft! Lege alle Fundstücke als Bogen auf den Sammelplatz – dein selbst geretteter Regenbogen! Mach ein Erinnerungsfoto und gib jeder Farbe einen lustigen Namen (z. B. «Froschgrün» oder «Bärenbraun»).",
      "Bravo ! Dispose toutes tes trouvailles en arc sur la place de collecte – ton arc-en-ciel sauvé par tes soins ! Prends une photo souvenir et donne à chaque couleur un nom rigolo (p. ex. « vert grenouille » ou « brun ours »).",
      "Ce l'hai fatta! Disponi tutti i reperti ad arco sul punto di raccolta – il tuo arcobaleno salvato da te! Scatta una foto ricordo e dai a ogni colore un nome buffo (ad es. «verde rana» o «marrone orso»).",
      "You did it! Arrange all your finds in an arc on the collecting spot – your very own rescued rainbow! Take a souvenir photo and give every colour a funny name (e.g. 'frog green' or 'bear brown')."
    ),
  },
  {
    id: "wasser-expedition",
    title: l4(
      "Expedition Wassertropfen",
      "Expédition Goutte d'eau",
      "Spedizione Goccia d'acqua",
      "Expedition Water Drop"
    ),
    ageHint: l4(
      "ab ca. 5 Jahren",
      "dès 5 ans env.",
      "da circa 5 anni",
      "from about 5 years"
    ),
    durationMinutes: 30,
    intro: l4(
      "Du bist Forscher*in auf einer wichtigen Expedition: Der kleine Wassertropfen «Plitsch» ist aus seiner Wolke gefallen und muss zurück zum Wasser! Begleite ihn über alle Stationen und sammle Forscherbuchstaben.",
      "Tu pars en expédition scientifique très importante : la petite goutte d'eau « Plouf » est tombée de son nuage et doit retourner à l'eau ! Accompagne-la à travers toutes les étapes et récolte des lettres d'exploration.",
      "Sei in missione scientifica molto importante: la piccola goccia d'acqua «Plic» è caduta dalla sua nuvola e deve tornare all'acqua! Accompagnala attraverso tutte le tappe e raccogli le lettere da esploratore.",
      "You are a researcher on an important expedition: the little water drop 'Splish' has fallen out of its cloud and must get back to the water! Guide it through all the stages and collect explorer letters."
    ),
    preparation: l4(
      "Vorbereitung für Erwachsene: Funktioniert am besten in der Nähe eines Bachs, Sees oder nach Regen – zur Not reicht eine Wasserflasche als «Ziel-Gewässer». Belohnung: Ein «Forscher-Diplom» (Handschlag + feierliche Ernennung).",
      "Préparation pour les adultes : fonctionne le mieux près d'un ruisseau, d'un lac ou après la pluie – au besoin, une bouteille d'eau fait office de « plan d'eau d'arrivée ». Récompense : un « diplôme d'exploration » (poignée de main + nomination solennelle).",
      "Preparazione per gli adulti: funziona meglio vicino a un ruscello, a un lago o dopo la pioggia – in mancanza basta una bottiglia d'acqua come «specchio d'acqua di arrivo». Ricompensa: un «diploma da esploratore» (stretta di mano + nomina solenne).",
      "Preparation for adults: works best near a stream, a lake or after rain – if need be, a water bottle serves as the 'destination water'. Reward: an 'explorer diploma' (handshake + ceremonial appointment)."
    ),
    stations: [
      {
        title: l4(
          "Etappe 1: Die Tau-Suche",
          "Étape 1 : La chasse à la rosée",
          "Tappa 1: La caccia alla rugiada",
          "Stage 1: The Dew Hunt"
        ),
        story: l4(
          "Plitsch sucht seine Geschwister – winzige Tropfen, die überall glitzern.",
          "Plouf cherche ses frères et sœurs – de minuscules gouttes qui scintillent partout.",
          "Plic cerca i suoi fratellini – goccioline minuscole che luccicano ovunque.",
          "Splish is looking for its siblings – tiny drops glittering everywhere."
        ),
        task: l4(
          "Finde Wasser in der Natur: einen Tautropfen, eine Pfütze, feuchtes Moos oder einen Bach.",
          "Trouve de l'eau dans la nature : une goutte de rosée, une flaque, de la mousse humide ou un ruisseau.",
          "Trova dell'acqua nella natura: una goccia di rugiada, una pozzanghera, del muschio umido o un ruscello.",
          "Find water in nature: a dewdrop, a puddle, damp moss or a stream."
        ),
        hint: l4(
          "Früh am Morgen glitzert Tau auf Gräsern und Spinnennetzen.",
          "Tôt le matin, la rosée scintille sur les herbes et les toiles d'araignée.",
          "Al mattino presto la rugiada luccica su erba e ragnatele.",
          "Early in the morning, dew glitters on grass and spiderwebs."
        ),
        letter: l4("S", "L", "L", "L"),
      },
      {
        title: l4(
          "Etappe 2: Das Durstige Grün",
          "Étape 2 : La verdure assoiffée",
          "Tappa 2: Il verde assetato",
          "Stage 2: The Thirsty Greens"
        ),
        story: l4(
          "Unterwegs trifft Plitsch Pflanzen, die ihn trinken wollen!",
          "En chemin, Plouf rencontre des plantes qui veulent le boire !",
          "Per strada Plic incontra piante che vogliono berlo!",
          "On the way, Splish meets plants that want to drink it!"
        ),
        task: l4(
          "Finde eine Pflanze, die besonders saftig-grün aussieht, und eine, die vertrocknet ist. Was ist der Unterschied?",
          "Trouve une plante bien verte et juteuse et une autre toute desséchée. Quelle est la différence ?",
          "Trova una pianta bella verde e succosa e una tutta secca. Qual è la differenza?",
          "Find one plant that looks lush and green and one that has dried out. What's the difference?"
        ),
        letter: l4("E", "A", "A", "A"),
      },
      {
        title: l4(
          "Etappe 3: Die Tier-Tränke",
          "Étape 3 : L'abreuvoir des animaux",
          "Tappa 3: L'abbeveratoio degli animali",
          "Stage 3: The Animal Watering Hole"
        ),
        story: l4(
          "Auch Tiere brauchen Plitschs Familie zum Leben.",
          "Les animaux aussi ont besoin de la famille de Plouf pour vivre.",
          "Anche gli animali hanno bisogno della famiglia di Plic per vivere.",
          "Animals need Splish's family to live, too."
        ),
        task: l4(
          "Finde einen Ort, an dem Tiere trinken könnten (Pfütze, Bachrand, Blatt mit Tropfen). Siehst du Spuren?",
          "Trouve un endroit où des animaux pourraient boire (flaque, bord de ruisseau, feuille avec des gouttes). Vois-tu des traces ?",
          "Trova un posto dove gli animali potrebbero bere (pozzanghera, riva del ruscello, foglia con gocce). Vedi delle tracce?",
          "Find a place where animals could drink (a puddle, a stream bank, a leaf with drops). Can you see any tracks?"
        ),
        letter: l4("E", "C", "G", "K"),
      },
      {
        title: l4(
          "Etappe 4: Der Regen-Tanz",
          "Étape 4 : La danse de la pluie",
          "Tappa 4: La danza della pioggia",
          "Stage 4: The Rain Dance"
        ),
        story: l4(
          "Plitsch erinnert sich, wie er als Regen gefallen ist.",
          "Plouf se souvient d'être tombé en pluie.",
          "Plic si ricorda di quando è caduto come pioggia.",
          "Splish remembers falling as rain."
        ),
        task: l4(
          "Erfinde einen Regen-Tanz: Trommle erst leise mit den Fingern (Nieselregen), dann stampfe wild (Gewitter), dann werde ganz still (Sonne kommt).",
          "Invente une danse de la pluie : tambourine d'abord doucement avec les doigts (bruine), puis tape des pieds (orage), puis fais silence (le soleil revient).",
          "Inventa una danza della pioggia: prima tamburella piano con le dita (pioggerella), poi pesta forte i piedi (temporale), poi resta in silenzio (torna il sole).",
          "Invent a rain dance: first drum softly with your fingers (drizzle), then stomp wildly (thunderstorm), then go completely quiet (the sun comes out)."
        ),
        letter: l4("", "", "O", "E"),
      },
      {
        title: l4(
          "Etappe 5: Die Heimreise",
          "Étape 5 : Le retour à la maison",
          "Tappa 5: Il viaggio di ritorno",
          "Stage 5: The Journey Home"
        ),
        story: l4(
          "Jetzt weiss Plitsch, wo er hingehört!",
          "Maintenant, Plouf sait où est sa place !",
          "Adesso Plic sa dove deve andare!",
          "Now Splish knows where it belongs!"
        ),
        task: l4(
          "Bring einen Becher Wasser vorsichtig zum nächsten Gewässer (oder giesse eine durstige Pflanze) und lass Plitsch mit einem lauten «Platsch!» nach Hause.",
          "Porte précautionneusement un gobelet d'eau jusqu'au plan d'eau le plus proche (ou arrose une plante assoiffée) et laisse Plouf rentrer chez lui avec un grand « plouf ! ».",
          "Porta con attenzione un bicchiere d'acqua fino allo specchio d'acqua più vicino (o innaffia una pianta assetata) e lascia che Plic torni a casa con un bel «plic!».",
          "Carefully carry a cup of water to the nearest stream or pond (or water a thirsty plant) and let Splish splash home with a loud 'splish!'."
        ),
      },
    ],
    solutionWord: l4("SEE", "LAC", "LAGO", "LAKE"),
    finale: l4(
      "Deine Forscherbuchstaben ergeben «SEE» – Plitschs Zuhause! Die Expedition ist geglückt. Lass dich von der Expeditionsleitung (den Erwachsenen) feierlich zum Wasserforscher oder zur Wasserforscherin ernennen!",
      "Tes lettres d'exploration forment « LAC » – la maison de Plouf ! L'expédition est réussie. Fais-toi nommer solennellement explorateur ou exploratrice de l'eau par la direction de l'expédition (les adultes) !",
      "Le tue lettere formano «LAGO» – la casa di Plic! La spedizione è riuscita. Fatti nominare solennemente esploratore o esploratrice dell'acqua dalla direzione della spedizione (gli adulti)!",
      "Your explorer letters spell 'LAKE' – Splish's home! The expedition is a success. Have the expedition leaders (the grown-ups) ceremonially appoint you a water researcher!"
    ),
  },
  {
    id: "nacht-mutprobe",
    title: l4(
      "Die Nachtwächter-Prüfung",
      "L'épreuve du veilleur de nuit",
      "La prova del guardiano notturno",
      "The Night Watch Trial"
    ),
    ageHint: l4(
      "ab ca. 7 Jahren (in der Dämmerung, mit Begleitung)",
      "dès 7 ans env. (au crépuscule, accompagné·e)",
      "da circa 7 anni (al crepuscolo, con accompagnamento)",
      "from about 7 years (at dusk, with an adult)"
    ),
    durationMinutes: 25,
    intro: l4(
      "Wenn es dunkel wird, braucht der Zeltplatz mutige Nachtwächter*innen! Bestehe die fünf Prüfungen der Dämmerung und verdiene dir das Amt. Nimm eine Taschenlampe mit – aber benutze sie nur, wenn es eine Prüfung erlaubt.",
      "Quand la nuit tombe, le camping a besoin de veilleuses et veilleurs de nuit courageux ! Réussis les cinq épreuves du crépuscule et gagne ta charge. Prends une lampe de poche – mais ne l'utilise que si une épreuve le permet.",
      "Quando arriva il buio, il campeggio ha bisogno di guardiani notturni coraggiosi! Supera le cinque prove del crepuscolo e conquista l'incarico. Porta una torcia – ma usala solo quando una prova lo permette.",
      "When darkness falls, the campsite needs brave night watchers! Pass the five trials of dusk and earn the post. Bring a torch – but only use it when a trial allows it."
    ),
    preparation: l4(
      "Vorbereitung für Erwachsene: In der Dämmerung begleiten, Taschenlampe pro Kind. Als Abschluss-Belohnung eine «Nachtwächter-Urkunde» oder das Recht, das Lagerfeuer/die Lampe am Abend feierlich zu «bewachen».",
      "Préparation pour les adultes : accompagner au crépuscule, une lampe de poche par enfant. En récompense finale, un « diplôme de veilleur de nuit » ou le droit de « garder » solennellement le feu de camp/la lampe le soir.",
      "Preparazione per gli adulti: accompagnare al crepuscolo, una torcia per bambino. Come ricompensa finale un «attestato da guardiano notturno» o il diritto di «sorvegliare» solennemente il fuoco/la lampada la sera.",
      "Preparation for adults: accompany the children at dusk, one torch per child. As the final reward, a 'night watch certificate' or the right to ceremonially 'guard' the campfire/lantern that evening."
    ),
    stations: [
      {
        title: l4(
          "Prüfung 1: Die Eulen-Augen",
          "Épreuve 1 : Les yeux de hibou",
          "Prova 1: Gli occhi da gufo",
          "Trial 1: The Owl Eyes"
        ),
        story: l4(
          "Nachtwächter*innen sehen im Dunkeln – wie die Eulen.",
          "Les veilleurs de nuit voient dans le noir – comme les hiboux.",
          "I guardiani notturni vedono al buio – come i gufi.",
          "Night watchers see in the dark – like owls."
        ),
        task: l4(
          "Lass die Taschenlampe aus und warte drei Minuten. Merkst du, wie deine Augen immer mehr erkennen? Zähle, wie viele Dinge du jetzt sehen kannst.",
          "Laisse la lampe éteinte et attends trois minutes. Tu remarques comme tes yeux distinguent de plus en plus de choses ? Compte combien d'objets tu reconnais maintenant.",
          "Lascia spenta la torcia e aspetta tre minuti. Ti accorgi che i tuoi occhi riconoscono sempre più cose? Conta quante cose riesci a vedere adesso.",
          "Keep the torch off and wait three minutes. Do you notice how your eyes make out more and more? Count how many things you can see now."
        ),
        hint: l4(
          "Nicht in helle Lichter schauen – das macht die Eulen-Augen kaputt.",
          "Ne regarde pas les lumières vives – ça abîme les yeux de hibou.",
          "Non guardare luci forti – rovinano gli occhi da gufo.",
          "Don't look at bright lights – that spoils your owl eyes."
        ),
        letter: l4("M", "C", "N", "B"),
      },
      {
        title: l4(
          "Prüfung 2: Die Fledermaus-Ohren",
          "Épreuve 2 : Les oreilles de chauve-souris",
          "Prova 2: Le orecchie da pipistrello",
          "Trial 2: The Bat Ears"
        ),
        story: l4(
          "Nachts hört man mehr als am Tag.",
          "La nuit, on entend plus que le jour.",
          "Di notte si sente più che di giorno.",
          "At night you hear more than by day."
        ),
        task: l4(
          "Schliess die Augen und zähle drei Geräusche, die es nur am Abend gibt (Grillen, Rascheln, ferne Stimmen …).",
          "Ferme les yeux et compte trois sons qu'on n'entend que le soir (grillons, bruissements, voix lointaines…).",
          "Chiudi gli occhi e conta tre suoni che ci sono solo di sera (grilli, fruscii, voci lontane…).",
          "Close your eyes and count three sounds that only exist in the evening (crickets, rustling, distant voices…)."
        ),
        letter: l4("U", "R", "O", "R"),
      },
      {
        title: l4(
          "Prüfung 3: Der Sternen-Blick",
          "Épreuve 3 : Le regard vers les étoiles",
          "Prova 3: Lo sguardo alle stelle",
          "Trial 3: The Star Gaze"
        ),
        story: l4(
          "Nachtwächter*innen kennen den Himmel.",
          "Les veilleurs de nuit connaissent le ciel.",
          "I guardiani notturni conoscono il cielo.",
          "Night watchers know the sky."
        ),
        task: l4(
          "Finde den hellsten Stern am Himmel. Wenn du den Grossen Wagen entdeckst, bist du ein Naturtalent!",
          "Trouve l'étoile la plus brillante du ciel. Si tu repères la Grande Casserole, tu es un talent né !",
          "Trova la stella più luminosa del cielo. Se scopri il Grande Carro sei un talento naturale!",
          "Find the brightest star in the sky. If you spot the Plough (Big Dipper), you're a natural!"
        ),
        hint: l4(
          "Der Sternen-Teil im Natur-Entdecker dieser App hilft dir.",
          "La partie étoiles de l'Explorateur nature de cette appli t'aide.",
          "Ti aiuta la sezione stelle dell'Esploratore della natura di questa app.",
          "The stars section of the Nature Explorer in this app will help you."
        ),
        letter: l4("T", "A", "T", "A"),
      },
      {
        title: l4(
          "Prüfung 4: Der Lichter-Morse-Code",
          "Épreuve 4 : Le code morse lumineux",
          "Prova 4: Il codice Morse luminoso",
          "Trial 4: The Torch Morse Code"
        ),
        story: l4(
          "Wächter*innen senden geheime Lichtsignale.",
          "Les veilleurs envoient des signaux lumineux secrets.",
          "I guardiani inviano segnali luminosi segreti.",
          "Watchers send secret light signals."
        ),
        task: l4(
          "Jetzt darfst du die Taschenlampe benutzen: Sende dreimal kurz, dreimal lang, dreimal kurz – das ist SOS! Kann jemand dein Signal beantworten?",
          "Maintenant tu peux utiliser la lampe de poche : envoie trois signaux courts, trois longs, trois courts – c'est SOS ! Quelqu'un peut-il répondre à ton signal ?",
          "Adesso puoi usare la torcia: manda tre segnali corti, tre lunghi, tre corti – è un SOS! Qualcuno riesce a rispondere al tuo segnale?",
          "Now you may use the torch: flash three short, three long, three short – that's SOS! Can anyone answer your signal?"
        ),
        letter: l4("", "N", "T", "V"),
      },
      {
        title: l4(
          "Prüfung 5: Der Runden-Gang",
          "Épreuve 5 : La ronde de nuit",
          "Prova 5: Il giro di ronda",
          "Trial 5: The Night Round"
        ),
        story: l4(
          "Die letzte Prüfung: eine echte Wächter-Runde.",
          "La dernière épreuve : une vraie ronde de veilleur.",
          "L'ultima prova: una vera ronda da guardiano.",
          "The final trial: a real watchman's round."
        ),
        task: l4(
          "Geh mit deiner Begleitung einmal ruhig ums Zelt und prüfe wie ein Profi: Sind alle Leinen gespannt? Liegt nichts draussen, das nass werden könnte?",
          "Fais calmement le tour de la tente avec ton accompagnateur ou accompagnatrice et vérifie en pro : toutes les cordes sont-elles tendues ? Rien ne traîne dehors qui pourrait être mouillé ?",
          "Fai con calma il giro della tenda con chi ti accompagna e controlla da professionista: tutti i tiranti sono ben tesi? Non c'è niente fuori che potrebbe bagnarsi?",
          "Walk calmly around the tent with your adult and check like a pro: are all the guy lines taut? Is anything lying outside that could get wet?"
        ),
        letter: l4("", "", "E", "E"),
      },
    ],
    solutionWord: l4("MUT", "CRAN", "NOTTE", "BRAVE"),
    finale: l4(
      "Deine Prüfungsbuchstaben ergeben «MUT» – genau das, was du bewiesen hast! Du wirst feierlich zum Nachtwächter oder zur Nachtwächterin des Zeltplatzes ernannt und darfst heute das Abendlicht bewachen.",
      "Les lettres de tes épreuves forment « CRAN » – exactement ce que tu viens de prouver ! Tu es solennellement nommé·e veilleur ou veilleuse de nuit du camping et tu peux garder la lumière du soir aujourd'hui.",
      "Le lettere delle tue prove formano «NOTTE» – che ormai non ti fa più paura! Vieni nominato o nominata solennemente guardiano o guardiana notturna del campeggio e stasera puoi sorvegliare la luce della sera.",
      "Your trial letters spell 'BRAVE' – exactly what you have shown! You are ceremonially appointed night watcher of the campsite and may guard the evening light tonight."
    ),
  },
];

export const natureQuizzes: NatureQuiz[] = [
  {
    id: "wald-quiz",
    title: l4(
      "Grosses Wald-Quiz",
      "Grand quiz de la forêt",
      "Grande quiz del bosco",
      "Big Forest Quiz"
    ),
    ageHint: l4(
      "ab ca. 6 Jahren",
      "dès 6 ans env.",
      "da circa 6 anni",
      "from about 6 years"
    ),
    questions: [
      {
        question: l4(
          "Welcher Baum sticht, wenn du seine Nadeln anfasst?",
          "Quel arbre pique quand tu touches ses aiguilles ?",
          "Quale albero punge quando tocchi i suoi aghi?",
          "Which tree prickles when you touch its needles?"
        ),
        options: [
          l4("Die Tanne", "Le sapin blanc", "L'abete bianco", "The silver fir"),
          l4("Die Fichte", "L'épicéa", "L'abete rosso", "The spruce"),
          l4("Die Lärche", "Le mélèze", "Il larice", "The larch"),
        ],
        correctIndex: 1,
        explanation: l4(
          "Merkspruch: «Die Fichte sticht, die Tanne nicht!» Tannennadeln sind weich und vorne eingekerbt.",
          "Astuce : l'épicéa pique, le sapin non ! Les aiguilles du sapin blanc sont souples et échancrées au bout.",
          "Trucco per ricordare: l'abete rosso punge, l'abete bianco no! Gli aghi dell'abete bianco sono morbidi e con la punta smussata.",
          "Memory trick: the spruce sticks, the fir does not! Silver fir needles are soft with a notched tip."
        ),
      },
      {
        question: l4(
          "Was verliert die Lärche im Winter?",
          "Que perd le mélèze en hiver ?",
          "Che cosa perde il larice in inverno?",
          "What does the larch lose in winter?"
        ),
        options: [
          l4("Ihre Rinde", "Son écorce", "La corteccia", "Its bark"),
          l4("Ihre Zapfen", "Ses cônes", "Le pigne", "Its cones"),
          l4("Ihre Nadeln", "Ses aiguilles", "Gli aghi", "Its needles"),
        ],
        correctIndex: 2,
        explanation: l4(
          "Die Lärche ist der einzige heimische Nadelbaum, der im Herbst alle Nadeln abwirft – vorher werden sie goldgelb.",
          "Le mélèze est le seul conifère indigène qui perd toutes ses aiguilles en automne – elles deviennent d'abord jaune doré.",
          "Il larice è l'unica conifera nostrana che in autunno perde tutti gli aghi – prima diventano giallo oro.",
          "The larch is the only native conifer that sheds all its needles in autumn – they turn golden yellow first."
        ),
      },
      {
        question: l4(
          "Welches Tier vergisst seine Nussverstecke und pflanzt so neue Bäume?",
          "Quel animal oublie ses cachettes de noix et plante ainsi de nouveaux arbres ?",
          "Quale animale dimentica i suoi nascondigli di noci e così pianta nuovi alberi?",
          "Which animal forgets its nut hiding places and so plants new trees?"
        ),
        options: [
          l4("Das Eichhörnchen", "L'écureuil", "Lo scoiattolo", "The squirrel"),
          l4("Der Fuchs", "Le renard", "La volpe", "The fox"),
          l4("Der Dachs", "Le blaireau", "Il tasso", "The badger"),
        ],
        correctIndex: 0,
        explanation: l4(
          "Eichhörnchen verstecken hunderte Nüsse und finden viele nie wieder – daraus wachsen neue Bäume.",
          "Les écureuils cachent des centaines de noix et n'en retrouvent jamais beaucoup – de nouveaux arbres y poussent.",
          "Gli scoiattoli nascondono centinaia di noci e molte non le ritrovano mai – da lì crescono nuovi alberi.",
          "Squirrels hide hundreds of nuts and never find many of them again – new trees grow from them."
        ),
      },
      {
        question: l4(
          "Woran erkennst du eine Fuchsspur?",
          "À quoi reconnais-tu une trace de renard ?",
          "Da che cosa riconosci una traccia di volpe?",
          "How do you recognise a fox track?"
        ),
        options: [
          l4(
            "Sie ist riesig wie ein Teller",
            "Elle est immense comme une assiette",
            "È enorme come un piatto",
            "It is huge like a plate"
          ),
          l4(
            "Die Abdrücke liegen auf einer geraden Linie",
            "Les empreintes sont alignées sur une ligne droite",
            "Le impronte sono allineate su una linea retta",
            "The prints lie along one straight line"
          ),
          l4(
            "Sie hat sechs Zehen",
            "Elle a six doigts",
            "Ha sei dita",
            "It has six toes"
          ),
        ],
        correctIndex: 1,
        explanation: l4(
          "Füchse «schnüren»: Ihre Pfotenabdrücke liegen wie Perlen auf einer Schnur hintereinander.",
          "Le renard « trotte en ligne » : ses empreintes se suivent comme des perles sur un fil.",
          "La volpe cammina «in fila»: le sue impronte si susseguono come perle su un filo.",
          "Foxes 'string' their steps: the paw prints follow one another like beads on a string."
        ),
      },
      {
        question: l4(
          "Welche Baumrinde brennt sogar, wenn sie nass ist?",
          "Quelle écorce brûle même mouillée ?",
          "Quale corteccia brucia perfino da bagnata?",
          "Which tree bark burns even when it is wet?"
        ),
        options: [
          l4(
            "Buchenrinde",
            "L'écorce de hêtre",
            "La corteccia di faggio",
            "Beech bark"
          ),
          l4(
            "Eichenrinde",
            "L'écorce de chêne",
            "La corteccia di quercia",
            "Oak bark"
          ),
          l4(
            "Birkenrinde",
            "L'écorce de bouleau",
            "La corteccia di betulla",
            "Birch bark"
          ),
        ],
        correctIndex: 2,
        explanation: l4(
          "Birkenrinde enthält ätherische Öle und ist der beste natürliche Feuerstarter des Waldes.",
          "L'écorce de bouleau contient des huiles essentielles : c'est le meilleur allume-feu naturel de la forêt.",
          "La corteccia di betulla contiene oli essenziali ed è il miglior accendifuoco naturale del bosco.",
          "Birch bark contains essential oils and is the forest's best natural fire starter."
        ),
      },
    ],
  },
  {
    id: "sternen-quiz",
    title: l4(
      "Sternengucker-Quiz",
      "Quiz des observateurs d'étoiles",
      "Quiz degli osservatori di stelle",
      "Stargazer Quiz"
    ),
    ageHint: l4(
      "ab ca. 7 Jahren",
      "dès 7 ans env.",
      "da circa 7 anni",
      "from about 7 years"
    ),
    questions: [
      {
        question: l4(
          "Welcher Stern zeigt dir immer, wo Norden ist?",
          "Quelle étoile te montre toujours où est le nord ?",
          "Quale stella ti mostra sempre dov'è il nord?",
          "Which star always shows you where north is?"
        ),
        options: [
          l4(
            "Der Polarstern",
            "L'étoile Polaire",
            "La Stella Polare",
            "The Pole Star"
          ),
          l4("Die Wega", "Véga", "Vega", "Vega"),
          l4("Der Mond", "La Lune", "La Luna", "The Moon"),
        ],
        correctIndex: 0,
        explanation: l4(
          "Der Polarstern steht fast genau über dem Nordpol und bewegt sich scheinbar nie.",
          "L'étoile Polaire se trouve presque exactement au-dessus du pôle Nord et semble ne jamais bouger.",
          "La Stella Polare sta quasi esattamente sopra il Polo Nord e sembra non muoversi mai.",
          "The Pole Star sits almost exactly above the North Pole and hardly seems to move at all."
        ),
      },
      {
        question: l4(
          "Wie sieht das Sternbild Kassiopeia aus?",
          "À quoi ressemble la constellation de Cassiopée ?",
          "Che aspetto ha la costellazione di Cassiopea?",
          "What does the constellation Cassiopeia look like?"
        ),
        options: [
          l4("Wie ein Kreis", "À un cercle", "A un cerchio", "Like a circle"),
          l4(
            "Wie ein grosses W",
            "À un grand W",
            "A una grande W",
            "Like a big W"
          ),
          l4(
            "Wie ein Dreieck",
            "À un triangle",
            "A un triangolo",
            "Like a triangle"
          ),
        ],
        correctIndex: 1,
        explanation: l4(
          "Fünf helle Sterne bilden ein W – manchmal steht es auf dem Kopf und sieht aus wie ein M.",
          "Cinq étoiles brillantes forment un W – parfois il est à l'envers et ressemble à un M.",
          "Cinque stelle luminose formano una W – a volte è capovolta e sembra una M.",
          "Five bright stars form a W – sometimes it is upside down and looks like an M."
        ),
      },
      {
        question: l4(
          "Wie findest du mit dem Grossen Wagen den Polarstern?",
          "Comment trouves-tu l'étoile Polaire avec la Grande Casserole ?",
          "Come trovi la Stella Polare con il Grande Carro?",
          "How do you find the Pole Star using the Plough?"
        ),
        options: [
          l4(
            "Er steht direkt daneben",
            "Elle est juste à côté",
            "È proprio lì accanto",
            "It sits right next to it"
          ),
          l4(
            "Hintere Kastenkante 5× verlängern",
            "Prolonger 5× le bord arrière de la casserole",
            "Prolungando 5 volte il lato posteriore del carro",
            "Extend the back edge of the 'pan' 5 times"
          ),
          l4(
            "Der Deichsel folgen",
            "Suivre le manche",
            "Seguendo il timone",
            "Follow the handle"
          ),
        ],
        correctIndex: 1,
        explanation: l4(
          "Verlängere die hintere Kante des Wagenkastens fünfmal nach oben – dort funkelt der Polarstern.",
          "Prolonge cinq fois vers le haut le bord arrière de la casserole – c'est là que scintille l'étoile Polaire.",
          "Prolunga cinque volte verso l'alto il lato posteriore del carro – lì brilla la Stella Polare.",
          "Extend the back edge of the Plough's 'pan' five times upwards – there twinkles the Pole Star."
        ),
      },
      {
        question: l4(
          "Was siehst du bei dunklem Himmel mitten im Sommerdreieck?",
          "Que vois-tu par ciel bien noir au milieu du Triangle d'été ?",
          "Che cosa vedi con un cielo ben scuro in mezzo al Triangolo estivo?",
          "What can you see in a dark sky right in the middle of the Summer Triangle?"
        ),
        options: [
          l4(
            "Die Milchstrasse",
            "La Voie lactée",
            "La Via Lattea",
            "The Milky Way"
          ),
          l4("Einen Planeten", "Une planète", "Un pianeta", "A planet"),
          l4("Ein Flugzeug", "Un avion", "Un aereo", "An aeroplane"),
        ],
        correctIndex: 0,
        explanation: l4(
          "Das schimmernde Band der Milchstrasse zieht mitten durch das Sommerdreieck – Milliarden ferner Sterne!",
          "Le ruban scintillant de la Voie lactée traverse le Triangle d'été – des milliards d'étoiles lointaines !",
          "La scia luminosa della Via Lattea attraversa il Triangolo estivo – miliardi di stelle lontanissime!",
          "The shimmering band of the Milky Way runs straight through the Summer Triangle – billions of distant stars!"
        ),
      },
      {
        question: l4(
          "Woraus besteht der Gürtel des Orion?",
          "De quoi est fait le baudrier d'Orion ?",
          "Da che cosa è formata la cintura di Orione?",
          "What makes up Orion's Belt?"
        ),
        options: [
          l4(
            "Aus drei Sternen in einer Reihe",
            "De trois étoiles alignées",
            "Da tre stelle in fila",
            "Three stars in a row"
          ),
          l4(
            "Aus einem hellen Nebel",
            "D'une nébuleuse brillante",
            "Da una nebulosa luminosa",
            "A bright nebula"
          ),
          l4(
            "Aus sieben Sternen im Kreis",
            "De sept étoiles en cercle",
            "Da sette stelle in cerchio",
            "Seven stars in a circle"
          ),
        ],
        correctIndex: 0,
        explanation: l4(
          "Drei helle Sterne in einer geraden Reihe bilden den berühmten Oriongürtel – im Winter gut sichtbar.",
          "Trois étoiles brillantes bien alignées forment le célèbre baudrier d'Orion – bien visible en hiver.",
          "Tre stelle luminose in fila dritta formano la famosa cintura di Orione – ben visibile in inverno.",
          "Three bright stars in a straight row form the famous Orion's Belt – easy to see in winter."
        ),
      },
    ],
  },
  {
    id: "tier-quiz",
    title: l4(
      "Tierspuren-Quiz",
      "Quiz des traces d'animaux",
      "Quiz delle tracce degli animali",
      "Animal Tracks Quiz"
    ),
    ageHint: l4(
      "ab ca. 5 Jahren",
      "dès 5 ans env.",
      "da circa 5 anni",
      "from about 5 years"
    ),
    questions: [
      {
        question: l4(
          "Welches Tier hinterlässt kleine, herzförmige Spuren?",
          "Quel animal laisse de petites empreintes en forme de cœur ?",
          "Quale animale lascia piccole impronte a forma di cuore?",
          "Which animal leaves small, heart-shaped tracks?"
        ),
        options: [
          l4("Das Wildschwein", "Le sanglier", "Il cinghiale", "The wild boar"),
          l4("Das Reh", "Le chevreuil", "Il capriolo", "The roe deer"),
          l4("Der Dachs", "Le blaireau", "Il tasso", "The badger"),
        ],
        correctIndex: 1,
        explanation: l4(
          "Rehspuren sind nur 4–5 cm klein und sehen aus wie zwei Kommas, die ein Herz bilden.",
          "Les empreintes de chevreuil ne mesurent que 4–5 cm et ressemblent à deux virgules qui forment un cœur.",
          "Le impronte di capriolo misurano solo 4–5 cm e sembrano due virgole che formano un cuore.",
          "Roe deer tracks are only 4–5 cm long and look like two commas forming a heart."
        ),
      },
      {
        question: l4(
          "Was verrät dir, dass ein Wildschwein in der Nähe war?",
          "Qu'est-ce qui trahit le passage d'un sanglier ?",
          "Che cosa ti dice che un cinghiale è passato di lì?",
          "What tells you a wild boar was nearby?"
        ),
        options: [
          l4(
            "Umgewühlte Erde",
            "De la terre retournée",
            "Terra smossa",
            "Churned-up soil"
          ),
          l4(
            "Abgenagte Zapfen",
            "Des cônes rongés",
            "Pigne rosicchiate",
            "Gnawed cones"
          ),
          l4(
            "Federn am Boden",
            "Des plumes au sol",
            "Piume per terra",
            "Feathers on the ground"
          ),
        ],
        correctIndex: 0,
        explanation: l4(
          "Wildschweine wühlen mit ihrer Schnauze den Boden um, wenn sie nach Würmern und Wurzeln suchen.",
          "Les sangliers retournent le sol avec leur groin pour chercher des vers et des racines.",
          "I cinghiali rivoltano il terreno con il grugno cercando vermi e radici.",
          "Wild boars plough up the ground with their snouts when searching for worms and roots."
        ),
      },
      {
        question: l4(
          "Welches Tier baut unterirdische Burgen mit vielen Etagen?",
          "Quel animal construit des terriers souterrains à plusieurs étages ?",
          "Quale animale costruisce tane sotterranee a più piani?",
          "Which animal builds underground burrows with many levels?"
        ),
        options: [
          l4("Der Fuchs", "Le renard", "La volpe", "The fox"),
          l4("Das Eichhörnchen", "L'écureuil", "Lo scoiattolo", "The squirrel"),
          l4("Der Dachs", "Le blaireau", "Il tasso", "The badger"),
        ],
        correctIndex: 2,
        explanation: l4(
          "Dachsburgen haben viele Gänge und Kammern – manche sind über 100 Jahre alt.",
          "Les terriers de blaireau comptent de nombreux tunnels et chambres – certains ont plus de 100 ans.",
          "Le tane dei tassi hanno molti cunicoli e camere – alcune hanno più di 100 anni.",
          "Badger setts have many tunnels and chambers – some are over 100 years old."
        ),
      },
      {
        question: l4(
          "Ein Zapfen sieht aus wie ein abgenagter Maiskolben. Wer war das?",
          "Un cône ressemble à un épi de maïs rongé. Qui a fait ça ?",
          "Una pigna sembra una pannocchia rosicchiata. Chi è stato?",
          "A cone looks like a nibbled corn cob. Who did that?"
        ),
        options: [
          l4("Ein Eichhörnchen", "Un écureuil", "Uno scoiattolo", "A squirrel"),
          l4("Ein Reh", "Un chevreuil", "Un capriolo", "A roe deer"),
          l4("Ein Vogel", "Un oiseau", "Un uccello", "A bird"),
        ],
        correctIndex: 0,
        explanation: l4(
          "Eichhörnchen nagen die Schuppen der Zapfen ab, um an die Samen zu kommen – übrig bleibt der «Maiskolben».",
          "L'écureuil ronge les écailles du cône pour atteindre les graines – il ne reste que « l'épi de maïs ».",
          "Lo scoiattolo rosicchia le squame della pigna per arrivare ai semi – resta solo la «pannocchia».",
          "Squirrels gnaw off the cone scales to reach the seeds – what's left looks like a corn cob."
        ),
      },
      {
        question: l4(
          "Welches Geräusch macht ein erschrockenes Reh?",
          "Quel bruit fait un chevreuil effrayé ?",
          "Che verso fa un capriolo spaventato?",
          "What sound does a startled roe deer make?"
        ),
        options: [
          l4("Es miaut", "Il miaule", "Miagola", "It miaows"),
          l4("Es bellt", "Il aboie", "Abbaia", "It barks"),
          l4("Es pfeift", "Il siffle", "Fischia", "It whistles"),
        ],
        correctIndex: 1,
        explanation: l4(
          "Rehe stossen einen rauen Beller aus – viele verwechseln ihn mit einem Hund!",
          "Le chevreuil pousse un aboiement rauque – beaucoup le confondent avec un chien !",
          "Il capriolo emette un abbaio rauco – molti lo scambiano per un cane!",
          "Roe deer give a rough bark – many people mistake it for a dog!"
        ),
      },
    ],
  },
  {
    id: "wetter-quiz",
    title: l4(
      "Wetterfrosch-Quiz",
      "Quiz de la grenouille météo",
      "Quiz del ranocchio meteo",
      "Weather Frog Quiz"
    ),
    ageHint: l4(
      "ab ca. 6 Jahren",
      "dès 6 ans env.",
      "da circa 6 anni",
      "from about 6 years"
    ),
    questions: [
      {
        question: l4(
          "Was solltest du beim Zelten tun, wenn ein Gewitter aufzieht?",
          "Que faire au camping quand un orage approche ?",
          "Che cosa devi fare in campeggio se si avvicina un temporale?",
          "What should you do while camping when a thunderstorm approaches?"
        ),
        options: [
          l4(
            "Unter den höchsten Baum stehen",
            "Se mettre sous l'arbre le plus haut",
            "Metterti sotto l'albero più alto",
            "Stand under the tallest tree"
          ),
          l4(
            "Ins Auto oder ein Gebäude gehen",
            "Aller dans la voiture ou un bâtiment",
            "Andare in auto o in un edificio",
            "Get into a car or a building"
          ),
          l4(
            "Im Zelt die Stangen festhalten",
            "Tenir les mâts dans la tente",
            "Tenere ferme le aste nella tenda",
            "Hold the tent poles steady"
          ),
        ],
        correctIndex: 1,
        explanation: l4(
          "Ein Auto oder Gebäude schützt am besten. Zelte und einzelne Bäume sind bei Blitzen gefährlich!",
          "Une voiture ou un bâtiment protège le mieux. Les tentes et les arbres isolés sont dangereux sous la foudre !",
          "Un'auto o un edificio proteggono meglio di tutto. Tende e alberi isolati sono pericolosi con i fulmini!",
          "A car or a building protects best. Tents and single trees are dangerous in lightning!"
        ),
      },
      {
        question: l4(
          "Wie erkennst du, dass bald ein Gewitter kommen könnte?",
          "Comment reconnais-tu qu'un orage pourrait bientôt arriver ?",
          "Da che cosa capisci che presto potrebbe arrivare un temporale?",
          "How can you tell a thunderstorm may be coming soon?"
        ),
        options: [
          l4(
            "Hohe Türme aus Blumenkohl-Wolken",
            "De hautes tours de nuages en chou-fleur",
            "Alte torri di nuvole a cavolfiore",
            "Tall towers of cauliflower clouds"
          ),
          l4(
            "Ganz dünne Schleierwolken",
            "Des voiles de nuages très fins",
            "Nuvole a velo sottilissime",
            "Very thin veil clouds"
          ),
          l4(
            "Ein knallblauer Himmel",
            "Un ciel bleu éclatant",
            "Un cielo blu intenso",
            "A bright blue sky"
          ),
        ],
        correctIndex: 0,
        explanation: l4(
          "Riesige, blumenkohlförmige Wolkentürme (Cumulonimbus) sind Gewitterwolken – Zeit, das Camp zu sichern!",
          "Les tours de nuages géantes en forme de chou-fleur (cumulonimbus) sont des nuages d'orage – il est temps de sécuriser le camp !",
          "Le enormi torri di nuvole a forma di cavolfiore (cumulonembi) sono nubi temporalesche – è ora di mettere al sicuro il campo!",
          "Huge cauliflower-shaped cloud towers (cumulonimbus) are storm clouds – time to secure the camp!"
        ),
      },
      {
        question: l4(
          "Wie weit ist ein Gewitter weg, wenn zwischen Blitz und Donner 9 Sekunden liegen?",
          "À quelle distance est un orage s'il s'écoule 9 secondes entre l'éclair et le tonnerre ?",
          "Quanto è lontano un temporale se tra lampo e tuono passano 9 secondi?",
          "How far away is a storm if 9 seconds pass between lightning and thunder?"
        ),
        options: [
          l4("9 Kilometer", "9 kilomètres", "9 chilometri", "9 kilometres"),
          l4(
            "etwa 3 Kilometer",
            "environ 3 kilomètres",
            "circa 3 chilometri",
            "about 3 kilometres"
          ),
          l4("90 Meter", "90 mètres", "90 metri", "90 metres"),
        ],
        correctIndex: 1,
        explanation: l4(
          "Sekunden zählen und durch 3 teilen ergibt ungefähr die Entfernung in Kilometern: 9 ÷ 3 = 3 km.",
          "Compte les secondes et divise par 3 pour obtenir environ la distance en kilomètres : 9 ÷ 3 = 3 km.",
          "Conta i secondi e dividi per 3: ottieni all'incirca la distanza in chilometri: 9 ÷ 3 = 3 km.",
          "Count the seconds and divide by 3 for the rough distance in kilometres: 9 ÷ 3 = 3 km."
        ),
      },
      {
        question: l4(
          "Was bedeutet Morgentau auf der Zeltplane meistens?",
          "Que signifie le plus souvent la rosée du matin sur la toile de tente ?",
          "Che cosa significa di solito la rugiada mattutina sul telo della tenda?",
          "What does morning dew on the tent usually mean?"
        ),
        options: [
          l4(
            "Es wird regnen",
            "Il va pleuvoir",
            "Pioverà",
            "It is going to rain"
          ),
          l4(
            "Ein schöner Tag kommt",
            "Une belle journée arrive",
            "Arriva una bella giornata",
            "A fine day is coming"
          ),
          l4(
            "Es gibt Nebel den ganzen Tag",
            "Il y aura du brouillard toute la journée",
            "Ci sarà nebbia tutto il giorno",
            "It will be foggy all day"
          ),
        ],
        correctIndex: 1,
        explanation: l4(
          "Tau entsteht in klaren, windstillen Nächten – die kündigen oft einen sonnigen Tag an.",
          "La rosée se forme par nuit claire et sans vent – ce qui annonce souvent une journée ensoleillée.",
          "La rugiada si forma nelle notti serene e senza vento – che spesso annunciano una giornata di sole.",
          "Dew forms on clear, windless nights – and those often herald a sunny day."
        ),
      },
      {
        question: l4(
          "Warum schwirren Schwalben bei schönem Wetter hoch oben?",
          "Pourquoi les hirondelles volent-elles très haut par beau temps ?",
          "Perché con il bel tempo le rondini volteggiano in alto?",
          "Why do swallows swoop high up in fine weather?"
        ),
        options: [
          l4(
            "Sie üben fürs Wegfliegen",
            "Elles s'entraînent pour la migration",
            "Si allenano per la migrazione",
            "They practise for migration"
          ),
          l4(
            "Ihre Beute, die Insekten, fliegt hoch",
            "Leurs proies, les insectes, volent haut",
            "Le loro prede, gli insetti, volano in alto",
            "Their prey, the insects, fly high"
          ),
          l4(
            "Sie haben Angst vor Katzen",
            "Elles ont peur des chats",
            "Hanno paura dei gatti",
            "They are afraid of cats"
          ),
        ],
        correctIndex: 1,
        explanation: l4(
          "Bei stabilem Hochdruckwetter steigen Insekten hoch hinauf – und die Schwalben folgen ihrem Futter.",
          "Par temps stable de haute pression, les insectes montent très haut – et les hirondelles suivent leur nourriture.",
          "Con l'alta pressione stabile gli insetti salgono in alto – e le rondini seguono il loro cibo.",
          "In stable high-pressure weather, insects rise high into the air – and the swallows follow their food."
        ),
      },
    ],
  },
  {
    id: "feuer-quiz",
    title: l4(
      "Lagerfeuer-Profi-Quiz",
      "Quiz des pros du feu de camp",
      "Quiz dei professionisti del falò",
      "Campfire Pro Quiz"
    ),
    ageHint: l4(
      "ab ca. 7 Jahren",
      "dès 7 ans env.",
      "da circa 7 anni",
      "from about 7 years"
    ),
    questions: [
      {
        question: l4(
          "Was brauchst du zum Feuermachen zuerst?",
          "De quoi as-tu besoin en premier pour faire du feu ?",
          "Che cosa ti serve per prima cosa per accendere il fuoco?",
          "What do you need first to start a fire?"
        ),
        options: [
          l4(
            "Dicke Holzscheite",
            "De grosses bûches",
            "Ceppi grossi",
            "Thick logs"
          ),
          l4(
            "Dünnes, trockenes Anzündmaterial",
            "Du petit bois d'allumage fin et sec",
            "Materiale d'accensione fine e asciutto",
            "Thin, dry kindling"
          ),
          l4(
            "Viel Papier und Benzin",
            "Beaucoup de papier et d'essence",
            "Tanta carta e benzina",
            "Lots of paper and petrol"
          ),
        ],
        correctIndex: 1,
        explanation: l4(
          "Erst kleines, trockenes Material (Birkenrinde, dünne Zweige), dann immer dickeres Holz – nie Benzin!",
          "D'abord du petit matériel sec (écorce de bouleau, brindilles fines), puis du bois de plus en plus gros – jamais d'essence !",
          "Prima materiale piccolo e asciutto (corteccia di betulla, rametti sottili), poi legna sempre più grossa – mai benzina!",
          "First small, dry material (birch bark, thin twigs), then thicker and thicker wood – never petrol!"
        ),
      },
      {
        question: l4(
          "Wo darfst du ein Lagerfeuer machen?",
          "Où as-tu le droit de faire un feu de camp ?",
          "Dove puoi accendere un falò?",
          "Where are you allowed to light a campfire?"
        ),
        options: [
          l4(
            "Überall im Wald",
            "Partout dans la forêt",
            "Ovunque nel bosco",
            "Anywhere in the forest"
          ),
          l4(
            "Nur an offiziellen Feuerstellen",
            "Seulement aux foyers officiels",
            "Solo nelle aree fuoco ufficiali",
            "Only at official fire pits"
          ),
          l4(
            "Direkt neben dem Zelt",
            "Juste à côté de la tente",
            "Proprio accanto alla tenda",
            "Right next to the tent"
          ),
        ],
        correctIndex: 1,
        explanation: l4(
          "Nur an erlaubten, eingerichteten Feuerstellen – und bei Waldbrandgefahr gar nicht.",
          "Seulement aux emplacements de feu autorisés et aménagés – et pas du tout en cas de danger d'incendie de forêt.",
          "Solo nei punti fuoco autorizzati e attrezzati – e in caso di pericolo d'incendio boschivo per niente.",
          "Only at permitted, prepared fire pits – and not at all when there is a forest fire risk."
        ),
      },
      {
        question: l4(
          "Wie löschst du das Feuer richtig, bevor du schlafen gehst?",
          "Comment éteins-tu correctement le feu avant d'aller dormir ?",
          "Come spegni il fuoco nel modo giusto prima di andare a dormire?",
          "How do you put the fire out properly before going to sleep?"
        ),
        options: [
          l4(
            "Einfach brennen lassen",
            "Le laisser brûler tout simplement",
            "Lo lasci semplicemente bruciare",
            "Just let it burn"
          ),
          l4(
            "Mit viel Wasser übergiessen und umrühren",
            "L'arroser abondamment et remuer",
            "Lo copri d'acqua e mescoli",
            "Pour on plenty of water and stir"
          ),
          l4(
            "Mit Blättern zudecken",
            "Le couvrir de feuilles",
            "Lo copri di foglie",
            "Cover it with leaves"
          ),
        ],
        correctIndex: 1,
        explanation: l4(
          "Wasser drüber, umrühren, nochmals Wasser – erst wenn nichts mehr zischt und alles kalt ist, ist es sicher.",
          "De l'eau dessus, remuer, encore de l'eau – ce n'est sûr que quand plus rien ne siffle et que tout est froid.",
          "Acqua sopra, mescolare, ancora acqua – è sicuro solo quando niente sfrigola più e tutto è freddo.",
          "Water on top, stir, more water – only when nothing hisses any more and everything is cold is it safe."
        ),
      },
      {
        question: l4(
          "Welcher Abstand zwischen Feuer und Zelt ist sicher?",
          "Quelle distance entre le feu et la tente est sûre ?",
          "Quale distanza tra fuoco e tenda è sicura?",
          "What distance between fire and tent is safe?"
        ),
        options: [
          l4(
            "1 grosser Schritt",
            "1 grand pas",
            "1 passo grande",
            "1 big step"
          ),
          l4(
            "mindestens 3–5 Meter",
            "au moins 3–5 mètres",
            "almeno 3–5 metri",
            "at least 3–5 metres"
          ),
          l4(
            "Das Feuer darf das Zelt berühren",
            "Le feu peut toucher la tente",
            "Il fuoco può toccare la tenda",
            "The fire may touch the tent"
          ),
        ],
        correctIndex: 1,
        explanation: l4(
          "Funken fliegen weit! Mindestens 3–5 Meter Abstand, und auf die Windrichtung achten.",
          "Les étincelles volent loin ! Au moins 3–5 mètres de distance, et attention à la direction du vent.",
          "Le scintille volano lontano! Almeno 3–5 metri di distanza, e occhio alla direzione del vento.",
          "Sparks fly far! Keep at least 3–5 metres away, and mind the wind direction."
        ),
      },
      {
        question: l4(
          "Was machst du, wenn deine Marshmallow-Rute brennt?",
          "Que fais-tu si ta branche à marshmallow prend feu ?",
          "Che cosa fai se il tuo bastoncino dei marshmallow prende fuoco?",
          "What do you do if your marshmallow stick catches fire?"
        ),
        options: [
          l4(
            "Wild herumfuchteln",
            "Gesticuler dans tous les sens",
            "Lo agiti all'impazzata",
            "Wave it around wildly"
          ),
          l4(
            "Ruhig ausblasen oder in den Sand tauchen",
            "Souffler calmement dessus ou la plonger dans le sable",
            "Lo spegni soffiando con calma o lo immergi nella sabbia",
            "Calmly blow it out or dip it in the sand"
          ),
          l4(
            "Wegwerfen, egal wohin",
            "La jeter n'importe où",
            "Lo butti via, non importa dove",
            "Throw it away anywhere"
          ),
        ],
        correctIndex: 1,
        explanation: l4(
          "Ruhig bleiben und ausblasen oder die Spitze auf den Boden drücken – nie mit brennenden Sachen rennen.",
          "Garde ton calme, souffle dessus ou appuie la pointe au sol – ne cours jamais avec un objet en feu.",
          "Mantieni la calma, soffia o premi la punta a terra – mai correre con qualcosa che brucia.",
          "Stay calm, blow it out or press the tip onto the ground – never run with anything burning."
        ),
      },
    ],
  },
];
