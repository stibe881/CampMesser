/**
 * Platz-Vergleich (#440): zwei Zeltplatz-Favoriten nebeneinander – die
 * Entscheidungshilfe «Thun oder Interlaken?» vor dem Buchen.
 *
 * Abgrenzung: Der Kosten-Vergleich ALLER Plätze steckt in der Statistik
 * (#243, shared/spotCosts.ts), das Ranking nach Bewertungs-Kriterien in
 * SpotRatingCompare (#278). Hier geht es um genau zwei Kandidaten mit
 * allem, was die Wahl entscheidet: Preis, Distanz, Höhe, Eigenschaften,
 * eigene Bewertung.
 *
 * Reine Funktionen ohne React – wer bei einer Zeile «gewinnt», ist
 * Logik und gehört getestet, nicht in die Komponente gewürfelt.
 */
import {
  SPOT_ATTRIBUTES,
  type SpotAttributeDef,
  type SpotAttributeValue,
  type SpotAttributes,
} from "./spotAttributes";

/**
 * Wer hat bei einer Vergleichszeile die Nase vorn? "none", sobald eine
 * Seite keinen Wert hat – ein fehlender Preis ist nicht «teurer»,
 * sondern schlicht nicht erfasst.
 */
export type CompareAdvantage = "a" | "b" | "tie" | "none";

export function compareAdvantage(
  a: number | null,
  b: number | null,
  better: "lower" | "higher"
): CompareAdvantage {
  if (a === null || b === null || !Number.isFinite(a) || !Number.isFinite(b)) {
    return "none";
  }
  if (a === b) return "tie";
  const aWins = better === "lower" ? a < b : a > b;
  return aWins ? "a" : "b";
}

/** Eine Eigenschafts-Zeile: Katalog-Eintrag plus Wert je Seite. */
export interface AttributeCompareRow {
  def: SpotAttributeDef;
  a: SpotAttributeValue | null;
  b: SpotAttributeValue | null;
}

/**
 * Eigenschaften beider Plätze in Katalog-Reihenfolge – nur Zeilen, bei
 * denen mindestens eine Seite etwas erfasst hat. Fehlt der Wert auf
 * einer Seite, bleibt er null und wird als Lücke angezeigt statt als
 * «nein» gedeutet.
 */
export function attributeCompareRows(
  a: SpotAttributes,
  b: SpotAttributes
): AttributeCompareRow[] {
  const rows: AttributeCompareRow[] = [];
  for (const def of SPOT_ATTRIBUTES) {
    const valueA = def.values.find(v => v.value === a[def.key]) ?? null;
    const valueB = def.values.find(v => v.value === b[def.key]) ?? null;
    if (!valueA && !valueB) continue;
    rows.push({ def, a: valueA, b: valueB });
  }
  return rows;
}
