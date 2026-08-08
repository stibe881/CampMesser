import { describe, expect, it } from "vitest";
import {
  allBoxContents,
  boxContents,
  boxScanUrl,
  findBoxByCode,
  isValidBoxCode,
  lineGrams,
  looseItems,
  MAX_BOX_CODE_LENGTH,
  nextBoxCode,
  normalizeBoxCode,
} from "@shared/boxes";

describe("normalizeBoxCode", () => {
  it("schreibt gross und wirft Unerlaubtes weg", () => {
    expect(normalizeBoxCode("k3")).toBe("K3");
    expect(normalizeBoxCode("küche 1")).toBe("KCHE1");
    expect(normalizeBoxCode("box-2")).toBe("BOX-2");
  });

  it("kürzt auf die Länge der Spalte", () => {
    expect(normalizeBoxCode("A".repeat(30)).length).toBe(MAX_BOX_CODE_LENGTH);
  });

  it("kommt mit leerer Eingabe klar", () => {
    expect(normalizeBoxCode("")).toBe("");
    expect(normalizeBoxCode("!!!")).toBe("");
  });
});

describe("isValidBoxCode", () => {
  it("nimmt saubere Kennungen an", () => {
    expect(isValidBoxCode("K3")).toBe(true);
    expect(isValidBoxCode("BOX-12")).toBe(true);
  });

  it("lehnt Leeres und Sonderzeichen ab", () => {
    expect(isValidBoxCode("")).toBe(false);
    expect(isValidBoxCode("K 3")).toBe(false);
    expect(isValidBoxCode("Küche")).toBe(false);
  });

  it("akzeptiert Kleinschreibung als Eingabe", () => {
    expect(isValidBoxCode("k3")).toBe(true);
  });
});

describe("nextBoxCode", () => {
  it("beginnt bei K1", () => {
    expect(nextBoxCode([])).toBe("K1");
  });

  it("zählt hoch", () => {
    expect(nextBoxCode(["K1", "K2"])).toBe("K3");
  });

  it("füllt Lücken statt zu wachsen", () => {
    expect(nextBoxCode(["K1", "K3"])).toBe("K2");
  });

  it("ignoriert Schreibweise und fremde Kennungen", () => {
    expect(nextBoxCode(["k1", "TASCHE"])).toBe("K2");
  });

  it("versteht ein anderes Präfix", () => {
    expect(nextBoxCode(["T1"], "T")).toBe("T2");
  });
});

describe("boxScanUrl", () => {
  it("baut den Link auf die Kisten-Ansicht", () => {
    expect(boxScanUrl("https://meinreisekompass.ch", "K3")).toBe(
      "https://meinreisekompass.ch/kisten/K3"
    );
  });

  it("verträgt einen abschliessenden Schrägstrich", () => {
    expect(boxScanUrl("https://meinreisekompass.ch/", "K3")).toBe(
      "https://meinreisekompass.ch/kisten/K3"
    );
  });

  it("säubert die Kennung mit", () => {
    expect(boxScanUrl("https://meinreisekompass.ch", "k 3")).toBe(
      "https://meinreisekompass.ch/kisten/K3"
    );
  });
});

describe("lineGrams", () => {
  const item = (weightGrams: number, quantity: number) => ({
    id: 1,
    name: "x",
    weightGrams,
    quantity,
  });

  it("rechnet Stückgewicht mal Anzahl", () => {
    expect(lineGrams(item(250, 4))).toBe(1000);
  });

  it("macht aus kaputten Werten null", () => {
    expect(lineGrams(item(NaN, 3))).toBe(0);
    expect(lineGrams(item(200, -5))).toBe(0);
  });
});

describe("boxContents / allBoxContents", () => {
  const boxK1 = { id: 1, code: "K1", name: "Küche" };
  const boxK2 = { id: 2, code: "K2", name: "Schlafen" };
  const items = [
    { id: 10, name: "Topf", quantity: 2, weightGrams: 400, boxId: 1 },
    { id: 11, name: "Pfanne", quantity: 1, weightGrams: 600, boxId: 1 },
    { id: 12, name: "Schlafsack", quantity: 3, weightGrams: 900, boxId: 2 },
    { id: 13, name: "Stirnlampe", quantity: 2, weightGrams: 80, boxId: null },
  ];

  it("sammelt nur die Gegenstände der Kiste", () => {
    const contents = boxContents(boxK1, items);
    expect(contents.items.map(i => i.id)).toEqual([10, 11]);
  });

  it("zählt Stückzahlen, nicht Zeilen", () => {
    expect(boxContents(boxK1, items).itemCount).toBe(3);
  });

  it("summiert das Gewicht mit Stückzahl", () => {
    expect(boxContents(boxK1, items).totalGrams).toBe(2 * 400 + 600);
  });

  it("liefert leere Kisten mit Nullwerten", () => {
    const leer = boxContents({ id: 9, code: "K9", name: "leer" }, items);
    expect(leer.items).toEqual([]);
    expect(leer.itemCount).toBe(0);
    expect(leer.totalGrams).toBe(0);
  });

  it("behält die Reihenfolge der Eingabe", () => {
    const contents = boxContents(boxK1, [items[1], items[0]]);
    expect(contents.items.map(i => i.id)).toEqual([11, 10]);
  });

  it("verarbeitet alle Kisten auf einmal", () => {
    const all = allBoxContents([boxK1, boxK2], items);
    expect(all.map(c => c.box.code)).toEqual(["K1", "K2"]);
    expect(all[1].totalGrams).toBe(2700);
  });
});

describe("looseItems", () => {
  const boxes = [{ id: 1, code: "K1", name: "Küche" }];
  const items = [
    { id: 10, name: "Topf", quantity: 1, weightGrams: 400, boxId: 1 },
    { id: 11, name: "Lampe", quantity: 1, weightGrams: 80, boxId: null },
    { id: 12, name: "Beil", quantity: 1, weightGrams: 700, boxId: 99 },
  ];

  it("findet Gegenstände ohne Kiste", () => {
    expect(looseItems(items, boxes).map(i => i.id)).toEqual([11, 12]);
  });

  it("zählt Verweise auf gelöschte Kisten als nicht eingeräumt", () => {
    expect(looseItems(items, boxes).some(i => i.id === 12)).toBe(true);
  });

  it("gibt ohne Kisten alles zurück", () => {
    expect(looseItems(items, []).length).toBe(3);
  });
});

describe("findBoxByCode", () => {
  const boxes = [
    { id: 1, code: "K1", name: "Küche" },
    { id: 2, code: "BOX-2", name: "Schlafen" },
  ];

  it("findet unabhängig von der Schreibweise", () => {
    expect(findBoxByCode(boxes, "k1")?.id).toBe(1);
    expect(findBoxByCode(boxes, "box-2")?.id).toBe(2);
  });

  it("gibt null zurück, wenn es die Kennung nicht gibt", () => {
    expect(findBoxByCode(boxes, "K9")).toBeNull();
    expect(findBoxByCode([], "K1")).toBeNull();
  });
});
