/**
 * Szenario-basierte Packlisten-Vorlagen.
 * Wird von Client (Anzeige) und Server (Listen-Erstellung) verwendet.
 */
export interface PackTemplateItem {
  name: string;
  category: string;
  quantity?: number;
}

export interface PackScenario {
  id: string;
  label: string;
  description: string;
  icon: string;
  items: PackTemplateItem[];
}

const basisAusruestung: PackTemplateItem[] = [
  { name: "Zelt inkl. Heringe & Leinen", category: "Schlafen" },
  { name: "Schlafsack", category: "Schlafen" },
  { name: "Isomatte", category: "Schlafen" },
  { name: "Stirnlampe + Ersatzbatterien", category: "Licht & Energie" },
  { name: "Powerbank", category: "Licht & Energie" },
  { name: "Gaskocher + Kartusche", category: "Küche" },
  { name: "Topf & Pfanne", category: "Küche" },
  { name: "Geschirr & Besteck", category: "Küche" },
  { name: "Taschenmesser", category: "Werkzeug" },
  { name: "Reparatur-Set (Tape, Nähzeug, Kabelbinder)", category: "Werkzeug" },
  { name: "Erste-Hilfe-Set", category: "Sicherheit" },
  { name: "Sonnencrème & Sonnenhut", category: "Hygiene" },
  { name: "Zeckenzange", category: "Sicherheit" },
  { name: "Regenjacke", category: "Kleidung" },
  { name: "Warme Schicht (Fleece/Daune)", category: "Kleidung" },
  { name: "Wanderschuhe", category: "Kleidung" },
  { name: "Trinkflaschen", category: "Küche" },
  { name: "Abfallsäcke", category: "Sonstiges" },
];

export const packScenarios: PackScenario[] = [
  {
    id: "solo",
    label: "Solo-Trip",
    description: "Leicht und minimalistisch – du trägst alles selbst.",
    icon: "Backpack",
    items: [
      ...basisAusruestung,
      { name: "Ultraleicht-Handtuch", category: "Hygiene" },
      { name: "Wasserfilter oder Entkeimungstabletten", category: "Küche" },
      { name: "Notfall-Biwaksack", category: "Sicherheit" },
      { name: "Karte & Kompass", category: "Orientierung" },
      { name: "Buch oder E-Reader", category: "Sonstiges" },
    ],
  },
  {
    id: "familie",
    label: "Familienurlaub",
    description: "Mit Kindern unterwegs – Komfort und Beschäftigung zählen.",
    icon: "Users",
    items: [
      ...basisAusruestung,
      { name: "Grosses Familienzelt mit Vorraum", category: "Schlafen" },
      { name: "Kinderschlafsäcke", category: "Schlafen", quantity: 2 },
      { name: "Lieblingskuscheltier", category: "Kinder" },
      { name: "Nachtlicht fürs Zelt", category: "Kinder" },
      { name: "Spielsachen & Sandspielzeug", category: "Kinder" },
      { name: "Bilderbücher / Vorlesebuch", category: "Kinder" },
      { name: "Becherlupe & Kinderfernglas", category: "Kinder" },
      { name: "Wechselkleidung (mehr als du denkst)", category: "Kinder" },
      { name: "Feuchttücher", category: "Hygiene" },
      { name: "Campingstühle & Tisch", category: "Komfort" },
      { name: "Kühlbox", category: "Küche" },
      { name: "Snacks für die Fahrt", category: "Küche" },
    ],
  },
  {
    id: "motorrad",
    label: "Motorrad-Zelten",
    description: "Minimales Packmass – jeder Liter Stauraum zählt.",
    icon: "Bike",
    items: [
      ...basisAusruestung.filter(i => !["Topf & Pfanne"].includes(i.name)),
      { name: "Kompakter Topf (Pfanne als Deckel)", category: "Küche" },
      { name: "Kompressionssäcke", category: "Gepäck" },
      { name: "Gepäckrollen / Seitentaschen wasserdicht", category: "Gepäck" },
      { name: "Spanngurte & Netz", category: "Gepäck" },
      { name: "Motorrad-Regenkombi", category: "Kleidung" },
      { name: "Kettenspray & Mini-Werkzeug", category: "Werkzeug" },
      { name: "Ultraleicht-Zelt (1–2 Personen)", category: "Schlafen" },
      { name: "Ohrstöpsel", category: "Hygiene" },
    ],
  },
  {
    id: "custom",
    label: "Eigene Liste",
    description: "Leere Liste – stelle deine Ausrüstung selbst zusammen.",
    icon: "ListPlus",
    items: [],
  },
];

/** Familien-Modus: Zusatzpakete, die jeder Liste hinzugefügt werden können. */
export const familyAddOns: {
  id: string;
  label: string;
  description: string;
  items: PackTemplateItem[];
}[] = [
  {
    id: "kindersicherheit",
    label: "Kindersichere Ausrüstung",
    description:
      "Sicherheits-Ergänzungen für Kleinkinder und Kinder bis ca. 8 Jahre.",
    items: [
      {
        name: "Reflektierende Armbänder / Leuchtbänder",
        category: "Kinder-Sicherheit",
        quantity: 2,
      },
      {
        name: "Notfall-Armband mit Handynummer der Eltern",
        category: "Kinder-Sicherheit",
        quantity: 2,
      },
      {
        name: "Trillerpfeife pro Kind",
        category: "Kinder-Sicherheit",
        quantity: 2,
      },
      {
        name: "Kindgerechte Stirnlampe",
        category: "Kinder-Sicherheit",
        quantity: 2,
      },
      {
        name: "Steckdosen-/Kocher-Abschirmung (Kleinkind)",
        category: "Kinder-Sicherheit",
      },
      {
        name: "Sonnenzelt / UV-Schutz fürs Kleinkind",
        category: "Kinder-Sicherheit",
      },
      {
        name: "Schwimmhilfe (falls Gewässer in der Nähe)",
        category: "Kinder-Sicherheit",
      },
    ],
  },
  {
    id: "reiseapotheke-kinder",
    label: "Reiseapotheke für Kinder",
    description:
      "Erweiterung der Standard-Apotheke für Kleinkind und Schulkind.",
    items: [
      { name: "Fieberthermometer", category: "Kinder-Apotheke" },
      {
        name: "Fieber-/Schmerzzäpfchen oder -sirup (altersgerecht)",
        category: "Kinder-Apotheke",
      },
      { name: "Elektrolytlösung für Kinder", category: "Kinder-Apotheke" },
      { name: "Kinder-Sonnencrème LSF 50+", category: "Kinder-Apotheke" },
      { name: "Insektenschutz für Kinder", category: "Kinder-Apotheke" },
      { name: "Wund- und Heilsalbe", category: "Kinder-Apotheke" },
      { name: "Kinderpflaster (bunt hilft!)", category: "Kinder-Apotheke" },
      { name: "Kühlendes Gel für Insektenstiche", category: "Kinder-Apotheke" },
      {
        name: "Windeln & Wundschutzcrème (Kleinkind)",
        category: "Kinder-Apotheke",
      },
    ],
  },
];
