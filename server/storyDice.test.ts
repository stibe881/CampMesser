import { describe, expect, it } from "vitest";
import { storyDiceFaces } from "../client/src/data/storyDice";
import {
  MAX_STORY_DICE,
  MIN_STORY_DICE,
  pickStarter,
  rerollFace,
  rollStoryDice,
  STORY_CATEGORY_LABELS,
  STORY_CATEGORY_ORDER,
  STORY_STARTERS,
} from "@shared/storyDice";
import { LANGUAGES, pick } from "@shared/i18n";

/** Zufallsquelle mit vorgegebener Folge – macht das Würfeln prüfbar. */
function fakeRandom(values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

describe("Erzählwürfel (#268)", () => {
  it("jede Kategorie hat mindestens sechs Symbole", () => {
    for (const category of STORY_CATEGORY_ORDER) {
      const pool = storyDiceFaces.filter(f => f.category === category);
      expect(pool.length).toBeGreaterThanOrEqual(6);
    }
    const ids = storyDiceFaces.map(f => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("jedes Symbol trägt Wort und Icon in vier Sprachen", () => {
    for (const face of storyDiceFaces) {
      expect(face.icon.length).toBeGreaterThan(2);
      for (const lang of LANGUAGES) {
        expect(pick(face.word, lang).length).toBeGreaterThan(2);
      }
    }
    for (const category of STORY_CATEGORY_ORDER) {
      for (const lang of LANGUAGES) {
        expect(
          pick(STORY_CATEGORY_LABELS[category], lang).length
        ).toBeGreaterThan(1);
      }
    }
  });

  it("würfelt je ein Symbol pro Kategorie statt blind aus einem Topf", () => {
    const roll = rollStoryDice(storyDiceFaces, 6, fakeRandom([0]));
    expect(roll).toHaveLength(6);
    expect(roll.map(f => f.category)).toEqual(STORY_CATEGORY_ORDER);
  });

  it("bei weniger Würfeln kommen zuerst wer, wo und womit", () => {
    const roll = rollStoryDice(storyDiceFaces, 3, fakeRandom([0]));
    expect(roll.map(f => f.category)).toEqual(["figur", "ort", "gegenstand"]);
  });

  it("hält sich an die Grenzen, auch bei unsinnigen Angaben", () => {
    expect(rollStoryDice(storyDiceFaces, 0, fakeRandom([0]))).toHaveLength(
      MIN_STORY_DICE
    );
    expect(rollStoryDice(storyDiceFaces, 99, fakeRandom([0]))).toHaveLength(
      MAX_STORY_DICE
    );
    // Ein Zufallswert knapp unter 1 darf nicht über das Ende hinauslaufen
    const edge = rollStoryDice(storyDiceFaces, 3, fakeRandom([0.999999]));
    expect(edge.every(f => f !== undefined)).toBe(true);
  });

  it("einzelnes Nachwürfeln bleibt in derselben Kategorie", () => {
    const face = storyDiceFaces.find(f => f.category === "ort")!;
    const next = rerollFace(storyDiceFaces, face, fakeRandom([0.9]));
    expect(next.category).toBe("ort");
  });

  it("würfelt einmal nach, wenn dasselbe Symbol wiederkommt", () => {
    const pool = storyDiceFaces.filter(f => f.category === "figur");
    const first = pool[0];
    // Erster Wurf trifft dasselbe Symbol, der zweite ein anderes
    const next = rerollFace(storyDiceFaces, first, fakeRandom([0, 0.5]));
    expect(next.id).not.toBe(first.id);
  });

  it("liefert Anfangssätze in vier Sprachen", () => {
    expect(STORY_STARTERS.length).toBeGreaterThanOrEqual(5);
    for (const starter of STORY_STARTERS) {
      for (const lang of LANGUAGES) {
        expect(pick(starter, lang).length).toBeGreaterThan(15);
      }
    }
    expect(pickStarter(fakeRandom([0]))).toBe(STORY_STARTERS[0]);
    expect(pickStarter(fakeRandom([0.999999]))).toBe(
      STORY_STARTERS[STORY_STARTERS.length - 1]
    );
  });
});
