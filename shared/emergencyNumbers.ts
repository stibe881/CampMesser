/**
 * Notrufnummern pro Land (#432) – nach dem Muster der Maut-Regeln
 * (#228): ein gepflegter, statischer Katalog statt eines Dienstes.
 *
 * 112 GILT EUROPAWEIT, aber wer im Gebirge einen Hubschrauber braucht,
 * ist mit der direkten Nummer schneller: Rega 1414 in der Schweiz,
 * Bergrettung 140 in Österreich. Genau diese Unterschiede stehen hier –
 * für die Länder, in die man vom Schweizer Camping-Publikum aus fährt.
 *
 * QUELLENLAGE: Es sind die amtlichen, seit Jahren stabilen Nummern.
 * Sollte ein Land umstellen, gehört der Katalog nachgeführt – er ist
 * eine Zusage, kein Feigenblatt (Prinzip wie die Datenschutzerklärung).
 */
import { l4, type L4 } from "./i18n";

export interface EmergencyNumber {
  label: L4;
  number: string;
}

export interface CountryEmergency {
  /** ISO-3166-alpha-2, klein – fürs Flaggen-Emoji und als Schlüssel. */
  code: string;
  name: L4;
  numbers: EmergencyNumber[];
}

const POLICE = l4("Polizei", "Police", "Polizia", "Police");
const FIRE = l4("Feuerwehr", "Pompiers", "Pompieri", "Fire brigade");
const AMBULANCE = l4("Sanität", "Ambulance", "Ambulanza", "Ambulance");
const MOUNTAIN = l4(
  "Bergrettung",
  "Secours en montagne",
  "Soccorso alpino",
  "Mountain rescue"
);
const GENERAL = l4(
  "Allgemeiner Notruf",
  "Numéro d'urgence général",
  "Emergenza generale",
  "General emergency"
);

export const EU_EMERGENCY_NUMBER = "112";

export const EMERGENCY_COUNTRIES: CountryEmergency[] = [
  {
    code: "ch",
    name: l4("Schweiz", "Suisse", "Svizzera", "Switzerland"),
    numbers: [
      { label: POLICE, number: "117" },
      { label: FIRE, number: "118" },
      { label: AMBULANCE, number: "144" },
      { label: l4("Rega", "Rega", "Rega", "Rega"), number: "1414" },
      {
        label: l4(
          "Tox Info (Vergiftungen)",
          "Tox Info (intoxications)",
          "Tox Info (avvelenamenti)",
          "Tox Info (poisoning)"
        ),
        number: "145",
      },
    ],
  },
  {
    code: "de",
    name: l4("Deutschland", "Allemagne", "Germania", "Germany"),
    numbers: [
      { label: POLICE, number: "110" },
      { label: FIRE, number: "112" },
      { label: AMBULANCE, number: "112" },
    ],
  },
  {
    code: "at",
    name: l4("Österreich", "Autriche", "Austria", "Austria"),
    numbers: [
      { label: POLICE, number: "133" },
      { label: FIRE, number: "122" },
      { label: AMBULANCE, number: "144" },
      { label: MOUNTAIN, number: "140" },
    ],
  },
  {
    code: "fr",
    name: l4("Frankreich", "France", "Francia", "France"),
    numbers: [
      { label: POLICE, number: "17" },
      { label: FIRE, number: "18" },
      { label: AMBULANCE, number: "15" },
    ],
  },
  {
    code: "it",
    name: l4("Italien", "Italie", "Italia", "Italy"),
    numbers: [{ label: GENERAL, number: "112" }],
  },
  {
    code: "es",
    name: l4("Spanien", "Espagne", "Spagna", "Spain"),
    numbers: [{ label: GENERAL, number: "112" }],
  },
  {
    code: "nl",
    name: l4("Niederlande", "Pays-Bas", "Paesi Bassi", "Netherlands"),
    numbers: [{ label: GENERAL, number: "112" }],
  },
  {
    code: "be",
    name: l4("Belgien", "Belgique", "Belgio", "Belgium"),
    numbers: [
      { label: GENERAL, number: "112" },
      { label: POLICE, number: "101" },
    ],
  },
  {
    code: "hr",
    name: l4("Kroatien", "Croatie", "Croazia", "Croatia"),
    numbers: [
      { label: GENERAL, number: "112" },
      { label: POLICE, number: "192" },
      { label: AMBULANCE, number: "194" },
    ],
  },
  {
    code: "si",
    name: l4("Slowenien", "Slovénie", "Slovenia", "Slovenia"),
    numbers: [
      { label: GENERAL, number: "112" },
      { label: POLICE, number: "113" },
    ],
  },
  {
    code: "no",
    name: l4("Norwegen", "Norvège", "Norvegia", "Norway"),
    numbers: [
      { label: FIRE, number: "110" },
      { label: POLICE, number: "112" },
      { label: AMBULANCE, number: "113" },
    ],
  },
  {
    code: "se",
    name: l4("Schweden", "Suède", "Svezia", "Sweden"),
    numbers: [{ label: GENERAL, number: "112" }],
  },
  {
    code: "dk",
    name: l4("Dänemark", "Danemark", "Danimarca", "Denmark"),
    numbers: [{ label: GENERAL, number: "112" }],
  },
  {
    code: "pt",
    name: l4("Portugal", "Portugal", "Portogallo", "Portugal"),
    numbers: [{ label: GENERAL, number: "112" }],
  },
  {
    code: "gr",
    name: l4("Griechenland", "Grèce", "Grecia", "Greece"),
    numbers: [
      { label: GENERAL, number: "112" },
      { label: POLICE, number: "100" },
      { label: AMBULANCE, number: "166" },
    ],
  },
];
