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
    id: "2026-08-10.1",
    date: "2026-08-10",
    entries: [
      l4(
        "Neu hat jede Reise einen Tagesplan: Trag pro Reisetag ein, was ihr vorhabt (mit Zeit, wenn du magst) \u2013 die Heute-Ansicht zeigt das Tagesprogramm zum Abhaken, Mitreisende planen mit, und der Reisebericht druckt das Programm mit.",
        "Chaque voyage a d\u00e9sormais un programme du jour\u00a0: note pour chaque jour ce que vous pr\u00e9voyez (avec l\u2019heure si tu veux) \u2013 la vue Aujourd\u2019hui montre le programme \u00e0 cocher, les compagnons planifient avec toi, et le rapport de voyage l\u2019imprime aussi.",
        "Ogni viaggio ora ha un programma del giorno: annota per ogni giorno cosa avete in programma (con orario, se vuoi) \u2013 la vista Oggi mostra il programma da spuntare, i compagni pianificano con te e il resoconto di viaggio lo stampa.",
        "Every trip now has a day plan: note for each day what you are planning (with a time if you like) \u2013 the Today view shows the day\u2019s programme to tick off, companions plan along, and the trip report prints it too."
      ),
    ],
  },
  {
    id: "2026-08-09.9",
    date: "2026-08-09",
    entries: [
      l4(
        "Der Reisepass kann mehr: Sichere ihn als Bild f\u00fcrs Teilen (das geht auch in der App sofort), unter den Platz-Stempeln sammelst du neu L\u00e4nder-Stempel mit Flagge \u2013 und eine neue Stufe wird gefeiert statt still gewechselt.",
        "Le passeport sait en faire plus\u00a0: enregistre-le comme image \u00e0 partager (\u00e7a marche aussi tout de suite dans l\u2019app), sous les tampons des campings tu collectionnes d\u00e9sormais des tampons de pays avec drapeau \u2013 et chaque nouveau niveau est f\u00eat\u00e9 au lieu de changer en silence.",
        "Il passaporto sa fare di pi\u00f9: salvalo come immagine da condividere (funziona subito anche nell\u2019app), sotto i timbri dei campeggi ora collezioni timbri dei paesi con bandiera \u2013 e ogni nuovo livello viene festeggiato invece di cambiare in silenzio.",
        "The passport can do more: save it as an image to share (works instantly in the app too), below the campsite stamps you now collect country stamps with flags \u2013 and a new level gets celebrated instead of changing silently."
      ),
      l4(
        "Am Platz: Die Wasserwaage rechnet dir die Keil-H\u00f6he aus (Radstand und Spurweite stehen neu am Fahrzeug-Profil), und das Energie-Budget sch\u00e4tzt aus dem kWh-Preis der S\u00e4ule deine Stromkosten pro Tag und Woche.",
        "Sur place\u00a0: le niveau \u00e0 bulle calcule la hauteur de cale (empattement et voie figurent d\u00e9sormais dans le profil du v\u00e9hicule), et le budget d\u2019\u00e9nergie estime tes frais d\u2019\u00e9lectricit\u00e9 par jour et par semaine \u00e0 partir du prix du kWh de la borne.",
        "In piazzola: la livella calcola l\u2019altezza del cuneo (passo e carreggiata ora stanno nel profilo del veicolo), e il bilancio energetico stima i costi della corrente al giorno e alla settimana dal prezzo al kWh della colonnina.",
        "At the pitch: the spirit level calculates the wedge height for you (wheelbase and track width now live in the vehicle profile), and the energy budget estimates your power costs per day and week from the bollard\u2019s kWh price."
      ),
      l4(
        "Beim Planen: Der Rundreise-Planer warnt vor Tagesetappen \u00fcber f\u00fcnf Stunden, und \u00abWohin im \u2026?\u00bb bei den Reisen erinnert dich, wo du in einem Monat schon einmal gl\u00fccklich warst.",
        "En planifiant\u00a0: le planificateur de circuit signale les \u00e9tapes de plus de cinq heures, et \u00ab\u00a0O\u00f9 aller en \u2026\u00a0?\u00a0\u00bb dans les voyages te rappelle o\u00f9 tu as d\u00e9j\u00e0 \u00e9t\u00e9 heureux ce mois-l\u00e0.",
        "Nella pianificazione: il pianificatore dei giri avvisa per tappe oltre le cinque ore, e \u00abDove andare a \u2026?\u00bb nei viaggi ti ricorda dove sei gi\u00e0 stato felice in quel mese.",
        "When planning: the round-trip planner warns about driving days over five hours, and \u201cWhere to in \u2026?\u201d in your trips reminds you where you were already happy in that month."
      ),
      l4(
        "F\u00fcr Hund und Land: Das L\u00e4nder-Nachschlagewerk kennt neu Ruhezeiten, Sonntags-Gepflogenheiten und Hunde-Regeln der wichtigsten L\u00e4nder, es gibt eine Packvorlage \u00abCamping mit Hund\u00bb \u2013 und die Einkaufs-Suche am Platz findet jetzt auch Tier\u00e4rzte.",
        "Pour le chien et le pays\u00a0: le guide des pays conna\u00eet d\u00e9sormais les heures de repos, les usages du dimanche et les r\u00e8gles pour chiens des principaux pays, il y a un mod\u00e8le de liste \u00ab\u00a0Camping avec chien\u00a0\u00bb \u2013 et la recherche de commerces pr\u00e8s du camping trouve aussi les v\u00e9t\u00e9rinaires.",
        "Per cane e paese: il prontuario dei paesi ora conosce orari di riposo, usanze domenicali e regole per i cani dei paesi principali, c\u2019\u00e8 un modello \u00abCampeggio con il cane\u00bb \u2013 e la ricerca dei negozi vicino al campeggio trova anche i veterinari.",
        "For dog and country: the country reference now knows quiet hours, Sunday customs and dog rules of the main countries, there is a \u201cCamping with a dog\u201d packing template \u2013 and the shop search near the site now also finds vets."
      ),
      l4(
        "Unterwegs pers\u00f6nlicher: Geburtstage der Familie erscheinen w\u00e4hrend der Reise in der Heute-Ansicht, das Tages-Journal tr\u00e4gt eine Stimmung \u2013 und die Merkorte lassen sich nach Name und Notiz durchsuchen.",
        "Plus personnel en route\u00a0: les anniversaires de la famille apparaissent dans la vue Aujourd\u2019hui pendant le voyage, le journal du jour porte une humeur \u2013 et les lieux retenus se cherchent par nom et note.",
        "Pi\u00f9 personale in viaggio: i compleanni della famiglia appaiono nella vista Oggi durante il viaggio, il diario del giorno porta un umore \u2013 e i luoghi salvati si cercano per nome e nota.",
        "More personal on the road: family birthdays appear in the Today view during the trip, the daily journal carries a mood \u2013 and saved places can be searched by name and note."
      ),
      l4(
        "Zwei neue Mitteilungen: Freitags ein Blick aufs Wochenend-Wetter daheim (nur, wenn es sich lohnt) \u2013 und die Reisekasse meldet sich bei 80 % und beim Erreichen der Limite.",
        "Deux nouvelles notifications\u00a0: le vendredi, un aper\u00e7u de la m\u00e9t\u00e9o du week-end \u00e0 la maison (seulement si \u00e7a en vaut la peine) \u2013 et la caisse de voyage se manifeste \u00e0 80\u00a0% et \u00e0 la limite.",
        "Due nuove notifiche: il venerd\u00ec uno sguardo al meteo del weekend a casa (solo se ne vale la pena) \u2013 e la cassa di viaggio si fa sentire all\u201980\u00a0% e al raggiungimento del limite.",
        "Two new notifications: on Fridays a look at the weekend weather at home (only when it\u2019s worth it) \u2013 and the travel fund speaks up at 80% and when the limit is reached."
      ),
    ],
  },
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
];
