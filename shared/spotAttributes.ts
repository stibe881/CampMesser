/**
 * Platz-Eigenschaften der Zeltplatz-Favoriten: fester Attribut-Katalog
 * (Schatten, Sanitär, Lärm, WLAN …) mit L4-Labels und lucide-Icon-Namen –
 * die Icon-Komponenten ordnet der Client zu. Gespeichert wird ein
 * JSON-Objekt {schluessel: wert} in campSpots.attributesJson; der defensive
 * Parser verwirft alles Unbekannte (Muster shared/quizzes.ts).
 */
import { l4, type L4 } from "./i18n";

export type SpotAttributeKey =
  "shade" | "sanitary" | "noise" | "wifi" | "power" | "dogs" | "kids" | "shop";

export interface SpotAttributeValue {
  /** Technischer Wert, wie er im JSON steht */
  value: string;
  label: L4;
}

export interface SpotAttributeDef {
  key: SpotAttributeKey;
  label: L4;
  /** lucide-Icon-Name – der Client ordnet die Komponente zu */
  icon: string;
  values: SpotAttributeValue[];
}

/** Gesetzte Attribute eines Platzes: {schluessel: wert}. */
export type SpotAttributes = Partial<Record<SpotAttributeKey, string>>;

/** Obergrenze des JSON-Strings – schützt die DB vor riesigen Payloads. */
export const SPOT_ATTRIBUTES_JSON_MAX_LENGTH = 2000;

const yesNo = (): SpotAttributeValue[] => [
  { value: "yes", label: l4("ja", "oui", "sì", "yes") },
  { value: "no", label: l4("nein", "non", "no", "no") },
];

/** Der Attribut-Katalog in Anzeige-Reihenfolge. */
export const SPOT_ATTRIBUTES: SpotAttributeDef[] = [
  {
    key: "shade",
    label: l4("Schatten", "Ombre", "Ombra", "Shade"),
    icon: "TreePine",
    values: [
      { value: "none", label: l4("keiner", "aucune", "nessuna", "none") },
      { value: "some", label: l4("teils", "partielle", "parziale", "some") },
      { value: "much", label: l4("viel", "beaucoup", "molta", "plenty") },
    ],
  },
  {
    key: "sanitary",
    label: l4("Sanitär", "Sanitaires", "Sanitari", "Sanitary"),
    icon: "ShowerHead",
    values: [
      { value: "1", label: l4("1 Stern", "1 étoile", "1 stella", "1 star") },
      {
        value: "2",
        label: l4("2 Sterne", "2 étoiles", "2 stelle", "2 stars"),
      },
      {
        value: "3",
        label: l4("3 Sterne", "3 étoiles", "3 stelle", "3 stars"),
      },
    ],
  },
  {
    key: "noise",
    label: l4("Lärm", "Bruit", "Rumore", "Noise"),
    icon: "Volume2",
    values: [
      { value: "quiet", label: l4("ruhig", "calme", "tranquillo", "quiet") },
      { value: "medium", label: l4("mittel", "moyen", "medio", "moderate") },
      { value: "loud", label: l4("laut", "bruyant", "rumoroso", "loud") },
    ],
  },
  {
    key: "wifi",
    label: l4("WLAN", "Wi-Fi", "Wi-Fi", "Wi-Fi"),
    icon: "Wifi",
    values: yesNo(),
  },
  {
    key: "power",
    label: l4(
      "Strom am Platz",
      "Électricité sur l'emplacement",
      "Corrente in piazzola",
      "Power at the pitch"
    ),
    icon: "Plug",
    values: yesNo(),
  },
  {
    key: "dogs",
    label: l4("Hunde erlaubt", "Chiens admis", "Cani ammessi", "Dogs allowed"),
    icon: "Dog",
    values: yesNo(),
  },
  {
    key: "kids",
    label: l4(
      "Kinderfreundlich",
      "Adapté aux enfants",
      "Adatto ai bambini",
      "Child-friendly"
    ),
    icon: "Baby",
    values: yesNo(),
  },
  {
    key: "shop",
    label: l4(
      "Einkaufsmöglichkeit",
      "Commerce à proximité",
      "Possibilità di spesa",
      "Shop nearby"
    ),
    icon: "ShoppingCart",
    values: yesNo(),
  },
];

/**
 * Unbekannte Daten defensiv in saubere Attribute überführen: nur Schlüssel
 * aus dem Katalog mit gültigem Wert, alles andere wird verworfen.
 */
export function sanitizeSpotAttributes(value: unknown): SpotAttributes {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: SpotAttributes = {};
  for (const def of SPOT_ATTRIBUTES) {
    const raw = (value as Record<string, unknown>)[def.key];
    if (typeof raw !== "string") continue;
    if (def.values.some(v => v.value === raw)) result[def.key] = raw;
  }
  return result;
}

/** Attribut-JSON aus der Datenbank sicher übersetzen ({} bei kaputtem JSON). */
export function parseSpotAttributes(
  json: string | null | undefined
): SpotAttributes {
  if (!json) return {};
  try {
    return sanitizeSpotAttributes(JSON.parse(json));
  } catch {
    return {};
  }
}

/** Gesetzte Attribute für die Anzeige auflösen – in Katalog-Reihenfolge. */
export function listSpotAttributes(
  attrs: SpotAttributes
): { def: SpotAttributeDef; value: SpotAttributeValue }[] {
  const result: { def: SpotAttributeDef; value: SpotAttributeValue }[] = [];
  for (const def of SPOT_ATTRIBUTES) {
    const raw = attrs[def.key];
    if (!raw) continue;
    const value = def.values.find(v => v.value === raw);
    if (value) result.push({ def, value });
  }
  return result;
}
