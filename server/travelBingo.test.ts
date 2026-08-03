import { describe, expect, it } from "vitest";
import {
  BINGO_SIZES,
  MAX_BINGO_CARDS,
  MAX_BINGO_NAME_LENGTH,
  bingoCells,
  bingoLines,
  completedLines,
  createBingoCard,
  drawBingoCard,
  foundCount,
  hasBingo,
  isBingoSize,
  isFullCard,
  newBingoSeed,
  sanitizeBingoCards,
  seedNumber,
  shuffleWithSeed,
  type BingoSize,
} from "@shared/travelBingo";
import { bingoMotifIds, bingoMotifs } from "../client/src/data/travelBingo";
import { LANGUAGES } from "@shared/i18n";

/** Hilfsfunktion: leere Karte der gewünschten Grösse. */
const empty = (size: BingoSize): boolean[] =>
  new Array(size * size).fill(false);

/** Hilfsfunktion: Karte mit genau diesen Feldern als gefunden. */
const withFound = (size: BingoSize, cells: number[]): boolean[] => {
  const found = empty(size);
  cells.forEach(cell => {
    found[cell] = true;
  });
  return found;
};

describe("shuffleWithSeed", () => {
  it("liefert bei gleichem Seed immer dieselbe Reihenfolge", () => {
    const a = shuffleWithSeed(bingoMotifIds, "reise-2026");
    const b = shuffleWithSeed(bingoMotifIds, "reise-2026");
    expect(a).toEqual(b);
  });

  it("liefert bei anderem Seed eine andere Reihenfolge", () => {
    const a = shuffleWithSeed(bingoMotifIds, "lina");
    const b = shuffleWithSeed(bingoMotifIds, "jonas");
    expect(a).not.toEqual(b);
  });

  it("mischt nur um – kein Motiv geht verloren oder kommt doppelt", () => {
    const shuffled = shuffleWithSeed(bingoMotifIds, "kontrolle");
    expect(shuffled.slice().sort()).toEqual(bingoMotifIds.slice().sort());
  });

  it("lässt die Eingabe unangetastet", () => {
    const input = ["a", "b", "c", "d"];
    shuffleWithSeed(input, "seed");
    expect(input).toEqual(["a", "b", "c", "d"]);
  });

  it("kommt mit leerer Liste und einem einzigen Eintrag klar", () => {
    expect(shuffleWithSeed([], "x")).toEqual([]);
    expect(shuffleWithSeed(["nur-eins"], "x")).toEqual(["nur-eins"]);
  });
});

describe("seedNumber", () => {
  it("bildet auf eine vorzeichenlose 32-Bit-Zahl ab", () => {
    ["", "a", "reise-2026", "🚗"].forEach(seed => {
      const value = seedNumber(seed);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(2 ** 32);
    });
  });

  it("unterscheidet ähnliche Seeds", () => {
    expect(seedNumber("karte-1")).not.toBe(seedNumber("karte-2"));
  });
});

describe("drawBingoCard", () => {
  it("zieht genau size · size Motive", () => {
    expect(drawBingoCard(bingoMotifIds, 3, "s").length).toBe(9);
    expect(drawBingoCard(bingoMotifIds, 4, "s").length).toBe(16);
  });

  it("zieht kein Motiv doppelt auf dieselbe Karte", () => {
    const card = drawBingoCard(bingoMotifIds, 4, "doppelt");
    expect(new Set(card).size).toBe(card.length);
  });

  it("zwei Kinder mit verschiedenen Seeds bekommen verschiedene Karten", () => {
    const lina = drawBingoCard(bingoMotifIds, 4, "lina");
    const jonas = drawBingoCard(bingoMotifIds, 4, "jonas");
    expect(lina).not.toEqual(jonas);
  });

  it("derselbe Seed ergibt nach dem Neuladen dieselbe Karte", () => {
    expect(drawBingoCard(bingoMotifIds, 4, "wiederkehr")).toEqual(
      drawBingoCard(bingoMotifIds, 4, "wiederkehr")
    );
  });

  it("zieht nur Motive aus dem Pool", () => {
    drawBingoCard(bingoMotifIds, 4, "pool").forEach(id => {
      expect(bingoMotifIds).toContain(id);
    });
  });
});

describe("bingoLines", () => {
  it("3×3 hat 3 Reihen, 3 Spalten und 2 Diagonalen", () => {
    const lines = bingoLines(3);
    expect(lines.length).toBe(8);
    expect(lines[0]).toEqual([0, 1, 2]); // erste Reihe
    expect(lines[3]).toEqual([0, 3, 6]); // erste Spalte
    expect(lines[6]).toEqual([0, 4, 8]); // Diagonale abwärts
    expect(lines[7]).toEqual([2, 4, 6]); // Diagonale aufwärts
  });

  it("4×4 hat 4 Reihen, 4 Spalten und 2 Diagonalen", () => {
    const lines = bingoLines(4);
    expect(lines.length).toBe(10);
    expect(lines[0]).toEqual([0, 1, 2, 3]);
    expect(lines[4]).toEqual([0, 4, 8, 12]);
    expect(lines[8]).toEqual([0, 5, 10, 15]);
    expect(lines[9]).toEqual([3, 6, 9, 12]);
  });

  it("jede Linie hat so viele Felder wie die Karte breit ist", () => {
    BINGO_SIZES.forEach(size => {
      bingoLines(size).forEach(line => expect(line.length).toBe(size));
    });
  });
});

describe("hasBingo – 3×3", () => {
  it("leere Karte ist kein Bingo", () => {
    expect(hasBingo(empty(3), 3)).toBe(false);
  });

  it("volle Reihe ist Bingo", () => {
    expect(hasBingo(withFound(3, [3, 4, 5]), 3)).toBe(true);
  });

  it("volle Spalte ist Bingo", () => {
    expect(hasBingo(withFound(3, [1, 4, 7]), 3)).toBe(true);
  });

  it("Diagonale abwärts ist Bingo", () => {
    expect(hasBingo(withFound(3, [0, 4, 8]), 3)).toBe(true);
  });

  it("Diagonale aufwärts ist Bingo", () => {
    expect(hasBingo(withFound(3, [2, 4, 6]), 3)).toBe(true);
  });

  it("verstreute Felder ohne volle Linie sind kein Bingo", () => {
    expect(hasBingo(withFound(3, [0, 1, 3, 5, 7]), 3)).toBe(false);
  });
});

describe("hasBingo – 4×4", () => {
  it("volle Reihe ist Bingo", () => {
    expect(hasBingo(withFound(4, [8, 9, 10, 11]), 4)).toBe(true);
  });

  it("volle Spalte ist Bingo", () => {
    expect(hasBingo(withFound(4, [2, 6, 10, 14]), 4)).toBe(true);
  });

  it("beide Diagonalen sind Bingo", () => {
    expect(hasBingo(withFound(4, [0, 5, 10, 15]), 4)).toBe(true);
    expect(hasBingo(withFound(4, [3, 6, 9, 12]), 4)).toBe(true);
  });

  it("drei von vier Feldern einer Reihe reichen nicht", () => {
    expect(hasBingo(withFound(4, [0, 1, 2]), 4)).toBe(false);
  });

  it("eine 3×3-Reihe ist auf der 4×4-Karte noch kein Bingo", () => {
    // Felder 0,1,2 wären auf 3×3 eine volle Reihe – auf 4×4 fehlt Feld 3
    expect(hasBingo(withFound(3, [0, 1, 2]), 3)).toBe(true);
    expect(hasBingo(withFound(4, [0, 1, 2]), 4)).toBe(false);
  });
});

describe("completedLines / bingoCells", () => {
  it("zählt mehrere volle Linien einzeln", () => {
    // Erste Reihe UND erste Spalte voll (Kreuz in der Ecke)
    const found = withFound(3, [0, 1, 2, 3, 6]);
    expect(completedLines(found, 3).length).toBe(2);
  });

  it("die volle Karte hat alle Linien beisammen", () => {
    const all = new Array(16).fill(true);
    expect(completedLines(all, 4).length).toBe(10);
  });

  it("markiert genau die Felder der vollen Linien", () => {
    expect(bingoCells(withFound(3, [3, 4, 5]), 3)).toEqual([3, 4, 5]);
  });

  it("nennt jedes Feld nur einmal, auch wenn sich Linien kreuzen", () => {
    const found = withFound(3, [0, 1, 2, 3, 6]);
    expect(bingoCells(found, 3)).toEqual([0, 1, 2, 3, 6]);
  });
});

describe("isFullCard / foundCount", () => {
  it("erkennt die volle Karte in beiden Grössen", () => {
    expect(isFullCard(new Array(9).fill(true), 3)).toBe(true);
    expect(isFullCard(new Array(16).fill(true), 4)).toBe(true);
  });

  it("ein fehlendes Feld ist noch keine volle Karte", () => {
    const found = new Array(16).fill(true);
    found[7] = false;
    expect(isFullCard(found, 4)).toBe(false);
  });

  it("zu kurze Fortschrittsliste gilt nie als voll", () => {
    expect(isFullCard(new Array(9).fill(true), 4)).toBe(false);
  });

  it("zählt die gefundenen Felder", () => {
    expect(foundCount(withFound(4, [1, 2, 3]))).toBe(3);
    expect(foundCount(empty(4))).toBe(0);
  });
});

describe("isBingoSize", () => {
  it("lässt nur 3 und 4 durch", () => {
    expect(isBingoSize(3)).toBe(true);
    expect(isBingoSize(4)).toBe(true);
    expect(isBingoSize(5)).toBe(false);
    expect(isBingoSize("4")).toBe(false);
    expect(isBingoSize(undefined)).toBe(false);
  });
});

describe("createBingoCard / newBingoSeed", () => {
  it("legt eine leere Karte der gewünschten Grösse an", () => {
    const card = createBingoCard("Lina", 3, 1000);
    expect(card.size).toBe(3);
    expect(card.found.length).toBe(9);
    expect(card.found.some(Boolean)).toBe(false);
    expect(card.name).toBe("Lina");
    expect(card.createdAt).toBe(1000);
  });

  it("kürzt zu lange Namen und schneidet Leerzeichen weg", () => {
    const card = createBingoCard(`  ${"x".repeat(60)}  `, 4);
    expect(card.name.length).toBe(MAX_BINGO_NAME_LENGTH);
  });

  it("zwei Karten im selben Moment bekommen verschiedene Seeds", () => {
    const seeds = new Set(
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(() => newBingoSeed(1000))
    );
    expect(seeds.size).toBeGreaterThan(1);
  });
});

describe("sanitizeBingoCards", () => {
  const good = {
    id: "k1",
    name: "Lina",
    size: 4,
    seed: "abc",
    found: new Array(16).fill(false),
    createdAt: 5,
  };

  it("nimmt eine saubere Karte unverändert an", () => {
    expect(sanitizeBingoCards([good])).toEqual([good]);
  });

  it("wirft alles weg, was keine Liste ist", () => {
    expect(sanitizeBingoCards(null)).toEqual([]);
    expect(sanitizeBingoCards({ id: "k1" })).toEqual([]);
    expect(sanitizeBingoCards("kaputt")).toEqual([]);
  });

  it("überspringt Karten ohne Id, Seed oder mit falscher Grösse", () => {
    expect(
      sanitizeBingoCards([
        { ...good, id: "" },
        { ...good, seed: "" },
        { ...good, size: 5 },
        null,
      ])
    ).toEqual([]);
  });

  it("bringt eine zu kurze Fortschrittsliste auf die Kartengrösse", () => {
    const cards = sanitizeBingoCards([{ ...good, found: [true, true] }]);
    expect(cards[0]!.found.length).toBe(16);
    expect(cards[0]!.found.slice(0, 2)).toEqual([true, true]);
    expect(cards[0]!.found.slice(2).some(Boolean)).toBe(false);
  });

  it("kürzt eine zu lange Fortschrittsliste", () => {
    const cards = sanitizeBingoCards([
      { ...good, size: 3, found: new Array(16).fill(true) },
    ]);
    expect(cards[0]!.found.length).toBe(9);
  });

  it("hält höchstens MAX_BINGO_CARDS Karten", () => {
    const many = [0, 1, 2, 3, 4, 5, 6].map(i => ({ ...good, id: `k${i}` }));
    expect(sanitizeBingoCards(many).length).toBe(MAX_BINGO_CARDS);
  });

  it("ersetzt fehlende Namen und Zeitstempel durch Standardwerte", () => {
    const cards = sanitizeBingoCards([
      { ...good, name: undefined, createdAt: "gestern" },
    ]);
    expect(cards[0]!.name).toBe("");
    expect(cards[0]!.createdAt).toBe(0);
  });
});

describe("Motiv-Pool", () => {
  it("hat mindestens 40 Motive – genug für zwei verschiedene 4×4-Karten", () => {
    expect(bingoMotifs.length).toBeGreaterThanOrEqual(40);
  });

  it("verwendet jede Id nur einmal", () => {
    expect(new Set(bingoMotifIds).size).toBe(bingoMotifIds.length);
  });

  it("jedes Motiv hat ein Emoji und einen Text in allen vier Sprachen", () => {
    bingoMotifs.forEach(motif => {
      expect(motif.emoji.length).toBeGreaterThan(0);
      LANGUAGES.forEach(lang => {
        expect(motif.label[lang].trim().length).toBeGreaterThan(0);
      });
    });
  });

  it("kein Motiv-Text ist in allen Sprachen identisch geblieben", () => {
    // Übersetzungs-Wächter: gleiche Wörter (z. B. «Tunnel») sind erlaubt,
    // aber nicht in allen vier Sprachen zugleich unübersetzt gelassene Sätze
    const untranslated = bingoMotifs.filter(
      motif =>
        motif.label.de.includes(" ") &&
        motif.label.de === motif.label.fr &&
        motif.label.de === motif.label.it &&
        motif.label.de === motif.label.en
    );
    expect(untranslated).toEqual([]);
  });
});
