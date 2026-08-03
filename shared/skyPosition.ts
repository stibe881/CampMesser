/**
 * Himmelsrechnung für den Sternbild-Finder (#225): rechnet aus den
 * Äquatorialkoordinaten eines Objekts (Rektaszension/Deklination, Epoche
 * J2000), dem Beobachterort und dem Zeitpunkt die Horizontkoordinaten
 * (Azimut 0 = Nord im Uhrzeigersinn, Höhe über dem Horizont).
 *
 * Alles ist reine Rechnerei – offline, ohne Abfrage, ohne DOM. Die Genauigkeit
 * liegt im Bereich weniger Bogenminuten und damit weit unter dem, was ein
 * Handy-Kompass (± 5–15°) auflöst. Bewusst weggelassen: Präzession seit J2000
 * (bis 2050 unter 0.4°), Nutation, Refraktion und Parallaxe – für «welches
 * Sternbild steht in dieser Richtung» spielt das keine Rolle.
 *
 * Anzeigetexte (Name, Erkennungshilfe) sind L4 – Anzeige via `pick(..., lang)`.
 */
import { l4, type L4 } from "./i18n";

const rad = Math.PI / 180;
const deg = 180 / Math.PI;
const DAY_MS = 86400000;
const J1970 = 2440588;
const J2000 = 2451545;

/** Schiefe der Ekliptik zur Epoche J2000 in Grad. */
export const OBLIQUITY_DEG = 23.43928;

/** Winkel auf [0, 360) bringen (auch für negative Werte). */
function norm360(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

/** Stundenwert auf [0, 24) bringen. */
function norm24(hours: number): number {
  return ((hours % 24) + 24) % 24;
}

/** Julianisches Datum eines Zeitpunkts (UT). */
export function julianDay(date: Date): number {
  return date.getTime() / DAY_MS - 0.5 + J1970;
}

/** Tage seit der Standardepoche J2000.0 (2000-01-01 12:00 UT). */
export function daysSinceJ2000(date: Date): number {
  return julianDay(date) - J2000;
}

/**
 * Mittlere Sternzeit von Greenwich in Stunden (0–24).
 * Lineare Näherung nach IAU: GMST = 280.46061837° + 360.98564736629° · d.
 */
export function greenwichSiderealTimeHours(date: Date): number {
  const d = daysSinceJ2000(date);
  return norm24(norm360(280.46061837 + 360.98564736629 * d) / 15);
}

/**
 * Örtliche Sternzeit in Stunden (0–24): Greenwich-Sternzeit plus geografische
 * Länge (Ost positiv). Sie sagt, welche Rektaszension gerade im Meridian steht.
 */
export function localSiderealTimeHours(date: Date, lonDeg: number): number {
  return norm24(greenwichSiderealTimeHours(date) + lonDeg / 15);
}

/** Horizontkoordinaten eines Objekts. */
export interface HorizontalPosition {
  /** Azimut in Grad: 0 = Nord, 90 = Ost, 180 = Süd, 270 = West */
  azimuth: number;
  /** Höhe über dem Horizont in Grad (negativ = unter dem Horizont) */
  altitude: number;
}

/** Äquatorialkoordinaten eines Objekts (Epoche J2000). */
export interface EquatorialPosition {
  /** Rektaszension in Stunden (0–24) */
  raHours: number;
  /** Deklination in Grad (−90 bis +90) */
  decDeg: number;
  /** Abstand zur Erde in astronomischen Einheiten (nur für Planeten/Sonne) */
  distanceAu?: number;
}

/**
 * Äquatorial- in Horizontkoordinaten umrechnen: aus Rektaszension und
 * Deklination des Objekts, dem Beobachterort und dem Zeitpunkt.
 * Über den Stundenwinkel H = Sternzeit − Rektaszension.
 */
export function equatorialToHorizontal(
  raHours: number,
  decDeg: number,
  latDeg: number,
  lonDeg: number,
  date: Date
): HorizontalPosition {
  const hourAngle = (localSiderealTimeHours(date, lonDeg) - raHours) * 15 * rad;
  const dec = decDeg * rad;
  const phi = latDeg * rad;
  const altitude =
    Math.asin(
      Math.sin(phi) * Math.sin(dec) +
        Math.cos(phi) * Math.cos(dec) * Math.cos(hourAngle)
    ) * deg;
  // Rohwert zählt ab Süd – wie in client/src/lib/sun.ts auf 0 = Nord drehen
  const azimuthFromSouth =
    Math.atan2(
      Math.sin(hourAngle),
      Math.cos(hourAngle) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi)
    ) * deg;
  return { azimuth: norm360(azimuthFromSouth + 180), altitude };
}

/**
 * Winkelabstand zweier Horizontpositionen in Grad (sphärischer Kosinussatz).
 * Damit findet der Finder das Objekt, das der Blickrichtung am nächsten steht.
 */
export function angularSeparationDeg(
  a: HorizontalPosition,
  b: HorizontalPosition
): number {
  const altA = a.altitude * rad;
  const altB = b.altitude * rad;
  const dAz = (a.azimuth - b.azimuth) * rad;
  const cosine =
    Math.sin(altA) * Math.sin(altB) +
    Math.cos(altA) * Math.cos(altB) * Math.cos(dAz);
  return Math.acos(Math.min(1, Math.max(-1, cosine))) * deg;
}

/**
 * Blickhöhe aus der Geräte-Neigung: `deviceorientation` liefert beta (Kippen
 * nach vorn/hinten) und gamma (Kippen zur Seite). Gesucht ist die Höhe der
 * Richtung, in die die RÜCKSEITE des Geräts zeigt – dorthin schaut man, wenn
 * man das Handy an den Himmel hält.
 *
 * Aus der W3C-Rotationsmatrix (Z-X'-Y''-Folge) ergibt sich für die Rückseite
 * die Höhen-Komponente −cos(beta)·cos(gamma); sie hängt nicht von alpha ab,
 * die Himmelsrichtung liefert getrennt der Kompass. Flach mit dem Bildschirm
 * nach oben (beta = 0) → −90° (Blick zum Boden), senkrecht gehalten
 * (beta = 90) → 0° (Blick zum Horizont), nach hinten gekippt (beta = 180)
 * → +90° (Blick zum Zenit).
 */
export function deviceViewAltitude(beta: number, gamma: number): number {
  const value = -Math.cos(beta * rad) * Math.cos(gamma * rad);
  return Math.asin(Math.min(1, Math.max(-1, value))) * deg;
}

// ─────────────────────────── Planeten ───────────────────────────

export type PlanetId = "merkur" | "venus" | "mars" | "jupiter" | "saturn";

/**
 * Keplersche Bahnelemente und ihre Änderung pro Jahrhundert (JPL, gültig
 * 1800–2050): grosse Halbachse a [AE], Exzentrizität e, Bahnneigung i [°],
 * mittlere Länge L [°], Länge des Perihels ϖ [°], Länge des aufsteigenden
 * Knotens Ω [°]. Die Erde steht mit in der Tabelle: Ohne ihre Position gäbe
 * es keine geozentrische Sicht.
 */
interface OrbitElements {
  a: number;
  aRate: number;
  e: number;
  eRate: number;
  i: number;
  iRate: number;
  l: number;
  lRate: number;
  peri: number;
  periRate: number;
  node: number;
  nodeRate: number;
}

const ORBITS: Record<PlanetId | "erde", OrbitElements> = {
  merkur: {
    a: 0.38709927,
    aRate: 0.00000037,
    e: 0.20563593,
    eRate: 0.00001906,
    i: 7.00497902,
    iRate: -0.00594749,
    l: 252.2503235,
    lRate: 149472.67411175,
    peri: 77.45779628,
    periRate: 0.16047689,
    node: 48.33076593,
    nodeRate: -0.12534081,
  },
  venus: {
    a: 0.72333566,
    aRate: 0.0000039,
    e: 0.00677672,
    eRate: -0.00004107,
    i: 3.39467605,
    iRate: -0.0007889,
    l: 181.9790995,
    lRate: 58517.81538729,
    peri: 131.60246718,
    periRate: 0.00268329,
    node: 76.67984255,
    nodeRate: -0.27769418,
  },
  erde: {
    a: 1.00000261,
    aRate: 0.00000562,
    e: 0.01671123,
    eRate: -0.00004392,
    i: -0.00001531,
    iRate: -0.01294668,
    l: 100.46457166,
    lRate: 35999.37244981,
    peri: 102.93768193,
    periRate: 0.32327364,
    node: 0,
    nodeRate: 0,
  },
  mars: {
    a: 1.52371034,
    aRate: 0.00001847,
    e: 0.0933941,
    eRate: 0.00007882,
    i: 1.84969142,
    iRate: -0.00813131,
    l: -4.55343205,
    lRate: 19140.30268499,
    peri: -23.94362959,
    periRate: 0.44441088,
    node: 49.55953891,
    nodeRate: -0.29257343,
  },
  jupiter: {
    a: 5.202887,
    aRate: -0.00011607,
    e: 0.04838624,
    eRate: -0.00013253,
    i: 1.30439695,
    iRate: -0.00183714,
    l: 34.39644051,
    lRate: 3034.74612775,
    peri: 14.72847983,
    periRate: 0.21252668,
    node: 100.47390909,
    nodeRate: 0.20469106,
  },
  saturn: {
    a: 9.53667594,
    aRate: -0.0012506,
    e: 0.05386179,
    eRate: -0.00050991,
    i: 2.48599187,
    iRate: 0.00193609,
    l: 49.95424423,
    lRate: 1222.49362201,
    peri: 92.59887831,
    periRate: -0.41897216,
    node: 113.66242448,
    nodeRate: -0.28867794,
  },
};

/** Kartesische Koordinaten in der Ekliptikebene (J2000), in AE. */
interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Heliozentrische Ekliptikkoordinaten eines Körpers zur Zeit `date`.
 * Kepler-Gleichung iterativ nach Newton – bei den kleinen Exzentrizitäten
 * der grossen Planeten reichen wenige Schritte auf Bogensekunden genau.
 */
function heliocentric(body: PlanetId | "erde", date: Date): Vector3 {
  const el = ORBITS[body];
  const centuries = daysSinceJ2000(date) / 36525;
  const a = el.a + el.aRate * centuries;
  const e = el.e + el.eRate * centuries;
  const inc = (el.i + el.iRate * centuries) * rad;
  const meanLong = el.l + el.lRate * centuries;
  const peri = el.peri + el.periRate * centuries;
  const node = (el.node + el.nodeRate * centuries) * rad;
  // Argument des Perihels und mittlere Anomalie auf ±180° normieren
  const argPeri = (peri - (el.node + el.nodeRate * centuries)) * rad;
  const meanAnomaly = (norm360(meanLong - peri + 180) - 180) * rad;

  let eccAnomaly = meanAnomaly + e * Math.sin(meanAnomaly);
  for (let step = 0; step < 8; step++) {
    const delta =
      (eccAnomaly - e * Math.sin(eccAnomaly) - meanAnomaly) /
      (1 - e * Math.cos(eccAnomaly));
    eccAnomaly -= delta;
    if (Math.abs(delta) < 1e-12) break;
  }

  // Position in der Bahnebene
  const xOrbit = a * (Math.cos(eccAnomaly) - e);
  const yOrbit = a * Math.sqrt(1 - e * e) * Math.sin(eccAnomaly);

  const cosArg = Math.cos(argPeri);
  const sinArg = Math.sin(argPeri);
  const cosNode = Math.cos(node);
  const sinNode = Math.sin(node);
  const cosInc = Math.cos(inc);
  const sinInc = Math.sin(inc);
  return {
    x:
      (cosArg * cosNode - sinArg * sinNode * cosInc) * xOrbit +
      (-sinArg * cosNode - cosArg * sinNode * cosInc) * yOrbit,
    y:
      (cosArg * sinNode + sinArg * cosNode * cosInc) * xOrbit +
      (-sinArg * sinNode + cosArg * cosNode * cosInc) * yOrbit,
    z: sinArg * sinInc * xOrbit + cosArg * sinInc * yOrbit,
  };
}

/** Geozentrischen Ekliptikvektor in Rektaszension/Deklination umrechnen. */
function equatorialFromEcliptic(v: Vector3): EquatorialPosition {
  const eps = OBLIQUITY_DEG * rad;
  const xEq = v.x;
  const yEq = v.y * Math.cos(eps) - v.z * Math.sin(eps);
  const zEq = v.y * Math.sin(eps) + v.z * Math.cos(eps);
  const distance = Math.sqrt(xEq * xEq + yEq * yEq + zEq * zEq);
  return {
    raHours: norm24((Math.atan2(yEq, xEq) * deg) / 15),
    decDeg: Math.asin(zEq / distance) * deg,
    distanceAu: distance,
  };
}

/** Geozentrische Position eines Planeten (Rektaszension/Deklination/Abstand). */
export function planetEquatorial(
  planet: PlanetId,
  date: Date
): EquatorialPosition {
  const body = heliocentric(planet, date);
  const earth = heliocentric("erde", date);
  return equatorialFromEcliptic({
    x: body.x - earth.x,
    y: body.y - earth.y,
    z: body.z - earth.z,
  });
}

/**
 * Geozentrische Position der Sonne – der Erdvektor mit umgekehrtem Vorzeichen.
 * Wird gebraucht, um zu entscheiden, ob es überhaupt dunkel genug ist.
 */
export function sunEquatorial(date: Date): EquatorialPosition {
  const earth = heliocentric("erde", date);
  return equatorialFromEcliptic({ x: -earth.x, y: -earth.y, z: -earth.z });
}

/** Sonnenstand am Beobachterort (Azimut/Höhe). */
export function sunHorizontal(
  date: Date,
  latDeg: number,
  lonDeg: number
): HorizontalPosition {
  const sun = sunEquatorial(date);
  return equatorialToHorizontal(sun.raHours, sun.decDeg, latDeg, lonDeg, date);
}

/**
 * Sonnenhöhe, unter der der Himmel dunkel genug für Sternbilder ist
 * (nautische Dämmerung – hellere Sterne stehen dann schon).
 */
export const DARK_SKY_SUN_ALTITUDE_DEG = -8;

/** Ist es am Ort dunkel genug, um Sternbilder zu erkennen? */
export function isDarkEnough(
  date: Date,
  latDeg: number,
  lonDeg: number
): boolean {
  return (
    sunHorizontal(date, latDeg, lonDeg).altitude < DARK_SKY_SUN_ALTITUDE_DEG
  );
}

// ─────────────────────────── Objektkatalog ───────────────────────────

export type SkyObjectKind = "constellation" | "star" | "cluster" | "planet";

export interface SkyObject {
  id: string;
  kind: SkyObjectKind;
  name: L4;
  /** Kurze Erkennungshilfe – woran man das Objekt am Himmel erkennt */
  hint: L4;
  /** Rektaszension in Stunden (feste Objekte; Planeten rechnen stattdessen) */
  raHours?: number;
  /** Deklination in Grad (feste Objekte) */
  decDeg?: number;
  /** Planet, dessen Position laufend gerechnet wird */
  planet?: PlanetId;
  /** Id des zugehörigen Eintrags im Natur-Lexikon (client/src/data/nature.ts) */
  natureEntryId?: string;
}

/**
 * Der Bestand des Finders: zuerst die fünf Sternbilder, die das Natur-Lexikon
 * schon führt (mit Verweis darauf), dann weitere gut erkennbare Muster und
 * Leitsterne, zum Schluss die hellsten Planeten.
 *
 * Die Koordinaten bezeichnen die MITTE des Musters (nicht einen einzelnen
 * Stern) – gesucht ist ja «was steht in dieser Richtung», nicht eine
 * Sternposition auf die Bogenminute genau.
 */
export const skyObjects: SkyObject[] = [
  {
    id: "grosser-wagen",
    kind: "constellation",
    name: l4(
      "Grosser Wagen",
      "Grand Chariot",
      "Grande Carro",
      "The Plough (Big Dipper)"
    ),
    hint: l4(
      "Sieben helle Sterne als Kasten mit Deichsel – der beste Startpunkt am Nordhimmel.",
      "Sept étoiles brillantes en chariot avec timon – le meilleur point de départ dans le ciel du nord.",
      "Sette stelle luminose a forma di carro con timone – il miglior punto di partenza nel cielo settentrionale.",
      "Seven bright stars forming a box with a handle – the best starting point in the northern sky."
    ),
    raHours: 12.5,
    decDeg: 56,
    natureEntryId: "grosser-wagen",
  },
  {
    id: "polarstern",
    kind: "star",
    name: l4(
      "Polarstern",
      "Étoile polaire",
      "Stella polare",
      "Pole Star (Polaris)"
    ),
    hint: l4(
      "Steht immer im Norden, immer gleich hoch – so hoch, wie du nördlich vom Äquator bist.",
      "Toujours au nord, toujours à la même hauteur – aussi haut que ta latitude nord.",
      "Sempre a nord, sempre alla stessa altezza – tanto alta quanto la tua latitudine nord.",
      "Always due north, always at the same height – as high as your northern latitude."
    ),
    raHours: 2.5303,
    decDeg: 89.264,
    natureEntryId: "polarstern",
  },
  {
    id: "kassiopeia",
    kind: "constellation",
    name: l4("Kassiopeia", "Cassiopée", "Cassiopea", "Cassiopeia"),
    hint: l4(
      "Fünf Sterne als deutliches W (oder M) – dem Grossen Wagen genau gegenüber.",
      "Cinq étoiles formant un W bien net (ou un M) – juste à l'opposé du Grand Chariot.",
      "Cinque stelle a forma di netta W (o M) – esattamente di fronte al Grande Carro.",
      "Five stars forming a clear W (or M) – exactly opposite the Plough."
    ),
    raHours: 0.95,
    decDeg: 60.5,
    natureEntryId: "kassiopeia",
  },
  {
    id: "orion",
    kind: "constellation",
    name: l4("Orion", "Orion", "Orione", "Orion"),
    hint: l4(
      "Drei gleich helle Sterne dicht in einer Reihe – der Gürtel des Jägers.",
      "Trois étoiles d'égale brillance serrées en ligne – la ceinture du chasseur.",
      "Tre stelle ugualmente luminose in fila stretta – la cintura del cacciatore.",
      "Three equally bright stars close in a row – the hunter's belt."
    ),
    raHours: 5.6,
    decDeg: -1.2,
    natureEntryId: "orion",
  },
  {
    id: "sommerdreieck",
    kind: "constellation",
    name: l4(
      "Sommerdreieck",
      "Triangle d'été",
      "Triangolo estivo",
      "Summer Triangle"
    ),
    hint: l4(
      "Drei sehr helle Sterne (Wega, Deneb, Atair) als riesiges Dreieck hoch im Süden.",
      "Trois étoiles très brillantes (Véga, Deneb, Altaïr) en triangle géant haut au sud.",
      "Tre stelle molto luminose (Vega, Deneb, Altair) in un triangolo gigantesco alto a sud.",
      "Three very bright stars (Vega, Deneb, Altair) forming a giant triangle high in the south."
    ),
    raHours: 19.72,
    decDeg: 31,
    natureEntryId: "sommerdreieck",
  },
  {
    id: "perseus",
    kind: "constellation",
    name: l4("Perseus", "Persée", "Perseo", "Perseus"),
    hint: l4(
      "Leicht geknickter Sternenbogen zwischen Kassiopeia und den Plejaden.",
      "Arc d'étoiles légèrement plié entre Cassiopée et les Pléiades.",
      "Arco di stelle leggermente piegato tra Cassiopea e le Pleiadi.",
      "Slightly bent arc of stars between Cassiopeia and the Pleiades."
    ),
    raHours: 3.4,
    decDeg: 45,
    natureEntryId: "perseus",
  },
  {
    id: "plejaden",
    kind: "cluster",
    name: l4("Plejaden", "Pléiades", "Pleiadi", "Pleiades"),
    hint: l4(
      "Winziges Sternhäufchen wie ein Mini-Wagen – mit blossem Auge sechs bis sieben Sterne.",
      "Minuscule amas d'étoiles comme un petit chariot – six à sept étoiles à l'œil nu.",
      "Minuscolo ammasso di stelle come un carro in miniatura – sei o sette stelle a occhio nudo.",
      "Tiny star cluster like a miniature dipper – six or seven stars with the naked eye."
    ),
    raHours: 3.79,
    decDeg: 24.1,
    natureEntryId: "plejaden",
  },
  {
    id: "fuhrmann",
    kind: "constellation",
    name: l4("Fuhrmann", "Cocher", "Auriga", "Auriga (the Charioteer)"),
    hint: l4(
      "Grosses Fünfeck mit der sehr hellen Kapella – im Winter fast im Zenit.",
      "Grand pentagone avec la très brillante Capella – presque au zénith en hiver.",
      "Grande pentagono con la luminosissima Capella – d'inverno quasi allo zenit.",
      "Large pentagon with the very bright Capella – almost overhead in winter."
    ),
    raHours: 5.28,
    decDeg: 46,
  },
  {
    id: "zwillinge",
    kind: "constellation",
    name: l4("Zwillinge", "Gémeaux", "Gemelli", "Gemini"),
    hint: l4(
      "Zwei fast gleich helle Sterne dicht nebeneinander (Kastor und Pollux), daran zwei Sternreihen.",
      "Deux étoiles presque aussi brillantes côte à côte (Castor et Pollux), suivies de deux rangées d'étoiles.",
      "Due stelle quasi ugualmente luminose vicine (Castore e Polluce), da cui partono due file di stelle.",
      "Two almost equally bright stars side by side (Castor and Pollux) with two rows of stars trailing off."
    ),
    raHours: 7.35,
    decDeg: 25,
  },
  {
    id: "grosser-hund",
    kind: "constellation",
    name: l4("Grosser Hund", "Grand Chien", "Cane Maggiore", "Canis Major"),
    hint: l4(
      "Sirius, der hellste Stern des Nachthimmels – tief im Süden, funkelt stark in allen Farben.",
      "Sirius, l'étoile la plus brillante du ciel nocturne – bas au sud, scintille fortement de toutes les couleurs.",
      "Sirio, la stella più luminosa del cielo notturno – bassa a sud, scintilla forte in tutti i colori.",
      "Sirius, the brightest star in the night sky – low in the south, twinkling strongly in all colours."
    ),
    raHours: 6.752,
    decDeg: -16.72,
  },
  {
    id: "loewe",
    kind: "constellation",
    name: l4("Löwe", "Lion", "Leone", "Leo"),
    hint: l4(
      "Vorne ein Fragezeichen rückwärts (die Sichel), hinten ein Dreieck – Frühlingssternbild.",
      "Devant un point d'interrogation inversé (la faucille), derrière un triangle – constellation du printemps.",
      "Davanti un punto interrogativo rovesciato (la falce), dietro un triangolo – costellazione primaverile.",
      "A backwards question mark at the front (the Sickle) and a triangle at the back – a spring constellation."
    ),
    raHours: 10.4,
    decDeg: 14,
  },
  {
    id: "baerenhueter",
    kind: "constellation",
    name: l4("Bärenhüter", "Bouvier", "Boote", "Boötes"),
    hint: l4(
      "Grosse Eistüte mit dem orangen Arktur an der Spitze – vom Grossen Wagen dem Deichselbogen folgen.",
      "Grand cornet de glace avec l'orange Arcturus à la pointe – suis la courbe du timon du Grand Chariot.",
      "Grande cono gelato con l'arancione Arturo sulla punta – segui la curva del timone del Grande Carro.",
      "A big ice cream cone with orange Arcturus at the tip – follow the curve of the Plough's handle."
    ),
    raHours: 14.26,
    decDeg: 19.18,
  },
  {
    id: "schwan",
    kind: "constellation",
    name: l4("Schwan", "Cygne", "Cigno", "Cygnus"),
    hint: l4(
      "Grosses Kreuz mitten in der Milchstrasse – auch «Kreuz des Nordens» genannt.",
      "Grande croix au milieu de la Voie lactée – aussi appelée « Croix du Nord ».",
      "Grande croce in mezzo alla Via Lattea – detta anche «Croce del Nord».",
      "A large cross in the middle of the Milky Way – also called the Northern Cross."
    ),
    raHours: 20.5,
    decDeg: 42,
  },
  {
    id: "skorpion",
    kind: "constellation",
    name: l4("Skorpion", "Scorpion", "Scorpione", "Scorpius"),
    hint: l4(
      "Roter Antares mit geschwungenem Schwanz – bleibt bei uns immer tief über dem Südhorizont.",
      "Antarès rouge avec une queue recourbée – reste toujours bas sur l'horizon sud chez nous.",
      "Antares rosso con la coda ricurva – da noi resta sempre basso sull'orizzonte sud.",
      "Red Antares with a curved tail – from here it always stays low above the southern horizon."
    ),
    raHours: 16.5,
    decDeg: -26.4,
  },
  {
    id: "andromeda-galaxie",
    kind: "cluster",
    name: l4(
      "Andromeda-Galaxie",
      "Galaxie d'Andromède",
      "Galassia di Andromeda",
      "Andromeda Galaxy"
    ),
    hint: l4(
      "Blasser Nebelfleck neben Kassiopeia – das fernste Ding, das man ohne Fernrohr sieht.",
      "Petite tache floue à côté de Cassiopée – l'objet le plus lointain visible sans télescope.",
      "Debole macchia nebulosa accanto a Cassiopea – l'oggetto più lontano visibile senza telescopio.",
      "A faint smudge of light next to Cassiopeia – the most distant thing visible without a telescope."
    ),
    raHours: 0.712,
    decDeg: 41.27,
  },
  {
    id: "venus",
    kind: "planet",
    name: l4("Venus", "Vénus", "Venere", "Venus"),
    hint: l4(
      "Der mit Abstand hellste Punkt am Himmel – nur kurz nach Sonnenuntergang oder vor Sonnenaufgang.",
      "De loin le point le plus brillant du ciel – seulement peu après le coucher ou avant le lever du soleil.",
      "Di gran lunga il punto più luminoso del cielo – solo poco dopo il tramonto o prima dell'alba.",
      "By far the brightest point in the sky – only shortly after sunset or before sunrise."
    ),
    planet: "venus",
  },
  {
    id: "jupiter",
    kind: "planet",
    name: l4("Jupiter", "Jupiter", "Giove", "Jupiter"),
    hint: l4(
      "Sehr hell und ruhig – funkelt nicht. Mit dem Feldstecher siehst du seine vier grössten Monde.",
      "Très brillant et calme – il ne scintille pas. Avec des jumelles, tu vois ses quatre plus grandes lunes.",
      "Molto luminoso e tranquillo – non scintilla. Con il binocolo vedi le sue quattro lune maggiori.",
      "Very bright and steady – it does not twinkle. With binoculars you can see its four largest moons."
    ),
    planet: "jupiter",
  },
  {
    id: "mars",
    kind: "planet",
    name: l4("Mars", "Mars", "Marte", "Mars"),
    hint: l4(
      "Deutlich orangeroter Punkt – wie hell er ist, wechselt im Lauf der Jahre stark.",
      "Point nettement rouge orangé – son éclat varie fortement au fil des années.",
      "Punto nettamente rosso-arancione – la sua luminosità cambia molto nel corso degli anni.",
      "A distinctly orange-red point – its brightness varies a lot from year to year."
    ),
    planet: "mars",
  },
  {
    id: "saturn",
    kind: "planet",
    name: l4("Saturn", "Saturne", "Saturno", "Saturn"),
    hint: l4(
      "Ruhiger gelblicher Punkt – schon ein kleines Fernrohr zeigt seine Ringe.",
      "Point jaunâtre et calme – une petite lunette suffit à montrer ses anneaux.",
      "Punto giallastro e tranquillo – basta un piccolo telescopio per vedere i suoi anelli.",
      "A steady yellowish point – even a small telescope shows its rings."
    ),
    planet: "saturn",
  },
  {
    id: "merkur",
    kind: "planet",
    name: l4("Merkur", "Mercure", "Mercurio", "Mercury"),
    hint: l4(
      "Bleibt immer dicht bei der Sonne – nur in der Dämmerung ganz tief am Horizont zu erwischen.",
      "Reste toujours près du soleil – à saisir seulement au crépuscule, tout bas sur l'horizon.",
      "Resta sempre vicino al sole – da cogliere solo al crepuscolo, molto basso sull'orizzonte.",
      "Always stays close to the sun – only catchable at twilight, very low on the horizon."
    ),
    planet: "merkur",
  },
];

/** Ein Objekt mit seiner Position am Himmel zum gefragten Zeitpunkt. */
export interface SkySighting {
  object: SkyObject;
  position: HorizontalPosition;
}

/** Position eines Katalog-Objekts (fest oder Planet) am Beobachterort. */
export function skyObjectPosition(
  object: SkyObject,
  date: Date,
  latDeg: number,
  lonDeg: number
): HorizontalPosition {
  const equatorial = object.planet
    ? planetEquatorial(object.planet, date)
    : { raHours: object.raHours ?? 0, decDeg: object.decDeg ?? 0 };
  return equatorialToHorizontal(
    equatorial.raHours,
    equatorial.decDeg,
    latDeg,
    lonDeg,
    date
  );
}

/** Alle Katalog-Objekte mit Position, absteigend nach Höhe sortiert. */
export function skyObjectsAt(
  date: Date,
  latDeg: number,
  lonDeg: number
): SkySighting[] {
  return skyObjects
    .map(object => ({
      object,
      position: skyObjectPosition(object, date, latDeg, lonDeg),
    }))
    .sort((a, b) => b.position.altitude - a.position.altitude);
}

/** Mindesthöhe, ab der ein Objekt frei über Bäumen und Häusern steht. */
export const MIN_VISIBLE_ALTITUDE_DEG = 10;

/** Objekte, die zum Zeitpunkt hoch genug über dem Horizont stehen. */
export function visibleSkyObjects(
  date: Date,
  latDeg: number,
  lonDeg: number,
  minAltitudeDeg = MIN_VISIBLE_ALTITUDE_DEG
): SkySighting[] {
  return skyObjectsAt(date, latDeg, lonDeg).filter(
    sighting => sighting.position.altitude >= minAltitudeDeg
  );
}

/**
 * Referenzzeitpunkt für «heute Nacht»: Ist es bereits Nacht (ab 21 Uhr oder
 * vor 6 Uhr Ortszeit), gilt der Zeitpunkt selbst – sonst 23 Uhr desselben
 * Kalendertags. So zeigt die Liste am Nachmittag den kommenden Abend und
 * nachts das, was gerade wirklich am Himmel steht.
 */
export function nightReferenceTime(now: Date): Date {
  const hour = now.getHours();
  if (hour >= 21 || hour < 6) return new Date(now.getTime());
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    0,
    0,
    0
  );
}

/**
 * Blickrichtung → Objekt: das Katalog-Objekt, das dem angepeilten Punkt am
 * nächsten steht, sofern es innerhalb von `toleranceDeg` liegt. Der Kompass
 * eines Handys ist auf 10–15° genau; ein grosszügiges Sichtfeld ist deshalb
 * ehrlicher als eine Punktgenauigkeit, die es gar nicht gibt.
 */
export const VIEW_TOLERANCE_DEG = 25;

export function objectInView(
  sightings: SkySighting[],
  azimuth: number,
  altitude: number,
  toleranceDeg = VIEW_TOLERANCE_DEG
): { sighting: SkySighting; separationDeg: number } | null {
  const view: HorizontalPosition = { azimuth, altitude };
  let best: { sighting: SkySighting; separationDeg: number } | null = null;
  sightings.forEach(sighting => {
    // Objekte unter dem Horizont sind auch dann nicht zu sehen, wenn man
    // in ihre Richtung hält – der Boden ist im Weg.
    if (sighting.position.altitude < 0) return;
    const separationDeg = angularSeparationDeg(view, sighting.position);
    if (separationDeg > toleranceDeg) return;
    if (best === null || separationDeg < best.separationDeg) {
      best = { sighting, separationDeg };
    }
  });
  return best;
}
