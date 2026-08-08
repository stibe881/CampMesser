/**
 * Wanderwege in der Nähe (#238): alles, was sich an einer OSM-Wanderroute
 * rechnen und benennen lässt – bewusst ohne Abruf und ohne DOM, damit Client
 * und Tests dieselbe Logik nutzen.
 *
 * Die Gehzeit folgt der in der Schweiz üblichen SAC-Methode: die waagrechte
 * Zeit (4 km/h) und die senkrechte Zeit (400 Hm/h aufwärts, 800 Hm/h abwärts)
 * werden NICHT addiert – gezählt wird der grössere Anteil plus die Hälfte des
 * kleineren. Das ist dieselbe Faustregel, die auf den gelben Wegweisern
 * steckt, und sie ist bewusst konservativ: Pausen sind nicht enthalten.
 *
 * Grundsatz für alle Werte aus OSM: Was nicht in den Daten steht, wird nicht
 * geraten. Die Parser liefern `null`, die Oberfläche zeigt dann «–».
 */
import { distanceMeters } from "./geo";
import { l4, pick, type L4, type Language } from "./i18n";

/** Punkt einer Wegführung (Overpass liefert lat/lon). */
export interface GeoPoint {
  lat: number;
  lon: number;
}

/** Waagrechtes Wandertempo in km/h (SAC-Faustregel). */
export const HIKING_SPEED_KMH = 4;

/** Aufstiegsleistung in Höhenmetern pro Stunde. */
export const HIKING_ASCENT_M_PER_H = 400;

/** Abstiegsleistung in Höhenmetern pro Stunde. */
export const HIKING_DESCENT_M_PER_H = 800;

/**
 * Gehzeit in Minuten nach der SAC-Methode: max(waagrecht, senkrecht) plus die
 * Hälfte des kleineren Anteils. Höhenmeter, die nicht in den Daten stehen,
 * zählen als 0 – die Zeit ist dann eine reine Flachzeit und in der Oberfläche
 * auch so gekennzeichnet. Ergebnis auf ganze Minuten gerundet.
 */
export function walkingTimeMinutes(input: {
  lengthM: number;
  ascentM?: number | null;
  descentM?: number | null;
}): number {
  const lengthM = Number.isFinite(input.lengthM)
    ? Math.max(0, input.lengthM)
    : 0;
  const ascentM =
    typeof input.ascentM === "number" && Number.isFinite(input.ascentM)
      ? Math.max(0, input.ascentM)
      : 0;
  const descentM =
    typeof input.descentM === "number" && Number.isFinite(input.descentM)
      ? Math.max(0, input.descentM)
      : 0;
  const flatHours = lengthM / 1000 / HIKING_SPEED_KMH;
  const verticalHours =
    ascentM / HIKING_ASCENT_M_PER_H + descentM / HIKING_DESCENT_M_PER_H;
  const hours =
    Math.max(flatHours, verticalHours) + Math.min(flatHours, verticalHours) / 2;
  return Math.round(hours * 60);
}

/** Reisetempo auf dem Velo in km/h – Tourenfahrt, nicht Rennrad (#478). */
export const CYCLING_SPEED_KMH = 15;
/** Zeitzuschlag pro 100 Höhenmeter Aufstieg in Minuten. */
export const CYCLING_ASCENT_MIN_PER_100M = 6;

/**
 * Fahrzeit in Minuten (#478): Flachzeit bei Tourentempo plus Zuschlag für
 * den Aufstieg. Bewusst einfacher als die SAC-Methode – auf dem Velo
 * dominiert die Distanz, und die Höhenmeter sind in OSM bei Velorouten
 * ohnehin selten gepflegt (dann ist es eine reine Flachzeit).
 */
export function cyclingTimeMinutes(input: {
  lengthM: number;
  ascentM?: number | null;
}): number {
  const lengthM = Number.isFinite(input.lengthM)
    ? Math.max(0, input.lengthM)
    : 0;
  const ascentM =
    typeof input.ascentM === "number" && Number.isFinite(input.ascentM)
      ? Math.max(0, input.ascentM)
      : 0;
  const flatMinutes = (lengthM / 1000 / CYCLING_SPEED_KMH) * 60;
  const climbMinutes = (ascentM / 100) * CYCLING_ASCENT_MIN_PER_100M;
  return Math.round(flatMinutes + climbMinutes);
}

/**
 * Gehzeit lesbar machen. Geschätzte Zeiten werden auf 5 Minuten gerundet –
 * «2 h 07 min» wäre eine Scheingenauigkeit, die die Formel nicht hergibt.
 * Unter 5 Minuten bleibt es bei 5 Minuten, 0 bleibt 0.
 */
export function formatWalkingTime(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0 min";
  const rounded = Math.max(5, Math.round(minutes / 5) * 5);
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${rest} min`;
}

/** SAC-Wanderskala T1–T6. */
export type SacGrade = "T1" | "T2" | "T3" | "T4" | "T5" | "T6";

/** OSM-`sac_scale`-Werte (und die direkte T-Schreibweise) auf T1–T6. */
const SAC_BY_TAG: Record<string, SacGrade> = {
  hiking: "T1",
  mountain_hiking: "T2",
  demanding_mountain_hiking: "T3",
  alpine_hiking: "T4",
  demanding_alpine_hiking: "T5",
  difficult_alpine_hiking: "T6",
  t1: "T1",
  t2: "T2",
  t3: "T3",
  t4: "T4",
  t5: "T5",
  t6: "T6",
};

/** `sac_scale` aus OSM lesen; alles Unbekannte ergibt null (kein Raten). */
export function parseSacScale(value: unknown): SacGrade | null {
  if (typeof value !== "string") return null;
  return SAC_BY_TAG[value.trim().toLowerCase()] ?? null;
}

const SAC_NAMES: Record<SacGrade, L4> = {
  T1: l4("Wandern", "Randonnée", "Escursionismo", "Hiking"),
  T2: l4(
    "Bergwandern",
    "Randonnée en montagne",
    "Escursionismo in montagna",
    "Mountain hiking"
  ),
  T3: l4(
    "Anspruchsvolles Bergwandern",
    "Randonnée en montagne exigeante",
    "Escursionismo impegnativo in montagna",
    "Demanding mountain hiking"
  ),
  T4: l4(
    "Alpinwandern",
    "Randonnée alpine",
    "Escursionismo alpinistico",
    "Alpine hiking"
  ),
  T5: l4(
    "Anspruchsvolles Alpinwandern",
    "Randonnée alpine exigeante",
    "Escursionismo alpinistico impegnativo",
    "Demanding alpine hiking"
  ),
  T6: l4(
    "Schwieriges Alpinwandern",
    "Randonnée alpine difficile",
    "Escursionismo alpinistico difficile",
    "Difficult alpine hiking"
  ),
};

const SAC_DESCRIPTIONS: Record<SacGrade, L4> = {
  T1: l4(
    "Weg gut gebahnt und durchgehend markiert, keine Absturzgefahr. Turnschuhe genügen.",
    "Chemin bien aménagé et balisé en continu, aucun risque de chute. Des baskets suffisent.",
    "Sentiero ben tracciato e segnalato ovunque, nessun pericolo di caduta. Bastano le scarpe da ginnastica.",
    "Well-made path, waymarked throughout, no risk of falling. Trainers are enough."
  ),
  T2: l4(
    "Weg durchgehend sichtbar, teilweise steil. Trittsicherheit und Wanderschuhe nötig.",
    "Chemin visible en continu, parfois raide. Pied sûr et chaussures de randonnée nécessaires.",
    "Sentiero sempre visibile, a tratti ripido. Servono passo sicuro e scarponi da escursionismo.",
    "Path visible throughout, steep in places. Sure-footedness and walking boots needed."
  ),
  T3: l4(
    "Weg nicht überall sichtbar, ausgesetzte Stellen sind mit Seilen oder Ketten gesichert. Trittsicherheit, Schwindelfreiheit und gutes Schuhwerk.",
    "Chemin pas visible partout, les passages exposés sont sécurisés par des cordes ou des chaînes. Pied sûr, absence de vertige et bonnes chaussures.",
    "Sentiero non ovunque visibile, i passaggi esposti sono assicurati con corde o catene. Passo sicuro, assenza di vertigini e calzature adatte.",
    "Path not visible everywhere, exposed sections secured with ropes or chains. Sure-footedness, a head for heights and proper boots."
  ),
  T4: l4(
    "Nur noch Wegspuren, teils weglos. Die Hände braucht es zum Gleichgewicht, alpine Erfahrung und Wetterbeurteilung sind Voraussetzung.",
    "Uniquement des traces, parfois hors sentier. Les mains servent à l'équilibre ; expérience alpine et lecture de la météo indispensables.",
    "Solo tracce di sentiero, a tratti fuori sentiero. Le mani servono per l'equilibrio; sono indispensabili esperienza alpina e valutazione del meteo.",
    "Only faint traces, partly pathless. Hands are needed for balance; alpine experience and weather judgement are essential."
  ),
  T5: l4(
    "Meist weglos, einzelne einfache Kletterstellen. Sicheres Beurteilen des Geländes und alpine Erfahrung sind Pflicht.",
    "Le plus souvent hors sentier, quelques passages d'escalade faciles. Évaluation sûre du terrain et expérience alpine obligatoires.",
    "Perlopiù fuori sentiero, singoli passaggi di arrampicata facili. Valutazione sicura del terreno ed esperienza alpina sono d'obbligo.",
    "Mostly pathless, with the odd easy climbing move. Sound terrain assessment and alpine experience are a must."
  ),
  T6: l4(
    "Weglos, Kletterstellen bis zum zweiten Schwierigkeitsgrad, oft heikles Gelände. Nur für erfahrene Berggängerinnen und Berggänger mit passender Ausrüstung.",
    "Hors sentier, passages d'escalade jusqu'au degré II, terrain souvent délicat. Réservé aux montagnardes et montagnards expérimentés avec l'équipement adéquat.",
    "Fuori sentiero, passaggi di arrampicata fino al secondo grado, terreno spesso delicato. Solo per alpinisti esperti con l'attrezzatura adatta.",
    "Pathless, climbing moves up to grade II, often tricky terrain. Only for experienced mountain walkers with the right kit."
  ),
};

/** Kurzname der Schwierigkeit, z. B. «T2 · Bergwandern». */
export function sacScaleLabel(grade: SacGrade, lang: Language = "de"): string {
  return `${grade} · ${pick(SAC_NAMES[grade], lang)}`;
}

/** Was die Stufe im Gelände bedeutet – ein Satz, keine Wegbeschreibung. */
export function sacScaleDescription(
  grade: SacGrade,
  lang: Language = "de"
): string {
  return pick(SAC_DESCRIPTIONS[grade], lang);
}

/**
 * Zahl aus einem OSM-Tag lesen: Komma oder Punkt als Dezimalzeichen, Einheit
 * optional. `defaultUnit` gilt, wenn keine Einheit dabeisteht – bei `distance`
 * sind das Kilometer, bei `ascent`/`descent` Meter. Alles andere (Meilen,
 * Bereiche wie «5-7», Freitext) ergibt null.
 */
function parseTaggedLength(
  value: unknown,
  defaultUnit: "km" | "m"
): number | null {
  if (typeof value !== "string") return null;
  const match = /^(\d+(?:[.,]\d+)?)\s*(km|m)?$/i.exec(value.trim());
  if (!match) return null;
  const amount = Number(match[1].replace(",", "."));
  if (!Number.isFinite(amount)) return null;
  const unit = (match[2] ?? defaultUnit).toLowerCase();
  return unit === "km" ? amount * 1000 : amount;
}

/** `distance`-Tag einer Route in Meter (ohne Einheit gelten Kilometer). */
export function parseOsmDistanceMeters(value: unknown): number | null {
  return parseTaggedLength(value, "km");
}

/** `ascent`/`descent`-Tag in Meter (ohne Einheit gelten Meter). */
export function parseOsmElevationMeters(value: unknown): number | null {
  return parseTaggedLength(value, "m");
}

/**
 * Länge einer Wegführung in Metern. Die Wegstücke (Overpass liefert je
 * Relations-Mitglied eine eigene Punktreihe) werden EINZELN gemessen und
 * summiert – zwischen zwei Stücken liegt keine bekannte Strecke, die Lücke
 * darf nicht mitgezählt werden.
 */
export function routeLengthMeters(segments: GeoPoint[][]): number {
  let total = 0;
  for (let s = 0; s < segments.length; s++) {
    const points = segments[s];
    for (let i = 1; i < points.length; i++) {
      total += distanceMeters(
        points[i - 1].lat,
        points[i - 1].lon,
        points[i].lat,
        points[i].lon
      );
    }
  }
  return total;
}

/**
 * Nächster Punkt der Wegführung zu einem Ort – das ist der Einstieg, zu dem
 * die Anreise-Navigation führt, und zugleich die ehrliche «Distanz zum Platz»
 * (die Mitte einer Route sagt darüber nichts aus).
 * Ohne Punkte kommt null zurück.
 */
export function nearestRoutePoint(
  segments: GeoPoint[][],
  lat: number,
  lon: number
): { point: GeoPoint; distanceM: number } | null {
  let best: { point: GeoPoint; distanceM: number } | null = null;
  for (let s = 0; s < segments.length; s++) {
    const points = segments[s];
    for (let i = 0; i < points.length; i++) {
      const d = distanceMeters(lat, lon, points[i].lat, points[i].lon);
      if (!best || d < best.distanceM)
        best = { point: points[i], distanceM: d };
    }
  }
  return best;
}
