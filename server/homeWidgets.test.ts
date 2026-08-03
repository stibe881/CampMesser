import { describe, expect, it } from "vitest";
import {
  isOptionalWidget,
  isWidgetVisible,
  OPTIONAL_WIDGETS,
  sanitizeHiddenWidgets,
  toggleWidget,
} from "../client/src/lib/homeWidgets";

describe("isOptionalWidget", () => {
  it("erkennt bekannte Widget-Ids", () => {
    expect(isOptionalWidget("weather")).toBe(true);
    expect(isOptionalWidget("anniversary")).toBe(true);
  });

  it("weist Pflicht-Bereiche und Unsinn ab", () => {
    expect(isOptionalWidget("hero")).toBe(false);
    expect(isOptionalWidget("search")).toBe(false);
    expect(isOptionalWidget(42)).toBe(false);
    expect(isOptionalWidget(null)).toBe(false);
  });
});

describe("sanitizeHiddenWidgets", () => {
  it("behält nur bekannte Ids, ohne Duplikate", () => {
    expect(
      sanitizeHiddenWidgets(["weather", "hero", "weather", 7, null, "tip"])
    ).toEqual(["weather", "tip"]);
  });

  it("sortiert in die Reihenfolge des Katalogs", () => {
    expect(sanitizeHiddenWidgets(["recent", "trip"])).toEqual([
      "trip",
      "recent",
    ]);
  });

  it("liefert bei Nicht-Arrays eine leere Liste", () => {
    expect(sanitizeHiddenWidgets(null)).toEqual([]);
    expect(sanitizeHiddenWidgets("weather")).toEqual([]);
    expect(sanitizeHiddenWidgets({ weather: true })).toEqual([]);
  });
});

describe("isWidgetVisible", () => {
  it("zeigt alles, solange nichts ausgeblendet ist", () => {
    for (const id of OPTIONAL_WIDGETS) {
      expect(isWidgetVisible([], id)).toBe(true);
    }
  });

  it("versteckt genau die gelisteten Widgets", () => {
    expect(isWidgetVisible(["tip"], "tip")).toBe(false);
    expect(isWidgetVisible(["tip"], "weather")).toBe(true);
  });
});

describe("toggleWidget", () => {
  it("blendet aus und wieder ein", () => {
    const hidden = toggleWidget([], "weather");
    expect(hidden).toEqual(["weather"]);
    expect(toggleWidget(hidden, "weather")).toEqual([]);
  });

  it("räumt kaputte Alt-Werte beim Umschalten auf", () => {
    expect(toggleWidget(["hero", "tip"], "weather")).toEqual([
      "weather",
      "tip",
    ]);
  });

  it("lässt die übergebene Liste unverändert", () => {
    const hidden = ["tip"] as const;
    toggleWidget(hidden, "weather");
    expect(hidden).toEqual(["tip"]);
  });
});
