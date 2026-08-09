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
    id: "2026-08-09.6",
    date: "2026-08-09",
    entries: [
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
  {
    id: "2026-08-09.4",
    date: "2026-08-09",
    entries: [
      l4(
        "Die Startseite zeigt sich neu: Die Suche steht jetzt direkt im Titelbild \u2013 ein Tipp, und du findest Wissen und eigene Inhalte. Der Titel sagt, was die App heute ist: Alle deine Reisen. In einer App.",
        "La page d\u2019accueil fait peau neuve : la recherche se trouve d\u00e9sormais directement dans l\u2019image de titre \u2013 un geste, et tu trouves le savoir et tes propres contenus. Le titre dit ce qu\u2019est l\u2019app aujourd\u2019hui : tous tes voyages, dans une seule app.",
        "La pagina iniziale si rinnova: la ricerca ora sta direttamente nell\u2019immagine di copertina \u2013 un tocco, e trovi conoscenze e contenuti tuoi. Il titolo dice cos\u2019\u00e8 l\u2019app oggi: tutti i tuoi viaggi, in una sola app.",
        "The home page has a fresh look: the search now sits right in the hero image \u2013 one tap and you find knowledge and your own content. The title says what the app is today: all your travels, in one app."
      ),
      l4(
        "Rundreisen bekommen Etappen: Trage pro Reise mehrere Orte mit eigenem Von/Bis ein \u2013 eine Mini-Karte verbindet die Stationen, und die Heute-Ansicht zeigt Wetter und Umgebung der Etappe, an der du gerade bist.",
        "Les circuits ont d\u00e9sormais des \u00e9tapes : saisis plusieurs lieux par voyage avec leurs propres dates \u2013 une mini-carte relie les stations, et la vue Aujourd\u2019hui montre la m\u00e9t\u00e9o et les environs de l\u2019\u00e9tape o\u00f9 tu te trouves.",
        "I viaggi itineranti ora hanno le tappe: inserisci pi\u00f9 luoghi per viaggio con date proprie \u2013 una mini-mappa collega le stazioni, e la vista Oggi mostra meteo e dintorni della tappa in cui ti trovi.",
        "Road trips now have stages: enter several places per trip with their own dates \u2013 a mini map connects the stops, and the Today view shows weather and surroundings of the stage you are at."
      ),
      l4(
        "Merkorte auf der Karte: Ein Klick auf eine freie Stelle legt neu wahlweise ein Wunschziel ab \u2013 mit Notiz und eigener Pin-Farbe. Beim Anlegen einer Reise schl\u00e4gt die App deine Merkorte gleich als Ort vor.",
        "Lieux \u00e0 retenir sur la carte : un clic sur un endroit libre d\u00e9pose d\u00e9sormais au choix une destination de r\u00eave \u2013 avec note et couleur de rep\u00e8re. En cr\u00e9ant un voyage, l\u2019app propose directement tes lieux retenus comme lieu.",
        "Luoghi da ricordare sulla mappa: un clic su un punto libero ora salva a scelta una meta dei desideri \u2013 con nota e colore del segnaposto. Creando un viaggio l\u2019app propone subito i tuoi luoghi salvati come luogo.",
        "Saved places on the map: a click on a free spot can now store a wish-list destination \u2013 with a note and your own pin colour. When creating a trip the app suggests your saved places right away."
      ),
      l4(
        "Die Reisekasse nimmt jetzt Beleg-Fotos: H\u00e4nge an jede Ausgabe die Quittung \u2013 als kleines Vorschaubild in der Liste, f\u00fcrs Abrechnen daheim. Und aus der Heute-Ansicht erf\u00e4sst du eine Ausgabe neu mit zwei Tipps.",
        "La caisse de voyage accepte d\u00e9sormais des photos de justificatifs : joins le ticket \u00e0 chaque d\u00e9pense \u2013 en petite vignette dans la liste, pour les comptes de retour. Et depuis la vue Aujourd\u2019hui, tu saisis une d\u00e9pense en deux gestes.",
        "La cassa di viaggio ora accetta foto degli scontrini: allega la ricevuta a ogni spesa \u2013 come piccola anteprima nella lista, per i conti a casa. E dalla vista Oggi registri una spesa con due tocchi.",
        "The trip wallet now takes receipt photos: attach the receipt to every expense \u2013 as a small thumbnail in the list, for settling up at home. And from the Today view you record an expense with two taps."
      ),
      l4(
        "Das Wetter plant mit: Der neue Wetterfenster-Finder bewertet alle Wochenenden der 16-Tage-Prognose, das Men\u00fcplan-Autof\u00fcllen l\u00e4sst Feuer-Rezepte an Regentagen weg, und an Regentagen schl\u00e4gt die Heute-Ansicht Museen und B\u00e4der in der N\u00e4he vor.",
        "La m\u00e9t\u00e9o participe \u00e0 la planification : le nouveau chercheur de fen\u00eatres m\u00e9t\u00e9o \u00e9value tous les week-ends des 16 jours de pr\u00e9visions, le remplissage automatique du menu \u00e9carte les recettes au feu les jours de pluie, et les jours de pluie la vue Aujourd\u2019hui propose mus\u00e9es et piscines \u00e0 proximit\u00e9.",
        "Il meteo aiuta a pianificare: il nuovo cercatore di finestre meteo valuta tutti i weekend dei 16 giorni di previsioni, il riempimento automatico del men\u00f9 salta le ricette al fuoco nei giorni di pioggia, e nei giorni piovosi la vista Oggi propone musei e piscine nelle vicinanze.",
        "The weather helps you plan: the new weather-window finder rates all weekends of the 16-day forecast, the menu auto-fill skips open-fire recipes on rainy days, and on rainy days the Today view suggests museums and pools nearby."
      ),
      l4(
        "Offline und unterwegs: Zu jeder gezeichneten Route l\u00e4dst du jetzt die Karten-Kacheln entlang der Strecke aufs Ger\u00e4t. Die L\u00e4nder-Seite kennt neu Portugal, Griechenland und D\u00e4nemark sowie \u00fcberall den Umgang mit Bargeld und Karte; f\u00e4llt ein Feiertag des Reiselands in deine Reise, sagt es das Cockpit.",
        "Hors ligne et en route : pour chaque itin\u00e9raire dessin\u00e9, tu charges d\u00e9sormais les tuiles de carte le long du trac\u00e9 sur l\u2019appareil. La page des pays conna\u00eet d\u00e9sormais le Portugal, la Gr\u00e8ce et le Danemark ainsi que partout l\u2019usage du cash et de la carte ; si un jour f\u00e9ri\u00e9 du pays de voyage tombe pendant ton voyage, le cockpit te le dit.",
        "Offline e in viaggio: per ogni percorso disegnato ora scarichi sul dispositivo le tessere della mappa lungo il tracciato. La pagina dei paesi ora conosce Portogallo, Grecia e Danimarca e ovunque l\u2019uso di contanti e carta; se una festivit\u00e0 del paese di viaggio cade nel tuo viaggio, il cockpit te lo dice.",
        "Offline and on the road: for every drawn route you can now store the map tiles along the track on your device. The countries page now covers Portugal, Greece and Denmark plus cash-and-card habits everywhere; if a public holiday of your destination falls into your trip, the cockpit tells you."
      ),
      l4(
        "Viele kleine Helfer: Pack- und Einkaufsliste als Text kopieren, abhakbare K\u00e4stchen in Notizen, eigene S\u00e4tze in der Sprachhilfe, gr\u00f6ssere Schrift im Profil, ein Jahresziel f\u00fcr Reisen\u00e4chte in der Statistik \u2013 und der Notruf-Satz nennt in der Schweiz neu die Koordinaten, mit denen die Einsatzzentrale arbeitet.",
        "Plein de petits assistants : copier la liste de bagages ou de courses comme texte, des cases \u00e0 cocher dans les notes, tes propres phrases dans l\u2019aide linguistique, une \u00e9criture plus grande dans le profil, un objectif annuel de nuit\u00e9es dans les statistiques \u2013 et la phrase d\u2019urgence indique en Suisse les coordonn\u00e9es utilis\u00e9es par la centrale d\u2019engagement.",
        "Tanti piccoli aiuti: copiare la lista bagagli o della spesa come testo, caselle da spuntare nelle note, frasi personali nell\u2019aiuto linguistico, caratteri pi\u00f9 grandi nel profilo, un obiettivo annuale di notti in viaggio nelle statistiche \u2013 e la frase d\u2019emergenza in Svizzera ora indica le coordinate usate dalla centrale operativa.",
        "Lots of small helpers: copy packing and shopping lists as text, tickable boxes in notes, your own phrases in the phrasebook, larger text in the profile, a yearly goal for travel nights in the statistics \u2013 and in Switzerland the emergency phrase now includes the coordinates the dispatch centre works with."
      ),
    ],
  },
];
