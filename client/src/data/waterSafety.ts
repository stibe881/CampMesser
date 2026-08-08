/**
 * Baderegeln & Strandflaggen (#473): die sechs SLRG-Baderegeln und die
 * international üblichen Strandflaggen. Nachschlage-Material, offline –
 * am Strand liest man es im Zweifel ohne Netz.
 *
 * Die Baderegeln sind sinngemäss nach den sechs Baderegeln der
 * Schweizerischen Lebensrettungs-Gesellschaft SLRG (slrg.ch) formuliert;
 * der Originalwortlaut gehört der SLRG. Die Flaggen folgen der Praxis
 * der ILS-Rettungsdienste – einzelne Länder weichen ab, darum steht der
 * Hinweis dazu, statt eine Weltregel zu behaupten.
 */
import { l4, type L4 } from "@shared/i18n";

export interface WaterSafetyEntry {
  id: string;
  title: L4;
  text: L4;
}

export interface BeachFlagEntry extends WaterSafetyEntry {
  /** Tailwind-Klassen für das Flaggen-Feld – zweifarbig per Gradient. */
  swatch: string;
}

/** Die sechs SLRG-Baderegeln, sinngemäss zusammengefasst. */
export const bathingRules: WaterSafetyEntry[] = [
  {
    id: "kinder",
    title: l4(
      "Kleine Kinder nie unbeaufsichtigt lassen",
      "Ne jamais laisser les petits enfants sans surveillance",
      "Mai lasciare i bambini piccoli incustoditi",
      "Never leave small children unattended"
    ),
    text: l4(
      "Kinder in Wassernähe immer in Griffnähe behalten – ertrinken geht lautlos und in Sekunden, auch im knietiefen Wasser.",
      "Garde toujours les enfants à portée de main près de l'eau – une noyade est silencieuse et prend quelques secondes, même dans l'eau jusqu'aux genoux.",
      "Tieni sempre i bambini a portata di mano vicino all'acqua – si annega in silenzio e in pochi secondi, anche con l'acqua alle ginocchia.",
      "Keep children within arm's reach near water – drowning is silent and takes seconds, even in knee-deep water."
    ),
  },
  {
    id: "alkohol",
    title: l4(
      "Nie alkoholisiert ins Wasser",
      "Jamais dans l'eau sous alcool",
      "Mai in acqua sotto alcol",
      "Never swim under the influence"
    ),
    text: l4(
      "Nie alkoholisiert oder unter Drogen ins Wasser – und nicht mit ganz vollem oder ganz leerem Magen schwimmen.",
      "Ne va jamais dans l'eau sous l'effet de l'alcool ou de drogues – et ne nage pas l'estomac trop plein ou complètement vide.",
      "Non entrare mai in acqua sotto l'effetto di alcol o droghe – e non nuotare a stomaco troppo pieno o completamente vuoto.",
      "Never enter the water under the influence of alcohol or drugs – and do not swim on a completely full or empty stomach."
    ),
  },
  {
    id: "abkuehlen",
    title: l4(
      "Nie überhitzt hineinspringen",
      "Ne jamais sauter dans l'eau en surchauffe",
      "Mai tuffarsi surriscaldati",
      "Never jump in when overheated"
    ),
    text: l4(
      "Erhitzt nie ins Wasser springen: erst abkühlen und den Körper ans Wasser gewöhnen – der Kälteschock kann den Kreislauf überfordern.",
      "Ne saute jamais dans l'eau en étant en surchauffe : rafraîchis-toi d'abord et habitue ton corps à l'eau – le choc thermique peut submerger la circulation.",
      "Non tuffarti mai accaldato: prima rinfrescati e abitua il corpo all'acqua – lo shock termico può sovraccaricare la circolazione.",
      "Never jump into the water when overheated: cool down first and let your body adjust – cold shock can overwhelm your circulation."
    ),
  },
  {
    id: "springen",
    title: l4(
      "Nicht in trübe oder unbekannte Gewässer springen",
      "Ne pas plonger dans une eau trouble ou inconnue",
      "Non tuffarsi in acque torbide o sconosciute",
      "Do not jump into murky or unknown water"
    ),
    text: l4(
      "Unbekanntes kann verborgen sein – Felsen, Äste, Untiefen. Erst die Tiefe prüfen, dann springen; im Zweifel gar nicht.",
      "L'inconnu peut se cacher sous la surface – rochers, branches, hauts-fonds. Vérifie d'abord la profondeur, puis saute ; dans le doute, pas du tout.",
      "L'ignoto può nascondersi sotto la superficie – rocce, rami, bassifondi. Prima verifica la profondità, poi tuffati; nel dubbio, non farlo.",
      "The unknown may lurk below – rocks, branches, shallows. Check the depth first, then jump; when in doubt, don't."
    ),
  },
  {
    id: "luftmatratze",
    title: l4(
      "Luftmatratzen gehören nicht ins tiefe Wasser",
      "Les matelas pneumatiques ne vont pas en eau profonde",
      "I materassini non vanno in acqua profonda",
      "Air mattresses do not belong in deep water"
    ),
    text: l4(
      "Luftmatratze und Schwimmring bieten keine Sicherheit: Ein Windstoss treibt sie schneller ab, als du schwimmen kannst.",
      "Matelas pneumatique et bouée n'offrent aucune sécurité : une rafale les emporte plus vite que tu ne peux nager.",
      "Materassino e ciambella non offrono sicurezza: una raffica li porta via più in fretta di quanto tu possa nuotare.",
      "An air mattress or ring offers no safety: one gust drifts it away faster than you can swim."
    ),
  },
  {
    id: "allein",
    title: l4(
      "Lange Strecken nie allein schwimmen",
      "Ne jamais nager de longues distances seul",
      "Mai nuotare da soli su lunghe distanze",
      "Never swim long distances alone"
    ),
    text: l4(
      "Auch der besttrainierte Körper kann eine Schwäche erleiden – lange Strecken nur begleitet (Boot oder Mitschwimmende).",
      "Même le corps le mieux entraîné peut avoir une défaillance – les longues distances seulement accompagné (bateau ou autre nageur).",
      "Anche il corpo più allenato può avere un malore – lunghe distanze solo accompagnati (barca o altri nuotatori).",
      "Even the fittest body can fail – swim long distances only with company (a boat or fellow swimmers)."
    ),
  },
];

/** Die international üblichen Strandflaggen der Rettungsdienste. */
export const beachFlags: BeachFlagEntry[] = [
  {
    id: "rot-gelb",
    swatch: "bg-gradient-to-b from-red-600 to-yellow-400",
    title: l4(
      "Rot-Gelb: bewachter Badebereich",
      "Rouge-jaune : zone de baignade surveillée",
      "Rosso-giallo: zona di balneazione sorvegliata",
      "Red-yellow: lifeguarded swimming area"
    ),
    text: l4(
      "Zwischen zwei rot-gelben Flaggen wachen Rettungsschwimmer. Schwimme in diesem Bereich – ausserhalb sieht dich niemand.",
      "Entre deux drapeaux rouge-jaune, des sauveteurs surveillent. Nage dans cette zone – en dehors, personne ne te voit.",
      "Tra due bandiere rosso-gialle vigilano i bagnini. Nuota in questa zona – fuori nessuno ti vede.",
      "Lifeguards watch between two red-yellow flags. Swim inside this area – outside it, no one sees you."
    ),
  },
  {
    id: "gelb",
    swatch: "bg-yellow-400",
    title: l4(
      "Gelb: erhöhte Vorsicht",
      "Jaune : prudence accrue",
      "Giallo: prudenza accresciuta",
      "Yellow: increased caution"
    ),
    text: l4(
      "Wellen oder Strömung – nur geübte Schwimmerinnen und Schwimmer, Kinder an der Hand behalten.",
      "Vagues ou courant – seulement pour les nageurs expérimentés, garde les enfants par la main.",
      "Onde o corrente – solo nuotatori esperti, tieni i bambini per mano.",
      "Waves or currents – experienced swimmers only, keep children by the hand."
    ),
  },
  {
    id: "rot",
    swatch: "bg-red-600",
    title: l4(
      "Rot: Baden verboten",
      "Rouge : baignade interdite",
      "Rosso: divieto di balneazione",
      "Red: no swimming"
    ),
    text: l4(
      "Lebensgefahr – Brandung, Strömung oder anderes. Rot heisst draussen bleiben, auch für Geübte.",
      "Danger de mort – ressac, courant ou autre. Rouge veut dire rester dehors, même pour les nageurs aguerris.",
      "Pericolo di vita – risacca, corrente o altro. Rosso significa restare fuori, anche per i più esperti.",
      "Danger to life – surf, currents or worse. Red means stay out, even for strong swimmers."
    ),
  },
  {
    id: "schwarz-weiss",
    swatch: "bg-gradient-to-b from-zinc-800 to-zinc-100",
    title: l4(
      "Schwarz-Weiss: Wassersport-Zone",
      "Noir-blanc : zone de sports nautiques",
      "Bianco-nero: zona per sport acquatici",
      "Black-white: watersports zone"
    ),
    text: l4(
      "Bereich für Surfbretter, Kites und Boote – hier wird nicht geschwommen, die Bretter sind schneller als du.",
      "Zone réservée aux planches, kites et bateaux – on n'y nage pas, les planches sont plus rapides que toi.",
      "Zona riservata a tavole, kite e barche – qui non si nuota, le tavole sono più veloci di te.",
      "Area for boards, kites and boats – no swimming here, the boards are faster than you."
    ),
  },
  {
    id: "violett",
    swatch: "bg-purple-600",
    title: l4(
      "Violett: gefährliche Meerestiere",
      "Violet : animaux marins dangereux",
      "Viola: animali marini pericolosi",
      "Purple: dangerous marine life"
    ),
    text: l4(
      "Quallen oder andere gefährliche Meerestiere gemeldet – meist zusätzlich zu Gelb oder Rot gehisst; nicht in allen Ländern üblich.",
      "Méduses ou autres animaux marins dangereux signalés – souvent hissé en plus du jaune ou du rouge ; pas courant dans tous les pays.",
      "Segnalate meduse o altri animali marini pericolosi – di solito issata in aggiunta a giallo o rosso; non in uso in tutti i Paesi.",
      "Jellyfish or other dangerous marine life reported – usually flown in addition to yellow or red; not used in every country."
    ),
  },
];
