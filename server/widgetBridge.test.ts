import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Die Widget-Brücke hat drei Enden, und wenn eines nicht passt, gibt es
 * KEINE Fehlermeldung (#325): Die App schreibt dann in einen Ordner, den
 * das Widget nicht liest, und das Widget zeigt bis in alle Ewigkeit
 * seinen Platzhalter. Man sucht den Fehler dann in der Datenschicht,
 * weil dort etwas fehlt – und findet ihn nicht, weil dort alles stimmt.
 *
 * Dieser Test vergleicht die drei Stellen als Text. Er ersetzt kein
 * Build, aber er fängt den Tippfehler, der sonst erst nach einem
 * halbstündigen EAS-Lauf auf dem Gerät auffällt.
 */
const ROOT = join(import.meta.dirname, "..");
const read = (...parts: string[]) => readFileSync(join(ROOT, ...parts), "utf8");

const APP_GROUP = "group.ch.campmesser.app";

describe("App-Gruppe der Widgets", () => {
  it("steht identisch in app.json, App.js und WidgetData.swift", () => {
    const appJson = JSON.parse(read("expo-app", "app.json")) as {
      expo: {
        ios: { entitlements: Record<string, string[]> };
      };
    };
    const groups =
      appJson.expo.ios.entitlements["com.apple.security.application-groups"];
    expect(groups).toContain(APP_GROUP);
    expect(read("expo-app", "App.js")).toContain(`"${APP_GROUP}"`);
    expect(
      read("expo-app", "targets", "widgets", "WidgetData.swift")
    ).toContain(`"${APP_GROUP}"`);
  });

  it("der Schlüssel im gemeinsamen Speicher ist auf beiden Seiten gleich", () => {
    const key = "campmesserWidget";
    expect(read("expo-app", "App.js")).toContain(`"${key}"`);
    expect(
      read("expo-app", "targets", "widgets", "WidgetData.swift")
    ).toContain(`"${key}"`);
  });

  it("das URL-Schema der Widgets ist in app.json angemeldet", () => {
    // Ohne `scheme` öffnet ein angetipptes Widget gar nichts.
    const appJson = JSON.parse(read("expo-app", "app.json")) as {
      expo: { scheme?: string };
    };
    expect(appJson.expo.scheme).toBe("campmesser");
    expect(
      read("expo-app", "targets", "widgets", "WidgetData.swift")
    ).toContain('scheme = "campmesser"');
  });

  it("die Fassung der Nutzlast ist auf beiden Seiten dieselbe", () => {
    // Erhöht jemand die Fassung in TypeScript, ohne Swift nachzuziehen,
    // verwirft das Widget jede Nutzlast – still.
    const ts = read("shared", "widgetData.ts");
    const swift = read("expo-app", "targets", "widgets", "WidgetData.swift");
    const tsVersion = /version:\s*(\d+)/.exec(ts)?.[1];
    const swiftVersion = /supportedVersion\s*=\s*(\d+)/.exec(swift)?.[1];
    expect(tsVersion).toBeDefined();
    expect(swiftVersion).toBe(tsVersion);
  });

  it("Swift kennt jedes Feld der Nutzlast", () => {
    const swift = read("expo-app", "targets", "widgets", "WidgetData.swift");
    for (const field of [
      "value",
      "title",
      "subtitle",
      "url",
      "ratio",
      "label",
      "trip",
      "packing",
      "supplies",
    ]) {
      expect(swift).toContain(`let ${field}`);
    }
  });
});
