import { describe, expect, it } from "vitest";
import {
  DARK_SKY_SUN_ALTITUDE_DEG,
  MIN_VISIBLE_ALTITUDE_DEG,
  angularSeparationDeg,
  daysSinceJ2000,
  deviceViewAltitude,
  equatorialToHorizontal,
  greenwichSiderealTimeHours,
  isDarkEnough,
  julianDay,
  localSiderealTimeHours,
  nightReferenceTime,
  objectInView,
  planetEquatorial,
  skyObjectPosition,
  skyObjects,
  skyObjectsAt,
  sunEquatorial,
  sunHorizontal,
  visibleSkyObjects,
  type PlanetId,
} from "@shared/skyPosition";
import { getSunPosition } from "../client/src/lib/sun";
import { natureEntries } from "../client/src/data/nature";

/** Bern, Schweiz – Referenzort für die meisten Prüfungen. */
const BERN = { lat: 46.948, lon: 7.447 };

describe("Julianisches Datum und Sternzeit", () => {
  it("kennt die Epoche J2000.0", () => {
    const j2000 = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
    expect(julianDay(j2000)).toBeCloseTo(2451545, 6);
    expect(daysSinceJ2000(j2000)).toBeCloseTo(0, 6);
  });

  it("liefert die bekannte Greenwich-Sternzeit zur Epoche J2000.0", () => {
    // GMST(J2000.0) = 280.46061837° = 18h 41m 50.5s
    const gmst = greenwichSiderealTimeHours(
      new Date(Date.UTC(2000, 0, 1, 12, 0, 0))
    );
    expect(gmst).toBeCloseTo(18.697374, 4);
  });

  it("verschiebt die Ortssternzeit um eine Stunde pro 15° Länge", () => {
    const when = new Date(Date.UTC(2026, 7, 3, 21, 0, 0));
    const greenwich = localSiderealTimeHours(when, 0);
    const east = localSiderealTimeHours(when, 15);
    expect((east - greenwich + 24) % 24).toBeCloseTo(1, 6);
  });

  it("läuft pro Sonnentag knapp vier Minuten vor", () => {
    const day1 = new Date(Date.UTC(2026, 7, 3, 22, 0, 0));
    const day2 = new Date(Date.UTC(2026, 7, 4, 22, 0, 0));
    const advanceMinutes =
      (((greenwichSiderealTimeHours(day2) - greenwichSiderealTimeHours(day1)) %
        24) +
        24) %
      24;
    expect(advanceMinutes * 60).toBeCloseTo(3.94, 1);
  });
});

describe("equatorialToHorizontal", () => {
  it("stellt den Polarstern auf die geografische Breite", () => {
    // Der Polarstern steht rund 0.74° neben dem Himmelspol – seine Höhe
    // entspricht deshalb auf weniger als ein Grad genau der Breite.
    const polaris = skyObjects.find(o => o.id === "polarstern")!;
    const places = [
      { lat: 46.948, lon: 7.447 }, // Bern
      { lat: 60, lon: 25 }, // Helsinki
      { lat: 20, lon: -99 }, // Mexiko-Stadt
    ];
    const hours = [0, 4, 9, 13, 18, 22];
    places.forEach(place => {
      hours.forEach(hour => {
        const when = new Date(Date.UTC(2026, 5, 21, hour, 0, 0));
        const pos = equatorialToHorizontal(
          polaris.raHours!,
          polaris.decDeg!,
          place.lat,
          place.lon,
          when
        );
        expect(Math.abs(pos.altitude - place.lat)).toBeLessThan(0.8);
        // … und immer im Norden (Azimut nahe 0° bzw. 360°)
        const fromNorth = Math.min(pos.azimuth, 360 - pos.azimuth);
        expect(fromNorth).toBeLessThan(2);
      });
    });
  });

  it("setzt ein Objekt im Meridian mit passender Deklination in den Zenit", () => {
    const when = new Date(Date.UTC(2026, 7, 3, 22, 0, 0));
    const ra = localSiderealTimeHours(when, BERN.lon);
    const pos = equatorialToHorizontal(ra, BERN.lat, BERN.lat, BERN.lon, when);
    expect(pos.altitude).toBeGreaterThan(89.9);
  });

  it("stellt ein südlicheres Objekt im Meridian genau in den Süden", () => {
    const when = new Date(Date.UTC(2026, 7, 3, 22, 0, 0));
    const ra = localSiderealTimeHours(when, BERN.lon);
    const pos = equatorialToHorizontal(ra, 0, BERN.lat, BERN.lon, when);
    expect(pos.azimuth).toBeCloseTo(180, 3);
    expect(pos.altitude).toBeCloseTo(90 - BERN.lat, 3);
  });

  it("lässt zirkumpolare Objekte nie untergehen, andere schon", () => {
    const grosserWagen = skyObjects.find(o => o.id === "grosser-wagen")!;
    const orion = skyObjects.find(o => o.id === "orion")!;
    const altitudes = (raHours: number, decDeg: number) =>
      [0, 3, 6, 9, 12, 15, 18, 21].map(
        hour =>
          equatorialToHorizontal(
            raHours,
            decDeg,
            BERN.lat,
            BERN.lon,
            new Date(Date.UTC(2026, 0, 15, hour, 0, 0))
          ).altitude
      );
    // Grosser Wagen: von Bern aus zirkumpolar
    expect(
      Math.min(...altitudes(grosserWagen.raHours!, grosserWagen.decDeg!))
    ).toBeGreaterThan(0);
    // Orion steht auf dem Himmelsäquator – geht auf und unter
    const orionAltitudes = altitudes(orion.raHours!, orion.decDeg!);
    expect(Math.min(...orionAltitudes)).toBeLessThan(0);
    expect(Math.max(...orionAltitudes)).toBeGreaterThan(0);
  });
});

describe("angularSeparationDeg", () => {
  it("misst 0° für dieselbe Richtung", () => {
    expect(
      angularSeparationDeg(
        { azimuth: 123, altitude: 45 },
        { azimuth: 123, altitude: 45 }
      )
    ).toBeCloseTo(0, 6);
  });

  it("misst den Höhenunterschied bei gleichem Azimut", () => {
    expect(
      angularSeparationDeg(
        { azimuth: 90, altitude: 10 },
        { azimuth: 90, altitude: 40 }
      )
    ).toBeCloseTo(30, 6);
  });

  it("rechnet am Zenit richtig", () => {
    // Vom Zenit aus ist jeder Horizontpunkt 90° entfernt
    expect(
      angularSeparationDeg(
        { azimuth: 0, altitude: 90 },
        { azimuth: 200, altitude: 0 }
      )
    ).toBeCloseTo(90, 6);
  });

  it("verkraftet den Umschlag bei 0°/360°", () => {
    expect(
      angularSeparationDeg(
        { azimuth: 359, altitude: 0 },
        { azimuth: 1, altitude: 0 }
      )
    ).toBeCloseTo(2, 6);
  });
});

describe("deviceViewAltitude", () => {
  it("zeigt flach liegend zum Boden und flach umgedreht zum Zenit", () => {
    expect(deviceViewAltitude(0, 0)).toBeCloseTo(-90, 6);
    expect(deviceViewAltitude(180, 0)).toBeCloseTo(90, 6);
  });

  it("zeigt senkrecht gehalten zum Horizont", () => {
    expect(deviceViewAltitude(90, 0)).toBeCloseTo(0, 6);
  });

  it("rechnet Zwischenneigungen linear in die Höhe um", () => {
    expect(deviceViewAltitude(150, 0)).toBeCloseTo(60, 6);
    expect(deviceViewAltitude(120, 0)).toBeCloseTo(30, 6);
  });

  it("verkraftet das Querformat (gamma ±90)", () => {
    expect(deviceViewAltitude(0, 90)).toBeCloseTo(0, 6);
    expect(deviceViewAltitude(0, -90)).toBeCloseTo(0, 6);
  });

  it("bleibt immer im Bereich −90 bis 90", () => {
    for (let beta = -180; beta <= 180; beta += 7) {
      for (let gamma = -90; gamma <= 90; gamma += 9) {
        const altitude = deviceViewAltitude(beta, gamma);
        expect(altitude).toBeGreaterThanOrEqual(-90);
        expect(altitude).toBeLessThanOrEqual(90);
      }
    }
  });
});

describe("Sonne", () => {
  it("stimmt mit der unabhängigen Sonnenrechnung des Sonnen-Kompasses überein", () => {
    // Zwei völlig verschiedene Verfahren (Bahnelemente hier, NOAA-Näherung
    // dort) müssen dasselbe liefern – das prüft beide Seiten. Die zugelassene
    // Abweichung von 0.8° kommt fast ganz aus der Sternzeit-Konstante der
    // SunCalc-Näherung (280.16° statt 280.46°), also aus rund 0.3°
    // Stundenwinkel; für die Blickrichtung ist das ohne Belang.
    const moments = [
      new Date(Date.UTC(2026, 0, 15, 11, 0, 0)),
      new Date(Date.UTC(2026, 3, 2, 6, 30, 0)),
      new Date(Date.UTC(2026, 6, 21, 16, 0, 0)),
      new Date(Date.UTC(2026, 9, 8, 9, 15, 0)),
    ];
    moments.forEach(when => {
      const own = sunHorizontal(when, BERN.lat, BERN.lon);
      const reference = getSunPosition(when, BERN.lat, BERN.lon);
      expect(Math.abs(own.altitude - reference.altitude)).toBeLessThan(0.8);
      const azDiff = Math.abs(
        ((own.azimuth - reference.azimuth + 540) % 360) - 180
      );
      expect(azDiff).toBeLessThan(0.8);
    });
  });

  it("hält die Erdbahn-Entfernung zwischen Perihel und Aphel", () => {
    const distances = [0, 3, 6, 9].map(
      month => sunEquatorial(new Date(Date.UTC(2026, month, 5))).distanceAu!
    );
    distances.forEach(distance => {
      expect(distance).toBeGreaterThan(0.98);
      expect(distance).toBeLessThan(1.02);
    });
    // Anfang Januar ist die Erde der Sonne am nächsten
    expect(distances[0]).toBeLessThan(distances[2]);
  });

  it("erkennt Tag und Nacht", () => {
    expect(
      isDarkEnough(
        new Date(Date.UTC(2026, 6, 15, 12, 0, 0)),
        BERN.lat,
        BERN.lon
      )
    ).toBe(false);
    expect(
      isDarkEnough(
        new Date(Date.UTC(2026, 0, 15, 22, 0, 0)),
        BERN.lat,
        BERN.lon
      )
    ).toBe(true);
    expect(DARK_SKY_SUN_ALTITUDE_DEG).toBeLessThan(0);
  });
});

describe("planetEquatorial", () => {
  /** Winkelabstand eines Planeten von der Sonne (Elongation) in Grad. */
  function elongationDeg(planet: PlanetId, when: Date): number {
    const body = planetEquatorial(planet, when);
    const sun = sunEquatorial(when);
    const toVector = (raHours: number, decDeg: number) => {
      const ra = raHours * 15 * (Math.PI / 180);
      const dec = decDeg * (Math.PI / 180);
      return [
        Math.cos(dec) * Math.cos(ra),
        Math.cos(dec) * Math.sin(ra),
        Math.sin(dec),
      ];
    };
    const a = toVector(body.raHours, body.decDeg);
    const b = toVector(sun.raHours, sun.decDeg);
    const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    return (Math.acos(Math.min(1, Math.max(-1, dot))) * 180) / Math.PI;
  }

  const sampleDates = Array.from(
    { length: 24 },
    (_, i) => new Date(Date.UTC(2026, 0, 1 + i * 30, 0, 0, 0))
  );

  it("hält die inneren Planeten in ihrem Elongationsbereich", () => {
    // Merkur entfernt sich nie weiter als rund 28° von der Sonne, Venus
    // nie weiter als rund 47° – das ist die schärfste Probe für die Rechnung.
    sampleDates.forEach(when => {
      expect(elongationDeg("merkur", when)).toBeLessThan(29);
      expect(elongationDeg("venus", when)).toBeLessThan(48);
    });
    // … und beide erreichen ihre grössten Abstände auch tatsächlich
    expect(
      Math.max(...sampleDates.map(d => elongationDeg("merkur", d)))
    ).toBeGreaterThan(15);
    expect(
      Math.max(...sampleDates.map(d => elongationDeg("venus", d)))
    ).toBeGreaterThan(35);
  });

  it("hält die Erdabstände in den bekannten Grenzen", () => {
    const ranges: Record<PlanetId, [number, number]> = {
      merkur: [0.5, 1.5],
      venus: [0.25, 1.75],
      mars: [0.36, 2.7],
      jupiter: [3.9, 6.5],
      saturn: [7.9, 11.2],
    };
    (Object.keys(ranges) as PlanetId[]).forEach(planet => {
      sampleDates.forEach(when => {
        const distance = planetEquatorial(planet, when).distanceAu!;
        expect(distance).toBeGreaterThan(ranges[planet][0]);
        expect(distance).toBeLessThan(ranges[planet][1]);
      });
    });
  });

  it("lässt Jupiter pro Jahr rund ein Tierkreiszeichen weiterwandern", () => {
    const start = planetEquatorial("jupiter", new Date(Date.UTC(2026, 0, 1)));
    const later = planetEquatorial("jupiter", new Date(Date.UTC(2027, 0, 1)));
    const advanceDeg = ((later.raHours - start.raHours) * 15 + 360) % 360;
    expect(advanceDeg).toBeGreaterThan(20);
    expect(advanceDeg).toBeLessThan(40);
  });

  it("hält die Planeten nahe der Ekliptik", () => {
    // Alle grossen Planeten laufen im Tierkreis – ihre Deklination bleibt
    // deshalb im Bereich der Ekliptik plus Bahnneigung.
    (["venus", "mars", "jupiter", "saturn"] as PlanetId[]).forEach(planet => {
      sampleDates.forEach(when => {
        expect(Math.abs(planetEquatorial(planet, when).decDeg)).toBeLessThan(
          29
        );
      });
    });
  });
});

describe("Objektkatalog", () => {
  it("hat eindeutige Ids und gültige Koordinaten", () => {
    const ids = skyObjects.map(o => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    skyObjects.forEach(object => {
      if (object.planet) {
        expect(object.raHours).toBeUndefined();
        return;
      }
      expect(object.raHours).toBeGreaterThanOrEqual(0);
      expect(object.raHours).toBeLessThan(24);
      expect(Math.abs(object.decDeg!)).toBeLessThanOrEqual(90);
    });
  });

  it("verweist nur auf vorhandene Lexikon-Einträge", () => {
    const lexiconIds = natureEntries.map(e => e.id);
    const linked = skyObjects.filter(o => o.natureEntryId);
    expect(linked.length).toBeGreaterThanOrEqual(7);
    linked.forEach(object => {
      expect(lexiconIds).toContain(object.natureEntryId);
    });
  });

  it("führt alle Sternbilder des Lexikons", () => {
    const finderIds = skyObjects.map(o => o.natureEntryId);
    natureEntries
      .filter(e => e.category === "sternbilder")
      .forEach(entry => expect(finderIds).toContain(entry.id));
  });

  it("hat für jedes Objekt eine Erkennungshilfe in allen vier Sprachen", () => {
    skyObjects.forEach(object => {
      (["de", "fr", "it", "en"] as const).forEach(lang => {
        expect(object.name[lang].length).toBeGreaterThan(0);
        expect(object.hint[lang].length).toBeGreaterThan(10);
      });
    });
  });
});

describe("skyObjectsAt / visibleSkyObjects", () => {
  it("sortiert absteigend nach Höhe und deckt den ganzen Katalog ab", () => {
    const all = skyObjectsAt(
      new Date(Date.UTC(2026, 7, 3, 22, 0, 0)),
      BERN.lat,
      BERN.lon
    );
    expect(all).toHaveLength(skyObjects.length);
    for (let i = 1; i < all.length; i++) {
      expect(all[i].position.altitude).toBeLessThanOrEqual(
        all[i - 1].position.altitude
      );
    }
  });

  it("liefert nur Objekte über der Mindesthöhe", () => {
    const visible = visibleSkyObjects(
      new Date(Date.UTC(2026, 7, 3, 22, 0, 0)),
      BERN.lat,
      BERN.lon
    );
    visible.forEach(sighting =>
      expect(sighting.position.altitude).toBeGreaterThanOrEqual(
        MIN_VISIBLE_ALTITUDE_DEG
      )
    );
    expect(visible.length).toBeGreaterThan(0);
  });

  it("zeigt das Sommerdreieck im August und den Orion im Januar", () => {
    const augustNight = new Date(Date.UTC(2026, 7, 3, 22, 0, 0));
    const januaryNight = new Date(Date.UTC(2026, 0, 15, 22, 0, 0));
    const idsAt = (when: Date) =>
      visibleSkyObjects(when, BERN.lat, BERN.lon).map(s => s.object.id);
    expect(idsAt(augustNight)).toContain("sommerdreieck");
    expect(idsAt(augustNight)).not.toContain("orion");
    expect(idsAt(januaryNight)).toContain("orion");
    // Der Polarstern steht in Bern immer – zu jeder Stunde des Jahres
    expect(idsAt(augustNight)).toContain("polarstern");
    expect(idsAt(januaryNight)).toContain("polarstern");
  });

  it("bewegt Planeten, während die Sternbilder fest stehen", () => {
    const jupiter = skyObjects.find(o => o.id === "jupiter")!;
    const orion = skyObjects.find(o => o.id === "orion")!;
    const early = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
    const late = new Date(Date.UTC(2027, 0, 1, 0, 0, 0));
    // Gleiche Sternzeit-Phase, ein Jahr später: der Fixstern steht praktisch
    // gleich, der Planet ist deutlich weitergewandert.
    const orionShift = Math.abs(
      skyObjectPosition(orion, early, BERN.lat, BERN.lon).altitude -
        skyObjectPosition(orion, late, BERN.lat, BERN.lon).altitude
    );
    const jupiterShift = Math.abs(
      skyObjectPosition(jupiter, early, BERN.lat, BERN.lon).altitude -
        skyObjectPosition(jupiter, late, BERN.lat, BERN.lon).altitude
    );
    expect(orionShift).toBeLessThan(0.5);
    expect(jupiterShift).toBeGreaterThan(3);
  });
});

describe("objectInView", () => {
  const when = new Date(Date.UTC(2026, 7, 3, 22, 0, 0));
  const sightings = skyObjectsAt(when, BERN.lat, BERN.lon);

  it("findet das angepeilte Objekt genau in seiner Richtung", () => {
    const target = sightings.find(s => s.object.id === "sommerdreieck")!;
    const hit = objectInView(
      sightings,
      target.position.azimuth,
      target.position.altitude
    );
    expect(hit?.sighting.object.id).toBe("sommerdreieck");
    expect(hit?.separationDeg).toBeCloseTo(0, 6);
  });

  it("liefert nichts, wenn nichts im Sichtfeld liegt", () => {
    // Blick auf den Boden: dort steht per Definition kein Objekt
    expect(objectInView(sightings, 0, -80)).toBeNull();
  });

  it("hält sich an die Toleranz", () => {
    const target = sightings.find(s => s.object.id === "polarstern")!;
    const offset = 12;
    expect(
      objectInView(
        sightings,
        target.position.azimuth,
        target.position.altitude - offset,
        5
      )
    ).toBeNull();
    expect(
      objectInView(
        sightings,
        target.position.azimuth,
        target.position.altitude - offset,
        20
      )
    ).not.toBeNull();
  });

  it("übergeht Objekte unter dem Horizont", () => {
    const below = sightings.filter(s => s.position.altitude < -20);
    expect(below.length).toBeGreaterThan(0);
    below.forEach(sighting => {
      const hit = objectInView(
        sightings,
        sighting.position.azimuth,
        sighting.position.altitude,
        5
      );
      expect(hit).toBeNull();
    });
  });

  it("wählt bei mehreren Treffern das nächstgelegene Objekt", () => {
    const above = sightings.filter(s => s.position.altitude > 20);
    expect(above.length).toBeGreaterThan(1);
    const first = above[0];
    const hit = objectInView(
      sightings,
      first.position.azimuth,
      first.position.altitude,
      90
    )!;
    const closest = above
      .map(s => ({
        id: s.object.id,
        separation: angularSeparationDeg(first.position, s.position),
      }))
      .sort((a, b) => a.separation - b.separation)[0];
    expect(hit.sighting.object.id).toBe(closest.id);
  });
});

describe("nightReferenceTime", () => {
  it("nimmt in der Nacht den Zeitpunkt selbst", () => {
    const lateEvening = new Date(2026, 7, 3, 22, 30, 0);
    expect(nightReferenceTime(lateEvening).getTime()).toBe(
      lateEvening.getTime()
    );
    const earlyMorning = new Date(2026, 7, 4, 3, 15, 0);
    expect(nightReferenceTime(earlyMorning).getTime()).toBe(
      earlyMorning.getTime()
    );
  });

  it("blickt tagsüber auf 23 Uhr desselben Tages voraus", () => {
    const afternoon = new Date(2026, 7, 3, 15, 0, 0);
    const reference = nightReferenceTime(afternoon);
    expect(reference.getFullYear()).toBe(2026);
    expect(reference.getMonth()).toBe(7);
    expect(reference.getDate()).toBe(3);
    expect(reference.getHours()).toBe(23);
    expect(reference.getMinutes()).toBe(0);
  });
});
