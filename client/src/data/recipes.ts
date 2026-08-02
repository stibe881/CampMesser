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
];
