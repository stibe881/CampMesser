/**
 * Regentag-Ideen (#290): was man im Zelt und im Vorzelt machen kann.
 *
 * DER MOMENT, für den das gebaut ist: Es regnet seit dem Frühstück, die
 * Kinder sind zappelig, und einem fällt genau nichts ein. Deshalb ist das
 * hier kein Ideenbuch zum Blättern, sondern ein Filter: Wie alt sind die
 * Kinder, wie viel Zeit ist zu überbrücken, und wie viel Platz gibt es?
 *
 * DER PLATZ entscheidet mehr als alles andere. Im Zelt liegt man; im
 * Vorzelt sitzt man an einem Tisch; im Aufenthaltsraum darf man auch mal
 * aufstehen. Eine Idee, die einen Tisch braucht, nützt im Innenzelt
 * nichts – deshalb ist der Platz ein harter Filter und keine Empfehlung.
 *
 * MATERIAL: Was nicht ohnehin dabei ist, steht dabei. Eine Idee, für die
 * man erst einkaufen müsste, ist an einem Regentag keine Idee.
 */
import { l4, type L4 } from "./i18n";

/** Wie viel Platz braucht die Idee? Aufsteigend – mehr schliesst weniger ein. */
export const SPACES = ["zelt", "vorzelt", "raum"] as const;
export type Space = (typeof SPACES)[number];

export const SPACE_LABELS: Record<Space, L4> = {
  zelt: l4("Im Zelt", "Sous la tente", "In tenda", "In the tent"),
  vorzelt: l4(
    "Im Vorzelt",
    "Sous l'auvent",
    "Sotto la veranda",
    "In the awning"
  ),
  raum: l4("Aufenthaltsraum", "Salle commune", "Sala comune", "Common room"),
};

/** Rangfolge des Platzbedarfs – im Raum geht auch, was ins Zelt passt. */
const SPACE_RANK: Record<Space, number> = { zelt: 0, vorzelt: 1, raum: 2 };

export interface RainyIdea {
  id: string;
  title: L4;
  /** Wie es geht – ein, zwei Sätze, mehr braucht es nicht. */
  how: L4;
  /** Ab diesem Alter sinnvoll. */
  minAge: number;
  /** Bis zu diesem Alter (darüber wird es langweilig). */
  maxAge: number;
  /** Ungefähre Dauer in Minuten. */
  minutes: number;
  /** Mindestens nötiger Platz. */
  space: Space;
  /** Was dafür dabei sein muss; leer = nichts. */
  needs: L4[];
  /** Geht auch, wenn nebenan jemand schläft. */
  quiet?: boolean;
  /** Braucht mindestens zwei Personen. */
  together?: boolean;
}

export const RAINY_IDEAS: RainyIdea[] = [
  {
    id: "schattenfiguren",
    title: l4(
      "Schattenfiguren",
      "Ombres chinoises",
      "Ombre cinesi",
      "Shadow puppets"
    ),
    how: l4(
      "Stirnlampe gegen die Zeltwand, Hände davor – Hund, Vogel, Krokodil. Wer errät das Tier?",
      "Lampe frontale contre la toile, les mains devant – chien, oiseau, crocodile. Qui devine l'animal ?",
      "Frontalino contro il telo, le mani davanti – cane, uccello, coccodrillo. Chi indovina l'animale?",
      "Head torch against the tent wall, hands in front – dog, bird, crocodile. Who guesses the animal?"
    ),
    minAge: 3,
    maxAge: 10,
    minutes: 20,
    space: "zelt",
    needs: [l4("Stirnlampe", "Lampe frontale", "Frontalino", "Head torch")],
    quiet: true,
    together: true,
  },
  {
    id: "geschichtenkette",
    title: l4(
      "Geschichtenkette",
      "Histoire à la chaîne",
      "Storia a catena",
      "Story chain"
    ),
    how: l4(
      "Einer sagt einen Satz, der Nächste hängt einen an. Regel: Jeder Satz muss zum vorigen passen.",
      "Chacun ajoute une phrase à celle d'avant. Règle : chaque phrase doit coller à la précédente.",
      "Ognuno aggiunge una frase a quella prima. Regola: ogni frase deve stare con la precedente.",
      "Each person adds a sentence to the last one. Rule: every sentence must fit the one before."
    ),
    minAge: 4,
    maxAge: 99,
    minutes: 20,
    space: "zelt",
    needs: [],
    quiet: true,
    together: true,
  },
  {
    id: "regentropfenrennen",
    title: l4(
      "Tropfenrennen",
      "Course de gouttes",
      "Corsa delle gocce",
      "Raindrop race"
    ),
    how: l4(
      "Jeder sucht sich einen Tropfen oben an der Scheibe oder Zeltwand. Wessen Tropfen ist zuerst unten?",
      "Chacun choisit une goutte en haut de la vitre ou de la toile. Quelle goutte arrive en bas la première ?",
      "Ognuno sceglie una goccia in alto sul vetro o sul telo. Quale goccia arriva prima in fondo?",
      "Everyone picks a drop at the top of the window or tent wall. Whose drop reaches the bottom first?"
    ),
    minAge: 3,
    maxAge: 8,
    minutes: 10,
    space: "zelt",
    needs: [],
    quiet: true,
    together: true,
  },
  {
    id: "reisetagebuch",
    title: l4(
      "Reisetagebuch malen",
      "Dessiner le carnet de voyage",
      "Disegnare il diario di viaggio",
      "Draw the travel diary"
    ),
    how: l4(
      "Was war bis jetzt am schönsten? Aufmalen statt aufschreiben – auch wer noch nicht schreiben kann, kann erzählen.",
      "Qu'est-ce qui était le plus beau jusqu'ici ? Dessiner plutôt qu'écrire – même sans savoir écrire, on peut raconter.",
      "Cosa è stato più bello finora? Disegnare invece di scrivere – anche chi non sa scrivere può raccontare.",
      "What was the best bit so far? Draw it instead of writing – even those who cannot write can tell a story."
    ),
    minAge: 3,
    maxAge: 12,
    minutes: 30,
    space: "vorzelt",
    needs: [
      l4(
        "Papier und Stifte",
        "Papier et crayons",
        "Carta e matite",
        "Paper and pencils"
      ),
    ],
    quiet: true,
  },
  {
    id: "kartenhaus",
    title: l4(
      "Kartenhaus",
      "Château de cartes",
      "Castello di carte",
      "House of cards"
    ),
    how: l4(
      "Auf dem Campingtisch bauen, bis es einstürzt. Danach höher versuchen.",
      "Construire sur la table de camping jusqu'à ce que ça s'écroule. Puis viser plus haut.",
      "Costruire sul tavolo da campeggio finché crolla. Poi provare più in alto.",
      "Build on the camping table until it collapses. Then try to go higher."
    ),
    minAge: 6,
    maxAge: 99,
    minutes: 25,
    space: "vorzelt",
    needs: [
      l4("Jasskarten", "Jeu de cartes", "Mazzo di carte", "Deck of cards"),
    ],
    quiet: true,
  },
  {
    id: "knoten-ueben",
    title: l4(
      "Knoten üben",
      "S'exercer aux nœuds",
      "Esercitarsi con i nodi",
      "Practise knots"
    ),
    how: l4(
      "Ein Stück Schnur reicht. Wer kann den Palstek blind? Die Knoten-Bibliothek zeigt Schritt für Schritt.",
      "Un bout de corde suffit. Qui fait le nœud de chaise les yeux fermés ? La bibliothèque des nœuds montre pas à pas.",
      "Basta un pezzo di corda. Chi fa la gassa d'amante a occhi chiusi? La biblioteca dei nodi mostra passo passo.",
      "A piece of cord is enough. Who can tie a bowline blind? The knot library shows it step by step."
    ),
    minAge: 7,
    maxAge: 99,
    minutes: 20,
    space: "zelt",
    needs: [
      l4(
        "Ein Stück Schnur",
        "Un bout de corde",
        "Un pezzo di corda",
        "A piece of cord"
      ),
    ],
    quiet: true,
  },
  {
    id: "wettervorhersage",
    title: l4(
      "Eigene Wettervorhersage",
      "Sa propre météo",
      "La propria previsione",
      "Your own forecast"
    ),
    how: l4(
      "Wolken anschauen, im Wolken-Lexikon nachschlagen und aufschreiben, was ihr für morgen erwartet. Am Abend nachprüfen.",
      "Observer les nuages, chercher dans le lexique et noter ce que vous prévoyez pour demain. Vérifier le soir.",
      "Guardare le nuvole, cercare nel lessico e annotare cosa prevedete per domani. Verificare la sera.",
      "Watch the clouds, look them up in the cloud guide and write down what you expect tomorrow. Check in the evening."
    ),
    minAge: 8,
    maxAge: 99,
    minutes: 20,
    space: "vorzelt",
    needs: [],
    quiet: true,
  },
  {
    id: "hoerspiel",
    title: l4(
      "Hörspiel aufnehmen",
      "Enregistrer une pièce radio",
      "Registrare un radiodramma",
      "Record a radio play"
    ),
    how: l4(
      "Mit dem Handy aufnehmen: Rollen verteilen, Geräusche selber machen – Regen auf dem Zeltdach ist schon der Anfang.",
      "Enregistrer avec le téléphone : répartir les rôles, faire les bruitages soi-même – la pluie sur la toile, c'est déjà un début.",
      "Registrare col telefono: dividersi i ruoli, fare i rumori da soli – la pioggia sul telo è già un inizio.",
      "Record with the phone: hand out roles, make the sound effects yourselves – rain on the tent is a start already."
    ),
    minAge: 6,
    maxAge: 14,
    minutes: 45,
    space: "vorzelt",
    needs: [l4("Handy", "Téléphone", "Telefono", "Phone")],
    together: true,
  },
  {
    id: "postkarten",
    title: l4(
      "Postkarten schreiben",
      "Écrire des cartes postales",
      "Scrivere cartoline",
      "Write postcards"
    ),
    how: l4(
      "An die Grosseltern, an die Nachbarn, an sich selbst. Eine echte Karte kommt an, wenn längst niemand mehr damit rechnet.",
      "Aux grands-parents, aux voisins, à soi-même. Une vraie carte arrive quand plus personne ne s'y attend.",
      "Ai nonni, ai vicini, a sé stessi. Una cartolina vera arriva quando nessuno se l'aspetta più.",
      "To the grandparents, the neighbours, yourself. A real postcard arrives long after anyone expects it."
    ),
    minAge: 6,
    maxAge: 99,
    minutes: 30,
    space: "vorzelt",
    needs: [
      l4(
        "Postkarten und Stifte",
        "Cartes et stylos",
        "Cartoline e penne",
        "Postcards and pens"
      ),
    ],
    quiet: true,
  },
  {
    id: "schuhkarton-kino",
    title: l4(
      "Papierkino",
      "Cinéma en papier",
      "Cinema di carta",
      "Paper cinema"
    ),
    how: l4(
      "Eine Geschichte auf einen langen Papierstreifen malen und durch einen Schlitz im Karton ziehen – fertig ist der Film.",
      "Dessiner une histoire sur une longue bande de papier et la faire défiler dans une fente du carton – voilà le film.",
      "Disegnare una storia su una lunga striscia di carta e farla scorrere in una fessura del cartone – ecco il film.",
      "Draw a story on a long strip of paper and pull it through a slot in a box – there is your film."
    ),
    minAge: 5,
    maxAge: 11,
    minutes: 45,
    space: "vorzelt",
    needs: [
      l4(
        "Papier und Stifte",
        "Papier et crayons",
        "Carta e matite",
        "Paper and pencils"
      ),
      l4(
        "Ein leerer Karton",
        "Un carton vide",
        "Una scatola vuota",
        "An empty box"
      ),
    ],
    quiet: true,
  },
  {
    id: "montagsmaler",
    title: l4(
      "Zeichnen und raten",
      "Dessiner et deviner",
      "Disegnare e indovinare",
      "Draw and guess"
    ),
    how: l4(
      "Einer malt, die anderen raten. Begriffe aus dem Camping-Alltag: Hering, Kühlbox, Waschhaus.",
      "L'un dessine, les autres devinent. Des mots du camping : sardine, glacière, sanitaires.",
      "Uno disegna, gli altri indovinano. Parole del campeggio: picchetto, frigo portatile, bagni.",
      "One draws, the others guess. Words from camping life: tent peg, cool box, wash block."
    ),
    minAge: 5,
    maxAge: 99,
    minutes: 30,
    space: "vorzelt",
    needs: [
      l4(
        "Papier und Stifte",
        "Papier et crayons",
        "Carta e matite",
        "Paper and pencils"
      ),
    ],
    together: true,
  },
  {
    id: "kuchen-backen",
    title: l4(
      "Etwas Warmes backen",
      "Cuire quelque chose de chaud",
      "Cuocere qualcosa di caldo",
      "Bake something warm"
    ),
    how: l4(
      "Ein Regentag ist der richtige Tag für den Dutch Oven. Das Rezeptbuch hat Vorschläge, die auch ohne Backofen gehen.",
      "Un jour de pluie est fait pour la cocotte. Le livre de recettes propose des idées sans four.",
      "Un giorno di pioggia è fatto per il forno olandese. Il ricettario ha proposte anche senza forno.",
      "A rainy day is made for the Dutch oven. The recipe book has ideas that work without an oven."
    ),
    minAge: 4,
    maxAge: 99,
    minutes: 60,
    space: "vorzelt",
    needs: [
      l4(
        "Kocher oder Dutch Oven",
        "Réchaud ou cocotte",
        "Fornello o forno olandese",
        "Stove or Dutch oven"
      ),
    ],
  },
  {
    id: "olympiade",
    title: l4(
      "Vorzelt-Olympiade",
      "Olympiades sous l'auvent",
      "Olimpiadi sotto la veranda",
      "Awning olympics"
    ),
    how: l4(
      "Socken-Weitwurf, Becher-Stapeln auf Zeit, Einbeinstand. Punkte notieren, Sieger krönen.",
      "Lancer de chaussettes, empilage de gobelets chronométré, équilibre sur un pied. Noter les points, couronner le vainqueur.",
      "Lancio del calzino, impilare bicchieri a tempo, stare su una gamba. Segnare i punti, premiare il vincitore.",
      "Sock throwing, timed cup stacking, standing on one leg. Note the points, crown the winner."
    ),
    minAge: 4,
    maxAge: 12,
    minutes: 40,
    space: "raum",
    needs: [
      l4(
        "Becher und Socken",
        "Gobelets et chaussettes",
        "Bicchieri e calzini",
        "Cups and socks"
      ),
    ],
    together: true,
  },
  {
    id: "schatzkarte",
    title: l4(
      "Schatzkarte zeichnen",
      "Dessiner une carte au trésor",
      "Disegnare una mappa del tesoro",
      "Draw a treasure map"
    ),
    how: l4(
      "Den Platz von oben aufmalen, mit Waschhaus, Spielplatz und Kiosk. Für später: ein Kreuz, wo der Schatz liegt.",
      "Dessiner le camping vu d'en haut, avec les sanitaires, le jeu et le kiosque. Pour plus tard : une croix où est le trésor.",
      "Disegnare il campeggio dall'alto, con bagni, parco giochi e chiosco. Per dopo: una croce dov'è il tesoro.",
      "Draw the site from above, with the wash block, the playground and the kiosk. For later: a cross where the treasure is."
    ),
    minAge: 5,
    maxAge: 12,
    minutes: 35,
    space: "vorzelt",
    needs: [
      l4(
        "Papier und Stifte",
        "Papier et crayons",
        "Carta e matite",
        "Paper and pencils"
      ),
    ],
    quiet: true,
  },
  {
    id: "faltboot",
    title: l4(
      "Papierboote und Pfützenrennen",
      "Bateaux en papier et course de flaques",
      "Barchette di carta e corsa nelle pozze",
      "Paper boats and puddle races"
    ),
    how: l4(
      "Boote falten, Regenjacke an, und in der grössten Pfütze um die Wette fahren lassen. Der einzige Punkt, an dem Regen hilft.",
      "Plier des bateaux, enfiler l'imperméable et faire la course dans la plus grande flaque. Le seul moment où la pluie aide.",
      "Piegare barchette, mettere la giacca e gareggiare nella pozza più grande. L'unico momento in cui la pioggia aiuta.",
      "Fold boats, put on the raincoat and race them in the biggest puddle. The one point where rain helps."
    ),
    minAge: 4,
    maxAge: 10,
    minutes: 30,
    space: "raum",
    needs: [
      l4(
        "Papier und Regenjacke",
        "Papier et imperméable",
        "Carta e giacca",
        "Paper and a raincoat"
      ),
    ],
    together: true,
  },
  {
    id: "hoerst-du-was",
    title: l4(
      "Was hörst du?",
      "Qu'entends-tu ?",
      "Cosa senti?",
      "What do you hear?"
    ),
    how: l4(
      "Augen zu, zwei Minuten still sein und danach aufzählen, was man gehört hat. Erstaunlich, wie viel im Regen los ist.",
      "Yeux fermés, deux minutes de silence, puis énumérer ce qu'on a entendu. Étonnant tout ce qui se passe sous la pluie.",
      "Occhi chiusi, due minuti in silenzio, poi elencare cosa si è sentito. Sorprendente quanto succede sotto la pioggia.",
      "Eyes closed, two minutes of silence, then list what you heard. Surprising how much goes on in the rain."
    ),
    minAge: 3,
    maxAge: 99,
    minutes: 10,
    space: "zelt",
    needs: [],
    quiet: true,
  },
  {
    id: "packliste-pruefen",
    title: l4(
      "Ausrüstung durchsehen",
      "Passer l'équipement en revue",
      "Controllare l'attrezzatura",
      "Go through the gear"
    ),
    how: l4(
      "Der beste Moment, um Heringe zu zählen, den Reissverschluss zu wachsen und aufzuschreiben, was fehlt. Beim nächsten Mal dankt man es sich.",
      "Le meilleur moment pour compter les sardines, cirer la fermeture et noter ce qui manque. La prochaine fois, on se remerciera.",
      "Il momento migliore per contare i picchetti, lubrificare la cerniera e annotare cosa manca. La prossima volta ci si ringrazia.",
      "The best moment to count tent pegs, wax the zip and write down what is missing. Next time you will thank yourself."
    ),
    minAge: 10,
    maxAge: 99,
    minutes: 40,
    space: "vorzelt",
    needs: [],
    quiet: true,
  },
  {
    id: "siesta",
    title: l4(
      "Einfach lesen",
      "Simplement lire",
      "Semplicemente leggere",
      "Just read"
    ),
    how: l4(
      "Regen auf dem Zeltdach ist das beste Lesegeräusch, das es gibt. Nicht jede Stunde muss verplant sein.",
      "La pluie sur la toile est le meilleur bruit de fond pour lire. Toutes les heures ne doivent pas être occupées.",
      "La pioggia sul telo è il miglior rumore di fondo per leggere. Non ogni ora va riempita.",
      "Rain on the tent is the best reading sound there is. Not every hour needs a plan."
    ),
    minAge: 5,
    maxAge: 99,
    minutes: 60,
    space: "zelt",
    needs: [l4("Ein Buch", "Un livre", "Un libro", "A book")],
    quiet: true,
  },
];

export interface RainyFilter {
  /** Alter des Kindes; null = egal (dann zählt das Alter nicht). */
  age: number | null;
  /** So viel Zeit ist zu überbrücken, in Minuten. */
  minutes: number;
  /** Wie viel Platz steht zur Verfügung? */
  space: Space;
  /** Nur Leises (jemand schläft, Nachtruhe). */
  quietOnly: boolean;
  /** Sind mehrere Personen da? Sonst fallen Spiele zu zweit weg. */
  together: boolean;
}

/**
 * Passende Ideen suchen.
 *
 * PLATZ und LEISE sind harte Filter – eine Idee, die nicht ins Zelt
 * passt, nützt im Zelt nichts. Die DAUER ist eine Obergrenze mit etwas
 * Spielraum: Wer eine halbe Stunde überbrücken will, nimmt auch etwas,
 * das vierzig Minuten geht – abbrechen kann man immer.
 *
 * Sortiert wird nach Dauer, absteigend: Wer nach Ideen sucht, will meist
 * die längste, die noch passt.
 */
export function rainyDayIdeas(filter: RainyFilter): RainyIdea[] {
  /** Ein Viertel mehr darf es dauern – man kann jederzeit aufhören. */
  const maxMinutes = filter.minutes * 1.25;
  return RAINY_IDEAS.filter(idea => {
    if (SPACE_RANK[idea.space] > SPACE_RANK[filter.space]) return false;
    if (filter.quietOnly && !idea.quiet) return false;
    if (!filter.together && idea.together) return false;
    if (idea.minutes > maxMinutes) return false;
    if (filter.age !== null) {
      if (filter.age < idea.minAge || filter.age > idea.maxAge) return false;
    }
    return true;
  }).sort((a, b) => b.minutes - a.minutes || (a.id < b.id ? -1 : 1));
}

/**
 * Alles, was für die gefundenen Ideen dabei sein muss – ohne Doppel.
 * Praktisch als Blick in die Kiste, bevor man loslegt.
 */
export function neededMaterials(ideas: readonly RainyIdea[]): L4[] {
  const seen = new Set<string>();
  const result: L4[] = [];
  ideas.forEach(idea => {
    idea.needs.forEach(need => {
      if (seen.has(need.de)) return;
      seen.add(need.de);
      result.push(need);
    });
  });
  return result;
}
