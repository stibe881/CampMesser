/**
 * SOS- & Notfall-Dashboard: fixe Notfallnummern und Notruf-Anleitung.
 */
export interface EmergencyNumber {
  id: string;
  label: string;
  number: string;
  description: string;
  primary?: boolean;
}

export const emergencyNumbers: EmergencyNumber[] = [
  {
    id: "rega",
    label: "Rega 1414",
    number: "1414",
    description:
      "Schweizerische Rettungsflugwacht – Bergrettung und medizinische Notfälle aus der Luft.",
    primary: true,
  },
  {
    id: "notruf",
    label: "Notruf 112",
    number: "112",
    description:
      "Europäischer Notruf – funktioniert in der ganzen EU und der Schweiz, auch ohne SIM-Empfang des eigenen Anbieters.",
    primary: true,
  },
  {
    id: "polizei",
    label: "Polizei 117",
    number: "117",
    description: "Polizeinotruf Schweiz.",
    primary: true,
  },
  {
    id: "feuerwehr",
    label: "Feuerwehr 118",
    number: "118",
    description:
      "Feuerwehrnotruf Schweiz – bei Bränden, auch Wald- und Flächenbränden.",
  },
  {
    id: "sanitaet",
    label: "Sanität 144",
    number: "144",
    description:
      "Sanitätsnotruf Schweiz – Ambulanz bei medizinischen Notfällen.",
  },
  {
    id: "toxinfo",
    label: "Tox Info 145",
    number: "145",
    description:
      "Vergiftungsnotfälle – rund um die Uhr, z. B. bei giftigen Pflanzen oder Pilzen.",
  },
];

/** Anleitung für den korrekten Notruf (Wer/Wo/Was). */
export const emergencyCallGuide = [
  {
    title: "Wo ist es passiert?",
    text: "Standort so genau wie möglich angeben. Nutze die GPS-Koordinaten aus diesem Dashboard – die Rettungsdienste können sie direkt verwenden.",
  },
  {
    title: "Was ist passiert?",
    text: "Kurz beschreiben: Sturz, Verbrennung, Bewusstlosigkeit? Was ist die Hauptverletzung?",
  },
  {
    title: "Wie viele Betroffene?",
    text: "Anzahl der verletzten Personen und ungefähres Alter angeben – besonders wichtig bei Kindern.",
  },
  {
    title: "Wer ruft an?",
    text: "Namen und Rückrufnummer nennen.",
  },
  {
    title: "Warten!",
    text: "Nie zuerst auflegen – die Zentrale beendet das Gespräch und gibt dir Anweisungen für die Erste Hilfe.",
  },
];
