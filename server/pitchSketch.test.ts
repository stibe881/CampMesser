import { describe, expect, it } from "vitest";
import {
  DEFAULT_PITCH_DEPTH_M,
  DEFAULT_PITCH_WIDTH_M,
  MAX_SKETCH_ITEMS,
  PITCH_MAX_M,
  PITCH_MIN_M,
  addSketchItem,
  clampItem,
  edgeDistances,
  emptySketch,
  formatMeters,
  moveSketchItem,
  nearestNeighbour,
  nextItemId,
  overlapWarnings,
  overlaps,
  parsePitchSketch,
  pitchAreaM2,
  rectGapM,
  removeSketchItem,
  resizePitch,
  resizeSketchItem,
  rotateSketchItem,
  serializePitchSketch,
  sketchKindLabel,
  snapM,
  usedAreaM2,
  type PitchSketch,
  type SketchItem,
} from "@shared/pitchSketch";

const item = (over: Partial<SketchItem> = {}): SketchItem => ({
  id: "tent-1",
  kind: "tent",
  x: 0,
  y: 0,
  widthM: 3,
  depthM: 4,
  ...over,
});

const sketch = (over: Partial<PitchSketch> = {}): PitchSketch => ({
  ...emptySketch(),
  ...over,
});

describe("snapM", () => {
  it("rastet auf den halben Meter", () => {
    expect(snapM(2.4)).toBe(2.5);
    expect(snapM(2.2)).toBe(2);
    expect(snapM(-0.1)).toBe(-0);
  });
});

describe("clampItem", () => {
  it("holt ein Rechteck zurück auf den Platz", () => {
    const fixed = clampItem(item({ x: 20, y: -5 }), 10, 10);
    expect(fixed.x).toBe(7); // 10 − 3 Breite
    expect(fixed.y).toBe(0);
  });

  it("stutzt ein Rechteck, das grösser ist als der Platz", () => {
    // Ein Zelt, das breiter ist als der Platz, hätte sonst KEINE gültige
    // Lage – die Grösse muss vor der Lage geprüft werden.
    const fixed = clampItem(item({ widthM: 30, depthM: 30 }), 8, 6);
    expect(fixed.widthM).toBe(8);
    expect(fixed.depthM).toBe(6);
    expect(fixed).toMatchObject({ x: 0, y: 0 });
  });
});

describe("parsePitchSketch", () => {
  it("liest eine gültige Skizze", () => {
    const json = JSON.stringify({
      widthM: 8,
      depthM: 12,
      items: [item({ x: 1, y: 2 })],
    });
    expect(parsePitchSketch(json)).toEqual({
      widthM: 8,
      depthM: 12,
      items: [item({ x: 1, y: 2 })],
    });
  });

  it("gibt bei Unsinn null zurück statt zu werfen", () => {
    expect(parsePitchSketch(null)).toBeNull();
    expect(parsePitchSketch("")).toBeNull();
    expect(parsePitchSketch("{kein json")).toBeNull();
    expect(parsePitchSketch("[]")).toBeNull();
    expect(parsePitchSketch('{"widthM":"weit"}')).toBeNull();
  });

  it("lässt kaputte Einträge still weg, behält die guten", () => {
    const json = JSON.stringify({
      widthM: 10,
      depthM: 10,
      items: [
        item({ id: "tent-1" }),
        { id: "x-1", kind: "raumschiff", x: 0, y: 0, widthM: 1, depthM: 1 },
        { kind: "table", x: 0, y: 0, widthM: 1, depthM: 1 }, // ohne Id
        item({ id: "tent-1", x: 5 }), // doppelte Id
      ],
    });
    const parsed = parsePitchSketch(json);
    expect(parsed?.items.map(entry => entry.id)).toEqual(["tent-1"]);
    expect(parsed?.items[0].x).toBe(0);
  });

  it("hält Platzmasse in den Grenzen", () => {
    const json = JSON.stringify({ widthM: 999, depthM: 0.2, items: [] });
    expect(parsePitchSketch(json)).toMatchObject({
      widthM: PITCH_MAX_M,
      depthM: PITCH_MIN_M,
    });
  });

  it("holt Einträge auf den Platz, die ausserhalb gespeichert waren", () => {
    const json = JSON.stringify({
      widthM: 6,
      depthM: 6,
      items: [item({ x: 5, y: 5 })],
    });
    expect(parsePitchSketch(json)?.items[0]).toMatchObject({ x: 3, y: 2 });
  });
});

describe("serializePitchSketch", () => {
  it("gibt für eine leere Skizze null zurück", () => {
    // «Keine Skizze» und «leeres Raster» sollen unterscheidbar bleiben.
    expect(serializePitchSketch(null)).toBeNull();
    expect(serializePitchSketch(emptySketch())).toBeNull();
  });

  it("überlebt den Weg durch JSON unverändert", () => {
    const before = sketch({ items: [item()] });
    const json = serializePitchSketch(before);
    expect(json).not.toBeNull();
    expect(parsePitchSketch(json)).toEqual(before);
  });
});

describe("nextItemId", () => {
  it("zählt je Art hoch und füllt Lücken", () => {
    expect(nextItemId([], "tent")).toBe("tent-1");
    expect(nextItemId([item({ id: "tent-1" })], "tent")).toBe("tent-2");
    expect(nextItemId([item({ id: "tent-2" })], "tent")).toBe("tent-1");
  });
});

describe("rectGapM / overlaps", () => {
  it("misst den Abstand zwischen zwei Rechtecken", () => {
    const a = item({ x: 0, y: 0, widthM: 2, depthM: 2 });
    const b = item({ id: "b", x: 5, y: 0, widthM: 2, depthM: 2 });
    expect(rectGapM(a, b)).toBe(3);
  });

  it("meldet 0 bei Berührung und bei Überlappung", () => {
    const a = item({ x: 0, y: 0, widthM: 2, depthM: 2 });
    expect(
      rectGapM(a, item({ id: "b", x: 2, y: 0, widthM: 2, depthM: 2 }))
    ).toBe(0);
    expect(
      overlaps(a, item({ id: "b", x: 2, y: 0, widthM: 2, depthM: 2 }))
    ).toBe(false);
    expect(
      overlaps(a, item({ id: "b", x: 1, y: 1, widthM: 2, depthM: 2 }))
    ).toBe(true);
  });

  it("misst diagonal über die Ecke", () => {
    const a = item({ x: 0, y: 0, widthM: 1, depthM: 1 });
    const b = item({ id: "b", x: 4, y: 4, widthM: 1, depthM: 1 });
    expect(rectGapM(a, b)).toBeCloseTo(Math.hypot(3, 3), 2);
  });
});

describe("addSketchItem", () => {
  it("legt das erste Rechteck nach oben links", () => {
    const next = addSketchItem(emptySketch(), "tent");
    expect(next.items).toHaveLength(1);
    expect(next.items[0]).toMatchObject({ id: "tent-1", x: 0, y: 0 });
  });

  it("sucht den ersten freien Platz statt zu stapeln", () => {
    const one = addSketchItem(emptySketch(), "tent");
    const two = addSketchItem(one, "tent");
    expect(overlaps(two.items[0], two.items[1])).toBe(false);
  });

  it("nimmt nach MAX_SKETCH_ITEMS nichts mehr auf", () => {
    let full = emptySketch();
    for (let i = 0; i < MAX_SKETCH_ITEMS + 3; i += 1) {
      full = addSketchItem(full, "power");
    }
    expect(full.items).toHaveLength(MAX_SKETCH_ITEMS);
  });
});

describe("moveSketchItem", () => {
  it("setzt die MITTE auf den getippten Punkt", () => {
    const start = sketch({ items: [item()] });
    const moved = moveSketchItem(start, "tent-1", 5, 5);
    expect(moved.items[0]).toMatchObject({ x: 3.5, y: 3 });
  });

  it("lässt kein Rechteck über den Rand rutschen", () => {
    const start = sketch({ items: [item()] });
    const moved = moveSketchItem(start, "tent-1", 100, 100);
    expect(moved.items[0]).toMatchObject({ x: 7, y: 6 });
  });
});

describe("rotateSketchItem", () => {
  it("tauscht Breite und Tiefe um die Mitte", () => {
    const start = sketch({ items: [item({ x: 3, y: 3 })] });
    const turned = rotateSketchItem(start, "tent-1");
    // Mitte war 4.5/5 – bleibt 4.5/5, jetzt 4 breit und 3 tief.
    expect(turned.items[0]).toMatchObject({
      widthM: 4,
      depthM: 3,
      x: 2.5,
      y: 3.5,
    });
  });
});

describe("resizeSketchItem / resizePitch", () => {
  it("ändert das Mass eines Rechtecks", () => {
    const start = sketch({ items: [item()] });
    expect(resizeSketchItem(start, "tent-1", 4.5, 5).items[0]).toMatchObject({
      widthM: 4.5,
      depthM: 5,
    });
  });

  it("holt beim Verkleinern des Platzes alles wieder herein", () => {
    const start = sketch({ items: [item({ x: 6, y: 6 })] });
    const smaller = resizePitch(start, 6, 6);
    expect(smaller.items[0].x + smaller.items[0].widthM).toBeLessThanOrEqual(6);
    expect(smaller.items[0].y + smaller.items[0].depthM).toBeLessThanOrEqual(6);
  });

  it("hält das Platzmass in den Grenzen", () => {
    expect(resizePitch(emptySketch(), 1, 999)).toMatchObject({
      widthM: PITCH_MIN_M,
      depthM: PITCH_MAX_M,
    });
  });
});

describe("removeSketchItem", () => {
  it("entfernt genau eines", () => {
    const start = sketch({ items: [item(), item({ id: "table-1" })] });
    expect(removeSketchItem(start, "tent-1").items.map(i => i.id)).toEqual([
      "table-1",
    ]);
  });
});

describe("edgeDistances / nearestNeighbour", () => {
  it("misst zu allen vier Rändern", () => {
    const start = sketch({ items: [item({ x: 2, y: 3 })] });
    expect(edgeDistances(start.items[0], start)).toEqual({
      left: 2,
      right: 5,
      top: 3,
      bottom: 3,
    });
  });

  it("findet das nächste andere Rechteck", () => {
    const start = sketch({
      items: [
        item({ x: 0, y: 0, widthM: 2, depthM: 2 }),
        item({
          id: "table-1",
          kind: "table",
          x: 8,
          y: 0,
          widthM: 1,
          depthM: 1,
        }),
        item({ id: "car-1", kind: "car", x: 3, y: 0, widthM: 2, depthM: 2 }),
      ],
    });
    const near = nearestNeighbour(start.items[0], start);
    expect(near?.item.id).toBe("car-1");
    expect(near?.distanceM).toBe(1);
  });

  it("gibt null zurück, wenn nichts sonst da ist", () => {
    const start = sketch({ items: [item()] });
    expect(nearestNeighbour(start.items[0], start)).toBeNull();
  });
});

describe("overlapWarnings", () => {
  it("meldet jedes Paar genau einmal", () => {
    const start = sketch({
      items: [
        item({ x: 0, y: 0, widthM: 3, depthM: 3 }),
        item({ id: "car-1", kind: "car", x: 1, y: 1, widthM: 3, depthM: 3 }),
      ],
    });
    expect(overlapWarnings(start)).toHaveLength(1);
  });

  it("schweigt bei Vordach, Baum und Weg", () => {
    // Das Vordach steht per Definition AM Zelt – eine Warnung dafür
    // wäre Lärm, und Lärm schaltet man ab.
    const start = sketch({
      items: [
        item({ x: 0, y: 0, widthM: 3, depthM: 3 }),
        item({
          id: "awning-1",
          kind: "awning",
          x: 1,
          y: 1,
          widthM: 3,
          depthM: 2,
        }),
        item({ id: "tree-1", kind: "tree", x: 0, y: 0, widthM: 2, depthM: 2 }),
      ],
    });
    expect(overlapWarnings(start)).toEqual([]);
  });
});

describe("Flächen", () => {
  it("rechnet die Platzfläche", () => {
    expect(pitchAreaM2(emptySketch())).toBe(
      DEFAULT_PITCH_WIDTH_M * DEFAULT_PITCH_DEPTH_M
    );
  });

  it("zählt nur, was nicht überlappen darf", () => {
    const start = sketch({
      items: [
        item({ widthM: 3, depthM: 4 }), // 12 m²
        item({ id: "awning-1", kind: "awning", widthM: 3, depthM: 2 }), // zählt nicht
      ],
    });
    expect(usedAreaM2(start)).toBe(12);
  });
});

describe("formatMeters", () => {
  it("schreibt ganze Meter ohne Nachkomma", () => {
    expect(formatMeters(3)).toBe("3 m");
    expect(formatMeters(2.5)).toBe("2.5 m");
  });
});

describe("sketchKindLabel", () => {
  it("kennt alle vier Sprachen", () => {
    expect(sketchKindLabel("tent", "de")).toBe("Zelt");
    expect(sketchKindLabel("tent", "fr")).toBe("Tente");
    expect(sketchKindLabel("tent", "it")).toBe("Tenda");
    expect(sketchKindLabel("tent", "en")).toBe("Tent");
  });
});
