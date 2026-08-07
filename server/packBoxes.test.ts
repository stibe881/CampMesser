import { describe, expect, it } from "vitest";
import {
  boxForItem,
  boxLabel,
  buildBoxLookup,
  type BoxLike,
} from "@shared/packBoxes";

const BOXES: BoxLike[] = [
  { id: 1, code: "K3", name: "Küche" },
  { id: 2, code: "K5", name: "Werkzeug" },
];

describe("boxLabel", () => {
  it("kombiniert Kennung und Name", () => {
    expect(boxLabel(BOXES[0])).toBe("K3 · Küche");
  });

  it("lässt fehlende Teile weg statt « · » zu drucken", () => {
    expect(boxLabel({ id: 9, code: "K9", name: "  " })).toBe("K9");
    expect(boxLabel({ id: 9, code: "", name: "Estrich" })).toBe("Estrich");
  });
});

describe("buildBoxLookup / boxForItem", () => {
  it("findet die Kiste über den Namensabgleich der Gewichts-Bilanz", () => {
    const lookup = buildBoxLookup([{ name: "Stirnlampe", boxId: 1 }], BOXES);
    // Dieselbe Regel wie #30: Gross-/Kleinschreibung und Leerraum egal.
    expect(boxForItem("  stirnlampe ", lookup)).toBe("K3 · Küche");
  });

  it("behauptet ohne Treffer nichts", () => {
    const lookup = buildBoxLookup([{ name: "Stirnlampe", boxId: 1 }], BOXES);
    // «Lampe» und «Stirnlampe» bleiben Fremde – ein unscharfer Abgleich
    // fände mehr und läge öfter falsch, und einer falschen Kiste glaubt
    // man.
    expect(boxForItem("Lampe", lookup)).toBeNull();
  });

  it("übergeht Gegenstände ohne Kiste und ohne bekannte Kiste", () => {
    const lookup = buildBoxLookup(
      [
        { name: "Topf", boxId: null },
        { name: "Pfanne", boxId: 999 },
      ],
      BOXES
    );
    expect(boxForItem("Topf", lookup)).toBeNull();
    expect(boxForItem("Pfanne", lookup)).toBeNull();
  });

  it("lässt gleichnamige Gegenstände in VERSCHIEDENEN Kisten heraus", () => {
    // «K3 oder K5» wäre ehrlich, aber unlesbar – und die falsche der
    // beiden anzuzeigen wäre schlimmer als keine.
    const lookup = buildBoxLookup(
      [
        { name: "Gaskartusche", boxId: 1 },
        { name: "Gaskartusche", boxId: 2 },
      ],
      BOXES
    );
    expect(boxForItem("Gaskartusche", lookup)).toBeNull();
  });

  it("verträgt Duplikate in DERSELBEN Kiste", () => {
    const lookup = buildBoxLookup(
      [
        { name: "Hering", boxId: 1 },
        { name: "Hering", boxId: 1 },
      ],
      BOXES
    );
    expect(boxForItem("Hering", lookup)).toBe("K3 · Küche");
  });
});
