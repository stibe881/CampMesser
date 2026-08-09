/**
 * Zielland aus einem Ortsnamen raten – die Aliasse und die Ratelogik der
 * Länder-Seite (#228), seit #606 in shared: Der Feiertags-Push braucht die
 * Erkennung auf dem SERVER, die Länder-Seite und der Reise-Planer im
 * Client. Die Regel-Texte selbst bleiben bewusst im Client
 * (client/src/data/roadRules.ts) – der Server braucht nur den Code.
 *
 * Aliasse: lowercase, mindestens 4 Zeichen, global eindeutig – der Test
 * server/roadRules.test.ts wacht darüber.
 */
import { normalizeText } from "./textMatch";

/** Wörter, die auf ein Land hindeuten (Ortsnamen einer Reise). */
export const COUNTRY_ALIASES: Record<string, readonly string[]> = {
  CH: [
    "schweiz",
    "suisse",
    "svizzera",
    "switzerland",
    "helvetia",
    "wallis",
    "valais",
    "tessin",
    "ticino",
    "graubunden",
    "engadin",
    "berner oberland",
  ],
  DE: [
    "deutschland",
    "allemagne",
    "germania",
    "germany",
    "bayern",
    "baviere",
    "schwarzwald",
    "bodensee",
    "allgau",
    "ostsee",
    "nordsee",
    "mosel",
  ],
  AT: [
    "osterreich",
    "autriche",
    "austria",
    "tirol",
    "tyrol",
    "salzburg",
    "karnten",
    "steiermark",
    "vorarlberg",
    "wachau",
  ],
  IT: [
    "italien",
    "italie",
    "italia",
    "italy",
    "toskana",
    "toscana",
    "gardasee",
    "lago di garda",
    "sardinien",
    "sardegna",
    "sizilien",
    "sicilia",
    "sudtirol",
    "alto adige",
    "ligurien",
    "liguria",
  ],
  FR: [
    "frankreich",
    "france",
    "francia",
    "bretagne",
    "provence",
    "ardeche",
    "korsika",
    "corse",
    "corsica",
    "cote d azur",
    "normandie",
    "elsass",
    "alsace",
    "savoyen",
    "savoie",
  ],
  SI: [
    "slowenien",
    "slovenie",
    "slovenia",
    "slovenija",
    "bled",
    "julische alpen",
    "piran",
  ],
  NL: [
    "niederlande",
    "holland",
    "pays bas",
    "paesi bassi",
    "netherlands",
    "nederland",
    "zeeland",
    "friesland",
  ],
  HR: [
    "kroatien",
    "croatie",
    "croazia",
    "croatia",
    "hrvatska",
    "istrien",
    "istria",
    "dalmatien",
    "dalmacija",
    "insel krk",
  ],
  ES: [
    "spanien",
    "espagne",
    "spagna",
    "spain",
    "espana",
    "katalonien",
    "catalunya",
    "andalusien",
    "andalucia",
    "mallorca",
    "costa brava",
    "costa blanca",
  ],
  PT: [
    "portugal",
    "portogallo",
    "algarve",
    "lissabon",
    "lisboa",
    "lisbonne",
    "porto",
    "madeira",
    "azoren",
    "nazare",
  ],
  GR: [
    "griechenland",
    "grece",
    "grecia",
    "greece",
    "kreta",
    "rhodos",
    "korfu",
    "athen",
    "peloponnes",
    "chalkidiki",
    "thessaloniki",
    "santorini",
  ],
  DK: [
    "daenemark",
    "dänemark",
    "danemark",
    "danimarca",
    "denmark",
    "kopenhagen",
    "copenhague",
    "jütland",
    "jylland",
    "bornholm",
    "seeland",
    "skagen",
    "römö",
  ],
  SE: [
    "schweden",
    "suede",
    "svezia",
    "sweden",
    "sverige",
    "stockholm",
    "göteborg",
    "goeteborg",
    "gotland",
    "öland",
    "oeland",
    "smaland",
    "småland",
    "dalarna",
    "malmö",
    "malmoe",
  ],
  NO: [
    "norwegen",
    "norvege",
    "norvegia",
    "norway",
    "norge",
    "oslo",
    "bergen",
    "lofoten",
    "nordkap",
    "tromsö",
    "tromsoe",
    "trondheim",
    "stavanger",
    "geiranger",
  ],
  BE: [
    "belgien",
    "belgique",
    "belgio",
    "belgium",
    "belgie",
    "belgië",
    "brüssel",
    "bruessel",
    "brussel",
    "bruxelles",
    "antwerpen",
    "anvers",
    "gent",
    "gand",
    "brugge",
    "bruges",
    "ardennen",
    "ardennes",
    "oostende",
    "ostende",
    "flandern",
    "wallonien",
  ],
  CZ: [
    "tschechien",
    "tchequie",
    "cechia",
    "czechia",
    "cesko",
    "prag",
    "praha",
    "prague",
    "praga",
    "böhmen",
    "boehmen",
    "mähren",
    "maehren",
    "riesengebirge",
    "krumlov",
    "pilsen",
    "brünn",
    "bruenn",
  ],
  PL: [
    "polen",
    "pologne",
    "polonia",
    "poland",
    "polska",
    "warschau",
    "warszawa",
    "varsovie",
    "varsavia",
    "krakau",
    "krakow",
    "cracovie",
    "cracovia",
    "danzig",
    "gdansk",
    "masuren",
    "mazury",
    "breslau",
    "wroclaw",
    "zakopane",
  ],
  HU: [
    "ungarn",
    "hongrie",
    "ungheria",
    "hungary",
    "magyarorszag",
    "budapest",
    "balaton",
    "plattensee",
    "puszta",
    "debrecen",
    "sopron",
    "esztergom",
  ],
};

/**
 * Text auf Suchform bringen: Umlaute falten, alles ausser Buchstaben und
 * Ziffern zu Leerzeichen, und in Leerzeichen einfassen. So trifft «italien»
 * in «Toskana, Italien» und nicht mitten in einem längeren Wort.
 */
function searchable(text: string): string {
  return ` ${normalizeText(text)
    .replace(/[^a-z0-9]+/g, " ")
    .trim()} `;
}

/**
 * Zielland aus einem Ortsnamen raten (Reise-Titel, Ort, Zeltplatz-Name).
 * Bewusst nur über Namen: Aus reinen Koordinaten liesse sich das Land ohne
 * Grenzdaten nicht verlässlich bestimmen – im Alpenraum liegen die Länder zu
 * dicht beieinander. Kein Treffer heisst null; dann wählt man von Hand.
 */
export function guessCountryCode(
  text: string | null | undefined
): string | null {
  if (!text) return null;
  const haystack = searchable(text);
  if (haystack.trim().length === 0) return null;
  for (const [code, aliases] of Object.entries(COUNTRY_ALIASES)) {
    for (const alias of aliases) {
      if (haystack.includes(searchable(alias))) return code;
    }
  }
  return null;
}
