/**
 * SOS- & Notfall-Dashboard: fixe Notfallnummern und Notruf-Anleitung.
 * Bezeichnungen und Beschreibungen sind vollständig übersetzt (L4);
 * die Notrufnummern selbst und Eigennamen (Rega, Tox Info) bleiben gleich.
 */
import { l4, type L4 } from "@shared/i18n";

export interface EmergencyNumber {
  id: string;
  label: L4;
  number: string;
  description: L4;
  primary?: boolean;
}

export const emergencyNumbers: EmergencyNumber[] = [
  {
    id: "rega",
    label: l4("Rega 1414", "Rega 1414", "Rega 1414", "Rega 1414"),
    number: "1414",
    description: l4(
      "Schweizerische Rettungsflugwacht – Bergrettung und medizinische Notfälle aus der Luft.",
      "Garde aérienne suisse de sauvetage – sauvetage en montagne et urgences médicales par les airs.",
      "Guardia aerea svizzera di soccorso – soccorso in montagna e urgenze mediche dall'alto.",
      "Swiss air rescue – mountain rescue and medical emergencies from the air."
    ),
    primary: true,
  },
  {
    id: "notruf",
    label: l4(
      "Notruf 112",
      "Appel d'urgence 112",
      "Numero d'emergenza 112",
      "Emergency call 112"
    ),
    number: "112",
    description: l4(
      "Europäischer Notruf – funktioniert in der ganzen EU und der Schweiz, auch ohne SIM-Empfang des eigenen Anbieters.",
      "Numéro d'urgence européen – fonctionne dans toute l'UE et en Suisse, même sans réseau de ton propre opérateur.",
      "Numero d'emergenza europeo – funziona in tutta l'UE e in Svizzera, anche senza copertura del tuo operatore.",
      "European emergency number – works throughout the EU and Switzerland, even without coverage from your own provider."
    ),
    primary: true,
  },
  {
    id: "polizei",
    label: l4("Polizei 117", "Police 117", "Polizia 117", "Police 117"),
    number: "117",
    description: l4(
      "Polizeinotruf Schweiz.",
      "Appel d'urgence de la police suisse.",
      "Numero d'emergenza della polizia svizzera.",
      "Swiss police emergency number."
    ),
    primary: true,
  },
  {
    id: "feuerwehr",
    label: l4(
      "Feuerwehr 118",
      "Pompiers 118",
      "Pompieri 118",
      "Fire brigade 118"
    ),
    number: "118",
    description: l4(
      "Feuerwehrnotruf Schweiz – bei Bränden, auch Wald- und Flächenbränden.",
      "Appel d'urgence des pompiers suisses – en cas d'incendie, y compris feux de forêt et de broussailles.",
      "Numero d'emergenza dei pompieri svizzeri – in caso di incendi, anche boschivi e di sterpaglie.",
      "Swiss fire brigade emergency number – for fires, including forest and grass fires."
    ),
  },
  {
    id: "sanitaet",
    label: l4("Sanität 144", "Ambulance 144", "Ambulanza 144", "Ambulance 144"),
    number: "144",
    description: l4(
      "Sanitätsnotruf Schweiz – Ambulanz bei medizinischen Notfällen.",
      "Urgences sanitaires suisses – ambulance en cas d'urgence médicale.",
      "Emergenza sanitaria svizzera – ambulanza in caso di urgenze mediche.",
      "Swiss medical emergency number – ambulance for medical emergencies."
    ),
  },
  {
    id: "toxinfo",
    label: l4("Tox Info 145", "Tox Info 145", "Tox Info 145", "Tox Info 145"),
    number: "145",
    description: l4(
      "Vergiftungsnotfälle – rund um die Uhr, z. B. bei giftigen Pflanzen oder Pilzen.",
      "Urgences en cas d'intoxication – 24h/24, p. ex. plantes ou champignons toxiques.",
      "Emergenze da avvelenamento – 24 ore su 24, ad es. piante o funghi velenosi.",
      "Poisoning emergencies – around the clock, e.g. poisonous plants or mushrooms."
    ),
  },
];

/** Anleitung für den korrekten Notruf (Wer/Wo/Was). */
export const emergencyCallGuide: { title: L4; text: L4 }[] = [
  {
    title: l4(
      "Wo ist es passiert?",
      "Où est-ce arrivé ?",
      "Dove è successo?",
      "Where did it happen?"
    ),
    text: l4(
      "Standort so genau wie möglich angeben. Nutze die GPS-Koordinaten aus diesem Dashboard – die Rettungsdienste können sie direkt verwenden.",
      "Indique le lieu aussi précisément que possible. Utilise les coordonnées GPS de ce tableau de bord – les services de secours peuvent les utiliser directement.",
      "Indica il luogo nel modo più preciso possibile. Usa le coordinate GPS di questa dashboard – i servizi di soccorso possono usarle direttamente.",
      "State the location as precisely as possible. Use the GPS coordinates from this dashboard – the emergency services can use them directly."
    ),
  },
  {
    title: l4(
      "Was ist passiert?",
      "Que s'est-il passé ?",
      "Che cosa è successo?",
      "What happened?"
    ),
    text: l4(
      "Kurz beschreiben: Sturz, Verbrennung, Bewusstlosigkeit? Was ist die Hauptverletzung?",
      "Décris brièvement : chute, brûlure, perte de connaissance ? Quelle est la blessure principale ?",
      "Descrivi in breve: caduta, ustione, perdita di coscienza? Qual è la lesione principale?",
      "Describe briefly: fall, burn, unconsciousness? What is the main injury?"
    ),
  },
  {
    title: l4(
      "Wie viele Betroffene?",
      "Combien de personnes touchées ?",
      "Quante persone coinvolte?",
      "How many people affected?"
    ),
    text: l4(
      "Anzahl der verletzten Personen und ungefähres Alter angeben – besonders wichtig bei Kindern.",
      "Indique le nombre de blessés et leur âge approximatif – particulièrement important pour les enfants.",
      "Indica il numero di feriti e l'età approssimativa – particolarmente importante per i bambini.",
      "State the number of injured people and their approximate age – especially important for children."
    ),
  },
  {
    title: l4(
      "Wer ruft an?",
      "Qui appelle ?",
      "Chi chiama?",
      "Who is calling?"
    ),
    text: l4(
      "Namen und Rückrufnummer nennen.",
      "Donne ton nom et un numéro de rappel.",
      "Indica nome e numero per essere richiamato.",
      "Give your name and a callback number."
    ),
  },
  {
    title: l4("Warten!", "Attends !", "Aspetta!", "Wait!"),
    text: l4(
      "Nie zuerst auflegen – die Zentrale beendet das Gespräch und gibt dir Anweisungen für die Erste Hilfe.",
      "Ne raccroche jamais en premier – la centrale termine l'appel et te donne des instructions de premiers secours.",
      "Non riagganciare mai per primo – la centrale conclude la chiamata e ti dà istruzioni di primo soccorso.",
      "Never hang up first – the control centre ends the call and gives you first-aid instructions."
    ),
  },
];
