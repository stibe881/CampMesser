/**
 * Preise auf der Einkaufsliste und die Übernahme in die Reisekasse (#234).
 *
 * Preise stecken – wie überall im Projekt (client/src/lib/money.ts,
 * shared/expenses.ts) – als Ganzzahlen in RAPPEN in der Datenbank; gerechnet
 * wird ausschliesslich hier, ohne DOM und ohne React, damit die Summen- und
 * Auswahl-Logik testbar bleibt.
 *
 * Verbucht = der Eintrag ist als Ausgabe in einer Reisekasse gelandet
 * (`bookedExpenseId` gesetzt). Verbuchte Einträge zählen in der Listensumme
 * weiter mit, sind aber nie wieder Kandidat für eine Übernahme – so kann
 * derselbe Einkauf nicht zweimal in der Reisekasse landen.
 */
import { l4, pick, type Language } from "./i18n";

/** Grösster erfassbarer Einzelpreis: 10 000 CHF – fängt Tippfehler ab. */
export const MAX_SHOPPING_PRICE_RAPPEN = 1_000_000;

/** So viele Namen stehen in der vorgeschlagenen Beschreibung, dann «+n». */
export const BOOKING_DESCRIPTION_NAMES = 3;

/** Minimalform eines Einkaufslisten-Eintrags für Summen und Übernahme. */
export interface PricedShoppingItem {
  id: number;
  name: string;
  checked: boolean;
  /** Preis in Rappen; null/0 = kein Preis erfasst */
  priceRappen?: number | null;
  /** Id der Reisekassen-Ausgabe, in der dieser Eintrag steckt; null = offen */
  bookedExpenseId?: number | null;
}

/** Summen einer Einkaufsliste – alle Werte in Rappen. */
export interface ShoppingPriceTotals {
  /** Alles mit Preis, egal ob offen, abgehakt oder verbucht. */
  totalRappen: number;
  /** Noch nicht abgehakte Einträge. */
  openRappen: number;
  /** Abgehakt, aber noch nicht verbucht – das ist der Übernahme-Betrag. */
  bookableRappen: number;
  /** Bereits in eine Reisekasse übernommen. */
  bookedRappen: number;
  /** Wie viele Einträge überhaupt einen Preis tragen. */
  pricedCount: number;
  /** Wie viele Einträge sich gerade übernehmen liessen. */
  bookableCount: number;
}

/**
 * Sauberer Rappen-Preis: ungültige, negative und 0-Werte ergeben 0, alles
 * andere wird gerundet und beim Höchstbetrag gekappt.
 */
export function cleanPriceRappen(value: number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(MAX_SHOPPING_PRICE_RAPPEN, Math.round(value));
}

/** Ist der Eintrag bereits in einer Reisekasse verbucht? */
export function isBooked(item: PricedShoppingItem): boolean {
  return (
    item.bookedExpenseId !== null &&
    item.bookedExpenseId !== undefined &&
    item.bookedExpenseId > 0
  );
}

/**
 * Abgehakte Einträge mit Preis, die noch nicht verbucht sind – genau das,
 * was beim Abschliessen eines Einkaufs in die Reisekasse wandert. Die
 * Reihenfolge der Liste bleibt erhalten.
 */
export function bookableShoppingItems<T extends PricedShoppingItem>(
  items: readonly T[]
): T[] {
  return items.filter(
    item =>
      item.checked && !isBooked(item) && cleanPriceRappen(item.priceRappen) > 0
  );
}

/** Laufende Summen einer Liste (siehe ShoppingPriceTotals). */
export function shoppingPriceTotals(
  items: readonly PricedShoppingItem[]
): ShoppingPriceTotals {
  let totalRappen = 0;
  let openRappen = 0;
  let bookableRappen = 0;
  let bookedRappen = 0;
  let pricedCount = 0;
  let bookableCount = 0;
  items.forEach(item => {
    const price = cleanPriceRappen(item.priceRappen);
    if (price <= 0) return;
    pricedCount += 1;
    totalRappen += price;
    if (isBooked(item)) {
      bookedRappen += price;
      return;
    }
    if (item.checked) {
      bookableRappen += price;
      bookableCount += 1;
    } else {
      openRappen += price;
    }
  });
  return {
    totalRappen,
    openRappen,
    bookableRappen,
    bookedRappen,
    pricedCount,
    bookableCount,
  };
}

/** Was eine Übernahme in die Reisekasse mitnimmt. */
export interface ShoppingBooking {
  /** Ids der zu verbuchenden Einträge (Reihenfolge der Liste). */
  itemIds: number[];
  /** Summe dieser Einträge in Rappen. */
  rappen: number;
  /** Anzahl der Einträge. */
  count: number;
}

/**
 * Übernahme aus einer Auswahl zusammenstellen: Ohne `selectedIds` zählen
 * ALLE übernehmbaren Einträge, sonst nur die gewählten. Nicht übernehmbare
 * Ids (offen, ohne Preis oder schon verbucht) fallen still weg – ein bereits
 * verbuchter Einkauf kann so nicht ein zweites Mal in die Kasse wandern.
 */
export function shoppingBooking(
  items: readonly PricedShoppingItem[],
  selectedIds?: readonly number[]
): ShoppingBooking {
  const selectable = bookableShoppingItems(items);
  const wanted =
    selectedIds === undefined
      ? selectable
      : selectable.filter(item => selectedIds.includes(item.id));
  return {
    itemIds: wanted.map(item => item.id),
    rappen: wanted.reduce(
      (sum, item) => sum + cleanPriceRappen(item.priceRappen),
      0
    ),
    count: wanted.length,
  };
}

/**
 * Vorschlag für die Beschreibung der Ausgabe: «Einkauf: Brot, Milch, Käse
 * +2». Ohne Einträge bleibt es beim blossen «Einkauf», damit das Feld nie
 * leer vorbelegt ist.
 */
export function shoppingBookingDescription(
  items: readonly PricedShoppingItem[],
  lang: Language = "de",
  maxLength = 160
): string {
  const prefix = pick(l4("Einkauf", "Courses", "Spesa", "Shopping"), lang);
  const names = items
    .map(item => item.name.trim())
    .filter(name => name.length > 0);
  if (names.length === 0) return prefix;
  const shown = names.slice(0, BOOKING_DESCRIPTION_NAMES);
  const rest = names.length - shown.length;
  const list = shown.join(", ") + (rest > 0 ? ` +${rest}` : "");
  // Französisch setzt ein schmales Leerzeichen vor den Doppelpunkt.
  const separator = pick(l4(": ", " : ", ": ", ": "), lang);
  return `${prefix}${separator}${list}`.slice(0, maxLength);
}
