/**
 * Camping-Knigge (#508): die ungeschriebenen (und geschriebenen) Regeln
 * des Zusammenlebens auf dem Platz – Ruhezeiten, Grauwasser, Hunde,
 * Parzellen-Grenzen. Nachschlage-Material, offline.
 */
import { l4, type L4 } from "@shared/i18n";

export interface EtiquetteEntry {
  id: string;
  title: L4;
  text: L4;
}

export const etiquetteRules: EtiquetteEntry[] = [
  {
    id: "ruhezeiten",
    title: l4(
      "Ruhezeiten ernst nehmen",
      "Respecter les heures de repos",
      "Rispettare gli orari di riposo",
      "Take quiet hours seriously"
    ),
    text: l4(
      "Meist 22–7 Uhr und über Mittag: keine Musik, kein Autoverschieben, leise Stimmen – Zeltwände sind keine Wände.",
      "Généralement 22 h–7 h et à midi : pas de musique, pas de déplacement de voiture, voix basses – une toile de tente n'est pas un mur.",
      "Di solito 22–7 e a mezzogiorno: niente musica, niente spostamenti d'auto, voci basse – le pareti della tenda non sono muri.",
      "Usually 10 pm–7 am and over lunch: no music, no moving cars, low voices – tent walls are not walls."
    ),
  },
  {
    id: "parzelle",
    title: l4(
      "Die Parzelle ist Privatsphäre",
      "L'emplacement, c'est l'intimité",
      "La piazzola è privacy",
      "The pitch is private space"
    ),
    text: l4(
      "Nicht über fremde Parzellen abkürzen – auch wenn es nur Gras ist. Der Weg aussen herum kostet zwanzig Sekunden.",
      "Ne pas couper à travers les emplacements des autres – même si ce n'est que de l'herbe. Le détour coûte vingt secondes.",
      "Non tagliare attraverso le piazzole altrui – anche se è solo erba. Il giro esterno costa venti secondi.",
      "Don't cut across other people's pitches – even if it's just grass. Walking around costs twenty seconds."
    ),
  },
  {
    id: "grauwasser",
    title: l4(
      "Grauwasser nur in den Ausguss",
      "Eaux grises uniquement à la vidange",
      "Acque grigie solo nello scarico",
      "Grey water only into the drain"
    ),
    text: l4(
      "Abwasch- und Duschwasser gehört in den Ausguss, nie in die Wiese oder den Bach – Seifenreste schaden Boden und Gewässern.",
      "L'eau de vaisselle et de douche va à la vidange, jamais dans le pré ou le ruisseau – les restes de savon nuisent au sol et aux eaux.",
      "L'acqua di stoviglie e doccia va nello scarico, mai nel prato o nel ruscello – i residui di sapone danneggiano suolo e acque.",
      "Dishwater and shower water goes into the drain, never onto the meadow or into the stream – soap residues harm soil and waters."
    ),
  },
  {
    id: "chemiewc",
    title: l4(
      "Chemie-WC an der Entsorgungsstation",
      "WC chimique à la station de vidange",
      "WC chimico alla stazione di scarico",
      "Chemical toilet at the disposal point"
    ),
    text: l4(
      "Kassetten nur an der gekennzeichneten Entsorgungsstation leeren – nie im normalen WC, nie im Schacht.",
      "Vider les cassettes uniquement à la station de vidange signalée – jamais dans les WC normaux, jamais dans une bouche d'égout.",
      "Svuotare le cassette solo alla stazione di scarico segnalata – mai nel WC normale, mai nel tombino.",
      "Empty cassettes only at the marked disposal point – never in a normal toilet, never down a drain."
    ),
  },
  {
    id: "hunde",
    title: l4(
      "Hunde an der Leine",
      "Chiens en laisse",
      "Cani al guinzaglio",
      "Dogs on the lead"
    ),
    text: l4(
      "Auf dem Platz gilt fast überall Leinenpflicht; Versäubern ausserhalb, Säckli immer. Nicht jedes Kind (und nicht jeder Gast) mag Hunde.",
      "La laisse est presque partout obligatoire sur le terrain ; besoins à l'extérieur, sachet toujours. Tous les enfants (et tous les hôtes) n'aiment pas les chiens.",
      "In campeggio il guinzaglio è quasi ovunque obbligatorio; bisogni fuori, sacchetto sempre. Non tutti i bambini (e non tutti gli ospiti) amano i cani.",
      "Leads are required almost everywhere on site; toileting outside, bag always. Not every child (or guest) is fond of dogs."
    ),
  },
  {
    id: "sanitaer",
    title: l4(
      "Sanitär sauber hinterlassen",
      "Laisser les sanitaires propres",
      "Lasciare i sanitari puliti",
      "Leave the sanitary block clean"
    ),
    text: l4(
      "Dusche und Lavabo so verlassen, wie man sie antreffen möchte; Haare mitnehmen, kurz nachspülen – die nächste Person dankt.",
      "Laisser douche et lavabo comme on aimerait les trouver ; emporter les cheveux, rincer brièvement – la personne suivante remercie.",
      "Lasciare doccia e lavandino come si vorrebbe trovarli; portare via i capelli, sciacquare – la persona dopo ringrazia.",
      "Leave shower and sink as you'd wish to find them; take your hair with you, rinse briefly – the next person will thank you."
    ),
  },
  {
    id: "abfall",
    title: l4(
      "Abfall trennen und mitnehmen",
      "Trier et emporter les déchets",
      "Differenziare e portare via i rifiuti",
      "Sort and take your rubbish"
    ),
    text: l4(
      "Trennung des Platzes respektieren; Glas nicht abends in den Container (Lärm). In der Natur gilt: Alles wieder mitnehmen.",
      "Respecter le tri du camping ; pas de verre au conteneur le soir (bruit). Dans la nature : tout remporter.",
      "Rispettare la raccolta del campeggio; niente vetro nel container di sera (rumore). Nella natura: riportare tutto a casa.",
      "Respect the site's sorting; no glass into the container at night (noise). In the wild: pack everything out."
    ),
  },
  {
    id: "strom",
    title: l4(
      "Strom & Wasser sind geteilt",
      "Électricité & eau sont partagées",
      "Elettricità & acqua sono condivise",
      "Power & water are shared"
    ),
    text: l4(
      "Am Stromkasten nichts umstecken, das nicht das eigene ist; Wasserhahn nicht für die Autowäsche – die Ressourcen teilen sich alle.",
      "Ne rien débrancher d'autrui au coffret électrique ; le robinet n'est pas fait pour laver la voiture – les ressources sont partagées.",
      "Non staccare nulla di altrui alla colonnina elettrica; il rubinetto non serve per lavare l'auto – le risorse sono di tutti.",
      "Don't unplug anyone else at the power box; the tap is not for washing the car – resources are shared by all."
    ),
  },
  {
    id: "ankunft",
    title: l4(
      "Spät ankommen, früh abreisen – leise",
      "Arriver tard, partir tôt – en silence",
      "Arrivare tardi, partire presto – in silenzio",
      "Arriving late, leaving early – quietly"
    ),
    text: l4(
      "Nach 22 Uhr ohne Motor zur Parzelle (Nachtparkplatz nutzen), Heringe erst am Morgen einschlagen, Abbau ohne Türenschlagen.",
      "Après 22 h, rejoindre l'emplacement sans moteur (utiliser le parking de nuit), planter les sardines le matin, démonter sans claquer de portes.",
      "Dopo le 22 raggiungere la piazzola senza motore (usare il parcheggio notturno), piantare i picchetti al mattino, smontare senza sbattere porte.",
      "After 10 pm reach your pitch without the engine (use the night car park), hammer pegs in the morning, pack up without slamming doors."
    ),
  },
  {
    id: "gruss",
    title: l4(
      "Grüssen kostet nichts",
      "Saluer ne coûte rien",
      "Salutare non costa nulla",
      "A greeting costs nothing"
    ),
    text: l4(
      "Ein Gruss beim Vorbeigehen und Hilfe beim Aufstellen im Wind – Campingplätze leben von genau dieser Nachbarschaft.",
      "Un bonjour en passant et un coup de main pour monter la tente sous le vent – les campings vivent exactement de ce voisinage.",
      "Un saluto passando e una mano per montare la tenda col vento – i campeggi vivono esattamente di questo vicinato.",
      "A hello in passing and a hand pitching in the wind – campsites live on exactly this kind of neighbourliness."
    ),
  },
];
