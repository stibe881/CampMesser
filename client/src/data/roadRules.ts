/**
 * Maut, Vignette & Regeln pro Land (#228): Kurzinfo für die Anreise – was
 * kostet die Strasse, wie schnell darfst du mit Anhänger fahren, was muss an
 * Bord sein, wo gelten Umweltzonen und wie ist das mit dem Übernachten.
 *
 * Gepflegter Datensatz im Repo, KEIN externer Abruf: Die Angaben sind offline
 * verfügbar und tragen je Land ein Stand-Datum. Regeln ändern sich – in der UI
 * steht darum sichtbar, dass vor der Fahrt zu prüfen ist.
 *
 * Alle sichtbaren Texte liegen als L4 in vier Sprachen vor. Zahlen (Tempo,
 * Promille) stehen als Zahl, damit die Tabelle in jeder Sprache gleich aussieht.
 */
import { l4, type L4 } from "@shared/i18n";
import { normalizeText } from "@shared/textMatch";

/** Tempolimits mit Anhänger in km/h. */
export interface CountrySpeedLimits {
  motorway: number;
  rural: number;
  urban: number;
}

export interface CountryRules {
  /** ISO-Ländercode (Grossbuchstaben), zugleich Schlüssel in der URL. */
  code: string;
  /** Flaggen-Emoji für die Auswahl. */
  flag: string;
  name: L4;
  /** Stand der Angaben als ISO-Datum. */
  updated: string;
  /** Vignetten- und Mautpflicht. */
  toll: L4;
  /** Was für den Anhänger gilt. */
  trailer: L4;
  /** Tempolimits MIT Anhänger. */
  speed: CountrySpeedLimits;
  speedNote: L4;
  /** Promillegrenze für erfahrene Lenkerinnen und Lenker. */
  bacPermille: number;
  bacNote: L4;
  /** Warnwesten-, Pannendreieck- und weitere Mitführpflichten. */
  equipment: L4;
  /** Umweltzonen und Einfahrtsbeschränkungen. */
  zones: L4;
  /** Wichtigste Notrufnummer. */
  emergency: string;
  emergencyNote: L4;
  /** Besonderheiten fürs Campen, inkl. Übernachten auf Rastplätzen. */
  camping: L4;
  /** Wörter, die auf dieses Land hindeuten (Ortsnamen einer Reise). */
  aliases: string[];
}

export const roadRules: CountryRules[] = [
  {
    code: "CH",
    flag: "🇨🇭",
    name: l4("Schweiz", "Suisse", "Svizzera", "Switzerland"),
    updated: "2026-08-03",
    toll: l4(
      "Autobahn-Vignette Pflicht für alle Fahrzeuge bis 3,5 t – als Kleber oder als E-Vignette fürs Kontrollschild, gültig von Anfang Dezember des Vorjahres bis Ende Januar des Folgejahres (14 Monate). Über 3,5 t gilt die pauschale Schwerverkehrsabgabe. Eine Streckenmaut gibt es sonst nicht; der Grosse-St.-Bernhard-Tunnel und die Autoverlade (Furka, Lötschberg, Vereina) kosten extra.",
      "Vignette autoroutière obligatoire pour tous les véhicules jusqu'à 3,5 t – autocollant ou vignette électronique liée à la plaque, valable de début décembre de l'année précédente à fin janvier de l'année suivante (14 mois). Au-delà de 3,5 t s'applique la redevance forfaitaire sur le trafic des poids lourds. Sinon pas de péage au kilomètre ; le tunnel du Grand-Saint-Bernard et les navettes ferroviaires (Furka, Lötschberg, Vereina) sont payants.",
      "Vignetta autostradale obbligatoria per tutti i veicoli fino a 3,5 t – adesivo o vignetta elettronica legata alla targa, valida da inizio dicembre dell'anno precedente a fine gennaio dell'anno successivo (14 mesi). Oltre 3,5 t vale la tassa forfettaria sul traffico pesante. Per il resto non c'è pedaggio a tratta; il tunnel del Gran San Bernardo e i treni navetta (Furka, Lötschberg, Vereina) si pagano a parte.",
      "Motorway vignette required for all vehicles up to 3.5 t – as a sticker or as an e-vignette tied to the number plate, valid from early December of the previous year to the end of January of the following year (14 months). Above 3.5 t the flat heavy vehicle charge applies. There is no distance-based toll otherwise; the Great St Bernard tunnel and the car-carrying trains (Furka, Lötschberg, Vereina) cost extra."
    ),
    trailer: l4(
      "Der Anhänger braucht eine EIGENE Vignette – der Wohnwagen genauso wie der kleine Lastenanhänger.",
      "La remorque a besoin de sa PROPRE vignette – la caravane comme la petite remorque de charge.",
      "Il rimorchio ha bisogno di una PROPRIA vignetta – sia il caravan sia il piccolo rimorchio da carico.",
      "The trailer needs its OWN vignette – the caravan just as much as a small load trailer."
    ),
    speed: { motorway: 80, rural: 80, urban: 50 },
    speedNote: l4(
      "Mit Anhänger gilt landesweit Tempo 80 – auf Autobahn und Autostrasse gleich wie ausserorts.",
      "Avec remorque, 80 km/h dans tout le pays – sur autoroute et semi-autoroute comme hors localité.",
      "Con rimorchio vale 80 km/h in tutto il paese – in autostrada e semiautostrada come fuori dai centri abitati.",
      "With a trailer the limit is 80 km/h nationwide – on motorways and expressways just as outside built-up areas."
    ),
    bacPermille: 0.5,
    bacNote: l4(
      "0,5 ‰; für Neulenkerinnen und Neulenker, Fahrlehrer und den berufsmässigen Personentransport gilt Nulltoleranz (0,1 ‰).",
      "0,5 ‰ ; pour les conductrices et conducteurs novices, les moniteurs et le transport professionnel de personnes, tolérance zéro (0,1 ‰).",
      "0,5 ‰; per neopatentati, maestri conducenti e trasporto professionale di persone vige la tolleranza zero (0,1 ‰).",
      "0.5 ‰; zero tolerance (0.1 ‰) applies to novice drivers, driving instructors and professional passenger transport."
    ),
    equipment: l4(
      "Das Pannendreieck ist Pflicht und muss griffbereit im Fahrzeug liegen. Eine Warnweste ist nicht vorgeschrieben, aber sehr empfohlen – im Nachbarland brauchst du sie ohnehin.",
      "Le triangle de panne est obligatoire et doit rester à portée de main dans l'habitacle. Le gilet n'est pas prescrit, mais fortement conseillé – chez les voisins il est de toute façon obligatoire.",
      "Il triangolo è obbligatorio e deve stare a portata di mano nell'abitacolo. Il gilet non è prescritto, ma molto consigliato – nei paesi vicini serve comunque.",
      "A warning triangle is mandatory and must be within reach inside the vehicle. A hi-vis vest is not required but strongly recommended – you will need one across the border anyway."
    ),
    zones: l4(
      "Keine Umweltzonen. Genf kann bei starker Luftbelastung die Zone «Stick'AIR» aktivieren – dann fahren nur Fahrzeuge mit passender Farbvignette.",
      "Pas de zones environnementales. En cas de forte pollution, Genève peut activer la zone « Stick'AIR » – seuls les véhicules avec la vignette de couleur correspondante circulent alors.",
      "Nessuna zona ambientale. In caso di forte inquinamento Ginevra può attivare la zona «Stick'AIR» – circolano allora solo i veicoli con il bollino colorato giusto.",
      "No low emission zones. When air pollution is high, Geneva can activate its “Stick'AIR” zone – only vehicles with the matching colour sticker may then drive."
    ),
    emergency: "112",
    emergencyNote: l4(
      "112 europaweit, 117 Polizei, 118 Feuerwehr, 144 Sanität, 1414 Rega.",
      "112 partout en Europe, 117 police, 118 pompiers, 144 ambulance, 1414 Rega.",
      "112 in tutta Europa, 117 polizia, 118 pompieri, 144 ambulanza, 1414 Rega.",
      "112 across Europe, 117 police, 118 fire brigade, 144 ambulance, 1414 Rega."
    ),
    camping: l4(
      "Auf Rastplätzen darfst du zum Ausruhen im Fahrzeug schlafen; campieren mit Tisch, Stühlen und Markise ist nicht erlaubt. Freies Übernachten regeln Kantone und Gemeinden sehr unterschiedlich, in Naturschutz- und Wildruhezonen ist es verboten.",
      "Sur les aires de repos, tu peux dormir dans le véhicule pour récupérer ; camper avec table, chaises et auvent n'est pas permis. Le bivouac libre est réglé très différemment selon les cantons et les communes, et interdit dans les réserves naturelles et les zones de tranquillité pour la faune.",
      "Nelle aree di sosta puoi dormire in veicolo per riposare; campeggiare con tavolo, sedie e veranda non è permesso. Il pernottamento libero è regolato in modo molto diverso da cantoni e comuni ed è vietato nelle riserve naturali e nelle zone di tranquillità per la fauna.",
      "At rest areas you may sleep in your vehicle to recover; camping with table, chairs and awning is not allowed. Free overnight stays are regulated very differently by canton and municipality and are banned in nature reserves and wildlife sanctuaries."
    ),
    aliases: [
      "schweiz",
      "suisse",
      "svizzera",
      "switzerland",
      "helvetia",
      "wallis",
      "valais",
      "tessin",
      "ticino",
      "graubunden",
      "engadin",
      "berner oberland",
    ],
  },
  {
    code: "DE",
    flag: "🇩🇪",
    name: l4("Deutschland", "Allemagne", "Germania", "Germany"),
    updated: "2026-08-03",
    toll: l4(
      "Keine Vignette und keine Maut für Personenwagen und Wohnmobile. Die Lkw-Maut betrifft den Güterverkehr, nicht dein Gespann.",
      "Ni vignette ni péage pour les voitures et les camping-cars. Le péage poids lourds concerne le transport de marchandises, pas ton attelage.",
      "Nessuna vignetta e nessun pedaggio per automobili e camper. Il pedaggio per i camion riguarda il trasporto merci, non il tuo traino.",
      "No vignette and no toll for cars and motorhomes. The lorry toll applies to freight transport, not to your rig."
    ),
    trailer: l4(
      "Der Anhänger kostet nichts extra.",
      "La remorque ne coûte rien de plus.",
      "Il rimorchio non costa nulla in più.",
      "The trailer costs nothing extra."
    ),
    speed: { motorway: 80, rural: 80, urban: 50 },
    speedNote: l4(
      "Mit Anhänger 80 km/h auf Autobahn und Landstrasse. Mit der Tempo-100-Zulassung (Prüfung, Plakette am Anhänger) sind auf Autobahnen 100 km/h erlaubt – aber nur für in Deutschland zugelassene Gespanne.",
      "Avec remorque, 80 km/h sur autoroute et route de campagne. Avec l'homologation « Tempo 100 » (contrôle, plaque sur la remorque), 100 km/h sont permis sur autoroute – mais seulement pour les attelages immatriculés en Allemagne.",
      "Con rimorchio 80 km/h in autostrada e sulle strade extraurbane. Con l'omologazione «Tempo 100» (verifica, targhetta sul rimorchio) in autostrada sono permessi 100 km/h – ma solo per traini immatricolati in Germania.",
      "With a trailer 80 km/h on motorways and rural roads. With “Tempo 100” approval (inspection, plate on the trailer) 100 km/h is allowed on motorways – but only for rigs registered in Germany."
    ),
    bacPermille: 0.5,
    bacNote: l4(
      "0,5 ‰; in der Probezeit und unter 21 Jahren gilt 0,0 ‰.",
      "0,5 ‰ ; pendant la période probatoire et avant 21 ans, 0,0 ‰.",
      "0,5 ‰; durante il periodo di prova e sotto i 21 anni vale 0,0 ‰.",
      "0.5 ‰; during the probationary period and under the age of 21 the limit is 0.0 ‰."
    ),
    equipment: l4(
      "Warnweste, Pannendreieck und Verbandkasten sind Pflicht. Bei Panne oder Unfall ausserorts die Weste anziehen, bevor du aussteigst.",
      "Gilet, triangle et trousse de secours sont obligatoires. En cas de panne ou d'accident hors localité, enfile le gilet avant de sortir.",
      "Gilet, triangolo e kit di pronto soccorso sono obbligatori. In caso di guasto o incidente fuori dai centri abitati indossa il gilet prima di scendere.",
      "Hi-vis vest, warning triangle and first aid kit are mandatory. In a breakdown or accident outside built-up areas, put the vest on before you get out."
    ),
    zones: l4(
      "Viele Städte haben Umweltzonen: ohne grüne Feinstaubplakette an der Scheibe darfst du nicht hinein – die Plakette gibt es auch für ausländische Fahrzeuge. Einzelne Städte sperren zusätzlich alte Dieselfahrzeuge aus.",
      "Beaucoup de villes ont des zones environnementales : sans pastille verte sur le pare-brise, l'entrée est interdite – la pastille existe aussi pour les véhicules étrangers. Certaines villes excluent en plus les vieux diesels.",
      "Molte città hanno zone ambientali: senza il bollino verde sul parabrezza non si entra – il bollino esiste anche per i veicoli stranieri. Alcune città escludono inoltre i diesel vecchi.",
      "Many cities have low emission zones: without the green particulate sticker on the windscreen you may not enter – the sticker is available for foreign vehicles too. Some cities additionally ban older diesels."
    ),
    emergency: "112",
    emergencyNote: l4(
      "112 für Feuerwehr und Rettung, 110 für die Polizei.",
      "112 pour les pompiers et les secours, 110 pour la police.",
      "112 per pompieri e soccorso, 110 per la polizia.",
      "112 for fire and ambulance, 110 for the police."
    ),
    camping: l4(
      "Auf Rast- und Parkplätzen darfst du einmalig übernachten, um die Fahrtüchtigkeit wiederherzustellen – ohne Stühle, Markise und ausgefahrene Stützen. Wildcampen ist verboten, dafür gibt es fast überall Stellplätze.",
      "Sur les aires de repos et les parkings, tu peux passer une nuit pour récupérer ta capacité à conduire – sans chaises, auvent ni béquilles sorties. Le camping sauvage est interdit, mais les aires pour camping-cars sont partout.",
      "Nelle aree di sosta e nei parcheggi puoi pernottare una volta per recuperare l'idoneità alla guida – senza sedie, veranda e piedini estratti. Il campeggio libero è vietato, ma le aree camper sono quasi ovunque.",
      "At rest areas and car parks you may stay one night to restore your fitness to drive – without chairs, awning or extended supports. Wild camping is banned, but motorhome pitches are almost everywhere."
    ),
    aliases: [
      "deutschland",
      "allemagne",
      "germania",
      "germany",
      "bayern",
      "baviere",
      "schwarzwald",
      "bodensee",
      "allgau",
      "ostsee",
      "nordsee",
      "mosel",
    ],
  },
  {
    code: "AT",
    flag: "🇦🇹",
    name: l4("Österreich", "Autriche", "Austria", "Austria"),
    updated: "2026-08-03",
    toll: l4(
      "Vignette Pflicht auf Autobahnen und Schnellstrassen für Fahrzeuge bis 3,5 t – als Kleber oder digital fürs Kennzeichen (Tages-, 10-Tages-, 2-Monats- und Jahresvignette). Über 3,5 t, also auch für schwere Wohnmobile, gilt die fahrleistungsabhängige Maut mit der GO-Box. Brenner, Tauern-, Arlberg- und Karawankentunnel kosten zusätzlich Sondermaut.",
      "Vignette obligatoire sur autoroutes et voies rapides pour les véhicules jusqu'à 3,5 t – autocollant ou vignette numérique liée à la plaque (1 jour, 10 jours, 2 mois, 1 an). Au-delà de 3,5 t, donc aussi pour les camping-cars lourds, s'applique le péage au kilomètre avec la GO-Box. Le Brenner ainsi que les tunnels des Tauern, de l'Arlberg et des Karawanken exigent un péage spécial.",
      "Vignetta obbligatoria su autostrade e superstrade per i veicoli fino a 3,5 t – adesivo o vignetta digitale legata alla targa (1 giorno, 10 giorni, 2 mesi, 1 anno). Oltre 3,5 t, quindi anche per i camper pesanti, vale il pedaggio a chilometro con la GO-Box. Brennero e i trafori dei Tauri, dell'Arlberg e delle Caravanche costano un pedaggio speciale.",
      "Vignette required on motorways and expressways for vehicles up to 3.5 t – as a sticker or digitally tied to the number plate (1-day, 10-day, 2-month and annual). Above 3.5 t, which includes heavy motorhomes, distance-based tolling with the GO-Box applies. The Brenner as well as the Tauern, Arlberg and Karawanken tunnels charge a special toll."
    ),
    trailer: l4(
      "Der Anhänger braucht keine eigene Vignette – sie gilt fürs Zugfahrzeug.",
      "La remorque n'a pas besoin de sa propre vignette – elle vaut pour le véhicule tracteur.",
      "Il rimorchio non ha bisogno di una vignetta propria – vale quella del veicolo trainante.",
      "The trailer does not need its own vignette – it applies to the towing vehicle."
    ),
    speed: { motorway: 100, rural: 80, urban: 50 },
    speedNote: l4(
      "Bis 3,5 t Gesamtgewicht des Gespanns: 100 km/h auf der Autobahn, 80 km/h auf Freilandstrassen. Ist das Gespann schwerer, sind es 80 bzw. 70 km/h. In Tirol gelten auf Teilen der A12 zusätzliche Tempo- und Nachtfahrbeschränkungen.",
      "Jusqu'à 3,5 t de poids total de l'attelage : 100 km/h sur autoroute, 80 km/h hors localité. Si l'attelage est plus lourd, c'est 80 respectivement 70 km/h. Au Tyrol, des limitations de vitesse et de circulation nocturne s'ajoutent sur des tronçons de l'A12.",
      "Fino a 3,5 t di massa complessiva del traino: 100 km/h in autostrada, 80 km/h sulle strade extraurbane. Se il traino è più pesante, sono 80 rispettivamente 70 km/h. In Tirolo su tratti della A12 valgono limiti di velocità e divieti notturni aggiuntivi.",
      "Up to 3.5 t total rig weight: 100 km/h on motorways, 80 km/h on country roads. If the rig is heavier, it is 80 and 70 km/h respectively. In Tyrol additional speed and night driving restrictions apply on parts of the A12."
    ),
    bacPermille: 0.5,
    bacNote: l4(
      "0,5 ‰; mit Probeführerschein, für Mopedlenkende und beim Führerschein ab 17 gilt 0,1 ‰.",
      "0,5 ‰ ; avec un permis probatoire, pour les cyclomotoristes et le permis dès 17 ans, 0,1 ‰.",
      "0,5 ‰; con patente di prova, per i ciclomotoristi e con la patente dai 17 anni vale 0,1 ‰.",
      "0.5 ‰; with a probationary licence, for moped riders and the licence from 17 the limit is 0.1 ‰."
    ),
    equipment: l4(
      "Warnweste, Pannendreieck und Verbandszeug sind Pflicht; die Weste muss im Innenraum griffbereit liegen, nicht im Kofferraum.",
      "Gilet, triangle et trousse de secours sont obligatoires ; le gilet doit rester à portée de main dans l'habitacle, pas dans le coffre.",
      "Gilet, triangolo e kit di pronto soccorso sono obbligatori; il gilet deve stare a portata di mano nell'abitacolo, non nel bagagliaio.",
      "Hi-vis vest, warning triangle and first aid kit are mandatory; the vest must be within reach inside the car, not in the boot."
    ),
    zones: l4(
      "Umweltzonen (IG-L) betreffen vor allem Lastwagen. In Tirol gelten sektorale Fahrverbote und Abfahrverbote von der Autobahn, in Wien und Graz Fahrverbote für alte Lastwagen.",
      "Les zones environnementales (IG-L) concernent surtout les camions. Au Tyrol s'appliquent des interdictions sectorielles et des interdictions de sortie d'autoroute, à Vienne et Graz des interdictions pour les vieux camions.",
      "Le zone ambientali (IG-L) riguardano soprattutto i camion. In Tirolo valgono divieti settoriali e divieti di uscita dall'autostrada, a Vienna e Graz divieti per i camion vecchi.",
      "Low emission zones (IG-L) mainly affect lorries. Tyrol has sectoral driving bans and bans on leaving the motorway, Vienna and Graz ban older lorries."
    ),
    emergency: "112",
    emergencyNote: l4(
      "112 europaweit, 133 Polizei, 144 Rettung, 140 Bergrettung.",
      "112 partout en Europe, 133 police, 144 secours, 140 secours en montagne.",
      "112 in tutta Europa, 133 polizia, 144 soccorso, 140 soccorso alpino.",
      "112 across Europe, 133 police, 144 ambulance, 140 mountain rescue."
    ),
    camping: l4(
      "Im Fahrzeug schlafen, um auszuruhen, ist auf Rastplätzen meist geduldet – auspacken nicht. Campieren im Freien regeln die Bundesländer, in Tirol, Salzburg und Kärnten ist es weitgehend verboten.",
      "Dormir dans le véhicule pour se reposer est en général toléré sur les aires de repos – s'installer, non. Le camping en pleine nature relève des Länder ; au Tyrol, à Salzbourg et en Carinthie il est largement interdit.",
      "Dormire in veicolo per riposare è di solito tollerato nelle aree di sosta – sistemarsi fuori no. Il campeggio libero è regolato dai Länder; in Tirolo, a Salisburgo e in Carinzia è ampiamente vietato.",
      "Sleeping in the vehicle to rest is usually tolerated at rest areas – setting up camp is not. Camping in the open is regulated by the federal states; in Tyrol, Salzburg and Carinthia it is largely banned."
    ),
    aliases: [
      "osterreich",
      "autriche",
      "austria",
      "tirol",
      "tyrol",
      "salzburg",
      "karnten",
      "steiermark",
      "vorarlberg",
      "wachau",
    ],
  },
  {
    code: "IT",
    flag: "🇮🇹",
    name: l4("Italien", "Italie", "Italia", "Italy"),
    updated: "2026-08-03",
    toll: l4(
      "Keine Vignette, dafür Streckenmaut auf fast allen Autostrade: Ticket ziehen, bei der Ausfahrt mit Karte, bar oder Telepass zahlen. Die Alpentunnel Mont Blanc, Grosser St. Bernhard und Fréjus kosten separat.",
      "Pas de vignette, mais un péage au kilomètre sur presque toutes les autostrades : prends un ticket, paie à la sortie par carte, en espèces ou avec le Telepass. Les tunnels alpins du Mont-Blanc, du Grand-Saint-Bernard et du Fréjus sont facturés à part.",
      "Nessuna vignetta, ma pedaggio a tratta su quasi tutte le autostrade: ritira il biglietto e paga all'uscita con carta, contanti o Telepass. I trafori alpini del Monte Bianco, del Gran San Bernardo e del Fréjus si pagano a parte.",
      "No vignette, but distance-based tolls on almost all autostrade: take a ticket and pay at the exit by card, cash or Telepass. The Mont Blanc, Great St Bernard and Fréjus alpine tunnels are charged separately."
    ),
    trailer: l4(
      "Mit Anhänger rutscht das Gespann in eine höhere Mautklasse – die Fahrt kostet spürbar mehr als ohne.",
      "Avec une remorque, l'attelage passe dans une classe de péage supérieure – le trajet coûte nettement plus cher.",
      "Con il rimorchio il traino passa a una classe di pedaggio superiore – il viaggio costa sensibilmente di più.",
      "With a trailer the rig moves up a toll class – the journey costs noticeably more."
    ),
    speed: { motorway: 80, rural: 70, urban: 50 },
    speedNote: l4(
      "Mit Anhänger 80 km/h auf der Autobahn und 70 km/h ausserorts. Bei Regen gelten für alle tiefere Limits (Autobahn 110, Schnellstrasse 90 km/h).",
      "Avec remorque, 80 km/h sur autoroute et 70 km/h hors localité. Par temps de pluie, des limites plus basses valent pour tous (autoroute 110, voie rapide 90 km/h).",
      "Con rimorchio 80 km/h in autostrada e 70 km/h fuori dai centri abitati. Con la pioggia valgono per tutti limiti più bassi (autostrada 110, superstrada 90 km/h).",
      "With a trailer 80 km/h on motorways and 70 km/h outside built-up areas. In rain lower limits apply to everyone (motorway 110, expressway 90 km/h)."
    ),
    bacPermille: 0.5,
    bacNote: l4(
      "0,5 ‰; in den ersten drei Jahren nach dem Führerschein, unter 21 Jahren und im Berufsverkehr gilt 0,0 ‰.",
      "0,5 ‰ ; pendant les trois premières années de permis, avant 21 ans et pour les professionnels, 0,0 ‰.",
      "0,5 ‰; nei primi tre anni di patente, sotto i 21 anni e per i conducenti professionali vale 0,0 ‰.",
      "0.5 ‰; in the first three years after the licence, under 21 and for professional drivers the limit is 0.0 ‰."
    ),
    equipment: l4(
      "Warnweste und Pannendreieck sind Pflicht. Wer ausserorts aussteigt, muss die Weste tragen.",
      "Gilet et triangle sont obligatoires. Hors localité, tu dois porter le gilet pour sortir du véhicule.",
      "Gilet e triangolo sono obbligatori. Fuori dai centri abitati devi indossare il gilet per scendere.",
      "Hi-vis vest and warning triangle are mandatory. Outside built-up areas you must wear the vest when getting out."
    ),
    zones: l4(
      "In fast jeder Altstadt gibt es eine ZTL (Zona a traffico limitato): Kameras erfassen jede Einfahrt, die Bussen kommen Monate später per Post. In der Po-Ebene sperren Umweltzonen im Winter zusätzlich alte Dieselfahrzeuge aus.",
      "Presque chaque vieille ville a une ZTL (zone à trafic limité) : des caméras filment chaque entrée, les amendes arrivent des mois plus tard par la poste. Dans la plaine du Pô, des zones environnementales excluent en plus les vieux diesels en hiver.",
      "Quasi ogni centro storico ha una ZTL: le telecamere registrano ogni ingresso e le multe arrivano mesi dopo per posta. Nella Pianura Padana in inverno le zone ambientali escludono inoltre i diesel vecchi.",
      "Almost every old town has a ZTL (limited traffic zone): cameras record every entry and fines arrive by post months later. In the Po Valley low emission zones additionally ban older diesels in winter."
    ),
    emergency: "112",
    emergencyNote: l4(
      "112 für alles – Polizei, Feuerwehr und Rettung.",
      "112 pour tout – police, pompiers et secours.",
      "112 per tutto – polizia, pompieri e soccorso.",
      "112 for everything – police, fire brigade and ambulance."
    ),
    camping: l4(
      "Freistehen ist vielerorts verboten, an der Küste fast überall, und die Bussen sind hoch. Auf Autobahn-Raststätten kannst du zum Ausruhen bleiben; sicherer sind bewachte Stellplätze (aree di sosta).",
      "Le stationnement pour la nuit est interdit en de nombreux endroits, sur la côte presque partout, et les amendes sont élevées. Sur les aires d'autoroute tu peux t'arrêter pour te reposer ; les aires surveillées (aree di sosta) sont plus sûres.",
      "La sosta notturna libera è vietata in molti luoghi, sulla costa quasi ovunque, e le multe sono salate. Nelle aree di servizio autostradali puoi fermarti per riposare; più sicure sono le aree di sosta custodite.",
      "Free overnight parking is banned in many places, along the coast almost everywhere, and fines are steep. At motorway service areas you may stop to rest; guarded pitches (aree di sosta) are safer."
    ),
    aliases: [
      "italien",
      "italie",
      "italia",
      "italy",
      "toskana",
      "toscana",
      "gardasee",
      "lago di garda",
      "sardinien",
      "sardegna",
      "sizilien",
      "sicilia",
      "sudtirol",
      "alto adige",
      "ligurien",
      "liguria",
    ],
  },
  {
    code: "FR",
    flag: "🇫🇷",
    name: l4("Frankreich", "France", "Francia", "France"),
    updated: "2026-08-03",
    toll: l4(
      "Keine Vignette, dafür Péage auf den meisten Autobahnen: Ticket ziehen und bei der Ausfahrt zahlen. Für Umweltzonen brauchst du zusätzlich die Crit'Air-Plakette – auch mit ausländischem Kennzeichen, sie muss vorab online bestellt werden.",
      "Pas de vignette, mais le péage sur la plupart des autoroutes : prends un ticket et paie à la sortie. Pour les zones à faibles émissions il te faut en plus la vignette Crit'Air – aussi avec une plaque étrangère, à commander en ligne à l'avance.",
      "Nessuna vignetta, ma pedaggio sulla maggior parte delle autostrade: ritira il biglietto e paga all'uscita. Per le zone ambientali serve inoltre il bollino Crit'Air – anche con targa straniera, da ordinare online in anticipo.",
      "No vignette, but tolls (péage) on most motorways: take a ticket and pay at the exit. For low emission zones you also need the Crit'Air sticker – foreign plates included, and it must be ordered online in advance."
    ),
    trailer: l4(
      "Gespanne und hohe Wohnmobile zahlen die höhere Mautklasse (2 oder 3) – an der Schranke die passende Spur wählen.",
      "Les attelages et les camping-cars hauts paient la classe de péage supérieure (2 ou 3) – choisis la bonne voie à la barrière.",
      "Traini e camper alti pagano la classe di pedaggio superiore (2 o 3) – alla barriera scegli la corsia giusta.",
      "Rigs and tall motorhomes pay the higher toll class (2 or 3) – pick the right lane at the barrier."
    ),
    speed: { motorway: 130, rural: 80, urban: 50 },
    speedNote: l4(
      "Bis 3,5 t Gesamtgewicht fährst du wie ein Personenwagen: 130 km/h auf der Autobahn (110 bei Regen), 110 auf Schnellstrassen, 80 km/h auf Landstrassen – einzelne Départements erlauben dort 90. Schwerere Gespanne: 90 km/h auf der Autobahn, sonst 80.",
      "Jusqu'à 3,5 t de poids total, tu roules comme une voiture : 130 km/h sur autoroute (110 sous la pluie), 110 sur voie rapide, 80 km/h sur route – certains départements y autorisent 90. Attelages plus lourds : 90 km/h sur autoroute, 80 ailleurs.",
      "Fino a 3,5 t di massa complessiva viaggi come un'automobile: 130 km/h in autostrada (110 con la pioggia), 110 sulle superstrade, 80 km/h sulle strade extraurbane – alcuni dipartimenti vi ammettono 90. Traini più pesanti: 90 km/h in autostrada, 80 altrove.",
      "Up to 3.5 t total weight you drive like a car: 130 km/h on motorways (110 in rain), 110 on expressways, 80 km/h on country roads – some départements allow 90 there. Heavier rigs: 90 km/h on motorways, 80 elsewhere."
    ),
    bacPermille: 0.5,
    bacNote: l4(
      "0,5 ‰; in der Probezeit (die ersten zwei bis drei Jahre) gilt 0,2 ‰.",
      "0,5 ‰ ; pendant la période probatoire (les deux à trois premières années), 0,2 ‰.",
      "0,5 ‰; durante il periodo di prova (i primi due o tre anni) vale 0,2 ‰.",
      "0.5 ‰; during the probationary period (the first two to three years) the limit is 0.2 ‰."
    ),
    equipment: l4(
      "Warnweste im Innenraum und Pannendreieck sind Pflicht; die Weste musst du anziehen, bevor du aussteigst. Der Alkoholtester ist seit 2020 keine Pflicht mehr.",
      "Gilet dans l'habitacle et triangle sont obligatoires ; tu dois enfiler le gilet avant de sortir. L'éthylotest n'est plus obligatoire depuis 2020.",
      "Gilet nell'abitacolo e triangolo sono obbligatori; devi indossare il gilet prima di scendere. L'etilotest non è più obbligatorio dal 2020.",
      "A hi-vis vest inside the car and a warning triangle are mandatory; put the vest on before you get out. The breathalyser has not been compulsory since 2020."
    ),
    zones: l4(
      "Umweltzonen (ZFE) in Paris, Lyon, Grenoble, Strassburg, Marseille, Toulouse und weiteren Städten – Einfahrt nur mit passender Crit'Air-Plakette an der Scheibe.",
      "Zones à faibles émissions (ZFE) à Paris, Lyon, Grenoble, Strasbourg, Marseille, Toulouse et d'autres villes – entrée uniquement avec la vignette Crit'Air adéquate sur le pare-brise.",
      "Zone a basse emissioni (ZFE) a Parigi, Lione, Grenoble, Strasburgo, Marsiglia, Tolosa e altre città – si entra solo con il bollino Crit'Air giusto sul parabrezza.",
      "Low emission zones (ZFE) in Paris, Lyon, Grenoble, Strasbourg, Marseille, Toulouse and other cities – entry only with the matching Crit'Air sticker on the windscreen."
    ),
    emergency: "112",
    emergencyNote: l4(
      "112 europaweit, 15 Rettungsdienst, 17 Polizei, 18 Feuerwehr.",
      "112 partout en Europe, 15 SAMU, 17 police, 18 pompiers.",
      "112 in tutta Europa, 15 servizio sanitario, 17 polizia, 18 pompieri.",
      "112 across Europe, 15 ambulance service, 17 police, 18 fire brigade."
    ),
    camping: l4(
      "Im Fahrzeug auf öffentlichen Parkplätzen zu übernachten ist erlaubt, solange du nicht campierst; «camping sauvage» ist an Küsten, in Naturparks und am Strassenrand verboten. Auf Autobahn-Aires darfst du schlafen – lass nichts Sichtbares im Fahrzeug liegen.",
      "Dormir dans le véhicule sur un parking public est permis tant que tu ne campes pas ; le camping sauvage est interdit sur le littoral, dans les parcs naturels et au bord des routes. Sur les aires d'autoroute tu peux dormir – ne laisse rien de visible dans le véhicule.",
      "Dormire in veicolo nei parcheggi pubblici è permesso finché non campeggi; il campeggio libero è vietato sulla costa, nei parchi naturali e ai bordi delle strade. Nelle aree autostradali puoi dormire – non lasciare nulla in vista nel veicolo.",
      "Sleeping in your vehicle in public car parks is allowed as long as you do not camp; “camping sauvage” is banned on the coast, in nature parks and at the roadside. You may sleep at motorway aires – leave nothing visible in the vehicle."
    ),
    aliases: [
      "frankreich",
      "france",
      "francia",
      "bretagne",
      "provence",
      "ardeche",
      "korsika",
      "corse",
      "corsica",
      "cote d azur",
      "normandie",
      "elsass",
      "alsace",
      "savoyen",
      "savoie",
    ],
  },
  {
    code: "SI",
    flag: "🇸🇮",
    name: l4("Slowenien", "Slovénie", "Slovenia", "Slovenia"),
    updated: "2026-08-03",
    toll: l4(
      "E-Vignette Pflicht auf Autobahnen und Schnellstrassen für Fahrzeuge bis 3,5 t – kennzeichengebunden, online oder an der Tankstelle. Entscheidend ist die Höhe über der Vorderachse (über 1,3 m Kategorie 2A, darunter 2B). Über 3,5 t gilt die Streckenmaut DarsGo. Der Karawankentunnel kostet extra.",
      "Vignette électronique obligatoire sur autoroutes et voies rapides pour les véhicules jusqu'à 3,5 t – liée à la plaque, en ligne ou à la station-service. La hauteur au-dessus de l'essieu avant décide (plus de 1,3 m : catégorie 2A, sinon 2B). Au-delà de 3,5 t s'applique le péage DarsGo. Le tunnel des Karawanken est payant en plus.",
      "Vignetta elettronica obbligatoria su autostrade e superstrade per i veicoli fino a 3,5 t – legata alla targa, online o al distributore. Conta l'altezza sopra l'asse anteriore (oltre 1,3 m categoria 2A, sotto 2B). Oltre 3,5 t vale il pedaggio DarsGo. Il traforo delle Caravanche si paga a parte.",
      "E-vignette required on motorways and expressways for vehicles up to 3.5 t – tied to the number plate, online or at a petrol station. The height above the front axle decides (over 1.3 m category 2A, below 2B). Above 3.5 t the DarsGo toll applies. The Karawanken tunnel costs extra."
    ),
    trailer: l4(
      "Der Anhänger braucht keine eigene Vignette.",
      "La remorque n'a pas besoin de sa propre vignette.",
      "Il rimorchio non ha bisogno di una vignetta propria.",
      "The trailer does not need its own vignette."
    ),
    speed: { motorway: 80, rural: 80, urban: 50 },
    speedNote: l4(
      "Mit Anhänger 80 km/h ausserhalb geschlossener Ortschaften – auf der Autobahn wie auf der Landstrasse.",
      "Avec remorque, 80 km/h hors localité – sur autoroute comme sur route.",
      "Con rimorchio 80 km/h fuori dai centri abitati – in autostrada come sulle strade extraurbane.",
      "With a trailer 80 km/h outside built-up areas – on motorways as well as country roads."
    ),
    bacPermille: 0.5,
    bacNote: l4(
      "0,5 ‰; für Fahranfänger, unter 21-Jährige und Berufsfahrer gilt 0,0 ‰.",
      "0,5 ‰ ; pour les conducteurs novices, les moins de 21 ans et les professionnels, 0,0 ‰.",
      "0,5 ‰; per neopatentati, minori di 21 anni e conducenti professionali vale 0,0 ‰.",
      "0.5 ‰; for novice drivers, under-21s and professional drivers the limit is 0.0 ‰."
    ),
    equipment: l4(
      "Warnweste und Pannendreieck sind Pflicht – mit Anhänger zwei Dreiecke. Auch tagsüber musst du mit Abblendlicht fahren.",
      "Gilet et triangle sont obligatoires – deux triangles avec une remorque. Les feux de croisement sont obligatoires aussi de jour.",
      "Gilet e triangolo sono obbligatori – con rimorchio due triangoli. Gli anabbaglianti sono obbligatori anche di giorno.",
      "Hi-vis vest and warning triangle are mandatory – two triangles when towing. Dipped headlights are required during the day as well."
    ),
    zones: l4(
      "Keine landesweiten Umweltzonen; die Altstadt von Ljubljana ist weitgehend autofrei.",
      "Pas de zones environnementales nationales ; le centre historique de Ljubljana est largement sans voitures.",
      "Nessuna zona ambientale nazionale; il centro storico di Lubiana è in gran parte senza auto.",
      "No nationwide low emission zones; the old town of Ljubljana is largely car-free."
    ),
    emergency: "112",
    emergencyNote: l4(
      "112 für Rettung und Feuerwehr, 113 für die Polizei.",
      "112 pour les secours et les pompiers, 113 pour la police.",
      "112 per soccorso e pompieri, 113 per la polizia.",
      "112 for ambulance and fire, 113 for the police."
    ),
    camping: l4(
      "Wildcampen und Übernachten im Fahrzeug ausserhalb von Campingplätzen sind verboten und werden gebüsst; Rastplätze dienen nur der Pause.",
      "Le camping sauvage et la nuit passée dans le véhicule hors des campings sont interdits et sanctionnés ; les aires de repos servent uniquement à la pause.",
      "Il campeggio libero e il pernottamento in veicolo fuori dai campeggi sono vietati e multati; le aree di sosta servono solo per la pausa.",
      "Wild camping and sleeping in your vehicle outside campsites are banned and fined; rest areas are for breaks only."
    ),
    aliases: [
      "slowenien",
      "slovenie",
      "slovenia",
      "slovenija",
      "bled",
      "julische alpen",
      "piran",
    ],
  },
  {
    code: "NL",
    flag: "🇳🇱",
    name: l4("Niederlande", "Pays-Bas", "Paesi Bassi", "Netherlands"),
    updated: "2026-08-03",
    toll: l4(
      "Keine Vignette und keine Autobahnmaut. Nur der Westerscheldetunnel und der Kiltunnel kosten Gebühr.",
      "Ni vignette ni péage autoroutier. Seuls le tunnel de l'Escaut occidental et le Kiltunnel sont payants.",
      "Nessuna vignetta e nessun pedaggio autostradale. Solo il tunnel della Schelda occidentale e il Kiltunnel si pagano.",
      "No vignette and no motorway toll. Only the Westerschelde tunnel and the Kil tunnel charge a fee."
    ),
    trailer: l4(
      "Für den Anhänger fällt nichts an; in den beiden Tunneln zahlst du nach Länge des Gespanns.",
      "Rien à payer pour la remorque ; dans les deux tunnels, le tarif dépend de la longueur de l'attelage.",
      "Per il rimorchio non si paga nulla; nei due trafori la tariffa dipende dalla lunghezza del traino.",
      "Nothing to pay for the trailer; in the two tunnels the fee depends on the length of your rig."
    ),
    speed: { motorway: 90, rural: 80, urban: 50 },
    speedNote: l4(
      "Mit Anhänger gilt auf Autobahnen 90 km/h – auch dort, wo Personenwagen tagsüber 100 und nachts mehr fahren dürfen. Ausserorts 80 km/h.",
      "Avec remorque, 90 km/h sur autoroute – même là où les voitures peuvent rouler à 100 le jour et plus la nuit. Hors localité, 80 km/h.",
      "Con rimorchio in autostrada valgono 90 km/h – anche dove le automobili possono viaggiare a 100 di giorno e di più di notte. Fuori dai centri abitati 80 km/h.",
      "With a trailer the motorway limit is 90 km/h – even where cars may drive 100 by day and more at night. Outside built-up areas 80 km/h."
    ),
    bacPermille: 0.5,
    bacNote: l4(
      "0,5 ‰; in den ersten fünf Jahren nach dem Führerschein gilt 0,2 ‰.",
      "0,5 ‰ ; pendant les cinq premières années de permis, 0,2 ‰.",
      "0,5 ‰; nei primi cinque anni di patente vale 0,2 ‰.",
      "0.5 ‰; in the first five years after the licence the limit is 0.2 ‰."
    ),
    equipment: l4(
      "Das Pannendreieck ist vorgeschrieben, die Warnweste nicht – nimm sie trotzdem mit, in den Nachbarländern ist sie Pflicht.",
      "Le triangle est prescrit, le gilet non – emporte-le quand même, il est obligatoire chez les voisins.",
      "Il triangolo è prescritto, il gilet no – portalo comunque, nei paesi vicini è obbligatorio.",
      "The warning triangle is required, the hi-vis vest is not – take one anyway, it is mandatory in the neighbouring countries."
    ),
    zones: l4(
      "Umweltzonen (milieuzones) in vielen Städten, überwacht per Kennzeichen-Kamera; sie treffen vor allem alte Diesel- und Lieferfahrzeuge. In den Innenstädten kommen emissionsfreie Lieferzonen dazu.",
      "Zones environnementales (milieuzones) dans de nombreuses villes, contrôlées par caméras de plaques ; elles visent surtout les vieux diesels et les utilitaires. Dans les centres s'ajoutent des zones de livraison zéro émission.",
      "Zone ambientali (milieuzones) in molte città, controllate con telecamere sulle targhe; colpiscono soprattutto diesel vecchi e furgoni. Nei centri si aggiungono zone di consegna a zero emissioni.",
      "Low emission zones (milieuzones) in many cities, monitored by number plate cameras; they mainly affect older diesels and vans. City centres are adding zero-emission delivery zones."
    ),
    emergency: "112",
    emergencyNote: l4(
      "112 für Polizei, Feuerwehr und Rettung.",
      "112 pour la police, les pompiers et les secours.",
      "112 per polizia, pompieri e soccorso.",
      "112 for police, fire brigade and ambulance."
    ),
    camping: l4(
      "Freistehen ist fast überall untersagt, viele Rastplätze verbieten das Übernachten ausdrücklich. Dafür gibt es ein dichtes Netz an Camperplaatsen.",
      "Le stationnement pour la nuit est interdit presque partout, beaucoup d'aires de repos l'excluent explicitement. En revanche, le réseau de camperplaatsen est dense.",
      "La sosta notturna libera è vietata quasi ovunque, molte aree di sosta la escludono esplicitamente. In compenso la rete di camperplaatsen è fitta.",
      "Free overnight parking is banned almost everywhere and many rest areas explicitly forbid it. In return there is a dense network of camperplaatsen."
    ),
    aliases: [
      "niederlande",
      "holland",
      "pays bas",
      "paesi bassi",
      "netherlands",
      "nederland",
      "zeeland",
      "friesland",
    ],
  },
  {
    code: "HR",
    flag: "🇭🇷",
    name: l4("Kroatien", "Croatie", "Croazia", "Croatia"),
    updated: "2026-08-03",
    toll: l4(
      "Keine Vignette, dafür Streckenmaut auf den Autobahnen: Ticket ziehen, bei der Ausfahrt zahlen. Brücken und Tunnel wie der Ucka-Tunnel kosten separat.",
      "Pas de vignette, mais un péage au kilomètre sur les autoroutes : prends un ticket, paie à la sortie. Ponts et tunnels comme celui de l'Učka sont facturés à part.",
      "Nessuna vignetta, ma pedaggio a tratta sulle autostrade: ritira il biglietto e paga all'uscita. Ponti e trafori come quello dell'Učka si pagano a parte.",
      "No vignette, but distance-based tolls on the motorways: take a ticket and pay at the exit. Bridges and tunnels such as the Učka tunnel are charged separately."
    ),
    trailer: l4(
      "Mit Anhänger zahlst du die höhere Mautklasse.",
      "Avec une remorque, tu paies la classe de péage supérieure.",
      "Con il rimorchio paghi la classe di pedaggio superiore.",
      "With a trailer you pay the higher toll class."
    ),
    speed: { motorway: 90, rural: 80, urban: 50 },
    speedNote: l4(
      "Mit Anhänger 90 km/h auf der Autobahn und 80 km/h ausserorts; Fahrzeuge über 3,5 t fahren höchstens 80.",
      "Avec remorque, 90 km/h sur autoroute et 80 km/h hors localité ; les véhicules de plus de 3,5 t roulent au maximum à 80.",
      "Con rimorchio 90 km/h in autostrada e 80 km/h fuori dai centri abitati; i veicoli oltre 3,5 t viaggiano al massimo a 80.",
      "With a trailer 90 km/h on motorways and 80 km/h outside built-up areas; vehicles over 3.5 t may do no more than 80."
    ),
    bacPermille: 0.5,
    bacNote: l4(
      "0,5 ‰; unter 25 Jahren, für Fahranfänger und Berufsfahrer gilt 0,0 ‰.",
      "0,5 ‰ ; avant 25 ans, pour les conducteurs novices et les professionnels, 0,0 ‰.",
      "0,5 ‰; sotto i 25 anni, per neopatentati e conducenti professionali vale 0,0 ‰.",
      "0.5 ‰; under 25, for novice drivers and professional drivers the limit is 0.0 ‰."
    ),
    equipment: l4(
      "Warnweste, Pannendreieck (mit Anhänger zwei), Verbandkasten und Ersatzlampen sind Pflicht. Vom letzten Oktober- bis zum letzten März-Sonntag musst du auch tagsüber mit Licht fahren.",
      "Gilet, triangle (deux avec une remorque), trousse de secours et ampoules de rechange sont obligatoires. Du dernier dimanche d'octobre au dernier dimanche de mars, les feux sont obligatoires aussi de jour.",
      "Gilet, triangolo (due con rimorchio), kit di pronto soccorso e lampadine di ricambio sono obbligatori. Dall'ultima domenica di ottobre all'ultima di marzo le luci sono obbligatorie anche di giorno.",
      "Hi-vis vest, warning triangle (two when towing), first aid kit and spare bulbs are mandatory. From the last Sunday in October to the last Sunday in March you must drive with lights on during the day too."
    ),
    zones: l4(
      "Keine Umweltzonen.",
      "Pas de zones environnementales.",
      "Nessuna zona ambientale.",
      "No low emission zones."
    ),
    emergency: "112",
    emergencyNote: l4(
      "112 für alles; 1987 ist der Pannendienst des Autoclubs HAK.",
      "112 pour tout ; 1987 est le service de dépannage de l'automobile-club HAK.",
      "112 per tutto; 1987 è il servizio di soccorso stradale dell'automobile club HAK.",
      "112 for everything; 1987 is the breakdown service of the HAK automobile club."
    ),
    camping: l4(
      "Übernachten ausserhalb von Campingplätzen ist streng verboten – auch im Wohnmobil auf einem Parkplatz. Die Bussen sind empfindlich, kontrolliert wird an der Küste regelmässig.",
      "Passer la nuit hors des campings est strictement interdit – même en camping-car sur un parking. Les amendes sont salées et les contrôles fréquents sur la côte.",
      "Pernottare fuori dai campeggi è severamente vietato – anche in camper in un parcheggio. Le multe sono salate e sulla costa i controlli sono frequenti.",
      "Staying overnight outside campsites is strictly forbidden – including in a motorhome in a car park. Fines are steep and checks along the coast are frequent."
    ),
    aliases: [
      "kroatien",
      "croatie",
      "croazia",
      "croatia",
      "hrvatska",
      "istrien",
      "istria",
      "dalmatien",
      "dalmacija",
      "insel krk",
    ],
  },
  {
    code: "ES",
    flag: "🇪🇸",
    name: l4("Spanien", "Espagne", "Spagna", "Spain"),
    updated: "2026-08-03",
    toll: l4(
      "Keine Vignette. Ein Teil der Autobahnen (AP) ist mautpflichtig; viele Strecken wurden 2021 gebührenfrei, im Norden und in Tunneln zahlst du weiterhin.",
      "Pas de vignette. Une partie des autoroutes (AP) est payante ; beaucoup de tronçons sont devenus gratuits en 2021, mais dans le nord et dans les tunnels tu paies toujours.",
      "Nessuna vignetta. Una parte delle autostrade (AP) è a pedaggio; molti tratti sono diventati gratuiti nel 2021, al nord e nei trafori si paga ancora.",
      "No vignette. Part of the motorway network (AP) is tolled; many stretches became free in 2021, but in the north and in tunnels you still pay."
    ),
    trailer: l4(
      "An den Mautstellen zahlst du mit Anhänger die höhere Klasse.",
      "Aux péages, tu paies la classe supérieure avec une remorque.",
      "Ai caselli con il rimorchio paghi la classe superiore.",
      "At toll booths you pay the higher class when towing."
    ),
    speed: { motorway: 80, rural: 70, urban: 50 },
    speedNote: l4(
      "Mit Anhänger 80 km/h auf Autobahn und Autovía, 70 km/h auf Landstrassen. Innerorts gilt auf Strassen mit nur einer Spur je Richtung Tempo 30.",
      "Avec remorque, 80 km/h sur autoroute et autovía, 70 km/h sur route. En localité, 30 km/h sur les rues à une seule voie par sens.",
      "Con rimorchio 80 km/h su autostrada e autovía, 70 km/h sulle strade extraurbane. Nei centri abitati vale 30 km/h sulle strade con una sola corsia per senso.",
      "With a trailer 80 km/h on motorways and autovías, 70 km/h on country roads. In towns the limit is 30 km/h on streets with a single lane per direction."
    ),
    bacPermille: 0.5,
    bacNote: l4(
      "0,5 ‰ (0,25 mg/l in der Atemluft); in den ersten zwei Jahren und für Berufsfahrer gilt 0,3 ‰.",
      "0,5 ‰ (0,25 mg/l dans l'air expiré) ; pendant les deux premières années et pour les professionnels, 0,3 ‰.",
      "0,5 ‰ (0,25 mg/l nell'aria espirata); nei primi due anni e per i conducenti professionali vale 0,3 ‰.",
      "0.5 ‰ (0.25 mg/l in breath); in the first two years and for professional drivers the limit is 0.3 ‰."
    ),
    equipment: l4(
      "Warnwesten sind Pflicht und müssen beim Aussteigen getragen werden. Seit dem 1. Januar 2026 ersetzt in Spanien die vernetzte V-16-Warnleuchte das Pannendreieck; mit ausländischem Kennzeichen darfst du weiterhin das Dreieck stellen – auf der Autobahn ist die Leuchte deutlich sicherer.",
      "Les gilets sont obligatoires et doivent être portés pour sortir du véhicule. Depuis le 1er janvier 2026, la balise connectée V-16 remplace le triangle en Espagne ; avec une plaque étrangère tu peux encore poser le triangle – sur autoroute, la balise est nettement plus sûre.",
      "I gilet sono obbligatori e vanno indossati per scendere. Dal 1° gennaio 2026 in Spagna la luce di emergenza connessa V-16 sostituisce il triangolo; con targa straniera puoi ancora usare il triangolo – in autostrada la luce è molto più sicura.",
      "Hi-vis vests are mandatory and must be worn when getting out. Since 1 January 2026 the connected V-16 beacon replaces the warning triangle in Spain; with foreign plates you may still put out the triangle – on the motorway the beacon is far safer."
    ),
    zones: l4(
      "Städte ab 50 000 Einwohnern richten Umweltzonen (ZBE) ein, etwa Madrid und Barcelona. Ausländische Fahrzeuge müssen sich teilweise vorab registrieren.",
      "Les villes de plus de 50 000 habitants mettent en place des zones à faibles émissions (ZBE), par exemple Madrid et Barcelone. Les véhicules étrangers doivent parfois s'enregistrer à l'avance.",
      "Le città con più di 50 000 abitanti istituiscono zone a basse emissioni (ZBE), per esempio Madrid e Barcellona. I veicoli stranieri devono a volte registrarsi in anticipo.",
      "Cities with more than 50,000 inhabitants are setting up low emission zones (ZBE), for example Madrid and Barcelona. Foreign vehicles sometimes have to register in advance."
    ),
    emergency: "112",
    emergencyNote: l4(
      "112 für Polizei, Feuerwehr und Rettung.",
      "112 pour la police, les pompiers et les secours.",
      "112 per polizia, pompieri e soccorso.",
      "112 for police, fire brigade and ambulance."
    ),
    camping: l4(
      "«Pernoctar» – schlafen im geschlossenen Fahrzeug – ist meist erlaubt, «acampar» mit Stützen, Markise und Stühlen nicht. Auf den Balearen, in Katalonien und in Naturschutzgebieten gelten strengere Regeln.",
      "« Pernoctar » – dormir dans un véhicule fermé – est en général permis, « acampar » avec béquilles, auvent et chaises non. Aux Baléares, en Catalogne et dans les espaces protégés, les règles sont plus strictes.",
      "«Pernoctar» – dormire nel veicolo chiuso – è di solito permesso, «acampar» con piedini, veranda e sedie no. Alle Baleari, in Catalogna e nelle aree protette le regole sono più severe.",
      "“Pernoctar” – sleeping inside a closed vehicle – is usually allowed, “acampar” with supports, awning and chairs is not. The Balearics, Catalonia and protected areas have stricter rules."
    ),
    aliases: [
      "spanien",
      "espagne",
      "spagna",
      "spain",
      "espana",
      "katalonien",
      "catalunya",
      "andalusien",
      "andalucia",
      "mallorca",
      "costa brava",
      "costa blanca",
    ],
  },
];

/** Land zu einem Code – oder null, wenn der Code unbekannt ist. */
export function findCountryRules(code: string | null): CountryRules | null {
  if (!code) return null;
  const wanted = code.trim().toUpperCase();
  return roadRules.find(c => c.code === wanted) ?? null;
}

/**
 * Text auf Suchform bringen: Umlaute falten, alles ausser Buchstaben und
 * Ziffern zu Leerzeichen, und in Leerzeichen einfassen. So trifft «italien»
 * in «Toskana, Italien» und nicht mitten in einem längeren Wort.
 */
function searchable(text: string): string {
  return ` ${normalizeText(text)
    .replace(/[^a-z0-9]+/g, " ")
    .trim()} `;
}

/**
 * Zielland aus einem Ortsnamen raten (Reise-Titel, Ort, Zeltplatz-Name).
 * Bewusst nur über Namen: Aus reinen Koordinaten liesse sich das Land ohne
 * Grenzdaten nicht verlässlich bestimmen – im Alpenraum liegen die Länder zu
 * dicht beieinander. Kein Treffer heisst null; dann wählt man von Hand.
 */
export function guessCountryCode(
  text: string | null | undefined
): string | null {
  if (!text) return null;
  const haystack = searchable(text);
  if (haystack.trim().length === 0) return null;
  for (const country of roadRules) {
    for (const alias of country.aliases) {
      if (haystack.includes(searchable(alias))) return country.code;
    }
  }
  return null;
}
