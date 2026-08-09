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
  {
    id: "2026-08-09.5",
    date: "2026-08-09",
    entries: [
      l4(
        "Neue Reiseart Motorradurlaub: Packliste, Schnellzugriffe (Länderregeln, Tankbuch, Reparatur) und Formular passen sich an – wie bei allen Reisearten. Und die Velotour darf neu auch ans Lagerfeuer.",
        "Nouveau type de voyage « moto » : liste de bagages, accès rapides (règles des pays, carnet d’essence, réparation) et formulaire s’adaptent – comme pour chaque type de voyage. Et le tour à vélo a désormais droit au feu de camp.",
        "Nuovo tipo di viaggio «moto»: lista bagagli, accessi rapidi (regole dei paesi, libretto carburante, riparazione) e modulo si adattano – come per ogni tipo di viaggio. E il giro in bici ora può stare anche al falò.",
        "New trip type motorbike tour: packing list, quick links (country rules, fuel log, repair) and the form adapt – as with every trip type. And the bike tour is now allowed at the campfire too."
      ),
      l4(
        "Drucken klappt jetzt auch aus der installierten App: Die Druckseiten melden dich im Browser-Tab über ein kurzlebiges Ticket selbst an – kein «Anmeldung erforderlich» mehr beim Reisepass und den anderen Druckansichten.",
        "L’impression fonctionne désormais aussi depuis l’app installée : les pages d’impression te connectent elles-mêmes dans l’onglet du navigateur via un ticket éphémère – fini le « connexion requise » pour le passeport et les autres vues d’impression.",
        "La stampa ora funziona anche dall’app installata: le pagine di stampa ti collegano da sole nella scheda del browser tramite un ticket a breve durata – niente più «accesso richiesto» per il passaporto e le altre viste di stampa.",
        "Printing now works from the installed app too: the print pages sign you in inside the browser tab via a short-lived ticket – no more “sign-in required” for the passport and the other print views."
      ),
      l4(
        "Der Rückblick nach der Reise ist einen Klick nah: Der Hinweis auf der Startseite springt direkt hin. Und er kennt jetzt Personen – wie die Packliste: filtern nach Person, und was gefehlt hat, gehört gleich jemandem.",
        "La rétrospective après le voyage est à un clic : l’indication sur la page d’accueil y mène directement. Et elle connaît désormais les personnes – comme la liste de bagages : filtrer par personne, et ce qui a manqué appartient tout de suite à quelqu’un.",
        "La retrospettiva dopo il viaggio è a un clic: l’avviso sulla pagina iniziale porta direttamente lì. E ora conosce le persone – come la lista bagagli: filtri per persona, e ciò che è mancato appartiene subito a qualcuno.",
        "The post-trip review is one tap away: the note on the home page jumps straight to it. And it now knows people – like the packing list: filter by person, and whatever was missing belongs to someone right away."
      ),
      l4(
        "Etappen überall: Druckbericht und Kalender-Export führen die Stationen auf, der Kalender zeigt Etappen-Tage, das Tages-Journal weiss, wo du warst. Dazu Fahrzeit und Distanz zwischen den Etappen, Wetter je Etappe, ein Weiterreise-Hinweis am Vorabend, eine Offline-Karte der ganzen Rundreise – und der Unwetter-Push warnt am Ort der aktuellen Etappe.",
        "Les étapes partout : le rapport imprimé et l’export calendrier listent les stations, le calendrier montre les jours d’étape, le journal sait où tu étais. S’y ajoutent temps de route et distance entre les étapes, la météo par étape, un rappel de départ la veille, une carte hors ligne de tout le circuit – et l’alerte intempéries surveille l’étape actuelle.",
        "Tappe ovunque: il rapporto stampato e l’esportazione calendario elencano le stazioni, il calendario mostra i giorni di tappa, il diario sa dove eri. In più tempo di guida e distanza tra le tappe, meteo per tappa, un promemoria della partenza la sera prima, una mappa offline dell’intero giro – e l’avviso maltempo sorveglia la tappa attuale.",
        "Stages everywhere: the printed report and the calendar export list the stops, the calendar shows stage days, the journal knows where you were. Plus driving time and distance between stages, weather per stage, a move-on reminder the evening before, an offline map of the whole round trip – and the storm push watches your current stage."
      ),
      l4(
        "Merkorte werden nützlicher: Vom Stern auf der Karte machst du direkt eine Etappe oder planst eine Reise, unter der Karte steht die Liste aller Merkorte mit Notiz und Distanz von zuhause – und die globale Suche findet sie.",
        "Les lieux retenus deviennent plus utiles : depuis l’étoile sur la carte, tu crées directement une étape ou planifies un voyage, sous la carte figure la liste de tous les lieux avec note et distance de chez toi – et la recherche globale les trouve.",
        "I luoghi salvati diventano più utili: dalla stella sulla mappa crei direttamente una tappa o pianifichi un viaggio, sotto la mappa c’è l’elenco di tutti i luoghi con nota e distanza da casa – e la ricerca globale li trova.",
        "Saved places get more useful: from the star on the map you create a stage or plan a trip directly, below the map sits the list of all saved places with note and distance from home – and the global search finds them."
      ),
      l4(
        "Die Reisekasse denkt mit: Mitten in der Reise sagt sie dein Tagesbudget bis zur Abreise, die Beleg-Galerie zeigt alle Quittungen einer Reise beisammen, und beim Planen schätzt die App die Übernachtungskosten aus deinen bisherigen Reisen gleicher Art.",
        "La caisse de voyage réfléchit avec toi : en plein voyage, elle indique ton budget quotidien jusqu’au départ, la galerie des justificatifs montre tous les tickets d’un voyage ensemble, et à la planification l’app estime les coûts de nuitée d’après tes voyages passés du même type.",
        "La cassa di viaggio pensa con te: durante il viaggio indica il tuo budget giornaliero fino alla partenza, la galleria degli scontrini mostra tutte le ricevute di un viaggio insieme, e in fase di pianificazione l’app stima i costi di pernottamento dai tuoi viaggi passati dello stesso tipo.",
        "The trip wallet thinks along: mid-trip it tells you your daily budget until departure, the receipt gallery shows all of a trip’s receipts together, and while planning the app estimates the nightly costs from your past trips of the same kind."
      ),
      l4(
        "Unterwegs besser informiert: Die Wetterseite zeigt die Luftqualität als Ampel (auch im Morgen-Briefing, wenn sie schlecht ist), die Heute-Ansicht warnt vor Feiertagen des Reiselands – Läden zu, Einkauf vorher. Die Länder-Seite kennt neu Schweden, Norwegen und Belgien, und die Sprachhilfe hilft bei Panne und Werkstatt in vier Sprachen.",
        "Mieux informé en route : la page météo montre la qualité de l’air en feu tricolore (aussi dans le briefing du matin quand elle est mauvaise), la vue Aujourd’hui avertit des jours fériés du pays de voyage – magasins fermés, courses avant. La page des pays connaît désormais la Suède, la Norvège et la Belgique, et l’aide linguistique t’assiste en cas de panne et au garage en quatre langues.",
        "Meglio informati in viaggio: la pagina meteo mostra la qualità dell’aria come semaforo (anche nel briefing del mattino quando è cattiva), la vista Oggi avvisa dei giorni festivi del paese di viaggio – negozi chiusi, spesa prima. La pagina dei paesi ora conosce Svezia, Norvegia e Belgio, e l’aiuto linguistico ti assiste con guasti e officina in quattro lingue.",
        "Better informed on the road: the weather page shows air quality as a traffic light (also in the morning briefing when it is bad), the Today view warns about your destination’s public holidays – shops closed, shop beforehand. The countries page now covers Sweden, Norway and Belgium, and the phrasebook helps with breakdowns and the garage in four languages."
      ),
    ],
  },
];
