import { describe, expect, it } from "vitest";
import {
  MAX_FOOD_ITEM_QUANTITY_LENGTH,
  MAX_FOOD_TEMPLATE_ITEMS,
  MAX_EXPIRY_DAYS,
  expiryDateFromDays,
  parseFoodTemplateItems,
} from "@shared/foodTemplates";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("parseFoodTemplateItems", () => {
  it("liest gültige Einträge samt optionaler Restlaufzeit", () => {
    const json = JSON.stringify([
      { name: "Milch", expiryDays: 5 },
      { name: "Salz" },
    ]);
    const items = parseFoodTemplateItems(json);
    expect(items).toEqual([{ name: "Milch", expiryDays: 5 }, { name: "Salz" }]);
  });

  it("verwirft kaputtes JSON und fremde Formate", () => {
    expect(parseFoodTemplateItems("kaputt")).toEqual([]);
    expect(parseFoodTemplateItems('{"a":1}')).toEqual([]);
    expect(parseFoodTemplateItems(JSON.stringify([42, null, "x"]))).toEqual([]);
  });

  it("verwirft Einträge ohne brauchbaren Namen und trimmt", () => {
    const json = JSON.stringify([
      { name: "   " },
      { expiryDays: 3 },
      { name: "  Käse  " },
    ]);
    expect(parseFoodTemplateItems(json)).toEqual([{ name: "Käse" }]);
  });

  it("ignoriert unbrauchbare Restlaufzeiten und rundet/kappt gültige", () => {
    const json = JSON.stringify([
      { name: "a", expiryDays: -2 },
      { name: "b", expiryDays: Number.NaN },
      { name: "c", expiryDays: "5" },
      { name: "d", expiryDays: 2.6 },
      { name: "e", expiryDays: 99999 },
    ]);
    const items = parseFoodTemplateItems(json);
    expect(items.map(i => i.expiryDays)).toEqual([
      undefined,
      undefined,
      undefined,
      3,
      MAX_EXPIRY_DAYS,
    ]);
  });

  it("liest Lager, Einheit und Kategorie – Unbekanntes fällt weg (#233)", () => {
    const json = JSON.stringify([
      { name: "Ravioli", storage: "dry", unit: "can", category: "cans" },
      { name: "Milch", storage: "cooled", unit: "l" },
      { name: "Rätsel", storage: "keller", unit: "eimer", category: "xy" },
      // Vorlage von vor #233: ganz ohne die neuen Felder
      { name: "Salz" },
    ]);
    expect(parseFoodTemplateItems(json)).toEqual([
      { name: "Ravioli", storage: "dry", unit: "can", category: "cans" },
      { name: "Milch", storage: "cooled", unit: "l" },
      { name: "Rätsel" },
      { name: "Salz" },
    ]);
  });

  it("liest die optionale Menge und bleibt für alte Vorlagen abwärtskompatibel", () => {
    const json = JSON.stringify([
      { name: "Milch", quantity: "1 l", expiryDays: 5 },
      // Alte Vorlage ohne quantity-Feld
      { name: "Salz" },
    ]);
    expect(parseFoodTemplateItems(json)).toEqual([
      { name: "Milch", quantity: "1 l", expiryDays: 5 },
      { name: "Salz" },
    ]);
  });

  it("verwirft unbrauchbare Mengen und trimmt/kappt gültige", () => {
    const json = JSON.stringify([
      { name: "a", quantity: 5 },
      { name: "b", quantity: "   " },
      { name: "c", quantity: "  500 g  " },
      { name: "d", quantity: "x".repeat(200) },
    ]);
    const items = parseFoodTemplateItems(json);
    expect(items.map(i => i.quantity)).toEqual([
      undefined,
      undefined,
      "500 g",
      "x".repeat(MAX_FOOD_ITEM_QUANTITY_LENGTH),
    ]);
  });

  it("begrenzt die Eintrags-Anzahl", () => {
    const many = JSON.stringify(
      Array.from({ length: 200 }, (_, i) => ({ name: `Eintrag ${i}` }))
    );
    expect(parseFoodTemplateItems(many)).toHaveLength(MAX_FOOD_TEMPLATE_ITEMS);
  });
});

describe("expiryDateFromDays", () => {
  it("rechnet Restlaufzeit in ein konkretes MHD um", () => {
    expect(expiryDateFromDays("2026-08-02", 0)).toBe("2026-08-02");
    expect(expiryDateFromDays("2026-08-02", 5)).toBe("2026-08-07");
    // Monats-/Jahreswechsel
    expect(expiryDateFromDays("2026-12-30", 3)).toBe("2027-01-02");
  });

  it("liefert null ohne Restlaufzeit oder bei kaputtem Datum", () => {
    expect(expiryDateFromDays("2026-08-02", undefined)).toBeNull();
    expect(expiryDateFromDays("kaputt", 5)).toBeNull();
  });
});

describe("foodTemplates router", () => {
  it("verweigert anonymen Zugriff", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    });
    await expect(caller.foodTemplates.list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
