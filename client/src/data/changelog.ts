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
