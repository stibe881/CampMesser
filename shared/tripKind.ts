/**
 * Reise-Art (#460): Camping, Strandferien, Hotelferien, Städtereise,
 * Wandern, Velotour, Wintersport oder Tagesausflug – pro REISE, nicht als
 * globaler App-Schalter. Die App weiss über Start/Ende ohnehin, welche
 * Reise gerade läuft; damit stellt sich die Heute-Ansicht von selbst um,
 * ohne dass jemand einen Modus umschalten (und wieder zurückschalten)
 * muss.
 *
 * Die Art SORTIERT UND SCHLÄGT VOR, sie sperrt nie: Wer im Strandurlaub
 * eine Feuerstelle sucht, findet alle Module weiterhin über die
 * Startseite. Deshalb gibt es hier nur Empfehlungen (Schnellzugriffe,
 * welche Karten die Heute-Ansicht zeigt) und keine Verbotslisten.
 *
 * Reine Daten und Funktionen – Client, Server und Tests teilen sie.
 * Anzeigenamen als L4, Default-Sprache Deutsch.
 */

import { l4, pick, type L4, type Language } from "./i18n";

export const TRIP_KINDS = [
  "camping",
  "strand",
  "hotel",
  "staedte",
  "wandern",
  "velo",
  "wintersport",
  "tagesausflug",
] as const;

export type TripKind = (typeof TRIP_KINDS)[number];

/** Bisherige Zeilen (vor der Spalte) und Unbekanntes gelten als Camping. */
export const DEFAULT_TRIP_KIND: TripKind = "camping";

const TRIP_KIND_LABELS: Record<TripKind, L4> = {
  camping: l4("Camping", "Camping", "Campeggio", "Camping"),
  strand: l4(
    "Strandferien",
    "Vacances balnéaires",
    "Vacanze al mare",
    "Beach holiday"
  ),
  hotel: l4(
    "Hotelferien",
    "Vacances à l'hôtel",
    "Vacanze in hotel",
    "Hotel stay"
  ),
  staedte: l4("Städtereise", "City trip", "Viaggio in città", "City trip"),
  wandern: l4("Wandern", "Randonnée", "Escursionismo", "Hiking"),
  velo: l4("Velotour", "Tour à vélo", "Giro in bici", "Bike tour"),
  wintersport: l4(
    "Wintersport",
    "Sports d'hiver",
    "Sport invernali",
    "Winter sports"
  ),
  tagesausflug: l4(
    "Tagesausflug",
    "Excursion d'un jour",
    "Gita di un giorno",
    "Day trip"
  ),
};

/** Unbekannte Werte (alte Zeilen, kaputte Daten) auf einen gültigen bringen. */
export function normalizeTripKind(value: unknown): TripKind {
  return TRIP_KINDS.includes(value as TripKind)
    ? (value as TripKind)
    : DEFAULT_TRIP_KIND;
}

/** Anzeigename der Reise-Art in der gewünschten Sprache. */
export function tripKindLabel(kind: TripKind, lang: Language = "de"): string {
  return pick(TRIP_KIND_LABELS[kind], lang);
}

/**
 * Was die Heute-Ansicht pro Art in den Vordergrund stellt.
 *
 * `quickModules` sind Modul-PFADE: Der Client löst sie gegen seinen
 * Kachel-Katalog auf und lässt still weg, was es (nicht mehr) gibt – ein
 * umbenannter Pfad kostet so höchstens einen Knopf, nie einen Absturz.
 * Die drei Standard-Knöpfe (Wetter, Menüplan, Reise-Einkauf) bleiben bei
 * jeder Art bestehen; hier stehen nur die ZUSÄTZLICHEN.
 */
export interface TripKindPreset {
  /** Zusätzliche Schnellzugriffe der Heute-Ansicht (Modul-Pfade). */
  quickModules: string[];
  /** Lagerfeuer-Ampel zeigen? Im Hotel fragt das niemand. */
  campfire: boolean;
  /**
   * Badewasser-Karte (Temperatur, Wellen, Gezeiten) direkt in der
   * Heute-Ansicht? Nur wo Baden der Kern der Reise ist – am Zeltplatz
   * steht sie weiterhin im Dossier.
   */
  bathing: boolean;
  /**
   * Schläft man draussen? Steuert die Zelt-Zeilen der Packvorschläge
   * (#464): «Zusätzliche Heringe» im Hotel wären ein Witz auf Kosten
   * des Vertrauens in die Vorschläge.
   */
  tentGear: boolean;
  /**
   * Schneehöhe prominent in der Heute-Ansicht (#470)? Nur beim
   * Wintersport – dort ist sie DIE Zahl des Tages.
   */
  winter: boolean;
  /**
   * Sehenswürdigkeiten in der Heute-Ansicht (#486)? Bei Städtereise und
   * Hotelferien ist «was gibt es hier?» die Frage des Tages – am
   * Zeltplatz steht dieselbe Liste weiterhin im Dossier.
   */
  sights: boolean;
  /** Strände in der Nähe (#487) – nur bei Strandferien. */
  beaches: boolean;
  /**
   * ÖV-Haltestellen mit Abfahrten in der Heute-Ansicht (#488)? In der
   * Stadt und im Hotel bewegt man sich mit Bahn und Bus; die Daten
   * (transport.opendata.ch) decken die Schweiz ab – anderswo bleibt die
   * Suche ehrlich leer.
   */
  transit: boolean;
  /**
   * Kuratierte Ausflüge (Ausflugfinder #271) in der Heute-Ansicht
   * (#489)? Beim Tagesausflug IST der Ausflug die Reise.
   */
  excursions: boolean;
}

export const TRIP_KIND_PRESETS: Record<TripKind, TripKindPreset> = {
  // Camping = das heutige Verhalten; keine zusätzlichen Knöpfe nötig.
  camping: {
    quickModules: [],
    campfire: true,
    bathing: false,
    tentGear: true,
    winter: false,
    sights: false,
    beaches: false,
    transit: false,
    excursions: false,
  },
  strand: {
    // Baderegeln & Flaggen (#473) gehören an den Strand-Schnellzugriff
    quickModules: ["/wasser", "/baderegeln", "/packen"],
    campfire: false,
    bathing: true,
    // Strandferien als EIGENE Art heisst: nicht im Zelt (sonst Camping)
    tentGear: false,
    winter: false,
    sights: false,
    beaches: true,
    transit: false,
    excursions: false,
  },
  hotel: {
    quickModules: ["/ausweise", "/sprachhilfe"],
    campfire: false,
    bathing: false,
    tentGear: false,
    winter: false,
    sights: true,
    beaches: false,
    transit: true,
    excursions: false,
  },
  staedte: {
    quickModules: ["/ausweise", "/sprachhilfe"],
    campfire: false,
    bathing: false,
    tentGear: false,
    winter: false,
    sights: true,
    beaches: false,
    transit: true,
    excursions: false,
  },
  wandern: {
    quickModules: ["/wanderung", "/erste-hilfe"],
    campfire: true,
    bathing: false,
    tentGear: true,
    winter: false,
    sights: false,
    beaches: false,
    transit: false,
    excursions: false,
  },
  velo: {
    quickModules: ["/wanderung", "/reparatur"],
    campfire: false,
    bathing: false,
    tentGear: true,
    winter: false,
    sights: false,
    beaches: false,
    transit: false,
    excursions: false,
  },
  wintersport: {
    // «Pisten & Lawinen» (#472) zuerst – das schlägt man am Berg nach
    quickModules: ["/wintersport", "/laenderregeln", "/erste-hilfe"],
    campfire: false,
    bathing: false,
    tentGear: false,
    winter: true,
    sights: false,
    beaches: false,
    transit: false,
    excursions: false,
  },
  tagesausflug: {
    quickModules: ["/lunchbox", "/regentag"],
    campfire: false,
    bathing: false,
    tentGear: false,
    winter: false,
    sights: false,
    beaches: false,
    transit: true,
    excursions: true,
  },
};

/** Preset einer (auch unbekannten) Art – nie undefined. */
export function tripKindPreset(value: unknown): TripKindPreset {
  return TRIP_KIND_PRESETS[normalizeTripKind(value)];
}

/**
 * Welche Felder das Reise-Formular pro Art anbietet (#485): Wer
 * Hotelferien einträgt, soll keine Zeltplatz-Auswahl und keine
 * Parzellennummer sehen – nur die Angaben, die zur Art gehören.
 *
 * WICHTIG: Das steuert nur die ANZEIGE. Gespeicherte Werte bleiben beim
 * Umschalten der Art erhalten (versteckte Felder werden unverändert
 * mitgeschickt) – die Art wechseln darf keine Daten löschen.
 */
export interface TripKindFormPreset {
  /**
   * Zeltplatz-Favoriten zur Verknüpfung anbieten? Sonst gibt es nur den
   * Freitext-Ort. Zeltplätze verknüpfen die Arten, die dort schlafen.
   */
  spotSelect: boolean;
  /**
   * Stellplatz-Block (Parzellennummer, WLAN, Stellplatz-Notizen, #252)
   * zeigen? Eine Parzellennummer gibt es nur auf dem Platz.
   */
  pitchDetails: boolean;
  /**
   * Ein-Tages-Reise: nur EIN Datum abfragen, Abreise = Anreise. Ein
   * Tagesausflug mit getrennter «Abreise» wäre eine Fangfrage.
   */
  singleDay: boolean;
}

export const TRIP_KIND_FORMS: Record<TripKind, TripKindFormPreset> = {
  camping: { spotSelect: true, pitchDetails: true, singleDay: false },
  strand: { spotSelect: false, pitchDetails: false, singleDay: false },
  hotel: { spotSelect: false, pitchDetails: false, singleDay: false },
  staedte: { spotSelect: false, pitchDetails: false, singleDay: false },
  // Mehrtages-Touren übernachten oft auf Plätzen – Zeltplatz erlaubt
  wandern: { spotSelect: true, pitchDetails: true, singleDay: false },
  velo: { spotSelect: true, pitchDetails: true, singleDay: false },
  wintersport: { spotSelect: false, pitchDetails: false, singleDay: false },
  tagesausflug: { spotSelect: false, pitchDetails: false, singleDay: true },
};

/** Formular-Preset einer (auch unbekannten) Art – nie undefined. */
export function tripKindForm(value: unknown): TripKindFormPreset {
  return TRIP_KIND_FORMS[normalizeTripKind(value)];
}
