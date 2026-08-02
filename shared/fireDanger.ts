/**
 * Waldbrandgefahr Schweiz: Parser für die GeoAdmin-Identify-Antwort des
 * offiziellen BAFU-Layers «ch.bafu.gefahren-waldbrand_warnung» sowie die
 * fünf Gefahrenstufen mit Feuerregeln. Reine Funktionen – testbar ohne Netz.
 */

import { l4, pick, type L4, type Language } from "./i18n";

export type FireDangerLevel = 1 | 2 | 3 | 4 | 5;

export interface FireDangerInfo {
  level: FireDangerLevel;
  /** Offizieller Stufentitel der API (deutsch), z. B. «Erhebliche Gefahr» */
  title: string;
  /** Warnregion, z. B. «Region Bern (BE)» */
  regionName: string;
  /** Gültig seit (Datum als Text der API, z. B. «30.07.2026») */
  validFrom: string | null;
}

export const FIRE_DANGER_LEVELS: Record<
  FireDangerLevel,
  { title: L4; advice: L4 }
> = {
  1: {
    title: l4(
      "Keine oder geringe Gefahr",
      "Danger nul ou faible",
      "Pericolo nullo o debole",
      "No or low danger"
    ),
    advice: l4(
      "Feuern ist grundsätzlich möglich. Feuerstelle mit Steinen sichern, nie unbeaufsichtigt lassen und die Glut vollständig löschen.",
      "Faire du feu est en principe possible. Sécurise le foyer avec des pierres, ne le laisse jamais sans surveillance et éteins complètement les braises.",
      "Accendere fuochi è in linea di principio possibile. Delimita il focolare con pietre, non lasciarlo mai incustodito e spegni completamente la brace.",
      "Fires are generally allowed. Ring the fire pit with stones, never leave it unattended and extinguish the embers completely."
    ),
  },
  2: {
    title: l4(
      "Mässige Gefahr",
      "Danger limité",
      "Pericolo moderato",
      "Moderate danger"
    ),
    advice: l4(
      "Vorsicht beim Feuern: bestehende Feuerstellen nutzen, Funkenwurf im Auge behalten und Glut vollständig ablöschen.",
      "Prudence avec le feu : utilise les foyers existants, surveille les projections d'étincelles et éteins complètement les braises.",
      "Prudenza con il fuoco: usa i focolari esistenti, fai attenzione alle scintille e spegni completamente la brace.",
      "Take care with fires: use existing fire pits, watch out for flying sparks and fully extinguish the embers."
    ),
  },
  3: {
    title: l4(
      "Erhebliche Gefahr",
      "Danger marqué",
      "Pericolo marcato",
      "Considerable danger"
    ),
    advice: l4(
      "Feuer nur in bestehenden Feuerstellen entfachen und bei Wind ganz darauf verzichten. Kantonale Einschränkungen sind möglich.",
      "N'allume des feux que dans les foyers existants et renonces-y complètement par vent fort. Des restrictions cantonales sont possibles.",
      "Accendi fuochi solo nei focolari esistenti e rinuncia del tutto in caso di vento. Sono possibili restrizioni cantonali.",
      "Light fires only in existing fire pits and avoid them entirely in windy conditions. Cantonal restrictions are possible."
    ),
  },
  4: {
    title: l4("Grosse Gefahr", "Danger fort", "Pericolo forte", "High danger"),
    advice: l4(
      "Feuer höchstens an fest eingerichteten Feuerstellen. Viele Kantone verhängen jetzt Feuerverbote im Wald – lokale Regeln zwingend prüfen.",
      "Feux uniquement dans les foyers aménagés fixes, au plus. De nombreux cantons décrètent maintenant des interdictions de feu en forêt – vérifie impérativement les règles locales.",
      "Fuochi al massimo nei focolari fissi attrezzati. Molti cantoni emanano ora divieti di accendere fuochi nel bosco – verifica assolutamente le regole locali.",
      "Fires only at permanently installed fire pits, if at all. Many cantons now impose fire bans in forests – checking local rules is essential."
    ),
  },
  5: {
    title: l4(
      "Sehr grosse Gefahr",
      "Danger très fort",
      "Pericolo molto forte",
      "Very high danger"
    ),
    advice: l4(
      "Absolutes Feuerverbot im Wald und in Waldesnähe – auch Grills und Raucherwaren sind tabu. Höchste Vorsicht.",
      "Interdiction absolue de faire du feu en forêt et à proximité – grils et articles pour fumeurs sont aussi tabous. Prudence maximale.",
      "Divieto assoluto di accendere fuochi nel bosco e nelle vicinanze – anche grill e articoli per fumatori sono tabù. Massima prudenza.",
      "Absolute fire ban in and near forests – barbecues and smoking materials are also off-limits. Utmost caution."
    ),
  },
};

/** Stufentitel und Feuerregeln in der gewünschten Sprache. */
export function describeFireDanger(
  level: FireDangerLevel,
  lang: Language = "de"
): { title: string; advice: string } {
  const entry = FIRE_DANGER_LEVELS[level];
  return { title: pick(entry.title, lang), advice: pick(entry.advice, lang) };
}

/** Stufentitel der API in die Gefahrenstufe 1–5 übersetzen (robust gegen Umlaut-Varianten). */
export function dangerLevelFromTitle(title: string): FireDangerLevel | null {
  const t = title.toLowerCase();
  if (t.includes("sehr gross")) return 5;
  if (t.includes("gross")) return 4;
  if (t.includes("erheblich")) return 3;
  if (t.includes("mässig") || t.includes("maessig")) return 2;
  if (t.includes("keine") || t.includes("gering")) return 1;
  return null;
}

/**
 * GeoAdmin-Identify-Antwort in eine FireDangerInfo übersetzen.
 * Gibt null zurück, wenn der Punkt in keiner Warnregion liegt oder die
 * Antwort nicht dem erwarteten Format entspricht.
 */
export function parseFireDangerResponse(json: unknown): FireDangerInfo | null {
  if (!json || typeof json !== "object") return null;
  const results = (json as { results?: unknown }).results;
  if (!Array.isArray(results) || results.length === 0) return null;
  const attributes = (results[0] as { attributes?: unknown }).attributes;
  if (!attributes || typeof attributes !== "object") return null;
  const attr = attributes as Record<string, unknown>;
  const title = typeof attr.title_de === "string" ? attr.title_de : null;
  if (!title) return null;
  const level = dangerLevelFromTitle(title);
  if (!level) return null;
  return {
    level,
    title,
    regionName: typeof attr.name_de === "string" ? attr.name_de : "",
    validFrom: typeof attr.valid_from === "string" ? attr.valid_from : null,
  };
}

/** Identify-URL für die Gefahrenstufe an einem LV95-Punkt (frei zugängliche GeoAdmin-API). */
export function fireDangerRequestUrl(east: number, north: number): string {
  const params = new URLSearchParams({
    geometry: `${east},${north}`,
    geometryType: "esriGeometryPoint",
    sr: "2056",
    layers: "all:ch.bafu.gefahren-waldbrand_warnung",
    tolerance: "0",
    returnGeometry: "false",
    lang: "de",
  });
  return `https://api3.geo.admin.ch/rest/services/api/MapServer/identify?${params.toString()}`;
}
