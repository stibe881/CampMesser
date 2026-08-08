/**
 * Wintersport-Wissen (#472): die 10 FIS-Verhaltensregeln für Piste und
 * Loipe plus Lawinen-Grundwissen für alle, die neben der Piste unterwegs
 * sind. Reines Nachschlage-Material, offline verfügbar – auf dem Sessellift
 * hat es selten Netz.
 *
 * Die FIS-Regeln sind hier sinngemäss und knapp wiedergegeben – der
 * Wortlaut gehört der FIS; wer den Originaltext braucht, findet ihn auf
 * fis-ski.com. Das Lawinen-Wissen ersetzt keinen Lawinenkurs: Es steht
 * bewusst ein Hinweis dabei, wo der Kurs anfängt und die App aufhört.
 */
import { l4, type L4 } from "@shared/i18n";

export interface WinterKnowledgeEntry {
  id: string;
  title: L4;
  text: L4;
}

/** Die 10 FIS-Verhaltensregeln, sinngemäss zusammengefasst. */
export const fisRules: WinterKnowledgeEntry[] = [
  {
    id: "ruecksicht",
    title: l4(
      "Rücksicht auf die anderen",
      "Respect d'autrui",
      "Rispetto per gli altri",
      "Respect for others"
    ),
    text: l4(
      "Verhalte dich so, dass du niemanden gefährdest oder schädigst – auch nicht durch mangelhaftes Material.",
      "Comporte-toi de manière à ne mettre personne en danger et à ne causer de tort à personne – y compris par du matériel défectueux.",
      "Comportati in modo da non mettere in pericolo né danneggiare nessuno – nemmeno con materiale difettoso.",
      "Behave in a way that endangers or harms no one – including through faulty equipment."
    ),
  },
  {
    id: "geschwindigkeit",
    title: l4(
      "Geschwindigkeit und Fahrweise",
      "Maîtrise de la vitesse",
      "Padronanza della velocità",
      "Control of speed"
    ),
    text: l4(
      "Fahre auf Sicht und passe Tempo und Fahrweise deinem Können, dem Gelände, dem Schnee, dem Wetter und der Menge der Leute an.",
      "Skie à vue : adapte ta vitesse et ta manière de skier à ton niveau, au terrain, à la neige, à la météo et à l'affluence.",
      "Scia a vista: adatta velocità e condotta alle tue capacità, al terreno, alla neve, al meteo e all'affollamento.",
      "Ski in control: match your speed and style to your ability, the terrain, snow, weather and how busy the slope is."
    ),
  },
  {
    id: "fahrspur",
    title: l4(
      "Wahl der Fahrspur",
      "Choix de la trajectoire",
      "Scelta della traiettoria",
      "Choice of route"
    ),
    text: l4(
      "Wer von hinten kommt, wählt die Spur so, dass niemand vor ihm gefährdet wird – die Person vorne hat Vortritt.",
      "Celui qui vient de l'amont choisit sa trajectoire de façon à ne pas mettre en danger les personnes en aval – la personne devant a la priorité.",
      "Chi arriva da monte sceglie la traiettoria in modo da non mettere in pericolo chi sta davanti – chi è a valle ha la precedenza.",
      "The skier coming from behind chooses a line that does not endanger anyone ahead – the person in front has priority."
    ),
  },
  {
    id: "ueberholen",
    title: l4("Überholen", "Dépassement", "Sorpasso", "Overtaking"),
    text: l4(
      "Überholen ist überall erlaubt – aber nur mit so viel Abstand, dass die überholte Person genug Raum für alle ihre Bewegungen behält.",
      "On peut dépasser partout – mais seulement avec assez de distance pour laisser à la personne dépassée l'espace de tous ses mouvements.",
      "Si può sorpassare ovunque – ma solo con una distanza tale da lasciare alla persona sorpassata lo spazio per ogni suo movimento.",
      "You may overtake anywhere – but only leaving enough room for the person you pass to make any movement."
    ),
  },
  {
    id: "einfahren",
    title: l4(
      "Einfahren und Anfahren",
      "S'engager et repartir",
      "Immissione e ripartenza",
      "Entering and starting"
    ),
    text: l4(
      "Vor dem Einfahren in eine Piste, dem Anfahren nach einem Halt oder dem Aufwärtsschwingen: nach oben UND unten schauen, ob es frei ist.",
      "Avant de t'engager sur une piste, de repartir après un arrêt ou de remonter en virage : regarde vers l'amont ET vers l'aval que la voie est libre.",
      "Prima di immetterti su una pista, ripartire dopo una sosta o risalire in curva: guarda a monte E a valle che sia libero.",
      "Before entering a run, setting off again or turning uphill, look up AND down the slope to make sure it is clear."
    ),
  },
  {
    id: "anhalten",
    title: l4("Anhalten", "Stationnement", "Sosta", "Stopping"),
    text: l4(
      "Halte nicht an engen oder unübersichtlichen Stellen. Nach einem Sturz solche Stellen so schnell wie möglich freimachen.",
      "Évite de t'arrêter dans les passages étroits ou sans visibilité. Après une chute, libère ces endroits au plus vite.",
      "Evita di fermarti nei passaggi stretti o senza visibilità. Dopo una caduta, libera al più presto questi punti.",
      "Do not stop at narrow spots or where visibility is poor. After a fall, clear such spots as quickly as you can."
    ),
  },
  {
    id: "aufstieg",
    title: l4(
      "Aufstieg und Abstieg zu Fuss",
      "Montée et descente à pied",
      "Salita e discesa a piedi",
      "Climbing and descending on foot"
    ),
    text: l4(
      "Wer aufsteigt oder zu Fuss absteigt, benutzt den Pistenrand – in der Mitte rechnet niemand mit dir.",
      "Qui monte ou descend à pied longe le bord de la piste – au milieu, personne ne s'attend à te trouver.",
      "Chi sale o scende a piedi usa il bordo della pista – al centro nessuno si aspetta di trovarti.",
      "If you climb or walk down, keep to the edge of the run – no one expects you in the middle."
    ),
  },
  {
    id: "zeichen",
    title: l4(
      "Zeichen beachten",
      "Respect de la signalisation",
      "Rispetto della segnaletica",
      "Respect the signs"
    ),
    text: l4(
      "Markierungen und Signale gelten: Gesperrt heisst gesperrt – meist wegen Lawinensprengung, Pistenmaschinen mit Seilwinde oder fehlender Rettung.",
      "Le balisage et la signalisation font foi : fermé veut dire fermé – souvent à cause de minages, de dameuses à treuil ou de l'absence de secours.",
      "Segnaletica e cartelli valgono: chiuso significa chiuso – spesso per distacchi artificiali, gatti delle nevi con verricello o soccorso assente.",
      "Markings and signs are binding: closed means closed – often because of avalanche blasting, winch groomers or no rescue cover."
    ),
  },
  {
    id: "hilfeleistung",
    title: l4("Hilfeleistung", "Assistance", "Assistenza", "Assistance"),
    text: l4(
      "Bei Unfällen bist du zur Hilfe verpflichtet: absichern (Ski gekreuzt oberhalb), Rettung alarmieren, bei der verletzten Person bleiben.",
      "En cas d'accident, tu es tenu de porter assistance : sécurise (skis croisés en amont), alerte les secours, reste auprès de la personne blessée.",
      "In caso di incidente sei tenuto a prestare soccorso: metti in sicurezza (sci incrociati a monte), allerta i soccorsi, resta con la persona ferita.",
      "In an accident you are obliged to help: secure the site (crossed skis above), alert rescue, stay with the injured person."
    ),
  },
  {
    id: "ausweispflicht",
    title: l4(
      "Ausweispflicht",
      "Identification",
      "Obbligo di identificarsi",
      "Identification"
    ),
    text: l4(
      "Nach einem Unfall müssen alle Beteiligten und Zeugen ihre Personalien angeben – wie im Strassenverkehr.",
      "Après un accident, toutes les personnes impliquées et les témoins doivent décliner leur identité – comme sur la route.",
      "Dopo un incidente, tutte le persone coinvolte e i testimoni devono fornire le proprie generalità – come nella circolazione stradale.",
      "After an accident, everyone involved and all witnesses must give their personal details – just like in road traffic."
    ),
  },
];

/** Lawinen-Grundwissen – ersetzt keinen Kurs, ordnet aber die Begriffe. */
export const avalancheBasics: WinterKnowledgeEntry[] = [
  {
    id: "gefahrenstufen",
    title: l4(
      "Die 5 Gefahrenstufen verstehen",
      "Comprendre les 5 degrés de danger",
      "Capire i 5 gradi di pericolo",
      "Understanding the 5 danger levels"
    ),
    text: l4(
      "Europaweit gilt die Skala 1 (gering) bis 5 (sehr gross). Die Stufen wachsen nicht linear: Stufe 3 «erheblich» ist bereits eine kritische Situation – bei ihr passieren die meisten tödlichen Unfälle, weil sie harmloser klingt, als sie ist.",
      "Toute l'Europe utilise l'échelle de 1 (faible) à 5 (très fort). Les degrés ne croissent pas linéairement : le degré 3 « marqué » est déjà une situation critique – c'est là que se produisent la plupart des accidents mortels, car il sonne plus anodin qu'il ne l'est.",
      "In tutta Europa vale la scala da 1 (debole) a 5 (molto forte). I gradi non crescono in modo lineare: il grado 3 «marcato» è già una situazione critica – è lì che avviene la maggior parte degli incidenti mortali, perché suona più innocuo di quanto sia.",
      "All of Europe uses the scale from 1 (low) to 5 (very high). The levels do not grow linearly: level 3 “considerable” is already a critical situation – most fatal accidents happen there, because it sounds more harmless than it is."
    ),
  },
  {
    id: "bulletin",
    title: l4(
      "Lawinenbulletin lesen",
      "Lire le bulletin d'avalanches",
      "Leggere il bollettino valanghe",
      "Reading the avalanche bulletin"
    ),
    text: l4(
      "Vor jedem Tag abseits markierter Pisten das Bulletin lesen (Schweiz: SLF auf whiterisk.ch oder in der App). Entscheidend sind nicht nur die Stufe, sondern Höhenlage und Exposition der gefährlichen Hänge – «erheblich oberhalb 2200 m in Nordhängen» ist eine ganz andere Ansage als eine nackte Zahl.",
      "Avant chaque journée hors des pistes balisées, lis le bulletin (Suisse : SLF sur whiterisk.ch ou dans l'app). Le degré seul ne suffit pas : l'altitude et l'exposition des pentes dangereuses comptent – « marqué au-dessus de 2200 m en versant nord » dit bien plus qu'un simple chiffre.",
      "Prima di ogni giornata fuori dalle piste segnalate leggi il bollettino (Svizzera: SLF su whiterisk.ch o nell'app). Non conta solo il grado, ma quota ed esposizione dei pendii pericolosi – «marcato sopra i 2200 m nei versanti nord» dice molto più di un numero da solo.",
      "Before any day away from marked runs, read the bulletin (Switzerland: SLF on whiterisk.ch or in the app). The level alone is not enough – the altitude and aspect of the dangerous slopes matter: “considerable above 2200 m on north-facing slopes” says far more than a bare number."
    ),
  },
  {
    id: "notfallausruestung",
    title: l4(
      "Notfallausrüstung: LVS, Sonde, Schaufel",
      "Équipement d'urgence : DVA, sonde, pelle",
      "Attrezzatura d'emergenza: ARTVA, sonda, pala",
      "Emergency gear: transceiver, probe, shovel"
    ),
    text: l4(
      "Abseits der Piste gehören Lawinenverschütteten-Suchgerät (gesendet am Körper), Sonde und Schaufel zu JEDER Person – eine Schaufel pro Gruppe rettet niemanden. Die Ausrüstung nützt nur geübt: Suche regelmässig trainieren, sonst ist sie in den entscheidenden 15 Minuten zu langsam.",
      "Hors-piste, chaque personne porte un détecteur de victimes d'avalanche (émettant, sur le corps), une sonde et une pelle – une seule pelle par groupe ne sauve personne. Ce matériel n'aide que si l'on s'exerce : entraîne la recherche régulièrement, sinon elle est trop lente dans les 15 minutes décisives.",
      "Fuori pista ogni persona porta ARTVA (in trasmissione, sul corpo), sonda e pala – una sola pala per gruppo non salva nessuno. L'attrezzatura serve solo se allenata: esercita la ricerca regolarmente, altrimenti nei 15 minuti decisivi è troppo lenta.",
      "Off-piste, every person carries a transceiver (transmitting, worn on the body), probe and shovel – one shovel per group saves no one. The gear only helps if practised: train searching regularly, or it will be too slow in the decisive 15 minutes."
    ),
  },
  {
    id: "gelaende",
    title: l4(
      "Gelände lesen: Steilheit, Triebschnee, Neuschnee",
      "Lire le terrain : pente, neige soufflée, neige fraîche",
      "Leggere il terreno: pendenza, neve ventata, neve fresca",
      "Reading terrain: steepness, wind slab, fresh snow"
    ),
    text: l4(
      "Die meisten Schneebrettlawinen lösen sich in Hängen ab etwa 30 Grad Neigung. Alarmzeichen sind frischer Triebschnee (Wind + Schnee), viel Neuschnee, Wumm-Geräusche und frische Risse im Schneebrett. In der Gruppe Abstände einhalten und Steilhänge einzeln befahren.",
      "La plupart des plaques se déclenchent dans des pentes d'environ 30 degrés et plus. Signaux d'alarme : neige soufflée fraîche (vent + neige), forte neige fraîche, bruits sourds « woum » et fissures dans le manteau. En groupe, garde des distances et descends les pentes raides un par un.",
      "La maggior parte delle valanghe a lastroni si stacca su pendii da circa 30 gradi in su. Segnali d'allarme: neve ventata fresca (vento + neve), molta neve fresca, rumori sordi «wum» e crepe fresche nel manto. In gruppo mantieni le distanze e scendi i pendii ripidi uno alla volta.",
      "Most slab avalanches release on slopes of roughly 30 degrees and steeper. Warning signs are fresh wind slab (wind + snow), lots of new snow, “whumpf” sounds and fresh cracks in the snowpack. In a group, keep spacing and ride steep slopes one at a time."
    ),
  },
  {
    id: "notfall",
    title: l4(
      "Im Ernstfall",
      "En cas d'avalanche",
      "In caso di valanga",
      "If it happens"
    ),
    text: l4(
      "Beobachte die verschwindende Person bis zum letzten Punkt. Alarmiere sofort (Schweiz: Rega 1414, sonst 112) – und beginne SOFORT mit der LVS-Suche, statt auf die Rettung zu warten: In den ersten 15 Minuten überleben die meisten Verschütteten, danach sinkt die Kurve steil.",
      "Suis des yeux la personne emportée jusqu'au dernier point visible. Alerte immédiatement (Suisse : Rega 1414, sinon 112) – et commence TOUT DE SUITE la recherche DVA au lieu d'attendre les secours : dans les 15 premières minutes, la plupart des ensevelis survivent, ensuite la courbe chute brutalement.",
      "Segui con lo sguardo la persona travolta fino all'ultimo punto visibile. Dai subito l'allarme (Svizzera: Rega 1414, altrimenti 112) – e inizia SUBITO la ricerca ARTVA invece di aspettare i soccorsi: nei primi 15 minuti la maggior parte dei sepolti sopravvive, poi la curva crolla.",
      "Watch the person being swept away until the last seen point. Alert rescue immediately (Switzerland: Rega 1414, otherwise 112) – and start the transceiver search AT ONCE instead of waiting for rescue: most buried people survive the first 15 minutes, after that the curve drops steeply."
    ),
  },
];
