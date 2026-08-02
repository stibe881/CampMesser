/**
 * «Tipp des Tages» für die Startseite: reine Regel-Logik ohne Fetch.
 * Aus Wetter (heute/morgen), Mond/Astro und Datum wird genau EIN Tipp
 * gewählt – Regeln mit fester Priorität, dazu eine deterministische
 * Fallback-Rotation über den Tag im Jahr, damit es IMMER einen Tipp gibt.
 * Alle Texte liegen als L4 in vier Sprachen vor; Default-Sprache bleibt de.
 */
import { l4, pick, type L4, type Language } from "./i18n";

/** Tages-Wetterlage (aus der Open-Meteo-daily-Prognose des Wetter-Widgets). */
export interface DayWeather {
  /** WMO-Wettercode des Tages */
  code: number;
  /** Tageshöchsttemperatur in °C */
  tMax: number;
  /** Maximale Regenwahrscheinlichkeit in % */
  precipProb: number;
}

export interface DailyTipContext {
  weatherToday?: DayWeather;
  weatherTomorrow?: DayWeather;
  /** Mondbeleuchtung 0–1 (aus shared/moon.ts) */
  moonIllumination?: number;
  /** Sternbeobachtungs-Bewertung (aus shared/moon.ts) */
  stargazingQuality?: "hervorragend" | "gut" | "mittel" | "schlecht";
  /** Name des heute aktiven Sternschnuppen-Stroms – bereits in der Sprache gepickt */
  activeMeteorShower?: string;
  /** Monat 1–12 */
  month: number;
  /** Tag im Jahr 1–366 – steuert die deterministische Fallback-Rotation */
  dayOfYear: number;
  /** Name des Rezepts des Tages – deterministisch vom Aufrufer gewählt */
  recipeOfDay?: string;
}

/** Icon-Schlüssel – der Client mappt sie auf lucide-Komponenten. */
export type DailyTipIcon =
  | "sparkles"
  | "droplets"
  | "cloudRain"
  | "moon"
  | "sun"
  | "cookingPot"
  | "cable"
  | "cross"
  | "users"
  | "treePine";

export interface DailyTip {
  /** Stabiler Regel-Schlüssel, z. B. "meteorNight" oder "fallback-knots" */
  id: string;
  icon: DailyTipIcon;
  /** Fertiger Anzeigetext in der gewünschten Sprache */
  text: string;
  /** Route des passenden Moduls */
  path: string;
}

/** Schwellwerte der Regeln – exportiert, damit Tests nicht driften. */
export const HEAT_TMAX_C = 28;
export const RAIN_PROB_PERCENT = 60;
export const FULL_MOON_MIN_ILLUMINATION = 0.95;

/** Tag im Jahr (1–366) in lokaler Zeit. */
export function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((day.getTime() - start.getTime()) / 86400000) + 1;
}

const FULL_MOON_TEXT = l4(
  "Fast Vollmond heute Nacht – perfekt für eine Nachtwanderung ohne Lampe. Mehr dazu im Mondkalender.",
  "Presque pleine lune cette nuit – parfait pour une randonnée nocturne sans lampe. Plus d'infos dans le calendrier lunaire.",
  "Luna quasi piena stanotte – perfetta per un'escursione notturna senza lampada. Di più nel calendario lunare.",
  "Almost a full moon tonight – perfect for a night walk without a lamp. More in the moon calendar."
);

const CLEAR_SUMMER_TEXT = l4(
  "Klarer Sommertag – die UV-Belastung wird rasch hoch. Sonnencreme einpacken und den UV-Index im Wetter-Modul prüfen.",
  "Journée d'été dégagée – l'indice UV grimpe vite. Prends la crème solaire et vérifie l'indice UV dans le module météo.",
  "Giornata estiva serena – l'indice UV sale in fretta. Metti in borsa la crema solare e controlla l'indice UV nel modulo meteo.",
  "Clear summer day – UV levels rise quickly. Pack sunscreen and check the UV index in the weather module."
);

/** Fallback-Tipps für die Rotation über den Tag im Jahr (Winter/Nebensaison). */
const FALLBACKS: {
  id: string;
  icon: DailyTipIcon;
  path: string;
  text: L4;
}[] = [
  {
    id: "fallback-knots",
    icon: "cable",
    path: "/knoten",
    text: l4(
      "Wissens-Tipp: Übe heute einen Knoten – der Mastwurf ist der Allrounder fürs Camp.",
      "Conseil savoir-faire : entraîne-toi à un nœud aujourd'hui – le nœud de cabestan est le passe-partout du camp.",
      "Consiglio pratico: allenati oggi con un nodo – il nodo parlato è il tuttofare del campeggio.",
      "Knowledge tip: practise a knot today – the clove hitch is the camp all-rounder."
    ),
  },
  {
    id: "fallback-firstAid",
    icon: "cross",
    path: "/erste-hilfe",
    text: l4(
      "Auffrischen schadet nie: Wiederhole heute ein Erste-Hilfe-Thema – zum Beispiel das Vorgehen beim Zeckenbiss.",
      "Réviser ne fait jamais de mal : revois aujourd'hui un sujet de premiers secours – par exemple la marche à suivre en cas de morsure de tique.",
      "Ripassare non fa mai male: rivedi oggi un tema di primo soccorso – per esempio cosa fare in caso di morso di zecca.",
      "A refresher never hurts: revisit a first-aid topic today – for example what to do about a tick bite."
    ),
  },
  {
    id: "fallback-quiz",
    icon: "users",
    path: "/familie",
    text: l4(
      "Quiz-Zeit: Fordere deine Familie mit einem Natur-Quiz im Familien-Modus heraus.",
      "C'est l'heure du quiz : défie ta famille avec un quiz nature dans le mode famille.",
      "Ora del quiz: sfida la tua famiglia con un quiz sulla natura nella modalità famiglia.",
      "Quiz time: challenge your family with a nature quiz in family mode."
    ),
  },
  {
    id: "fallback-nature",
    icon: "treePine",
    path: "/natur",
    text: l4(
      "Wirf einen Blick ins Natur-Lexikon – erkennst du die Tierspuren rund ums Camp?",
      "Jette un œil au lexique nature – reconnais-tu les traces d'animaux autour du camp ?",
      "Dai un'occhiata al lessico della natura – riconosci le tracce degli animali attorno al campo?",
      "Take a look at the nature guide – can you identify the animal tracks around camp?"
    ),
  },
];

/** Rezept-des-Tages-Fallback (mit Rezeptnamen, sonst generisch). */
function recipeFallback(recipeOfDay: string | undefined, lang: Language) {
  const text = recipeOfDay
    ? pick(
        l4(
          `Rezept des Tages: ${recipeOfDay} – schau es dir im Campfire-Rezeptbuch an.`,
          `Recette du jour : ${recipeOfDay} – découvre-la dans le livre de recettes Campfire.`,
          `Ricetta del giorno: ${recipeOfDay} – scoprila nel ricettario Campfire.`,
          `Recipe of the day: ${recipeOfDay} – check it out in the campfire recipe book.`
        ),
        lang
      )
    : pick(
        l4(
          "Lust auf etwas Neues? Stöbere im Campfire-Rezeptbuch nach einem Rezept für heute.",
          "Envie de nouveauté ? Feuillette le livre de recettes Campfire pour trouver la recette du jour.",
          "Voglia di novità? Sfoglia il ricettario Campfire e trova la ricetta di oggi.",
          "Fancy something new? Browse the campfire recipe book for today's recipe."
        ),
        lang
      );
  return {
    id: "fallback-recipe",
    icon: "cookingPot" as const,
    path: "/rezepte",
    text,
  };
}

/**
 * Genau einen Tipp für den Tag wählen. Prioritäten (höchste zuerst):
 * 1. Aktiver Sternschnuppen-Strom bei dunkler Nacht → /natur
 * 2. Hitze (tMax ≥ 28 °C) → Trink-Tipp /wasser
 * 3. Morgen Regen (≥ 60 %) → Trockenzeiten/Regenradar /wetter
 * 4. Vollmond-Nähe (Beleuchtung ≥ 95 %) → Mond-Tipp /natur
 * 5. Klarer Sommertag (Jun–Aug, Code ≤ 1) → UV-Tipp /wetter
 * 6. Fallback-Rotation über den Tag im Jahr (Rezept des Tages + Wissens-Tipps)
 */
export function dailyTip(
  context: DailyTipContext,
  lang: Language = "de"
): DailyTip {
  const {
    weatherToday,
    weatherTomorrow,
    moonIllumination,
    stargazingQuality,
    activeMeteorShower,
    month,
    dayOfYear: doy,
    recipeOfDay,
  } = context;

  // 1. Sternschnuppen: aktiver Strom + dunkle Nacht
  if (
    activeMeteorShower &&
    (stargazingQuality === "hervorragend" || stargazingQuality === "gut")
  ) {
    return {
      id: "meteorNight",
      icon: "sparkles",
      path: "/natur",
      text: pick(
        l4(
          `Sternschnuppen-Nacht: Die ${activeMeteorShower} sind aktiv und der Mond stört kaum – Liegematte raus!`,
          `Nuit d'étoiles filantes : les ${activeMeteorShower} sont en activité et la lune gêne à peine – sors le matelas !`,
          `Notte di stelle cadenti: le ${activeMeteorShower} sono in attività e la luna disturba poco – fuori la stuoia!`,
          `Shooting-star night: the ${activeMeteorShower} are active and the moon barely interferes – get the sleeping mat out!`
        ),
        lang
      ),
    };
  }

  // 2. Hitze: viel trinken
  if (weatherToday && weatherToday.tMax >= HEAT_TMAX_C) {
    const tMax = Math.round(weatherToday.tMax);
    return {
      id: "heat",
      icon: "droplets",
      path: "/wasser",
      text: pick(
        l4(
          `Heute bis ${tMax} °C – trink regelmässig und rechne deinen Bedarf im Trinkwasser-Rechner nach.`,
          `Jusqu'à ${tMax} °C aujourd'hui – bois régulièrement et vérifie tes besoins dans le calculateur d'eau potable.`,
          `Oggi fino a ${tMax} °C – bevi regolarmente e verifica il tuo fabbisogno nel calcolatore dell'acqua potabile.`,
          `Up to ${tMax} °C today – drink regularly and check your needs in the drinking-water calculator.`
        ),
        lang
      ),
    };
  }

  // 3. Morgen Regen: rechtzeitig ins Trockene
  if (weatherTomorrow && weatherTomorrow.precipProb >= RAIN_PROB_PERCENT) {
    const prob = Math.round(weatherTomorrow.precipProb);
    return {
      id: "rainTomorrow",
      icon: "cloudRain",
      path: "/wetter",
      text: pick(
        l4(
          `Morgen ${prob} % Regenwahrscheinlichkeit – hole Wäsche und Zelt rechtzeitig ins Trockene und behalte das Regenradar im Blick.`,
          `Demain ${prob} % de risque de pluie – mets linge et tente au sec à temps et garde un œil sur le radar de pluie.`,
          `Domani ${prob} % di probabilità di pioggia – metti al riparo bucato e tenda per tempo e tieni d'occhio il radar pioggia.`,
          `${prob}% chance of rain tomorrow – get laundry and tent under cover in time and keep an eye on the rain radar.`
        ),
        lang
      ),
    };
  }

  // 4. Vollmond-Nähe
  if (
    moonIllumination !== undefined &&
    moonIllumination >= FULL_MOON_MIN_ILLUMINATION
  ) {
    return {
      id: "fullMoon",
      icon: "moon",
      path: "/natur",
      text: pick(FULL_MOON_TEXT, lang),
    };
  }

  // 5. Klarer Sommertag: UV
  if (month >= 6 && month <= 8 && weatherToday && weatherToday.code <= 1) {
    return {
      id: "clearSummer",
      icon: "sun",
      path: "/wetter",
      text: pick(CLEAR_SUMMER_TEXT, lang),
    };
  }

  // 6. Fallback-Rotation: Rezept des Tages + Wissens-Tipps, deterministisch
  const rotationLength = FALLBACKS.length + 1;
  const index = ((doy % rotationLength) + rotationLength) % rotationLength;
  if (index === 0) return recipeFallback(recipeOfDay, lang);
  const fallback = FALLBACKS[index - 1];
  return {
    id: fallback.id,
    icon: fallback.icon,
    path: fallback.path,
    text: pick(fallback.text, lang),
  };
}
