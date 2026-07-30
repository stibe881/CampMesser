/**
 * Familien-Modus: Offline-Schnitzeljagden und Natur-Quizze,
 * um Kinder zu beschäftigen, während das Zelt aufgebaut wird.
 */
export interface ScavengerHunt {
  id: string;
  title: string;
  ageHint: string;
  durationMinutes: number;
  intro: string;
  tasks: string[];
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
    title: "Der Waldschatz",
    ageHint: "ab ca. 4 Jahren (mit Begleitung)",
    durationMinutes: 20,
    intro: "Sammle alle Schätze des Waldes in deinem Becher oder Hut. Bleib immer in Sichtweite des Zeltplatzes!",
    tasks: [
      "Finde etwas Weiches (z. B. Moos)",
      "Finde etwas Rundes (z. B. einen Kieselstein)",
      "Finde ein Blatt, das grösser ist als deine Hand",
      "Finde etwas, das gut riecht",
      "Finde einen Stock, der aussieht wie ein Buchstabe",
      "Finde einen Tannenzapfen",
      "Finde etwas Rotes, Gelbes oder Oranges",
      "Finde eine Feder oder etwas, das fliegen kann",
    ],
  },
  {
    id: "geraeusche-safari",
    title: "Geräusche-Safari",
    ageHint: "ab ca. 5 Jahren",
    durationMinutes: 15,
    intro: "Setz dich still auf eine Matte, schliess die Augen und lausche. Wie viele Geräusche entdeckst du?",
    tasks: [
      "Höre einen Vogel singen – kannst du ihn nachpfeifen?",
      "Höre den Wind in den Bäumen",
      "Höre ein Insekt summen oder brummen",
      "Höre Wasser (Bach, Regen oder See)",
      "Höre ein Geräusch, das Menschen machen",
      "Höre das leiseste Geräusch von allen – was war es?",
      "Zähle: Wie viele verschiedene Geräusche hörst du in einer Minute?",
    ],
  },
  {
    id: "zeltplatz-detektiv",
    title: "Zeltplatz-Detektiv*in",
    ageHint: "ab ca. 6 Jahren",
    durationMinutes: 30,
    intro: "Ein Fall für schlaue Spürnasen! Löse alle Aufgaben rund um den Zeltplatz, während die Grossen das Zelt aufbauen.",
    tasks: [
      "Zähle alle Zelte, die du von hier aus sehen kannst",
      "Finde heraus, aus welcher Richtung der Wind kommt (Tipp: nasser Finger!)",
      "Suche drei verschiedene Blätter und lege sie der Grösse nach",
      "Finde einen Stein, der in deine Hosentasche passt – dein Glücksstein!",
      "Entdecke ein Tier (Ameise zählt auch!) und beobachte es eine Minute",
      "Finde den besten Platz zum Sonnenuntergang-Schauen",
      "Male mit einem Stock eine Karte des Zeltplatzes in die Erde",
      "Geheimauftrag: Sammle 5 schöne Steine als Tischdeko fürs Abendessen",
    ],
  },
  {
    id: "farben-jagd",
    title: "Regenbogen-Jagd",
    ageHint: "ab ca. 3 Jahren (mit Begleitung)",
    durationMinutes: 15,
    intro: "Die Natur ist bunt! Finde für jede Farbe des Regenbogens etwas in der Natur.",
    tasks: [
      "Etwas Grünes 🟢",
      "Etwas Braunes 🟤",
      "Etwas Gelbes 🟡",
      "Etwas Rotes 🔴",
      "Etwas Weisses ⚪",
      "Etwas Blaues 🔵 (schwierig – der Himmel zählt!)",
      "Bonus: etwas, das zwei Farben hat",
    ],
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
        explanation: "Merkspruch: «Die Fichte sticht, die Tanne nicht!» Tannennadeln sind weich und vorne eingekerbt.",
      },
      {
        question: "Was verliert die Lärche im Winter?",
        options: ["Ihre Rinde", "Ihre Zapfen", "Ihre Nadeln"],
        correctIndex: 2,
        explanation: "Die Lärche ist der einzige heimische Nadelbaum, der im Herbst alle Nadeln abwirft – vorher werden sie goldgelb.",
      },
      {
        question: "Welches Tier vergisst seine Nussverstecke und pflanzt so neue Bäume?",
        options: ["Das Eichhörnchen", "Der Fuchs", "Der Dachs"],
        correctIndex: 0,
        explanation: "Eichhörnchen verstecken hunderte Nüsse und finden viele nie wieder – daraus wachsen neue Bäume.",
      },
      {
        question: "Woran erkennst du eine Fuchsspur?",
        options: ["Sie ist riesig wie ein Teller", "Die Abdrücke liegen auf einer geraden Linie", "Sie hat sechs Zehen"],
        correctIndex: 1,
        explanation: "Füchse «schnüren»: Ihre Pfotenabdrücke liegen wie Perlen auf einer Schnur hintereinander.",
      },
      {
        question: "Welche Baumrinde brennt sogar, wenn sie nass ist?",
        options: ["Buchenrinde", "Eichenrinde", "Birkenrinde"],
        correctIndex: 2,
        explanation: "Birkenrinde enthält ätherische Öle und ist der beste natürliche Feuerstarter des Waldes.",
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
        explanation: "Der Polarstern steht fast genau über dem Nordpol und bewegt sich scheinbar nie.",
      },
      {
        question: "Wie sieht das Sternbild Kassiopeia aus?",
        options: ["Wie ein Kreis", "Wie ein grosses W", "Wie ein Dreieck"],
        correctIndex: 1,
        explanation: "Fünf helle Sterne bilden ein W – manchmal steht es auf dem Kopf und sieht aus wie ein M.",
      },
      {
        question: "Wie findest du mit dem Grossen Wagen den Polarstern?",
        options: ["Er steht direkt daneben", "Hintere Kastenkante 5× verlängern", "Der Deichsel folgen"],
        correctIndex: 1,
        explanation: "Verlängere die hintere Kante des Wagenkastens fünfmal nach oben – dort funkelt der Polarstern.",
      },
      {
        question: "Was siehst du bei dunklem Himmel mitten im Sommerdreieck?",
        options: ["Die Milchstrasse", "Einen Planeten", "Ein Flugzeug"],
        correctIndex: 0,
        explanation: "Das schimmernde Band der Milchstrasse zieht mitten durch das Sommerdreieck – Milliarden ferner Sterne!",
      },
      {
        question: "Woraus besteht der Gürtel des Orion?",
        options: ["Aus drei Sternen in einer Reihe", "Aus einem hellen Nebel", "Aus sieben Sternen im Kreis"],
        correctIndex: 0,
        explanation: "Drei helle Sterne in einer geraden Reihe bilden den berühmten Oriongürtel – im Winter gut sichtbar.",
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
        explanation: "Rehspuren sind nur 4–5 cm klein und sehen aus wie zwei Kommas, die ein Herz bilden.",
      },
      {
        question: "Was verrät dir, dass ein Wildschwein in der Nähe war?",
        options: ["Umgewühlte Erde", "Abgenagte Zapfen", "Federn am Boden"],
        correctIndex: 0,
        explanation: "Wildschweine wühlen mit ihrer Schnauze den Boden um, wenn sie nach Würmern und Wurzeln suchen.",
      },
      {
        question: "Welches Tier baut unterirdische Burgen mit vielen Etagen?",
        options: ["Der Fuchs", "Das Eichhörnchen", "Der Dachs"],
        correctIndex: 2,
        explanation: "Dachsburgen haben viele Gänge und Kammern – manche sind über 100 Jahre alt.",
      },
      {
        question: "Ein Zapfen sieht aus wie ein abgenagter Maiskolben. Wer war das?",
        options: ["Ein Eichhörnchen", "Ein Reh", "Ein Vogel"],
        correctIndex: 0,
        explanation: "Eichhörnchen nagen die Schuppen der Zapfen ab, um an die Samen zu kommen – übrig bleibt der «Maiskolben».",
      },
      {
        question: "Welches Geräusch macht ein erschrockenes Reh?",
        options: ["Es miaut", "Es bellt", "Es pfeift"],
        correctIndex: 1,
        explanation: "Rehe stossen einen rauen Beller aus – viele verwechseln ihn mit einem Hund!",
      },
    ],
  },
];

