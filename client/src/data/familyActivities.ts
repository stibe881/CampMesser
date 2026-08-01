/**
 * Familien-Modus: Offline-Schnitzeljagden und Natur-Quizze,
 * um Kinder zu beschäftigen, während das Zelt aufgebaut wird.
 *
 * Schnitzeljagden sind als Erlebnis aufgebaut: Jede Jagd erzählt eine
 * Geschichte und führt über Stationen mit Rätseln und Hinweisen zu einem
 * Lösungswort und einem Abschluss-Erlebnis (Schatz/Belohnung).
 */
export interface HuntStation {
  /** Titel der Station, z. B. «Station 1: Der geheime Briefkasten» */
  title: string;
  /** Erzähltext, der die Geschichte weiterführt */
  story: string;
  /** Die eigentliche Aufgabe oder das Rätsel an dieser Station */
  task: string;
  /** Optionaler Hinweis, falls die Kinder nicht weiterkommen */
  hint?: string;
  /** Buchstabe, den die Kinder an dieser Station fürs Lösungswort sammeln */
  letter?: string;
}

export interface ScavengerHunt {
  id: string;
  title: string;
  ageHint: string;
  durationMinutes: number;
  /** Die Rahmengeschichte / Mission */
  intro: string;
  /** Was die Erwachsenen vorher wissen/vorbereiten sollten (1–2 Min.) */
  preparation?: string;
  stations: HuntStation[];
  /** Lösungswort, das sich aus den gesammelten Buchstaben ergibt */
  solutionWord?: string;
  /** Abschluss-Erlebnis: Was passiert, wenn alle Stationen geschafft sind */
  finale: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface NatureQuiz {
  id: string;
  title: string;
  ageHint: string;
  questions: QuizQuestion[];
}

export const scavengerHunts: ScavengerHunt[] = [
  {
    id: "waldschatz",
    title: "Der verlorene Waldschatz",
    ageHint: "ab ca. 4 Jahren (mit Begleitung)",
    durationMinutes: 25,
    intro:
      "Vor langer Zeit hat das Eichhörnchen Nussli seinen Wintervorrat versteckt – und vergessen, wo! Nur wer die Waldgeister mit den richtigen Fundstücken besänftigt, bekommt Hinweise auf das Versteck. Hilfst du Nussli, seinen Schatz wiederzufinden?",
    preparation:
      "Vorbereitung für Erwachsene: Versteckt eine kleine Überraschung (Süssigkeit, Sticker oder ein «Schatzstein») in der Nähe des Zeltplatzes, z. B. unter einem markanten Baum. Am Ende führt das Lösungswort die Kinder dorthin.",
    stations: [
      {
        title: "Station 1: Das weiche Bett",
        story: "Nussli erinnert sich: «Mein Schatz lag auf etwas Weichem…»",
        task: "Finde etwas Weiches aus dem Wald (z. B. Moos) und lege es in deinen Sammelbecher.",
        hint: "Schau an schattigen Stellen bei Baumstämmen und Steinen.",
        letter: "B",
      },
      {
        title: "Station 2: Die Zauberkugel",
        story: "«Daneben lag eine runde Zauberkugel», flüstert Nussli.",
        task: "Finde etwas Rundes – einen Kieselstein oder eine Kastanie.",
        hint: "Am Wegrand oder Bachufer liegen oft runde Steine.",
        letter: "A",
      },
      {
        title: "Station 3: Das Riesenblatt",
        story:
          "«Ein Blatt, grösser als eine Kinderhand, hat den Schatz zugedeckt!»",
        task: "Finde ein Blatt, das grösser ist als deine Hand, und vergleiche.",
        hint: "Ahorn- und Platanenblätter sind besonders gross.",
        letter: "U",
      },
      {
        title: "Station 4: Der Duft-Detektor",
        story:
          "Waldgeister lieben gute Gerüche. Nur wer ihnen etwas Duftendes bringt, darf weiter.",
        task: "Finde etwas, das gut riecht (Tannennadeln, Harz, eine Blume) und lass alle daran schnuppern.",
        hint: "Zerreibe vorsichtig ein paar Nadeln zwischen den Fingern.",
        letter: "M",
      },
      {
        title: "Station 5: Der Zauberstab",
        story:
          "«Mit einem Buchstaben-Zauberstab habe ich den Schatz verzaubert», sagt Nussli.",
        task: "Finde einen Stock, der wie ein Buchstabe aussieht. Welcher Buchstabe ist es?",
        hint: "Y, L, T und V sind am einfachsten zu finden.",
      },
      {
        title: "Station 6: Die Schatzwächter-Feder",
        story:
          "Ein Vogel bewacht den Schatz von oben. Sein Geschenk öffnet das letzte Tor.",
        task: "Finde eine Feder oder etwas anderes, das fliegen kann (z. B. einen Ahorn-Flügelsamen).",
        hint: "Flügelsamen drehen sich wie kleine Helikopter, wenn du sie wirfst.",
      },
    ],
    solutionWord: "BAUM",
    finale:
      "Setze die gesammelten Buchstaben zusammen – sie ergeben das Lösungswort «BAUM»! Lauft zum auffälligsten Baum beim Zeltplatz: Dort haben die Waldgeister Nusslis Schatz für euch versteckt. (Psst: Die Erwachsenen wissen, wo!)",
  },
  {
    id: "geraeusche-safari",
    title: "Geheimagent*in der Geräusche",
    ageHint: "ab ca. 5 Jahren",
    durationMinutes: 20,
    intro:
      "Du bist Geheimagent*in im Auftrag der Natur! Deine Mission: Belausche den Wald und knacke den Geheimcode der Geräusche. Für jede gelöste Horch-Mission bekommst du einen Codebuchstaben.",
    preparation:
      "Vorbereitung für Erwachsene: Die Kinder brauchen nur eine Sitzunterlage. Am Ende dürfen sie mit dem Lösungswort «OHR» einen Agenten-Titel und ein Abzeichen (z. B. einen aufgemalten Stern auf die Hand) abholen.",
    stations: [
      {
        title: "Mission 1: Der singende Spion",
        story: "Ein gefiederter Spion sendet Signale durch den Wald.",
        task: "Höre einen Vogel singen und versuche, seine Melodie nachzupfeifen oder nachzusummen.",
        hint: "Frühmorgens und abends singen die meisten Vögel.",
        letter: "O",
      },
      {
        title: "Mission 2: Die Flüster-Bäume",
        story:
          "Die Bäume tauschen geheime Nachrichten aus, wenn der Wind sie anstösst.",
        task: "Schliess die Augen und höre den Wind in den Blättern. Klingt er eher wie Rauschen, Flüstern oder Knistern?",
        letter: "H",
      },
      {
        title: "Mission 3: Der Brumm-Funk",
        story:
          "Achtung, feindlicher Funkverkehr! Kleine Flieger senden Brummsignale.",
        task: "Höre ein Insekt summen oder brummen. Kannst du es auch sehen?",
        hint: "Bei Blumen und blühenden Sträuchern funkt es am meisten.",
        letter: "R",
      },
      {
        title: "Mission 4: Das leiseste Geräusch der Welt",
        story: "Nur die besten Agent*innen hören, was sonst niemand hört.",
        task: "Sei eine ganze Minute mucksmäuschenstill. Was ist das leiseste Geräusch, das du entdeckst?",
      },
      {
        title: "Mission 5: Der Zahlen-Code",
        story: "Zum Schluss musst du den Zahlencode knacken.",
        task: "Zähle: Wie viele verschiedene Geräusche hörst du in einer Minute? Diese Zahl ist dein Geheimcode!",
      },
    ],
    solutionWord: "OHR",
    finale:
      "Deine Codebuchstaben ergeben «OHR» – das Erkennungszeichen der Geräusch-Agent*innen! Melde dich mit Lösungswort und Zahlencode bei der Agentenzentrale (den Erwachsenen) und erhalte feierlich deinen Titel: Meister-Lauscher*in des Waldes.",
  },
  {
    id: "zeltplatz-detektiv",
    title: "Der Fall des verschwundenen Kompasses",
    ageHint: "ab ca. 6 Jahren",
    durationMinutes: 35,
    intro:
      "Alarm am Zeltplatz! Der magische Kompass der Campingfee ist verschwunden – ohne ihn verirren sich alle Wanderer. Als Detektiv*in folgst du den Spuren und sammelst Beweisbuchstaben. Das Lösungswort verrät, wo der Kompass versteckt ist.",
    preparation:
      "Vorbereitung für Erwachsene: Versteckt einen «Kompass» (echter Kompass, Bild oder gebastelter Papierkompass) beim Ort des Lösungsworts «ZELT» – z. B. unter dem Vorzelt oder bei den Heringen.",
    stations: [
      {
        title: "Spur 1: Die Zelt-Zählung",
        story: "Die Campingfee sah den Dieb zwischen den Zelten verschwinden.",
        task: "Zähle alle Zelte, die du von hier aus sehen kannst. Merk dir die Zahl – ein echter Detektiv vergisst nichts!",
        letter: "Z",
      },
      {
        title: "Spur 2: Die Wind-Fährte",
        story: "Der Dieb floh mit dem Wind. Aber woher weht er?",
        task: "Mach deinen Finger nass und halte ihn hoch: Die kalte Seite zeigt, woher der Wind kommt. In welche Himmelsrichtung ist der Dieb geflohen?",
        hint: "Die Seite, die zuerst kühl wird, zeigt zur Windrichtung.",
        letter: "E",
      },
      {
        title: "Spur 3: Das Blätter-Beweisstück",
        story: "Am Fluchtweg liegen drei verdächtige Blätter.",
        task: "Suche drei verschiedene Blätter und lege sie der Grösse nach. Das mittlere ist das Beweisstück – von welchem Baum stammt es?",
        hint: "Vergleiche mit dem Natur-Entdecker in dieser App!",
        letter: "L",
      },
      {
        title: "Spur 4: Der Verhör-Zeuge",
        story:
          "Ein kleines Tier hat alles beobachtet. Du musst es finden und geduldig verhören.",
        task: "Entdecke ein Tier (eine Ameise zählt auch!) und beobachte es eine Minute lang. Was hat es «gesehen»? Denk dir aus, was es dir erzählen würde.",
        letter: "T",
      },
      {
        title: "Spur 5: Die Karten-Skizze",
        story: "Jede*r gute Detektiv*in zeichnet den Tatort.",
        task: "Male mit einem Stock eine Karte des Zeltplatzes in die Erde: Wo stehen die Zelte, wo ist der Eingang, wo war der Dieb?",
      },
      {
        title: "Spur 6: Der Glücksstein-Test",
        story:
          "Der Dieb hat einen magischen Stein verloren. Wer ihn findet, kann den Kompass zurückzaubern.",
        task: "Finde einen Stein, der genau in deine Hosentasche passt – dein Detektiv-Glücksstein!",
      },
    ],
    solutionWord: "ZELT",
    finale:
      "Die Beweisbuchstaben ergeben «ZELT»! Der Kompass muss beim Zelt versteckt sein. Such rund ums Zelt – hast du ihn gefunden, ist der Fall gelöst und die Campingfee ernennt dich zum Ober-Detektiv oder zur Ober-Detektivin des Zeltplatzes!",
  },
  {
    id: "farben-jagd",
    title: "Die Regenbogen-Rettung",
    ageHint: "ab ca. 3 Jahren (mit Begleitung)",
    durationMinutes: 20,
    intro:
      "Oje! Ein Sturm hat den Regenbogen zerbrochen und alle Farben sind auf den Zeltplatz gefallen. Nur du kannst sie wieder einsammeln und den Regenbogen reparieren. Für jede gerettete Farbe darfst du ein Feld auf deinem Regenbogen ausmalen (oder einen Gegenstand aufs Regenbogen-Tuch legen).",
    preparation:
      "Vorbereitung für Erwachsene: Legt ein Tuch oder eine Matte als «Regenbogen-Sammelplatz» bereit. Dort ordnen die Kinder ihre Fundstücke als Farbbogen an.",
    stations: [
      {
        title: "Farbe 1: Grün wie der Frosch",
        story: "Die grüne Farbe ist ins Gras gehüpft!",
        task: "Finde etwas Grünes und lege es an den Anfang deines Regenbogens.",
      },
      {
        title: "Farbe 2: Braun wie der Bär",
        story: "Das Braun hat sich bei den Bäumen versteckt.",
        task: "Finde etwas Braunes – Rinde, Erde oder einen Zapfen.",
      },
      {
        title: "Farbe 3: Gelb wie die Sonne",
        story: "Das Gelb ist zur Sonne geflogen und heruntergefallen.",
        task: "Finde etwas Gelbes – eine Blume oder ein herbstliches Blatt.",
        hint: "Löwenzahn wächst fast überall!",
      },
      {
        title: "Farbe 4: Rot wie das Feuer",
        story: "Das Rot glüht irgendwo zwischen Beeren und Blättern.",
        task: "Finde etwas Rotes oder Oranges. Achtung: Beeren nur anschauen, nicht essen!",
      },
      {
        title: "Farbe 5: Weiss wie die Wolke",
        story: "Das Weiss ist von einer Wolke getropft.",
        task: "Finde etwas Weisses – einen hellen Stein, ein Gänseblümchen oder eine Feder.",
      },
      {
        title: "Farbe 6: Blau wie der Himmel",
        story:
          "Das Blau ist am schwersten zu retten – es versteckt sich fast immer oben.",
        task: "Finde etwas Blaues. Wenn du nichts findest: Zeig in den Himmel – der zählt auch!",
      },
      {
        title: "Zauber-Finale: Die Doppelfarbe",
        story: "Zum Schluss braucht der Regenbogen noch einen Zauberglanz.",
        task: "Finde etwas, das zwei Farben gleichzeitig hat, und lege es in die Mitte.",
      },
    ],
    finale:
      "Geschafft! Lege alle Fundstücke als Bogen auf den Sammelplatz – dein selbst geretteter Regenbogen! Mach ein Erinnerungsfoto und gib jeder Farbe einen lustigen Namen (z. B. «Froschgrün» oder «Bärenbraun»).",
  },
  {
    id: "wasser-expedition",
    title: "Expedition Wassertropfen",
    ageHint: "ab ca. 5 Jahren",
    durationMinutes: 30,
    intro:
      "Du bist Forscher*in auf einer wichtigen Expedition: Der kleine Wassertropfen «Plitsch» ist aus seiner Wolke gefallen und muss zurück zum Wasser! Begleite ihn über alle Stationen und sammle Forscherbuchstaben.",
    preparation:
      "Vorbereitung für Erwachsene: Funktioniert am besten in der Nähe eines Bachs, Sees oder nach Regen – zur Not reicht eine Wasserflasche als «Ziel-Gewässer». Belohnung: Ein «Forscher-Diplom» (Handschlag + feierliche Ernennung).",
    stations: [
      {
        title: "Etappe 1: Die Tau-Suche",
        story:
          "Plitsch sucht seine Geschwister – winzige Tropfen, die überall glitzern.",
        task: "Finde Wasser in der Natur: einen Tautropfen, eine Pfütze, feuchtes Moos oder einen Bach.",
        hint: "Früh am Morgen glitzert Tau auf Gräsern und Spinnennetzen.",
        letter: "S",
      },
      {
        title: "Etappe 2: Das Durstige Grün",
        story: "Unterwegs trifft Plitsch Pflanzen, die ihn trinken wollen!",
        task: "Finde eine Pflanze, die besonders saftig-grün aussieht, und eine, die vertrocknet ist. Was ist der Unterschied?",
        letter: "E",
      },
      {
        title: "Etappe 3: Die Tier-Tränke",
        story: "Auch Tiere brauchen Plitschs Familie zum Leben.",
        task: "Finde einen Ort, an dem Tiere trinken könnten (Pfütze, Bachrand, Blatt mit Tropfen). Siehst du Spuren?",
        letter: "E",
      },
      {
        title: "Etappe 4: Der Regen-Tanz",
        story: "Plitsch erinnert sich, wie er als Regen gefallen ist.",
        task: "Erfinde einen Regen-Tanz: Trommle erst leise mit den Fingern (Nieselregen), dann stampfe wild (Gewitter), dann werde ganz still (Sonne kommt).",
      },
      {
        title: "Etappe 5: Die Heimreise",
        story: "Jetzt weiss Plitsch, wo er hingehört!",
        task: "Bring einen Becher Wasser vorsichtig zum nächsten Gewässer (oder giesse eine durstige Pflanze) und lass Plitsch mit einem lauten «Platsch!» nach Hause.",
      },
    ],
    solutionWord: "SEE",
    finale:
      "Deine Forscherbuchstaben ergeben «SEE» – Plitschs Zuhause! Die Expedition ist geglückt. Lass dich von der Expeditionsleitung (den Erwachsenen) feierlich zum Wasserforscher oder zur Wasserforscherin ernennen!",
  },
  {
    id: "nacht-mutprobe",
    title: "Die Nachtwächter-Prüfung",
    ageHint: "ab ca. 7 Jahren (in der Dämmerung, mit Begleitung)",
    durationMinutes: 25,
    intro:
      "Wenn es dunkel wird, braucht der Zeltplatz mutige Nachtwächter*innen! Bestehe die fünf Prüfungen der Dämmerung und verdiene dir das Amt. Nimm eine Taschenlampe mit – aber benutze sie nur, wenn es eine Prüfung erlaubt.",
    preparation:
      "Vorbereitung für Erwachsene: In der Dämmerung begleiten, Taschenlampe pro Kind. Als Abschluss-Belohnung eine «Nachtwächter-Urkunde» oder das Recht, das Lagerfeuer/die Lampe am Abend feierlich zu «bewachen».",
    stations: [
      {
        title: "Prüfung 1: Die Eulen-Augen",
        story: "Nachtwächter*innen sehen im Dunkeln – wie die Eulen.",
        task: "Lass die Taschenlampe aus und warte drei Minuten. Merkst du, wie deine Augen immer mehr erkennen? Zähle, wie viele Dinge du jetzt sehen kannst.",
        hint: "Nicht in helle Lichter schauen – das macht die Eulen-Augen kaputt.",
        letter: "M",
      },
      {
        title: "Prüfung 2: Die Fledermaus-Ohren",
        story: "Nachts hört man mehr als am Tag.",
        task: "Schliess die Augen und zähle drei Geräusche, die es nur am Abend gibt (Grillen, Rascheln, ferne Stimmen …).",
        letter: "U",
      },
      {
        title: "Prüfung 3: Der Sternen-Blick",
        story: "Nachtwächter*innen kennen den Himmel.",
        task: "Finde den hellsten Stern am Himmel. Wenn du den Grossen Wagen entdeckst, bist du ein Naturtalent!",
        hint: "Der Sternen-Teil im Natur-Entdecker dieser App hilft dir.",
        letter: "T",
      },
      {
        title: "Prüfung 4: Der Lichter-Morse-Code",
        story: "Wächter*innen senden geheime Lichtsignale.",
        task: "Jetzt darfst du die Taschenlampe benutzen: Sende dreimal kurz, dreimal lang, dreimal kurz – das ist SOS! Kann jemand dein Signal beantworten?",
      },
      {
        title: "Prüfung 5: Der Runden-Gang",
        story: "Die letzte Prüfung: eine echte Wächter-Runde.",
        task: "Geh mit deiner Begleitung einmal ruhig ums Zelt und prüfe wie ein Profi: Sind alle Leinen gespannt? Liegt nichts draussen, das nass werden könnte?",
      },
    ],
    solutionWord: "MUT",
    finale:
      "Deine Prüfungsbuchstaben ergeben «MUT» – genau das, was du bewiesen hast! Du wirst feierlich zum Nachtwächter oder zur Nachtwächterin des Zeltplatzes ernannt und darfst heute das Abendlicht bewachen.",
  },
];

export const natureQuizzes: NatureQuiz[] = [
  {
    id: "wald-quiz",
    title: "Grosses Wald-Quiz",
    ageHint: "ab ca. 6 Jahren",
    questions: [
      {
        question: "Welcher Baum sticht, wenn du seine Nadeln anfasst?",
        options: ["Die Tanne", "Die Fichte", "Die Lärche"],
        correctIndex: 1,
        explanation:
          "Merkspruch: «Die Fichte sticht, die Tanne nicht!» Tannennadeln sind weich und vorne eingekerbt.",
      },
      {
        question: "Was verliert die Lärche im Winter?",
        options: ["Ihre Rinde", "Ihre Zapfen", "Ihre Nadeln"],
        correctIndex: 2,
        explanation:
          "Die Lärche ist der einzige heimische Nadelbaum, der im Herbst alle Nadeln abwirft – vorher werden sie goldgelb.",
      },
      {
        question:
          "Welches Tier vergisst seine Nussverstecke und pflanzt so neue Bäume?",
        options: ["Das Eichhörnchen", "Der Fuchs", "Der Dachs"],
        correctIndex: 0,
        explanation:
          "Eichhörnchen verstecken hunderte Nüsse und finden viele nie wieder – daraus wachsen neue Bäume.",
      },
      {
        question: "Woran erkennst du eine Fuchsspur?",
        options: [
          "Sie ist riesig wie ein Teller",
          "Die Abdrücke liegen auf einer geraden Linie",
          "Sie hat sechs Zehen",
        ],
        correctIndex: 1,
        explanation:
          "Füchse «schnüren»: Ihre Pfotenabdrücke liegen wie Perlen auf einer Schnur hintereinander.",
      },
      {
        question: "Welche Baumrinde brennt sogar, wenn sie nass ist?",
        options: ["Buchenrinde", "Eichenrinde", "Birkenrinde"],
        correctIndex: 2,
        explanation:
          "Birkenrinde enthält ätherische Öle und ist der beste natürliche Feuerstarter des Waldes.",
      },
    ],
  },
  {
    id: "sternen-quiz",
    title: "Sternengucker-Quiz",
    ageHint: "ab ca. 7 Jahren",
    questions: [
      {
        question: "Welcher Stern zeigt dir immer, wo Norden ist?",
        options: ["Der Polarstern", "Die Wega", "Der Mond"],
        correctIndex: 0,
        explanation:
          "Der Polarstern steht fast genau über dem Nordpol und bewegt sich scheinbar nie.",
      },
      {
        question: "Wie sieht das Sternbild Kassiopeia aus?",
        options: ["Wie ein Kreis", "Wie ein grosses W", "Wie ein Dreieck"],
        correctIndex: 1,
        explanation:
          "Fünf helle Sterne bilden ein W – manchmal steht es auf dem Kopf und sieht aus wie ein M.",
      },
      {
        question: "Wie findest du mit dem Grossen Wagen den Polarstern?",
        options: [
          "Er steht direkt daneben",
          "Hintere Kastenkante 5× verlängern",
          "Der Deichsel folgen",
        ],
        correctIndex: 1,
        explanation:
          "Verlängere die hintere Kante des Wagenkastens fünfmal nach oben – dort funkelt der Polarstern.",
      },
      {
        question: "Was siehst du bei dunklem Himmel mitten im Sommerdreieck?",
        options: ["Die Milchstrasse", "Einen Planeten", "Ein Flugzeug"],
        correctIndex: 0,
        explanation:
          "Das schimmernde Band der Milchstrasse zieht mitten durch das Sommerdreieck – Milliarden ferner Sterne!",
      },
      {
        question: "Woraus besteht der Gürtel des Orion?",
        options: [
          "Aus drei Sternen in einer Reihe",
          "Aus einem hellen Nebel",
          "Aus sieben Sternen im Kreis",
        ],
        correctIndex: 0,
        explanation:
          "Drei helle Sterne in einer geraden Reihe bilden den berühmten Oriongürtel – im Winter gut sichtbar.",
      },
    ],
  },
  {
    id: "tier-quiz",
    title: "Tierspuren-Quiz",
    ageHint: "ab ca. 5 Jahren",
    questions: [
      {
        question: "Welches Tier hinterlässt kleine, herzförmige Spuren?",
        options: ["Das Wildschwein", "Das Reh", "Der Dachs"],
        correctIndex: 1,
        explanation:
          "Rehspuren sind nur 4–5 cm klein und sehen aus wie zwei Kommas, die ein Herz bilden.",
      },
      {
        question: "Was verrät dir, dass ein Wildschwein in der Nähe war?",
        options: ["Umgewühlte Erde", "Abgenagte Zapfen", "Federn am Boden"],
        correctIndex: 0,
        explanation:
          "Wildschweine wühlen mit ihrer Schnauze den Boden um, wenn sie nach Würmern und Wurzeln suchen.",
      },
      {
        question: "Welches Tier baut unterirdische Burgen mit vielen Etagen?",
        options: ["Der Fuchs", "Das Eichhörnchen", "Der Dachs"],
        correctIndex: 2,
        explanation:
          "Dachsburgen haben viele Gänge und Kammern – manche sind über 100 Jahre alt.",
      },
      {
        question:
          "Ein Zapfen sieht aus wie ein abgenagter Maiskolben. Wer war das?",
        options: ["Ein Eichhörnchen", "Ein Reh", "Ein Vogel"],
        correctIndex: 0,
        explanation:
          "Eichhörnchen nagen die Schuppen der Zapfen ab, um an die Samen zu kommen – übrig bleibt der «Maiskolben».",
      },
      {
        question: "Welches Geräusch macht ein erschrockenes Reh?",
        options: ["Es miaut", "Es bellt", "Es pfeift"],
        correctIndex: 1,
        explanation:
          "Rehe stossen einen rauen Beller aus – viele verwechseln ihn mit einem Hund!",
      },
    ],
  },
  {
    id: "wetter-quiz",
    title: "Wetterfrosch-Quiz",
    ageHint: "ab ca. 6 Jahren",
    questions: [
      {
        question:
          "Was solltest du beim Zelten tun, wenn ein Gewitter aufzieht?",
        options: [
          "Unter den höchsten Baum stehen",
          "Ins Auto oder ein Gebäude gehen",
          "Im Zelt die Stangen festhalten",
        ],
        correctIndex: 1,
        explanation:
          "Ein Auto oder Gebäude schützt am besten. Zelte und einzelne Bäume sind bei Blitzen gefährlich!",
      },
      {
        question: "Wie erkennst du, dass bald ein Gewitter kommen könnte?",
        options: [
          "Hohe Türme aus Blumenkohl-Wolken",
          "Ganz dünne Schleierwolken",
          "Ein knallblauer Himmel",
        ],
        correctIndex: 0,
        explanation:
          "Riesige, blumenkohlförmige Wolkentürme (Cumulonimbus) sind Gewitterwolken – Zeit, das Camp zu sichern!",
      },
      {
        question:
          "Wie weit ist ein Gewitter weg, wenn zwischen Blitz und Donner 9 Sekunden liegen?",
        options: ["9 Kilometer", "etwa 3 Kilometer", "90 Meter"],
        correctIndex: 1,
        explanation:
          "Sekunden zählen und durch 3 teilen ergibt ungefähr die Entfernung in Kilometern: 9 ÷ 3 = 3 km.",
      },
      {
        question: "Was bedeutet Morgentau auf der Zeltplane meistens?",
        options: [
          "Es wird regnen",
          "Ein schöner Tag kommt",
          "Es gibt Nebel den ganzen Tag",
        ],
        correctIndex: 1,
        explanation:
          "Tau entsteht in klaren, windstillen Nächten – die kündigen oft einen sonnigen Tag an.",
      },
      {
        question: "Warum schwirren Schwalben bei schönem Wetter hoch oben?",
        options: [
          "Sie üben fürs Wegfliegen",
          "Ihre Beute, die Insekten, fliegt hoch",
          "Sie haben Angst vor Katzen",
        ],
        correctIndex: 1,
        explanation:
          "Bei stabilem Hochdruckwetter steigen Insekten hoch hinauf – und die Schwalben folgen ihrem Futter.",
      },
    ],
  },
  {
    id: "feuer-quiz",
    title: "Lagerfeuer-Profi-Quiz",
    ageHint: "ab ca. 7 Jahren",
    questions: [
      {
        question: "Was brauchst du zum Feuermachen zuerst?",
        options: [
          "Dicke Holzscheite",
          "Dünnes, trockenes Anzündmaterial",
          "Viel Papier und Benzin",
        ],
        correctIndex: 1,
        explanation:
          "Erst kleines, trockenes Material (Birkenrinde, dünne Zweige), dann immer dickeres Holz – nie Benzin!",
      },
      {
        question: "Wo darfst du ein Lagerfeuer machen?",
        options: [
          "Überall im Wald",
          "Nur an offiziellen Feuerstellen",
          "Direkt neben dem Zelt",
        ],
        correctIndex: 1,
        explanation:
          "Nur an erlaubten, eingerichteten Feuerstellen – und bei Waldbrandgefahr gar nicht.",
      },
      {
        question: "Wie löschst du das Feuer richtig, bevor du schlafen gehst?",
        options: [
          "Einfach brennen lassen",
          "Mit viel Wasser übergiessen und umrühren",
          "Mit Blättern zudecken",
        ],
        correctIndex: 1,
        explanation:
          "Wasser drüber, umrühren, nochmals Wasser – erst wenn nichts mehr zischt und alles kalt ist, ist es sicher.",
      },
      {
        question: "Welcher Abstand zwischen Feuer und Zelt ist sicher?",
        options: [
          "1 grosser Schritt",
          "mindestens 3–5 Meter",
          "Das Feuer darf das Zelt berühren",
        ],
        correctIndex: 1,
        explanation:
          "Funken fliegen weit! Mindestens 3–5 Meter Abstand, und auf die Windrichtung achten.",
      },
      {
        question: "Was machst du, wenn deine Marshmallow-Rute brennt?",
        options: [
          "Wild herumfuchteln",
          "Ruhig ausblasen oder in den Sand tauchen",
          "Wegwerfen, egal wohin",
        ],
        correctIndex: 1,
        explanation:
          "Ruhig bleiben und ausblasen oder die Spitze auf den Boden drücken – nie mit brennenden Sachen rennen.",
      },
    ],
  },
];
