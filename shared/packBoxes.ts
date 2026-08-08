/**
 * «Wo liegt das?» – die Kiste am Packlisten-Eintrag (#388).
 *
 * WAS FEHLTE: Die Kisten-Verwaltung (#276) weiss, dass die Stirnlampe in
 * Kiste K3 liegt. Die Packliste weiss es nicht – und beim Packen steht
 * man vor der PACKLISTE, nicht vor der Kisten-Seite. Also sucht man, was
 * längst erfasst ist.
 *
 * DIE VERBINDUNG LÄUFT ÜBER DEN NAMEN, mit derselben Regel wie die
 * Gewichts-Bilanz (#30): `normalizePackName`. Was dort als derselbe
 * Gegenstand gilt, gilt auch hier – zwei Regeln nebeneinander hiessen,
 * dass ein Eintrag ein Gewicht hat, aber keine Kiste.
 *
 * WAS DER ABGLEICH NICHT KANN, wird nicht behauptet: «Lampe» und
 * «Stirnlampe» bleiben Fremde. Ein unscharfer Abgleich fände mehr –
 * und läge öfter falsch, und eine falsche Kiste ist schlimmer als
 * keine, weil man ihr glaubt.
 *
 * KEINE NEUE SPALTE, KEINE MIGRATION: Alles hier ist eine Ableitung aus
 * Daten, die schon da sind.
 */
import { normalizePackName } from "./packWeight";

/** Ein Inventar-Gegenstand, so weit er hier zählt. */
export interface BoxedInventoryItem {
  name: string;
  /** storageBoxes.id; null = nicht eingeräumt. */
  boxId: number | null;
}

/** Eine Kiste, so weit sie hier zählt. */
export interface BoxLike {
  id: number;
  /** Kurze Kennung auf dem Etikett («K3»). */
  code: string;
  name: string;
}

/**
 * Etikett einer Kiste: «K3 · Küche».
 *
 * Kennung UND Name: Die Kennung steht gross auf dem physischen Etikett
 * (danach sucht das Auge im Keller), der Name sagt, was gemeint ist.
 */
export function boxLabel(box: BoxLike): string {
  const name = box.name.trim();
  const code = box.code.trim();
  if (!name) return code;
  if (!code) return name;
  return `${code} · ${name}`;
}

/**
 * Nachschlagewerk bilden: normalisierter Gegenstandsname → Kisten-Etikett.
 *
 * BEI ZWEI GLEICHNAMIGEN GEGENSTÄNDEN IN VERSCHIEDENEN KISTEN gewinnt
 * niemand: Der Name fällt aus der Zuordnung heraus. «K3 oder K5» wäre
 * ehrlich, aber als Etikett unlesbar – und die falsche der beiden
 * anzuzeigen wäre schlimmer als keine.
 */
export function buildBoxLookup(
  inventory: readonly BoxedInventoryItem[],
  boxes: readonly BoxLike[]
): Map<string, string> {
  const byId = new Map<number, string>();
  for (const box of boxes) byId.set(box.id, boxLabel(box));

  const lookup = new Map<string, string>();
  const ambiguous = new Set<string>();
  for (const item of inventory) {
    if (item.boxId === null) continue;
    const label = byId.get(item.boxId);
    if (!label) continue;
    const key = normalizePackName(item.name);
    if (!key || ambiguous.has(key)) continue;
    const existing = lookup.get(key);
    if (existing !== undefined && existing !== label) {
      lookup.delete(key);
      ambiguous.add(key);
      continue;
    }
    lookup.set(key, label);
  }
  return lookup;
}

/** Kisten-Etikett für einen Packlisten-Eintrag; null = kein Treffer. */
export function boxForItem(
  itemName: string,
  lookup: Map<string, string>
): string | null {
  return lookup.get(normalizePackName(itemName)) ?? null;
}
