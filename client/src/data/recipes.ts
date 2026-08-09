/**
 * Campfire-Rezeptbuch – Rezepte für Gaskocher und offenes Feuer,
 * filterbar nach Zutaten und Zubereitungszeit. Offline verfügbar.
 * Alle Textfelder sind vollständig in DE/FR/IT/EN übersetzt (L4);
 * eigene Rezepte der Nutzer bleiben einsprachige Strings – Konsumenten
 * lesen beides über pick().
 */
import { l4, type L4 } from "@shared/i18n";
import type { RecipeDifficulty, RecipeMethod } from "@shared/customRecipes";
import img_rezept_one_pot_pasta from "@/assets/rezept-one-pot-pasta.webp";
import img_rezept_chili from "@/assets/rezept-chili.webp";
import img_rezept_schlangenbrot from "@/assets/rezept-schlangenbrot.webp";
import img_rezept_folienkartoffeln from "@/assets/rezept-folienkartoffeln.webp";
import img_rezept_porridge from "@/assets/rezept-porridge.webp";
import img_rezept_couscous from "@/assets/rezept-couscous.webp";
import img_rezept_aelplermagronen from "@/assets/rezept-aelplermagronen.webp";
import img_rezept_feuerspiess from "@/assets/rezept-feuerspiess.webp";
import img_rezept_linsen_dal from "@/assets/rezept-linsen-dal.webp";
import img_rezept_quesadilla from "@/assets/rezept-quesadilla.webp";
import img_rezept_bananen_schoggi from "@/assets/rezept-bananen-schoggi.webp";
import img_rezept_eier_broetli from "@/assets/rezept-eier-broetli.webp";
import img_rezept_risotto_pilze from "@/assets/rezept-risotto-pilze.webp";
import img_rezept_curry_kokos from "@/assets/rezept-curry-kokos.webp";
import img_rezept_steckerlfisch from "@/assets/rezept-steckerlfisch.webp";
import img_rezept_pfannen_pizza from "@/assets/rezept-pfannen-pizza.webp";
import img_rezept_minestrone from "@/assets/rezept-minestrone.webp";
import img_rezept_apfel_zimt from "@/assets/rezept-apfel-zimt.webp";

export interface Recipe {
  id: string;
  /** L4 bei eingebauten Rezepten, string bei eigenen – immer via pick() lesen. */
  name: L4 | string;
  /** Gespeicherter Schlüssel – Anzeige-Label via RECIPE_METHOD_LABELS. */
  method: RecipeMethod;
  timeMinutes: number;
  servings: number;
  /** Gespeicherter Schlüssel – Anzeige-Label via RECIPE_DIFFICULTY_LABELS. */
  difficulty: RecipeDifficulty;
  onePot: boolean;
  kidFriendly: boolean;
  ingredients: (L4 | string)[];
  steps: (L4 | string)[];
  tip?: L4 | string;
  image?: string;
}

export const recipes: Recipe[] = [
  {
    id: "one-pot-pasta",
    image: img_rezept_one_pot_pasta,
    name: l4(
      "One-Pot-Tomatenpasta",
      "One-pot pasta à la tomate",
      "Pasta al pomodoro one-pot",
      "One-pot tomato pasta"
    ),
    method: "Gaskocher",
    timeMinutes: 20,
    servings: 4,
    difficulty: "einfach",
    onePot: true,
    kidFriendly: true,
    ingredients: [
      l4(
        "Spaghetti oder Penne",
        "Spaghettis ou penne",
        "Spaghetti o penne",
        "Spaghetti or penne"
      ),
      l4(
        "Tomaten (frisch oder Dose)",
        "Tomates (fraîches ou en boîte)",
        "Pomodori (freschi o in scatola)",
        "Tomatoes (fresh or tinned)"
      ),
      l4("Zwiebel", "Oignon", "Cipolla", "Onion"),
      l4("Knoblauch", "Ail", "Aglio", "Garlic"),
      l4("Olivenöl", "Huile d'olive", "Olio d'oliva", "Olive oil"),
      l4("Salz", "Sel", "Sale", "Salt"),
      l4(
        "Getrocknete Kräuter",
        "Herbes séchées",
        "Erbe essiccate",
        "Dried herbs"
      ),
      l4("Wasser", "Eau", "Acqua", "Water"),
      l4("Parmesan", "Parmesan", "Parmigiano", "Parmesan"),
    ],
    steps: [
      l4(
        "Zwiebel und Knoblauch klein schneiden und im Topf mit etwas Olivenöl glasig dünsten.",
        "Émincer l'oignon et l'ail et les faire suer dans la casserole avec un peu d'huile d'olive jusqu'à ce qu'ils soient translucides.",
        "Trita cipolla e aglio e falli appassire nella pentola con un po' d'olio d'oliva.",
        "Finely chop the onion and garlic and sweat them in the pot with a little olive oil until translucent."
      ),
      l4(
        "Pasta, gehackte Tomaten, Kräuter und so viel Wasser zugeben, dass alles knapp bedeckt ist.",
        "Ajouter les pâtes, les tomates concassées, les herbes et juste assez d'eau pour couvrir le tout.",
        "Aggiungi la pasta, i pomodori a pezzetti, le erbe e acqua quanto basta per coprire appena il tutto.",
        "Add the pasta, chopped tomatoes, herbs and just enough water to barely cover everything."
      ),
      l4(
        "Bei mittlerer Hitze 10–12 Minuten köcheln lassen und regelmässig umrühren, bis die Pasta bissfest ist.",
        "Laisser mijoter 10–12 minutes à feu moyen en remuant régulièrement, jusqu'à ce que les pâtes soient al dente.",
        "Lascia sobbollire a fuoco medio per 10–12 minuti mescolando regolarmente, finché la pasta è al dente.",
        "Simmer over medium heat for 10–12 minutes, stirring regularly, until the pasta is al dente."
      ),
      l4(
        "Mit Salz abschmecken und mit Parmesan servieren.",
        "Rectifier l'assaisonnement en sel et servir avec du parmesan.",
        "Aggiusta di sale e servi con il parmigiano.",
        "Season with salt and serve with Parmesan."
      ),
    ],
    tip: l4(
      "Funktioniert mit fast jedem Gemüse aus der Kühlbox – Rüebli, Zucchetti oder Peperoni einfach mitkochen.",
      "Fonctionne avec presque tous les légumes de la glacière – carottes, courgettes ou poivrons, il suffit de les cuire avec.",
      "Funziona con quasi tutte le verdure del frigo box – carote, zucchine o peperoni, basta cuocerli insieme.",
      "Works with almost any vegetable from the cool box – simply cook carrots, courgettes or peppers along with it."
    ),
  },
  {
    id: "chili-sin-carne",
    image: img_rezept_chili,
    name: l4(
      "Camping-Chili",
      "Chili du camping",
      "Chili da campeggio",
      "Camping chili"
    ),
    method: "Beides",
    timeMinutes: 30,
    servings: 4,
    difficulty: "einfach",
    onePot: true,
    kidFriendly: true,
    ingredients: [
      l4(
        "Kidneybohnen (Dose)",
        "Haricots rouges (boîte)",
        "Fagioli rossi (scatola)",
        "Kidney beans (tin)"
      ),
      l4("Mais (Dose)", "Maïs (boîte)", "Mais (scatola)", "Sweetcorn (tin)"),
      l4(
        "Tomaten (Dose)",
        "Tomates (boîte)",
        "Pomodori (scatola)",
        "Tomatoes (tin)"
      ),
      l4("Zwiebel", "Oignon", "Cipolla", "Onion"),
      l4("Paprikapulver", "Paprika en poudre", "Paprica in polvere", "Paprika"),
      l4("Kreuzkümmel", "Cumin", "Cumino", "Cumin"),
      l4("Öl", "Huile", "Olio", "Oil"),
      l4("Salz", "Sel", "Sale", "Salt"),
      l4("Reis oder Brot", "Riz ou pain", "Riso o pane", "Rice or bread"),
    ],
    steps: [
      l4(
        "Zwiebel würfeln und im Topf mit Öl anbraten.",
        "Couper l'oignon en dés et le faire revenir dans la casserole avec de l'huile.",
        "Taglia la cipolla a dadini e falla rosolare nella pentola con l'olio.",
        "Dice the onion and fry it in the pot with oil."
      ),
      l4(
        "Bohnen, Mais und Tomaten samt Saft dazugeben.",
        "Ajouter les haricots, le maïs et les tomates avec leur jus.",
        "Aggiungi fagioli, mais e pomodori con il loro sugo.",
        "Add the beans, sweetcorn and tomatoes along with their juice."
      ),
      l4(
        "Mit Paprika, Kreuzkümmel und Salz würzen und 15–20 Minuten köcheln lassen.",
        "Assaisonner de paprika, de cumin et de sel et laisser mijoter 15–20 minutes.",
        "Condisci con paprica, cumino e sale e lascia sobbollire per 15–20 minuti.",
        "Season with paprika, cumin and salt and simmer for 15–20 minutes."
      ),
      l4(
        "Mit Reis oder frischem Brot servieren.",
        "Servir avec du riz ou du pain frais.",
        "Servi con riso o pane fresco.",
        "Serve with rice or fresh bread."
      ),
    ],
    tip: l4(
      "Wer mag, brät zuerst Hackfleisch oder Cervelat-Würfel an. Für Kinder die Chilischärfe weglassen und am Tisch nachwürzen.",
      "Si tu aimes, fais d'abord revenir de la viande hachée ou des dés de cervelas. Pour les enfants, omets le piment et assaisonne à table.",
      "Se ti piace, rosola prima carne macinata o dadini di cervelat. Per i bambini ometti il peperoncino e aggiungilo a tavola.",
      "If you like, brown some minced meat or diced cervelat first. For children, leave out the chilli heat and season at the table."
    ),
  },
  {
    id: "schlangenbrot",
    image: img_rezept_schlangenbrot,
    name: l4("Schlangenbrot", "Pain serpent", "Pane serpente", "Snake bread"),
    method: "Offenes Feuer",
    timeMinutes: 40,
    servings: 6,
    difficulty: "einfach",
    onePot: false,
    kidFriendly: true,
    ingredients: [
      l4("Mehl", "Farine", "Farina", "Flour"),
      l4(
        "Trockenhefe oder Backpulver",
        "Levure sèche ou poudre à lever",
        "Lievito secco o lievito in polvere",
        "Dried yeast or baking powder"
      ),
      l4("Salz", "Sel", "Sale", "Salt"),
      l4("Wasser", "Eau", "Acqua", "Water"),
      l4("Öl", "Huile", "Olio", "Oil"),
      l4("Zucker", "Sucre", "Zucchero", "Sugar"),
    ],
    steps: [
      l4(
        "Mehl, Backpulver (oder Hefe), Salz, eine Prise Zucker und Wasser zu einem geschmeidigen Teig kneten.",
        "Pétrir la farine, la poudre à lever (ou la levure), le sel, une pincée de sucre et l'eau en une pâte souple.",
        "Impasta farina, lievito in polvere (o lievito), sale, un pizzico di zucchero e acqua fino a ottenere un impasto morbido.",
        "Knead the flour, baking powder (or yeast), salt, a pinch of sugar and water into a smooth dough."
      ),
      l4(
        "Teig in Portionen teilen und zu daumendicken Schlangen rollen.",
        "Diviser la pâte en portions et les rouler en serpents de l'épaisseur d'un pouce.",
        "Dividi l'impasto in porzioni e forma dei serpenti spessi come un pollice.",
        "Divide the dough into portions and roll them into thumb-thick snakes."
      ),
      l4(
        "Teigschlangen spiralförmig um entrindete Stöcke wickeln.",
        "Enrouler les serpents de pâte en spirale autour de bâtons écorcés.",
        "Avvolgi i serpenti di pasta a spirale attorno a bastoni scortecciati.",
        "Wrap the dough snakes in a spiral around debarked sticks."
      ),
      l4(
        "Über der Glut (nicht in der Flamme) 10–15 Minuten unter Drehen goldbraun backen.",
        "Cuire au-dessus des braises (pas dans la flamme) 10–15 minutes en tournant, jusqu'à ce que le pain soit doré.",
        "Cuoci sopra la brace (non nella fiamma) per 10–15 minuti girando, finché è dorato.",
        "Bake over the embers (not in the flame) for 10–15 minutes, turning, until golden brown."
      ),
    ],
    tip: l4(
      "Klopftest: Klingt das Brot hohl, ist es durch. Schmeckt am besten mit Konfitüre oder Schoggicreme im Loch, das der Stock hinterlässt.",
      "Test du toc-toc: si le pain sonne creux, il est cuit. Un délice avec de la confiture ou de la pâte à tartiner au chocolat dans le trou laissé par le bâton.",
      "Prova del tocco: se il pane suona vuoto, è cotto. È buonissimo con confettura o crema al cioccolato nel buco lasciato dal bastone.",
      "Knock test: if the bread sounds hollow, it's done. Tastes best with jam or chocolate spread in the hole left by the stick."
    ),
  },
  {
    id: "folienkartoffeln",
    image: img_rezept_folienkartoffeln,
    name: l4(
      "Glut-Kartoffeln in Folie",
      "Pommes de terre en papillote à la braise",
      "Patate nella stagnola sotto la brace",
      "Ember potatoes in foil"
    ),
    method: "Offenes Feuer",
    timeMinutes: 45,
    servings: 4,
    difficulty: "einfach",
    onePot: false,
    kidFriendly: true,
    ingredients: [
      l4(
        "Grosse Kartoffeln",
        "Grosses pommes de terre",
        "Patate grandi",
        "Large potatoes"
      ),
      l4("Alufolie", "Papier alu", "Foglio di alluminio", "Aluminium foil"),
      l4("Butter oder Öl", "Beurre ou huile", "Burro o olio", "Butter or oil"),
      l4("Salz", "Sel", "Sale", "Salt"),
      l4(
        "Kräuterquark oder Sauerrahm",
        "Séré aux herbes ou crème acidulée",
        "Quark alle erbe o panna acida",
        "Herb quark or soured cream"
      ),
    ],
    steps: [
      l4(
        "Kartoffeln waschen, mehrfach einstechen und mit etwas Butter und Salz einzeln in zwei Lagen Alufolie wickeln.",
        "Laver les pommes de terre, les piquer plusieurs fois et les emballer une à une, avec un peu de beurre et de sel, dans deux couches de papier alu.",
        "Lava le patate, bucherellale più volte e avvolgile una a una, con un po' di burro e sale, in due strati di stagnola.",
        "Wash the potatoes, prick them several times and wrap each one, with a little butter and salt, in two layers of foil."
      ),
      l4(
        "Pakete in die Randglut legen – nicht in die offene Flamme.",
        "Poser les papillotes en bordure des braises – pas dans la flamme.",
        "Metti i pacchetti sul bordo della brace – non nella fiamma viva.",
        "Place the parcels in the embers at the edge of the fire – not in the open flame."
      ),
      l4(
        "Nach 20 Minuten wenden, insgesamt 40–50 Minuten garen.",
        "Retourner après 20 minutes, cuire 40–50 minutes au total.",
        "Gira dopo 20 minuti, cuoci in totale per 40–50 minuti.",
        "Turn after 20 minutes; cook for 40–50 minutes in total."
      ),
      l4(
        "Aufschneiden und mit Kräuterquark füllen.",
        "Inciser et garnir de séré aux herbes.",
        "Taglia e farcisci con il quark alle erbe.",
        "Cut open and fill with herb quark."
      ),
    ],
    tip: l4(
      "Garprobe mit dem Taschenmesser: Gleitet die Klinge ohne Widerstand hinein, sind sie fertig.",
      "Test de cuisson au couteau de poche: si la lame s'enfonce sans résistance, elles sont prêtes.",
      "Prova di cottura con il coltellino: se la lama entra senza resistenza, sono pronte.",
      "Doneness test with a pocket knife: if the blade slides in without resistance, they're ready."
    ),
  },
  {
    id: "porridge",
    image: img_rezept_porridge,
    name: l4(
      "Beeren-Porridge",
      "Porridge aux baies",
      "Porridge ai frutti di bosco",
      "Berry porridge"
    ),
    method: "Gaskocher",
    timeMinutes: 10,
    servings: 2,
    difficulty: "einfach",
    onePot: true,
    kidFriendly: true,
    ingredients: [
      l4("Haferflocken", "Flocons d'avoine", "Fiocchi d'avena", "Rolled oats"),
      l4("Milch oder Wasser", "Lait ou eau", "Latte o acqua", "Milk or water"),
      l4("Honig", "Miel", "Miele", "Honey"),
      l4(
        "Beeren oder Trockenfrüchte",
        "Baies ou fruits secs",
        "Frutti di bosco o frutta secca",
        "Berries or dried fruit"
      ),
      l4("Nüsse", "Noix", "Noci", "Nuts"),
      l4("Zimt", "Cannelle", "Cannella", "Cinnamon"),
    ],
    steps: [
      l4(
        "Haferflocken mit Milch oder Wasser in den Topf geben (Verhältnis ca. 1:2).",
        "Mettre les flocons d'avoine avec le lait ou l'eau dans la casserole (proportion env. 1:2).",
        "Metti i fiocchi d'avena con latte o acqua nella pentola (rapporto circa 1:2).",
        "Put the oats in the pot with milk or water (ratio about 1:2)."
      ),
      l4(
        "Unter Rühren aufkochen und 3–5 Minuten quellen lassen.",
        "Porter à ébullition en remuant et laisser gonfler 3–5 minutes.",
        "Porta a ebollizione mescolando e lascia gonfiare per 3–5 minuti.",
        "Bring to the boil while stirring and let it thicken for 3–5 minutes."
      ),
      l4(
        "Mit Honig und Zimt abschmecken.",
        "Assaisonner de miel et de cannelle.",
        "Insaporisci con miele e cannella.",
        "Sweeten with honey and cinnamon to taste."
      ),
      l4(
        "Mit frischen Beeren und Nüssen toppen.",
        "Garnir de baies fraîches et de noix.",
        "Completa con frutti di bosco freschi e noci.",
        "Top with fresh berries and nuts."
      ),
    ],
    tip: l4(
      "Das perfekte Camping-Frühstück: wärmt, sättigt lange und braucht nur einen Topf.",
      "Le petit-déjeuner de camping parfait: il réchauffe, rassasie longtemps et ne demande qu'une casserole.",
      "La colazione da campeggio perfetta: scalda, sazia a lungo e richiede una sola pentola.",
      "The perfect camping breakfast: warming, keeps you full for a long time and only needs one pot."
    ),
  },
  {
    id: "gemuese-couscous",
    image: img_rezept_couscous,
    name: l4(
      "Blitz-Couscous mit Gemüse",
      "Couscous express aux légumes",
      "Couscous express alle verdure",
      "Speedy vegetable couscous"
    ),
    method: "Gaskocher",
    timeMinutes: 15,
    servings: 3,
    difficulty: "einfach",
    onePot: true,
    kidFriendly: true,
    ingredients: [
      l4("Couscous", "Couscous", "Couscous", "Couscous"),
      l4(
        "Gemüsebouillon",
        "Bouillon de légumes",
        "Brodo vegetale",
        "Vegetable stock"
      ),
      l4("Rüebli", "Carottes", "Carote", "Carrots"),
      l4("Zucchetti", "Courgettes", "Zucchine", "Courgettes"),
      l4("Peperoni", "Poivrons", "Peperoni", "Peppers"),
      l4("Olivenöl", "Huile d'olive", "Olio d'oliva", "Olive oil"),
      l4("Zitrone", "Citron", "Limone", "Lemon"),
      l4("Wasser", "Eau", "Acqua", "Water"),
    ],
    steps: [
      l4(
        "Gemüse klein würfeln und im Topf mit Öl 5 Minuten anbraten.",
        "Couper les légumes en petits dés et les faire revenir 5 minutes dans la casserole avec de l'huile.",
        "Taglia le verdure a dadini e falle rosolare nella pentola con l'olio per 5 minuti.",
        "Dice the vegetables and fry them in the pot with oil for 5 minutes."
      ),
      l4(
        "Wasser und Bouillon zugeben und aufkochen.",
        "Ajouter l'eau et le bouillon et porter à ébullition.",
        "Aggiungi acqua e brodo e porta a ebollizione.",
        "Add the water and stock and bring to the boil."
      ),
      l4(
        "Couscous einrühren, Topf vom Kocher nehmen und zugedeckt 5 Minuten quellen lassen.",
        "Incorporer le couscous, retirer la casserole du réchaud et laisser gonfler 5 minutes à couvert.",
        "Versa il couscous, togli la pentola dal fornello e lascia gonfiare coperto per 5 minuti.",
        "Stir in the couscous, take the pot off the stove and let it steam, covered, for 5 minutes."
      ),
      l4(
        "Mit Gabel auflockern und mit Zitronensaft abschmecken.",
        "Égrener à la fourchette et assaisonner de jus de citron.",
        "Sgrana con una forchetta e condisci con succo di limone.",
        "Fluff with a fork and season with lemon juice."
      ),
    ],
    tip: l4(
      "Couscous ist der Gaskocher-Champion: minimaler Gasverbrauch, weil er nur quellen muss.",
      "Le couscous est le champion du réchaud à gaz: consommation minimale, puisqu'il n'a qu'à gonfler.",
      "Il couscous è il campione del fornello a gas: consumo minimo, perché deve solo gonfiarsi.",
      "Couscous is the gas-stove champion: minimal gas use, because it only needs to steam."
    ),
  },
  {
    id: "aelplermagronen",
    image: img_rezept_aelplermagronen,
    name: l4(
      "Älplermagronen",
      "Älplermagronen (macaronis de l'alpage)",
      "Älplermagronen (maccheroni dell'alpe)",
      "Älplermagronen (Alpine macaroni)"
    ),
    method: "Gaskocher",
    timeMinutes: 25,
    servings: 4,
    difficulty: "mittel",
    onePot: true,
    kidFriendly: true,
    ingredients: [
      l4(
        "Magronen (Hörnli)",
        "Macaronis (cornettes)",
        "Maccheroni (cornetti)",
        "Macaroni"
      ),
      l4("Kartoffeln", "Pommes de terre", "Patate", "Potatoes"),
      l4("Rahm", "Crème", "Panna", "Cream"),
      l4(
        "Bergkäse",
        "Fromage de montagne",
        "Formaggio di montagna",
        "Mountain cheese"
      ),
      l4("Zwiebel", "Oignon", "Cipolla", "Onion"),
      l4("Butter", "Beurre", "Burro", "Butter"),
      l4("Salz", "Sel", "Sale", "Salt"),
      l4("Apfelmus", "Compote de pommes", "Composta di mele", "Apple sauce"),
    ],
    steps: [
      l4(
        "Kartoffeln würfeln und in Salzwasser 5 Minuten vorkochen, dann Magronen zugeben und mitkochen.",
        "Couper les pommes de terre en dés et les précuire 5 minutes à l'eau salée, puis ajouter les macaronis et poursuivre la cuisson.",
        "Taglia le patate a dadini e precuocile in acqua salata per 5 minuti, poi aggiungi i maccheroni e continua la cottura.",
        "Dice the potatoes and parboil them in salted water for 5 minutes, then add the macaroni and cook together."
      ),
      l4(
        "Abgiessen, Rahm und geriebenen Käse unterrühren und schmelzen lassen.",
        "Égoutter, incorporer la crème et le fromage râpé et laisser fondre.",
        "Scola, incorpora panna e formaggio grattugiato e lascia fondere.",
        "Drain, stir in the cream and grated cheese and let it melt."
      ),
      l4(
        "Zwiebelringe separat (oder vorher) in Butter goldbraun braten und darüber verteilen.",
        "Faire dorer les rondelles d'oignon au beurre à part (ou avant) et les répartir dessus.",
        "Fai dorare gli anelli di cipolla nel burro a parte (o prima) e distribuiscili sopra.",
        "Fry the onion rings separately (or beforehand) in butter until golden and scatter them on top."
      ),
      l4(
        "Traditionell mit Apfelmus servieren.",
        "Servir traditionnellement avec de la compote de pommes.",
        "Servi tradizionalmente con la composta di mele.",
        "Traditionally served with apple sauce."
      ),
    ],
    tip: l4(
      "Der Schweizer Camping-Klassiker – deftiger Bergkäse macht den Unterschied.",
      "Le classique suisse du camping – un fromage de montagne corsé fait toute la différence.",
      "Il classico svizzero del campeggio – un formaggio di montagna saporito fa la differenza.",
      "The Swiss camping classic – a robust mountain cheese makes all the difference."
    ),
  },
  {
    id: "feuerspiess",
    image: img_rezept_feuerspiess,
    name: l4(
      "Gemüse-Wurst-Spiesse",
      "Brochettes légumes-saucisse",
      "Spiedini di verdure e salsiccia",
      "Vegetable and sausage skewers"
    ),
    method: "Offenes Feuer",
    timeMinutes: 20,
    servings: 4,
    difficulty: "einfach",
    onePot: false,
    kidFriendly: true,
    ingredients: [
      l4(
        "Cervelat oder Bratwurst",
        "Cervelas ou saucisse à rôtir",
        "Cervelat o salsiccia",
        "Cervelat or bratwurst"
      ),
      l4("Peperoni", "Poivrons", "Peperoni", "Peppers"),
      l4("Zucchetti", "Courgettes", "Zucchine", "Courgettes"),
      l4("Champignons", "Champignons", "Funghi champignon", "Mushrooms"),
      l4("Zwiebel", "Oignon", "Cipolla", "Onion"),
      l4("Öl", "Huile", "Olio", "Oil"),
      l4("Brot", "Pain", "Pane", "Bread"),
    ],
    steps: [
      l4(
        "Wurst und Gemüse in mundgerechte Stücke schneiden.",
        "Couper la saucisse et les légumes en morceaux de la taille d'une bouchée.",
        "Taglia salsiccia e verdure in pezzi da un boccone.",
        "Cut the sausage and vegetables into bite-sized pieces."
      ),
      l4(
        "Abwechselnd auf Spiesse stecken und mit Öl bepinseln.",
        "Les enfiler en alternance sur des brochettes et les badigeonner d'huile.",
        "Infilali alternandoli sugli spiedini e spennellali con l'olio.",
        "Thread them alternately onto skewers and brush with oil."
      ),
      l4(
        "Über der Glut unter Wenden 10–15 Minuten grillieren.",
        "Griller 10–15 minutes au-dessus des braises en tournant.",
        "Griglia sopra la brace per 10–15 minuti girando.",
        "Grill over the embers for 10–15 minutes, turning."
      ),
      l4(
        "Mit Brot servieren.",
        "Servir avec du pain.",
        "Servi con il pane.",
        "Serve with bread."
      ),
    ],
    tip: l4(
      "Kinder können ihre Spiesse selbst zusammenstellen – so isst jede*r, was gefällt.",
      "Les enfants peuvent composer leurs brochettes eux-mêmes – ainsi chacun·e mange ce qui lui plaît.",
      "I bambini possono comporre da soli i loro spiedini – così ognuno mangia quello che gli piace.",
      "Children can assemble their own skewers – so everyone eats what they like."
    ),
  },
  {
    id: "linsen-dal",
    image: img_rezept_linsen_dal,
    name: l4(
      "Schnelles Linsen-Dal",
      "Dal de lentilles express",
      "Dal di lenticchie veloce",
      "Quick lentil dal"
    ),
    method: "Gaskocher",
    timeMinutes: 25,
    servings: 3,
    difficulty: "einfach",
    onePot: true,
    kidFriendly: false,
    ingredients: [
      l4("Rote Linsen", "Lentilles corail", "Lenticchie rosse", "Red lentils"),
      l4("Kokosmilch", "Lait de coco", "Latte di cocco", "Coconut milk"),
      l4("Zwiebel", "Oignon", "Cipolla", "Onion"),
      l4("Knoblauch", "Ail", "Aglio", "Garlic"),
      l4("Currypulver", "Curry en poudre", "Curry in polvere", "Curry powder"),
      l4(
        "Tomaten (Dose)",
        "Tomates (boîte)",
        "Pomodori (scatola)",
        "Tomatoes (tin)"
      ),
      l4("Öl", "Huile", "Olio", "Oil"),
      l4("Salz", "Sel", "Sale", "Salt"),
      l4(
        "Reis oder Fladenbrot",
        "Riz ou pain plat",
        "Riso o pane piatto",
        "Rice or flatbread"
      ),
    ],
    steps: [
      l4(
        "Zwiebel und Knoblauch im Topf mit Öl andünsten, Currypulver kurz mitrösten.",
        "Faire suer l'oignon et l'ail dans la casserole avec de l'huile, torréfier brièvement le curry avec.",
        "Fai appassire cipolla e aglio nella pentola con l'olio, tosta brevemente il curry.",
        "Sweat the onion and garlic in the pot with oil, briefly toasting the curry powder with them."
      ),
      l4(
        "Linsen, Tomaten und Kokosmilch zugeben, mit etwas Wasser auffüllen.",
        "Ajouter les lentilles, les tomates et le lait de coco, compléter avec un peu d'eau.",
        "Aggiungi lenticchie, pomodori e latte di cocco, allunga con un po' d'acqua.",
        "Add the lentils, tomatoes and coconut milk, and top up with a little water."
      ),
      l4(
        "15 Minuten köcheln, bis die Linsen weich sind, dabei umrühren.",
        "Laisser mijoter 15 minutes en remuant, jusqu'à ce que les lentilles soient tendres.",
        "Lascia sobbollire per 15 minuti mescolando, finché le lenticchie sono morbide.",
        "Simmer for 15 minutes, stirring, until the lentils are soft."
      ),
      l4(
        "Mit Salz abschmecken und mit Reis oder Fladenbrot servieren.",
        "Rectifier l'assaisonnement en sel et servir avec du riz ou du pain plat.",
        "Aggiusta di sale e servi con riso o pane piatto.",
        "Season with salt and serve with rice or flatbread."
      ),
    ],
    tip: l4(
      "Rote Linsen brauchen kein Einweichen – ideal fürs Camp.",
      "Les lentilles corail n'ont pas besoin de trempage – idéal au camp.",
      "Le lenticchie rosse non hanno bisogno di ammollo – ideali per il campo.",
      "Red lentils don't need soaking – ideal for camp."
    ),
  },
  {
    id: "pfannen-quesadilla",
    image: img_rezept_quesadilla,
    name: l4(
      "Pfannen-Quesadillas",
      "Quesadillas à la poêle",
      "Quesadillas in padella",
      "Pan quesadillas"
    ),
    method: "Gaskocher",
    timeMinutes: 15,
    servings: 2,
    difficulty: "einfach",
    onePot: true,
    kidFriendly: true,
    ingredients: [
      l4(
        "Tortilla-Wraps",
        "Tortillas (wraps)",
        "Tortilla (wrap)",
        "Tortilla wraps"
      ),
      l4("Käse", "Fromage", "Formaggio", "Cheese"),
      l4("Mais (Dose)", "Maïs (boîte)", "Mais (scatola)", "Sweetcorn (tin)"),
      l4(
        "Bohnen (Dose)",
        "Haricots (boîte)",
        "Fagioli (scatola)",
        "Beans (tin)"
      ),
      l4("Öl", "Huile", "Olio", "Oil"),
    ],
    steps: [
      l4(
        "Wrap in die leicht geölte Pfanne legen und mit geriebenem Käse, Mais und Bohnen belegen.",
        "Poser une tortilla dans la poêle légèrement huilée et la garnir de fromage râpé, de maïs et de haricots.",
        "Metti una tortilla nella padella leggermente oliata e farciscila con formaggio grattugiato, mais e fagioli.",
        "Place a wrap in the lightly oiled pan and top with grated cheese, sweetcorn and beans."
      ),
      l4(
        "Zweiten Wrap auflegen und bei mittlerer Hitze 3 Minuten braten.",
        "Poser la deuxième tortilla dessus et cuire 3 minutes à feu moyen.",
        "Copri con la seconda tortilla e cuoci a fuoco medio per 3 minuti.",
        "Place the second wrap on top and fry over medium heat for 3 minutes."
      ),
      l4(
        "Vorsichtig wenden (Teller zu Hilfe nehmen) und weitere 3 Minuten braten, bis der Käse schmilzt.",
        "Retourner avec précaution (s'aider d'une assiette) et cuire encore 3 minutes, jusqu'à ce que le fromage fonde.",
        "Gira con attenzione (aiutandoti con un piatto) e cuoci altri 3 minuti, finché il formaggio si scioglie.",
        "Carefully flip (use a plate to help) and fry for another 3 minutes until the cheese melts."
      ),
      l4(
        "In Ecken schneiden und warm geniessen.",
        "Couper en quartiers et déguster chaud.",
        "Taglia a spicchi e gustale calde.",
        "Cut into wedges and enjoy warm."
      ),
    ],
    tip: l4(
      "Reste vom Vortag (Chili, Gemüse) lassen sich hervorragend als Füllung verwerten.",
      "Les restes de la veille (chili, légumes) font une excellente garniture.",
      "Gli avanzi del giorno prima (chili, verdure) sono un ripieno eccellente.",
      "Leftovers from the day before (chili, vegetables) make an excellent filling."
    ),
  },
  {
    id: "bananen-schoggi",
    image: img_rezept_bananen_schoggi,
    name: l4(
      "Schoggi-Bananen aus der Glut",
      "Bananes au chocolat à la braise",
      "Banane al cioccolato dalla brace",
      "Chocolate bananas from the embers"
    ),
    method: "Offenes Feuer",
    timeMinutes: 15,
    servings: 4,
    difficulty: "einfach",
    onePot: false,
    kidFriendly: true,
    ingredients: [
      l4("Bananen", "Bananes", "Banane", "Bananas"),
      l4("Schokolade", "Chocolat", "Cioccolato", "Chocolate"),
      l4("Alufolie", "Papier alu", "Foglio di alluminio", "Aluminium foil"),
    ],
    steps: [
      l4(
        "Bananen mit Schale der Länge nach einschneiden – nicht ganz durch.",
        "Inciser les bananes dans la longueur avec la peau – sans les couper entièrement.",
        "Incidi le banane con la buccia nel senso della lunghezza – senza tagliarle del tutto.",
        "Slit the bananas lengthways through the skin – not all the way through."
      ),
      l4(
        "Schokoladenstücke in den Schlitz stecken.",
        "Glisser des morceaux de chocolat dans la fente.",
        "Infila pezzetti di cioccolato nella fessura.",
        "Tuck pieces of chocolate into the slit."
      ),
      l4(
        "In Alufolie wickeln und 8–10 Minuten in die Randglut legen.",
        "Emballer dans du papier alu et poser 8–10 minutes en bordure des braises.",
        "Avvolgi nella stagnola e metti sul bordo della brace per 8–10 minuti.",
        "Wrap in foil and place in the embers at the edge of the fire for 8–10 minutes."
      ),
      l4(
        "Mit dem Löffel direkt aus der Schale essen.",
        "Déguster à la cuillère directement dans la peau.",
        "Mangia con il cucchiaino direttamente dalla buccia.",
        "Eat with a spoon straight from the skin."
      ),
    ],
    tip: l4(
      "Das einfachste Camping-Dessert der Welt – und der Höhepunkt jedes Lagerfeuerabends für Kinder.",
      "Le dessert de camping le plus simple du monde – et le clou de chaque soirée feu de camp pour les enfants.",
      "Il dessert da campeggio più semplice del mondo – e il momento clou di ogni serata al falò per i bambini.",
      "The simplest camping dessert in the world – and the highlight of every campfire evening for children."
    ),
  },
  {
    id: "eier-broetli",
    image: img_rezept_eier_broetli,
    name: l4(
      "Znüni-Eierbrötli aus der Pfanne",
      "Tartine à l'œuf à la poêle",
      "Uovo nel pane in padella",
      "Egg-in-a-hole toast"
    ),
    method: "Gaskocher",
    timeMinutes: 10,
    servings: 2,
    difficulty: "einfach",
    onePot: true,
    kidFriendly: true,
    ingredients: [
      l4(
        "Brot oder Toast",
        "Pain ou toast",
        "Pane o pancarré",
        "Bread or toast"
      ),
      l4("Eier", "Œufs", "Uova", "Eggs"),
      l4("Butter", "Beurre", "Burro", "Butter"),
      l4("Käse", "Fromage", "Formaggio", "Cheese"),
      l4("Salz", "Sel", "Sale", "Salt"),
    ],
    steps: [
      l4(
        "Mit einem Glas oder Messer ein Loch in die Brotscheiben schneiden.",
        "Découper un trou dans les tranches de pain avec un verre ou un couteau.",
        "Ritaglia un buco nelle fette di pane con un bicchiere o un coltello.",
        "Cut a hole in the bread slices with a glass or a knife."
      ),
      l4(
        "Brot in die Butterpfanne legen und je ein Ei ins Loch schlagen.",
        "Poser le pain dans la poêle beurrée et casser un œuf dans chaque trou.",
        "Metti il pane nella padella imburrata e rompi un uovo in ogni buco.",
        "Place the bread in the buttered pan and crack an egg into each hole."
      ),
      l4(
        "Bei mittlerer Hitze braten, bis das Ei stockt, dann wenden.",
        "Cuire à feu moyen jusqu'à ce que l'œuf prenne, puis retourner.",
        "Cuoci a fuoco medio finché l'uovo si rapprende, poi gira.",
        "Fry over medium heat until the egg sets, then flip."
      ),
      l4(
        "Mit Käse belegen, kurz schmelzen lassen und salzen.",
        "Garnir de fromage, laisser fondre brièvement et saler.",
        "Copri con il formaggio, lascia fondere brevemente e sala.",
        "Top with cheese, let it melt briefly and season with salt."
      ),
    ],
    tip: l4(
      "«Ei im Körbchen» – das schnellste warme Frühstück, wenn es morgens im Zelt noch kühl ist.",
      "«L'œuf au nid» – le petit-déjeuner chaud le plus rapide quand il fait encore frais dans la tente le matin.",
      "«L'uovo nel cestino» – la colazione calda più veloce quando al mattino in tenda fa ancora fresco.",
      '"Egg in a basket" – the quickest warm breakfast when it\'s still chilly in the tent in the morning.'
    ),
  },
  {
    id: "risotto-pilze",
    image: img_rezept_risotto_pilze,
    name: l4(
      "Pilz-Risotto aus einem Topf",
      "Risotto aux champignons en une casserole",
      "Risotto ai funghi in pentola unica",
      "One-pot mushroom risotto"
    ),
    method: "Gaskocher",
    timeMinutes: 30,
    servings: 3,
    difficulty: "mittel",
    onePot: true,
    kidFriendly: false,
    ingredients: [
      l4("Risotto-Reis", "Riz à risotto", "Riso per risotto", "Risotto rice"),
      l4(
        "Getrocknete Pilze",
        "Champignons séchés",
        "Funghi secchi",
        "Dried mushrooms"
      ),
      l4("Zwiebel", "Oignon", "Cipolla", "Onion"),
      l4("Bouillon", "Bouillon", "Brodo", "Stock"),
      l4("Parmesan", "Parmesan", "Parmigiano", "Parmesan"),
      l4("Olivenöl", "Huile d'olive", "Olio d'oliva", "Olive oil"),
    ],
    steps: [
      l4(
        "Getrocknete Pilze 10 Minuten in warmem Wasser einweichen, Einweichwasser aufbewahren.",
        "Faire tremper les champignons séchés 10 minutes dans de l'eau tiède, garder l'eau de trempage.",
        "Metti in ammollo i funghi secchi in acqua tiepida per 10 minuti, conserva l'acqua di ammollo.",
        "Soak the dried mushrooms in warm water for 10 minutes; keep the soaking water."
      ),
      l4(
        "Zwiebel im Öl glasig dünsten, Reis kurz mitrösten.",
        "Faire suer l'oignon dans l'huile jusqu'à ce qu'il soit translucide, toaster brièvement le riz avec.",
        "Fai appassire la cipolla nell'olio, tosta brevemente il riso.",
        "Sweat the onion in the oil until translucent, briefly toasting the rice with it."
      ),
      l4(
        "Nach und nach Bouillon und Pilzwasser zugeben, dabei regelmässig rühren.",
        "Ajouter petit à petit le bouillon et l'eau des champignons en remuant régulièrement.",
        "Aggiungi poco a poco il brodo e l'acqua dei funghi mescolando regolarmente.",
        "Gradually add the stock and mushroom water, stirring regularly."
      ),
      l4(
        "Nach ca. 20 Minuten Pilze unterrühren und mit Parmesan abschmecken.",
        "Après env. 20 minutes, incorporer les champignons et assaisonner de parmesan.",
        "Dopo circa 20 minuti incorpora i funghi e completa con il parmigiano.",
        "After about 20 minutes, stir in the mushrooms and finish with Parmesan."
      ),
    ],
    tip: l4(
      "Getrocknete Pilze wiegen fast nichts und geben mehr Aroma als frische – perfekt fürs Gepäck.",
      "Les champignons séchés ne pèsent presque rien et donnent plus d'arôme que les frais – parfait pour les bagages.",
      "I funghi secchi non pesano quasi nulla e danno più aroma di quelli freschi – perfetti per il bagaglio.",
      "Dried mushrooms weigh almost nothing and give more flavour than fresh ones – perfect for your luggage."
    ),
  },
  {
    id: "curry-kokos",
    image: img_rezept_curry_kokos,
    name: l4(
      "Gemüse-Kokos-Curry",
      "Curry de légumes au lait de coco",
      "Curry di verdure al cocco",
      "Vegetable coconut curry"
    ),
    method: "Gaskocher",
    timeMinutes: 25,
    servings: 4,
    difficulty: "einfach",
    onePot: true,
    kidFriendly: true,
    ingredients: [
      l4("Kokosmilch", "Lait de coco", "Latte di cocco", "Coconut milk"),
      l4("Currypaste", "Pâte de curry", "Pasta di curry", "Curry paste"),
      l4("Reis", "Riz", "Riso", "Rice"),
      l4("Rüebli", "Carottes", "Carote", "Carrots"),
      l4("Zucchetti", "Courgettes", "Zucchine", "Courgettes"),
      l4("Peperoni", "Poivrons", "Peperoni", "Peppers"),
      l4("Zwiebel", "Oignon", "Cipolla", "Onion"),
    ],
    steps: [
      l4(
        "Reis in Salzwasser kochen und beiseitestellen (oder Schnellkoch-Reis verwenden).",
        "Cuire le riz à l'eau salée et le réserver (ou utiliser du riz à cuisson rapide).",
        "Cuoci il riso in acqua salata e mettilo da parte (o usa riso a cottura rapida).",
        "Cook the rice in salted water and set aside (or use quick-cook rice)."
      ),
      l4(
        "Gemüse in Stücke schneiden und mit der Zwiebel kurz anbraten.",
        "Couper les légumes en morceaux et les faire revenir brièvement avec l'oignon.",
        "Taglia le verdure a pezzi e falle rosolare brevemente con la cipolla.",
        "Cut the vegetables into pieces and briefly fry them with the onion."
      ),
      l4(
        "Currypaste zugeben, mit Kokosmilch ablöschen und 10 Minuten köcheln lassen.",
        "Ajouter la pâte de curry, déglacer au lait de coco et laisser mijoter 10 minutes.",
        "Aggiungi la pasta di curry, sfuma con il latte di cocco e lascia sobbollire per 10 minuti.",
        "Add the curry paste, pour in the coconut milk and simmer for 10 minutes."
      ),
      l4(
        "Mit dem Reis servieren – fertig ist das Camp-Curry.",
        "Servir avec le riz – le curry du camp est prêt.",
        "Servi con il riso – il curry da campo è pronto.",
        "Serve with the rice – your camp curry is ready."
      ),
    ],
    tip: l4(
      "Für Kinder milde Currypaste verwenden und Schärfe erst am Tisch nachwürzen.",
      "Pour les enfants, utilise une pâte de curry douce et relève seulement à table.",
      "Per i bambini usa una pasta di curry delicata e aggiungi il piccante solo a tavola.",
      "For children, use a mild curry paste and add heat only at the table."
    ),
  },
  {
    id: "steckerlfisch",
    image: img_rezept_steckerlfisch,
    name: l4(
      "Fisch am Stecken",
      "Poisson au bâton",
      "Pesce allo spiedo",
      "Fish on a stick"
    ),
    method: "Offenes Feuer",
    timeMinutes: 30,
    servings: 2,
    difficulty: "mittel",
    onePot: false,
    kidFriendly: false,
    ingredients: [
      l4(
        "Forelle (ausgenommen)",
        "Truite (vidée)",
        "Trota (eviscerata)",
        "Trout (gutted)"
      ),
      l4("Zitrone", "Citron", "Limone", "Lemon"),
      l4("Kräuter", "Herbes", "Erbe aromatiche", "Herbs"),
      l4("Salz", "Sel", "Sale", "Salt"),
      l4("Butter", "Beurre", "Burro", "Butter"),
    ],
    steps: [
      l4(
        "Forelle innen und aussen salzen, mit Zitronenscheiben und Kräutern füllen.",
        "Saler la truite à l'intérieur et à l'extérieur, la farcir de rondelles de citron et d'herbes.",
        "Sala la trota dentro e fuori, farciscila con fette di limone ed erbe.",
        "Salt the trout inside and out and fill it with lemon slices and herbs."
      ),
      l4(
        "Fisch der Länge nach auf einen stabilen, entrindeten Stecken stecken.",
        "Embrocher le poisson dans la longueur sur un bâton solide et écorcé.",
        "Infila il pesce per il lungo su un bastone robusto e scortecciato.",
        "Skewer the fish lengthways on a sturdy, debarked stick."
      ),
      l4(
        "Über der Glut (nicht in der Flamme) unter gelegentlichem Drehen 15–20 Minuten garen.",
        "Cuire 15–20 minutes au-dessus des braises (pas dans la flamme) en tournant de temps en temps.",
        "Cuoci sopra la brace (non nella fiamma) per 15–20 minuti girando di tanto in tanto.",
        "Cook over the embers (not in the flame) for 15–20 minutes, turning occasionally."
      ),
      l4(
        "Mit zerlassener Butter bestreichen und direkt vom Stecken essen.",
        "Badigeonner de beurre fondu et manger directement sur le bâton.",
        "Spennella con burro fuso e mangia direttamente dal bastone.",
        "Brush with melted butter and eat straight from the stick."
      ),
    ],
    tip: l4(
      "Die Haut schützt das Fleisch – sie darf ruhig dunkel werden. Gar ist der Fisch, wenn sich die Rückenflosse leicht ziehen lässt.",
      "La peau protège la chair – elle peut foncer sans problème. Le poisson est cuit quand la nageoire dorsale se détache facilement.",
      "La pelle protegge la carne – può tranquillamente scurirsi. Il pesce è cotto quando la pinna dorsale si stacca facilmente.",
      "The skin protects the flesh – it's fine if it darkens. The fish is done when the dorsal fin pulls out easily."
    ),
  },
  {
    id: "pfannen-pizza",
    image: img_rezept_pfannen_pizza,
    name: l4(
      "Pfannen-Pizza",
      "Pizza à la poêle",
      "Pizza in padella",
      "Pan pizza"
    ),
    method: "Gaskocher",
    timeMinutes: 20,
    servings: 2,
    difficulty: "einfach",
    onePot: true,
    kidFriendly: true,
    ingredients: [
      l4(
        "Fertig-Pizzateig",
        "Pâte à pizza prête à l'emploi",
        "Pasta per pizza pronta",
        "Ready-made pizza dough"
      ),
      l4("Tomatensauce", "Sauce tomate", "Salsa di pomodoro", "Tomato sauce"),
      l4("Käse", "Fromage", "Formaggio", "Cheese"),
      l4(
        "Salami oder Gemüse",
        "Salami ou légumes",
        "Salame o verdure",
        "Salami or vegetables"
      ),
      l4("Olivenöl", "Huile d'olive", "Olio d'oliva", "Olive oil"),
    ],
    steps: [
      l4(
        "Teig auf Pfannengrösse zuschneiden und die Pfanne mit Öl auspinseln.",
        "Découper la pâte à la taille de la poêle et badigeonner la poêle d'huile.",
        "Ritaglia la pasta alla misura della padella e spennella la padella con l'olio.",
        "Cut the dough to the size of the pan and brush the pan with oil."
      ),
      l4(
        "Teig bei mittlerer Hitze 3–4 Minuten anbacken, dann wenden.",
        "Précuire la pâte 3–4 minutes à feu moyen, puis la retourner.",
        "Cuoci la pasta a fuoco medio per 3–4 minuti, poi girala.",
        "Cook the dough over medium heat for 3–4 minutes, then flip it."
      ),
      l4(
        "Sauce, Käse und Belag auf die gebackene Seite geben.",
        "Répartir la sauce, le fromage et la garniture sur la face cuite.",
        "Distribuisci salsa, formaggio e condimento sul lato già cotto.",
        "Spread the sauce, cheese and toppings on the cooked side."
      ),
      l4(
        "Deckel drauf und 6–8 Minuten backen, bis der Käse geschmolzen ist.",
        "Couvrir et cuire 6–8 minutes, jusqu'à ce que le fromage soit fondu.",
        "Copri con il coperchio e cuoci per 6–8 minuti, finché il formaggio è fuso.",
        "Put the lid on and bake for 6–8 minutes until the cheese has melted."
      ),
    ],
    tip: l4(
      "Der Deckel ist entscheidend – er staut die Hitze wie ein Ofen. Kinder belegen ihre Hälfte am liebsten selbst.",
      "Le couvercle est décisif – il retient la chaleur comme un four. Les enfants adorent garnir leur moitié eux-mêmes.",
      "Il coperchio è decisivo – trattiene il calore come un forno. I bambini adorano farcire da soli la loro metà.",
      "The lid is crucial – it traps the heat like an oven. Children love topping their own half."
    ),
  },
  {
    id: "camp-minestrone",
    image: img_rezept_minestrone,
    name: l4(
      "Camp-Minestrone",
      "Minestrone du camp",
      "Minestrone da campo",
      "Camp minestrone"
    ),
    method: "Beides",
    timeMinutes: 30,
    servings: 4,
    difficulty: "einfach",
    onePot: true,
    kidFriendly: true,
    ingredients: [
      l4("Bouillon", "Bouillon", "Brodo", "Stock"),
      l4("Teigwaren", "Pâtes", "Pasta", "Pasta"),
      l4("Rüebli", "Carottes", "Carote", "Carrots"),
      l4("Sellerie", "Céleri", "Sedano", "Celery"),
      l4(
        "Tomaten (Dose)",
        "Tomates (boîte)",
        "Pomodori (scatola)",
        "Tomatoes (tin)"
      ),
      l4(
        "Weisse Bohnen (Dose)",
        "Haricots blancs (boîte)",
        "Fagioli bianchi (scatola)",
        "White beans (tin)"
      ),
      l4("Parmesan", "Parmesan", "Parmigiano", "Parmesan"),
      l4("Öl", "Huile", "Olio", "Oil"),
    ],
    steps: [
      l4(
        "Gemüse klein schneiden und in etwas Öl andünsten.",
        "Couper les légumes en petits morceaux et les faire suer dans un peu d'huile.",
        "Taglia le verdure a pezzetti e falle appassire in un po' d'olio.",
        "Chop the vegetables into small pieces and sweat them in a little oil."
      ),
      l4(
        "Mit Bouillon und Dosentomaten ablöschen und 10 Minuten köcheln lassen.",
        "Déglacer avec le bouillon et les tomates en boîte et laisser mijoter 10 minutes.",
        "Sfuma con il brodo e i pomodori in scatola e lascia sobbollire per 10 minuti.",
        "Pour in the stock and tinned tomatoes and simmer for 10 minutes."
      ),
      l4(
        "Teigwaren und abgetropfte Bohnen zugeben, weitere 10 Minuten kochen.",
        "Ajouter les pâtes et les haricots égouttés, cuire encore 10 minutes.",
        "Aggiungi la pasta e i fagioli scolati, cuoci per altri 10 minuti.",
        "Add the pasta and drained beans and cook for another 10 minutes."
      ),
      l4(
        "Mit Parmesan bestreuen und heiss servieren.",
        "Parsemer de parmesan et servir bien chaud.",
        "Spolvera con il parmigiano e servi ben caldo.",
        "Sprinkle with Parmesan and serve hot."
      ),
    ],
    tip: l4(
      "Wärmt an kühlen Abenden durch und verwertet Gemüsereste aus der Kühlbox.",
      "Réchauffe bien les soirs frais et utilise les restes de légumes de la glacière.",
      "Riscalda nelle serate fresche e ricicla gli avanzi di verdure del frigo box.",
      "Warms you through on cool evenings and uses up leftover vegetables from the cool box."
    ),
  },
  {
    id: "apfel-zimt-glut",
    image: img_rezept_apfel_zimt,
    name: l4(
      "Apfel-Zimt-Päckli aus der Glut",
      "Papillotes pomme-cannelle à la braise",
      "Pacchetti mela e cannella dalla brace",
      "Apple and cinnamon parcels from the embers"
    ),
    method: "Offenes Feuer",
    timeMinutes: 15,
    servings: 4,
    difficulty: "einfach",
    onePot: false,
    kidFriendly: true,
    ingredients: [
      l4("Äpfel", "Pommes", "Mele", "Apples"),
      l4("Zimt", "Cannelle", "Cannella", "Cinnamon"),
      l4("Zucker", "Sucre", "Zucchero", "Sugar"),
      l4("Butter", "Beurre", "Burro", "Butter"),
      l4("Rosinen", "Raisins secs", "Uvetta", "Raisins"),
      l4("Alufolie", "Papier alu", "Foglio di alluminio", "Aluminium foil"),
    ],
    steps: [
      l4(
        "Äpfel entkernen und in dicke Ringe schneiden.",
        "Évider les pommes et les couper en rondelles épaisses.",
        "Togli il torsolo alle mele e tagliale a rondelle spesse.",
        "Core the apples and cut them into thick rings."
      ),
      l4(
        "Mit Zimt, Zucker, Butterflöckli und Rosinen bestreuen.",
        "Parsemer de cannelle, de sucre, de noisettes de beurre et de raisins secs.",
        "Cospargi con cannella, zucchero, fiocchetti di burro e uvetta.",
        "Sprinkle with cinnamon, sugar, small knobs of butter and raisins."
      ),
      l4(
        "In Alufolie einpacken und 10 Minuten in die Randglut legen.",
        "Emballer dans du papier alu et poser 10 minutes en bordure des braises.",
        "Avvolgi nella stagnola e metti sul bordo della brace per 10 minuti.",
        "Wrap in foil and place in the embers at the edge of the fire for 10 minutes."
      ),
      l4(
        "Vorsichtig öffnen (heiss!) und lauwarm geniessen.",
        "Ouvrir avec précaution (c'est chaud!) et déguster tiède.",
        "Apri con attenzione (scotta!) e gusta tiepido.",
        "Open carefully (hot!) and enjoy lukewarm."
      ),
    ],
    tip: l4(
      "Schmeckt wie Apfelstrudel ohne Teig – das perfekte Herbst-Dessert am Feuer.",
      "Un goût de strudel aux pommes sans pâte – le dessert d'automne parfait au coin du feu.",
      "Sa di strudel di mele senza pasta – il dessert autunnale perfetto accanto al fuoco.",
      "Tastes like apple strudel without the pastry – the perfect autumn dessert by the fire."
    ),
  },
  {
    id: "birchermuesli-overnight",
    name: l4(
      "Overnight-Birchermüesli",
      "Birchermüesli de la veille",
      "Birchermüesli della notte",
      "Overnight Bircher muesli"
    ),
    method: "Beides",
    timeMinutes: 10,
    servings: 4,
    difficulty: "einfach",
    onePot: false,
    kidFriendly: true,
    ingredients: [
      l4(
        "200 g Haferflocken",
        "200 g de flocons d'avoine",
        "200 g di fiocchi d'avena",
        "200 g rolled oats"
      ),
      l4("4 dl Milch", "4 dl de lait", "4 dl di latte", "400 ml milk"),
      l4("2 Äpfel", "2 pommes", "2 mele", "2 apples"),
      l4(
        "2 EL Honig",
        "2 c. à s. de miel",
        "2 cucchiai di miele",
        "2 tbsp honey"
      ),
      l4(
        "1 Handvoll Nüsse",
        "1 poignée de noix",
        "1 manciata di noci",
        "1 handful of nuts"
      ),
      l4(
        "Beeren nach Saison",
        "Baies de saison",
        "Frutti di bosco di stagione",
        "Seasonal berries"
      ),
      l4(
        "1 Zitrone (Saft)",
        "1 citron (jus)",
        "1 limone (succo)",
        "1 lemon (juice)"
      ),
    ],
    steps: [
      l4(
        "Am Vorabend Haferflocken, Milch und Honig in einer Dose mit Deckel verrühren.",
        "La veille au soir, mélanger les flocons d'avoine, le lait et le miel dans une boîte avec couvercle.",
        "La sera prima mescola fiocchi d'avena, latte e miele in un contenitore con coperchio.",
        "The evening before, stir the oats, milk and honey together in a container with a lid."
      ),
      l4(
        "Zugedeckt über Nacht in die Kühlbox stellen.",
        "Couvrir et laisser reposer toute la nuit dans la glacière.",
        "Copri e lascia riposare tutta la notte nel frigo box.",
        "Cover and leave overnight in the cool box."
      ),
      l4(
        "Am Morgen die Äpfel grob reiben oder fein schneiden und mit dem Zitronensaft untermischen.",
        "Le matin, râper grossièrement ou couper finement les pommes et les incorporer avec le jus de citron.",
        "Al mattino grattugia grossolanamente o taglia finemente le mele e incorporale con il succo di limone.",
        "In the morning, coarsely grate or finely chop the apples and stir them in with the lemon juice."
      ),
      l4(
        "Mit Nüssen und Beeren anrichten.",
        "Garnir de noix et de baies.",
        "Completa con noci e frutti di bosco.",
        "Top with nuts and berries."
      ),
    ],
    tip: l4(
      "Ganz ohne Kochen und Gas – das Frühstück wartet fertig in der Kühlbox, wenn der Rest des Camps noch schläft.",
      "Sans cuisson ni gaz – le petit-déjeuner attend tout prêt dans la glacière pendant que le reste du camp dort encore.",
      "Senza cottura né gas – la colazione aspetta già pronta nel frigo box mentre il resto del campo dorme ancora.",
      "No cooking, no gas – breakfast is waiting ready in the cool box while the rest of the camp is still asleep."
    ),
  },
  {
    id: "camping-pancakes",
    name: l4(
      "Camping-Pancakes",
      "Pancakes du camping",
      "Pancake da campeggio",
      "Camping pancakes"
    ),
    method: "Gaskocher",
    timeMinutes: 25,
    servings: 4,
    difficulty: "einfach",
    onePot: true,
    kidFriendly: true,
    ingredients: [
      l4("300 g Mehl", "300 g de farine", "300 g di farina", "300 g flour"),
      l4("3 Eier", "3 œufs", "3 uova", "3 eggs"),
      l4("4 dl Milch", "4 dl de lait", "4 dl di latte", "400 ml milk"),
      l4(
        "2 EL Zucker",
        "2 c. à s. de sucre",
        "2 cucchiai di zucchero",
        "2 tbsp sugar"
      ),
      l4(
        "1 TL Backpulver",
        "1 c. à c. de poudre à lever",
        "1 cucchiaino di lievito in polvere",
        "1 tsp baking powder"
      ),
      l4(
        "1 Prise Salz",
        "1 pincée de sel",
        "1 pizzico di sale",
        "1 pinch of salt"
      ),
      l4(
        "Butter zum Braten",
        "Beurre pour la cuisson",
        "Burro per la cottura",
        "Butter for frying"
      ),
      l4(
        "Ahornsirup oder Konfitüre",
        "Sirop d'érable ou confiture",
        "Sciroppo d'acero o confettura",
        "Maple syrup or jam"
      ),
    ],
    steps: [
      l4(
        "Mehl, Zucker, Backpulver und Salz mischen, Eier und Milch zugeben und zu einem glatten Teig rühren.",
        "Mélanger la farine, le sucre, la poudre à lever et le sel, ajouter les œufs et le lait et travailler en une pâte lisse.",
        "Mescola farina, zucchero, lievito e sale, aggiungi uova e latte e lavora fino a ottenere una pastella liscia.",
        "Mix the flour, sugar, baking powder and salt, add the eggs and milk and stir into a smooth batter."
      ),
      l4(
        "Teig 10 Minuten ruhen lassen.",
        "Laisser reposer la pâte 10 minutes.",
        "Lascia riposare la pastella per 10 minuti.",
        "Let the batter rest for 10 minutes."
      ),
      l4(
        "Kleine Portionen in der Butterpfanne bei mittlerer Hitze je Seite 2–3 Minuten backen, bis Bläschen aufsteigen und die Unterseite goldbraun ist.",
        "Cuire de petites portions dans la poêle beurrée à feu moyen, 2–3 minutes par face, jusqu'à ce que des bulles se forment et que le dessous soit doré.",
        "Cuoci piccole porzioni nella padella imburrata a fuoco medio, 2–3 minuti per lato, finché si formano bollicine e il lato sotto è dorato.",
        "Fry small portions in the buttered pan over medium heat for 2–3 minutes per side, until bubbles rise and the underside is golden."
      ),
      l4(
        "Fertige Pancakes unter einem Teller warm halten und mit Ahornsirup oder Konfitüre servieren.",
        "Garder les pancakes au chaud sous une assiette et les servir avec du sirop d'érable ou de la confiture.",
        "Tieni i pancake in caldo sotto un piatto e servili con sciroppo d'acero o confettura.",
        "Keep the finished pancakes warm under a plate and serve with maple syrup or jam."
      ),
    ],
    tip: l4(
      "Den Teig zu Hause mischen und in einer sauberen Flasche mitnehmen – am Camp nur noch schütteln und braten.",
      "Prépare la pâte à la maison et emporte-la dans une bouteille propre – au camp, il ne reste qu'à secouer et cuire.",
      "Prepara la pastella a casa e portala in una bottiglia pulita – al campo basta agitare e cuocere.",
      "Mix the batter at home and take it along in a clean bottle – at camp, just shake and fry."
    ),
  },
  {
    id: "roesti-spiegelei",
    name: l4(
      "Rösti mit Spiegelei",
      "Rösti et œuf au plat",
      "Rösti con uovo al tegamino",
      "Rösti with fried egg"
    ),
    method: "Gaskocher",
    timeMinutes: 35,
    servings: 4,
    difficulty: "mittel",
    onePot: true,
    kidFriendly: true,
    ingredients: [
      l4(
        "1 kg festkochende Kartoffeln (am Vortag gekocht)",
        "1 kg de pommes de terre à chair ferme (cuites la veille)",
        "1 kg di patate a pasta soda (lessate il giorno prima)",
        "1 kg waxy potatoes (boiled the day before)"
      ),
      l4("4 Eier", "4 œufs", "4 uova", "4 eggs"),
      l4("1 Zwiebel", "1 oignon", "1 cipolla", "1 onion"),
      l4(
        "3 EL Bratbutter",
        "3 c. à s. de beurre à rôtir",
        "3 cucchiai di burro chiarificato",
        "3 tbsp clarified butter"
      ),
      l4("Salz", "Sel", "Sale", "Salt"),
    ],
    steps: [
      l4(
        "Gekochte Kartoffeln schälen und grob reiben, Zwiebel fein hacken.",
        "Peler les pommes de terre cuites et les râper grossièrement, hacher finement l'oignon.",
        "Sbuccia le patate lessate e grattugiale grossolanamente, trita finemente la cipolla.",
        "Peel the boiled potatoes and grate them coarsely; finely chop the onion."
      ),
      l4(
        "Bratbutter in der Pfanne erhitzen, Kartoffeln und Zwiebel zugeben, salzen und zu einem Kuchen andrücken.",
        "Chauffer le beurre à rôtir dans la poêle, ajouter les pommes de terre et l'oignon, saler et presser en une galette.",
        "Scalda il burro chiarificato nella padella, aggiungi patate e cipolla, sala e pressa a forma di torta.",
        "Heat the clarified butter in the pan, add the potatoes and onion, season with salt and press into a cake."
      ),
      l4(
        "Bei mittlerer Hitze 10–12 Minuten braten, dann mit Hilfe eines Tellers wenden und die zweite Seite goldbraun braten.",
        "Cuire 10–12 minutes à feu moyen, puis retourner à l'aide d'une assiette et dorer la deuxième face.",
        "Cuoci a fuoco medio per 10–12 minuti, poi gira aiutandoti con un piatto e fai dorare il secondo lato.",
        "Fry over medium heat for 10–12 minutes, then flip with the help of a plate and brown the second side."
      ),
      l4(
        "Rösti in Stücke teilen, in derselben Pfanne die Spiegeleier braten und darauf anrichten.",
        "Partager le rösti, cuire les œufs au plat dans la même poêle et les dresser dessus.",
        "Dividi il rösti in porzioni, cuoci le uova al tegamino nella stessa padella e adagiale sopra.",
        "Divide the rösti into portions, fry the eggs in the same pan and serve them on top."
      ),
    ],
    tip: l4(
      "Die Kartoffeln am Vorabend kochen und über Nacht ausdämpfen lassen – so lassen sie sich am Morgen perfekt reiben.",
      "Cuire les pommes de terre la veille et les laisser sécher toute la nuit – elles se râpent parfaitement le matin.",
      "Lessa le patate la sera prima e lasciale asciugare tutta la notte – al mattino si grattugiano perfettamente.",
      "Boil the potatoes the evening before and let them dry out overnight – they grate perfectly in the morning."
    ),
  },
  {
    id: "ghackets-hoernli",
    name: l4(
      "Ghackets mit Hörnli",
      "Viande hachée et cornettes",
      "Carne macinata con cornetti",
      "Swiss mince with macaroni"
    ),
    method: "Gaskocher",
    timeMinutes: 30,
    servings: 4,
    difficulty: "einfach",
    onePot: false,
    kidFriendly: true,
    ingredients: [
      l4(
        "400 g Rindshackfleisch",
        "400 g de viande de bœuf hachée",
        "400 g di carne di manzo macinata",
        "400 g minced beef"
      ),
      l4(
        "400 g Hörnli",
        "400 g de cornettes",
        "400 g di cornetti (pasta)",
        "400 g macaroni"
      ),
      l4("1 Zwiebel", "1 oignon", "1 cipolla", "1 onion"),
      l4(
        "2 EL Tomatenpüree",
        "2 c. à s. de purée de tomates",
        "2 cucchiai di concentrato di pomodoro",
        "2 tbsp tomato purée"
      ),
      l4("2 dl Bouillon", "2 dl de bouillon", "2 dl di brodo", "200 ml stock"),
      l4("Öl", "Huile", "Olio", "Oil"),
      l4("Salz und Pfeffer", "Sel et poivre", "Sale e pepe", "Salt and pepper"),
      l4("Apfelmus", "Compote de pommes", "Composta di mele", "Apple sauce"),
    ],
    steps: [
      l4(
        "Zwiebel hacken und im Topf mit Öl anbraten, Hackfleisch zugeben und krümelig braten.",
        "Hacher l'oignon et le faire revenir dans la casserole avec de l'huile, ajouter la viande hachée et la faire revenir en l'émiettant.",
        "Trita la cipolla e falla rosolare nella pentola con l'olio, aggiungi la carne macinata e falla rosolare sbriciolandola.",
        "Chop the onion and fry it in the pot with oil, then add the mince and fry until crumbly."
      ),
      l4(
        "Tomatenpüree kurz mitrösten, mit Bouillon ablöschen und 10 Minuten köcheln lassen, mit Salz und Pfeffer würzen.",
        "Faire revenir brièvement la purée de tomates, déglacer au bouillon et laisser mijoter 10 minutes, assaisonner de sel et de poivre.",
        "Tosta brevemente il concentrato di pomodoro, sfuma con il brodo e lascia sobbollire per 10 minuti, condisci con sale e pepe.",
        "Briefly toast the tomato purée, pour in the stock and simmer for 10 minutes; season with salt and pepper."
      ),
      l4(
        "Hörnli im zweiten Topf in Salzwasser al dente kochen und abgiessen.",
        "Cuire les cornettes al dente à l'eau salée dans la deuxième casserole et les égoutter.",
        "Cuoci i cornetti al dente in acqua salata nella seconda pentola e scolali.",
        "Cook the macaroni al dente in salted water in the second pot and drain."
      ),
      l4(
        "Hörnli mit dem Ghackten mischen und mit Apfelmus servieren.",
        "Mélanger les cornettes avec la viande hachée et servir avec la compote de pommes.",
        "Mescola i cornetti con la carne e servi con la composta di mele.",
        "Mix the macaroni with the mince and serve with apple sauce."
      ),
    ],
    tip: l4(
      "Der Zmittag-Klassiker der Schweizer Küche – mit geriebenem Käse darüber wird er noch feiner.",
      "Le grand classique suisse de midi – encore meilleur avec du fromage râpé par-dessus.",
      "Il classico svizzero di mezzogiorno – ancora più buono con formaggio grattugiato sopra.",
      "The Swiss lunchtime classic – even better with grated cheese on top."
    ),
  },
  {
    id: "forellen-paeckli",
    name: l4(
      "Forellen-Päckli aus der Glut",
      "Papillotes de truite à la braise",
      "Pacchetti di trota dalla brace",
      "Trout parcels from the embers"
    ),
    method: "Offenes Feuer",
    timeMinutes: 30,
    servings: 4,
    difficulty: "mittel",
    onePot: false,
    kidFriendly: false,
    ingredients: [
      l4(
        "4 Forellen (ausgenommen)",
        "4 truites (vidées)",
        "4 trote (eviscerate)",
        "4 trout (gutted)"
      ),
      l4("1 Zitrone", "1 citron", "1 limone", "1 lemon"),
      l4(
        "Frische Kräuter (Petersilie, Thymian)",
        "Herbes fraîches (persil, thym)",
        "Erbe fresche (prezzemolo, timo)",
        "Fresh herbs (parsley, thyme)"
      ),
      l4(
        "4 EL Butter",
        "4 c. à s. de beurre",
        "4 cucchiai di burro",
        "4 tbsp butter"
      ),
      l4("Salz und Pfeffer", "Sel et poivre", "Sale e pepe", "Salt and pepper"),
      l4("Alufolie", "Papier alu", "Foglio di alluminio", "Aluminium foil"),
    ],
    steps: [
      l4(
        "Forellen waschen, trocken tupfen und innen wie aussen salzen und pfeffern.",
        "Laver les truites, les sécher en tamponnant et les saler et poivrer à l'intérieur comme à l'extérieur.",
        "Lava le trote, asciugale tamponando e condiscile con sale e pepe dentro e fuori.",
        "Wash the trout, pat dry and season with salt and pepper inside and out."
      ),
      l4(
        "Mit Zitronenscheiben, Kräutern und Butterflöckli füllen und einzeln in zwei Lagen Alufolie fest einwickeln.",
        "Les farcir de rondelles de citron, d'herbes et de noisettes de beurre et les emballer une à une, bien serrées, dans deux couches de papier alu.",
        "Farciscile con fette di limone, erbe e fiocchetti di burro e avvolgile una a una, ben strette, in due strati di stagnola.",
        "Fill with lemon slices, herbs and small knobs of butter and wrap each one tightly in two layers of foil."
      ),
      l4(
        "Päckli 12–15 Minuten in die Randglut legen und einmal wenden.",
        "Poser les papillotes 12–15 minutes en bordure des braises et les retourner une fois.",
        "Metti i pacchetti sul bordo della brace per 12–15 minuti e girali una volta.",
        "Place the parcels in the embers at the edge of the fire for 12–15 minutes, turning once."
      ),
      l4(
        "Vorsichtig öffnen (heisser Dampf!) – der Fisch ist gar, wenn sich das Fleisch leicht von der Gräte löst.",
        "Ouvrir avec précaution (vapeur brûlante!) – le poisson est cuit quand la chair se détache facilement de l'arête.",
        "Apri con attenzione (vapore bollente!) – il pesce è cotto quando la carne si stacca facilmente dalla lisca.",
        "Open carefully (hot steam!) – the fish is done when the flesh comes away easily from the bone."
      ),
    ],
    tip: l4(
      "Funktioniert auch mit Saibling oder Eglifilets – Filets brauchen nur gut 8 Minuten in der Glut.",
      "Fonctionne aussi avec de l'omble ou des filets de perche – les filets ne demandent que 8 bonnes minutes dans la braise.",
      "Funziona anche con salmerino o filetti di pesce persico – i filetti richiedono solo 8 minuti abbondanti nella brace.",
      "Also works with char or perch fillets – fillets need only a good 8 minutes in the embers."
    ),
  },
  {
    id: "maiskolben-glut",
    name: l4(
      "Maiskolben mit Kräuterbutter",
      "Épis de maïs au beurre aux herbes",
      "Pannocchie con burro alle erbe",
      "Corn on the cob with herb butter"
    ),
    method: "Offenes Feuer",
    timeMinutes: 25,
    servings: 4,
    difficulty: "einfach",
    onePot: false,
    kidFriendly: true,
    ingredients: [
      l4("4 Maiskolben", "4 épis de maïs", "4 pannocchie", "4 corn cobs"),
      l4("80 g Butter", "80 g de beurre", "80 g di burro", "80 g butter"),
      l4(
        "Frische Kräuter (Schnittlauch, Petersilie)",
        "Herbes fraîches (ciboulette, persil)",
        "Erbe fresche (erba cipollina, prezzemolo)",
        "Fresh herbs (chives, parsley)"
      ),
      l4("Salz", "Sel", "Sale", "Salt"),
      l4("Alufolie", "Papier alu", "Foglio di alluminio", "Aluminium foil"),
    ],
    steps: [
      l4(
        "Weiche Butter mit gehackten Kräutern und Salz verrühren.",
        "Mélanger le beurre mou avec les herbes hachées et le sel.",
        "Mescola il burro morbido con le erbe tritate e il sale.",
        "Mix the soft butter with the chopped herbs and salt."
      ),
      l4(
        "Maiskolben schälen und mit je einem Klecks Kräuterbutter in Alufolie wickeln.",
        "Éplucher les épis et les emballer dans du papier alu avec une noix de beurre aux herbes chacun.",
        "Pulisci le pannocchie e avvolgile nella stagnola con una noce di burro alle erbe ciascuna.",
        "Husk the cobs and wrap each in foil with a knob of herb butter."
      ),
      l4(
        "In der Randglut 15–20 Minuten garen, dabei mehrmals drehen.",
        "Cuire 15–20 minutes en bordure des braises en tournant plusieurs fois.",
        "Cuoci sul bordo della brace per 15–20 minuti girando più volte.",
        "Cook in the embers at the edge of the fire for 15–20 minutes, turning several times."
      ),
      l4(
        "Auspacken, mit der restlichen Kräuterbutter bestreichen und nachsalzen.",
        "Déballer, badigeonner du reste de beurre aux herbes et rectifier le sel.",
        "Scarta, spennella con il burro alle erbe rimasto e aggiusta di sale.",
        "Unwrap, brush with the remaining herb butter and season with a little more salt."
      ),
    ],
    tip: l4(
      "Ohne Folie direkt auf dem Rost werden die Kolben leicht rauchig und knusprig – dafür öfter drehen.",
      "Sans papier alu, directement sur la grille, les épis deviennent légèrement fumés et croustillants – il faut alors tourner plus souvent.",
      "Senza stagnola, direttamente sulla griglia, le pannocchie diventano leggermente affumicate e croccanti – in tal caso girale più spesso.",
      "Without foil, straight on the grate, the cobs turn lightly smoky and crisp – just turn them more often."
    ),
  },
  {
    id: "poulet-reis-pfanne",
    name: l4(
      "One-Pot-Reispfanne mit Poulet",
      "Poêlée de riz au poulet en une casserole",
      "Riso al pollo in pentola unica",
      "One-pot chicken and rice"
    ),
    method: "Gaskocher",
    timeMinutes: 35,
    servings: 4,
    difficulty: "mittel",
    onePot: true,
    kidFriendly: true,
    ingredients: [
      l4(
        "500 g Pouletbrust",
        "500 g de blanc de poulet",
        "500 g di petto di pollo",
        "500 g chicken breast"
      ),
      l4("300 g Reis", "300 g de riz", "300 g di riso", "300 g rice"),
      l4("1 Peperoni", "1 poivron", "1 peperone", "1 pepper"),
      l4("1 Zwiebel", "1 oignon", "1 cipolla", "1 onion"),
      l4(
        "2 Knoblauchzehen",
        "2 gousses d'ail",
        "2 spicchi d'aglio",
        "2 cloves of garlic"
      ),
      l4(
        "1 TL Paprikapulver",
        "1 c. à c. de paprika",
        "1 cucchiaino di paprica",
        "1 tsp paprika"
      ),
      l4("7 dl Bouillon", "7 dl de bouillon", "7 dl di brodo", "700 ml stock"),
      l4(
        "Erbsen (Dose oder TK)",
        "Petits pois (boîte ou surgelés)",
        "Piselli (scatola o surgelati)",
        "Peas (tinned or frozen)"
      ),
      l4("Öl", "Huile", "Olio", "Oil"),
    ],
    steps: [
      l4(
        "Poulet würfeln und im Topf mit Öl rundum anbraten, dann herausnehmen.",
        "Couper le poulet en dés et le faire dorer de tous côtés dans la casserole avec de l'huile, puis le retirer.",
        "Taglia il pollo a dadini e fallo rosolare da tutti i lati nella pentola con l'olio, poi toglilo.",
        "Dice the chicken and brown it all over in the pot with oil, then remove it."
      ),
      l4(
        "Zwiebel, Knoblauch und Peperoni-Würfel andünsten, Paprikapulver und Reis kurz mitrösten.",
        "Faire suer l'oignon, l'ail et les dés de poivron, torréfier brièvement le paprika et le riz avec.",
        "Fai appassire cipolla, aglio e peperone a dadini, tosta brevemente paprica e riso.",
        "Sweat the onion, garlic and diced pepper, briefly toasting the paprika and rice with them."
      ),
      l4(
        "Mit Bouillon ablöschen, Poulet zurückgeben und zugedeckt 15–18 Minuten leise köcheln, bis der Reis gar ist.",
        "Déglacer au bouillon, remettre le poulet et laisser mijoter doucement à couvert 15–18 minutes, jusqu'à ce que le riz soit cuit.",
        "Sfuma con il brodo, rimetti il pollo e lascia sobbollire coperto per 15–18 minuti, finché il riso è cotto.",
        "Pour in the stock, return the chicken and simmer gently, covered, for 15–18 minutes until the rice is done."
      ),
      l4(
        "Erbsen unterrühren, 2 Minuten ziehen lassen und abschmecken.",
        "Incorporer les petits pois, laisser reposer 2 minutes et rectifier l'assaisonnement.",
        "Incorpora i piselli, lascia riposare 2 minuti e aggiusta di sapore.",
        "Stir in the peas, let stand for 2 minutes and adjust the seasoning."
      ),
    ],
    tip: l4(
      "Nicht zu oft umrühren – so bildet sich am Topfboden eine feine Röstschicht wie bei einer Paella.",
      "Ne pas trop remuer – une fine croûte dorée se forme ainsi au fond de la casserole, comme pour une paella.",
      "Non mescolare troppo spesso – sul fondo della pentola si forma così una sottile crosticina dorata, come in una paella.",
      "Don't stir too often – a fine golden crust forms on the bottom of the pot, just like a paella."
    ),
  },
  {
    id: "raclette-pfaennli",
    name: l4(
      "Raclette aus der Pfanne",
      "Raclette à la poêle",
      "Raclette in padella",
      "Pan raclette"
    ),
    method: "Beides",
    timeMinutes: 30,
    servings: 4,
    difficulty: "einfach",
    onePot: false,
    kidFriendly: true,
    ingredients: [
      l4(
        "800 g kleine Kartoffeln",
        "800 g de petites pommes de terre",
        "800 g di patate piccole",
        "800 g small potatoes"
      ),
      l4(
        "400 g Raclettekäse",
        "400 g de fromage à raclette",
        "400 g di formaggio da raclette",
        "400 g raclette cheese"
      ),
      l4(
        "Essiggurken und Silberzwiebeln",
        "Cornichons et petits oignons au vinaigre",
        "Cetriolini e cipolline sott'aceto",
        "Gherkins and pickled onions"
      ),
      l4(
        "Pfeffer und Paprikapulver",
        "Poivre et paprika",
        "Pepe e paprica",
        "Pepper and paprika"
      ),
    ],
    steps: [
      l4(
        "Kartoffeln in der Schale in Salzwasser ca. 20 Minuten gar kochen (Gschwellti).",
        "Cuire les pommes de terre en robe env. 20 minutes à l'eau salée.",
        "Lessa le patate con la buccia in acqua salata per circa 20 minuti.",
        "Boil the potatoes in their skins in salted water for about 20 minutes."
      ),
      l4(
        "Käsescheiben portionsweise in der beschichteten Pfanne bei kleiner Hitze schmelzen – auf dem Kocher oder am Rand des Feuerrosts.",
        "Faire fondre les tranches de fromage par portions dans la poêle antiadhésive à feu doux – sur le réchaud ou au bord de la grille du feu.",
        "Fai fondere le fette di formaggio a porzioni nella padella antiaderente a fuoco basso – sul fornello o sul bordo della griglia del fuoco.",
        "Melt the cheese slices in batches in the non-stick pan over low heat – on the stove or at the edge of the fire grate."
      ),
      l4(
        "Den geschmolzenen Käse über die Kartoffeln ziehen und mit Pfeffer oder Paprika bestreuen.",
        "Racler le fromage fondu sur les pommes de terre et saupoudrer de poivre ou de paprika.",
        "Versa il formaggio fuso sulle patate e spolvera con pepe o paprica.",
        "Scrape the melted cheese over the potatoes and sprinkle with pepper or paprika."
      ),
      l4(
        "Mit Essiggurken und Silberzwiebeln servieren – und gleich die nächste Portion schmelzen.",
        "Servir avec les cornichons et les petits oignons – et faire fondre aussitôt la portion suivante.",
        "Servi con cetriolini e cipolline – e metti subito a fondere la porzione successiva.",
        "Serve with gherkins and pickled onions – and start melting the next batch straight away."
      ),
    ],
    tip: l4(
      "Mit einem Deckel schmilzt der Käse schneller und gleichmässiger – und das Camp duftet wie eine Skihütte.",
      "Avec un couvercle, le fromage fond plus vite et plus régulièrement – et le camp embaume comme un chalet de ski.",
      "Con un coperchio il formaggio fonde più in fretta e in modo uniforme – e il campo profuma come una baita.",
      "With a lid, the cheese melts faster and more evenly – and the camp smells like a ski chalet."
    ),
  },
  {
    id: "thon-wraps",
    name: l4(
      "Thon-Wraps ohne Kochen",
      "Wraps au thon sans cuisson",
      "Wrap al tonno senza cottura",
      "No-cook tuna wraps"
    ),
    method: "Beides",
    timeMinutes: 10,
    servings: 4,
    difficulty: "einfach",
    onePot: false,
    kidFriendly: true,
    ingredients: [
      l4(
        "4 Tortilla-Wraps",
        "4 tortillas (wraps)",
        "4 tortilla (wrap)",
        "4 tortilla wraps"
      ),
      l4(
        "2 Dosen Thon",
        "2 boîtes de thon",
        "2 scatolette di tonno",
        "2 tins of tuna"
      ),
      l4(
        "3 EL Mayonnaise",
        "3 c. à s. de mayonnaise",
        "3 cucchiai di maionese",
        "3 tbsp mayonnaise"
      ),
      l4(
        "1 kleine Dose Mais",
        "1 petite boîte de maïs",
        "1 scatoletta di mais",
        "1 small tin of sweetcorn"
      ),
      l4(
        "Salatblätter",
        "Feuilles de salade",
        "Foglie d'insalata",
        "Lettuce leaves"
      ),
      l4("1 Gurke", "1 concombre", "1 cetriolo", "1 cucumber"),
      l4("Pfeffer", "Poivre", "Pepe", "Pepper"),
    ],
    steps: [
      l4(
        "Thon abtropfen lassen und mit Mayonnaise, Mais und Pfeffer zu einer Creme mischen.",
        "Égoutter le thon et le mélanger avec la mayonnaise, le maïs et le poivre en une crème.",
        "Scola il tonno e mescolalo con maionese, mais e pepe fino a ottenere una crema.",
        "Drain the tuna and mix it with the mayonnaise, sweetcorn and pepper into a creamy filling."
      ),
      l4(
        "Wraps mit Salatblättern belegen und die Thon-Creme darauf verteilen.",
        "Garnir les tortillas de feuilles de salade et répartir la crème de thon dessus.",
        "Farcisci i wrap con le foglie d'insalata e distribuisci sopra la crema di tonno.",
        "Cover the wraps with lettuce leaves and spread the tuna filling on top."
      ),
      l4(
        "Gurkenstreifen darauflegen, die Seiten einschlagen und satt aufrollen.",
        "Ajouter des lamelles de concombre, rabattre les côtés et rouler bien serré.",
        "Aggiungi striscioline di cetriolo, ripiega i lati e arrotola ben stretto.",
        "Add cucumber strips, fold in the sides and roll up tightly."
      ),
      l4(
        "Halbieren und sofort essen – oder eingewickelt als Proviant auf die Wanderung mitnehmen.",
        "Couper en deux et déguster tout de suite – ou emballer comme provision pour la randonnée.",
        "Taglia a metà e mangia subito – oppure avvolgili come provvista per l'escursione.",
        "Cut in half and eat straight away – or wrap them up as provisions for a hike."
      ),
    ],
    tip: l4(
      "Die Rettung bei Regen und Feuerverbot: kein Kocher, kein Feuer, kein Abwasch.",
      "Le sauvetage en cas de pluie ou d'interdiction de feu: pas de réchaud, pas de feu, pas de vaisselle.",
      "La salvezza con la pioggia o il divieto di fuoco: niente fornello, niente fuoco, niente stoviglie da lavare.",
      "The lifesaver in rain or during fire bans: no stove, no fire, no washing-up."
    ),
  },
  {
    id: "grill-ananas",
    name: l4(
      "Grillierte Ananas mit Honig",
      "Ananas grillé au miel",
      "Ananas grigliato al miele",
      "Grilled pineapple with honey"
    ),
    method: "Offenes Feuer",
    timeMinutes: 15,
    servings: 4,
    difficulty: "einfach",
    onePot: false,
    kidFriendly: true,
    ingredients: [
      l4(
        "1 reife Ananas",
        "1 ananas mûr",
        "1 ananas maturo",
        "1 ripe pineapple"
      ),
      l4(
        "3 EL Honig",
        "3 c. à s. de miel",
        "3 cucchiai di miele",
        "3 tbsp honey"
      ),
      l4(
        "1 Limette (Saft)",
        "1 citron vert (jus)",
        "1 lime (succo)",
        "1 lime (juice)"
      ),
      l4(
        "1 Prise Zimt",
        "1 pincée de cannelle",
        "1 pizzico di cannella",
        "1 pinch of cinnamon"
      ),
    ],
    steps: [
      l4(
        "Ananas schälen, vierteln, den Strunk entfernen und in dicke Spalten schneiden.",
        "Peler l'ananas, le couper en quatre, retirer le cœur et détailler en quartiers épais.",
        "Sbuccia l'ananas, taglialo in quattro, elimina il torsolo e taglia a spicchi spessi.",
        "Peel the pineapple, quarter it, remove the core and cut into thick wedges."
      ),
      l4(
        "Honig mit Limettensaft und Zimt verrühren und die Spalten damit bepinseln.",
        "Mélanger le miel avec le jus de citron vert et la cannelle et en badigeonner les quartiers.",
        "Mescola il miele con il succo di lime e la cannella e spennella gli spicchi.",
        "Mix the honey with the lime juice and cinnamon and brush the wedges with it."
      ),
      l4(
        "Auf dem Rost über der Glut je Seite 3–4 Minuten grillieren, bis sich braune Röststreifen zeigen.",
        "Griller sur la grille au-dessus des braises 3–4 minutes par face, jusqu'à l'apparition de marques dorées.",
        "Griglia sulla griglia sopra la brace per 3–4 minuti per lato, finché compaiono le striature dorate.",
        "Grill on the grate over the embers for 3–4 minutes per side, until brown grill marks appear."
      ),
      l4(
        "Mit dem restlichen Honig beträufeln und warm geniessen.",
        "Arroser du reste de miel et déguster chaud.",
        "Irrora con il miele rimasto e gusta caldo.",
        "Drizzle with the remaining honey and enjoy warm."
      ),
    ],
    tip: l4(
      "Die Hitze karamellisiert den Fruchtzucker – die Ananas schmeckt doppelt so süss. Funktioniert auch am Spiess über dem Feuer.",
      "La chaleur caramélise le sucre du fruit – l'ananas devient deux fois plus doux. Fonctionne aussi en brochette au-dessus du feu.",
      "Il calore caramella lo zucchero della frutta – l'ananas diventa dolcissimo. Funziona anche allo spiedo sopra il fuoco.",
      "The heat caramelises the fruit sugar – the pineapple tastes twice as sweet. Also works on a skewer over the fire."
    ),
  },
  {
    id: "gerstensuppe",
    name: l4(
      "Bündner Gerstensuppe",
      "Soupe grisonne à l'orge",
      "Zuppa d'orzo grigionese",
      "Grisons barley soup"
    ),
    method: "Gaskocher",
    timeMinutes: 45,
    servings: 4,
    difficulty: "mittel",
    onePot: true,
    kidFriendly: true,
    ingredients: [
      l4(
        "150 g Rollgerste",
        "150 g d'orge perlé",
        "150 g di orzo perlato",
        "150 g pearl barley"
      ),
      l4(
        "100 g Speckwürfeli oder Bündnerfleisch",
        "100 g de lardons ou de viande des Grisons",
        "100 g di pancetta a dadini o carne secca dei Grigioni",
        "100 g diced bacon or Grisons air-dried beef"
      ),
      l4("2 Rüebli", "2 carottes", "2 carote", "2 carrots"),
      l4("1 Stange Lauch", "1 poireau", "1 porro", "1 leek"),
      l4(
        "1 Stück Sellerie",
        "1 morceau de céleri",
        "1 pezzo di sedano",
        "1 piece of celeriac"
      ),
      l4(
        "1,2 l Bouillon",
        "1,2 l de bouillon",
        "1,2 l di brodo",
        "1.2 l stock"
      ),
      l4("1 dl Rahm", "1 dl de crème", "1 dl di panna", "100 ml cream"),
      l4("Pfeffer", "Poivre", "Pepe", "Pepper"),
    ],
    steps: [
      l4(
        "Speck im Topf anbraten, das klein geschnittene Gemüse zugeben und kurz mitdünsten.",
        "Faire revenir les lardons dans la casserole, ajouter les légumes coupés en petits morceaux et les faire suer brièvement.",
        "Rosola la pancetta nella pentola, aggiungi le verdure tagliate a pezzetti e falle appassire brevemente.",
        "Fry the bacon in the pot, add the finely chopped vegetables and sweat them briefly."
      ),
      l4(
        "Gerste einrühren, mit Bouillon ablöschen und aufkochen.",
        "Incorporer l'orge, déglacer au bouillon et porter à ébullition.",
        "Incorpora l'orzo, sfuma con il brodo e porta a ebollizione.",
        "Stir in the barley, pour in the stock and bring to the boil."
      ),
      l4(
        "Zugedeckt 35–40 Minuten leise köcheln, bis die Gerste weich ist, ab und zu umrühren.",
        "Laisser mijoter doucement à couvert 35–40 minutes, jusqu'à ce que l'orge soit tendre, en remuant de temps en temps.",
        "Lascia sobbollire coperto per 35–40 minuti, finché l'orzo è morbido, mescolando di tanto in tanto.",
        "Simmer gently, covered, for 35–40 minutes until the barley is tender, stirring occasionally."
      ),
      l4(
        "Rahm unterrühren und mit Pfeffer abschmecken.",
        "Incorporer la crème et rectifier l'assaisonnement au poivre.",
        "Incorpora la panna e aggiusta di pepe.",
        "Stir in the cream and season with pepper."
      ),
    ],
    tip: l4(
      "Wärmt nach einem Regentag zuverlässig durch – und schmeckt am zweiten Tag fast noch besser: Reste einfach mit etwas Wasser aufkochen.",
      "Réchauffe à coup sûr après une journée de pluie – et elle est presque meilleure le lendemain: il suffit de réchauffer les restes avec un peu d'eau.",
      "Riscalda a colpo sicuro dopo una giornata di pioggia – e il giorno dopo è quasi più buona: basta riscaldare gli avanzi con un po' d'acqua.",
      "Reliably warms you up after a rainy day – and tastes almost better the next day: just reheat the leftovers with a little water."
    ),
  },
  {
    id: "fotzelschnitten",
    name: l4(
      "Fotzelschnitten",
      "Pain perdu (Fotzelschnitten)",
      "Fotzelschnitten (pane dorato)",
      "Fotzelschnitten (Swiss French toast)"
    ),
    method: "Gaskocher",
    timeMinutes: 15,
    servings: 4,
    difficulty: "einfach",
    onePot: true,
    kidFriendly: true,
    ingredients: [
      l4(
        "8 Scheiben altbackenes Brot oder Zopf",
        "8 tranches de pain rassis ou de tresse",
        "8 fette di pane raffermo o treccia",
        "8 slices of stale bread or plaited loaf"
      ),
      l4("3 Eier", "3 œufs", "3 uova", "3 eggs"),
      l4("2 dl Milch", "2 dl de lait", "2 dl di latte", "200 ml milk"),
      l4(
        "2 EL Zucker",
        "2 c. à s. de sucre",
        "2 cucchiai di zucchero",
        "2 tbsp sugar"
      ),
      l4(
        "1 TL Zimt",
        "1 c. à c. de cannelle",
        "1 cucchiaino di cannella",
        "1 tsp cinnamon"
      ),
      l4(
        "Butter zum Braten",
        "Beurre pour la cuisson",
        "Burro per la cottura",
        "Butter for frying"
      ),
    ],
    steps: [
      l4(
        "Eier, Milch und die Hälfte des Zuckers verquirlen.",
        "Battre les œufs avec le lait et la moitié du sucre.",
        "Sbatti le uova con il latte e metà dello zucchero.",
        "Whisk the eggs with the milk and half of the sugar."
      ),
      l4(
        "Brotscheiben kurz darin wenden und vollsaugen lassen.",
        "Tremper brièvement les tranches de pain et les laisser s'imbiber.",
        "Passa brevemente le fette di pane nel composto e lasciale impregnare.",
        "Briefly turn the bread slices in the mixture and let them soak it up."
      ),
      l4(
        "In der Butterpfanne beidseitig goldbraun braten.",
        "Dorer des deux côtés dans la poêle beurrée.",
        "Fai dorare da entrambi i lati nella padella imburrata.",
        "Fry in the buttered pan until golden brown on both sides."
      ),
      l4(
        "Zimt und restlichen Zucker mischen und die heissen Schnitten damit bestreuen.",
        "Mélanger la cannelle et le reste du sucre et en saupoudrer les tranches chaudes.",
        "Mescola la cannella con lo zucchero rimasto e cospargi le fette calde.",
        "Mix the cinnamon with the remaining sugar and sprinkle it over the hot slices."
      ),
    ],
    tip: l4(
      "Die Schweizer Antwort auf French Toast – perfekt, um Brot vom Vortag zu retten. Mit Apfelmus auch als Dessert ein Hit.",
      "La réponse suisse au pain doré – parfait pour sauver le pain de la veille. Avec de la compote de pommes, c'est aussi un succès en dessert.",
      "La risposta svizzera al french toast – perfetta per recuperare il pane del giorno prima. Con la composta di mele è un successo anche come dessert.",
      "The Swiss answer to French toast – perfect for rescuing yesterday's bread. With apple sauce it's a hit as dessert too."
    ),
  },
  // ---- Sechs weitere One-Pot-Rezepte (#624): ein Topf, ein Kocher, ----
  // ---- wenig Abwasch – das Kernversprechen der Camping-Küche.       ----
  {
    id: "one-pot-reistopf",
    name: l4(
      "Gemüse-Reistopf",
      "Riz aux légumes en une casserole",
      "Riso alle verdure in pentola unica",
      "One-pot vegetable rice"
    ),
    method: "Gaskocher",
    timeMinutes: 25,
    servings: 4,
    difficulty: "einfach",
    onePot: true,
    kidFriendly: true,
    ingredients: [
      l4("Reis", "Riz", "Riso", "Rice"),
      l4("Rüebli", "Carottes", "Carote", "Carrots"),
      l4(
        "Erbsen (Dose oder TK)",
        "Petits pois (boîte ou surgelés)",
        "Piselli (in scatola o surgelati)",
        "Peas (tinned or frozen)"
      ),
      l4("Zwiebel", "Oignon", "Cipolla", "Onion"),
      l4(
        "Gemüsebouillon",
        "Bouillon de légumes",
        "Brodo vegetale",
        "Vegetable stock"
      ),
      l4("Öl", "Huile", "Olio", "Oil"),
      l4(
        "Paprika (Gewürz)",
        "Paprika (épice)",
        "Paprica (spezia)",
        "Paprika (spice)"
      ),
    ],
    steps: [
      l4(
        "Zwiebel und Rüebli klein schneiden und im Topf mit etwas Öl andünsten.",
        "Émincer l'oignon et les carottes et les faire revenir dans la casserole avec un peu d'huile.",
        "Trita cipolla e carote e falle rosolare nella pentola con un po' d'olio.",
        "Chop the onion and carrots and sauté them in the pot with a little oil."
      ),
      l4(
        "Reis kurz mitdünsten, mit der doppelten Menge Bouillon ablöschen.",
        "Faire revenir brièvement le riz, puis mouiller avec le double de volume de bouillon.",
        "Fai tostare brevemente il riso, poi sfuma con il doppio del volume di brodo.",
        "Briefly toast the rice, then add twice its volume of stock."
      ),
      l4(
        "Zugedeckt 15 Minuten leise köcheln lassen, die Erbsen in den letzten 5 Minuten dazugeben.",
        "Laisser mijoter à couvert 15 minutes, ajouter les petits pois pour les 5 dernières minutes.",
        "Lascia sobbollire coperto per 15 minuti, aggiungi i piselli negli ultimi 5 minuti.",
        "Simmer covered for 15 minutes, adding the peas for the last 5 minutes."
      ),
      l4(
        "Mit Paprika abschmecken und kurz ziehen lassen.",
        "Assaisonner de paprika et laisser reposer brièvement.",
        "Insaporisci con la paprica e lascia riposare brevemente.",
        "Season with paprika and let it rest briefly."
      ),
    ],
    tip: l4(
      "Ein Rest Wurst oder ein Ei obendrauf macht daraus ein Znacht für hungrige Tage.",
      "Un reste de saucisse ou un œuf par-dessus en fait un souper pour les jours de grande faim.",
      "Un avanzo di salsiccia o un uovo sopra lo trasformano in una cena per giorni affamati.",
      "Leftover sausage or an egg on top turns it into supper for hungry days."
    ),
  },
  {
    id: "one-pot-gnocchi",
    name: l4(
      "Gnocchi-Rahmtopf mit Spinat",
      "Gnocchis à la crème et aux épinards",
      "Gnocchi alla panna con spinaci",
      "Creamy one-pot gnocchi with spinach"
    ),
    method: "Gaskocher",
    timeMinutes: 15,
    servings: 4,
    difficulty: "einfach",
    onePot: true,
    kidFriendly: true,
    ingredients: [
      l4(
        "Gnocchi (Kühlregal)",
        "Gnocchis (rayon frais)",
        "Gnocchi (banco frigo)",
        "Gnocchi (chilled)"
      ),
      l4("Rahm", "Crème", "Panna", "Cream"),
      l4(
        "Spinat (frisch oder TK)",
        "Épinards (frais ou surgelés)",
        "Spinaci (freschi o surgelati)",
        "Spinach (fresh or frozen)"
      ),
      l4("Knoblauch", "Ail", "Aglio", "Garlic"),
      l4(
        "Geriebener Käse",
        "Fromage râpé",
        "Formaggio grattugiato",
        "Grated cheese"
      ),
      l4("Wasser", "Eau", "Acqua", "Water"),
      l4("Salz und Pfeffer", "Sel et poivre", "Sale e pepe", "Salt and pepper"),
    ],
    steps: [
      l4(
        "Knoblauch im Topf kurz andünsten, Gnocchi mit wenig Wasser zugeben.",
        "Faire revenir brièvement l'ail dans la casserole, ajouter les gnocchis avec un peu d'eau.",
        "Fai rosolare brevemente l'aglio nella pentola, aggiungi gli gnocchi con poca acqua.",
        "Briefly sauté the garlic in the pot, add the gnocchi with a little water."
      ),
      l4(
        "5 Minuten köcheln, bis die Gnocchi weich sind, dann Spinat und Rahm einrühren.",
        "Laisser mijoter 5 minutes jusqu'à ce que les gnocchis soient tendres, puis incorporer les épinards et la crème.",
        "Fai sobbollire 5 minuti finché gli gnocchi sono morbidi, poi unisci spinaci e panna.",
        "Simmer for 5 minutes until the gnocchi are soft, then stir in the spinach and cream."
      ),
      l4(
        "Käse daruntermischen, mit Salz und Pfeffer abschmecken.",
        "Mélanger le fromage, saler et poivrer.",
        "Mescola il formaggio, aggiusta di sale e pepe.",
        "Mix in the cheese and season with salt and pepper."
      ),
    ],
    tip: l4(
      "Gnocchi aus dem Kühlregal sind vorgegart – sie brauchen nur Minuten und verzeihen jeden Kocher.",
      "Les gnocchis du rayon frais sont précuits – quelques minutes suffisent, même sur un petit réchaud.",
      "Gli gnocchi del banco frigo sono precotti – bastano pochi minuti, anche sul fornellino.",
      "Chilled gnocchi are pre-cooked – they only need minutes and forgive any stove."
    ),
  },
  {
    id: "one-pot-kartoffelgulasch",
    name: l4(
      "Kartoffelgulasch",
      "Goulasch de pommes de terre",
      "Gulasch di patate",
      "Potato goulash"
    ),
    method: "Beides",
    timeMinutes: 35,
    servings: 4,
    difficulty: "einfach",
    onePot: true,
    kidFriendly: true,
    ingredients: [
      l4("Kartoffeln", "Pommes de terre", "Patate", "Potatoes"),
      l4("Zwiebeln", "Oignons", "Cipolle", "Onions"),
      l4("Peperoni", "Poivrons", "Peperoni", "Bell peppers"),
      l4(
        "Paprika (Gewürz)",
        "Paprika (épice)",
        "Paprica (spezia)",
        "Paprika (spice)"
      ),
      l4(
        "Tomatenpüree",
        "Purée de tomates",
        "Concentrato di pomodoro",
        "Tomato purée"
      ),
      l4("Bouillon", "Bouillon", "Brodo", "Stock"),
      l4("Öl", "Huile", "Olio", "Oil"),
      l4(
        "Cervelat oder Wienerli (optional)",
        "Cervelas ou wienerli (facultatif)",
        "Cervelat o wienerli (facoltativo)",
        "Cervelat or frankfurters (optional)"
      ),
    ],
    steps: [
      l4(
        "Zwiebeln im Topf goldgelb dünsten, Paprika und Tomatenpüree kurz mitrösten.",
        "Faire dorer les oignons dans la casserole, faire revenir brièvement le paprika et la purée de tomates.",
        "Fai dorare le cipolle nella pentola, tosta brevemente paprica e concentrato.",
        "Sauté the onions until golden, briefly toast the paprika and tomato purée."
      ),
      l4(
        "Kartoffel- und Peperoniwürfel zugeben und mit Bouillon knapp bedecken.",
        "Ajouter les dés de pommes de terre et de poivron et couvrir à peine de bouillon.",
        "Aggiungi patate e peperoni a dadini e copri appena con il brodo.",
        "Add the diced potatoes and peppers and barely cover with stock."
      ),
      l4(
        "Zugedeckt 20–25 Minuten köcheln, bis die Kartoffeln weich sind.",
        "Laisser mijoter à couvert 20–25 minutes, jusqu'à ce que les pommes de terre soient tendres.",
        "Fai sobbollire coperto 20–25 minuti, finché le patate sono morbide.",
        "Simmer covered for 20–25 minutes until the potatoes are soft."
      ),
      l4(
        "Nach Belieben Wurstscheiben zugeben und noch 5 Minuten ziehen lassen.",
        "Ajouter des rondelles de saucisse selon l'envie et laisser encore 5 minutes.",
        "A piacere aggiungi fette di salsiccia e lascia insaporire altri 5 minuti.",
        "Add sausage slices if you like and let it simmer for another 5 minutes."
      ),
    ],
    tip: l4(
      "Schmeckt am zweiten Tag noch besser – gleich die doppelte Menge kochen.",
      "Encore meilleur le lendemain – autant en cuire le double.",
      "Il giorno dopo è ancora più buono – cucinane subito il doppio.",
      "Even better the next day – cook a double batch right away."
    ),
  },
  {
    id: "one-pot-tortellini",
    name: l4(
      "Tortellini-Suppentopf",
      "Marmite de tortellinis en bouillon",
      "Tortellini in brodo",
      "Tortellini soup pot"
    ),
    method: "Gaskocher",
    timeMinutes: 15,
    servings: 4,
    difficulty: "einfach",
    onePot: true,
    kidFriendly: true,
    ingredients: [
      l4(
        "Tortellini (Kühlregal)",
        "Tortellinis (rayon frais)",
        "Tortellini (banco frigo)",
        "Tortellini (chilled)"
      ),
      l4(
        "Gemüsebouillon",
        "Bouillon de légumes",
        "Brodo vegetale",
        "Vegetable stock"
      ),
      l4("Rüebli", "Carottes", "Carote", "Carrots"),
      l4("Lauch", "Poireau", "Porro", "Leek"),
      l4(
        "Geriebener Käse",
        "Fromage râpé",
        "Formaggio grattugiato",
        "Grated cheese"
      ),
    ],
    steps: [
      l4(
        "Rüebli und Lauch in feine Scheiben schneiden und in der Bouillon 5 Minuten kochen.",
        "Couper les carottes et le poireau en fines rondelles et les cuire 5 minutes dans le bouillon.",
        "Taglia carote e porro a rondelle sottili e cuocili 5 minuti nel brodo.",
        "Slice the carrots and leek thinly and cook them in the stock for 5 minutes."
      ),
      l4(
        "Tortellini zugeben und nach Packung gar ziehen lassen (meist 3–4 Minuten).",
        "Ajouter les tortellinis et les laisser cuire selon l'emballage (souvent 3–4 minutes).",
        "Aggiungi i tortellini e cuocili secondo la confezione (di solito 3–4 minuti).",
        "Add the tortellini and cook according to the packet (usually 3–4 minutes)."
      ),
      l4(
        "In Schüsseln verteilen und mit Käse bestreuen.",
        "Répartir dans des bols et parsemer de fromage.",
        "Distribuisci nelle ciotole e cospargi di formaggio.",
        "Ladle into bowls and sprinkle with cheese."
      ),
    ],
    tip: l4(
      "An kalten Abenden DIE Antwort: heiss, schnell und mit nur einem Topf zum Abwaschen.",
      "LA réponse des soirs froids : chaud, rapide et une seule casserole à laver.",
      "LA risposta per le sere fredde: caldo, veloce e una sola pentola da lavare.",
      "THE answer on cold evenings: hot, fast, and only one pot to wash."
    ),
  },
  {
    id: "one-pot-orzo",
    name: l4(
      "Zitronen-Orzo mit Zucchetti",
      "Orzo au citron et aux courgettes",
      "Orzo al limone con zucchine",
      "Lemon orzo with courgettes"
    ),
    method: "Gaskocher",
    timeMinutes: 20,
    servings: 4,
    difficulty: "einfach",
    onePot: true,
    kidFriendly: true,
    ingredients: [
      l4(
        "Orzo / Kritharaki (Reisnudeln)",
        "Orzo / kritharaki (pâtes en forme de riz)",
        "Orzo / kritharaki (pasta a chicco di riso)",
        "Orzo / kritharaki (rice-shaped pasta)"
      ),
      l4("Zucchetti", "Courgettes", "Zucchine", "Courgettes"),
      l4("Zitrone", "Citron", "Limone", "Lemon"),
      l4(
        "Gemüsebouillon",
        "Bouillon de légumes",
        "Brodo vegetale",
        "Vegetable stock"
      ),
      l4("Olivenöl", "Huile d'olive", "Olio d'oliva", "Olive oil"),
      l4(
        "Geriebener Käse",
        "Fromage râpé",
        "Formaggio grattugiato",
        "Grated cheese"
      ),
    ],
    steps: [
      l4(
        "Zucchettiwürfel im Topf mit Olivenöl kurz anbraten.",
        "Faire revenir brièvement les dés de courgette dans la casserole avec l'huile d'olive.",
        "Fai saltare brevemente le zucchine a dadini nella pentola con l'olio d'oliva.",
        "Briefly fry the diced courgettes in the pot with olive oil."
      ),
      l4(
        "Orzo zugeben und mit Bouillon knapp bedecken; 10 Minuten köcheln und regelmässig rühren.",
        "Ajouter l'orzo et couvrir à peine de bouillon ; laisser mijoter 10 minutes en remuant régulièrement.",
        "Aggiungi l'orzo e copri appena con il brodo; fai sobbollire 10 minuti mescolando regolarmente.",
        "Add the orzo and barely cover with stock; simmer for 10 minutes, stirring regularly."
      ),
      l4(
        "Zitronensaft und -schale einrühren, mit Käse servieren.",
        "Incorporer le jus et le zeste de citron, servir avec le fromage.",
        "Unisci succo e scorza di limone, servi con il formaggio.",
        "Stir in the lemon juice and zest, serve with cheese."
      ),
    ],
    tip: l4(
      "Orzo gart wie Reis direkt in der Bouillon – kein Abgiessen, kein zweiter Topf.",
      "L'orzo cuit comme du riz directement dans le bouillon – rien à égoutter, pas de deuxième casserole.",
      "L'orzo cuoce come il riso direttamente nel brodo – niente da scolare, nessuna seconda pentola.",
      "Orzo cooks like rice directly in the stock – no draining, no second pot."
    ),
  },
  {
    id: "one-pot-fajita-reis",
    name: l4(
      "Fajita-Reistopf mit Bohnen",
      "Riz façon fajita aux haricots",
      "Riso alla fajita con fagioli",
      "One-pot fajita rice with beans"
    ),
    method: "Gaskocher",
    timeMinutes: 30,
    servings: 4,
    difficulty: "einfach",
    onePot: true,
    kidFriendly: true,
    ingredients: [
      l4("Reis", "Riz", "Riso", "Rice"),
      l4(
        "Kidneybohnen (Dose)",
        "Haricots rouges (boîte)",
        "Fagioli rossi (in scatola)",
        "Kidney beans (tinned)"
      ),
      l4(
        "Mais (Dose)",
        "Maïs (boîte)",
        "Mais (in scatola)",
        "Sweetcorn (tinned)"
      ),
      l4("Peperoni", "Poivron", "Peperone", "Bell pepper"),
      l4("Zwiebel", "Oignon", "Cipolla", "Onion"),
      l4(
        "Gehackte Tomaten (Dose)",
        "Tomates concassées (boîte)",
        "Pomodori a pezzetti (in scatola)",
        "Chopped tomatoes (tinned)"
      ),
      l4(
        "Fajita- oder Taco-Gewürz",
        "Épices à fajitas ou tacos",
        "Spezie per fajita o taco",
        "Fajita or taco seasoning"
      ),
      l4("Öl", "Huile", "Olio", "Oil"),
    ],
    steps: [
      l4(
        "Zwiebel und Peperoni im Topf anbraten, Gewürz kurz mitrösten.",
        "Faire revenir l'oignon et le poivron dans la casserole, griller brièvement les épices.",
        "Fai rosolare cipolla e peperone nella pentola, tosta brevemente le spezie.",
        "Fry the onion and pepper in the pot, briefly toasting the seasoning."
      ),
      l4(
        "Reis, Tomaten und einen Becher Wasser zugeben, zugedeckt 15 Minuten köcheln.",
        "Ajouter le riz, les tomates et une tasse d'eau, laisser mijoter à couvert 15 minutes.",
        "Aggiungi riso, pomodori e una tazza d'acqua, fai sobbollire coperto 15 minuti.",
        "Add the rice, tomatoes and a cup of water, simmer covered for 15 minutes."
      ),
      l4(
        "Bohnen und Mais abspülen, einrühren und 5 Minuten mitwärmen.",
        "Rincer les haricots et le maïs, les incorporer et réchauffer 5 minutes.",
        "Sciacqua fagioli e mais, uniscili e scalda per 5 minuti.",
        "Rinse the beans and corn, stir them in and heat through for 5 minutes."
      ),
    ],
    tip: l4(
      "Reste am Morgen mit einem Spiegelei aufwärmen – bestes Camping-Zmorge für Hungrige.",
      "Réchauffer les restes le matin avec un œuf au plat – le meilleur déjeuner de camping pour les affamés.",
      "Riscalda gli avanzi al mattino con un uovo al tegamino – la migliore colazione da campeggio per gli affamati.",
      "Reheat leftovers in the morning with a fried egg – the best camping breakfast for the hungry."
    ),
  },
];
