/**
 * Dunkelheitskarte pro Platz (#239): Wie dunkel ist der Himmel dort, wo das
 * Zelt steht? Eingestuft wird nach der Bortle-Skala (1 = ausgezeichnet
 * dunkel bis 9 = Innenstadt).
 *
 * WICHTIG – was das hier ist und was nicht: Es gibt keine frei abrufbare
 * Schnittstelle für gemessene Himmelshelligkeit (die bekannten Karten beruhen
 * auf Satellitendaten mit Lizenz und Schlüssel). Diese Einstufung ist deshalb
 * eine SCHÄTZUNG aus offenen Daten: einem gepflegten Datensatz der grössten
 * Schweizer und grenznahen Agglomerationen (Name, Koordinaten, Einwohner) –
 * Lichtquellen also – und der Distanz dorthin. Sie kennt weder Berge, die
 * eine Lichtglocke abschirmen, noch einzelne Flutlichtanlagen, noch die
 * Luftfeuchtigkeit, die das Streulicht erst richtig verteilt. Die Oberfläche
 * benennt das Ergebnis durchgehend als Schätzung.
 *
 * Das Modell: Jede Lichtquelle trägt mit `Einwohner / (Distanz + 6 km)^2.5`
 * zur Aufhellung bei. Der Exponent 2.5 stammt aus dem Walkerschen Gesetz für
 * Lichtglocken, der Term «+ 6 km» steht für die Ausdehnung des beleuchteten
 * Gebiets und verhindert, dass die Formel im Stadtzentrum gegen unendlich
 * läuft. Die Beiträge aller Quellen werden addiert und über feste Schwellen
 * in die Bortle-Klasse übersetzt.
 */
import { distanceMeters } from "./geo";
import { l4, pick, type L4, type Language } from "./i18n";

/** Eine Lichtquelle: Ortsname (Eigenname), Koordinaten, Einwohnerzahl. */
export interface LightSource {
  name: string;
  lat: number;
  lon: number;
  /**
   * Einwohner der AGGLOMERATION, nicht der politischen Gemeinde – erhellt
   * wird der Himmel vom ganzen zusammenhängenden Siedlungsgebiet.
   * Gerundete Grössenordnungen; auf die letzte Person kommt es nicht an.
   */
  population: number;
}

/**
 * Grösste Lichtquellen der Schweiz und im grenznahen Ausland – gerundete
 * Agglomerations-Einwohnerzahlen. Bewusst gepflegt statt abgerufen: die Liste
 * ändert sich in Jahren, nicht in Tagen, und der Platz-Dossier soll auch
 * offline eine Einstufung zeigen. Kleine Orte sind nur dort aufgeführt, wo
 * sonst weit und breit nichts wäre (Alpentäler, Feriengebiete).
 */
export const LIGHT_SOURCES: LightSource[] = [
  // Schweiz – grosse Agglomerationen
  { name: "Zürich", lat: 47.377, lon: 8.54, population: 1400000 },
  { name: "Genève", lat: 46.204, lon: 6.143, population: 600000 },
  { name: "Basel", lat: 47.559, lon: 7.588, population: 550000 },
  { name: "Bern", lat: 46.948, lon: 7.447, population: 420000 },
  { name: "Lausanne", lat: 46.52, lon: 6.633, population: 420000 },
  { name: "Luzern", lat: 47.05, lon: 8.307, population: 230000 },
  { name: "St. Gallen", lat: 47.424, lon: 9.377, population: 165000 },
  { name: "Winterthur", lat: 47.5, lon: 8.724, population: 150000 },
  { name: "Lugano", lat: 46.005, lon: 8.951, population: 150000 },
  { name: "Baden-Brugg", lat: 47.476, lon: 8.306, population: 110000 },
  { name: "Biel/Bienne", lat: 47.137, lon: 7.247, population: 110000 },
  { name: "Fribourg", lat: 46.806, lon: 7.161, population: 110000 },
  { name: "Thun", lat: 46.758, lon: 7.628, population: 100000 },
  { name: "Zug", lat: 47.166, lon: 8.516, population: 100000 },
  { name: "Vevey-Montreux", lat: 46.443, lon: 6.845, population: 90000 },
  { name: "Aarau", lat: 47.391, lon: 8.045, population: 85000 },
  { name: "Neuchâtel", lat: 46.992, lon: 6.931, population: 80000 },
  { name: "Schaffhausen", lat: 47.697, lon: 8.635, population: 80000 },
  { name: "Solothurn", lat: 47.208, lon: 7.537, population: 75000 },
  { name: "Olten-Zofingen", lat: 47.35, lon: 7.904, population: 60000 },
  { name: "Sion", lat: 46.233, lon: 7.36, population: 60000 },
  { name: "Locarno", lat: 46.171, lon: 8.799, population: 60000 },
  { name: "Chur", lat: 46.851, lon: 9.532, population: 55000 },
  { name: "Bellinzona", lat: 46.195, lon: 9.024, population: 55000 },
  { name: "La Chaux-de-Fonds", lat: 47.1, lon: 6.826, population: 50000 },
  { name: "Wil SG", lat: 47.463, lon: 9.045, population: 50000 },
  { name: "Frauenfeld", lat: 47.557, lon: 8.899, population: 45000 },
  { name: "Rapperswil-Jona", lat: 47.226, lon: 8.822, population: 45000 },
  { name: "Yverdon-les-Bains", lat: 46.778, lon: 6.641, population: 40000 },
  { name: "Brig-Visp", lat: 46.317, lon: 7.988, population: 35000 },
  { name: "Vaduz-Schaan", lat: 47.141, lon: 9.521, population: 30000 },
  { name: "Bulle", lat: 46.619, lon: 7.057, population: 30000 },
  { name: "Martigny", lat: 46.103, lon: 7.073, population: 25000 },
  { name: "Interlaken", lat: 46.686, lon: 7.863, population: 22000 },
  { name: "Grenchen", lat: 47.192, lon: 7.396, population: 17500 },
  { name: "Burgdorf", lat: 47.059, lon: 7.63, population: 16500 },
  { name: "Einsiedeln", lat: 47.128, lon: 8.752, population: 16000 },
  { name: "Langenthal", lat: 47.213, lon: 7.79, population: 16000 },
  { name: "Herisau", lat: 47.386, lon: 9.279, population: 15500 },
  { name: "Schwyz", lat: 47.021, lon: 8.653, population: 15000 },
  { name: "Liestal", lat: 47.484, lon: 7.735, population: 14500 },
  { name: "St. Moritz-Samedan", lat: 46.498, lon: 9.838, population: 14000 },
  { name: "Delémont", lat: 47.365, lon: 7.345, population: 12900 },
  { name: "Glarus", lat: 47.04, lon: 9.068, population: 12500 },
  { name: "Davos", lat: 46.803, lon: 9.837, population: 11000 },
  { name: "Sarnen", lat: 46.896, lon: 8.246, population: 10500 },
  { name: "Altdorf", lat: 46.881, lon: 8.644, population: 9700 },
  { name: "Stans", lat: 46.958, lon: 8.366, population: 8500 },
  { name: "Saanen-Gstaad", lat: 46.474, lon: 7.286, population: 7000 },
  { name: "Zermatt", lat: 46.021, lon: 7.749, population: 5800 },
  { name: "Appenzell", lat: 47.331, lon: 9.409, population: 5800 },
  { name: "Meiringen", lat: 46.727, lon: 8.186, population: 4700 },
  { name: "Scuol", lat: 46.797, lon: 10.3, population: 4600 },
  { name: "Adelboden", lat: 46.492, lon: 7.56, population: 3400 },
  { name: "Disentis", lat: 46.706, lon: 8.851, population: 2200 },
  { name: "Andermatt", lat: 46.635, lon: 8.594, population: 1700 },
  { name: "Airolo", lat: 46.529, lon: 8.611, population: 1500 },
  // Italien
  { name: "Milano", lat: 45.464, lon: 9.19, population: 3200000 },
  { name: "Torino", lat: 45.07, lon: 7.687, population: 1500000 },
  { name: "Brescia", lat: 45.539, lon: 10.22, population: 300000 },
  { name: "Bergamo", lat: 45.695, lon: 9.67, population: 260000 },
  { name: "Bolzano", lat: 46.498, lon: 11.354, population: 150000 },
  { name: "Como", lat: 45.808, lon: 9.085, population: 120000 },
  { name: "Varese", lat: 45.82, lon: 8.825, population: 120000 },
  { name: "Novara", lat: 45.446, lon: 8.622, population: 110000 },
  { name: "Verbania", lat: 45.921, lon: 8.552, population: 45000 },
  { name: "Merano", lat: 46.67, lon: 11.159, population: 45000 },
  { name: "Sondrio", lat: 46.17, lon: 9.87, population: 30000 },
  { name: "Domodossola", lat: 46.116, lon: 8.292, population: 20000 },
  // Deutschland
  { name: "München", lat: 48.137, lon: 11.575, population: 1600000 },
  { name: "Stuttgart", lat: 48.776, lon: 9.182, population: 1000000 },
  { name: "Karlsruhe", lat: 49.007, lon: 8.404, population: 400000 },
  { name: "Freiburg im Breisgau", lat: 47.999, lon: 7.842, population: 300000 },
  { name: "Ulm", lat: 48.401, lon: 9.987, population: 190000 },
  { name: "Konstanz", lat: 47.663, lon: 9.176, population: 90000 },
  { name: "Ravensburg", lat: 47.782, lon: 9.611, population: 70000 },
  { name: "Friedrichshafen", lat: 47.655, lon: 9.478, population: 65000 },
  // Österreich und Liechtenstein-Umfeld
  { name: "Innsbruck", lat: 47.269, lon: 11.404, population: 200000 },
  { name: "Dornbirn-Bregenz", lat: 47.41, lon: 9.744, population: 100000 },
  { name: "Feldkirch", lat: 47.238, lon: 9.598, population: 35000 },
  { name: "Landeck", lat: 47.14, lon: 10.567, population: 12000 },
  // Frankreich
  { name: "Lyon", lat: 45.764, lon: 4.836, population: 1700000 },
  { name: "Strasbourg", lat: 48.573, lon: 7.752, population: 500000 },
  { name: "Grenoble", lat: 45.188, lon: 5.724, population: 500000 },
  { name: "Dijon", lat: 47.322, lon: 5.041, population: 250000 },
  { name: "Mulhouse", lat: 47.75, lon: 7.34, population: 250000 },
  { name: "Belfort-Montbéliard", lat: 47.56, lon: 6.86, population: 180000 },
  { name: "Annecy", lat: 45.899, lon: 6.129, population: 170000 },
  { name: "Besançon", lat: 47.238, lon: 6.024, population: 140000 },
  { name: "Chambéry", lat: 45.564, lon: 5.918, population: 130000 },
  { name: "Colmar", lat: 48.079, lon: 7.358, population: 90000 },
  { name: "Bourg-en-Bresse", lat: 46.205, lon: 5.226, population: 60000 },
  { name: "Thonon-les-Bains", lat: 46.371, lon: 6.479, population: 40000 },
  { name: "Pontarlier", lat: 46.903, lon: 6.355, population: 20000 },
];

/**
 * Weichzeichner in Kilometern: steht für die Ausdehnung des beleuchteten
 * Siedlungsgebiets. Ohne ihn würde der Beitrag im Zentrum gegen unendlich
 * gehen, weil dort die Distanz gegen 0 läuft.
 */
export const LIGHT_SOFTENING_KM = 6;

/** Exponent des Walkerschen Gesetzes für die Abnahme der Lichtglocke. */
export const LIGHT_FALLOFF_EXPONENT = 2.5;

/** Bortle-Klasse 1 (ausgezeichnet dunkel) bis 9 (Innenstadt). */
export type BortleClass = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/**
 * Obergrenzen des Aufhellungs-Index je Bortle-Klasse (Klasse 9 hat keine).
 * Kalibriert an bekannten Punkten: Zürich HB → 9, Bern und Genf → 8,
 * Agglomerationsrand und Talstädte → 7, kleine Zentren → 6, offenes
 * Mittelland und Voralpen → 5, hohe Alpentäler → 4, Engadin und Val Müstair
 * → 3. Bortle 1 und 2 gibt es in der Schweiz nicht mehr – das ist keine
 * Schwäche des Modells, sondern der Befund.
 */
const BORTLE_LIMITS: { limit: number; bortle: BortleClass }[] = [
  { limit: 10, bortle: 1 },
  { limit: 25, bortle: 2 },
  { limit: 60, bortle: 3 },
  { limit: 130, bortle: 4 },
  { limit: 300, bortle: 5 },
  { limit: 800, bortle: 6 },
  { limit: 2000, bortle: 7 },
  { limit: 8000, bortle: 8 },
];

/**
 * Gültigkeitsbereich der Schätzung: Der Datensatz führt die Schweiz und das
 * grenznahe Ausland. Weiter weg fehlen die Lichtquellen, und die Formel
 * meldete fälschlich einen perfekt dunklen Himmel – deshalb sagt die
 * Oberfläche dort lieber gar nichts.
 */
export const DARK_SKY_COVERAGE = {
  south: 45.5,
  north: 48.5,
  west: 5,
  east: 11,
};

/** Liegt der Ort im Gebiet, für das der Lichtquellen-Datensatz taugt? */
export function isInDarkSkyCoverage(lat: number, lon: number): boolean {
  return (
    lat >= DARK_SKY_COVERAGE.south &&
    lat <= DARK_SKY_COVERAGE.north &&
    lon >= DARK_SKY_COVERAGE.west &&
    lon <= DARK_SKY_COVERAGE.east
  );
}

/**
 * Aufhellungs-Index eines Orts: Summe der Beiträge aller Lichtquellen.
 * Einheitenlos – nur die Schwellen darüber geben ihm Bedeutung.
 */
export function skyGlowIndex(lat: number, lon: number): number {
  let sum = 0;
  for (let i = 0; i < LIGHT_SOURCES.length; i++) {
    const source = LIGHT_SOURCES[i];
    const km = distanceMeters(lat, lon, source.lat, source.lon) / 1000;
    sum +=
      source.population /
      Math.pow(km + LIGHT_SOFTENING_KM, LIGHT_FALLOFF_EXPONENT);
  }
  return sum;
}

/** Aufhellungs-Index in eine Bortle-Klasse übersetzen. */
export function bortleClassForIndex(index: number): BortleClass {
  if (!Number.isFinite(index) || index <= 0) return 1;
  for (let i = 0; i < BORTLE_LIMITS.length; i++) {
    if (index < BORTLE_LIMITS[i].limit) return BORTLE_LIMITS[i].bortle;
  }
  return 9;
}

/** Nächste Lichtquellen mit Distanz in Kilometern, sortiert. */
export function nearestLightSources(
  lat: number,
  lon: number,
  count = 3
): { source: LightSource; distanceKm: number }[] {
  const all = LIGHT_SOURCES.map(source => ({
    source,
    distanceKm: distanceMeters(lat, lon, source.lat, source.lon) / 1000,
  }));
  all.sort((a, b) => a.distanceKm - b.distanceKm);
  return all.slice(0, Math.max(0, count));
}

/** Ergebnis der Schätzung – bewusst mit dem Index, damit nichts magisch wirkt. */
export interface DarkSkyEstimate {
  bortle: BortleClass;
  index: number;
  nearest: { source: LightSource; distanceKm: number }[];
}

/** Dunkelheit an einem Ort schätzen (Bortle-Klasse plus nächste Lichtquellen). */
export function estimateDarkSky(lat: number, lon: number): DarkSkyEstimate {
  const index = skyGlowIndex(lat, lon);
  return {
    bortle: bortleClassForIndex(index),
    index,
    nearest: nearestLightSources(lat, lon, 3),
  };
}

const BORTLE_LABELS: Record<BortleClass, L4> = {
  1: l4(
    "Ausgezeichnet dunkel",
    "Ciel excellent",
    "Cielo eccellente",
    "Excellent dark sky"
  ),
  2: l4("Sehr dunkel", "Très sombre", "Molto buio", "Truly dark sky"),
  3: l4("Ländlicher Himmel", "Ciel rural", "Cielo rurale", "Rural sky"),
  4: l4(
    "Land mit Lichtglocken",
    "Rural avec halos",
    "Rurale con aloni",
    "Rural/suburban transition"
  ),
  5: l4(
    "Vorstadt-Himmel",
    "Ciel périurbain",
    "Cielo suburbano",
    "Suburban sky"
  ),
  6: l4(
    "Heller Vorstadt-Himmel",
    "Ciel périurbain lumineux",
    "Cielo suburbano luminoso",
    "Bright suburban sky"
  ),
  7: l4(
    "Übergang zur Stadt",
    "Transition vers la ville",
    "Transizione verso la città",
    "Suburban/urban transition"
  ),
  8: l4("Stadt-Himmel", "Ciel urbain", "Cielo urbano", "City sky"),
  9: l4(
    "Innenstadt-Himmel",
    "Ciel de centre-ville",
    "Cielo di centro città",
    "Inner-city sky"
  ),
};

const BORTLE_SKY: Record<BortleClass, L4> = {
  1: l4(
    "Die Milchstrasse ist so hell, dass sie Schatten wirft, und das Zodiakallicht reicht über den halben Himmel. In Mitteleuropa gibt es das praktisch nicht mehr.",
    "La Voie lactée est si lumineuse qu'elle projette des ombres, et la lumière zodiacale traverse la moitié du ciel. En Europe centrale, cela n'existe pratiquement plus.",
    "La Via Lattea è così luminosa da proiettare ombre e la luce zodiacale attraversa mezzo cielo. In Europa centrale non esiste praticamente più.",
    "The Milky Way is bright enough to cast shadows and the zodiacal light spans half the sky. In central Europe this is all but gone."
  ),
  2: l4(
    "Die Milchstrasse ist reich strukturiert, mit blossem Auge sind Tausende Sterne zu sehen. Solche Nächte findest du nur in abgelegenen Hochtälern.",
    "La Voie lactée est richement structurée, des milliers d'étoiles sont visibles à l'œil nu. De telles nuits ne se trouvent que dans des hautes vallées reculées.",
    "La Via Lattea è riccamente strutturata, a occhio nudo si vedono migliaia di stelle. Notti così le trovi solo in valli alte e appartate.",
    "The Milky Way shows rich structure and thousands of stars are visible to the naked eye. Nights like this only happen in remote high valleys."
  ),
  3: l4(
    "Die Milchstrasse ist deutlich sichtbar, über den Ortschaften am Horizont stehen Lichtglocken. Ein richtig guter Sternenhimmel.",
    "La Voie lactée est nettement visible, des halos lumineux se dressent au-dessus des localités à l'horizon. Un très bon ciel étoilé.",
    "La Via Lattea è ben visibile, sopra i paesi all'orizzonte stanno aloni luminosi. Un cielo stellato davvero buono.",
    "The Milky Way is clearly visible, with light domes over the villages on the horizon. A genuinely good starry sky."
  ),
  4: l4(
    "Die Milchstrasse ist über dem Kopf gut zu sehen, verliert sich aber gegen den Horizont. Lichtglocken sind in mehreren Richtungen auffällig.",
    "La Voie lactée se voit bien au-dessus de la tête mais se perd vers l'horizon. Les halos lumineux sont marqués dans plusieurs directions.",
    "La Via Lattea si vede bene sopra la testa ma si perde verso l'orizzonte. Gli aloni luminosi sono evidenti in più direzioni.",
    "The Milky Way is clear overhead but fades towards the horizon. Light domes stand out in several directions."
  ),
  5: l4(
    "Die Milchstrasse ist nur noch schwach und bei bester Sicht im Zenit zu erkennen. Der Himmel ist rundum leicht aufgehellt.",
    "La Voie lactée n'est plus que faiblement perceptible au zénith par très bonne visibilité. Le ciel est légèrement éclairci tout autour.",
    "La Via Lattea si riconosce solo debolmente allo zenit e con ottima visibilità. Il cielo è leggermente schiarito tutt'attorno.",
    "The Milky Way is only faintly visible near the zenith on the best nights. The whole sky is slightly washed out."
  ),
  6: l4(
    "Die Milchstrasse ist im Zenit höchstens zu erahnen, der Himmel wirkt grau statt schwarz.",
    "La Voie lactée se devine tout au plus au zénith, le ciel paraît gris plutôt que noir.",
    "La Via Lattea si intuisce al massimo allo zenit, il cielo appare grigio invece che nero.",
    "The Milky Way can at best be guessed at overhead; the sky looks grey rather than black."
  ),
  7: l4(
    "Die Milchstrasse ist verschwunden. Sichtbar bleiben die Sternbilder aus hellen Sternen, der ganze Himmel leuchtet gräulich.",
    "La Voie lactée a disparu. Restent les constellations formées d'étoiles brillantes, tout le ciel luit d'un gris pâle.",
    "La Via Lattea è sparita. Restano le costellazioni fatte di stelle luminose, tutto il cielo brilla di un grigio pallido.",
    "The Milky Way is gone. The constellations made of bright stars remain, and the whole sky glows greyish."
  ),
  8: l4(
    "Der Himmel leuchtet grau-orange. Nur die hellsten Sterne und die Planeten kommen durch, Sternbilder sind schwer auszumachen.",
    "Le ciel luit gris-orange. Seules les étoiles les plus brillantes et les planètes passent, les constellations sont difficiles à distinguer.",
    "Il cielo brilla grigio-arancio. Passano solo le stelle più luminose e i pianeti, le costellazioni sono difficili da distinguere.",
    "The sky glows grey-orange. Only the brightest stars and the planets come through, constellations are hard to make out."
  ),
  9: l4(
    "Sichtbar sind Mond, Planeten und eine Handvoll der hellsten Sterne – mehr gibt der Himmel hier nicht her.",
    "On voit la Lune, les planètes et une poignée des étoiles les plus brillantes – le ciel n'offre pas davantage ici.",
    "Si vedono la Luna, i pianeti e una manciata delle stelle più luminose – di più il cielo qui non offre.",
    "The Moon, the planets and a handful of the brightest stars – that is all this sky has to offer."
  ),
};

/** Empfehlung fürs Sternegucken – nach Helligkeits-Gruppe, nicht je Klasse. */
const BORTLE_TIPS: { maxBortle: BortleClass; text: L4 }[] = [
  {
    maxBortle: 3,
    text: l4(
      "Nimm dir 20 Minuten, bis sich die Augen an die Dunkelheit gewöhnt haben, und lass danach jedes weisse Licht aus – der Rotlicht-Modus hilft dabei. Ein Fernglas zeigt hier schon Nebel und Sternhaufen.",
      "Accorde-toi 20 minutes pour que tes yeux s'habituent à l'obscurité, puis évite toute lumière blanche – le mode lumière rouge t'y aide. Ici, des jumelles montrent déjà nébuleuses et amas d'étoiles.",
      "Concediti 20 minuti perché gli occhi si abituino al buio, poi evita ogni luce bianca – la modalità luce rossa ti aiuta. Qui già un binocolo mostra nebulose e ammassi stellari.",
      "Give yourself 20 minutes for your eyes to adapt, then keep every white light off – the red light mode helps. Binoculars already show nebulae and star clusters here."
    ),
  },
  {
    maxBortle: 5,
    text: l4(
      "Für Sternbilder, Planeten und die hellen Objekte reicht es gut. Für die Milchstrasse und lange Belichtungen fährst du besser ein Tal weiter weg von den Ortschaften.",
      "Cela suffit largement pour les constellations, les planètes et les objets brillants. Pour la Voie lactée et les longues poses, mieux vaut t'éloigner d'une vallée des localités.",
      "Per costellazioni, pianeti e oggetti luminosi basta bene. Per la Via Lattea e le lunghe esposizioni conviene spostarti di una valle lontano dai paesi.",
      "Plenty for constellations, planets and the bright objects. For the Milky Way and long exposures you are better off a valley further from the villages."
    ),
  },
  {
    maxBortle: 7,
    text: l4(
      "Mond, Planeten und ISS-Überflüge lohnen sich auch hier. Für einen richtigen Sternenhimmel brauchst du einen dunkleren Platz – such dir eine Stelle mit Abstand zur nächsten Ortschaft.",
      "La Lune, les planètes et les passages de l'ISS valent la peine ici aussi. Pour un vrai ciel étoilé, il te faut un endroit plus sombre – cherche un lieu à distance de la prochaine localité.",
      "Luna, pianeti e passaggi della ISS valgono la pena anche qui. Per un vero cielo stellato ti serve un posto più buio – cerca un luogo lontano dal prossimo paese.",
      "The Moon, the planets and ISS passes are still worth it here. For a real starry sky you need a darker spot – look for a place well away from the nearest town."
    ),
  },
  {
    maxBortle: 9,
    text: l4(
      "Hier bleiben Mond und Planeten. Wenn du Sterne sehen willst, lohnt sich die Fahrt hinaus – schon 20 bis 30 Kilometer Abstand zur Stadt machen einen grossen Unterschied.",
      "Ici, il reste la Lune et les planètes. Si tu veux voir des étoiles, le déplacement vaut la peine – 20 à 30 kilomètres d'écart avec la ville changent déjà beaucoup.",
      "Qui restano Luna e pianeti. Se vuoi vedere le stelle conviene spostarsi – già 20 o 30 chilometri di distanza dalla città fanno una grande differenza.",
      "Here it is the Moon and the planets. If you want stars, the drive out is worth it – even 20 to 30 kilometres from the city makes a big difference."
    ),
  },
];

/** Kurzname der Bortle-Klasse, z. B. «Ländlicher Himmel». */
export function bortleLabel(
  bortle: BortleClass,
  lang: Language = "de"
): string {
  return pick(BORTLE_LABELS[bortle], lang);
}

/** Was du an einem solchen Himmel siehst – ein bis zwei Sätze. */
export function bortleSkyDescription(
  bortle: BortleClass,
  lang: Language = "de"
): string {
  return pick(BORTLE_SKY[bortle], lang);
}

/** Was die Klasse fürs Sternegucken bedeutet. */
export function bortleStargazingTip(
  bortle: BortleClass,
  lang: Language = "de"
): string {
  for (let i = 0; i < BORTLE_TIPS.length; i++) {
    if (bortle <= BORTLE_TIPS[i].maxBortle) {
      return pick(BORTLE_TIPS[i].text, lang);
    }
  }
  return pick(BORTLE_TIPS[BORTLE_TIPS.length - 1].text, lang);
}

/**
 * Bis zu dieser Bewölkung (%) gilt die Nacht als klar – gleiche Schwelle wie
 * die Sternschnuppen-Erinnerung im Push-Dienst.
 */
export const CLEAR_NIGHT_MAX_CLOUD_PERCENT = 40;

/** Ab dieser Beleuchtung stört der Mond die Beobachtung spürbar. */
export const BRIGHT_MOON_MIN_ILLUMINATION = 0.6;

/** Bis zu dieser Bortle-Klasse gilt der Himmel als dunkel genug für Sterne. */
export const DARK_SKY_MAX_BORTLE = 4;

/** Warum sich die Nacht (nicht) besonders lohnt. */
export type StargazingVerdict =
  "worthIt" | "clouds" | "moon" | "brightSky" | "unknown";

/**
 * «Heute Nacht lohnt es sich besonders»: dunkler Himmel UND klare Nacht UND
 * wenig Mondlicht müssen zusammenkommen. Sonst sagt das Urteil, woran es
 * liegt – zuerst am Wetter, dann am Mond, dann am Ort. Ohne Wetterdaten
 * bleibt es bei «unknown»; geraten wird nichts.
 */
export function stargazingOutlook(input: {
  bortle: BortleClass;
  /** Mittlere Nacht-Bewölkung in Prozent, null = keine Prognose vorhanden. */
  cloudCoverPercent: number | null;
  /** Beleuchteter Anteil des Monds, 0 bis 1. */
  moonIllumination: number;
}): { worthIt: boolean; verdict: StargazingVerdict } {
  if (
    input.cloudCoverPercent === null ||
    !Number.isFinite(input.cloudCoverPercent)
  ) {
    return { worthIt: false, verdict: "unknown" };
  }
  if (input.cloudCoverPercent >= CLEAR_NIGHT_MAX_CLOUD_PERCENT) {
    return { worthIt: false, verdict: "clouds" };
  }
  if (input.moonIllumination >= BRIGHT_MOON_MIN_ILLUMINATION) {
    return { worthIt: false, verdict: "moon" };
  }
  if (input.bortle > DARK_SKY_MAX_BORTLE) {
    return { worthIt: false, verdict: "brightSky" };
  }
  return { worthIt: true, verdict: "worthIt" };
}
