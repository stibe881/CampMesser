import { l4 } from "@shared/i18n";
import type { ChangelogBlock } from "./changelogMeta";

/**
 * «Was ist neu»: die NEUSTEN nutzersichtbaren Änderungen der App, gruppiert
 * nach Veröffentlichungs-Blöcken. Der neueste Block steht zuoberst; die Ids
 * sind aufsteigend sortierbar aufgebaut (ISO-Datum + laufende Nummer, z. B.
 * "2026-08-03.1"), damit «gesehen bis Id X» einfach vergleichbar bleibt.
 *
 * Pflegepflicht: Jeder Feature-Batch ergänzt seine nutzersichtbaren Features
 * als je EINE kurze L4-Zeile (Du-Form) im obersten Block – neuer Block, falls
 * von heute noch keiner existiert. Reine Fixes/Interna gehören NICHT hierher.
 * Kein Vollständigkeitsanspruch: die wichtigsten Neuerungen zuerst. Dazu
 * gehören zwei weitere Handgriffe: Die Id des obersten Blocks steht in
 * `changelogMeta.ts` und muss mitgezogen werden, und sobald hier mehr als
 * drei Blöcke stehen, wandern die ältesten nach `changelogArchive.ts`
 * (#535) – der Test `server/changelogMeta.test.ts` wacht über beides.
 *
 * DIESE DATEI WIRD NUR DYNAMISCH GELADEN. Sie darf nirgends statisch
 * importiert werden – wer Blöcke anzeigen will, holt sie per
 * `await import("@/data/changelog")`. Den Typ liefert `changelogMeta.ts`.
 * Die älteren Blöcke liegen in `changelogArchive.ts` und kommen erst auf
 * «Ältere anzeigen» dazu – so lädt der Start-Dialog ein paar kB statt der
 * ganzen App-Geschichte (die allein gegen 350 kB wiegt).
 */

export type { ChangelogBlock };

export const changelog: ChangelogBlock[] = [
  {
    id: "2026-08-09.8",
    date: "2026-08-09",
    entries: [
      l4(
        "Deine Reise als Geschichte: Die neue Zeitachse mischt Journal, Tages-Fotos, Ausgaben und Etappen-Ank\u00fcnfte chronologisch \u2013 und ein zweiter Teil-Link zeigt Verwandten die Reise als Bericht mit Titelbild, Journal und Foto-Galerie.",
        "Ton voyage comme une histoire\u00a0: la nouvelle chronologie m\u00e9lange journal, photos du jour, d\u00e9penses et arriv\u00e9es d\u2019\u00e9tape dans l\u2019ordre \u2013 et un deuxi\u00e8me lien de partage montre le voyage \u00e0 la famille comme un r\u00e9cit avec photo de titre, journal et galerie.",
        "Il tuo viaggio come una storia: la nuova cronologia mescola diario, foto del giorno, spese e arrivi di tappa in ordine \u2013 e un secondo link di condivisione mostra il viaggio ai parenti come racconto con foto di copertina, diario e galleria.",
        "Your trip as a story: the new timeline mixes journal, daily photos, expenses and stage arrivals in order \u2013 and a second share link shows relatives the trip as a report with cover photo, journal and photo gallery."
      ),
      l4(
        "Rundreisen leichter geplant: \u00abK\u00fcrzeste Runde\u00bb sortiert die Etappen entlang der k\u00fcrzesten Strecke, eine gelungene Reise speicherst du als eigene Vorlage \u2013 und der Weiterreise-Hinweis am Vorabend nennt neu das Wetter am Ziel.",
        "Les circuits se planifient plus facilement\u00a0: \u00ab\u00a0Boucle la plus courte\u00a0\u00bb trie les \u00e9tapes le long du trajet le plus court, tu enregistres un voyage r\u00e9ussi comme mod\u00e8le personnel \u2013 et le rappel de d\u00e9part de la veille annonce d\u00e9sormais la m\u00e9t\u00e9o \u00e0 destination.",
        "I giri si pianificano pi\u00f9 facilmente: \u00abGiro pi\u00f9 corto\u00bb ordina le tappe lungo il percorso pi\u00f9 breve, salvi un viaggio riuscito come modello personale \u2013 e il promemoria della partenza della sera prima ora indica il meteo a destinazione.",
        "Round trips are easier to plan: \u201cShortest loop\u201d sorts the stages along the shortest route, you save a successful trip as your own template \u2013 and the evening move-on reminder now names the weather at the destination."
      ),
      l4(
        "Die grosse Karte kann suchen und importieren: Die Ortssuche f\u00e4hrt die Karte hin, GPX- und KML-Dateien bringen Wegpunkte als Merkorte mit \u2013 und die Statistik zeigt auf einer Mini-Karte, wo ihr \u00fcberall wart, samt Reisekosten nach Land.",
        "La grande carte sait chercher et importer\u00a0: la recherche de lieu y conduit la carte, les fichiers GPX et KML apportent leurs points comme lieux retenus \u2013 et les statistiques montrent sur une mini-carte o\u00f9 vous \u00eates all\u00e9s, avec les frais de voyage par pays.",
        "La grande mappa sa cercare e importare: la ricerca dei luoghi porta la mappa sul posto, i file GPX e KML aggiungono i loro punti come luoghi salvati \u2013 e le statistiche mostrano su una mini-mappa dove siete stati, con i costi di viaggio per paese.",
        "The big map can search and import: the place search flies the map there, GPX and KML files bring their waypoints in as saved places \u2013 and the statistics show on a mini map where you have been, including travel costs by country."
      ),
      l4(
        "In der K\u00fcche: Der Barcode-Scan holt Produktnamen f\u00fcr K\u00fchlbox und Vorrat aus der freien Lebensmittel-Datenbank, und jedes Rezept tr\u00e4gt neu deine Koch-Notiz samt \u00abzuletzt gekocht\u00bb.",
        "En cuisine\u00a0: le scan du code-barres r\u00e9cup\u00e8re les noms de produits pour la glaci\u00e8re et la r\u00e9serve depuis la base alimentaire libre, et chaque recette porte d\u00e9sormais ta note de cuisine avec \u00ab\u00a0cuisin\u00e9 la derni\u00e8re fois\u00a0\u00bb.",
        "In cucina: la scansione del codice a barre recupera i nomi dei prodotti per frigo e dispensa dalla banca dati alimentare libera, e ogni ricetta porta ora la tua nota di cucina con \u00abcucinato l\u2019ultima volta\u00bb.",
        "In the kitchen: the barcode scan fetches product names for cool box and pantry from the free food database, and every recipe now carries your cooking note plus \u201clast cooked\u201d."
      ),
      l4(
        "Am Platz und unterwegs: Der Ampere-Helfer sagt vor dem Einstecken, ob die S\u00e4ulen-Sicherung h\u00e4lt, der Wasser-Tracker rechnet Frisch- und Grauwassertank in Tage um, der Fahrtkosten-Rechner sch\u00e4tzt neu die Streckenmaut \u2013 und die Ausr\u00fcstungs-Pflege kennt Service-Merker f\u00fcr Fahrzeug und Wohnwagen.",
        "\u00c0 l\u2019emplacement et en route\u00a0: l\u2019aide amp\u00e8res dit avant de brancher si le fusible de la borne tiendra, le suivi de l\u2019eau convertit r\u00e9servoirs d\u2019eau propre et d\u2019eaux grises en jours, le calculateur de trajet estime d\u00e9sormais le p\u00e9age \u2013 et l\u2019entretien du mat\u00e9riel conna\u00eet des rappels de service pour v\u00e9hicule et caravane.",
        "In piazzola e in viaggio: l\u2019aiuto ampere dice prima di collegare se il fusibile della colonnina regge, il tracker dell\u2019acqua converte i serbatoi in giorni, il calcolatore dei costi di viaggio ora stima il pedaggio \u2013 e la cura dell\u2019attrezzatura conosce promemoria di servizio per veicolo e roulotte.",
        "At the pitch and on the road: the ampere helper tells you before plugging in whether the bollard fuse will hold, the water tracker turns fresh and grey tanks into days, the trip cost calculator now estimates road tolls \u2013 and gear care knows service reminders for vehicle and caravan."
      ),
      l4(
        "F\u00fcr die Familie gibt es ein L\u00e4nder-Quiz mit Flaggen aus dem L\u00e4nder-Nachschlagewerk \u2013 und das Reise-Offline-Paket nimmt neu auch Etappen, Journal und Merkorte mit ins Funkloch.",
        "Pour la famille, un quiz des pays avec les drapeaux du guide des pays \u2013 et le pack hors ligne du voyage emporte d\u00e9sormais aussi \u00e9tapes, journal et lieux retenus dans la zone blanche.",
        "Per la famiglia c\u2019\u00e8 un quiz dei paesi con le bandiere del prontuario \u2013 e il pacchetto offline del viaggio ora porta con s\u00e9 anche tappe, diario e luoghi salvati dove non c\u2019\u00e8 campo.",
        "For the family there is a country quiz with flags from the country reference \u2013 and the trip offline pack now takes stages, journal and saved places into the dead zone too."
      ),
    ],
  },
  {
    id: "2026-08-09.7",
    date: "2026-08-09",
    entries: [
      l4(
        "Merkorte können mehr: Foto direkt im Karten-Popup, ein Knopf macht aus dem Merkort einen Zeltplatz-Favoriten (das Foto zügelt mit), Farb-Chips mit eigenen Namen filtern die Karte, Gelöschtes liegt 30 Tage im Papierkorb – und die Heute-Ansicht sagt dir, wenn ein Merkort in der Nähe ist.",
        "Les lieux repérés savent en faire plus : photo directement dans la bulle de la carte, un bouton transforme le lieu en emplacement favori (la photo déménage avec), des pastilles de couleur avec tes propres noms filtrent la carte, ce qui est supprimé reste 30 jours dans la corbeille – et la vue Aujourd'hui te dit quand un lieu repéré est à proximité.",
        "I luoghi salvati sanno fare di più: foto direttamente nel popup della mappa, un pulsante trasforma il luogo in piazzola preferita (la foto trasloca con lui), chip colorati con nomi personali filtrano la mappa, ciò che elimini resta 30 giorni nel cestino – e la vista Oggi ti avvisa quando un luogo salvato è nelle vicinanze.",
        "Saved places can do more: photo right in the map popup, one button turns a saved place into a favourite spot (the photo moves along), colour chips with your own names filter the map, deleted places stay in the bin for 30 days – and the Today view tells you when a saved place is nearby."
      ),
      l4(
        "Rundreisen sichtbar gemacht: Die Karte zeichnet die Etappen-Routen deiner Reisen als Linien (eigene Ebene), die neue Vorlage «Rundreise» legt drei Etappen gleich mit an, Duplizieren nimmt die Etappen mit, jede Etappe zeigt ihre Nächte – und im Tagebuch filterst du neu nach Jahr.",
        "Les circuits deviennent visibles : la carte trace les itinéraires d'étapes de tes voyages en lignes (couche dédiée), le nouveau modèle « Circuit » crée d'emblée trois étapes, la duplication emporte les étapes, chaque étape affiche ses nuits – et dans le journal tu filtres désormais par année.",
        "I giri si vedono: la mappa disegna le rotte a tappe dei tuoi viaggi come linee (livello dedicato), il nuovo modello «Tour itinerante» crea subito tre tappe, la duplicazione porta con sé le tappe, ogni tappa mostra le sue notti – e nel diario ora filtri per anno.",
        'Road trips made visible: the map draws your trips\' stage routes as lines (own layer), the new "Road trip" template sets up three stages right away, duplicating takes the stages along, each stage shows its nights – and in the journal you can now filter by year.'
      ),
      l4(
        "Erinnerungen mit Wetter: Das Reise-Tagebuch zeigt zu jedem Tag das damalige Wetter aus dem Archiv, der gedruckte Reise-Bericht enthält jetzt auch die Tages-Fotos des Journals – und die Schnell-Ausgabe fotografiert den Beleg gleich mit.",
        "Des souvenirs avec la météo : le journal de voyage montre pour chaque jour la météo d'alors depuis l'archive, le rapport de voyage imprimé contient désormais aussi les photos du jour du journal – et la saisie rapide photographie le justificatif en même temps.",
        "Ricordi con il meteo: il diario di viaggio mostra per ogni giorno il meteo di allora dall'archivio, il rapporto di viaggio stampato ora contiene anche le foto del giorno del diario – e la registrazione rapida fotografa subito lo scontrino.",
        "Memories with weather: the trip journal shows each day's past weather from the archive, the printed trip report now also includes the journal's photos of the day – and the quick expense photographs the receipt right away."
      ),
      l4(
        "Unterwegs im Ausland: Der Vignetten-Richtpreis (CH/AT/SI) wandert per Knopf in die Reisekasse, am Abend vor einem Feiertag im Reiseland warnt dich ein Push («Läden oft geschlossen») – und das SOS kennt neu die Spitäler in der Nähe.",
        "En route à l'étranger : le prix indicatif de la vignette (CH/AT/SI) rejoint la caisse de voyage d'un bouton, la veille d'un jour férié du pays de voyage une notification t'avertit (« magasins souvent fermés ») – et le SOS connaît désormais les hôpitaux à proximité.",
        "In viaggio all'estero: il prezzo indicativo della vignetta (CH/AT/SI) entra nella cassa di viaggio con un pulsante, la sera prima di un festivo del paese di viaggio una notifica ti avvisa («negozi spesso chiusi») – e l'SOS ora conosce gli ospedali nelle vicinanze.",
        'On the road abroad: the vignette guide price (CH/AT/SI) goes into the travel fund with one button, the evening before a public holiday in your destination a push warns you ("shops often closed") – and the SOS now knows the hospitals nearby.'
      ),
      l4(
        "Zahlen, die Freude machen: Das Tankbuch zeigt die Tank-Kosten pro Monat, die Statistik eine Rekorde-Karte (meiste Nächte am Stück, längste Etappe, weiteste Rundreise) – und die Reisekasse filtert die Posten neu nach Person.",
        "Des chiffres qui font plaisir : le carnet de carburant montre les coûts par mois, les statistiques une carte des records (le plus de nuits d'affilée, étape la plus longue, circuit le plus long) – et la caisse de voyage filtre désormais les dépenses par personne.",
        "Numeri che fanno piacere: il libretto carburante mostra i costi al mese, le statistiche una scheda dei record (più notti di fila, tappa più lunga, tour più lungo) – e la cassa di viaggio ora filtra le spese per persona.",
        "Numbers that spark joy: the fuel log shows fuel costs per month, the statistics a records card (most nights in a row, longest stage, longest road trip) – and the travel fund now filters expenses by person."
      ),
      l4(
        "Fein abgestimmt: Deine Schriftgrösse gilt jetzt auf allen Geräten, die Packliste zeigt je Person einen Fortschritts-Balken, sechs neue One-Pot-Rezepte warten im Rezeptbuch – und wer im System «Bewegung reduzieren» eingeschaltet hat, bekommt eine ruhige App ohne Animationen.",
        "Finement réglé : ta taille de police vaut maintenant sur tous les appareils, la liste de bagages affiche une barre de progression par personne, six nouvelles recettes en une casserole t'attendent dans le livre de recettes – et si « réduire les animations » est activé dans le système, l'app reste calme, sans animations.",
        "Messo a punto: la tua dimensione dei caratteri ora vale su tutti i dispositivi, la lista bagagli mostra una barra di avanzamento per persona, sei nuove ricette in pentola unica ti aspettano nel ricettario – e chi ha attivato «riduci animazioni» nel sistema ha un'app tranquilla, senza animazioni.",
        'Fine-tuned: your font size now applies on all devices, the packing list shows a progress bar per person, six new one-pot recipes await in the recipe book – and if "reduce motion" is on in your system, the app stays calm without animations.'
      ),
    ],
  },
  {
    id: "2026-08-09.6",
    date: "2026-08-09",
    entries: [
      l4(
        "Kilometer heissen jetzt Strassen-Kilometer: Rundreise-Statistik, Merkorte-Liste, Zeltplatz-Favoriten und Platz-Vergleich rechnen über die Strasse (OpenStreetMap-Routing) statt Luftlinie – ohne Netz bleibt die Luftlinie, und wo geschätzt wird, steht es dabei.",
        "Les kilomètres sont désormais des kilomètres par la route : statistiques d’itinérance, liste des lieux repérés, emplacements favoris et comparaison d’emplacements calculent par la route (routage OpenStreetMap) au lieu du vol d’oiseau – hors ligne, le vol d’oiseau reste, et quand c’est estimé, c’est indiqué.",
        "I chilometri ora sono chilometri su strada: statistiche degli itinerari, lista dei luoghi salvati, piazzole preferite e confronto piazzole calcolano su strada (routing OpenStreetMap) invece che in linea d’aria – offline resta la linea d’aria, e dove si stima, è indicato.",
        "Kilometres are now road kilometres: round-trip statistics, saved places list, favourite spots and the spot comparison calculate by road (OpenStreetMap routing) instead of as the crow flies – offline the straight line remains, and where estimated, it says so."
      ),
      l4(
        "Neue Reiseart «Freies Campen»: Zelten ohne Campingplatz. Die Heute-Ansicht stellt Landesregeln, Trinkwasser-Rechner und Feuer-Ratgeber nach vorn, und die neue Packvorlage denkt an Wasserfilter, Schäufelchen und Abfallsäcke – alles wieder mitnehmen.",
        "Nouveau type de voyage « Camping sauvage » : camper sans terrain. La vue Aujourd’hui met en avant les règles des pays, le calculateur d’eau potable et le guide du feu, et le nouveau modèle de liste pense au filtre à eau, à la petite pelle et aux sacs poubelle – tout remporter.",
        "Nuovo tipo di viaggio «Campeggio libero»: in tenda senza campeggio. La vista Oggi mette in primo piano regole dei paesi, calcolatore dell’acqua potabile e guida al fuoco, e il nuovo modello di lista pensa a filtro dell’acqua, paletta e sacchi per i rifiuti – riportare tutto.",
        "New trip type “Wild camping”: tenting without a campsite. The Today view brings country rules, the drinking water calculator and the fire guide to the front, and the new packing template thinks of a water filter, trowel and rubbish bags – pack everything out."
      ),
      l4(
        "Vergangene Aufenthalte lassen sich jetzt archivieren: Sie verschwinden aus der Liste in einen eigenen Archiv-Abschnitt, bleiben aber in Statistik, Reisepass und Suche erhalten – und kommen per Klick zurück.",
        "Les séjours passés peuvent désormais être archivés : ils quittent la liste pour une section d’archives dédiée, mais restent dans les statistiques, le passeport et la recherche – et reviennent d’un clic.",
        "I soggiorni passati ora si possono archiviare: spariscono dalla lista in una sezione archivio dedicata, ma restano in statistiche, passaporto e ricerca – e tornano con un clic.",
        "Past stays can now be archived: they leave the list for a dedicated archive section but remain in statistics, passport and search – and come back with one click."
      ),
      l4(
        "Ein Bild sagt mehr: Jeder Merkort und jeder Tag im Reise-Journal kann jetzt EIN Foto tragen – die Bucht aus dem Prospekt am Stern auf der Karte, das Gipfelfoto am Tageseintrag.",
        "Une image en dit plus : chaque lieu repéré et chaque jour du journal de voyage peut désormais porter UNE photo – la crique du prospectus sur l’étoile de la carte, la photo du sommet sur l’entrée du jour.",
        "Un’immagine dice di più: ogni luogo salvato e ogni giorno del diario di viaggio ora può portare UNA foto – la baia del dépliant sulla stella della mappa, la foto della vetta sulla voce del giorno.",
        "A picture says more: every saved place and every day in the trip journal can now carry ONE photo – the cove from the brochure on the map star, the summit photo on the day entry."
      ),
      l4(
        "Orte aus anderen Karten-Apps landen per Teilen-Menü direkt als Merkort: Die App liest Koordinaten aus geo:-Links, Google Maps und OpenStreetMap und speichert den Punkt mit einem Klick.",
        "Les lieux d’autres apps de cartes arrivent via le menu Partager directement comme lieu repéré : l’app lit les coordonnées des liens geo:, de Google Maps et d’OpenStreetMap et enregistre le point d’un clic.",
        "I luoghi di altre app di mappe arrivano dal menu Condividi direttamente come luogo salvato: l’app legge le coordinate dai link geo:, da Google Maps e da OpenStreetMap e salva il punto con un clic.",
        "Places from other map apps arrive via the share menu directly as a saved place: the app reads coordinates from geo: links, Google Maps and OpenStreetMap and saves the point with one click."
      ),
      l4(
        "Die Etappen sind überall angekommen: Beim Erfassen schlagen Favoriten und Merkorte den Ort vor, verschobene Etappen nehmen auf Wunsch die folgenden mit, der Vorabend-Hinweis kennt den Weiterzug, die Suche findet Etappen, und die Statistik zählt Etappen-Kilometer und Länder-Nächte.",
        "Les étapes sont partout : à la saisie, favoris et lieux repérés proposent le lieu, les étapes déplacées emmènent sur demande les suivantes, l’avis de la veille connaît le départ, la recherche trouve les étapes, et les statistiques comptent kilomètres d’étapes et nuits par pays.",
        "Le tappe sono arrivate ovunque: nell’inserimento preferiti e luoghi salvati propongono il posto, le tappe spostate portano con sé su richiesta le successive, l’avviso serale conosce la partenza, la ricerca trova le tappe, e le statistiche contano chilometri di tappa e notti per paese.",
        "Stages have arrived everywhere: when entering, favourites and saved places suggest the location, moved stages take the following ones along on request, the evening notice knows about moving on, search finds stages, and statistics count stage kilometres and country nights."
      ),
      l4(
        "Drei neue Länder im Regel-Katalog – Tschechien, Polen und Ungarn mit E-Vignetten-Fallen und Camping-Hinweisen – plus eine neue Karte «Motorrad & Velo» für alle 18 Länder. Und die SOS-Seite kennt jetzt die Pannenhilfe.",
        "Trois nouveaux pays dans le catalogue des règles – Tchéquie, Pologne et Hongrie avec pièges de la vignette électronique et conseils camping – plus une nouvelle carte « Moto & vélo » pour les 18 pays. Et la page SOS connaît désormais le dépannage.",
        "Tre nuovi paesi nel catalogo delle regole – Cechia, Polonia e Ungheria con trappole della vignetta elettronica e consigli campeggio – più una nuova scheda «Moto e bici» per tutti i 18 paesi. E la pagina SOS ora conosce il soccorso stradale.",
        "Three new countries in the rules catalogue – Czechia, Poland and Hungary with e-vignette traps and camping notes – plus a new “Motorbike & bike” card for all 18 countries. And the SOS page now knows roadside assistance."
      ),
      l4(
        "Rund ums Wetter: Das Reise-Cockpit zeigt eine Wetterampel über deine Reisetage, die Heute-Ansicht nennt Schneefallgrenze und dicke Luft, die Schnell-Ausgabe rechnet das Tagesbudget vor – und auf dem iPhone sind die zu breiten Datumsfelder repariert.",
        "Autour de la météo : le cockpit du voyage montre un feu météo sur tes jours de voyage, la vue Aujourd’hui indique la limite pluie-neige et l’air pollué, la saisie rapide calcule le budget du jour – et sur iPhone, les champs de date trop larges sont réparés.",
        "Intorno al meteo: il cockpit del viaggio mostra un semaforo meteo sui tuoi giorni di viaggio, la vista Oggi indica il limite delle nevicate e l’aria pesante, la spesa rapida calcola il budget del giorno – e su iPhone i campi data troppo larghi sono riparati.",
        "Around the weather: the trip cockpit shows a weather light across your trip days, the Today view names the snow line and heavy air, the quick expense shows the day budget – and on iPhone the too-wide date fields are fixed."
      ),
    ],
  },
];
