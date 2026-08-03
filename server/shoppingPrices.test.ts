import { describe, expect, it } from "vitest";
import {
  bookableShoppingItems,
  cleanPriceRappen,
  isBooked,
  shoppingBooking,
  shoppingBookingDescription,
  shoppingPriceTotals,
  MAX_SHOPPING_PRICE_RAPPEN,
  type PricedShoppingItem,
} from "@shared/shoppingPrices";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/** Kleine Beispiel-Liste: offen, abgehakt, verbucht und ohne Preis. */
const items: PricedShoppingItem[] = [
  { id: 1, name: "Brot", checked: true, priceRappen: 350 },
  { id: 2, name: "Milch", checked: true, priceRappen: 160 },
  { id: 3, name: "Käse", checked: false, priceRappen: 890 },
  { id: 4, name: "Salz", checked: true, priceRappen: null },
  {
    id: 5,
    name: "Kaffee",
    checked: true,
    priceRappen: 1290,
    bookedExpenseId: 7,
  },
];

describe("cleanPriceRappen", () => {
  it("verwirft leere, negative und unlesbare Werte", () => {
    expect(cleanPriceRappen(null)).toBe(0);
    expect(cleanPriceRappen(undefined)).toBe(0);
    expect(cleanPriceRappen(0)).toBe(0);
    expect(cleanPriceRappen(-250)).toBe(0);
    expect(cleanPriceRappen(Number.NaN)).toBe(0);
  });

  it("rundet und kappt beim Höchstbetrag", () => {
    expect(cleanPriceRappen(349.6)).toBe(350);
    expect(cleanPriceRappen(MAX_SHOPPING_PRICE_RAPPEN + 1)).toBe(
      MAX_SHOPPING_PRICE_RAPPEN
    );
  });
});

describe("isBooked", () => {
  it("erkennt verbuchte Einträge", () => {
    expect(
      isBooked({ id: 1, name: "a", checked: true, bookedExpenseId: 3 })
    ).toBe(true);
    expect(
      isBooked({ id: 1, name: "a", checked: true, bookedExpenseId: null })
    ).toBe(false);
    expect(isBooked({ id: 1, name: "a", checked: true })).toBe(false);
  });
});

describe("shoppingPriceTotals", () => {
  it("trennt offen, übernehmbar und verbucht", () => {
    expect(shoppingPriceTotals(items)).toEqual({
      totalRappen: 350 + 160 + 890 + 1290,
      openRappen: 890,
      bookableRappen: 510,
      bookedRappen: 1290,
      pricedCount: 4,
      bookableCount: 2,
    });
  });

  it("liefert für eine Liste ohne Preise lauter Nullen", () => {
    expect(
      shoppingPriceTotals([{ id: 1, name: "Salz", checked: false }])
    ).toEqual({
      totalRappen: 0,
      openRappen: 0,
      bookableRappen: 0,
      bookedRappen: 0,
      pricedCount: 0,
      bookableCount: 0,
    });
    expect(shoppingPriceTotals([]).totalRappen).toBe(0);
  });
});

describe("bookableShoppingItems", () => {
  it("nimmt nur abgehakte, bepreiste und unverbuchte Einträge", () => {
    expect(bookableShoppingItems(items).map(i => i.id)).toEqual([1, 2]);
  });
});

describe("shoppingBooking", () => {
  it("nimmt ohne Auswahl alles Übernehmbare", () => {
    expect(shoppingBooking(items)).toEqual({
      itemIds: [1, 2],
      rappen: 510,
      count: 2,
    });
  });

  it("beschränkt sich auf die gewählten Einträge", () => {
    expect(shoppingBooking(items, [2])).toEqual({
      itemIds: [2],
      rappen: 160,
      count: 1,
    });
  });

  it("ignoriert bereits verbuchte, offene und preislose Ids", () => {
    // 5 ist verbucht, 3 nicht abgehakt, 4 ohne Preis, 99 gibt es nicht
    expect(shoppingBooking(items, [3, 4, 5, 99])).toEqual({
      itemIds: [],
      rappen: 0,
      count: 0,
    });
  });

  it("zählt einen bereits verbuchten Einkauf kein zweites Mal", () => {
    const after = items.map(item =>
      item.id === 1 || item.id === 2 ? { ...item, bookedExpenseId: 42 } : item
    );
    expect(shoppingBooking(after)).toEqual({
      itemIds: [],
      rappen: 0,
      count: 0,
    });
    expect(shoppingPriceTotals(after).bookableRappen).toBe(0);
    expect(shoppingPriceTotals(after).bookedRappen).toBe(1800);
  });
});

describe("shoppingBookingDescription", () => {
  it("nennt bis zu drei Namen und zählt den Rest", () => {
    expect(shoppingBookingDescription(items)).toBe(
      "Einkauf: Brot, Milch, Käse +2"
    );
    expect(shoppingBookingDescription(items.slice(0, 2))).toBe(
      "Einkauf: Brot, Milch"
    );
  });

  it("übersetzt den Vorspann und kürzt auf die Feldlänge", () => {
    expect(shoppingBookingDescription(items.slice(0, 1), "fr")).toBe(
      "Courses : Brot"
    );
    expect(shoppingBookingDescription(items.slice(0, 1), "it")).toBe(
      "Spesa: Brot"
    );
    expect(shoppingBookingDescription(items.slice(0, 1), "en")).toBe(
      "Shopping: Brot"
    );
    expect(
      shoppingBookingDescription(
        [{ id: 1, name: "x".repeat(200), checked: true }],
        "de",
        20
      )
    ).toHaveLength(20);
  });

  it("bleibt ohne Einträge beim blossen Vorspann", () => {
    expect(shoppingBookingDescription([])).toBe("Einkauf");
    expect(
      shoppingBookingDescription([{ id: 1, name: "  ", checked: true }])
    ).toBe("Einkauf");
  });
});

describe("shopping.bookToTrip router", () => {
  it("verweigert anonymen Zugriff", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    });
    await expect(
      caller.shopping.bookToTrip({
        tripId: 1,
        day: "2026-08-03",
        paidBy: "Anna",
        category: "essen",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      caller.tripShopping.bookToTrip({
        tripId: 1,
        day: "2026-08-03",
        paidBy: "Anna",
        category: "essen",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
