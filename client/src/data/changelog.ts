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
  {
    id: "2026-08-09.3",
    date: "2026-08-09",
    entries: [
      l4(
        "Die Druck-Knöpfe (Packliste, Reisepass, Reise-Bericht und weitere) funktionieren jetzt auch in der installierten App auf dem iPhone: Sie öffnen die Seite im Browser, wo sich der Druck-Dialog zuverlässig zeigt.",
        "Les boutons d'impression (liste de bagages, passeport, rapport de voyage et autres) fonctionnent désormais aussi dans l'app installée sur iPhone : ils ouvrent la page dans le navigateur, où la boîte d'impression s'affiche de façon fiable.",
        "I pulsanti di stampa (lista bagagli, passaporto, rapporto di viaggio e altri) ora funzionano anche nell'app installata su iPhone: aprono la pagina nel browser, dove la finestra di stampa appare in modo affidabile.",
        "The print buttons (packing list, passport, trip report and more) now also work in the installed app on iPhone: they open the page in the browser, where the print dialog shows up reliably."
      ),
      l4(
        "Die Packliste kennt neu eine Limite pro Person – zum Beispiel 23 kg Fluggepäck. Die Traglast-Zeile färbt ein, wer darüber liegt. Dazu gibt es neue Vorlagen für Hotelferien und Velotouren, und beim Anlegen einer Reise schlägt die App gleich die passende Packliste vor.",
        "La liste de bagages connaît désormais une limite par personne – par exemple 23 kg de bagages en avion. La ligne de charge met en évidence qui la dépasse. S'y ajoutent de nouveaux modèles pour les vacances à l'hôtel et les tours à vélo, et en créant un voyage, l'app propose directement la liste adaptée.",
        "La lista bagagli ora conosce un limite per persona – per esempio 23 kg di bagaglio aereo. La riga del carico evidenzia chi lo supera. In più ci sono nuovi modelli per le vacanze in hotel e i giri in bici, e creando un viaggio l'app propone subito la lista adatta.",
        "The packing list now knows a limit per person – for example 23 kg of flight luggage. The load line highlights who is over it. There are also new templates for hotel holidays and bike tours, and when creating a trip the app suggests the matching list right away."
      ),
      l4(
        "Die Reisekasse holt den Euro-Kurs jetzt bei der EZB: Der Referenzkurs steht mit Datum im Kurs-Kasten und lässt sich mit einem Klick übernehmen – offline bleibt der letzte bekannte Kurs.",
        "La caisse de voyage va désormais chercher le cours de l'euro à la BCE : le cours de référence figure avec sa date dans l'encadré et se reprend d'un clic – hors ligne, le dernier cours connu reste disponible.",
        "La cassa di viaggio ora prende il cambio dell'euro dalla BCE: il tasso di riferimento sta con la sua data nel riquadro e si applica con un clic – offline resta l'ultimo cambio noto.",
        "The trip wallet now fetches the euro rate from the ECB: the reference rate sits in the rate box with its date and can be applied with one click – offline, the last known rate remains."
      ),
      l4(
        "Mehr Wissen fürs Reiseland: Die Länder-Seite zeigt neu Steckdosen samt Adapter-Tipp und den Trinkgeld-Knigge. Bei einer laufenden Auslandsreise stellt die SOS-Seite die Notrufnummern deines Reiselands zuoberst, und das Reise-Cockpit verweist vor der Abreise auf die Regeln des Ziellands.",
        "Plus de repères pour le pays de voyage : la page des pays montre désormais les prises avec conseil d'adaptateur et les usages du pourboire. Pendant un voyage à l'étranger, la page SOS place les numéros d'urgence de ton pays de voyage en tête, et le cockpit du voyage renvoie avant le départ aux règles du pays de destination.",
        "Più riferimenti per il paese di viaggio: la pagina dei paesi ora mostra le prese con consiglio sull'adattatore e il galateo della mancia. Durante un viaggio all'estero la pagina SOS mette in cima i numeri di emergenza del tuo paese di viaggio, e il cockpit del viaggio rimanda prima della partenza alle regole della destinazione.",
        "More know-how for your destination: the countries page now shows plug types with an adapter tip and the tipping etiquette. During a trip abroad the SOS page puts your destination's emergency numbers on top, and the trip cockpit points to the destination's rules before departure."
      ),
      l4(
        "Die Umgebung kennt deine Reiseart noch besser: Velotouren zeigen Velo-Läden und Werkstätten, der Wintersport Bahnen und Loipen samt Neuschnee-Angabe, das Platz-Dossier Waschsalons und die SOS-Seite die nächsten Apotheken mit Öffnungszeiten.",
        "Les environs connaissent encore mieux ton type de voyage : les tours à vélo montrent magasins et ateliers vélo, les sports d'hiver les remontées et pistes de fond avec la neige fraîche, le dossier de l'emplacement les laveries et la page SOS les pharmacies les plus proches avec horaires.",
        "I dintorni conoscono ancora meglio il tuo tipo di viaggio: i giri in bici mostrano negozi e officine, gli sport invernali impianti e piste di fondo con la neve fresca, il dossier della piazzola le lavanderie e la pagina SOS le farmacie più vicine con gli orari.",
        "The surroundings know your trip type even better: bike tours show bike shops and repair stations, winter sports show lifts and cross-country trails plus fresh snow, the spot dossier shows laundromats and the SOS page the nearest pharmacies with opening hours."
      ),
      l4(
        "Kleines dazu: Hotel- und Städtereisen erfassen Zimmer statt Parzelle, die Sprachhilfe kennt vier neue Hotel-Sätze, das Wetter schlägt den Ort deiner nächsten Reise als Wetter-Ort vor, und die Liste «Was ist neu» lädt ihre ältere Geschichte erst auf Wunsch.",
        "En plus : les voyages à l'hôtel et en ville saisissent une chambre au lieu d'une parcelle, l'aide linguistique connaît quatre nouvelles phrases d'hôtel, la météo propose le lieu de ton prochain voyage comme lieu météo, et « Quoi de neuf » ne charge son historique ancien que sur demande.",
        "In più: i viaggi in hotel e in città registrano una camera invece di una piazzola, l'aiuto linguistico conosce quattro nuove frasi da hotel, il meteo propone il luogo del tuo prossimo viaggio come località meteo, e «Cosa c'è di nuovo» carica la storia più vecchia solo su richiesta.",
        "Also new: hotel and city trips record a room instead of a pitch, the phrasebook knows four new hotel phrases, the weather suggests your next trip's location as a weather place, and “What's new” loads its older history only on request."
      ),
    ],
  },
  {
    id: "2026-08-09.2",
    date: "2026-08-09",
    entries: [
      l4(
        "Der Rückblick nach der Reise ist jetzt nach Kategorien gegliedert – wie die Packliste selbst. Und was gefehlt hat, bekommt beim Erfassen gleich seine Kategorie: Der Vorschlag auf der Packliste legt es später in die richtige Gruppe statt in «Allgemein».",
        "La rétrospective après le voyage est désormais structurée par catégories – comme la liste de bagages. Et ce qui a manqué reçoit sa catégorie dès la saisie : la suggestion sur la liste le placera ensuite dans le bon groupe au lieu de « Général ».",
        "La retrospettiva dopo il viaggio ora è suddivisa per categorie – come la lista bagagli. E ciò che è mancato riceve subito la sua categoria: il suggerimento sulla lista lo metterà poi nel gruppo giusto invece che in «Generale».",
        "The post-trip review is now grouped by categories – just like the packing list. And missing items get their category right when you note them: the suggestion on the list later places them in the right group instead of “General”."
      ),
      l4(
        "Unwetter-Push nur noch, wo du gerade bist: Gewarnt wird am Ort der laufenden Reise (verknüpfter Platz oder Ort mit Koordinaten) – nicht mehr das ganze Jahr für jeden gespeicherten Platz und den Heim-Standort. Das Daheim wird nur noch gewarnt, wenn eine laufende Reise in seiner Nähe liegt. In der App selbst siehst du die Warnungen deiner Plätze weiterhin jederzeit.",
        "Alerte intempéries seulement là où tu es : l’avertissement concerne le lieu du voyage en cours (emplacement lié ou lieu avec coordonnées) – plus toute l’année pour chaque emplacement enregistré et le domicile. Le domicile n’est averti que si un voyage en cours se trouve à proximité. Dans l’app, tu vois toujours les alertes de tes emplacements à tout moment.",
        "Avviso maltempo solo dove sei: l’avviso riguarda il luogo del viaggio in corso (piazzola collegata o luogo con coordinate) – non più tutto l’anno per ogni piazzola salvata e per casa. Casa viene avvisata solo se un viaggio in corso è nelle vicinanze. Nell’app vedi comunque sempre gli avvisi delle tue piazzole.",
        "Storm push only where you are: warnings cover the location of the running trip (linked spot or place with coordinates) – no longer all year for every saved spot and your home. Home is only warned when a running trip is nearby. In the app itself you still see your spots’ warnings at any time."
      ),
    ],
  },
];
