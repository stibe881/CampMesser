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
  {
    id: "2026-08-09.1",
    date: "2026-08-09",
    entries: [
      l4(
        "«Wer ist dabei?» steht jetzt bei der Reise. Beim Anlegen oder Bearbeiten einer Reise tippst du an, wer mitkommt – die Reisepässe übernehmen das von selbst, die Häkchenliste im Pass ist weg. Neu ist der Familien-Pass streng: Er stempelt nur Reisen, bei denen die ganze Familie dabei war. Und wer zur Familie zählt, bestimmst du pro Person im Pass – das Göttikind darf fehlen, ohne den Familien-Stempel zu verhindern.",
        "« Qui vient ? » se trouve désormais sur le voyage. En créant ou modifiant un voyage, tu indiques qui participe – les passeports le reprennent tout seuls, la liste à cocher dans le passeport a disparu. Nouveau : le passeport familial est strict et ne tamponne que les voyages où toute la famille était là. Et tu décides par personne qui compte comme famille – le filleul peut manquer sans empêcher le tampon familial.",
        "«Chi viene?» ora sta sul viaggio. Creando o modificando un viaggio indichi chi partecipa – i passaporti lo riprendono da soli, la lista di spunte nel passaporto è sparita. Novità: il passaporto di famiglia è severo e timbra solo i viaggi con tutta la famiglia. E per ogni persona decidi chi conta come famiglia – il figlioccio può mancare senza impedire il timbro di famiglia.",
        "“Who’s along?” now lives on the trip. When creating or editing a trip you tap who joins – the passports pick it up automatically, and the tick list in the passport is gone. New: the family passport is strict and only stamps trips where the whole family was along. You decide per person who counts as family – the godchild may be absent without blocking the family stamp."
      ),
      l4(
        "Der Reisepass erkennt den Platznamen jetzt auch bei Reisen, die nur über den verknüpften Zeltplatz benannt sind – vorher blieb der Stempel dort aus.",
        "Le passeport reconnaît désormais le nom de l’emplacement même pour les voyages nommés seulement via le camping lié – avant, le tampon manquait.",
        "Il passaporto ora riconosce il nome della piazzola anche per i viaggi denominati solo tramite il campeggio collegato – prima il timbro mancava.",
        "The passport now recognises the place name even for trips named only via the linked campsite – previously the stamp was missing there."
      ),
    ],
  },
];
