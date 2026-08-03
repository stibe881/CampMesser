import { describe, expect, it } from "vitest";
import {
  altitudeHint,
  altitudeLevel,
  temperatureDropC,
  LAPSE_RATE_C_PER_100M,
} from "@shared/altitude";
import { LANGUAGES } from "@shared/i18n";

describe("altitudeLevel", () => {
  it("unter 600 m gibt es keinen Hinweis", () => {
    expect(altitudeLevel(0)).toBeNull();
    expect(altitudeLevel(430)).toBeNull();
    expect(altitudeLevel(599)).toBeNull();
  });

  it("600–1199 m ist die Stufe «kühlere Nächte»", () => {
    expect(altitudeLevel(600)).toBe("cooler");
    expect(altitudeLevel(900)).toBe("cooler");
    expect(altitudeLevel(1199)).toBe("cooler");
  });

  it("1200–1799 m ist die Stufe «deutlich kühler»", () => {
    expect(altitudeLevel(1200)).toBe("cold");
    expect(altitudeLevel(1799)).toBe("cold");
  });

  it("ab 1800 m ist die Lage alpin", () => {
    expect(altitudeLevel(1800)).toBe("alpine");
    expect(altitudeLevel(2500)).toBe("alpine");
  });

  it("unbrauchbare Werte liefern null statt einer Stufe", () => {
    expect(altitudeLevel(Number.NaN)).toBeNull();
    expect(altitudeLevel(Number.POSITIVE_INFINITY)).toBeNull();
    // Plätze unter Meereshöhe (z. B. Totes Meer) sind ebenfalls unauffällig
    expect(altitudeLevel(-200)).toBeNull();
  });
});

describe("temperatureDropC", () => {
  it("folgt der Faustregel 0,65 °C pro 100 Höhenmeter", () => {
    expect(LAPSE_RATE_C_PER_100M).toBe(0.65);
    expect(temperatureDropC(100)).toBe(1); // 0,65 → gerundet 1
    expect(temperatureDropC(1000)).toBe(7); // 6,5 → gerundet 7
    expect(temperatureDropC(2000)).toBe(13);
  });

  it("liefert für unbrauchbare Werte 0", () => {
    expect(temperatureDropC(Number.NaN)).toBe(0);
  });
});

describe("altitudeHint", () => {
  it("schweigt unterhalb von 600 m", () => {
    expect(altitudeHint(320)).toBeNull();
    expect(altitudeHint(599, "fr")).toBeNull();
  });

  it("nennt die Temperaturdifferenz im Hinweis", () => {
    expect(altitudeHint(1000)).toContain("7 °C");
    expect(altitudeHint(2000, "en")).toContain("13 °C");
  });

  it("warnt ab 1800 m vor Frost auch im Sommer", () => {
    expect(altitudeHint(1900)).toContain("Frost");
    expect(altitudeHint(1900, "en")).toContain("frost");
    expect(altitudeHint(1900, "it")).toContain("gelo");
    expect(altitudeHint(1900, "fr")).toContain("gel");
  });

  it("empfiehlt zwischen 1200 und 1800 m den warmen Schlafsack", () => {
    expect(altitudeHint(1500)).toContain("Schlafsack");
    expect(altitudeHint(1500, "en")).toContain("sleeping bag");
  });

  it("liefert in allen vier Sprachen einen eigenständigen Text", () => {
    const texts = LANGUAGES.map(lang => altitudeHint(1400, lang));
    expect(texts.every(text => typeof text === "string" && text.length > 0));
    expect(new Set(texts).size).toBe(LANGUAGES.length);
  });

  it("nutzt ohne Sprachangabe Deutsch", () => {
    expect(altitudeHint(900)).toBe(altitudeHint(900, "de"));
  });
});
