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
