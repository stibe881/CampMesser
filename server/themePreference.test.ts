import { describe, expect, it } from "vitest";
// Reine Auflösungs-Logik der Design-Präferenz liegt im Client-Code, ohne DOM.
import {
  isThemePreference,
  resolveTheme,
} from "../client/src/lib/themePreference";

describe("resolveTheme", () => {
  it("lässt feste Präferenzen unverändert", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("light", false)).toBe("light");
    expect(resolveTheme("dark", true)).toBe("dark");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("folgt bei auto der System-Einstellung", () => {
    expect(resolveTheme("auto", true)).toBe("dark");
    expect(resolveTheme("auto", false)).toBe("light");
  });
});

describe("isThemePreference", () => {
  it("akzeptiert genau die drei gültigen Werte", () => {
    expect(isThemePreference("light")).toBe(true);
    expect(isThemePreference("dark")).toBe(true);
    expect(isThemePreference("auto")).toBe(true);
  });

  it("lehnt alles andere ab (alte/kaputte localStorage-Werte)", () => {
    expect(isThemePreference(null)).toBe(false);
    expect(isThemePreference("")).toBe(false);
    expect(isThemePreference("system")).toBe(false);
    expect(isThemePreference(undefined)).toBe(false);
  });
});
