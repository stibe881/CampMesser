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
  /** Steckdosen-Typ und was der Schweizer Stecker braucht (#522). */
  plug: L4;
  /** Trinkgeld-Gepflogenheiten, aus Schweizer Sicht (#523). */
  tipping: L4;
  /** Bargeld oder Karte? Was auf Reisen wirklich angenommen wird (#550). */
  payment: L4;
  /** Motorrad & Velo (#581): Maut, Helm- und Sonderregeln für Zweiräder. */
  twoWheels: L4;
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
    plug: l4(
      "Typ J (dreipolig). Der Eurostecker passt; deutsche Schuko-Stecker (Typ F) passen NICHT ohne Adapter.",
      "Type J (trois broches). L’europlug passe ; les fiches Schuko allemandes (type F) ne passent PAS sans adaptateur.",
      "Tipo J (tre poli). L’europlug passa; le spine Schuko tedesche (tipo F) NON passano senza adattatore.",
      "Type J (three-pin). Europlugs fit; German Schuko plugs (type F) do NOT fit without an adapter."
    ),
    tipping: l4(
      "Bedienung ist inbegriffen. Aufrunden ist üblich und reicht – Trinkgeld ist Anerkennung, keine Pflicht.",
      "Le service est compris. Arrondir est courant et suffit – le pourboire est une reconnaissance, pas une obligation.",
      "Il servizio è incluso. Arrotondare è consueto e basta – la mancia è un riconoscimento, non un obbligo.",
      "Service is included. Rounding up is common and enough – a tip is appreciation, not an obligation."
    ),
    payment: l4(
      "Kartenzahlung fast überall, auch kontaktlos und mit Handy – Bargeld braucht es höchstens am Hofladen oder auf sehr kleinen Plätzen.",
      "Paiement par carte presque partout, aussi sans contact et par téléphone – l'argent liquide ne sert guère qu'au magasin de ferme ou sur de très petits campings.",
      "Pagamento con carta quasi ovunque, anche contactless e con il telefono – il contante serve al massimo al negozio della fattoria o in campeggi molto piccoli.",
      "Card payment almost everywhere, including contactless and by phone – cash is only needed at farm shops or very small campsites."
    ),
    twoWheels: l4(
      "Das Motorrad braucht eine EIGENE Vignette; Velos fahren vignettefrei. Helmpflicht auf dem Motorrad; auf dem Velo nur für schnelle E-Bikes.",
      "La moto a besoin de sa PROPRE vignette ; les vélos circulent sans. Casque obligatoire à moto ; à vélo seulement pour les e-bikes rapides.",
      "La moto ha bisogno di una PROPRIA vignetta; le bici circolano senza. Casco obbligatorio in moto; in bici solo per le e-bike veloci.",
      "Motorbikes need their OWN vignette; bicycles ride vignette-free. Helmet mandatory on the motorbike; on bicycles only for fast e-bikes."
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
    plug: l4(
      "Typ F (Schuko) und Typ C. Der Schweizer Dreipol-Stecker braucht einen Adapter; zweipolige Gerätestecker passen als Eurostecker.",
      "Type F (Schuko) et type C. La fiche suisse à trois broches nécessite un adaptateur ; les fiches plates à deux broches passent comme europlug.",
      "Tipo F (Schuko) e tipo C. La spina svizzera a tre poli richiede un adattatore; le spine a due poli passano come europlug.",
      "Type F (Schuko) and type C. The Swiss three-pin plug needs an adapter; two-pin europlugs fit."
    ),
    tipping: l4(
      "5–10 % sind üblich; beim Bezahlen den Gesamtbetrag nennen («Machen Sie 27»).",
      "5–10 % sont d’usage ; au moment de payer, annonce le montant total (« faites 27 »).",
      "Il 5–10 % è consueto; al momento di pagare indica l’importo totale («faccia 27»).",
      "5–10% is customary; when paying, state the total (“make it 27”)."
    ),
    payment: l4(
      "Deutlich mehr Bargeld als daheim: Kleinere Restaurants, Bäckereien, Kiosks und manche Campingplätze nehmen NUR Bargeld – immer etwas Euro dabeihaben. Girocard ist verbreiteter als Kreditkarte.",
      "Nettement plus d'argent liquide que chez nous : petits restaurants, boulangeries, kiosques et certains campings n'acceptent QUE le liquide – garde toujours quelques euros. La Girocard est plus répandue que la carte de crédit.",
      "Molto più contante che da noi: piccoli ristoranti, panetterie, chioschi e alcuni campeggi accettano SOLO contanti – tieni sempre qualche euro. La Girocard è più diffusa della carta di credito.",
      "Noticeably more cash than at home: smaller restaurants, bakeries, kiosks and some campsites take CASH ONLY – always carry some euros. Girocard is more common than credit cards."
    ),
    twoWheels: l4(
      "Keine Maut für Motorräder. Helmpflicht auf dem Motorrad; fürs Velo gibt es keine Helmpflicht.",
      "Pas de péage pour les motos. Casque obligatoire à moto ; pas d'obligation à vélo.",
      "Nessun pedaggio per le moto. Casco obbligatorio in moto; nessun obbligo in bici.",
      "No toll for motorbikes. Helmet mandatory on the motorbike; no helmet requirement for bicycles."
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
    plug: l4(
      "Typ F (Schuko) und Typ C. Der Schweizer Dreipol-Stecker braucht einen Adapter; zweipolige Gerätestecker passen als Eurostecker.",
      "Type F (Schuko) et type C. La fiche suisse à trois broches nécessite un adaptateur ; les fiches plates à deux broches passent comme europlug.",
      "Tipo F (Schuko) e tipo C. La spina svizzera a tre poli richiede un adattatore; le spine a due poli passano come europlug.",
      "Type F (Schuko) and type C. The Swiss three-pin plug needs an adapter; two-pin europlugs fit."
    ),
    tipping: l4(
      "5–10 % üblich, beim Zahlen dazusagen. In Hütten und Cafés genügt Aufrunden.",
      "5–10 % d’usage, à annoncer en payant. Dans les refuges et cafés, arrondir suffit.",
      "5–10 % consueto, da dire pagando. In rifugi e caffè basta arrotondare.",
      "5–10% customary, said when paying. In huts and cafés rounding up is fine."
    ),
    payment: l4(
      "Karten sind verbreitet, aber Bargeld bleibt beliebt – Berghütten, kleine Beizen und Parkautomaten wollen oft Münz. Ein Euro-Notgroschen gehört ins Handschuhfach.",
      "Les cartes sont répandues, mais le liquide reste apprécié – refuges, petites auberges et horodateurs veulent souvent des pièces. Garde une réserve d'euros dans la boîte à gants.",
      "Le carte sono diffuse, ma il contante resta amato – rifugi, piccole osterie e parchimetri vogliono spesso monete. Tieni una riserva di euro nel cassetto.",
      "Cards are widespread, but cash stays popular – mountain huts, small inns and parking meters often want coins. Keep a euro reserve in the glovebox."
    ),
    twoWheels: l4(
      "Das Motorrad braucht eine eigene, günstigere Vignette. Helmpflicht auf dem Motorrad; Velohelm-Pflicht für Kinder unter 12.",
      "La moto a besoin de sa propre vignette, moins chère. Casque obligatoire à moto ; casque vélo obligatoire pour les moins de 12 ans.",
      "La moto ha bisogno di una propria vignetta, più economica. Casco obbligatorio in moto; casco in bici obbligatorio sotto i 12 anni.",
      "Motorbikes need their own, cheaper vignette. Helmet mandatory on the motorbike; bicycle helmet mandatory under 12."
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
    plug: l4(
      "Typ L (drei Stifte in Reihe), oft auch Typ F. Eurostecker passt; der Schweizer Dreipol-Stecker braucht einen Adapter.",
      "Type L (trois broches alignées), souvent aussi type F. L’europlug passe ; la fiche suisse à trois broches nécessite un adaptateur.",
      "Tipo L (tre poli in linea), spesso anche tipo F. L’europlug passa; la spina svizzera a tre poli richiede un adattatore.",
      "Type L (three pins in a row), often type F too. Europlugs fit; the Swiss three-pin plug needs an adapter."
    ),
    tipping: l4(
      "Kein Muss: Oft steht «coperto» (Gedeck) auf der Rechnung. Aufrunden oder ein paar Euro für guten Service.",
      "Pas obligatoire : la note comporte souvent un « coperto » (couvert). Arrondir ou laisser quelques euros pour un bon service.",
      "Non obbligatoria: spesso in conto c’è il «coperto». Arrotonda o lascia qualche euro per un buon servizio.",
      "Not a must: the bill often includes a “coperto” (cover charge). Round up or leave a few euros for good service."
    ),
    payment: l4(
      "Kartenzahlung ist seit ein paar Jahren Pflicht für Händler und klappt meist – an Strandbars, Märkten und auf kleinen Plätzen ist Bargeld trotzdem schneller. Autobahn-Maut geht mit Karte.",
      "Le paiement par carte est obligatoire pour les commerçants depuis quelques années et fonctionne le plus souvent – aux bars de plage, marchés et petits campings, le liquide reste plus rapide. Le péage d'autoroute se paie par carte.",
      "Il pagamento con carta è obbligatorio per gli esercenti da qualche anno e di solito funziona – nei bar in spiaggia, ai mercati e nei piccoli campeggi il contante resta più veloce. Il pedaggio autostradale si paga con carta.",
      "Card payment has been mandatory for merchants for a few years and usually works – at beach bars, markets and small campsites cash is still quicker. Motorway tolls take cards."
    ),
    twoWheels: l4(
      "Motorräder zahlen Autobahnmaut, auf die Autobahn dürfen sie erst ab 150 ccm. Helmpflicht auch für Roller und Töffli.",
      "Les motos paient le péage et n'accèdent à l'autoroute qu'à partir de 150 cm³. Casque obligatoire aussi pour les scooters.",
      "Le moto pagano il pedaggio e possono entrare in autostrada solo da 150 cc. Casco obbligatorio anche per gli scooter.",
      "Motorbikes pay the motorway toll and may only enter from 150 cc. Helmets are mandatory for scooters and mopeds too."
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
    plug: l4(
      "Typ E (Buchse mit Erdungsstift). Eurostecker passt; der Schweizer Dreipol-Stecker braucht einen Adapter.",
      "Type E (prise avec broche de terre). L’europlug passe ; la fiche suisse à trois broches nécessite un adaptateur.",
      "Tipo E (presa con spinotto di terra). L’europlug passa; la spina svizzera a tre poli richiede un adattatore.",
      "Type E (socket with earth pin). Europlugs fit; the Swiss three-pin plug needs an adapter."
    ),
    tipping: l4(
      "«Service compris» – Bedienung ist inbegriffen. Kleingeld dazulassen ist eine nette Geste, mehr nicht.",
      "« Service compris ». Laisser la petite monnaie est un geste apprécié, sans plus.",
      "«Service compris» – il servizio è incluso. Lasciare gli spiccioli è un gesto gentile, niente di più.",
      "“Service compris” – service is included. Leaving small change is a nice gesture, nothing more."
    ),
    payment: l4(
      "Karte geht fast überall, oft schon ab kleinen Beträgen – nur Wochenmärkte und manche Boulangerien wollen Bargeld. Mautstellen nehmen Karten (nicht immer ausländische Debitkarten – eine Kreditkarte mitführen).",
      "La carte passe presque partout, souvent dès de petits montants – seuls les marchés et certaines boulangeries veulent du liquide. Les péages acceptent les cartes (pas toujours les cartes de débit étrangères – emporte une carte de crédit).",
      "La carta va quasi ovunque, spesso già per piccoli importi – solo i mercati e alcune boulangerie vogliono contanti. I caselli accettano carte (non sempre le carte di debito estere – porta una carta di credito).",
      "Cards work almost everywhere, often even for small amounts – only weekly markets and some bakeries want cash. Toll booths take cards (not always foreign debit cards – carry a credit card)."
    ),
    twoWheels: l4(
      "Motorräder zahlen ermässigte Maut (Classe 5). Auf dem Motorrad sind Helm UND zertifizierte Handschuhe Pflicht; Velohelm für Kinder unter 12.",
      "Les motos paient un péage réduit (classe 5). À moto, casque ET gants certifiés obligatoires ; casque vélo pour les moins de 12 ans.",
      "Le moto pagano un pedaggio ridotto (classe 5). In moto casco E guanti certificati obbligatori; casco in bici sotto i 12 anni.",
      "Motorbikes pay a reduced toll (class 5). On the motorbike helmet AND certified gloves are mandatory; bicycle helmet under 12."
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
    plug: l4(
      "Typ F (Schuko) und Typ C. Der Schweizer Dreipol-Stecker braucht einen Adapter; zweipolige Gerätestecker passen als Eurostecker.",
      "Type F (Schuko) et type C. La fiche suisse à trois broches nécessite un adaptateur ; les fiches plates à deux broches passent comme europlug.",
      "Tipo F (Schuko) e tipo C. La spina svizzera a tre poli richiede un adattatore; le spine a due poli passano come europlug.",
      "Type F (Schuko) and type C. The Swiss three-pin plug needs an adapter; two-pin europlugs fit."
    ),
    tipping: l4(
      "Aufrunden ist üblich; im Restaurant sind bis 10 % gern gesehen, aber keine Pflicht.",
      "Arrondir est courant ; au restaurant, jusqu’à 10 % sont appréciés, sans obligation.",
      "Arrotondare è consueto; al ristorante fino al 10 % è gradito, ma non obbligatorio.",
      "Rounding up is common; in restaurants up to 10% is appreciated but not required."
    ),
    payment: l4(
      "Karten sind in Städten und auf grösseren Plätzen normal, auf Bauernhöfen, Hütten und an Parkuhren hilft Bargeld. Die Vignette kauft man ohnehin online.",
      "Les cartes sont normales en ville et sur les grands campings ; dans les fermes, refuges et aux parcmètres, le liquide dépanne. La vignette s'achète de toute façon en ligne.",
      "Le carte sono normali in città e nei campeggi grandi; in agriturismi, rifugi e ai parchimetri aiuta il contante. La vignetta si compra comunque online.",
      "Cards are normal in cities and on bigger campsites; at farms, huts and parking meters cash helps. The vignette is bought online anyway."
    ),
    twoWheels: l4(
      "Fürs Motorrad gibt es die halbe Vignette. Helmpflicht auf dem Motorrad; Velohelm-Pflicht bis 18.",
      "La moto paie une demi-vignette. Casque obligatoire à moto ; casque vélo obligatoire jusqu'à 18 ans.",
      "Per la moto c'è la mezza vignetta. Casco obbligatorio in moto; casco in bici obbligatorio fino a 18 anni.",
      "Motorbikes get the half-price vignette. Helmet mandatory on the motorbike; bicycle helmet mandatory up to 18."
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
    plug: l4(
      "Typ F (Schuko) und Typ C. Der Schweizer Dreipol-Stecker braucht einen Adapter; zweipolige Gerätestecker passen als Eurostecker.",
      "Type F (Schuko) et type C. La fiche suisse à trois broches nécessite un adaptateur ; les fiches plates à deux broches passent comme europlug.",
      "Tipo F (Schuko) e tipo C. La spina svizzera a tre poli richiede un adattatore; le spine a due poli passano come europlug.",
      "Type F (Schuko) and type C. The Swiss three-pin plug needs an adapter; two-pin europlugs fit."
    ),
    tipping: l4(
      "Bedienung ist inbegriffen; Aufrunden oder 5–10 % bei gutem Service.",
      "Le service est compris ; arrondis ou laisse 5–10 % pour un bon service.",
      "Il servizio è incluso; arrotonda o lascia il 5–10 % per un buon servizio.",
      "Service is included; round up or leave 5–10% for good service."
    ),
    payment: l4(
      "Vorsicht: Viele Supermärkte und Automaten nehmen NUR Debitkarten (Maestro/V-Pay-Nachfolger), oft KEINE Kreditkarten – die Schweizer Debitkarte funktioniert meist, Bargeld wird vielerorts gar nicht mehr angenommen.",
      "Attention : beaucoup de supermarchés et d'automates n'acceptent QUE les cartes de débit, souvent PAS les cartes de crédit – la carte de débit suisse passe généralement, et le liquide n'est souvent plus accepté du tout.",
      "Attenzione: molti supermercati e distributori accettano SOLO carte di debito, spesso NIENTE carte di credito – la carta di debito svizzera di solito funziona, e il contante in molti posti non è più accettato.",
      "Careful: many supermarkets and machines take DEBIT cards only, often NO credit cards – Swiss debit cards usually work, and cash is no longer accepted in many places."
    ),
    twoWheels: l4(
      "Keine Maut. Das Veloland schlechthin: eigene Wege und Ampeln, keine Velohelm-Pflicht; auf dem Motorrad gilt Helmpflicht.",
      "Pas de péage. LE pays du vélo : pistes et feux dédiés, pas d'obligation de casque à vélo ; à moto, casque obligatoire.",
      "Nessun pedaggio. IL paese della bici: piste e semafori dedicati, nessun obbligo di casco in bici; in moto casco obbligatorio.",
      "No toll. THE cycling country: dedicated paths and lights, no bicycle helmet requirement; on the motorbike a helmet is mandatory."
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
    plug: l4(
      "Typ F (Schuko) und Typ C. Der Schweizer Dreipol-Stecker braucht einen Adapter; zweipolige Gerätestecker passen als Eurostecker.",
      "Type F (Schuko) et type C. La fiche suisse à trois broches nécessite un adaptateur ; les fiches plates à deux broches passent comme europlug.",
      "Tipo F (Schuko) e tipo C. La spina svizzera a tre poli richiede un adattatore; le spine a due poli passano come europlug.",
      "Type F (Schuko) and type C. The Swiss three-pin plug needs an adapter; two-pin europlugs fit."
    ),
    tipping: l4(
      "Im Restaurant sind 5–10 % üblich, im Café reicht Aufrunden – am besten bar, auf der Karte lässt sich selten Trinkgeld geben.",
      "Au restaurant, 5–10 % sont d’usage, au café arrondir suffit – de préférence en espèces, la carte permet rarement le pourboire.",
      "Al ristorante il 5–10 % è consueto, al bar basta arrotondare – meglio in contanti, con la carta la mancia è raramente possibile.",
      "In restaurants 5–10% is customary, in cafés rounding up is fine – best in cash, cards rarely allow tips."
    ),
    payment: l4(
      "Seit dem Euro-Beitritt einfach: Karten in Städten und auf Plätzen üblich, an Stränden, Märkten und für Parkgebühren ist Bargeld praktisch. Keine Kuna mehr wechseln!",
      "Simple depuis le passage à l'euro : cartes courantes en ville et sur les campings ; aux plages, marchés et pour le parking, le liquide est pratique. Plus besoin de changer des kunas !",
      "Semplice dall'ingresso nell'euro: carte comuni in città e nei campeggi; in spiaggia, ai mercati e per il parcheggio il contante è pratico. Niente più kune da cambiare!",
      "Simple since the euro switch: cards are common in towns and on campsites; at beaches, markets and for parking, cash is handy. No more kuna to exchange!"
    ),
    twoWheels: l4(
      "Motorräder zahlen Maut. Helmpflicht; Motorräder fahren auch tagsüber mit Licht.",
      "Les motos paient le péage. Casque obligatoire ; les motos roulent feux allumés même de jour.",
      "Le moto pagano il pedaggio. Casco obbligatorio; le moto viaggiano con le luci accese anche di giorno.",
      "Motorbikes pay the toll. Helmet mandatory; motorbikes ride with lights on during the day too."
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
    plug: l4(
      "Typ F (Schuko) und Typ C. Der Schweizer Dreipol-Stecker braucht einen Adapter; zweipolige Gerätestecker passen als Eurostecker.",
      "Type F (Schuko) et type C. La fiche suisse à trois broches nécessite un adaptateur ; les fiches plates à deux broches passent comme europlug.",
      "Tipo F (Schuko) e tipo C. La spina svizzera a tre poli richiede un adattatore; le spine a due poli passano come europlug.",
      "Type F (Schuko) and type C. The Swiss three-pin plug needs an adapter; two-pin europlugs fit."
    ),
    tipping: l4(
      "Keine Pflicht: Aufrunden reicht, im Restaurant sind 5–10 % grosszügig.",
      "Pas d’obligation : arrondir suffit, au restaurant 5–10 % sont généreux.",
      "Nessun obbligo: arrotondare basta, al ristorante il 5–10 % è generoso.",
      "No obligation: rounding up is fine; in restaurants 5–10% is generous."
    ),
    payment: l4(
      "Karte geht fast überall, auch für den Kafi – nur Märkte, Chiringuitos und kleine Bars wollen manchmal Bargeld. Ausweis bereithalten: Bei Kartenzahlung wird gelegentlich ein Dokument verlangt.",
      "La carte passe presque partout, même pour le café – seuls les marchés, chiringuitos et petits bars veulent parfois du liquide. Garde une pièce d'identité : elle est parfois demandée lors du paiement par carte.",
      "La carta va quasi ovunque, anche per il caffè – solo mercati, chiringuiti e piccoli bar vogliono a volte contanti. Tieni un documento: con la carta a volte lo chiedono.",
      "Cards work almost everywhere, even for coffee – only markets, chiringuitos and small bars sometimes want cash. Keep ID handy: card payments occasionally require a document."
    ),
    twoWheels: l4(
      "Helmpflicht auf dem Motorrad. BESONDERS: Ausserorts gilt die Helmpflicht auch auf dem Velo (innerorts bis 16).",
      "Casque obligatoire à moto. PARTICULARITÉ : hors agglomération, le casque est aussi obligatoire à vélo (en ville jusqu'à 16 ans).",
      "Casco obbligatorio in moto. PARTICOLARITÀ: fuori dai centri abitati il casco è obbligatorio anche in bici (in città fino a 16 anni).",
      "Helmet mandatory on the motorbike. NOTE: outside built-up areas helmets are mandatory on bicycles too (in town up to 16)."
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
  {
    code: "PT",
    flag: "🇵🇹",
    name: l4("Portugal", "Portugal", "Portogallo", "Portugal"),
    updated: "2026-08-09",
    toll: l4(
      "Maut auf fast allen Autobahnen. Viele Strecken (die früheren SCUT) haben NUR elektronische Portale ohne Kassen – ausländische Kennzeichen vorab registrieren (EasyToll mit Kreditkarte oder Via-Verde-Leihgerät), sonst drohen Bussen.",
      "Péage sur presque toutes les autoroutes. Beaucoup de tronçons (les anciennes SCUT) n'ont QUE des portiques électroniques sans caisses – enregistre la plaque étrangère à l'avance (EasyToll avec carte de crédit ou boîtier Via Verde), sinon gare aux amendes.",
      "Pedaggio su quasi tutte le autostrade. Molte tratte (le ex SCUT) hanno SOLO portali elettronici senza casse – registra prima la targa straniera (EasyToll con carta di credito o dispositivo Via Verde), altrimenti arrivano multe.",
      "Tolls on almost all motorways. Many stretches (the former SCUT roads) have ONLY electronic gantries with no booths – register a foreign plate in advance (EasyToll with a credit card or a Via Verde device) or fines follow."
    ),
    trailer: l4(
      "Mit Anhänger oder Wohnwagen rutschst du an den Mautstellen in eine höhere Klasse (Klasse 2 statt 1) – gemessen wird die Höhe über der ersten Achse.",
      "Avec remorque ou caravane, tu passes dans une classe de péage supérieure (classe 2 au lieu de 1) – la hauteur au-dessus du premier essieu fait foi.",
      "Con rimorchio o roulotte passi a una classe di pedaggio superiore (classe 2 invece di 1) – conta l'altezza sopra il primo asse.",
      "With a trailer or caravan you move up a toll class (class 2 instead of 1) – measured by the height above the first axle."
    ),
    speed: { motorway: 100, rural: 80, urban: 50 },
    speedNote: l4(
      "Angaben für Gespanne. Personenwagen allein: 120/90/50; im ersten Jahr nach der Prüfung gilt überall höchstens 90 km/h.",
      "Valeurs pour les attelages. Voiture seule : 120/90/50 ; la première année de permis, 90 km/h au maximum partout.",
      "Valori per i traini. Automobile da sola: 120/90/50; nel primo anno di patente vale ovunque al massimo 90 km/h.",
      "Figures for car-and-trailer rigs. Car alone: 120/90/50; in the first year after the test the limit is 90 km/h everywhere."
    ),
    bacPermille: 0.5,
    bacNote: l4(
      "0,5 ‰; für Neulenkende (unter 3 Jahren) und Berufsfahrer 0,2 ‰.",
      "0,5 ‰ ; pour les nouveaux conducteurs (moins de 3 ans) et les professionnels, 0,2 ‰.",
      "0,5 ‰; per i neopatentati (meno di 3 anni) e i professionisti 0,2 ‰.",
      "0.5 ‰; for new drivers (under 3 years) and professionals 0.2 ‰."
    ),
    equipment: l4(
      "Warndreieck und Warnweste gehören ins Auto (die Weste muss VOR dem Aussteigen angezogen werden). Wer eine Brille braucht, führt eine Ersatzbrille mit – eine portugiesische Eigenheit.",
      "Triangle et gilet dans la voiture (le gilet s'enfile AVANT de descendre). Qui porte des lunettes emporte une paire de rechange – une particularité portugaise.",
      "Triangolo e gilet in auto (il gilet si indossa PRIMA di scendere). Chi porta occhiali tiene un paio di riserva – una particolarità portoghese.",
      "Carry a warning triangle and hi-vis vest (put the vest on BEFORE getting out). Glasses wearers should carry a spare pair – a Portuguese quirk."
    ),
    zones: l4(
      "Lissabon hat eine Umweltzone (ZER) in der Innenstadt für ältere Fahrzeuge; die Altstadtgassen sind ohnehin oft Anwohnenden vorbehalten. Sonst keine flächigen Zonen.",
      "Lisbonne a une zone environnementale (ZER) au centre pour les véhicules anciens ; les ruelles de la vieille ville sont souvent réservées aux riverains. Sinon, pas de zones étendues.",
      "Lisbona ha una zona ambientale (ZER) in centro per i veicoli più vecchi; i vicoli della città vecchia sono comunque spesso riservati ai residenti. Altrimenti niente zone estese.",
      "Lisbon has a low-emission zone (ZER) in the centre for older vehicles; old-town lanes are often residents-only anyway. No other large zones."
    ),
    plug: l4(
      "Typ F (Schuko) und Typ C. Der Schweizer Dreipol-Stecker braucht einen Adapter; zweipolige Eurostecker passen.",
      "Type F (Schuko) et type C. La fiche suisse à trois broches nécessite un adaptateur ; les europlugs à deux broches passent.",
      "Tipo F (Schuko) e tipo C. La spina svizzera a tre poli richiede un adattatore; le europlug a due poli passano.",
      "Type F (Schuko) and type C. The Swiss three-pin plug needs an adapter; two-pin europlugs fit."
    ),
    tipping: l4(
      "Kein Muss: Im Restaurant rundet man auf oder lässt 5–10 % bei gutem Service; im Café bleibt das Kleingeld liegen.",
      "Pas obligatoire : au restaurant, on arrondit ou on laisse 5–10 % pour un bon service ; au café, on laisse la petite monnaie.",
      "Non obbligatoria: al ristorante si arrotonda o si lascia il 5–10 % per un buon servizio; al caffè restano gli spiccioli.",
      "Not compulsory: in restaurants round up or leave 5–10% for good service; in cafés leave the small change."
    ),
    payment: l4(
      "Multibanco-Automaten und Kartenzahlung sind überall; kleine Cafés, Märkte und Strandbars wollen manchmal Bargeld. Für die elektronische Maut braucht es zwingend die Registrierung mit Karte.",
      "Les automates Multibanco et la carte passent partout ; petits cafés, marchés et bars de plage veulent parfois du liquide. Pour le péage électronique, l'enregistrement avec carte est indispensable.",
      "I bancomat Multibanco e la carta vanno ovunque; piccoli caffè, mercati e bar in spiaggia vogliono a volte contanti. Per il pedaggio elettronico serve per forza la registrazione con carta.",
      "Multibanco machines and card payment are everywhere; small cafés, markets and beach bars sometimes want cash. The electronic toll strictly requires card registration."
    ),
    twoWheels: l4(
      "Auch Motorräder zahlen die elektronische Maut – die Portal-Falle gilt genauso. Helmpflicht.",
      "Les motos paient aussi le péage électronique – le piège des portiques vaut pareil. Casque obligatoire.",
      "Anche le moto pagano il pedaggio elettronico – la trappola dei portali vale ugualmente. Casco obbligatorio.",
      "Motorbikes also pay the electronic toll – the gantry trap applies just the same. Helmet mandatory."
    ),
    emergency: "112",
    emergencyNote: l4(
      "112 für Polizei, Feuerwehr und Rettung.",
      "112 pour la police, les pompiers et les secours.",
      "112 per polizia, pompieri e soccorso.",
      "112 for police, fire brigade and ambulance."
    ),
    camping: l4(
      "Wildcampen ist verboten und wird seit ein paar Jahren streng gebüsst – auch das Übernachten im Wohnmobil ausserhalb erlaubter Plätze. Dafür gibt es ein dichtes Netz offizieller Stellplätze (áreas de serviço) und günstige Plätze.",
      "Le camping sauvage est interdit et sévèrement sanctionné depuis quelques années – y compris la nuit en camping-car hors des emplacements autorisés. En revanche, le réseau d'aires officielles (áreas de serviço) est dense et les campings bon marché.",
      "Il campeggio libero è vietato e da qualche anno multato severamente – anche la notte in camper fuori dalle aree autorizzate. In compenso c'è una fitta rete di aree ufficiali (áreas de serviço) e campeggi economici.",
      "Wild camping is banned and has been strictly fined for a few years – including motorhome overnights outside permitted spots. In return there is a dense network of official áreas de serviço and cheap campsites."
    ),
    aliases: [
      "portugal",
      "portogallo",
      "algarve",
      "lissabon",
      "lisboa",
      "lisbonne",
      "porto",
      "madeira",
      "azoren",
      "nazare",
    ],
  },
  {
    code: "GR",
    flag: "🇬🇷",
    name: l4("Griechenland", "Grèce", "Grecia", "Greece"),
    updated: "2026-08-09",
    toll: l4(
      "Keine Vignette, dafür Mautstellen auf den Autobahnen (bar oder mit Karte). Die Strecken Athen–Thessaloniki und Richtung Peloponnes summieren sich ordentlich.",
      "Pas de vignette, mais des gares de péage sur les autoroutes (espèces ou carte). Les trajets Athènes–Thessalonique et vers le Péloponnèse finissent par chiffrer.",
      "Nessuna vignetta, ma caselli sulle autostrade (contanti o carta). Le tratte Atene–Salonicco e verso il Peloponneso alla fine pesano.",
      "No vignette, but toll plazas on the motorways (cash or card). Athens–Thessaloniki and routes to the Peloponnese add up."
    ),
    trailer: l4(
      "Gespanne zahlen an den Mautstellen die höhere Klasse (nach Höhe und Achsen).",
      "Les attelages paient la classe supérieure aux péages (selon hauteur et essieux).",
      "I traini pagano ai caselli la classe superiore (per altezza e assi).",
      "Rigs pay the higher class at toll plazas (by height and axles)."
    ),
    speed: { motorway: 90, rural: 80, urban: 50 },
    speedNote: l4(
      "Angaben für Gespanne. Personenwagen allein: 130/90/50. Auf den Inseln sind die Strassen oft schmal – die Tafeln vor Ort gehen vor.",
      "Valeurs pour les attelages. Voiture seule : 130/90/50. Sur les îles, les routes sont souvent étroites – les panneaux sur place priment.",
      "Valori per i traini. Automobile da sola: 130/90/50. Sulle isole le strade sono spesso strette – prevalgono i cartelli sul posto.",
      "Figures for rigs. Car alone: 130/90/50. Island roads are often narrow – local signs take precedence."
    ),
    bacPermille: 0.5,
    bacNote: l4(
      "0,5 ‰; für Neulenkende, Motorrad- und Berufsfahrer 0,2 ‰.",
      "0,5 ‰ ; pour les nouveaux conducteurs, motards et professionnels, 0,2 ‰.",
      "0,5 ‰; per neopatentati, motociclisti e professionisti 0,2 ‰.",
      "0.5 ‰; for new drivers, motorcyclists and professionals 0.2 ‰."
    ),
    equipment: l4(
      "Griechenland verlangt mehr als die Nachbarn: Warndreieck, Verbandskasten UND Feuerlöscher gehören ins Fahrzeug.",
      "La Grèce exige plus que ses voisins : triangle, trousse de secours ET extincteur dans le véhicule.",
      "La Grecia chiede più dei vicini: triangolo, kit di pronto soccorso E estintore nel veicolo.",
      "Greece asks for more than its neighbours: warning triangle, first-aid kit AND a fire extinguisher in the vehicle."
    ),
    zones: l4(
      "Athen beschränkt den innersten Ring (Daktylios) an Werktagen – Fahrzeuge mit ausländischen Kennzeichen sind davon praktisch nicht betroffen. Sonst keine Umweltzonen.",
      "Athènes limite l'anneau central (Daktylios) en semaine – les véhicules immatriculés à l'étranger ne sont pratiquement pas concernés. Sinon, pas de zones environnementales.",
      "Atene limita l'anello centrale (Daktylios) nei giorni feriali – i veicoli con targa estera in pratica non sono toccati. Altrimenti niente zone ambientali.",
      "Athens restricts the innermost ring (Daktylios) on weekdays – foreign-plated vehicles are practically unaffected. No other environmental zones."
    ),
    plug: l4(
      "Typ F (Schuko) und Typ C. Der Schweizer Dreipol-Stecker braucht einen Adapter; zweipolige Eurostecker passen.",
      "Type F (Schuko) et type C. La fiche suisse à trois broches nécessite un adaptateur ; les europlugs à deux broches passent.",
      "Tipo F (Schuko) e tipo C. La spina svizzera a tre poli richiede un adattatore; le europlug a due poli passano.",
      "Type F (Schuko) and type C. The Swiss three-pin plug needs an adapter; two-pin europlugs fit."
    ),
    tipping: l4(
      "In der Taverne rundet man auf oder lässt 5–10 %; das Kleingeld auf dem Tellerchen gehört zum guten Ton.",
      "À la taverne, on arrondit ou on laisse 5–10 % ; la petite monnaie sur la soucoupe fait partie des usages.",
      "In taverna si arrotonda o si lascia il 5–10 %; gli spiccioli sul piattino fanno parte del galateo.",
      "In tavernas round up or leave 5–10%; small change on the saucer is good manners."
    ),
    payment: l4(
      "Händler müssen Karten nehmen, und in Städten klappt das auch – auf Inseln, an Kiosken und in Familientavernen ist Bargeld trotzdem oft schneller. Die Maut nimmt Karten.",
      "Les commerçants doivent accepter les cartes, et en ville ça marche – sur les îles, aux kiosques et dans les tavernes familiales, le liquide reste souvent plus rapide. Le péage prend les cartes.",
      "Gli esercenti devono accettare le carte, e in città funziona – sulle isole, ai chioschi e nelle taverne a conduzione familiare il contante resta spesso più veloce. Il pedaggio accetta carte.",
      "Merchants must take cards, and in cities they do – on islands, at kiosks and in family tavernas cash is still often quicker. Tolls take cards."
    ),
    twoWheels: l4(
      "Helmpflicht auf dem Motorrad – auch wenn Einheimische sie oft ignorieren, wird gebüsst. Motorräder zahlen ermässigte Maut.",
      "Casque obligatoire à moto – même si les locaux l'ignorent souvent, l'amende tombe. Les motos paient un péage réduit.",
      "Casco obbligatorio in moto – anche se i locali spesso lo ignorano, la multa arriva. Le moto pagano un pedaggio ridotto.",
      "Helmet mandatory on the motorbike – locals may ignore it, the fine still comes. Motorbikes pay a reduced toll."
    ),
    emergency: "112",
    emergencyNote: l4(
      "112 europaweit; 100 ruft direkt die Polizei, 166 die Ambulanz.",
      "112 européen ; le 100 appelle directement la police, le 166 l'ambulance.",
      "112 europeo; il 100 chiama direttamente la polizia, il 166 l'ambulanza.",
      "112 Europe-wide; 100 reaches the police directly, 166 the ambulance."
    ),
    camping: l4(
      "Wildcampen ist offiziell verboten – gerade in der Hochsaison wird kontrolliert. Campingplätze gibt es viele, aber ausserhalb der Saison (November bis April) ist ein Grossteil geschlossen.",
      "Le camping sauvage est officiellement interdit – des contrôles ont lieu surtout en haute saison. Les campings sont nombreux, mais hors saison (novembre à avril) beaucoup sont fermés.",
      "Il campeggio libero è ufficialmente vietato – in alta stagione si controlla. I campeggi sono tanti, ma fuori stagione (novembre–aprile) in gran parte chiusi.",
      "Wild camping is officially banned – checks happen especially in high season. There are many campsites, but off season (November to April) most are closed."
    ),
    aliases: [
      "griechenland",
      "grece",
      "grecia",
      "greece",
      "kreta",
      "rhodos",
      "korfu",
      "athen",
      "peloponnes",
      "chalkidiki",
      "thessaloniki",
      "santorini",
    ],
  },
  {
    code: "DK",
    flag: "🇩🇰",
    name: l4("Dänemark", "Danemark", "Danimarca", "Denmark"),
    updated: "2026-08-09",
    toll: l4(
      "Keine Vignette und keine Streckenmaut – dafür kosten die grossen Brücken: Storebælt (Fünen–Seeland) und Øresund (nach Schweden) verlangen happige Gebühren; online vorbezahlen ist günstiger.",
      "Ni vignette ni péage kilométrique – mais les grands ponts se paient : Storebælt (Fionie–Seeland) et Øresund (vers la Suède) coûtent cher ; prépayer en ligne revient moins cher.",
      "Nessuna vignetta e nessun pedaggio chilometrico – ma i grandi ponti si pagano: Storebælt (Fionia–Selandia) e Øresund (verso la Svezia) costano parecchio; prepagare online conviene.",
      "No vignette and no per-kilometre toll – but the big bridges charge: Storebælt (Funen–Zealand) and Øresund (to Sweden) are pricey; prepaying online is cheaper."
    ),
    trailer: l4(
      "Auf den Brücken zahlt das Gespann nach Gesamtlänge – ab 6 m wird es deutlich teurer.",
      "Sur les ponts, l'attelage paie selon la longueur totale – au-delà de 6 m, c'est nettement plus cher.",
      "Sui ponti il traino paga in base alla lunghezza totale – oltre i 6 m diventa nettamente più caro.",
      "On the bridges rigs pay by total length – beyond 6 m it gets noticeably dearer."
    ),
    speed: { motorway: 80, rural: 70, urban: 50 },
    speedNote: l4(
      "Angaben für Gespanne (Tempo-100-Zulassungen aus dem Ausland gelten nicht). Personenwagen allein: 110–130/80/50.",
      "Valeurs pour les attelages (les homologations Tempo 100 étrangères ne comptent pas). Voiture seule : 110–130/80/50.",
      "Valori per i traini (le omologazioni Tempo 100 estere non valgono). Automobile da sola: 110–130/80/50.",
      "Figures for rigs (foreign Tempo 100 approvals do not apply). Car alone: 110–130/80/50."
    ),
    bacPermille: 0.5,
    bacNote: l4(
      "0,5 ‰ für alle – Busse als Prozentsatz des Monatslohns, das kann teuer werden.",
      "0,5 ‰ pour tous – l'amende est un pourcentage du salaire mensuel, ça peut coûter cher.",
      "0,5 ‰ per tutti – la multa è una percentuale dello stipendio mensile, può costare cara.",
      "0.5 ‰ for everyone – fines are a percentage of your monthly pay, which can get expensive."
    ),
    equipment: l4(
      "Warndreieck Pflicht, Warnweste nur empfohlen. Abblendlicht gilt rund um die Uhr – bei Schweizer Autos mit Tagfahrlicht kein Thema.",
      "Triangle obligatoire, gilet seulement recommandé. Feux de croisement en permanence – aucun souci avec les feux de jour des voitures suisses.",
      "Triangolo obbligatorio, gilet solo consigliato. Anabbaglianti sempre accesi – nessun problema con le luci diurne delle auto svizzere.",
      "Warning triangle mandatory, vest only recommended. Dipped lights around the clock – no issue with Swiss cars' daytime running lights."
    ),
    zones: l4(
      "Umweltzonen (miljøzoner) in Kopenhagen, Aarhus, Odense und Aalborg für Diesel-Fahrzeuge – ausländische Diesel-Wohnmobile und -Transporter müssen sich VOR der Einfahrt online registrieren.",
      "Zones environnementales (miljøzoner) à Copenhague, Aarhus, Odense et Aalborg pour les diesels – camping-cars et utilitaires diesel étrangers doivent s'enregistrer en ligne AVANT d'entrer.",
      "Zone ambientali (miljøzoner) a Copenaghen, Aarhus, Odense e Aalborg per i diesel – camper e furgoni diesel esteri devono registrarsi online PRIMA di entrare.",
      "Environmental zones (miljøzoner) in Copenhagen, Aarhus, Odense and Aalborg for diesels – foreign diesel motorhomes and vans must register online BEFORE entering."
    ),
    plug: l4(
      "Typ K (dänisch) und Typ F. Zweipolige Eurostecker passen; der Schweizer Dreipol-Stecker braucht einen Adapter, und geerdete Schuko-Stecker sitzen in alten Typ-K-Dosen ohne Erdung.",
      "Type K (danois) et type F. Les europlugs à deux broches passent ; la fiche suisse à trois broches nécessite un adaptateur, et les fiches Schuko perdent la terre dans les vieilles prises K.",
      "Tipo K (danese) e tipo F. Le europlug a due poli passano; la spina svizzera a tre poli richiede un adattatore, e le Schuko nelle vecchie prese K restano senza terra.",
      "Type K (Danish) and type F. Two-pin europlugs fit; the Swiss three-pin plug needs an adapter, and earthed Schuko plugs lose their earth in old type-K sockets."
    ),
    tipping: l4(
      "Bedienung ist im Preis inbegriffen – Trinkgeld ist unüblich; wer mag, rundet auf.",
      "Le service est compris – le pourboire est inhabituel ; qui veut arrondit.",
      "Il servizio è compreso – la mancia è inusuale; chi vuole arrotonda.",
      "Service is included – tipping is unusual; round up if you like."
    ),
    payment: l4(
      "Fast bargeldlos: Karte und Handy zahlen überall, manche Automaten und Läden nehmen gar kein Bargeld mehr. Eine Kreditkarte plus Debitkarte decken alles ab – Kronen wechseln lohnt kaum.",
      "Presque sans espèces : carte et téléphone passent partout, certains automates et magasins n'acceptent plus du tout le liquide. Une carte de crédit plus une carte de débit couvrent tout – changer des couronnes ne vaut guère la peine.",
      "Quasi senza contanti: carta e telefono vanno ovunque, alcuni distributori e negozi non accettano più contante. Una carta di credito più una di debito coprono tutto – cambiare corone conviene poco.",
      "Almost cashless: card and phone pay everywhere, some machines and shops no longer take cash at all. A credit card plus a debit card cover everything – exchanging kroner is hardly worth it."
    ),
    twoWheels: l4(
      "Die grossen Brücken kosten auch fürs Motorrad. Keine Velohelm-Pflicht, aber Handzeichen beim Abbiegen sind fürs Velo vorgeschrieben.",
      "Les grands ponts sont payants aussi pour la moto. Pas de casque vélo obligatoire, mais les signes de la main sont prescrits à vélo.",
      "I grandi ponti si pagano anche in moto. Nessun obbligo di casco in bici, ma i segnali con la mano sono prescritti.",
      "The big bridges charge motorbikes too. No bicycle helmet requirement, but hand signals when turning are mandatory on bikes."
    ),
    emergency: "112",
    emergencyNote: l4(
      "112 für Polizei, Feuerwehr und Rettung; 114 für die Polizei ohne Notfall.",
      "112 pour la police, les pompiers et les secours ; 114 pour la police hors urgence.",
      "112 per polizia, pompieri e soccorso; 114 per la polizia senza emergenza.",
      "112 for police, fire and ambulance; 114 for non-urgent police matters."
    ),
    camping: l4(
      "Wildcampen mit dem Fahrzeug ist verboten; fürs Zelt gibt es dafür Hunderte einfacher Natur-Lagerplätze (Shelters) – oft gratis oder für wenige Kronen. Wohnmobile übernachten auf Plätzen oder ausgewiesenen Stellplätzen.",
      "Le camping sauvage en véhicule est interdit ; pour la tente, il existe des centaines d'emplacements nature simples (shelters) – souvent gratuits ou pour quelques couronnes. Les camping-cars passent la nuit sur les campings ou aires balisées.",
      "Il campeggio libero col veicolo è vietato; per la tenda ci sono centinaia di semplici piazzole natura (shelter) – spesso gratuite o per poche corone. I camper pernottano in campeggio o nelle aree segnalate.",
      "Wild camping with a vehicle is banned; for tents there are hundreds of simple nature camps (shelters) – often free or a few kroner. Motorhomes stay on campsites or marked aires."
    ),
    aliases: [
      "daenemark",
      "dänemark",
      "danemark",
      "danimarca",
      "denmark",
      "kopenhagen",
      "copenhague",
      "jütland",
      "jylland",
      "bornholm",
      "seeland",
      "skagen",
      "römö",
    ],
  },
  {
    code: "SE",
    flag: "🇸🇪",
    name: l4("Schweden", "Suède", "Svezia", "Sweden"),
    updated: "2026-08-09",
    toll: l4(
      "Keine Vignette und keine Kilometermaut. City-Maut (trängselskatt) in Stockholm und Göteborg: Kameras lesen das Kennzeichen, ausländische Fahrzeuge erhalten die Rechnung über EPASS24 – nichts kleben, aber die Rechnung bezahlen. Die Brücken bei Motala und Sundsvall kosten eine kleine Abgabe, die Öresundbrücke nach Dänemark richtig Geld (online vorauszahlen lohnt).",
      "Pas de vignette ni de péage kilométrique. Péage urbain (trängselskatt) à Stockholm et Göteborg : des caméras lisent la plaque, les véhicules étrangers reçoivent la facture via EPASS24 – rien à coller, mais la facture est à payer. Les ponts de Motala et Sundsvall coûtent une petite redevance, le pont de l'Öresund vers le Danemark coûte cher (prépayer en ligne vaut la peine).",
      "Nessuna vignetta e nessun pedaggio chilometrico. Pedaggio urbano (trängselskatt) a Stoccolma e Göteborg: le telecamere leggono la targa, i veicoli esteri ricevono la fattura tramite EPASS24 – niente da incollare, ma la fattura va pagata. I ponti di Motala e Sundsvall costano una piccola tassa, il ponte sull'Öresund verso la Danimarca costa parecchio (prepagare online conviene).",
      "No vignette and no per-kilometre toll. Congestion tax (trängselskatt) in Stockholm and Gothenburg: cameras read the plate and foreign vehicles are billed via EPASS24 – nothing to stick on, but the bill must be paid. The Motala and Sundsvall bridges charge a small fee, the Öresund bridge to Denmark serious money (prepaying online pays off)."
    ),
    trailer: l4(
      "Gespanne fahren höchstens 80 – ausländische Tempo-100-Zulassungen gelten nicht. Auf der Öresundbrücke zahlt das Gespann nach Gesamtlänge.",
      "Les attelages roulent à 80 au maximum – les homologations Tempo 100 étrangères ne comptent pas. Sur le pont de l'Öresund, l'attelage paie selon la longueur totale.",
      "I traini viaggiano al massimo a 80 – le omologazioni Tempo 100 estere non valgono. Sul ponte dell'Öresund il traino paga in base alla lunghezza totale.",
      "Rigs drive at 80 at most – foreign Tempo 100 approvals do not apply. On the Öresund bridge rigs pay by total length."
    ),
    speed: { motorway: 80, rural: 80, urban: 50 },
    speedNote: l4(
      "Angaben für Gespanne mit gebremstem Anhänger. Personenwagen allein: meist 110–120 auf der Autobahn, 70–100 ausserorts – die Tafeln wechseln oft.",
      "Valeurs pour les attelages avec remorque freinée. Voiture seule : le plus souvent 110–120 sur autoroute, 70–100 hors localité – les panneaux changent souvent.",
      "Valori per i traini con rimorchio frenato. Automobile da sola: per lo più 110–120 in autostrada, 70–100 fuori dai centri – i cartelli cambiano spesso.",
      "Figures for rigs with a braked trailer. Car alone: mostly 110–120 on motorways, 70–100 outside built-up areas – the signs change often."
    ),
    bacPermille: 0.2,
    bacNote: l4(
      "0,2 ‰ – praktisch Nulltoleranz; schon ein Glas Wein kann reichen. Kontrollen sind häufig.",
      "0,2 ‰ – quasiment tolérance zéro ; un seul verre de vin peut suffire. Les contrôles sont fréquents.",
      "0,2 ‰ – praticamente tolleranza zero; già un bicchiere di vino può bastare. I controlli sono frequenti.",
      "0.2 ‰ – practically zero tolerance; a single glass of wine can be enough. Checks are frequent."
    ),
    equipment: l4(
      "Warndreieck Pflicht, Warnweste nur empfohlen. Abblendlicht gilt rund um die Uhr. Vom 1. Dezember bis 31. März sind bei winterlichen Verhältnissen Winterreifen Pflicht – auch am Anhänger und auch für ausländische Fahrzeuge.",
      "Triangle obligatoire, gilet seulement recommandé. Feux de croisement en permanence. Du 1er décembre au 31 mars, pneus d'hiver obligatoires par conditions hivernales – aussi sur la remorque et aussi pour les véhicules étrangers.",
      "Triangolo obbligatorio, gilet solo consigliato. Anabbaglianti sempre accesi. Dal 1° dicembre al 31 marzo, con condizioni invernali, pneumatici invernali obbligatori – anche sul rimorchio e anche per i veicoli esteri.",
      "Warning triangle mandatory, vest only recommended. Dipped lights around the clock. From 1 December to 31 March winter tyres are mandatory in wintry conditions – on the trailer too, and for foreign vehicles as well."
    ),
    zones: l4(
      "Miljözoner in mehreren Städten betreffen vor allem Lastwagen und Busse; Stockholm hat auf einzelnen Strassen eine Zone der Klasse 2 für ältere Diesel-Personenwagen. Fürs Wohnmobil bis 3,5 t reicht es, die City-Maut-Zonen zu kennen.",
      "Les miljözoner de plusieurs villes concernent surtout camions et bus ; Stockholm a, sur quelques rues, une zone de classe 2 pour les vieilles voitures diesel. Pour un camping-car jusqu'à 3,5 t, il suffit de connaître les zones de péage urbain.",
      "Le miljözoner di diverse città riguardano soprattutto camion e bus; Stoccolma ha, su alcune strade, una zona di classe 2 per le vecchie auto diesel. Per un camper fino a 3,5 t basta conoscere le zone del pedaggio urbano.",
      "The miljözoner in several cities mainly affect lorries and buses; Stockholm has a class 2 zone on a few streets for older diesel cars. For a motorhome up to 3.5 t it is enough to know the congestion-tax zones."
    ),
    plug: l4(
      "Typ F (Schuko). Der Eurostecker passt; der Schweizer Dreipol-Stecker braucht einen Adapter.",
      "Type F (Schuko). L'europlug passe ; la fiche suisse à trois broches nécessite un adaptateur.",
      "Tipo F (Schuko). L'europlug passa; la spina svizzera a tre poli richiede un adattatore.",
      "Type F (Schuko). Europlugs fit; the Swiss three-pin plug needs an adapter."
    ),
    tipping: l4(
      "Bedienung ist inbegriffen – Aufrunden ist üblich, im Restaurant sind 5–10 % eine nette Geste, keine Pflicht.",
      "Le service est compris – arrondir est courant ; au restaurant, 5–10 % sont un geste apprécié, pas une obligation.",
      "Il servizio è compreso – arrotondare è consueto; al ristorante il 5–10 % è un gesto gradito, non un obbligo.",
      "Service is included – rounding up is common; in restaurants 5–10 % is a nice gesture, not an obligation."
    ),
    payment: l4(
      "Fast bargeldlos: Karte und Handy zahlen überall, viele Läden und Cafés nehmen gar kein Bargeld mehr – Kronen wechseln lohnt kaum. Die Einheimischen zahlen mit Swish, das braucht aber ein schwedisches Konto.",
      "Presque sans espèces : carte et téléphone passent partout, beaucoup de magasins et cafés n'acceptent plus du tout le liquide – changer des couronnes ne vaut guère la peine. Les locaux paient avec Swish, qui exige toutefois un compte suédois.",
      "Quasi senza contanti: carta e telefono vanno ovunque, molti negozi e caffè non accettano più contante – cambiare corone conviene poco. I locali pagano con Swish, che però richiede un conto svedese.",
      "Almost cashless: card and phone pay everywhere, many shops and cafés no longer take cash at all – exchanging kronor is hardly worth it. Locals pay with Swish, which requires a Swedish account though."
    ),
    twoWheels: l4(
      "Motorräder sind von der City-Maut befreit. Velohelm-Pflicht für Kinder bis 15.",
      "Les motos sont exemptées du péage urbain. Casque vélo obligatoire jusqu'à 15 ans.",
      "Le moto sono esenti dal pedaggio urbano. Casco in bici obbligatorio fino a 15 anni.",
      "Motorbikes are exempt from the congestion tax. Bicycle helmet mandatory up to 15."
    ),
    emergency: "112",
    emergencyNote: l4(
      "112 für alle Notfälle; 1177 für medizinischen Rat, 114 14 für die Polizei ohne Notfall.",
      "112 pour toutes les urgences ; 1177 pour un conseil médical, 114 14 pour la police hors urgence.",
      "112 per tutte le emergenze; 1177 per un consiglio medico, 114 14 per la polizia senza emergenza.",
      "112 for all emergencies; 1177 for medical advice, 114 14 for non-urgent police matters."
    ),
    camping: l4(
      "Das Jedermannsrecht (allemansrätten) erlaubt dem ZELT ein bis zwei Nächte in der freien Natur – mit Abstand zu Häusern, nicht auf Äckern und Privatgärten. Fürs Fahrzeug gilt es NICHT: Wohnmobile übernachten auf Plätzen, Stellplätzen oder dort, wo Parken über Nacht ausdrücklich erlaubt ist.",
      "Le droit d'accès à la nature (allemansrätten) permet à la TENTE une à deux nuits en pleine nature – à distance des maisons, pas dans les champs ni les jardins privés. Il ne vaut PAS pour le véhicule : les camping-cars passent la nuit sur les campings, les aires ou là où le stationnement de nuit est expressément permis.",
      "Il diritto di accesso alla natura (allemansrätten) consente alla TENDA una o due notti nella natura – a distanza dalle case, non nei campi né nei giardini privati. NON vale per il veicolo: i camper pernottano in campeggio, nelle aree di sosta o dove la sosta notturna è espressamente permessa.",
      "The right to roam (allemansrätten) lets a TENT stay one or two nights in open nature – away from houses, not on fields or private gardens. It does NOT cover vehicles: motorhomes stay on campsites, aires or where overnight parking is expressly allowed."
    ),
    aliases: [
      "schweden",
      "suede",
      "svezia",
      "sweden",
      "sverige",
      "stockholm",
      "göteborg",
      "goeteborg",
      "gotland",
      "öland",
      "oeland",
      "smaland",
      "småland",
      "dalarna",
      "malmö",
      "malmoe",
    ],
  },
  {
    code: "NO",
    flag: "🇳🇴",
    name: l4("Norwegen", "Norvège", "Norvegia", "Norway"),
    updated: "2026-08-09",
    toll: l4(
      "Keine Vignette, dafür ein dichtes Netz automatischer Mautstationen (bomstasjoner) an Strassen, Tunneln und Stadtzufahrten – Kameras lesen das Kennzeichen, die Rechnung kommt per Post oder über EPASS24. WICHTIG: Wer das Fahrzeug VOR der Reise bei EPASS24 registriert oder einen AutoPASS-Chip mit Vertrag hat, zahlt bis zu 20 % weniger und erhält keine teuren Einzelrechnungen. Manche Fähren gehören zum Strassennetz und kosten ebenfalls.",
      "Pas de vignette, mais un réseau dense de stations de péage automatiques (bomstasjoner) sur routes, tunnels et accès urbains – des caméras lisent la plaque, la facture arrive par courrier ou via EPASS24. IMPORTANT : qui enregistre son véhicule AVANT le voyage sur EPASS24, ou roule avec un badge AutoPASS sous contrat, paie jusqu'à 20 % de moins et évite les factures individuelles coûteuses. Certains ferries font partie du réseau routier et se paient aussi.",
      "Nessuna vignetta, ma una fitta rete di stazioni di pedaggio automatiche (bomstasjoner) su strade, gallerie e accessi urbani – le telecamere leggono la targa, la fattura arriva per posta o tramite EPASS24. IMPORTANTE: chi registra il veicolo PRIMA del viaggio su EPASS24, o viaggia con un dispositivo AutoPASS con contratto, paga fino al 20 % in meno ed evita care fatture singole. Alcuni traghetti fanno parte della rete stradale e si pagano anch'essi.",
      "No vignette, but a dense network of automatic toll stations (bomstasjoner) on roads, tunnels and city approaches – cameras read the plate, the bill arrives by post or via EPASS24. IMPORTANT: registering the vehicle with EPASS24 BEFORE the trip, or driving with a contracted AutoPASS tag, saves up to 20 % and avoids expensive single invoices. Some ferries are part of the road network and also charge."
    ),
    trailer: l4(
      "Gespanne fahren höchstens 80. An den Mautstationen zahlt das Wohnmobil über 3,5 t den höheren Tarif – der Anhänger selbst kostet nichts extra.",
      "Les attelages roulent à 80 au maximum. Aux stations de péage, le camping-car de plus de 3,5 t paie le tarif supérieur – la remorque elle-même ne coûte rien de plus.",
      "I traini viaggiano al massimo a 80. Alle stazioni di pedaggio il camper oltre 3,5 t paga la tariffa maggiore – il rimorchio in sé non costa nulla in più.",
      "Rigs drive at 80 at most. At the toll stations motorhomes over 3.5 t pay the higher rate – the trailer itself costs nothing extra."
    ),
    speed: { motorway: 80, rural: 80, urban: 50 },
    speedNote: l4(
      "Angaben für Gespanne. Personenwagen allein: 80 ausserorts, 90–110 auf Autobahnen. Die Bussen gehören zu den höchsten Europas – der Tempomat ist dein Freund.",
      "Valeurs pour les attelages. Voiture seule : 80 hors localité, 90–110 sur autoroute. Les amendes comptent parmi les plus élevées d'Europe – le régulateur est ton ami.",
      "Valori per i traini. Automobile da sola: 80 fuori dai centri, 90–110 in autostrada. Le multe sono tra le più alte d'Europa – il cruise control è tuo amico.",
      "Figures for rigs. Car alone: 80 outside built-up areas, 90–110 on motorways. Fines are among the highest in Europe – cruise control is your friend."
    ),
    bacPermille: 0.2,
    bacNote: l4(
      "0,2 ‰ – praktisch Nulltoleranz, und schon kleine Überschreitungen können den Führerausweis kosten.",
      "0,2 ‰ – quasiment tolérance zéro, et même de petits dépassements peuvent coûter le permis.",
      "0,2 ‰ – praticamente tolleranza zero, e già piccoli superamenti possono costare la patente.",
      "0.2 ‰ – practically zero tolerance, and even small excesses can cost you the licence."
    ),
    equipment: l4(
      "Warndreieck UND Warnweste sind Pflicht. Abblendlicht gilt rund um die Uhr. Im Winter braucht es genügend Profil (mindestens 3 mm) und je nach Verhältnissen Winterreifen; auf Passstrassen können Ketten verlangt werden.",
      "Triangle ET gilet obligatoires. Feux de croisement en permanence. En hiver, il faut assez de profil (au moins 3 mm) et, selon les conditions, des pneus d'hiver ; sur les routes de col, des chaînes peuvent être exigées.",
      "Triangolo E gilet obbligatori. Anabbaglianti sempre accesi. In inverno serve profilo sufficiente (almeno 3 mm) e, secondo le condizioni, pneumatici invernali; sulle strade di passo possono essere richieste le catene.",
      "Warning triangle AND vest are mandatory. Dipped lights around the clock. In winter you need enough tread (at least 3 mm) and, depending on conditions, winter tyres; chains may be required on pass roads."
    ),
    zones: l4(
      "Keine klassischen Umweltzonen, aber die Stadt-Maut ist nach Antrieb und Tageszeit gestaffelt (Diesel zahlt in Oslo mehr als Elektro). Bei sehr schlechter Luft kann Oslo tageweise Diesel-Fahrverbote verhängen; für Spike-Reifen verlangen Oslo und Trondheim eine Gebühr.",
      "Pas de zones environnementales classiques, mais le péage urbain varie selon la motorisation et l'heure (le diesel paie plus que l'électrique à Oslo). Par très mauvaise qualité de l'air, Oslo peut interdire les diesels certains jours ; pour les pneus à clous, Oslo et Trondheim exigent une redevance.",
      "Nessuna zona ambientale classica, ma il pedaggio urbano varia secondo l'alimentazione e l'ora (a Oslo il diesel paga più dell'elettrico). Con aria molto cattiva Oslo può vietare i diesel in singoli giorni; per gli pneumatici chiodati Oslo e Trondheim chiedono una tassa.",
      "No classic low-emission zones, but the city toll is staggered by drivetrain and time of day (diesel pays more than electric in Oslo). On very bad air days Oslo can ban diesels; for studded tyres Oslo and Trondheim charge a fee."
    ),
    plug: l4(
      "Typ F (Schuko). Der Eurostecker passt; der Schweizer Dreipol-Stecker braucht einen Adapter.",
      "Type F (Schuko). L'europlug passe ; la fiche suisse à trois broches nécessite un adaptateur.",
      "Tipo F (Schuko). L'europlug passa; la spina svizzera a tre poli richiede un adattatore.",
      "Type F (Schuko). Europlugs fit; the Swiss three-pin plug needs an adapter."
    ),
    tipping: l4(
      "Bedienung ist inbegriffen – Aufrunden oder 5–10 % bei gutem Service sind willkommen, erwartet wird nichts.",
      "Le service est compris – arrondir ou laisser 5–10 % pour un bon service est bienvenu, rien n'est attendu.",
      "Il servizio è compreso – arrotondare o lasciare il 5–10 % per un buon servizio è gradito, nulla è atteso.",
      "Service is included – rounding up or 5–10 % for good service is welcome, nothing is expected."
    ),
    payment: l4(
      "Karte und Handy zahlen praktisch überall, auch auf Fähren und Campingplätzen – Norwegen ist fast bargeldlos unterwegs. Etwas Bargeld braucht es höchstens an unbedienten Naturplätzen mit Kässeli.",
      "Carte et téléphone paient pratiquement partout, aussi sur les ferries et les campings – la Norvège vit presque sans espèces. Un peu de liquide ne sert guère qu'aux emplacements nature sans personnel, avec caisse à monnaie.",
      "Carta e telefono pagano praticamente ovunque, anche su traghetti e campeggi – la Norvegia è quasi senza contanti. Un po' di contante serve al massimo nelle piazzole natura non presidiate con cassetta.",
      "Card and phone pay practically everywhere, on ferries and campsites too – Norway is almost cashless. A little cash is only needed at unstaffed nature sites with an honesty box."
    ),
    twoWheels: l4(
      "Die meisten Mautstationen sind für Motorräder GRATIS. Helmpflicht; die Winterreifen-Regeln gelten auch fürs Motorrad.",
      "La plupart des stations de péage sont GRATUITES pour les motos. Casque obligatoire ; les règles de pneus d'hiver valent aussi à moto.",
      "La maggior parte delle stazioni di pedaggio è GRATUITA per le moto. Casco obbligatorio; le regole sugli pneumatici invernali valgono anche in moto.",
      "Most toll stations are FREE for motorbikes. Helmet mandatory; the winter tyre rules apply to motorbikes too."
    ),
    emergency: "112",
    emergencyNote: l4(
      "112 Polizei, 110 Feuerwehr, 113 Sanität – alle drei führen zum Notfall; 112 funktioniert immer.",
      "112 police, 110 pompiers, 113 ambulance – les trois mènent aux secours ; le 112 fonctionne toujours.",
      "112 polizia, 110 pompieri, 113 ambulanza – tutti e tre portano ai soccorsi; il 112 funziona sempre.",
      "112 police, 110 fire brigade, 113 ambulance – all three reach the emergency services; 112 always works."
    ),
    camping: l4(
      "Das Jedermannsrecht (allemannsretten) erlaubt dem ZELT bis zu zwei Nächte am selben Ort – mindestens 150 m von bewohnten Häusern entfernt, im Hochgebirge auch länger. Fürs Fahrzeug gilt es NICHT: Wohnmobile stehen auf Plätzen, Stellplätzen oder erlaubten Parkplätzen; das Übernachten auf Rastplätzen wird meist geduldet, campieren nicht.",
      "Le droit d'accès à la nature (allemannsretten) permet à la TENTE jusqu'à deux nuits au même endroit – à au moins 150 m des maisons habitées, plus longtemps en haute montagne. Il ne vaut PAS pour le véhicule : les camping-cars stationnent sur les campings, aires ou parkings autorisés ; dormir sur les aires de repos est le plus souvent toléré, camper non.",
      "Il diritto di accesso alla natura (allemannsretten) consente alla TENDA fino a due notti nello stesso posto – ad almeno 150 m dalle case abitate, in alta montagna anche di più. NON vale per il veicolo: i camper sostano in campeggio, nelle aree o nei parcheggi consentiti; dormire nelle aree di sosta è per lo più tollerato, campeggiare no.",
      "The right to roam (allemannsretten) lets a TENT stay up to two nights in the same spot – at least 150 m from inhabited houses, longer in the high mountains. It does NOT cover vehicles: motorhomes stay on campsites, aires or permitted car parks; sleeping at rest areas is mostly tolerated, camping is not."
    ),
    aliases: [
      "norwegen",
      "norvege",
      "norvegia",
      "norway",
      "norge",
      "oslo",
      "bergen",
      "lofoten",
      "nordkap",
      "tromsö",
      "tromsoe",
      "trondheim",
      "stavanger",
      "geiranger",
    ],
  },
  {
    code: "BE",
    flag: "🇧🇪",
    name: l4("Belgien", "Belgique", "Belgio", "Belgium"),
    updated: "2026-08-09",
    toll: l4(
      "Keine Vignette und keine Maut für Fahrzeuge bis 3,5 t – Autobahnen sind gratis. Über 3,5 t gilt die Viapass-Kilometermaut mit Bordgerät (auch für schwere Wohnmobile in Flandern relevant: dort zählt das zulässige Gesamtgewicht). Der Liefkenshoek-Tunnel bei Antwerpen kostet extra.",
      "Pas de vignette ni de péage pour les véhicules jusqu'à 3,5 t – les autoroutes sont gratuites. Au-delà de 3,5 t s'applique le péage kilométrique Viapass avec boîtier (pertinent aussi pour les gros camping-cars en Flandre : c'est le poids maximal autorisé qui compte). Le tunnel de Liefkenshoek près d'Anvers est payant.",
      "Nessuna vignetta e nessun pedaggio per i veicoli fino a 3,5 t – le autostrade sono gratuite. Oltre 3,5 t vale il pedaggio chilometrico Viapass con dispositivo di bordo (rilevante anche per i camper pesanti nelle Fiandre: conta il peso massimo ammesso). Il tunnel di Liefkenshoek presso Anversa si paga a parte.",
      "No vignette and no toll for vehicles up to 3.5 t – motorways are free. Above 3.5 t the Viapass per-kilometre toll with on-board unit applies (relevant for heavy motorhomes in Flanders too: the permissible total weight counts). The Liefkenshoek tunnel near Antwerp costs extra."
    ),
    trailer: l4(
      "Leichte Gespanne bis 3,5 t Gesamtgewicht fahren wie der Personenwagen; schwerere Gespanne höchstens 90 auf der Autobahn.",
      "Les attelages légers jusqu'à 3,5 t de poids total roulent comme la voiture ; les attelages plus lourds à 90 au maximum sur autoroute.",
      "I traini leggeri fino a 3,5 t di peso totale viaggiano come l'automobile; i traini più pesanti al massimo a 90 in autostrada.",
      "Light rigs up to 3.5 t total weight drive like the car; heavier rigs at 90 at most on the motorway."
    ),
    speed: { motorway: 120, rural: 90, urban: 50 },
    speedNote: l4(
      "Ausserorts gilt in Flandern 70, in Wallonien 90 – die Regionsgrenze merkt man nur am Schild. In Brüssel gilt fast überall Tempo 30.",
      "Hors localité, 70 en Flandre et 90 en Wallonie – on ne remarque la limite régionale qu'au panneau. À Bruxelles, le 30 km/h vaut presque partout.",
      "Fuori dai centri vale 70 nelle Fiandre e 90 in Vallonia – il confine regionale si nota solo dal cartello. A Bruxelles vige quasi ovunque il limite di 30.",
      "Outside built-up areas Flanders has 70 and Wallonia 90 – you only notice the regional border by the sign. In Brussels 30 km/h applies almost everywhere."
    ),
    bacPermille: 0.5,
    bacNote: l4(
      "0,5 ‰; für Berufschauffeure gilt 0,2 ‰. Ab 0,8 ‰ wird es sofort teuer und der Ausweis ist weg.",
      "0,5 ‰ ; 0,2 ‰ pour les chauffeurs professionnels. Dès 0,8 ‰, c'est tout de suite cher et le permis saute.",
      "0,5 ‰; per gli autisti professionali vale 0,2 ‰. Da 0,8 ‰ diventa subito caro e la patente salta.",
      "0.5 ‰; 0.2 ‰ for professional drivers. From 0.8 ‰ it gets expensive immediately and the licence is gone."
    ),
    equipment: l4(
      "Warndreieck Pflicht; die Warnweste muss angezogen werden, wer auf Autobahn oder Schnellstrasse ausserhalb des Fahrzeugs steht. Verbandskasten und Feuerlöscher sind nur für in Belgien zugelassene Fahrzeuge Pflicht – an Bord schaden sie trotzdem nicht.",
      "Triangle obligatoire ; le gilet doit être porté par qui se trouve hors du véhicule sur autoroute ou voie rapide. Trousse de secours et extincteur ne sont obligatoires que pour les véhicules immatriculés en Belgique – à bord, ils ne font pas de mal pour autant.",
      "Triangolo obbligatorio; il gilet va indossato da chi sta fuori dal veicolo su autostrada o superstrada. Cassetta di pronto soccorso ed estintore sono obbligatori solo per i veicoli immatricolati in Belgio – a bordo comunque non guastano.",
      "Warning triangle mandatory; the vest must be worn by anyone outside the vehicle on a motorway or expressway. First-aid kit and fire extinguisher are only mandatory for vehicles registered in Belgium – having them on board does no harm though."
    ),
    zones: l4(
      "Umweltzonen (LEZ) in Brüssel, Antwerpen und Gent – DIE FALLE für Reisende: Auch zugelassene ausländische Fahrzeuge müssen sich VOR der Einfahrt online registrieren (gratis), sonst gibt es eine Busse ab 150 Euro, selbst wenn das Fahrzeug die Abgasnorm erfüllt. Die Registrierung gilt mehrere Jahre.",
      "Zones de basses émissions (LEZ) à Bruxelles, Anvers et Gand – LE PIÈGE pour les voyageurs : même les véhicules étrangers admis doivent s'enregistrer en ligne AVANT d'entrer (gratuit), sous peine d'une amende dès 150 euros, même si le véhicule respecte la norme. L'enregistrement vaut plusieurs années.",
      "Zone a basse emissioni (LEZ) a Bruxelles, Anversa e Gand – LA TRAPPOLA per chi viaggia: anche i veicoli esteri ammessi devono registrarsi online PRIMA di entrare (gratis), pena una multa da 150 euro, anche se il veicolo rispetta la norma. La registrazione vale più anni.",
      "Low-emission zones (LEZ) in Brussels, Antwerp and Ghent – THE trap for travellers: even compliant foreign vehicles must register online BEFORE entering (free), or face a fine from 150 euros, even if the vehicle meets the standard. The registration is valid for several years."
    ),
    plug: l4(
      "Typ E (mit Erdungsstift in der Dose). Der Eurostecker passt; der Schweizer Dreipol-Stecker braucht einen Adapter.",
      "Type E (avec broche de terre dans la prise). L'europlug passe ; la fiche suisse à trois broches nécessite un adaptateur.",
      "Tipo E (con spinotto di terra nella presa). L'europlug passa; la spina svizzera a tre poli richiede un adattatore.",
      "Type E (with earth pin in the socket). Europlugs fit; the Swiss three-pin plug needs an adapter."
    ),
    tipping: l4(
      "Bedienung ist inbegriffen – Aufrunden oder ein paar Euro bei gutem Service reichen völlig.",
      "Le service est compris – arrondir ou laisser quelques euros pour un bon service suffit largement.",
      "Il servizio è compreso – arrotondare o lasciare qualche euro per un buon servizio basta e avanza.",
      "Service is included – rounding up or a few euros for good service is plenty."
    ),
    payment: l4(
      "Karte fast überall – die Einheimischen zahlen mit Bancontact, ausländische Debit- und Kreditkarten funktionieren in Läden und an Tankstellen. Etwas Bargeld für Markt, Fritüre und kleine Cafés schadet nicht.",
      "Carte presque partout – les locaux paient avec Bancontact, les cartes de débit et de crédit étrangères passent dans les magasins et stations-service. Un peu de liquide pour le marché, la friterie et les petits cafés ne fait pas de mal.",
      "Carta quasi ovunque – i locali pagano con Bancontact, le carte di debito e credito estere funzionano in negozi e distributori. Un po' di contante per mercato, friggitoria e piccoli caffè non guasta.",
      "Card almost everywhere – locals pay with Bancontact, foreign debit and credit cards work in shops and petrol stations. A little cash for the market, the frituur and small cafés does no harm."
    ),
    twoWheels: l4(
      "Keine Maut; Motorräder sind von den LEZ-Regeln derzeit ausgenommen. Keine allgemeine Velohelm-Pflicht.",
      "Pas de péage ; les motos sont pour l'instant exemptées des règles LEZ. Pas d'obligation générale de casque à vélo.",
      "Nessun pedaggio; le moto sono per ora esenti dalle regole LEZ. Nessun obbligo generale di casco in bici.",
      "No toll; motorbikes are currently exempt from the LEZ rules. No general bicycle helmet requirement."
    ),
    emergency: "112",
    emergencyNote: l4(
      "112 für Rettung und Feuerwehr, 101 für die Polizei; 112 funktioniert für alles.",
      "112 pour les secours et les pompiers, 101 pour la police ; le 112 fonctionne pour tout.",
      "112 per soccorso e pompieri, 101 per la polizia; il 112 funziona per tutto.",
      "112 for ambulance and fire brigade, 101 for the police; 112 works for everything."
    ),
    camping: l4(
      "Wildcampen und freies Übernachten im Fahrzeug sind verboten – auch auf Autobahnrastplätzen wird campieren gebüsst. Dafür gibt es ein dichtes Netz offizieller Wohnmobil-Stellplätze und in Wallonien viele Bauernhof- und Naturplätze.",
      "Le camping sauvage et la nuit libre en véhicule sont interdits – camper sur les aires d'autoroute est aussi amendé. En revanche, il existe un réseau dense d'aires officielles pour camping-cars et, en Wallonie, beaucoup de campings à la ferme et nature.",
      "Il campeggio libero e il pernottamento libero in veicolo sono vietati – campeggiare nelle aree autostradali viene multato. In compenso c'è una fitta rete di aree ufficiali per camper e, in Vallonia, molti campeggi in fattoria e natura.",
      "Wild camping and free overnighting in the vehicle are banned – camping at motorway rest areas is fined too. In return there is a dense network of official motorhome aires and, in Wallonia, many farm and nature sites."
    ),
    aliases: [
      "belgien",
      "belgique",
      "belgio",
      "belgium",
      "belgie",
      "belgië",
      "brüssel",
      "bruessel",
      "brussel",
      "bruxelles",
      "antwerpen",
      "anvers",
      "gent",
      "gand",
      "brugge",
      "bruges",
      "ardennen",
      "ardennes",
      "oostende",
      "ostende",
      "flandern",
      "wallonien",
    ],
  },
  {
    code: "CZ",
    flag: "🇨🇿",
    name: l4("Tschechien", "Tchéquie", "Cechia", "Czechia"),
    updated: "2026-08-09",
    toll: l4(
      "E-Vignette (elektronische Autobahnvignette) fürs Kennzeichen, NUR digital: online unter edalnice.cz kaufen (10 Tage, Monat oder Jahr) – es gibt keinen Kleber, und die Kamera kennt keine Gnade. Über 3,5 t gilt die elektronische Streckenmaut mit Bordgerät.",
      "E-vignette (vignette autoroutière électronique) liée à la plaque, UNIQUEMENT numérique : achat en ligne sur edalnice.cz (10 jours, mois ou année) – pas d'autocollant, et la caméra est sans pitié. Au-delà de 3,5 t, péage électronique au kilomètre avec boîtier.",
      "E-vignetta (vignetta autostradale elettronica) legata alla targa, SOLO digitale: acquisto online su edalnice.cz (10 giorni, mese o anno) – niente adesivo, e la telecamera non perdona. Oltre 3,5 t vale il pedaggio elettronico chilometrico con dispositivo.",
      "E-vignette (electronic motorway vignette) tied to the plate, ONLY digital: buy online at edalnice.cz (10 days, month or year) – there is no sticker, and the camera shows no mercy. Above 3.5 t the electronic per-kilometre toll with on-board unit applies."
    ),
    trailer: l4(
      "Der Anhänger hinter dem Personenwagen braucht keine eigene Vignette – die Vignette hängt am Zugfahrzeug. Gespanne fahren höchstens 80.",
      "La remorque derrière la voiture n'a pas besoin de sa propre vignette – la vignette suit le véhicule tracteur. Les attelages roulent à 80 au maximum.",
      "Il rimorchio dietro l'automobile non ha bisogno di una propria vignetta – la vignetta segue la motrice. I traini viaggiano al massimo a 80.",
      "The trailer behind a car needs no vignette of its own – the vignette follows the towing vehicle. Rigs drive at 80 at most."
    ),
    speed: { motorway: 80, rural: 80, urban: 50 },
    speedNote: l4(
      "Angaben für Gespanne. Personenwagen allein: 130 auf der Autobahn, 90 ausserorts.",
      "Valeurs pour les attelages. Voiture seule : 130 sur autoroute, 90 hors localité.",
      "Valori per i traini. Automobile da sola: 130 in autostrada, 90 fuori dai centri.",
      "Figures for rigs. Car alone: 130 on motorways, 90 outside built-up areas."
    ),
    bacPermille: 0,
    bacNote: l4(
      "0,0 ‰ – absolute Nulltoleranz, und sie gilt auch auf dem Velo.",
      "0,0 ‰ – tolérance zéro absolue, valable aussi à vélo.",
      "0,0 ‰ – tolleranza zero assoluta, valida anche in bici.",
      "0.0 ‰ – absolute zero tolerance, and it applies on bicycles too."
    ),
    equipment: l4(
      "Warndreieck, Warnweste UND Verbandskasten sind Pflicht – der Verbandskasten auch für ausländische Fahrzeuge. Abblendlicht gilt rund um die Uhr, das ganze Jahr.",
      "Triangle, gilet ET trousse de secours obligatoires – la trousse aussi pour les véhicules étrangers. Feux de croisement en permanence, toute l'année.",
      "Triangolo, gilet E cassetta di pronto soccorso obbligatori – la cassetta anche per i veicoli esteri. Anabbaglianti sempre accesi, tutto l'anno.",
      "Warning triangle, vest AND first-aid kit are mandatory – the kit for foreign vehicles too. Dipped lights around the clock, all year."
    ),
    zones: l4(
      "Keine Umweltzonen. In Prag ist die Innenstadt teils für Durchgangsverkehr gesperrt – Parkzonen ernst nehmen, abgeschleppt wird zügig.",
      "Pas de zones environnementales. À Prague, le centre est en partie fermé au transit – prendre les zones de stationnement au sérieux, la fourrière est rapide.",
      "Nessuna zona ambientale. A Praga il centro è in parte chiuso al traffico di transito – prendere sul serio le zone di parcheggio, il carro attrezzi è rapido.",
      "No low-emission zones. In Prague parts of the centre are closed to through traffic – take the parking zones seriously, towing is swift."
    ),
    plug: l4(
      "Typ E (mit Erdungsstift in der Dose). Der Eurostecker passt; der Schweizer Dreipol-Stecker braucht einen Adapter.",
      "Type E (avec broche de terre dans la prise). L'europlug passe ; la fiche suisse à trois broches nécessite un adaptateur.",
      "Tipo E (con spinotto di terra nella presa). L'europlug passa; la spina svizzera a tre poli richiede un adattatore.",
      "Type E (with earth pin in the socket). Europlugs fit; the Swiss three-pin plug needs an adapter."
    ),
    tipping: l4(
      "Rund 10 % sind im Restaurant üblich – das Trinkgeld beim Bezahlen ansagen, nicht auf dem Tisch liegen lassen.",
      "Environ 10 % au restaurant – annoncer le pourboire au moment de payer, ne pas le laisser sur la table.",
      "Circa il 10 % al ristorante – annunciare la mancia al momento di pagare, non lasciarla sul tavolo.",
      "Around 10 % in restaurants – state the tip when paying, don't leave it on the table."
    ),
    payment: l4(
      "Karte fast überall, auch kontaktlos. Bezahlt wird in Kronen (CZK) – Euro werden mancherorts genommen, aber zu schlechtem Kurs; ein paar Kronen für Markt und Parkautomat schaden nicht.",
      "Carte presque partout, aussi sans contact. On paie en couronnes (CZK) – l'euro est parfois accepté, mais à mauvais taux ; quelques couronnes pour le marché et l'horodateur ne font pas de mal.",
      "Carta quasi ovunque, anche contactless. Si paga in corone (CZK) – l'euro a volte è accettato, ma a cambio sfavorevole; qualche corona per mercato e parchimetro non guasta.",
      "Card almost everywhere, contactless too. You pay in koruna (CZK) – euros are sometimes taken, at a poor rate; a few koruna for the market and parking meter do no harm."
    ),
    twoWheels: l4(
      "Motorräder brauchen KEINE Vignette. Helmpflicht, Licht immer an – und die Nulltoleranz beim Alkohol gilt auch auf dem Velo.",
      "Les motos n'ont PAS besoin de vignette. Casque obligatoire, feux toujours allumés – et la tolérance zéro pour l'alcool vaut aussi à vélo.",
      "Le moto NON hanno bisogno della vignetta. Casco obbligatorio, luci sempre accese – e la tolleranza zero per l'alcol vale anche in bici.",
      "Motorbikes need NO vignette. Helmet mandatory, lights always on – and the zero alcohol limit applies on bicycles too."
    ),
    emergency: "112",
    emergencyNote: l4(
      "112 europaweit; 158 Polizei, 155 Rettung, 150 Feuerwehr.",
      "112 partout en Europe ; 158 police, 155 ambulance, 150 pompiers.",
      "112 in tutta Europa; 158 polizia, 155 ambulanza, 150 pompieri.",
      "112 across Europe; 158 police, 155 ambulance, 150 fire brigade."
    ),
    camping: l4(
      "Wildcampen ist verboten, in Schutzgebieten (Riesengebirge, Böhmische Schweiz) wird streng gebüsst. Übernachten im Fahrzeug auf Parkplätzen wird meist geduldet, campieren nicht – das Platznetz ist dicht und günstig.",
      "Le camping sauvage est interdit, sévèrement amendé dans les zones protégées (monts des Géants, Suisse bohémienne). Dormir dans le véhicule sur un parking est le plus souvent toléré, camper non – le réseau de campings est dense et bon marché.",
      "Il campeggio libero è vietato, severamente multato nelle aree protette (Monti dei Giganti, Svizzera boema). Dormire in veicolo nei parcheggi è per lo più tollerato, campeggiare no – la rete di campeggi è fitta ed economica.",
      "Wild camping is banned and fined hard in protected areas (Giant Mountains, Bohemian Switzerland). Sleeping in the vehicle in car parks is mostly tolerated, camping is not – the campsite network is dense and cheap."
    ),
    aliases: [
      "tschechien",
      "tchequie",
      "cechia",
      "czechia",
      "cesko",
      "prag",
      "praha",
      "prague",
      "praga",
      "böhmen",
      "boehmen",
      "mähren",
      "maehren",
      "riesengebirge",
      "krumlov",
      "pilsen",
      "brünn",
      "bruenn",
    ],
  },
  {
    code: "PL",
    flag: "🇵🇱",
    name: l4("Polen", "Pologne", "Polonia", "Poland"),
    updated: "2026-08-09",
    toll: l4(
      "Keine Vignette bis 3,5 t. Die staatlichen Autobahnabschnitte (A2 Konin–Stryków, A4 Wrocław–Sośnica) zahlt der Personenwagen per e-TOLL-App oder E-Ticket VOR der Fahrt; die privaten Abschnitte der A1, A2 und A4 kassieren klassisch an der Schranke.",
      "Pas de vignette jusqu'à 3,5 t. Les tronçons d'autoroute publics (A2 Konin–Stryków, A4 Wrocław–Sośnica) se paient AVANT le trajet via l'app e-TOLL ou un e-ticket ; les tronçons privés des A1, A2 et A4 encaissent classiquement à la barrière.",
      "Nessuna vignetta fino a 3,5 t. I tratti autostradali statali (A2 Konin–Stryków, A4 Wrocław–Sośnica) si pagano PRIMA del viaggio via app e-TOLL o e-ticket; i tratti privati di A1, A2 e A4 incassano classicamente alla barriera.",
      "No vignette up to 3.5 t. The state motorway sections (A2 Konin–Stryków, A4 Wrocław–Sośnica) are paid BEFORE the trip via the e-TOLL app or an e-ticket; the private sections of the A1, A2 and A4 collect classically at the barrier."
    ),
    trailer: l4(
      "Gespanne fahren höchstens 80 auf der Autobahn und 70 ausserorts – deutlich langsamer als der Verkehr, rechts bleiben.",
      "Les attelages roulent à 80 au maximum sur autoroute et 70 hors localité – nettement plus lents que le trafic, rester à droite.",
      "I traini viaggiano al massimo a 80 in autostrada e 70 fuori dai centri – ben più lenti del traffico, restare a destra.",
      "Rigs drive at 80 at most on motorways and 70 outside built-up areas – noticeably slower than the traffic, keep right."
    ),
    speed: { motorway: 80, rural: 70, urban: 50 },
    speedNote: l4(
      "Angaben für Gespanne. Personenwagen allein: bis 140 auf der Autobahn – gefahren wird oft schneller, die Kontrollen sind trotzdem real.",
      "Valeurs pour les attelages. Voiture seule : jusqu'à 140 sur autoroute – on roule souvent plus vite, les contrôles sont pourtant réels.",
      "Valori per i traini. Automobile da sola: fino a 140 in autostrada – spesso si va più veloci, ma i controlli sono reali.",
      "Figures for rigs. Car alone: up to 140 on motorways – people often drive faster, the checks are real nonetheless."
    ),
    bacPermille: 0.2,
    bacNote: l4(
      "0,2 ‰ – praktisch Nulltoleranz; ab 0,5 ‰ ist es eine Straftat.",
      "0,2 ‰ – quasiment tolérance zéro ; dès 0,5 ‰, c'est un délit.",
      "0,2 ‰ – praticamente tolleranza zero; da 0,5 ‰ è reato.",
      "0.2 ‰ – practically zero tolerance; from 0.5 ‰ it is a criminal offence."
    ),
    equipment: l4(
      "Warndreieck UND Feuerlöscher sind Pflicht – der Feuerlöscher auch im ausländischen Fahrzeug. Warnweste dringend empfohlen, Abblendlicht gilt rund um die Uhr.",
      "Triangle ET extincteur obligatoires – l'extincteur aussi dans les véhicules étrangers. Gilet fortement conseillé, feux de croisement en permanence.",
      "Triangolo ED estintore obbligatori – l'estintore anche nei veicoli esteri. Gilet fortemente consigliato, anabbaglianti sempre accesi.",
      "Warning triangle AND fire extinguisher are mandatory – the extinguisher in foreign vehicles too. Vest strongly recommended, dipped lights around the clock."
    ),
    zones: l4(
      "Die ersten Umweltzonen kommen: Warschau hat seit 2024 eine (alte Diesel bleiben draussen), Krakau zieht nach – vor der Stadtfahrt kurz die aktuelle Lage prüfen.",
      "Les premières zones environnementales arrivent : Varsovie en a une depuis 2024 (les vieux diesels restent dehors), Cracovie suit – vérifier la situation avant d'entrer en ville.",
      "Arrivano le prime zone ambientali: Varsavia ne ha una dal 2024 (i vecchi diesel restano fuori), Cracovia segue – verificare la situazione prima di entrare in città.",
      "The first low-emission zones are arriving: Warsaw has had one since 2024 (old diesels stay out), Kraków is following – check the current rules before driving into town."
    ),
    plug: l4(
      "Typ E (mit Erdungsstift in der Dose). Der Eurostecker passt; der Schweizer Dreipol-Stecker braucht einen Adapter.",
      "Type E (avec broche de terre dans la prise). L'europlug passe ; la fiche suisse à trois broches nécessite un adaptateur.",
      "Tipo E (con spinotto di terra nella presa). L'europlug passa; la spina svizzera a tre poli richiede un adattatore.",
      "Type E (with earth pin in the socket). Europlugs fit; the Swiss three-pin plug needs an adapter."
    ),
    tipping: l4(
      "Rund 10 % sind üblich. ACHTUNG Falle: Wer beim Bezahlen «danke» sagt, sagt «stimmt so» – das Rückgeld ist dann weg.",
      "Environ 10 % sont d'usage. ATTENTION au piège : dire « merci » en payant signifie « gardez la monnaie » – elle ne revient pas.",
      "Circa il 10 % è d'uso. ATTENZIONE alla trappola: dire «grazie» mentre si paga significa «tenga il resto» – il resto non torna.",
      "Around 10 % is customary. WATCH the trap: saying “thank you” while paying means “keep the change” – it won't come back."
    ),
    payment: l4(
      "Karte und Handy zahlen praktisch überall, die Einheimischen nutzen BLIK. Bezahlt wird in Złoty – Bargeld braucht es kaum noch, ein paar Scheine für Markt und Landkiosk reichen.",
      "Carte et téléphone paient pratiquement partout, les locaux utilisent BLIK. On paie en złoty – le liquide ne sert presque plus, quelques billets pour le marché et le kiosque suffisent.",
      "Carta e telefono pagano praticamente ovunque, i locali usano BLIK. Si paga in złoty – il contante serve ormai poco, poche banconote per mercato e chiosco bastano.",
      "Card and phone pay practically everywhere, locals use BLIK. You pay in złoty – cash is hardly needed any more, a few notes for the market and roadside kiosk suffice."
    ),
    twoWheels: l4(
      "Motorräder zahlen auf den Mautabschnitten den halben Tarif. Helmpflicht, Licht immer an; fürs Velo gibt es keine Helmpflicht.",
      "Les motos paient demi-tarif sur les tronçons à péage. Casque obligatoire, feux toujours allumés ; pas d'obligation de casque à vélo.",
      "Le moto pagano metà tariffa sui tratti a pedaggio. Casco obbligatorio, luci sempre accese; nessun obbligo di casco in bici.",
      "Motorbikes pay half the rate on toll sections. Helmet mandatory, lights always on; no bicycle helmet requirement."
    ),
    emergency: "112",
    emergencyNote: l4(
      "112 europaweit; 997 Polizei, 998 Feuerwehr, 999 Rettung.",
      "112 partout en Europe ; 997 police, 998 pompiers, 999 ambulance.",
      "112 in tutta Europa; 997 polizia, 998 pompieri, 999 ambulanza.",
      "112 across Europe; 997 police, 998 fire brigade, 999 ambulance."
    ),
    camping: l4(
      "Wildcampen ist grundsätzlich verboten – ABER: Im Programm «Zanocuj w lesie» erlauben viele Staatsforste das Zelt für ein, zwei Nächte (Karte online, Regeln beachten). Wohnmobile übernachten auf Plätzen oder bewachten Parkplätzen; an Ostsee und in Masuren ist das Netz dicht.",
      "Le camping sauvage est en principe interdit – MAIS : le programme « Zanocuj w lesie » permet la tente une ou deux nuits dans beaucoup de forêts d'État (carte en ligne, règles à respecter). Les camping-cars dorment sur les campings ou parkings gardés ; le réseau est dense sur la Baltique et en Mazurie.",
      "Il campeggio libero è in linea di massima vietato – MA: il programma «Zanocuj w lesie» permette la tenda per una o due notti in molte foreste statali (mappa online, regole da rispettare). I camper pernottano in campeggio o in parcheggi custoditi; sul Baltico e in Masuria la rete è fitta.",
      "Wild camping is banned in principle – BUT: the “Zanocuj w lesie” programme allows tents for a night or two in many state forests (map online, follow the rules). Motorhomes stay on campsites or guarded car parks; the network is dense on the Baltic and in Masuria."
    ),
    aliases: [
      "polen",
      "pologne",
      "polonia",
      "poland",
      "polska",
      "warschau",
      "warszawa",
      "varsovie",
      "varsavia",
      "krakau",
      "krakow",
      "cracovie",
      "cracovia",
      "danzig",
      "gdansk",
      "masuren",
      "mazury",
      "breslau",
      "wroclaw",
      "zakopane",
    ],
  },
  {
    code: "HU",
    flag: "🇭🇺",
    name: l4("Ungarn", "Hongrie", "Ungheria", "Hungary"),
    updated: "2026-08-09",
    toll: l4(
      "E-Vignette (e-Matrica) fürs Kennzeichen – nur digital, kein Kleber: online oder an der Tankstelle registrieren (10 Tage, Monat, Jahr; Personenwagen = Kategorie D1). Kameras kontrollieren; eine falsche Kategorie wird satt nachverrechnet, darum das Kennzeichen beim Kauf doppelt prüfen.",
      "E-vignette (e-Matrica) liée à la plaque – uniquement numérique, pas d'autocollant : enregistrement en ligne ou en station-service (10 jours, mois, année ; voiture = catégorie D1). Des caméras contrôlent ; une mauvaise catégorie est lourdement refacturée, donc vérifier deux fois la plaque à l'achat.",
      "E-vignetta (e-Matrica) legata alla targa – solo digitale, niente adesivo: registrazione online o al distributore (10 giorni, mese, anno; automobile = categoria D1). Le telecamere controllano; una categoria sbagliata viene rifatturata salata, quindi controllare due volte la targa all'acquisto.",
      "E-vignette (e-Matrica) tied to the plate – digital only, no sticker: register online or at petrol stations (10 days, month, year; car = category D1). Cameras check; a wrong category is billed heavily afterwards, so double-check the plate when buying."
    ),
    trailer: l4(
      "Hinter dem Personenwagen (D1) fährt der Anhänger ohne eigene Vignette; hinter schwereren Fahrzeugen (D2) braucht er die U-Vignette. Gespanne fahren höchstens 80.",
      "Derrière la voiture (D1), la remorque roule sans vignette propre ; derrière les véhicules plus lourds (D2), il lui faut la vignette U. Les attelages roulent à 80 au maximum.",
      "Dietro l'automobile (D1) il rimorchio viaggia senza vignetta propria; dietro i veicoli più pesanti (D2) serve la vignetta U. I traini viaggiano al massimo a 80.",
      "Behind a car (D1) the trailer travels without its own vignette; behind heavier vehicles (D2) it needs the U vignette. Rigs drive at 80 at most."
    ),
    speed: { motorway: 80, rural: 70, urban: 50 },
    speedNote: l4(
      "Angaben für Gespanne. Personenwagen allein: 130 auf der Autobahn, 90 ausserorts.",
      "Valeurs pour les attelages. Voiture seule : 130 sur autoroute, 90 hors localité.",
      "Valori per i traini. Automobile da sola: 130 in autostrada, 90 fuori dai centri.",
      "Figures for rigs. Car alone: 130 on motorways, 90 outside built-up areas."
    ),
    bacPermille: 0,
    bacNote: l4(
      "0,0 ‰ – absolute Nulltoleranz, ohne Ausnahme.",
      "0,0 ‰ – tolérance zéro absolue, sans exception.",
      "0,0 ‰ – tolleranza zero assoluta, senza eccezioni.",
      "0.0 ‰ – absolute zero tolerance, no exceptions."
    ),
    equipment: l4(
      "Warndreieck Pflicht; die Warnweste muss ausserorts anziehen, wer das Fahrzeug verlässt. Ausserorts gilt auch am Tag Lichtpflicht.",
      "Triangle obligatoire ; hors agglomération, le gilet doit être porté par qui quitte le véhicule. Hors agglomération, feux obligatoires même de jour.",
      "Triangolo obbligatorio; fuori dai centri il gilet va indossato da chi lascia il veicolo. Fuori dai centri le luci sono obbligatorie anche di giorno.",
      "Warning triangle mandatory; outside built-up areas the vest must be worn by anyone leaving the vehicle. Outside built-up areas lights are mandatory even by day."
    ),
    zones: l4(
      "Keine Umweltzonen für Personenwagen. Bei Smog-Alarm kann Budapest kurzfristig Fahrverbote nach Kennzeichen verhängen – kommt selten vor.",
      "Pas de zones environnementales pour les voitures. En cas d'alerte au smog, Budapest peut imposer des restrictions temporaires par plaque – c'est rare.",
      "Nessuna zona ambientale per le automobili. In caso di allarme smog Budapest può imporre divieti temporanei per targa – succede di rado.",
      "No low-emission zones for cars. During smog alerts Budapest can impose short-term plate-based bans – it rarely happens."
    ),
    plug: l4(
      "Typ F (Schuko). Der Eurostecker passt; der Schweizer Dreipol-Stecker braucht einen Adapter.",
      "Type F (Schuko). L'europlug passe ; la fiche suisse à trois broches nécessite un adaptateur.",
      "Tipo F (Schuko). L'europlug passa; la spina svizzera a tre poli richiede un adattatore.",
      "Type F (Schuko). Europlugs fit; the Swiss three-pin plug needs an adapter."
    ),
    tipping: l4(
      "10–15 % sind üblich – ABER: Viele Lokale setzen eine Servicegebühr («szervizdíj») von 12–15 % auf die Rechnung; steht sie drauf, ist kein Trinkgeld mehr nötig.",
      "10–15 % sont d'usage – MAIS : beaucoup d'établissements ajoutent des frais de service (« szervizdíj ») de 12–15 % à l'addition ; s'ils y figurent, plus besoin de pourboire.",
      "Il 10–15 % è d'uso – MA: molti locali aggiungono al conto una tassa di servizio («szervizdíj») del 12–15 %; se c'è, la mancia non serve più.",
      "10–15 % is customary – BUT: many places add a 12–15 % service charge (“szervizdíj”) to the bill; if it's on there, no tip is needed."
    ),
    payment: l4(
      "Karte weit verbreitet, auch kontaktlos. Bezahlt wird in Forint – Euro werden touristisch genommen, aber zu schlechtem Kurs; Trinkgeld am besten bar in Forint.",
      "Carte très répandue, aussi sans contact. On paie en forints – l'euro est accepté dans les zones touristiques, mais à mauvais taux ; le pourboire de préférence en liquide, en forints.",
      "Carta molto diffusa, anche contactless. Si paga in fiorini – l'euro è accettato nelle zone turistiche, ma a cambio sfavorevole; la mancia meglio in contanti, in fiorini.",
      "Card widely accepted, contactless too. You pay in forint – euros are taken in tourist spots at a poor rate; tip best in cash, in forint."
    ),
    twoWheels: l4(
      "Fürs Motorrad gibt es die günstigere D1M-Vignette. Helmpflicht, Licht immer an – und die Nulltoleranz beim Alkohol gilt auch hier.",
      "La moto bénéficie de la vignette D1M, moins chère. Casque obligatoire, feux toujours allumés – et la tolérance zéro pour l'alcool vaut ici aussi.",
      "Per la moto c'è la vignetta D1M, più economica. Casco obbligatorio, luci sempre accese – e la tolleranza zero per l'alcol vale anche qui.",
      "Motorbikes get the cheaper D1M vignette. Helmet mandatory, lights always on – and the zero alcohol limit applies here too."
    ),
    emergency: "112",
    emergencyNote: l4(
      "112 europaweit; 104 Rettung, 105 Feuerwehr, 107 Polizei.",
      "112 partout en Europe ; 104 ambulance, 105 pompiers, 107 police.",
      "112 in tutta Europa; 104 ambulanza, 105 pompieri, 107 polizia.",
      "112 across Europe; 104 ambulance, 105 fire brigade, 107 police."
    ),
    camping: l4(
      "Wildcampen und freies Übernachten im Fahrzeug sind verboten. Rund um den Balaton (Plattensee) ist das Platznetz dicht – im Hochsommer trotzdem reservieren.",
      "Le camping sauvage et la nuit libre en véhicule sont interdits. Autour du Balaton, le réseau de campings est dense – réserver quand même en plein été.",
      "Il campeggio libero e il pernottamento libero in veicolo sono vietati. Attorno al Balaton la rete di campeggi è fitta – in piena estate meglio comunque prenotare.",
      "Wild camping and free overnighting in the vehicle are banned. Around Lake Balaton the campsite network is dense – still book ahead in high summer."
    ),
    aliases: [
      "ungarn",
      "hongrie",
      "ungheria",
      "hungary",
      "magyarorszag",
      "budapest",
      "balaton",
      "plattensee",
      "puszta",
      "debrecen",
      "sopron",
      "esztergom",
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
