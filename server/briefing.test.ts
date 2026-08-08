import { describe, expect, it } from "vitest";
import {
  BRIEFING_FROM_HOUR,
  BRIEFING_TO_HOUR,
  briefingItems,
  briefingTasks,
  hasBriefingContent,
  isBriefingTime,
  MAX_BRIEFING_TASKS,
} from "@shared/briefing";

describe("isBriefingTime", () => {
  it("gilt vom frühen Morgen bis Mittag", () => {
    expect(isBriefingTime(BRIEFING_FROM_HOUR)).toBe(true);
    expect(isBriefingTime(8)).toBe(true);
    expect(isBriefingTime(BRIEFING_TO_HOUR - 1)).toBe(true);
  });

  it("gilt nachts und nachmittags nicht", () => {
    expect(isBriefingTime(BRIEFING_FROM_HOUR - 1)).toBe(false);
    expect(isBriefingTime(BRIEFING_TO_HOUR)).toBe(false);
    expect(isBriefingTime(21)).toBe(false);
  });

  it("weist Unsinn ab", () => {
    expect(isBriefingTime(Number.NaN)).toBe(false);
  });
});

describe("briefingTasks", () => {
  it("kürzt auf die Höchstzahl und zählt den Rest", () => {
    const result = briefingTasks(["a", "b", "c", "d", "e"]);
    expect(result.shown.length).toBe(MAX_BRIEFING_TASKS);
    expect(result.remaining).toBe(5 - MAX_BRIEFING_TASKS);
  });

  it("wirft leere Aufgaben weg", () => {
    const result = briefingTasks(["Kohle", "   ", "Wasser"]);
    expect(result.shown).toEqual(["Kohle", "Wasser"]);
    expect(result.remaining).toBe(0);
  });

  it("kommt ohne Aufgaben klar", () => {
    expect(briefingTasks(undefined)).toEqual({ shown: [], remaining: 0 });
  });

  it("respektiert eine eigene Obergrenze", () => {
    const result = briefingTasks(["a", "b", "c"], 1);
    expect(result.shown).toEqual(["a"]);
    expect(result.remaining).toBe(2);
  });
});

describe("briefingItems", () => {
  it("hält die feste Reihenfolge ein", () => {
    const items = briefingItems({
      astro: "Vollmond",
      tasks: ["Kohle kaufen"],
      meals: "Abend: Chili",
      pollen: "Pollenflug: Gräser hoch",
      weather: "18–26 °C",
    });
    expect(items.map(i => i.kind)).toEqual([
      "weather",
      "pollen",
      "meals",
      "tasks",
      "astro",
    ]);
  });

  it("lässt leere Zeilen weg statt Fehlanzeige zu melden", () => {
    const items = briefingItems({
      weather: "  ",
      meals: null,
      astro: "Neumond",
    });
    expect(items.map(i => i.kind)).toEqual(["astro"]);
  });

  it("macht aus jeder Aufgabe eine eigene Zeile", () => {
    const items = briefingItems({ tasks: ["Kohle", "Wasser"] });
    expect(items.length).toBe(2);
    expect(items.every(i => i.kind === "tasks")).toBe(true);
  });

  it("zeigt nie mehr Aufgaben als erlaubt", () => {
    const items = briefingItems({
      tasks: ["a", "b", "c", "d", "e", "f"],
    });
    expect(items.length).toBe(MAX_BRIEFING_TASKS);
  });

  it("ist ohne Eingaben leer", () => {
    expect(briefingItems({})).toEqual([]);
  });
});

describe("hasBriefingContent", () => {
  it("ist wahr, sobald eine Zeile steht", () => {
    expect(hasBriefingContent({ meals: "Abend: Chili" })).toBe(true);
  });

  it("ist falsch, wenn alles leer ist", () => {
    expect(
      hasBriefingContent({ weather: "", meals: null, tasks: [], astro: "  " })
    ).toBe(false);
  });
});
