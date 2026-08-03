import { describe, expect, it } from "vitest";
import {
  bortleClassForIndex,
  bortleLabel,
  bortleSkyDescription,
  bortleStargazingTip,
  BRIGHT_MOON_MIN_ILLUMINATION,
  CLEAR_NIGHT_MAX_CLOUD_PERCENT,
  estimateDarkSky,
  isInDarkSkyCoverage,
  LIGHT_SOURCES,
  nearestLightSources,
  skyGlowIndex,
  stargazingOutlook,
  type BortleClass,
} from "@shared/darkSky";
import { LANGUAGES } from "@shared/i18n";

/** Orte, an denen die Einstufung nachprüfbar ist. */
const ZUERICH_HB = { lat: 47.378, lon: 8.54 };
const BERN = { lat: 46.948, lon: 7.447 };
const GENF = { lat: 46.204, lon: 6.143 };
const VAL_MUESTAIR = { lat: 46.6, lon: 10.35 };
const ZERNEZ = { lat: 46.7, lon: 10.09 };
const GRIMSEL = { lat: 46.56, lon: 8.34 };
const EMMENTAL = { lat: 46.95, lon: 7.9 };

describe("estimateDarkSky – Stadt gegen Alpental", () => {
  it("stuft Stadtzentren als hell ein", () => {
    expect(estimateDarkSky(ZUERICH_HB.lat, ZUERICH_HB.lon).bortle).toBe(9);
    expect(estimateDarkSky(BERN.lat, BERN.lon).bortle).toBeGreaterThanOrEqual(
      8
    );
    expect(estimateDarkSky(GENF.lat, GENF.lon).bortle).toBeGreaterThanOrEqual(
      8
    );
  });

  it("stuft abgelegene Alpentäler als dunkel ein", () => {
    expect(
      estimateDarkSky(VAL_MUESTAIR.lat, VAL_MUESTAIR.lon).bortle
    ).toBeLessThanOrEqual(3);
    expect(estimateDarkSky(ZERNEZ.lat, ZERNEZ.lon).bortle).toBeLessThanOrEqual(
      3
    );
    expect(
      estimateDarkSky(GRIMSEL.lat, GRIMSEL.lon).bortle
    ).toBeLessThanOrEqual(4);
  });

  it("legt das offene Mittelland dazwischen", () => {
    const mittelland = estimateDarkSky(EMMENTAL.lat, EMMENTAL.lon).bortle;
    expect(mittelland).toBeGreaterThan(
      estimateDarkSky(VAL_MUESTAIR.lat, VAL_MUESTAIR.lon).bortle
    );
    expect(mittelland).toBeLessThan(
      estimateDarkSky(ZUERICH_HB.lat, ZUERICH_HB.lon).bortle
    );
  });

  it("nennt die nächsten Lichtquellen mit Distanz", () => {
    const estimate = estimateDarkSky(ZUERICH_HB.lat, ZUERICH_HB.lon);
    expect(estimate.nearest).toHaveLength(3);
    expect(estimate.nearest[0].source.name).toBe("Zürich");
    expect(estimate.nearest[0].distanceKm).toBeLessThan(2);
    expect(estimate.nearest[0].distanceKm).toBeLessThanOrEqual(
      estimate.nearest[1].distanceKm
    );
    expect(estimate.nearest[1].distanceKm).toBeLessThanOrEqual(
      estimate.nearest[2].distanceKm
    );
  });
});

describe("skyGlowIndex", () => {
  it("nimmt mit der Distanz zur Stadt ab", () => {
    const werte = [0, 0.1, 0.3, 0.6, 1].map(d =>
      skyGlowIndex(ZUERICH_HB.lat - d, ZUERICH_HB.lon)
    );
    for (let i = 1; i < werte.length; i++) {
      expect(werte[i]).toBeLessThan(werte[i - 1]);
    }
  });

  it("bleibt im Stadtzentrum endlich (Weichzeichner)", () => {
    const quelle = LIGHT_SOURCES[0];
    const index = skyGlowIndex(quelle.lat, quelle.lon);
    expect(Number.isFinite(index)).toBe(true);
    expect(index).toBeGreaterThan(0);
  });

  it("liefert weit weg fast null – dort ist die Schätzung nicht gültig", () => {
    expect(skyGlowIndex(40, -30)).toBeLessThan(0.1);
    expect(isInDarkSkyCoverage(40, -30)).toBe(false);
  });
});

describe("bortleClassForIndex", () => {
  it("trifft die Schwellen genau", () => {
    expect(bortleClassForIndex(9.99)).toBe(1);
    expect(bortleClassForIndex(10)).toBe(2);
    expect(bortleClassForIndex(24.99)).toBe(2);
    expect(bortleClassForIndex(25)).toBe(3);
    expect(bortleClassForIndex(7999)).toBe(8);
    expect(bortleClassForIndex(8000)).toBe(9);
    expect(bortleClassForIndex(1000000)).toBe(9);
  });

  it("fängt unsinnige Werte ab", () => {
    expect(bortleClassForIndex(0)).toBe(1);
    expect(bortleClassForIndex(-5)).toBe(1);
    expect(bortleClassForIndex(Number.NaN)).toBe(1);
  });
});

describe("isInDarkSkyCoverage", () => {
  it("deckt die Schweiz samt Grenzgebiet ab", () => {
    expect(isInDarkSkyCoverage(ZUERICH_HB.lat, ZUERICH_HB.lon)).toBe(true);
    expect(isInDarkSkyCoverage(GENF.lat, GENF.lon)).toBe(true);
    // Chiasso ganz im Süden und Basel ganz im Norden
    expect(isInDarkSkyCoverage(45.83, 9.03)).toBe(true);
    expect(isInDarkSkyCoverage(47.59, 7.59)).toBe(true);
  });

  it("schliesst weit entfernte Orte aus", () => {
    expect(isInDarkSkyCoverage(59.91, 10.75)).toBe(false); // Oslo
    expect(isInDarkSkyCoverage(37.5, 15.09)).toBe(false); // Catania
    expect(isInDarkSkyCoverage(46.2, 2.4)).toBe(false); // Zentralfrankreich
  });
});

describe("Bortle-Texte", () => {
  const classes: BortleClass[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  it("hat Kurzname, Himmelsbeschrieb und Tipp in allen vier Sprachen", () => {
    LANGUAGES.forEach(lang => {
      classes.forEach(bortle => {
        expect(bortleLabel(bortle, lang).length).toBeGreaterThan(3);
        expect(bortleSkyDescription(bortle, lang).length).toBeGreaterThan(40);
        expect(bortleStargazingTip(bortle, lang).length).toBeGreaterThan(40);
      });
    });
  });

  it("spricht bei dunklem Himmel von der Milchstrasse und nutzt Deutsch als Vorgabe", () => {
    expect(bortleSkyDescription(2)).toContain("Milchstrasse");
    expect(bortleLabel(9)).toBe("Innenstadt-Himmel");
    expect(bortleStargazingTip(1)).toBe(bortleStargazingTip(3));
    expect(bortleStargazingTip(3)).not.toBe(bortleStargazingTip(4));
  });
});

describe("stargazingOutlook", () => {
  const dunkel = { bortle: 3 as BortleClass, moonIllumination: 0.1 };

  it("lohnt sich bei dunklem Himmel, klarer Nacht und wenig Mond", () => {
    expect(stargazingOutlook({ ...dunkel, cloudCoverPercent: 10 })).toEqual({
      worthIt: true,
      verdict: "worthIt",
    });
  });

  it("nennt die Wolken zuerst", () => {
    expect(
      stargazingOutlook({
        ...dunkel,
        cloudCoverPercent: CLEAR_NIGHT_MAX_CLOUD_PERCENT,
      }).verdict
    ).toBe("clouds");
    expect(
      stargazingOutlook({
        ...dunkel,
        cloudCoverPercent: CLEAR_NIGHT_MAX_CLOUD_PERCENT - 0.1,
      }).worthIt
    ).toBe(true);
  });

  it("nennt den Mond, dann den hellen Himmel", () => {
    expect(
      stargazingOutlook({
        bortle: 3,
        cloudCoverPercent: 5,
        moonIllumination: BRIGHT_MOON_MIN_ILLUMINATION,
      }).verdict
    ).toBe("moon");
    expect(
      stargazingOutlook({
        bortle: 7,
        cloudCoverPercent: 5,
        moonIllumination: 0.1,
      }).verdict
    ).toBe("brightSky");
    expect(
      stargazingOutlook({
        bortle: 4,
        cloudCoverPercent: 5,
        moonIllumination: 0.1,
      }).worthIt
    ).toBe(true);
  });

  it("rät ohne Wetterdaten nichts", () => {
    expect(stargazingOutlook({ ...dunkel, cloudCoverPercent: null })).toEqual({
      worthIt: false,
      verdict: "unknown",
    });
    expect(
      stargazingOutlook({ ...dunkel, cloudCoverPercent: Number.NaN }).verdict
    ).toBe("unknown");
  });
});

describe("Lichtquellen-Datensatz", () => {
  it("hat brauchbare Einträge ohne Doppel", () => {
    expect(LIGHT_SOURCES.length).toBeGreaterThan(50);
    const namen = new Set<string>();
    LIGHT_SOURCES.forEach(source => {
      expect(source.name.length).toBeGreaterThan(1);
      expect(namen.has(source.name)).toBe(false);
      namen.add(source.name);
      expect(source.population).toBeGreaterThan(1000);
      expect(source.lat).toBeGreaterThan(44);
      expect(source.lat).toBeLessThan(50);
      expect(source.lon).toBeGreaterThan(4);
      expect(source.lon).toBeLessThan(12);
    });
  });

  it("führt jede Lichtquelle an ihrem eigenen Ort als nächste auf", () => {
    LIGHT_SOURCES.forEach(source => {
      const nearest = nearestLightSources(source.lat, source.lon, 1);
      expect(nearest[0].source.name).toBe(source.name);
      expect(nearest[0].distanceKm).toBeLessThan(0.001);
    });
  });
});
