import { l4, type L4 } from "@shared/i18n";

/**
 * «Was ist neu»: nutzersichtbare Änderungen der App, gruppiert nach
 * Veröffentlichungs-Blöcken. Der NEUESTE Block steht zuoberst; die Ids sind
 * aufsteigend sortierbar aufgebaut (ISO-Datum + laufende Nummer, z. B.
 * "2026-08-03.1"), damit «gesehen bis Id X» einfach vergleichbar bleibt.
 *
 * Pflegepflicht: Jeder Feature-Batch ergänzt seine nutzersichtbaren Features
 * als je EINE kurze L4-Zeile (Du-Form) im obersten Block – neuer Block, falls
 * von heute noch keiner existiert. Reine Fixes/Interna gehören NICHT hierher.
 * Kein Vollständigkeitsanspruch: die wichtigsten Neuerungen zuerst.
 */

export interface ChangelogBlock {
  /** Aufsteigend vergleichbare Id: ISO-Datum + ".n" (z. B. "2026-08-03.1"). */
  id: string;
  /** Veröffentlichungs-Datum als ISO-String (YYYY-MM-DD). */
  date: string;
  /** Kurze, nutzersichtbare Neuerungen – die wichtigsten zuerst. */
  entries: L4[];
}

export const changelog: ChangelogBlock[] = [
  {
    id: "2026-08-03.1",
    date: "2026-08-03",
    entries: [
      l4(
        "Fangbuch: Halte jeden Fang fest – Art, Länge, Gewicht, Gewässer, Datum und Uhrzeit, Köder, Notiz, Foto und ob du ihn zurückgesetzt hast. Die App zeigt dir deinen grössten Fang je Art und die Fänge pro Jahr, gefiltert nach Art und Gewässer. Zwanzig Schweizer Fischarten sind hinterlegt: Beim Erfassen warnt dich die App, wenn die Art gerade Schonzeit hat oder der Fisch unter dem Fangmindestmass des Bundes liegt – immer mit dem klaren Hinweis, dass die Fischerei kantonal geregelt ist und deine kantonale Fischereiverordnung samt Patent zählt.",
        "Carnet de pêche : note chaque prise – espèce, longueur, poids, plan d'eau, date et heure, appât, note, photo et si tu l'as remise à l'eau. L'app te montre ta plus grosse prise par espèce et le nombre de prises par année, filtrable par espèce et par plan d'eau. Vingt espèces suisses sont enregistrées : à la saisie, l'app t'avertit si l'espèce est en période de protection ou si le poisson est en dessous de la taille minimale fédérale – toujours avec la mention claire que la pêche est réglée par les cantons et que ton ordonnance cantonale et ton permis font foi.",
        "Libretto delle catture: annota ogni cattura – specie, lunghezza, peso, acqua, data e ora, esca, nota, foto e se l'hai rilasciata. L'app ti mostra la tua cattura più grande per specie e le catture per anno, filtrabili per specie e per acqua. Sono registrate venti specie svizzere: al momento della registrazione l'app ti avverte se la specie è in periodo di protezione o se il pesce è sotto la misura minima federale – sempre con l'avvertenza chiara che la pesca è regolata dai cantoni e che fanno fede l'ordinanza cantonale e la tua patente.",
        "Catch log: record every catch – species, length, weight, water, date and time, bait, note, photo and whether you released it. The app shows your biggest catch per species and the catches per year, filtered by species and water. Twenty Swiss species are on file: while you record a catch the app warns you if the species is in its closed season or the fish is below the federal minimum size – always with the clear note that fishing is regulated by the cantons and that your cantonal ordinance and licence are what count."
      ),
      l4(
        "Solarertrag-Prognose: Trag die Nennleistung deiner Panels ein und ob sie fest auf dem Dach liegen oder mobil aufgestellt werden – die App holt die Einstrahlungswerte der Wettervorhersage (bei mobilen Panels gleich für die empfohlene Neigung und Ausrichtung) und rechnet daraus den erwarteten Ertrag der nächsten fünf Tage in Wattstunden. Der Systemwirkungsgrad steht offen da: Laderegler, Kabel, Temperatur und Verschmutzung ergeben zusammen rund 71 %. Tag für Tag siehst du Ertrag gegen Verbrauch und wie dein Speicher dabei steht – reicht die Sonne, oder ist der Akku am Donnerstag leer?",
        "Prévision de production solaire : indique la puissance nominale de tes panneaux et s'ils sont fixes sur le toit ou mobiles – l'app récupère les valeurs de rayonnement de la prévision météo (pour les panneaux mobiles directement pour l'inclinaison et l'orientation recommandées) et en calcule la production attendue des cinq prochains jours en wattheures. Le rendement système est affiché sans détour : régulateur, câbles, température et salissure donnent ensemble environ 71 %. Jour après jour, tu vois la production face à la consommation et où en est ton stockage – le soleil suffit-il, ou la batterie sera-t-elle vide jeudi ?",
        "Previsione di resa solare: indica la potenza nominale dei tuoi pannelli e se sono fissi sul tetto o mobili – l'app prende i valori di irraggiamento dalle previsioni meteo (per i pannelli mobili direttamente per l'inclinazione e l'orientamento consigliati) e ne calcola la resa attesa dei prossimi cinque giorni in wattora. Il rendimento di sistema è dichiarato apertamente: regolatore, cavi, temperatura e sporco danno insieme circa il 71 %. Giorno per giorno vedi resa contro consumo e come sta il tuo accumulatore – il sole basta, o giovedì la batteria è vuota?",
        "Solar yield forecast: enter the rated power of your panels and whether they sit fixed on the roof or are set up portable – the app pulls the radiation values from the weather forecast (for portable panels straight away for the recommended tilt and orientation) and turns them into the expected yield for the next five days in watt hours. The system efficiency is stated openly: charge controller, cables, temperature and soiling add up to about 71 %. Day by day you see yield against consumption and how your storage is doing – does the sun keep up, or is the battery empty on Thursday?"
      ),
      l4(
        "Strom-Budget: Erfass deinen Speicher – Powerstation in Wh oder Bordbatterie in Ah mal Volt – und wähl die Bauart: Blei gibt nur rund die Hälfte her, LiFePO₄ fast alles. Zusammen mit deiner Verbraucherliste (Vorlagen für Kühlschrank, Kühlbox, Wasserpumpe, Heizungsgebläse, Licht und Laden sind dabei) siehst du den Verbrauch pro Tag, wie lange dein Strom in Stunden oder Tagen reicht, was nutzbar übrig bleibt – und eine Warnung, bevor du in die Tiefentladung fährst.",
        "Budget électrique : saisis ton stockage – powerstation en Wh ou batterie auxiliaire en Ah fois volts – et choisis le type : le plomb ne donne qu'environ la moitié, le LiFePO₄ presque tout. Avec ta liste de consommateurs (des modèles pour réfrigérateur, glacière, pompe à eau, soufflerie de chauffage, éclairage et recharge sont fournis), tu vois la consommation par jour, combien de temps ton courant tient en heures ou en jours, ce qui reste utilisable – et un avertissement avant que tu ne partes en décharge profonde.",
        "Budget elettrico: inserisci il tuo accumulatore – powerstation in Wh oppure batteria di servizio in Ah per volt – e scegli il tipo: il piombo rende solo circa la metà, il LiFePO₄ quasi tutto. Insieme alla lista delle utenze (ci sono modelli per frigorifero, frigo box, pompa dell'acqua, ventola del riscaldamento, luci e ricariche) vedi il consumo giornaliero, quanto ti dura la corrente in ore o giorni, quanto resta utilizzabile – e un avviso prima di finire in scarica profonda.",
        "Power budget: enter your storage – power station in Wh or leisure battery in Ah times volts – and pick the type: lead acid only gives up about half, LiFePO₄ almost everything. Together with your consumer list (templates for fridge, cool box, water pump, heater fan, lighting and charging are included) you see the consumption per day, how long your power lasts in hours or days, what stays usable – and a warning before you run into deep discharge."
      ),
      l4(
        "Maut, Vignette & Regeln: Für neun Länder – Schweiz, Deutschland, Österreich, Italien, Frankreich, Slowenien, Niederlande, Kroatien und Spanien – siehst du auf einen Blick, ob du eine Vignette brauchst (und ob der Anhänger eine eigene), wie schnell du mit Anhänger fahren darfst, welche Promillegrenze gilt, was an Bord Pflicht ist, wo Umweltzonen warten, welche Notrufnummer gilt und wie das mit dem Übernachten auf Rastplätzen ist. Alles offline und mit Stand-Datum. Bei geplanten Reisen führt dich ein Knopf direkt zum Zielland.",
        "Péage, vignette & règles : pour neuf pays – Suisse, Allemagne, Autriche, Italie, France, Slovénie, Pays-Bas, Croatie et Espagne – tu vois d'un coup d'œil s'il te faut une vignette (et si la remorque en a besoin d'une), à quelle vitesse tu peux rouler avec remorque, le taux d'alcoolémie, ce qui est obligatoire à bord, où t'attendent les zones environnementales, le numéro d'urgence et ce qu'il en est des nuits sur les aires de repos. Le tout hors ligne et daté. Depuis un voyage planifié, un bouton t'amène directement au pays de destination.",
        "Pedaggi, vignetta e regole: per nove paesi – Svizzera, Germania, Austria, Italia, Francia, Slovenia, Paesi Bassi, Croazia e Spagna – vedi a colpo d'occhio se ti serve una vignetta (e se ne serve una anche al rimorchio), a che velocità puoi viaggiare con il rimorchio, il tasso alcolemico, che cosa è obbligatorio a bordo, dove ti aspettano le zone ambientali, il numero d'emergenza e come funziona il pernottamento nelle aree di sosta. Tutto offline e con la data di aggiornamento. Da un viaggio pianificato un pulsante ti porta direttamente al paese di destinazione.",
        "Tolls, vignettes & rules: for nine countries – Switzerland, Germany, Austria, Italy, France, Slovenia, the Netherlands, Croatia and Spain – you see at a glance whether you need a vignette (and whether the trailer needs its own), how fast you may drive when towing, the blood alcohol limit, what has to be on board, where low emission zones await, the emergency number and how overnight stays at rest areas work. All offline and dated. From a planned trip a button takes you straight to the destination country."
      ),
      l4(
        "Zuladungs-Rechner: Trag Leergewicht und die zulässigen Werte von Zugfahrzeug und Anhänger ein – du siehst je Grenzwert eine Ampel mit «noch frei» oder «zu viel», dazu die Stützlast-Faustregel. Als Ladung nimmst du Personen, eine Packliste (Gewicht kommt aus dem Inventar) und freie Posten wie Wasser, Gasflasche oder Velos, jeweils vorne oder hinten. Die Fahrzeuge sind dieselben wie in der Wasserwaage. Verbindlich bleiben Fahrzeugausweis und Waage.",
        "Calculateur de charge utile : saisis le poids à vide et les valeurs admissibles de ton véhicule tracteur et de ta remorque – tu vois pour chaque limite un feu tricolore avec « encore libre » ou « en trop », plus la règle empirique de la charge sur la boule. Comme chargement, tu prends les personnes, une liste de bagages (le poids vient de l'inventaire) et des postes libres comme l'eau, la bouteille de gaz ou les vélos, devant ou derrière. Les véhicules sont ceux du niveau à bulle. Seuls le permis de circulation et la balance font foi.",
        "Calcolatore del carico: inserisci il peso a vuoto e i valori ammessi di veicolo trainante e rimorchio – per ogni limite vedi un semaforo con «ancora libero» o «di troppo», più la regola pratica per il carico sul gancio. Come carico prendi le persone, una lista bagagli (il peso arriva dall'inventario) e voci libere come acqua, bombola del gas o biciclette, davanti o dietro. I veicoli sono gli stessi della livella. Fanno fede la licenza di circolazione e la pesa.",
        "Payload calculator: enter the kerb weight and permitted values of your towing vehicle and trailer – every limit gets a traffic light with “left” or “too much”, plus the nose weight rule of thumb. As your load you take people, a packing list (the weight comes from your inventory) and extra items such as water, a gas bottle or bikes, front or back. The vehicles are the same ones the spirit level uses. The registration document and the weighbridge remain what counts."
      ),
      l4(
        "Einkaufsliste: Du kannst je Eintrag den Preis erfassen – oben steht die laufende Summe, aufgeteilt in offen, abgehakt und schon verbucht. Mit «In die Reisekasse» wandern die abgehakten Einkäufe als eine Ausgabe in die Kasse einer Reise: Kategorie «Essen» vorbelegt, Beschreibung und Zahler wählbar, Datum heute. Auf der Reise-Einkaufsliste ist die Reise schon gesetzt, und verbuchte Einträge tragen ein Abzeichen und zählen kein zweites Mal.",
        "Liste de courses : tu peux saisir le prix de chaque article – le total courant figure en haut, réparti entre en attente, coché et déjà comptabilisé. Avec « Vers la caisse de voyage », les courses cochées passent dans la caisse d\'un voyage comme une seule dépense : catégorie « Repas » préremplie, description et payeur au choix, date du jour. Sur la liste de courses d\'un voyage, le voyage est déjà défini, et les entrées comptabilisées portent un badge et ne comptent pas une deuxième fois.",
        "Lista della spesa: puoi registrare il prezzo di ogni voce – in alto trovi il totale corrente, diviso tra in sospeso, spuntato e già registrato. Con «Nella cassa di viaggio» gli acquisti spuntati passano nella cassa di un viaggio come una sola spesa: categoria «Cibo» preimpostata, descrizione e pagante a scelta, data di oggi. Nella lista della spesa di un viaggio il viaggio è già impostato, e le voci registrate portano un contrassegno e non contano una seconda volta.",
        "Shopping list: you can record a price for every item – the running total sits at the top, split into open, ticked and already booked. With “To the trip fund” the ticked purchases move into a trip\'s fund as a single expense: category “Food” preset, description and payer up to you, date today. On a trip shopping list the trip is already set, and booked items carry a badge and are never counted twice."
      ),
      l4(
        "Vorräte: Neben der Kühlbox gibt es neu den «Trockenvorrat» – Konserven, Teigwaren, Reis, Kaffee und Gewürze mit Menge, Einheit, Kategorie und Mindesthaltbarkeit. Oben schaltest du zwischen den beiden Lagern um, der Trockenvorrat ist nach Kategorien geordnet, und Ablaufwarnung, «nachkaufen», Einräumen und Resteverwertung gelten für beide Lager.",
        "Provisions : à côté de la glacière, il y a désormais les « provisions sèches » – conserves, pâtes, riz, café et épices avec quantité, unité, catégorie et date limite de consommation. En haut, tu bascules entre les deux rangements, les provisions sèches sont classées par catégories, et l\'alerte de péremption, le « racheter », le rangement des courses et la cuisine des restes valent pour les deux.",
        "Scorte: accanto al frigo box c\'è ora la «dispensa» – conserve, pasta, riso, caffè e spezie con quantità, unità, categoria e termine minimo di conservazione. In alto passi da un magazzino all\'altro, la dispensa è ordinata per categorie, e avviso di scadenza, «ricompra», sistemazione della spesa e uso degli avanzi valgono per entrambi.",
        "Supplies: alongside the cool box there is now the “dry store” – tins, pasta, rice, coffee and spices with quantity, unit, category and best-before date. A switch at the top moves between the two stores, the dry store is sorted by category, and expiry warnings, “buy again”, putting purchases away and using up leftovers apply to both."
      ),
      l4(
        "Kühlbox: Aus «Das kannst du damit kochen» wird die «Resteverwertung» – jeder Vorschlag sagt dir neu, wie viele Zutaten du schon hast («5 von 7»), was fehlt, und setzt das Fehlende auf Knopfdruck auf die Einkaufsliste. Rezepte mit bald ablaufenden Vorräten stehen zuoberst, und der Abgleich verzeiht Schreibweisen und Tippfehler wie die grosse Suche.",
        "Glacière : « Voici ce que tu peux cuisiner avec » devient « Cuisiner les restes » – chaque suggestion t'indique désormais combien d'ingrédients tu as déjà (« 5 sur 7 »), ce qui manque, et met ce qui manque dans la liste de courses d'un seul geste. Les recettes avec des provisions bientôt périmées passent en tête, et la comparaison pardonne les orthographes et les fautes de frappe comme la grande recherche.",
        "Frigo box: «Ecco cosa puoi cucinarci» diventa «Usa gli avanzi» – ogni suggerimento ti dice ora quanti ingredienti hai già («5 su 7»), cosa manca, e mette il mancante nella lista della spesa con un tocco. Le ricette con scorte in scadenza vengono per prime e il confronto perdona grafie e refusi come la ricerca globale.",
        "Cool box: “Here's what you can cook with it” becomes “Use up leftovers” – every suggestion now tells you how many ingredients you already have (“5 of 7”), what is missing, and puts the missing items on the shopping list with one tap. Recipes using supplies that expire soon come first, and the matching forgives spellings and typos just like the global search."
      ),
      l4(
        "Rezepte: Der neue Knopf «Umrechner» öffnet ein kleines Küchen-Werkzeug – Tassen, Esslöffel und Teelöffel in Milliliter, Gramm ↔ Milliliter für Mehl, Zucker, Reis, Öl, Wasser und Milch, °C ↔ °F und eine Tabelle mit den Backofen-Gasstufen. Du findest ihn im Rezeptbuch und direkt im offenen Rezept.",
        "Recettes : le nouveau bouton « Convertisseur » ouvre un petit outil de cuisine – tasses, cuillères à soupe et à café en millilitres, grammes ↔ millilitres pour la farine, le sucre, le riz, l'huile, l'eau et le lait, °C ↔ °F et un tableau des thermostats du four. Tu le trouves dans le livre de recettes et directement dans la recette ouverte.",
        "Ricette: il nuovo pulsante «Convertitore» apre un piccolo strumento da cucina – tazze, cucchiai e cucchiaini in millilitri, grammi ↔ millilitri per farina, zucchero, riso, olio, acqua e latte, °C ↔ °F e una tabella con i livelli del gas del forno. Lo trovi nel ricettario e direttamente nella ricetta aperta.",
        "Recipes: the new “Converter” button opens a small kitchen tool – cups, tablespoons and teaspoons into millilitres, grams ↔ millilitres for flour, sugar, rice, oil, water and milk, °C ↔ °F and a table of oven gas marks. You will find it in the recipe book and directly inside an open recipe."
      ),
      l4(
        "Rezepte: Im Rezept stellst du neu ein, für wie viele Personen du kochst – die Zutatenmengen rechnen mit (auch Brüche wie «½» und Bereiche wie «2-3»), sinnvoll gerundet und ohne «1,3333 Eier». Die eingestellte Zahl gilt auch, wenn du die Zutaten auf die Einkaufsliste setzt; im Menüplan rechnest du die Mengen mit einem Schalter auf deine Reisegruppe um.",
        "Recettes : dans une recette, tu indiques désormais pour combien de personnes tu cuisines – les quantités des ingrédients suivent (fractions comme « ½ » et fourchettes comme « 2-3 » comprises), arrondies intelligemment et sans « 1,3333 œuf ». Le nombre choisi vaut aussi quand tu reprends les ingrédients dans la liste de courses ; dans le menu, un interrupteur convertit les quantités pour ton groupe.",
        "Ricette: nella ricetta imposti ora per quante persone cucini – le quantità degli ingredienti si adattano (anche frazioni come «½» e intervalli come «2-3»), arrotondate con criterio e senza «1,3333 uova». Il numero impostato vale anche quando trasferisci gli ingredienti nella lista della spesa; nel menù un interruttore converte le quantità per il tuo gruppo.",
        "Recipes: in a recipe you now set how many people you are cooking for – the ingredient amounts follow (fractions like “½” and ranges like “2-3” included), sensibly rounded and without “1.3333 eggs”. The number you set also applies when you add the ingredients to the shopping list; in the menu plan a switch converts the amounts for your group."
      ),
      l4(
        "Reisen: Aus den Tagebuch-Fotos einer Reise machst du neu mit «Foto-Collage» ein Bild zum Teilen oder Herunterladen – du wählst die Fotos (die Zahl auf dem Bild zeigt ihre Reihenfolge) und eine von drei Anordnungen: Raster 2×2, Raster 3×3 oder ein grosses Bild mit kleinen darunter. Reisename und Zeitraum stehen als Bildunterschrift oben, die App-Signatur bleibt dezent.",
        "Voyages : à partir des photos du journal d'un voyage, tu crées désormais avec « Collage photo » une image à partager ou à télécharger – tu choisis les photos (le chiffre sur l'image indique leur ordre) et l'une des trois dispositions : grille 2×2, grille 3×3 ou une grande image avec des petites en dessous. Le nom du voyage et la période figurent en légende en haut, la signature de l'app reste discrète.",
        "Viaggi: dalle foto del diario di un viaggio crei ora con «Collage di foto» un'immagine da condividere o scaricare – scegli le foto (il numero sull'immagine ne indica l'ordine) e una delle tre disposizioni: griglia 2×2, griglia 3×3 o un'immagine grande con altre piccole sotto. Nome del viaggio e periodo stanno in alto come didascalia, la firma dell'app resta discreta.",
        "Trips: from a trip's journal photos you can now create a shareable or downloadable image with “Photo collage” – you pick the photos (the number on each image shows their order) and one of three arrangements: grid 2×2, grid 3×3, or one large image with smaller ones below. Trip name and dates appear as a caption at the top, and the app signature stays discreet."
      ),
      l4(
        "Natur & Astro: Der neue «Sternbild-Finder» sagt dir, was gerade in deiner Blickrichtung am Himmel steht – halt das Handy einfach an den Himmel, Kompass und Neigung machen den Rest. Dazu die Liste «heute Nacht sichtbar» mit Himmelsrichtung und Höhe über dem Horizont für 15 Sternbilder, Sternhaufen und Leitsterne plus die fünf hellsten Planeten; wo es einen Lexikon-Eintrag gibt, führt ein Tipp direkt hin. Ohne Kompass bleibt die Liste – und der Rotlicht-Modus gilt auch hier.",
        "Nature & astro : le nouveau « Détecteur de constellations » te dit ce qui se trouve dans ta direction dans le ciel – lève simplement ton téléphone, la boussole et l'inclinaison font le reste. Avec la liste « visible cette nuit » indiquant direction et hauteur au-dessus de l'horizon pour 15 constellations, amas et étoiles repères, plus les cinq planètes les plus brillantes ; là où un article du lexique existe, un tap t'y emmène. Sans boussole, la liste reste – et le mode lumière rouge vaut aussi ici.",
        "Natura e astro: il nuovo «Trova-costellazioni» ti dice cosa si trova in cielo nella tua direzione – basta alzare il telefono verso il cielo, bussola e inclinazione fanno il resto. Con l'elenco «visibile stanotte» con direzione e altezza sopra l'orizzonte per 15 costellazioni, ammassi e stelle guida più i cinque pianeti più luminosi; dove esiste una voce del lessico, un tocco ti porta lì. Senza bussola l'elenco resta – e la modalità luce rossa vale anche qui.",
        "Nature & astro: the new “Constellation finder” tells you what stands in your viewing direction in the sky – just hold your phone up, compass and tilt do the rest. Plus the “visible tonight” list with direction and height above the horizon for 15 constellations, clusters and guide stars as well as the five brightest planets; where a lexicon entry exists, one tap takes you there. Without a compass the list still works – and red light mode applies here too."
      ),
      l4(
        "Zecken: Der neue Kasten «Zeckenrisiko» sagt dir, wie aktiv Zecken gerade sind – nach Monat und Höhenlage, denn oberhalb von rund 1500 m kommen sie kaum noch vor – und ob dein Platz in einem FSME-Risikogebiet des BAG liegt (das ist die ganze Schweiz ausser Genf und Tessin). Dazu die Verhaltens-Tipps. Du findest ihn im Platz-Dossier und direkt beim Zeckenstich-Merker im Erste-Hilfe-Guide.",
        "Tiques : le nouvel encadré « Risque de tiques » t'indique à quel point les tiques sont actives – selon le mois et l'altitude, car au-dessus d'environ 1500 m elles sont rares – et si ton emplacement se trouve dans une région à risque de FSME selon l'OFSP (toute la Suisse sauf Genève et le Tessin). Avec les conseils de comportement. Tu le trouves dans le dossier de l'emplacement et directement auprès du carnet des piqûres de tiques dans le guide de premiers secours.",
        "Zecche: il nuovo riquadro «Rischio zecche» ti dice quanto sono attive le zecche – secondo mese e altitudine, perché sopra i 1500 m circa sono rare – e se la tua piazzola si trova in un'area a rischio TBE dell'UFSP (tutta la Svizzera tranne Ginevra e Ticino). Con i consigli di comportamento. Lo trovi nel dossier della piazzola e direttamente accanto al promemoria punture di zecca nella guida di primo soccorso.",
        "Ticks: the new “Tick risk” box tells you how active ticks are right now – by month and altitude, since above roughly 1500 m they are rare – and whether your pitch lies in an FOPH TBE risk area (all of Switzerland except Geneva and Ticino). Plus the behaviour tips. You will find it in the pitch dossier and right next to the tick bite log in the first aid guide."
      ),
      l4(
        "Zeltplätze: Liegt dein Platz am Wasser, zeigt das Dossier neu den Abschnitt «Wasser & Baden» – aktuelle Wassertemperatur mit Einordnung (kalt bis warm) und Trend, dazu Abfluss und Pegel, wo die Messstelle sie liefert. In der Schweiz kommt der Wert von der nächstgelegenen BAFU-Messstelle samt Name und Distanz, am Meer aus der Wasser-Temperatur der Wetterdaten.",
        "Emplacements : si ton emplacement est au bord de l'eau, le dossier affiche désormais la section « Eau & baignade » – température actuelle de l'eau avec son appréciation (froide à chaude) et sa tendance, ainsi que le débit et le niveau lorsque la station les fournit. En Suisse, la valeur vient de la station de mesure OFEV la plus proche, avec son nom et sa distance ; en mer, de la température de l'eau des données météo.",
        "Piazzole: se la tua piazzola è in riva all'acqua, il dossier mostra ora la sezione «Acqua e balneazione» – temperatura attuale dell'acqua con la sua valutazione (da fredda a calda) e la tendenza, più portata e livello dove la stazione li fornisce. In Svizzera il valore viene dalla stazione di misura UFAM più vicina, con nome e distanza; al mare dalla temperatura dell'acqua dei dati meteo.",
        "Pitches: if your pitch is by the water, the dossier now shows a “Water & swimming” section – current water temperature with a rating (cold to warm) and trend, plus discharge and level where the station provides them. In Switzerland the value comes from the nearest FOEN gauging station including its name and distance; at the coast from the sea water temperature of the weather data."
      ),
      l4(
        "Natur & Astro: Der neue Abschnitt «ISS-Überflüge» zeigt dir, wann die Raumstation an deinem Standort wirklich zu sehen ist – mit Datum, Uhrzeit, Dauer, dem Weg über den Himmel (Aufgang → Höchststand → Untergang), der grössten Höhe über dem Horizont und der ungefähren Helligkeit. Aufgeführt sind nur sichtbare Überflüge: unten dunkel, oben Sonne auf der Station.",
        "Nature & astro : la nouvelle section « Passages de l'ISS » te montre quand la station spatiale est vraiment visible depuis ta position – avec la date, l'heure, la durée, le trajet dans le ciel (lever → point culminant → coucher), la hauteur maximale au-dessus de l'horizon et l'éclat approximatif. Seuls les passages visibles sont listés : sombre au sol, soleil sur la station.",
        "Natura e astro: la nuova sezione «Passaggi della ISS» ti mostra quando la stazione spaziale è davvero visibile dalla tua posizione – con data, ora, durata, il percorso nel cielo (sorgere → culmine → tramonto), l'altezza massima sopra l'orizzonte e la luminosità approssimativa. Sono elencati solo i passaggi visibili: buio a terra, sole sulla stazione.",
        "Nature & astro: the new “ISS passes” section shows you when the space station is actually visible from your location – with date, time, duration, the path across the sky (rise → highest point → set), the maximum height above the horizon and the approximate brightness. Only visible passes are listed: dark on the ground, sunlight on the station."
      ),
      l4(
        "SOS: Mit «Hier bin ich» schickst du Mitreisenden in zwei Tipps einen Link auf deinen aktuellen Standort – mit Karte, Koordinaten, Genauigkeit und einem Knopf für die Route dorthin. Du wählst, wie lange der Link gilt (1, 4 oder 24 Stunden), führst deinen Standort mit «Standort aktualisieren» im selben Link nach und beendest ihn jederzeit mit «Link deaktivieren». Teilen geht übers System-Teilen, per Kopieren oder mit QR-Code.",
        "SOS : avec « Je suis ici », tu envoies en deux taps à tes compagnons de voyage un lien vers ta position actuelle – avec carte, coordonnées, précision et un bouton d'itinéraire. Tu choisis la durée de validité du lien (1, 4 ou 24 heures), tu actualises ta position dans le même lien avec « Actualiser la position » et tu y mets fin quand tu veux avec « Désactiver le lien ». Le partage passe par le partage système, la copie ou un code QR.",
        "SOS: con «Sono qui» mandi ai tuoi compagni di viaggio in due tocchi un link alla tua posizione attuale – con mappa, coordinate, precisione e un pulsante per le indicazioni stradali. Scegli quanto vale il link (1, 4 o 24 ore), aggiorni la tua posizione nello stesso link con «Aggiorna la posizione» e lo chiudi quando vuoi con «Disattiva il link». Condividi con la condivisione di sistema, copiando o con un codice QR.",
        "SOS: with “I'm here” you send fellow travellers a link to your current location in two taps – with map, coordinates, accuracy and a directions button. You choose how long the link lasts (1, 4 or 24 hours), keep your position up to date in the same link with “Update location” and end it whenever you like with “Deactivate link”. Share it via system sharing, by copying or with a QR code."
      ),
      l4(
        "Wandern: Das neue Modul «Wanderung aufzeichnen» zeichnet deine Touren vom Platz aus als GPS-Track auf – mit Strecke, Dauer, Ø-Tempo und Höhenmetern live auf dem Bildschirm. Ungenaue Messungen und Sprünge filtert CampMesser weg, die Aufzeichnung läuft beim Seitenwechsel weiter und das Display bleibt auf Wunsch an. Nach dem Stoppen benennst du die Wanderung, ordnest sie einer Reise zu, siehst sie auf der Karte und kannst sie als GPX herunterladen.",
        "Randonnée : le nouveau module « Enregistrer une randonnée » enregistre tes sorties depuis l'emplacement sous forme de trace GPS – avec distance, durée, allure moyenne et dénivelé en direct à l'écran. CampMesser filtre les mesures imprécises et les sauts, l'enregistrement continue quand tu changes de page et l'écran reste allumé si tu le souhaites. Après l'arrêt, tu nommes la randonnée, la rattaches à un voyage, la vois sur la carte et peux la télécharger en GPX.",
        "Escursioni: il nuovo modulo «Registra un'escursione» registra le tue uscite dalla piazzola come traccia GPS – con distanza, durata, andatura media e dislivello in diretta sullo schermo. CampMesser filtra le misure imprecise e i salti, la registrazione continua anche se cambi pagina e lo schermo resta acceso se vuoi. Dopo lo stop dai un nome all'escursione, la assegni a un viaggio, la vedi sulla mappa e la scarichi in GPX.",
        "Hiking: the new “Record a hike” module records your outings from the pitch as a GPS track – with distance, duration, average pace and elevation live on screen. CampMesser filters out inaccurate readings and jumps, recording carries on when you switch pages and the screen stays on if you want. After stopping you name the hike, assign it to a trip, see it on the map and download it as GPX."
      ),
      l4(
        "Reisen: Jede Reise hat neu eine Reisekasse – erfasse Ausgaben mit Betrag, Kategorie (Camping, Essen, Sprit, Freizeit, Sonstiges), Datum und der Person, die bezahlt hat. Du siehst die Summe, die Aufteilung nach Kategorie und «wer schuldet wem»: Haben mehrere bezahlt, rechnet CampMesser den Ausgleich mit möglichst wenigen Zahlungen aus – auf den Rappen genau. Mitreisende dürfen mitschreiben.",
        "Voyages : chaque voyage a désormais une caisse commune – saisis les dépenses avec le montant, la catégorie (camping, repas, carburant, loisirs, divers), la date et la personne qui a payé. Tu vois le total, la répartition par catégorie et « qui doit quoi à qui » : si plusieurs personnes ont payé, CampMesser calcule l'équilibrage avec le moins de versements possible – au centime près. Les compagnons de voyage peuvent aussi saisir des dépenses.",
        "Viaggi: ogni viaggio ha ora una cassa comune – registra le spese con importo, categoria (campeggio, cibo, carburante, tempo libero, varie), data e la persona che ha pagato. Vedi il totale, la ripartizione per categoria e «chi deve cosa a chi»: se hanno pagato in più, CampMesser calcola il conguaglio con il minor numero di versamenti possibile – al centesimo. Anche i compagni di viaggio possono registrare spese.",
        "Trips: every trip now has a shared kitty – record expenses with amount, category (camping, food, fuel, leisure, other), date and who paid. You see the total, the split by category and “who owes whom”: when several people paid, CampMesser works out the settlement with as few transfers as possible – down to the last rappen. Fellow travellers can add expenses too."
      ),
      l4(
        "Rezepte: Im Rezept steckt neu ein Küchen-Timer – starte ihn mit einem Tipp (1 bis 30 Min. oder eigene Dauer), oder nutze den Timer-Knopf direkt beim Zubereitungsschritt, wenn dort eine Zeit steht («15 Minuten köcheln»). Mehrere Timer laufen parallel und beim Seitenwechsel weiter, unten in der App siehst du jederzeit die Restzeit, und beim Ablauf gibt es Signalton, Vibration und einen deutlichen Hinweis.",
        "Recettes : chaque recette a désormais un minuteur de cuisine – lance-le d'un tap (1 à 30 min ou durée libre) ou utilise le bouton minuteur directement sur l'étape de préparation lorsqu'une durée y figure (« 15 minutes à mijoter »). Plusieurs minuteurs tournent en parallèle et continuent quand tu changes de page, le temps restant reste visible en bas de l'app, et à la fin un signal sonore, une vibration et un message bien visible t'avertissent.",
        "Ricette: nelle ricette c'è ora un timer da cucina – avvialo con un tocco (da 1 a 30 min o durata libera) oppure usa il pulsante timer direttamente sul passaggio di preparazione quando indica un tempo («15 minuti a fuoco lento»). Più timer vanno in parallelo e continuano anche se cambi pagina, il tempo rimanente resta visibile in basso nell'app e allo scadere arrivano segnale acustico, vibrazione e un avviso ben visibile.",
        "Recipes: every recipe now has a kitchen timer – start it with one tap (1 to 30 min or your own duration), or use the timer button right on a preparation step whenever it mentions a time (“simmer for 15 minutes”). Several timers run side by side and keep running when you switch pages, the remaining time stays visible at the bottom of the app, and when the time is up you get a beep, a vibration and a clear notice."
      ),
      l4(
        "Zeltplätze: Im Platz-Dossier gibt es neu den Abschnitt «Offline-Karte» – wähle Umkreis (2/5/10 km) und Detailgrad, lade die Karten-Kacheln rund um den Platz vorab herunter, und Karte wie Zelt-Finder funktionieren dort auch ohne Empfang. Du siehst laufend die Kachelzahl, den Fortschritt und wie viel gespeichert ist, und kannst das Paket jederzeit wieder löschen.",
        "Emplacements : le dossier propose désormais la section « Carte hors ligne » – choisis le rayon (2/5/10 km) et le niveau de détail, télécharge à l'avance les tuiles autour de l'emplacement, et la carte comme le radar de tente fonctionnent là-bas même sans réseau. Tu vois en direct le nombre de tuiles, la progression et l'espace occupé, et tu peux supprimer le paquet à tout moment.",
        "Piazzole: nel dossier trovi ora la sezione «Mappa offline» – scegli il raggio (2/5/10 km) e il livello di dettaglio, scarica in anticipo le tessere attorno alla piazzola e mappa e trova-tenda funzionano lì anche senza campo. Vedi in tempo reale il numero di tessere, l'avanzamento e quanto è salvato, e puoi eliminare il pacchetto quando vuoi.",
        "Pitches: the pitch dossier now has an “Offline map” section – pick the radius (2/5/10 km) and level of detail, download the map tiles around the pitch in advance, and both the map and the tent finder keep working there without a signal. You see the tile count, the progress and how much is stored, and you can delete the package at any time."
      ),
      l4(
        "Startseite: Sind an deinem Standort Unwetterwarnungen aktiv, trägt das Wetter-Widget neu ein farbiges Badge mit der Anzahl und der höchsten Stufe – ein Tipp darauf bringt dich direkt zum Warnungs-Abschnitt im Wetter-Modul.",
        "Accueil : si des alertes d'intempéries sont actives à ton emplacement, la vignette météo affiche désormais un badge coloré avec le nombre et le niveau le plus élevé – un tap t'amène directement à la section des alertes du module météo.",
        "Home: se nella tua posizione ci sono allerte maltempo attive, il widget meteo mostra ora un badge colorato con il numero e il livello più alto – con un tocco arrivi direttamente alla sezione delle allerte nel modulo meteo.",
        "Home: when severe weather warnings are active at your location, the weather widget now carries a coloured badge with the count and the highest level – one tap takes you straight to the warnings section in the weather module."
      ),
      l4(
        "Einkaufsliste: Du kannst jetzt mehrere persönliche Listen führen – etwa «Wocheneinkauf» und «Camping». Oben schaltest du mit einem Tipp um, im Verwalten-Dialog legst du Listen an, benennst, sortierst und löschst sie; Teilen, Drucken und Übernahmen aus Rezepten, Menüplan oder Kühlbox beziehen sich immer auf die gewählte Liste. Deine bisherige Liste bleibt vollständig erhalten.",
        "Liste de courses : tu peux désormais tenir plusieurs listes personnelles – par exemple « Courses de la semaine » et « Camping ». En haut, tu bascules d'un tap, et la fenêtre de gestion te permet de créer, renommer, réordonner et supprimer des listes ; le partage, l'impression et les reprises depuis les recettes, le menu ou la glacière portent toujours sur la liste choisie. Ta liste actuelle est intégralement conservée.",
        "Lista della spesa: ora puoi tenere più liste personali – per esempio «Spesa settimanale» e «Campeggio». In alto passi da una all'altra con un tocco e nella finestra di gestione le crei, rinomini, riordini ed elimini; condivisione, stampa e importazioni da ricette, menù o frigo box riguardano sempre la lista scelta. La tua lista attuale resta intatta.",
        "Shopping list: you can now keep several personal lists – say “Weekly shop” and “Camping”. Switch between them with one tap at the top, and use the manage dialog to create, rename, reorder and delete lists; sharing, printing and imports from recipes, the meal plan or the cool box always apply to the selected list. Your existing list is kept in full."
      ),
      l4(
        "Inventar: Verliehene Ausrüstung geht nicht mehr vergessen – vermerke pro Gegenstand, an wen und seit wann du ihn verliehen hast, erkenne ihn am Badge «verliehen an …» und buche ihn mit einem Klick zurück; der Chip «Verliehen (N)» zeigt dir alles Ausgeliehene auf einen Blick.",
        "Inventaire : le matériel prêté ne se perd plus – note pour chaque objet à qui tu l'as prêté et depuis quand, repère-le grâce au badge « prêté à … » et récupère-le d'un clic ; la puce « Prêtés (N) » te montre d'un coup d'œil tout ce qui est sorti.",
        "Inventario: l'attrezzatura prestata non si dimentica più – annota per ogni oggetto a chi l'hai prestato e da quando, riconoscilo dal badge «prestato a …» e registralo come restituito con un clic; il chip «Prestati (N)» ti mostra a colpo d'occhio tutto ciò che è in prestito.",
        "Inventory: lent-out gear no longer gets forgotten – record for each item who has it and since when, spot it by the “lent to …” badge and book it back in with one click; the “Lent out (N)” chip shows everything that is out at a glance."
      ),
      l4(
        "Inventar: Erfasse neben dem Kaufdatum neu die Garantiedauer in Monaten – am Gegenstand siehst du dann «Garantie bis …» (grün, amber oder grau), und laufen Garantien in den nächsten 60 Tagen ab, meldet sich oben im Inventar ein Hinweis, der dir auf Klick genau diese Gegenstände zeigt.",
        "Inventaire : en plus de la date d'achat, tu peux désormais saisir la durée de garantie en mois – l'objet affiche alors « Garantie jusqu'au … » (vert, ambre ou gris), et si des garanties arrivent à échéance dans les 60 prochains jours, un message en haut de l'inventaire te montre ces objets d'un clic.",
        "Inventario: oltre alla data d'acquisto puoi indicare anche la durata della garanzia in mesi – sull'oggetto compare «Garanzia fino al …» (verde, ambra o grigio) e, se qualche garanzia scade nei prossimi 60 giorni, un avviso in cima all'inventario ti mostra quegli oggetti con un clic.",
        "Inventory: alongside the purchase date you can now record the warranty period in months – the item then shows “Warranty until …” (green, amber or grey), and if warranties expire within the next 60 days a note at the top of your inventory shows exactly those items with one click."
      ),
      l4(
        "Zeltplätze: Deine Plätze kennen jetzt ihre Höhe über Meer – sie wird automatisch ermittelt, steht auf der Favoriten-Karte und im Dossier und wird dort um einen Hinweis zur Höhenlage ergänzt (kühlere Nächte, warmer Schlafsack oder Frostgefahr im Sommer).",
        "Emplacements : tes emplacements connaissent désormais leur altitude – elle est déterminée automatiquement, s'affiche sur la carte des favoris et dans le dossier, où elle s'accompagne d'un conseil sur l'altitude (nuits plus fraîches, sac de couchage chaud ou risque de gel en été).",
        "Piazzole: le tue piazzole ora conoscono la loro quota – viene rilevata automaticamente, compare sulla scheda dei preferiti e nel dossier, dove trovi anche un consiglio sulla quota (notti più fresche, sacco a pelo caldo o rischio di gelo d'estate).",
        "Pitches: your pitches now know their elevation – it is determined automatically, shows on the favourites card and in the dossier, where it comes with a hint about the altitude (chilly nights, warm sleeping bag or frost risk in summer)."
      ),
      l4(
        "Sprachhilfe: Das neue Modul «Sprachhilfe» hat 60 Camping-Sätze von der Rezeption bis zum Notfall parat – du wählst die Zielsprache, siehst die Bedeutung in deiner App-Sprache, kopierst den Satz oder lässt ihn dir vorlesen.",
        "Aide linguistique : le nouveau module « Aide linguistique » propose 60 phrases de camping, de la réception à l'urgence – tu choisis la langue cible, tu vois le sens dans la langue de l'app, tu copies la phrase ou tu te la fais lire à voix haute.",
        "Aiuto linguistico: il nuovo modulo «Aiuto linguistico» offre 60 frasi da campeggio, dalla reception all'emergenza – scegli la lingua di destinazione, vedi il significato nella lingua dell'app, copi la frase o te la fai leggere ad alta voce.",
        "Phrasebook: the new “Phrasebook” module holds 60 camping phrases from reception to emergency – pick the target language, see the meaning in your app language, copy the phrase or have it read aloud."
      ),
      l4(
        "Familien-Modus: Zwei neue Schnitzeljagden warten auf dich – «Die Steinjäger» rund um Bachsteine, Farben und Kristalle sowie «Die Wind-Detektive» mit Windrichtung, Wolken und Wetter-Prognose. Beide mit Lösungswort, Stoppuhr und Druckansicht.",
        "Mode famille : deux nouvelles chasses au trésor t'attendent – « Les chasseurs de pierres » autour des galets, des couleurs et des cristaux, et « Les détectives du vent » avec direction du vent, nuages et pronostic météo. Les deux avec mot mystère, chronomètre et impression.",
        "Modalità famiglia: due nuove cacce al tesoro ti aspettano – «I cacciatori di sassi» tra ciottoli, colori e cristalli e «I detective del vento» con direzione del vento, nuvole e previsione del tempo. Entrambe con parola segreta, cronometro e stampa.",
        "Family mode: two new scavenger hunts are waiting – “The Stone Hunters” about river pebbles, colours and crystals, and “The Wind Detectives” with wind direction, clouds and a weather forecast. Both with a solution word, stopwatch and print view."
      ),
      l4(
        "Natur-Entdecker: Acht neue Arten füllen das Lexikon – Feldhase, Biber und Steinmarder bei den Tierspuren, Perseus und die Plejaden am Himmel sowie Bergahorn, Waldföhre und Vogelbeere bei den Bäumen. Natur-Quiz, Sammelalbum und Suche nehmen sie automatisch mit.",
        "Explorateur nature : huit nouvelles espèces enrichissent le lexique – lièvre, castor et fouine côté traces, Persée et les Pléiades dans le ciel, ainsi qu'érable sycomore, pin sylvestre et sorbier côté arbres. Le quiz nature, l'album et la recherche les intègrent automatiquement.",
        "Esploratore della natura: otto nuove specie arricchiscono il lessico – lepre, castoro e faina tra le tracce, Perseo e le Pleiadi in cielo, oltre ad acero di monte, pino silvestre e sorbo tra gli alberi. Quiz, album e ricerca li includono in automatico.",
        "Nature explorer: eight new species join the guide – brown hare, beaver and beech marten among the tracks, Perseus and the Pleiades in the sky, plus sycamore maple, Scots pine and rowan among the trees. The nature quiz, collection album and search pick them up automatically."
      ),
      l4(
        "Erste Hilfe: Vier neue Themen ergänzen den Guide – Fremdkörper im Auge, Verschlucken & Erstickungsgefahr, Sonnenbrand sowie Durchfall & Erbrechen, je mit Symptomen, Schritten und klaren Warnhinweisen «wann zum Arzt».",
        "Premiers secours : quatre nouveaux sujets complètent le guide – corps étranger dans l'œil, étouffement, coup de soleil ainsi que diarrhée & vomissements, chacun avec symptômes, gestes et consignes claires « quand consulter ».",
        "Primo soccorso: quattro nuovi temi completano la guida – corpo estraneo nell'occhio, soffocamento, scottatura solare e diarrea & vomito, ognuno con sintomi, passaggi e avvertenze chiare «quando andare dal medico».",
        "First aid: four new topics round out the guide – foreign body in the eye, choking, sunburn and diarrhoea & vomiting, each with symptoms, steps and clear “when to see a doctor” warnings."
      ),
      l4(
        "Knoten: Vier neue Anleitungen ergänzen die Bibliothek – Trucker-Hitch zum bretthart Spannen, Slipstek zum Lösen mit einem Zug, Zimmermannsschlag fürs Holzbündel und die Achterschlaufe als sichere Schlaufe. Quiz und Lernfortschritt nehmen sie automatisch mit.",
        "Nœuds : quatre nouvelles fiches enrichissent la bibliothèque – nœud de camionneur pour tendre à bloc, demi-clé gansée qui s'ouvre d'un seul geste, nœud de bois pour les fagots et nœud en huit double comme boucle sûre. Le quiz et ta progression les intègrent automatiquement.",
        "Nodi: quattro nuove schede arricchiscono la biblioteca – nodo del carrettiere per tendere al massimo, mezzo collo con gassa che si apre con un tiro solo, nodo del legnaiolo per i fasci di legna e nodo a otto ripassato come asola sicura. Quiz e progressi li includono in automatico.",
        "Knots: four new guides join the library – trucker's hitch for drum-tight lines, slipped half hitch that opens with one pull, timber hitch for firewood bundles and the figure-eight loop as a secure loop. The quiz and your learning progress pick them up automatically."
      ),
      l4(
        "Mitteilungen: Im Profil klappst du neu den «Verlauf» auf und liest nach, welche Push-Meldungen dein Konto zuletzt bekommen hat – mit Symbol, Zeitpunkt und Klick direkt ins passende Modul.",
        "Notifications : dans ton profil, ouvre le nouvel « historique » pour relire les dernières notifications envoyées à ton compte – avec icône, horodatage et accès direct au module concerné.",
        "Notifiche: nel profilo apri la nuova «cronologia» e rileggi le ultime notifiche ricevute dal tuo account – con icona, orario e accesso diretto al modulo giusto.",
        "Notifications: in your profile you can now open the new “history” and read back which push messages your account received – with icon, timestamp and a tap straight into the matching module."
      ),
      l4(
        "Passwörter: Beim Registrieren, beim Passwort-Wechsel im Profil und beim Zurücksetzen zeigt dir ein Balken sofort, wie stark dein Passwort ist – mit kurzen Tipps, solange es noch schwach ist.",
        "Mots de passe : à l'inscription, lors du changement dans le profil et lors de la réinitialisation, une barre t'indique aussitôt la force de ton mot de passe – avec de brefs conseils tant qu'il reste faible.",
        "Password: alla registrazione, al cambio nel profilo e al ripristino una barra ti mostra subito quanto è forte la tua password – con brevi consigli finché è ancora debole.",
        "Passwords: when registering, when changing it in your profile and when resetting it, a bar shows you right away how strong your password is – with short tips while it is still weak."
      ),
      l4(
        "Erste Hilfe: Der neue «Zeckenstich-Merker» hält Datum, Körperstelle und Notiz fest und zeigt dir zwei Wochen lang, wie lange du die Stelle noch beobachten solltest – fällige Beobachtungen stehen auch auf der Startseite.",
        "Premiers secours : le nouveau « mémo piqûres de tique » retient la date, l'endroit et une note, et t'indique pendant deux semaines combien de temps surveiller encore – les surveillances en cours apparaissent aussi sur l'accueil.",
        "Primo soccorso: il nuovo «promemoria morsi di zecca» annota data, parte del corpo e nota e per due settimane ti mostra quanto ancora osservare – le osservazioni in corso compaiono anche sulla pagina iniziale.",
        "First aid: the new “tick bite reminder” records date, body part and a note and shows you for two weeks how much longer to watch the spot – open observations also appear on the home page."
      ),
      l4(
        "Packlisten: Alte Listen wanderst du neu ins «Archiv» statt sie zu löschen – sie bleiben komplett erhalten, verschwinden aber aus der Übersicht und den Auswahl-Listen.",
        "Listes de bagages : range désormais tes anciennes listes dans les « archives » au lieu de les supprimer – elles restent complètes mais disparaissent de l'aperçu et des listes de sélection.",
        "Liste bagagli: le vecchie liste finiscono ora nell'«archivio» invece di essere eliminate – restano complete ma spariscono dalla panoramica e dagli elenchi di scelta.",
        "Packing lists: move old lists into the “archive” instead of deleting them – they stay complete but disappear from the overview and from selection lists."
      ),
      l4(
        "Meine Reisen: Bei laufenden und vergangenen Reisen führst du neu ein «Reise-Tagebuch» – pro Reisetag ein kurzer Eintrag, bei gemeinsamen Reisen mit «von …»; die Druckansicht nimmt es mit.",
        "Mes voyages : pour les séjours en cours et passés, tu tiens désormais un « journal de voyage » – une entrée par jour, avec « par … » sur les voyages partagés ; la vue d'impression le reprend.",
        "I miei viaggi: per i soggiorni in corso e passati tieni ora un «diario di viaggio» – una voce per ogni giorno, con «di …» nei viaggi condivisi; la stampa lo include.",
        "My trips: for ongoing and past stays you can now keep a “trip journal” – one entry per day, with “by …” on shared trips; the print view includes it."
      ),
      l4(
        "Neue Kachel «Statistik»: alle Auswertungen an einem Ort – Reisen, Wetter-Glück, Jahres-Vergleich, Meilensteine, Knoten-Fortschritt, Arten-Album und die Abzeichen deiner Kinder.",
        "Nouvelle tuile « Statistiques » : toutes tes analyses au même endroit – voyages, chance météo, comparaison annuelle, jalons, progression des nœuds, album des espèces et badges de tes enfants.",
        "Nuova scheda «Statistiche»: tutte le analisi in un posto – viaggi, fortuna meteo, confronto annuale, traguardi, progressi con i nodi, album delle specie e distintivi dei tuoi bambini.",
        "New “Statistics” tile: all your figures in one place – trips, weather luck, year comparison, milestones, knot progress, species album and your children's badges."
      ),
      l4(
        "Startseite: Im Sortier-Modus schaltest du unter «Widgets» einzelne Bereiche ab – Wetter, Tipp des Tages, Reise-Widget, Erste Schritte, «Vor einem Jahr» und «Zuletzt genutzt».",
        "Accueil : en mode tri, la section « Widgets » te permet de désactiver certaines zones – météo, astuce du jour, séjour, premiers pas, « il y a un an » et « utilisés récemment ».",
        "Pagina iniziale: in modalità ordinamento la sezione «Widget» ti lascia disattivare singole zone – meteo, consiglio del giorno, viaggio, primi passi, «un anno fa» e «usati di recente».",
        "Home: in sorting mode the “Widgets” section lets you switch off individual sections – weather, tip of the day, trip widget, first steps, “one year ago” and “recently used”."
      ),
      l4(
        "Startseite: «Vor einem Jahr» erinnert dich am Jahrestag an vergangene Aufenthalte – mit Ort, Nächten, Bewertung und Titelbild; für heute wegklickbar.",
        "Accueil : « Il y a un an » te rappelle tes séjours passés le jour anniversaire – avec le lieu, les nuits, la note et la photo principale ; masquable pour la journée.",
        "Pagina iniziale: «Un anno fa» ti ricorda i soggiorni passati nel giorno dell'anniversario – con luogo, notti, valutazione e immagine principale; si può nascondere per oggi.",
        "Home: “One year ago” reminds you of past stays on their anniversary – with place, nights, rating and cover photo; dismissable for the day."
      ),
      l4(
        "Teilen: Beim Erzeugen eines Teil-Links wählst du neu, wie lange er gültig bleibt – unbegrenzt oder 7, 30 bzw. 90 Tage. Danach führt der Link ins Leere.",
        "Partage : en créant un lien de partage, tu choisis désormais sa durée de validité – illimitée ou 7, 30 ou 90 jours. Ensuite, le lien ne mène plus nulle part.",
        "Condivisione: quando crei un link di condivisione scegli quanto resta valido – illimitato oppure 7, 30 o 90 giorni. Dopo il link non porta più a nulla.",
        "Sharing: when you create a share link you now choose how long it stays valid – unlimited or 7, 30 or 90 days. After that the link leads nowhere."
      ),
      l4(
        "Zelt-Finder: gib deinen Zielen ein Symbol (Zelt, Duschen, WC, Wasser …) – du erkennst sie in der Liste, im Kompass-Kopf und als Pin auf der Karte auf einen Blick.",
        "Boussole tente : donne un symbole à tes destinations (tente, douches, WC, eau …) – tu les reconnais d'un coup d'œil dans la liste, en tête de boussole et sur la carte.",
        "Trova-tenda: dai un simbolo alle tue destinazioni (tenda, docce, WC, acqua …) – le riconosci al volo nell'elenco, in cima alla bussola e sulla mappa.",
        "Tent finder: give your destinations a symbol (tent, showers, toilets, water …) – you spot them at a glance in the list, above the compass and as a map pin."
      ),
      l4(
        "Wasserwaage: wähle dein Profil «Zelt», «Bus» oder «Wohnwagen» – jedes bringt seine eigene Toleranz und passende Tipps zum Ausgleichen mit.",
        "Niveau à bulle : choisis ton profil « tente », « van » ou « caravane » – chacun a sa propre tolérance et ses conseils de mise à niveau.",
        "Livella: scegli il tuo profilo «tenda», «van» o «caravan» – ognuno ha la sua tolleranza e i consigli giusti per livellare.",
        "Spirit level: pick your profile – tent, van or caravan – each with its own tolerance and matching levelling tips."
      ),
      l4(
        "Wasserwaage: sobald der Stand im Lot ist, meldet sich die App mit einem kurzen Ton und einer Vibration – abschaltbar über den Schalter «Signalton».",
        "Niveau à bulle : dès que la position est de niveau, l'app te le signale par un bref son et une vibration – désactivable avec l'interrupteur « signal sonore ».",
        "Livella: appena sei in bolla, l'app te lo segnala con un breve suono e una vibrazione – disattivabile con l'interruttore «segnale acustico».",
        "Spirit level: as soon as everything is level, the app lets you know with a short tone and a vibration – switch it off with “signal tone”."
      ),
      l4(
        "Rezepte: nach dem Kochen trägst du die verbrauchten Zutaten mit einem Tipp aus der Kühlbox aus – die App schlägt dir die passenden Vorräte vor.",
        "Recettes : après avoir cuisiné, tu retires les ingrédients utilisés de la glacière en un geste – l'app te propose les provisions correspondantes.",
        "Ricette: dopo aver cucinato togli gli ingredienti consumati dal frigo box con un tocco – l'app ti propone le scorte corrispondenti.",
        "Recipes: after cooking you remove the used ingredients from the cool box in one go – the app suggests the matching supplies."
      ),
      l4(
        "Menüplan: tippe auf ein geplantes Rezept und du siehst Zutaten und Zubereitung direkt im Menüplan – ohne ins Rezeptbuch zu wechseln.",
        "Menus : touche une recette planifiée et tu vois les ingrédients et la préparation directement dans les menus – sans passer par le livre de recettes.",
        "Menu: tocca una ricetta pianificata e vedi ingredienti e preparazione direttamente nel menu – senza passare dal ricettario.",
        "Meal plan: tap a planned recipe and you see the ingredients and method right in the plan – no detour via the recipe book."
      ),
      l4(
        "Rezeptbuch: eigene Rezepte teilst du neu per Link oder QR-Code – wer ihn hat, sieht Zutaten und Zubereitung und kann das Rezept übernehmen (dein Foto bleibt privat).",
        "Livre de recettes : tu partages désormais tes recettes perso par lien ou code QR – qui l'a voit les ingrédients et la préparation et peut reprendre la recette (ta photo reste privée).",
        "Ricettario: ora condividi le tue ricette personali con un link o un codice QR – chi lo riceve vede ingredienti e preparazione e può salvare la ricetta (la tua foto resta privata).",
        "Recipe book: you can now share your own recipes by link or QR code – whoever has it sees the ingredients and method and can save the recipe (your photo stays private)."
      ),
      l4(
        "Natur: das neue Sammelalbum zeigt dir, welche Arten du schon beobachtet hast – mit Datum der ersten Sichtung und Sprung ins Lexikon.",
        "Nature : le nouvel album te montre les espèces que tu as déjà observées – avec la date de la première observation et un lien vers le lexique.",
        "Natura: il nuovo album ti mostra quali specie hai già osservato – con la data del primo avvistamento e il salto al lessico.",
        "Nature: the new album shows which species you have already spotted – with the date of the first sighting and a jump into the guide."
      ),
      l4(
        "Familien-Modus: das neue «Natur-Quiz» würfelt seine Fragen bei jedem Start frisch aus dem Natur-Lexikon – auch im Duell spielbar.",
        "Mode famille : le nouveau « quiz nature » tire ses questions du lexique nature à chaque démarrage – jouable aussi en duel.",
        "Modalità famiglia: il nuovo «quiz natura» estrae le sue domande dal lessico della natura a ogni avvio – giocabile anche in duello.",
        "Family mode: the new “nature quiz” draws fresh questions from the nature guide every time you start it – also playable as a duel."
      ),
      l4(
        "Natur: der Mondkalender hat neu eine Monatsansicht mit Phasen-Symbol pro Tag, hervorgehobenen Neu- und Vollmonden und markierten Sternschnuppen-Nächten.",
        "Nature : le calendrier lunaire propose désormais une vue mensuelle avec un symbole de phase par jour, les nouvelles et pleines lunes mises en évidence et les nuits d'étoiles filantes signalées.",
        "Natura: il calendario lunare ha ora una vista mensile con il simbolo della fase per ogni giorno, luna nuova e piena in evidenza e le notti di stelle cadenti segnalate.",
        "Nature: the moon calendar now has a month view with a phase symbol for every day, new and full moons highlighted and shooting star nights marked."
      ),
      l4(
        "Mitteilungen: am Abend vor der Anreise erinnert dich die App, falls die Packliste noch nicht fertig abgehakt ist.",
        "Notifications : la veille au soir du départ, l'app te rappelle que ta liste de bagages n'est pas encore terminée.",
        "Notifiche: la sera prima della partenza l'app ti ricorda che la lista bagagli non è ancora completata.",
        "Notifications: the evening before you leave, the app reminds you if your packing list is not fully ticked off."
      ),
      l4(
        "Meine Reisen: die neue Karte «Bereitschaft» zeigt pro geplanter Reise auf einen Blick, was noch fehlt – Packen, Menüplan, Einkäufe und Angaben.",
        "Mes séjours : la nouvelle carte « Préparation » montre pour chaque séjour prévu ce qui manque encore – bagages, menus, courses et informations.",
        "I miei viaggi: la nuova scheda «Preparazione» mostra per ogni viaggio in programma cosa manca ancora – bagagli, pasti, spesa e dati.",
        "My trips: the new “Readiness” card shows at a glance what is still missing for each planned trip – packing, meals, shopping and details."
      ),
      l4(
        "Packliste: gehört sie zu einer geteilten Reise, fügst du deine Mitreisenden mit einem Tipp als Personen-Bereich hinzu – dein eigener Bereich steht zuoberst.",
        "Liste de bagages : si elle appartient à un séjour partagé, tu ajoutes tes compagnons de voyage comme section en un clic – ta propre section reste tout en haut.",
        "Lista bagagli: se appartiene a un viaggio condiviso, aggiungi i tuoi compagni come sezione con un tocco – la tua sezione resta in cima.",
        "Packing list: if it belongs to a shared trip, add your travel companions as a section with one tap – your own section stays at the top."
      ),
      l4(
        "Pollenflug: markiere deine Allergie-Arten – sie stehen zuoberst, auf Wunsch zeigt die App nur sie.",
        "Pollens : marque les types qui te font réagir – ils apparaissent en premier, et l'app peut n'afficher qu'eux.",
        "Pollini: segna i tipi a cui sei allergico – compaiono per primi e, se vuoi, l'app mostra solo quelli.",
        "Pollen: mark the types you are allergic to – they appear first, and the app can show only those."
      ),
      l4(
        "Unwetter-Push: lege im Profil selbst fest, ab wie viel Wind und Regen du geweckt werden willst.",
        "Notification d'intempéries : définis toi-même dans ton profil à partir de quel vent et de quelle pluie tu veux être averti·e.",
        "Notifica di maltempo: stabilisci tu nel profilo da quanto vento e quanta pioggia vuoi essere avvisato.",
        "Storm notification: set for yourself in your profile how much wind and rain should alert you."
      ),
      l4(
        "Wetter: fällt der Luftdruck, warnt dich ein Hinweis frühzeitig vor einem Wetterumschwung.",
        "Météo : si la pression atmosphérique baisse, un message t'avertit tôt d'un changement de temps.",
        "Meteo: se la pressione atmosferica cala, un avviso ti segnala per tempo un cambiamento del tempo.",
        "Weather: if air pressure drops, a notice warns you early about a change in the weather."
      ),
      l4(
        "Wetter: im Tages-Detail siehst du neu Windrichtung und Böenspitzen im Verlauf.",
        "Météo : dans le détail du jour, tu vois désormais la direction du vent et les pointes de rafales au fil des heures.",
        "Meteo: nel dettaglio del giorno vedi ora la direzione del vento e le raffiche massime ora per ora.",
        "Weather: the day detail now shows wind direction and peak gusts through the day."
      ),
      l4(
        "Inventar: erfasse Preis, Kaufdatum und ein Beleg-Foto – der Gesamtwert deiner Ausrüstung steht zuoberst.",
        "Inventaire : saisis le prix, la date d'achat et une photo du justificatif – la valeur totale de ton équipement s'affiche tout en haut.",
        "Inventario: registra prezzo, data d'acquisto e una foto dello scontrino – il valore totale della tua attrezzatura è in cima.",
        "Inventory: record price, purchase date and a receipt photo – the total value of your gear is shown at the top."
      ),
      l4(
        "Inventar: Suchfeld und Kategorien-Filter finden auch in grossen Beständen sofort das Richtige.",
        "Inventaire : le champ de recherche et le filtre par catégorie trouvent tout de suite ce qu'il te faut, même dans un grand stock.",
        "Inventario: il campo di ricerca e il filtro per categoria trovano subito ciò che cerchi, anche in scorte grandi.",
        "Inventory: a search field and category filters find the right item straight away, even in a large collection."
      ),
      l4(
        "Neue Konten erhalten eine Bestätigungs-Mail – im Profil kannst du sie jederzeit erneut anfordern.",
        "Les nouveaux comptes reçoivent un e-mail de confirmation – tu peux le redemander à tout moment dans ton profil.",
        "I nuovi account ricevono un'e-mail di conferma – puoi richiederla di nuovo in ogni momento nel tuo profilo.",
        "New accounts receive a confirmation email – you can request it again anytime in your profile."
      ),
      l4(
        "Die Suche verzeiht jetzt Tippfehler: «Palstck» findet trotzdem den Palstek.",
        "La recherche pardonne désormais les fautes de frappe : «Palstck» trouve quand même le nœud de chaise.",
        "La ricerca ora perdona gli errori di battitura: «Palstck» trova comunque la gassa d'amante.",
        "Search now forgives typos: “Palstck” still finds the bowline."
      ),
      l4(
        "Gemeinsame Reise-Einkaufsliste: plane und hake Einkäufe zusammen mit deinen Mitreisenden ab.",
        "Liste de courses de voyage partagée : planifie et coche les achats avec tes compagnons de voyage.",
        "Lista della spesa di viaggio condivisa: pianifica e spunta gli acquisti con i tuoi compagni di viaggio.",
        "Shared trip shopping list: plan and tick off purchases together with your travel companions."
      ),
      l4(
        "Mitreisende einladen: teile eine Reise, damit alle mitplanen und mitbearbeiten können.",
        "Inviter des compagnons de voyage : partage un voyage pour que tout le monde puisse planifier et modifier.",
        "Invitare compagni di viaggio: condividi un viaggio così tutti possono pianificare e modificare.",
        "Invite travel companions: share a trip so everyone can plan and edit together."
      ),
      l4(
        "Reise-Kalender: sieh deine Reisen neu auch als Monatsübersicht.",
        "Calendrier des voyages : vois désormais tes voyages aussi en vue mensuelle.",
        "Calendario dei viaggi: ora vedi i tuoi viaggi anche in vista mensile.",
        "Trip calendar: now view your trips as a monthly overview too."
      ),
      l4(
        "Karte: Satelliten-Ansicht, gruppierte Pins, Distanz messen und «Mein Standort».",
        "Carte : vue satellite, épingles regroupées, mesure de distance et «Ma position».",
        "Mappa: vista satellitare, pin raggruppati, misurazione delle distanze e «La mia posizione».",
        "Map: satellite view, grouped pins, distance measuring and “My location”."
      ),
      l4(
        "«Neue Reise» erfasst du jetzt in einem aufgeräumten Dialog statt im Dauer-Formular.",
        "«Nouveau voyage» se saisit maintenant dans un dialogue épuré au lieu du formulaire permanent.",
        "«Nuovo viaggio» si inserisce ora in una finestra ordinata invece del modulo fisso.",
        "“New trip” is now entered in a tidy dialog instead of a permanent form."
      ),
      l4(
        "Menüplan: lass leere Tage automatisch füllen und notiere eine Tages-Notiz pro Reisetag.",
        "Menu : fais remplir les jours vides automatiquement et ajoute une note du jour par journée de voyage.",
        "Menu: fai riempire automaticamente i giorni vuoti e aggiungi una nota del giorno per ogni giornata di viaggio.",
        "Menu plan: auto-fill empty days and add a daily note for each trip day."
      ),
      l4(
        "Abgehakte Einkäufe räumst du mit einem Klick in die Kühlbox ein.",
        "Range les achats cochés dans la glacière en un clic.",
        "Sistemi gli acquisti spuntati nel frigo box con un clic.",
        "Put ticked-off purchases straight into the cool box with one click."
      ),
      l4(
        "Eigene Quizze kannst du per Link mit anderen Familien teilen.",
        "Tu peux partager tes propres quiz avec d'autres familles par lien.",
        "Puoi condividere i tuoi quiz con altre famiglie tramite link.",
        "Share your own quizzes with other families via a link."
      ),
      l4(
        "Schnitzeljagd: eine Stoppuhr misst eure Zeit und merkt sich die Bestzeit pro Jagd.",
        "Chasse au trésor : un chronomètre mesure votre temps et retient le meilleur temps par chasse.",
        "Caccia al tesoro: un cronometro misura il vostro tempo e ricorda il record per ogni caccia.",
        "Treasure hunt: a stopwatch times your run and remembers the best time per hunt."
      ),
      l4(
        "Passkeys: melde dich ohne Passwort an – per Fingerabdruck oder Gesichtserkennung.",
        "Passkeys : connecte-toi sans mot de passe – par empreinte digitale ou reconnaissance faciale.",
        "Passkey: accedi senza password – con impronta digitale o riconoscimento del viso.",
        "Passkeys: sign in without a password – using fingerprint or face recognition."
      ),
      l4(
        "Pflege-Erinnerungen: die App erinnert dich an fällige Ausrüstungs-Pflege wie Imprägnieren.",
        "Rappels d'entretien : l'app te rappelle l'entretien du matériel à faire, comme l'imperméabilisation.",
        "Promemoria di manutenzione: l'app ti ricorda la cura dell'attrezzatura in scadenza, come l'impermeabilizzazione.",
        "Care reminders: the app reminds you of due gear care such as re-waterproofing."
      ),
    ],
  },
];
