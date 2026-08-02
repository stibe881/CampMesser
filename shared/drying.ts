/**
 * Trockenzeiten-Berechnung für Wäsche und Camping-Ausrüstung.
 *
 * Modell: vereinfachte Verdunstungsformel. Die Basis-Trockenzeit eines Materials
 * (bei 20 °C, 60 % Luftfeuchte, leichtem Wind) wird mit Faktoren für
 * Temperatur, Luftfeuchtigkeit und Wind skaliert – gut genug für eine
 * praxisnahe Camp-Empfehlung («bis Sonnenuntergang trocken?»).
 */

import { l4, pick, type L4, type Language } from "./i18n";

export interface DryingItem {
  id: string;
  /** Anzeigename – L4 für die mitgelieferten Materialien, string für eigene */
  label: L4 | string;
  /** Basis-Trockenzeit in Stunden bei Referenzbedingungen (20 °C, 60 % rF, 5 km/h Wind) */
  baseHours: number;
  note: L4 | string;
}

export const DRYING_ITEMS: DryingItem[] = [
  {
    id: "handtuch-duenn",
    label: l4(
      "Reisehandtuch (Mikrofaser)",
      "Linge de voyage (microfibre)",
      "Asciugamano da viaggio (microfibra)",
      "Travel towel (microfibre)"
    ),
    baseHours: 1.5,
    note: l4(
      "Trocknet am schnellsten von allen.",
      "Sèche le plus vite de tous.",
      "Si asciuga più in fretta di tutti.",
      "Dries fastest of all."
    ),
  },
  {
    id: "handtuch",
    label: l4(
      "Frottee-Handtuch",
      "Serviette éponge",
      "Asciugamano di spugna",
      "Terry towel"
    ),
    baseHours: 4,
    note: l4(
      "Dicke Schlaufen speichern viel Wasser.",
      "Les boucles épaisses retiennent beaucoup d'eau.",
      "I riccioli spessi trattengono molta acqua.",
      "Thick loops hold a lot of water."
    ),
  },
  {
    id: "tshirt",
    label: l4(
      "T-Shirt / Funktionsshirt",
      "T-shirt / maillot technique",
      "T-shirt / maglia tecnica",
      "T-shirt / technical shirt"
    ),
    baseHours: 2,
    note: l4(
      "Synthetik trocknet deutlich schneller als Baumwolle.",
      "Le synthétique sèche nettement plus vite que le coton.",
      "Il sintetico si asciuga molto più in fretta del cotone.",
      "Synthetics dry much faster than cotton."
    ),
  },
  {
    id: "jeans",
    label: l4(
      "Jeans / dicke Hose",
      "Jeans / pantalon épais",
      "Jeans / pantaloni pesanti",
      "Jeans / thick trousers"
    ),
    baseHours: 6,
    note: l4(
      "Baumwolle hält Wasser hartnäckig fest.",
      "Le coton retient l'eau obstinément.",
      "Il cotone trattiene l'acqua ostinatamente.",
      "Cotton holds on to water stubbornly."
    ),
  },
  {
    id: "socken",
    label: l4(
      "Socken (Wolle/Synthetik)",
      "Chaussettes (laine/synthétique)",
      "Calze (lana/sintetico)",
      "Socks (wool/synthetic)"
    ),
    baseHours: 3,
    note: l4(
      "Auf die Leine, nicht auf den Boden legen.",
      "Sur la corde, pas par terre.",
      "Sulla corda, non per terra.",
      "Hang on the line, do not lay on the ground."
    ),
  },
  {
    id: "zelt-aussen",
    label: l4(
      "Zelt-Aussenhaut",
      "Double toit de la tente",
      "Telo esterno della tenda",
      "Tent flysheet"
    ),
    baseHours: 1.5,
    note: l4(
      "Aufgespannt trocknen lassen, nicht zusammengelegt.",
      "Laisser sécher montée, pas pliée.",
      "Lascia asciugare montato, non ripiegato.",
      "Let it dry pitched, not folded up."
    ),
  },
  {
    id: "zelt-boden",
    label: l4(
      "Zeltboden / Footprint",
      "Tapis de sol / footprint",
      "Pavimento della tenda / footprint",
      "Tent floor / footprint"
    ),
    baseHours: 2.5,
    note: l4(
      "Über die Leine hängen, beide Seiten trocknen lassen.",
      "Suspendre sur la corde, laisser sécher les deux côtés.",
      "Appendi sulla corda, lascia asciugare entrambi i lati.",
      "Hang over the line, let both sides dry."
    ),
  },
  {
    id: "schlafsack-synthetik",
    label: l4(
      "Schlafsack (Kunstfaser)",
      "Sac de couchage (synthétique)",
      "Sacco a pelo (sintetico)",
      "Sleeping bag (synthetic)"
    ),
    baseHours: 5,
    note: l4(
      "Offen und flach über zwei Leinen legen.",
      "Poser ouvert et à plat sur deux cordes.",
      "Stendi aperto e piatto su due corde.",
      "Lay open and flat over two lines."
    ),
  },
  {
    id: "schlafsack-daune",
    label: l4(
      "Schlafsack (Daune)",
      "Sac de couchage (duvet)",
      "Sacco a pelo (piuma)",
      "Sleeping bag (down)"
    ),
    baseHours: 10,
    note: l4(
      "Daune trocknet sehr langsam – unbedingt Sonne nutzen.",
      "Le duvet sèche très lentement – profite absolument du soleil.",
      "La piuma si asciuga molto lentamente – sfrutta assolutamente il sole.",
      "Down dries very slowly – make sure to use the sun."
    ),
  },
  {
    id: "regenjacke",
    label: l4(
      "Regenjacke",
      "Veste de pluie",
      "Giacca antipioggia",
      "Rain jacket"
    ),
    baseHours: 1,
    note: l4(
      "Abtropfen lassen genügt meist.",
      "Laisser égoutter suffit le plus souvent.",
      "Di solito basta lasciarla sgocciolare.",
      "Letting it drip dry is usually enough."
    ),
  },
  {
    id: "badehose",
    label: l4("Badesachen", "Affaires de bain", "Costumi da bagno", "Swimwear"),
    baseHours: 2,
    note: l4(
      "Nach dem Schwimmen gut auswringen.",
      "Bien essorer après la baignade.",
      "Strizza bene dopo il bagno.",
      "Wring out well after swimming."
    ),
  },
];

export interface DryingConditions {
  /** Lufttemperatur in °C */
  temperature: number;
  /** Relative Luftfeuchtigkeit in % */
  humidity: number;
  /** Windgeschwindigkeit in km/h */
  windSpeed: number;
}

export interface DryingResult {
  /** Geschätzte Trockenzeit in Stunden */
  hours: number;
  /** Multiplikator gegenüber Referenzbedingungen */
  factor: number;
}

/**
 * Geschätzte Trockenzeit unter gegebenen Bedingungen.
 * Referenz: 20 °C, 60 % rF, 5 km/h Wind → Faktor 1.
 */
export function estimateDryingTime(
  baseHours: number,
  cond: DryingConditions
): DryingResult {
  // Temperatur: pro 10 °C wärmer halbiert sich die Zeit grob (Sättigungsdampfdruck)
  const tempFactor = Math.pow(2, (20 - cond.temperature) / 10);
  // Luftfeuchte: Trocknungsantrieb ~ (100 - rF); Referenz 60 % → Antrieb 40
  const humidityDrive = Math.max(5, 100 - cond.humidity);
  const humidityFactor = 40 / humidityDrive;
  // Wind: verdoppelt die Verdunstung bei kräftigem Wind; Referenz 5 km/h
  const windFactor =
    1 /
    Math.min(
      2.2,
      Math.max(0.55, 0.75 + Math.sqrt(Math.max(0, cond.windSpeed)) / 6)
    );
  const factor = tempFactor * humidityFactor * windFactor;
  const hours = baseHours * factor;
  return {
    hours: Math.round(hours * 10) / 10,
    factor: Math.round(factor * 100) / 100,
  };
}

export interface SunsetVerdict {
  driesBeforeSunset: boolean;
  /** Verbleibende Stunden bis Sonnenuntergang */
  hoursUntilSunset: number;
  /** Klartext-Empfehlung */
  recommendation: string;
}

/** Empfehlung, ob das Teil bis Sonnenuntergang trocken wird oder reingeholt werden muss. */
export function sunsetVerdict(
  dryingHours: number,
  now: Date,
  sunset: Date,
  lang: Language = "de"
): SunsetVerdict {
  const hoursUntilSunset = Math.max(
    0,
    (sunset.getTime() - now.getTime()) / 3600000
  );
  const rounded = Math.round(hoursUntilSunset * 10) / 10;
  if (hoursUntilSunset <= 0) {
    return {
      driesBeforeSunset: false,
      hoursUntilSunset: 0,
      recommendation: pick(
        l4(
          "Die Sonne ist bereits untergegangen – häng die Sachen ins Zelt oder unters Vordach, draussen werden sie durch den Tau wieder feucht.",
          "Le soleil est déjà couché – suspends les affaires dans la tente ou sous l'auvent, dehors la rosée les remouillera.",
          "Il sole è già tramontato – appendi la roba in tenda o sotto la veranda, fuori la rugiada la inumidirà di nuovo.",
          "The sun has already set – hang the items in the tent or under the awning, outside the dew will make them damp again."
        ),
        lang
      ),
    };
  }
  // 30 Minuten Sicherheitsreserve vor Sonnenuntergang (Abendtau setzt früher ein)
  if (dryingHours <= hoursUntilSunset - 0.5) {
    const left = formatHours(rounded, lang);
    return {
      driesBeforeSunset: true,
      hoursUntilSunset: rounded,
      recommendation: pick(
        l4(
          `Wird rechtzeitig trocken – noch ${left} bis Sonnenuntergang. Trotzdem vor der Dämmerung abnehmen.`,
          `Sera sec à temps – encore ${left} avant le coucher du soleil. Décroche quand même avant le crépuscule.`,
          `Si asciugherà in tempo – ancora ${left} al tramonto. Ritira comunque prima del crepuscolo.`,
          `Will dry in time – ${left} left until sunset. Still take it in before dusk.`
        ),
        lang
      ),
    };
  }
  const needed = formatHours(dryingHours, lang);
  const left = formatHours(rounded, lang);
  return {
    driesBeforeSunset: false,
    hoursUntilSunset: rounded,
    recommendation: pick(
      l4(
        `Wird bis Sonnenuntergang NICHT trocken (braucht ${needed}, verbleibend ${left}). Vor dem Abendtau ins Zelt oder Auto holen und morgen weitertrocknen.`,
        `Ne sera PAS sec avant le coucher du soleil (il faut ${needed}, il reste ${left}). Rentre-le dans la tente ou la voiture avant la rosée du soir et continue demain.`,
        `NON si asciugherà entro il tramonto (servono ${needed}, restano ${left}). Porta tutto in tenda o in auto prima della rugiada serale e continua domani.`,
        `Will NOT be dry by sunset (needs ${needed}, ${left} remaining). Bring it into the tent or car before the evening dew and continue drying tomorrow.`
      ),
      lang
    ),
  };
}

export function formatHours(h: number, lang: Language = "de"): string {
  const minUnit = pick(l4("Min.", "min", "min", "min"), lang);
  const hourUnit = pick(l4("Std.", "h", "h", "h"), lang);
  if (h < 1) return `${Math.round(h * 60)} ${minUnit}`;
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60);
  return mins === 0
    ? `${whole} ${hourUnit}`
    : `${whole} ${hourUnit} ${mins} ${minUnit}`;
}

export interface HourlyConditions extends DryingConditions {
  /** Startzeit der Stunde */
  time: Date;
  /** Niederschlag in mm (optional, für die Regen-Warnung) */
  precipitation?: number;
  /** Regenwahrscheinlichkeit in % (optional) */
  precipitationProbability?: number;
}

export interface ForecastDryingResult {
  /** Geschätzte Trockenzeit in Stunden (mit Prognose-Verlauf) */
  hours: number;
  /** Zeitpunkt, an dem das Teil trocken ist – null, wenn es innerhalb des Verlaufs nicht trocknet */
  dryAt: Date | null;
}

/**
 * Trocknungsberechnung mit stündlichem Prognose-Verlauf: Pro Stunde wird der
 * Trocknungsfortschritt unter den jeweiligen Bedingungen aufsummiert
 * (1 Stunde unter Bedingungen X erledigt 1/Trockenzeit(X) des Trocknens).
 * Deutlich genauer als eine Momentaufnahme, weil Nachmittags-Wärme oder
 * aufkommender Wind korrekt berücksichtigt werden.
 */
export function estimateDryingWithForecast(
  baseHours: number,
  hourly: HourlyConditions[],
  start: Date
): ForecastDryingResult {
  const relevant = hourly
    .filter(h => h.time.getTime() + 3600000 > start.getTime())
    .sort((a, b) => a.time.getTime() - b.time.getTime());
  let progress = 0; // 1 = trocken
  let elapsed = 0; // Stunden seit Start
  for (const hour of relevant) {
    // Anteil der Stunde, der nach dem Start liegt
    const hourStart = Math.max(hour.time.getTime(), start.getTime());
    const hourEnd = hour.time.getTime() + 3600000;
    const fraction = Math.max(0, Math.min(1, (hourEnd - hourStart) / 3600000));
    if (fraction <= 0) continue;
    const { hours } = estimateDryingTime(baseHours, hour);
    const rate = hours > 0 ? 1 / hours : 1;
    const gained = rate * fraction;
    if (progress + gained >= 1) {
      const needed = (1 - progress) / rate; // Stunden innerhalb dieser Stunde
      elapsed += needed;
      return {
        hours: Math.round(elapsed * 10) / 10,
        dryAt: new Date(hourStart + needed * 3600000),
      };
    }
    progress += gained;
    elapsed += fraction;
  }
  return { hours: Math.round(elapsed * 10) / 10, dryAt: null };
}

export interface RainWarning {
  /** Zeitpunkt, an dem der Regen voraussichtlich einsetzt */
  rainAt: Date;
  /** Regenwahrscheinlichkeit in % zu diesem Zeitpunkt (falls bekannt) */
  probability: number | null;
}

/**
 * Prüft, ob im Prognose-Verlauf Regen einsetzt, bevor das Teil trocken ist.
 * Regen = >= 0.2 mm/h oder >= 60 % Regenwahrscheinlichkeit.
 * Gibt die erste Regenstunde zwischen `start` und `dryAt` zurück (oder null).
 */
export function rainBeforeDry(
  hourly: HourlyConditions[],
  start: Date,
  dryAt: Date | null
): RainWarning | null {
  const end = dryAt ? dryAt.getTime() : start.getTime() + 24 * 3600000;
  for (const h of [...hourly].sort(
    (a, b) => a.time.getTime() - b.time.getTime()
  )) {
    const t = h.time.getTime();
    if (t + 3600000 <= start.getTime() || t >= end) continue;
    const wet =
      (h.precipitation ?? 0) >= 0.2 || (h.precipitationProbability ?? 0) >= 60;
    if (wet) {
      return {
        rainAt: h.time,
        probability: h.precipitationProbability ?? null,
      };
    }
  }
  return null;
}
