/**
 * Waldbrandgefahr Schweiz: Parser für die GeoAdmin-Identify-Antwort des
 * offiziellen BAFU-Layers «ch.bafu.gefahren-waldbrand_warnung» sowie die
 * fünf Gefahrenstufen mit Feuerregeln. Reine Funktionen – testbar ohne Netz.
 */

export type FireDangerLevel = 1 | 2 | 3 | 4 | 5;

export interface FireDangerInfo {
  level: FireDangerLevel;
  /** Offizieller Stufentitel, z. B. «Erhebliche Gefahr» */
  title: string;
  /** Warnregion, z. B. «Region Bern (BE)» */
  regionName: string;
  /** Gültig seit (Datum als Text der API, z. B. «30.07.2026») */
  validFrom: string | null;
}

export const FIRE_DANGER_LEVELS: Record<
  FireDangerLevel,
  { title: string; advice: string }
> = {
  1: {
    title: "Keine oder geringe Gefahr",
    advice:
      "Feuern ist grundsätzlich möglich. Feuerstelle mit Steinen sichern, nie unbeaufsichtigt lassen und die Glut vollständig löschen.",
  },
  2: {
    title: "Mässige Gefahr",
    advice:
      "Vorsicht beim Feuern: bestehende Feuerstellen nutzen, Funkenwurf im Auge behalten und Glut vollständig ablöschen.",
  },
  3: {
    title: "Erhebliche Gefahr",
    advice:
      "Feuer nur in bestehenden Feuerstellen entfachen und bei Wind ganz darauf verzichten. Kantonale Einschränkungen sind möglich.",
  },
  4: {
    title: "Grosse Gefahr",
    advice:
      "Feuer höchstens an fest eingerichteten Feuerstellen. Viele Kantone verhängen jetzt Feuerverbote im Wald – lokale Regeln zwingend prüfen.",
  },
  5: {
    title: "Sehr grosse Gefahr",
    advice:
      "Absolutes Feuerverbot im Wald und in Waldesnähe – auch Grills und Raucherwaren sind tabu. Höchste Vorsicht.",
  },
};

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
