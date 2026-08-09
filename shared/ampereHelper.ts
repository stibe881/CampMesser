/**
 * Ampere-Helfer am Platz (#639): Die Stellplatz-Säule ist mit 4, 6, 10,
 * 13 oder 16 Ampere abgesichert – und der Wasserkocher wirft die
 * Sicherung, wenn nebenbei der Heizlüfter läuft. Der Helfer rechnet die
 * gewählten Geräte zusammen und sagt VOR dem Einstecken, ob die
 * Sicherung hält. Gerechnet wird mit 230 V; die Watt-Werte sind typische
 * Geräte-Nennleistungen und bewusst rund.
 */
import { l4, type L4 } from "./i18n";

/** Übliche Absicherungen von Campingplatz-Säulen (Ampere). */
export const AMPERE_OPTIONS = [4, 6, 10, 13, 16] as const;

export const VOLTS = 230;

/** Belastbarkeit der Sicherung in Watt. */
export function wattLimit(amps: number): number {
  return Math.max(0, Math.round(amps * VOLTS));
}

export interface AmpereDevice {
  id: string;
  label: L4;
  watts: number;
}

/** Typische Geräte samt Nennleistung – Grundlage der Zusammenzählung. */
export const AMPERE_DEVICES: AmpereDevice[] = [
  {
    id: "wasserkocher",
    label: l4("Wasserkocher", "Bouilloire", "Bollitore", "Kettle"),
    watts: 1800,
  },
  {
    id: "heizluefter",
    label: l4(
      "Heizlüfter",
      "Radiateur soufflant",
      "Termoventilatore",
      "Fan heater"
    ),
    watts: 2000,
  },
  {
    id: "kaffeemaschine",
    label: l4(
      "Kaffeemaschine",
      "Machine à café",
      "Macchina del caffè",
      "Coffee machine"
    ),
    watts: 1200,
  },
  {
    id: "induktion",
    label: l4(
      "Induktions-Kochplatte",
      "Plaque à induction",
      "Piastra a induzione",
      "Induction hob"
    ),
    watts: 1800,
  },
  {
    id: "toaster",
    label: l4("Toaster", "Grille-pain", "Tostapane", "Toaster"),
    watts: 800,
  },
  {
    id: "foehn",
    label: l4("Föhn", "Sèche-cheveux", "Asciugacapelli", "Hair dryer"),
    watts: 1600,
  },
  {
    id: "kuehlbox",
    label: l4(
      "Kompressor-Kühlbox",
      "Glacière à compresseur",
      "Frigo a compressore",
      "Compressor cool box"
    ),
    watts: 60,
  },
  {
    id: "laden",
    label: l4(
      "Ladegeräte & Router",
      "Chargeurs et routeur",
      "Caricatori e router",
      "Chargers & router"
    ),
    watts: 60,
  },
  {
    id: "boiler",
    label: l4("Warmwasser-Boiler", "Chauffe-eau", "Boiler", "Water heater"),
    watts: 1300,
  },
];

export interface AmpereCheck {
  /** Summe der gewählten Geräte in Watt. */
  totalWatts: number;
  /** Belastbarkeit der Sicherung in Watt. */
  limitWatts: number;
  /** Gezogene Ampere bei 230 V (eine Nachkommastelle). */
  totalAmps: number;
  /** Hält die Sicherung? */
  ok: boolean;
  /** Reserve (positiv) bzw. Überlast (negativ) in Watt. */
  marginWatts: number;
}

/** Gewählte Geräte gegen die Sicherung rechnen. */
export function ampereCheck(
  deviceIds: readonly string[],
  amps: number
): AmpereCheck {
  const totalWatts = AMPERE_DEVICES.filter(device =>
    deviceIds.includes(device.id)
  ).reduce((sum, device) => sum + device.watts, 0);
  const limitWatts = wattLimit(amps);
  return {
    totalWatts,
    limitWatts,
    totalAmps: Math.round((totalWatts / VOLTS) * 10) / 10,
    ok: totalWatts <= limitWatts,
    marginWatts: limitWatts - totalWatts,
  };
}
